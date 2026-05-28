import { ASSETS, OBJECT_FRAME, TILE, TILE_INDEX as T } from "./assets.js?v=moonwell-v4";
import {
  MAX_HEALTH,
  REQUIRED_SHARDS,
  REQUIRED_SIGILS,
  addKey,
  addShard,
  addSigil,
  clearSave,
  createInitialState,
  heal,
  loadState,
  markBossDefeated,
  markChest,
  markEnemyDefeated,
  markMoonBloom,
  openGate,
  saveState,
  takeDamage,
  touchBeacon,
  touchObelisk,
} from "./sim.js?v=moonwell-v4";

const WORLD_W = 76;
const WORLD_H = 54;
const WORLD_PX_W = WORLD_W * TILE;
const WORLD_PX_H = WORLD_H * TILE;
const PLAYER_SPEED = 184;
const DASH_SPEED = 440;
const DASH_TIME = 165;
const DASH_COOLDOWN = 500;
const ATTACK_COOLDOWN = 260;
const PULSE_COOLDOWN = 1600;
const INVULN_TIME = 1120;
const ENEMY_HP = 2;
const WISP_HP = 1;
const MOONMOTH_HP = 1;
const BOSS_HP = 10;
const AUDIO_STORAGE_KEY = "emberwild-audio-enabled";

const ui = {
  shell: document.querySelector("#game-shell"),
  hud: document.querySelector("#hud"),
  healthFill: document.querySelector("#health-fill"),
  emberFill: document.querySelector("#ember-fill"),
  shardCount: document.querySelector("#shard-count"),
  sigilCount: document.querySelector("#sigil-count"),
  keyStatus: document.querySelector("#key-status"),
  areaName: document.querySelector("#area-name"),
  objective: document.querySelector("#objective"),
  audioToggle: document.querySelector("#audio-toggle"),
  bossHud: document.querySelector("#boss-hud"),
  bossFill: document.querySelector("#boss-fill"),
  prompt: document.querySelector("#prompt"),
  journal: document.querySelector("#journal"),
  journalToggle: document.querySelector("#journal-toggle"),
  bossReveal: document.querySelector("#boss-reveal"),
  menu: document.querySelector("#menu"),
  startButton: document.querySelector("#start-button"),
  resetButton: document.querySelector("#reset-button"),
  endScreen: document.querySelector("#end-screen"),
  endTitle: document.querySelector("#end-title"),
  endMessage: document.querySelector("#end-message"),
  againButton: document.querySelector("#again-button"),
};

const touchState = {
  up: false,
  down: false,
  left: false,
  right: false,
  taps: new Set(),
};

const keyboardState = {
  down: new Set(),
  pressed: new Set(),
};

const KEY_BINDINGS = new Map([
  ["ArrowUp", "up"],
  ["ArrowDown", "down"],
  ["ArrowLeft", "left"],
  ["ArrowRight", "right"],
  ["KeyW", "up"],
  ["KeyS", "down"],
  ["KeyA", "left"],
  ["KeyD", "right"],
  ["Space", "attack"],
  ["ShiftLeft", "dash"],
  ["ShiftRight", "dash"],
  ["KeyE", "interact"],
  ["Escape", "pause"],
  ["KeyQ", "pulse"],
]);

const CAPTURED_ACTIONS = new Set(KEY_BINDINGS.values());

function keyAction(event) {
  return KEY_BINDINGS.get(event.code) ?? KEY_BINDINGS.get(event.key);
}

function captureKeyboardEvent(event) {
  const action = keyAction(event);
  if (!action) return false;
  const scene = window.__emberScene;
  if (scene?.activePlay && !scene.pausedByOverlay) event.preventDefault();
  return CAPTURED_ACTIONS.has(action);
}

function consumeTap(action) {
  if (!touchState.taps.has(action)) return false;
  touchState.taps.delete(action);
  return true;
}

function consumePress(action) {
  if (!keyboardState.pressed.has(action)) return false;
  keyboardState.pressed.delete(action);
  return true;
}

function resetInputState() {
  touchState.up = false;
  touchState.down = false;
  touchState.left = false;
  touchState.right = false;
  touchState.taps.clear();
  keyboardState.down.clear();
  keyboardState.pressed.clear();
}

function focusGameCanvas(game) {
  const canvas = game?.canvas ?? document.querySelector("#game-shell canvas");
  if (!canvas) return;
  canvas.setAttribute("tabindex", "0");
  canvas.focus({ preventScroll: true });
}

function wantsReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function compactViewport() {
  return window.innerWidth <= 760 || window.innerHeight <= 560;
}

document.addEventListener(
  "keydown",
  (event) => {
    const action = keyAction(event);
    if (!captureKeyboardEvent(event)) return;
    keyboardState.down.add(action);
    if (!event.repeat) keyboardState.pressed.add(action);
  },
  { passive: false },
);

document.addEventListener(
  "keyup",
  (event) => {
    const action = keyAction(event);
    if (!captureKeyboardEvent(event)) return;
    keyboardState.down.delete(action);
  },
  { passive: false },
);

window.addEventListener("blur", resetInputState);

function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

function distance(a, b) {
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

function makeWorld(state) {
  const ground = [];
  const solid = [];
  const decor = [];

  for (let y = 0; y < WORLD_H; y += 1) {
    ground[y] = [];
    solid[y] = [];
    decor[y] = [];
    for (let x = 0; x < WORLD_W; x += 1) {
      const noise = (x * 17 + y * 31 + (x * y) % 13) % 23;
      ground[y][x] = noise < 2 ? T.grassFlowers : noise < 7 ? T.moss : T.grass;
      solid[y][x] = -1;
      decor[y][x] = -1;
    }
  }

  const putSolid = (x, y, tile) => {
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return;
    solid[y][x] = tile;
  };
  const putGround = (x, y, tile) => {
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return;
    ground[y][x] = tile;
  };
  const putDecor = (x, y, tile) => {
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return;
    decor[y][x] = tile;
  };

  for (let x = 0; x < WORLD_W; x += 1) {
    putSolid(x, 0, T.wall);
    putSolid(x, WORLD_H - 1, T.wall);
    putGround(x, 0, T.dark);
    putGround(x, WORLD_H - 1, T.dark);
  }
  for (let y = 0; y < WORLD_H; y += 1) {
    putSolid(0, y, T.wall);
    putSolid(WORLD_W - 1, y, T.wall);
    putGround(0, y, T.dark);
    putGround(WORLD_W - 1, y, T.dark);
  }

  const road = [
    [6, 37, 28, 37],
    [27, 31, 36, 38],
    [31, 16, 34, 37],
    [33, 20, 55, 22],
    [10, 20, 33, 22],
    [48, 10, 54, 22],
    [52, 31, 68, 33],
    [66, 33, 68, 48],
    [57, 37, 66, 39],
    [59, 45, 73, 48],
  ];
  for (const [x0, y0, x1, y1] of road) {
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        putGround(x, y, (x + y) % 5 === 0 ? T.roots : T.dirt);
      }
    }
  }

  for (let x = 1; x < WORLD_W - 1; x += 1) {
    const riverY = 27 + Math.round(Math.sin(x / 4) * 2);
    for (let dy = -1; dy <= 1; dy += 1) {
      putGround(x, riverY + dy, T.water);
      putSolid(x, riverY + dy, T.water);
    }
  }
  for (const bridgeX of [12, 32, 53, 67]) {
    for (let bx = bridgeX - 1; bx <= bridgeX + 1; bx += 1) {
      for (let by = 24; by <= 31; by += 1) {
        if (solid[by]?.[bx] === T.water) {
          solid[by][bx] = -1;
          ground[by][bx] = T.bridge;
        }
      }
    }
  }

  for (let y = 3; y <= 15; y += 1) {
    for (let x = 23; x <= 41; x += 1) {
      putGround(x, y, (x + y) % 4 === 0 ? T.crackedStone : T.stone);
    }
  }
  for (let x = 23; x <= 41; x += 1) {
    putSolid(x, 3, T.wall);
    putSolid(x, 15, T.wall);
  }
  for (let y = 3; y <= 15; y += 1) {
    putSolid(23, y, T.wall);
    putSolid(41, y, T.wall);
  }
  putSolid(31, 15, state.gateOpen ? -1 : T.gateClosed);
  putSolid(32, 15, state.gateOpen ? -1 : T.gateClosed);
  putDecor(31, 15, state.gateOpen ? T.gateOpen : -1);
  putDecor(32, 15, state.gateOpen ? T.gateOpen : -1);
  for (const [x, y] of [
    [26, 6],
    [38, 6],
    [26, 12],
    [38, 12],
    [32, 8],
  ]) {
    putDecor(x, y, T.pillar);
  }
  for (let x = 28; x <= 36; x += 1) {
    putGround(x, 9, T.altar);
  }
  for (const [x0, y0, x1, y1] of [
    [3, 4, 13, 13],
    [3, 30, 14, 43],
    [50, 3, 60, 14],
    [50, 31, 60, 42],
    [17, 7, 21, 14],
    [43, 18, 50, 24],
    [18, 39, 30, 43],
  ]) {
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const edge = x === x0 || x === x1 || y === y0 || y === y1;
        if (edge && (x * 5 + y * 7) % 3 !== 0) putSolid(x, y, T.tree);
        else if ((x * 11 + y * 17) % 19 === 0) putDecor(x, y, T.fern);
      }
    }
  }

  for (const [x0, y0, x1, y1] of [
    [7, 17, 16, 18],
    [42, 35, 51, 37],
    [55, 16, 59, 25],
    [18, 25, 23, 31],
  ]) {
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        putSolid(x, y, T.bramble);
      }
    }
  }

  for (let y = 35; y <= 51; y += 1) {
    for (let x = 56; x <= 73; x += 1) {
      const shimmer = (x * 7 + y * 11) % 9;
      solid[y][x] = -1;
      putGround(x, y, shimmer < 2 ? T.starFlowers : shimmer < 5 ? T.moonGrass : T.moss);
    }
  }

  for (let y = 35; y <= 51; y += 1) {
    for (let x = 56; x <= 73; x += 1) {
      const edge = x === 56 || x === 73 || y === 35 || y === 51;
      const westOpening = x === 56 && y >= 37 && y <= 39;
      const northOpening = y === 35 && x >= 66 && x <= 68;
      const southOpening = y === 51 && x >= 64 && x <= 70;
      if (edge && !westOpening && !northOpening && !southOpening) putSolid(x, y, T.moonVine);
    }
  }

  const moonwell = { x: 66, y: 44 };
  for (let y = 40; y <= 48; y += 1) {
    for (let x = 62; x <= 70; x += 1) {
      const dist = Math.hypot(x - moonwell.x, y - moonwell.y);
      if (dist <= 1.55) {
        putGround(x, y, T.moonWater);
        putSolid(x, y, T.moonWater);
      } else if (dist <= 4.25) {
        solid[y][x] = -1;
        putGround(x, y, (x + y) % 3 === 0 ? T.moonSteps : T.moonStone);
      }
    }
  }
  for (const [x, y] of [
    [64, 45],
    [68, 46],
    [66, 42],
    [66, 43],
  ]) {
    solid[y][x] = -1;
    putGround(x, y, T.lilyPad);
  }
  for (const [x, y] of [
    [60, 36],
    [72, 41],
    [59, 49],
    [70, 50],
  ]) {
    putSolid(x, y, T.moonCrystal);
  }
  for (const [x, y] of [
    [62, 37],
    [69, 39],
    [58, 44],
    [72, 47],
  ]) {
    putDecor(x, y, T.glowMoss);
  }

  for (const [x0, y0, x1, y1] of road) {
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        if (ground[y]?.[x] === T.water) continue;
        solid[y][x] = -1;
        putGround(x, y, (x + y) % 5 === 0 ? T.roots : T.dirt);
      }
    }
  }

  for (const [cx, cy] of [
    [18, 17],
    [47, 29],
    [10, 8],
    [53, 20],
  ]) {
    for (let y = cy - 1; y <= cy + 1; y += 1) {
      for (let x = cx - 1; x <= cx + 1; x += 1) {
        if (ground[y]?.[x] === T.water) continue;
        solid[y][x] = -1;
        putGround(x, y, x === cx && y === cy ? T.runeFloor : T.crackedStone);
      }
    }
    putDecor(cx, cy - 1, T.glowMoss);
    putDecor(cx - 1, cy + 1, T.mistStone);
    putDecor(cx + 1, cy + 1, T.emberRock);
  }

  for (let i = 0; i < 120; i += 1) {
    const x = 2 + ((i * 13) % (WORLD_W - 4));
    const y = 2 + ((i * 19) % (WORLD_H - 4));
    if (solid[y][x] === -1 && ground[y][x] !== T.water && (x < 22 || x > 42 || y > 16)) {
      if (i % 6 === 0) putDecor(x, y, T.flowers);
      else if (i % 5 === 0) putDecor(x, y, T.glowMoss);
      else if (i % 4 === 0) putDecor(x, y, T.roots);
    }
  }

  return { ground, solid, decor };
}

function listSpawns(state) {
  const shards = [
    { id: "hollow", x: 12, y: 20 },
    { id: "stream", x: 54, y: 31 },
    { id: "thicket", x: 7, y: 38 },
    { id: "tower", x: 54, y: 11 },
    { id: "causeway", x: 31, y: 22 },
  ].filter((item) => !state.shards.includes(item.id));

  const enemies = [
    { kind: "thornling", x: 18, y: 21 },
    { kind: "thornling", x: 43, y: 22 },
    { kind: "thornling", x: 48, y: 35 },
    { kind: "thornling", x: 52, y: 12 },
    { kind: "thornling", x: 36, y: 25 },
    { kind: "thornling", x: 57, y: 33 },
    { kind: "thornling", x: 14, y: 14 },
    { kind: "wisp", x: 20, y: 18 },
    { kind: "wisp", x: 45, y: 29 },
    { kind: "wisp", x: 54, y: 20 },
    { kind: "moonmoth", x: 63, y: 39 },
    { kind: "moonmoth", x: 70, y: 46 },
  ];

  const sigils = [
    { id: "root-sigil", x: 19, y: 18 },
    { id: "stream-sigil", x: 46, y: 29 },
    { id: "tower-sigil", x: 10, y: 8 },
    { id: "thorn-sigil", x: 53, y: 20 },
  ].filter((item) => !state.sigils.includes(item.id));

  const obelisks = [
    { id: "south-well", kind: "well", x: 8, y: 35 },
    { id: "mist-obelisk", kind: "obelisk", x: 49, y: 28 },
    { id: "root-obelisk", kind: "obelisk", x: 18, y: 18 },
    { id: "moonwell", kind: "moonwell", x: 66, y: 43 },
  ];

  const loreStones = [
    { id: "pulse", x: 13, y: 36, text: "Sigils sharpen your Pulse." },
    { id: "wisp", x: 45, y: 30, text: "Wisps flee close blades." },
    { id: "north", x: 29, y: 18, text: "Four shards wake the gate." },
    { id: "moonwell", x: 61, y: 46, text: "Moon blooms refill ward and pulse." },
  ];

  const moonBlooms = [
    { id: "moon-bloom-west", x: 62, y: 38 },
    { id: "moon-bloom-ring", x: 71, y: 45 },
    { id: "moon-bloom-south", x: 64, y: 50 },
  ].filter((item) => !state.moonBlooms.includes(item.id));

  const chests = [
    { id: "sunken-key", x: 55, y: 38, content: "key" },
    { id: "root-cache", x: 9, y: 12, content: "heart" },
    { id: "north-cache", x: 36, y: 16, content: "potion" },
    { id: "trail-salve", x: 15, y: 36, content: "heart" },
    { id: "stream-salve", x: 47, y: 33, content: "heart" },
    { id: "moon-cache", x: 72, y: 46, content: "potion" },
  ];

  const beacons = [
    { id: "camp", x: 6, y: 37 },
    { id: "causeway", x: 32, y: 22 },
    { id: "tower", x: 50, y: 12 },
    { id: "moonwell", x: 60, y: 46 },
  ];

  return { shards, enemies, sigils, obelisks, loreStones, moonBlooms, chests, beacons };
}

class EmberScene extends Phaser.Scene {
  init(data = {}) {
    this.autoStartOnCreate = Boolean(data.autoStart);
  }

  constructor() {
    super("emberwild");
    this.activePlay = false;
    this.pausedByOverlay = false;
    this.facing = { x: 0, y: 1, key: "down" };
    this.nextAttackAt = 0;
    this.nextDashAt = 0;
    this.nextPulseAt = 0;
    this.dashUntil = 0;
    this.invulnerableUntil = 0;
    this.endMode = "restart";
    this.currentMusic = null;
    this.bossFightActive = false;
    this.bossRevealShown = false;
    this.audioEnabled = true;
    this.lowFx = false;
    this.fxScale = 0.7;
    this.maxBurstParticles = 16;
    this.autoStartOnCreate = false;
  }

  preload() {
    this.load.image("tiles", ASSETS.tiles);
    this.load.image("key-art", ASSETS.keyArt);
    this.load.spritesheet("objects", ASSETS.objects, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("player", ASSETS.player, { frameWidth: 40, frameHeight: 48 });
    this.load.spritesheet("thornling", ASSETS.thornling, { frameWidth: 32, frameHeight: 34 });
    this.load.spritesheet("wisp", ASSETS.wisp, { frameWidth: 34, frameHeight: 34 });
    this.load.spritesheet("moonmoth", ASSETS.moonmoth, { frameWidth: 38, frameHeight: 34 });
    this.load.spritesheet("ashwarden", ASSETS.ashwarden, { frameWidth: 72, frameHeight: 72 });
    this.load.spritesheet("slash", ASSETS.slash, { frameWidth: 64, frameHeight: 64 });
    this.load.audio("bgm-explore", ASSETS.bgmExplore);
    this.load.audio("bgm-boss", ASSETS.bgmBoss);
    this.load.audio("sfx-slash", ASSETS.sfxSlash);
    this.load.audio("sfx-dash", ASSETS.sfxDash);
    this.load.audio("sfx-pickup", ASSETS.sfxPickup);
    this.load.audio("sfx-gate", ASSETS.sfxGate);
    this.load.audio("sfx-beacon", ASSETS.sfxBeacon);
    this.load.audio("sfx-enemy-hurt", ASSETS.sfxEnemyHurt);
    this.load.audio("sfx-player-hit", ASSETS.sfxPlayerHit);
    this.load.audio("sfx-heal", ASSETS.sfxHeal);
    this.load.audio("sfx-confirm", ASSETS.sfxConfirm);
    this.load.audio("sfx-boss-die", ASSETS.sfxBossDie);
  }

  create() {
    this.state = loadState();
    this.configurePerformance();
    this.worldData = makeWorld(this.state);
    this.createAnimations();
    this.createMap();
    this.createEntities();
    this.createAtmosphere();
    this.createAudio();
    this.createInput();
    this.createCamera();
    this.updateHud();
    ui.startButton.disabled = false;
    ui.resetButton.disabled = false;
    this.setPlayActive(false);
    window.__emberScene = this;
    if (this.autoStartOnCreate) {
      this.time.delayedCall(0, () => this.startAdventure());
    }
  }

  configurePerformance() {
    this.lowFx = wantsReducedMotion() || compactViewport();
    this.fxScale = wantsReducedMotion() ? 0.34 : this.lowFx ? 0.48 : 0.72;
    this.maxBurstParticles = wantsReducedMotion() ? 6 : this.lowFx ? 10 : 18;
  }

  createAnimations() {
    const makeWalk = (key, start) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers("player", { start, end: start + 2 }),
        frameRate: 9,
        repeat: -1,
      });
    };
    makeWalk("walk-down", 0);
    makeWalk("walk-left", 3);
    makeWalk("walk-right", 6);
    makeWalk("walk-up", 9);

    this.anims.create({
      key: "thornling-walk",
      frames: this.anims.generateFrameNumbers("thornling", { start: 0, end: 3 }),
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: "wisp-float",
      frames: this.anims.generateFrameNumbers("wisp", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "moonmoth-flutter",
      frames: this.anims.generateFrameNumbers("moonmoth", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "ashwarden-breathe",
      frames: this.anims.generateFrameNumbers("ashwarden", { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1,
    });
    this.anims.create({
      key: "slash-swing",
      frames: this.anims.generateFrameNumbers("slash", { start: 0, end: 4 }),
      frameRate: 24,
      repeat: 0,
    });
  }

  createAudio() {
    try {
      this.audioEnabled = localStorage.getItem(AUDIO_STORAGE_KEY) !== "off";
    } catch {
      this.audioEnabled = true;
    }
    this.music = {
      explore: this.sound.add("bgm-explore", { loop: true, volume: 0.26 }),
      boss: this.sound.add("bgm-boss", { loop: true, volume: 0.32 }),
    };
    this.sfx = {
      slash: this.sound.add("sfx-slash", { volume: 0.42 }),
      dash: this.sound.add("sfx-dash", { volume: 0.32 }),
      pickup: this.sound.add("sfx-pickup", { volume: 0.48 }),
      gate: this.sound.add("sfx-gate", { volume: 0.54 }),
      beacon: this.sound.add("sfx-beacon", { volume: 0.34 }),
      enemyHurt: this.sound.add("sfx-enemy-hurt", { volume: 0.42 }),
      playerHit: this.sound.add("sfx-player-hit", { volume: 0.35 }),
      heal: this.sound.add("sfx-heal", { volume: 0.3 }),
      confirm: this.sound.add("sfx-confirm", { volume: 0.28 }),
      bossDie: this.sound.add("sfx-boss-die", { volume: 0.5 }),
    };
    this.updateAudioButton();
  }

  createAtmosphere() {
    const count = this.lowFx ? 14 : 24;
    for (let i = 0; i < count; i += 1) {
      const x = 56 + ((i * 181) % (WORLD_PX_W - 112));
      const y = 72 + ((i * 307) % (WORLD_PX_H - 144));
      const ember = this.add.circle(x, y, 1 + (i % 2), i % 4 === 0 ? 0xffb84e : 0x64c6b2, 0.1 + (i % 4) * 0.025);
      ember.setDepth(10);
      if (!this.lowFx) ember.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: ember,
        y: y - 12 - (i % 3) * 4,
        alpha: 0.035,
        yoyo: true,
        repeat: -1,
        duration: 2300 + (i % 7) * 320,
        delay: (i % 9) * 120,
        ease: "sine.inOut",
      });
    }
  }

  createMap() {
    this.map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: WORLD_W, height: WORLD_H });
    const tiles = this.map.addTilesetImage("tiles", "tiles", TILE, TILE, 0, 0);
    this.groundLayer = this.map.createBlankLayer("ground", tiles, 0, 0);
    this.decorLayer = this.map.createBlankLayer("decor", tiles, 0, 0);
    this.solidLayer = this.map.createBlankLayer("solid", tiles, 0, 0);

    for (let y = 0; y < WORLD_H; y += 1) {
      for (let x = 0; x < WORLD_W; x += 1) {
        this.groundLayer.putTileAt(this.worldData.ground[y][x], x, y);
        if (this.worldData.decor[y][x] !== -1) this.decorLayer.putTileAt(this.worldData.decor[y][x], x, y);
        if (this.worldData.solid[y][x] !== -1) this.solidLayer.putTileAt(this.worldData.solid[y][x], x, y);
      }
    }
    this.groundLayer.setDepth(0);
    this.decorLayer.setDepth(2);
    this.solidLayer.setDepth(3);
    this.solidLayer.setCollision([
      T.water,
      T.wall,
      T.tree,
      T.bramble,
      T.gateClosed,
      T.pillar,
      T.emberVine,
      T.pit,
      T.moonWater,
      T.moonCrystal,
      T.moonVine,
    ]);
  }

  createEntities() {
    const start = this.state.lastCheckpoint ?? { x: 192, y: 236 };
    this.player = this.physics.add.sprite(start.x, start.y, "player", 1);
    this.player.setSize(18, 24).setOffset(11, 20).setDepth(20);
    this.player.setCollideWorldBounds(true);

    this.collectibles = this.physics.add.group({ allowGravity: false, immovable: true });
    this.chests = this.physics.add.staticGroup();
    this.beacons = this.physics.add.staticGroup();
    this.obelisks = this.physics.add.staticGroup();
    this.loreStones = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group({ allowGravity: false });
    this.bossGroup = this.physics.add.group({ allowGravity: false });

    const spawns = listSpawns(this.state);
    for (const shard of spawns.shards) {
      const pos = tileCenter(shard.x, shard.y);
      const sprite = this.collectibles.create(pos.x, pos.y, "objects", OBJECT_FRAME.shard);
      sprite.setData("type", "shard");
      sprite.setData("id", shard.id);
      sprite.setCircle(11, 5, 5);
      sprite.setDepth(12);
      this.tweens.add({
        targets: sprite,
        y: pos.y - 5,
        yoyo: true,
        repeat: -1,
        duration: 900 + shard.x * 11,
        ease: "sine.inOut",
      });
    }

    for (const sigil of spawns.sigils) {
      const pos = tileCenter(sigil.x, sigil.y);
      const sprite = this.collectibles.create(pos.x, pos.y, "objects", OBJECT_FRAME.sigil);
      sprite.setData("type", "sigil");
      sprite.setData("id", sigil.id);
      sprite.setCircle(11, 5, 5);
      sprite.setDepth(12);
      this.tweens.add({
        targets: sprite,
        angle: 360,
        y: pos.y - 4,
        yoyo: true,
        repeat: -1,
        duration: 1200 + sigil.x * 9,
        ease: "sine.inOut",
      });
    }

    for (const bloom of spawns.moonBlooms) {
      const pos = tileCenter(bloom.x, bloom.y);
      const sprite = this.collectibles.create(pos.x, pos.y, "objects", OBJECT_FRAME.moonBloom);
      sprite.setData("type", "moonBloom");
      sprite.setData("id", bloom.id);
      sprite.setCircle(10, 6, 6);
      sprite.setDepth(12);
      this.tweens.add({
        targets: sprite,
        scale: 1.08,
        y: pos.y - 6,
        yoyo: true,
        repeat: -1,
        duration: 1050 + bloom.x * 5,
        ease: "sine.inOut",
      });
    }

    for (const chest of spawns.chests) {
      const pos = tileCenter(chest.x, chest.y);
      const opened = this.state.chests.includes(chest.id);
      const sprite = this.chests.create(pos.x, pos.y, "objects", opened ? OBJECT_FRAME.chestOpen : OBJECT_FRAME.chestClosed);
      sprite.setData("id", chest.id);
      sprite.setData("content", chest.content);
      sprite.setData("opened", opened);
      sprite.setDepth(12);
      sprite.refreshBody();
    }

    for (const beacon of spawns.beacons) {
      const pos = tileCenter(beacon.x, beacon.y);
      const sprite = this.beacons.create(pos.x, pos.y, "objects", OBJECT_FRAME.beacon);
      sprite.setData("id", beacon.id);
      sprite.setDepth(11);
      sprite.refreshBody();
      this.tweens.add({ targets: sprite, scale: 1.1, yoyo: true, repeat: -1, duration: 1000, ease: "sine.inOut" });
    }

    for (const site of spawns.obelisks) {
      const pos = tileCenter(site.x, site.y);
      const used = this.state.obelisks.includes(site.id);
      const frame = site.kind === "well" ? OBJECT_FRAME.emberWell : site.kind === "moonwell" ? OBJECT_FRAME.moonWell : OBJECT_FRAME.obelisk;
      const sprite = this.obelisks.create(pos.x, pos.y, "objects", frame);
      sprite.setData("id", site.id);
      sprite.setData("kind", site.kind);
      sprite.setData("used", used);
      sprite.setDepth(12);
      if (used) sprite.setAlpha(0.68).setTint(0x8daaa2);
      sprite.refreshBody();
    }

    for (const stone of spawns.loreStones) {
      const pos = tileCenter(stone.x, stone.y);
      const sprite = this.loreStones.create(pos.x, pos.y, "objects", OBJECT_FRAME.loreStone);
      sprite.setData("id", stone.id);
      sprite.setData("text", stone.text);
      sprite.setDepth(12);
      sprite.refreshBody();
    }

    for (const spawn of spawns.enemies) {
      const pos = tileCenter(spawn.x, spawn.y);
      const isWisp = spawn.kind === "wisp";
      const isMoonmoth = spawn.kind === "moonmoth";
      const enemy = this.enemies.create(pos.x, pos.y, isMoonmoth ? "moonmoth" : isWisp ? "wisp" : "thornling", 0);
      enemy.setData("kind", spawn.kind);
      enemy.setData("hp", isMoonmoth ? MOONMOTH_HP : isWisp ? WISP_HP : ENEMY_HP);
      enemy.setData("home", { x: pos.x, y: pos.y });
      enemy.setData("nextThink", 0);
      enemy.setData("nextBolt", 0);
      enemy.setData("touchAt", 0);
      if (isMoonmoth) {
        enemy.setCircle(12, 7, 6).setDepth(18);
        enemy.play("moonmoth-flutter");
      } else if (isWisp) {
        enemy.setCircle(12, 5, 5).setDepth(18);
        enemy.play("wisp-float");
      } else {
        enemy.setSize(22, 22).setOffset(5, 10).setDepth(18);
        enemy.play("thornling-walk");
      }
    }

    if (!this.state.bossDefeated) {
      const bossPos = tileCenter(32, 8);
      const boss = this.bossGroup.create(bossPos.x, bossPos.y, "ashwarden", 0);
      boss.setData("hp", BOSS_HP);
      boss.setData("maxHp", BOSS_HP);
      boss.setData("touchAt", 0);
      boss.setData("awake", false);
      boss.setSize(40, 44).setOffset(16, 25).setDepth(19);
      boss.play("ashwarden-breathe");
    }

    this.physics.world.setBounds(0, 0, WORLD_PX_W, WORLD_PX_H);
    this.physics.add.collider(this.player, this.solidLayer);
    this.physics.add.collider(this.enemies, this.solidLayer);
    this.physics.add.collider(this.bossGroup, this.solidLayer);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.overlap(this.player, this.collectibles, (_, item) => this.collectItem(item));
    this.physics.add.overlap(this.player, this.enemies, (_, enemy) => this.touchEnemy(enemy));
    this.physics.add.overlap(this.player, this.bossGroup, (_, boss) => this.touchBoss(boss));
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
      attack: "SPACE",
      interact: "E",
      dash: "SHIFT",
      pause: "ESC",
      pulse: "Q",
    });
    this.pointerAttack = false;
    focusGameCanvas(this.game);
    if (!this.game.canvas.dataset.emberFocusBound) {
      this.game.canvas.dataset.emberFocusBound = "true";
      this.game.canvas.addEventListener("pointerdown", () => focusGameCanvas(this.game));
    }
    this.input.on("pointerdown", (pointer) => {
      if (pointer.event?.target?.tagName === "CANVAS") this.pointerAttack = true;
    });
  }

  createCamera() {
    this.cameras.main.setBounds(0, 0, WORLD_PX_W, WORLD_PX_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.45);
    this.scale.on("resize", (gameSize) => {
      this.cameras.main.setSize(gameSize.width, gameSize.height);
    });
  }

  setPlayActive(active) {
    this.activePlay = active;
    ui.hud.hidden = !active;
    if (!active && this.player) {
      this.player.setVelocity(0, 0);
      resetInputState();
    }
  }

  startAdventure() {
    if (!this.state || !this.player) return;
    resetInputState();
    focusGameCanvas(this.game);
    ui.menu.hidden = true;
    ui.endScreen.hidden = true;
    this.playSfx("confirm");
    this.playMusic(this.bossFightActive ? "boss" : "explore");
    this.pausedByOverlay = false;
    this.setPlayActive(true);
    this.updateHud();
  }

  update(time, delta) {
    if (!this.activePlay || this.pausedByOverlay) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.pause) || consumePress("pause")) {
      this.showPause();
      return;
    }

    this.updatePlayer(time);
    this.updateEnemies(time, delta);
    this.updateBoss(time, delta);
    this.updateInteractions();
    this.updateAreaName();
  }

  updatePlayer(time) {
    const move = this.readMoveVector();
    const moving = move.x !== 0 || move.y !== 0;
    if (moving) {
      this.facing = this.vectorToFacing(move);
    }

    const dashPressed = Phaser.Input.Keyboard.JustDown(this.keys.dash) || consumeTap("dash") || consumePress("dash");
    if (dashPressed && moving && time >= this.nextDashAt) {
      this.dashUntil = time + DASH_TIME;
      this.nextDashAt = time + DASH_COOLDOWN;
      this.cameras.main.shake(70, 0.004);
      this.playSfx("dash");
      this.burst(this.player.x, this.player.y + 10, 0x64c6b2, 8, 42);
    }

    const speed = time < this.dashUntil ? DASH_SPEED : PLAYER_SPEED;
    this.player.setVelocity(move.x * speed, move.y * speed);

    if (moving) {
      this.player.anims.play(`walk-${this.facing.key}`, true);
    } else {
      this.player.anims.stop();
      this.player.setFrame({ down: 1, left: 4, right: 7, up: 10 }[this.facing.key]);
    }

    const attackPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.attack) || consumeTap("attack") || consumePress("attack") || this.pointerAttack;
    this.pointerAttack = false;
    if (attackPressed && time >= this.nextAttackAt) {
      this.attack(time);
    }

    const pulsePressed = Phaser.Input.Keyboard.JustDown(this.keys.pulse) || consumeTap("pulse") || consumePress("pulse");
    if (pulsePressed) this.useEmberPulse(time);

    if (time < this.invulnerableUntil) {
      this.player.setAlpha(time % 120 < 60 ? 0.48 : 1);
    } else {
      this.player.setAlpha(1);
    }
  }

  readMoveVector() {
    let x = 0;
    let y = 0;
    if (this.cursors.left.isDown || this.keys.left.isDown || keyboardState.down.has("left") || touchState.left) x -= 1;
    if (this.cursors.right.isDown || this.keys.right.isDown || keyboardState.down.has("right") || touchState.right) x += 1;
    if (this.cursors.up.isDown || this.keys.up.isDown || keyboardState.down.has("up") || touchState.up) y -= 1;
    if (this.cursors.down.isDown || this.keys.down.isDown || keyboardState.down.has("down") || touchState.down) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = Math.SQRT1_2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  vectorToFacing(vec) {
    if (Math.abs(vec.x) > Math.abs(vec.y)) return vec.x < 0 ? { x: -1, y: 0, key: "left" } : { x: 1, y: 0, key: "right" };
    return vec.y < 0 ? { x: 0, y: -1, key: "up" } : { x: 0, y: 1, key: "down" };
  }

  attack(time) {
    this.nextAttackAt = time + ATTACK_COOLDOWN;
    this.playSfx("slash");
    const ox = this.facing.x * 34;
    const oy = this.facing.y * 34;
    const slash = this.add.sprite(this.player.x + ox, this.player.y + oy, "slash", 0);
    slash.setDepth(30);
    slash.setAngle({ right: 0, down: 90, left: 180, up: 270 }[this.facing.key]);
    slash.play("slash-swing");
    slash.once("animationcomplete", () => slash.destroy());

    const struck = new Set();
    const hit = (target, amount) => {
      if (!target?.active || target.getData?.("dying") || struck.has(target)) return;
      const dx = target.x - this.player.x;
      const dy = target.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      const dot = dx * this.facing.x + dy * this.facing.y;
      if (dist <= 70 && dot > -10) {
        struck.add(target);
        this.damageTarget(target, amount);
      }
    };
    this.enemies.children.iterate((enemy) => hit(enemy, 1));
    this.bossGroup.children.iterate((boss) => hit(boss, 1));
  }

  useEmberPulse(time) {
    if (time < this.nextPulseAt) return;
    const sigilBoost = this.state.sigils.length;
    const pulseCooldown = Math.max(850, PULSE_COOLDOWN - sigilBoost * 160);
    this.nextPulseAt = time + pulseCooldown;
    this.playSfx("beacon");
    this.burst(this.player.x, this.player.y, 0x64c6b2, 12 + sigilBoost, 76 + sigilBoost * 6);

    const ring = this.add.circle(this.player.x, this.player.y, 18, 0x64c6b2, 0.04);
    ring.setStrokeStyle(2, 0x64c6b2, 0.92).setDepth(36);
    if (!this.lowFx) ring.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: ring,
      scale: 7 + sigilBoost * 0.35,
      alpha: 0,
      duration: 640,
      ease: "sine.out",
      onComplete: () => ring.destroy(),
    });

    const target = this.findPulseTarget();
    if (!target) {
      this.floatText(this.player.x, this.player.y - 28, "No echo nearby");
      return;
    }

    const beam = this.add.graphics();
    beam.setDepth(35);
    if (!this.lowFx) beam.setBlendMode(Phaser.BlendModes.ADD);
    beam.lineStyle(3, 0x64c6b2, 0.62);
    beam.beginPath();
    beam.moveTo(this.player.x, this.player.y - 12);
    beam.lineTo(target.x, target.y - 8);
    beam.strokePath();

    const marker = this.add.circle(target.x, target.y, 14, 0xffd479, 0.06);
    marker.setStrokeStyle(2, 0xffd479, 0.95).setDepth(36);
    if (!this.lowFx) marker.setBlendMode(Phaser.BlendModes.ADD);
    this.floatText(target.x, target.y - 26, target.label);
    this.tweens.add({
      targets: [beam, marker],
      alpha: 0,
      duration: 760,
      ease: "sine.in",
      onComplete: () => {
        beam.destroy();
        marker.destroy();
      },
    });
  }

  findPulseTarget() {
    const candidates = [];
    const addCandidate = (x, y, label, priority = 0) => {
      candidates.push({ x, y, label, score: distance(this.player, { x, y }) + priority });
    };

    this.collectibles.children.iterate((item) => {
      if (!item?.active || item.getData("type") !== "shard") return;
      addCandidate(item.x, item.y, "Shard echo", -80);
    });

    this.collectibles.children.iterate((item) => {
      if (!item?.active || item.getData("type") !== "sigil") return;
      addCandidate(item.x, item.y, "Sigil echo", -90);
    });

    this.collectibles.children.iterate((item) => {
      if (!item?.active || item.getData("type") !== "moonBloom") return;
      addCandidate(item.x, item.y, "Moon bloom", -60);
    });

    this.chests.children.iterate((chest) => {
      if (!chest?.active || chest.getData("opened")) return;
      addCandidate(chest.x, chest.y, chest.getData("content") === "key" ? "Key cache" : "Cache echo", 20);
    });

    this.obelisks.children.iterate((site) => {
      if (!site?.active || site.getData("used")) return;
      addCandidate(site.x, site.y, site.getData("kind") === "well" ? "Ember well" : "Rune echo", -70);
    });

    if (!this.state.gateOpen && this.state.key && this.state.shards.length >= REQUIRED_SHARDS) {
      const gate = tileCenter(31.5, 15);
      addCandidate(gate.x, gate.y, "Gate echo", -160);
    }

    this.bossGroup.children.iterate((boss) => {
      if (!boss?.active || !this.state.gateOpen) return;
      addCandidate(boss.x, boss.y, "Guardian echo", -220);
    });

    candidates.sort((a, b) => a.score - b.score);
    return candidates[0] ?? null;
  }

  damageTarget(target, amount) {
    target = this.resolveOverlapTarget(target);
    if (!target?.active || target.getData?.("dying") || !target.getData || !target.setData) return;
    const textureKey = target.texture?.key ?? "";
    const x = target.x;
    const y = target.y;
    const hp = Math.max(0, (target.getData("hp") ?? 1) - amount);
    target.setData("hp", hp);
    target.setTintFill(0xffe0a0);
    this.playSfx("enemyHurt");
    this.burst(x, y, 0xffb84e, 9, 48);
    this.time.delayedCall(80, () => {
      if (target?.active && !target.getData?.("dying")) target.clearTint();
    });
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, x, y);
    if (target.body && target.setVelocity) target.setVelocity(Math.cos(angle) * 170, Math.sin(angle) * 170);

    if (hp > 0) return;
    target.setData("dying", true);
    if (target.body) {
      target.body.enable = false;
      target.setVelocity?.(0, 0);
    }
    if (textureKey === "ashwarden") {
      this.defeatBoss(target);
    } else {
      this.defeatEnemy(target, x, y);
    }
  }

  defeatEnemy(enemy, x, y) {
    markEnemyDefeated(this.state);
    this.dropMaybe(x, y);
    this.burst(x, y, 0x64c6b2, 11, 54);
    this.floatText(x, y - 18, "Ember released");
    enemy.clearTint?.();
    this.tweens.add({
      targets: enemy,
      alpha: 0,
      scale: 0.68,
      duration: 140,
      ease: "sine.in",
      onComplete: () => enemy?.destroy?.(),
    });
    this.updateHud();
  }

  dropMaybe(x, y) {
    const wounded = this.state.health <= Math.ceil(MAX_HEALTH * 0.55);
    if (!wounded && (this.state.enemiesDefeated + Math.round(x + y)) % 2 !== 0) return;
    const item = this.collectibles.create(x, y, "objects", OBJECT_FRAME.heart);
    item.setData("type", "heart");
    item.setCircle(10, 6, 6);
    item.setDepth(12);
  }

  updateEnemies(time) {
    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active || enemy.getData?.("dying")) return;
      if (enemy.getData("kind") === "moonmoth") {
        this.updateMoonmoth(enemy, time);
        return;
      }
      if (enemy.getData("kind") === "wisp") {
        this.updateWisp(enemy, time);
        return;
      }
      const distToPlayer = distance(enemy, this.player);
      if (distToPlayer < 235) {
        this.physics.moveToObject(enemy, this.player, distToPlayer < 56 ? 24 : 68);
      } else if (time > enemy.getData("nextThink")) {
        enemy.setData("nextThink", time + Phaser.Math.Between(900, 1900));
        const home = enemy.getData("home");
        const roam = new Phaser.Math.Vector2(home.x + Phaser.Math.Between(-80, 80), home.y + Phaser.Math.Between(-60, 60));
        this.physics.moveTo(enemy, roam.x, roam.y, 30);
      }
      enemy.setDepth(enemy.y);
    });
  }

  updateMoonmoth(moth, time) {
    const distToPlayer = distance(moth, this.player);
    const home = moth.getData("home");
    if (distToPlayer < 118) {
      const away = Phaser.Math.Angle.Between(this.player.x, this.player.y, moth.x, moth.y);
      moth.setVelocity(Math.cos(away) * 86, Math.sin(away) * 86);
    } else if (distToPlayer < 330) {
      const angle = Phaser.Math.Angle.Between(moth.x, moth.y, this.player.x, this.player.y) + Math.sin(time / 280) * 0.55;
      moth.setVelocity(Math.cos(angle) * 46, Math.sin(angle) * 46);
    } else if (time > moth.getData("nextThink")) {
      moth.setData("nextThink", time + Phaser.Math.Between(850, 1550));
      this.physics.moveTo(moth, home.x + Phaser.Math.Between(-110, 110), home.y + Phaser.Math.Between(-80, 80), 34);
    }
    if (distToPlayer < 345 && time > (moth.getData("nextBolt") ?? 0)) {
      moth.setData("nextBolt", time + Phaser.Math.Between(1900, 2750));
      this.spawnMoonBolt(moth);
    }
    moth.setDepth(moth.y);
  }

  updateWisp(wisp, time) {
    const distToPlayer = distance(wisp, this.player);
    if (distToPlayer < 108) {
      const away = Phaser.Math.Angle.Between(this.player.x, this.player.y, wisp.x, wisp.y);
      wisp.setVelocity(Math.cos(away) * 58, Math.sin(away) * 58);
    } else if (distToPlayer < 310) {
      this.physics.moveToObject(wisp, this.player, 38);
    } else if (time > wisp.getData("nextThink")) {
      wisp.setData("nextThink", time + Phaser.Math.Between(950, 1700));
      const home = wisp.getData("home");
      this.physics.moveTo(wisp, home.x + Phaser.Math.Between(-95, 95), home.y + Phaser.Math.Between(-75, 75), 24);
    }
    if (distToPlayer < 330 && time > (wisp.getData("nextBolt") ?? 0)) {
      wisp.setData("nextBolt", time + Phaser.Math.Between(1650, 2300));
      this.spawnWispBolt(wisp);
    }
    wisp.setDepth(wisp.y);
  }

  spawnWispBolt(wisp) {
    if (!wisp?.active || wisp.getData?.("dying") || !this.player?.active) return;
    const angle = Phaser.Math.Angle.Between(wisp.x, wisp.y, this.player.x, this.player.y);
    const bolt = this.add.circle(wisp.x, wisp.y, 4, 0x87f6db, 0.92);
    bolt.setData("wispBolt", true);
    bolt.setDepth(24);
    if (!this.lowFx) bolt.setBlendMode(Phaser.BlendModes.ADD);
    this.physics.add.existing(bolt);
    bolt.body.setCircle(4);
    bolt.body.setVelocity(Math.cos(angle) * 148, Math.sin(angle) * 148);
    this.physics.add.overlap(this.player, bolt, () => {
      if (!bolt.active) return;
      bolt.destroy();
      this.damagePlayer(1);
    });
    this.time.delayedCall(1350, () => {
      if (bolt?.active) bolt.destroy();
    });
  }

  spawnMoonBolt(moth) {
    if (!moth?.active || moth.getData?.("dying") || !this.player?.active) return;
    const angle = Phaser.Math.Angle.Between(moth.x, moth.y, this.player.x, this.player.y);
    const bolt = this.add.circle(moth.x, moth.y, 5, 0x9af6ff, 0.9);
    bolt.setData("moonBolt", true);
    bolt.setDepth(24);
    if (!this.lowFx) bolt.setBlendMode(Phaser.BlendModes.ADD);
    this.physics.add.existing(bolt);
    bolt.body.setCircle(5);
    bolt.body.setVelocity(Math.cos(angle) * 132, Math.sin(angle) * 132);
    this.tweens.add({
      targets: bolt,
      scale: 1.35,
      alpha: 0.48,
      yoyo: true,
      repeat: -1,
      duration: 260,
      ease: "sine.inOut",
    });
    this.physics.add.overlap(this.player, bolt, () => {
      if (!bolt.active) return;
      bolt.destroy();
      this.damagePlayer(1);
    });
    this.time.delayedCall(1450, () => {
      if (bolt?.active) bolt.destroy();
    });
  }

  updateBoss(time) {
    this.bossGroup.children.iterate((boss) => {
      if (!boss?.active) return;
      const distToPlayer = distance(boss, this.player);
      const awake = boss.getData("awake") || distToPlayer < 320 || this.state.gateOpen;
      boss.setData("awake", awake);
      if (!awake) return;
      if (!this.state.gateOpen) return;
      this.beginBossFight(boss);
      this.updateBossHud(boss);
      this.physics.moveToObject(boss, this.player, distToPlayer < 82 ? 20 : 54);
      boss.setDepth(boss.y);
      if (time % 1350 < 18 && distToPlayer < 250) this.spawnBossEmber(boss);
    });
  }

  spawnBossEmber(boss) {
    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
    const ember = this.add.circle(boss.x, boss.y, 5, 0xffb84e, 0.95);
    ember.setDepth(24);
    this.physics.add.existing(ember);
    ember.body.setCircle(5);
    ember.body.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 120);
    this.physics.add.overlap(this.player, ember, () => {
      ember.destroy();
      this.damagePlayer(1);
    });
    this.time.delayedCall(1500, () => ember.destroy());
  }

  resolveOverlapTarget(target) {
    return target?.gameObject ?? target;
  }

  canTakeContactDamage(target) {
    return Boolean(
      this.activePlay &&
        !this.pausedByOverlay &&
        this.player?.active &&
        target?.active &&
        target.getData &&
        target.setData &&
        !target.getData("dying"),
    );
  }

  knockbackFrom(source, playerForce = 230, sourceForce = 95) {
    if (!source || !this.player?.body) return;
    const angle = Phaser.Math.Angle.Between(source.x, source.y, this.player.x, this.player.y);
    this.player.setVelocity(Math.cos(angle) * playerForce, Math.sin(angle) * playerForce);
    if (source.body && source.setVelocity) {
      source.setVelocity(Math.cos(angle + Math.PI) * sourceForce, Math.sin(angle + Math.PI) * sourceForce);
    }
  }

  touchEnemy(enemy) {
    enemy = this.resolveOverlapTarget(enemy);
    if (!this.canTakeContactDamage(enemy)) return;
    const now = this.time?.now ?? 0;
    if (now < (enemy.getData("touchAt") ?? 0)) return;
    enemy.setData("touchAt", now + 1450);
    this.knockbackFrom(enemy);
    this.damagePlayer(1);
  }

  touchBoss(boss) {
    boss = this.resolveOverlapTarget(boss);
    if (!this.canTakeContactDamage(boss)) return;
    const now = this.time?.now ?? 0;
    if (now < (boss.getData("touchAt") ?? 0)) return;
    boss.setData("touchAt", now + 1500);
    this.knockbackFrom(boss, 270, 70);
    this.damagePlayer(1);
  }

  damagePlayer(amount) {
    if (!this.state || !this.player?.active || amount <= 0) return;
    const now = this.time?.now ?? 0;
    if (now < this.invulnerableUntil) return;

    if (this.state.ward) {
      this.state.ward = false;
      saveState(this.state);
      this.invulnerableUntil = now + Math.round(INVULN_TIME * 1.12);
      this.playSfx("beacon");
      this.burst(this.player.x, this.player.y, 0xffd479, 14, 62);
      this.floatText(this.player.x, this.player.y - 30, "Ward absorbed");
      this.cameras?.main?.flash?.(90, 255, 214, 132, 0.14);
      this.updateHud();
      return;
    }

    this.invulnerableUntil = now + INVULN_TIME;
    let defeated = false;
    try {
      defeated = takeDamage(this.state, amount);
    } catch (error) {
      console.warn("Damage save skipped", error);
      this.state.health = Math.max(0, this.state.health - amount);
      defeated = this.state.health === 0;
    }
    this.playSfx("playerHit");
    this.burst(this.player.x, this.player.y, 0xe95e5d, 11, 52);
    this.cameras?.main?.shake?.(130, 0.008);
    this.updateHud();
    if (defeated) this.showGameOver();
  }

  collectItem(item) {
    const type = item.getData("type");
    if (type === "shard") {
      addShard(this.state, item.getData("id"));
      this.playSfx("pickup");
      this.burst(item.x, item.y, 0xffd479, 14, 62);
      this.floatText(item.x, item.y - 18, "Shard claimed");
      item.destroy();
    } else if (type === "sigil") {
      addSigil(this.state, item.getData("id"));
      this.playSfx("pickup");
      this.burst(item.x, item.y, 0x64c6b2, 13, 56);
      this.floatText(item.x, item.y - 18, `Sigil ${this.state.sigils.length}/${REQUIRED_SIGILS}`);
      item.destroy();
    } else if (type === "heart") {
      heal(this.state, 1);
      this.playSfx("heal");
      this.burst(item.x, item.y, 0xe9585a, 9, 42);
      this.floatText(item.x, item.y - 18, "Healed");
      item.destroy();
    } else if (type === "moonBloom") {
      if (!markMoonBloom(this.state, item.getData("id"))) return;
      heal(this.state, 1);
      this.nextPulseAt = 0;
      this.playSfx("heal");
      this.burst(item.x, item.y, 0x74ead5, 14, 62);
      this.floatText(item.x, item.y - 18, "Ward bloom");
      item.destroy();
    }
    this.updateHud();
  }

  updateInteractions() {
    let prompt = "";
    let action = null;
    const interactPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.interact) || consumeTap("interact") || consumePress("interact");

    this.chests.children.iterate((chest) => {
      if (action || !chest?.active || chest.getData("opened")) return;
      if (distance(chest, this.player) < 54) {
        prompt = "Press E to open the mossbound chest";
        action = () => this.openChest(chest);
      }
    });

    this.beacons.children.iterate((beacon) => {
      if (action || !beacon?.active) return;
      if (distance(beacon, this.player) < 50) {
        prompt = "Press E to rest at the ember beacon";
        action = () => this.useBeacon(beacon);
      }
    });

    this.obelisks.children.iterate((site) => {
      if (action || !site?.active) return;
      if (distance(site, this.player) < 52) {
        const used = site.getData("used");
        prompt = used
          ? "This rune echo is quiet"
          : site.getData("kind") === "moonwell"
            ? "Press E to listen at the moonwell"
            : site.getData("kind") === "well"
            ? "Press E to drink from the ember well"
            : "Press E to bind the rune echo";
        action = () => this.useObelisk(site);
      }
    });

    this.loreStones.children.iterate((stone) => {
      if (action || !stone?.active) return;
      if (distance(stone, this.player) < 48) {
        prompt = "Press E to read the guide stone";
        action = () => this.readLoreStone(stone);
      }
    });

    const gatePos = tileCenter(31.5, 15);
    if (!action && distance(gatePos, this.player) < 72 && !this.state.gateOpen) {
      if (!this.state.key) prompt = "The gate needs the sunken key";
      else if (this.state.shards.length < REQUIRED_SHARDS) prompt = `The gate needs ${REQUIRED_SHARDS} ember shards`;
      else {
        prompt = "Press E to open the north gate";
        action = () => this.unlockGate();
      }
    }

    ui.prompt.hidden = prompt === "";
    ui.prompt.textContent = prompt;
    if (interactPressed && action) action();
  }

  openChest(chest) {
    const id = chest.getData("id");
    if (!markChest(this.state, id)) return;
    chest.setData("opened", true);
    chest.setFrame(OBJECT_FRAME.chestOpen);
    const content = chest.getData("content");
    if (content === "key") {
      addKey(this.state);
      this.playSfx("pickup");
      this.burst(chest.x, chest.y, 0xffd479, 12, 52);
      this.floatText(chest.x, chest.y - 22, "Sunken key found");
    } else {
      heal(this.state, content === "potion" ? 2 : 1);
      this.playSfx("heal");
      this.floatText(chest.x, chest.y - 22, "Ember salve");
    }
    this.updateHud();
  }

  useObelisk(site) {
    if (site.getData("used")) {
      this.floatText(site.x, site.y - 18, "Echo quiet");
      return;
    }
    if (!touchObelisk(this.state, site.getData("id"))) return;
    const isWell = site.getData("kind") === "well";
    const isMoonwell = site.getData("kind") === "moonwell";
    if (isWell || isMoonwell) heal(this.state, 2);
    if (isMoonwell) this.nextPulseAt = 0;
    site.setData("used", true);
    site.setAlpha(0.68).setTint(0x8daaa2);
    this.playSfx(isWell || isMoonwell ? "heal" : "beacon");
    this.burst(site.x, site.y, isWell ? 0xe9585a : isMoonwell ? 0x74ead5 : 0x64c6b2, 16, 68);
    this.floatText(site.x, site.y - 22, isWell ? "Ember well" : isMoonwell ? "Moonwell awakened" : "Rune echo bound");
    this.updateHud();
  }

  readLoreStone(stone) {
    this.playSfx("confirm");
    this.floatText(stone.x, stone.y - 22, stone.getData("text"));
  }

  useBeacon(beacon) {
    touchBeacon(this.state, beacon.getData("id"), beacon.x, beacon.y + 16);
    this.playSfx("beacon");
    this.burst(beacon.x, beacon.y, 0x64c6b2, 16, 64);
    this.floatText(beacon.x, beacon.y - 20, "Ward renewed");
    this.updateHud();
  }

  unlockGate() {
    if (!this.state.key || this.state.shards.length < REQUIRED_SHARDS) return;
    openGate(this.state);
    this.playSfx("gate");
    for (const [x, y] of [
      [31, 15],
      [32, 15],
    ]) {
      this.solidLayer.removeTileAt(x, y);
      this.decorLayer.putTileAt(T.gateOpen, x, y);
    }
    this.floatText(tileCenter(31, 15).x + 16, tileCenter(31, 15).y - 20, "Gate opened");
    this.burst(tileCenter(31, 15).x + 16, tileCenter(31, 15).y, 0xffb84e, 26, 96);
    this.cameras.main.shake(260, 0.006);
    this.updateHud();
  }

  defeatBoss(boss) {
    markBossDefeated(this.state);
    this.playSfx("bossDie");
    this.playMusic("explore");
    ui.bossHud.hidden = true;
    boss.destroy();
    const relic = this.collectibles.create(boss.x, boss.y, "objects", OBJECT_FRAME.relic);
    relic.setData("type", "heart");
    relic.setDepth(12);
    this.floatText(boss.x, boss.y - 32, "Ash Warden broken");
    this.burst(boss.x, boss.y, 0xffb84e, 34, 130);
    this.updateHud();
    this.time.delayedCall(650, () => this.showVictory());
  }

  showPause() {
    this.pausedByOverlay = true;
    this.player.setVelocity(0, 0);
    resetInputState();
    this.endMode = "resume";
    ui.endTitle.textContent = "Paused";
    ui.endMessage.textContent = "The forest waits.";
    ui.againButton.textContent = "Resume";
    ui.endScreen.style.setProperty("--end-art", `url("./${ASSETS.wardArt}")`);
    ui.endScreen.hidden = false;
  }

  showGameOver() {
    this.pausedByOverlay = true;
    resetInputState();
    this.endMode = "restart";
    ui.endTitle.textContent = "Defeated";
    ui.endMessage.textContent = "The ember fades at your last beacon.";
    ui.againButton.textContent = "Try Again";
    ui.endScreen.style.setProperty("--end-art", `url("./${ASSETS.bossArt}")`);
    ui.endScreen.hidden = false;
  }

  showVictory() {
    this.pausedByOverlay = true;
    resetInputState();
    this.endMode = "new";
    ui.endTitle.textContent = "Victory";
    ui.endMessage.textContent = "The Ash Warden falls, and the Emberwild breathes again.";
    ui.againButton.textContent = "New Adventure";
    ui.endScreen.style.setProperty("--end-art", `url("./${ASSETS.shrineArt}")`);
    ui.endScreen.hidden = false;
  }

  restartFromSave() {
    ui.endScreen.hidden = true;
    this.scene.restart({ autoStart: true });
  }

  newAdventure(autoStart = false) {
    clearSave();
    saveState(createInitialState());
    document.body.classList.remove("is-low-health");
    ui.endScreen.hidden = true;
    ui.bossHud.hidden = true;
    ui.prompt.hidden = true;
    ui.menu.hidden = Boolean(autoStart);
    this.scene.restart({ autoStart });
  }

  floatText(x, y, text) {
    const label = this.add.text(x, y, text, {
      color: "#ffe7b2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "13px",
      fontStyle: "700",
      stroke: "#101817",
      strokeThickness: 4,
    });
    label.setOrigin(0.5).setDepth(40);
    this.tweens.add({
      targets: label,
      y: y - 24,
      alpha: 0,
      duration: 900,
      ease: "sine.out",
      onComplete: () => label.destroy(),
    });
  }

  burst(x, y, color, count = 10, radius = 48) {
    const actualCount = Math.max(2, Math.min(this.maxBurstParticles, Math.ceil(count * this.fxScale)));
    const actualRadius = this.lowFx ? radius * 0.76 : radius;
    for (let i = 0; i < actualCount; i += 1) {
      const angle = (Math.PI * 2 * i) / actualCount + Phaser.Math.FloatBetween(-0.18, 0.18);
      const distanceOut = Phaser.Math.Between(actualRadius * 0.35, actualRadius);
      const spark = this.add.circle(x, y, Phaser.Math.Between(2, 4), color, 0.92);
      spark.setDepth(38);
      if (!this.lowFx) spark.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distanceOut,
        y: y + Math.sin(angle) * distanceOut,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(260, 520),
        ease: "sine.out",
        onComplete: () => spark.destroy(),
      });
    }
  }

  beginBossFight(boss) {
    this.bossFightActive = true;
    this.playMusic("boss");
    if (this.bossRevealShown) return;
    this.bossRevealShown = true;
    ui.bossReveal.hidden = false;
    this.time.delayedCall(1650, () => {
      ui.bossReveal.hidden = true;
    });
    this.cameras.main.shake(420, 0.006);
    this.burst(boss.x, boss.y, 0xff6b32, 28, 120);
  }

  updateBossHud(boss) {
    const maxHp = boss.getData("maxHp") || 1;
    const hp = Math.max(0, boss.getData("hp") || 0);
    ui.bossHud.hidden = false;
    ui.bossFill.style.transform = `scaleX(${hp / maxHp})`;
  }

  playMusic(key) {
    if (!this.music || !this.audioEnabled) return;
    if (this.currentMusic === key && this.music[key]?.isPlaying) return;
    try {
      for (const [musicKey, track] of Object.entries(this.music)) {
        if (musicKey !== key && track.isPlaying) track.stop();
      }
      const track = this.music[key];
      if (track && !track.isPlaying) track.play();
      this.currentMusic = key;
    } catch (error) {
      console.warn("Music skipped", error);
    }
  }

  playSfx(key) {
    if (!this.sfx || !this.audioEnabled) return;
    const sound = this.sfx[key];
    if (!sound) return;
    try {
      sound.play();
    } catch (error) {
      console.warn("SFX skipped", key, error);
    }
  }

  toggleAudio() {
    this.audioEnabled = !this.audioEnabled;
    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, this.audioEnabled ? "on" : "off");
    } catch (error) {
      console.warn("Audio preference skipped", error);
    }
    if (!this.audioEnabled) {
      this.sound.stopAll();
    } else {
      this.playSfx("confirm");
      if (this.activePlay) this.playMusic(this.bossFightActive ? "boss" : "explore");
    }
    this.updateAudioButton();
  }

  updateAudioButton() {
    ui.audioToggle.textContent = this.audioEnabled ? "\u266b" : "x";
    ui.audioToggle.classList.toggle("is-off", !this.audioEnabled);
    ui.audioToggle.setAttribute("aria-label", this.audioEnabled ? "Audio ausschalten" : "Audio einschalten");
  }

  updateAreaName() {
    let name = "Mosswake Hollow";
    if (this.player.x > 1780 && this.player.y > 1040) name = "Moonwell Glade";
    else if (this.player.y < 520) name = "North Ruin";
    else if (this.player.x > 1470) name = "Mistglass Stream";
    else if (this.player.x < 520 && this.player.y < 760) name = "Rootfall Thicket";
    else if (this.player.y > 1020) name = "Southwatch Grove";
    if (name !== this.state.areaName) {
      this.state.areaName = name;
      ui.areaName.textContent = name;
    }
  }

  updateHud() {
    ui.healthFill.style.transform = `scaleX(${Math.max(0, this.state.health / MAX_HEALTH)})`;
    ui.emberFill.style.transform = `scaleX(${Math.max(0, this.state.ember / 99)})`;
    ui.shardCount.textContent = `Shards ${this.state.shards.length}/${REQUIRED_SHARDS}`;
    ui.sigilCount.textContent = `Sigils ${this.state.sigils.length}/${REQUIRED_SIGILS}`;
    ui.keyStatus.textContent = this.state.key ? "Key ready" : this.state.ward ? "Ward ready" : "Key -";
    ui.keyStatus.classList.toggle("is-ward-ready", !this.state.key && Boolean(this.state.ward));
    ui.areaName.textContent = this.state.areaName;
    ui.objective.textContent = this.state.objective;
    document.body.classList.toggle("is-low-health", this.state.health > 0 && this.state.health <= 2);
  }
}

function bindUi(game) {
  ui.startButton.addEventListener("click", () => {
    const scene = game.scene.getScene("emberwild");
    if (scene) {
      ui.startButton.blur();
      scene.startAdventure();
      focusGameCanvas(game);
    }
  });

  ui.resetButton.addEventListener("click", () => {
    const scene = game.scene.getScene("emberwild");
    if (scene) {
      scene.playSfx("confirm");
      scene.newAdventure(false);
    } else {
      clearSave();
      saveState(createInitialState());
    }
  });

  ui.againButton.addEventListener("click", () => {
    const scene = game.scene.getScene("emberwild");
    if (!scene) return;
    if (scene.endMode === "resume") {
      scene.pausedByOverlay = false;
      ui.endScreen.hidden = true;
      scene.playMusic(scene.bossFightActive ? "boss" : "explore");
      focusGameCanvas(game);
      return;
    }
    if (scene.endMode === "new") {
      scene.newAdventure();
      return;
    }
    scene.state.health = MAX_HEALTH;
    scene.state.ward = true;
    saveState(scene.state);
    scene.restartFromSave();
  });

  ui.journalToggle.addEventListener("click", () => {
    ui.journal.hidden = !ui.journal.hidden;
    const scene = game.scene.getScene("emberwild");
    if (scene) scene.playSfx("confirm");
  });

  ui.audioToggle.addEventListener("click", () => {
    const scene = game.scene.getScene("emberwild");
    if (scene) scene.toggleAudio();
  });

  for (const button of document.querySelectorAll("[data-hold]")) {
    const action = button.dataset.hold;
    const set = (value) => {
      touchState[action] = value;
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      set(true);
      focusGameCanvas(game);
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener("pointerup", () => set(false));
    button.addEventListener("pointercancel", () => set(false));
    button.addEventListener("lostpointercapture", () => set(false));
  }

  for (const button of document.querySelectorAll("[data-tap]")) {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      focusGameCanvas(game);
      touchState.taps.add(button.dataset.tap);
    });
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-shell",
  backgroundColor: "#101817",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      fps: 60,
    },
  },
  scene: [EmberScene],
});

bindUi(game);
