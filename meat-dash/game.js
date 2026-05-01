
"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const levelText = document.getElementById("levelText");
const timerText = document.getElementById("timerText");
const splitText = document.getElementById("splitText");
const bestSplitText = document.getElementById("bestSplitText");
const bestText = document.getElementById("bestText");
const deathsText = document.getElementById("deathsText");
const relicText = document.getElementById("relicText");
const messageEl = document.getElementById("message");
const assistToggleEl = document.getElementById("assistToggle");
const touchControlsEl = document.querySelector(".touch-controls");

const BEST_TIME_KEY = "meatDashBestRunMs";
const BEST_SPLITS_KEY = "meatDashBestSplitsMsV2";
const ASSIST_MODE_KEY = "meatDashAssistModeV1";

const INPUT = {
  left: false,
  right: false,
  jump: false,
  restart: false,
  prevJump: false,
  prevRestart: false
};

const KEY_INPUT = {
  left: false,
  right: false,
  jump: false,
  restart: false
};

const TOUCH_INPUT = {
  left: false,
  right: false,
  jump: false,
  restart: false,
  jumpBufferedUntil: 0
};

const PLAYER_CFG = {
  w: 28,
  h: 28,
  accel: 2420,
  maxSpeedX: 340,
  groundDrag: 2200,
  airDrag: 320,
  gravity: 1720,
  maxFallSpeed: 1020,
  jumpSpeed: 660,
  airJumps: 1,
  doubleJumpSpeed: 640,
  coyoteTime: 0.13,
  jumpBufferTime: 0.15,
  jumpReleaseGravityMult: 2.15,
  wallSlideSpeed: 165,
  wallJumpX: 390,
  wallJumpY: 620
};

const ART = buildArtAssets();
const RUNNER_ANIMS = {
  idle: { row: 0, frames: 8, fps: 8 },
  run: { row: 1, frames: 8, fps: 18 },
  jump: { row: 2, frames: 6, fps: 12 },
  fall: { row: 3, frames: 6, fps: 12 },
  wall: { row: 4, frames: 4, fps: 10 },
  splat: { row: 5, frames: 6, fps: 15 }
};

function makeCanvas(w, h) {
  const artCanvas = document.createElement("canvas");
  artCanvas.width = w;
  artCanvas.height = h;
  return artCanvas;
}

function artRect(g, color, x, y, w, h) {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function artPoly(g, color, points) {
  g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < points.length; i += 2) {
    const x = Math.round(points[i]);
    const y = Math.round(points[i + 1]);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fill();
}

function drawRunnerFrame(g, ox, oy, pose, frame) {
  const phase = frame / 8 * Math.PI * 2;
  let bob = Math.sin(phase) * 1.2;
  let lean = 0;
  let squash = 0;
  let armA = Math.sin(phase + 1.4) * 3;
  let armB = -armA;
  let footA = Math.sin(phase) * 3;
  let footB = -footA;
  let mouth = 0;

  if (pose === "run") {
    bob = -Math.abs(Math.sin(phase)) * 2.5;
    lean = 3;
    armA = Math.sin(phase + Math.PI) * 5;
    armB = -armA;
  } else if (pose === "jump") {
    bob = -3;
    lean = 1;
    armA = -5;
    armB = -3;
    footA = -3;
    footB = -1;
    mouth = 1;
  } else if (pose === "fall") {
    bob = 2;
    armA = -1;
    armB = -5;
    footA = 2;
    footB = 4;
    mouth = 1;
  } else if (pose === "wall") {
    lean = -3;
    bob = Math.sin(phase) * 0.6;
    armA = -4;
    armB = 4;
    footA = -1;
    footB = 3;
  } else if (pose === "splat") {
    squash = 7 - frame;
    bob = 3;
    armA = 5;
    armB = -5;
    mouth = 2;
  }

  if (pose === "run") {
    artRect(g, "rgba(255,255,255,0.8)", ox + 0, oy + 19 + frame % 2, 8, 2);
    artRect(g, "rgba(255,75,87,0.55)", ox + 2, oy + 24, 9, 2);
  }

  const x = ox + 6 + lean;
  const y = oy + 6 + bob + squash * 0.3;
  const bodyW = 21 + squash * 0.4;
  const bodyH = 22 - squash * 0.45;

  artRect(g, "#4b0710", x + 2, oy + 27 + footA, 8, 4);
  artRect(g, "#4b0710", x + 14, oy + 27 + footB, 8, 4);
  artRect(g, "#ffb8bf", x - 3, y + 12 + armA, 5, 7);
  artRect(g, "#ffb8bf", x + bodyW - 1, y + 12 + armB, 5, 7);
  artRect(g, "#7b101a", x - 1, y + 1, bodyW + 2, bodyH + 1);
  artRect(g, "#ff4b57", x, y, bodyW, bodyH);
  artRect(g, "#ff8790", x + 3, y + 2, bodyW - 8, 4);
  artRect(g, "#c92936", x + 2, y + bodyH - 5, bodyW - 4, 4);
  artRect(g, "#ffffff", x + 5, y + 8, 5, 5);
  artRect(g, "#ffffff", x + bodyW - 10, y + 8, 5, 5);
  artRect(g, "#170407", x + 7, y + 10, 2, 2);
  artRect(g, "#170407", x + bodyW - 8, y + 10, 2, 2);
  artRect(g, "#ffd6da", x + 3, y + 3, 3, 9);
  if (mouth === 2) {
    artRect(g, "#230408", x + 8, y + 16, 10, 4);
    artRect(g, "#fff2ea", x + 10, y + 16, 2, 3);
    artRect(g, "#fff2ea", x + 15, y + 16, 2, 3);
  } else if (mouth === 1) {
    artRect(g, "#230408", x + 10, y + 16, 7, 4);
  } else {
    artRect(g, "#230408", x + 10, y + 16, 8, 2);
  }
}

function drawTileFrame(g, ox, oy, kind, variant) {
  const flicker = variant % 4;
  if (kind === "top") {
    artRect(g, "#1b1017", ox, oy, 32, 32);
    artRect(g, "#51303a", ox + 1, oy + 7, 30, 24);
    artRect(g, "#8b5b68", ox + 2, oy + 2, 28, 8);
    artRect(g, "#ffc0cd", ox + 4 + flicker, oy + 3, 8, 2);
    artRect(g, "#2b1820", ox + 5, oy + 17, 21, 3);
    artRect(g, "#b37b88", ox + 8, oy + 12, 6 + flicker, 2);
  } else if (kind === "side") {
    artRect(g, "#170e14", ox, oy, 32, 32);
    artRect(g, "#36242e", ox + 1, oy, 30, 32);
    artRect(g, "#5a3b47", ox + 3, oy + 3, 26, 5);
    artRect(g, "#21141b", ox + 4, oy + 14, 24, 2);
    artRect(g, "#74505c", ox + 7, oy + 23, 10, 2);
  } else if (kind === "metal") {
    artRect(g, "#101721", ox, oy, 32, 32);
    artRect(g, "#465869", ox + 1, oy + 1, 30, 30);
    artRect(g, "#8da2b5", ox + 4, oy + 4, 22, 3);
    artRect(g, "#24313e", ox + 4, oy + 24, 24, 3);
    artRect(g, "#202c38", ox + 14, oy + 2, 3, 28);
    artRect(g, "#ff5b6a", ox + 6, oy + 8, 4, 4);
    artRect(g, "#ff5b6a", ox + 22, oy + 20, 4, 4);
  } else if (kind === "boost") {
    artRect(g, "#1a1520", ox, oy, 32, 32);
    artRect(g, "#ff4b57", ox + 1, oy + 12, 30, 9);
    artRect(g, "#fff3f5", ox + 5, oy + 13, 20, 2);
    artPoly(g, "#69121b", [ox + 10, oy + 17, ox + 18, oy + 12, ox + 18, oy + 22]);
    artRect(g, "#61e8ff", ox + 6, oy + 24, 20, 3);
  }
}

function buildArtAssets() {
  const runner = makeCanvas(8 * 32, 6 * 32);
  const rg = runner.getContext("2d");
  rg.imageSmoothingEnabled = false;
  ["idle", "run", "jump", "fall", "wall", "splat"].forEach((pose, row) => {
    for (let col = 0; col < 8; col += 1) {
      drawRunnerFrame(rg, col * 32, row * 32, pose, col);
    }
  });

  const tiles = makeCanvas(8 * 32, 4 * 32);
  const tg = tiles.getContext("2d");
  tg.imageSmoothingEnabled = false;
  ["top", "side", "metal", "boost"].forEach((kind, row) => {
    for (let col = 0; col < 8; col += 1) {
      drawTileFrame(tg, col * 32, row * 32, kind, col);
    }
  });

  return {
    runner: makeImageAsset("assets/runner-sprites.png", runner),
    tiles: makeImageAsset("assets/level-tiles.png", tiles),
    frame: 32
  };
}

function makeImageAsset(src, fallback) {
  const image = new Image();
  image.src = src;
  image.addEventListener("load", () => {
    try {
      if (game && game.level) {
        render(performance.now());
      }
    } catch {
      // Initial asset loads can finish before the game state is created.
    }
  });
  return { image, fallback };
}

function artSource(asset) {
  if (asset.image.complete && asset.image.naturalWidth > 0) {
    return asset.image;
  }
  return asset.fallback;
}

const AUDIO_ASSETS = {
  bgmMain: "assets/music/gargoyle-chapel-run.mp3",
  bgmLayer: null,
  jump: "https://opengameart.org/sites/default/files/beep.ogg",
  wallJump: "https://opengameart.org/sites/default/files/beep.ogg",
  doubleJump: "https://opengameart.org/sites/default/files/pleasing-bell.wav",
  death: "https://opengameart.org/sites/default/files/qubodup-crash.ogg",
  checkpoint: "https://opengameart.org/sites/default/files/movingshield_sound.ogg",
  goal: "https://opengameart.org/sites/default/files/pleasing-bell.wav",
  restart: "https://opengameart.org/sites/default/files/cannon_hit_wall_0.ogg"
};

const LEVEL_THEME_ORDER = [
  "abattoir",
  "steelworks",
  "metro",
  "bioforge",
  "neonfort",
  "ashplain",
  "reactor",
  "heaven"
];

const THEMES = {
  abattoir: {
    label: "Abattoir",
    skyTop: "#2a0e14",
    skyMid: "#2a1220",
    skyBottom: "#130913",
    layerA: "rgba(63, 20, 40, 0.88)",
    layerB: "rgba(87, 32, 48, 0.66)",
    fogA: "rgba(215, 95, 120, 0.06)",
    fogB: "rgba(255, 155, 188, 0.08)",
    grid: "rgba(255, 150, 170, 0.06)",
    top: "#7d505e",
    front: "#4e2f3a",
    side: "#34222a",
    edge: "rgba(255, 211, 224, 0.24)",
    accent: "#ff94b7",
    relic: "#98f3ff",
    pattern: "bolts",
    prop: "chains"
  },
  steelworks: {
    label: "Steelworks",
    skyTop: "#101722",
    skyMid: "#14212f",
    skyBottom: "#0a111b",
    layerA: "rgba(22, 41, 59, 0.88)",
    layerB: "rgba(34, 67, 97, 0.64)",
    fogA: "rgba(105, 145, 195, 0.06)",
    fogB: "rgba(155, 205, 255, 0.09)",
    grid: "rgba(155, 215, 255, 0.06)",
    top: "#5c7690",
    front: "#34485e",
    side: "#263747",
    edge: "rgba(218, 239, 255, 0.2)",
    accent: "#8de3ff",
    relic: "#87f6ff",
    pattern: "stripes",
    prop: "pipes"
  },
  metro: {
    label: "Metro Ruins",
    skyTop: "#201726",
    skyMid: "#251a32",
    skyBottom: "#120d19",
    layerA: "rgba(47, 35, 68, 0.84)",
    layerB: "rgba(75, 51, 94, 0.62)",
    fogA: "rgba(186, 150, 255, 0.06)",
    fogB: "rgba(220, 178, 255, 0.08)",
    grid: "rgba(208, 168, 255, 0.06)",
    top: "#74669a",
    front: "#4b3f6a",
    side: "#342b4d",
    edge: "rgba(232, 216, 255, 0.2)",
    accent: "#c8a7ff",
    relic: "#9fe8ff",
    pattern: "cracks",
    prop: "arches"
  },
  bioforge: {
    label: "Bioforge",
    skyTop: "#0f2218",
    skyMid: "#123127",
    skyBottom: "#081711",
    layerA: "rgba(20, 68, 49, 0.86)",
    layerB: "rgba(30, 104, 75, 0.62)",
    fogA: "rgba(120, 220, 178, 0.06)",
    fogB: "rgba(176, 255, 220, 0.1)",
    grid: "rgba(148, 255, 210, 0.06)",
    top: "#5d9f85",
    front: "#3b6c5a",
    side: "#27493e",
    edge: "rgba(214, 255, 237, 0.2)",
    accent: "#8dffca",
    relic: "#a9f9ff",
    pattern: "vents",
    prop: "tanks"
  },
  neonfort: {
    label: "Neon Fort",
    skyTop: "#1a1034",
    skyMid: "#1b1540",
    skyBottom: "#0f0c24",
    layerA: "rgba(53, 32, 106, 0.85)",
    layerB: "rgba(88, 52, 146, 0.63)",
    fogA: "rgba(186, 139, 255, 0.06)",
    fogB: "rgba(237, 180, 255, 0.1)",
    grid: "rgba(220, 168, 255, 0.065)",
    top: "#8f73d8",
    front: "#5a499c",
    side: "#3c316d",
    edge: "rgba(239, 222, 255, 0.22)",
    accent: "#e2b1ff",
    relic: "#90e9ff",
    pattern: "neon",
    prop: "towers"
  },
  ashplain: {
    label: "Ash Plain",
    skyTop: "#23150f",
    skyMid: "#2d1c16",
    skyBottom: "#150d0a",
    layerA: "rgba(72, 41, 24, 0.86)",
    layerB: "rgba(108, 64, 40, 0.62)",
    fogA: "rgba(255, 154, 116, 0.06)",
    fogB: "rgba(255, 200, 170, 0.08)",
    grid: "rgba(255, 190, 155, 0.06)",
    top: "#b77a62",
    front: "#784d3b",
    side: "#56372a",
    edge: "rgba(255, 223, 204, 0.2)",
    accent: "#ffc4a1",
    relic: "#a5ebff",
    pattern: "plates",
    prop: "spires"
  },
  reactor: {
    label: "Reactor",
    skyTop: "#111827",
    skyMid: "#13223a",
    skyBottom: "#09111d",
    layerA: "rgba(32, 53, 83, 0.86)",
    layerB: "rgba(44, 83, 128, 0.62)",
    fogA: "rgba(133, 180, 255, 0.06)",
    fogB: "rgba(172, 216, 255, 0.1)",
    grid: "rgba(152, 205, 255, 0.06)",
    top: "#6f8dbc",
    front: "#46608a",
    side: "#30445f",
    edge: "rgba(213, 233, 255, 0.22)",
    accent: "#91d0ff",
    relic: "#a5f2ff",
    pattern: "panels",
    prop: "reactor"
  },
  heaven: {
    label: "Crimson Heaven",
    skyTop: "#2f1330",
    skyMid: "#3a1540",
    skyBottom: "#1a0d26",
    layerA: "rgba(94, 30, 86, 0.84)",
    layerB: "rgba(132, 53, 113, 0.64)",
    fogA: "rgba(255, 140, 196, 0.07)",
    fogB: "rgba(255, 195, 236, 0.1)",
    grid: "rgba(255, 178, 226, 0.065)",
    top: "#cf7db0",
    front: "#8f4e79",
    side: "#603351",
    edge: "rgba(255, 220, 242, 0.24)",
    accent: "#ffb8e7",
    relic: "#b9f9ff",
    pattern: "runes",
    prop: "floating"
  }
};

const THEME_AUDIO_PROFILES = {
  abattoir: { mainUrl: AUDIO_ASSETS.bgmMain, layerUrl: AUDIO_ASSETS.bgmLayer, mainRate: 0.9, layerRate: 0.86, beat: 0.235, root: 88, scale: [0, 3, 5, 7, 10], mainBase: 0.62, layerBase: 0.18, synthBase: 0.34, bassWave: "triangle", arpWave: "sine", arpDiv: 3, arpChance: 0.56, pulseDiv: 4, pulseFreq: 190 },
  steelworks: { mainUrl: AUDIO_ASSETS.bgmMain, layerUrl: AUDIO_ASSETS.bgmLayer, mainRate: 1.01, layerRate: 0.97, beat: 0.205, root: 102, scale: [0, 2, 5, 7, 9], mainBase: 0.58, layerBase: 0.2, synthBase: 0.36, bassWave: "square", arpWave: "triangle", arpDiv: 2, arpChance: 0.72, pulseDiv: 2, pulseFreq: 260 },
  metro: { mainUrl: AUDIO_ASSETS.bgmMain, layerUrl: AUDIO_ASSETS.bgmLayer, mainRate: 1.05, layerRate: 1.08, beat: 0.19, root: 112, scale: [0, 3, 7, 8, 10], mainBase: 0.57, layerBase: 0.24, synthBase: 0.4, bassWave: "sawtooth", arpWave: "triangle", arpDiv: 2, arpChance: 0.82, pulseDiv: 3, pulseFreq: 420 },
  bioforge: { mainUrl: AUDIO_ASSETS.bgmMain, layerUrl: AUDIO_ASSETS.bgmLayer, mainRate: 0.95, layerRate: 0.93, beat: 0.215, root: 96, scale: [0, 2, 3, 7, 9], mainBase: 0.56, layerBase: 0.18, synthBase: 0.33, bassWave: "sine", arpWave: "sine", arpDiv: 4, arpChance: 0.46, pulseDiv: 5, pulseFreq: 170 },
  neonfort: { mainUrl: AUDIO_ASSETS.bgmMain, layerUrl: AUDIO_ASSETS.bgmLayer, mainRate: 1.1, layerRate: 1.12, beat: 0.178, root: 118, scale: [0, 3, 5, 7, 10], mainBase: 0.55, layerBase: 0.28, synthBase: 0.44, bassWave: "triangle", arpWave: "square", arpDiv: 1, arpChance: 0.92, pulseDiv: 2, pulseFreq: 520 },
  ashplain: { mainUrl: AUDIO_ASSETS.bgmMain, layerUrl: AUDIO_ASSETS.bgmLayer, mainRate: 0.9, layerRate: 0.87, beat: 0.24, root: 90, scale: [0, 3, 5, 6, 10], mainBase: 0.6, layerBase: 0.16, synthBase: 0.32, bassWave: "triangle", arpWave: "sine", arpDiv: 3, arpChance: 0.5, pulseDiv: 6, pulseFreq: 150 },
  reactor: { mainUrl: AUDIO_ASSETS.bgmMain, layerUrl: AUDIO_ASSETS.bgmLayer, mainRate: 1.14, layerRate: 1.1, beat: 0.172, root: 124, scale: [0, 2, 4, 7, 9], mainBase: 0.55, layerBase: 0.29, synthBase: 0.45, bassWave: "square", arpWave: "sawtooth", arpDiv: 1, arpChance: 0.95, pulseDiv: 1, pulseFreq: 640 },
  heaven: { mainUrl: AUDIO_ASSETS.bgmMain, layerUrl: AUDIO_ASSETS.bgmLayer, mainRate: 0.99, layerRate: 1.03, beat: 0.198, root: 116, scale: [0, 3, 5, 7, 11], mainBase: 0.56, layerBase: 0.27, synthBase: 0.42, bassWave: "sine", arpWave: "triangle", arpDiv: 2, arpChance: 0.8, pulseDiv: 3, pulseFreq: 480 }
};

const LEVELS = [
  {
    name: "1-1 Warmup",
    world: { w: 1800, h: 960 },
    spawn: { x: 70, y: 892 },
    goal: { x: 1702, y: 498, w: 34, h: 62 },
    solids: [
      { x: 0, y: 920, w: 320, h: 40 },
      { x: 340, y: 860, w: 220, h: 20 },
      { x: 640, y: 800, w: 220, h: 20 },
      { x: 940, y: 740, w: 220, h: 20 },
      { x: 1240, y: 680, w: 220, h: 20 },
      { x: 1500, y: 620, w: 220, h: 20 },
      { x: 1635, y: 560, w: 145, h: 20 }
    ],
    hazards: [
      { kind: "spike", dir: "up", x: 320, y: 888, w: 100, h: 32 },
      { kind: "spike", dir: "up", x: 560, y: 848, w: 80, h: 32 },
      { kind: "spike", dir: "up", x: 860, y: 788, w: 80, h: 32 },
      { kind: "spike", dir: "up", x: 1160, y: 728, w: 80, h: 32 },
      { kind: "saw", x: 1120, y: 640, r: 22, axis: "y", range: 90, speed: 2.8, phase: 0.4 }
    ],
    checkpoints: [
      { x: 1326, y: 620, w: 18, h: 60, spawn: { x: 1312, y: 652 } }
    ],
    relics: [
      { x: 710, y: 760 },
      { x: 1548, y: 580 }
    ],
    boostPads: [
      { x: 1460, y: 608, w: 90, h: 12, forceX: 230, forceY: -60 }
    ]
  },
  {
    name: "1-2 Flow Jump",
    world: { w: 1700, h: 960 },
    spawn: { x: 70, y: 892 },
    goal: { x: 1540, y: 238, w: 34, h: 62 },
    solids: [
      { x: 0, y: 920, w: 280, h: 40 },
      { x: 330, y: 860, w: 220, h: 20 },
      { x: 620, y: 800, w: 220, h: 20 },
      { x: 910, y: 740, w: 220, h: 20 },
      { x: 1200, y: 680, w: 220, h: 20 },
      { x: 980, y: 600, w: 180, h: 20 },
      { x: 680, y: 520, w: 180, h: 20 },
      { x: 980, y: 440, w: 220, h: 20 },
      { x: 1280, y: 360, w: 220, h: 20 },
      { x: 1480, y: 300, w: 180, h: 20 }
    ],
    hazards: [
      { kind: "spike", dir: "up", x: 280, y: 888, w: 70, h: 32 },
      { kind: "spike", dir: "up", x: 550, y: 828, w: 70, h: 32 },
      { kind: "spike", dir: "up", x: 840, y: 768, w: 70, h: 32 },
      { kind: "spike", dir: "up", x: 1130, y: 708, w: 70, h: 32 },
      { kind: "spike", dir: "up", x: 1460, y: 268, w: 70, h: 32 },
      { kind: "saw", x: 1040, y: 560, r: 22, axis: "x", range: 130, speed: 3.0, phase: 1.1 }
    ],
    checkpoints: [
      { x: 1066, y: 680, w: 18, h: 60, spawn: { x: 1050, y: 712 } },
      { x: 1338, y: 360, w: 18, h: 60, spawn: { x: 1324, y: 332 } }
    ],
    relics: [
      { x: 744, y: 486 },
      { x: 1332, y: 328 }
    ],
    boostPads: [
      { x: 1016, y: 588, w: 82, h: 12, forceX: -240, forceY: -40 }
    ]
  },
  {
    name: "1-3 Saw Rush",
    world: { w: 2200, h: 980 },
    spawn: { x: 70, y: 912 },
    goal: { x: 2120, y: 518, w: 34, h: 62 },
    solids: [
      { x: 0, y: 940, w: 280, h: 40 },
      { x: 340, y: 900, w: 220, h: 40 },
      { x: 620, y: 860, w: 220, h: 40 },
      { x: 900, y: 820, w: 220, h: 40 },
      { x: 1180, y: 780, w: 220, h: 40 },
      { x: 1460, y: 740, w: 220, h: 40 },
      { x: 1740, y: 700, w: 220, h: 40 },
      { x: 1980, y: 620, w: 220, h: 40 }
    ],
    hazards: [
      { kind: "saw", x: 300, y: 860, r: 24, axis: "y", range: 80, speed: 3.0, phase: 0.1 },
      { kind: "saw", x: 580, y: 820, r: 24, axis: "y", range: 80, speed: 3.1, phase: 0.8 },
      { kind: "saw", x: 860, y: 780, r: 24, axis: "y", range: 80, speed: 3.2, phase: 1.5 },
      { kind: "saw", x: 1140, y: 740, r: 24, axis: "y", range: 80, speed: 3.3, phase: 2.2 },
      { kind: "saw", x: 1420, y: 700, r: 24, axis: "y", range: 80, speed: 3.4, phase: 2.9 },
      { kind: "saw", x: 1700, y: 660, r: 24, axis: "y", range: 80, speed: 3.5, phase: 3.6 },
      { kind: "spike", dir: "up", x: 1120, y: 748, w: 60, h: 32 }
    ],
    checkpoints: [
      { x: 1508, y: 680, w: 18, h: 60, spawn: { x: 1492, y: 712 } }
    ],
    relics: [
      { x: 960, y: 784 },
      { x: 2050, y: 584 }
    ],
    boostPads: [
      { x: 1764, y: 688, w: 82, h: 12, forceX: 260, forceY: -50 }
    ]
  },
  {
    name: "1-4 Bloodworks",
    world: { w: 2550, h: 1000 },
    spawn: { x: 70, y: 912 },
    goal: { x: 2420, y: 298, w: 34, h: 62 },
    solids: [
      { x: 0, y: 940, w: 240, h: 40 },
      { x: 300, y: 890, w: 220, h: 40 },
      { x: 580, y: 840, w: 220, h: 40 },
      { x: 860, y: 790, w: 220, h: 40 },
      { x: 1140, y: 740, w: 220, h: 40 },
      { x: 1420, y: 690, w: 220, h: 40 },
      { x: 1700, y: 640, w: 220, h: 40 },
      { x: 1980, y: 590, w: 220, h: 40 },
      { x: 2200, y: 540, w: 260, h: 40 },
      { x: 2200, y: 450, w: 160, h: 20 },
      { x: 2360, y: 360, w: 160, h: 20 }
    ],
    hazards: [
      { kind: "spike", dir: "up", x: 240, y: 908, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 520, y: 858, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 800, y: 808, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 1080, y: 758, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 1360, y: 708, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 1640, y: 658, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 1920, y: 608, w: 60, h: 32 },
      { kind: "saw", x: 1030, y: 700, r: 23, axis: "y", range: 95, speed: 3.1, phase: 0.4 },
      { kind: "saw", x: 1590, y: 600, r: 23, axis: "y", range: 95, speed: 3.3, phase: 1.8 },
      { kind: "saw", x: 2130, y: 510, r: 23, axis: "y", range: 100, speed: 3.6, phase: 2.7 }
    ],
    checkpoints: [
      { x: 1098, y: 740, w: 18, h: 60, spawn: { x: 1082, y: 712 } },
      { x: 2058, y: 590, w: 18, h: 60, spawn: { x: 2042, y: 562 } }
    ],
    relics: [
      { x: 628, y: 812 },
      { x: 2288, y: 420 }
    ],
    boostPads: [
      { x: 2208, y: 528, w: 92, h: 12, forceX: 240, forceY: -90 }
    ]
  },
  {
    name: "1-5 The Grinder",
    world: { w: 3260, h: 1080 },
    spawn: { x: 70, y: 1012 },
    goal: { x: 3070, y: 298, w: 34, h: 62 },
    solids: [
      { x: 0, y: 1040, w: 260, h: 40 },
      { x: 320, y: 990, w: 220, h: 40 },
      { x: 600, y: 940, w: 220, h: 40 },
      { x: 880, y: 890, w: 220, h: 40 },
      { x: 1160, y: 840, w: 220, h: 40 },
      { x: 1440, y: 790, w: 220, h: 40 },
      { x: 1720, y: 740, w: 220, h: 40 },
      { x: 2000, y: 690, w: 220, h: 40 },
      { x: 2280, y: 640, w: 220, h: 40 },
      { x: 2560, y: 590, w: 220, h: 40 },
      { x: 2820, y: 520, w: 220, h: 30 },
      { x: 2940, y: 460, w: 170, h: 20 },
      { x: 3060, y: 390, w: 120, h: 20 }
    ],
    hazards: [
      { kind: "spike", dir: "up", x: 260, y: 1008, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 540, y: 958, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 820, y: 908, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 1100, y: 858, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 1380, y: 808, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 1660, y: 758, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 1940, y: 708, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 2220, y: 658, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 2500, y: 608, w: 60, h: 32 },
      { kind: "saw", x: 760, y: 860, r: 24, axis: "y", range: 110, speed: 3.8, phase: 0.3 },
      { kind: "saw", x: 1320, y: 760, r: 24, axis: "y", range: 110, speed: 4.0, phase: 1.1 },
      { kind: "saw", x: 1880, y: 660, r: 24, axis: "y", range: 110, speed: 4.2, phase: 2.0 },
      { kind: "saw", x: 2440, y: 560, r: 24, axis: "y", range: 110, speed: 4.4, phase: 2.8 },
      { kind: "saw", x: 2860, y: 430, r: 22, axis: "x", range: 110, speed: 4.0, phase: 0.5 },
      { kind: "saw", x: 3080, y: 340, r: 20, axis: "y", range: 80, speed: 4.6, phase: 1.6 }
    ],
    checkpoints: [
      { x: 1218, y: 840, w: 18, h: 60, spawn: { x: 1200, y: 812 } },
      { x: 2098, y: 690, w: 18, h: 60, spawn: { x: 2080, y: 662 } },
      { x: 2868, y: 520, w: 18, h: 60, spawn: { x: 2850, y: 492 } }
    ],
    relics: [
      { x: 1740, y: 708 },
      { x: 3026, y: 352 }
    ],
    boostPads: [
      { x: 2568, y: 578, w: 90, h: 12, forceX: 300, forceY: -80 },
      { x: 2888, y: 448, w: 82, h: 12, forceX: 160, forceY: -120 }
    ]
  },
  {
    name: "1-6 Neon Spill",
    world: { w: 3480, h: 1100 },
    spawn: { x: 70, y: 1032 },
    goal: { x: 3320, y: 288, w: 34, h: 62 },
    solids: [
      { x: 0, y: 1060, w: 280, h: 40 },
      { x: 330, y: 1010, w: 240, h: 40 },
      { x: 630, y: 960, w: 240, h: 40 },
      { x: 930, y: 910, w: 240, h: 40 },
      { x: 1230, y: 860, w: 240, h: 40 },
      { x: 1530, y: 810, w: 240, h: 40 },
      { x: 1830, y: 760, w: 240, h: 40 },
      { x: 2130, y: 710, w: 240, h: 40 },
      { x: 2430, y: 660, w: 240, h: 40 },
      { x: 2730, y: 610, w: 240, h: 40 },
      { x: 3010, y: 550, w: 260, h: 30 },
      { x: 3200, y: 480, w: 200, h: 20 },
      { x: 3320, y: 390, w: 120, h: 20 }
    ],
    hazards: [
      { kind: "spike", dir: "up", x: 280, y: 1028, w: 50, h: 32 },
      { kind: "spike", dir: "up", x: 580, y: 978, w: 50, h: 32 },
      { kind: "spike", dir: "up", x: 880, y: 928, w: 50, h: 32 },
      { kind: "spike", dir: "up", x: 1180, y: 878, w: 50, h: 32 },
      { kind: "spike", dir: "up", x: 1480, y: 828, w: 50, h: 32 },
      { kind: "spike", dir: "up", x: 1780, y: 778, w: 50, h: 32 },
      { kind: "spike", dir: "up", x: 2080, y: 728, w: 50, h: 32 },
      { kind: "spike", dir: "up", x: 2380, y: 678, w: 50, h: 32 },
      { kind: "saw", x: 1060, y: 820, r: 24, axis: "y", range: 110, speed: 4.2, phase: 0.4 },
      { kind: "saw", x: 1960, y: 670, r: 24, axis: "y", range: 120, speed: 4.4, phase: 1.4 },
      { kind: "saw", x: 2860, y: 520, r: 24, axis: "y", range: 115, speed: 4.5, phase: 2.1 }
    ],
    checkpoints: [
      { x: 1258, y: 860, w: 18, h: 60, spawn: { x: 1240, y: 832 } },
      { x: 2460, y: 660, w: 18, h: 60, spawn: { x: 2442, y: 632 } },
      { x: 3148, y: 550, w: 18, h: 60, spawn: { x: 3132, y: 522 } }
    ],
    relics: [
      { x: 1640, y: 772 },
      { x: 3232, y: 452 }
    ],
    boostPads: [
      { x: 2140, y: 698, w: 88, h: 12, forceX: 300, forceY: -85 },
      { x: 3022, y: 538, w: 86, h: 12, forceX: 220, forceY: -110 }
    ]
  },
  {
    name: "1-7 Reactor Climb",
    world: { w: 3600, h: 1280 },
    spawn: { x: 80, y: 1182 },
    goal: { x: 3410, y: 180, w: 34, h: 62 },
    solids: [
      { x: 0, y: 1240, w: 340, h: 40 },
      { x: 420, y: 1180, w: 230, h: 40 },
      { x: 700, y: 1120, w: 230, h: 40 },
      { x: 980, y: 1060, w: 230, h: 40 },
      { x: 1260, y: 1000, w: 230, h: 40 },
      { x: 1540, y: 940, w: 230, h: 40 },
      { x: 1820, y: 880, w: 230, h: 40 },
      { x: 2100, y: 820, w: 230, h: 40 },
      { x: 2380, y: 760, w: 230, h: 40 },
      { x: 2660, y: 700, w: 230, h: 40 },
      { x: 2940, y: 620, w: 230, h: 40 },
      { x: 3170, y: 520, w: 220, h: 30 },
      { x: 3310, y: 430, w: 170, h: 20 },
      { x: 3400, y: 340, w: 120, h: 20 }
    ],
    hazards: [
      { kind: "spike", dir: "up", x: 350, y: 1208, w: 70, h: 32 },
      { kind: "spike", dir: "up", x: 640, y: 1148, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 920, y: 1088, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 1200, y: 1028, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 1480, y: 968, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 1760, y: 908, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 2040, y: 848, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 2320, y: 788, w: 60, h: 32 },
      { kind: "saw", x: 1500, y: 840, r: 25, axis: "x", range: 150, speed: 4.4, phase: 0.2 },
      { kind: "saw", x: 2400, y: 670, r: 25, axis: "x", range: 150, speed: 4.5, phase: 1.1 },
      { kind: "saw", x: 3230, y: 460, r: 23, axis: "y", range: 90, speed: 4.8, phase: 2.4 }
    ],
    checkpoints: [
      { x: 1560, y: 940, w: 18, h: 60, spawn: { x: 1544, y: 912 } },
      { x: 2752, y: 700, w: 18, h: 60, spawn: { x: 2734, y: 672 } },
      { x: 3360, y: 430, w: 18, h: 60, spawn: { x: 3344, y: 402 } }
    ],
    relics: [
      { x: 1110, y: 1028 },
      { x: 2860, y: 660 },
      { x: 3442, y: 304 }
    ],
    boostPads: [
      { x: 2110, y: 808, w: 86, h: 12, forceX: 280, forceY: -100 },
      { x: 3180, y: 508, w: 88, h: 12, forceX: 190, forceY: -130 }
    ]
  },
  {
    name: "1-8 Crimson Heaven",
    world: { w: 3920, h: 1320 },
    spawn: { x: 90, y: 1222 },
    goal: { x: 3740, y: 220, w: 34, h: 62 },
    solids: [
      { x: 0, y: 1280, w: 360, h: 40 },
      { x: 430, y: 1220, w: 240, h: 40 },
      { x: 720, y: 1160, w: 240, h: 40 },
      { x: 1010, y: 1100, w: 240, h: 40 },
      { x: 1300, y: 1040, w: 240, h: 40 },
      { x: 1590, y: 980, w: 240, h: 40 },
      { x: 1880, y: 920, w: 240, h: 40 },
      { x: 2170, y: 860, w: 240, h: 40 },
      { x: 2460, y: 800, w: 240, h: 40 },
      { x: 2750, y: 740, w: 240, h: 40 },
      { x: 3040, y: 680, w: 240, h: 40 },
      { x: 3330, y: 600, w: 240, h: 40 },
      { x: 3550, y: 510, w: 220, h: 30 },
      { x: 3680, y: 420, w: 160, h: 20 },
      { x: 3760, y: 330, w: 120, h: 20 }
    ],
    hazards: [
      { kind: "spike", dir: "up", x: 370, y: 1248, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 660, y: 1188, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 950, y: 1128, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 1240, y: 1068, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 1530, y: 1008, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 1820, y: 948, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 2110, y: 888, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 2400, y: 828, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 2690, y: 768, w: 60, h: 32 },
      { kind: "spike", dir: "up", x: 2980, y: 708, w: 60, h: 32 },
      { kind: "saw", x: 1200, y: 980, r: 26, axis: "x", range: 165, speed: 4.7, phase: 0.4 },
      { kind: "saw", x: 2080, y: 800, r: 26, axis: "x", range: 165, speed: 4.9, phase: 1.3 },
      { kind: "saw", x: 2960, y: 620, r: 26, axis: "x", range: 165, speed: 5.1, phase: 2.1 },
      { kind: "saw", x: 3650, y: 390, r: 24, axis: "y", range: 95, speed: 5.0, phase: 0.8 }
    ],
    checkpoints: [
      { x: 1610, y: 980, w: 18, h: 60, spawn: { x: 1592, y: 952 } },
      { x: 2816, y: 740, w: 18, h: 60, spawn: { x: 2798, y: 712 } },
      { x: 3590, y: 510, w: 18, h: 60, spawn: { x: 3574, y: 482 } }
    ],
    relics: [
      { x: 1980, y: 882 },
      { x: 3124, y: 642 },
      { x: 3788, y: 292 }
    ],
    boostPads: [
      { x: 2476, y: 788, w: 88, h: 12, forceX: 300, forceY: -95 },
      { x: 3346, y: 588, w: 86, h: 12, forceX: 260, forceY: -120 },
      { x: 3564, y: 498, w: 86, h: 12, forceX: 230, forceY: -130 }
    ]
  }
];

function applyVariedLayouts() {
  const S = (x, y, w, h) => ({ x, y, w, h });
  const SPI = (x, y, w) => ({ kind: "spike", dir: "up", x, y, w, h: 32 });
  const SAW = (x, y, r, axis, range, speed, phase) => ({ kind: "saw", x, y, r, axis, range, speed, phase });
  const PF = (x, y, w, h, period = 1.85, duty = 0.56, phase = 0) => ({ kind: "pulseField", x, y, w, h, period, duty, phase });
  const RG = (x, y, w, h, period = 1.7, duty = 0.54, phase = 0, orientation = "vertical") => ({ kind: "rhythmGate", x, y, w, h, period, duty, phase, orientation });
  const CP = (x, y, sx, sy) => ({ x, y, w: 18, h: 60, spawn: { x: sx, y: sy } });
  const RL = (x, y) => ({ x, y });
  const BP = (x, y, w, forceX, forceY) => ({ x, y, w, h: 12, forceX, forceY });

  Object.assign(LEVELS[0], {
    name: "1-1 Abattoir Fork",
    goal: { x: 1692, y: 588, w: 34, h: 62 },
    solids: [
      S(0, 920, 420, 40), S(470, 860, 220, 20), S(720, 920, 240, 40), S(980, 840, 220, 20),
      S(1240, 900, 220, 20), S(1320, 820, 210, 20), S(1500, 740, 220, 20), S(1640, 650, 140, 20),
      S(860, 760, 150, 18)
    ],
    hazards: [
      SPI(420, 888, 44), SPI(960, 888, 40), SPI(1260, 868, 40),
      SAW(1130, 800, 20, "x", 90, 2.8, 0.5)
    ],
    checkpoints: [CP(1002, 780, 986, 812), CP(1512, 680, 1494, 712)],
    relics: [RL(884, 726), RL(1660, 616)],
    boostPads: [BP(1256, 888, 84, 180, -72)]
  });

  Object.assign(LEVELS[1], {
    name: "1-2 Steelworks Ducts",
    goal: { x: 1540, y: 478, w: 34, h: 62 },
    solids: [
      S(0, 920, 300, 40), S(360, 920, 260, 40), S(260, 780, 180, 20), S(650, 840, 180, 20),
      S(840, 700, 40, 260), S(900, 760, 200, 20), S(1120, 900, 200, 20), S(1180, 660, 200, 20),
      S(1420, 820, 180, 20), S(1460, 620, 180, 20), S(1520, 540, 140, 20)
    ],
    hazards: [
      SPI(300, 888, 60), SPI(620, 888, 60), SPI(1450, 788, 40),
      SAW(860, 760, 22, "y", 96, 3.0, 0.7), SAW(1290, 620, 20, "x", 80, 2.9, 1.4)
    ],
    checkpoints: [CP(918, 700, 900, 732), CP(1468, 560, 1452, 592)],
    relics: [RL(304, 746), RL(1542, 502)],
    boostPads: [BP(1132, 888, 84, 210, -70), BP(1470, 608, 82, 150, -90)]
  });

  Object.assign(LEVELS[2], {
    name: "1-3 Metro Switch",
    goal: { x: 2100, y: 678, w: 34, h: 62 },
    solids: [
      S(0, 940, 360, 40), S(420, 860, 220, 30), S(700, 940, 220, 40), S(980, 860, 220, 30),
      S(1260, 940, 220, 40), S(1540, 860, 220, 30), S(1820, 940, 220, 40), S(1980, 840, 200, 30),
      S(2080, 740, 120, 30), S(720, 760, 150, 18), S(1340, 760, 150, 18)
    ],
    hazards: [
      SPI(360, 908, 56), SPI(920, 908, 56), SPI(1480, 908, 56), SPI(2040, 908, 40),
      SAW(1100, 820, 22, "x", 110, 3.1, 0.2), SAW(1700, 820, 22, "x", 95, 3.2, 1.3)
    ],
    checkpoints: [CP(990, 800, 972, 832), CP(1840, 880, 1822, 912)],
    relics: [RL(760, 726), RL(2020, 802)],
    boostPads: [BP(1840, 928, 86, 220, -95)]
  });

  Object.assign(LEVELS[3], {
    name: "1-4 Bioforge Basin",
    goal: { x: 2420, y: 618, w: 34, h: 62 },
    solids: [
      S(0, 940, 320, 40), S(380, 940, 220, 40), S(660, 840, 220, 30), S(940, 920, 220, 40),
      S(1220, 820, 220, 30), S(1500, 900, 220, 40), S(1780, 820, 220, 30), S(2060, 880, 220, 40),
      S(2320, 780, 210, 30), S(2380, 680, 150, 20), S(1080, 700, 40, 240), S(1900, 680, 40, 220)
    ],
    hazards: [
      SPI(320, 908, 56), SPI(600, 908, 56), SPI(1160, 888, 56), SPI(1720, 868, 56), SPI(2340, 748, 40),
      SAW(980, 780, 22, "y", 90, 3.0, 0.4), SAW(1840, 760, 22, "x", 120, 3.2, 1.1),
      PF(1698, 776, 74, 44, 2.0, 0.5, 0.2), PF(2328, 742, 66, 38, 1.74, 0.48, 0.95)
    ],
    checkpoints: [CP(1232, 760, 1214, 792), CP(2340, 720, 2324, 752)],
    relics: [RL(700, 806), RL(2410, 642)],
    boostPads: [BP(2068, 868, 88, 200, -80)]
  });

  Object.assign(LEVELS[4], {
    name: "1-5 Neon Circuit",
    goal: { x: 3142, y: 618, w: 34, h: 62 },
    solids: [
      S(0, 1040, 360, 40), S(420, 1040, 260, 40), S(740, 940, 220, 30), S(1020, 1040, 240, 40),
      S(1320, 940, 220, 30), S(1600, 1040, 240, 40), S(1880, 940, 220, 30), S(2160, 1040, 240, 40),
      S(2440, 940, 220, 30), S(2720, 860, 220, 30), S(2980, 760, 200, 30), S(3120, 680, 150, 20)
    ],
    hazards: [
      SPI(360, 1008, 56), SPI(680, 1008, 56), SPI(1260, 1008, 56), SPI(1820, 1008, 56), SPI(2380, 1008, 56), SPI(3000, 728, 56),
      SAW(1500, 980, 23, "x", 110, 3.4, 0.6), SAW(2580, 900, 23, "x", 110, 3.5, 1.4)
    ],
    checkpoints: [CP(1332, 880, 1314, 912), CP(2452, 880, 2434, 912), CP(3000, 620, 2984, 652)],
    relics: [RL(1710, 1002), RL(3060, 722)],
    boostPads: [BP(1040, 1028, 86, 220, -80), BP(2168, 1028, 86, 220, -80), BP(2990, 748, 82, 180, -105)]
  });

  Object.assign(LEVELS[5], {
    name: "1-6 Ashplain Canyon",
    goal: { x: 3340, y: 498, w: 34, h: 62 },
    solids: [
      S(0, 1060, 340, 40), S(400, 980, 220, 30), S(680, 900, 220, 30), S(960, 820, 220, 30),
      S(1240, 900, 220, 30), S(1520, 980, 220, 30), S(1800, 1060, 260, 40), S(2100, 980, 220, 30),
      S(2380, 900, 220, 30), S(2660, 820, 220, 30), S(2940, 740, 220, 30), S(3220, 660, 200, 30),
      S(3360, 560, 120, 20)
    ],
    hazards: [
      SPI(360, 1028, 40), SPI(700, 868, 56), SPI(980, 788, 56), SPI(1520, 948, 56), SPI(1820, 1028, 60), SPI(2660, 788, 56),
      SAW(1420, 860, 22, "x", 120, 3.0, 0.5), SAW(2500, 840, 22, "x", 120, 3.1, 1.4)
    ],
    checkpoints: [CP(970, 760, 952, 792), CP(2120, 920, 2102, 952), CP(2960, 680, 2944, 712)],
    relics: [RL(1000, 782), RL(3290, 522)],
    boostPads: [BP(1818, 1048, 88, 210, -100), BP(3230, 548, 82, 170, -120)]
  });

  Object.assign(LEVELS[6], {
    name: "1-7 Reactor Rings",
    goal: { x: 3440, y: 838, w: 34, h: 62 },
    solids: [
      S(0, 1240, 360, 40), S(430, 1160, 220, 30), S(710, 1240, 240, 40), S(990, 1140, 220, 30),
      S(1270, 1240, 240, 40), S(1550, 1140, 220, 30), S(1830, 1240, 240, 40), S(2110, 1140, 220, 30),
      S(2390, 1180, 220, 30), S(2670, 1080, 220, 30), S(2950, 1160, 220, 30), S(3190, 1060, 220, 30),
      S(3360, 980, 170, 20), S(3450, 900, 120, 20)
    ],
    hazards: [
      SPI(360, 1208, 56), SPI(950, 1208, 56), SPI(1490, 1208, 56), SPI(2050, 1208, 56), SPI(2690, 1048, 56), SPI(3200, 1028, 56),
      SAW(1220, 1160, 24, "x", 130, 3.4, 0.6), SAW(2420, 1120, 24, "x", 140, 3.6, 1.7), SAW(3300, 940, 22, "y", 80, 3.8, 2.2),
      RG(1738, 1112, 32, 130, 1.72, 0.5, 0.3, "vertical"), RG(2968, 1138, 120, 26, 1.58, 0.46, 0.82, "horizontal")
    ],
    checkpoints: [CP(1560, 1080, 1544, 1112), CP(2690, 1020, 2672, 1052), CP(3370, 920, 3354, 952)],
    relics: [RL(1100, 1102), RL(2860, 1122), RL(3478, 862)],
    boostPads: [BP(2398, 1168, 86, 220, -96), BP(3200, 1048, 88, 190, -115)]
  });

  Object.assign(LEVELS[7], {
    name: "1-8 Heaven Labyrinth",
    goal: { x: 3760, y: 618, w: 34, h: 62 },
    solids: [
      S(0, 1280, 380, 40), S(450, 1200, 240, 30), S(740, 1120, 220, 30), S(1030, 1200, 240, 30),
      S(1320, 1100, 220, 30), S(1610, 1160, 240, 30), S(1900, 1060, 220, 30), S(2190, 1120, 240, 30),
      S(2480, 1020, 220, 30), S(2770, 1060, 240, 30), S(3060, 960, 220, 30), S(3350, 860, 220, 30),
      S(3600, 760, 180, 20), S(3780, 680, 120, 20)
    ],
    hazards: [
      SPI(380, 1248, 60), SPI(690, 1168, 50), SPI(1270, 1168, 50), SPI(1830, 1128, 50), SPI(2500, 988, 50), SPI(3080, 928, 50), SPI(3600, 728, 40),
      SAW(1460, 1080, 24, "x", 150, 3.7, 0.7), SAW(2580, 1020, 24, "x", 150, 3.8, 1.5), SAW(3460, 800, 24, "y", 90, 4.0, 2.1)
    ],
    checkpoints: [CP(1620, 1100, 1602, 1132), CP(2800, 1000, 2782, 1032), CP(3380, 800, 3362, 832)],
    relics: [RL(1960, 1022), RL(3200, 922), RL(3805, 642)],
    boostPads: [BP(2500, 1008, 86, 240, -95), BP(3364, 848, 86, 210, -115), BP(3610, 748, 82, 180, -120)]
  });
}

applyVariedLayouts();

const game = {
  levelIndex: 0,
  level: null,
  player: null,
  assistMode: false,
  deaths: 0,
  relicsCollected: 0,
  totalRelics: 0,
  bestRunMs: null,
  bestSplits: [],
  currentSplits: [],
  runStart: performance.now(),
  levelStart: performance.now(),
  levelDeathsStart: 0,
  activeSpawn: null,
  activeCheckpoint: -1,
  camera: { x: 0, y: 0 },
  trail: [],
  stains: [],
  particles: [],
  dust: [],
  flashTimer: 0,
  invulnTimer: 0,
  shakeTimer: 0,
  messageTimer: 0,
  won: false
};

const audioState = {
  unlocked: false,
  bgmMain: null,
  bgmLayer: null,
  pools: {},
  synthCtx: null,
  synthMaster: null,
  musicNextTime: 0,
  musicStep: 0,
  musicProfile: null,
  activeThemeKey: null,
  mainUrl: null,
  layerUrl: null
};

function deepCloneLevel(src) {
  return {
    name: src.name,
    world: { ...src.world },
    spawn: { ...src.spawn },
    goal: { ...src.goal },
    solids: src.solids.map((s) => ({ ...s })),
    hazards: src.hazards.map((h) => ({ ...h })),
    checkpoints: src.checkpoints.map((cp) => ({
      x: cp.x,
      y: cp.y,
      w: cp.w,
      h: cp.h,
      spawn: { ...cp.spawn }
    })),
    relics: (src.relics || []).map((r) => ({
      x: r.x,
      y: r.y,
      w: r.w || 18,
      h: r.h || 18,
      taken: false
    })),
    boostPads: (src.boostPads || []).map((b) => ({
      x: b.x,
      y: b.y,
      w: b.w || 72,
      h: b.h || 12,
      forceX: b.forceX || 0,
      forceY: b.forceY || 0
    }))
  };
}

function createPlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    w: PLAYER_CFG.w,
    h: PLAYER_CFG.h,
    vx: 0,
    vy: 0,
    onGround: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    airJumpsLeft: getMaxAirJumps(),
    boostCooldown: 0,
    facing: 1
  };
}

function getMaxAirJumps() {
  return game.assistMode ? PLAYER_CFG.airJumps + 1 : PLAYER_CFG.airJumps;
}

function loadAssistMode() {
  try {
    const raw = localStorage.getItem(ASSIST_MODE_KEY);
    if (raw == null) {
      return true;
    }
    return raw === "1";
  } catch (_) {
    return true;
  }
}

function saveAssistMode(enabled) {
  try {
    localStorage.setItem(ASSIST_MODE_KEY, enabled ? "1" : "0");
  } catch (_) {
    // Ignore storage errors.
  }
}

function syncAssistUi() {
  if (!assistToggleEl) {
    return;
  }
  assistToggleEl.textContent = game.assistMode ? "Assist: On" : "Assist: Off";
  assistToggleEl.classList.toggle("on", game.assistMode);
}

function toggleAssistMode(forceValue) {
  const next = typeof forceValue === "boolean" ? forceValue : !game.assistMode;
  game.assistMode = next;
  saveAssistMode(next);
  syncAssistUi();
  if (game.player) {
    game.player.airJumpsLeft = getMaxAirJumps();
  }
  showMessage(next ? "Assist Modus aktiv" : "Assist Modus aus", 0.8);
}

function loadBestRunMs() {
  try {
    const raw = localStorage.getItem(BEST_TIME_KEY);
    if (!raw) {
      return null;
    }
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch (_) {
    return null;
  }
}

function saveBestRunMs(ms) {
  try {
    localStorage.setItem(BEST_TIME_KEY, String(Math.floor(ms)));
  } catch (_) {
    // Ignore storage errors.
  }
}

function loadBestSplits() {
  try {
    const raw = localStorage.getItem(BEST_SPLITS_KEY);
    if (!raw) {
      return new Array(LEVELS.length).fill(null);
    }
    const parsed = JSON.parse(raw);
    const out = new Array(LEVELS.length).fill(null);
    if (!Array.isArray(parsed)) {
      return out;
    }
    for (let i = 0; i < out.length; i += 1) {
      const v = Number(parsed[i]);
      out[i] = Number.isFinite(v) && v > 0 ? v : null;
    }
    return out;
  } catch (_) {
    return new Array(LEVELS.length).fill(null);
  }
}

function saveBestSplits(splits) {
  try {
    localStorage.setItem(BEST_SPLITS_KEY, JSON.stringify(splits));
  } catch (_) {
    // Ignore storage errors.
  }
}

function countAllRelics() {
  let total = 0;
  for (const level of LEVELS) {
    total += (level.relics || []).length;
  }
  return total;
}

function startRun() {
  game.deaths = 0;
  game.won = false;
  game.relicsCollected = 0;
  game.totalRelics = countAllRelics();
  game.currentSplits = new Array(LEVELS.length).fill(null);
  game.runStart = performance.now();
  audioState.musicStep = 0;
  audioState.musicNextTime = 0;
  loadLevel(0);
  showMessage("Los geht's!", 0.9);
}

function loadLevel(index) {
  game.levelIndex = index;
  rebuildThemeAudio();
  game.level = deepCloneLevel(LEVELS[index]);
  game.player = createPlayer(game.level.spawn);
  game.activeSpawn = { ...game.level.spawn };
  game.activeCheckpoint = -1;
  game.levelStart = performance.now();
  game.levelDeathsStart = game.deaths;
  game.trail = [];
  game.stains = [];
  game.particles = [];
  game.dust = [];
  game.flashTimer = 0;
  game.invulnTimer = game.assistMode ? 0.9 : 0.55;
  game.shakeTimer = 0;

  const maxCamX = Math.max(0, game.level.world.w - canvas.width);
  const maxCamY = Math.max(0, game.level.world.h - canvas.height);
  game.camera.x = clamp(game.player.x + game.player.w * 0.5 - canvas.width * 0.5, 0, maxCamX);
  game.camera.y = clamp(game.player.y + game.player.h * 0.5 - canvas.height * 0.5, 0, maxCamY);
  seedDust();
  syncHud();
}

function resetPlayer() {
  const spawn = game.activeSpawn || game.level.spawn;
  game.player.x = spawn.x;
  game.player.y = spawn.y;
  game.player.vx = 0;
  game.player.vy = 0;
  game.player.onGround = false;
  game.player.coyoteTimer = 0;
  game.player.jumpBufferTimer = 0;
  game.player.airJumpsLeft = getMaxAirJumps();
  game.player.boostCooldown = 0;
  game.invulnTimer = game.assistMode ? 0.72 : 0.42;
  game.trail = [];
}
function showMessage(text, durationSec = 1.2) {
  messageEl.textContent = text;
  messageEl.classList.remove("hidden");
  game.messageTimer = durationSec;
}

function hideMessage() {
  messageEl.classList.add("hidden");
}

function syncHud() {
  const theme = getActiveTheme();
  levelText.textContent = `${game.levelIndex + 1} / ${LEVELS.length} - ${game.level.name} [${theme.label}]`;
  deathsText.textContent = String(game.deaths);
  bestText.textContent = game.bestRunMs == null ? "--:--.--" : formatTime(game.bestRunMs);
  const bestSplit = game.bestSplits[game.levelIndex];
  bestSplitText.textContent = bestSplit == null ? "--:--.--" : formatTime(bestSplit);
  relicText.textContent = `${game.relicsCollected} / ${game.totalRelics}`;
  syncAssistUi();
}

function updateTimer(now) {
  timerText.textContent = formatTime(now - game.runStart);
}

function updateSplitTimer(now) {
  splitText.textContent = formatTime(now - game.levelStart);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getActiveTheme() {
  const index = Math.max(0, Math.min(game.levelIndex, LEVEL_THEME_ORDER.length - 1));
  const key = LEVEL_THEME_ORDER[index];
  return THEMES[key] || THEMES.abattoir;
}

function getActiveThemeKey() {
  const index = Math.max(0, Math.min(game.levelIndex, LEVEL_THEME_ORDER.length - 1));
  return LEVEL_THEME_ORDER[index] || "abattoir";
}

function hexToRgba(hex, alpha) {
  const cleaned = hex.replace("#", "");
  const full = cleaned.length === 3
    ? cleaned.split("").map((c) => c + c).join("")
    : cleaned;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function withAlpha(color, alpha) {
  if (color.startsWith("#")) {
    return hexToRgba(color, alpha);
  }
  const m = color.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
  }
  return color;
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function shrinkRect(rect, amount) {
  return {
    x: rect.x + amount,
    y: rect.y + amount,
    w: rect.w - amount * 2,
    h: rect.h - amount * 2
  };
}

function circleRectOverlap(cx, cy, radius, rect) {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

function getSawPosition(saw, levelSeconds) {
  const speedMul = game.assistMode ? 0.62 : 0.82;
  const offset = Math.sin(levelSeconds * saw.speed * speedMul + saw.phase) * saw.range;
  return {
    x: saw.x + (saw.axis === "x" ? offset : 0),
    y: saw.y + (saw.axis === "y" ? offset : 0)
  };
}

function getCycleLocal(levelSeconds, period, phase = 0) {
  const p = Math.max(0.18, period || 1.6);
  const shifted = levelSeconds + phase;
  return ((shifted % p) + p) % p;
}

function getPulseFieldState(field, levelSeconds) {
  const basePeriod = Math.max(0.2, field.period || 1.8);
  const baseDuty = clamp(field.duty == null ? 0.56 : field.duty, 0.14, 0.9);
  const period = basePeriod * (game.assistMode ? 1.16 : 1);
  const duty = clamp(baseDuty * (game.assistMode ? 0.86 : 1), 0.12, 0.9);
  const local = getCycleLocal(levelSeconds, period, field.phase || 0);
  const activeWindow = period * duty;
  const active = local < activeWindow;
  const phase = active ? local / Math.max(0.001, activeWindow) : (local - activeWindow) / Math.max(0.001, period - activeWindow);
  const intensity = active
    ? 0.72 + Math.sin(phase * Math.PI) * 0.28
    : 0.2 + Math.sin(phase * Math.PI * 2) * 0.05;
  return { active, intensity, period, duty, local };
}

function getRhythmGateState(gate, levelSeconds) {
  const basePeriod = Math.max(0.2, gate.period || 1.7);
  const baseDuty = clamp(gate.duty == null ? 0.54 : gate.duty, 0.18, 0.92);
  const period = basePeriod * (game.assistMode ? 1.14 : 1);
  const duty = clamp(baseDuty * (game.assistMode ? 0.88 : 1), 0.16, 0.92);
  const local = getCycleLocal(levelSeconds, period, gate.phase || 0);
  const activeWindow = period * duty;
  const active = local < activeWindow;
  const fade = Math.min(0.12, period * 0.24);

  let closedRatio = 0;
  if (active) {
    const fadeIn = local < fade ? local / fade : 1;
    const remaining = activeWindow - local;
    const fadeOut = remaining < fade ? remaining / fade : 1;
    closedRatio = clamp(Math.min(fadeIn, fadeOut), 0, 1);
  }
  return { active, closedRatio, period, duty, local };
}

function getRhythmGateRect(gate, state) {
  const orient = gate.orientation || "vertical";
  if (orient === "horizontal") {
    const h = Math.max(0, gate.h * state.closedRatio);
    return {
      x: gate.x,
      y: gate.y + (gate.h - h) * 0.5,
      w: gate.w,
      h
    };
  }
  const w = Math.max(0, gate.w * state.closedRatio);
  return {
    x: gate.x + (gate.w - w) * 0.5,
    y: gate.y,
    w,
    h: gate.h
  };
}

function getWallContact(player) {
  const probe = 2;
  const leftProbe = { x: player.x - probe, y: player.y + 2, w: probe, h: player.h - 4 };
  const rightProbe = { x: player.x + player.w, y: player.y + 2, w: probe, h: player.h - 4 };
  let left = false;
  let right = false;

  for (const solid of game.level.solids) {
    if (!left && rectsOverlap(leftProbe, solid)) {
      left = true;
    }
    if (!right && rectsOverlap(rightProbe, solid)) {
      right = true;
    }
    if (left && right) {
      break;
    }
  }

  if (left) {
    return -1;
  }
  if (right) {
    return 1;
  }
  return 0;
}

function ensureAudioUnlocked() {
  if (!audioState.unlocked) {
    audioState.unlocked = true;
  }
  if (!audioState.bgmMain) {
    initAudio();
  }
  if (!audioState.synthCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioState.synthCtx = new AudioCtx();
      audioState.synthMaster = audioState.synthCtx.createGain();
      audioState.synthMaster.gain.value = 0.46;
      audioState.synthMaster.connect(audioState.synthCtx.destination);
    }
  }
  if (audioState.synthCtx && audioState.synthCtx.state === "suspended") {
    audioState.synthCtx.resume().catch(() => {});
  }
  if (audioState.bgmMain && audioState.bgmMain.paused) {
    audioState.bgmMain.play().catch(() => {});
  }
  if (audioState.bgmLayer && audioState.bgmLayer.paused) {
    audioState.bgmLayer.play().catch(() => {});
  }
}

function createAudioPool(url, size, volume) {
  const sounds = [];
  for (let i = 0; i < size; i += 1) {
    const audio = new Audio(url);
    audio.preload = "auto";
    audio.volume = volume;
    sounds.push(audio);
  }
  return { sounds, index: 0, volume };
}

function getActiveThemeAudioProfile() {
  const key = getActiveThemeKey();
  return THEME_AUDIO_PROFILES[key] || THEME_AUDIO_PROFILES.abattoir;
}

function rebuildThemeAudio(force = false) {
  const key = getActiveThemeKey();
  const profile = getActiveThemeAudioProfile();
  const changed =
    force ||
    key !== audioState.activeThemeKey ||
    profile.mainUrl !== audioState.mainUrl ||
    profile.layerUrl !== audioState.layerUrl;

  audioState.musicProfile = profile;
  if (!changed) {
    if (audioState.bgmMain) {
      audioState.bgmMain.playbackRate = profile.mainRate;
    }
    if (audioState.bgmLayer) {
      audioState.bgmLayer.playbackRate = profile.layerRate;
    }
    return;
  }

  if (audioState.bgmMain) {
    audioState.bgmMain.pause();
  }
  if (audioState.bgmLayer) {
    audioState.bgmLayer.pause();
  }

  const bgmMain = new Audio(profile.mainUrl);
  bgmMain.loop = true;
  bgmMain.preload = "auto";
  bgmMain.volume = profile.mainBase;
  bgmMain.playbackRate = profile.mainRate;
  audioState.bgmMain = bgmMain;

  audioState.bgmLayer = null;
  if (profile.layerUrl) {
    const bgmLayer = new Audio(profile.layerUrl);
    bgmLayer.loop = true;
    bgmLayer.preload = "auto";
    bgmLayer.volume = profile.layerBase * 0.2;
    bgmLayer.playbackRate = profile.layerRate;
    audioState.bgmLayer = bgmLayer;
    audioState.bgmLayer.addEventListener("error", () => {
      audioState.bgmLayer = null;
    }, { once: true });
  }

  audioState.activeThemeKey = key;
  audioState.mainUrl = profile.mainUrl;
  audioState.layerUrl = profile.layerUrl;
  audioState.musicStep = 0;
  audioState.musicNextTime = 0;

  if (audioState.unlocked) {
    audioState.bgmMain.play().catch(() => {});
    if (audioState.bgmLayer) {
      audioState.bgmLayer.play().catch(() => {});
    }
  }
}

function initAudio() {
  if (audioState.bgmMain) {
    return;
  }
  rebuildThemeAudio(true);

  // Jump sounds are synthesized to avoid keypad-like tones.
  audioState.pools.death = createAudioPool(AUDIO_ASSETS.death, 4, 0.23);
  audioState.pools.checkpoint = createAudioPool(AUDIO_ASSETS.checkpoint, 3, 0.2);
  audioState.pools.goal = createAudioPool(AUDIO_ASSETS.goal, 4, 0.27);
  audioState.pools.relic = createAudioPool(AUDIO_ASSETS.goal, 4, 0.18);
  audioState.pools.boost = createAudioPool(AUDIO_ASSETS.checkpoint, 4, 0.14);
  audioState.pools.restart = createAudioPool(AUDIO_ASSETS.restart, 3, 0.17);
}

function playJumpSynth(kind, rate = 1) {
  if (!audioState.synthCtx || !audioState.synthMaster) {
    return;
  }
  const now = audioState.synthCtx.currentTime;
  const oscA = audioState.synthCtx.createOscillator();
  const oscB = audioState.synthCtx.createOscillator();
  const gain = audioState.synthCtx.createGain();
  const filter = audioState.synthCtx.createBiquadFilter();

  const isWall = kind === "wallJump";
  const isDouble = kind === "doubleJump";
  const base = isDouble ? 360 : isWall ? 280 : 230;
  const end = isDouble ? 680 : isWall ? 540 : 470;
  const duration = isDouble ? 0.16 : 0.12;
  const amplitude = isDouble ? 0.17 : 0.14;

  oscA.type = isDouble ? "triangle" : "sine";
  oscB.type = "triangle";

  oscA.frequency.setValueAtTime(base * rate, now);
  oscA.frequency.exponentialRampToValueAtTime(end * rate, now + duration);

  oscB.frequency.setValueAtTime(base * 1.8 * rate, now);
  oscB.frequency.exponentialRampToValueAtTime(end * 1.3 * rate, now + duration * 0.86);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, now);
  filter.frequency.exponentialRampToValueAtTime(640, now + duration);
  filter.Q.value = 0.8;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(amplitude, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscA.connect(filter);
  oscB.connect(filter);
  filter.connect(gain);
  gain.connect(audioState.synthMaster);

  oscA.start(now);
  oscB.start(now);
  oscA.stop(now + duration + 0.02);
  oscB.stop(now + duration + 0.02);
}

function playSfx(kind, rate = 1) {
  if (!audioState.unlocked) {
    return;
  }
  if (kind === "jump" || kind === "wallJump" || kind === "doubleJump") {
    playJumpSynth(kind, rate);
    return;
  }
  const pool = audioState.pools[kind];
  if (!pool || pool.sounds.length === 0) {
    return;
  }
  const sound = pool.sounds[pool.index];
  pool.index = (pool.index + 1) % pool.sounds.length;
  sound.pause();
  sound.currentTime = 0;
  sound.playbackRate = rate;
  sound.volume = pool.volume;
  sound.play().catch(() => {});
}

function maintainAudio() {
  if (!audioState.unlocked || !audioState.bgmMain) {
    return;
  }
  if (audioState.bgmMain.paused && !game.won) {
    audioState.bgmMain.play().catch(() => {});
  }
  if (audioState.bgmLayer && audioState.bgmLayer.paused && !game.won) {
    audioState.bgmLayer.play().catch(() => {});
  }

  const progress = LEVELS.length > 1 ? game.levelIndex / (LEVELS.length - 1) : 0;
  const motion = game.player ? clamp(Math.abs(game.player.vx) / PLAYER_CFG.maxSpeedX, 0, 1) : 0;
  const profile = audioState.musicProfile || getActiveThemeAudioProfile();
  const energy = clamp(progress * 0.72 + motion * 0.28, 0, 1);
  const targetLayer = game.won ? 0.05 : profile.layerBase + energy * 0.3;
  const targetMain = game.won ? 0.42 : profile.mainBase + (1 - energy) * 0.1;

  audioState.bgmMain.volume += (targetMain - audioState.bgmMain.volume) * 0.05;
  if (audioState.bgmLayer) {
    audioState.bgmLayer.volume += (targetLayer - audioState.bgmLayer.volume) * 0.06;
  }
  if (audioState.synthMaster) {
    const synthBase = profile.synthBase == null ? 0.36 : profile.synthBase;
    const targetSynth = game.won ? 0.2 : synthBase + energy * 0.14;
    audioState.synthMaster.gain.value += (targetSynth - audioState.synthMaster.gain.value) * 0.07;
  }

  scheduleMusicBed(energy);
}

function scheduleMusicBed(energy) {
  if (!audioState.synthCtx || !audioState.synthMaster) {
    return;
  }

  const profile = audioState.musicProfile || getActiveThemeAudioProfile();
  const beat = profile.beat;
  const lookAhead = 0.22;
  const now = audioState.synthCtx.currentTime;
  if (audioState.musicNextTime < now) {
    audioState.musicNextTime = now + 0.03;
  }

  while (audioState.musicNextTime < now + lookAhead) {
    const t = audioState.musicNextTime;
    const step = audioState.musicStep;
    const scale = profile.scale;
    const note = profile.root * Math.pow(2, scale[step % scale.length] / 12);
    const arpDiv = Math.max(1, profile.arpDiv || 2);
    const arpChance = profile.arpChance == null ? 0.75 : profile.arpChance;
    const pulseDiv = Math.max(1, profile.pulseDiv || 3);
    const pulseFreq = profile.pulseFreq || 320;

    const bass = audioState.synthCtx.createOscillator();
    const bassGain = audioState.synthCtx.createGain();
    bass.type = profile.bassWave || "sine";
    bass.frequency.setValueAtTime(note, t);
    bass.frequency.exponentialRampToValueAtTime(note * 0.98, t + beat * 0.9);
    bassGain.gain.setValueAtTime(0.0001, t);
    bassGain.gain.linearRampToValueAtTime(0.03 + energy * 0.04, t + 0.02);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.92);
    bass.connect(bassGain);
    bassGain.connect(audioState.synthMaster);
    bass.start(t);
    bass.stop(t + beat + 0.03);

    if (step % arpDiv === 0 && Math.random() < arpChance) {
      const arp = audioState.synthCtx.createOscillator();
      const arpGain = audioState.synthCtx.createGain();
      arp.type = profile.arpWave || "triangle";
      arp.frequency.setValueAtTime(note * 2, t + 0.01);
      arp.frequency.exponentialRampToValueAtTime(note * (2.45 + (step % 3) * 0.12), t + beat * 0.62);
      arpGain.gain.setValueAtTime(0.0001, t + 0.01);
      arpGain.gain.linearRampToValueAtTime(0.01 + energy * 0.03, t + 0.035);
      arpGain.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.74);
      arp.connect(arpGain);
      arpGain.connect(audioState.synthMaster);
      arp.start(t + 0.01);
      arp.stop(t + beat * 0.8);
    }

    if (step % pulseDiv === 0) {
      const pulse = audioState.synthCtx.createOscillator();
      const pulseGain = audioState.synthCtx.createGain();
      pulse.type = "square";
      pulse.frequency.setValueAtTime(pulseFreq + (step % 4) * 18, t);
      pulse.frequency.exponentialRampToValueAtTime(pulseFreq * 0.72, t + beat * 0.24);
      pulseGain.gain.setValueAtTime(0.0001, t);
      pulseGain.gain.linearRampToValueAtTime(0.006 + energy * 0.016, t + 0.005);
      pulseGain.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.25);
      pulse.connect(pulseGain);
      pulseGain.connect(audioState.synthMaster);
      pulse.start(t);
      pulse.stop(t + beat * 0.28);
    }

    audioState.musicNextTime += beat;
    audioState.musicStep += 1;
  }
}

function moveAndCollideX(player, dt) {
  player.x += player.vx * dt;
  for (const solid of game.level.solids) {
    if (!rectsOverlap(player, solid)) {
      continue;
    }
    if (player.vx > 0) {
      player.x = solid.x - player.w;
    } else if (player.vx < 0) {
      player.x = solid.x + solid.w;
    }
    player.vx = 0;
  }
}

function moveAndCollideY(player, dt) {
  player.y += player.vy * dt;
  player.onGround = false;

  for (const solid of game.level.solids) {
    if (!rectsOverlap(player, solid)) {
      continue;
    }
    if (player.vy > 0) {
      player.y = solid.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (player.vy < 0) {
      player.y = solid.y + solid.h;
      player.vy = 0;
    }
  }
}
function spawnDeathEffects(player) {
  const centerX = player.x + player.w * 0.5;
  const centerY = player.y + player.h * 0.5;

  game.stains.push({
    x: centerX + (Math.random() - 0.5) * 14,
    y: centerY + (Math.random() - 0.5) * 14,
    r: 9 + Math.random() * 10,
    alpha: 0.32 + Math.random() * 0.28
  });
  if (game.stains.length > 220) {
    game.stains.splice(0, game.stains.length - 220);
  }

  for (let i = 0; i < 28; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const speed = 140 + Math.random() * 340;
    game.particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 85,
      life: 0.22 + Math.random() * 0.45,
      maxLife: 0.67,
      size: 2 + Math.random() * 3
    });
  }
}

function spawnJumpBurst(player, bright = false) {
  const centerX = player.x + player.w * 0.5;
  const centerY = player.y + player.h * 0.65;
  for (let i = 0; i < 14; i += 1) {
    const a = Math.PI + (Math.random() - 0.5) * 1.2;
    const speed = 80 + Math.random() * 180;
    game.particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 0.16 + Math.random() * 0.2,
      maxLife: 0.36,
      size: bright ? 3.4 : 2.6,
      color: bright ? "#ffd47b" : "#ff7e87"
    });
  }
}

function activateCheckpoint(index) {
  if (index === game.activeCheckpoint) {
    return;
  }
  const cp = game.level.checkpoints[index];
  game.activeCheckpoint = index;
  game.activeSpawn = { ...cp.spawn };
  game.flashTimer = Math.max(game.flashTimer, 0.12);
  playSfx("checkpoint");
  showMessage(`Checkpoint ${index + 1}`, 0.7);

  for (let i = 0; i < 16; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 170;
    game.particles.push({
      x: cp.x + cp.w * 0.5,
      y: cp.y + 8,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 0.18 + Math.random() * 0.28,
      maxLife: 0.46,
      size: 2.4,
      color: "#ffe18c"
    });
  }
}

function collectRelic(relic) {
  if (relic.taken) {
    return;
  }
  relic.taken = true;
  game.relicsCollected += 1;
  syncHud();
  playSfx("relic", 1.12);
  showMessage(`Relic ${game.relicsCollected}/${game.totalRelics}`, 0.7);

  for (let i = 0; i < 18; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const speed = 95 + Math.random() * 190;
    game.particles.push({
      x: relic.x + relic.w * 0.5,
      y: relic.y + relic.h * 0.5,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 30,
      life: 0.22 + Math.random() * 0.25,
      maxLife: 0.52,
      size: 2.3 + Math.random() * 1.8,
      color: "#93f7ff"
    });
  }
}

function triggerBoostPad(boost, player) {
  if (player.boostCooldown > 0) {
    return;
  }
  player.vx = clamp(player.vx + boost.forceX, -PLAYER_CFG.maxSpeedX * 1.35, PLAYER_CFG.maxSpeedX * 1.35);
  player.vy += boost.forceY;
  player.boostCooldown = game.assistMode ? 0.2 : 0.3;
  game.flashTimer = Math.max(game.flashTimer, 0.08);
  playSfx("boost", 1.28);

  const centerX = boost.x + boost.w * 0.5;
  const centerY = boost.y + boost.h * 0.5;
  for (let i = 0; i < 12; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const speed = 70 + Math.random() * 130;
    game.particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(a) * speed + boost.forceX * 0.15,
      vy: Math.sin(a) * speed,
      life: 0.14 + Math.random() * 0.18,
      maxLife: 0.38,
      size: 2 + Math.random() * 2,
      color: "#8effbe"
    });
  }
}

function killPlayer() {
  spawnDeathEffects(game.player);
  playSfx("death");
  game.deaths += 1;
  deathsText.textContent = String(game.deaths);
  game.flashTimer = 0.18;
  game.shakeTimer = 0.26;
  resetPlayer();
}

function toNextLevel(now) {
  const completedIndex = game.levelIndex;
  const completedLabel = completedIndex + 1;
  const splitMs = now - game.levelStart;
  const deathsThisLevel = game.deaths - game.levelDeathsStart;
  const flawless = deathsThisLevel === 0;
  game.currentSplits[completedIndex] = splitMs;

  const bestSplit = game.bestSplits[completedIndex];
  const newSplitRecord = bestSplit == null || splitMs < bestSplit;
  if (newSplitRecord) {
    game.bestSplits[completedIndex] = splitMs;
    saveBestSplits(game.bestSplits);
  }

  const splitSuffix = newSplitRecord
    ? `${formatTime(splitMs)} (PB)`
    : `${formatTime(splitMs)} (${formatDelta(splitMs - bestSplit)})`;
  const flawlessSuffix = flawless ? " | Flawless" : "";

  playSfx("goal");

  if (completedIndex + 1 >= LEVELS.length) {
    game.won = true;
    const runMs = now - game.runStart;
    const runRecord = game.bestRunMs == null || runMs < game.bestRunMs;
    if (runRecord) {
      game.bestRunMs = runMs;
      saveBestRunMs(runMs);
      syncHud();
    }

    showMessage(
      runRecord
        ? `Run clear ${formatTime(runMs)}! Split ${splitSuffix}${flawlessSuffix}. Relics ${game.relicsCollected}/${game.totalRelics}. Neuer Rekord. R fuer neuen Run.`
        : `Run clear ${formatTime(runMs)}. Split ${splitSuffix}${flawlessSuffix}. Relics ${game.relicsCollected}/${game.totalRelics}. R fuer neuen Run.`,
      9999
    );
    return;
  }

  loadLevel(completedIndex + 1);
  if (flawless) {
    game.invulnTimer = Math.max(game.invulnTimer, 0.8);
  }
  showMessage(`Level ${completedLabel} clear - Split ${splitSuffix}${flawlessSuffix}`, 1.4);
}

function justPressedJump() {
  return INPUT.jump && !INPUT.prevJump;
}

function justPressedRestart() {
  return INPUT.restart && !INPUT.prevRestart;
}

function updateParticles(dt) {
  for (let i = game.particles.length - 1; i >= 0; i -= 1) {
    const p = game.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      game.particles.splice(i, 1);
      continue;
    }
    p.vy += 1900 * dt;
    p.vx *= Math.max(0, 1 - 2.2 * dt);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

function seedDust() {
  const count = 120;
  game.dust.length = 0;
  for (let i = 0; i < count; i += 1) {
    game.dust.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: 0.25 + Math.random() * 0.95,
      size: 1 + Math.random() * 2.5
    });
  }
}

function updateDust(dt) {
  const speedX = (game.player ? game.player.vx : 0) * 0.06;
  for (const d of game.dust) {
    d.x -= speedX * d.z * dt * 60 + 14 * d.z * dt;
    d.y += Math.sin((d.x + d.y) * 0.01) * 8 * dt;
    if (d.x < -8) {
      d.x = canvas.width + Math.random() * 20;
      d.y = Math.random() * canvas.height;
    } else if (d.x > canvas.width + 8) {
      d.x = -Math.random() * 20;
      d.y = Math.random() * canvas.height;
    }
    if (d.y < -8) {
      d.y = canvas.height + Math.random() * 8;
    } else if (d.y > canvas.height + 8) {
      d.y = -Math.random() * 8;
    }
  }
}

function update(dt, now) {
  maintainAudio();
  updateParticles(dt);
  updateDust(dt);
  game.invulnTimer = Math.max(0, game.invulnTimer - dt);
  game.shakeTimer = Math.max(0, game.shakeTimer - dt);

  if (game.messageTimer > 0 && game.messageTimer < 9999) {
    game.messageTimer -= dt;
    if (game.messageTimer <= 0) {
      hideMessage();
    }
  }

  updateTimer(now);
  updateSplitTimer(now);

  if (game.won) {
    if (justPressedRestart()) {
      hideMessage();
      playSfx("restart");
      startRun();
    }
    return;
  }

  if (justPressedRestart()) {
    loadLevel(game.levelIndex);
    showMessage("Level neu gestartet", 0.7);
    playSfx("restart");
    return;
  }

  const player = game.player;
  const coyoteWindow = game.assistMode ? PLAYER_CFG.coyoteTime + 0.1 : PLAYER_CFG.coyoteTime + 0.04;
  const jumpBufferWindow = game.assistMode ? PLAYER_CFG.jumpBufferTime + 0.1 : PLAYER_CFG.jumpBufferTime + 0.03;
  const gravityNow = game.assistMode ? PLAYER_CFG.gravity * 0.82 : PLAYER_CFG.gravity * 0.92;
  const maxFallNow = game.assistMode ? PLAYER_CFG.maxFallSpeed * 0.82 : PLAYER_CFG.maxFallSpeed * 0.92;
  const maxAirJumps = getMaxAirJumps();
  player.boostCooldown = Math.max(0, player.boostCooldown - dt);

  const moveInput = (INPUT.right ? 1 : 0) - (INPUT.left ? 1 : 0);
  if (moveInput !== 0) {
    player.facing = moveInput;
  }

  if (justPressedJump()) {
    player.jumpBufferTimer = jumpBufferWindow;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  }

  if (player.onGround) {
    player.coyoteTimer = coyoteWindow;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  }

  if (moveInput !== 0) {
    player.vx += moveInput * PLAYER_CFG.accel * dt;
  } else {
    const drag = player.onGround ? PLAYER_CFG.groundDrag : PLAYER_CFG.airDrag;
    const dragAmount = drag * dt;
    if (Math.abs(player.vx) <= dragAmount) {
      player.vx = 0;
    } else {
      player.vx -= Math.sign(player.vx) * dragAmount;
    }
  }

  player.vx = clamp(player.vx, -PLAYER_CFG.maxSpeedX, PLAYER_CFG.maxSpeedX);

  const wallSide = getWallContact(player);
  const pushingWall =
    (wallSide === -1 && INPUT.left) ||
    (wallSide === 1 && INPUT.right);

  if (!player.onGround && pushingWall && player.vy > PLAYER_CFG.wallSlideSpeed) {
    player.vy = PLAYER_CFG.wallSlideSpeed;
  }

  if (player.jumpBufferTimer > 0) {
    if (player.onGround || player.coyoteTimer > 0) {
      player.vy = -PLAYER_CFG.jumpSpeed;
      player.onGround = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      spawnJumpBurst(player, false);
      playSfx("jump", 1);
    } else if (wallSide !== 0) {
      player.vy = -PLAYER_CFG.wallJumpY;
      player.vx = wallSide === -1 ? PLAYER_CFG.wallJumpX : -PLAYER_CFG.wallJumpX;
      player.facing = wallSide === -1 ? 1 : -1;
      player.jumpBufferTimer = 0;
      player.airJumpsLeft = maxAirJumps;
      spawnJumpBurst(player, false);
      playSfx("wallJump", 1.2);
    } else if (player.airJumpsLeft > 0) {
      player.vy = -PLAYER_CFG.doubleJumpSpeed;
      player.airJumpsLeft -= 1;
      player.jumpBufferTimer = 0;
      spawnJumpBurst(player, true);
      playSfx("doubleJump", 1.05);
    }
  }

  player.vy += gravityNow * dt;
  if (!INPUT.jump && player.vy < 0) {
    player.vy += gravityNow * (PLAYER_CFG.jumpReleaseGravityMult - 1) * dt;
  }
  player.vy = Math.min(player.vy, maxFallNow);

  moveAndCollideX(player, dt);
  moveAndCollideY(player, dt);

  if (player.onGround) {
    player.coyoteTimer = coyoteWindow;
    player.airJumpsLeft = maxAirJumps;
  }

  if (player.y > game.level.world.h + 140 || player.x < -120 || player.x > game.level.world.w + 120) {
    killPlayer();
    return;
  }

  const levelSeconds = (now - game.levelStart) / 1000;
  const safePadding = game.assistMode ? 8 : 6;
  const playerHitbox = shrinkRect(player, safePadding);

  for (let i = 0; i < game.level.checkpoints.length; i += 1) {
    if (rectsOverlap(playerHitbox, game.level.checkpoints[i])) {
      activateCheckpoint(i);
      break;
    }
  }

  for (const relic of game.level.relics) {
    if (!relic.taken && rectsOverlap(playerHitbox, relic)) {
      collectRelic(relic);
    }
  }

  for (const boost of game.level.boostPads) {
    if (rectsOverlap(playerHitbox, boost)) {
      triggerBoostPad(boost, player);
    }
  }

  if (game.invulnTimer <= 0) {
    for (const hazard of game.level.hazards) {
      if (hazard.kind === "spike") {
        if (rectsOverlap(playerHitbox, hazard)) {
          killPlayer();
          return;
        }
      } else if (hazard.kind === "saw") {
        const saw = getSawPosition(hazard, levelSeconds);
        if (circleRectOverlap(saw.x, saw.y, hazard.r, playerHitbox)) {
          killPlayer();
          return;
        }
      } else if (hazard.kind === "pulseField") {
        const field = getPulseFieldState(hazard, levelSeconds);
        if (field.active && rectsOverlap(playerHitbox, hazard)) {
          killPlayer();
          return;
        }
      } else if (hazard.kind === "rhythmGate") {
        const gate = getRhythmGateState(hazard, levelSeconds);
        if (gate.closedRatio > 0.08) {
          const gateRect = getRhythmGateRect(hazard, gate);
          if (gateRect.w > 1 && gateRect.h > 1 && rectsOverlap(playerHitbox, gateRect)) {
            killPlayer();
            return;
          }
        }
      }
    }
  }

  if (rectsOverlap(player, game.level.goal)) {
    toNextLevel(now);
    return;
  }

  game.trail.unshift({ x: player.x, y: player.y, alpha: 0.35 });
  if (game.trail.length > 14) {
    game.trail.length = 14;
  }
  for (const t of game.trail) {
    t.alpha *= 0.9;
  }

  const maxCamX = Math.max(0, game.level.world.w - canvas.width);
  const maxCamY = Math.max(0, game.level.world.h - canvas.height);
  const targetCamX = clamp(player.x + player.w * 0.5 - canvas.width * 0.5, 0, maxCamX);
  const targetCamY = clamp(player.y + player.h * 0.5 - canvas.height * 0.5, 0, maxCamY);
  const cameraLerp = Math.min(1, dt * 11);
  game.camera.x += (targetCamX - game.camera.x) * cameraLerp;
  game.camera.y += (targetCamY - game.camera.y) * cameraLerp;

  if (game.flashTimer > 0) {
    game.flashTimer = Math.max(0, game.flashTimer - dt);
  }
}

function drawBackdropProps(theme, now) {
  ctx.save();
  ctx.strokeStyle = withAlpha(theme.accent, 0.18);
  ctx.fillStyle = withAlpha(theme.accent, 0.1);
  ctx.lineWidth = 2;

  if (theme.prop === "chains") {
    for (let i = 0; i < 6; i += 1) {
      const x = 80 + i * 150 + Math.sin(now * 0.001 + i) * 6;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 140 + i * 8);
      ctx.stroke();
    }
  } else if (theme.prop === "pipes") {
    for (let i = 0; i < 4; i += 1) {
      const y = 70 + i * 48;
      ctx.fillRect(0, y, canvas.width, 8);
      for (let x = 40; x < canvas.width; x += 140) {
        ctx.fillRect(x, y - 6, 10, 20);
      }
    }
  } else if (theme.prop === "arches") {
    for (let i = 0; i < 5; i += 1) {
      const x = i * 210 + 30;
      ctx.beginPath();
      ctx.arc(x, 190, 70, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  } else if (theme.prop === "tanks") {
    for (let i = 0; i < 5; i += 1) {
      const x = 80 + i * 180;
      ctx.fillRect(x, 80, 90, 120);
      ctx.beginPath();
      ctx.arc(x + 45, 80, 45, Math.PI, 0);
      ctx.fill();
    }
  } else if (theme.prop === "towers") {
    for (let i = 0; i < 8; i += 1) {
      const x = i * 120;
      const h = 80 + (i % 3) * 38;
      ctx.fillRect(x, 200 - h, 58, h);
      ctx.fillStyle = withAlpha(theme.relic, 0.14);
      ctx.fillRect(x + 8, 200 - h + 12, 10, 4);
      ctx.fillStyle = withAlpha(theme.accent, 0.1);
    }
  } else if (theme.prop === "spires") {
    for (let i = 0; i < 9; i += 1) {
      const x = i * 110;
      const h = 70 + (i % 4) * 24;
      ctx.beginPath();
      ctx.moveTo(x + 24, 210 - h);
      ctx.lineTo(x + 44, 210);
      ctx.lineTo(x + 4, 210);
      ctx.closePath();
      ctx.fill();
    }
  } else if (theme.prop === "reactor") {
    for (let i = 0; i < 4; i += 1) {
      const x = 180 + i * 220;
      const r = 30 + i * 6;
      ctx.beginPath();
      ctx.arc(x, 160, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, 160, r + 14, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (theme.prop === "floating") {
    for (let i = 0; i < 6; i += 1) {
      const x = i * 170 + Math.sin(now * 0.001 + i * 0.8) * 8;
      const y = 110 + (i % 3) * 34;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 30, y - 18, x + 90, y - 18, x + 120, y);
      ctx.bezierCurveTo(x + 96, y + 24, x + 36, y + 24, x, y);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawThemeWorldProps(now) {
  const theme = getActiveTheme();
  ctx.save();
  ctx.fillStyle = withAlpha(theme.accent, 0.1);
  ctx.strokeStyle = withAlpha(theme.edge, 0.18);
  ctx.lineWidth = 2;

  if (theme.prop === "pipes" || theme.prop === "reactor") {
    for (let x = 120; x < game.level.world.w; x += 320) {
      const y = game.level.world.h - 260 - Math.sin(x * 0.01 + now * 0.001) * 10;
      ctx.fillRect(x, y, 16, 180);
      ctx.fillRect(x - 20, y + 26, 56, 10);
    }
  } else if (theme.prop === "arches") {
    for (let x = 140; x < game.level.world.w; x += 420) {
      const y = game.level.world.h - 180;
      ctx.beginPath();
      ctx.arc(x, y, 90, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    for (let x = 160; x < game.level.world.w; x += 360) {
      const y = game.level.world.h - 220;
      ctx.fillRect(x, y, 26, 140);
      ctx.fillRect(x - 10, y + 12, 46, 10);
    }
  }

  ctx.restore();
}
function drawBackground(now) {
  const theme = getActiveTheme();
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, theme.skyTop);
  g.addColorStop(0.55, theme.skyMid);
  g.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const starDrift = (game.camera.x * 0.08 + now * 0.01) % canvas.width;
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 60; i += 1) {
    const x = (i * 177 + starDrift) % canvas.width;
    const y = (i * 97) % (canvas.height * 0.7);
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;

  const baseY = canvas.height * 0.72;
  ctx.fillStyle = theme.layerA;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  for (let x = 0; x <= canvas.width; x += 24) {
    const wave = Math.sin((x + game.camera.x * 0.2) * 0.01) * 24;
    ctx.lineTo(x, baseY + wave);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = theme.layerB;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  for (let x = 0; x <= canvas.width; x += 18) {
    const wave = Math.sin((x + game.camera.x * 0.33) * 0.015 + 1.5) * 18;
    ctx.lineTo(x, baseY + 48 + wave);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fill();

  // Key light per theme.
  const moonX = canvas.width * 0.78;
  const moonY = canvas.height * 0.19;
  const moon = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 90);
  moon.addColorStop(0, withAlpha(theme.accent, 0.35));
  moon.addColorStop(1, "rgba(230, 246, 255, 0)");
  ctx.fillStyle = moon;
  ctx.fillRect(moonX - 100, moonY - 100, 200, 200);

  // Soft fog ribbons.
  for (let i = 0; i < 3; i += 1) {
    const y = canvas.height * (0.18 + i * 0.24) + Math.sin(now * 0.001 + i * 1.4) * 16;
    const fog = ctx.createLinearGradient(0, y, canvas.width, y + 40);
    fog.addColorStop(0, theme.fogA);
    fog.addColorStop(0.5, theme.fogB);
    fog.addColorStop(1, theme.fogA);
    ctx.fillStyle = fog;
    ctx.fillRect(0, y - 12, canvas.width, 42);
  }

  drawBackdropProps(theme, now);
}

function drawDust() {
  const theme = getActiveTheme();
  for (const d of game.dust) {
    const alpha = 0.08 + d.z * 0.15;
    ctx.fillStyle = withAlpha(theme.relic, alpha);
    ctx.fillRect(d.x, d.y, d.size, d.size);
  }
}

function drawWorldGrid() {
  const theme = getActiveTheme();
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;

  for (let x = 0; x <= game.level.world.w; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, game.level.world.h);
    ctx.stroke();
  }
  for (let y = 0; y <= game.level.world.h; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(game.level.world.w, y);
    ctx.stroke();
  }
}

function drawPlatformPattern(solid, theme, now) {
  if (theme.pattern === "stripes") {
    ctx.strokeStyle = withAlpha(theme.edge, 0.22);
    ctx.lineWidth = 1;
    for (let x = solid.x + 8; x < solid.x + solid.w - 6; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, solid.y + 3);
      ctx.lineTo(x + 8, solid.y + solid.h - 4);
      ctx.stroke();
    }
  } else if (theme.pattern === "plates") {
    ctx.strokeStyle = withAlpha(theme.edge, 0.24);
    ctx.lineWidth = 1;
    for (let y = solid.y + 5; y < solid.y + solid.h - 4; y += 6) {
      ctx.beginPath();
      ctx.moveTo(solid.x + 8, y);
      ctx.lineTo(solid.x + solid.w - 8, y);
      ctx.stroke();
    }
    ctx.fillStyle = withAlpha(theme.edge, 0.3);
    for (let x = solid.x + 12; x < solid.x + solid.w - 10; x += 28) {
      ctx.fillRect(x, solid.y + 4, 3, 3);
    }
  } else if (theme.pattern === "bolts") {
    ctx.fillStyle = withAlpha(theme.edge, 0.34);
    for (let x = solid.x + 8; x <= solid.x + solid.w - 8; x += 24) {
      ctx.fillRect(x, solid.y + 4, 3, 3);
    }
  } else if (theme.pattern === "panels") {
    ctx.strokeStyle = withAlpha(theme.edge, 0.24);
    ctx.lineWidth = 1;
    const panelW = 42;
    for (let x = solid.x + 8; x < solid.x + solid.w - 10; x += panelW) {
      const w = Math.min(panelW - 6, solid.x + solid.w - 8 - x);
      if (w > 8) {
        ctx.strokeRect(x, solid.y + 4, w, Math.max(6, solid.h - 8));
      }
    }
  } else if (theme.pattern === "cracks") {
    ctx.strokeStyle = withAlpha(theme.edge, 0.18);
    ctx.lineWidth = 1;
    const splits = Math.max(1, Math.floor(solid.w / 70));
    for (let i = 0; i < splits; i += 1) {
      const x = solid.x + 10 + i * (solid.w - 20) / splits;
      const wav = Math.sin(now * 0.001 + i) * 4;
      ctx.beginPath();
      ctx.moveTo(x, solid.y + 3);
      ctx.lineTo(x + wav, solid.y + solid.h - 3);
      ctx.stroke();
    }
  } else if (theme.pattern === "vents") {
    ctx.fillStyle = withAlpha(theme.edge, 0.26);
    for (let y = solid.y + 4; y < solid.y + solid.h - 3; y += 4) {
      ctx.fillRect(solid.x + 8, y, solid.w - 16, 1);
    }
    ctx.fillStyle = withAlpha(theme.accent, 0.16);
    ctx.fillRect(solid.x + 10, solid.y + solid.h * 0.5 - 1, solid.w - 20, 2);
  } else if (theme.pattern === "neon") {
    ctx.strokeStyle = withAlpha(theme.accent, 0.38);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(solid.x + 8, solid.y + solid.h * 0.5);
    ctx.lineTo(solid.x + solid.w - 8, solid.y + solid.h * 0.5);
    ctx.stroke();
    ctx.fillStyle = withAlpha(theme.accent, 0.28);
    for (let x = solid.x + 12; x < solid.x + solid.w - 10; x += 36) {
      ctx.fillRect(x, solid.y + 4, 6, Math.max(2, solid.h - 8));
    }
  } else if (theme.pattern === "runes") {
    ctx.strokeStyle = withAlpha(theme.accent, 0.4);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(solid.x + 8, solid.y + solid.h * 0.5);
    for (let x = solid.x + 8; x <= solid.x + solid.w - 8; x += 12) {
      const y = solid.y + solid.h * 0.5 + Math.sin((x + now * 0.22) * 0.09) * 2.2;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let x = solid.x + 14; x < solid.x + solid.w - 6; x += 28) {
      ctx.beginPath();
      ctx.arc(x, solid.y + solid.h * 0.5, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawSolid25D(solid, theme, now) {
  let depth = clamp(6 + solid.h * 0.18, 6, 15);
  let slant = clamp(4 + solid.h * 0.09, 4, 10);
  if (theme.pattern === "bolts") {
    depth = clamp(depth + 2, 6, 17);
  } else if (theme.pattern === "stripes") {
    slant = clamp(slant + 1, 4, 12);
  } else if (theme.pattern === "cracks") {
    slant = clamp(slant + 2, 4, 12);
  } else if (theme.pattern === "vents") {
    depth = clamp(depth + 1, 6, 17);
  } else if (theme.pattern === "neon" || theme.pattern === "runes") {
    slant = clamp(slant + 1, 4, 12);
    depth = clamp(depth + 1, 6, 17);
  }

  // Drop shadow for pseudo depth.
  ctx.fillStyle = withAlpha(theme.side, 0.22);
  ctx.fillRect(solid.x + 4, solid.y + solid.h + depth + 2, solid.w + slant, depth * 0.7);

  ctx.imageSmoothingEnabled = false;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(solid.x + solid.w, solid.y);
  ctx.lineTo(solid.x + solid.w + slant, solid.y + depth);
  ctx.lineTo(solid.x + solid.w + slant, solid.y + solid.h + depth);
  ctx.lineTo(solid.x + solid.w, solid.y + solid.h);
  ctx.closePath();
  ctx.clip();
  for (let y = solid.y; y < solid.y + solid.h + depth; y += ART.frame) {
    for (let x = solid.x + solid.w - ART.frame; x < solid.x + solid.w + slant + ART.frame; x += ART.frame) {
      const col = Math.abs(Math.floor(x / ART.frame) + Math.floor(y / ART.frame)) % 8;
      ctx.drawImage(artSource(ART.tiles), col * ART.frame, 1 * ART.frame, ART.frame, ART.frame, x, y, ART.frame, ART.frame);
    }
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(solid.x, solid.y + solid.h);
  ctx.lineTo(solid.x + solid.w, solid.y + solid.h);
  ctx.lineTo(solid.x + solid.w + slant, solid.y + solid.h + depth);
  ctx.lineTo(solid.x + slant, solid.y + solid.h + depth);
  ctx.closePath();
  ctx.clip();
  for (let y = solid.y + solid.h - ART.frame; y < solid.y + solid.h + depth + ART.frame; y += ART.frame) {
    for (let x = solid.x; x < solid.x + solid.w + slant; x += ART.frame) {
      const col = Math.abs(Math.floor(x / ART.frame) + Math.floor(y / ART.frame)) % 8;
      ctx.drawImage(artSource(ART.tiles), col * ART.frame, 1 * ART.frame, ART.frame, ART.frame, x, y, ART.frame, ART.frame);
    }
  }
  ctx.restore();

  for (let y = solid.y; y < solid.y + solid.h; y += ART.frame) {
    for (let x = solid.x; x < solid.x + solid.w; x += ART.frame) {
      const col = Math.abs(Math.floor(x / ART.frame) + Math.floor(y / ART.frame)) % 8;
      const row = solid.h <= 18 ? 2 : 0;
      const dw = Math.min(ART.frame, solid.x + solid.w - x);
      const dh = Math.min(ART.frame, solid.y + solid.h - y);
      ctx.drawImage(artSource(ART.tiles), col * ART.frame, row * ART.frame, dw, dh, x, y, dw, dh);
    }
  }

  ctx.fillStyle = withAlpha(theme.edge, 0.42);
  ctx.fillRect(solid.x, solid.y, solid.w, 2);
  if (theme.pattern === "vents") {
    ctx.fillStyle = withAlpha(theme.edge, 0.24);
    for (let x = solid.x + 10; x < solid.x + solid.w - 8; x += 20) {
      ctx.fillRect(x + slant, solid.y + solid.h + depth * 0.4, 2, depth * 0.45);
    }
  } else if (theme.pattern === "panels") {
    ctx.strokeStyle = withAlpha(theme.edge, 0.22);
    ctx.lineWidth = 1;
    for (let x = solid.x + 8; x < solid.x + solid.w - 12; x += 36) {
      const w = Math.min(28, solid.x + solid.w - 12 - x);
      if (w > 10) {
        ctx.strokeRect(x + slant * 0.4, solid.y + solid.h + depth * 0.26, w, depth * 0.48);
      }
    }
  } else if (theme.pattern === "neon" || theme.pattern === "runes") {
    ctx.strokeStyle = withAlpha(theme.accent, 0.34);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(solid.x + 5, solid.y + 3, Math.max(8, solid.w - 10), Math.max(6, solid.h - 6));
  }

  drawPlatformPattern(solid, theme, now);
}

function isRectVisible(x, y, w, h) {
  return x + w > game.camera.x && x < game.camera.x + canvas.width &&
         y + h > game.camera.y && y < game.camera.y + canvas.height;
}

function drawSolids(now) {
  const theme = getActiveTheme();
  for (const solid of game.level.solids) {
    if (isRectVisible(solid.x, solid.y, solid.w, solid.h)) {
      drawSolid25D(solid, theme, now);
    }
  }
}

function drawStains() {
  for (const stain of game.stains) {
    if (isRectVisible(stain.x - stain.r, stain.y - stain.r, stain.r * 2, stain.r * 2)) {
      ctx.fillStyle = `rgba(190, 24, 36, ${stain.alpha})`;
      ctx.beginPath();
      ctx.ellipse(stain.x, stain.y, stain.r, stain.r * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCheckpoint(cp, active, now, idx) {
  const pulse = 0.6 + Math.sin(now * 0.008 + idx * 1.4) * 0.22;
  const poleX = cp.x + cp.w * 0.5 - 2;
  ctx.fillStyle = active ? "#f6d58b" : "#7f8799";
  ctx.fillRect(poleX, cp.y, 4, cp.h);

  const flagW = 16;
  const flagH = 10;
  const wave = Math.sin(now * 0.018 + idx) * 2;
  ctx.beginPath();
  ctx.moveTo(poleX + 4, cp.y + 2);
  ctx.lineTo(poleX + 4 + flagW, cp.y + 2 + wave);
  ctx.lineTo(poleX + 4, cp.y + 2 + flagH);
  ctx.closePath();
  ctx.fillStyle = active ? `rgba(255, 214, 111, ${0.9 * pulse})` : "rgba(154, 170, 199, 0.78)";
  ctx.fill();

  if (active) {
    ctx.fillStyle = "rgba(255, 217, 119, 0.24)";
    ctx.fillRect(cp.x - 8, cp.y - 4, cp.w + 16, cp.h + 8);
  }
}

function drawCheckpoints(now) {
  for (let i = 0; i < game.level.checkpoints.length; i += 1) {
    const cp = game.level.checkpoints[i];
    if (isRectVisible(cp.x, cp.y, cp.w, cp.h)) {
      drawCheckpoint(cp, i === game.activeCheckpoint, now, i);
    }
  }
}

function drawBoostPads(now) {
  const theme = getActiveTheme();
  for (let i = 0; i < game.level.boostPads.length; i += 1) {
    const b = game.level.boostPads[i];
    if (!isRectVisible(b.x, b.y, b.w, b.h)) continue;
    const pulse = 0.5 + Math.sin(now * 0.01 + i) * 0.3;
    ctx.imageSmoothingEnabled = false;
    for (let x = b.x; x < b.x + b.w; x += ART.frame) {
      const col = Math.abs(Math.floor(x / ART.frame) + i) % 8;
      const dw = Math.min(ART.frame, b.x + b.w - x);
      ctx.drawImage(artSource(ART.tiles), col * ART.frame, 3 * ART.frame, dw, ART.frame, x, b.y - 10, dw, ART.frame);
    }

    ctx.fillStyle = withAlpha(theme.edge, 0.35 + pulse * 0.4);
    for (let j = 0; j < 3; j += 1) {
      const ox = b.x + 8 + j * (b.w - 16) / 2;
      const oy = b.y + b.h * 0.5;
      const dir = Math.sign(b.forceX || 1);
      ctx.beginPath();
      ctx.moveTo(ox - dir * 4, oy - 3);
      ctx.lineTo(ox + dir * 5, oy);
      ctx.lineTo(ox - dir * 4, oy + 3);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawRelics(now) {
  const theme = getActiveTheme();
  for (let i = 0; i < game.level.relics.length; i += 1) {
    const relic = game.level.relics[i];
    if (relic.taken) {
      continue;
    }
    if (!isRectVisible(relic.x, relic.y, relic.w, relic.h)) continue;
    const wobble = Math.sin(now * 0.008 + i * 0.9) * 4;
    const x = relic.x + relic.w * 0.5;
    const y = relic.y + relic.h * 0.5 + wobble;
    const r = relic.w * 0.45;

    ctx.fillStyle = withAlpha(theme.relic, 0.22);
    ctx.beginPath();
    ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = theme.relic;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.55, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r * 0.55, y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = withAlpha(theme.edge, 0.74);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawSpike(hazard) {
  const theme = getActiveTheme();
  const teeth = Math.max(1, Math.floor(hazard.w / 18));
  const seg = hazard.w / teeth;

  for (let i = 0; i < teeth; i += 1) {
    const x = hazard.x + i * seg;
    const y = hazard.y;

    ctx.beginPath();
    if (hazard.dir === "up") {
      ctx.moveTo(x, y + hazard.h);
      ctx.lineTo(x + seg * 0.5, y);
      ctx.lineTo(x + seg, y + hazard.h);
    } else if (hazard.dir === "down") {
      ctx.moveTo(x, y);
      ctx.lineTo(x + seg * 0.5, y + hazard.h);
      ctx.lineTo(x + seg, y);
    } else if (hazard.dir === "left") {
      ctx.moveTo(x + hazard.w, y);
      ctx.lineTo(x, y + seg * 0.5);
      ctx.lineTo(x + hazard.w, y + seg);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + hazard.w, y + seg * 0.5);
      ctx.lineTo(x, y + seg);
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(x, y, x, y + hazard.h);
    grad.addColorStop(0, withAlpha(theme.edge, 0.95));
    grad.addColorStop(1, withAlpha(theme.side, 0.9));
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

function drawSaw(hazard, levelSeconds) {
  const theme = getActiveTheme();
  const pos = getSawPosition(hazard, levelSeconds);
  const spikes = 12;
  const inner = hazard.r * 0.75;
  const outer = hazard.r * 1.24;
  const spin = levelSeconds * 4.8;

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(spin);

  ctx.fillStyle = withAlpha(theme.accent, 0.22);
  ctx.beginPath();
  ctx.arc(0, 0, hazard.r * 1.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = withAlpha(theme.edge, 0.9);
  ctx.beginPath();
  for (let i = 0; i < spikes; i += 1) {
    const a = (Math.PI * 2 * i) / spikes;
    const r = i % 2 === 0 ? outer : inner;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = withAlpha(theme.side, 0.95);
  ctx.beginPath();
  ctx.arc(0, 0, hazard.r * 0.44, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPulseField(hazard, levelSeconds, now) {
  const theme = getActiveTheme();
  const state = getPulseFieldState(hazard, levelSeconds);
  const borderAlpha = state.active ? 0.72 : 0.25;
  const fillAlpha = state.active ? 0.2 + state.intensity * 0.2 : 0.04;

  ctx.fillStyle = withAlpha(theme.accent, fillAlpha);
  ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);

  if (state.active) {
    ctx.fillStyle = withAlpha(theme.relic, 0.08 + state.intensity * 0.08);
    const lineOffset = (now * 0.12) % 10;
    for (let y = hazard.y + lineOffset; y < hazard.y + hazard.h; y += 10) {
      ctx.fillRect(hazard.x + 2, y, hazard.w - 4, 2);
    }
  }

  ctx.strokeStyle = withAlpha(theme.relic, borderAlpha);
  ctx.lineWidth = 2;
  ctx.strokeRect(hazard.x + 0.5, hazard.y + 0.5, hazard.w - 1, hazard.h - 1);
}

function drawRhythmGate(hazard, levelSeconds, now) {
  const theme = getActiveTheme();
  const gateState = getRhythmGateState(hazard, levelSeconds);
  const gateRect = getRhythmGateRect(hazard, gateState);
  const orient = hazard.orientation || "vertical";

  // Emitters stay visible to telegraph timing even when the gate is open.
  if (orient === "horizontal") {
    const midX = hazard.x + hazard.w * 0.5;
    ctx.fillStyle = withAlpha(theme.edge, 0.5);
    ctx.fillRect(midX - 14, hazard.y - 6, 28, 6);
    ctx.fillRect(midX - 14, hazard.y + hazard.h, 28, 6);
  } else {
    const midY = hazard.y + hazard.h * 0.5;
    ctx.fillStyle = withAlpha(theme.edge, 0.5);
    ctx.fillRect(hazard.x - 6, midY - 14, 6, 28);
    ctx.fillRect(hazard.x + hazard.w, midY - 14, 6, 28);
  }

  if (gateRect.w > 1 && gateRect.h > 1 && gateState.closedRatio > 0.03) {
    const beamAlpha = 0.18 + gateState.closedRatio * 0.45;
    ctx.fillStyle = withAlpha(theme.accent, beamAlpha);
    ctx.fillRect(gateRect.x, gateRect.y, gateRect.w, gateRect.h);

    ctx.strokeStyle = withAlpha(theme.relic, 0.3 + gateState.closedRatio * 0.5);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(gateRect.x + 0.5, gateRect.y + 0.5, gateRect.w - 1, gateRect.h - 1);

    if (orient === "horizontal") {
      const pulseX = gateRect.x + ((now * 0.22) % Math.max(20, gateRect.w));
      ctx.fillStyle = withAlpha(theme.relic, 0.34);
      ctx.fillRect(pulseX, gateRect.y + 2, 10, Math.max(2, gateRect.h - 4));
    } else {
      const pulseY = gateRect.y + ((now * 0.2) % Math.max(20, gateRect.h));
      ctx.fillStyle = withAlpha(theme.relic, 0.34);
      ctx.fillRect(gateRect.x + 2, pulseY, Math.max(2, gateRect.w - 4), 10);
    }
  } else {
    ctx.strokeStyle = withAlpha(theme.edge, 0.24);
    ctx.lineWidth = 1;
    if (orient === "horizontal") {
      const y = hazard.y + hazard.h * 0.5;
      ctx.beginPath();
      ctx.moveTo(hazard.x, y);
      ctx.lineTo(hazard.x + hazard.w, y);
      ctx.stroke();
    } else {
      const x = hazard.x + hazard.w * 0.5;
      ctx.beginPath();
      ctx.moveTo(x, hazard.y);
      ctx.lineTo(x, hazard.y + hazard.h);
      ctx.stroke();
    }
  }
}

function drawHazards(levelSeconds, now) {
  for (const hazard of game.level.hazards) {
    if (hazard.kind === "spike" || hazard.kind === "pulseField" || hazard.kind === "rhythmGate") {
      if (!isRectVisible(hazard.x, hazard.y, hazard.w, hazard.h)) continue;
    } else if (hazard.kind === "saw") {
      const pos = getSawPosition(hazard, levelSeconds);
      if (!isRectVisible(pos.x - hazard.r, pos.y - hazard.r, hazard.r * 2, hazard.r * 2)) continue;
    }

    if (hazard.kind === "spike") {
      drawSpike(hazard);
    } else if (hazard.kind === "saw") {
      drawSaw(hazard, levelSeconds);
    } else if (hazard.kind === "pulseField") {
      drawPulseField(hazard, levelSeconds, now);
    } else if (hazard.kind === "rhythmGate") {
      drawRhythmGate(hazard, levelSeconds, now);
    }
  }
}

function drawGoal(now) {
  const theme = getActiveTheme();
  const g = game.level.goal;
  const wave = Math.sin(now * 0.016) * 2;

  ctx.fillStyle = withAlpha(theme.edge, 0.95);
  ctx.fillRect(g.x - 6, g.y - 16, 6, g.h + 20);

  ctx.beginPath();
  ctx.moveTo(g.x, g.y + 3);
  ctx.lineTo(g.x + g.w + wave, g.y + 12);
  ctx.lineTo(g.x, g.y + 21);
  ctx.closePath();
  ctx.fillStyle = withAlpha(theme.accent, 0.95);
  ctx.fill();

  ctx.fillStyle = withAlpha(theme.relic, 0.9);
  ctx.fillRect(g.x + 7, g.y + g.h * 0.36, g.w - 14, g.h * 0.2);
}

function drawContactShadows() {
  const p = game.player;
  const shadowW = p.w * (p.onGround ? 0.92 : 0.72);
  const shadowH = p.h * 0.26;
  const y = p.y + p.h + 6;
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(p.x + p.w * 0.5, y, shadowW * 0.5, shadowH, 0, 0, Math.PI * 2);
  ctx.fill();
}

function getRunnerAnim(now) {
  const p = game.player;
  const wallSide = getWallContact(p);
  let anim = RUNNER_ANIMS.idle;
  let timeSeed = now / 1000;

  if (!p.onGround && wallSide !== 0 && ((wallSide === -1 && INPUT.left) || (wallSide === 1 && INPUT.right))) {
    anim = RUNNER_ANIMS.wall;
  } else if (!p.onGround && p.vy < 0) {
    anim = RUNNER_ANIMS.jump;
  } else if (!p.onGround) {
    anim = RUNNER_ANIMS.fall;
  } else if (Math.abs(p.vx) > 24) {
    anim = RUNNER_ANIMS.run;
    timeSeed = Math.abs(p.x) / 58;
  }

  const frame = Math.floor(timeSeed * anim.fps) % anim.frames;
  return { anim, frame };
}

function drawRunnerSprite(x, y, face, anim, frame, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x + PLAYER_CFG.w * 0.5, y + PLAYER_CFG.h);
  ctx.scale(face, 1);
  ctx.drawImage(
    artSource(ART.runner),
    frame * ART.frame,
    anim.row * ART.frame,
    ART.frame,
    ART.frame,
    -19,
    -35,
    38,
    38
  );
  ctx.restore();
}

function drawPlayer(now) {
  const state = getRunnerAnim(now);
  for (const trail of game.trail) {
    drawRunnerSprite(trail.x, trail.y, game.player.facing || 1, state.anim, state.frame, trail.alpha * 0.8);
  }

  const p = game.player;
  if (game.invulnTimer > 0 && Math.floor(now / 55) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }
  drawRunnerSprite(p.x, p.y, p.facing || 1, state.anim, state.frame, ctx.globalAlpha);
  ctx.globalAlpha = 1;
}

function drawParticles() {
  for (const p of game.particles) {
    const lifeRatio = clamp(p.life / p.maxLife, 0, 1);
    ctx.globalAlpha = lifeRatio;
    ctx.fillStyle = p.color || "#ff4b57";
    ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawGlowPass(now) {
  const p = game.player;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const glowR = 44 + Math.sin(now * 0.01) * 3;
  const playerGlow = ctx.createRadialGradient(
    p.x + p.w * 0.5,
    p.y + p.h * 0.5,
    6,
    p.x + p.w * 0.5,
    p.y + p.h * 0.5,
    glowR
  );
  playerGlow.addColorStop(0, "rgba(255, 88, 102, 0.28)");
  playerGlow.addColorStop(1, "rgba(255, 88, 102, 0)");
  ctx.fillStyle = playerGlow;
  ctx.fillRect(p.x - glowR, p.y - glowR, glowR * 2, glowR * 2);

  const g = game.level.goal;
  const goalGlow = ctx.createRadialGradient(
    g.x + g.w * 0.5,
    g.y + g.h * 0.5,
    10,
    g.x + g.w * 0.5,
    g.y + g.h * 0.5,
    70
  );
  goalGlow.addColorStop(0, "rgba(255, 202, 223, 0.2)");
  goalGlow.addColorStop(1, "rgba(255, 202, 223, 0)");
  ctx.fillStyle = goalGlow;
  ctx.fillRect(g.x - 70, g.y - 70, 140, 140);

  ctx.restore();
}

function drawScreenFx(now) {
  const theme = getActiveTheme();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#ffffff";
  const offset = (now * 0.08) % 4;
  for (let y = offset; y < canvas.height; y += 4) {
    ctx.fillRect(0, y, canvas.width, 1);
  }
  ctx.globalAlpha = 1;

  const noiseA = Math.floor((now * 0.37) % 255);
  const noiseB = Math.floor((now * 0.61) % 255);
  ctx.fillStyle = `rgba(${noiseA}, ${noiseB}, 255, 0.03)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = withAlpha(theme.accent, 0.06);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.06;
  ctx.fillStyle = "rgba(255, 255, 255, 1)";
  for (let i = 0; i < 4; i += 1) {
    const y = ((now * 0.05) + i * 133) % canvas.height;
    ctx.fillRect(0, y, canvas.width, 2);
  }
  ctx.globalAlpha = 1;

  const vignette = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.height * 0.2,
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.height * 0.68
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.36)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function render(now) {
  drawBackground(now);
  drawDust();

  const shakePower = game.shakeTimer > 0 ? Math.min(1, game.shakeTimer / 0.26) * 7 : 0;
  const shakeX = shakePower > 0 ? (Math.random() - 0.5) * shakePower : 0;
  const shakeY = shakePower > 0 ? (Math.random() - 0.5) * shakePower : 0;

  ctx.save();
  ctx.translate(-game.camera.x + shakeX, -game.camera.y + shakeY);

  drawWorldGrid();
  drawThemeWorldProps(now);
  drawStains();
  drawSolids(now);
  drawBoostPads(now);
  drawCheckpoints(now);
  drawHazards((now - game.levelStart) / 1000, now);
  drawRelics(now);
  drawGoal(now);
  drawContactShadows();
  drawPlayer(now);
  drawParticles();
  drawGlowPass(now);

  ctx.restore();

  if (game.flashTimer > 0) {
    ctx.fillStyle = `rgba(255, 82, 82, ${game.flashTimer * 2.2})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawScreenFx(now);
}

function formatTime(ms) {
  const totalSec = Math.max(0, ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = Math.floor(totalSec % 60);
  const cent = Math.floor((totalSec % 1) * 100);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(cent).padStart(2, "0")}`;
}

function formatDelta(ms) {
  const sign = ms >= 0 ? "+" : "-";
  return `${sign}${formatTime(Math.abs(ms))}`;
}

function setKey(code, down) {
  if (code === "ArrowLeft" || code === "KeyA") {
    KEY_INPUT.left = down;
  } else if (code === "ArrowRight" || code === "KeyD") {
    KEY_INPUT.right = down;
  } else if (code === "ArrowUp" || code === "Space" || code === "KeyW") {
    KEY_INPUT.jump = down;
  } else if (code === "KeyR") {
    KEY_INPUT.restart = down;
  }
}

function composeInput(now) {
  INPUT.left = KEY_INPUT.left || TOUCH_INPUT.left;
  INPUT.right = KEY_INPUT.right || TOUCH_INPUT.right;
  INPUT.restart = KEY_INPUT.restart || TOUCH_INPUT.restart;
  INPUT.jump = KEY_INPUT.jump || TOUCH_INPUT.jump || now < TOUCH_INPUT.jumpBufferedUntil;
}

function bindTouchHold(button, inputKey) {
  if (!button) {
    return;
  }
  const pointers = new Set();

  const press = (event) => {
    event.preventDefault();
    ensureAudioUnlocked();
    pointers.add(event.pointerId);
    if (inputKey === "jump") {
      TOUCH_INPUT.jumpBufferedUntil = 0;
    }
    TOUCH_INPUT[inputKey] = true;
    if (button.setPointerCapture) {
      button.setPointerCapture(event.pointerId);
    }
  };

  const release = (event) => {
    event.preventDefault();
    pointers.delete(event.pointerId);
    if (pointers.size === 0) {
      if (inputKey === "jump") {
        const bufferMs = game.assistMode ? 180 : 120;
        TOUCH_INPUT.jumpBufferedUntil = performance.now() + bufferMs;
      }
      TOUCH_INPUT[inputKey] = false;
    }
  };

  button.addEventListener("pointerdown", press, { passive: false });
  button.addEventListener("pointerup", release, { passive: false });
  button.addEventListener("pointercancel", release, { passive: false });
  button.addEventListener("pointerleave", release, { passive: false });
}

function setupTouchControls() {
  if (!touchControlsEl) {
    return;
  }
  bindTouchHold(touchControlsEl.querySelector("[data-touch='left']"), "left");
  bindTouchHold(touchControlsEl.querySelector("[data-touch='right']"), "right");
  bindTouchHold(touchControlsEl.querySelector("[data-touch='jump']"), "jump");
  bindTouchHold(touchControlsEl.querySelector("[data-touch='restart']"), "restart");
  touchControlsEl.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
}

window.addEventListener("keydown", (event) => {
  ensureAudioUnlocked();
  if (event.code === "KeyH" && !event.repeat) {
    toggleAssistMode();
    return;
  }
  setKey(event.code, true);
  if (
    event.code === "ArrowLeft" ||
    event.code === "ArrowRight" ||
    event.code === "ArrowUp" ||
    event.code === "Space"
  ) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  setKey(event.code, false);
});

window.addEventListener("pointerdown", () => {
  ensureAudioUnlocked();
});

let lastTime = performance.now();

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;

  composeInput(now);
  update(dt, now);
  render(now);

  INPUT.prevJump = INPUT.jump;
  INPUT.prevRestart = INPUT.restart;

  requestAnimationFrame(frame);
}

game.bestRunMs = loadBestRunMs();
game.bestSplits = loadBestSplits();
game.assistMode = loadAssistMode();
if (!game.assistMode) {
  game.assistMode = true;
  saveAssistMode(true);
}
initAudio();
setupTouchControls();
syncAssistUi();
if (assistToggleEl) {
  assistToggleEl.addEventListener("click", () => {
    toggleAssistMode();
  });
}
startRun();
requestAnimationFrame(frame);
