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
    mobileButton: document.getElementById("mobileButton"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    mapButton: document.getElementById("mapButton"),
    muteButton: document.getElementById("muteButton"),
    mapPanel: document.getElementById("mapPanel"),
    closeMapButton: document.getElementById("closeMapButton"),
    mapGrid: document.getElementById("mapGrid"),
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
    boss: "assets/generated/boss_sheet_anim.png",
    projectile: "assets/generated/projectile_sheet.png",
    whip: "assets/generated/whip_sheet.png",
    tiles: "assets/generated/ai_tileset_16bit.png",
    gate: "assets/generated/tile_gate.png",
    chain: "assets/generated/fg_chain.png",
    lamp: "assets/generated/fg_lamp.png",
    bgGate: "assets/generated/bg_gothic_hall.png",
    midGate: "assets/generated/bg_stage1_mid_tiled.png",
    bgClock: "assets/generated/bg_gothic_stairs.png",
    midClock: "assets/generated/bg_stage2_mid_tiled.png",
    bgCrypt: "assets/generated/bg_gothic_dungeon.png",
    midCrypt: "assets/generated/bg_stage3_mid_tiled.png",
    bgThrone: "assets/generated/bg_gothic_cathedral.png",
    midThrone: "assets/generated/bg_stage5_mid_tiled.png",
    bgLibrary: "assets/generated/bg_gothic_library.png",
    bgCavern: "assets/generated/bg_gothic_cavern.png",
    bgBelltower: "assets/generated/bg_gothic_belltower.png"
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
    mute: ["KeyM"],
    interact: ["KeyE", "Enter"],
    hint: ["KeyH", "Slash"]
  };
  window.__NOCTURNE_INPUT_INFO = {
    jumpKeys: KEYMAP.jump.slice(),
    upKeys: KEYMAP.up.slice(),
    feel: ["jumpBuffer", "downWhipPogo"]
  };
  window.__NOCTURNE_TUNING_INFO = {
    roomFlow: "horizontalCamera",
    longRoomWidth: LONG_ROOM_WIDTH,
    longRoomHeight: LONG_ROOM_HEIGHT,
    whipSideReach: WHIP_SIDE_REACH,
    spriteSet: "stable-v4",
    backgroundSet: "procedural-gothic-v1",
    difficulty: "mercy-pass"
  };

  const SPRITES = {
    playerFrameW: 128,
    playerFrameH: 184,
    playerFrames: 24,
    whipFrameW: 192,
    whipFrameH: 72,
    whipFrames: 8
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
    bellWraith: { row: 6, hp: 320, w: 70, h: 134, dw: 134, dh: 188, speed: 0.55, damage: 14, ai: "wraith", mini: true, banner: "Bell Wraith", subtitle: "Tower Sentinel" }
  };

  const images = {};
  const keysDown = new Set();
  const justPressed = new Set();
  const touchDown = new Set();
  const swipe = { id: null, startX: 0, startY: 0, lastX: 0, lastY: 0, jumpSent: false };
  let lastTime = 0;
  let activeMusic = null;
  let musicKey = null;
  let cachedVignette = null;
  const sfxPool = {};
  const SFX_POOL_SIZE = 3;
  const hudCache = { hp: -1, mp: -1, exp: -1, level: -1, hearts: -1, sub: "", room: "", status: "", objective: "", compass: "" };
  const SUB_LABEL_SHORT = { dagger: "Dagger", axe: "Axe", holyWater: "Holy Water" };

  const game = {
    mode: "loading",
    roomId: "gate",
    room: null,
    enemies: [],
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
    shake: 0,
    cameraX: 0,
    cameraY: 0,
    cameraTargetX: 0,
    cameraTargetY: 0,
    muted: false,
    mobileMode: false,
    message: "",
    messageTimer: 0,
    loaded: false,
    save: {
      visited: {},
      collected: {},
      killed: {},
      relics: { doubleJump: false, dash: false },
      moonSigil: false,
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
    stepWasGrounded: false
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

  function nextObjective() {
    const s = game.save;
    if (s.bossDefeated) return "Rite broken — explore freely or start a new run.";
    const target = nextObjectiveRoom();
    const inTarget = target === game.roomId;
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
    return "Return to Ashen Chapel — the moon-gate now opens to the Crimson Reliquary.";
  }

  function nextObjectiveRoom() {
    const s = game.save;
    if (s.bossDefeated) return null;
    if (!s.moonSigil) return "gallery";
    if (!s.relics.dash) return "tower";
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

  function sideObjectives() {
    const s = game.save;
    const out = [];
    if (!s.relics.doubleJump) out.push("Optional: Grave Boots (Triple Moonstep) wait in the Bone Bell Catacomb (Crypt → east).");
    if (!s.collected || !s.collected["garden:bloodRose"]) out.push("Optional: a Blood Rose in the Drowned Rose Garden raises Max HP.");
    if (s.ownedSubweapons && !s.ownedSubweapons.axe) out.push("Tip: smash candles — rare ones drop the War Axe.");
    if (s.ownedSubweapons && !s.ownedSubweapons.holyWater) out.push("Tip: candles can also drop Holy Water.");
    return out;
  }

  function objectiveShort() {
    const s = game.save;
    if (s.bossDefeated) return "Free roam";
    if (!s.moonSigil) return "Next: Moon Sigil";
    if (!s.relics.dash) return "Next: Mist Dash";
    return "Next: Crimson Reliquary";
  }

  const rooms = {
    gate: {
      name: "Gate Hall",
      grid: [0, 1],
      bg: "bgGate",
      mid: "midGate",
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
        d(922, 340, 38, 120, "gallery", 54, 330, "right"),
        d(424, 460, 112, 30, "crypt", 462, 72, "down"),
        d(180, 100, 100, 56, "library", 200, 380, "up")
      ],
      enemies: [
        e("z1", "zombie", 602, 386, 510, 760),
        e("bat1", "bat", 720, 195, 650, 850)
      ],
      items: [
        item("ringOfArdor", "ringOfArdor", 416, 130)
      ]
    },
    gallery: {
      name: "Silver Portrait Gallery",
      grid: [1, 1],
      bg: "bgGate",
      mid: "midGate",
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
        d(922, 340, 38, 120, "chapel", 54, 330, "right"),
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
    chapel: {
      name: "Ashen Chapel",
      grid: [2, 1],
      bg: "bgThrone",
      mid: "midThrone",
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
        d(0, 340, 38, 120, "gallery", 856, 330, "left"),
        d(922, 320, 38, 140, "throne", 68, 326, "right", "moonGate"),
        d(438, 0, 96, 56, "garden", 460, 372, "up")
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
      bg: "bgCrypt",
      mid: "midCrypt",
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
        d(0, 340, 38, 120, "crypt", 856, 330, "left")
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
      bg: "bgClock",
      mid: "midClock",
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
      bg: "bgGate",
      mid: "midGate",
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
        d(190, 440, 100, 56, "gate", 462, 380, "down")
      ],
      enemies: [
        e("sk4", "skeleton", 200, 296, 130, 380),
        e("wi3", "witch", 480, 232, 380, 700),
        e("bp3", "bonepillar", 730, 196, 690, 800)
      ],
      items: [
        item("librRose", "heartVessel", 460, 144)
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
        d(0, 320, 38, 140, "tower", 1346, 360, "left")
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
        d(160, 0, 100, 56, "garden", 264, 392, "up")
      ],
      enemies: [
        e("med4", "medusa", 360, 220, 280, 540),
        e("ph4", "phantom", 600, 180, 480, 800),
        e("g3", "gargoyle", 720, 246, 580, 870),
        e("r2", "reaper", 200, 158, 120, 380)
      ],
      items: [
        item("brookCrystal", "phoenixPendant", 880, 168)
      ]
    }
  };

  function p(x, y, w, h, type) {
    return { x, y, w, h, type };
  }

  function d(x, y, w, h, to, sx, sy, side, lock) {
    return { x, y, w, h, to, spawn: { x: sx, y: sy }, side, lock };
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
      gate: [p(902, 402, 156, 28, "stone"), p(1138, 344, 168, 28, "gold")],
      gallery: [p(842, 386, 158, 28, "red"), p(1084, 334, 178, 28, "stone")],
      chapel: [p(846, 348, 160, 28, "blue"), p(1098, 286, 178, 28, "stone")],
      crypt: [p(846, 378, 164, 28, "green"), p(1118, 306, 184, 28, "stone")],
      catacomb: [p(884, 390, 166, 28, "green"), p(1120, 322, 176, 28, "stone")],
      clock: [p(864, 380, 158, 28, "blue"), p(1090, 300, 172, 28, "stone")],
      tower: [p(872, 352, 162, 28, "gold"), p(1108, 270, 170, 28, "stone")],
      garden: [p(854, 384, 164, 28, "green"), p(1126, 318, 184, 28, "stone")],
      library: [p(880, 380, 160, 28, "trim"), p(1130, 308, 170, 28, "stone")],
      belltower: [p(870, 372, 160, 28, "gold"), p(1100, 296, 170, 28, "stone")],
      cavern: [p(880, 376, 160, 28, "blue"), p(1130, 308, 170, 28, "stone")]
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
    }

    for (const room of Object.values(rooms)) {
      for (const door of room.doors) {
        const target = rooms[door.to];
        if (door.side === "left" && target) door.spawn.x = Math.max(54, roomWidth(target) - 104);
      }
    }
  }

  enhanceRoomFlow();
  generateCandles();
  installShrines();
  installClimbAids();

  function installShrines() {
    rooms.gate.shrine = { x: 760, y: 438 };
    rooms.clock.shrine = { x: 820, y: 438 };
    rooms.garden.shrine = { x: 760, y: 438 };
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
    keys: Array.from(keysDown),
    touches: Array.from(touchDown),
    hp: Math.round(player.hp)
  });
  window.__NOCTURNE_TEST_INPUT = (action, down) => {
    if (!KEYMAP[action]) return;
    if (down) touchDown.add(action);
    else touchDown.delete(action);
  };

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
    game.loaded = true;
    window.__NOCTURNE_READY = true;
    game.mode = "title";
    dom.loadState.textContent = "Ready";
    dom.startButton.disabled = false;
    dom.continueButton.disabled = !hasSave();
    renderTitle("Nocturne Reliquary", "Hunt relics through a moonlocked castle and break the crimson rite.");
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
    dom.titlePanel.hidden = false;
  }

  function resetRun(fromSave) {
    const saved = fromSave ? readSave() : null;
    const base = saved || {
      roomId: "gate",
      x: rooms.gate.spawn.x,
      y: rooms.gate.spawn.y,
      hp: 112,
      mp: 48,
      save: {
        visited: {},
        collected: {},
        killed: {},
        relics: { doubleJump: false, dash: false },
        moonSigil: false,
        bossDefeated: false,
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
    dom.titlePanel.hidden = true;
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
      holyWater: Boolean(ownedRaw.holyWater)
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
      crits: Math.max(0, save.crits || 0)
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

  function enterRoom(roomId, spawn, autosave = true) {
    const room = rooms[roomId] || rooms.gate;
    game.roomId = roomId;
    game.room = room;
    game.save.visited[roomId] = true;
    player.x = spawn.x;
    player.y = spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
    game.enemies = room.enemies
      .filter((def) => !game.save.killed[`${roomId}:${def.id}`])
      .map(createEnemy);
    game.pickups = room.items
      .filter((def) => !game.save.collected[`${roomId}:${def.id}`])
      .map((def) => ({ ...def, bob: Math.random() * 10 }));
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
      // Mini-boss banner if any unkilled mini-boss in this room
      const mini = game.enemies.find((e) => e.cfg && e.cfg.mini);
      if (mini && game.mode === "playing") {
        game.bossBanner = { name: mini.cfg.banner || "Mini-Boss", subtitle: mini.cfg.subtitle || "", t: 0, life: 3.0 };
        playSound("bossRoar", 0.5);
      }
    }
    updateCamera(true);
    updateHud();
    updateMapPanel();
    if (autosave) writeSave();
  }

  function createEnemy(def) {
    const cfg = ENEMY_TYPES[def.type];
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
      lunge: 0
    };
  }

  function createBoss() {
    return {
      type: "lordVeyr",
      x: 650,
      y: 318,
      w: 80,
      h: 128,
      vx: -0.45,
      vy: 0,
      row: 5,
      hp: 150,
      maxHp: 150,
      facing: -1,
      cooldown: 1.4,
      state: "stalk",
      stateTimer: 1.2,
      hurt: 0
    };
  }

  function actionDown(action) {
    return KEYMAP[action].some((code) => keysDown.has(code)) || touchDown.has(action);
  }

  function actionJust(action) {
    return KEYMAP[action].some((code) => justPressed.has(code)) || justPressed.has(`touch:${action}`);
  }

  function clearJust() {
    justPressed.clear();
  }

  function update(dt) {
    if (game.mode !== "playing") {
      clearJust();
      return;
    }

    const step = Math.min(2, dt * 60);
    game.time += dt;
    game.save.timePlayed = (game.save.timePlayed || 0) + dt;
    game.shake = Math.max(0, game.shake - dt * 10);
    game.messageTimer = Math.max(0, game.messageTimer - dt);
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
    if (actionJust("pause")) toggleMap();

    // Pause gameplay while the menu is open. Still let the menu stats refresh.
    if (dom.mapPanel.hidden === false) {
      game.statsRefreshTimer = (game.statsRefreshTimer || 0) - dt;
      if (game.statsRefreshTimer <= 0) {
        game.statsRefreshTimer = 0.5;
        updateMapPanel();
      }
      clearJust();
      return;
    }

    updatePlayer(step, dt);
    updateEnemies(step, dt);
    updateBoss(step, dt);
    updateProjectiles(step, dt);
    updatePickups(dt);
    updateParticles(step, dt);
    updateCandles(dt);
    updateFlames(step, dt);
    updateShrines();
    updateDoors();
    updateBossBanner(dt);
    updateDamageTexts(dt);
    updateFamiliar(step, dt);
    updateCamera(false);
    updateHud();
    clearJust();
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

    const maxSpeed = player.dashTimer > 0 ? 10.4 : 4.2;
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

    if (player.attackTimer > 0.13 && !player.attackHit) {
      player.attackHit = true;
      playerMelee();
    }

    if (actionJust("subweapon") && player.subweaponCooldown <= 0) {
      if (actionDown("down")) {
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

    if (actionJust("spell") && player.spellCooldown <= 0) {
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

    if (!player.stepWasGrounded && player.onGround) {
      playSound("land", 0.3);
      burst(player.x + player.w / 2, player.y + player.h, "#927f61", 5);
    }

    if (player.y > roomHeight() + 80) {
      hurtPlayer(14);
      const spawn = game.room.spawn;
      player.x = spawn.x;
      player.y = spawn.y;
      player.vx = 0;
      player.vy = 0;
    }
  }

  function playerMelee() {
    const downWhip = player.attackVariant === "down";
    const box = downWhip
      ? { x: player.x - 28, y: player.y + player.h - 10, w: player.w + 56, h: 96 }
      : {
          x: player.facing > 0 ? player.x + player.w - 10 : player.x - WHIP_SIDE_REACH + 10,
          y: player.y + 10,
          w: WHIP_SIDE_REACH,
          h: WHIP_SIDE_HEIGHT
        };
    let hits = 0;
    slashParticles(box, downWhip);
    const meleeBonus = player.baseDamage * 2;
    for (const enemy of game.enemies) {
      if (rectsOverlap(box, enemy)) {
        let dmg = (downWhip ? 22 : 26) + meleeBonus;
        let crit = false;
        if (rollCrit()) { dmg = applyCrit(dmg); crit = true; }
        damageEnemy(enemy, dmg, crit);
        hits += 1;
      }
    }
    if (game.boss && rectsOverlap(box, game.boss)) {
      let dmg = (downWhip ? 18 : 20) + meleeBonus;
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
    for (const solid of game.room.platforms) {
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
    for (const solid of game.room.platforms) {
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

  function updateEnemies(step, dt) {
    const playerCenterX = player.x + player.w / 2;
    for (const enemy of game.enemies) {
      enemy.cooldown -= dt;
      enemy.hurt = Math.max(0, enemy.hurt - dt);
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
        // Mini-boss: heavy stalker that periodically lunges and emits a 3-shot fan
        enemy.vy += GRAVITY * step;
        const dist = playerCenterX - center;
        const dir = Math.sign(dist || enemy.facing);
        if (enemy.lunge > 0) {
          enemy.lunge -= dt;
          enemy.vx = dir * 5.4;
        } else {
          enemy.vx += dir * cfg.speed * 0.06 * step;
          enemy.vx = clamp(enemy.vx, -cfg.speed, cfg.speed);
        }
        if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
        moveEntity(enemy, step, false);
        if (enemy.cooldown <= 0) {
          if (Math.abs(dist) < 220 && Math.random() < 0.6) {
            enemy.lunge = 0.5;
            enemy.cooldown = 2.2;
            burst(enemy.x + enemy.w / 2, enemy.y + 24, "#bfa0ff", 14);
            playSound("bossRoar", 0.18);
          } else {
            for (const angle of [-0.18, 0, 0.18]) {
              const sp = 4.6;
              game.projectiles.push({
                from: "enemy",
                x: enemy.x + enemy.w / 2,
                y: enemy.y + enemy.h * 0.4,
                w: 18, h: 18,
                vx: dir * (sp - Math.abs(angle) * 1.2),
                vy: angle * 6,
                damage: cfg.damage,
                life: 2.0,
                color: "#c9a8ff"
              });
            }
            enemy.cooldown = 1.7;
          }
        }
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

      if (rectsOverlap(player, enemy)) hurtPlayer(cfg.damage);
    }
  }

  function shootEnemy(enemy, speed, color) {
    const dx = player.x + player.w / 2 - (enemy.x + enemy.w / 2);
    const dy = player.y + player.h / 2 - (enemy.y + enemy.h / 2);
    const len = Math.max(1, Math.hypot(dx, dy));
    game.projectiles.push({
      from: "enemy",
      x: enemy.x + enemy.w / 2,
      y: enemy.y + enemy.h * 0.38,
      w: 16,
      h: 16,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed,
      damage: 6,
      life: 2.2,
      color
    });
  }

  function updateBoss(step, dt) {
    const boss = game.boss;
    if (!boss) return;

    boss.cooldown -= dt;
    boss.stateTimer -= dt;
    boss.hurt = Math.max(0, boss.hurt - dt);
    boss.facing = player.x > boss.x ? 1 : -1;

    if (boss.state === "dash") {
      boss.vx = boss.facing * 5.4;
      if (boss.stateTimer <= 0) {
        boss.state = "stalk";
        boss.cooldown = 1.15;
      }
    } else if (boss.state === "cast") {
      boss.vx *= 0.8;
      if (boss.stateTimer <= 0) {
        boss.state = "stalk";
        boss.cooldown = 1.4;
      }
    } else {
      boss.vx += boss.facing * 0.035 * step;
      boss.vx = clamp(boss.vx, -1.1, 1.1);
      if (boss.cooldown <= 0) {
        if (boss.hp < boss.maxHp * 0.52 || Math.random() > 0.48) {
          boss.state = "cast";
          boss.stateTimer = 0.74;
          bossVolley(boss);
        } else {
          boss.state = "dash";
          boss.stateTimer = 0.42;
        }
      }
    }

    boss.vy += GRAVITY * step;
    moveEntity(boss, step, false);
    boss.x = clamp(boss.x, 140, 828);

    if (rectsOverlap(player, boss)) hurtPlayer(boss.state === "dash" ? 14 : 9);
  }

  function bossVolley(boss) {
    playSound("spell", 0.45);
    for (const angle of [-0.25, 0, 0.25]) {
      const dir = boss.facing;
      game.projectiles.push({
        from: "enemy",
        x: boss.x + boss.w / 2,
        y: boss.y + 58,
        w: 22,
        h: 22,
        vx: dir * (5.6 - Math.abs(angle) * 2),
        vy: angle * 8,
        damage: 8,
        life: 2.0,
        color: "#ff5465"
      });
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

      if (shot.from === "player") {
        for (const enemy of game.enemies) {
          if (shot.life > 0 && rectsOverlap(shot, enemy)) {
            damageEnemy(enemy, shot.damage);
            shot.life = 0;
          }
        }
        if (game.boss && shot.life > 0 && rectsOverlap(shot, game.boss)) {
          damageBoss(shot.damage);
          shot.life = 0;
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
        // Holy water lands and spawns flame puddle
        if (shot.life > 0 && shot.kind === "subweapon" && shot.subType === "holyWater" && shot.flameOnLand) {
          for (const solid of game.room.platforms) {
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
        for (const solid of game.room.platforms) {
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
    }
  }

  function cycleSubweapon() {
    const order = ["dagger", "axe", "holyWater"];
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

  function spawnCandleDrop(candle) {
    const drop = candle.drop;
    if (drop === "subAxe" || drop === "subHolyWater") {
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
        game.save.lastShrine = { roomId: game.roomId, x: s.x + 10, y: s.y - 14 };
        burst(s.x + 10, s.y - 10, "#f4d38b", 30);
        message("Save shrine: rested. Powers restored.");
        playSound("heart", 0.5);
        writeSave();
      } else if (game.messageTimer <= 0) {
        message("Press E to rest at the shrine");
      }
    }
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

    for (const door of game.room.doors) {
      if (!rectsOverlap(player, door)) continue;
      if ((door.side === "up" && !actionDown("up")) || (door.side === "down" && !actionDown("down"))) continue;
      if (!doorOpen(door)) {
        message(lockMessage(door.lock));
        player.x += door.side === "right" ? -6 : door.side === "left" ? 6 : 0;
        player.y += door.side === "up" ? 6 : door.side === "down" ? -6 : 0;
        return;
      }
      burst(player.x + player.w / 2, player.y + player.h / 2, "#eac36f", 18);
      playSound("gate");
      enterRoom(door.to, door.spawn);
      return;
    }
  }

  function doorOpen(door) {
    if (!door.lock) return true;
    if (door.lock === "moonGate") return game.save.moonSigil && game.save.relics.dash;
    return true;
  }

  function lockMessage(lock) {
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
    return "Sealed";
  }

  function lockShortMessage(lock) {
    if (lock === "moonGate") {
      const need = [];
      if (!game.save.moonSigil) need.push("Moon Sigil");
      if (!game.save.relics.dash) need.push("Mist Dash");
      if (need.length === 0) return "";
      return `LOCKED — need ${need.join(" + ")}`;
    }
    return "LOCKED";
  }

  function lockTargetRoom(lock) {
    if (lock === "moonGate") {
      if (!game.save.moonSigil) return "gallery";
      if (!game.save.relics.dash) return "tower";
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
    if (persist || drop.type === "subAxe" || drop.type === "subHolyWater") writeSave();
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
      game.save.killed[`${game.roomId}:${enemy.id}`] = true;
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
        game.shake = Math.max(game.shake, 1.6);
        message(`${enemy.cfg.banner || "Mini-Boss"} falls!`);
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

  function message(text) {
    game.message = text;
    game.messageTimer = 2.1;
  }

  function draw() {
    const shakeX = game.shake ? (Math.random() - 0.5) * game.shake * 4 : 0;
    const shakeY = game.shake ? (Math.random() - 0.5) * game.shake * 4 : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawRoom();
    ctx.save();
    ctx.translate(-Math.round(game.cameraX), -Math.round(game.cameraY));
    drawDoors();
    drawShrine();
    drawCandles();
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
    drawBossBanner();
    ctx.restore();
  }

  function drawRoom() {
    const room = game.room || rooms.gate;
    const bg = images[room.bg];
    const mid = images[room.mid];
    const cameraX = game.cameraX || 0;
    const cameraY = game.cameraY || 0;
    drawCover(bg, -cameraX * 0.08, -cameraY * 0.06, W + 120, H + 90);
    ctx.globalAlpha = 0.48;
    drawCover(mid, Math.sin(game.time * 0.12) * 8 - cameraX * 0.22, -cameraY * 0.12, W + 260, H + 140);
    ctx.globalAlpha = 1;

    const tone = room.palette === "red" ? "rgba(105, 18, 28, 0.20)" : room.palette === "green" ? "rgba(24, 86, 53, 0.18)" : room.palette === "blue" ? "rgba(31, 75, 115, 0.18)" : "rgba(111, 79, 30, 0.16)";
    ctx.fillStyle = tone;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-Math.round(cameraX), -Math.round(cameraY));
    drawArchitecture(room);
    const layer = getPlatformLayer(room);
    if (layer) {
      ctx.drawImage(layer, 0, 0);
    } else {
      for (const solid of room.platforms) drawPlatform(solid);
    }
    ctx.restore();
  }

  function getPlatformLayer(room) {
    if (room.__platformLayer) return room.__platformLayer;
    if (!images.tiles || !images.tiles.width) return null;
    const c = document.createElement("canvas");
    c.width = roomWidth(room);
    c.height = roomHeight(room);
    const cx = c.getContext("2d");
    cx.imageSmoothingEnabled = false;
    for (const solid of room.platforms) drawPlatformInto(cx, solid);
    room.__platformLayer = c;
    return c;
  }

  function drawPlatformInto(cx, solid) {
    const tile = solid.type === "green" ? [0, 4] : solid.type === "red" ? [0, 5] : solid.type === "blue" ? [4, 5] : solid.type === "trim" ? [5, 0] : solid.type === "stone" ? [1, 0] : [0, 0];
    cx.fillStyle = solid.type === "trim" ? "rgba(44, 36, 38, 0.84)" : "rgba(20, 20, 24, 0.88)";
    cx.fillRect(solid.x, solid.y, solid.w, solid.h);
    const tiles = images.tiles;
    if (tiles) {
      const sx0 = tile[0] * 64;
      const sy0 = tile[1] * 64;
      for (let x = solid.x; x < solid.x + solid.w; x += 48) {
        for (let y = solid.y; y < solid.y + solid.h; y += 48) {
          cx.drawImage(tiles, sx0, sy0, 64, 64, x, y, Math.min(48, solid.x + solid.w - x), Math.min(48, solid.y + solid.h - y));
        }
      }
    }
    cx.fillStyle = "rgba(244, 211, 139, 0.16)";
    cx.fillRect(solid.x, solid.y, solid.w, 2);
  }

  function drawArchitecture(room) {
    const chain = images.chain;
    const lamp = images.lamp;
    if (!chain || !lamp || !images.tiles) return;
    for (let x = 88; x < roomWidth(room); x += 192) {
      ctx.globalAlpha = 0.42;
      ctx.drawImage(chain, x, 34 + Math.sin(game.time + x) * 3, 24, 146);
      ctx.globalAlpha = 0.8;
      ctx.drawImage(lamp, x - 18, 170 + Math.sin(game.time * 1.7 + x) * 3, 42, 42);
    }
    ctx.globalAlpha = room.palette === "green" ? 0.18 : 0.14;
    for (let x = -40; x < roomWidth(room) + 80; x += 112) {
      drawTileCell(3, 0, x, 76, 64, 64);
      drawTileCell(3, 1, x + 44, 138, 64, 64);
    }
    ctx.globalAlpha = 1;
  }

  function drawPlatform(solid) {
    const tile = solid.type === "green" ? [0, 4] : solid.type === "red" ? [0, 5] : solid.type === "blue" ? [4, 5] : solid.type === "trim" ? [5, 0] : solid.type === "stone" ? [1, 0] : [0, 0];
    ctx.fillStyle = solid.type === "trim" ? "rgba(44, 36, 38, 0.84)" : "rgba(20, 20, 24, 0.88)";
    ctx.fillRect(solid.x, solid.y, solid.w, solid.h);
    if (!images.tiles) return;
    for (let x = solid.x; x < solid.x + solid.w; x += 48) {
      for (let y = solid.y; y < solid.y + solid.h; y += 48) {
        drawTileCell(tile[0], tile[1], x, y, Math.min(48, solid.x + solid.w - x), Math.min(48, solid.y + solid.h - y));
      }
    }
    ctx.fillStyle = "rgba(244, 211, 139, 0.16)";
    ctx.fillRect(solid.x, solid.y, solid.w, 2);
  }

  function drawTileCell(cx, cy, x, y, w, h) {
    if (!images.tiles) return;
    ctx.drawImage(images.tiles, cx * 64, cy * 64, 64, 64, x, y, w, h);
  }

  function drawDoors() {
    const gate = images.gate;
    for (const door of game.room.doors) {
      const open = doorOpen(door);
      ctx.globalAlpha = open ? 0.92 : 0.72;
      if (gate) ctx.drawImage(gate, door.x - 8, door.y - 18, door.w + 16, door.h + 28);
      ctx.fillStyle = open ? "rgba(107, 220, 194, 0.22)" : "rgba(211, 55, 52, 0.34)";
      ctx.fillRect(door.x, door.y, door.w, door.h);
      if (!open && door.lock) {
        drawLockBadge(door);
      }
    }
    ctx.globalAlpha = 1;
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
    if (lock === "moonGate") {
      return [
        { label: "Moon Sigil (Gallery)", have: !!game.save.moonSigil },
        { label: "Mist Dash (Tower)", have: !!game.save.relics.dash }
      ];
    }
    return [];
  }

  function drawPickups() {
    const target = nextObjectiveRoom();
    const inTargetRoom = target === game.roomId;
    for (const drop of game.pickups) {
      const y = drop.y + Math.sin(drop.bob) * 5;
      const isRelic = drop.type === "doubleJump" || drop.type === "dash" || drop.type === "moonSigil" || drop.type === "heartVessel" || drop.type === "subAxe" || drop.type === "subHolyWater" || drop.type === "familiarBat" || drop.type === "ringOfArdor" || drop.type === "batCloak" || drop.type === "wraithArmor" || drop.type === "phoenixPendant";
      const color = drop.type === "doubleJump" ? "#8bd7ff" : drop.type === "dash" ? "#d8fff3" : drop.type === "heartVessel" ? "#f05f5b" : drop.type === "moonSigil" ? "#f2cb68" : drop.type === "familiarBat" ? "#bfa0ff" : drop.type === "ringOfArdor" ? "#ff9a3a" : drop.type === "batCloak" ? "#9a7adb" : drop.type === "wraithArmor" ? "#cfeacc" : drop.type === "phoenixPendant" ? "#ffae3a" : "#f2cb68";

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

  function drawProjectiles() {
    for (const shot of game.projectiles) {
      if (shot.kind === "subweapon") {
        drawSubweapon(shot);
        continue;
      }
      ctx.shadowColor = shot.color;
      ctx.shadowBlur = shot.from === "player" ? 16 : 12;
      ctx.fillStyle = shot.color;
      ctx.beginPath();
      ctx.ellipse(shot.x + shot.w / 2, shot.y + shot.h / 2, shot.w / 2, shot.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function drawSubweapon(shot) {
    const cx = shot.x + shot.w / 2;
    const cy = shot.y + shot.h / 2;
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

  function drawEnemies() {
    for (const enemy of game.enemies) {
      const frame = Math.floor(game.time * 7 + enemy.phase) % 4;
      const alpha = enemy.hurt > 0 ? 0.55 : 1;
      drawSheetFrame(images.enemy, frame, enemy.cfg.row, 128, 176, enemy.x + enemy.w / 2, enemy.y + enemy.h, enemy.cfg.dw, enemy.cfg.dh, enemy.facing < 0, alpha);
      if (enemy.hp < enemy.maxHp) {
        if (enemy.cfg.mini) {
          drawSmallBar(enemy.x - 16, enemy.y - 14, enemy.w + 32, enemy.hp / enemy.maxHp, "#bfa0ff");
        } else {
          drawSmallBar(enemy.x - 6, enemy.y - 10, enemy.w + 12, enemy.hp / enemy.maxHp, "#cfe8b5");
        }
      }
    }
  }

  function drawBoss() {
    const boss = game.boss;
    if (!boss) return;
    const frame = boss.state === "dash" ? 2 : boss.state === "cast" ? 1 : Math.floor(game.time * 4) % 2;
    const alpha = boss.hurt > 0 ? 0.6 : 1;
    drawSheetFrame(images.boss, frame, boss.row, 300, 240, boss.x + boss.w / 2, boss.y + boss.h + 12, 236, 188, boss.facing < 0, alpha);
  }

  function drawPlayer() {
    let frame = 0;
    if (player.invuln > 0.62) frame = 11;
    else if (player.attackTimer > 0) frame = 12 + clamp(Math.floor(((0.28 - player.attackTimer) / 0.28) * 6), 0, 5);
    else if (!player.onGround) frame = 9;
    else if (actionDown("down")) frame = 18;
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
    if (!game.boss) return;
    const x = 254;
    const y = H - 34;
    const w = 452;
    ctx.fillStyle = "rgba(5, 4, 8, 0.78)";
    ctx.fillRect(x, y, w, 12);
    ctx.strokeStyle = "rgba(244, 211, 139, 0.5)";
    ctx.strokeRect(x, y, w, 12);
    ctx.fillStyle = "#d74539";
    ctx.fillRect(x + 2, y + 2, (w - 4) * (game.boss.hp / game.boss.maxHp), 8);
    ctx.fillStyle = "#f4d38b";
    ctx.font = "12px Trebuchet MS, Arial";
    ctx.textAlign = "center";
    ctx.fillText("Lord Veyr", x + w / 2, y - 6);
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
      hudCache.hearts = player.hearts;
    }
    if (player.subweapon !== hudCache.sub) {
      if (dom.subChip) dom.subChip.textContent = SUB_LABEL_SHORT[player.subweapon] || "Dagger";
      hudCache.sub = player.subweapon;
    }
    const objShort = objectiveShort();
    if (objShort !== hudCache.objective) {
      if (dom.objectiveChip) dom.objectiveChip.textContent = objShort;
      hudCache.objective = objShort;
    }
    const compass = compassText();
    if (compass !== hudCache.compass) {
      if (dom.compassChip) dom.compassChip.textContent = compass;
      hudCache.compass = compass;
    }
    const roomName = game.room ? game.room.name : "Nocturne Reliquary";
    if (roomName !== hudCache.room) {
      dom.roomName.textContent = roomName;
      hudCache.room = roomName;
    }
    const status = game.messageTimer > 0 ? game.message : statusSummary();
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
    if (player.combo > 1) relics.push(`Chain x${player.combo}`);
    return relics.join(" / ");
  }

  function updateMapPanel() {
    if (dom.objectiveLine) {
      dom.objectiveLine.textContent = nextObjective();
    }
    if (dom.sideObjectiveList) {
      dom.sideObjectiveList.innerHTML = "";
      for (const text of sideObjectives()) {
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
      const stats = [
        ["Level", `${player.level} (${Math.round(pct * 100)}% to next)`],
        ["XP", `${player.exp} / ${next}`],
        ["HP", `${Math.round(player.hp)} / ${player.maxHp}`],
        ["MP", `${Math.round(player.mp)} / ${player.maxMp}`],
        ["Hearts", `${player.hearts} / ${player.maxHearts}`],
        ["Strength", `+${player.baseDamage}`],
        ["Defense", `+${playerDefense()}`],
        ["Luck", `${playerLuck()}`],
        ["Kills", String(game.save.kills || 0)],
        ["Crits", String(game.save.crits || 0)],
        ["Time", `${hh}:${mm}:${ss}`]
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
    const grid = Array.from({ length: 12 }, () => null);
    for (const [id, room] of Object.entries(rooms)) {
      const [gx, gy] = room.grid;
      grid[gy * 4 + gx] = { id, room };
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
      dom.mapGrid.appendChild(cell);
    }

    dom.relicList.innerHTML = "";
    const owned = game.save.ownedSubweapons || {};
    const eq = game.save.equipment || {};
    const chips = [
      `Lv ${player.level || game.save.level || 1}`,
      game.save.relics.doubleJump && "Grave Boots",
      game.save.relics.dash && "Mist Dash",
      game.save.moonSigil && "Moon Sigil",
      eq.ringOfArdor && "Ring of Ardor",
      eq.batCloak && "Bat Cloak",
      eq.wraithArmor && "Wraith Armor",
      eq.phoenixPendant && "Phoenix Pendant",
      owned.dagger && (player.subweapon === "dagger" ? "[Dagger]" : "Dagger"),
      owned.axe && (player.subweapon === "axe" ? "[Axe]" : "Axe"),
      owned.holyWater && (player.subweapon === "holyWater" ? "[Holy Water]" : "Holy Water"),
      game.save.bossDefeated && "Crimson Rite"
    ].filter(Boolean);
    for (const label of chips) {
      const chip = document.createElement("span");
      chip.className = "relic-chip";
      chip.textContent = label;
      dom.relicList.appendChild(chip);
    }
  }

  function toggleMap(force) {
    const shouldOpen = force ?? dom.mapPanel.hidden;
    dom.mapPanel.hidden = !shouldOpen;
    updateMapPanel();
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

  function toggleMobileMode(force) {
    game.mobileMode = force ?? !game.mobileMode;
    document.body.classList.toggle("mobile-mode", game.mobileMode);
    dom.mobileButton.textContent = game.mobileMode ? "PAD" : "MOB";
    dom.mobileButton.setAttribute("aria-pressed", String(game.mobileMode));
    message(game.mobileMode ? "Swipe mode armed" : "Swipe mode tucked away");
  }

  async function toggleFullscreen() {
    const root = document.getElementById("app");
    try {
      if (!document.fullscreenElement) {
        if (!root.requestFullscreen) {
          message("Fullscreen is not available here");
          return;
        }
        await root.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      message("Fullscreen request was blocked");
    }
    updateFullscreenButton();
  }

  function updateFullscreenButton() {
    dom.fullscreenButton.textContent = document.fullscreenElement ? "WIN" : "FS";
    dom.fullscreenButton.setAttribute("aria-pressed", String(Boolean(document.fullscreenElement)));
  }

  function clearSwipeMovement() {
    touchDown.delete("left");
    touchDown.delete("right");
    touchDown.delete("up");
    touchDown.delete("down");
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
      justPressed.add("touch:jump");
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
      justPressed.add(localX > rect.width * 0.48 ? "touch:attack" : "touch:jump");
    }
    swipe.id = null;
    clearSwipeMovement();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (event) => {
    const code = event.code;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "Tab"].includes(code)) {
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
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      touchDown.add(action);
      justPressed.add(`touch:${action}`);
      try {
        button.setPointerCapture(event.pointerId);
      } catch {}
    });
    button.addEventListener("pointerup", () => touchDown.delete(action));
    button.addEventListener("pointercancel", () => touchDown.delete(action));
    button.addEventListener("pointerleave", () => touchDown.delete(action));
  }

  dom.startButton.disabled = true;
  dom.startButton.addEventListener("click", () => {
    dom.startButton.textContent = "Begin";
    resetRun(false);
  });
  dom.continueButton.addEventListener("click", () => resetRun(true));
  dom.mobileButton.addEventListener("click", () => toggleMobileMode());
  dom.fullscreenButton.addEventListener("click", toggleFullscreen);
  dom.mapButton.addEventListener("click", () => toggleMap());
  dom.closeMapButton.addEventListener("click", () => toggleMap(false));
  dom.muteButton.addEventListener("click", toggleMute);
  document.addEventListener("fullscreenchange", updateFullscreenButton);

  loadAssets();
  enterRoom("gate", rooms.gate.spawn, false);
  requestAnimationFrame(loop);
})();
