// ── Mobile nav toggle ────────────────────────────────────────────────────────
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  });
  // close when tapping a link
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });
  // close when tapping outside
  document.addEventListener('click', function(e) {
    if (navLinks.classList.contains('open') &&
        !navLinks.contains(e.target) &&
        !menuToggle.contains(e.target)) {
      navLinks.classList.remove('open');
    }
  });
}

// ── Active nav link ──────────────────────────────────────────────────────────
const currentPath = window.location.pathname;
document.querySelectorAll('.nav-links a').forEach(a => {
  if (a.getAttribute('href') === currentPath) a.classList.add('active');
});
document.querySelectorAll('.admin-nav-links a').forEach(a => {
  if (a.getAttribute('href') === currentPath) a.classList.add('active');
});

// ── Reject form toggle ───────────────────────────────────────────────────────
document.querySelectorAll('.toggle-reject').forEach(btn => {
  btn.addEventListener('click', () => {
    const form = btn.closest('.approval-actions, .admin-actions')
      ?.querySelector('.reject-form');
    if (form) form.classList.toggle('open');
  });
});

// ── Image lightbox ───────────────────────────────────────────────────────────
const overlay = document.getElementById('img-modal');
const overlayImg = document.getElementById('img-modal-img');
if (overlay) {
  document.querySelectorAll('.lightbox-trigger').forEach(img => {
    img.addEventListener('click', () => {
      overlayImg.src = img.src;
      overlay.classList.add('open');
    });
  });
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
  document.getElementById('img-modal-close')?.addEventListener('click', () => {
    overlay.classList.remove('open');
  });
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.dataset.group;
    document.querySelectorAll(`.tab-btn[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`.tab-content[data-group="${group}"]`).forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.target)?.classList.add('active');
  });
});

// ── Auto-dismiss flash messages ──────────────────────────────────────────────
setTimeout(() => {
  document.querySelectorAll('.alert').forEach(el => {
    el.style.transition = 'opacity 0.5s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 500);
  });
}, 4000);

// ── Event countdown timers ────────────────────────────────────────────────────
function updateCountdowns() {
  document.querySelectorAll('.event-banner[data-countdown]').forEach(banner => {
    const target = new Date(banner.dataset.countdown);
    const display = banner.querySelector('.event-countdown');
    if (!display) return;
    const now = new Date();
    const diff = target - now;
    if (diff <= 0) {
      display.textContent = '⚡ Event is starting now!';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    parts.push(`${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`);
    display.textContent = `⏱ Starts in: ${parts.join(' ')}`;
  });
}
if (document.querySelector('.event-banner[data-countdown]')) {
  updateCountdowns();
  setInterval(updateCountdowns, 1000);
}
