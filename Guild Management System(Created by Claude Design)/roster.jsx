// Roster screen

function Roster() {
  const { MEMBERS, ROLES } = window.GUILD_DATA;
  const [filter, setFilter] = React.useState('ALL');
  const [sort, setSort] = React.useState('gxp');
  const [selected, setSelected] = React.useState('M-001');

  const filtered = MEMBERS
    .filter(m => filter === 'ALL' || m.role === filter)
    .sort((a, b) => {
      if (sort === 'gxp') return b.gxp - a.gxp;
      if (sort === 'lvl') return b.lvl - a.lvl;
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'woe') return b.woe - a.woe;
      return 0;
    });

  const sel = MEMBERS.find(m => m.id === selected);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            <span className="glitch" data-text="ROSTER">ROSTER</span>
            <span className="tag">// PERSONNEL</span>
          </h1>
          <div className="page-sub">// 247 active · 4 officers · 9 slots open</div>
        </div>
        <div className="page-actions">
          <button className="btn ghost">⤓ EXPORT</button>
          <button className="btn">＋ RECRUIT</button>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="dim" style={{ fontSize: 10, letterSpacing: '.2em' }}>FILTER:</div>
        {['ALL', ...ROLES].map(r => (
          <button
            key={r}
            className={'btn sm ' + (filter === r ? 'solid' : 'ghost')}
            onClick={() => setFilter(r)}>
            {r.toUpperCase()}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <div className="dim" style={{ fontSize: 10, letterSpacing: '.2em' }}>SORT:</div>
        {[['gxp','GXP'],['lvl','LEVEL'],['woe','WOE'],['name','NAME']].map(([k, l]) => (
          <button key={k} className={'btn sm ' + (sort === k ? 'solid' : 'ghost')} onClick={() => setSort(k)}>{l}</button>
        ))}
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="panel panel-corners">
          <span className="c-tr" /><span className="c-bl" />
          <PanelHead title="MEMBER LIST" meta={`// ${filtered.length} results`} right={<span className="panel-meta">↕ {sort.toUpperCase()}</span>} />
          <div style={{ maxHeight: 560, overflowY: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>MEMBER</th>
                  <th>CLASS</th>
                  <th>LV</th>
                  <th>GXP</th>
                  <th>WOE</th>
                  <th>STATUS</th>
                  <th style={{ width: 110 }}>HP/SP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id} className={selected === m.id ? 'selected' : ''} onClick={() => setSelected(m.id)}>
                    <td><span className={'lb-rank' + (i < 3 && sort === 'gxp' ? ' r' + (i+1) : '')}>{String(i+1).padStart(2, '0')}</span></td>
                    <td><Member m={m} size={28} /></td>
                    <td><ClassChip cls={m.cls} /></td>
                    <td className="acc3" style={{ fontVariantNumeric: 'tabular-nums' }}>{m.lvl}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{m.gxp.toLocaleString()}</td>
                    <td>{m.woe}</td>
                    <td><StatusBadge status={m.status} /></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Bar value={m.hp} max={100} kind="hp" showText={false} />
                        <Bar value={m.sp} max={100} kind="sp" showText={false} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          {sel && (
            <div className="panel panel-corners glow">
              <span className="c-tr" /><span className="c-bl" />
              <PanelHead title="MEMBER PROFILE" meta={`// ${sel.id}`} right={<StatusBadge status={sel.status} />} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <Avatar name={sel.name} cls={sel.cls} size={64} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '.05em', color: 'var(--ink)' }}>{sel.name}</div>
                  <div className="dim" style={{ fontSize: 10, letterSpacing: '.2em' }}>{sel.role.toUpperCase()} · joined {sel.joined}</div>
                  <div style={{ marginTop: 4 }}><ClassChip cls={sel.cls} /></div>
                </div>
              </div>
              <div className="divider" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11 }}>
                <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>LEVEL</div><div className="acc3" style={{ fontSize: 18, fontWeight: 700 }}>{sel.lvl}</div></div>
                <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>GUILD XP</div><div className="acc" style={{ fontSize: 18, fontWeight: 700 }}>{sel.gxp.toLocaleString()}</div></div>
                <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>WOE PTS</div><div className="acc2" style={{ fontSize: 18, fontWeight: 700 }}>{sel.woe}</div></div>
                <div><div className="dim" style={{ fontSize: 9, letterSpacing: '.2em' }}>DKP</div><div className="acc4" style={{ fontSize: 18, fontWeight: 700 }}>{sel.dkp.toLocaleString()}</div></div>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="dim" style={{ fontSize: 10, letterSpacing: '.15em' }}>HP</span>
                  <Bar value={sel.hp} max={100} kind="hp" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="dim" style={{ fontSize: 10, letterSpacing: '.15em' }}>SP</span>
                  <Bar value={sel.sp} max={100} kind="sp" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="dim" style={{ fontSize: 10, letterSpacing: '.15em' }}>XP</span>
                  <Bar value={(sel.gxp % 1000)} max={1000} kind="xp" />
                </div>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn sm">MESSAGE</button>
                <button className="btn sm ghost">PROMOTE</button>
                <button className="btn sm danger">KICK</button>
              </div>
            </div>
          )}

          <div className="panel panel-corners">
            <span className="c-tr" /><span className="c-bl" />
            <PanelHead title="CLASS DISTRIBUTION" meta="// 247 mbrs" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(window.GUILD_DATA.CLASS_INFO).slice(0, 8).map(([k, info]) => {
                const count = MEMBERS.filter(m => m.cls === k).length + Math.floor(Math.random() * 14 + 4);
                return (
                  <div key={k} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 30px', gap: 8, alignItems: 'center', fontSize: 11 }}>
                    <span className={'chip ' + info.cls} style={{ justifyContent: 'center' }}>{info.short}</span>
                    <div className="bar"><div className="bar-fill" style={{ width: (count * 4) + '%', background: info.bg, boxShadow: '0 0 6px ' + info.bg }} /></div>
                    <span className="dim" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Roster = Roster;
