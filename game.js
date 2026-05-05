(() => {
  "use strict";

  const W = 960;
  const H = 540;
  const GRAVITY = 0.68;
  const LONG_ROOM_WIDTH = 1440;
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
    bgGate: "assets/generated/bg_stage1_crisp.png",
    midGate: "assets/generated/bg_stage1_mid_tiled.png",
    bgClock: "assets/generated/bg_stage2_crisp.png",
    midClock: "assets/generated/bg_stage2_mid_tiled.png",
    bgCrypt: "assets/generated/bg_stage3_crisp.png",
    midCrypt: "assets/generated/bg_stage3_mid_tiled.png",
    bgThrone: "assets/generated/bg_stage5_crisp.png",
    midThrone: "assets/generated/bg_stage5_mid_tiled.png"
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
    up: ["KeyW"],
    down: ["ArrowDown", "KeyS"],
    jump: ["ArrowUp", "Space", "KeyZ"],
    attack: ["KeyJ", "KeyX"],
    spell: ["KeyK", "KeyC"],
    dash: ["KeyL", "ShiftLeft", "ShiftRight"],
    map: ["Tab", "KeyI"],
    pause: ["Escape"],
    mute: ["KeyM"],
    interact: ["KeyE", "Enter"]
  };
  window.__NOCTURNE_INPUT_INFO = {
    jumpKeys: KEYMAP.jump.slice(),
    upKeys: KEYMAP.up.slice(),
    feel: ["jumpBuffer", "downWhipPogo"]
  };
  window.__NOCTURNE_TUNING_INFO = {
    roomFlow: "horizontalCamera",
    longRoomWidth: LONG_ROOM_WIDTH,
    whipSideReach: WHIP_SIDE_REACH,
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
    witch: { row: 9, hp: 34, w: 48, h: 88, dw: 86, dh: 126, speed: 0.34, damage: 7, ai: "witch" }
  };

  const images = {};
  const keysDown = new Set();
  const justPressed = new Set();
  const touchDown = new Set();
  const swipe = { id: null, startX: 0, startY: 0, lastX: 0, lastY: 0, jumpSent: false };
  let lastTime = 0;
  let activeMusic = null;
  let musicKey = null;

  const game = {
    mode: "loading",
    roomId: "gate",
    room: null,
    enemies: [],
    pickups: [],
    projectiles: [],
    particles: [],
    boss: null,
    time: 0,
    shake: 0,
    cameraX: 0,
    cameraTargetX: 0,
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
      maxMp: 48
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
    onGround: false,
    jumps: 0,
    coyote: 0,
    jumpBuffer: 0,
    attackTimer: 0,
    attackHit: false,
    attackVariant: "side",
    dashTimer: 0,
    dashCooldown: 0,
    invuln: 0,
    spellCooldown: 0,
    combo: 0,
    comboTimer: 0,
    score: 0,
    stepWasGrounded: false
  };

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
        d(424, 460, 112, 30, "crypt", 462, 72, "down")
      ],
      enemies: [
        e("z1", "zombie", 602, 386, 510, 760),
        e("bat1", "bat", 720, 195, 650, 850)
      ],
      items: []
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
      items: []
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
        e("g1", "gargoyle", 520, 198, 430, 650),
        e("r1", "reaper", 735, 118, 680, 870)
      ],
      items: [
        item("graveBoots", "doubleJump", 766, 170)
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
        d(430, 472, 100, 56, "gallery", 470, 72, "down"),
        d(922, 72, 38, 118, "tower", 60, 112, "right")
      ],
      enemies: [
        e("bat2", "bat", 214, 300, 120, 360),
        e("med2", "medusa", 510, 190, 430, 720),
        e("wi2", "witch", 790, 66, 720, 900)
      ],
      items: []
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
        d(430, 472, 100, 56, "garden", 480, 70, "down")
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
        d(922, 340, 38, 120, "chapel", 74, 330, "right")
      ],
      enemies: [
        e("z3", "zombie", 154, 302, 80, 300),
        e("g2", "gargoyle", 440, 222, 330, 610),
        e("med3", "medusa", 675, 198, 600, 830)
      ],
      items: [
        item("bloodRose", "heartVessel", 682, 214)
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
      garden: [p(854, 384, 164, 28, "green"), p(1126, 318, 184, 28, "stone")]
    };

    for (const [id, room] of Object.entries(rooms)) {
      room.width = room.boss ? W : LONG_ROOM_WIDTH;
      for (const solid of room.platforms) {
        if (solid.x === 0 && solid.w >= W) solid.w = room.width;
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
  window.__NOCTURNE_DEBUG_STATE = () => ({
    mode: game.mode,
    room: game.roomId,
    time: Number(game.time.toFixed(2)),
    roomWidth: roomWidth(),
    cameraX: Math.round(game.cameraX),
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
    player.hp = clamp(base.hp || player.maxHp, 1, player.maxHp);
    player.mp = clamp(base.mp ?? player.maxMp, 0, player.maxMp);
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
    playSound("ui");
    playMusic(game.room.music);
  }

  function normalizeSave(source) {
    const save = source || {};
    return {
      visited: { ...(save.visited || {}) },
      collected: { ...(save.collected || {}) },
      killed: { ...(save.killed || {}) },
      relics: {
        doubleJump: Boolean(save.relics && save.relics.doubleJump),
        dash: Boolean(save.relics && save.relics.dash)
      },
      moonSigil: Boolean(save.moonSigil),
      bossDefeated: Boolean(save.bossDefeated),
      maxHp: clamp(save.maxHp || 112, 112, 160),
      maxMp: clamp(save.maxMp || 48, 48, 120)
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
    game.projectiles.length = 0;
    game.boss = room.boss && !game.save.bossDefeated ? createBoss() : null;
    if (game.boss) {
      playMusic("boss");
      playSound("bossRoar");
      message("Lord Veyr waits beyond the glass altar");
    } else {
      playMusic(room.music);
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
      hurt: 0
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
    game.shake = Math.max(0, game.shake - dt * 10);
    game.messageTimer = Math.max(0, game.messageTimer - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.attackTimer = Math.max(0, player.attackTimer - dt);
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.spellCooldown = Math.max(0, player.spellCooldown - dt);
    player.comboTimer = Math.max(0, player.comboTimer - dt);
    if (player.comboTimer === 0) player.combo = 0;
    if (player.attackTimer === 0) player.attackHit = false;

    if (actionJust("map")) toggleMap();
    if (actionJust("mute")) toggleMute();
    if (dom.mapPanel.hidden === false && actionJust("pause")) toggleMap(false);

    updatePlayer(step, dt);
    updateEnemies(step, dt);
    updateBoss(step, dt);
    updateProjectiles(step, dt);
    updatePickups(dt);
    updateParticles(step, dt);
    updateDoors();
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
      if (player.onGround || player.coyote > 0) {
        player.vy = -12.4;
        player.onGround = false;
        player.coyote = 0;
        player.jumpBuffer = 0;
        player.jumps = 1;
        playSound("jump");
      } else {
        const maxJumps = save.relics.doubleJump ? 3 : 2;
        if (player.jumps < maxJumps) {
          player.vy = player.jumps === 1 ? -11.4 : -10.6;
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

    if (player.dashTimer > 0) {
      player.dashTimer = Math.max(0, player.dashTimer - dt);
      player.vy *= 0.72;
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

    player.mp = Math.min(player.maxMp, player.mp + dt * 2.2);
    player.stepWasGrounded = player.onGround;
    moveEntity(player, step, true);

    if (!player.stepWasGrounded && player.onGround) {
      playSound("land", 0.3);
      burst(player.x + player.w / 2, player.y + player.h, "#927f61", 5);
    }

    if (player.y > H + 80) {
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
    for (const enemy of game.enemies) {
      if (rectsOverlap(box, enemy)) {
        damageEnemy(enemy, downWhip ? 22 : 26);
        hits += 1;
      }
    }
    if (game.boss && rectsOverlap(box, game.boss)) {
      damageBoss(downWhip ? 18 : 20);
      hits += 1;
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
    const lookAhead = clamp(player.vx * 18, -110, 110);
    const target = clamp(player.x + player.w / 2 - W * 0.44 + lookAhead, 0, maxX);
    game.cameraTargetX = target;
    game.cameraX = snap ? target : game.cameraX + (target - game.cameraX) * 0.14;
    if (Math.abs(game.cameraX - target) < 0.5) game.cameraX = target;
  }

  function moveEntity(ent, step, clampToRoom) {
    ent.onGround = false;
    ent.x += ent.vx * step;
    for (const solid of game.room.platforms) {
      if (solid.h <= 44) continue;
      if (rectsOverlap(ent, solid)) {
        if (ent.vx > 0) ent.x = solid.x - ent.w;
        if (ent.vx < 0) ent.x = solid.x + solid.w;
        ent.vx = 0;
      }
    }

    ent.y += ent.vy * step;
    for (const solid of game.room.platforms) {
      if (!rectsOverlap(ent, solid)) continue;
      if (ent.vy >= 0) {
        ent.y = solid.y - ent.h;
        ent.vy = 0;
        ent.onGround = true;
      } else {
        ent.y = solid.y + solid.h;
        ent.vy = 0;
      }
    }

    if (clampToRoom) {
      ent.x = clamp(ent.x, -12, roomWidth() - ent.w + 12);
    }
  }

  function updateEnemies(step, dt) {
    for (const enemy of game.enemies) {
      enemy.cooldown -= dt;
      enemy.hurt = Math.max(0, enemy.hurt - dt);
      const cfg = enemy.cfg;
      const center = enemy.x + enemy.w / 2;
      enemy.facing = player.x + player.w / 2 > center ? 1 : -1;

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
    for (const shot of game.projectiles) {
      shot.life -= dt;
      shot.x += shot.vx * step;
      shot.y += shot.vy * step;
      shot.vy += (shot.from === "player" ? 0 : 0.02) * step;

      if (shot.from === "player") {
        for (const enemy of game.enemies) {
          if (shot.life > 0 && rectsOverlap(shot, enemy)) {
            shot.life = 0;
            damageEnemy(enemy, shot.damage);
          }
        }
        if (game.boss && shot.life > 0 && rectsOverlap(shot, game.boss)) {
          shot.life = 0;
          damageBoss(shot.damage);
        }
      } else if (rectsOverlap(shot, player)) {
        shot.life = 0;
        hurtPlayer(shot.damage);
      }
    }
    game.projectiles = game.projectiles.filter((shot) => shot.life > 0 && shot.x > -80 && shot.x < roomWidth() + 80 && shot.y > -80 && shot.y < H + 80);
  }

  function updatePickups(dt) {
    for (const drop of game.pickups) {
      drop.bob += dt * 5;
      if (rectsOverlap(player, { x: drop.x, y: drop.y, w: drop.w, h: drop.h })) {
        collectItem(drop);
      }
    }
    game.pickups = game.pickups.filter((drop) => !drop.dead);
  }

  function updateParticles(step, dt) {
    for (const dot of game.particles) {
      dot.life -= dt;
      dot.x += dot.vx * step;
      dot.y += dot.vy * step;
      dot.vy += 0.06 * step;
    }
    game.particles = game.particles.filter((dot) => dot.life > 0);
  }

  function updateDoors() {
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
      if (!game.save.moonSigil) return "The altar wants the Moon Sigil";
      if (!game.save.relics.dash) return "The red seal yields only to Mist Dash";
    }
    return "Sealed";
  }

  function collectItem(drop) {
    drop.dead = true;
    game.save.collected[`${game.roomId}:${drop.id}`] = true;
    if (drop.type === "doubleJump") {
      game.save.relics.doubleJump = true;
      message("Relic gained: Grave Boots / Triple Moonstep");
      burst(drop.x, drop.y, "#86d8ff", 34);
    } else if (drop.type === "dash") {
      game.save.relics.dash = true;
      message("Relic gained: Mist Dash");
      burst(drop.x, drop.y, "#d8fff3", 34);
    } else if (drop.type === "moonSigil") {
      game.save.moonSigil = true;
      message("Moon Sigil recovered");
      burst(drop.x, drop.y, "#f2cb68", 30);
    } else if (drop.type === "heartVessel") {
      game.save.maxHp = Math.min(160, game.save.maxHp + 16);
      player.maxHp = game.save.maxHp;
      player.hp = player.maxHp;
      message("Blood Rose deepens your life");
      burst(drop.x, drop.y, "#f05f5b", 30);
    } else {
      player.mp = Math.min(player.maxMp, player.mp + 12);
    }
    playSound(drop.type === "heartVessel" ? "heart" : "pickup");
    updateMapPanel();
    writeSave();
  }

  function damageEnemy(enemy, amount) {
    enemy.hp -= amount;
    enemy.hurt = 0.12;
    enemy.vx += player.facing * 1.4;
    burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#cfe8b5", 9);
    playSound("enemyHit", 0.42);
    if (enemy.hp <= 0) {
      game.save.killed[`${game.roomId}:${enemy.id}`] = true;
      game.enemies = game.enemies.filter((other) => other !== enemy);
      player.combo += 1;
      player.comboTimer = 3.0;
      player.score += 100 + player.combo * 25;
      player.mp = Math.min(player.maxMp, player.mp + 5 + Math.min(8, player.combo));
      if (player.combo > 1) message(`Moon chain x${player.combo}`);
      burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#e1d0a0", 22);
      playSound("enemyDie", 0.45);
      if (Math.random() > 0.65) {
        game.pickups.push({ id: `drop${game.time}${Math.random()}`, type: "mp", x: enemy.x, y: enemy.y + enemy.h / 2, w: 22, h: 22, bob: 0 });
      }
    }
  }

  function damageBoss(amount) {
    const boss = game.boss;
    if (!boss) return;
    boss.hp -= amount;
    boss.hurt = 0.13;
    game.shake = Math.max(game.shake, 1.2);
    burst(boss.x + boss.w / 2, boss.y + boss.h / 2, "#ff6d4e", 12);
    playSound("enemyHit", 0.5);
    if (boss.hp <= 0) {
      game.boss = null;
      game.save.bossDefeated = true;
      game.projectiles.length = 0;
      player.hp = player.maxHp;
      player.mp = player.maxMp;
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
    player.hp -= amount;
    player.invuln = 1.1;
    player.vx = -player.facing * 3.4;
    player.vy = -4.7;
    game.shake = 1.45;
    playSound("playerHit", 0.45);
    burst(player.x + player.w / 2, player.y + player.h / 2, "#d74236", 18);
    if (player.hp <= 0) {
      player.hp = 0;
      game.mode = "dead";
      renderTitle("Moonfall", "The castle rewinds around the last saved chamber.");
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
    ctx.translate(-Math.round(game.cameraX), 0);
    drawDoors();
    drawPickups();
    drawProjectiles();
    drawEnemies();
    drawBoss();
    drawPlayer();
    drawParticles();
    ctx.restore();
    drawBossHud();
    drawVignette();
    ctx.restore();
  }

  function drawRoom() {
    const room = game.room || rooms.gate;
    const bg = images[room.bg];
    const mid = images[room.mid];
    const cameraX = game.cameraX || 0;
    drawCover(bg, -cameraX * 0.08, 0, W + 120, H);
    ctx.globalAlpha = 0.48;
    drawCover(mid, Math.sin(game.time * 0.12) * 8 - cameraX * 0.22, 0, W + 260, H);
    ctx.globalAlpha = 1;

    const tone = room.palette === "red" ? "rgba(105, 18, 28, 0.20)" : room.palette === "green" ? "rgba(24, 86, 53, 0.18)" : room.palette === "blue" ? "rgba(31, 75, 115, 0.18)" : "rgba(111, 79, 30, 0.16)";
    ctx.fillStyle = tone;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-Math.round(cameraX), 0);
    drawArchitecture(room);
    for (const solid of room.platforms) drawPlatform(solid);
    ctx.restore();
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
    for (const door of game.room.doors) {
      const open = doorOpen(door);
      ctx.save();
      ctx.globalAlpha = open ? 0.92 : 0.72;
      if (images.gate) ctx.drawImage(images.gate, door.x - 8, door.y - 18, door.w + 16, door.h + 28);
      ctx.fillStyle = open ? "rgba(107, 220, 194, 0.22)" : "rgba(211, 55, 52, 0.34)";
      ctx.fillRect(door.x, door.y, door.w, door.h);
      ctx.restore();
    }
  }

  function drawPickups() {
    for (const drop of game.pickups) {
      const y = drop.y + Math.sin(drop.bob) * 5;
      const color = drop.type === "doubleJump" ? "#8bd7ff" : drop.type === "dash" ? "#d8fff3" : drop.type === "heartVessel" ? "#f05f5b" : "#f2cb68";
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(drop.x + 14, y + 14, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#08080d";
      ctx.fillRect(drop.x + 8, y + 8, 12, 12);
      ctx.restore();
    }
  }

  function drawProjectiles() {
    for (const shot of game.projectiles) {
      ctx.save();
      ctx.shadowColor = shot.color;
      ctx.shadowBlur = shot.from === "player" ? 16 : 12;
      ctx.fillStyle = shot.color;
      ctx.beginPath();
      ctx.ellipse(shot.x + shot.w / 2, shot.y + shot.h / 2, shot.w / 2, shot.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawEnemies() {
    for (const enemy of game.enemies) {
      const frame = Math.floor(game.time * 7 + enemy.phase) % 4;
      const alpha = enemy.hurt > 0 ? 0.55 : 1;
      drawSheetFrame(images.enemy, frame, enemy.cfg.row, 128, 176, enemy.x + enemy.w / 2, enemy.y + enemy.h, enemy.cfg.dw, enemy.cfg.dh, enemy.facing < 0, alpha);
      if (enemy.hp < enemy.maxHp) {
        drawSmallBar(enemy.x - 6, enemy.y - 10, enemy.w + 12, enemy.hp / enemy.maxHp, "#cfe8b5");
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
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(244, 211, 139, 0.7)";
      ctx.fillRect(cx - dw / 4, bottom - dh / 2, dw / 2, dh / 2);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    if (flip) {
      ctx.translate(cx, bottom - dh);
      ctx.scale(-1, 1);
      ctx.drawImage(img, col * fw, row * fh, fw, fh, -dw / 2, 0, dw, dh);
    } else {
      ctx.drawImage(img, col * fw, row * fh, fw, fh, cx - dw / 2, bottom - dh, dw, dh);
    }
    ctx.restore();
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

  function drawVignette() {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.24, W / 2, H / 2, H * 0.8);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.54)");
    ctx.fillStyle = g;
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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updateHud() {
    dom.hpFill.style.transform = `scaleX(${clamp(player.hp / player.maxHp, 0, 1)})`;
    dom.mpFill.style.transform = `scaleX(${clamp(player.mp / player.maxMp, 0, 1)})`;
    dom.roomName.textContent = game.room ? game.room.name : "Nocturne Reliquary";
    dom.statusLine.textContent = game.messageTimer > 0 ? game.message : statusSummary();
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
    dom.mapGrid.innerHTML = "";
    const grid = Array.from({ length: 12 }, () => null);
    for (const [id, room] of Object.entries(rooms)) {
      const [gx, gy] = room.grid;
      grid[gy * 4 + gx] = { id, room };
    }
    for (const slot of grid) {
      const cell = document.createElement("div");
      cell.className = "map-cell";
      if (slot) {
        const seen = game.save.visited[slot.id];
        cell.classList.toggle("visited", Boolean(seen));
        cell.classList.toggle("current", slot.id === game.roomId);
        cell.textContent = seen || slot.id === game.roomId ? slot.room.name : "...";
      }
      dom.mapGrid.appendChild(cell);
    }

    dom.relicList.innerHTML = "";
    const chips = [
      game.save.relics.doubleJump && "Grave Boots",
      game.save.relics.dash && "Mist Dash",
      game.save.moonSigil && "Moon Sigil",
      game.save.bossDefeated && "Crimson Rite"
    ].filter(Boolean);
    for (const label of chips.length ? chips : ["No relics"]) {
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
    const sound = new Audio(AUDIO[key]);
    sound.volume = volume;
    sound.play().catch(() => {});
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
