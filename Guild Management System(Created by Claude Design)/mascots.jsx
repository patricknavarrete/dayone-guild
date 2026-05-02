// Mascot pattern + decorative components

const MASCOTS = [
  { src: 'assets/poring.jpg',     name: 'PORING',     hue: 340, tier: 'common' },
  { src: 'assets/poring-2.jpg',   name: 'PORING.02',  hue: 340, tier: 'common' },
  { src: 'assets/poring-3.jpg',   name: 'PORING.03',  hue: 340, tier: 'common' },
  { src: 'assets/poring-4.jpg',   name: 'PORING.04',  hue: 340, tier: 'common' },
  { src: 'assets/poring-5.jpg',   name: 'PORING.05',  hue: 340, tier: 'common' },
  { src: 'assets/poring-6.jpg',   name: 'PORING.06',  hue: 340, tier: 'common' },
  { src: 'assets/poring-7.jpg',   name: 'PORING.07',  hue: 340, tier: 'common' },
  { src: 'assets/poring-bg.jpg',  name: 'BAGGY',      hue: 340, tier: 'common' },
  { src: 'assets/deviling.jpg',   name: 'DEVILING',   hue: 280, tier: 'boss' },
  { src: 'assets/ghostring.jpg',  name: 'GHOSTRING',  hue: 220, tier: 'rare' },
];

// Mascot component — chip with neon frame
function Mascot({ src, size = 48, label, hue = 340, glow = true, frameless = false }) {
  return (
    <div className={'mascot' + (frameless ? ' bare' : '')} style={{ width: size, height: size, '--mh': hue }}>
      <div className="mascot-frame">
        <img src={src} alt={label || 'mascot'} draggable="false" />
        {glow && <div className="mascot-scan" />}
      </div>
      {label && <div className="mascot-tag">{label}</div>}
      {!frameless && <>
        <span className="m-c m-tl" /><span className="m-c m-tr" />
        <span className="m-c m-bl" /><span className="m-c m-br" />
      </>}
    </div>
  );
}

// Tiled pattern — used as background for auth + banners
function MascotPattern({ density = 'medium', tint = 'cyan', opacity = 0.18 }) {
  const cells = density === 'dense' ? 24 : density === 'sparse' ? 8 : 14;
  const cols = density === 'dense' ? 8 : density === 'sparse' ? 4 : 6;
  const items = [];
  for (let i = 0; i < cells; i++) {
    const m = MASCOTS[(i * 7) % MASCOTS.length];
    const r = ((i * 31) % 21) - 10; // -10..10 deg
    const s = 0.7 + ((i * 13) % 7) / 10; // 0.7..1.3
    items.push({ ...m, r, s, key: i });
  }
  return (
    <div className={'mascot-pattern tint-' + tint} style={{ '--mp-op': opacity, '--mp-cols': cols }}>
      {items.map(it => (
        <div key={it.key} className="mp-cell" style={{ transform: `rotate(${it.r}deg) scale(${it.s})` }}>
          <img src={it.src} alt="" draggable="false" />
        </div>
      ))}
    </div>
  );
}

// Big featured mascot — used as a "guild totem" in banners
function MascotTotem({ src = 'assets/deviling.jpg', label = 'GUILD TOTEM', sub = 'DEVILING-CLASS' }) {
  return (
    <div className="totem">
      <div className="totem-rings">
        <div className="ring r1" /><div className="ring r2" /><div className="ring r3" />
      </div>
      <div className="totem-core">
        <img src={src} alt={label} draggable="false" />
      </div>
      <div className="totem-tag">
        <div className="totem-name">{label}</div>
        <div className="totem-sub">{sub}</div>
      </div>
      <svg className="totem-svg" viewBox="0 0 220 220">
        <defs>
          <linearGradient id="tot-g" x1="0" x2="1">
            <stop offset="0" stopColor="var(--magenta)" />
            <stop offset="1" stopColor="var(--cyan)" />
          </linearGradient>
        </defs>
        <circle cx="110" cy="110" r="106" fill="none" stroke="url(#tot-g)" strokeWidth="1" strokeDasharray="2,4" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0 110 110" to="360 110 110" dur="40s" repeatCount="indefinite" />
        </circle>
        <circle cx="110" cy="110" r="92" fill="none" stroke="var(--cyan)" strokeWidth="0.5" opacity="0.4" />
      </svg>
    </div>
  );
}

Object.assign(window, { MASCOTS, Mascot, MascotPattern, MascotTotem });
