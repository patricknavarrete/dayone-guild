import os
import random
import secrets
import sqlite3
import subprocess
import time
from datetime import date, timedelta, datetime, timezone
from functools import wraps
from pathlib import Path

# Cache-busting version string: git commit hash, falls back to timestamp
try:
    _STATIC_VER = subprocess.check_output(
        ['git', 'rev-parse', '--short', 'HEAD'], stderr=subprocess.DEVNULL
    ).decode().strip()
except Exception:
    _STATIC_VER = str(int(time.time()))

from flask import (Flask, abort, flash, g, jsonify, redirect, render_template,
                   request, session, url_for)
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dayone-dev-secret-change-in-prod')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin1234')
DATABASE = '/data/dayone.db'
UPLOAD_FOLDER = os.path.join('static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024

app.config['UPLOAD_FOLDER']          = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH']     = MAX_CONTENT_LENGTH
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE']   = os.environ.get('FLASK_ENV') != 'development'

VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_PUBLIC_KEY  = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_CLAIMS      = {'sub': 'mailto:' + os.environ.get('MAIL_USERNAME', 'admin@dayone.guild')}

SUPPORT_JOBS = {'High Priest', 'Bard', 'Dancer', 'Summoner', 'Apprentice'}

PHT = timezone(timedelta(hours=8))
GL_EVENT_HOUR    = 20   # 8 PM PHT
GL_EVENT_MINUTE  = 55   # :55
WOE_EVENT_HOUR   = 20   # 8 PM PHT
WOE_EVENT_MINUTE = 55   # :55

# ── Brute-force tracking for admin login ──────────────────────────────────────

_admin_failed: dict[str, list[float]] = {}
_ADMIN_MAX_ATTEMPTS = 5
_ADMIN_LOCKOUT_SECS = 300  # 5 minutes


def _client_ip() -> str:
    return request.headers.get('X-Forwarded-For', request.remote_addr or '').split(',')[0].strip()


def _admin_is_locked(ip: str) -> bool:
    now = time.time()
    attempts = [t for t in _admin_failed.get(ip, []) if now - t < _ADMIN_LOCKOUT_SECS]
    _admin_failed[ip] = attempts
    return len(attempts) >= _ADMIN_MAX_ATTEMPTS


def _admin_record_failure(ip: str) -> None:
    _admin_failed.setdefault(ip, []).append(time.time())


def _admin_clear(ip: str) -> None:
    _admin_failed.pop(ip, None)


# ── General rate limiting ─────────────────────────────────────────────────────

_rate_limits: dict[str, list[float]] = {}

def _check_rate_limit(key: str, max_calls: int = 20, window_secs: int = 60) -> bool:
    now = time.time()
    calls = [t for t in _rate_limits.get(key, []) if now - t < window_secs]
    if len(calls) >= max_calls:
        return False
    calls.append(now)
    _rate_limits[key] = calls
    return True


# ── Security headers ──────────────────────────────────────────────────────────

@app.after_request
def _add_security_headers(response):
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: blob:; "
        "connect-src 'self'; "
        "worker-src 'self'; "
        "manifest-src 'self';"
    )
    response.headers.setdefault('Content-Security-Policy', csp)
    response.headers.setdefault('X-Content-Type-Options', 'nosniff')
    response.headers.setdefault('X-Frame-Options', 'SAMEORIGIN')
    response.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')
    return response


def _setup_uploads():
    data_dir = Path('/data')
    static_uploads = Path(UPLOAD_FOLDER)
    if data_dir.is_dir():
        persistent = data_dir / 'uploads'
        persistent.mkdir(parents=True, exist_ok=True)
        if static_uploads.is_symlink():
            if static_uploads.resolve() != persistent.resolve():
                static_uploads.unlink()
                static_uploads.symlink_to(persistent)
        elif static_uploads.is_dir():
            import shutil
            for f in static_uploads.iterdir():
                shutil.move(str(f), str(persistent / f.name))
            static_uploads.rmdir()
            static_uploads.symlink_to(persistent)
        else:
            static_uploads.symlink_to(persistent)
    else:
        static_uploads.mkdir(parents=True, exist_ok=True)

_setup_uploads()

# ── Mail config ───────────────────────────────────────────────────────────────
app.config['MAIL_SERVER']   = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT']     = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS']  = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get(
    'MAIL_DEFAULT_SENDER', os.environ.get('MAIL_USERNAME', 'noreply@dayone.guild')
)
mail = Mail(app)


def _coerce_date(d):
    if not d:
        return None
    if isinstance(d, str):
        for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%d'):
            try:
                return datetime.strptime(d[:len(fmt)], fmt)
            except ValueError:
                continue
        return None
    return d


@app.template_filter('fmtdate')
def fmtdate(d):
    d = _coerce_date(d)
    if not d:
        return ''
    return d.strftime('%A, %B ') + str(d.day) + d.strftime(', %Y')


@app.template_filter('fmtdate_noyear')
def fmtdate_noyear(d):
    d = _coerce_date(d)
    if not d:
        return ''
    return d.strftime('%A, %B ') + str(d.day)


@app.template_filter('fmtdate_mini')
def fmtdate_mini(d):
    d = _coerce_date(d)
    if not d:
        return ''
    return d.strftime('%b ') + str(d.day)


# ── CSRF protection ───────────────────────────────────────────────────────────

def _get_csrf_token() -> str:
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_hex(32)
    return session['csrf_token']


@app.context_processor
def _inject_globals():
    def ticker():
        try:
            db = get_db()
            return db.execute(
                "SELECT title FROM announcements WHERE is_active=1 AND is_ticker=1 ORDER BY is_pinned DESC, created_at DESC LIMIT 5"
            ).fetchall()
        except Exception:
            return []
    def recruit():
        try:
            return get_recruitment_status(get_db())
        except Exception:
            return 'open'
    def notif_count():
        mid = session.get('member_id')
        if not mid:
            return 0
        try:
            row = get_db().execute(
                "SELECT COUNT(*) as c FROM notifications WHERE member_id=? AND is_read=0", (mid,)
            ).fetchone()
            return row['c'] if row else 0
        except Exception:
            return 0
    return dict(csrf_token=_get_csrf_token, ticker_items=ticker,
                recruitment_status=recruit, notif_count=notif_count,
                vapid_public_key=VAPID_PUBLIC_KEY, static_ver=_STATIC_VER)


def csrf_protect(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'POST':
            token = session.get('csrf_token')
            # Support form POST and JSON (AJAX) requests
            if request.is_json:
                form_token = (request.get_json(silent=True) or {}).get('csrf_token')
            else:
                form_token = request.form.get('csrf_token')
            if not token or not form_token or not secrets.compare_digest(token, form_token):
                abort(403)
        return f(*args, **kwargs)
    return decorated


# ── Password reset tokens ─────────────────────────────────────────────────────

def _serializer():
    return URLSafeTimedSerializer(app.secret_key)

def generate_reset_token(email):
    return _serializer().dumps(email.lower(), salt='pw-reset')

def verify_reset_token(token, max_age=3600):
    try:
        return _serializer().loads(token, salt='pw-reset', max_age=max_age)
    except (SignatureExpired, BadSignature):
        return None


# ── Database ──────────────────────────────────────────────────────────────────

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        os.makedirs(os.path.dirname(DATABASE), exist_ok=True)
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def _migrate_db(db):
    migrations = [
        "ALTER TABLE gl_parties ADD COLUMN notes TEXT DEFAULT ''",
        "ALTER TABLE woe_parties ADD COLUMN notes TEXT DEFAULT ''",
        "ALTER TABLE attendance ADD COLUMN note TEXT DEFAULT ''",
        "ALTER TABLE woe_parties ADD COLUMN target_castle TEXT DEFAULT ''",
        """CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            link TEXT DEFAULT '',
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (member_id) REFERENCES members(id)
        )""",
        """CREATE TABLE IF NOT EXISTS push_subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER NOT NULL,
            endpoint TEXT NOT NULL,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(endpoint)
        )""",
        """CREATE TABLE IF NOT EXISTS push_notification_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            event_date TEXT NOT NULL,
            window_label TEXT NOT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(event_type, event_date, window_label)
        )""",
    ]
    for sql in migrations:
        try:
            db.execute(sql)
        except sqlite3.OperationalError:
            pass
    db.commit()


def init_db():
    db = get_db()
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    with open(schema_path, 'r', encoding='utf-8') as f:
        db.executescript(f.read())
    db.commit()
    _migrate_db(db)


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_recruitment_status(db):
    row = db.execute("SELECT value FROM settings WHERE key='recruitment'").fetchone()
    return row['value'] if row else 'open'


def get_attendance_rate(db, member_id, weeks=4):
    today = datetime.now(PHT).date()
    cutoff = today - timedelta(weeks=weeks)
    rows = db.execute(
        "SELECT status FROM attendance WHERE member_id=? AND event_date >= ?",
        (member_id, str(cutoff))
    ).fetchall()
    total = len(rows)
    attended = sum(1 for r in rows if r['status'] == 'attending')
    pct = round(attended / total * 100) if total else 0
    return {'attended': attended, 'total': total, 'pct': pct}


def create_notification(db, member_id, message, link=''):
    try:
        db.execute(
            "INSERT INTO notifications (member_id, message, link) VALUES (?,?,?)",
            (member_id, message, link)
        )
    except Exception:
        pass


def notify_all_members(db, message, link=''):
    members = db.execute("SELECT id FROM members WHERE status='approved'").fetchall()
    for m in members:
        create_notification(db, m['id'], message, link)


def get_activity_badge(db, member_id):
    today = datetime.now(PHT).date()
    recent = db.execute(
        "SELECT COUNT(*) as c FROM attendance WHERE member_id=? AND event_date >= ? AND status='attending'",
        (member_id, str(today - timedelta(days=14)))
    ).fetchone()['c']
    if recent > 0:
        return 'active'
    any_recent = db.execute(
        "SELECT COUNT(*) as c FROM attendance WHERE member_id=? AND event_date >= ?",
        (member_id, str(today - timedelta(days=30)))
    ).fetchone()['c']
    return 'away' if any_recent > 0 else 'inactive'


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_upload(field_name):
    if field_name not in request.files:
        return None
    f = request.files[field_name]
    if not f or f.filename == '':
        return None
    if not allowed_file(f.filename):
        return None
    stem = f"{field_name}_{int(datetime.now(timezone.utc).timestamp())}_{random.randint(1000,9999)}"
    raw = f.read()
    try:
        from PIL import Image
        import io as _io
        img = Image.open(_io.BytesIO(raw))
        img.thumbnail((900, 900), Image.LANCZOS)
        unique_name = f"{stem}.webp"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
        img.save(filepath, 'WEBP', quality=85)
    except Exception:
        ext = f.filename.rsplit('.', 1)[1].lower()
        unique_name = f"{stem}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
        with open(filepath, 'wb') as fh:
            fh.write(raw)
    return f"uploads/{unique_name}"


def is_support(job):
    return job in SUPPORT_JOBS


def get_next_event_dates():
    today = datetime.now(PHT).date()
    gl_next = None
    woe_next = None
    for delta in range(8):
        d = today + timedelta(days=delta)
        wd = d.weekday()
        if wd in (1, 3) and gl_next is None:
            gl_next = d
        if wd == 6 and woe_next is None:
            woe_next = d
        if gl_next and woe_next:
            break
    gl_dt = datetime(gl_next.year, gl_next.month, gl_next.day,
                     GL_EVENT_HOUR, GL_EVENT_MINUTE, 0, tzinfo=PHT) if gl_next else None
    woe_dt = datetime(woe_next.year, woe_next.month, woe_next.day,
                      WOE_EVENT_HOUR, WOE_EVENT_MINUTE, 0, tzinfo=PHT) if woe_next else None
    return {
        'gl_next':    gl_next,
        'woe_next':   woe_next,
        'gl_dt_iso':  gl_dt.isoformat() if gl_dt else None,
        'woe_dt_iso': woe_dt.isoformat() if woe_dt else None,
    }


def get_attendance(member_id, event_type, event_date):
    if not event_date:
        return None
    db = get_db()
    row = db.execute(
        "SELECT status FROM attendance WHERE member_id=? AND event_type=? AND event_date=?",
        (member_id, event_type, str(event_date))
    ).fetchone()
    return row['status'] if row else None


# ── Decorators ────────────────────────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'member_id' not in session:
            flash('Please log in to access that page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('is_admin'):
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated


# ── Public Routes ─────────────────────────────────────────────────────────────

@app.route('/')
def index():
    if 'member_id' in session:
        return redirect(url_for('home'))
    return redirect(url_for('login'))


@app.route('/home')
@login_required
def home():
    db  = get_db()
    mid = session['member_id']
    events  = get_next_event_dates()
    gl_att  = get_attendance(mid, 'guild_league', events['gl_next'])
    woe_att = get_attendance(mid, 'woe', events['woe_next'])

    gl_party_row = db.execute(
        """SELECT p.id, p.name, p.is_sub
           FROM gl_party_members pm
           JOIN gl_parties p ON p.id = pm.party_id
           WHERE pm.member_id = ?""", (mid,)
    ).fetchone()
    gl_party_members = []
    if gl_party_row:
        rows = db.execute(
            """SELECT m.name, m.job FROM gl_party_members pm
               JOIN members m ON m.id = pm.member_id
               WHERE pm.party_id = ? AND m.status='approved'""",
            (gl_party_row['id'],)
        ).fetchall()
        gl_party_members = [dict(r) for r in rows]

    woe_party_row = db.execute(
        """SELECT p.id, p.name, p.target_castle
           FROM woe_party_members pm
           JOIN woe_parties p ON p.id = pm.party_id
           WHERE pm.member_id = ?""", (mid,)
    ).fetchone()
    woe_party_members = []
    if woe_party_row:
        rows = db.execute(
            """SELECT m.name, m.job FROM woe_party_members pm
               JOIN members m ON m.id = pm.member_id
               WHERE pm.party_id = ? AND m.status='approved'""",
            (woe_party_row['id'],)
        ).fetchall()
        woe_party_members = [dict(r) for r in rows]

    announcements = db.execute(
        "SELECT * FROM announcements WHERE is_active=1 ORDER BY is_pinned DESC, created_at DESC LIMIT 6"
    ).fetchall()

    att_rate_data = get_attendance_rate(db, mid)
    att_rate = att_rate_data['pct']
    member   = db.execute("SELECT name, job, photo_path, power FROM members WHERE id=?", (mid,)).fetchone()

    return render_template('home.html',
        events=events, gl_att=gl_att, woe_att=woe_att,
        gl_party=gl_party_row, gl_party_members=gl_party_members,
        woe_party=woe_party_row, woe_party_members=woe_party_members,
        announcements=announcements, att_rate=att_rate, member=member,
    )


@app.route('/register', methods=['GET', 'POST'])
@csrf_protect
def register():
    if request.method == 'POST':
        expected = session.get('captcha_answer')
        provided = request.form.get('captcha', '').strip()
        if str(expected) != provided:
            flash('Wrong answer to the math question.', 'error')
            return redirect(url_for('register'))

        username  = request.form.get('username', '').strip()
        password  = request.form.get('password', '').strip()
        confirm   = request.form.get('confirm_password', '').strip()
        email     = request.form.get('email', '').strip().lower()
        name      = request.form.get('name', '').strip()
        job       = request.form.get('job', '').strip()
        power_raw = request.form.get('power', '0').strip()
        notes     = request.form.get('notes', '').strip()

        if not all([username, password, confirm, email, name, job, power_raw]):
            flash('Please fill in all required fields.', 'error')
            return redirect(url_for('register'))

        if password != confirm:
            flash('Passwords do not match.', 'error')
            return redirect(url_for('register'))

        if len(password) < 6:
            flash('Password must be at least 6 characters.', 'error')
            return redirect(url_for('register'))

        try:
            power = int(power_raw)
        except ValueError:
            flash('Power must be a whole number.', 'error')
            return redirect(url_for('register'))

        db = get_db()
        if db.execute("SELECT id FROM members WHERE username=?", (username,)).fetchone():
            flash('Username already taken.', 'error')
            return redirect(url_for('register'))

        if db.execute("SELECT id FROM members WHERE LOWER(email)=?", (email,)).fetchone():
            flash('An account with that email already exists.', 'error')
            return redirect(url_for('register'))

        if db.execute("SELECT id FROM members WHERE LOWER(name)=?", (name.lower(),)).fetchone():
            flash('A member with that character name already exists.', 'error')
            return redirect(url_for('register'))

        photo_path = save_upload('photo')
        power_ss   = save_upload('power_screenshot')
        equip_ss   = save_upload('equipment_screenshot')
        quasi_ss   = save_upload('quasi_stats_screenshot')

        db.execute(
            """INSERT INTO members
               (username, password_hash, email, name, job, photo_path, power,
                power_screenshot_path, equipment_screenshot_path,
                quasi_stats_screenshot_path, notes, status)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending')""",
            (username, generate_password_hash(password), email, name, job,
             photo_path, power, power_ss, equip_ss, quasi_ss, notes)
        )
        db.commit()
        flash('Registration submitted! Please wait for admin approval before logging in.', 'success')
        return redirect(url_for('login'))

    a, b = random.randint(1, 12), random.randint(1, 12)
    session['captcha_answer'] = a + b
    recruit = get_recruitment_status(get_db())
    return render_template('register.html', captcha_q=f"{a} + {b}", recruitment=recruit)


@app.route('/login', methods=['GET', 'POST'])
@csrf_protect
def login():
    if 'member_id' in session:
        return redirect(url_for('home'))
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        db = get_db()
        member = db.execute("SELECT * FROM members WHERE username=?", (username,)).fetchone()
        if not member or not check_password_hash(member['password_hash'], password):
            flash('Invalid username or password.', 'error')
            return render_template('login.html')
        if member['status'] == 'pending':
            flash('Your account is pending admin approval. Please check back later.', 'warning')
            return render_template('login.html')
        if member['status'] == 'rejected':
            reason = member['rejection_reason'] or 'No reason given.'
            flash(f'Your account was rejected: {reason}', 'error')
            return render_template('login.html')
        session['member_id'] = member['id']
        session['member_name'] = member['name']
        return redirect(url_for('home'))
    db = get_db()
    recruit = get_recruitment_status(db)
    return render_template('login.html', recruitment=recruit)


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


@app.route('/forgot-password', methods=['GET', 'POST'])
@csrf_protect
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        if email:
            db = get_db()
            member = db.execute(
                "SELECT * FROM members WHERE LOWER(email)=?", (email,)
            ).fetchone()
            if member and member['status'] == 'approved':
                token = generate_reset_token(email)
                reset_url = url_for('reset_password', token=token, _external=True)
                try:
                    msg = Message(
                        subject='DayOne Guild — Password Reset',
                        recipients=[email]
                    )
                    msg.body = (
                        f"Hello {member['name']},\n\n"
                        f"You requested a password reset for your DayOne Guild account.\n\n"
                        f"Reset link (valid for 1 hour):\n{reset_url}\n\n"
                        f"If you did not request this, ignore this email.\n\n— DayOne Guild"
                    )
                    msg.html = f"""
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border:1px solid #e6ddd0;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#140c0c,#2d1212);padding:28px 32px;text-align:center;border-bottom:3px solid #c91f1f;">
    <div style="font-family:'Arial Black',Arial,sans-serif;font-size:28px;font-weight:900;color:#d4af37;letter-spacing:6px;">DAYONE</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:3px;text-transform:uppercase;margin-top:4px;">Guild Management</div>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:20px;color:#1c1710;margin:0 0 12px;">Password Reset Request</h2>
    <p style="color:#7a6d60;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Hi <strong style="color:#1c1710;">{member['name']}</strong>,<br>
      We received a request to reset your DayOne Guild account password.
      Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{reset_url}" style="display:inline-block;background:#c91f1f;color:#fff;font-weight:700;font-size:15px;padding:13px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">Reset My Password</a>
    </div>
    <p style="color:#9ca3af;font-size:12px;line-height:1.5;border-top:1px solid #e6ddd0;padding-top:16px;margin:0;">
      If the button doesn't work, copy and paste this link:<br>
      <a href="{reset_url}" style="color:#a87418;word-break:break-all;">{reset_url}</a>
    </p>
    <p style="color:#9ca3af;font-size:12px;margin:12px 0 0;">If you didn't request this, you can safely ignore this email.</p>
  </div>
</div>"""
                    mail.send(msg)
                except Exception as e:
                    app.logger.error(f"Password reset email failed: {e}")
                    flash('Could not send email. Please contact the admin.', 'error')
                    return render_template('forgot_password.html')
        flash('If that email is registered and approved, a reset link has been sent.', 'info')
        return redirect(url_for('login'))
    return render_template('forgot_password.html')


@app.route('/reset-password/<token>', methods=['GET', 'POST'])
@csrf_protect
def reset_password(token):
    email = verify_reset_token(token)
    if not email:
        flash('This reset link is invalid or has expired. Please request a new one.', 'error')
        return redirect(url_for('forgot_password'))

    if request.method == 'POST':
        password = request.form.get('password', '').strip()
        confirm  = request.form.get('confirm_password', '').strip()

        if len(password) < 6:
            flash('Password must be at least 6 characters.', 'error')
            return render_template('reset_password.html', token=token)
        if password != confirm:
            flash('Passwords do not match.', 'error')
            return render_template('reset_password.html', token=token)

        db = get_db()
        db.execute(
            "UPDATE members SET password_hash=? WHERE LOWER(email)=?",
            (generate_password_hash(password), email)
        )
        db.commit()
        flash('Password reset successfully! You can now log in.', 'success')
        return redirect(url_for('login'))

    return render_template('reset_password.html', token=token)


# ── Officers ──────────────────────────────────────────────────────────────────

RANK_ORDER = ['Guild Master', 'Vice Leader', 'Officer', 'Commander']

@app.route('/officers')
@login_required
def officers():
    db = get_db()
    rows = db.execute(
        """SELECT o.id, o.rank, o.sort_order,
                  m.name, m.job, m.photo_path
           FROM officers o
           JOIN members m ON m.id = o.member_id
           WHERE m.status = 'approved'
           ORDER BY o.sort_order, o.created_at""",
    ).fetchall()
    grouped = {r: [] for r in RANK_ORDER}
    for row in rows:
        if row['rank'] in grouped:
            grouped[row['rank']].append(row)
    return render_template('officers.html', grouped=grouped, rank_order=RANK_ORDER)


# ── Member Routes ─────────────────────────────────────────────────────────────

@app.route('/roster')
@login_required
def roster():
    db = get_db()
    raw_members = db.execute(
        "SELECT id, name, job, photo_path, notes FROM members WHERE status='approved' ORDER BY name"
    ).fetchall()
    members = []
    for m in raw_members:
        members.append({
            'id': m['id'], 'name': m['name'], 'job': m['job'],
            'photo_path': m['photo_path'], 'notes': m['notes'],
            'badge': get_activity_badge(db, m['id'])
        })
    events = get_next_event_dates()
    mid = session['member_id']
    gl_att  = get_attendance(mid, 'guild_league', events['gl_next'])
    woe_att = get_attendance(mid, 'woe', events['woe_next'])
    announcements = db.execute(
        "SELECT * FROM announcements WHERE is_active=1 ORDER BY is_pinned DESC, created_at DESC LIMIT 5"
    ).fetchall()
    return render_template('roster.html', members=members, events=events,
                           gl_att=gl_att, woe_att=woe_att, announcements=announcements)


@app.route('/guild-league')
@login_required
def guild_league():
    db = get_db()
    events  = get_next_event_dates()
    next_gl = events['gl_next']
    mid     = session['member_id']
    gl_att  = get_attendance(mid, 'guild_league', next_gl)

    parties_raw = db.execute(
        "SELECT * FROM gl_parties ORDER BY is_sub ASC, sort_order ASC, id ASC"
    ).fetchall()

    parties = []
    for p in parties_raw:
        rows = db.execute(
            """SELECT m.id, m.name, m.job, m.photo_path
               FROM gl_party_members pm
               JOIN members m ON m.id=pm.member_id
               WHERE pm.party_id=? AND m.status='approved'""",
            (p['id'],)
        ).fetchall()
        members = [{
            'id': r['id'], 'name': r['name'], 'job': r['job'],
            'photo_path': r['photo_path'],
            'attendance': get_attendance(r['id'], 'guild_league', next_gl),
            'is_support': is_support(r['job'])
        } for r in rows]
        parties.append({'id': p['id'], 'name': p['name'], 'is_sub': p['is_sub'], 'members': members, 'notes': p['notes'] or ''})

    return render_template('guild_league.html', parties=parties,
                           next_gl=next_gl, gl_att=gl_att,
                           next_gl_iso=events['gl_dt_iso'])


@app.route('/woe')
@login_required
def woe():
    db = get_db()
    events   = get_next_event_dates()
    next_woe = events['woe_next']
    mid      = session['member_id']
    woe_att  = get_attendance(mid, 'woe', next_woe)

    parties_raw = db.execute(
        "SELECT * FROM woe_parties ORDER BY sort_order ASC, id ASC"
    ).fetchall()

    parties = []
    for p in parties_raw:
        rows = db.execute(
            """SELECT m.id, m.name, m.job, m.photo_path
               FROM woe_party_members pm
               JOIN members m ON m.id=pm.member_id
               WHERE pm.party_id=? AND m.status='approved'""",
            (p['id'],)
        ).fetchall()
        members = [{
            'id': r['id'], 'name': r['name'], 'job': r['job'],
            'photo_path': r['photo_path'],
            'attendance': get_attendance(r['id'], 'woe', next_woe),
            'is_support': is_support(r['job'])
        } for r in rows]
        parties.append({'id': p['id'], 'name': p['name'], 'members': members, 'notes': p['notes'] or '',
                        'target_castle': p['target_castle'] if p['target_castle'] else ''})

    return render_template('woe.html', parties=parties,
                           next_woe=next_woe, woe_att=woe_att,
                           next_woe_iso=events['woe_dt_iso'])


@app.route('/profile', methods=['GET', 'POST'])
@login_required
@csrf_protect
def profile():
    db  = get_db()
    mid = session['member_id']

    if request.method == 'POST':
        if not _check_rate_limit(f'profile:{mid}', max_calls=15, window_secs=60):
            flash('Too many requests. Please slow down.', 'error')
            return redirect(url_for('profile'))
        action = request.form.get('action', '')

        if action == 'update_free':
            name      = request.form.get('name', '').strip()
            notes     = request.form.get('notes', '').strip()
            photo_path = save_upload('photo')
            old_pw    = request.form.get('old_password', '').strip()
            new_pw    = request.form.get('new_password', '').strip()

            updates = {}
            if name:
                # Check duplicate name (exclude self)
                existing = db.execute(
                    "SELECT id FROM members WHERE LOWER(name)=? AND id!=?", (name.lower(), mid)
                ).fetchone()
                if existing:
                    flash('That character name is already taken.', 'error')
                    return redirect(url_for('profile'))
                updates['name'] = name
            updates['notes'] = notes
            if photo_path:
                updates['photo_path'] = photo_path

            if old_pw and new_pw:
                member = db.execute("SELECT password_hash FROM members WHERE id=?", (mid,)).fetchone()
                if not member:
                    flash('Member not found.', 'error')
                    return redirect(url_for('profile'))
                if not check_password_hash(member['password_hash'], old_pw):
                    flash('Current password is incorrect.', 'error')
                    return redirect(url_for('profile'))
                updates['password_hash'] = generate_password_hash(new_pw)

            if updates:
                cols = ', '.join(f"{k}=?" for k in updates)
                db.execute(f"UPDATE members SET {cols} WHERE id=?",
                           list(updates.values()) + [mid])
                db.commit()
                if 'name' in updates:
                    session['member_name'] = updates['name']
                flash('Profile updated.', 'success')

        elif action == 'update_power':
            new_power = request.form.get('power', '').strip()
            new_ss    = save_upload('power_screenshot')
            if not new_power or not new_ss:
                flash('Power update requires both a new power value and screenshot.', 'error')
                return redirect(url_for('profile'))
            try:
                new_power = int(new_power)
            except ValueError:
                flash('Power must be a whole number.', 'error')
                return redirect(url_for('profile'))
            if db.execute(
                "SELECT id FROM pending_updates WHERE member_id=? AND field_name='power' AND status='pending'",
                (mid,)
            ).fetchone():
                flash('You already have a pending power update.', 'warning')
                return redirect(url_for('profile'))
            member = db.execute("SELECT power, power_screenshot_path FROM members WHERE id=?", (mid,)).fetchone()
            if not member:
                flash('Member not found.', 'error')
                return redirect(url_for('profile'))
            db.execute(
                """INSERT INTO pending_updates
                   (member_id, field_name, old_value, new_value, old_screenshot, new_screenshot)
                   VALUES (?,?,?,?,?,?)""",
                (mid, 'power', str(member['power']), str(new_power),
                 member['power_screenshot_path'], new_ss)
            )
            db.commit()
            flash('Power update submitted for admin approval.', 'success')

        elif action == 'update_equipment':
            new_ss = save_upload('equipment_screenshot')
            if not new_ss:
                flash('Please upload a new equipment screenshot.', 'error')
                return redirect(url_for('profile'))
            if db.execute(
                "SELECT id FROM pending_updates WHERE member_id=? AND field_name='equipment' AND status='pending'",
                (mid,)
            ).fetchone():
                flash('You already have a pending equipment update.', 'warning')
                return redirect(url_for('profile'))
            member = db.execute("SELECT equipment_screenshot_path FROM members WHERE id=?", (mid,)).fetchone()
            if not member:
                flash('Member not found.', 'error')
                return redirect(url_for('profile'))
            db.execute(
                """INSERT INTO pending_updates
                   (member_id, field_name, old_value, new_value, old_screenshot, new_screenshot)
                   VALUES (?,?,?,?,?,?)""",
                (mid, 'equipment', '', '', member['equipment_screenshot_path'], new_ss)
            )
            db.commit()
            flash('Equipment update submitted for admin approval.', 'success')

        elif action == 'update_quasi_stats':
            new_ss = save_upload('quasi_stats_screenshot')
            if not new_ss:
                flash('Please upload a new Quasi Stats screenshot.', 'error')
                return redirect(url_for('profile'))
            if db.execute(
                "SELECT id FROM pending_updates WHERE member_id=? AND field_name='quasi_stats' AND status='pending'",
                (mid,)
            ).fetchone():
                flash('You already have a pending Quasi Stats update.', 'warning')
                return redirect(url_for('profile'))
            member = db.execute("SELECT quasi_stats_screenshot_path FROM members WHERE id=?", (mid,)).fetchone()
            if not member:
                flash('Member not found.', 'error')
                return redirect(url_for('profile'))
            db.execute(
                """INSERT INTO pending_updates
                   (member_id, field_name, old_value, new_value, old_screenshot, new_screenshot)
                   VALUES (?,?,?,?,?,?)""",
                (mid, 'quasi_stats', '', '', member['quasi_stats_screenshot_path'], new_ss)
            )
            db.commit()
            flash('Quasi Stats update submitted for admin approval.', 'success')

        elif action == 'update_job':
            new_job = request.form.get('job', '').strip()
            if not new_job:
                flash('Please enter a new job.', 'error')
                return redirect(url_for('profile'))
            if db.execute(
                "SELECT id FROM pending_updates WHERE member_id=? AND field_name='job' AND status='pending'",
                (mid,)
            ).fetchone():
                flash('You already have a pending job update.', 'warning')
                return redirect(url_for('profile'))
            member = db.execute("SELECT job FROM members WHERE id=?", (mid,)).fetchone()
            if not member:
                flash('Member not found.', 'error')
                return redirect(url_for('profile'))
            db.execute(
                "INSERT INTO pending_updates (member_id, field_name, old_value, new_value) VALUES (?,?,?,?)",
                (mid, 'job', member['job'], new_job)
            )
            db.commit()
            flash('Job update submitted for admin approval.', 'success')

        return redirect(url_for('profile'))

    member  = db.execute("SELECT * FROM members WHERE id=?", (mid,)).fetchone()
    pending = db.execute(
        "SELECT * FROM pending_updates WHERE member_id=? AND status='pending'", (mid,)
    ).fetchall()
    rejected = db.execute(
        "SELECT * FROM pending_updates WHERE member_id=? AND status='rejected' ORDER BY created_at DESC LIMIT 5",
        (mid,)
    ).fetchall()
    att_rate = get_attendance_rate(db, mid)
    return render_template('profile.html', member=member, pending=pending, rejected=rejected, att_rate=att_rate)


@app.route('/attendance', methods=['POST'])
@login_required
@csrf_protect
def mark_attendance():
    if not _check_rate_limit(f'att:{_client_ip()}', max_calls=30, window_secs=60):
        flash('Too many requests. Please slow down.', 'error')
        return redirect(url_for('roster'))
    event_type = request.form.get('event_type')
    event_date = request.form.get('event_date')
    status     = request.form.get('status')
    next_page  = request.form.get('next', 'roster')

    if event_type not in ('guild_league', 'woe') or status not in ('attending', 'absent'):
        flash('Invalid attendance parameters.', 'error')
        return redirect(url_for('roster'))

    # Validate event_date is a real date and matches the correct weekday
    try:
        parsed = date.fromisoformat(event_date)
    except (ValueError, TypeError):
        flash('Invalid event date.', 'error')
        return redirect(url_for('roster'))

    wd = parsed.weekday()
    if event_type == 'guild_league' and wd not in (1, 3):
        flash('Invalid event date.', 'error')
        return redirect(url_for('roster'))
    if event_type == 'woe' and wd != 6:
        flash('Invalid event date.', 'error')
        return redirect(url_for('roster'))

    today = datetime.now(PHT).date()
    if abs((parsed - today).days) > 14:
        flash('Event date is out of range.', 'error')
        return redirect(url_for('roster'))

    note = request.form.get('absence_note', '').strip()[:300] if status == 'absent' else ''

    db = get_db()
    db.execute(
        """INSERT INTO attendance (member_id, event_type, event_date, status, note)
           VALUES (?,?,?,?,?)
           ON CONFLICT(member_id, event_type, event_date)
           DO UPDATE SET status=excluded.status, note=excluded.note, updated_at=CURRENT_TIMESTAMP""",
        (session['member_id'], event_type, event_date, status, note)
    )
    db.commit()

    if request.headers.get('X-Fetch') == '1':
        return jsonify({'ok': True, 'status': status})

    flash(f"Attendance marked as {'Attending' if status == 'attending' else 'Absent'}.", 'success')
    redirect_map = {'roster': 'roster', 'guild_league': 'guild_league', 'woe': 'woe', 'home': 'home'}
    return redirect(url_for(redirect_map.get(next_page, 'roster')))


# ── Admin Login ───────────────────────────────────────────────────────────────

@app.route('/admin/login', methods=['GET', 'POST'])
@csrf_protect
def admin_login():
    if session.get('is_admin'):
        return redirect(url_for('admin_index'))
    if request.method == 'POST':
        ip = _client_ip()
        if _admin_is_locked(ip):
            flash('Too many failed attempts. Try again in 5 minutes.', 'error')
            return render_template('admin/login.html')
        if request.form.get('password', '') == ADMIN_PASSWORD:
            _admin_clear(ip)
            session['is_admin'] = True
            return redirect(url_for('admin_index'))
        _admin_record_failure(ip)
        remaining = _ADMIN_MAX_ATTEMPTS - len(_admin_failed.get(ip, []))
        flash(f'Incorrect admin password. {max(remaining, 0)} attempt(s) remaining.', 'error')
    return render_template('admin/login.html')


@app.route('/admin/logout')
def admin_logout():
    session.pop('is_admin', None)
    return redirect(url_for('admin_login'))


# ── Admin Dashboard ───────────────────────────────────────────────────────────

@app.route('/admin')
@admin_required
def admin_index():
    db = get_db()
    pm    = db.execute("SELECT COUNT(*) as c FROM members WHERE status='pending'").fetchone()['c']
    pu    = db.execute("SELECT COUNT(*) as c FROM pending_updates WHERE status='pending'").fetchone()['c']
    total = db.execute("SELECT COUNT(*) as c FROM members WHERE status='approved'").fetchone()['c']
    ann_count = db.execute("SELECT COUNT(*) as c FROM announcements WHERE is_active=1").fetchone()['c']
    recruit = get_recruitment_status(db)
    return render_template('admin/index.html', pending_members=pm, pending_updates=pu,
                           total_members=total, ann_count=ann_count, recruitment=recruit)


# ── Admin Officers ───────────────────────────────────────────────────────────

@app.route('/admin/officers', methods=['GET', 'POST'])
@admin_required
@csrf_protect
def admin_officers():
    db = get_db()
    if request.method == 'POST':
        member_id = request.form.get('member_id', '').strip()
        rank      = request.form.get('rank', '').strip()
        if not member_id or rank not in RANK_ORDER:
            flash('Invalid selection.', 'error')
        else:
            mid_int = int(member_id)
            if db.execute("SELECT id FROM officers WHERE member_id=?", (mid_int,)).fetchone():
                flash('This member is already an officer.', 'error')
            else:
                db.execute(
                    "INSERT INTO officers (member_id, rank) VALUES (?, ?)",
                    (mid_int, rank)
                )
                db.commit()
                flash('Officer added.', 'success')
        return redirect(url_for('admin_officers'))

    rows = db.execute(
        """SELECT o.id, o.rank, m.name, m.job, m.photo_path
           FROM officers o
           JOIN members m ON m.id = o.member_id
           WHERE m.status = 'approved'
           ORDER BY o.created_at""",
    ).fetchall()
    grouped = {r: [] for r in RANK_ORDER}
    for row in rows:
        if row['rank'] in grouped:
            grouped[row['rank']].append(row)

    # Exclude members already assigned as officers
    officer_ids = {row['id'] for row in db.execute("SELECT member_id as id FROM officers").fetchall()}
    all_members = [
        m for m in db.execute(
            "SELECT id, name, job FROM members WHERE status='approved' ORDER BY name"
        ).fetchall()
        if m['id'] not in officer_ids
    ]
    return render_template('admin/officers.html', grouped=grouped,
                           rank_order=RANK_ORDER, all_members=all_members)


@app.route('/admin/officers/remove/<int:officer_id>', methods=['POST'])
@admin_required
@csrf_protect
def admin_officers_remove(officer_id):
    db = get_db()
    db.execute("DELETE FROM officers WHERE id=?", (officer_id,))
    db.commit()
    flash('Officer removed.', 'success')
    return redirect(url_for('admin_officers'))


# ── Admin Members Roster ─────────────────────────────────────────────────────

@app.route('/admin/members')
@admin_required
def admin_members():
    db = get_db()
    members = db.execute(
        """SELECT id, name, username, job, power, photo_path,
                  power_screenshot_path, equipment_screenshot_path,
                  quasi_stats_screenshot_path, created_at
           FROM members WHERE status='approved' ORDER BY power DESC"""
    ).fetchall()
    return render_template('admin/members.html', members=members)


@app.route('/admin/members/delete/<int:member_id>', methods=['POST'])
@admin_required
@csrf_protect
def admin_delete_member(member_id):
    db = get_db()
    db.execute("DELETE FROM attendance WHERE member_id=?", (member_id,))
    db.execute("DELETE FROM pending_updates WHERE member_id=?", (member_id,))
    db.execute("DELETE FROM gl_party_members WHERE member_id=?", (member_id,))
    db.execute("DELETE FROM woe_party_members WHERE member_id=?", (member_id,))
    db.execute("DELETE FROM officers WHERE member_id=?", (member_id,))
    db.execute("DELETE FROM members WHERE id=?", (member_id,))
    db.commit()
    flash('Member deleted.', 'success')
    return redirect(url_for('admin_members'))


# ── Admin Member Approvals ────────────────────────────────────────────────────

@app.route('/admin/approvals')
@admin_required
def admin_approvals():
    db = get_db()
    pending = db.execute(
        "SELECT * FROM members WHERE status='pending' ORDER BY created_at DESC"
    ).fetchall()
    return render_template('admin/approvals.html', pending=pending)


@app.route('/admin/approve/<int:member_id>', methods=['POST'])
@admin_required
@csrf_protect
def admin_approve(member_id):
    db = get_db()
    db.execute("UPDATE members SET status='approved', rejection_reason=NULL WHERE id=?", (member_id,))
    create_notification(db, member_id, '🎉 Your registration has been approved! Welcome to DayOne.', '/profile')
    db.commit()
    flash('Member approved.', 'success')
    return redirect(url_for('admin_approvals'))


@app.route('/admin/reject/<int:member_id>', methods=['POST'])
@admin_required
@csrf_protect
def admin_reject(member_id):
    reason = request.form.get('reason', '').strip() or 'No reason provided.'
    db = get_db()
    db.execute("UPDATE members SET status='rejected', rejection_reason=? WHERE id=?", (reason, member_id))
    db.commit()
    flash('Member rejected.', 'success')
    return redirect(url_for('admin_approvals'))


# ── Admin Update Approvals ────────────────────────────────────────────────────

@app.route('/admin/updates')
@admin_required
def admin_updates():
    db = get_db()
    updates = db.execute(
        """SELECT pu.*, m.name AS member_name, m.username
           FROM pending_updates pu
           JOIN members m ON m.id=pu.member_id
           WHERE pu.status='pending'
           ORDER BY pu.created_at DESC"""
    ).fetchall()
    return render_template('admin/updates.html', updates=updates)


@app.route('/admin/updates/approve/<int:update_id>', methods=['POST'])
@admin_required
@csrf_protect
def admin_approve_update(update_id):
    db = get_db()
    u = db.execute("SELECT * FROM pending_updates WHERE id=?", (update_id,)).fetchone()
    if not u:
        flash('Update not found.', 'error')
        return redirect(url_for('admin_updates'))

    field = u['field_name']
    if field == 'power':
        db.execute(
            "UPDATE members SET power=?, power_screenshot_path=? WHERE id=?",
            (int(u['new_value']), u['new_screenshot'], u['member_id'])
        )
    elif field == 'equipment':
        db.execute(
            "UPDATE members SET equipment_screenshot_path=? WHERE id=?",
            (u['new_screenshot'], u['member_id'])
        )
    elif field == 'quasi_stats':
        db.execute(
            "UPDATE members SET quasi_stats_screenshot_path=? WHERE id=?",
            (u['new_screenshot'], u['member_id'])
        )
    elif field == 'job':
        db.execute("UPDATE members SET job=? WHERE id=?", (u['new_value'], u['member_id']))

    db.execute("UPDATE pending_updates SET status='approved' WHERE id=?", (update_id,))
    create_notification(db, u['member_id'], f'✅ Your {field} update has been approved.', '/profile')
    db.commit()
    flash('Update approved.', 'success')
    return redirect(url_for('admin_updates'))


@app.route('/admin/updates/reject/<int:update_id>', methods=['POST'])
@admin_required
@csrf_protect
def admin_reject_update(update_id):
    reason = request.form.get('reason', '').strip() or 'No reason provided.'
    db = get_db()
    u = db.execute("SELECT member_id, field_name FROM pending_updates WHERE id=?", (update_id,)).fetchone()
    db.execute(
        "UPDATE pending_updates SET status='rejected', rejection_reason=? WHERE id=?",
        (reason, update_id)
    )
    if u:
        create_notification(db, u['member_id'], f'❌ Your {u["field_name"]} update was rejected: {reason[:80]}', '/profile')
    db.commit()
    flash('Update rejected.', 'success')
    return redirect(url_for('admin_updates'))


# ── Admin Attendance Overview ─────────────────────────────────────────────────

@app.route('/admin/attendance')
@admin_required
def admin_attendance():
    db = get_db()
    events   = get_next_event_dates()
    next_gl  = events['gl_next']
    next_woe = events['woe_next']

    def build_list(event_type, event_date):
        if not event_date:
            return [], 0, 0, 0
        members = db.execute(
            "SELECT id, name, job FROM members WHERE status='approved' ORDER BY name"
        ).fetchall()
        att_map = {r['member_id']: r['status'] for r in db.execute(
            "SELECT member_id, status FROM attendance WHERE event_type=? AND event_date=?",
            (event_type, str(event_date))
        ).fetchall()}
        result = [{'id': m['id'], 'name': m['name'], 'job': m['job'],
                   'status': att_map.get(m['id'])} for m in members]
        att = sum(1 for r in result if r['status'] == 'attending')
        ab  = sum(1 for r in result if r['status'] == 'absent')
        nr  = sum(1 for r in result if not r['status'])
        return result, att, ab, nr

    gl_list, gl_att, gl_abs, gl_nr    = build_list('guild_league', next_gl)
    woe_list, woe_att, woe_abs, woe_nr = build_list('woe', next_woe)

    today = datetime.now(PHT).date()
    past = []
    for i in range(1, 29):
        d = today - timedelta(days=i)
        if d.weekday() in (1, 3):
            past.append(('guild_league', d))
        elif d.weekday() == 6:
            past.append(('woe', d))
    past = sorted(past, key=lambda x: x[1], reverse=True)[:10]

    return render_template('admin/attendance.html',
                           gl_list=gl_list, next_gl=next_gl,
                           gl_att=gl_att, gl_abs=gl_abs, gl_nr=gl_nr,
                           woe_list=woe_list, next_woe=next_woe,
                           woe_att=woe_att, woe_abs=woe_abs, woe_nr=woe_nr,
                           past_events=past)


@app.route('/admin/attendance/history')
@admin_required
def admin_attendance_history():
    event_type = request.args.get('type', '')
    event_date = request.args.get('date', '')
    if event_type not in ('guild_league', 'woe') or not event_date:
        return redirect(url_for('admin_attendance'))
    db = get_db()
    members = db.execute(
        "SELECT id, name, job FROM members WHERE status='approved' ORDER BY name"
    ).fetchall()
    att_map = {r['member_id']: r['status'] for r in db.execute(
        "SELECT member_id, status FROM attendance WHERE event_type=? AND event_date=?",
        (event_type, event_date)
    ).fetchall()}
    result = [{'id': m['id'], 'name': m['name'], 'job': m['job'],
               'status': att_map.get(m['id'])} for m in members]
    att = sum(1 for r in result if r['status'] == 'attending')
    ab  = sum(1 for r in result if r['status'] == 'absent')
    nr  = sum(1 for r in result if not r['status'])
    return render_template('admin/attendance_history.html',
                           members=result, event_type=event_type,
                           event_date=event_date, att=att, ab=ab, nr=nr)


# ── Admin GL Party Management ─────────────────────────────────────────────────

def _build_party_data(db, party_table, member_table, event_type, next_date):
    parties_raw = db.execute(
        f"SELECT * FROM {party_table} ORDER BY {'is_sub ASC,' if party_table == 'gl_parties' else ''} sort_order ASC, id ASC"
    ).fetchall()
    assigned_ids = set()
    parties = []
    for p in parties_raw:
        rows = db.execute(
            f"""SELECT m.id, m.name, m.job, m.power, m.photo_path
                FROM {member_table} pm
                JOIN members m ON m.id=pm.member_id
                WHERE pm.party_id=? AND m.status='approved'
                ORDER BY m.power DESC""",
            (p['id'],)
        ).fetchall()
        members = []
        for r in rows:
            assigned_ids.add(r['id'])
            members.append({
                'id': r['id'], 'name': r['name'], 'job': r['job'],
                'power': r['power'], 'photo_path': r['photo_path'],
                'attendance': get_attendance(r['id'], event_type, next_date),
                'is_support': is_support(r['job'])
            })
        entry = {'id': p['id'], 'name': p['name'], 'members': members, 'notes': (p['notes'] if 'notes' in p.keys() else '') or ''}
        if party_table == 'gl_parties':
            entry['is_sub'] = p['is_sub']
        parties.append(entry)

    all_members = db.execute(
        "SELECT id, name, job, power, photo_path FROM members WHERE status='approved' ORDER BY power DESC"
    ).fetchall()
    unassigned = []
    for m in all_members:
        if m['id'] not in assigned_ids:
            unassigned.append({
                'id': m['id'], 'name': m['name'], 'job': m['job'],
                'power': m['power'], 'photo_path': m['photo_path'],
                'attendance': get_attendance(m['id'], event_type, next_date),
                'is_support': is_support(m['job'])
            })
    return parties, unassigned


@app.route('/admin/parties/guild-league')
@admin_required
def admin_gl_parties():
    db = get_db()
    next_gl = get_next_event_dates()['gl_next']
    parties, unassigned = _build_party_data(db, 'gl_parties', 'gl_party_members', 'guild_league', next_gl)
    return render_template('admin/party_gl.html', parties=parties,
                           unassigned=unassigned, next_gl=next_gl)


@app.route('/admin/parties/guild-league/create', methods=['POST'])
@admin_required
@csrf_protect
def admin_gl_create_party():
    name   = request.form.get('name', '').strip()
    is_sub = 1 if request.form.get('is_sub') else 0
    if not name:
        flash('Party name required.', 'error')
        return redirect(url_for('admin_gl_parties'))
    db = get_db()
    db.execute("INSERT INTO gl_parties (name, is_sub) VALUES (?,?)", (name, is_sub))
    db.commit()
    return redirect(url_for('admin_gl_parties'))


@app.route('/admin/parties/guild-league/delete/<int:party_id>', methods=['POST'])
@admin_required
@csrf_protect
def admin_gl_delete_party(party_id):
    db = get_db()
    db.execute("DELETE FROM gl_party_members WHERE party_id=?", (party_id,))
    db.execute("DELETE FROM gl_parties WHERE id=?", (party_id,))
    db.commit()
    return redirect(url_for('admin_gl_parties'))


@app.route('/admin/parties/guild-league/move', methods=['POST'])
@admin_required
def admin_gl_move():
    data      = request.get_json()
    member_id = data.get('member_id')
    party_id  = data.get('party_id')
    if not member_id:
        return jsonify({'error': 'member_id required'}), 400
    db = get_db()
    if party_id:
        count = db.execute(
            "SELECT COUNT(*) as c FROM gl_party_members WHERE party_id=?", (party_id,)
        ).fetchone()['c']
        if count >= 5:
            return jsonify({'error': 'full'}), 400
    db.execute("DELETE FROM gl_party_members WHERE member_id=?", (member_id,))
    if party_id:
        db.execute("INSERT OR IGNORE INTO gl_party_members (party_id, member_id) VALUES (?,?)",
                   (party_id, member_id))
    db.commit()
    return jsonify({'ok': True})


@app.route('/admin/parties/guild-league/auto', methods=['POST'])
@admin_required
@csrf_protect
def admin_gl_auto():
    db = get_db()
    db.execute("DELETE FROM gl_party_members")
    db.execute("DELETE FROM gl_parties")

    members = list(db.execute(
        "SELECT id, name, job, power FROM members WHERE status='approved' ORDER BY power DESC"
    ).fetchall())

    if not members:
        db.commit()
        flash('No approved members to distribute.', 'error')
        return redirect(url_for('admin_gl_parties'))

    main_pool  = members[:40]
    sub_pool   = members[40:]

    main_chunks = [main_pool[i:i+5] for i in range(0, len(main_pool), 5)]
    if len(main_chunks) > 8:
        for extra in main_chunks[8:]:
            sub_pool = list(extra) + sub_pool
        main_chunks = main_chunks[:8]

    sub_chunks = [sub_pool[i:i+5] for i in range(0, len(sub_pool), 5)]

    created = []
    for i, chunk in enumerate(main_chunks):
        cur = db.execute("INSERT INTO gl_parties (name, is_sub, sort_order) VALUES (?,0,?)",
                         (f"Party {i+1}", i))
        created.append({'id': cur.lastrowid, 'members': chunk})

    for i, chunk in enumerate(sub_chunks):
        cur = db.execute("INSERT INTO gl_parties (name, is_sub, sort_order) VALUES (?,1,?)",
                         (f"Sub {i+1}", i))
        created.append({'id': cur.lastrowid, 'members': chunk})

    for party in created:
        for m in party['members']:
            db.execute("INSERT OR IGNORE INTO gl_party_members (party_id, member_id) VALUES (?,?)",
                       (party['id'], m['id']))

    db.commit()
    _enforce_support(db, 'gl_parties', 'gl_party_members')
    db.commit()
    flash('Guild League parties auto-distributed.', 'success')
    return redirect(url_for('admin_gl_parties'))


@app.route('/admin/parties/guild-league/reset', methods=['POST'])
@admin_required
@csrf_protect
def admin_gl_reset():
    db = get_db()
    db.execute("DELETE FROM gl_party_members")
    db.execute("DELETE FROM gl_parties")
    db.commit()
    flash('Guild League parties reset.', 'success')
    return redirect(url_for('admin_gl_parties'))


# ── Admin WoE Party Management ────────────────────────────────────────────────

@app.route('/admin/parties/woe')
@admin_required
def admin_woe_parties():
    db = get_db()
    next_woe = get_next_event_dates()['woe_next']
    parties, unassigned = _build_party_data(db, 'woe_parties', 'woe_party_members', 'woe', next_woe)
    return render_template('admin/party_woe.html', parties=parties,
                           unassigned=unassigned, next_woe=next_woe)


@app.route('/admin/parties/woe/create', methods=['POST'])
@admin_required
@csrf_protect
def admin_woe_create_party():
    name = request.form.get('name', '').strip()
    if not name:
        flash('Party name required.', 'error')
        return redirect(url_for('admin_woe_parties'))
    db = get_db()
    db.execute("INSERT INTO woe_parties (name) VALUES (?)", (name,))
    db.commit()
    return redirect(url_for('admin_woe_parties'))


@app.route('/admin/parties/woe/delete/<int:party_id>', methods=['POST'])
@admin_required
@csrf_protect
def admin_woe_delete_party(party_id):
    db = get_db()
    db.execute("DELETE FROM woe_party_members WHERE party_id=?", (party_id,))
    db.execute("DELETE FROM woe_parties WHERE id=?", (party_id,))
    db.commit()
    return redirect(url_for('admin_woe_parties'))


@app.route('/admin/parties/woe/move', methods=['POST'])
@admin_required
def admin_woe_move():
    data      = request.get_json()
    member_id = data.get('member_id')
    party_id  = data.get('party_id')
    if not member_id:
        return jsonify({'error': 'member_id required'}), 400
    db = get_db()
    if party_id:
        count = db.execute(
            "SELECT COUNT(*) as c FROM woe_party_members WHERE party_id=?", (party_id,)
        ).fetchone()['c']
        if count >= 5:
            return jsonify({'error': 'full'}), 400
    db.execute("DELETE FROM woe_party_members WHERE member_id=?", (member_id,))
    if party_id:
        db.execute("INSERT OR IGNORE INTO woe_party_members (party_id, member_id) VALUES (?,?)",
                   (party_id, member_id))
    db.commit()
    return jsonify({'ok': True})


@app.route('/admin/parties/woe/auto', methods=['POST'])
@admin_required
@csrf_protect
def admin_woe_auto():
    db = get_db()
    db.execute("DELETE FROM woe_party_members")
    db.execute("DELETE FROM woe_parties")

    members = list(db.execute(
        "SELECT id, name, job, power FROM members WHERE status='approved'"
    ).fetchall())
    random.shuffle(members)

    if not members:
        db.commit()
        flash('No approved members to distribute.', 'error')
        return redirect(url_for('admin_woe_parties'))

    chunks  = [members[i:i+5] for i in range(0, len(members), 5)]
    created = []
    for i, chunk in enumerate(chunks):
        cur = db.execute("INSERT INTO woe_parties (name, sort_order) VALUES (?,?)", (f"Party {i+1}", i))
        created.append({'id': cur.lastrowid, 'members': chunk})

    for party in created:
        for m in party['members']:
            db.execute("INSERT OR IGNORE INTO woe_party_members (party_id, member_id) VALUES (?,?)",
                       (party['id'], m['id']))

    db.commit()
    _enforce_support(db, 'woe_parties', 'woe_party_members')
    db.commit()
    flash('WoE parties auto-distributed.', 'success')
    return redirect(url_for('admin_woe_parties'))


@app.route('/admin/parties/woe/reset', methods=['POST'])
@admin_required
@csrf_protect
def admin_woe_reset():
    db = get_db()
    db.execute("DELETE FROM woe_party_members")
    db.execute("DELETE FROM woe_parties")
    db.commit()
    flash('WoE parties reset.', 'success')
    return redirect(url_for('admin_woe_parties'))


# ── Support enforcement ───────────────────────────────────────────────────────

def _enforce_support(db, party_table, member_table):
    for _ in range(10):  # up to 10 passes until stable
        parties = db.execute(f"SELECT id FROM {party_table}").fetchall()
        party_data = {}
        for p in parties:
            rows = db.execute(
                f"""SELECT m.id, m.job FROM {member_table} pm
                    JOIN members m ON m.id=pm.member_id WHERE pm.party_id=?""",
                (p['id'],)
            ).fetchall()
            party_data[p['id']] = [dict(r) for r in rows]

        swapped = False
        for pid, members in party_data.items():
            if any(is_support(m['job']) for m in members):
                continue
            if not members:
                continue
            for other_pid, other_members in party_data.items():
                if other_pid == pid:
                    continue
                supports = [m for m in other_members if is_support(m['job'])]
                if len(supports) < 2:
                    continue
                non_sup = next((m for m in members if not is_support(m['job'])), None)
                if not non_sup:
                    continue
                sup = supports[0]
                db.execute(
                    f"UPDATE {member_table} SET party_id=? WHERE member_id=? AND party_id=?",
                    (pid, sup['id'], other_pid)
                )
                db.execute(
                    f"UPDATE {member_table} SET party_id=? WHERE member_id=? AND party_id=?",
                    (other_pid, non_sup['id'], pid)
                )
                party_data[pid] = [m for m in members if m['id'] != non_sup['id']] + [sup]
                party_data[other_pid] = [m for m in other_members if m['id'] != sup['id']] + [non_sup]
                swapped = True
                break

        if not swapped:
            break


# ── Announcements (member-facing) ────────────────────────────────────────────

@app.route('/announcements')
@login_required
def announcements():
    db = get_db()
    items = db.execute(
        "SELECT * FROM announcements WHERE is_active=1 ORDER BY is_pinned DESC, created_at DESC"
    ).fetchall()
    return render_template('announcements.html', announcements=items)


# ── Admin Absent List ─────────────────────────────────────────────────────────

@app.route('/admin/absent')
@admin_required
def admin_absent():
    db = get_db()
    events = get_next_event_dates()
    next_gl = events['gl_next']
    next_woe = events['woe_next']
    def build_absent(event_type, event_date):
        if not event_date:
            return [], []
        members = db.execute(
            "SELECT id, name, job FROM members WHERE status='approved' ORDER BY name"
        ).fetchall()
        att_map = {r['member_id']: r['status'] for r in db.execute(
            "SELECT member_id, status FROM attendance WHERE event_type=? AND event_date=?",
            (event_type, str(event_date))
        ).fetchall()}
        note_map = {r['member_id']: r['note'] for r in db.execute(
            "SELECT member_id, note FROM attendance WHERE event_type=? AND event_date=?",
            (event_type, str(event_date))
        ).fetchall()}
        absent = [{'id': m['id'], 'name': m['name'], 'job': m['job'], 'note': note_map.get(m['id'], '')}
                  for m in members if att_map.get(m['id']) == 'absent']
        no_resp = [{'id': m['id'], 'name': m['name'], 'job': m['job'], 'note': ''}
                   for m in members if not att_map.get(m['id'])]
        return absent, no_resp
    gl_absent, gl_nr = build_absent('guild_league', next_gl)
    woe_absent, woe_nr = build_absent('woe', next_woe)
    return render_template('admin/absent.html',
                           gl_absent=gl_absent, gl_nr=gl_nr, next_gl=next_gl,
                           woe_absent=woe_absent, woe_nr=woe_nr, next_woe=next_woe)


# ── Admin Announcements ───────────────────────────────────────────────────────

@app.route('/admin/announcements', methods=['GET', 'POST'])
@admin_required
@csrf_protect
def admin_announcements():
    db = get_db()
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        body = request.form.get('body', '').strip()
        is_pinned = 1 if request.form.get('is_pinned') else 0
        is_ticker = 1 if request.form.get('is_ticker') else 0
        edit_id = request.form.get('edit_id', '').strip()
        if not title:
            flash('Title is required.', 'error')
        elif edit_id:
            db.execute(
                "UPDATE announcements SET title=?, body=?, is_pinned=?, is_ticker=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                (title, body, is_pinned, is_ticker, int(edit_id))
            )
            db.commit()
            flash('Announcement updated.', 'success')
        else:
            db.execute(
                "INSERT INTO announcements (title, body, is_pinned, is_ticker) VALUES (?,?,?,?)",
                (title, body, is_pinned, is_ticker)
            )
            notify_all_members(db, f'📢 New announcement: {title}', '/announcements')
            db.commit()
            flash('Announcement posted.', 'success')
        return redirect(url_for('admin_announcements'))
    items = db.execute("SELECT * FROM announcements ORDER BY is_pinned DESC, created_at DESC").fetchall()
    return render_template('admin/announcements.html', announcements=items)


@app.route('/admin/announcements/<int:ann_id>/delete', methods=['POST'])
@admin_required
@csrf_protect
def admin_announcement_delete(ann_id):
    db = get_db()
    db.execute("DELETE FROM announcements WHERE id=?", (ann_id,))
    db.commit()
    flash('Announcement deleted.', 'success')
    return redirect(url_for('admin_announcements'))


@app.route('/admin/announcements/<int:ann_id>/toggle', methods=['POST'])
@admin_required
@csrf_protect
def admin_announcement_toggle(ann_id):
    field = request.form.get('field', 'is_active')
    if field not in ('is_active', 'is_pinned', 'is_ticker'):
        abort(400)
    db = get_db()
    db.execute(f"UPDATE announcements SET {field} = 1 - {field} WHERE id=?", (ann_id,))
    db.commit()
    return redirect(url_for('admin_announcements'))


# ── Admin Recruitment Toggle ──────────────────────────────────────────────────

@app.route('/admin/settings/recruitment', methods=['POST'])
@admin_required
@csrf_protect
def admin_toggle_recruitment():
    db = get_db()
    current = get_recruitment_status(db)
    new_val = 'closed' if current == 'open' else 'open'
    db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('recruitment', ?)", (new_val,))
    db.commit()
    flash(f"Recruitment is now {'Open' if new_val == 'open' else 'Closed'}.", 'success')
    return redirect(url_for('admin_index'))


# ── Party Notes ───────────────────────────────────────────────────────────────

@app.route('/admin/parties/guild-league/<int:party_id>/notes', methods=['POST'])
@admin_required
@csrf_protect
def admin_gl_save_notes(party_id):
    notes = request.form.get('notes', '').strip()
    db = get_db()
    db.execute("UPDATE gl_parties SET notes=? WHERE id=?", (notes, party_id))
    db.commit()
    return redirect(url_for('admin_gl_parties'))


@app.route('/admin/parties/woe/<int:party_id>/notes', methods=['POST'])
@admin_required
@csrf_protect
def admin_woe_save_notes(party_id):
    notes = request.form.get('notes', '').strip()
    db = get_db()
    db.execute("UPDATE woe_parties SET notes=? WHERE id=?", (notes, party_id))
    db.commit()
    return redirect(url_for('admin_woe_parties'))


# ── Leaderboard ───────────────────────────────────────────────────────────────

@app.route('/leaderboard')
@login_required
def leaderboard():
    db = get_db()
    today = datetime.now(PHT).date()
    cutoff = today - timedelta(weeks=4)
    members = db.execute(
        "SELECT id, name, job, photo_path FROM members WHERE status='approved' ORDER BY name"
    ).fetchall()
    board = []
    for m in members:
        rows = db.execute(
            "SELECT status FROM attendance WHERE member_id=? AND event_date >= ?",
            (m['id'], str(cutoff))
        ).fetchall()
        total    = len(rows)
        attended = sum(1 for r in rows if r['status'] == 'attending')
        pct      = round(attended / total * 100) if total else 0
        board.append({'id': m['id'], 'name': m['name'], 'job': m['job'],
                      'photo_path': m['photo_path'],
                      'attended': attended, 'total': total, 'pct': pct})
    board.sort(key=lambda x: (-x['pct'], -x['attended'], x['name']))
    return render_template('leaderboard.html', board=board)


# ── My Attendance History ─────────────────────────────────────────────────────

@app.route('/my-attendance')
@login_required
def my_attendance():
    db  = get_db()
    mid = session['member_id']
    records = db.execute(
        """SELECT event_type, event_date, status, note, updated_at
           FROM attendance WHERE member_id=? ORDER BY event_date DESC""",
        (mid,)
    ).fetchall()
    return render_template('my_attendance.html', records=records)


# ── Notifications ─────────────────────────────────────────────────────────────

@app.route('/notifications')
@login_required
def notifications():
    db  = get_db()
    mid = session['member_id']
    items = db.execute(
        "SELECT * FROM notifications WHERE member_id=? ORDER BY created_at DESC LIMIT 60",
        (mid,)
    ).fetchall()
    db.execute("UPDATE notifications SET is_read=1 WHERE member_id=?", (mid,))
    db.commit()
    return render_template('notifications.html', notifications=items)


@app.route('/notifications/mark-read', methods=['POST'])
@login_required
@csrf_protect
def notifications_mark_read():
    db = get_db()
    db.execute("UPDATE notifications SET is_read=1 WHERE member_id=?", (session['member_id'],))
    db.commit()
    return redirect(url_for('notifications'))


# ── Castle Assignment ─────────────────────────────────────────────────────────

@app.route('/admin/parties/woe/<int:party_id>/castle', methods=['POST'])
@admin_required
@csrf_protect
def admin_woe_save_castle(party_id):
    castle = request.form.get('target_castle', '').strip()[:60]
    db = get_db()
    db.execute("UPDATE woe_parties SET target_castle=? WHERE id=?", (castle, party_id))
    db.commit()
    return redirect(url_for('admin_woe_parties'))


# ── Admin Power History (JSON for chart) ─────────────────────────────────────

@app.route('/admin/members/<int:member_id>/power-history')
@admin_required
def admin_power_history(member_id):
    db = get_db()
    member = db.execute("SELECT name, power, created_at FROM members WHERE id=?", (member_id,)).fetchone()
    if not member:
        return jsonify({'labels': [], 'values': []})
    history = db.execute(
        """SELECT new_value, created_at FROM pending_updates
           WHERE member_id=? AND field_name='power' AND status='approved'
           ORDER BY created_at ASC""",
        (member_id,)
    ).fetchall()
    labels = [member['created_at'][:10]]
    values = [int(db.execute(
        "SELECT old_value FROM pending_updates WHERE member_id=? AND field_name='power' AND status='approved' ORDER BY created_at ASC LIMIT 1",
        (member_id,)
    ).fetchone()['old_value']) if history else member['power']]
    for h in history:
        labels.append(h['created_at'][:10])
        values.append(int(h['new_value']))
    if not history:
        labels = [member['created_at'][:10]]
        values = [member['power']]
    return jsonify({'labels': labels, 'values': values, 'name': member['name']})


# ── Event Calendar ───────────────────────────────────────────────────────────

@app.route('/calendar')
@login_required
def calendar_view():
    import calendar as _cal
    mid   = session['member_id']
    today = datetime.now(PHT).date()
    year  = request.args.get('year',  today.year,  type=int)
    month = request.args.get('month', today.month, type=int)
    # clamp
    if month < 1:  month = 12; year -= 1
    if month > 12: month = 1;  year += 1

    _, days_in_month = _cal.monthrange(year, month)
    first_dow = _cal.monthrange(year, month)[0]  # 0=Mon … 6=Sun

    db = get_db()
    att_rows = db.execute(
        "SELECT event_date, event_type, status FROM attendance "
        "WHERE member_id=? AND event_date LIKE ?",
        (mid, f"{year}-{month:02d}-%")
    ).fetchall()
    att_map = {(r['event_date'], r['event_type']): r['status'] for r in att_rows}

    days = []
    for d in range(1, days_in_month + 1):
        day    = date(year, month, d)
        wd     = day.weekday()  # 0=Mon … 6=Sun
        is_gl  = wd in (1, 3)  # Tue, Thu
        is_woe = wd == 6       # Sun
        ds     = str(day)
        days.append({
            'date':    day,
            'day':     d,
            'weekday': wd,
            'is_gl':   is_gl,
            'is_woe':  is_woe,
            'is_today': day == today,
            'gl_att':  att_map.get((ds, 'guild_league')),
            'woe_att': att_map.get((ds, 'woe')),
        })

    # Pad to full weeks
    leading  = first_dow          # blanks before day 1
    trailing = (7 - (leading + days_in_month) % 7) % 7

    prev_month = month - 1 or 12
    prev_year  = year - (1 if month == 1 else 0)
    next_month = month % 12 + 1
    next_year  = year + (1 if month == 12 else 0)

    return render_template('calendar.html',
        year=year, month=month, month_name=date(year, month, 1).strftime('%B'),
        today=today, days=days, leading=leading, trailing=trailing,
        prev_month=prev_month, prev_year=prev_year,
        next_month=next_month, next_year=next_year,
    )


# ── Push notification helpers ─────────────────────────────────────────────────

def _send_push(sub_info: dict, title: str, body: str, url: str = '/') -> bool:
    if not VAPID_PRIVATE_KEY:
        return False
    try:
        import json as _json
        from pywebpush import webpush, WebPushException
        webpush(
            subscription_info=sub_info,
            data=_json.dumps({'title': title, 'body': body, 'url': url}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS,
        )
        return True
    except Exception:
        return False


def _push_scheduler_loop():
    import sqlite3 as _sq
    while True:
        time.sleep(1800)  # run every 30 minutes
        if not VAPID_PRIVATE_KEY:
            continue
        try:
            now    = datetime.now(PHT)
            events = get_next_event_dates()
            checks = [
                ('guild_league', events.get('gl_next'), events.get('gl_dt_iso'),
                 '/guild-league', '⚔ Guild League'),
                ('woe', events.get('woe_next'), events.get('woe_dt_iso'),
                 '/woe', '🏰 War of Emperium'),
            ]
            db = _sq.connect(DATABASE)
            db.row_factory = _sq.Row
            for etype, edate, edt_iso, url, label in checks:
                if not edt_iso or not edate:
                    continue
                event_dt = datetime.fromisoformat(edt_iso)
                diff_h   = (event_dt - now).total_seconds() / 3600
                windows  = [
                    ('1day',  22.5, 25.0, f'{label} is tomorrow! Mark your attendance.'),
                    ('3hour',  2.5,  3.5, f'{label} starts in 3 hours! Don\'t forget to attend.'),
                ]
                for window_label, lo, hi, msg in windows:
                    if not (lo <= diff_h <= hi):
                        continue
                    try:
                        db.execute(
                            'INSERT INTO push_notification_log '
                            '(event_type, event_date, window_label) VALUES (?,?,?)',
                            (etype, str(edate), window_label)
                        )
                        db.commit()
                    except _sq.IntegrityError:
                        continue  # already sent
                    subs = db.execute(
                        'SELECT endpoint, p256dh, auth FROM push_subscriptions'
                    ).fetchall()
                    for sub in subs:
                        _send_push(
                            {'endpoint': sub['endpoint'],
                             'keys': {'p256dh': sub['p256dh'], 'auth': sub['auth']}},
                            label, msg, url
                        )
                        time.sleep(0.05)
            db.close()
        except Exception:
            pass


import threading as _threading
_push_thread = _threading.Thread(target=_push_scheduler_loop, daemon=True)
_push_thread.start()


@app.route('/push/vapid-key')
def push_vapid_key():
    return jsonify({'key': VAPID_PUBLIC_KEY})


@app.route('/push/subscribe', methods=['POST'])
@login_required
def push_subscribe():
    data     = request.get_json() or {}
    endpoint = data.get('endpoint')
    p256dh   = (data.get('keys') or {}).get('p256dh')
    auth     = (data.get('keys') or {}).get('auth')
    if not all([endpoint, p256dh, auth]):
        return jsonify({'error': 'missing fields'}), 400
    mid = session['member_id']
    db  = get_db()
    db.execute(
        'INSERT OR REPLACE INTO push_subscriptions (member_id, endpoint, p256dh, auth) '
        'VALUES (?,?,?,?)',
        (mid, endpoint, p256dh, auth)
    )
    db.commit()
    return jsonify({'ok': True})


@app.route('/push/unsubscribe', methods=['POST'])
@login_required
def push_unsubscribe():
    data     = request.get_json() or {}
    endpoint = data.get('endpoint')
    if endpoint:
        db = get_db()
        db.execute('DELETE FROM push_subscriptions WHERE endpoint=?', (endpoint,))
        db.commit()
    return jsonify({'ok': True})


@app.route('/sw.js')
def service_worker():
    resp = app.make_response(app.send_static_file('sw.js'))
    resp.headers['Content-Type']        = 'application/javascript'
    resp.headers['Service-Worker-Allowed'] = '/'
    return resp


# ── Init & Run ────────────────────────────────────────────────────────────────
with app.app_context():
    init_db()

if __name__ == "__main__":
    app.run(debug=True)
