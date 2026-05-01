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
    chapel: "./assets/props/chapel-backdrop.png"
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

const ENEMY_DEFS = {
  skeleton: { name: "Knochendiener", hp: 14, atk: 4, sprite: "skeleton", size: 1.55 },
  knight: { name: "Hohlritter", hp: 22, atk: 6, sprite: "knight", size: 1.75 },
  gargoyle: { name: "Firstwache", hp: 18, atk: 5, sprite: "gargoyle", size: 1.85 },
  reaper: { name: "Sichelgeist", hp: 20, atk: 7, sprite: "reaper", size: 1.75 },
  phantom: { name: "Phantom", hp: 16, atk: 6, sprite: "phantom", size: 1.6 },
  witch: { name: "Kerzenhexe", hp: 17, atk: 5, sprite: "witch", size: 1.6 }
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

const TRAPS = [
  { x: 8, y: 3, armed: true },
  { x: 2, y: 9, armed: true },
  { x: 11, y: 12, armed: true }
];

const EXTRA_DEPTH_ENEMIES = {
  2: [
    { x: 9, y: 3, kind: "phantom" },
    { x: 5, y: 9, kind: "witch" }
  ],
  3: [
    { x: 3, y: 5, kind: "reaper" },
    { x: 11, y: 5, kind: "gargoyle" },
    { x: 5, y: 11, kind: "knight" }
  ]
};

const $ = (id) => document.getElementById(id);

const canvas = $("game");
const hpText = $("hpText");
const runeText = $("runeText");
const atkText = $("atkText");
const depthText = $("depthText");
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
scene.background = new THREE.Color(0x050403);
scene.fog = new THREE.FogExp2(0x070906, 0.055);

const camera = new THREE.PerspectiveCamera(66, 1, 0.08, 90);
const clock = new THREE.Clock();
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();

const worldGroup = new THREE.Group();
const propGroup = new THREE.Group();
const entityGroup = new THREE.Group();
scene.add(worldGroup, propGroup, entityGroup);

const state = {
  width: MAP_LINES[0].length,
  height: MAP_LINES.length,
  map: [],
  player: { x: 1, y: 1, dir: 1, hp: 36, maxHp: 36, atk: 7, guard: 1 },
  runes: [],
  chests: [],
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
  depth: 1
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
  const kinds = ["skeleton", "knight", "gargoyle", "reaper", "phantom", "witch"];
  let enemyCount = 0;
  state.runes = [];
  state.chests = [];
  state.enemies = [];
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
          name: state.depth === MAX_DEPTH ? "Ur-Glockenfuerst" : "Glockenfuerst"
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
  if (carryPlayer) {
    state.player.dir = 1;
    state.player.maxHp += 4;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 14);
    state.player.atk += 1;
  }
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
}

function setupLighting() {
  const ambient = new THREE.HemisphereLight(0x748c8f, 0x1a0f0b, 0.55);
  scene.add(ambient);

  const moon = new THREE.DirectionalLight(0xbfd7ff, 1.05);
  moon.position.set(-12, 16, -8);
  moon.castShadow = true;
  moon.shadow.camera.left = -36;
  moon.shadow.camera.right = 36;
  moon.shadow.camera.top = 36;
  moon.shadow.camera.bottom = -36;
  scene.add(moon);

  const playerLight = new THREE.PointLight(0xffb05a, 1.65, 13, 2);
  camera.add(playerLight);
  scene.add(camera);
}

function buildDungeon() {
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: makeStoneTexture("#4a5148", "#1f241f", "#a5ad95"),
    roughness: 0.96,
    metalness: 0.02
  });
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: makeFloorTexture(),
    roughness: 1,
    metalness: 0
  });
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x151a16,
    roughness: 1
  });
  const doorMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a2d22,
    roughness: 0.74,
    metalness: 0.38,
    emissive: 0x2b0505,
    emissiveIntensity: 0.18
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
        continue;
      }

      const floor = new THREE.Mesh(floorGeo, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(pos.x, 0, pos.z);
      floor.receiveShadow = true;
      worldGroup.add(floor);

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

  placeBackdrop();
}

function createExitMesh(pos) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.08, 12, 40),
    new THREE.MeshStandardMaterial({
      color: 0x7dd6c6,
      emissive: 0x2a9f93,
      emissiveIntensity: 1.2,
      roughness: 0.4
    })
  );
  ring.position.set(pos.x, 1.6, pos.z);
  ring.rotation.y = Math.PI / 2;
  const glow = new THREE.PointLight(0x69dfc0, 1.8, 9, 2);
  glow.position.set(pos.x, 1.7, pos.z);
  group.add(ring, glow);
  group.visible = false;
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
  for (const point of PROP_POINTS) {
    if (!isInside(point.x, point.y) || state.map[point.y][point.x] === "#") continue;
    const sprite = makeSprite(ASSETS.props[point.key], point.size);
    const pos = cellToWorld(point.x, point.y);
    sprite.position.set(pos.x, point.size * 0.48, pos.z);
    propGroup.add(sprite);
    if (point.light) {
      const light = new THREE.PointLight(0xff9d4d, 1.2, 7, 2);
      light.position.set(pos.x, 1.7, pos.z);
      propGroup.add(light);
    }
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
  entityGroup.clear();

  for (const chest of state.chests) {
    if (chest.opened) continue;
    const sprite = makeSprite(ASSETS.props.chest, 1.5);
    placeSpriteAtCell(sprite, chest.x, chest.y, 0.68);
    entityGroup.add(sprite);
  }

  for (const rune of state.runes) {
    if (rune.collected) continue;
    const sprite = makeSprite(ASSETS.props.ruby, 1.15);
    sprite.material.color.set(0x90f8ff);
    placeSpriteAtCell(sprite, rune.x, rune.y, 0.7);
    entityGroup.add(sprite);
  }

  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const def = ENEMY_DEFS[enemy.kind];
    const sprite = makeSprite(ASSETS.sprites[def.sprite], def.size);
    sprite.userData.entityId = enemy.id;
    placeSpriteAtCell(sprite, enemy.x, enemy.y, def.size * 0.48);
    entityGroup.add(sprite);
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
    entityGroup.add(bossSprite);
  } else {
    bossSprite = null;
    bossTexture = null;
  }
}

function placeSpriteAtCell(sprite, x, y, baseY) {
  const pos = cellToWorld(x, y);
  sprite.position.set(pos.x, baseY, pos.z);
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

  const texture = new THREE.CanvasTexture(canvasTex);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.4, 1.4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeFloorTexture() {
  const texture = makeStoneTexture("#3d4236", "#1e211b", "#817b61");
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
  mapBtn.addEventListener("click", () => {
    state.mapVisible = !state.mapVisible;
    miniMap.style.display = state.mapVisible ? "grid" : "none";
  });

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
  setMessage(isMobileMode() ? "Swipe: hoch/runter gehen, links/rechts drehen. Tippen greift an." : "Drei Ebenen. Drei Siegel. Unten wartet der Ur-Glockenfuerst.");
}

function updateMobileMode() {
  document.body.classList.toggle("mobile-mode", isMobileMode());
  if (state.active && !state.dead && !state.won && isMobileMode()) {
    setMessage("Swipe: hoch/runter gehen, links/rechts drehen. Tippen greift an.");
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
  const enemy = enemyAt(front.x, front.y);
  const boss = state.boss?.alive && state.boss.x === front.x && state.boss.y === front.y ? state.boss : null;
  const target = enemy || boss;

  if (!target) {
    setMessage("Dein Hieb schneidet nur Staub.");
    playSfx("slash", 0.45);
    return;
  }

  const damage = rand(5, 9) + state.player.atk + collectedRunes();
  target.hp = Math.max(0, target.hp - damage);
  playSfx("slash", 0.7);

  if (target.hp <= 0) {
    target.alive = false;
    if (target.id === "boss") {
      setMessage(state.depth === MAX_DEPTH ? "Der Ur-Glockenfuerst zerfaellt. Das Endportal leuchtet." : "Der Glockenfuerst zerfaellt. Das Portal in die Tiefe leuchtet.");
      if (exitMesh) exitMesh.visible = true;
      playSfx("thunder", 0.8);
    } else {
      setMessage(`${target.name} zerbricht. +1 ATK, +3 HP.`);
      state.player.atk += 1;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 3);
      playSfx(target.kind === "knight" ? "armor" : "bones", 0.68);
    }
  } else {
    setMessage(`${target.name} verliert ${damage} HP.`);
  }

  syncEntitySprites();
  spendTurn(null);
}

function interact() {
  const here = { x: state.player.x, y: state.player.y };
  const front = frontCell();
  const handled = collectAt(here.x, here.y) || collectAt(front.x, front.y);
  if (handled) {
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
    setMessage(`Truhe geoeffnet: +${heal} HP, +${atk} ATK.`);
    playSfx("armor", 0.55);
    syncEntitySprites();
    return true;
  }

  return false;
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
  if (dist > 7 && !lineOfSight(enemy.x, enemy.y, state.player.x, state.player.y)) return;

  const step = nextStepToward(enemy.x, enemy.y, state.player.x, state.player.y, enemy.id);
  if (!step) return;
  enemy.x = step.x;
  enemy.y = step.y;
}

function bossAct() {
  const boss = state.boss;
  if (!boss?.alive || !state.doorOpen) return;
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
  return !state.enemies.some((enemy) => enemy.alive && enemy.id !== selfId && enemy.x === x && enemy.y === y);
}

function harmPlayer(amount, text) {
  const damage = Math.max(1, amount);
  state.player.hp = Math.max(0, state.player.hp - damage);
  setMessage(`${text} -${damage} HP.`);
  if (state.player.hp <= 0) {
    state.dead = true;
    setMessage("Die Krypta wird schwarz. R startet neu.");
  }
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

  entityGroup.children.forEach((child, index) => {
    if (child.isSprite) {
      child.position.y += Math.sin(time * 0.003 + index) * 0.0018;
    }
  });

  if (bossTexture && state.boss?.alive) {
    const row = state.boss.hp < state.boss.maxHp * 0.35 ? 2 : state.boss.hp < state.boss.maxHp * 0.7 ? 1 : 0;
    const col = Math.floor(time / 180) % 3;
    setBossFrame(row, col);
  }

  if (exitMesh?.visible) {
    exitMesh.rotation.y += dt * 0.9;
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

function updateHud() {
  hpText.textContent = `${state.player.hp} / ${state.player.maxHp}`;
  runeText.textContent = `${collectedRunes()} / 3`;
  atkText.textContent = `${state.player.atk}`;
  depthText.textContent = `${state.depth}/${MAX_DEPTH}`;

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
    objectiveText.textContent = `Ebene ${state.depth}/${MAX_DEPTH}: Finde drei Runen und oeffne das Siegel.`;
  }

  messageText.textContent = state.message;
  renderMiniMap();
}

function renderMiniMap() {
  if (!state.mapVisible) return;
  miniMap.style.gridTemplateColumns = `repeat(${state.width}, 10px)`;
  const cells = [];
  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const classes = ["mini-cell"];
      const tile = state.map[y][x];
      if (tile === "#") classes.push("mini-wall");
      else classes.push("mini-floor");
      if (tile === "D" && !state.doorOpen) classes.push("mini-door");
      if (state.runes.some((rune) => !rune.collected && rune.x === x && rune.y === y)) classes.push("mini-rune");
      if (enemyAt(x, y) || (state.boss?.alive && state.boss.x === x && state.boss.y === y)) classes.push("mini-enemy");
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
