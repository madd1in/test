(() => {
  "use strict";

  const W = 960;
  const H = 540;
  const GRAVITY = 0.68;
  const LONG_ROOM_WIDTH = 1440;
  const LONG_ROOM_HEIGHT = 720;
  const WHIP_SIDE_REACH = 166;
  const WHIP_SIDE_HEIGHT = 86;
  const WHIP_DRAW_W = 206;
  const WHIP_DRAW_H = 78;
  const STORE_KEY = "nocturneReliquarySaveV1";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const dom = {
    hpFill: document.getElementById("hpFill"),
    mpFill: document.getElementById("mpFill"),
    expFill: document.getElementById("expFill"),
    levelChip: document.getElementById("levelChip"),
    heartsChip: document.getElementById("heartsChip"),
    subChip: document.getElementById("subChip"),
    roomName: document.getElementById("roomName"),
    statusLine: document.getElementById("statusLine"),
    titlePanel: document.getElementById("titlePanel"),
    startButton: document.getElementById("startButton"),
    continueButton: document.getElementById("continueButton"),
    loadState: document.getElementById("loadState"),
    pauseButton: document.getElementById("pauseButton"),
    quickSaveButton: document.getElementById("quickSaveButton"),
    mobileButton: document.getElementById("mobileButton"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    mapButton: document.getElementById("mapButton"),
    muteButton: document.getElementById("muteButton"),
    mapPanel: document.getElementById("mapPanel"),
    closeMapButton: document.getElementById("closeMapButton"),
    mapGrid: document.getElementById("mapGrid"),
    miniMap: document.getElementById("miniMap"),
    miniMapGrid: document.getElementById("miniMapGrid"),
    miniMapObjective: document.getElementById("miniMapObjective"),
    relicList: document.getElementById("relicList"),
    objectiveLine: document.getElementById("objectiveLine"),
    sideObjectiveList: document.getElementById("sideObjectiveList"),
    objectiveChip: document.getElementById("objectiveChip"),
    compassChip: document.getElementById("compassChip"),
    statsList: document.getElementById("statsList"),
    title: document.querySelector(".title-inner h1"),
    subtitle: document.querySelector(".title-inner .subtitle"),
    touchControls: document.getElementById("touchControls")
  };

  const IMG = {
    player: "assets/generated/player_sheet_anim.png",
    enemy: "assets/generated/enemy_sheet_clean.png",
    enemyExt: "assets/generated/enemy_imagen_zora_panther_sheet.png",
    enemyQuest: "assets/generated/enemy_imagen_quest_minibosses_sheet_48.png",
    archiveWarden: "assets/generated/enemy_imagen_archive_warden_48f_sheet.png",
    boss: "assets/generated/boss_sheet_hd_32_smooth.png",
    npcStory: "assets/generated/npc_imagen_story_atlas_v1.png",
    projectile: "assets/generated/projectile_sheet.png",
    weaponsHd: "assets/generated/weapons_hd_sheet.png",
    doorsHd: "assets/generated/doors_imagen_hd_sheet_v2.png",
    exitGuides: "assets/generated/ui_imagen_hd_exit_guides.png",
    shrineHd: "assets/generated/props_imagen_hd_reset_shrine.png",
    grottoSpikesHd: "assets/generated/props_imagen_hd_grotto_spikes.png",
    whip: "assets/generated/whip_sheet.png",
    tiles: "assets/generated/tiles_imagen_hd_platforms.png",
    gate: "assets/generated/tile_gate.png",
    chain: "assets/generated/fg_chain.png",
    lamp: "assets/generated/fg_lamp.png",
    armoryProps: "assets/generated/props_imagen_hd_armory_moon_cases.png",
    librarySwitches: "assets/generated/props_imagen_hd_library_switches.png",
    towerProps: "assets/generated/props_imagen_hd_moon_chain_tower.png",
    galleryPortraits: "assets/generated/props_imagen_hd_gallery_portraits.png",
    catacombProps: "assets/generated/props_imagen_hd_bone_bell_catacomb.png",
    titleBg: "assets/generated/bg_imagen_title_screen_hd.png",
    bgGate: "assets/generated/bg_imagen_gate_hd.png",
    midGate: "assets/generated/bg_stage1_mid_tiled.png",
    bgClock: "assets/generated/bg_imagen_clock_hd.png",
    midClock: "assets/generated/bg_stage2_mid_tiled.png",
    bgCrypt: "assets/generated/bg_imagen_crypt_hd.png",
    midCrypt: "assets/generated/bg_stage3_mid_tiled.png",
    bgThrone: "assets/generated/bg_imagen_reliquary_hd.png",
    midThrone: "assets/generated/bg_stage5_mid_tiled.png",
    bgLibrary: "assets/generated/bg_imagen_library_hd.png",
    bgCavern: "assets/generated/bg_imagen_cavern_hd.png",
    bgCavernDepths: "assets/generated/bg_imagen_cavern_depths_hd.png",
    bgBelltower: "assets/generated/bg_imagen_belltower_hd.png",
    bgGarden: "assets/generated/bg_imagen_garden_hd.png",
    bgArchive: "assets/generated/bg_imagen_archive_hd.png",
    bgOssuary: "assets/generated/bg_imagen_ossuary_hd.png",
    bgAqueduct: "assets/generated/bg_imagen_aqueduct_hd.png",
    bgMirrorCloister: "assets/generated/bg_imagen_mirror_cloister_hd_v2.png",
    bgEmberFoundry: "assets/generated/bg_imagen_ember_foundry_hd.png",
    bgMoonwell: "assets/generated/bg_imagen_moonwell_hd.png",
    bgLoft: "assets/generated/bg_imagen_loft_hd.png",
    bgForest: "assets/generated/bg_imagen_forest_opening_hd.png",
    bgCastleGarden: "assets/generated/bg_imagen_castle_garden_hd.png",
    bgArmory: "assets/generated/bg_imagen_armory_hd.png",
    bgGallery: "assets/generated/bg_imagen_gallery_hd.png",
    bgChapel: "assets/generated/bg_imagen_chapel_hd.png",
    bgAntechamber: "assets/generated/bg_imagen_antechamber_hd.png",
    bgSanctum: "assets/generated/bg_imagen_sanctum_hd.png",
    bgCatacomb: "assets/generated/bg_imagen_catacomb_hd_v2.png",
    bgTower: "assets/generated/bg_imagen_tower_hd.png",
    bgObservatory: "assets/generated/bg_imagen_observatory_hd.png",
    paraArches: "assets/generated/para_imagen_arches_hd.png",
    paraMachinery: "assets/generated/para_imagen_machinery_hd.png",
    paraMist: "assets/generated/para_imagen_mist_roses_hd.png",
    paraCrystals: "assets/generated/para_imagen_crystals_hd.png",
    paraCavernSpires: "assets/generated/para_imagen_cavern_spires_hd.png",
    paraCavernMist: "assets/generated/para_imagen_cavern_mist_hd.png",
    paraMirrorWindows: "assets/generated/para_imagen_mirror_windows_hd_v2.png",
    paraEmberChains: "assets/generated/para_imagen_ember_chains_hd.png",
    paraMoonwellRipples: "assets/generated/para_imagen_moonwell_ripples_hd.png",
    paraForest: "assets/generated/para_imagen_forest_canopy_hd.png",
    paraStatues: "assets/generated/para_imagen_castle_statues_hd.png",
    introTiles: "assets/generated/tiles_imagen_intro_props.png",
    itemIcons: "assets/generated/items_imagen_hd.png",
    questIcons: "assets/generated/items_imagen_quest_seals.png",
    portcullis: "assets/generated/sprite_imagen_portcullis.png",
    chests: "assets/generated/props_imagen_hd_treasure_chests_v2.png",
    moatWaterTiles: "assets/generated/tiles_imagen_hd_moat_water_anim.png"
  };

  const AUDIO = {
    explore: "assets/bgm/Cathedral Hunt Overture.mp3",
    clock: "assets/bgm/Moonveil Keep.mp3",
    throne: "assets/bgm/Crimson Cathedral.mp3",
    boss: "assets/bgm/boss_theme.mp3",
    jump: "assets/sfx/jump.ogg",
    land: "assets/sfx/land.ogg",
    whip: "assets/sfx/whip_slash_1.mp3",
    whip2: "assets/sfx/whip_slash_2.mp3",
    hit: "assets/sfx/hit_thunk.wav",
    enemyHit: "assets/sfx/enemy_hit1.ogg",
    enemyDie: "assets/sfx/monster_die.wav",
    pickup: "assets/sfx/pickup_gem.wav",
    heart: "assets/sfx/heart.wav",
    ui: "assets/sfx/ui_confirm.wav",
    gate: "assets/sfx/gate_chime_soft.wav",
    playerHit: "assets/sfx/player_hit.wav",
    dash: "assets/sfx/dash.wav",
    spell: "assets/sfx/spell_impact_chime.wav",
    bossRoar: "assets/sfx/boss_roar_gothic.wav",
    bossDie: "assets/sfx/boss_die.wav"
  };

  const KEYMAP = {
    left: ["ArrowLeft", "KeyA"],
    right: ["ArrowRight", "KeyD"],
    up: ["KeyW", "ArrowUp"],
    down: ["ArrowDown", "KeyS"],
    jump: ["ArrowUp", "Space", "KeyZ"],
    attack: ["KeyJ", "KeyX"],
    spell: ["KeyK", "KeyC"],
    dash: ["KeyL", "ShiftLeft", "ShiftRight"],
    backdash: ["KeyV", "Backslash"],
    subweapon: ["KeyB", "KeyN"],
    map: ["Tab", "KeyI"],
    pause: ["Escape"],
    quickSave: ["F6"],
    mute: ["KeyM"],
    interact: ["KeyE", "Enter"],
    hint: ["KeyH", "Slash"]
  };
  window.__NOCTURNE_INPUT_INFO = {
    jumpKeys: KEYMAP.jump.slice(),
    upKeys: KEYMAP.up.slice(),
    feel: ["jumpBuffer", "downWhipPogo"],
    mobileStart: "manual-fullscreen-button"
  };

  const TILE_SET = "imagen-hd-platforms-v1";
  const TILE_SOURCE_SIZE = 256;
  const INTRO_TILE_SET = "imagen-intro-props-v1";
  const INTRO_TILE_SOURCE_SIZE = 256;
  const ITEM_ICON_SET = "imagen-items-hd-v1";
  const ITEM_ICON_SIZE = 128;
  const WEAPON_ASSET_SET = "hd-subweapons-projectiles-v1";
  const DOOR_ASSET_SET = "imagen-hd-transition-doors-v2";
  const ROOM_PUZZLE_SET = "rune-sequence-gates-v1";
  const WEAPON_ICON_SIZE = 128;
  const DOOR_FRAME_SIZE = 256;
  const SHRINE_FRAME_SIZE = 256;
  const GROTTO_SPIKE_FRAME_SIZE = 256;
  const MOAT_WATER_TILE_SIZE = 256;
  const MOAT_WATER_FRAMES = 4;
  const ENEMY_HP_SCALE = 1.18;
  const ENEMY_DAMAGE_SCALE = 1.2;
  const BOSS_HP_SCALE = 2.35;
  const TILE_DRAW_SIZE = 48;
  const PLATFORM_TILE_CELLS = {
    gold: [0, 0],
    stone: [1, 0],
    blue: [2, 0],
    green: [0, 1],
    red: [1, 1],
    trim: [2, 1]
  };
  const INTRO_TILE_CELLS = {
    forest: [0, 0],
    gardenStone: [1, 0],
    statue: [2, 0],
    portcullis: [3, 0],
    root: [0, 1],
    rose: [1, 1],
    pillar: [2, 1],
    ivy: [3, 1]
  };
  const ITEM_ICON_CELLS = {
    doubleJump: [0, 0],
    dash: [1, 0],
    moonSigil: [2, 0],
    heartVessel: [3, 0],
    familiarBat: [0, 1],
    ringOfArdor: [1, 1],
    batCloak: [2, 1],
    wraithArmor: [3, 1],
    phoenixPendant: [0, 2],
    subAxe: [1, 2],
    subHolyWater: [2, 2],
    subBoomerang: [1, 2],
    heart: [3, 2],
    bigHeart: [3, 2],
    smallHp: [3, 2],
    smallMp: [2, 2]
  };
  const WEAPON_CELLS = {
    dagger: [0, 0],
    axe: [1, 0],
    holyWater: [2, 0],
    boomerang: [3, 0],
    playerProjectile: [4, 0],
    enemyProjectile: [5, 0],
    holyFlame: [6, 0]
  };
  const WEAPON_PICKUP_CELLS = {
    subAxe: "axe",
    subHolyWater: "holyWater",
    subBoomerang: "boomerang"
  };
  const QUEST_ICON_CELLS = {
    tideSeal: [0, 0],
    starSeal: [1, 0],
    inkSeal: [2, 0]
  };
  const QUEST_SEALS = [
    { type: "inkSeal", label: "Ink Seal", room: "archive", roomName: "Moonlit Archives", hint: "push east from the Forgotten Library and break the Archive Warden." },
    { type: "starSeal", label: "Astral Lens", room: "observatory", roomName: "Starfall Observatory", hint: "clear the Bell Loft route into Starfall Observatory." },
    { type: "tideSeal", label: "Tide Sigil", room: "cavernDepths", roomName: "Sapphire Grotto", hint: "drop through Crystal Cavern and defeat the Tide Warden." }
  ];
  const QUEST_SEAL_SITES = {
    inkSeal: { room: "archive", enemyId: "inkWarden1", x: 1160, y: 232 },
    starSeal: { room: "observatory", enemyId: "starWarden1", x: 1186, y: 154 },
    tideSeal: { room: "cavernDepths", enemyId: "tideWarden1", x: 1190, y: 266 }
  };
  const NPC_ATLAS = {
    cols: 4,
    portraitY: 0,
    portraitH: 452,
    spriteY: 452,
    spriteH: 572
  };
  const STORY_NPCS = {
    elys: {
      name: "Elys",
      title: "Lantern Novice",
      col: 0,
      color: "#ffd065",
      lines() {
        return [
          "I kept one lantern lit for you. The castle answers to routes, not straight roads.",
          "If a wall feels too honest, look below it. Rootwound Hollow curls under the garden."
        ];
      }
    },
    vellum: {
      name: "Archivist Vellum",
      title: "Keeper of Broken Indexes",
      col: 1,
      color: "#bfa0ff",
      lines() {
        const seals = questSealProgress();
        return [
          "Veyr split the Reliquary into three witnesses: ink, star, and tide.",
          seals.done
            ? "You carry all three. The chapel door should fear your footsteps now."
            : `You have ${seals.found}/${seals.total}. The next witness waits in ${seals.next.roomName}.`
        ];
      }
    },
    maribel: {
      name: "Sister Maribel",
      title: "Ashen Chapel Votive",
      col: 2,
      color: "#fff0cf",
      lines() {
        if (allQuestSealsClaimed()) {
          return [
            "The seals sing together. Beyond this nave, Lord Veyr has nowhere left to hide.",
            "Do not rush the crimson door. Breathe, save, and make the final rite earn you."
          ];
        }
        return [
          "The chapel moon is false. Veyr hung it here so hunters would mistake light for mercy.",
          "Bring me the three warden seals and the real path will stop pretending to be a wall."
        ];
      }
    },
    nera: {
      name: "Nera",
      title: "Tide Cartographer",
      col: 3,
      color: "#42dfff",
      lines() {
        return [
          "The Moonwell is a knot, not a room. Every drain should leave you somewhere useful.",
          "The Tide Warden hears footfalls through water. Treat that fight like a bell: wait for the ring, then answer."
        ];
      }
    }
  };

  window.__NOCTURNE_TUNING_INFO = {
    roomFlow: "horizontalCamera",
    longRoomWidth: LONG_ROOM_WIDTH,
    longRoomHeight: LONG_ROOM_HEIGHT,
    whipSideReach: WHIP_SIDE_REACH,
    spriteSet: "stable-v4",
    backgroundSet: "imagen-hd-roomfill-v4-room-specific",
    parallaxSet: "imagen-parallax-v1",
    introParallaxSet: "imagen-intro-parallax-v1",
    titleScreenSet: "imagen-title-mode7-parallax-v1",
    mode7Set: "background-stretch-mode7-v1",
    tileSet: TILE_SET,
    introTileSet: INTRO_TILE_SET,
    itemSet: ITEM_ICON_SET,
    tileSourceSize: TILE_SOURCE_SIZE,
    tileDrawSize: TILE_DRAW_SIZE,
    roomSet: "forest-garden-expanded-27-hd-puzzle",
    introSet: "castlevania-drawbridge-v2",
    drawbridgeTileSet: "imagen-existing-root-trim-v1",
    drawbridgeChainSet: "existing-fg-chain-rotated-v1",
    drawbridgeAnchorSet: "imagen-trim-anchor-plates-v1",
    drawbridgePerf: "world-layer-warmed-water-v3",
    cavernSection: "sapphire-grotto-zora-v1",
    grottoMechanic: "moving-water-raft-duck-spikes-v2-hd-assets",
    enemyVisibility: "panther-zora-rim-respawn-v1",
    chestSet: "imagen-hd-treasure-chests-v2",
    weaponSet: WEAPON_ASSET_SET,
    doorSet: DOOR_ASSET_SET,
    exitGuideSet: "imagen-hd-gothic-exit-guides-v1",
    moatWaterSet: "imagen-hd-mode7-parallax-warmed-v3",
    puzzleSet: ROOM_PUZZLE_SET,
    librarySwitchSet: "imagen-hd-library-rune-switches-v1",
    forgePuzzleFlow: "linear-nearby-no-reset-v1",
    shrineSet: "imagen-hd-reset-shrine-v1",
    grottoSpikeSet: "imagen-hd-stalagmite-stalactite-v1",
    armoryProps: "imagen-hd-armory-moon-cases-v1",
    towerGalleryProps: "imagen-hd-moon-chain-gallery-props-v1",
    catacombProps: "imagen-hd-bone-bell-catacomb-props-v1",
    mirrorCloisterSet: "imagen-hd-mirror-cloister-v2",
    questSealRoute: "archive-observatory-grotto-full-boss-v2",
    questSealSet: "imagen-quest-seals-hd-v1",
    enemyFrameMap: "zora-panther-hd-24f-v2+quest-warden-48f-smooth-v1+archive-warden-imagen-hd-48f-v1",
    enemyExtFrames: 24,
    questBossFrames: 48,
    storyNpcSet: "imagen-story-npc-atlas-v1",
    storyRoute: "elys-vellum-maribel-nera-dialogue-v1",
    mapMazeSet: "organic-looped-castle-v2-root-sluice-reservoir",
    bossMilestones: "quest-wardens-full-bossfight-v2",
    mapMode: "cycle-off-mini-full-v1",
    objectiveDoorGuide: "in-world-next-exit-v1",
    accessibilityHud: "low-reading-hud-v1",
    controlSkin: "gothic-medallion-controls-v1",
    mobileTouch: "large-hit-targets-v3-readable-fonts",
    mobileCeilingDoors: "auto-enter-touch-overlap-v1",
    mobileDoorReentryGuard: "block-reverse-door-until-exit-v1",
    mobileFont: "compact-cinzel-v1",
    mobileStartFullscreen: "manual-fs-button-v1",
    progressRoute: "full-castle-survey-v1",
    difficulty: "classic-puzzle-pressure-v1+warden-milestones-v2"
  };

  const SPRITES = {
    playerFrameW: 128,
    playerFrameH: 184,
    playerFrames: 24,
    whipFrameW: 192,
    whipFrameH: 72,
    whipFrames: 8,
    bossFrameW: 320,
    bossFrameH: 256,
    bossFrames: 32,
    enemyExtFrameW: 256,
    enemyExtFrameH: 192,
    enemyExtFrames: 24,
    questBossFrameW: 320,
    questBossFrameH: 256,
    questBossFrames: 48,
    archiveWardenFrameW: 320,
    archiveWardenFrameH: 256,
    archiveWardenFrames: 48,
    chestFrameW: 256,
    chestFrameH: 256,
    chestFrames: 4
  };
  window.__NOCTURNE_FRAME_INFO = SPRITES;

  const ENEMY_TYPES = {
    zombie: { row: 0, hp: 22, w: 42, h: 82, dw: 86, dh: 118, speed: 0.62, damage: 5, ai: "walker" },
    skeleton: { row: 1, hp: 28, w: 42, h: 86, dw: 88, dh: 122, speed: 0.54, damage: 6, ai: "thrower" },
    bat: { row: 2, hp: 16, w: 42, h: 32, dw: 84, dh: 64, speed: 0.98, damage: 5, ai: "flyer" },
    medusa: { row: 3, hp: 22, w: 48, h: 56, dw: 90, dh: 86, speed: 0.9, damage: 6, ai: "sine" },
    bonepillar: { row: 4, hp: 30, w: 34, h: 100, dw: 74, dh: 136, speed: 0, damage: 7, ai: "turret" },
    knight: { row: 5, hp: 44, w: 50, h: 92, dw: 92, dh: 134, speed: 0.48, damage: 8, ai: "guard" },
    phantom: { row: 6, hp: 28, w: 46, h: 78, dw: 86, dh: 128, speed: 0.58, damage: 7, ai: "ghost" },
    gargoyle: { row: 7, hp: 44, w: 58, h: 92, dw: 108, dh: 134, speed: 0.62, damage: 8, ai: "leaper" },
    reaper: { row: 8, hp: 48, w: 54, h: 92, dw: 96, dh: 132, speed: 0.5, damage: 9, ai: "reaper" },
    witch: { row: 9, hp: 34, w: 48, h: 88, dw: 86, dh: 126, speed: 0.34, damage: 7, ai: "witch" },
    boneWraith: { row: 4, hp: 220, w: 64, h: 130, dw: 128, dh: 184, speed: 0.7, damage: 12, ai: "wraith", mini: true, banner: "Bone Wraith", subtitle: "Catacomb Warden" },
    bellWraith: { row: 6, hp: 320, w: 70, h: 134, dw: 134, dh: 188, speed: 0.55, damage: 14, ai: "wraith", mini: true, banner: "Bell Wraith", subtitle: "Tower Sentinel" },
    inkWarden: { row: 2, hp: 760, w: 80, h: 142, dw: 226, dh: 260, speed: 0.78, damage: 20, ai: "wraith", mini: true, fullBoss: true, sprite: "inkWarden", questSeal: "inkSeal", banner: "Archive Warden", subtitle: "Full Seal Boss - Keeper of the Ink Seal" },
    starWarden: { row: 1, hp: 820, w: 80, h: 140, dw: 222, dh: 258, speed: 0.84, damage: 20, ai: "wraith", mini: true, fullBoss: true, sprite: "starWarden", questSeal: "starSeal", banner: "Star Warden", subtitle: "Full Seal Boss - Keeper of the Astral Lens" },
    tideWarden: { row: 0, hp: 880, w: 82, h: 142, dw: 230, dh: 264, speed: 0.9, damage: 21, ai: "wraith", mini: true, fullBoss: true, sprite: "tideWarden", questSeal: "tideSeal", banner: "Tide Warden", subtitle: "Full Seal Boss - Keeper of the Tide Sigil" },
    drowned: { row: 0, hp: 36, w: 44, h: 86, dw: 86, dh: 122, speed: 0.74, damage: 8, ai: "walker" },
    zora: { row: 0, hp: 48, w: 52, h: 84, dw: 150, dh: 178, speed: 0.38, damage: 9, ai: "zora", sprite: "zora", readable: "cyan" },
    blackPanther: { row: 1, hp: 58, w: 88, h: 54, dw: 214, dh: 126, speed: 4.2, damage: 11, ai: "panther", sprite: "blackPanther", readable: "gold" }
  };

  const ENEMY_FRAME_MAP = {
    zora: {
      image: "enemyExt",
      row: 0,
      frameW: 256,
      frameH: 192,
      frames: 24,
      fps: 12,
      idle: [0, 1, 2, 3, 4, 5, 6, 7],
      recover: [8, 9, 10, 11, 12, 13, 14, 15],
      attack: [16, 17, 18, 19, 20, 21, 22, 23]
    },
    blackPanther: {
      image: "enemyExt",
      row: 1,
      frameW: 256,
      frameH: 192,
      frames: 24,
      fps: 18,
      run: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      lunge: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
      recover: [20, 21, 22, 23]
    },
    tideWarden: {
      image: "enemyQuest",
      row: 0,
      frameW: 320,
      frameH: 256,
      frames: 48,
      fps: 12,
      smoothMini: true,
      idle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      idleSmooth: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
      cast: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
      recover: [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47]
    },
    starWarden: {
      image: "enemyQuest",
      row: 1,
      frameW: 320,
      frameH: 256,
      frames: 48,
      fps: 12,
      smoothMini: true,
      idle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      idleSmooth: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
      cast: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
      recover: [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47]
    },
    inkWarden: {
      image: "archiveWarden",
      row: 0,
      frameW: 320,
      frameH: 256,
      frames: 48,
      fps: 14,
      facing: "left",
      idle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      cast: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
      attack: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
      recover: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47]
    }
  };
  window.__NOCTURNE_ENEMY_FRAME_MAP = ENEMY_FRAME_MAP;

  const images = {};
  const keysDown = new Set();
  const justPressed = new Set();
  const touchDown = new Set();
  const swipe = { id: null, startX: 0, startY: 0, lastX: 0, lastY: 0, jumpSent: false };
  let lastTime = 0;
  let activeMusic = null;
  let musicKey = null;
  let cachedVignette = null;
  const drawbridgeRenderCache = { deck: null, chains: new Map(), anchor: null };
  const mode7FloorCache = new Map();
  const roomBackgroundCache = new Map();
  const roomBackgroundWorldCache = new Map();
  const moatWaterRenderCache = new Map();
  const roomSceneryCache = new Map();
  const roomSceneryWorldCache = new Map();
  const chromaCutoutCache = new Map();
  const perfStats = { enabled: false, update: [], draw: [], frame: [] };
  const sfxPool = {};
  const SFX_POOL_SIZE = 3;
  const hudCache = { hp: -1, mp: -1, exp: -1, level: -1, hearts: -1, sub: "", room: "", status: "", objective: "", compass: "" };
  const SUB_LABEL_SHORT = { dagger: "DAG", axe: "AXE", holyWater: "HOLY", boomerang: "BOOM" };

  const game = {
    mode: "loading",
    roomId: "gate",
    room: null,
    enemies: [],
    npcs: [],
    dialogue: null,
    pickups: [],
    projectiles: [],
    particles: [],
    candles: [],
    flames: [],
    damageTexts: [],
    familiar: null,
    boss: null,
    bossBanner: null,
    time: 0,
    titleTime: 0,
    shake: 0,
    cameraX: 0,
    cameraY: 0,
    cameraTargetX: 0,
    cameraTargetY: 0,
    roomTransitionCooldown: 0,
    doorReentryBlock: null,
    lastSafeSpot: null,
    touchJumpHold: 0,
    muted: false,
    mobileMode: false,
    mapMode: "mini",
    paused: false,
    mobileStartFullscreenAttempted: 0,
    mobileStartFullscreenBlocked: false,
    message: "",
    messageTimer: 0,
    loaded: false,
    save: {
      visited: {},
      collected: {},
      killed: {},
      relics: { doubleJump: false, dash: false },
      moonSigil: false,
      questSeals: { inkSeal: false, starSeal: false, tideSeal: false },
      bossDefeated: false,
      maxHp: 112,
      maxMp: 48,
      maxHearts: 99,
      hearts: 20,
      subweapon: "dagger",
      ownedSubweapons: { dagger: true },
      level: 1,
      exp: 0,
      familiar: null,
      equipment: { ringOfArdor: false, batCloak: false, wraithArmor: false, phoenixPendant: false },
      openedChests: {},
      puzzles: {},
      storyFlags: {},
      crits: 0
    }
  };

  const player = {
    x: 100,
    y: 330,
    w: 42,
    h: 116,
    vx: 0,
    vy: 0,
    facing: 1,
    hp: 112,
    maxHp: 112,
    mp: 48,
    maxMp: 48,
    hearts: 20,
    maxHearts: 99,
    onGround: false,
    jumps: 0,
    coyote: 0,
    jumpBuffer: 0,
    attackTimer: 0,
    attackHit: false,
    attackVariant: "side",
    dashTimer: 0,
    dashCooldown: 0,
    backdashTimer: 0,
    backdashCooldown: 0,
    invuln: 0,
    spellCooldown: 0,
    subweaponCooldown: 0,
    subweapon: "dagger",
    level: 1,
    exp: 0,
    baseDamage: 0,
    combo: 0,
    comboTimer: 0,
    score: 0,
    stepWasGrounded: false,
    // Status effects
    poison: 0,
    poisonTick: 0,
    curse: 0,
    slow: 0,
    // Charge attack
    attackHeld: 0,
    chargeReady: false,
    chargeFlash: 0,
    // Charge spell
    spellHeld: 0,
    spellChargeReady: false
  };

  const SUBWEAPONS = {
    dagger: {
      label: "Silver Dagger",
      cost: 5,
      cooldown: 0.32,
      throw(p, facing) {
        return [{
          from: "player", kind: "subweapon", subType: "dagger",
          x: p.x + p.w / 2 + facing * 18,
          y: p.y + 38,
          w: 22, h: 8,
          vx: facing * 11.4, vy: -0.4,
          gravity: 0,
          damage: 14 + p.baseDamage,
          life: 1.4,
          color: "#e6f1ff"
        }];
      }
    },
    axe: {
      label: "War Axe",
      cost: 9,
      cooldown: 0.5,
      throw(p, facing) {
        return [{
          from: "player", kind: "subweapon", subType: "axe",
          x: p.x + p.w / 2 + facing * 12,
          y: p.y + 24,
          w: 24, h: 24,
          vx: facing * 5.4, vy: -8.6,
          gravity: 0.42,
          damage: 22 + p.baseDamage * 2,
          spin: 0,
          life: 2.4,
          color: "#cfa45a"
        }];
      }
    },
    holyWater: {
      label: "Holy Water",
      cost: 12,
      cooldown: 0.6,
      throw(p, facing) {
        return [{
          from: "player", kind: "subweapon", subType: "holyWater",
          x: p.x + p.w / 2 + facing * 6,
          y: p.y + 16,
          w: 16, h: 16,
          vx: facing * 3.2, vy: -5.4,
          gravity: 0.55,
          damage: 6 + p.baseDamage,
          flameOnLand: true,
          life: 2.2,
          color: "#bfe7ff"
        }];
      }
    },
    boomerang: {
      label: "Moon Boomerang",
      cost: 8,
      cooldown: 0.44,
      throw(p, facing) {
        return [{
          from: "player", kind: "subweapon", subType: "boomerang",
          owner: p,
          x: p.x + p.w / 2 + facing * 18,
          y: p.y + 30,
          w: 30, h: 18,
          vx: facing * 8.0, vy: -1.1,
          gravity: 0,
          damage: 16 + p.baseDamage,
          spin: 0,
          returnTimer: 0.42,
          pierce: 4,
          life: 2.3,
          color: "#f7d988"
        }];
      }
    }
  };

  const LEVEL_THRESHOLDS = [0, 60, 160, 320, 560, 900, 1360, 1980, 2780, 3800, 5060, 6600, 8460, 10680, 13320, 16400];
  function xpForLevel(level) {
    if (level <= 1) return 0;
    if (level - 1 < LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[level - 1];
    const last = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    return last + (level - LEVEL_THRESHOLDS.length) * 4200;
  }
  function xpReward(enemy) {
    const base = enemy.cfg ? enemy.cfg.hp : (enemy.maxHp || 20);
    return Math.round(8 + base * 0.85);
  }

  // Derived stats from equipment
  function playerLuck() {
    const eq = (game.save && game.save.equipment) || {};
    return eq.ringOfArdor ? 22 : 0;
  }
  function playerDefense() {
    const eq = (game.save && game.save.equipment) || {};
    return eq.wraithArmor ? 4 : 0;
  }
  function playerJumpScale() {
    const eq = (game.save && game.save.equipment) || {};
    return eq.batCloak ? 1.18 : 1.0;
  }
  function rollCrit() {
    const luck = playerLuck();
    if (luck <= 0) return false;
    return Math.random() < Math.min(0.5, luck / 100);
  }
  function applyCrit(dmg) {
    return Math.round(dmg * 1.7);
  }

  // ===== Status Effects =====
  function applyPoison(seconds) {
    if (game.save.equipment && game.save.equipment.wraithArmor && Math.random() < 0.5) return;
    player.poison = Math.max(player.poison, seconds);
    player.poisonTick = 0;
    message("Poisoned!");
  }
  function applyCurse(seconds) {
    if (game.save.equipment && game.save.equipment.ringOfArdor && Math.random() < 0.4) return;
    player.curse = Math.max(player.curse, seconds);
    message("Cursed: spells sealed!");
  }
  function applySlow(seconds) {
    player.slow = Math.max(player.slow, seconds);
  }
  function cleanseStatus() {
    player.poison = 0;
    player.curse = 0;
    player.slow = 0;
  }
  function tickStatusEffects(dt) {
    if (player.poison > 0) {
      player.poison = Math.max(0, player.poison - dt);
      player.poisonTick -= dt;
      if (player.poisonTick <= 0) {
        player.poisonTick = 0.7;
        const dmg = 2;
        if (player.invuln <= 0) {
          player.hp = Math.max(1, player.hp - dmg);
          spawnDamageText(player.x + player.w / 2, player.y + 22, dmg, "#86d8ff");
          burst(player.x + player.w / 2, player.y + 30, "#7be09a", 4);
        }
      }
    }
    if (player.curse > 0) player.curse = Math.max(0, player.curse - dt);
    if (player.slow > 0) player.slow = Math.max(0, player.slow - dt);
    if (player.chargeFlash > 0) player.chargeFlash = Math.max(0, player.chargeFlash - dt);
  }

  const SURVEY_ROOM_ROUTE = [
    "forest", "rootwound", "courtyard", "armory", "library", "vault", "archive",
    "gate", "moat", "crypt", "catacomb", "ossuary",
    "gallery", "mirrorCloister", "clock", "tower", "belltower", "loft", "observatory",
    "astralSluice", "aqueduct", "moonwell", "tideReservoir", "cavern", "cavernDepths", "garden", "chapel", "antechamber", "emberFoundry", "sanctum"
  ];
  const CHEST_DRAW_W = 92;
  const CHEST_DRAW_H = 70;

  const ROOM_ROUTE_HINTS = {
    forest: "start from the Moonwood path.",
    rootwound: "drop into the root-hollow below Moonwood Verge.",
    courtyard: "cross the drawbridge from Moonwood Verge.",
    armory: "take the upper garden hatch in Castle Garden.",
    library: "go right from the Candlelit Armory or climb up from Gate Hall.",
    vault: "solve the Tome Runes, then climb to the upper Library hatch.",
    archive: "push east from the Forgotten Library.",
    gate: "return through the castle's central hall.",
    moat: "drop through Castle Garden into the culvert.",
    crypt: "go east from the Moat or down from Gate Hall.",
    catacomb: "push east from the Lower Crypt.",
    ossuary: "continue east from the Bone Bell Catacomb.",
    gallery: "head east from Gate Hall.",
    mirrorCloister: "solve the Moon-Mirror-Sun rune order east of the Gallery.",
    clock: "climb the upper exit in the Silver Portrait Gallery.",
    tower: "push right from Clockwork Rise.",
    belltower: "go right from Moon Chain Tower.",
    loft: "ride the belltower route to its right exit.",
    observatory: "continue east from the Bell Loft.",
    astralSluice: "take the star-sluice passage out of Starfall Observatory.",
    aqueduct: "drop down from Starfall Observatory.",
    moonwell: "press the three tide plates beyond the Astral Aqueduct.",
    tideReservoir: "follow the drained lower well beneath Moonwell Tidemaze.",
    cavern: "go left from the Aqueduct or down from the Rose Garden.",
    cavernDepths: "drop through the lower fissure in Crystal Cavern.",
    garden: "climb up from the Cavern or descend from Moon Chain Tower.",
    chapel: "go right from the Drowned Rose Garden.",
    antechamber: "drop through the lower Chapel passage.",
    emberFoundry: "read the forge numerals below the Crimson Antechamber.",
    sanctum: "push right through the Crimson Antechamber."
  };

  function surveyRoomIds() {
    return SURVEY_ROOM_ROUTE.filter((id) => rooms[id]);
  }

  function surveyProgress() {
    const ids = surveyRoomIds();
    let visited = 0;
    let next = null;
    for (const id of ids) {
      if (game.save.visited[id]) visited += 1;
      else if (!next) next = id;
    }
    return { visited, total: ids.length, next, done: !next };
  }

  function allSurveyRoomsVisited() {
    return surveyProgress().done;
  }

  function roomDisplayName(roomId) {
    return rooms[roomId] ? rooms[roomId].name : roomId;
  }

  function roomRouteHint(roomId) {
    return ROOM_ROUTE_HINTS[roomId] || "follow the compass from your current room.";
  }

  function questSealMeta(type) {
    return QUEST_SEALS.find((seal) => seal.type === type) || null;
  }

  function questSealProgress() {
    const owned = game.save.questSeals || {};
    const found = QUEST_SEALS.filter((seal) => owned[seal.type]).length;
    const next = QUEST_SEALS.find((seal) => !owned[seal.type]) || null;
    return { found, total: QUEST_SEALS.length, next, done: found === QUEST_SEALS.length };
  }

  function allQuestSealsClaimed() {
    return questSealProgress().done;
  }

  function questSealLabel(type) {
    const meta = questSealMeta(type);
    return meta ? meta.label : "Reliquary Seal";
  }

  function nextObjective() {
    const s = game.save;
    if (s.bossDefeated) return "Rite broken — explore freely or start a new run.";
    if (!s.visited.gate) {
      if (game.roomId === "forest") return "Leave the Moonwood and follow the lantern path to the castle garden.";
      if (game.roomId === "courtyard") return "Cross the lowered drawbridge before the chains haul it up.";
      return "Reach Gate Hall through the forest approach.";
    }
    const target = nextObjectiveRoom();
    const inTarget = target === game.roomId;
    if (game.room && game.room.puzzle && !puzzleSolved(game.room.puzzle.id)) {
      return `Puzzle: ${game.room.puzzle.label}. Strike the glowing plates in the clue order.`;
    }
    if (s.moonSigil && s.relics.dash) {
      const survey = surveyProgress();
      if (!survey.done) {
        const name = roomDisplayName(survey.next);
        if (survey.next === game.roomId) {
          return `Castle survey ${survey.visited}/${survey.total}: chart ${name}, then follow the next compass step.`;
        }
        return `Castle survey ${survey.visited}/${survey.total}: chart ${name} - ${roomRouteHint(survey.next)}`;
      }
      const seals = questSealProgress();
      if (!seals.done) {
        if (seals.next.room === game.roomId) {
          return `${seals.next.label} is here - defeat its mini-boss and claim the seal.`;
        }
        return `Reliquary seals ${seals.found}/${seals.total}: ${seals.next.label} - ${seals.next.hint}`;
      }
      return "Full survey and all three seals complete. Return to Ashen Chapel - the moon-gate opens to the Crimson Reliquary.";
    }
    if (!s.moonSigil) {
      return inTarget
        ? "Moon Sigil is in this room — follow the golden beacon."
        : "Find the Moon Sigil in the Silver Portrait Gallery (right of Gate Hall).";
    }
    if (!s.relics.dash) {
      return inTarget
        ? "Walk right + HOLD jump (↑/Space) to clear each step. 8 stairs to the gold beacon."
        : "Climb to the Moon Chain Tower for Mist Dash (Gallery → Clockwork Rise → Tower).";
    }
    const seals = questSealProgress();
    if (!seals.done) return `Claim the three Reliquary seals. Next: ${seals.next.label} in ${seals.next.roomName}.`;
    return "Return to Ashen Chapel — the moon-gate now opens to the Crimson Reliquary.";
  }

  function nextObjectiveRoom() {
    const s = game.save;
    if (s.bossDefeated) return null;
    if (!s.visited.gate) return "gate";
    if (!s.moonSigil) return "gallery";
    if (!s.relics.dash) return "tower";
    const survey = surveyProgress();
    if (!survey.done) return survey.next;
    const seals = questSealProgress();
    if (!seals.done) return seals.next.room;
    return "throne";
  }

  // BFS from current room to target via doors. Returns the next door to take.
  function nextHopDoor(targetRoom) {
    if (!targetRoom || targetRoom === game.roomId) return null;
    const visited = new Set([game.roomId]);
    const queue = [];
    for (const door of game.room.doors) {
      queue.push({ roomId: door.to, firstDoor: door });
    }
    while (queue.length) {
      const cur = queue.shift();
      if (visited.has(cur.roomId)) continue;
      visited.add(cur.roomId);
      if (cur.roomId === targetRoom) return cur.firstDoor;
      const r = rooms[cur.roomId];
      if (!r) continue;
      for (const door of r.doors) {
        if (!visited.has(door.to)) {
          queue.push({ roomId: door.to, firstDoor: cur.firstDoor });
        }
      }
    }
    return null;
  }

  function nextObjectiveDoor() {
    const target = nextObjectiveRoom();
    if (!target || target === game.roomId || !game.room) return null;
    return nextHopDoor(target);
  }

  function objectiveDoorDebug() {
    const door = nextObjectiveDoor();
    if (!door) return null;
    return {
      to: door.to,
      side: door.side,
      open: doorOpen(door),
      x: Math.round(door.x),
      y: Math.round(door.y)
    };
  }

  function compassText() {
    const target = nextObjectiveRoom();
    if (!target) return "✓ Done";
    if (target === game.roomId) return "★ HERE";
    const door = nextHopDoor(target);
    if (!door) return `→ ${rooms[target].name}`;
    const arrow = door.side === "left" ? "←" : door.side === "right" ? "→" : door.side === "up" ? "↑" : "↓";
    const next = rooms[door.to] ? rooms[door.to].name : door.to;
    return `${arrow} ${next}`;
  }

  function compassGlyphText() {
    const target = nextObjectiveRoom();
    if (!target) return "OK";
    if (target === game.roomId) return "HERE";
    const door = nextHopDoor(target);
    if (!door) return ">";
    return door.side === "left" ? "<" : door.side === "right" ? ">" : door.side === "up" ? "^" : "v";
  }

  function sideObjectives() {
    const s = game.save;
    const out = [];
    const survey = surveyProgress();
    if (!survey.done) {
      out.push(`Castle survey: ${survey.visited}/${survey.total} rooms. Next: ${roomDisplayName(survey.next)} - ${roomRouteHint(survey.next)}`);
    }
    const seals = questSealProgress();
    if (!seals.done) {
      out.push(`Reliquary seals: ${seals.found}/${seals.total}. Next: ${seals.next.label} - ${seals.next.hint}`);
    }
    if (!s.relics.doubleJump) out.push("Optional: Grave Boots (Triple Moonstep) wait in the Bone Bell Catacomb (Crypt → east).");
    if (!s.collected || !s.collected["garden:bloodRose"]) out.push("Optional: a Blood Rose in the Drowned Rose Garden raises Max HP.");
    if (!s.visited.armory) out.push("Optional: Candlelit Armory links the garden, library, and early loot route.");
    if (!s.visited.moat) out.push("Optional: Moon Moat Culvert opens a lower shortcut toward the crypt.");
    if (!s.visited.observatory) out.push("Optional: Starfall Observatory loops the bell tower back toward the aqueduct.");
    for (const id of ["libraryRunes", "mirrorRunes", "forgeRunes", "tideRunes"]) {
      if (!puzzleSolved(id)) {
        const meta = puzzleMetaById(id);
        if (meta) out.push(`Puzzle: ${meta.puzzle.label} in ${meta.room.name}. Strike the plates in their clue order.`);
      }
    }
    if (s.ownedSubweapons && !s.ownedSubweapons.axe) out.push("Tip: smash candles — rare ones drop the War Axe.");
    if (s.ownedSubweapons && !s.ownedSubweapons.holyWater) out.push("Tip: candles can also drop Holy Water.");
    if (s.ownedSubweapons && !s.ownedSubweapons.boomerang) out.push("Tip: the Moon Boomerang waits in the Mirror Rune Cloister chest.");
    return out;
  }

  function objectiveShort() {
    const s = game.save;
    if (s.bossDefeated) return "Free roam";
    if (!s.visited.gate) return "Next: Castle Gate";
    if (game.room && game.room.puzzle && !puzzleSolved(game.room.puzzle.id)) return `Puzzle: ${game.room.puzzle.label}`;
    if (!s.moonSigil) return "Item: Moon Sigil";
    if (!s.relics.dash) return "Item: Mist Dash";
    const survey = surveyProgress();
    if (!survey.done) return `Map ${survey.visited}/${survey.total}: ${roomDisplayName(survey.next)}`;
    const seals = questSealProgress();
    if (!seals.done) return `Seal ${seals.found + 1}/${seals.total}: ${seals.next.label}`;
    return "Next: Crimson Reliquary";
  }

  function objectiveChipText() {
    const s = game.save;
    if (s.bossDefeated) return "DONE";
    if (!s.visited.gate) return "GATE";
    if (game.room && game.room.puzzle && !puzzleSolved(game.room.puzzle.id)) return "RUNE";
    if (!s.moonSigil) return "SIGIL";
    if (!s.relics.dash) return "DASH";
    const survey = surveyProgress();
    if (!survey.done) return `${survey.visited}/${survey.total}`;
    const seals = questSealProgress();
    if (!seals.done) return `SEAL ${seals.found}/${seals.total}`;
    return "RITE";
  }

  function compactObjectiveLine() {
    const s = game.save;
    if (s.bossDefeated) return "Rite broken";
    if (game.room && game.room.puzzle && !puzzleSolved(game.room.puzzle.id)) return `Rune puzzle: ${game.room.puzzle.label}`;
    const target = nextObjectiveRoom();
    if (!target) return "Explore freely";
    if (target === game.roomId) return "Goal is here";
    return `Next room: ${roomDisplayName(target)}`;
  }

  function compactSideObjectives() {
    const out = [];
    const survey = surveyProgress();
    const seals = questSealProgress();
    if (!survey.done) out.push(`Map ${survey.visited}/${survey.total}`);
    if (!seals.done) out.push(`Seals ${seals.found}/${seals.total}`);
    if (game.room && game.room.puzzle && !puzzleSolved(game.room.puzzle.id)) out.push("Hit runes in order");
    const target = nextObjectiveRoom();
    if (target && target !== game.roomId) out.push(`${compassGlyphText()} exit`);
    return out;
  }

  const rooms = {
    forest: {
      name: "Moonwood Verge",
      grid: [-2, 1],
      bg: "bgForest",
      mid: null,
      outdoor: true,
      para: ["paraForest", "paraMist"],
      music: "explore",
      palette: "green",
      spawn: { x: 96, y: 330 },
      platforms: [
        p(0, 468, 960, 72, "forest"),
        p(140, 392, 170, 28, "root"),
        p(384, 332, 176, 28, "forest")
      ],
      doors: [
        d(922, 340, 38, 120, "courtyard", 54, 330, "right"),
        d(448, 440, 112, 56, "rootwound", 248, 360, "down")
      ],
      enemies: [
        e("batW1", "bat", 384, 228, 260, 560),
        e("zW1", "zombie", 672, 386, 570, 820)
      ],
      items: [
        item("forestHeart", "bigHeart", 492, 300)
      ]
    },
    courtyard: {
      name: "Castle Garden",
      grid: [-1, 1],
      bg: "bgCastleGarden",
      mid: null,
      outdoor: true,
      para: ["paraStatues", "paraMist"],
      music: "explore",
      palette: "green",
      spawn: { x: 80, y: 330 },
      platforms: [
        p(0, 468, 610, 72, "gardenStone"),
        p(580, 468, 380, 72, "gardenStone"),
        p(152, 386, 170, 28, "rose"),
        p(392, 326, 168, 28, "gardenStone"),
        p(300, 260, 150, 24, "rose")
      ],
      doors: [
        d(0, 340, 38, 120, "forest", 1346, 330, "left"),
        d(922, 340, 38, 120, "gate", 54, 330, "right"),
        d(372, 0, 104, 56, "armory", 210, 380, "up"),
        d(244, 440, 104, 56, "moat", 140, 330, "down")
      ],
      enemies: [
        e("knG1", "knight", 456, 376, 320, 700),
        e("gG1", "gargoyle", 760, 214, 620, 980)
      ],
      items: [
        item("gardenWater", "subHolyWater", 654, 296)
      ]
    },
    armory: {
      name: "Candlelit Armory",
      grid: [-1, 0],
      bg: "bgArmory",
      mid: "paraArches",
      music: "explore",
      palette: "gold",
      spawn: { x: 210, y: 380 },
      platforms: [
        p(0, 468, 960, 72, "gold"),
        p(142, 388, 154, 24, "stone"),
        p(342, 326, 156, 24, "gold"),
        p(586, 256, 166, 24, "stone"),
        p(386, 170, 220, 24, "trim")
      ],
      doors: [
        d(190, 440, 110, 56, "courtyard", 420, 120, "down"),
        d(922, 340, 38, 120, "library", 54, 330, "right")
      ],
      enemies: [
        e("arKn1", "knight", 390, 376, 280, 610),
        e("arSk1", "skeleton", 650, 190, 540, 820),
        e("arBat1", "bat", 774, 170, 640, 900)
      ],
      items: [
        item("armoryHearts", "bigHeart", 420, 292)
      ],
      chests: [
        { id: "arm_holywater", x: 690, y: 220, loot: "subHolyWater" }
      ]
    },
    moat: {
      name: "Moon Moat Culvert",
      grid: [-1, 2],
      bg: "bgCavern",
      mid: "midCrypt",
      music: "explore",
      palette: "blue",
      spawn: { x: 140, y: 330 },
      moatWater: { x: 0, y: 394, w: LONG_ROOM_WIDTH, h: 118, tile: "moatWaterTiles", mode7: true, parallax: true },
      platforms: [
        p(0, 468, 960, 72, "blue"),
        p(136, 386, 148, 24, "stone"),
        p(344, 326, 150, 24, "blue"),
        p(568, 268, 156, 24, "stone"),
        p(754, 210, 150, 24, "blue")
      ],
      doors: [
        d(220, 0, 120, 56, "courtyard", 290, 380, "up"),
        d(0, 340, 38, 120, "rootwound", 1346, 360, "left"),
        d(922, 340, 38, 120, "crypt", 54, 330, "right")
      ],
      enemies: [
        e("moDr1", "drowned", 232, 372, 120, 420),
        e("moMed1", "medusa", 536, 222, 430, 760),
        e("moBat1", "bat", 788, 172, 660, 920)
      ],
      items: [
        item("moatCache", "smallMp", 778, 178)
      ],
      chests: [
        { id: "moat_mana", x: 612, y: 232, loot: "manaPool" }
      ]
    },
    rootwound: {
      name: "Rootwound Hollow",
      grid: [-3, 2],
      bg: "bgCavern",
      mid: "paraMist",
      para: ["paraForest", "paraCavernMist"],
      music: "explore",
      palette: "green",
      spawn: { x: 248, y: 360 },
      organic: "roots",
      platforms: [
        p(0, 468, 960, 72, "green"),
        p(122, 396, 168, 24, "root"),
        p(342, 336, 148, 24, "green"),
        p(550, 286, 156, 24, "stone"),
        p(748, 230, 146, 24, "root"),
        p(384, 164, 204, 22, "trim")
      ],
      doors: [
        d(250, 0, 110, 56, "forest", 504, 382, "up"),
        d(922, 340, 38, 120, "moat", 54, 330, "right"),
        d(430, 440, 112, 56, "vault", 170, 360, "down", "puzzle:libraryRunes")
      ],
      enemies: [
        e("rwZ1", "zombie", 238, 384, 120, 430),
        e("rwBat1", "bat", 520, 210, 410, 700),
        e("rwPh1", "phantom", 812, 180, 700, 980)
      ],
      items: [
        item("rootwoundCache", "smallMp", 812, 196)
      ],
      chests: [
        { id: "rootwound_hearts", x: 1010, y: 276, loot: "heartCache" }
      ]
    },
    gate: {
      name: "Gate Hall",
      grid: [0, 1],
      bg: "bgGate",
      mid: "midGate",
      outdoor: true,
      music: "explore",
      palette: "gold",
      spawn: { x: 100, y: 330 },
      platforms: [
        p(0, 468, 960, 72, "gold"),
        p(146, 374, 190, 32, "gold"),
        p(460, 326, 210, 32, "stone"),
        p(710, 250, 132, 28, "stone"),
        p(386, 156, 120, 24, "trim")
      ],
      doors: [
        d(0, 340, 38, 120, "courtyard", 1346, 330, "left"),
        d(922, 340, 38, 120, "gallery", 54, 330, "right"),
        d(424, 460, 112, 30, "crypt", 462, 72, "down"),
        d(180, 100, 100, 56, "library", 200, 380, "up")
      ],
      enemies: [
        e("z1", "zombie", 602, 386, 510, 760),
        e("bat1", "bat", 720, 195, 650, 850),
        e("gatePanther1", "blackPanther", 520, 414, 410, 560)
      ],
      items: [
        item("ringOfArdor", "ringOfArdor", 416, 130)
      ]
    },
    gallery: {
      name: "Silver Portrait Gallery",
      grid: [1, 1],
      bg: "bgGallery",
      mid: "paraArches",
      music: "explore",
      palette: "red",
      spawn: { x: 80, y: 330 },
      platforms: [
        p(0, 468, 960, 72, "red"),
        p(112, 382, 172, 28, "red"),
        p(360, 318, 172, 28, "stone"),
        p(606, 268, 190, 28, "stone"),
        p(384, 124, 176, 24, "trim")
      ],
      doors: [
        d(0, 340, 38, 120, "gate", 856, 330, "left"),
        d(922, 340, 38, 120, "mirrorCloister", 54, 330, "right"),
        d(430, 82, 100, 60, "clock", 448, 382, "up")
      ],
      enemies: [
        e("sk1", "skeleton", 388, 232, 330, 575),
        e("med1", "medusa", 640, 205, 580, 805),
        e("kn1", "knight", 754, 376, 650, 875)
      ],
      items: [
        item("moonSigil", "moonSigil", 668, 226)
      ]
    },
    mirrorCloister: {
      name: "Mirror Rune Cloister",
      grid: [2, 0],
      bg: "bgMirrorCloister",
      mid: null,
      para: ["paraMirrorWindows", "paraMist"],
      music: "explore",
      palette: "blue",
      spawn: { x: 80, y: 330 },
      platforms: [
        p(0, 468, 960, 72, "blue"),
        p(120, 386, 150, 28, "stone"),
        p(340, 330, 150, 28, "blue"),
        p(566, 276, 150, 28, "stone"),
        p(760, 210, 132, 28, "blue"),
        p(382, 154, 184, 24, "trim")
      ],
      doors: [
        d(0, 340, 38, 120, "gallery", 856, 330, "left"),
        d(922, 340, 38, 120, "chapel", 54, 330, "right", "puzzle:mirrorRunes")
      ],
      puzzle: {
        id: "mirrorRunes",
        label: "Mirror Runes",
        sequence: [1, 0, 2],
        solvedMessage: "The chapel mirror opens.",
        switches: [
          { x: 172, y: 350, glyph: "Moon", color: "#8bd7ff" },
          { x: 466, y: 294, glyph: "Mirror", color: "#fff0cf" },
          { x: 784, y: 174, glyph: "Sun", color: "#ffd065" }
        ]
      },
      enemies: [
        e("mc1", "phantom", 358, 246, 260, 560),
        e("mc2", "medusa", 640, 206, 560, 830),
        e("mc3", "witch", 788, 126, 700, 900)
      ],
      chests: [
        { id: "mirror_boomerang", x: 780, y: 432, loot: "subBoomerang" }
      ],
      items: []
    },
    chapel: {
      name: "Ashen Chapel",
      grid: [2, 1],
      bg: "bgChapel",
      mid: "paraArches",
      music: "throne",
      palette: "blue",
      spawn: { x: 80, y: 330 },
      platforms: [
        p(0, 468, 960, 72, "blue"),
        p(112, 354, 158, 28, "blue"),
        p(320, 288, 162, 28, "stone"),
        p(568, 226, 160, 28, "stone"),
        p(696, 368, 116, 28, "trim")
      ],
      doors: [
        d(0, 340, 38, 120, "mirrorCloister", 856, 330, "left"),
        d(922, 320, 38, 140, "throne", 68, 326, "right", "moonGate"),
        d(438, 0, 96, 56, "garden", 460, 372, "up"),
        d(220, 440, 100, 56, "antechamber", 80, 380, "down")
      ],
      enemies: [
        e("ph1", "phantom", 450, 216, 370, 650),
        e("bp1", "bonepillar", 740, 268, 700, 780),
        e("wi1", "witch", 235, 378, 110, 350)
      ],
      items: [
        item("nightBat", "familiarBat", 600, 200)
      ]
    },
    antechamber: {
      name: "Crimson Antechamber",
      grid: [2, 3],
      bg: "bgAntechamber",
      mid: "paraArches",
      music: "throne",
      palette: "red",
      spawn: { x: 80, y: 330 },
      platforms: [
        p(0, 468, 960, 72, "red"),
        p(120, 384, 140, 28, "red"),
        p(330, 320, 140, 28, "stone"),
        p(540, 256, 140, 28, "red"),
        p(750, 200, 140, 28, "stone"),
        p(370, 140, 200, 24, "trim"),
        p(180, 220, 110, 22, "stone"),
        p(190, 160, 130, 22, "trim")
      ],
      doors: [
        d(180, 100, 100, 56, "chapel", 248, 380, "up"),
        d(922, 340, 38, 120, "sanctum", 60, 330, "right", "puzzle:forgeRunes"),
        d(430, 440, 100, 56, "emberFoundry", 160, 360, "down")
      ],
      enemies: [
        e("kn3", "knight", 240, 376, 130, 460),
        e("ph5", "phantom", 540, 232, 430, 730),
        e("r3", "reaper", 760, 132, 660, 880)
      ],
      items: []
    },
    emberFoundry: {
      name: "Ember Gear Foundry",
      grid: [2, 4],
      bg: "bgEmberFoundry",
      mid: "paraEmberChains",
      para: ["paraEmberChains", "paraArches"],
      music: "throne",
      palette: "red",
      spawn: { x: 160, y: 360 },
      platforms: [
        p(0, 468, 960, 72, "red"),
        p(126, 396, 150, 28, "stone"),
        p(352, 336, 154, 28, "red"),
        p(602, 282, 154, 28, "stone"),
        p(746, 214, 146, 28, "red"),
        p(274, 162, 210, 24, "trim")
      ],
      doors: [
        d(430, 0, 100, 56, "antechamber", 454, 360, "up")
      ],
      puzzle: {
        id: "forgeRunes",
        label: "Forge Numerals",
        sequence: [0, 1, 2],
        forgiving: true,
        solvedMessage: "The sanctum bolts cool and release. Return upward, then push right.",
        switches: [
          { x: 220, y: 360, glyph: "I", color: "#ffd065" },
          { x: 370, y: 330, glyph: "II", color: "#ff7a4f" },
          { x: 520, y: 360, glyph: "III", color: "#fff0cf" }
        ]
      },
      enemies: [
        e("ef1", "bonepillar", 398, 236, 340, 470),
        e("ef2", "knight", 642, 376, 570, 760),
        e("ef3", "reaper", 796, 142, 700, 900)
      ],
      chests: [
        { id: "foundry_cache", x: 330, y: 432, loot: "heartCache" }
      ],
      items: []
    },
    vault: {
      name: "Forgotten Vault",
      grid: [-2, 2],
      bg: "bgArchive",
      mid: null,
      music: "explore",
      palette: "gold",
      spawn: { x: 80, y: 330 },
      platforms: [
        p(0, 468, 960, 72, "gold"),
        p(140, 384, 130, 22, "gold"),
        p(330, 320, 130, 22, "stone"),
        p(540, 256, 130, 22, "gold"),
        p(360, 168, 200, 24, "trim")
      ],
      doors: [
        d(0, 340, 38, 120, "library", 1346, 380, "left")
      ],
      enemies: [
        e("vk1", "knight", 380, 376, 280, 600),
        e("vp1", "phantom", 600, 232, 480, 800)
      ],
      items: [
        item("vaultHeart", "heartVessel", 460, 132)
      ],
      chests: [
        { id: "vault_axe_chest", x: 700, y: 432, loot: "subAxe" },
        { id: "vault_heart_chest", x: 760, y: 432, loot: "heartCache" }
      ]
    },
    sanctum: {
      name: "Drowned Sanctum",
      grid: [3, 3],
      bg: "bgSanctum",
      mid: "paraCavernMist",
      music: "explore",
      palette: "blue",
      spawn: { x: 60, y: 330 },
      platforms: [
        p(0, 468, 960, 72, "blue"),
        p(110, 388, 140, 22, "blue"),
        p(280, 348, 130, 22, "stone"),
        p(440, 300, 130, 22, "blue"),
        p(600, 252, 130, 22, "stone"),
        p(760, 204, 130, 22, "blue"),
        p(380, 152, 200, 24, "trim"),
        p(900, 158, 90, 22, "stone")
      ],
      doors: [
        d(0, 340, 38, 120, "antechamber", 856, 326, "left"),
        d(430, 440, 100, 56, "tideReservoir", 1346, 330, "down", "puzzle:tideRunes")
      ],
      enemies: [
        e("dr1", "drowned", 240, 372, 110, 420),
        e("dr2", "drowned", 600, 372, 460, 820),
        e("med5", "medusa", 580, 198, 460, 800),
        e("bat5", "bat", 820, 218, 700, 920)
      ],
      items: [
        item("sanctRose", "heartVessel", 460, 116)
      ]
    },
    throne: {
      name: "Crimson Reliquary",
      grid: [3, 1],
      bg: "bgThrone",
      mid: "midThrone",
      music: "boss",
      palette: "red",
      spawn: { x: 80, y: 326 },
      platforms: [
        p(0, 468, 960, 72, "red"),
        p(122, 356, 150, 28, "stone"),
        p(688, 356, 150, 28, "stone")
      ],
      doors: [
        d(0, 320, 38, 140, "chapel", 850, 330, "left")
      ],
      enemies: [],
      items: [],
      boss: true
    },
    crypt: {
      name: "Lower Crypt",
      grid: [0, 2],
      bg: "bgCrypt",
      mid: "midCrypt",
      music: "explore",
      palette: "green",
      spawn: { x: 462, y: 72 },
      platforms: [
        p(0, 468, 960, 72, "green"),
        p(360, 150, 214, 28, "stone"),
        p(92, 306, 170, 28, "green"),
        p(656, 334, 190, 28, "green")
      ],
      doors: [
        d(0, 340, 38, 120, "moat", 1346, 330, "left"),
        d(422, 0, 116, 54, "gate", 456, 336, "up"),
        d(922, 340, 38, 120, "catacomb", 54, 330, "right")
      ],
      enemies: [
        e("z2", "zombie", 150, 386, 80, 290),
        e("sk2", "skeleton", 704, 250, 620, 870),
        e("bp2", "bonepillar", 472, 50, 420, 520)
      ],
      items: []
    },
    catacomb: {
      name: "Bone Bell Catacomb",
      grid: [1, 2],
      bg: "bgCatacomb",
      mid: "paraMist",
      music: "explore",
      palette: "green",
      spawn: { x: 80, y: 330 },
      platforms: [
        p(0, 468, 960, 72, "green"),
        p(188, 374, 154, 28, "green"),
        p(446, 292, 156, 28, "stone"),
        p(700, 214, 142, 28, "stone")
      ],
      doors: [
        d(0, 340, 38, 120, "crypt", 856, 330, "left"),
        d(922, 340, 38, 120, "ossuary", 54, 330, "right")
      ],
      enemies: [
        e("sk3", "skeleton", 230, 290, 160, 380),
        e("bw1", "boneWraith", 520, 200, 380, 740),
        e("r1", "reaper", 735, 118, 680, 870)
      ],
      items: [
        item("graveBoots", "doubleJump", 766, 170),
        item("batCloak", "batCloak", 240, 340)
      ]
    },
    ossuary: {
      name: "Saint's Ossuary",
      grid: [1, 3],
      bg: "bgOssuary",
      mid: "midCrypt",
      music: "explore",
      palette: "green",
      spawn: { x: 80, y: 330 },
      platforms: [
        p(0, 468, 960, 72, "green"),
        p(122, 382, 156, 28, "stone"),
        p(346, 312, 160, 28, "green"),
        p(596, 244, 174, 28, "stone"),
        p(720, 142, 150, 24, "trim")
      ],
      doors: [
        d(0, 340, 38, 120, "catacomb", 856, 330, "left")
      ],
      enemies: [
        e("sk6", "skeleton", 210, 298, 120, 380),
        e("bp4", "bonepillar", 646, 144, 560, 760),
        e("bw3", "boneWraith", 808, 232, 700, 900)
      ],
      items: [
        item("ossuaryRelic", "bigHeart", 752, 112)
      ]
    },
    clock: {
      name: "Clockwork Rise",
      grid: [1, 0],
      bg: "bgClock",
      mid: "midClock",
      music: "clock",
      palette: "blue",
      spawn: { x: 448, y: 382 },
      platforms: [
        p(0, 468, 960, 72, "blue"),
        p(114, 386, 150, 28, "blue"),
        p(328, 312, 146, 28, "stone"),
        p(544, 238, 150, 28, "stone"),
        p(770, 154, 150, 28, "blue")
      ],
      doors: [
        d(430, 440, 100, 56, "gallery", 470, 72, "down"),
        d(922, 72, 38, 118, "tower", 60, 112, "right")
      ],
      enemies: [
        e("bat2", "bat", 214, 300, 120, 360),
        e("med2", "medusa", 510, 190, 430, 720),
        e("wi2", "witch", 790, 66, 720, 900)
      ],
      items: [
        item("wraithArmor", "wraithArmor", 552, 210)
      ]
    },
    tower: {
      name: "Moon Chain Tower",
      grid: [2, 0],
      bg: "bgTower",
      mid: "paraMachinery",
      music: "clock",
      palette: "gold",
      spawn: { x: 60, y: 112 },
      platforms: [
        p(0, 468, 960, 72, "gold"),
        p(48, 202, 152, 28, "stone"),
        p(300, 310, 154, 28, "gold"),
        p(518, 226, 146, 28, "stone"),
        p(720, 138, 150, 28, "gold")
      ],
      doors: [
        d(0, 70, 38, 122, "clock", 850, 88, "left"),
        d(430, 440, 100, 56, "garden", 480, 70, "down"),
        d(922, 320, 38, 140, "belltower", 60, 360, "right")
      ],
      enemies: [
        e("bat3", "bat", 620, 156, 500, 760),
        e("ph2", "phantom", 320, 240, 250, 510),
        e("kn2", "knight", 748, 376, 680, 900)
      ],
      items: [
        item("mistDash", "dash", 772, 96)
      ]
    },
    garden: {
      name: "Drowned Rose Garden",
      grid: [2, 2],
      bg: "bgGarden",
      mid: "midGate",
      outdoor: true,
      music: "explore",
      palette: "green",
      spawn: { x: 480, y: 70 },
      platforms: [
        p(0, 468, 960, 72, "green"),
        p(110, 386, 156, 28, "green"),
        p(348, 316, 160, 28, "stone"),
        p(618, 256, 170, 28, "green")
      ],
      doors: [
        d(430, 0, 100, 56, "tower", 454, 384, "up"),
        d(922, 340, 38, 120, "chapel", 74, 330, "right"),
        d(220, 440, 100, 56, "cavern", 180, 80, "down")
      ],
      enemies: [
        e("z3", "zombie", 154, 302, 80, 300),
        e("g2", "gargoyle", 440, 222, 330, 610),
        e("med3", "medusa", 675, 198, 600, 830)
      ],
      items: [
        item("bloodRose", "heartVessel", 682, 214)
      ]
    },
    library: {
      name: "Forgotten Library",
      grid: [0, 0],
      bg: "bgLibrary",
      mid: "midGate",
      music: "explore",
      palette: "gold",
      spawn: { x: 200, y: 380 },
      platforms: [
        p(0, 468, 960, 72, "gold"),
        p(120, 384, 160, 28, "stone"),
        p(360, 320, 160, 28, "gold"),
        p(610, 260, 160, 28, "stone"),
        p(380, 180, 200, 24, "trim")
      ],
      doors: [
        d(190, 440, 100, 56, "gate", 462, 380, "down"),
        d(0, 340, 38, 120, "armory", 1346, 330, "left"),
        d(922, 340, 38, 120, "archive", 54, 330, "right"),
        d(430, 96, 96, 64, "vault", 80, 380, "up", "puzzle:libraryRunes")
      ],
      puzzle: {
        id: "libraryRunes",
        label: "Tome Runes",
        sequence: [0, 1, 2],
        solvedMessage: "The vault hatch above the upper shelf unlocks.",
        switches: [
          { x: 182, y: 348, glyph: "I", color: "#f4d38b" },
          { x: 432, y: 284, glyph: "II", color: "#8bd7ff" },
          { x: 704, y: 224, glyph: "III", color: "#bfa0ff" }
        ]
      },
      enemies: [
        e("sk4", "skeleton", 200, 296, 130, 380),
        e("wi3", "witch", 480, 232, 380, 700),
        e("bp3", "bonepillar", 730, 196, 690, 800)
      ],
      items: [
        item("librRose", "heartVessel", 460, 144)
      ]
    },
    archive: {
      name: "Moonlit Archives",
      grid: [0, 3],
      bg: "bgArchive",
      mid: "midGate",
      music: "explore",
      palette: "gold",
      spawn: { x: 80, y: 330 },
      platforms: [
        p(0, 468, 960, 72, "gold"),
        p(120, 392, 152, 28, "stone"),
        p(362, 326, 180, 28, "gold"),
        p(628, 260, 166, 28, "stone"),
        p(430, 162, 190, 24, "trim")
      ],
      doors: [
        d(0, 340, 38, 120, "library", 856, 330, "left")
      ],
      enemies: [
        e("sk5", "skeleton", 218, 306, 120, 420),
        e("wi4", "witch", 522, 238, 400, 730),
        e("ph5", "phantom", 754, 188, 650, 900),
        e("inkWarden1", "inkWarden", 760, 204, 610, 900)
      ],
      items: [
        item("archiveMoon", "bigHeart", 506, 126)
      ]
    },
    belltower: {
      name: "Sunken Belltower",
      grid: [3, 0],
      bg: "bgBelltower",
      mid: "midClock",
      music: "clock",
      palette: "gold",
      spawn: { x: 60, y: 360 },
      platforms: [
        p(0, 468, 960, 72, "gold"),
        p(140, 388, 130, 22, "stone"),
        p(310, 332, 130, 22, "gold"),
        p(480, 276, 130, 22, "stone"),
        p(650, 224, 130, 22, "gold"),
        p(290, 156, 200, 24, "trim")
      ],
      doors: [
        d(0, 320, 38, 140, "tower", 1346, 360, "left"),
        d(922, 320, 38, 140, "loft", 54, 360, "right")
      ],
      enemies: [
        e("bw2", "bellWraith", 540, 200, 220, 800),
        e("bat4", "bat", 220, 230, 140, 460),
        e("ph3", "phantom", 760, 180, 610, 880)
      ],
      items: [
        item("bellRose", "heartVessel", 372, 124)
      ]
    },
    loft: {
      name: "Star Bell Loft",
      grid: [4, 0],
      bg: "bgLoft",
      mid: "midClock",
      music: "clock",
      palette: "gold",
      spawn: { x: 80, y: 360 },
      platforms: [
        p(0, 468, 960, 72, "gold"),
        p(140, 392, 142, 24, "stone"),
        p(346, 322, 150, 24, "gold"),
        p(578, 246, 154, 24, "stone"),
        p(772, 172, 138, 24, "trim")
      ],
      doors: [
        d(0, 320, 38, 140, "belltower", 1346, 360, "left"),
        d(922, 320, 38, 140, "observatory", 54, 360, "right")
      ],
      enemies: [
        e("bat5", "bat", 246, 260, 140, 500),
        e("ph6", "phantom", 560, 176, 430, 760),
        e("g4", "gargoyle", 822, 88, 720, 910)
      ],
      items: [
        item("loftCache", "smallMp", 804, 140)
      ]
    },
    observatory: {
      name: "Starfall Observatory",
      grid: [5, 0],
      bg: "bgObservatory",
      mid: "paraMoonwellRipples",
      music: "clock",
      palette: "blue",
      spawn: { x: 80, y: 360 },
      platforms: [
        p(0, 468, 960, 72, "blue"),
        p(132, 390, 150, 24, "stone"),
        p(346, 322, 156, 24, "blue"),
        p(560, 254, 160, 24, "stone"),
        p(774, 184, 146, 24, "trim"),
        p(380, 126, 210, 22, "gold")
      ],
      doors: [
        d(0, 320, 38, 140, "loft", 1346, 360, "left"),
        d(922, 320, 38, 140, "astralSluice", 54, 330, "right"),
        d(430, 440, 100, 56, "aqueduct", 456, 92, "down")
      ],
      enemies: [
        e("obWi1", "witch", 490, 210, 350, 720),
        e("obPh1", "phantom", 720, 138, 580, 900),
        e("obG1", "gargoyle", 880, 92, 760, 980),
        e("starWarden1", "starWarden", 780, 128, 650, 940)
      ],
      items: [
        item("starBellShard", "bigHeart", 820, 148)
      ],
      chests: [
        { id: "obs_heart", x: 480, y: 90, loot: "heartCache" }
      ]
    },
    astralSluice: {
      name: "Astral Sluice",
      grid: [5, 1],
      bg: "bgAqueduct",
      mid: "paraMoonwellRipples",
      para: ["paraMoonwellRipples", "paraCrystals"],
      music: "clock",
      palette: "blue",
      spawn: { x: 80, y: 330 },
      organic: "sluice",
      platforms: [
        p(0, 468, 960, 72, "blue"),
        p(96, 402, 168, 24, "stone"),
        p(294, 350, 138, 22, "blue"),
        p(486, 286, 164, 24, "stone"),
        p(702, 220, 140, 22, "blue"),
        p(324, 144, 222, 22, "trim")
      ],
      doors: [
        d(0, 320, 38, 140, "observatory", 1346, 360, "left"),
        d(434, 0, 100, 56, "observatory", 474, 376, "up"),
        d(922, 320, 38, 140, "moonwell", 60, 330, "right"),
        d(584, 440, 112, 56, "moonwell", 460, 86, "down")
      ],
      enemies: [
        e("asMed1", "medusa", 314, 274, 190, 470),
        e("asWi1", "witch", 612, 190, 500, 810),
        e("asBat1", "bat", 860, 162, 740, 1040)
      ],
      items: [
        item("sluiceHeart", "bigHeart", 506, 108)
      ]
    },
    cavern: {
      name: "Crystal Cavern",
      grid: [3, 2],
      bg: "bgCavern",
      mid: "midCrypt",
      music: "explore",
      palette: "blue",
      spawn: { x: 180, y: 80 },
      platforms: [
        p(0, 468, 960, 72, "blue"),
        p(110, 388, 130, 22, "stone"),
        p(280, 336, 130, 22, "blue"),
        p(460, 288, 130, 22, "stone"),
        p(640, 240, 130, 22, "blue"),
        p(820, 196, 130, 22, "stone")
      ],
      doors: [
        d(160, 0, 100, 56, "garden", 264, 392, "up"),
        d(922, 320, 38, 140, "aqueduct", 54, 330, "right"),
        d(566, 440, 112, 56, "cavernDepths", 180, 82, "down")
      ],
      enemies: [
        e("med4", "medusa", 360, 220, 280, 540),
        e("ph4", "phantom", 600, 180, 480, 800),
        e("g3", "gargoyle", 720, 246, 580, 870),
        e("r2", "reaper", 200, 158, 120, 380),
        e("cz1", "zora", 520, 308, 420, 560)
      ],
      items: [
        item("brookCrystal", "phoenixPendant", 880, 168)
      ]
    },
    cavernDepths: {
      name: "Sapphire Grotto",
      grid: [4, 3],
      bg: "bgCavernDepths",
      mid: null,
      music: "explore",
      palette: "blue",
      para: ["paraCavernSpires", "paraCavernMist"],
      grottoRide: { x1: 278, x2: 1056, y: 404, w: 190, h: 24, waterY: 430, speed: 0.52 },
      duckGates: [
        { x: 520, y: 264, w: 96, h: 92 },
        { x: 762, y: 260, w: 106, h: 96 },
        { x: 1000, y: 268, w: 98, h: 90 }
      ],
      spawn: { x: 180, y: 82 },
      platforms: [
        p(0, 468, 960, 72, "blue"),
        p(104, 394, 156, 24, "stone"),
        p(336, 342, 148, 24, "blue"),
        p(556, 288, 154, 24, "stone"),
        p(766, 238, 154, 24, "blue"),
        p(432, 156, 214, 22, "trim")
      ],
      doors: [
        d(144, 0, 120, 56, "cavern", 610, 360, "up"),
        d(430, 440, 112, 56, "tideReservoir", 180, 92, "down"),
        d(922, 320, 38, 140, "aqueduct", 104, 330, "right")
      ],
      enemies: [
        e("zg1", "zora", 220, 310, 120, 420),
        e("zg2", "zora", 540, 204, 420, 560),
        e("zg3", "zora", 910, 284, 820, 1120),
        e("zgDrowned", "drowned", 500, 392, 420, 860),
        e("tideWarden1", "tideWarden", 780, 214, 650, 940)
      ],
      items: [
        item("grottoHeart", "bigHeart", 590, 126)
      ],
      chests: [
        { id: "grotto_water", x: 1160, y: 270, loot: "subHolyWater" }
      ]
    },
    aqueduct: {
      name: "Astral Aqueduct",
      grid: [4, 2],
      bg: "bgAqueduct",
      mid: "midCrypt",
      music: "explore",
      palette: "blue",
      spawn: { x: 80, y: 330 },
      platforms: [
        p(0, 468, 960, 72, "blue"),
        p(118, 384, 152, 24, "stone"),
        p(336, 326, 152, 24, "blue"),
        p(572, 268, 168, 24, "stone"),
        p(782, 202, 150, 24, "blue")
      ],
      doors: [
        d(0, 320, 38, 140, "cavern", 1346, 330, "left"),
        d(922, 320, 38, 140, "moonwell", 60, 330, "right"),
        d(430, 0, 100, 56, "observatory", 474, 376, "up")
      ],
      enemies: [
        e("med5", "medusa", 250, 296, 120, 450),
        e("ph7", "phantom", 560, 190, 430, 780),
        e("r3", "reaper", 804, 116, 700, 900)
      ],
      items: [
        item("aquaHeart", "heartVessel", 822, 170)
      ]
    },
    moonwell: {
      name: "Moonwell Tidemaze",
      grid: [5, 2],
      bg: "bgMoonwell",
      mid: "paraMoonwellRipples",
      para: ["paraMoonwellRipples", "paraCrystals"],
      music: "explore",
      palette: "blue",
      spawn: { x: 80, y: 330 },
      platforms: [
        p(0, 468, 960, 72, "blue"),
        p(118, 386, 156, 28, "stone"),
        p(348, 328, 150, 24, "blue"),
        p(586, 270, 150, 24, "stone"),
        p(760, 204, 144, 24, "blue"),
        p(292, 162, 176, 24, "trim")
      ],
      doors: [
        d(0, 320, 38, 140, "aqueduct", 856, 330, "left"),
        d(430, 0, 100, 56, "astralSluice", 624, 376, "up"),
        d(548, 440, 112, 56, "tideReservoir", 250, 92, "down")
      ],
      puzzle: {
        id: "tideRunes",
        label: "Tide Plates",
        sequence: [0, 2, 1],
        solvedMessage: "The moonwell drains into a hidden cache.",
        reward: { type: "heartVessel", x: 790, y: 166 },
        switches: [
          { x: 172, y: 350, glyph: "Ebb", color: "#42dfff" },
          { x: 426, y: 292, glyph: "Flow", color: "#8bd7ff" },
          { x: 792, y: 168, glyph: "Moon", color: "#fff0cf" }
        ]
      },
      enemies: [
        e("mw1", "zora", 258, 306, 120, 420),
        e("mw2", "zora", 618, 190, 540, 760),
        e("mw3", "drowned", 790, 376, 700, 900)
      ],
      chests: [
        { id: "moonwell_mana", x: 560, y: 432, loot: "manaPool" }
      ],
      items: []
    },
    tideReservoir: {
      name: "Silt Choir Reservoir",
      grid: [5, 3],
      bg: "bgMoonwell",
      mid: "paraMoonwellRipples",
      para: ["paraMoonwellRipples", "paraCavernMist"],
      music: "explore",
      palette: "blue",
      spawn: { x: 250, y: 92 },
      organic: "reservoir",
      moatWater: { x: 0, y: 414, w: LONG_ROOM_WIDTH, h: 126, tile: "moatWaterTiles", mode7: true, parallax: true },
      platforms: [
        p(0, 468, 960, 72, "blue"),
        p(112, 390, 170, 24, "stone"),
        p(310, 326, 136, 22, "blue"),
        p(492, 270, 160, 24, "stone"),
        p(708, 212, 150, 22, "blue"),
        p(882, 342, 150, 24, "stone"),
        p(382, 146, 210, 22, "trim")
      ],
      doors: [
        d(0, 320, 38, 140, "cavernDepths", 1346, 330, "left"),
        d(250, 0, 112, 56, "moonwell", 604, 376, "up"),
        d(922, 320, 38, 140, "sanctum", 54, 330, "right", "puzzle:tideRunes")
      ],
      enemies: [
        e("trZ1", "zora", 258, 306, 120, 420),
        e("trDr1", "drowned", 582, 376, 480, 760),
        e("trMed1", "medusa", 898, 206, 760, 1040)
      ],
      chests: [
        { id: "reservoir_boomerang", x: 760, y: 176, loot: "subBoomerang" }
      ],
      items: [
        item("reservoirMp", "smallMp", 512, 112)
      ]
    }
  };

  function p(x, y, w, h, type) {
    return { x, y, w, h, type };
  }

  function d(x, y, w, h, to, sx, sy, side, lock, opts) {
    return { x, y, w, h, to, spawn: { x: sx, y: sy }, side, lock, hidden: !!(opts && opts.hidden) };
  }

  function e(id, type, x, y, min, max) {
    return { id, type, x, y, min, max };
  }

  function item(id, type, x, y) {
    return { id, type, x, y, w: 28, h: 28 };
  }

  function enhanceRoomFlow() {
    const rightShift = LONG_ROOM_WIDTH - W;
    const bridgePlatforms = {
      forest: [p(822, 398, 158, 28, "root"), p(1078, 350, 182, 28, "forest")],
      courtyard: [p(820, 384, 170, 28, "gardenStone"), p(1088, 322, 190, 28, "rose")],
      armory: [p(842, 384, 158, 28, "gold"), p(1088, 316, 178, 28, "stone")],
      moat: [p(842, 384, 158, 28, "blue"), p(1092, 316, 178, 28, "stone")],
      gate: [p(902, 402, 156, 28, "stone"), p(1138, 344, 168, 28, "gold")],
      gallery: [p(842, 386, 158, 28, "red"), p(1084, 334, 178, 28, "stone")],
      mirrorCloister: [p(878, 374, 160, 28, "blue"), p(1124, 304, 176, 28, "stone")],
      chapel: [p(846, 348, 160, 28, "blue"), p(1098, 286, 178, 28, "stone")],
      crypt: [p(846, 378, 164, 28, "green"), p(1118, 306, 184, 28, "stone")],
      catacomb: [p(884, 390, 166, 28, "green"), p(1120, 322, 176, 28, "stone")],
      ossuary: [p(858, 386, 168, 28, "green"), p(1114, 306, 176, 28, "stone")],
      clock: [p(864, 380, 158, 28, "blue"), p(1090, 300, 172, 28, "stone")],
      tower: [p(872, 352, 162, 28, "gold"), p(1108, 270, 170, 28, "stone")],
      garden: [p(854, 384, 164, 28, "green"), p(1126, 318, 184, 28, "stone")],
      library: [p(880, 380, 160, 28, "trim"), p(1130, 308, 170, 28, "stone")],
      archive: [p(872, 382, 168, 28, "gold"), p(1110, 304, 176, 28, "stone")],
      belltower: [p(870, 372, 160, 28, "gold"), p(1100, 296, 170, 28, "stone")],
      loft: [p(860, 374, 166, 28, "gold"), p(1102, 298, 174, 28, "stone")],
      observatory: [p(854, 374, 166, 28, "blue"), p(1106, 294, 174, 28, "gold")],
      cavern: [p(880, 376, 160, 28, "blue"), p(1130, 308, 170, 28, "stone")],
      cavernDepths: [p(874, 374, 164, 28, "blue"), p(1116, 300, 176, 28, "stone")],
      aqueduct: [p(866, 382, 166, 28, "blue"), p(1112, 312, 176, 28, "stone")],
      moonwell: [p(872, 374, 166, 28, "blue"), p(1118, 298, 178, 28, "stone")],
      antechamber: [p(880, 376, 160, 28, "red"), p(1130, 308, 170, 28, "stone")],
      emberFoundry: [p(874, 382, 166, 28, "red"), p(1124, 306, 178, 28, "stone")],
      sanctum: [p(880, 388, 160, 28, "blue"), p(1130, 320, 170, 28, "stone")]
    };

    for (const [id, room] of Object.entries(rooms)) {
      room.width = room.boss ? W : LONG_ROOM_WIDTH;
      room.height = room.boss ? H : LONG_ROOM_HEIGHT;
      for (const solid of room.platforms) {
        if (solid.x === 0 && solid.w >= W) {
          solid.w = room.width;
          solid.h = room.height - solid.y;
        }
        else if (solid.x > 560) solid.x += rightShift;
      }
      room.platforms.push(...(bridgePlatforms[id] || []));
      for (const door of room.doors) {
        if (door.side === "right") door.x = room.width - door.w;
      }
      for (const def of room.enemies) {
        if (def.x > 560) def.x += rightShift;
        if (def.min > 560) def.min += rightShift;
        if (def.max > 560) def.max += rightShift;
        def.max = Math.min(def.max, room.width - 64);
      }
      for (const drop of room.items) {
        if (drop.x > 560) drop.x += rightShift;
      }
      if (room.puzzle && room.puzzle.switches) {
        for (const sw of room.puzzle.switches) {
          if (sw.x > 560) sw.x += rightShift;
        }
        if (room.puzzle.reward && room.puzzle.reward.x > 560) room.puzzle.reward.x += rightShift;
      }
    }

    for (const room of Object.values(rooms)) {
      for (const door of room.doors) {
        const target = rooms[door.to];
        if (door.side === "left" && target) door.spawn.x = Math.max(54, roomWidth(target) - 104);
      }
    }
  }

  enhanceRoomFlow();
  installOrganicMaze();
  installWaterHazards();
  installStoryNpcs();
  generateCandles();
  installShrines();
  installClimbAids();
  installChests();
  installIntroSequence();

  function installOrganicMaze() {
    const staggered = {
      clock: [1, -1],
      mirrorCloister: [2, -1],
      belltower: [3, -1],
      loft: [4, -1],
      observatory: [5, -1],
      chapel: [3, 1],
      throne: [4, 1],
      garden: [2, 2],
      cavern: [3, 2],
      aqueduct: [4, 2],
      moonwell: [5, 2],
      cavernDepths: [4, 3],
      tideReservoir: [5, 3],
      sanctum: [4, 4],
      antechamber: [3, 3],
      emberFoundry: [3, 4]
    };
    for (const [id, grid] of Object.entries(staggered)) {
      if (rooms[id]) rooms[id].grid = grid;
    }

    const organicTypes = {
      forest: "roots",
      rootwound: "roots",
      moat: "sluice",
      crypt: "roots",
      catacomb: "bones",
      ossuary: "bones",
      cavern: "crystal",
      cavernDepths: "crystal",
      aqueduct: "sluice",
      astralSluice: "sluice",
      moonwell: "reservoir",
      tideReservoir: "reservoir",
      sanctum: "reservoir",
      garden: "roots",
      chapel: "arches",
      antechamber: "arches",
      emberFoundry: "gears"
    };
    for (const [id, type] of Object.entries(organicTypes)) {
      if (rooms[id]) rooms[id].organic = rooms[id].organic || type;
    }

    if (rooms.vault && !rooms.vault.doors.some((door) => door.to === "rootwound")) {
      rooms.vault.doors.push(d(430, 0, 112, 56, "rootwound", 474, 376, "up", "puzzle:libraryRunes"));
      rooms.vault.platforms.push(p(426, 88, 136, 22, "gold"));
    }
    if (rooms.moonwell) {
      rooms.moonwell.platforms.push(
        p(984, 386, 150, 22, "blue"),
        p(1188, 324, 142, 22, "stone")
      );
    }
    if (rooms.astralSluice) {
      rooms.astralSluice.platforms.push(
        p(944, 382, 150, 22, "blue"),
        p(1168, 314, 150, 22, "stone"),
        p(610, 102, 132, 20, "trim")
      );
    }
    if (rooms.tideReservoir) {
      rooms.tideReservoir.platforms.push(
        p(1030, 386, 156, 22, "blue"),
        p(1222, 306, 142, 22, "stone")
      );
    }
    const placeEnemy = (roomId, enemyId, x, y, min, max) => {
      const room = rooms[roomId];
      const def = room && room.enemies.find((enemy) => enemy.id === enemyId);
      if (!def) return;
      def.x = x;
      def.y = y;
      def.min = min;
      def.max = max;
    };
    placeEnemy("archive", "inkWarden1", 930, 204, 650, 1160);
    placeEnemy("observatory", "starWarden1", 900, 128, 620, 1120);
    placeEnemy("cavernDepths", "tideWarden1", 790, 214, 560, 1080);
  }

  function installStoryNpcs() {
    const placements = {
      forest: [{ id: "elys", x: 228, y: 390 }],
      library: [{ id: "vellum", x: 318, y: 318 }],
      chapel: [{ id: "maribel", x: 684, y: 366 }],
      moonwell: [{ id: "nera", x: 244, y: 386 }]
    };
    for (const [roomId, npcs] of Object.entries(placements)) {
      if (!rooms[roomId]) continue;
      rooms[roomId].npcs = npcs.map((npc) => ({ ...npc, w: 48, h: 108 }));
    }
  }

  function installWaterHazards() {
    const room = rooms.cavernDepths;
    if (!room) return;
    room.platforms = room.platforms.filter((solid) => !(solid.x === 0 && solid.y === 468 && solid.w >= room.width));
    room.platforms.push(
      p(0, 468, 292, 72, "blue"),
      p(448, 468, 220, 72, "blue"),
      p(852, 468, 204, 72, "blue"),
      p(1216, 468, room.width - 1216, 72, "blue")
    );
    room.waterPits = [
      { x: 292, y: 448, w: 156, h: 118 },
      { x: 668, y: 448, w: 184, h: 118 },
      { x: 1056, y: 448, w: 160, h: 118 }
    ];
  }

  function installShrines() {
    rooms.gate.shrine = { x: 760, y: 438 };
    rooms.clock.shrine = { x: 820, y: 438 };
    rooms.garden.shrine = { x: 760, y: 438 };
  }

  function installChests() {
    // Persistent chests with valuable loot. Hit with whip / spell / charge attack.
    if (rooms.library) {
      rooms.library.chests = [
        { id: "lib_pendant", x: 700, y: 152, loot: "phoenixPendant" }
      ];
    }
    if (rooms.belltower) {
      rooms.belltower.chests = [
        { id: "bt_axe", x: 720, y: 196, loot: "subAxe" }
      ];
    }
    if (rooms.sanctum) {
      rooms.sanctum.chests = [
        { id: "sct_holyWater", x: 800, y: 176, loot: "subHolyWater" }
      ];
    }
    if (rooms.cavern) {
      rooms.cavern.chests = [
        { id: "cv_heart", x: 780, y: 220, loot: "heartCache" }
      ];
    }
    if (rooms.cavernDepths) {
      rooms.cavernDepths.chests = [
        { id: "grotto_water", x: 1160, y: 270, loot: "subHolyWater" }
      ];
    }
    if (rooms.archive) {
      rooms.archive.chests = [
        { id: "ar_mana", x: 460, y: 220, loot: "manaPool" }
      ];
    }
  }

  function installClimbAids() {
    // === Moon Chain Tower ===
    // Dense monotonic staircase from ground to top platform.
    rooms.tower.platforms.push(
      p(140, 432, 110, 22, "stone"),
      p(300, 396, 110, 22, "gold"),
      p(460, 360, 110, 22, "stone"),
      p(620, 324, 110, 22, "gold"),
      p(770, 288, 110, 22, "stone"),
      p(920, 252, 110, 22, "gold"),
      p(1060, 216, 110, 22, "stone"),
      p(1180, 180, 110, 22, "gold")
    );

    // === Clockwork Rise ===
    // Staircase to the right-door (tower) at far right (x≈1402, y=72).
    rooms.clock.platforms.push(
      p(140, 432, 110, 22, "stone"),
      p(300, 396, 110, 22, "blue"),
      p(460, 360, 110, 22, "stone"),
      p(620, 324, 110, 22, "blue"),
      p(770, 288, 110, 22, "stone"),
      p(920, 252, 110, 22, "blue"),
      p(1060, 216, 110, 22, "stone"),
      p(1190, 180, 110, 22, "blue"),
      p(1320, 140, 100, 22, "stone")    // last step right at the door
    );

    // === Silver Portrait Gallery ===
    // Helpers up to the trim platform at (384, 124) which sits under the
    // up-door (430, 82, 100, 60) leading to Clockwork Rise.
    rooms.gallery.platforms.push(
      p(380, 240, 130, 22, "stone"),
      p(380, 180, 130, 22, "red")
    );

    // === Ashen Chapel ===
    // High platform under the up-door (438, 0, 96, 56) leading to Drowned
    // Rose Garden, plus a stepping stone to reach it.
    rooms.chapel.platforms.push(
      p(480, 200, 120, 22, "stone"),
      p(440, 130, 110, 22, "blue")
    );

    // === Drowned Rose Garden ===
    // High platform under the up-door (430, 0, 100, 56) leading to Tower,
    // plus a stepping stone.
    rooms.garden.platforms.push(
      p(380, 200, 120, 22, "stone"),
      p(430, 130, 110, 22, "green")
    );

    // === Lower Crypt ===
    // The up-door (422, 0, 116, 54) is reachable from (360, 150) but tight.
    // Add an extra stepping stone for safety.
    rooms.crypt.platforms.push(
      p(420, 80, 130, 22, "green")
    );

    // === New optional loops ===
    // Garden-to-armory and moat exits are reachable without demanding perfect
    // double-jump timing, while still reading as side-route secrets.
    rooms.courtyard.platforms.push(
      p(250, 210, 130, 22, "rose"),
      p(340, 136, 130, 22, "gardenStone")
    );
    rooms.moat.platforms.push(
      p(204, 186, 128, 22, "blue"),
      p(224, 112, 122, 22, "stone")
    );
    rooms.armory.platforms.push(
      p(1110, 238, 150, 22, "gold"),
      p(1240, 168, 132, 22, "trim")
    );
    rooms.aqueduct.platforms.push(
      p(390, 190, 130, 22, "blue"),
      p(430, 116, 124, 22, "stone")
    );
  }

  function installIntroSequence() {
    const drawbridge = {
      x: 610,
      y: 468,
      w: 450,
      h: 34,
      hingeX: 1060,
      hingeY: 468,
      triggerX: 1088,
      resetX: 520,
      progress: 0,
      target: 0,
      cycled: false,
      reopened: false
    };
    rooms.courtyard.drawbridge = drawbridge;
    rooms.courtyard.moatWater = {
      x: drawbridge.x - 28,
      y: drawbridge.y + 18,
      w: drawbridge.w + 76,
      h: roomHeight(rooms.courtyard) - drawbridge.y + 44,
      tile: "moatWaterTiles",
      mode7: true,
      parallax: true,
      bridgeChannel: true
    };
  }

  function generateCandles() {
    function seedHash(str) {
      let h = 2166136261;
      for (let i = 0; i < str.length; i += 1) {
        h ^= str.charCodeAt(i);
        h = (h * 16777619) >>> 0;
      }
      return h;
    }
    function mulberry(seed) {
      return function () {
        seed = (seed + 0x6D2B79F5) >>> 0;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    for (const [id, room] of Object.entries(rooms)) {
      if (room.boss) { room.candles = []; continue; }
      const rng = mulberry(seedHash(id));
      const candles = [];
      const placed = [];
      const placeNear = (px, py, kind) => {
        for (const o of placed) {
          if (Math.abs(o.x - px) < 64 && Math.abs(o.y - py) < 90) return;
        }
        candles.push({ id: `c${candles.length}`, x: px, y: py, drop: kind, broken: false });
        placed.push({ x: px, y: py });
      };
      for (const solid of room.platforms) {
        if (solid.h > 64) continue;
        if (solid.w < 90) continue;
        const ends = [solid.x + 18, solid.x + solid.w - 30];
        for (const ex of ends) {
          if (rng() < 0.78) {
            const drop = pickCandleDrop(rng);
            placeNear(ex, solid.y - 30, drop);
          }
        }
      }
      // Add a few wall-mounted candles (high up, decorative + reachable with dash/jump)
      const wallSlots = Math.floor(2 + rng() * 2);
      for (let i = 0; i < wallSlots; i += 1) {
        const wx = 120 + Math.floor(rng() * (room.width - 240));
        const wy = 90 + Math.floor(rng() * 120);
        const drop = pickCandleDrop(rng, true);
        placeNear(wx, wy, drop);
      }
      room.candles = candles;
    }
  }

  function pickCandleDrop(rng, rare) {
    const r = rng();
    if (rare && r < 0.04) return "subAxe";
    if (rare && r < 0.08) return "subHolyWater";
    if (rare && r < 0.12) return "subBoomerang";
    if (r < 0.66) return "heart";
    if (r < 0.85) return "bigHeart";
    if (r < 0.94) return "smallMp";
    return "smallHp";
  }
  window.__NOCTURNE_DEBUG_STATE = () => ({
    mode: game.mode,
    room: game.roomId,
    time: Number(game.time.toFixed(2)),
    roomWidth: roomWidth(),
    roomHeight: roomHeight(),
    cameraX: Math.round(game.cameraX),
    cameraY: Math.round(game.cameraY),
    playerX: Math.round(player.x),
    playerVx: Number(player.vx.toFixed(2)),
    playerY: Math.round(player.y),
    playerVy: Number(player.vy.toFixed(2)),
    onGround: Boolean(player.onGround),
    enemyTypes: game.enemies.map((enemy) => enemy.type),
    featuredEnemies: game.enemies
      .filter((enemy) => enemy.type === "blackPanther" || enemy.type === "zora")
      .map((enemy) => ({
        id: enemy.id,
        type: enemy.type,
        x: Math.round(enemy.x),
        y: Math.round(enemy.y),
        w: enemy.w,
        h: enemy.h,
        dw: enemy.cfg.dw,
        dh: enemy.cfg.dh
      })),
    transitionCooldown: Number((game.roomTransitionCooldown || 0).toFixed(2)),
    lastSafe: game.lastSafeSpot ? { ...game.lastSafeSpot } : null,
    keys: Array.from(keysDown),
    touches: Array.from(touchDown),
    doorReentryBlock: game.doorReentryBlock ? {
      roomId: game.doorReentryBlock.roomId,
      door: game.doorReentryBlock.key
    } : null,
    touchJumpHold: Number((game.touchJumpHold || 0).toFixed(2)),
    mobileMode: Boolean(game.mobileMode),
    paused: Boolean(game.paused),
    mobileLayout: isMobileLayout(),
    fullscreen: Boolean(fullscreenElement()),
    mobileStartFullscreenAttempted: game.mobileStartFullscreenAttempted,
    mobileStartFullscreenBlocked: Boolean(game.mobileStartFullscreenBlocked),
    mapMode: game.mapMode,
    puzzles: { ...(game.save.puzzles || {}) },
    roomPuzzle: game.room && game.room.puzzle ? {
      id: game.room.puzzle.id,
      step: game.room.puzzle.step || 0,
      solved: puzzleSolved(game.room.puzzle.id)
    } : null,
    objectiveDoor: objectiveDoorDebug(),
    survey: surveyProgress(),
    questSeals: questSealProgress(),
    grotto: grottoDebugState(),
    chests: (game.chests || []).map((chest) => ({
      id: chest.id,
      x: Math.round(chest.x),
      y: Math.round(chest.y),
      opened: Boolean(chest.opened),
      asset: Boolean(images.chests && images.chests.width),
      frameW: SPRITES.chestFrameW,
      frameH: SPRITES.chestFrameH,
      frames: SPRITES.chestFrames,
      drawW: CHEST_DRAW_W,
      drawH: CHEST_DRAW_H
    })),
    shrine: game.room && game.room.shrine ? {
      asset: Boolean(images.shrineHd && images.shrineHd.width),
      frameW: SHRINE_FRAME_SIZE,
      frames: 4
    } : null,
    drawbridgeCache: {
      deck: Boolean(drawbridgeRenderCache.deck),
      chains: drawbridgeRenderCache.chains.size,
      anchor: Boolean(drawbridgeRenderCache.anchor),
      mode7: mode7FloorCache.size,
      backgrounds: roomBackgroundCache.size + roomBackgroundWorldCache.size,
      backgroundViewports: roomBackgroundCache.size,
      backgroundWorld: roomBackgroundWorldCache.size,
      moatWater: moatWaterRenderCache.size,
      scenery: roomSceneryCache.size + roomSceneryWorldCache.size,
      sceneryViewports: roomSceneryCache.size,
      sceneryWorld: roomSceneryWorldCache.size
    },
    hdProps: {
      armory: Boolean(images.armoryProps && images.armoryProps.width),
      armorySize: images.armoryProps && images.armoryProps.width ? `${images.armoryProps.width}x${images.armoryProps.height}` : null,
      exitGuides: Boolean(images.exitGuides && images.exitGuides.width),
      exitGuideSize: images.exitGuides && images.exitGuides.width ? `${images.exitGuides.width}x${images.exitGuides.height}` : null,
      librarySwitches: Boolean(images.librarySwitches && images.librarySwitches.width),
      librarySwitchSize: images.librarySwitches && images.librarySwitches.width ? `${images.librarySwitches.width}x${images.librarySwitches.height}` : null,
      archiveWarden: Boolean(images.archiveWarden && images.archiveWarden.width),
      archiveWardenSize: images.archiveWarden && images.archiveWarden.width ? `${images.archiveWarden.width}x${images.archiveWarden.height}` : null,
      tower: Boolean(images.towerProps && images.towerProps.width),
      galleryPortraits: Boolean(images.galleryPortraits && images.galleryPortraits.width),
      towerSize: images.towerProps && images.towerProps.width ? `${images.towerProps.width}x${images.towerProps.height}` : null,
      gallerySize: images.galleryPortraits && images.galleryPortraits.width ? `${images.galleryPortraits.width}x${images.galleryPortraits.height}` : null,
      mirrorCloisterBg: Boolean(images.bgMirrorCloister && images.bgMirrorCloister.width),
      mirrorWindows: Boolean(images.paraMirrorWindows && images.paraMirrorWindows.width),
      mirrorWindowSize: images.paraMirrorWindows && images.paraMirrorWindows.width ? `${images.paraMirrorWindows.width}x${images.paraMirrorWindows.height}` : null,
      catacomb: Boolean(images.catacombProps && images.catacombProps.width),
      catacombSize: images.catacombProps && images.catacombProps.width ? `${images.catacombProps.width}x${images.catacombProps.height}` : null,
      chromaCaches: chromaCutoutCache.size
    },
    story: {
      npcAtlas: Boolean(images.npcStory && images.npcStory.width),
      npcAtlasSize: images.npcStory && images.npcStory.width ? `${images.npcStory.width}x${images.npcStory.height}` : null,
      roomNpcs: (game.npcs || []).map((npc) => npc.id),
      dialogue: game.dialogue ? game.dialogue.npc : null,
      flags: { ...(game.save.storyFlags || {}) },
      activeMilestoneBoss: activeMilestoneBoss() ? activeMilestoneBoss().type : null
    },
    enemyFrameMap: {
      version: "zora-panther-hd-24f-v2+quest-warden-48f-smooth-v1+archive-warden-imagen-hd-48f-v1",
      zoraFrames: ENEMY_FRAME_MAP.zora.frames,
      pantherFrames: ENEMY_FRAME_MAP.blackPanther.frames,
      questBossFrames: ENEMY_FRAME_MAP.tideWarden.frames,
      archiveWardenFrames: ENEMY_FRAME_MAP.inkWarden.frames
    },
    visuals: game.room ? {
      bg: game.room.bg,
      parallax: parallaxKeysForRoom(game.room).slice(),
      mode7: Boolean(game.room.bg && images[game.room.bg]),
      water: moatWaterDebugState(game.room)
    } : null,
    titleVisuals: titleVisuals(),
    introGate: game.room && game.room.portcullis ? {
      progress: Number(game.room.portcullis.progress.toFixed(2)),
      target: game.room.portcullis.target,
      cycled: Boolean(game.room.portcullis.cycled),
      reopened: Boolean(game.room.portcullis.reopened)
    } : null,
    introBridge: game.room && game.room.drawbridge ? {
      progress: Number(game.room.drawbridge.progress.toFixed(2)),
      target: game.room.drawbridge.target,
      cycled: Boolean(game.room.drawbridge.cycled),
      reopened: Boolean(game.room.drawbridge.reopened)
    } : null,
    hp: Math.round(player.hp)
  });
  window.__NOCTURNE_TEST_INPUT = (action, down) => {
    if (!KEYMAP[action]) return;
    if (down) touchDown.add(action);
    else touchDown.delete(action);
  };
  window.__NOCTURNE_TEST_TELEPORT = (roomId, x, y) => {
    if (!rooms[roomId]) return false;
    game.mode = "playing";
    player.hp = Math.max(player.hp, player.maxHp || 112);
    hideTitlePanel();
    enterRoom(roomId, { x, y }, false);
    return true;
  };
  window.__NOCTURNE_TEST_PLACE_PLAYER = (x, y) => {
    game.mode = "playing";
    player.hp = Math.max(player.hp, player.maxHp || 112);
    player.x = x;
    player.y = y;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    placePlayerAtSpawn(game.room, { x, y });
    updateCamera(true);
    return true;
  };
  window.__NOCTURNE_TEST_SET_PLAYER_RAW = (x, y, onGround = false) => {
    game.mode = "playing";
    player.hp = Math.max(player.hp, player.maxHp || 112);
    player.x = x;
    player.y = y;
    player.vx = 0;
    player.vy = 0;
    player.onGround = Boolean(onGround);
    player.invuln = 0;
    updateCamera(true);
    return true;
  };
  window.__NOCTURNE_TEST_ALIGN_GROTTO_RIDE = (targetX) => {
    const ride = game.room && game.room.grottoRide;
    if (!ride) return null;
    const span = Math.max(1, ride.x2 - ride.x1);
    const phase = clamp((targetX - ride.x1) / span, 0.02, 0.98);
    const s = clamp(phase * 2 - 1, -0.98, 0.98);
    let t = Math.asin(s) / ride.speed;
    if (t < 0) t += (Math.PI * 2) / ride.speed;
    game.time = t;
    updateCamera(true);
    return grottoDebugState();
  };
  window.__NOCTURNE_TEST_CLEAR_ROOM_THREATS = () => {
    game.enemies.length = 0;
    game.projectiles.length = 0;
    game.flames.length = 0;
    game.boss = null;
    player.invuln = 0;
    return true;
  };
  window.__NOCTURNE_TEST_SET_KILLED = (roomId, enemyId, killed = true) => {
    if (!game.save.killed) game.save.killed = {};
    const key = `${roomId}:${enemyId}`;
    if (killed) game.save.killed[key] = true;
    else delete game.save.killed[key];
    return true;
  };
  window.__NOCTURNE_TEST_SET_CHEST_OPENED = (roomId, chestId, opened = true) => {
    if (!game.save.openedChests) game.save.openedChests = {};
    const key = `${roomId}:${chestId}`;
    if (opened) game.save.openedChests[key] = true;
    else delete game.save.openedChests[key];
    if (game.roomId === roomId && game.chests) {
      const chest = game.chests.find((candidate) => candidate.id === chestId);
      if (chest) chest.opened = Boolean(opened);
    }
    return true;
  };
  window.__NOCTURNE_TEST_SET_PUZZLE = (id, solved = true) => {
    if (!game.save.puzzles) game.save.puzzles = {};
    if (solved) game.save.puzzles[id] = true;
    else delete game.save.puzzles[id];
    for (const room of Object.values(rooms)) {
      if (room.puzzle && room.puzzle.id === id) room.puzzle.step = solved ? room.puzzle.sequence.length : 0;
    }
    updateMapPanel();
    return true;
  };
  window.__NOCTURNE_PERF_RESET = () => {
    perfStats.enabled = true;
    perfStats.update.length = 0;
    perfStats.draw.length = 0;
    perfStats.frame.length = 0;
    return true;
  };
  window.__NOCTURNE_PERF_STATS = () => perfSummary();

  function loadImage(key, src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ key, img, ok: true });
      img.onerror = () => resolve({ key, img, ok: false, src });
      img.src = src;
    });
  }

  async function loadAssets() {
    const entries = Object.entries(IMG);
    let done = 0;
    await Promise.all(entries.map(async ([key, src]) => {
      const result = await loadImage(key, src);
      images[key] = result.img;
      done += 1;
      dom.loadState.textContent = `Loading local assets ${done}/${entries.length}`;
    }));
    dom.loadState.textContent = "Preparing drawbridge cache";
    warmDrawbridgePerformanceCaches();
    game.loaded = true;
    window.__NOCTURNE_READY = true;
    game.mode = "title";
    dom.loadState.textContent = "Ready";
    dom.startButton.disabled = false;
    dom.continueButton.disabled = !hasSave();
    renderTitle("Nocturne Reliquary", "Hunt relics through a moonlocked castle and break the crimson rite.");
  }

  function warmDrawbridgePerformanceCaches() {
    const room = rooms.courtyard;
    if (!room || !room.drawbridge) return;
    const bg = images[room.bg];
    if (bg && bg.width) {
      getMode7FloorLayer(room, bg, roomWidth(room), roomHeight(room), isOutdoorRoom(room));
      getRoomBackgroundWorldLayer(room, bg, images[room.mid], roomWidth(room), roomHeight(room), isOutdoorRoom(room));
    }
    getDrawbridgeDeckLayer(room.drawbridge);
    getDrawbridgeChainStrip(520, 13);
    getDrawbridgeAnchorPlate();
    getPlatformLayer(room);
    getRoomSceneryWorldLayer(room);
    warmMoatWaterPerformanceCaches(room);
  }

  function warmMoatWaterPerformanceCaches(room) {
    if (!room || !room.moatWater) return;
    const plane = room.moatWater;
    const img = images[plane.tile || "moatWaterTiles"];
    if (!img || !img.width) return;
    const w = Math.ceil(plane.w || roomWidth(room));
    const h = Math.ceil(plane.h || Math.max(96, roomHeight(room) - (plane.y || 0)));
    for (let frame = 0; frame < MOAT_WATER_FRAMES; frame += 1) {
      getMoatWaterMode7Layer(img, w, h, frame, 0);
      getMoatWaterMode7Layer(img, w, h, frame, 1);
    }
  }

  function hasSave() {
    try {
      return Boolean(localStorage.getItem(STORE_KEY));
    } catch {
      return false;
    }
  }

  function renderTitle(title, subtitle) {
    dom.title.textContent = title;
    dom.subtitle.textContent = subtitle;
    showTitlePanel();
  }

  function showTitlePanel() {
    dom.titlePanel.hidden = false;
    document.body.classList.add("title-active");
  }

  function hideTitlePanel() {
    dom.titlePanel.hidden = true;
    document.body.classList.remove("title-active");
  }

  function resetRun(fromSave) {
    const saved = fromSave ? readSave() : null;
    const base = saved || {
      roomId: "forest",
      x: rooms.forest.spawn.x,
      y: rooms.forest.spawn.y,
      hp: 112,
      mp: 48,
      save: {
        visited: {},
        collected: {},
        killed: {},
        relics: { doubleJump: false, dash: false },
        moonSigil: false,
        questSeals: { inkSeal: false, starSeal: false, tideSeal: false },
        bossDefeated: false,
        storyFlags: {},
        maxHp: 112,
        maxMp: 48
      }
    };

    game.save = normalizeSave(base.save);
    player.maxHp = game.save.maxHp;
    player.maxMp = game.save.maxMp;
    player.maxHearts = game.save.maxHearts;
    player.hp = clamp(base.hp || player.maxHp, 1, player.maxHp);
    player.mp = clamp(base.mp ?? player.maxMp, 0, player.maxMp);
    player.hearts = clamp(game.save.hearts, 0, player.maxHearts);
    player.subweapon = game.save.subweapon;
    player.level = game.save.level;
    player.exp = game.save.exp;
    player.baseDamage = (player.level - 1) * 1;
    player.x = base.x ?? rooms[base.roomId || "gate"].spawn.x;
    player.y = base.y ?? rooms[base.roomId || "gate"].spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.facing = 1;
    player.invuln = 0;
    player.attackTimer = 0;
    player.attackHit = false;
    player.attackVariant = "side";
    player.dashTimer = 0;
    player.dashCooldown = 0;
    player.backdashTimer = 0;
    player.backdashCooldown = 0;
    player.subweaponCooldown = 0;
    player.jumps = 0;
    player.coyote = 0;
    player.jumpBuffer = 0;
    player.combo = 0;
    player.comboTimer = 0;
    game.projectiles.length = 0;
    game.particles.length = 0;
    game.message = "";
    game.messageTimer = 0;
    game.mode = "playing";
    game.paused = false;
    updatePauseButton();
    hideTitlePanel();
    enterRoom(base.roomId || "gate", { x: player.x, y: player.y }, false);
    ensureFamiliar();
    playSound("ui");
    playMusic(game.room.music);
  }

  function normalizeSave(source) {
    const save = source || {};
    const ownedRaw = save.ownedSubweapons || {};
    const owned = {
      dagger: true,
      axe: Boolean(ownedRaw.axe),
      holyWater: Boolean(ownedRaw.holyWater),
      boomerang: Boolean(ownedRaw.boomerang)
    };
    let sub = save.subweapon || "dagger";
    if (!SUBWEAPONS[sub] || !owned[sub]) sub = "dagger";
    return {
      visited: { ...(save.visited || {}) },
      collected: { ...(save.collected || {}) },
      killed: { ...(save.killed || {}) },
      brokenCandles: { ...(save.brokenCandles || {}) },
      relics: {
        doubleJump: Boolean(save.relics && save.relics.doubleJump),
        dash: Boolean(save.relics && save.relics.dash)
      },
      moonSigil: Boolean(save.moonSigil),
      questSeals: {
        inkSeal: Boolean(save.questSeals && save.questSeals.inkSeal),
        starSeal: Boolean(save.questSeals && save.questSeals.starSeal),
        tideSeal: Boolean(save.questSeals && save.questSeals.tideSeal)
      },
      bossDefeated: Boolean(save.bossDefeated),
      maxHp: clamp(save.maxHp || 112, 112, 240),
      maxMp: clamp(save.maxMp || 48, 48, 200),
      maxHearts: clamp(save.maxHearts || 99, 20, 200),
      hearts: clamp(save.hearts ?? 20, 0, 200),
      subweapon: sub,
      ownedSubweapons: owned,
      level: clamp(save.level || 1, 1, 50),
      exp: Math.max(0, save.exp || 0),
      lastShrine: save.lastShrine || null,
      kills: Math.max(0, save.kills || 0),
      timePlayed: Math.max(0, save.timePlayed || 0),
      familiar: save.familiar === "bat" ? "bat" : null,
      equipment: {
        ringOfArdor: Boolean(save.equipment && save.equipment.ringOfArdor),
        batCloak: Boolean(save.equipment && save.equipment.batCloak),
        wraithArmor: Boolean(save.equipment && save.equipment.wraithArmor),
        phoenixPendant: Boolean(save.equipment && save.equipment.phoenixPendant)
      },
      crits: Math.max(0, save.crits || 0),
      openedChests: { ...(save.openedChests || {}) },
      puzzles: { ...(save.puzzles || {}) },
      storyFlags: { ...(save.storyFlags || {}) }
    };
  }

  function readSave() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeSave() {
    try {
      game.save.hearts = player.hearts;
      game.save.subweapon = player.subweapon;
      game.save.level = player.level;
      game.save.exp = player.exp;
      game.save.maxHp = player.maxHp;
      game.save.maxMp = player.maxMp;
      game.save.maxHearts = player.maxHearts;
      localStorage.setItem(STORE_KEY, JSON.stringify({
        roomId: game.roomId,
        x: player.x,
        y: player.y,
        hp: player.hp,
        mp: player.mp,
        save: game.save
      }));
      dom.continueButton.disabled = false;
    } catch {
      message("Save crystal fractured");
    }
  }

  function updatePauseButton() {
    if (!dom.pauseButton) return;
    dom.pauseButton.textContent = game.paused ? "RES" : "PAU";
    dom.pauseButton.setAttribute("aria-pressed", String(Boolean(game.paused)));
    dom.pauseButton.setAttribute("aria-label", game.paused ? "Resume" : "Pause");
  }

  function togglePause(force) {
    if (game.mode !== "playing") return;
    game.paused = force === undefined ? !game.paused : Boolean(force);
    updatePauseButton();
    message(game.paused ? "Paused" : "Resumed");
    playSound("ui", 0.22);
  }

  function quickSaveGame() {
    if (game.mode !== "playing") return;
    writeSave();
    message("Quick save anchored");
    playSound("ui", 0.24);
  }

  function placePlayerAtSpawn(room, spawn) {
    const rw = roomWidth(room);
    const rh = roomHeight(room);
    player.x = clamp(spawn.x, -8, rw - player.w + 8);
    player.y = clamp(spawn.y, -24, rh - player.h + 8);

    const centerX = player.x + player.w / 2;
    const bottom = player.y + player.h;
    for (const solid of collisionPlatforms(room)) {
      if (centerX < solid.x - 8 || centerX > solid.x + solid.w + 8) continue;
      if (bottom >= solid.y - 8 && bottom <= solid.y + Math.max(28, solid.h)) {
        player.y = solid.y - player.h;
        break;
      }
    }
  }

  function enterRoom(roomId, spawn, autosave = true, sourceDoor = null) {
    const room = rooms[roomId] || rooms.gate;
    game.roomId = roomId;
    game.room = room;
    game.save.visited[roomId] = true;
    placePlayerAtSpawn(room, spawn);
    game.doorReentryBlock = null;
    if (sourceDoor) {
      suppressReverseDoorUntilExit(room, sourceDoor);
      if (sourceDoor.usedSide) {
        touchDown.delete(sourceDoor.usedSide);
        justPressed.delete(`touch:${sourceDoor.usedSide}`);
      }
    }
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
    game.enemies = room.enemies
      .filter((def) => !enemyKillPersists(def) || !game.save.killed[`${roomId}:${def.id}`])
      .map(createEnemy);
    game.npcs = (room.npcs || []).map((npc) => ({ ...npc, phase: Math.random() * Math.PI * 2 }));
    game.dialogue = null;
    game.pickups = room.items
      .filter((def) => !game.save.collected[`${roomId}:${def.id}`])
      .map((def) => ({ ...def, bob: Math.random() * 10 }));
    syncQuestSealPickups(roomId);
    syncPuzzleReward(roomId);
    // Candles respawn on every room enter (SOTN-style); only persist subweapon drops once collected.
    game.candles = (room.candles || []).map((c) => ({
      x: c.x, y: c.y, drop: c.drop, id: c.id,
      broken: false,
      consumed: false,
      flame: Math.random() * Math.PI * 2
    }));
    game.flames = [];
    game.damageTexts = [];
    game.bossBanner = null;
    game.ambient = [];
    // Treasure chests: persistent state via game.save.openedChests
    game.chests = (room.chests || []).map((c) => ({
      id: c.id, x: c.x, y: c.y, loot: c.loot,
      opened: !!(game.save.openedChests && game.save.openedChests[`${roomId}:${c.id}`])
    }));
    game.roomTransitionCooldown = 0.18;
    game.lastSafeSpot = { roomId, x: player.x, y: player.y };
    resetRoomIntroMechanics(room);
    game.projectiles.length = 0;
    if (game.familiar) {
      game.familiar.x = player.x - 30;
      game.familiar.y = player.y + 20;
      game.familiar.vx = 0;
      game.familiar.vy = 0;
      game.familiar.target = null;
      game.familiar.cooldown = 0.3;
    }
    game.boss = room.boss && !game.save.bossDefeated ? createBoss() : null;
    if (game.boss) {
      playMusic("boss");
      playSound("bossRoar");
      message("Lord Veyr waits beyond the glass altar");
      game.bossBanner = { name: "Lord Veyr", subtitle: "Crimson Rite", t: 0, life: 3.4 };
    } else {
      playMusic(room.music);
      // Flash the next objective whenever the player is actually in-game.
      // Skips the boot enterRoom call (game.mode === "loading").
      if (game.mode === "playing") {
        message(nextObjective());
      }
      // Boss-style banner if any unkilled milestone warden or mini-boss is in this room.
      const mini = game.enemies.find((e) => e.cfg && e.cfg.mini);
      if (mini && game.mode === "playing") {
        game.bossBanner = { name: mini.cfg.banner || "Mini-Boss", subtitle: mini.cfg.subtitle || "", t: 0, life: mini.cfg.fullBoss ? 3.8 : 3.0 };
        playSound("bossRoar", mini.cfg.fullBoss ? 0.72 : 0.5);
        if (mini.cfg.fullBoss) {
          message(`${mini.cfg.banner} guards the seal.`);
        }
      }
    }
    updateCamera(true);
    updateHud();
    updateMapPanel();
    if (autosave) writeSave();
  }

  function resetRoomIntroMechanics(room) {
    if (room && room.portcullis) {
      const gate = room.portcullis;
      gate.progress = 0;
      gate.target = 0;
      gate.cycled = false;
      gate.reopened = false;
    }
    if (room && room.drawbridge) {
      const bridge = room.drawbridge;
      bridge.progress = 0;
      bridge.target = 0;
      bridge.cycled = false;
      bridge.reopened = false;
    }
  }

  function scaledEnemyConfig(base) {
    if (!base) return null;
    const hpScale = base.mini ? Math.max(1.08, ENEMY_HP_SCALE - 0.04) : ENEMY_HP_SCALE;
    const damageScale = base.mini ? Math.max(1.08, ENEMY_DAMAGE_SCALE - 0.08) : ENEMY_DAMAGE_SCALE;
    return {
      ...base,
      hp: Math.max(1, Math.round(base.hp * hpScale)),
      damage: Math.max(1, Math.ceil(base.damage * damageScale))
    };
  }

  function createEnemy(def) {
    const cfg = scaledEnemyConfig(ENEMY_TYPES[def.type]);
    return {
      id: def.id,
      type: def.type,
      cfg,
      x: def.x,
      y: def.y,
      w: cfg.w,
      h: cfg.h,
      vx: Math.random() > 0.5 ? cfg.speed : -cfg.speed,
      vy: 0,
      hp: cfg.hp,
      maxHp: cfg.hp,
      min: def.min,
      max: def.max,
      facing: -1,
      onGround: false,
      cooldown: 0.6 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
      hurt: 0,
      lunge: 0,
      attackWindup: 0,
      specialCooldown: cfg.fullBoss ? 1.8 : 0
    };
  }

  function enemyKillPersists(enemyOrDef) {
    const cfg = enemyOrDef && (enemyOrDef.cfg || ENEMY_TYPES[enemyOrDef.type]);
    return Boolean(cfg && cfg.mini);
  }

  function syncQuestSealPickups(roomId) {
    for (const seal of QUEST_SEALS) {
      const site = QUEST_SEAL_SITES[seal.type];
      if (!site || site.room !== roomId) continue;
      if (game.save.questSeals && game.save.questSeals[seal.type]) continue;
      if (!game.save.killed[`${roomId}:${site.enemyId}`]) continue;
      if (game.pickups.some((drop) => drop.type === seal.type)) continue;
      game.pickups.push({
        id: `${seal.type}_reward`,
        type: seal.type,
        x: site.x,
        y: site.y,
        w: 36,
        h: 36,
        bob: Math.random() * 10
      });
    }
  }

  function spawnQuestSealReward(enemy) {
    const sealType = enemy.cfg && enemy.cfg.questSeal;
    if (!sealType || (game.save.questSeals && game.save.questSeals[sealType])) return false;
    const site = QUEST_SEAL_SITES[sealType] || {};
    const x = site.x ?? (enemy.x + enemy.w / 2 - 18);
    const y = site.y ?? (enemy.y + enemy.h / 2 - 18);
    game.pickups.push({
      id: `${sealType}_reward`,
      type: sealType,
      x,
      y,
      w: 36,
      h: 36,
      bob: 0,
      fall: true,
      vx: 0,
      vy: -4.8,
      fallLife: 18
    });
    const label = questSealLabel(sealType);
    message(`${enemy.cfg.banner || "Mini-Boss"} falls - ${label} revealed!`);
    return true;
  }

  function createBoss() {
    const hp = Math.round(190 * BOSS_HP_SCALE);
    return {
      type: "lordVeyr",
      x: 650,
      y: 318,
      w: 80,
      h: 128,
      vx: -0.45,
      vy: 0,
      row: 0,
      hp,
      maxHp: hp,
      facing: -1,
      cooldown: 1.05,
      state: "stalk",
      stateTimer: 1.2,
      hurt: 0
    };
  }

  function actionDown(action) {
    const keyHeld = KEYMAP[action].some((code) => keysDown.has(code));
    const touchHeld = touchDown.has(action) || (action === "jump" && game.touchJumpHold > 0);
    return keyHeld || touchHeld;
  }

  function actionJust(action) {
    return KEYMAP[action].some((code) => justPressed.has(code)) || justPressed.has(`touch:${action}`);
  }

  function clearJust() {
    justPressed.clear();
  }

  function update(dt) {
    game.titleTime = (game.titleTime || 0) + dt;
    if (game.mode !== "playing") {
      clearJust();
      return;
    }

    if (actionJust("pause")) togglePause();
    if (game.paused) {
      if (actionJust("quickSave")) quickSaveGame();
      if (actionJust("map")) toggleMap();
      if (actionJust("mute")) toggleMute();
      updateHud();
      clearJust();
      return;
    }
    if (game.dialogue) {
      if (actionJust("interact") || actionJust("attack") || actionJust("jump")) advanceDialogue();
      updateHud();
      clearJust();
      return;
    }

    const step = Math.min(2, dt * 60);
    game.time += dt;
    game.save.timePlayed = (game.save.timePlayed || 0) + dt;
    game.shake = Math.max(0, game.shake - dt * 10);
    game.roomTransitionCooldown = Math.max(0, game.roomTransitionCooldown - dt);
    game.messageTimer = Math.max(0, game.messageTimer - dt);
    game.touchJumpHold = Math.max(0, (game.touchJumpHold || 0) - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.attackTimer = Math.max(0, player.attackTimer - dt);
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.spellCooldown = Math.max(0, player.spellCooldown - dt);
    player.subweaponCooldown = Math.max(0, player.subweaponCooldown - dt);
    player.comboTimer = Math.max(0, player.comboTimer - dt);
    if (player.comboTimer === 0) player.combo = 0;
    if (player.attackTimer === 0) player.attackHit = false;

    if (actionJust("map")) toggleMap();
    if (actionJust("mute")) toggleMute();
    if (actionJust("hint")) {
      message(nextObjective());
      playSound("ui", 0.22);
    }
    if (actionJust("quickSave")) quickSaveGame();
    if (actionJust("interact") && tryStartNpcDialogue()) {
      updateHud();
      clearJust();
      return;
    }

    // Pause gameplay while the menu is open. Still let the menu stats refresh.
    if (game.mapMode === "full" || dom.mapPanel.hidden === false) {
      game.statsRefreshTimer = (game.statsRefreshTimer || 0) - dt;
      if (game.statsRefreshTimer <= 0) {
        game.statsRefreshTimer = 0.5;
        updateMapPanel();
      }
      clearJust();
      return;
    }

    updateGrottoMovingPlatform(dt);
    updatePlayer(step, dt);
    updateGrottoDuckGates(dt);
    updateEnemies(step, dt);
    updateBoss(step, dt);
    updateProjectiles(step, dt);
    updatePickups(dt);
    updateParticles(step, dt);
    updateCandles(dt);
    updateFlames(step, dt);
    updateShrines();
    updateDoors();
    updateIntroMechanics(dt);
    updateBossBanner(dt);
    updateDamageTexts(dt);
    updateFamiliar(step, dt);
    updateChests();
    tickStatusEffects(dt);
    updateAmbient(dt);
    updateCamera(false);
    updateHud();
    clearJust();
  }

  function grottoRidePlatform(room = game.room, t = game.time) {
    if (!room || !room.grottoRide) return null;
    const ride = room.grottoRide;
    const span = ride.x2 - ride.x1;
    const phase = 0.5 + Math.sin(t * ride.speed) * 0.5;
    const bob = Math.sin(t * 1.35 + 0.6) * 4;
    return {
      x: ride.x1 + span * phase,
      y: ride.y + bob,
      w: ride.w,
      h: ride.h,
      type: "blue",
      moving: true,
      grottoRide: true
    };
  }

  function entityStandingOnPlatform(ent, platform) {
    if (!platform) return false;
    const bottom = ent.y + ent.h;
    const horizontal = ent.x + ent.w > platform.x + 10 && ent.x < platform.x + platform.w - 10;
    return horizontal && bottom >= platform.y - 8 && bottom <= platform.y + Math.max(16, platform.h + 8) && ent.vy >= -1.2;
  }

  function playerIsDucking() {
    return actionDown("down") && player.onGround && player.dashTimer <= 0 && player.backdashTimer <= 0;
  }

  function playerStandingHeadBox() {
    return {
      x: player.x + 6,
      y: player.y + 8,
      w: player.w - 12,
      h: 68
    };
  }

  function grottoDebugState(room = game.room) {
    if (!room || !room.grottoRide) return null;
    const platform = grottoRidePlatform(room);
    return {
      platform: platform ? {
        x: Math.round(platform.x),
        y: Math.round(platform.y),
        w: Math.round(platform.w),
        h: Math.round(platform.h)
      } : null,
      waterY: room.grottoRide.waterY,
      ducking: playerIsDucking(),
      spikesAsset: Boolean(images.grottoSpikesHd && images.grottoSpikesHd.width),
      spikeFrameW: GROTTO_SPIKE_FRAME_SIZE,
      duckGates: (room.duckGates || []).map((gate) => ({
        x: gate.x,
        y: gate.y,
        w: gate.w,
        h: gate.h
      }))
    };
  }

  function moatWaterDebugState(room = game.room) {
    if (!room || !room.moatWater) return null;
    const tileKey = room.moatWater.tile || "moatWaterTiles";
    const img = images[tileKey];
    return {
      tile: tileKey,
      asset: Boolean(img && img.width),
      width: img && img.width ? img.width : 0,
      height: img && img.height ? img.height : 0,
      frameW: MOAT_WATER_TILE_SIZE,
      frames: MOAT_WATER_FRAMES,
      mode7: Boolean(room.moatWater.mode7),
      parallax: Boolean(room.moatWater.parallax),
      cache: moatWaterRenderCache.size
    };
  }

  function updateGrottoMovingPlatform(dt) {
    const room = game.room;
    if (!room || !room.grottoRide) return;
    const prev = grottoRidePlatform(room, Math.max(0, game.time - dt));
    const current = grottoRidePlatform(room, game.time);
    const riding = entityStandingOnPlatform(player, prev) || entityStandingOnPlatform(player, current);
    if (!riding) return;

    player.x += current.x - prev.x;
    player.y += current.y - prev.y;
    player.onGround = true;
    player.coyote = Math.max(player.coyote, 0.12);
    if (!game.grottoRideHinted) {
      game.grottoRideHinted = true;
      message("Hold Down to duck under the sapphire teeth.");
    }
  }

  function updateGrottoDuckGates(dt) {
    const room = game.room;
    game.grottoDuckHitTimer = Math.max(0, (game.grottoDuckHitTimer || 0) - dt);
    if (!room || !room.duckGates) return;

    const headBox = playerStandingHeadBox();
    const gate = room.duckGates.find((entry) => rectsOverlap(headBox, entry));
    if (!gate) return;

    if (playerIsDucking()) {
      game.grottoDuckClearTimer = 0.35;
      return;
    }

    const dir = (player.x + player.w / 2) < (gate.x + gate.w / 2) ? -1 : 1;
    player.x += dir * 6;
    player.vx = dir * Math.max(2.2, Math.abs(player.vx) * 0.45);
    if (game.grottoDuckHitTimer <= 0) {
      game.grottoDuckHitTimer = 0.62;
      hurtPlayer(7);
      message("Duck under the sapphire teeth.");
      burst(player.x + player.w / 2, player.y + 24, "#8ff8ff", 12);
    }
  }

  function updatePlayer(step, dt) {
    const left = actionDown("left");
    const right = actionDown("right");
    const save = game.save;
    let move = 0;
    if (left) move -= 1;
    if (right) move += 1;

    if (move) {
      player.facing = move;
      player.vx += move * 0.54 * step;
    } else {
      player.vx *= Math.pow(0.78, step);
      if (Math.abs(player.vx) < 0.04) player.vx = 0;
    }

    const slowMul = player.slow > 0 ? 0.55 : 1.0;
    const maxSpeed = (player.dashTimer > 0 ? 10.4 : 4.2) * slowMul;
    player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

    if (player.onGround) {
      player.coyote = 0.12;
      player.jumps = 0;
    } else {
      player.coyote = Math.max(0, player.coyote - dt);
    }

    if (actionJust("jump")) player.jumpBuffer = 0.13;
    else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);

    if (player.jumpBuffer > 0) {
      const jumpScale = playerJumpScale();
      if (player.onGround || player.coyote > 0) {
        player.vy = -13.6 * jumpScale;
        player.onGround = false;
        player.coyote = 0;
        player.jumpBuffer = 0;
        player.jumps = 1;
        playSound("jump");
      } else {
        const maxJumps = save.relics.doubleJump ? 3 : 2;
        if (player.jumps < maxJumps) {
          player.vy = (player.jumps === 1 ? -12.5 : -11.6) * jumpScale;
          player.jumps += 1;
          player.jumpBuffer = 0;
          burst(player.x + player.w / 2, player.y + player.h, player.jumps > 2 ? "#f2cb68" : "#8bd7ff", player.jumps > 2 ? 18 : 12);
          if (player.jumps > 2) message("Moonstep");
          playSound("jump");
        }
      }
    }

    if (!actionDown("jump") && player.vy < -4.6) {
      player.vy += 0.82 * step;
    }

    if (actionJust("dash")) {
      if (save.relics.dash && player.dashCooldown <= 0) {
        player.dashTimer = 0.18;
        player.dashCooldown = 0.62;
        player.invuln = Math.max(player.invuln, 0.22);
        player.vx = player.facing * 10.6;
        burst(player.x + player.w / 2, player.y + player.h / 2, "#c9f4ee", 14);
        playSound("dash");
      } else if (!save.relics.dash) {
        message("Mist Dash is sealed elsewhere");
      }
    }

    if (actionJust("backdash") && player.backdashCooldown <= 0 && player.backdashTimer <= 0) {
      player.backdashTimer = 0.22;
      player.backdashCooldown = 0.45;
      player.invuln = Math.max(player.invuln, 0.26);
      player.vx = -player.facing * 9.2;
      player.vy = Math.min(player.vy, -0.6);
      burst(player.x + player.w / 2, player.y + player.h / 2, "#a8b8d8", 12);
      playSound("dash", 0.28);
    }
    player.backdashCooldown = Math.max(0, player.backdashCooldown - dt);

    if (player.dashTimer > 0) {
      player.dashTimer = Math.max(0, player.dashTimer - dt);
      player.vy *= 0.72;
    } else if (player.backdashTimer > 0) {
      player.backdashTimer = Math.max(0, player.backdashTimer - dt);
      player.vy *= 0.6;
    } else {
      player.vy += GRAVITY * step;
    }

    // Charge timer: attack button held builds charge after release.
    if (actionDown("attack") && player.attackTimer <= 0.02) {
      player.attackHeld += dt;
      if (!player.chargeReady && player.attackHeld >= 0.6) {
        player.chargeReady = true;
        burst(player.x + player.w / 2, player.y + 28, "#ffd065", 8);
        playSound("ui", 0.18);
      }
    }

    if (actionJust("attack") && player.attackTimer <= 0.02) {
      player.attackTimer = 0.28;
      player.attackHit = false;
      player.attackVariant = !player.onGround && actionDown("down") ? "down" : "side";
      if (!player.onGround && player.vy > -2) {
        player.vy *= 0.42;
        burst(player.x + player.w / 2, player.y + 46, "#f0bf61", 6);
      }
      playSound(Math.random() > 0.5 ? "whip" : "whip2");
    }

    // Release of held attack while charge is ready -> Power Whip
    if (!actionDown("attack") && player.chargeReady) {
      player.chargeReady = false;
      player.attackHeld = 0;
      player.attackTimer = 0.34;
      player.attackHit = false;
      player.attackVariant = "side";
      player.chargeFlash = 0.4;
      playSound("whip", 0.55);
      burst(player.x + player.w / 2, player.y + 30, "#ffd065", 22);
      // Run the melee right away with charge bonus marker
      player.attackHit = true;
      playerMelee(true);
    } else if (!actionDown("attack")) {
      player.attackHeld = 0;
    }

    if (player.attackTimer > 0.13 && !player.attackHit) {
      player.attackHit = true;
      playerMelee(false);
    }

    if (actionJust("subweapon") && player.subweaponCooldown <= 0) {
      if (player.curse > 0) {
        message("Cursed — sub-weapon sealed");
        playSound("ui", 0.2);
      } else if (actionDown("down")) {
        cycleSubweapon();
      } else if (actionDown("up") && player.onGround) {
        // Item Crash: 20 hearts for an Ultimate move
        if (player.hearts >= 20) {
          player.hearts -= 20;
          player.subweaponCooldown = 0.9;
          player.invuln = Math.max(player.invuln, 0.5);
          itemCrash(player.subweapon);
        } else {
          message("Item Crash needs 20 hearts");
          playSound("ui", 0.2);
        }
      } else {
        const def = SUBWEAPONS[player.subweapon] || SUBWEAPONS.dagger;
        if (player.hearts >= def.cost) {
          player.hearts -= def.cost;
          player.subweaponCooldown = def.cooldown;
          const shots = def.throw(player, player.facing);
          for (const s of shots) game.projectiles.push(s);
          playSound("whip", 0.32);
        } else {
          message("Not enough hearts");
          playSound("ui", 0.18);
        }
      }
    }

    // Charge-Spell: hold spell key to build a power-cast
    if (actionDown("spell") && player.spellCooldown <= 0 && player.curse <= 0) {
      player.spellHeld += dt;
      if (!player.spellChargeReady && player.spellHeld >= 0.7) {
        player.spellChargeReady = true;
        burst(player.x + player.w / 2, player.y + 28, "#78dbe1", 10);
        playSound("ui", 0.22);
      }
    }
    if (!actionDown("spell") && player.spellChargeReady) {
      // Release: power-spell with 5-way spread, 2x damage
      const cost = (game.save.moonSigil ? 14 : 12);
      if (player.mp >= cost) {
        player.mp -= cost;
        player.spellCooldown = 0.55;
        player.spellChargeReady = false;
        player.spellHeld = 0;
        const arcs = [-0.55, -0.28, 0, 0.28, 0.55];
        for (const arc of arcs) {
          game.projectiles.push({
            from: "player",
            x: player.x + player.w / 2 + player.facing * 28,
            y: player.y + 42,
            w: 22,
            h: 14,
            vx: player.facing * (8.6 - Math.abs(arc) * 1.4),
            vy: arc * 7 - 0.2,
            damage: Math.round((game.save.moonSigil ? 11 : 14) * 2),
            life: 1.4,
            color: "#fff5dd"
          });
        }
        burst(player.x + player.w / 2, player.y + 32, "#78dbe1", 26);
        burst(player.x + player.w / 2, player.y + 32, "#fff5dd", 14);
        game.shake = Math.max(game.shake, 0.7);
        message("Lunar Burst");
        playSound("spell", 0.6);
      } else {
        player.spellChargeReady = false;
        player.spellHeld = 0;
        message("Not enough MP for Lunar Burst");
        playSound("ui", 0.2);
      }
    } else if (!actionDown("spell")) {
      player.spellHeld = 0;
    }

    if (actionJust("spell") && player.spellCooldown <= 0 && player.curse <= 0) {
      const cost = game.save.moonSigil ? 10 : 8;
      if (player.mp >= cost) {
        player.mp -= cost;
        player.spellCooldown = 0.34;
        const arcs = game.save.moonSigil ? [-0.34, 0, 0.34] : [0];
        for (const arc of arcs) {
          game.projectiles.push({
            from: "player",
            x: player.x + player.w / 2 + player.facing * 28,
            y: player.y + 42,
            w: 18,
            h: 12,
            vx: player.facing * (8.0 - Math.abs(arc) * 2),
            vy: arc * 6 - 0.25,
            damage: game.save.moonSigil ? 11 : 14,
            life: 1.2,
            color: game.save.moonSigil ? "#f2cb68" : "#78dbe1"
          });
        }
        playSound("spell");
      } else {
        message("The reliquary is dry");
      }
    }

    const mpRegen = (game.save.equipment && game.save.equipment.phoenixPendant) ? 6.6 : 2.2;
    player.mp = Math.min(player.maxMp, player.mp + dt * mpRegen);
    player.stepWasGrounded = player.onGround;
    moveEntity(player, step, true);
    updateWaterHazards(dt);
    if (player.onGround && player.y < roomHeight() - player.h + 12) {
      game.lastSafeSpot = { roomId: game.roomId, x: player.x, y: player.y };
    }

    if (!player.stepWasGrounded && player.onGround) {
      playSound("land", 0.3);
      burst(player.x + player.w / 2, player.y + player.h, "#927f61", 5);
    }

    if (player.y > roomHeight() + 80) {
      recoverFromVoid();
    }
  }

  function updateWaterHazards(dt) {
    game.waterHazardTimer = Math.max(0, (game.waterHazardTimer || 0) - dt);
    const room = game.room;
    if (!room || !room.waterPits) return;
    const feet = {
      x: player.x + 6,
      y: player.y + player.h - 12,
      w: player.w - 12,
      h: 18
    };
    for (const pit of room.waterPits) {
      if (!rectsOverlap(feet, pit)) continue;
      player.vx *= 0.72;
      player.vy = Math.min(player.vy, -6.4);
      player.y = pit.y - player.h + 2;
      player.onGround = false;
      player.coyote = 0;
      if (game.waterHazardTimer <= 0) {
        game.waterHazardTimer = 0.85;
        hurtPlayer(8);
        if (game.mode !== "playing") return;
        burst(player.x + player.w / 2, pit.y + 4, "#7ee8ff", 18);
        message("Sapphire water rejects you.");
      }
      return;
    }
  }

  function recoverFromVoid() {
    const cx = player.x + player.w / 2;
    const downDoor = game.room.doors.find((door) =>
      door.side === "down" &&
      doorOpen(door) &&
      cx >= door.x - 96 &&
      cx <= door.x + door.w + 96
    );
    if (downDoor) {
      enterRoom(downDoor.to, downDoor.spawn, true, { fromRoomId: game.roomId, usedSide: downDoor.side });
      return;
    }

    hurtPlayer(14);
    if (game.mode !== "playing") return;
    const safe = game.lastSafeSpot && game.lastSafeSpot.roomId === game.roomId
      ? game.lastSafeSpot
      : game.room.spawn;
    placePlayerAtSpawn(game.room, safe);
    player.vx = 0;
    player.vy = 0;
    player.invuln = Math.max(player.invuln, 0.9);
    message("Moon tether caught you.");
  }

  function hitPuzzleSwitches(box) {
    const puzzle = game.room && game.room.puzzle;
    if (!puzzle || puzzleSolved(puzzle.id)) return false;
    let hit = false;
    for (let i = 0; i < puzzle.switches.length; i += 1) {
      const sw = puzzle.switches[i];
      const target = { x: sw.x - 22, y: sw.y - 34, w: 44, h: 48 };
      if (rectsOverlap(box, target)) {
        activatePuzzleSwitch(puzzle, i, sw);
        hit = true;
        break;
      }
    }
    return hit;
  }

  function activatePuzzleSwitch(puzzle, index, sw) {
    const expected = puzzle.sequence[puzzle.step || 0];
    if (index !== expected) {
      if (puzzle.forgiving) {
        const next = puzzle.switches[expected] || puzzle.switches[0];
        game.shake = Math.max(game.shake, 0.12);
        burst(next.x, next.y - 16, next.color || "#fff0cf", 12);
        message(`${puzzle.label}: follow ${next.glyph} next.`);
        playSound("ui", 0.12);
        return;
      }
      puzzle.step = 0;
      game.shake = Math.max(game.shake, 0.45);
      burst(sw.x, sw.y - 16, "#ff5465", 18);
      message(`${puzzle.label}: wrong rune. Sequence reset.`);
      playSound("hit", 0.28);
      return;
    }

    puzzle.step = (puzzle.step || 0) + 1;
    burst(sw.x, sw.y - 16, sw.color || "#f4d38b", 22);
    playSound("spell", 0.22);
    if (puzzle.step >= puzzle.sequence.length) {
      if (!game.save.puzzles) game.save.puzzles = {};
      game.save.puzzles[puzzle.id] = true;
      puzzle.step = puzzle.sequence.length;
      spawnPuzzleReward(game.roomId, puzzle, true);
      message(puzzle.solvedMessage || `${puzzle.label} solved.`);
      game.shake = Math.max(game.shake, 0.8);
      updateMapPanel();
      writeSave();
      return;
    }
    message(`${puzzle.label}: rune ${puzzle.step}/${puzzle.sequence.length}`);
  }

  function playerMelee(charged) {
    const downWhip = player.attackVariant === "down";
    const reach = charged ? Math.round(WHIP_SIDE_REACH * 1.35) : WHIP_SIDE_REACH;
    const height = charged ? Math.round(WHIP_SIDE_HEIGHT * 1.25) : WHIP_SIDE_HEIGHT;
    const box = downWhip
      ? { x: player.x - 28, y: player.y + player.h - 10, w: player.w + 56, h: 96 }
      : {
          x: player.facing > 0 ? player.x + player.w - 10 : player.x - reach + 10,
          y: player.y + 10 - (charged ? 10 : 0),
          w: reach,
          h: height
        };
    let hits = 0;
    slashParticles(box, downWhip);
    if (charged) {
      // Extra particles + screen shake for charge
      burst(player.x + player.w / 2 + player.facing * 60, player.y + 30, "#ffd065", 14);
      burst(player.x + player.w / 2 + player.facing * 80, player.y + 40, "#fff5dd", 8);
      game.shake = Math.max(game.shake, 0.8);
    }
    const meleeBonus = player.baseDamage * 2;
    const chargeMul = charged ? 2.0 : 1.0;
    for (const enemy of game.enemies) {
      if (rectsOverlap(box, enemy)) {
        let dmg = Math.round(((downWhip ? 22 : 26) + meleeBonus) * chargeMul);
        let crit = false;
        if (rollCrit()) { dmg = applyCrit(dmg); crit = true; }
        damageEnemy(enemy, dmg, crit);
        hits += 1;
      }
    }
    if (game.boss && rectsOverlap(box, game.boss)) {
      let dmg = Math.round(((downWhip ? 18 : 20) + meleeBonus) * chargeMul);
      let crit = false;
      if (rollCrit()) { dmg = applyCrit(dmg); crit = true; }
      damageBoss(dmg, crit);
      hits += 1;
    }
    for (const candle of game.candles) {
      if (!candle.broken && rectsOverlap(box, { x: candle.x - 12, y: candle.y - 18, w: 24, h: 30 })) {
        breakCandle(candle);
        hits += 1;
      }
    }
    if (hitPuzzleSwitches(box)) hits += 1;
    // Treasure chests
    if (game.chests) {
      for (const chest of game.chests) {
        if (!chest.opened && rectsOverlap(box, chestHitBox(chest))) {
          openChest(chest);
        }
      }
    }
    if (downWhip && hits > 0) {
      player.vy = -10.2;
      player.jumps = Math.min(player.jumps, 1);
      player.jumpBuffer = 0;
      burst(player.x + player.w / 2, player.y + player.h, "#8bd7ff", 13);
      message("Moon pogo");
      playSound("jump", 0.24);
    }
  }

  function slashParticles(box, downWhip = false) {
    for (let i = 0; i < 10; i += 1) {
      game.particles.push({
        x: box.x + Math.random() * box.w,
        y: box.y + Math.random() * box.h,
        vx: downWhip ? -1.6 + Math.random() * 3.2 : player.facing * (1 + Math.random() * 3),
        vy: downWhip ? 1 + Math.random() * 3 : -1 + Math.random() * 2,
        life: 0.18 + Math.random() * 0.16,
        maxLife: 0.32,
        color: downWhip ? (i % 2 ? "#8bd7ff" : "#f0bf61") : i % 2 ? "#f0bf61" : "#e95a45",
        size: 2 + Math.random() * 3
      });
    }
  }

  function updateCamera(snap) {
    const maxX = Math.max(0, roomWidth() - W);
    const maxY = Math.max(0, roomHeight() - H);
    const lookAhead = clamp(player.vx * 18, -110, 110);
    const lookVertical = clamp(player.vy * 8, -70, 70);
    const target = clamp(player.x + player.w / 2 - W * 0.44 + lookAhead, 0, maxX);
    const targetY = clamp(player.y + player.h / 2 - H * 0.58 + lookVertical, 0, maxY);
    game.cameraTargetX = target;
    game.cameraTargetY = targetY;
    game.cameraX = snap ? target : game.cameraX + (target - game.cameraX) * 0.14;
    game.cameraY = snap ? targetY : game.cameraY + (targetY - game.cameraY) * 0.16;
    if (Math.abs(game.cameraX - target) < 0.5) game.cameraX = target;
    if (Math.abs(game.cameraY - targetY) < 0.5) game.cameraY = targetY;
  }

  function moveEntity(ent, step, clampToRoom) {
    ent.onGround = false;
    const prevX = ent.x;
    const prevY = ent.y;
    const prevBottom = prevY + ent.h;

    // X-axis: only thick platforms block horizontally. Thin platforms are
    // one-way ledges you can run past freely.
    ent.x += ent.vx * step;
    for (const solid of collisionPlatforms()) {
      if (solid.h <= 44) continue;
      if (rectsOverlap(ent, solid)) {
        // Resolve based on previous side, not current vx (handles vx==0 cases)
        if (prevX + ent.w <= solid.x + 0.01) {
          ent.x = solid.x - ent.w;
        } else if (prevX >= solid.x + solid.w - 0.01) {
          ent.x = solid.x + solid.w;
        } else if (ent.vx > 0) {
          ent.x = solid.x - ent.w;
        } else if (ent.vx < 0) {
          ent.x = solid.x + solid.w;
        }
        ent.vx = 0;
      }
    }

    // Y-axis: thin platforms only land you if you were above last frame and
    // are descending. Thick platforms also block ceilings.
    ent.y += ent.vy * step;
    for (const solid of collisionPlatforms()) {
      if (!rectsOverlap(ent, solid)) continue;
      const isThin = solid.h <= 44;
      if (isThin) {
        // One-way: land only if previous bottom was at or above the platform
        // top AND we're not moving upward.
        if (ent.vy >= 0 && prevBottom <= solid.y + 0.5) {
          ent.y = solid.y - ent.h;
          ent.vy = 0;
          ent.onGround = true;
        }
        // Otherwise, ignore — pass through from the side or below.
      } else {
        if (ent.vy >= 0) {
          ent.y = solid.y - ent.h;
          ent.vy = 0;
          ent.onGround = true;
        } else {
          ent.y = solid.y + solid.h;
          ent.vy = 0;
        }
      }
    }

    if (clampToRoom) {
      ent.x = clamp(ent.x, -12, roomWidth() - ent.w + 12);
    }
  }

  function containEnemyPatrol(enemy) {
    if (!Number.isFinite(enemy.min) || !Number.isFinite(enemy.max)) return;
    if (enemy.x < enemy.min) {
      enemy.x = enemy.min;
      enemy.vx = Math.abs(enemy.vx || enemy.cfg.speed * 0.5);
      enemy.facing = 1;
    } else if (enemy.x > enemy.max) {
      enemy.x = enemy.max;
      enemy.vx = -Math.abs(enemy.vx || enemy.cfg.speed * 0.5);
      enemy.facing = -1;
    }
  }

  function updateEnemies(step, dt) {
    const playerCenterX = player.x + player.w / 2;
    for (const enemy of game.enemies) {
      enemy.cooldown -= dt;
      enemy.hurt = Math.max(0, enemy.hurt - dt);
      enemy.attackWindup = Math.max(0, (enemy.attackWindup || 0) - dt);
      const cfg = enemy.cfg;
      const center = enemy.x + enemy.w / 2;
      enemy.facing = playerCenterX > center ? 1 : -1;

      if (cfg.ai === "walker" || cfg.ai === "thrower" || cfg.ai === "guard") {
        const desired = cfg.ai === "guard" && Math.abs(player.x - enemy.x) < 170 ? enemy.facing : Math.sign(enemy.vx || 1);
        enemy.vx += desired * cfg.speed * 0.05 * step;
        enemy.vx = clamp(enemy.vx, -cfg.speed, cfg.speed);
        if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
        enemy.vy += GRAVITY * step;
        moveEntity(enemy, step, false);
        if (cfg.ai !== "walker" && enemy.cooldown <= 0 && Math.abs(player.x - enemy.x) < 430) {
          shootEnemy(enemy, cfg.ai === "guard" ? 6.2 : 4.6, cfg.ai === "guard" ? "#f0bf61" : "#dce8d8");
          enemy.cooldown = cfg.ai === "guard" ? 1.2 : 1.6;
        }
      } else if (cfg.ai === "turret") {
        enemy.vx = 0;
        enemy.vy += GRAVITY * step;
        moveEntity(enemy, step, false);
        if (enemy.cooldown <= 0) {
          shootEnemy(enemy, 4.7, "#98e8c8");
          enemy.cooldown = 1.35;
        }
      } else if (cfg.ai === "wraith") {
        // Warden fights: room-locking milestone bosses with phase pressure.
        const isInkWarden = enemy.type === "inkWarden";
        const isQuestWarden = enemy.type === "starWarden" || enemy.type === "tideWarden";
        const isFullBoss = Boolean(cfg.fullBoss);
        const activeFullBoss = isFullBoss && enemy.awakened;
        enemy.vy += GRAVITY * step;
        const dist = playerCenterX - center;
        const dir = Math.sign(dist || enemy.facing);
        if (activeFullBoss && !enemy.phaseTwo && enemy.hp < enemy.maxHp * 0.52) {
          enemy.phaseTwo = true;
          enemy.cooldown = Math.min(enemy.cooldown, 0.35);
          enemy.specialCooldown = 0.15;
          enemy.attackWindup = 1.0;
          game.shake = Math.max(game.shake, 1.7);
          game.bossBanner = { name: cfg.banner || "Warden", subtitle: "Second Movement", t: 0, life: 2.6, phase: 2 };
          burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, isInkWarden ? "#bfa0ff" : enemy.type === "starWarden" ? "#ffd56a" : "#42dfff", 64);
          playSound("bossRoar", 0.72);
        }
        if (enemy.lunge > 0) {
          enemy.lunge -= dt;
          enemy.vx = dir * (activeFullBoss ? (enemy.phaseTwo ? 7.6 : 6.8) : isInkWarden ? 6.2 : isQuestWarden ? 6.0 : 5.4);
        } else {
          const pressure = activeFullBoss && Math.abs(dist) < 660 ? (enemy.phaseTwo ? 0.14 : 0.11) : (isInkWarden || isQuestWarden) && Math.abs(dist) < 540 ? 0.09 : 0.06;
          enemy.vx += dir * cfg.speed * pressure * step;
          const speedMul = activeFullBoss ? (enemy.phaseTwo ? 1.62 : 1.38) : (isInkWarden || isQuestWarden ? 1.22 : 1);
          enemy.vx = clamp(enemy.vx, -cfg.speed * speedMul, cfg.speed * speedMul);
        }
        if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
        moveEntity(enemy, step, false);
        if (isFullBoss && !enemy.awakened) {
          if (Math.abs(dist) < 430 || enemy.hurt > 0) awakenWarden(enemy);
          else {
            enemy.cooldown = Math.max(enemy.cooldown, 0.45);
            continue;
          }
        }
        if (activeFullBoss) {
          enemy.specialCooldown = Math.max(0, (enemy.specialCooldown || 0) - dt);
          if (enemy.specialCooldown <= 0) {
            wardenSpecial(enemy, dir);
            enemy.specialCooldown = enemy.phaseTwo ? 2.0 : 2.8;
          }
        }
        if (enemy.cooldown <= 0) {
          const closeRange = activeFullBoss ? 330 : (isInkWarden || isQuestWarden ? 270 : 220);
          const lungeChance = activeFullBoss ? (enemy.phaseTwo ? 0.82 : 0.68) : (isInkWarden || isQuestWarden ? 0.72 : 0.6);
          if (Math.abs(dist) < closeRange && Math.random() < lungeChance) {
            enemy.lunge = activeFullBoss ? (enemy.phaseTwo ? 0.66 : 0.58) : isInkWarden || isQuestWarden ? 0.58 : 0.5;
            enemy.attackWindup = activeFullBoss ? 0.88 : isInkWarden || isQuestWarden ? 0.68 : 0.5;
            enemy.cooldown = activeFullBoss ? (enemy.phaseTwo ? 1.05 : 1.35) : isInkWarden ? 1.55 : isQuestWarden ? 1.65 : 2.2;
            burst(enemy.x + enemy.w / 2, enemy.y + 24, activeFullBoss ? wardenColor(enemy) : "#bfa0ff", activeFullBoss ? 22 : 14);
            playSound("bossRoar", activeFullBoss ? 0.28 : 0.18);
          } else {
            enemy.attackWindup = activeFullBoss ? 1.02 : isInkWarden || isQuestWarden ? 0.9 : 0.72;
            const fan = activeFullBoss
              ? (enemy.phaseTwo ? [-0.5, -0.34, -0.18, 0, 0.18, 0.34, 0.5] : [-0.38, -0.2, 0, 0.2, 0.38])
              : isInkWarden || isQuestWarden ? [-0.34, -0.16, 0, 0.16, 0.34] : [-0.18, 0, 0.18];
            for (const angle of fan) {
              const sp = activeFullBoss ? (enemy.phaseTwo ? 6.25 : 5.75) : isInkWarden || isQuestWarden ? 5.45 : 4.6;
              game.projectiles.push({
                from: "enemy",
                x: enemy.x + enemy.w / 2,
                y: enemy.y + enemy.h * 0.4,
                w: activeFullBoss ? 24 : isInkWarden || isQuestWarden ? 22 : 18, h: activeFullBoss ? 22 : isInkWarden || isQuestWarden ? 20 : 18,
                vx: dir * (sp - Math.abs(angle) * (activeFullBoss ? 0.7 : isInkWarden || isQuestWarden ? 0.9 : 1.2)),
                vy: angle * (activeFullBoss ? 7.6 : isInkWarden || isQuestWarden ? 6.8 : 6),
                damage: cfg.damage,
                life: activeFullBoss ? 2.65 : isInkWarden || isQuestWarden ? 2.35 : 2.0,
                color: wardenColor(enemy)
              });
            }
            enemy.cooldown = activeFullBoss ? (enemy.phaseTwo ? 0.95 : 1.18) : isInkWarden ? 1.28 : isQuestWarden ? 1.34 : 1.7;
          }
        }
      } else if (cfg.ai === "zora") {
        enemy.vy += GRAVITY * step;
        const patrol = Math.sin(game.time * 1.8 + enemy.phase) * cfg.speed;
        enemy.vx += (patrol - enemy.vx) * 0.04 * step;
        enemy.vx = clamp(enemy.vx, -cfg.speed, cfg.speed);
        if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
        moveEntity(enemy, step, false);
        containEnemyPatrol(enemy);
        if (enemy.cooldown <= 0 && Math.abs(player.x - enemy.x) < 620) {
          enemy.attackWindup = 0.72;
          shootEnemy(enemy, 5.2, "#8ff8ff", cfg.damage, { w: 22, h: 12, yMul: 0.34 });
          burst(enemy.x + enemy.w / 2 + enemy.facing * 18, enemy.y + enemy.h * 0.35, "#8ff8ff", 9);
          enemy.cooldown = 2.15 + Math.random() * 0.6;
        }
      } else if (cfg.ai === "panther") {
        enemy.vy += GRAVITY * step;
        const dist = playerCenterX - center;
        const hunt = Math.abs(dist) < 520;
        const dir = hunt ? Math.sign(dist || enemy.facing) : Math.sign(enemy.vx || 1);
        const targetSpeed = hunt ? cfg.speed : cfg.speed * 0.48;
        if (enemy.lunge > 0) {
          enemy.lunge -= dt;
          enemy.vx = enemy.facing * cfg.speed * 1.7;
        } else {
          enemy.vx += dir * 0.18 * step;
          enemy.vx = clamp(enemy.vx, -targetSpeed, targetSpeed);
          if (enemy.onGround && hunt && Math.abs(dist) < 260 && enemy.cooldown <= 0) {
            enemy.facing = dir;
            enemy.lunge = 0.42;
            enemy.attackWindup = 0.55;
            enemy.vx = dir * cfg.speed * 1.85;
            enemy.vy = -5.8;
            enemy.cooldown = 1.6;
            burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#1d2540", 10);
          }
        }
        if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
        moveEntity(enemy, step, false);
        containEnemyPatrol(enemy);
      } else if (cfg.ai === "leaper") {
        enemy.vy += GRAVITY * step;
        if (enemy.onGround && enemy.cooldown <= 0) {
          enemy.vx = enemy.facing * 3.6;
          enemy.vy = -10.2;
          enemy.cooldown = 1.8;
        }
        moveEntity(enemy, step, false);
        if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
      } else {
        const targetY = player.y + (cfg.ai === "sine" ? 12 : -4);
        const dx = Math.sign(player.x - enemy.x);
        const dy = Math.sign(targetY - enemy.y);
        const pulse = Math.sin(game.time * 3 + enemy.phase);
        enemy.x += (dx * cfg.speed + pulse * 0.45) * step;
        enemy.y += (dy * cfg.speed * 0.46 + pulse * 0.35) * step;
        enemy.x = clamp(enemy.x, enemy.min, enemy.max);
        enemy.y = clamp(enemy.y, 68, 398);
        if ((cfg.ai === "witch" || cfg.ai === "reaper" || cfg.ai === "ghost") && enemy.cooldown <= 0) {
          shootEnemy(enemy, cfg.ai === "reaper" ? 5.8 : 4.2, cfg.ai === "witch" ? "#bb7dff" : "#9af5df");
          enemy.cooldown = cfg.ai === "reaper" ? 1.1 : 1.7;
        }
      }

      if (rectsOverlap(player, enemy)) {
        hurtPlayer(cfg.damage);
        if (player.invuln > 0.4) {
          // Apply status effect on contact based on enemy type
          if (enemy.type === "drowned") applyPoison(4.5);
          else if (enemy.type === "zora") applySlow(1.8);
          else if (enemy.type === "witch") applyCurse(3.5);
          else if (enemy.type === "medusa") applySlow(3.0);
        }
      }
    }
  }

  function shootEnemy(enemy, speed, color, damage = 6, opts = {}) {
    const dx = player.x + player.w / 2 - (enemy.x + enemy.w / 2);
    const dy = player.y + player.h / 2 - (enemy.y + enemy.h / 2);
    const len = Math.max(1, Math.hypot(dx, dy));
    const w = opts.w || 16;
    const h = opts.h || 16;
    game.projectiles.push({
      from: "enemy",
      x: enemy.x + enemy.w / 2,
      y: enemy.y + enemy.h * (opts.yMul || 0.38),
      w,
      h,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed,
      damage,
      life: 2.2,
      color
    });
  }

  function wardenColor(enemy) {
    if (enemy.type === "tideWarden") return "#42dfff";
    if (enemy.type === "starWarden") return "#ffd56a";
    if (enemy.type === "inkWarden") return "#bfa0ff";
    return "#c9a8ff";
  }

  function awakenWarden(enemy) {
    if (!enemy || enemy.awakened) return;
    enemy.awakened = true;
    enemy.cooldown = 0.35;
    enemy.specialCooldown = 0.7;
    enemy.attackWindup = 1.0;
    game.bossBanner = { name: enemy.cfg.banner || "Seal Warden", subtitle: enemy.cfg.subtitle || "Milestone Boss", t: 0, life: 3.2 };
    message(`${enemy.cfg.banner || "Warden"} awakens.`);
    burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, wardenColor(enemy), 46);
    playMusic("boss");
    playSound("bossRoar", 0.68);
  }

  function wardenSpecial(enemy, dir) {
    const color = wardenColor(enemy);
    enemy.attackWindup = Math.max(enemy.attackWindup || 0, 0.9);
    playSound("spell", 0.42);
    if (enemy.type === "starWarden") {
      const count = enemy.phaseTwo ? 6 : 4;
      for (let i = 0; i < count; i += 1) {
        const x = clamp(player.x - 180 + i * (360 / Math.max(1, count - 1)), 90, roomWidth() - 110);
        game.projectiles.push({
          from: "enemy",
          x,
          y: 40 + (i % 2) * 26,
          w: 24,
          h: 24,
          vx: (Math.random() - 0.5) * 0.55,
          vy: enemy.phaseTwo ? 6.6 : 5.4,
          gravity: 0.06,
          damage: enemy.cfg.damage + 1,
          life: 2.3,
          color
        });
        burst(x, 84, color, 8);
      }
      message("Starfall pattern!");
      return;
    }
    if (enemy.type === "tideWarden") {
      const waves = enemy.phaseTwo ? [-0.28, -0.12, 0.04, 0.2, 0.36] : [-0.18, 0, 0.18];
      for (const wave of waves) {
        game.projectiles.push({
          from: "enemy",
          x: enemy.x + enemy.w / 2,
          y: enemy.y + enemy.h * 0.72,
          w: 34,
          h: 16,
          vx: dir * (6.1 - Math.abs(wave) * 1.5),
          vy: wave * 7.8 - 0.5,
          gravity: 0.035,
          damage: enemy.cfg.damage + 1,
          life: 2.6,
          color
        });
      }
      burst(enemy.x + enemy.w / 2, enemy.y + enemy.h * 0.7, color, 24);
      message("Tide surge!");
      return;
    }
    const count = enemy.phaseTwo ? 5 : 3;
    for (let i = 0; i < count; i += 1) {
      const angle = (i - (count - 1) / 2) * 0.18;
      game.projectiles.push({
        from: "enemy",
        x: enemy.x + enemy.w / 2,
        y: enemy.y + enemy.h * 0.34,
        w: 26,
        h: 26,
        vx: dir * (5.8 - Math.abs(angle) * 2),
        vy: angle * 9.4 - 0.25,
        gravity: 0.02,
        damage: enemy.cfg.damage + 1,
        life: 2.45,
        color
      });
    }
    burst(enemy.x + enemy.w / 2, enemy.y + enemy.h * 0.34, color, 22);
    message("Ink omen!");
  }

  function updateBoss(step, dt) {
    const boss = game.boss;
    if (!boss) return;

    boss.cooldown -= dt;
    boss.stateTimer -= dt;
    boss.hurt = Math.max(0, boss.hurt - dt);
    boss.facing = player.x > boss.x ? 1 : -1;

    // Trigger Phase 2 the first time HP drops below 50%
    if (!boss.phaseTwo && boss.hp < boss.maxHp * 0.5) {
      boss.phaseTwo = true;
      boss.invuln = 0.5;
      game.shake = 2.0;
      game.bossBanner = { name: "Lord Veyr", subtitle: "Bloodmoon Frenzy", t: 0, life: 2.6, phase: 2 };
      burst(boss.x + boss.w / 2, boss.y + boss.h / 2, "#ff5465", 60);
      burst(boss.x + boss.w / 2, boss.y + boss.h / 2, "#f4d38b", 30);
      playSound("bossRoar", 0.8);
      message("Lord Veyr enters Bloodmoon Frenzy!");
    }

    const fast = boss.phaseTwo;
    const dashSpeed = fast ? 8.4 : 6.2;
    const dashDur = fast ? 0.62 : 0.48;
    const castDur = fast ? 0.54 : 0.66;
    const restAfterCast = fast ? 0.58 : 0.96;
    const restAfterDash = fast ? 0.48 : 0.86;
    const stalkDamping = fast ? 2.0 : 1.35;

    if (boss.state === "dash") {
      boss.vx = boss.facing * dashSpeed;
      if (boss.stateTimer <= 0) {
        boss.state = "stalk";
        boss.cooldown = restAfterDash;
      }
    } else if (boss.state === "cast") {
      boss.vx *= 0.8;
      if (boss.stateTimer <= 0) {
        boss.state = "stalk";
        boss.cooldown = restAfterCast;
      }
    } else {
      boss.vx += boss.facing * 0.035 * step;
      boss.vx = clamp(boss.vx, -stalkDamping, stalkDamping);
      if (boss.cooldown <= 0) {
        // Phase 2 weights more attacks AND chains volleys
        if (fast) {
          if (Math.random() < 0.7) {
            boss.state = "cast";
            boss.stateTimer = castDur;
            bossVolley(boss);
            // Second volley a beat later
            setTimeout(() => { if (game.boss === boss && !game.paused) bossVolley(boss); }, 250);
          } else {
            boss.state = "dash";
            boss.stateTimer = dashDur;
          }
        } else {
          if (boss.hp < boss.maxHp * 0.52 || Math.random() > 0.48) {
            boss.state = "cast";
            boss.stateTimer = castDur;
            bossVolley(boss);
          } else {
            boss.state = "dash";
            boss.stateTimer = dashDur;
          }
        }
      }
    }

    boss.vy += GRAVITY * step;
    moveEntity(boss, step, false);
    boss.x = clamp(boss.x, 140, 828);

    if (rectsOverlap(player, boss)) hurtPlayer(boss.state === "dash" ? (fast ? 22 : 16) : (fast ? 15 : 11));
  }

  function bossVolley(boss) {
    playSound("spell", 0.45);
    const angles = boss.phaseTwo ? [-0.38, -0.18, 0, 0.18, 0.38] : [-0.3, 0, 0.3];
    for (const angle of angles) {
      const dir = boss.facing;
      game.projectiles.push({
        from: "enemy",
        x: boss.x + boss.w / 2,
        y: boss.y + 58,
        w: 22,
        h: 22,
        vx: dir * ((boss.phaseTwo ? 6.7 : 5.9) - Math.abs(angle) * 2),
        vy: angle * (boss.phaseTwo ? 9.6 : 8.2),
        damage: boss.phaseTwo ? 11 : 9,
        life: boss.phaseTwo ? 2.35 : 2.05,
        color: "#ff5465"
      });
    }
  }

  function projectileImpactExpires(shot) {
    if (shot.kind === "subweapon" && shot.subType === "boomerang" && (shot.pierce || 0) > 0) {
      shot.pierce -= 1;
      return false;
    }
    return true;
  }

  function updateBoomerangShot(shot, dt, step) {
    if (shot.subType !== "boomerang") return;
    shot.spin = (shot.spin || 0) + step * 0.36;
    shot.returnTimer = (shot.returnTimer || 0) - dt;
    if (shot.returnTimer <= 0) {
      const tx = player.x + player.w / 2;
      const ty = player.y + player.h * 0.42;
      const cx = shot.x + shot.w / 2;
      const cy = shot.y + shot.h / 2;
      const dx = tx - cx;
      const dy = ty - cy;
      const dist = Math.max(1, Math.hypot(dx, dy));
      shot.vx = clamp(shot.vx + (dx / dist) * 0.42 * step, -10, 10);
      shot.vy = clamp(shot.vy + (dy / dist) * 0.34 * step, -8, 8);
      if (dist < 30) shot.life = 0;
    }
  }

  function updateProjectiles(step, dt) {
    const arr = game.projectiles;
    const rw = roomWidth();
    const rh = roomHeight();
    let w = 0;
    for (let r = 0; r < arr.length; r += 1) {
      const shot = arr[r];
      shot.life -= dt;
      shot.x += shot.vx * step;
      shot.y += shot.vy * step;
      const grav = shot.gravity != null ? shot.gravity : (shot.from === "player" ? 0 : 0.02);
      shot.vy += grav * step;
      if (shot.subType === "axe") shot.spin = (shot.spin || 0) + step * 0.45;
      updateBoomerangShot(shot, dt, step);

      if (shot.from === "player") {
        for (const enemy of game.enemies) {
          if (shot.life > 0 && rectsOverlap(shot, enemy)) {
            damageEnemy(enemy, shot.damage);
            if (projectileImpactExpires(shot)) shot.life = 0;
          }
        }
        if (game.boss && shot.life > 0 && rectsOverlap(shot, game.boss)) {
          damageBoss(shot.damage);
          if (projectileImpactExpires(shot)) shot.life = 0;
        }
        if (shot.life > 0) {
          for (const candle of game.candles) {
            if (!candle.broken && rectsOverlap(shot, { x: candle.x - 12, y: candle.y - 18, w: 24, h: 30 })) {
              breakCandle(candle);
              // Axe and holy water keep flying after breaking a candle (they're heavy/pierce candles)
              if (shot.kind !== "subweapon" || shot.subType === "dagger") shot.life = 0;
              break;
            }
          }
        }
        if (shot.life > 0 && hitPuzzleSwitches(shot)) {
          if (shot.kind !== "subweapon" || shot.subType === "dagger") shot.life = 0;
        }
        // Holy water lands and spawns flame puddle
        if (shot.life > 0 && shot.kind === "subweapon" && shot.subType === "holyWater" && shot.flameOnLand) {
          for (const solid of collisionPlatforms()) {
            if (shot.vy >= 0 && rectsOverlap(shot, solid) && shot.y + shot.h <= solid.y + 18) {
              spawnFlame(shot.x + shot.w / 2 - 22, solid.y - 18);
              shot.life = 0;
              break;
            }
          }
        }
      } else if (rectsOverlap(shot, player)) {
        shot.life = 0;
        hurtPlayer(shot.damage);
      }

      if (shot.life > 0 && shot.x > -80 && shot.x < rw + 80 && shot.y > -80 && shot.y < rh + 80) {
        if (w !== r) arr[w] = shot;
        w += 1;
      }
    }
    arr.length = w;
  }

  function updatePickups(dt) {
    const arr = game.pickups;
    const step = Math.min(2, dt * 60);
    let w = 0;
    for (let r = 0; r < arr.length; r += 1) {
      const drop = arr[r];
      drop.bob += dt * 5;
      // Falling candle drops: simple gravity + platform landing
      if (drop.fall && !drop.landed) {
        drop.vy = (drop.vy || 0) + 0.42 * step;
        drop.x += (drop.vx || 0) * step;
        drop.y += drop.vy * step;
        for (const solid of collisionPlatforms()) {
          if (rectsOverlap(drop, solid) && drop.vy >= 0 && drop.y + drop.h <= solid.y + 12) {
            drop.y = solid.y - drop.h;
            drop.vy = 0;
            drop.vx = 0;
            drop.landed = true;
            break;
          }
        }
        // Lifetime so they don't pile up forever
        drop.fallLife = (drop.fallLife || 5) - dt;
        if (drop.fallLife <= 0) drop.dead = true;
      }
      if (!drop.dead && rectsOverlap(player, drop)) {
        collectItem(drop);
      }
      if (!drop.dead) {
        if (w !== r) arr[w] = drop;
        w += 1;
      }
    }
    arr.length = w;
  }

  function updateParticles(step, dt) {
    const arr = game.particles;
    let w = 0;
    for (let r = 0; r < arr.length; r += 1) {
      const dot = arr[r];
      dot.life -= dt;
      if (dot.life > 0) {
        dot.x += dot.vx * step;
        dot.y += dot.vy * step;
        dot.vy += 0.06 * step;
        if (w !== r) arr[w] = dot;
        w += 1;
      }
    }
    arr.length = w;
  }

  function itemCrash(kind) {
    game.shake = Math.max(game.shake, 1.6);
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    if (kind === "dagger") {
      // Silver Storm: fan of 8 daggers
      message("Item Crash: Silver Storm");
      playSound("whip", 0.4);
      for (let i = 0; i < 8; i += 1) {
        const angle = -Math.PI / 2 + ((i / 7) - 0.5) * Math.PI * 0.9;
        const speed = 13;
        game.projectiles.push({
          from: "player", kind: "subweapon", subType: "dagger",
          x: cx, y: cy,
          w: 22, h: 8,
          vx: Math.cos(angle) * speed * (player.facing > 0 ? 1 : -1),
          vy: Math.sin(angle) * speed,
          gravity: 0,
          damage: 18 + player.baseDamage * 2,
          life: 1.6,
          color: "#e6f1ff"
        });
      }
      burst(cx, cy, "#e6f1ff", 30);
    } else if (kind === "axe") {
      // Crescent Slam: ground shockwave traveling both directions
      message("Item Crash: Crescent Slam");
      playSound("hit", 0.5);
      const groundY = player.y + player.h - 4;
      for (let dir of [-1, 1]) {
        for (let i = 0; i < 4; i += 1) {
          game.projectiles.push({
            from: "player", kind: "subweapon", subType: "axe",
            x: cx + dir * (24 + i * 18),
            y: groundY - 14 - i * 4,
            w: 30, h: 22,
            vx: dir * (8 + i * 0.6),
            vy: -2 - i * 0.2,
            gravity: 0.18,
            damage: 30 + player.baseDamage * 3,
            spin: i * 0.8,
            life: 1.4,
            color: "#cfa45a"
          });
        }
      }
      burst(cx, groundY, "#cfa45a", 40);
      burst(cx, groundY, "#f0bf61", 22);
    } else if (kind === "holyWater") {
      // Sacred Rain: 6 vials drop across the room
      message("Item Crash: Sacred Rain");
      playSound("spell", 0.5);
      const rw = roomWidth();
      for (let i = 0; i < 6; i += 1) {
        const dropX = clamp(cx - rw * 0.4 + (i / 5) * rw * 0.8, 40, rw - 40);
        game.projectiles.push({
          from: "player", kind: "subweapon", subType: "holyWater",
          x: dropX, y: -20 + i * 6,
          w: 16, h: 16,
          vx: 0, vy: 4 + Math.random() * 1.2,
          gravity: 0.55,
          damage: 12 + player.baseDamage * 2,
          flameOnLand: true,
          life: 4,
          color: "#bfe7ff"
        });
      }
      burst(cx, cy - 20, "#bfe7ff", 30);
    } else if (kind === "boomerang") {
      message("Item Crash: Mirror Orbit");
      playSound("spell", 0.48);
      for (let i = 0; i < 6; i += 1) {
        const a = (Math.PI * 2 * i) / 6;
        game.projectiles.push({
          from: "player", kind: "subweapon", subType: "boomerang",
          owner: player,
          x: cx + Math.cos(a) * 26,
          y: cy + Math.sin(a) * 18,
          w: 30, h: 18,
          vx: Math.cos(a) * 8.8,
          vy: Math.sin(a) * 5.2,
          gravity: 0,
          damage: 18 + player.baseDamage * 2,
          spin: i,
          returnTimer: 0.28,
          pierce: 5,
          life: 2.1,
          color: "#f7d988"
        });
      }
      burst(cx, cy, "#f7d988", 38);
    }
  }

  function cycleSubweapon() {
    const order = ["dagger", "axe", "holyWater", "boomerang"];
    const owned = game.save.ownedSubweapons;
    const filtered = order.filter((k) => owned[k]);
    if (filtered.length <= 1) {
      message(`Sub-Weapon: ${SUBWEAPONS[player.subweapon].label}`);
      return;
    }
    const idx = filtered.indexOf(player.subweapon);
    const next = filtered[(idx + 1) % filtered.length];
    player.subweapon = next;
    game.save.subweapon = next;
    player.subweaponCooldown = 0.18;
    message(`Sub-Weapon: ${SUBWEAPONS[next].label}`);
    playSound("ui", 0.22);
    updateMapPanel();
  }

  function updateCandles(dt) {
    for (const candle of game.candles) {
      candle.flame += dt * 6;
    }
  }

  function updateFlames(step, dt) {
    const arr = game.flames;
    let w = 0;
    for (let r = 0; r < arr.length; r += 1) {
      const f = arr[r];
      f.life -= dt;
      f.flicker = (f.flicker || 0) + dt * 9;
      if (f.life > 0) {
        f.tick -= dt;
        if (f.tick <= 0) {
          f.tick = 0.18;
          for (const enemy of game.enemies) {
            if (rectsOverlap(f, enemy)) damageEnemy(enemy, f.damage);
          }
          if (game.boss && rectsOverlap(f, game.boss)) damageBoss(f.damage);
        }
        if (w !== r) arr[w] = f;
        w += 1;
      }
    }
    arr.length = w;
  }

  function breakCandle(candle) {
    candle.broken = true;
    burst(candle.x, candle.y - 4, "#f4d38b", 12);
    burst(candle.x, candle.y - 4, "#ff8e3a", 6);
    playSound("pickup", 0.18);
    spawnCandleDrop(candle);
  }

  // ===== Treasure Chests =====
  function openChest(chest) {
    chest.opened = true;
    if (!game.save.openedChests) game.save.openedChests = {};
    game.save.openedChests[`${game.roomId}:${chest.id}`] = true;
    burst(chest.x + 18, chest.y, "#ffd065", 28);
    burst(chest.x + 18, chest.y, "#fff5dd", 14);
    game.shake = Math.max(game.shake, 0.6);
    playSound("heart", 0.45);
    message(`Treasure! ${chestLootLabel(chest.loot)}`);
    spawnChestLoot(chest);
    writeSave();
  }
  function chestLootLabel(loot) {
    if (loot === "subAxe") return "War Axe";
    if (loot === "subHolyWater") return "Holy Water";
    if (loot === "subBoomerang") return "Moon Boomerang";
    if (loot === "phoenixPendant") return "Phoenix Pendant";
    if (loot === "heartCache") return "Heart Cache (+25 Hearts)";
    if (loot === "manaPool") return "Mana Pool (+24 MP)";
    return "Trinket";
  }
  function spawnChestLoot(chest) {
    const loot = chest.loot;
    if (loot === "heartCache") {
      player.hearts = Math.min(player.maxHearts, player.hearts + 25);
      return;
    }
    if (loot === "manaPool") {
      player.mp = Math.min(player.maxMp, player.mp + 24);
      return;
    }
    // Otherwise spawn the corresponding pickup
    game.pickups.push({
      id: `chest_${chest.id}_${game.time}`,
      type: loot,
      x: chest.x + 4, y: chest.y - 24,
      w: 28, h: 28,
      vx: (Math.random() - 0.5) * 1.4,
      vy: -4.2,
      bob: 0,
      fall: true
    });
  }
  function updateChests() { /* chests are static, hits handled via playerMelee */ }

  // ===== Ambient Biome Particles =====
  function ambientConfig(room) {
    if (!room) return null;
    const b = room.bg;
    if (b === "bgForest") return { kind: "leaf", color: "#7be09a", count: 22, speedX: -0.6, speedY: 0.45 };
    if (b === "bgCastleGarden" || b === "bgGarden") return { kind: "petal", color: "#ff9ec0", count: 18, speedX: -0.4, speedY: 0.4 };
    if (b === "bgGate") return { kind: "ash", color: "#d8c89a", count: 14, speedX: -0.3, speedY: 0.3 };
    if (b === "bgLibrary" || b === "bgArchive") return { kind: "dust", color: "#d8c890", count: 16, speedX: 0.15, speedY: 0.18 };
    if (b === "bgMirrorCloister") return { kind: "dust", color: "#dfe9ff", count: 14, speedX: 0.12, speedY: 0.12 };
    if (b === "bgEmberFoundry") return { kind: "ember", color: "#ff7a4f", count: 20, speedX: -0.08, speedY: -0.52 };
    if (b === "bgMoonwell") return { kind: "spore", color: "#8bd7ff", count: 20, speedX: 0.08, speedY: -0.32 };
    if (b === "bgClock" || b === "bgBelltower" || b === "bgLoft") return { kind: "spark", color: "#ffd065", count: 14, speedX: 0.2, speedY: -0.3 };
    if (b === "bgCavern" || b === "bgAqueduct") return { kind: "spore", color: "#9af5df", count: 18, speedX: 0.1, speedY: -0.4 };
    if (b === "bgCrypt" || b === "bgOssuary") return { kind: "mist", color: "#86d8ff", count: 12, speedX: 0.08, speedY: -0.2 };
    if (b === "bgThrone") return { kind: "ember", color: "#ff5465", count: 16, speedX: -0.1, speedY: -0.4 };
    return null;
  }
  function updateAmbient(dt) {
    if (!game.ambient) game.ambient = [];
    const cfg = ambientConfig(game.room);
    if (!cfg) { game.ambient.length = 0; return; }
    // Top-up
    while (game.ambient.length < cfg.count) {
      game.ambient.push(spawnAmbient(cfg, true));
    }
    const arr = game.ambient;
    let w = 0;
    const rw = roomWidth();
    const rh = roomHeight();
    for (let r = 0; r < arr.length; r += 1) {
      const a = arr[r];
      a.life -= dt;
      a.x += a.vx;
      a.y += a.vy;
      a.phase += dt * a.spin;
      // Gentle horizontal sway
      a.x += Math.sin(a.phase) * 0.4;
      // Reset if drifted off room or expired
      const off = a.x < -40 || a.x > rw + 40 || a.y < -40 || a.y > rh + 40 || a.life <= 0;
      if (off) {
        Object.assign(arr[r], spawnAmbient(cfg, false));
      }
      arr[w++] = arr[r];
    }
    arr.length = w;
  }
  function spawnAmbient(cfg, initial) {
    const rw = roomWidth();
    const rh = roomHeight();
    return {
      kind: cfg.kind,
      color: cfg.color,
      x: initial ? Math.random() * rw : (cfg.speedX > 0 ? -20 : rw + 20),
      y: initial ? Math.random() * rh : (cfg.speedY > 0 ? -20 : rh + 20),
      vx: cfg.speedX + (Math.random() - 0.5) * 0.4,
      vy: cfg.speedY + (Math.random() - 0.5) * 0.3,
      size: 1 + Math.random() * 3,
      phase: Math.random() * Math.PI * 2,
      spin: 1.5 + Math.random() * 2.5,
      life: 6 + Math.random() * 6
    };
  }
  function drawAmbient() {
    if (!game.ambient || !game.ambient.length) return;
    for (const a of game.ambient) {
      ctx.globalAlpha = clamp(a.life / 6, 0, 1) * 0.7;
      ctx.fillStyle = a.color;
      if (a.kind === "leaf" || a.kind === "petal") {
        ctx.beginPath();
        ctx.ellipse(a.x, a.y, a.size + 1.5, a.size * 0.5, a.phase, 0, Math.PI * 2);
        ctx.fill();
      } else if (a.kind === "spark" || a.kind === "ember") {
        ctx.shadowColor = a.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(a.x - 1, a.y - 1, 2, 2);
        ctx.shadowBlur = 0;
      } else if (a.kind === "spore") {
        ctx.shadowColor = a.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // dust/ash/mist
        ctx.fillRect(a.x - 0.5, a.y - 0.5, a.size, a.size);
      }
    }
    ctx.globalAlpha = 1;
  }
  function drawChests() {
    if (!game.chests || game.chests.length === 0) return;
    for (const chest of game.chests) {
      if (!drawHdChest(chest)) drawFallbackChest(chest);
    }
  }

  function chestHitBox(chest) {
    return {
      x: chest.x + 18 - CHEST_DRAW_W / 2,
      y: chest.y + 28 - CHEST_DRAW_H,
      w: CHEST_DRAW_W,
      h: CHEST_DRAW_H
    };
  }

  function drawHdChest(chest) {
    const sheet = images.chests;
    if (!sheet || !sheet.width) return false;
    const shimmer = Math.floor(game.time * 2.4 + chest.x * 0.01) % 2;
    const frame = chest.opened ? 2 + shimmer : shimmer;
    const drawW = CHEST_DRAW_W;
    const drawH = CHEST_DRAW_H;
    const x = chest.x + 18 - drawW / 2;
    const y = chest.y + 28 - drawH;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      sheet,
      frame * SPRITES.chestFrameW,
      0,
      SPRITES.chestFrameW,
      SPRITES.chestFrameH,
      x,
      y,
      drawW,
      drawH
    );
    ctx.restore();
    return true;
  }

  function drawFallbackChest(chest) {
    const x = chest.x;
    const y = chest.y;
    ctx.fillStyle = "#3a2415";
    ctx.fillRect(x, y, 36, 28);
    ctx.fillStyle = "#5a3820";
    ctx.fillRect(x + 2, y + 2, 32, 24);
    ctx.fillStyle = "#181210";
    ctx.fillRect(x + 1, y + 9, 34, 3);
    ctx.fillRect(x + 1, y + 18, 34, 3);
    ctx.fillRect(x + 16, y, 4, 28);
    if (chest.opened) {
      ctx.fillStyle = "#1a0e08";
      ctx.fillRect(x + 4, y + 14, 28, 12);
      ctx.fillStyle = "#5a3820";
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 36, y - 6);
      ctx.lineTo(x + 30, y + 8);
      ctx.lineTo(x + 6, y + 8);
      ctx.closePath();
      ctx.fill();
    } else {
      const pulse = 0.5 + 0.5 * Math.sin(game.time * 3);
      ctx.shadowColor = "#ffd065";
      ctx.shadowBlur = 10 * pulse;
      ctx.fillStyle = "#d1a84d";
      ctx.fillRect(x + 14, y + 12, 8, 6);
      ctx.fillStyle = "#7a5a1e";
      ctx.fillRect(x + 16, y + 14, 4, 2);
      ctx.shadowBlur = 0;
    }
  }

  function spawnCandleDrop(candle) {
    const drop = candle.drop;
    if (drop === "subAxe" || drop === "subHolyWater" || drop === "subBoomerang") {
      game.pickups.push({ id: `cd_${candle.id}_${game.time}`, type: drop, x: candle.x - 14, y: candle.y - 6, w: 28, h: 28, bob: 0, fromCandle: true });
      return;
    }
    const sizeBig = drop === "bigHeart";
    game.pickups.push({
      id: `cd_${candle.id}_${game.time}_${Math.random()}`,
      type: drop,
      x: candle.x - (sizeBig ? 12 : 9),
      y: candle.y - 4,
      w: sizeBig ? 24 : 18,
      h: sizeBig ? 24 : 18,
      vx: (Math.random() - 0.5) * 1.4,
      vy: -3.4,
      bob: 0,
      fall: true
    });
  }

  function spawnFlame(x, y) {
    game.flames.push({
      x, y,
      w: 56, h: 18,
      life: 1.4,
      tick: 0,
      flicker: 0,
      damage: 7 + player.baseDamage
    });
    burst(x + 28, y + 9, "#bfe7ff", 18);
    playSound("spell", 0.32);
  }

  function ensureFamiliar() {
    if (game.save.familiar !== "bat") {
      game.familiar = null;
      return;
    }
    if (game.familiar) return;
    game.familiar = {
      kind: "bat",
      x: player.x - 30,
      y: player.y + 20,
      vx: 0, vy: 0,
      flap: 0,
      target: null,
      cooldown: 0,
      attackTimer: 0
    };
  }

  function updateFamiliar(step, dt) {
    if (!game.familiar) return;
    const f = game.familiar;
    f.flap += dt * 14;
    f.cooldown = Math.max(0, f.cooldown - dt);
    f.attackTimer = Math.max(0, f.attackTimer - dt);

    // Find nearest enemy in range
    let target = null;
    let bestDist = 280;
    const fx = f.x, fy = f.y;
    for (const enemy of game.enemies) {
      const dx = enemy.x + enemy.w / 2 - fx;
      const dy = enemy.y + enemy.h / 2 - fy;
      const d = Math.hypot(dx, dy);
      if (d < bestDist) { bestDist = d; target = enemy; }
    }
    if (game.boss) {
      const dx = game.boss.x + game.boss.w / 2 - fx;
      const dy = game.boss.y + game.boss.h / 2 - fy;
      const d = Math.hypot(dx, dy);
      if (d < bestDist) { bestDist = d; target = game.boss; }
    }
    f.target = target;

    let goalX, goalY;
    if (target && f.cooldown <= 0) {
      // Dive at target
      goalX = target.x + target.w / 2;
      goalY = target.y + target.h / 2;
      const dx = goalX - fx;
      const dy = goalY - fy;
      const d = Math.max(1, Math.hypot(dx, dy));
      f.vx += (dx / d) * 0.7 * step;
      f.vy += (dy / d) * 0.7 * step;
      if (d < 26) {
        // Bite
        if (target === game.boss) damageBoss(6 + player.baseDamage);
        else damageEnemy(target, 8 + player.baseDamage);
        burst(target.x + target.w / 2, target.y + target.h / 2, "#bfa0ff", 6);
        playSound("enemyHit", 0.22);
        f.cooldown = 0.85;
        f.attackTimer = 0.18;
        // Bounce away
        f.vx = -dx / d * 4;
        f.vy = -dy / d * 4;
      }
    } else {
      // Hover near player
      goalX = player.x + player.w / 2 - 60 * player.facing + Math.sin(f.flap * 0.3) * 8;
      goalY = player.y + 26 + Math.sin(f.flap * 0.5) * 6;
      const dx = goalX - fx;
      const dy = goalY - fy;
      f.vx += dx * 0.012 * step;
      f.vy += dy * 0.012 * step;
    }
    f.vx *= Math.pow(0.92, step);
    f.vy *= Math.pow(0.92, step);
    f.vx = clamp(f.vx, -7, 7);
    f.vy = clamp(f.vy, -7, 7);
    f.x += f.vx * step;
    f.y += f.vy * step;
    // Clamp to room (loose bounds, allow some bleed)
    f.x = clamp(f.x, -40, roomWidth() + 40);
    f.y = clamp(f.y, -40, roomHeight() + 40);
  }

  function drawFamiliar() {
    if (!game.familiar) return;
    const f = game.familiar;
    const wingPhase = Math.sin(f.flap);
    const wingSpread = 14 + wingPhase * 4;
    const cx = f.x;
    const cy = f.y;
    // Wings
    ctx.fillStyle = "rgba(38, 22, 52, 0.92)";
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy);
    ctx.quadraticCurveTo(cx - wingSpread, cy - 6, cx - wingSpread - 2, cy + 4);
    ctx.quadraticCurveTo(cx - wingSpread + 2, cy + 2, cx - 4, cy + 4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy);
    ctx.quadraticCurveTo(cx + wingSpread, cy - 6, cx + wingSpread + 2, cy + 4);
    ctx.quadraticCurveTo(cx + wingSpread - 2, cy + 2, cx + 4, cy + 4);
    ctx.fill();
    // Body
    ctx.fillStyle = "#1f1330";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 1, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = f.attackTimer > 0 ? "#ff5465" : "#bfa0ff";
    ctx.fillRect(cx - 2, cy - 1, 1.5, 1.5);
    ctx.fillRect(cx + 1, cy - 1, 1.5, 1.5);
  }

  function spawnDamageText(x, y, amount, color, crit) {
    game.damageTexts.push({
      x: x + (Math.random() - 0.5) * 12,
      y,
      text: crit ? `${Math.round(amount)}!` : String(Math.round(amount)),
      vy: -1.6 - Math.random() * 0.6,
      life: crit ? 0.95 : 0.7,
      maxLife: crit ? 0.95 : 0.7,
      color: color || "#fff5dd",
      crit: !!crit
    });
  }

  function updateDamageTexts(dt) {
    const arr = game.damageTexts;
    let w = 0;
    for (let r = 0; r < arr.length; r += 1) {
      const t = arr[r];
      t.life -= dt;
      if (t.life > 0) {
        t.y += t.vy;
        t.vy *= 0.94;
        if (w !== r) arr[w] = t;
        w += 1;
      }
    }
    arr.length = w;
  }

  function drawDamageTexts() {
    if (!game.damageTexts.length) return;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const t of game.damageTexts) {
      const a = clamp(t.life / t.maxLife, 0, 1);
      ctx.globalAlpha = a;
      if (t.crit) {
        ctx.font = "800 20px Georgia, 'Times New Roman', serif";
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 14;
      } else {
        ctx.font = "700 14px 'Trebuchet MS', Arial, sans-serif";
      }
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillText(t.text, t.x + 1, t.y + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  function drawComboMeter() {
    if (player.combo <= 1 || player.comboTimer <= 0) return;
    const pct = clamp(player.comboTimer / 3.0, 0, 1);
    const cx = player.x + player.w / 2;
    const y = player.y - 28;
    const w = 78;
    const h = 8;
    ctx.save();
    ctx.globalAlpha = 0.75 + Math.sin(game.time * 10) * 0.08;
    ctx.fillStyle = "rgba(9, 4, 8, 0.78)";
    ctx.fillRect(cx - w / 2 - 6, y - 14, w + 12, 28);
    ctx.strokeStyle = "rgba(244, 211, 139, 0.72)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - w / 2 - 6, y - 14, w + 12, 28);
    ctx.fillStyle = "rgba(215, 66, 54, 0.28)";
    ctx.fillRect(cx - w / 2, y + 2, w, h);
    ctx.fillStyle = "#f4d38b";
    ctx.fillRect(cx - w / 2, y + 2, w * pct, h);
    ctx.font = "700 12px 'Trebuchet MS', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff5dd";
    ctx.fillText(`CHAIN x${player.combo}`, cx, y - 4);
    ctx.restore();
  }

  function updateBossBanner(dt) {
    if (!game.bossBanner) return;
    game.bossBanner.t += dt;
    if (game.bossBanner.t >= game.bossBanner.life) game.bossBanner = null;
  }

  function updateShrines() {
    if (!game.room.shrine) return;
    const s = game.room.shrine;
    if (rectsOverlap(player, { x: s.x - 22, y: s.y - 36, w: 64, h: 60 })) {
      if (actionJust("interact")) {
        player.hp = player.maxHp;
        player.mp = player.maxMp;
        player.hearts = player.maxHearts;
        cleanseStatus();
        game.save.lastShrine = { roomId: game.roomId, x: s.x + 10, y: s.y - 14 };
        burst(s.x + 10, s.y - 10, "#f4d38b", 30);
        message("Save shrine: rested. Powers restored, ailments cleansed.");
        playSound("heart", 0.5);
        writeSave();
      } else if (game.messageTimer <= 0) {
        message("Press E to rest at the shrine");
      }
    }
  }

  function nearbyNpc() {
    if (!game.npcs || !game.npcs.length) return null;
    const pcx = player.x + player.w / 2;
    const pcy = player.y + player.h / 2;
    let best = null;
    let bestDist = 92;
    for (const npc of game.npcs) {
      const nx = npc.x + npc.w / 2;
      const ny = npc.y + npc.h / 2;
      const dist = Math.hypot(pcx - nx, pcy - ny);
      if (dist < bestDist) {
        best = npc;
        bestDist = dist;
      }
    }
    return best;
  }

  function tryStartNpcDialogue() {
    const npc = nearbyNpc();
    if (!npc) return false;
    const meta = STORY_NPCS[npc.id];
    if (!meta) return false;
    const lines = typeof meta.lines === "function" ? meta.lines() : meta.lines;
    game.dialogue = {
      npc: npc.id,
      line: 0,
      lines: (lines || []).filter(Boolean)
    };
    if (!game.save.storyFlags) game.save.storyFlags = {};
    game.save.storyFlags[`talked_${npc.id}`] = true;
    game.messageTimer = 0;
    playSound("ui", 0.22);
    writeSave();
    return true;
  }

  function advanceDialogue() {
    if (!game.dialogue) return;
    game.dialogue.line += 1;
    if (game.dialogue.line >= game.dialogue.lines.length) {
      const meta = STORY_NPCS[game.dialogue.npc];
      message(meta ? `${meta.name}: ...` : "");
      game.dialogue = null;
      playSound("ui", 0.18);
      return;
    }
    playSound("ui", 0.14);
  }

  function doorTriggerBox(door) {
    if (door.side === "left") return { x: -54, y: door.y - 42, w: door.w + 78, h: door.h + 84 };
    if (door.side === "right") return { x: door.x - 24, y: door.y - 42, w: door.w + 78, h: door.h + 84 };
    if (door.side === "up") return { x: door.x - 44, y: door.y - 24, w: door.w + 88, h: door.h + 56 };
    if (door.side === "down") return { x: door.x - 44, y: door.y - 18, w: door.w + 88, h: door.h + 60 };
    return door;
  }

  function doorKey(door) {
    return `${door.side}:${Math.round(door.x)}:${Math.round(door.y)}:${Math.round(door.w)}:${Math.round(door.h)}:${door.to}`;
  }

  function suppressReverseDoorUntilExit(room, sourceDoor) {
    if (!room || !sourceDoor || !sourceDoor.fromRoomId) return;
    for (const door of room.doors) {
      if (door.to !== sourceDoor.fromRoomId) continue;
      if (door.side !== "up" || (!game.mobileMode && !isMobileLayout())) continue;
      if (!rectsOverlap(player, doorTriggerBox(door))) continue;
      game.doorReentryBlock = {
        roomId: game.roomId,
        key: doorKey(door)
      };
      return;
    }
  }

  function doorReentryBlocked(door) {
    const block = game.doorReentryBlock;
    if (!block) return false;
    if (block.roomId !== game.roomId) {
      game.doorReentryBlock = null;
      return false;
    }
    if (block.key !== doorKey(door)) return false;
    if (rectsOverlap(player, doorTriggerBox(door))) return true;
    game.doorReentryBlock = null;
    return false;
  }

  function doorIntent(door) {
    if (door.side === "left") return actionDown("left") || player.x <= door.x + door.w + 8;
    if (door.side === "right") return actionDown("right") || player.x + player.w >= door.x - 8;
    if (door.side === "up") return actionDown("up") || mobileCeilingDoorIntent(door);
    if (door.side === "down") return actionDown("down");
    return true;
  }

  function mobileCeilingDoorIntent(door) {
    if (door.side !== "up" || (!game.mobileMode && !isMobileLayout())) return false;
    const playerCenterX = player.x + player.w / 2;
    const doorCenterX = door.x + door.w / 2;
    return Math.abs(playerCenterX - doorCenterX) <= Math.max(54, door.w * 0.75);
  }

  function nudgeFromDoor(door) {
    if (door.side === "left") player.x = Math.max(player.x, door.x + door.w + 8);
    else if (door.side === "right") player.x = Math.min(player.x, door.x - player.w - 8);
    else if (door.side === "up") player.y = door.y + door.h + 8;
    else if (door.side === "down") player.y = door.y - player.h - 8;
    player.vx = 0;
    player.vy = 0;
  }

  function updateDoors() {
    // Proactive nudge: if player lingers near a locked door, repeat the hint.
    game.lockNudgeTimer = Math.max(0, (game.lockNudgeTimer || 0) - 1 / 60);
    for (const door of game.room.doors) {
      if (!doorOpen(door) && door.lock) {
        const dx = (player.x + player.w / 2) - (door.x + door.w / 2);
        const dy = (player.y + player.h / 2) - (door.y + door.h / 2);
        if (Math.hypot(dx, dy) < 140 && game.messageTimer <= 0 && game.lockNudgeTimer <= 0) {
          message(lockMessage(door.lock));
          game.lockNudgeTimer = 5;
        }
      }
    }

    if (game.roomTransitionCooldown > 0) return;

    for (const door of game.room.doors) {
      if (doorReentryBlocked(door)) continue;
      if (!rectsOverlap(player, doorTriggerBox(door)) || !doorIntent(door)) continue;
      const milestone = activeMilestoneBoss();
      if (milestone) {
        message(`${milestone.cfg.banner || "Warden"} seals the exits.`);
        nudgeFromDoor(door);
        return;
      }
      if (!doorOpen(door)) {
        message(lockMessage(door.lock));
        nudgeFromDoor(door);
        return;
      }
      burst(player.x + player.w / 2, player.y + player.h / 2, "#eac36f", 18);
      enterRoom(door.to, door.spawn, true, { fromRoomId: game.roomId, usedSide: door.side });
      return;
    }
  }

  function updateIntroMechanics(dt) {
    updateDrawbridge(dt);
    updateIntroPortcullis(dt);
  }

  function updateDrawbridge(dt) {
    const bridge = game.room && game.room.drawbridge;
    if (!bridge) return;
    const cx = player.x + player.w / 2;

    if (!bridge.cycled && cx > bridge.triggerX) {
      bridge.cycled = true;
      bridge.target = 1;
      message("The drawbridge hauls upward behind you.");
      playSound("ui", 0.18);
      burst(bridge.hingeX + 20, bridge.hingeY - 8, "#f0bf61", 20);
    }

    if (bridge.cycled && !bridge.reopened && bridge.progress > 0.96) {
      bridge.reopened = true;
      burst(bridge.hingeX + 10, bridge.hingeY - 120, "#cfeacc", 12);
    }

    if (bridge.cycled && cx < bridge.resetX) {
      bridge.cycled = false;
      bridge.reopened = false;
      bridge.target = 0;
      message("The drawbridge lowers for the return path.");
    }

    const speed = bridge.target > bridge.progress ? 1.25 : 1.55;
    bridge.progress += (bridge.target - bridge.progress) * Math.min(1, dt * speed);
    if (Math.abs(bridge.progress - bridge.target) < 0.01) bridge.progress = bridge.target;
  }

  function updateIntroPortcullis(dt) {
    const gate = game.room && game.room.portcullis;
    if (!gate) return;
    const cx = player.x + player.w / 2;

    if (!gate.cycled && cx > gate.triggerX) {
      gate.cycled = true;
      gate.target = 1;
      message("The castle portcullis drops behind you.");
      playSound("ui", 0.16);
      burst(gate.x + gate.w / 2, gate.y + gate.h, "#f0bf61", 18);
    }

    if (gate.cycled && !gate.reopened && cx > gate.releaseX) {
      gate.reopened = true;
      gate.target = 0;
      message("The old gate rises again.");
      playSound("ui", 0.14);
      burst(gate.x + gate.w / 2, gate.y + 24, "#cfeacc", 18);
    }

    if (gate.reopened && cx < gate.triggerX - 180) {
      gate.cycled = false;
      gate.reopened = false;
      gate.target = 0;
    }

    const speed = gate.target > gate.progress ? 4.8 : 3.8;
    gate.progress += (gate.target - gate.progress) * Math.min(1, dt * speed);
    if (Math.abs(gate.progress - gate.target) < 0.01) gate.progress = gate.target;
  }

  function puzzleLockId(lock) {
    return typeof lock === "string" && lock.startsWith("puzzle:") ? lock.slice(7) : null;
  }

  function puzzleSolved(id) {
    return Boolean(id && game.save.puzzles && game.save.puzzles[id]);
  }

  function puzzleMetaById(id) {
    for (const [roomId, room] of Object.entries(rooms)) {
      if (room.puzzle && room.puzzle.id === id) return { roomId, room, puzzle: room.puzzle };
    }
    return null;
  }

  function puzzleLabel(id) {
    const meta = puzzleMetaById(id);
    return meta ? meta.puzzle.label : "Rune Puzzle";
  }

  function puzzleRewardId(puzzle) {
    return `puzzle_${puzzle.id}`;
  }

  function spawnPuzzleReward(roomId, puzzle, fromSolve = false) {
    if (!puzzle || !puzzle.reward) return false;
    const id = puzzleRewardId(puzzle);
    const key = `${roomId}:${id}`;
    if (game.save.collected[key]) return false;
    if (game.pickups.some((drop) => drop.id === id)) return false;
    const reward = puzzle.reward;
    game.pickups.push({
      id,
      type: reward.type,
      x: reward.x,
      y: reward.y,
      w: 28,
      h: 28,
      bob: fromSolve ? 0 : Math.random() * 10,
      fall: fromSolve,
      vx: 0,
      vy: fromSolve ? -4.4 : 0,
      fallLife: 18
    });
    return true;
  }

  function syncPuzzleReward(roomId) {
    const room = rooms[roomId];
    const puzzle = room && room.puzzle;
    if (!puzzle || !puzzleSolved(puzzle.id)) return;
    spawnPuzzleReward(roomId, puzzle, false);
  }

  function activeMilestoneBoss() {
    return game.enemies.find((enemy) => enemy.cfg && enemy.cfg.fullBoss && enemy.awakened) || null;
  }

  function roomBossActive() {
    return Boolean(activeMilestoneBoss() || game.boss);
  }

  function doorOpen(door) {
    if (!door.lock) return true;
    const puzzleId = puzzleLockId(door.lock);
    if (puzzleId) return puzzleSolved(puzzleId);
    if (door.lock === "moonGate") return game.save.moonSigil && game.save.relics.dash && allSurveyRoomsVisited() && allQuestSealsClaimed();
    return true;
  }

  function lockMessage(lock) {
    const puzzleId = puzzleLockId(lock);
    if (puzzleId) {
      const meta = puzzleMetaById(puzzleId);
      const roomName = meta ? meta.room.name : "this room";
      return `Locked. Solve ${puzzleLabel(puzzleId)} in ${roomName}. Strike the rune plates in order.`;
    }
    if (lock === "moonGate") {
      if (!game.save.moonSigil && !game.save.relics.dash) {
        return "Locked. Need Moon Sigil + Mist Dash. Sigil: Silver Portrait Gallery (east of Gate Hall). Dash: Moon Chain Tower (Gallery → Clockwork Rise → Tower).";
      }
      if (!game.save.moonSigil) {
        return "Locked. Missing Moon Sigil — find it in the Silver Portrait Gallery (east of Gate Hall).";
      }
      if (!game.save.relics.dash) {
        return "Locked. Missing Mist Dash — claim it in the Moon Chain Tower (Gallery → Clockwork Rise → Tower).";
      }
    }
    if (lock === "moonGate") {
      const survey = surveyProgress();
      if (!survey.done) {
        return `Locked. Castle survey incomplete (${survey.visited}/${survey.total}). Next: ${roomDisplayName(survey.next)} - ${roomRouteHint(survey.next)}`;
      }
      const seals = questSealProgress();
      if (!seals.done) {
        return `Locked. Reliquary seals incomplete (${seals.found}/${seals.total}). Next: ${seals.next.label} - ${seals.next.hint}`;
      }
    }
    return "Sealed";
  }

  function lockShortMessage(lock) {
    const puzzleId = puzzleLockId(lock);
    if (puzzleId) return `LOCKED - ${puzzleLabel(puzzleId)}`;
    if (lock === "moonGate") {
      const need = [];
      if (!game.save.moonSigil) need.push("Moon Sigil");
      if (!game.save.relics.dash) need.push("Mist Dash");
      if (need.length === 0) {
        const survey = surveyProgress();
        if (!survey.done) return `LOCKED - survey ${survey.visited}/${survey.total}`;
        const seals = questSealProgress();
        if (!seals.done) return `LOCKED - seals ${seals.found}/${seals.total}`;
        return "";
      }
      return `LOCKED — need ${need.join(" + ")}`;
    }
    return "LOCKED";
  }

  function lockTargetRoom(lock) {
    const puzzleId = puzzleLockId(lock);
    if (puzzleId) {
      const meta = puzzleMetaById(puzzleId);
      return meta ? meta.roomId : null;
    }
    if (lock === "moonGate") {
      if (!game.save.moonSigil) return "gallery";
      if (!game.save.relics.dash) return "tower";
      const survey = surveyProgress();
      if (!survey.done) return survey.next;
      const seals = questSealProgress();
      if (!seals.done) return seals.next.room;
    }
    return null;
  }

  function collectItem(drop) {
    drop.dead = true;
    let persist = false;
    let mapNeedsUpdate = false;
    if (drop.type === "doubleJump") {
      game.save.relics.doubleJump = true;
      message("Relic gained: Grave Boots / Triple Moonstep");
      burst(drop.x, drop.y, "#86d8ff", 34);
      persist = true;
      mapNeedsUpdate = true;
    } else if (drop.type === "dash") {
      game.save.relics.dash = true;
      message("Relic gained: Mist Dash");
      burst(drop.x, drop.y, "#d8fff3", 34);
      persist = true;
      mapNeedsUpdate = true;
    } else if (drop.type === "moonSigil") {
      game.save.moonSigil = true;
      message("Moon Sigil recovered");
      burst(drop.x, drop.y, "#f2cb68", 30);
      persist = true;
      mapNeedsUpdate = true;
    } else if (QUEST_ICON_CELLS[drop.type]) {
      if (!game.save.questSeals) game.save.questSeals = {};
      game.save.questSeals[drop.type] = true;
      const seals = questSealProgress();
      message(`${questSealLabel(drop.type)} claimed (${seals.found}/${seals.total})`);
      const color = drop.type === "tideSeal" ? "#42dfff" : drop.type === "starSeal" ? "#ffd56a" : "#bca8ff";
      burst(drop.x, drop.y, color, 42);
      persist = true;
      mapNeedsUpdate = true;
    } else if (drop.type === "heartVessel") {
      game.save.maxHp = Math.min(240, game.save.maxHp + 16);
      player.maxHp = game.save.maxHp;
      player.hp = player.maxHp;
      message("Blood Rose deepens your life");
      burst(drop.x, drop.y, "#f05f5b", 30);
      persist = true;
      mapNeedsUpdate = true;
    } else if (drop.type === "familiarBat") {
      game.save.familiar = "bat";
      ensureFamiliar();
      message("Familiar bound: Nightwing Bat");
      burst(drop.x, drop.y, "#9a7adb", 30);
      persist = true;
      mapNeedsUpdate = true;
    } else if (drop.type === "ringOfArdor") {
      game.save.equipment.ringOfArdor = true;
      message("Ring of Ardor — +22 Luck (chance for critical hits)");
      burst(drop.x, drop.y, "#ff9a3a", 32);
      persist = true;
      mapNeedsUpdate = true;
    } else if (drop.type === "batCloak") {
      game.save.equipment.batCloak = true;
      message("Bat Cloak — jump height boosted");
      burst(drop.x, drop.y, "#9a7adb", 32);
      persist = true;
      mapNeedsUpdate = true;
    } else if (drop.type === "wraithArmor") {
      game.save.equipment.wraithArmor = true;
      message("Wraith Armor — +4 Defense (damage reduced)");
      burst(drop.x, drop.y, "#cfeacc", 32);
      persist = true;
      mapNeedsUpdate = true;
    } else if (drop.type === "phoenixPendant") {
      game.save.equipment.phoenixPendant = true;
      message("Phoenix Pendant — MP regen tripled");
      burst(drop.x, drop.y, "#ff9a3a", 36);
      persist = true;
      mapNeedsUpdate = true;
    } else if (drop.type === "subAxe") {
      game.save.ownedSubweapons.axe = true;
      player.subweapon = "axe";
      message("Sub-Weapon: War Axe equipped");
      burst(drop.x, drop.y, "#cfa45a", 22);
      mapNeedsUpdate = true;
    } else if (drop.type === "subHolyWater") {
      game.save.ownedSubweapons.holyWater = true;
      player.subweapon = "holyWater";
      message("Sub-Weapon: Holy Water equipped");
      burst(drop.x, drop.y, "#bfe7ff", 22);
      mapNeedsUpdate = true;
    } else if (drop.type === "subBoomerang") {
      game.save.ownedSubweapons.boomerang = true;
      player.subweapon = "boomerang";
      message("Sub-Weapon: Moon Boomerang equipped");
      burst(drop.x, drop.y, "#f7d988", 24);
      mapNeedsUpdate = true;
    } else if (drop.type === "heart") {
      player.hearts = Math.min(player.maxHearts, player.hearts + 1);
    } else if (drop.type === "bigHeart") {
      player.hearts = Math.min(player.maxHearts, player.hearts + 5);
    } else if (drop.type === "smallMp") {
      player.mp = Math.min(player.maxMp, player.mp + 8);
    } else if (drop.type === "smallHp") {
      player.hp = Math.min(player.maxHp, player.hp + 12);
    } else {
      // Legacy mp drop from kills
      player.mp = Math.min(player.maxMp, player.mp + 12);
    }
    if (persist) game.save.collected[`${game.roomId}:${drop.id}`] = true;
    const sfx = (drop.type === "heart" || drop.type === "bigHeart") ? "heart"
      : (drop.type === "heartVessel") ? "heart"
      : "pickup";
    playSound(sfx, 0.34);
    if (mapNeedsUpdate) updateMapPanel();
    if (persist || drop.type === "subAxe" || drop.type === "subHolyWater" || drop.type === "subBoomerang") writeSave();
  }

  function damageEnemy(enemy, amount, crit) {
    enemy.hp -= amount;
    enemy.hurt = 0.12;
    enemy.vx += player.facing * 1.4;
    burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, crit ? "#ffba60" : "#cfe8b5", crit ? 16 : 9);
    spawnDamageText(enemy.x + enemy.w / 2, enemy.y + 12, amount, crit ? "#ff9a3a" : "#fff0a0", crit);
    if (crit) {
      game.save.crits = (game.save.crits || 0) + 1;
      game.shake = Math.max(game.shake, 0.6);
    }
    playSound("enemyHit", 0.42);
    if (enemy.hp <= 0) {
      if (enemyKillPersists(enemy)) {
        game.save.killed[`${game.roomId}:${enemy.id}`] = true;
      }
      game.save.kills = (game.save.kills || 0) + 1;
      game.enemies = game.enemies.filter((other) => other !== enemy);
      player.combo += 1;
      player.comboTimer = 3.0;
      player.score += 100 + player.combo * 25;
      player.mp = Math.min(player.maxMp, player.mp + 5 + Math.min(8, player.combo));
      if (player.combo > 1) message(`Moon chain x${player.combo}`);
      const isMini = enemy.cfg && enemy.cfg.mini;
      burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, isMini ? "#bfa0ff" : "#e1d0a0", isMini ? 60 : 22);
      playSound(isMini ? "bossDie" : "enemyDie", isMini ? 0.55 : 0.45);
      if (isMini) {
        const isFullBoss = enemy.cfg && enemy.cfg.fullBoss;
        game.shake = Math.max(game.shake, isFullBoss ? 2.2 : 1.6);
        if (isFullBoss) {
          game.projectiles.length = 0;
          player.hp = player.maxHp;
          player.mp = player.maxMp;
          player.hearts = Math.min(player.maxHearts, player.hearts + 20);
          game.bossBanner = { name: enemy.cfg.banner || "Warden", subtitle: "Milestone Cleared", t: 0, life: 3.1 };
          playMusic(game.room.music);
        }
        if (!spawnQuestSealReward(enemy)) message(`${enemy.cfg.banner || "Mini-Boss"} falls!`);
      }
      const reward = xpReward(enemy) * (isMini ? 4 : 1);
      grantExp(reward, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
      // Soul-style enemy drop: ~50% heart, ~20% bigHeart, ~12% smallMp, else nothing
      const r = Math.random();
      if (r < 0.5) {
        game.pickups.push({ id: `dr${game.time}${Math.random()}`, type: "heart", x: enemy.x + enemy.w / 2 - 9, y: enemy.y + enemy.h / 2, w: 18, h: 18, bob: 0, fall: true, vx: (Math.random() - 0.5) * 1.4, vy: -3.4 });
      } else if (r < 0.7) {
        game.pickups.push({ id: `dr${game.time}${Math.random()}`, type: "bigHeart", x: enemy.x + enemy.w / 2 - 12, y: enemy.y + enemy.h / 2, w: 24, h: 24, bob: 0, fall: true, vx: (Math.random() - 0.5) * 1.4, vy: -3.4 });
      } else if (r < 0.82) {
        game.pickups.push({ id: `dr${game.time}${Math.random()}`, type: "smallMp", x: enemy.x + enemy.w / 2 - 9, y: enemy.y + enemy.h / 2, w: 18, h: 18, bob: 0, fall: true, vx: (Math.random() - 0.5) * 1.4, vy: -3.4 });
      }
    }
  }

  function grantExp(amount, fxX, fxY) {
    player.exp += amount;
    let leveled = false;
    while (player.level < 50 && player.exp >= xpForLevel(player.level + 1)) {
      player.level += 1;
      player.maxHp = Math.min(240, player.maxHp + 6);
      player.maxMp = Math.min(200, player.maxMp + 3);
      player.maxHearts = Math.min(200, player.maxHearts + 1);
      player.baseDamage = (player.level - 1) * 1;
      player.hp = player.maxHp;
      player.mp = player.maxMp;
      leveled = true;
    }
    if (leveled) {
      game.save.maxHp = player.maxHp;
      game.save.maxMp = player.maxMp;
      game.save.maxHearts = player.maxHearts;
      game.save.level = player.level;
      message(`Level Up! Lv ${player.level}`);
      burst(fxX, fxY, "#f4d38b", 38);
      playSound("heart", 0.5);
      writeSave();
    }
    game.save.exp = player.exp;
  }

  function damageBoss(amount, crit) {
    const boss = game.boss;
    if (!boss) return;
    boss.hp -= amount;
    boss.hurt = 0.13;
    game.shake = Math.max(game.shake, crit ? 1.8 : 1.2);
    burst(boss.x + boss.w / 2, boss.y + boss.h / 2, crit ? "#ffd065" : "#ff6d4e", crit ? 18 : 12);
    spawnDamageText(boss.x + boss.w / 2, boss.y + 24, amount, crit ? "#ff9a3a" : "#ffba60", crit);
    if (crit) game.save.crits = (game.save.crits || 0) + 1;
    playSound("enemyHit", 0.5);
    if (boss.hp <= 0) {
      grantExp(800, boss.x + boss.w / 2, boss.y + boss.h / 2);
      game.boss = null;
      game.save.bossDefeated = true;
      game.projectiles.length = 0;
      player.hp = player.maxHp;
      player.mp = player.maxMp;
      player.hearts = player.maxHearts;
      burst(W / 2, H / 2, "#f4d38b", 80);
      playSound("bossDie", 0.55);
      writeSave();
      setTimeout(() => {
        game.mode = "win";
        renderTitle("Rite Broken", "The Reliquary is silent. A new run can begin whenever the moon rises again.");
        dom.startButton.textContent = "New Run";
      }, 700);
    }
  }

  function hurtPlayer(amount) {
    if (player.invuln > 0 || game.mode !== "playing") return;
    const reduced = Math.max(1, amount - playerDefense());
    player.hp -= reduced;
    player.invuln = 1.1;
    player.vx = -player.facing * 3.4;
    player.vy = -4.7;
    game.shake = 1.45;
    playSound("playerHit", 0.45);
    burst(player.x + player.w / 2, player.y + player.h / 2, "#d74236", 18);
    spawnDamageText(player.x + player.w / 2, player.y + 14, reduced, "#ff7a6a");
    if (player.hp <= 0) {
      respawnAtShrine();
    }
  }

  function respawnAtShrine() {
    const last = game.save.lastShrine;
    if (last && rooms[last.roomId]) {
      // Soft death: restore stats and warp back to last shrine. Progress kept.
      player.hp = player.maxHp;
      player.mp = player.maxMp;
      player.hearts = Math.max(player.hearts, Math.floor(player.maxHearts * 0.6));
      player.invuln = 1.4;
      player.vx = 0;
      player.vy = 0;
      message("Moonfall — the shrine reclaims you.");
      playSound("heart", 0.4);
      enterRoom(last.roomId, { x: last.x, y: last.y - 116 }, true);
    } else {
      // No shrine yet — full reset to title screen as before.
      player.hp = 0;
      game.mode = "dead";
      renderTitle("Moonfall", "The castle rewinds. Find a save shrine to anchor your soul.");
      dom.startButton.textContent = "New Run";
      dom.continueButton.disabled = !hasSave();
      stopMusic();
    }
  }

  function compactMessage(text) {
    const raw = String(text || "");
    if (!raw) return "";
    const lower = raw.toLowerCase();
    if (lower.includes("locked")) return "Locked";
    if (lower.includes("mini-boss") || lower.includes("warden")) return raw.split(" - ")[0].slice(0, 28);
    if (lower.includes("sub-weapon")) return raw.replace("Sub-Weapon: ", "").slice(0, 24);
    if (lower.includes("relic gained")) return raw.replace("Relic gained: ", "").split("/")[0].trim();
    if (lower.includes("treasure")) return raw.replace("Treasure! ", "").slice(0, 24);
    if (lower.includes("puzzle") || lower.includes("rune")) return raw.slice(0, 30);
    if (lower.includes("fullscreen")) return "FS blocked";
    if (lower.includes("drawbridge")) return "Bridge moving";
    if (lower.includes("portcullis") || lower.includes("gate")) return "Gate moving";
    if (lower.includes("save shrine")) return "Restored";
    if (lower.includes("moonfall")) return "Returned to shrine";
    return raw.length > 32 ? `${raw.slice(0, 29)}...` : raw;
  }

  function message(text) {
    game.message = compactMessage(text);
    game.messageTimer = game.message ? 2.2 : 0;
  }

  function recordPerfSample(type, value) {
    if (!perfStats.enabled) return;
    const list = perfStats[type];
    list.push(value);
    if (list.length > 180) list.shift();
  }

  function perfPercentile(values, pct) {
    if (!values.length) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * pct))];
  }

  function perfBlockSummary(values) {
    if (!values.length) return { avg: 0, p95: 0, max: 0, samples: 0 };
    const total = values.reduce((sum, value) => sum + value, 0);
    return {
      avg: Number((total / values.length).toFixed(2)),
      p95: Number(perfPercentile(values, 0.95).toFixed(2)),
      max: Number(Math.max(...values).toFixed(2)),
      samples: values.length
    };
  }

  function perfSummary() {
    return {
      update: perfBlockSummary(perfStats.update),
      draw: perfBlockSummary(perfStats.draw),
      frame: perfBlockSummary(perfStats.frame)
    };
  }

  function draw() {
    const shakeX = game.shake ? (Math.random() - 0.5) * game.shake * 4 : 0;
    const shakeY = game.shake ? (Math.random() - 0.5) * game.shake * 4 : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    if (game.mode !== "playing") {
      drawTitleScene();
      drawVignette();
      ctx.restore();
      return;
    }
    drawRoom();
    ctx.save();
    ctx.translate(-Math.round(game.cameraX), -Math.round(game.cameraY));
    drawDoors();
    drawObjectiveDoorGuide();
    drawRoomMechanics();
    drawNpcs();
    drawShrine();
    drawCandles();
    drawChests();
    drawAmbient();
    drawComboMeter();
    drawFlames();
    drawPickups();
    drawProjectiles();
    drawEnemies();
    drawBoss();
    drawPlayer();
    drawFamiliar();
    drawParticles();
    drawDamageTexts();
    ctx.restore();
    drawBossHud();
    drawVignette();
    if (game.paused) drawPauseOverlay();
    drawBossBanner();
    drawDialogueOverlay();
    ctx.restore();
  }

  function drawPauseOverlay() {
    ctx.save();
    ctx.fillStyle = "rgba(5, 4, 8, 0.42)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 34px Cinzel, Georgia, serif";
    ctx.fillStyle = "#fff0cf";
    ctx.shadowColor = "#d1a84d";
    ctx.shadowBlur = 18;
    ctx.fillText("PAUSED", W / 2, H / 2 - 6);
    ctx.restore();
  }

  function titleParallaxKeys() {
    return ["paraForest", "paraStatues", "paraMist"];
  }

  function titleVisuals() {
    return {
      bg: "titleBg",
      parallax: titleParallaxKeys(),
      mode7: Boolean(images.titleBg && images.titleBg.width),
      animated: true
    };
  }

  function drawTitleScene() {
    const t = game.titleTime || game.time || 0;
    const bg = images.titleBg && images.titleBg.width ? images.titleBg : images.bgForest;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    drawTitleImageLayer(bg, t, 0.11, 1, 1.08, -8);
    drawTitleImageLayer(images.paraForest, t, 0.22, 0.28, 1.14, -18);
    drawTitleMoonHaze(t);
    drawTitleMode7Floor(bg, t);
    drawTitleImageLayer(images.paraStatues, t, -0.16, 0.30, 1.10, 12);
    drawTitleImageLayer(images.paraMist, t, 0.42, 0.46, 1.18, 30);
    drawTitleFireflies(t);
    ctx.fillStyle = "rgba(5, 4, 8, 0.20)";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    ctx.imageSmoothingEnabled = false;
  }

  function drawTitleImageLayer(img, t, speed, alpha, scale = 1.08, yOffset = 0) {
    if (!img || !img.width) {
      if (alpha >= 0.99) {
        ctx.fillStyle = "#050408";
        ctx.fillRect(0, 0, W, H);
      }
      return;
    }
    const driftX = Math.sin(t * speed * 2.7) * 18;
    const driftY = Math.cos(t * speed * 1.9) * 8 + yOffset;
    const dw = W * scale;
    const dh = H * scale;
    ctx.save();
    ctx.globalAlpha *= alpha;
    drawCover(img, (W - dw) / 2 + driftX, (H - dh) / 2 + driftY, dw, dh);
    ctx.restore();
  }

  function drawTitleMode7Floor(img, t) {
    if (!img || !img.width) return;
    const startY = Math.round(H * 0.56);
    const sourceY = Math.round(img.height * 0.58);
    const sourceH = Math.max(2, img.height - sourceY);
    ctx.save();
    ctx.globalAlpha = 0.42;
    for (let y = startY; y < H; y += 3) {
      const p = (y - startY) / Math.max(1, H - startY);
      const ease = p * p;
      const sy = Math.min(img.height - 2, sourceY + Math.round(sourceH * ease));
      const sliceH = Math.max(1, Math.min(3 + Math.round(p * 9), img.height - sy));
      const extra = 54 + p * 260;
      const wave = Math.sin(t * 0.9 + y * 0.034) * (4 + p * 22);
      const crawl = Math.sin(t * 0.28 + p * 2.4) * 14;
      ctx.drawImage(
        img,
        0,
        sy,
        img.width,
        sliceH,
        -extra + wave + crawl,
        y,
        W + extra * 2,
        4
      );
    }
    const sheen = ctx.createLinearGradient(0, startY, 0, H);
    sheen.addColorStop(0, "rgba(112, 184, 198, 0.00)");
    sheen.addColorStop(0.42, "rgba(112, 184, 198, 0.08)");
    sheen.addColorStop(1, "rgba(244, 211, 139, 0.14)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, startY, W, H - startY);
    ctx.restore();
  }

  function drawTitleMoonHaze(t) {
    ctx.save();
    ctx.globalAlpha = 0.18 + Math.sin(t * 0.7) * 0.04;
    const haze = ctx.createLinearGradient(0, 0, W, H);
    haze.addColorStop(0, "rgba(112, 184, 198, 0.20)");
    haze.addColorStop(0.5, "rgba(255, 237, 190, 0.08)");
    haze.addColorStop(1, "rgba(185, 53, 50, 0.12)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawTitleFireflies(t) {
    ctx.save();
    for (let i = 0; i < 42; i += 1) {
      const seed = i * 17.31;
      const x = (seed * 37 + Math.sin(t * 0.45 + seed) * 42 + t * (8 + (i % 5))) % (W + 80) - 40;
      const y = 74 + ((seed * 23) % 360) + Math.sin(t * 0.8 + seed * 0.4) * 22;
      const pulse = 0.45 + 0.55 * Math.sin(t * 2.4 + seed);
      const warm = i % 4 === 0;
      ctx.globalAlpha = 0.18 + pulse * 0.42;
      ctx.shadowColor = warm ? "#d74236" : "#f4d38b";
      ctx.shadowBlur = 9 + pulse * 12;
      ctx.fillStyle = warm ? "#d74236" : "#f4d38b";
      ctx.beginPath();
      ctx.arc(x, y, 1.4 + pulse * 1.9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawRoom() {
    const room = game.room || rooms.gate;
    const bg = images[room.bg];
    const mid = images[room.mid];
    const cameraX = game.cameraX || 0;
    const cameraY = game.cameraY || 0;
    drawRoomBackground(room, bg, mid, cameraX, cameraY);

    const tone = room.palette === "red" ? "rgba(105, 18, 28, 0.20)" : room.palette === "green" ? "rgba(24, 86, 53, 0.18)" : room.palette === "blue" ? "rgba(31, 75, 115, 0.18)" : "rgba(111, 79, 30, 0.16)";
    ctx.fillStyle = tone;
    ctx.fillRect(0, 0, W, H);
    drawMoatWaterUnderlay(room, cameraX, cameraY);

    if (!drawCachedRoomScenery(room, cameraX, cameraY)) {
      ctx.save();
      ctx.translate(-Math.round(cameraX), -Math.round(cameraY));
      drawArchitecture(room);
      const layer = getPlatformLayer(room);
      if (layer) {
        const sx = clamp(Math.round(cameraX), 0, Math.max(0, layer.width - W));
        const sy = clamp(Math.round(cameraY), 0, Math.max(0, layer.height - H));
        const sw = Math.min(W, layer.width - sx);
        const sh = Math.min(H, layer.height - sy);
        ctx.drawImage(layer, sx, sy, sw, sh, sx, sy, sw, sh);
      } else {
        for (const solid of room.platforms) drawPlatform(solid);
      }
      ctx.restore();
    }
  }

  function drawCachedRoomScenery(room, cameraX, cameraY) {
    if (!room || !room.drawbridge) return false;
    const layer = getRoomSceneryWorldLayer(room);
    if (!layer) return false;
    drawWorldLayerViewport(layer, cameraX, cameraY);
    return true;
  }

  function getRoomSceneryWorldLayer(room) {
    if (!room || !room.drawbridge) return null;
    const tileKey = images.introTiles && images.introTiles.width ? `${images.introTiles.width}x${images.introTiles.height}` : "none";
    const platformKey = images.tiles && images.tiles.width ? `${images.tiles.width}x${images.tiles.height}` : "none";
    const key = `${room.name}:${tileKey}:${platformKey}:${roomWidth(room)}x${roomHeight(room)}`;
    if (roomSceneryWorldCache.has(key)) return roomSceneryWorldCache.get(key);
    if (roomSceneryWorldCache.size > 3) roomSceneryWorldCache.clear();

    const layer = document.createElement("canvas");
    layer.width = roomWidth(room);
    layer.height = roomHeight(room);
    const g = layer.getContext("2d");
    g.imageSmoothingEnabled = true;
    drawCastleGardenSceneryTo(g, room);
    const platforms = getPlatformLayer(room);
    if (platforms) g.drawImage(platforms, 0, 0);
    roomSceneryWorldCache.set(key, layer);
    return layer;
  }

  function getRoomSceneryViewportLayer(room, cameraX, cameraY) {
    if (!room || !room.drawbridge) return null;
    const bucketX = Math.round(cameraX / 16) * 16;
    const bucketY = Math.round(cameraY / 16) * 16;
    const tileKey = images.introTiles && images.introTiles.width ? `${images.introTiles.width}x${images.introTiles.height}` : "none";
    const platformKey = images.tiles && images.tiles.width ? `${images.tiles.width}x${images.tiles.height}` : "none";
    const key = `${room.name}:${tileKey}:${platformKey}:${bucketX},${bucketY}`;
    if (roomSceneryCache.has(key)) return roomSceneryCache.get(key);
    if (roomSceneryCache.size > 10) roomSceneryCache.clear();

    const layer = document.createElement("canvas");
    layer.width = W;
    layer.height = H;
    const g = layer.getContext("2d");
    g.imageSmoothingEnabled = true;
    g.save();
    g.translate(-bucketX, -bucketY);
    drawCastleGardenSceneryTo(g, room);
    const platforms = getPlatformLayer(room);
    if (platforms) {
      const sx = clamp(bucketX, 0, Math.max(0, platforms.width - W));
      const sy = clamp(bucketY, 0, Math.max(0, platforms.height - H));
      const sw = Math.min(W, platforms.width - sx);
      const sh = Math.min(H, platforms.height - sy);
      g.drawImage(platforms, sx, sy, sw, sh, sx, sy, sw, sh);
    }
    g.restore();
    roomSceneryCache.set(key, layer);
    return layer;
  }

  function drawCastleGardenSceneryTo(target, room) {
    const bridge = room.drawbridge;
    if (bridge) {
      drawIntroTileCellTo(target, "pillar", bridge.x - 82, bridge.y - 152, 76, 238, 0.82);
      drawIntroTileCellTo(target, "pillar", bridge.x + bridge.w + 10, bridge.y - 150, 76, 238, 0.76);
    }

    const statueXs = [230, 560, 1240];
    for (const x of statueXs) {
      drawIntroTileCellTo(target, "statue", x - 34, 292, 86, 176, 0.88);
      drawIntroTileCellTo(target, "rose", x - 76, 438, 120, 42, 0.78);
    }
  }

  function drawMoatWaterUnderlay(room, cameraX, cameraY) {
    if (!room || !room.moatWater) return;
    ctx.save();
    ctx.translate(-Math.round(cameraX), -Math.round(cameraY));
    drawMoatWaterPlane(room, room.moatWater, cameraX, cameraY);
    ctx.restore();
  }

  function drawMoatWaterPlane(room, plane, cameraX, cameraY) {
    const img = images[plane.tile || "moatWaterTiles"];
    const x = plane.x || 0;
    const y = plane.y || Math.round(roomHeight(room) * 0.58);
    const w = plane.w || roomWidth(room);
    const h = plane.h || Math.max(96, roomHeight(room) - y);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    const depth = ctx.createLinearGradient(0, y, 0, y + h);
    depth.addColorStop(0, "rgba(42, 134, 154, 0.34)");
    depth.addColorStop(0.38, "rgba(8, 47, 67, 0.76)");
    depth.addColorStop(1, "rgba(1, 8, 18, 0.96)");
    ctx.fillStyle = depth;
    ctx.fillRect(x, y, w, h);

    if (img && img.width) {
      drawMode7MoatWaterPass(plane, img, x, y, w, h, cameraX, cameraY, 0, plane.bridgeChannel ? 0.58 : 0.62);
      if (!plane.bridgeChannel) {
        drawMode7MoatWaterPass(plane, img, x, y, w, h, cameraX, cameraY, 1, 0.36);
      }
    } else {
      drawFallbackMoatWater(x, y, w, h);
    }
    if (plane.bridgeChannel) drawBridgeChannelWaterHighlights(x, y, w, h);
    else drawMoatWaterHighlights(x, y, w, h);
    ctx.restore();
  }

  function drawMode7MoatWaterPass(plane, img, x, y, w, h, cameraX, cameraY, pass, alpha) {
    const frame = Math.floor(game.time * 7.5 + pass) % MOAT_WATER_FRAMES;
    const speedX = pass === 0 ? 28 : -14;
    const cameraFactor = pass === 0 ? 0.18 : 0.38;
    const layer = getMoatWaterMode7Layer(img, Math.ceil(w), Math.ceil(h), frame, pass);
    if (!layer) return;
    const scroll = positiveModulo(game.time * speedX + cameraX * cameraFactor + cameraY * 0.07, MOAT_WATER_TILE_SIZE);
    const baseX = x - MOAT_WATER_TILE_SIZE - scroll;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = alpha;
    ctx.drawImage(layer, baseX, y);
    ctx.restore();
  }

  function getMoatWaterMode7Layer(img, w, h, frame, pass) {
    if (!img || !img.width || w <= 0 || h <= 0) return null;
    const widthBucket = Math.ceil(w / 64) * 64;
    const heightBucket = Math.ceil(h / 32) * 32;
    const key = `${img.src || img.width}:${widthBucket}x${heightBucket}:${frame}:${pass}`;
    if (moatWaterRenderCache.has(key)) return moatWaterRenderCache.get(key);
    if (moatWaterRenderCache.size > 16) moatWaterRenderCache.clear();

    const layer = document.createElement("canvas");
    layer.width = widthBucket + MOAT_WATER_TILE_SIZE * 2;
    layer.height = heightBucket;
    const g = layer.getContext("2d");
    g.imageSmoothingEnabled = true;

    const sx = frame * MOAT_WATER_TILE_SIZE;
    const stride = pass === 0 ? 6 : 8;
    const center = layer.width / 2;
    for (let yy = 0; yy < h; yy += stride) {
      const t = yy / Math.max(1, h);
      const ease = t * t;
      const tileScale = (pass === 0 ? 0.74 : 0.96) + ease * (pass === 0 ? 1.45 : 1.9);
      const tileW = MOAT_WATER_TILE_SIZE * tileScale;
      const destH = Math.max(4, stride + 2 + ease * 8);
      const sy = Math.floor((yy * (0.76 + ease * 2.8) + pass * 41) % MOAT_WATER_TILE_SIZE);
      const srcH = Math.min(5, MOAT_WATER_TILE_SIZE - sy);
      const spread = w * (0.08 + ease * 0.34);
      const left = center - (widthBucket + spread) / 2 - MOAT_WATER_TILE_SIZE;
      const right = center + (widthBucket + spread) / 2 + MOAT_WATER_TILE_SIZE;
      const rowOffset = positiveModulo(yy * (0.22 + pass * 0.08), tileW);
      for (let dx = left - rowOffset - tileW; dx < right + tileW; dx += tileW) {
        g.drawImage(img, sx, sy, MOAT_WATER_TILE_SIZE, srcH, dx, yy, tileW + 1, destH);
      }
    }

    moatWaterRenderCache.set(key, layer);
    return layer;
  }

  function drawFallbackMoatWater(x, y, w, h) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.shadowColor = "#8beeff";
    ctx.shadowBlur = 7;
    for (let i = 0; i < 7; i += 1) {
      const yy = y + 12 + i * 15;
      ctx.globalAlpha = 0.32 - i * 0.025;
      ctx.strokeStyle = i % 2 ? "rgba(173, 238, 246, 0.45)" : "rgba(64, 188, 220, 0.42)";
      ctx.beginPath();
      for (let xx = x; xx <= x + w; xx += 18) {
        const waveY = yy + Math.sin(game.time * (2.1 + i * 0.1) + xx * 0.035 + i) * (2.2 + i * 0.22);
        if (xx === x) ctx.moveTo(xx, waveY);
        else ctx.lineTo(xx, waveY);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMoatWaterHighlights(x, y, w, h) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#baf8ff";
    ctx.shadowBlur = 9;
    for (let i = 0; i < 3; i += 1) {
      const yy = y + 12 + i * Math.max(18, h * 0.18);
      ctx.globalAlpha = 0.18 - i * 0.018;
      ctx.strokeStyle = i % 2 ? "rgba(228, 250, 236, 0.54)" : "rgba(91, 220, 244, 0.46)";
      ctx.beginPath();
      for (let xx = x - 20; xx <= x + w + 20; xx += 32) {
        const waveY = yy + Math.sin(game.time * 2.7 + xx * 0.028 + i * 1.4) * (2.6 + i * 0.3);
        if (xx === x - 20) ctx.moveTo(xx, waveY);
        else ctx.lineTo(xx, waveY);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    const fade = ctx.createLinearGradient(0, y, 0, y + h);
    fade.addColorStop(0, "rgba(170, 237, 246, 0.13)");
    fade.addColorStop(0.28, "rgba(54, 149, 178, 0.04)");
    fade.addColorStop(1, "rgba(0, 0, 0, 0.38)");
    ctx.fillStyle = fade;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  function drawBridgeChannelWaterHighlights(x, y, w, h) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineWidth = 1.25;
    for (let i = 0; i < 2; i += 1) {
      const yy = y + 14 + i * Math.max(24, h * 0.24);
      ctx.globalAlpha = 0.14 - i * 0.025;
      ctx.strokeStyle = i ? "rgba(228, 250, 236, 0.42)" : "rgba(91, 220, 244, 0.40)";
      ctx.beginPath();
      for (let xx = x - 16; xx <= x + w + 16; xx += 44) {
        const waveY = yy + Math.sin(game.time * 2.1 + xx * 0.024 + i * 1.4) * (2.2 + i * 0.2);
        if (xx === x - 16) ctx.moveTo(xx, waveY);
        else ctx.lineTo(xx, waveY);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    const fade = ctx.createLinearGradient(0, y, 0, y + h);
    fade.addColorStop(0, "rgba(170, 237, 246, 0.10)");
    fade.addColorStop(0.32, "rgba(54, 149, 178, 0.03)");
    fade.addColorStop(1, "rgba(0, 0, 0, 0.34)");
    ctx.fillStyle = fade;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  function positiveModulo(value, size) {
    return ((value % size) + size) % size;
  }

  function drawRoomBackground(room, bg, mid, cameraX, cameraY) {
    const rw = roomWidth(room);
    const rh = roomHeight(room);
    const outdoor = isOutdoorRoom(room);
    ctx.save();
    ctx.imageSmoothingEnabled = true;

    const worldCached = getRoomBackgroundWorldLayer(room, bg, mid, rw, rh, outdoor);
    if (worldCached) {
      drawWorldLayerViewport(worldCached, cameraX, cameraY);
      ctx.restore();
      ctx.imageSmoothingEnabled = false;
      return;
    }

    const cached = getRoomBackgroundViewportLayer(room, bg, mid, cameraX, cameraY, rw, rh, outdoor);
    if (cached) {
      ctx.drawImage(cached, 0, 0);
      ctx.restore();
      ctx.imageSmoothingEnabled = false;
      return;
    }

    // 1) Sky gradient (outdoor only) - dawn/twilight tint above horizon
    if (outdoor) {
      drawSkyGradient(room, rh);
    }

    // 2) Far background plane (slowest)
    drawParallaxPlane(bg, cameraX, cameraY, rw, rh, outdoor ? 0.16 : 0.28, outdoor ? 0.10 : 0.18, 1);

    // 3) First parallax element (mid-far)
    drawParallaxElements(room, cameraX, cameraY, rw, rh, 0);

    // 4) Mid plane (slightly faster)
    if (mid && mid.width) {
      drawParallaxPlane(mid, cameraX, cameraY, rw, rh, 0.48, 0.32, 0.24);
    }
    drawRoomBackgroundProps(room, cameraX, cameraY, rw, rh);

    // 5) Mode 7 perspective floor — strong for outdoor
    drawMode7Floor(room, bg, rw, rh, cameraX, cameraY, outdoor);

    // 6) Mid parallax element (in front of mode7 floor)
    drawParallaxElements(room, cameraX, cameraY, rw, rh, 1);

    // 7) Near-foreground parallax (fast, layered just behind playfield)
    if (outdoor) {
      drawNearForegroundParallax(room, cameraX, cameraY, rw, rh);
    }

    ctx.restore();
    ctx.imageSmoothingEnabled = false;
  }

  function drawRoomBackgroundProps(room, cameraX, cameraY, rw, rh) {
    const img = room && room.bg === "bgArmory" ? images.armoryProps : null;
    if (!img || !img.width) return false;
    drawParallaxPlane(img, cameraX, cameraY, rw, rh, 0.28, 0.18, 1);
    return true;
  }

  function drawWorldLayerViewport(layer, cameraX, cameraY, target = ctx) {
    if (!layer) return false;
    const sx = clamp(Math.round(cameraX), 0, Math.max(0, layer.width - W));
    const sy = clamp(Math.round(cameraY), 0, Math.max(0, layer.height - H));
    const sw = Math.min(W, layer.width - sx);
    const sh = Math.min(H, layer.height - sy);
    target.drawImage(layer, sx, sy, sw, sh, 0, 0, sw, sh);
    return true;
  }

  function getRoomBackgroundWorldLayer(room, bg, mid, rw, rh, outdoor) {
    if (!room || !room.drawbridge || !bg || !bg.width) return null;
    const midKey = mid && mid.width ? `${mid.width}x${mid.height}` : "none";
    const paraKey = parallaxKeysForRoom(room).join(",");
    const key = `${room.name}:${room.bg}:${bg.width}x${bg.height}:${midKey}:${paraKey}:${rw}x${rh}:${outdoor ? "out" : "in"}`;
    if (roomBackgroundWorldCache.has(key)) return roomBackgroundWorldCache.get(key);
    if (roomBackgroundWorldCache.size > 3) roomBackgroundWorldCache.clear();

    const layer = document.createElement("canvas");
    layer.width = rw;
    layer.height = rh;
    const g = layer.getContext("2d");
    g.imageSmoothingEnabled = true;

    if (outdoor) drawSkyGradientWorldTo(g, room, rw, rh);
    drawParallaxPlaneTo(g, bg, 0, 0, rw, rh, 0, 0, 1);
    drawParallaxElementsTo(g, room, 0, 0, rw, rh, 0);
    if (mid && mid.width) drawParallaxPlaneTo(g, mid, 0, 0, rw, rh, 0, 0, 0.24);
    drawMode7FloorTo(g, room, bg, rw, rh, 0, 0, outdoor);
    drawParallaxElementsTo(g, room, 0, 0, rw, rh, 1);
    if (outdoor) drawNearForegroundParallaxTo(g, room, 0, 0, rw, rh);

    roomBackgroundWorldCache.set(key, layer);
    return layer;
  }

  function getRoomBackgroundViewportLayer(room, bg, mid, cameraX, cameraY, rw, rh, outdoor) {
    if (!room || !room.drawbridge || !bg || !bg.width) return null;
    const bucketX = Math.round(cameraX / 16) * 16;
    const bucketY = Math.round(cameraY / 16) * 16;
    const midKey = mid && mid.width ? `${mid.width}x${mid.height}` : "none";
    const paraKey = parallaxKeysForRoom(room).join(",");
    const key = `${room.name}:${room.bg}:${bg.width}x${bg.height}:${midKey}:${paraKey}:${rw}x${rh}:${bucketX},${bucketY}:${outdoor ? "out" : "in"}`;
    if (roomBackgroundCache.has(key)) return roomBackgroundCache.get(key);
    if (roomBackgroundCache.size > 10) roomBackgroundCache.clear();

    const layer = document.createElement("canvas");
    layer.width = W;
    layer.height = H;
    const g = layer.getContext("2d");
    g.imageSmoothingEnabled = true;

    if (outdoor) drawSkyGradientTo(g, room, rh);
    drawParallaxPlaneTo(g, bg, bucketX, bucketY, rw, rh, outdoor ? 0.16 : 0.28, outdoor ? 0.10 : 0.18, 1);
    drawParallaxElementsTo(g, room, bucketX, bucketY, rw, rh, 0);
    if (mid && mid.width) {
      drawParallaxPlaneTo(g, mid, bucketX, bucketY, rw, rh, 0.48, 0.32, 0.24);
    }
    drawMode7FloorTo(g, room, bg, rw, rh, bucketX, bucketY, outdoor);
    drawParallaxElementsTo(g, room, bucketX, bucketY, rw, rh, 1);
    if (outdoor) drawNearForegroundParallaxTo(g, room, bucketX, bucketY, rw, rh);

    roomBackgroundCache.set(key, layer);
    return layer;
  }

  function drawSkyGradientTo(target, room, rh) {
    const horizon = rh * 0.62;
    const grad = target.createLinearGradient(0, 0, 0, horizon);
    const palette = room.palette;
    if (palette === "green") {
      grad.addColorStop(0, "#0e1530");
      grad.addColorStop(0.55, "#3a1d3c");
      grad.addColorStop(1, "#7e3a32");
    } else if (palette === "gold") {
      grad.addColorStop(0, "#1a0e1a");
      grad.addColorStop(0.55, "#54213a");
      grad.addColorStop(1, "#8a4424");
    } else {
      grad.addColorStop(0, "#0a0a18");
      grad.addColorStop(1, "#3a1d36");
    }
    target.fillStyle = grad;
    target.fillRect(0, 0, W, Math.min(H, horizon));

    if (!room.__moonX) {
      room.__moonX = 120 + Math.random() * (W - 240);
      room.__moonY = 60 + Math.random() * 50;
    }
    const mx = room.__moonX;
    const my = room.__moonY;
    const halo = target.createRadialGradient(mx, my, 6, mx, my, 90);
    halo.addColorStop(0, "rgba(244, 224, 180, 0.65)");
    halo.addColorStop(0.4, "rgba(244, 211, 139, 0.25)");
    halo.addColorStop(1, "rgba(244, 211, 139, 0)");
    target.fillStyle = halo;
    target.fillRect(mx - 100, my - 100, 200, 200);
    target.fillStyle = "#fff5dd";
    target.beginPath();
    target.arc(mx, my, 24, 0, Math.PI * 2);
    target.fill();
    target.fillStyle = "rgba(20, 18, 32, 0.35)";
    target.beginPath();
    target.arc(mx + 8, my - 4, 22, 0, Math.PI * 2);
    target.fill();
  }

  function drawSkyGradientWorldTo(target, room, rw, rh) {
    const horizon = rh * 0.62;
    const grad = target.createLinearGradient(0, 0, 0, horizon);
    const palette = room.palette;
    if (palette === "green") {
      grad.addColorStop(0, "#0e1530");
      grad.addColorStop(0.55, "#3a1d3c");
      grad.addColorStop(1, "#7e3a32");
    } else if (palette === "gold") {
      grad.addColorStop(0, "#1a0e1a");
      grad.addColorStop(0.55, "#54213a");
      grad.addColorStop(1, "#8a4424");
    } else {
      grad.addColorStop(0, "#0a0a18");
      grad.addColorStop(1, "#3a1d36");
    }
    target.fillStyle = grad;
    target.fillRect(0, 0, rw, Math.min(rh, horizon));

    const mx = Math.round(clamp(rw * 0.58, 140, rw - 140));
    const my = 84;
    const halo = target.createRadialGradient(mx, my, 8, mx, my, 112);
    halo.addColorStop(0, "rgba(244, 224, 180, 0.58)");
    halo.addColorStop(0.42, "rgba(244, 211, 139, 0.22)");
    halo.addColorStop(1, "rgba(244, 211, 139, 0)");
    target.fillStyle = halo;
    target.fillRect(mx - 124, my - 124, 248, 248);
    target.fillStyle = "#fff5dd";
    target.beginPath();
    target.arc(mx, my, 28, 0, Math.PI * 2);
    target.fill();
    target.fillStyle = "rgba(20, 18, 32, 0.35)";
    target.beginPath();
    target.arc(mx + 9, my - 5, 25, 0, Math.PI * 2);
    target.fill();
  }

  function isOutdoorRoom(room) {
    if (!room) return false;
    if (room.outdoor === true) return true;
    if (room.outdoor === false) return false;
    const b = room.bg;
    return b === "bgForest" || b === "bgCastleGarden" || b === "bgGarden" || b === "bgGate";
  }

  function drawSkyGradient(room, rh) {
    const horizon = rh * 0.62;
    const grad = ctx.createLinearGradient(0, 0, 0, horizon);
    const palette = room.palette;
    if (palette === "green") {
      // Forest dawn: deep indigo → mauve → orange
      grad.addColorStop(0, "#0e1530");
      grad.addColorStop(0.55, "#3a1d3c");
      grad.addColorStop(1, "#7e3a32");
    } else if (palette === "gold") {
      // Gate dusk: burnt amber sky
      grad.addColorStop(0, "#1a0e1a");
      grad.addColorStop(0.55, "#54213a");
      grad.addColorStop(1, "#8a4424");
    } else {
      grad.addColorStop(0, "#0a0a18");
      grad.addColorStop(1, "#3a1d36");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, Math.min(H, horizon));

    // Distant moon for outdoor rooms
    if (!room.__moonX) {
      room.__moonX = 120 + Math.random() * (W - 240);
      room.__moonY = 60 + Math.random() * 50;
    }
    const mx = room.__moonX;
    const my = room.__moonY;
    const halo = ctx.createRadialGradient(mx, my, 6, mx, my, 90);
    halo.addColorStop(0, "rgba(244, 224, 180, 0.65)");
    halo.addColorStop(0.4, "rgba(244, 211, 139, 0.25)");
    halo.addColorStop(1, "rgba(244, 211, 139, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(mx - 100, my - 100, 200, 200);
    ctx.fillStyle = "#fff5dd";
    ctx.beginPath();
    ctx.arc(mx, my, 24, 0, Math.PI * 2);
    ctx.fill();
    // Moon shadow crescent
    ctx.fillStyle = "rgba(20, 18, 32, 0.35)";
    ctx.beginPath();
    ctx.arc(mx + 8, my - 4, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNearForegroundParallax(room, cameraX, cameraY, rw, rh) {
    // Fast-scrolling silhouette band along the bottom for depth.
    const keys = parallaxKeysForRoom(room);
    const img = images[keys[0]];
    if (img && img.width) {
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.translate(-Math.round(cameraX * 0.92), -Math.round(cameraY * 0.85));
      const bandH = Math.round(rh * 0.34);
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, rh - bandH, rw, bandH);
      ctx.restore();
    }
    // Dark vignette band along the bottom edge (camera-locked)
    const grad = ctx.createLinearGradient(0, rh - 80, 0, rh);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, rh - 80, rw, 80);
  }

  function drawNearForegroundParallaxTo(target, room, cameraX, cameraY, rw, rh) {
    const keys = parallaxKeysForRoom(room);
    const img = images[keys[0]];
    if (img && img.width) {
      target.save();
      target.globalAlpha = 0.32;
      target.translate(-Math.round(cameraX * 0.92), -Math.round(cameraY * 0.85));
      const bandH = Math.round(rh * 0.34);
      target.drawImage(img, 0, 0, img.width, img.height, 0, rh - bandH, rw, bandH);
      target.restore();
    }
    const grad = target.createLinearGradient(0, rh - 80, 0, rh);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.55)");
    target.fillStyle = grad;
    target.fillRect(0, rh - 80, rw, 80);
  }

  function drawParallaxPlane(img, cameraX, cameraY, rw, rh, speedX, speedY, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(-Math.round(cameraX * speedX), -Math.round(cameraY * speedY));
    drawStretchPlane(img, 0, 0, rw, rh);
    ctx.restore();
  }

  function drawParallaxPlaneTo(target, img, cameraX, cameraY, rw, rh, speedX, speedY, alpha = 1) {
    if (!img || !img.width) {
      if (alpha >= 0.99) {
        target.fillStyle = "#08080d";
        target.fillRect(0, 0, W, H);
      }
      return;
    }
    target.save();
    target.globalAlpha *= alpha;
    target.translate(-Math.round(cameraX * speedX), -Math.round(cameraY * speedY));
    target.drawImage(img, 0, 0, img.width, img.height, 0, 0, rw, rh);
    target.restore();
  }

  function drawParallaxElements(room, cameraX, cameraY, rw, rh, pass) {
    const keys = parallaxKeysForRoom(room);
    const key = keys[pass];
    const img = key && images[key];
    if (!img || !img.width) return;
    const speed = pass === 0 ? 0.42 : 0.68;
    const vertical = pass === 0 ? 0.22 : 0.48;
    const alpha = pass === 0 ? 0.34 : 0.48;
    drawParallaxPlane(img, cameraX, cameraY, rw, rh, speed, vertical, alpha);
  }

  function drawParallaxElementsTo(target, room, cameraX, cameraY, rw, rh, pass) {
    const keys = parallaxKeysForRoom(room);
    const key = keys[pass];
    const img = key && images[key];
    if (!img || !img.width) return;
    const speed = pass === 0 ? 0.42 : 0.68;
    const vertical = pass === 0 ? 0.22 : 0.48;
    const alpha = pass === 0 ? 0.34 : 0.48;
    drawParallaxPlaneTo(target, img, cameraX, cameraY, rw, rh, speed, vertical, alpha);
  }

  function parallaxKeysForRoom(room) {
    if (!room) return ["paraArches", "paraMist"];
    if (room.para) return room.para;
    if (room.bg === "bgClock" || room.bg === "bgBelltower" || room.bg === "bgLoft") return ["paraMachinery", "paraArches"];
    if (room.bg === "bgTower") return ["paraMachinery", "paraArches"];
    if (room.bg === "bgObservatory") return ["paraMoonwellRipples", "paraMachinery"];
    if (room.bg === "bgArmory" || room.bg === "bgGallery" || room.bg === "bgChapel" || room.bg === "bgAntechamber") return ["paraArches", "paraMist"];
    if (room.bg === "bgSanctum") return ["paraCrystals", "paraMist"];
    if (room.bg === "bgCatacomb") return ["paraMist", null];
    if (room.bg === "bgCavern" || room.bg === "bgAqueduct") return ["paraCrystals", "paraMist"];
    if (room.bg === "bgCrypt" || room.bg === "bgOssuary" || room.bg === "bgGarden") return ["paraMist", "paraArches"];
    return ["paraArches", "paraMist"];
  }

  function getPlatformLayer(room) {
    if (room.__platformLayer) return room.__platformLayer;
    if (!images.tiles || !images.tiles.width) return null;
    const c = document.createElement("canvas");
    c.width = roomWidth(room);
    c.height = roomHeight(room);
    const cx = c.getContext("2d");
    cx.imageSmoothingEnabled = true;
    for (const solid of room.platforms) drawPlatformInto(cx, solid);
    room.__platformLayer = c;
    return c;
  }

  function drawPlatformInto(cx, solid) {
    const source = platformTileSource(solid);
    cx.fillStyle = platformBaseFill(solid.type);
    cx.fillRect(solid.x, solid.y, solid.w, solid.h);
    if (source.img && source.img.width) {
      const sx0 = source.cell[0] * source.size;
      const sy0 = source.cell[1] * source.size;
      cx.save();
      cx.globalAlpha = solid.type === "trim" ? 0.96 : 0.92;
      cx.imageSmoothingEnabled = true;
      for (let x = solid.x; x < solid.x + solid.w; x += TILE_DRAW_SIZE) {
        for (let y = solid.y; y < solid.y + solid.h; y += TILE_DRAW_SIZE) {
          cx.drawImage(
            source.img,
            sx0,
            sy0,
            source.size,
            source.size,
            x,
            y,
            Math.min(TILE_DRAW_SIZE, solid.x + solid.w - x),
            Math.min(TILE_DRAW_SIZE, solid.y + solid.h - y)
          );
        }
      }
      cx.restore();
    }
    drawPlatformBevel(cx, solid);
  }

  function platformTileSource(solid) {
    if (INTRO_TILE_CELLS[solid.type] && images.introTiles && images.introTiles.width) {
      return { img: images.introTiles, cell: INTRO_TILE_CELLS[solid.type], size: INTRO_TILE_SOURCE_SIZE };
    }
    return { img: images.tiles, cell: platformTileCell(solid), size: TILE_SOURCE_SIZE };
  }

  function platformTileCell(solid) {
    return PLATFORM_TILE_CELLS[solid.type] || PLATFORM_TILE_CELLS.gold;
  }

  function platformBaseFill(type) {
    if (type === "forest" || type === "root") return "rgba(10, 24, 16, 0.82)";
    if (type === "gardenStone" || type === "rose") return "rgba(25, 31, 24, 0.82)";
    if (type === "green") return "rgba(12, 28, 18, 0.78)";
    if (type === "red") return "rgba(34, 10, 15, 0.80)";
    if (type === "blue") return "rgba(9, 18, 37, 0.80)";
    if (type === "trim") return "rgba(18, 17, 20, 0.84)";
    if (type === "stone") return "rgba(18, 19, 23, 0.80)";
    return "rgba(29, 23, 16, 0.78)";
  }

  function drawPlatformBevel(cx, solid) {
    const top = solid.type === "blue" ? "rgba(166, 214, 255, 0.24)" : solid.type === "green" ? "rgba(203, 244, 162, 0.20)" : solid.type === "red" ? "rgba(255, 142, 134, 0.20)" : "rgba(255, 225, 160, 0.22)";
    cx.fillStyle = top;
    cx.fillRect(solid.x, solid.y, solid.w, 3);
    cx.fillStyle = "rgba(255, 255, 255, 0.06)";
    cx.fillRect(solid.x, solid.y + 3, solid.w, 2);
    cx.fillStyle = "rgba(0, 0, 0, 0.34)";
    cx.fillRect(solid.x, solid.y + solid.h - 5, solid.w, 5);
    cx.fillStyle = "rgba(0, 0, 0, 0.22)";
    cx.fillRect(solid.x, solid.y, 2, solid.h);
    cx.fillRect(solid.x + solid.w - 2, solid.y, 2, solid.h);
  }

  function chromaCutoutImage(img, key) {
    if (!img || !img.width) return null;
    if (chromaCutoutCache.has(key)) return chromaCutoutCache.get(key);
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    try {
      const pixels = g.getImageData(0, 0, c.width, c.height);
      const data = pixels.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const gr = data[i + 1];
        const b = data[i + 2];
        if (gr > 130 && gr > r * 1.45 && gr > b * 1.45) {
          const greenDominance = Math.min(1, (gr - Math.max(r, b)) / 150);
          data[i + 3] = Math.max(0, Math.round(data[i + 3] * (1 - greenDominance)));
        }
      }
      g.putImageData(pixels, 0, 0);
    } catch (err) {
      return img;
    }
    chromaCutoutCache.set(key, c);
    return c;
  }

  function drawChromaAtlasSprite(img, cacheKey, sx, sy, sw, sh, dx, dy, dw, dh, alpha = 1) {
    const cutout = chromaCutoutImage(img, cacheKey);
    if (!cutout) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha *= alpha;
    ctx.drawImage(cutout, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.restore();
    return true;
  }

  function drawImagenHdMoon(x, y, w, h, alpha = 0.68, variant = 0) {
    const img = images.towerProps;
    if (!img || !img.width) return false;
    const moonY = img.height * 0.64;
    const moonH = img.height * 0.36;
    const split = img.width * 0.48;
    const sx = variant ? split : 0;
    const sw = variant ? img.width - split : split;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    drawChromaAtlasSprite(img, "towerProps", sx, moonY, sw, moonH, x, y, w, h, alpha);
    ctx.restore();
    return true;
  }

  function drawHdImageLayer(img, x, y, w, h, alpha = 1, mode = "source-over") {
    if (!img || !img.width) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha *= alpha;
    ctx.globalCompositeOperation = mode;
    ctx.drawImage(img, 0, 0, img.width, img.height, x, y, w, h);
    ctx.restore();
    return true;
  }

  function drawRoomSpecificHdProps(room) {
    if (!room) return false;
    if (game.roomId === "observatory") return drawObservatoryHdProps();
    if (game.roomId === "chapel") return drawChapelHdProps();
    if (game.roomId === "moonwell") return drawMoonwellHdProps(room);
    if (game.roomId === "antechamber") return drawCrimsonChamberHdProps();
    if (game.roomId === "emberFoundry") return drawEmberFoundryHdProps(room);
    if (game.roomId === "sanctum") return drawDrownedSanctumHdProps(room);
    return false;
  }

  function drawObservatoryHdProps() {
    let drew = false;
    drew = drawHdImageLayer(images.paraMachinery, 122, 28, 520, 290, 0.28, "screen") || drew;
    drew = drawHdImageLayer(images.paraMoonwellRipples, 720, 0, 620, 260, 0.18, "screen") || drew;
    drew = drawImagenHdMoon(1030, 34, 276, 158, 0.72, 0) || drew;
    drew = drawChromaAtlasSprite(images.questIcons, "questIcons", 128, 0, 128, 128, 1148, 116, 88, 88, 0.72) || drew;
    return drew;
  }

  function drawChapelHdProps() {
    let drew = false;
    drew = drawHdImageLayer(images.paraArches, 72, 10, 760, 360, 0.24, "screen") || drew;
    drew = drawImagenHdMoon(640, 38, 262, 154, 0.66, 1) || drew;
    drew = drawChromaAtlasSprite(images.doorsHd, "doorsHd", 0, 0, DOOR_FRAME_SIZE, DOOR_FRAME_SIZE, 782, 190, 154, 248, 0.52) || drew;
    return drew;
  }

  function drawMoonwellHdProps(room) {
    let drew = false;
    const rw = roomWidth(room);
    const rh = roomHeight(room);
    drew = drawHdImageLayer(images.bgMoonwell, 0, 0, rw, rh, 0.24, "screen") || drew;
    drew = drawHdImageLayer(images.paraMoonwellRipples, 0, 180, rw, 380, 0.42, "screen") || drew;
    drew = drawHdImageLayer(images.paraCrystals, 760, 40, 520, 360, 0.28, "screen") || drew;
    drew = drawImagenHdMoon(1046, 48, 230, 138, 0.52, 1) || drew;
    return drew;
  }

  function drawCrimsonChamberHdProps() {
    let drew = false;
    drew = drawHdImageLayer(images.paraArches, 0, 0, 920, 420, 0.18, "screen") || drew;
    drew = drawHdImageLayer(images.paraEmberChains, 560, 0, 760, 430, 0.34, "screen") || drew;
    drew = drawChromaAtlasSprite(images.doorsHd, "doorsHd", DOOR_FRAME_SIZE, 0, DOOR_FRAME_SIZE, DOOR_FRAME_SIZE, 1120, 196, 168, 248, 0.48) || drew;
    drew = drawChromaAtlasSprite(images.questIcons, "questIcons", 0, 0, 128, 128, 392, 86, 104, 104, 0.36) || drew;
    drew = drawChromaAtlasSprite(images.questIcons, "questIcons", 128, 0, 128, 128, 520, 112, 84, 84, 0.28) || drew;
    return drew;
  }

  function drawEmberFoundryHdProps(room) {
    let drew = false;
    const rw = roomWidth(room);
    drew = drawHdImageLayer(images.bgEmberFoundry, 0, 0, rw, roomHeight(room), 0.18, "screen") || drew;
    drew = drawHdImageLayer(images.paraEmberChains, 110, 0, rw - 180, 440, 0.48, "screen") || drew;
    drew = drawHdImageLayer(images.paraMachinery, 560, 20, 620, 380, 0.34, "source-over") || drew;
    drew = drawChromaAtlasSprite(images.towerProps, "towerProps", 0, 0, images.towerProps ? images.towerProps.width / 4 : 0, images.towerProps ? images.towerProps.height * 0.42 : 0, 1046, -22, 90, 270, 0.58) || drew;
    return drew;
  }

  function drawDrownedSanctumHdProps(room) {
    let drew = false;
    const rw = roomWidth(room);
    const rh = roomHeight(room);
    drew = drawHdImageLayer(images.bgSanctum, 0, 0, rw, rh, 0.18, "screen") || drew;
    drew = drawHdImageLayer(images.paraCavernSpires, -40, 10, rw + 80, 430, 0.30, "source-over") || drew;
    drew = drawHdImageLayer(images.paraMoonwellRipples, 90, 250, rw - 120, 260, 0.30, "screen") || drew;
    const spikes = images.grottoSpikesHd;
    if (spikes && spikes.width) {
      for (let x = 90, i = 0; x < rw - 70; x += 245, i += 1) {
        const cell = (i % Math.max(1, Math.floor(spikes.width / GROTTO_SPIKE_FRAME_SIZE))) * GROTTO_SPIKE_FRAME_SIZE;
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.globalAlpha = 0.48;
        ctx.drawImage(spikes, cell, 0, GROTTO_SPIKE_FRAME_SIZE, GROTTO_SPIKE_FRAME_SIZE, x, 40 + (i % 2) * 26, 136, 184);
        ctx.drawImage(spikes, cell, GROTTO_SPIKE_FRAME_SIZE, GROTTO_SPIKE_FRAME_SIZE, GROTTO_SPIKE_FRAME_SIZE, x + 68, 398, 120, 92);
        ctx.restore();
      }
      drew = true;
    }
    return drew;
  }

  function drawTowerHdProps(room) {
    const img = images.towerProps;
    if (!img || !img.width) return false;
    const t = game.time;
    const cellW = img.width / 4;
    const chainH = img.height * 0.42;
    const anchorY = img.height * 0.39;
    const anchorH = img.height * 0.27;
    const moonY = img.height * 0.64;
    const moonH = img.height * 0.36;
    const chains = [
      { frame: 0, x: 86, y: -24, w: 94, h: 252, a: 0.74 },
      { frame: 1, x: 372, y: -34, w: 86, h: 234, a: 0.68 },
      { frame: 2, x: 642, y: -18, w: 70, h: 248, a: 0.72 },
      { frame: 3, x: 1034, y: -30, w: 96, h: 268, a: 0.76 },
      { frame: 1, x: 1236, y: -20, w: 82, h: 236, a: 0.62 }
    ];
    ctx.save();
    for (const c of chains) {
      const sway = Math.sin(t * 0.85 + c.x * 0.02) * 4;
      drawChromaAtlasSprite(img, "towerProps", c.frame * cellW, 0, cellW, chainH, c.x + sway, c.y, c.w, c.h, c.a);
      drawChromaAtlasSprite(img, "towerProps", c.frame * cellW, anchorY, cellW, anchorH, c.x - 34 + sway, c.y + c.h - 12, c.w + 68, 118, 0.72);
    }
    ctx.globalCompositeOperation = "screen";
    drawChromaAtlasSprite(img, "towerProps", 0, moonY, img.width * 0.48, moonH, 852, 40, 252, 148, 0.62);
    drawChromaAtlasSprite(img, "towerProps", img.width * 0.48, moonY, img.width * 0.52, moonH, 548, 58, 212, 128, 0.56);
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
    return true;
  }

  function drawGalleryPortraits(room) {
    const img = images.galleryPortraits;
    if (!img || !img.width) return false;
    const cellW = img.width / 4;
    const cellH = img.height / 2;
    const portraits = [
      { i: 0, x: 56, y: 88, w: 134, h: 212, a: 0.72 },
      { i: 1, x: 250, y: 74, w: 150, h: 236, a: 0.82 },
      { i: 2, x: 468, y: 94, w: 132, h: 210, a: 0.72 },
      { i: 3, x: 686, y: 76, w: 148, h: 232, a: 0.78 },
      { i: 4, x: 924, y: 102, w: 132, h: 208, a: 0.68 },
      { i: 5, x: 1134, y: 82, w: 146, h: 226, a: 0.78 },
      { i: 6, x: 330, y: 352, w: 112, h: 176, a: 0.54 },
      { i: 7, x: 1048, y: 344, w: 118, h: 184, a: 0.52 }
    ];
    ctx.save();
    for (const p of portraits) {
      const col = p.i % 4;
      const row = Math.floor(p.i / 4);
      drawChromaAtlasSprite(img, "galleryPortraits", col * cellW, row * cellH, cellW, cellH, p.x, p.y, p.w, p.h, p.a);
    }
    ctx.restore();
    return true;
  }

  function drawCatacombHdProps(room) {
    const img = images.catacombProps;
    if (!img || !img.width) return false;
    const cellW = img.width / 2;
    const cellH = img.height / 3;
    const t = game.time;
    const draw = (col, row, x, y, w, h, alpha = 1, sway = 0) => {
      const dx = x + (sway ? Math.sin(t * 0.75 + x * 0.018) * sway : 0);
      drawChromaAtlasSprite(img, "catacombProps", col * cellW, row * cellH, cellW, cellH, dx, y, w, h, alpha);
    };

    ctx.save();
    draw(0, 0, 424, -46, 250, 194, 0.62, 3);
    draw(1, 0, 646, 22, 196, 202, 0.72, 5);
    draw(0, 1, 126, 138, 314, 260, 0.84);
    draw(1, 1, 608, 130, 194, 192, 0.78);
    draw(0, 2, 54, 224, 190, 246, 0.76);
    draw(1, 2, 654, 374, 282, 114, 0.86);

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.14 + Math.sin(t * 2.2) * 0.03;
    const flameGlow = ctx.createRadialGradient(706, 204, 4, 706, 204, 86);
    flameGlow.addColorStop(0, "rgba(106, 226, 211, 0.86)");
    flameGlow.addColorStop(0.48, "rgba(73, 164, 158, 0.22)");
    flameGlow.addColorStop(1, "rgba(73, 164, 158, 0)");
    ctx.fillStyle = flameGlow;
    ctx.fillRect(620, 120, 172, 172);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.restore();
    return true;
  }

  function drawOrganicMazeContours(room) {
    if (!room || !room.organic) return false;
    const rw = roomWidth(room);
    const rh = roomHeight(room);
    const color = room.organic === "gears" ? "rgba(46, 18, 14, 0.62)"
      : room.organic === "reservoir" || room.organic === "sluice" ? "rgba(5, 22, 36, 0.62)"
      : room.organic === "bones" ? "rgba(19, 22, 18, 0.62)"
      : "rgba(8, 15, 13, 0.62)";
    ctx.save();
    ctx.fillStyle = color;
    for (let x = -40, i = 0; x < rw + 120; x += 138, i += 1) {
      const top = 42 + ((i * 37) % 72);
      const drop = 86 + ((i * 29) % 118);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 86, 0);
      ctx.lineTo(x + 74, top + drop);
      ctx.quadraticCurveTo(x + 48, top + drop + 34, x + 26, top + drop * 0.62);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 0.38;
    for (let x = 70, i = 0; x < rw; x += 220, i += 1) {
      const h = 130 + (i % 3) * 38;
      const y = rh - h - 76 + Math.sin(i * 1.7) * 18;
      ctx.beginPath();
      ctx.moveTo(x - 34, rh);
      ctx.lineTo(x + 42, y);
      ctx.lineTo(x + 96, rh);
      ctx.closePath();
      ctx.fill();
      if (room.organic === "gears") {
        ctx.strokeStyle = "rgba(255, 122, 79, 0.22)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(x + 38, y + 28, 34, 0, Math.PI * 2);
        ctx.stroke();
      } else if (room.organic === "reservoir" || room.organic === "sluice") {
        ctx.strokeStyle = "rgba(126, 232, 255, 0.18)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 22, y + 52);
        ctx.quadraticCurveTo(x + 42, y + 70, x + 98, y + 38);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    return true;
  }

  function drawArchitecture(room) {
    if (room.bg === "bgForest" || room.bg === "bgCastleGarden") return;
    drawOrganicMazeContours(room);

    const chain = images.chain;
    const lamp = images.lamp;
    if (!chain || !lamp || !images.tiles) return;
    const useTowerProps = game.roomId === "tower" && drawTowerHdProps(room);
    const useCatacombProps = game.roomId === "catacomb" && drawCatacombHdProps(room);
    const useRoomProps = drawRoomSpecificHdProps(room);
    if (game.roomId === "gallery") drawGalleryPortraits(room);
    if (!useTowerProps && !useCatacombProps && !useRoomProps) {
      for (let x = 88; x < roomWidth(room); x += 192) {
        ctx.globalAlpha = 0.42;
        ctx.drawImage(chain, x, 34 + Math.sin(game.time + x) * 3, 24, 146);
        ctx.globalAlpha = 0.8;
        ctx.drawImage(lamp, x - 18, 170 + Math.sin(game.time * 1.7 + x) * 3, 42, 42);
      }
    }
    if (!useRoomProps) {
      ctx.globalAlpha = room.palette === "green" ? 0.18 : 0.14;
      const trimTile = PLATFORM_TILE_CELLS.trim;
      const accentTile = room.palette === "green" ? PLATFORM_TILE_CELLS.green : room.palette === "blue" ? PLATFORM_TILE_CELLS.blue : room.palette === "red" ? PLATFORM_TILE_CELLS.red : PLATFORM_TILE_CELLS.stone;
      for (let x = -40; x < roomWidth(room) + 80; x += 112) {
        drawTileCell(trimTile[0], trimTile[1], x, 76, 64, 64);
        drawTileCell(accentTile[0], accentTile[1], x + 44, 138, 64, 64);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawForestArchitecture(room) {
    ctx.save();
    ctx.globalAlpha = 0.48;
    for (let x = -40; x < roomWidth(room) + 120; x += 170) {
      const sway = Math.sin(game.time * 0.8 + x * 0.03) * 3;
      ctx.fillStyle = "rgba(9, 13, 12, 0.82)";
      ctx.fillRect(x + sway, 58, 34, 430);
      ctx.fillStyle = "rgba(24, 39, 27, 0.68)";
      ctx.fillRect(x + 24 + sway, 90, 18, 330);
      drawIntroTileCell("ivy", x - 18 + sway, 114, 88, 116, 0.34);
    }
    ctx.globalAlpha = 1;
    for (let x = 180; x < roomWidth(room); x += 320) {
      ctx.strokeStyle = "rgba(92, 75, 48, 0.72)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 110);
      ctx.lineTo(x, 208);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 183, 88, 0.75)";
      ctx.shadowColor = "#ffae3a";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(x, 220 + Math.sin(game.time * 2 + x) * 2, 8, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function drawCastleGardenArchitecture(room) {
    ctx.save();
    const bridge = room.drawbridge;
    if (bridge) {
      drawIntroTileCell("pillar", bridge.x - 82, bridge.y - 152, 76, 238, 0.82);
      drawIntroTileCell("pillar", bridge.x + bridge.w + 10, bridge.y - 150, 76, 238, 0.76);
    }

    const statueXs = [230, 560, 1240];
    for (const x of statueXs) {
      drawIntroTileCell("statue", x - 34, 292 + Math.sin(game.time + x) * 1.2, 86, 176, 0.88);
      drawIntroTileCell("rose", x - 76, 438, 120, 42, 0.78);
    }
    ctx.restore();
  }

  function drawIntroTileCell(type, x, y, w, h, alpha = 1) {
    const cell = INTRO_TILE_CELLS[type];
    const img = images.introTiles;
    if (!cell || !img || !img.width) return;
    const old = ctx.globalAlpha;
    ctx.globalAlpha = old * alpha;
    ctx.drawImage(
      img,
      cell[0] * INTRO_TILE_SOURCE_SIZE,
      cell[1] * INTRO_TILE_SOURCE_SIZE,
      INTRO_TILE_SOURCE_SIZE,
      INTRO_TILE_SOURCE_SIZE,
      x,
      y,
      w,
      h
    );
    ctx.globalAlpha = old;
  }

  function drawIntroTileCellTo(target, type, x, y, w, h, alpha = 1) {
    const cell = INTRO_TILE_CELLS[type];
    const img = images.introTiles;
    if (!cell || !img || !img.width) return;
    const old = target.globalAlpha;
    target.globalAlpha = old * alpha;
    target.drawImage(
      img,
      cell[0] * INTRO_TILE_SOURCE_SIZE,
      cell[1] * INTRO_TILE_SOURCE_SIZE,
      INTRO_TILE_SOURCE_SIZE,
      INTRO_TILE_SOURCE_SIZE,
      x,
      y,
      w,
      h
    );
    target.globalAlpha = old;
  }

  function drawPlatform(solid) {
    drawPlatformInto(ctx, solid);
  }

  function drawTileCell(tileX, tileY, x, y, w, h) {
    if (!images.tiles) return;
    ctx.drawImage(images.tiles, tileX * TILE_SOURCE_SIZE, tileY * TILE_SOURCE_SIZE, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE, x, y, w, h);
  }

  function drawDoors() {
    const gate = images.gate;
    for (const door of game.room.doors) {
      const open = doorOpen(door);
      if (door.hidden) {
        // Subtle sparkle hint when player is near
        const cx = door.x + door.w / 2;
        const cy = door.y + door.h / 2;
        const dx = (player.x + player.w / 2) - cx;
        const dy = (player.y + player.h / 2) - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < 220) {
          const alpha = (1 - dist / 220) * 0.6;
          const pulse = 0.5 + 0.5 * Math.sin(game.time * 4);
          ctx.globalAlpha = alpha * pulse;
          ctx.shadowColor = "#ffd065";
          ctx.shadowBlur = 14;
          ctx.fillStyle = "rgba(244, 211, 139, 0.4)";
          for (let i = 0; i < 5; i += 1) {
            const sx = cx + Math.sin(game.time * 1.2 + i * 1.3) * 14;
            const sy = cy + Math.cos(game.time * 0.9 + i * 1.7) * 22 - i * 6;
            ctx.fillRect(sx - 1, sy - 1, 2, 2);
          }
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
        continue;
      }
      ctx.globalAlpha = open ? 0.92 : 0.72;
      if (!drawHdDoor(door, open)) {
        if (gate) ctx.drawImage(gate, door.x - 8, door.y - 18, door.w + 16, door.h + 28);
        ctx.fillStyle = open ? "rgba(107, 220, 194, 0.22)" : "rgba(211, 55, 52, 0.34)";
        ctx.fillRect(door.x, door.y, door.w, door.h);
      }
      if (!open && door.lock) {
        drawLockBadge(door);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawHdDoor(door, open) {
    const img = images.doorsHd;
    if (!img || !img.width) return false;
    const horizontal = door.side === "up" || door.side === "down";
    const cellX = horizontal ? (open ? 2 : 3) : (open ? 0 : 1);
    const dw = horizontal ? Math.max(96, door.w + 42) : Math.max(66, door.w + 34);
    const dh = horizontal ? Math.max(74, door.h + 44) : Math.max(150, door.h + 36);
    const x = door.x + door.w / 2 - dw / 2;
    const y = horizontal ? door.y + door.h / 2 - dh / 2 : door.y + door.h - dh + 12;
    ctx.save();
    ctx.shadowColor = open ? "#7be09a" : "#ff5465";
    ctx.shadowBlur = open ? 8 : 12;
    ctx.drawImage(img, cellX * DOOR_FRAME_SIZE, 0, DOOR_FRAME_SIZE, DOOR_FRAME_SIZE, x, y, dw, dh);
    ctx.restore();
    return true;
  }

  function objectiveDoorGuideCenter(door) {
    const cx = door.x + door.w / 2;
    const cy = door.y + door.h / 2;
    if (door.side === "left") return { x: door.x + door.w + 30, y: cy };
    if (door.side === "right") return { x: door.x - 30, y: cy };
    if (door.side === "up") return { x: cx, y: door.y + door.h + 26 };
    if (door.side === "down") return { x: cx, y: door.y - 22 };
    return { x: cx, y: cy };
  }

  function drawObjectiveArrow(cx, cy, side, size) {
    ctx.beginPath();
    if (side === "left") {
      ctx.moveTo(cx - size, cy);
      ctx.lineTo(cx + size * 0.62, cy - size * 0.72);
      ctx.lineTo(cx + size * 0.62, cy + size * 0.72);
    } else if (side === "right") {
      ctx.moveTo(cx + size, cy);
      ctx.lineTo(cx - size * 0.62, cy - size * 0.72);
      ctx.lineTo(cx - size * 0.62, cy + size * 0.72);
    } else if (side === "up") {
      ctx.moveTo(cx, cy - size);
      ctx.lineTo(cx - size * 0.72, cy + size * 0.62);
      ctx.lineTo(cx + size * 0.72, cy + size * 0.62);
    } else {
      ctx.moveTo(cx, cy + size);
      ctx.lineTo(cx - size * 0.72, cy - size * 0.62);
      ctx.lineTo(cx + size * 0.72, cy - size * 0.62);
    }
    ctx.closePath();
  }

  function objectiveGuideFrame(side) {
    if (side === "left") return 0;
    if (side === "right") return 1;
    if (side === "up") return 2;
    return 3;
  }

  function drawHdObjectiveDoorGuide(door, center, open, pulse) {
    const img = images.exitGuides;
    if (!img || !img.width) return false;
    const col = objectiveGuideFrame(door.side);
    const row = open ? 0 : 1;
    const sw = img.width / 4;
    const sh = img.height / 2;
    const horizontal = door.side === "left" || door.side === "right";
    const scale = 0.9 + pulse * 0.14;
    const dw = (horizontal ? 90 : 72) * scale;
    const dh = (horizontal ? 84 : 96) * scale;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = open ? 0.72 + pulse * 0.2 : 0.62 + pulse * 0.18;
    ctx.shadowColor = open ? "#ffd065" : "#ff5465";
    ctx.shadowBlur = open ? 16 + pulse * 12 : 14 + pulse * 10;
    ctx.drawImage(
      img,
      col * sw,
      row * sh,
      sw,
      sh,
      center.x - dw / 2,
      center.y - dh / 2,
      dw,
      dh
    );
    ctx.restore();
    return true;
  }

  function drawObjectiveDoorGuide() {
    const door = nextObjectiveDoor();
    if (!door || door.hidden) return;
    const open = doorOpen(door);
    const center = objectiveDoorGuideCenter(door);
    const pulse = 0.5 + 0.5 * Math.sin(game.time * 4.2);
    if (drawHdObjectiveDoorGuide(door, center, open, pulse)) return;
    const color = open ? "#ffd065" : "#ff5465";
    ctx.save();
    ctx.globalAlpha = open ? 0.66 + pulse * 0.18 : 0.5 + pulse * 0.16;
    ctx.shadowColor = color;
    ctx.shadowBlur = open ? 14 + pulse * 10 : 10 + pulse * 8;
    ctx.strokeStyle = open ? "rgba(255, 224, 128, 0.82)" : "rgba(255, 84, 101, 0.74)";
    ctx.fillStyle = open ? "rgba(255, 208, 101, 0.72)" : "rgba(255, 84, 101, 0.58)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 17 + pulse * 5, 0, Math.PI * 2);
    ctx.stroke();
    drawObjectiveArrow(center.x, center.y, door.side, 10 + pulse * 2);
    ctx.fill();
    ctx.globalAlpha *= 0.24;
    const trigger = doorTriggerBox(door);
    ctx.strokeStyle = open ? "rgba(255, 224, 128, 0.55)" : "rgba(255, 84, 101, 0.48)";
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(trigger.x, trigger.y, trigger.w, trigger.h);
    ctx.restore();
  }

  function drawRoomMechanics() {
    if (game.room && game.room.grottoRide) drawGrottoMechanics(game.room);
    if (game.room && game.room.puzzle) drawPuzzleMechanics(game.room);
    const bridge = game.room && game.room.drawbridge;
    if (bridge) drawDrawbridge(bridge);
    const gate = game.room && game.room.portcullis;
    if (gate) drawPortcullis(gate);
  }

  function drawPuzzleMechanics(room) {
    const puzzle = room.puzzle;
    const solved = puzzleSolved(puzzle.id);
    const step = solved ? puzzle.sequence.length : (puzzle.step || 0);
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "10px Cinzel, serif";
    for (let i = 0; i < puzzle.switches.length; i += 1) {
      const sw = puzzle.switches[i];
      const activeIndex = puzzle.sequence.indexOf(i);
      const lit = solved || activeIndex < step;
      const expected = !solved && puzzle.sequence[step] === i;
      const pulse = 0.5 + 0.5 * Math.sin(game.time * 4 + i);
      if (drawLibraryHdSwitch(puzzle, sw, i, lit, expected, pulse)) continue;
      ctx.shadowColor = sw.color || "#f4d38b";
      ctx.shadowBlur = lit ? 18 : expected ? 10 + pulse * 8 : 0;
      ctx.fillStyle = lit ? (sw.color || "#f4d38b") : "rgba(20, 18, 22, 0.94)";
      ctx.strokeStyle = expected ? "#fff0cf" : "rgba(244, 211, 139, 0.46)";
      ctx.lineWidth = expected ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(sw.x, sw.y - 34);
      ctx.lineTo(sw.x + 24, sw.y - 12);
      ctx.lineTo(sw.x, sw.y + 10);
      ctx.lineTo(sw.x - 24, sw.y - 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = lit ? "#050408" : "#f7ead2";
      const label = String(sw.glyph || i + 1);
      ctx.fillText(label.length > 4 ? label.slice(0, 4) : label, sw.x, sw.y - 12);
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = sw.color || "#f4d38b";
      ctx.fillRect(sw.x - 2, sw.y + 10, 4, 30);
      ctx.globalAlpha = 1;
    }
    if (solved) {
      ctx.globalAlpha = 0.28 + 0.12 * Math.sin(game.time * 3);
      ctx.strokeStyle = "#fff0cf";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < puzzle.switches.length; i += 1) {
        const sw = puzzle.switches[puzzle.sequence[i]];
        if (i === 0) ctx.moveTo(sw.x, sw.y - 12);
        else ctx.lineTo(sw.x, sw.y - 12);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLibraryHdSwitch(puzzle, sw, index, lit, expected, pulse) {
    if (!puzzle) return false;
    const img = images.librarySwitches;
    if (!img || !img.width) return false;
    const frameSize = 256;
    const col = clamp(index, 0, 2);
    const row = lit ? 1 : expected ? 2 : 0;
    const drawW = 82;
    const drawH = 102;
    const x = sw.x - drawW / 2;
    const y = sw.y - 88;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    if (lit || expected) {
      ctx.globalAlpha = expected ? 0.22 + pulse * 0.15 : 0.18;
      ctx.fillStyle = sw.color || "#f4d38b";
      ctx.beginPath();
      ctx.ellipse(sw.x, sw.y - 36, 46 + pulse * 7, 54 + pulse * 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.shadowColor = expected ? "#fff0cf" : sw.color || "#f4d38b";
    ctx.shadowBlur = lit ? 10 : expected ? 14 + pulse * 8 : 3;
    ctx.drawImage(img, col * frameSize, row * frameSize, frameSize, frameSize, x, y, drawW, drawH);
    ctx.shadowBlur = 0;
    if (puzzle.id !== "libraryRunes") {
      ctx.font = "700 10px Cinzel, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = lit ? "#09070a" : sw.color || "#f4d38b";
      const label = String(sw.glyph || index + 1);
      ctx.fillText(label.length > 5 ? label.slice(0, 5) : label, sw.x, sw.y - 37);
    }
    ctx.restore();
    return true;
  }

  function drawGrottoMechanics(room) {
    const ride = room.grottoRide;
    if (!ride) return;
    drawGrottoWater(room, ride);
    for (let i = 0; i < (room.duckGates || []).length; i += 1) {
      drawGrottoDuckGate(room.duckGates[i], i);
    }
    const platform = grottoRidePlatform(room);
    if (platform) drawGrottoRidePlatform(platform);
  }

  function drawGrottoWater(room, ride) {
    const waterTop = ride.waterY + Math.sin(game.time * 1.2) * 3;
    const waterBottom = Math.min(roomHeight(room), 468);
    if (room.waterPits && room.waterPits.length) {
      drawGrottoWaterPits(room, waterTop);
      return;
    }
    const grad = ctx.createLinearGradient(0, waterTop, 0, waterBottom);
    grad.addColorStop(0, "rgba(92, 218, 255, 0.16)");
    grad.addColorStop(0.45, "rgba(17, 80, 116, 0.30)");
    grad.addColorStop(1, "rgba(4, 24, 42, 0.48)");
    ctx.fillStyle = grad;
    ctx.fillRect(160, waterTop, roomWidth(room) - 260, waterBottom - waterTop + 8);

    ctx.save();
    ctx.lineWidth = 2;
    ctx.shadowColor = "#7ee8ff";
    ctx.shadowBlur = 8;
    for (let i = 0; i < 5; i += 1) {
      const y = waterTop + 8 + i * 14;
      ctx.globalAlpha = 0.32 - i * 0.035;
      ctx.strokeStyle = i % 2 ? "rgba(190, 250, 255, 0.46)" : "rgba(94, 222, 255, 0.42)";
      ctx.beginPath();
      for (let x = 178; x < roomWidth(room) - 80; x += 18) {
        const yy = y + Math.sin(game.time * (2.2 + i * 0.12) + x * 0.035 + i) * (2.2 + i * 0.35);
        if (x === 178) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawGrottoWaterPits(room, waterTop) {
    const tile = images.moatWaterTiles;
    const frame = Math.floor(game.time * 7) % MOAT_WATER_FRAMES;
    for (const pit of room.waterPits) {
      const top = pit.y + Math.sin(game.time * 1.4 + pit.x * 0.01) * 3;
      ctx.save();
      ctx.beginPath();
      ctx.rect(pit.x, top, pit.w, pit.h);
      ctx.clip();
      if (tile && tile.width) {
        ctx.imageSmoothingEnabled = true;
        for (let x = pit.x - 18; x < pit.x + pit.w + 20; x += 86) {
          ctx.drawImage(tile, frame * MOAT_WATER_TILE_SIZE, 0, MOAT_WATER_TILE_SIZE, MOAT_WATER_TILE_SIZE, x, top - 20, 108, pit.h + 46);
        }
      }
      const grad = ctx.createLinearGradient(0, top, 0, top + pit.h);
      grad.addColorStop(0, "rgba(155, 248, 255, 0.30)");
      grad.addColorStop(0.45, "rgba(13, 92, 132, 0.46)");
      grad.addColorStop(1, "rgba(3, 16, 34, 0.72)");
      ctx.fillStyle = grad;
      ctx.fillRect(pit.x, top, pit.w, pit.h);
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = "rgba(202, 255, 255, 0.62)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#7ee8ff";
      ctx.shadowBlur = 9;
      for (let i = 0; i < 3; i += 1) {
        const y = top + 8 + i * 18;
        ctx.beginPath();
        for (let x = pit.x + 8; x < pit.x + pit.w - 6; x += 14) {
          const yy = y + Math.sin(game.time * (2.5 + i * 0.2) + x * 0.04) * (2 + i * 0.4);
          if (x === pit.x + 8) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#08111d";
    for (const pit of room.waterPits) {
      ctx.fillRect(pit.x - 6, pit.y - 2, 6, 28);
      ctx.fillRect(pit.x + pit.w, pit.y - 2, 6, 28);
    }
    ctx.restore();
  }

  function drawGrottoRidePlatform(platform) {
    ctx.save();
    ctx.shadowColor = "#7ee8ff";
    ctx.shadowBlur = 12;
    drawPlatformInto(ctx, platform);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "rgba(190, 250, 255, 0.22)";
    for (let x = platform.x + 10; x < platform.x + platform.w - 10; x += 28) {
      ctx.fillRect(x, platform.y + platform.h + 5 + Math.sin(game.time * 4 + x) * 2, 18, 2);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawGrottoDuckGate(gate, index) {
    if (drawHdGrottoDuckGate(gate, index)) return;
    const teeth = Math.max(3, Math.floor(gate.w / 30));
    ctx.save();
    ctx.shadowColor = "#07101c";
    ctx.shadowBlur = 5;
    for (let i = 0; i < teeth; i += 1) {
      const x0 = gate.x + (i / teeth) * gate.w;
      const x1 = gate.x + ((i + 1) / teeth) * gate.w;
      const mid = (x0 + x1) / 2 + Math.sin(index * 1.7 + i) * 4;
      const tip = gate.y + gate.h - (i % 2) * 18;
      const grad = ctx.createLinearGradient(mid, gate.y, mid, tip);
      grad.addColorStop(0, "rgba(8, 16, 28, 0.98)");
      grad.addColorStop(0.58, "rgba(28, 58, 82, 0.94)");
      grad.addColorStop(1, "rgba(142, 236, 255, 0.82)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x0 - 5, gate.y);
      ctx.lineTo(x1 + 5, gate.y);
      ctx.lineTo(mid, tip);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(190, 250, 255, 0.26)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.globalAlpha = 0.64;
    ctx.fillStyle = "rgba(45, 126, 156, 0.28)";
    for (let x = gate.x - 6; x < gate.x + gate.w + 8; x += 34) {
      const h = 28 + ((x + index * 13) % 24);
      ctx.beginPath();
      ctx.moveTo(x, 468);
      ctx.lineTo(x + 16, 468 - h);
      ctx.lineTo(x + 32, 468);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawHdGrottoDuckGate(gate, index) {
    const img = images.grottoSpikesHd;
    if (!img || !img.width) return false;
    const cells = Math.max(1, Math.floor(img.width / GROTTO_SPIKE_FRAME_SIZE));
    const topW = 86;
    const topH = Math.max(110, gate.h + 36);
    const bottomW = 82;
    const bottomH = 72;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.shadowColor = "#06101d";
    ctx.shadowBlur = 8;
    for (let x = gate.x - 16, i = 0; x < gate.x + gate.w + 12; x += topW * 0.58, i += 1) {
      const cell = (index + i) % cells;
      const sway = Math.sin(game.time * 1.2 + index + i * 0.7) * 2;
      ctx.drawImage(
        img,
        cell * GROTTO_SPIKE_FRAME_SIZE,
        0,
        GROTTO_SPIKE_FRAME_SIZE,
        GROTTO_SPIKE_FRAME_SIZE,
        x + sway,
        gate.y - 24,
        topW,
        topH
      );
    }
    ctx.globalAlpha = 0.88;
    for (let x = gate.x - 10, i = 0; x < gate.x + gate.w + 10; x += bottomW * 0.72, i += 1) {
      const cell = (index + i + 1) % cells;
      const h = bottomH + ((index + i) % 3) * 8;
      ctx.drawImage(
        img,
        cell * GROTTO_SPIKE_FRAME_SIZE,
        GROTTO_SPIKE_FRAME_SIZE,
        GROTTO_SPIKE_FRAME_SIZE,
        GROTTO_SPIKE_FRAME_SIZE,
        x,
        468 - h,
        bottomW,
        h
      );
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    return true;
  }

  function drawDrawbridge(bridge) {
    const p = clamp(bridge.progress, 0, 1);
    const pivotRight = bridge.hingeX > bridge.x + bridge.w / 2;
    const angle = (pivotRight ? 1 : -1) * p * Math.PI * 0.48;
    const localX = pivotRight ? -bridge.w : 0;
    const farVector = pivotRight ? -bridge.w : bridge.w;
    ctx.save();
    ctx.translate(bridge.hingeX, bridge.hingeY);
    ctx.rotate(angle);
    ctx.shadowColor = "#050408";
    ctx.shadowBlur = 8;
    if (!drawDrawbridgeHdDeck(bridge, localX)) {
      const grad = ctx.createLinearGradient(0, -bridge.h, bridge.w, bridge.h);
      grad.addColorStop(0, "#4c321f");
      grad.addColorStop(0.5, "#a36b34");
      grad.addColorStop(1, "#2b1a12");
      ctx.fillStyle = grad;
      ctx.fillRect(localX, -bridge.h, bridge.w, bridge.h);
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    drawDrawbridgeChains(bridge, angle, farVector);
  }

  function drawDrawbridgeChains(bridge, angle, farVector) {
    const farX = bridge.hingeX + Math.cos(angle) * farVector;
    const farY = bridge.hingeY + Math.sin(angle) * farVector;
    const pivotRight = bridge.hingeX > bridge.x + bridge.w / 2;
    ctx.save();
    const anchors = [];
    for (const dy of [-22, -8]) {
      const x1 = bridge.hingeX + (pivotRight ? 12 : -12);
      const y1 = bridge.hingeY - 162 + dy * 0.1;
      const x2 = farX + (pivotRight ? 10 : -10);
      const y2 = farY + dy;
      drawChainBetween(x1, y1, x2, y2, 13, 0.76);
      anchors.push({ x1, y1, x2, y2, angle: Math.atan2(y2 - y1, x2 - x1) });
    }
    for (const a of anchors) {
      drawDrawbridgeAnchorPlate(a.x1, a.y1, a.angle, 0.86);
      drawDrawbridgeAnchorPlate(a.x2, a.y2, angle, 0.74);
    }
    ctx.restore();
  }

  function drawChainBetween(x1, y1, x2, y2, width = 18, alpha = 1) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    if (length < 4) return;
    const img = images.chain;
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(Math.atan2(dy, dx));
    ctx.shadowColor = "#050408";
    ctx.shadowBlur = 2;
    const strip = getDrawbridgeChainStrip(length, width);
    if (!img || !img.width || !strip) {
      ctx.strokeStyle = "rgba(166, 148, 104, 0.74)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(length, 0);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.rect(0, -strip.height / 2, length, strip.height);
    ctx.clip();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(strip, 0, -strip.height / 2);
    ctx.restore();
  }

  function getDrawbridgeChainStrip(length, width) {
    const img = images.chain;
    if (!img || !img.width) return null;
    const cacheW = Math.max(720, Math.ceil(length / 240) * 240);
    const cacheH = Math.ceil(width * 1.65 + 4);
    const key = `${cacheW}x${cacheH}:${img.width}x${img.height}`;
    if (drawbridgeRenderCache.chains.has(key)) return drawbridgeRenderCache.chains.get(key);
    if (drawbridgeRenderCache.chains.size > 8) drawbridgeRenderCache.chains.clear();
    const c = document.createElement("canvas");
    c.width = cacheW;
    c.height = cacheH;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    const crops = [
      { x: 8, y: 28, w: 34, h: 64 },
      { x: 55, y: 32, w: 33, h: 60 }
    ];
    const step = 15;
    g.filter = "brightness(1.28) contrast(1.08)";
    for (let x = -6, i = 0; x < cacheW + step; x += step, i += 1) {
      const crop = crops[i % crops.length];
      const tileLen = 22;
      g.save();
      g.translate(x + tileLen / 2, cacheH / 2);
      g.rotate(-Math.PI / 2);
      g.drawImage(img, crop.x, crop.y, crop.w, crop.h, -width / 2, -tileLen / 2, width, tileLen);
      g.restore();
    }
    g.filter = "none";
    drawbridgeRenderCache.chains.set(key, c);
    return c;
  }

  function drawDrawbridgeHdDeck(bridge, localX) {
    const layer = getDrawbridgeDeckLayer(bridge);
    if (!layer) return false;
    ctx.drawImage(layer, localX, -bridge.h);
    return true;
  }

  function getDrawbridgeDeckLayer(bridge) {
    const intro = images.introTiles;
    if (!intro || !intro.width) return null;
    const tileKey = images.tiles && images.tiles.width ? `${images.tiles.width}x${images.tiles.height}` : "none";
    const key = `${Math.round(bridge.w)}x${Math.round(bridge.h)}:${intro.width}x${intro.height}:${tileKey}`;
    if (drawbridgeRenderCache.deck && drawbridgeRenderCache.deck.key === key) return drawbridgeRenderCache.deck.canvas;
    const layer = document.createElement("canvas");
    layer.width = Math.ceil(bridge.w);
    layer.height = Math.ceil(bridge.h);
    const g = layer.getContext("2d");
    g.imageSmoothingEnabled = false;
    const root = INTRO_TILE_CELLS.root;
    const plankW = 58;
    g.fillStyle = "rgba(34, 21, 13, 0.96)";
    g.fillRect(0, 0, bridge.w, bridge.h);
    g.globalAlpha = 0.98;
    for (let x = 0, i = 0; x < bridge.w; x += plankW, i += 1) {
      const w = Math.min(plankW + 1, bridge.w - x);
      const sx = root[0] * INTRO_TILE_SOURCE_SIZE + 10 + (i % 4) * 12;
      const sy = root[1] * INTRO_TILE_SOURCE_SIZE + 64 + (i % 2) * 12;
      g.drawImage(intro, sx, sy, 188, 132, x, 0, w, bridge.h);
      g.fillStyle = i % 2 ? "rgba(0, 0, 0, 0.22)" : "rgba(255, 220, 150, 0.08)";
      g.fillRect(x, 0, 2, bridge.h);
    }
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = "rgba(136, 76, 30, 0.38)";
    g.fillRect(0, 0, bridge.w, bridge.h);
    g.globalCompositeOperation = "source-over";
    const glaze = g.createLinearGradient(0, 0, 0, bridge.h);
    glaze.addColorStop(0, "rgba(244, 211, 139, 0.18)");
    glaze.addColorStop(0.45, "rgba(255, 255, 255, 0.04)");
    glaze.addColorStop(1, "rgba(0, 0, 0, 0.42)");
    g.fillStyle = glaze;
    g.fillRect(0, 0, bridge.w, bridge.h);

    for (let x = 72; x < bridge.w - 22; x += 112) {
      drawDrawbridgeTileBandTo(g, x, 1, 12, bridge.h - 4, 0.68);
    }
    drawbridgeRenderCache.deck = { key, canvas: layer };
    return layer;
  }

  function drawDrawbridgeTileBand(x, y, w, h, alpha = 1) {
    drawDrawbridgeTileBandTo(ctx, x, y, w, h, alpha);
  }

  function drawDrawbridgeTileBandTo(targetCtx, x, y, w, h, alpha = 1) {
    const img = images.tiles;
    if (!img || !img.width) return;
    const cell = PLATFORM_TILE_CELLS.trim;
    const sx = cell[0] * TILE_SOURCE_SIZE + 8;
    const sy = cell[1] * TILE_SOURCE_SIZE + 92;
    const sw = TILE_SOURCE_SIZE - 16;
    const sh = 64;
    targetCtx.save();
    targetCtx.globalAlpha *= alpha;
    for (let xx = x; xx < x + w; xx += 64) {
      targetCtx.drawImage(img, sx, sy, sw, sh, xx, y, Math.min(64, x + w - xx), h);
    }
    targetCtx.restore();
  }

  function drawDrawbridgeAnchorPlate(x, y, angle, scale = 1) {
    const plate = getDrawbridgeAnchorPlate();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.shadowColor = "#050408";
    ctx.shadowBlur = 3;
    ctx.drawImage(plate, -plate.width / 2, -plate.height / 2);
    ctx.restore();
  }

  function getDrawbridgeAnchorPlate() {
    const img = images.tiles;
    const key = img && img.width ? `${img.width}x${img.height}` : "fallback";
    if (drawbridgeRenderCache.anchor && drawbridgeRenderCache.anchor.key === key) return drawbridgeRenderCache.anchor.canvas;
    const c = document.createElement("canvas");
    c.width = 52;
    c.height = 28;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    if (img && img.width) {
      const cell = PLATFORM_TILE_CELLS.trim;
      const sx = cell[0] * TILE_SOURCE_SIZE + 34;
      const sy = cell[1] * TILE_SOURCE_SIZE + 70;
      g.drawImage(img, sx, sy, 170, 92, 0, 0, c.width, c.height);
    } else {
      g.fillStyle = "#9d8254";
      g.fillRect(0, 0, c.width, c.height);
    }
    const glow = g.createLinearGradient(0, 0, c.width, c.height);
    glow.addColorStop(0, "rgba(255, 225, 145, 0.38)");
    glow.addColorStop(0.55, "rgba(49, 35, 22, 0.16)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0.48)");
    g.fillStyle = glow;
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = "rgba(244, 211, 139, 0.72)";
    g.lineWidth = 2;
    g.strokeRect(3, 4, c.width - 6, c.height - 8);
    g.fillStyle = "rgba(18, 12, 9, 0.7)";
    g.fillRect(10, 8, 5, c.height - 16);
    g.fillRect(c.width - 15, 8, 5, c.height - 16);
    drawbridgeRenderCache.anchor = { key, canvas: c };
    return c;
  }

  function drawPortcullis(gate) {
    const img = images.portcullis;
    const openLift = gate.h * 0.74;
    const y = gate.y - openLift * (1 - gate.progress);
    ctx.save();
    ctx.shadowColor = "#050408";
    ctx.shadowBlur = 12;
    if (img && img.width) {
      ctx.drawImage(img, gate.x, y, gate.w, gate.h);
    } else {
      ctx.fillStyle = "rgba(18, 18, 22, 0.9)";
      ctx.fillRect(gate.x, y, gate.w, gate.h);
      ctx.strokeStyle = "rgba(215, 198, 160, 0.72)";
      for (let x = gate.x + 12; x < gate.x + gate.w; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + gate.h);
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(244, 211, 139, 0.34)";
    ctx.lineWidth = 2;
    ctx.strokeRect(gate.x - 4, gate.y - 4, gate.w + 8, gate.h + 8);
    ctx.restore();
  }

  function drawLockBadge(door) {
    const cx = door.x + door.w / 2;
    const topY = door.y - 28;
    const pulse = 0.6 + 0.4 * Math.sin(game.time * 4);

    // Build requirement list with state
    const reqs = lockRequirements(door.lock);

    // Lock icon (red shield with keyhole)
    ctx.globalAlpha = 1;
    ctx.shadowColor = "#d74236";
    ctx.shadowBlur = 14 * pulse;
    ctx.fillStyle = "#1a0708";
    ctx.fillRect(cx - 12, topY - 12, 24, 22);
    ctx.fillStyle = "#d74236";
    ctx.fillRect(cx - 10, topY - 10, 20, 18);
    ctx.fillStyle = "#1a0708";
    ctx.fillRect(cx - 2, topY - 6, 4, 8);
    ctx.beginPath();
    ctx.arc(cx, topY - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Persistent banner with checklist
    if (reqs.length === 0) return;
    ctx.font = "700 12px 'Trebuchet MS', Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const lineH = 18;
    let maxW = ctx.measureText("LOCKED — need:").width;
    for (const r of reqs) {
      const w = ctx.measureText(`${r.have ? "✓" : "✗"} ${r.label}`).width;
      if (w > maxW) maxW = w;
    }
    const padX = 10;
    const padY = 8;
    const totalW = maxW + padX * 2;
    const totalH = padY * 2 + lineH * (reqs.length + 1);
    const bx = cx - totalW / 2;
    const by = topY - 30 - totalH;

    ctx.fillStyle = "rgba(8, 4, 6, 0.94)";
    ctx.fillRect(bx, by, totalW, totalH);
    ctx.strokeStyle = "rgba(244, 211, 139, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, totalW, totalH);

    ctx.fillStyle = "#f4d38b";
    ctx.fillText("LOCKED — need:", bx + padX, by + padY + lineH / 2);
    let yy = by + padY + lineH * 1.5;
    for (const r of reqs) {
      ctx.fillStyle = r.have ? "#7be09a" : "#ff7a6a";
      ctx.fillText(r.have ? "✓" : "✗", bx + padX, yy);
      ctx.fillStyle = r.have ? "#cfeacc" : "#fff5dd";
      ctx.fillText(r.label, bx + padX + 14, yy);
      yy += lineH;
    }
    ctx.lineWidth = 1;
    ctx.textAlign = "center";
  }

  function lockRequirements(lock) {
    const puzzleId = puzzleLockId(lock);
    if (puzzleId) {
      const meta = puzzleMetaById(puzzleId);
      return [{ label: meta ? `${meta.puzzle.label} (${meta.room.name})` : "Rune Puzzle", have: puzzleSolved(puzzleId) }];
    }
    if (lock === "moonGate") {
      return [
        { label: "Moon Sigil (Gallery)", have: !!game.save.moonSigil },
        { label: "Mist Dash (Tower)", have: !!game.save.relics.dash },
        { label: `Castle survey (${surveyProgress().total} rooms)`, have: allSurveyRoomsVisited() },
        { label: "Ink Seal (Archives)", have: !!(game.save.questSeals && game.save.questSeals.inkSeal) },
        { label: "Astral Lens (Observatory)", have: !!(game.save.questSeals && game.save.questSeals.starSeal) },
        { label: "Tide Sigil (Grotto)", have: !!(game.save.questSeals && game.save.questSeals.tideSeal) }
      ];
    }
    return [];
  }

  function drawPickups() {
    const target = nextObjectiveRoom();
    const inTargetRoom = target === game.roomId;
    for (const drop of game.pickups) {
      const y = drop.y + Math.sin(drop.bob) * 5;
      const isQuestSeal = !!QUEST_ICON_CELLS[drop.type];
      const isRelic = isQuestSeal || drop.type === "doubleJump" || drop.type === "dash" || drop.type === "moonSigil" || drop.type === "heartVessel" || drop.type === "subAxe" || drop.type === "subHolyWater" || drop.type === "subBoomerang" || drop.type === "familiarBat" || drop.type === "ringOfArdor" || drop.type === "batCloak" || drop.type === "wraithArmor" || drop.type === "phoenixPendant";
      const color = drop.type === "doubleJump" ? "#8bd7ff" : drop.type === "dash" ? "#d8fff3" : drop.type === "heartVessel" ? "#f05f5b" : drop.type === "moonSigil" ? "#f2cb68" : drop.type === "tideSeal" ? "#42dfff" : drop.type === "starSeal" ? "#ffd56a" : drop.type === "inkSeal" ? "#bca8ff" : drop.type === "subBoomerang" ? "#f7d988" : drop.type === "familiarBat" ? "#bfa0ff" : drop.type === "ringOfArdor" ? "#ff9a3a" : drop.type === "batCloak" ? "#9a7adb" : drop.type === "wraithArmor" ? "#cfeacc" : drop.type === "phoenixPendant" ? "#ffae3a" : "#f2cb68";

      // Path beacon: tall light column + descending arrow above relics in the target room
      if (inTargetRoom && isRelic) {
        const beat = 0.6 + 0.4 * Math.sin(game.time * 3);
        ctx.globalAlpha = 0.55 * beat;
        const grad = ctx.createLinearGradient(drop.x + 14, 0, drop.x + 14, y);
        grad.addColorStop(0, "rgba(244, 211, 139, 0)");
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.fillRect(drop.x + 4, 0, 20, y + 14);
        // Floating arrow chevrons above the relic
        ctx.globalAlpha = 0.85 * beat;
        ctx.fillStyle = color;
        for (let i = 0; i < 3; i += 1) {
          const ay = y - 28 - i * 14 - ((game.time * 60) % 14);
          if (ay < 0) continue;
          ctx.beginPath();
          ctx.moveTo(drop.x + 14, ay + 8);
          ctx.lineTo(drop.x + 4, ay);
          ctx.lineTo(drop.x + 24, ay);
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      if (drawPickupIcon(drop, y, color, isRelic)) continue;

      ctx.shadowColor = color;
      ctx.shadowBlur = isRelic ? 32 : 20;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(drop.x + 14, y + 14, isRelic ? 16 : 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#08080d";
      ctx.fillRect(drop.x + 8, y + 8, 12, 12);
    }
  }

  function drawPickupIcon(drop, y, color, isRelic) {
    const weaponCellName = WEAPON_PICKUP_CELLS[drop.type];
    if (weaponCellName && images.weaponsHd && images.weaponsHd.width && WEAPON_CELLS[weaponCellName]) {
      const cell = WEAPON_CELLS[weaponCellName];
      const size = isRelic ? 46 : 36;
      const cx = drop.x + drop.w / 2;
      const cy = y + drop.h / 2;
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = isRelic ? 28 : 18;
      ctx.drawImage(
        images.weaponsHd,
        cell[0] * WEAPON_ICON_SIZE,
        cell[1] * WEAPON_ICON_SIZE,
        WEAPON_ICON_SIZE,
        WEAPON_ICON_SIZE,
        cx - size / 2,
        cy - size / 2,
        size,
        size
      );
      ctx.restore();
      return true;
    }
    const isQuestSeal = !!QUEST_ICON_CELLS[drop.type];
    const cell = isQuestSeal ? QUEST_ICON_CELLS[drop.type] : ITEM_ICON_CELLS[drop.type];
    const img = isQuestSeal ? images.questIcons : images.itemIcons;
    if (!cell || !img || !img.width) return false;
    const size = isRelic ? 44 : Math.max(28, Math.min(36, Math.max(drop.w, drop.h) + 10));
    const cx = drop.x + drop.w / 2;
    const cy = y + drop.h / 2;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = isRelic ? 28 : 18;
    ctx.drawImage(
      img,
      cell[0] * ITEM_ICON_SIZE,
      cell[1] * ITEM_ICON_SIZE,
      ITEM_ICON_SIZE,
      ITEM_ICON_SIZE,
      cx - size / 2,
      cy - size / 2,
      size,
      size
    );
    ctx.shadowBlur = 0;
    if (isRelic) {
      const pulse = 0.5 + 0.5 * Math.sin(game.time * 4);
      ctx.globalAlpha = 0.34 + pulse * 0.16;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.62, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  function drawProjectiles() {
    for (const shot of game.projectiles) {
      if (shot.kind === "subweapon") {
        drawSubweapon(shot);
        continue;
      }
      const cellName = shot.from === "player" ? "playerProjectile" : "enemyProjectile";
      if (drawWeaponCell(cellName, shot.x + shot.w / 2, shot.y + shot.h / 2, Math.max(30, shot.w + 16), Math.max(30, shot.h + 16), Math.atan2(shot.vy, shot.vx || 1), shot.vx < 0, shot.color)) continue;
      ctx.shadowColor = shot.color;
      ctx.shadowBlur = shot.from === "player" ? 16 : 12;
      ctx.fillStyle = shot.color;
      ctx.beginPath();
      ctx.ellipse(shot.x + shot.w / 2, shot.y + shot.h / 2, shot.w / 2, shot.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function drawWeaponCell(cellName, cx, cy, w, h, angle = 0, flip = false, glow = "#f2cb68") {
    const cell = WEAPON_CELLS[cellName];
    const img = images.weaponsHd;
    if (!cell || !img || !img.width) return false;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    if (flip) ctx.scale(-1, 1);
    ctx.shadowColor = glow;
    ctx.shadowBlur = 14;
    ctx.drawImage(
      img,
      cell[0] * WEAPON_ICON_SIZE,
      cell[1] * WEAPON_ICON_SIZE,
      WEAPON_ICON_SIZE,
      WEAPON_ICON_SIZE,
      -w / 2,
      -h / 2,
      w,
      h
    );
    ctx.restore();
    return true;
  }

  function drawSubweapon(shot) {
    const cx = shot.x + shot.w / 2;
    const cy = shot.y + shot.h / 2;
    const cellName = shot.subType === "holyWater" ? "holyWater" : shot.subType;
    const angle = shot.subType === "axe" || shot.subType === "boomerang"
      ? (shot.spin || 0) * 12
      : shot.subType === "dagger"
        ? 0
        : Math.atan2(shot.vy, shot.vx || 1) * 0.2;
    if (drawWeaponCell(cellName, cx, cy, Math.max(34, shot.w + 18), Math.max(30, shot.h + 18), angle, shot.vx < 0 && shot.subType === "dagger", shot.color)) return;
    if (shot.subType === "dagger") {
      ctx.shadowColor = shot.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = shot.color;
      ctx.save();
      ctx.translate(cx, cy);
      if (shot.vx < 0) ctx.scale(-1, 1);
      ctx.fillRect(-shot.w / 2, -3, shot.w, 6);
      ctx.fillStyle = "#a4a8b6";
      ctx.fillRect(shot.w / 2 - 6, -2, 4, 4);
      ctx.restore();
      ctx.shadowBlur = 0;
    } else if (shot.subType === "axe") {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((shot.spin || 0) * 12);
      ctx.fillStyle = "#5a3a1e";
      ctx.fillRect(-2, -shot.h / 2, 4, shot.h);
      ctx.fillStyle = shot.color;
      ctx.beginPath();
      ctx.moveTo(-shot.w / 2, -shot.h / 4);
      ctx.lineTo(shot.w / 2, -shot.h / 4);
      ctx.lineTo(shot.w / 2 - 4, shot.h / 4);
      ctx.lineTo(-shot.w / 2 + 4, shot.h / 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (shot.subType === "holyWater") {
      ctx.shadowColor = shot.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = shot.color;
      ctx.beginPath();
      ctx.arc(cx, cy, shot.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawCandles() {
    for (const candle of game.candles) {
      if (candle.broken) continue;
      // Holder
      ctx.fillStyle = "#3a2a18";
      ctx.fillRect(candle.x - 4, candle.y, 8, 12);
      ctx.fillStyle = "#1c130a";
      ctx.fillRect(candle.x - 6, candle.y + 10, 12, 3);
      // Wax
      ctx.fillStyle = "#f1e4c0";
      ctx.fillRect(candle.x - 3, candle.y - 12, 6, 14);
      // Flame
      const flick = Math.sin(candle.flame) * 1.4;
      ctx.shadowColor = "#ffae3a";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#ffd065";
      ctx.beginPath();
      ctx.ellipse(candle.x, candle.y - 18, 3.6 + flick * 0.2, 7 + flick, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff7d6";
      ctx.beginPath();
      ctx.ellipse(candle.x, candle.y - 17, 1.6, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawFlames() {
    for (const f of game.flames) {
      const fade = clamp(f.life / 1.4, 0, 1);
      const flick = Math.sin(f.flicker) * 2;
      ctx.globalAlpha = 0.6 * fade;
      if (drawWeaponCell("holyFlame", f.x + f.w / 2, f.y + f.h / 2, f.w + 22, f.h + 38 + flick, 0, false, "#bfe7ff")) {
        ctx.globalAlpha = 1;
        continue;
      }
      ctx.shadowColor = "#bfe7ff";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#bfe7ff";
      ctx.beginPath();
      ctx.ellipse(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, f.h / 2 + flick * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  function drawShrine() {
    if (!game.room.shrine) return;
    const s = game.room.shrine;
    if (drawHdShrine(s)) return;
    // Pedestal
    ctx.fillStyle = "rgba(36, 30, 24, 0.92)";
    ctx.fillRect(s.x - 18, s.y, 56, 18);
    ctx.fillStyle = "rgba(80, 64, 40, 0.92)";
    ctx.fillRect(s.x - 22, s.y + 14, 64, 6);
    // Crystal
    const pulse = 0.5 + 0.5 * Math.sin(game.time * 2.6);
    ctx.shadowColor = "#f4d38b";
    ctx.shadowBlur = 24 + pulse * 16;
    ctx.fillStyle = "#f4d38b";
    ctx.beginPath();
    ctx.moveTo(s.x + 10, s.y - 26);
    ctx.lineTo(s.x + 22, s.y - 6);
    ctx.lineTo(s.x + 10, s.y);
    ctx.lineTo(s.x - 2, s.y - 6);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // Floating sparkles
    if (Math.random() < 0.3) {
      game.particles.push({
        x: s.x + 10 + (Math.random() - 0.5) * 30,
        y: s.y - 20 + Math.random() * 10,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.6 - Math.random() * 0.6,
        life: 0.6, maxLife: 0.6,
        color: "#fff2c0", size: 1.6
      });
    }
  }

  function drawHdShrine(s) {
    const img = images.shrineHd;
    if (!img || !img.width) return false;
    const frame = Math.floor(game.time * 5.5) % 4;
    const pulse = 0.5 + 0.5 * Math.sin(game.time * 2.6);
    const dw = 136;
    const dh = 136;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.shadowColor = "#f4d38b";
    ctx.shadowBlur = 10 + pulse * 12;
    ctx.drawImage(
      img,
      frame * SHRINE_FRAME_SIZE,
      0,
      SHRINE_FRAME_SIZE,
      SHRINE_FRAME_SIZE,
      s.x - dw / 2 + 8,
      s.y - dh + 28,
      dw,
      dh
    );
    ctx.shadowBlur = 0;
    if (Math.random() < 0.18) {
      game.particles.push({
        x: s.x + 8 + (Math.random() - 0.5) * 34,
        y: s.y - 58 + Math.random() * 18,
        vx: (Math.random() - 0.5) * 0.75,
        vy: -0.5 - Math.random() * 0.55,
        life: 0.62, maxLife: 0.62,
        color: "#fff2c0", size: 1.5
      });
    }
    ctx.restore();
    return true;
  }

  function npcAtlasCell(npcId, row) {
    const meta = STORY_NPCS[npcId];
    const img = images.npcStory;
    if (!meta || !img || !img.width) return null;
    const cellW = img.width / NPC_ATLAS.cols;
    return row === "portrait"
      ? { img, sx: meta.col * cellW, sy: NPC_ATLAS.portraitY, sw: cellW, sh: NPC_ATLAS.portraitH }
      : { img, sx: meta.col * cellW, sy: NPC_ATLAS.spriteY, sw: cellW, sh: NPC_ATLAS.spriteH };
  }

  function drawNpcs() {
    if (!game.npcs || !game.npcs.length) return;
    const near = nearbyNpc();
    for (const npc of game.npcs) {
      const meta = STORY_NPCS[npc.id];
      const alpha = near === npc ? 1 : 0.88;
      const bob = Math.sin(game.time * 1.8 + (npc.phase || 0)) * 2;
      drawNpcSprite(npc, alpha, bob);
      if (near === npc && !game.dialogue) {
        ctx.save();
        const cx = npc.x + npc.w / 2;
        const y = npc.y - 26 + bob;
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = "rgba(5, 4, 8, 0.86)";
        ctx.fillRect(cx - 34, y - 14, 68, 24);
        ctx.strokeStyle = meta ? meta.color : "#fff0cf";
        ctx.strokeRect(cx - 34, y - 14, 68, 24);
        ctx.fillStyle = "#fff0cf";
        ctx.font = "700 11px 'Trebuchet MS', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("E / Enter", cx, y - 2);
        ctx.restore();
      }
    }
  }

  function drawNpcSprite(npc, alpha, bob) {
    const cell = npcAtlasCell(npc.id, "sprite");
    const meta = STORY_NPCS[npc.id];
    const drawW = npc.id === "vellum" ? 104 : 92;
    const drawH = npc.id === "vellum" ? 144 : 138;
    if (cell) {
      const cutout = chromaCutoutImage(cell.img, "npcStory");
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = meta ? meta.color : "#fff0cf";
      ctx.shadowBlur = 12;
      ctx.drawImage(
        cutout,
        cell.sx,
        cell.sy,
        cell.sw,
        cell.sh,
        npc.x + npc.w / 2 - drawW / 2,
        npc.y + npc.h - drawH + bob,
        drawW,
        drawH
      );
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(18, 14, 22, 0.94)";
    ctx.fillRect(npc.x, npc.y + bob, npc.w, npc.h);
    ctx.fillStyle = meta ? meta.color : "#fff0cf";
    ctx.fillRect(npc.x + 12, npc.y + 18 + bob, npc.w - 24, 16);
    ctx.restore();
  }

  function wrapDialogueText(text, maxWidth) {
    const words = String(text || "").split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawDialogueOverlay() {
    const dialogue = game.dialogue;
    if (!dialogue) return;
    const meta = STORY_NPCS[dialogue.npc];
    const text = dialogue.lines[dialogue.line] || "";
    const x = 70;
    const y = H - 166;
    const w = W - 140;
    const h = 124;
    ctx.save();
    ctx.fillStyle = "rgba(5, 4, 8, 0.94)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = meta ? meta.color : "#f4d38b";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    drawNpcPortrait(dialogue.npc, x + 18, y + 14, 100, 96);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.shadowBlur = 0;
    ctx.fillStyle = meta ? meta.color : "#f4d38b";
    ctx.font = "900 18px Cinzel, Georgia, serif";
    ctx.fillText(meta ? meta.name : "Voice", x + 136, y + 18);
    ctx.fillStyle = "rgba(255, 240, 207, 0.78)";
    ctx.font = "700 11px 'Trebuchet MS', Arial, sans-serif";
    ctx.fillText(meta ? meta.title : "", x + 136, y + 41);
    ctx.fillStyle = "#fff5dd";
    ctx.font = "600 15px 'Trebuchet MS', Arial, sans-serif";
    const lines = wrapDialogueText(text, w - 178);
    for (let i = 0; i < Math.min(3, lines.length); i += 1) {
      ctx.fillText(lines[i], x + 136, y + 62 + i * 19);
    }
    ctx.fillStyle = "rgba(244, 211, 139, 0.86)";
    ctx.font = "700 11px 'Trebuchet MS', Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${dialogue.line + 1}/${dialogue.lines.length}  E`, x + w - 20, y + h - 24);
    ctx.restore();
  }

  function drawNpcPortrait(npcId, x, y, w, h) {
    const cell = npcAtlasCell(npcId, "portrait");
    if (!cell) {
      ctx.fillStyle = "rgba(244, 211, 139, 0.18)";
      ctx.fillRect(x, y, w, h);
      return;
    }
    const cutout = chromaCutoutImage(cell.img, "npcStory");
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(cutout, cell.sx, cell.sy, cell.sw, cell.sh, x - 10, y - 4, w + 24, h + 22);
    ctx.restore();
  }

  function drawEnemies() {
    for (const enemy of game.enemies) {
      const alpha = enemy.hurt > 0 ? 0.55 : 1;
      drawFeaturedEnemyBacklight(enemy, alpha);
      drawEnemySprite(enemy, alpha);
      drawFeaturedEnemyReadability(enemy, alpha);
      if (enemy.hp < enemy.maxHp && !(enemy.cfg && enemy.cfg.fullBoss)) {
        if (enemy.cfg.mini) {
          drawSmallBar(enemy.x - 16, enemy.y - 14, enemy.w + 32, enemy.hp / enemy.maxHp, "#bfa0ff");
        } else {
          drawSmallBar(enemy.x - 6, enemy.y - 10, enemy.w + 12, enemy.hp / enemy.maxHp, "#cfe8b5");
        }
      }
    }
  }

  function isFeaturedVisibleEnemy(enemy) {
    return enemy && (enemy.type === "blackPanther" || enemy.type === "zora");
  }

  function drawFeaturedEnemyBacklight(enemy, alpha) {
    if (!isFeaturedVisibleEnemy(enemy)) return;
    const cx = enemy.x + enemy.w / 2;
    const bottom = enemy.y + enemy.h + 8;
    const w = enemy.type === "blackPanther" ? enemy.cfg.dw * 0.72 : enemy.cfg.dw * 0.54;
    const h = enemy.type === "blackPanther" ? 22 : 30;
    const color = enemy.type === "blackPanther" ? "rgba(244, 211, 139, 0.32)" : "rgba(142, 248, 255, 0.32)";
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = enemy.type === "blackPanther" ? "#f4d38b" : "#8ff8ff";
    ctx.shadowBlur = enemy.type === "blackPanther" ? 18 : 22;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, bottom - 8, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFeaturedEnemyReadability(enemy, alpha) {
    if (!isFeaturedVisibleEnemy(enemy)) return;
    const cx = enemy.x + enemy.w / 2;
    const bottom = enemy.y + enemy.h + 6;
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha + 0.12);
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    if (enemy.type === "blackPanther") {
      const dir = enemy.facing < 0 ? -1 : 1;
      ctx.shadowColor = "#f4d38b";
      ctx.fillStyle = "#ffd95a";
      ctx.shadowBlur = 8;
      const eyeW = 4;
      ctx.fillRect(cx + dir * 40 - (dir < 0 ? eyeW : 0), bottom - 72, eyeW, 3);
      ctx.fillRect(cx + dir * 52 - (dir < 0 ? eyeW : 0), bottom - 73, eyeW, 3);
    } else {
      ctx.shadowColor = "#8ff8ff";
      ctx.fillStyle = "rgba(142, 248, 255, 0.92)";
      ctx.beginPath();
      ctx.arc(cx + enemy.facing * 28, bottom - 94, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha *= 0.42;
      ctx.fillRect(cx - 20, bottom - 74, 40, 2);
    }
    ctx.restore();
  }

  function drawEnemySprite(enemy, alpha) {
    const meta = ENEMY_FRAME_MAP[enemy.cfg.sprite || enemy.type];
    if (meta && images[meta.image] && images[meta.image].width) {
      const frame = enemyAnimationFrame(enemy, meta);
      const flip = meta.facing === "left" ? enemy.facing > 0 : enemy.facing < 0;
      drawSheetFrame(
        images[meta.image],
        frame,
        meta.row,
        meta.frameW,
        meta.frameH,
        enemy.x + enemy.w / 2,
        enemy.y + enemy.h + 6,
        enemy.cfg.dw,
        enemy.cfg.dh,
        flip,
        alpha
      );
      return;
    }
    const frame = Math.floor(game.time * 7 + enemy.phase) % 4;
    drawSheetFrame(images.enemy, frame, enemy.cfg.row, 128, 176, enemy.x + enemy.w / 2, enemy.y + enemy.h, enemy.cfg.dw, enemy.cfg.dh, enemy.facing < 0, alpha);
  }

  function enemyAnimationFrame(enemy, meta) {
    let seq = null;
    if (enemy.cfg.ai === "zora") {
      seq = enemy.attackWindup > 0.34 ? meta.attack : enemy.attackWindup > 0 ? meta.recover : meta.idle;
    } else if (enemy.cfg.ai === "panther") {
      seq = enemy.lunge > 0 ? meta.lunge : Math.abs(enemy.vx) > enemy.cfg.speed * 0.18 ? meta.run : meta.recover;
    } else if (meta.smoothMini) {
      seq = meta.idleSmooth || meta.idle;
    } else if (meta.cast && meta.recover && meta.idle) {
      if (meta.attack) {
        seq = enemy.lunge > 0 ? meta.attack : enemy.attackWindup > 0.44 ? meta.cast : enemy.attackWindup > 0 ? meta.attack : enemy.hurt > 0 ? meta.recover : meta.idle;
      } else {
        seq = enemy.attackWindup > 0.28 || enemy.lunge > 0 ? meta.cast : enemy.hurt > 0 ? meta.recover : meta.idle;
      }
    }
    if (!seq || !seq.length) {
      return Math.floor(game.time * (meta.fps || 10) + enemy.phase) % meta.frames;
    }
    const fps = meta.fps || 10;
    return seq[Math.floor(game.time * fps + enemy.phase) % seq.length];
  }

  function drawBoss() {
    const boss = game.boss;
    if (!boss) return;
    const frame = bossFrameIndex(boss);
    const alpha = boss.hurt > 0 ? 0.6 : 1;
    drawSheetFrame(images.boss, frame, boss.row, SPRITES.bossFrameW, SPRITES.bossFrameH, boss.x + boss.w / 2, boss.y + boss.h + 14, 252, 202, boss.facing < 0, alpha);
  }

  function bossFrameIndex(boss) {
    if (boss.state === "cast") return 12 + Math.floor(game.time * 18) % 12;
    if (boss.state === "dash") return 24 + Math.floor(game.time * 20) % 8;
    return Math.floor(game.time * 10) % 12;
  }

  function drawPlayer() {
    let frame = 0;
    if (player.invuln > 0.62) frame = 11;
    else if (player.attackTimer > 0) frame = 12 + clamp(Math.floor(((0.28 - player.attackTimer) / 0.28) * 6), 0, 5);
    else if (!player.onGround) frame = 9;
    else if (playerIsDucking()) frame = 18;
    else if (Math.abs(player.vx) > 0.25) frame = 1 + Math.floor(game.time * 10) % 8;
    else frame = Math.floor(game.time * 2) % 2;
    const alpha = player.invuln > 0 && Math.floor(game.time * 18) % 2 ? 0.48 : 1;
    drawSheetFrame(images.player, frame, 0, SPRITES.playerFrameW, SPRITES.playerFrameH, player.x + player.w / 2, player.y + player.h + 14, 112, 184, player.facing < 0, alpha);

    if (player.attackTimer > 0.08) {
      const sx = clamp(Math.floor(((0.28 - player.attackTimer) / 0.28) * SPRITES.whipFrames), 0, SPRITES.whipFrames - 1);
      const drawW = WHIP_DRAW_W;
      const drawH = WHIP_DRAW_H;
      const x = player.facing > 0 ? player.x + player.w - 14 : player.x - drawW + 14;
      ctx.save();
      if (player.attackVariant === "down") {
        ctx.translate(player.x + player.w / 2, player.y + player.h - 8);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(images.whip, sx * SPRITES.whipFrameW, 0, SPRITES.whipFrameW, SPRITES.whipFrameH, -4, -drawH / 2, drawW, drawH);
      } else if (player.facing < 0) {
        ctx.translate(x + drawW, player.y + 24);
        ctx.scale(-1, 1);
        ctx.drawImage(images.whip, sx * SPRITES.whipFrameW, 0, SPRITES.whipFrameW, SPRITES.whipFrameH, 0, 0, drawW, drawH);
      } else {
        ctx.drawImage(images.whip, sx * SPRITES.whipFrameW, 0, SPRITES.whipFrameW, SPRITES.whipFrameH, x, player.y + 24, drawW, drawH);
      }
      ctx.restore();
    }
  }

  function drawSheetFrame(img, col, row, fw, fh, cx, bottom, dw, dh, flip, alpha = 1) {
    if (!img || !img.width) {
      const prevAlpha = ctx.globalAlpha;
      if (alpha !== prevAlpha) ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(244, 211, 139, 0.7)";
      ctx.fillRect(cx - dw / 4, bottom - dh / 2, dw / 2, dh / 2);
      if (alpha !== prevAlpha) ctx.globalAlpha = prevAlpha;
      return;
    }
    const prevAlpha = ctx.globalAlpha;
    if (alpha !== prevAlpha) ctx.globalAlpha = alpha;
    if (flip) {
      ctx.save();
      ctx.translate(cx, bottom - dh);
      ctx.scale(-1, 1);
      ctx.drawImage(img, col * fw, row * fh, fw, fh, -dw / 2, 0, dw, dh);
      ctx.restore();
    } else {
      ctx.drawImage(img, col * fw, row * fh, fw, fh, cx - dw / 2, bottom - dh, dw, dh);
    }
    if (alpha !== prevAlpha) ctx.globalAlpha = prevAlpha;
  }

  function drawParticles() {
    for (const dot of game.particles) {
      const a = clamp(dot.life / dot.maxLife, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = dot.color;
      ctx.fillRect(dot.x, dot.y, dot.size, dot.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawBossHud() {
    const milestone = activeMilestoneBoss();
    const boss = game.boss || milestone;
    if (!boss) return;
    const x = 254;
    const y = H - 34;
    const w = 452;
    ctx.fillStyle = "rgba(5, 4, 8, 0.78)";
    ctx.fillRect(x, y, w, 12);
    ctx.strokeStyle = "rgba(244, 211, 139, 0.5)";
    ctx.strokeRect(x, y, w, 12);
    ctx.fillStyle = milestone ? wardenColor(milestone) : "#d74539";
    ctx.fillRect(x + 2, y + 2, (w - 4) * (boss.hp / boss.maxHp), 8);
    ctx.fillStyle = "#f4d38b";
    ctx.font = "12px Trebuchet MS, Arial";
    ctx.textAlign = "center";
    ctx.fillText(milestone ? (milestone.cfg.banner || "Seal Warden") : "Lord Veyr", x + w / 2, y - 6);
  }

  function drawSmallBar(x, y, w, pct, color) {
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * clamp(pct, 0, 1), 4);
  }

  function drawBossBanner() {
    const b = game.bossBanner;
    if (!b) return;
    // Fade in (0..0.4s), hold, fade out (last 0.6s)
    const fadeIn = Math.min(1, b.t / 0.4);
    const fadeOut = Math.min(1, Math.max(0, (b.life - b.t) / 0.6));
    const alpha = Math.min(fadeIn, fadeOut);
    if (alpha <= 0) return;
    const cx = W / 2;
    const cy = H * 0.32;
    ctx.globalAlpha = alpha * 0.85;
    // Strip behind text
    ctx.fillStyle = "rgba(8, 4, 6, 0.92)";
    ctx.fillRect(0, cy - 56, W, 112);
    ctx.strokeStyle = "rgba(244, 211, 139, 0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, cy - 52, W - 16, 104);
    // Title
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "#d74236";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#fff5dd";
    ctx.font = "700 44px Georgia, 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(b.name, cx, cy - 14);
    ctx.shadowBlur = 0;
    // Subtitle
    ctx.fillStyle = "#f4d38b";
    ctx.font = "600 18px 'Trebuchet MS', Arial, sans-serif";
    ctx.fillText(b.subtitle, cx, cy + 24);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
  }

  function drawVignette() {
    if (!cachedVignette) {
      cachedVignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.24, W / 2, H / 2, H * 0.8);
      cachedVignette.addColorStop(0, "rgba(0,0,0,0)");
      cachedVignette.addColorStop(1, "rgba(0,0,0,0.54)");
    }
    ctx.fillStyle = cachedVignette;
    ctx.fillRect(0, 0, W, H);
  }

  function drawCover(img, x, y, w, h) {
    if (!img || !img.width) {
      ctx.fillStyle = "#08080d";
      ctx.fillRect(x, y, w, h);
      return;
    }
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  function drawStretchPlane(img, x, y, w, h) {
    if (!img || !img.width) {
      ctx.fillStyle = "#08080d";
      ctx.fillRect(x, y, w, h);
      return;
    }
    ctx.drawImage(img, 0, 0, img.width, img.height, x, y, w, h);
  }

  function drawMode7Floor(room, img, rw, rh, cameraX = 0, cameraY = 0, outdoor = false) {
    if (!img || !img.width) return;
    // Outdoor rooms get a higher, more prominent perspective floor
    const isImagen = IMG[room.bg] && IMG[room.bg].includes("bg_imagen");
    const baseAlpha = outdoor ? 0.55 : (isImagen ? 0.34 : 0.22);
    const swayX = outdoor ? Math.round(cameraX * 0.35) : Math.round(cameraX * 0.82);
    const swayY = outdoor ? Math.round(cameraY * 0.5) : Math.round(cameraY * 0.72);
    const layer = getMode7FloorLayer(room, img, rw, rh, outdoor);
    if (!layer) return;

    ctx.save();
    ctx.translate(-swayX, -swayY);
    ctx.globalAlpha = baseAlpha;
    ctx.drawImage(layer, 0, 0);
    ctx.restore();

    if (outdoor) {
      const startY = Math.round(rh * 0.55) - Math.round(cameraY * 0.5);
      ctx.save();
      ctx.globalAlpha = 0.4;
      const horizonGrad = ctx.createLinearGradient(0, startY - 20, 0, startY + 12);
      horizonGrad.addColorStop(0, "rgba(244, 211, 139, 0)");
      horizonGrad.addColorStop(0.7, "rgba(244, 174, 90, 0.55)");
      horizonGrad.addColorStop(1, "rgba(244, 211, 139, 0)");
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, startY - 20, rw, 32);
      ctx.restore();
    }
  }

  function drawMode7FloorTo(target, room, img, rw, rh, cameraX = 0, cameraY = 0, outdoor = false) {
    if (!img || !img.width) return;
    const isImagen = IMG[room.bg] && IMG[room.bg].includes("bg_imagen");
    const baseAlpha = outdoor ? 0.55 : (isImagen ? 0.34 : 0.22);
    const swayX = outdoor ? Math.round(cameraX * 0.35) : Math.round(cameraX * 0.82);
    const swayY = outdoor ? Math.round(cameraY * 0.5) : Math.round(cameraY * 0.72);
    const layer = getMode7FloorLayer(room, img, rw, rh, outdoor);
    if (!layer) return;

    target.save();
    target.translate(-swayX, -swayY);
    target.globalAlpha = baseAlpha;
    target.drawImage(layer, 0, 0);
    target.restore();

    if (outdoor) {
      const startY = Math.round(rh * 0.55) - Math.round(cameraY * 0.5);
      target.save();
      target.globalAlpha = 0.4;
      const horizonGrad = target.createLinearGradient(0, startY - 20, 0, startY + 12);
      horizonGrad.addColorStop(0, "rgba(244, 211, 139, 0)");
      horizonGrad.addColorStop(0.7, "rgba(244, 174, 90, 0.55)");
      horizonGrad.addColorStop(1, "rgba(244, 211, 139, 0)");
      target.fillStyle = horizonGrad;
      target.fillRect(0, startY - 20, rw, 32);
      target.restore();
    }
  }

  function getMode7FloorLayer(room, img, rw, rh, outdoor) {
    if (!img || !img.width) return null;
    const key = `${room.id || room.name}:${room.bg}:${img.width}x${img.height}:${rw}x${rh}:${outdoor ? "out" : "in"}`;
    if (mode7FloorCache.has(key)) return mode7FloorCache.get(key);
    if (mode7FloorCache.size > 8) mode7FloorCache.clear();

    const layer = document.createElement("canvas");
    layer.width = rw;
    layer.height = rh;
    const g = layer.getContext("2d");
    g.imageSmoothingEnabled = true;

    const horizonRatio = outdoor ? 0.55 : 0.62;
    const startY = Math.round(rh * horizonRatio);
    const sourceY = Math.round(img.height * (outdoor ? 0.62 : 0.58));
    const sourceH = Math.max(1, img.height - sourceY);
    const stride = outdoor ? 4 : 5;
    const extraBase = outdoor ? 120 : 70;
    const extraGain = outdoor ? 360 : 210;
    const sliceGain = outdoor ? 11 : 7;

    for (let y = startY; y < rh; y += stride) {
      const t = (y - startY) / Math.max(1, rh - startY);
      const ease = t * t;
      const sy = sourceY + Math.min(sourceH - 1, Math.round(sourceH * ease));
      const sliceH = Math.max(2, Math.round(2 + t * sliceGain));
      const extra = extraBase + t * extraGain;
      g.drawImage(
        img,
        0,
        sy,
        img.width,
        Math.min(sliceH, img.height - sy),
        -extra,
        y,
        rw + extra * 2,
        Math.max(2, stride + 1)
      );
    }

    mode7FloorCache.set(key, layer);
    return layer;
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const s = 0.8 + Math.random() * 3.8;
      game.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.8,
        life: 0.35 + Math.random() * 0.45,
        maxLife: 0.8,
        color,
        size: 2 + Math.random() * 4
      });
    }
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function dynamicPlatforms(room = game.room) {
    if (!room) return [];
    const platforms = [];
    if (room.drawbridge) {
      const bridge = room.drawbridge;
      if (bridge.progress <= 0.35) platforms.push({ x: bridge.x, y: bridge.y, w: bridge.w, h: bridge.h, type: "gardenStone" });
    }
    const grotto = grottoRidePlatform(room);
    if (grotto) platforms.push(grotto);
    return platforms;
  }

  function collisionPlatforms(room = game.room) {
    return room ? room.platforms.concat(dynamicPlatforms(room)) : [];
  }

  function roomWidth(room = game.room) {
    return (room && room.width) || W;
  }

  function roomHeight(room = game.room) {
    return (room && room.height) || H;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updateHud() {
    const hp = clamp(player.hp / player.maxHp, 0, 1);
    if (hp !== hudCache.hp) {
      dom.hpFill.style.transform = `scaleX(${hp})`;
      hudCache.hp = hp;
    }
    const mp = clamp(player.mp / player.maxMp, 0, 1);
    if (mp !== hudCache.mp) {
      dom.mpFill.style.transform = `scaleX(${mp})`;
      hudCache.mp = mp;
    }
    // EXP bar: progress toward next level
    const cur = xpForLevel(player.level);
    const next = xpForLevel(player.level + 1);
    const span = Math.max(1, next - cur);
    const expPct = clamp((player.exp - cur) / span, 0, 1);
    if (expPct !== hudCache.exp) {
      if (dom.expFill) dom.expFill.style.transform = `scaleX(${expPct})`;
      hudCache.exp = expPct;
    }
    if (player.level !== hudCache.level) {
      if (dom.levelChip) dom.levelChip.textContent = `Lv ${player.level}`;
      hudCache.level = player.level;
    }
    if (player.hearts !== hudCache.hearts) {
      if (dom.heartsChip) dom.heartsChip.textContent = `♥ ${player.hearts}`;
      if (dom.heartsChip) dom.heartsChip.textContent = `H ${player.hearts}`;
      hudCache.hearts = player.hearts;
    }
    if (player.subweapon !== hudCache.sub) {
      if (dom.subChip) dom.subChip.textContent = SUB_LABEL_SHORT[player.subweapon] || "Dagger";
      hudCache.sub = player.subweapon;
    }
    const objShort = objectiveChipText();
    if (objShort !== hudCache.objective) {
      if (dom.objectiveChip) {
        dom.objectiveChip.textContent = objShort;
        dom.objectiveChip.title = objectiveShort();
        dom.objectiveChip.setAttribute("aria-label", objectiveShort());
      }
      hudCache.objective = objShort;
    }
    const compass = compassGlyphText();
    if (compass !== hudCache.compass) {
      if (dom.compassChip) {
        dom.compassChip.textContent = compass;
        dom.compassChip.title = compassText();
        dom.compassChip.setAttribute("aria-label", compassText());
      }
      hudCache.compass = compass;
    }
    const roomName = game.room ? game.room.name : "Nocturne Reliquary";
    if (roomName !== hudCache.room) {
      dom.roomName.textContent = roomName;
      hudCache.room = roomName;
    }
    const status = game.messageTimer > 0 ? game.message : "";
    if (status !== hudCache.status) {
      dom.statusLine.textContent = status;
      hudCache.status = status;
    }
  }

  function statusSummary() {
    const relics = [];
    relics.push(game.save.relics.doubleJump ? "Triple Moonstep" : "Double Jump");
    if (game.save.relics.dash) relics.push("Mist Dash");
    if (game.save.moonSigil) relics.push("Moon Sigil");
    const survey = surveyProgress();
    if (!survey.done) relics.push(`Map ${survey.visited}/${survey.total}`);
    const seals = questSealProgress();
    if (!seals.done) relics.push(`Seals ${seals.found}/${seals.total}`);
    if (player.combo > 1) relics.push(`Chain x${player.combo}`);
    return relics.join(" / ");
  }

  function updateMapPanel() {
    if (dom.objectiveLine) {
      dom.objectiveLine.textContent = compactObjectiveLine();
      dom.objectiveLine.title = nextObjective();
    }
    if (dom.sideObjectiveList) {
      dom.sideObjectiveList.innerHTML = "";
      for (const text of compactSideObjectives()) {
        const li = document.createElement("li");
        li.textContent = text;
        dom.sideObjectiveList.appendChild(li);
      }
    }
    if (dom.statsList) {
      const t = Math.floor(game.save.timePlayed || 0);
      const hh = String(Math.floor(t / 3600)).padStart(2, "0");
      const mm = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
      const ss = String(t % 60).padStart(2, "0");
      const cur = xpForLevel(player.level);
      const next = xpForLevel(player.level + 1);
      const pct = Math.max(0, Math.min(1, (player.exp - cur) / Math.max(1, next - cur)));
      const survey = surveyProgress();
      const stats = [
        ["LV", `${player.level} (${Math.round(pct * 100)}%)`],
        ["MAP", `${survey.visited}/${survey.total}`],
        ["HP", `${Math.round(player.hp)}/${player.maxHp}`],
        ["MP", `${Math.round(player.mp)}/${player.maxMp}`],
        ["HEART", `${player.hearts}`],
        ["TIME", `${hh}:${mm}:${ss}`]
      ];
      dom.statsList.innerHTML = "";
      for (const [label, value] of stats) {
        const row = document.createElement("div");
        row.className = "stat-row";
        const k = document.createElement("span");
        k.className = "stat-key";
        k.textContent = label;
        const v = document.createElement("span");
        v.className = "stat-val";
        v.textContent = value;
        row.appendChild(k);
        row.appendChild(v);
        dom.statsList.appendChild(row);
      }
    }
    dom.mapGrid.innerHTML = "";
    const coords = Object.values(rooms).map((room) => room.grid);
    const minX = Math.min(...coords.map(([gx]) => gx));
    const maxX = Math.max(...coords.map(([gx]) => gx));
    const minY = Math.min(...coords.map(([, gy]) => gy));
    const maxY = Math.max(...coords.map(([, gy]) => gy));
    const cols = maxX - minX + 1;
    const rows = maxY - minY + 1;
    dom.mapGrid.style.setProperty("--map-cols", String(cols));
    if (dom.miniMapGrid) {
      dom.miniMapGrid.innerHTML = "";
      dom.miniMapGrid.style.setProperty("--mini-map-cols", String(cols));
    }
    const grid = Array.from({ length: cols * rows }, () => null);
    for (const [id, room] of Object.entries(rooms)) {
      const [gx, gy] = room.grid;
      grid[(gy - minY) * cols + (gx - minX)] = { id, room };
    }
    const targetRoom = nextObjectiveRoom();
    for (const slot of grid) {
      const cell = document.createElement("div");
      cell.className = "map-cell";
      if (slot) {
        const seen = game.save.visited[slot.id];
        cell.classList.toggle("visited", Boolean(seen));
        cell.classList.toggle("current", slot.id === game.roomId);
        const isTarget = slot.id === targetRoom && slot.id !== game.roomId;
        cell.classList.toggle("target", isTarget);
        const baseText = seen || slot.id === game.roomId ? slot.room.name : "...";
        cell.textContent = isTarget ? `★ ${baseText}` : baseText;
      }
      if (slot) {
        const isCurrent = slot.id === game.roomId;
        const seen = game.save.visited[slot.id];
        const isTarget = slot.id === targetRoom && !isCurrent;
        cell.title = seen || isCurrent ? slot.room.name : "Uncharted";
        cell.textContent = isTarget ? "GO" : isCurrent ? "YOU" : "";
      }
      dom.mapGrid.appendChild(cell);
      if (dom.miniMapGrid) {
        const mini = document.createElement("div");
        mini.className = "mini-map-cell";
        if (slot) {
          const seen = game.save.visited[slot.id];
          mini.classList.toggle("visited", Boolean(seen));
          mini.classList.toggle("current", slot.id === game.roomId);
          mini.classList.toggle("target", slot.id === targetRoom && slot.id !== game.roomId);
          mini.title = seen || slot.id === game.roomId ? slot.room.name : "Uncharted";
        }
        dom.miniMapGrid.appendChild(mini);
      }
    }
    if (dom.miniMapObjective) dom.miniMapObjective.textContent = "";
    syncMapModeDom();

    dom.relicList.innerHTML = "";
    const owned = game.save.ownedSubweapons || {};
    const mapSurvey = surveyProgress();
    const seals = questSealProgress();
    const chips = [
      `LV ${player.level || game.save.level || 1}`,
      `MAP ${mapSurvey.visited}/${mapSurvey.total}`,
      !seals.done && `SEALS ${seals.found}/${seals.total}`,
      game.save.moonSigil && "SIGIL",
      game.save.relics.doubleJump && "BOOTS",
      game.save.relics.dash && "DASH",
      owned.dagger && (player.subweapon === "dagger" ? "[DAG]" : "DAG"),
      owned.axe && (player.subweapon === "axe" ? "[AXE]" : "AXE"),
      owned.holyWater && (player.subweapon === "holyWater" ? "[HOLY]" : "HOLY"),
      owned.boomerang && (player.subweapon === "boomerang" ? "[BOOM]" : "BOOM"),
      game.save.bossDefeated && "Crimson Rite"
    ].filter(Boolean);
    for (const label of chips) {
      const chip = document.createElement("span");
      chip.className = "relic-chip";
      chip.textContent = label;
      dom.relicList.appendChild(chip);
    }
  }

  function syncMapModeDom() {
    const mode = game.mapMode || "mini";
    if (dom.mapPanel) dom.mapPanel.hidden = mode !== "full";
    if (dom.miniMap) dom.miniMap.hidden = mode !== "mini";
    if (dom.mapButton) {
      dom.mapButton.textContent = mode === "full" ? "MAP" : mode === "mini" ? "MINI" : "OFF";
      dom.mapButton.setAttribute("aria-label", `Map mode: ${mode}. Cycle map mode`);
    }
  }

  function setMapMode(mode) {
    game.mapMode = mode === "full" || mode === "off" ? mode : "mini";
    syncMapModeDom();
    updateMapPanel();
  }

  function toggleMap(force) {
    if (force === true) {
      setMapMode("full");
      return;
    }
    if (force === false) {
      setMapMode("off");
      return;
    }
    const next = game.mapMode === "mini" ? "full" : game.mapMode === "full" ? "off" : "mini";
    setMapMode(next);
  }

  function playSound(key, volume = 0.36) {
    if (game.muted || !AUDIO[key]) return;
    let pool = sfxPool[key];
    if (!pool) {
      pool = new Array(SFX_POOL_SIZE);
      for (let i = 0; i < SFX_POOL_SIZE; i += 1) {
        const a = new Audio(AUDIO[key]);
        a.preload = "auto";
        pool[i] = a;
      }
      pool.cursor = 0;
      sfxPool[key] = pool;
    }
    let chosen = null;
    for (let i = 0; i < pool.length; i += 1) {
      const candidate = pool[i];
      if (candidate.paused || candidate.ended) {
        chosen = candidate;
        break;
      }
    }
    if (!chosen) {
      chosen = pool[pool.cursor];
      pool.cursor = (pool.cursor + 1) % pool.length;
    }
    try {
      chosen.currentTime = 0;
    } catch (_) {}
    chosen.volume = volume;
    chosen.play().catch(() => {});
  }

  function playMusic(key) {
    if (game.muted || !AUDIO[key]) return;
    if (musicKey === key && activeMusic) {
      if (activeMusic.paused) activeMusic.play().catch(() => {});
      return;
    }
    stopMusic();
    musicKey = key;
    activeMusic = new Audio(AUDIO[key]);
    activeMusic.loop = true;
    activeMusic.volume = key === "boss" ? 0.42 : 0.32;
    activeMusic.play().catch(() => {});
  }

  function stopMusic() {
    if (activeMusic) {
      activeMusic.pause();
      activeMusic.currentTime = 0;
    }
    activeMusic = null;
    musicKey = null;
  }

  function toggleMute() {
    game.muted = !game.muted;
    dom.muteButton.textContent = game.muted ? "MUT" : "VOL";
    if (game.muted) stopMusic();
    else if (game.room) playMusic(game.boss ? "boss" : game.room.music);
  }

  function isMobileLayout() {
    const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    return coarse || window.innerWidth <= 760 || window.innerHeight <= 520;
  }

  function syncMobileDefaults(options = {}) {
    if (isMobileLayout() && !game.mobileMode) toggleMobileMode(true, { silent: true, ...options });
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
  }

  function fullscreenRequest(root) {
    return root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen || null;
  }

  function fullscreenExit() {
    return document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen || null;
  }

  async function requestAppFullscreen(options = {}) {
    const root = document.getElementById("app");
    const request = fullscreenRequest(root);
    if (!request) {
      if (!options.quiet) message("Fullscreen is not available here");
      return false;
    }
    try {
      await request.call(root);
      updateFullscreenButton();
      return Boolean(fullscreenElement());
    } catch {
      if (!options.quiet) message("Fullscreen request was blocked");
      return false;
    }
  }

  async function enterMobileStartFullscreen() {
    if (!isMobileLayout() || fullscreenElement()) return true;
    syncMobileDefaults({ silent: true });
    game.mobileStartFullscreenAttempted += 1;
    game.mobileStartFullscreenBlocked = false;
    const ok = await requestAppFullscreen({ quiet: true });
    game.mobileStartFullscreenBlocked = !ok;
    if (!ok) message("Tap FS if fullscreen was blocked");
    return ok;
  }

  async function exitAppFullscreen() {
    const exit = fullscreenExit();
    if (!exit) return false;
    try {
      await exit.call(document);
      updateFullscreenButton();
      return true;
    } catch {
      message("Fullscreen exit was blocked");
      return false;
    }
  }

  function toggleMobileMode(force, options = {}) {
    game.mobileMode = force ?? !game.mobileMode;
    document.body.classList.toggle("mobile-mode", game.mobileMode);
    dom.mobileButton.textContent = game.mobileMode ? "PAD" : "MOB";
    dom.mobileButton.setAttribute("aria-pressed", String(game.mobileMode));
    if (!options.silent) message(game.mobileMode ? "Swipe mode armed" : "Swipe mode tucked away");
  }

  async function toggleFullscreen() {
    if (!fullscreenElement()) await requestAppFullscreen();
    else await exitAppFullscreen();
    updateFullscreenButton();
  }

  function updateFullscreenButton() {
    dom.fullscreenButton.textContent = fullscreenElement() ? "WIN" : "FS";
    dom.fullscreenButton.setAttribute("aria-pressed", String(Boolean(fullscreenElement())));
  }

  function clearSwipeMovement() {
    touchDown.delete("left");
    touchDown.delete("right");
    touchDown.delete("up");
    touchDown.delete("down");
  }

  function triggerTouchJump() {
    justPressed.add("touch:jump");
    game.touchJumpHold = Math.max(game.touchJumpHold || 0, 0.2);
  }

  function beginSwipe(event) {
    if (event.pointerType === "mouse" && !game.mobileMode) return;
    swipe.id = event.pointerId;
    swipe.startX = event.clientX;
    swipe.startY = event.clientY;
    swipe.lastX = event.clientX;
    swipe.lastY = event.clientY;
    swipe.jumpSent = false;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {}
  }

  function moveSwipe(event) {
    if (swipe.id !== event.pointerId) return;
    const dx = event.clientX - swipe.startX;
    const dy = event.clientY - swipe.startY;
    swipe.lastX = event.clientX;
    swipe.lastY = event.clientY;
    if (Math.abs(dx) > 22 && Math.abs(dx) > Math.abs(dy) * 1.05) {
      touchDown.delete(dx > 0 ? "left" : "right");
      touchDown.add(dx > 0 ? "right" : "left");
    }
    if (dy < -42 && !swipe.jumpSent) {
      triggerTouchJump();
      touchDown.add("up");
      swipe.jumpSent = true;
    } else if (dy > 52) {
      touchDown.add("down");
    }
  }

  function endSwipe(event) {
    if (swipe.id !== event.pointerId) return;
    const dx = event.clientX - swipe.startX;
    const dy = event.clientY - swipe.startY;
    const travel = Math.hypot(dx, dy);
    if (travel < 16 && game.mode === "playing") {
      const rect = canvas.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      if (localX > rect.width * 0.48) justPressed.add("touch:attack");
      else triggerTouchJump();
    }
    swipe.id = null;
    clearSwipeMovement();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
    lastTime = now;
    const frameStart = perfStats.enabled ? performance.now() : 0;
    const updateStart = frameStart;
    update(dt);
    const drawStart = perfStats.enabled ? performance.now() : 0;
    if (perfStats.enabled) recordPerfSample("update", drawStart - updateStart);
    draw();
    if (perfStats.enabled) {
      const frameEnd = performance.now();
      recordPerfSample("draw", frameEnd - drawStart);
      recordPerfSample("frame", frameEnd - frameStart);
    }
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (event) => {
    const code = event.code;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "Tab", "F6"].includes(code)) {
      event.preventDefault();
    }
    if (!event.repeat) {
      justPressed.add(code);
      if ((game.mode === "title" || game.mode === "dead" || game.mode === "win") && code === "Enter" && game.loaded) {
        resetRun(false);
      }
    }
    keysDown.add(code);
  });

  window.addEventListener("keyup", (event) => {
    keysDown.delete(event.code);
  });

  canvas.addEventListener("pointerdown", beginSwipe);
  canvas.addEventListener("pointermove", moveSwipe);
  canvas.addEventListener("pointerup", endSwipe);
  canvas.addEventListener("pointercancel", endSwipe);

  for (const eventName of ["contextmenu", "selectstart", "dragstart"]) {
    dom.touchControls.addEventListener(eventName, (event) => event.preventDefault());
    canvas.addEventListener(eventName, (event) => event.preventDefault());
  }

  for (const button of dom.touchControls.querySelectorAll("button")) {
    const action = button.dataset.touch;
    const releaseTouchButton = () => {
      touchDown.delete(action);
      button.classList.remove("is-down");
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      touchDown.add(action);
      justPressed.add(`touch:${action}`);
      button.classList.add("is-down");
      if (action === "jump") game.touchJumpHold = Math.max(game.touchJumpHold || 0, 0.2);
      try {
        button.setPointerCapture(event.pointerId);
      } catch {}
    });
    button.addEventListener("pointerup", releaseTouchButton);
    button.addEventListener("pointercancel", releaseTouchButton);
    button.addEventListener("pointerleave", releaseTouchButton);
  }

  dom.startButton.disabled = true;
  function startFromTitle(fromSave) {
    syncMobileDefaults({ silent: true });
    resetRun(fromSave);
  }

  dom.startButton.addEventListener("click", () => {
    dom.startButton.textContent = "Begin";
    startFromTitle(false);
  });
  dom.continueButton.addEventListener("click", () => startFromTitle(true));
  dom.pauseButton.addEventListener("click", () => togglePause());
  dom.quickSaveButton.addEventListener("click", quickSaveGame);
  dom.mobileButton.addEventListener("click", () => toggleMobileMode());
  dom.fullscreenButton.addEventListener("click", toggleFullscreen);
  dom.mapButton.addEventListener("click", () => toggleMap());
  dom.closeMapButton.addEventListener("click", () => toggleMap(false));
  dom.muteButton.addEventListener("click", toggleMute);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  document.addEventListener("webkitfullscreenchange", updateFullscreenButton);
  window.addEventListener("resize", () => syncMobileDefaults({ silent: true }));
  if (typeof window.matchMedia === "function") {
    for (const query of [window.matchMedia("(pointer: coarse)"), window.matchMedia("(max-width: 760px)")]) {
      if (query.addEventListener) query.addEventListener("change", () => syncMobileDefaults({ silent: true }));
    }
  }

  syncMobileDefaults({ silent: true });
  loadAssets();
  enterRoom("forest", rooms.forest.spawn, false);
  requestAnimationFrame(loop);
})();
