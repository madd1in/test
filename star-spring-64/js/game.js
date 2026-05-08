import * as THREE from "../assets/vendor/three.module.js";
import {
  BOOST_RINGS,
  COINS,
  DASH_PADS,
  DECOR,
  ENEMIES,
  GOAL,
  LEVEL_TARGET_STARS,
  PLATFORMS,
  PRISM_CHARMS,
  SPRINGS,
  START,
  STARS,
  WIND_COLUMNS,
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
  fullscreenButton: document.getElementById("fullscreenButton"),
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
const captureMode = urlParams.get("capture") === "1";
const qualityMode = urlParams.get("quality") || "auto";
const assistMode = urlParams.get("assist") !== "0";
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
const reducedGpuMode = qualityMode !== "high" && (coarsePointer || window.innerWidth < 760);
const maxPixelRatio = captureMode ? (reducedGpuMode ? 0.74 : 1.08) : qualityMode === "high" ? 1.45 : reducedGpuMode ? 0.72 : 1.05;
const enableDynamicLights = qualityMode === "high" || (!reducedGpuMode && window.innerWidth >= 900);
const enableShadows = qualityMode === "high" && !reducedGpuMode;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: captureMode,
  powerPreference: "high-performance",
});
let activePixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
renderer.setPixelRatio(activePixelRatio);
renderer.shadowMap.enabled = enableShadows;
renderer.shadowMap.type = THREE.PCFShadowMap;
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
const tmpVec3 = new THREE.Vector3();
const tmpForward = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const tmpColor = new THREE.Color();

const GRAVITY = -25;
const MAX_FALL_SPEED = -34;
const PLAYER_RADIUS = 0.46;
const PLAYER_HEIGHT = 1.55;
const RUN_SPEED = 9.4;
const AIR_SPEED = 8.6;
const ACCEL_GROUND = 38;
const ACCEL_AIR = 27;
const FRICTION = 13;
const JUMP_SPEED = 12.1;
const DOUBLE_JUMP_SPEED = 11.6;
const TRIPLE_JUMP_SPEED = 13.8;
const MAX_AIR_JUMPS = 2;
const COYOTE_TIME = 0.22;
const GLIDE_FALL_SPEED = reducedGpuMode ? -7.1 : -8.2;
const GLIDE_GRAVITY_SCALE = 0.34;
const STAR_MAGNET_RANGE = assistMode ? 3.4 : 0;
const COIN_MAGNET_RANGE = assistMode ? 4.8 : 0;
const ASSIST_LEDGE_MARGIN = assistMode ? PLAYER_RADIUS * 2.35 : PLAYER_RADIUS * 1.2;
const ASSIST_STEP_UP_HEIGHT = assistMode ? 0.85 : 0.14;
const ASSIST_LANDING_GRACE = assistMode ? 1.15 : 0.12;
const ASSIST_RESCUE_DROP = assistMode ? 18.5 : 2.35;
const ASSIST_RESCUE_DELAY = assistMode ? 0.72 : 0;
const RESPAWN_Y = -28;
const TAU = Math.PI * 2;

const solids = [];
const movingSolids = [];
const starItems = [];
const coinItems = [];
const prismCharmItems = [];
const springItems = [];
const dashPadItems = [];
const boostRingItems = [];
const windColumnItems = [];
const enemyItems = [];
const particles = [];
const keys = new Set();
const MAX_PARTICLES = reducedGpuMode ? 58 : 96;
const particleGeometry = new THREE.SphereGeometry(1, 6, 4);
const perf = {
  elapsed: 0,
  samples: 0,
  totalDt: 0,
  adjusted: false,
};

const player = {
  pos: new THREE.Vector3(START.x, START.y, START.z),
  vel: new THREE.Vector3(),
  heading: Math.PI,
  grounded: false,
  groundSolid: null,
  coyote: 0,
  jumpQueued: false,
  jumpHeld: false,
  jumpBuffer: 0,
  airJumpsUsed: 0,
  springCooldown: 0,
  damageCooldown: 0,
  fallRescueTimer: 0,
  glideSparkTimer: 0,
  prismShield: 0,
  gliding: false,
  health: 3,
  checkpoint: new THREE.Vector3(START.x, START.y, START.z),
  checkpointLocal: new THREE.Vector3(),
  checkpointSolid: null,
  checkpointId: "start",
};

const game = {
  running: false,
  paused: false,
  completed: false,
  time: 0,
  stars: 0,
  coins: 0,
  toastTimer: 0,
  hudTimer: 0,
  checkpointPulse: 0,
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
  heroBadge: new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.32, emissive: 0x5a3400, emissiveIntensity: 0.18 }),
  heroCape: new THREE.MeshStandardMaterial({ color: 0x79d4a8, roughness: 0.54, emissive: 0x06311e, emissiveIntensity: 0.08, side: THREE.DoubleSide }),
  shoe: new THREE.MeshStandardMaterial({ color: 0x27313a, roughness: 0.7 }),
  glove: new THREE.MeshStandardMaterial({ color: 0xfff8e8, roughness: 0.62 }),
  belt: new THREE.MeshStandardMaterial({ color: 0x17232c, roughness: 0.58 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x5b3928, roughness: 0.72 }),
  cheek: new THREE.MeshStandardMaterial({ color: 0xf49b8d, roughness: 0.7, transparent: true, opacity: 0.72 }),
  heroAccent: new THREE.MeshStandardMaterial({ color: 0x79d4a8, roughness: 0.5, emissive: 0x052c1a, emissiveIntensity: 0.06 }),
  prismCharm: new THREE.MeshStandardMaterial({
    color: 0xd8fbff,
    roughness: 0.25,
    metalness: 0.06,
    emissive: 0x2ad6ff,
    emissiveIntensity: 0.45,
  }),
  prismAura: new THREE.MeshBasicMaterial({
    color: 0xd8fbff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  }),
  mouth: new THREE.MeshBasicMaterial({ color: 0x5b3928 }),
  eye: new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.4 }),
  enemy: materialFromTexture("enemy_skin", 0xffffff, 1, 1, { roughness: 0.66 }),
  enemyAccent: new THREE.MeshStandardMaterial({ color: 0x6a5cff, roughness: 0.54, emissive: 0x130a47, emissiveIntensity: 0.16 }),
  enemyBlush: new THREE.MeshStandardMaterial({ color: 0xff9aa2, roughness: 0.62, transparent: true, opacity: 0.72 }),
  snapStem: new THREE.MeshStandardMaterial({ color: 0x1f8b5d, roughness: 0.72 }),
  snapHead: new THREE.MeshStandardMaterial({ color: 0xf1725f, roughness: 0.62, emissive: 0x2a0500, emissiveIntensity: 0.08 }),
  snapSpot: new THREE.MeshStandardMaterial({ color: 0xfff7ad, roughness: 0.5, emissive: 0x3a2200, emissiveIntensity: 0.06 }),
  snapMouth: new THREE.MeshBasicMaterial({ color: 0x180c12, side: THREE.DoubleSide }),
  tooth: new THREE.MeshStandardMaterial({ color: 0xfff4d5, roughness: 0.5 }),
  pipe: new THREE.MeshStandardMaterial({ color: 0x2dbf83, roughness: 0.42, metalness: 0.02, emissive: 0x063b23, emissiveIntensity: 0.06 }),
  pipeDark: new THREE.MeshBasicMaterial({ color: 0x0d4a35 }),
  crusher: new THREE.MeshStandardMaterial({ color: 0x8a96a1, roughness: 0.9, metalness: 0.02 }),
  crusherFace: new THREE.MeshBasicMaterial({ color: 0x2e3b44 }),
  rocket: new THREE.MeshStandardMaterial({ color: 0x202b34, roughness: 0.45, metalness: 0.12 }),
  rocketNose: new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.38, emissive: 0x4a2500, emissiveIntensity: 0.12 }),
  rocketFin: new THREE.MeshStandardMaterial({ color: 0xf1725f, roughness: 0.42, emissive: 0x3a0800, emissiveIntensity: 0.1 }),
  rocketFlame: new THREE.MeshBasicMaterial({ color: 0xf1725f, transparent: true, opacity: 0.88 }),
  spinnerCore: new THREE.MeshStandardMaterial({ color: 0x6a5cff, roughness: 0.38, emissive: 0x171064, emissiveIntensity: 0.28 }),
  spinnerSpark: new THREE.MeshBasicMaterial({ color: 0x9ee8ff, transparent: true, opacity: 0.86 }),
  dashPad: new THREE.MeshStandardMaterial({ color: 0x243f5c, roughness: 0.34, metalness: 0.08, emissive: 0x092843, emissiveIntensity: 0.18 }),
  dashArrow: new THREE.MeshBasicMaterial({ color: 0xfff7ad, transparent: true, opacity: 0.9 }),
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
  lanternGlow: new THREE.MeshBasicMaterial({ color: 0xfff7ad, transparent: true, opacity: 0.82 }),
  boostRing: new THREE.MeshStandardMaterial({
    color: 0x9ee8ff,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0x20d6ff,
    emissiveIntensity: 0.82,
    transparent: true,
    opacity: 0.86,
  }),
  guide: new THREE.MeshBasicMaterial({
    color: 0xfff7ad,
    transparent: true,
    opacity: 0.84,
    depthWrite: false,
    fog: false,
  }),
  guideCore: new THREE.MeshBasicMaterial({
    color: 0x79d4a8,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    fog: false,
  }),
  checkpoint: new THREE.MeshBasicMaterial({
    color: 0x79d4a8,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
    fog: false,
  }),
  checkpointCore: new THREE.MeshBasicMaterial({
    color: 0xfff7ad,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    fog: false,
  }),
  glideWing: new THREE.MeshBasicMaterial({
    color: 0xfff7ad,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  }),
  wind: new THREE.MeshBasicMaterial({
    color: 0xd8fbff,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  crystal: new THREE.MeshStandardMaterial({
    color: 0x8df4ff,
    roughness: 0.22,
    metalness: 0.04,
    emissive: 0x1166aa,
    emissiveIntensity: 0.36,
  }),
  blobShadow: new THREE.MeshBasicMaterial({
    color: 0x1f3a36,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
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
  sun.castShadow = enableShadows;
  sun.shadow.mapSize.set(reducedGpuMode ? 512 : 1024, reducedGpuMode ? 512 : 1024);
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
  const skyGeometry = new THREE.SphereGeometry(120, reducedGpuMode ? 20 : 32, reducedGpuMode ? 10 : 18);
  const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0xd7f7ff,
    side: THREE.BackSide,
    fog: false,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.position.set(0, 15, -48);
  scene.add(sky);

  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(8, reducedGpuMode ? 28 : 48),
    new THREE.MeshBasicMaterial({ color: 0xfff2a6, transparent: true, opacity: 0.86, fog: false }),
  );
  sun.position.set(-54, 56, -100);
  sun.lookAt(0, 12, -44);
  scene.add(sun);

  const horizon = new THREE.Mesh(
    new THREE.RingGeometry(66, 70, reducedGpuMode ? 56 : 96),
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
  mesh.castShadow = enableShadows;
  mesh.receiveShadow = enableShadows;
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
  skirt.castShadow = enableShadows;
  skirt.receiveShadow = enableShadows;
  scene.add(skirt);

  const solid = {
    ...def,
    mesh,
    edge,
    skirt,
    routeIndex: solids.length,
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
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.08, reducedGpuMode ? 8 : 14, reducedGpuMode ? 32 : 56), ringMaterial);
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.025, 6, reducedGpuMode ? 24 : 44),
    new THREE.MeshBasicMaterial({ color: 0xfff7ad, transparent: true, opacity: 0.78 }),
  );
  ring.castShadow = enableShadows;
  group.add(ring, inner);
  if (enableDynamicLights) {
    const light = new THREE.PointLight(0x79e9ff, 0.55, 6);
    group.add(light);
  }
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

function createWindColumn(def) {
  const group = new THREE.Group();
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(def.radius, def.radius * 0.74, def.height, reducedGpuMode ? 16 : 28, 1, true),
    materials.wind.clone(),
  );
  column.position.y = def.height * 0.5;
  const rings = [];
  const ringCount = reducedGpuMode ? 3 : 4;
  for (let i = 0; i < ringCount; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(def.radius * (0.72 + i * 0.07), 0.025, 6, reducedGpuMode ? 24 : 36),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? 0xffffff : 0x9ee8ff,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
      }),
    );
    ring.position.y = 0.8 + i * (def.height - 1.6) / Math.max(1, ringCount - 1);
    ring.rotation.x = Math.PI / 2;
    rings.push(ring);
    group.add(ring);
  }
  group.add(column);
  group.position.set(def.x, def.y, def.z);
  scene.add(group);
  windColumnItems.push({ ...def, group, column, rings, cooldown: 0 });
}

function createSpring(def) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.26, reducedGpuMode ? 20 : 32), materials.springSide);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.94, 1.02, 0.12, reducedGpuMode ? 20 : 32), materials.springTop);
  top.position.y = 0.2;
  base.castShadow = enableShadows;
  top.castShadow = enableShadows;
  group.add(base, top);
  group.position.set(def.x, def.y + 0.13, def.z);
  scene.add(group);
  springItems.push({ ...def, group, cooldown: 0 });
}

function createDashPad(def) {
  const group = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.9, 0.1, reducedGpuMode ? 16 : 24), materials.dashPad);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.62, 3), materials.dashArrow.clone());
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.62), materials.dashArrow.clone());
  pad.position.y = 0.02;
  arrow.position.set(0, 0.105, -0.34);
  arrow.rotation.x = -Math.PI / 2;
  tail.position.set(0, 0.105, 0.18);
  group.add(pad, tail, arrow);
  group.position.set(def.x, def.y, def.z);
  group.rotation.y = def.yaw ?? Math.PI;
  scene.add(group);
  dashPadItems.push({
    ...def,
    group,
    pad,
    arrow,
    tail,
    cooldown: 0,
    forward: new THREE.Vector3(Math.sin(def.yaw ?? Math.PI), 0, Math.cos(def.yaw ?? Math.PI)).normalize(),
  });
}

function createStar(def) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, reducedGpuMode ? 0 : 1), materials.gold);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.055, reducedGpuMode ? 7 : 10, reducedGpuMode ? 20 : 32),
    new THREE.MeshStandardMaterial({
      color: 0xfff7ad,
      roughness: 0.3,
      emissive: 0xffb000,
      emissiveIntensity: 0.3,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  core.castShadow = enableShadows;
  group.add(core, ring);
  group.position.set(def.x, def.y, def.z);
  scene.add(group);
  starItems.push({ ...def, group, collected: false });
}

function createCoin(def, index) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.075, reducedGpuMode ? 7 : 10, reducedGpuMode ? 18 : 28),
    new THREE.MeshStandardMaterial({
      color: 0xffd166,
      roughness: 0.25,
      metalness: 0.08,
      emissive: 0x5c3500,
      emissiveIntensity: 0.15,
    }),
  );
  mesh.position.set(def.x, def.y, def.z);
  mesh.castShadow = enableShadows;
  scene.add(mesh);
  coinItems.push({ ...def, id: `coin-${index}`, mesh, collected: false });
}

function createPrismCharm(def) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), materials.prismCharm);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.036, reducedGpuMode ? 6 : 8, reducedGpuMode ? 18 : 28),
    new THREE.MeshBasicMaterial({
      color: 0xd8fbff,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      fog: false,
    }),
  );
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.66, 0.018, 5, reducedGpuMode ? 20 : 32),
    materials.prismAura.clone(),
  );
  ring.rotation.x = Math.PI / 2;
  halo.rotation.y = Math.PI / 2;
  core.castShadow = enableShadows;
  group.add(core, ring, halo);
  group.position.set(def.x, def.y, def.z);
  scene.add(group);
  prismCharmItems.push({ ...def, group, core, ring, halo, collected: false });
}

function createTree(def) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.3, reducedGpuMode ? 7 : 10), materials.trunk);
  trunk.position.y = 0.65 * def.scale;
  trunk.scale.setScalar(def.scale);
  trunk.castShadow = enableShadows;
  const leafA = new THREE.Mesh(new THREE.SphereGeometry(0.9, reducedGpuMode ? 10 : 16, reducedGpuMode ? 8 : 12), materials.leaf);
  leafA.position.y = 1.55 * def.scale;
  leafA.scale.set(1.1 * def.scale, 0.9 * def.scale, 1.1 * def.scale);
  leafA.castShadow = enableShadows;
  group.add(trunk, leafA);
  if (!reducedGpuMode) {
    const leafB = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), materials.leaf);
    leafB.position.set(0.45 * def.scale, 1.95 * def.scale, -0.18 * def.scale);
    leafB.scale.setScalar(def.scale);
    leafB.castShadow = enableShadows;
    group.add(leafB);
  }
  group.position.set(def.x, def.y, def.z);
  scene.add(group);
}

function createCloud(def) {
  const group = new THREE.Group();
  const parts = (reducedGpuMode ? [
    [-0.35, 0.12, 0, 0.95],
    [0.55, -0.04, 0.04, 0.72],
  ] : [
    [-0.9, 0, 0, 0.75],
    [-0.2, 0.18, 0, 0.95],
    [0.62, 0, 0.04, 0.72],
    [1.12, -0.07, -0.02, 0.48],
  ]);
  for (const [x, y, z, size] of parts) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(size, reducedGpuMode ? 10 : 16, reducedGpuMode ? 7 : 10), materials.cloud);
    puff.position.set(x * def.scale, y * def.scale, z * def.scale);
    puff.scale.set(1.45 * def.scale, 0.62 * def.scale, 0.86 * def.scale);
    group.add(puff);
  }
  group.position.set(def.x, def.y, def.z);
  scene.add(group);
}

function createFlowerPatch(def) {
  const group = new THREE.Group();
  const offsets = (reducedGpuMode ? [
    [-0.45, -0.2],
    [0.25, 0.18],
    [0.0, 0.5],
  ] : [
    [-0.7, -0.35],
    [-0.25, 0.18],
    [0.2, -0.18],
    [0.65, 0.32],
    [0.0, 0.55],
  ]);
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
    if (child.isMesh) child.castShadow = enableShadows;
  });
  scene.add(group);
}

function createLantern(def) {
  const group = new THREE.Group();
  const scale = def.scale ?? 1;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * scale, 0.05 * scale, 1.4 * scale, 8), materials.flagPole);
  pole.position.y = 0.7 * scale;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7 * scale, 0.045 * scale, 0.045 * scale), materials.flagPole);
  arm.position.set(0.24 * scale, 1.32 * scale, 0);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2 * scale, reducedGpuMode ? 10 : 16, reducedGpuMode ? 7 : 10), materials.lanternGlow.clone());
  bulb.position.set(0.58 * scale, 1.12 * scale, 0);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.48 * scale, reducedGpuMode ? 10 : 16, reducedGpuMode ? 7 : 10), materials.lanternGlow.clone());
  halo.position.copy(bulb.position);
  halo.material.opacity = reducedGpuMode ? 0.14 : 0.22;
  group.add(pole, arm, halo, bulb);
  if (enableDynamicLights) {
    const light = new THREE.PointLight(0xffe7a0, 0.42, 6);
    light.position.copy(bulb.position);
    group.add(light);
  }
  group.position.set(def.x, def.y, def.z);
  group.rotation.y = def.yaw ?? 0;
  scene.add(group);
}

function createCrystal(def) {
  const group = new THREE.Group();
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), materials.crystal);
  crystal.position.y = 0.65 * def.scale;
  crystal.scale.set(0.7 * def.scale, 1.35 * def.scale, 0.7 * def.scale);
  crystal.castShadow = enableShadows;
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34 * def.scale, 0.44 * def.scale, 0.18 * def.scale, 6),
    materials.islandUnderside,
  );
  base.position.y = 0.09 * def.scale;
  base.castShadow = enableShadows;
  group.add(crystal, base);
  group.position.set(def.x, def.y, def.z);
  group.rotation.y = Math.sin(def.z) * 0.8;
  scene.add(group);
}

function createPipe(def) {
  const group = new THREE.Group();
  const height = def.height ?? 0.9;
  const radius = 0.52 * def.scale;
  const segments = reducedGpuMode ? 18 : 28;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.92, height, segments), materials.pipe);
  shaft.position.y = height * 0.5;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.18, radius * 1.18, 0.24 * def.scale, segments), materials.pipe);
  rim.position.y = height + 0.12 * def.scale;
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, 0.025, segments), materials.pipeDark);
  hole.position.y = height + 0.255 * def.scale;
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.19, 0.025 * def.scale, 6, reducedGpuMode ? 22 : 36), materials.heroAccent);
  stripe.position.y = height + 0.25 * def.scale;
  stripe.rotation.x = Math.PI / 2;
  group.add(shaft, rim, hole, stripe);
  group.position.set(def.x, def.y, def.z);
  group.rotation.y = def.yaw ?? 0;
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = enableShadows;
      child.receiveShadow = enableShadows;
    }
  });
  scene.add(group);
}

function createStoneCluster(def) {
  const group = new THREE.Group();
  const offsets = [
    [-0.35, 0, 0, 0.42],
    [0.24, 0.03, -0.18, 0.34],
    [0.08, 0.18, 0.28, 0.28],
  ];
  for (const [x, y, z, size] of offsets) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size * def.scale, 0), materials.crusher);
    rock.position.set(x * def.scale, y * def.scale + size * def.scale * 0.55, z * def.scale);
    rock.rotation.set(Math.sin(x * 7), Math.sin(z * 5), Math.cos((x + z) * 3));
    rock.castShadow = enableShadows;
    rock.receiveShadow = enableShadows;
    group.add(rock);
  }
  group.position.set(def.x, def.y, def.z);
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
      child.castShadow = enableShadows;
      child.receiveShadow = enableShadows;
    }
  });
  scene.add(group);
  scene.userData.portal = group;
}

function createSkyRibbon(def) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(def.w ?? 30, def.h ?? 3, 3, 1),
    new THREE.MeshBasicMaterial({
      color: def.color ?? 0x9ee8ff,
      transparent: true,
      opacity: reducedGpuMode ? 0.11 : 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    }),
  );
  mesh.position.set(def.x, def.y, def.z);
  mesh.rotation.set(def.pitch ?? -0.12, def.yaw ?? 0, def.roll ?? 0);
  scene.add(mesh);
}

function createEnemy(def) {
  const type = def.type || "bouncer";
  if (type === "snapFlower") {
    createSnapFlowerEnemy(def);
    return;
  }
  if (type === "crusher") {
    createCrusherEnemy(def);
    return;
  }
  if (type === "rocket") {
    createRocketEnemy(def);
    return;
  }
  if (type === "spinner") {
    createSpinnerEnemy(def);
    return;
  }
  createBouncerEnemy(def);
}

function createBouncerEnemy(def) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, reducedGpuMode ? 16 : 24, reducedGpuMode ? 10 : 16), materials.enemy);
  body.scale.set(1, 0.78, 1);
  body.position.y = 0.52;
  body.castShadow = enableShadows;

  const eyeA = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), materials.eye);
  const eyeB = eyeA.clone();
  eyeA.position.set(-0.18, 0.66, -0.5);
  eyeB.position.set(0.18, 0.66, -0.5);
  const glintA = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), materials.tooth);
  const glintB = glintA.clone();
  glintA.position.set(-0.2, 0.69, -0.56);
  glintB.position.set(0.16, 0.69, -0.56);
  const blushA = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 5), materials.enemyBlush);
  const blushB = blushA.clone();
  blushA.position.set(-0.31, 0.49, -0.5);
  blushB.position.set(0.31, 0.49, -0.5);
  blushA.scale.set(1.35, 0.42, 0.28);
  blushB.scale.copy(blushA.scale);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, reducedGpuMode ? 8 : 12), materials.enemyAccent);
  crest.position.set(0, 1.0, -0.06);
  crest.rotation.x = -0.22;

  const footMaterial = new THREE.MeshStandardMaterial({ color: 0x4e2d77, roughness: 0.66 });
  const footA = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), footMaterial);
  const footB = footA.clone();
  footA.position.set(-0.32, 0.12, -0.18);
  footB.position.set(0.32, 0.12, -0.18);
  footA.scale.set(1.4, 0.45, 0.8);
  footB.scale.copy(footA.scale);
  group.add(body, eyeA, eyeB, crest, footA, footB);
  if (!reducedGpuMode) group.add(glintA, glintB, blushA, blushB);
  group.position.set(def.x, def.y, def.z);
  scene.add(group);

  enemyItems.push({
    ...def,
    type: "bouncer",
    group,
    baseX: def.x,
    baseY: def.y,
    baseZ: def.z,
    angle: Math.random() * TAU,
    defeated: false,
    hitCooldown: 0,
  });
}

function createSnapFlowerEnemy(def) {
  const group = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.4, reducedGpuMode ? 8 : 12), materials.snapStem);
  stem.position.y = 0.78;
  stem.castShadow = enableShadows;
  const leafA = new THREE.Mesh(new THREE.SphereGeometry(0.22, reducedGpuMode ? 8 : 12, 7), materials.leaf);
  const leafB = leafA.clone();
  leafA.position.set(-0.22, 0.42, 0.06);
  leafB.position.set(0.24, 0.62, -0.04);
  leafA.scale.set(1.45, 0.36, 0.82);
  leafB.scale.set(1.25, 0.34, 0.72);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.52, reducedGpuMode ? 16 : 24, reducedGpuMode ? 10 : 16), materials.snapHead);
  head.position.y = 1.55;
  head.scale.set(1.05, 0.82, 0.92);
  head.castShadow = enableShadows;
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.31, reducedGpuMode ? 16 : 24), materials.snapMouth);
  mouth.position.set(0, 1.55, -0.48);
  mouth.scale.set(1.22, 0.62, 1);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 6, reducedGpuMode ? 20 : 32), materials.tooth);
  lip.position.copy(mouth.position);
  lip.scale.set(1.18, 0.58, 1);
  lip.rotation.x = Math.PI / 2;
  const spotA = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), materials.snapSpot);
  const spotB = spotA.clone();
  const spotC = spotA.clone();
  spotA.position.set(-0.22, 1.78, -0.27);
  spotB.position.set(0.24, 1.7, -0.3);
  spotC.position.set(0.02, 1.92, -0.08);
  spotA.scale.set(1.2, 0.45, 0.72);
  spotB.scale.copy(spotA.scale);
  spotC.scale.set(0.95, 0.42, 0.68);
  const toothCount = reducedGpuMode ? 4 : 6;
  for (let i = 0; i < toothCount; i += 1) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 6), materials.tooth);
    tooth.position.set((i - (toothCount - 1) * 0.5) * 0.1, 1.76 - Math.abs(i - toothCount * 0.5) * 0.012, -0.5);
    tooth.rotation.x = Math.PI;
    group.add(tooth);
  }
  group.add(stem, leafA, leafB, head, mouth, lip);
  if (!reducedGpuMode) group.add(spotA, spotB, spotC);
  group.position.set(def.x, def.y, def.z);
  group.rotation.y = def.yaw ?? 0;
  scene.add(group);
  enemyItems.push({
    ...def,
    type: "snapFlower",
    group,
    head,
    mouth,
    lip,
    baseX: def.x,
    baseY: def.y,
    baseZ: def.z,
    angle: def.phase ?? 0,
    defeated: false,
    hitCooldown: 0,
  });
}

function createCrusherEnemy(def) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(def.w ?? 2.7, def.h ?? 2.5, def.d ?? 2.7),
    materials.crusher,
  );
  body.castShadow = enableShadows;
  body.receiveShadow = enableShadows;
  const eyeA = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.04), materials.crusherFace);
  const eyeB = eyeA.clone();
  eyeA.position.set(-0.48, 0.24, -((def.d ?? 2.7) * 0.5 + 0.024));
  eyeB.position.set(0.48, 0.24, -((def.d ?? 2.7) * 0.5 + 0.024));
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.1, 0.04), materials.crusherFace);
  mouth.position.set(0, -0.42, -((def.d ?? 2.7) * 0.5 + 0.025));
  const browA = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.055), materials.tooth);
  const browB = browA.clone();
  browA.position.set(-0.48, 0.43, -((def.d ?? 2.7) * 0.5 + 0.036));
  browB.position.set(0.48, 0.43, -((def.d ?? 2.7) * 0.5 + 0.036));
  browA.rotation.z = -0.14;
  browB.rotation.z = 0.14;
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), materials.heroBadge);
  gem.position.set(0, 0.18, -((def.d ?? 2.7) * 0.5 + 0.045));
  group.add(body, eyeA, eyeB, mouth);
  if (!reducedGpuMode) group.add(browA, browB, gem);
  if (!reducedGpuMode) {
    for (let i = 0; i < 4; i += 1) {
      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.04), materials.tooth);
      chip.position.set(-0.34 + i * 0.22, -0.62, -((def.d ?? 2.7) * 0.5 + 0.035));
      group.add(chip);
    }
  }
  group.position.set(def.x, def.y, def.z);
  scene.add(group);
  enemyItems.push({
    ...def,
    type: "crusher",
    group,
    body,
    baseX: def.x,
    baseY: def.y,
    baseZ: def.z,
    angle: 0,
    defeated: false,
    hitCooldown: 0,
  });
}

function createRocketEnemy(def) {
  const group = new THREE.Group();
  const launcher = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 1.2, reducedGpuMode ? 14 : 22), materials.pipe);
  barrel.rotation.z = Math.PI / 2;
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.24, reducedGpuMode ? 14 : 22), materials.pipeDark);
  muzzle.rotation.z = Math.PI / 2;
  muzzle.position.x = 0.68;
  launcher.add(barrel, muzzle);
  launcher.rotation.y = -(def.yaw ?? 0);
  group.add(launcher);

  const projectile = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.62, reducedGpuMode ? 5 : 7, reducedGpuMode ? 10 : 14), materials.rocket);
  body.rotation.z = Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.29, 0.38, reducedGpuMode ? 12 : 18), materials.rocketNose);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 0.5;
  const eyeA = new THREE.Mesh(new THREE.SphereGeometry(0.045, 7, 6), materials.tooth);
  const eyeB = eyeA.clone();
  eyeA.position.set(0.18, 0.11, -0.23);
  eyeB.position.set(0.18, -0.11, -0.23);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 12), materials.rocketFlame.clone());
  flame.rotation.z = Math.PI / 2;
  flame.position.x = -0.58;
  const finA = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 3), materials.rocketFin);
  const finB = finA.clone();
  finA.position.set(-0.24, 0.29, 0);
  finB.position.set(-0.24, -0.29, 0);
  finA.rotation.z = Math.PI;
  finB.rotation.z = 0;
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.018, 5, reducedGpuMode ? 14 : 20), materials.dashArrow.clone());
  stripe.rotation.y = Math.PI / 2;
  stripe.position.x = 0.05;
  projectile.add(body, nose, eyeA, eyeB, flame);
  if (!reducedGpuMode) projectile.add(finA, finB, stripe);
  projectile.visible = false;
  group.add(projectile);
  group.position.set(def.x, def.y, def.z);
  scene.add(group);
  enemyItems.push({
    ...def,
    type: "rocket",
    group,
    projectile,
    flame,
    forward: new THREE.Vector3(Math.sin(def.yaw ?? 0), 0, Math.cos(def.yaw ?? 0)).normalize(),
    baseX: def.x,
    baseY: def.y,
    baseZ: def.z,
    travel: 0,
    fireTimer: def.phase ?? 0,
    defeated: false,
    hitCooldown: 0,
  });
}

function createSpinnerEnemy(def) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.34, reducedGpuMode ? 12 : 18, reducedGpuMode ? 8 : 12), materials.spinnerCore);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.1, 8), materials.flagPole);
  core.position.y = 0.64;
  mast.position.y = 0.36;
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.024, 6, reducedGpuMode ? 18 : 28), materials.spinnerSpark.clone());
  halo.position.y = 0.64;
  halo.rotation.x = Math.PI / 2;
  const orbiters = [];
  const count = def.count ?? 3;
  for (let i = 0; i < count; i += 1) {
    const orbiter = new THREE.Mesh(new THREE.SphereGeometry(0.22, reducedGpuMode ? 9 : 14, reducedGpuMode ? 6 : 9), materials.spinnerSpark.clone());
    orbiters.push(orbiter);
    group.add(orbiter);
  }
  group.add(mast, core, halo);
  group.position.set(def.x, def.y, def.z);
  scene.add(group);
  enemyItems.push({
    ...def,
    type: "spinner",
    group,
    orbiters,
    halo,
    baseX: def.x,
    baseY: def.y,
    baseZ: def.z,
    angle: def.phase ?? 0,
    defeated: false,
    hitCooldown: 0,
  });
}

function createPlayer() {
  const group = new THREE.Group();

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.62, reducedGpuMode ? 18 : 24), materials.blobShadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.035;
  shadow.scale.set(1.25, 1, 1);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, reducedGpuMode ? 18 : 24, reducedGpuMode ? 12 : 18), materials.hero);
  body.position.y = 0.82;
  body.scale.set(0.86, 1.08, 0.72);
  body.castShadow = enableShadows;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, reducedGpuMode ? 18 : 24, reducedGpuMode ? 12 : 16), materials.skin);
  head.position.y = 1.48;
  head.castShadow = enableShadows;

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.35, reducedGpuMode ? 18 : 24), materials.cap);
  cap.position.y = 1.82;
  cap.rotation.x = -0.08;
  cap.castShadow = enableShadows;

  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.09, 0.22), materials.cap);
  brim.position.set(0, 1.67, -0.32);
  brim.castShadow = enableShadows;
  const capBand = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.022, 6, reducedGpuMode ? 18 : 26), materials.heroAccent);
  capBand.position.set(0, 1.66, -0.02);
  capBand.rotation.x = Math.PI / 2;
  capBand.scale.set(1.08, 0.7, 1);
  const capGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), materials.heroBadge);
  capGem.position.set(0, 1.7, -0.43);
  capGem.rotation.z = 0.42;

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.36, reducedGpuMode ? 14 : 20, reducedGpuMode ? 8 : 12), materials.hair);
  hair.position.set(0, 1.46, 0.08);
  hair.scale.set(0.95, 0.5, 0.86);
  hair.castShadow = enableShadows;

  const eyeA = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), materials.eye);
  const eyeB = eyeA.clone();
  eyeA.position.set(-0.13, 1.52, -0.34);
  eyeB.position.set(0.13, 1.52, -0.34);
  const glintA = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 5), materials.tooth);
  const glintB = glintA.clone();
  glintA.position.set(-0.145, 1.535, -0.374);
  glintB.position.set(0.115, 1.535, -0.374);
  const cheekA = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), materials.cheek);
  const cheekB = cheekA.clone();
  cheekA.position.set(-0.22, 1.44, -0.32);
  cheekB.position.set(0.22, 1.44, -0.32);
  cheekA.scale.set(1.3, 0.52, 0.32);
  cheekB.scale.copy(cheekA.scale);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), materials.skin);
  nose.position.set(0, 1.46, -0.39);
  nose.scale.set(0.9, 0.82, 1.15);
  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.026, 0.018), materials.mouth);
  smile.position.set(0, 1.36, -0.382);
  smile.rotation.x = -0.08;
  const earA = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), materials.skin);
  const earB = earA.clone();
  earA.position.set(-0.35, 1.48, -0.03);
  earB.position.set(0.35, 1.48, -0.03);
  earA.scale.set(0.5, 1, 0.72);
  earB.scale.copy(earA.scale);

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 8, reducedGpuMode ? 18 : 28), materials.belt);
  belt.position.y = 0.86;
  belt.rotation.x = Math.PI / 2;
  belt.scale.set(1.02, 0.78, 1);
  const badge = new THREE.Mesh(new THREE.OctahedronGeometry(0.115, 0), materials.heroBadge);
  badge.position.set(0, 1.09, -0.43);
  badge.rotation.set(0.25, 0.1, 0.72);

  const scarf = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.22, 3, 1), materials.heroAccent);
  scarf.position.set(0.38, 1.22, 0.08);
  scarf.rotation.set(0.18, -0.38, -0.4);
  scarf.castShadow = enableShadows;
  const capeShape = new THREE.Shape();
  capeShape.moveTo(-0.34, 0.28);
  capeShape.quadraticCurveTo(0, 0.42, 0.34, 0.28);
  capeShape.lineTo(0.25, -0.26);
  capeShape.quadraticCurveTo(0, -0.42, -0.25, -0.26);
  capeShape.closePath();
  const cape = new THREE.Mesh(new THREE.ShapeGeometry(capeShape), materials.heroCape);
  cape.position.set(0, 0.96, 0.43);
  cape.rotation.set(-0.18, 0, 0);
  cape.castShadow = enableShadows;

  const shoeA = new THREE.Mesh(new THREE.SphereGeometry(0.18, reducedGpuMode ? 9 : 12, reducedGpuMode ? 6 : 8), materials.shoe);
  const shoeB = shoeA.clone();
  shoeA.position.set(-0.22, 0.12, -0.12);
  shoeB.position.set(0.22, 0.12, -0.12);
  shoeA.scale.set(1.25, 0.52, 1.7);
  shoeB.scale.copy(shoeA.scale);
  shoeA.castShadow = enableShadows;
  shoeB.castShadow = enableShadows;

  const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffcf9f, roughness: 0.65 });
  const armA = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.42, 5, 10), armMaterial);
  const armB = armA.clone();
  armA.position.set(-0.55, 0.88, -0.02);
  armB.position.set(0.55, 0.88, -0.02);
  armA.rotation.z = -0.35;
  armB.rotation.z = 0.35;
  armA.castShadow = enableShadows;
  armB.castShadow = enableShadows;
  const handA = new THREE.Mesh(new THREE.SphereGeometry(0.12, reducedGpuMode ? 8 : 12, reducedGpuMode ? 6 : 8), materials.glove);
  const handB = handA.clone();
  handA.position.set(-0.6, 0.58, -0.04);
  handB.position.set(0.6, 0.58, -0.04);
  handA.scale.set(1, 0.82, 1);
  handB.scale.copy(handA.scale);

  const wingA = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.32), materials.glideWing.clone());
  const wingB = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.32), materials.glideWing.clone());
  wingA.position.set(-0.58, 1.08, 0.16);
  wingB.position.set(0.58, 1.08, 0.16);
  wingA.rotation.set(0.2, -0.58, -0.18);
  wingB.rotation.set(0.2, 0.58, 0.18);
  wingA.visible = false;
  wingB.visible = false;

  const shieldAura = new THREE.Mesh(
    new THREE.SphereGeometry(0.78, reducedGpuMode ? 14 : 22, reducedGpuMode ? 8 : 14),
    materials.prismAura.clone(),
  );
  shieldAura.position.y = 0.88;
  shieldAura.scale.set(0.92, 1.18, 0.92);
  shieldAura.visible = false;
  const shieldRingA = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.024, 5, reducedGpuMode ? 22 : 34),
    materials.prismAura.clone(),
  );
  const shieldRingB = shieldRingA.clone();
  shieldRingB.material = shieldRingA.material.clone();
  shieldRingA.position.y = 0.88;
  shieldRingB.position.y = 0.88;
  shieldRingA.rotation.x = Math.PI / 2;
  shieldRingB.rotation.z = Math.PI / 2;
  shieldRingA.visible = false;
  shieldRingB.visible = false;

  group.add(
    shieldAura,
    shieldRingA,
    shieldRingB,
    shadow,
    body,
    head,
    hair,
    cap,
    brim,
    capBand,
    capGem,
    eyeA,
    eyeB,
    glintA,
    glintB,
    cheekA,
    cheekB,
    nose,
    smile,
    earA,
    earB,
    belt,
    badge,
    scarf,
    cape,
    shoeA,
    shoeB,
    armA,
    armB,
    handA,
    handB,
    wingA,
    wingB,
  );
  group.userData = {
    body,
    shoeA,
    shoeB,
    armA,
    armB,
    handA,
    handB,
    shadow,
    wingA,
    wingB,
    scarf,
    cape,
    badge,
    capGem,
    shieldAura,
    shieldRingA,
    shieldRingB,
  };
  scene.add(group);
  return group;
}

const playerGroup = createPlayer();

function createGuideArrow() {
  const group = new THREE.Group();
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.68, 3), materials.guide.clone());
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.76), materials.guide.clone());
  const core = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.025, 6, 22), materials.guideCore.clone());
  arrow.rotation.x = Math.PI / 2;
  arrow.position.z = 0.42;
  tail.position.z = -0.12;
  core.rotation.x = Math.PI / 2;
  core.position.y = -0.03;
  group.add(arrow, tail, core);
  group.visible = false;
  scene.add(group);
  return group;
}

const guideArrow = createGuideArrow();

function createCheckpointBeacon() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.035, 6, reducedGpuMode ? 22 : 36), materials.checkpoint.clone());
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 0.75, reducedGpuMode ? 8 : 12), materials.checkpointCore.clone());
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, reducedGpuMode ? 8 : 12, reducedGpuMode ? 6 : 8), materials.checkpointCore.clone());
  ring.rotation.x = Math.PI / 2;
  core.position.y = 0.38;
  cap.position.y = 0.86;
  group.add(ring, core, cap);
  group.visible = false;
  group.userData = { ring, core, cap };
  scene.add(group);
  return group;
}

const checkpointBeacon = createCheckpointBeacon();

function buildWorld() {
  addLights();
  addSkyAndWater();

  for (const platform of PLATFORMS) createPlatform(platform);
  for (const spring of SPRINGS) createSpring(spring);
  for (const pad of DASH_PADS) createDashPad(pad);
  for (const ring of BOOST_RINGS) createBoostRing(ring);
  for (const wind of WIND_COLUMNS) createWindColumn(wind);
  STARS.forEach(createStar);
  COINS.forEach(createCoin);
  PRISM_CHARMS.forEach(createPrismCharm);
  for (const decor of DECOR) {
    if (decor.type === "tree") createTree(decor);
    if (decor.type === "cloud") createCloud(decor);
    if (decor.type === "flower") createFlowerPatch(decor);
    if (decor.type === "flag") createFlag(decor);
    if (decor.type === "lantern") createLantern(decor);
    if (decor.type === "crystal") createCrystal(decor);
    if (decor.type === "pipe") createPipe(decor);
    if (decor.type === "stone") createStoneCluster(decor);
    if (decor.type === "arch") createArch(decor);
    if (decor.type === "ribbon") createSkyRibbon(decor);
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
  const wasDown = keys.has(event.code);
  keys.add(event.code);
  if (event.code === "Space") {
    event.preventDefault();
    player.jumpHeld = true;
    if (!wasDown) queueJump();
  }
  if (event.code === "KeyF" && !event.repeat) {
    event.preventDefault();
    toggleFullscreen();
  }
  if (event.code === "KeyP") togglePause();
  if (event.code === "KeyR") resetRun(true);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
  if (event.code === "Space") player.jumpHeld = false;
});

ui.jumpTouch.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  player.jumpHeld = true;
  queueJump();
  ui.jumpTouch.setPointerCapture?.(event.pointerId);
});

function releaseTouchJump(event) {
  event.preventDefault();
  player.jumpHeld = false;
}

ui.jumpTouch.addEventListener("pointerup", releaseTouchJump);
ui.jumpTouch.addEventListener("pointercancel", releaseTouchJump);
ui.jumpTouch.addEventListener("lostpointercapture", () => {
  player.jumpHeld = false;
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
    if (player.checkpointSolid === solid) syncCheckpointPosition();
  }
}

function resolveHorizontal() {
  for (const solid of solids) {
    const top = topOf(solid);
    const bottom = bottomOf(solid);
    if (player.pos.y < bottom - 0.1 || player.pos.y > top + PLAYER_HEIGHT * 0.85) continue;
    if (player.pos.y >= top - 0.04) continue;
    const stepUp = top - player.pos.y;
    if (assistMode && stepUp > -0.08 && stepUp <= ASSIST_STEP_UP_HEIGHT && player.vel.y <= 1.5) continue;

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
  player.grounded = false;
  player.groundSolid = null;

  let bestTop = -Infinity;
  let bestSolid = null;
  for (const solid of solids) {
    const top = topOf(solid);
    const insideX = Math.abs(player.pos.x - solid.x) <= solid.w * 0.5 + ASSIST_LEDGE_MARGIN;
    const insideZ = Math.abs(player.pos.z - solid.z) <= solid.d * 0.5 + ASSIST_LEDGE_MARGIN;
    if (!insideX || !insideZ) continue;
    const crossedTop = previousY >= top - ASSIST_LANDING_GRACE && player.pos.y <= top + 0.1;
    const closeToTop = assistMode && player.pos.y >= top - ASSIST_LANDING_GRACE && player.pos.y <= top + 0.22;
    if (player.vel.y <= 0 && (crossedTop || closeToTop) && top > bestTop) {
      bestTop = top;
      bestSolid = solid;
    }
  }

  if (bestSolid) {
    player.pos.y = bestTop;
    if (assistMode) {
      player.pos.x = clamp(player.pos.x, bestSolid.x - bestSolid.w * 0.5 - PLAYER_RADIUS * 0.35, bestSolid.x + bestSolid.w * 0.5 + PLAYER_RADIUS * 0.35);
      player.pos.z = clamp(player.pos.z, bestSolid.z - bestSolid.d * 0.5 - PLAYER_RADIUS * 0.35, bestSolid.z + bestSolid.d * 0.5 + PLAYER_RADIUS * 0.35);
    }
    if (player.vel.y < -10) audio.play("land", 0.45);
    player.vel.y = 0;
    player.grounded = true;
    player.groundSolid = bestSolid;
    player.coyote = COYOTE_TIME;
    player.airJumpsUsed = 0;
    player.fallRescueTimer = 0;
    updateCheckpoint(bestSolid);
  }
}

function hasReachableLandingBelow(rescueY) {
  if (!assistMode || player.vel.y > 2.2) return false;
  for (const solid of solids) {
    const top = topOf(solid);
    if (top < rescueY - 1.2) continue;
    const insideX = Math.abs(player.pos.x - solid.x) <= solid.w * 0.5 + ASSIST_LEDGE_MARGIN + 0.45;
    const insideZ = Math.abs(player.pos.z - solid.z) <= solid.d * 0.5 + ASSIST_LEDGE_MARGIN + 0.45;
    if (!insideX || !insideZ) continue;
    const verticalGap = player.pos.y - top;
    if (verticalGap >= -ASSIST_LANDING_GRACE && verticalGap <= ASSIST_RESCUE_DROP + 2.4) return true;
  }
  return false;
}

function updateCheckpoint(solid) {
  const changedPlatform = player.checkpointId !== solid.id;
  const distanceFromCheckpoint = player.checkpoint.distanceTo(tmpVec.set(player.pos.x, topOf(solid) + 0.18, player.pos.z));
  if (!changedPlatform && distanceFromCheckpoint < 3.2) return;
  saveCheckpoint(solid, player.pos.x, player.pos.z, changedPlatform && game.running);
}

function saveCheckpoint(solid, worldX, worldZ, announce = false) {
  player.checkpointSolid = solid;
  player.checkpointId = solid.id;
  player.checkpointLocal.set(
    clamp(worldX - solid.x, -solid.w * 0.5 + PLAYER_RADIUS * 1.6, solid.w * 0.5 - PLAYER_RADIUS * 1.6),
    0,
    clamp(worldZ - solid.z, -solid.d * 0.5 + PLAYER_RADIUS * 1.6, solid.d * 0.5 - PLAYER_RADIUS * 1.6),
  );
  syncCheckpointPosition();
  game.checkpointPulse = 1.15;
  if (announce) showToast("Checkpoint");
}

function syncCheckpointPosition() {
  const solid = player.checkpointSolid;
  if (!solid) return;
  player.checkpoint.set(
    solid.x + player.checkpointLocal.x,
    topOf(solid) + 0.18,
    solid.z + player.checkpointLocal.z,
  );
}

function findStartSolid() {
  return solids.find((solid) => solid.id === "home") || solids[0] || null;
}

function resetCheckpointToStart() {
  const startSolid = findStartSolid();
  if (startSolid) {
    saveCheckpoint(startSolid, START.x, START.z, false);
  } else {
    player.checkpointSolid = null;
    player.checkpointId = "start";
    player.checkpointLocal.set(0, 0, 0);
    player.checkpoint.set(START.x, START.y, START.z);
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
  const canAirJump = !canGroundJump && player.airJumpsUsed < MAX_AIR_JUMPS;
  if (player.jumpQueued && player.jumpBuffer > 0 && (canGroundJump || canAirJump)) {
    if (canAirJump) {
      player.airJumpsUsed += 1;
      const isTriple = player.airJumpsUsed >= 2;
      player.vel.y = Math.max(player.vel.y, isTriple ? TRIPLE_JUMP_SPEED : DOUBLE_JUMP_SPEED);
      player.vel.x += desired.x * (isTriple ? 3.6 : 2.4);
      player.vel.z += desired.z * (isTriple ? 3.6 : 2.4);
      spawnBurst(tmpVec2.set(player.pos.x, player.pos.y + 0.72, player.pos.z), isTriple ? 0xffd166 : 0x9ee8ff, isTriple ? 18 : 12);
      showToast(isTriple ? "Triple Jump" : "Double Jump");
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

  const canGlide = assistMode && player.jumpHeld && !player.grounded && player.vel.y < -1.4;
  const gravityScale = canGlide ? GLIDE_GRAVITY_SCALE : 1;
  const fallLimit = canGlide ? GLIDE_FALL_SPEED : MAX_FALL_SPEED;
  player.vel.y = Math.max(fallLimit, player.vel.y + GRAVITY * dt * gravityScale);
  player.gliding = canGlide;
  if (canGlide && move.length > 0.08) {
    player.vel.x += desired.x * 2.1 * dt;
    player.vel.z += desired.z * 2.1 * dt;
  }
  player.glideSparkTimer = Math.max(0, player.glideSparkTimer - dt);
  if (canGlide && !reducedGpuMode && player.glideSparkTimer <= 0) {
    player.glideSparkTimer = 0.16;
    spawnParticle(
      tmpVec2.set(player.pos.x, player.pos.y + 0.9, player.pos.z),
      0xfff7ad,
      new THREE.Vector3((Math.random() - 0.5) * 0.9, -0.25, (Math.random() - 0.5) * 0.9),
      0.42,
      0.055,
    );
  }

  const previousY = player.pos.y;
  player.pos.x += player.vel.x * dt;
  player.pos.z += player.vel.z * dt;
  resolveHorizontal();
  player.pos.y += player.vel.y * dt;
  resolveVertical(previousY);
  if (player.grounded) {
    player.gliding = false;
    player.fallRescueTimer = 0;
  }

  const rescueY = assistMode ? Math.max(RESPAWN_Y, player.checkpoint.y - ASSIST_RESCUE_DROP) : RESPAWN_Y;
  const landingStillPossible = hasReachableLandingBelow(rescueY);
  if (!player.grounded && player.pos.y < rescueY && !landingStillPossible) {
    player.fallRescueTimer += dt;
  } else if (player.pos.y >= rescueY || landingStillPossible) {
    player.fallRescueTimer = 0;
  }
  if (player.fallRescueTimer > ASSIST_RESCUE_DELAY) {
    player.fallRescueTimer = 0;
    damagePlayer(tmpVec2.set(0, 0, 1), true);
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
  const handA = playerGroup.userData.handA;
  const handB = playerGroup.userData.handB;
  const shadow = playerGroup.userData.shadow;
  const wingA = playerGroup.userData.wingA;
  const wingB = playerGroup.userData.wingB;
  const scarf = playerGroup.userData.scarf;
  const cape = playerGroup.userData.cape;
  const badge = playerGroup.userData.badge;
  const capGem = playerGroup.userData.capGem;
  const shieldAura = playerGroup.userData.shieldAura;
  const shieldRingA = playerGroup.userData.shieldRingA;
  const shieldRingB = playerGroup.userData.shieldRingB;
  const swing = Math.sin(t) * 0.35 * stride;
  shoeA.position.z = -0.12 + swing * 0.18;
  shoeB.position.z = -0.12 - swing * 0.18;
  armA.rotation.x = swing;
  armB.rotation.x = -swing;
  handA.position.z = -0.04 + swing * 0.08;
  handB.position.z = -0.04 - swing * 0.08;
  scarf.rotation.z = -0.4 + Math.sin(game.time * 7.5) * (player.grounded ? 0.035 : 0.11);
  scarf.rotation.y = -0.38 + clamp(Math.hypot(player.vel.x, player.vel.z) / RUN_SPEED, 0, 1) * 0.18;
  cape.rotation.x = -0.18 - clamp(Math.hypot(player.vel.x, player.vel.z) / RUN_SPEED, 0, 1) * 0.16 + Math.sin(game.time * 8) * 0.035;
  cape.rotation.z = Math.sin(game.time * 6.5) * (player.grounded ? 0.035 : 0.08);
  badge.rotation.y += dt * 1.8;
  capGem.rotation.y -= dt * 1.4;

  const squash = player.grounded ? 1 : clamp(1 + player.vel.y * 0.015, 0.88, 1.12);
  playerGroup.scale.y = damp(playerGroup.scale.y, squash, 12, dt);
  playerGroup.scale.x = damp(playerGroup.scale.x, 1 + (1 - squash) * 0.25, 12, dt);
  playerGroup.scale.z = playerGroup.scale.x;
  shadow.material.opacity = player.grounded ? 0.2 : 0.08;
  shadow.scale.setScalar(player.grounded ? 1.2 : 0.82);

  const wingOpacity = damp(wingA.material.opacity, player.gliding ? 0.64 : 0, 10, dt);
  wingA.material.opacity = wingOpacity;
  wingB.material.opacity = wingOpacity;
  wingA.visible = wingOpacity > 0.02;
  wingB.visible = wingOpacity > 0.02;
  if (wingA.visible || wingB.visible) {
    const flutter = Math.sin(game.time * 12) * 0.08;
    wingA.rotation.z = -0.2 - flutter;
    wingB.rotation.z = 0.2 + flutter;
  }

  const shieldTarget = player.prismShield > 0 ? (player.prismShield > 1 ? 0.2 : 0.13) : 0;
  const shieldOpacity = damp(shieldAura.material.opacity, shieldTarget, 12, dt);
  shieldAura.material.opacity = shieldOpacity;
  shieldRingA.material.opacity = Math.min(0.78, shieldOpacity * 4.2);
  shieldRingB.material.opacity = shieldRingA.material.opacity * 0.82;
  shieldAura.visible = shieldOpacity > 0.015;
  shieldRingA.visible = shieldAura.visible;
  shieldRingB.visible = shieldAura.visible;
  if (shieldAura.visible) {
    const shieldScale = 1 + Math.sin(game.time * 7.5) * 0.035 + player.prismShield * 0.035;
    shieldAura.scale.set(0.92 * shieldScale, 1.18 * shieldScale, 0.92 * shieldScale);
    shieldRingA.rotation.z += dt * (1.9 + player.prismShield * 0.35);
    shieldRingB.rotation.y -= dt * (1.4 + player.prismShield * 0.25);
  }
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

function updateDashPads(dt, active = true) {
  for (const pad of dashPadItems) {
    pad.cooldown = Math.max(0, pad.cooldown - dt);
    const ready = pad.cooldown <= 0;
    const pulse = 0.86 + Math.sin(game.time * 8 + pad.x) * 0.08;
    pad.group.scale.setScalar(ready ? pulse : 0.92);
    pad.arrow.material.opacity = ready ? 0.72 + Math.sin(game.time * 9 + pad.z) * 0.16 : 0.3;
    pad.tail.material.opacity = pad.arrow.material.opacity * 0.74;
    const dx = player.pos.x - pad.x;
    const dz = player.pos.z - pad.z;
    const dist = Math.hypot(dx, dz);
    if (active && ready && dist < 1.22 && Math.abs(player.pos.y - pad.y) < 1.05) {
      pad.cooldown = 0.9;
      player.vel.x = pad.forward.x * (pad.power ?? 12);
      player.vel.z = pad.forward.z * (pad.power ?? 12);
      player.vel.y = Math.max(player.vel.y, pad.lift ?? 4.8);
      player.grounded = false;
      player.groundSolid = null;
      player.coyote = 0;
      player.airJumpsUsed = 0;
      audio.play("bounce", 0.5);
      spawnBurst(pad.group.position, 0xfff7ad, reducedGpuMode ? 8 : 14);
      showToast("Dash Pad");
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

function updateWindColumns(dt, active = true) {
  for (const wind of windColumnItems) {
    wind.cooldown = Math.max(0, wind.cooldown - dt);
    wind.column.rotation.y += dt * 0.42;
    for (let i = 0; i < wind.rings.length; i += 1) {
      const ring = wind.rings[i];
      ring.rotation.z += dt * (0.8 + i * 0.35);
      ring.position.y += dt * (0.9 + i * 0.18);
      if (ring.position.y > wind.height) ring.position.y = 0.55;
      ring.material.opacity = 0.42 + Math.sin(game.time * 3 + i) * 0.12;
    }

    const dx = player.pos.x - wind.x;
    const dz = player.pos.z - wind.z;
    const localY = player.pos.y - wind.y;
    const inside = Math.hypot(dx, dz) < wind.radius && localY > -0.25 && localY < wind.height;
    if (active && inside) {
      player.vel.y = Math.max(player.vel.y, wind.power * (1 - Math.min(0.45, localY / wind.height * 0.25)));
      player.vel.x += (-dz / Math.max(0.01, wind.radius)) * dt * 1.4;
      player.vel.z += (dx / Math.max(0.01, wind.radius)) * dt * 1.4;
      player.airJumpsUsed = Math.min(player.airJumpsUsed, 1);
      if (wind.cooldown <= 0) {
        wind.cooldown = 1.2;
        showToast("Wind Lift");
        spawnBurst(tmpVec.set(wind.x, player.pos.y + 0.6, wind.z), 0xd8fbff, 8);
      }
    }
  }
}

function pullTowardPlayer(object, range, collectHeight, dt, strength) {
  const target = tmpVec.set(player.pos.x, player.pos.y + collectHeight, player.pos.z);
  const offset = tmpVec2.copy(target).sub(object.position);
  const distance = offset.length();
  if (distance > 0.02 && distance < range) {
    const pull = 1 - Math.exp(-strength * dt * (1.2 + (range - distance) / range));
    object.position.addScaledVector(offset, pull);
    return object.position.distanceTo(target);
  }
  return distance;
}

function updateCollectibles(dt) {
  for (const star of starItems) {
    if (star.collected) continue;
    star.group.rotation.y += dt * 2.2;
    star.group.rotation.x = Math.sin(game.time * 2.5 + star.x) * 0.18;
    star.group.position.y = star.y + Math.sin(game.time * 3 + star.z) * 0.12;
    const distance = assistMode
      ? pullTowardPlayer(star.group, STAR_MAGNET_RANGE, 0.8, dt, 7.8)
      : star.group.position.distanceTo(tmpVec.set(player.pos.x, player.pos.y + 0.8, player.pos.z));
    if (distance < (assistMode ? 1.55 : 1.2)) {
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
    const distance = assistMode
      ? pullTowardPlayer(coin.mesh, COIN_MAGNET_RANGE, 0.72, dt, 9.4)
      : coin.mesh.position.distanceTo(tmpVec.set(player.pos.x, player.pos.y + 0.72, player.pos.z));
    if (distance < (assistMode ? 1.08 : 0.85)) {
      coin.collected = true;
      coin.mesh.visible = false;
      game.coins += 1;
      audio.play("pickup", 0.42);
      spawnBurst(coin.mesh.position, 0xfff0a4, 8);
    }
  }
}

function updatePrismCharms(dt, active = true) {
  for (const charm of prismCharmItems) {
    if (charm.collected) continue;
    charm.group.rotation.y += dt * 1.8;
    charm.core.rotation.x += dt * 1.25;
    charm.ring.rotation.z -= dt * 2.4;
    charm.halo.rotation.x += dt * 0.9;
    charm.group.position.y = charm.y + Math.sin(game.time * 3.4 + charm.x) * 0.14;
    charm.core.scale.setScalar(0.92 + Math.sin(game.time * 5.5 + charm.z) * 0.08);
    charm.halo.material.opacity = 0.22 + Math.sin(game.time * 4.2 + charm.x) * 0.08;
    charm.halo.scale.setScalar(0.92 + Math.sin(game.time * 4.7 + charm.z) * 0.1);

    if (!active) continue;
    const distance = assistMode
      ? pullTowardPlayer(charm.group, 4.2, 0.82, dt, 7.2)
      : charm.group.position.distanceTo(tmpVec.set(player.pos.x, player.pos.y + 0.82, player.pos.z));
    if (distance < (assistMode ? 1.38 : 1.06)) {
      charm.collected = true;
      charm.group.visible = false;
      player.prismShield = Math.min(2, player.prismShield + 1);
      game.coins += 3;
      audio.play("star", 0.58);
      spawnBurst(charm.group.position, 0xd8fbff, 18);
      showToast(player.prismShield > 1 ? "Prism Shield x2" : "Prism Shield");
    }
  }
}

function updateEnemies(dt) {
  for (const enemy of enemyItems) {
    enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);
    if (enemy.defeated && enemy.type !== "crusher" && enemy.type !== "rocket") continue;
    if (enemy.type === "snapFlower") updateSnapFlowerEnemy(enemy, dt);
    else if (enemy.type === "crusher") updateCrusherEnemy(enemy, dt);
    else if (enemy.type === "rocket") updateRocketEnemy(enemy, dt);
    else if (enemy.type === "spinner") updateSpinnerEnemy(enemy, dt);
    else updateBouncerEnemy(enemy, dt);
  }
}

function updateBouncerEnemy(enemy, dt) {
  enemy.angle += dt * enemy.speed;
  const toPlayer = tmpVec.set(player.pos.x - enemy.group.position.x, 0, player.pos.z - enemy.group.position.z);
  const distToPlayer = toPlayer.length();
  let targetX = enemy.baseX + Math.cos(enemy.angle) * enemy.radius;
  let targetZ = enemy.baseZ + Math.sin(enemy.angle * 0.8) * enemy.radius;
  if (distToPlayer < 6.2) {
    targetX = damp(targetX, player.pos.x, 0.95, dt);
    targetZ = damp(targetZ, player.pos.z, 0.95, dt);
  }

  enemy.group.position.x = damp(enemy.group.position.x, targetX, 3.1, dt);
  enemy.group.position.z = damp(enemy.group.position.z, targetZ, 3.1, dt);
  enemy.group.position.y = enemy.baseY + Math.abs(Math.sin(enemy.angle * 2.2)) * 0.18;
  enemy.group.rotation.y = Math.atan2(enemy.group.position.x - player.pos.x, enemy.group.position.z - player.pos.z);
  handleEnemyContact(enemy, enemy.group.position.x, enemy.group.position.y, enemy.group.position.z, 1.05, 1.35, true, 0xf1725f);
}

function updateSnapFlowerEnemy(enemy, dt) {
  enemy.angle += dt * (enemy.speed ?? 1);
  const dx = player.pos.x - enemy.baseX;
  const dz = player.pos.z - enemy.baseZ;
  const near = Math.hypot(dx, dz) < 4.8;
  const pulse = (Math.sin(enemy.angle * 2.2) + 1) * 0.5;
  const rise = near ? 1 : pulse;
  enemy.group.position.y = damp(enemy.group.position.y, enemy.baseY + rise * 0.82, near ? 8.5 : 3.8, dt);
  enemy.group.rotation.y = Math.atan2(enemy.group.position.x - player.pos.x, enemy.group.position.z - player.pos.z);
  const bite = 0.72 + rise * 0.34 + Math.sin(game.time * 10) * 0.035;
  enemy.head.scale.set(1.05, bite, 0.92);
  enemy.mouth.scale.set(1.22, 0.48 + rise * 0.38, 1);
  enemy.lip.scale.set(1.18, 0.5 + rise * 0.32, 1);
  handleEnemyContact(enemy, enemy.group.position.x, enemy.group.position.y + 1.48, enemy.group.position.z, 1.05, 1.25, true, 0xf1725f);
}

function updateCrusherEnemy(enemy, dt) {
  enemy.angle += dt * (enemy.speed ?? 0.75);
  const phase = (enemy.angle + (enemy.phase ?? 0)) % 1;
  const warning = phase > 0.48 && phase < 0.62;
  const falling = phase >= 0.62 && phase < 0.78;
  const rising = phase >= 0.9;
  let dropAmount = 0;
  if (falling) dropAmount = THREE.MathUtils.smoothstep((phase - 0.62) / 0.16, 0, 1);
  else if (phase >= 0.78 && phase < 0.9) dropAmount = 1;
  else if (rising) dropAmount = 1 - THREE.MathUtils.smoothstep((phase - 0.9) / 0.1, 0, 1);
  enemy.group.position.y = enemy.baseY - dropAmount * (enemy.drop ?? 3.4);
  enemy.group.rotation.z = warning ? Math.sin(game.time * 32) * 0.035 : 0;
  if (dropAmount > 0.72) {
    handleEnemyContact(enemy, enemy.group.position.x, enemy.group.position.y, enemy.group.position.z, (enemy.w ?? 2.7) * 0.54, (enemy.h ?? 2.5) * 0.68, false, 0x8a96a1);
  }
}

function updateRocketEnemy(enemy, dt) {
  enemy.fireTimer -= dt;
  if (enemy.fireTimer <= 0 || enemy.travel > (enemy.range ?? 22)) {
    enemy.travel = 0;
    enemy.fireTimer = 2.25 + (enemy.phase ?? 0) * 0.25;
    enemy.projectile.visible = true;
    enemy.projectile.position.set(0, 0, 0);
    enemy.projectile.rotation.y = -(enemy.yaw ?? 0);
    if (!reducedGpuMode) spawnBurst(enemy.group.position, 0xf1725f, 6);
  }
  if (!enemy.projectile.visible) return;
  enemy.travel += dt * (enemy.speed ?? 9);
  enemy.projectile.position.set(
    enemy.forward.x * enemy.travel,
    Math.sin(game.time * 8 + enemy.phase) * 0.06,
    enemy.forward.z * enemy.travel,
  );
  enemy.flame.scale.setScalar(0.8 + Math.sin(game.time * 18) * 0.18);
  const worldX = enemy.baseX + enemy.projectile.position.x;
  const worldY = enemy.baseY + enemy.projectile.position.y;
  const worldZ = enemy.baseZ + enemy.projectile.position.z;
  const hit = handleEnemyContact(enemy, worldX, worldY, worldZ, 0.82, 0.9, true, 0xffd166, false);
  if (hit === "stomped") {
    enemy.projectile.visible = false;
    enemy.travel = enemy.range ?? 22;
    spawnBurst(tmpVec.set(worldX, worldY, worldZ), 0xffd166, 12);
  }
}

function updateSpinnerEnemy(enemy, dt) {
  enemy.angle += dt * (enemy.speed ?? 1.2);
  const count = enemy.orbiters.length;
  const radius = enemy.radius ?? 2.15;
  enemy.group.rotation.y = enemy.angle * 0.25;
  enemy.halo.rotation.z += dt * 2.5;
  enemy.halo.scale.setScalar(1 + Math.sin(game.time * 6 + (enemy.phase ?? 0)) * 0.08);
  for (let i = 0; i < count; i += 1) {
    const angle = enemy.angle + i * TAU / count;
    const orbiter = enemy.orbiters[i];
    orbiter.position.set(Math.cos(angle) * radius, 0.62 + Math.sin(angle * 2) * 0.12, Math.sin(angle) * radius);
    orbiter.scale.setScalar(0.88 + Math.sin(game.time * 7 + i) * 0.12);
    handleEnemyContact(
      enemy,
      enemy.baseX + orbiter.position.x,
      enemy.baseY + orbiter.position.y,
      enemy.baseZ + orbiter.position.z,
      0.62,
      0.8,
      true,
      0x9ee8ff,
      false,
    );
  }
}

function handleEnemyContact(enemy, x, y, z, radius, height, stompable, color, hideOnStomp = true) {
  const dx = player.pos.x - x;
  const dz = player.pos.z - z;
  const dist = Math.hypot(dx, dz);
  const dy = player.pos.y - y;
  if (dist >= radius || Math.abs(dy) >= height) return false;
  if (stompable && player.vel.y < -2 && dy > 0.3) {
    if (hideOnStomp) {
      enemy.defeated = true;
      enemy.group.visible = false;
    }
    player.vel.y = enemy.type === "snapFlower" ? 9.4 : 8.6;
    player.airJumpsUsed = 0;
    game.coins += enemy.type === "rocket" ? 1 : 3;
    audio.play("bounce", 0.7);
    spawnBurst(tmpVec.set(x, y, z), color, enemy.type === "rocket" ? 10 : 16);
    showToast(enemy.type === "rocket" ? "Rocket Bounce" : "Treffer");
    return "stomped";
  }
  if (enemy.hitCooldown <= 0) {
    enemy.hitCooldown = enemy.type === "crusher" ? 1.6 : 1.2;
    tmpVec2.set(dx, 0, dz);
    if (tmpVec2.lengthSq() < 0.01) tmpVec2.set(0, 0, 1);
    tmpVec2.normalize();
    damagePlayer(tmpVec2, false);
    return "hurt";
  }
  return true;
}

function damagePlayer(direction, hardReset) {
  if (!hardReset && player.damageCooldown > 0) return;
  player.damageCooldown = 1.45;
  let shielded = false;
  if (hardReset && assistMode) {
    showToast("Safe Return");
  } else if (!hardReset && player.prismShield > 0) {
    player.prismShield -= 1;
    shielded = true;
    showToast("Prism Save");
  } else if (!hardReset && assistMode && game.coins > 0) {
    game.coins = Math.max(0, game.coins - 1);
    showToast("Coin Save");
  } else {
    player.health -= 1;
  }
  player.vel.x = direction.x * 7.5;
  player.vel.z = direction.z * 7.5;
  player.vel.y = 6.5;
  audio.play(shielded ? "bounce" : "hurt", shielded ? 0.56 : 0.62);
  spawnBurst(
    tmpVec.set(player.pos.x, player.pos.y + 0.8, player.pos.z),
    shielded ? 0xd8fbff : 0xf1725f,
    shielded ? 14 : 10,
  );

  if (hardReset || player.health <= 0) {
    if (player.health <= 0) player.health = 3;
    respawnPlayer();
  }
}

function respawnPlayer() {
  syncCheckpointPosition();
  player.pos.copy(player.checkpoint);
  player.pos.y += 0.45;
  player.vel.set(0, 1, 0);
  player.grounded = false;
  player.groundSolid = null;
  player.coyote = 0;
  player.airJumpsUsed = 0;
  player.fallRescueTimer = 0;
  player.gliding = false;
  snapCameraToPlayer();
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

function updateGuideArrow() {
  if (!assistMode || !game.running || game.completed) {
    guideArrow.visible = false;
    return;
  }

  let target = null;
  let bestDistance = Infinity;
  if (game.stars >= LEVEL_TARGET_STARS) {
    target = GOAL;
  } else {
    for (const star of starItems) {
      if (star.collected) continue;
      const dx = star.group.position.x - player.pos.x;
      const dz = star.group.position.z - player.pos.z;
      const distance = dx * dx + dz * dz;
      if (distance < bestDistance) {
        bestDistance = distance;
        target = star.group.position;
      }
    }
  }
  if (!target) target = GOAL;

  const dx = target.x - player.pos.x;
  const dz = target.z - player.pos.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 1.8) {
    guideArrow.visible = false;
    return;
  }

  const guideDistance = clamp(distance * 0.16, 2.2, 5.2);
  guideArrow.visible = true;
  guideArrow.position.set(
    player.pos.x + dx / distance * guideDistance,
    player.pos.y + 1.12 + Math.sin(game.time * 5) * 0.08,
    player.pos.z + dz / distance * guideDistance,
  );
  guideArrow.rotation.y = Math.atan2(dx, dz);
  guideArrow.scale.setScalar(1 + Math.sin(game.time * 6.5) * 0.07);
}

function updateCheckpointBeacon(dt) {
  syncCheckpointPosition();
  checkpointBeacon.visible = Boolean(player.checkpointSolid) && game.running && !game.completed;
  if (!checkpointBeacon.visible) return;
  game.checkpointPulse = Math.max(0, game.checkpointPulse - dt);
  const pulse = 1 + game.checkpointPulse * 0.55 + Math.sin(game.time * 5.5) * 0.08;
  checkpointBeacon.position.set(player.checkpoint.x, player.checkpoint.y + 0.06, player.checkpoint.z);
  checkpointBeacon.rotation.y += dt * 1.4;
  checkpointBeacon.userData.ring.scale.setScalar(pulse);
  checkpointBeacon.userData.ring.material.opacity = 0.38 + game.checkpointPulse * 0.28;
  checkpointBeacon.userData.core.material.opacity = 0.44 + game.checkpointPulse * 0.22;
  checkpointBeacon.userData.cap.material.opacity = 0.58 + game.checkpointPulse * 0.18;
}

function spawnAmbientPortalSpark(dt, origin) {
  if (Math.random() > dt * (reducedGpuMode ? 3.5 : 7)) return;
  const pos = tmpVec.set(
    origin.x + (Math.random() - 0.5) * 4,
    origin.y + 1 + Math.random() * 2.4,
    origin.z + (Math.random() - 0.5) * 0.6,
  );
  spawnParticle(pos, 0xffd166, new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 1.4, (Math.random() - 0.5) * 0.8), 0.7, 0.07);
}

function spawnParticle(position, color, velocity, life, size) {
  if (particles.length >= MAX_PARTICLES) {
    const oldest = particles.shift();
    scene.remove(oldest.mesh);
    oldest.mesh.material.dispose();
  }
  const mesh = new THREE.Mesh(
    particleGeometry,
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
  );
  mesh.position.copy(position);
  mesh.scale.setScalar(size);
  scene.add(mesh);
  particles.push({ mesh, velocity: velocity.clone(), life, maxLife: life, size });
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
    particle.mesh.scale.setScalar(particle.size * (0.5 + alpha * 0.8));
    if (particle.life <= 0) {
      scene.remove(particle.mesh);
      particle.mesh.material.dispose();
      particles.splice(i, 1);
    }
  }
}

function getCameraTarget() {
  const portraitView = window.innerHeight > window.innerWidth;
  const mobileCamera = reducedGpuMode || portraitView;
  return tmpVec.set(player.pos.x, player.pos.y + (mobileCamera ? 0.85 : 1.15), player.pos.z);
}

function snapCameraToPlayer() {
  const portraitView = window.innerHeight > window.innerWidth;
  const mobileCamera = reducedGpuMode || portraitView;
  const distance = Math.max(cameraState.distance, mobileCamera ? 10.8 : 9.2);
  const target = getCameraTarget();
  const horizontal = Math.cos(cameraState.pitch) * distance;
  const offset = tmpVec2.set(
    Math.sin(cameraState.yaw) * horizontal,
    Math.sin(cameraState.pitch) * distance + (mobileCamera ? 1.35 : 1.6),
    Math.cos(cameraState.yaw) * horizontal,
  );
  camera.position.copy(target).add(offset);
  camera.lookAt(target);
}

function updateCamera(dt, move) {
  const portraitView = window.innerHeight > window.innerWidth;
  const mobileCamera = reducedGpuMode || portraitView;
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

  const airborneBonus = player.grounded ? 0 : clamp(Math.abs(player.vel.y) / TRIPLE_JUMP_SPEED, 0, 1) * (mobileCamera ? 2.4 : 1.5);
  const targetDistance = (mobileCamera ? 10.6 : 9.2) + clamp(horizontalSpeed / RUN_SPEED, 0, 1) * (mobileCamera ? 1.8 : 1.8) + airborneBonus;
  cameraState.distance = damp(cameraState.distance, targetDistance, mobileCamera ? 3.9 : 2.5, dt);
  const target = getCameraTarget();
  const horizontal = Math.cos(cameraState.pitch) * cameraState.distance;
  const offset = tmpVec2.set(
    Math.sin(cameraState.yaw) * horizontal,
    Math.sin(cameraState.pitch) * cameraState.distance + (mobileCamera ? 1.35 : 1.6),
    Math.cos(cameraState.yaw) * horizontal,
  );
  const ideal = tmpVec3.copy(target).add(offset);
  camera.position.lerp(ideal, 1 - Math.exp((player.grounded ? -8 : -13) * dt));
  camera.lookAt(target);
}

function updateHud() {
  ui.starText.textContent = `${game.stars}/${LEVEL_TARGET_STARS}`;
  ui.coinText.textContent = String(game.coins);
  const jumpsReady = player.grounded ? 3 : Math.max(0, 2 - player.airJumpsUsed);
  ui.jumpText.textContent = `${jumpsReady}/3`;
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
  game.hudTimer = 0;
  player.health = 3;
  player.pos.set(START.x, START.y, START.z);
  player.vel.set(0, 0, 0);
  player.heading = Math.PI;
  resetCheckpointToStart();
  player.grounded = false;
  player.groundSolid = null;
  player.jumpQueued = false;
  player.jumpHeld = false;
  player.jumpBuffer = 0;
  player.airJumpsUsed = 0;
  player.fallRescueTimer = 0;
  player.glideSparkTimer = 0;
  player.prismShield = 0;
  player.gliding = false;
  player.coyote = 0;
  cameraState.yaw = Math.PI;
  cameraState.pitch = 0.48;
  cameraState.distance = 10.5;
  camera.position.set(0, 8, 12);

  for (const star of starItems) {
    star.collected = false;
    star.group.visible = true;
    star.group.position.set(star.x, star.y, star.z);
  }
  for (const coin of coinItems) {
    coin.collected = false;
    coin.mesh.visible = true;
    coin.mesh.position.set(coin.x, coin.y, coin.z);
  }
  for (const charm of prismCharmItems) {
    charm.collected = false;
    charm.group.visible = true;
    charm.group.position.set(charm.x, charm.y, charm.z);
  }
  for (const enemy of enemyItems) {
    enemy.defeated = false;
    enemy.group.visible = true;
    enemy.group.position.set(enemy.x, enemy.y, enemy.z);
    enemy.hitCooldown = 0;
    enemy.angle = enemy.type === "bouncer" ? Math.random() * TAU : (enemy.phase ?? 0);
    if (enemy.type === "crusher") enemy.angle = 0;
    if (enemy.type === "rocket") {
      enemy.travel = 0;
      enemy.fireTimer = enemy.phase ?? 0;
      enemy.projectile.visible = false;
      enemy.projectile.position.set(0, 0, 0);
    }
  }
  for (const ring of boostRingItems) {
    ring.cooldown = 0;
    ring.group.scale.setScalar(1);
    ring.ring.material.opacity = 0.86;
  }
  for (const wind of windColumnItems) {
    wind.cooldown = 0;
  }
  for (const pad of dashPadItems) {
    pad.cooldown = 0;
    pad.group.scale.setScalar(1);
  }
  game.checkpointPulse = 0;
  guideArrow.visible = false;
  checkpointBeacon.visible = false;

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

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
}

function fullscreenSupported() {
  const root = document.documentElement;
  return Boolean(
    document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.msFullscreenEnabled ||
      root.requestFullscreen ||
      root.webkitRequestFullscreen ||
      root.msRequestFullscreen,
  );
}

function syncFullscreenButton() {
  if (!fullscreenSupported()) {
    ui.fullscreenButton.textContent = "Vollbild";
    ui.fullscreenButton.disabled = true;
    return;
  }
  ui.fullscreenButton.disabled = false;
  ui.fullscreenButton.textContent = getFullscreenElement() ? "Fenster" : "Vollbild";
}

async function enterFullscreen() {
  const root = document.documentElement;
  if (root.requestFullscreen) {
    try {
      return await root.requestFullscreen({ navigationUI: "hide" });
    } catch (error) {
      if (error instanceof TypeError) return root.requestFullscreen();
      throw error;
    }
  }
  if (root.webkitRequestFullscreen) return root.webkitRequestFullscreen();
  if (root.msRequestFullscreen) return root.msRequestFullscreen();
  throw new Error("Fullscreen unavailable");
}

async function exitFullscreen() {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  if (document.msExitFullscreen) return document.msExitFullscreen();
  throw new Error("Fullscreen unavailable");
}

async function toggleFullscreen() {
  if (!fullscreenSupported()) {
    showToast("Vollbild nicht verfuegbar");
    return;
  }
  try {
    if (getFullscreenElement()) await exitFullscreen();
    else await enterFullscreen();
  } catch {
    showToast("Vollbild blockiert");
  } finally {
    syncFullscreenButton();
    window.setTimeout(resize, 120);
  }
}

ui.startButton.addEventListener("click", startGame);
ui.againButton.addEventListener("click", startGame);
ui.resetButton.addEventListener("click", () => resetRun(true));
ui.pauseButton.addEventListener("click", togglePause);
ui.fullscreenButton.addEventListener("click", toggleFullscreen);
ui.soundButton.addEventListener("click", () => audio.setEnabled(!audio.enabled));
ui.menuSoundButton.addEventListener("click", () => audio.setEnabled(!audio.enabled));

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  activePixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
  renderer.setPixelRatio(activePixelRatio);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
document.addEventListener("fullscreenchange", syncFullscreenButton);
document.addEventListener("webkitfullscreenchange", syncFullscreenButton);
document.addEventListener("MSFullscreenChange", syncFullscreenButton);
resize();
syncSoundButtons();
syncFullscreenButton();
resetRun(false);

function frame() {
  requestAnimationFrame(frame);
  const rawDt = Math.min(0.05, clock.getDelta());
  const dt = rawDt || 0.016;
  updatePerformanceBudget(dt);

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
    updateDashPads(dt);
    updateBoostRings(dt);
    updateWindColumns(dt);
    updateCollectibles(dt);
    updatePrismCharms(dt);
    updateEnemies(dt);
    updateGoal(dt);
    updateGuideArrow();
    updateCheckpointBeacon(dt);
    updateParticles(dt);
    updateCamera(dt, move);
    updateToast(dt);
    game.hudTimer -= dt;
    if (game.hudTimer <= 0) {
      game.hudTimer = 0.12;
      updateHud();
    }
  } else {
    updateMovingPlatforms(game.time);
    updateDashPads(dt, false);
    updateBoostRings(dt, false);
    updateWindColumns(dt, false);
    updatePrismCharms(dt, false);
    guideArrow.visible = false;
    checkpointBeacon.visible = false;
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

function updatePerformanceBudget(dt) {
  if (captureMode || qualityMode === "high" || perf.adjusted) return;
  perf.elapsed += dt;
  perf.totalDt += dt;
  perf.samples += 1;
  if (perf.elapsed < 1.4 || perf.samples < 45) return;
  const averageDt = perf.totalDt / perf.samples;
  const floor = reducedGpuMode ? 0.58 : 0.66;
  if (averageDt > (reducedGpuMode ? 0.021 : 0.024) && activePixelRatio > floor) {
    activePixelRatio = Math.max(floor, activePixelRatio * (reducedGpuMode ? 0.68 : 0.8));
    renderer.setPixelRatio(activePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    perf.adjusted = true;
    showToast("Smooth Mode");
  }
}
