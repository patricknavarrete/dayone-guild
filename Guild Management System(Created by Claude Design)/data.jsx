// Mock guild data — Ragnarok Online classes/themes

const CLASS_INFO = {
  RK: { name: 'Rune Knight',  short: 'RK', cls: 'chip-rk', bg: '#00fff0' },
  GX: { name: 'Guillotine X',  short: 'GX', cls: 'chip-gx', bg: '#ff2ec8' },
  AB: { name: 'Arch Bishop',   short: 'AB', cls: 'chip-am', bg: '#f3ff45' },
  RG: { name: 'Royal Guard',   short: 'RG', cls: 'chip-rg', bg: '#45ff8a' },
  CS: { name: 'Sorcerer',      short: 'SO', cls: 'chip-cs', bg: '#b07cff' },
  WS: { name: 'Mechanic',      short: 'MC', cls: 'chip-ws', bg: '#ff8a3a' },
  PL: { name: 'Performer',     short: 'PL', cls: 'chip-pl', bg: '#ff6691' },
  PR: { name: 'Sura',          short: 'SR', cls: 'chip-pr', bg: '#5fb4ff' },
  ST: { name: 'Shadow Chaser', short: 'SC', cls: 'chip-st', bg: '#ffd24d' },
  MN: { name: 'Minstrel',      short: 'MN', cls: 'chip-mn', bg: '#4dffd2' },
  BS: { name: 'Genetic',       short: 'GN', cls: 'chip-bs', bg: '#ff4d4d' },
  CR: { name: 'Ranger',        short: 'RA', cls: 'chip-cr', bg: '#f3ff45' },
  SN: { name: 'Wanderer',      short: 'WA', cls: 'chip-sn', bg: '#b4ffa3' },
  WL: { name: 'Warlock',       short: 'WL', cls: 'chip-st2', bg: '#ff8acf' },
};

const ROLES = ['GuildMaster', 'Officer', 'Veteran', 'Member', 'Recruit'];

const MEMBERS = [
  { id: 'M-001', name: 'NEXUS_PRIME',     role: 'GuildMaster', cls: 'RK', lvl: 185, gxp: 12480, status: 'online',  hp: 98, sp: 88, woe: 142, parties: 24, joined: '2024-03-12', dkp: 4820 },
  { id: 'M-002', name: 'VOID_REAVER',     role: 'Officer',     cls: 'GX', lvl: 184, gxp: 11320, status: 'online',  hp: 76, sp: 92, woe: 128, parties: 22, joined: '2024-04-02', dkp: 4210 },
  { id: 'M-003', name: 'AURELIA.exe',     role: 'Officer',     cls: 'AB', lvl: 184, gxp: 10940, status: 'online',  hp: 100, sp: 64, woe: 119, parties: 20, joined: '2024-04-18', dkp: 3980 },
  { id: 'M-004', name: 'GHOST_TENDO',     role: 'Officer',     cls: 'WL', lvl: 183, gxp: 10210, status: 'combat',  hp: 42, sp: 28, woe: 117, parties: 21, joined: '2024-05-09', dkp: 3640 },
  { id: 'M-005', name: 'KIRA_SHARDS',     role: 'Veteran',     cls: 'RG', lvl: 182, gxp: 9820,  status: 'online',  hp: 88, sp: 70, woe: 105, parties: 18, joined: '2024-06-14', dkp: 3220 },
  { id: 'M-006', name: 'NULL.POINTER',    role: 'Veteran',     cls: 'CS', lvl: 181, gxp: 9450,  status: 'afk',     hp: 60, sp: 80, woe: 98,  parties: 16, joined: '2024-07-02', dkp: 2940 },
  { id: 'M-007', name: 'PHANTOM_AKIRA',   role: 'Veteran',     cls: 'GX', lvl: 181, gxp: 9120,  status: 'online',  hp: 72, sp: 65, woe: 92,  parties: 14, joined: '2024-07-22', dkp: 2810 },
  { id: 'M-008', name: 'MOMO_OVERDRIVE',  role: 'Veteran',     cls: 'PL', lvl: 180, gxp: 8740,  status: 'online',  hp: 81, sp: 95, woe: 88,  parties: 17, joined: '2024-08-01', dkp: 2680 },
  { id: 'M-009', name: 'STATIC_NOIRE',    role: 'Member',      cls: 'CR', lvl: 179, gxp: 8210,  status: 'combat',  hp: 35, sp: 40, woe: 76,  parties: 12, joined: '2024-08-15', dkp: 2330 },
  { id: 'M-010', name: 'RYUJIN_404',      role: 'Member',      cls: 'BS', lvl: 178, gxp: 7820,  status: 'online',  hp: 90, sp: 50, woe: 71,  parties: 13, joined: '2024-09-01', dkp: 2110 },
  { id: 'M-011', name: 'EVA_CIPHER',      role: 'Member',      cls: 'AB', lvl: 178, gxp: 7640,  status: 'afk',     hp: 100, sp: 100, woe: 68, parties: 11, joined: '2024-09-12', dkp: 1980 },
  { id: 'M-012', name: 'BYTE_REAPER',     role: 'Member',      cls: 'PR', lvl: 177, gxp: 7320,  status: 'offline', hp: 0,  sp: 0,  woe: 64,  parties: 10, joined: '2024-09-30', dkp: 1820 },
  { id: 'M-013', name: 'NEON_HEXX',       role: 'Member',      cls: 'WS', lvl: 176, gxp: 6940,  status: 'online',  hp: 84, sp: 30, woe: 58,  parties: 9,  joined: '2024-10-04', dkp: 1640 },
  { id: 'M-014', name: 'JIN.NULL',        role: 'Member',      cls: 'ST', lvl: 175, gxp: 6420,  status: 'online',  hp: 66, sp: 72, woe: 51,  parties: 8,  joined: '2024-10-22', dkp: 1490 },
  { id: 'M-015', name: 'KAGE_BINARY',     role: 'Member',      cls: 'MN', lvl: 174, gxp: 6020,  status: 'offline', hp: 0,  sp: 0,  woe: 47,  parties: 7,  joined: '2024-11-04', dkp: 1280 },
  { id: 'M-016', name: 'OBLIVION_SAYU',   role: 'Member',      cls: 'SN', lvl: 173, gxp: 5780,  status: 'online',  hp: 78, sp: 88, woe: 42,  parties: 6,  joined: '2024-11-18', dkp: 1140 },
  { id: 'M-017', name: 'SHIROKO_TX',      role: 'Recruit',     cls: 'RK', lvl: 168, gxp: 4120,  status: 'online',  hp: 92, sp: 60, woe: 18,  parties: 4,  joined: '2025-01-14', dkp: 580 },
  { id: 'M-018', name: 'PIXEL_KAINE',     role: 'Recruit',     cls: 'GX', lvl: 165, gxp: 3640,  status: 'afk',     hp: 50, sp: 40, woe: 12,  parties: 3,  joined: '2025-02-02', dkp: 420 },
  { id: 'M-019', name: 'ZERO_ASUKA',      role: 'Recruit',     cls: 'CS', lvl: 162, gxp: 2810,  status: 'offline', hp: 0,  sp: 0,  woe: 6,   parties: 2,  joined: '2025-03-08', dkp: 240 },
  { id: 'M-020', name: 'GLITCH_RIN',      role: 'Recruit',     cls: 'AB', lvl: 158, gxp: 1940,  status: 'online',  hp: 100, sp: 100, woe: 2,  parties: 1,  joined: '2025-04-19', dkp: 80 },
];

const PARTIES = [
  { id: 'GLP-01', name: 'ALPHA STRIKE',   tag: 'MVP HUNT',    leader: 'NEXUS_PRIME', members: ['NEXUS_PRIME','VOID_REAVER','AURELIA.exe','KIRA_SHARDS','NULL.POINTER','MOMO_OVERDRIVE'], status: 'full' },
  { id: 'GLP-02', name: 'NULL DAEMONS',   tag: 'INSTANCE',    leader: 'GHOST_TENDO', members: ['GHOST_TENDO','PHANTOM_AKIRA','EVA_CIPHER','RYUJIN_404','BYTE_REAPER','NEON_HEXX'], status: 'full' },
  { id: 'GLP-03', name: 'ECHO PROTOCOL',  tag: 'EXP GRIND',   leader: 'STATIC_NOIRE', members: ['STATIC_NOIRE','JIN.NULL','KAGE_BINARY','OBLIVION_SAYU','SHIROKO_TX'], status: 'open' },
  { id: 'GLP-04', name: 'CIPHER WARDENS', tag: 'PVP TRAIN',   leader: 'PIXEL_KAINE', members: ['PIXEL_KAINE','ZERO_ASUKA','GLITCH_RIN'], status: 'open' },
  { id: 'GLP-05', name: 'PHANTOM CIRCUIT',tag: 'WOE BUILD',   leader: 'VOID_REAVER', members: ['VOID_REAVER','AURELIA.exe','GHOST_TENDO','KIRA_SHARDS','MOMO_OVERDRIVE','NULL.POINTER'], status: 'locked' },
  { id: 'GLP-06', name: 'VOID DRIFTERS',  tag: 'BIO LAB',     leader: 'PHANTOM_AKIRA', members: ['PHANTOM_AKIRA','EVA_CIPHER','NEON_HEXX','RYUJIN_404'], status: 'open' },
];

const WOE_PARTIES = [
  { id: 'WOE-A', name: 'BREAKER SQUAD',   role: 'OFFENSE',  members: 6, leader: 'NEXUS_PRIME', target: 'PRONTERA-1' },
  { id: 'WOE-B', name: 'DEFENSE GRID',    role: 'DEFENSE',  members: 6, leader: 'AURELIA.exe', target: 'GEFFEN-2' },
  { id: 'WOE-C', name: 'GHOST RECON',     role: 'SCOUT',    members: 4, leader: 'GHOST_TENDO', target: 'PAYON-3' },
  { id: 'WOE-D', name: 'NULL VANGUARD',   role: 'OFFENSE',  members: 5, leader: 'VOID_REAVER', target: 'ALDEBARAN-1' },
];

const ACTIVITY = [
  { time: '23:42:18', tag: 'gxp',  msg: <><b>NEXUS_PRIME</b> contributed <span className="acc3">+248 GXP</span> from MVP run</> },
  { time: '23:41:02', tag: 'kill', msg: <><b>VOID_REAVER</b> defeated <span className="acc">Ifrit</span> // GLP-01 split: 6 ways</> },
  { time: '23:38:55', tag: 'lvl',  msg: <><b>GLITCH_RIN</b> reached <span className="acc3">Lv 158</span></> },
  { time: '23:36:20', tag: 'join', msg: <><b>SHIROKO_TX</b> joined party <span className="acc">ECHO PROTOCOL</span></> },
  { time: '23:34:11', tag: 'woe',  msg: <><b>WoE-T2</b> brief in <span className="acc2">02:45:00</span> — assignments locked</> },
  { time: '23:31:48', tag: 'sys',  msg: <>Auto-roster sync complete · 247 members indexed</> },
  { time: '23:28:17', tag: 'gxp',  msg: <><b>AURELIA.exe</b> hit weekly cap <span className="acc3">9000/9000</span></> },
  { time: '23:25:42', tag: 'kill', msg: <><b>STATIC_NOIRE</b> +<span className="acc">12 kills</span> @ Bio Lab F4</> },
  { time: '23:21:09', tag: 'join', msg: <><b>PIXEL_KAINE</b> promoted to <span className="acc4">Recruit → Member</span></> },
  { time: '23:18:33', tag: 'woe',  msg: <>Castle <span className="acc2">PRONTERA-1</span> contested — defense up</> },
  { time: '23:14:27', tag: 'lvl',  msg: <><b>SHIROKO_TX</b> reached <span className="acc3">Lv 168</span> · skill reset granted</> },
  { time: '23:09:50', tag: 'sys',  msg: <>Backup snapshot saved — checksum <span className="dim">0x9F4A7C</span></> },
];

const CALENDAR = [
  { day: 'TUE', date: '04', label: 'WoE Trial 1',     time: '20:00', type: 'woe',   urgent: true },
  { day: 'WED', date: '05', label: 'Bio Lab raid',    time: '21:30', type: 'raid' },
  { day: 'THU', date: '06', label: 'Officer briefing',time: '22:00', type: 'meet' },
  { day: 'SAT', date: '08', label: 'WoE Trial 2',     time: '20:00', type: 'woe',   urgent: true },
  { day: 'SUN', date: '09', label: 'GvG scrim',       time: '19:00', type: 'pvp' },
];

window.GUILD_DATA = { CLASS_INFO, ROLES, MEMBERS, PARTIES, WOE_PARTIES, ACTIVITY, CALENDAR };
