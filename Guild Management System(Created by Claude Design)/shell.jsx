// App shell: topbar, sidebar, statusbar, background field

function BgField() {
  return (
    <>
      <div className="bg-field" />
      <div className="bg-grid" />
      <div className="bg-noise" />
      <div className="bg-flicker" />
      <div className="bg-scanlines" />
      <div className="bg-vignette" />
    </>
  );
}

function Topbar({ onSearch }) {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const t = now.toTimeString().slice(0, 8);
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-logo">D1</div>
        <div>
          <div className="brand-name">DAYONE//GUILD</div>
          <div className="brand-sub">v2.4.0 · iRO chaos</div>
        </div>
      </div>
      <div className="topbar-center">
        <label className="search">
          <span className="search-prompt">{'>'}_</span>
          <input placeholder="search members, parties, castles..." onChange={(e) => onSearch && onSearch(e.target.value)} />
          <span className="search-key">⌘K</span>
        </label>
      </div>
      <div className="topbar-right">
        <div className="topbar-stat live"><span><span className="dot" />SERVER</span><b>247 ON</b></div>
        <div className="topbar-stat"><span>UPTIME</span><b style={{ fontVariantNumeric: 'tabular-nums' }}>{t}</b></div>
        <div className="topbar-stat"><span>WOE-T2</span><b className="acc3">02:45:00</b></div>
        <div className="user-chip">
          <div className="user-avatar">N</div>
          <div className="user-info">
            <span className="user-name">NEXUS_PRIME</span>
            <span className="user-role">Guild Master</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { section: 'COMMAND' },
  { id: 'dashboard',  label: 'Dashboard',     icon: '◆' },
  { id: 'roster',     label: 'Roster',        icon: '◇', badge: '247' },
  { id: 'parties',    label: 'Guild League Parties', icon: '⬢', badge: 'GLP', badgeStyle: 'alt' },
  { id: 'woe',        label: 'WoE Parties',   icon: '✦', badge: '2D', badgeStyle: '' },
  { section: 'PERSONNEL' },
  { id: 'attendance', label: 'Attendance',    icon: '◐' },
  { id: 'leaderboard',label: 'Leaderboard',   icon: '↑' },
  { id: 'officers',   label: 'Officers',      icon: '★' },
  { id: 'profile',    label: 'My Profile',    icon: '☉' },
  { section: 'SYSTEM' },
  { id: 'calendar',   label: 'Calendar',      icon: '▦' },
  { id: 'notif',      label: 'Notifications', icon: '◉', badge: '12', badgeStyle: 'dim' },
  { id: 'admin',      label: 'Admin Console', icon: '⚙' },
];

function Sidebar({ active, onChange }) {
  return (
    <div className="sidebar">
      {NAV_ITEMS.map((it, i) => {
        if (it.section) {
          return <div key={'s'+i} className="nav-section">{it.section}</div>;
        }
        return (
          <div key={it.id} className="nav" style={{ padding: 0 }}>
            <div
              className={'nav-item' + (active === it.id ? ' active' : '')}
              onClick={() => onChange(it.id)}
              style={{ marginLeft: 8, marginRight: 8 }}>
              <span className="nav-icon">{it.icon}</span>
              <span className="nav-label">{it.label}</span>
              {it.badge && (
                <span className={'nav-badge' + (it.badgeStyle ? ' ' + it.badgeStyle : '')}>{it.badge}</span>
              )}
            </div>
          </div>
        );
      })}
      <div className="sidebar-footer">
        <div className="sys-stat"><span>NETWORK</span><b>STABLE</b></div>
        <div className="sys-stat"><span>LATENCY</span><b>42ms</b></div>
        <div className="sys-stat"><span>GUILD CAP</span><b>247/256</b></div>
        <div className="sys-bar"><div className="scan-bar" /></div>
      </div>
    </div>
  );
}

function StatusBar({ active }) {
  return (
    <div className="statusbar">
      <div className="sb-cell ok"><span className="dot" />CONNECTED</div>
      <div className="sb-cell">CH: {active.toUpperCase()}</div>
      <div className="sb-cell accent">DKP SYNC: OK</div>
      <div className="sb-cell warn">3 PENDING APPLICATIONS</div>
      <div className="sb-spacer" />
      <div className="sb-cell">FPS 60</div>
      <div className="sb-cell">PING 42ms</div>
      <div className="sb-cell">REGION: CHAOS-EU</div>
      <div className="sb-cell accent">DAYONE//OS</div>
    </div>
  );
}

function Ticker() {
  const items = [
    { msg: <>WoE-T2 in <b>02:45:00</b> — castle <b>PRONTERA-1</b> contested</>, type: 'warn' },
    { msg: <><b>GLITCH_RIN</b> hit Lv 158 // first transcendence</> },
    { msg: <>Guild treasury: <b>4.82B Z</b> · weekly +218M</> },
    { msg: <><b>NULL DAEMONS</b> cleared Bio Lab F5 in 14:22</> },
    { msg: <>3 applications pending review</>, type: 'danger' },
    { msg: <>Officer meeting Thursday 22:00 — agenda posted</> },
    { msg: <>MVP timer: <b>Ifrit</b> respawn in 38m</> },
    { msg: <>Donation drive @ <b>72%</b> // 144 / 200 contributors</> },
  ];
  return (
    <div className="ticker">
      <div className="ticker-track">
        {[...items, ...items].map((it, i) => (
          <span key={i} className={'ticker-item' + (it.type ? ' ' + it.type : '')}>
            <span className="ticker-sep">// </span>{it.msg}
          </span>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { BgField, Topbar, Sidebar, StatusBar, Ticker });
