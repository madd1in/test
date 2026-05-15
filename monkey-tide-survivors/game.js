"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { alpha: false });

const ui = {
  startOverlay: document.getElementById("startOverlay"),
  upgradeOverlay: document.getElementById("upgradeOverlay"),
  endOverlay: document.getElementById("endOverlay"),
  hud: document.getElementById("hud"),
  loadout: document.getElementById("loadout"),
  cornerControls: document.getElementById("cornerControls"),
  touchControls: document.getElementById("touchControls"),
  startButton: document.getElementById("startButton"),
  quickButton: document.getElementById("quickButton"),
  restartButton: document.getElementById("restartButton"),
  pauseButton: document.getElementById("pauseButton"),
  audioButton: document.getElementById("audioButton"),
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
  topdownBeach: "assets/backgrounds/topdown_beach_imagen_hd.png",
  beach: "assets/backgrounds/beach_imagen_hd.png",
  jungle: "assets/backgrounds/jungle_imagen_hd.png",
  characters: "assets/sprites/characters_imagen_hd_sheet.png",
  items: "assets/sprites/scene_items_imagen_hd_sheet.png",
  newSprites: "assets/sprites/new_sprites_imagen_hd.png",
};

const audioSources = {
  bgmMain: "assets/audio/bgm/shoreline-rum-riddle.mp3",
  bgmRush: "assets/audio/bgm/coconut-caper-loop.mp3",
  pickup: "assets/audio/sfx/pickup.wav",
  chime: "assets/audio/sfx/chime.wav",
  gate: "assets/audio/sfx/gate.wav",
  confirm: "assets/audio/sfx/ui_confirm.wav",
};

const images = {};
const soundPools = {};
let music = null;
let rushMusic = null;
let muted = false;
let ready = false;
let dpr = 1;
let viewW = 1280;
let viewH = 720;
let lastTime = 0;
let raf = 0;
let quickMode = false;

const CHAR = { w: 192, h: 256, cols: 16 };
const ITEM = { w: 512, h: 512, cols: 4 };
const NEWSPRITE = { w: 384, h: 512, cols: 4, rows: 2 };
const WORLD = { w: 6400, h: 6400 };
const TARGET_TIME = 330;

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

const enemyTypes = [
  { id: "deckhand", name: "Deckhand Echo", row: 7, hp: 24, speed: 82, radius: 22, damage: 9, scale: 0.44, xp: 4, tint: "#f0c45d" },
  { id: "crab", name: "Coconut Crab", sprite: "crab", hp: 30, speed: 118, radius: 20, damage: 8, scale: 0.18, xp: 5, tint: "#ff8b46" },
  { id: "cook", name: "Grog Cook", row: 8, hp: 46, speed: 62, radius: 26, damage: 13, scale: 0.45, xp: 7, tint: "#ff765f" },
  { id: "hand", name: "Seafoam Hand", sprite: "seaHand", hp: 58, speed: 88, radius: 25, damage: 16, scale: 0.18, xp: 9, tint: "#79e0d8" },
  { id: "oracle", name: "Shell Oracle", row: 9, hp: 72, speed: 54, radius: 28, damage: 18, scale: 0.47, xp: 12, tint: "#79e0b7" },
  { id: "idol", name: "Monkey Idol", sprite: "monkeyIdol", hp: 260, speed: 42, radius: 46, damage: 28, scale: 0.24, xp: 38, tint: "#d07cff" },
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
    icon: "banana",
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
    icon: "rope",
    desc: "Ein rotierender Schutzkreis aus Tauwerk.",
    max: 5,
    apply: () => raiseWeapon("rope"),
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

let state = null;
const keys = new Set();
const pointer = { active: false, id: null, dx: 0, dy: 0, originX: 0, originY: 0, radius: 48 };

function makeState() {
  return {
    phase: "menu",
    elapsed: 0,
    spawnTimer: 0,
    bossTimer: 0,
    warningTimer: 0,
    wave: 1,
    killCount: 0,
    coins: 0,
    level: 1,
    xp: 0,
    nextXp: 28,
    camera: { x: WORLD.w / 2, y: WORLD.h / 2 },
    player: {
      x: WORLD.w / 2,
      y: WORLD.h / 2,
      r: 24,
      hp: 110,
      maxHp: 110,
      invuln: 0,
      dash: 0,
      dashCooldown: 0,
      facing: 1,
      moveX: 0,
      moveY: 0,
    },
    stats: {
      speed: 224,
      damage: 1,
      armor: 0,
      magnet: 138,
      pickupValue: 1,
      dashCooldown: 0.82,
    },
    weapons: {
      cutlass: { level: 1, timer: 0 },
      coconut: { level: 0, timer: 0 },
      compass: { level: 0, timer: 0, angle: 0, hits: new Map() },
      bottle: { level: 0, timer: 0 },
      rope: { level: 0, angle: 0, tick: 0 },
    },
    upgradeCounts: {
      cutlass: 1,
      coconut: 0,
      compass: 0,
      bottle: 0,
      rope: 0,
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
    props: makeProps(),
  };
}

function makeProps() {
  const props = [];
  const choices = ["rope", "map", "compass", "rumBomb", "telescope", "skullCoin", "key", "speedCharm"];
  for (let gx = 320; gx < WORLD.w - 320; gx += 520) {
    for (let gy = 320; gy < WORLD.h - 320; gy += 470) {
      const h = hash2(Math.floor(gx / 50), Math.floor(gy / 50));
      if (h % 13 < 4) {
        props.push({
          x: gx + ((h >> 4) % 240) - 120,
          y: gy + ((h >> 10) % 220) - 110,
          icon: choices[h % choices.length],
          scale: newSpriteMap[choices[h % choices.length]] ? 0.15 + (h % 5) * 0.012 : 0.18 + (h % 5) * 0.014,
          spin: ((h >> 8) % 100) / 100,
        });
      }
    }
  }
  return props;
}

function loadImage(key, src, index, total) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      images[key] = img;
      ui.loadingBar.style.width = `${Math.round(((index + 1) / total) * 100)}%`;
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
      audio.volume = key === "gate" ? 0.25 : 0.42;
      return audio;
    });
  }
  music = new Audio(audioSources.bgmMain);
  music.loop = true;
  music.volume = 0.36;
  rushMusic = new Audio(audioSources.bgmRush);
  rushMusic.loop = true;
  rushMusic.volume = 0;
}

async function boot() {
  state = makeState();
  resize();
  const entries = Object.entries(imageSources);
  await Promise.all(entries.map(([key, src], index) => loadImage(key, src, index, entries.length)));
  prepareAudio();
  ready = true;
  window.__MONKEY_TIDE_READY = true;
  ui.loadingText.textContent = "Bereit fuer die Flut";
  ui.startButton.disabled = false;
  ui.quickButton.disabled = false;
  render();
}

function playSound(key) {
  if (muted || !soundPools[key]) return;
  const pool = soundPools[key];
  const clip = pool.find((a) => a.paused || a.ended) || pool[0];
  try {
    clip.currentTime = 0;
    clip.play().catch(() => {});
  } catch {}
}

function syncMusic() {
  if (!music || !rushMusic) return;
  music.muted = muted;
  rushMusic.muted = muted;
  const rush = state.phase === "playing" ? clamp((state.elapsed - 210) / 120, 0, 1) : 0;
  music.volume = muted ? 0 : 0.36 * (1 - rush * 0.72);
  rushMusic.volume = muted ? 0 : 0.24 * rush;
  if (state.phase === "playing") {
    music.play().catch(() => {});
    rushMusic.play().catch(() => {});
  }
}

function startGame(options = {}) {
  if (!ready) return;
  quickMode = options.quick === true;
  state = makeState();
  state.phase = "playing";
  if (quickMode) {
    state.elapsed = 135;
    raiseWeapon("coconut");
    raiseWeapon("compass");
    state.level = 4;
    state.nextXp = 76;
  }
  ui.startOverlay.hidden = true;
  ui.endOverlay.hidden = true;
  ui.upgradeOverlay.hidden = true;
  ui.hud.hidden = false;
  ui.loadout.hidden = false;
  ui.cornerControls.hidden = false;
  ui.touchControls.hidden = false;
  playSound("confirm");
  syncMusic();
  lastTime = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
}

function endGame(victory) {
  state.phase = victory ? "victory" : "gameover";
  ui.endEyebrow.textContent = victory ? "Flut gebrochen" : "Vertrag beendet";
  ui.endTitle.textContent = victory ? "Strand gehalten" : "Die Geistercrew war schneller";
  ui.endStats.textContent = `${formatTime(state.elapsed)} - ${state.killCount} Gegner - ${state.coins} Dublonen - Level ${state.level}`;
  ui.endOverlay.hidden = false;
  playSound(victory ? "chime" : "gate");
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
  state.warningTimer = Math.max(0, state.warningTimer - dt);
  updatePlayer(dt);
  updateWeapons(dt);
  updateSpawns(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  updateGems(dt);
  updateParticles(dt);
  updateDom();
  syncMusic();
  if (state.elapsed >= TARGET_TIME && !state.enemies.some((e) => e.type.id === "idol")) {
    endGame(true);
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
  const dashBoost = p.dash > 0 ? 2.7 : 1;
  p.x = clamp(p.x + input.x * state.stats.speed * dashBoost * dt, 90, WORLD.w - 90);
  p.y = clamp(p.y + input.y * state.stats.speed * dashBoost * dt, 90, WORLD.h - 90);
  state.camera.x += (p.x - state.camera.x) * Math.min(1, dt * 7.5);
  state.camera.y += (p.y - state.camera.y) * Math.min(1, dt * 7.5);
}

function dash() {
  if (state.phase !== "playing") return;
  const p = state.player;
  if (p.dashCooldown > 0) return;
  p.dash = 0.16;
  p.dashCooldown = state.stats.dashCooldown;
  p.invuln = Math.max(p.invuln, 0.22);
  playSound("gate");
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
    const cooldown = Math.max(0.28, 0.68 - lvl * 0.045);
    w.cutlass.timer = cooldown;
    const direction = Math.atan2(p.moveY || 0.15, p.moveX || p.facing);
    slash(direction, 104 + lvl * 16, 38 + lvl * 7, 24 + lvl * 9);
  }
  if (w.coconut.level > 0) {
    w.coconut.timer -= dt;
    if (w.coconut.timer <= 0) {
      w.coconut.timer = Math.max(0.26, 0.92 - w.coconut.level * 0.075);
      fireCoconut(w.coconut.level);
    }
  }
  if (w.compass.level > 0) {
    w.compass.angle += dt * (1.55 + w.compass.level * 0.1);
    w.compass.timer -= dt;
    updateCompassDamage(dt);
    if (w.compass.timer <= 0) {
      w.compass.timer = Math.max(0.42, 1.4 - w.compass.level * 0.12);
      fireCompassBeam(w.compass.level);
    }
  }
  if (w.bottle.level > 0) {
    w.bottle.timer -= dt;
    if (w.bottle.timer <= 0) {
      w.bottle.timer = Math.max(0.72, 2.18 - w.bottle.level * 0.18);
      throwBottle(w.bottle.level);
    }
  }
  if (w.rope.level > 0) {
    w.rope.angle += dt * 2.2;
    w.rope.tick -= dt;
    if (w.rope.tick <= 0) {
      w.rope.tick = 0.24;
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
    icon: level >= 3 ? "banana" : "lime",
    x: p.x + Math.cos(angle) * 32,
    y: p.y + Math.sin(angle) * 32,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: 17,
    damage: 20 + level * 8,
    life: 3.15,
    pierce: 3 + Math.floor(level / 2),
    spin: 0,
  });
}

function fireCompassBeam(level) {
  const target = nearestEnemy();
  if (!target) return;
  const p = state.player;
  const damage = 16 + level * 8;
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
    damage: 22 + level * 10,
    radius: 92 + level * 11,
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
        hurtEnemy(enemy, 12 + level * 5, Math.sign(enemy.x - point.x), Math.sign(enemy.y - point.y));
        hits.set(enemy.id, 0.38);
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
      hurtEnemy(enemy, 10 + level * 5, (enemy.x - p.x) / dist, (enemy.y - p.y) / dist);
    }
  }
}

function updateSpawns(dt) {
  state.spawnTimer -= dt;
  state.bossTimer -= dt;
  const intensity = quickMode ? 1.38 : 1.12;
  const interval = Math.max(0.15, (0.74 - state.elapsed * 0.00145) / intensity);
  if (state.spawnTimer <= 0) {
    state.spawnTimer = interval;
    const count = 1 + Math.floor(state.elapsed / 68) + (Math.random() < 0.26 ? 1 : 0);
    for (let i = 0; i < count; i += 1) spawnEnemy(pickEnemyType());
  }
  if (state.elapsed > 205 && state.bossTimer <= 0) {
    state.bossTimer = 80;
    spawnEnemy(enemyTypes.find((type) => type.id === "idol"), true);
    state.warningTimer = 3.2;
  }
}

function pickEnemyType() {
  const t = state.elapsed;
  const roll = Math.random();
  if (t > 235 && roll < 0.16) return enemyTypes[4];
  if (t > 150 && roll < 0.28) return enemyTypes[3];
  if (t > 80 && roll < 0.42) return enemyTypes[2];
  if (t > 20 && roll < 0.62) return enemyTypes[1];
  return enemyTypes[0];
}

function spawnEnemy(type, boss = false) {
  if (state.enemies.length > 260 && !boss) return;
  const p = state.player;
  const side = Math.floor(Math.random() * 4);
  const margin = boss ? 460 : 620;
  let x = p.x;
  let y = p.y;
  if (side === 0) {
    x -= viewW / 2 + margin;
    y += (Math.random() - 0.5) * (viewH + margin);
  } else if (side === 1) {
    x += viewW / 2 + margin;
    y += (Math.random() - 0.5) * (viewH + margin);
  } else if (side === 2) {
    x += (Math.random() - 0.5) * (viewW + margin);
    y -= viewH / 2 + margin;
  } else {
    x += (Math.random() - 0.5) * (viewW + margin);
    y += viewH / 2 + margin;
  }
  const scaledHp = type.hp * (1 + state.elapsed / 310) * (boss ? 2.8 : 1);
  state.enemies.push({
    id: cryptoId(),
    type,
    x: clamp(x, 80, WORLD.w - 80),
    y: clamp(y, 80, WORLD.h - 80),
    hp: scaledHp,
    maxHp: scaledHp,
    r: type.radius * (boss ? 1.25 : 1),
    speed: type.speed * (1 + state.elapsed / 900),
    damage: type.damage,
    row: type.row,
    frameOffset: Math.floor(Math.random() * 16),
    hit: 0,
    boss,
  });
}

function updateEnemies(dt) {
  const p = state.player;
  for (const enemy of state.enemies) {
    enemy.hit = Math.max(0, enemy.hit - dt);
    const dx = p.x - enemy.x;
    const dy = p.y - enemy.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    enemy.x += (dx / dist) * enemy.speed * dt;
    enemy.y += (dy / dist) * enemy.speed * dt;
    if (dist < p.r + enemy.r && p.invuln <= 0) {
      const damage = Math.max(2, enemy.damage - state.stats.armor);
      p.hp -= damage;
      p.invuln = 0.68;
      p.x -= (dx / dist) * 18;
      p.y -= (dy / dist) * 18;
      shake(0.8);
      floatingText(`-${Math.round(damage)}`, p.x, p.y - 58, "#ff765f");
      playSound("gate");
      if (p.hp <= 0) endGame(false);
    }
  }
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
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
    const range = state.stats.magnet + (gem.kind === "coin" ? 55 : 0);
    if (dist < range) {
      const pull = (1 - dist / range) * 740 + 170;
      gem.x += (dx / Math.max(1, dist)) * pull * dt;
      gem.y += (dy / Math.max(1, dist)) * pull * dt;
    }
    if (dist < p.r + gem.r) collectGem(gem);
  }
  state.gems = state.gems.filter((gem) => !gem.collected && gem.life > 0);
}

function collectGem(gem) {
  gem.collected = true;
  if (gem.kind === "heart") {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 28);
    floatingText("+HP", state.player.x, state.player.y - 72, "#79e0b7");
  } else if (gem.kind === "coin") {
    state.coins += gem.value;
    floatingText(`+${gem.value}`, gem.x, gem.y - 18, "#f0c45d");
  } else {
    state.xp += Math.ceil(gem.value * state.stats.pickupValue);
    while (state.xp >= state.nextXp && state.phase === "playing") {
      state.xp -= state.nextXp;
      levelUp();
    }
  }
  playSound("pickup");
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
  enemy.hp -= amount;
  enemy.hit = 0.14;
  enemy.x += clamp(nx, -1, 1) * 7;
  enemy.y += clamp(ny, -1, 1) * 7;
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
  const xp = Math.ceil(enemy.type.xp * (enemy.boss ? 3.5 : 1) * (1 + state.elapsed / 900));
  state.gems.push({ kind: "xp", icon: "skullCoin", x: enemy.x, y: enemy.y, r: 12, value: xp, life: 34 });
  if (Math.random() < 0.1 || enemy.boss) state.gems.push({ kind: "coin", icon: "coin", x: enemy.x + 12, y: enemy.y + 8, r: 12, value: enemy.boss ? 25 : 3, life: 36 });
  if (Math.random() < 0.025) state.gems.push({ kind: "heart", icon: "lime", x: enemy.x - 10, y: enemy.y, r: 13, value: 1, life: 28 });
  if (enemy.boss) {
    state.warningTimer = 2;
    floatingText("Idol gebrochen", enemy.x, enemy.y - 80, "#fff2c7");
  }
  playSound("pickup");
}

function levelUp() {
  state.level += 1;
  state.nextXp = Math.round(28 + state.level * 18 + state.level * state.level * 1.8);
  state.phase = "levelup";
  playSound("chime");
  showUpgrades();
}

function showUpgrades() {
  ui.upgradeChoices.innerHTML = "";
  const choices = chooseUpgrades();
  for (const upgrade of choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "upgrade-card";
    button.innerHTML = `
      <span class="upgrade-icon" style="${iconStyle(upgrade.icon)}"></span>
      <span class="upgrade-name">${upgrade.name}</span>
      <span class="upgrade-desc">${upgrade.desc}</span>
    `;
    button.addEventListener("click", () => {
      upgrade.apply();
      state.upgradeCounts[upgrade.id] = (state.upgradeCounts[upgrade.id] || 0) + 1;
      state.phase = "playing";
      ui.upgradeOverlay.hidden = true;
      playSound("confirm");
      updateDom();
    });
    ui.upgradeChoices.appendChild(button);
  }
  ui.upgradeOverlay.hidden = false;
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
  updateLoadout();
}

function updateLoadout() {
  const weaponEntries = [
    ["cutlass", "Saebel", "key"],
    ["coconut", "Kokos", "lime"],
    ["compass", "Kompass", "compass"],
    ["bottle", "Bombe", "bottle"],
    ["rope", "Tau", "rope"],
  ].filter(([id]) => state.weapons[id].level > 0);
  ui.loadout.innerHTML = weaponEntries.map(([id, name, icon]) => `
    <div class="loadout-item">
      <span class="loadout-icon" style="${iconStyle(icon)}"></span>
      <span>
        <span class="loadout-name">${name}</span>
        <span class="loadout-level">Lv ${state.weapons[id].level}</span>
      </span>
    </div>
  `).join("");
}

function render() {
  if (!ready) {
    ctx.fillStyle = "#071312";
    ctx.fillRect(0, 0, viewW, viewH);
    return;
  }
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
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
}

function drawWorld() {
  const cam = state.camera;
  const ox = viewW / 2 - cam.x;
  const oy = viewH / 2 - cam.y;
  drawRepeatingMap(images.repeatBeach, ox, oy);
  drawNaturalGroundDetails(ox, oy);
}

function drawRepeatingMap(image, ox, oy) {
  const tileW = image.width;
  const tileH = image.height;
  const startX = positiveModulo(ox, tileW) - tileW;
  const startY = positiveModulo(oy, tileH) - tileH;
  for (let x = startX; x < viewW + tileW; x += tileW) {
    for (let y = startY; y < viewH + tileH; y += tileH) {
      ctx.drawImage(image, x, y, tileW, tileH);
    }
  }
}

function drawNaturalGroundDetails(ox, oy) {
  const tile = 220;
  const cam = state.camera;
  const minX = Math.floor((cam.x - viewW / 2) / tile) - 1;
  const maxX = Math.ceil((cam.x + viewW / 2) / tile) + 1;
  const minY = Math.floor((cam.y - viewH / 2) / tile) - 1;
  const maxY = Math.ceil((cam.y + viewH / 2) / tile) + 1;
  ctx.save();
  for (let gx = minX; gx <= maxX; gx += 1) {
    for (let gy = minY; gy <= maxY; gy += 1) {
      const x = gx * tile;
      const y = gy * tile;
      const h = hash2(gx, gy);
      if (h % 5 === 0) {
        ctx.fillStyle = "rgba(255, 244, 190, 0.12)";
        ctx.beginPath();
        ctx.ellipse(
          ox + x + 30 + ((h >> 6) % 160),
          oy + y + 30 + ((h >> 13) % 150),
          12 + (h % 17),
          4 + (h % 9),
          ((h >> 18) % 628) / 100,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      if (h % 11 === 0) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const px = ox + x + 24 + ((h >> 5) % 170);
        const py = oy + y + 24 + ((h >> 14) % 160);
        ctx.moveTo(px, py);
        ctx.bezierCurveTo(px + 20, py - 8, px + 44, py + 10, px + 66, py - 4);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawProps() {
  const ox = viewW / 2 - state.camera.x;
  const oy = viewH / 2 - state.camera.y;
  for (const prop of state.props) {
    if (!onScreen(prop.x, prop.y, 140)) continue;
    const pulse = 1 + Math.sin(performance.now() / 900 + prop.spin * 6) * 0.035;
    drawItem(prop.icon, ox + prop.x, oy + prop.y, ITEM.w * prop.scale * pulse, ITEM.h * prop.scale * pulse, prop.spin * 0.18 - 0.08, 0.54);
  }
}

function drawGems() {
  const ox = viewW / 2 - state.camera.x;
  const oy = viewH / 2 - state.camera.y;
  for (const gem of state.gems) {
    if (!onScreen(gem.x, gem.y, 80)) continue;
    const t = performance.now() / 260;
    const size = gem.kind === "xp" ? 28 : 34;
    ctx.save();
    ctx.translate(ox + gem.x, oy + gem.y + Math.sin(t + gem.x) * 4);
    ctx.rotate(Math.sin(t) * 0.1);
    if (gem.kind === "xp") {
      ctx.fillStyle = "rgba(77, 219, 255, 0.28)";
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
    }
    drawItemAt(gem.icon, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

function drawEnemies() {
  const ox = viewW / 2 - state.camera.x;
  const oy = viewH / 2 - state.camera.y;
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
    if (enemy.type.sprite) {
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
  const ox = viewW / 2 - state.camera.x;
  const oy = viewH / 2 - state.camera.y;
  const moving = Math.hypot(p.moveX, p.moveY) > 0.05;
  const row = moving ? 1 : 0;
  const frame = moving ? Math.floor(state.elapsed * 12) % 16 : Math.floor(state.elapsed * 3) % 4;
  const sx = frame * CHAR.w;
  const sy = row * CHAR.h;
  const w = 104;
  const h = 138;
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
  ctx.drawImage(images.characters, sx, sy, CHAR.w, CHAR.h, -w / 2, -h + 26, w, h);
  ctx.restore();
}

function drawProjectiles() {
  const ox = viewW / 2 - state.camera.x;
  const oy = viewH / 2 - state.camera.y;
  for (const projectile of state.projectiles) {
    if (!onScreen(projectile.x, projectile.y, 100)) continue;
    const size = projectile.type === "bottle" ? 44 : 38;
    drawItem(projectile.icon, ox + projectile.x, oy + projectile.y, size, size, projectile.spin, 0.96);
  }
  if (state.weapons.compass.level > 0) {
    for (const point of compassPoints()) {
      drawItem("compass", ox + point.x, oy + point.y, 48, 48, state.weapons.compass.angle, 0.95);
    }
  }
}

function drawWeaponEffects() {
  const ox = viewW / 2 - state.camera.x;
  const oy = viewH / 2 - state.camera.y;
  for (const zone of state.zones) {
    const a = clamp(zone.life / zone.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    if (zone.type === "slash") {
      ctx.translate(ox + zone.x, oy + zone.y);
      ctx.rotate(zone.angle);
      ctx.strokeStyle = "rgba(255, 236, 174, 0.9)";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(0, 0, zone.radius, -zone.arc, zone.arc);
      ctx.stroke();
      ctx.strokeStyle = "rgba(121, 224, 183, 0.38)";
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(0, 0, zone.radius - 6, -zone.arc * 0.8, zone.arc * 0.8);
      ctx.stroke();
    } else if (zone.type === "beam") {
      ctx.strokeStyle = "rgba(121, 224, 183, 0.82)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(ox + zone.x, oy + zone.y - 48);
      ctx.lineTo(ox + zone.tx, oy + zone.ty - 48);
      ctx.stroke();
    } else if (zone.type === "explosion") {
      ctx.translate(ox + zone.x, oy + zone.y);
      ctx.fillStyle = "rgba(255, 118, 95, 0.22)";
      ctx.beginPath();
      ctx.arc(0, 0, zone.radius * (1.2 - a * 0.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 225, 138, 0.8)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, zone.radius * (1 - a * 0.28), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (state.weapons.rope.level > 0) {
    const p = state.player;
    const radius = 86 + state.weapons.rope.level * 14;
    ctx.save();
    ctx.translate(ox + p.x, oy + p.y);
    ctx.rotate(state.weapons.rope.angle);
    ctx.strokeStyle = "rgba(238, 200, 123, 0.62)";
    ctx.lineWidth = 7;
    ctx.setLineDash([18, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawParticles() {
  const ox = viewW / 2 - state.camera.x;
  const oy = viewH / 2 - state.camera.y;
  for (const particle of state.particles) {
    ctx.globalAlpha = clamp(particle.life / 0.4, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(ox + particle.x, oy + particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTexts() {
  const ox = viewW / 2 - state.camera.x;
  const oy = viewH / 2 - state.camera.y;
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "900 18px Trebuchet MS, sans-serif";
  for (const text of state.texts) {
    ctx.globalAlpha = clamp(text.life / 0.9, 0, 1);
    ctx.fillStyle = text.color;
    ctx.strokeStyle = "rgba(0,0,0,0.65)";
    ctx.lineWidth = 4;
    ctx.strokeText(text.value, ox + text.x, oy + text.y);
    ctx.fillText(text.value, ox + text.x, oy + text.y);
  }
  ctx.restore();
}

function drawVignette() {
  const gradient = ctx.createRadialGradient(viewW / 2, viewH / 2, Math.min(viewW, viewH) * 0.2, viewW / 2, viewH / 2, Math.max(viewW, viewH) * 0.7);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(47,24,6,0.2)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewW, viewH);
}

function drawWarning() {
  ctx.save();
  ctx.globalAlpha = clamp(state.warningTimer / 2, 0, 1);
  ctx.fillStyle = "rgba(4, 9, 9, 0.35)";
  ctx.fillRect(0, viewH * 0.42, viewW, 76);
  ctx.fillStyle = "#fff2c7";
  ctx.textAlign = "center";
  ctx.font = "900 30px Trebuchet MS, sans-serif";
  ctx.fillText("MONKEY IDOL RISES", viewW / 2, viewH * 0.42 + 48);
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

function drawItemAt(icon, x, y, w, h) {
  if (newSpriteMap[icon]) {
    drawNewSpriteAt(icon, x, y, w, h);
    return;
  }
  const src = iconMap[icon] || iconMap.coin;
  ctx.drawImage(images.items, src.x * ITEM.w, src.y * ITEM.h, ITEM.w, ITEM.h, x, y, w, h);
}

function drawNewSpriteAt(icon, x, y, w, h) {
  const src = newSpriteMap[icon] || newSpriteMap.skullCoin;
  ctx.drawImage(images.newSprites, src.x * NEWSPRITE.w, src.y * NEWSPRITE.h, NEWSPRITE.w, NEWSPRITE.h, x, y, w, h);
}

function iconStyle(icon) {
  if (newSpriteMap[icon]) {
    const src = newSpriteMap[icon];
    const bx = src.x / (NEWSPRITE.cols - 1) * 100;
    const by = src.y / (NEWSPRITE.rows - 1) * 100;
    return `background-image:url('assets/sprites/new_sprites_imagen_hd.png');background-size:400% 200%;background-position:${bx}% ${by}%;`;
  }
  const src = iconMap[icon] || iconMap.coin;
  const bx = src.x / (ITEM.cols - 1) * 100;
  const by = src.y * 100;
  return `background-image:url('assets/sprites/scene_items_imagen_hd_sheet.png');background-size:400% 200%;background-position:${bx}% ${by}%;`;
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

function floatingText(value, x, y, color) {
  state.texts.push({ value, x, y, color, life: 0.9 });
}

function shake(power) {
  state.camera.x += (Math.random() - 0.5) * power * 12;
  state.camera.y += (Math.random() - 0.5) * power * 12;
}

function onScreen(x, y, margin = 0) {
  return Math.abs(x - state.camera.x) < viewW / 2 + margin && Math.abs(y - state.camera.y) < viewH / 2 + margin;
}

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  viewW = window.innerWidth;
  viewH = window.innerHeight;
  canvas.width = Math.floor(viewW * dpr);
  canvas.height = Math.floor(viewH * dpr);
  canvas.style.width = `${viewW}px`;
  canvas.style.height = `${viewH}px`;
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
ui.pauseButton.addEventListener("click", togglePause);
ui.audioButton.addEventListener("click", toggleMute);
ui.dashButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  dash();
});

function togglePause() {
  if (state.phase === "playing") {
    state.phase = "paused";
    playSound("confirm");
  } else if (state.phase === "paused") {
    state.phase = "playing";
    lastTime = performance.now();
    playSound("confirm");
  }
  updateDom();
}

function toggleMute() {
  muted = !muted;
  syncMusic();
  updateDom();
}

window.addEventListener("pointerdown", handleWorldPointerDown, { passive: false });
window.addEventListener("pointermove", handleWorldPointerMove, { passive: false });
window.addEventListener("pointerup", resetStick, { passive: false });
window.addEventListener("pointercancel", resetStick, { passive: false });

function handleWorldPointerDown(event) {
  if (event.pointerType === "mouse") return;
  if (state.phase !== "playing") return;
  if (event.target.closest("button, .overlay")) return;
  if (event.clientX > viewW * 0.58) return;
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
  pointer.originX = clamp(event.clientX, 58, Math.max(58, viewW * 0.58 - 20));
  pointer.originY = clamp(event.clientY, 68, Math.max(68, viewH - 68));
  ui.stickBase.classList.add("active");
  ui.stickBase.style.left = `${pointer.originX - 56}px`;
  ui.stickBase.style.top = `${pointer.originY - 56}px`;
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
window.__MONKEY_TIDE_DEBUG = () => ({
  ready,
  phase: state.phase,
  elapsed: state.elapsed,
  level: state.level,
  enemies: state.enemies.length,
  projectiles: state.projectiles.length,
  gems: state.gems.length,
  kills: state.killCount,
  hp: state.player.hp,
  player: { x: state.player.x, y: state.player.y },
  pointer: { active: pointer.active, dx: pointer.dx, dy: pointer.dy },
  weapons: Object.fromEntries(Object.entries(state.weapons).map(([key, value]) => [key, value.level])),
});

boot().catch((error) => {
  ui.loadingText.textContent = "Assets konnten nicht geladen werden";
  console.error(error);
});
