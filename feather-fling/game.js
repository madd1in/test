(() => {
  "use strict";

  const BASE_W = 1024;
  const BASE_H = 576;
  const GROUND_Y = 522;
  const SLING = { x: 176, y: 405 };
  const SLING_ART = { x: SLING.x - 2, y: SLING.y + 40, w: 112, h: 112 };
  const SLING_ANCHORS = {
    backLeft: { x: SLING.x - 31, y: SLING.y + 4 },
    backRight: { x: SLING.x + 29, y: SLING.y + 3 },
    frontLeft: { x: SLING.x - 26, y: SLING.y + 13 },
    frontRight: { x: SLING.x + 23, y: SLING.y + 12 }
  };
  const MAX_PULL = 112;
  const MIN_LAUNCH_PULL = 8;
  const LAUNCH_POWER = 0.205;
  const PHYSICS_STEP = 1000 / 60;
  const MAX_PHYSICS_STEPS = 4;
  const TRAJECTORY_STEPS = 128;
  const TRAJECTORY_SAMPLE_EVERY = 4;

  const FRAMES = {
    "relic-crimson": { x: 0, y: 0, w: 64, h: 64 },
    "relic-azure": { x: 64, y: 0, w: 64, h: 64 },
    "relic-gold": { x: 128, y: 0, w: 64, h: 64 },
    skull: { x: 192, y: 0, w: 64, h: 64 },
    "wood-block": { x: 256, y: 0, w: 64, h: 64 },
    "stone-block": { x: 320, y: 0, w: 64, h: 64 },
    "glass-block": { x: 384, y: 0, w: 64, h: 64 },
    ground: { x: 448, y: 0, w: 64, h: 64 },
    sling: { x: 0, y: 64, w: 64, h: 64 },
    puff: { x: 64, y: 64, w: 64, h: 64 },
    star: { x: 128, y: 64, w: 64, h: 64 },
    leaf: { x: 192, y: 64, w: 64, h: 64 },
    "wood-long": { x: 256, y: 64, w: 64, h: 64 },
    "stone-long": { x: 320, y: 64, w: 64, h: 64 },
    "glass-long": { x: 384, y: 64, w: 64, h: 64 },
    crate: { x: 448, y: 64, w: 64, h: 64 },
    "relic-violet": { x: 0, y: 128, w: 64, h: 64 },
    "relic-emerald": { x: 64, y: 128, w: 64, h: 64 }
  };

  const AI_SPRITE_GRID = { cols: 8, rows: 4 };
  const BIRD_GRID = { cols: 6, rows: 5 };
  const BIRD_ROWS = {
    "relic-crimson": 0,
    "relic-azure": 1,
    "relic-gold": 2,
    "relic-violet": 3,
    "relic-emerald": 4
  };
  const EXPANSION_ATLAS_BASE = { w: 1536, h: 1024 };
  const EXPANSION_BACKDROPS = [
    { x: 8, y: 8, w: 496, h: 336 },
    { x: 512, y: 8, w: 448, h: 336 },
    { x: 968, y: 8, w: 560, h: 336 }
  ];
  const EXPANSION_SPRITES = {
    gargoyle: { x: 680, y: 628, w: 204, h: 170 },
    wisp: { x: 884, y: 628, w: 108, h: 170 },
    raven: { x: 994, y: 628, w: 178, h: 170 },
    seraph: { x: 1182, y: 628, w: 146, h: 170 },
    ember: { x: 1404, y: 628, w: 122, h: 170 }
  };
  const TARGET_SCALE = {
    bat: 58,
    knight: 68,
    phantom: 62,
    skeleton: 62,
    gargoyle: 118,
    wisp: 64,
    raven: 66,
    seraph: 66,
    ember: 64
  };
  const MP3_BGM_TRACKS = [
    "assets/audio/moonlit-castle-ruins.mp3",
    "assets/audio/pixel-quest-parade.mp3"
  ];
  const AI_SPRITES = {
    "relic-crimson": { col: 0, row: 0 },
    "relic-violet": { col: 1, row: 0 },
    "relic-azure": { col: 2, row: 0 },
    "relic-emerald": { col: 3, row: 0 },
    "relic-gold": { col: 4, row: 0 },
    sling: { col: 6, row: 0 },
    skull: { col: 7, row: 0 },
    skeleton: { col: 0, row: 1 },
    bat: { col: 1, row: 1 },
    knight: { col: 2, row: 1 },
    phantom: { col: 3, row: 1 },
    puff: { col: 4, row: 1 },
    star: { col: 5, row: 1 },
    "wood-block": { col: 6, row: 1 },
    crate: { col: 6, row: 1 },
    "stone-block": { col: 7, row: 1 },
    "stone-long": { col: 0, row: 2 },
    "wood-long": { col: 3, row: 3 },
    "glass-block": { col: 6, row: 3 },
    "glass-long": { col: 6, row: 3 },
    ground: { col: 0, row: 3 },
    leaf: { col: 5, row: 3 }
  };

  const ART_SOURCES = {
    aiBackground: "assets/ai/ai-background-map.png",
    aiTiles: "assets/ai/ai-tile-map.png",
    aiSprites: "assets/ai/ai-sprite-map.png",
    aiBirds: "assets/ai/ai-bird-animation-map.png",
    aiExpansion: "assets/ai/ai-expansion-atlas.png",
    bgFar: "assets/gothic/bg_stage1_far.png",
    bgMid: "assets/gothic/bg_stage1_mid.png",
    floor: "assets/gothic/ig_floor_00.png",
    bat: "assets/gothic/enemy_bat.png",
    skeleton: "assets/gothic/enemy_skeleton.png",
    knight: "assets/gothic/enemy_knight.png",
    phantom: "assets/gothic/enemy_phantom.png",
    window: "assets/gothic/bg_window.png",
    column: "assets/gothic/bg_column.png"
  };

  const LEVELS = [
    {
      name: "Moon Gate Trial",
      shots: ["relic-crimson", "relic-azure", "relic-gold"],
      build() {
        block(800, 510, 260, 22, "stone-long");
        block(690, 472, 42, 58, "stone-block");
        block(748, 470, 34, 62, "wood-block", -0.006);
        block(852, 470, 34, 62, "wood-block", 0.006);
        block(910, 472, 42, 58, "stone-block");
        block(800, 431, 236, 24, "stone-long");
        block(736, 384, 30, 70, "glass-block", -0.006);
        block(864, 384, 30, 70, "glass-block", 0.006);
        block(800, 338, 170, 22, "wood-long");
        target(690, 397, "skeleton");
        target(864, 305, "bat");
      }
    },
    {
      name: "Glass Chapel",
      shots: ["relic-crimson", "relic-gold", "relic-azure"],
      build() {
        block(784, 510, 238, 22, "stone-long");
        block(704, 470, 34, 58, "glass-block");
        block(762, 466, 38, 66, "wood-block");
        block(822, 466, 38, 66, "wood-block");
        block(880, 470, 34, 58, "glass-block");
        block(792, 421, 214, 24, "stone-long");
        block(735, 376, 30, 66, "glass-block", -0.012);
        block(849, 376, 30, 66, "glass-block", 0.012);
        block(792, 332, 150, 22, "wood-long");
        target(735, 299, "bat");
        target(849, 299, "phantom");
      }
    },
    {
      name: "Clocktower Ruin",
      shots: ["relic-crimson", "relic-violet", "relic-gold", "relic-azure"],
      build() {
        block(810, 510, 264, 22, "stone-long");
        block(704, 472, 42, 58, "stone-block");
        block(764, 470, 38, 62, "wood-block");
        block(856, 470, 38, 62, "wood-block");
        block(916, 472, 42, 58, "stone-block");
        block(810, 431, 250, 24, "glass-long");
        block(742, 380, 32, 78, "wood-block", -0.025);
        block(878, 380, 32, 78, "wood-block", 0.025);
        block(810, 329, 188, 24, "stone-long");
        block(810, 306, 126, 22, "wood-long");
        target(810, 273, "knight");
        target(704, 397, "skeleton");
        target(916, 397, "phantom");
      }
    },
    {
      name: "Gargoyle Belfry",
      shots: ["relic-crimson", "relic-azure", "relic-violet", "relic-gold"],
      build() {
        block(812, 510, 300, 22, "stone-long");
        block(684, 470, 38, 62, "stone-block");
        block(754, 470, 34, 62, "wood-block", -0.012);
        block(870, 470, 34, 62, "wood-block", 0.012);
        block(940, 470, 38, 62, "stone-block");
        block(812, 428, 300, 24, "stone-long");
        block(748, 379, 32, 74, "glass-block", -0.01);
        block(876, 379, 32, 74, "glass-block", 0.01);
        block(812, 333, 196, 22, "wood-long");
        target(684, 394, "bat");
        target(812, 300, "gargoyle");
        target(940, 394, "wisp");
      }
    },
    {
      name: "Reliquary Bridge",
      shots: ["relic-gold", "relic-crimson", "relic-emerald", "relic-azure"],
      build() {
        block(812, 510, 330, 22, "stone-long");
        block(672, 472, 40, 58, "stone-block");
        block(742, 470, 34, 62, "wood-block", -0.015);
        block(812, 470, 34, 62, "glass-block");
        block(882, 470, 34, 62, "wood-block", 0.015);
        block(952, 472, 40, 58, "stone-block");
        block(812, 431, 326, 24, "glass-long");
        block(734, 382, 32, 74, "wood-block", -0.018);
        block(890, 382, 32, 74, "wood-block", 0.018);
        block(812, 334, 238, 22, "stone-long");
        block(812, 308, 164, 20, "glass-long");
        target(704, 397, "phantom");
        target(812, 275, "raven");
        target(920, 397, "knight");
      }
    },
    {
      name: "Nocturne Keep",
      shots: ["relic-crimson", "relic-violet", "relic-emerald", "relic-gold", "relic-azure"],
      build() {
        block(820, 510, 346, 22, "stone-long");
        block(676, 472, 40, 58, "stone-block");
        block(748, 470, 34, 62, "wood-block", -0.01);
        block(820, 470, 34, 62, "glass-block");
        block(892, 470, 34, 62, "wood-block", 0.01);
        block(964, 472, 40, 58, "stone-block");
        block(820, 431, 340, 24, "stone-long");
        block(720, 382, 32, 74, "glass-block", -0.014);
        block(820, 382, 32, 74, "wood-block");
        block(920, 382, 32, 74, "glass-block", 0.014);
        block(820, 334, 276, 22, "wood-long");
        block(776, 291, 30, 64, "stone-block", -0.012);
        block(864, 291, 30, 64, "stone-block", 0.012);
        block(820, 248, 188, 22, "glass-long");
        target(676, 397, "skeleton");
        target(720, 301, "wisp");
        target(920, 301, "phantom");
        target(820, 215, "gargoyle");
      }
    },
    {
      name: "Iron Mausoleum",
      shots: ["relic-azure", "relic-crimson", "relic-gold", "relic-violet"],
      build() {
        block(820, 510, 374, 22, "stone-long");
        block(654, 472, 40, 58, "stone-block");
        block(724, 470, 34, 62, "wood-block", -0.01);
        block(790, 470, 34, 62, "stone-block");
        block(856, 470, 34, 62, "stone-block");
        block(916, 470, 34, 62, "wood-block", 0.01);
        block(986, 472, 40, 58, "stone-block");
        block(820, 431, 368, 24, "stone-long");
        block(740, 382, 32, 74, "wood-block", -0.012);
        block(900, 382, 32, 74, "wood-block", 0.012);
        block(820, 334, 268, 22, "glass-long");
        block(820, 307, 186, 20, "stone-long");
        target(654, 397, "knight");
        target(820, 274, "gargoyle");
        target(986, 397, "skeleton");
        target(900, 301, "wisp");
      }
    },
    {
      name: "Storm Organ",
      shots: ["relic-crimson", "relic-emerald", "relic-azure", "relic-gold", "relic-violet"],
      build() {
        block(816, 510, 352, 22, "stone-long");
        block(666, 472, 40, 58, "stone-block");
        block(738, 470, 34, 62, "glass-block", -0.008);
        block(816, 470, 34, 62, "wood-block");
        block(894, 470, 34, 62, "glass-block", 0.008);
        block(966, 472, 40, 58, "stone-block");
        block(816, 431, 344, 24, "wood-long");
        block(704, 382, 32, 74, "stone-block", -0.01);
        block(816, 382, 32, 74, "glass-block");
        block(928, 382, 32, 74, "stone-block", 0.01);
        block(816, 334, 292, 22, "glass-long");
        block(760, 291, 30, 64, "wood-block", -0.01);
        block(872, 291, 30, 64, "wood-block", 0.01);
        block(816, 248, 208, 22, "stone-long");
        target(666, 397, "bat");
        target(816, 301, "phantom");
        target(966, 397, "raven");
        target(816, 215, "wisp");
      }
    },
    {
      name: "Mirror Crypt",
      shots: ["relic-gold", "relic-violet", "relic-crimson", "relic-emerald", "relic-azure"],
      build() {
        block(728, 510, 188, 22, "stone-long");
        block(912, 510, 188, 22, "stone-long");
        block(666, 470, 34, 62, "glass-block");
        block(728, 470, 34, 62, "wood-block", -0.01);
        block(790, 470, 34, 62, "glass-block");
        block(850, 470, 34, 62, "glass-block");
        block(912, 470, 34, 62, "wood-block", 0.01);
        block(974, 470, 34, 62, "glass-block");
        block(728, 431, 184, 24, "glass-long");
        block(912, 431, 184, 24, "glass-long");
        block(697, 382, 30, 74, "stone-block", -0.01);
        block(759, 382, 30, 74, "stone-block", 0.01);
        block(881, 382, 30, 74, "stone-block", -0.01);
        block(943, 382, 30, 74, "stone-block", 0.01);
        block(728, 334, 146, 22, "wood-long");
        block(912, 334, 146, 22, "wood-long");
        target(666, 397, "wisp");
        target(728, 301, "seraph");
        target(912, 301, "phantom");
        target(974, 397, "raven");
      }
    },
    {
      name: "Eclipse Throne",
      shots: ["relic-crimson", "relic-violet", "relic-gold", "relic-emerald", "relic-azure"],
      build() {
        block(820, 510, 390, 22, "stone-long");
        block(650, 472, 40, 58, "stone-block");
        block(720, 470, 34, 62, "wood-block", -0.012);
        block(784, 470, 34, 62, "glass-block");
        block(856, 470, 34, 62, "glass-block");
        block(920, 470, 34, 62, "wood-block", 0.012);
        block(990, 472, 40, 58, "stone-block");
        block(820, 431, 382, 24, "stone-long");
        block(704, 382, 32, 74, "wood-block", -0.012);
        block(788, 382, 32, 74, "stone-block");
        block(852, 382, 32, 74, "stone-block");
        block(936, 382, 32, 74, "wood-block", 0.012);
        block(820, 334, 312, 22, "wood-long");
        block(760, 291, 30, 64, "glass-block", -0.012);
        block(880, 291, 30, 64, "glass-block", 0.012);
        block(820, 248, 232, 22, "stone-long");
        block(820, 222, 156, 20, "glass-long");
        target(650, 397, "skeleton");
        target(704, 301, "wisp");
        target(936, 301, "raven");
        target(990, 397, "knight");
        target(820, 189, "gargoyle");
      }
    },
    {
      name: "Rose Arsenal",
      shots: ["relic-azure", "relic-crimson", "relic-violet", "relic-gold", "relic-emerald"],
      build() {
        block(820, 510, 388, 22, "stone-long");
        block(652, 472, 40, 58, "stone-block");
        block(724, 470, 34, 62, "wood-block", -0.01);
        block(788, 470, 34, 62, "glass-block");
        block(852, 470, 34, 62, "glass-block");
        block(916, 470, 34, 62, "wood-block", 0.01);
        block(988, 472, 40, 58, "stone-block");
        block(820, 431, 382, 24, "wood-long");
        block(696, 382, 32, 74, "stone-block", -0.01);
        block(772, 382, 32, 74, "glass-block");
        block(868, 382, 32, 74, "glass-block");
        block(944, 382, 32, 74, "stone-block", 0.01);
        block(820, 334, 320, 22, "glass-long");
        block(742, 291, 30, 64, "wood-block", -0.008);
        block(898, 291, 30, 64, "wood-block", 0.008);
        block(820, 248, 224, 22, "stone-long");
        target(652, 397, "raven");
        target(742, 215, "wisp");
        target(820, 301, "phantom");
        target(898, 215, "seraph");
        target(988, 397, "knight");
      }
    },
    {
      name: "Obsidian Bell",
      shots: ["relic-crimson", "relic-gold", "relic-azure", "relic-violet", "relic-emerald"],
      build() {
        block(820, 510, 406, 22, "stone-long");
        block(644, 472, 42, 58, "stone-block");
        block(714, 470, 34, 62, "wood-block", -0.01);
        block(774, 470, 34, 62, "stone-block");
        block(866, 470, 34, 62, "stone-block");
        block(926, 470, 34, 62, "wood-block", 0.01);
        block(996, 472, 42, 58, "stone-block");
        block(820, 431, 398, 24, "stone-long");
        block(704, 382, 32, 74, "glass-block", -0.012);
        block(820, 382, 32, 74, "wood-block");
        block(936, 382, 32, 74, "glass-block", 0.012);
        block(820, 334, 322, 22, "wood-long");
        block(748, 291, 30, 64, "stone-block", -0.01);
        block(892, 291, 30, 64, "stone-block", 0.01);
        block(820, 248, 236, 22, "glass-long");
        block(820, 222, 160, 20, "stone-long");
        target(644, 397, "skeleton");
        target(704, 301, "wisp");
        target(820, 189, "gargoyle");
        target(936, 301, "raven");
        target(996, 397, "phantom");
      }
    }
  ];

  const canvas = document.getElementById("gameCanvas");
  const gameShell = document.getElementById("gameShell");
  const ctx = canvas.getContext("2d");
  const levelText = document.getElementById("levelText");
  const shotText = document.getElementById("shotText");
  const scoreText = document.getElementById("scoreText");
  const toast = document.getElementById("toast");
  const bgm = document.getElementById("bgm");
  const musicButton = document.getElementById("musicButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const resetButton = document.getElementById("resetButton");
  const nextButton = document.getElementById("nextButton");
  const spriteImage = new Image();
  const artImages = {};
  const query = new URLSearchParams(window.location.search);

  let spriteReady = false;
  let engine;
  let world;
  let dpr = 1;
  let levelIndex = 0;
  let shotQueue = [];
  let score = 0;
  let currentShot = null;
  let currentShotSprite = "relic-crimson";
  let launched = false;
  let launchStarted = 0;
  let settleStarted = 0;
  let physicsAccumulator = 0;
  let physicsStepCount = 0;
  let drag = null;
  let particles = [];
  let messageTimer = 0;
  let lastTime = performance.now();
  let animationTime = lastTime;
  let levelWon = false;
  let musicEnabled = false;
  let pseudoFullscreen = false;
  let touchMode = false;

  const M = window.Matter;

  if (!M) {
    showToast("Matter.js fehlt. Bitte npm install ausfuehren.");
    return;
  }

  const {
    Engine,
    Events,
    Composite,
    Bodies,
    Body,
    Pairs,
    Sleeping,
    Vector
  } = M;

  spriteImage.onload = () => {
    spriteReady = true;
  };
  spriteImage.src = "assets/sprite-map.png";
  for (const [key, src] of Object.entries(ART_SOURCES)) {
    const img = new Image();
    if (key === "aiSprites") {
      img.addEventListener("load", () => {
        artImages.aiSpritesKeyed = createTransparentSpriteSheet(img);
      });
    }
    if (key === "aiExpansion") {
      img.addEventListener("load", () => {
        artImages.aiExpansionKeyed = createSoftTransparentSpriteSheet(img);
      });
    }
    img.src = src;
    artImages[key] = img;
  }

  bgm.volume = 0.55;
  bgm.addEventListener("play", updateAudioButton);
  bgm.addEventListener("pause", updateAudioButton);

  musicButton.addEventListener("click", () => {
    if (musicEnabled) {
      bgm.pause();
      musicEnabled = false;
    } else {
      musicEnabled = true;
      playMusic();
    }
    updateAudioButton();
  });

  fullscreenButton.addEventListener("click", toggleFullscreen);
  resetButton.addEventListener("click", () => resetLevel(false));
  nextButton.addEventListener("click", () => {
    levelIndex = (levelIndex + 1) % LEVELS.length;
    resetLevel(true);
  });

  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  canvas.addEventListener("lostpointercapture", pointerLostCapture);
  window.addEventListener("pointermove", pointerMove, { passive: false });
  window.addEventListener("pointerup", pointerUp, { passive: false });
  window.addEventListener("pointercancel", pointerUp, { passive: false });
  document.addEventListener("mouseup", finishDragFromDocument, true);
  document.addEventListener("touchend", finishDragFromDocument, true);
  document.addEventListener("touchcancel", finishDragFromDocument, true);
  window.addEventListener("blur", finishDragFromDocument);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) finishDragFromDocument();
  });
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  document.addEventListener("webkitfullscreenchange", updateFullscreenButton);

  detectTouchMode();
  resizeCanvas();
  levelIndex = initialLevelIndex();
  resetLevel(true);
  exposeDebugState();
  if (query.has("autolaunch")) {
    setTimeout(() => {
      if (currentShot && !launched) {
        Body.setPosition(currentShot, { x: SLING.x - 86, y: SLING.y + 44 });
        launchCurrentShot();
      }
    }, query.has("instant") ? 0 : 450);
  }
  requestAnimationFrame(loop);

  function detectTouchMode() {
    touchMode = Boolean(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    document.body.classList.toggle("touch-mode", touchMode);
  }

  function initialLevelIndex() {
    const requestedLevel = Number(query.get("level"));
    if (!Number.isFinite(requestedLevel)) return 0;
    return Math.max(0, Math.min(LEVELS.length - 1, Math.floor(requestedLevel) - 1));
  }

  function playMusic() {
    if (!musicEnabled) return;
    syncMusicForLevel(false);
    const playPromise = bgm.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        musicEnabled = false;
        updateAudioButton();
      });
    }
  }

  function syncMusicForLevel(keepPlaying = true) {
    const track = musicTrackForLevel();
    const current = bgm.getAttribute("src") || "";
    if (current === track) return;
    const shouldResume = keepPlaying && musicEnabled && !bgm.paused;
    bgm.setAttribute("src", track);
    bgm.load();
    if (shouldResume) playMusic();
  }

  function musicTrackForLevel() {
    return levelIndex >= 6 && levelIndex % 3 === 1
      ? MP3_BGM_TRACKS[1]
      : MP3_BGM_TRACKS[0];
  }

  function exposeDebugState() {
    window.__castleFlingDebug = {
      getShotState() {
        if (!currentShot) return null;
        return {
          x: currentShot.position.x,
          y: currentShot.position.y,
          vx: currentShot.velocity.x,
          vy: currentShot.velocity.y,
          isStatic: currentShot.isStatic,
          launched,
          dragging: Boolean(drag),
          sprite: currentShot.plugin ? currentShot.plugin.sprite : currentShotSprite,
          physicsStep: physicsStepCount,
          launchedStep: currentShot.plugin ? currentShot.plugin.launchedStep || 0 : 0,
          flightStep: currentShot.plugin && currentShot.plugin.launchedStep !== undefined
            ? physicsStepCount - currentShot.plugin.launchedStep
            : 0
        };
      },
      getAimPath(sampleEvery) {
        if (!currentShot || !drag) return [];
        const pull = Vector.sub(SLING, currentShot.position);
        return buildTrajectoryPoints(
          currentShot.position,
          launchVelocityFromPull(pull),
          currentShot.plugin && currentShot.plugin.radius,
          sampleEvery
        );
      },
      getTargets() {
        return Composite.allBodies(world)
          .filter((body) => body.plugin && body.plugin.kind === "target")
          .map((body) => ({
            x: body.position.x,
            y: body.position.y,
            minY: body.bounds.min.y,
            maxY: body.bounds.max.y,
            vx: body.velocity.x,
            vy: body.velocity.y,
            isSleeping: body.isSleeping,
            supported: hasSupportBelow(body),
            dropFrames: body.plugin.dropFrames || 0,
            dead: Boolean(body.plugin.dead),
            enemy: body.plugin.enemy
          }));
      },
      getBlocks() {
        return Composite.allBodies(world)
          .filter((body) => body.plugin && body.plugin.kind === "block")
          .map((body) => ({
            x: body.position.x,
            y: body.position.y,
            minX: body.bounds.min.x,
            maxX: body.bounds.max.x,
            minY: body.bounds.min.y,
            maxY: body.bounds.max.y,
            dead: Boolean(body.plugin.dead),
            sprite: body.plugin.sprite
          }));
      },
      removeSupportUnderFirstTarget() {
        const targetBody = Composite.allBodies(world).find((body) => body.plugin && body.plugin.kind === "target" && !body.plugin.dead);
        if (!targetBody) return null;
        const support = findSupportUnderTarget(targetBody);
        if (!support) return null;
        const before = {
          targetY: targetBody.position.y,
          supportX: support.position.x,
          supportY: support.position.y,
          sprite: support.plugin.sprite
        };
        removeBodyFromWorld(support);
        wakeDynamicBodies(support.position, 280);
        return before;
      },
      removeSupportsBelowFirstTarget() {
        const targetBody = Composite.allBodies(world).find((body) => body.plugin && body.plugin.kind === "target" && !body.plugin.dead);
        if (!targetBody) return null;
        const supports = Composite.allBodies(world).filter((body) => {
          const data = body.plugin;
          if (!data || data.kind !== "block" || data.dead) return false;
          const horizontallyAligned =
            body.bounds.min.x <= targetBody.position.x + 30 &&
            body.bounds.max.x >= targetBody.position.x - 30;
          return horizontallyAligned && body.bounds.min.y > targetBody.bounds.max.y - 8;
        });
        for (const support of supports) removeBodyFromWorld(support);
        wakeDynamicBodies(targetBody.position, 320);
        Body.setVelocity(targetBody, {
          x: targetBody.velocity.x,
          y: Math.max(targetBody.velocity.y, 2.2)
        });
        return { count: supports.length, targetY: targetBody.position.y };
      }
    };
  }

  function updateAudioButton() {
    musicButton.classList.toggle("active", musicEnabled && !bgm.paused);
    musicButton.setAttribute("aria-pressed", String(musicEnabled && !bgm.paused));
    musicButton.textContent = musicEnabled && !bgm.paused ? "♫" : "♪";
  }

  function toggleFullscreen() {
    const activeElement = document.fullscreenElement || document.webkitFullscreenElement;
    if (activeElement) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) exit.call(document);
      return;
    }

    const request = gameShell.requestFullscreen || gameShell.webkitRequestFullscreen;
    if (request) {
      const result = request.call(gameShell);
      if (result && typeof result.catch === "function") {
        result.catch(() => togglePseudoFullscreen());
      }
    } else {
      togglePseudoFullscreen();
    }
  }

  function togglePseudoFullscreen() {
    pseudoFullscreen = !pseudoFullscreen;
    gameShell.classList.toggle("pseudo-fullscreen", pseudoFullscreen);
    updateFullscreenButton();
    resizeCanvas();
  }

  function updateFullscreenButton() {
    const active = Boolean(document.fullscreenElement || document.webkitFullscreenElement || pseudoFullscreen);
    fullscreenButton.classList.toggle("active", active);
    fullscreenButton.setAttribute("aria-pressed", String(active));
  }

  function resizeCanvas() {
    detectTouchMode();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(BASE_W * dpr);
    canvas.height = Math.round(BASE_H * dpr);
  }

  function resetLevel(showIntro) {
    engine = Engine.create({ enableSleeping: false });
    world = engine.world;
    engine.gravity.y = 1.05;
    engine.timing.timeScale = 1;
    physicsAccumulator = 0;
    physicsStepCount = 0;
    lastTime = performance.now();
    Composite.clear(world, false, true);

    levelWon = false;
    launched = false;
    drag = null;
    particles = [];
    shotQueue = [...LEVELS[levelIndex].shots];
    syncMusicForLevel();

    addTerrain();
    LEVELS[levelIndex].build();
    spawnShot();
    attachCollisionHandler();
    updateHud();

    if (showIntro) {
      showToast("Ziehen, zielen, loslassen.");
    }
  }

  function addTerrain() {
    const options = {
      isStatic: true,
      friction: 1,
      restitution: 0.15,
      plugin: { kind: "terrain" }
    };
    Composite.add(world, [
      Bodies.rectangle(BASE_W / 2, GROUND_Y + 31, BASE_W + 220, 64, options),
      Bodies.rectangle(-40, BASE_H / 2, 80, BASE_H * 2, options),
      Bodies.rectangle(BASE_W + 40, BASE_H / 2, 80, BASE_H * 2, options),
      Bodies.rectangle(BASE_W / 2, -60, BASE_W, 80, options)
    ]);
  }

  function attachCollisionHandler() {
    Events.on(engine, "collisionStart", (event) => {
      for (const pair of event.pairs) {
        const rel = Vector.sub(pair.bodyA.velocity, pair.bodyB.velocity);
        const speed = Vector.magnitude(rel);
        if (speed < 1.3) continue;
        markShotImpact(pair.bodyA, speed);
        markShotImpact(pair.bodyB, speed);
        damage(pair.bodyA, pair.bodyB, speed);
        damage(pair.bodyB, pair.bodyA, speed);
      }
    });
  }

  function markShotImpact(body, speed) {
    if (!body.plugin || body.plugin.kind !== "shot" || speed < 2.1) return;
    body.plugin.impactUntil = performance.now() + 240;
  }

  function block(x, y, w, h, sprite, angle = 0) {
    const material = sprite.includes("stone")
      ? { density: 0.0088, health: 16, restitution: 0.025, friction: 0.92, frictionStatic: 1.08 }
      : sprite.includes("glass")
        ? { density: 0.0027, health: 5.4, restitution: 0.12, friction: 0.58, frictionStatic: 0.72 }
        : { density: 0.0049, health: 8.2, restitution: 0.045, friction: 0.82, frictionStatic: 0.98 };

    const body = Bodies.rectangle(x, y, w, h, {
      friction: material.friction,
      frictionStatic: material.frictionStatic,
      frictionAir: 0.006,
      restitution: material.restitution,
      density: material.density,
      sleepThreshold: 42,
      slop: 0.025,
      chamfer: { radius: Math.min(5, Math.max(2, Math.min(w, h) * 0.12)) },
      label: "block",
      plugin: {
        kind: "block",
        sprite,
        width: w,
        height: h,
        health: material.health,
        maxHealth: material.health,
        score: sprite.includes("glass") ? 95 : sprite.includes("stone") ? 120 : 85
      }
    });
    if (angle !== 0) Body.rotate(body, angle);
    Composite.add(world, body);
    return body;
  }

  function target(x, y, enemy = "skeleton") {
    const body = Bodies.circle(x, y, 22, {
      friction: 0.88,
      frictionStatic: 0.95,
      frictionAir: 0.004,
      restitution: 0.12,
      density: 0.0035,
      sleepThreshold: 34,
      label: "target",
      plugin: {
        kind: "target",
        sprite: "skull",
        enemy,
        radius: 22,
        health: 7,
        maxHealth: 7,
        score: 1000
      }
    });
    Composite.add(world, body);
    return body;
  }

  function spawnShot() {
    if (currentShot && Composite.get(world, currentShot.id, "body")) {
      Composite.remove(world, currentShot);
    }

    const sprite = shotQueue.shift();
    currentShotSprite = sprite || "relic-crimson";

    if (!sprite) {
      currentShot = null;
      if (targetsLeft() > 0) showToast("Keine Relikte mehr. Level neu starten?");
      updateHud();
      return;
    }

    const body = Bodies.circle(SLING.x, SLING.y, 20, {
      friction: 0.4,
      restitution: 0.34,
      density: 0.005,
      label: "shot",
      plugin: {
        kind: "shot",
        sprite,
        radius: 20
      }
    });
    Body.setStatic(body, true);
    currentShot = body;
    launched = false;
    launchStarted = 0;
    settleStarted = 0;
    Composite.add(world, body);
    updateHud();
  }

  function damage(body, other, speed) {
    const data = body.plugin;
    if (!data || data.dead || data.kind === "terrain" || data.kind === "shot") return;

    const otherKind = other.plugin ? other.plugin.kind : "";
    const shotBonus = otherKind === "shot" ? 1.85 : 1;
    const massBonus = Math.min(2.7, Math.max(0.8, other.mass * 0.13));
    const materialBonus = data.sprite && data.sprite.includes("glass") ? 1.25 : data.sprite && data.sprite.includes("stone") ? 0.82 : 1;
    const amount = Math.max(0, (speed - 0.95) * shotBonus * massBonus * materialBonus);

    data.health -= amount;
    if (data.kind === "target" && otherKind === "shot" && speed > 2.4) {
      data.health -= 2.8;
    }

    if (data.health <= 0) {
      data.dead = true;
      wakeDynamicBodies(body.position, 240);
    }
  }

  function pointerDown(event) {
    if (!currentShot || launched || levelWon) return;
    event.preventDefault();
    if (!musicEnabled) {
      musicEnabled = true;
      playMusic();
      updateAudioButton();
    }
    const point = pointerPoint(event);
    if (!point) return;
    const distance = Vector.magnitude(Vector.sub(point, currentShot.position));
    const mobileSwipeStart = touchMode && point.x < 360 && point.y > 180;
    if (distance > 46 && !mobileSwipeStart) return;
    if (canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (_) {
        // Window-level listeners still complete the release path if capture is unavailable.
      }
    }
    drag = {
      id: event.pointerId,
      pointerType: event.pointerType || "mouse",
      mobileSwipe: mobileSwipeStart,
      start: point,
      last: point,
      maxPull: 0,
      startedAt: performance.now()
    };
    Body.setStatic(currentShot, true);
    Body.setVelocity(currentShot, { x: 0, y: 0 });
    Body.setAngularVelocity(currentShot, 0);
    moveShotToPull(mobileSwipeStart ? SLING : point);
  }

  function pointerMove(event) {
    if (!drag || drag.id !== event.pointerId || !currentShot) return;
    event.preventDefault();
    if (event.buttons === 0 && event.pointerType !== "touch") {
      finishDrag(event);
      return;
    }
    const point = pointerPoint(event);
    if (!point) return;
    if (drag.mobileSwipe) {
      moveShotToPull({
        x: SLING.x + point.x - drag.start.x,
        y: SLING.y + point.y - drag.start.y
      });
      return;
    }
    moveShotToPull(point);
  }

  function pointerUp(event) {
    if (!drag || !currentShot) return;
    if (event.pointerId !== undefined && drag.id !== event.pointerId) return;
    event.preventDefault();
    finishDrag(event);
  }

  function pointerLostCapture(event) {
    if (!drag || !currentShot) return;
    if (event.pointerId !== undefined && drag.id !== event.pointerId) return;
    if (performance.now() - drag.startedAt < 40) return;
    finishDrag(event);
  }

  function finishDragFromDocument(event) {
    if (!drag || !currentShot) return;
    if (event && event.pointerId !== undefined && drag.id !== event.pointerId) return;
    finishDrag(event);
  }

  function finishDrag(event) {
    if (!drag || !currentShot) return;
    if (event && event.preventDefault) event.preventDefault();
    const pointerId = event && event.pointerId !== undefined ? event.pointerId : drag.id;
    releasePointer(pointerId);
    launchCurrentShot();
  }

  function launchCurrentShot() {
    const shot = currentShot;
    let pull = Vector.sub(SLING, shot.position);
    let distance = Vector.magnitude(pull);
    const rememberedPull = drag && drag.launchPull;
    if (distance < MIN_LAUNCH_PULL && rememberedPull && Vector.magnitude(rememberedPull) >= MIN_LAUNCH_PULL) {
      pull = rememberedPull;
      distance = Vector.magnitude(pull);
      Body.setPosition(shot, {
        x: SLING.x - pull.x,
        y: SLING.y - pull.y
      });
    }
    const hadIntent = drag && drag.maxPull >= MIN_LAUNCH_PULL;
    drag = null;

    if (distance < MIN_LAUNCH_PULL && !hadIntent) {
      Body.setPosition(shot, SLING);
      return;
    }

    Body.setStatic(shot, false);
    Sleeping.set(shot, false);
    Body.setPosition(shot, {
      x: shot.position.x,
      y: shot.position.y
    });
    Body.setVelocity(shot, launchVelocityFromPull(pull));
    Body.setAngularVelocity(shot, -pull.x * 0.008);
    launched = true;
    launchStarted = performance.now();
    settleStarted = 0;
    if (shot.plugin) {
      shot.plugin.launchedAt = launchStarted;
      shot.plugin.launchedStep = physicsStepCount;
    }
    puff(shot.position.x, shot.position.y, 10, "#f0d79a");
    updateHud();
  }

  function pointerPoint(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
      return null;
    }
    return {
      x: (event.clientX - rect.left) * BASE_W / rect.width,
      y: (event.clientY - rect.top) * BASE_H / rect.height
    };
  }

  function releasePointer(pointerId) {
    if (canvas.hasPointerCapture && canvas.hasPointerCapture(pointerId)) {
      try {
        canvas.releasePointerCapture(pointerId);
      } catch (_) {
        // Capture may already be gone on some mobile browsers.
      }
    }
  }

  function moveShotToPull(point) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    const delta = Vector.sub(point, SLING);
    const dist = Vector.magnitude(delta);
    const clamped = dist > MAX_PULL ? Vector.mult(Vector.normalise(delta), MAX_PULL) : delta;
    if (drag) {
      drag.last = point;
      drag.maxPull = Math.max(drag.maxPull, Vector.magnitude(clamped));
      drag.launchPull = {
        x: -clamped.x,
        y: -clamped.y
      };
    }
    Body.setPosition(currentShot, {
      x: SLING.x + clamped.x,
      y: SLING.y + clamped.y
    });
  }

  function loop(now) {
    const delta = Math.min(80, now - lastTime);
    lastTime = now;
    animationTime = now;

    if (!drag) {
      physicsAccumulator = Math.min(physicsAccumulator + delta, PHYSICS_STEP * MAX_PHYSICS_STEPS);
      while (physicsAccumulator >= PHYSICS_STEP) {
        Engine.update(engine, PHYSICS_STEP);
        physicsStepCount += 1;
        physicsAccumulator -= PHYSICS_STEP;
      }
    } else {
      physicsAccumulator = 0;
    }

    cleanupBodies();
    enforceTargetDrops();
    updateShotState(now);
    updateParticles(delta);
    draw();
    requestAnimationFrame(loop);
  }

  function cleanupBodies() {
    const bodies = Composite.allBodies(world);
    for (const body of bodies) {
      const data = body.plugin;
      if (!data || !data.dead) continue;
      const removedAt = { x: body.position.x, y: body.position.y };
      removeBodyFromWorld(body);
      wakeDynamicBodies(removedAt, 260);
      score += data.score || 0;
      puff(body.position.x, body.position.y, data.kind === "target" ? 20 : 12, data.kind === "target" ? "#ffd760" : "#ffffff");
      updateHud();
    }

    if (!levelWon && targetsLeft() === 0) {
      levelWon = true;
      score += Math.max(0, shotQueue.length + (currentShot && !launched ? 1 : 0)) * 500;
      updateHud();
      setTimeout(() => {
        showToast("Level geschafft. Weiter mit >.");
      }, 250);
    }
  }

  function updateShotState(now) {
    if (!currentShot || !launched || levelWon) return;

    const out =
      currentShot.position.x > BASE_W + 90 ||
      currentShot.position.y > BASE_H + 110 ||
      currentShot.position.x < -120;
    const speed = Vector.magnitude(currentShot.velocity);

    if (out || now - launchStarted > 9500) {
      spawnShot();
      return;
    }

    if (now - launchStarted > 1100 && speed < 0.18) {
      settleStarted = settleStarted || now;
      if (now - settleStarted > 900) spawnShot();
    } else {
      settleStarted = 0;
    }
  }

  function targetsLeft() {
    return Composite.allBodies(world).filter((body) => body.plugin && body.plugin.kind === "target" && !body.plugin.dead).length;
  }

  function findSupportUnderTarget(targetBody) {
    const targetBottom = targetBody.bounds.max.y;
    let best = null;
    let bestDistance = Infinity;

    for (const body of Composite.allBodies(world)) {
      const data = body.plugin;
      if (!data || data.kind !== "block" || data.dead) continue;
      const horizontallyAligned =
        body.bounds.min.x <= targetBody.position.x + 28 &&
        body.bounds.max.x >= targetBody.position.x - 28;
      if (!horizontallyAligned) continue;
      const distance = body.bounds.min.y - targetBottom;
      if (distance < -8 || distance > 150 || distance >= bestDistance) continue;
      best = body;
      bestDistance = distance;
    }

    return best;
  }

  function removeBodyFromWorld(body) {
    Composite.remove(world, body);
    if (Pairs && typeof Pairs.clear === "function" && engine && engine.pairs) {
      Pairs.clear(engine.pairs);
    }
  }

  function wakeDynamicBodies(origin, radius) {
    if (!world) return;
    for (const body of Composite.allBodies(world)) {
      const data = body.plugin;
      if (!data || data.dead || body.isStatic || data.kind === "terrain" || data.kind === "shot") continue;
      const distance = origin ? Vector.magnitude(Vector.sub(body.position, origin)) : 0;
      if (origin && distance > radius) continue;
      Sleeping.set(body, false);
      if (data.kind === "target") {
        Body.setVelocity(body, {
          x: body.velocity.x,
          y: Math.max(body.velocity.y, 0.55)
        });
        Body.setAngularVelocity(body, body.angularVelocity + (!origin || body.position.x >= origin.x ? 0.012 : -0.012));
      }
    }
  }

  function enforceTargetDrops() {
    for (const body of Composite.allBodies(world)) {
      const data = body.plugin;
      if (!data || data.kind !== "target" || data.dead || body.position.y > GROUND_Y - 18) continue;
      if (hasSupportBelow(body)) {
        data.dropFrames = 0;
        continue;
      }
      data.dropFrames = (data.dropFrames || 0) + 1;
      Sleeping.set(body, false);
      Body.setVelocity(body, {
        x: body.velocity.x,
        y: Math.max(body.velocity.y + 0.42, 1.15)
      });
      Body.translate(body, {
        x: 0,
        y: Math.min(2.8, 0.45 + data.dropFrames * 0.08)
      });
    }
  }

  function hasSupportBelow(body) {
    const footY = body.bounds.max.y;
    for (const other of Composite.allBodies(world)) {
      if (other === body || !other.bounds) continue;
      const data = other.plugin;
      if (!data || data.dead || (data.kind !== "block" && data.kind !== "terrain")) continue;
      const horizontalOverlap =
        other.bounds.max.x > body.bounds.min.x + 5 &&
        other.bounds.min.x < body.bounds.max.x - 5;
      if (!horizontalOverlap) continue;
      const gap = other.bounds.min.y - footY;
      if (gap >= -3 && gap <= 12) return true;
    }
    return false;
  }

  function launchVelocityFromPull(pull) {
    return {
      x: pull.x * LAUNCH_POWER,
      y: pull.y * LAUNCH_POWER
    };
  }

  function buildTrajectoryPoints(start, velocity, radius, sampleEvery = TRAJECTORY_SAMPLE_EVERY) {
    const points = [];
    let x = start.x;
    let y = start.y;
    let vx = velocity.x;
    let vy = velocity.y;
    const frictionAir = currentShot && Number.isFinite(currentShot.frictionAir) ? currentShot.frictionAir : 0.01;
    const air = Math.max(0, 1 - frictionAir * (PHYSICS_STEP / (1000 / 60)));
    const gravityScale = engine && engine.gravity && Number.isFinite(engine.gravity.scale) ? engine.gravity.scale : 0.001;
    const gravityStep = (engine && engine.gravity ? engine.gravity.y : 1) * gravityScale * PHYSICS_STEP * PHYSICS_STEP;
    const groundLimit = GROUND_Y - (radius || 20);

    for (let step = 1; step <= TRAJECTORY_STEPS; step++) {
      vx *= air;
      vy = vy * air + gravityStep;
      x += vx;
      y += vy;
      if (step % sampleEvery === 0) {
        points.push({ x, y, pct: step / TRAJECTORY_STEPS, step });
      }
      if (y > groundLimit || x > BASE_W + 160 || x < -160) break;
    }

    return points;
  }

  function updateParticles(delta) {
    const step = delta / 16.67;
    particles = particles.filter((particle) => {
      particle.life -= delta;
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
      particle.vy += 0.06 * step;
      return particle.life > 0;
    });
  }

  function puff(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 6 + Math.random() * 11,
        life: 420 + Math.random() * 380,
        color
      });
    }
  }

  function updateHud() {
    levelText.textContent = `${levelIndex + 1}`;
    shotText.textContent = `${shotQueue.length + (currentShot ? 1 : 0)}`;
    scoreText.textContent = `${score}`;
  }

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => toast.classList.remove("show"), 1900);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, BASE_W, BASE_H);
    drawBackground();

    if (currentShot && !launched) {
      drawAim();
      drawElastic(true);
    }

    drawSlingFrame();

    const bodies = Composite.allBodies(world).filter((body) => body.plugin && body.plugin.kind !== "terrain");
    bodies.sort((a, b) => {
      const ak = a.plugin.kind === "shot" ? 2 : a.plugin.kind === "target" ? 1 : 0;
      const bk = b.plugin.kind === "shot" ? 2 : b.plugin.kind === "target" ? 1 : 0;
      return ak - bk;
    });

    for (const body of bodies) drawBody(body);

    if (currentShot && !launched) {
      drawElastic(false);
    }

    drawParticles();
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, BASE_H);
    sky.addColorStop(0, "#080713");
    sky.addColorStop(0.52, "#181427");
    sky.addColorStop(1, "#3b2630");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    const aiBackdrop = drawExpansionBackdrop() || drawAiBackgroundLayers();

    if (!aiBackdrop) {
      drawImageCover(artImages.bgFar, 0, 0, BASE_W, BASE_H, 0.38);

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const moon = ctx.createRadialGradient(778, 118, 8, 778, 118, 82);
      moon.addColorStop(0, "rgba(255, 233, 180, 0.62)");
      moon.addColorStop(0.42, "rgba(199, 133, 120, 0.18)");
      moon.addColorStop(1, "rgba(199, 133, 120, 0)");
      ctx.fillStyle = moon;
      ctx.beginPath();
      ctx.arc(778, 118, 82, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      const farMist = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      farMist.addColorStop(0, "rgba(222, 213, 238, 0.26)");
      farMist.addColorStop(0.48, "rgba(160, 137, 190, 0.13)");
      farMist.addColorStop(1, "rgba(45, 31, 57, 0)");
      ctx.fillStyle = farMist;
      ctx.fillRect(0, 0, BASE_W, GROUND_Y);
      ctx.restore();

      drawImageCover(artImages.bgMid, 0, 0, BASE_W, BASE_H, 0.62);
      drawGothicSilhouettes();
    }

    drawBackgroundDepthWash();
    drawAnimatedBackgroundAtmosphere();

    if (!drawAiGround()) {
      for (let x = -12; x < BASE_W + 96; x += 96) {
        drawArt(artImages.floor, x + 48, GROUND_Y + 34, 96, 96, 0, 1);
      }
    }
    drawForegroundSeparation();
  }

  function imageReady(image) {
    const w = image ? image.naturalWidth || image.width || 0 : 0;
    const h = image ? image.naturalHeight || image.height || 0 : 0;
    return Boolean(image && w > 0 && h > 0 && (image.complete !== false));
  }

  function drawImageCover(image, x, y, w, h, alpha = 1) {
    if (!imageReady(image)) return false;
    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (image.naturalWidth - sw) / 2;
    const sy = (image.naturalHeight - sh) / 2;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
    return true;
  }

  function drawBackgroundDepthWash() {
    ctx.save();
    const upperMist = ctx.createLinearGradient(0, 190, 0, GROUND_Y + 18);
    upperMist.addColorStop(0, "rgba(210, 202, 232, 0.02)");
    upperMist.addColorStop(0.46, "rgba(174, 159, 205, 0.075)");
    upperMist.addColorStop(0.82, "rgba(24, 18, 34, 0.22)");
    upperMist.addColorStop(1, "rgba(5, 4, 8, 0.42)");
    ctx.fillStyle = upperMist;
    ctx.fillRect(0, 190, BASE_W, GROUND_Y - 190 + 18);

    const footShadow = ctx.createLinearGradient(0, GROUND_Y - 42, 0, GROUND_Y + 16);
    footShadow.addColorStop(0, "rgba(1, 1, 3, 0)");
    footShadow.addColorStop(0.58, "rgba(1, 1, 4, 0.38)");
    footShadow.addColorStop(1, "rgba(0, 0, 0, 0.68)");
    ctx.fillStyle = footShadow;
    ctx.fillRect(0, GROUND_Y - 42, BASE_W, 58);
    ctx.restore();
  }

  function drawAiBackgroundLayers() {
    if (!imageReady(artImages.aiBackground)) return false;
    drawImageCoverFiltered(artImages.aiBackground, 0, 0, BASE_W, BASE_H, 0.29, "blur(1.4px) saturate(0.58) brightness(1.12)");

    ctx.save();
    const farWash = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    farWash.addColorStop(0, "rgba(238, 229, 255, 0.48)");
    farWash.addColorStop(0.34, "rgba(194, 174, 226, 0.34)");
    farWash.addColorStop(0.66, "rgba(118, 91, 141, 0.14)");
    farWash.addColorStop(1, "rgba(8, 5, 12, 0)");
    ctx.fillStyle = farWash;
    ctx.fillRect(0, 0, BASE_W, GROUND_Y);
    ctx.restore();

    drawImageCoverSlice(artImages.aiBackground, 218, 210, 0.2, "blur(0.8px) saturate(0.72) brightness(1.05)");
    drawImageCoverSlice(artImages.aiBackground, 354, 168, 0.38, "saturate(0.85) brightness(0.95)");

    ctx.save();
    const nearShade = ctx.createLinearGradient(0, 318, 0, GROUND_Y + 10);
    nearShade.addColorStop(0, "rgba(10, 7, 14, 0)");
    nearShade.addColorStop(0.54, "rgba(5, 4, 8, 0.18)");
    nearShade.addColorStop(1, "rgba(5, 4, 8, 0.44)");
    ctx.fillStyle = nearShade;
    ctx.fillRect(0, 300, BASE_W, GROUND_Y - 300 + 10);
    ctx.restore();

    return true;
  }

  function drawExpansionBackdrop() {
    if (!imageReady(artImages.aiExpansion)) return false;
    const panel = EXPANSION_BACKDROPS[levelIndex % EXPANSION_BACKDROPS.length];
    const t = animationTime * 0.001;
    const farDrift = Math.sin(t * 0.12 + levelIndex * 0.8) * 14;
    const nearDrift = Math.sin(t * 0.18 + levelIndex * 1.7) * 7;
    drawExpansionRegion(panel, -22 + farDrift, -8, BASE_W + 44, BASE_H + 18, 0.34, "blur(1.8px) saturate(0.6) brightness(1.2)");

    ctx.save();
    const farWash = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    farWash.addColorStop(0, "rgba(236, 229, 255, 0.52)");
    farWash.addColorStop(0.38, "rgba(185, 166, 216, 0.31)");
    farWash.addColorStop(0.7, "rgba(76, 52, 98, 0.12)");
    farWash.addColorStop(1, "rgba(5, 4, 9, 0)");
    ctx.fillStyle = farWash;
    ctx.fillRect(0, 0, BASE_W, GROUND_Y);
    ctx.restore();

    drawExpansionRegion(panel, -10 - nearDrift, 16, BASE_W + 20, BASE_H - 18, 0.3, "blur(0.35px) saturate(0.76) brightness(1)");

    ctx.save();
    const groundFade = ctx.createLinearGradient(0, 280, 0, GROUND_Y + 10);
    groundFade.addColorStop(0, "rgba(7, 5, 12, 0)");
    groundFade.addColorStop(0.55, "rgba(6, 4, 10, 0.22)");
    groundFade.addColorStop(1, "rgba(0, 0, 0, 0.62)");
    ctx.fillStyle = groundFade;
    ctx.fillRect(0, 260, BASE_W, GROUND_Y - 250);
    ctx.restore();

    return true;
  }

  function drawAnimatedBackgroundAtmosphere() {
    const t = animationTime * 0.001;
    drawAnimatedFog(t);
    drawAnimatedRain(t);
    drawAnimatedLightning(t);
    drawWindowFlicker(t);
  }

  function drawAnimatedFog(t) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 5; i++) {
      const y = 122 + i * 58 + Math.sin(t * 0.2 + i) * 10;
      const x = ((t * (8 + i * 3) + i * 210 + levelIndex * 31) % (BASE_W + 320)) - 180;
      const fog = ctx.createLinearGradient(x - 160, y, x + 380, y + 36);
      fog.addColorStop(0, "rgba(146, 128, 186, 0)");
      fog.addColorStop(0.45, `rgba(202, 188, 235, ${0.05 + i * 0.012})`);
      fog.addColorStop(1, "rgba(146, 128, 186, 0)");
      ctx.fillStyle = fog;
      ctx.beginPath();
      ctx.ellipse(x + 130, y, 270, 22 + i * 3, Math.sin(t * 0.08 + i) * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAnimatedRain(t) {
    const stormLevel = levelIndex % 3 === 2 || levelIndex >= 7;
    const alpha = stormLevel ? 0.16 : 0.07;
    ctx.save();
    ctx.strokeStyle = `rgba(206, 218, 255, ${alpha})`;
    ctx.lineWidth = stormLevel ? 1.25 : 0.8;
    ctx.beginPath();
    for (let i = 0; i < 46; i++) {
      const x = (i * 47 + t * (88 + levelIndex * 5)) % (BASE_W + 160) - 80;
      const y = (i * 83 + t * 185) % (GROUND_Y - 40);
      ctx.moveTo(x, y);
      ctx.lineTo(x - 18, y + 48);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawAnimatedLightning(t) {
    const stormLevel = levelIndex % 3 === 2 || levelIndex >= 7;
    if (!stormLevel) return;
    const pulse = Math.max(0, Math.sin(t * 0.72 + levelIndex * 1.9) - 0.94) * 4.4;
    if (pulse <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(218, 222, 255, ${Math.min(0.18, pulse * 0.08)})`;
    ctx.fillRect(0, 0, BASE_W, GROUND_Y);
    ctx.strokeStyle = `rgba(235, 231, 255, ${Math.min(0.72, pulse * 0.55)})`;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = "rgba(180, 150, 255, 0.7)";
    ctx.shadowBlur = 18;
    const startX = 640 + Math.sin(levelIndex) * 130;
    ctx.beginPath();
    ctx.moveTo(startX, 26);
    for (let y = 56; y < 280; y += 38) {
      const jag = Math.sin(t * 12 + y * 0.17 + levelIndex) * 32;
      ctx.lineTo(startX + jag, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawWindowFlicker(t) {
    const glow = 0.12 + Math.max(0, Math.sin(t * 2.4 + levelIndex)) * 0.14;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255, 169, 75, ${glow})`;
    const windows = [
      { x: 660, y: 118, w: 18, h: 46 },
      { x: 704, y: 146, w: 14, h: 36 },
      { x: 916, y: 130, w: 16, h: 42 },
      { x: 954, y: 168, w: 12, h: 30 }
    ];
    for (const windowLight of windows) {
      ctx.beginPath();
      ctx.ellipse(windowLight.x, windowLight.y, windowLight.w, windowLight.h, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawImageCoverFiltered(image, x, y, w, h, alpha = 1, filter = "none") {
    if (!imageReady(image)) return false;
    ctx.save();
    ctx.filter = filter;
    drawImageCover(image, x, y, w, h, alpha);
    ctx.restore();
    return true;
  }

  function drawImageCoverSlice(image, destY, destH, alpha = 1, filter = "none") {
    if (!imageReady(image)) return false;
    const imageW = image.naturalWidth || image.width;
    const imageH = image.naturalHeight || image.height;
    const scale = Math.max(BASE_W / imageW, BASE_H / imageH);
    const sw = BASE_W / scale;
    const sh = destH / scale;
    const sx = (imageW - sw) / 2;
    const sy = (imageH - BASE_H / scale) / 2 + destY / scale;
    ctx.save();
    ctx.filter = filter;
    ctx.globalAlpha *= alpha;
    ctx.drawImage(image, sx, sy, sw, sh, 0, destY, BASE_W, destH);
    ctx.restore();
    return true;
  }

  function drawExpansionRegion(region, x, y, w, h, alpha = 1, filter = "none", rotation = 0, imageOverride = null) {
    const image = imageOverride || artImages.aiExpansion;
    if (!imageReady(image)) return false;
    const imageW = image.naturalWidth || image.width;
    const imageH = image.naturalHeight || image.height;
    const sx = region.x / EXPANSION_ATLAS_BASE.w * imageW;
    const sy = region.y / EXPANSION_ATLAS_BASE.h * imageH;
    const sw = region.w / EXPANSION_ATLAS_BASE.w * imageW;
    const sh = region.h / EXPANSION_ATLAS_BASE.h * imageH;
    ctx.save();
    ctx.filter = filter;
    ctx.globalAlpha *= alpha;
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rotation || 0);
    ctx.drawImage(image, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }

  function drawArt(image, x, y, w, h, rotation = 0, alpha = 1) {
    if (!imageReady(image)) return false;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.drawImage(image, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }

  function drawAiGround() {
    if (!imageReady(artImages.aiTiles)) return false;
    const topCells = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 1 }
    ];
    const frontCells = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 }
    ];

    ctx.save();
    ctx.fillStyle = "rgba(1, 1, 4, 0.72)";
    ctx.fillRect(0, GROUND_Y - 14, BASE_W, 25);
    ctx.restore();

    for (let x = -22; x < BASE_W + 76; x += 64) {
      const cell = topCells[Math.abs(Math.floor((x + 22) / 64)) % topCells.length];
      drawAiCell(
        artImages.aiTiles,
        cell.col,
        cell.row,
        8,
        4,
        x + 32,
        GROUND_Y + 12,
        72,
        72,
        0,
        1,
        0.12,
        { color: "rgba(0, 0, 0, 0.86)", blur: 9, y: 5 }
      );
    }

    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.fillStyle = "rgba(3, 2, 6, 0.82)";
    ctx.fillRect(0, GROUND_Y + 22, BASE_W, BASE_H - GROUND_Y);
    ctx.strokeStyle = "rgba(255, 234, 183, 0.48)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 2);
    ctx.lineTo(BASE_W, GROUND_Y + 2);
    ctx.stroke();
    ctx.restore();

    for (let x = -36; x < BASE_W + 96; x += 96) {
      const cell = frontCells[Math.abs(Math.floor((x + 36) / 96)) % frontCells.length];
      drawAiCell(
        artImages.aiTiles,
        cell.col,
        cell.row,
        8,
        4,
        x + 48,
        GROUND_Y + 58,
        102,
        76,
        0,
        1,
        0.12,
        { color: "rgba(0, 0, 0, 0.9)", blur: 10, y: 7 }
      );
    }
    drawExpansionGroundAccents();
    return true;
  }

  function drawExpansionGroundAccents() {
    if (!imageReady(artImages.aiExpansion)) return false;
    const topCycle = levelIndex % 3;

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
    ctx.fillRect(0, GROUND_Y - 10, BASE_W, 16);
    ctx.restore();

    for (let x = -20; x < BASE_W + 70; x += 72) {
      const col = (Math.abs(Math.floor((x + 20) / 72)) + topCycle * 2) % 10;
      drawExpansionTileCell(
        col,
        topCycle === 1 ? 1 : 0,
        x + 36,
        GROUND_Y + 7,
        74,
        58,
        0.78,
        0,
        { color: "rgba(0, 0, 0, 0.9)", blur: 8, y: 5 }
      );
    }

    for (let x = -44; x < BASE_W + 112; x += 112) {
      const col = 10 + Math.abs(Math.floor((x + 44) / 112) + levelIndex) % 4;
      drawExpansionTileCell(
        col,
        2,
        x + 56,
        GROUND_Y + 61,
        116,
        76,
        0.42,
        0,
        { color: "rgba(0, 0, 0, 0.95)", blur: 10, y: 7 }
      );
    }

    if (levelIndex >= 3) {
      drawExpansionTileCell(13, 0, 70, GROUND_Y + 14, 120, 82, 0.52, 0);
      drawExpansionTileCell(14, 1, BASE_W - 70, GROUND_Y + 14, 120, 82, 0.52, 0);
    }

    return true;
  }

  function drawExpansionTileCell(col, row, x, y, w, h, alpha = 1, rotation = 0, shadow = null) {
    if (!imageReady(artImages.aiExpansion)) return false;
    const tileW = 94;
    const tileH = 88;
    const gap = 2;
    const region = {
      x: 10 + col * (tileW + gap),
      y: 356 + row * (tileH + gap),
      w: tileW,
      h: tileH
    };
    if (region.x + region.w > EXPANSION_ATLAS_BASE.w || region.y + region.h > EXPANSION_ATLAS_BASE.h) return false;
    ctx.save();
    if (shadow) {
      ctx.shadowColor = shadow.color || "rgba(0, 0, 0, 0.72)";
      ctx.shadowBlur = shadow.blur || 0;
      ctx.shadowOffsetX = shadow.x || 0;
      ctx.shadowOffsetY = shadow.y || 0;
    }
    drawExpansionRegion(region, x - w / 2, y - h / 2, w, h, alpha, "none", rotation);
    ctx.restore();
    return true;
  }

  function drawForegroundSeparation() {
    ctx.save();
    const upperRim = ctx.createLinearGradient(0, GROUND_Y - 18, 0, GROUND_Y + 16);
    upperRim.addColorStop(0, "rgba(0, 0, 0, 0)");
    upperRim.addColorStop(0.44, "rgba(0, 0, 0, 0.62)");
    upperRim.addColorStop(1, "rgba(0, 0, 0, 0.18)");
    ctx.fillStyle = upperRim;
    ctx.fillRect(0, GROUND_Y - 18, BASE_W, 34);

    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(0, 0, 0, 0.86)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.strokeStyle = "rgba(255, 237, 184, 0.78)";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 1.5);
    ctx.lineTo(BASE_W, GROUND_Y + 1.5);
    ctx.stroke();

    ctx.globalAlpha = 0.58;
    ctx.strokeStyle = "rgba(255, 237, 191, 0.46)";
    ctx.lineWidth = 1.2;
    for (let x = -36; x < BASE_W + 80; x += 92) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 4);
      ctx.lineTo(x + 18, GROUND_Y + 23);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.fillRect(0, GROUND_Y + 19, BASE_W, 42);
    ctx.strokeStyle = "rgba(5, 3, 8, 0.92)";
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 18);
    ctx.lineTo(BASE_W, GROUND_Y + 18);
    ctx.stroke();
    ctx.restore();
  }

  function drawAiCell(image, col, row, cols, rows, x, y, w, h, rotation = 0, alpha = 1, inset = 0.06, shadow = null) {
    if (!imageReady(image)) return false;
    const sourceW = image.naturalWidth || image.width;
    const sourceH = image.naturalHeight || image.height;
    const cellW = sourceW / cols;
    const cellH = sourceH / rows;
    const sx = col * cellW + cellW * inset;
    const sy = row * cellH + cellH * inset;
    const sw = cellW * (1 - inset * 2);
    const sh = cellH * (1 - inset * 2);

    ctx.save();
    ctx.globalAlpha *= alpha;
    if (shadow) {
      ctx.shadowColor = shadow.color || "rgba(0, 0, 0, 0.72)";
      ctx.shadowBlur = shadow.blur || 0;
      ctx.shadowOffsetX = shadow.x || 0;
      ctx.shadowOffsetY = shadow.y || 0;
    }
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.drawImage(image, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }

  function createTransparentSpriteSheet(image) {
    const sheet = document.createElement("canvas");
    sheet.width = image.naturalWidth;
    sheet.height = image.naturalHeight;
    const sheetCtx = sheet.getContext("2d", { willReadFrequently: true });
    sheetCtx.drawImage(image, 0, 0);
    const pixels = sheetCtx.getImageData(0, 0, sheet.width, sheet.height);
    const data = pixels.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const chroma = max - min;
      const veryDark = max < 30;
      const darkSheetBackdrop = max < 48 && b >= r && b >= g && chroma < 30;

      if (veryDark || darkSheetBackdrop) {
        data[i + 3] = 0;
      } else if (max < 58 && chroma < 34) {
        data[i + 3] = Math.min(data[i + 3], 120);
      }
    }

    sheetCtx.putImageData(pixels, 0, 0);
    return sheet;
  }

  function createSoftTransparentSpriteSheet(image) {
    const sheet = document.createElement("canvas");
    sheet.width = image.naturalWidth;
    sheet.height = image.naturalHeight;
    const sheetCtx = sheet.getContext("2d", { willReadFrequently: true });
    sheetCtx.drawImage(image, 0, 0);
    const pixels = sheetCtx.getImageData(0, 0, sheet.width, sheet.height);
    const data = pixels.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const chroma = max - min;

      if (max < 24 || (max < 52 && chroma < 24)) {
        data[i + 3] = 0;
      } else if (max < 68 && chroma < 26) {
        data[i + 3] = Math.min(data[i + 3], 96);
      }
    }

    sheetCtx.putImageData(pixels, 0, 0);
    return sheet;
  }

  function drawGothicSilhouettes() {
    ctx.save();
    ctx.fillStyle = "rgba(7, 6, 12, 0.58)";
    for (const tower of [
      { x: 86, y: 276, w: 42, h: 220 },
      { x: 132, y: 318, w: 34, h: 178 },
      { x: 910, y: 292, w: 52, h: 208 },
      { x: 972, y: 330, w: 34, h: 170 }
    ]) {
      ctx.fillRect(tower.x, tower.y, tower.w, tower.h);
      ctx.beginPath();
      ctx.moveTo(tower.x - 8, tower.y);
      ctx.lineTo(tower.x + tower.w / 2, tower.y - 52);
      ctx.lineTo(tower.x + tower.w + 8, tower.y);
      ctx.closePath();
      ctx.fill();
    }
    for (let x = 42; x < 1000; x += 92) {
      drawArt(artImages.window, x, 358 + ((x / 92) % 2) * 18, 52, 52, 0, 0.45);
    }
    ctx.restore();
  }

  function hill(cx, cy, w, h) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, w / 2, h / 2, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(cx + w / 2, BASE_H);
    ctx.lineTo(cx - w / 2, BASE_H);
    ctx.closePath();
    ctx.fill();
  }

  function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.beginPath();
    ctx.arc(0, 10, 22, 0, Math.PI * 2);
    ctx.arc(28, 0, 30, 0, Math.PI * 2);
    ctx.arc(66, 12, 23, 0, Math.PI * 2);
    ctx.rect(-4, 11, 78, 24);
    ctx.fill();
    ctx.restore();
  }

  function drawElastic(behind) {
    if (!currentShot) return;
    const p = currentShot.position;
    const stretch = Math.min(1, Vector.magnitude(Vector.sub(p, SLING)) / MAX_PULL);
    const wobble = Math.sin(performance.now() / 70) * (1 + stretch * 1.6);
    const anchors = behind
      ? [SLING_ANCHORS.backLeft, SLING_ANCHORS.backRight]
      : [SLING_ANCHORS.frontLeft, SLING_ANCHORS.frontRight];
    const pouch = {
      x: p.x - 1,
      y: p.y + 7 + wobble * 0.35
    };
    const bandColor = behind ? "rgba(53, 31, 22, 0.9)" : "rgba(88, 52, 31, 0.98)";
    const highlight = behind ? "rgba(151, 91, 54, 0.58)" : "rgba(220, 144, 75, 0.74)";

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = behind ? 5 : 8;
    ctx.shadowOffsetY = 2;

    for (const anchor of anchors) {
      const control = {
        x: (anchor.x + pouch.x) / 2 + (anchor.x < pouch.x ? -5 : 5),
        y: (anchor.y + pouch.y) / 2 + 7 + stretch * 7 + wobble
      };
      ctx.lineWidth = behind ? 8 : 6;
      ctx.strokeStyle = bandColor;
      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y);
      ctx.quadraticCurveTo(control.x, control.y, pouch.x, pouch.y);
      ctx.stroke();

      ctx.lineWidth = behind ? 2.2 : 1.8;
      ctx.strokeStyle = highlight;
      ctx.beginPath();
      ctx.moveTo(anchor.x + 0.5, anchor.y - 1);
      ctx.quadraticCurveTo(control.x, control.y - 1.5, pouch.x, pouch.y - 1.2);
      ctx.stroke();
    }

    if (!behind) {
      ctx.shadowBlur = 4;
      ctx.fillStyle = "rgba(58, 32, 21, 0.96)";
      ctx.strokeStyle = "rgba(226, 159, 84, 0.68)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(pouch.x, pouch.y + 2, 15 + stretch * 3, 7, -0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAim() {
    if (!currentShot || !drag) return;
    const pull = Vector.sub(SLING, currentShot.position);
    if (Vector.magnitude(pull) < MIN_LAUNCH_PULL) return;
    const points = buildTrajectoryPoints(
      currentShot.position,
      launchVelocityFromPull(pull),
      currentShot.plugin && currentShot.plugin.radius
    );

    if (points.length < 2) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(255, 214, 112, 0.95)";
    ctx.shadowBlur = 10;
    ctx.setLineDash([9, 7]);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(23, 12, 5, 0.72)";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 218, 118, 0.98)";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < points.length; i += 2) {
      const point = points[i];
      const fade = 1 - point.pct * 0.72;
      const radius = Math.max(2.8, 6.2 - point.pct * 4);
      ctx.globalAlpha = fade;
      ctx.fillStyle = "rgba(20, 9, 4, 0.85)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = i % 4 === 0 ? "#fff2ba" : "#ffca59";
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSlingFrame() {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.78)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    drawSprite("sling", SLING_ART.x, SLING_ART.y, SLING_ART.w, SLING_ART.h, 0, { shadow: false });
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = "rgba(242, 185, 98, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SLING_ANCHORS.frontLeft.x - 2, SLING_ANCHORS.frontLeft.y + 2);
    ctx.lineTo(SLING_ANCHORS.backLeft.x + 3, SLING_ANCHORS.backLeft.y - 2);
    ctx.moveTo(SLING_ANCHORS.frontRight.x + 2, SLING_ANCHORS.frontRight.y + 2);
    ctx.lineTo(SLING_ANCHORS.backRight.x - 3, SLING_ANCHORS.backRight.y - 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawBody(body) {
    const data = body.plugin || {};
    const p = body.position;

    if (data.kind === "shot") {
      drawContactShadow(body, 30, 0.24);
      drawBirdShot(body, data.sprite || currentShotSprite);
      return;
    }

    if (data.kind === "target") {
      const scale = TARGET_SCALE[data.enemy] || 62;
      drawContactShadow(body, scale * 0.44, data.enemy === "bat" ? 0.14 : 0.32);
      drawExpansionEnemyBacklight(data.enemy, p.x, p.y, scale, body.angle);
      if (
        !drawSprite(data.enemy, p.x, p.y, scale, scale, body.angle, {
          fallback: false,
          shadow: { color: "rgba(0, 0, 0, 0.9)", blur: 12, y: 5 }
        }) &&
        !drawExpansionSprite(data.enemy, p.x, p.y, scale, scale, body.angle, 1) &&
        !drawArt(artImages[data.enemy], p.x, p.y, scale, scale, body.angle, 1)
      ) {
        drawSprite("skull", p.x, p.y, 56, 56, body.angle);
      }
      drawHealthRing(body, 31);
      return;
    }

    if (data.kind === "block") {
      const alpha = Math.max(0.35, Math.min(1, data.health / data.maxHealth));
      drawContactShadow(body, Math.max(data.width, data.height) * 0.42, 0.3);
      drawBlockDepth(body, data, alpha);
      drawSprite(data.sprite, p.x, p.y, data.width, data.height, body.angle, {
        alpha,
        shadow: { color: "rgba(0, 0, 0, 0.88)", blur: 10, y: 5 }
      });
      if (alpha < 0.7) drawCracks(p.x, p.y, data.width, data.height, body.angle);
    }
  }

  function drawBlockDepth(body, data, alpha) {
    const w = data.width || 44;
    const h = data.height || 44;
    const depth = Math.max(7, Math.min(18, Math.max(w, h) * 0.13));
    const material = blockDepthPalette(data.sprite || "");
    const skewX = depth * 0.46;
    const skewY = depth;

    ctx.save();
    ctx.globalAlpha = Math.max(0.34, alpha * 0.92);
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle || 0);

    ctx.fillStyle = material.side;
    ctx.beginPath();
    ctx.moveTo(w / 2, -h / 2);
    ctx.lineTo(w / 2 + skewX, -h / 2 + skewY);
    ctx.lineTo(w / 2 + skewX, h / 2 + skewY);
    ctx.lineTo(w / 2, h / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = material.bottom;
    ctx.beginPath();
    ctx.moveTo(-w / 2, h / 2);
    ctx.lineTo(w / 2, h / 2);
    ctx.lineTo(w / 2 + skewX, h / 2 + skewY);
    ctx.lineTo(-w / 2 + skewX, h / 2 + skewY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = material.rim;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 2, -h / 2 + 2);
    ctx.lineTo(w / 2 - 2, -h / 2 + 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0, 0, 0, 0.42)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(w / 2, -h / 2);
    ctx.lineTo(w / 2 + skewX, -h / 2 + skewY);
    ctx.moveTo(w / 2, h / 2);
    ctx.lineTo(w / 2 + skewX, h / 2 + skewY);
    ctx.stroke();
    ctx.restore();
  }

  function blockDepthPalette(sprite) {
    if (sprite.includes("glass")) {
      return {
        side: "rgba(24, 54, 82, 0.5)",
        bottom: "rgba(8, 20, 38, 0.66)",
        rim: "rgba(165, 224, 255, 0.5)"
      };
    }
    if (sprite.includes("wood") || sprite.includes("crate")) {
      return {
        side: "rgba(72, 39, 21, 0.72)",
        bottom: "rgba(28, 15, 9, 0.82)",
        rim: "rgba(223, 150, 76, 0.5)"
      };
    }
    return {
      side: "rgba(50, 48, 58, 0.78)",
      bottom: "rgba(16, 15, 21, 0.9)",
      rim: "rgba(211, 204, 190, 0.42)"
    };
  }

  function drawContactShadow(body, width, alpha) {
    if (!body || body.position.y > GROUND_Y + 32) return;
    const drop = Math.max(0, Math.min(1, 1 - Math.max(0, GROUND_Y - body.bounds.max.y) / 150));
    if (drop <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = alpha * drop;
    ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
    ctx.filter = "blur(1.5px)";
    ctx.beginPath();
    ctx.ellipse(body.position.x, Math.min(GROUND_Y + 7, body.bounds.max.y + 7), width, Math.max(5, width * 0.18), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBirdShot(body, spriteKey) {
    const row = BIRD_ROWS[spriteKey];
    const p = body.position;
    const speed = Vector.magnitude(body.velocity);
    const now = performance.now();
    const pulled = body === currentShot && !launched && drag;
    let frame = pulled ? 1 : 0;

    if (launched && body === currentShot) {
      if (body.plugin && body.plugin.impactUntil && now < body.plugin.impactUntil) {
        frame = 5;
      } else if (speed > 7.5) {
        frame = 4;
      } else {
        frame = 2 + (Math.floor(now / 95) % 2);
      }
    }

    const rotation = launched && speed > 0.8
      ? Math.max(-0.65, Math.min(0.55, Math.atan2(body.velocity.y, body.velocity.x) * 0.22))
      : body.angle * 0.25;

    if (
      row !== undefined &&
      drawAiCell(
        artImages.aiBirds,
        frame,
        row,
        BIRD_GRID.cols,
        BIRD_GRID.rows,
        p.x,
        p.y,
        76,
        66,
        rotation,
        1,
        0.035,
        { color: "rgba(0, 0, 0, 0.82)", blur: 9, y: 4 }
      )
    ) {
      return;
    }

    drawSprite(spriteKey, p.x, p.y, 54, 54, body.angle);
  }

  function drawExpansionSprite(key, x, y, w, h, rotation = 0, alpha = 1) {
    const region = EXPANSION_SPRITES[key];
    if (!region || !imageReady(artImages.aiExpansion)) return false;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.48, h * 0.5, rotation || 0, 0, Math.PI * 2);
    ctx.clip();
    drawExpansionRegion(
      region,
      x - w / 2,
      y - h / 2,
      w,
      h,
      alpha * 0.24,
      "brightness(1.28) contrast(1.12) saturate(1.08)",
      rotation,
      artImages.aiExpansion
    );
    ctx.restore();
    drawExpansionRegion(
      region,
      x - w / 2,
      y - h / 2,
      w,
      h,
      alpha,
      "drop-shadow(0 8px 9px rgba(0, 0, 0, 0.85))",
      rotation,
      artImages.aiExpansionKeyed || artImages.aiExpansion
    );
    return true;
  }

  function drawExpansionEnemyBacklight(key, x, y, scale, rotation = 0) {
    if (!EXPANSION_SPRITES[key]) return;
    const hot = key === "gargoyle" ? "rgba(255, 210, 142, 0.42)" : "rgba(183, 102, 255, 0.48)";
    const cool = key === "raven" ? "rgba(255, 68, 77, 0.34)" : "rgba(93, 178, 255, 0.26)";
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(0, 0, scale * 0.12, 0, 0, scale * 0.62);
    glow.addColorStop(0, hot);
    glow.addColorStop(0.55, cool);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 2, scale * 0.48, scale * 0.54, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(255, 235, 184, 0.42)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 3, scale * 0.38, scale * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawSprite(key, x, y, w, h, rotation, options = {}) {
    const safeKey = key || "";
    const alpha = options.alpha === undefined ? 1 : options.alpha;
    const aiCell = AI_SPRITES[safeKey];
    const aiSpriteSheet = artImages.aiSpritesKeyed || artImages.aiSprites;
    const shadow = options.shadow === false
      ? null
      : options.shadow || { color: "rgba(0, 0, 0, 0.78)", blur: 7, y: 3 };
    if (
      aiCell &&
      drawAiCell(
        aiSpriteSheet,
        aiCell.col,
        aiCell.row,
        AI_SPRITE_GRID.cols,
        AI_SPRITE_GRID.rows,
        x,
        y,
        w,
        h,
        rotation,
        alpha,
        0.055,
        shadow
      )
    ) {
      return true;
    }

    const frame = FRAMES[key];

    if (spriteReady && frame) {
      ctx.save();
      ctx.globalAlpha *= alpha;
      if (shadow) {
        ctx.shadowColor = shadow.color || "rgba(0, 0, 0, 0.72)";
        ctx.shadowBlur = shadow.blur || 0;
        ctx.shadowOffsetX = shadow.x || 0;
        ctx.shadowOffsetY = shadow.y || 0;
      }
      ctx.translate(x, y);
      ctx.rotate(rotation || 0);
      ctx.drawImage(spriteImage, frame.x, frame.y, frame.w, frame.h, -w / 2, -h / 2, w, h);
      ctx.restore();
      return true;
    }

    if (options.fallback === false) return false;

    ctx.save();
    ctx.globalAlpha *= alpha;
    if (shadow) {
      ctx.shadowColor = shadow.color || "rgba(0, 0, 0, 0.72)";
      ctx.shadowBlur = shadow.blur || 0;
      ctx.shadowOffsetX = shadow.x || 0;
      ctx.shadowOffsetY = shadow.y || 0;
    }
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.fillStyle = fallbackColor(safeKey);
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
    return false;
  }

  function fallbackColor(key) {
    if (key.includes("relic")) return "#d94b55";
    if (key.includes("stone")) return "#9ca9b4";
    if (key.includes("glass")) return "#8edce8";
    if (key.includes("wood") || key === "crate") return "#c78343";
    if (key === "skull") return "#dac9aa";
    return "#4d3948";
  }

  function drawCracks(x, y, w, h, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.strokeStyle = "rgba(38, 34, 30, 0.48)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.24, -h * 0.2);
    ctx.lineTo(-w * 0.06, -h * 0.02);
    ctx.lineTo(-w * 0.15, h * 0.2);
    ctx.moveTo(w * 0.12, -h * 0.22);
    ctx.lineTo(w * 0.02, h * 0.02);
    ctx.lineTo(w * 0.24, h * 0.18);
    ctx.stroke();
    ctx.restore();
  }

  function drawHealthRing(body, radius) {
    const data = body.plugin;
    if (!data || data.health >= data.maxHealth) return;
    const pct = Math.max(0, data.health / data.maxHealth);
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = pct > 0.5 ? "#72c855" : "#ff9d43";
    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of particles) {
      const alpha = Math.max(0, particle.life / 800);
      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha);
      if (spriteReady || imageReady(artImages.aiSprites)) {
        drawSprite(particle.color === "#ffd760" ? "star" : "puff", particle.x, particle.y, particle.size, particle.size, 0);
      } else {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
})();
