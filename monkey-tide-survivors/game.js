"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { alpha: false });

const ui = {
  startOverlay: document.getElementById("startOverlay"),
  upgradeOverlay: document.getElementById("upgradeOverlay"),
  endOverlay: document.getElementById("endOverlay"),
  hud: document.getElementById("hud"),
  loadout: document.getElementById("loadout"),
  skinPicker: document.getElementById("skinPicker"),
  mapPicker: document.getElementById("mapPicker"),
  metaProgress: document.getElementById("metaProgress"),
  cornerControls: document.getElementById("cornerControls"),
  touchControls: document.getElementById("touchControls"),
  startButton: document.getElementById("startButton"),
  quickButton: document.getElementById("quickButton"),
  restartButton: document.getElementById("restartButton"),
  pauseButton: document.getElementById("pauseButton"),
  audioButton: document.getElementById("audioButton"),
  fullscreenButton: document.getElementById("fullscreenButton"),
  dashButton: document.getElementById("dashButton"),
  stickBase: document.getElementById("stickBase"),
  stickKnob: document.getElementById("stickKnob"),
  hpBar: document.getElementById("hpBar"),
  hpText: document.getElementById("hpText"),
  xpBar: document.getElementById("xpBar"),
  timeText: document.getElementById("timeText"),
  levelText: document.getElementById("levelText"),
  coinText: document.getElementById("coinText"),
  upgradeChoices: document.getElementById("upgradeChoices"),
  loadingText: document.getElementById("loadingText"),
  loadingBar: document.getElementById("loadingBar"),
  endTitle: document.getElementById("endTitle"),
  endEyebrow: document.getElementById("endEyebrow"),
  endStats: document.getElementById("endStats"),
};

const imageSources = {
  repeatBeach: "assets/backgrounds/topdown_beach_repeatable_hd.png",
  mapMoonlitLagoon: "assets/backgrounds/map_moonlit_lagoon_hd.jpg",
  mapGothicCove: "assets/backgrounds/map_gothic_cove_hd.jpg",
  mapTreasureAtoll: "assets/backgrounds/map_treasure_atoll_hd.jpg",
  characters: "assets/sprites/characters_imagen_hd_sheet.webp",
  playerSkins: "assets/sprites/player_skins_imagen_hd.webp",
  playerSkinWalks: "assets/sprites/player_skin_walkcycles_imagen_hd.webp?v=starfarmboy-clean",
  playerSkinSelect: "assets/sprites/player_skin_select_imagen_hd.webp",
  items: "assets/sprites/scene_items_imagen_hd_sheet.webp",
  newSprites: "assets/sprites/new_sprites_imagen_hd.webp",
  gothicEnemies: "assets/sprites/gothic_enemies_hd_sheet.webp",
  gothicItems: "assets/sprites/gothic_items_hd_sheet.webp",
  gothicProps: "assets/sprites/gothic_props_hd_sheet.webp",
  spectralCaptain: "assets/sprites/spectral_captain_hd_sheet.webp",
  beachClearPuddle: "assets/sprites/beach-props-v2/clear_puddle.webp",
  beachTidePuddle: "assets/sprites/beach-props-v2/tide_puddle.webp",
  beachHedgeCluster: "assets/sprites/beach-props-v2/hedge_cluster.webp",
  beachPalmHedge: "assets/sprites/beach-props-v2/palm_hedge.webp",
  beachTreasure: "assets/sprites/beach-props-v2/buried_treasure.webp",
  beachConchShrine: "assets/sprites/beach-props-v2/conch_shrine.webp",
  beachHut: "assets/sprites/beach-props-v2/beach_hut.webp",
  beachBoatWreck: "assets/sprites/beach-props-v2/boat_wreck.webp",
  projectileFx: "assets/sprites/projectile_fx_imagen_hd.webp",
  playerEffects: "assets/sprites/player_effects_imagen_hd.webp",
  extraEnemies: "assets/sprites/extra_enemies_imagen_hd.webp",
  extraItems: "assets/sprites/extra_items_imagen_hd.webp",
};

const audioSources = {
  bgmMain: "assets/audio/bgm/crimson-galleon.mp3",
  bgmRush: "assets/audio/bgm/gargoyle-chapel-run.mp3",
  bgmCaper: "assets/audio/bgm/coconut-caper-loop.mp3",
  bgmShoreline: "assets/audio/bgm/shoreline-rum-riddle.mp3",
  pickup: "assets/audio/sfx/from-downloads/pickup-gem.mp3",
  chime: "assets/audio/sfx/from-downloads/soft-chime.mp3",
  gate: "assets/audio/sfx/from-downloads/curse-gate.mp3",
  confirm: "assets/audio/sfx/from-downloads/ui-confirm.mp3",
  downloadPickup: "assets/audio/sfx/from-downloads/coin-pickup.mp3",
  downloadDash: "assets/audio/sfx/from-downloads/dash-swish.mp3",
  downloadHit: "assets/audio/sfx/from-downloads/cursed-hit.mp3",
  downloadUpgrade: "assets/audio/sfx/from-downloads/upgrade-card.mp3",
  downloadBossWarning: "assets/audio/sfx/from-downloads/boss-warning.mp3",
  downloadBossDown: "assets/audio/sfx/from-downloads/boss-down.mp3",
};

const images = {};
const soundPools = {};
const soundLastPlayed = new Map();
const soundConfig = {
  pickup: { volume: 0.018, cooldown: 300 },
  chime: { volume: 0.026, cooldown: 620 },
  gate: { volume: 0.018, cooldown: 760 },
  confirm: { volume: 0.024, cooldown: 380 },
  downloadPickup: { volume: 0.012, cooldown: 420 },
  downloadDash: { volume: 0.018, cooldown: 560 },
  downloadHit: { volume: 0.022, cooldown: 980 },
  downloadUpgrade: { volume: 0.032, cooldown: 900 },
  downloadBossWarning: { volume: 0.045, cooldown: 45000 },
  downloadBossDown: { volume: 0.048, cooldown: 2800 },
};
const musicConfig = {
  main: 0.62,
  mainRushDuck: 0.1,
  rush: 0.5,
  rushStart: 112,
  rushFade: 74,
};
let music = null;
let rushMusic = null;
let activeMusicTrack = null;
let musicTrackKeys = { main: null, rush: null };
let muted = false;
const speechState = {
  supported: typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
  voice: null,
  lastSaid: new Map(),
};
let ready = false;
let dpr = 1;
let viewW = 1280;
let viewH = 720;
const scene = { zoom: 1, w: 1280, h: 720 };
let lastTime = 0;
let raf = 0;
let quickMode = false;
const loadingState = { loaded: 0, total: 0, last: "" };

const CHAR = { w: 192, h: 256, cols: 16 };
const PLAYER_SKIN = { w: 512, h: 512, cols: 3, rows: 2 };
const PLAYER_SKIN_WALK = { w: 256, h: 256, cols: 8, rows: 6 };
const PLAYER_SKIN_SELECT = { w: 256, h: 256, cols: 7 };
const ITEM = { w: 512, h: 512, cols: 4 };
const NEWSPRITE = { w: 384, h: 512, cols: 4, rows: 2 };
const GOTHIC_ENEMY = { w: 128, h: 176, cols: 4 };
const GOTHIC_ITEM = { w: 128, h: 128, cols: 4, rows: 3 };
const GOTHIC_PROP = { w: 256, h: 256, cols: 4, rows: 2 };
const SPECTRAL_CAPTAIN = { w: 384, h: 512, cols: 4 };
const PROJECTILE_FX = { w: 400, h: 400, cols: 4, rows: 2 };
const PLAYER_EFFECT_FX = { w: 512, h: 512, cols: 4, rows: 2 };
const EXTRA_ENEMY = { w: 512, h: 512, cols: 4, rows: 2 };
const EXTRA_ITEM = { w: 512, h: 512, cols: 4, rows: 2 };
const WORLD = { w: 6400, h: 6400 };
const TARGET_TIME = 330;
const BALANCE = {
  normalSpawnIntensity: 1.12,
  quickSpawnIntensity: 1.36,
  enemyHpGrowth: 345,
  enemySpeedGrowth: 960,
  bossHpMult: 2.5,
  firstBossAt: 184,
  bossInterval: 78,
  rangedPressureAt: 88,
};

const playerSkinMap = {
  default: { name: "Kaeptnin", sheet: "characters", w: 104, h: 138 },
  islandPirate: { name: "Insel-Pirat", sheet: "playerSkins", x: 109, y: 22, w: 323, h: 478, drawH: 142, animH: 170, animRow: 0, cellX: 0, cellY: 0 },
  curseMonkey: { name: "Fluchaffe", sheet: "playerSkins", x: 613, y: 112, w: 411, h: 369, drawH: 118, animH: 162, animRow: 1, cellX: 1, cellY: 0 },
  dhampirHunter: { name: "Dhampir-Jaeger", sheet: "playerSkins", x: 1024, y: 28, w: 294, h: 484, drawH: 150, animH: 176, animRow: 2, cellX: 2, cellY: 0 },
  rumCorsair: { name: "Rum-Korsar", sheet: "playerSkins", x: 58, y: 513, w: 413, h: 494, drawH: 150, animH: 178, animRow: 3, cellX: 0, cellY: 1 },
  starFarmboy: { name: "Sternenfarmboy", sheet: "playerSkins", x: 543, y: 514, w: 375, h: 486, drawH: 142, animH: 168, animRow: 4, cellX: 1, cellY: 1 },
  freelanceDuo: { name: "Freelance-Duo", sheet: "playerSkins", x: 1054, y: 512, w: 319, h: 485, drawH: 140, animH: 176, animRow: 5, cellX: 2, cellY: 1 },
};
const playerSkinIds = Object.keys(playerSkinMap);
let selectedSkin = (() => {
  try {
    const stored = window.localStorage?.getItem("monkeyTidePlayerSkin");
    return playerSkinMap[stored] ? stored : "default";
  } catch {
    return "default";
  }
})();

const mapVariants = [
  {
    id: "shipwreckBeach",
    name: "Wrackstrand",
    desc: "Ausgewogen",
    tint: "rgba(255, 222, 142, 0.08)",
    detail: "beach",
    background: "repeatBeach",
    music: { main: "bgmMain", rush: "bgmRush", mainVolume: 0.62, rushVolume: 0.5, rushStart: 112 },
    unlockedByDefault: true,
    propBoost: ["boatWreck", "buriedTreasure", "palmHedge"],
    blockerIcons: ["palmHedge", "hedgeCluster", "boatWreck", "beachHut"],
    blockerDensity: 5,
  },
  {
    id: "moonlitLagoon",
    name: "Mondlagune",
    desc: "Mehr Sog",
    tint: "rgba(83, 255, 229, 0.12)",
    detail: "lagoon",
    background: "mapMoonlitLagoon",
    music: { main: "bgmShoreline", rush: "bgmCaper", mainVolume: 0.6, rushVolume: 0.54, rushStart: 96 },
    unlockedByDefault: true,
    propBoost: ["clearPuddle", "tidePuddle", "conchShrine"],
    blockerIcons: ["palmHedge", "hedgeCluster", "conchShrine"],
    blockerDensity: 6,
  },
  {
    id: "gothicCove",
    name: "Blutbucht",
    desc: "Gothic-Druck",
    tint: "rgba(116, 70, 180, 0.16)",
    detail: "gothic",
    background: "mapGothicCove",
    music: { main: "bgmRush", rush: "bgmMain", mainVolume: 0.56, rushVolume: 0.58, rushStart: 78 },
    achievement: "nightRaid",
    propBoost: ["gothicCandelabra", "wallCandle", "bloodRose", "hedgeCluster", "palmHedge"],
    blockerIcons: ["hedgeCluster", "palmHedge", "boatWreck", "beachHut"],
    blockerDensity: 7,
    enemyFavor: ["cryptBat", "boneCorsair", "gargoyle", "lanternWraith"],
  },
  {
    id: "treasureAtoll",
    name: "Schatzatoll",
    desc: "Mehr Verstecke",
    tint: "rgba(240, 196, 93, 0.13)",
    detail: "treasure",
    background: "mapTreasureAtoll",
    music: { main: "bgmCaper", rush: "bgmShoreline", mainVolume: 0.62, rushVolume: 0.52, rushStart: 104 },
    achievement: "wreckDiver",
    propBoost: ["buriedTreasure", "beachHut", "boatWreck", "treasureChest", "palmHedge", "hedgeCluster"],
    blockerIcons: ["palmHedge", "hedgeCluster", "beachHut", "boatWreck"],
    blockerDensity: 7,
  },
];

const achievementDefinitions = [
  { id: "firstBlood", name: "Erster Fluch", desc: "40 Gegner insgesamt", field: "kills", target: 40, unlockRelic: "Flutkompass" },
  { id: "powerCollector", name: "Reliktlaeufer", desc: "3 Power-ups sammeln", field: "powerups", target: 3, unlockRelic: "Grog-Stiefel" },
  { id: "wreckDiver", name: "Wracktaucher", desc: "4 Orte erkunden", field: "landmarks", target: 4, unlockMap: "treasureAtoll" },
  { id: "nightRaid", name: "Nachtkaperfahrt", desc: "150 Sekunden ueberleben", field: "bestSurvival", target: 150, unlockMap: "gothicCove" },
  { id: "streakCarver", name: "Streak-Saebel", desc: "12er Streak schaffen", field: "bestStreak", target: 12, unlockRelic: "Saebelkerbe" },
];

const powerUpTypes = [
  { id: "rumRush", name: "Grog-Tempo", icon: "grogLantern", duration: 10, speed: 1.22, color: "#f0c45d" },
  { id: "blackPowder", name: "Pulverfieber", icon: "powderPouch", duration: 9, damage: 1.2, color: "#ffb14c" },
  { id: "pearlMagnet", name: "Flutmagnet", icon: "cursedPearl", duration: 12, magnet: 130, color: "#53ffe5" },
  { id: "voodooWard", name: "Voodoo-Schutz", icon: "voodooDoll", duration: 8, armor: 2, color: "#d07cff" },
];
const powerupDropTuning = {
  randomDropChance: 0.004,
  streakDropEvery: 40,
  combatCooldown: 42,
  chestChance: 0.16,
  cacheChance: 0.22,
  magnetRange: 84,
  life: 18,
};

let metaProgress = loadMetaProgress();
let selectedMap = normalizeSelectedMap(readStoredValue("monkeyTideMap", "shipwreckBeach"));

const iconMap = {
  rope: { x: 0, y: 0 },
  coin: { x: 1, y: 0 },
  lime: { x: 2, y: 0 },
  key: { x: 3, y: 0 },
  map: { x: 0, y: 1 },
  compass: { x: 1, y: 1 },
  bottle: { x: 2, y: 1 },
  telescope: { x: 3, y: 1 },
};

const newSpriteMap = {
  monkeyIdol: { x: 0, y: 0 },
  crab: { x: 1, y: 0 },
  banana: { x: 2, y: 0 },
  skullCoin: { x: 3, y: 0 },
  voodooBurst: { x: 0, y: 1 },
  rumBomb: { x: 1, y: 1 },
  seaHand: { x: 2, y: 1 },
  speedCharm: { x: 3, y: 1 },
};

const gothicItemMap = {
  gothicBoots: { x: 0, y: 0 },
  moonSlash: { x: 1, y: 0 },
  moonSigil: { x: 2, y: 0 },
  bloodRose: { x: 3, y: 0 },
  cryptBatRelic: { x: 0, y: 1 },
  rubyRing: { x: 1, y: 1 },
  nightCloak: { x: 2, y: 1 },
  gothicArmor: { x: 3, y: 1 },
  gothicAxe: { x: 1, y: 2 },
  blueVial: { x: 2, y: 2 },
  rubyHeart: { x: 3, y: 2 },
};

const gothicPropMap = {
  gothicCandelabra: { x: 0, y: 0 },
  wallCandle: { x: 0, y: 1 },
};

const extraItemMap = {
  cursedPearl: { x: 0, y: 0 },
  powderPouch: { x: 1, y: 0 },
  monkeyPaw: { x: 2, y: 0 },
  captainSeal: { x: 3, y: 0 },
  tideBoots: { x: 0, y: 1 },
  voodooDoll: { x: 1, y: 1 },
  obsidianCompass: { x: 2, y: 1 },
  grogLantern: { x: 3, y: 1 },
};

const extraEnemyMap = {
  reefRaider: { x: 0, y: 0 },
  powderImp: { x: 1, y: 0 },
  tideWitch: { x: 2, y: 0 },
  saltboneFencer: { x: 3, y: 0 },
  lanternWraith: { x: 0, y: 1 },
  coralBrute: { x: 1, y: 1 },
  barrelMaw: { x: 2, y: 1 },
  stormDuelist: { x: 3, y: 1 },
};

const blockingPropShapes = {
  hedgeCluster: { rx: 145, ry: 62, oy: 8 },
  palmHedge: { rx: 136, ry: 52, oy: 4 },
  beachHut: { rx: 142, ry: 86, oy: 28 },
  boatWreck: { rx: 154, ry: 70, oy: 22 },
  conchShrine: { rx: 58, ry: 76, oy: 18 },
};

const beachPropMap = {
  clearPuddle: { image: "beachClearPuddle", w: 420, h: 304, decal: true },
  tidePuddle: { image: "beachTidePuddle", w: 410, h: 318, decal: true },
  hedgeCluster: { image: "beachHedgeCluster", w: 421, h: 299 },
  palmHedge: { image: "beachPalmHedge", w: 385, h: 239 },
  treasureChest: { image: "beachTreasure", w: 340, h: 280, interactive: true },
  openTreasureChest: { image: "beachTreasure", w: 340, h: 280, interactive: true },
  buriedTreasure: { image: "beachTreasure", w: 340, h: 280, interactive: true },
  conchShrine: { image: "beachConchShrine", w: 300, h: 326, interactive: true },
  beachHut: { image: "beachHut", w: 425, h: 350, interactive: true },
  boatWreck: { image: "beachBoatWreck", w: 362, h: 286, interactive: true },
};

const projectileFxMap = {
  cutlassSlash: { x: 0, y: 0 },
  coconutBoomerang: { x: 1, y: 0 },
  rumBombFx: { x: 2, y: 0 },
  compassBolt: { x: 3, y: 0 },
  ropeRing: { x: 0, y: 1 },
  bloodRoseBurst: { x: 1, y: 1 },
  ghostCannonball: { x: 2, y: 1 },
  monkeyCurseOrb: { x: 3, y: 1 },
};

const playerEffectMap = {
  ropeAura: { x: 0, y: 0 },
  rumShockwave: { x: 1, y: 0 },
  curseBurst: { x: 2, y: 0 },
  compassBeam: { x: 3, y: 0 },
  treasureGlint: { x: 0, y: 1 },
  cutlassAfterglow: { x: 1, y: 1 },
  tidePulse: { x: 2, y: 1 },
  chestReward: { x: 3, y: 1 },
};

const enemyTypes = [
  { id: "deckhand", name: "Deckhand Echo", row: 7, hp: 20, speed: 78, radius: 22, damage: 5, scale: 0.44, xp: 5, tint: "#f0c45d" },
  { id: "crab", name: "Coconut Crab", sprite: "crab", hp: 25, speed: 112, radius: 20, damage: 5, scale: 0.18, xp: 6, tint: "#ff8b46" },
  { id: "cryptBat", name: "Crypt Bat", gothicRow: 2, hp: 23, speed: 136, radius: 20, damage: 6, scale: 0.44, xp: 7, tint: "#9f6cff", flying: true },
  { id: "boneCorsair", name: "Bone Corsair", gothicRow: 1, hp: 46, speed: 68, radius: 24, damage: 9, scale: 0.48, xp: 12, tint: "#d8e3b0" },
  { id: "gargoyle", name: "Moon Gargoyle", gothicRow: 7, hp: 96, speed: 64, radius: 34, damage: 15, scale: 0.56, xp: 21, tint: "#8bd7b4", flying: true },
  { id: "cook", name: "Grog Cook", row: 8, hp: 39, speed: 60, radius: 26, damage: 8, scale: 0.45, xp: 9, tint: "#ff765f" },
  { id: "hand", name: "Seafoam Hand", sprite: "seaHand", hp: 50, speed: 82, radius: 25, damage: 10, scale: 0.18, xp: 11, tint: "#79e0d8" },
  { id: "powderImp", name: "Powder Imp", extraSprite: "powderImp", hp: 34, speed: 112, radius: 21, damage: 8, scale: 0.22, xp: 9, tint: "#ffb14c" },
  { id: "reefRaider", name: "Reef Raider", extraSprite: "reefRaider", hp: 78, speed: 66, radius: 30, damage: 13, scale: 0.27, xp: 17, tint: "#7ce0a7" },
  { id: "saltboneFencer", name: "Saltbone Fencer", extraSprite: "saltboneFencer", hp: 58, speed: 86, radius: 25, damage: 12, scale: 0.26, xp: 15, tint: "#f2dca0" },
  { id: "lanternWraith", name: "Lantern Wraith", extraSprite: "lanternWraith", hp: 44, speed: 96, radius: 25, damage: 11, scale: 0.27, xp: 14, tint: "#53ffe5", phase: true },
  { id: "oracle", name: "Shell Oracle", row: 9, hp: 62, speed: 51, radius: 28, damage: 12, scale: 0.47, xp: 15, tint: "#79e0b7" },
  { id: "tideWitch", name: "Tide Witch", extraSprite: "tideWitch", hp: 88, speed: 54, radius: 30, damage: 16, scale: 0.29, xp: 23, tint: "#77e6cf" },
  { id: "barrelMaw", name: "Barrel Maw", extraSprite: "barrelMaw", hp: 110, speed: 58, radius: 32, damage: 16, scale: 0.26, xp: 25, tint: "#f0a04d" },
  { id: "stormDuelist", name: "Storm Duelist", extraSprite: "stormDuelist", hp: 118, speed: 74, radius: 31, damage: 18, scale: 0.29, xp: 31, tint: "#5ccdf5" },
  { id: "coralBrute", name: "Coral Brute", extraSprite: "coralBrute", hp: 176, speed: 45, radius: 43, damage: 20, scale: 0.33, xp: 40, tint: "#8bd78f", bossCandidate: true },
  { id: "idol", name: "Monkey Idol", sprite: "monkeyIdol", hp: 230, speed: 40, radius: 46, damage: 18, scale: 0.24, xp: 46, tint: "#d07cff" },
  { id: "spectralCaptain", name: "Fluchkapitaen", captainSheet: true, hp: 292, speed: 52, radius: 50, damage: 20, scale: 0.52, xp: 56, tint: "#53ffe5", phase: true },
];

const upgrades = [
  {
    id: "cutlass",
    name: "Geistersaebel",
    icon: "key",
    desc: "Breitere Hiebe und mehr Schaden.",
    max: 7,
    apply: () => raiseWeapon("cutlass"),
  },
  {
    id: "coconut",
    name: "Kokos-Bumerang",
    icon: "coconutBoomerang",
    desc: "Wirft springende Kokoskerne.",
    max: 7,
    apply: () => raiseWeapon("coconut"),
  },
  {
    id: "compass",
    name: "Sternkompass",
    icon: "compass",
    desc: "Kreist um dich und schneidet durch Flüche.",
    max: 6,
    apply: () => raiseWeapon("compass"),
  },
  {
    id: "bottle",
    name: "Flaschenpost-Bombe",
    icon: "rumBomb",
    desc: "Explodiert bei der dichtesten Geistercrew.",
    max: 6,
    apply: () => raiseWeapon("bottle"),
  },
  {
    id: "rope",
    name: "Tauer-Ring",
    icon: "ropeRing",
    desc: "Ein rotierender Schutzkreis aus Tauwerk.",
    max: 5,
    apply: () => raiseWeapon("rope"),
  },
  {
    id: "bloodRose",
    name: "Blutrosenpakt",
    icon: "bloodRose",
    desc: "Mehr Schaden, etwas Ruestung und Schlossfluch.",
    max: 4,
    apply: () => {
      state.stats.damage += 0.08;
      state.stats.armor += 1;
    },
  },
  {
    id: "cursedPearl",
    name: "Flutperle",
    icon: "cursedPearl",
    desc: "Mehr Magnet und bessere XP-Beute.",
    max: 4,
    apply: () => {
      state.stats.magnet += 30;
      state.stats.pickupValue += 0.08;
    },
  },
  {
    id: "powderPouch",
    name: "Schwarzpulverbeutel",
    icon: "powderPouch",
    desc: "Staerkere Bomben und etwas mehr Schaden.",
    max: 4,
    apply: () => {
      raiseWeapon("bottle");
      state.stats.damage += 0.035;
    },
  },
  {
    id: "monkeyPaw",
    name: "Affenpfote",
    icon: "monkeyPaw",
    desc: "Mehr Schaden und groessere Beute.",
    max: 3,
    apply: () => {
      state.stats.damage += 0.075;
      state.stats.pickupValue += 0.04;
    },
  },
  {
    id: "captainSeal",
    name: "Kaeptninsiegel",
    icon: "captainSeal",
    desc: "Mehr Ruestung und Lebenspunkte.",
    max: 3,
    apply: () => {
      state.stats.armor += 1;
      state.player.maxHp += 14;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 20);
    },
  },
  {
    id: "tideBoots",
    name: "Flutstiefel",
    icon: "tideBoots",
    desc: "Schneller laufen, Dash flotter bereit.",
    max: 4,
    apply: () => {
      state.stats.speed += 16;
      state.stats.dashCooldown = Math.max(0.5, state.stats.dashCooldown - 0.06);
    },
  },
  {
    id: "voodooDoll",
    name: "Voodoo-Puppe",
    icon: "voodooDoll",
    desc: "Schutzfenster und Fluchschaden.",
    max: 3,
    apply: () => {
      state.player.invuln = Math.max(state.player.invuln, 1.1);
      state.stats.damage += 0.045;
    },
  },
  {
    id: "obsidianCompass",
    name: "Obsidian-Kompass",
    icon: "obsidianCompass",
    desc: "Kompasskraft und Magnetzug.",
    max: 4,
    apply: () => {
      raiseWeapon("compass");
      state.stats.magnet += 18;
    },
  },
  {
    id: "grogLantern",
    name: "Grog-Laterne",
    icon: "grogLantern",
    desc: "Mehr Leben und Ruestung im Gedraenge.",
    max: 3,
    apply: () => {
      state.stats.armor += 1;
      state.player.maxHp += 10;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 26);
    },
  },
  {
    id: "speed",
    name: "Palmwedel-Trick",
    icon: "speedCharm",
    desc: "Mehr Bewegung und kuerzerer Dash.",
    max: 5,
    apply: () => {
      state.stats.speed += 24;
      state.stats.dashCooldown = Math.max(0.58, state.stats.dashCooldown - 0.1);
    },
  },
  {
    id: "magnet",
    name: "Totenkopf-Dublone",
    icon: "skullCoin",
    desc: "Zieht Erfahrung und Dublonen schneller an.",
    max: 5,
    apply: () => {
      state.stats.magnet += 42;
      state.stats.pickupValue += 0.1;
    },
  },
  {
    id: "heart",
    name: "Limettenvorrat",
    icon: "lime",
    desc: "Mehr Lebenspunkte und sofortige Heilung.",
    max: 4,
    apply: () => {
      state.player.maxHp += 22;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 44);
    },
  },
];

const weaponLoadoutItems = [
  ["cutlass", "Saebel", "key"],
  ["coconut", "Kokos", "coconutBoomerang"],
  ["compass", "Kompass", "compass"],
  ["bottle", "Bombe", "bottle"],
  ["rope", "Tau", "ropeRing"],
];

function readStoredValue(key, fallback) {
  try {
    return window.localStorage?.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function defaultMetaProgress() {
  return {
    kills: 0,
    coins: 0,
    landmarks: 0,
    powerups: 0,
    runs: 0,
    wins: 0,
    bestLevel: 1,
    bestStreak: 0,
    bestSurvival: 0,
    achievements: {},
    unlockedMaps: mapVariants.filter((map) => map.unlockedByDefault).map((map) => map.id),
    unlockedRelics: [],
  };
}

function loadMetaProgress() {
  const base = defaultMetaProgress();
  try {
    const raw = window.localStorage?.getItem("monkeyTideProgress");
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    return normalizeMetaProgress({ ...base, ...parsed });
  } catch {
    return base;
  }
}

function normalizeMetaProgress(progress) {
  const base = defaultMetaProgress();
  const normalized = { ...base, ...progress };
  normalized.achievements = { ...(progress.achievements || {}) };
  normalized.unlockedRelics = [...new Set([...(progress.unlockedRelics || [])])];
  normalized.unlockedMaps = [...new Set([...base.unlockedMaps, ...(progress.unlockedMaps || [])])]
    .filter((id) => mapVariants.some((map) => map.id === id));
  return normalized;
}

function saveMetaProgress() {
  try {
    window.localStorage?.setItem("monkeyTideProgress", JSON.stringify(metaProgress));
  } catch {}
}

function mapVariant(id = selectedMap) {
  return mapVariants.find((map) => map.id === id) || mapVariants[0];
}

function mapUnlocked(id) {
  return metaProgress.unlockedMaps.includes(id);
}

function normalizeSelectedMap(id) {
  const fallback = mapVariants[0].id;
  return mapUnlocked(id) ? id : fallback;
}

function metaRelicBonuses() {
  const relics = new Set(metaProgress.unlockedRelics || []);
  return {
    magnet: relics.has("Flutkompass") ? 28 : 0,
    speed: relics.has("Grog-Stiefel") ? 12 : 0,
    damage: relics.has("Saebelkerbe") ? 0.04 : 0,
    armor: 0,
  };
}

let state = null;
const keys = new Set();
const pointer = { active: false, id: null, dx: 0, dy: 0, originX: 0, originY: 0, radius: 48 };
let activeUpgradeChoices = [];
let selectedUpgradeIndex = 0;

function makeState() {
  const relicBonus = metaRelicBonuses();
  return {
    phase: "menu",
    map: selectedMap,
    elapsed: 0,
    spawnTimer: 0,
    bossTimer: 0,
    bossCount: 0,
    warningTimer: 0,
    wave: 1,
    killCount: 0,
    streak: { count: 0, timer: 0, best: 0, nextCache: 18, caches: 0 },
    runStats: { landmarks: 0, powerups: 0, flowRewards: 0, unlocked: [] },
    powerupDropCooldown: 0,
    coins: 0,
    level: 1,
    xp: 0,
    nextXp: 22,
    camera: { x: WORLD.w / 2, y: WORLD.h / 2 },
    player: {
      x: WORLD.w / 2,
      y: WORLD.h / 2,
      r: 24,
      hp: 150,
      maxHp: 150,
      invuln: 0,
      dash: 0,
      dashCooldown: 0,
      facing: 1,
      moveX: 0,
      moveY: 0,
      skin: selectedSkin,
    },
    stats: {
      speed: 258 + relicBonus.speed,
      damage: 1.12 + relicBonus.damage,
      armor: 2 + relicBonus.armor,
      magnet: 280 + relicBonus.magnet,
      pickupValue: 1.12,
      dashCooldown: 0.68,
    },
    weapons: {
      cutlass: { level: 1, timer: 0 },
      coconut: { level: 1, timer: 0 },
      compass: { level: 0, timer: 0, angle: 0, hits: new Map() },
      bottle: { level: 0, timer: 0 },
      rope: { level: 0, angle: 0, tick: 0 },
    },
    upgradeCounts: {
      cutlass: 1,
      coconut: 1,
      compass: 0,
      bottle: 0,
      rope: 0,
      bloodRose: 0,
      cursedPearl: 0,
      powderPouch: 0,
      monkeyPaw: 0,
      captainSeal: 0,
      tideBoots: 0,
      voodooDoll: 0,
      obsidianCompass: 0,
      grogLantern: 0,
      speed: 0,
      magnet: 0,
      heart: 0,
    },
    enemies: [],
    gems: [],
    projectiles: [],
    zones: [],
    particles: [],
    texts: [],
    powerups: [],
    props: makeProps(selectedMap),
    voice: {
      nextLowHpAt: 0,
      minuteMark: 0,
      finalWarned: false,
    },
  };
}

function makeProps(mapId = selectedMap) {
  const variant = mapVariant(mapId);
  const props = [];
  const choices = [
    "rope",
    "map",
    "compass",
    "rumBomb",
    "telescope",
    "skullCoin",
    "key",
    "speedCharm",
    "gothicCandelabra",
    "wallCandle",
    "cryptBatRelic",
    "bloodRose",
    "cursedPearl",
    "powderPouch",
    "monkeyPaw",
    "captainSeal",
    "tideBoots",
    "voodooDoll",
    "obsidianCompass",
    "grogLantern",
    "gothicArmor",
    "moonSigil",
    "hedgeCluster",
    "palmHedge",
    "buriedTreasure",
    "conchShrine",
    ...(variant.propBoost || []),
  ];
  for (let gx = 320; gx < WORLD.w - 320; gx += 520) {
    for (let gy = 320; gy < WORLD.h - 320; gy += 470) {
      const h = hash2(Math.floor(gx / 50), Math.floor(gy / 50));
      const detailBoost = variant.detail === "treasure" ? 5 : variant.detail === "lagoon" ? 4 : 3;
      if (h % 13 < detailBoost) {
        const icon = choices[h % choices.length];
        props.push({
          x: gx + ((h >> 4) % 240) - 120,
          y: gy + ((h >> 10) % 220) - 110,
          icon,
          scale: propScaleForIcon(icon, h),
          spin: ((h >> 8) % 100) / 100,
          interactive: beachPropMap[icon]?.interactive === true,
        });
      }
    }
  }
  const landmarks = ["beachHut", "boatWreck", "buriedTreasure", "conchShrine", ...(variant.propBoost || [])];
  for (let gx = 700; gx < WORLD.w - 520; gx += 1150) {
    for (let gy = 740; gy < WORLD.h - 520; gy += 1080) {
      const h = hash2(Math.floor(gx / 70), Math.floor(gy / 70));
      if (h % 9 < (variant.detail === "treasure" ? 5 : 3)) {
        const icon = landmarks[h % landmarks.length];
        props.push({
          x: gx + ((h >> 5) % 320) - 160,
          y: gy + ((h >> 12) % 280) - 140,
          icon,
          scale: propScaleForIcon(icon, h),
          spin: ((h >> 9) % 100) / 130,
          interactive: true,
        });
      }
    }
  }
  const blockerIcons = variant.blockerIcons || (variant.detail === "gothic"
    ? ["hedgeCluster", "palmHedge", "boatWreck", "beachHut"]
    : ["hedgeCluster", "palmHedge", "boatWreck", "beachHut"]);
  const blockerDensity = variant.blockerDensity ?? 5;
  const blockerStepX = variant.detail === "lagoon" ? 780 : variant.detail === "treasure" ? 820 : 880;
  const blockerStepY = variant.detail === "gothic" ? 720 : 780;
  for (let gx = 520; gx < WORLD.w - 520; gx += blockerStepX) {
    for (let gy = 560; gy < WORLD.h - 520; gy += blockerStepY) {
      const h = hash2(Math.floor(gx / 90), Math.floor(gy / 90));
      if (h % 11 >= blockerDensity) continue;
      if (Math.hypot(gx - WORLD.w / 2, gy - WORLD.h / 2) < 620) continue;
      const clusterSize = h % 5 === 0 || variant.detail === "treasure" ? 3 : 2;
      for (let i = 0; i < clusterSize; i += 1) {
        const icon = blockerIcons[(h + i * 3) % blockerIcons.length];
        const angle = ((h >> (i * 3 + 2)) % 628) / 100;
        const isHedge = icon === "hedgeCluster" || icon === "palmHedge";
        const spread = icon === "beachHut" || icon === "boatWreck" ? 82 : isHedge ? 152 : 118;
        const x = gx + Math.cos(angle) * spread + ((h >> (i + 6)) % 90) - 45;
        const y = gy + Math.sin(angle) * spread + ((h >> (i + 11)) % 80) - 40;
        props.push({
          x: clamp(x, 180, WORLD.w - 180),
          y: clamp(y, 180, WORLD.h - 180),
          icon,
          scale: propScaleForIcon(icon, h + i * 41) * (isHedge ? (variant.detail === "gothic" ? 1.24 : 1.18) : 1),
          spin: ((h >> (i + 8)) % 100) / 120,
          interactive: beachPropMap[icon]?.interactive === true,
          blocking: true,
        });
      }
    }
  }
  const anchorBlockers = variant.anchorBlockers || [
    { icon: "beachHut", x: 0.18, y: 0.24, spin: 0.09 },
    { icon: "boatWreck", x: 0.82, y: 0.76, spin: 0.18 },
  ];
  for (const anchor of anchorBlockers) {
    props.push({
      x: Math.round(WORLD.w * anchor.x),
      y: Math.round(WORLD.h * anchor.y),
      icon: anchor.icon,
      scale: propScaleForIcon(anchor.icon, Math.round(anchor.x * 1000 + anchor.y * 1000)),
      spin: anchor.spin || 0,
      interactive: beachPropMap[anchor.icon]?.interactive === true,
      blocking: true,
    });
  }
  return props;
}

function propScaleForIcon(icon, h = 0) {
  if (newSpriteMap[icon]) return 0.15 + (h % 5) * 0.012;
  if (gothicPropMap[icon]) return 0.17 + (h % 5) * 0.012;
  if (gothicItemMap[icon]) return 0.12 + (h % 5) * 0.012;
  if (extraItemMap[icon]) return 0.13 + (h % 5) * 0.012;
  if (icon === "beachHut" || icon === "boatWreck") return 0.78 + (h % 4) * 0.035;
  if (icon === "hedgeCluster" || icon === "palmHedge") return 0.58 + (h % 5) * 0.026;
  if (icon === "conchShrine") return 0.62 + (h % 4) * 0.026;
  if (icon === "treasureChest" || icon === "openTreasureChest" || icon === "buriedTreasure") return 0.62 + (h % 4) * 0.024;
  if (beachPropMap[icon]) return 0.58 + (h % 4) * 0.02;
  return 0.18 + (h % 5) * 0.014;
}

function setLoadingProgress(loaded, total, label = "") {
  loadingState.loaded = loaded;
  loadingState.total = total;
  loadingState.last = label;
  const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
  ui.loadingBar.style.width = `${percent}%`;
  ui.loadingText.textContent = loaded >= total ? "Bereit fuer die Flut" : `Lade ${loaded}/${total}`;
}

function loadImage(key, src, onLoaded) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      images[key] = img;
      onLoaded(key);
      resolve();
    };
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function prepareAudio() {
  for (const [key, src] of Object.entries(audioSources)) {
    if (key.startsWith("bgm")) continue;
    soundPools[key] = Array.from({ length: 5 }, () => {
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.volume = soundConfig[key]?.volume ?? 0.16;
      return audio;
    });
  }
  music = new Audio();
  music.loop = true;
  music.preload = "auto";
  music.volume = musicConfig.main;
  rushMusic = new Audio();
  rushMusic.loop = true;
  rushMusic.preload = "auto";
  rushMusic.volume = 0;
  musicTrackKeys = { main: null, rush: null };
  configureMusicForMap(selectedMap);
  activeMusicTrack = null;
}

function prepareSpeech() {
  if (!speechState.supported) return;
  selectSpeechVoice();
  try {
    window.speechSynthesis.onvoiceschanged = selectSpeechVoice;
  } catch {}
}

function selectSpeechVoice() {
  if (!speechState.supported) return;
  const voices = window.speechSynthesis.getVoices?.() || [];
  speechState.voice = voices.find((voice) => /^de[-_]?/i.test(voice.lang))
    || voices.find((voice) => /deutsch|german/i.test(`${voice.name} ${voice.lang}`))
    || voices.find((voice) => /^en[-_]?/i.test(voice.lang))
    || voices[0]
    || null;
}

async function boot() {
  state = makeState();
  resize();
  renderSkinPicker();
  renderMapPicker();
  renderMetaProgress();
  const entries = Object.entries(imageSources);
  let loadedImages = 0;
  setLoadingProgress(0, entries.length);
  await Promise.all(entries.map(([key, src]) => loadImage(key, src, (loadedKey) => {
    loadedImages += 1;
    setLoadingProgress(loadedImages, entries.length, loadedKey);
  })));
  prepareAudio();
  prepareSpeech();
  ready = true;
  window.__MONKEY_TIDE_READY = true;
  setLoadingProgress(entries.length, entries.length, "ready");
  ui.startButton.disabled = false;
  ui.quickButton.disabled = false;
  render();
}

function skinIconStyle(id) {
  const index = Math.max(0, playerSkinIds.indexOf(id));
  const x = index / Math.max(1, PLAYER_SKIN_SELECT.cols - 1) * 100;
  return `background-image:url('${imageSources.playerSkinSelect}');background-size:${PLAYER_SKIN_SELECT.cols * 100}% 100%;background-position:${x}% 100%;`;
}

function renderSkinPicker() {
  if (!ui.skinPicker) return;
  ui.skinPicker.innerHTML = playerSkinIds.map((id) => {
    const skin = playerSkinMap[id];
    const active = id === selectedSkin;
    return `
      <button class="skin-option${active ? " active" : ""}" type="button" data-skin="${id}" role="radio" aria-checked="${active}" title="${skin.name}">
        <span class="skin-icon" style="${skinIconStyle(id)}"></span>
        <span class="skin-name">${skin.name}</span>
      </button>
    `;
  }).join("");
}

function renderMapPicker() {
  if (!ui.mapPicker) return;
  selectedMap = normalizeSelectedMap(selectedMap);
  ui.mapPicker.innerHTML = mapVariants.map((map) => {
    const unlocked = mapUnlocked(map.id);
    const active = selectedMap === map.id;
    const unlock = map.achievement ? achievementDefinitions.find((achievement) => achievement.id === map.achievement) : null;
    const desc = unlocked ? map.desc : `Gesperrt: ${unlock?.name || "Fortschritt"}`;
    return `
      <button class="map-option ${active ? "active" : ""} ${unlocked ? "" : "locked"}" type="button" data-map="${map.id}" aria-checked="${active ? "true" : "false"}" ${unlocked ? "" : "disabled"}>
        <span class="map-name">${map.name}</span>
        <span class="map-desc">${desc}</span>
      </button>
    `;
  }).join("");
}

function renderMetaProgress() {
  if (!ui.metaProgress) return;
  const done = achievementDefinitions.filter((achievement) => metaProgress.achievements[achievement.id]).length;
  const relicText = metaProgress.unlockedRelics.length ? metaProgress.unlockedRelics.join(", ") : "keine";
  ui.metaProgress.innerHTML = `
    <span class="progress-chip"><strong>${done}/${achievementDefinitions.length}</strong> Achievements</span>
    <span class="progress-chip"><strong>${metaProgress.unlockedMaps.length}/${mapVariants.length}</strong> Karten</span>
    <span class="progress-chip"><strong>${metaProgress.bestStreak}</strong> Best-Streak</span>
    <span class="progress-chip"><strong>${relicText}</strong> Startrelikte</span>
  `;
}

function setSelectedMap(id) {
  if (!mapUnlocked(id)) return;
  selectedMap = id;
  try {
    window.localStorage?.setItem("monkeyTideMap", id);
  } catch {}
  renderMapPicker();
}

function setPlayerSkin(id) {
  if (!playerSkinMap[id]) return;
  selectedSkin = id;
  if (state?.player) state.player.skin = id;
  try {
    window.localStorage?.setItem("monkeyTidePlayerSkin", id);
  } catch {}
  renderSkinPicker();
  if (ready) playSound("confirm");
}

function playSound(key, options = {}) {
  if (muted || !soundPools[key]) return;
  const now = performance.now();
  const cooldown = options.cooldown ?? soundConfig[key]?.cooldown ?? 0;
  if (!options.force && now - (soundLastPlayed.get(key) || -Infinity) < cooldown) return;
  soundLastPlayed.set(key, now);
  const pool = soundPools[key];
  const clip = pool.find((a) => a.paused || a.ended) || pool[0];
  try {
    clip.currentTime = 0;
    clip.play().catch(() => {});
  } catch {}
}

function speak(line, options = {}) {
  if (muted || !speechState.supported) return false;
  const synth = window.speechSynthesis;
  if (!synth) return false;
  const key = options.key || line;
  const cooldown = options.cooldown ?? 3500;
  const now = performance.now();
  if (now - (speechState.lastSaid.get(key) || -Infinity) < cooldown) return false;
  if ((synth.speaking || synth.pending) && !options.interrupt) return false;
  speechState.lastSaid.set(key, now);
  if (!speechState.voice) selectSpeechVoice();
  if (options.interrupt) synth.cancel();

  const utterance = new SpeechSynthesisUtterance(line);
  utterance.lang = speechState.voice?.lang || "de-DE";
  utterance.voice = speechState.voice;
  utterance.rate = options.rate || 1.02;
  utterance.pitch = options.pitch || 0.86;
  utterance.volume = options.volume || 0.72;
  try {
    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

function cancelSpeech() {
  if (!speechState.supported) return;
  try {
    window.speechSynthesis.cancel();
  } catch {}
}

function resetSpeechForRun() {
  speechState.lastSaid.clear();
  soundLastPlayed.clear();
  cancelSpeech();
}

function mapMusicProfile(mapId = selectedMap) {
  const profile = mapVariant(mapId).music || {};
  return {
    mainKey: profile.main || "bgmMain",
    rushKey: profile.rush || "bgmRush",
    mainVolume: profile.mainVolume ?? musicConfig.main,
    rushVolume: profile.rushVolume ?? musicConfig.rush,
    rushStart: profile.rushStart ?? musicConfig.rushStart,
    rushFade: profile.rushFade ?? musicConfig.rushFade,
  };
}

function configureMusicForMap(mapId = selectedMap) {
  const profile = mapMusicProfile(mapId);
  setMusicSource("main", profile.mainKey);
  setMusicSource("rush", profile.rushKey);
  return profile;
}

function setMusicSource(slot, key) {
  const audio = slot === "rush" ? rushMusic : music;
  if (!audio || musicTrackKeys[slot] === key) return;
  audio.pause();
  audio.src = audioSources[key] || audioSources.bgmMain;
  audio.load();
  audio.volume = 0;
  musicTrackKeys[slot] = key;
  activeMusicTrack = null;
}

function syncMusic() {
  if (!music || !rushMusic) return;
  const profile = configureMusicForMap(state.map);
  music.muted = muted;
  rushMusic.muted = muted;
  if (muted || state.phase !== "playing") {
    stopMusicTracks();
    return;
  }
  const nextTrack = state.elapsed >= profile.rushStart ? "rush" : "main";
  if (activeMusicTrack !== nextTrack) switchMusicTrack(nextTrack, profile);
  music.volume = nextTrack === "main" ? profile.mainVolume : 0;
  rushMusic.volume = nextTrack === "rush" ? profile.rushVolume : 0;
}

function switchMusicTrack(track, profile = mapMusicProfile(state.map)) {
  const from = track === "rush" ? music : rushMusic;
  const to = track === "rush" ? rushMusic : music;
  from.pause();
  from.volume = 0;
  to.volume = track === "rush" ? profile.rushVolume : profile.mainVolume;
  to.play().catch(() => {});
  activeMusicTrack = track;
}

function stopMusicTracks() {
  music.pause();
  rushMusic.pause();
  music.volume = 0;
  rushMusic.volume = 0;
  activeMusicTrack = null;
}

function resetMusicTracks() {
  stopMusicTracks();
  try {
    music.currentTime = 0;
    rushMusic.currentTime = 0;
  } catch {}
}

function startGame(options = {}) {
  if (!ready) return;
  quickMode = options.quick === true;
  selectedMap = normalizeSelectedMap(selectedMap);
  configureMusicForMap(selectedMap);
  resetSpeechForRun();
  resetMusicTracks();
  state = makeState();
  state.phase = "playing";
  if (quickMode) {
    state.elapsed = 135;
    raiseWeapon("coconut");
    raiseWeapon("compass");
    state.level = 4;
    state.nextXp = 62;
  }
  ui.startOverlay.hidden = true;
  ui.endOverlay.hidden = true;
  ui.upgradeOverlay.hidden = true;
  ui.hud.hidden = false;
  ui.loadout.hidden = false;
  ui.cornerControls.hidden = false;
  ui.touchControls.hidden = false;
  playSound("confirm");
  const skinName = playerSkinMap[state.player.skin]?.name || playerSkinMap.default.name;
  speak(
    quickMode ? `Schnelle Welle. ${skinName} steht schon am Bug!` : `${skinName} bereit. Halt den Strand!`,
    { key: "start", interrupt: true, cooldown: 0 },
  );
  syncMusic();
  lastTime = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
}

function endGame(victory) {
  recordRunProgress(victory);
  state.phase = victory ? "victory" : "gameover";
  ui.endEyebrow.textContent = victory ? "Flut gebrochen" : "Vertrag beendet";
  ui.endTitle.textContent = victory ? "Strand gehalten" : "Die Geistercrew war schneller";
  ui.endStats.textContent = `${formatTime(state.elapsed)} - ${state.killCount} Gegner - ${state.coins} Dublonen - Level ${state.level}`;
  ui.endOverlay.hidden = false;
  playSound(victory ? "chime" : "gate");
  syncMusic();
  speak(
    victory ? "Strand gehalten. Die Affenflut zieht ab!" : "Die Geistercrew war schneller. Nochmal in die Flut!",
    { key: victory ? "victory" : "gameover", interrupt: true, cooldown: 0 },
  );
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
  lastTime = now;
  if (state.phase === "playing") update(dt);
  render();
  raf = requestAnimationFrame(loop);
}

function update(dt) {
  state.elapsed += dt;
  const survived = Math.floor(state.elapsed);
  if (survived > metaProgress.bestSurvival) {
    metaProgress.bestSurvival = survived;
    unlockAchievements();
  }
  state.warningTimer = Math.max(0, state.warningTimer - dt);
  updatePlayer(dt);
  updatePowerups(dt);
  updateWeapons(dt);
  updateSpawns(dt);
  updateEnemies(dt);
  updateExploration();
  updateProjectiles(dt);
  updateGems(dt);
  updateStreak(dt);
  updateParticles(dt);
  updateDom();
  updateVoiceCues();
  syncMusic();
  if (state.elapsed >= TARGET_TIME && !state.enemies.some((e) => e.boss)) {
    endGame(true);
  }
}

function updateVoiceCues() {
  if (!state.voice || state.phase !== "playing") return;
  const hpPct = state.player.hp / state.player.maxHp;
  if (hpPct <= 0.32 && state.elapsed >= state.voice.nextLowHpAt) {
    state.voice.nextLowHpAt = state.elapsed + 16;
    speak("Vorsicht, Kaeptnin. Such Limetten!", { key: "low-hp", interrupt: true, cooldown: 12000, rate: 1.04 });
  }

  const minuteMark = Math.floor(state.elapsed / 60);
  if (minuteMark > state.voice.minuteMark && minuteMark > 0 && state.elapsed < TARGET_TIME - 35) {
    state.voice.minuteMark = minuteMark;
    speak(`${minuteMark} Minuten ueberlebt. Weiter so!`, { key: `minute-${minuteMark}`, cooldown: 1000, rate: 1.05 });
  }

  if (!state.voice.finalWarned && state.elapsed >= TARGET_TIME - 42) {
    state.voice.finalWarned = true;
    speak("Letzte Flut. Alles auf den Strand!", { key: "final-wave", interrupt: true, cooldown: 0, rate: 1.05 });
  }
}

function updatePlayer(dt) {
  const p = state.player;
  const input = readInput();
  p.moveX = input.x;
  p.moveY = input.y;
  if (input.x !== 0) p.facing = input.x > 0 ? 1 : -1;
  p.invuln = Math.max(0, p.invuln - dt);
  p.dashCooldown = Math.max(0, p.dashCooldown - dt);
  p.dash = Math.max(0, p.dash - dt);
  const dashBoost = p.dash > 0 ? 2.95 : 1;
  const speedBoost = activePowerMultiplier("speed");
  moveActorWithObstacles(p, input.x * state.stats.speed * speedBoost * dashBoost, input.y * state.stats.speed * speedBoost * dashBoost, dt, p.r);
  state.camera.x += (p.x - state.camera.x) * Math.min(1, dt * 7.5);
  state.camera.y += (p.y - state.camera.y) * Math.min(1, dt * 7.5);
}

function dash() {
  if (state.phase !== "playing") return;
  const p = state.player;
  if (p.dashCooldown > 0) return;
  p.dash = 0.2;
  p.dashCooldown = state.stats.dashCooldown;
  p.invuln = Math.max(p.invuln, 0.3);
  playSound("gate");
  playSound("downloadDash");
}

function actorIgnoresObstacles(actor) {
  return actor?.type?.phase === true || actor?.type?.flying === true;
}

function propBlocksMovement(prop) {
  return !!blockingPropShapes[prop.icon];
}

function propObstacleShape(prop) {
  const shape = blockingPropShapes[prop.icon];
  if (!shape) return null;
  const scale = prop.scale || 1;
  return {
    x: prop.x,
    y: prop.y + (shape.oy || 0) * scale,
    rx: shape.rx * scale,
    ry: shape.ry * scale,
    prop,
  };
}

function obstacleContainment(actor, prop, radius = actor.r || 20) {
  const shape = propObstacleShape(prop);
  if (!shape) return 999;
  const rx = shape.rx + radius;
  const ry = shape.ry + radius * 0.88;
  const dx = actor.x - shape.x;
  const dy = actor.y - shape.y;
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
}

function moveActorWithObstacles(actor, vx, vy, dt, radius = actor.r || 20, ignores = false) {
  actor.x = clamp(actor.x + vx * dt, 90, WORLD.w - 90);
  if (!ignores) resolveObstacleCollisions(actor, radius);
  actor.y = clamp(actor.y + vy * dt, 90, WORLD.h - 90);
  if (!ignores) resolveObstacleCollisions(actor, radius);
}

function resolveObstacleCollisions(actor, radius = actor.r || 20) {
  for (const prop of state.props) {
    if (!propBlocksMovement(prop)) continue;
    const shape = propObstacleShape(prop);
    const rx = shape.rx + radius;
    const ry = shape.ry + radius * 0.88;
    const dx = actor.x - shape.x;
    const dy = actor.y - shape.y;
    const n = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
    if (n >= 1) continue;
    const angle = Math.abs(dx) + Math.abs(dy) < 0.001
      ? ((hash2(Math.floor(shape.x), Math.floor(shape.y)) % 628) / 100)
      : Math.atan2(dy / ry, dx / rx);
    actor.x = shape.x + Math.cos(angle) * rx;
    actor.y = shape.y + Math.sin(angle) * ry;
  }
  actor.x = clamp(actor.x, 90, WORLD.w - 90);
  actor.y = clamp(actor.y, 90, WORLD.h - 90);
}

function obstacleInfluencingActor(actor, moveX, moveY, radius = actor.r || 20) {
  const lookX = actor.x + moveX * (radius + 92);
  const lookY = actor.y + moveY * (radius + 92);
  let best = null;
  let bestN = Infinity;
  for (const prop of state.props) {
    if (!propBlocksMovement(prop)) continue;
    const shape = propObstacleShape(prop);
    const rx = shape.rx + radius + 30;
    const ry = shape.ry + radius + 24;
    const dx = lookX - shape.x;
    const dy = lookY - shape.y;
    const n = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
    if (n < bestN && n < 1.28) {
      bestN = n;
      best = shape;
    }
  }
  return best;
}

function steerAroundObstacles(actor, desiredX, desiredY) {
  if (actorIgnoresObstacles(actor)) return { x: desiredX, y: desiredY };
  const shape = obstacleInfluencingActor(actor, desiredX, desiredY, actor.r);
  if (!shape) return { x: desiredX, y: desiredY };
  const dx = actor.x - shape.x;
  const dy = actor.y - shape.y;
  const normal = normalizeVector(dx / Math.max(1, shape.rx), dy / Math.max(1, shape.ry));
  let tangent = { x: -normal.y, y: normal.x };
  const otherTangent = { x: normal.y, y: -normal.x };
  if (dotVector(otherTangent.x, otherTangent.y, desiredX, desiredY) > dotVector(tangent.x, tangent.y, desiredX, desiredY)) {
    tangent = otherTangent;
  }
  return normalizeVector(
    desiredX * 0.42 + tangent.x * 0.96 + normal.x * 0.34,
    desiredY * 0.42 + tangent.y * 0.96 + normal.y * 0.34,
  );
}

function normalizeVector(x, y) {
  const len = Math.hypot(x, y);
  if (len <= 0.0001) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

function dotVector(ax, ay, bx, by) {
  return ax * bx + ay * by;
}

function readInput() {
  let x = 0;
  let y = 0;
  if (keys.has("arrowleft") || keys.has("a")) x -= 1;
  if (keys.has("arrowright") || keys.has("d")) x += 1;
  if (keys.has("arrowup") || keys.has("w")) y -= 1;
  if (keys.has("arrowdown") || keys.has("s")) y += 1;
  x += pointer.dx;
  y += pointer.dy;
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y };
}

function updateWeapons(dt) {
  const w = state.weapons;
  const p = state.player;
  w.cutlass.timer -= dt;
  if (w.cutlass.timer <= 0) {
    const lvl = w.cutlass.level;
    const cooldown = Math.max(0.24, 0.6 - lvl * 0.05);
    w.cutlass.timer = cooldown;
    const direction = Math.atan2(p.moveY || 0.15, p.moveX || p.facing);
    slash(direction, 114 + lvl * 18, 44 + lvl * 8, 28 + lvl * 10);
  }
  if (w.coconut.level > 0) {
    w.coconut.timer -= dt;
    if (w.coconut.timer <= 0) {
      w.coconut.timer = Math.max(0.22, 0.82 - w.coconut.level * 0.08);
      fireCoconut(w.coconut.level);
    }
  }
  if (w.compass.level > 0) {
    w.compass.angle += dt * (1.55 + w.compass.level * 0.1);
    w.compass.timer -= dt;
    updateCompassDamage(dt);
    if (w.compass.timer <= 0) {
      w.compass.timer = Math.max(0.36, 1.22 - w.compass.level * 0.12);
      fireCompassBeam(w.compass.level);
    }
  }
  if (w.bottle.level > 0) {
    w.bottle.timer -= dt;
    if (w.bottle.timer <= 0) {
      w.bottle.timer = Math.max(0.62, 1.92 - w.bottle.level * 0.18);
      throwBottle(w.bottle.level);
    }
  }
  if (w.rope.level > 0) {
    w.rope.angle += dt * 2.2;
    w.rope.tick -= dt;
    if (w.rope.tick <= 0) {
      w.rope.tick = 0.2;
      ropeDamage(w.rope.level);
    }
  }
}

function slash(angle, radius, arc, damage) {
  const p = state.player;
  state.zones.push({ type: "slash", x: p.x, y: p.y, angle, radius, arc: arc * Math.PI / 180, life: 0.18, maxLife: 0.18 });
  playSound("gate");
  for (const enemy of state.enemies) {
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > radius + enemy.r) continue;
    const delta = Math.abs(shortAngle(Math.atan2(dy, dx) - angle));
    if (delta < arc * Math.PI / 180 || dist < 46) {
      hurtEnemy(enemy, damage * state.stats.damage, dx / Math.max(1, dist), dy / Math.max(1, dist));
    }
  }
}

function fireCoconut(level) {
  const target = nearestEnemy();
  if (!target) return;
  const p = state.player;
  const angle = Math.atan2(target.y - p.y, target.x - p.x);
  const speed = 420 + level * 18;
  state.projectiles.push({
    type: "coconut",
    icon: "coconutBoomerang",
    x: p.x + Math.cos(angle) * 32,
    y: p.y + Math.sin(angle) * 32,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: 17,
    damage: 23 + level * 9,
    life: 3.15,
    pierce: 3 + Math.floor(level / 2),
    spin: 0,
  });
}

function fireCompassBeam(level) {
  const target = nearestEnemy();
  if (!target) return;
  const p = state.player;
  const damage = 18 + level * 9;
  hurtEnemy(target, damage, Math.sign(target.x - p.x), Math.sign(target.y - p.y));
  state.zones.push({ type: "beam", x: p.x, y: p.y, tx: target.x, ty: target.y, life: 0.16, maxLife: 0.16 });
  playSound("chime");
}

function throwBottle(level) {
  const target = nearestEnemy();
  if (!target) return;
  const p = state.player;
  const angle = Math.atan2(target.y - p.y, target.x - p.x);
  state.projectiles.push({
    type: "bottle",
    icon: "rumBomb",
    x: p.x,
    y: p.y,
    vx: Math.cos(angle) * 280,
    vy: Math.sin(angle) * 280,
    r: 15,
    damage: 25 + level * 11,
    radius: 102 + level * 12,
    life: 1.15,
    target,
    spin: 0,
  });
}

function updateCompassDamage(dt) {
  const level = state.weapons.compass.level;
  const points = compassPoints();
  const hits = state.weapons.compass.hits;
  for (const [id, time] of hits) {
    const next = time - dt;
    if (next <= 0) hits.delete(id);
    else hits.set(id, next);
  }
  for (const point of points) {
    for (const enemy of state.enemies) {
      if (hits.has(enemy.id)) continue;
      const dist = Math.hypot(enemy.x - point.x, enemy.y - point.y);
      if (dist < enemy.r + 24) {
        hurtEnemy(enemy, 14 + level * 6, Math.sign(enemy.x - point.x), Math.sign(enemy.y - point.y));
        hits.set(enemy.id, 0.32);
      }
    }
  }
}

function ropeDamage(level) {
  const p = state.player;
  const radius = 86 + level * 14;
  for (const enemy of state.enemies) {
    const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
    if (dist > radius - 16 && dist < radius + 28) {
      hurtEnemy(enemy, 12 + level * 6, (enemy.x - p.x) / dist, (enemy.y - p.y) / dist);
    }
  }
}

function updateSpawns(dt) {
  state.spawnTimer -= dt;
  state.bossTimer -= dt;
  const intensity = quickMode ? BALANCE.quickSpawnIntensity : BALANCE.normalSpawnIntensity;
  const interval = Math.max(0.18, (0.78 - state.elapsed * 0.00135) / intensity);
  if (state.spawnTimer <= 0) {
    state.spawnTimer = interval;
    const count = 1 + Math.floor(state.elapsed / 78) + (Math.random() < 0.24 ? 1 : 0);
    for (let i = 0; i < count; i += 1) spawnEnemy(pickEnemyType());
  }
  if (state.elapsed > BALANCE.firstBossAt && state.bossTimer <= 0) {
    state.bossTimer = BALANCE.bossInterval;
    const bossCycle = ["spectralCaptain", "idol", "coralBrute"];
    const bossType = enemyType(bossCycle[state.bossCount % bossCycle.length]);
    state.bossCount += 1;
    spawnEnemy(bossType, true);
    state.warningTimer = 3.2;
    const warning = bossType.id === "spectralCaptain"
      ? "Fluchkapitaen voraus. Raus aus der Klinge!"
      : bossType.id === "coralBrute"
        ? "Korallenbrecher voraus. Lass dich nicht festnageln!"
        : "Affenidol voraus. Bleib in Bewegung!";
    playSound("downloadBossWarning", { force: true });
    speak(warning, { key: `boss-warning-${bossType.id}`, interrupt: true, cooldown: 45000, rate: 1.06 });
  }
}

function enemyType(id) {
  return enemyTypes.find((type) => type.id === id) || enemyTypes[0];
}

function pickEnemyType() {
  const t = state.elapsed;
  const roll = Math.random();
  const variant = mapVariant(state.map);
  if (variant.enemyFavor && roll < 0.22) return enemyType(variant.enemyFavor[Math.floor(Math.random() * variant.enemyFavor.length)]);
  if (variant.detail === "lagoon" && t > 42 && roll < 0.32) return enemyType("hand");
  if (variant.detail === "treasure" && t > 56 && roll < 0.34) return enemyType("powderImp");
  if (t > 282 && roll < 0.16) return enemyType("stormDuelist");
  if (t > 238 && roll < 0.2) return enemyType("coralBrute");
  if (t > 220 && roll < 0.26) return enemyType("barrelMaw");
  if (t > 192 && roll < 0.31) return enemyType("tideWitch");
  if (t > 150 && roll < 0.36) return enemyType("lanternWraith");
  if (t > 126 && roll < 0.42) return enemyType("saltboneFencer");
  if (t > 88 && roll < 0.48) return enemyType("reefRaider");
  if (t > 56 && roll < 0.54) return enemyType("powderImp");
  if (t > 250 && roll < 0.1) return enemyType("gargoyle");
  if (t > 205 && roll < 0.18) return enemyType("oracle");
  if (t > 162 && roll < 0.28) return enemyType("hand");
  if (t > 118 && roll < 0.4) return enemyType("boneCorsair");
  if (t > 82 && roll < 0.5) return enemyType("cook");
  if (t > 42 && roll < 0.62) return enemyType("cryptBat");
  if (t > 24 && roll < 0.72) return enemyType("crab");
  return enemyType("deckhand");
}

function spawnEnemy(type, boss = false) {
  if (state.enemies.length > 260 && !boss) return;
  const p = state.player;
  const side = Math.floor(Math.random() * 4);
  const margin = boss ? 460 : 620;
  let x = p.x;
  let y = p.y;
  if (side === 0) {
    x -= scene.w / 2 + margin;
    y += (Math.random() - 0.5) * (scene.h + margin);
  } else if (side === 1) {
    x += scene.w / 2 + margin;
    y += (Math.random() - 0.5) * (scene.h + margin);
  } else if (side === 2) {
    x += (Math.random() - 0.5) * (scene.w + margin);
    y -= scene.h / 2 + margin;
  } else {
    x += (Math.random() - 0.5) * (scene.w + margin);
    y += scene.h / 2 + margin;
  }
  const scaledHp = type.hp * (1 + state.elapsed / BALANCE.enemyHpGrowth) * (boss ? BALANCE.bossHpMult : 1);
  const enemy = {
    id: cryptoId(),
    type,
    x: clamp(x, 80, WORLD.w - 80),
    y: clamp(y, 80, WORLD.h - 80),
    hp: scaledHp,
    maxHp: scaledHp,
    r: type.radius * (boss ? 1.25 : 1),
    speed: type.speed * (1 + state.elapsed / BALANCE.enemySpeedGrowth),
    damage: type.damage,
    row: type.row,
    frameOffset: Math.floor(Math.random() * 16),
    hit: 0,
    boss,
    shootTimer: 0.8 + Math.random() * 1.2,
  };
  if (!actorIgnoresObstacles(enemy)) resolveObstacleCollisions(enemy, enemy.r);
  state.enemies.push(enemy);
}

function updateEnemies(dt) {
  const p = state.player;
  for (const enemy of state.enemies) {
    enemy.hit = Math.max(0, enemy.hit - dt);
    const dx = p.x - enemy.x;
    const dy = p.y - enemy.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const desired = steerAroundObstacles(enemy, dx / dist, dy / dist);
    moveActorWithObstacles(enemy, desired.x * enemy.speed, desired.y * enemy.speed, dt, enemy.r, actorIgnoresObstacles(enemy));
    updateEnemyRangedAttack(enemy, dt, dist, dx, dy);
    if (dist < p.r + enemy.r && p.invuln <= 0) {
      const damage = Math.max(1, enemy.damage - state.stats.armor - activePowerBonus("armor"));
      p.hp -= damage;
      p.invuln = 0.88;
      p.x -= (dx / dist) * 30;
      p.y -= (dy / dist) * 30;
      resolveObstacleCollisions(p, p.r);
      shake(0.8);
      floatingText(`-${Math.round(damage)}`, p.x, p.y - 58, "#ff765f");
      playSound("gate");
      if (p.hp <= 0) endGame(false);
    }
  }
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
}

function updateEnemyRangedAttack(enemy, dt, dist, dx, dy) {
  if (state.elapsed < BALANCE.rangedPressureAt) return;
  const profile = enemyProjectileProfile(enemy);
  if (!profile || dist > profile.range) return;
  enemy.shootTimer -= dt;
  if (enemy.shootTimer > 0) return;
  enemy.shootTimer = profile.cooldown * (0.82 + Math.random() * 0.36);
  const angle = Math.atan2(dy, dx);
  const speed = profile.speed + state.elapsed * 0.1;
  state.projectiles.push({
    type: "curseOrb",
    fx: profile.fx,
    x: enemy.x + Math.cos(angle) * enemy.r,
    y: enemy.y + Math.sin(angle) * enemy.r,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: profile.radius,
    damage: profile.damage,
    life: profile.life,
    spin: Math.random() * Math.PI * 2,
  });
}

function enemyProjectileProfile(enemy) {
  if (enemy.boss && enemy.type.id === "spectralCaptain") {
    return { fx: "ghostCannonball", range: 760, cooldown: 2.1, speed: 248, radius: 18, damage: 13, life: 4.2 };
  }
  if (enemy.boss && enemy.type.id === "idol") {
    return { fx: "monkeyCurseOrb", range: 820, cooldown: 1.9, speed: 226, radius: 20, damage: 15, life: 4.4 };
  }
  if (enemy.type.id === "oracle") {
    return { fx: "compassBolt", range: 650, cooldown: 2.35, speed: 258, radius: 14, damage: 9, life: 3.6 };
  }
  if (enemy.type.id === "gargoyle") {
    return { fx: "ghostCannonball", range: 690, cooldown: 2.65, speed: 222, radius: 16, damage: 12, life: 4.0 };
  }
  return null;
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    projectile.life -= dt;
    projectile.spin += dt * 8;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    if (projectile.type === "coconut") {
      for (const enemy of state.enemies) {
        if (enemy.hp <= 0 || enemy._hitBy === projectile) continue;
        const dist = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
        if (dist < enemy.r + projectile.r) {
          hurtEnemy(enemy, projectile.damage * state.stats.damage, projectile.vx, projectile.vy);
          enemy._hitBy = projectile;
          projectile.pierce -= 1;
          const target = nearestEnemy(enemy);
          if (target) {
            const angle = Math.atan2(target.y - projectile.y, target.x - projectile.x);
            const speed = Math.hypot(projectile.vx, projectile.vy);
            projectile.vx = Math.cos(angle) * speed;
            projectile.vy = Math.sin(angle) * speed;
          }
          if (projectile.pierce < 0) projectile.life = 0;
          break;
        }
      }
    } else if (projectile.type === "bottle") {
      const target = projectile.target;
      if (target && target.hp > 0) {
        const angle = Math.atan2(target.y - projectile.y, target.x - projectile.x);
        const speed = 310;
        projectile.vx += Math.cos(angle) * 380 * dt;
        projectile.vy += Math.sin(angle) * 380 * dt;
        const len = Math.hypot(projectile.vx, projectile.vy);
        if (len > speed) {
          projectile.vx = projectile.vx / len * speed;
          projectile.vy = projectile.vy / len * speed;
        }
      }
      for (const enemy of state.enemies) {
        if (Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) < enemy.r + projectile.r) {
          explode(projectile.x, projectile.y, projectile.radius, projectile.damage);
          projectile.life = 0;
          break;
        }
      }
      if (projectile.life <= 0) explode(projectile.x, projectile.y, projectile.radius, projectile.damage);
    } else if (projectile.type === "curseOrb") {
      const p = state.player;
      const dist = Math.hypot(p.x - projectile.x, p.y - projectile.y);
      if (dist < p.r + projectile.r) {
        state.zones.push({ type: "curseBurst", x: projectile.x, y: projectile.y, radius: 78, life: 0.24, maxLife: 0.24, fx: projectile.fx });
        projectile.life = 0;
        if (p.invuln <= 0) {
          const damage = Math.max(1, projectile.damage - Math.floor((state.stats.armor + activePowerBonus("armor")) * 0.45));
          p.hp -= damage;
          p.invuln = 0.7;
          p.x += (p.x - projectile.x) / Math.max(1, dist) * 20;
          p.y += (p.y - projectile.y) / Math.max(1, dist) * 20;
          resolveObstacleCollisions(p, p.r);
          shake(0.55);
          floatingText(`-${Math.round(damage)}`, p.x, p.y - 58, "#ff765f");
          playSound("downloadHit");
          if (p.hp <= 0) endGame(false);
        }
      }
    }
  }
  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);
}

function explode(x, y, radius, damage) {
  state.zones.push({ type: "explosion", x, y, radius, life: 0.28, maxLife: 0.28 });
  playSound("chime");
  for (const enemy of state.enemies) {
    const dx = enemy.x - x;
    const dy = enemy.y - y;
    const dist = Math.hypot(dx, dy);
    if (dist < radius + enemy.r) {
      hurtEnemy(enemy, damage * (1 - Math.min(0.65, dist / radius * 0.45)), dx / Math.max(1, dist), dy / Math.max(1, dist));
    }
  }
}

function updateGems(dt) {
  const p = state.player;
  for (const gem of state.gems) {
    gem.life -= dt;
    const dx = p.x - gem.x;
    const dy = p.y - gem.y;
    const dist = Math.hypot(dx, dy);
    if (gem.kind === "xp" && gem.life < 8) {
      collectGem(gem);
      continue;
    }
    const range = gem.kind === "powerup"
      ? powerupDropTuning.magnetRange + activePowerBonus("magnet") * 0.12
      : state.stats.magnet + activePowerBonus("magnet") + (gem.kind === "xp" ? 140 : gem.kind === "heart" ? 120 : 55);
    if (dist < range) {
      const pull = (1 - dist / range) * 920 + 240;
      gem.x += (dx / Math.max(1, dist)) * pull * dt;
      gem.y += (dy / Math.max(1, dist)) * pull * dt;
    }
    if (dist < p.r + gem.r) collectGem(gem);
  }
  state.gems = state.gems.filter((gem) => !gem.collected && gem.life > 0);
}

function updateExploration() {
  const p = state.player;
  for (const prop of state.props) {
    if (!prop.interactive || prop.discovered) continue;
    const dist = Math.hypot(prop.x - p.x, prop.y - p.y);
    const radius = prop.icon === "beachHut" || prop.icon === "boatWreck" ? 150 : prop.icon === "conchShrine" ? 122 : 105;
    if (dist > radius) continue;
    prop.discovered = true;
    const isChest = prop.icon === "treasureChest" || prop.icon === "buriedTreasure";
    const isShrine = prop.icon === "conchShrine";
    if (isChest) prop.icon = "openTreasureChest";
    const label = isChest ? "Schatz ausgegraben" : isShrine ? "Muschelschrein geweckt" : prop.icon === "beachHut" ? "Huette erkundet" : "Wrack gepluendert";
    floatingText(label, prop.x, prop.y - 80, "#fff2c7");
    const xpValue = isShrine ? 58 : isChest ? 36 : 46;
    const coinValue = isShrine ? 8 : isChest ? 18 : 18;
    state.runStats.landmarks += 1;
    metaProgress.landmarks += 1;
    state.gems.push({ kind: "xp", icon: "skullCoin", x: prop.x, y: prop.y - 18, r: 12, value: xpValue, life: 34 });
    state.gems.push({ kind: "coin", icon: "coin", x: prop.x + 24, y: prop.y + 8, r: 12, value: coinValue, life: 34 });
    if (!isChest) state.gems.push({ kind: "heart", icon: "lime", x: prop.x - 24, y: prop.y + 8, r: 13, value: 1, life: 28 });
    const routePowerup = isShrine
      || (prop.streakCache && Math.random() < powerupDropTuning.cacheChance)
      || (isChest && Math.random() < powerupDropTuning.chestChance);
    if (routePowerup) spawnPowerup(prop.x - 36, prop.y + 18, isShrine ? "voodooWard" : null, { life: 22 });
    if (isShrine) {
      state.player.invuln = Math.max(state.player.invuln, 1.25);
      state.zones.push({ type: "curseBurst", x: prop.x, y: prop.y, radius: 96, life: 0.32, maxLife: 0.32, fx: "monkeyCurseOrb" });
    }
    unlockAchievements();
    saveMetaProgress();
    renderMetaProgress();
    playSound("downloadUpgrade", { force: true });
    playSound("chime", { force: true });
  }
}

function updatePowerups(dt) {
  for (const powerup of state.powerups) powerup.timer -= dt;
  state.powerups = state.powerups.filter((powerup) => powerup.timer > 0);
  state.powerupDropCooldown = Math.max(0, state.powerupDropCooldown - dt);
}

function powerUpType(id) {
  return powerUpTypes.find((powerup) => powerup.id === id) || powerUpTypes[0];
}

function activePowerMultiplier(stat) {
  return state.powerups.reduce((value, powerup) => value * (powerUpType(powerup.id)[stat] || 1), 1);
}

function activePowerBonus(stat) {
  return state.powerups.reduce((value, powerup) => value + (powerUpType(powerup.id)[stat] || 0), 0);
}

function activatePowerup(id) {
  const type = powerUpType(id);
  const existing = state.powerups.find((powerup) => powerup.id === type.id);
  if (existing) existing.timer = Math.max(existing.timer, type.duration);
  else state.powerups.push({ id: type.id, timer: type.duration, duration: type.duration });
  if (type.armor) state.player.invuln = Math.max(state.player.invuln, 0.95);
  state.runStats.powerups += 1;
  metaProgress.powerups += 1;
  floatingText(type.name, state.player.x, state.player.y - 70, type.color, 0.55, 14);
  unlockAchievements();
  saveMetaProgress();
  renderMetaProgress();
}

function spawnPowerup(x, y, forcedId = null, options = {}) {
  const type = forcedId ? powerUpType(forcedId) : powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
  state.gems.push({ kind: "powerup", powerup: type.id, icon: type.icon, x, y, r: 16, value: 1, life: options.life || powerupDropTuning.life });
  if (options.cooldown) state.powerupDropCooldown = Math.max(state.powerupDropCooldown, options.cooldown);
}

function collectGem(gem) {
  gem.collected = true;
  if (gem.kind === "heart") {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 36);
    floatingText("+HP", state.player.x, state.player.y - 72, "#79e0b7");
  } else if (gem.kind === "powerup") {
    activatePowerup(gem.powerup);
    playSound("pickup", { cooldown: 800 });
    return;
  } else if (gem.kind === "coin") {
    state.coins += gem.value;
    metaProgress.coins += gem.value;
    floatingText(`+${gem.value}`, gem.x, gem.y - 18, "#f0c45d");
  } else {
    const streakBonus = state.streak?.count >= 10 ? 1.16 : state.streak?.count >= 5 ? 1.08 : 1;
    state.xp += Math.ceil(gem.value * state.stats.pickupValue * streakBonus);
    while (state.xp >= state.nextXp && state.phase === "playing") {
      state.xp -= state.nextXp;
      levelUp();
    }
    if (Math.random() < 0.18) playSound("downloadPickup");
  }
  playSound("pickup");
}

function updateStreak(dt) {
  if (!state.streak || state.streak.timer <= 0) return;
  state.streak.timer = Math.max(0, state.streak.timer - dt);
  if (state.streak.timer === 0) {
    state.streak.count = 0;
    state.streak.nextCache = 18;
  }
}

function updateParticles(dt) {
  for (const zone of state.zones) zone.life -= dt;
  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.96;
    particle.vy *= 0.96;
  }
  for (const text of state.texts) {
    text.life -= dt;
    text.y -= dt * 42;
  }
  state.zones = state.zones.filter((zone) => zone.life > 0);
  state.particles = state.particles.filter((particle) => particle.life > 0);
  state.texts = state.texts.filter((text) => text.life > 0);
}

function hurtEnemy(enemy, amount, nx = 0, ny = 0) {
  if (enemy.hp <= 0) return;
  amount *= activePowerMultiplier("damage");
  enemy.hp -= amount;
  enemy.hit = 0.14;
  enemy.x += clamp(nx, -1, 1) * 7;
  enemy.y += clamp(ny, -1, 1) * 7;
  if (!actorIgnoresObstacles(enemy)) resolveObstacleCollisions(enemy, enemy.r);
  if ((enemy.boss || amount >= 42) && Math.random() < 0.45) playSound("downloadHit");
  if (Math.random() < 0.12) floatingText(String(Math.round(amount)), enemy.x, enemy.y - enemy.r - 20, enemy.type.tint);
  for (let i = 0; i < 2; i += 1) {
    state.particles.push({
      x: enemy.x,
      y: enemy.y - 24,
      vx: (Math.random() - 0.5) * 90,
      vy: -Math.random() * 70,
      life: 0.4,
      color: enemy.type.tint,
      size: 2 + Math.random() * 3,
    });
  }
  if (enemy.hp <= 0) killEnemy(enemy);
}

function killEnemy(enemy) {
  state.killCount += 1;
  metaProgress.kills += 1;
  recordStreakKill(enemy);
  const xp = Math.ceil(enemy.type.xp * (enemy.boss ? 3.8 : 1) * (1 + state.elapsed / 760));
  state.gems.push({ kind: "xp", icon: "skullCoin", x: enemy.x, y: enemy.y, r: 12, value: xp, life: 34 });
  if (Math.random() < 0.1 || enemy.boss) state.gems.push({ kind: "coin", icon: "coin", x: enemy.x + 12, y: enemy.y + 8, r: 12, value: enemy.boss ? 25 : 3, life: 36 });
  if (Math.random() < 0.06) state.gems.push({ kind: "heart", icon: "lime", x: enemy.x - 10, y: enemy.y, r: 13, value: 1, life: 28 });
  const streakPowerDrop = state.streak.count > 0 && state.streak.count % powerupDropTuning.streakDropEvery === 0;
  if (enemy.boss) {
    spawnPowerup(enemy.x - 18, enemy.y + 16, null, { life: 26, cooldown: 18 });
  } else if (
    state.elapsed > 35
    && state.powerupDropCooldown <= 0
    && state.powerups.length === 0
    && (Math.random() < powerupDropTuning.randomDropChance || streakPowerDrop)
  ) {
    spawnPowerup(enemy.x - 18, enemy.y + 16, null, { cooldown: powerupDropTuning.combatCooldown });
  }
  if (enemy.boss) {
    state.warningTimer = 2;
    const downText = enemy.type.id === "spectralCaptain"
      ? "Captain verbannt"
      : enemy.type.id === "coralBrute"
        ? "Korallenbrecher versenkt"
        : "Idol gebrochen";
    const downVoice = enemy.type.id === "spectralCaptain"
      ? "Fluchkapitaen verbannt. Sammel die Beute!"
      : enemy.type.id === "coralBrute"
        ? "Korallenbrecher versenkt. Sammel die Beute!"
        : "Idol gebrochen. Sammel die Beute!";
    floatingText(downText, enemy.x, enemy.y - 80, "#fff2c7");
    speak(downVoice, { key: `boss-down-${enemy.type.id}`, interrupt: true, cooldown: 2000 });
    playSound("chime", { force: true });
    playSound("downloadBossDown", { force: true });
  } else if (Math.random() < 0.08) {
    playSound("pickup", { cooldown: 650 });
  }
  unlockAchievements();
  saveMetaProgress();
}

function recordStreakKill(enemy) {
  const streak = state.streak;
  if (!streak) return;
  streak.count += 1;
  streak.timer = Math.min(5.2, 3.1 + streak.count * 0.035);
  streak.best = Math.max(streak.best, streak.count);
  metaProgress.bestStreak = Math.max(metaProgress.bestStreak, streak.best);
  if (streak.count === 8 || streak.count % 12 === 0) {
    floatingText(`Streak x${streak.count}`, enemy.x, enemy.y - enemy.r - 48, "#fff2c7");
    playSound("downloadPickup", { cooldown: 650 });
  }
  if (streak.count >= streak.nextCache) {
    spawnStreakCache(streak.count);
    streak.nextCache += 16;
  }
  unlockAchievements();
}

function spawnStreakCache(count) {
  const streak = state.streak;
  const p = state.player;
  const angle = Math.random() * Math.PI * 2;
  const distance = 260 + Math.random() * 220;
  const x = clamp(p.x + Math.cos(angle) * distance, 180, WORLD.w - 180);
  const y = clamp(p.y + Math.sin(angle) * distance, 180, WORLD.h - 180);
  state.props.push({
    x,
    y,
    icon: "buriedTreasure",
    scale: 0.72 + Math.min(0.16, count * 0.002),
    spin: Math.random(),
    interactive: true,
    streakCache: true,
  });
  streak.caches += 1;
  floatingText("Streak-Schatz", x, y - 92, "#fff2c7");
  speak("Streak-Schatz gesichtet.", { key: "streak-cache", cooldown: 9000, rate: 1.06 });
}

function unlockAchievements() {
  let changed = false;
  for (const achievement of achievementDefinitions) {
    if (metaProgress.achievements[achievement.id]) continue;
    if ((metaProgress[achievement.field] || 0) < achievement.target) continue;
    metaProgress.achievements[achievement.id] = true;
    changed = true;
    if (achievement.unlockMap && !metaProgress.unlockedMaps.includes(achievement.unlockMap)) {
      metaProgress.unlockedMaps.push(achievement.unlockMap);
      state?.runStats?.unlocked?.push(achievement.unlockMap);
    }
    if (achievement.unlockRelic && !metaProgress.unlockedRelics.includes(achievement.unlockRelic)) {
      metaProgress.unlockedRelics.push(achievement.unlockRelic);
      state?.runStats?.unlocked?.push(achievement.unlockRelic);
    }
    if (state?.phase === "playing") {
      floatingText(`Erfolg: ${achievement.name}`, state.player.x, state.player.y - 118, "#fff2c7");
      playSound("downloadUpgrade", { force: true });
    }
  }
  if (changed) {
    metaProgress = normalizeMetaProgress(metaProgress);
    saveMetaProgress();
    renderMapPicker();
    renderMetaProgress();
  }
  return changed;
}

function recordRunProgress(victory) {
  metaProgress.runs += 1;
  if (victory) metaProgress.wins += 1;
  metaProgress.bestLevel = Math.max(metaProgress.bestLevel, state.level);
  metaProgress.bestSurvival = Math.max(metaProgress.bestSurvival, Math.floor(state.elapsed));
  metaProgress.bestStreak = Math.max(metaProgress.bestStreak, state.streak.best);
  unlockAchievements();
  saveMetaProgress();
  renderMapPicker();
  renderMetaProgress();
}

function levelUp(options = {}) {
  state.level += 1;
  metaProgress.bestLevel = Math.max(metaProgress.bestLevel, state.level);
  state.nextXp = Math.round(22 + state.level * 14 + state.level * state.level * 1.35);
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + 16);
  if (!options.forceChoice && !shouldShowUpgradeChoice(state.level)) {
    applyFlowLevelReward();
    return;
  }
  state.phase = "levelup";
  playSound("chime", { force: true });
  playSound("downloadUpgrade", { force: true });
  speak("Relikt gefunden. Waehle deine Verstaerkung.", { key: "level-up", interrupt: true, cooldown: 1000 });
  showUpgrades();
}

function shouldShowUpgradeChoice(level) {
  return level === 2 || (level >= 6 && (level - 2) % 4 === 0);
}

function applyFlowLevelReward() {
  const rewards = [
    { name: "Flow: Tempo", apply: () => { state.stats.speed += 5; }, color: "#f0c45d" },
    { name: "Flow: Schaden", apply: () => { state.stats.damage += 0.018; }, color: "#ffb14c" },
    { name: "Flow: Magnet", apply: () => { state.stats.magnet += 12; }, color: "#53ffe5" },
    { name: "Flow: Atem", apply: () => { state.player.hp = Math.min(state.player.maxHp, state.player.hp + 20); }, color: "#79e0b7" },
  ];
  const reward = rewards[state.level % rewards.length];
  reward.apply();
  state.runStats.flowRewards += 1;
  floatingText(reward.name, state.player.x, state.player.y - 96, reward.color);
  playSound("downloadPickup", { cooldown: 1100 });
}

function showUpgrades() {
  ui.upgradeChoices.innerHTML = "";
  activeUpgradeChoices = chooseUpgrades();
  selectedUpgradeIndex = 0;
  activeUpgradeChoices.forEach((upgrade, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "upgrade-card";
    button.dataset.upgradeIndex = String(index);
    button.innerHTML = `
      <span class="upgrade-icon" style="${iconStyle(upgrade.icon)}"></span>
      <span class="upgrade-name">${upgrade.name}</span>
      <span class="upgrade-desc">${upgrade.desc}</span>
    `;
    button.addEventListener("mouseenter", () => setUpgradeSelection(index));
    button.addEventListener("focus", () => setUpgradeSelection(index));
    button.addEventListener("click", () => chooseUpgradeAt(index));
    ui.upgradeChoices.appendChild(button);
  });
  ui.upgradeOverlay.hidden = false;
  requestAnimationFrame(() => setUpgradeSelection(0, true));
}

function setUpgradeSelection(index, focus = false) {
  const cards = [...ui.upgradeChoices.querySelectorAll(".upgrade-card")];
  if (!cards.length) return;
  selectedUpgradeIndex = positiveModulo(index, cards.length);
  cards.forEach((card, cardIndex) => {
    const selected = cardIndex === selectedUpgradeIndex;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-selected", selected ? "true" : "false");
  });
  if (focus) cards[selectedUpgradeIndex].focus({ preventScroll: true });
}

function chooseUpgradeAt(index = selectedUpgradeIndex) {
  if (state.phase !== "levelup") return;
  const upgrade = activeUpgradeChoices[index];
  if (!upgrade) return;
  upgrade.apply();
  state.upgradeCounts[upgrade.id] = (state.upgradeCounts[upgrade.id] || 0) + 1;
  state.phase = "playing";
  activeUpgradeChoices = [];
  ui.upgradeOverlay.hidden = true;
  playSound("confirm");
  speak(`${upgrade.name} bereit.`, { key: `upgrade-${upgrade.id}`, interrupt: true, cooldown: 1200, rate: 1.06 });
  updateDom();
}

function handleUpgradeKey(event) {
  if (state.phase !== "levelup") return false;
  const key = event.key.toLowerCase();
  if (key === "arrowleft" || key === "a" || key === "arrowup" || key === "w") {
    setUpgradeSelection(selectedUpgradeIndex - 1, true);
    event.preventDefault();
    return true;
  }
  if (key === "arrowright" || key === "d" || key === "arrowdown" || key === "s") {
    setUpgradeSelection(selectedUpgradeIndex + 1, true);
    event.preventDefault();
    return true;
  }
  if (key === "enter" || key === " " || key === "e") {
    chooseUpgradeAt(selectedUpgradeIndex);
    event.preventDefault();
    return true;
  }
  if (/^[1-3]$/.test(key)) {
    chooseUpgradeAt(Number(key) - 1);
    event.preventDefault();
    return true;
  }
  return false;
}

function chooseUpgrades() {
  const pool = upgrades.filter((upgrade) => (state.upgradeCounts[upgrade.id] || 0) < upgrade.max);
  shuffle(pool);
  const activeWeapons = pool.filter((upgrade) => state.weapons[upgrade.id]?.level > 0 || upgrade.id === "cutlass");
  const fresh = pool.filter((upgrade) => state.weapons[upgrade.id]?.level === 0);
  const picks = [];
  if (activeWeapons.length) picks.push(activeWeapons[0]);
  if (fresh.length && state.level < 8) picks.push(fresh[0]);
  for (const upgrade of pool) {
    if (!picks.includes(upgrade)) picks.push(upgrade);
    if (picks.length >= 3) break;
  }
  return picks.slice(0, 3);
}

function raiseWeapon(id) {
  const weapon = state.weapons[id];
  if (!weapon) return;
  weapon.level += 1;
  if (id !== "cutlass") weapon.timer = Math.min(weapon.timer, 0.2);
}

function updateDom() {
  const hpPct = clamp(state.player.hp / state.player.maxHp, 0, 1);
  ui.hpBar.style.transform = `scaleX(${hpPct})`;
  ui.hpText.textContent = `${Math.ceil(Math.max(0, state.player.hp))} / ${state.player.maxHp}`;
  ui.xpBar.style.transform = `scaleX(${clamp(state.xp / state.nextXp, 0, 1)})`;
  ui.timeText.textContent = formatTime(state.elapsed);
  ui.levelText.textContent = state.level;
  ui.coinText.textContent = state.coins;
  ui.audioButton.textContent = muted ? "OFF" : "ON";
  ui.pauseButton.textContent = state.phase === "paused" ? ">" : "II";
  ui.fullscreenButton.textContent = document.fullscreenElement ? "MIN" : "FS";
  ui.fullscreenButton.title = document.fullscreenElement ? "Vollbild verlassen" : "Vollbild";
  updateLoadout();
}

function updateLoadout() {
  const weaponEntries = weaponLoadoutItems.filter(([id]) => state.weapons[id].level > 0);
  const weaponHtml = weaponEntries.map(([id, name, icon]) => `
    <div class="loadout-item">
      <span class="loadout-icon" style="${iconStyle(icon)}"></span>
      <span>
        <span class="loadout-name">${name}</span>
        <span class="loadout-level">Lv ${state.weapons[id].level}</span>
      </span>
    </div>
  `).join("");
  const powerHtml = state.powerups.map((powerup) => {
    const type = powerUpType(powerup.id);
    return `
      <div class="loadout-item powerup">
        <span class="loadout-icon" style="${iconStyle(type.icon)}"></span>
        <span>
          <span class="loadout-name">${type.name}</span>
          <span class="loadout-level">${Math.ceil(powerup.timer)}s</span>
        </span>
      </div>
    `;
  }).join("");
  ui.loadout.innerHTML = weaponHtml + powerHtml;
}

function render() {
  syncCanvasSize();
  if (!ready) {
    ctx.fillStyle = "#071312";
    ctx.fillRect(0, 0, viewW, viewH);
    return;
  }
  updateSceneViewport();
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.save();
  ctx.translate(viewW / 2, viewH / 2);
  ctx.scale(scene.zoom, scene.zoom);
  ctx.translate(-scene.w / 2, -scene.h / 2);
  drawWorld();
  if (state.phase !== "menu") {
    drawProps();
    drawGems();
    drawEnemies();
    drawPlayer();
    drawProjectiles();
    drawWeaponEffects();
    drawParticles();
    drawTexts();
    drawVignette();
    if (state.warningTimer > 0) drawWarning();
  }
  ctx.restore();
  ctx.restore();
}

function drawWorld() {
  const cam = state.camera;
  const ox = scene.w / 2 - cam.x;
  const oy = scene.h / 2 - cam.y;
  const variant = mapVariant(state.map);
  drawRepeatingMap(mapBackgroundImage(variant), ox, oy);
  drawMapTint(variant);
  drawNaturalGroundDetails(ox, oy, variant);
}

function mapBackgroundImage(variant = mapVariant(state.map)) {
  return images[variant.background] || images.repeatBeach;
}

function drawRepeatingMap(image, ox, oy) {
  const tileW = image.width;
  const tileH = image.height;
  const startX = positiveModulo(ox, tileW) - tileW;
  const startY = positiveModulo(oy, tileH) - tileH;
  for (let x = startX; x < scene.w + tileW; x += tileW) {
    for (let y = startY; y < scene.h + tileH; y += tileH) {
      ctx.drawImage(image, x, y, tileW, tileH);
    }
  }
}

function drawMapTint(variant) {
  if (!variant?.tint) return;
  ctx.save();
  ctx.fillStyle = variant.tint;
  ctx.fillRect(0, 0, scene.w, scene.h);
  ctx.restore();
}

function drawNaturalGroundDetails(ox, oy, variant = mapVariant(state.map)) {
  const tile = 220;
  const cam = state.camera;
  const minX = Math.floor((cam.x - scene.w / 2) / tile) - 1;
  const maxX = Math.ceil((cam.x + scene.w / 2) / tile) + 1;
  const minY = Math.floor((cam.y - scene.h / 2) / tile) - 1;
  const maxY = Math.ceil((cam.y + scene.h / 2) / tile) + 1;
  ctx.save();
  for (let gx = minX; gx <= maxX; gx += 1) {
    for (let gy = minY; gy <= maxY; gy += 1) {
      const x = gx * tile;
      const y = gy * tile;
      const h = hash2(gx, gy);
      const lagoon = variant.detail === "lagoon";
      const gothic = variant.detail === "gothic";
      const treasure = variant.detail === "treasure";
      if (h % (lagoon ? 11 : 17) === 0 || h % (treasure ? 23 : 31) === 0) {
        const icon = gothic && h % 23 === 0 ? "gothicCandelabra" : h % 31 === 0 ? "tidePuddle" : "clearPuddle";
        const px = ox + x + 30 + ((h >> 6) % 160);
        const py = oy + y + 30 + ((h >> 13) % 150);
        const w = gothic && icon === "gothicCandelabra" ? 54 : 104 + (h % 42);
        const ph = gothic && icon === "gothicCandelabra" ? 54 : 74 + ((h >> 4) % 28);
        drawItem(icon, px, py, w, ph, ((h >> 18) % 628) / 100, icon === "tidePuddle" ? 0.34 : 0.3);
      }
    }
  }
  ctx.restore();
}

function drawProps() {
  const ox = scene.w / 2 - state.camera.x;
  const oy = scene.h / 2 - state.camera.y;
  for (const prop of state.props) {
    if (!onScreen(prop.x, prop.y, 320)) continue;
    const pulse = 1 + Math.sin(performance.now() / 900 + prop.spin * 6) * 0.035;
    const size = getPropDisplaySize(prop.icon, prop.scale * pulse);
    const alpha = prop.discovered && prop.icon !== "openTreasureChest" ? 0.44 : propBlocksMovement(prop) ? 0.82 : 0.62;
    drawItem(prop.icon, ox + prop.x, oy + prop.y, size.w, size.h, prop.spin * 0.18 - 0.08, alpha);
    if (prop.interactive && !prop.discovered) {
      const glint = Math.min(124, Math.max(76, size.w * 0.32));
      drawPlayerEffect("treasureGlint", ox + prop.x, oy + prop.y - size.h * 0.24, glint, glint, state.elapsed * 0.6 + prop.spin, 0.28);
    }
  }
}

function getPropDisplaySize(icon, scale) {
  const beachProp = beachPropMap[icon];
  if (beachProp) return { w: beachProp.w * scale, h: beachProp.h * scale };
  return { w: ITEM.w * scale, h: ITEM.h * scale };
}

function drawGems() {
  const ox = scene.w / 2 - state.camera.x;
  const oy = scene.h / 2 - state.camera.y;
  for (const gem of state.gems) {
    if (!onScreen(gem.x, gem.y, 80)) continue;
    const t = performance.now() / 260;
    const size = gem.kind === "xp" ? 28 : gem.kind === "powerup" ? 42 : 34;
    ctx.save();
    ctx.translate(ox + gem.x, oy + gem.y + Math.sin(t + gem.x) * 4);
    ctx.rotate(Math.sin(t) * 0.1);
    if (gem.kind === "xp") {
      drawPlayerEffectAt("tidePulse", -size * 0.72, -size * 0.72, size * 1.44, size * 1.44);
    }
    drawItemAt(gem.icon, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

function drawEnemies() {
  const ox = scene.w / 2 - state.camera.x;
  const oy = scene.h / 2 - state.camera.y;
  const enemies = [...state.enemies].sort((a, b) => a.y - b.y);
  for (const enemy of enemies) {
    if (!onScreen(enemy.x, enemy.y, 220)) continue;
    const px = ox + enemy.x;
    const py = oy + enemy.y;
    const flip = enemy.x > state.player.x ? -1 : 1;
    let w = 0;
    let h = 0;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(flip, 1);
    ctx.shadowColor = enemy.hit > 0 ? enemy.type.tint : "rgba(0,0,0,0.55)";
    ctx.shadowBlur = enemy.hit > 0 ? 20 : 10;
    if (enemy.type.captainSheet) {
      const frame = (Math.floor(state.elapsed * 6) + enemy.frameOffset) % SPECTRAL_CAPTAIN.cols;
      const sx = frame * SPECTRAL_CAPTAIN.w;
      const bob = Math.sin(state.elapsed * 4.5 + enemy.frameOffset) * 5;
      w = SPECTRAL_CAPTAIN.w * enemy.type.scale * (enemy.boss ? 1.05 : 1);
      h = SPECTRAL_CAPTAIN.h * enemy.type.scale * (enemy.boss ? 1.05 : 1);
      ctx.shadowBlur = enemy.hit > 0 ? 28 : 18;
      ctx.drawImage(images.spectralCaptain, sx, 0, SPECTRAL_CAPTAIN.w, SPECTRAL_CAPTAIN.h, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.gothicRow !== undefined) {
      const frame = (Math.floor(state.elapsed * 8) + enemy.frameOffset) % GOTHIC_ENEMY.cols;
      const sx = frame * GOTHIC_ENEMY.w;
      const sy = enemy.type.gothicRow * GOTHIC_ENEMY.h;
      const bob = enemy.type.id === "cryptBat" ? Math.sin(state.elapsed * 8 + enemy.frameOffset) * 8 : 0;
      w = GOTHIC_ENEMY.w * enemy.type.scale * (enemy.boss ? 1.18 : 1);
      h = GOTHIC_ENEMY.h * enemy.type.scale * (enemy.boss ? 1.18 : 1);
      ctx.drawImage(images.gothicEnemies, sx, sy, GOTHIC_ENEMY.w, GOTHIC_ENEMY.h, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.extraSprite) {
      const src = extraEnemyMap[enemy.type.extraSprite] || extraEnemyMap.reefRaider;
      const bob = Math.sin(state.elapsed * (enemy.type.id === "powderImp" ? 9 : 5.5) + enemy.frameOffset) * (enemy.type.id === "lanternWraith" ? 7 : 3.5);
      w = EXTRA_ENEMY.w * enemy.type.scale * (enemy.boss ? 1.16 : 1);
      h = EXTRA_ENEMY.h * enemy.type.scale * (enemy.boss ? 1.16 : 1);
      ctx.drawImage(images.extraEnemies, src.x * EXTRA_ENEMY.w, src.y * EXTRA_ENEMY.h, EXTRA_ENEMY.w, EXTRA_ENEMY.h, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.sprite) {
      const src = newSpriteMap[enemy.type.sprite];
      const bob = Math.sin(state.elapsed * (enemy.type.id === "crab" ? 10 : 6) + enemy.frameOffset) * (enemy.type.id === "crab" ? 5 : 3);
      w = NEWSPRITE.w * enemy.type.scale * (enemy.boss ? 1.22 : 1);
      h = NEWSPRITE.h * enemy.type.scale * (enemy.boss ? 1.22 : 1);
      ctx.drawImage(images.newSprites, src.x * NEWSPRITE.w, src.y * NEWSPRITE.h, NEWSPRITE.w, NEWSPRITE.h, -w / 2, -h + enemy.r + bob, w, h);
    } else {
      const frame = (Math.floor(state.elapsed * 9) + enemy.frameOffset) % 16;
      const sx = frame * CHAR.w;
      const sy = enemy.row * CHAR.h;
      w = CHAR.w * enemy.type.scale * (enemy.boss ? 1.15 : 1);
      h = CHAR.h * enemy.type.scale * (enemy.boss ? 1.15 : 1);
      ctx.drawImage(images.characters, sx, sy, CHAR.w, CHAR.h, -w / 2, -h + enemy.r, w, h);
    }
    ctx.restore();
    const hpPct = clamp(enemy.hp / enemy.maxHp, 0, 1);
    if (hpPct < 0.98 || enemy.boss) {
      ctx.fillStyle = "rgba(0,0,0,0.48)";
      ctx.fillRect(px - 28, py - h - 8, 56, 5);
      ctx.fillStyle = enemy.type.tint;
      ctx.fillRect(px - 28, py - h - 8, 56 * hpPct, 5);
    }
  }
}

function drawPlayer() {
  const p = state.player;
  const ox = scene.w / 2 - state.camera.x;
  const oy = scene.h / 2 - state.camera.y;
  const moving = Math.hypot(p.moveX, p.moveY) > 0.05;
  const skin = playerSkinMap[p.skin] || playerSkinMap.default;
  ctx.save();
  ctx.translate(ox + p.x, oy + p.y);
  ctx.scale(p.facing, 1);
  if (p.invuln > 0) {
    ctx.globalAlpha = 0.62 + Math.sin(state.elapsed * 46) * 0.24;
    ctx.shadowColor = "#fff2c7";
    ctx.shadowBlur = 18;
  } else {
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 14;
  }
  if (skin.animRow !== undefined && images.playerSkinWalks) {
    const frame = moving ? Math.floor(state.elapsed * 12) % PLAYER_SKIN_WALK.cols : 0;
    const sx = frame * PLAYER_SKIN_WALK.w;
    const sy = skin.animRow * PLAYER_SKIN_WALK.h;
    const bob = moving ? 0 : Math.sin(state.elapsed * 3.2) * 1.3;
    const h = skin.animH;
    const w = h;
    ctx.drawImage(images.playerSkinWalks, sx, sy, PLAYER_SKIN_WALK.w, PLAYER_SKIN_WALK.h, -w / 2, -h + 32 + bob, w, h);
  } else if (skin.sheet === "playerSkins" && images.playerSkins) {
    const bob = moving ? Math.sin(state.elapsed * 13) * 4 : Math.sin(state.elapsed * 3.2) * 1.5;
    const stretch = moving ? 1 + Math.sin(state.elapsed * 20) * 0.025 : 1;
    const h = skin.drawH * stretch;
    const w = h * (skin.w / skin.h);
    ctx.drawImage(images.playerSkins, skin.x, skin.y, skin.w, skin.h, -w / 2, -h + 30 + bob, w, h);
  } else {
    const row = moving ? 1 : 0;
    const frame = moving ? Math.floor(state.elapsed * 12) % 16 : Math.floor(state.elapsed * 3) % 4;
    const sx = frame * CHAR.w;
    const sy = row * CHAR.h;
    const w = skin.w;
    const h = skin.h;
    ctx.drawImage(images.characters, sx, sy, CHAR.w, CHAR.h, -w / 2, -h + 26, w, h);
  }
  ctx.restore();
}

function drawProjectiles() {
  const ox = scene.w / 2 - state.camera.x;
  const oy = scene.h / 2 - state.camera.y;
  for (const projectile of state.projectiles) {
    if (!onScreen(projectile.x, projectile.y, 100)) continue;
    const fx = projectile.type === "bottle"
      ? "rumBombFx"
      : projectile.type === "curseOrb"
        ? projectile.fx || "monkeyCurseOrb"
        : "coconutBoomerang";
    const size = projectile.type === "bottle" ? 58 : projectile.type === "curseOrb" ? 50 : 52;
    drawProjectileFx(fx, ox + projectile.x, oy + projectile.y, size, size, projectile.spin, 0.98);
  }
  if (state.weapons.compass.level > 0) {
    for (const point of compassPoints()) {
      drawProjectileFx("compassBolt", ox + point.x, oy + point.y, 54, 54, state.weapons.compass.angle, 0.9);
    }
  }
}

function drawWeaponEffects() {
  const ox = scene.w / 2 - state.camera.x;
  const oy = scene.h / 2 - state.camera.y;
  for (const zone of state.zones) {
    const a = clamp(zone.life / zone.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    if (zone.type === "slash") {
      ctx.translate(ox + zone.x, oy + zone.y);
      ctx.rotate(zone.angle);
      const slashSize = zone.radius * 1.85;
      drawPlayerEffectAt("cutlassAfterglow", -slashSize * 0.58, -slashSize * 0.64, slashSize * 1.28, slashSize * 1.28);
      drawProjectileFxAt("cutlassSlash", -slashSize * 0.42, -slashSize * 0.58, slashSize, slashSize);
    } else if (zone.type === "beam") {
      const bx = ox + (zone.x + zone.tx) / 2;
      const by = oy + (zone.y + zone.ty) / 2 - 48;
      const angle = Math.atan2(zone.ty - zone.y, zone.tx - zone.x);
      const len = Math.min(220, Math.hypot(zone.tx - zone.x, zone.ty - zone.y));
      ctx.translate(bx, by);
      ctx.rotate(angle);
      drawPlayerEffectAt("compassBeam", -len * 0.6, -70, len * 1.2, 140);
    } else if (zone.type === "explosion") {
      ctx.translate(ox + zone.x, oy + zone.y);
      const blastSize = zone.radius * 2.6;
      drawPlayerEffectAt("rumShockwave", -blastSize / 2, -blastSize / 2, blastSize, blastSize);
      drawProjectileFxAt("rumBombFx", -blastSize / 2, -blastSize / 2, blastSize, blastSize);
    } else if (zone.type === "curseBurst") {
      ctx.translate(ox + zone.x, oy + zone.y);
      const burstSize = zone.radius * 2.2;
      drawPlayerEffectAt("curseBurst", -burstSize * 0.56, -burstSize * 0.56, burstSize * 1.12, burstSize * 1.12);
      drawProjectileFxAt(zone.fx === "ghostCannonball" ? "ghostCannonball" : "monkeyCurseOrb", -burstSize / 2, -burstSize / 2, burstSize, burstSize);
    }
    ctx.restore();
  }
  if (state.weapons.rope.level > 0) {
    const p = state.player;
    const radius = 86 + state.weapons.rope.level * 14;
    drawRopeWard(ox + p.x, oy + p.y, radius, state.weapons.rope.level, state.weapons.rope.angle);
  }
}

function drawRopeWard(x, y, radius, level, angle) {
  const pulse = 1 + Math.sin(state.elapsed * 4.2) * 0.035;
  drawPlayerEffect("tidePulse", x, y, radius * 2.12 * pulse, radius * 2.12 * pulse, 0, 0.2);
  const count = Math.min(18, 10 + level * 2);
  for (let i = 0; i < count; i += 1) {
    const a = angle * 0.72 + (i / count) * Math.PI * 2;
    const ripple = Math.sin(state.elapsed * 5.4 + i * 0.9) * 3.5;
    const px = x + Math.cos(a) * (radius + ripple);
    const py = y + Math.sin(a) * (radius + ripple * 0.7);
    const size = 34 + level * 2 + Math.sin(state.elapsed * 4.8 + i) * 2;
    drawProjectileFx("ropeRing", px, py, size, size, a + Math.PI / 2, 0.68);
  }
}

function drawParticles() {
  const ox = scene.w / 2 - state.camera.x;
  const oy = scene.h / 2 - state.camera.y;
  for (const particle of state.particles) {
    const alpha = clamp(particle.life / 0.4, 0, 1);
    if (images.playerEffects) {
      const size = particle.size * 8.5;
      drawPlayerEffect("treasureGlint", ox + particle.x, oy + particle.y, size, size, particle.vx * 0.015, alpha * 0.34);
    } else {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(ox + particle.x, oy + particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawTexts() {
  const ox = scene.w / 2 - state.camera.x;
  const oy = scene.h / 2 - state.camera.y;
  ctx.save();
  ctx.textAlign = "center";
  for (const text of state.texts) {
    ctx.font = `900 ${text.size || 18}px Trebuchet MS, sans-serif`;
    ctx.globalAlpha = clamp(text.life / (text.maxLife || 0.9), 0, 1);
    ctx.fillStyle = text.color;
    ctx.strokeStyle = "rgba(0,0,0,0.65)";
    ctx.lineWidth = 4;
    ctx.strokeText(text.value, ox + text.x, oy + text.y);
    ctx.fillText(text.value, ox + text.x, oy + text.y);
  }
  ctx.restore();
}

function drawVignette() {
  const gradient = ctx.createRadialGradient(scene.w / 2, scene.h / 2, Math.min(scene.w, scene.h) * 0.2, scene.w / 2, scene.h / 2, Math.max(scene.w, scene.h) * 0.7);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(47,24,6,0.2)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, scene.w, scene.h);
}

function drawWarning() {
  ctx.save();
  ctx.globalAlpha = clamp(state.warningTimer / 2, 0, 1);
  ctx.fillStyle = "rgba(4, 9, 9, 0.35)";
  ctx.fillRect(0, scene.h * 0.42, scene.w, 76);
  ctx.fillStyle = "#fff2c7";
  ctx.textAlign = "center";
  ctx.font = "900 30px Trebuchet MS, sans-serif";
  ctx.fillText("MONKEY IDOL RISES", scene.w / 2, scene.h * 0.42 + 48);
  ctx.restore();
}

function drawItem(icon, x, y, w, h, rotation = 0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  drawItemAt(icon, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawProjectileFx(icon, x, y, w, h, rotation = 0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  drawProjectileFxAt(icon, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawPlayerEffect(icon, x, y, w, h, rotation = 0, alpha = 1) {
  if (!images.playerEffects) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  drawPlayerEffectAt(icon, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawPlayerEffectAt(icon, x, y, w, h) {
  if (!images.playerEffects) return;
  const src = playerEffectMap[icon] || playerEffectMap.ropeAura;
  ctx.drawImage(images.playerEffects, src.x * PLAYER_EFFECT_FX.w, src.y * PLAYER_EFFECT_FX.h, PLAYER_EFFECT_FX.w, PLAYER_EFFECT_FX.h, x, y, w, h);
}

function drawProjectileFxAt(icon, x, y, w, h) {
  const src = projectileFxMap[icon] || projectileFxMap.coconutBoomerang;
  ctx.drawImage(images.projectileFx, src.x * PROJECTILE_FX.w, src.y * PROJECTILE_FX.h, PROJECTILE_FX.w, PROJECTILE_FX.h, x, y, w, h);
}

function drawItemAt(icon, x, y, w, h) {
  if (projectileFxMap[icon]) {
    drawProjectileFxAt(icon, x, y, w, h);
    return;
  }
  if (newSpriteMap[icon]) {
    drawNewSpriteAt(icon, x, y, w, h);
    return;
  }
  if (gothicItemMap[icon]) {
    drawGothicItemAt(icon, x, y, w, h);
    return;
  }
  if (extraItemMap[icon]) {
    drawExtraItemAt(icon, x, y, w, h);
    return;
  }
  if (gothicPropMap[icon]) {
    drawGothicPropAt(icon, x, y, w, h);
    return;
  }
  if (beachPropMap[icon]) {
    drawBeachPropAt(icon, x, y, w, h);
    return;
  }
  const src = iconMap[icon] || iconMap.coin;
  ctx.drawImage(images.items, src.x * ITEM.w, src.y * ITEM.h, ITEM.w, ITEM.h, x, y, w, h);
}

function drawNewSpriteAt(icon, x, y, w, h) {
  const src = newSpriteMap[icon] || newSpriteMap.skullCoin;
  ctx.drawImage(images.newSprites, src.x * NEWSPRITE.w, src.y * NEWSPRITE.h, NEWSPRITE.w, NEWSPRITE.h, x, y, w, h);
}

function drawGothicItemAt(icon, x, y, w, h) {
  const src = gothicItemMap[icon] || gothicItemMap.bloodRose;
  ctx.drawImage(images.gothicItems, src.x * GOTHIC_ITEM.w, src.y * GOTHIC_ITEM.h, GOTHIC_ITEM.w, GOTHIC_ITEM.h, x, y, w, h);
}

function drawExtraItemAt(icon, x, y, w, h) {
  const src = extraItemMap[icon] || extraItemMap.cursedPearl;
  ctx.drawImage(images.extraItems, src.x * EXTRA_ITEM.w, src.y * EXTRA_ITEM.h, EXTRA_ITEM.w, EXTRA_ITEM.h, x, y, w, h);
}

function drawGothicPropAt(icon, x, y, w, h) {
  const src = gothicPropMap[icon] || gothicPropMap.gothicCandelabra;
  ctx.drawImage(images.gothicProps, src.x * GOTHIC_PROP.w, src.y * GOTHIC_PROP.h, GOTHIC_PROP.w, GOTHIC_PROP.h, x, y, w, h);
}

function drawBeachPropAt(icon, x, y, w, h) {
  const prop = beachPropMap[icon] || beachPropMap.clearPuddle;
  ctx.drawImage(images[prop.image], x, y, w, h);
}

function iconStyle(icon) {
  if (projectileFxMap[icon]) {
    const src = projectileFxMap[icon];
    const bx = src.x / (PROJECTILE_FX.cols - 1) * 100;
    const by = src.y / (PROJECTILE_FX.rows - 1) * 100;
    return `background-image:url('${imageSources.projectileFx}');background-size:400% 200%;background-position:${bx}% ${by}%;`;
  }
  if (newSpriteMap[icon]) {
    const src = newSpriteMap[icon];
    const bx = src.x / (NEWSPRITE.cols - 1) * 100;
    const by = src.y / (NEWSPRITE.rows - 1) * 100;
    return `background-image:url('assets/sprites/new_sprites_imagen_hd.webp');background-size:400% 200%;background-position:${bx}% ${by}%;`;
  }
  if (gothicItemMap[icon]) {
    const src = gothicItemMap[icon];
    const bx = src.x / (GOTHIC_ITEM.cols - 1) * 100;
    const by = src.y / (GOTHIC_ITEM.rows - 1) * 100;
    return `background-image:url('assets/sprites/gothic_items_hd_sheet.webp');background-size:400% 300%;background-position:${bx}% ${by}%;`;
  }
  if (extraItemMap[icon]) {
    const src = extraItemMap[icon];
    const bx = src.x / (EXTRA_ITEM.cols - 1) * 100;
    const by = src.y / (EXTRA_ITEM.rows - 1) * 100;
    return `background-image:url('${imageSources.extraItems}');background-size:400% 200%;background-position:${bx}% ${by}%;`;
  }
  if (gothicPropMap[icon]) {
    const src = gothicPropMap[icon];
    const bx = src.x / (GOTHIC_PROP.cols - 1) * 100;
    const by = src.y / (GOTHIC_PROP.rows - 1) * 100;
    return `background-image:url('assets/sprites/gothic_props_hd_sheet.webp');background-size:400% 200%;background-position:${bx}% ${by}%;`;
  }
  if (beachPropMap[icon]) {
    const prop = beachPropMap[icon];
    return `background-image:url('${imageSources[prop.image]}');background-size:contain;background-repeat:no-repeat;background-position:center;`;
  }
  const src = iconMap[icon] || iconMap.coin;
  const bx = src.x / (ITEM.cols - 1) * 100;
  const by = src.y * 100;
  return `background-image:url('assets/sprites/scene_items_imagen_hd_sheet.webp');background-size:400% 200%;background-position:${bx}% ${by}%;`;
}

function compassPoints() {
  const p = state.player;
  const level = state.weapons.compass.level;
  const count = Math.min(4, 1 + Math.floor((level + 1) / 2));
  const radius = 82 + level * 7;
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const a = state.weapons.compass.angle + (i / count) * Math.PI * 2;
    points.push({ x: p.x + Math.cos(a) * radius, y: p.y + Math.sin(a) * radius });
  }
  return points;
}

function nearestEnemy(exclude = null) {
  let best = null;
  let bestDist = Infinity;
  const p = state.player;
  for (const enemy of state.enemies) {
    if (enemy === exclude || enemy.hp <= 0) continue;
    const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
    if (d < bestDist) {
      best = enemy;
      bestDist = d;
    }
  }
  return best;
}

function floatingText(value, x, y, color, life = 0.9, size = 18) {
  state.texts.push({ value, x, y, color, life, maxLife: life, size });
}

function shake(power) {
  state.camera.x += (Math.random() - 0.5) * power * 12;
  state.camera.y += (Math.random() - 0.5) * power * 12;
}

function onScreen(x, y, margin = 0) {
  return Math.abs(x - state.camera.x) < scene.w / 2 + margin && Math.abs(y - state.camera.y) < scene.h / 2 + margin;
}

function updateSceneViewport() {
  scene.zoom = getSceneZoom();
  scene.w = viewW / scene.zoom;
  scene.h = viewH / scene.zoom;
}

function getSceneZoom() {
  const coarsePointer = window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches;
  const mobileSized = Math.min(viewW, viewH) <= 520 || Math.max(viewW, viewH) <= 920;
  if (coarsePointer || mobileSized) {
    return viewW > viewH ? 0.48 : 0.54;
  }
  if (viewW < 980) return 0.76;
  return 0.82;
}

function syncCanvasSize() {
  const nextDpr = Math.min(2, window.devicePixelRatio || 1);
  const nextW = window.innerWidth;
  const nextH = window.innerHeight;
  if (
    nextDpr === dpr
    && nextW === viewW
    && nextH === viewH
    && canvas.width === Math.floor(viewW * dpr)
    && canvas.height === Math.floor(viewH * dpr)
  ) {
    updateSceneViewport();
    return false;
  }
  dpr = nextDpr;
  viewW = nextW;
  viewH = nextH;
  canvas.width = Math.floor(viewW * dpr);
  canvas.height = Math.floor(viewH * dpr);
  canvas.style.width = `${viewW}px`;
  canvas.style.height = `${viewH}px`;
  updateSceneViewport();
  return true;
}

function resize() {
  syncCanvasSize();
  render();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function positiveModulo(value, modulo) {
  return ((value % modulo) + modulo) % modulo;
}

function shortAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function hash2(x, y) {
  let n = x * 374761393 + y * 668265263;
  n = (n ^ (n >> 13)) * 1274126177;
  return (n ^ (n >> 16)) >>> 0;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function cryptoId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

window.addEventListener("resize", resize);

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (handleUpgradeKey(event)) return;
  keys.add(key);
  if (key === " " || key === "shift") {
    event.preventDefault();
    dash();
  }
  if (key === "p" || key === "escape") togglePause();
  if (key === "m") toggleMute();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

ui.startButton.addEventListener("click", () => startGame());
ui.quickButton.addEventListener("click", () => startGame({ quick: true }));
ui.restartButton.addEventListener("click", () => startGame({ quick: quickMode }));
ui.skinPicker.addEventListener("click", (event) => {
  const button = event.target.closest("[data-skin]");
  if (!button) return;
  setPlayerSkin(button.dataset.skin);
});
ui.mapPicker.addEventListener("click", (event) => {
  const button = event.target.closest("[data-map]");
  if (!button) return;
  setSelectedMap(button.dataset.map);
});
ui.pauseButton.addEventListener("click", togglePause);
ui.audioButton.addEventListener("click", toggleMute);
ui.fullscreenButton.addEventListener("click", toggleFullscreen);
ui.dashButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  dash();
});

function togglePause() {
  if (state.phase === "playing") {
    state.phase = "paused";
    playSound("confirm");
    speak("Pause.", { key: "pause", interrupt: true, cooldown: 0 });
  } else if (state.phase === "paused") {
    state.phase = "playing";
    lastTime = performance.now();
    playSound("confirm");
    speak("Weiter geht's.", { key: "resume", interrupt: true, cooldown: 0 });
  }
  updateDom();
}

function toggleMute() {
  muted = !muted;
  if (muted) {
    cancelSpeech();
  } else {
    speak("Audio und Stimme an.", { key: "audio-on", interrupt: true, cooldown: 0 });
  }
  syncMusic();
  updateDom();
}

function toggleFullscreen() {
  if (!document.fullscreenEnabled) return;
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

document.addEventListener("fullscreenchange", () => {
  resize();
  updateDom();
});

window.addEventListener("pointerdown", handleWorldPointerDown, { passive: false });
window.addEventListener("pointermove", handleWorldPointerMove, { passive: false });
window.addEventListener("pointerup", resetStick, { passive: false });
window.addEventListener("pointercancel", resetStick, { passive: false });

function handleWorldPointerDown(event) {
  if (event.pointerType === "mouse") return;
  if (state.phase !== "playing") return;
  if (event.target.closest("button, .overlay")) return;
  event.preventDefault();
  startStick(event);
}

function handleWorldPointerMove(event) {
  if (!pointer.active || pointer.id !== event.pointerId) return;
  event.preventDefault();
  updateStick(event);
}

function startStick(event) {
  pointer.active = true;
  pointer.id = event.pointerId;
  pointer.originX = clamp(event.clientX, 58, Math.max(58, viewW - 58));
  pointer.originY = clamp(event.clientY, 68, Math.max(68, viewH - 68));
  ui.stickBase.classList.add("active");
  const baseSize = ui.stickBase.offsetWidth || 112;
  ui.stickBase.style.left = `${pointer.originX - baseSize / 2}px`;
  ui.stickBase.style.top = `${pointer.originY - baseSize / 2}px`;
  updateStick(event);
}

function updateStick(event) {
  const dx = event.clientX - pointer.originX;
  const dy = event.clientY - pointer.originY;
  const len = Math.min(pointer.radius, Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx);
  const nx = Math.cos(angle) * len;
  const ny = Math.sin(angle) * len;
  pointer.dx = nx / pointer.radius;
  pointer.dy = ny / pointer.radius;
  ui.stickKnob.style.transform = `translate(${nx}px, ${ny}px)`;
}

function resetStick(event) {
  if (event && pointer.id !== event.pointerId) return;
  if (event && pointer.active) event.preventDefault();
  pointer.active = false;
  pointer.id = null;
  pointer.dx = 0;
  pointer.dy = 0;
  pointer.originX = 0;
  pointer.originY = 0;
  ui.stickBase.classList.remove("active");
  ui.stickKnob.style.transform = "translate(0, 0)";
}

window.__MONKEY_TIDE_START = () => startGame({ quick: true });
window.__MONKEY_TIDE_STEP = (seconds = 5) => {
  const steps = Math.ceil(seconds * 60);
  for (let i = 0; i < steps && state.phase === "playing"; i += 1) update(1 / 60);
  render();
  return window.__MONKEY_TIDE_DEBUG();
};
window.__MONKEY_TIDE_FORCE_LEVELUP = () => {
  if (state.phase !== "playing") state.phase = "playing";
  levelUp({ forceChoice: true });
  render();
  return window.__MONKEY_TIDE_DEBUG();
};
window.__MONKEY_TIDE_SET_MAP = (id) => {
  if (mapUnlocked(id)) setSelectedMap(id);
  return window.__MONKEY_TIDE_DEBUG();
};
window.__MONKEY_TIDE_SPAWN_ENEMY = (id, x = state.player.x + 260, y = state.player.y, boss = false) => {
  const type = enemyType(id);
  const scaledHp = type.hp * (1 + state.elapsed / BALANCE.enemyHpGrowth) * (boss ? BALANCE.bossHpMult : 1);
  const enemy = {
    id: cryptoId(),
    type,
    x: clamp(x, 80, WORLD.w - 80),
    y: clamp(y, 80, WORLD.h - 80),
    hp: scaledHp,
    maxHp: scaledHp,
    r: type.radius * (boss ? 1.25 : 1),
    speed: type.speed * (1 + state.elapsed / BALANCE.enemySpeedGrowth),
    damage: type.damage,
    row: type.row,
    frameOffset: Math.floor(Math.random() * 16),
    hit: 0,
    boss,
    shootTimer: 0.8 + Math.random() * 1.2,
  };
  if (!actorIgnoresObstacles(enemy)) resolveObstacleCollisions(enemy, enemy.r);
  state.enemies.push(enemy);
  return window.__MONKEY_TIDE_DEBUG();
};
window.__MONKEY_TIDE_OBSTACLE_PROBE = () => {
  if (state.phase !== "playing") state.phase = "playing";
  const p = state.player;
  const original = { x: p.x, y: p.y };
  const obstacle = {
    x: clamp(p.x + 220, 240, WORLD.w - 240),
    y: p.y,
    icon: "hedgeCluster",
    scale: 1.18,
    spin: 0,
    interactive: false,
    blocking: true,
    probe: true,
  };
  state.props.push(obstacle);
  const before = { x: p.x, y: p.y };
  for (let i = 0; i < 30; i += 1) moveActorWithObstacles(p, 520, 0, 1 / 60, p.r);
  const ground = { type: enemyType("reefRaider"), x: obstacle.x, y: obstacle.y, r: enemyType("reefRaider").radius };
  resolveObstacleCollisions(ground, ground.r);
  const ghost = { type: enemyType("lanternWraith"), x: obstacle.x, y: obstacle.y, r: enemyType("lanternWraith").radius };
  if (!actorIgnoresObstacles(ghost)) resolveObstacleCollisions(ghost, ghost.r);
  const playerContainment = obstacleContainment(p, obstacle, p.r);
  const groundContainment = obstacleContainment(ground, obstacle, ground.r);
  const ghostContainment = obstacleContainment(ghost, obstacle, ghost.r);
  const outsideObstacle = 0.985;
  render();
  return {
    before,
    after: { x: p.x, y: p.y },
    obstacle: { x: obstacle.x, y: obstacle.y },
    playerContainment,
    groundContainment,
    ghostContainment,
    playerBlocked: playerContainment >= outsideObstacle && p.x < obstacle.x,
    playerStayedOnApproachSide: p.x < obstacle.x,
    groundPushed: groundContainment >= outsideObstacle,
    ghostCanPass: actorIgnoresObstacles(ghost) && ghostContainment < 1,
    playerMoved: Math.hypot(p.x - original.x, p.y - original.y) > 8,
    blockingProps: state.props.filter(propBlocksMovement).length,
  };
};
window.__MONKEY_TIDE_PROGRESS_PROBE = () => {
  if (state.phase !== "playing") state.phase = "playing";
  spawnPowerup(state.player.x + 36, state.player.y, "rumRush");
  spawnPowerup(state.player.x + 72, state.player.y, "blackPowder");
  spawnPowerup(state.player.x + 108, state.player.y, "pearlMagnet");
  for (const gem of state.gems.filter((gem) => gem.kind === "powerup")) collectGem(gem);
  metaProgress.landmarks = Math.max(metaProgress.landmarks, 4);
  metaProgress.bestSurvival = Math.max(metaProgress.bestSurvival, 160);
  metaProgress.kills = Math.max(metaProgress.kills, 40);
  metaProgress.bestStreak = Math.max(metaProgress.bestStreak, 12);
  unlockAchievements();
  saveMetaProgress();
  renderMapPicker();
  renderMetaProgress();
  render();
  return window.__MONKEY_TIDE_DEBUG();
};
window.__MONKEY_TIDE_DEBUG = () => {
  const resized = syncCanvasSize();
  if (resized) render();
  return ({
  ready,
  phase: state.phase,
  elapsed: state.elapsed,
  level: state.level,
  enemies: state.enemies.length,
  projectiles: state.projectiles.length,
  gems: state.gems.length,
  kills: state.killCount,
  hp: state.player.hp,
  bosses: state.enemies.filter((enemy) => enemy.boss).map((enemy) => enemy.type.id),
  player: { x: state.player.x, y: state.player.y, skin: state.player.skin },
  playerSkin: state.player.skin,
  playerSkinName: playerSkinMap[state.player.skin]?.name || playerSkinMap.default.name,
  playerSkinTypes: playerSkinIds,
  playerSkinAsset: !!images.playerSkins,
  playerSkinAnimationAsset: !!images.playerSkinWalks,
  playerSkinSelectAsset: !!images.playerSkinSelect,
  playerSkinAnimationFrames: { cols: PLAYER_SKIN_WALK.cols, rows: PLAYER_SKIN_WALK.rows },
  playerSkinAnimated: playerSkinMap[state.player.skin]?.animRow !== undefined && !!images.playerSkinWalks,
  stats: { ...state.stats, nextXp: state.nextXp },
  engagement: { streak: { ...state.streak }, activeUpgradeChoices: activeUpgradeChoices.map((upgrade) => upgrade.id), selectedUpgradeIndex },
  map: {
    selected: state.map,
    selectedName: mapVariant(state.map).name,
    selectedBackground: mapVariant(state.map).background,
    selectedMusic: mapMusicProfile(state.map),
    variants: mapVariants.map((map) => map.id),
    backgrounds: Object.fromEntries(mapVariants.map((map) => [map.id, map.background])),
    musicProfiles: Object.fromEntries(mapVariants.map((map) => [map.id, mapMusicProfile(map.id)])),
    unlocked: [...metaProgress.unlockedMaps],
  },
  powerups: {
    active: state.powerups.map((powerup) => ({ id: powerup.id, timer: powerup.timer })),
    types: powerUpTypes.map((powerup) => powerup.id),
    collectedThisRun: state.runStats.powerups,
    dropCooldown: state.powerupDropCooldown,
    randomDropChance: powerupDropTuning.randomDropChance,
    streakDropEvery: powerupDropTuning.streakDropEvery,
    combatCooldown: powerupDropTuning.combatCooldown,
    magnetRange: powerupDropTuning.magnetRange,
  },
  levelFlow: { flowRewards: state.runStats.flowRewards, choiceLevels: [2, 6, 10, 14, 18], reducedInterruptions: true },
  progression: {
    kills: metaProgress.kills,
    landmarks: metaProgress.landmarks,
    powerups: metaProgress.powerups,
    bestSurvival: metaProgress.bestSurvival,
    achievements: { ...metaProgress.achievements },
    unlockedRelics: [...metaProgress.unlockedRelics],
  },
  upgradeIcons: Object.fromEntries(upgrades.map((upgrade) => [upgrade.id, upgrade.icon])),
  weaponLoadoutIcons: Object.fromEntries(weaponLoadoutItems.map(([id, , icon]) => [id, icon])),
  ropeVisual: { renderMode: "ropeWardSprites", sprite: "ropeRing", pulse: "tidePulse" },
  uiIconSources: {
    projectileFxIcons: ["coconutBoomerang", "ropeRing"].every((icon) => iconStyle(icon).includes(imageSources.projectileFx)),
  },
  balance: { ...BALANCE },
  pointer: { active: pointer.active, dx: pointer.dx, dy: pointer.dy },
  scene: { zoom: scene.zoom, w: scene.w, h: scene.h },
  obstacles: {
    blockingProps: state.props.filter(propBlocksMovement).length,
    blockingPropTypes: [...new Set(state.props.filter(propBlocksMovement).map((prop) => prop.icon))],
    obstacleShapes: Object.keys(blockingPropShapes),
    passThroughEnemyTypes: enemyTypes.filter((type) => type.phase || type.flying).map((type) => type.id),
    phasingEnemyTypes: enemyTypes.filter((type) => type.phase).map((type) => type.id),
    flyingEnemyTypes: enemyTypes.filter((type) => type.flying).map((type) => type.id),
    groundedEnemyTypes: enemyTypes.filter((type) => !type.phase && !type.flying).map((type) => type.id),
  },
  fullscreenSupported: document.fullscreenEnabled,
  preloadedAssetKeys: Object.keys(imageSources),
  loading: { ...loadingState },
  audio: {
    mainVolume: music?.volume ?? 0,
    rushVolume: rushMusic?.volume ?? 0,
    activeTrack: activeMusicTrack,
    tracksPlaying: {
      main: music ? !music.paused : false,
      rush: rushMusic ? !rushMusic.paused : false,
    },
    overlapSafe: !music || !rushMusic || music.paused || rushMusic.paused || music.volume === 0 || rushMusic.volume === 0,
    sfx: Object.fromEntries(Object.entries(soundConfig).map(([key, config]) => [key, config.volume])),
    sfxLocalDownloads: Object.entries(audioSources)
      .filter(([key]) => !key.startsWith("bgm"))
      .every(([, src]) => src.includes("/from-downloads/")),
    sources: { ...audioSources },
    music: { ...musicConfig, ...mapMusicProfile(state.map), trackKeys: { ...musicTrackKeys } },
  },
  speech: {
    supported: speechState.supported,
    voice: speechState.voice ? `${speechState.voice.name} (${speechState.voice.lang})` : null,
    muted,
  },
  crossoverAssets: {
    gothicEnemies: !!images.gothicEnemies,
    gothicItems: !!images.gothicItems,
    gothicProps: !!images.gothicProps,
    gothicEnemyTypes: enemyTypes.filter((type) => type.gothicRow !== undefined).map((type) => type.id),
    gothicPropTypes: Object.keys(gothicPropMap),
    gothicItemTypes: Object.keys(gothicItemMap),
    spectralCaptain: !!images.spectralCaptain,
    bossTypes: enemyTypes.filter((type) => type.sprite === "monkeyIdol" || type.captainSheet || type.bossCandidate).map((type) => type.id),
  },
  extraAssets: {
    extraEnemies: !!images.extraEnemies,
    extraItems: !!images.extraItems,
    extraEnemyTypes: enemyTypes.filter((type) => type.extraSprite).map((type) => type.id),
    extraItemTypes: Object.keys(extraItemMap),
    extraUpgradeTypes: upgrades.filter((upgrade) => extraItemMap[upgrade.icon]).map((upgrade) => upgrade.id),
  },
  explorationAssets: {
    beachProps: Object.values(beachPropMap).every((prop) => !!images[prop.image]),
    beachPropTypes: Object.keys(beachPropMap),
    beachPropAssetKeys: [...new Set(Object.values(beachPropMap).map((prop) => prop.image))],
    interactiveProps: state.props.filter((prop) => prop.interactive).length,
    discoveredProps: state.props.filter((prop) => prop.discovered).length,
  },
  combatAssets: {
    projectileFx: !!images.projectileFx,
    playerEffects: !!images.playerEffects,
    projectileFxTypes: Object.keys(projectileFxMap),
    playerEffectTypes: Object.keys(playerEffectMap),
    enemyProjectiles: state.projectiles.filter((projectile) => projectile.type === "curseOrb").length,
  },
  weapons: Object.fromEntries(Object.entries(state.weapons).map(([key, value]) => [key, value.level])),
  });
};

boot().catch((error) => {
  ui.loadingText.textContent = "Assets konnten nicht geladen werden";
  console.error(error);
});
