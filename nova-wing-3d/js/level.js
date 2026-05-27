export const COURSE_LENGTH = 4200;
export const BASE_SPEED = 72;
export const BOOST_SPEED = 118;
export const PLAYER_LIMITS = {
  x: 9.2,
  yMin: -4.8,
  yMax: 5.4,
};

export const SECTIONS = [
  { at: 0, name: "Orion Gate", objective: "Drohnenwellen brechen", color: 0x44e6ff },
  { at: 980, name: "Amber Rift", objective: "Asteroidenfeld lesen", color: 0xffca62 },
  { at: 1960, name: "Verdant Relay", objective: "Boost-Ringe halten", color: 0xb7ff68 },
  { at: 3060, name: "Prism Core", objective: "Aegis Prism jagen", color: 0xff5f9a },
];

export const ENEMY_STATS = {
  scout: { hp: 1, score: 120, radius: 0.72, speed: 16, fireRate: 3.2 },
  cutter: { hp: 2, score: 180, radius: 0.82, speed: 13, fireRate: 2.75 },
  manta: { hp: 3, score: 260, radius: 1.05, speed: 10, fireRate: 2.35 },
  prism: { hp: 4, score: 420, radius: 1.18, speed: 7, fireRate: 1.85 },
};

export const BOSS = {
  at: 3380,
  holdAt: 3820,
  hp: 72,
  radius: 4.6,
  score: 4200,
};

export function railCenter(progress) {
  return {
    x: Math.sin(progress * 0.0021) * 2.15 + Math.sin(progress * 0.00063) * 3.1,
    y: 0.85 + Math.sin(progress * 0.00145) * 0.82 + Math.cos(progress * 0.00078) * 0.42,
  };
}

export function railTilt(progress) {
  return Math.sin(progress * 0.0019) * 0.28 + Math.sin(progress * 0.0048) * 0.08;
}

export function getSection(progress) {
  let section = SECTIONS[0];
  for (const candidate of SECTIONS) {
    if (progress >= candidate.at) section = candidate;
  }
  return section;
}

export const WAVE_BLUEPRINTS = [
  { id: "gate-vee", at: 150, type: "scout", count: 5, formation: "vee", x: 0, y: 1.0, spread: 2.0 },
  { id: "gate-sweep", at: 360, type: "scout", count: 7, formation: "line", x: -1.8, y: 0.2, spread: 1.65 },
  { id: "gate-cutters", at: 610, type: "cutter", count: 5, formation: "arc", x: 2.0, y: 1.8, spread: 1.8 },
  { id: "rift-cross", at: 910, type: "scout", count: 8, formation: "cross", x: 0, y: 0.6, spread: 1.55 },
  { id: "amber-manta", at: 1180, type: "manta", count: 4, formation: "stack", x: -3.2, y: 1.2, spread: 1.7 },
  { id: "amber-cutters", at: 1450, type: "cutter", count: 7, formation: "weave", x: 2.5, y: 0.4, spread: 1.35 },
  { id: "amber-ladder", at: 1725, type: "scout", count: 9, formation: "ladder", x: 0, y: 0.2, spread: 1.22 },
  { id: "relay-mantas", at: 2030, type: "manta", count: 5, formation: "arc", x: 0.6, y: 1.4, spread: 1.65 },
  { id: "relay-prism", at: 2310, type: "prism", count: 3, formation: "stack", x: -2.5, y: 1.1, spread: 2.1 },
  { id: "relay-scout-wall", at: 2560, type: "scout", count: 10, formation: "line", x: 0, y: 0.0, spread: 1.25 },
  { id: "relay-cutter-v", at: 2820, type: "cutter", count: 6, formation: "vee", x: 1.2, y: 1.0, spread: 1.55 },
  { id: "core-prism-a", at: 3090, type: "prism", count: 4, formation: "cross", x: 0, y: 1.0, spread: 1.85 },
  { id: "core-manta-wall", at: 3260, type: "manta", count: 5, formation: "line", x: 0, y: 1.5, spread: 1.8 },
];

export const RINGS = createRings();
export const OBSTACLES = createObstacles();
export const PICKUPS = createPickups();
export const TUNNEL_GATES = createGates();
export const DATA_CORES = createDataCores();
export const SUPPLY_PODS = createSupplyPods();
export const SIGNAL_BEACONS = createSignalBeacons();

function createRings() {
  const rings = [];
  let index = 0;
  for (let progress = 170; progress < BOSS.at - 80; progress += 145) {
    const phase = progress * 0.006;
    rings.push({
      id: `ring-${index++}`,
      progress,
      x: Math.sin(phase) * 4.9,
      y: 0.6 + Math.cos(phase * 0.73) * 2.15,
      radius: 2.05 + (index % 4) * 0.18,
      score: 80,
      energy: 0.18,
    });
  }
  return rings;
}

function createObstacles() {
  const obstacles = [];
  let index = 0;
  for (let progress = 330; progress < BOSS.at - 130; progress += 94) {
    const lane = index % 5;
    const side = lane % 2 === 0 ? -1 : 1;
    obstacles.push({
      id: `rock-${index}`,
      progress,
      x: side * (3.3 + (lane * 0.9) % 4.6) + Math.sin(progress * 0.013) * 0.8,
      y: -1.4 + ((index * 1.37) % 5.8),
      radius: 0.75 + (index % 4) * 0.18,
      spin: 0.6 + (index % 7) * 0.11,
      damage: 12 + (index % 3) * 3,
    });
    if (index % 4 === 0) {
      obstacles.push({
        id: `crystal-${index}`,
        progress: progress + 32,
        x: -side * (4.2 + ((index + 2) % 3) * 1.1),
        y: 2.2 + Math.sin(progress * 0.01) * 2.3,
        radius: 0.96,
        spin: -0.9,
        damage: 16,
        crystal: true,
      });
    }
    index += 1;
  }
  return obstacles;
}

function createPickups() {
  return [
    { id: "shield-1", type: "shield", progress: 760, x: -5.0, y: 2.6 },
    { id: "repair-1", type: "repair", progress: 1320, x: 5.4, y: -0.7 },
    { id: "charge-1", type: "charge", progress: 1840, x: -4.4, y: 3.1 },
    { id: "shield-2", type: "shield", progress: 2380, x: 4.5, y: 1.7 },
    { id: "repair-2", type: "repair", progress: 2920, x: -5.3, y: 0.4 },
    { id: "charge-2", type: "charge", progress: 3260, x: 0.0, y: 3.9 },
  ];
}

function createDataCores() {
  return [
    { id: "core-gate-a", progress: 520, x: -2.8, y: 3.6, score: 450 },
    { id: "core-gate-b", progress: 840, x: 4.7, y: -1.7, score: 450 },
    { id: "core-amber-a", progress: 1270, x: -6.2, y: 1.1, score: 520 },
    { id: "core-amber-b", progress: 1640, x: 2.2, y: 4.4, score: 520 },
    { id: "core-relay-a", progress: 2140, x: 5.8, y: 2.6, score: 620 },
    { id: "core-relay-b", progress: 2630, x: -4.9, y: -2.4, score: 620 },
    { id: "core-core-a", progress: 3050, x: 0.4, y: 4.8, score: 760 },
    { id: "core-core-b", progress: 3330, x: -5.7, y: 0.1, score: 760 },
  ];
}

function createSupplyPods() {
  return [
    { id: "pod-orion", progress: 430, x: 5.8, y: 2.2, shield: 24, score: 260 },
    { id: "pod-rift-a", progress: 1080, x: -5.9, y: -1.1, shield: 26, score: 280 },
    { id: "pod-rift-b", progress: 1540, x: 5.6, y: 3.5, shield: 24, score: 300 },
    { id: "pod-relay-a", progress: 2210, x: -6.1, y: 2.8, shield: 28, score: 340 },
    { id: "pod-relay-b", progress: 2760, x: 5.2, y: -1.8, shield: 30, score: 360 },
    { id: "pod-core", progress: 3215, x: -4.8, y: 3.8, shield: 34, score: 420 },
  ];
}

function createSignalBeacons() {
  return [
    { id: "sig-orion-1", progress: 290, x: -4.8, y: 2.9, score: 300, line: "Orion-Route kalibriert" },
    { id: "sig-orion-2", progress: 690, x: 5.2, y: -0.8, score: 320, line: "Scout-Signatur markiert" },
    { id: "sig-rift-1", progress: 1125, x: -5.7, y: 3.7, score: 360, line: "Amber-Rift kartiert" },
    { id: "sig-rift-2", progress: 1515, x: 4.9, y: 1.0, score: 380, line: "Kristallfeld entschluesselt" },
    { id: "sig-rift-3", progress: 1855, x: -3.8, y: -2.8, score: 420, line: "Relay-Fenster offen" },
    { id: "sig-relay-1", progress: 2190, x: 5.6, y: 3.2, score: 460, line: "Verdant-Kanal stabil" },
    { id: "sig-relay-2", progress: 2475, x: -6.0, y: 0.7, score: 500, line: "Wing-Drone Link plus" },
    { id: "sig-relay-3", progress: 2835, x: 3.6, y: -2.6, score: 540, line: "Prismenspur fixiert" },
    { id: "sig-core-1", progress: 3145, x: -4.5, y: 3.3, score: 620, line: "Aegis-Puls gelesen" },
    { id: "sig-core-2", progress: 3355, x: 4.2, y: 0.2, score: 700, line: "Finaler Lock bereit" },
  ];
}

function createGates() {
  const gates = [];
  let index = 0;
  for (let progress = 65; progress <= COURSE_LENGTH; progress += 86) {
    gates.push({
      id: `gate-${index}`,
      progress,
      radius: 9.6 + Math.sin(progress * 0.006) * 1.1,
      color: SECTIONS[index % SECTIONS.length].color,
      phase: index * 0.2,
    });
    index += 1;
  }
  return gates;
}
