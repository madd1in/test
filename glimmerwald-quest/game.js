"use strict";

const TILE = 48;
const WORLD_COLS = 42;
const WORLD_ROWS = 30;
const WORLD_W = WORLD_COLS * TILE;
const WORLD_H = WORLD_ROWS * TILE;
const SAVE_KEY = "glimmerwald-quest-save-v1";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const minimap = document.getElementById("minimap");
const mini = minimap.getContext("2d");

const heartsEl = document.getElementById("hearts");
const sealCountEl = document.getElementById("sealCount");
const keyCountEl = document.getElementById("keyCount");
const bagCountEl = document.getElementById("bagCount");
const potionCountEl = document.getElementById("potionCount");
const rankTextEl = document.getElementById("rankText");
const timeTextEl = document.getElementById("timeText");
const questTextEl = document.getElementById("questText");
const progressBarEl = document.getElementById("progressBar");
const toastEl = document.getElementById("toast");
const startOverlay = document.getElementById("startOverlay");
const pauseOverlay = document.getElementById("pauseOverlay");
const endOverlay = document.getElementById("endOverlay");
const endKickerEl = document.getElementById("endKicker");
const endTitleEl = document.getElementById("endTitle");
const endCopyEl = document.getElementById("endCopy");
const newGameButton = document.getElementById("newGameButton");
const continueButton = document.getElementById("continueButton");
const pauseButton = document.getElementById("pauseButton");
const resumeButton = document.getElementById("resumeButton");
const restartButton = document.getElementById("restartButton");
const endRestartButton = document.getElementById("endRestartButton");
const soundButton = document.getElementById("soundButton");
const fullscreenButton = document.getElementById("fullscreenButton");
const appEl = document.querySelector(".game-app");
const stageEl = document.querySelector(".stage");

const ASSET_SOURCES = {
  grass: "assets/environment/grass.svg",
  darkGrass: "assets/environment/dark-grass.svg",
  path: "assets/environment/path.svg",
  stone: "assets/environment/stone.svg",
  water: "assets/environment/water.svg",
  wall: "assets/environment/wall.svg",
  bridge: "assets/environment/bridge.svg",
  tree: "assets/environment/tree.svg",
  rock: "assets/environment/rock.svg",
  bush: "assets/environment/bush.svg",
  gate: "assets/environment/gate.svg",
  chest: "assets/items/chest.svg",
  key: "assets/items/key.svg",
  seal: "assets/items/seal.svg",
  rupee: "assets/items/rupee.svg",
  potion: "assets/items/potion.svg",
  heart: "assets/ui/heart.svg",
  slash: "assets/ui/slash.svg",
  bolt: "assets/ui/bolt.svg",
  hero: "assets/characters/hero.svg",
  thornling: "assets/characters/thornling.svg",
  brute: "assets/characters/brute.svg",
  wisp: "assets/characters/wisp.svg",
  boss: "assets/characters/boss.svg"
};

const AUDIO_SOURCES = {
  bgm: "assets/audio/glimmerwald-theme.wav",
  slash: "assets/audio/slash.wav",
  hit: "assets/audio/hit.wav",
  pickup: "assets/audio/pickup.wav",
  hurt: "assets/audio/hurt.wav",
  gate: "assets/audio/gate.wav"
};

const images = {};
const audioAssets = {};
const renderCache = new Map();
const camera = { x: 0, y: 0 };
const input = {
  keys: new Set(),
  virtual: { up: false, down: false, left: false, right: false },
  swipeMove: { up: false, down: false, left: false, right: false },
  queued: { attack: false, dash: false, interact: false, potion: false },
  swipe: { active: false, id: null, startX: 0, startY: 0 }
};

let game = null;
let lastTime = 0;
let assetsReady = false;
let soundEnabled = false;
let audioCtx = null;
let saveTimer = 0;
let hudCache = "";

function loadAssets() {
  const entries = Object.entries(ASSET_SOURCES);
  return Promise.all(entries.map(([key, src]) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      images[key] = img;
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  }))).then(() => {
    Object.entries(AUDIO_SOURCES).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = "auto";
      audioAssets[key] = audio;
    });
    if (audioAssets.bgm) {
      audioAssets.bgm.loop = true;
      audioAssets.bgm.volume = 0.35;
    }
  });
}

function createGame() {
  const state = {
    started: false,
    paused: false,
    over: false,
    won: false,
    elapsed: 0,
    message: "",
    messageTimer: 0,
    shake: 0,
    tiles: createWorldTiles(),
    props: [],
    enemies: [],
    projectiles: [],
    pickups: [],
    particles: [],
    defeated: new Set(),
    flags: {
      gateOpen: false,
      bossAwake: false,
      shrineSeals: { moss: false, tide: false, ember: false }
    },
    player: {
      x: 4.5 * TILE,
      y: 7.5 * TILE,
      r: 15,
      hp: 8,
      maxHp: 8,
      stamina: 100,
      keys: 0,
      seals: 0,
      rupees: 0,
      potions: 1,
      dir: "down",
      attackTimer: 0,
      attackCooldown: 0,
      dashTimer: 0,
      dashCooldown: 0,
      dashVector: { x: 0, y: 1 },
      invuln: 0
    }
  };

  populateProps(state);
  populateEnemies(state);
  buildStaticLayers(state);
  return state;
}

function createWorldTiles() {
  const tiles = Array.from({ length: WORLD_ROWS }, (_, y) =>
    Array.from({ length: WORLD_COLS }, (_, x) => {
      if (x === 0 || y === 0 || x === WORLD_COLS - 1 || y === WORLD_ROWS - 1) {
        return "tree";
      }
      return (x * 11 + y * 17) % 9 === 0 ? "darkGrass" : "grass";
    })
  );

  const set = (x, y, value) => {
    if (x >= 0 && x < WORLD_COLS && y >= 0 && y < WORLD_ROWS) tiles[y][x] = value;
  };
  const rect = (x, y, w, h, value) => {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) set(xx, yy, value);
    }
  };

  rect(2, 7, 35, 2, "path");
  rect(5, 8, 2, 15, "path");
  rect(5, 21, 28, 2, "path");
  rect(30, 8, 2, 15, "path");
  rect(15, 9, 2, 6, "path");
  rect(24, 9, 2, 6, "path");

  for (let x = 1; x < WORLD_COLS - 1; x += 1) {
    set(x, 14, "water");
    set(x, 15, "water");
  }
  [5, 15, 24, 31, 36].forEach((bridgeX) => {
    rect(bridgeX, 14, 2, 2, "bridge");
  });

  placeRuin(tiles, 7, 3, 10, 8, "stone", "bottom", 11);
  placeRuin(tiles, 5, 19, 10, 7, "stone", "top", 9);
  placeRuin(tiles, 27, 19, 10, 7, "stone", "top", 31);
  placeRuin(tiles, 31, 4, 9, 9, "stone", "left", 8);

  [
    [20, 4], [21, 4], [22, 4], [20, 5], [22, 5],
    [18, 10], [19, 10], [21, 11], [34, 2], [35, 2],
    [2, 18], [3, 19], [18, 24], [19, 24], [20, 24],
    [38, 18], [39, 18], [38, 19], [12, 12], [13, 12]
  ].forEach(([x, y]) => set(x, y, "rock"));

  [
    [3, 3], [4, 3], [5, 3], [24, 3], [25, 3], [26, 3],
    [2, 11], [3, 11], [37, 12], [38, 12], [39, 12],
    [18, 17], [19, 17], [20, 17], [21, 17],
    [22, 26], [23, 26], [24, 26], [25, 26],
    [34, 27], [35, 27], [36, 27]
  ].forEach(([x, y]) => set(x, y, "tree"));

  return tiles;
}

function placeRuin(tiles, x, y, w, h, floorTile, gapSide, gapIndex) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) tiles[yy][xx] = floorTile;
  }
  for (let xx = x; xx < x + w; xx += 1) {
    tiles[y][xx] = "wall";
    tiles[y + h - 1][xx] = "wall";
  }
  for (let yy = y; yy < y + h; yy += 1) {
    tiles[yy][x] = "wall";
    tiles[yy][x + w - 1] = "wall";
  }
  if (gapSide === "bottom") {
    tiles[y + h - 1][gapIndex] = floorTile;
    tiles[y + h - 1][gapIndex + 1] = floorTile;
  }
  if (gapSide === "top") {
    tiles[y][gapIndex] = floorTile;
    tiles[y][gapIndex + 1] = floorTile;
  }
  if (gapSide === "left") {
    tiles[gapIndex][x] = floorTile;
    tiles[gapIndex + 1][x] = floorTile;
  }
}

function populateProps(state) {
  const add = (prop) => state.props.push(prop);

  [
    [3, 6], [6, 5], [8, 9], [14, 10], [16, 12],
    [4, 20], [7, 24], [11, 18], [18, 22], [24, 20],
    [29, 18], [33, 23], [37, 21], [35, 15], [27, 11],
    [23, 7], [2, 25], [39, 25]
  ].forEach(([x, y], index) => add({
    id: `bush-${index}`,
    type: "bush",
    x: (x + 0.5) * TILE,
    y: (y + 0.58) * TILE,
    w: 42,
    h: 34,
    hp: 1,
    solid: true
  }));

  [
    ["starter-key", 6.5, 6.4, "key", 1],
    ["west-cache", 3.5, 23.4, "potion", 1],
    ["river-cache", 18.5, 12.4, "rupee", 8],
    ["ember-cache", 34.5, 23.4, "key", 1],
    ["moon-cache", 37.5, 6.4, "potion", 1]
  ].forEach(([id, x, y, content, value]) => add({
    id: `chest-${id}`,
    type: "chest",
    x: x * TILE,
    y: y * TILE,
    w: 42,
    h: 34,
    content,
    value,
    solid: true,
    opened: false
  }));

  add({
    id: "door-west-cache",
    type: "door",
    x: 4.5 * TILE,
    y: 21.5 * TILE,
    w: 42,
    h: 54,
    solid: true,
    opened: false
  });

  add({
    id: "moon-gate",
    type: "gate",
    x: 31.15 * TILE,
    y: 8.5 * TILE,
    w: 48,
    h: 112,
    solid: true,
    opened: false
  });
}

function populateEnemies(state) {
  [
    ["thorn-1", "thornling", 12.5, 7.1],
    ["thorn-2", "thornling", 23.5, 8.6],
    ["thorn-3", "thornling", 8.5, 17.5],
    ["thorn-4", "thornling", 27.5, 17.6],
    ["thorn-5", "thornling", 37.5, 19.5],
    ["brute-1", "brute", 20.5, 20.6],
    ["wisp-1", "wisp", 17.4, 6.2],
    ["wisp-2", "wisp", 35.4, 14.2]
  ].forEach(([id, type, x, y]) => addEnemy(state, id, type, x * TILE, y * TILE));

  addEnemy(state, "seal-moss", "brute", 12 * TILE, 6.5 * TILE, {
    name: "Moosritter",
    hp: 8,
    seal: "moss",
    aggro: 330
  });
  addEnemy(state, "seal-tide", "wisp", 10 * TILE, 22.5 * TILE, {
    name: "Quelllicht",
    hp: 7,
    seal: "tide",
    aggro: 360
  });
  addEnemy(state, "seal-ember", "brute", 32 * TILE, 22.5 * TILE, {
    name: "Aschewache",
    hp: 9,
    seal: "ember",
    aggro: 360
  });
  addEnemy(state, "heart-of-grove", "boss", 35.5 * TILE, 8.2 * TILE, {
    name: "Herz des Hains",
    hp: 30,
    aggro: 440,
    active: false
  });
}

function addEnemy(state, id, type, x, y, extra = {}) {
  const base = {
    thornling: { hp: 2, r: 17, speed: 72, damage: 1, aggro: 250 },
    brute: { hp: 5, r: 21, speed: 54, damage: 2, aggro: 280 },
    wisp: { hp: 3, r: 18, speed: 62, damage: 1, aggro: 300 },
    boss: { hp: 30, r: 38, speed: 44, damage: 2, aggro: 440 }
  }[type];
  const hp = extra.hp || base.hp;
  state.enemies.push({
    id,
    type,
    name: extra.name || type,
    x,
    y,
    homeX: x,
    homeY: y,
    r: base.r,
    hp,
    maxHp: hp,
    speed: base.speed,
    damage: base.damage,
    aggro: extra.aggro || base.aggro,
    seal: extra.seal || null,
    active: extra.active !== undefined ? extra.active : true,
    cooldown: 0,
    shootCooldown: 0.8 + Math.random() * 0.6,
    hitTimer: 0,
    knockX: 0,
    knockY: 0,
    phaseTimer: 1.2
  });
}

function startNewGame() {
  game = createGame();
  game.started = true;
  hideAllOverlays();
  focusCanvas();
  showMessage("Der Glimmerwald oeffnet sich.");
  playBgm();
  saveGame();
}

function continueGame() {
  const loaded = loadGame();
  if (!loaded) {
    startNewGame();
    return;
  }
  game.started = true;
  hideAllOverlays();
  focusCanvas();
  showMessage("Save geladen.");
  playBgm();
}

function resetToStartOverlay() {
  game = createGame();
  updateContinueButton();
  startOverlay.classList.remove("is-hidden");
  pauseOverlay.classList.add("is-hidden");
  endOverlay.classList.add("is-hidden");
}

function hideAllOverlays() {
  startOverlay.classList.add("is-hidden");
  pauseOverlay.classList.add("is-hidden");
  endOverlay.classList.add("is-hidden");
}

function togglePause(force) {
  if (!game || !game.started || game.over || game.won) return;
  game.paused = force !== undefined ? force : !game.paused;
  pauseOverlay.classList.toggle("is-hidden", !game.paused);
  pauseButton.textContent = game.paused ? "Weiter" : "Pause";
  if (game.paused) pauseBgm();
  else playBgm();
  if (!game.paused) focusCanvas();
}

function update(dt) {
  if (!game || !game.started || game.paused || game.over || game.won) {
    updateHud();
    return;
  }

  game.elapsed += dt;
  game.messageTimer = Math.max(0, game.messageTimer - dt);
  game.shake = Math.max(0, game.shake - dt);
  saveTimer += dt;

  updatePlayer(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  updatePickups(dt);
  updateParticles(dt);

  if (saveTimer > 2) {
    saveTimer = 0;
    saveGame();
  }

  updateHud();
}

function updatePlayer(dt) {
  const p = game.player;
  p.attackCooldown = Math.max(0, p.attackCooldown - dt);
  p.attackTimer = Math.max(0, p.attackTimer - dt);
  p.dashCooldown = Math.max(0, p.dashCooldown - dt);
  p.invuln = Math.max(0, p.invuln - dt);

  if (consumeAction("attack")) tryAttack();
  if (consumeAction("interact")) interact();
  if (consumeAction("potion")) usePotion();
  if (consumeAction("dash")) startDash();

  const move = getMoveVector();
  if (move.x || move.y) {
    p.dir = vectorToDir(move.x, move.y);
  }

  if (p.dashTimer > 0) {
    p.dashTimer -= dt;
    moveEntity(p, p.dashVector.x * 420 * dt, p.dashVector.y * 420 * dt, true);
    spawnTrail(p.x, p.y, "#8ee8c1");
  } else {
    const terrain = getTileAtPixel(p.x, p.y);
    const terrainSpeed = terrain === "darkGrass" ? 0.9 : 1;
    moveEntity(p, move.x * 168 * terrainSpeed * dt, move.y * 168 * terrainSpeed * dt, true);
    p.stamina = Math.min(100, p.stamina + 28 * dt);
  }
}

function getMoveVector() {
  let x = 0;
  let y = 0;
  if (input.keys.has("ArrowLeft") || input.keys.has("KeyA") || input.virtual.left || input.swipeMove.left) x -= 1;
  if (input.keys.has("ArrowRight") || input.keys.has("KeyD") || input.virtual.right || input.swipeMove.right) x += 1;
  if (input.keys.has("ArrowUp") || input.keys.has("KeyW") || input.virtual.up || input.swipeMove.up) y -= 1;
  if (input.keys.has("ArrowDown") || input.keys.has("KeyS") || input.virtual.down || input.swipeMove.down) y += 1;
  const len = Math.hypot(x, y);
  return len ? { x: x / len, y: y / len } : { x: 0, y: 0 };
}

function startDash() {
  const p = game.player;
  if (p.dashCooldown > 0 || p.stamina < 22 || p.dashTimer > 0) return;
  const move = getMoveVector();
  const fallback = dirVector(p.dir);
  p.dashVector = move.x || move.y ? move : fallback;
  p.dashTimer = 0.15;
  p.dashCooldown = 0.45;
  p.stamina -= 22;
  game.shake = 0.05;
  playSfx("slash");
}

function tryAttack() {
  const p = game.player;
  if (p.attackCooldown > 0) return;
  p.attackCooldown = 0.26;
  p.attackTimer = 0.16;
  performSlash();
  playSfx("slash");
}

function performSlash() {
  const p = game.player;
  const vec = dirVector(p.dir);
  const cx = p.x + vec.x * 42;
  const cy = p.y + vec.y * 42;
  let connected = false;

  for (const enemy of game.enemies) {
    if (!enemy.active && enemy.type === "boss") continue;
    if (directionalHit(p, enemy, 74, 0.22)) {
      damageEnemy(enemy, enemy.type === "boss" ? 1 : 2, p.x, p.y);
      connected = true;
    }
  }

  for (const prop of game.props) {
    if (prop.opened || prop.removed || prop.type !== "bush") continue;
    if (circleRectHit(cx, cy, 38, propRect(prop))) {
      prop.hp -= 1;
      if (prop.hp <= 0) {
        prop.removed = true;
        spawnBurst(prop.x, prop.y, "#7bd36c", 9);
        if (Math.random() < 0.5) spawnPickup("rupee", prop.x, prop.y, 1);
        if (Math.random() < 0.18) spawnPickup("heart", prop.x, prop.y, 1);
      }
      connected = true;
    }
  }

  spawnBurst(cx, cy, connected ? "#fff7c6" : "#66b5d8", connected ? 7 : 3);
}

function directionalHit(source, target, range, widthBias) {
  const vec = dirVector(source.dir);
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range + target.r) return false;
  if (dist < 24) return true;
  const dot = (dx / dist) * vec.x + (dy / dist) * vec.y;
  return dot > widthBias;
}

function damageEnemy(enemy, amount, fromX, fromY) {
  if (enemy.hitTimer > 0.03) return;
  enemy.hp -= amount;
  enemy.hitTimer = 0.16;
  const dx = enemy.x - fromX;
  const dy = enemy.y - fromY;
  const len = Math.hypot(dx, dy) || 1;
  enemy.knockX += (dx / len) * 150;
  enemy.knockY += (dy / len) * 150;
  game.shake = Math.max(game.shake, 0.08);
  spawnBurst(enemy.x, enemy.y, "#f5c75c", 8);
  playSfx("hit");

  if (enemy.hp <= 0) defeatEnemy(enemy);
}

function defeatEnemy(enemy) {
  game.defeated.add(enemy.id);
  game.enemies = game.enemies.filter((entry) => entry !== enemy);
  spawnBurst(enemy.x, enemy.y, "#8ee8c1", enemy.type === "boss" ? 28 : 12);

  if (enemy.seal && !game.flags.shrineSeals[enemy.seal]) {
    game.flags.shrineSeals[enemy.seal] = true;
    game.player.seals += 1;
    game.player.maxHp = Math.min(12, game.player.maxHp + 1);
    game.player.hp = Math.min(game.player.maxHp, game.player.hp + 2);
    spawnPickup("seal", enemy.x, enemy.y - 8, 1);
    showMessage(`Mondsplitter geborgen: ${game.player.seals}/3.`);
  } else if (enemy.type === "boss") {
    winGame();
  } else {
    const roll = Math.random();
    if (roll < 0.2) spawnPickup("heart", enemy.x, enemy.y, 1);
    else if (roll < 0.34) spawnPickup("potion", enemy.x, enemy.y, 1);
    else spawnPickup("rupee", enemy.x, enemy.y, enemy.type === "brute" ? 3 : 1);
  }

  saveGame();
}

function interact() {
  const p = game.player;
  const nearby = game.props
    .filter((prop) => !prop.removed && ["chest", "door", "gate"].includes(prop.type) && distance(p, prop) < 76)
    .sort((a, b) => distance(p, a) - distance(p, b))[0];

  if (!nearby) {
    showMessage("Hier antwortet nur das Rascheln.");
    return;
  }

  if (nearby.type === "chest") {
    if (nearby.opened) {
      showMessage("Die Kiste ist leer.");
      return;
    }
    nearby.opened = true;
    grantChest(nearby);
    spawnBurst(nearby.x, nearby.y - 10, "#f5c75c", 12);
    saveGame();
    return;
  }

  if (nearby.type === "door") {
    if (nearby.opened) return;
    if (p.keys > 0) {
      p.keys -= 1;
      nearby.opened = true;
      spawnBurst(nearby.x, nearby.y, "#66b5d8", 12);
      showMessage("Das Schloss gibt nach.");
      playSfx("gate");
      saveGame();
    } else {
      showMessage("Ein alter Schluessel fehlt.");
    }
    return;
  }

  if (nearby.type === "gate") {
    if (nearby.opened) return;
    if (p.seals >= 3) {
      nearby.opened = true;
      game.flags.gateOpen = true;
      showMessage("Das Mondtor gleitet auf.");
      spawnBurst(nearby.x, nearby.y, "#8ee8c1", 22);
      playSfx("gate");
      saveGame();
    } else {
      showMessage("Das Tor verlangt drei Mondsplitter.");
    }
  }
}

function grantChest(chest) {
  const p = game.player;
  if (chest.content === "key") {
    p.keys += chest.value || 1;
    showMessage("Schluessel gefunden.");
    playSfx("pickup");
  } else if (chest.content === "potion") {
    p.potions += chest.value || 1;
    showMessage("Trank verstaut.");
    playSfx("pickup");
  } else if (chest.content === "rupee") {
    p.rupees += chest.value || 1;
    showMessage(`${chest.value || 1} Glimmersteine gefunden.`);
    playSfx("pickup");
  }
}

function usePotion() {
  const p = game.player;
  if (p.potions <= 0) {
    showMessage("Kein Trank im Rucksack.");
    return;
  }
  if (p.hp >= p.maxHp) {
    showMessage("Du bist bereits erholt.");
    return;
  }
  p.potions -= 1;
  p.hp = Math.min(p.maxHp, p.hp + 5);
  spawnBurst(p.x, p.y, "#e45655", 15);
  playSfx("pickup");
  saveGame();
}

function updateEnemies(dt) {
  const p = game.player;
  for (const enemy of [...game.enemies]) {
    enemy.cooldown = Math.max(0, enemy.cooldown - dt);
    enemy.hitTimer = Math.max(0, enemy.hitTimer - dt);
    enemy.shootCooldown = Math.max(0, enemy.shootCooldown - dt);
    enemy.phaseTimer = Math.max(0, enemy.phaseTimer - dt);

    if (enemy.knockX || enemy.knockY) {
      moveEntity(enemy, enemy.knockX * dt, enemy.knockY * dt, false);
      enemy.knockX *= Math.pow(0.06, dt);
      enemy.knockY *= Math.pow(0.06, dt);
      if (Math.abs(enemy.knockX) < 1) enemy.knockX = 0;
      if (Math.abs(enemy.knockY) < 1) enemy.knockY = 0;
      continue;
    }

    const distToPlayer = distance(enemy, p);
    if (enemy.type === "boss" && !enemy.active) {
      if (game.flags.gateOpen && distToPlayer < 330) {
        enemy.active = true;
        game.flags.bossAwake = true;
        showMessage("Das Herz des Hains erwacht.");
      } else {
        continue;
      }
    }

    if (enemy.type === "wisp") {
      updateWisp(enemy, distToPlayer, dt);
    } else if (enemy.type === "boss") {
      updateBoss(enemy, distToPlayer, dt);
    } else {
      updateChaser(enemy, distToPlayer, dt);
    }

    if (distToPlayer < enemy.r + p.r && enemy.cooldown <= 0) {
      damagePlayer(enemy.damage, enemy.x, enemy.y);
      enemy.cooldown = enemy.type === "boss" ? 0.9 : 0.7;
    }
  }
}

function updateChaser(enemy, distToPlayer, dt) {
  const p = game.player;
  if (distToPlayer < enemy.aggro) {
    const dx = p.x - enemy.x;
    const dy = p.y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;
    moveEntity(enemy, (dx / len) * enemy.speed * dt, (dy / len) * enemy.speed * dt, false);
  } else {
    const t = game.elapsed * 0.7 + enemy.homeX * 0.01;
    const tx = enemy.homeX + Math.cos(t) * 34;
    const ty = enemy.homeY + Math.sin(t * 0.8) * 24;
    driftToward(enemy, tx, ty, enemy.speed * 0.34, dt);
  }
}

function updateWisp(enemy, distToPlayer, dt) {
  const p = game.player;
  if (distToPlayer < enemy.aggro) {
    const dx = p.x - enemy.x;
    const dy = p.y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;
    const desired = distToPlayer < 145 ? -1 : 1;
    const strafe = Math.sin(game.elapsed * 2 + enemy.x) * 0.55;
    const mx = (dx / len) * desired + (-dy / len) * strafe;
    const my = (dy / len) * desired + (dx / len) * strafe;
    const mlen = Math.hypot(mx, my) || 1;
    moveEntity(enemy, (mx / mlen) * enemy.speed * dt, (my / mlen) * enemy.speed * dt, false);

    if (enemy.shootCooldown <= 0) {
      shootAt(enemy, p, 185);
      enemy.shootCooldown = enemy.seal ? 1.0 : 1.45;
    }
  } else {
    const t = game.elapsed * 1.4 + enemy.homeY * 0.03;
    driftToward(enemy, enemy.homeX + Math.cos(t) * 40, enemy.homeY + Math.sin(t) * 34, enemy.speed * 0.5, dt);
  }
}

function updateBoss(enemy, distToPlayer, dt) {
  const p = game.player;
  if (distToPlayer > 78) {
    driftToward(enemy, p.x, p.y, enemy.speed, dt);
  }

  if (enemy.phaseTimer <= 0) {
    enemy.phaseTimer = enemy.hp < enemy.maxHp * 0.45 ? 1.15 : 1.8;
    const count = enemy.hp < enemy.maxHp * 0.45 ? 8 : 5;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + game.elapsed * 0.2;
      game.projectiles.push({
        x: enemy.x,
        y: enemy.y - 8,
        dx: Math.cos(angle) * 150,
        dy: Math.sin(angle) * 150,
        r: 9,
        life: 2.4,
        damage: 1,
        kind: "root"
      });
    }
    spawnBurst(enemy.x, enemy.y, "#7bd36c", 16);
  }
}

function driftToward(entity, tx, ty, speed, dt) {
  const dx = tx - entity.x;
  const dy = ty - entity.y;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  moveEntity(entity, (dx / len) * speed * dt, (dy / len) * speed * dt, false);
}

function shootAt(enemy, target, speed) {
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const len = Math.hypot(dx, dy) || 1;
  game.projectiles.push({
    x: enemy.x,
    y: enemy.y,
    dx: (dx / len) * speed,
    dy: (dy / len) * speed,
    r: 8,
    life: 2.8,
    damage: enemy.seal ? 2 : 1,
    kind: "bolt"
  });
}

function updateProjectiles(dt) {
  const p = game.player;
  for (const projectile of [...game.projectiles]) {
    projectile.life -= dt;
    projectile.x += projectile.dx * dt;
    projectile.y += projectile.dy * dt;

    if (projectile.life <= 0 || isSolidCircle(projectile.x, projectile.y, projectile.r, false)) {
      projectile.life = -1;
      spawnBurst(projectile.x, projectile.y, "#66b5d8", 4);
      continue;
    }

    if (distance(projectile, p) < projectile.r + p.r) {
      damagePlayer(projectile.damage, projectile.x, projectile.y);
      projectile.life = -1;
      spawnBurst(projectile.x, projectile.y, "#e45655", 6);
    }
  }
  game.projectiles = game.projectiles.filter((projectile) => projectile.life > 0);
}

function damagePlayer(amount, fromX, fromY) {
  const p = game.player;
  if (p.invuln > 0 || game.over || game.won) return;
  p.hp -= amount;
  p.invuln = 0.85;
  game.shake = 0.16;
  const dx = p.x - fromX;
  const dy = p.y - fromY;
  const len = Math.hypot(dx, dy) || 1;
  moveEntity(p, (dx / len) * 18, (dy / len) * 18, true);
  spawnBurst(p.x, p.y, "#e45655", 12);
  playSfx("hurt");

  if (p.hp <= 0) {
    p.hp = 0;
    loseGame();
  }
}

function spawnPickup(type, x, y, value = 1) {
  game.pickups.push({
    type,
    x,
    y,
    value,
    r: type === "seal" ? 18 : 14,
    life: type === "seal" ? 999 : 22,
    bob: Math.random() * Math.PI * 2
  });
}

function updatePickups(dt) {
  const p = game.player;
  for (const pickup of [...game.pickups]) {
    pickup.life -= dt;
    pickup.bob += dt * 5;
    if (distance(pickup, p) < pickup.r + p.r + 4) {
      collectPickup(pickup);
      pickup.life = -1;
    }
  }
  game.pickups = game.pickups.filter((pickup) => pickup.life > 0);
}

function collectPickup(pickup) {
  const p = game.player;
  if (pickup.type === "heart") {
    p.hp = Math.min(p.maxHp, p.hp + 1);
    showMessage("Herz gesammelt.");
  } else if (pickup.type === "rupee") {
    p.rupees += pickup.value;
  } else if (pickup.type === "key") {
    p.keys += pickup.value;
    showMessage("Schluessel gefunden.");
  } else if (pickup.type === "potion") {
    p.potions += pickup.value;
    showMessage("Trank gesammelt.");
  } else if (pickup.type === "seal") {
    playSfx("gate");
  }
  if (pickup.type !== "seal") playSfx("pickup");
  spawnBurst(pickup.x, pickup.y, "#fff7c6", 8);
}

function updateParticles(dt) {
  for (const particle of game.particles) {
    particle.life -= dt;
    particle.x += particle.dx * dt;
    particle.y += particle.dy * dt;
    particle.dy += 60 * dt;
  }
  game.particles = game.particles.filter((particle) => particle.life > 0);
}

function moveEntity(entity, dx, dy, includeProps) {
  if (!dx && !dy) return;
  const nextX = entity.x + dx;
  if (!isSolidCircle(nextX, entity.y, entity.r, includeProps)) entity.x = clamp(nextX, entity.r, WORLD_W - entity.r);
  const nextY = entity.y + dy;
  if (!isSolidCircle(entity.x, nextY, entity.r, includeProps)) entity.y = clamp(nextY, entity.r, WORLD_H - entity.r);
}

function isSolidCircle(x, y, r, includeProps) {
  const minX = Math.floor((x - r) / TILE);
  const maxX = Math.floor((x + r) / TILE);
  const minY = Math.floor((y - r) / TILE);
  const maxY = Math.floor((y + r) / TILE);

  for (let ty = minY; ty <= maxY; ty += 1) {
    for (let tx = minX; tx <= maxX; tx += 1) {
      if (tileBlocks(getTile(tx, ty))) {
        if (circleRectHit(x, y, r, { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE })) return true;
      }
    }
  }

  if (!includeProps) return false;
  for (const prop of game.props) {
    if (!propIsSolid(prop)) continue;
    if (circleRectHit(x, y, r, propRect(prop))) return true;
  }
  return false;
}

function tileBlocks(tile) {
  return tile === "tree" || tile === "rock" || tile === "wall" || tile === "water";
}

function propIsSolid(prop) {
  if (prop.removed || prop.opened) return false;
  return prop.solid || prop.type === "gate" || prop.type === "door";
}

function propRect(prop) {
  return {
    x: prop.x - (prop.w || 42) / 2,
    y: prop.y - (prop.h || 42) / 2,
    w: prop.w || 42,
    h: prop.h || 42
  };
}

function circleRectHit(cx, cy, r, rect) {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);
  return Math.hypot(cx - closestX, cy - closestY) < r;
}

function getTile(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= WORLD_COLS || ty >= WORLD_ROWS) return "tree";
  return game.tiles[ty][tx];
}

function getTileAtPixel(x, y) {
  return getTile(Math.floor(x / TILE), Math.floor(y / TILE));
}

function buildStaticLayers(state) {
  state.staticLayer = document.createElement("canvas");
  state.staticLayer.width = WORLD_W;
  state.staticLayer.height = WORLD_H;
  const layer = state.staticLayer.getContext("2d");
  layer.imageSmoothingEnabled = true;

  for (let y = 0; y < WORLD_ROWS; y += 1) {
    for (let x = 0; x < WORLD_COLS; x += 1) {
      drawTileAsset(layer, state.tiles[y][x], x * TILE, y * TILE);
    }
  }

  state.minimapBase = document.createElement("canvas");
  state.minimapBase.width = minimap.width;
  state.minimapBase.height = minimap.height;
  const map = state.minimapBase.getContext("2d");
  const sx = minimap.width / WORLD_COLS;
  const sy = minimap.height / WORLD_ROWS;
  map.fillStyle = "#0c1219";
  map.fillRect(0, 0, minimap.width, minimap.height);
  for (let y = 0; y < WORLD_ROWS; y += 1) {
    for (let x = 0; x < WORLD_COLS; x += 1) {
      map.fillStyle = tileMiniColor(state.tiles[y][x]);
      map.fillRect(x * sx, y * sy, Math.ceil(sx), Math.ceil(sy));
    }
  }
}

function drawTileAsset(context, tile, px, py) {
  if (tile === "tree") {
    drawAsset(context, "darkGrass", px, py, TILE, TILE);
    drawAsset(context, "tree", px - 10, py - 28, 68, 82);
  } else if (tile === "rock") {
    drawAsset(context, "grass", px, py, TILE, TILE);
    drawAsset(context, "rock", px + 2, py + 1, 46, 46);
  } else if (tile === "wall") {
    drawAsset(context, "wall", px, py, TILE, TILE);
  } else {
    drawAsset(context, tile, px, py, TILE, TILE);
  }
}

function tileMiniColor(tile) {
  if (tile === "water") return "#2d91b2";
  if (tile === "bridge") return "#b47a45";
  if (tile === "wall" || tile === "rock") return "#6a7480";
  if (tile === "tree") return "#205033";
  if (tile === "stone") return "#7d8791";
  if (tile === "path") return "#a88454";
  return "#3d7844";
}

function render() {
  if (!game) return;
  const p = game.player;
  const shakeX = game.shake ? (Math.random() - 0.5) * game.shake * 20 : 0;
  const shakeY = game.shake ? (Math.random() - 0.5) * game.shake * 20 : 0;
  camera.x = clamp(p.x - canvas.width / 2, 0, WORLD_W - canvas.width);
  camera.y = clamp(p.y - canvas.height / 2, 0, WORLD_H - canvas.height);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-camera.x + shakeX, -camera.y + shakeY);
  drawTiles();
  drawWorldEntities();
  ctx.restore();
  drawScreenShade();
  renderMinimap();
  renderToast();
}

function drawTiles() {
  if (!game.staticLayer) return;
  const sx = clamp(Math.floor(camera.x) - TILE, 0, WORLD_W);
  const sy = clamp(Math.floor(camera.y) - TILE, 0, WORLD_H);
  const sw = Math.min(canvas.width + TILE * 2, WORLD_W - sx);
  const sh = Math.min(canvas.height + TILE * 2, WORLD_H - sy);
  ctx.drawImage(game.staticLayer, sx, sy, sw, sh, sx, sy, sw, sh);
}

function drawWorldEntities() {
  const drawables = [];
  for (const prop of game.props) {
    if (!prop.removed && isOnCamera(prop.x, prop.y, 100)) drawables.push({ y: prop.y, kind: "prop", value: prop });
  }
  for (const pickup of game.pickups) {
    if (isOnCamera(pickup.x, pickup.y, 80)) drawables.push({ y: pickup.y, kind: "pickup", value: pickup });
  }
  for (const enemy of game.enemies) {
    if (isOnCamera(enemy.x, enemy.y, 140)) drawables.push({ y: enemy.y, kind: "enemy", value: enemy });
  }
  drawables.push({ y: game.player.y, kind: "player", value: game.player });
  drawables.sort((a, b) => a.y - b.y);

  for (const drawable of drawables) {
    if (drawable.kind === "prop") drawProp(drawable.value);
    if (drawable.kind === "pickup") drawPickup(drawable.value);
    if (drawable.kind === "enemy") drawEnemy(drawable.value);
    if (drawable.kind === "player") drawPlayer(drawable.value);
  }

  for (const projectile of game.projectiles) {
    if (isOnCamera(projectile.x, projectile.y, 80)) drawProjectile(projectile);
  }
  for (const particle of game.particles) {
    if (isOnCamera(particle.x, particle.y, 40)) drawParticle(particle);
  }
}

function isOnCamera(x, y, margin) {
  return x > camera.x - margin &&
    x < camera.x + canvas.width + margin &&
    y > camera.y - margin &&
    y < camera.y + canvas.height + margin;
}

function drawProp(prop) {
  if (prop.type === "bush") {
    drawImage("bush", prop.x - 30, prop.y - 42, 60, 58);
    return;
  }
  if (prop.type === "chest") {
    ctx.globalAlpha = prop.opened ? 0.45 : 1;
    drawImage("chest", prop.x - 28, prop.y - 36, 56, 56);
    ctx.globalAlpha = 1;
    return;
  }
  if (prop.type === "door") {
    if (!prop.opened) drawImage("gate", prop.x - 32, prop.y - 50, 64, 72);
    return;
  }
  if (prop.type === "gate") {
    ctx.globalAlpha = prop.opened ? 0.25 : 1;
    drawImage("gate", prop.x - 42, prop.y - 70, 84, 116);
    ctx.globalAlpha = 1;
  }
}

function drawPickup(pickup) {
  const bob = Math.sin(pickup.bob) * 4;
  const size = pickup.type === "seal" ? 46 : 32;
  drawImage(pickup.type, pickup.x - size / 2, pickup.y - size / 2 - bob, size, size);
}

function drawEnemy(enemy) {
  if (enemy.type === "boss" && !enemy.active) {
    ctx.globalAlpha = game.flags.gateOpen ? 0.65 : 0.36;
  }
  drawShadow(enemy.x, enemy.y + enemy.r * 0.65, enemy.r * 1.4, enemy.r * 0.36);
  const scale = enemy.type === "boss" ? 116 : enemy.type === "brute" ? 70 : 58;
  const yOffset = enemy.type === "boss" ? 94 : enemy.type === "brute" ? 62 : 52;
  if (enemy.hitTimer > 0) ctx.filter = "brightness(1.8)";
  drawImage(enemy.type, enemy.x - scale / 2, enemy.y - yOffset, scale, scale);
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  if (enemy.hp < enemy.maxHp || enemy.type === "boss" || enemy.seal) {
    drawBar(enemy.x - 26, enemy.y - yOffset - 7, 52, 6, enemy.hp / enemy.maxHp, enemy.type === "boss" ? "#e45655" : "#f5c75c");
  }
}

function drawPlayer(p) {
  if (p.invuln > 0 && Math.floor(game.elapsed * 18) % 2 === 0) return;
  if (p.dashTimer > 0) {
    ctx.globalAlpha = 0.35;
    drawImage("hero", p.x - 34 - p.dashVector.x * 18, p.y - 66 - p.dashVector.y * 18, 68, 82);
    ctx.globalAlpha = 1;
  }
  drawShadow(p.x, p.y + 13, 24, 6);
  if (p.dir === "left") {
    ctx.save();
    ctx.translate(p.x, p.y - 24);
    ctx.scale(-1, 1);
    drawImage("hero", -34, -42, 68, 82);
    ctx.restore();
  } else {
    drawImage("hero", p.x - 34, p.y - 66, 68, 82);
  }

  if (p.attackTimer > 0) {
    const vec = dirVector(p.dir);
    const angle = dirAngle(p.dir);
    ctx.save();
    ctx.translate(p.x + vec.x * 42, p.y + vec.y * 42 - 6);
    ctx.rotate(angle);
    ctx.globalAlpha = clamp(p.attackTimer / 0.16, 0, 1);
    drawImage("slash", -44, -30, 88, 58);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawBar(p.x - 24, p.y + 24, 48, 5, p.stamina / 100, "#8ee8c1");
}

function drawProjectile(projectile) {
  const size = projectile.kind === "root" ? 24 : 28;
  ctx.save();
  ctx.translate(projectile.x, projectile.y);
  ctx.rotate(Math.atan2(projectile.dy, projectile.dx));
  drawImage("bolt", -size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawParticle(particle) {
  ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
  ctx.fillStyle = particle.color;
  ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
  ctx.globalAlpha = 1;
}

function drawScreenShade() {
  const grd = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 120, canvas.width / 2, canvas.height / 2, 560);
  grd.addColorStop(0, "rgba(0,0,0,0)");
  grd.addColorStop(1, "rgba(0,0,0,0.34)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawImage(key, x, y, w, h) {
  drawAsset(ctx, key, x, y, w, h);
}

function drawAsset(context, key, x, y, w, h) {
  const img = images[key];
  if (!img) {
    context.fillStyle = "#f5c75c";
    context.fillRect(x, y, w, h);
    return;
  }
  const width = Math.max(1, Math.round(w));
  const height = Math.max(1, Math.round(h));
  const cacheKey = `${key}:${width}x${height}`;
  let cached = renderCache.get(cacheKey);
  if (!cached) {
    cached = document.createElement("canvas");
    cached.width = width;
    cached.height = height;
    const cacheCtx = cached.getContext("2d");
    cacheCtx.imageSmoothingEnabled = true;
    cacheCtx.drawImage(img, 0, 0, width, height);
    renderCache.set(cacheKey, cached);
  }
  context.drawImage(cached, x, y, w, h);
}

function drawShadow(x, y, w, h) {
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBar(x, y, w, h, ratio, color) {
  ctx.fillStyle = "rgba(0,0,0,0.44)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, w * clamp(ratio, 0, 1)), h);
}

function renderMinimap() {
  if (!game) return;
  const sx = minimap.width / WORLD_COLS;
  const sy = minimap.height / WORLD_ROWS;
  mini.clearRect(0, 0, minimap.width, minimap.height);
  if (game.minimapBase) mini.drawImage(game.minimapBase, 0, 0);
  else {
    mini.fillStyle = "#0c1219";
    mini.fillRect(0, 0, minimap.width, minimap.height);
  }

  for (const prop of game.props) {
    if (prop.removed || prop.opened) continue;
    if (prop.type === "chest") mini.fillStyle = "#f5c75c";
    else if (prop.type === "gate") mini.fillStyle = "#8ee8c1";
    else continue;
    mini.fillRect((prop.x / TILE) * sx - 2, (prop.y / TILE) * sy - 2, 4, 4);
  }

  mini.fillStyle = "#e45655";
  for (const enemy of game.enemies) {
    if (enemy.type === "boss" && !enemy.active && !game.flags.gateOpen) continue;
    mini.fillRect((enemy.x / TILE) * sx - 2, (enemy.y / TILE) * sy - 2, 4, 4);
  }

  mini.fillStyle = "#fff7c6";
  mini.beginPath();
  mini.arc((game.player.x / TILE) * sx, (game.player.y / TILE) * sy, 3.5, 0, Math.PI * 2);
  mini.fill();
}

function updateHud() {
  if (!game) return;
  const p = game.player;
  const rank = p.seals >= 3 ? "Torbrecher" : p.seals >= 2 ? "Splitterjaeger" : p.seals >= 1 ? "Hainhueter" : "Pfadfinder";
  const quest = getQuestText();
  const key = `${p.hp}/${p.maxHp}/${p.keys}/${p.seals}/${p.rupees}/${p.potions}/${rank}/${quest}/${Math.floor(game.elapsed)}/${game.paused}/${game.over}/${game.won}`;
  if (key === hudCache) return;
  hudCache = key;

  heartsEl.innerHTML = "";
  for (let i = 0; i < p.maxHp; i += 1) {
    const heart = document.createElement("span");
    heart.className = `heart${i >= p.hp ? " is-empty" : ""}`;
    heartsEl.appendChild(heart);
  }
  sealCountEl.textContent = `${p.seals}/3`;
  keyCountEl.textContent = String(p.keys);
  bagCountEl.textContent = String(p.rupees);
  potionCountEl.textContent = String(p.potions);
  rankTextEl.textContent = rank;
  timeTextEl.textContent = formatTime(game.elapsed);
  questTextEl.textContent = quest;
  const progress = game.won ? 100 : game.flags.gateOpen ? 82 : Math.min(75, (p.seals / 3) * 75);
  progressBarEl.style.width = `${progress}%`;
  pauseButton.textContent = game.paused ? "Weiter" : "Pause";
}

function getQuestText() {
  if (game.won) return "Der Glimmerwald ist frei.";
  if (game.over) return "Der Hain wartet auf einen neuen Versuch.";
  if (game.player.seals < 3) return `Mondsplitter bergen: ${game.player.seals}/3`;
  if (!game.flags.gateOpen) return "Das Mondtor im Osten oeffnen.";
  return "Das Herz des Hains stellen.";
}

function renderToast() {
  if (!game || game.messageTimer <= 0) {
    toastEl.classList.remove("is-visible");
    return;
  }
  toastEl.textContent = game.message;
  toastEl.classList.add("is-visible");
}

function showMessage(message) {
  game.message = message;
  game.messageTimer = 3.2;
  toastEl.textContent = message;
}

function spawnBurst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 35 + Math.random() * 130;
    game.particles.push({
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed - 25,
      color,
      size: 3 + Math.random() * 4,
      life: 0.35 + Math.random() * 0.45,
      maxLife: 0.8
    });
  }
}

function spawnTrail(x, y, color) {
  game.particles.push({
    x: x + (Math.random() - 0.5) * 12,
    y: y + (Math.random() - 0.5) * 12,
    dx: (Math.random() - 0.5) * 25,
    dy: (Math.random() - 0.5) * 25,
    color,
    size: 5,
    life: 0.18,
    maxLife: 0.18
  });
}

function winGame() {
  game.won = true;
  game.started = false;
  saveGame();
  pauseBgm(true);
  playSfx("gate");
  endKickerEl.textContent = "Quest geschafft";
  endTitleEl.textContent = "Der Hain leuchtet wieder";
  endCopyEl.textContent = `Zeit: ${formatTime(game.elapsed)}. Glimmersteine: ${game.player.rupees}.`;
  endOverlay.classList.remove("is-hidden");
  showMessage("Glimmerwald gerettet.");
}

function loseGame() {
  game.over = true;
  game.started = false;
  pauseBgm(true);
  endKickerEl.textContent = "Quest gescheitert";
  endTitleEl.textContent = "Der Wald wird still";
  endCopyEl.textContent = "Ein neuer Lauf startet dich wieder am alten Pfad.";
  endOverlay.classList.remove("is-hidden");
  showMessage("Du wurdest niedergestreckt.");
}

function saveGame() {
  if (!game || !game.started && !game.won) return;
  try {
    const data = {
      elapsed: game.elapsed,
      player: {
        x: game.player.x,
        y: game.player.y,
        hp: game.player.hp,
        maxHp: game.player.maxHp,
        keys: game.player.keys,
        seals: game.player.seals,
        rupees: game.player.rupees,
        potions: game.player.potions
      },
      flags: game.flags,
      openedProps: game.props.filter((prop) => prop.opened || prop.removed).map((prop) => prop.id),
      defeated: Array.from(game.defeated),
      won: game.won
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    updateContinueButton();
  } catch (error) {
    console.warn("Save failed", error);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    game = createGame();
    Object.assign(game.player, data.player || {});
    game.elapsed = data.elapsed || 0;
    game.flags = {
      ...game.flags,
      ...(data.flags || {}),
      shrineSeals: {
        ...game.flags.shrineSeals,
        ...((data.flags && data.flags.shrineSeals) || {})
      }
    };
    game.won = Boolean(data.won);
    game.defeated = new Set(data.defeated || []);
    const opened = new Set(data.openedProps || []);
    for (const prop of game.props) {
      if (opened.has(prop.id)) {
        if (prop.type === "bush") prop.removed = true;
        else prop.opened = true;
      }
    }
    game.enemies = game.enemies.filter((enemy) => !game.defeated.has(enemy.id));
    const gate = game.props.find((prop) => prop.id === "moon-gate");
    if (gate && game.flags.gateOpen) gate.opened = true;
    return true;
  } catch (error) {
    console.warn("Load failed", error);
    return false;
  }
}

function updateContinueButton() {
  try {
    continueButton.disabled = !localStorage.getItem(SAVE_KEY);
  } catch {
    continueButton.disabled = true;
  }
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function queueAction(action) {
  input.queued[action] = true;
}

function consumeAction(action) {
  const value = input.queued[action];
  input.queued[action] = false;
  return value;
}

function dirVector(dir) {
  if (dir === "left") return { x: -1, y: 0 };
  if (dir === "right") return { x: 1, y: 0 };
  if (dir === "up") return { x: 0, y: -1 };
  return { x: 0, y: 1 };
}

function dirAngle(dir) {
  if (dir === "right") return 0;
  if (dir === "down") return Math.PI / 2;
  if (dir === "left") return Math.PI;
  return -Math.PI / 2;
}

function vectorToDir(x, y) {
  if (Math.abs(x) > Math.abs(y)) return x < 0 ? "left" : "right";
  return y < 0 ? "up" : "down";
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(totalSeconds) {
  const total = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function focusCanvas() {
  window.setTimeout(() => canvas.focus({ preventScroll: true }), 20);
}

function setSound(enabled) {
  soundEnabled = enabled;
  soundButton.textContent = soundEnabled ? "Ton: An" : "Ton: Aus";
  if (soundEnabled && !audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  if (soundEnabled) {
    playBgm();
    playSfx("pickup");
  } else {
    pauseBgm();
  }
}

function playBgm() {
  const bgm = audioAssets.bgm;
  if (!soundEnabled || !bgm || !game || !game.started || game.paused || game.over || game.won) return;
  bgm.volume = 0.34;
  bgm.play().catch(() => {});
}

function pauseBgm(reset = false) {
  const bgm = audioAssets.bgm;
  if (!bgm) return;
  bgm.pause();
  if (reset) bgm.currentTime = 0;
}

function playSfx(key) {
  if (!soundEnabled) return;
  const source = audioAssets[key];
  if (!source) {
    playTone(key === "hurt" ? 110 : 420, 0.08, "triangle", 0.035);
    return;
  }
  const clip = source.cloneNode(true);
  clip.volume = key === "gate" ? 0.42 : 0.5;
  clip.play().catch(() => {});
}

function playTone(freq, duration, type, gainValue) {
  if (!soundEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = gainValue;
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function setSwipeMove(dx, dy) {
  input.swipeMove.up = false;
  input.swipeMove.down = false;
  input.swipeMove.left = false;
  input.swipeMove.right = false;
  if (Math.hypot(dx, dy) < 18) return;
  if (dx < -14) input.swipeMove.left = true;
  if (dx > 14) input.swipeMove.right = true;
  if (dy < -14) input.swipeMove.up = true;
  if (dy > 14) input.swipeMove.down = true;
}

function clearSwipeMove() {
  input.swipeMove.up = false;
  input.swipeMove.down = false;
  input.swipeMove.left = false;
  input.swipeMove.right = false;
}

function handleSwipeStart(event) {
  if (event.pointerType !== "touch" || event.target.closest("button")) return;
  if (!game || !game.started || game.paused || game.over || game.won) return;
  event.preventDefault();
  input.swipe.active = true;
  input.swipe.id = event.pointerId;
  input.swipe.startX = event.clientX;
  input.swipe.startY = event.clientY;
  input.swipe.startT = performance.now();
  clearSwipeMove();
  stageEl.setPointerCapture(event.pointerId);
  focusCanvas();
}

function handleSwipeMove(event) {
  if (!input.swipe.active || input.swipe.id !== event.pointerId) return;
  event.preventDefault();
  setSwipeMove(event.clientX - input.swipe.startX, event.clientY - input.swipe.startY);
}

function handleSwipeEnd(event) {
  if (!input.swipe.active || input.swipe.id !== event.pointerId) return;
  event.preventDefault();
  const dx = event.clientX - input.swipe.startX;
  const dy = event.clientY - input.swipe.startY;
  const dist = Math.hypot(dx, dy);
  const age = performance.now() - (input.swipe.startT || performance.now());
  if (dist < 14) queueAction("attack");
  if (dist > 84 && age < 320) queueAction("dash");
  clearSwipeMove();
  input.swipe.active = false;
  input.swipe.id = null;
}

function toggleFullscreen() {
  if (!document.fullscreenEnabled || !appEl.requestFullscreen) {
    showMessage("Fullscreen ist in diesem Browser nicht verfuegbar.");
    return;
  }
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else {
    appEl.requestFullscreen().catch(() => showMessage("Fullscreen wurde blockiert."));
  }
}

function syncFullscreenUi() {
  const active = Boolean(document.fullscreenElement);
  appEl.classList.toggle("is-fullscreen", active);
  fullscreenButton.textContent = active ? "Fenster" : "Fullscreen";
}

function bindInputs() {
  const blockKeys = new Set([
    "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
    "Space", "KeyW", "KeyA", "KeyS", "KeyD"
  ]);

  window.addEventListener("keydown", (event) => {
    if (blockKeys.has(event.code)) event.preventDefault();
    input.keys.add(event.code);
    if (event.repeat) return;
    if (event.code === "Space" || event.code === "KeyJ") queueAction("attack");
    if (event.code === "ShiftLeft" || event.code === "ShiftRight" || event.code === "KeyK") queueAction("dash");
    if (event.code === "KeyE") queueAction("interact");
    if (event.code === "KeyQ") queueAction("potion");
    if (event.code === "Escape" || event.code === "KeyP") togglePause();
    if (event.code === "Enter" && startOverlay && !startOverlay.classList.contains("is-hidden")) continueGame();
  });

  window.addEventListener("keyup", (event) => {
    input.keys.delete(event.code);
  });

  document.querySelectorAll("[data-hold]").forEach((button) => {
    const dir = button.dataset.hold;
    const setHold = (value) => {
      input.virtual[dir] = value;
      if (value) focusCanvas();
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      setHold(true);
    });
    button.addEventListener("pointerup", () => setHold(false));
    button.addEventListener("pointercancel", () => setHold(false));
    button.addEventListener("pointerleave", () => setHold(false));
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      queueAction(button.dataset.action);
      focusCanvas();
    });
  });

  newGameButton.addEventListener("click", startNewGame);
  continueButton.addEventListener("click", continueGame);
  pauseButton.addEventListener("click", () => togglePause());
  resumeButton.addEventListener("click", () => togglePause(false));
  restartButton.addEventListener("click", startNewGame);
  endRestartButton.addEventListener("click", startNewGame);
  soundButton.addEventListener("click", () => setSound(!soundEnabled));
  fullscreenButton.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", syncFullscreenUi);
  stageEl.addEventListener("pointerdown", handleSwipeStart);
  stageEl.addEventListener("pointermove", handleSwipeMove);
  stageEl.addEventListener("pointerup", handleSwipeEnd);
  stageEl.addEventListener("pointercancel", handleSwipeEnd);
  canvas.addEventListener("pointerdown", () => focusCanvas());
}

loadAssets()
  .then(() => {
    assetsReady = true;
    bindInputs();
    resetToStartOverlay();
    updateHud();
    requestAnimationFrame(loop);
  })
  .catch((error) => {
    console.error("Asset load failed", error);
    toastEl.textContent = "Asset-Laden fehlgeschlagen.";
    toastEl.classList.add("is-visible");
  });
