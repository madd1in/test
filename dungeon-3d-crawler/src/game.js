import * as THREE from "three";

const CELL = 4;
const WALL_HEIGHT = 3.9;
const CAMERA_HEIGHT = 1.72;
const MAX_DEPTH = 3;
const MAP_LINES = [
  "###############",
  "#S...M....C..R#",
  "#.###.#####.#.#",
  "#...#.....#.#.#",
  "###.#.###.#.#.#",
  "#...#R..#...#.#",
  "#.####.#.###..#",
  "#C....#....M..#",
  "###.#.#######.#",
  "#...#.....#...#",
  "#.###.###.#.#.#",
  "#.....#R..#.#.#",
  "#.###.#.###.#.#",
  "#..M..#C..D.BX#",
  "###############"
];

const DIRS = [
  { x: 0, y: -1, label: "Nord", yaw: 0 },
  { x: 1, y: 0, label: "Ost", yaw: -Math.PI / 2 },
  { x: 0, y: 1, label: "Sued", yaw: Math.PI },
  { x: -1, y: 0, label: "West", yaw: Math.PI / 2 }
];

const ASSETS = {
  sprites: {
    skeleton: "./assets/sprites/enemy-skeleton.png",
    knight: "./assets/sprites/enemy-knight.png",
    gargoyle: "./assets/sprites/enemy-gargoyle.png",
    reaper: "./assets/sprites/enemy-reaper.png",
    phantom: "./assets/sprites/enemy-phantom.png",
    witch: "./assets/sprites/enemy-witch.png",
    acolyte: "./assets/sprites/enemy-acolyte.svg",
    sentinel: "./assets/sprites/enemy-sentinel.svg",
    lantern: "./assets/sprites/enemy-lantern.svg",
    oracle: "./assets/sprites/npc-oracle.svg",
    boss: "./assets/sprites/boss-sheet.png"
  },
  props: {
    chest: "./assets/props/chest.png",
    candle: "./assets/props/candle.png",
    torch: "./assets/props/torch.png",
    statue: "./assets/props/statue.png",
    book: "./assets/props/book.png",
    ruby: "./assets/props/ruby.png",
    axe: "./assets/props/axe.png",
    spikes: "./assets/props/spikes.png",
    chapel: "./assets/props/chapel-backdrop.png",
    wallRune: "./assets/props/wall-rune.svg",
    wallBones: "./assets/props/wall-bones.svg"
  },
  audio: {
    music: ["./assets/audio/music/moonveil-keep.mp3", "./assets/audio/music/catacomb-bell-vault.mp3"],
    sfx: {
      slash: "./assets/audio/sfx/slash.mp3",
      bones: "./assets/audio/sfx/bones.mp3",
      armor: "./assets/audio/sfx/armor.mp3",
      thunder: "./assets/audio/sfx/thunder.mp3"
    }
  }
};

const DEPTH_THEMES = [
  {
    name: "Mondkrypta",
    background: 0x050403,
    fog: 0x070906,
    fogDensity: 0.055,
    ambientSky: 0x748c8f,
    ambientGround: 0x1a0f0b,
    ambientIntensity: 0.55,
    moon: 0xbfd7ff,
    moonIntensity: 1.05,
    torch: 0xff9d4d,
    accent: 0x69dfc0,
    portal: 0x69dfc0,
    rune: 0x90f8ff,
    wall: ["#4a5148", "#1f241f", "#a5ad95"],
    floor: ["#3d4236", "#1e211b", "#817b61"],
    ceiling: 0x151a16
  },
  {
    name: "Blutarchiv",
    background: 0x090409,
    fog: 0x10050b,
    fogDensity: 0.064,
    ambientSky: 0x93727d,
    ambientGround: 0x21100b,
    ambientIntensity: 0.5,
    moon: 0xffd1a0,
    moonIntensity: 0.92,
    torch: 0xff725c,
    accent: 0xe9bd69,
    portal: 0xe87861,
    rune: 0xffd47e,
    wall: ["#514044", "#24191d", "#a88877"],
    floor: ["#463735", "#201818", "#8f7464"],
    ceiling: 0x171116
  },
  {
    name: "Glockenabgrund",
    background: 0x03060b,
    fog: 0x050911,
    fogDensity: 0.072,
    ambientSky: 0x7287b8,
    ambientGround: 0x0b1715,
    ambientIntensity: 0.48,
    moon: 0x9bdcff,
    moonIntensity: 1.18,
    torch: 0x7ee7ff,
    accent: 0xa992ff,
    portal: 0xa992ff,
    rune: 0xaef6ff,
    wall: ["#384552", "#161e25", "#7d92a3"],
    floor: ["#303b42", "#151b1f", "#718391"],
    ceiling: 0x0d141d
  }
];

const RELIC_DEFS = [
  { id: "ember", name: "Brandklinge", atk: 2, note: "Hiebe brennen nach." },
  { id: "aegis", name: "Aegis-Splitter", guard: 1, maxHp: 5, note: "Schlaege prallen haerter ab." },
  { id: "lens", name: "Sternenlinse", maxFocus: 3, focus: 3, note: "Mehr Fokus fuer Zauber." },
  { id: "boots", name: "Nebelstiefel", dodge: 0.12, note: "Manche Treffer verfehlen dich." },
  { id: "bell", name: "Glockenscherbe", crit: 0.1, note: "Kritische Treffer werden wahrscheinlicher." }
];

const ENEMY_DEFS = {
  skeleton: { name: "Knochendiener", hp: 14, atk: 4, sprite: "skeleton", size: 1.55 },
  knight: { name: "Hohlritter", hp: 22, atk: 6, sprite: "knight", size: 1.75 },
  gargoyle: { name: "Firstwache", hp: 18, atk: 5, sprite: "gargoyle", size: 1.85 },
  reaper: { name: "Sichelgeist", hp: 20, atk: 7, sprite: "reaper", size: 1.75 },
  phantom: { name: "Phantom", hp: 16, atk: 6, sprite: "phantom", size: 1.6 },
  witch: { name: "Kerzenhexe", hp: 17, atk: 5, sprite: "witch", size: 1.6 },
  acolyte: { name: "Blutakolyth", hp: 19, atk: 6, sprite: "acolyte", size: 1.72 },
  sentinel: { name: "Runensentinel", hp: 28, atk: 7, sprite: "sentinel", size: 1.9 },
  lantern: { name: "Laternenrufer", hp: 18, atk: 6, sprite: "lantern", size: 1.68 }
};

const PROP_POINTS = [
  { key: "torch", x: 2, y: 1, size: 1.2, light: true },
  { key: "torch", x: 11, y: 1, size: 1.2, light: true },
  { key: "statue", x: 3, y: 3, size: 1.85 },
  { key: "candle", x: 7, y: 5, size: 1.05, light: true },
  { key: "spikes", x: 13, y: 6, size: 1.6 },
  { key: "book", x: 9, y: 9, size: 1.15 },
  { key: "torch", x: 4, y: 11, size: 1.2, light: true },
  { key: "statue", x: 12, y: 11, size: 1.9 },
  { key: "axe", x: 6, y: 13, size: 1.25 },
  { key: "candle", x: 10, y: 13, size: 1.0, light: true }
];

const HANGING_POINTS = [
  { x: 5, y: 1 },
  { x: 7, y: 7 },
  { x: 8, y: 9 },
  { x: 9, y: 13 }
];

const WALL_DECAL_POINTS = [
  { key: "wallRune", x: 2, y: 2 },
  { key: "wallBones", x: 10, y: 2 },
  { key: "wallRune", x: 4, y: 6 },
  { key: "wallBones", x: 8, y: 8 },
  { key: "wallRune", x: 6, y: 12 },
  { key: "wallBones", x: 12, y: 12 }
];

const NPC_POINTS = [
  { x: 3, y: 1, name: "Orakel am Einstieg" }
];

const TRAPS = [
  { x: 8, y: 3, armed: true },
  { x: 2, y: 9, armed: true },
  { x: 11, y: 12, armed: true }
];

const SHRINE_POINTS = [
  { x: 7, y: 3, kind: "focus" },
  { x: 9, y: 9, kind: "blood" },
  { x: 12, y: 11, kind: "ward" }
];

const SECRET_WALL_POINTS = [
  { x: 4, y: 4, hp: 2 },
  { x: 6, y: 8, hp: 2 },
  { x: 10, y: 12, hp: 3 }
];

const EXTRA_DEPTH_ENEMIES = {
  2: [
    { x: 9, y: 3, kind: "phantom" },
    { x: 5, y: 9, kind: "witch" },
    { x: 12, y: 3, kind: "acolyte" }
  ],
  3: [
    { x: 3, y: 5, kind: "reaper" },
    { x: 11, y: 5, kind: "gargoyle" },
    { x: 5, y: 11, kind: "knight" },
    { x: 9, y: 9, kind: "sentinel" },
    { x: 12, y: 12, kind: "lantern" }
  ]
};

const $ = (id) => document.getElementById(id);

const canvas = $("game");
const hpText = $("hpText");
const hpFill = $("hpFill");
const runeText = $("runeText");
const atkText = $("atkText");
const focusText = $("focusText");
const focusFill = $("focusFill");
const depthText = $("depthText");
const relicText = $("relicText");
const objectiveText = $("objectiveText");
const messageText = $("messageText");
const miniMap = $("miniMap");
const startOverlay = $("startOverlay");
const startBtn = $("startBtn");
const overlayStartBtn = $("overlayStartBtn");
const audioBtn = $("audioBtn");
const restartBtn = $("restartBtn");
const mapBtn = $("mapBtn");
const fullscreenBtn = $("fullscreenBtn");
const swipePad = $("swipePad");
const damageFlash = $("damageFlash");
const routeChip = $("routeChip");
const routeArrow = $("routeArrow");
const routeText = $("routeText");
const routeDetail = $("routeDetail");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(DEPTH_THEMES[0].background);
scene.fog = new THREE.FogExp2(DEPTH_THEMES[0].fog, DEPTH_THEMES[0].fogDensity);

const camera = new THREE.PerspectiveCamera(66, 1, 0.08, 90);
const clock = new THREE.Clock();
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();

const worldGroup = new THREE.Group();
const propGroup = new THREE.Group();
const entityGroup = new THREE.Group();
scene.add(worldGroup, propGroup, entityGroup);

let ambientLight = null;
let moonLight = null;
let playerLight = null;
let dustField = null;

const state = {
  width: MAP_LINES[0].length,
  height: MAP_LINES.length,
  map: [],
  player: { x: 1, y: 1, dir: 1, hp: 36, maxHp: 36, atk: 7, guard: 1, focus: 5, maxFocus: 9, crit: 0.08, dodge: 0 },
  runes: [],
  chests: [],
  shrines: [],
  secrets: [],
  npcs: [],
  enemies: [],
  boss: null,
  exit: null,
  door: null,
  doorOpen: false,
  turn: 1,
  message: "WASD / Pfeile bewegen, Q/E drehen, Leertaste greift an, F interagiert.",
  active: false,
  paused: false,
  dead: false,
  won: false,
  mapVisible: true,
  depth: 1,
  relics: []
};

const cameraTarget = {
  pos: new THREE.Vector3(),
  yaw: 0
};

let doorMesh = null;
let exitMesh = null;
let bossSprite = null;
let bossTexture = null;
let music = null;
let audioEnabled = false;
let musicIndex = 0;
let touchStart = null;
let longPressTimer = null;
let mobileQuery = null;

init();

function init() {
  validateMap();
  setupLighting();
  loadDepth(1, false);
  resize();
  bindInput();
  requestAnimationFrame(loop);
}

function validateMap() {
  for (const row of MAP_LINES) {
    if (row.length !== state.width) {
      throw new Error("All dungeon map rows must have the same width.");
    }
  }
}

function parseMap() {
  const kinds = ["skeleton", "knight", "gargoyle", "reaper", "phantom", "witch", "acolyte", "sentinel", "lantern"];
  let enemyCount = 0;
  state.runes = [];
  state.chests = [];
  state.enemies = [];
  state.npcs = [];
  state.boss = null;
  state.exit = null;
  state.door = null;
  state.doorOpen = false;
  state.map = MAP_LINES.map((row, y) =>
    [...row].map((tile, x) => {
      if (tile === "S") {
        state.player.x = x;
        state.player.y = y;
        return ".";
      }
      if (tile === "M") {
        const kind = kinds[(enemyCount + state.depth - 1) % kinds.length];
        state.enemies.push(createEnemy(kind, x, y, enemyCount));
        enemyCount += 1;
        return ".";
      }
      if (tile === "R") {
        state.runes.push({ x, y, collected: false });
        return ".";
      }
      if (tile === "C") {
        state.chests.push({ x, y, opened: false });
        return ".";
      }
      if (tile === "D") {
        state.door = { x, y };
        return "D";
      }
      if (tile === "B") {
        state.boss = {
          id: "boss",
          x,
          y,
          hp: 74 + (state.depth - 1) * 34,
          maxHp: 74 + (state.depth - 1) * 34,
          atk: 9 + (state.depth - 1) * 3,
          alive: true,
          name: state.depth === MAX_DEPTH ? "Ur-Glockenfuerst" : "Glockenfuerst",
          summons: []
        };
        return ".";
      }
      if (tile === "X") {
        state.exit = { x, y };
        return "X";
      }
      return tile;
    })
  );

  const extras = EXTRA_DEPTH_ENEMIES[state.depth] || [];
  for (const extra of extras) {
    if (isWalkable(extra.x, extra.y) && !enemyAt(extra.x, extra.y)) {
      state.enemies.push(createEnemy(extra.kind, extra.x, extra.y, enemyCount));
      enemyCount += 1;
    }
  }
}

function createEnemy(kind, x, y, index) {
  const def = ENEMY_DEFS[kind];
  const hpScale = 1 + (state.depth - 1) * 0.42;
  return {
    id: `${kind}-${index}`,
    kind,
    name: def.name,
    x,
    y,
    hp: Math.round(def.hp * hpScale),
    maxHp: Math.round(def.hp * hpScale),
    atk: def.atk + state.depth - 1,
    alive: true
  };
}

function loadDepth(depth, carryPlayer = true) {
  state.depth = depth;
  state.turn = 1;
  state.dead = false;
  state.won = false;
  for (const trap of TRAPS) trap.armed = true;
  parseMap();
  state.shrines = SHRINE_POINTS.map((shrine, index) => ({
    ...shrine,
    used: false,
    kind: ["focus", "blood", "ward"][(index + depth - 1) % 3]
  }));
  state.secrets = SECRET_WALL_POINTS.map((secret) => ({
    ...secret,
    hp: secret.hp + Math.max(0, depth - 2),
    broken: false
  }));
  state.npcs = NPC_POINTS.map((npc) => ({
    ...npc,
    spoken: false,
    name: state.depth === 1 ? npc.name : state.depth === 2 ? "Archiv-Orakel" : "Abgrund-Orakel"
  }));
  if (carryPlayer) {
    state.player.dir = 1;
    state.player.maxHp += 4;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 14);
    state.player.atk += 1;
    state.player.focus = Math.min(state.player.maxFocus, state.player.focus + 4);
  }
  applyTheme();
  resetRenderScene();
  buildDungeon();
  decorateDungeon();
  syncEntitySprites();
  updateCameraTarget(true);
  updateHud();
}

function resetRenderScene() {
  worldGroup.clear();
  propGroup.clear();
  entityGroup.clear();
  doorMesh = null;
  exitMesh = null;
  bossSprite = null;
  bossTexture = null;
  dustField = null;
}

function setupLighting() {
  ambientLight = new THREE.HemisphereLight(0x748c8f, 0x1a0f0b, 0.55);
  scene.add(ambientLight);

  moonLight = new THREE.DirectionalLight(0xbfd7ff, 1.05);
  moonLight.position.set(-12, 16, -8);
  moonLight.castShadow = true;
  moonLight.shadow.camera.left = -36;
  moonLight.shadow.camera.right = 36;
  moonLight.shadow.camera.top = 36;
  moonLight.shadow.camera.bottom = -36;
  scene.add(moonLight);

  playerLight = new THREE.PointLight(0xffb05a, 1.65, 13, 2);
  camera.add(playerLight);
  scene.add(camera);
}

function currentTheme() {
  return DEPTH_THEMES[state.depth - 1] || DEPTH_THEMES[0];
}

function applyTheme() {
  const theme = currentTheme();
  scene.background.set(theme.background);
  scene.fog.color.set(theme.fog);
  scene.fog.density = theme.fogDensity;
  if (ambientLight) {
    ambientLight.color.set(theme.ambientSky);
    ambientLight.groundColor.set(theme.ambientGround);
    ambientLight.intensity = theme.ambientIntensity;
  }
  if (moonLight) {
    moonLight.color.set(theme.moon);
    moonLight.intensity = theme.moonIntensity;
  }
  if (playerLight) {
    playerLight.color.set(theme.torch);
    playerLight.intensity = 1.45 + state.depth * 0.18;
  }
}

function buildDungeon() {
  const theme = currentTheme();
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: makeStoneTexture(...theme.wall),
    roughness: 0.96,
    metalness: 0.02
  });
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: makeFloorTexture(theme.floor),
    roughness: 1,
    metalness: 0
  });
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: theme.ceiling,
    roughness: 1
  });
  const doorMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a2d22,
    roughness: 0.74,
    metalness: 0.38,
    emissive: theme.accent,
    emissiveIntensity: 0.14
  });

  const wallGeo = new THREE.BoxGeometry(CELL, WALL_HEIGHT, CELL);
  const floorGeo = new THREE.PlaneGeometry(CELL, CELL);
  const doorGeo = new THREE.BoxGeometry(CELL * 0.92, WALL_HEIGHT * 0.94, CELL * 0.38);

  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const tile = state.map[y][x];
      const pos = cellToWorld(x, y);

      if (tile === "#") {
        const wall = new THREE.Mesh(wallGeo, wallMaterial);
        wall.position.set(pos.x, WALL_HEIGHT / 2, pos.z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        worldGroup.add(wall);
        const secret = secretAt(x, y);
        if (secret && !secret.broken) {
          worldGroup.add(createSecretMark(pos, secret, theme));
        }
        continue;
      }

      const floor = new THREE.Mesh(floorGeo, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(pos.x, 0, pos.z);
      floor.receiveShadow = true;
      worldGroup.add(floor);
      addFloorDetail(pos, x, y, theme);

      const ceiling = new THREE.Mesh(floorGeo, ceilingMaterial);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(pos.x, WALL_HEIGHT, pos.z);
      ceiling.receiveShadow = true;
      worldGroup.add(ceiling);

      if (tile === "D") {
        doorMesh = new THREE.Mesh(doorGeo, doorMaterial);
        doorMesh.position.set(pos.x, WALL_HEIGHT / 2, pos.z);
        doorMesh.castShadow = true;
        doorMesh.receiveShadow = true;
        worldGroup.add(doorMesh);
      }
      if (tile === "X") {
        exitMesh = createExitMesh(pos);
        worldGroup.add(exitMesh);
      }
    }
  }

  addWallDecals(theme);
  placeBackdrop();
  addHangingRelics(theme);
  addAtmosphere(theme);
}

function createExitMesh(pos) {
  const theme = currentTheme();
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.08, 12, 40),
    new THREE.MeshStandardMaterial({
      color: theme.portal,
      emissive: theme.portal,
      emissiveIntensity: 1.2,
      roughness: 0.4
    })
  );
  ring.position.set(pos.x, 1.6, pos.z);
  ring.rotation.y = Math.PI / 2;
  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.76, 0.035, 10, 32),
    new THREE.MeshBasicMaterial({ color: theme.rune, transparent: true, opacity: 0.76 })
  );
  innerRing.position.set(pos.x, 1.6, pos.z);
  innerRing.rotation.y = Math.PI / 2;
  const glow = new THREE.PointLight(theme.portal, 1.8, 9, 2);
  glow.position.set(pos.x, 1.7, pos.z);
  group.add(ring, innerRing, glow);
  group.visible = false;
  return group;
}

function createSecretMark(pos, secret, theme) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeCrackTexture(),
      color: theme.accent,
      transparent: true,
      opacity: 0.74,
      depthWrite: false
    })
  );
  const facing = secretFacing(secret);
  sprite.position.set(pos.x + facing.x * CELL * 0.48, 1.65, pos.z + facing.y * CELL * 0.48);
  sprite.scale.set(1.25, 1.25, 1);
  return sprite;
}

function makeCrackTexture() {
  const key = "__crack";
  if (textureCache.has(key)) return textureCache.get(key);
  const canvasTex = document.createElement("canvas");
  canvasTex.width = 128;
  canvasTex.height = 128;
  const ctx = canvasTex.getContext("2d");
  ctx.clearRect(0, 0, 128, 128);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(64, 8);
  ctx.lineTo(54, 34);
  ctx.lineTo(72, 54);
  ctx.lineTo(58, 82);
  ctx.lineTo(68, 118);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(58, 46);
  ctx.lineTo(30, 58);
  ctx.lineTo(18, 82);
  ctx.moveTo(66, 72);
  ctx.lineTo(96, 92);
  ctx.lineTo(108, 116);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvasTex);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

function addFloorDetail(pos, x, y, theme) {
  const seed = x * 83 + y * 191 + state.depth * 37;
  if (random01(seed) < 0.84) return;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.12, 0.42 + random01(seed + 1) * 0.26, 18),
    new THREE.MeshBasicMaterial({
      color: random01(seed + 2) > 0.5 ? theme.accent : 0x0b0b0a,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.rotation.z = random01(seed + 3) * Math.PI;
  ring.position.set(pos.x + random01(seed + 4) * 1.6 - 0.8, 0.012, pos.z + random01(seed + 5) * 1.6 - 0.8);
  worldGroup.add(ring);
}

function addHangingRelics(theme) {
  const chainMat = new THREE.MeshStandardMaterial({ color: 0x1b1d1b, roughness: 0.62, metalness: 0.55 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: theme.accent,
    emissive: theme.accent,
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.72
  });
  for (const point of HANGING_POINTS) {
    if (!isInside(point.x, point.y) || state.map[point.y][point.x] === "#") continue;
    const pos = cellToWorld(point.x, point.y);
    const group = new THREE.Group();
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8), chainMat);
    chain.position.set(pos.x, WALL_HEIGHT - 0.55, pos.z);
    const cage = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 18), chainMat);
    cage.position.set(pos.x, WALL_HEIGHT - 1.15, pos.z);
    cage.rotation.x = Math.PI / 2;
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.18), glassMat);
    gem.position.set(pos.x, WALL_HEIGHT - 1.15, pos.z);
    const light = new THREE.PointLight(theme.accent, 0.7, 5, 2);
    light.position.set(pos.x, WALL_HEIGHT - 1.16, pos.z);
    group.add(chain, cage, gem, light);
    worldGroup.add(group);
  }
}

function addWallDecals(theme) {
  for (const decal of WALL_DECAL_POINTS) {
    if (!isInside(decal.x, decal.y) || state.map[decal.y][decal.x] !== "#") continue;
    const facing = wallFacing(decal.x, decal.y);
    if (!facing) continue;
    const texture = getTexture(ASSETS.props[decal.key]);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      color: decal.key === "wallRune" ? theme.rune : 0xffffff,
      transparent: true,
      opacity: decal.key === "wallRune" ? 0.58 : 0.42,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.55), mat);
    const pos = cellToWorld(decal.x, decal.y);
    mesh.position.set(pos.x + facing.x * CELL * 0.505, 1.85, pos.z + facing.y * CELL * 0.505);
    if (facing.x === 1) mesh.rotation.y = Math.PI / 2;
    else if (facing.x === -1) mesh.rotation.y = -Math.PI / 2;
    else if (facing.y === -1) mesh.rotation.y = Math.PI;
    worldGroup.add(mesh);
  }
}

function wallFacing(x, y) {
  for (const dir of DIRS) {
    const nx = x + dir.x;
    const ny = y + dir.y;
    if (isInside(nx, ny) && state.map[ny][nx] !== "#") return dir;
  }
  return null;
}

function addAtmosphere(theme) {
  const count = 260;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const seed = i * 19 + state.depth * 101;
    positions[i * 3] = (random01(seed) - 0.5) * state.width * CELL;
    positions[i * 3 + 1] = 0.45 + random01(seed + 1) * (WALL_HEIGHT - 0.8);
    positions[i * 3 + 2] = (random01(seed + 2) - 0.5) * state.height * CELL;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  dustField = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: theme.accent,
      size: 0.045,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    })
  );
  worldGroup.add(dustField);
}

function createShrineMarker(shrine, theme) {
  const group = new THREE.Group();
  const asset = shrine.kind === "ward" ? ASSETS.props.statue : shrine.kind === "blood" ? ASSETS.props.book : ASSETS.props.candle;
  const sprite = makeSprite(asset, shrine.kind === "ward" ? 1.55 : 1.1);
  const pos = cellToWorld(shrine.x, shrine.y);
  sprite.position.set(pos.x, shrine.kind === "ward" ? 0.9 : 0.62, pos.z);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.025, 10, 36),
    new THREE.MeshBasicMaterial({ color: shrine.kind === "blood" ? 0xd85a52 : theme.accent, transparent: true, opacity: 0.62 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(pos.x, 0.06, pos.z);
  const light = new THREE.PointLight(shrine.kind === "blood" ? 0xd85a52 : theme.accent, 1.05, 6, 2);
  light.position.set(pos.x, 1.3, pos.z);
  group.add(sprite, ring, light);
  return group;
}

function placeBackdrop() {
  const tex = getTexture(ASSETS.props.chapel);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(CELL * 2.8, WALL_HEIGHT * 1.08), mat);
  const pos = cellToWorld(12, 13);
  panel.position.set(pos.x, WALL_HEIGHT / 2, pos.z + CELL * 0.48);
  panel.rotation.y = Math.PI;
  worldGroup.add(panel);
}

function decorateDungeon() {
  const theme = currentTheme();
  for (const point of PROP_POINTS) {
    if (!isInside(point.x, point.y) || state.map[point.y][point.x] === "#") continue;
    const sprite = makeSprite(ASSETS.props[point.key], point.size);
    const pos = cellToWorld(point.x, point.y);
    sprite.position.set(pos.x, point.size * 0.48, pos.z);
    propGroup.add(sprite);
    if (point.light) {
      const light = new THREE.PointLight(theme.torch, 1.2, 7, 2);
      light.position.set(pos.x, 1.7, pos.z);
      propGroup.add(light);
    }
  }

  for (const shrine of state.shrines) {
    if (!shrine.used) propGroup.add(createShrineMarker(shrine, theme));
  }

  for (const trap of TRAPS) {
    const sprite = makeSprite(ASSETS.props.spikes, 1.45);
    const pos = cellToWorld(trap.x, trap.y);
    sprite.position.set(pos.x, 0.34, pos.z);
    sprite.material.opacity = 0.78;
    propGroup.add(sprite);
  }
}

function syncEntitySprites() {
  const theme = currentTheme();
  entityGroup.clear();

  for (const chest of state.chests) {
    if (chest.opened) continue;
    const sprite = makeSprite(ASSETS.props.chest, 1.5);
    placeSpriteAtCell(sprite, chest.x, chest.y, 0.68);
    entityGroup.add(createCellGlow(chest.x, chest.y, 0xe9bd69, 0.14, 0.72), sprite);
  }

  for (const rune of state.runes) {
    if (rune.collected) continue;
    const sprite = makeSprite(ASSETS.props.ruby, 1.15);
    sprite.material.color.set(theme.rune);
    placeSpriteAtCell(sprite, rune.x, rune.y, 0.7);
    const light = new THREE.PointLight(theme.rune, 0.9, 5, 2);
    const pos = cellToWorld(rune.x, rune.y);
    light.position.set(pos.x, 1.2, pos.z);
    entityGroup.add(createCellGlow(rune.x, rune.y, theme.rune, 0.25, 0.55), sprite, light);
  }

  for (const npc of state.npcs) {
    const sprite = makeSprite(ASSETS.sprites.oracle, npc.spoken ? 1.55 : 1.7);
    sprite.material.opacity = npc.spoken ? 0.7 : 1;
    placeSpriteAtCell(sprite, npc.x, npc.y, 0.82);
    const pos = cellToWorld(npc.x, npc.y);
    const light = new THREE.PointLight(theme.rune, npc.spoken ? 0.45 : 1.05, 5, 2);
    light.position.set(pos.x, 1.4, pos.z);
    entityGroup.add(createCellGlow(npc.x, npc.y, theme.rune, npc.spoken ? 0.1 : 0.22, 0.68), sprite, light);
  }

  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const def = ENEMY_DEFS[enemy.kind];
    const sprite = makeSprite(ASSETS.sprites[def.sprite], def.size);
    sprite.userData.entityId = enemy.id;
    placeSpriteAtCell(sprite, enemy.x, enemy.y, def.size * 0.48);
    entityGroup.add(createCellGlow(enemy.x, enemy.y, 0xd85a52, 0.16, 0.6), sprite);
  }

  if (state.boss?.alive) {
    bossTexture = getTexture(ASSETS.sprites.boss);
    bossTexture.wrapS = THREE.RepeatWrapping;
    bossTexture.wrapT = THREE.RepeatWrapping;
    bossTexture.repeat.set(1 / 3, 1 / 6);
    setBossFrame(0, 0);
    bossSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: bossTexture,
        transparent: true,
        alphaTest: 0.04,
        depthWrite: false
      })
    );
    bossSprite.scale.set(3.2, 4.3, 1);
    placeSpriteAtCell(bossSprite, state.boss.x, state.boss.y, 1.85);
    const pos = cellToWorld(state.boss.x, state.boss.y);
    const bossLight = new THREE.PointLight(theme.portal, 1.6, 9, 2);
    bossLight.position.set(pos.x, 2.3, pos.z);
    entityGroup.add(createCellGlow(state.boss.x, state.boss.y, theme.portal, 0.2, 1.15), bossSprite, bossLight);
  } else {
    bossSprite = null;
    bossTexture = null;
  }
}

function placeSpriteAtCell(sprite, x, y, baseY) {
  const pos = cellToWorld(x, y);
  sprite.position.set(pos.x, baseY, pos.z);
}

function createCellGlow(x, y, color, opacity, radius) {
  const pos = cellToWorld(x, y);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 28),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.set(pos.x, 0.018, pos.z);
  return disc;
}

function makeSprite(path, size) {
  const texture = getTexture(path);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.04,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);
  return sprite;
}

function getTexture(path) {
  if (textureCache.has(path)) return textureCache.get(path);
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  textureCache.set(path, texture);
  return texture;
}

function makeStoneTexture(base, dark, light) {
  const canvasTex = document.createElement("canvas");
  canvasTex.width = 512;
  canvasTex.height = 512;
  const ctx = canvasTex.getContext("2d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  let seed = 31;

  for (let y = 0; y < 512; y += 64) {
    const offset = (y / 64) % 2 === 0 ? 0 : 36;
    for (let x = -offset; x < 512; x += 96) {
      const shade = random01(seed++) > 0.5 ? dark : light;
      ctx.fillStyle = shade;
      ctx.globalAlpha = 0.15 + random01(seed++) * 0.14;
      ctx.fillRect(x + 3, y + 3, 90, 58);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(15, 12, 10, 0.52)";
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 2, y + 2, 92, 60);
    }
  }

  for (let i = 0; i < 120; i += 1) {
    ctx.strokeStyle = `rgba(0,0,0,${0.1 + random01(seed++) * 0.18})`;
    ctx.beginPath();
    const x = random01(seed++) * 512;
    const y = random01(seed++) * 512;
    ctx.moveTo(x, y);
    ctx.lineTo(x + random01(seed++) * 40 - 20, y + random01(seed++) * 40 - 20);
    ctx.stroke();
  }

  for (let i = 0; i < 70; i += 1) {
    const x = random01(seed++) * 512;
    const y = random01(seed++) * 512;
    const r = 2 + random01(seed++) * 9;
    ctx.fillStyle = random01(seed++) > 0.55 ? "rgba(0,0,0,0.18)" : "rgba(255,235,190,0.08)";
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.35 + random01(seed++) * 0.55), random01(seed++) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = light;
  ctx.lineWidth = 6;
  for (let i = 0; i < 8; i += 1) {
    const x = 44 + random01(seed++) * 420;
    const y = 52 + random01(seed++) * 410;
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x - 14, y + 18);
    ctx.lineTo(x + 16, y + 10);
    ctx.moveTo(x - 9, y);
    ctx.lineTo(x + 13, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvasTex);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.4, 1.4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeFloorTexture(colors = DEPTH_THEMES[0].floor) {
  const texture = makeStoneTexture(...colors);
  texture.repeat.set(2.2, 2.2);
  return texture;
}

function random01(seed) {
  const x = Math.sin(seed * 999.13) * 43758.5453;
  return x - Math.floor(x);
}

function bindInput() {
  window.addEventListener("resize", resize);
  startBtn.addEventListener("click", startGame);
  overlayStartBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", restartGame);
  audioBtn.addEventListener("click", toggleAudio);
  fullscreenBtn.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  mapBtn.addEventListener("click", () => toggleMap());
  routeChip.addEventListener("click", () => toggleMap());

  mobileQuery = window.matchMedia("(pointer: coarse), (max-width: 760px)");
  mobileQuery.addEventListener?.("change", updateMobileMode);
  updateMobileMode();

  document.addEventListener("keydown", (event) => {
    const action = keyToAction(event.key);
    if (!action) return;
    event.preventDefault();
    if (!state.active && action !== "restart") startGame();
    handleAction(action);
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.active) startGame();
      handleAction(button.dataset.action);
    });
  });

  bindSwipeInput();
}

function keyToAction(key) {
  const map = {
    ArrowUp: "forward",
    w: "forward",
    W: "forward",
    ArrowDown: "back",
    s: "back",
    S: "back",
    a: "strafe-left",
    A: "strafe-left",
    d: "strafe-right",
    D: "strafe-right",
    ArrowLeft: "turn-left",
    q: "turn-left",
    Q: "turn-left",
    ArrowRight: "turn-right",
    e: "turn-right",
    E: "turn-right",
    " ": "attack",
    Enter: "attack",
    Shift: "spell",
    z: "spell",
    Z: "spell",
    f: "interact",
    F: "interact",
    r: "restart",
    R: "restart",
    p: "pause",
    P: "pause"
  };
  return map[key] || null;
}

function startGame() {
  state.active = true;
  state.paused = false;
  startOverlay.classList.add("is-hidden");
  setMessage(isMobileMode() ? "Swipe: gehen/drehen. Tippen greift an, Z loest Fokus aus." : "Drei Ebenen, Relikte und Geheimwaende. Z oder Shift loest Fokus aus.");
}

function updateMobileMode() {
  document.body.classList.toggle("mobile-mode", isMobileMode());
  if (isMobileMode() && !state.active) toggleMap(false);
  if (state.active && !state.dead && !state.won && isMobileMode()) {
    setMessage("Swipe: gehen/drehen. Tippen greift an, Z loest Fokus aus.");
  }
}

function isMobileMode() {
  return Boolean(mobileQuery?.matches);
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    }
  } catch {
    setMessage("Vollbild ist in diesem Browser gerade blockiert.");
  } finally {
    updateFullscreenButton();
  }
}

function updateFullscreenButton() {
  const full = Boolean(document.fullscreenElement);
  document.body.classList.toggle("is-fullscreen", full);
  fullscreenBtn.setAttribute("aria-pressed", String(full));
}

function toggleMap(force) {
  state.mapVisible = typeof force === "boolean" ? force : !state.mapVisible;
  miniMap.style.display = state.mapVisible ? "grid" : "none";
  document.body.classList.toggle("map-open", state.mapVisible);
  mapBtn.setAttribute("aria-pressed", String(state.mapVisible));
  updateHud();
}

function bindSwipeInput() {
  canvas.addEventListener("pointerdown", (event) => {
    if (!isMobileMode() && event.pointerType !== "touch") return;
    touchStart = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      pointerId: event.pointerId
    };
    swipePad.classList.add("is-active");
    canvas.setPointerCapture?.(event.pointerId);
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
      if (!touchStart) return;
      handleTouchAction("interact");
      touchStart = null;
      swipePad.classList.remove("is-active");
    }, 540);
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!touchStart || touchStart.pointerId !== event.pointerId) return;
    clearTimeout(longPressTimer);
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    const elapsed = performance.now() - touchStart.time;
    touchStart = null;
    swipePad.classList.remove("is-active");

    const distance = Math.hypot(dx, dy);
    if (distance < 24 && elapsed < 420) {
      handleTouchAction("attack");
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      handleTouchAction(dx > 0 ? "turn-right" : "turn-left");
    } else {
      handleTouchAction(dy > 0 ? "back" : "forward");
    }
  });

  canvas.addEventListener("pointercancel", () => {
    clearTimeout(longPressTimer);
    touchStart = null;
    swipePad.classList.remove("is-active");
  });
}

function handleTouchAction(action) {
  if (!state.active) startGame();
  handleAction(action);
}

function restartGame() {
  window.location.reload();
}

function handleAction(action) {
  if (action === "restart") {
    restartGame();
    return;
  }
  if (action === "pause") {
    state.paused = !state.paused;
    setMessage(state.paused ? "Pause. P setzt den Abstieg fort." : "Weiter.");
    return;
  }
  if (!state.active || state.paused || state.dead || state.won) return;

  if (action === "turn-left" || action === "turn-right") {
    state.player.dir = wrapDir(state.player.dir + (action === "turn-left" ? -1 : 1));
    spendTurn("Du drehst dich nach " + DIRS[state.player.dir].label + ".");
    return;
  }

  if (action === "forward" || action === "back" || action === "strafe-left" || action === "strafe-right") {
    tryMove(action);
    return;
  }

  if (action === "attack") {
    attackFront();
    return;
  }

  if (action === "spell") {
    castFocusSpell();
    return;
  }

  if (action === "interact") {
    interact();
  }
}

function tryMove(action) {
  const move = movementVector(action);
  const nx = state.player.x + move.x;
  const ny = state.player.y + move.y;

  if (!isWalkable(nx, ny)) {
    if (isDoor(nx, ny) && !state.doorOpen) {
      if (collectedRunes() >= 3) {
        openDoor();
        spendTurn("Die drei Runen brennen im Stein. Das Siegel bricht auf.");
      } else {
        setMessage("Das Siegel verlangt drei Runen.");
        playSfx("thunder", 0.35);
      }
    } else {
      setMessage("Kalter Stein blockiert den Weg.");
    }
    return;
  }

  const enemy = enemyAt(nx, ny);
  if (enemy || (state.boss?.alive && state.boss.x === nx && state.boss.y === ny)) {
    setMessage("Etwas steht direkt vor dir. Leertaste greift an.");
    return;
  }

  state.player.x = nx;
  state.player.y = ny;
  const transitioned = resolveCurrentCell();
  if (!transitioned) spendTurn(null);
  else updateHud();
}

function movementVector(action) {
  const forward = DIRS[state.player.dir];
  if (action === "forward") return { x: forward.x, y: forward.y };
  if (action === "back") return { x: -forward.x, y: -forward.y };
  const right = DIRS[wrapDir(state.player.dir + 1)];
  if (action === "strafe-right") return { x: right.x, y: right.y };
  return { x: -right.x, y: -right.y };
}

function attackFront() {
  const front = frontCell();
  const secret = secretAt(front.x, front.y);
  if (secret && !secret.broken) {
    strikeSecretWall(secret);
    return;
  }

  const enemy = enemyAt(front.x, front.y);
  const boss = state.boss?.alive && state.boss.x === front.x && state.boss.y === front.y ? state.boss : null;
  const target = enemy || boss;

  if (!target) {
    setMessage("Dein Hieb schneidet nur Staub.");
    playSfx("slash", 0.45);
    return;
  }

  let damage = rand(5, 9) + state.player.atk + collectedRunes();
  const crit = Math.random() < state.player.crit;
  if (crit) damage = Math.round(damage * 1.7);
  if (hasRelic("ember")) damage += 2 + state.depth;
  if (target.kind === "gargoyle" || target.kind === "knight" || target.kind === "sentinel") damage = Math.max(3, damage - 2);
  target.hp = Math.max(0, target.hp - damage);
  playSfx("slash", 0.7);

  if (target.hp <= 0) {
    setMessage(defeatTarget(target));
  } else {
    const summon = target.id === "boss" ? maybeBossSummon() : null;
    setMessage(`${crit ? "Kritischer Treffer. " : ""}${target.name} verliert ${damage} HP.${summon ? " Ein Diener steigt aus dem Boden." : ""}`);
  }

  syncEntitySprites();
  spendTurn(null);
}

function castFocusSpell() {
  const cost = 4;
  if (state.player.focus < cost) {
    setMessage(`Der Lichtstoss braucht ${cost} Fokus.`);
    return;
  }

  state.player.focus -= cost;
  const hits = [];
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const dist = manhattan(enemy.x, enemy.y, state.player.x, state.player.y);
    if (dist <= 3 && (dist <= 1 || lineOfSight(enemy.x, enemy.y, state.player.x, state.player.y))) {
      const damage = rand(7, 11) + state.depth + collectedRunes();
      enemy.hp = Math.max(0, enemy.hp - damage);
      hits.push(enemy.name);
      if (enemy.hp <= 0) defeatTarget(enemy);
    }
  }

  if (state.boss?.alive) {
    const dist = manhattan(state.boss.x, state.boss.y, state.player.x, state.player.y);
    if (dist <= 4 && lineOfSight(state.boss.x, state.boss.y, state.player.x, state.player.y)) {
      const damage = rand(9, 14) + state.depth * 2;
      state.boss.hp = Math.max(0, state.boss.hp - damage);
      hits.push(state.boss.name);
      if (state.boss.hp <= 0) defeatTarget(state.boss);
      else maybeBossSummon();
    }
  }

  playSfx("thunder", 0.55);
  syncEntitySprites();
  setMessage(hits.length ? `Fokuslicht trifft ${hits.length} Ziel${hits.length === 1 ? "" : "e"}.` : "Fokuslicht knistert durch leere Gaenge.");
  spendTurn(null);
}

function interact() {
  const here = { x: state.player.x, y: state.player.y };
  const front = frontCell();
  if (talkToNpcAt(here.x, here.y) || talkToNpcAt(front.x, front.y)) {
    syncEntitySprites();
    updateHud();
    return;
  }

  const handled = collectAt(here.x, here.y) || collectAt(front.x, front.y);
  if (handled) {
    spendTurn(null);
    return;
  }

  if (activateShrineAt(here.x, here.y) || activateShrineAt(front.x, front.y)) {
    propGroup.clear();
    decorateDungeon();
    syncEntitySprites();
    spendTurn(null);
    return;
  }

  if (isDoor(front.x, front.y) && !state.doorOpen) {
    if (collectedRunes() >= 3) {
      openDoor();
      spendTurn("Das Siegel loest sich in roten Staub auf.");
    } else {
      setMessage("Das Tor bleibt stumm. Drei Runen fehlen dem Schloss.");
    }
    return;
  }

  if (state.exit && state.player.x === state.exit.x && state.player.y === state.exit.y) {
    if (state.boss?.alive) {
      setMessage("Der Ausgang schlaeft, solange der Glockenfuerst atmet.");
    } else {
      handleExit();
    }
    updateHud();
    return;
  }

  setMessage("Hier reagiert nichts.");
}

function collectAt(x, y) {
  const rune = state.runes.find((item) => !item.collected && item.x === x && item.y === y);
  if (rune) {
    rune.collected = true;
    setMessage(`Rune ${collectedRunes()} von 3 gefunden. Das Siegel wird schwaecher.`);
    state.player.focus = Math.min(state.player.maxFocus, state.player.focus + 2);
    playSfx("thunder", 0.45);
    syncEntitySprites();
    return true;
  }

  const chest = state.chests.find((item) => !item.opened && item.x === x && item.y === y);
  if (chest) {
    chest.opened = true;
    const heal = rand(5, 11);
    const atk = rand(1, 2);
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
    state.player.atk += atk;
    state.player.focus = Math.min(state.player.maxFocus, state.player.focus + 2);
    const relic = grantRelic();
    setMessage(relic ? `Truhe: +${heal} HP, +${atk} ATK, ${relic.name}. ${relic.note}` : `Truhe geoeffnet: +${heal} HP, +${atk} ATK, +2 Fokus.`);
    playSfx("armor", 0.55);
    syncEntitySprites();
    return true;
  }

  return false;
}

function talkToNpcAt(x, y) {
  const npc = state.npcs.find((item) => item.x === x && item.y === y);
  if (!npc) return false;
  const route = currentRoute(npc);
  npc.spoken = true;
  state.player.focus = Math.min(state.player.maxFocus, state.player.focus + 2);
  setMessage(`${npc.name}: ${route.detail} Der gruene Pfeil zeigt immer den naechsten sicheren Schritt. +2 Fokus.`);
  playSfx("thunder", 0.22);
  return true;
}

function activateShrineAt(x, y) {
  const shrine = state.shrines.find((item) => !item.used && item.x === x && item.y === y);
  if (!shrine) return false;
  shrine.used = true;
  if (shrine.kind === "focus") {
    state.player.maxFocus += 1;
    state.player.focus = state.player.maxFocus;
    setMessage("Der Kerzenaltar fuellt deinen Fokus und erweitert die Linse.");
  } else if (shrine.kind === "blood") {
    state.player.hp = Math.max(1, state.player.hp - 3);
    state.player.atk += 2;
    state.player.focus = Math.min(state.player.maxFocus, state.player.focus + 3);
    setMessage("Das Blutarchiv fordert 3 HP und schenkt +2 ATK, +3 Fokus.");
  } else {
    state.player.guard += 1;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 7);
    setMessage("Ein Schutzkreis haertet deine Ruestung. +1 Guard, +7 HP.");
  }
  playSfx("thunder", 0.4);
  return true;
}

function grantRelic() {
  const available = RELIC_DEFS.filter((relic) => !state.relics.includes(relic.id));
  if (!available.length) return null;
  const relic = available[(state.depth + state.turn + state.relics.length) % available.length];
  state.relics.push(relic.id);
  state.player.atk += relic.atk || 0;
  state.player.guard += relic.guard || 0;
  state.player.maxHp += relic.maxHp || 0;
  state.player.maxFocus += relic.maxFocus || 0;
  state.player.focus = Math.min(state.player.maxFocus, state.player.focus + (relic.focus || 0));
  state.player.crit += relic.crit || 0;
  state.player.dodge += relic.dodge || 0;
  return relic;
}

function hasRelic(id) {
  return state.relics.includes(id);
}

function defeatTarget(target) {
  target.alive = false;
  if (target.id === "boss") {
    if (exitMesh) exitMesh.visible = true;
    playSfx("thunder", 0.8);
    return state.depth === MAX_DEPTH
      ? "Der Ur-Glockenfuerst zerfaellt. Das Endportal leuchtet."
      : "Der Glockenfuerst zerfaellt. Das Portal in die Tiefe leuchtet.";
  }

  const heal = hasRelic("aegis") ? 5 : 3;
  state.player.atk += 1;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
  state.player.focus = Math.min(state.player.maxFocus, state.player.focus + 1);
      playSfx(target.kind === "knight" || target.kind === "sentinel" ? "armor" : "bones", 0.68);
  return `${target.name} zerbricht. +1 ATK, +${heal} HP, +1 Fokus.`;
}

function strikeSecretWall(secret) {
  const force = hasRelic("ember") ? 2 : 1;
  secret.hp -= force;
  playSfx("slash", 0.55);
  if (secret.hp > 0) {
    setMessage(`Die rissige Wand splittert. Noch ${secret.hp} Treffer.`);
    spendTurn(null);
    return;
  }

  secret.broken = true;
  state.map[secret.y][secret.x] = ".";
  state.player.focus = Math.min(state.player.maxFocus, state.player.focus + 2);
  resetRenderScene();
  buildDungeon();
  decorateDungeon();
  syncEntitySprites();
  setMessage("Eine Geheimwand bricht auf. Ein kalter Luftzug schenkt +2 Fokus.");
  playSfx("thunder", 0.35);
  spendTurn(null);
}

function resolveCurrentCell() {
  for (const trap of TRAPS) {
    if (trap.armed && trap.x === state.player.x && trap.y === state.player.y) {
      trap.armed = false;
      harmPlayer(rand(4, 8), "Eine verborgene Stachelfalle schnappt zu.");
      return false;
    }
  }
  collectAt(state.player.x, state.player.y);
  if (state.exit && state.player.x === state.exit.x && state.player.y === state.exit.y && !state.boss?.alive) {
    handleExit();
    return true;
  }
  return false;
}

function handleExit() {
  if (state.depth >= MAX_DEPTH) {
    state.won = true;
    setMessage("Das Endportal reisst auf. Du entkommst mit dem Glockenkern. Sieg.");
    return;
  }

  const nextDepth = state.depth + 1;
  loadDepth(nextDepth, true);
  setMessage(`Ebene ${nextDepth}/${MAX_DEPTH}: Dein Mut waechst. +4 Max HP, +1 ATK, +14 HP.`);
}

function spendTurn(fallbackMessage) {
  state.turn += 1;
  if (fallbackMessage) setMessage(fallbackMessage);
  enemyPhase();
  updateCameraTarget(false);
  updateHud();
}

function enemyPhase() {
  if (state.dead || state.won) return;
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    enemyAct(enemy);
  }
  bossAct();
}

function enemyAct(enemy) {
  const dist = manhattan(enemy.x, enemy.y, state.player.x, state.player.y);
  if (dist === 1) {
    harmPlayer(rand(1, 3) + enemy.atk - state.player.guard, `${enemy.name} trifft dich.`);
    return;
  }

  if (enemy.kind === "witch" && dist <= 4 && lineOfSight(enemy.x, enemy.y, state.player.x, state.player.y)) {
    harmPlayer(rand(2, 4) + state.depth, `${enemy.name} wirft Kerzenfeuer.`);
    return;
  }

  if (enemy.kind === "acolyte" && dist <= 5 && lineOfSight(enemy.x, enemy.y, state.player.x, state.player.y)) {
    const ally = state.enemies.find((item) => item.alive && item.id !== enemy.id && item.hp < item.maxHp && manhattan(item.x, item.y, enemy.x, enemy.y) <= 3);
    if (ally) {
      ally.hp = Math.min(ally.maxHp, ally.hp + 4 + state.depth);
      setMessage(`${enemy.name} heilt ${ally.name}.`);
      return;
    }
    harmPlayer(rand(2, 4) + state.depth, `${enemy.name} ritzt ein Blutsiegel in die Luft.`);
    return;
  }

  if (enemy.kind === "lantern" && dist <= 5 && lineOfSight(enemy.x, enemy.y, state.player.x, state.player.y)) {
    const drain = Math.min(state.player.focus, 1 + state.depth);
    state.player.focus -= drain;
    harmPlayer(rand(1, 3) + state.depth, `${enemy.name} blendet dich und raubt ${drain} Fokus.`);
    return;
  }

  if (enemy.kind === "sentinel" && dist === 2 && lineOfSight(enemy.x, enemy.y, state.player.x, state.player.y)) {
    const step = nextStepToward(enemy.x, enemy.y, state.player.x, state.player.y, enemy.id);
    if (step) {
      enemy.x = step.x;
      enemy.y = step.y;
      harmPlayer(rand(2, 5) + enemy.atk - state.player.guard, `${enemy.name} stuermt vor.`);
    }
    return;
  }

  if (enemy.kind === "reaper" && dist <= 3 && lineOfSight(enemy.x, enemy.y, state.player.x, state.player.y)) {
    const drain = Math.min(state.player.focus, 2);
    state.player.focus -= drain;
    harmPlayer(rand(1, 3) + state.depth, `${enemy.name} reisst ${drain} Fokus aus dir.`);
    return;
  }

  if (dist > 7 && !lineOfSight(enemy.x, enemy.y, state.player.x, state.player.y)) return;

  const step = nextStepToward(enemy.x, enemy.y, state.player.x, state.player.y, enemy.id);
  if (!step) return;
  enemy.x = step.x;
  enemy.y = step.y;

  if (enemy.kind === "phantom" && state.turn % 3 === 0) {
    const secondStep = nextStepToward(enemy.x, enemy.y, state.player.x, state.player.y, enemy.id);
    if (secondStep) {
      enemy.x = secondStep.x;
      enemy.y = secondStep.y;
    }
  }
}

function bossAct() {
  const boss = state.boss;
  if (!boss?.alive || !state.doorOpen) return;
  maybeBossSummon();
  const dist = manhattan(boss.x, boss.y, state.player.x, state.player.y);
  if (dist === 1) {
    harmPlayer(rand(6, 10), "Der Glockenfuerst schlaegt mit brennender Klinge.");
    return;
  }
  if (lineOfSight(boss.x, boss.y, state.player.x, state.player.y) && dist <= 5) {
    harmPlayer(rand(3, 6), "Eine blaue Glockenwelle trifft dich.");
    playSfx("thunder", 0.38);
  }
}

function maybeBossSummon() {
  const boss = state.boss;
  if (!boss?.alive) return null;
  const thresholds = [0.66, 0.33];
  const nextThreshold = thresholds.find((threshold) => boss.hp / boss.maxHp <= threshold && !boss.summons.includes(threshold));
  if (!nextThreshold) return null;
  const spot = findFreeNear(boss.x, boss.y);
  if (!spot) return null;
  boss.summons.push(nextThreshold);
  const kind = state.depth >= 3 ? "phantom" : "skeleton";
  const enemy = createEnemy(kind, spot.x, spot.y, state.enemies.length + boss.summons.length);
  enemy.name = state.depth >= 3 ? "Glockenecho" : "Kryptenecho";
  state.enemies.push(enemy);
  return enemy;
}

function findFreeNear(x, y) {
  const offsets = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 2, y: 0 },
    { x: -2, y: 0 },
    { x: 0, y: 2 },
    { x: 0, y: -2 }
  ];
  for (const offset of offsets) {
    const sx = x + offset.x;
    const sy = y + offset.y;
    if (canEnemyEnter(sx, sy, "summon")) return { x: sx, y: sy };
  }
  return null;
}

function nextStepToward(x, y, tx, ty, selfId) {
  const dx = Math.sign(tx - x);
  const dy = Math.sign(ty - y);
  const choices = Math.abs(tx - x) > Math.abs(ty - y)
    ? [{ x: x + dx, y }, { x, y: y + dy }]
    : [{ x, y: y + dy }, { x: x + dx, y }];

  for (const choice of choices) {
    if (choice.x === x && choice.y === y) continue;
    if (canEnemyEnter(choice.x, choice.y, selfId)) return choice;
  }
  return null;
}

function canEnemyEnter(x, y, selfId) {
  if (!isWalkable(x, y)) return false;
  if (state.player.x === x && state.player.y === y) return false;
  if (state.boss?.alive && state.boss.x === x && state.boss.y === y) return false;
  return !state.enemies.some((enemy) => enemy.alive && enemy.id !== selfId && enemy.x === x && enemy.y === y);
}

function harmPlayer(amount, text) {
  if (state.player.dodge > 0 && Math.random() < state.player.dodge) {
    setMessage(`${text} Du weichst im letzten Moment aus.`);
    return;
  }
  const damage = Math.max(1, amount);
  state.player.hp = Math.max(0, state.player.hp - damage);
  setMessage(`${text} -${damage} HP.`);
  flashDamage();
  if (state.player.hp <= 0) {
    state.dead = true;
    setMessage("Die Krypta wird schwarz. R startet neu.");
  }
}

function flashDamage() {
  damageFlash.classList.add("is-active");
  window.setTimeout(() => damageFlash.classList.remove("is-active"), 90);
}

function openDoor() {
  state.doorOpen = true;
  if (doorMesh) doorMesh.visible = false;
  playSfx("thunder", 0.8);
}

function frontCell() {
  const dir = DIRS[state.player.dir];
  return { x: state.player.x + dir.x, y: state.player.y + dir.y };
}

function wrapDir(dir) {
  return (dir + DIRS.length) % DIRS.length;
}

function collectedRunes() {
  return state.runes.filter((rune) => rune.collected).length;
}

function enemyAt(x, y) {
  return state.enemies.find((enemy) => enemy.alive && enemy.x === x && enemy.y === y) || null;
}

function secretAt(x, y) {
  return state.secrets.find((secret) => secret.x === x && secret.y === y) || null;
}

function secretFacing(secret) {
  for (const dir of DIRS) {
    const nx = secret.x + dir.x;
    const ny = secret.y + dir.y;
    if (isInside(nx, ny) && state.map[ny][nx] !== "#") return dir;
  }
  return DIRS[0];
}

function isDoor(x, y) {
  return state.door && state.door.x === x && state.door.y === y;
}

function isWalkable(x, y) {
  if (!isInside(x, y)) return false;
  const tile = state.map[y][x];
  if (tile === "#") return false;
  if (tile === "D" && !state.doorOpen) return false;
  return true;
}

function isInside(x, y) {
  return x >= 0 && y >= 0 && x < state.width && y < state.height;
}

function lineOfSight(x1, y1, x2, y2) {
  if (x1 !== x2 && y1 !== y2) return false;
  const dx = Math.sign(x2 - x1);
  const dy = Math.sign(y2 - y1);
  let x = x1 + dx;
  let y = y1 + dy;
  while (x !== x2 || y !== y2) {
    if (!isWalkable(x, y)) return false;
    x += dx;
    y += dy;
  }
  return true;
}

function manhattan(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateCameraTarget(snap) {
  const pos = cellToWorld(state.player.x, state.player.y);
  cameraTarget.pos.set(pos.x, CAMERA_HEIGHT, pos.z);
  cameraTarget.yaw = DIRS[state.player.dir].yaw;
  if (snap) {
    camera.position.copy(cameraTarget.pos);
    camera.rotation.set(0, cameraTarget.yaw, 0);
  }
}

function cellToWorld(x, y) {
  return {
    x: (x - state.width / 2 + 0.5) * CELL,
    z: (y - state.height / 2 + 0.5) * CELL
  };
}

function loop(time) {
  const dt = Math.min(clock.getDelta(), 0.05);
  animate(time, dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function animate(time, dt) {
  camera.position.lerp(cameraTarget.pos, 1 - Math.pow(0.0004, dt));
  camera.rotation.y = lerpAngle(camera.rotation.y, cameraTarget.yaw, 1 - Math.pow(0.0003, dt));

  if (dustField) {
    dustField.rotation.y += dt * 0.012;
    dustField.material.opacity = 0.34 + Math.sin(time * 0.0012) * 0.08;
  }

  entityGroup.children.forEach((child, index) => {
    if (child.isSprite) {
      child.position.y += Math.sin(time * 0.003 + index) * 0.0018;
    } else if (child.isMesh && child.geometry?.type?.includes("Circle")) {
      child.rotation.z += dt * 0.25;
    }
  });

  if (bossTexture && state.boss?.alive) {
    const row = state.boss.hp < state.boss.maxHp * 0.35 ? 2 : state.boss.hp < state.boss.maxHp * 0.7 ? 1 : 0;
    const col = Math.floor(time / 180) % 3;
    setBossFrame(row, col);
  }

  if (exitMesh?.visible) {
    exitMesh.rotation.y += dt * 0.9;
    if (exitMesh.children[1]) exitMesh.children[1].rotation.z -= dt * 1.4;
  }
}

function setBossFrame(row, col) {
  if (!bossTexture) return;
  const cols = 3;
  const rows = 6;
  bossTexture.offset.set(col / cols, 1 - (row + 1) / rows);
}

function lerpAngle(a, b, t) {
  const diff = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + diff * t;
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function currentRoute(ignoreNpc = null) {
  const target = currentObjectiveTarget(ignoreNpc);
  const path = target ? findPathTo(target.goalX, target.goalY) : null;
  const distance = path ? Math.max(0, path.length - 1) : 0;
  const step = path && path.length > 1 ? path[1] : null;
  const cue = step ? routeCue(step.x - state.player.x, step.y - state.player.y) : { arrow: "o", label: "hier" };
  const detail = target
    ? `${distance} Schritt${distance === 1 ? "" : "e"} ${cue.label}: ${target.hint}`
    : "Kein aktives Ziel";
  return { target, path, distance, cue, detail };
}

function currentObjectiveTarget(ignoreNpc = null) {
  if (state.dead) return { label: "Neu starten", hint: "R oder Neu druecken", x: state.player.x, y: state.player.y, goalX: state.player.x, goalY: state.player.y };
  if (state.won) return { label: "Run geschafft", hint: "Sieg", x: state.player.x, y: state.player.y, goalX: state.player.x, goalY: state.player.y };

  const npc = state.npcs.find((item) => item !== ignoreNpc && !item.spoken);
  if (npc) {
    return { label: "Orakel sprechen", hint: "stelle dich davor und druecke F", x: npc.x, y: npc.y, goalX: npc.x, goalY: npc.y };
  }

  const rune = nearestTarget(state.runes.filter((item) => !item.collected));
  if (rune) {
    return { label: `Rune ${collectedRunes() + 1}/3`, hint: "draufgehen oder F druecken", x: rune.x, y: rune.y, goalX: rune.x, goalY: rune.y };
  }

  if (state.door && !state.doorOpen) {
    const goal = nearestAdjacentGoal(state.door.x, state.door.y) || state.door;
    return { label: "Siegel-Tor", hint: "davor stehen und F druecken", x: state.door.x, y: state.door.y, goalX: goal.x, goalY: goal.y };
  }

  if (state.boss?.alive) {
    const goal = nearestAdjacentGoal(state.boss.x, state.boss.y) || state.boss;
    return { label: state.boss.name, hint: "angrenzend stehen und Hit/Z nutzen", x: state.boss.x, y: state.boss.y, goalX: goal.x, goalY: goal.y };
  }

  if (state.exit) {
    return { label: state.depth === MAX_DEPTH ? "Endportal" : "Portal runter", hint: "hineingehen und F druecken", x: state.exit.x, y: state.exit.y, goalX: state.exit.x, goalY: state.exit.y };
  }

  return null;
}

function nearestTarget(items) {
  let best = null;
  for (const item of items) {
    const path = findPathTo(item.x, item.y);
    if (!path) continue;
    if (!best || path.length < best.path.length) best = { item, path };
  }
  return best?.item || null;
}

function nearestAdjacentGoal(x, y) {
  let best = null;
  for (const dir of DIRS) {
    const gx = x + dir.x;
    const gy = y + dir.y;
    if (!isWalkable(gx, gy)) continue;
    const path = findPathTo(gx, gy);
    if (!path) continue;
    if (!best || path.length < best.path.length) best = { x: gx, y: gy, path };
  }
  return best;
}

function findPathTo(tx, ty) {
  if (!isInside(tx, ty)) return null;
  const start = { x: state.player.x, y: state.player.y };
  const queue = [start];
  const seen = new Set([`${start.x},${start.y}`]);
  const previous = new Map();

  while (queue.length) {
    const current = queue.shift();
    if (current.x === tx && current.y === ty) return rebuildPath(previous, current);
    for (const dir of DIRS) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const key = `${nx},${ny}`;
      if (seen.has(key) || !routeWalkable(nx, ny, tx, ty)) continue;
      seen.add(key);
      previous.set(key, current);
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}

function rebuildPath(previous, end) {
  const path = [end];
  let key = `${end.x},${end.y}`;
  while (previous.has(key)) {
    const step = previous.get(key);
    path.unshift(step);
    key = `${step.x},${step.y}`;
  }
  return path;
}

function routeWalkable(x, y, tx, ty) {
  if (!isInside(x, y)) return false;
  if (x === tx && y === ty && state.map[y][x] !== "#") return true;
  return isWalkable(x, y);
}

function routeCue(dx, dy) {
  const absolute = DIRS.findIndex((dir) => dir.x === dx && dir.y === dy);
  if (absolute < 0) return { arrow: "o", label: "hier" };
  const relative = wrapDir(absolute - state.player.dir);
  if (relative === 0) return { arrow: "^", label: "geradeaus" };
  if (relative === 1) return { arrow: ">", label: "rechts" };
  if (relative === 3) return { arrow: "<", label: "links" };
  return { arrow: "v", label: "zurueck" };
}

function updateRouteChip(route) {
  if (!route?.target) return;
  routeArrow.textContent = route.cue.arrow;
  routeText.textContent = route.target.label;
  routeDetail.textContent = route.detail;
}

function updateHud() {
  const route = currentRoute();
  hpText.textContent = `${state.player.hp} / ${state.player.maxHp}`;
  hpFill.style.width = `${Math.max(0, Math.min(1, state.player.hp / state.player.maxHp)) * 100}%`;
  runeText.textContent = `${collectedRunes()} / 3`;
  atkText.textContent = `${state.player.atk}`;
  focusText.textContent = `${state.player.focus} / ${state.player.maxFocus}`;
  focusFill.style.width = `${Math.max(0, Math.min(1, state.player.focus / state.player.maxFocus)) * 100}%`;
  depthText.textContent = `${state.depth}/${MAX_DEPTH}`;
  relicText.textContent = state.relics.length
    ? RELIC_DEFS.filter((relic) => state.relics.includes(relic.id)).map((relic) => relic.name).slice(-1)[0]
    : "Keins";

  if (state.dead) {
    objectiveText.textContent = "R startet einen neuen Abstieg.";
  } else if (state.won) {
    objectiveText.textContent = "Sieg. Die Krypta ist gebrochen.";
  } else if (state.boss?.alive && state.doorOpen) {
    objectiveText.textContent = `Besiege den Glockenfuerst (${state.boss.hp}/${state.boss.maxHp}).`;
  } else if (collectedRunes() >= 3 && !state.doorOpen) {
    objectiveText.textContent = "Oeffne das rote Siegel im Osten.";
  } else if (state.boss && !state.boss.alive) {
    objectiveText.textContent = state.depth === MAX_DEPTH ? "Tritt in das Endportal." : "Tritt in das Portal zur naechsten Ebene.";
  } else {
    objectiveText.textContent = route.target
      ? `${route.target.label}: ${route.detail}.`
      : `${currentTheme().name}: Runen, Altare und Geheimwaende suchen.`;
  }

  messageText.textContent = state.message;
  updateRouteChip(route);
  renderMiniMap(route);
}

function renderMiniMap(route = currentRoute()) {
  if (!state.mapVisible) return;
  miniMap.style.gridTemplateColumns = `repeat(${state.width}, 10px)`;
  const pathKeys = new Set((route.path || []).map((step) => `${step.x},${step.y}`));
  const targetKey = route.target ? `${route.target.x},${route.target.y}` : "";
  const cells = [];
  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const classes = ["mini-cell"];
      const tile = state.map[y][x];
      if (tile === "#") classes.push("mini-wall");
      else classes.push("mini-floor");
      if (pathKeys.has(`${x},${y}`)) classes.push("mini-path");
      if (tile === "D" && !state.doorOpen) classes.push("mini-door");
      if (state.secrets.some((secret) => !secret.broken && secret.x === x && secret.y === y)) classes.push("mini-secret");
      if (state.runes.some((rune) => !rune.collected && rune.x === x && rune.y === y)) classes.push("mini-rune");
      if (state.shrines.some((shrine) => !shrine.used && shrine.x === x && shrine.y === y)) classes.push("mini-shrine");
      if (enemyAt(x, y) || (state.boss?.alive && state.boss.x === x && state.boss.y === y)) classes.push("mini-enemy");
      if (`${x},${y}` === targetKey) classes.push("mini-target");
      if (state.player.x === x && state.player.y === y) classes.push("mini-player");
      cells.push(`<span class="${classes.join(" ")}"></span>`);
    }
  }
  miniMap.innerHTML = cells.join("");
}

function setMessage(text) {
  if (!text) return;
  state.message = text;
  messageText.textContent = text;
}

function toggleAudio() {
  audioEnabled = !audioEnabled;
  audioBtn.textContent = audioEnabled ? "Audio an" : "Audio";
  if (audioEnabled) {
    startMusic();
    playSfx("thunder", 0.18);
  } else if (music) {
    music.pause();
  }
}

function startMusic() {
  if (!audioEnabled) return;
  if (music) music.pause();
  music = new Audio(ASSETS.audio.music[musicIndex % ASSETS.audio.music.length]);
  music.loop = true;
  music.volume = 0.32;
  music.play().catch(() => {
    audioEnabled = false;
    audioBtn.textContent = "Audio";
  });
  musicIndex += 1;
}

function playSfx(key, volume = 0.55) {
  if (!audioEnabled) return;
  const path = ASSETS.audio.sfx[key];
  if (!path) return;
  const sound = new Audio(path);
  sound.volume = volume;
  sound.play().catch(() => {});
}
