// Guild Parties screen

function GuildLeagueParties({ layout = 'grid' }) {
  const { PARTIES, MEMBERS } = window.GUILD_DATA;
  const [active, setActive] = React.useState('GLP-01');
  const sel = PARTIES.find(p => p.id === active);
  const memberByName = (n) => MEMBERS.find(m => m.name === n);

  const renderPartyCard = (p) => (
    <div
      key={p.id}
      className={'party' + (p.status === 'full' ? ' full' : '') + (p.status === 'locked' ? ' locked' : '')}
      onClick={() => setActive(p.id)}
      style={{ cursor: 'pointer', outline: active === p.id ? '1px solid var(--cyan)' : 'none' }}>
      <div className="party-head">
        <div>
          <div className="party-name">{p.name}</div>
          <div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>{p.id} · {p.tag}</div>
        </div>
        <div className={'party-tag' + (p.status === 'full' ? ' full' : p.status === 'locked' ? ' locked' : '')}>
          {p.status === 'full' ? '◉ FULL' : p.status === 'locked' ? '⚿ LOCK' : '◌ OPEN'}
        </div>
      </div>
      {Array.from({ length: 6 }).map((_, i) => {
        const memName = p.members[i];
        const mem = memName && memberByName(memName);
        if (!mem) {
          return (
            <div key={i} className="party-slot empty">
              <span className="slot-dot" />
              <span style={{ flex: 1 }}>// slot {i+1} empty</span>
              <span className="dim">--</span>
            </div>
          );
        }
        const info = window.GUILD_DATA.CLASS_INFO[mem.cls];
        return (
          <div key={i} className="party-slot">
            <span className="slot-dot" style={{ background: info.bg, boxShadow: '0 0 6px ' + info.bg }} />
            <span className="slot-name">{mem.name}</span>
            {mem.name === p.leader && <span className="slot-leader">★</span>}
            <span className="slot-class">{info.short} · {mem.lvl}</span>
          </div>
        );
      })}
      <div className="party-meta">
        <span>LEAD <b>{p.leader.split('_')[0]}</b></span>
        <span>SIZE <b>{p.members.length}/6</b></span>
        <span>POWER <b>{Math.floor(p.members.length * 1240 + 1200)}</b></span>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            <span className="glitch" data-text="GUILD LEAGUE PARTIES">GUILD LEAGUE PARTIES</span>
            <span className="tag">// GLP</span>
          </h1>
          <div className="page-sub">// {PARTIES.length} active · {PARTIES.filter(p => p.status === 'full').length} full · {PARTIES.filter(p => p.status === 'open').length} recruiting</div>
        </div>
        <div className="page-actions">
          <button className="btn ghost">⟲ AUTO-BALANCE</button>
          <button className="btn">＋ NEW PARTY</button>
          <button className="btn solid">SYNC TO GAME</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="panel" style={{ padding: 12 }}>
          <div className="kpi-label"><span>ACTIVE PARTIES</span><span className="delta">+2 today</span></div>
          <div className="kpi-value">{PARTIES.length}<span className="unit">/12</span></div>
        </div>
        <div className="panel" style={{ padding: 12 }}>
          <div className="kpi-label"><span>SLOTS FILLED</span><span className="delta">+9</span></div>
          <div className="kpi-value acc">{PARTIES.reduce((s, p) => s + p.members.length, 0)}<span className="unit">/{PARTIES.length * 6}</span></div>
        </div>
        <div className="panel" style={{ padding: 12 }}>
          <div className="kpi-label"><span>AVG LEVEL</span><span className="delta">+0.4</span></div>
          <div className="kpi-value acc3">178.6</div>
        </div>
        <div className="panel" style={{ padding: 12 }}>
          <div className="kpi-label"><span>WEEKLY MVPs</span><span className="delta">+12</span></div>
          <div className="kpi-value acc2">42</div>
        </div>
      </div>

      {layout === 'grid' ? (
        <div className="party-grid">
          {PARTIES.map(renderPartyCard)}
        </div>
      ) : (
        <div className="grid-2" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
          <div className="stack">
            {PARTIES.map(renderPartyCard)}
          </div>
          {sel && (
            <div className="panel panel-corners glow" style={{ position: 'sticky', top: 0, alignSelf: 'start' }}>
              <span className="c-tr" /><span className="c-bl" />
              <PanelHead title={sel.name} meta={'// ' + sel.id} right={<span className={'party-tag' + (sel.status === 'full' ? ' full' : sel.status === 'locked' ? ' locked' : '')}>{sel.status.toUpperCase()}</span>} />
              <div style={{ fontSize: 11, color: 'var(--ink-dim)', marginBottom: 12 }}>
                Tag: <span className="acc">{sel.tag}</span> · Leader: <span className="acc3">{sel.leader}</span>
              </div>
              <div className="ascii">┌─{'─'.repeat(36)}┐</div>
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                {sel.members.map(n => {
                  const m = memberByName(n);
                  return m ? (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px dashed var(--line)' }}>
                      <Avatar name={m.name} cls={m.cls} size={26} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: 'var(--ink)' }}>{m.name}</div>
                        <div style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '.15em' }}>LV {m.lvl} · {window.GUILD_DATA.CLASS_INFO[m.cls].name}</div>
                      </div>
                      <Bar value={m.hp} max={100} kind="hp" showText={false} />
                    </div>
                  ) : null;
                })}
              </div>
              <div className="ascii">└─{'─'.repeat(36)}┘</div>
              <div className="divider" />
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn sm">EDIT</button>
                <button className="btn sm ghost">CLONE</button>
                <button className="btn sm warn">LOCK</button>
                <button className="btn sm danger">DISBAND</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

window.GuildLeagueParties = GuildLeagueParties;
window.Parties = GuildLeagueParties;
