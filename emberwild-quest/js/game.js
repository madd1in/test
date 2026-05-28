import { ASSETS, OBJECT_FRAME, TILE, TILE_INDEX as T } from "./assets.js";
import {
  MAX_HEALTH,
  REQUIRED_SHARDS,
  addKey,
  addShard,
  clearSave,
  heal,
  loadState,
  markBossDefeated,
  markChest,
  markEnemyDefeated,
  openGate,
  saveState,
  takeDamage,
  touchBeacon,
} from "./sim.js";

const WORLD_W = 64;
const WORLD_H = 46;
const WORLD_PX_W = WORLD_W * TILE;
const WORLD_PX_H = WORLD_H * TILE;
const PLAYER_SPEED = 172;
const DASH_SPEED = 420;
const DASH_TIME = 150;
const DASH_COOLDOWN = 620;
const ATTACK_COOLDOWN = 310;
const INVULN_TIME = 760;

const ui = {
  shell: document.querySelector("#game-shell"),
  hud: document.querySelector("#hud"),
  healthFill: document.querySelector("#health-fill"),
  emberFill: document.querySelector("#ember-fill"),
  shardCount: document.querySelector("#shard-count"),
  keyStatus: document.querySelector("#key-status"),
  areaName: document.querySelector("#area-name"),
  objective: document.querySelector("#objective"),
  prompt: document.querySelector("#prompt"),
  journal: document.querySelector("#journal"),
  journalToggle: document.querySelector("#journal-toggle"),
  menu: document.querySelector("#menu"),
  startButton: document.querySelector("#start-button"),
  resetButton: document.querySelector("#reset-button"),
  endScreen: document.querySelector("#end-screen"),
  endTitle: document.querySelector("#end-title"),
  endMessage: document.querySelector("#end-message"),
  againButton: document.querySelector("#again-button"),
};

const touchState = {
  up: false,
  down: false,
  left: false,
  right: false,
  taps: new Set(),
};

function consumeTap(action) {
  if (!touchState.taps.has(action)) return false;
  touchState.taps.delete(action);
  return true;
}

function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

function distance(a, b) {
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

function makeWorld(state) {
  const ground = [];
  const solid = [];
  const decor = [];

  for (let y = 0; y < WORLD_H; y += 1) {
    ground[y] = [];
    solid[y] = [];
    decor[y] = [];
    for (let x = 0; x < WORLD_W; x += 1) {
      const noise = (x * 17 + y * 31 + (x * y) % 13) % 23;
      ground[y][x] = noise < 2 ? T.grassFlowers : noise < 7 ? T.moss : T.grass;
      solid[y][x] = -1;
      decor[y][x] = -1;
    }
  }

  const putSolid = (x, y, tile) => {
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return;
    solid[y][x] = tile;
  };
  const putGround = (x, y, tile) => {
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return;
    ground[y][x] = tile;
  };
  const putDecor = (x, y, tile) => {
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return;
    decor[y][x] = tile;
  };

  for (let x = 0; x < WORLD_W; x += 1) {
    putSolid(x, 0, T.wall);
    putSolid(x, WORLD_H - 1, T.wall);
    putGround(x, 0, T.dark);
    putGround(x, WORLD_H - 1, T.dark);
  }
  for (let y = 0; y < WORLD_H; y += 1) {
    putSolid(0, y, T.wall);
    putSolid(WORLD_W - 1, y, T.wall);
    putGround(0, y, T.dark);
    putGround(WORLD_W - 1, y, T.dark);
  }

  const road = [
    [6, 37, 28, 37],
    [27, 31, 36, 38],
    [31, 16, 34, 37],
    [33, 20, 55, 22],
    [10, 20, 33, 22],
    [48, 10, 54, 22],
  ];
  for (const [x0, y0, x1, y1] of road) {
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        putGround(x, y, (x + y) % 5 === 0 ? T.roots : T.dirt);
      }
    }
  }

  for (let x = 1; x < WORLD_W - 1; x += 1) {
    const riverY = 27 + Math.round(Math.sin(x / 4) * 2);
    for (let dy = -1; dy <= 1; dy += 1) {
      putGround(x, riverY + dy, T.water);
      putSolid(x, riverY + dy, T.water);
    }
  }
  for (const bridgeX of [12, 32, 53]) {
    for (let bx = bridgeX - 1; bx <= bridgeX + 1; bx += 1) {
      for (let by = 24; by <= 31; by += 1) {
        if (solid[by]?.[bx] === T.water) {
          solid[by][bx] = -1;
          ground[by][bx] = T.bridge;
        }
      }
    }
  }

  for (let y = 3; y <= 15; y += 1) {
    for (let x = 23; x <= 41; x += 1) {
      putGround(x, y, (x + y) % 4 === 0 ? T.crackedStone : T.stone);
    }
  }
  for (let x = 23; x <= 41; x += 1) {
    putSolid(x, 3, T.wall);
    putSolid(x, 15, T.wall);
  }
  for (let y = 3; y <= 15; y += 1) {
    putSolid(23, y, T.wall);
    putSolid(41, y, T.wall);
  }
  putSolid(31, 15, state.gateOpen ? -1 : T.gateClosed);
  putSolid(32, 15, state.gateOpen ? -1 : T.gateClosed);
  putDecor(31, 15, state.gateOpen ? T.gateOpen : -1);
  putDecor(32, 15, state.gateOpen ? T.gateOpen : -1);
  for (const [x, y] of [
    [26, 6],
    [38, 6],
    [26, 12],
    [38, 12],
    [32, 8],
  ]) {
    putDecor(x, y, T.pillar);
  }
  for (let x = 28; x <= 36; x += 1) {
    putGround(x, 9, T.altar);
  }

  for (const [x0, y0, x1, y1] of [
    [3, 4, 13, 13],
    [3, 30, 14, 43],
    [50, 3, 60, 14],
    [50, 31, 60, 42],
    [17, 7, 21, 14],
    [43, 18, 50, 24],
    [18, 39, 30, 43],
  ]) {
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const edge = x === x0 || x === x1 || y === y0 || y === y1;
        if (edge && (x * 5 + y * 7) % 3 !== 0) putSolid(x, y, T.tree);
        else if ((x * 11 + y * 17) % 19 === 0) putDecor(x, y, T.fern);
      }
    }
  }

  for (const [x0, y0, x1, y1] of [
    [7, 17, 16, 18],
    [42, 35, 51, 37],
    [55, 16, 59, 25],
    [18, 25, 23, 31],
  ]) {
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        putSolid(x, y, T.bramble);
      }
    }
  }

  for (let i = 0; i < 120; i += 1) {
    const x = 2 + ((i * 13) % (WORLD_W - 4));
    const y = 2 + ((i * 19) % (WORLD_H - 4));
    if (solid[y][x] === -1 && ground[y][x] !== T.water && (x < 22 || x > 42 || y > 16)) {
      if (i % 6 === 0) putDecor(x, y, T.flowers);
      else if (i % 5 === 0) putDecor(x, y, T.glowMoss);
      else if (i % 4 === 0) putDecor(x, y, T.roots);
    }
  }

  return { ground, solid, decor };
}

function listSpawns(state) {
  const shards = [
    { id: "hollow", x: 12, y: 20 },
    { id: "stream", x: 54, y: 31 },
    { id: "thicket", x: 7, y: 38 },
    { id: "tower", x: 54, y: 11 },
    { id: "causeway", x: 31, y: 22 },
  ].filter((item) => !state.shards.includes(item.id));

  const enemies = [
    [18, 21],
    [25, 33],
    [43, 22],
    [48, 35],
    [52, 12],
    [10, 34],
    [36, 25],
    [57, 33],
    [14, 14],
    [46, 18],
  ];

  const chests = [
    { id: "sunken-key", x: 55, y: 38, content: "key" },
    { id: "root-cache", x: 9, y: 12, content: "heart" },
    { id: "north-cache", x: 36, y: 12, content: "potion" },
  ];

  const beacons = [
    { id: "camp", x: 6, y: 37 },
    { id: "causeway", x: 32, y: 22 },
    { id: "tower", x: 50, y: 12 },
  ];

  return { shards, enemies, chests, beacons };
}

class EmberScene extends Phaser.Scene {
  constructor() {
    super("emberwild");
    this.activePlay = false;
    this.pausedByOverlay = false;
    this.facing = { x: 0, y: 1, key: "down" };
    this.nextAttackAt = 0;
    this.nextDashAt = 0;
    this.dashUntil = 0;
    this.invulnerableUntil = 0;
    this.endMode = "restart";
  }

  preload() {
    this.load.image("tiles", ASSETS.tiles);
    this.load.image("key-art", ASSETS.keyArt);
    this.load.spritesheet("objects", ASSETS.objects, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("player", ASSETS.player, { frameWidth: 40, frameHeight: 48 });
    this.load.spritesheet("thornling", ASSETS.thornling, { frameWidth: 32, frameHeight: 34 });
    this.load.spritesheet("ashwarden", ASSETS.ashwarden, { frameWidth: 72, frameHeight: 72 });
    this.load.spritesheet("slash", ASSETS.slash, { frameWidth: 64, frameHeight: 64 });
  }

  create() {
    this.state = loadState();
    this.worldData = makeWorld(this.state);
    this.createAnimations();
    this.createMap();
    this.createEntities();
    this.createInput();
    this.createCamera();
    this.updateHud();
    this.setPlayActive(false);
    window.__emberScene = this;
  }

  createAnimations() {
    const makeWalk = (key, start) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers("player", { start, end: start + 2 }),
        frameRate: 9,
        repeat: -1,
      });
    };
    makeWalk("walk-down", 0);
    makeWalk("walk-left", 3);
    makeWalk("walk-right", 6);
    makeWalk("walk-up", 9);

    this.anims.create({
      key: "thornling-walk",
      frames: this.anims.generateFrameNumbers("thornling", { start: 0, end: 3 }),
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: "ashwarden-breathe",
      frames: this.anims.generateFrameNumbers("ashwarden", { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1,
    });
    this.anims.create({
      key: "slash-swing",
      frames: this.anims.generateFrameNumbers("slash", { start: 0, end: 4 }),
      frameRate: 24,
      repeat: 0,
    });
  }

  createMap() {
    this.map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: WORLD_W, height: WORLD_H });
    const tiles = this.map.addTilesetImage("tiles", "tiles", TILE, TILE, 0, 0);
    this.groundLayer = this.map.createBlankLayer("ground", tiles, 0, 0);
    this.decorLayer = this.map.createBlankLayer("decor", tiles, 0, 0);
    this.solidLayer = this.map.createBlankLayer("solid", tiles, 0, 0);

    for (let y = 0; y < WORLD_H; y += 1) {
      for (let x = 0; x < WORLD_W; x += 1) {
        this.groundLayer.putTileAt(this.worldData.ground[y][x], x, y);
        if (this.worldData.decor[y][x] !== -1) this.decorLayer.putTileAt(this.worldData.decor[y][x], x, y);
        if (this.worldData.solid[y][x] !== -1) this.solidLayer.putTileAt(this.worldData.solid[y][x], x, y);
      }
    }
    this.groundLayer.setDepth(0);
    this.decorLayer.setDepth(2);
    this.solidLayer.setDepth(3);
    this.solidLayer.setCollision([T.water, T.wall, T.tree, T.bramble, T.gateClosed, T.pillar, T.emberVine, T.pit]);
  }

  createEntities() {
    const start = this.state.lastCheckpoint ?? { x: 192, y: 236 };
    this.player = this.physics.add.sprite(start.x, start.y, "player", 1);
    this.player.setSize(18, 24).setOffset(11, 20).setDepth(20);
    this.player.setCollideWorldBounds(true);

    this.collectibles = this.physics.add.group({ allowGravity: false, immovable: true });
    this.chests = this.physics.add.staticGroup();
    this.beacons = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group({ allowGravity: false });
    this.bossGroup = this.physics.add.group({ allowGravity: false });

    const spawns = listSpawns(this.state);
    for (const shard of spawns.shards) {
      const pos = tileCenter(shard.x, shard.y);
      const sprite = this.collectibles.create(pos.x, pos.y, "objects", OBJECT_FRAME.shard);
      sprite.setData("type", "shard");
      sprite.setData("id", shard.id);
      sprite.setCircle(11, 5, 5);
      sprite.setDepth(12);
      this.tweens.add({
        targets: sprite,
        y: pos.y - 5,
        yoyo: true,
        repeat: -1,
        duration: 900 + shard.x * 11,
        ease: "sine.inOut",
      });
    }

    for (const chest of spawns.chests) {
      const pos = tileCenter(chest.x, chest.y);
      const opened = this.state.chests.includes(chest.id);
      const sprite = this.chests.create(pos.x, pos.y, "objects", opened ? OBJECT_FRAME.chestOpen : OBJECT_FRAME.chestClosed);
      sprite.setData("id", chest.id);
      sprite.setData("content", chest.content);
      sprite.setData("opened", opened);
      sprite.setDepth(12);
      sprite.refreshBody();
    }

    for (const beacon of spawns.beacons) {
      const pos = tileCenter(beacon.x, beacon.y);
      const sprite = this.beacons.create(pos.x, pos.y, "objects", OBJECT_FRAME.beacon);
      sprite.setData("id", beacon.id);
      sprite.setDepth(11);
      sprite.refreshBody();
      this.tweens.add({ targets: sprite, scale: 1.1, yoyo: true, repeat: -1, duration: 1000, ease: "sine.inOut" });
    }

    for (const [tx, ty] of spawns.enemies) {
      const pos = tileCenter(tx, ty);
      const enemy = this.enemies.create(pos.x, pos.y, "thornling", 0);
      enemy.setData("hp", 3);
      enemy.setData("home", { x: pos.x, y: pos.y });
      enemy.setData("nextThink", 0);
      enemy.setData("touchAt", 0);
      enemy.setSize(22, 22).setOffset(5, 10).setDepth(18);
      enemy.play("thornling-walk");
    }

    if (!this.state.bossDefeated) {
      const bossPos = tileCenter(32, 8);
      const boss = this.bossGroup.create(bossPos.x, bossPos.y, "ashwarden", 0);
      boss.setData("hp", 14);
      boss.setData("maxHp", 14);
      boss.setData("touchAt", 0);
      boss.setData("awake", false);
      boss.setSize(40, 44).setOffset(16, 25).setDepth(19);
      boss.play("ashwarden-breathe");
    }

    this.physics.world.setBounds(0, 0, WORLD_PX_W, WORLD_PX_H);
    this.physics.add.collider(this.player, this.solidLayer);
    this.physics.add.collider(this.enemies, this.solidLayer);
    this.physics.add.collider(this.bossGroup, this.solidLayer);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.overlap(this.player, this.collectibles, (_, item) => this.collectItem(item));
    this.physics.add.overlap(this.player, this.enemies, (_, enemy) => this.touchEnemy(enemy));
    this.physics.add.overlap(this.player, this.bossGroup, (_, boss) => this.touchBoss(boss));
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
      attack: "SPACE",
      interact: "E",
      dash: "SHIFT",
      pause: "ESC",
    });
    this.pointerAttack = false;
    this.input.on("pointerdown", (pointer) => {
      if (pointer.event?.target?.tagName === "CANVAS") this.pointerAttack = true;
    });
  }

  createCamera() {
    this.cameras.main.setBounds(0, 0, WORLD_PX_W, WORLD_PX_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.45);
    this.scale.on("resize", (gameSize) => {
      this.cameras.main.setSize(gameSize.width, gameSize.height);
    });
  }

  setPlayActive(active) {
    this.activePlay = active;
    ui.hud.hidden = !active;
    if (!active && this.player) this.player.setVelocity(0, 0);
  }

  startAdventure() {
    ui.menu.hidden = true;
    ui.endScreen.hidden = true;
    this.pausedByOverlay = false;
    this.setPlayActive(true);
    this.updateHud();
  }

  update(time, delta) {
    if (!this.activePlay || this.pausedByOverlay) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.pause)) {
      this.showPause();
      return;
    }

    this.updatePlayer(time);
    this.updateEnemies(time, delta);
    this.updateBoss(time, delta);
    this.updateInteractions();
    this.updateAreaName();
  }

  updatePlayer(time) {
    const move = this.readMoveVector();
    const moving = move.x !== 0 || move.y !== 0;
    if (moving) {
      this.facing = this.vectorToFacing(move);
    }

    const dashPressed = Phaser.Input.Keyboard.JustDown(this.keys.dash) || consumeTap("dash");
    if (dashPressed && moving && time >= this.nextDashAt) {
      this.dashUntil = time + DASH_TIME;
      this.nextDashAt = time + DASH_COOLDOWN;
      this.cameras.main.shake(70, 0.004);
    }

    const speed = time < this.dashUntil ? DASH_SPEED : PLAYER_SPEED;
    this.player.setVelocity(move.x * speed, move.y * speed);

    if (moving) {
      this.player.anims.play(`walk-${this.facing.key}`, true);
    } else {
      this.player.anims.stop();
      this.player.setFrame({ down: 1, left: 4, right: 7, up: 10 }[this.facing.key]);
    }

    const attackPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.attack) || consumeTap("attack") || this.pointerAttack;
    this.pointerAttack = false;
    if (attackPressed && time >= this.nextAttackAt) {
      this.attack(time);
    }

    if (time < this.invulnerableUntil) {
      this.player.setAlpha(time % 120 < 60 ? 0.48 : 1);
    } else {
      this.player.setAlpha(1);
    }
  }

  readMoveVector() {
    let x = 0;
    let y = 0;
    if (this.cursors.left.isDown || this.keys.left.isDown || touchState.left) x -= 1;
    if (this.cursors.right.isDown || this.keys.right.isDown || touchState.right) x += 1;
    if (this.cursors.up.isDown || this.keys.up.isDown || touchState.up) y -= 1;
    if (this.cursors.down.isDown || this.keys.down.isDown || touchState.down) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = Math.SQRT1_2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  vectorToFacing(vec) {
    if (Math.abs(vec.x) > Math.abs(vec.y)) return vec.x < 0 ? { x: -1, y: 0, key: "left" } : { x: 1, y: 0, key: "right" };
    return vec.y < 0 ? { x: 0, y: -1, key: "up" } : { x: 0, y: 1, key: "down" };
  }

  attack(time) {
    this.nextAttackAt = time + ATTACK_COOLDOWN;
    const ox = this.facing.x * 34;
    const oy = this.facing.y * 34;
    const slash = this.add.sprite(this.player.x + ox, this.player.y + oy, "slash", 0);
    slash.setDepth(30);
    slash.setAngle({ right: 0, down: 90, left: 180, up: 270 }[this.facing.key]);
    slash.play("slash-swing");
    slash.once("animationcomplete", () => slash.destroy());

    const struck = new Set();
    const hit = (target, amount) => {
      if (!target.active || struck.has(target)) return;
      const dx = target.x - this.player.x;
      const dy = target.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      const dot = dx * this.facing.x + dy * this.facing.y;
      if (dist <= 70 && dot > -10) {
        struck.add(target);
        this.damageTarget(target, amount);
      }
    };
    this.enemies.children.iterate((enemy) => hit(enemy, 1));
    this.bossGroup.children.iterate((boss) => hit(boss, 1));
  }

  damageTarget(target, amount) {
    const hp = target.getData("hp") - amount;
    target.setData("hp", hp);
    target.setTintFill(0xffe0a0);
    this.time.delayedCall(80, () => target.clearTint());
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
    target.setVelocity(Math.cos(angle) * 170, Math.sin(angle) * 170);

    if (hp > 0) return;
    if (target.texture.key === "ashwarden") {
      this.defeatBoss(target);
    } else {
      markEnemyDefeated(this.state);
      this.dropMaybe(target.x, target.y);
      target.destroy();
      this.updateHud();
    }
  }

  dropMaybe(x, y) {
    if ((this.state.enemiesDefeated + Math.round(x + y)) % 3 !== 0) return;
    const item = this.collectibles.create(x, y, "objects", OBJECT_FRAME.heart);
    item.setData("type", "heart");
    item.setCircle(10, 6, 6);
    item.setDepth(12);
  }

  updateEnemies(time) {
    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      const distToPlayer = distance(enemy, this.player);
      if (distToPlayer < 270) {
        this.physics.moveToObject(enemy, this.player, distToPlayer < 52 ? 40 : 92);
      } else if (time > enemy.getData("nextThink")) {
        enemy.setData("nextThink", time + Phaser.Math.Between(700, 1600));
        const home = enemy.getData("home");
        const roam = new Phaser.Math.Vector2(home.x + Phaser.Math.Between(-80, 80), home.y + Phaser.Math.Between(-60, 60));
        this.physics.moveTo(enemy, roam.x, roam.y, 42);
      }
      enemy.setDepth(enemy.y);
    });
  }

  updateBoss(time) {
    this.bossGroup.children.iterate((boss) => {
      if (!boss?.active) return;
      const distToPlayer = distance(boss, this.player);
      const awake = boss.getData("awake") || distToPlayer < 360 || this.state.gateOpen;
      boss.setData("awake", awake);
      if (!awake) return;
      if (!this.state.gateOpen) return;
      this.physics.moveToObject(boss, this.player, distToPlayer < 70 ? 35 : 76);
      boss.setDepth(boss.y);
      if (time % 900 < 18 && distToPlayer < 260) this.spawnBossEmber(boss);
    });
  }

  spawnBossEmber(boss) {
    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
    const ember = this.add.circle(boss.x, boss.y, 5, 0xffb84e, 0.95);
    ember.setDepth(24);
    this.physics.add.existing(ember);
    ember.body.setCircle(5);
    ember.body.setVelocity(Math.cos(angle) * 170, Math.sin(angle) * 170);
    this.physics.add.overlap(this.player, ember, () => {
      ember.destroy();
      this.damagePlayer(1);
    });
    this.time.delayedCall(1500, () => ember.destroy());
  }

  touchEnemy(enemy) {
    const now = this.time.now;
    if (now < enemy.getData("touchAt")) return;
    enemy.setData("touchAt", now + 850);
    this.damagePlayer(1);
  }

  touchBoss(boss) {
    const now = this.time.now;
    if (now < boss.getData("touchAt")) return;
    boss.setData("touchAt", now + 1000);
    this.damagePlayer(2);
  }

  damagePlayer(amount) {
    const now = this.time.now;
    if (now < this.invulnerableUntil) return;
    this.invulnerableUntil = now + INVULN_TIME;
    const defeated = takeDamage(this.state, amount);
    this.cameras.main.shake(130, 0.008);
    this.updateHud();
    if (defeated) this.showGameOver();
  }

  collectItem(item) {
    const type = item.getData("type");
    if (type === "shard") {
      addShard(this.state, item.getData("id"));
      this.floatText(item.x, item.y - 18, "Shard claimed");
      item.destroy();
    } else if (type === "heart") {
      heal(this.state, 1);
      this.floatText(item.x, item.y - 18, "Healed");
      item.destroy();
    }
    this.updateHud();
  }

  updateInteractions() {
    let prompt = "";
    let action = null;
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.keys.interact) || consumeTap("interact");

    this.chests.children.iterate((chest) => {
      if (action || !chest?.active || chest.getData("opened")) return;
      if (distance(chest, this.player) < 54) {
        prompt = "Press E to open the mossbound chest";
        action = () => this.openChest(chest);
      }
    });

    this.beacons.children.iterate((beacon) => {
      if (action || !beacon?.active) return;
      if (distance(beacon, this.player) < 50) {
        prompt = "Press E to rest at the ember beacon";
        action = () => this.useBeacon(beacon);
      }
    });

    const gatePos = tileCenter(31.5, 15);
    if (!action && distance(gatePos, this.player) < 72 && !this.state.gateOpen) {
      if (!this.state.key) prompt = "The gate needs the sunken key";
      else if (this.state.shards.length < REQUIRED_SHARDS) prompt = `The gate needs ${REQUIRED_SHARDS} ember shards`;
      else {
        prompt = "Press E to open the north gate";
        action = () => this.unlockGate();
      }
    }

    ui.prompt.hidden = prompt === "";
    ui.prompt.textContent = prompt;
    if (interactPressed && action) action();
  }

  openChest(chest) {
    const id = chest.getData("id");
    if (!markChest(this.state, id)) return;
    chest.setData("opened", true);
    chest.setFrame(OBJECT_FRAME.chestOpen);
    const content = chest.getData("content");
    if (content === "key") {
      addKey(this.state);
      this.floatText(chest.x, chest.y - 22, "Sunken key found");
    } else {
      heal(this.state, content === "potion" ? 2 : 1);
      this.floatText(chest.x, chest.y - 22, "Ember salve");
    }
    this.updateHud();
  }

  useBeacon(beacon) {
    touchBeacon(this.state, beacon.getData("id"), beacon.x, beacon.y + 16);
    this.floatText(beacon.x, beacon.y - 20, "Checkpoint lit");
    this.updateHud();
  }

  unlockGate() {
    if (!this.state.key || this.state.shards.length < REQUIRED_SHARDS) return;
    openGate(this.state);
    for (const [x, y] of [
      [31, 15],
      [32, 15],
    ]) {
      this.solidLayer.removeTileAt(x, y);
      this.decorLayer.putTileAt(T.gateOpen, x, y);
    }
    this.floatText(tileCenter(31, 15).x + 16, tileCenter(31, 15).y - 20, "Gate opened");
    this.cameras.main.shake(260, 0.006);
    this.updateHud();
  }

  defeatBoss(boss) {
    markBossDefeated(this.state);
    boss.destroy();
    const relic = this.collectibles.create(boss.x, boss.y, "objects", OBJECT_FRAME.relic);
    relic.setData("type", "heart");
    relic.setDepth(12);
    this.floatText(boss.x, boss.y - 32, "Ash Warden broken");
    this.updateHud();
    this.time.delayedCall(650, () => this.showVictory());
  }

  showPause() {
    this.pausedByOverlay = true;
    this.player.setVelocity(0, 0);
    this.endMode = "resume";
    ui.endTitle.textContent = "Paused";
    ui.endMessage.textContent = "The forest waits.";
    ui.againButton.textContent = "Resume";
    ui.endScreen.hidden = false;
  }

  showGameOver() {
    this.pausedByOverlay = true;
    this.endMode = "restart";
    ui.endTitle.textContent = "Defeated";
    ui.endMessage.textContent = "The ember fades at your last beacon.";
    ui.againButton.textContent = "Try Again";
    ui.endScreen.hidden = false;
  }

  showVictory() {
    this.pausedByOverlay = true;
    this.endMode = "new";
    ui.endTitle.textContent = "Victory";
    ui.endMessage.textContent = "The Ash Warden falls, and the Emberwild breathes again.";
    ui.againButton.textContent = "New Adventure";
    ui.endScreen.hidden = false;
  }

  restartFromSave() {
    this.scene.restart();
    ui.endScreen.hidden = true;
    this.time.delayedCall(0, () => this.startAdventure());
  }

  newAdventure() {
    clearSave();
    this.scene.restart();
    ui.endScreen.hidden = true;
    ui.menu.hidden = false;
  }

  floatText(x, y, text) {
    const label = this.add.text(x, y, text, {
      color: "#ffe7b2",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "13px",
      fontStyle: "700",
      stroke: "#101817",
      strokeThickness: 4,
    });
    label.setOrigin(0.5).setDepth(40);
    this.tweens.add({
      targets: label,
      y: y - 24,
      alpha: 0,
      duration: 900,
      ease: "sine.out",
      onComplete: () => label.destroy(),
    });
  }

  updateAreaName() {
    let name = "Mosswake Hollow";
    if (this.player.y < 520) name = "North Ruin";
    else if (this.player.x > 1470) name = "Mistglass Stream";
    else if (this.player.x < 520 && this.player.y < 760) name = "Rootfall Thicket";
    else if (this.player.y > 1020) name = "Southwatch Grove";
    if (name !== this.state.areaName) {
      this.state.areaName = name;
      ui.areaName.textContent = name;
    }
  }

  updateHud() {
    ui.healthFill.style.transform = `scaleX(${Math.max(0, this.state.health / MAX_HEALTH)})`;
    ui.emberFill.style.transform = `scaleX(${Math.max(0, this.state.ember / 99)})`;
    ui.shardCount.textContent = `Shards ${this.state.shards.length}/${REQUIRED_SHARDS}`;
    ui.keyStatus.textContent = this.state.key ? "Key ready" : "Key -";
    ui.areaName.textContent = this.state.areaName;
    ui.objective.textContent = this.state.objective;
  }
}

function bindUi(game) {
  ui.startButton.addEventListener("click", () => {
    const scene = game.scene.getScene("emberwild");
    if (scene) scene.startAdventure();
  });

  ui.resetButton.addEventListener("click", () => {
    clearSave();
    const scene = game.scene.getScene("emberwild");
    if (scene) scene.scene.restart();
  });

  ui.againButton.addEventListener("click", () => {
    const scene = game.scene.getScene("emberwild");
    if (!scene) return;
    if (scene.endMode === "resume") {
      scene.pausedByOverlay = false;
      ui.endScreen.hidden = true;
      return;
    }
    if (scene.endMode === "new") {
      scene.newAdventure();
      return;
    }
    scene.state.health = MAX_HEALTH;
    saveState(scene.state);
    scene.restartFromSave();
  });

  ui.journalToggle.addEventListener("click", () => {
    ui.journal.hidden = !ui.journal.hidden;
  });

  for (const button of document.querySelectorAll("[data-hold]")) {
    const action = button.dataset.hold;
    const set = (value) => {
      touchState[action] = value;
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      set(true);
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener("pointerup", () => set(false));
    button.addEventListener("pointercancel", () => set(false));
    button.addEventListener("lostpointercapture", () => set(false));
  }

  for (const button of document.querySelectorAll("[data-tap]")) {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      touchState.taps.add(button.dataset.tap);
    });
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-shell",
  backgroundColor: "#101817",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  render: {
    antialias: false,
    pixelArt: true,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      fps: 60,
    },
  },
  scene: [EmberScene],
});

bindUi(game);
