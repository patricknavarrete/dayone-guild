// Dashboard screen

function Kpi({ label, value, unit, delta, neg, spark, alt }) {
  return (
    <div className={'kpi' + (alt ? ' ' + alt : '')}>
      <div className="kpi-label">
        <span>{label}</span>
        {delta && <span className={'delta' + (neg ? ' neg' : '')}>{delta}</span>}
      </div>
      <div className="kpi-value count-up">
        {value}{unit && <span className="unit">{unit}</span>}
      </div>
      <div className="kpi-spark">
        {spark.map((h, i) => <span key={i} style={{ height: h + '%' }} />)}
      </div>
    </div>
  );
}

function Dashboard() {
  const { MEMBERS, ACTIVITY, CALENDAR, WOE_PARTIES, PARTIES, CLASS_INFO } = window.GUILD_DATA;
  const online = MEMBERS.filter(m => m.status === 'online' || m.status === 'combat').length;
  const top = [...MEMBERS].sort((a, b) => b.gxp - a.gxp).slice(0, 5);
  const memberByName = (n) => MEMBERS.find(m => m.name === n);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            <span className="glitch" data-text="DASHBOARD">DASHBOARD</span>
            <span className="tag">// COMMAND</span>
          </h1>
          <div className="page-sub">// guild ops · 24h overview · auto-sync 30s</div>
        </div>
        <div className="page-actions">
          <button className="btn ghost">↻ REFRESH</button>
          <button className="btn">＋ INVITE</button>
          <button className="btn solid">DEPLOY WOE</button>
        </div>
      </div>

      <Ticker />

      <div className="kpi-grid">
        <Kpi label="MEMBERS" value="247" unit="/256" delta="+4 wk" spark={[20,35,28,50,42,68,55,80,75,90,82,100]} />
        <Kpi label="ONLINE NOW" value={online} unit="" delta="+12%" alt="alt3" spark={[30,45,38,55,62,48,72,68,85,78,92,88]} />
        <Kpi label="GUILD XP" value="2.4M" delta="+218k wk" alt="alt2" spark={[10,22,18,40,32,50,55,68,72,82,88,98]} />
        <Kpi label="TREASURY" value="4.82B" unit=" Z" delta="-2.1%" neg alt="alt" spark={[60,72,68,80,78,72,68,62,58,52,48,42]} />
      </div>

      <div className="panel panel-corners glow" style={{ marginBottom: 16 }}>
            <span className="c-tr" /><span className="c-bl" />
            <PanelHead title="MY GUILD LEAGUE PARTY" meta={`// ${PARTIES[0].id} · ${PARTIES[0].tag}`} right={<span className={'party-tag' + (PARTIES[0].status === 'full' ? ' full' : '')}>{PARTIES[0].status === 'full' ? '◉ FULL' : '◌ OPEN'}</span>} />
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18, alignItems: 'stretch' }}>
              <div className="party-banner" style={{ position: 'relative', minHeight: 220, border: '1px solid var(--line-2)', overflow: 'hidden',
                background:
                  'linear-gradient(135deg, rgba(54,232,224,0.18), transparent 60%), linear-gradient(220deg, rgba(255,95,212,0.22), transparent 55%),'+
                  'repeating-linear-gradient(90deg, transparent 0 22px, rgba(54,232,224,0.05) 22px 23px),'+
                  'repeating-linear-gradient(0deg, transparent 0 22px, rgba(54,232,224,0.05) 22px 23px),'+
                  'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), transparent 40%),'+
                  'linear-gradient(180deg, #1a2336, #0f1626)' }}>
                <svg viewBox="0 0 200 220" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.85 }} preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#ff5fd4" stopOpacity="0.4" />
                      <stop offset="0.5" stopColor="#36e8e0" stopOpacity="0.2" />
                      <stop offset="1" stopColor="#0f1626" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="city" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#1a2336" />
                      <stop offset="1" stopColor="#070b14" />
                    </linearGradient>
                  </defs>
                  <rect width="200" height="140" fill="url(#sky)" />
                  <circle cx="150" cy="50" r="22" fill="#ff5fd4" opacity="0.55" />
                  <circle cx="150" cy="50" r="34" fill="#ff5fd4" opacity="0.12" />
                  {/* far skyline */}
                  <g fill="#1a2336" opacity="0.85">
                    <rect x="0" y="90" width="24" height="50" />
                    <rect x="22" y="75" width="18" height="65" />
                    <rect x="40" y="95" width="22" height="45" />
                    <rect x="62" y="60" width="14" height="80" />
                    <rect x="76" y="82" width="20" height="58" />
                    <rect x="96" y="70" width="16" height="70" />
                    <rect x="112" y="88" width="24" height="52" />
                    <rect x="136" y="66" width="16" height="74" />
                    <rect x="152" y="84" width="22" height="56" />
                    <rect x="174" y="72" width="26" height="68" />
                  </g>
                  {/* close towers */}
                  <g fill="url(#city)">
                    <rect x="10" y="110" width="30" height="110" />
                    <rect x="42" y="95" width="22" height="125" />
                    <rect x="66" y="120" width="34" height="100" />
                    <rect x="100" y="100" width="28" height="120" />
                    <rect x="130" y="118" width="24" height="102" />
                    <rect x="156" y="88" width="30" height="132" />
                    <rect x="184" y="112" width="20" height="108" />
                  </g>
                  {/* lit windows */}
                  <g fill="#36e8e0" opacity="0.85">
                    <rect x="14" y="118" width="3" height="3" /><rect x="22" y="118" width="3" height="3" /><rect x="30" y="126" width="3" height="3" /><rect x="14" y="140" width="3" height="3" /><rect x="30" y="152" width="3" height="3" /><rect x="22" y="168" width="3" height="3" />
                    <rect x="46" y="110" width="3" height="3" /><rect x="54" y="122" width="3" height="3" /><rect x="46" y="144" width="3" height="3" /><rect x="58" y="160" width="3" height="3" />
                    <rect x="108" y="118" width="3" height="3" /><rect x="118" y="130" width="3" height="3" /><rect x="108" y="148" width="3" height="3" /><rect x="118" y="166" width="3" height="3" /><rect x="108" y="184" width="3" height="3" />
                    <rect x="160" y="100" width="3" height="3" /><rect x="170" y="112" width="3" height="3" /><rect x="178" y="128" width="3" height="3" /><rect x="160" y="148" width="3" height="3" /><rect x="170" y="170" width="3" height="3" />
                  </g>
                  <g fill="#ff5fd4" opacity="0.85">
                    <rect x="70" y="132" width="3" height="3" /><rect x="80" y="148" width="3" height="3" /><rect x="92" y="166" width="3" height="3" /><rect x="134" y="130" width="3" height="3" /><rect x="144" y="154" width="3" height="3" />
                  </g>
                  {/* drone */}
                  <g stroke="#ffe255" strokeWidth="1" fill="none" opacity="0.7">
                    <line x1="170" y1="30" x2="196" y2="30" />
                    <circle cx="196" cy="30" r="1.5" fill="#ffe255" />
                  </g>
                </svg>
                <div style={{ position: 'absolute', top: 8, left: 10, fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '.2em' }}>
                  // {PARTIES[0].name}
                </div>
                {/* Featured guild totem mascot */}
                <div style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%) scale(0.75)' }}>
                  <MascotTotem src="assets/deviling.jpg" label={PARTIES[0].name} sub={PARTIES[0].tag} />
                </div>
                {/* Pattern band along bottom */}
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 22, height: 36, opacity: 0.7 }}>
                  <div style={{ display: 'flex', gap: 4, padding: '0 8px', height: '100%', overflow: 'hidden' }}>
                    {['assets/poring.jpg','assets/poring-3.jpg','assets/poring-5.jpg','assets/ghostring.jpg','assets/poring-7.jpg','assets/deviling.jpg','assets/poring-2.jpg','assets/poring-4.jpg'].map((src, i) => (
                      <Mascot key={i} src={src} size={32} hue={i % 3 === 2 ? 220 : 340} />
                    ))}
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--cyan)', letterSpacing: '.2em' }}>
                  <span>SECTOR-7 · PRONTERA</span>
                  <span className="acc2">PWR {Math.floor(PARTIES[0].members.length * 1240 + 1200)}</span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 11 }}>
                  <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>LEADER</div><div className="acc3">{PARTIES[0].leader}</div></div>
                  <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>SIZE</div><div className="acc4">{PARTIES[0].members.length}/6</div></div>
                  <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>OBJ</div><div className="acc">{PARTIES[0].tag}</div></div>
                </div>
                {PARTIES[0].members.map((memName, i) => {
                  const mem = memberByName(memName);
                  if (!mem) return null;
                  const info = CLASS_INFO[mem.cls];
                  return (
                    <div key={i} className="party-slot">
                      <Avatar name={mem.name} cls={mem.cls} size={24} />
                      <span className="slot-name">{mem.name}</span>
                      {mem.name === PARTIES[0].leader && <span className="slot-leader">★</span>}
                      <span className="slot-class">{info.short} · LV {mem.lvl}</span>
                      <Bar value={mem.hp} max={100} kind="hp" showText={false} />
                    </div>
                  );
                })}
              </div>
            </div>
      </div>

      <div className="grid-2">
        <div className="stack">
          <div className="panel panel-corners glow">
            <span className="c-tr" /><span className="c-bl" />
            <PanelHead
              title="ACTIVITY FEED"
              meta="// real-time"
              right={<span className="panel-meta acc">▣ live</span>}
            />
            <div className="log">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="log-line">
                  <span className="log-time">{a.time}</span>
                  <span className={'log-tag ' + a.tag}>{a.tag.toUpperCase()}</span>
                  <span className="log-msg">{a.msg}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel panel-corners">
            <span className="c-tr" /><span className="c-bl" />
            <PanelHead title="TOP CONTRIBUTORS" meta="// weekly GXP" right={<span className="panel-meta">▼ rank</span>} />
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>MEMBER</th>
                  <th>CLASS</th>
                  <th>GXP</th>
                  <th>WOE</th>
                  <th style={{ width: 130 }}>PROGRESS</th>
                </tr>
              </thead>
              <tbody>
                {top.map((m, i) => (
                  <tr key={m.id}>
                    <td><span className={'lb-rank' + (i < 3 ? ' r' + (i+1) : '')}>{String(i+1).padStart(2, '0')}</span></td>
                    <td><Member m={m} size={28} /></td>
                    <td><ClassChip cls={m.cls} /></td>
                    <td className="acc3" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{m.gxp.toLocaleString()}</td>
                    <td>{m.woe}</td>
                    <td><Bar value={Math.min(99, m.gxp/130)} max={100} kind="xp" showText={false} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <div className="panel panel-corners">
            <span className="c-tr" /><span className="c-bl" />
            <PanelHead title="WOE-T2 BRIEF" meta="// 02:45:00" right={<span className="panel-meta acc2">● ARMED</span>} />
            <div className="woe-map">
              <div className="scan-bar" />
              <div className="castle owned" style={{ top: 24, left: 28 }}>
                <div><b>P-1</b>PRONTERA</div>
              </div>
              <div className="castle" style={{ top: 60, right: 32 }}>
                <div><b>G-2</b>GEFFEN</div>
              </div>
              <div className="castle owned" style={{ bottom: 28, left: 80 }}>
                <div><b>A-1</b>ALDEBRN</div>
              </div>
              <div className="castle" style={{ bottom: 36, right: 40 }}>
                <div><b>P-3</b>PAYON</div>
              </div>
              <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '.2em' }}>
                MAP // CHAOS-EU
              </div>
              <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 9, color: 'var(--cyan)', letterSpacing: '.2em' }}>
                2 OWNED · 2 TARGET
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, fontSize: 10, letterSpacing: '.15em' }}>
              {WOE_PARTIES.map(p => (
                <div key={p.id} style={{ padding: '6px 8px', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
                  <span><span className="acc">{p.id}</span> {p.name}</span>
                  <span className="dim">{p.members}/6</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel panel-corners">
            <span className="c-tr" /><span className="c-bl" />
            <PanelHead title="UPCOMING" meta="// calendar" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CALENDAR.map((c, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '46px 1fr auto', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed var(--line)' }}>
                  <div style={{ textAlign: 'center', borderLeft: '2px solid ' + (c.urgent ? 'var(--red)' : 'var(--cyan)'), paddingLeft: 8 }}>
                    <div style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '.15em' }}>{c.day}</div>
                    <div style={{ fontSize: 16, color: 'var(--ink)', fontWeight: 700 }}>{c.date}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--ink)' }}>{c.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '.1em' }}>{c.type.toUpperCase()} · {c.time}</div>
                  </div>
                  {c.urgent && <span className="bdg combat"><span className="dot" />T-{i+1}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="panel panel-corners">
            <span className="c-tr" /><span className="c-bl" />
            <PanelHead title="GUILD STATUS" meta="// system" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="dim">GUILD LEVEL</span>
                <Bar value={62} max={100} kind="xp" showText={false} />
                <span className="acc3" style={{ fontWeight: 700, minWidth: 40, textAlign: 'right' }}>LV 24</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="dim">EMBLEM EXP</span>
                <Bar value={42} max={100} kind="sp" showText={false} />
                <span className="acc" style={{ minWidth: 40, textAlign: 'right' }}>42%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="dim">DONATION</span>
                <Bar value={72} max={100} kind="" showText={false} />
                <span className="acc4" style={{ minWidth: 40, textAlign: 'right' }}>72%</span>
              </div>
              <div className="divider" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>ALLIANCE</div><div className="acc">3 GUILDS</div></div>
                <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>RIVALS</div><div className="acc2">5 GUILDS</div></div>
                <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>CASTLES</div><div className="acc4">2 OWNED</div></div>
                <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>WIN RATE</div><div className="acc3">68.4%</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
