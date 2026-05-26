import * as THREE from "../assets/vendor/three.module.js";
import {
  BASE_SPEED,
  BOSS,
  BOOST_SPEED,
  COURSE_LENGTH,
  DATA_CORES,
  ENEMY_STATS,
  OBSTACLES,
  PICKUPS,
  PLAYER_LIMITS,
  RINGS,
  TUNNEL_GATES,
  WAVE_BLUEPRINTS,
  getSection,
  railCenter,
  railTilt,
} from "./level.js";

const canvas = document.getElementById("game");
const ui = {
  hud: document.getElementById("hud"),
  menu: document.getElementById("menu"),
  results: document.getElementById("results"),
  startButton: document.getElementById("startButton"),
  restartButton: document.getElementById("restartButton"),
  menuButton: document.getElementById("menuButton"),
  pauseButton: document.getElementById("pauseButton"),
  soundButton: document.getElementById("soundButton"),
  menuSoundButton: document.getElementById("menuSoundButton"),
  resetButton: document.getElementById("resetButton"),
  sectorText: document.getElementById("sectorText"),
  objectiveText: document.getElementById("objectiveText"),
  scoreText: document.getElementById("scoreText"),
  hpFill: document.getElementById("hpFill"),
  shieldFill: document.getElementById("shieldFill"),
  energyFill: document.getElementById("energyFill"),
  novaFill: document.getElementById("novaFill"),
  progressFill: document.getElementById("progressFill"),
  comboText: document.getElementById("comboText"),
  coreText: document.getElementById("coreText"),
  bossBar: document.getElementById("bossBar"),
  bossFill: document.getElementById("bossFill"),
  resultEyebrow: document.getElementById("resultEyebrow"),
  resultTitle: document.getElementById("resultTitle"),
  resultStats: document.getElementById("resultStats"),
  toast: document.getElementById("toast"),
  damageFlash: document.getElementById("damageFlash"),
  touchControls: document.getElementById("touchControls"),
};

const urlParams = new URLSearchParams(window.location.search);
const captureMode = urlParams.get("capture") === "1";
const mutedByUrl = urlParams.get("mute") === "1";
const qualityMode = urlParams.get("quality") || "auto";
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
const reducedGpu = qualityMode !== "high" && (coarsePointer || window.innerWidth < 760);
const maxPixelRatio = captureMode ? 1 : qualityMode === "high" ? 1.5 : reducedGpu ? 0.82 : 1.12;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: captureMode,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
renderer.shadowMap.enabled = qualityMode === "high" && !reducedGpu;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}
if ("toneMapping" in renderer && THREE.ACESFilmicToneMapping) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060d);
scene.fog = new THREE.FogExp2(0x070914, 0.0065);

const camera = new THREE.PerspectiveCamera(63, 1, 0.1, 1200);
scene.add(camera);

const worldGroup = new THREE.Group();
const dynamicGroup = new THREE.Group();
const projectileGroup = new THREE.Group();
const fxGroup = new THREE.Group();
scene.add(worldGroup, dynamicGroup, projectileGroup, fxGroup);

const hemi = new THREE.HemisphereLight(0x9ccfff, 0x160811, 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffdf9a, 2.1);
sun.position.set(8, 14, 12);
sun.castShadow = renderer.shadowMap.enabled;
scene.add(sun);
const chaseLight = new THREE.PointLight(0x44e6ff, 2.2, 46);
scene.add(chaseLight);

const textureLoader = new THREE.TextureLoader();
const textures = {
  hull: loadTexture("assets/generated/nova-hull-albedo.png"),
  enemy: loadTexture("assets/generated/nova-enemy-albedo.png"),
  asteroid: loadTexture("assets/generated/nova-asteroid-albedo.png"),
  ring: loadTexture("assets/generated/nova-ring-emissive.png"),
  plasma: loadTexture("assets/generated/nova-prism-core.png"),
  nebula: loadTexture("assets/generated/nova-nebula-panorama.png", false),
  decal: loadTexture("assets/generated/nova-decal-atlas.png"),
  shield: loadTexture("assets/generated/nova-shield-shell.png", false),
  shard: loadTexture("assets/generated/nova-power-shard.png", false),
  flare: loadTexture("assets/generated/nova-engine-flare.png", false),
  elite: loadTexture("assets/generated/nova-elite-mask.png"),
};
scene.background = textures.nebula;

const materials = {
  hull: new THREE.MeshStandardMaterial({
    color: 0xd7f2ff,
    metalness: 0.6,
    roughness: 0.28,
    map: textures.hull,
    emissive: 0x061a22,
    emissiveIntensity: 0.2,
  }),
  wing: new THREE.MeshStandardMaterial({
    color: 0x324664,
    metalness: 0.72,
    roughness: 0.24,
    emissive: 0x071626,
  }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x44e6ff,
    metalness: 0.25,
    roughness: 0.12,
    emissive: 0x1ccce8,
    emissiveIntensity: 0.62,
  }),
  engine: new THREE.MeshBasicMaterial({ color: 0xffca62, transparent: true, opacity: 0.82 }),
  laser: new THREE.MeshBasicMaterial({ color: 0x8ffcff }),
  novaShot: new THREE.MeshBasicMaterial({ color: 0xb7ff68 }),
  novaPulse: new THREE.MeshBasicMaterial({
    color: 0xb7ff68,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  enemyLaser: new THREE.MeshBasicMaterial({ color: 0xff5f9a }),
  engineFlare: new THREE.SpriteMaterial({
    map: textures.flare,
    color: 0xffca62,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  }),
  enemy: new THREE.MeshStandardMaterial({
    color: 0xff5f9a,
    roughness: 0.32,
    metalness: 0.38,
    map: textures.enemy,
    emissive: 0x3a071d,
    emissiveIntensity: 0.42,
  }),
  enemyAlt: new THREE.MeshStandardMaterial({
    color: 0xa98cff,
    roughness: 0.36,
    metalness: 0.42,
    map: textures.enemy,
    emissive: 0x160f3f,
    emissiveIntensity: 0.36,
  }),
  enemyElite: new THREE.MeshStandardMaterial({
    color: 0xffca62,
    roughness: 0.26,
    metalness: 0.5,
    map: textures.elite,
    emissive: 0x461126,
    emissiveIntensity: 0.64,
  }),
  asteroid: new THREE.MeshStandardMaterial({
    color: 0x8c735a,
    roughness: 0.82,
    metalness: 0.08,
    map: textures.asteroid,
  }),
  crystal: new THREE.MeshStandardMaterial({
    color: 0x72ffe0,
    roughness: 0.16,
    metalness: 0.22,
    emissive: 0x1dd1ba,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.92,
  }),
  ring: new THREE.MeshBasicMaterial({ color: 0x44e6ff, map: textures.ring, transparent: true, opacity: 0.92 }),
  gate: new THREE.MeshBasicMaterial({ color: 0x698dff, transparent: true, opacity: 0.24, depthWrite: false }),
  pickupShield: new THREE.MeshStandardMaterial({ color: 0x44e6ff, emissive: 0x18b9d6, emissiveIntensity: 0.55 }),
  pickupRepair: new THREE.MeshStandardMaterial({ color: 0xb7ff68, emissive: 0x74c642, emissiveIntensity: 0.5 }),
  pickupCharge: new THREE.MeshStandardMaterial({ color: 0xffca62, emissive: 0xc88422, emissiveIntensity: 0.55 }),
  dataCore: new THREE.MeshStandardMaterial({
    color: 0xf6fbff,
    emissive: 0x44e6ff,
    emissiveIntensity: 0.9,
    metalness: 0.2,
    roughness: 0.18,
  }),
  powerShard: new THREE.MeshStandardMaterial({
    color: 0xf6fbff,
    roughness: 0.12,
    metalness: 0.28,
    map: textures.shard,
    emissive: 0x44e6ff,
    emissiveIntensity: 0.95,
    transparent: true,
    opacity: 0.96,
  }),
  shieldShell: new THREE.MeshBasicMaterial({
    color: 0x44e6ff,
    map: textures.shield,
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  boss: new THREE.MeshStandardMaterial({
    color: 0x563c8d,
    roughness: 0.22,
    metalness: 0.62,
    map: textures.plasma,
    emissive: 0x28135d,
    emissiveIntensity: 0.65,
  }),
  bossCore: new THREE.MeshStandardMaterial({
    color: 0xffca62,
    roughness: 0.1,
    metalness: 0.2,
    emissive: 0xff5f9a,
    emissiveIntensity: 1.1,
  }),
};

const geometries = {
  shot: new THREE.BoxGeometry(0.08, 0.08, 2.6),
  enemyShot: new THREE.SphereGeometry(0.16, 12, 8),
  asteroid: new THREE.DodecahedronGeometry(1, 1),
  crystal: new THREE.ConeGeometry(0.7, 2.6, 5),
  gate: new THREE.TorusGeometry(1, 0.02, 8, 80),
  ring: new THREE.TorusGeometry(1, 0.09, 12, 80),
  pickup: new THREE.OctahedronGeometry(0.52, 0),
  dataCore: new THREE.IcosahedronGeometry(0.46, 1),
  shard: new THREE.IcosahedronGeometry(0.28, 1),
  shieldShell: new THREE.SphereGeometry(1.45, 28, 16),
};

const staticObjects = {
  gates: [],
  rings: [],
  obstacles: [],
  pickups: [],
  dataCores: [],
};

const input = {
  keys: new Set(),
  touch: new Set(),
  pointerDown: false,
  pointerActive: false,
  pointerTarget: { x: 0, y: 0 },
  rollQueued: 0,
  novaQueued: false,
};

const clock = new THREE.Clock();
const tmpVec = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
let state = createState("menu");
let playerShip = null;
let wingDrones = [];
let speedLines = null;
let audioContext = null;
let audioEnabled = !mutedByUrl;
let audioLoadingPromise = null;
let bgmSource = null;
let bgmElement = null;
let bgmStarted = false;
let musicGain = null;
let sfxGain = null;
let lastHudUpdate = 0;
let seed = 1447;

const audioFiles = {
  bgm: "assets/audio/nova-bgm-loop.wav",
  laser: "assets/audio/laser.wav",
  explosion: "assets/audio/explosion.wav",
  pickup: "assets/audio/pickup.wav",
  hit: "assets/audio/hit.wav",
  boost: "assets/audio/boost.wav",
  win: "assets/audio/win.wav",
};
const audioBuffers = {};

init();

function init() {
  createStarfield();
  speedLines = createSpeedLines();
  createNebulaPanels();
  createStaticWorld();
  playerShip = createPlayerShip();
  dynamicGroup.add(playerShip);
  wingDrones = [createWingDrone(-1), createWingDrone(1)];
  for (const drone of wingDrones) dynamicGroup.add(drone);
  bindInput();
  bindUi();
  resize();
  resetGame("menu");
  window.__novaWingDebug = {
    getState: () => ({
      mode: state.mode,
      progress: state.progress,
      score: state.player.score,
      nova: state.player.nova,
      graze: state.player.graze,
      overdrive: state.player.overdrive,
      enemies: state.enemies.length,
      shots: state.playerShots.length,
      shards: state.powerShards.length,
      boss: state.boss ? state.boss.hp : 0,
      audio: {
        enabled: audioEnabled,
        bgmStarted,
        bgmPaused: bgmElement ? bgmElement.paused : true,
        context: audioContext?.state || "none",
      },
    }),
    chargeNova: (amount = 1) => {
      chargeNova(amount);
      return state.player.nova;
    },
    useNovaBurst: () => {
      useNovaBurst();
      return state.player.nova;
    },
  };
  requestAnimationFrame(animate);
}

function loadTexture(url, repeat = true) {
  const texture = textureLoader.load(url);
  if ("colorSpace" in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  return texture;
}

function seededRandom() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

function createState(mode = "playing") {
  return {
    mode,
    progress: 0,
    lastProgress: 0,
    speed: BASE_SPEED,
    elapsed: 0,
    waveSpawned: new Set(),
    ringCollected: new Set(),
    obstacleHit: new Set(),
    obstacleGrazed: new Set(),
    pickupCollected: new Set(),
    dataCoreCollected: new Set(),
    enemies: [],
    playerShots: [],
    enemyShots: [],
    powerShards: [],
    explosions: [],
    boss: null,
    bossDefeated: false,
    toastTimer: 0,
    nextDirectorAt: 430,
    directorWave: 0,
    player: {
      x: 0,
      y: 0,
      hp: 100,
      shield: 45,
      energy: 1,
      heat: 0,
      score: 0,
      combo: 1,
      comboTimer: 0,
      bestCombo: 1,
      nova: 0.28,
      graze: 0,
      overdrive: 0,
      shardChain: 0,
      droneCooldown: 0,
      invuln: 0,
      fireCooldown: 0,
      rollTime: 0,
      rollDir: 0,
      rollCooldown: 0,
    },
  };
}

function createStarfield() {
  const count = reducedGpu ? 900 : 1500;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [
    new THREE.Color(0x9ff7ff),
    new THREE.Color(0xffd585),
    new THREE.Color(0xff8dbc),
    new THREE.Color(0xe7f4ff),
    new THREE.Color(0xb7ff68),
  ];
  for (let i = 0; i < count; i += 1) {
    const radius = 60 + seededRandom() * 360;
    const angle = seededRandom() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (seededRandom() - 0.5) * 170;
    positions[i * 3 + 2] = -60 - seededRandom() * 900;
    const color = palette[Math.floor(seededRandom() * palette.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: reducedGpu ? 0.75 : 1.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.name = "camera-starfield";
  camera.add(points);
}

function createSpeedLines() {
  const count = reducedGpu ? 36 : 72;
  const positions = new Float32Array(count * 2 * 3);
  for (let i = 0; i < count; i += 1) {
    const x = (seededRandom() - 0.5) * 48;
    const y = (seededRandom() - 0.5) * 28;
    const z = -22 - seededRandom() * 80;
    positions[i * 6] = x;
    positions[i * 6 + 1] = y;
    positions[i * 6 + 2] = z;
    positions[i * 6 + 3] = x;
    positions[i * 6 + 4] = y;
    positions[i * 6 + 5] = z - 9 - seededRandom() * 18;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0x44e6ff,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(geometry, material);
  lines.name = "camera-speed-lines";
  camera.add(lines);
  return lines;
}

function createWingDrone(side) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), materials.glass.clone());
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.18), materials.wing.clone());
  fin.position.z = 0.08;
  group.add(body, fin);
  group.userData.side = side;
  return group;
}

function createNebulaPanels() {
  const plane = new THREE.PlaneGeometry(200, 92);
  const configs = [
    { x: -84, y: 30, z: -360, color: 0xff5f9a, opacity: 0.08, rot: 0.12 },
    { x: 95, y: -18, z: -520, color: 0x44e6ff, opacity: 0.075, rot: -0.22 },
    { x: 6, y: 48, z: -720, color: 0xb7ff68, opacity: 0.045, rot: 0.5 },
  ];
  for (const config of configs) {
    const mesh = new THREE.Mesh(
      plane,
      new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    mesh.position.set(config.x, config.y, config.z);
    mesh.rotation.z = config.rot;
    camera.add(mesh);
  }
}

function createStaticWorld() {
  for (const gate of TUNNEL_GATES) {
    const mesh = new THREE.Mesh(geometries.gate, materials.gate.clone());
    const center = railCenter(gate.progress);
    mesh.position.set(center.x, center.y, -gate.progress);
    mesh.scale.set(gate.radius, gate.radius, gate.radius);
    mesh.rotation.z = railTilt(gate.progress);
    mesh.material.color.setHex(gate.color);
    mesh.material.opacity = 0.2 + (gate.progress % 5) * 0.014;
    worldGroup.add(mesh);
    staticObjects.gates.push({ data: gate, mesh });
  }

  for (const ring of RINGS) {
    const mesh = new THREE.Mesh(geometries.ring, materials.ring.clone());
    placeRailObject(mesh, ring.progress, ring.x, ring.y);
    mesh.scale.setScalar(ring.radius);
    worldGroup.add(mesh);
    staticObjects.rings.push({ data: ring, mesh });
  }

  for (const obstacle of OBSTACLES) {
    const geometry = obstacle.crystal ? geometries.crystal : geometries.asteroid;
    const material = obstacle.crystal ? materials.crystal.clone() : materials.asteroid.clone();
    const mesh = new THREE.Mesh(geometry, material);
    placeRailObject(mesh, obstacle.progress, obstacle.x, obstacle.y);
    mesh.scale.setScalar(obstacle.radius);
    mesh.rotation.set(seededRandom() * Math.PI, seededRandom() * Math.PI, seededRandom() * Math.PI);
    mesh.castShadow = renderer.shadowMap.enabled;
    worldGroup.add(mesh);
    staticObjects.obstacles.push({ data: obstacle, mesh });
  }

  for (const pickup of PICKUPS) {
    const material =
      pickup.type === "repair" ? materials.pickupRepair : pickup.type === "charge" ? materials.pickupCharge : materials.pickupShield;
    const mesh = new THREE.Mesh(geometries.pickup, material.clone());
    placeRailObject(mesh, pickup.progress, pickup.x, pickup.y);
    worldGroup.add(mesh);
    staticObjects.pickups.push({ data: pickup, mesh });
  }

  for (const core of DATA_CORES) {
    const mesh = new THREE.Mesh(geometries.dataCore, materials.dataCore.clone());
    placeRailObject(mesh, core.progress, core.x, core.y);
    worldGroup.add(mesh);
    staticObjects.dataCores.push({ data: core, mesh });
  }
}

function createPlayerShip() {
  const group = new THREE.Group();
  group.name = "nova-player-ship";

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.42, 1.52), materials.hull);
  body.castShadow = renderer.shadowMap.enabled;
  group.add(body);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.15, 5), materials.hull);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -1.18;
  group.add(nose);

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 10), materials.glass);
  cockpit.scale.set(0.9, 0.58, 1.2);
  cockpit.position.set(0, 0.25, -0.22);
  group.add(cockpit);

  const wingGeo = new THREE.BoxGeometry(1.45, 0.08, 0.64);
  const leftWing = new THREE.Mesh(wingGeo, materials.wing);
  leftWing.position.set(-0.78, -0.05, 0.12);
  leftWing.rotation.z = 0.18;
  group.add(leftWing);
  const rightWing = new THREE.Mesh(wingGeo, materials.wing);
  rightWing.position.set(0.78, -0.05, 0.12);
  rightWing.rotation.z = -0.18;
  group.add(rightWing);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.72), materials.wing);
  tail.position.set(0, 0.38, 0.62);
  group.add(tail);

  const engineGeo = new THREE.SphereGeometry(0.16, 12, 8);
  for (const x of [-0.32, 0.32]) {
    const engine = new THREE.Mesh(engineGeo, materials.engine.clone());
    engine.position.set(x, -0.03, 0.9);
    engine.userData.engineGlow = true;
    group.add(engine);
    const flare = new THREE.Sprite(materials.engineFlare.clone());
    flare.position.set(x, -0.03, 1.12);
    flare.scale.set(0.72, 0.72, 0.72);
    flare.userData.engineFlare = true;
    group.add(flare);
  }
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.52),
    new THREE.MeshBasicMaterial({ map: textures.decal, transparent: true, opacity: 0.86 }),
  );
  badge.position.set(0, 0.23, -0.82);
  badge.rotation.x = -0.18;
  group.add(badge);

  const shield = new THREE.Mesh(geometries.shieldShell, materials.shieldShell.clone());
  shield.name = "player-shield-shell";
  shield.visible = false;
  group.add(shield);
  return group;
}

function createEnemyMesh(type, elite = false) {
  const group = new THREE.Group();
  const baseMaterial = elite ? materials.enemyElite : type === "scout" || type === "manta" ? materials.enemy : materials.enemyAlt;
  if (type === "scout") {
    const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), baseMaterial);
    body.rotation.z = Math.PI / 4;
    group.add(body);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 0.36), baseMaterial);
    wing.position.z = 0.12;
    group.add(wing);
  } else if (type === "cutter") {
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.2, 5), baseMaterial);
    body.rotation.x = Math.PI / 2;
    group.add(body);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.06, 0.2), materials.enemy);
    blade.position.z = -0.1;
    group.add(blade);
  } else if (type === "manta") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.54, 16, 10), baseMaterial);
    body.scale.set(1.35, 0.34, 0.8);
    group.add(body);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.52), materials.enemyAlt);
    wing.position.z = 0.08;
    group.add(wing);
  } else {
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.66, 0), baseMaterial);
    group.add(body);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.045, 8, 36), materials.enemy);
    halo.rotation.x = Math.PI / 2;
    group.add(halo);
  }
  if (elite) {
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.04, 8, 48), materials.powerShard);
    crown.rotation.x = Math.PI / 2;
    crown.position.z = -0.18;
    group.add(crown);
    group.scale.setScalar(1.12);
  }
  group.traverse((child) => {
    if (child.isMesh) child.castShadow = renderer.shadowMap.enabled;
  });
  return group;
}

function createBossMesh() {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(2.2, 1), materials.bossCore);
  group.add(core);
  const shell = new THREE.Mesh(new THREE.DodecahedronGeometry(3.15, 1), materials.boss);
  shell.scale.set(1.1, 0.82, 0.72);
  group.add(shell);
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(3.75, 0.08, 12, 96), materials.ring.clone());
  ringA.rotation.x = Math.PI / 2;
  group.add(ringA);
  const wingGeo = new THREE.BoxGeometry(7.2, 0.22, 1.2);
  const wing = new THREE.Mesh(wingGeo, materials.boss);
  wing.position.z = 0.3;
  group.add(wing);
  for (const x of [-3.3, 3.3]) {
    const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 10), materials.enemy);
    emitter.position.set(x, -0.2, -0.85);
    group.add(emitter);
  }
  group.scale.setScalar(1.05);
  return group;
}

function bindUi() {
  ui.startButton.addEventListener("click", () => startGame());
  ui.restartButton.addEventListener("click", () => startGame());
  ui.menuButton.addEventListener("click", () => resetGame("menu"));
  ui.pauseButton.addEventListener("click", () => togglePause());
  ui.resetButton.addEventListener("click", () => startGame());
  ui.soundButton.addEventListener("click", () => toggleAudio());
  ui.menuSoundButton.addEventListener("click", () => toggleAudio(true));
  updateAudioButtons();
}

function bindInput() {
  window.addEventListener("resize", resize);
  window.addEventListener("blur", () => {
    input.keys.clear();
    input.touch.clear();
    input.pointerDown = false;
    input.novaQueued = false;
  });
  window.addEventListener("keydown", (event) => {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
    input.keys.add(event.code);
    if (event.code === "Enter" && (state.mode === "menu" || state.mode === "results")) startGame();
    if (event.code === "KeyP" || event.code === "Escape") togglePause();
    if (event.code === "KeyQ") input.rollQueued = -1;
    if (event.code === "KeyE") input.rollQueued = 1;
    if (event.code === "KeyX") input.novaQueued = true;
  });
  window.addEventListener("keyup", (event) => {
    input.keys.delete(event.code);
  });

  canvas.addEventListener("pointerdown", (event) => {
    input.pointerDown = true;
    input.pointerActive = true;
    setPointerTarget(event);
    if (state.mode === "playing") ensureAudio();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (state.mode === "playing") setPointerTarget(event);
  });
  window.addEventListener("pointerup", () => {
    input.pointerDown = false;
  });

  for (const button of document.querySelectorAll("[data-touch]")) {
    const action = button.getAttribute("data-touch");
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      input.touch.add(action);
      if (action === "roll") input.rollQueued = input.rollQueued === 1 ? -1 : 1;
      if (action === "nova") input.novaQueued = true;
      ensureAudio();
    });
    const release = () => input.touch.delete(action);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  }
}

function resize() {
  const width = Math.max(320, window.innerWidth);
  const height = Math.max(240, window.innerHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function resetGame(mode = "playing") {
  clearDynamic();
  state = createState(mode);
  if (mode === "menu") stopBgm();
  input.rollQueued = 0;
  input.novaQueued = false;
  input.pointerActive = false;
  for (const entry of staticObjects.rings) {
    entry.mesh.visible = true;
    entry.mesh.material.opacity = 0.92;
  }
  for (const entry of staticObjects.obstacles) {
    entry.mesh.visible = true;
    entry.mesh.material.opacity = entry.data.crystal ? 0.92 : 1;
  }
  for (const entry of staticObjects.pickups) {
    entry.mesh.visible = true;
  }
  for (const entry of staticObjects.dataCores) {
    entry.mesh.visible = true;
  }
  ui.menu.classList.toggle("hidden", mode !== "menu");
  ui.menu.classList.toggle("active", mode === "menu");
  ui.results.classList.add("hidden");
  ui.results.classList.remove("active");
  ui.bossBar.classList.add("hidden");
  ui.pauseButton.textContent = "II";
  showToast(mode === "menu" ? "" : "Signal gruen", 1.2);
  updateHud(true);
}

function startGame() {
  resetGame("playing");
  ensureAudio();
  startBgm();
  ui.menu.classList.add("hidden");
  ui.menu.classList.remove("active");
  ui.results.classList.add("hidden");
  clock.getDelta();
  showToast("Nova Wing gestartet", 1.35);
  playTone(220, 0.08, "sine", 0.03);
  playTone(440, 0.11, "triangle", 0.035, 0.05);
}

function clearDynamic() {
  for (const group of [dynamicGroup, projectileGroup, fxGroup]) {
    for (let i = group.children.length - 1; i >= 0; i -= 1) {
      const child = group.children[i];
      if (group === dynamicGroup && (child === playerShip || wingDrones.includes(child))) continue;
      group.remove(child);
    }
  }
  if (playerShip && !dynamicGroup.children.includes(playerShip)) dynamicGroup.add(playerShip);
  for (const drone of wingDrones) {
    if (!dynamicGroup.children.includes(drone)) dynamicGroup.add(drone);
  }
}

function togglePause() {
  if (state.mode === "playing") {
    state.mode = "paused";
    ui.pauseButton.textContent = "GO";
    showToast("Pause", 999);
  } else if (state.mode === "paused") {
    state.mode = "playing";
    ui.pauseButton.textContent = "II";
    showToast("Weiter", 0.8);
    clock.getDelta();
  }
}

function toggleAudio(forceOn = false) {
  audioEnabled = forceOn || !audioEnabled;
  ensureAudio();
  if (audioEnabled) startBgm();
  else stopBgm();
  updateAudioButtons();
  if (audioEnabled) playTone(520, 0.08, "sine", 0.035);
}

function updateAudioButtons() {
  ui.soundButton.textContent = audioEnabled ? "SND" : "MUTE";
  ui.menuSoundButton.textContent = audioEnabled ? "Sound testen" : "Sound an";
}

function ensureAudio() {
  if (!audioEnabled) return;
  primeBgmElement();
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    audioContext = new AudioCtor();
    musicGain = audioContext.createGain();
    sfxGain = audioContext.createGain();
    musicGain.gain.value = 0.38;
    sfxGain.gain.value = 0.74;
    musicGain.connect(audioContext.destination);
    sfxGain.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") audioContext.resume().catch?.(() => {});
  loadAudioAssets();
}

function primeBgmElement() {
  if (mutedByUrl || bgmElement) return bgmElement;
  bgmElement = new Audio(audioFiles.bgm);
  bgmElement.loop = true;
  bgmElement.preload = "auto";
  bgmElement.volume = 0.46;
  bgmElement.addEventListener("playing", () => {
    bgmStarted = true;
  });
  bgmElement.addEventListener("pause", () => {
    bgmStarted = false;
  });
  return bgmElement;
}

function playTone(frequency, duration, type = "sine", volume = 0.04, delay = 0) {
  if (!audioEnabled || !audioContext) return;
  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(sfxGain || audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function loadAudioAssets() {
  if (!audioContext) return Promise.resolve();
  if (audioLoadingPromise) return audioLoadingPromise;
  audioLoadingPromise = Promise.all(
    Object.entries(audioFiles).map(async ([name, url]) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Audio ${url} ${response.status}`);
      const data = await response.arrayBuffer();
      audioBuffers[name] = await audioContext.decodeAudioData(data);
    }),
  ).catch((error) => {
    console.warn("Nova Wing audio asset load skipped:", error.message);
  });
  return audioLoadingPromise;
}

function startBgm() {
  if (!audioEnabled) return;
  const element = primeBgmElement();
  if (element) {
    element.volume = 0.46;
    const playPromise = element.play();
    if (playPromise?.then) {
      playPromise
        .then(() => {
          bgmStarted = true;
        })
        .catch(() => {
          bgmStarted = false;
          startDecodedBgm(true);
        });
    } else {
      bgmStarted = !element.paused;
    }
  }
  if (!audioContext) return;
  startDecodedBgm();
}

function startDecodedBgm(force = false) {
  if (!audioEnabled || !audioContext || (bgmElement && !force)) return;
  loadAudioAssets().then(() => {
    if (!audioBuffers.bgm || bgmSource) return;
    bgmSource = audioContext.createBufferSource();
    bgmSource.buffer = audioBuffers.bgm;
    bgmSource.loop = true;
    bgmSource.connect(musicGain || audioContext.destination);
    bgmSource.start();
    bgmStarted = true;
  });
}

function stopBgm() {
  if (bgmElement) {
    bgmElement.pause();
    bgmElement.currentTime = 0;
  }
  bgmStarted = false;
  if (!bgmSource) return;
  try {
    bgmSource.stop();
  } catch {}
  bgmSource.disconnect();
  bgmSource = null;
  bgmStarted = false;
}

function playSfx(name, volume = 0.55, rate = 1) {
  if (!audioEnabled || !audioContext || !audioBuffers[name]) return false;
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = audioBuffers[name];
  source.playbackRate.value = rate;
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(sfxGain || audioContext.destination);
  source.start();
  return true;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.045);
  if (state.mode === "playing") updateGame(dt);
  else updateIdle(dt);
  renderScene(dt);
}

function updateIdle(dt) {
  state.elapsed += dt;
  state.progress = Math.max(0, state.progress + dt * 6);
  state.player.y = Math.sin(state.elapsed * 1.7) * 0.25;
  state.player.x = Math.sin(state.elapsed * 1.1) * 0.4;
  if (playerShip) {
    const pos = worldFromRail(0, state.player.x, state.player.y);
    playerShip.position.copy(pos);
    playerShip.rotation.set(0.06 * Math.sin(state.elapsed * 1.2), 0, 0.08 * Math.sin(state.elapsed));
  }
  updateWingDrones(dt);
}

function updateGame(dt) {
  state.elapsed += dt;
  state.lastProgress = state.progress;
  const player = state.player;
  player.invuln = Math.max(0, player.invuln - dt);
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.rollCooldown = Math.max(0, player.rollCooldown - dt);
  player.heat = Math.max(0, player.heat - dt * 0.42);
  player.overdrive = Math.max(0, player.overdrive - dt);
  player.comboTimer = Math.max(0, player.comboTimer - dt);
  if (player.comboTimer <= 0 && player.combo > 1) player.combo = 1;

  updatePlayerControls(dt);
  updateWingDrones(dt);
  const boosting = isBoosting();
  const targetSpeed = getTargetSpeed(boosting);
  state.speed += (targetSpeed - state.speed) * Math.min(1, dt * 2.6);
  state.progress += state.speed * dt;
  if (state.boss && !state.bossDefeated && state.progress > BOSS.holdAt) {
    state.progress = BOSS.holdAt;
  }
  if (boosting) player.energy = Math.max(0, player.energy - dt * 0.32);
  else player.energy = Math.min(1, player.energy + dt * 0.16);

  spawnScheduledWaves();
  updateMissionDirector();
  if (!state.boss && state.progress >= BOSS.at) spawnBoss();
  updateEnemies(dt);
  updateBoss(dt);
  updatePlayerShots(dt);
  updateEnemyShots(dt);
  updatePowerShards(dt);
  updateStaticInteractions(dt);
  updateExplosions(dt);

  if (state.progress >= COURSE_LENGTH && state.bossDefeated) {
    finishMission(true);
  }

  if (state.elapsed - lastHudUpdate > 0.08) updateHud();
  updateToast(dt);
}

function updatePlayerControls(dt) {
  const player = state.player;
  const left = input.keys.has("KeyA") || input.keys.has("ArrowLeft") || input.touch.has("left");
  const right = input.keys.has("KeyD") || input.keys.has("ArrowRight") || input.touch.has("right");
  const up = input.keys.has("KeyW") || input.keys.has("ArrowUp") || input.touch.has("up");
  const down = input.keys.has("KeyS") || input.keys.has("ArrowDown") || input.touch.has("down");
  const keyboardActive = left || right || up || down;
  const moveSpeed = 12.5 + (isBoosting() ? 2.0 : 0);

  if (keyboardActive) {
    player.x += ((right ? 1 : 0) - (left ? 1 : 0)) * moveSpeed * dt;
    player.y += ((up ? 1 : 0) - (down ? 1 : 0)) * moveSpeed * dt;
  } else if (input.pointerActive) {
    player.x += (input.pointerTarget.x - player.x) * Math.min(1, dt * 8.5);
    player.y += (input.pointerTarget.y - player.y) * Math.min(1, dt * 8.5);
  } else {
    player.x += (0 - player.x) * dt * 0.35;
    player.y += (0 - player.y) * dt * 0.3;
  }

  if (input.rollQueued && player.rollCooldown <= 0) {
    player.rollDir = input.rollQueued;
    player.rollTime = 0.62;
    player.rollCooldown = 1.15;
    player.invuln = Math.max(player.invuln, 0.48);
    input.rollQueued = 0;
    playTone(680, 0.05, "triangle", 0.025);
  }
  if (player.rollTime > 0) player.rollTime = Math.max(0, player.rollTime - dt);

  player.x = THREE.MathUtils.clamp(player.x, -PLAYER_LIMITS.x, PLAYER_LIMITS.x);
  player.y = THREE.MathUtils.clamp(player.y, PLAYER_LIMITS.yMin, PLAYER_LIMITS.yMax);

  if (isFiring() && player.fireCooldown <= 0 && player.heat < 0.98) {
    firePlayerShot();
  }

  if (input.novaQueued || input.touch.has("nova")) {
    useNovaBurst();
    input.novaQueued = false;
  }
}

function getTargetSpeed(boosting) {
  if (state.boss && !state.bossDefeated) return boosting ? 62 : 42;
  return boosting ? BOOST_SPEED : BASE_SPEED;
}

function isBoosting() {
  return (input.keys.has("ShiftLeft") || input.keys.has("ShiftRight") || input.touch.has("boost")) && state.player.energy > 0.06;
}

function isFiring() {
  return input.keys.has("Space") || input.pointerDown || input.touch.has("fire");
}

function setPointerTarget(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / Math.max(1, rect.width);
  const y = (event.clientY - rect.top) / Math.max(1, rect.height);
  input.pointerTarget.x = THREE.MathUtils.clamp((x - 0.5) * PLAYER_LIMITS.x * 2.2, -PLAYER_LIMITS.x, PLAYER_LIMITS.x);
  input.pointerTarget.y = THREE.MathUtils.clamp((0.55 - y) * 11.5, PLAYER_LIMITS.yMin, PLAYER_LIMITS.yMax);
}

function firePlayerShot() {
  const player = state.player;
  const overdrive = player.overdrive > 0;
  player.fireCooldown = overdrive ? 0.075 : 0.13;
  player.heat = Math.min(1, player.heat + (overdrive ? 0.035 : 0.065));
  for (const offset of [-0.34, 0.34]) {
    spawnPlayerShot(player.x + offset, player.y - 0.03, overdrive ? 1.15 : 1, overdrive ? "nova" : "laser");
  }
  if (overdrive) {
    spawnPlayerShot(player.x, player.y + 0.1, 0.72, "laser");
  }
  if (!playSfx("laser", 0.24, 1 + Math.random() * 0.08)) playTone(860, 0.035, "square", 0.012);
}

function spawnPlayerShot(x, y, damage = 1, variant = "laser") {
  const mesh = new THREE.Mesh(geometries.shot, variant === "nova" ? materials.novaShot : materials.laser);
  if (variant === "nova") mesh.scale.set(1.85, 1.85, 1.18);
  projectileGroup.add(mesh);
  const shot = {
    x,
    y,
    progress: state.progress + 4,
    speed: variant === "nova" ? 340 : 285,
    age: 0,
    damage,
    variant,
    mesh,
  };
  state.playerShots.push(shot);
}

function canNovaBurst() {
  return state.mode === "playing" && state.player.nova >= 1;
}

function useNovaBurst() {
  if (!canNovaBurst()) {
    if (state.mode === "playing" && state.player.nova > 0.72) showToast("Nova laedt", 0.55);
    return;
  }

  const player = state.player;
  player.nova = 0;
  player.heat = 0;
  player.energy = 1;
  player.invuln = Math.max(player.invuln, 0.92);

  let destroyed = 0;
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    const dz = enemy.progress - state.progress;
    if (dz > -18 && dz < 255) {
      killEnemy(enemy, true, false);
      destroyed += 1;
    }
  }
  removeDead(state.enemies, dynamicGroup);

  const clearedShots = state.enemyShots.length;
  for (const shot of state.enemyShots) {
    createExplosion(shot.x, shot.y, shot.progress, 0xb7ff68, 5);
    shot.dead = true;
  }
  removeDead(state.enemyShots, projectileGroup);

  if (state.boss && !state.bossDefeated) damageBoss(16);
  if (destroyed || clearedShots) addScore(90 * destroyed + 12 * clearedShots, false);

  for (let i = -3; i <= 3; i += 1) {
    spawnPlayerShot(player.x + i * 0.46, player.y + Math.sin(i) * 0.18, 1.55, "nova");
  }
  createNovaPulse(player.x, player.y, state.progress + 7);
  showToast(destroyed ? `Nova Burst: ${destroyed} Ziele` : "Nova Burst", 1.2);
  if (!playSfx("boost", 0.55, 0.68)) playTone(150, 0.22, "sawtooth", 0.04);
  playTone(680, 0.16, "triangle", 0.032, 0.04);
}

function chargeNova(amount) {
  const player = state.player;
  const wasReady = player.nova >= 1;
  player.nova = Math.min(1, player.nova + amount);
  if (!wasReady && player.nova >= 1 && state.mode === "playing") {
    showToast("Nova Burst bereit", 1.25);
    if (!playSfx("pickup", 0.24, 1.65)) playTone(1180, 0.08, "sine", 0.02);
  }
}

function registerGraze(label, x, y, progress) {
  const player = state.player;
  player.graze += 1;
  addScore(32, true);
  chargeNova(0.028);
  player.energy = Math.min(1, player.energy + 0.012);
  createExplosion(x, y, progress, 0xb7ff68, 7);
  if (player.graze <= 3 || player.graze % 5 === 0) showToast(`${label} knapp +${player.graze}`, 0.72);
  if (!playSfx("boost", 0.08, 1.9)) playTone(980, 0.025, "triangle", 0.01);
}

function createNovaPulse(x, y, progress) {
  const mesh = new THREE.Mesh(geometries.ring, materials.novaPulse.clone());
  mesh.rotation.x = Math.PI * 0.5;
  placeRailObject(mesh, progress, x, y);
  fxGroup.add(mesh);
  state.explosions.push({ mesh, age: 0, life: 0.72, growth: 7.5 });
}

function updateWingDrones(dt) {
  const player = state.player;
  player.droneCooldown = Math.max(0, player.droneCooldown - dt);
  for (const drone of wingDrones) {
    const side = drone.userData.side || 1;
    const orbit = Math.sin(state.elapsed * 2.4 + side) * 0.16;
    const pos = worldFromRail(state.progress - 0.8, player.x + side * 1.18, player.y - 0.34 + orbit);
    drone.position.copy(pos);
    drone.rotation.set(0.2 + orbit, 0, -player.x * 0.06 + side * 0.12);
  }

  if (player.droneCooldown > 0 || state.mode !== "playing") return;
  const target = findDroneTarget();
  if (!target) return;
  player.droneCooldown = 0.5;
  for (const drone of wingDrones) {
    const side = drone.userData.side || 1;
    spawnPlayerShot(player.x + side * 1.08, player.y - 0.32, 0.55);
  }
  if (!playSfx("laser", 0.12, 1.45)) playTone(1020, 0.025, "square", 0.008);
}

function findDroneTarget() {
  let best = null;
  let bestDz = Infinity;
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    const dz = enemy.progress - state.progress;
    if (dz > 12 && dz < 190 && dz < bestDz) {
      best = enemy;
      bestDz = dz;
    }
  }
  if (!best && state.boss && !state.bossDefeated) best = state.boss;
  return best;
}

function spawnScheduledWaves() {
  for (const wave of WAVE_BLUEPRINTS) {
    if (state.progress >= wave.at && !state.waveSpawned.has(wave.id)) {
      state.waveSpawned.add(wave.id);
      spawnWave(wave);
    }
  }
}

function updateMissionDirector() {
  if (state.boss || state.progress < state.nextDirectorAt || state.progress > BOSS.at - 120) return;
  const nearbyEnemies = state.enemies.filter((enemy) => !enemy.dead && enemy.progress - state.progress < 220).length;
  if (nearbyEnemies > 8) {
    state.nextDirectorAt += 150;
    return;
  }
  state.directorWave += 1;
  const tier = state.progress > 2500 ? 3 : state.progress > 1450 ? 2 : 1;
  const typePool = tier === 3 ? ["cutter", "manta", "prism"] : tier === 2 ? ["scout", "cutter", "manta"] : ["scout", "cutter"];
  const type = typePool[state.directorWave % typePool.length];
  const formations = ["pincer", "spiral", "weave", "gate"];
  const formation = formations[state.directorWave % formations.length];
  spawnWave({
    id: `director-${state.directorWave}`,
    type,
    count: Math.min(10, 4 + tier + (state.directorWave % 3)),
    formation,
    x: Math.sin(state.directorWave * 1.7) * 2.8,
    y: 0.5 + Math.cos(state.directorWave * 1.1) * 1.1,
    spread: 1.25 + tier * 0.18,
    elite: state.directorWave % 2 === 0,
    director: true,
  });
  state.nextDirectorAt += Math.max(210, 390 - tier * 40 - state.directorWave * 5);
}

function spawnWave(wave) {
  for (let index = 0; index < wave.count; index += 1) {
    const offset = formationOffset(wave, index);
    const stats = ENEMY_STATS[wave.type];
    const elite = Boolean(wave.elite && (index === Math.floor(wave.count / 2) || (wave.director && index % 4 === 0)));
    const enemy = {
      id: `${wave.id}-${index}`,
      type: wave.type,
      elite,
      hp: stats.hp + (elite ? 1 : 0),
      maxHp: stats.hp + (elite ? 1 : 0),
      score: stats.score + (elite ? 140 : 0),
      radius: stats.radius + (elite ? 0.12 : 0),
      x: wave.x + offset.x,
      y: wave.y + offset.y,
      baseX: wave.x + offset.x,
      baseY: wave.y + offset.y,
      progress: state.progress + 176 + index * 5 + Math.abs(offset.y) * 4,
      speed: stats.speed,
      fireTimer: 0.45 + index * 0.13 + seededRandom() * 0.6,
      phase: seededRandom() * Math.PI * 2,
      age: 0,
      mesh: createEnemyMesh(wave.type, elite),
    };
    dynamicGroup.add(enemy.mesh);
    state.enemies.push(enemy);
  }
  showToast(wave.director ? `Ambush: ${wave.type.toUpperCase()}` : "Kontakt: " + wave.type.toUpperCase(), 1.1);
}

function formationOffset(wave, index) {
  const mid = (wave.count - 1) / 2;
  const n = index - mid;
  const spread = wave.spread || 1.5;
  if (wave.formation === "vee") return { x: n * spread, y: Math.abs(n) * 0.72 };
  if (wave.formation === "line") return { x: n * spread, y: Math.sin(index) * 0.55 };
  if (wave.formation === "arc") return { x: n * spread, y: Math.cos((n / Math.max(1, mid)) * Math.PI * 0.5) * 2.0 };
  if (wave.formation === "cross") return { x: (index % 2 ? n : 0) * spread, y: (index % 2 ? 0 : n) * spread * 0.72 };
  if (wave.formation === "stack") return { x: Math.sin(index * 1.8) * spread, y: n * spread * 0.72 };
  if (wave.formation === "ladder") return { x: n * spread, y: (index % 3) * 1.2 - 1.2 };
  if (wave.formation === "weave") return { x: n * spread * 0.9, y: Math.sin(index * 0.9) * 2.2 };
  if (wave.formation === "pincer") return { x: (index % 2 === 0 ? -1 : 1) * (3.2 + Math.abs(n) * spread * 0.52), y: n * spread * 0.42 };
  if (wave.formation === "spiral") {
    const angle = index * 1.38;
    return { x: Math.cos(angle) * spread * (1.2 + index * 0.12), y: Math.sin(angle) * spread * (0.9 + index * 0.08) };
  }
  if (wave.formation === "gate") return { x: n * spread, y: (index % 2 === 0 ? 1 : -1) * (1.2 + Math.abs(n) * 0.18) };
  return { x: n * spread, y: 0 };
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    enemy.age += dt;
    enemy.progress -= enemy.speed * dt;
    const dz = enemy.progress - state.progress;
    const weave = enemy.type === "cutter" ? 1.45 : enemy.type === "manta" ? 0.82 : enemy.type === "prism" ? 0.55 : 1.05;
    const pressure = enemy.elite ? 0.52 : 0;
    enemy.x = enemy.baseX + Math.sin(enemy.age * (1.4 + weave + pressure) + enemy.phase) * (weave + pressure);
    enemy.y = enemy.baseY + Math.cos(enemy.age * 1.25 + enemy.phase) * weave * 0.55 + (enemy.elite ? Math.sin(enemy.age * 3.2) * 0.34 : 0);
    enemy.mesh.rotation.z += dt * (enemy.type === "prism" ? 1.8 : enemy.elite ? 1.35 : 0.7);
    enemy.mesh.rotation.x = Math.sin(enemy.age * 1.6) * 0.14;
    placeRailObject(enemy.mesh, enemy.progress, enemy.x, enemy.y);

    enemy.fireTimer -= dt;
    if (enemy.fireTimer <= 0 && dz > 24 && dz < 155) {
      const stats = ENEMY_STATS[enemy.type];
      spawnEnemyShot(enemy.x, enemy.y, enemy.progress, enemy.type === "prism" ? 118 : 98);
      if (enemy.elite) spawnEnemyShot(enemy.x + Math.sin(enemy.age) * 0.7, enemy.y - 0.25, enemy.progress, 108, Math.sin(enemy.phase) * 1.2);
      enemy.fireTimer = (stats.fireRate + seededRandom() * 0.55) * (enemy.elite ? 0.72 : 1);
    }

    if (dz < -18) enemy.dead = true;
    if (Math.abs(dz) < enemy.radius + 0.8 && localDistanceToPlayer(enemy) < enemy.radius + 0.75) {
      damagePlayer(22);
      killEnemy(enemy, false);
    }
  }
  removeDead(state.enemies, dynamicGroup);
}

function spawnBoss() {
  state.boss = {
    hp: BOSS.hp,
    maxHp: BOSS.hp,
    x: 0,
    y: 1.2,
    progress: state.progress + 126,
    age: 0,
    fireTimer: 1.2,
    volleyTimer: 3.4,
    mesh: createBossMesh(),
  };
  dynamicGroup.add(state.boss.mesh);
  ui.bossBar.classList.remove("hidden");
  showToast("Aegis Prism voraus", 2.0);
  playTone(110, 0.3, "sawtooth", 0.045);
}

function updateBoss(dt) {
  const boss = state.boss;
  if (!boss || state.bossDefeated) return;
  boss.age += dt;
  boss.progress = state.progress + 120;
  boss.x = Math.sin(boss.age * 0.84) * 4.8 + Math.sin(boss.age * 1.9) * 1.2;
  boss.y = 1.1 + Math.sin(boss.age * 1.14) * 1.65;
  placeRailObject(boss.mesh, boss.progress, boss.x, boss.y);
  boss.mesh.rotation.y += dt * 0.28;
  boss.mesh.rotation.z = Math.sin(boss.age * 0.8) * 0.22;

  boss.fireTimer -= dt;
  boss.volleyTimer -= dt;
  if (boss.fireTimer <= 0) {
    spawnEnemyShot(boss.x - 2.8, boss.y - 0.3, boss.progress - 1, 118, -0.6);
    spawnEnemyShot(boss.x + 2.8, boss.y - 0.3, boss.progress - 1, 118, 0.6);
    boss.fireTimer = 0.52;
  }
  if (boss.volleyTimer <= 0) {
    for (let i = -2; i <= 2; i += 1) {
      spawnEnemyShot(boss.x + i * 0.85, boss.y + Math.abs(i) * 0.18, boss.progress - 2, 132, i * 1.3);
    }
    boss.volleyTimer = 3.2;
    showToast("Prismensalve", 0.95);
  }
}

function spawnEnemyShot(x, y, progress, speed = 100, spreadX = 0) {
  const mesh = new THREE.Mesh(geometries.enemyShot, materials.enemyLaser);
  projectileGroup.add(mesh);
  const travelTime = Math.max(0.75, (progress - state.progress) / (speed + state.speed));
  state.enemyShots.push({
    x,
    y,
    progress,
    vx: (state.player.x - x) / travelTime + spreadX,
    vy: (state.player.y - y) / travelTime,
    vp: -speed,
    age: 0,
    mesh,
  });
}

function updatePlayerShots(dt) {
  for (const shot of state.playerShots) {
    shot.age += dt;
    shot.progress += shot.speed * dt;
    placeRailObject(shot.mesh, shot.progress, shot.x, shot.y);
    shot.mesh.rotation.z += dt * 9;
    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      const dz = shot.progress - enemy.progress;
      if (Math.abs(dz) < 5.5 && localDistance(shot, enemy) < enemy.radius + 0.42) {
        shot.dead = true;
        damageEnemy(enemy, shot.damage);
        break;
      }
    }
    if (!shot.dead && state.boss && !state.bossDefeated) {
      const dz = shot.progress - state.boss.progress;
      if (Math.abs(dz) < 7.5 && localDistance(shot, state.boss) < BOSS.radius) {
        shot.dead = true;
        damageBoss(shot.damage);
      }
    }
    if (shot.age > 1.6 || shot.progress - state.progress > 360) shot.dead = true;
  }
  removeDead(state.playerShots, projectileGroup);
}

function updateEnemyShots(dt) {
  for (const shot of state.enemyShots) {
    if (shot.dead) continue;
    shot.age += dt;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.progress += shot.vp * dt;
    placeRailObject(shot.mesh, shot.progress, shot.x, shot.y);
    const dz = shot.progress - state.progress;
    const distance = localDistanceToPlayer(shot);
    if (Math.abs(dz) < 3.2 && distance < 0.72) {
      shot.dead = true;
      damagePlayer(14);
    } else if (!shot.grazed && Math.abs(dz) < 4.2 && distance < 1.48) {
      shot.grazed = true;
      registerGraze("Laser", shot.x, shot.y, shot.progress);
    }
    if (dz < -15 || shot.age > 3) shot.dead = true;
  }
  removeDead(state.enemyShots, projectileGroup);
}

function damageEnemy(enemy, damage) {
  enemy.hp -= damage;
  createExplosion(enemy.x, enemy.y, enemy.progress, enemy.hp <= 0 ? 0xffca62 : 0x44e6ff, enemy.hp <= 0 ? 22 : 8);
  if (!playSfx(enemy.hp <= 0 ? "explosion" : "hit", enemy.hp <= 0 ? 0.32 : 0.18, enemy.hp <= 0 ? 1.35 : 1.8)) {
    playTone(enemy.hp <= 0 ? 260 : 520, 0.04, "triangle", 0.018);
  }
  if (enemy.hp <= 0) killEnemy(enemy, true);
}

function addScore(base, extendCombo = true) {
  const player = state.player;
  const multiplier = THREE.MathUtils.clamp(Math.floor(player.combo), 1, 9);
  player.score += Math.round(base * multiplier);
  if (extendCombo) bumpCombo();
}

function bumpCombo() {
  const player = state.player;
  player.combo = Math.min(9, player.combo + 1);
  player.comboTimer = 4.8;
  player.bestCombo = Math.max(player.bestCombo, player.combo);
}

function killEnemy(enemy, awardScore, novaReward = true) {
  if (enemy.dead) return;
  enemy.dead = true;
  if (awardScore) {
    addScore(enemy.score, true);
    state.player.energy = Math.min(1, state.player.energy + 0.04);
    if (novaReward) chargeNova(enemy.type === "prism" ? 0.11 : 0.075);
    if (novaReward) dropPowerShards(enemy, enemy.elite ? 3 : enemy.type === "prism" ? 2 : 1);
  }
  createExplosion(enemy.x, enemy.y, enemy.progress, 0xff5f9a, 26);
}

function dropPowerShards(source, count) {
  for (let i = 0; i < count; i += 1) {
    createPowerShard(
      source.x + (seededRandom() - 0.5) * 1.35,
      source.y + (seededRandom() - 0.5) * 1.1,
      source.progress + (seededRandom() - 0.5) * 4,
      source.elite ? 90 : 55,
    );
  }
}

function createPowerShard(x, y, progress, value = 55) {
  const mesh = new THREE.Mesh(geometries.shard, materials.powerShard.clone());
  dynamicGroup.add(mesh);
  state.powerShards.push({
    x,
    y,
    progress,
    value,
    age: 0,
    phase: seededRandom() * Math.PI * 2,
    mesh,
  });
}

function updatePowerShards(dt) {
  for (const shard of state.powerShards) {
    shard.age += dt;
    const dz = shard.progress - state.progress;
    if (dz < 88 && dz > -10) {
      shard.x += (state.player.x - shard.x) * dt * 1.45;
      shard.y += (state.player.y - shard.y) * dt * 1.45;
    }
    shard.progress -= dt * 8;
    shard.mesh.rotation.x += dt * 2.3;
    shard.mesh.rotation.y += dt * 3.1;
    shard.mesh.scale.setScalar(1 + Math.sin(state.elapsed * 5 + shard.phase) * 0.14);
    placeRailObject(shard.mesh, shard.progress, shard.x, shard.y);
    if (dz < -18 || shard.age > 5.2) shard.dead = true;
    if (!shard.dead && Math.abs(dz) < 4.2 && localDistanceToPlayer(shard) < 1.12) {
      collectPowerShard(shard);
    }
  }
  removeDead(state.powerShards, dynamicGroup);
}

function collectPowerShard(shard) {
  shard.dead = true;
  const player = state.player;
  player.shardChain += 1;
  player.energy = Math.min(1, player.energy + 0.035);
  chargeNova(0.035);
  addScore(shard.value, true);
  createExplosion(shard.x, shard.y, shard.progress, 0xb7ff68, 10);
  if (player.shardChain % 5 === 0) {
    player.overdrive = Math.max(player.overdrive, 5.5);
    player.heat = 0;
    showToast("Overdrive: Feuer frei", 1.1);
    if (!playSfx("boost", 0.34, 1.55)) playTone(1180, 0.09, "triangle", 0.024);
  } else if (player.shardChain <= 3 || player.shardChain % 4 === 0) {
    showToast(`Prism Shard x${player.shardChain}`, 0.7);
  }
}

function damageBoss(damage) {
  const boss = state.boss;
  if (!boss || state.bossDefeated) return;
  boss.hp = Math.max(0, boss.hp - damage);
  if (damage < 10) chargeNova(0.012);
  createExplosion(boss.x + (seededRandom() - 0.5) * 4.5, boss.y + (seededRandom() - 0.5) * 2.8, boss.progress, 0xffca62, 12);
  if (boss.hp <= 0) {
    state.bossDefeated = true;
    addScore(BOSS.score, false);
    createExplosion(boss.x, boss.y, boss.progress, 0xb7ff68, 90);
    dynamicGroup.remove(boss.mesh);
    ui.bossBar.classList.add("hidden");
    showToast("Aegis Prism zerbrochen", 2.0);
    playSfx("explosion", 0.58, 0.78);
    playTone(180, 0.18, "sawtooth", 0.045);
    playTone(540, 0.3, "triangle", 0.04, 0.08);
  }
}

function updateStaticInteractions(dt) {
  for (const entry of staticObjects.gates) {
    const dz = entry.data.progress - state.progress;
    entry.mesh.visible = dz > -60 && dz < 480;
    entry.mesh.rotation.z += dt * 0.07;
  }
  for (const entry of staticObjects.rings) {
    const ring = entry.data;
    const dz = ring.progress - state.progress;
    entry.mesh.visible = !state.ringCollected.has(ring.id) && dz > -32 && dz < 260;
    entry.mesh.rotation.z += dt * 1.2;
    entry.mesh.rotation.x = Math.sin(state.elapsed * 1.7 + ring.progress) * 0.08;
    if (!state.ringCollected.has(ring.id) && state.lastProgress < ring.progress && state.progress >= ring.progress) {
      const distance = Math.hypot(state.player.x - ring.x, state.player.y - ring.y);
      if (distance <= ring.radius + 0.48) {
        state.ringCollected.add(ring.id);
        entry.mesh.visible = false;
        addScore(ring.score, true);
        state.player.energy = Math.min(1, state.player.energy + ring.energy);
        chargeNova(0.045);
        createExplosion(ring.x, ring.y, ring.progress, 0x44e6ff, 14);
        if (!playSfx("boost", 0.22, 1.35)) playTone(740, 0.05, "sine", 0.024);
      }
    }
  }
  for (const entry of staticObjects.obstacles) {
    const obstacle = entry.data;
    const dz = obstacle.progress - state.progress;
    entry.mesh.visible = !state.obstacleHit.has(obstacle.id) && dz > -42 && dz < 230;
    entry.mesh.rotation.x += dt * obstacle.spin;
    entry.mesh.rotation.y += dt * obstacle.spin * 0.72;
    if (!state.obstacleHit.has(obstacle.id) && Math.abs(dz) < obstacle.radius + 1.25) {
      const distance = Math.hypot(state.player.x - obstacle.x, state.player.y - obstacle.y);
      if (distance < obstacle.radius + 0.62) {
        state.obstacleHit.add(obstacle.id);
        entry.mesh.visible = false;
        damagePlayer(obstacle.damage);
        createExplosion(obstacle.x, obstacle.y, obstacle.progress, obstacle.crystal ? 0x44e6ff : 0xffca62, 34);
      } else if (!state.obstacleGrazed.has(obstacle.id) && distance < obstacle.radius + 1.38) {
        state.obstacleGrazed.add(obstacle.id);
        registerGraze(obstacle.crystal ? "Kristall" : "Asteroid", obstacle.x, obstacle.y, obstacle.progress);
      }
    }
  }
  for (const entry of staticObjects.pickups) {
    const pickup = entry.data;
    const dz = pickup.progress - state.progress;
    entry.mesh.visible = !state.pickupCollected.has(pickup.id) && dz > -32 && dz < 220;
    entry.mesh.rotation.y += dt * 2.3;
    entry.mesh.position.y += Math.sin(state.elapsed * 3 + pickup.progress) * 0.003;
    if (!state.pickupCollected.has(pickup.id) && Math.abs(dz) < 3.5 && localDistanceToPlayer(pickup) < 1.25) {
      state.pickupCollected.add(pickup.id);
      entry.mesh.visible = false;
      collectPickup(pickup);
    }
  }
  for (const entry of staticObjects.dataCores) {
    const core = entry.data;
    const dz = core.progress - state.progress;
    entry.mesh.visible = !state.dataCoreCollected.has(core.id) && dz > -32 && dz < 220;
    entry.mesh.rotation.x += dt * 1.7;
    entry.mesh.rotation.y += dt * 2.4;
    entry.mesh.scale.setScalar(1 + Math.sin(state.elapsed * 4 + core.progress) * 0.08);
    if (!state.dataCoreCollected.has(core.id) && Math.abs(dz) < 3.6 && localDistanceToPlayer(core) < 1.18) {
      state.dataCoreCollected.add(core.id);
      entry.mesh.visible = false;
      collectDataCore(core);
    }
  }
}

function collectPickup(pickup) {
  if (pickup.type === "repair") {
    state.player.hp = Math.min(100, state.player.hp + 26);
    showToast("Hull repariert", 1.1);
    if (!playSfx("pickup", 0.38, 0.85)) playTone(420, 0.12, "sine", 0.03);
  } else if (pickup.type === "charge") {
    state.player.energy = 1;
    showToast("Boost geladen", 1.1);
    if (!playSfx("boost", 0.4, 1)) playTone(700, 0.1, "triangle", 0.03);
  } else {
    state.player.shield = Math.min(100, state.player.shield + 38);
    showToast("Schildmatrix online", 1.1);
    if (!playSfx("pickup", 0.36, 1.1)) playTone(560, 0.14, "sine", 0.03);
  }
  addScore(150, false);
  chargeNova(0.035);
  createExplosion(pickup.x, pickup.y, pickup.progress, 0xb7ff68, 22);
}

function collectDataCore(core) {
  addScore(core.score, true);
  state.player.energy = Math.min(1, state.player.energy + 0.22);
  state.player.shield = Math.min(100, state.player.shield + 8);
  chargeNova(0.13);
  createExplosion(core.x, core.y, core.progress, 0xf6fbff, 28);
  showToast(`Datenkern ${state.dataCoreCollected.size}/${DATA_CORES.length}`, 1.25);
  if (!playSfx("pickup", 0.42, 1.42)) playTone(900, 0.08, "triangle", 0.024);
  playTone(1350, 0.08, "sine", 0.02, 0.05);
}

function damagePlayer(amount) {
  const player = state.player;
  if (player.invuln > 0) return;
  let remaining = amount;
  if (player.shield > 0) {
    const used = Math.min(player.shield, remaining);
    player.shield -= used;
    remaining -= used;
  }
  if (remaining > 0) player.hp -= remaining;
  player.invuln = 0.78;
  ui.damageFlash.classList.add("active");
  window.setTimeout(() => ui.damageFlash.classList.remove("active"), 110);
  showToast("Treffer", 0.65);
  if (!playSfx("hit", 0.45, 0.85)) playTone(92, 0.12, "sawtooth", 0.045);
  if (player.hp <= 0) finishMission(false);
}

function finishMission(success) {
  if (state.mode === "results") return;
  state.mode = "results";
  ui.resultEyebrow.textContent = success ? "Mission geschafft" : "Mission verloren";
  ui.resultTitle.textContent = success ? "Prismenguertel frei" : "Nova Wing down";
  const rings = state.ringCollected.size;
  const cores = state.dataCoreCollected.size;
  const medals = missionMedals(success);
  ui.resultStats.textContent = `${state.player.score} Punkte, ${rings}/${RINGS.length} Ringe, ${cores}/${DATA_CORES.length} Kerne, ${state.player.shardChain} Shards, ${state.player.graze} Near Misses, beste Serie x${state.player.bestCombo}, ${formatTime(state.elapsed)}. Medaillen: ${medals.join(", ")}`;
  ui.results.classList.remove("hidden");
  ui.results.classList.add("active");
  ui.bossBar.classList.add("hidden");
  ui.pauseButton.textContent = "II";
  if (success) playSfx("win", 0.58, 1);
  playTone(success ? 640 : 120, success ? 0.24 : 0.42, success ? "triangle" : "sawtooth", 0.052);
}

function missionMedals(success) {
  const rings = state.ringCollected.size;
  const cores = state.dataCoreCollected.size;
  const medals = [];
  if (success) medals.push("Prismensieg");
  if (cores === DATA_CORES.length) medals.push("Kernsammler");
  if (rings >= Math.ceil(RINGS.length * 0.75)) medals.push("Ringpilot");
  if (state.player.shardChain >= 18) medals.push("Shard-Jaeger");
  if (state.player.graze >= 8) medals.push("Risk Runner");
  if (state.player.bestCombo >= 8) medals.push("Combo-Ass");
  if (success && state.player.hp >= 72) medals.push("Saubere Huelle");
  if (!medals.length) medals.push("Trainingsflug");
  return medals;
}

function updateExplosions(dt) {
  for (const explosion of state.explosions) {
    explosion.age += dt;
    explosion.mesh.scale.setScalar(1 + explosion.age * explosion.growth);
    explosion.mesh.material.opacity = Math.max(0, 1 - explosion.age / explosion.life);
    if (explosion.age >= explosion.life) explosion.dead = true;
  }
  removeDead(state.explosions, fxGroup);
}

function createExplosion(x, y, progress, color, count) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const angle = seededRandom() * Math.PI * 2;
    const radius = seededRandom() * 1.3;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius;
    positions[i * 3 + 2] = (seededRandom() - 0.5) * 1.5;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size: 0.22,
    transparent: true,
    opacity: 1,
    depthWrite: false,
  });
  const mesh = new THREE.Points(geometry, material);
  placeRailObject(mesh, progress, x, y);
  fxGroup.add(mesh);
  state.explosions.push({ mesh, age: 0, life: 0.55 + count * 0.004, growth: 1.8 + count * 0.035 });
}

function removeDead(list, group) {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (!list[i].dead) continue;
    const mesh = list[i].mesh;
    if (mesh && mesh.parent) mesh.parent.remove(mesh);
    list.splice(i, 1);
  }
}

function updateHud(force = false) {
  lastHudUpdate = state.elapsed;
  const section = getSection(state.progress);
  ui.sectorText.textContent = section.name;
  if (state.player.overdrive > 0) ui.objectiveText.textContent = `Overdrive ${Math.ceil(state.player.overdrive)}s`;
  else if (state.boss && !state.bossDefeated) ui.objectiveText.textContent = "Aegis Prism zerlegen";
  else if (state.progress > BOSS.at - 260) ui.objectiveText.textContent = "Zum Prism Core";
  else ui.objectiveText.textContent = section.objective;
  ui.scoreText.textContent = String(Math.floor(state.player.score));
  ui.hpFill.style.width = `${THREE.MathUtils.clamp(state.player.hp, 0, 100)}%`;
  ui.shieldFill.style.width = `${THREE.MathUtils.clamp(state.player.shield, 0, 100)}%`;
  ui.energyFill.style.width = `${Math.round(THREE.MathUtils.clamp(state.player.energy, 0, 1) * 100)}%`;
  ui.novaFill.style.width = `${Math.round(THREE.MathUtils.clamp(state.player.nova, 0, 1) * 100)}%`;
  ui.progressFill.style.width = `${Math.round(THREE.MathUtils.clamp(state.progress / COURSE_LENGTH, 0, 1) * 100)}%`;
  ui.comboText.textContent = `x${Math.max(1, Math.floor(state.player.combo))}`;
  ui.coreText.textContent = `${state.dataCoreCollected.size}/${DATA_CORES.length}`;
  if (state.boss && !state.bossDefeated) {
    ui.bossBar.classList.remove("hidden");
    ui.bossFill.style.width = `${Math.round((state.boss.hp / state.boss.maxHp) * 100)}%`;
  } else if (force) {
    ui.bossBar.classList.add("hidden");
  }
}

function updateToast(dt) {
  if (state.toastTimer <= 0) return;
  state.toastTimer -= dt;
  if (state.toastTimer <= 0) ui.toast.classList.add("hidden");
}

function showToast(text, duration = 1.4) {
  if (!text) {
    ui.toast.classList.add("hidden");
    state.toastTimer = 0;
    return;
  }
  ui.toast.textContent = text;
  ui.toast.classList.remove("hidden");
  state.toastTimer = duration;
}

function renderScene(dt) {
  const playerWorld = worldFromRail(state.progress, state.player.x, state.player.y);
  const rollProgress = state.player.rollTime > 0 ? state.player.rollTime / 0.62 : 0;
  const rollAngle = state.player.rollDir * Math.sin(rollProgress * Math.PI) * Math.PI * 1.85;
  const energized = isBoosting() || state.player.overdrive > 0;
  const boostShake = energized && state.mode === "playing" ? Math.sin(state.elapsed * 38) * 0.05 : 0;

  if (playerShip) {
    playerShip.position.copy(playerWorld);
    playerShip.rotation.x = -state.player.y * 0.035 + boostShake;
    playerShip.rotation.y = -state.player.x * 0.025;
    playerShip.rotation.z = -state.player.x * 0.075 + rollAngle;
    const glowScale = energized ? 1.5 + Math.sin(state.elapsed * 30) * 0.18 : 1;
    for (const child of playerShip.children) {
      if (child.userData.engineGlow) child.scale.setScalar(glowScale);
      if (child.userData.engineFlare) {
        child.material.opacity = energized ? 0.88 : 0.52;
        child.scale.setScalar((energized ? 1.2 : 0.72) + Math.sin(state.elapsed * 24) * 0.08);
      }
    }
    const shield = playerShip.getObjectByName("player-shield-shell");
    if (shield) {
      const shieldPower = THREE.MathUtils.clamp(state.player.shield / 100, 0, 1);
      shield.visible = shieldPower > 0.03 || state.player.invuln > 0;
      shield.material.opacity = 0.12 + shieldPower * 0.22 + (state.player.invuln > 0 ? 0.08 : 0);
      shield.scale.setScalar(1.03 + Math.sin(state.elapsed * 4.2) * 0.025);
      shield.rotation.y += dt * 0.7;
      shield.rotation.z -= dt * 0.35;
    }
  }

  const camCenter = railCenter(state.progress - 18);
  camera.position.set(
    camCenter.x + state.player.x * 0.34,
    camCenter.y + 3.2 + state.player.y * 0.32,
    -state.progress + 13.5,
  );
  lookTarget.copy(worldFromRail(state.progress + 48, state.player.x * 0.44, state.player.y * 0.34));
  camera.lookAt(lookTarget);
  chaseLight.position.copy(playerWorld).add(new THREE.Vector3(0, 2.8, 5.2));

  const stars = camera.getObjectByName("camera-starfield");
  if (stars) stars.rotation.z += dt * 0.006;
  if (speedLines) {
    speedLines.material.opacity = state.mode === "playing" && energized ? 0.38 : 0.14;
    speedLines.rotation.z = Math.sin(state.elapsed * 0.9) * 0.018;
  }

  renderer.render(scene, camera);
}

function placeRailObject(mesh, progress, localX, localY) {
  mesh.position.copy(worldFromRail(progress, localX, localY));
}

function worldFromRail(progress, localX = 0, localY = 0) {
  const center = railCenter(progress);
  tmpVec.set(center.x + localX, center.y + localY, -progress);
  return tmpVec.clone();
}

function localDistance(a, b) {
  const aw = railCenter(a.progress);
  const bw = railCenter(b.progress);
  return Math.hypot(aw.x + a.x - (bw.x + b.x), aw.y + a.y - (bw.y + b.y));
}

function localDistanceToPlayer(object) {
  const objectCenter = railCenter(object.progress);
  const playerCenter = railCenter(state.progress);
  return Math.hypot(objectCenter.x + object.x - (playerCenter.x + state.player.x), objectCenter.y + object.y - (playerCenter.y + state.player.y));
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}
