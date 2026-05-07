import * as THREE from "../assets/vendor/three.module.js";
import {
  BOOST_RINGS,
  COINS,
  DECOR,
  ENEMIES,
  GOAL,
  LEVEL_TARGET_STARS,
  PLATFORMS,
  SPRINGS,
  START,
  STARS,
} from "./level.js";

const canvas = document.getElementById("game");
const ui = {
  hud: document.getElementById("hud"),
  menu: document.getElementById("menu"),
  finish: document.getElementById("finish"),
  startButton: document.getElementById("startButton"),
  againButton: document.getElementById("againButton"),
  soundButton: document.getElementById("soundButton"),
  menuSoundButton: document.getElementById("menuSoundButton"),
  pauseButton: document.getElementById("pauseButton"),
  resetButton: document.getElementById("resetButton"),
  starText: document.getElementById("starText"),
  coinText: document.getElementById("coinText"),
  jumpText: document.getElementById("jumpText"),
  timeText: document.getElementById("timeText"),
  objectiveText: document.getElementById("objectiveText"),
  health: [
    document.getElementById("healthA"),
    document.getElementById("healthB"),
    document.getElementById("healthC"),
  ],
  finishTitle: document.getElementById("finishTitle"),
  finishStats: document.getElementById("finishStats"),
  toast: document.getElementById("toast"),
  moveStick: document.getElementById("moveStick"),
  cameraStick: document.getElementById("cameraStick"),
  jumpTouch: document.getElementById("jumpTouch"),
};

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("touch") === "1") {
  document.body.classList.add("force-touch");
}
const mutedByUrl = urlParams.get("mute") === "1";

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
if ("toneMapping" in renderer && THREE.ACESFilmicToneMapping) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
}
if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ee8ff);
scene.fog = new THREE.Fog(0x9ee8ff, 42, 175);

const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 260);
const clock = new THREE.Clock();
const textureLoader = new THREE.TextureLoader();

const tmpVec = new THREE.Vector3();
const tmpVec2 = new THREE.Vector3();
const tmpForward = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const tmpColor = new THREE.Color();

const GRAVITY = -29;
const MAX_FALL_SPEED = -34;
const PLAYER_RADIUS = 0.46;
const PLAYER_HEIGHT = 1.55;
const RUN_SPEED = 8.7;
const AIR_SPEED = 7.1;
const ACCEL_GROUND = 38;
const ACCEL_AIR = 18;
const FRICTION = 13;
const JUMP_SPEED = 11.2;
const DOUBLE_JUMP_SPEED = 10.6;
const MAX_AIR_JUMPS = 1;
const COYOTE_TIME = 0.12;
const RESPAWN_Y = -14;
const TAU = Math.PI * 2;

const solids = [];
const movingSolids = [];
const starItems = [];
const coinItems = [];
const springItems = [];
const boostRingItems = [];
const enemyItems = [];
const particles = [];
const keys = new Set();

const player = {
  pos: new THREE.Vector3(START.x, START.y, START.z),
  vel: new THREE.Vector3(),
  heading: Math.PI,
  grounded: false,
  groundSolid: null,
  coyote: 0,
  jumpQueued: false,
  jumpBuffer: 0,
  airJumpsUsed: 0,
  springCooldown: 0,
  damageCooldown: 0,
  health: 3,
  checkpoint: new THREE.Vector3(START.x, START.y, START.z),
};

const game = {
  running: false,
  paused: false,
  completed: false,
  time: 0,
  stars: 0,
  coins: 0,
  toastTimer: 0,
};

const cameraState = {
  yaw: Math.PI,
  pitch: 0.48,
  distance: 10.5,
  manualTimer: 0,
  mouseActive: false,
  pointerId: null,
  lastX: 0,
  lastY: 0,
};

const audio = {
  enabled: false,
  bgm: null,
  clips: {},
  init() {
    this.bgm = new Audio("assets/audio/downloads-bgm.mp3");
    this.bgm.loop = true;
    this.bgm.volume = 0.42;
    this.bgm.preload = "none";
    this.bgm.addEventListener("error", () => {
      this.bgm = new Audio("assets/audio/bgm_loop.wav");
      this.bgm.loop = true;
      this.bgm.volume = 0.34;
    }, { once: true });
    const names = ["jump", "land", "pickup", "star", "bounce", "hurt", "win"];
    for (const name of names) {
      const clip = new Audio(`assets/audio/${name}.wav`);
      clip.preload = "auto";
      this.clips[name] = clip;
    }
  },
  setEnabled(enabled) {
    this.enabled = enabled;
    syncSoundButtons();
    if (enabled && game.running && !game.paused && !game.completed) {
      this.bgm.play().catch(() => {});
    } else {
      this.bgm.pause();
    }
  },
  play(name, volume = 1) {
    if (!this.enabled || !this.clips[name]) return;
    const clip = this.clips[name].cloneNode();
    clip.volume = Math.min(1, volume);
    clip.play().catch(() => {});
  },
};

audio.init();

function syncSoundButtons() {
  const text = audio.enabled ? "Sound aus" : "Sound an";
  ui.soundButton.textContent = text;
  ui.menuSoundButton.textContent = text;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function approach(value, target, maxDelta) {
  if (value < target) return Math.min(target, value + maxDelta);
  if (value > target) return Math.max(target, value - maxDelta);
  return target;
}

function damp(current, target, lambda, dt) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

function shortestAngle(from, to) {
  return THREE.MathUtils.euclideanModulo(to - from + Math.PI, TAU) - Math.PI;
}

function lerpAngle(from, to, t) {
  return from + shortestAngle(from, to) * t;
}

function normalizeInput(x, y) {
  const length = Math.hypot(x, y);
  if (length > 1) return { x: x / length, y: y / length, length: 1 };
  return { x, y, length };
}

function topOf(solid) {
  return solid.y + solid.h * 0.5;
}

function bottomOf(solid) {
  return solid.y - solid.h * 0.5;
}

function loadTexture(name, repeatX = 1, repeatY = 1) {
  const texture = textureLoader.load(`assets/textures/${name}.svg`);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if ("colorSpace" in texture && THREE.SRGBColorSpace) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  return texture;
}

function materialFromTexture(name, color, repeatX = 1, repeatY = 1, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    map: loadTexture(name, repeatX, repeatY),
    roughness: options.roughness ?? 0.82,
    metalness: options.metalness ?? 0.03,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
  });
}

const materials = {
  gold: materialFromTexture("star_texture", 0xffffff, 1, 1, {
    roughness: 0.38,
    emissive: 0xaa7a11,
    emissiveIntensity: 0.25,
  }),
  hero: materialFromTexture("hero_cloth", 0xffffff, 1, 1, { roughness: 0.68 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xffcf9f, roughness: 0.65 }),
  cap: new THREE.MeshStandardMaterial({ color: 0x2a70ff, roughness: 0.58 }),
  shoe: new THREE.MeshStandardMaterial({ color: 0x27313a, roughness: 0.7 }),
  eye: new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.4 }),
  enemy: materialFromTexture("enemy_skin", 0xffffff, 1, 1, { roughness: 0.66 }),
  springTop: materialFromTexture("spring_pad", 0xffffff, 1, 1, {
    roughness: 0.44,
    emissive: 0x331000,
    emissiveIntensity: 0.08,
  }),
  springSide: new THREE.MeshStandardMaterial({ color: 0x1b2a38, roughness: 0.45, metalness: 0.1 }),
  islandUnderside: new THREE.MeshStandardMaterial({ color: 0x5b4638, roughness: 0.88 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x79543b, roughness: 0.86 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x4ab071, roughness: 0.8 }),
  cloud: materialFromTexture("cloud_tile", 0xffffff, 1, 1, { roughness: 0.62 }),
  flowerStem: new THREE.MeshStandardMaterial({ color: 0x267a4f, roughness: 0.75 }),
  flowerPetal: new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.6, emissive: 0x3a2200, emissiveIntensity: 0.08 }),
  flagPole: new THREE.MeshStandardMaterial({ color: 0x33414a, roughness: 0.5, metalness: 0.08 }),
  flagCloth: new THREE.MeshStandardMaterial({ color: 0xf1725f, roughness: 0.68, side: THREE.DoubleSide }),
  boostRing: new THREE.MeshStandardMaterial({
    color: 0x9ee8ff,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0x20d6ff,
    emissiveIntensity: 0.82,
    transparent: true,
    opacity: 0.86,
  }),
  portalClosed: new THREE.MeshStandardMaterial({
    color: 0x44566d,
    roughness: 0.45,
    metalness: 0.12,
    emissive: 0x07111c,
    emissiveIntensity: 0.18,
  }),
  portalOpen: new THREE.MeshStandardMaterial({
    color: 0xffd166,
    roughness: 0.34,
    metalness: 0.05,
    emissive: 0xff9f1c,
    emissiveIntensity: 0.7,
  }),
};

function addLights() {
  const hemi = new THREE.HemisphereLight(0xdaf7ff, 0x3f7055, 2.15);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff4cf, 3.2);
  sun.position.set(-23, 42, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -65;
  sun.shadow.camera.right = 65;
  sun.shadow.camera.top = 55;
  sun.shadow.camera.bottom = -85;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 140;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x8ecbff, 0.75);
  fill.position.set(40, 20, -80);
  scene.add(fill);
}

function addSkyAndWater() {
  const skyGeometry = new THREE.SphereGeometry(120, 32, 18);
  const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0xd7f7ff,
    side: THREE.BackSide,
    fog: false,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.position.set(0, 15, -48);
  scene.add(sky);

  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(8, 48),
    new THREE.MeshBasicMaterial({ color: 0xfff2a6, transparent: true, opacity: 0.86, fog: false }),
  );
  sun.position.set(-54, 56, -100);
  sun.lookAt(0, 12, -44);
  scene.add(sun);

  const horizon = new THREE.Mesh(
    new THREE.RingGeometry(66, 70, 96),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, fog: false }),
  );
  horizon.position.set(0, -2.5, -55);
  horizon.rotation.x = Math.PI / 2;
  scene.add(horizon);

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 260, 1, 1),
    materialFromTexture("water_tile", 0xffffff, 18, 18, {
      transparent: true,
      opacity: 0.62,
      roughness: 0.18,
      metalness: 0.02,
    }),
  );
  water.name = "soft-reset-water";
  water.rotation.x = -Math.PI / 2;
  water.position.set(3, -9.2, -46);
  water.receiveShadow = false;
  scene.add(water);
  scene.userData.water = water;
}

function createPlatform(def) {
  const repeatX = Math.max(1, def.w / 4);
  const repeatY = Math.max(1, def.d / 4);
  const topMaterial = materialFromTexture(def.texture, 0xffffff, repeatX, repeatY);
  const sideMaterial = materialFromTexture(def.texture === "cloud_tile" ? "cloud_tile" : "cliff_tile", 0xffffff, repeatX, Math.max(1, def.h));
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(def.w, def.h, def.d),
    [sideMaterial, sideMaterial, topMaterial, materials.islandUnderside, sideMaterial, sideMaterial],
  );
  mesh.position.set(def.x, def.y, def.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = `platform-${def.id}`;
  scene.add(mesh);

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 45),
    new THREE.LineBasicMaterial({ color: 0x1f2e37, transparent: true, opacity: 0.12 }),
  );
  edge.position.copy(mesh.position);
  scene.add(edge);

  const skirt = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(def.w, def.d) * 0.42, Math.max(def.w, def.d) * 0.16, 4, 1),
    materials.islandUnderside,
  );
  skirt.position.set(def.x, def.y - def.h * 0.5 - Math.max(def.w, def.d) * 0.08, def.z);
  skirt.rotation.y = Math.PI / 4;
  skirt.scale.set(def.w / Math.max(def.w, def.d), 1, def.d / Math.max(def.w, def.d));
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  scene.add(skirt);

  const solid = {
    ...def,
    mesh,
    edge,
    skirt,
    baseX: def.x,
    baseY: def.y,
    baseZ: def.z,
    deltaX: 0,
    deltaY: 0,
    deltaZ: 0,
  };

  solids.push(solid);
  if (def.moving) movingSolids.push(solid);
}

function createBoostRing(def) {
  const group = new THREE.Group();
  const ringMaterial = materials.boostRing.clone();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.08, 14, 56), ringMaterial);
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.025, 8, 44),
    new THREE.MeshBasicMaterial({ color: 0xfff7ad, transparent: true, opacity: 0.78 }),
  );
  const light = new THREE.PointLight(0x79e9ff, 0.9, 7);
  ring.castShadow = true;
  group.add(ring, inner, light);
  group.position.set(def.x, def.y, def.z);
  group.rotation.y = def.yaw;
  scene.add(group);
  boostRingItems.push({
    ...def,
    group,
    ring,
    inner,
    cooldown: 0,
    forward: new THREE.Vector3(Math.sin(def.yaw), 0, Math.cos(def.yaw)).normalize(),
  });
}

function createSpring(def) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.26, 32), materials.springSide);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.94, 1.02, 0.12, 32), materials.springTop);
  top.position.y = 0.2;
  base.castShadow = true;
  top.castShadow = true;
  group.add(base, top);
  group.position.set(def.x, def.y + 0.13, def.z);
  scene.add(group);
  springItems.push({ ...def, group, cooldown: 0 });
}

function createStar(def) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 1), materials.gold);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.055, 10, 32),
    new THREE.MeshStandardMaterial({
      color: 0xfff7ad,
      roughness: 0.3,
      emissive: 0xffb000,
      emissiveIntensity: 0.3,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  core.castShadow = true;
  group.add(core, ring);
  group.position.set(def.x, def.y, def.z);
  scene.add(group);
  starItems.push({ ...def, group, collected: false });
}

function createCoin(def, index) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.075, 10, 28),
    new THREE.MeshStandardMaterial({
      color: 0xffd166,
      roughness: 0.25,
      metalness: 0.08,
      emissive: 0x5c3500,
      emissiveIntensity: 0.15,
    }),
  );
  mesh.position.set(def.x, def.y, def.z);
  mesh.castShadow = true;
  scene.add(mesh);
  coinItems.push({ ...def, id: `coin-${index}`, mesh, collected: false });
}

function createTree(def) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.3, 10), materials.trunk);
  trunk.position.y = 0.65 * def.scale;
  trunk.scale.setScalar(def.scale);
  trunk.castShadow = true;
  const leafA = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), materials.leaf);
  leafA.position.y = 1.55 * def.scale;
  leafA.scale.set(1.1 * def.scale, 0.9 * def.scale, 1.1 * def.scale);
  leafA.castShadow = true;
  const leafB = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), materials.leaf);
  leafB.position.set(0.45 * def.scale, 1.95 * def.scale, -0.18 * def.scale);
  leafB.scale.setScalar(def.scale);
  leafB.castShadow = true;
  group.add(trunk, leafA, leafB);
  group.position.set(def.x, def.y, def.z);
  scene.add(group);
}

function createCloud(def) {
  const group = new THREE.Group();
  const parts = [
    [-0.9, 0, 0, 0.75],
    [-0.2, 0.18, 0, 0.95],
    [0.62, 0, 0.04, 0.72],
    [1.12, -0.07, -0.02, 0.48],
  ];
  for (const [x, y, z, size] of parts) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 10), materials.cloud);
    puff.position.set(x * def.scale, y * def.scale, z * def.scale);
    puff.scale.set(1.45 * def.scale, 0.62 * def.scale, 0.86 * def.scale);
    group.add(puff);
  }
  group.position.set(def.x, def.y, def.z);
  scene.add(group);
}

function createFlowerPatch(def) {
  const group = new THREE.Group();
  const offsets = [
    [-0.7, -0.35],
    [-0.25, 0.18],
    [0.2, -0.18],
    [0.65, 0.32],
    [0.0, 0.55],
  ];
  for (const [x, z] of offsets) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.34, 6), materials.flowerStem);
    stem.position.set(x * def.scale, 0.16 * def.scale, z * def.scale);
    stem.scale.setScalar(def.scale);
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), materials.flowerPetal);
    petal.position.set(x * def.scale, 0.36 * def.scale, z * def.scale);
    petal.scale.set(1.2 * def.scale, 0.55 * def.scale, def.scale);
    group.add(stem, petal);
  }
  group.position.set(def.x, def.y, def.z);
  group.rotation.y = Math.sin(def.x) * 0.5;
  scene.add(group);
}

function createFlag(def) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.7, 10), materials.flagPole);
  pole.position.y = 0.85 * def.scale;
  pole.scale.setScalar(def.scale);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.44, 4, 2), materials.flagCloth);
  cloth.position.set(0.38 * def.scale, 1.35 * def.scale, 0);
  cloth.scale.setScalar(def.scale);
  cloth.rotation.y = -0.08;
  group.add(pole, cloth);
  group.position.set(def.x, def.y, def.z);
  group.traverse((child) => {
    if (child.isMesh) child.castShadow = true;
  });
  scene.add(group);
}

function createArch(def) {
  const group = new THREE.Group();
  const columnGeometry = new THREE.CylinderGeometry(0.28, 0.34, 3.2, 16);
  const left = new THREE.Mesh(columnGeometry, materials.portalClosed);
  const right = new THREE.Mesh(columnGeometry, materials.portalClosed);
  left.position.set(-1.8, 0, 0);
  right.position.set(1.8, 0, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.22, 14, 44), materials.portalClosed);
  ring.position.y = 1.6;
  ring.scale.y = 0.72;
  group.add(left, right, ring);
  group.position.set(def.x, def.y, def.z);
  group.scale.setScalar(def.scale);
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(group);
  scene.userData.portal = group;
}

function createEnemy(def) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 16), materials.enemy);
  body.scale.set(1, 0.78, 1);
  body.position.y = 0.52;
  body.castShadow = true;

  const eyeA = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), materials.eye);
  const eyeB = eyeA.clone();
  eyeA.position.set(-0.18, 0.66, -0.5);
  eyeB.position.set(0.18, 0.66, -0.5);

  const footMaterial = new THREE.MeshStandardMaterial({ color: 0x4e2d77, roughness: 0.66 });
  const footA = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), footMaterial);
  const footB = footA.clone();
  footA.position.set(-0.32, 0.12, -0.18);
  footB.position.set(0.32, 0.12, -0.18);
  footA.scale.set(1.4, 0.45, 0.8);
  footB.scale.copy(footA.scale);
  group.add(body, eyeA, eyeB, footA, footB);
  group.position.set(def.x, def.y, def.z);
  scene.add(group);

  enemyItems.push({
    ...def,
    group,
    baseX: def.x,
    baseZ: def.z,
    angle: Math.random() * TAU,
    defeated: false,
    hitCooldown: 0,
  });
}

function createPlayer() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), materials.hero);
  body.position.y = 0.82;
  body.scale.set(0.86, 1.08, 0.72);
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 16), materials.skin);
  head.position.y = 1.48;
  head.castShadow = true;

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.35, 24), materials.cap);
  cap.position.y = 1.82;
  cap.rotation.x = -0.08;
  cap.castShadow = true;

  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.09, 0.22), materials.cap);
  brim.position.set(0, 1.67, -0.32);
  brim.castShadow = true;

  const eyeA = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), materials.eye);
  const eyeB = eyeA.clone();
  eyeA.position.set(-0.13, 1.52, -0.34);
  eyeB.position.set(0.13, 1.52, -0.34);

  const shoeA = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), materials.shoe);
  const shoeB = shoeA.clone();
  shoeA.position.set(-0.22, 0.12, -0.12);
  shoeB.position.set(0.22, 0.12, -0.12);
  shoeA.scale.set(1.25, 0.52, 1.7);
  shoeB.scale.copy(shoeA.scale);
  shoeA.castShadow = true;
  shoeB.castShadow = true;

  const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffcf9f, roughness: 0.65 });
  const armA = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.42, 5, 10), armMaterial);
  const armB = armA.clone();
  armA.position.set(-0.55, 0.88, -0.02);
  armB.position.set(0.55, 0.88, -0.02);
  armA.rotation.z = -0.35;
  armB.rotation.z = 0.35;
  armA.castShadow = true;
  armB.castShadow = true;

  group.add(body, head, cap, brim, eyeA, eyeB, shoeA, shoeB, armA, armB);
  group.userData = { body, shoeA, shoeB, armA, armB };
  scene.add(group);
  return group;
}

const playerGroup = createPlayer();

function buildWorld() {
  addLights();
  addSkyAndWater();

  for (const platform of PLATFORMS) createPlatform(platform);
  for (const spring of SPRINGS) createSpring(spring);
  for (const ring of BOOST_RINGS) createBoostRing(ring);
  STARS.forEach(createStar);
  COINS.forEach(createCoin);
  for (const decor of DECOR) {
    if (decor.type === "tree") createTree(decor);
    if (decor.type === "cloud") createCloud(decor);
    if (decor.type === "flower") createFlowerPatch(decor);
    if (decor.type === "flag") createFlag(decor);
    if (decor.type === "arch") createArch(decor);
  }
  for (const enemy of ENEMIES) createEnemy(enemy);
}

buildWorld();

function createJoystick(root) {
  const knob = root.querySelector(".stick-knob");
  const value = { x: 0, y: 0, active: false };
  let pointerId = null;

  function setKnob(x, y) {
    knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }

  function update(event) {
    const rect = root.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const max = Math.min(rect.width, rect.height) * 0.34;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const length = Math.hypot(dx, dy);
    const scale = length > max ? max / length : 1;
    const x = dx * scale;
    const y = dy * scale;
    value.x = x / max;
    value.y = y / max;
    setKnob(x, y);
  }

  root.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    value.active = true;
    root.setPointerCapture(pointerId);
    update(event);
  });

  root.addEventListener("pointermove", (event) => {
    if (event.pointerId === pointerId) update(event);
  });

  function release(event) {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    value.x = 0;
    value.y = 0;
    value.active = false;
    setKnob(0, 0);
  }

  root.addEventListener("pointerup", release);
  root.addEventListener("pointercancel", release);
  return value;
}

const moveStick = createJoystick(ui.moveStick);
const cameraStick = createJoystick(ui.cameraStick);

function queueJump() {
  player.jumpQueued = true;
  player.jumpBuffer = 0.16;
}

window.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (event.code === "Space") {
    event.preventDefault();
    queueJump();
  }
  if (event.code === "KeyP") togglePause();
  if (event.code === "KeyR") resetRun(true);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

ui.jumpTouch.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  queueJump();
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse" || event.button !== 0 || !game.running || game.paused) return;
  cameraState.mouseActive = true;
  cameraState.pointerId = event.pointerId;
  cameraState.lastX = event.clientX;
  cameraState.lastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!cameraState.mouseActive || event.pointerId !== cameraState.pointerId) return;
  const dx = event.clientX - cameraState.lastX;
  const dy = event.clientY - cameraState.lastY;
  cameraState.lastX = event.clientX;
  cameraState.lastY = event.clientY;
  cameraState.yaw -= dx * 0.0065;
  cameraState.pitch = clamp(cameraState.pitch + dy * 0.0038, 0.18, 0.88);
  cameraState.manualTimer = 1.6;
});

function stopMouseCamera(event) {
  if (event.pointerId !== cameraState.pointerId) return;
  cameraState.mouseActive = false;
  cameraState.pointerId = null;
}

canvas.addEventListener("pointerup", stopMouseCamera);
canvas.addEventListener("pointercancel", stopMouseCamera);

function getMoveInput() {
  let x = 0;
  let y = 0;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
  if (keys.has("KeyW") || keys.has("ArrowUp")) y += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) y -= 1;
  x += moveStick.x;
  y += -moveStick.y;
  return normalizeInput(x, y);
}

function updateMovingPlatforms(totalTime) {
  for (const solid of movingSolids) {
    const oldX = solid.x;
    const oldY = solid.y;
    const oldZ = solid.z;
    const move = Math.sin(totalTime * solid.moving.speed) * solid.moving.distance;
    solid.x = solid.baseX;
    solid.y = solid.baseY;
    solid.z = solid.baseZ;
    if (solid.moving.axis === "x") solid.x += move;
    if (solid.moving.axis === "y") solid.y += move;
    if (solid.moving.axis === "z") solid.z += move;
    solid.deltaX = solid.x - oldX;
    solid.deltaY = solid.y - oldY;
    solid.deltaZ = solid.z - oldZ;
    solid.mesh.position.set(solid.x, solid.y, solid.z);
    solid.edge.position.copy(solid.mesh.position);
    solid.skirt.position.x = solid.x;
    solid.skirt.position.z = solid.z;
    solid.skirt.position.y = solid.y - solid.h * 0.5 - Math.max(solid.w, solid.d) * 0.08;
  }
}

function resolveHorizontal() {
  for (const solid of solids) {
    const top = topOf(solid);
    const bottom = bottomOf(solid);
    if (player.pos.y < bottom - 0.1 || player.pos.y > top + PLAYER_HEIGHT * 0.85) continue;
    if (player.pos.y >= top - 0.04) continue;

    const dx = player.pos.x - solid.x;
    const dz = player.pos.z - solid.z;
    const overlapX = solid.w * 0.5 + PLAYER_RADIUS - Math.abs(dx);
    const overlapZ = solid.d * 0.5 + PLAYER_RADIUS - Math.abs(dz);
    if (overlapX <= 0 || overlapZ <= 0) continue;

    if (overlapX < overlapZ) {
      player.pos.x += dx < 0 ? -overlapX : overlapX;
      player.vel.x = 0;
    } else {
      player.pos.z += dz < 0 ? -overlapZ : overlapZ;
      player.vel.z = 0;
    }
  }
}

function resolveVertical(previousY) {
  const wasGrounded = player.grounded;
  const previousGround = player.groundSolid;
  player.grounded = false;
  player.groundSolid = null;

  let bestTop = -Infinity;
  let bestSolid = null;
  for (const solid of solids) {
    const top = topOf(solid);
    const insideX = Math.abs(player.pos.x - solid.x) <= solid.w * 0.5 + PLAYER_RADIUS * 0.72;
    const insideZ = Math.abs(player.pos.z - solid.z) <= solid.d * 0.5 + PLAYER_RADIUS * 0.72;
    if (!insideX || !insideZ) continue;
    if (player.vel.y <= 0 && previousY >= top - 0.08 && player.pos.y <= top + 0.04 && top > bestTop) {
      bestTop = top;
      bestSolid = solid;
    }
  }

  if (bestSolid) {
    player.pos.y = bestTop;
    if (player.vel.y < -10) audio.play("land", 0.45);
    player.vel.y = 0;
    player.grounded = true;
    player.groundSolid = bestSolid;
    player.coyote = COYOTE_TIME;
    player.airJumpsUsed = 0;
    if (!wasGrounded || previousGround !== bestSolid) {
      updateCheckpoint(bestSolid);
    }
  }
}

function updateCheckpoint(solid) {
  if (solid.moving) return;
  if (player.pos.z < player.checkpoint.z - 8 || player.pos.y > player.checkpoint.y + 1.2) {
    player.checkpoint.set(player.pos.x, topOf(solid) + 0.18, player.pos.z);
  }
}

function updatePlayer(dt, move) {
  if (player.grounded && player.groundSolid) {
    player.pos.x += player.groundSolid.deltaX;
    player.pos.y += player.groundSolid.deltaY;
    player.pos.z += player.groundSolid.deltaZ;
  }

  player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  player.springCooldown = Math.max(0, player.springCooldown - dt);
  player.damageCooldown = Math.max(0, player.damageCooldown - dt);
  if (!player.grounded) {
    player.coyote = Math.max(0, player.coyote - dt);
  }

  tmpForward.set(-Math.sin(cameraState.yaw), 0, -Math.cos(cameraState.yaw));
  tmpRight.set(Math.cos(cameraState.yaw), 0, -Math.sin(cameraState.yaw));
  const desired = tmpVec.set(0, 0, 0);
  desired.addScaledVector(tmpRight, move.x);
  desired.addScaledVector(tmpForward, move.y);
  if (desired.lengthSq() > 1e-5) desired.normalize();

  const speed = player.grounded ? RUN_SPEED : AIR_SPEED;
  const accel = player.grounded ? ACCEL_GROUND : ACCEL_AIR;
  const targetX = desired.x * speed * move.length;
  const targetZ = desired.z * speed * move.length;

  player.vel.x = approach(player.vel.x, targetX, accel * dt);
  player.vel.z = approach(player.vel.z, targetZ, accel * dt);
  if (move.length < 0.05 && player.grounded) {
    player.vel.x = approach(player.vel.x, 0, FRICTION * dt);
    player.vel.z = approach(player.vel.z, 0, FRICTION * dt);
  }

  const canGroundJump = player.grounded || player.coyote > 0;
  const canDoubleJump = !canGroundJump && player.airJumpsUsed < MAX_AIR_JUMPS;
  if (player.jumpQueued && player.jumpBuffer > 0 && (canGroundJump || canDoubleJump)) {
    if (canDoubleJump) {
      player.airJumpsUsed += 1;
      player.vel.y = Math.max(player.vel.y, DOUBLE_JUMP_SPEED);
      player.vel.x += desired.x * 2.4;
      player.vel.z += desired.z * 2.4;
      spawnBurst(tmpVec2.set(player.pos.x, player.pos.y + 0.72, player.pos.z), 0x9ee8ff, 14);
      showToast("Double Jump");
    } else {
      player.vel.y = JUMP_SPEED;
      player.airJumpsUsed = 0;
    }
    player.grounded = false;
    player.groundSolid = null;
    player.coyote = 0;
    player.jumpQueued = false;
    player.jumpBuffer = 0;
    audio.play("jump", 0.48);
  }
  if (player.jumpBuffer <= 0) player.jumpQueued = false;

  player.vel.y = Math.max(MAX_FALL_SPEED, player.vel.y + GRAVITY * dt);

  const previousY = player.pos.y;
  player.pos.x += player.vel.x * dt;
  player.pos.z += player.vel.z * dt;
  resolveHorizontal();
  player.pos.y += player.vel.y * dt;
  resolveVertical(previousY);

  if (player.pos.y < RESPAWN_Y) {
    damagePlayer(new THREE.Vector3(0, 0, 1), true);
  }

  const horizontalSpeed = Math.hypot(player.vel.x, player.vel.z);
  if (horizontalSpeed > 0.18) {
    const desiredHeading = Math.atan2(-player.vel.x, -player.vel.z);
    player.heading = lerpAngle(player.heading, desiredHeading, 1 - Math.exp(-14 * dt));
  }

  playerGroup.position.copy(player.pos);
  playerGroup.rotation.y = player.heading;
  animatePlayer(dt, horizontalSpeed);
}

function animatePlayer(dt, horizontalSpeed) {
  const t = game.time * 11;
  const stride = Math.min(1, horizontalSpeed / RUN_SPEED);
  const shoeA = playerGroup.userData.shoeA;
  const shoeB = playerGroup.userData.shoeB;
  const armA = playerGroup.userData.armA;
  const armB = playerGroup.userData.armB;
  const swing = Math.sin(t) * 0.35 * stride;
  shoeA.position.z = -0.12 + swing * 0.18;
  shoeB.position.z = -0.12 - swing * 0.18;
  armA.rotation.x = swing;
  armB.rotation.x = -swing;

  const squash = player.grounded ? 1 : clamp(1 + player.vel.y * 0.015, 0.88, 1.12);
  playerGroup.scale.y = damp(playerGroup.scale.y, squash, 12, dt);
  playerGroup.scale.x = damp(playerGroup.scale.x, 1 + (1 - squash) * 0.25, 12, dt);
  playerGroup.scale.z = playerGroup.scale.x;
}

function updateSprings(dt) {
  for (const spring of springItems) {
    spring.cooldown = Math.max(0, spring.cooldown - dt);
    spring.group.rotation.y += dt * 0.75;
    const dx = player.pos.x - spring.x;
    const dz = player.pos.z - spring.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 1.05 && Math.abs(player.pos.y - spring.y) < 0.85 && spring.cooldown <= 0 && player.springCooldown <= 0) {
      player.vel.y = spring.power;
      player.grounded = false;
      player.groundSolid = null;
      player.coyote = 0;
      player.airJumpsUsed = 0;
      spring.cooldown = 0.65;
      player.springCooldown = 0.35;
      audio.play("bounce", 0.58);
      spawnBurst(spring.group.position, 0xffd166, 12);
    }
  }
}

function updateBoostRings(dt, active = true) {
  for (const ring of boostRingItems) {
    ring.cooldown = Math.max(0, ring.cooldown - dt);
    ring.group.rotation.z += dt * 1.6;
    ring.inner.rotation.z -= dt * 2.4;
    const pulse = 0.72 + Math.sin(game.time * 5 + ring.x) * 0.16;
    ring.ring.material.opacity = ring.cooldown > 0 ? 0.28 : 0.78 + pulse * 0.16;
    ring.group.scale.setScalar(ring.cooldown > 0 ? 0.86 : 1 + Math.sin(game.time * 4 + ring.z) * 0.035);

    const distance = ring.group.position.distanceTo(tmpVec.set(player.pos.x, player.pos.y + 0.85, player.pos.z));
    if (active && distance < 1.55 && ring.cooldown <= 0) {
      ring.cooldown = 1.25;
      player.vel.x += ring.forward.x * ring.power;
      player.vel.z += ring.forward.z * ring.power;
      player.vel.y = Math.max(player.vel.y, 8.8);
      player.airJumpsUsed = 0;
      game.coins += 1;
      audio.play("bounce", 0.58);
      spawnBurst(ring.group.position, 0x9ee8ff, 18);
      showToast("Sky Ring");
    }
  }
}

function updateCollectibles(dt) {
  for (const star of starItems) {
    if (star.collected) continue;
    star.group.rotation.y += dt * 2.2;
    star.group.rotation.x = Math.sin(game.time * 2.5 + star.x) * 0.18;
    star.group.position.y = star.y + Math.sin(game.time * 3 + star.z) * 0.12;
    const distance = star.group.position.distanceTo(tmpVec.set(player.pos.x, player.pos.y + 0.8, player.pos.z));
    if (distance < 1.2) {
      star.collected = true;
      star.group.visible = false;
      game.stars += 1;
      audio.play("star", 0.78);
      spawnBurst(star.group.position, 0xffd166, 22);
      showToast(game.stars >= LEVEL_TARGET_STARS ? "Himmelstor offen" : "Sternsplitter");
    }
  }

  for (const coin of coinItems) {
    if (coin.collected) continue;
    coin.mesh.rotation.y += dt * 4.4;
    coin.mesh.rotation.x = Math.PI / 2 + Math.sin(game.time * 3.1 + coin.x) * 0.2;
    coin.mesh.position.y = coin.y + Math.sin(game.time * 4 + coin.z) * 0.08;
    const distance = coin.mesh.position.distanceTo(tmpVec.set(player.pos.x, player.pos.y + 0.72, player.pos.z));
    if (distance < 0.85) {
      coin.collected = true;
      coin.mesh.visible = false;
      game.coins += 1;
      audio.play("pickup", 0.42);
      spawnBurst(coin.mesh.position, 0xfff0a4, 8);
    }
  }
}

function updateEnemies(dt) {
  for (const enemy of enemyItems) {
    if (enemy.defeated) continue;
    enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);
    enemy.angle += dt * enemy.speed;

    const toPlayer = tmpVec.set(player.pos.x - enemy.group.position.x, 0, player.pos.z - enemy.group.position.z);
    const distToPlayer = toPlayer.length();
    let targetX = enemy.baseX + Math.cos(enemy.angle) * enemy.radius;
    let targetZ = enemy.baseZ + Math.sin(enemy.angle * 0.8) * enemy.radius;
    if (distToPlayer < 8.5) {
      targetX = damp(targetX, player.pos.x, 1.6, dt);
      targetZ = damp(targetZ, player.pos.z, 1.6, dt);
    }

    enemy.group.position.x = damp(enemy.group.position.x, targetX, 3.1, dt);
    enemy.group.position.z = damp(enemy.group.position.z, targetZ, 3.1, dt);
    enemy.group.position.y = enemy.y + Math.abs(Math.sin(enemy.angle * 2.2)) * 0.18;
    enemy.group.rotation.y = Math.atan2(enemy.group.position.x - player.pos.x, enemy.group.position.z - player.pos.z);

    const dx = player.pos.x - enemy.group.position.x;
    const dz = player.pos.z - enemy.group.position.z;
    const dist = Math.hypot(dx, dz);
    const dy = player.pos.y - enemy.group.position.y;
    if (dist < 1.05 && Math.abs(dy) < 1.35) {
      if (player.vel.y < -2 && dy > 0.35) {
        enemy.defeated = true;
        enemy.group.visible = false;
        player.vel.y = 8.6;
        player.airJumpsUsed = 0;
        game.coins += 3;
        audio.play("bounce", 0.7);
        spawnBurst(enemy.group.position, 0xf1725f, 16);
        showToast("Treffer");
      } else if (enemy.hitCooldown <= 0) {
        enemy.hitCooldown = 1.2;
        tmpVec2.set(dx, 0, dz);
        if (tmpVec2.lengthSq() < 0.01) tmpVec2.set(0, 0, 1);
        tmpVec2.normalize();
        damagePlayer(tmpVec2, false);
      }
    }
  }
}

function damagePlayer(direction, hardReset) {
  if (!hardReset && player.damageCooldown > 0) return;
  player.damageCooldown = 1.1;
  player.health -= hardReset ? 1 : 1;
  player.vel.x = direction.x * 7.5;
  player.vel.z = direction.z * 7.5;
  player.vel.y = 6.5;
  audio.play("hurt", 0.62);
  spawnBurst(tmpVec.set(player.pos.x, player.pos.y + 0.8, player.pos.z), 0xf1725f, 10);

  if (hardReset || player.health <= 0) {
    if (player.health <= 0) player.health = 3;
    respawnPlayer();
  }
}

function respawnPlayer() {
  player.pos.copy(player.checkpoint);
  player.pos.y += 0.45;
  player.vel.set(0, 1, 0);
  player.grounded = false;
  player.groundSolid = null;
  player.coyote = 0;
  player.airJumpsUsed = 0;
  player.airJumpsUsed = 0;
}

function updateGoal(dt) {
  const portal = scene.userData.portal;
  if (!portal) return;
  const open = game.stars >= LEVEL_TARGET_STARS;
  portal.traverse((child) => {
    if (child.isMesh) child.material = open ? materials.portalOpen : materials.portalClosed;
  });
  portal.rotation.y = Math.sin(game.time * 0.8) * 0.08;

  const distance = Math.hypot(player.pos.x - GOAL.x, player.pos.z - GOAL.z);
  if (open && !game.completed && distance < 2.8 && Math.abs(player.pos.y - GOAL.y) < 2.2) {
    finishRun();
  }

  if (open) {
    spawnAmbientPortalSpark(dt, portal.position);
  }
}

function spawnAmbientPortalSpark(dt, origin) {
  if (Math.random() > dt * 7) return;
  const pos = tmpVec.set(
    origin.x + (Math.random() - 0.5) * 4,
    origin.y + 1 + Math.random() * 2.4,
    origin.z + (Math.random() - 0.5) * 0.6,
  );
  spawnParticle(pos, 0xffd166, new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 1.4, (Math.random() - 0.5) * 0.8), 0.7, 0.07);
}

function spawnParticle(position, color, velocity, life, size) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(size, 8, 6),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
  );
  mesh.position.copy(position);
  scene.add(mesh);
  particles.push({ mesh, velocity: velocity.clone(), life, maxLife: life });
}

function spawnBurst(position, color, count) {
  const origin = position.clone();
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * TAU;
    const speed = 1.6 + Math.random() * 3.4;
    const velocity = new THREE.Vector3(
      Math.cos(angle) * speed,
      1.4 + Math.random() * 3,
      Math.sin(angle) * speed,
    );
    spawnParticle(origin, color, velocity, 0.55 + Math.random() * 0.45, 0.055 + Math.random() * 0.04);
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.life -= dt;
    particle.velocity.y += GRAVITY * 0.22 * dt;
    particle.mesh.position.addScaledVector(particle.velocity, dt);
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    particle.mesh.material.opacity = alpha;
    particle.mesh.scale.setScalar(0.5 + alpha * 0.8);
    if (particle.life <= 0) {
      scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      particle.mesh.material.dispose();
      particles.splice(i, 1);
    }
  }
}

function updateCamera(dt, move) {
  if (cameraStick.active || Math.abs(cameraStick.x) > 0.04 || Math.abs(cameraStick.y) > 0.04) {
    cameraState.yaw -= cameraStick.x * 2.45 * dt;
    cameraState.pitch = clamp(cameraState.pitch + cameraStick.y * 1.28 * dt, 0.18, 0.88);
    cameraState.manualTimer = 1.4;
  } else {
    cameraState.manualTimer = Math.max(0, cameraState.manualTimer - dt);
  }

  const horizontalSpeed = Math.hypot(player.vel.x, player.vel.z);
  if (cameraState.manualTimer <= 0 && move.length > 0.2 && horizontalSpeed > 0.5) {
    const desiredDirection = tmpVec.set(player.vel.x, 0, player.vel.z).normalize();
    const desiredYaw = Math.atan2(-desiredDirection.x, -desiredDirection.z);
    cameraState.yaw = lerpAngle(cameraState.yaw, desiredYaw, 1 - Math.exp(-1.6 * dt));
  }

  const targetDistance = 9.2 + clamp(horizontalSpeed / RUN_SPEED, 0, 1) * 1.8;
  cameraState.distance = damp(cameraState.distance, targetDistance, 2.5, dt);
  const target = tmpVec.set(player.pos.x, player.pos.y + 1.15, player.pos.z);
  const horizontal = Math.cos(cameraState.pitch) * cameraState.distance;
  const offset = tmpVec2.set(
    Math.sin(cameraState.yaw) * horizontal,
    Math.sin(cameraState.pitch) * cameraState.distance + 1.6,
    Math.cos(cameraState.yaw) * horizontal,
  );
  const ideal = target.clone().add(offset);
  camera.position.lerp(ideal, 1 - Math.exp(-8 * dt));
  camera.lookAt(target);
}

function updateHud() {
  ui.starText.textContent = `${game.stars}/${LEVEL_TARGET_STARS}`;
  ui.coinText.textContent = String(game.coins);
  const jumpsReady = player.grounded ? 2 : Math.max(0, 1 - player.airJumpsUsed);
  ui.jumpText.textContent = `${jumpsReady}/2`;
  ui.timeText.textContent = formatTime(game.time);
  for (let i = 0; i < ui.health.length; i += 1) {
    ui.health[i].classList.toggle("empty", i >= player.health);
  }
  const left = LEVEL_TARGET_STARS - game.stars;
  ui.objectiveText.textContent = game.completed
    ? "Geschafft"
    : left <= 0
      ? "Himmelstor offen"
      : `${left} Sterne fehlen`;

}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function showToast(text) {
  ui.toast.textContent = text;
  ui.toast.classList.remove("hidden");
  game.toastTimer = 1.6;
}

function updateToast(dt) {
  if (game.toastTimer <= 0) return;
  game.toastTimer -= dt;
  if (game.toastTimer <= 0) {
    ui.toast.classList.add("hidden");
  }
}

function resetRun(keepRunning = false) {
  game.completed = false;
  game.paused = false;
  game.time = 0;
  game.stars = 0;
  game.coins = 0;
  player.health = 3;
  player.pos.set(START.x, START.y, START.z);
  player.vel.set(0, 0, 0);
  player.heading = Math.PI;
  player.checkpoint.set(START.x, START.y, START.z);
  player.grounded = false;
  player.groundSolid = null;
  player.coyote = 0;
  cameraState.yaw = Math.PI;
  cameraState.pitch = 0.48;
  cameraState.distance = 10.5;
  camera.position.set(0, 8, 12);

  for (const star of starItems) {
    star.collected = false;
    star.group.visible = true;
  }
  for (const coin of coinItems) {
    coin.collected = false;
    coin.mesh.visible = true;
  }
  for (const enemy of enemyItems) {
    enemy.defeated = false;
    enemy.group.visible = true;
    enemy.group.position.set(enemy.x, enemy.y, enemy.z);
  }
  for (const ring of boostRingItems) {
    ring.cooldown = 0;
    ring.group.scale.setScalar(1);
    ring.ring.material.opacity = 0.86;
  }

  ui.finish.classList.add("hidden");
  ui.menu.classList.toggle("hidden", keepRunning);
  game.running = keepRunning;
  syncPauseButton();
  updateHud();
  if (audio.enabled && game.running) audio.bgm.play().catch(() => {});
}

function startGame() {
  resetRun(true);
  game.running = true;
  ui.menu.classList.add("hidden");
  if (!audio.enabled && !mutedByUrl) audio.setEnabled(true);
}

function finishRun() {
  game.completed = true;
  game.running = false;
  ui.finishTitle.textContent = "Geschafft";
  ui.finishStats.textContent = `${game.stars} Sterne, ${game.coins} Muenzen, ${formatTime(game.time)}`;
  ui.finish.classList.remove("hidden");
  audio.bgm.pause();
  audio.play("win", 0.82);
}

function togglePause() {
  if (!game.running || game.completed) return;
  game.paused = !game.paused;
  syncPauseButton();
  if (audio.enabled) {
    if (game.paused) audio.bgm.pause();
    else audio.bgm.play().catch(() => {});
  }
}

function syncPauseButton() {
  ui.pauseButton.textContent = game.paused ? "Weiter" : "Pause";
}

ui.startButton.addEventListener("click", startGame);
ui.againButton.addEventListener("click", startGame);
ui.resetButton.addEventListener("click", () => resetRun(true));
ui.pauseButton.addEventListener("click", togglePause);
ui.soundButton.addEventListener("click", () => audio.setEnabled(!audio.enabled));
ui.menuSoundButton.addEventListener("click", () => audio.setEnabled(!audio.enabled));

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();
syncSoundButtons();
resetRun(false);

function frame() {
  requestAnimationFrame(frame);
  const rawDt = Math.min(0.05, clock.getDelta());
  const dt = rawDt || 0.016;

  const water = scene.userData.water;
  if (water?.material?.map) {
    water.material.map.offset.x += dt * 0.015;
    water.material.map.offset.y += dt * 0.011;
  }

  if (game.running && !game.paused && !game.completed) {
    game.time += dt;
    updateMovingPlatforms(game.time);
    const move = getMoveInput();
    updatePlayer(dt, move);
    updateSprings(dt);
    updateBoostRings(dt);
    updateCollectibles(dt);
    updateEnemies(dt);
    updateGoal(dt);
    updateParticles(dt);
    updateCamera(dt, move);
    updateToast(dt);
    updateHud();
  } else {
    updateMovingPlatforms(game.time);
    updateBoostRings(dt, false);
    updateParticles(dt);
    updateCamera(dt, { x: 0, y: 0, length: 0 });
    updateToast(dt);
    for (const star of starItems) {
      if (!star.collected) star.group.rotation.y += dt * 1.2;
    }
  }

  renderer.render(scene, camera);
}

frame();
