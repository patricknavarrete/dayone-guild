// Shared atoms

function Avatar({ name, cls, size = 32 }) {
  const info = window.GUILD_DATA.CLASS_INFO[cls];
  const initials = name.replace(/[^A-Z0-9]/gi, '').slice(0, 2).toUpperCase();
  return (
    <div className="mem-av" style={{ width: size, height: size, background: info?.bg || '#00fff0', fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function ClassChip({ cls }) {
  const info = window.GUILD_DATA.CLASS_INFO[cls];
  if (!info) return null;
  return <span className={'chip ' + info.cls}>{info.short} · {info.name}</span>;
}

function StatusBadge({ status }) {
  const map = {
    online:  { label: 'ONLINE',  cls: 'online' },
    afk:     { label: 'AFK',     cls: 'afk' },
    offline: { label: 'OFFLINE', cls: 'offline' },
    combat:  { label: 'COMBAT',  cls: 'combat' },
  };
  const s = map[status] || map.offline;
  return <span className={'bdg ' + s.cls}><span className="dot" />{s.label}</span>;
}

function Bar({ value, max = 100, kind = 'xp', showText = true }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 }}>
      <div className="bar"><div className={'bar-fill ' + kind} style={{ width: pct + '%' }} /></div>
      {showText && <span className="bar-label">{value}/{max}</span>}
    </div>
  );
}

function Member({ m, size = 32 }) {
  return (
    <div className="mem">
      <Avatar name={m.name} cls={m.cls} size={size} />
      <div className="mem-meta">
        <span className="mem-name">{m.name}</span>
        <span className="mem-id">{m.id} · LV {m.lvl}</span>
      </div>
    </div>
  );
}

function PanelHead({ title, meta, right }) {
  return (
    <div className="panel-head">
      <div className="panel-title">{title}{meta && <span className="panel-meta">{meta}</span>}</div>
      {right}
    </div>
  );
}

Object.assign(window, { Avatar, ClassChip, StatusBadge, Bar, Member, PanelHead });
