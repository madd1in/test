(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const hud = {
    score: document.getElementById("score"),
    hull: document.getElementById("hull"),
    heat: document.getElementById("heat"),
    wave: document.getElementById("wave"),
    chain: document.getElementById("chain"),
    best: document.getElementById("best"),
  };
  const menu = document.getElementById("menu");
  const banner = document.getElementById("banner");
  const startButton = document.getElementById("startButton");
  const muteButton = document.getElementById("muteButton");
  const motionButton = document.getElementById("motionButton");
  const bgm = document.getElementById("bgm");

  const W = 1280;
  const H = 720;
  const TAU = Math.PI * 2;
  const PLAYER_MAX_HULL = 120;
  const SHIP_GAMMA_FILTER = "brightness(2.05) contrast(1.28) saturate(1.24)";
  const SHIP_GLOW_FILTER = "brightness(2.7) contrast(1.12) saturate(1.38) blur(0.45px)";
  const rand = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const dist2 = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  };

  const assets = {
    bg: loadImage("assets/generated/rift-loop-bg-tile.png"),
    sheet: loadImage("assets/generated/rift-asset-sheet-alpha.png"),
    props: loadImage("assets/generated/rift-props-sheet-alpha.png"),
    fx: loadImage("assets/generated/rift-projectiles-sheet-alpha.png"),
    boom: loadImage("assets/generated/rift-explosions-sheet-alpha.png"),
    shards: loadImage("assets/generated/rift-shards-sheet-alpha.png"),
    orbs: loadImage("assets/generated/rift-orbs-sheet-alpha.png"),
    rings: loadImage("assets/generated/rift-ring-sheet-alpha.png"),
    chrome: loadImage("assets/generated/rift-ui-chrome-sheet-alpha.png"),
    fontAtlas: loadImage("assets/generated/rift-font-atlas.png"),
  };

  const clips = {
    player: [50, 58, 420, 172],
    droneA: [542, 62, 282, 150],
    droneB: [884, 56, 308, 172],
    droneC: [1210, 70, 278, 146],
    boss: [508, 258, 918, 238],
    shield: [42, 736, 176, 176],
    blueBolt: [68, 532, 520, 98],
    redBolt: [780, 526, 570, 110],
    missileBlue: [55, 650, 520, 100],
    missileRed: [790, 650, 590, 100],
    explosions: [
      [252, 752, 128, 132],
      [408, 734, 190, 168],
      [622, 724, 252, 190],
      [898, 716, 282, 202],
      [1192, 706, 286, 220],
    ],
  };
  const PROP = 362;
  const propClips = {
    frigate: [0, 0, PROP, PROP],
    needle: [PROP, 0, PROP, PROP],
    carrier: [PROP * 2, 0, PROP, PROP],
    mine: [PROP * 3, 0, PROP, PROP],
    asteroidDark: [0, PROP, PROP, PROP],
    asteroidOre: [PROP, PROP, PROP, PROP],
    asteroidIce: [PROP * 2, PROP, PROP, PROP],
    relay: [PROP * 3, PROP, PROP, PROP],
    core: [0, PROP * 2, PROP, PROP],
    battery: [PROP, PROP * 2, PROP, PROP],
    blackHole: [PROP * 2, PROP * 2, PROP, PROP],
    crate: [PROP * 3, PROP * 2, PROP, PROP],
  };
  const FX_W = 384;
  const FX_H = 256;
  const fxClips = {
    pulse: [0, 0, FX_W, FX_H],
    spear: [FX_W, 0, FX_W, FX_H],
    lance: [FX_W * 2, 0, FX_W, FX_H],
    muzzle: [FX_W * 3, 0, FX_W, FX_H],
    enemyOrb: [0, FX_H, FX_W, FX_H],
    enemyShard: [FX_W, FX_H, FX_W, FX_H],
    enemyMissile: [FX_W * 2, FX_H, FX_W, FX_H],
    minePellet: [FX_W * 3, FX_H, FX_W, FX_H],
    droneBolt: [0, FX_H * 2, FX_W, FX_H],
    repairSpark: [FX_W, FX_H * 2, FX_W, FX_H],
    scoreShard: [FX_W * 2, FX_H * 2, FX_W, FX_H],
    heatVent: [FX_W * 3, FX_H * 2, FX_W, FX_H],
    impact: [0, FX_H * 3, FX_W, FX_H],
    explosion: [FX_W, FX_H * 3, FX_W, FX_H],
    deflect: [FX_W * 2, FX_H * 3, FX_W, FX_H],
    gravityRipple: [FX_W * 3, FX_H * 3, FX_W, FX_H],
  };
  const BOOM_W = 384;
  const BOOM_H = 1024 / 3;
  const boomClips = {
    impactTeal: [0, 0, BOOM_W, BOOM_H],
    impactAmber: [BOOM_W, 0, BOOM_W, BOOM_H],
    shieldCrack: [BOOM_W * 2, 0, BOOM_W, BOOM_H],
    plasmaBurst: [BOOM_W * 3, 0, BOOM_W, BOOM_H],
    medium: [
      [0, BOOM_H, BOOM_W, BOOM_H],
      [BOOM_W, BOOM_H, BOOM_W, BOOM_H],
      [BOOM_W * 2, BOOM_H, BOOM_W, BOOM_H],
      [BOOM_W * 3, BOOM_H, BOOM_W, BOOM_H],
    ],
    large: [
      [0, BOOM_H * 2, BOOM_W, BOOM_H],
      [BOOM_W, BOOM_H * 2, BOOM_W, BOOM_H],
      [BOOM_W * 2, BOOM_H * 2, BOOM_W, BOOM_H],
      [BOOM_W * 3, BOOM_H * 2, BOOM_W, BOOM_H],
    ],
  };
  const SHARD_W = 384;
  const SHARD_H = 1024 / 3;
  const shardClips = {
    cyan: [0, 0, SHARD_W, SHARD_H],
    amber: [SHARD_W, 0, SHARD_W, SHARD_H],
    rose: [SHARD_W * 2, 0, SHARD_W, SHARD_H],
    white: [SHARD_W * 3, 0, SHARD_W, SHARD_H],
    orbit: [0, SHARD_H, SHARD_W, SHARD_H],
    core: [SHARD_W, SHARD_H, SHARD_W, SHARD_H],
    scoreCore: [SHARD_W * 2, SHARD_H, SHARD_W, SHARD_H],
    emberCore: [SHARD_W * 3, SHARD_H, SHARD_W, SHARD_H],
    trail: [0, SHARD_H * 2, SHARD_W, SHARD_H],
    vortex: [SHARD_W, SHARD_H * 2, SHARD_W, SHARD_H],
    glint: [SHARD_W * 2, SHARD_H * 2, SHARD_W, SHARD_H],
    bloomWave: [SHARD_W * 3, SHARD_H * 2, SHARD_W, SHARD_H],
  };
  const ORB_W = 384;
  const ORB_H = 1024 / 3;
  const orbClips = {
    blueSmall: [0, 0, ORB_W, ORB_H],
    blueMed: [ORB_W, 0, ORB_W, ORB_H],
    blueLarge: [ORB_W * 2, 0, ORB_W, ORB_H],
    blueHuge: [ORB_W * 3, 0, ORB_W, ORB_H],
    redSmall: [0, ORB_H, ORB_W, ORB_H],
    redMed: [ORB_W, ORB_H, ORB_W, ORB_H],
    redLarge: [ORB_W * 2, ORB_H, ORB_W, ORB_H],
    redHuge: [ORB_W * 3, ORB_H, ORB_W, ORB_H],
    blueCrack: [0, ORB_H * 2, ORB_W, ORB_H],
    redCrack: [ORB_W, ORB_H * 2, ORB_W, ORB_H],
    twin: [ORB_W * 2, ORB_H * 2, ORB_W, ORB_H],
    cluster: [ORB_W * 3, ORB_H * 2, ORB_W, ORB_H],
  };
  const RING_W = 384;
  const RING_H = 384;
  const ringClips = {
    player: [0, 0, RING_W, RING_H],
    drone: [RING_W, 0, RING_W, RING_H],
    chargeCyan: [RING_W * 2, 0, RING_W, RING_H],
    chargeAmber: [RING_W * 3, 0, RING_W, RING_H],
    enemy: [0, RING_H, RING_W, RING_H],
    boss: [RING_W, RING_H, RING_W, RING_H],
    asteroid: [RING_W * 2, RING_H, RING_W, RING_H],
    mine: [RING_W * 3, RING_H, RING_W, RING_H],
    relay: [0, RING_H * 2, RING_W, RING_H],
    blackHole: [RING_W, RING_H * 2, RING_W, RING_H],
    pickupAmber: [RING_W * 2, RING_H * 2, RING_W, RING_H],
    pickupCyan: [RING_W * 3, RING_H * 2, RING_W, RING_H],
  };
  const bitmapChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%-:";
  const bitmapLookup = new Map([...bitmapChars].map((char, index) => [char, index]));
  const BITMAP_FONT_COLS = 8;
  const BITMAP_GLYPH_W = 0.74;

  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false,
    charge: false,
    drone: false,
  };

  const state = {
    running: false,
    over: false,
    muted: false,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    time: 0,
    last: 0,
    shake: 0,
    flash: 0,
    score: 0,
    best: Number(localStorage.getItem("rift-lance-best") || 0),
    chain: 0,
    chainTimer: 0,
    wave: 1,
    spawnTimer: 0,
    hazardTimer: 0,
    assistTimer: 8,
    bossTimer: 60,
    nextWaveScore: 2200,
    bannerTimer: 0,
    bannerText: "RIFT LANCE",
  };

  const player = {
    x: 160,
    y: H * 0.5,
    vx: 0,
    vy: 0,
    r: 12,
    hull: PLAYER_MAX_HULL,
    heat: 0,
    fireTimer: 0,
    charge: 0,
    invuln: 0,
    droneMode: "orbit",
    droneCooldown: 0,
  };

  const drone = {
    x: 215,
    y: H * 0.5,
    vx: 0,
    vy: 0,
    r: 9,
    angle: 0,
    fireTimer: 0,
    recall: 0,
  };

  const bullets = [];
  const enemyBullets = [];
  const enemies = [];
  const particles = [];
  const pickups = [];
  const stars = Array.from({ length: 150 }, () => ({
    x: rand(0, W),
    y: rand(0, H),
    z: rand(0.15, 1),
    c: Math.random() > 0.78 ? "#ffbc55" : Math.random() > 0.5 ? "#54f3ff" : "#ffffff",
  }));

  function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  function waitForImage(img) {
    if (img.complete && img.naturalWidth) return Promise.resolve();
    return new Promise((resolve) => {
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener("error", resolve, { once: true });
    });
  }

  function waitForAssets() {
    return Promise.all(Object.values(assets).map(waitForImage));
  }

  function setGuiText(el, text, variant = "") {
    if (!el) return;
    const raw = String(text);
    const value = raw.toUpperCase();
    if (el.dataset.bitmapValue === value) return;
    el.dataset.bitmapValue = value;
    el.setAttribute("aria-label", raw);
    el.classList.add("bitmap-text");
    if (variant) el.classList.add(`bitmap-text--${variant}`);
    const fragment = document.createDocumentFragment();
    for (const char of value) {
      if (char === " ") {
        const space = document.createElement("span");
        space.className = "bitmap-space";
        space.setAttribute("aria-hidden", "true");
        fragment.appendChild(space);
        continue;
      }
      const index = bitmapLookup.get(char);
      if (index === undefined) continue;
      const glyph = document.createElement("span");
      glyph.className = "bitmap-glyph";
      glyph.style.setProperty("--mask-x", `${-(index % BITMAP_FONT_COLS) * BITMAP_GLYPH_W}em`);
      glyph.style.setProperty("--mask-y", `-${Math.floor(index / BITMAP_FONT_COLS)}em`);
      glyph.setAttribute("aria-hidden", "true");
      fragment.appendChild(glyph);
    }
    el.replaceChildren(fragment);
  }

  function hydrateGuiText() {
    setGuiText(document.querySelector(".hud__brand"), "Rift Lance", "brand");
    for (const label of document.querySelectorAll(".hud span")) setGuiText(label, label.textContent, "label");
    for (const label of document.querySelectorAll(".menu__status span")) setGuiText(label, label.textContent, "status");
    for (const button of document.querySelectorAll(".touch button")) setGuiText(button, button.textContent, "touch");
    setGuiText(startButton, "Launch", "button");
    setGuiText(muteButton, state.muted ? "Muted" : "Audio", "button");
    setGuiText(motionButton, state.reducedMotion ? "Calm" : "Motion", "button");
    setGuiText(banner, state.bannerText, "banner");
  }

  function setBanner(text, seconds = 1.4) {
    state.bannerText = text;
    state.bannerTimer = seconds;
    setGuiText(banner, text, "banner");
    banner.classList.add("is-live");
  }

  function startGame() {
    resetRun();
    state.running = true;
    state.over = false;
    menu.classList.add("is-hidden");
    setBanner("WAVE 01", 1.2);
    playMusic();
  }

  function resetRun() {
    bullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    pickups.length = 0;
    Object.assign(player, {
      x: 160,
      y: H * 0.5,
      vx: 0,
      vy: 0,
      hull: PLAYER_MAX_HULL,
      heat: 0,
      fireTimer: 0,
      charge: 0,
      invuln: 1.4,
      droneMode: "orbit",
      droneCooldown: 0,
    });
    Object.assign(drone, { x: 215, y: H * 0.5, vx: 0, vy: 0, angle: 0, fireTimer: 0, recall: 0 });
    Object.assign(state, {
      time: 0,
      shake: 0,
      flash: 0,
      score: 0,
      chain: 0,
      chainTimer: 0,
      wave: 1,
      spawnTimer: 0.85,
      hazardTimer: 2.4,
      assistTimer: 8,
      bossTimer: 58,
      nextWaveScore: 2200,
    });
    updateHud();
  }

  function playMusic() {
    if (state.muted) return;
    bgm.volume = 0.58;
    bgm.play().catch(() => {});
  }

  function toggleMute() {
    state.muted = !state.muted;
    muteButton.setAttribute("aria-pressed", String(state.muted));
    setGuiText(muteButton, state.muted ? "Muted" : "Audio", "button");
    bgm.muted = state.muted;
    if (!state.muted && state.running) playMusic();
  }

  function toggleMotion() {
    state.reducedMotion = !state.reducedMotion;
    motionButton.setAttribute("aria-pressed", String(state.reducedMotion));
    setGuiText(motionButton, state.reducedMotion ? "Calm" : "Motion", "button");
  }

  function addScore(amount) {
    state.score += amount;
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem("rift-lance-best", String(state.best));
    }
    if (state.score >= state.nextWaveScore) {
      state.wave += 1;
      state.nextWaveScore += 1800 + state.wave * 620;
      setBanner(`WAVE ${String(state.wave).padStart(2, "0")}`, 1.1);
      burst(player.x + 80, player.y, "#bfff75", 20, 1.8);
    }
  }

  function updateHud() {
    setGuiText(hud.score, String(Math.floor(state.score)), "value");
    setGuiText(hud.hull, String(Math.max(0, Math.ceil(player.hull))), "value");
    setGuiText(hud.heat, `${Math.round(player.heat)}%`, "value");
    setGuiText(hud.wave, String(state.wave).padStart(2, "0"), "value");
    setGuiText(hud.chain, String(state.chain), "value");
    setGuiText(hud.best, String(Math.floor(state.best)), "value");
  }

  function update(dt) {
    state.time += dt;
    state.shake = Math.max(0, state.shake - dt * 8);
    state.flash = Math.max(0, state.flash - dt * 3.4);
    if (state.chainTimer > 0) {
      state.chainTimer -= dt;
      if (state.chainTimer <= 0) state.chain = 0;
    }
    if (state.bannerTimer > 0) {
      state.bannerTimer -= dt;
      if (state.bannerTimer <= 0) banner.classList.remove("is-live");
    }
    if (!state.running) return;

    updatePlayer(dt);
    updateDrone(dt);
    updateBullets(dt);
    updateEnemies(dt);
    updatePickups(dt);
    updateParticles(dt);
    spawnDirector(dt);
    checkCollisions();
    updateHud();
  }

  function updatePlayer(dt) {
    const ax = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const ay = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const speed = input.charge ? 390 : 540;
    player.vx += (ax * speed - player.vx) * Math.min(1, dt * 12);
    player.vy += (ay * speed - player.vy) * Math.min(1, dt * 12);
    player.x = clamp(player.x + player.vx * dt, 56, W * 0.48);
    player.y = clamp(player.y + player.vy * dt, 88, H - 72);
    player.fireTimer -= dt;
    player.droneCooldown = Math.max(0, player.droneCooldown - dt);
    player.invuln = Math.max(0, player.invuln - dt);

    if (input.charge) {
      player.charge = clamp(player.charge + dt * 64, 0, 100);
      player.heat = clamp(player.heat + dt * 15, 0, 100);
    } else {
      if (player.charge > 34) fireLance();
      player.charge = Math.max(0, player.charge - dt * 120);
      player.heat = Math.max(0, player.heat - dt * 32);
    }

    if (input.fire && player.fireTimer <= 0 && player.heat < 96) {
      fireBolt(player.x + 54, player.y - 3, 910, 0, 18, "#54f3ff", 12, "player", "pulse");
      fireBolt(player.x + 34, player.y + 16, 830, 18, 11, "#bfff75", 8, "player", "spear");
      particles.push({ x: player.x + 60, y: player.y, vx: -90, vy: 0, life: 0.12, radius: 22, color: "#54f3ff", alpha: 0.65, art: "muzzle" });
      player.fireTimer = 0.082;
      player.heat = clamp(player.heat + 2.6, 0, 100);
    }

    if (input.drone && player.droneCooldown <= 0) {
      player.droneMode = player.droneMode === "orbit" ? "strike" : "orbit";
      player.droneCooldown = 0.36;
      setBanner(player.droneMode === "orbit" ? "DRONE GUARD" : "DRONE STRIKE", 0.8);
    }

    if (!input.charge && !input.fire) {
      player.heat = Math.max(0, player.heat - dt * 24);
    }

    addTrail(player.x - 20, player.y, "#54f3ff", 0.42);
  }

  function updateDrone(dt) {
    drone.fireTimer -= dt;
    drone.angle += dt * 4.2;
    if (player.droneMode === "orbit") {
      const targetX = player.x + Math.cos(drone.angle) * 56 + 50;
      const targetY = player.y + Math.sin(drone.angle * 1.5) * 42;
      drone.vx += (targetX - drone.x) * dt * 22;
      drone.vy += (targetY - drone.y) * dt * 22;
      drone.vx *= 0.82;
      drone.vy *= 0.82;
    } else {
      const target = enemies.filter((enemy) => enemy.x > player.x).sort((a, b) => dist2(drone, a) - dist2(drone, b))[0];
      const targetX = target ? target.x - 46 : W - 180;
      const targetY = target ? target.y : player.y;
      drone.vx += (targetX - drone.x) * dt * 9;
      drone.vy += (targetY - drone.y) * dt * 9;
      drone.vx *= 0.88;
      drone.vy *= 0.88;
    }
    drone.x = clamp(drone.x + drone.vx * dt, 70, W - 96);
    drone.y = clamp(drone.y + drone.vy * dt, 76, H - 70);
    if ((input.fire || player.droneMode === "strike") && drone.fireTimer <= 0) {
      fireBolt(drone.x + 20, drone.y, 800, rand(-20, 20), 10, "#ffbc55", 7, "player", "droneBolt");
      drone.fireTimer = player.droneMode === "strike" ? 0.16 : 0.25;
    }
  }

  function fireBolt(x, y, vx, vy, damage, color, radius, owner, art = "pulse") {
    bullets.push({ x, y, vx, vy, damage, color, radius, owner, life: 1.4, kind: "bolt", art });
  }

  function fireLance() {
    const power = player.charge / 100;
    bullets.push({
      x: player.x + 65,
      y: player.y,
      vx: 1180,
      vy: 0,
      damage: 62 + power * 120,
      color: power > 0.78 ? "#ffbc55" : "#54f3ff",
      radius: 20 + power * 20,
      owner: "player",
      life: 0.52,
      kind: "lance",
      art: "lance",
      pierce: 5 + Math.floor(power * 5),
    });
    player.charge = 0;
    player.heat = clamp(player.heat + 18, 0, 100);
    state.flash = 0.8;
    state.shake = state.reducedMotion ? 0.1 : 0.45;
    spawnShardSpray(player.x + 70, player.y, 6, power > 0.78 ? "hot" : "cyan");
  }

  function updateBullets(dt) {
    for (const list of [bullets, enemyBullets]) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const b = list[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        if (b.life <= 0 || b.x < -120 || b.x > W + 220 || b.y < -120 || b.y > H + 120) {
          list.splice(i, 1);
        }
      }
    }
  }

  function spawnDirector(dt) {
    state.spawnTimer -= dt;
    state.hazardTimer -= dt;
    state.assistTimer -= dt;
    state.bossTimer -= dt;
    if (state.spawnTimer <= 0) {
      const count = state.wave > 4 && Math.random() < 0.72 ? 2 : 1;
      for (let i = 0; i < count; i += 1) spawnEnemy();
      state.spawnTimer = clamp(1.18 - state.wave * 0.045, 0.48, 1.18);
    }
    if (state.hazardTimer <= 0) {
      spawnHazard();
      state.hazardTimer = rand(1.7, 3.25);
    }
    if (state.assistTimer <= 0) {
      if (player.hull < PLAYER_MAX_HULL * 0.55 || player.heat > 72) {
        pickups.push({
          kind: player.heat > 72 ? "battery" : "core",
          x: W + 80,
          y: clamp(player.y + rand(-120, 120), 110, H - 90),
          r: 16,
          t: 0,
        });
        setBanner("SUPPLY DRIFT", 0.7);
      }
      state.assistTimer = rand(10, 15);
    }
    if (state.bossTimer <= 0 && !enemies.some((e) => e.kind === "boss")) {
      spawnBoss();
      state.bossTimer = 68 + state.wave * 7;
      setBanner("RIFT CRUISER", 1.4);
    }
  }

  function spawnEnemy() {
    const kinds = state.wave < 2
      ? ["skimmer", "skimmer", "blade", "turret"]
      : state.wave < 4
        ? ["skimmer", "blade", "turret", "needle", "frigate"]
        : ["skimmer", "blade", "turret", "needle", "frigate", "carrier"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const y = rand(100, H - 92);
    const waveBoost = Math.min(5, state.wave);
    const enemy = {
      kind,
      x: W + rand(40, 240),
      y,
      baseY: y,
      vx: -rand(210, 330) - waveBoost * 24,
      vy: rand(-55, 55),
      r: kind === "blade" ? 16 : 15,
      hp: kind === "turret" ? 42 + state.wave * 6 : 26 + state.wave * 5,
      maxHp: 1,
      t: rand(0, TAU),
      shot: rand(0.45, 1.4),
      value: kind === "turret" ? 240 : 150,
    };
    if (kind === "needle") {
      Object.assign(enemy, {
        vx: -rand(420, 560) - waveBoost * 34,
        vy: rand(-120, 120),
        r: 13,
        hp: 20 + state.wave * 4,
        value: 220,
        art: "needle",
      });
    } else if (kind === "frigate") {
      Object.assign(enemy, {
        vx: -rand(120, 180) - waveBoost * 10,
        vy: rand(-25, 25),
        r: 25,
        hp: 98 + state.wave * 22,
        shot: rand(0.35, 0.9),
        value: 520,
        art: "frigate",
      });
    } else if (kind === "carrier") {
      Object.assign(enemy, {
        vx: -rand(95, 145) - waveBoost * 8,
        vy: rand(-35, 35),
        r: 29,
        hp: 126 + state.wave * 28,
        shot: rand(0.7, 1.2),
        value: 680,
        art: "carrier",
      });
    }
    enemy.maxHp = enemy.hp;
    enemies.push(enemy);
  }

  function spawnEscort(x, y) {
    const escort = {
      kind: "escort",
      x,
      y,
      baseY: y,
      vx: -rand(300, 400) - state.wave * 12,
      vy: rand(-90, 90),
      r: 12,
      hp: 24 + state.wave * 4,
      maxHp: 24 + state.wave * 4,
      t: rand(0, TAU),
      shot: rand(0.5, 1.1),
      value: 120,
    };
    enemies.push(escort);
  }

  function spawnHazard() {
    const roll = Math.random();
    const asteroidArts = ["asteroidDark", "asteroidOre", "asteroidIce"];
    let hazard;
    if (roll < 0.48) {
      const r = rand(16, 31);
      const hp = 20 + r * 0.62 + state.wave * 5;
      hazard = {
        kind: "asteroid",
        art: asteroidArts[Math.floor(Math.random() * asteroidArts.length)],
        x: W + 100,
        y: rand(120, H - 80),
        vx: -rand(250, 430) - state.wave * 10,
        vy: rand(-40, 40),
        r,
        hp,
        maxHp: hp,
        rot: rand(0, TAU),
        spin: rand(-2.5, 2.5),
        value: 110,
      };
    } else if (roll < 0.72) {
      hazard = {
        kind: "mine",
        art: "mine",
        x: W + 110,
        y: rand(110, H - 86),
        vx: -rand(120, 190) - state.wave * 8,
        vy: rand(-20, 20),
        r: 22,
        hp: 38 + state.wave * 6,
        maxHp: 38 + state.wave * 6,
        t: rand(0, TAU),
        shot: 0.9,
        value: 260,
      };
    } else if (roll < 0.9) {
      hazard = {
        kind: "relay",
        art: "relay",
        x: W + 140,
        y: rand(125, H - 100),
        vx: -rand(150, 230),
        vy: rand(-18, 18),
        r: 28,
        hp: 54 + state.wave * 9,
        maxHp: 54 + state.wave * 9,
        rot: rand(-0.35, 0.35),
        spin: rand(-0.45, 0.45),
        value: 360,
      };
    } else {
      hazard = {
        kind: "blackHole",
        art: "blackHole",
        x: W + 120,
        y: rand(150, H - 130),
        vx: -rand(90, 135),
        vy: rand(-10, 10),
        r: 33,
        hp: 78 + state.wave * 13,
        maxHp: 78 + state.wave * 13,
        t: 0,
        value: 620,
      };
    }
    enemies.push(hazard);
  }

  function spawnBoss() {
    enemies.push({
      kind: "boss",
      x: W + 280,
      y: H * 0.5,
      vx: -120,
      vy: 0,
      r: 57,
      hp: 650 + state.wave * 145,
      maxHp: 650 + state.wave * 145,
      t: 0,
      shot: 0.8,
      value: 2400,
    });
  }

  function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const e = enemies[i];
      e.t = (e.t || 0) + dt;
      if (e.hp <= 0) {
        killEnemy(e, i);
        continue;
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.kind === "skimmer") {
        e.y = e.baseY + Math.sin(e.t * 5.2) * 44;
      } else if (e.kind === "blade") {
        e.vy += Math.sin(e.t * 7) * dt * 120;
      } else if (e.kind === "turret") {
        e.vy += (player.y - e.y) * dt * 0.7;
        e.shot -= dt;
        if (e.shot <= 0) {
          enemyShot(e.x - 35, e.y, -420, (player.y - e.y) * 1.2, "enemyOrb");
          e.shot = clamp(1.28 - state.wave * 0.045, 0.58, 1.28);
        }
      } else if (e.kind === "escort") {
        e.y = e.baseY + Math.sin(e.t * 7.6) * 32;
        e.shot -= dt;
        if (e.shot <= 0) {
          enemyShot(e.x - 28, e.y, -500, (player.y - e.y) * 1.4, "enemyShard");
          e.shot = clamp(1.22 - state.wave * 0.032, 0.58, 1.22);
        }
      } else if (e.kind === "needle") {
        e.vy += Math.sin(e.t * 9.2) * dt * 180;
        if (Math.abs(e.y - player.y) < 42) e.vx -= dt * 190;
      } else if (e.kind === "frigate") {
        e.vy += (player.y - e.y) * dt * 0.36;
        e.shot -= dt;
        if (e.shot <= 0) {
          [-0.34, 0.34].forEach((spread) => enemyShot(e.x - 58, e.y + spread * 52, -520, (player.y - e.y) * 0.82 + spread * 190, "enemyShard"));
          e.shot = clamp(1.15 - state.wave * 0.026, 0.6, 1.15);
        }
      } else if (e.kind === "carrier") {
        e.y = e.baseY + Math.sin(e.t * 2.1) * 56;
        e.shot -= dt;
        if (e.shot <= 0) {
          spawnEscort(e.x - 70, e.y - 42);
          spawnEscort(e.x - 74, e.y + 42);
          enemyShot(e.x - 70, e.y, -480, (player.y - e.y) * 1.05, "enemyMissile");
          e.shot = clamp(2.7 - state.wave * 0.065, 1.55, 2.7);
        }
      } else if (e.kind === "boss") {
        e.vx += ((W - 210) - e.x) * dt * 0.26;
        e.vx = clamp(e.vx, -130, 40);
        e.y = H * 0.5 + Math.sin(e.t * 1.8) * 155;
        e.shot -= dt;
        if (e.shot <= 0) {
          const lanes = [-86, 0, 86];
          lanes.forEach((lane) => enemyShot(e.x - 170, e.y + lane, -500, (player.y - e.y - lane) * 0.85, "enemyMissile"));
          e.shot = clamp(1.12 - state.wave * 0.024, 0.64, 1.12);
        }
      } else if (e.kind === "asteroid") {
        e.rot += e.spin * dt;
      } else if (e.kind === "mine") {
        e.t += dt;
        e.shot -= dt;
        if (dist2(e, player) < 220 * 220 && e.shot <= 0) {
          for (let a = 0; a < TAU; a += TAU / 8) {
            enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(a) * 330 - 140,
              vy: Math.sin(a) * 330,
              damage: 7,
              radius: 8,
              color: "#ff4d76",
              art: "minePellet",
              life: 1.5,
            });
          }
          e.shot = 2.0;
          burst(e.x, e.y, "#ff4d76", 12, 1);
        }
      } else if (e.kind === "relay") {
        e.rot += e.spin * dt;
      } else if (e.kind === "blackHole") {
        e.t += dt;
        applyGravityWell(e, dt);
      }
      if (!state.reducedMotion && e.x > -40 && e.x < W + 80 && Math.random() < dt * 5.4) {
        const hot = e.kind === "mine" || e.kind === "boss" || e.kind === "carrier";
        particles.push({
          x: e.x + e.r * 0.75,
          y: e.y + rand(-e.r * 0.45, e.r * 0.45),
          vx: rand(45, 120),
          vy: rand(-18, 18),
          life: rand(0.14, 0.3),
          radius: rand(2, 6),
          color: hot ? "#ffbc55" : "#ff4d76",
          alpha: 0.34,
        });
      }
      if (e.x < -260 || e.y < -160 || e.y > H + 160) enemies.splice(i, 1);
    }
  }

  function applyGravityWell(well, dt) {
    const pull = (body, strength) => {
      const dx = well.x - body.x;
      const dy = well.y - body.y;
      const d = Math.max(80, Math.hypot(dx, dy));
      if (d > 280) return;
      const force = strength * (1 - d / 280) * dt;
      body.vx = (body.vx || 0) + (dx / d) * force;
      body.vy = (body.vy || 0) + (dy / d) * force;
    };
    pull(player, 520);
    pull(drone, 360);
    for (const b of bullets) pull(b, 260);
    for (const b of enemyBullets) pull(b, 160);
  }

  function enemyShot(x, y, vx, vy, art = "enemyOrb") {
    const mag = Math.hypot(vx, vy) || 1;
    enemyBullets.push({
      x,
      y,
      vx: (vx / mag) * 365,
      vy: (vy / mag) * 365,
      damage: art === "enemyMissile" ? 10 : 8,
      radius: 10,
      color: "#ff4d76",
      art,
      life: 2.3,
    });
  }

  function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i -= 1) {
      const p = pickups[i];
      p.x -= (210 + state.wave * 8) * dt;
      p.y += Math.sin(state.time * 6 + p.x * 0.01) * dt * 36;
      p.t += dt;
      if (p.x < -50) pickups.splice(i, 1);
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - dt * 1.8;
      p.vy *= 1 - dt * 1.8;
      if (p.spin) p.rot = (p.rot || 0) + p.spin * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function spawnImpact(x, y, kind = "impactTeal", size = 58) {
    particles.push({
      x,
      y,
      vx: rand(-18, 18),
      vy: rand(-18, 18),
      life: 0.24,
      maxLife: 0.24,
      size,
      alpha: 0.95,
      boom: kind,
      rot: rand(0, TAU),
    });
  }

  function spawnExplosion(x, y, size = 96, kind = "medium") {
    const life = kind === "large" ? 0.72 : 0.48;
    particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life,
      maxLife: life,
      size,
      alpha: 0.98,
      boom: kind,
      rot: rand(-0.28, 0.28),
    });
  }

  function spawnShardSpray(x, y, count = 5, mood = "cyan") {
    if (state.reducedMotion) return;
    const options = mood === "hot" ? ["amber", "emberCore", "rose"] : ["cyan", "white", "glint", "trail"];
    for (let i = 0; i < count; i += 1) {
      const angle = rand(-Math.PI * 0.92, Math.PI * 0.92);
      const speed = rand(70, 260);
      particles.push({
        x: x + rand(-12, 12),
        y: y + rand(-12, 12),
        vx: Math.cos(angle) * speed - 80,
        vy: Math.sin(angle) * speed,
        life: rand(0.34, 0.78),
        maxLife: 0.78,
        size: rand(18, 34),
        alpha: 0.86,
        shard: options[Math.floor(Math.random() * options.length)],
        rot: rand(0, TAU),
        spin: rand(-7, 7),
      });
    }
  }

  function triggerRiftBloom() {
    setBanner("RIFT BLOOM", 1.05);
    addScore(480);
    enemyBullets.length = 0;
    state.flash = Math.max(state.flash, 0.78);
    state.shake = state.reducedMotion ? 0.12 : Math.max(state.shake, 0.58);
    spawnExplosion(player.x + 116, player.y, 190, "large");
    particles.push({
      x: player.x + 130,
      y: player.y,
      vx: 0,
      vy: 0,
      life: 0.64,
      maxLife: 0.64,
      size: 250,
      alpha: 0.82,
      shard: "bloomWave",
      rot: 0,
      spin: 0.8,
    });
    spawnShardSpray(player.x + 120, player.y, 14, "cyan");
    burst(player.x + 110, player.y, "#54f3ff", 34, 1.9);
    for (const e of enemies) {
      if (e.x < player.x - 80) continue;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      const falloff = clamp(1.15 - d / 920, 0.35, 1);
      e.hp -= (e.kind === "boss" ? 96 : 142) * falloff;
      spawnImpact(e.x, e.y, e.kind === "blackHole" ? "plasmaBurst" : "impactAmber", e.kind === "boss" ? 92 : 58);
    }
    state.chain = 0;
    state.chainTimer = 0;
  }

  function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const b = bullets[i];
      for (let j = enemies.length - 1; j >= 0; j -= 1) {
        const e = enemies[j];
        const hitRadius = b.radius + e.r * (e.kind === "boss" ? 1.05 : 0.85);
        if (dist2(b, e) < hitRadius * hitRadius) {
          e.hp -= b.damage;
          spawnImpact(b.x, b.y, e.kind === "blackHole" ? "plasmaBurst" : b.kind === "lance" ? "impactAmber" : "impactTeal", b.kind === "lance" ? 74 : 52);
          burst(b.x, b.y, b.color, b.kind === "lance" ? 10 : 4, b.kind === "lance" ? 1.2 : 0.6);
          if (b.kind !== "lance" || --b.pierce <= 0) bullets.splice(i, 1);
          if (e.hp <= 0) killEnemy(e, j);
          break;
        }
      }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
      const b = enemyBullets[i];
      if (dist2(b, drone) < (b.radius + drone.r) ** 2 && player.droneMode === "orbit") {
        enemyBullets.splice(i, 1);
        spawnImpact(b.x, b.y, "shieldCrack", 70);
        burst(b.x, b.y, "#54f3ff", 8, 0.7);
        addScore(12);
        continue;
      }
      if (dist2(b, player) < (b.radius + player.r * 0.82) ** 2) {
        enemyBullets.splice(i, 1);
        spawnImpact(b.x, b.y, "plasmaBurst", 66);
        damagePlayer(b.damage);
      }
    }

    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const e = enemies[i];
      if (dist2(e, player) < (e.r * 0.78 + player.r * 0.88) ** 2) {
        killEnemy(e, i, false);
        damagePlayer(e.kind === "boss" ? 20 : 12);
      } else if (dist2(e, drone) < (e.r + drone.r) ** 2 && player.droneMode === "orbit") {
        e.hp -= 16;
        spawnImpact(drone.x, drone.y, "shieldCrack", 62);
        burst(drone.x, drone.y, "#ffbc55", 6, 0.8);
        if (e.hp <= 0) killEnemy(e, i);
      }
    }

    for (let i = pickups.length - 1; i >= 0; i -= 1) {
      const p = pickups[i];
      if (dist2(p, player) < (p.r + player.r) ** 2) {
        pickups.splice(i, 1);
        if (p.kind === "battery") {
          player.heat = Math.max(0, player.heat - 54);
          player.charge = clamp(player.charge + 24, 0, 100);
          burst(player.x + 34, player.y, "#54f3ff", 14, 1);
          setBanner("HEAT VENT", 0.7);
        } else if (p.kind === "crate") {
          player.hull = clamp(player.hull + 10, 0, PLAYER_MAX_HULL);
          addScore(260);
          burst(player.x + 50, player.y, "#ffbc55", 18, 1.2);
          setBanner("SALVAGE", 0.7);
        } else if (p.kind === "score") {
          addScore(320);
          burst(player.x + 50, player.y, "#ffbc55", 12, 1);
          setBanner("RIFT SHARD", 0.6);
        } else {
          player.hull = clamp(player.hull + 18, 0, PLAYER_MAX_HULL);
          player.heat = Math.max(0, player.heat - 28);
          burst(player.x + 34, player.y, "#bfff75", 14, 1);
          setBanner("CORE SYNC", 0.7);
        }
        addScore(120);
      }
    }
  }

  function killEnemy(enemy, index, score = true) {
    enemies.splice(index, 1);
    const count = enemy.kind === "boss" ? 46 : enemy.kind === "asteroid" ? 16 : 22;
    burst(enemy.x, enemy.y, enemy.kind === "boss" ? "#ffbc55" : "#ff4d76", count, enemy.kind === "boss" ? 2.6 : 1.3);
    spawnExplosion(enemy.x, enemy.y, enemy.kind === "boss" ? 178 : enemy.kind === "asteroid" ? 78 : 104, enemy.kind === "boss" ? "large" : "medium");
    spawnShardSpray(enemy.x, enemy.y, enemy.kind === "boss" ? 18 : enemy.kind === "asteroid" ? 3 : 7, enemy.kind === "boss" || enemy.kind === "mine" ? "hot" : "cyan");
    state.shake = state.reducedMotion ? 0.08 : Math.max(state.shake, enemy.kind === "boss" ? 0.7 : 0.22);
    if (score) {
      addScore(enemy.value);
      if (enemy.kind !== "asteroid") {
        state.chain += 1;
        state.chainTimer = 4.2;
        if (state.chain >= 8) triggerRiftBloom();
      }
    } else {
      state.chain = 0;
      state.chainTimer = 0;
    }
    const dropChance = enemy.kind === "boss" ? 1 : enemy.kind === "relay" || enemy.kind === "carrier" ? 0.42 : player.hull < PLAYER_MAX_HULL * 0.45 ? 0.24 : 0.16;
    if (Math.random() < dropChance) {
      const kind = enemy.kind === "relay" ? "crate" : player.heat > 55 ? "battery" : "core";
      pickups.push({ kind, x: enemy.x, y: enemy.y, r: kind === "crate" ? 24 : 18, t: 0 });
    }
    if (score && enemy.kind !== "asteroid" && Math.random() < 0.28) {
      pickups.push({ kind: "score", x: enemy.x + rand(-18, 18), y: enemy.y + rand(-18, 18), r: 13, t: 0 });
    }
  }

  function damagePlayer(amount) {
    if (player.invuln > 0) return;
    player.hull -= Math.ceil(amount * 0.72);
    player.invuln = 0.86;
    state.flash = 0.8;
    state.shake = state.reducedMotion ? 0.1 : 0.48;
    spawnExplosion(player.x + 12, player.y, 86, "medium");
    burst(player.x, player.y, "#ff4d76", 18, 1.1);
    if (player.hull <= 0) endRun();
  }

  function orbFamilyForColor(color) {
    const value = String(color).toLowerCase();
    if (value.includes("54f3ff") || value.includes("bfff75") || value.includes("cyan") || value.includes("blue")) return "blue";
    return "red";
  }

  function endRun() {
    state.running = false;
    state.over = true;
    menu.classList.remove("is-hidden");
    setGuiText(startButton, "Retry", "button");
    setBanner("RUN ENDED", 2);
  }

  function burst(x, y, color, count, power = 1) {
    const family = orbFamilyForColor(color);
    const orbNames = family === "blue" ? ["blueSmall", "blueMed", "blueCrack", "cluster"] : ["redSmall", "redMed", "redCrack", "cluster"];
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(80, 360) * power;
      const orb = Math.random() < 0.58 || count > 10;
      const radius = rand(2, 8) * power;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(0.25, 0.72) * power,
        maxLife: 0.72 * power,
        radius,
        color,
        alpha: orb ? 0.78 : 1,
        orb: orb ? orbNames[Math.floor(Math.random() * orbNames.length)] : null,
        size: orb ? clamp(radius * rand(4.2, 6.4), 15, 68) : null,
        rot: rand(0, TAU),
        spin: orb ? rand(-5, 5) : 0,
      });
    }
  }

  function addTrail(x, y, color, alpha) {
    if (state.reducedMotion) return;
    if (Math.random() < 0.18) {
      particles.push({
        x: x + rand(-4, 4),
        y: y + rand(-16, 16),
        vx: rand(-330, -140),
        vy: rand(-34, 34),
        life: rand(0.18, 0.34),
        maxLife: 0.34,
        size: rand(16, 28),
        alpha: 0.62,
        shard: "trail",
        rot: rand(0, TAU),
        spin: rand(-6, 6),
      });
    }
    particles.push({
      x,
      y: y + rand(-13, 13),
      vx: rand(-260, -80),
      vy: rand(-24, 24),
      life: rand(0.12, 0.28),
      radius: rand(2, 9),
      color,
      alpha,
    });
  }

  function render() {
    const shakeX = state.reducedMotion ? 0 : rand(-state.shake, state.shake) * 14;
    const shakeY = state.reducedMotion ? 0 : rand(-state.shake, state.shake) * 10;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawBackground();
    drawPickups();
    drawBullets();
    drawEnemies();
    drawPlayer();
    drawParticles();
    drawVignette();
    ctx.restore();
  }

  function drawBackground() {
    const bg = assets.bg;
    ctx.fillStyle = "#05070d";
    ctx.fillRect(-40, -40, W + 80, H + 80);
    if (bg.complete && bg.naturalWidth) {
      const scroll = state.time * (state.reducedMotion ? 24 : 82);
      drawTiledBackground(bg, scroll * 0.32, -32, H + 64, 0.34);
      drawTiledBackground(bg, scroll, 0, H, 0.74);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.fillRect(0, 0, W, H);
    drawStars();
    const grd = ctx.createLinearGradient(0, 0, W, 0);
    grd.addColorStop(0, "rgba(5, 7, 13, 0.42)");
    grd.addColorStop(0.55, "rgba(5, 7, 13, 0.14)");
    grd.addColorStop(1, "rgba(255, 77, 118, 0.1)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }

  function drawTiledBackground(img, scroll, y, h, alpha) {
    const tileW = h * (img.naturalWidth / img.naturalHeight);
    const startX = -((scroll % tileW) + tileW) % tileW;
    ctx.globalAlpha = alpha;
    for (let x = startX - tileW; x < W + tileW; x += tileW) {
      ctx.drawImage(img, x, y, tileW, h);
    }
  }

  function drawStars() {
    for (const s of stars) {
      s.x -= (state.reducedMotion ? 26 : 150) * s.z * 0.016;
      if (s.x < -20) {
        s.x = W + rand(0, 120);
        s.y = rand(0, H);
      }
      ctx.globalAlpha = 0.25 + s.z * 0.58;
      ctx.fillStyle = s.c;
      ctx.fillRect(s.x, s.y, 1 + s.z * 2.2, 1 + s.z * 2.2);
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayer() {
    const flicker = player.invuln > 0 && Math.floor(state.time * 24) % 2 === 0;
    if (flicker) ctx.globalAlpha = 0.42;
    const tilt = clamp(player.vy * 0.0012, -0.28, 0.28);
    const pulse = 1 + Math.sin(state.time * 12) * 0.018;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(tilt);
    ctx.scale(pulse, 1 / pulse);
    drawSpriteBackdrop(-40, -24, 84, 48, "player", 0, 0.5);
    drawShipClip("player", -30, -14, 66, 29, true);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = flicker ? 0.28 : 0.72;
    const flare = 1 + Math.sin(state.time * 34) * 0.16;
    drawFxAt("heatVent", player.x - 62, player.y - 14, 48 * flare, 21, Math.PI);
    drawFxAt("heatVent", player.x - 60, player.y + 4, 42 * flare, 18, Math.PI);
    ctx.restore();
    if (player.charge > 2) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const size = 30 + player.charge * 0.38;
      const ring = player.charge > 76 ? "chargeAmber" : "chargeCyan";
      drawRingAt(ring, player.x + 21 - size * 0.5, player.y - size * 0.5, size, size, state.time * 2.6, 0.27 + player.charge * 0.0014);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    drawDrone();
  }

  function drawDrone() {
    ctx.save();
    ctx.translate(drone.x, drone.y);
    ctx.rotate(drone.angle);
    const scale = 1 + Math.sin(state.time * 10) * 0.05;
    drawSpriteBackdrop(-15 * scale, -15 * scale, 30 * scale, 30 * scale, "drone", 0, 0.4);
    drawShipClipAt("shield", -11 * scale, -11 * scale, 22 * scale, 22 * scale);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const orbitSize = 36 + Math.sin(state.time * 8) * 3.2;
    drawRingAt(player.droneMode === "orbit" ? "drone" : "chargeAmber", drone.x - orbitSize * 0.5, drone.y - orbitSize * 0.5, orbitSize, orbitSize, -state.time * 2.8, 0.32);
    ctx.restore();
  }

  function drawEnemies() {
    for (const e of enemies) {
      if (e.kind === "asteroid") {
        drawAsteroid(e);
      } else if (e.kind === "mine" || e.kind === "relay" || e.kind === "blackHole") {
        drawHazardObject(e);
      } else if (e.kind === "boss") {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(Math.sin(e.t * 2.5) * 0.035);
        ctx.scale(1 + Math.sin(e.t * 5) * 0.015, 1);
        drawSpriteBackdrop(-116, -38, 168, 66, "boss", 0, 0.48);
        drawShipClip("boss", -92, -25, 136, 41);
        ctx.restore();
        drawHealthBar(e, 104);
      } else if (e.kind === "needle" || e.kind === "frigate" || e.kind === "carrier") {
        const size = e.kind === "needle" ? [55, 36] : e.kind === "frigate" ? [72, 48] : [84, 54];
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(clamp(e.vy * 0.0014, -0.22, 0.22) + Math.sin(e.t * 8) * 0.025);
        ctx.scale(1 + Math.sin(e.t * 7) * 0.025, 1 - Math.sin(e.t * 6) * 0.012);
        drawSpriteBackdrop(-size[0] * 0.6, -size[1] * 0.66, size[0] * 1.2, size[1] * 1.32, "enemy", 0, 0.44);
        drawShipPropAt(e.art, -size[0] * 0.5, -size[1] * 0.5, size[0], size[1]);
        ctx.restore();
        drawHealthBar(e, e.kind === "needle" ? 30 : 48);
      } else {
        const clip = e.kind === "skimmer" || e.kind === "escort" ? "droneA" : e.kind === "blade" ? "droneB" : "droneC";
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(clamp(e.vy * 0.0015, -0.25, 0.25) + Math.sin(e.t * 10) * 0.035);
        ctx.scale(1 + Math.sin(e.t * 9) * 0.035, 1 - Math.sin(e.t * 8) * 0.018);
        drawSpriteBackdrop(-27, -18, 54, 36, "enemy", 0, 0.42);
        drawShipClip(clip, -22, -14, 44, 28);
        ctx.restore();
        drawHealthBar(e, 28);
      }
    }
  }

  function drawAsteroid(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.rot);
    const pulse = 1 + Math.sin(e.t * 5) * 0.025;
    drawSpriteBackdrop(-e.r * 0.98, -e.r * 0.98, e.r * 1.96, e.r * 1.96, "asteroid", 0, 0.34);
    drawPropAt(e.art, -e.r * 0.72 * pulse, -e.r * 0.72 * pulse, e.r * 1.44 * pulse, e.r * 1.44 * pulse);
    ctx.restore();
    drawHealthBar(e, e.r * 1.6);
  }

  function drawHazardObject(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.rot || 0);
    if (e.kind === "blackHole") {
      const pulse = 1 + Math.sin(e.t * 7) * 0.08;
      drawSpriteBackdrop(-e.r * 1.18, -e.r * 1.18, e.r * 2.36, e.r * 2.36, "blackHole", e.t * 0.42, 0.36);
      drawPropAt(e.art, -e.r * 0.8 * pulse, -e.r * 0.8 * pulse, e.r * 1.6 * pulse, e.r * 1.6 * pulse);
      drawFxAt("gravityRipple", -e.r * 1.2 * pulse, -e.r * 1.2 * pulse, e.r * 2.4 * pulse, e.r * 2.4 * pulse, e.t * 0.8);
      ctx.globalCompositeOperation = "lighter";
      const ringSize = e.r * 2.06 + Math.sin(e.t * 5) * 7;
      drawRingAt("blackHole", -ringSize * 0.5, -ringSize * 0.5, ringSize, ringSize, -e.t * 0.9, 0.26);
    } else {
      const pulse = e.kind === "mine" ? 1 + Math.sin((e.t || 0) * 8) * 0.05 : 1;
      const scale = e.kind === "relay" ? 0.98 : 0.78;
      drawSpriteBackdrop(-e.r * scale * 1.04, -e.r * scale * 1.04, e.r * scale * 2.08, e.r * scale * 2.08, e.kind === "relay" ? "relay" : "mine", 0, 0.34);
      drawPropAt(e.art, -e.r * scale * pulse, -e.r * scale * pulse, e.r * scale * 2 * pulse, e.r * scale * 2 * pulse);
    }
    ctx.restore();
    drawHealthBar(e, e.kind === "relay" ? 74 : 58);
  }

  function drawHealthBar(e, width) {
    const pct = clamp(e.hp / e.maxHp, 0, 1);
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(e.x - width * 0.5, e.y - e.r - 16, width, 5);
    ctx.fillStyle = e.kind === "boss" ? "#ffbc55" : "#ff4d76";
    ctx.fillRect(e.x - width * 0.5, e.y - e.r - 16, width * pct, 5);
  }

  function drawBullets() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const b of bullets) {
      const angle = Math.atan2(b.vy, b.vx);
      const w = b.kind === "lance" ? 250 + b.radius * 3 : b.art === "spear" ? 88 : b.art === "droneBolt" ? 46 : 62;
      const h = b.kind === "lance" ? 54 + b.radius * 0.45 : b.art === "spear" ? 38 : 30;
      ctx.globalAlpha = b.kind === "lance" ? 0.62 + Math.sin(state.time * 40) * 0.16 : 0.9;
      drawFxAt(b.art || "pulse", b.x - w * 0.5, b.y - h * 0.5, w, h, angle);
      if (b.kind === "lance") {
        ctx.globalAlpha = 0.34;
        drawShardAt("glint", b.x + w * 0.1, b.y - 30, 78, 78, state.time * 4);
      }
    }
    for (const b of enemyBullets) {
      const base = b.art === "enemyMissile" || b.art === "enemyShard" ? Math.PI : 0;
      const angle = Math.atan2(b.vy, b.vx) - base;
      const w = b.art === "enemyMissile" ? 82 : b.art === "enemyShard" ? 58 : 42;
      const h = b.art === "enemyMissile" ? 36 : 42;
      ctx.globalAlpha = 0.82 + Math.sin(state.time * 22 + b.x * 0.03) * 0.12;
      drawFxAt(b.art || "enemyOrb", b.x - w * 0.5, b.y - h * 0.5, w, h, angle);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawPickups() {
    for (const p of pickups) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.t * (p.kind === "score" ? 4.5 : 3));
      const art = p.kind === "battery" ? "battery" : p.kind === "crate" ? "crate" : "core";
      const bob = Math.sin(p.t * 8) * 3;
      const size = p.kind === "crate" ? 44 : p.kind === "score" ? 44 : 39;
      if (p.kind === "score") {
        drawShardAt("scoreCore", -size * 0.5, -size * 0.5 + bob, size, size, 0);
        ctx.globalAlpha = 0.72;
        drawShardAt("glint", -size * 0.68, -size * 0.68 + bob, size * 1.36, size * 1.36, -p.t * 1.8);
        ctx.globalAlpha = 1;
      } else {
        drawPropAt(art, -size * 0.5, -size * 0.5 + bob, size, size);
      }
      ctx.globalCompositeOperation = "lighter";
      const ringSize = size * 1.14 + Math.sin(p.t * 6) * 5;
      drawRingAt(p.kind === "battery" ? "pickupCyan" : "pickupAmber", -ringSize * 0.5, -ringSize * 0.5 + bob, ringSize, ringSize, p.t * (p.kind === "score" ? -1.7 : 1.4), 0.34);
      ctx.restore();
    }
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2.4)) * (p.alpha || 1);
      if (p.orb) {
        const progress = clamp(1 - p.life / (p.maxLife || p.life || 1), 0, 1);
        const size = (p.size || p.radius * 5 || 24) * (1 - progress * 0.2);
        drawOrbAt(p.orb, p.x - size * 0.5, p.y - size * 0.5, size, size, p.rot || 0);
        continue;
      }
      if (p.shard) {
        const progress = clamp(1 - p.life / (p.maxLife || p.life || 1), 0, 1);
        const size = (p.size || 32) * (p.shard === "bloomWave" ? 0.78 + progress * 0.38 : 1 - progress * 0.16);
        drawShardAt(p.shard, p.x - size * 0.5, p.y - size * 0.5, size, size, p.rot || 0);
        continue;
      }
      if (p.boom) {
        const progress = clamp(1 - p.life / (p.maxLife || p.life || 1), 0, 0.999);
        const frames = Array.isArray(boomClips[p.boom]?.[0]) ? boomClips[p.boom] : null;
        const clip = frames ? frames[Math.floor(progress * frames.length)] : boomClips[p.boom] || boomClips.impactTeal;
        const size = p.size || 80;
        drawBoomAt(clip, p.x - size * 0.5, p.y - size * 0.5, size, size, p.rot || 0);
        continue;
      }
      if (p.art) {
        const size = p.art === "muzzle" ? 70 : p.art === "explosion" ? 92 : p.art === "deflect" ? 70 : 58;
        drawFxAt(p.art, p.x - size * 0.5, p.y - size * 0.5, size, size, p.rot || 0);
        continue;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(W * 0.55, H * 0.5, H * 0.18, W * 0.55, H * 0.5, H * 0.82);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.48)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 77, 118, ${state.flash * 0.18})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawRingAt(name, x, y, w, h, rotation = 0, alpha = 1) {
    const sheet = assets.rings;
    const clip = ringClips[name] || ringClips.player;
    if (sheet.complete && sheet.naturalWidth && clip) {
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.rotate(rotation);
      ctx.drawImage(sheet, clip[0], clip[1], clip[2], clip[3], -w * 0.5, -h * 0.5, w, h);
      ctx.restore();
      return;
    }
    const fallback = name === "boss" || name === "asteroid" || name === "pickupAmber" || name === "chargeAmber" ? "#ffbc55" : name === "enemy" || name === "mine" ? "#ff4d76" : "#54f3ff";
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(1, 4, 9, 0.72)";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.56, h * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = fallback;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.58, h * 0.58, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawSpriteBackdrop(x, y, w, h, ringName, rotation = 0, alpha = 1) {
    drawRingAt(ringName, x, y, w, h, rotation, alpha);
  }

  function withShipGamma(draw) {
    const previousFilter = ctx.filter;
    const previousShadowColor = ctx.shadowColor;
    const previousShadowBlur = ctx.shadowBlur;
    const previousShadowOffsetX = ctx.shadowOffsetX;
    const previousShadowOffsetY = ctx.shadowOffsetY;
    ctx.filter = SHIP_GAMMA_FILTER;
    ctx.shadowColor = "rgba(205, 255, 255, 0.46)";
    ctx.shadowBlur = 11;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    draw();
    ctx.filter = previousFilter;
    ctx.shadowColor = previousShadowColor;
    ctx.shadowBlur = previousShadowBlur;
    ctx.shadowOffsetX = previousShadowOffsetX;
    ctx.shadowOffsetY = previousShadowOffsetY;
  }

  function withShipGlow(draw, alpha = 0.2) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha *= alpha;
    ctx.filter = SHIP_GLOW_FILTER;
    ctx.shadowColor = "rgba(93, 244, 255, 0.36)";
    ctx.shadowBlur = 14;
    draw();
    ctx.restore();
  }

  function drawShipClip(name, x, y, w, h, flipX = false) {
    withShipGlow(() => drawClip(name, x, y, w, h, flipX), name === "player" ? 0.28 : 0.2);
    withShipGamma(() => drawClip(name, x, y, w, h, flipX));
  }

  function drawShipClipAt(name, x, y, w, h, flipX = false) {
    withShipGlow(() => drawClipAt(name, x, y, w, h, flipX), name === "shield" ? 0.18 : 0.2);
    withShipGamma(() => drawClipAt(name, x, y, w, h, flipX));
  }

  function drawShipPropAt(name, x, y, w, h) {
    withShipGlow(() => drawPropAt(name, x, y, w, h), name === "frigate" || name === "carrier" ? 0.18 : 0.2);
    withShipGamma(() => drawPropAt(name, x, y, w, h));
  }

  function drawClip(name, x, y, w, h, flipX = false) {
    drawClipAt(name, x, y, w, h, flipX);
  }

  function drawClipAt(name, x, y, w, h, flipX = false) {
    const sheet = assets.sheet;
    const clip = clips[name];
    if (sheet.complete && sheet.naturalWidth && clip) {
      if (flipX) {
        ctx.save();
        ctx.translate(x + w, y);
        ctx.scale(-1, 1);
        ctx.drawImage(sheet, clip[0], clip[1], clip[2], clip[3], 0, 0, w, h);
        ctx.restore();
      } else {
        ctx.drawImage(sheet, clip[0], clip[1], clip[2], clip[3], x, y, w, h);
      }
      return;
    }
    ctx.fillStyle = name === "player" ? "#54f3ff" : "#ff4d76";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.45, h * 0.35, 0, 0, TAU);
    ctx.fill();
  }

  function drawPropAt(name, x, y, w, h) {
    const sheet = assets.props;
    const clip = propClips[name];
    if (sheet.complete && sheet.naturalWidth && clip) {
      ctx.drawImage(sheet, clip[0], clip[1], clip[2], clip[3], x, y, w, h);
      return;
    }
    ctx.fillStyle = name === "blackHole" ? "#1d0f3d" : name && name.includes("asteroid") ? "#353942" : "#ffbc55";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.36, h * 0.34, 0, 0, TAU);
    ctx.fill();
  }

  function drawFxAt(name, x, y, w, h, rotation = 0) {
    const sheet = assets.fx;
    const clip = fxClips[name];
    if (sheet.complete && sheet.naturalWidth && clip) {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.rotate(rotation);
      ctx.drawImage(sheet, clip[0], clip[1], clip[2], clip[3], -w * 0.5, -h * 0.5, w, h);
      ctx.restore();
      return;
    }
    ctx.fillStyle = name && name.startsWith("enemy") ? "#ff4d76" : "#54f3ff";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.45, h * 0.28, rotation, 0, TAU);
    ctx.fill();
  }

  function drawOrbAt(name, x, y, w, h, rotation = 0) {
    const sheet = assets.orbs;
    const clip = orbClips[name] || orbClips.blueSmall;
    if (sheet.complete && sheet.naturalWidth && clip) {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.rotate(rotation);
      ctx.drawImage(sheet, clip[0], clip[1], clip[2], clip[3], -w * 0.5, -h * 0.5, w, h);
      ctx.restore();
      return;
    }
    const blue = name && name.startsWith("blue");
    ctx.fillStyle = blue ? "#54f3ff" : "#ff4d76";
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.5, Math.min(w, h) * 0.45, 0, TAU);
    ctx.fill();
  }

  function drawShardAt(name, x, y, w, h, rotation = 0) {
    const sheet = assets.shards;
    const clip = shardClips[name] || shardClips.cyan;
    if (sheet.complete && sheet.naturalWidth && clip) {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.rotate(rotation);
      ctx.drawImage(sheet, clip[0], clip[1], clip[2], clip[3], -w * 0.5, -h * 0.5, w, h);
      ctx.restore();
      return;
    }
    ctx.fillStyle = name === "amber" ? "#ffbc55" : name === "rose" ? "#ff4d76" : "#54f3ff";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y);
    ctx.lineTo(x + w, y + h * 0.55);
    ctx.lineTo(x + w * 0.5, y + h);
    ctx.lineTo(x, y + h * 0.55);
    ctx.closePath();
    ctx.fill();
  }

  function drawBoomAt(clip, x, y, w, h, rotation = 0) {
    const sheet = assets.boom;
    if (sheet.complete && sheet.naturalWidth && clip) {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.rotate(rotation);
      ctx.drawImage(sheet, clip[0], clip[1], clip[2], clip[3], -w * 0.5, -h * 0.5, w, h);
      ctx.restore();
      return;
    }
    const g = ctx.createRadialGradient(x + w * 0.5, y + h * 0.5, 0, x + w * 0.5, y + h * 0.5, w * 0.5);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.35, "rgba(255,188,85,0.75)");
    g.addColorStop(1, "rgba(255,77,118,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.5, w * 0.5, 0, TAU);
    ctx.fill();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - state.last) / 1000 || 0);
    state.last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function bindInput() {
    const map = new Map([
      ["ArrowLeft", "left"],
      ["KeyA", "left"],
      ["ArrowRight", "right"],
      ["KeyD", "right"],
      ["ArrowUp", "up"],
      ["KeyW", "up"],
      ["ArrowDown", "down"],
      ["KeyS", "down"],
      ["Space", "fire"],
      ["KeyJ", "fire"],
      ["ShiftLeft", "charge"],
      ["ShiftRight", "charge"],
      ["KeyK", "charge"],
      ["KeyL", "drone"],
    ]);
    window.addEventListener("keydown", (event) => {
      if (event.code === "Enter" && !state.running) startGame();
      const key = map.get(event.code);
      if (!key) return;
      input[key] = true;
      event.preventDefault();
    });
    window.addEventListener("keyup", (event) => {
      const key = map.get(event.code);
      if (!key) return;
      input[key] = false;
      event.preventDefault();
    });
    for (const button of document.querySelectorAll("[data-touch]")) {
      const key = button.dataset.touch;
      const set = (value) => {
        input[key] = value;
        if (value && !state.running) startGame();
      };
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        set(true);
      });
      button.addEventListener("pointerup", () => set(false));
      button.addEventListener("pointercancel", () => set(false));
      button.addEventListener("lostpointercapture", () => set(false));
    }
  }

  startButton.addEventListener("click", startGame);
  muteButton.addEventListener("click", toggleMute);
  motionButton.addEventListener("click", toggleMotion);
  window.addEventListener("resize", resize);
  bindInput();
  resize();
  hydrateGuiText();
  updateHud();
  const params = new URLSearchParams(window.location.search);
  if (params.get("muted") === "1") toggleMute();
  if (params.get("autostart") === "1") {
    window.setTimeout(startGame, 120);
  }
  waitForAssets().then(() => {
    requestAnimationFrame((now) => {
      state.last = now;
      requestAnimationFrame(frame);
    });
  });
})();
