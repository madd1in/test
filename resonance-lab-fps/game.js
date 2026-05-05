(() => {
  "use strict";

  const MAP_LAYOUT = [
    "#####################",
    "#S..K...E....M......#",
    "##########A##########",
    "#P.R..M.....E.......#",
    "#.###################",
    "#.....H.......K...B.#",
    "###################.#",
    "#.................F.#",
    "#####################"
  ];

  const TAU = Math.PI * 2;
  const FOV = Math.PI / 3.05;
  const MAX_DEPTH = 18;
  const RAY_STEP = 4;
  const TARGET_RENDER_WIDTH = 760;
  const PLAYER_RADIUS = 0.22;
  const PLAYER_SPEED = 3.05;
  const RUN_SPEED = 4.65;
  const ENEMY_RADIUS = 0.24;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const miniCanvas = document.getElementById("miniMap");
  const miniCtx = miniCanvas.getContext("2d");

  const hud = {
    hpText: document.getElementById("hpText"),
    hpFill: document.getElementById("hpFill"),
    armorText: document.getElementById("armorText"),
    armorFill: document.getElementById("armorFill"),
    ammoText: document.getElementById("ammoText"),
    cardText: document.getElementById("cardText"),
    weaponText: document.getElementById("weaponText"),
    objectiveText: document.getElementById("objectiveText"),
    promptText: document.getElementById("promptText"),
    aiChip: document.getElementById("aiChip"),
    aiText: document.getElementById("aiText"),
    sectorText: document.getElementById("sectorText"),
    damageFlash: document.getElementById("damageFlash"),
    startOverlay: document.getElementById("startOverlay"),
    endOverlay: document.getElementById("endOverlay"),
    endKicker: document.getElementById("endKicker"),
    endTitle: document.getElementById("endTitle"),
    endBody: document.getElementById("endBody"),
    audioBtn: document.getElementById("audioBtn"),
    startBtn: document.getElementById("startBtn"),
    restartBtn: document.getElementById("restartBtn")
  };

  const ASSET_SOURCES = {
    images: {
      wall: "./assets/textures/wall-lab.png",
      doorA: "./assets/textures/door-a.png",
      doorB: "./assets/textures/door-b.png",
      floor: "./assets/textures/floor-panel.png",
      ceiling: "./assets/textures/ceiling-panel.png",
      pistol: "./assets/sprites/gun-pistol.png",
      bar: "./assets/sprites/gun-bar.png",
      specimen: "./assets/sprites/enemy-specimen.png",
      drone: "./assets/sprites/enemy-drone.png",
      guard: "./assets/sprites/enemy-guard.png"
    },
    audio: {
      bgm: "./assets/audio/bgm/lab-loop.mp3",
      fire: "./assets/audio/sfx/pulse-fire.ogg",
      impact: "./assets/audio/sfx/impact.wav",
      enemyHurt: "./assets/audio/sfx/enemy-hurt.wav",
      enemyDie: "./assets/audio/sfx/enemy-die.wav",
      door: "./assets/audio/sfx/door-open.ogg",
      pickup: "./assets/audio/sfx/pickup.wav",
      playerHit: "./assets/audio/sfx/player-hit.wav"
    }
  };

  const assets = {
    images: {},
    rasters: {},
    patterns: {},
    sounds: {},
    bgm: null,
    muted: false,
    readyImages: 0
  };

  const keys = Object.create(null);
  const virtualKeys = Object.create(null);
  const depthBuffer = [];
  const particles = [];
  let viewWidth = 1;
  let viewHeight = 1;
  let dpr = 1;
  let lastTime = performance.now();

  const enemyTypes = [
    {
      name: "Specimen",
      hp: 55,
      speed: 0.72,
      attack: 12,
      color: "#75f0af",
      core: "#f3fff6",
      sprite: "specimen",
      scale: 0.9,
      notice: 6.6
    },
    {
      name: "Security Drone",
      hp: 76,
      speed: 0.56,
      attack: 16,
      color: "#f0b849",
      core: "#e8f6ff",
      sprite: "drone",
      scale: 1.05,
      notice: 7.5
    },
    {
      name: "Containment Guard",
      hp: 92,
      speed: 0.48,
      attack: 20,
      color: "#ff6c57",
      core: "#ffe7de",
      sprite: "guard",
      scale: 1.12,
      notice: 8.8
    }
  ];

  const itemInfo = {
    K: { type: "card", label: "Access card", color: "#f0b849", scale: 0.42 },
    M: { type: "ammo", label: "Pulse cells", color: "#5ee0cf", scale: 0.45, amount: 18 },
    H: { type: "health", label: "Med kit", color: "#ff5c4d", scale: 0.48, amount: 34 },
    R: { type: "armor", label: "Suit battery", color: "#9bd2ff", scale: 0.5, amount: 35 }
  };

  const state = {
    phase: "menu",
    won: false,
    player: {
      x: 1.5,
      y: 1.5,
      angle: 0,
      hp: 100,
      armor: 0,
      ammo: 24,
      cards: 0,
      weapon: "pistol",
      bob: 0,
      hurt: 0,
      shootKick: 0,
      meleeKick: 0,
      cooldown: 0
    },
    level: null,
    time: 0,
    shake: 0,
    message: "Click to enter lab",
    messageTimer: 0,
    currentTarget: null,
    ai: {
      timer: 0,
      nextIdle: 16,
      lastSpoken: -99,
      lowHealthWarned: false,
      voice: null
    }
  };

  const AI_LINES = {
    start: [
      "Welcome back. Try not to touch the glowing failure.",
      "Suit telemetry is green. Your odds are an unrelated color.",
      "Containment assignment accepted. Regret is not a valid input."
    ],
    idle: [
      "Reminder: screaming is not a recognized access credential.",
      "Your movement pattern has been filed under enthusiastic uncertainty.",
      "The facility appreciates your willingness to be statistically useful.",
      "If you see a portal, do not wave. It is not being friendly."
    ],
    card: [
      "Access card acquired. Literacy remains optional but encouraged.",
      "That rectangle has improved your survival prospects by a measurable amount."
    ],
    ammo: [
      "Ammunition recovered. Please spend it with less panic than last time.",
      "Pulse cells loaded. The walls are already nervous."
    ],
    health: [
      "Medical kit applied. Dignity restoration unavailable.",
      "Health restored. The lab will update its disappointment model."
    ],
    armor: [
      "Suit battery online. You are briefly less fragile.",
      "Protective charge restored. Do not become inspired."
    ],
    relay: [
      "Power relay restored. The lights are pretending this is fine.",
      "Relay online. Catastrophe delayed, not cancelled."
    ],
    door: [
      "Door released. The facility has lowered one standard.",
      "Security seal opened. Congratulations on operating a rectangle."
    ],
    locked: [
      "Access denied. The door has standards.",
      "No. But with architecture."
    ],
    kill: [
      "Target neutralized. Clean-up has been optimistically scheduled.",
      "Specimen removed from active payroll."
    ],
    lowHealth: [
      "Vital signs disagree with your confidence.",
      "Health critical. Consider becoming harder to hit."
    ],
    win: [
      "Containment restored. I am choosing to call this intentional.",
      "Core stabilized. The facility will remember this as teamwork."
    ],
    lose: [
      "Signal lost. Your performance review will be concise.",
      "Containment failed. On the bright side, paperwork has ended."
    ]
  };

  function initAssets() {
    for (const [key, src] of Object.entries(ASSET_SOURCES.images)) {
      const image = new Image();
      image.onload = () => {
        assets.readyImages += 1;
        assets.rasters[key] = rasterizeAsset(key, image);
        assets.patterns = {};
      };
      image.src = src;
      assets.images[key] = image;
    }

    for (const [key, src] of Object.entries(ASSET_SOURCES.audio)) {
      if (key === "bgm") continue;
      const sound = new Audio(src);
      sound.preload = "auto";
      assets.sounds[key] = sound;
    }

    assets.bgm = new Audio(ASSET_SOURCES.audio.bgm);
    assets.bgm.loop = true;
    assets.bgm.preload = "auto";
    assets.bgm.volume = 0.28;
    hud.audioBtn.setAttribute("aria-pressed", "true");
  }

  function imageReady(image) {
    return image && image.complete && image.naturalWidth > 0;
  }

  function rasterizeAsset(key, image) {
    const isTexture = ["wall", "doorA", "doorB", "floor", "ceiling"].includes(key);
    const size = isTexture ? 128 : key === "pistol" ? 420 : key === "bar" ? 320 : 260;
    const aspect = (image.naturalHeight || size) / (image.naturalWidth || size);
    const canvasBuffer = document.createElement("canvas");
    canvasBuffer.width = size;
    canvasBuffer.height = Math.max(1, Math.round(size * aspect));
    const bufferCtx = canvasBuffer.getContext("2d");
    bufferCtx.imageSmoothingEnabled = true;
    bufferCtx.imageSmoothingQuality = "high";
    bufferCtx.clearRect(0, 0, canvasBuffer.width, canvasBuffer.height);
    bufferCtx.drawImage(image, 0, 0, canvasBuffer.width, canvasBuffer.height);
    return canvasBuffer;
  }

  function visualAsset(key) {
    return assets.rasters[key] || assets.images[key];
  }

  function playSound(name, volume = 1) {
    if (assets.muted) return;
    const sound = assets.sounds[name];
    if (!sound) return;
    const clone = sound.cloneNode();
    clone.volume = clamp(volume, 0, 1);
    clone.play().catch(() => {});
  }

  function startMusic() {
    if (!assets.bgm || assets.muted) return;
    assets.bgm.volume = 0.28;
    assets.bgm.play().catch(() => {});
  }

  function stopMusic() {
    if (!assets.bgm) return;
    assets.bgm.pause();
    assets.bgm.currentTime = 0;
  }

  function toggleAudio() {
    assets.muted = !assets.muted;
    hud.audioBtn.setAttribute("aria-pressed", assets.muted ? "false" : "true");
    hud.audioBtn.textContent = assets.muted ? "Muted" : "Audio";
    if (assets.muted) {
      if (assets.bgm) assets.bgm.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    } else {
      startMusic();
      playSound("pickup", 0.28);
      aiComment("idle", 2.8, true);
    }
  }

  function chooseLine(kind) {
    const lines = AI_LINES[kind] || AI_LINES.idle;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  function aiComment(kind, seconds = 3.4, speak = true) {
    const line = chooseLine(kind);
    state.ai.timer = seconds;
    state.ai.nextIdle = 18 + Math.random() * 14;
    hud.aiText.textContent = line;
    hud.aiChip.classList.add("active");
    if (speak) speakAi(line);
  }

  function speakAi(line) {
    if (assets.muted || !("speechSynthesis" in window)) return;
    if (state.time - state.ai.lastSpoken < 3.5) return;
    state.ai.lastSpoken = state.time;
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    utterance.pitch = 0.72;
    utterance.volume = 0.68;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) => /zira|hazel|aria|female|english/i.test(voice.name));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function updateAi(dt) {
    state.ai.timer = Math.max(0, state.ai.timer - dt);
    state.ai.nextIdle = Math.max(0, state.ai.nextIdle - dt);
    hud.aiChip.classList.toggle("active", state.ai.timer > 0);
    if (state.phase === "playing" && state.ai.nextIdle <= 0) {
      aiComment("idle", 3.2, true);
    }
  }

  function createLevel() {
    const map = MAP_LAYOUT.map((row) => row.split(""));
    const level = {
      map,
      width: MAP_LAYOUT[0].length,
      height: MAP_LAYOUT.length,
      start: { x: 1.5, y: 1.5 },
      enemies: [],
      items: [],
      doors: {
        A: { id: "A", x: 0, y: 0, open: false, needs: "card" },
        B: { id: "B", x: 0, y: 0, open: false, needs: "power" }
      },
      switcher: null,
      final: null,
      power: false
    };

    let enemyIndex = 0;
    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        const tile = map[y][x];
        if (tile === "S") {
          level.start = { x: x + 0.5, y: y + 0.5 };
          map[y][x] = ".";
        } else if (tile === "E") {
          const def = enemyTypes[enemyIndex % enemyTypes.length];
          level.enemies.push({
            id: enemyIndex,
            name: def.name,
            x: x + 0.5,
            y: y + 0.5,
            vx: 0,
            vy: 0,
            hp: def.hp,
            maxHp: def.hp,
            speed: def.speed,
            attack: def.attack,
            color: def.color,
            core: def.core,
            sprite: def.sprite,
            scale: def.scale,
            notice: def.notice,
            alert: 0,
            cooldown: 0,
            dead: false,
            hit: 0
          });
          enemyIndex += 1;
          map[y][x] = ".";
        } else if (itemInfo[tile]) {
          const info = itemInfo[tile];
          level.items.push({
            id: `${tile}-${x}-${y}`,
            type: info.type,
            label: info.label,
            x: x + 0.5,
            y: y + 0.5,
            color: info.color,
            scale: info.scale,
            amount: info.amount || 1,
            taken: false,
            bob: Math.random() * TAU
          });
          map[y][x] = ".";
        } else if (tile === "P") {
          level.switcher = { x: x + 0.5, y: y + 0.5, used: false };
          map[y][x] = ".";
        } else if (tile === "F") {
          level.final = { x: x + 0.5, y: y + 0.5, used: false };
          map[y][x] = ".";
        } else if (tile === "A" || tile === "B") {
          level.doors[tile].x = x;
          level.doors[tile].y = y;
        }
      }
    }

    return level;
  }

  function resetGame() {
    state.level = createLevel();
    state.player.x = state.level.start.x;
    state.player.y = state.level.start.y;
    state.player.angle = 0;
    state.player.hp = 100;
    state.player.armor = 0;
    state.player.ammo = 24;
    state.player.cards = 0;
    state.player.weapon = "pistol";
    state.player.bob = 0;
    state.player.hurt = 0;
    state.player.shootKick = 0;
    state.player.meleeKick = 0;
    state.player.cooldown = 0;
    state.phase = "playing";
    state.won = false;
    state.time = 0;
    state.shake = 0;
    state.message = "Containment wing breached";
    state.messageTimer = 2.2;
    state.currentTarget = null;
    state.ai.timer = 0;
    state.ai.nextIdle = 14;
    state.ai.lowHealthWarned = false;
    particles.length = 0;
    hud.startOverlay.classList.remove("active");
    hud.endOverlay.classList.remove("active");
    startMusic();
    playSound("door", 0.35);
    aiComment("start", 4.2, true);
    updateHud();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(1, TARGET_RENDER_WIDTH / Math.max(1, rect.width));
    dpr = 1;
    viewWidth = Math.max(360, Math.floor(rect.width * scale));
    viewHeight = Math.max(240, Math.floor(rect.height * scale));
    canvas.width = viewWidth;
    canvas.height = viewHeight;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const miniRect = miniCanvas.getBoundingClientRect();
    const miniSize = Math.max(96, Math.floor(Math.min(miniRect.width, miniRect.height)));
    miniCanvas.width = miniSize;
    miniCanvas.height = miniSize;
    miniCtx.setTransform(1, 0, 0, 1, 0, 0);
    miniCtx.imageSmoothingEnabled = false;
  }

  function normalizeAngle(angle) {
    while (angle <= -Math.PI) angle += TAU;
    while (angle > Math.PI) angle -= TAU;
    return angle;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function tileAt(x, y) {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (!state.level || gy < 0 || gy >= state.level.height || gx < 0 || gx >= state.level.width) {
      return "#";
    }
    return state.level.map[gy][gx] || "#";
  }

  function isSolidTile(tile) {
    if (tile === "#") return true;
    if ((tile === "A" || tile === "B") && !state.level.doors[tile].open) return true;
    return false;
  }

  function canStandAt(x, y) {
    return (
      !isSolidTile(tileAt(x - PLAYER_RADIUS, y - PLAYER_RADIUS)) &&
      !isSolidTile(tileAt(x + PLAYER_RADIUS, y - PLAYER_RADIUS)) &&
      !isSolidTile(tileAt(x - PLAYER_RADIUS, y + PLAYER_RADIUS)) &&
      !isSolidTile(tileAt(x + PLAYER_RADIUS, y + PLAYER_RADIUS))
    );
  }

  function canEnemyStandAt(x, y) {
    return (
      !isSolidTile(tileAt(x - ENEMY_RADIUS, y - ENEMY_RADIUS)) &&
      !isSolidTile(tileAt(x + ENEMY_RADIUS, y - ENEMY_RADIUS)) &&
      !isSolidTile(tileAt(x - ENEMY_RADIUS, y + ENEMY_RADIUS)) &&
      !isSolidTile(tileAt(x + ENEMY_RADIUS, y + ENEMY_RADIUS))
    );
  }

  function hasLineOfSight(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(4, Math.ceil(dist * 9));
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      if (isSolidTile(tileAt(ax + dx * t, ay + dy * t))) {
        return false;
      }
    }
    return true;
  }

  function castRay(angle, maxDepth = MAX_DEPTH) {
    const px = state.player.x;
    const py = state.player.y;
    const rayDirX = Math.cos(angle);
    const rayDirY = Math.sin(angle);
    let mapX = Math.floor(px);
    let mapY = Math.floor(py);
    const deltaDistX = Math.abs(1 / (rayDirX || 0.0001));
    const deltaDistY = Math.abs(1 / (rayDirY || 0.0001));
    const stepX = rayDirX < 0 ? -1 : 1;
    const stepY = rayDirY < 0 ? -1 : 1;
    let sideDistX = rayDirX < 0 ? (px - mapX) * deltaDistX : (mapX + 1 - px) * deltaDistX;
    let sideDistY = rayDirY < 0 ? (py - mapY) * deltaDistY : (mapY + 1 - py) * deltaDistY;
    let side = 0;
    let tile = ".";
    let hit = false;
    let distance = maxDepth;

    while (!hit && distance < maxDepth + 1) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        mapY += stepY;
        side = 1;
      }
      tile = tileAt(mapX, mapY);
      if (isSolidTile(tile)) {
        hit = true;
        distance =
          side === 0
            ? (mapX - px + (1 - stepX) / 2) / (rayDirX || 0.0001)
            : (mapY - py + (1 - stepY) / 2) / (rayDirY || 0.0001);
      } else {
        const dx = mapX + 0.5 - px;
        const dy = mapY + 0.5 - py;
        distance = Math.hypot(dx, dy);
      }
      if (Math.abs(mapX - px) > maxDepth || Math.abs(mapY - py) > maxDepth) break;
    }

    const wallX = side === 0 ? py + distance * rayDirY : px + distance * rayDirX;
    return {
      hit,
      tile,
      distance: Math.max(0.0001, distance),
      side,
      mapX,
      mapY,
      wallX: wallX - Math.floor(wallX)
    };
  }

  function setMessage(text, seconds = 2) {
    state.message = text;
    state.messageTimer = seconds;
  }

  function pressed(code) {
    return keys[code] || virtualKeys[code];
  }

  function update(dt) {
    state.time += dt;
    updateAi(dt);
    if (state.phase !== "playing") {
      updateHud();
      return;
    }

    const player = state.player;
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.hurt = Math.max(0, player.hurt - dt);
    player.shootKick = Math.max(0, player.shootKick - dt * 5.5);
    player.meleeKick = Math.max(0, player.meleeKick - dt * 4.2);
    state.shake = Math.max(0, state.shake - dt * 7);
    state.messageTimer = Math.max(0, state.messageTimer - dt);

    let turn = 0;
    if (pressed("ArrowLeft")) turn -= 1;
    if (pressed("ArrowRight")) turn += 1;
    player.angle = normalizeAngle(player.angle + turn * dt * 2.6);

    let forward = 0;
    let strafe = 0;
    if (pressed("KeyW") || pressed("ArrowUp")) forward += 1;
    if (pressed("KeyS") || pressed("ArrowDown")) forward -= 1;
    if (pressed("KeyA")) strafe -= 1;
    if (pressed("KeyD")) strafe += 1;

    const moving = forward !== 0 || strafe !== 0;
    if (moving) {
      const len = Math.hypot(forward, strafe) || 1;
      forward /= len;
      strafe /= len;
      const speed = pressed("ShiftLeft") || pressed("ShiftRight") ? RUN_SPEED : PLAYER_SPEED;
      const sin = Math.sin(player.angle);
      const cos = Math.cos(player.angle);
      const dx = (cos * forward - sin * strafe) * speed * dt;
      const dy = (sin * forward + cos * strafe) * speed * dt;
      tryMovePlayer(dx, dy);
      player.bob += dt * speed * 2.2;
    } else {
      player.bob += dt * 1.2;
    }

    collectNearbyItems();
    updateEnemies(dt);
    updateParticles(dt);
    updateCurrentTarget();
    updateHud();
  }

  function tryMovePlayer(dx, dy) {
    const player = state.player;
    if (canStandAt(player.x + dx, player.y)) player.x += dx;
    if (canStandAt(player.x, player.y + dy)) player.y += dy;
  }

  function updateEnemies(dt) {
    const player = state.player;
    for (const enemy of state.level.enemies) {
      if (enemy.dead) continue;
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      enemy.hit = Math.max(0, enemy.hit - dt * 4);
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      const seesPlayer = dist < enemy.notice && hasLineOfSight(enemy.x, enemy.y, player.x, player.y);
      if (seesPlayer) enemy.alert = 2.8;
      enemy.alert = Math.max(0, enemy.alert - dt);

      if (enemy.alert > 0 && dist > 0.72) {
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        const wiggle = Math.sin(state.time * 2.8 + enemy.id) * 0.25;
        const mx = (nx + -ny * wiggle) * enemy.speed * dt;
        const my = (ny + nx * wiggle) * enemy.speed * dt;
        if (canEnemyStandAt(enemy.x + mx, enemy.y)) enemy.x += mx;
        if (canEnemyStandAt(enemy.x, enemy.y + my)) enemy.y += my;
      }

      if (dist < 0.85 && enemy.cooldown <= 0) {
        hurtPlayer(enemy.attack);
        enemy.cooldown = 1.25;
        enemy.alert = 3;
      }
    }
  }

  function collectNearbyItems() {
    const player = state.player;
    for (const item of state.level.items) {
      if (item.taken) continue;
      const dist = Math.hypot(item.x - player.x, item.y - player.y);
      if (dist > 0.48) continue;
      item.taken = true;
      playSound("pickup", item.type === "health" ? 0.42 : 0.34);
      if (item.type === "card") {
        player.cards = Math.min(2, player.cards + 1);
        setMessage(player.cards === 1 ? "Access card acquired" : "Second access card acquired", 2.4);
        aiComment("card", 3.1, true);
      } else if (item.type === "ammo") {
        player.ammo = Math.min(90, player.ammo + item.amount);
        setMessage("Pulse cells loaded", 1.8);
        aiComment("ammo", 2.7, true);
      } else if (item.type === "health") {
        player.hp = Math.min(100, player.hp + item.amount);
        state.ai.lowHealthWarned = false;
        setMessage("Med kit applied", 1.8);
        aiComment("health", 2.8, true);
      } else if (item.type === "armor") {
        player.armor = Math.min(100, player.armor + item.amount);
        setMessage("Suit battery charged", 1.8);
        aiComment("armor", 2.8, true);
      }
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vz -= dt * 0.9;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function updateCurrentTarget() {
    state.currentTarget = findShootTarget();
    const interact = findInteractable();
    if (interact) {
      if (interact.kind === "door") {
        hud.promptText.textContent = interact.id === "A" ? "USE: SECTOR DOOR" : "USE: BLAST DOOR";
      } else if (interact.kind === "switch") {
        hud.promptText.textContent = state.level.power ? "RELAY ONLINE" : "USE: POWER RELAY";
      } else if (interact.kind === "final") {
        hud.promptText.textContent = "USE: STABILIZE";
      }
    } else if (state.messageTimer > 0) {
      hud.promptText.textContent = state.message;
    } else if (document.pointerLockElement !== canvas) {
      hud.promptText.textContent = "CLICK TO FOCUS";
    } else {
      hud.promptText.textContent = state.currentTarget ? state.currentTarget.name.toUpperCase() : "SYSTEM OK";
    }
  }

  function hurtPlayer(amount) {
    const player = state.player;
    const armorBlock = Math.min(player.armor, Math.ceil(amount * 0.55));
    player.armor -= armorBlock;
    player.hp = Math.max(0, player.hp - (amount - armorBlock));
    player.hurt = 0.35;
    state.shake = 0.38;
    playSound("playerHit", 0.42);
    hud.damageFlash.classList.add("active");
    window.setTimeout(() => hud.damageFlash.classList.remove("active"), 95);
    if (player.hp > 0 && player.hp < 35 && !state.ai.lowHealthWarned) {
      state.ai.lowHealthWarned = true;
      aiComment("lowHealth", 3.1, true);
    }
    if (player.hp <= 0) endGame(false);
  }

  function findShootTarget() {
    const player = state.player;
    let best = null;
    for (const enemy of state.level.enemies) {
      if (enemy.dead) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 9) continue;
      const rel = Math.abs(normalizeAngle(Math.atan2(dy, dx) - player.angle));
      const tolerance = player.weapon === "bar" ? 0.22 : 0.105;
      if (rel > tolerance) continue;
      if (!hasLineOfSight(player.x, player.y, enemy.x, enemy.y)) continue;
      if (!best || dist < best.dist) best = { ...enemy, ref: enemy, dist };
    }
    return best;
  }

  function attack(useMelee = false) {
    if (state.phase !== "playing") {
      startOrLock();
      return;
    }
    const player = state.player;
    if (player.cooldown > 0) return;
    player.weapon = useMelee ? "bar" : player.weapon;

    if (player.weapon === "pistol" && !useMelee) {
      if (player.ammo <= 0) {
        setMessage("Pulse cells empty", 1.4);
        player.cooldown = 0.25;
        return;
      }
      player.ammo -= 1;
      player.cooldown = 0.19;
      player.shootKick = 1;
      state.shake = 0.08;
      playSound("fire", 0.38);
      spawnMuzzleSparks();
      const target = findShootTarget();
      if (target) damageEnemy(target.ref, 30 + Math.random() * 10, "pulse");
      else sparkWall();
    } else {
      player.weapon = "bar";
      player.cooldown = 0.48;
      player.meleeKick = 1;
      state.shake = 0.12;
      playSound("impact", 0.26);
      const target = findShootTarget();
      if (target && target.dist < 1.55) damageEnemy(target.ref, 42 + Math.random() * 12, "bar");
      else sparkWall(0.95);
    }
  }

  function damageEnemy(enemy, amount, kind) {
    enemy.hp -= amount;
    enemy.hit = 1;
    enemy.alert = 3;
    state.message = kind === "pulse" ? "Target hit" : "Impact";
    state.messageTimer = 0.65;
    playSound("enemyHurt", 0.32);
    for (let i = 0; i < 12; i += 1) {
      particles.push({
        x: enemy.x,
        y: enemy.y,
        z: 0.8 + Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        vz: Math.random() * 1.2,
        life: 0.45 + Math.random() * 0.25,
        color: kind === "pulse" ? "#5ee0cf" : "#f0b849"
      });
    }
    if (enemy.hp <= 0) {
      enemy.dead = true;
      playSound("enemyDie", 0.36);
      aiComment("kill", 2.6, true);
      state.message = `${enemy.name} neutralized`;
      state.messageTimer = 1.6;
      if (Math.random() > 0.45) {
        state.level.items.push({
          id: `drop-${enemy.id}`,
          type: Math.random() > 0.45 ? "ammo" : "health",
          label: "Field drop",
          x: enemy.x,
          y: enemy.y,
          color: Math.random() > 0.45 ? "#5ee0cf" : "#ff5c4d",
          scale: 0.38,
          amount: 12,
          taken: false,
          bob: Math.random() * TAU
        });
      }
    }
  }

  function sparkWall(distance = 3) {
    playSound("impact", 0.22);
    const hit = castRay(state.player.angle, distance);
    const x = state.player.x + Math.cos(state.player.angle) * Math.min(hit.distance, distance);
    const y = state.player.y + Math.sin(state.player.angle) * Math.min(hit.distance, distance);
    for (let i = 0; i < 8; i += 1) {
      particles.push({
        x,
        y,
        z: 0.7 + Math.random() * 0.6,
        vx: (Math.random() - 0.5) * 1.1,
        vy: (Math.random() - 0.5) * 1.1,
        vz: Math.random() * 0.8,
        life: 0.28 + Math.random() * 0.22,
        color: "#f0b849"
      });
    }
  }

  function spawnMuzzleSparks() {
    const player = state.player;
    for (let i = 0; i < 5; i += 1) {
      particles.push({
        x: player.x + Math.cos(player.angle) * 0.55,
        y: player.y + Math.sin(player.angle) * 0.55,
        z: 0.75 + Math.random() * 0.22,
        vx: Math.cos(player.angle) * (1.7 + Math.random()) + (Math.random() - 0.5) * 0.5,
        vy: Math.sin(player.angle) * (1.7 + Math.random()) + (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.2) * 0.35,
        life: 0.18 + Math.random() * 0.12,
        color: "#5ee0cf"
      });
    }
  }

  function interact() {
    if (state.phase !== "playing") {
      startOrLock();
      return;
    }
    const found = findInteractable();
    if (!found) {
      setMessage("Nothing in reach", 0.9);
      aiComment("locked", 2.2, false);
      return;
    }
    if (found.kind === "door") {
      if (found.id === "A") {
        if (state.player.cards >= 1) {
          state.level.doors.A.open = true;
          state.level.map[found.y][found.x] = ".";
          playSound("door", 0.48);
          setMessage("Sector door opened", 2);
          aiComment("door", 2.8, true);
        } else {
          setMessage("Access card required", 1.8);
          aiComment("locked", 2.6, true);
        }
      } else if (found.id === "B") {
        if (!state.level.power) {
          setMessage("Relay power offline", 1.8);
          aiComment("locked", 2.6, true);
        } else if (state.player.cards < 2) {
          setMessage("Second access card required", 1.8);
          aiComment("locked", 2.6, true);
        } else {
          state.level.doors.B.open = true;
          state.level.map[found.y][found.x] = ".";
          playSound("door", 0.55);
          setMessage("Blast door released", 2);
          aiComment("door", 2.8, true);
        }
      }
    } else if (found.kind === "switch") {
      if (state.level.power) {
        setMessage("Relay already online", 1.2);
      } else {
        state.level.power = true;
        found.ref.used = true;
        playSound("pickup", 0.46);
        setMessage("Power relay restored", 2.4);
        aiComment("relay", 3.2, true);
        for (let i = 0; i < 28; i += 1) {
          particles.push({
            x: found.ref.x,
            y: found.ref.y,
            z: 0.4 + Math.random() * 1.2,
            vx: (Math.random() - 0.5) * 1.4,
            vy: (Math.random() - 0.5) * 1.4,
            vz: Math.random() * 1.3,
            life: 0.5 + Math.random() * 0.6,
            color: "#8ee36e"
          });
        }
      }
    } else if (found.kind === "final") {
      if (state.level.doors.B.open) {
        endGame(true);
      } else {
        setMessage("Blast door must be open", 1.4);
      }
    }
  }

  function findInteractable() {
    const player = state.player;
    const ray = castRay(player.angle, 1.55);
    if (ray.hit && (ray.tile === "A" || ray.tile === "B")) {
      return { kind: "door", id: ray.tile, x: ray.mapX, y: ray.mapY };
    }

    const checks = [];
    if (state.level.switcher) checks.push({ kind: "switch", ref: state.level.switcher });
    if (state.level.final) checks.push({ kind: "final", ref: state.level.final });
    for (const check of checks) {
      const dx = check.ref.x - player.x;
      const dy = check.ref.y - player.y;
      const dist = Math.hypot(dx, dy);
      const rel = Math.abs(normalizeAngle(Math.atan2(dy, dx) - player.angle));
      if (dist < 1.35 && rel < 0.55 && hasLineOfSight(player.x, player.y, check.ref.x, check.ref.y)) {
        return check;
      }
    }
    return null;
  }

  function endGame(success) {
    state.phase = "ended";
    state.won = success;
    hud.endOverlay.classList.add("active");
    hud.endKicker.textContent = success ? "Run complete" : "Signal lost";
    hud.endTitle.textContent = success ? "Containment restored" : "Containment failed";
    hud.endBody.textContent = success
      ? "The relay holds, the portal collapses, and the lab goes beautifully quiet."
      : "The containment wing took you down before the relay could be stabilized.";
    if (success) playSound("door", 0.45);
    else playSound("enemyDie", 0.36);
    aiComment(success ? "win" : "lose", 4.2, true);
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  }

  function draw() {
    const shakeX = (Math.random() - 0.5) * state.shake * 10;
    const shakeY = (Math.random() - 0.5) * state.shake * 7;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawWorld();
    drawSprites();
    drawParticles();
    drawWeapon();
    ctx.restore();
    drawMiniMap();
  }

  function drawWorld() {
    const horizon = viewHeight * (0.49 + Math.sin(state.player.bob) * 0.006);
    const ceiling = ctx.createLinearGradient(0, 0, 0, horizon);
    ceiling.addColorStop(0, "#071114");
    ceiling.addColorStop(0.54, "#0d1d20");
    ceiling.addColorStop(1, "#16282a");
    ctx.fillStyle = ceiling;
    ctx.fillRect(0, 0, viewWidth, horizon);
    drawSurfacePattern("ceiling", 0, 0, viewWidth, horizon, 0.16);

    const floor = ctx.createLinearGradient(0, horizon, 0, viewHeight);
    floor.addColorStop(0, "#172222");
    floor.addColorStop(0.44, "#101717");
    floor.addColorStop(1, "#070909");
    ctx.fillStyle = floor;
    ctx.fillRect(0, horizon, viewWidth, viewHeight - horizon);
    drawSurfacePattern("floor", 0, horizon, viewWidth, viewHeight - horizon, 0.22);

    drawCeilingLights(horizon);

    depthBuffer.length = viewWidth + RAY_STEP;
    for (let x = 0; x < viewWidth; x += RAY_STEP) {
      const cameraX = (x / viewWidth - 0.5) * 2;
      const rayAngle = state.player.angle + Math.atan(cameraX * Math.tan(FOV / 2));
      const ray = castRay(rayAngle);
      const corrected = ray.distance * Math.cos(rayAngle - state.player.angle);
      const wallHeight = Math.min(viewHeight * 2.4, viewHeight / corrected);
      const top = horizon - wallHeight * 0.52;
      const bottom = top + wallHeight;
      for (let i = 0; i <= RAY_STEP; i += 1) {
        depthBuffer[x + i] = corrected;
      }

      const shade = clamp(1 - corrected / MAX_DEPTH, 0.08, 1);
      const base = wallBase(ray.tile, ray.side, ray.mapX, ray.mapY);
      ctx.fillStyle = shadeColor(base, shade, ray.side);
      ctx.fillRect(x, top, RAY_STEP + 1, wallHeight);
      drawWallTextureColumn(ray, x, top, wallHeight, shade);

      const seam = Math.floor(ray.wallX * 6) === 0;
      if (seam) {
        ctx.fillStyle = `rgba(230, 255, 246, ${0.09 * shade})`;
        ctx.fillRect(x, top, RAY_STEP + 1, wallHeight);
      }

      if (ray.tile === "A" || ray.tile === "B") {
        drawDoorStripe(x, top, wallHeight, shade, ray.tile);
      } else if (Math.floor(ray.wallX * 5) === 2) {
        ctx.fillStyle = `rgba(94, 224, 207, ${0.05 * shade})`;
        ctx.fillRect(x, top + wallHeight * 0.18, RAY_STEP + 1, wallHeight * 0.64);
      }

      const fog = clamp((corrected - 5) / 10, 0, 0.55);
      if (fog > 0) {
        ctx.fillStyle = `rgba(3, 7, 8, ${fog})`;
        ctx.fillRect(x, top, RAY_STEP + 1, wallHeight);
      }
    }

    drawFloorGrid(horizon);
  }

  function drawCeilingLights(horizon) {
    ctx.save();
    ctx.globalAlpha = 0.42;
    for (let i = -2; i < 6; i += 1) {
      const y = horizon * (0.18 + i * 0.13 + (state.time * 0.04) % 0.13);
      const w = viewWidth * (0.18 + i * 0.04);
      const x = viewWidth * 0.5 - w / 2;
      const grad = ctx.createLinearGradient(x, y, x + w, y);
      grad.addColorStop(0, "rgba(94, 224, 207, 0)");
      grad.addColorStop(0.5, "rgba(143, 238, 221, 0.22)");
      grad.addColorStop(1, "rgba(94, 224, 207, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, 2);
    }
    ctx.restore();
  }

  function drawFloorGrid(horizon) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#8aa1a5";
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i += 1) {
      const y = horizon + (viewHeight - horizon) * (i / 12) ** 1.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(viewWidth, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSurfacePattern(name, x, y, width, height, alpha) {
    const image = visualAsset(name);
    if (!image) return;
    if (!assets.patterns[name]) {
      try {
        assets.patterns[name] = ctx.createPattern(image, "repeat");
      } catch (error) {
        return;
      }
    }
    if (!assets.patterns[name]) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = assets.patterns[name];
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }

  function textureForTile(tile) {
    if (tile === "A") return visualAsset("doorA");
    if (tile === "B") return visualAsset("doorB");
    return visualAsset("wall");
  }

  function drawWallTextureColumn(ray, x, top, height, shade) {
    const image = textureForTile(ray.tile);
    if (!image) return;
    const texWidth = image.width || image.naturalWidth || 96;
    const texHeight = image.height || image.naturalHeight || 96;
    const sourceX = Math.floor(clamp(ray.wallX, 0, 0.999) * texWidth);
    ctx.globalAlpha = clamp(0.55 + shade * 0.45, 0.38, 0.98);
    try {
      ctx.drawImage(image, sourceX, 0, 1, texHeight, x, top, RAY_STEP + 1, height);
    } catch (error) {
      ctx.globalAlpha = 1;
      return;
    }
    ctx.globalAlpha = clamp(0.04 + (1 - shade) * 0.58, 0, 0.66);
    ctx.fillStyle = "#020506";
    ctx.fillRect(x, top, RAY_STEP + 1, height);
    ctx.globalAlpha = 1;
  }

  function wallBase(tile, side, x, y) {
    if (tile === "A") return "#59656b";
    if (tile === "B") return "#5a403b";
    const variant = (x * 17 + y * 23 + side * 11) % 5;
    return ["#526a68", "#3d5558", "#596064", "#4b625c", "#455353"][variant];
  }

  function shadeColor(hex, shade, side) {
    const raw = hex.replace("#", "");
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    const sideShade = side ? 0.78 : 1;
    const light = shade * sideShade;
    return `rgb(${Math.floor(r * light)}, ${Math.floor(g * light)}, ${Math.floor(b * light)})`;
  }

  function drawDoorStripe(x, top, height, shade, tile) {
    const stripe = tile === "B" ? "#ff5c4d" : "#f0b849";
    const dark = "rgba(0, 0, 0, 0.38)";
    const stripeHeight = Math.max(10, height * 0.08);
    const offset = ((x + state.time * 18) % (stripeHeight * 2)) - stripeHeight * 2;
    for (let y = top + offset; y < top + height; y += stripeHeight * 2) {
      ctx.fillStyle = stripe;
      ctx.globalAlpha = 0.22 * shade;
      ctx.fillRect(x, y, RAY_STEP + 1, stripeHeight);
      ctx.fillStyle = dark;
      ctx.globalAlpha = 0.24;
      ctx.fillRect(x, y + stripeHeight, RAY_STEP + 1, stripeHeight);
    }
    ctx.globalAlpha = 1;
  }

  function collectSprites() {
    const sprites = [];
    for (const item of state.level.items) {
      if (!item.taken) sprites.push({ kind: "item", ref: item, x: item.x, y: item.y, z: 0.25, scale: item.scale });
    }
    if (state.level.switcher) {
      sprites.push({ kind: "switch", ref: state.level.switcher, x: state.level.switcher.x, y: state.level.switcher.y, z: 0.45, scale: 0.55 });
    }
    if (state.level.final) {
      sprites.push({ kind: "final", ref: state.level.final, x: state.level.final.x, y: state.level.final.y, z: 0.65, scale: 0.95 });
    }
    for (const enemy of state.level.enemies) {
      if (!enemy.dead) sprites.push({ kind: "enemy", ref: enemy, x: enemy.x, y: enemy.y, z: 0.72, scale: enemy.scale });
    }
    sprites.sort((a, b) => distanceToPlayer(b) - distanceToPlayer(a));
    return sprites;
  }

  function distanceToPlayer(sprite) {
    return Math.hypot(sprite.x - state.player.x, sprite.y - state.player.y);
  }

  function projectSprite(sprite) {
    const dx = sprite.x - state.player.x;
    const dy = sprite.y - state.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.1) return null;
    const angleTo = Math.atan2(dy, dx);
    const rel = normalizeAngle(angleTo - state.player.angle);
    if (Math.abs(rel) > FOV * 0.72) return null;
    const screenX = viewWidth * 0.5 + Math.tan(rel) * (viewWidth * 0.5 / Math.tan(FOV * 0.5));
    const size = (viewHeight / dist) * sprite.scale;
    const bob = sprite.kind === "item" || sprite.kind === "switch" ? Math.sin(state.time * 3 + (sprite.ref.bob || 0)) * size * 0.05 : 0;
    const bottom = viewHeight * 0.5 + size * 0.52 - sprite.z * size * 0.1 + bob;
    const ix = Math.floor(clamp(screenX, 0, viewWidth - 1));
    if (dist > (depthBuffer[ix] || MAX_DEPTH) + 0.2) return null;
    return { x: screenX, y: bottom, size, dist, rel };
  }

  function drawSprites() {
    for (const sprite of collectSprites()) {
      const p = projectSprite(sprite);
      if (!p) continue;
      if (sprite.kind === "enemy") drawEnemy(sprite.ref, p);
      else if (sprite.kind === "item") drawItem(sprite.ref, p);
      else if (sprite.kind === "switch") drawSwitch(sprite.ref, p);
      else if (sprite.kind === "final") drawFinal(sprite.ref, p);
    }
  }

  function drawEnemy(enemy, p) {
    if (drawEnemySpriteImage(enemy, p)) return;
    const size = p.size;
    const x = p.x;
    const bottom = p.y;
    const hitGlow = enemy.hit > 0 ? enemy.hit : 0;
    ctx.save();
    ctx.translate(x, bottom);
    ctx.globalAlpha = clamp(1 - p.dist / 15, 0.25, 1);

    ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
    ctx.beginPath();
    ctx.ellipse(0, size * 0.08, size * 0.28, size * 0.07, 0, 0, TAU);
    ctx.fill();

    const glow = ctx.createRadialGradient(0, -size * 0.42, size * 0.04, 0, -size * 0.42, size * 0.7);
    glow.addColorStop(0, hitGlow ? "#ffffff" : enemy.core);
    glow.addColorStop(0.24, enemy.color);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -size * 0.42, size * 0.52, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = hitGlow ? "#ffffff" : enemy.color;
    ctx.lineWidth = Math.max(2, size * 0.035);
    ctx.lineCap = "round";
    for (let i = -2; i <= 2; i += 1) {
      const side = i / 2;
      ctx.beginPath();
      ctx.moveTo(side * size * 0.16, -size * 0.24);
      ctx.quadraticCurveTo(side * size * 0.36, -size * 0.02, side * size * 0.52, size * 0.06);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(4, 10, 11, 0.82)";
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.42, size * 0.28, size * 0.34, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = hitGlow ? "#ffffff" : enemy.core;
    ctx.beginPath();
    ctx.ellipse(-size * 0.08, -size * 0.47, size * 0.055, size * 0.035, 0, 0, TAU);
    ctx.ellipse(size * 0.08, -size * 0.47, size * 0.055, size * 0.035, 0, 0, TAU);
    ctx.fill();

    if (enemy.hp < enemy.maxHp) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillRect(-size * 0.32, -size * 0.95, size * 0.64, 5);
      ctx.fillStyle = enemy.hp / enemy.maxHp < 0.35 ? "#ff5c4d" : "#8ee36e";
      ctx.fillRect(-size * 0.32, -size * 0.95, size * 0.64 * clamp(enemy.hp / enemy.maxHp, 0, 1), 5);
    }

    ctx.restore();
  }

  function drawEnemySpriteImage(enemy, p) {
    const image = visualAsset(enemy.sprite);
    if (!image) return false;
    const size = p.size;
    const width = size * 0.92;
    const height = size * 1.18;
    const hitGlow = enemy.hit > 0 ? enemy.hit : 0;
    ctx.save();
    ctx.globalAlpha = clamp(1 - p.dist / 15, 0.28, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + size * 0.08, size * 0.28, size * 0.07, 0, 0, TAU);
    ctx.fill();

    if (hitGlow > 0) {
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 18 * hitGlow;
    } else {
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 11;
    }
    ctx.drawImage(image, p.x - width * 0.5, p.y - height, width, height);
    ctx.shadowBlur = 0;
    if (hitGlow > 0) {
      ctx.globalAlpha = hitGlow * 0.38;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(p.x - width * 0.5, p.y - height, width, height);
    }
    ctx.globalAlpha = 1;
    if (enemy.hp < enemy.maxHp) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
      ctx.fillRect(p.x - size * 0.32, p.y - height - 8, size * 0.64, 5);
      ctx.fillStyle = enemy.hp / enemy.maxHp < 0.35 ? "#ff5c4d" : "#8ee36e";
      ctx.fillRect(p.x - size * 0.32, p.y - height - 8, size * 0.64 * clamp(enemy.hp / enemy.maxHp, 0, 1), 5);
    }
    ctx.restore();
    return true;
  }

  function drawItem(item, p) {
    const size = p.size;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = clamp(1 - p.dist / 15, 0.35, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.beginPath();
    ctx.ellipse(0, size * 0.09, size * 0.42, size * 0.11, 0, 0, TAU);
    ctx.fill();

    const glow = ctx.createRadialGradient(0, -size * 0.32, 1, 0, -size * 0.32, size * 0.75);
    glow.addColorStop(0, item.color);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -size * 0.35, size * 0.56, 0, TAU);
    ctx.fill();

    ctx.fillStyle = item.color;
    if (item.type === "card") {
      roundRect(ctx, -size * 0.34, -size * 0.56, size * 0.68, size * 0.42, size * 0.06);
      ctx.fill();
      ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
      ctx.fillRect(-size * 0.24, -size * 0.44, size * 0.48, size * 0.04);
    } else if (item.type === "health") {
      roundRect(ctx, -size * 0.3, -size * 0.64, size * 0.6, size * 0.48, size * 0.08);
      ctx.fill();
      ctx.fillStyle = "#f8fff7";
      ctx.fillRect(-size * 0.06, -size * 0.58, size * 0.12, size * 0.36);
      ctx.fillRect(-size * 0.18, -size * 0.46, size * 0.36, size * 0.12);
    } else {
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.42, size * 0.24, size * 0.36, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.36)";
      ctx.fillRect(-size * 0.18, -size * 0.47, size * 0.36, size * 0.06);
    }
    ctx.restore();
  }

  function drawSwitch(ref, p) {
    const size = p.size;
    ctx.save();
    ctx.translate(p.x, p.y);
    const active = state.level.power;
    ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
    ctx.beginPath();
    ctx.ellipse(0, size * 0.12, size * 0.38, size * 0.08, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = active ? "#8ee36e" : "#f0b849";
    roundRect(ctx, -size * 0.32, -size * 0.68, size * 0.64, size * 0.72, size * 0.08);
    ctx.fill();
    ctx.fillStyle = "#0b1716";
    ctx.fillRect(-size * 0.22, -size * 0.5, size * 0.44, size * 0.08);
    ctx.fillStyle = active ? "#e8ffe2" : "#2a1607";
    ctx.beginPath();
    ctx.arc(0, -size * 0.23, size * 0.12, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawFinal(ref, p) {
    const size = p.size;
    ctx.save();
    ctx.translate(p.x, p.y - size * 0.35);
    ctx.rotate(state.time * 0.35);
    const glow = ctx.createRadialGradient(0, 0, size * 0.08, 0, 0, size * 0.8);
    glow.addColorStop(0, "#eafff9");
    glow.addColorStop(0.28, "#5ee0cf");
    glow.addColorStop(0.68, "rgba(94, 224, 207, 0.28)");
    glow.addColorStop(1, "rgba(94, 224, 207, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.78, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#f0b849";
    ctx.lineWidth = Math.max(2, size * 0.04);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.36, size * 0.58, 0.7, 0, TAU);
    ctx.ellipse(0, 0, size * 0.36, size * 0.58, -0.7, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of particles) {
      const p = projectSprite({ x: particle.x, y: particle.y, z: particle.z, scale: 0.08, kind: "particle", ref: particle });
      if (!p) continue;
      ctx.save();
      ctx.globalAlpha = clamp(particle.life * 2.5, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y - p.size * 0.45, Math.max(2, p.size * 0.15), 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawWeapon() {
    if (drawWeaponSprite()) return;
    const player = state.player;
    const bob = Math.sin(player.bob) * 7;
    const kick = player.shootKick;
    const melee = player.meleeKick;
    ctx.save();
    ctx.translate(viewWidth * 0.5, viewHeight);

    if (player.weapon === "bar" || melee > 0) {
      const swing = melee * 44;
      ctx.translate(swing, -melee * 35);
      ctx.rotate(-0.48 - melee * 0.8);
      ctx.lineCap = "round";
      ctx.strokeStyle = "#252b2d";
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(92, -12 + bob);
      ctx.lineTo(190, -190 + bob);
      ctx.stroke();
      ctx.strokeStyle = "#9fa9a6";
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(94, -16 + bob);
      ctx.lineTo(188, -190 + bob);
      ctx.stroke();
      ctx.strokeStyle = "#923b36";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(175, -186 + bob);
      ctx.quadraticCurveTo(215, -215 + bob, 236, -174 + bob);
      ctx.stroke();
    } else {
      ctx.translate(kick * -9, kick * 18 + bob);
      ctx.fillStyle = "#1a2326";
      roundRect(ctx, 42, -96, 148, 70, 8);
      ctx.fill();
      ctx.fillStyle = "#314246";
      roundRect(ctx, 76, -140, 88, 48, 7);
      ctx.fill();
      ctx.fillStyle = "#5ee0cf";
      ctx.fillRect(112, -132, 20, 30);
      ctx.fillStyle = "#0d1315";
      roundRect(ctx, 124, -72, 92, 30, 6);
      ctx.fill();
      ctx.fillStyle = "#202a2c";
      roundRect(ctx, -20, -54, 118, 58, 10);
      ctx.fill();
      if (kick > 0.4) {
        const flash = ctx.createRadialGradient(222, -58, 5, 222, -58, 72);
        flash.addColorStop(0, "#ffffff");
        flash.addColorStop(0.34, "#5ee0cf");
        flash.addColorStop(1, "rgba(94, 224, 207, 0)");
        ctx.fillStyle = flash;
        ctx.beginPath();
        ctx.arc(222, -58, 72 * kick, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawWeaponSprite() {
    const player = state.player;
    const bob = Math.sin(player.bob) * 7;
    const kick = player.shootKick;
    const melee = player.meleeKick;
    const weaponImage = player.weapon === "bar" || melee > 0 ? visualAsset("bar") : visualAsset("pistol");
    if (!weaponImage) return false;

    ctx.save();
    if (player.weapon === "bar" || melee > 0) {
      const size = Math.min(viewWidth * 0.42, viewHeight * 0.62);
      ctx.translate(viewWidth * 0.63 + melee * 44, viewHeight - size * 0.08 - melee * 28 + bob);
      ctx.rotate(-0.2 - melee * 0.85);
      ctx.drawImage(weaponImage, -size * 0.42, -size, size * 0.84, size);
    } else {
      const width = Math.min(viewWidth * 0.44, 330);
      const height = width * 0.56;
      const x = viewWidth * 0.5 - width * 0.15 - kick * 10;
      const y = viewHeight - height + 13 + kick * 20 + bob;
      ctx.drawImage(weaponImage, x, y, width, height);
      if (kick > 0.4) {
        const flashX = x + width * 0.94;
        const flashY = y + height * 0.42;
        const flash = ctx.createRadialGradient(flashX, flashY, 4, flashX, flashY, 72);
        flash.addColorStop(0, "#ffffff");
        flash.addColorStop(0.32, "#5ee0cf");
        flash.addColorStop(1, "rgba(94, 224, 207, 0)");
        ctx.fillStyle = flash;
        ctx.beginPath();
        ctx.arc(flashX, flashY, 70 * kick, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
    return true;
  }

  function drawMiniMap() {
    if (!state.level) return;
    const rect = miniCanvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    miniCtx.clearRect(0, 0, size, size);
    miniCtx.fillStyle = "rgba(2, 7, 8, 0.86)";
    roundRect(miniCtx, 0, 0, size, size, 8);
    miniCtx.fill();

    const scale = size / Math.max(state.level.width, state.level.height);
    const ox = (size - state.level.width * scale) * 0.5;
    const oy = (size - state.level.height * scale) * 0.5;
    for (let y = 0; y < state.level.height; y += 1) {
      for (let x = 0; x < state.level.width; x += 1) {
        const tile = state.level.map[y][x];
        if (isSolidTile(tile)) {
          miniCtx.fillStyle = tile === "#" ? "rgba(138, 161, 165, 0.35)" : "rgba(240, 184, 73, 0.7)";
          miniCtx.fillRect(ox + x * scale, oy + y * scale, Math.ceil(scale), Math.ceil(scale));
        }
      }
    }

    miniCtx.fillStyle = "#5ee0cf";
    for (const item of state.level.items) {
      if (!item.taken) miniCtx.fillRect(ox + item.x * scale - 1, oy + item.y * scale - 1, 2, 2);
    }
    miniCtx.fillStyle = "#ff5c4d";
    for (const enemy of state.level.enemies) {
      if (!enemy.dead) miniCtx.fillRect(ox + enemy.x * scale - 1.5, oy + enemy.y * scale - 1.5, 3, 3);
    }

    const px = ox + state.player.x * scale;
    const py = oy + state.player.y * scale;
    miniCtx.save();
    miniCtx.translate(px, py);
    miniCtx.rotate(state.player.angle);
    miniCtx.fillStyle = "#e9f4ed";
    miniCtx.beginPath();
    miniCtx.moveTo(5, 0);
    miniCtx.lineTo(-4, -3);
    miniCtx.lineTo(-3, 3);
    miniCtx.closePath();
    miniCtx.fill();
    miniCtx.restore();
  }

  function roundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function updateHud() {
    if (!state.level) return;
    const player = state.player;
    hud.hpText.textContent = Math.ceil(player.hp);
    hud.armorText.textContent = Math.ceil(player.armor);
    hud.ammoText.textContent = player.weapon === "pistol" ? player.ammo : "--";
    hud.cardText.textContent = `${player.cards}/2`;
    hud.hpFill.style.width = `${clamp(player.hp, 0, 100)}%`;
    hud.armorFill.style.width = `${clamp(player.armor, 0, 100)}%`;
    hud.weaponText.textContent = player.weapon === "pistol" ? "PULSE" : "BAR";
    hud.objectiveText.textContent = objectiveText();
    hud.sectorText.textContent = sectorName();
  }

  function objectiveText() {
    const level = state.level;
    if (state.phase === "ended") return state.won ? "Containment restored." : "Signal lost.";
    if (state.player.cards < 1) return "Locate access card.";
    if (!level.doors.A.open) return "Open sector seal.";
    if (!level.power) return "Restore relay power.";
    if (state.player.cards < 2) return "Recover second card.";
    if (!level.doors.B.open) return "Release blast lock.";
    return "Stabilize core.";
  }

  function sectorName() {
    const y = state.player.y;
    if (y < 3) return "SECTOR A-17";
    if (y < 5) return "TEST CHAMBER";
    if (y < 7) return "RELAY SPINE";
    return "CORE ACCESS";
  }

  function startOrLock() {
    if (state.phase === "menu") {
      resetGame();
      requestPointerLock();
      return;
    }
    if (state.phase === "playing") requestPointerLock();
  }

  function requestPointerLock() {
    if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
      canvas.requestPointerLock();
    }
  }

  function cycleWeapon(toWeapon) {
    if (state.phase !== "playing") return;
    state.player.weapon = toWeapon;
    setMessage(toWeapon === "pistol" ? "Pulse pistol ready" : "Metal bar ready", 0.85);
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);

  window.addEventListener("keydown", (event) => {
    keys[event.code] = true;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
    if (event.code === "Digit1") cycleWeapon("bar");
    if (event.code === "Digit2") cycleWeapon("pistol");
    if (event.code === "KeyE" || event.code === "KeyF") interact();
    if (event.code === "Space") attack(false);
    if (event.code === "KeyV") attack(true);
    if (event.code === "Escape" && state.phase === "playing") setMessage("Paused by browser focus", 1.2);
  });

  window.addEventListener("keyup", (event) => {
    keys[event.code] = false;
  });

  document.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement === canvas && state.phase === "playing") {
      state.player.angle = normalizeAngle(state.player.angle + event.movementX * 0.0022);
    }
  });

  canvas.addEventListener("mousedown", (event) => {
    event.preventDefault();
    if (document.pointerLockElement !== canvas || state.phase !== "playing") {
      startOrLock();
      return;
    }
    if (event.button === 2) attack(true);
    else attack(false);
  });

  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener("click", () => {
    if (document.pointerLockElement !== canvas) startOrLock();
  });

  hud.startBtn.addEventListener("click", () => {
    resetGame();
    requestPointerLock();
  });
  hud.restartBtn.addEventListener("click", () => {
    resetGame();
    requestPointerLock();
  });
  hud.audioBtn.addEventListener("click", () => {
    toggleAudio();
  });

  document.querySelectorAll("[data-hold]").forEach((button) => {
    const code = button.getAttribute("data-hold");
    const set = (value) => {
      virtualKeys[code] = value;
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      set(true);
    });
    button.addEventListener("pointerup", () => set(false));
    button.addEventListener("pointercancel", () => set(false));
    button.addEventListener("pointerleave", () => set(false));
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    const action = button.getAttribute("data-action");
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (action === "attack") {
        cycleWeapon("pistol");
        attack(false);
      } else if (action === "melee") {
        attack(true);
      } else if (action === "interact") {
        interact();
      }
    });
  });

  initAssets();
  state.level = createLevel();
  state.player.x = state.level.start.x;
  state.player.y = state.level.start.y;
  resize();
  updateHud();
  requestAnimationFrame(loop);
})();
