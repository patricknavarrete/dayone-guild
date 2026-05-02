// WoE Parties screen — minimal placeholder for other nav items

function WoeParties() {
  const { WOE_PARTIES, MEMBERS } = window.GUILD_DATA;
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            <span className="glitch" data-text="WOE PARTIES">WOE PARTIES</span>
            <span className="tag">// WAR OPS</span>
          </h1>
          <div className="page-sub">// next deployment T-02:45:00 · 4 squads armed</div>
        </div>
        <div className="page-actions">
          <button className="btn ghost">⤓ EXPORT</button>
          <button className="btn solid">DEPLOY ALL</button>
        </div>
      </div>

      <div className="grid-3">
        {WOE_PARTIES.map(p => (
          <div key={p.id} className="panel panel-corners glow">
            <span className="c-tr" /><span className="c-bl" />
            <PanelHead title={p.name} meta={'// ' + p.id} right={<span className="bdg combat"><span className="dot" />{p.role}</span>} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
              <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>LEADER</div><div className="acc3">{p.leader}</div></div>
              <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>TARGET</div><div className="acc2">{p.target}</div></div>
              <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>SIZE</div><div className="acc4">{p.members}/6</div></div>
              <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>READY</div><div className="acc">{Math.floor(p.members * 0.85)}/{p.members}</div></div>
            </div>
            <div className="divider" />
            <Bar value={p.members * 16} max={100} kind="xp" showText={false} />
            <div className="dim" style={{ fontSize: 9, letterSpacing: '.2em', marginTop: 6 }}>FORMATION ROLLOUT</div>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div className="panel panel-corners">
        <span className="c-tr" /><span className="c-bl" />
        <PanelHead title="WOE-T2 BATTLE PLAN" meta="// briefing locked" right={<span className="panel-meta acc2">● ARMED</span>} />
        <div style={{ fontSize: 11, color: 'var(--ink-dim)', lineHeight: 1.7 }}>
          <div className="ascii">{'═'.repeat(80)}</div>
          <div style={{ marginTop: 10 }}>
            <span className="acc">[OBJ-01]</span> BREAKER SQUAD pushes <b className="acc3">PRONTERA-1</b> emp room. Hold for 3 min, then split.<br />
            <span className="acc">[OBJ-02]</span> DEFENSE GRID anchors <b className="acc3">GEFFEN-2</b>. AB rotation every 90s.<br />
            <span className="acc">[OBJ-03]</span> GHOST RECON scout <b className="acc2">PAYON-3</b>, harass enemy GLP-PHANTOM.<br />
            <span className="acc">[OBJ-04]</span> NULL VANGUARD secondary push on <b className="acc3">ALDEBARAN-1</b> at T-15:00.
          </div>
          <div className="ascii">{'═'.repeat(80)}</div>
        </div>
      </div>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            <span className="glitch" data-text={title.toUpperCase()}>{title.toUpperCase()}</span>
            <span className="tag">// MODULE</span>
          </h1>
          <div className="page-sub">// integration pending</div>
        </div>
      </div>
      <div className="panel panel-corners glow" style={{ minHeight: 320, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <span className="c-tr" /><span className="c-bl" />
        <div>
          <div style={{ fontSize: 36, color: 'var(--cyan)', marginBottom: 12, letterSpacing: '.2em' }} className="glitch" data-text="//">//</div>
          <div className="dim" style={{ letterSpacing: '.25em', textTransform: 'uppercase', marginBottom: 6 }}>module: {title}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-dim)', maxWidth: 380, margin: '0 auto' }}>
            wiring pending // hook this up to your existing endpoint when ready.<br />
            preview the dashboard, roster, parties, and WoE modules from the sidebar.
          </div>
          <div style={{ marginTop: 18 }}>
            <button className="btn">LOAD MOCK DATA</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WoeParties, Placeholder });
