"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const stageWrap = canvas.parentElement;
const gameCard = stageWrap ? stageWrap.closest(".game-card") : null;

const levelEl = document.getElementById("level");
const scoreEl = document.getElementById("score");
const coinsEl = document.getElementById("coins");
const livesEl = document.getElementById("lives");
const timerEl = document.getElementById("timer");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const levelSelect = document.getElementById("levelSelect");
const startButton = document.getElementById("startButton");
const guiPause = document.getElementById("guiPause");
const guiRestart = document.getElementById("guiRestart");
const guiPrev = document.getElementById("guiPrev");
const guiNext = document.getElementById("guiNext");
const guiBg = document.getElementById("guiBg");
const guiFullscreen = document.getElementById("guiFullscreen");

const VIEW_W = canvas.width;
const VIEW_H = canvas.height;
const TILE = 32;
const GRAVITY = 2150;
const MOVE_ACCEL = 2300;
const AIR_ACCEL = 2200;
const AIR_TURN_ACCEL = 5600;
const AIR_TURN_BRAKE = 5200;
const AIR_TURN_GRIP = 7.5;
const FRICTION = 2200;
const MAX_SPEED = 330;
const JUMP_SPEED = 760;
const DOUBLE_JUMP_SPEED = 690;
const STOMP_BOUNCE = 540;
const SPRING_SPEED = 1010;
const DASH_SPEED = 560;
const DASH_TIME = 0.14;
const DASH_COOLDOWN = 0.72;
const STAR_TIME = 7;
const COYOTE_TIME = 0.09;
const JUMP_BUFFER = 0.12;
const AIR_JUMPS = 1;
const STARTING_LIVES = 5;
const SPRITE_FRAME = 32;
const SPRITE_SHEET = loadPixelAsset("assets/plumber_sprites.png");
const TILE_SHEET = loadPixelAsset("assets/plumber_tiles.png");
const BACKGROUND_MAP = loadPixelAsset("assets/plumber_background_map.png");
const BG_DISTANT_SILHOUETTES = loadPixelAsset("assets/bg_distant_silhouettes.png");
const BG_CLOUD_BANK = loadPixelAsset("assets/bg_cloud_bank.png");
const BG_MIST_BANDS = loadPixelAsset("assets/bg_mist_bands.png");

const LEVEL_TRACKS = [
  { title: "Marios Pilzpfad", src: "assets/music/level-1-marios-pilzpfad.mp3" },
  { title: "Pixel Quest Parade", src: "assets/music/level-2-pixel-quest-parade.mp3" },
  { title: "Mossy Warp Zone", src: "assets/music/level-3-mossy-warp-zone.mp3" },
  { title: "Sky Garden Relay", src: "assets/music/level-4-sky-garden-relay.mp3" },
  { title: "Marzipan Compass", src: "assets/music/level-5-marzipan-compass.mp3" },
  { title: "Moonlit Maple Trail", src: "assets/music/level-6-moonlit-maple-trail.mp3" },
  { title: "Skygarden March", src: "assets/music/level-7-skygarden-march.mp3" },
  { title: "Pixel Boss Rush", src: "assets/music/level-8-pixel-boss-rush.mp3" },
];

const PLAYER_ANIMS = {
  idle: { row: 0, frames: 16, fps: 8 },
  run: { row: 1, frames: 16, fps: 18 },
  jump: { row: 2, frames: 10, fps: 14 },
  fall: { row: 3, frames: 10, fps: 12 },
  dash: { row: 4, frames: 8, fps: 22 },
  hurt: { row: 5, frames: 8, fps: 14 },
};

const ENEMY_ANIM = { row: 6, frames: 12, fps: 10 };
const FLYER_ANIM = { row: 7, frames: 12, fps: 12 };
const COLLECTIBLE_ANIMS = {
  coin: { row: 8, col: 0, frames: 16, fps: 14 },
  crystal: { row: 9, col: 0, frames: 8, fps: 10 },
  heart: { row: 9, col: 8, frames: 8, fps: 9 },
  shield: { row: 9, col: 16, frames: 8, fps: 9 },
  star: { row: 9, col: 24, frames: 8, fps: 12 },
};
const TILE_ANIMS = {
  X: { row: 0, frames: 16, fps: 0 },
  B: { row: 1, frames: 16, fps: 0 },
  Q: { row: 2, frames: 16, fps: 8 },
  O: { row: 3, frames: 16, fps: 0 },
  U: { row: 4, frames: 16, fps: 0 },
  L: { row: 5, frames: 16, fps: 9 },
  S: { row: 6, frames: 16, fps: 12 },
};

const LEVEL_H = 15;

const LEVELS = [
  {
    name: "1-1 Meadow Dash",
    time: 300,
    palette: {
      top: "#70d0ff",
      mid: "#93e4ff",
      ground: "#b7ef8a",
      hillA: "#4fac50",
      hillB: "#3f9444",
      sun: "#fff078",
    },
    build: (g) => {
      g.ground([
        [0, 16],
        [19, 12],
        [35, 24],
        [63, 17],
        [84, 16],
        [104, 20],
        [129, 31],
      ]);
      g.fill(0, 12, 12, "X");
      g.fill(37, 12, 10, "X");
      g.fill(88, 12, 8, "X");
      g.fill(134, 12, 20, "X");
      g.put(6, 9, "P");
      g.put(14, 12, "S");
      g.put(18, 9, "H");
      g.put(22, 10, "QQQQ");
      g.put(31, 9, "BBBBB");
      g.put(45, 9, "C C C");
      g.put(47, 8, "C");
      g.put(60, 8, "J");
      g.put(62, 10, "T");
      g.fill(52, 10, 4, "X");
      g.put(64, 7, "A");
      g.put(67, 9, "G");
      g.put(73, 11, "LLL");
      g.fill(72, 12, 6, "X");
      g.put(90, 8, "C C C C");
      g.put(91, 10, "BBBB");
      g.put(98, 12, "S");
      g.put(102, 9, "R");
      g.put(105, 8, "M");
      g.put(109, 10, "QQQ");
      g.put(117, 9, "G");
      g.fill(118, 11, 4, "X");
      g.put(139, 8, "C C C");
      g.put(151, 12, "F");
    },
  },
  {
    name: "1-2 Sunset Pipes",
    time: 260,
    palette: {
      top: "#ff9f5c",
      mid: "#ffd08a",
      ground: "#92d877",
      hillA: "#b65b44",
      hillB: "#7f4b4b",
      sun: "#fff2a1",
    },
    build: (g) => {
      g.ground([
        [0, 14],
        [17, 11],
        [32, 11],
        [47, 15],
        [68, 12],
        [85, 12],
        [103, 16],
        [124, 20],
      ]);
      g.put(5, 9, "P");
      g.put(12, 12, "S");
      g.put(15, 9, "H");
      g.put(20, 9, "C C C");
      g.put(22, 10, "U");
      g.put(23, 10, "U");
      g.fill(33, 11, 5, "X");
      g.put(36, 8, "QQQ");
      g.put(42, 11, "G");
      g.put(56, 8, "C C C C");
      g.put(57, 10, "BBBBB");
      g.put(69, 10, "LLL");
      g.fill(68, 12, 6, "X");
      g.put(79, 8, "C C C");
      g.fill(83, 10, 5, "X");
      g.put(88, 12, "S");
      g.put(90, 9, "G");
      g.put(93, 9, "T");
      g.put(96, 7, "QQQQ");
      g.put(102, 8, "J");
      g.put(107, 10, "C C C C");
      g.put(116, 8, "R");
      g.put(112, 9, "G");
      g.put(121, 8, "A");
      g.fill(118, 10, 4, "X");
      g.put(132, 12, "F");
    },
  },
  {
    name: "1-3 Lava Bell",
    time: 240,
    palette: {
      top: "#273064",
      mid: "#6f4fa7",
      ground: "#f09c5b",
      hillA: "#493b70",
      hillB: "#2d2d50",
      sun: "#ffd35f",
    },
    build: (g) => {
      g.ground([
        [0, 12],
        [16, 9],
        [31, 10],
        [48, 9],
        [64, 8],
        [78, 10],
        [95, 9],
        [111, 11],
        [128, 24],
      ]);
      g.put(5, 9, "P");
      g.put(10, 12, "S");
      g.put(13, 9, "H");
      g.put(18, 9, "QQQ");
      g.put(24, 11, "G");
      g.fill(33, 10, 4, "X");
      g.put(34, 8, "C C");
      g.put(39, 8, "J");
      g.put(42, 9, "T");
      g.put(46, 11, "LLL");
      g.fill(45, 12, 7, "X");
      g.put(57, 8, "BBBB");
      g.put(58, 7, "C C C");
      g.put(66, 10, "G");
      g.put(75, 9, "QQQQ");
      g.put(77, 8, "J");
      g.put(80, 8, "R");
      g.put(81, 7, "A");
      g.put(84, 11, "LLL");
      g.fill(83, 12, 7, "X");
      g.put(98, 8, "C C C C");
      g.fill(99, 10, 5, "X");
      g.put(112, 10, "G");
      g.put(121, 8, "BBBBBB");
      g.put(133, 8, "C C C");
      g.put(143, 12, "F");
    },
  },
  {
    name: "2-1 Sky Springworks",
    time: 230,
    palette: {
      top: "#66e1ff",
      mid: "#b9f2ff",
      ground: "#d7f59c",
      hillA: "#73c978",
      hillB: "#4da6a1",
      sun: "#fff7b7",
    },
    build: (g) => {
      g.ground([
        [0, 10],
        [18, 8],
        [37, 8],
        [57, 7],
        [78, 8],
        [101, 9],
        [123, 37],
      ]);
      g.put(5, 9, "P");
      g.put(12, 12, "S");
      g.fill(19, 10, 4, "X");
      g.put(21, 8, "J");
      g.put(25, 9, "H");
      g.put(28, 7, "C C C");
      g.fill(31, 9, 4, "X");
      g.put(39, 8, "S");
      g.put(47, 7, "C C J C");
      g.fill(52, 9, 5, "X");
      g.put(61, 7, "J");
      g.put(64, 9, "T");
      g.put(66, 8, "C C C C");
      g.fill(73, 10, 4, "X");
      g.put(82, 9, "G");
      g.put(91, 8, "S");
      g.put(97, 6, "J");
      g.put(100, 8, "R");
      g.fill(103, 9, 5, "X");
      g.put(106, 7, "QQQ");
      g.put(113, 7, "A");
      g.put(116, 8, "C C C");
      g.put(130, 9, "G");
      g.put(141, 7, "J C C C");
      g.put(151, 12, "F");
    },
  },
  {
    name: "2-2 Crystal Cavern",
    time: 250,
    palette: {
      top: "#15264c",
      mid: "#314681",
      ground: "#7fd6ff",
      hillA: "#39416f",
      hillB: "#232a4e",
      sun: "#c6efff",
    },
    build: (g) => {
      g.ground([
        [0, 15],
        [22, 13],
        [45, 10],
        [64, 11],
        [84, 12],
        [107, 11],
        [129, 31],
      ]);
      g.put(5, 9, "P");
      g.put(17, 10, "J");
      g.put(19, 9, "H");
      g.put(24, 9, "C C C");
      g.fill(29, 10, 5, "B");
      g.put(38, 9, "S");
      g.put(46, 8, "J");
      g.put(56, 9, "T");
      g.put(51, 10, "G");
      g.put(59, 11, "LLL");
      g.fill(58, 12, 7, "X");
      g.put(67, 9, "QQQ");
      g.put(76, 8, "C J C");
      g.fill(82, 10, 5, "X");
      g.put(88, 9, "G");
      g.put(99, 8, "S");
      g.put(105, 7, "C C C J");
      g.put(116, 8, "R");
      g.put(118, 7, "M");
      g.fill(110, 10, 5, "X");
      g.put(121, 11, "LLL");
      g.fill(120, 12, 7, "X");
      g.put(135, 8, "J");
      g.put(143, 9, "C C C");
      g.put(152, 12, "F");
    },
  },
  {
    name: "2-3 Moonlit Rush",
    time: 210,
    palette: {
      top: "#071326",
      mid: "#162a56",
      ground: "#70c1ff",
      hillA: "#23345f",
      hillB: "#121b37",
      sun: "#f4f0ff",
    },
    build: (g) => {
      g.ground([
        [0, 12],
        [17, 9],
        [31, 8],
        [46, 8],
        [60, 8],
        [76, 9],
        [94, 8],
        [111, 12],
        [132, 28],
      ]);
      g.put(5, 9, "P");
      g.put(14, 12, "S");
      g.put(16, 9, "H");
      g.put(20, 9, "G");
      g.put(28, 7, "J");
      g.put(32, 9, "C C C");
      g.fill(39, 8, 4, "X");
      g.put(48, 10, "QQQ");
      g.put(55, 9, "S");
      g.put(58, 8, "T");
      g.put(63, 8, "C J C");
      g.put(72, 10, "G");
      g.put(82, 7, "J");
      g.fill(88, 9, 4, "X");
      g.put(96, 10, "C C C");
      g.put(104, 9, "S");
      g.put(115, 8, "BBBBB");
      g.put(117, 7, "J");
      g.put(124, 8, "R");
      g.put(128, 7, "M");
      g.put(126, 11, "LLL");
      g.fill(125, 12, 6, "X");
      g.put(137, 9, "G");
      g.put(145, 8, "C C C J");
      g.put(153, 12, "F");
    },
  },
  {
    name: "3-1 Storm Cliffs",
    time: 240,
    palette: {
      top: "#14213f",
      mid: "#35527f",
      ground: "#9bd3ff",
      hillA: "#2f4777",
      hillB: "#182747",
      sun: "#e9f7ff",
    },
    build: (g) => {
      g.ground([
        [0, 13],
        [20, 9],
        [36, 8],
        [53, 9],
        [70, 9],
        [89, 10],
        [109, 8],
        [127, 33],
      ]);
      g.put(5, 9, "P");
      g.put(11, 9, "H");
      g.put(15, 12, "S");
      g.put(23, 8, "J");
      g.put(28, 7, "A");
      g.put(37, 9, "C C C");
      g.put(45, 8, "M");
      g.fill(52, 10, 4, "X");
      g.put(58, 9, "T");
      g.put(64, 8, "A");
      g.put(72, 9, "G");
      g.put(80, 11, "LLL");
      g.fill(79, 12, 7, "X");
      g.put(91, 8, "R");
      g.put(99, 7, "J C J");
      g.put(108, 9, "S");
      g.put(116, 8, "A");
      g.put(130, 9, "QQQ");
      g.put(140, 8, "C C M");
      g.put(152, 12, "F");
    },
  },
  {
    name: "3-2 Comet Finale",
    time: 260,
    palette: {
      top: "#050711",
      mid: "#17205d",
      ground: "#d7adff",
      hillA: "#2c1f63",
      hillB: "#101732",
      sun: "#fff0b8",
    },
    build: (g) => {
      g.ground([
        [0, 12],
        [18, 8],
        [33, 7],
        [47, 8],
        [63, 8],
        [80, 8],
        [98, 9],
        [118, 10],
        [138, 22],
      ]);
      g.put(5, 9, "P");
      g.put(12, 12, "S");
      g.put(15, 8, "H");
      g.put(21, 8, "A");
      g.put(30, 7, "J");
      g.put(36, 9, "C C C");
      g.put(43, 8, "M");
      g.put(50, 9, "G");
      g.put(58, 11, "LLL");
      g.fill(57, 12, 7, "X");
      g.put(66, 8, "T");
      g.put(73, 7, "A");
      g.put(82, 9, "S");
      g.put(89, 7, "J C J");
      g.put(99, 8, "R");
      g.put(109, 7, "A");
      g.put(120, 8, "QQQQ");
      g.put(130, 8, "M");
      g.put(142, 9, "G");
      g.put(148, 7, "C C C");
      g.put(154, 12, "F");
    },
  },
];

const keys = new Set();
const input = {
  left: false,
  right: false,
  jump: false,
  jumpPressed: false,
  dashPressed: false,
};

const touchActions = new Map();
const particles = [];
const clouds = [];
const coins = [];
const jumpCrystals = [];
const hearts = [];
const shields = [];
const stars = [];
const enemies = [];
const flyers = [];
let map = [];
let spawn = { x: 96, y: 200 };
let checkpoint = { x: 96, y: 200, active: false, tx: -1, ty: -1 };
let worldW = 0;
let worldH = 0;
let lastTime = 0;
let cameraX = 0;
let cameraY = 0;
let worldOffsetY = 0;
let rafId = 0;
let running = false;
let paused = false;
let backgroundMapEnabled = true;
let gameOver = false;
let levelComplete = false;
let gameComplete = false;
let levelIndex = 0;
let selectedLevelIndex = 0;
let worldClock = 0;

const player = {
  x: 0,
  y: 0,
  w: 24,
  h: 30,
  vx: 0,
  vy: 0,
  face: 1,
  onGround: false,
  coyote: 0,
  jumpBuffer: 0,
  airJumpsLeft: AIR_JUMPS,
  dashCooldown: 0,
  dashTimer: 0,
  dashDir: 1,
  deadTimer: 0,
  invulnerable: 0,
  starTimer: 0,
  runT: 0,
  coins: 0,
  score: 0,
  lives: 3,
  shield: false,
  time: 300,
};

const solidTiles = new Set(["X", "B", "Q", "O", "U"]);

const audio = {
  ctx: null,
  master: null,
  musicGain: null,
  sfxGain: null,
  musicEl: null,
  enabled: false,
  nextNoteTime: 0,
  step: 0,
  trackIndex: -1,
  failedTrackIndex: -1,

  init() {
    if (this.ctx) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.master.gain.value = 0.72;
    this.musicGain.gain.value = 0.18;
    this.sfxGain.gain.value = 0.55;
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(this.ctx.destination);
  },

  initLevelMusic() {
    if (this.musicEl || typeof Audio !== "function") return;

    this.musicEl = new Audio();
    this.musicEl.loop = true;
    this.musicEl.preload = "auto";
    this.musicEl.volume = 0.42;
    this.musicEl.addEventListener("error", () => {
      this.failedTrackIndex = levelIndex;
      console.warn("Level MP3 konnte nicht geladen werden. Synth-Fallback aktiv.");
    });
  },

  start() {
    this.init();
    this.initLevelMusic();

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    this.enabled = true;
    this.nextNoteTime = this.ctx ? this.ctx.currentTime + 0.02 : 0;
    this.step = levelIndex * 16;
    this.playLevelTrack(true);
  },

  pauseLevelTrack() {
    if (this.musicEl && !this.musicEl.paused) {
      this.musicEl.pause();
    }
  },

  playLevelTrack(force = false) {
    if (!this.enabled || !this.musicEl) return false;

    const track = LEVEL_TRACKS[levelIndex % LEVEL_TRACKS.length];
    if (!track) return false;

    if (this.trackIndex !== levelIndex) {
      this.trackIndex = levelIndex;
      this.failedTrackIndex = -1;
      this.musicEl.src = track.src;
      this.musicEl.currentTime = 0;
      this.musicEl.load();
    }

    if (this.failedTrackIndex === levelIndex && !force) {
      return false;
    }

    if (!running || paused) {
      this.pauseLevelTrack();
      return true;
    }

    this.musicEl.volume = player.starTimer > 0 ? 0.5 : 0.42;

    if (this.musicEl.paused || force) {
      const request = this.musicEl.play();
      if (request && typeof request.catch === "function") {
        request.catch((error) => {
          this.failedTrackIndex = levelIndex;
          console.warn("Level MP3 konnte nicht starten. Synth-Fallback aktiv.", error);
        });
      }
    }

    return true;
  },

  updateMusic() {
    if (!this.enabled || !running) {
      this.pauseLevelTrack();
      return;
    }

    if (this.playLevelTrack()) {
      return;
    }

    if (!this.ctx || paused) return;

    const stepDuration = this.stepDuration();
    while (this.nextNoteTime < this.ctx.currentTime + 0.25) {
      this.scheduleBeat(this.nextNoteTime);
      this.nextNoteTime += stepDuration;
      this.step += 1;
    }
  },

  stepDuration() {
    return [0.145, 0.135, 0.155, 0.122, 0.165, 0.118][levelIndex % 6];
  },

  scheduleBeat(time) {
    const patterns = [
      {
        transpose: 0,
        wave: "square",
        lead: [392, 494, 587, 494, 440, 392, 330, 392, 349, 440, 523, 440, 392, 330, 294, 0],
        bass: [98, 0, 147, 0, 131, 0, 165, 0, 110, 0, 147, 0, 123, 0, 196, 0],
        arp: [784, 988, 1175, 988],
      },
      {
        transpose: 2,
        wave: "square",
        lead: [440, 554, 659, 740, 659, 554, 494, 0, 440, 554, 659, 554, 494, 440, 370, 0],
        bass: [110, 0, 165, 0, 147, 0, 196, 0, 123, 0, 185, 0, 147, 0, 220, 0],
        arp: [880, 1108, 1318, 1480],
      },
      {
        transpose: -2,
        wave: "triangle",
        lead: [330, 392, 494, 523, 494, 392, 330, 0, 294, 349, 440, 494, 440, 349, 294, 0],
        bass: [82, 0, 123, 0, 110, 0, 147, 0, 73, 0, 110, 0, 98, 0, 165, 0],
        arp: [659, 784, 988, 784],
      },
      {
        transpose: 5,
        wave: "square",
        lead: [523, 659, 784, 659, 587, 523, 440, 523, 587, 740, 880, 740, 659, 587, 523, 0],
        bass: [131, 0, 196, 0, 175, 0, 220, 0, 147, 0, 220, 0, 196, 0, 262, 0],
        arp: [1046, 1318, 1568, 1760],
      },
      {
        transpose: -5,
        wave: "triangle",
        lead: [262, 330, 392, 494, 392, 330, 262, 0, 294, 370, 440, 554, 440, 370, 294, 0],
        bass: [65, 0, 98, 0, 87, 0, 131, 0, 73, 0, 110, 0, 98, 0, 147, 0],
        arp: [523, 659, 784, 988],
      },
      {
        transpose: 7,
        wave: "square",
        lead: [587, 740, 880, 988, 880, 740, 659, 587, 659, 831, 988, 1175, 988, 831, 740, 0],
        bass: [147, 0, 220, 0, 196, 0, 294, 0, 165, 0, 247, 0, 220, 0, 330, 0],
        arp: [1175, 1480, 1760, 1976],
      },
    ];
    const pattern = patterns[levelIndex % patterns.length];
    const i = this.step % pattern.lead.length;
    const lead = pattern.lead[i];
    const bass = pattern.bass[i];
    const arp = pattern.arp[i % pattern.arp.length];

    if (lead) {
      this.tone(this.shift(lead, pattern.transpose), time, 0.11, pattern.wave, 0.062, this.musicGain);
    }

    if (i % 2 === 0 && bass) {
      this.tone(this.shift(bass, pattern.transpose), time, 0.15, "triangle", 0.085, this.musicGain);
    }

    if (i % 4 === 2) {
      this.tone(this.shift(arp, pattern.transpose), time, 0.045, "sine", 0.034, this.musicGain);
    }

    if (i % 8 === 6) {
      this.tone(this.shift(lead || 440, pattern.transpose - 12), time, 0.18, "sawtooth", 0.032, this.musicGain);
    }
  },

  shift(freq, semitones) {
    return freq * 2 ** (semitones / 12);
  },

  tone(freq, time, duration, type, gainValue, destination, endFreq = null) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), time + duration);
    }

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(gainValue, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(time);
    osc.stop(time + duration + 0.04);
  },

  sfx(name) {
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    if (name === "jump") {
      this.tone(330, t, 0.12, "square", 0.16, this.sfxGain, 660);
    } else if (name === "doubleJump") {
      this.tone(520, t, 0.09, "triangle", 0.17, this.sfxGain, 980);
      this.tone(780, t + 0.045, 0.11, "sine", 0.11, this.sfxGain, 1180);
    } else if (name === "coin") {
      this.tone(880, t, 0.07, "square", 0.13, this.sfxGain, 1320);
      this.tone(1320, t + 0.055, 0.08, "square", 0.09, this.sfxGain);
    } else if (name === "crystal") {
      this.tone(620, t, 0.08, "triangle", 0.12, this.sfxGain, 1180);
      this.tone(930, t + 0.06, 0.12, "sine", 0.1, this.sfxGain, 1500);
    } else if (name === "spring") {
      this.tone(180, t, 0.06, "square", 0.16, this.sfxGain, 620);
      this.tone(520, t + 0.04, 0.11, "triangle", 0.14, this.sfxGain, 980);
    } else if (name === "heart") {
      this.tone(520, t, 0.08, "triangle", 0.13, this.sfxGain, 780);
      this.tone(1040, t + 0.08, 0.1, "sine", 0.1, this.sfxGain);
    } else if (name === "shield") {
      this.tone(420, t, 0.14, "sine", 0.12, this.sfxGain, 840);
      this.tone(630, t + 0.05, 0.16, "triangle", 0.09, this.sfxGain, 1260);
    } else if (name === "dash") {
      this.tone(260, t, 0.05, "sawtooth", 0.12, this.sfxGain, 520);
      this.tone(720, t + 0.025, 0.08, "square", 0.08, this.sfxGain, 480);
    } else if (name === "star") {
      [523, 659, 784, 1046].forEach((freq, i) => {
        this.tone(freq, t + i * 0.045, 0.1, "square", 0.1, this.sfxGain);
      });
    } else if (name === "checkpoint") {
      [392, 523, 659].forEach((freq, i) => {
        this.tone(freq, t + i * 0.055, 0.12, "square", 0.1, this.sfxGain);
      });
    } else if (name === "block") {
      this.tone(190, t, 0.08, "sawtooth", 0.13, this.sfxGain, 120);
    } else if (name === "stomp") {
      this.tone(150, t, 0.12, "triangle", 0.18, this.sfxGain, 80);
    } else if (name === "hurt") {
      this.tone(240, t, 0.22, "sawtooth", 0.15, this.sfxGain, 70);
    } else if (name === "level") {
      [392, 494, 587, 784].forEach((freq, i) => {
        this.tone(freq, t + i * 0.08, 0.12, "triangle", 0.12, this.sfxGain);
      });
    } else if (name === "victory") {
      [523, 659, 784, 1046, 1318].forEach((freq, i) => {
        this.tone(freq, t + i * 0.09, 0.2, "square", 0.12, this.sfxGain);
      });
    } else if (name === "gameover") {
      [330, 277, 220, 165].forEach((freq, i) => {
        this.tone(freq, t + i * 0.12, 0.18, "triangle", 0.14, this.sfxGain);
      });
    }
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pseudoRandom(seed) {
  return Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
}

function currentLevel() {
  return LEVELS[levelIndex];
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function createLevelRows(level) {
  const grid = Array.from({ length: LEVEL_H }, () => Array(level.width || 160).fill(" "));

  const builder = {
    put(x, y, text) {
      for (let i = 0; i < text.length; i += 1) {
        if (x + i >= 0 && x + i < grid[0].length && y >= 0 && y < grid.length && text[i] !== " ") {
          grid[y][x + i] = text[i];
        }
      }
    },
    fill(x, y, width, tile) {
      for (let i = 0; i < width; i += 1) {
        this.put(x + i, y, tile);
      }
    },
    rect(x, y, width, height, tile) {
      for (let yy = 0; yy < height; yy += 1) {
        this.fill(x, y + yy, width, tile);
      }
    },
    ground(segments) {
      for (const [x, width] of segments) {
        this.rect(x, 13, width, 2, "X");
      }
    },
  };

  level.build(builder);
  return grid.map((row) => row.join(""));
}

function getTile(tx, ty) {
  if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) {
    return " ";
  }
  return map[ty][tx];
}

function setTile(tx, ty, value) {
  if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) {
    return;
  }
  map[ty][tx] = value;
}

function isSolidAt(tx, ty) {
  return solidTiles.has(getTile(tx, ty));
}

function parseLevel() {
  coins.length = 0;
  jumpCrystals.length = 0;
  hearts.length = 0;
  shields.length = 0;
  stars.length = 0;
  enemies.length = 0;
  flyers.length = 0;
  spawn = { x: 96, y: 200 };

  const rows = createLevelRows(currentLevel());
  const width = Math.max(...rows.map((row) => row.length));

  map = rows.map((row, y) =>
    [...row.padEnd(width, " ")].map((cell, x) => {
      const px = x * TILE;
      const py = y * TILE;

      if (cell === "P") {
        spawn = { x: px + 4, y: py - 2 };
        return " ";
      }

      if (cell === "C") {
        coins.push({
          x: px + 8,
          y: py + 8,
          w: 16,
          h: 16,
          baseY: py + 8,
          t: Math.random() * Math.PI * 2,
          taken: false,
        });
        return " ";
      }

      if (cell === "J") {
        jumpCrystals.push({
          x: px + 6,
          y: py + 3,
          w: 20,
          h: 24,
          baseY: py + 3,
          t: Math.random() * Math.PI * 2,
          taken: false,
        });
        return " ";
      }

      if (cell === "H") {
        hearts.push({
          x: px + 7,
          y: py + 6,
          w: 18,
          h: 18,
          baseY: py + 6,
          t: Math.random() * Math.PI * 2,
          taken: false,
        });
        return " ";
      }

      if (cell === "R") {
        shields.push({
          x: px + 6,
          y: py + 5,
          w: 20,
          h: 20,
          baseY: py + 5,
          t: Math.random() * Math.PI * 2,
          taken: false,
        });
        return " ";
      }

      if (cell === "M") {
        stars.push({
          x: px + 5,
          y: py + 5,
          w: 22,
          h: 22,
          baseY: py + 5,
          t: Math.random() * Math.PI * 2,
          taken: false,
        });
        return " ";
      }

      if (cell === "G") {
        enemies.push({
          x: px + 3,
          y: py + 2,
          w: 26,
          h: 26,
          vx: -72,
          vy: 0,
          alive: true,
          squish: 0,
          walkT: Math.random() * 10,
        });
        return " ";
      }

      if (cell === "A") {
        flyers.push({
          x: px + 2,
          y: py + 3,
          w: 28,
          h: 22,
          baseY: py + 3,
          vx: x % 2 === 0 ? 58 : -58,
          alive: true,
          squish: 0,
          t: Math.random() * Math.PI * 2,
        });
        return " ";
      }

      return cell;
    }),
  );

  worldW = width * TILE;
  worldH = map.length * TILE;
  worldOffsetY = Math.max(0, VIEW_H - worldH);
  checkpoint = { x: spawn.x, y: spawn.y, active: false, tx: -1, ty: -1 };
}

function resetPlayerPosition(useCheckpoint = false) {
  const target = useCheckpoint && checkpoint.active ? checkpoint : spawn;
  player.x = target.x;
  player.y = target.y;
  player.vx = 0;
  player.vy = 0;
  player.face = 1;
  player.onGround = false;
  player.coyote = 0;
  player.jumpBuffer = 0;
  player.airJumpsLeft = AIR_JUMPS;
  player.dashCooldown = 0;
  player.dashTimer = 0;
  player.dashDir = player.face;
  player.deadTimer = 0;
  player.invulnerable = useCheckpoint ? 1.2 : 0;
  player.starTimer = 0;
  player.runT = 0;
}

function resetGame(fullReset = true, resetLevel = true) {
  if (fullReset) {
    if (resetLevel) {
      levelIndex = 0;
    }
    player.coins = 0;
    player.score = 0;
    player.lives = STARTING_LIVES;
    player.shield = false;
    gameComplete = false;
  }

  gameOver = false;
  levelComplete = false;
  parseLevel();
  resetPlayerPosition();
  player.time = currentLevel().time;
  particles.length = 0;
  cameraX = 0;
  cameraY = 0;
  paused = false;
  updateHud();
}

function respawnPlayer() {
  player.lives -= 1;
  if (player.lives <= 0) {
    gameOver = true;
    running = false;
    selectedLevelIndex = levelIndex;
    audio.sfx("gameover");
    showOverlay("Game Over", "Waehle ein Level oder druecke Enter, um vom aktuellen Level neu zu starten.", "Neu starten");
    updateHud();
    return;
  }

  resetPlayerPosition(true);
  player.invulnerable = 1.5;
  player.time = currentLevel().time;
  updateHud();
}

function showOverlay(title, text, buttonText = "Spiel starten") {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startButton.textContent = buttonText;
  updateLevelSelect();
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function updateHud() {
  levelEl.textContent = `Level ${levelIndex + 1}/${LEVELS.length} ${currentLevel().name}`;
  scoreEl.textContent = `Score ${String(player.score).padStart(6, "0")}`;
  coinsEl.textContent = `Coins ${String(player.coins).padStart(2, "0")}`;
  livesEl.textContent = player.shield ? `Leben ${player.lives} + Schild` : `Leben ${player.lives}`;
  timerEl.textContent = `Zeit ${Math.max(0, Math.ceil(player.time))}`;
  updateMiniGui();
}

function updateMiniGui() {
  if (guiPause) {
    guiPause.textContent = running && paused ? ">" : "II";
    guiPause.classList.toggle("active", running && paused);
    guiPause.setAttribute("aria-pressed", String(running && paused));
  }

  if (guiBg) {
    guiBg.classList.toggle("active", backgroundMapEnabled);
    guiBg.setAttribute("aria-pressed", String(backgroundMapEnabled));
  }

  if (guiFullscreen) {
    const fullscreenActive = document.fullscreenElement === gameCard;
    guiFullscreen.textContent = fullscreenActive ? "X" : "FS";
    guiFullscreen.classList.toggle("active", fullscreenActive);
    guiFullscreen.setAttribute("aria-pressed", String(fullscreenActive));
    guiFullscreen.disabled = !document.fullscreenEnabled || !gameCard || !gameCard.requestFullscreen;
  }

  if (guiPrev) {
    guiPrev.disabled = levelIndex <= 0;
  }

  if (guiNext) {
    guiNext.disabled = levelIndex >= LEVELS.length - 1;
  }
}

function updateLevelSelect() {
  if (!levelSelect) return;

  levelSelect.innerHTML = "";
  LEVELS.forEach((level, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === selectedLevelIndex ? "selected" : "";
    button.textContent = `${index + 1}. ${level.name}`;
    button.addEventListener("click", () => {
      selectedLevelIndex = index;
      levelIndex = index;
      updateLevelSelect();
      resetGame(true, false);
      render();
    });
    levelSelect.appendChild(button);
  });
}

function makeClouds() {
  clouds.length = 0;
  for (let i = 0; i < 34; i += 1) {
    clouds.push({
      x: i * 210 + Math.random() * 90,
      y: 34 + Math.random() * 145,
      s: 0.55 + Math.random() * 0.95,
      p: 0.08 + Math.random() * 0.22,
    });
  }
}

function addParticle(x, y, color, count = 8, power = 180, glow = false) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * power,
      vy: -Math.random() * power * 0.85,
      life: 0.45 + Math.random() * 0.35,
      maxLife: 0.8,
      color,
      size: 2 + Math.random() * 4,
      glow,
    });
  }
}

function bumpBlock(tx, ty) {
  const tile = getTile(tx, ty);
  const x = tx * TILE;
  const y = ty * TILE;

  if (tile === "Q") {
    setTile(tx, ty, "O");
    player.coins += 1;
    player.score += 200;
    audio.sfx("coin");
    addParticle(x + TILE / 2, y, "#ffd24a", 15, 220, true);
    updateHud();
    return;
  }

  if (tile === "B") {
    player.score += 50;
    audio.sfx("block");
    addParticle(x + TILE / 2, y + TILE / 2, "#c95d35", 12, 170);
    updateHud();
  }
}

function collectCoin(coin) {
  coin.taken = true;
  player.coins += 1;
  player.score += 100;
  audio.sfx("coin");

  if (player.coins > 0 && player.coins % 20 === 0) {
    player.lives += 1;
    addParticle(player.x + player.w / 2, player.y, "#8ff36a", 20, 250, true);
  } else {
    addParticle(coin.x + 8, coin.y + 8, "#ffd24a", 10, 180, true);
  }

  updateHud();
}

function collectJumpCrystal(crystal) {
  crystal.taken = true;
  player.airJumpsLeft = Math.max(player.airJumpsLeft, AIR_JUMPS + 1);
  player.score += 250;
  audio.sfx("crystal");
  addParticle(crystal.x + crystal.w / 2, crystal.y + crystal.h / 2, "#88f7ff", 18, 250, true);
  addParticle(player.x + player.w / 2, player.y + player.h / 2, "#b4f7ff", 10, 180, true);
  updateHud();
}

function collectHeart(heart) {
  heart.taken = true;
  player.lives += 1;
  player.score += 350;
  audio.sfx("heart");
  addParticle(heart.x + heart.w / 2, heart.y + heart.h / 2, "#ff7fa8", 18, 230, true);
  updateHud();
}

function collectShield(shield) {
  shield.taken = true;
  player.shield = true;
  player.score += 300;
  audio.sfx("shield");
  addParticle(shield.x + shield.w / 2, shield.y + shield.h / 2, "#7df6ff", 20, 250, true);
  updateHud();
}

function collectStar(star) {
  star.taken = true;
  player.starTimer = STAR_TIME;
  player.shield = true;
  player.score += 600;
  audio.sfx("star");
  addParticle(star.x + star.w / 2, star.y + star.h / 2, "#fff67a", 28, 330, true);
  updateHud();
}

function hurtPlayer() {
  if (player.invulnerable > 0 || player.deadTimer > 0 || levelComplete || gameComplete) {
    return;
  }

  if (player.starTimer > 0) {
    player.invulnerable = 0.2;
    audio.sfx("star");
    addParticle(player.x + player.w / 2, player.y + player.h / 2, "#fff67a", 16, 250, true);
    return;
  }

  if (player.shield) {
    player.shield = false;
    player.invulnerable = 1.2;
    player.vx = -player.face * 120;
    player.vy = -330;
    audio.sfx("shield");
    addParticle(player.x + player.w / 2, player.y + player.h / 2, "#7df6ff", 24, 310, true);
    updateHud();
    return;
  }

  player.deadTimer = 0.8;
  player.vx = -player.face * 190;
  player.vy = -470;
  audio.sfx("hurt");
  addParticle(player.x + player.w / 2, player.y + player.h / 2, "#ff6347", 18, 270, true);
}

function stompEnemy(enemy) {
  enemy.alive = false;
  enemy.squish = 0.25;
  player.vy = -STOMP_BOUNCE;
  player.airJumpsLeft = AIR_JUMPS;
  player.score += 300;
  audio.sfx("stomp");
  addParticle(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#f2b24d", 14, 200);
  updateHud();
}

function defeatFlyer(flyer, bounce = true) {
  flyer.alive = false;
  flyer.squish = 0.25;
  if (bounce) {
    player.vy = -STOMP_BOUNCE;
  }
  player.airJumpsLeft = AIR_JUMPS;
  player.score += 350;
  audio.sfx("stomp");
  addParticle(flyer.x + flyer.w / 2, flyer.y + flyer.h / 2, "#b7f0ff", 16, 220, true);
  updateHud();
}

function resolveTileCollision(entity, dx, dy, isPlayer = false) {
  entity.x += dx;
  let startX = Math.floor(entity.x / TILE);
  let endX = Math.floor((entity.x + entity.w - 1) / TILE);
  let startY = Math.floor(entity.y / TILE);
  let endY = Math.floor((entity.y + entity.h - 1) / TILE);

  if (dx !== 0) {
    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        if (!isSolidAt(x, y)) continue;

        if (dx > 0) {
          entity.x = x * TILE - entity.w;
        } else {
          entity.x = (x + 1) * TILE;
        }
        entity.vx = 0;
        startX = Math.floor(entity.x / TILE);
        endX = Math.floor((entity.x + entity.w - 1) / TILE);
      }
    }
  }

  entity.y += dy;
  startX = Math.floor(entity.x / TILE);
  endX = Math.floor((entity.x + entity.w - 1) / TILE);
  startY = Math.floor(entity.y / TILE);
  endY = Math.floor((entity.y + entity.h - 1) / TILE);
  entity.onGround = false;

  if (dy !== 0) {
    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        if (!isSolidAt(x, y)) continue;

        if (dy > 0) {
          entity.y = y * TILE - entity.h;
          entity.onGround = true;
        } else {
          entity.y = (y + 1) * TILE;
          if (isPlayer) {
            bumpBlock(x, y);
          }
        }
        entity.vy = 0;
        startY = Math.floor(entity.y / TILE);
        endY = Math.floor((entity.y + entity.h - 1) / TILE);
      }
    }
  }
}

function updateInput() {
  input.left = keys.has("ArrowLeft") || keys.has("KeyA") || touchActions.get("left") === true;
  input.right = keys.has("ArrowRight") || keys.has("KeyD") || touchActions.get("right") === true;
  input.jump = keys.has("Space") || keys.has("ArrowUp") || keys.has("KeyW") || touchActions.get("jump") === true;

  if (input.jumpPressed) {
    player.jumpBuffer = JUMP_BUFFER;
  }
  input.jumpPressed = false;
}

function triggerDash(dir) {
  player.dashDir = dir || player.face || 1;
  player.face = player.dashDir;
  player.dashTimer = DASH_TIME;
  player.dashCooldown = DASH_COOLDOWN;
  player.vx = player.dashDir * DASH_SPEED;
  player.vy = Math.min(player.vy, -90);
  audio.sfx("dash");
  addParticle(player.x + player.w / 2 - player.dashDir * 10, player.y + player.h / 2, "#d4f8ff", 18, 260, true);
}

function triggerJump(isDoubleJump) {
  player.vy = isDoubleJump ? -DOUBLE_JUMP_SPEED : -JUMP_SPEED;
  player.onGround = false;
  player.coyote = 0;
  player.jumpBuffer = 0;

  if (isDoubleJump) {
    player.airJumpsLeft -= 1;
    audio.sfx("doubleJump");
    addParticle(player.x + player.w / 2, player.y + player.h / 2, "#9eeaff", 18, 250, true);
  } else {
    audio.sfx("jump");
    addParticle(player.x + player.w / 2, player.y + player.h, "#ffffff", 10, 130);
  }
}

function updatePlayer(dt) {
  if (player.deadTimer > 0) {
    player.deadTimer -= dt;
    player.vy += GRAVITY * dt;
    resolveTileCollision(player, player.vx * dt, player.vy * dt, true);

    if (player.deadTimer <= 0 || player.y > worldH + 220) {
      respawnPlayer();
    }
    return;
  }

  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const isAirTurning = !player.onGround && dir !== 0 && Math.sign(player.vx) !== dir && Math.abs(player.vx) > 35;
  const accel = player.onGround ? MOVE_ACCEL : isAirTurning ? AIR_TURN_ACCEL : AIR_ACCEL;

  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.dashTimer = Math.max(0, player.dashTimer - dt);
  player.starTimer = Math.max(0, player.starTimer - dt);

  if (player.onGround) {
    player.airJumpsLeft = AIR_JUMPS;
  }

  if (input.dashPressed && player.dashCooldown <= 0) {
    triggerDash(dir || player.face);
  }
  input.dashPressed = false;

  if (dir !== 0) {
    if (isAirTurning) {
      const brake = Math.min(Math.abs(player.vx), AIR_TURN_BRAKE * dt);
      player.vx -= Math.sign(player.vx) * brake;
      player.vx *= Math.max(0, 1 - AIR_TURN_GRIP * dt);
    }
    player.vx += dir * accel * dt;
    player.face = dir;
    player.runT += dt * Math.abs(player.vx) * 0.045;
  } else if (player.onGround) {
    const amount = FRICTION * dt;
    if (Math.abs(player.vx) <= amount) {
      player.vx = 0;
    } else {
      player.vx -= Math.sign(player.vx) * amount;
    }
  }

  const speedLimit = player.starTimer > 0 ? MAX_SPEED * 1.18 : MAX_SPEED;
  player.vx = clamp(player.vx, -speedLimit, speedLimit);
  if (player.dashTimer > 0) {
    player.vx = player.dashDir * DASH_SPEED;
    player.vy += GRAVITY * 0.25 * dt;
  } else {
    player.vy += GRAVITY * dt;
  }
  player.coyote = player.onGround ? COYOTE_TIME : Math.max(0, player.coyote - dt);
  player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);

  if (player.jumpBuffer > 0) {
    const canGroundJump = player.coyote > 0;
    const canDoubleJump = !player.onGround && player.airJumpsLeft > 0;

    if (canGroundJump || canDoubleJump) {
      triggerJump(!canGroundJump);
    }
  }

  if (!input.jump && player.vy < -220) {
    player.vy += GRAVITY * 0.58 * dt;
  }

  resolveTileCollision(player, player.vx * dt, player.vy * dt, true);

  if (player.onGround) {
    player.airJumpsLeft = AIR_JUMPS;
  }

  player.x = clamp(player.x, 0, worldW - player.w);

  if (player.y > worldH + 180) {
    hurtPlayer();
    player.deadTimer = 0.1;
  }

  if (player.invulnerable > 0) {
    player.invulnerable -= dt;
  }
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      enemy.squish -= dt;
      continue;
    }

    enemy.walkT += dt * 8;
    enemy.vy += GRAVITY * dt;
    const nextFrontX = enemy.vx < 0 ? enemy.x - 2 : enemy.x + enemy.w + 2;
    const footY = enemy.y + enemy.h + 4;
    const frontTileX = Math.floor(nextFrontX / TILE);
    const footTileY = Math.floor(footY / TILE);

    if (enemy.onGround && !isSolidAt(frontTileX, footTileY)) {
      enemy.vx *= -1;
    }

    const beforeVx = enemy.vx;
    resolveTileCollision(enemy, enemy.vx * dt, enemy.vy * dt);

    if (enemy.vx === 0) {
      enemy.vx = -beforeVx || 72;
    }

    if (enemy.y > worldH + 120) {
      enemy.alive = false;
      enemy.squish = 0;
    }

    if (!rectsOverlap(player, enemy) || player.deadTimer > 0) {
      continue;
    }

    if (player.starTimer > 0) {
      stompEnemy(enemy);
      continue;
    }

    const playerBottom = player.y + player.h;
    const wasFalling = player.vy > 80;
    if (wasFalling && playerBottom - enemy.y < 18) {
      stompEnemy(enemy);
    } else {
      hurtPlayer();
    }
  }

  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    if (!enemies[i].alive && enemies[i].squish <= 0) {
      enemies.splice(i, 1);
    }
  }
}

function updateFlyers(dt) {
  for (const flyer of flyers) {
    if (!flyer.alive) {
      flyer.squish -= dt;
      continue;
    }

    flyer.t += dt * 3.2;
    flyer.x += flyer.vx * dt;
    flyer.y = flyer.baseY + Math.sin(flyer.t) * 22;

    const tx = Math.floor((flyer.x + flyer.w / 2) / TILE);
    if (flyer.x < 0 || flyer.x + flyer.w > worldW || isSolidAt(tx, Math.floor((flyer.y + flyer.h / 2) / TILE))) {
      flyer.vx *= -1;
      flyer.x += flyer.vx * dt * 2;
    }

    if (!rectsOverlap(player, flyer) || player.deadTimer > 0) {
      continue;
    }

    const playerBottom = player.y + player.h;
    const wasFalling = player.vy > 70;
    if (player.starTimer > 0) {
      defeatFlyer(flyer, false);
    } else if (wasFalling && playerBottom - flyer.y < 16) {
      defeatFlyer(flyer, true);
    } else {
      hurtPlayer();
    }
  }

  for (let i = flyers.length - 1; i >= 0; i -= 1) {
    if (!flyers[i].alive && flyers[i].squish <= 0) {
      flyers.splice(i, 1);
    }
  }
}

function updateCoins(dt) {
  for (const coin of coins) {
    if (coin.taken) continue;

    coin.t += dt * 5;
    coin.y = coin.baseY + Math.sin(coin.t) * 3;

    if (rectsOverlap(player, coin)) {
      collectCoin(coin);
    }
  }
}

function updateJumpCrystals(dt) {
  for (const crystal of jumpCrystals) {
    if (crystal.taken) continue;

    crystal.t += dt * 4.2;
    crystal.y = crystal.baseY + Math.sin(crystal.t) * 5;

    if (rectsOverlap(player, crystal)) {
      collectJumpCrystal(crystal);
    }
  }
}

function updateHearts(dt) {
  for (const heart of hearts) {
    if (heart.taken) continue;

    heart.t += dt * 3.4;
    heart.y = heart.baseY + Math.sin(heart.t) * 4;

    if (rectsOverlap(player, heart)) {
      collectHeart(heart);
    }
  }
}

function updateShields(dt) {
  for (const shield of shields) {
    if (shield.taken) continue;

    shield.t += dt * 3.8;
    shield.y = shield.baseY + Math.sin(shield.t) * 4;

    if (rectsOverlap(player, shield)) {
      collectShield(shield);
    }
  }
}

function updateStars(dt) {
  for (const star of stars) {
    if (star.taken) continue;

    star.t += dt * 4.6;
    star.y = star.baseY + Math.sin(star.t) * 5;

    if (rectsOverlap(player, star)) {
      collectStar(star);
    }
  }
}

function updateParticles(dt) {
  for (const p of particles) {
    p.life -= dt;
    p.vy += GRAVITY * 0.38 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function finishLevel() {
  levelComplete = true;
  running = false;
  player.score += Math.ceil(player.time) * 10 + player.lives * 500;
  updateHud();

  if (levelIndex < LEVELS.length - 1) {
    audio.sfx("level");
    showOverlay(
      "Level geschafft!",
      `Druecke Enter oder Leertaste fuer ${LEVELS[levelIndex + 1].name}. Score und Leben bleiben erhalten.`,
      "Weiter (Enter)",
    );
    return;
  }

  gameComplete = true;
  audio.sfx("victory");
  showOverlay(
    "Alle Level geschafft!",
    "Du hast alle Glocken erreicht. Druecke Enter, Leertaste oder R fuer eine neue Runde.",
    "Nochmal (Enter)",
  );
}

function checkHazardsAndGoal() {
  const tx1 = Math.floor(player.x / TILE);
  const tx2 = Math.floor((player.x + player.w - 1) / TILE);
  const ty1 = Math.floor(player.y / TILE);
  const ty2 = Math.floor((player.y + player.h - 1) / TILE);

  for (let y = ty1; y <= ty2; y += 1) {
    for (let x = tx1; x <= tx2; x += 1) {
      const tile = getTile(x, y);
      if (tile === "L") {
        hurtPlayer();
      }

      if (tile === "S" && player.vy >= 0) {
        player.vy = -SPRING_SPEED;
        player.airJumpsLeft = AIR_JUMPS + 1;
        player.coyote = 0;
        player.jumpBuffer = 0;
        audio.sfx("spring");
        addParticle(player.x + player.w / 2, player.y + player.h, "#8af7ff", 22, 280, true);
      }

      if (tile === "T" && (checkpoint.tx !== x || checkpoint.ty !== y)) {
        checkpoint = { x: x * TILE + 4, y: y * TILE - 2, active: true, tx: x, ty: y };
        audio.sfx("checkpoint");
        addParticle(x * TILE + TILE / 2, y * TILE + TILE / 2, "#fff4a6", 24, 260, true);
      }

      if (tile === "F" && !levelComplete) {
        finishLevel();
      }
    }
  }
}

function updateCamera() {
  const targetX = player.x + player.w / 2 - VIEW_W * 0.42;
  cameraX += (targetX - cameraX) * 0.12;
  cameraX = clamp(cameraX, 0, Math.max(0, worldW - VIEW_W));
  cameraY = clamp(player.y - VIEW_H * 0.58, 0, Math.max(0, worldH - VIEW_H));
}

function fitGameToScreen() {
  if (!stageWrap || !stageWrap.clientWidth || !stageWrap.clientHeight) {
    return;
  }

  stageWrap.style.setProperty("--game-fit-w", `${Math.floor(stageWrap.clientWidth)}px`);
  stageWrap.style.setProperty("--game-fit-h", `${Math.floor(stageWrap.clientHeight)}px`);
}

function tick(now) {
  rafId = requestAnimationFrame(tick);
  audio.updateMusic();

  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now;

  if (!running || paused) {
    render();
    return;
  }

  worldClock += dt;
  updateInput();
  player.time -= dt;

  if (player.time <= 0 && !gameOver) {
    player.time = 0;
    hurtPlayer();
    player.deadTimer = 0.1;
  }

  updatePlayer(dt);
  updateEnemies(dt);
  updateFlyers(dt);
  updateCoins(dt);
  updateJumpCrystals(dt);
  updateHearts(dt);
  updateShields(dt);
  updateStars(dt);
  updateParticles(dt);
  checkHazardsAndGoal();
  updateCamera();
  updateHud();
  render();
}

function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTiledBackgroundAsset(image, y, h, parallax, driftSpeed, alpha) {
  if (!assetReady(image)) return false;

  const scale = h / image.naturalHeight;
  const drawW = image.naturalWidth * scale;
  const drift = (cameraX * parallax + worldClock * driftSpeed) % drawW;
  const startX = -drift;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  for (let x = startX - drawW; x < VIEW_W + drawW; x += drawW) {
    ctx.drawImage(image, Math.round(x), Math.round(y), Math.ceil(drawW), Math.ceil(h));
  }
  ctx.restore();
  return true;
}

function drawImagenBackgroundMap() {
  if (!backgroundMapEnabled) return false;
  if (!assetReady(BACKGROUND_MAP)) return false;

  const scale = VIEW_H / BACKGROUND_MAP.naturalHeight;
  const drawW = BACKGROUND_MAP.naturalWidth * scale;
  const drift = (cameraX * 0.08 + worldClock * 4) % drawW;
  const startX = -drift;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 0.44;
  ctx.filter = "saturate(52%) contrast(76%) brightness(1.08)";
  for (let x = startX - drawW; x < VIEW_W + drawW; x += drawW) {
    ctx.drawImage(BACKGROUND_MAP, Math.round(x), 0, Math.ceil(drawW), VIEW_H);
  }
  ctx.globalAlpha = 1;
  ctx.filter = "none";

  drawTiledBackgroundAsset(BG_DISTANT_SILHOUETTES, VIEW_H - 238, 238, 0.045, 0.6, 0.34);
  drawTiledBackgroundAsset(BG_CLOUD_BANK, 18, 190, 0.025, -4.5, 0.42);
  drawTiledBackgroundAsset(BG_MIST_BANDS, 0, VIEW_H, 0.035, 7.5, 0.68);

  const haze = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  haze.addColorStop(0, "rgba(214, 242, 255, 0.34)");
  haze.addColorStop(0.45, "rgba(214, 241, 247, 0.30)");
  haze.addColorStop(1, "rgba(218, 238, 220, 0.40)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const depthWash = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  depthWash.addColorStop(0, "rgba(255, 255, 255, 0.10)");
  depthWash.addColorStop(0.55, "rgba(168, 218, 231, 0.10)");
  depthWash.addColorStop(1, "rgba(18, 55, 43, 0.24)");
  ctx.fillStyle = depthWash;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
  return true;
}

function drawSky() {
  const palette = currentLevel().palette;
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  gradient.addColorStop(0, palette.top);
  gradient.addColorStop(0.55, palette.mid);
  gradient.addColorStop(1, palette.ground);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  if (drawImagenBackgroundMap()) {
    return;
  }

  if (levelIndex >= 2) {
    ctx.save();
    ctx.translate(-cameraX * 0.04, 0);
    for (let i = 0; i < 76; i += 1) {
      const x = pseudoRandom(i + levelIndex * 31) * (VIEW_W + 260) - 120;
      const y = 24 + pseudoRandom(i + 100) * 210;
      const blink = 0.35 + Math.sin(worldClock * (1.8 + pseudoRandom(i) * 2) + i) * 0.25;
      ctx.fillStyle = `rgba(255, 255, 245, ${blink})`;
      ctx.fillRect(x, y, 1 + (i % 3 === 0 ? 1 : 0), 1 + (i % 5 === 0 ? 1 : 0));
    }
    ctx.restore();
  }

  const sunX = VIEW_W - 150 - Math.sin(worldClock * 0.25) * 16;
  const sunY = 88 + Math.cos(worldClock * 0.2) * 8;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 105);
  sunGlow.addColorStop(0, palette.sun);
  sunGlow.addColorStop(0.42, "rgba(255, 235, 120, 0.45)");
  sunGlow.addColorStop(1, "rgba(255, 235, 120, 0)");
  ctx.fillStyle = sunGlow;
  ctx.fillRect(sunX - 110, sunY - 110, 220, 220);
  ctx.fillStyle = palette.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(-cameraX * 0.12, 0);
  for (let i = 0; i < 18; i += 1) {
    const x = i * 340 - 120;
    const y = 250 + (i % 3) * 26;
    ctx.fillStyle = i % 2 ? palette.hillA : palette.hillB;
    ctx.beginPath();
    ctx.moveTo(x, VIEW_H);
    ctx.quadraticCurveTo(x + 165, y - 170, x + 330, VIEW_H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  if (levelIndex === 4) {
    ctx.save();
    ctx.translate(-cameraX * 0.28, 0);
    for (let i = 0; i < 22; i += 1) {
      const x = i * 150 + pseudoRandom(i) * 70;
      const h = 38 + pseudoRandom(i + 44) * 70;
      ctx.fillStyle = "rgba(170, 240, 255, 0.18)";
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 16, h);
      ctx.lineTo(x + 34, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(-cameraX * 0.2, 0);
  for (const cloud of clouds) {
    const x = (cloud.x % (worldW + 360)) - 140;
    const y = cloud.y + Math.sin(worldClock * cloud.p + cloud.x) * 4;
    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.beginPath();
    ctx.arc(x, y, 22 * cloud.s, 0, Math.PI * 2);
    ctx.arc(x + 28 * cloud.s, y - 10 * cloud.s, 27 * cloud.s, 0, Math.PI * 2);
    ctx.arc(x + 60 * cloud.s, y, 22 * cloud.s, 0, Math.PI * 2);
    ctx.arc(x + 30 * cloud.s, y + 8 * cloud.s, 30 * cloud.s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(-cameraX * 0.43, 0);
  for (let i = 0; i < 36; i += 1) {
    const x = i * 180 - 70;
    const h = 42 + (i % 4) * 10;
    ctx.fillStyle = i % 2 ? "rgba(42, 126, 57, 0.62)" : "rgba(58, 150, 64, 0.62)";
    ctx.beginPath();
    ctx.ellipse(x, VIEW_H - 38, 58, h, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawAtmosphereFX() {
  const fxAlpha = backgroundMapEnabled && assetReady(BACKGROUND_MAP) ? 0.55 : 1;
  ctx.save();
  ctx.translate(-cameraX * 0.1, 0);

  for (let i = 0; i < 54; i += 1) {
    const seed = i + levelIndex * 97;
    const drift = worldClock * (14 + pseudoRandom(seed) * 26);
    const x = (pseudoRandom(seed) * (VIEW_W + 360) + drift) % (VIEW_W + 360) - 180;
    const y = 34 + ((pseudoRandom(seed + 42) * 410 + worldClock * (8 + levelIndex * 2)) % 410);

    if (levelIndex === 2) {
      ctx.fillStyle = `rgba(255, ${120 + Math.floor(pseudoRandom(seed) * 80)}, 52, ${(0.22 + pseudoRandom(seed + 7) * 0.42) * fxAlpha})`;
      ctx.fillRect(x, y, 2, 2 + pseudoRandom(seed + 8) * 4);
    } else if (levelIndex >= 4) {
      ctx.fillStyle = `rgba(150, 235, 255, ${(0.18 + pseudoRandom(seed + 7) * 0.36) * fxAlpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + pseudoRandom(seed + 2) * 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(255, 239, 140, ${(0.16 + pseudoRandom(seed + 9) * 0.32) * fxAlpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.4 + Math.sin(worldClock * 3 + seed) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (levelIndex === 3) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.11 * fxAlpha})`;
    for (let i = 0; i < 9; i += 1) {
      const x = i * 150 - (cameraX * 0.08) % 150;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 80, 0);
      ctx.lineTo(x + 12, VIEW_H);
      ctx.lineTo(x - 68, VIEW_H);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (levelIndex === 6) {
    ctx.strokeStyle = `rgba(190, 225, 255, ${0.35 * fxAlpha})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 70; i += 1) {
      const x = (pseudoRandom(i + 300) * (VIEW_W + 260) + worldClock * 520) % (VIEW_W + 260) - 130;
      const y = (pseudoRandom(i + 600) * (VIEW_H + 180) + worldClock * 760) % (VIEW_H + 180) - 90;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 18, y + 38);
      ctx.stroke();
    }

    if (Math.sin(worldClock * 2.7) > 0.96) {
      ctx.fillStyle = `rgba(230, 245, 255, ${0.18 * fxAlpha})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.strokeStyle = `rgba(245, 250, 255, ${0.78 * fxAlpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(VIEW_W * 0.62, 0);
      ctx.lineTo(VIEW_W * 0.55, 92);
      ctx.lineTo(VIEW_W * 0.61, 142);
      ctx.lineTo(VIEW_W * 0.48, 238);
      ctx.stroke();
    }
  }

  if (levelIndex === 7) {
    for (let i = 0; i < 5; i += 1) {
      const y = 70 + i * 34 + Math.sin(worldClock * 1.1 + i) * 12;
      const g = ctx.createLinearGradient(0, y, VIEW_W, y + 60);
      g.addColorStop(0, "rgba(80, 255, 210, 0)");
      g.addColorStop(0.45, `rgba(120, 140, 255, ${0.18 * fxAlpha})`);
      g.addColorStop(1, "rgba(255, 120, 220, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= VIEW_W; x += 80) {
        ctx.lineTo(x, y + Math.sin(worldClock * 1.7 + x * 0.01 + i) * 18);
      }
      ctx.lineTo(VIEW_W, y + 52);
      ctx.lineTo(0, y + 52);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

function loadPixelAsset(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function assetReady(image) {
  return image && image.complete && image.naturalWidth > 0;
}

function spriteFrame(anim, timeSeed = worldClock) {
  if (!anim.fps) return 0;
  return Math.floor(timeSeed * anim.fps) % anim.frames;
}

function drawSpriteFrame(image, row, col, dx, dy, dw, dh) {
  if (!assetReady(image)) return false;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    col * SPRITE_FRAME,
    row * SPRITE_FRAME,
    SPRITE_FRAME,
    SPRITE_FRAME,
    Math.round(dx),
    Math.round(dy),
    Math.round(dw),
    Math.round(dh),
  );
  return true;
}

function drawTileSprite(tile, sx, sy, tx, ty) {
  const anim = TILE_ANIMS[tile];
  if (!anim || !assetReady(TILE_SHEET)) return false;
  const col = anim.fps ? spriteFrame(anim, worldClock + tx * 0.13 + ty * 0.07) : Math.abs(tx + ty) % anim.frames;
  return drawSpriteFrame(TILE_SHEET, anim.row, col, sx, sy, TILE, TILE);
}

function drawCollectibleSprite(kind, x, y, w, h, t, pulse = 1) {
  const anim = COLLECTIBLE_ANIMS[kind];
  if (!anim || !assetReady(SPRITE_SHEET)) return false;
  const frame = anim.col + spriteFrame(anim, t);
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(pulse, pulse);
  drawSpriteFrame(SPRITE_SHEET, anim.row, frame, -16, -16, 32, 32);
  ctx.restore();
  return true;
}

function drawPlayerSprite(x, y) {
  if (!assetReady(SPRITE_SHEET)) return false;
  let anim = PLAYER_ANIMS.idle;
  let timeSeed = worldClock;

  if (player.deadTimer > 0) {
    anim = PLAYER_ANIMS.hurt;
  } else if (player.dashTimer > 0) {
    anim = PLAYER_ANIMS.dash;
  } else if (!player.onGround && player.vy < 40) {
    anim = PLAYER_ANIMS.jump;
  } else if (!player.onGround) {
    anim = PLAYER_ANIMS.fall;
  } else if (Math.abs(player.vx) > 20) {
    anim = PLAYER_ANIMS.run;
    timeSeed = player.runT * 0.18;
  }

  ctx.save();
  ctx.translate(x + player.w / 2, y + player.h);
  ctx.scale(player.face, 1);
  drawSpriteFrame(SPRITE_SHEET, anim.row, spriteFrame(anim, timeSeed), -18, -34, 36, 36);
  if (!player.onGround && player.airJumpsLeft === 0) {
    ctx.fillStyle = "rgba(158, 234, 255, 0.55)";
    ctx.fillRect(-13, 2, 26, 3);
  }
  ctx.restore();
  return true;
}

function drawEnemySprite(enemy) {
  if (!assetReady(SPRITE_SHEET)) return false;
  const x = enemy.x - cameraX;
  const y = enemy.y - cameraY + worldOffsetY;
  ctx.save();
  ctx.translate(x + enemy.w / 2, y + enemy.h + Math.sin(enemy.walkT) * 2);
  ctx.scale(enemy.vx < 0 ? -1 : 1, 1);
  drawSpriteFrame(SPRITE_SHEET, ENEMY_ANIM.row, spriteFrame(ENEMY_ANIM, enemy.walkT * 0.25), -18, -34, 36, 36);
  ctx.restore();
  return true;
}

function drawFlyerSprite(flyer) {
  if (!assetReady(SPRITE_SHEET)) return false;
  const x = flyer.x - cameraX;
  const y = flyer.y - cameraY + worldOffsetY;
  ctx.save();
  ctx.translate(x + flyer.w / 2, y + flyer.h / 2);
  ctx.scale(flyer.vx < 0 ? -1 : 1, 1);
  drawSpriteFrame(SPRITE_SHEET, FLYER_ANIM.row, spriteFrame(FLYER_ANIM, flyer.t), -20, -20, 40, 40);
  ctx.restore();
  return true;
}

function drawTile(tile, sx, sy, tx, ty) {
  if (drawTileSprite(tile, sx, sy, tx, ty)) {
    return;
  }

  if (tile === "X") {
    ctx.fillStyle = "#5f341c";
    ctx.fillRect(sx, sy + 9, TILE, TILE - 9);
    ctx.fillStyle = "#7d4925";
    ctx.fillRect(sx, sy + 13, TILE, TILE - 13);
    ctx.fillStyle = "#49aa4f";
    ctx.fillRect(sx, sy, TILE, 8);
    ctx.fillStyle = "#79d94f";
    ctx.fillRect(sx, sy, TILE, 3);
    ctx.fillStyle = "rgba(20, 10, 5, 0.25)";
    ctx.fillRect(sx, sy + 28, TILE, 4);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(sx + ((tx + ty) % 2) * 12, sy + 16, 14, 4);
    return;
  }

  if (tile === "B") {
    ctx.fillStyle = "#7e321d";
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = "#c66138";
    ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = "#82341e";
    ctx.fillRect(sx, sy + 14, TILE, 4);
    ctx.fillRect(sx + 14, sy, 4, 14);
    ctx.fillRect(sx + 4, sy + 18, 4, 14);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(sx + 4, sy + 4, 20, 3);
    return;
  }

  if (tile === "Q" || tile === "O") {
    const bob = tile === "Q" ? Math.sin(worldClock * 5 + tx) * 1.5 : 0;
    ctx.fillStyle = tile === "Q" ? "#9b621d" : "#64442d";
    ctx.fillRect(sx, sy + bob, TILE, TILE);
    ctx.fillStyle = tile === "Q" ? "#f4b83a" : "#97704d";
    ctx.fillRect(sx + 2, sy + 2 + bob, TILE - 4, TILE - 4);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(sx + 5, sy + 5 + bob, TILE - 10, 4);
    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.fillRect(sx + 5, sy + TILE - 8 + bob, TILE - 10, 4);
    if (tile === "Q") {
      ctx.fillStyle = "#fff3a6";
      ctx.font = "bold 22px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", sx + TILE / 2, sy + TILE / 2 + 1 + bob);
    }
    return;
  }

  if (tile === "U") {
    ctx.fillStyle = "#2e1b12";
    ctx.fillRect(sx + 2, sy + 10, TILE - 4, 17);
    ctx.fillStyle = "#e2a24b";
    ctx.fillRect(sx, sy + 7, TILE, 10);
    ctx.fillStyle = "#fff0a3";
    ctx.fillRect(sx + 4, sy + 8, TILE - 8, 2);
    return;
  }

  if (tile === "S") {
    const squash = Math.sin(worldClock * 10 + tx) * 1.5;
    ctx.fillStyle = "rgba(20, 10, 5, 0.24)";
    ctx.fillRect(sx + 2, sy + 26, TILE - 4, 5);
    ctx.fillStyle = "#1e3e5f";
    ctx.fillRect(sx + 3, sy + 20 + squash, TILE - 6, 8);
    ctx.fillStyle = "#41d9ff";
    ctx.fillRect(sx + 1, sy + 14 + squash, TILE - 2, 8);
    ctx.fillStyle = "#eaffff";
    ctx.fillRect(sx + 6, sy + 15 + squash, TILE - 12, 2);
    ctx.fillStyle = "#ff6f45";
    ctx.fillRect(sx + 6, sy + 24, 5, 5);
    ctx.fillRect(sx + TILE - 11, sy + 24, 5, 5);
    return;
  }

  if (tile === "L") {
    ctx.fillStyle = "#7f1f20";
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = "#ffb43b";
    ctx.beginPath();
    ctx.moveTo(sx, sy + 13);
    for (let i = 0; i <= 4; i += 1) {
      const px = sx + i * 8;
      const py = sy + 12 + Math.sin(worldClock * 7 + tx + i) * 5;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(sx + TILE, sy + TILE);
    ctx.lineTo(sx, sy + TILE);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(sx + 6, sy + 23, 8, 2);
    return;
  }

  if (tile === "T") {
    const active = checkpoint.tx === tx && checkpoint.ty === ty;
    ctx.fillStyle = "#3a2114";
    ctx.fillRect(sx + 14, sy - 35, 5, 66);
    ctx.fillStyle = active ? "#fff4a6" : "#78e36a";
    ctx.beginPath();
    ctx.moveTo(sx + 19, sy - 33);
    ctx.lineTo(sx + 62, sy - 22 + Math.sin(worldClock * 5 + tx) * 2);
    ctx.lineTo(sx + 19, sy - 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = active ? "#ff8c45" : "#2a9a55";
    ctx.fillRect(sx + 19, sy - 26, 24, 5);
    ctx.fillStyle = active ? "rgba(255, 244, 166, 0.28)" : "rgba(120, 227, 106, 0.22)";
    ctx.beginPath();
    ctx.arc(sx + 16, sy - 34, 18 + Math.sin(worldClock * 4) * 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (tile === "F") {
    ctx.fillStyle = "#3a2114";
    ctx.fillRect(sx + 14, sy - 68, 6, 100);
    ctx.fillStyle = "#ffd24a";
    ctx.beginPath();
    ctx.arc(sx + 17, sy - 75, 12 + Math.sin(worldClock * 8) * 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0a72f";
    ctx.beginPath();
    ctx.moveTo(sx + 4, sy - 54);
    ctx.quadraticCurveTo(sx + 17, sy - 75, sx + 30, sy - 54);
    ctx.lineTo(sx + 25, sy - 24);
    ctx.lineTo(sx + 9, sy - 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff2a2";
    ctx.fillRect(sx + 11, sy - 51, 12, 4);
    ctx.fillStyle = "#e84d2f";
    ctx.beginPath();
    ctx.moveTo(sx + 21, sy - 66);
    ctx.lineTo(sx + 72, sy - 50 + Math.sin(worldClock * 3) * 3);
    ctx.lineTo(sx + 21, sy - 34);
    ctx.closePath();
    ctx.fill();
  }
}

function drawWorld() {
  const startX = Math.floor(cameraX / TILE);
  const endX = Math.ceil((cameraX + VIEW_W) / TILE);
  const startY = Math.floor(cameraY / TILE);
  const endY = Math.ceil((cameraY + VIEW_H) / TILE);

  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const tile = getTile(x, y);
      if (tile === " ") continue;
      drawTile(tile, x * TILE - cameraX, y * TILE - cameraY + worldOffsetY, x, y);
    }
  }
}

function drawCoins() {
  for (const coin of coins) {
    if (coin.taken) continue;
    const x = coin.x - cameraX;
    const y = coin.y - cameraY + worldOffsetY;

    if (x < -40 || x > VIEW_W + 40 || y < -40 || y > VIEW_H + 40) {
      continue;
    }

    if (drawCollectibleSprite("coin", x, y, 16, 16, coin.t)) {
      continue;
    }

    const spin = Math.abs(Math.cos(coin.t)) * 7 + 2;
    ctx.fillStyle = "#fff0a6";
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 8, spin, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4a622";
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 8, Math.max(1, spin * 0.45), 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(x + 6, y + 2, 3, 3);
  }
}

function drawJumpCrystals() {
  for (const crystal of jumpCrystals) {
    if (crystal.taken) continue;

    const x = crystal.x - cameraX;
    const y = crystal.y - cameraY + worldOffsetY;
    if (x < -50 || x > VIEW_W + 50 || y < -50 || y > VIEW_H + 50) {
      continue;
    }

    const pulse = 1 + Math.sin(crystal.t * 2) * 0.1;
    if (drawCollectibleSprite("crystal", x, y, crystal.w, crystal.h, crystal.t, pulse)) {
      continue;
    }

    ctx.save();
    ctx.translate(x + crystal.w / 2, y + crystal.h / 2);
    ctx.scale(pulse, pulse);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
    glow.addColorStop(0, "rgba(170, 255, 255, 0.5)");
    glow.addColorStop(1, "rgba(100, 220, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-34, -34, 68, 68);

    ctx.fillStyle = "#98fbff";
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(11, -4);
    ctx.lineTo(7, 14);
    ctx.lineTo(-7, 14);
    ctx.lineTo(-11, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(4, -2);
    ctx.lineTo(0, 9);
    ctx.lineTo(-4, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawHearts() {
  for (const heart of hearts) {
    if (heart.taken) continue;

    const x = heart.x - cameraX;
    const y = heart.y - cameraY + worldOffsetY;
    if (x < -50 || x > VIEW_W + 50 || y < -50 || y > VIEW_H + 50) {
      continue;
    }

    const pulse = 1 + Math.sin(heart.t * 2.5) * 0.08;
    if (drawCollectibleSprite("heart", x, y, heart.w, heart.h, heart.t, pulse)) {
      continue;
    }

    ctx.save();
    ctx.translate(x + heart.w / 2, y + heart.h / 2);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "rgba(255, 80, 130, 0.24)";
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff4f7d";
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.bezierCurveTo(-18, 0, -13, -15, -3, -8);
    ctx.bezierCurveTo(0, -16, 15, -15, 14, -2);
    ctx.bezierCurveTo(14, 5, 7, 9, 0, 12);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.fillRect(-4, -8, 4, 3);
    ctx.restore();
  }
}

function drawShields() {
  for (const shield of shields) {
    if (shield.taken) continue;

    const x = shield.x - cameraX;
    const y = shield.y - cameraY + worldOffsetY;
    if (x < -50 || x > VIEW_W + 50 || y < -50 || y > VIEW_H + 50) {
      continue;
    }

    const pulse = 1 + Math.sin(shield.t * 2.2) * 0.08;
    if (drawCollectibleSprite("shield", x, y, shield.w, shield.h, shield.t, pulse)) {
      continue;
    }

    ctx.save();
    ctx.translate(x + shield.w / 2, y + shield.h / 2);
    ctx.scale(pulse, pulse);
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 30);
    glow.addColorStop(0, "rgba(130, 245, 255, 0.5)");
    glow.addColorStop(1, "rgba(130, 245, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-34, -34, 68, 68);
    ctx.fillStyle = "#75eaff";
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(13, -8);
    ctx.lineTo(10, 8);
    ctx.lineTo(0, 17);
    ctx.lineTo(-10, 8);
    ctx.lineTo(-13, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#173c5f";
    ctx.fillRect(-3, -8, 6, 17);
    ctx.fillRect(-8, -2, 16, 5);
    ctx.restore();
  }
}

function drawStars() {
  for (const star of stars) {
    if (star.taken) continue;

    const x = star.x - cameraX;
    const y = star.y - cameraY + worldOffsetY;
    if (x < -50 || x > VIEW_W + 50 || y < -50 || y > VIEW_H + 50) {
      continue;
    }

    const pulse = 1 + Math.sin(star.t * 3) * 0.12;
    if (drawCollectibleSprite("star", x, y, star.w, star.h, star.t, pulse)) {
      continue;
    }

    ctx.save();
    ctx.translate(x + star.w / 2, y + star.h / 2);
    ctx.rotate(Math.sin(star.t) * 0.18);
    ctx.scale(pulse, pulse);

    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 34);
    glow.addColorStop(0, "rgba(255, 252, 130, 0.58)");
    glow.addColorStop(1, "rgba(255, 190, 70, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-38, -38, 76, 76);

    ctx.fillStyle = "#fff46f";
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const radius = i % 2 === 0 ? 15 : 7;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ff9f32";
    ctx.fillRect(-4, -3, 8, 5);
    ctx.restore();
  }
}

function drawEnemy(enemy) {
  if (drawEnemySprite(enemy)) {
    return;
  }

  const x = enemy.x - cameraX;
  const y = enemy.y - cameraY + worldOffsetY;
  const bob = Math.sin(enemy.walkT) * 2;

  ctx.save();
  ctx.translate(x, y + bob);

  ctx.fillStyle = "rgba(38, 17, 8, 0.28)";
  ctx.beginPath();
  ctx.ellipse(enemy.w / 2, enemy.h + 4, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6e3f22";
  drawRoundedRect(0, 7, enemy.w, enemy.h - 3, 8);
  ctx.fill();

  ctx.fillStyle = "#d28b45";
  ctx.beginPath();
  ctx.arc(enemy.w / 2, 11, 15, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f0cf85";
  ctx.fillRect(4, 14, enemy.w - 8, 4);

  ctx.fillStyle = "#201008";
  ctx.fillRect(7, 8, 4, 4);
  ctx.fillRect(enemy.w - 11, 8, 4, 4);

  ctx.fillStyle = "#35190d";
  ctx.fillRect(4, enemy.h - 1, 7, 4);
  ctx.fillRect(enemy.w - 11, enemy.h - 1, 7, 4);

  ctx.restore();
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive && enemy.squish <= 0) continue;

    const x = enemy.x - cameraX;
    const y = enemy.y - cameraY + worldOffsetY;
    if (x < -60 || x > VIEW_W + 60 || y < -60 || y > VIEW_H + 60) {
      continue;
    }

    if (enemy.alive) {
      drawEnemy(enemy);
    } else {
      ctx.fillStyle = "#7c4324";
      ctx.fillRect(x, y + enemy.h - 8, enemy.w, 8);
    }
  }
}

function drawFlyer(flyer) {
  if (drawFlyerSprite(flyer)) {
    return;
  }

  const x = flyer.x - cameraX;
  const y = flyer.y - cameraY + worldOffsetY;
  const flap = Math.sin(flyer.t * 5) * 6;

  ctx.save();
  ctx.translate(x + flyer.w / 2, y + flyer.h / 2);
  ctx.scale(flyer.vx < 0 ? -1 : 1, 1);

  ctx.fillStyle = "rgba(20, 10, 35, 0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 17, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#324a8e";
  ctx.beginPath();
  ctx.moveTo(-5, -2);
  ctx.quadraticCurveTo(-27, -18 - flap, -25, 8);
  ctx.quadraticCurveTo(-14, 4, -5, 8);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(5, -2);
  ctx.quadraticCurveTo(27, -18 - flap, 25, 8);
  ctx.quadraticCurveTo(14, 4, 5, 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#5d7bdf";
  drawRoundedRect(-10, -10, 20, 20, 8);
  ctx.fill();
  ctx.fillStyle = "#ffe9a3";
  ctx.fillRect(-5, -3, 4, 4);
  ctx.fillRect(2, -3, 4, 4);
  ctx.fillStyle = "#111827";
  ctx.fillRect(-4, -2, 2, 2);
  ctx.fillRect(4, -2, 2, 2);

  ctx.restore();
}

function drawFlyers() {
  for (const flyer of flyers) {
    if (!flyer.alive && flyer.squish <= 0) continue;

    const x = flyer.x - cameraX;
    const y = flyer.y - cameraY + worldOffsetY;
    if (x < -70 || x > VIEW_W + 70 || y < -70 || y > VIEW_H + 70) {
      continue;
    }

    if (flyer.alive) {
      drawFlyer(flyer);
    } else {
      ctx.fillStyle = "#5d7bdf";
      ctx.fillRect(x + 2, y + flyer.h - 5, flyer.w - 4, 6);
    }
  }
}

function drawPlayer() {
  const x = player.x - cameraX;
  const y = player.y - cameraY + worldOffsetY;
  const blink = player.invulnerable > 0 && Math.floor(player.invulnerable * 16) % 2 === 0;

  if (blink) {
    return;
  }

  ctx.fillStyle = "rgba(38, 17, 8, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x + player.w / 2, y + player.h + 5, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (player.shield) {
    const aura = ctx.createRadialGradient(x + player.w / 2, y + player.h / 2, 8, x + player.w / 2, y + player.h / 2, 34);
    aura.addColorStop(0, "rgba(120, 245, 255, 0.08)");
    aura.addColorStop(0.65, "rgba(120, 245, 255, 0.24)");
    aura.addColorStop(1, "rgba(120, 245, 255, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x + player.w / 2, y + player.h / 2, 34 + Math.sin(worldClock * 8) * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  if (player.starTimer > 0) {
    const aura = ctx.createRadialGradient(x + player.w / 2, y + player.h / 2, 6, x + player.w / 2, y + player.h / 2, 42);
    aura.addColorStop(0, "rgba(255, 255, 120, 0.18)");
    aura.addColorStop(0.62, "rgba(255, 210, 70, 0.32)");
    aura.addColorStop(1, "rgba(255, 210, 70, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x + player.w / 2, y + player.h / 2, 40 + Math.sin(worldClock * 12) * 3, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 5; i += 1) {
      const a = worldClock * 5 + i * 1.26;
      ctx.fillStyle = "rgba(255, 246, 111, 0.75)";
      ctx.fillRect(x + player.w / 2 + Math.cos(a) * 28, y + player.h / 2 + Math.sin(a) * 22, 3, 3);
    }
  }

  if (drawPlayerSprite(x, y)) {
    return;
  }

  ctx.save();
  ctx.translate(x + player.w / 2, y + player.h);
  ctx.scale(player.face, 1);
  ctx.translate(-player.w / 2, -player.h);

  const step = player.onGround ? Math.sin(player.runT) * 3 : 0;
  const lean = player.onGround ? clamp(player.vx / MAX_SPEED, -1, 1) * 2 : 0;
  ctx.translate(lean, 0);

  ctx.fillStyle = "#2d2016";
  ctx.fillRect(2, player.h - 4 + step, 8, 5);
  ctx.fillRect(player.w - 10, player.h - 4 - step, 8, 5);

  ctx.fillStyle = "#2457c9";
  ctx.fillRect(5, 13, 14, 13);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(8, 15, 3, 3);
  ctx.fillRect(15, 15, 3, 3);
  ctx.fillStyle = "#f0c58c";
  ctx.fillRect(3, 5, 17, 12);
  ctx.fillStyle = "#ce3726";
  ctx.fillRect(2, 0, 19, 7);
  ctx.fillRect(0, 6, 11, 4);
  ctx.fillStyle = "#ff6f45";
  ctx.fillRect(4, 1, 14, 2);

  ctx.fillStyle = "#fff7d7";
  ctx.fillRect(13, 8, 4, 4);
  ctx.fillStyle = "#1b140d";
  ctx.fillRect(15, 9, 2, 2);
  ctx.fillRect(17, 13, 5, 2);

  ctx.fillStyle = "#f0c58c";
  ctx.fillRect(-2, 15, 6, 9);
  ctx.fillRect(20, 15, 6, 9);

  if (!player.onGround && player.airJumpsLeft === 0) {
    ctx.fillStyle = "rgba(158, 234, 255, 0.55)";
    ctx.fillRect(2, player.h + 2, 20, 3);
  }

  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    if (p.glow) {
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillRect(p.x - cameraX - p.size, p.y - cameraY + worldOffsetY - p.size, p.size * 3, p.size * 3);
    }
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - cameraX, p.y - cameraY + worldOffsetY, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawForegroundDecor() {
  ctx.save();
  ctx.translate(-cameraX * 0.72, 0);

  for (let i = 0; i < 70; i += 1) {
    const x = i * 76 + pseudoRandom(i + levelIndex * 11) * 34;
    const y = VIEW_H - 18 + Math.sin(worldClock * 1.4 + i) * 2;
    const tall = 12 + pseudoRandom(i + 9) * 18;
    ctx.strokeStyle = levelIndex >= 4 ? "rgba(120, 220, 255, 0.35)" : "rgba(34, 100, 36, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, VIEW_H);
    ctx.quadraticCurveTo(x + 5, y - tall * 0.5, x + 2, y - tall);
    ctx.stroke();

    if (i % 7 === 0) {
      ctx.fillStyle = levelIndex >= 4 ? "rgba(170, 255, 255, 0.65)" : "rgba(255, 230, 96, 0.65)";
      ctx.beginPath();
      ctx.arc(x + 2, y - tall - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (levelIndex === 4) {
    for (let i = 0; i < 18; i += 1) {
      const x = i * 240 + 80;
      const y = VIEW_H - 34;
      const glow = ctx.createRadialGradient(x, y, 2, x, y, 36);
      glow.addColorStop(0, "rgba(110, 245, 255, 0.35)");
      glow.addColorStop(1, "rgba(110, 245, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 40, y - 40, 80, 80);
      ctx.fillStyle = "rgba(125, 235, 255, 0.55)";
      ctx.beginPath();
      ctx.moveTo(x, y - 38);
      ctx.lineTo(x + 12, y);
      ctx.lineTo(x - 12, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawOverlayFX() {
  const vignette = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.2, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.85);
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(1, "rgba(38, 12, 6, 0.22)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  for (let y = 0; y < VIEW_H; y += 4) {
    ctx.fillRect(0, y, VIEW_W, 1);
  }
}

function render() {
  drawSky();
  drawAtmosphereFX();
  drawWorld();
  drawCoins();
  drawJumpCrystals();
  drawHearts();
  drawShields();
  drawStars();
  drawEnemies();
  drawFlyers();
  drawPlayer();
  drawParticles();
  drawForegroundDecor();
  drawOverlayFX();

  if (paused && running) {
    ctx.fillStyle = "rgba(21, 10, 5, 0.55)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = "#fff0cf";
    ctx.font = "900 52px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PAUSE", VIEW_W / 2, VIEW_H / 2);
  }
}

function startGame() {
  if (gameOver || gameComplete) {
    levelIndex = selectedLevelIndex;
    resetGame(true, false);
  } else if (levelComplete) {
    levelIndex = Math.min(levelIndex + 1, LEVELS.length - 1);
    selectedLevelIndex = levelIndex;
    resetGame(false);
  } else if (!running) {
    levelIndex = selectedLevelIndex;
    resetGame(true, false);
  }

  running = true;
  paused = false;
  audio.start();
  updateMiniGui();
  hideOverlay();
  lastTime = performance.now();
  audio.sfx("level");

  if (!rafId) {
    rafId = requestAnimationFrame(tick);
  }
}

function restartCurrentLevel() {
  selectedLevelIndex = levelIndex;
  resetGame(true, false);
  startGame();
}

function changeGuiLevel(delta) {
  const nextLevel = clamp(levelIndex + delta, 0, LEVELS.length - 1);
  if (nextLevel === levelIndex) return;
  selectedLevelIndex = nextLevel;
  levelIndex = nextLevel;
  resetGame(true, false);
  updateLevelSelect();
  startGame();
}

async function toggleFullscreen() {
  if (!gameCard || !document.fullscreenEnabled) {
    return;
  }

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await gameCard.requestFullscreen();
    }
  } catch (error) {
    console.warn("Fullscreen failed", error);
  } finally {
    fitGameToScreen();
    updateMiniGui();
  }
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "Enter"].includes(event.code)) {
    event.preventDefault();
  }

  if (!running && ["Enter", "Space"].includes(event.code)) {
    startGame();
    return;
  }

  if (!running && /^Digit[1-9]$/.test(event.code)) {
    const nextLevel = Number(event.code.slice(5)) - 1;
    if (nextLevel >= 0 && nextLevel < LEVELS.length) {
      selectedLevelIndex = nextLevel;
      levelIndex = nextLevel;
      resetGame(true, false);
      updateLevelSelect();
      render();
    }
    return;
  }

  if (!keys.has(event.code) && ["Space", "ArrowUp", "KeyW"].includes(event.code)) {
    input.jumpPressed = true;
  }

  if (!keys.has(event.code) && ["ShiftLeft", "ShiftRight", "KeyX"].includes(event.code)) {
    input.dashPressed = true;
  }

  keys.add(event.code);

  if (event.code === "KeyP" && running) {
    paused = !paused;
    updateMiniGui();
  }

  if (event.code === "KeyR") {
    restartCurrentLevel();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

for (const button of document.querySelectorAll("[data-action]")) {
  const action = button.dataset.action;

  const press = (event) => {
    event.preventDefault();
    if (event.currentTarget.setPointerCapture && event.pointerId !== undefined) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (action === "jump" && !touchActions.get("jump")) {
      input.jumpPressed = true;
    }
    if (action === "dash" && !touchActions.get("dash")) {
      input.dashPressed = true;
    }
    touchActions.set(action, true);
  };

  const release = (event) => {
    event.preventDefault();
    if (event.currentTarget.releasePointerCapture && event.pointerId !== undefined) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer may already be released after a cancel/leave.
      }
    }
    touchActions.set(action, false);
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
}

startButton.addEventListener("click", startGame);

if (guiPause) {
  guiPause.addEventListener("click", () => {
    if (!running) {
      startGame();
      return;
    }
    paused = !paused;
    updateMiniGui();
    render();
  });
}

if (guiRestart) {
  guiRestart.addEventListener("click", restartCurrentLevel);
}

if (guiPrev) {
  guiPrev.addEventListener("click", () => changeGuiLevel(-1));
}

if (guiNext) {
  guiNext.addEventListener("click", () => changeGuiLevel(1));
}

if (guiBg) {
  guiBg.addEventListener("click", () => {
    backgroundMapEnabled = !backgroundMapEnabled;
    updateMiniGui();
    render();
  });
}

if (guiFullscreen) {
  guiFullscreen.addEventListener("click", toggleFullscreen);
}

window.addEventListener("resize", fitGameToScreen);
document.addEventListener("fullscreenchange", () => {
  fitGameToScreen();
  updateMiniGui();
});

if (stageWrap && "ResizeObserver" in window) {
  new window.ResizeObserver(fitGameToScreen).observe(stageWrap);
}

resetGame(true);
makeClouds();
fitGameToScreen();
updateLevelSelect();
render();
