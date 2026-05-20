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
  metaSkills: document.getElementById("metaSkills"),
  endMetaSkills: document.getElementById("endMetaSkills"),
  cornerControls: document.getElementById("cornerControls"),
  touchControls: document.getElementById("touchControls"),
  playerLabel: document.getElementById("playerLabel"),
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
  repeatBeach: "assets/backgrounds/topdown_beach_repeatable_clean_hd.jpg",
  mapMoonlitLagoon: "assets/backgrounds/map_moonlit_lagoon_hd.jpg",
  mapGothicCove: "assets/backgrounds/map_gothic_cove_hd.jpg",
  mapTreasureAtoll: "assets/backgrounds/map_treasure_atoll_hd.jpg",
  characters: "assets/sprites/characters_imagen_hd_sheet.webp",
  playerSkins: "assets/sprites/player_skins_imagen_hd_clean_v2.webp?v=star-farmboy-static-headroom-v1",
  playerSkinWalks: "assets/sprites/player_skin_walkcycles_imagen_hd_clean_v6.png?v=alucard-foot-clean-v1",
  playerSkinSelect: "assets/sprites/player_skin_select_imagen_hd_clean_v4.webp?v=alucard-select-clean-v1",
  fighterWalks: "assets/sprites/fighters_walkcycles_imagen_hd_clean_v2.png?v=fighters-slice-repair-v2",
  fighterSelect: "assets/sprites/fighters_select_imagen_hd.png?v=fighters-imagen-v1",
  ryuActions: "assets/sprites/ryu_action_sheet_imagen_hd_v4.png?v=ryu-action-v4",
  ryuHadokenFx: "assets/sprites/ryu_hadoken_fx_imagen_hd_v3.png?v=ryu-hadoken-v3",
  guileActions: "assets/sprites/guile_action_sheet_imagen_hd_clean_v2.png?v=guile-action-clean-v2",
  chunLiActions: "assets/sprites/chun_li_action_sheet_imagen_hd_v2.png?v=chun-li-action-v2",
  chunLiProjectiles: "assets/sprites/chun_li_projectile_fx_imagen_hd_v2.png?v=chun-li-projectiles-v2",
  samMaxDuo: "assets/sprites/sam_max_duo_fixed_hd.png",
  samMaxDuoWalk: "assets/sprites/sam_max_duo_walk_imagen_hd.webp",
  items: "assets/sprites/scene_items_imagen_hd_sheet.webp",
  newSprites: "assets/sprites/new_sprites_imagen_hd.webp",
  enemyAnimSheet: "assets/sprites/enemy_anim_imagen_hd_sheet_clean_v4.png?v=slice-repair-v4",
  gothicEnemies: "assets/sprites/gothic_enemies_hd_sheet_clean_v2.png?v=slice-clean-v2",
  gothicEnemyAnimSheet: "assets/sprites/gothic_enemy_anim_imagen_hd_clean_v4.png?v=gothic-gargoyle-repair-v4",
  gothicItems: "assets/sprites/gothic_items_hd_sheet.webp",
  gothicProps: "assets/sprites/gothic_props_hd_sheet.webp",
  spectralCaptain: "assets/sprites/spectral_captain_hd_sheet.webp",
  threeHeadedMonkey: "assets/sprites/bosses/three_headed_monkey_imagen_hd.webp",
  blackbeard: "assets/sprites/bosses/blackbeard_imagen_hd.webp",
  threeHeadedMonkeyAnim: "assets/sprites/bosses/three_headed_monkey_anim_imagen_hd.webp",
  blackbeardAnim: "assets/sprites/bosses/blackbeard_anim_imagen_hd.webp",
  timeTentacleAnim: "assets/sprites/bosses/time_tentacle_anim_imagen_hd.webp?v=time-tentacle-v1",
  newEnemyTrio: "assets/sprites/new_enemy_trio_imagen_hd_sheet_clean_v2.png?v=slice-clean-v2",
  platformerEnemies: "assets/sprites/platformer_enemy_anim_imagen_hd.png?v=imagen-platformer-v1",
  beachClearPuddle: "assets/sprites/beach-props-v2/clear_puddle.webp",
  beachTidePuddle: "assets/sprites/beach-props-v2/tide_puddle.webp",
  beachHedgeCluster: "assets/sprites/beach-props-v2/hedge_cluster.webp?v=clean-hedges",
  beachPalmHedge: "assets/sprites/beach-props-v2/palm_hedge.webp?v=clean-hedges",
  beachPalmTree: "assets/sprites/beach-props-v2/palm_tree_imagen_hd.png?v=single-palm",
  beachTreasure: "assets/sprites/beach-props-v2/buried_treasure.webp",
  beachOpenTreasure: "assets/sprites/beach-props-v2/open_treasure_chest_imagen_hd.webp",
  beachConchShrine: "assets/sprites/beach-props-v2/conch_shrine.webp",
  beachHut: "assets/sprites/beach-props-v2/beach_hut.webp",
  beachBoatWreck: "assets/sprites/beach-props-v2/boat_wreck.webp",
  projectileFx: "assets/sprites/projectile_fx_imagen_hd.webp",
  playerEffects: "assets/sprites/player_effects_imagen_hd.webp",
  weaponEvolutionFx: "assets/sprites/weapon_evolution_fx_imagen_hd.png",
  fusionRelics: "assets/sprites/fusion_relics_imagen_hd_clean.png?v=fusion-relics-v1",
  signatureWeapons: "assets/sprites/signature_weapons_imagen_hd.png?v=signature-weapons-v1",
  sonicBoomFx: "assets/sprites/sonic_boom_fx_imagen_hd.png?v=sonic-boom-v1",
  xpCrystalAnim: "assets/sprites/xp_crystal_anim_imagen_hd.png?v=imagen-xp-v1",
  xpCrystalGreenAnim: "assets/sprites/xp_crystal_green_anim_imagen_hd.png?v=xp-color-v1",
  xpCrystalRedAnim: "assets/sprites/xp_crystal_red_anim_imagen_hd.png?v=xp-color-v1",
  extraEnemies: "assets/sprites/extra_enemies_imagen_hd_clean.png?v=slice-clean-v1",
  extraItems: "assets/sprites/extra_items_imagen_hd.webp",
};

const audioSources = {
  bgmMain: "assets/audio/bgm/tidebarrel-dockside-drive.mp3",
  bgmRush: "assets/audio/bgm/black-chapel-gate-drive.mp3",
  bgmCaper: "assets/audio/bgm/turbo-banana-cup-drive.mp3",
  bgmShoreline: "assets/audio/bgm/treasure-tide-route-drive.mp3",
  bgmVoodoo: "assets/audio/bgm/voodoo-hut-shuffle-drive.mp3",
  bgmCathedral: "assets/audio/bgm/cathedral-hunt-overture-drive.mp3",
  bgmCurseMonkey: "assets/audio/bgm/curse-monkey-frenzy-drive.mp3",
  bgmGargoyle: "assets/audio/bgm/gargoyle-chapel-run.mp3",
  bgmCrimson: "assets/audio/bgm/crimson-galleon.mp3",
  bgmCoconut: "assets/audio/bgm/coconut-caper-loop.mp3",
  bgmRumRiddle: "assets/audio/bgm/shoreline-rum-riddle.mp3",
  bgmRyuSignature: "assets/audio/bgm/sf-ryu-dojo-crash-duel.mp3",
  bgmKenSignature: "assets/audio/bgm/sf-ken-steel-punch-parade.mp3",
  bgmGuileSignature: "assets/audio/bgm/sf-guile-jet-fuel-glory.mp3",
  bgmChunLiSignature: "assets/audio/bgm/sf-chun-li-bamboo-arcade.mp3",
  bgmStreetRush: "assets/audio/bgm/sf-rush-gasket-thunder.mp3",
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
  quickCutlass: "assets/audio/sfx/from-downloads/quick-cutlass.mp3",
  cutlassImpact: "assets/audio/sfx/from-downloads/cutlass-hit-goofy.mp3",
  cannonFire: "assets/audio/sfx/from-downloads/cartoon-cannon-fire.mp3",
  voodooMagic: "assets/audio/sfx/from-downloads/voodoo-magic-pop.mp3",
  brightGem: "assets/audio/sfx/from-downloads/bright-gem-pickup.mp3",
  doubloonPing: "assets/audio/sfx/from-downloads/doubloon-ping.mp3",
  healSparkle: "assets/audio/sfx/from-downloads/healing-sparkle.mp3",
  treasureClink: "assets/audio/sfx/from-downloads/treasure-clink.mp3",
  mapRustle: "assets/audio/sfx/from-downloads/parchment-map-unroll.mp3",
  cursedBossDrop: "assets/audio/sfx/from-downloads/cursed-boss-drop.mp3",
  ghostAnchorHit: "assets/audio/sfx/from-downloads/ghost-anchor-hit.mp3",
  seaMonsterPop: "assets/audio/sfx/from-downloads/sea-monster-pop.mp3",
  dashWhooshFast: "assets/audio/sfx/from-downloads/dash-whoosh-fast.mp3",
  pirateUiClick: "assets/audio/sfx/from-downloads/pirate-ui-click.mp3",
  treasureMapMagic: "assets/audio/sfx/from-downloads/treasure-map-magic.mp3",
  slashSwish: "assets/audio/sfx/downloaded/haunted-pirate-swish.mp3",
  monsterPop: "assets/audio/sfx/downloaded/cartoon-pirate-pop.mp3",
  heavyHit: "assets/audio/sfx/downloaded/heavy-cursed-hit.mp3",
  upgradeMagic: "assets/audio/sfx/downloaded/magical-upgrade-card.mp3",
  bossWarningCursed: "assets/audio/sfx/downloaded/cursed-boss-warning.mp3",
  bossDownUndead: "assets/audio/sfx/downloaded/undead-pirate-down.mp3",
  curseMonkeySwipe: "assets/audio/sfx/curse-monkey/bone-swipe.mp3",
  curseMonkeyDash: "assets/audio/sfx/curse-monkey/fast-dash-whoosh.mp3",
  curseMonkeyHit: "assets/audio/sfx/curse-monkey/purple-curse-hit.mp3",
  curseMonkeyChatter: "assets/audio/sfx/curse-monkey/tropical-chatter.mp3",
  curseMonkeyPower: "assets/audio/sfx/curse-monkey/pirate-powerup.mp3",
  curseMonkeyWarning: "assets/audio/sfx/curse-monkey/spooky-warning.mp3",
  curseMonkeyBossDown: "assets/audio/sfx/curse-monkey/boss-drop.mp3",
};

const images = {};
const soundPools = {};
const soundLastPlayed = new Map();
const soundConfig = {
  pickup: { volume: 0.2, cooldown: 190 },
  chime: { volume: 0.22, cooldown: 440 },
  gate: { volume: 0.22, cooldown: 520 },
  confirm: { volume: 0.2, cooldown: 160 },
  downloadPickup: { volume: 0.22, cooldown: 190 },
  downloadDash: { volume: 0.26, cooldown: 300 },
  downloadHit: { volume: 0.28, cooldown: 300 },
  downloadUpgrade: { volume: 0.3, cooldown: 520 },
  downloadBossWarning: { volume: 0.34, cooldown: 12000 },
  downloadBossDown: { volume: 0.36, cooldown: 1800 },
  quickCutlass: { volume: 0.3, cooldown: 92 },
  cutlassImpact: { volume: 0.28, cooldown: 130 },
  cannonFire: { volume: 0.34, cooldown: 220 },
  voodooMagic: { volume: 0.3, cooldown: 420 },
  brightGem: { volume: 0.22, cooldown: 115 },
  doubloonPing: { volume: 0.22, cooldown: 115 },
  healSparkle: { volume: 0.25, cooldown: 300 },
  treasureClink: { volume: 0.28, cooldown: 300 },
  mapRustle: { volume: 0.22, cooldown: 360 },
  cursedBossDrop: { volume: 0.36, cooldown: 1700 },
  ghostAnchorHit: { volume: 0.3, cooldown: 280 },
  seaMonsterPop: { volume: 0.28, cooldown: 300 },
  dashWhooshFast: { volume: 0.3, cooldown: 170 },
  pirateUiClick: { volume: 0.2, cooldown: 120 },
  treasureMapMagic: { volume: 0.32, cooldown: 400 },
  slashSwish: { volume: 0.28, cooldown: 92 },
  monsterPop: { volume: 0.25, cooldown: 220 },
  heavyHit: { volume: 0.34, cooldown: 360 },
  upgradeMagic: { volume: 0.32, cooldown: 480 },
  bossWarningCursed: { volume: 0.34, cooldown: 7000 },
  bossDownUndead: { volume: 0.36, cooldown: 1700 },
  curseMonkeySwipe: { volume: 0.3, cooldown: 92 },
  curseMonkeyDash: { volume: 0.3, cooldown: 220 },
  curseMonkeyHit: { volume: 0.3, cooldown: 250 },
  curseMonkeyChatter: { volume: 0.24, cooldown: 260 },
  curseMonkeyPower: { volume: 0.32, cooldown: 420 },
  curseMonkeyWarning: { volume: 0.34, cooldown: 6500 },
  curseMonkeyBossDown: { volume: 0.36, cooldown: 1600 },
};
const musicConfig = {
  main: 0.44,
  maxMain: 0.46,
  mainRushDuck: 0.06,
  rush: 0.4,
  maxRush: 0.42,
  rushStart: 112,
  rushFade: 74,
};
const LOW_LATENCY_MUSIC_START = true;
let music = null;
let rushMusic = null;
let activeMusicTrack = null;
let armedMusicTrack = null;
let musicTrackKeys = { main: null, rush: null };
let musicTrackMeta = { main: { startAt: 0, rate: 1 }, rush: { startAt: 0, rate: 1 } };
const warmedMusicKeys = new Set();
const musicPreloadState = { ready: false, loaded: 0, total: 0, decoded: 0, failed: [], keys: [] };
let sfxAudioContext = null;
const sfxBuffers = new Map();
const sfxBufferPromises = new Map();
const musicBuffers = new Map();
const musicBufferPromises = new Map();
const musicWebTracks = { main: null, rush: null };
const loadedImageKeys = new Set();
const imageLoadPromises = new Map();
const deferredAssetState = {
  mobileFastPath: false,
  imageTotal: 0,
  imageLoaded: 0,
  musicTotal: 0,
  musicLoaded: 0,
  queuedImages: [],
  bootImages: [],
  bootMusic: [],
};
let menuMusicPrimePromise = Promise.resolve();
let muted = false;
let audioGestureUnlocked = false;
let soundPoolsPrimed = false;
let lastMusicStartLatencyMs = 0;
let lastRenderTime = 0;
let lastUpdateTime = 0;
let skippedRenderFrames = 0;
let skippedUpdateFrames = 0;
const sfxDebug = { attempts: 0, started: 0, blocked: 0, lastKey: null, lastVolume: 0 };
const sfxUnlockState = { attempts: 0, started: 0, blocked: 0 };
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
const mobileDisplayState = {
  requested: false,
  orientationPreference: "portrait-primary",
  orientationFallback: "portrait",
  orientationRequested: null,
  orientationLocked: false,
  orientationError: null,
  fullscreenRequested: false,
  fullscreenAvailable: false,
  fullscreenError: null,
};
const loadingState = { loaded: 0, total: 0, last: "" };
const MOBILE_PERF = {
  dpr: 1,
  enemyCap: 62,
  particleCap: 16,
  textCap: 8,
  projectileCap: 72,
  propChunkRadius: 2,
  propPruneRadius: 4,
  textMin: 24,
  renderFrameMs: 1000 / 36,
  updateFrameMs: 1000 / 40,
};
const PERF_GUARDS = {
  desktopEnemyCap: 126,
  desktopEnemyRenderBudget: 76,
  desktopProjectileCap: 130,
  desktopParticleCap: 48,
  desktopTextCap: 24,
  desktopRenderFrameMs: 1000 / 50,
  desktopUpdateFrameMs: 1000 / 50,
  mobileEnemyRenderBudget: 34,
  trimBuffer: 10,
};
const CONTROL_TUNING = {
  baseSpeed: 348,
  dashCooldown: 0.38,
  dashDuration: 0.3,
  dashBoost: 3.75,
  cameraCatchup: 18,
  stickDeadzone: 0.025,
  stickFullAt: 0.46,
  stickCurve: 0.34,
};
const ENEMY_TUNING = {
  visualScale: 1.32,
  hitboxScale: 1.14,
  animatedVisualBoost: 1.16,
  minAnimatedVisualHeight: 96,
  minAnimatedVisualRadiusRatio: 3.65,
  pressureWaveDesktopCap: 8,
  pressureWaveMobileCap: 5,
  secondEliteFromWave: 3,
};
let mobileLike = false;

const CHAR = { w: 192, h: 256, cols: 16 };
const PLAYER_SKIN = { w: 512, h: 512, cols: 3, rows: 2 };
const PLAYER_SKIN_WALK = { w: 256, h: 256, cols: 8, rows: 6 };
const PLAYER_SKIN_SELECT = { w: 256, h: 256, cols: 7 };
const FIGHTER_WALK = { w: 256, h: 256, cols: 8, rows: 4, frames: 8 };
const FIGHTER_SELECT = { w: 256, h: 256, cols: 4 };
const RYU_ACTION = {
  w: 256,
  h: 256,
  cols: 12,
  rows: 5,
  frames: 12,
  fps: 18,
  rowsByAction: { walk: 0, hadoken: 1, shoryuken: 2, whirlwindKick: 3, focusStance: 4 },
};
const GUILE_ACTION = {
  w: 256,
  h: 256,
  cols: 8,
  rows: 5,
  frames: 8,
  fps: 13,
  rowsByAction: { walk: 0, sonicBoom: 1, kneeBazooka: 2, reversePunch: 3, flashKick: 4 },
};
const CHUN_LI_ACTION = {
  w: 256,
  h: 256,
  cols: 12,
  rows: 5,
  frames: 12,
  fps: 18,
  rowsByAction: { walk: 0, thousandKick: 1, kiKouKen: 2, whirlwindKick: 3, lightningKick: 4 },
};
const SAM_MAX_DUO_WALK = { w: 384, h: 512, cols: 4, rows: 2, frames: 8 };
const ITEM = { w: 512, h: 512, cols: 4 };
const NEWSPRITE = { w: 384, h: 512, cols: 4, rows: 2 };
const ENEMY_ANIM = { w: 256, h: 256, cols: 8, rows: 7, frames: 8, fps: 8.4 };
const GOTHIC_ENEMY = { w: 128, h: 176, cols: 4 };
const GOTHIC_ENEMY_ANIM = { w: 256, h: 256, cols: 8, rows: 2, frames: 8, fps: 8 };
const GOTHIC_ITEM = { w: 128, h: 128, cols: 4, rows: 3 };
const GOTHIC_PROP = { w: 256, h: 256, cols: 4, rows: 2 };
const SPECTRAL_CAPTAIN = { w: 384, h: 512, cols: 4 };
const THREE_HEADED_MONKEY_ANIM = { w: 706, h: 720, cols: 4, rows: 2, frames: 8, fps: 6.8 };
const BLACKBEARD_ANIM = { w: 758, h: 900, cols: 4, rows: 2, frames: 8, fps: 6.4 };
const TIME_TENTACLE_ANIM = { w: 256, h: 512, cols: 6, rows: 2, frames: 12, fps: 10.5 };
const NEW_ENEMY_TRIO = { w: 256, h: 256, cols: 8, rows: 3, frames: 8, fps: 8.2 };
const PLATFORMER_ENEMY_ANIM = { w: 256, h: 256, cols: 11, rows: 2, frames: 11, fps: 10.8 };
const PROJECTILE_FX = { w: 400, h: 400, cols: 4, rows: 2 };
const PLAYER_EFFECT_FX = { w: 512, h: 512, cols: 4, rows: 2 };
const WEAPON_EVOLUTION_FX = { w: 512, h: 512, cols: 4, rows: 4 };
const FUSION_RELIC = { w: 256, h: 256, cols: 4, rows: 4, frames: 4, fps: 5.5 };
const SIGNATURE_WEAPON_FX = { w: 256, h: 256, cols: 4, rows: 11, frames: 4, fps: 8.5 };
const SONIC_BOOM_FX = { w: 256, h: 256, cols: 8, rows: 4, frames: 8, fps: 17 };
const RYU_HADOKEN_FX = { w: 256, h: 256, cols: 12, rows: 4, frames: 12, fps: 18 };
const CHUN_LI_PROJECTILE_FX = { w: 256, h: 256, cols: 12, rows: 3, frames: 12, fps: 18, rowsByFx: { kiKouKen: 0, thousandKickArc: 1, whirlwindKickArc: 2 } };
const XP_CRYSTAL_ANIM = { w: 256, h: 256, frames: 8, fps: 10.5 };
const EXTRA_ENEMY = { w: 512, h: 512, cols: 4, rows: 2 };
const EXTRA_ITEM = { w: 512, h: 512, cols: 4, rows: 2 };
const WORLD = { w: 10000000, h: 10000000, bgTile: 4096 };
const WORLD_BG_SEAM_BLEED = 64;
const WORLD_BG_SOURCE_INSET = 48;
const PROP_CHUNK = 960;
const PROP_CHUNK_RADIUS = 3;
const PROP_CHUNK_PRUNE_RADIUS = 5;
const PROP_SPAWN_BUFFER = 360;
const PROP_FADE_SECONDS = 1.25;
const TARGET_TIME = 330;
const BALANCE = {
  normalSpawnIntensity: 1.36,
  quickSpawnIntensity: 1.62,
  enemyHpGrowth: 270,
  enemySpeedGrowth: 700,
  bossHpMult: 2.9,
  firstBossAt: 126,
  bossInterval: 54,
  rangedPressureAt: 50,
  pressureWaveFirstAt: 20,
  pressureWaveInterval: 28,
};
const XP_TUNING = {
  initialNextXp: 46,
  base: 34,
  linear: 18,
  quadratic: 1.75,
  firstChoiceLevel: 3,
  choiceInterval: 4,
};

const playerSkinMap = {
  default: {
    name: "Kaeptnin",
    sheet: "characters",
    w: 104,
    h: 138,
    music: { theme: "Dockside Drive", main: "bgmMain", rush: "bgmRush", mainVolume: 0.64, rushVolume: 0.56, mainStartAt: 0, rushStartAt: 8, mainRate: 1.03, rushRate: 1.03 },
    sfx: { confirm: "pirateUiClick", slash: "quickCutlass", dash: "dashWhooshFast", hurt: "ghostAnchorHit", hit: "cutlassImpact", pickup: "brightGem", powerup: "voodooMagic", warning: "seaMonsterPop", bossDown: "cursedBossDrop" },
    trait: { id: "captainCommand", name: "Kaeptninskommando", desc: "+1 Ruestung, stabiler Saebel", armor: 1, damage: 0.03, signature: { id: "captainCutlass", label: "Kommando-Saebel", icon: "captainCutlass", pattern: "fan", cooldown: 3.7, speed: 560, damage: 28, radius: 20, pierce: 2, count: 2, spread: 0.22, color: "#7affc8" } },
  },
  islandPirate: {
    name: "Insel-Pirat",
    sheet: "playerSkins",
    x: 109,
    y: 22,
    w: 323,
    h: 478,
    drawH: 142,
    animH: 170,
    animRow: 0,
    cellX: 0,
    cellY: 0,
    music: { theme: "Turbo Caper", main: "bgmCaper", rush: "bgmShoreline", mainVolume: 0.65, rushVolume: 0.55, mainStartAt: 4, rushStartAt: 18, mainRate: 1.045, rushRate: 1.035 },
    sfx: { confirm: "pirateUiClick", slash: "quickCutlass", dash: "dashWhooshFast", hurt: "downloadHit", hit: "seaMonsterPop", pickup: "doubloonPing", powerup: "treasureMapMagic", warning: "downloadBossWarning", bossDown: "cursedBossDrop" },
    trait: { id: "islandLoot", name: "Inselbeute", desc: "+12% Beutewert, groesserer Magnet", pickupValue: 0.12, magnet: 24, signature: { id: "doubloonBoomerang", label: "Dublonen-Bumerang", icon: "doubloonBoomerang", pattern: "shot", cooldown: 3.45, speed: 620, damage: 30, radius: 18, pierce: 4, color: "#ffd45c" } },
  },
  curseMonkey: {
    name: "Fluchaffe",
    sheet: "playerSkins",
    x: 589,
    y: 88,
    w: 315,
    h: 411,
    drawH: 118,
    animH: 162,
    animRow: 1,
    animBob: 0,
    idleBob: 0,
    cellX: 1,
    cellY: 0,
    music: { theme: "Curse Monkey Frenzy", main: "bgmCurseMonkey", rush: "bgmCaper", mainVolume: 0.66, rushVolume: 0.6, rushStart: 42, rushFade: 46, mainStartAt: 20, rushStartAt: 11, mainRate: 1.08, rushRate: 1.09 },
    sfx: { confirm: "curseMonkeyChatter", slash: "curseMonkeySwipe", dash: "curseMonkeyDash", hurt: "curseMonkeyHit", hit: "curseMonkeyHit", pickup: "curseMonkeyChatter", powerup: "curseMonkeyPower", warning: "curseMonkeyWarning", bossDown: "curseMonkeyBossDown" },
    trait: { id: "curseMagnet", name: "Fluchsog", desc: "+36 Magnet, +5% Schaden, aber weniger HP", magnet: 36, damage: 0.05, maxHp: -12, signature: { id: "boneHexClaw", label: "Knochenfluch", icon: "boneHexClaw", pattern: "fan", cooldown: 3.25, speed: 540, damage: 24, radius: 17, pierce: 2, count: 3, spread: 0.38, color: "#d178ff" } },
  },
  dhampirHunter: {
    name: "Dhampir-Jaeger",
    sheet: "playerSkins",
    x: 960,
    y: 0,
    w: 380,
    h: 500,
    drawH: 156,
    animH: 184,
    animRow: 2,
    animDrawYOffset: 34,
    cellX: 2,
    cellY: 0,
    music: { theme: "Gargoyle Bloodrun", main: "bgmGargoyle", rush: "bgmCathedral", mainVolume: 0.62, rushVolume: 0.58, rushStart: 58, mainStartAt: 0, rushStartAt: 8, mainRate: 1.035, rushRate: 1.03 },
    sfx: { confirm: "treasureMapMagic", slash: "quickCutlass", dash: "dashWhooshFast", hurt: "ghostAnchorHit", hit: "ghostAnchorHit", pickup: "healSparkle", powerup: "voodooMagic", warning: "bossWarningCursed", bossDown: "cursedBossDrop" },
    trait: { id: "moonLeech", name: "Mondbiss", desc: "+8% Schaden, heilt jeden 9. Kill", damage: 0.08, maxHp: -8, killHealEvery: 9, killHeal: 4, signature: { id: "bloodRoseVolley", label: "Blutrosen-Salve", icon: "bloodRoseVolley", pattern: "fan", cooldown: 3.65, speed: 590, damage: 22, radius: 15, pierce: 3, count: 5, spread: 0.24, color: "#ff6fa8" } },
  },
  rumCorsair: {
    name: "Rum-Korsar",
    sheet: "playerSkins",
    x: 34,
    y: 512,
    w: 461,
    h: 512,
    drawH: 155,
    animH: 178,
    animRow: 3,
    animDrawYOffset: 33,
    cellX: 0,
    cellY: 1,
    music: { theme: "Rum Riddle Run", main: "bgmRumRiddle", rush: "bgmShoreline", mainVolume: 0.64, rushVolume: 0.55, rushStart: 72, mainStartAt: 0, rushStartAt: 18, mainRate: 1.035, rushRate: 1.035 },
    sfx: { confirm: "pirateUiClick", slash: "quickCutlass", dash: "dashWhooshFast", hurt: "downloadHit", hit: "cutlassImpact", pickup: "doubloonPing", powerup: "treasureMapMagic", warning: "downloadBossWarning", bossDown: "cursedBossDrop" },
    trait: { id: "rumSprint", name: "Rumspurt", desc: "+18 Tempo, schnellerer Dash", speed: 18, dashCooldown: -0.08, armor: -0.3, signature: { id: "rumBarrelBlast", label: "Rumfass-Brecher", icon: "rumBarrelBlast", pattern: "burst", cooldown: 4.1, damage: 36, radius: 136, color: "#ffad42" } },
  },
  starFarmboy: {
    name: "Sternenfarmboy",
    sheet: "playerSkins",
    x: 500,
    y: 492,
    w: 460,
    h: 532,
    drawH: 156,
    animH: 166,
    animRow: 4,
    animDrawYOffset: 38,
    cellX: 1,
    cellY: 1,
    music: { theme: "Crimson Twin-Sun", main: "bgmCrimson", rush: "bgmRush", mainVolume: 0.62, rushVolume: 0.56, rushStart: 68, mainStartAt: 10, rushStartAt: 12, mainRate: 1.055, rushRate: 1.03 },
    sfx: { confirm: "chime", slash: "quickCutlass", dash: "dashWhooshFast", hurt: "downloadHit", hit: "cutlassImpact", pickup: "brightGem", powerup: "treasureMapMagic", warning: "bossWarningCursed", bossDown: "cursedBossDrop" },
    trait: { id: "starCompass", name: "Sternenkompass", desc: "Startet mit Kompass I, weniger HP", maxHp: -10, weapons: { compass: 1 }, magnet: 12, signature: { id: "starSaberArc", label: "Sternenklinge", icon: "starSaberArc", pattern: "fan", cooldown: 3.55, speed: 610, damage: 27, radius: 16, pierce: 2, count: 2, spread: 0.2, color: "#84e9ff" } },
  },
  freelanceDuo: {
    name: "Freelance-Duo",
    sheet: "samMaxDuo",
    animSheet: "samMaxDuoWalk",
    drawH: 150,
    animH: 178,
    cellX: 2,
    cellY: 1,
    music: { theme: "Coconut Casefile", main: "bgmCoconut", rush: "bgmVoodoo", mainVolume: 0.61, rushVolume: 0.55, rushStart: 74, mainStartAt: 0, rushStartAt: 16, mainRate: 1.045, rushRate: 1.035 },
    sfx: { confirm: "pirateUiClick", slash: "quickCutlass", dash: "dashWhooshFast", hurt: "downloadHit", hit: "seaMonsterPop", pickup: "doubloonPing", powerup: "voodooMagic", warning: "downloadBossWarning", bossDown: "cursedBossDrop" },
    trait: { id: "twoHeads", name: "Doppelermittlung", desc: "Startet mit Tau I, Power-ups halten laenger", speed: -6, pickupValue: 0.06, weapons: { rope: 1 }, powerupDuration: 1.18, signature: { id: "freelanceNet", label: "Freelance-Netz", icon: "freelanceNet", pattern: "trap", cooldown: 4.2, damage: 32, radius: 148, color: "#e27cff" } },
  },
  ryu: {
    name: "Ryu",
    sheet: "fighterWalks",
    animSheet: "ryuActions",
    fighterRow: 0,
    selectIndex: 0,
    animH: 178,
    animDrawYOffset: 25,
    music: { theme: "Dojo Crash Duel", main: "bgmRyuSignature", rush: "bgmStreetRush", mainVolume: 0.63, rushVolume: 0.59, rushStart: 62, mainStartAt: 0, rushStartAt: 0, mainRate: 1, rushRate: 1.025 },
    sfx: { confirm: "pirateUiClick", slash: "quickCutlass", dash: "dashWhooshFast", hurt: "heavyHit", hit: "cutlassImpact", pickup: "brightGem", powerup: "upgradeMagic", warning: "bossWarningCursed", bossDown: "bossDownUndead" },
    trait: {
      id: "hadokenFocus",
      name: "Hadoken-Fokus",
      desc: "Startet mit Hadoken statt Saebel, spaeter Shoryuken und Whirlwind-Kick.",
      damage: 0.09,
      weapons: { compass: 1 },
      maxHp: -6,
      signature: { id: "hadoken", label: "Hadoken", icon: "hadoken", pattern: "shot", cooldown: 2.55, speed: 690, damage: 38, radius: 21, pierce: 2, color: "#6ee7ff" },
    },
  },
  ken: {
    name: "Ken",
    sheet: "fighterWalks",
    animSheet: "fighterWalks",
    fighterRow: 1,
    selectIndex: 1,
    animH: 168,
    animDrawYOffset: 31,
    music: { theme: "Steel Punch Parade", main: "bgmKenSignature", rush: "bgmStreetRush", mainVolume: 0.64, rushVolume: 0.6, rushStart: 52, mainStartAt: 0, rushStartAt: 0, mainRate: 1.015, rushRate: 1.04 },
    sfx: { confirm: "pirateUiClick", slash: "quickCutlass", dash: "dashWhooshFast", hurt: "downloadHit", hit: "seaMonsterPop", pickup: "doubloonPing", powerup: "treasureMapMagic", warning: "curseMonkeyWarning", bossDown: "curseMonkeyBossDown" },
    trait: {
      id: "dragonRush",
      name: "Dragon Rush",
      desc: "Schneller Dash, etwas mehr Tempo",
      speed: 14,
      dashCooldown: -0.07,
      damage: 0.035,
      signature: { id: "dragonKick", label: "Dragon Kick", icon: "dragonKick", pattern: "burst", cooldown: 4.3, damage: 34, radius: 132, color: "#ff9d42" },
    },
  },
  guile: {
    name: "Guile",
    sheet: "fighterWalks",
    animSheet: "guileActions",
    fighterRow: 2,
    selectIndex: 2,
    animH: 188,
    animDrawYOffset: 22,
    music: { theme: "Jet Fuel Glory", main: "bgmGuileSignature", rush: "bgmStreetRush", mainVolume: 0.63, rushVolume: 0.58, rushStart: 68, mainStartAt: 0, rushStartAt: 0, mainRate: 1, rushRate: 1.02 },
    sfx: { confirm: "pirateUiClick", slash: "slashSwish", dash: "dashWhooshFast", hurt: "heavyHit", hit: "ghostAnchorHit", pickup: "downloadPickup", powerup: "upgradeMagic", warning: "downloadBossWarning", bossDown: "bossDownUndead" },
    trait: {
      id: "sonicGuard",
      name: "Sonic Guard",
      desc: "Startet mit Sonic Boom statt Saebel, spaeter Knee Bazooka, Reverse Punch und Flash Kick.",
      armor: 1,
      cooldown: -0.04,
      speed: -4,
      signature: { id: "sonicBoom", label: "Sonic Boom", icon: "sonicBoom", pattern: "shot", cooldown: 3.35, speed: 610, damage: 30, radius: 22, pierce: 4, color: "#b7fff0" },
    },
  },
  chunLi: {
    name: "Chun Li",
    sheet: "fighterWalks",
    animSheet: "chunLiActions",
    fighterRow: 3,
    selectIndex: 3,
    animH: 174,
    animDrawYOffset: 26,
    music: { theme: "Bamboo Arcade", main: "bgmChunLiSignature", rush: "bgmStreetRush", mainVolume: 0.63, rushVolume: 0.59, rushStart: 56, mainStartAt: 0, rushStartAt: 0, mainRate: 1.02, rushRate: 1.035 },
    sfx: { confirm: "chime", slash: "quickCutlass", dash: "dashWhooshFast", hurt: "downloadHit", hit: "cutlassImpact", pickup: "brightGem", powerup: "voodooMagic", warning: "bossWarningCursed", bossDown: "cursedBossDrop" },
    trait: {
      id: "kiKouKenFlow",
      name: "Ki-Kou-Ken Flow",
      desc: "Startet mit Thousand Kick, Ki Kou Ken triggert Whirlwind-Kicks.",
      speed: 18,
      cooldown: -0.035,
      maxHp: -10,
      signature: { id: "kiKouKen", label: "Ki Kou Ken", icon: "kiKouKen", pattern: "shot", cooldown: 3.12, speed: 680, damage: 34, radius: 22, pierce: 3, color: "#aef7ff" },
    },
  },
};
const playerSkinMenuOrder = [
  "default",
  "ryu",
  "ken",
  "guile",
  "chunLi",
  "islandPirate",
  "curseMonkey",
  "rumCorsair",
  "dhampirHunter",
  "starFarmboy",
  "freelanceDuo",
];
const playerSkinSelectAtlasIndex = {
  default: 0,
  islandPirate: 1,
  curseMonkey: 2,
  dhampirHunter: 3,
  rumCorsair: 4,
  starFarmboy: 5,
};
const playerSkinIds = [
  ...playerSkinMenuOrder,
  ...Object.keys(playerSkinMap).filter((id) => !playerSkinMenuOrder.includes(id)),
].filter((id, index, list) => playerSkinMap[id] && list.indexOf(id) === index);
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
    music: { main: "bgmMain", rush: "bgmRush", mainVolume: 0.64, rushVolume: 0.56, rushStart: 76 },
    unlockedByDefault: true,
    propBoost: ["boatWreck", "buriedTreasure", "palmTree", "palmHedge"],
    blockerIcons: ["palmTree", "palmHedge", "hedgeCluster", "boatWreck", "beachHut"],
    blockerDensity: 5,
  },
  {
    id: "moonlitLagoon",
    name: "Mondlagune",
    desc: "Mehr Sog",
    tint: "rgba(83, 255, 229, 0.12)",
    detail: "lagoon",
    background: "mapMoonlitLagoon",
    music: { main: "bgmShoreline", rush: "bgmCaper", mainVolume: 0.64, rushVolume: 0.56, rushStart: 68 },
    unlockedByDefault: true,
    propBoost: ["clearPuddle", "tidePuddle", "conchShrine", "palmTree", "beachHut", "boatWreck"],
    blockerIcons: ["palmTree", "palmHedge", "hedgeCluster", "conchShrine", "beachHut", "boatWreck"],
    blockerDensity: 6,
    enemyFavor: ["hand", "reefSquid", "tideTentacle"],
  },
  {
    id: "gothicCove",
    name: "Blutbucht",
    desc: "Gothic-Druck",
    tint: "rgba(116, 70, 180, 0.16)",
    detail: "gothic",
    background: "mapGothicCove",
    music: { main: "bgmRush", rush: "bgmCathedral", mainVolume: 0.6, rushVolume: 0.58, rushStart: 58 },
    achievement: "nightRaid",
    propBoost: ["bloodRose", "hedgeCluster", "palmTree", "palmHedge"],
    blockerIcons: ["hedgeCluster", "palmTree", "palmHedge", "boatWreck", "beachHut"],
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
    music: { main: "bgmCaper", rush: "bgmVoodoo", mainVolume: 0.65, rushVolume: 0.56, rushStart: 70 },
    achievement: "wreckDiver",
    propBoost: ["buriedTreasure", "beachHut", "boatWreck", "treasureChest", "palmTree", "palmHedge", "hedgeCluster"],
    blockerIcons: ["palmTree", "palmHedge", "hedgeCluster", "beachHut", "boatWreck"],
    blockerDensity: 7,
    enemyFavor: ["powderImp", "cactusStack", "reefSquid"],
  },
];

const achievementDefinitions = [
  { id: "firstBlood", name: "Erster Fluch", desc: "40 Gegner insgesamt", field: "kills", target: 40, unlockRelic: "Flutkompass" },
  { id: "powerCollector", name: "Reliktlaeufer", desc: "3 Power-ups sammeln", field: "powerups", target: 3, unlockRelic: "Grog-Stiefel" },
  { id: "wreckDiver", name: "Wracktaucher", desc: "4 Orte erkunden", field: "landmarks", target: 4, unlockMap: "treasureAtoll" },
  { id: "nightRaid", name: "Nachtkaperfahrt", desc: "150 Sekunden ueberleben", field: "bestSurvival", target: 150, unlockMap: "gothicCove" },
  { id: "streakCarver", name: "Streak-Saebel", desc: "12er Streak schaffen", field: "bestStreak", target: 12, unlockRelic: "Saebelkerbe" },
  { id: "fusionSmith", name: "Fusionsschmied", desc: "2 Waffenfusionen entfachen", field: "fusions", target: 2, unlockRelic: "Fusionskern" },
  { id: "flowRunner", name: "Flowlaeufer", desc: "10 Flow-Boni sammeln", field: "flowRewards", target: 10, unlockRelic: "Flow-Anker" },
];

const powerUpTypes = [
  { id: "rumRush", name: "Grog-Tempo", icon: "grogLantern", duration: 10, speed: 1.3, color: "#f0c45d" },
  { id: "blackPowder", name: "Pulverfieber", icon: "powderPouch", duration: 9, damage: 1.2, color: "#ffb14c" },
  { id: "pearlMagnet", name: "Flutmagnet", icon: "cursedPearl", duration: 12, magnet: 130, color: "#53ffe5" },
  { id: "voodooWard", name: "Voodoo-Schutz", icon: "voodooDoll", duration: 8, armor: 2, color: "#d07cff" },
  { id: "saberFever", name: "Saebelfieber", icon: "moonSlash", duration: 9, damage: 1.32, cooldown: 0.94, color: "#fff2c7" },
  { id: "tideVacuum", name: "Tide-Vakuum", icon: "tideBoots", duration: 11, speed: 1.12, magnet: 180, color: "#53ffe5" },
  { id: "moonAegis", name: "Mond-Aegis", icon: "gothicArmor", duration: 8, armor: 4, color: "#9f6cff" },
  { id: "fusionSpark", name: "Fusionsfunke", icon: "rubyRing", duration: 10, speed: 1.12, damage: 1.18, cooldown: 0.9, color: "#ff8aa3" },
  { id: "stormRhythm", name: "Sturmtakt", icon: "captainSeal", duration: 8, speed: 1.16, damage: 1.1, cooldown: 0.88, magnet: 70, color: "#bfffea" },
  { id: "omenBounty", name: "Omen-Beute", icon: "bloodRose", duration: 10, speed: 1.1, damage: 1.16, cooldown: 0.91, magnet: 60, color: "#ffdf6e" },
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

const metaSkillDefinitions = [
  { id: "tideHeart", name: "Flutherz", icon: "lime", max: 5, baseCost: 16, costStep: 18, desc: "+12 Start-HP pro Rang." },
  { id: "goldMagnet", name: "Dublonenmagnet", icon: "skullCoin", max: 5, baseCost: 18, costStep: 20, desc: "+18 Magnet pro Rang." },
  { id: "bladeSchool", name: "Saebelschule", icon: "captainCutlass", max: 5, baseCost: 22, costStep: 24, desc: "+2.5% Schaden pro Rang." },
  { id: "shoreSprint", name: "Strandspurt", icon: "tideBoots", max: 5, baseCost: 20, costStep: 22, desc: "+8 Tempo pro Rang." },
  { id: "flowMemory", name: "Flow-Gedaechtnis", icon: "rubyRing", max: 5, baseCost: 24, costStep: 26, desc: "Mehr XP-Wert und laengere Power-ups." },
  { id: "signatureMastery", name: "Signature-Meisterung", icon: "hadoken", max: 5, baseCost: 28, costStep: 30, desc: "Signature Weapons starten schneller und treffen haerter." },
];

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

const enemyAnimMap = {
  crab: { row: 0, loopFrames: [0, 1, 2, 3, 4, 5, 6, 7], attackFrames: [2, 3, 4, 5] },
  seaHand: { row: 1, loopFrames: [0, 1, 2, 3, 4, 5], attackFrames: [2, 3, 4, 5] },
  powderImp: { row: 2, loopFrames: [0, 1, 2, 3, 4, 5, 6, 7], attackFrames: [3, 4, 5, 6] },
  lanternWraith: { row: 3, loopFrames: [0, 1, 2, 3, 4, 5, 6, 7], attackFrames: [4, 5, 6, 7] },
  barrelMaw: { row: 4, loopFrames: [0, 1, 2, 3, 4, 5, 6, 7], attackFrames: [2, 3, 4, 5] },
  coralBrute: { row: 5, loopFrames: [0, 1, 2, 3, 4, 5, 6, 7], attackFrames: [2, 3, 4, 5] },
  monkeyIdol: { row: 6, loopFrames: [0, 1, 2, 3, 4, 5, 6, 7], attackFrames: [4, 5, 6, 7] },
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

const newEnemyAnimMap = {
  tideTentacle: { row: 0, attackFrames: [3, 4, 5, 6] },
  reefSquid: { row: 1, attackFrames: [4, 5, 6, 7] },
  cactusStack: { row: 2, attackFrames: [2, 4, 5, 6] },
};

const platformerEnemyAnimMap = {
  reefSquid: { row: 0, loopFrames: [0, 1, 2, 3, 4, 5, 6, 9, 10], attackFrames: [7, 8, 9, 10] },
  cactusStack: { row: 1, loopFrames: [0, 1, 2, 3, 4, 5, 6, 9, 10], attackFrames: [2, 3, 4, 5, 6] },
};

const gothicEnemyAnimMap = {
  boneCorsair: { row: 0, loopFrames: [0, 1, 2, 3, 4, 5, 7], attackFrames: [2, 3, 4, 5] },
  gargoyle: { row: 1, loopFrames: [0, 1, 2, 3, 4, 7], attackFrames: [2, 3, 4, 7] },
};

const blockingPropShapes = {
  hedgeCluster: { rx: 145, ry: 62, oy: 8 },
  palmHedge: { rx: 136, ry: 52, oy: 4 },
  palmTree: { rx: 72, ry: 90, oy: 46 },
  beachHut: { rx: 142, ry: 86, oy: 28 },
  boatWreck: { rx: 154, ry: 70, oy: 22 },
  conchShrine: { rx: 58, ry: 76, oy: 18 },
};

const beachPropMap = {
  clearPuddle: { image: "beachClearPuddle", w: 420, h: 304, decal: true },
  tidePuddle: { image: "beachTidePuddle", w: 410, h: 318, decal: true },
  hedgeCluster: { image: "beachHedgeCluster", w: 421, h: 299 },
  palmHedge: { image: "beachPalmHedge", w: 385, h: 239 },
  palmTree: { image: "beachPalmTree", w: 430, h: 430 },
  treasureChest: { image: "beachTreasure", w: 340, h: 280, interactive: true },
  openTreasureChest: { image: "beachOpenTreasure", w: 300, h: 329, interactive: true },
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

const chunLiProjectileFxMap = {
  kiKouKen: { row: 0 },
  thousandKickArc: { row: 1 },
  whirlwindKickArc: { row: 2 },
};

const ryuHadokenFxMap = {
  hadoken: { row: 0 },
  hadoken2: { row: 1 },
  hadoken3: { row: 2 },
  hadoken4: { row: 3 },
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

const weaponEvolutionFxMap = {
  cutlass2: { x: 0, y: 0 },
  cutlass3: { x: 1, y: 0 },
  cutlass4: { x: 2, y: 0 },
  cutlass5: { x: 3, y: 0 },
  tornado0: { x: 0, y: 1 },
  tornado1: { x: 1, y: 1 },
  tornado2: { x: 2, y: 1 },
  tornado3: { x: 3, y: 1 },
  aura1: { x: 0, y: 2 },
  aura2: { x: 1, y: 2 },
  aura3: { x: 2, y: 2 },
  aura4: { x: 3, y: 2 },
  fusion0: { x: 0, y: 3 },
  fusion1: { x: 1, y: 3 },
  fusion2: { x: 2, y: 3 },
  fusion3: { x: 3, y: 3 },
};

const fusionRelicMap = {
  stormConch: { row: 0, name: "Sturm-Muschel", fusion: "starCoconut" },
  bloodMoonAnchor: { row: 1, name: "Blutmond-Anker", fusion: "saberTornado" },
  krakenCompass: { row: 2, name: "Kraken-Kompass", fusion: "moonNet" },
  rumCometLantern: { row: 3, name: "Rumkometen-Laterne", fusion: "grogMaelstrom" },
};
const fusionRelicIds = Object.keys(fusionRelicMap);
const fusionMomentRelicIcon = {
  saberTornado: "bloodMoonAnchor",
  starCoconut: "stormConch",
  grogMaelstrom: "rumCometLantern",
  moonNet: "krakenCompass",
};

const signatureWeaponMap = {
  captainCutlass: { row: 0, draw: "arc" },
  doubloonBoomerang: { row: 1, draw: "projectile" },
  boneHexClaw: { row: 2, draw: "arc" },
  bloodRoseVolley: { row: 3, draw: "projectile" },
  rumBarrelBlast: { row: 4, draw: "burst" },
  starSaberArc: { row: 5, draw: "arc" },
  freelanceNet: { row: 6, draw: "trap" },
  hadoken: { row: 7, draw: "projectile" },
  dragonKick: { row: 8, draw: "burst" },
  sonicBoom: { row: 9, draw: "projectile" },
  lightningFan: { row: 10, draw: "arc" },
  kiKouKen: { row: 10, draw: "projectile" },
};

function sonicBoomStage(level = 1) {
  return clamp(Math.floor((Math.max(1, level) - 1) / 2), 0, SONIC_BOOM_FX.rows - 1);
}

function ryuHadokenStage(level = 1) {
  return clamp(Math.floor((Math.max(1, level) - 1) / 2), 0, RYU_HADOKEN_FX.rows - 1);
}

const enemyTypes = [
  { id: "deckhand", name: "Deckhand Echo", row: 7, hp: 20, speed: 78, radius: 22, damage: 5, scale: 0.44, xp: 5, tint: "#f0c45d", humanNpc: true },
  { id: "crab", name: "Coconut Crab", sprite: "crab", enemyAnim: "crab", hp: 25, speed: 112, radius: 22, damage: 5, scale: 0.22, xp: 6, tint: "#ff8b46" },
  { id: "cryptBat", name: "Crypt Bat", gothicRow: 2, hp: 23, speed: 136, radius: 20, damage: 6, scale: 0.62, xp: 7, tint: "#9f6cff", flying: true },
  { id: "boneCorsair", name: "Bone Corsair", gothicRow: 1, gothicAnim: "boneCorsair", hp: 46, speed: 68, radius: 28, damage: 9, scale: 0.5, xp: 12, tint: "#d8e3b0" },
  { id: "gargoyle", name: "Moon Gargoyle", gothicRow: 7, gothicAnim: "gargoyle", hp: 96, speed: 64, radius: 39, damage: 15, scale: 0.58, xp: 21, tint: "#8bd7b4", flying: true },
  { id: "cook", name: "Grog Cook", row: 8, hp: 39, speed: 60, radius: 26, damage: 8, scale: 0.45, xp: 9, tint: "#ff765f", humanNpc: true },
  { id: "hand", name: "Seafoam Hand", sprite: "seaHand", enemyAnim: "seaHand", hp: 50, speed: 82, radius: 28, damage: 10, scale: 0.22, xp: 11, tint: "#79e0d8" },
  { id: "tideTentacle", name: "Zeit-Tentakel", newEnemyAnim: "tideTentacle", timeTentacle: true, hp: 86, speed: 76, radius: 34, damage: 13, scale: 0.31, xp: 21, tint: "#d07cff", phase: true, bossCandidate: true },
  { id: "reefSquid", name: "Riff-Squid", newEnemyAnim: "reefSquid", hp: 38, speed: 130, radius: 22, damage: 8, scale: 0.42, xp: 10, tint: "#ff8aa3", flying: true },
  { id: "cactusStack", name: "Kaktus-Stack", newEnemyAnim: "cactusStack", hp: 92, speed: 54, radius: 31, damage: 15, scale: 0.52, xp: 22, tint: "#a9d95a" },
  { id: "powderImp", name: "Powder Imp", extraSprite: "powderImp", enemyAnim: "powderImp", hp: 34, speed: 112, radius: 21, damage: 8, scale: 0.22, xp: 9, tint: "#ffb14c" },
  { id: "reefRaider", name: "Reef Raider", extraSprite: "reefRaider", hp: 78, speed: 66, radius: 30, damage: 13, scale: 0.27, xp: 17, tint: "#7ce0a7", humanNpc: true },
  { id: "saltboneFencer", name: "Saltbone Fencer", extraSprite: "saltboneFencer", hp: 58, speed: 86, radius: 25, damage: 12, scale: 0.26, xp: 15, tint: "#f2dca0", humanNpc: true },
  { id: "lanternWraith", name: "Lantern Wraith", extraSprite: "lanternWraith", enemyAnim: "lanternWraith", hp: 44, speed: 96, radius: 25, damage: 11, scale: 0.27, xp: 14, tint: "#53ffe5", phase: true },
  { id: "oracle", name: "Shell Oracle", row: 9, hp: 62, speed: 51, radius: 28, damage: 12, scale: 0.47, xp: 15, tint: "#79e0b7", humanNpc: true },
  { id: "tideWitch", name: "Tide Witch", extraSprite: "tideWitch", hp: 88, speed: 54, radius: 30, damage: 16, scale: 0.29, xp: 23, tint: "#77e6cf", humanNpc: true },
  { id: "barrelMaw", name: "Barrel Maw", extraSprite: "barrelMaw", enemyAnim: "barrelMaw", hp: 110, speed: 58, radius: 32, damage: 16, scale: 0.26, xp: 25, tint: "#f0a04d" },
  { id: "stormDuelist", name: "Storm Duelist", extraSprite: "stormDuelist", hp: 118, speed: 74, radius: 31, damage: 18, scale: 0.29, xp: 31, tint: "#5ccdf5", humanNpc: true },
  { id: "coralBrute", name: "Coral Brute", extraSprite: "coralBrute", enemyAnim: "coralBrute", hp: 176, speed: 45, radius: 43, damage: 20, scale: 0.33, xp: 40, tint: "#8bd78f", bossCandidate: true },
  { id: "idol", name: "Monkey Idol", sprite: "monkeyIdol", enemyAnim: "monkeyIdol", hp: 230, speed: 40, radius: 46, damage: 18, scale: 0.24, xp: 46, tint: "#d07cff" },
  { id: "spectralCaptain", name: "Fluchkapitaen", captainSheet: true, hp: 292, speed: 52, radius: 50, damage: 20, scale: 0.52, xp: 56, tint: "#53ffe5", phase: true, humanNpc: true },
  { id: "threeHeadedMonkey", name: "Dreikopf-Affe", threeHeadedMonkey: true, hp: 235, speed: 66, radius: 56, damage: 22, scale: 0.34, xp: 64, tint: "#80ff9e", bossCandidate: true },
  { id: "blackbeard", name: "Blackbeard", blackbeard: true, hp: 320, speed: 58, radius: 56, damage: 24, scale: 0.3, xp: 72, tint: "#ffb14c", bossCandidate: true, humanNpc: true },
];
const activeBossCycle = ["idol", "tideTentacle", "coralBrute", "threeHeadedMonkey", "gargoyle", "cactusStack"];

const upgrades = [
  {
    id: "cutlass",
    name: "Geistersaebel",
    icon: "key",
    desc: "Levelt zu Doppel-, Drei-, Vier- und Fuenffach-Saebeln.",
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
    desc: "Wachsende Aura. Fusioniert spaet mit Saebeln zum Tornado.",
    max: 5,
    apply: () => raiseWeapon("rope"),
  },
  {
    id: "stormConch",
    name: "Sturm-Muschel",
    icon: "stormConch",
    desc: "Fusion-Relikt: macht Sternenkokos schneller, lauter und kettenfreudiger.",
    max: 4,
    apply: () => applyFusionRelic("stormConch"),
  },
  {
    id: "bloodMoonAnchor",
    name: "Blutmond-Anker",
    icon: "bloodMoonAnchor",
    desc: "Fusion-Relikt: verankert Saebelsturm als groesseren, sichereren Blutwirbel.",
    max: 4,
    apply: () => applyFusionRelic("bloodMoonAnchor"),
  },
  {
    id: "krakenCompass",
    name: "Kraken-Kompass",
    icon: "krakenCompass",
    desc: "Fusion-Relikt: erweitert Mondnetz mit Krakenstrahlen und staerkerem Sog.",
    max: 4,
    apply: () => applyFusionRelic("krakenCompass"),
  },
  {
    id: "rumCometLantern",
    name: "Rumkometen-Laterne",
    icon: "rumCometLantern",
    desc: "Fusion-Relikt: laesst Grog-Mahlstrom groesser und feuriger einschlagen.",
    max: 4,
    apply: () => applyFusionRelic("rumCometLantern"),
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
      state.stats.dashCooldown = Math.max(0.3, state.stats.dashCooldown - 0.06);
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
    id: "rubyRing",
    name: "Rubin-Ring",
    icon: "rubyRing",
    desc: "Mehr Schaden und leicht schnellere Waffenzyklen.",
    max: 3,
    apply: () => {
      state.stats.damage += 0.055;
      state.stats.cooldown = Math.max(0.82, state.stats.cooldown - 0.04);
    },
  },
  {
    id: "moonSigil",
    name: "Mond-Siegel",
    icon: "moonSigil",
    desc: "Staerkt Kompass und bereitet Sternenkokos-Fusionen vor.",
    max: 3,
    apply: () => {
      raiseWeapon("compass");
      state.stats.magnet += 14;
      state.stats.damage += 0.025;
      state.stats.chainDamage = (state.stats.chainDamage || 0) + 0.08;
    },
  },
  {
    id: "gothicAxe",
    name: "Gothic-Axt",
    icon: "gothicAxe",
    desc: "Staerkt Saebel und Kokos fuer aggressivere Nahkampfrouten.",
    max: 3,
    apply: () => {
      raiseWeapon("cutlass");
      raiseWeapon("coconut");
      state.stats.damage += 0.02;
      state.stats.cooldown = Math.max(0.84, (state.stats.cooldown || 1) - 0.025);
    },
  },
  {
    id: "blueVial",
    name: "Blaues Elixier",
    icon: "blueVial",
    desc: "Power-ups halten laenger und geben einen kleinen Heilpuffer.",
    max: 3,
    apply: () => {
      state.stats.powerupDuration = (state.stats.powerupDuration || 1) + 0.12;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 24);
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
      state.stats.dashCooldown = Math.max(0.28, state.stats.dashCooldown - 0.1);
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
    fusions: 0,
    flowRewards: 0,
    runs: 0,
    wins: 0,
    bestLevel: 1,
    bestStreak: 0,
    bestSurvival: 0,
    achievements: {},
    unlockedMaps: mapVariants.filter((map) => map.unlockedByDefault).map((map) => map.id),
    unlockedRelics: [],
    skills: Object.fromEntries(metaSkillDefinitions.map((skill) => [skill.id, 0])),
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
  normalized.skills = Object.fromEntries(metaSkillDefinitions.map((skill) => [
    skill.id,
    clamp(Number(progress.skills?.[skill.id] || 0), 0, skill.max),
  ]));
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
    cooldown: relics.has("Fusionskern") ? 0.96 : 1,
    powerupDuration: relics.has("Flow-Anker") ? 1.08 : 1,
  };
}

function metaSkillLevel(id) {
  return clamp(Number(metaProgress.skills?.[id] || 0), 0, metaSkillDefinitions.find((skill) => skill.id === id)?.max || 0);
}

function metaSkillCost(skill) {
  const level = metaSkillLevel(skill.id);
  if (level >= skill.max) return Infinity;
  return skill.baseCost + level * skill.costStep + Math.max(0, level - 1) * 6;
}

function metaSkillBonuses() {
  const flow = metaSkillLevel("flowMemory");
  const signature = metaSkillLevel("signatureMastery");
  return {
    maxHp: metaSkillLevel("tideHeart") * 12,
    magnet: metaSkillLevel("goldMagnet") * 18,
    damage: metaSkillLevel("bladeSchool") * 0.025,
    speed: metaSkillLevel("shoreSprint") * 8,
    pickupValue: flow * 0.045,
    powerupDuration: 1 + flow * 0.045,
    signatureDamage: 1 + signature * 0.075,
    signatureCooldown: Math.max(0.76, 1 - signature * 0.045),
    signatureStart: signature * 0.16,
    starterCoins: flow * 2,
  };
}

function buyMetaSkill(id) {
  const skill = metaSkillDefinitions.find((entry) => entry.id === id);
  if (!skill) return false;
  const level = metaSkillLevel(id);
  const cost = metaSkillCost(skill);
  if (level >= skill.max || metaProgress.coins < cost) return false;
  metaProgress.coins -= cost;
  metaProgress.skills[id] = level + 1;
  saveMetaProgress();
  renderMetaProgress();
  renderMetaSkills();
  playSkinSound("powerup", "downloadUpgrade", { force: true });
  return true;
}

function characterTrait(skinId = selectedSkin) {
  return playerSkinMap[skinId]?.trait || playerSkinMap.default.trait;
}

function characterSfxProfile(skinId = state?.player?.skin || selectedSkin) {
  return playerSkinMap[skinId]?.sfx || playerSkinMap.default.sfx || {};
}

function normalizeSoundKey(key, fallback = "pickup") {
  return audioSources[key] ? key : fallback;
}

function soundVolume(key, gain = 1) {
  return clamp((soundConfig[key]?.volume ?? 0.16) * gain, 0, 1);
}

function ensureSfxAudioContext() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!sfxAudioContext) sfxAudioContext = new AudioContextCtor();
  return sfxAudioContext;
}

function decodeAudioBuffer(ctx, arrayBuffer) {
  return new Promise((resolve, reject) => {
    const source = arrayBuffer.slice(0);
    const maybePromise = ctx.decodeAudioData(source, resolve, reject);
    if (maybePromise?.then) maybePromise.then(resolve).catch(reject);
  });
}

function preloadMusicBuffer(key) {
  if (!audioSources[key] || !key.startsWith("bgm")) return Promise.resolve(null);
  if (musicBuffers.has(key)) return Promise.resolve(musicBuffers.get(key));
  if (musicBufferPromises.has(key)) return musicBufferPromises.get(key);
  const ctx = ensureSfxAudioContext();
  if (!ctx) return Promise.reject(new Error("WebAudio unavailable"));
  const promise = fetch(resolvedAudioSource(key), { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`BGM ${key} HTTP ${response.status}`);
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => decodeAudioBuffer(ctx, arrayBuffer))
    .then((buffer) => {
      musicBuffers.set(key, buffer);
      return buffer;
    })
    .catch((error) => {
      musicBufferPromises.delete(key);
      throw error;
    });
  musicBufferPromises.set(key, promise);
  return promise;
}

function preloadSfxBuffer(key) {
  if (!audioSources[key] || key.startsWith("bgm")) return Promise.resolve(null);
  if (sfxBuffers.has(key)) return Promise.resolve(sfxBuffers.get(key));
  if (sfxBufferPromises.has(key)) return sfxBufferPromises.get(key);
  const ctx = ensureSfxAudioContext();
  if (!ctx) return Promise.resolve(null);
  const promise = fetch(audioSources[key], { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`SFX ${key} HTTP ${response.status}`);
      return response.arrayBuffer();
    })
    .then((data) => ctx.decodeAudioData(data.slice(0)))
    .then((buffer) => {
      sfxBuffers.set(key, buffer);
      sfxBufferPromises.delete(key);
      return buffer;
    })
    .catch(() => {
      sfxBufferPromises.delete(key);
      return null;
    });
  sfxBufferPromises.set(key, promise);
  return promise;
}

function playBufferedSound(key, volume) {
  const ctx = ensureSfxAudioContext();
  const buffer = sfxBuffers.get(key);
  if (!ctx || !buffer || ctx.state !== "running") return false;
  try {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
    sfxDebug.started += 1;
    return true;
  } catch {
    return false;
  }
}

function gestureSoundKeys(track = "main", skinId = selectedSkin) {
  const profile = playerSkinMap[skinId]?.sfx || playerSkinMap.default.sfx || {};
  const profileKeys = Object.values(profile).filter(Boolean);
  const quickKeys = track === "rush"
    ? ["quickCutlass", "dashWhooshFast", "cutlassImpact", "brightGem", "downloadUpgrade", "cannonFire"]
    : ["pirateUiClick", "quickCutlass", "cutlassImpact", "brightGem", "doubloonPing", "downloadUpgrade"];
  return uniqueAssetKeys([...profileKeys, ...quickKeys], audioSources)
    .filter((key) => !key.startsWith("bgm"))
    .slice(0, 14);
}

function primeSoundPoolsForGesture(track = "main", options = {}) {
  const keysToPrime = gestureSoundKeys(track);
  const ctx = options.unlock ? ensureSfxAudioContext() : null;
  if (ctx && ctx.state !== "running") {
    ctx.resume()
      .then(() => { sfxUnlockState.started += 1; })
      .catch(() => { sfxUnlockState.blocked += 1; });
  }
  for (const key of keysToPrime) {
    if (options.unlock) {
      sfxUnlockState.attempts += 1;
      preloadSfxBuffer(key);
    }
    const pool = soundPools[key];
    if (!pool?.length) continue;
    for (const clip of pool) {
      clip.preload = "auto";
      clip.muted = false;
      clip.volume = soundVolume(key);
      try { clip.load(); } catch {}
    }
  }
  soundPoolsPrimed = true;
}

function playSkinSound(event, fallback, options = {}) {
  const profile = characterSfxProfile();
  playSound(normalizeSoundKey(profile[event], fallback), options);
}

function isGuileSkin(skinId = state?.player?.skin || selectedSkin) {
  return skinId === "guile";
}

function isRyuSkin(skinId = state?.player?.skin || selectedSkin) {
  return skinId === "ryu";
}

function isChunLiSkin(skinId = state?.player?.skin || selectedSkin) {
  return skinId === "chunLi";
}

function actionConfigForSkin(skinId = state?.player?.skin || selectedSkin) {
  if (isGuileSkin(skinId)) return GUILE_ACTION;
  if (isRyuSkin(skinId)) return RYU_ACTION;
  if (isChunLiSkin(skinId)) return CHUN_LI_ACTION;
  return null;
}

function triggerPlayerAction(type, duration = 0.48) {
  const config = actionConfigForSkin();
  if (!state?.player || !config || config.rowsByAction[type] === undefined) return;
  state.playerAction = { type, timer: duration, maxTimer: duration };
}

function updatePlayerAction(dt) {
  if (!state?.playerAction) return;
  state.playerAction.timer -= dt;
  if (state.playerAction.timer <= 0) state.playerAction = null;
}

function guileActionFrame(action) {
  return actionFrame(action, GUILE_ACTION);
}

function ryuActionFrame(action) {
  return actionFrame(action, RYU_ACTION);
}

function chunLiActionFrame(action) {
  return actionFrame(action, CHUN_LI_ACTION);
}

function actionFrame(action, config) {
  if (!action) return 0;
  const progress = clamp(1 - action.timer / Math.max(0.001, action.maxTimer || 0.48), 0, 0.999);
  return Math.min(config.frames - 1, Math.floor(progress * config.frames));
}

function guileActionRow(type = "walk") {
  return GUILE_ACTION.rowsByAction[type] ?? GUILE_ACTION.rowsByAction.walk;
}

function ryuActionRow(type = "walk") {
  return RYU_ACTION.rowsByAction[type] ?? RYU_ACTION.rowsByAction.walk;
}

function chunLiActionRow(type = "walk") {
  return CHUN_LI_ACTION.rowsByAction[type] ?? CHUN_LI_ACTION.rowsByAction.walk;
}

function weaponPresentation(id, skinId = state?.player?.skin || selectedSkin) {
  if (id === "cutlass" && isGuileSkin(skinId)) {
    return {
      id,
      name: "Sonic Boom",
      icon: "sonicBoom",
      desc: "Guile feuert schnelle Energieboegen; spaeter kommen Knee Bazooka, Reverse Punch und Flash Kick dazu.",
    };
  }
  if (id === "cutlass" && isRyuSkin(skinId)) {
    return {
      id,
      name: "Hadoken",
      icon: "hadoken",
      desc: "Ryu wirft regelmaessig Hadoken; Level steigern Tempo, Groesse, Pierce und Follow-up-Chancen.",
    };
  }
  if (id === "cutlass" && isChunLiSkin(skinId)) {
    return {
      id,
      name: "Thousand Kick",
      icon: "thousandKickArc",
      desc: "Chun Li startet mit einer schnellen Kick-Salve; Ki Kou Ken und Whirlwind Kick bauen darauf auf.",
    };
  }
  const base = weaponLoadoutItems.find(([weaponId]) => weaponId === id);
  return base ? { id, name: base[1], icon: base[2] } : { id, name: id, icon: "coin" };
}

function upgradePresentation(upgrade) {
  if (upgrade.id === "cutlass" && isGuileSkin()) {
    return {
      ...upgrade,
      name: "Sonic Boom Drill",
      icon: "sonicBoom",
      desc: "Levelt Guiles Sonic Boom; schaltet Knee Bazooka, Reverse Punch und Flash Kick als Combo-Procs frei.",
    };
  }
  if (upgrade.id === "cutlass" && isRyuSkin()) {
    return {
      ...upgrade,
      name: "Hadoken Loop",
      icon: "hadoken",
      desc: "Levelt Ryus Hadoken als Startwaffe; hoehere Stufen werfen groessere Projektilwellen.",
    };
  }
  if (upgrade.id === "cutlass" && isChunLiSkin()) {
    return {
      ...upgrade,
      name: "Thousand Kick Loop",
      icon: "thousandKickArc",
      desc: "Levelt Chun Lis Thousand Kick; staerkere Salven halten Gegner im Ki-Kou-Ken-Fenster.",
    };
  }
  return upgrade;
}

function applyCharacterTrait(next) {
  const trait = characterTrait(next.player.skin);
  next.characterTrait = { ...trait };
  next.player.maxHp = Math.max(90, next.player.maxHp + (trait.maxHp || 0));
  next.player.hp = next.player.maxHp;
  next.stats.speed += trait.speed || 0;
  next.stats.damage += trait.damage || 0;
  next.stats.armor += trait.armor || 0;
  next.stats.magnet += trait.magnet || 0;
  next.stats.pickupValue += trait.pickupValue || 0;
  next.stats.cooldown = Math.max(0.84, (next.stats.cooldown || 1) + (trait.cooldown || 0));
  next.stats.dashCooldown = Math.max(0.28, next.stats.dashCooldown + (trait.dashCooldown || 0));
  next.stats.powerupDuration = (next.stats.powerupDuration || 1) * (trait.powerupDuration || 1);
  for (const [weapon, level] of Object.entries(trait.weapons || {})) {
    if (!next.weapons[weapon]) continue;
    next.weapons[weapon].level = Math.max(next.weapons[weapon].level, level);
    next.upgradeCounts[weapon] = Math.max(next.upgradeCounts[weapon] || 0, level);
  }
}

let state = null;
const keys = new Set();
const pointer = { active: false, id: null, dx: 0, dy: 0, originX: 0, originY: 0, radius: 40 };
let activeUpgradeChoices = [];
let selectedUpgradeIndex = 0;

function makeState() {
  const relicBonus = metaRelicBonuses();
  const skillBonus = metaSkillBonuses();
  const startX = WORLD.w / 2;
  const startY = WORLD.h / 2;
  const next = {
    phase: "menu",
    map: selectedMap,
    elapsed: 0,
    spawnTimer: 0,
    bossTimer: 0,
    bossCount: 0,
    pressureTimer: BALANCE.pressureWaveFirstAt,
    pressureWave: 0,
    warningTimer: 0,
    wave: 1,
    killCount: 0,
    streak: { count: 0, timer: 0, best: 0, nextCache: 18, caches: 0 },
    runStats: { landmarks: 0, powerups: 0, fusions: 0, flowRewards: 0, pressureWaves: 0, elites: 0, omenBoons: 0, unlocked: [] },
    fusionMoments: { seen: new Set(), count: 0 },
    omenShards: { count: 0, nextReward: 3, boons: 0 },
    powerupDropCooldown: 0,
    signatureMove: { timer: Math.max(0.38, 1.2 - skillBonus.signatureStart), casts: 0, last: null },
    playerAction: null,
    ryuArsenal: { casts: 0, hadokens: 0, weaponHadokens: 0, shoryukens: 0, whirlwindKicks: 0 },
    guileArsenal: { casts: 0, sonicBooms: 0, kneeBazookas: 0, reversePunches: 0, flashKicks: 0 },
    chunLiArsenal: { casts: 0, kiKouKens: 0, thousandKicks: 0, whirlwindKicks: 0, lightningKicks: 0 },
    coins: skillBonus.starterCoins,
    level: 1,
    xp: 0,
    nextXp: XP_TUNING.initialNextXp,
    camera: { x: startX, y: startY },
    player: {
      x: startX,
      y: startY,
      r: 24,
      hp: 150 + skillBonus.maxHp,
      maxHp: 150 + skillBonus.maxHp,
      invuln: 0,
      dash: 0,
      dashCooldown: 0,
      facing: 1,
      moveX: 0,
      moveY: 0,
      skin: selectedSkin,
    },
    stats: {
      speed: CONTROL_TUNING.baseSpeed + relicBonus.speed + skillBonus.speed,
      damage: 1.12 + relicBonus.damage + skillBonus.damage,
      armor: 2 + relicBonus.armor,
      magnet: 280 + relicBonus.magnet + skillBonus.magnet,
      pickupValue: 1.12 + skillBonus.pickupValue,
      dashCooldown: CONTROL_TUNING.dashCooldown,
      cooldown: relicBonus.cooldown || 1,
      powerupDuration: (relicBonus.powerupDuration || 1) * skillBonus.powerupDuration,
      signatureDamage: skillBonus.signatureDamage,
      signatureCooldown: skillBonus.signatureCooldown,
      chainDamage: 0,
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
      stormConch: 0,
      bloodMoonAnchor: 0,
      krakenCompass: 0,
      rumCometLantern: 0,
      bloodRose: 0,
      cursedPearl: 0,
      powderPouch: 0,
      monkeyPaw: 0,
      captainSeal: 0,
      tideBoots: 0,
      voodooDoll: 0,
      obsidianCompass: 0,
      grogLantern: 0,
      rubyRing: 0,
      moonSigil: 0,
      gothicAxe: 0,
      blueVial: 0,
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
    props: [],
    propChunks: new Set(),
    propsByChunk: new Map(),
    looseProps: [],
    enemyRotation: { cursor: 0, recent: [] },
    perf: { trimmedEnemies: 0, visibleEnemies: 0, drawnEnemies: 0, skippedEnemySprites: 0 },
    domTick: 0,
    tidePuddleCooldown: 0,
    voice: {
      nextLowHpAt: 0,
      minuteMark: 0,
      finalWarned: false,
    },
  };
  applyCharacterTrait(next);
  ensurePropChunks(next, true);
  return next;
}

function makeProps(mapId = selectedMap) {
  const target = {
    map: mapId,
    player: { x: WORLD.w / 2, y: WORLD.h / 2 },
    props: [],
    propChunks: new Set(),
    propsByChunk: new Map(),
    looseProps: [],
  };
  ensurePropChunks(target, true);
  return target.props;
}

function ensurePropChunks(target = state, force = false) {
  if (!target?.player) return;
  if (!target.propChunks) target.propChunks = new Set();
  if (!target.props) target.props = [];
  if (!target.propsByChunk) target.propsByChunk = new Map();
  if (!target.looseProps) target.looseProps = [];
  const centerX = Math.floor(target.player.x / PROP_CHUNK);
  const centerY = Math.floor(target.player.y / PROP_CHUNK);
  const chunkRadius = isMobileLike() ? MOBILE_PERF.propChunkRadius : PROP_CHUNK_RADIUS;
  const pruneRadius = isMobileLike() ? MOBILE_PERF.propPruneRadius : PROP_CHUNK_PRUNE_RADIUS;
  for (let cx = centerX - chunkRadius; cx <= centerX + chunkRadius; cx += 1) {
    for (let cy = centerY - chunkRadius; cy <= centerY + chunkRadius; cy += 1) {
      const key = chunkKey(cx, cy);
      if (!force && target.propChunks.has(key)) continue;
      if (target.propChunks.has(key)) continue;
      target.propChunks.add(key);
      addChunkProps(target, cx, cy, key, { force });
    }
  }
  target.props = target.props.filter((prop) => {
    if (!prop.chunkKey) return true;
    return Math.abs(prop.chunkX - centerX) <= pruneRadius
      && Math.abs(prop.chunkY - centerY) <= pruneRadius;
  });
  for (const key of [...target.propChunks]) {
    const [cx, cy] = key.split(":").map(Number);
    if (Math.abs(cx - centerX) > pruneRadius || Math.abs(cy - centerY) > pruneRadius) {
      target.propChunks.delete(key);
    }
  }
  reindexProps(target);
}

function chunkKey(cx, cy) {
  return `${cx}:${cy}`;
}

function addPropToTarget(target, prop) {
  if (!target.props) target.props = [];
  target.props.push(prop);
  indexProp(target, prop);
}

function indexProp(target, prop) {
  if (!target.propsByChunk) target.propsByChunk = new Map();
  if (!target.looseProps) target.looseProps = [];
  if (!prop.chunkKey) {
    target.looseProps.push(prop);
    return;
  }
  const list = target.propsByChunk.get(prop.chunkKey) || [];
  list.push(prop);
  target.propsByChunk.set(prop.chunkKey, list);
}

function reindexProps(target = state) {
  if (!target?.props) return;
  target.propsByChunk = new Map();
  target.looseProps = [];
  for (const prop of target.props) indexProp(target, prop);
}

function addChunkProps(target, chunkX, chunkY, chunkKeyValue, chunkOptions = {}) {
  const variant = mapVariant(target.map);
  const runtimeSpawn = !chunkOptions.force && target === state && target.phase === "playing" && (target.elapsed || 0) > 0.2;
  const choices = [
    "rope",
    "map",
    "compass",
    "rumBomb",
    "telescope",
    "skullCoin",
    "key",
    "speedCharm",
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
    "rubyRing",
    "gothicAxe",
    "blueVial",
    "palmTree",
    "hedgeCluster",
    "palmHedge",
    "buriedTreasure",
    "conchShrine",
    "clearPuddle",
    "tidePuddle",
    ...(variant.propBoost || []),
  ];
  const baseX = chunkX * PROP_CHUNK;
  const baseY = chunkY * PROP_CHUNK;
  const addProp = (x, y, icon, h, options = {}) => {
    if (Math.hypot(x - target.player.x, y - target.player.y) < (options.safeRadius || 0)) return;
    if (runtimeSpawn && !options.allowVisibleSpawn && isInSpawnSightline(x, y, target, options.spawnBuffer)) return;
    addPropToTarget(target, {
      x,
      y,
      icon,
      scale: propScaleForIcon(icon, h) * (options.scale || 1),
      spin: options.spin ?? ((h >> 8) % 100) / 100,
      interactive: options.interactive ?? beachPropMap[icon]?.interactive === true,
      blocking: options.blocking,
      puddle: beachPropMap[icon]?.decal === true,
      chunkX,
      chunkY,
      chunkKey: chunkKeyValue,
      createdAt: runtimeSpawn ? target.elapsed : undefined,
      fadeIn: runtimeSpawn ? (options.fadeIn || PROP_FADE_SECONDS) : undefined,
    });
  };

  const detailSlots = variant.detail === "treasure" ? 3 : 2;
  for (let i = 0; i < detailSlots; i += 1) {
    const h = hash2(chunkX * 17 + i * 13, chunkY * 19 - i * 7);
    const detailBoost = variant.detail === "treasure" ? 8 : variant.detail === "lagoon" ? 7 : 6;
    if (h % 12 >= detailBoost) continue;
    const icon = choices[h % choices.length];
    const x = baseX + 160 + ((h >> 4) % (PROP_CHUNK - 320));
    const y = baseY + 150 + ((h >> 11) % (PROP_CHUNK - 300));
    addProp(x, y, icon, h, { safeRadius: 560 });
  }

  const puddleHash = hash2(chunkX * 31 + 5, chunkY * 37 - 9);
  const puddleCount = variant.detail === "lagoon" ? 2 : puddleHash % 3 === 0 ? 2 : 1;
  for (let i = 0; i < puddleCount; i += 1) {
    const h = hash2(chunkX * 41 + i * 23, chunkY * 43 + i * 17);
    const icon = variant.detail === "lagoon" || h % 5 === 0 ? "tidePuddle" : "clearPuddle";
    const x = baseX + 150 + ((h >> 5) % (PROP_CHUNK - 300));
    const y = baseY + 140 + ((h >> 12) % (PROP_CHUNK - 280));
    addProp(x, y, icon, h, { safeRadius: 360, scale: 0.88 + (h % 5) * 0.04, interactive: false });
  }

  const landmarks = ["beachHut", "boatWreck", "buriedTreasure", "conchShrine", ...(variant.propBoost || [])];
  const landmarkHash = hash2(chunkX * 53, chunkY * 59);
  if (landmarkHash % 10 < (variant.detail === "treasure" ? 5 : 3)) {
    const icon = landmarks[landmarkHash % landmarks.length];
    const x = baseX + 220 + ((landmarkHash >> 5) % (PROP_CHUNK - 440));
    const y = baseY + 210 + ((landmarkHash >> 12) % (PROP_CHUNK - 420));
    addProp(x, y, icon, landmarkHash, {
      safeRadius: 760,
      spin: ((landmarkHash >> 9) % 100) / 130,
      interactive: true,
      blocking: propBlocksMovement({ icon }),
    });
  }

  const blockerIcons = variant.blockerIcons || (variant.detail === "gothic"
    ? ["hedgeCluster", "palmTree", "palmHedge", "boatWreck", "beachHut"]
    : ["hedgeCluster", "palmTree", "palmHedge", "boatWreck", "beachHut"]);
  const blockerDensity = variant.blockerDensity ?? 5;
  const blockerHash = hash2(chunkX * 67 + 3, chunkY * 71 - 11);
  if (blockerHash % 11 < blockerDensity) {
    const clusterSize = blockerHash % 5 === 0 || variant.detail === "treasure" ? 3 : 2;
    const cx = baseX + 250 + ((blockerHash >> 7) % (PROP_CHUNK - 500));
    const cy = baseY + 260 + ((blockerHash >> 14) % (PROP_CHUNK - 520));
    for (let i = 0; i < clusterSize; i += 1) {
      const h = blockerHash + i * 41;
      const icon = blockerIcons[(blockerHash + i * 3) % blockerIcons.length];
      const angle = ((blockerHash >> (i * 3 + 2)) % 628) / 100;
      const isHedge = icon === "hedgeCluster" || icon === "palmHedge";
      const isPalmTree = icon === "palmTree";
      const spread = icon === "beachHut" || icon === "boatWreck" ? 82 : isPalmTree ? 128 : isHedge ? 152 : 118;
      const x = cx + Math.cos(angle) * spread + ((blockerHash >> (i + 6)) % 90) - 45;
      const y = cy + Math.sin(angle) * spread + ((blockerHash >> (i + 11)) % 80) - 40;
      addProp(x, y, icon, h, {
        safeRadius: 720,
        scale: isPalmTree ? 0.92 : isHedge ? (variant.detail === "gothic" ? 1.24 : 1.18) : 1,
        spin: ((blockerHash >> (i + 8)) % 100) / 120,
        interactive: beachPropMap[icon]?.interactive === true,
        blocking: true,
      });
    }
  }

  if ((chunkX + chunkY) % 6 === 0) {
    const h = hash2(chunkX * 83, chunkY * 89);
    const icon = h % 2 === 0 ? "boatWreck" : "beachHut";
    addProp(baseX + 360 + (h % 240), baseY + 340 + ((h >> 8) % 220), icon, h, {
      safeRadius: 900,
      spin: ((h >> 9) % 100) / 160,
      interactive: true,
      blocking: true,
    });
  }
}

function propScaleForIcon(icon, h = 0) {
  if (newSpriteMap[icon]) return 0.15 + (h % 5) * 0.012;
  if (gothicPropMap[icon]) return 0.17 + (h % 5) * 0.012;
  if (gothicItemMap[icon]) return 0.12 + (h % 5) * 0.012;
  if (extraItemMap[icon]) return 0.13 + (h % 5) * 0.012;
  if (icon === "beachHut" || icon === "boatWreck") return 0.78 + (h % 4) * 0.035;
  if (icon === "palmTree") return 0.48 + (h % 4) * 0.022;
  if (icon === "hedgeCluster" || icon === "palmHedge") return 0.58 + (h % 5) * 0.026;
  if (icon === "conchShrine") return 0.62 + (h % 4) * 0.026;
  if (icon === "openTreasureChest") return 0.46 + (h % 3) * 0.018;
  if (icon === "treasureChest" || icon === "buriedTreasure") return 0.62 + (h % 4) * 0.024;
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

const MOBILE_BOOT_IMAGE_KEYS = [
  "repeatBeach",
  "characters",
  "playerSkinSelect",
  "fighterSelect",
  "items",
  "newSprites",
  "enemyAnimSheet",
  "gothicEnemies",
  "newEnemyTrio",
  "timeTentacleAnim",
  "beachClearPuddle",
  "beachTidePuddle",
  "beachHedgeCluster",
  "beachPalmHedge",
  "beachPalmTree",
  "beachTreasure",
  "beachOpenTreasure",
  "beachConchShrine",
  "beachHut",
  "beachBoatWreck",
  "projectileFx",
  "playerEffects",
  "signatureWeapons",
  "xpCrystalAnim",
  "xpCrystalGreenAnim",
  "xpCrystalRedAnim",
  "extraEnemies",
  "extraItems",
  "gothicItems",
  "gothicProps",
];

function uniqueAssetKeys(keys, sourceMap) {
  return [...new Set(keys)].filter((key) => sourceMap[key]);
}

function skinImageKeys(skinId = selectedSkin) {
  const skin = playerSkinMap[skinId] || playerSkinMap.default;
  const trait = characterTrait(skinId);
  return uniqueAssetKeys([
    skin.sheet,
    skin.animSheet,
    skin.sheet === "playerSkins" ? "playerSkinWalks" : null,
    skin.animSheet === "fighterWalks" ? "fighterWalks" : null,
    skin.animSheet === "samMaxDuoWalk" ? "samMaxDuoWalk" : null,
    trait?.signature?.id === "hadoken" ? "ryuHadokenFx" : null,
    trait?.signature?.id === "sonicBoom" ? "sonicBoomFx" : null,
    trait?.signature?.id === "kiKouKen" ? "chunLiProjectiles" : null,
  ].filter(Boolean), imageSources);
}

function mapImageKeys(mapId = selectedMap) {
  return uniqueAssetKeys([mapVariant(mapId).background], imageSources);
}

function musicKeysForProfile(mapId = selectedMap, skinId = selectedSkin) {
  const profile = mapMusicProfile(mapId, skinId);
  return uniqueAssetKeys([profile.mainKey, profile.rushKey], audioSources);
}

function bootImageKeys() {
  if (!isMobileLike()) return Object.keys(imageSources);
  return uniqueAssetKeys([
    ...MOBILE_BOOT_IMAGE_KEYS,
    ...mapImageKeys(selectedMap),
    ...skinImageKeys(selectedSkin),
  ], imageSources);
}

function bootMusicKeys() {
  return musicKeysForProfile(selectedMap, selectedSkin);
}

function imageEntriesForKeys(keys) {
  return uniqueAssetKeys(keys, imageSources).map((key) => [key, imageSources[key]]);
}

function loadImage(key, src, onLoaded) {
  if (images[key]) return Promise.resolve(images[key]);
  if (imageLoadPromises.has(key)) return imageLoadPromises.get(key);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      images[key] = img;
      loadedImageKeys.add(key);
      onLoaded?.(key);
      imageLoadPromises.delete(key);
      resolve();
    };
    img.onerror = () => {
      imageLoadPromises.delete(key);
      reject(new Error(`Could not load ${src}`));
    };
    img.src = src;
  }).then((result) => result);
  imageLoadPromises.set(key, promise);
  return promise;
}

function loadImageKey(key, onLoaded) {
  return loadImage(key, imageSources[key], onLoaded);
}

function loadImageKeys(keys, onLoaded) {
  return Promise.all(imageEntriesForKeys(keys).map(([key]) => loadImageKey(key, onLoaded)));
}

function musicSourceEntries(keys = null) {
  const wanted = keys ? new Set(keys) : null;
  return Object.entries(audioSources).filter(([key]) => key.startsWith("bgm") && (!wanted || wanted.has(key)));
}

function resolvedAudioSource(key) {
  return audioSources[key] || audioSources.bgmMain;
}

async function preloadMusicAssets(onLoaded, keys = null, options = {}) {
  const entries = musicSourceEntries(keys);
  const countProgress = options.countProgress !== false;
  if (options.reset !== false) {
    musicPreloadState.ready = false;
    musicPreloadState.loaded = 0;
    musicPreloadState.decoded = 0;
    musicPreloadState.total = entries.length;
    musicPreloadState.keys = entries.map(([key]) => key);
    musicPreloadState.failed = [];
  }
  await Promise.all(entries.map(async ([key, src]) => {
    if (warmedMusicKeys.has(key)) {
      if (countProgress) {
        musicPreloadState.loaded += 1;
        musicPreloadState.decoded += 1;
        onLoaded?.(key);
      }
      return;
    }
    try {
      try {
        await preloadMusicBuffer(key);
      } catch {
        await warmAudioForPlayback(src);
      }
      warmedMusicKeys.add(key);
      if (countProgress) {
        musicPreloadState.loaded += 1;
        musicPreloadState.decoded += 1;
        onLoaded?.(key);
      }
    } catch (error) {
      if (countProgress) musicPreloadState.failed.push(key);
      throw new Error(`Could not preload ${src}: ${error.message}`);
    }
  }));
  if (countProgress) {
    musicPreloadState.ready = musicPreloadState.loaded === musicPreloadState.total && musicPreloadState.failed.length === 0;
  }
}

function preloadMusicKeys(keys) {
  const pending = uniqueAssetKeys(keys, audioSources).filter((key) => key.startsWith("bgm") && !warmedMusicKeys.has(key));
  if (!pending.length) return Promise.resolve();
  return preloadMusicAssets(() => {}, pending, { reset: false, countProgress: false })
    .then(() => {
      deferredAssetState.musicLoaded += pending.length;
    })
    .catch(() => {});
}

function preloadMusicForSelection(mapId = selectedMap, skinId = selectedSkin) {
  return preloadMusicKeys(musicKeysForProfile(mapId, skinId));
}

function queueDeferredAssetLoading(bootKeys = []) {
  const bootSet = new Set(bootKeys);
  const queuedImages = Object.keys(imageSources).filter((key) => !bootSet.has(key) && !images[key]);
  deferredAssetState.mobileFastPath = isMobileLike();
  deferredAssetState.imageTotal = queuedImages.length;
  deferredAssetState.imageLoaded = 0;
  deferredAssetState.musicTotal = 0;
  deferredAssetState.musicLoaded = 0;
  deferredAssetState.queuedImages = queuedImages;
  if (!queuedImages.length) return;
  const loadDeferred = async () => {
    for (const key of queuedImages) {
      try {
        await loadImageKey(key, () => {
          deferredAssetState.imageLoaded += 1;
        });
      } catch {}
    }
  };
  setTimeout(loadDeferred, isMobileLike() ? 1800 : 120);
}

function warmAudioForPlayback(src, timeoutMs = 1400) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    let settled = false;
    const cleanup = () => {
      clearTimeout(timeout);
      audio.removeEventListener("canplaythrough", finish);
      audio.removeEventListener("canplay", finish);
      audio.removeEventListener("loadeddata", finish);
      audio.removeEventListener("error", fail);
      audio.src = "";
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("audio decode failed"));
    };
    const timeout = setTimeout(() => {
      finish();
    }, timeoutMs);
    audio.preload = "auto";
    audio.muted = true;
    audio.addEventListener("canplaythrough", finish);
    audio.addEventListener("canplay", finish);
    audio.addEventListener("loadeddata", finish);
    audio.addEventListener("error", fail);
    audio.src = src;
    audio.load();
  });
}

function prepareAudio() {
  for (const [key, src] of Object.entries(audioSources)) {
    if (key.startsWith("bgm")) continue;
    soundPools[key] = Array.from({ length: 5 }, () => {
      const audio = new Audio(src);
      audio.preload = isMobileLike() ? "metadata" : "auto";
      audio.volume = soundVolume(key);
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
  musicTrackMeta = { main: { startAt: 0, rate: 1 }, rush: { startAt: 0, rate: 1 } };
  configureMusicForMap(selectedMap);
  activeMusicTrack = null;
  armedMusicTrack = null;
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
  mobileLike = computeMobileLike(window.innerWidth, window.innerHeight);
  state = makeState();
  updatePlayerLabel();
  resize();
  renderSkinPicker();
  renderMapPicker();
  renderMetaProgress();
  renderMetaSkills();
  const bootImageKeyList = bootImageKeys();
  const bootMusicKeyList = bootMusicKeys();
  const imageEntries = imageEntriesForKeys(bootImageKeyList);
  deferredAssetState.bootImages = bootImageKeyList;
  deferredAssetState.bootMusic = bootMusicKeyList;
  const totalAssets = imageEntries.length + bootMusicKeyList.length;
  let loadedAssets = 0;
  const markLoaded = (loadedKey) => {
    loadedAssets += 1;
    setLoadingProgress(loadedAssets, totalAssets, loadedKey);
  };
  setLoadingProgress(0, totalAssets);
  await Promise.all([
    ...imageEntries.map(([key, src]) => loadImage(key, src, markLoaded)),
    preloadMusicAssets(markLoaded, bootMusicKeyList),
  ]);
  prepareAudio();
  prepareSpeech();
  await primeMenuMusic({ wait: true });
  ready = true;
  window.__MONKEY_TIDE_READY = true;
  setLoadingProgress(totalAssets, totalAssets, "ready");
  ui.startButton.disabled = false;
  ui.quickButton.disabled = false;
  queueDeferredAssetLoading(bootImageKeyList);
  render();
}

function skinIconStyle(id) {
  if (id === "freelanceDuo") {
    return `background-image:url('${imageSources.samMaxDuo}');background-size:contain;background-repeat:no-repeat;background-position:center 58%;`;
  }
  const skin = playerSkinMap[id];
  if (skin?.animSheet === "fighterWalks" || skin?.selectIndex !== undefined) {
    const index = clamp(skin.selectIndex ?? skin.fighterRow ?? 0, 0, FIGHTER_SELECT.cols - 1);
    const x = index / Math.max(1, FIGHTER_SELECT.cols - 1) * 100;
    return `background-image:url('${imageSources.fighterSelect}');background-size:${FIGHTER_SELECT.cols * 100}% 100%;background-position:${x}% 100%;`;
  }
  const index = playerSkinSelectAtlasIndex[id] ?? Math.max(0, playerSkinMenuOrder.indexOf(id));
  const x = index / Math.max(1, PLAYER_SKIN_SELECT.cols - 1) * 100;
  return `background-image:url('${imageSources.playerSkinSelect}');background-size:${PLAYER_SKIN_SELECT.cols * 100}% 100%;background-position:${x}% 100%;`;
}

function renderSkinPicker() {
  if (!ui.skinPicker) return;
  ui.skinPicker.innerHTML = playerSkinIds.map((id) => {
    const skin = playerSkinMap[id];
    const active = id === selectedSkin;
    const isFighter = skin?.animSheet === "fighterWalks" || skin?.animSheet === "ryuActions" || skin?.animSheet === "guileActions" || skin?.animSheet === "chunLiActions";
    const tag = isFighter ? "Fighter" : id === "freelanceDuo" ? "Duo" : "Crew";
    const traitLabel = skin.trait?.signature?.label || skin.trait?.name || "";
    return `
      <button class="skin-option${active ? " active" : ""}${isFighter ? " fighter-skin" : ""}" type="button" data-skin="${id}" data-archetype="${tag}" role="radio" aria-checked="${active}" title="${skin.name}: ${skin.trait?.desc || ""}">
        <span class="skin-kicker">${tag}</span>
        <span class="skin-icon" style="${skinIconStyle(id)}"></span>
        <span class="skin-name">${skin.name}</span>
        <span class="skin-trait">${traitLabel}</span>
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
  const skillLevels = metaSkillDefinitions.reduce((sum, skill) => sum + metaSkillLevel(skill.id), 0);
  ui.metaProgress.innerHTML = `
    <span class="progress-chip"><strong>${done}/${achievementDefinitions.length}</strong> Achievements</span>
    <span class="progress-chip"><strong>${metaProgress.coins}</strong> Dublonen</span>
    <span class="progress-chip"><strong>${skillLevels}/${metaSkillDefinitions.reduce((sum, skill) => sum + skill.max, 0)}</strong> Skills</span>
    <span class="progress-chip"><strong>${metaProgress.unlockedMaps.length}/${mapVariants.length}</strong> Karten</span>
    <span class="progress-chip"><strong>${metaProgress.bestStreak}</strong> Best-Streak</span>
    <span class="progress-chip"><strong>${relicText}</strong> Startrelikte</span>
  `;
}

function renderMetaSkills() {
  const containers = [ui.metaSkills, ui.endMetaSkills].filter(Boolean);
  if (!containers.length) return;
  const html = metaSkillDefinitions.map((skill) => {
    const level = metaSkillLevel(skill.id);
    const maxed = level >= skill.max;
    const cost = metaSkillCost(skill);
    const canBuy = !maxed && metaProgress.coins >= cost;
    const costLabel = maxed ? "MAX" : `${cost} D`;
    return `
      <button class="meta-skill${canBuy ? " buyable" : ""}${maxed ? " maxed" : ""}" type="button" data-meta-skill="${skill.id}" ${canBuy ? "" : "disabled"}>
        <span class="meta-skill-icon" style="${iconStyle(skill.icon)}"></span>
        <span class="meta-skill-copy">
          <span class="meta-skill-name">${skill.name}</span>
          <span class="meta-skill-level">Rang ${level}/${skill.max} - ${costLabel}</span>
          <span class="meta-skill-progress">${upgradeProgressPips(level, skill.max, "meta-skill-pip")}</span>
        </span>
      </button>
    `;
  }).join("");
  containers.forEach((container) => {
    container.innerHTML = html;
  });
}

function setSelectedMap(id) {
  if (!mapUnlocked(id)) return;
  selectedMap = id;
  try {
    window.localStorage?.setItem("monkeyTideMap", id);
  } catch {}
  loadImageKeys(mapImageKeys(id), () => {}).catch(() => {});
  preloadMusicForSelection(id, selectedSkin);
  renderMapPicker();
  primeMenuMusic();
}

function activePlayerSkinName() {
  const skinId = state?.player?.skin || selectedSkin || "default";
  return playerSkinMap[skinId]?.name || playerSkinMap.default.name;
}

function updatePlayerLabel() {
  if (ui.playerLabel) ui.playerLabel.textContent = activePlayerSkinName();
}

function setPlayerSkin(id) {
  if (!playerSkinMap[id]) return;
  selectedSkin = id;
  if (state?.player) state.player.skin = id;
  updatePlayerLabel();
  try {
    window.localStorage?.setItem("monkeyTidePlayerSkin", id);
  } catch {}
  loadImageKeys(skinImageKeys(id), () => {}).catch(() => {});
  preloadMusicForSelection(selectedMap, id);
  renderSkinPicker();
  if (state?.phase === "playing") syncMusic();
  else primeMenuMusic();
  if (ready) playSkinSound("confirm", "confirm");
}

function primeMenuMusic(options = {}) {
  if (!music || !rushMusic) return Promise.resolve();
  if (state?.phase === "playing" || state?.phase === "levelup") return Promise.resolve();
  configureMusicForMap(selectedMap, selectedSkin);
  music.muted = muted;
  rushMusic.muted = muted;
  music.volume = 0;
  rushMusic.volume = 0;
  seekMusicSlotToStart("main", true);
  seekMusicSlotToStart("rush", true);
  menuMusicPrimePromise = Promise.all([
    waitForMusicSlotReady("main"),
    waitForMusicSlotReady("rush"),
  ]).catch(() => {});
  return options.wait ? menuMusicPrimePromise : menuMusicPrimePromise;
}

function waitForMusicSlotReady(slot, timeoutMs = 900) {
  const audio = slot === "rush" ? rushMusic : music;
  if (!audio?.src) return Promise.resolve();
  const targetTime = Math.max(0, musicTrackMeta[slot]?.startAt || 0);
  const readyAtStart = () => audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && Math.abs((audio.currentTime || 0) - targetTime) <= 0.4;
  if (readyAtStart()) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const cleanup = () => {
      clearTimeout(timeout);
      audio.removeEventListener("loadedmetadata", handleMetadata);
      audio.removeEventListener("loadeddata", finishIfReady);
      audio.removeEventListener("canplay", finishIfReady);
      audio.removeEventListener("canplaythrough", finishIfReady);
      audio.removeEventListener("seeked", finishIfReady);
      audio.removeEventListener("error", finish);
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      seekMusicSlotToStart(slot, true);
      resolve();
    };
    const finishIfReady = () => {
      if (readyAtStart()) finish();
    };
    const handleMetadata = () => {
      seekMusicSlotToStart(slot, true);
      finishIfReady();
    };
    const timeout = setTimeout(finish, timeoutMs);
    audio.addEventListener("loadedmetadata", handleMetadata);
    audio.addEventListener("loadeddata", finishIfReady);
    audio.addEventListener("canplay", finishIfReady);
    audio.addEventListener("canplaythrough", finishIfReady);
    audio.addEventListener("seeked", finishIfReady);
    audio.addEventListener("error", finish, { once: true });
    seekMusicSlotToStart(slot, true);
    finishIfReady();
    if (audio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      try { audio.load(); } catch {}
    }
  });
}

function musicSlotAudio(track) {
  return track === "rush" ? rushMusic : music;
}

function profileVolumeForSlot(slot, profile) {
  return slot === "rush"
    ? Math.min(profile.rushVolume, musicConfig.maxRush ?? profile.rushVolume)
    : Math.min(profile.mainVolume, musicConfig.maxMain ?? profile.mainVolume);
}

function markMusicPlayLatency(startedAt) {
  lastMusicStartLatencyMs = Math.max(0, Math.round(performance.now() - startedAt));
}

function stopWebMusicTrack(slot) {
  const track = musicWebTracks[slot];
  if (!track) return;
  track.stopped = true;
  try {
    track.source.stop(0);
  } catch {}
  try {
    track.source.disconnect();
    track.gain.disconnect();
  } catch {}
  musicWebTracks[slot] = null;
}

function setWebMusicVolume(slot, volume) {
  const track = musicWebTracks[slot];
  if (!track) return;
  track.volume = volume;
  try {
    track.gain.gain.setTargetAtTime(volume, sfxAudioContext?.currentTime || 0, 0.018);
  } catch {
    track.gain.gain.value = volume;
  }
}

function fallbackMusicBufferKey(slot) {
  const preferred = slot === "rush" ? "bgmRush" : "bgmMain";
  if (musicBuffers.has(preferred)) return preferred;
  return [...musicBuffers.keys()].find((key) => key.startsWith("bgm")) || null;
}

function playWebMusicTrack(slot, volume) {
  const requestedKey = musicTrackKeys[slot];
  let key = requestedKey;
  let buffer = key ? musicBuffers.get(key) : null;
  if (!buffer) {
    const fallbackKey = fallbackMusicBufferKey(slot);
    if (fallbackKey) {
      key = fallbackKey;
      buffer = musicBuffers.get(fallbackKey);
    }
  }
  const ctx = ensureSfxAudioContext();
  if (!ctx || !buffer || muted) return false;
  if (ctx.state === "closed") return false;
  if (ctx.state !== "running") {
    ctx.resume().catch(() => {});
  }
  const meta = musicTrackMeta[slot] || { startAt: 0, rate: 1 };
  const active = musicWebTracks[slot];
  if (active && !active.stopped && active.key === key && active.requestedKey === requestedKey && Math.abs(active.rate - meta.rate) < 0.001) {
    setWebMusicVolume(slot, volume);
    return true;
  }
  stopWebMusicTrack(slot);
  const startedAt = performance.now();
  try {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const offset = buffer.duration > 0 ? (meta.startAt || 0) % buffer.duration : 0;
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = meta.rate;
    gain.gain.value = volume;
    source.connect(gain).connect(ctx.destination);
    source.start(0, offset);
    musicWebTracks[slot] = {
      source,
      gain,
      key,
      requestedKey,
      fallback: key !== requestedKey,
      rate: meta.rate,
      offset,
      startedAt: ctx.currentTime,
      volume,
      stopped: false,
    };
    if (requestedKey && key !== requestedKey) {
      preloadMusicBuffer(requestedKey)
        .then(() => {
          const current = musicWebTracks[slot];
          if (current && !current.stopped && current.fallback && current.requestedKey === requestedKey && activeMusicTrack === slot) {
            startMusicSlot(slot, mapMusicProfile(state?.map || selectedMap, state?.player?.skin || selectedSkin));
          }
        })
        .catch(() => {});
    }
    source.onended = () => {
      if (musicWebTracks[slot]?.source === source && !musicWebTracks[slot].stopped) {
        musicWebTracks[slot] = null;
      }
    };
    markMusicPlayLatency(startedAt);
    return true;
  } catch {
    return false;
  }
}

function webMusicTrackTime(slot) {
  const track = musicWebTracks[slot];
  if (!track || !sfxAudioContext || track.stopped) return null;
  const buffer = musicBuffers.get(track.key);
  const duration = buffer?.duration || 0;
  const elapsed = Math.max(0, sfxAudioContext.currentTime - track.startedAt) * track.rate;
  const time = track.offset + elapsed;
  return duration > 0 ? time % duration : time;
}

function isMusicTrackPlaying(slot) {
  const audio = musicSlotAudio(slot);
  return !!(musicWebTracks[slot] && !musicWebTracks[slot].stopped) || !!(audio && !audio.paused);
}

function startMusicSlot(slot, profile = mapMusicProfile(state?.map || selectedMap), options = {}) {
  const audio = musicSlotAudio(slot);
  const otherSlot = slot === "rush" ? "main" : "rush";
  const other = musicSlotAudio(otherSlot);
  const volume = muted ? 0 : profileVolumeForSlot(slot, profile);
  stopWebMusicTrack(otherSlot);
  if (other) {
    other.pause();
    other.volume = 0;
  }
  if (!audio) return false;
  audio.volume = volume;
  audio.muted = muted;
  if (!muted && playWebMusicTrack(slot, volume)) {
    audio.pause();
    if (options.markActive !== false) activeMusicTrack = slot;
    return true;
  }
  if (!muted) {
    const startedAt = performance.now();
    audio.play().then(() => markMusicPlayLatency(startedAt)).catch(() => {});
  }
  if (options.markActive !== false) activeMusicTrack = slot;
  return false;
}

function armMusicForStart(track = "main") {
  if (!music || !rushMusic || muted) return;
  const profile = configureMusicForMap(selectedMap, selectedSkin);
  const slot = track === "rush" ? "rush" : "main";
  const audio = musicSlotAudio(slot);
  const other = slot === "rush" ? music : rushMusic;
  const alreadyArmed = armedMusicTrack === slot && audio && !audio.paused;
  if (!alreadyArmed) seekMusicSlotToStart(slot, true);
  audioGestureUnlocked = true;
  primeSoundPoolsForGesture(slot, { unlock: true });
  audio.volume = muted ? 0 : profileVolumeForSlot(slot, profile);
  audio.muted = muted;
  other.volume = 0;
  other.pause();
  armedMusicTrack = slot;
  const usedWebAudio = startMusicSlot(slot, profile, { markActive: false });
  if (!usedWebAudio) {
    const fallbackTrack = audio;
    fallbackTrack.addEventListener("playing", () => {
      if (armedMusicTrack === slot && state?.phase === "menu" && fallbackTrack.currentTime > 1.25) {
        seekMusicSlotToStart(slot, true);
      }
    }, { once: true });
  }
}

function playSound(key, options = {}) {
  if (muted || !soundPools[key]) return;
  const now = performance.now();
  const cooldown = options.cooldown ?? soundConfig[key]?.cooldown ?? 0;
  if (!options.force && now - (soundLastPlayed.get(key) || -Infinity) < cooldown) return;
  soundLastPlayed.set(key, now);
  const volume = soundVolume(key, options.gain ?? 1);
  sfxDebug.attempts += 1;
  sfxDebug.lastKey = key;
  sfxDebug.lastVolume = volume;
  if (audioGestureUnlocked) preloadSfxBuffer(key);
  if (playBufferedSound(key, volume)) return;
  const pool = soundPools[key];
  const clip = pool.find((a) => a.paused || a.ended) || pool[0];
  try {
    clip.muted = false;
    clip.preload = "auto";
    clip.volume = volume;
    if (clip.readyState === 0) clip.load();
    clip.currentTime = 0;
    const playResult = clip.play();
    if (playResult?.then) {
      playResult.then(() => {
        sfxDebug.started += 1;
      }).catch(() => {
        sfxDebug.blocked += 1;
      });
    } else {
      sfxDebug.started += 1;
    }
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

function mapMusicProfile(mapId = selectedMap, skinId = state?.player?.skin || selectedSkin) {
  const profile = mapVariant(mapId).music || {};
  const skinProfile = skinId ? playerSkinMap[skinId]?.music || {} : {};
  return {
    theme: skinProfile.theme || profile.theme || mapVariant(mapId).name,
    mainKey: skinProfile.main || profile.main || "bgmMain",
    rushKey: skinProfile.rush || profile.rush || "bgmRush",
    mainVolume: skinProfile.mainVolume ?? profile.mainVolume ?? musicConfig.main,
    rushVolume: skinProfile.rushVolume ?? profile.rushVolume ?? musicConfig.rush,
    rushStart: skinProfile.rushStart ?? profile.rushStart ?? musicConfig.rushStart,
    rushFade: skinProfile.rushFade ?? profile.rushFade ?? musicConfig.rushFade,
    mainStartAt: skinProfile.mainStartAt ?? profile.mainStartAt ?? 0,
    rushStartAt: skinProfile.rushStartAt ?? profile.rushStartAt ?? 0,
    mainRate: skinProfile.mainRate ?? profile.mainRate ?? 1,
    rushRate: skinProfile.rushRate ?? profile.rushRate ?? 1,
  };
}

function configureMusicForMap(mapId = selectedMap, skinId = state?.player?.skin || selectedSkin) {
  const profile = mapMusicProfile(mapId, skinId);
  setMusicSource("main", profile.mainKey, { startAt: LOW_LATENCY_MUSIC_START ? 0 : profile.mainStartAt, rate: profile.mainRate });
  setMusicSource("rush", profile.rushKey, { startAt: LOW_LATENCY_MUSIC_START ? 0 : profile.rushStartAt, rate: profile.rushRate });
  return profile;
}

function setMusicSource(slot, key, meta = {}) {
  const audio = slot === "rush" ? rushMusic : music;
  if (!audio) return;
  const nextMeta = {
    startAt: Math.max(0, meta.startAt || 0),
    rate: clamp(meta.rate || 1, 0.85, 1.12),
  };
  const currentMeta = musicTrackMeta[slot] || { startAt: 0, rate: 1 };
  const keyChanged = musicTrackKeys[slot] !== key;
  const metaChanged = Math.abs(currentMeta.startAt - nextMeta.startAt) > 0.05 || Math.abs(currentMeta.rate - nextMeta.rate) > 0.001;
  if (!keyChanged && !metaChanged) return;
  if (keyChanged) {
    if (armedMusicTrack === slot) armedMusicTrack = null;
    stopWebMusicTrack(slot);
    audio.pause();
    audio.src = resolvedAudioSource(key);
    audio.load();
    audio.volume = 0;
  } else if (metaChanged) {
    stopWebMusicTrack(slot);
  }
  audio.playbackRate = nextMeta.rate;
  musicTrackKeys[slot] = key;
  musicTrackMeta[slot] = nextMeta;
  seekMusicSlotToStart(slot, true);
  if (keyChanged || activeMusicTrack === slot) activeMusicTrack = null;
}

function seekMusicSlotToStart(slot, force = false) {
  const audio = slot === "rush" ? rushMusic : music;
  const startAt = Math.max(0, musicTrackMeta[slot]?.startAt || 0);
  if (!audio) return;
  const seek = () => {
    try {
      if (force || Math.abs((audio.currentTime || 0) - startAt) > 0.08) {
        audio.currentTime = startAt;
      }
    } catch {}
  };
  if (audio.readyState >= 1) seek();
  else audio.addEventListener("loadedmetadata", seek, { once: true });
}

function syncMusic() {
  if (!music || !rushMusic) return;
  const profile = configureMusicForMap(state.map, state.player.skin);
  music.muted = muted;
  rushMusic.muted = muted;
  const gameplayMusicActive = state.phase === "playing" || state.phase === "levelup";
  if (muted || !gameplayMusicActive) {
    stopMusicTracks();
    return;
  }
  const nextTrack = state.elapsed >= profile.rushStart ? "rush" : "main";
  if (activeMusicTrack !== nextTrack) switchMusicTrack(nextTrack, profile);
  music.volume = nextTrack === "main" ? profileVolumeForSlot("main", profile) : 0;
  rushMusic.volume = nextTrack === "rush" ? profileVolumeForSlot("rush", profile) : 0;
  setWebMusicVolume("main", music.volume);
  setWebMusicVolume("rush", rushMusic.volume);
  if (!isMusicTrackPlaying(nextTrack)) {
    startMusicSlot(nextTrack, profile);
  }
}

function switchMusicTrack(track, profile = mapMusicProfile(state.map)) {
  const from = track === "rush" ? music : rushMusic;
  const to = track === "rush" ? rushMusic : music;
  const meta = musicTrackMeta[track] || { startAt: 0, rate: 1 };
  from.pause();
  from.volume = 0;
  stopWebMusicTrack(track === "rush" ? "main" : "rush");
  to.playbackRate = meta.rate;
  try {
    if (meta.startAt > 0 && (!Number.isFinite(to.currentTime) || to.currentTime < meta.startAt || to.currentTime > meta.startAt + 8)) {
      to.currentTime = meta.startAt;
    }
  } catch {}
  to.volume = profileVolumeForSlot(track, profile);
  to.muted = muted;
  startMusicSlot(track, profile);
}

function stopMusicTracks() {
  music.pause();
  rushMusic.pause();
  stopWebMusicTrack("main");
  stopWebMusicTrack("rush");
  music.volume = 0;
  rushMusic.volume = 0;
  activeMusicTrack = null;
  armedMusicTrack = null;
}

function resetMusicTracks() {
  stopMusicTracks();
  seekMusicSlotToStart("main", true);
  seekMusicSlotToStart("rush", true);
}

function prepareMusicForRun(expectedTrack = "main") {
  const slot = expectedTrack === "rush" ? "rush" : "main";
  const profile = configureMusicForMap(state.map, state.player.skin);
  if (armedMusicTrack !== slot || muted) {
    resetMusicTracks();
    if (!muted) {
      const audio = musicSlotAudio(slot);
      seekMusicSlotToStart(slot, true);
      audio.muted = false;
      audio.volume = profileVolumeForSlot(slot, profile);
      startMusicSlot(slot, profile);
    }
    return;
  }
  const audio = musicSlotAudio(slot);
  const other = slot === "rush" ? music : rushMusic;
  if (!audio || !other) {
    resetMusicTracks();
    return;
  }
  other.pause();
  other.volume = 0;
  audio.volume = profileVolumeForSlot(slot, profile);
  audio.muted = muted;
  if (!isMusicTrackPlaying(slot)) {
    startMusicSlot(slot, profile);
  }
  activeMusicTrack = slot;
}

function startGame(options = {}) {
  if (!ready) return;
  quickMode = options.quick === true;
  selectedMap = normalizeSelectedMap(selectedMap);
  loadImageKeys([...mapImageKeys(selectedMap), ...skinImageKeys(selectedSkin)], () => {}).catch(() => {});
  preloadMusicForSelection(selectedMap, selectedSkin);
  resetSpeechForRun();
  state = makeState();
  state.phase = "playing";
  configureMusicForMap(state.map, state.player.skin);
  updatePlayerLabel();
  if (quickMode) {
    state.elapsed = 135;
    state.pressureTimer = 1.2;
    raiseWeapon("coconut");
    raiseWeapon("compass");
    state.level = 4;
    state.nextXp = nextLevelXp(state.level);
  }
  prepareMusicForRun(quickMode ? "rush" : "main");
  ui.startOverlay.hidden = true;
  ui.endOverlay.hidden = true;
  ui.upgradeOverlay.hidden = true;
  ui.hud.hidden = false;
  ui.loadout.hidden = false;
  ui.cornerControls.hidden = false;
  ui.touchControls.hidden = false;
  syncMusic();
  playSkinSound("confirm", "confirm");
  const skinName = playerSkinMap[state.player.skin]?.name || playerSkinMap.default.name;
  speak(
    quickMode ? `Schnelle Welle. ${skinName} steht schon am Bug!` : `${skinName} bereit. Halt den Strand!`,
    { key: "start", interrupt: true, cooldown: 0 },
  );
  lastTime = performance.now();
  lastRenderTime = 0;
  lastUpdateTime = lastTime;
  skippedRenderFrames = 0;
  skippedUpdateFrames = 0;
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
  playSkinSound(victory ? "powerup" : "hurt", victory ? "chime" : "gate", { force: true });
  syncMusic();
  speak(
    victory ? "Strand gehalten. Die Affenflut zieht ab!" : "Die Geistercrew war schneller. Nochmal in die Flut!",
    { key: victory ? "victory" : "gameover", interrupt: true, cooldown: 0 },
  );
}

function loop(now) {
  const playing = state.phase === "playing";
  const minUpdateMs = playing ? updateFrameMsCap() : 0;
  if (playing && (minUpdateMs <= 0 || now - lastUpdateTime >= minUpdateMs)) {
    const dt = Math.min(0.05, (now - (lastUpdateTime || lastTime)) / 1000 || 0);
    lastUpdateTime = now;
    lastTime = now;
    update(dt);
  } else if (playing) {
    skippedUpdateFrames += 1;
  } else {
    lastTime = now;
    lastUpdateTime = now;
  }
  const minRenderMs = playing ? renderFrameMsCap() : 0;
  if (minRenderMs <= 0 || now - lastRenderTime >= minRenderMs) {
    render();
    lastRenderTime = now;
  } else {
    skippedRenderFrames += 1;
  }
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
  updatePlayerAction(dt);
  updatePlayer(dt);
  ensurePropChunks();
  updateTidePuddles(dt);
  updatePowerups(dt);
  updateWeapons(dt);
  updateSignatureMove(dt);
  updateSpawns(dt);
  updateEnemies(dt);
  updateExploration();
  updateProjectiles(dt);
  updateGems(dt);
  updateStreak(dt);
  updateParticles(dt);
  updateDomThrottled(dt);
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
    const skinName = playerSkinMap[state.player.skin]?.name || playerSkinMap.default.name;
    speak(`Vorsicht, ${skinName}. Such Limetten!`, { key: "low-hp", interrupt: true, cooldown: 12000, rate: 1.04 });
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
  const dashBoost = p.dash > 0 ? CONTROL_TUNING.dashBoost : 1;
  const speedBoost = activePowerMultiplier("speed");
  moveActorWithObstacles(p, input.x * state.stats.speed * speedBoost * dashBoost, input.y * state.stats.speed * speedBoost * dashBoost, dt, p.r);
  state.camera.x += (p.x - state.camera.x) * Math.min(1, dt * CONTROL_TUNING.cameraCatchup);
  state.camera.y += (p.y - state.camera.y) * Math.min(1, dt * CONTROL_TUNING.cameraCatchup);
}

function dash() {
  if (state.phase !== "playing") return;
  const p = state.player;
  if (p.dashCooldown > 0) return;
  p.dash = CONTROL_TUNING.dashDuration;
  p.dashCooldown = state.stats.dashCooldown;
  p.invuln = Math.max(p.invuln, 0.3);
  playSkinSound("dash", "downloadDash", { force: true });
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
  for (const prop of propsNearActor(actor, radius + 420)) {
    if (!propBlocksMovement(prop)) continue;
    if (Math.abs(prop.x - actor.x) > radius + 360 || Math.abs(prop.y - actor.y) > radius + 320) continue;
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
  for (const prop of propsNearActor({ x: lookX, y: lookY }, radius + 460)) {
    if (!propBlocksMovement(prop)) continue;
    if (Math.abs(prop.x - lookX) > radius + 420 || Math.abs(prop.y - lookY) > radius + 380) continue;
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

function propsNearActor(actor, margin = 520) {
  if (!state?.propsByChunk || state.propsByChunk.size === 0) return state?.props || [];
  const centerX = Math.floor(actor.x / PROP_CHUNK);
  const centerY = Math.floor(actor.y / PROP_CHUNK);
  const span = Math.max(1, Math.ceil(margin / PROP_CHUNK));
  const nearby = [...(state.looseProps || [])];
  for (let cx = centerX - span; cx <= centerX + span; cx += 1) {
    for (let cy = centerY - span; cy <= centerY + span; cy += 1) {
      const list = state.propsByChunk.get(chunkKey(cx, cy));
      if (list) nearby.push(...list);
    }
  }
  return nearby;
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
  const stick = tunedStickVector(pointer.dx, pointer.dy);
  x += stick.x;
  y += stick.y;
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y };
}

function tunedStickVector(dx, dy) {
  const len = Math.hypot(dx, dy);
  if (len <= CONTROL_TUNING.stickDeadzone) return { x: 0, y: 0, magnitude: 0 };
  const normalized = clamp((len - CONTROL_TUNING.stickDeadzone) / (CONTROL_TUNING.stickFullAt - CONTROL_TUNING.stickDeadzone), 0, 1);
  const magnitude = Math.pow(normalized, CONTROL_TUNING.stickCurve);
  return {
    x: dx / len * magnitude,
    y: dy / len * magnitude,
    magnitude,
  };
}

function updateWeapons(dt) {
  const w = state.weapons;
  const p = state.player;
  const cooldownMult = activeCooldownMultiplier();
  w.cutlass.timer -= dt;
  if (w.cutlass.timer <= 0) {
    const lvl = w.cutlass.level;
    const baseCooldown = isGuileSkin() ? 0.72 : isRyuSkin() ? 0.66 : isChunLiSkin() ? 0.54 : 0.6;
    const cooldown = Math.max(0.18, (baseCooldown - lvl * 0.05) * cooldownMult);
    w.cutlass.timer = cooldown;
    const direction = Math.atan2(p.moveY || 0.15, p.moveX || p.facing);
    if (isGuileSkin()) {
      fireGuileSonicBoom(lvl, direction);
    } else if (isRyuSkin()) {
      fireRyuHadoken(lvl, direction);
    } else if (isChunLiSkin()) {
      castChunLiThousandKick(lvl, direction);
    } else {
      slash(direction, 114 + lvl * 18, 44 + lvl * 8, 28 + lvl * 10, lvl);
      if (saberTornadoReady()) castSaberTornado(direction, lvl, w.rope.level);
    }
  }
  if (w.coconut.level > 0) {
    w.coconut.timer -= dt;
    if (w.coconut.timer <= 0) {
      w.coconut.timer = Math.max(0.18, (0.82 - w.coconut.level * 0.08) * cooldownMult);
      fireCoconut(w.coconut.level);
    }
  }
  if (w.compass.level > 0) {
    w.compass.angle += dt * (1.55 + w.compass.level * 0.1);
    w.compass.timer -= dt;
    updateCompassDamage(dt);
    if (w.compass.timer <= 0) {
      w.compass.timer = Math.max(0.28, (1.22 - w.compass.level * 0.12) * cooldownMult);
      fireCompassBeam(w.compass.level);
    }
  }
  if (w.bottle.level > 0) {
    w.bottle.timer -= dt;
    if (w.bottle.timer <= 0) {
      w.bottle.timer = Math.max(0.46, (1.92 - w.bottle.level * 0.18) * cooldownMult);
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

function updateSignatureMove(dt) {
  const signature = state.characterTrait?.signature;
  if (!signature) return;
  if (!state.signatureMove) state.signatureMove = { timer: 1.2, casts: 0, last: null };
  state.signatureMove.timer -= dt;
  if (state.signatureMove.timer > 0) return;
  const cast = castSignatureMove(signature);
  const cooldown = Math.max(1.35, (signature.cooldown || 4) * Math.max(0.7, activeCooldownMultiplier()) * (state.stats.signatureCooldown || 1));
  state.signatureMove.timer = cast ? cooldown : 0.35;
}

function ensureRyuArsenal() {
  if (!state.ryuArsenal) state.ryuArsenal = { casts: 0, hadokens: 0, weaponHadokens: 0, shoryukens: 0, whirlwindKicks: 0 };
  if (state.ryuArsenal.weaponHadokens === undefined) state.ryuArsenal.weaponHadokens = 0;
  return state.ryuArsenal;
}

function ensureChunLiArsenal() {
  if (!state.chunLiArsenal) state.chunLiArsenal = { casts: 0, kiKouKens: 0, thousandKicks: 0, whirlwindKicks: 0, lightningKicks: 0 };
  return state.chunLiArsenal;
}

function castSignatureMove(signature) {
  const target = nearestEnemy();
  if (!target) return false;
  const p = state.player;
  const angle = Math.atan2(target.y - p.y, target.x - p.x);
  const damage = (signature.damage || 28) * state.stats.damage * (state.stats.signatureDamage || 1);
  if (signature.id === "sonicBoom") {
    triggerPlayerAction("sonicBoom", 0.5);
    if (!state.guileArsenal) state.guileArsenal = { casts: 0, sonicBooms: 0, kneeBazookas: 0, reversePunches: 0, flashKicks: 0 };
    state.guileArsenal.sonicBooms += 1;
  } else if (signature.id === "hadoken" && isRyuSkin()) {
    const arsenal = ensureRyuArsenal();
    triggerPlayerAction("hadoken", 0.68);
    arsenal.casts += 1;
    arsenal.hadokens += 1;
  } else if (signature.id === "kiKouKen" && isChunLiSkin()) {
    const arsenal = ensureChunLiArsenal();
    triggerPlayerAction("kiKouKen", 0.68);
    arsenal.casts += 1;
    arsenal.kiKouKens += 1;
  }
  if (signature.pattern === "burst") {
    const radius = signature.radius || 126;
    state.zones.push({ type: "signatureBurst", x: p.x, y: p.y, radius, life: 0.36, maxLife: 0.36, signature: signature.id, angle });
    for (const enemy of state.enemies) {
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= radius + enemy.r) {
        hurtEnemy(enemy, damage, dx / Math.max(1, dist), dy / Math.max(1, dist));
      }
    }
  } else if (signature.pattern === "trap") {
    const radius = signature.radius || 136;
    state.zones.push({ type: "signatureTrap", x: target.x, y: target.y, radius, life: 0.82, maxLife: 0.82, signature: signature.id, angle });
    for (const enemy of state.enemies) {
      const dx = enemy.x - target.x;
      const dy = enemy.y - target.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= radius + enemy.r) {
        enemy.speed *= 0.985;
        hurtEnemy(enemy, damage * 0.86, dx / Math.max(1, dist), dy / Math.max(1, dist));
      }
    }
  } else {
    const count = signature.pattern === "fan" ? Math.max(1, signature.count || 3) : 1;
    const spread = signature.spread || 0;
    for (let i = 0; i < count; i += 1) {
      const shotAngle = angle + (i - (count - 1) / 2) * spread;
      fireSignatureProjectile(signature, shotAngle);
    }
  }
  state.signatureMove.casts += 1;
  state.signatureMove.last = signature.id;
  if (signature.id === "hadoken" && isRyuSkin()) {
    const arsenal = ensureRyuArsenal();
    if (arsenal.casts % 3 === 0) castRyuShoryuken(signature, angle);
    if (arsenal.casts % 5 === 0) castRyuWhirlwindKick(signature, angle);
  }
  if (signature.id === "kiKouKen" && isChunLiSkin()) {
    const arsenal = ensureChunLiArsenal();
    if (arsenal.casts % 3 === 0) castChunLiWhirlwindKick(signature, angle);
    if (arsenal.casts % 5 === 0) castChunLiLightningKick(signature, angle);
  }
  floatingText(signature.label || "Signature", p.x, p.y - 112, signature.color || "#fff2c7", 0.72, 22, { priority: 2 });
  playSkinSound("powerup", "upgradeMagic", { cooldown: 1200 });
  return true;
}

function fireSignatureProjectile(signature, angle) {
  const p = state.player;
  if (signature.id === "sonicBoom") {
    const level = Math.max(1, state.weapons.cutlass.level || 1);
    const stage = sonicBoomStage(level);
    const speed = Math.max(signature.speed || 560, 690 + level * 18 + stage * 34);
    state.projectiles.push({
      type: "signature",
      icon: "sonicBoom",
      signatureId: "sonicBoom",
      sonicLevel: level,
      sonicStage: stage,
      animSeed: Math.floor(Math.random() * SONIC_BOOM_FX.frames),
      x: p.x + Math.cos(angle) * 58,
      y: p.y + Math.sin(angle) * 38 - 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 24 + stage * 3 + Math.min(4, level),
      damage: (signature.damage || 26) + level * 5,
      signatureDamage: state.stats.signatureDamage || 1,
      life: 1.55 + stage * 0.18 + level * 0.04,
      pierce: Math.max(signature.pierce ?? 1, 2 + stage + Math.floor(level / 3)),
      spin: angle,
      size: 112 + stage * 20 + level * 2,
      retarget: false,
    });
    return;
  }
  if (signature.id === "hadoken" && isRyuSkin()) {
    const focus = Math.max(1, Math.min(7, state.level + Math.floor((state.signatureMove?.casts || 0) / 2)));
    fireRyuHadoken(focus, angle, { signature, countArsenal: false, action: false, signatureCast: true });
    return;
  }
  if (signature.id === "kiKouKen" && isChunLiSkin()) {
    const focus = Math.max(1, Math.min(8, state.level + Math.floor((ensureChunLiArsenal().casts || 0) / 2)));
    const speed = Math.max(signature.speed || 620, 760 + focus * 18);
    state.projectiles.push({
      type: "signature",
      icon: "kiKouKen",
      signatureId: "kiKouKen",
      fx: "kiKouKen",
      animSeed: Math.floor(Math.random() * CHUN_LI_PROJECTILE_FX.frames),
      x: p.x + Math.cos(angle) * 58,
      y: p.y + Math.sin(angle) * 38 - 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: (signature.radius || 22) + 2 + Math.min(7, focus),
      damage: (signature.damage || 30) + focus * 4,
      signatureDamage: state.stats.signatureDamage || 1,
      life: 1.72 + focus * 0.05,
      pierce: Math.max(signature.pierce ?? 1, 3 + Math.floor(focus / 2)),
      spin: angle,
      size: 104 + focus * 4,
      retarget: false,
    });
    return;
  }
  const speed = signature.speed || 560;
  state.projectiles.push({
    type: "signature",
    icon: signature.icon || "compassBolt",
    signatureId: signature.id,
    x: p.x + Math.cos(angle) * 36,
    y: p.y + Math.sin(angle) * 36,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: signature.radius || 18,
    damage: signature.damage || 26,
    signatureDamage: state.stats.signatureDamage || 1,
    life: 2.1,
    pierce: signature.pierce ?? 1,
    spin: 0,
    retarget: signature.pattern !== "fan",
  });
}

function fireRyuHadoken(level, fallbackAngle = 0, options = {}) {
  const p = state.player;
  const signature = options.signature || state.characterTrait?.signature || { id: "hadoken", speed: 690, damage: 34, radius: 21, pierce: 2 };
  const target = nearestEnemy();
  const angle = options.exactAngle === false && target ? Math.atan2(target.y - p.y, target.x - p.x) : (target && !options.signatureCast ? Math.atan2(target.y - p.y, target.x - p.x) : fallbackAngle);
  const safeLevel = Math.max(1, level || 1);
  const stage = ryuHadokenStage(safeLevel);
  const speed = Math.max(signature.speed || 620, 720 + safeLevel * 36 + stage * 40);
  const count = safeLevel >= 7 ? 2 : 1;
  const spread = count > 1 ? 0.16 : 0;
  const arsenal = ensureRyuArsenal();
  if (options.countArsenal !== false) {
    arsenal.casts += 1;
    arsenal.hadokens += count;
    arsenal.weaponHadokens += count;
  }
  if (options.action !== false) triggerPlayerAction("hadoken", options.signatureCast ? 0.68 : 0.56);
  for (let i = 0; i < count; i += 1) {
    const shotAngle = angle + (i - (count - 1) / 2) * spread;
    state.projectiles.push({
      type: "signature",
      icon: "hadoken",
      signatureId: "hadoken",
      hadokenLevel: safeLevel,
      hadokenStage: stage,
      animSeed: Math.floor(Math.random() * RYU_HADOKEN_FX.frames),
      x: p.x + Math.cos(shotAngle) * 58,
      y: p.y + Math.sin(shotAngle) * 38 - 8,
      vx: Math.cos(shotAngle) * speed,
      vy: Math.sin(shotAngle) * speed,
      r: (signature.radius || 20) + 3 + stage * 3 + Math.min(5, safeLevel),
      damage: (signature.damage || 30) + safeLevel * (options.signatureCast ? 5 : 7) + stage * 4,
      signatureDamage: state.stats.signatureDamage || 1,
      life: 1.58 + safeLevel * 0.06 + stage * 0.1,
      pierce: Math.max(signature.pierce ?? 1, 1 + stage + Math.floor(safeLevel / 3)),
      spin: shotAngle,
      size: 96 + stage * 18 + safeLevel * 3,
      retarget: false,
    });
  }
  playSkinSound("hit", "quickCutlass", { cooldown: options.signatureCast ? 420 : 220 });
  if (!options.signatureCast && safeLevel >= 3 && arsenal.casts % 4 === 0) castRyuShoryuken(signature, angle);
  if (!options.signatureCast && safeLevel >= 6 && arsenal.casts % 7 === 0) castRyuWhirlwindKick(signature, angle);
}

function castRyuShoryuken(signature, angle) {
  const p = state.player;
  const arsenal = ensureRyuArsenal();
  arsenal.shoryukens += 1;
  triggerPlayerAction("shoryuken", 0.72);
  const radius = 82 + Math.min(28, state.level * 3);
  const cx = p.x + Math.cos(angle) * 48;
  const cy = p.y + Math.sin(angle) * 34 - 38;
  state.zones.push({ type: "ryuStrike", move: "shoryuken", x: cx, y: cy, angle, radius, life: 0.34, maxLife: 0.34, signature: signature.id });
  for (const enemy of state.enemies) {
    const dx = enemy.x - cx;
    const dy = enemy.y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist <= radius + enemy.r) {
      hurtEnemy(enemy, (signature.damage || 32) * 0.82 * state.stats.damage * (state.stats.signatureDamage || 1), dx / Math.max(1, dist), -1.15);
      enemy.y -= 20;
    }
  }
  shake(0.38);
  playSkinSound("hit", "cutlassImpact", { cooldown: 360 });
}

function castRyuWhirlwindKick(signature, angle) {
  const p = state.player;
  const arsenal = ensureRyuArsenal();
  arsenal.whirlwindKicks += 1;
  triggerPlayerAction("whirlwindKick", 0.78);
  const radius = 118 + Math.min(36, state.level * 4);
  state.zones.push({ type: "ryuWhirlwind", move: "whirlwindKick", x: p.x, y: p.y - 16, angle, radius, life: 0.42, maxLife: 0.42, signature: signature.id });
  for (const enemy of state.enemies) {
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= radius + enemy.r) {
      const tangentX = -dy / Math.max(1, dist);
      const tangentY = dx / Math.max(1, dist);
      hurtEnemy(enemy, (signature.damage || 32) * 0.62 * state.stats.damage * (state.stats.signatureDamage || 1), tangentX * 0.75, tangentY * 0.75);
      enemy.x += tangentX * 18;
      enemy.y += tangentY * 18;
    }
  }
  shake(0.24);
  playSkinSound("dash", "dashWhooshFast", { cooldown: 360 });
}

function castChunLiThousandKick(level, fallbackAngle = 0) {
  const p = state.player;
  const arsenal = ensureChunLiArsenal();
  const target = nearestEnemy();
  const angle = target ? Math.atan2(target.y - p.y, target.x - p.x) : fallbackAngle;
  arsenal.thousandKicks += 1;
  triggerPlayerAction("thousandKick", 0.52);
  const reach = 106 + level * 9;
  const radius = 66 + level * 6;
  const cx = p.x + Math.cos(angle) * reach * 0.54;
  const cy = p.y + Math.sin(angle) * reach * 0.54 - 6;
  state.zones.push({ type: "chunLiKick", move: "thousandKick", fx: "thousandKickArc", x: cx, y: cy, angle, radius, life: 0.24, maxLife: 0.24, level });
  for (const enemy of state.enemies) {
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    const dist = Math.hypot(dx, dy);
    const delta = Math.abs(shortAngle(Math.atan2(dy, dx) - angle));
    if (dist <= reach + enemy.r && delta < 0.86) {
      hurtEnemy(enemy, (19 + level * 8) * state.stats.damage, Math.cos(angle), Math.sin(angle));
    }
  }
  playSkinSound("slash", "quickCutlass", { cooldown: 180 });
  if (level >= 5 && arsenal.thousandKicks % 8 === 0) castChunLiWhirlwindKick(state.characterTrait?.signature || { id: "thousandKick", damage: 28 }, angle);
}

function castChunLiWhirlwindKick(signature, angle) {
  const p = state.player;
  const arsenal = ensureChunLiArsenal();
  arsenal.whirlwindKicks += 1;
  triggerPlayerAction("whirlwindKick", 0.78);
  const radius = 116 + Math.min(38, state.level * 4);
  state.zones.push({ type: "chunLiWhirlwind", move: "whirlwindKick", fx: "whirlwindKickArc", x: p.x, y: p.y - 12, angle, radius, life: 0.42, maxLife: 0.42, signature: signature.id });
  for (const enemy of state.enemies) {
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= radius + enemy.r) {
      const tangentX = -dy / Math.max(1, dist);
      const tangentY = dx / Math.max(1, dist);
      hurtEnemy(enemy, (signature.damage || 30) * 0.66 * state.stats.damage * (state.stats.signatureDamage || 1), tangentX * 0.82, tangentY * 0.82);
      enemy.x += tangentX * 20;
      enemy.y += tangentY * 20;
    }
  }
  shake(0.22);
  playSkinSound("dash", "dashWhooshFast", { cooldown: 360 });
}

function castChunLiLightningKick(signature, angle) {
  const p = state.player;
  const arsenal = ensureChunLiArsenal();
  arsenal.lightningKicks += 1;
  triggerPlayerAction("lightningKick", 0.66);
  const radius = 92 + Math.min(32, state.level * 4);
  const cx = p.x + Math.cos(angle) * 54;
  const cy = p.y + Math.sin(angle) * 34 - 34;
  state.zones.push({ type: "chunLiKick", move: "lightningKick", fx: "thousandKickArc", x: cx, y: cy, angle, radius, life: 0.34, maxLife: 0.34, signature: signature.id });
  p.invuln = Math.max(p.invuln, 0.24);
  for (const enemy of state.enemies) {
    const dx = enemy.x - cx;
    const dy = enemy.y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist <= radius + enemy.r) {
      hurtEnemy(enemy, (signature.damage || 30) * 0.78 * state.stats.damage * (state.stats.signatureDamage || 1), dx / Math.max(1, dist), -1.05);
      enemy.y -= 16;
    }
  }
  shake(0.3);
  playSkinSound("hit", "cutlassImpact", { cooldown: 340 });
}

const CUTLASS_FORWARD_RATIO = 0.72;
const CUTLASS_MIN_FORWARD = 72;
const CUTLASS_FX_BACK_RATIO = 0.18;

function slash(angle, radius, arc, damage, level = 1) {
  const p = state.player;
  const blades = cutlassBladeCount(level);
  const forward = Math.max(CUTLASS_MIN_FORWARD, radius * CUTLASS_FORWARD_RATIO);
  const x = p.x + Math.cos(angle) * forward;
  const y = p.y + Math.sin(angle) * forward;
  state.zones.push({
    type: "slash",
    x,
    y,
    originX: p.x,
    originY: p.y,
    forward,
    fxBackRatio: CUTLASS_FX_BACK_RATIO,
    angle,
    radius,
    arc: arc * Math.PI / 180,
    level,
    blades,
    life: 0.2,
    maxLife: 0.2,
  });
  playSkinSound("slash", "slashSwish");
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  for (const enemy of state.enemies) {
    const playerDx = enemy.x - p.x;
    const playerDy = enemy.y - p.y;
    const forwardDist = playerDx * dirX + playerDy * dirY;
    if (forwardDist < Math.max(10, enemy.r * 0.18)) continue;
    const dx = enemy.x - x;
    const dy = enemy.y - y;
    const dist = Math.hypot(dx, dy);
    if (dist > radius + enemy.r) continue;
    const targetAngle = Math.atan2(playerDy, playerDx);
    const bladeSpread = blades > 1 ? Math.min(0.58, 0.12 * (blades - 1)) : 0;
    let caught = forwardDist < 64 && Math.abs(-dirY * playerDx + dirX * playerDy) < 54;
    for (let i = 0; i < blades && !caught; i += 1) {
      const bladeAngle = angle + (i - (blades - 1) / 2) * bladeSpread;
      const delta = Math.abs(shortAngle(targetAngle - bladeAngle));
      caught = delta < arc * Math.PI / 180 * (blades > 1 ? 0.64 : 1);
    }
    if (caught) {
      const playerDist = Math.max(1, Math.hypot(playerDx, playerDy));
      hurtEnemy(enemy, damage * state.stats.damage, playerDx / playerDist, playerDy / playerDist);
    }
  }
}

function fireGuileSonicBoom(level, fallbackAngle = 0) {
  const p = state.player;
  if (!state.guileArsenal) state.guileArsenal = { casts: 0, sonicBooms: 0, kneeBazookas: 0, reversePunches: 0, flashKicks: 0 };
  const target = nearestEnemy();
  const angle = target ? Math.atan2(target.y - p.y, target.x - p.x) : fallbackAngle;
  const stage = sonicBoomStage(level);
  const speed = 690 + level * 30 + stage * 36;
  const count = level >= 7 ? 2 : 1;
  const spread = count > 1 ? 0.18 : 0;
  state.guileArsenal.sonicBooms += count;
  state.guileArsenal.casts += 1;
  triggerPlayerAction("sonicBoom", 0.5);
  for (let i = 0; i < count; i += 1) {
    const shotAngle = angle + (i - (count - 1) / 2) * spread;
    state.projectiles.push({
      type: "signature",
      icon: "sonicBoom",
      signatureId: "sonicBoom",
      sonicLevel: level,
      sonicStage: stage,
      animSeed: Math.floor(Math.random() * SONIC_BOOM_FX.frames),
      x: p.x + Math.cos(shotAngle) * 60,
      y: p.y + Math.sin(shotAngle) * 40 - 10,
      vx: Math.cos(shotAngle) * speed,
      vy: Math.sin(shotAngle) * speed,
      r: 24 + stage * 3 + Math.min(5, level),
      damage: 28 + level * 9 + stage * 4,
      life: 1.45 + level * 0.11 + stage * 0.08,
      pierce: 2 + stage + Math.floor(level / 2),
      spin: shotAngle,
      size: 116 + stage * 20 + level * 3,
      signatureDamage: state.stats.signatureDamage || 1,
      retarget: false,
    });
  }
  playSkinSound("hit", "slashSwish", { cooldown: 260 });
  if (level >= 2 && state.guileArsenal.casts % 3 === 0) castGuileKneeBazooka(level, angle);
  if (level >= 4 && state.guileArsenal.casts % 5 === 0) castGuileReversePunch(level, angle);
  if (level >= 6 && state.guileArsenal.casts % 7 === 0) castGuileFlashKick(level);
}

function castGuileKneeBazooka(level, angle) {
  const p = state.player;
  triggerPlayerAction("kneeBazooka", 0.46);
  state.guileArsenal.kneeBazookas += 1;
  const reach = 106 + level * 7;
  const cx = p.x + Math.cos(angle) * reach * 0.58;
  const cy = p.y + Math.sin(angle) * reach * 0.58;
  state.zones.push({ type: "guileStrike", move: "kneeBazooka", x: cx, y: cy, angle, radius: 74 + level * 5, life: 0.24, maxLife: 0.24 });
  for (const enemy of state.enemies) {
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    const dist = Math.hypot(dx, dy);
    const delta = Math.abs(shortAngle(Math.atan2(dy, dx) - angle));
    if (dist <= reach + enemy.r && delta < 0.74) {
      hurtEnemy(enemy, (22 + level * 7) * state.stats.damage, Math.cos(angle), Math.sin(angle));
    }
  }
}

function castGuileReversePunch(level, angle) {
  const p = state.player;
  triggerPlayerAction("reversePunch", 0.42);
  state.guileArsenal.reversePunches += 1;
  const radius = 88 + level * 9;
  const cx = p.x + Math.cos(angle) * radius * 0.36;
  const cy = p.y + Math.sin(angle) * radius * 0.36;
  state.zones.push({ type: "guileStrike", move: "reversePunch", x: cx, y: cy, angle, radius, life: 0.22, maxLife: 0.22 });
  for (const enemy of state.enemies) {
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    const dist = Math.hypot(dx, dy);
    const delta = Math.abs(shortAngle(Math.atan2(dy, dx) - angle));
    if (dist <= radius + enemy.r && delta < 0.9) {
      hurtEnemy(enemy, (28 + level * 8) * state.stats.damage, Math.cos(angle), Math.sin(angle));
    }
  }
}

function castGuileFlashKick(level) {
  const p = state.player;
  triggerPlayerAction("flashKick", 0.62);
  state.guileArsenal.flashKicks += 1;
  p.invuln = Math.max(p.invuln, 0.36);
  const radius = 118 + level * 10;
  state.zones.push({ type: "guileFlashKick", move: "flashKick", x: p.x, y: p.y - 12, angle: -Math.PI / 2, radius, life: 0.38, maxLife: 0.38 });
  for (const enemy of state.enemies) {
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= radius + enemy.r) {
      hurtEnemy(enemy, (34 + level * 9) * state.stats.damage, dx / Math.max(1, dist), -1.1);
    }
  }
  playSkinSound("dash", "dashWhooshFast", { cooldown: 420 });
}

function updateDomThrottled(dt) {
  if (!state) return;
  state.domTick = (state.domTick || 0) - dt;
  if (state.domTick > 0) return;
  state.domTick = isMobileLike() ? 0.12 : 0.06;
  updateDom();
}

function cutlassBladeCount(level = state?.weapons?.cutlass?.level || 1) {
  return Math.min(5, Math.max(1, Math.floor(level)));
}

function auraEvolutionStage(level = state?.weapons?.rope?.level || 0) {
  if (level <= 1) return 0;
  return Math.min(4, Math.max(1, Math.floor(level - 1)));
}

function saberTornadoReady() {
  return (state?.weapons?.cutlass?.level || 0) >= 5 && (state?.weapons?.rope?.level || 0) >= 3;
}

function coconutCompassReady() {
  return (state?.weapons?.coconut?.level || 0) >= 4 && (state?.weapons?.compass?.level || 0) >= 3;
}

function bottleRopeReady() {
  return (state?.weapons?.bottle?.level || 0) >= 4 && (state?.weapons?.rope?.level || 0) >= 2;
}

function compassRopeReady() {
  return (state?.weapons?.compass?.level || 0) >= 4 && (state?.weapons?.rope?.level || 0) >= 3;
}

function fusionRelicLevel(id) {
  return state?.upgradeCounts?.[id] || 0;
}

function fusionRelicTotalLevel() {
  return fusionRelicIds.reduce((sum, id) => sum + fusionRelicLevel(id), 0);
}

function fusionAmplifierFor(fusionId) {
  return fusionRelicLevel(fusionMomentRelicIcon[fusionId]);
}

function applyFusionRelic(id) {
  const current = fusionRelicLevel(id);
  const next = current + 1;
  if (id === "stormConch") {
    raiseWeapon("coconut");
    if (next >= 2) raiseWeapon("compass");
    state.stats.cooldown = Math.max(0.8, state.stats.cooldown - 0.018);
    state.stats.chainDamage = (state.stats.chainDamage || 0) + 0.08;
    state.stats.speed += 4;
  } else if (id === "bloodMoonAnchor") {
    raiseWeapon("rope");
    state.stats.armor += 1;
    state.stats.damage += 0.028;
    state.player.maxHp += 8;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 16);
  } else if (id === "krakenCompass") {
    raiseWeapon("compass");
    state.stats.magnet += 24;
    state.stats.chainDamage = (state.stats.chainDamage || 0) + 0.12;
    if (next >= 3) raiseWeapon("rope");
  } else if (id === "rumCometLantern") {
    raiseWeapon("bottle");
    state.stats.damage += 0.035;
    state.stats.powerupDuration = (state.stats.powerupDuration || 1) + 0.08;
    state.stats.cooldown = Math.max(0.8, state.stats.cooldown - 0.014);
  }
  const relic = fusionRelicMap[id];
  state.zones.push({ type: "fusionRelic", icon: id, x: state.player.x, y: state.player.y - 22, life: 0.8, maxLife: 0.8, level: next });
  if (next === 2 || next === 4) {
    spawnPowerup(state.player.x + 54, state.player.y - 30, "fusionSpark", { life: 18, cooldown: 7 });
  }
  floatingText(`${relic?.name || "Fusion"} ${next}`, state.player.x, state.player.y - 116, "#fff2c7", 0.75, 22, { priority: 2 });
}

function activeCooldownMultiplier() {
  return (state.stats.cooldown || 1) * activePowerMultiplier("cooldown");
}

function recordFusionMoment(id, label, color = "#fff2c7") {
  if (!state?.fusionMoments) state.fusionMoments = { seen: new Set(), count: 0 };
  if (!(state.fusionMoments.seen instanceof Set)) {
    state.fusionMoments.seen = new Set(state.fusionMoments.seen || []);
  }
  if (state.fusionMoments.seen.has(id)) return false;
  const relicIcon = fusionMomentRelicIcon[id];
  const relicLevel = fusionAmplifierFor(id);
  state.fusionMoments.seen.add(id);
  state.fusionMoments.count += 1;
  state.runStats.fusions += 1;
  metaProgress.fusions += 1;
  state.xp += 18 + state.level * 2 + relicLevel * 4;
  state.coins += 3 + relicLevel;
  floatingText(label, state.player.x, state.player.y - 126, color, 0.95, 28, { priority: 3 });
  if (relicIcon) {
    state.zones.push({ type: "fusionRelic", icon: relicIcon, x: state.player.x, y: state.player.y - 28, life: 0.86, maxLife: 0.86, level: Math.max(1, relicLevel) });
  }
  if (relicLevel > 0) {
    floatingText(`Relikt +${relicLevel}`, state.player.x, state.player.y - 162, "#bfffea", 0.72, 20, { priority: 3 });
  }
  spawnPowerup(state.player.x + 44, state.player.y - 28, "fusionSpark", { life: 18, cooldown: 8 });
  unlockAchievements();
  saveMetaProgress();
  renderMetaProgress();
  renderMetaSkills();
  playSkinSound("powerup", "upgradeMagic", { force: true });
  return true;
}

function castSaberTornado(angle, cutlassLevel, auraLevel) {
  const p = state.player;
  const anchorLevel = fusionAmplifierFor("saberTornado");
  recordFusionMoment("saberTornado", "Fusion: Saebelsturm", "#fff2c7");
  const radius = 116 + cutlassLevel * 8 + auraLevel * 14 + anchorLevel * 22;
  state.zones.push({
    type: "saberTornado",
    x: p.x,
    y: p.y,
    angle,
    radius,
    level: cutlassLevel,
    auraLevel,
    life: 0.58 + anchorLevel * 0.07,
    maxLife: 0.58 + anchorLevel * 0.07,
    fused: true,
    relicLevel: anchorLevel,
  });
  if (anchorLevel > 0) p.invuln = Math.max(p.invuln, 0.25 + anchorLevel * 0.08);
  for (const enemy of state.enemies) {
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > radius + enemy.r) continue;
    hurtEnemy(enemy, (12 + cutlassLevel * 3 + auraLevel * 5 + anchorLevel * 8) * state.stats.damage, dx / Math.max(1, dist), dy / Math.max(1, dist));
  }
}

function fireCoconut(level) {
  const target = nearestEnemy();
  if (!target) return;
  const p = state.player;
  const angle = Math.atan2(target.y - p.y, target.x - p.x);
  const compassFuse = coconutCompassReady();
  const stormLevel = compassFuse ? fusionAmplifierFor("starCoconut") : 0;
  const speed = 420 + level * 18 + stormLevel * 28;
  if (compassFuse) recordFusionMoment("starCoconut", "Fusion: Sternenkokos", "#fff2c7");
  state.projectiles.push({
    type: "coconut",
    icon: compassFuse ? "compassBolt" : "coconutBoomerang",
    x: p.x + Math.cos(angle) * 32,
    y: p.y + Math.sin(angle) * 32,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: compassFuse ? 19 : 17,
    damage: 23 + level * 9 + (compassFuse ? 7 + state.weapons.compass.level * 2 + stormLevel * 6 : 0),
    life: compassFuse ? 3.55 : 3.15,
    pierce: 3 + Math.floor(level / 2) + (compassFuse ? 2 + stormLevel : 0),
    spin: 0,
    compassFuse,
    stormConch: stormLevel,
  });
}

function fireCompassBeam(level) {
  const target = nearestEnemy();
  if (!target) return;
  const p = state.player;
  const damage = 18 + level * 9;
  hurtEnemy(target, damage, Math.sign(target.x - p.x), Math.sign(target.y - p.y));
  state.zones.push({ type: "beam", x: p.x, y: p.y, tx: target.x, ty: target.y, life: 0.16, maxLife: 0.16 });
  playSkinSound("hit", "chime", { cooldown: 520 });
}

function throwBottle(level) {
  const target = nearestEnemy();
  if (!target) return;
  const p = state.player;
  const angle = Math.atan2(target.y - p.y, target.x - p.x);
  const maelstrom = bottleRopeReady();
  const cometLevel = maelstrom ? fusionAmplifierFor("grogMaelstrom") : 0;
  if (maelstrom) recordFusionMoment("grogMaelstrom", "Fusion: Grog-Mahlstrom", "#53ffe5");
  state.projectiles.push({
    type: "bottle",
    icon: "rumBomb",
    x: p.x,
    y: p.y,
    vx: Math.cos(angle) * 280,
    vy: Math.sin(angle) * 280,
    r: maelstrom ? 18 : 15,
    damage: 25 + level * 11 + (maelstrom ? 14 + state.weapons.rope.level * 3 + cometLevel * 8 : 0),
    radius: 102 + level * 12 + (maelstrom ? 38 + cometLevel * 24 : 0),
    life: maelstrom ? 1.35 + cometLevel * 0.08 : 1.15,
    target,
    spin: 0,
    maelstrom,
    cometLevel,
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
  const moonNet = compassRopeReady();
  const krakenLevel = moonNet ? fusionAmplifierFor("moonNet") : 0;
  const radius = 86 + level * 14 + krakenLevel * 14;
  let beams = 0;
  if (moonNet) recordFusionMoment("moonNet", "Fusion: Mondnetz", "#9f6cff");
  for (const enemy of state.enemies) {
    const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
    if (dist > radius - 16 && dist < radius + 28) {
      hurtEnemy(enemy, 12 + level * 6 + krakenLevel * 3, (enemy.x - p.x) / dist, (enemy.y - p.y) / dist);
    } else if (moonNet && dist < radius + 42) {
      hurtEnemy(enemy, 5 + state.weapons.compass.level * 2 + krakenLevel * 2, (enemy.x - p.x) / Math.max(1, dist), (enemy.y - p.y) / Math.max(1, dist));
      if (beams < 3 + krakenLevel) {
        beams += 1;
        state.zones.push({ type: "beam", x: p.x, y: p.y, tx: enemy.x, ty: enemy.y, life: 0.12, maxLife: 0.12 });
      }
    }
  }
}

function updateSpawns(dt) {
  state.spawnTimer -= dt;
  state.bossTimer -= dt;
  state.pressureTimer -= dt;
  const intensity = quickMode ? BALANCE.quickSpawnIntensity : BALANCE.normalSpawnIntensity;
  const interval = Math.max(0.14, (0.72 - state.elapsed * 0.00155) / intensity);
  if (state.spawnTimer <= 0) {
    state.spawnTimer = interval;
    const count = 1 + Math.floor(state.elapsed / 66) + (Math.random() < 0.34 ? 1 : 0);
    for (let i = 0; i < count; i += 1) spawnEnemy(pickEnemyType());
  }
  if (state.elapsed > BALANCE.pressureWaveFirstAt && state.pressureTimer <= 0) {
    triggerPressureWave();
    state.pressureTimer = Math.max(18, BALANCE.pressureWaveInterval - state.elapsed * 0.035);
  }
  if (state.elapsed > BALANCE.firstBossAt && state.bossTimer <= 0) {
    state.bossTimer = BALANCE.bossInterval;
    const bossType = enemyType(activeBossCycle[state.bossCount % activeBossCycle.length]);
    state.bossCount += 1;
    spawnEnemy(bossType, true);
    state.warningTimer = 3.2;
    const warning = bossType.id === "coralBrute"
        ? "Korallenbrecher voraus. Lass dich nicht festnageln!"
        : bossType.id === "threeHeadedMonkey"
          ? "Dreikoepfiger Affe voraus. Nicht alle Koepfe anstarren!"
          : bossType.id === "tideTentacle"
            ? "Zeit-Tentakel voraus. Seine Fluchkugeln kommen im Takt!"
          : bossType.id === "gargoyle"
            ? "Mond-Gargoyle voraus. Halt Abstand zu den Fluegeln!"
            : bossType.id === "cactusStack"
              ? "Kaktus-Stack voraus. Nicht in die Stachelgasse!"
              : "Affenidol voraus. Bleib in Bewegung!";
    playSkinSound("warning", "downloadBossWarning", { force: true });
    speak(warning, { key: `boss-warning-${bossType.id}`, interrupt: true, cooldown: 45000, rate: 1.06 });
  }
}

function enemyType(id) {
  return enemyTypes.find((type) => type.id === id) || enemyTypes.find((type) => !type.humanNpc) || enemyTypes[0];
}

function pickEnemyType() {
  return enemyType(pickEnemyRotationId());
}

function enemyRotationPool() {
  const t = state.elapsed;
  const variant = mapVariant(state.map);
  const ids = ["crab", "cryptBat", "powderImp", "reefSquid"];
  if (t > 14) ids.push("hand");
  if (t > 26) ids.push("tideTentacle");
  if (t > 44) ids.push("boneCorsair", "lanternWraith");
  if (t > 72) ids.push("barrelMaw");
  if (t > 96) ids.push("cactusStack");
  if (t > 156) ids.push("gargoyle");
  if (t > 214) ids.push("coralBrute");
  if (variant.detail === "lagoon") ids.push("hand", "reefSquid", "tideTentacle");
  if (variant.detail === "treasure") ids.push("powderImp", "cactusStack", "barrelMaw");
  ids.push(...(variant.enemyFavor || []));
  return [...new Set(ids)].filter((id) => !enemyType(id).humanNpc);
}

function pickEnemyRotationId() {
  const pool = enemyRotationPool();
  if (!state.enemyRotation) state.enemyRotation = { cursor: 0, recent: [] };
  const recent = state.enemyRotation.recent || [];
  const avoidCount = Math.min(3, Math.max(1, Math.floor(pool.length / 2)));
  let candidates = pool.filter((id) => !recent.slice(-avoidCount).includes(id));
  if (!candidates.length) candidates = pool;
  const jitter = Math.floor(Math.random() * Math.min(3, candidates.length));
  const id = candidates[(state.enemyRotation.cursor + jitter) % candidates.length] || pool[0] || "crab";
  state.enemyRotation.cursor = (state.enemyRotation.cursor + 1) % Math.max(1, pool.length);
  state.enemyRotation.recent = [...recent, id].slice(-6);
  return id;
}

function pressureWavePool() {
  const t = state.elapsed;
  const variant = mapVariant(state.map);
  const ids = ["crab", "cryptBat"];
  if (t > 35) ids.push("hand", "powderImp");
  if (t > 70) ids.push("reefSquid", "tideTentacle");
  if (t > 120) ids.push("boneCorsair", "lanternWraith");
  if (t > 175) ids.push("cactusStack", "barrelMaw");
  if (t > 235) ids.push("gargoyle", "coralBrute");
  ids.push(...(variant.enemyFavor || []));
  return [...new Set(ids)].filter((id) => !enemyType(id).humanNpc);
}

function triggerPressureWave() {
  state.pressureWave += 1;
  state.runStats.pressureWaves += 1;
  const pool = pressureWavePool();
  const cap = isMobileLike() ? ENEMY_TUNING.pressureWaveMobileCap : ENEMY_TUNING.pressureWaveDesktopCap;
  const count = Math.min(cap, 5 + Math.floor(state.elapsed / 52) + (state.pressureWave % 3));
  const eliteTargets = [];
  for (let i = 0; i < count; i += 1) {
    const spawned = spawnEnemy(enemyType(pool[i % pool.length]));
    if (spawned) eliteTargets.push(spawned);
  }
  const eliteCount = state.pressureWave >= ENEMY_TUNING.secondEliteFromWave ? 2 : 1;
  for (const elite of eliteTargets.slice(0, eliteCount)) {
    markEliteEnemy(elite, state.pressureWave);
  }
  state.warningTimer = Math.max(state.warningTimer, 1.6);
  floatingText(`Flutwelle ${state.pressureWave}`, state.player.x, state.player.y - 120, "#fff2c7", 0.9, 32, { priority: 3 });
  playSkinSound("warning", "downloadBossWarning", { cooldown: 14000 });
  speak(`Flutwelle ${state.pressureWave}. Keine Ruhe am Strand!`, { key: `pressure-wave-${state.pressureWave}`, cooldown: 6000, rate: 1.08 });
}

function markEliteEnemy(enemy, wave) {
  enemy.elite = true;
  enemy.eliteWave = wave;
  enemy.hp *= 1.75;
  enemy.maxHp *= 1.75;
  enemy.damage = Math.ceil(enemy.damage * 1.2);
  enemy.speed *= 1.06;
  enemy.r *= 1.08;
  floatingText("Omen-Beute", enemy.x, enemy.y - enemy.r - 58, "#ffdf6e", 0.9, 28, { priority: 3 });
}

function spawnEnemy(type, boss = false) {
  if (!boss && type?.humanNpc) type = enemyType("crab");
  if (state.enemies.length > enemyCap() && !boss) return;
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
    r: type.radius * ENEMY_TUNING.hitboxScale * (boss ? 1.25 : 1),
    speed: type.speed * (1 + state.elapsed / BALANCE.enemySpeedGrowth),
    damage: type.damage,
    row: type.row,
    frameOffset: Math.floor(Math.random() * 16),
    hit: 0,
    boss,
    shootTimer: 0.8 + Math.random() * 1.2,
    actionPulse: 0,
    actionKind: null,
  };
  if (!actorIgnoresObstacles(enemy)) resolveObstacleCollisions(enemy, enemy.r);
  state.enemies.push(enemy);
  return enemy;
}

function enemyCap() {
  return isMobileLike() ? MOBILE_PERF.enemyCap : PERF_GUARDS.desktopEnemyCap;
}

function enemyRenderBudget() {
  return isMobileLike() ? PERF_GUARDS.mobileEnemyRenderBudget : PERF_GUARDS.desktopEnemyRenderBudget;
}

function projectileCap() {
  return isMobileLike() ? MOBILE_PERF.projectileCap : PERF_GUARDS.desktopProjectileCap;
}

function particleCap() {
  return isMobileLike() ? MOBILE_PERF.particleCap : PERF_GUARDS.desktopParticleCap;
}

function textCap() {
  return isMobileLike() ? MOBILE_PERF.textCap : PERF_GUARDS.desktopTextCap;
}

function renderFrameMsCap() {
  return isMobileLike() ? MOBILE_PERF.renderFrameMs : PERF_GUARDS.desktopRenderFrameMs;
}

function updateFrameMsCap() {
  return isMobileLike() ? MOBILE_PERF.updateFrameMs : PERF_GUARDS.desktopUpdateFrameMs;
}

function lowFxMode() {
  return isMobileLike() || enemyRenderBudget() <= 80;
}

function ensurePerfState() {
  if (!state.perf) {
    state.perf = {
      trimmedEnemies: 0,
      visibleEnemies: 0,
      drawnEnemies: 0,
      skippedEnemySprites: 0,
    };
  }
  return state.perf;
}

function trimEnemyPopulation() {
  const hardCap = enemyCap() + PERF_GUARDS.trimBuffer;
  if (!state.enemies || state.enemies.length <= hardCap) return;
  const p = state.player;
  const prioritized = state.enemies.map((enemy) => ({
    enemy,
    keep: enemy.boss || enemy.elite,
    dist: Math.hypot(enemy.x - p.x, enemy.y - p.y),
  }));
  const protectedEnemies = prioritized.filter((entry) => entry.keep).map((entry) => entry.enemy);
  const regularBudget = Math.max(24, hardCap - protectedEnemies.length);
  const regularEnemies = prioritized
    .filter((entry) => !entry.keep)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, regularBudget)
    .map((entry) => entry.enemy);
  const nextEnemies = [...protectedEnemies, ...regularEnemies];
  ensurePerfState().trimmedEnemies += Math.max(0, state.enemies.length - nextEnemies.length);
  state.enemies = nextEnemies;
}

function updateEnemies(dt) {
  const p = state.player;
  for (const enemy of state.enemies) {
    enemy.hit = Math.max(0, enemy.hit - dt);
    enemy.actionPulse = Math.max(0, (enemy.actionPulse || 0) - dt);
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
      playSkinSound("hurt", "downloadHit");
      if (p.hp <= 0) endGame(false);
    }
  }
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  trimEnemyPopulation();
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
  const count = profile.count || 1;
  const spread = profile.spread || 0;
  enemy.actionPulse = 0.55;
  enemy.actionKind = profile.fx;
  for (let i = 0; i < count; i += 1) {
    const shotAngle = angle + (i - (count - 1) / 2) * spread;
    state.projectiles.push({
      type: "curseOrb",
      fx: profile.fx,
      x: enemy.x + Math.cos(shotAngle) * enemy.r,
      y: enemy.y + Math.sin(shotAngle) * enemy.r,
      vx: Math.cos(shotAngle) * speed,
      vy: Math.sin(shotAngle) * speed,
      r: profile.radius,
      damage: profile.damage,
      life: profile.life,
      spin: Math.random() * Math.PI * 2,
    });
  }
}

function enemyProjectileProfile(enemy) {
  if (enemy.boss && enemy.type.id === "spectralCaptain") {
    return { fx: "ghostCannonball", range: 760, cooldown: 2.1, speed: 248, radius: 18, damage: 13, life: 4.2 };
  }
  if (enemy.boss && enemy.type.id === "idol") {
    return { fx: "monkeyCurseOrb", range: 820, cooldown: 1.9, speed: 226, radius: 20, damage: 15, life: 4.4 };
  }
  if (enemy.boss && enemy.type.id === "threeHeadedMonkey") {
    return { fx: "monkeyCurseOrb", range: 840, cooldown: 2.25, speed: 236, radius: 18, damage: 13, life: 4.2, count: 3, spread: 0.22 };
  }
  if (enemy.boss && enemy.type.id === "blackbeard") {
    return { fx: "ghostCannonball", range: 880, cooldown: 2.4, speed: 254, radius: 19, damage: 14, life: 4.5, count: 3, spread: 0.18 };
  }
  if (enemy.type.id === "oracle") {
    return { fx: "compassBolt", range: 650, cooldown: 2.35, speed: 258, radius: 14, damage: 9, life: 3.6 };
  }
  if (enemy.type.id === "gargoyle") {
    return { fx: "ghostCannonball", range: 690, cooldown: 2.65, speed: 222, radius: 16, damage: 12, life: 4.0 };
  }
  if (enemy.type.id === "tideTentacle") {
    return {
      fx: "monkeyCurseOrb",
      range: enemy.boss ? 780 : 620,
      cooldown: enemy.boss ? 2.05 : 2.5,
      speed: enemy.boss ? 228 : 214,
      radius: enemy.boss ? 18 : 15,
      damage: enemy.boss ? 13 : 10,
      life: enemy.boss ? 4.2 : 3.7,
      count: enemy.boss ? 3 : 1,
      spread: enemy.boss ? 0.2 : 0,
    };
  }
  if (enemy.type.id === "reefSquid") {
    return { fx: "compassBolt", range: 560, cooldown: 2.2, speed: 248, radius: 13, damage: 8, life: 3.1 };
  }
  return null;
}

function spawnSonicBoomBurst(projectile) {
  const stage = clamp(projectile.sonicStage || 0, 0, SONIC_BOOM_FX.rows - 1);
  state.zones.push({
    type: "sonicBoomBurst",
    x: projectile.x,
    y: projectile.y,
    angle: Math.atan2(projectile.vy || 0, projectile.vx || 1),
    radius: (projectile.r || 24) * (1.8 + stage * 0.18),
    life: 0.2,
    maxLife: 0.2,
    stage,
    frameSeed: projectile.animSeed || 0,
  });
}

function spawnRyuHadokenBurst(projectile) {
  const stage = clamp(projectile.hadokenStage || 0, 0, RYU_HADOKEN_FX.rows - 1);
  state.zones.push({
    type: "ryuHadokenBurst",
    x: projectile.x,
    y: projectile.y,
    angle: Math.atan2(projectile.vy || 0, projectile.vx || 1),
    radius: (projectile.r || 24) * (1.85 + stage * 0.2),
    life: 0.22,
    maxLife: 0.22,
    stage,
    frameSeed: projectile.animSeed || 0,
  });
}

function spawnChunLiProjectileBurst(projectile) {
  state.zones.push({
    type: "chunLiProjectileBurst",
    fx: projectile.fx || "kiKouKen",
    x: projectile.x,
    y: projectile.y,
    angle: Math.atan2(projectile.vy || 0, projectile.vx || 1),
    radius: (projectile.r || 24) * 1.95,
    life: 0.22,
    maxLife: 0.22,
    frameSeed: projectile.animSeed || 0,
  });
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    projectile.life -= dt;
    projectile.spin += dt * 8;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    if (projectile.type === "coconut" || projectile.type === "signature") {
      for (const enemy of state.enemies) {
        if (enemy.hp <= 0 || enemy._hitBy === projectile) continue;
        const dist = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
        if (dist < enemy.r + projectile.r) {
          hurtEnemy(enemy, projectile.damage * state.stats.damage * (projectile.signatureDamage || 1), projectile.vx, projectile.vy);
          if (projectile.signatureId === "sonicBoom") spawnSonicBoomBurst(projectile);
          if (projectile.signatureId === "hadoken") spawnRyuHadokenBurst(projectile);
          if (projectile.signatureId === "kiKouKen") spawnChunLiProjectileBurst(projectile);
          if (projectile.compassFuse) arcCompassCoconut(projectile, enemy, state.weapons.compass.level);
          enemy._hitBy = projectile;
          projectile.pierce -= 1;
          const target = projectile.retarget === false ? null : nearestEnemy(enemy);
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
          detonateBottle(projectile);
          break;
        }
      }
      if (projectile.life <= 0) detonateBottle(projectile);
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
          playSkinSound("hurt", "downloadHit");
          if (p.hp <= 0) endGame(false);
        }
      }
    }
  }
  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);
  const maxProjectiles = projectileCap();
  if (state.projectiles.length > maxProjectiles) {
    state.projectiles.splice(0, state.projectiles.length - maxProjectiles);
  }
}

function arcCompassCoconut(projectile, sourceEnemy, compassLevel) {
  const target = nearestEnemyFrom(sourceEnemy.x, sourceEnemy.y, sourceEnemy);
  if (!target) return;
  const dx = target.x - sourceEnemy.x;
  const dy = target.y - sourceEnemy.y;
  const dist = Math.hypot(dx, dy);
  const damage = (16 + compassLevel * 5 + (state.stats.chainDamage || 0) * 20) * state.stats.damage;
  hurtEnemy(target, damage, dx / Math.max(1, dist), dy / Math.max(1, dist));
  state.zones.push({ type: "beam", x: projectile.x, y: projectile.y, tx: target.x, ty: target.y, life: 0.18, maxLife: 0.18 });
}

function detonateBottle(projectile) {
  if (projectile.exploded) return;
  projectile.exploded = true;
  explode(projectile.x, projectile.y, projectile.radius, projectile.damage, { maelstrom: projectile.maelstrom, cometLevel: projectile.cometLevel || 0 });
  projectile.life = 0;
}

function explode(x, y, radius, damage, options = {}) {
  state.zones.push({ type: "explosion", x, y, radius, life: 0.28, maxLife: 0.28 });
  if (options.maelstrom) {
    state.zones.push({ type: "saberTornado", x, y, angle: state.elapsed, radius: radius * (0.76 + options.cometLevel * 0.04), level: 4, auraLevel: 3, life: 0.52 + options.cometLevel * 0.08, maxLife: 0.52 + options.cometLevel * 0.08, fused: true });
    if (options.cometLevel > 0) {
      state.zones.push({ type: "fusionRelic", icon: "rumCometLantern", x, y: y - 20, life: 0.58, maxLife: 0.58, level: options.cometLevel });
    }
  }
  playSound("cannonFire", { cooldown: 320 });
  for (const enemy of state.enemies) {
    const dx = enemy.x - x;
    const dy = enemy.y - y;
    const dist = Math.hypot(dx, dy);
    if (dist < radius + enemy.r) {
      hurtEnemy(enemy, damage * (1 - Math.min(0.65, dist / radius * 0.45)), dx / Math.max(1, dist), dy / Math.max(1, dist));
    } else if (options.maelstrom && dist < radius * 1.28 + enemy.r) {
      const pull = 18;
      enemy.x += (x - enemy.x) / Math.max(1, dist) * pull;
      enemy.y += (y - enemy.y) / Math.max(1, dist) * pull;
      hurtEnemy(enemy, damage * 0.32, dx / Math.max(1, dist), dy / Math.max(1, dist));
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
    state.gems.push({
      kind: "xp",
      icon: "skullCoin",
      xpTier: xpValue >= 46 ? "red" : "blue",
      x: prop.x,
      y: prop.y - 18,
      r: 12,
      value: xpValue,
      life: 34,
    });
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
    renderMetaSkills();
    playSkinSound("powerup", "downloadUpgrade", { force: true });
    playSound(isChest ? "treasureClink" : isShrine ? "voodooMagic" : "mapRustle", { force: true });
  }
}

function updateTidePuddles(dt) {
  state.tidePuddleCooldown = Math.max(0, (state.tidePuddleCooldown || 0) - dt);
  if (state.tidePuddleCooldown > 0) return;
  const p = state.player;
  for (const prop of state.props) {
    if (!prop.puddle || prop.used) continue;
    const dist = Math.hypot(prop.x - p.x, prop.y - p.y);
    if (dist > 92) continue;
    prop.used = true;
    state.tidePuddleCooldown = 2.2;
    p.dash = Math.max(p.dash, 0.12);
    p.invuln = Math.max(p.invuln, 0.16);
    state.xp += prop.icon === "tidePuddle" ? 3 : 2;
    floatingText(prop.icon === "tidePuddle" ? "Gezeiten-Slip" : "Spritzspur", p.x, p.y - 78, "#bfffea", 0.55, 14);
    state.zones.push({ type: "tideRipple", x: prop.x, y: prop.y, radius: 72, life: 0.24, maxLife: 0.24 });
    playSkinSound("pickup", "downloadPickup", { cooldown: 900 });
    break;
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
  const duration = type.duration * (state.stats.powerupDuration || 1);
  const existing = state.powerups.find((powerup) => powerup.id === type.id);
  if (existing) existing.timer = Math.max(existing.timer, duration);
  else state.powerups.push({ id: type.id, timer: duration, duration });
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
    playSound("healSparkle", { cooldown: 520 });
    return;
  } else if (gem.kind === "powerup") {
    activatePowerup(gem.powerup);
    playSkinSound("powerup", "pickup", { cooldown: 800 });
    return;
  } else if (gem.kind === "coin") {
    state.coins += gem.value;
    metaProgress.coins += gem.value;
    renderMetaProgress();
    renderMetaSkills();
    floatingText(`+${gem.value}`, gem.x, gem.y - 18, "#f0c45d");
    playSound("doubloonPing", { cooldown: 220 });
    return;
  } else {
    const streakBonus = state.streak?.count >= 10 ? 1.16 : state.streak?.count >= 5 ? 1.08 : 1;
    state.xp += Math.ceil(gem.value * state.stats.pickupValue * streakBonus);
    while (state.xp >= state.nextXp && state.phase === "playing") {
      state.xp -= state.nextXp;
      levelUp();
    }
    if (Math.random() < 0.18) playSkinSound("pickup", "downloadPickup");
  }
  playSkinSound("pickup", "pickup");
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
    const rise = text.rise || (isMobileLike() ? 54 : 42);
    text.y -= dt * rise / Math.max(0.34, scene.zoom || 1);
  }
  state.zones = state.zones.filter((zone) => zone.life > 0);
  state.particles = state.particles.filter((particle) => particle.life > 0);
  state.texts = state.texts.filter((text) => text.life > 0);
  const maxParticles = particleCap();
  const maxTexts = textCap();
  if (state.particles.length > maxParticles) state.particles.splice(0, state.particles.length - maxParticles);
  if (state.texts.length > maxTexts) state.texts.splice(0, state.texts.length - maxTexts);
}

function hurtEnemy(enemy, amount, nx = 0, ny = 0) {
  if (enemy.hp <= 0) return;
  amount *= activePowerMultiplier("damage");
  enemy.hp -= amount;
  enemy.hit = 0.14;
  enemy.x += clamp(nx, -1, 1) * 7;
  enemy.y += clamp(ny, -1, 1) * 7;
  if (!actorIgnoresObstacles(enemy)) resolveObstacleCollisions(enemy, enemy.r);
  if ((enemy.boss || enemy.elite || amount >= 42) && Math.random() < 0.45) playSkinSound("hit", "downloadHit");
  const crit = amount >= 48 || enemy.boss || enemy.elite;
  const textChance = isMobileLike() ? (crit ? 0.28 : 0.06) : (crit ? 0.44 : 0.12);
  if (Math.random() < textChance) {
    floatingText(
      `${crit ? "CRIT " : ""}${Math.round(amount)}`,
      enemy.x,
      enemy.y - enemy.r - 20,
      crit ? "#fff2c7" : enemy.type.tint,
      crit ? 0.78 : 0.62,
      crit ? 34 : 26,
      { priority: crit ? 3 : 1 },
    );
  }
  const particleCount = isMobileLike() ? 1 : 2;
  for (let i = 0; i < particleCount; i += 1) {
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
  const trait = state.characterTrait || characterTrait(state.player.skin);
  if (trait.killHealEvery && state.killCount % trait.killHealEvery === 0) {
    const before = state.player.hp;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + (trait.killHeal || 3));
    if (state.player.hp > before) floatingText("+Biss", state.player.x, state.player.y - 82, "#d07cff", 0.58, 18, { priority: 2 });
  }
  recordStreakKill(enemy);
  const xp = Math.ceil(enemy.type.xp * (enemy.boss ? 3.8 : 1) * (1 + state.elapsed / 760));
  state.gems.push({
    kind: "xp",
    icon: "skullCoin",
    xpTier: enemy.boss || enemy.elite || xp >= 36 ? "red" : xp <= 12 ? "green" : "blue",
    x: enemy.x,
    y: enemy.y,
    r: 12,
    value: xp,
    life: 34,
  });
  if (Math.random() < 0.1 || enemy.boss) state.gems.push({ kind: "coin", icon: "coin", x: enemy.x + 12, y: enemy.y + 8, r: 12, value: enemy.boss ? 25 : 3, life: 36 });
  if (Math.random() < 0.06) state.gems.push({ kind: "heart", icon: "lime", x: enemy.x - 10, y: enemy.y, r: 13, value: 1, life: 28 });
  const streakPowerDrop = state.streak.count > 0 && state.streak.count % powerupDropTuning.streakDropEvery === 0;
  if (enemy.boss) {
    spawnPowerup(enemy.x - 18, enemy.y + 16, null, { life: 26, cooldown: 18 });
  } else if (enemy.elite) {
    state.runStats.elites += 1;
    state.gems.push({ kind: "coin", icon: "coin", x: enemy.x + 18, y: enemy.y + 12, r: 12, value: 14 + state.pressureWave * 2, life: 36 });
    grantOmenShard(enemy);
    spawnPowerup(enemy.x - 22, enemy.y + 18, null, { life: 20, cooldown: 16 });
    floatingText("Omen gebrochen", enemy.x, enemy.y - enemy.r - 58, "#ffdf6e", 0.86, 28, { priority: 3 });
    playSkinSound("powerup", "upgradeMagic", { force: true });
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
        : enemy.type.id === "threeHeadedMonkey"
          ? "Dreikopf-Affe vertrieben"
          : enemy.type.id === "blackbeard"
            ? "Blackbeard entwaffnet"
            : "Idol gebrochen";
    const downVoice = enemy.type.id === "spectralCaptain"
      ? "Fluchkapitaen verbannt. Sammel die Beute!"
      : enemy.type.id === "coralBrute"
        ? "Korallenbrecher versenkt. Sammel die Beute!"
        : enemy.type.id === "threeHeadedMonkey"
          ? "Dreikoepfiger Affe vertrieben. Sammel die Beute!"
          : enemy.type.id === "blackbeard"
            ? "Blackbeard entwaffnet. Sammel die Beute!"
            : "Idol gebrochen. Sammel die Beute!";
    floatingText(downText, enemy.x, enemy.y - 80, "#fff2c7");
    speak(downVoice, { key: `boss-down-${enemy.type.id}`, interrupt: true, cooldown: 2000 });
    playSkinSound("powerup", "chime", { force: true });
    playSkinSound("bossDown", "downloadBossDown", { force: true });
  } else if (Math.random() < 0.08) {
    playSkinSound("pickup", "pickup", { cooldown: 650 });
  }
  unlockAchievements();
  saveMetaProgress();
}

function ensureOmenShards() {
  if (!state.omenShards) state.omenShards = { count: 0, nextReward: 3, boons: 0 };
  state.omenShards.count = Math.max(0, state.omenShards.count || 0);
  state.omenShards.nextReward = Math.max(3, state.omenShards.nextReward || 3);
  state.omenShards.boons = Math.max(0, state.omenShards.boons || 0);
  return state.omenShards;
}

function grantOmenShard(enemy) {
  const omen = ensureOmenShards();
  omen.count += 1;
  const shardValue = 10 + Math.min(24, state.pressureWave * 3);
  state.gems.push({
    kind: "xp",
    icon: "skullCoin",
    xpTier: omen.count >= omen.nextReward ? "red" : "green",
    x: enemy.x - 18,
    y: enemy.y - 18,
    r: 12,
    value: shardValue,
    life: 36,
  });
  if (omen.count < omen.nextReward) {
    floatingText(`Omen ${omen.count}/${omen.nextReward}`, enemy.x, enemy.y - enemy.r - 88, "#ffdf6e", 0.68, 20, { priority: 2 });
    return false;
  }

  omen.boons += 1;
  omen.nextReward += 3;
  state.runStats.omenBoons = (state.runStats.omenBoons || 0) + 1;
  state.runStats.flowRewards += 1;
  metaProgress.flowRewards += 1;
  const rewards = [
    { name: "Jagdtempo", color: "#53ffe5", apply: () => { state.stats.speed += 9; } },
    { name: "Omen-Schaden", color: "#ffb14c", apply: () => { state.stats.damage += 0.045; } },
    { name: "Beute-Sog", color: "#bfffea", apply: () => { state.stats.magnet += 32; } },
    { name: "Taktwechsel", color: "#fff2c7", apply: () => { state.stats.cooldown = Math.max(0.78, (state.stats.cooldown || 1) - 0.025); } },
  ];
  const reward = rewards[(omen.boons - 1) % rewards.length];
  reward.apply();
  spawnPowerup(enemy.x - 34, enemy.y + 22, "omenBounty", { life: 24, cooldown: 12 });
  state.zones.push({ type: "omenBoon", icon: "bloodRose", x: enemy.x, y: enemy.y - 34, life: 0.82, maxLife: 0.82, level: omen.boons });
  floatingText(`Omen-Boon: ${reward.name}`, enemy.x, enemy.y - enemy.r - 96, reward.color, 0.86, 24, { priority: 3 });
  return true;
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
    playSkinSound("pickup", "downloadPickup", { cooldown: 650 });
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
  let x = p.x;
  let y = p.y;
  const baseDistance = offscreenRewardDistance();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = baseDistance + Math.random() * 420;
    x = clamp(p.x + Math.cos(angle) * distance, 180, WORLD.w - 180);
    y = clamp(p.y + Math.sin(angle) * distance, 180, WORLD.h - 180);
    if (!isInSpawnSightline(x, y, state, 120)) break;
  }
  addPropToTarget(state, {
    x,
    y,
    icon: "buriedTreasure",
    scale: 0.72 + Math.min(0.16, count * 0.002),
    spin: Math.random(),
    interactive: true,
    streakCache: true,
    createdAt: state.elapsed,
    fadeIn: 1,
  });
  streak.caches += 1;
  floatingText("Streak-Schatz am Horizont", p.x, p.y - 106, "#fff2c7", 0.82, 14);
  playSound("treasureMapMagic", { cooldown: 900 });
  speak("Streak-Schatz am Horizont gesichtet.", { key: "streak-cache", cooldown: 9000, rate: 1.06 });
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
      playSkinSound("powerup", "downloadUpgrade", { force: true });
    }
  }
  if (changed) {
    metaProgress = normalizeMetaProgress(metaProgress);
    saveMetaProgress();
    renderMapPicker();
    renderMetaProgress();
    renderMetaSkills();
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
  renderMetaSkills();
}

function levelUp(options = {}) {
  state.level += 1;
  metaProgress.bestLevel = Math.max(metaProgress.bestLevel, state.level);
  state.nextXp = nextLevelXp(state.level);
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + 16);
  if (!options.forceChoice && !shouldShowUpgradeChoice(state.level)) {
    applyFlowLevelReward();
    return;
  }
  state.phase = "levelup";
  playSkinSound("powerup", "chime", { force: true });
  playSkinSound("powerup", "downloadUpgrade", { force: true });
  speak("Relikt gefunden. Waehle deine Verstaerkung.", { key: "level-up", interrupt: true, cooldown: 1000 });
  showUpgrades();
}

function nextLevelXp(level) {
  return Math.round(XP_TUNING.base + level * XP_TUNING.linear + level * level * XP_TUNING.quadratic);
}

function shouldShowUpgradeChoice(level) {
  return level >= XP_TUNING.firstChoiceLevel && (level - XP_TUNING.firstChoiceLevel) % XP_TUNING.choiceInterval === 0;
}

function upgradeChoiceLevels(count = 5) {
  return Array.from({ length: count }, (_, index) => XP_TUNING.firstChoiceLevel + index * XP_TUNING.choiceInterval);
}

function applyFlowLevelReward() {
  const rewards = [
    { name: "Flow: Tempo", apply: () => { state.stats.speed += 5; }, color: "#f0c45d" },
    { name: "Flow: Schaden", apply: () => { state.stats.damage += 0.018; }, color: "#ffb14c" },
    { name: "Flow: Magnet", apply: () => { state.stats.magnet += 12; }, color: "#53ffe5" },
    { name: "Flow: Atem", apply: () => { state.player.hp = Math.min(state.player.maxHp, state.player.hp + 20); }, color: "#79e0b7" },
    { name: "Flow: Funke", apply: () => { spawnPowerup(state.player.x + 60, state.player.y - 20, "fusionSpark", { life: 16, cooldown: 8 }); }, color: "#ff8aa3" },
    { name: "Flow: Dublonen", apply: () => { state.coins += 6; metaProgress.coins += 6; }, color: "#f0c45d" },
  ];
  const reward = rewards[state.level % rewards.length];
  reward.apply();
  state.runStats.flowRewards += 1;
  metaProgress.flowRewards += 1;
  floatingText(reward.name, state.player.x, state.player.y - 96, reward.color);
  unlockAchievements();
  saveMetaProgress();
  renderMetaProgress();
  playSkinSound("pickup", "downloadPickup", { cooldown: 1100 });
}

const upgradeMilestones = {
  cutlass: [
    "Saebel I: sauberer Grundhieb.",
    "Doppelschnitt: zwei Klingen zeichnen sichtbar breiter.",
    "Dreifachbogen: mehr Flanke, mehr Trefferfenster.",
    "Vierfachdruck: dichter Nahkampf-Kegel.",
    "Fuenffachsaebel: Tornado-Fusion wird greifbar.",
    "Schaerfere Wirbel, kuerzerer Takt.",
    "Maximaler Saebelsturm.",
  ],
  coconut: [
    "Ein schneller Rueckprall-Bumerang.",
    "Mehr Schaden und stabilere Flugbahn.",
    "Zusaetzlicher Pierce fuer enge Wellen.",
    "Bereit fuer Sternenkokos mit Kompass.",
    "Laengerer Flug, haertere Treffer.",
    "Fast dauernder Kokosdruck.",
    "Maximaler Strand-Ricochet.",
  ],
  compass: [
    "Ein Sternpunkt kreist knapp um dich.",
    "Groesserer Orbit, erster Beam-Druck.",
    "Mehr Punkte, bessere Abdeckung.",
    "Mondnetz-Fusion mit Tau wird moeglich.",
    "Schnellere Beams auf entfernte Ziele.",
    "Maximaler Sternenring.",
  ],
  bottle: [
    "Kleine Grog-Bombe auf den naechsten Mob.",
    "Groessere Explosion, mehr Kontrolle.",
    "Schnellerer Wurfzyklus.",
    "Grog-Mahlstrom mit Tau wird moeglich.",
    "Breiter Splash fuer Elitewellen.",
    "Maximaler Flaschensturm.",
  ],
  rope: [
    "Tau I: kleiner Randkreis, noch bewusst ruhig.",
    "Tau II: erste echte Aura-Schicht.",
    "Tau III: Fusionen und dichterer Ring.",
    "Tau IV: zweite Aura-Lage, mehr Sog.",
    "Tau V: voller Tide-Ward mit Max-Glanz.",
  ],
  stormConch: [
    "Muschel I: Kokos route bekommt Rueckenwind.",
    "Muschel II: Kompass koppelt frueher an Sternenkokos.",
    "Muschel III: mehr Pierce und Blitzketten.",
    "Muschel IV: maximaler Squall-Ricochet.",
  ],
  bloodMoonAnchor: [
    "Anker I: Tau wird schwerer und sicherer.",
    "Anker II: Saebelsturm gewinnt Radius.",
    "Anker III: Blutwirbel gibt Schutzfenster.",
    "Anker IV: maximal verankerter Tornado.",
  ],
  krakenCompass: [
    "Kraken I: Kompass zieht weiter und haerter.",
    "Kraken II: Mondnetz bekommt Zusatzstrahlen.",
    "Kraken III: Tau koppelt in den Tentakel-Sog.",
    "Kraken IV: maximales Kraken-Mondnetz.",
  ],
  rumCometLantern: [
    "Laterne I: Bombenroute bekommt Kometenfeuer.",
    "Laterne II: Grog-Mahlstrom wird breiter.",
    "Laterne III: Power-ups halten laenger.",
    "Laterne IV: maximaler Rumkometen-Einschlag.",
  ],
};

function upgradeDescription(upgrade) {
  const current = state.upgradeCounts[upgrade.id] || 0;
  if (upgrade.id === "cutlass" && isGuileSkin()) {
    return [
      "Sonic Boom I: schneller Grundschuss statt Saebelhieb.",
      "Sonic Boom II: mehr Pierce, Knee Bazooka wird als Combo frei.",
      "Sonic Boom III: dichtere Druckwellen und schnellerer Cycle.",
      "Sonic Boom IV: Reverse Punch kommt als Nahkampf-Konter dazu.",
      "Sonic Boom V: mehr Schaden, groesserer Projektilbogen.",
      "Sonic Boom VI: Flash Kick startet als AOE-Reset.",
      "Sonic Boom VII: Doppel-Boom fuer die Lane.",
    ][current] || upgrade.desc;
  }
  return upgradeMilestones[upgrade.id]?.[current] || upgrade.desc;
}

function upgradeProgressPips(current, max, className = "progress-pip") {
  return Array.from({ length: max }, (_, index) => `<span class="${className}${index < current ? " filled" : ""}"></span>`).join("");
}

function upgradeMax(id) {
  return upgrades.find((upgrade) => upgrade.id === id)?.max || 1;
}

function showUpgrades() {
  ui.upgradeChoices.innerHTML = "";
  activeUpgradeChoices = chooseUpgrades();
  selectedUpgradeIndex = 0;
  activeUpgradeChoices.forEach((upgrade, index) => {
    const view = upgradePresentation(upgrade);
    const current = state.upgradeCounts[upgrade.id] || 0;
    const next = Math.min(upgrade.max, current + 1);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "upgrade-card";
    button.dataset.upgradeIndex = String(index);
    button.innerHTML = `
      <span class="upgrade-icon" style="${iconStyle(view.icon)}"></span>
      <span class="upgrade-name">${view.name}</span>
      <span class="upgrade-tier">Stufe ${next}/${upgrade.max}</span>
      <span class="upgrade-progress">${upgradeProgressPips(next, upgrade.max)}</span>
      <span class="upgrade-desc">${upgradeDescription(view)}</span>
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
  playSkinSound("confirm", "confirm");
  speak(`${upgradePresentation(upgrade).name} bereit.`, { key: `upgrade-${upgrade.id}`, interrupt: true, cooldown: 1200, rate: 1.06 });
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
  updatePlayerLabel();
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
  const signature = state.characterTrait?.signature;
  const signatureHtml = signature ? `
    <div class="loadout-item signature">
      <span class="loadout-icon" style="${iconStyle(signature.icon || "compassBolt")}"></span>
      <span>
        <span class="loadout-name">${signature.label || "Signature"}</span>
        <span class="loadout-level">${state.signatureMove?.timer <= 0 ? "bereit" : `${Math.ceil(state.signatureMove?.timer || 0)}s`}</span>
      </span>
    </div>
  ` : "";
  const relicHtml = fusionRelicIds
    .filter((id) => fusionRelicLevel(id) > 0)
    .map((id) => {
      const relic = fusionRelicMap[id];
      const level = fusionRelicLevel(id);
      return `
        <div class="loadout-item fusion">
          <span class="loadout-icon" style="${iconStyle(id)}"></span>
          <span>
            <span class="loadout-name">${relic.name}</span>
            <span class="loadout-level">Relikt ${level}</span>
            <span class="loadout-pips">${upgradeProgressPips(level, upgradeMax(id), "loadout-pip")}</span>
          </span>
        </div>
      `;
    }).join("");
  const weaponEntries = weaponLoadoutItems.filter(([id]) => state.weapons[id].level > 0);
  const weaponHtml = weaponEntries.map(([id, name, icon]) => {
    const view = weaponPresentation(id);
    return `
    <div class="loadout-item">
      <span class="loadout-icon" style="${iconStyle(view.icon || icon)}"></span>
      <span>
        <span class="loadout-name">${view.name || name}</span>
        <span class="loadout-level">Lv ${state.weapons[id].level}</span>
        <span class="loadout-pips">${upgradeProgressPips(state.weapons[id].level, upgradeMax(id), "loadout-pip")}</span>
      </span>
    </div>
  `;
  }).join("");
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
  ui.loadout.innerHTML = signatureHtml + relicHtml + weaponHtml + powerHtml;
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
    if (!lowFxMode()) drawVignette();
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
  drawWorldMap(mapBackgroundImage(variant), ox, oy);
  drawMapTint(variant);
  drawNaturalGroundDetails(ox, oy, variant);
}

function mapBackgroundImage(variant = mapVariant(state.map)) {
  return images[variant.background] || images.repeatBeach;
}

function drawWorldMap(image, ox, oy) {
  const tile = WORLD.bgTile;
  const drawSize = tile + WORLD_BG_SEAM_BLEED * 2;
  const sourceInset = Math.min(WORLD_BG_SOURCE_INSET, Math.floor(Math.min(image.width, image.height) * 0.08));
  const sourceW = image.width - sourceInset * 2;
  const sourceH = image.height - sourceInset * 2;
  const cam = state.camera;
  const minX = Math.floor((cam.x - scene.w / 2) / tile) - 1;
  const maxX = Math.ceil((cam.x + scene.w / 2) / tile) + 1;
  const minY = Math.floor((cam.y - scene.h / 2) / tile) - 1;
  const maxY = Math.ceil((cam.y + scene.h / 2) / tile) + 1;
  for (let gx = minX; gx <= maxX; gx += 1) {
    for (let gy = minY; gy <= maxY; gy += 1) {
      const px = ox + gx * tile;
      const py = oy + gy * tile;
      ctx.save();
      ctx.translate(px + tile / 2, py + tile / 2);
      ctx.drawImage(
        image,
        sourceInset,
        sourceInset,
        sourceW,
        sourceH,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize,
      );
      ctx.restore();
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
  const mobile = isMobileLike();
  const tile = mobile ? 520 : 260;
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
      if (h % (lagoon ? 5 : treasure ? 7 : 9) === 0) {
        const icon = gothic && h % 23 === 0 ? "bloodRose" : lagoon ? "tidePuddle" : "clearPuddle";
        const px = ox + x + 30 + ((h >> 6) % 160);
        const py = oy + y + 30 + ((h >> 13) % 150);
        const w = gothic && icon === "bloodRose" ? 50 : 148 + (h % 56);
        const ph = gothic && icon === "bloodRose" ? 50 : 106 + ((h >> 4) % 36);
        drawItem(icon, px, py, w, ph, ((h >> 18) % 628) / 100, icon === "tidePuddle" ? 0.68 : 0.58);
      }
    }
  }
  ctx.restore();
}

function drawProps() {
  const ox = scene.w / 2 - state.camera.x;
  const oy = scene.h / 2 - state.camera.y;
  const mobile = isMobileLike();
  for (const prop of state.props) {
    if (!onScreen(prop.x, prop.y, 320)) continue;
    const size = getPropDisplaySize(prop.icon, prop.scale);
    const spawnProgress = propSpawnProgress(prop);
    const alpha = propRenderAlpha(prop) * spawnProgress;
    if (alpha <= 0.02) continue;
    drawItem(prop.icon, ox + prop.x, oy + prop.y, size.w, size.h, prop.spin * 0.18 - 0.08, alpha);
    if (!mobile && prop.interactive && !prop.discovered && spawnProgress > 0.45) {
      const glint = Math.min(124, Math.max(76, size.w * 0.32));
      drawPlayerEffect("treasureGlint", ox + prop.x, oy + prop.y - size.h * 0.24, glint, glint, state.elapsed * 0.6 + prop.spin, 0.28 * spawnProgress);
    }
  }
}

function propRenderAlpha(prop) {
  const isDecal = beachPropMap[prop.icon]?.decal === true;
  if (isDecal) return prop.used ? 0.48 : 0.72;
  return propBlocksMovement(prop) ? 0.88 : 0.72;
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
    const tier = gem.kind === "xp" ? xpCrystalTier(gem) : null;
    const size = gem.kind === "xp" ? xpCrystalSize(gem, tier) : gem.kind === "powerup" ? 42 : 34;
    ctx.save();
    ctx.translate(ox + gem.x, oy + gem.y + Math.sin(t + gem.x) * 4);
    ctx.rotate(Math.sin(t) * 0.1);
    if (gem.kind === "xp") {
      drawXpCrystalAt(gem, size);
      ctx.restore();
      continue;
    }
    drawItemAt(gem.icon, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

function xpCrystalTier(gem) {
  if (gem.xpTier === "green" || gem.xpTier === "red" || gem.xpTier === "blue") return gem.xpTier;
  if (gem.value >= 36) return "red";
  if (gem.value <= 12) return "green";
  return "blue";
}

function xpCrystalSize(gem, tier = xpCrystalTier(gem)) {
  if (tier === "red") return gem.value >= 60 ? 70 : 64;
  if (tier === "green") return 42;
  return gem.value >= 18 ? 54 : 48;
}

function xpCrystalImage(tier) {
  if (tier === "green") return images.xpCrystalGreenAnim || images.xpCrystalAnim;
  if (tier === "red") return images.xpCrystalRedAnim || images.xpCrystalAnim;
  return images.xpCrystalAnim;
}

function drawXpCrystalAt(gem, size) {
  const tier = xpCrystalTier(gem);
  const crystal = xpCrystalImage(tier);
  if (!crystal) {
    drawPlayerEffectAt("tidePulse", -size * 0.72, -size * 0.72, size * 1.44, size * 1.44);
    drawItemAt(gem.icon, -size / 2, -size / 2, size, size);
    return;
  }
  const offset = Math.abs(Math.floor((gem.x * 0.17 + gem.y * 0.11) % XP_CRYSTAL_ANIM.frames));
  const frame = (Math.floor(state.elapsed * XP_CRYSTAL_ANIM.fps) + offset) % XP_CRYSTAL_ANIM.frames;
  const pulse = 1 + Math.sin(state.elapsed * 7.2 + offset) * 0.045;
  const drawSize = size * 1.22 * pulse;
  const sx = frame * XP_CRYSTAL_ANIM.w;
  if (!isMobileLike()) {
    ctx.save();
    ctx.globalAlpha = 0.34 + Math.sin(state.elapsed * 5.4 + offset) * 0.08;
    drawPlayerEffectAt("tidePulse", -drawSize * 0.58, -drawSize * 0.58, drawSize * 1.16, drawSize * 1.16);
    ctx.restore();
  }
  ctx.drawImage(crystal, sx, 0, XP_CRYSTAL_ANIM.w, XP_CRYSTAL_ANIM.h, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
}

function bossAnimFrame(enemy, anim, attackFrames, loopFrames = null) {
  if (enemy.actionPulse > 0) {
    const progress = clamp(1 - enemy.actionPulse / 0.55, 0, 0.999);
    return attackFrames[Math.floor(progress * attackFrames.length)] ?? attackFrames[0];
  }
  if (Array.isArray(loopFrames) && loopFrames.length > 0) {
    return loopFrames[(Math.floor(state.elapsed * anim.fps) + enemy.frameOffset) % loopFrames.length] ?? loopFrames[0];
  }
  return (Math.floor(state.elapsed * anim.fps) + enemy.frameOffset) % anim.frames;
}

function enemyBaseDrawScale(enemy) {
  return enemy.type.scale * ENEMY_TUNING.visualScale * (enemy.elite ? 1.04 : 1);
}

function animatedEnemyDrawScale(enemy, sourceHeight = ENEMY_ANIM.h) {
  const baseScale = enemyBaseDrawScale(enemy) * ENEMY_TUNING.animatedVisualBoost * (enemy.boss ? 1.22 : 1);
  const minHeight = Math.max(
    ENEMY_TUNING.minAnimatedVisualHeight,
    enemy.r * ENEMY_TUNING.minAnimatedVisualRadiusRatio,
  ) * (enemy.boss ? 1.08 : 1);
  return Math.max(baseScale, minHeight / sourceHeight);
}

function drawEnemies() {
  const ox = scene.w / 2 - state.camera.x;
  const oy = scene.h / 2 - state.camera.y;
  const mobile = isMobileLike();
  const enemies = visibleEnemiesForRender();
  const lowFx = lowFxMode() || enemies.length > 44;
  for (const enemy of enemies) {
    const px = ox + enemy.x;
    const py = oy + enemy.y;
    const flip = enemy.x > state.player.x ? -1 : 1;
    const drawScale = enemyBaseDrawScale(enemy);
    let w = 0;
    let h = 0;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(flip, 1);
    ctx.shadowColor = enemy.hit > 0 ? enemy.type.tint : "rgba(0,0,0,0.55)";
    ctx.shadowBlur = lowFx ? 0 : enemy.hit > 0 ? 20 : 10;
    if (enemy.type.threeHeadedMonkey && images.threeHeadedMonkeyAnim) {
      const frame = bossAnimFrame(enemy, THREE_HEADED_MONKEY_ANIM, [4, 5, 6, 7]);
      const sx = (frame % THREE_HEADED_MONKEY_ANIM.cols) * THREE_HEADED_MONKEY_ANIM.w;
      const sy = Math.floor(frame / THREE_HEADED_MONKEY_ANIM.cols) * THREE_HEADED_MONKEY_ANIM.h;
      const bob = Math.sin(state.elapsed * 4.8 + enemy.frameOffset) * 4;
      w = THREE_HEADED_MONKEY_ANIM.w * drawScale * (enemy.boss ? 1.18 : 1);
      h = THREE_HEADED_MONKEY_ANIM.h * drawScale * (enemy.boss ? 1.18 : 1);
      ctx.shadowBlur = lowFx ? 0 : enemy.hit > 0 ? 30 : 18;
      ctx.drawImage(images.threeHeadedMonkeyAnim, sx, sy, THREE_HEADED_MONKEY_ANIM.w, THREE_HEADED_MONKEY_ANIM.h, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.threeHeadedMonkey && images.threeHeadedMonkey) {
      const bob = Math.sin(state.elapsed * 4.8 + enemy.frameOffset) * 4;
      w = images.threeHeadedMonkey.width * drawScale * (enemy.boss ? 1.18 : 1);
      h = images.threeHeadedMonkey.height * drawScale * (enemy.boss ? 1.18 : 1);
      ctx.shadowBlur = lowFx ? 0 : enemy.hit > 0 ? 30 : 18;
      ctx.drawImage(images.threeHeadedMonkey, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.blackbeard && images.blackbeardAnim) {
      const frame = bossAnimFrame(enemy, BLACKBEARD_ANIM, enemy.actionKind === "ghostCannonball" ? [3, 4, 6, 7] : [5, 6, 7, 0]);
      const sx = (frame % BLACKBEARD_ANIM.cols) * BLACKBEARD_ANIM.w;
      const sy = Math.floor(frame / BLACKBEARD_ANIM.cols) * BLACKBEARD_ANIM.h;
      const bob = Math.sin(state.elapsed * 4.2 + enemy.frameOffset) * 4.5;
      w = BLACKBEARD_ANIM.w * drawScale * (enemy.boss ? 1.08 : 1);
      h = BLACKBEARD_ANIM.h * drawScale * (enemy.boss ? 1.08 : 1);
      ctx.shadowBlur = lowFx ? 0 : enemy.hit > 0 ? 32 : 20;
      ctx.drawImage(images.blackbeardAnim, sx, sy, BLACKBEARD_ANIM.w, BLACKBEARD_ANIM.h, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.blackbeard && images.blackbeard) {
      const bob = Math.sin(state.elapsed * 4.2 + enemy.frameOffset) * 4.5;
      w = images.blackbeard.width * drawScale * (enemy.boss ? 1.08 : 1);
      h = images.blackbeard.height * drawScale * (enemy.boss ? 1.08 : 1);
      ctx.shadowBlur = lowFx ? 0 : enemy.hit > 0 ? 32 : 20;
      ctx.drawImage(images.blackbeard, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.captainSheet && images.spectralCaptain) {
      const frame = (Math.floor(state.elapsed * 6) + enemy.frameOffset) % SPECTRAL_CAPTAIN.cols;
      const sx = frame * SPECTRAL_CAPTAIN.w;
      const bob = Math.sin(state.elapsed * 4.5 + enemy.frameOffset) * 5;
      w = SPECTRAL_CAPTAIN.w * drawScale * (enemy.boss ? 1.05 : 1);
      h = SPECTRAL_CAPTAIN.h * drawScale * (enemy.boss ? 1.05 : 1);
      ctx.shadowBlur = lowFx ? 0 : enemy.hit > 0 ? 28 : 18;
      ctx.drawImage(images.spectralCaptain, sx, 0, SPECTRAL_CAPTAIN.w, SPECTRAL_CAPTAIN.h, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.gothicAnim && images.gothicEnemyAnimSheet) {
      const anim = gothicEnemyAnimMap[enemy.type.gothicAnim] || gothicEnemyAnimMap.boneCorsair;
      const frame = bossAnimFrame(enemy, GOTHIC_ENEMY_ANIM, anim.attackFrames, anim.loopFrames);
      const sx = (frame % GOTHIC_ENEMY_ANIM.cols) * GOTHIC_ENEMY_ANIM.w;
      const sy = anim.row * GOTHIC_ENEMY_ANIM.h;
      const bob = enemy.type.id === "gargoyle" ? Math.sin(state.elapsed * 7.4 + enemy.frameOffset) * 7 : Math.sin(state.elapsed * 4.6 + enemy.frameOffset) * 2.5;
      const animScale = animatedEnemyDrawScale(enemy, GOTHIC_ENEMY_ANIM.h) * (enemy.type.id === "gargoyle" ? 1.08 : 1);
      w = GOTHIC_ENEMY_ANIM.w * animScale * (enemy.boss ? 1.18 : 1);
      h = GOTHIC_ENEMY_ANIM.h * animScale * (enemy.boss ? 1.18 : 1);
      ctx.shadowBlur = lowFx ? 0 : enemy.hit > 0 ? 28 : 14;
      ctx.drawImage(images.gothicEnemyAnimSheet, sx, sy, GOTHIC_ENEMY_ANIM.w, GOTHIC_ENEMY_ANIM.h, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.gothicRow !== undefined) {
      const frame = (Math.floor(state.elapsed * 8) + enemy.frameOffset) % GOTHIC_ENEMY.cols;
      const sx = frame * GOTHIC_ENEMY.w;
      const sy = enemy.type.gothicRow * GOTHIC_ENEMY.h;
      const bob = enemy.type.id === "cryptBat" ? Math.sin(state.elapsed * 8 + enemy.frameOffset) * 8 : 0;
      w = GOTHIC_ENEMY.w * drawScale * (enemy.boss ? 1.18 : 1);
      h = GOTHIC_ENEMY.h * drawScale * (enemy.boss ? 1.18 : 1);
      ctx.drawImage(images.gothicEnemies, sx, sy, GOTHIC_ENEMY.w, GOTHIC_ENEMY.h, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.timeTentacle && images.timeTentacleAnim) {
      const attackFrames = enemy.actionKind === "monkeyCurseOrb" ? [7, 8, 9, 10] : [8, 9, 10, 11];
      const frame = bossAnimFrame(enemy, TIME_TENTACLE_ANIM, attackFrames);
      const sx = (frame % TIME_TENTACLE_ANIM.cols) * TIME_TENTACLE_ANIM.w;
      const sy = Math.floor(frame / TIME_TENTACLE_ANIM.cols) * TIME_TENTACLE_ANIM.h;
      const bob = Math.sin(state.elapsed * 5.8 + enemy.frameOffset) * (enemy.boss ? 5 : 3.5);
      const animScale = animatedEnemyDrawScale(enemy, TIME_TENTACLE_ANIM.h) * (enemy.boss ? 1.12 : 1);
      w = TIME_TENTACLE_ANIM.w * animScale * (enemy.boss ? 1.16 : 1);
      h = TIME_TENTACLE_ANIM.h * animScale * (enemy.boss ? 1.16 : 1);
      ctx.shadowBlur = lowFx ? 0 : enemy.hit > 0 ? 30 : enemy.boss ? 18 : 12;
      ctx.drawImage(images.timeTentacleAnim, sx, sy, TIME_TENTACLE_ANIM.w, TIME_TENTACLE_ANIM.h, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.newEnemyAnim && platformerEnemyAnimMap[enemy.type.newEnemyAnim] && images.platformerEnemies) {
      const anim = platformerEnemyAnimMap[enemy.type.newEnemyAnim];
      const frame = bossAnimFrame(enemy, PLATFORMER_ENEMY_ANIM, anim.attackFrames, anim.loopFrames);
      const sx = (frame % PLATFORMER_ENEMY_ANIM.cols) * PLATFORMER_ENEMY_ANIM.w;
      const sy = anim.row * PLATFORMER_ENEMY_ANIM.h;
      const bob = enemy.type.id === "reefSquid"
        ? Math.sin(state.elapsed * 9.2 + enemy.frameOffset) * 8
        : Math.sin(state.elapsed * 5.8 + enemy.frameOffset) * 3.8;
      const animScale = animatedEnemyDrawScale(enemy, PLATFORMER_ENEMY_ANIM.h) * (enemy.type.id === "reefSquid" ? 1.08 : 1.03);
      w = PLATFORMER_ENEMY_ANIM.w * animScale * (enemy.boss ? 1.16 : 1);
      h = PLATFORMER_ENEMY_ANIM.h * animScale * (enemy.boss ? 1.16 : 1);
      ctx.shadowBlur = lowFx ? 0 : enemy.hit > 0 ? 28 : 13;
      ctx.drawImage(images.platformerEnemies, sx, sy, PLATFORMER_ENEMY_ANIM.w, PLATFORMER_ENEMY_ANIM.h, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.newEnemyAnim && images.newEnemyTrio) {
      const anim = newEnemyAnimMap[enemy.type.newEnemyAnim] || newEnemyAnimMap.tideTentacle;
      const frame = bossAnimFrame(enemy, NEW_ENEMY_TRIO, anim.attackFrames, anim.loopFrames);
      const sx = (frame % NEW_ENEMY_TRIO.cols) * NEW_ENEMY_TRIO.w;
      const sy = anim.row * NEW_ENEMY_TRIO.h;
      const bob = enemy.type.id === "reefSquid"
        ? Math.sin(state.elapsed * 8.8 + enemy.frameOffset) * 8
        : Math.sin(state.elapsed * 5.4 + enemy.frameOffset) * 3.5;
      const animScale = animatedEnemyDrawScale(enemy, NEW_ENEMY_TRIO.h) * (enemy.type.id === "reefSquid" ? 1.05 : 1);
      w = NEW_ENEMY_TRIO.w * animScale * (enemy.boss ? 1.16 : 1);
      h = NEW_ENEMY_TRIO.h * animScale * (enemy.boss ? 1.16 : 1);
      ctx.shadowBlur = lowFx ? 0 : enemy.hit > 0 ? 26 : 12;
      ctx.drawImage(images.newEnemyTrio, sx, sy, NEW_ENEMY_TRIO.w, NEW_ENEMY_TRIO.h, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.enemyAnim && images.enemyAnimSheet) {
      const anim = enemyAnimMap[enemy.type.enemyAnim] || enemyAnimMap.crab;
      const frame = bossAnimFrame(enemy, ENEMY_ANIM, anim.attackFrames, anim.loopFrames);
      const sx = (frame % ENEMY_ANIM.cols) * ENEMY_ANIM.w;
      const sy = anim.row * ENEMY_ANIM.h;
      const bob = enemy.type.phase || enemy.type.flying
        ? Math.sin(state.elapsed * 7.2 + enemy.frameOffset) * 6
        : Math.sin(state.elapsed * 4.4 + enemy.frameOffset) * 2.5;
      const animScale = animatedEnemyDrawScale(enemy, ENEMY_ANIM.h);
      w = ENEMY_ANIM.w * animScale;
      h = ENEMY_ANIM.h * animScale;
      ctx.shadowBlur = lowFx ? 0 : enemy.hit > 0 ? 26 : 12;
      ctx.drawImage(images.enemyAnimSheet, sx, sy, ENEMY_ANIM.w, ENEMY_ANIM.h, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.extraSprite) {
      const src = extraEnemyMap[enemy.type.extraSprite] || extraEnemyMap.reefRaider;
      const bob = Math.sin(state.elapsed * (enemy.type.id === "powderImp" ? 9 : 5.5) + enemy.frameOffset) * (enemy.type.id === "lanternWraith" ? 7 : 3.5);
      w = EXTRA_ENEMY.w * drawScale * (enemy.boss ? 1.16 : 1);
      h = EXTRA_ENEMY.h * drawScale * (enemy.boss ? 1.16 : 1);
      ctx.drawImage(images.extraEnemies, src.x * EXTRA_ENEMY.w, src.y * EXTRA_ENEMY.h, EXTRA_ENEMY.w, EXTRA_ENEMY.h, -w / 2, -h + enemy.r + bob, w, h);
    } else if (enemy.type.sprite) {
      const src = newSpriteMap[enemy.type.sprite];
      const bob = Math.sin(state.elapsed * (enemy.type.id === "crab" ? 10 : 6) + enemy.frameOffset) * (enemy.type.id === "crab" ? 5 : 3);
      w = NEWSPRITE.w * drawScale * (enemy.boss ? 1.22 : 1);
      h = NEWSPRITE.h * drawScale * (enemy.boss ? 1.22 : 1);
      ctx.drawImage(images.newSprites, src.x * NEWSPRITE.w, src.y * NEWSPRITE.h, NEWSPRITE.w, NEWSPRITE.h, -w / 2, -h + enemy.r + bob, w, h);
    } else {
      const frame = (Math.floor(state.elapsed * 9) + enemy.frameOffset) % 16;
      const sx = frame * CHAR.w;
      const sy = (enemy.row || 0) * CHAR.h;
      w = CHAR.w * drawScale * (enemy.boss ? 1.15 : 1);
      h = CHAR.h * drawScale * (enemy.boss ? 1.15 : 1);
      ctx.drawImage(images.characters, sx, sy, CHAR.w, CHAR.h, -w / 2, -h + enemy.r, w, h);
    }
    ctx.restore();
    if (enemy.elite) {
      ctx.save();
      ctx.globalAlpha = mobile ? 0.34 : 0.5;
      ctx.strokeStyle = "#ffdf6e";
      ctx.lineWidth = mobile ? 3 : 4;
      ctx.shadowColor = "#ffb14c";
      ctx.shadowBlur = lowFx ? 0 : 14;
      ctx.beginPath();
      ctx.ellipse(px, py - enemy.r * 0.45, enemy.r * 1.45, enemy.r * 0.72, Math.sin(state.elapsed * 1.7) * 0.08, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    const hpPct = clamp(enemy.hp / enemy.maxHp, 0, 1);
    if ((!mobile && hpPct < 0.98) || enemy.boss || enemy.hit > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.48)";
      ctx.fillRect(px - 28, py - h - 8, 56, 5);
      ctx.fillStyle = enemy.type.tint;
      ctx.fillRect(px - 28, py - h - 8, 56 * hpPct, 5);
    }
  }
}

function visibleEnemiesForRender() {
  const visible = state.enemies.filter((enemy) => onScreen(enemy.x, enemy.y, 220));
  const budget = enemyRenderBudget();
  let selected = visible;
  if (visible.length > budget) {
    const p = state.player;
    selected = visible
      .map((enemy) => ({
        enemy,
        priority: enemy.boss ? 0 : enemy.elite ? 1 : enemy.hit > 0 ? 2 : 3,
        dist: Math.hypot(enemy.x - p.x, enemy.y - p.y),
      }))
      .sort((a, b) => a.priority - b.priority || a.dist - b.dist)
      .slice(0, budget)
      .map((entry) => entry.enemy);
  }
  const perf = ensurePerfState();
  perf.visibleEnemies = visible.length;
  perf.drawnEnemies = selected.length;
  perf.skippedEnemySprites = Math.max(0, visible.length - selected.length);
  return selected.sort((a, b) => a.y - b.y);
}

function drawPlayer() {
  const p = state.player;
  const ox = scene.w / 2 - state.camera.x;
  const oy = scene.h / 2 - state.camera.y;
  const moving = Math.hypot(p.moveX, p.moveY) > 0.05;
  const skin = playerSkinMap[p.skin] || playerSkinMap.default;
  const mobile = isMobileLike();
  ctx.save();
  ctx.translate(ox + p.x, oy + p.y);
  ctx.scale(p.facing, 1);
  if (p.invuln > 0) {
    ctx.globalAlpha = 0.62 + Math.sin(state.elapsed * 46) * 0.24;
    ctx.shadowColor = "#fff2c7";
    ctx.shadowBlur = mobile ? 0 : 18;
  } else {
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = mobile ? 0 : 14;
  }
  if (skin.animSheet === "samMaxDuoWalk" && images.samMaxDuoWalk) {
    const frame = moving ? Math.floor(state.elapsed * 12) % SAM_MAX_DUO_WALK.frames : 0;
    const sx = (frame % SAM_MAX_DUO_WALK.cols) * SAM_MAX_DUO_WALK.w;
    const sy = Math.floor(frame / SAM_MAX_DUO_WALK.cols) * SAM_MAX_DUO_WALK.h;
    const bob = moving ? 0 : Math.sin(state.elapsed * 3.2) * 1.2;
    const h = skin.animH;
    const w = h * (SAM_MAX_DUO_WALK.w / SAM_MAX_DUO_WALK.h);
    ctx.drawImage(images.samMaxDuoWalk, sx, sy, SAM_MAX_DUO_WALK.w, SAM_MAX_DUO_WALK.h, -w / 2, -h + 34 + bob, w, h);
  } else if (skin.animSheet === "ryuActions" && images.ryuActions) {
    const action = state.playerAction;
    const frame = action ? ryuActionFrame(action) : moving ? Math.floor(state.elapsed * RYU_ACTION.fps) % RYU_ACTION.frames : 0;
    const row = ryuActionRow(action?.type || "walk");
    const sx = frame * RYU_ACTION.w;
    const sy = row * RYU_ACTION.h;
    const bob = action ? 0 : moving ? 0 : Math.sin(state.elapsed * 3.2) * 0.9;
    const actionScale = action?.type === "shoryuken" ? 1.16 : action?.type === "whirlwindKick" ? 1.12 : action ? 1.06 : 1;
    const h = skin.animH * actionScale;
    const w = h;
    ctx.drawImage(images.ryuActions, sx, sy, RYU_ACTION.w, RYU_ACTION.h, -w / 2, -h + (skin.animDrawYOffset ?? 25) + bob, w, h);
  } else if (skin.animSheet === "guileActions" && images.guileActions) {
    const action = state.playerAction;
    const frame = action ? guileActionFrame(action) : moving ? Math.floor(state.elapsed * 12) % GUILE_ACTION.frames : 0;
    const row = guileActionRow(action?.type || "walk");
    const sx = frame * GUILE_ACTION.w;
    const sy = row * GUILE_ACTION.h;
    const bob = action ? 0 : moving ? 0 : Math.sin(state.elapsed * 3.2) * 1.0;
    const actionScale = action?.type === "flashKick" ? 1.24 : action ? 1.1 : 1;
    const h = skin.animH * actionScale;
    const w = h;
    ctx.drawImage(images.guileActions, sx, sy, GUILE_ACTION.w, GUILE_ACTION.h, -w / 2, -h + (skin.animDrawYOffset ?? 24) + bob, w, h);
  } else if (skin.animSheet === "chunLiActions" && images.chunLiActions) {
    const action = state.playerAction;
    const frame = action ? chunLiActionFrame(action) : moving ? Math.floor(state.elapsed * CHUN_LI_ACTION.fps) % CHUN_LI_ACTION.frames : 0;
    const row = chunLiActionRow(action?.type || "walk");
    const sx = frame * CHUN_LI_ACTION.w;
    const sy = row * CHUN_LI_ACTION.h;
    const bob = action ? 0 : moving ? 0 : Math.sin(state.elapsed * 3.2) * 0.9;
    const actionScale = action?.type === "whirlwindKick" ? 1.16 : action?.type === "lightningKick" ? 1.14 : action ? 1.08 : 1;
    const h = skin.animH * actionScale;
    const w = h;
    ctx.drawImage(images.chunLiActions, sx, sy, CHUN_LI_ACTION.w, CHUN_LI_ACTION.h, -w / 2, -h + (skin.animDrawYOffset ?? 26) + bob, w, h);
  } else if (skin.animSheet === "fighterWalks" && images.fighterWalks) {
    const frame = moving ? Math.floor(state.elapsed * 12) % FIGHTER_WALK.frames : 0;
    const sx = frame * FIGHTER_WALK.w;
    const sy = (skin.fighterRow || 0) * FIGHTER_WALK.h;
    const bob = moving ? 0 : Math.sin(state.elapsed * 3.2) * 1.1;
    const h = skin.animH;
    const w = h;
    ctx.drawImage(images.fighterWalks, sx, sy, FIGHTER_WALK.w, FIGHTER_WALK.h, -w / 2, -h + (skin.animDrawYOffset ?? 32) + bob, w, h);
  } else if (skin.sheet === "samMaxDuo" && images.samMaxDuo) {
    const bob = moving ? Math.sin(state.elapsed * 13) * 3.4 : Math.sin(state.elapsed * 3.2) * 1.2;
    const h = skin.drawH;
    const w = h * (images.samMaxDuo.width / images.samMaxDuo.height);
    ctx.drawImage(images.samMaxDuo, -w / 2, -h + 30 + bob, w, h);
  } else if (skin.animRow !== undefined && images.playerSkinWalks) {
    const frame = moving ? Math.floor(state.elapsed * 12) % PLAYER_SKIN_WALK.cols : 0;
    const sx = frame * PLAYER_SKIN_WALK.w;
    const sy = skin.animRow * PLAYER_SKIN_WALK.h;
    const bob = moving ? 0 : Math.sin(state.elapsed * 3.2) * (skin.idleBob ?? 1.3);
    const h = skin.animH;
    const w = h;
    ctx.drawImage(images.playerSkinWalks, sx, sy, PLAYER_SKIN_WALK.w, PLAYER_SKIN_WALK.h, -w / 2, -h + (skin.animDrawYOffset ?? 32) + bob, w, h);
  } else if (skin.sheet === "playerSkins" && images.playerSkins) {
    const bob = moving ? Math.sin(state.elapsed * 13) * 4 : Math.sin(state.elapsed * 3.2) * 1.5;
    const h = skin.drawH;
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
    if (projectile.signatureId === "sonicBoom" && images.sonicBoomFx) {
      const size = projectile.size || 118;
      drawSonicBoomFx(projectile, ox + projectile.x, oy + projectile.y, size, size, 0.98);
      continue;
    }
    if (projectile.signatureId === "hadoken" && images.ryuHadokenFx) {
      const size = projectile.size || 104;
      drawRyuHadokenFx(projectile, ox + projectile.x, oy + projectile.y, size, size, 0.98);
      continue;
    }
    if (projectile.signatureId === "kiKouKen" && images.chunLiProjectiles) {
      const size = projectile.size || 108;
      drawChunLiProjectileFx(projectile.fx || "kiKouKen", projectile, ox + projectile.x, oy + projectile.y, size, size, 0.98);
      continue;
    }
    if (projectile.type === "signature" && images.signatureWeapons) {
      const size = projectile.size || 74;
      drawSignatureWeaponFx(projectile.signatureId, ox + projectile.x, oy + projectile.y, size, size, projectile.spin, 0.98);
      continue;
    }
    const fx = projectile.type === "bottle"
      ? "rumBombFx"
      : projectile.type === "curseOrb"
        ? projectile.fx || "monkeyCurseOrb"
        : projectile.icon || "coconutBoomerang";
    const size = projectile.type === "bottle" ? (projectile.maelstrom ? 68 : 58) : projectile.type === "curseOrb" ? 50 : projectile.type === "signature" ? 58 : projectile.compassFuse ? 58 : 52;
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
      const backRatio = zone.fxBackRatio ?? CUTLASS_FX_BACK_RATIO;
      drawPlayerEffectAt("cutlassAfterglow", -slashSize * backRatio, -slashSize * 0.64, slashSize * 1.14, slashSize * 1.28);
      const blades = zone.blades || cutlassBladeCount(zone.level);
      if (images.weaponEvolutionFx && blades >= 2) {
        const frame = `cutlass${Math.min(5, blades)}`;
        drawWeaponEvolutionFxAt(frame, -slashSize * Math.max(0.12, backRatio * 0.86), -slashSize * 0.66, slashSize * 1.1, slashSize * 1.22);
      } else {
        drawProjectileFxAt("cutlassSlash", -slashSize * Math.max(0.08, backRatio * 0.55), -slashSize * 0.58, slashSize, slashSize);
      }
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
    } else if (zone.type === "sonicBoomBurst") {
      ctx.translate(ox + zone.x, oy + zone.y);
      ctx.rotate(zone.angle || 0);
      const burstSize = zone.radius * 2.25;
      if (images.sonicBoomFx) {
        drawSonicBoomFxAt(zone.stage || 0, Math.floor((1 - a) * SONIC_BOOM_FX.frames + (zone.frameSeed || 0)), -burstSize / 2, -burstSize / 2, burstSize, burstSize);
      }
      ctx.globalAlpha = a * 0.35;
      drawPlayerEffectAt("compassBeam", -burstSize * 0.62, -burstSize * 0.5, burstSize * 1.24, burstSize);
    } else if (zone.type === "ryuHadokenBurst") {
      ctx.translate(ox + zone.x, oy + zone.y);
      ctx.rotate(zone.angle || 0);
      const burstSize = zone.radius * 2.35;
      drawRyuHadokenFxAt(zone.stage || 0, Math.floor((1 - a) * RYU_HADOKEN_FX.frames + (zone.frameSeed || 0)), -burstSize / 2, -burstSize / 2, burstSize, burstSize);
      ctx.globalAlpha = a * 0.36;
      drawPlayerEffectAt("compassBeam", -burstSize * 0.58, -burstSize * 0.48, burstSize * 1.16, burstSize * 0.96);
    } else if (zone.type === "signatureBurst" || zone.type === "signatureTrap") {
      ctx.translate(ox + zone.x, oy + zone.y);
      ctx.rotate((zone.angle || 0) + state.elapsed * (zone.type === "signatureTrap" ? 0.35 : 0.7));
      const burstSize = zone.radius * (zone.type === "signatureTrap" ? 2.25 : 2.45);
      drawPlayerEffectAt(zone.type === "signatureTrap" ? "tidePulse" : "curseBurst", -burstSize * 0.54, -burstSize * 0.54, burstSize * 1.08, burstSize * 1.08);
      drawSignatureWeaponFxAt(zone.signature, Math.floor((1 - a) * SIGNATURE_WEAPON_FX.frames + state.elapsed * 8), -burstSize / 2, -burstSize / 2, burstSize, burstSize);
    } else if (zone.type === "guileStrike" || zone.type === "guileFlashKick") {
      ctx.translate(ox + zone.x, oy + zone.y);
      ctx.rotate(zone.type === "guileFlashKick" ? 0 : zone.angle || 0);
      const size = zone.radius * (zone.type === "guileFlashKick" ? 2.2 : 1.85);
      drawPlayerEffectAt(zone.type === "guileFlashKick" ? "tidePulse" : "compassBeam", -size / 2, -size / 2, size, size);
      ctx.globalAlpha = a * 0.42;
      drawGuileActionFrameAt(zone.move, Math.floor((1 - a) * GUILE_ACTION.frames), -size / 2, -size * 0.58, size, size);
    } else if (zone.type === "ryuStrike" || zone.type === "ryuWhirlwind") {
      ctx.translate(ox + zone.x, oy + zone.y);
      ctx.rotate(zone.type === "ryuWhirlwind" ? (zone.angle || 0) + state.elapsed * 3.4 : zone.angle || 0);
      const size = zone.radius * (zone.type === "ryuWhirlwind" ? 2.05 : 1.9);
      drawPlayerEffectAt(zone.type === "ryuWhirlwind" ? "tidePulse" : "compassBeam", -size / 2, -size / 2, size, size);
      ctx.globalAlpha = a * (zone.type === "ryuWhirlwind" ? 0.52 : 0.46);
      drawRyuActionFrameAt(zone.move, Math.floor((1 - a) * RYU_ACTION.frames), -size / 2, -size * 0.58, size, size);
    } else if (zone.type === "chunLiProjectileBurst") {
      ctx.translate(ox + zone.x, oy + zone.y);
      ctx.rotate((zone.angle || 0) + state.elapsed * 0.5);
      const burstSize = zone.radius * 2.45;
      drawPlayerEffectAt("compassBeam", -burstSize * 0.55, -burstSize * 0.5, burstSize * 1.1, burstSize);
      ctx.globalAlpha = a * 0.76;
      drawChunLiProjectileFxAt(zone.fx || "kiKouKen", Math.floor((1 - a) * CHUN_LI_PROJECTILE_FX.frames + (zone.frameSeed || 0)), -burstSize / 2, -burstSize / 2, burstSize, burstSize);
    } else if (zone.type === "chunLiKick" || zone.type === "chunLiWhirlwind") {
      ctx.translate(ox + zone.x, oy + zone.y);
      ctx.rotate(zone.type === "chunLiWhirlwind" ? (zone.angle || 0) + state.elapsed * 3.7 : zone.angle || 0);
      const size = zone.radius * (zone.type === "chunLiWhirlwind" ? 2.08 : 1.92);
      drawPlayerEffectAt(zone.type === "chunLiWhirlwind" ? "tidePulse" : "compassBeam", -size / 2, -size / 2, size, size);
      ctx.globalAlpha = a * (zone.type === "chunLiWhirlwind" ? 0.62 : 0.54);
      drawChunLiProjectileFxAt(zone.fx || "thousandKickArc", Math.floor((1 - a) * CHUN_LI_PROJECTILE_FX.frames), -size / 2, -size / 2, size, size);
      ctx.globalAlpha = a * 0.42;
      drawChunLiActionFrameAt(zone.move, Math.floor((1 - a) * CHUN_LI_ACTION.frames), -size / 2, -size * 0.58, size, size);
    } else if (zone.type === "tideRipple") {
      ctx.translate(ox + zone.x, oy + zone.y);
      const rippleSize = zone.radius * 2.2;
      drawPlayerEffectAt("tidePulse", -rippleSize / 2, -rippleSize / 2, rippleSize, rippleSize);
    } else if (zone.type === "omenBoon") {
      ctx.translate(ox + zone.x, oy + zone.y);
      ctx.rotate(state.elapsed * 0.7);
      const size = 82 + Math.min(44, (zone.level || 1) * 10);
      drawPlayerEffectAt("treasureGlint", -size * 0.88, -size * 0.88, size * 1.76, size * 1.76);
      drawItemAt(zone.icon || "bloodRose", -size / 2, -size / 2, size, size);
    } else if (zone.type === "saberTornado") {
      ctx.translate(ox + zone.x, oy + zone.y);
      ctx.rotate(zone.angle + state.elapsed * 1.1);
      const frame = Math.min(3, Math.floor((1 - a) * 4 + state.elapsed * 10) % 4);
      const size = zone.radius * (zone.fused ? 2.65 : 2.25);
      const key = `${zone.fused ? "fusion" : "tornado"}${frame}`;
      if (images.weaponEvolutionFx) {
        drawWeaponEvolutionFxAt(key, -size / 2, -size / 2, size, size);
      } else {
        drawPlayerEffectAt("tidePulse", -size / 2, -size / 2, size, size);
      }
    } else if (zone.type === "fusionRelic") {
      ctx.translate(ox + zone.x, oy + zone.y);
      const frame = Math.floor(state.elapsed * FUSION_RELIC.fps + (zone.level || 1)) % FUSION_RELIC.frames;
      const size = 96 + (zone.level || 1) * 14;
      drawPlayerEffectAt("treasureGlint", -size * 0.8, -size * 0.8, size * 1.6, size * 1.6);
      drawFusionRelicAt(zone.icon, frame, -size / 2, -size / 2, size, size);
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
  const auraStage = auraEvolutionStage(level);
  if (images.weaponEvolutionFx && auraStage > 0) {
    const progress = clamp(level / 5, 0, 1);
    const auraSize = radius * (1.58 + auraStage * 0.16 + progress * 0.28) * pulse;
    drawWeaponEvolutionFx(`aura${auraStage}`, x, y, auraSize, auraSize, angle * 0.12, 0.16 + level * 0.038);
    if (level >= 4) {
      drawWeaponEvolutionFx(`aura${Math.max(1, auraStage - 1)}`, x, y, auraSize * 0.82, auraSize * 0.82, -angle * 0.1, 0.08 + level * 0.012);
    }
    if (saberTornadoReady()) {
      const frame = Math.floor(state.elapsed * 8) % 4;
      drawWeaponEvolutionFx(`fusion${frame}`, x, y, auraSize * 1.06, auraSize * 1.06, -angle * 0.18, 0.16);
    }
  } else {
    drawPlayerEffect("tidePulse", x, y, radius * (1.36 + level * 0.08) * pulse, radius * (1.36 + level * 0.08) * pulse, 0, 0.11 + level * 0.035);
  }
  const count = isMobileLike() ? Math.min(10, 4 + level * 2) : Math.min(18, 6 + level * 3);
  for (let i = 0; i < count; i += 1) {
    const a = angle * 0.72 + (i / count) * Math.PI * 2;
    const ripple = Math.sin(state.elapsed * 5.4 + i * 0.9) * 3.5;
    const px = x + Math.cos(a) * (radius + ripple);
    const py = y + Math.sin(a) * (radius + ripple * 0.7);
    const size = 22 + level * 4 + Math.sin(state.elapsed * 4.8 + i) * 2;
    drawProjectileFx("ropeRing", px, py, size, size, a + Math.PI / 2, 0.42 + level * 0.055);
  }
}

function drawParticles() {
  const ox = scene.w / 2 - state.camera.x;
  const oy = scene.h / 2 - state.camera.y;
  const richFx = images.playerEffects && !lowFxMode() && state.particles.length <= 18;
  for (const particle of state.particles) {
    const alpha = clamp(particle.life / 0.4, 0, 1);
    if (richFx) {
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
    const screenSize = text.size || (isMobileLike() ? MOBILE_PERF.textMin : 20);
    const worldSize = screenSize / Math.max(0.34, scene.zoom || 1);
    ctx.font = `900 ${worldSize}px Trebuchet MS, sans-serif`;
    ctx.globalAlpha = clamp(text.life / (text.maxLife || 0.9), 0, 1);
    ctx.fillStyle = text.color;
    ctx.strokeStyle = "rgba(0,0,0,0.65)";
    ctx.lineWidth = Math.max(3, screenSize * 0.16) / Math.max(0.34, scene.zoom || 1);
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

function drawWeaponEvolutionFx(icon, x, y, w, h, rotation = 0, alpha = 1) {
  if (!images.weaponEvolutionFx) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  drawWeaponEvolutionFxAt(icon, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawWeaponEvolutionFxAt(icon, x, y, w, h) {
  if (!images.weaponEvolutionFx) return;
  const src = weaponEvolutionFxMap[icon] || weaponEvolutionFxMap.cutlass2;
  ctx.drawImage(
    images.weaponEvolutionFx,
    src.x * WEAPON_EVOLUTION_FX.w,
    src.y * WEAPON_EVOLUTION_FX.h,
    WEAPON_EVOLUTION_FX.w,
    WEAPON_EVOLUTION_FX.h,
    x,
    y,
    w,
    h,
  );
}

function drawGuileActionFrameAt(move, frame, x, y, w, h) {
  if (!images.guileActions) return;
  const row = guileActionRow(move);
  const sx = positiveModulo(frame || 0, GUILE_ACTION.frames) * GUILE_ACTION.w;
  const sy = row * GUILE_ACTION.h;
  ctx.drawImage(images.guileActions, sx, sy, GUILE_ACTION.w, GUILE_ACTION.h, x, y, w, h);
}

function drawRyuActionFrameAt(move, frame, x, y, w, h) {
  if (!images.ryuActions) return;
  const row = ryuActionRow(move);
  const sx = positiveModulo(frame || 0, RYU_ACTION.frames) * RYU_ACTION.w;
  const sy = row * RYU_ACTION.h;
  ctx.drawImage(images.ryuActions, sx, sy, RYU_ACTION.w, RYU_ACTION.h, x, y, w, h);
}

function drawChunLiActionFrameAt(move, frame, x, y, w, h) {
  if (!images.chunLiActions) return;
  const row = chunLiActionRow(move);
  const sx = positiveModulo(frame || 0, CHUN_LI_ACTION.frames) * CHUN_LI_ACTION.w;
  const sy = row * CHUN_LI_ACTION.h;
  ctx.drawImage(images.chunLiActions, sx, sy, CHUN_LI_ACTION.w, CHUN_LI_ACTION.h, x, y, w, h);
}

function drawSonicBoomFx(projectile, x, y, w, h, alpha = 1) {
  if (!images.sonicBoomFx) {
    drawSignatureWeaponFx("sonicBoom", x, y, w, h, projectile.spin || 0, alpha);
    return;
  }
  const angle = Math.atan2(projectile.vy || 0, projectile.vx || 1);
  const level = projectile.sonicLevel || Math.max(1, state.weapons.cutlass.level || 1);
  const stage = projectile.sonicStage ?? sonicBoomStage(level);
  const frame = Math.floor(state.elapsed * SONIC_BOOM_FX.fps + (projectile.animSeed || 0));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  drawSonicBoomFxAt(stage, frame, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawSonicBoomFxAt(stage, frame, x, y, w, h) {
  if (!images.sonicBoomFx) return;
  const safeStage = clamp(stage || 0, 0, SONIC_BOOM_FX.rows - 1);
  const sx = positiveModulo(frame || 0, SONIC_BOOM_FX.frames) * SONIC_BOOM_FX.w;
  const sy = safeStage * SONIC_BOOM_FX.h;
  ctx.drawImage(images.sonicBoomFx, sx, sy, SONIC_BOOM_FX.w, SONIC_BOOM_FX.h, x, y, w, h);
}

function drawRyuHadokenFx(projectile, x, y, w, h, alpha = 1) {
  if (!images.ryuHadokenFx) {
    drawSignatureWeaponFx("hadoken", x, y, w, h, projectile.spin || 0, alpha);
    return;
  }
  const angle = Math.atan2(projectile.vy || 0, projectile.vx || 1);
  const stage = projectile.hadokenStage ?? ryuHadokenStage(projectile.hadokenLevel || 1);
  const frame = Math.floor(state.elapsed * RYU_HADOKEN_FX.fps + (projectile.animSeed || 0));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  drawRyuHadokenFxAt(stage, frame, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawRyuHadokenFxAt(stage, frame, x, y, w, h) {
  if (!images.ryuHadokenFx) return;
  const safeStage = clamp(stage || 0, 0, RYU_HADOKEN_FX.rows - 1);
  const sx = positiveModulo(frame || 0, RYU_HADOKEN_FX.frames) * RYU_HADOKEN_FX.w;
  const sy = safeStage * RYU_HADOKEN_FX.h;
  ctx.drawImage(images.ryuHadokenFx, sx, sy, RYU_HADOKEN_FX.w, RYU_HADOKEN_FX.h, x, y, w, h);
}

function drawChunLiProjectileFx(fx, projectile, x, y, w, h, alpha = 1) {
  if (!images.chunLiProjectiles) {
    drawSignatureWeaponFx("kiKouKen", x, y, w, h, projectile.spin || 0, alpha);
    return;
  }
  const angle = Math.atan2(projectile.vy || 0, projectile.vx || 1);
  const frame = Math.floor(state.elapsed * CHUN_LI_PROJECTILE_FX.fps + (projectile.animSeed || 0));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  drawChunLiProjectileFxAt(fx, frame, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawChunLiProjectileFxAt(fx, frame, x, y, w, h) {
  if (!images.chunLiProjectiles) return;
  const src = chunLiProjectileFxMap[fx] || chunLiProjectileFxMap.kiKouKen;
  const sx = positiveModulo(frame || 0, CHUN_LI_PROJECTILE_FX.frames) * CHUN_LI_PROJECTILE_FX.w;
  const sy = src.row * CHUN_LI_PROJECTILE_FX.h;
  ctx.drawImage(images.chunLiProjectiles, sx, sy, CHUN_LI_PROJECTILE_FX.w, CHUN_LI_PROJECTILE_FX.h, x, y, w, h);
}

function drawSignatureWeaponFx(signatureId, x, y, w, h, rotation = 0, alpha = 1) {
  if (!images.signatureWeapons) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  drawSignatureWeaponFxAt(signatureId, Math.floor(state.elapsed * SIGNATURE_WEAPON_FX.fps), -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawSignatureWeaponFxAt(signatureId, frame, x, y, w, h) {
  if (!images.signatureWeapons) return;
  const src = signatureWeaponMap[signatureId] || signatureWeaponMap.captainCutlass;
  const sx = positiveModulo(frame || 0, SIGNATURE_WEAPON_FX.frames) * SIGNATURE_WEAPON_FX.w;
  const sy = src.row * SIGNATURE_WEAPON_FX.h;
  ctx.drawImage(images.signatureWeapons, sx, sy, SIGNATURE_WEAPON_FX.w, SIGNATURE_WEAPON_FX.h, x, y, w, h);
}

function drawFusionRelicAt(icon, frame, x, y, w, h) {
  if (!images.fusionRelics) return;
  const src = fusionRelicMap[icon] || fusionRelicMap.stormConch;
  const sx = clamp(frame || 0, 0, FUSION_RELIC.frames - 1) * FUSION_RELIC.w;
  const sy = src.row * FUSION_RELIC.h;
  ctx.drawImage(images.fusionRelics, sx, sy, FUSION_RELIC.w, FUSION_RELIC.h, x, y, w, h);
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
  if (ryuHadokenFxMap[icon]) {
    const src = ryuHadokenFxMap[icon];
    const by = src.row / Math.max(1, RYU_HADOKEN_FX.rows - 1) * 100;
    return `background-image:url('${imageSources.ryuHadokenFx}');background-size:${RYU_HADOKEN_FX.frames * 100}% ${RYU_HADOKEN_FX.rows * 100}%;background-position:0% ${by}%;`;
  }
  if (chunLiProjectileFxMap[icon]) {
    const src = chunLiProjectileFxMap[icon];
    const by = src.row / Math.max(1, CHUN_LI_PROJECTILE_FX.rows - 1) * 100;
    return `background-image:url('${imageSources.chunLiProjectiles}');background-size:${CHUN_LI_PROJECTILE_FX.frames * 100}% ${CHUN_LI_PROJECTILE_FX.rows * 100}%;background-position:0% ${by}%;`;
  }
  if (signatureWeaponMap[icon]) {
    const src = signatureWeaponMap[icon];
    const by = src.row / Math.max(1, SIGNATURE_WEAPON_FX.rows - 1) * 100;
    return `background-image:url('${imageSources.signatureWeapons}');background-size:400% ${SIGNATURE_WEAPON_FX.rows * 100}%;background-position:0% ${by}%;`;
  }
  if (fusionRelicMap[icon]) {
    const src = fusionRelicMap[icon];
    const by = src.row / Math.max(1, FUSION_RELIC.rows - 1) * 100;
    return `background-image:url('${imageSources.fusionRelics}');background-size:400% 400%;background-position:0% ${by}%;`;
  }
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

function nearestEnemyFrom(x, y, exclude = null) {
  let best = null;
  let bestDist = Infinity;
  for (const enemy of state.enemies) {
    if (enemy === exclude || enemy.hp <= 0) continue;
    const d = Math.hypot(enemy.x - x, enemy.y - y);
    if (d < bestDist) {
      best = enemy;
      bestDist = d;
    }
  }
  return best;
}

function floatingText(value, x, y, color, life = 0.9, size = 20, options = {}) {
  if (!state?.texts) return;
  const minSize = isMobileLike() ? MOBILE_PERF.textMin : 20;
  const normalizedSize = Math.max(size || minSize, minSize);
  state.texts.push({
    value,
    x,
    y,
    color,
    life,
    maxLife: life,
    size: normalizedSize,
    rise: options.rise,
    priority: options.priority || 0,
  });
  const cap = textCap();
  if (state.texts.length > cap) {
    state.texts.sort((a, b) => (a.priority || 0) - (b.priority || 0) || a.life - b.life);
    state.texts.splice(0, state.texts.length - cap);
  }
}

function shake(power) {
  state.camera.x += (Math.random() - 0.5) * power * 12;
  state.camera.y += (Math.random() - 0.5) * power * 12;
}

function onScreen(x, y, margin = 0) {
  return Math.abs(x - state.camera.x) < scene.w / 2 + margin && Math.abs(y - state.camera.y) < scene.h / 2 + margin;
}

function spawnSightlineBuffer(customBuffer) {
  if (Number.isFinite(customBuffer)) return customBuffer;
  return Math.max(PROP_SPAWN_BUFFER, Math.min(860, Math.max(scene.w, scene.h) * 0.28));
}

function isInSpawnSightline(x, y, target = state, customBuffer) {
  const camera = target?.camera || target?.player || state?.camera || state?.player;
  if (!camera) return false;
  const buffer = spawnSightlineBuffer(customBuffer);
  return Math.abs(x - camera.x) < scene.w / 2 + buffer && Math.abs(y - camera.y) < scene.h / 2 + buffer;
}

function propSpawnProgress(prop) {
  if (!Number.isFinite(prop.createdAt)) return 1;
  const fade = Math.max(0.1, prop.fadeIn || PROP_FADE_SECONDS);
  return clamp((state.elapsed - prop.createdAt) / fade, 0, 1);
}

function offscreenRewardDistance() {
  return Math.max(900, Math.min(1650, Math.max(scene.w, scene.h) * 0.62 + 260));
}

function updateSceneViewport() {
  scene.zoom = getSceneZoom();
  scene.w = viewW / scene.zoom;
  scene.h = viewH / scene.zoom;
}

function getSceneZoom() {
  if (isMobileLike()) {
    return viewW > viewH ? 0.35 : 0.38;
  }
  if (viewW < 980) return 0.48;
  return 0.5;
}

function isMobileLike() {
  return mobileLike;
}

function computeMobileLike(width = viewW, height = viewH) {
  const coarsePointer = window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches;
  const mobileSized = Math.min(width, height) <= 560 || Math.max(width, height) <= 940;
  return !!coarsePointer || mobileSized;
}

function syncCanvasSize() {
  const nextW = window.innerWidth;
  const nextH = window.innerHeight;
  viewW = nextW;
  viewH = nextH;
  mobileLike = computeMobileLike(nextW, nextH);
  const nextDpr = Math.min(isMobileLike() ? MOBILE_PERF.dpr : 1.75, window.devicePixelRatio || 1);
  if (
    nextDpr === dpr
    && nextW === canvas.clientWidth
    && nextH === canvas.clientHeight
    && canvas.width === Math.floor(viewW * dpr)
    && canvas.height === Math.floor(viewH * dpr)
  ) {
    updateSceneViewport();
    return false;
  }
  dpr = nextDpr;
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

ui.startButton.addEventListener("click", () => {
  armMusicForStart("main");
  startGame();
  requestMobilePreferredFullscreen();
});
ui.quickButton.addEventListener("click", () => {
  armMusicForStart("rush");
  startGame({ quick: true });
  requestMobilePreferredFullscreen();
});
ui.restartButton.addEventListener("click", () => {
  armMusicForStart(quickMode ? "rush" : "main");
  startGame({ quick: quickMode });
  requestMobilePreferredFullscreen();
});
ui.startButton.addEventListener("pointerdown", () => armMusicForStart("main"));
ui.quickButton.addEventListener("pointerdown", () => armMusicForStart("rush"));
ui.restartButton.addEventListener("pointerdown", () => armMusicForStart(quickMode ? "rush" : "main"));
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
function handleMetaSkillClick(event) {
  const button = event.target.closest("[data-meta-skill]");
  if (!button) return;
  buyMetaSkill(button.dataset.metaSkill);
}
ui.metaSkills?.addEventListener("click", handleMetaSkillClick);
ui.endMetaSkills?.addEventListener("click", handleMetaSkillClick);
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
    playSkinSound("confirm", "confirm");
    speak("Pause.", { key: "pause", interrupt: true, cooldown: 0 });
  } else if (state.phase === "paused") {
    state.phase = "playing";
    lastTime = performance.now();
    playSkinSound("confirm", "confirm");
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
    document.documentElement.requestFullscreen({ navigationUI: "hide" })
      .then(() => {
        if (isMobileLike()) lockMobilePreferredOrientation();
      })
      .catch(() => {
        if (isMobileLike()) lockMobilePreferredOrientation();
      });
  }
}

function preferredMobileOrientation() {
  const type = screen.orientation?.type || "";
  const landscape = window.innerWidth > window.innerHeight
    || (window.innerWidth === window.innerHeight && /^landscape/i.test(type));
  return landscape
    ? { preference: "landscape-primary", fallback: "landscape" }
    : { preference: "portrait-primary", fallback: "portrait" };
}

function setMobileOrientationPreference() {
  const orientation = preferredMobileOrientation();
  mobileDisplayState.orientationPreference = orientation.preference;
  mobileDisplayState.orientationFallback = orientation.fallback;
  return orientation;
}

function lockMobilePreferredOrientation() {
  const orientation = setMobileOrientationPreference();
  mobileDisplayState.orientationRequested = mobileDisplayState.orientationPreference;
  mobileDisplayState.orientationLocked = false;
  mobileDisplayState.orientationError = null;
  if (!screen.orientation?.lock) return;
  screen.orientation.lock(orientation.preference)
    .then(() => {
      mobileDisplayState.orientationLocked = true;
    })
    .catch((error) => {
      mobileDisplayState.orientationError = error?.name || error?.message || `${orientation.preference} failed`;
      mobileDisplayState.orientationRequested = orientation.fallback;
      screen.orientation.lock(orientation.fallback)
        .then(() => {
          mobileDisplayState.orientationLocked = true;
          mobileDisplayState.orientationError = null;
        })
        .catch((fallbackError) => {
          mobileDisplayState.orientationError = fallbackError?.name || fallbackError?.message || `${orientation.fallback} failed`;
        });
    });
}

function requestMobilePreferredFullscreen() {
  if (!isMobileLike()) return;
  mobileDisplayState.requested = true;
  setMobileOrientationPreference();
  mobileDisplayState.fullscreenAvailable = !!(document.fullscreenEnabled && document.documentElement.requestFullscreen);
  if (!document.fullscreenElement && document.fullscreenEnabled && document.documentElement.requestFullscreen) {
    mobileDisplayState.fullscreenRequested = true;
    mobileDisplayState.fullscreenError = null;
    try {
      document.documentElement.requestFullscreen({ navigationUI: "hide" })
        .then(() => lockMobilePreferredOrientation())
        .catch((error) => {
          mobileDisplayState.fullscreenError = error?.name || error?.message || "fullscreen failed";
          lockMobilePreferredOrientation();
        });
    } catch (error) {
      mobileDisplayState.fullscreenError = error?.name || error?.message || "fullscreen threw";
      lockMobilePreferredOrientation();
    }
  } else {
    lockMobilePreferredOrientation();
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
  syncMusic();
  render();
  return window.__MONKEY_TIDE_DEBUG();
};
window.__MONKEY_TIDE_SET_MAP = (id) => {
  if (mapUnlocked(id)) setSelectedMap(id);
  return window.__MONKEY_TIDE_DEBUG();
};
window.__MONKEY_TIDE_CLEAR_PLAYTEST_AREA = (radius = 680) => {
  const p = state.player;
  const shouldRemove = (prop) => propBlocksMovement(prop) && Math.hypot(prop.x - p.x, prop.y - p.y) < radius;
  const removed = new Set(state.props.filter(shouldRemove));
  if (removed.size > 0) {
    state.props = state.props.filter((prop) => !removed.has(prop));
    state.looseProps = (state.looseProps || []).filter((prop) => !removed.has(prop));
    for (const [key, list] of state.propsByChunk.entries()) {
      state.propsByChunk.set(key, list.filter((prop) => !removed.has(prop)));
    }
  }
  return { removed: removed.size, debug: window.__MONKEY_TIDE_DEBUG() };
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
    r: type.radius * ENEMY_TUNING.hitboxScale * (boss ? 1.25 : 1),
    speed: type.speed * (1 + state.elapsed / BALANCE.enemySpeedGrowth),
    damage: type.damage,
    row: type.row,
    frameOffset: Math.floor(Math.random() * 16),
    hit: 0,
    boss,
    shootTimer: 0.8 + Math.random() * 1.2,
    actionPulse: 0,
    actionKind: null,
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
  addPropToTarget(state, obstacle);
  const before = { x: p.x, y: p.y };
  for (let i = 0; i < 30; i += 1) moveActorWithObstacles(p, 520, 0, 1 / 60, p.r);
  const ground = { type: enemyType("coralBrute"), x: obstacle.x, y: obstacle.y, r: enemyType("coralBrute").radius };
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
  powerUpTypes.forEach((type, index) => {
    spawnPowerup(state.player.x + 36 + index * 34, state.player.y, type.id);
  });
  for (const gem of state.gems.filter((gem) => gem.kind === "powerup")) collectGem(gem);
  metaProgress.landmarks = Math.max(metaProgress.landmarks, 4);
  metaProgress.bestSurvival = Math.max(metaProgress.bestSurvival, 160);
  metaProgress.kills = Math.max(metaProgress.kills, 40);
  metaProgress.bestStreak = Math.max(metaProgress.bestStreak, 12);
  metaProgress.fusions = Math.max(metaProgress.fusions, 2);
  metaProgress.flowRewards = Math.max(metaProgress.flowRewards, 10);
  unlockAchievements();
  saveMetaProgress();
  renderMapPicker();
  renderMetaProgress();
  render();
  return window.__MONKEY_TIDE_DEBUG();
};
window.__MONKEY_TIDE_META_SKILL_PROBE = () => {
  const beforeCoins = metaProgress.coins;
  metaProgress.coins = Math.max(metaProgress.coins, 240);
  const boughtSignature = buyMetaSkill("signatureMastery");
  const boughtFlow = buyMetaSkill("flowMemory");
  const boughtHeart = buyMetaSkill("tideHeart");
  const savedState = state;
  const savedSkin = selectedSkin;
  selectedSkin = "ryu";
  state = makeState();
  const result = {
    boughtSignature,
    boughtFlow,
    boughtHeart,
    beforeCoins,
    afterCoins: metaProgress.coins,
    skills: Object.fromEntries(metaSkillDefinitions.map((skill) => [skill.id, metaSkillLevel(skill.id)])),
    bonuses: metaSkillBonuses(),
    stateStats: { ...state.stats },
    signatureTimer: state.signatureMove.timer,
    playerMaxHp: state.player.maxHp,
    cardCount: document.querySelectorAll("[data-meta-skill]").length,
  };
  state = savedState;
  selectedSkin = savedSkin;
  saveMetaProgress();
  renderMetaProgress();
  renderMetaSkills();
  return result;
};
window.__MONKEY_TIDE_PROP_VISUAL_PROBE = () => {
  if (state.phase !== "playing") state.phase = "playing";
  const p = state.player;
  const props = [
    { icon: "beachHut", x: p.x - 250, y: p.y + 70, scale: 0.82, spin: 0.06, interactive: true, blocking: true, discovered: true, probe: true },
    { icon: "boatWreck", x: p.x + 270, y: p.y + 70, scale: 0.82, spin: 0.18, interactive: true, blocking: true, discovered: true, probe: true },
    { icon: "openTreasureChest", x: p.x + 18, y: p.y + 190, scale: 0.5, spin: 0.04, interactive: true, discovered: true, probe: true },
    { icon: "palmTree", x: p.x - 30, y: p.y + 320, scale: 0.52, spin: 0.02, interactive: false, blocking: true, probe: true },
  ];
  props.forEach((prop) => addPropToTarget(state, prop));
  render();
  return {
    props: props.map((prop) => ({
      icon: prop.icon,
      image: beachPropMap[prop.icon]?.image,
      alpha: propRenderAlpha(prop),
      discovered: prop.discovered === true,
    })),
    debug: window.__MONKEY_TIDE_DEBUG(),
  };
};
window.__MONKEY_TIDE_STREAK_CACHE_PROBE = () => {
  if (state.phase !== "playing") state.phase = "playing";
  const p = state.player;
  const before = state.props.length;
  spawnStreakCache(Math.max(48, state.streak?.count || 0));
  const cache = state.props.slice(before).find((prop) => prop.streakCache);
  render();
  return {
    cache: cache ? {
      x: cache.x,
      y: cache.y,
      distance: Math.round(Math.hypot(cache.x - p.x, cache.y - p.y)),
      inSightline: isInSpawnSightline(cache.x, cache.y, state, 0),
      hasFade: Number.isFinite(cache.createdAt) && cache.fadeIn > 0,
      alphaProgress: propSpawnProgress(cache),
    } : null,
    debug: window.__MONKEY_TIDE_DEBUG(),
  };
};
window.__MONKEY_TIDE_THREE_MONKEY_PROBE = () => {
  if (state.phase !== "playing") state.phase = "playing";
  state.elapsed = Math.max(state.elapsed, BALANCE.rangedPressureAt + 8);
  const p = state.player;
  window.__MONKEY_TIDE_SPAWN_ENEMY("threeHeadedMonkey", p.x + 420, p.y + 24, true);
  const boss = [...state.enemies].reverse().find((enemy) => enemy.type.id === "threeHeadedMonkey");
  if (boss) {
    boss.shootTimer = 0;
    const dx = p.x - boss.x;
    const dy = p.y - boss.y;
    updateEnemyRangedAttack(boss, 1 / 60, Math.hypot(dx, dy), dx, dy);
  }
  render();
  const profile = boss ? enemyProjectileProfile(boss) : null;
  return {
    boss: boss ? { id: boss.type.id, name: boss.type.name, hp: boss.hp, boss: boss.boss } : null,
    assetLoaded: !!images.threeHeadedMonkey,
    animationLoaded: !!images.threeHeadedMonkeyAnim,
    animationFrames: { ...THREE_HEADED_MONKEY_ANIM },
    profile,
    monkeyProjectiles: state.projectiles.filter((projectile) => projectile.type === "curseOrb" && projectile.fx === "monkeyCurseOrb").length,
    debug: window.__MONKEY_TIDE_DEBUG(),
  };
};
window.__MONKEY_TIDE_BLACKBEARD_PROBE = () => {
  if (state.phase !== "playing") state.phase = "playing";
  state.elapsed = Math.max(state.elapsed, BALANCE.rangedPressureAt + 8);
  const p = state.player;
  window.__MONKEY_TIDE_SPAWN_ENEMY("blackbeard", p.x + 440, p.y - 18, true);
  const boss = [...state.enemies].reverse().find((enemy) => enemy.type.id === "blackbeard");
  if (boss) {
    boss.shootTimer = 0;
    const dx = p.x - boss.x;
    const dy = p.y - boss.y;
    updateEnemyRangedAttack(boss, 1 / 60, Math.hypot(dx, dy), dx, dy);
  }
  render();
  const profile = boss ? enemyProjectileProfile(boss) : null;
  return {
    boss: boss ? { id: boss.type.id, name: boss.type.name, hp: boss.hp, boss: boss.boss } : null,
    assetLoaded: !!images.blackbeard,
    animationLoaded: !!images.blackbeardAnim,
    animationFrames: { ...BLACKBEARD_ANIM },
    profile,
    cannonballs: state.projectiles.filter((projectile) => projectile.type === "curseOrb" && projectile.fx === "ghostCannonball").length,
    debug: window.__MONKEY_TIDE_DEBUG(),
  };
};
window.__MONKEY_TIDE_TIME_TENTACLE_PROBE = () => {
  if (state.phase !== "playing") state.phase = "playing";
  state.elapsed = Math.max(state.elapsed, BALANCE.rangedPressureAt + 8);
  const p = state.player;
  window.__MONKEY_TIDE_SPAWN_ENEMY("tideTentacle", p.x + 410, p.y + 36, true);
  const boss = [...state.enemies].reverse().find((enemy) => enemy.type.id === "tideTentacle");
  if (boss) {
    boss.shootTimer = 0;
    const dx = p.x - boss.x;
    const dy = p.y - boss.y;
    updateEnemyRangedAttack(boss, 1 / 60, Math.hypot(dx, dy), dx, dy);
  }
  render();
  const profile = boss ? enemyProjectileProfile(boss) : null;
  return {
    boss: boss ? { id: boss.type.id, name: boss.type.name, hp: boss.hp, boss: boss.boss } : null,
    assetLoaded: !!images.timeTentacleAnim,
    animationLoaded: !!images.timeTentacleAnim,
    animationFrames: { ...TIME_TENTACLE_ANIM },
    profile,
    curseOrbs: state.projectiles.filter((projectile) => projectile.type === "curseOrb" && projectile.fx === "monkeyCurseOrb").length,
    debug: window.__MONKEY_TIDE_DEBUG(),
  };
};
window.__MONKEY_TIDE_NEW_ENEMY_PROBE = () => {
  if (state.phase !== "playing") state.phase = "playing";
  state.elapsed = Math.max(state.elapsed, BALANCE.rangedPressureAt + 8);
  const p = state.player;
  const ids = ["tideTentacle", "reefSquid", "cactusStack"];
  ids.forEach((id, index) => {
    window.__MONKEY_TIDE_SPAWN_ENEMY(id, p.x + 260 + index * 130, p.y - 70 + index * 70, false);
  });
  render();
  return {
    assetLoaded: !!images.newEnemyTrio && !!images.platformerEnemies,
    animationFrames: { ...NEW_ENEMY_TRIO },
    platformerAnimationFrames: { ...PLATFORMER_ENEMY_ANIM },
    platformerTypes: Object.keys(platformerEnemyAnimMap),
    spawned: state.enemies.filter((enemy) => ids.includes(enemy.type.id)).map((enemy) => enemy.type.id),
    debug: window.__MONKEY_TIDE_DEBUG(),
  };
};
window.__MONKEY_TIDE_OMEN_SHARD_PROBE = () => {
  if (state.phase !== "playing") state.phase = "playing";
  state.omenShards = { count: 0, nextReward: 3, boons: 0 };
  const beforeFlow = metaProgress.flowRewards;
  const beforePowerups = state.gems.filter((gem) => gem.kind === "powerup").length;
  const p = state.player;
  ["crab", "reefSquid", "gargoyle"].forEach((id, index) => {
    window.__MONKEY_TIDE_SPAWN_ENEMY(id, p.x + 240 + index * 86, p.y - 70 + index * 44, false);
    const enemy = state.enemies[state.enemies.length - 1];
    markEliteEnemy(enemy, index + 1);
    enemy.hp = 0;
    killEnemy(enemy);
  });
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  render();
  return {
    omen: { ...ensureOmenShards() },
    omenBoons: state.runStats.omenBoons || 0,
    flowRewardsGained: metaProgress.flowRewards - beforeFlow,
    powerupDrops: state.gems.filter((gem) => gem.kind === "powerup").length - beforePowerups,
    omenZones: state.zones.filter((zone) => zone.type === "omenBoon").length,
    debug: window.__MONKEY_TIDE_DEBUG(),
  };
};
window.__MONKEY_TIDE_WEAPON_EVOLUTION_PROBE = () => {
  if (state.phase !== "playing") state.phase = "playing";
  state.weapons.cutlass.level = Math.max(state.weapons.cutlass.level, 5);
  state.weapons.coconut.level = Math.max(state.weapons.coconut.level, 4);
  state.weapons.compass.level = Math.max(state.weapons.compass.level, 4);
  state.weapons.bottle.level = Math.max(state.weapons.bottle.level, 4);
  state.weapons.rope.level = Math.max(state.weapons.rope.level, 4);
  const p = state.player;
  window.__MONKEY_TIDE_SPAWN_ENEMY("crab", p.x + 230, p.y, false);
  window.__MONKEY_TIDE_SPAWN_ENEMY("hand", p.x + 300, p.y + 22, false);
  window.__MONKEY_TIDE_SPAWN_ENEMY("powderImp", p.x + 360, p.y - 28, false);
  slash(0, 214, 86, 84, state.weapons.cutlass.level);
  castSaberTornado(0, state.weapons.cutlass.level, state.weapons.rope.level);
  fireCoconut(state.weapons.coconut.level);
  throwBottle(state.weapons.bottle.level);
  ropeDamage(state.weapons.rope.level);
  render();
  const slashZone = [...state.zones].reverse().find((zone) => zone.type === "slash");
  const tornadoZone = [...state.zones].reverse().find((zone) => zone.type === "saberTornado");
  return {
    assetLoaded: !!images.weaponEvolutionFx,
    slash: slashZone ? { blades: slashZone.blades, level: slashZone.level, radius: slashZone.radius } : null,
    tornado: tornadoZone ? { fused: tornadoZone.fused, radius: tornadoZone.radius, auraLevel: tornadoZone.auraLevel } : null,
    debug: window.__MONKEY_TIDE_DEBUG(),
  };
};
window.__MONKEY_TIDE_SLASH_DIRECTION_PROBE = () => {
  if (state.phase !== "playing") state.phase = "playing";
  const p = state.player;
  const type = enemyType("crab");
  const makeProbeEnemy = (x, y) => ({
    id: cryptoId(),
    type,
    x,
    y,
    hp: 220,
    maxHp: 220,
    r: type.radius * ENEMY_TUNING.hitboxScale,
    speed: 0,
    damage: type.damage,
    row: type.row,
    frameOffset: 0,
    hit: 0,
    boss: false,
    shootTimer: 99,
    actionPulse: 0,
    actionKind: null,
    slashDirectionProbe: true,
  });
  state.enemies = state.enemies.filter((enemy) => !enemy.slashDirectionProbe);
  const front = makeProbeEnemy(p.x + 166, p.y);
  const back = makeProbeEnemy(p.x - 56, p.y);
  state.enemies.push(front, back);
  slash(0, 160, 66, 80, 3);
  render();
  const zone = [...state.zones].reverse().find((entry) => entry.type === "slash");
  const slashSize = zone ? zone.radius * 1.85 : 0;
  return {
    zone: zone ? {
      x: zone.x,
      y: zone.y,
      originX: zone.originX,
      originY: zone.originY,
      forward: zone.forward,
      radius: zone.radius,
      fxBackRatio: zone.fxBackRatio,
      visualStartForward: zone.forward - slashSize * (zone.fxBackRatio ?? CUTLASS_FX_BACK_RATIO),
    } : null,
    frontDamage: front.maxHp - front.hp,
    backDamage: back.maxHp - back.hp,
    frontHit: front.hp < front.maxHp,
    backHit: back.hp < back.maxHp,
  };
};
window.__MONKEY_TIDE_FUSION_RELIC_PROBE = () => {
  if (state.phase !== "playing") state.phase = "playing";
  state.fusionMoments = { seen: new Set(), count: 0 };
  fusionRelicIds.forEach((id) => {
    state.upgradeCounts[id] = Math.max(state.upgradeCounts[id] || 0, 2);
  });
  state.weapons.cutlass.level = Math.max(state.weapons.cutlass.level, 5);
  state.weapons.coconut.level = Math.max(state.weapons.coconut.level, 4);
  state.weapons.compass.level = Math.max(state.weapons.compass.level, 4);
  state.weapons.bottle.level = Math.max(state.weapons.bottle.level, 4);
  state.weapons.rope.level = Math.max(state.weapons.rope.level, 4);
  const p = state.player;
  for (let i = 0; i < 8; i += 1) {
    window.__MONKEY_TIDE_SPAWN_ENEMY(i % 2 ? "hand" : "crab", p.x + 210 + i * 42, p.y - 90 + i * 26, false);
  }
  castSaberTornado(0, state.weapons.cutlass.level, state.weapons.rope.level);
  fireCoconut(state.weapons.coconut.level);
  throwBottle(state.weapons.bottle.level);
  ropeDamage(state.weapons.rope.level);
  updateProjectiles(0.12);
  render();
  const boostedBottleProjectiles = state.projectiles.filter((projectile) => projectile.cometLevel > 0).length;
  const boostedBottleRelicBursts = state.zones.filter((zone) => zone.type === "fusionRelic" && zone.icon === "rumCometLantern").length;
  return {
    assetLoaded: !!images.fusionRelics,
    frames: { ...FUSION_RELIC },
    relicTypes: fusionRelicIds,
    levels: Object.fromEntries(fusionRelicIds.map((id) => [id, fusionRelicLevel(id)])),
    amplifiers: Object.fromEntries(Object.keys(fusionMomentRelicIcon).map((id) => [id, fusionAmplifierFor(id)])),
    relicZones: state.zones.filter((zone) => zone.type === "fusionRelic").map((zone) => zone.icon),
    boostedCoconuts: state.projectiles.filter((projectile) => projectile.stormConch > 0).length,
    boostedBottles: boostedBottleProjectiles + boostedBottleRelicBursts,
    fusionMoments: { count: state.fusionMoments.count, seen: [...state.fusionMoments.seen] },
    debug: window.__MONKEY_TIDE_DEBUG(),
  };
};
window.__MONKEY_TIDE_ROTATION_PROBE = () => {
  const savedElapsed = state.elapsed;
  const savedRotation = state.enemyRotation ? {
    cursor: state.enemyRotation.cursor,
    recent: [...(state.enemyRotation.recent || [])],
  } : null;
  state.elapsed = 0;
  state.enemyRotation = { cursor: 0, recent: [] };
  const openingPool = enemyRotationPool();
  const openingPicks = Array.from({ length: 8 }, () => pickEnemyRotationId());
  state.elapsed = 32;
  const midPool = enemyRotationPool();
  state.elapsed = savedElapsed;
  state.enemyRotation = savedRotation || { cursor: 0, recent: [] };
  return {
    openingPool,
    openingPicks,
    openingUnique: [...new Set(openingPicks)].length,
    midPool,
  };
};
window.__MONKEY_TIDE_MOVEMENT_PROBE = () => {
  const halfStick = tunedStickVector(0.42, 0);
  const nearFullStick = tunedStickVector(CONTROL_TUNING.stickFullAt, 0);
  const baseSpeed = state.stats.speed;
  return {
    baseSpeed,
    dashCooldown: state.stats.dashCooldown,
    dashDuration: CONTROL_TUNING.dashDuration,
    dashBoost: CONTROL_TUNING.dashBoost,
    dashBurstDistance: Math.round(baseSpeed * CONTROL_TUNING.dashBoost * CONTROL_TUNING.dashDuration),
    halfStickSpeed: Math.round(baseSpeed * halfStick.magnitude),
    oneSecondKeyboardDistance: Math.round(baseSpeed),
    cameraCatchup: CONTROL_TUNING.cameraCatchup,
    halfStickMagnitude: Number(halfStick.magnitude.toFixed(3)),
    nearFullStickMagnitude: Number(nearFullStick.magnitude.toFixed(3)),
    tuning: { ...CONTROL_TUNING },
  };
};
window.__MONKEY_TIDE_SIGNATURE_PROBE = (skinId = "ryu") => {
  const savedState = state;
  const savedSkin = selectedSkin;
  const savedMuted = muted;
  selectedSkin = playerSkinMap[skinId] ? skinId : "ryu";
  state = makeState();
  state.phase = "playing";
  state.signatureMove.timer = 0;
  muted = true;
  const p = state.player;
  for (let i = 0; i < 5; i += 1) {
    window.__MONKEY_TIDE_SPAWN_ENEMY("crab", p.x + 210 + i * 58, p.y + (i - 2) * 32, false);
  }
  updateSignatureMove(1 / 60);
  updateProjectiles(0.12);
  const result = {
    skin: state.player.skin,
    signature: state.characterTrait?.signature || null,
    visualRow: signatureWeaponMap[state.characterTrait?.signature?.id]?.row,
    assetLoaded: !!images.signatureWeapons,
    frames: { ...SIGNATURE_WEAPON_FX },
    casts: state.signatureMove.casts,
    last: state.signatureMove.last,
    signatureProjectiles: state.projectiles.filter((projectile) => projectile.type === "signature").length,
    zones: state.zones.filter((zone) => zone.signature).length,
    enemiesDamaged: state.enemies.filter((enemy) => enemy.hp < enemy.maxHp).length,
  };
  state = savedState;
  selectedSkin = savedSkin;
  muted = savedMuted;
  renderSkinPicker();
  render();
  return result;
};
window.__MONKEY_TIDE_RYU_ACTION_PROBE = () => {
  const savedState = state;
  const savedSkin = selectedSkin;
  const savedMuted = muted;
  selectedSkin = "ryu";
  state = makeState();
  state.phase = "playing";
  muted = true;
  const p = state.player;
  for (let i = 0; i < 12; i += 1) {
    window.__MONKEY_TIDE_SPAWN_ENEMY("crab", p.x + 210 + i * 36, p.y + (i % 4 - 1.5) * 36, false);
  }
  state.weapons.cutlass.level = 7;
  for (let i = 0; i < 8; i += 1) fireRyuHadoken(7, 0);
  state.signatureMove.timer = 0;
  for (let i = 0; i < 5; i += 1) castSignatureMove(state.characterTrait.signature);
  updateProjectiles(0.14);
  const cutlassUpgrade = upgrades.find((upgrade) => upgrade.id === "cutlass");
  const result = {
    skin: state.player.skin,
    assetLoaded: !!images.ryuActions,
    source: imageSources.ryuActions,
    frames: { ...RYU_ACTION },
    hadokenFxLoaded: !!images.ryuHadokenFx,
    hadokenFxSource: imageSources.ryuHadokenFx,
    hadokenFxFrames: { ...RYU_HADOKEN_FX },
    rows: Object.fromEntries(Object.keys(RYU_ACTION.rowsByAction).map((action) => [action, ryuActionRow(action)])),
    weaponDisplay: weaponPresentation("cutlass", "ryu"),
    upgradeDisplay: cutlassUpgrade ? upgradePresentation(cutlassUpgrade) : null,
    arsenal: { ...ensureRyuArsenal() },
    hadokenProjectiles: state.projectiles.filter((projectile) => projectile.signatureId === "hadoken").map((projectile) => ({
      stage: projectile.hadokenStage,
      level: projectile.hadokenLevel,
      size: projectile.size,
      radius: projectile.r,
      pierce: projectile.pierce,
      speed: Math.round(Math.hypot(projectile.vx, projectile.vy)),
    })),
    hadokenBursts: state.zones.filter((zone) => zone.type === "ryuHadokenBurst").length,
    slashZones: state.zones.filter((zone) => zone.type === "slash").length,
    ryuZones: state.zones.filter((zone) => zone.type === "ryuStrike" || zone.type === "ryuWhirlwind").map((zone) => ({ type: zone.type, move: zone.move, radius: zone.radius })),
    currentAction: state.playerAction ? { ...state.playerAction, row: ryuActionRow(state.playerAction.type), frame: ryuActionFrame(state.playerAction) } : null,
    enemiesDamaged: state.enemies.filter((enemy) => enemy.hp < enemy.maxHp).length,
    iconStyleUsesHadokenSheet: ["hadoken", "hadoken2", "hadoken3", "hadoken4"].every((icon) => iconStyle(icon).includes(imageSources.ryuHadokenFx)),
  };
  state = savedState;
  selectedSkin = savedSkin;
  muted = savedMuted;
  renderSkinPicker();
  render();
  return result;
};
window.__MONKEY_TIDE_GUILE_ACTION_PROBE = () => {
  const savedState = state;
  const savedSkin = selectedSkin;
  const savedMuted = muted;
  selectedSkin = "guile";
  state = makeState();
  state.phase = "playing";
  muted = true;
  const p = state.player;
  for (let i = 0; i < 10; i += 1) {
    window.__MONKEY_TIDE_SPAWN_ENEMY("crab", p.x + 220 + i * 34, p.y + (i % 3 - 1) * 42, false);
  }
  state.weapons.cutlass.level = 7;
  for (let i = 0; i < 7; i += 1) fireGuileSonicBoom(7, 0);
  updateProjectiles(0.12);
  const cutlassUpgrade = upgrades.find((upgrade) => upgrade.id === "cutlass");
  const result = {
    skin: state.player.skin,
    assetLoaded: !!images.guileActions,
    source: imageSources.guileActions,
    frames: { ...GUILE_ACTION },
    sonicBoomFxLoaded: !!images.sonicBoomFx,
    sonicBoomFxSource: imageSources.sonicBoomFx,
    sonicBoomFrames: { ...SONIC_BOOM_FX },
    rows: Object.fromEntries(Object.keys(GUILE_ACTION.rowsByAction).map((action) => [action, guileActionRow(action)])),
    weaponDisplay: weaponPresentation("cutlass", "guile"),
    upgradeDisplay: cutlassUpgrade ? upgradePresentation(cutlassUpgrade) : null,
    arsenal: { ...state.guileArsenal },
    signatureProjectiles: state.projectiles.filter((projectile) => projectile.signatureId === "sonicBoom").length,
    sonicProjectiles: state.projectiles.filter((projectile) => projectile.signatureId === "sonicBoom").map((projectile) => ({
      stage: projectile.sonicStage,
      level: projectile.sonicLevel,
      size: projectile.size,
      radius: projectile.r,
      pierce: projectile.pierce,
      speed: Math.round(Math.hypot(projectile.vx, projectile.vy)),
    })),
    sonicBursts: state.zones.filter((zone) => zone.type === "sonicBoomBurst").length,
    slashZones: state.zones.filter((zone) => zone.type === "slash").length,
    guileZones: state.zones.filter((zone) => zone.type === "guileStrike" || zone.type === "guileFlashKick").length,
    currentAction: state.playerAction ? { ...state.playerAction, row: guileActionRow(state.playerAction.type), frame: guileActionFrame(state.playerAction) } : null,
  };
  state = savedState;
  selectedSkin = savedSkin;
  muted = savedMuted;
  renderSkinPicker();
  render();
  return result;
};
window.__MONKEY_TIDE_CHUN_LI_ACTION_PROBE = () => {
  const savedState = state;
  const savedSkin = selectedSkin;
  const savedMuted = muted;
  selectedSkin = "chunLi";
  state = makeState();
  state.phase = "playing";
  muted = true;
  const p = state.player;
  for (let i = 0; i < 12; i += 1) {
    window.__MONKEY_TIDE_SPAWN_ENEMY("crab", p.x + 214 + i * 30, p.y + (i % 4 - 1.5) * 36, false);
  }
  state.weapons.cutlass.level = 7;
  for (let i = 0; i < 4; i += 1) castChunLiThousandKick(7, 0);
  state.signatureMove.timer = 0;
  for (let i = 0; i < 5; i += 1) castSignatureMove(state.characterTrait.signature);
  updateProjectiles(0.24);
  const cutlassUpgrade = upgrades.find((upgrade) => upgrade.id === "cutlass");
  const result = {
    skin: state.player.skin,
    assetLoaded: !!images.chunLiActions,
    source: imageSources.chunLiActions,
    frames: { ...CHUN_LI_ACTION },
    projectileAssetLoaded: !!images.chunLiProjectiles,
    projectileSource: imageSources.chunLiProjectiles,
    projectileFrames: { ...CHUN_LI_PROJECTILE_FX },
    rows: Object.fromEntries(Object.keys(CHUN_LI_ACTION.rowsByAction).map((action) => [action, chunLiActionRow(action)])),
    projectileRows: Object.fromEntries(Object.keys(CHUN_LI_PROJECTILE_FX.rowsByFx).map((fx) => [fx, CHUN_LI_PROJECTILE_FX.rowsByFx[fx]])),
    weaponDisplay: weaponPresentation("cutlass", "chunLi"),
    upgradeDisplay: cutlassUpgrade ? upgradePresentation(cutlassUpgrade) : null,
    arsenal: { ...ensureChunLiArsenal() },
    kiKouKenProjectiles: state.projectiles.filter((projectile) => projectile.signatureId === "kiKouKen").map((projectile) => ({
      size: projectile.size,
      radius: projectile.r,
      pierce: projectile.pierce,
      speed: Math.round(Math.hypot(projectile.vx, projectile.vy)),
    })),
    chunLiZones: state.zones.filter((zone) => zone.type === "chunLiKick" || zone.type === "chunLiWhirlwind" || zone.type === "chunLiProjectileBurst").map((zone) => ({ type: zone.type, move: zone.move, fx: zone.fx, radius: zone.radius })),
    slashZones: state.zones.filter((zone) => zone.type === "slash").length,
    currentAction: state.playerAction ? { ...state.playerAction, row: chunLiActionRow(state.playerAction.type), frame: chunLiActionFrame(state.playerAction) } : null,
    enemiesDamaged: state.enemies.filter((enemy) => enemy.hp < enemy.maxHp).length,
    iconStyleUsesProjectileSheet: ["kiKouKen", "thousandKickArc", "whirlwindKickArc"].every((icon) => iconStyle(icon).includes(imageSources.chunLiProjectiles)),
  };
  state = savedState;
  selectedSkin = savedSkin;
  muted = savedMuted;
  renderSkinPicker();
  render();
  return result;
};
window.__MONKEY_TIDE_DEBUG = () => {
  const resized = syncCanvasSize();
  if (resized) render();
  const perf = ensurePerfState();
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
  hudPlayerLabel: ui.playerLabel?.textContent || "",
  playerSkinTypes: playerSkinIds,
  playerSkinAsset: !!images.playerSkins,
  playerSkinAnimationAsset: !!images.playerSkinWalks,
  playerSkinAnimationSource: imageSources.playerSkinWalks,
  playerSkinSelectAsset: !!images.playerSkinSelect,
  fighterSkinAsset: !!images.fighterWalks,
  fighterSkinSelectAsset: !!images.fighterSelect,
  fighterSkinAnimationSource: imageSources.fighterWalks,
  ryuActionAsset: !!images.ryuActions,
  ryuActionSource: imageSources.ryuActions,
  ryuActionFrames: { ...RYU_ACTION },
  ryuHadokenFxAsset: !!images.ryuHadokenFx,
  ryuHadokenFxSource: imageSources.ryuHadokenFx,
  ryuHadokenFxFrames: { ...RYU_HADOKEN_FX },
  guileActionAsset: !!images.guileActions,
  guileActionSource: imageSources.guileActions,
  guileActionFrames: { ...GUILE_ACTION },
  chunLiActionAsset: !!images.chunLiActions,
  chunLiActionSource: imageSources.chunLiActions,
  chunLiActionFrames: { ...CHUN_LI_ACTION },
  chunLiProjectileAsset: !!images.chunLiProjectiles,
  chunLiProjectileSource: imageSources.chunLiProjectiles,
  chunLiProjectileFrames: { ...CHUN_LI_PROJECTILE_FX },
  playerSkinFixedDuoAsset: !!images.samMaxDuo,
  playerSkinDuoWalkAsset: !!images.samMaxDuoWalk,
  playerSkinAnimationFrames: { cols: PLAYER_SKIN_WALK.cols, rows: PLAYER_SKIN_WALK.rows },
  fighterSkinAnimationFrames: { ...FIGHTER_WALK },
  playerSkinDuoWalkFrames: { ...SAM_MAX_DUO_WALK },
  playerSkinAnimated: (playerSkinMap[state.player.skin]?.animRow !== undefined && !!images.playerSkinWalks)
    || (playerSkinMap[state.player.skin]?.animSheet === "samMaxDuoWalk" && !!images.samMaxDuoWalk)
    || (playerSkinMap[state.player.skin]?.animSheet === "fighterWalks" && !!images.fighterWalks)
    || (playerSkinMap[state.player.skin]?.animSheet === "ryuActions" && !!images.ryuActions)
    || (playerSkinMap[state.player.skin]?.animSheet === "guileActions" && !!images.guileActions)
    || (playerSkinMap[state.player.skin]?.animSheet === "chunLiActions" && !!images.chunLiActions),
  playerSkinRenderSheet: playerSkinMap[state.player.skin]?.sheet || "characters",
  playerSkinTrait: { ...(state.characterTrait || characterTrait(state.player.skin)) },
  playerSkinTraits: Object.fromEntries(playerSkinIds.map((id) => [id, characterTrait(id)])),
  signatureMove: state.signatureMove ? {
    ...state.signatureMove,
    ready: state.signatureMove.timer <= 0,
    trait: state.characterTrait?.signature?.id || null,
    label: state.characterTrait?.signature?.label || null,
    asset: !!images.signatureWeapons,
    frames: { ...SIGNATURE_WEAPON_FX },
  } : null,
  playerSkinSourceRects: Object.fromEntries(playerSkinIds.map((id) => {
    const skin = playerSkinMap[id];
    return [id, { x: skin.x, y: skin.y, w: skin.w, h: skin.h, animRow: skin.animRow, animSheet: skin.animSheet, fighterRow: skin.fighterRow, selectIndex: skin.selectIndex, animDrawYOffset: skin.animDrawYOffset }];
  })),
  playerAction: state.playerAction ? { ...state.playerAction } : null,
  ryuArsenal: state.ryuArsenal ? { ...state.ryuArsenal } : null,
  guileArsenal: state.guileArsenal ? { ...state.guileArsenal } : null,
  chunLiArsenal: state.chunLiArsenal ? { ...state.chunLiArsenal } : null,
  stats: { ...state.stats, nextXp: state.nextXp },
  controls: {
    tuning: { ...CONTROL_TUNING },
    dashReady: state.player.dashCooldown <= 0,
    dashActive: state.player.dash > 0,
    halfStickMagnitude: Number(tunedStickVector(0.42, 0).magnitude.toFixed(3)),
  },
  engagement: {
    streak: { ...state.streak },
    pressureWave: state.pressureWave,
    pressureTimer: state.pressureTimer,
    pressureWaves: state.runStats.pressureWaves,
    eliteEnemies: state.enemies.filter((enemy) => enemy.elite).length,
    elitesDefeated: state.runStats.elites,
    omenShards: { ...ensureOmenShards() },
    omenBoons: state.runStats.omenBoons || 0,
    activeUpgradeChoices: activeUpgradeChoices.map((upgrade) => upgrade.id),
    selectedUpgradeIndex,
  },
  map: {
    selected: state.map,
    selectedName: mapVariant(state.map).name,
    selectedBackground: mapVariant(state.map).background,
    selectedMusic: mapMusicProfile(state.map, state.player.skin),
    variants: mapVariants.map((map) => map.id),
    backgrounds: Object.fromEntries(mapVariants.map((map) => [map.id, map.background])),
    cleanSandBackground: imageSources.repeatBeach.includes("clean_hd"),
    musicProfiles: Object.fromEntries(mapVariants.map((map) => [map.id, mapMusicProfile(map.id, null)])),
    skinMusicProfiles: Object.fromEntries(playerSkinIds.map((id) => [id, mapMusicProfile(state.map, id)])),
    unlocked: [...metaProgress.unlockedMaps],
  },
  world: {
    repeatable: true,
    width: WORLD.w,
    height: WORLD.h,
    backgroundTile: WORLD.bgTile,
    backgroundSeamBleed: WORLD_BG_SEAM_BLEED,
    backgroundSourceInset: WORLD_BG_SOURCE_INSET,
    propChunkSize: PROP_CHUNK,
    activePropChunks: state.propChunks?.size || 0,
    immersivePropSpawning: true,
    propSpawnBuffer: spawnSightlineBuffer(),
    propFadeSeconds: PROP_FADE_SECONDS,
    recentVisiblePropSpawns: state.props.filter((prop) => (
      Number.isFinite(prop.createdAt)
      && state.elapsed - prop.createdAt < 0.2
      && isInSpawnSightline(prop.x, prop.y, state, 0)
    )).length,
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
  levelFlow: {
    flowRewards: state.runStats.flowRewards,
    totalFlowRewards: metaProgress.flowRewards,
    rewardTypes: 6,
    choiceLevels: upgradeChoiceLevels(5),
    reducedInterruptions: true,
    xpTuning: { ...XP_TUNING },
    currentNextXp: state.nextXp,
    firstChoiceNextXp: nextLevelXp(XP_TUNING.firstChoiceLevel - 1),
  },
  progression: {
    kills: metaProgress.kills,
    landmarks: metaProgress.landmarks,
    powerups: metaProgress.powerups,
    fusions: metaProgress.fusions,
    flowRewards: metaProgress.flowRewards,
    bestSurvival: metaProgress.bestSurvival,
    achievements: { ...metaProgress.achievements },
    unlockedRelics: [...metaProgress.unlockedRelics],
    coins: metaProgress.coins,
    skills: Object.fromEntries(metaSkillDefinitions.map((skill) => [skill.id, metaSkillLevel(skill.id)])),
    skillBonuses: metaSkillBonuses(),
  },
  upgradeIcons: Object.fromEntries(upgrades.map((upgrade) => [upgrade.id, upgrade.icon])),
  weaponLoadoutIcons: Object.fromEntries(weaponLoadoutItems.map(([id, , icon]) => [id, icon])),
  ropeVisual: { renderMode: "ropeWardSprites", sprite: "ropeRing", pulse: "tidePulse" },
  weaponEvolution: {
    asset: !!images.weaponEvolutionFx,
    frames: { cols: WEAPON_EVOLUTION_FX.cols, rows: WEAPON_EVOLUTION_FX.rows },
    cutlassBlades: cutlassBladeCount(state.weapons.cutlass.level),
    auraStage: auraEvolutionStage(state.weapons.rope.level),
    saberTornadoFusionReady: saberTornadoReady(),
    fusionTypes: {
      saberTornado: saberTornadoReady(),
      starCoconut: coconutCompassReady(),
      grogMaelstrom: bottleRopeReady(),
      moonNet: compassRopeReady(),
    },
    fusionMoments: {
      count: state.fusionMoments?.count || 0,
      seen: [...(state.fusionMoments?.seen || [])],
    },
    fusionRelics: {
      asset: !!images.fusionRelics,
      frames: { ...FUSION_RELIC },
      types: fusionRelicIds,
      levels: Object.fromEntries(fusionRelicIds.map((id) => [id, fusionRelicLevel(id)])),
      totalLevel: fusionRelicTotalLevel(),
      amplifiers: Object.fromEntries(Object.keys(fusionMomentRelicIcon).map((id) => [id, fusionAmplifierFor(id)])),
    },
  },
  uiIconSources: {
    projectileFxIcons: ["coconutBoomerang", "ropeRing"].every((icon) => iconStyle(icon).includes(imageSources.projectileFx)),
    ryuHadokenIcons: ["hadoken", "hadoken2", "hadoken3", "hadoken4"].every((icon) => iconStyle(icon).includes(imageSources.ryuHadokenFx)),
    chunLiProjectileIcons: ["kiKouKen", "thousandKickArc", "whirlwindKickArc"].every((icon) => iconStyle(icon).includes(imageSources.chunLiProjectiles)),
  },
  balance: { ...BALANCE },
  enemyTuning: { ...ENEMY_TUNING },
  enemyVisualReadability: {
    animatedMinimumHeight: ENEMY_TUNING.minAnimatedVisualHeight,
    animatedBoost: ENEMY_TUNING.animatedVisualBoost,
    animatedProjectedHeights: Object.fromEntries(enemyTypes
      .filter((type) => (type.enemyAnim || type.gothicAnim || type.newEnemyAnim || type.timeTentacle) && !type.humanNpc)
      .map((type) => {
        const mockEnemy = {
          type,
          r: type.radius * ENEMY_TUNING.hitboxScale,
          boss: !!type.bossCandidate || type.id === "idol",
          elite: false,
        };
        const sourceHeight = type.timeTentacle ? TIME_TENTACLE_ANIM.h : type.gothicAnim ? GOTHIC_ENEMY_ANIM.h : type.newEnemyAnim ? NEW_ENEMY_TRIO.h : ENEMY_ANIM.h;
        return [type.id, Math.round(sourceHeight * animatedEnemyDrawScale(mockEnemy, sourceHeight))];
      })),
  },
  enemyRoster: {
    activeBossCycle: [...activeBossCycle],
    activeSpawnTypes: pressureWavePool(),
    activeRotationPool: enemyRotationPool(),
    recentRotation: [...(state.enemyRotation?.recent || [])],
    spawnedTypes: [...new Set(state.enemies.map((enemy) => enemy.type.id))],
    humanNpcTypes: enemyTypes.filter((type) => type.humanNpc).map((type) => type.id),
    liveRosterIsMonsterOnly: activeBossCycle.every((id) => !enemyType(id).humanNpc)
      && pressureWavePool().every((id) => !enemyType(id).humanNpc)
      && state.enemies.filter((enemy) => !enemy.boss).every((enemy) => !enemy.type.humanNpc),
  },
  pointer: { active: pointer.active, dx: pointer.dx, dy: pointer.dy },
  scene: { zoom: scene.zoom, w: scene.w, h: scene.h },
  performance: {
    mobile: isMobileLike(),
    dpr,
    enemyCap: enemyCap(),
    enemyRenderBudget: enemyRenderBudget(),
    visibleEnemies: perf.visibleEnemies,
    drawnEnemies: perf.drawnEnemies,
    skippedEnemySprites: perf.skippedEnemySprites,
    trimmedEnemies: perf.trimmedEnemies,
    renderFrameMs: renderFrameMsCap(),
    renderFpsCap: Math.round(1000 / renderFrameMsCap()),
    updateFrameMs: updateFrameMsCap(),
    updateFpsCap: Math.round(1000 / updateFrameMsCap()),
    skippedRenderFrames,
    skippedUpdateFrames,
    stablePropScale: true,
    stablePlayerScale: true,
    propCount: state.props.length,
    projectileCap: projectileCap(),
    particleCap: particleCap(),
    textCap: textCap(),
    lowFx: lowFxMode(),
  },
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
  mobileDisplay: {
    ...mobileDisplayState,
    fullscreenElement: !!document.fullscreenElement,
    screenOrientation: screen.orientation?.type || null,
  },
  preloadedAssetKeys: Object.keys(imageSources),
  loadedImageKeys: [...loadedImageKeys],
  deferredAssets: {
    ...deferredAssetState,
    queuedImages: [...deferredAssetState.queuedImages],
    bootImages: [...deferredAssetState.bootImages],
    bootMusic: [...deferredAssetState.bootMusic],
  },
  loading: { ...loadingState },
  audio: {
    mainVolume: music?.volume ?? 0,
    rushVolume: rushMusic?.volume ?? 0,
    activeTrack: activeMusicTrack,
    armedTrack: armedMusicTrack,
    gestureUnlocked: audioGestureUnlocked,
    soundPoolsPrimed,
    instantStartMode: true,
    lowLatencyNoSeek: LOW_LATENCY_MUSIC_START,
    warmedKeys: [...warmedMusicKeys],
    lastStartLatencyMs: lastMusicStartLatencyMs,
    tracksPlaying: {
      main: isMusicTrackPlaying("main"),
      rush: isMusicTrackPlaying("rush"),
    },
    trackTimes: {
      main: Number(((webMusicTrackTime("main") ?? music?.currentTime ?? 0)).toFixed(2)),
      rush: Number(((webMusicTrackTime("rush") ?? rushMusic?.currentTime ?? 0)).toFixed(2)),
    },
    startReady: {
      main: musicBuffers.has(musicTrackKeys.main) || !music || Math.abs((music.currentTime || 0) - (musicTrackMeta.main?.startAt || 0)) <= 0.35 || activeMusicTrack === "main",
      rush: musicBuffers.has(musicTrackKeys.rush) || !rushMusic || Math.abs((rushMusic.currentTime || 0) - (musicTrackMeta.rush?.startAt || 0)) <= 0.35 || activeMusicTrack === "rush",
    },
    overlapSafe: !isMusicTrackPlaying("main") || !isMusicTrackPlaying("rush") || (music?.volume || 0) === 0 || (rushMusic?.volume || 0) === 0,
    sfx: Object.fromEntries(Object.entries(soundConfig).map(([key, config]) => [key, config.volume])),
    sfxDebug: { ...sfxDebug },
    sfxUnlock: { ...sfxUnlockState },
    sfxEngine: {
      webAudio: !!sfxAudioContext,
      state: sfxAudioContext?.state || null,
      decoded: sfxBuffers.size,
      pending: sfxBufferPromises.size,
    },
    musicEngine: {
      webAudio: !!sfxAudioContext,
      decoded: musicBuffers.size,
      pending: musicBufferPromises.size,
      active: Object.fromEntries(Object.entries(musicWebTracks).map(([slot, track]) => [slot, !!track && !track.stopped])),
    },
    sfxToMusicRatio: Number((Math.max(...Object.values(soundConfig).map((config) => config.volume)) / Math.max(0.01, music?.volume ?? 0, rushMusic?.volume ?? 0)).toFixed(2)),
    sfxLocalDownloads: Object.entries(audioSources)
      .filter(([key]) => !key.startsWith("bgm"))
      .every(([, src]) => src.startsWith("assets/audio/sfx/") && /\.(mp3|wav)$/i.test(src)),
    characterSfxProfiles: Object.fromEntries(playerSkinIds.map((id) => [id, { ...playerSkinMap[id].sfx }])),
    sources: { ...audioSources },
    musicPreload: { ...musicPreloadState },
    music: {
      ...musicConfig,
      ...mapMusicProfile(state.map),
      trackKeys: { ...musicTrackKeys },
      trackMeta: { main: { ...musicTrackMeta.main }, rush: { ...musicTrackMeta.rush } },
      characterThemes: Object.fromEntries(playerSkinIds.map((id) => [id, mapMusicProfile(state.map, id)])),
    },
  },
  speech: {
    supported: speechState.supported,
    voice: speechState.voice ? `${speechState.voice.name} (${speechState.voice.lang})` : null,
    muted,
  },
  crossoverAssets: {
    gothicEnemies: !!images.gothicEnemies,
    gothicEnemiesSource: imageSources.gothicEnemies,
    gothicItems: !!images.gothicItems,
    gothicProps: !!images.gothicProps,
    threeHeadedMonkey: !!images.threeHeadedMonkey,
    blackbeard: !!images.blackbeard,
    threeHeadedMonkeyAnim: !!images.threeHeadedMonkeyAnim,
    blackbeardAnim: !!images.blackbeardAnim,
    timeTentacleAnim: !!images.timeTentacleAnim,
    timeTentacleAnimSource: imageSources.timeTentacleAnim,
    newEnemyTrio: !!images.newEnemyTrio,
    newEnemyTrioSource: imageSources.newEnemyTrio,
    platformerEnemies: !!images.platformerEnemies,
    platformerEnemySource: imageSources.platformerEnemies,
    bossAnimationFrames: {
      threeHeadedMonkey: { ...THREE_HEADED_MONKEY_ANIM },
      blackbeard: { ...BLACKBEARD_ANIM },
      timeTentacle: { ...TIME_TENTACLE_ANIM },
    },
    newEnemyAnimationFrames: { ...NEW_ENEMY_TRIO },
    platformerEnemyAnimationFrames: { ...PLATFORMER_ENEMY_ANIM },
    platformerEnemyTypes: Object.keys(platformerEnemyAnimMap),
    newEnemyTypes: enemyTypes.filter((type) => type.newEnemyAnim).map((type) => type.id),
    enemyAnimSheet: !!images.enemyAnimSheet,
    enemyAnimSource: imageSources.enemyAnimSheet,
    enemyAnimationFrames: { ...ENEMY_ANIM },
    enemyAnimFrameUse: Object.fromEntries(Object.entries(enemyAnimMap).map(([id, anim]) => [id, { row: anim.row, loopFrames: [...anim.loopFrames], attackFrames: [...anim.attackFrames] }])),
    enemyAnimTypes: enemyTypes.filter((type) => type.enemyAnim).map((type) => type.id),
    gothicEnemyAnimSheet: !!images.gothicEnemyAnimSheet,
    gothicEnemyAnimSource: imageSources.gothicEnemyAnimSheet,
    gothicEnemyAnimationFrames: { ...GOTHIC_ENEMY_ANIM },
    gothicEnemyAnimFrameUse: Object.fromEntries(Object.entries(gothicEnemyAnimMap).map(([id, anim]) => [id, { row: anim.row, loopFrames: [...anim.loopFrames], attackFrames: [...anim.attackFrames] }])),
    gothicEnemyAnimTypes: enemyTypes.filter((type) => type.gothicAnim).map((type) => type.id),
    liveSingleFrameFallbackTypes: enemyTypes
      .filter((type) => !type.humanNpc && (type.sprite || type.extraSprite) && !type.enemyAnim)
      .map((type) => type.id),
    gothicEnemyTypes: enemyTypes.filter((type) => type.gothicRow !== undefined).map((type) => type.id),
    gothicPropTypes: Object.keys(gothicPropMap),
    gothicItemTypes: Object.keys(gothicItemMap),
    spectralCaptain: !!images.spectralCaptain,
    bossTypes: enemyTypes.filter((type) => type.sprite === "monkeyIdol" || type.captainSheet || type.bossCandidate).map((type) => type.id),
  },
  extraAssets: {
    extraEnemies: !!images.extraEnemies,
    extraEnemiesSource: imageSources.extraEnemies,
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
    visiblePuddles: state.props.filter((prop) => prop.puddle).length,
    puddleBonusReady: (state.tidePuddleCooldown || 0) <= 0,
    openTreasureUsesDedicatedAsset: beachPropMap.openTreasureChest.image === "beachOpenTreasure" && !!images.beachOpenTreasure,
    discoveredPropsStayPainted: true,
  },
  combatAssets: {
    projectileFx: !!images.projectileFx,
    playerEffects: !!images.playerEffects,
    weaponEvolutionFx: !!images.weaponEvolutionFx,
    fusionRelics: !!images.fusionRelics,
    signatureWeapons: !!images.signatureWeapons,
    sonicBoomFx: !!images.sonicBoomFx,
    ryuActions: !!images.ryuActions,
    ryuHadokenFx: !!images.ryuHadokenFx,
    guileActions: !!images.guileActions,
    chunLiActions: !!images.chunLiActions,
    chunLiProjectiles: !!images.chunLiProjectiles,
    ryuActionFrames: { ...RYU_ACTION },
    ryuHadokenFxFrames: { ...RYU_HADOKEN_FX },
    guileActionFrames: { ...GUILE_ACTION },
    chunLiActionFrames: { ...CHUN_LI_ACTION },
    chunLiProjectileFrames: { ...CHUN_LI_PROJECTILE_FX },
    sonicBoomFrames: { ...SONIC_BOOM_FX },
    signatureWeaponFrames: { ...SIGNATURE_WEAPON_FX },
    signatureWeaponTypes: Object.keys(signatureWeaponMap),
    xpCrystalAnim: !!images.xpCrystalAnim,
    xpCrystalVariants: {
      green: !!images.xpCrystalGreenAnim,
      blue: !!images.xpCrystalAnim,
      red: !!images.xpCrystalRedAnim,
    },
    xpCrystalTierSamples: {
      small: xpCrystalTier({ value: 6 }),
      medium: xpCrystalTier({ value: 18 }),
      large: xpCrystalTier({ value: 46 }),
    },
    xpCrystalAnimationFrames: { ...XP_CRYSTAL_ANIM },
    projectileFxTypes: Object.keys(projectileFxMap),
    chunLiProjectileFxTypes: Object.keys(chunLiProjectileFxMap),
    playerEffectTypes: Object.keys(playerEffectMap),
    weaponEvolutionFxTypes: Object.keys(weaponEvolutionFxMap),
    fusionRelicTypes: fusionRelicIds,
    enemyProjectiles: state.projectiles.filter((projectile) => projectile.type === "curseOrb").length,
    threeHeadedMonkeyVolley: enemyProjectileProfile({ type: enemyType("threeHeadedMonkey"), boss: true })?.count === 3,
    timeTentacleVolley: enemyProjectileProfile({ type: enemyType("tideTentacle"), boss: true })?.count === 3,
    blackbeardBroadside: enemyProjectileProfile({ type: enemyType("blackbeard"), boss: true })?.fx === "ghostCannonball"
      && enemyProjectileProfile({ type: enemyType("blackbeard"), boss: true })?.count === 3,
  },
  weapons: Object.fromEntries(Object.entries(state.weapons).map(([key, value]) => [key, value.level])),
  });
};

boot().catch((error) => {
  ui.loadingText.textContent = "Assets konnten nicht geladen werden";
  console.error(error);
});
