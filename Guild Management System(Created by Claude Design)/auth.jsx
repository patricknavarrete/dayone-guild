// Login / Register / Admin screens

function AuthShell({ mode, onSwitch }) {
  // Cyberpunk login/register screen — full-bleed scene
  return (
    <div className="auth-shell">
      <div className="auth-bg">
        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="auth-sky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#1a0d2e" />
              <stop offset="0.4" stopColor="#3a1854" />
              <stop offset="0.8" stopColor="#0f1626" />
              <stop offset="1" stopColor="#070b14" />
            </linearGradient>
            <linearGradient id="auth-tower" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#1a2336" />
              <stop offset="1" stopColor="#070b14" />
            </linearGradient>
            <radialGradient id="auth-moon" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#ff5fd4" stopOpacity="0.95" />
              <stop offset="0.6" stopColor="#ff5fd4" stopOpacity="0.4" />
              <stop offset="1" stopColor="#ff5fd4" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1200" height="800" fill="url(#auth-sky)" />
          {/* moon */}
          <circle cx="900" cy="220" r="180" fill="url(#auth-moon)" />
          <circle cx="900" cy="220" r="80" fill="#ff5fd4" opacity="0.9" />
          {/* horizon glow */}
          <rect y="500" width="1200" height="2" fill="#36e8e0" opacity="0.6" />
          <rect y="498" width="1200" height="60" fill="url(#auth-sky)" opacity="0.4" />
          {/* far skyline */}
          <g fill="#1a2336" opacity="0.7">
            <rect x="0" y="430" width="80" height="100" />
            <rect x="60" y="400" width="50" height="130" />
            <rect x="100" y="450" width="70" height="80" />
            <rect x="160" y="380" width="40" height="150" />
            <rect x="200" y="410" width="60" height="120" />
            <rect x="260" y="440" width="80" height="90" />
            <rect x="340" y="395" width="50" height="135" />
            <rect x="380" y="425" width="70" height="105" />
            <rect x="450" y="385" width="55" height="145" />
            <rect x="500" y="445" width="65" height="85" />
            <rect x="700" y="410" width="60" height="120" />
            <rect x="760" y="445" width="80" height="85" />
            <rect x="840" y="380" width="60" height="150" />
            <rect x="1000" y="430" width="80" height="100" />
            <rect x="1080" y="400" width="50" height="130" />
            <rect x="1130" y="450" width="70" height="80" />
          </g>
          {/* close towers */}
          <g fill="url(#auth-tower)">
            <rect x="20" y="500" width="120" height="300" />
            <rect x="140" y="450" width="90" height="350" />
            <rect x="230" y="540" width="140" height="260" />
            <rect x="370" y="480" width="100" height="320" />
            <rect x="470" y="520" width="80" height="280" />
            <rect x="550" y="460" width="120" height="340" />
            <rect x="670" y="510" width="100" height="290" />
            <rect x="770" y="475" width="90" height="325" />
            <rect x="860" y="540" width="130" height="260" />
            <rect x="990" y="490" width="100" height="310" />
            <rect x="1090" y="525" width="110" height="275" />
          </g>
          {/* lit windows — cyan */}
          <g fill="#36e8e0">
            {Array.from({ length: 80 }).map((_, i) => {
              const x = 30 + (i * 13.5) % 1170;
              const y = 510 + ((i * 23) % 270);
              const w = 3, h = 3;
              return <rect key={'c'+i} x={x} y={y} width={w} height={h} opacity={0.7 + (i % 3) * 0.1} />;
            })}
          </g>
          {/* lit windows — magenta */}
          <g fill="#ff5fd4">
            {Array.from({ length: 30 }).map((_, i) => {
              const x = 60 + (i * 37) % 1140;
              const y = 530 + ((i * 41) % 240);
              return <rect key={'m'+i} x={x} y={y} width={3} height={3} opacity="0.85" />;
            })}
          </g>
          {/* lit windows — yellow */}
          <g fill="#ffe255">
            {Array.from({ length: 18 }).map((_, i) => {
              const x = 100 + (i * 61) % 1080;
              const y = 560 + ((i * 53) % 200);
              return <rect key={'y'+i} x={x} y={y} width={3} height={3} opacity="0.8" />;
            })}
          </g>
          {/* foreground antennae / spires */}
          <g stroke="#36e8e0" strokeWidth="1" opacity="0.5">
            <line x1="80" y1="500" x2="80" y2="430" />
            <line x1="285" y1="540" x2="285" y2="460" />
            <line x1="600" y1="460" x2="600" y2="380" />
            <line x1="920" y1="540" x2="920" y2="450" />
          </g>
          {/* drone trail */}
          <g stroke="#ff5fd4" strokeWidth="1.5" fill="none" opacity="0.6">
            <line x1="200" y1="120" x2="450" y2="120" strokeDasharray="2,4" />
            <circle cx="450" cy="120" r="3" fill="#ff5fd4" />
          </g>
          {/* ground reflection grid */}
          <g stroke="#36e8e0" strokeWidth="1" opacity="0.18">
            <line x1="0" y1="650" x2="1200" y2="650" />
            <line x1="0" y1="700" x2="1200" y2="700" />
            <line x1="0" y1="750" x2="1200" y2="750" />
            {Array.from({ length: 14 }).map((_, i) => {
              const cx = 600;
              const offset = (i - 7) * 200;
              return <line key={'p'+i} x1={cx + offset * 0.3} y1="600" x2={cx + offset} y2="800" />;
            })}
          </g>
        </svg>
      </div>

      <div className="auth-overlay-grid" />
      <div className="auth-scanline" />

      {/* Mascot pattern layer behind the card */}
      <div className="auth-mascot-layer">
        <MascotPattern density="medium" tint="magenta" opacity={0.16} />
      </div>

      {/* Featured totem to the side of the form */}
      <div className="auth-mascot-corner" style={{ left: 60, top: '50%', transform: 'translateY(-50%)' }}>
        <MascotTotem src="assets/deviling.jpg" label="GUILD TOTEM" sub="DEVILING-CLASS" />
      </div>
      <div className="auth-mascot-corner" style={{ right: 80, bottom: 80, transform: 'rotate(-8deg)' }}>
        <Mascot src="assets/poring.jpg" size={84} label="PORING-001" hue={340} />
      </div>
      <div className="auth-mascot-corner" style={{ right: 200, top: 140, transform: 'rotate(12deg)' }}>
        <Mascot src="assets/ghostring.jpg" size={64} label="GHOSTRING" hue={220} />
      </div>
      <div className="auth-mascot-corner" style={{ left: 320, bottom: 140, transform: 'rotate(6deg)' }}>
        <Mascot src="assets/poring-3.jpg" size={56} label="PR.03" hue={340} />
      </div>

      <div className="auth-card panel-corners">
        <span className="c-tr" /><span className="c-bl" />
        <div className="auth-brand">
          <div className="brand-logo" style={{ width: 36, height: 36, fontSize: 13 }}>D1</div>
          <div>
            <div className="brand-name" style={{ fontSize: 14 }}>DAYONE//GUILD</div>
            <div className="brand-sub">v2.4.0 · iRO chaos</div>
          </div>
        </div>

        <div className="auth-tabs">
          <button className={'auth-tab' + (mode === 'login' ? ' active' : '')} onClick={() => onSwitch('login')}>[01] LOGIN</button>
          <button className={'auth-tab' + (mode === 'register' ? ' active' : '')} onClick={() => onSwitch('register')}>[02] REGISTER</button>
        </div>

        {mode === 'login' ? <LoginForm /> : <RegisterForm />}

        <div className="auth-foot">
          <div className="ascii">{'═'.repeat(46)}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '.18em' }}>
            <span>SVR: CHAOS-EU · 247 ON</span>
            <span className="acc">SECURE TUNNEL ●</span>
          </div>
        </div>
      </div>

      <div className="auth-corner-tl">
        <div className="ascii">┌─ NODE-7A ────</div>
        <div style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '.2em', marginTop: 4 }}>// authentication terminal</div>
        <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '.2em', marginTop: 2 }}>// uptime 14d 02:45:18</div>
      </div>
      <div className="auth-corner-br">
        <div style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '.2em', textAlign: 'right' }}>// kernel 6.4.2</div>
        <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '.2em', textAlign: 'right' }}>// TLS 1.3 · CHACHA20</div>
        <div className="ascii" style={{ textAlign: 'right' }}>──── DAYONE//OS ─┘</div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [u, setU] = React.useState('NEXUS_PRIME');
  const [p, setP] = React.useState('••••••••••••');
  return (
    <div className="auth-form">
      <div className="auth-field">
        <label>{'>'} HANDLE</label>
        <input value={u} onChange={(e) => setU(e.target.value)} spellCheck="false" />
      </div>
      <div className="auth-field">
        <label>{'>'} PASSCODE</label>
        <input type="password" value={p} onChange={(e) => setP(e.target.value)} />
      </div>
      <div className="auth-field">
        <label>{'>'} 2FA TOKEN</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[3, 9, 7, 1, 4, 2].map((d, i) => (
            <input key={i} className="auth-otp" defaultValue={d} maxLength="1" />
          ))}
        </div>
      </div>
      <div className="auth-row">
        <label className="auth-check"><input type="checkbox" defaultChecked /> <span>persistent session</span></label>
        <a href="#" className="acc" style={{ fontSize: 10, letterSpacing: '.18em' }}>FORGOT?</a>
      </div>
      <button className="btn solid" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
        ▶ JACK IN
      </button>
      <div className="auth-divider"><span>OR</span></div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn ghost" style={{ flex: 1, justifyContent: 'center' }}>DISCORD</button>
        <button className="btn ghost" style={{ flex: 1, justifyContent: 'center' }}>STEAM</button>
      </div>
    </div>
  );
}

function RegisterForm() {
  return (
    <div className="auth-form">
      <div className="auth-field">
        <label>{'>'} CHARACTER NAME</label>
        <input placeholder="enter ingame name..." spellCheck="false" />
      </div>
      <div className="auth-field">
        <label>{'>'} HANDLE</label>
        <input placeholder="alias for the guild network..." spellCheck="false" />
      </div>
      <div className="auth-field">
        <label>{'>'} EMAIL</label>
        <input type="email" placeholder="contact@grid.net" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="auth-field">
          <label>{'>'} CLASS</label>
          <select className="auth-select">
            <option>Rune Knight</option><option>Guillotine X</option><option>Arch Bishop</option>
            <option>Royal Guard</option><option>Sorcerer</option><option>Mechanic</option>
            <option>Sura</option><option>Genetic</option><option>Ranger</option><option>Warlock</option>
          </select>
        </div>
        <div className="auth-field">
          <label>{'>'} LEVEL</label>
          <input defaultValue="175" />
        </div>
      </div>
      <div className="auth-field">
        <label>{'>'} PASSCODE</label>
        <input type="password" placeholder="min 12 chars · alphanum + sym" />
      </div>
      <div className="auth-field">
        <label>{'>'} INVITE CODE</label>
        <input placeholder="DAYONE-XXXX-XXXX" defaultValue="DAYONE-7F4A-9C21" />
      </div>
      <label className="auth-check" style={{ marginTop: 4 }}>
        <input type="checkbox" /> <span>I consent to the guild charter & WoE comms protocol</span>
      </label>
      <button className="btn solid" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
        ▶ INITIALIZE PROFILE
      </button>
    </div>
  );
}

function AdminConsole() {
  const { MEMBERS } = window.GUILD_DATA;
  const pending = [
    { name: 'CRYO_MARU',   cls: 'CR', lvl: 162, when: '2h ago', code: 'DAYONE-A1F4' },
    { name: 'SHIN.NULL',   cls: 'AB', lvl: 168, when: '5h ago', code: 'DAYONE-B22D' },
    { name: 'NEKO_ZX',     cls: 'GX', lvl: 158, when: '1d ago', code: 'DAYONE-9C7E' },
  ];
  const audit = [
    { t: '23:42', who: 'NEXUS_PRIME', act: 'PROMOTE',  tgt: 'KIRA_SHARDS → Veteran' },
    { t: '23:18', who: 'AURELIA.exe', act: 'KICK',     tgt: 'AFK_PHANTOM (90d inactive)' },
    { t: '22:55', who: 'NEXUS_PRIME', act: 'CONFIG',   tgt: 'DKP weekly cap → 1200' },
    { t: '22:30', who: 'VOID_REAVER', act: 'DEPLOY',   tgt: 'WoE-T2 plan v3.2 published' },
    { t: '21:14', who: 'NEXUS_PRIME', act: 'TREASURY', tgt: '−420M Z (cards purchase)' },
    { t: '20:48', who: 'AURELIA.exe', act: 'INVITE',   tgt: 'DAYONE-7F4A-9C21 generated' },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            <span className="glitch" data-text="ADMIN CONSOLE">ADMIN CONSOLE</span>
            <span className="tag">// ROOT</span>
          </h1>
          <div className="page-sub">// privileged ops · audit trail · guild config</div>
        </div>
        <div className="page-actions">
          <button className="btn ghost">⤓ AUDIT LOG</button>
          <button className="btn warn">⚠ EMERGENCY BRDCST</button>
          <button className="btn solid">SAVE CONFIG</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label"><span>PENDING APPS</span><span className="delta">+3</span></div><div className="kpi-value acc3">{pending.length}</div></div>
        <div className="kpi alt"><div className="kpi-label"><span>FLAGGED</span></div><div className="kpi-value acc2">2</div></div>
        <div className="kpi alt2"><div className="kpi-label"><span>AUDIT EVENTS 24H</span></div><div className="kpi-value">{audit.length * 8}</div></div>
        <div className="kpi alt3"><div className="kpi-label"><span>UPTIME</span></div><div className="kpi-value acc4">99.94<span className="unit">%</span></div></div>
      </div>

      <div className="grid-2">
        <div className="stack">
          <div className="panel panel-corners glow">
            <span className="c-tr" /><span className="c-bl" />
            <PanelHead title="PENDING APPLICATIONS" meta={`// ${pending.length} awaiting review`} />
            <table className="tbl">
              <thead><tr><th>APPLICANT</th><th>CLASS</th><th>LV</th><th>INVITE CODE</th><th>WHEN</th><th>ACTION</th></tr></thead>
              <tbody>
                {pending.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <div className="mem">
                        <Avatar name={p.name} cls={p.cls} size={28} />
                        <div className="mem-meta">
                          <span className="mem-name">{p.name}</span>
                          <span className="mem-id">PENDING #{(1000+i).toString(16).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td><ClassChip cls={p.cls} /></td>
                    <td className="acc3">{p.lvl}</td>
                    <td className="dim" style={{ fontSize: 10 }}>{p.code}</td>
                    <td className="dim">{p.when}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn sm solid">✓</button>
                        <button className="btn sm danger">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel panel-corners">
            <span className="c-tr" /><span className="c-bl" />
            <PanelHead title="AUDIT TRAIL" meta="// last 24h" right={<button className="btn sm ghost">↓ EXPORT</button>} />
            <div style={{ fontSize: 11, lineHeight: 1.7 }}>
              {audit.map((a, i) => (
                <div key={i} className="log-line" style={{ gridTemplateColumns: '60px 100px 90px 1fr' }}>
                  <span className="log-time">{a.t}</span>
                  <span className="acc">{a.who}</span>
                  <span className={'log-tag ' + (a.act === 'KICK' ? 'woe' : a.act === 'PROMOTE' ? 'lvl' : a.act === 'CONFIG' ? 'sys' : a.act === 'TREASURY' ? 'gxp' : 'join')}>{a.act}</span>
                  <span className="log-msg">{a.tgt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="panel panel-corners">
            <span className="c-tr" /><span className="c-bl" />
            <PanelHead title="ROLE PERMISSIONS" meta="// matrix" />
            <table className="tbl" style={{ fontSize: 10 }}>
              <thead>
                <tr><th></th><th>VIEW</th><th>EDIT</th><th>KICK</th><th>WOE</th></tr>
              </thead>
              <tbody>
                {['GuildMaster','Officer','Veteran','Member','Recruit'].map((r, i) => (
                  <tr key={r}>
                    <td className={i === 0 ? 'acc3' : ''} style={{ fontWeight: 600 }}>{r.toUpperCase()}</td>
                    <td className="acc4">●</td>
                    <td className={i < 2 ? 'acc4' : 'dim'}>{i < 2 ? '●' : '○'}</td>
                    <td className={i < 2 ? 'acc4' : 'dim'}>{i < 2 ? '●' : '○'}</td>
                    <td className={i < 3 ? 'acc4' : 'dim'}>{i < 3 ? '●' : '○'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel panel-corners">
            <span className="c-tr" /><span className="c-bl" />
            <PanelHead title="GUILD CONFIG" meta="// live" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
              {[
                ['Guild name', 'DAYONE//GUILD'],
                ['Server', 'CHAOS-EU'],
                ['Recruit cap', '256 / 256'],
                ['DKP weekly cap', '1200'],
                ['Auto-kick inactive', '90 days'],
                ['WoE auto-deploy', 'enabled'],
                ['Discord webhook', 'connected ●'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--line)' }}>
                  <span className="dim" style={{ letterSpacing: '.1em' }}>{k}</span>
                  <span className="acc" style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <button className="btn sm">EDIT</button>
              <button className="btn sm warn">RESET DKP</button>
              <button className="btn sm danger">PURGE INACTIVE</button>
            </div>
          </div>

          <div className="panel panel-corners">
            <span className="c-tr" /><span className="c-bl" />
            <PanelHead title="SYSTEM HEALTH" meta="// nodes" />
            <div style={{ fontSize: 11 }}>
              {[
                ['API gateway', 'OK', 99.99],
                ['Database', 'OK', 99.94],
                ['Discord bridge', 'OK', 100],
                ['Game sync', 'DEGRADED', 92.4],
                ['Notifications', 'OK', 99.78],
              ].map(([n, s, p]) => (
                <div key={n} style={{ display: 'grid', gridTemplateColumns: '1fr auto 60px', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed var(--line)' }}>
                  <span className="dim">{n}</span>
                  <span className={s === 'OK' ? 'acc4' : 'acc3'} style={{ fontSize: 9, letterSpacing: '.18em' }}>● {s}</span>
                  <Bar value={p} max={100} kind={s === 'OK' ? 'sp' : 'xp'} showText={false} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AuthShell, LoginForm, RegisterForm, AdminConsole });
