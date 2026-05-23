(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const hud = {
    score: document.getElementById("score"),
    hull: document.getElementById("hull"),
    heat: document.getElementById("heat"),
    wave: document.getElementById("wave"),
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
  const rand = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const dist2 = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  };

  const assets = {
    bg: loadImage("assets/generated/rift-corridor-hd.png"),
    sheet: loadImage("assets/generated/rift-asset-sheet-alpha.png"),
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
    wave: 1,
    spawnTimer: 0,
    hazardTimer: 0,
    bossTimer: 42,
    nextWaveScore: 1800,
    bannerTimer: 0,
    bannerText: "RIFT LANCE",
  };

  const player = {
    x: 160,
    y: H * 0.5,
    vx: 0,
    vy: 0,
    r: 25,
    hull: 100,
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
    r: 18,
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

  function setBanner(text, seconds = 1.4) {
    state.bannerText = text;
    state.bannerTimer = seconds;
    banner.textContent = text;
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
      hull: 100,
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
      wave: 1,
      spawnTimer: 0.3,
      hazardTimer: 1.5,
      bossTimer: 38,
      nextWaveScore: 1800,
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
    muteButton.textContent = state.muted ? "Muted" : "Audio";
    bgm.muted = state.muted;
    if (!state.muted && state.running) playMusic();
  }

  function toggleMotion() {
    state.reducedMotion = !state.reducedMotion;
    motionButton.setAttribute("aria-pressed", String(state.reducedMotion));
    motionButton.textContent = state.reducedMotion ? "Calm" : "Motion";
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
    hud.score.textContent = String(Math.floor(state.score));
    hud.hull.textContent = String(Math.max(0, Math.ceil(player.hull)));
    hud.heat.textContent = `${Math.round(player.heat)}%`;
    hud.wave.textContent = String(state.wave).padStart(2, "0");
    hud.best.textContent = String(Math.floor(state.best));
  }

  function update(dt) {
    state.time += dt;
    state.shake = Math.max(0, state.shake - dt * 8);
    state.flash = Math.max(0, state.flash - dt * 3.4);
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
    const speed = input.charge ? 360 : 520;
    player.vx += (ax * speed - player.vx) * Math.min(1, dt * 12);
    player.vy += (ay * speed - player.vy) * Math.min(1, dt * 12);
    player.x = clamp(player.x + player.vx * dt, 56, W * 0.48);
    player.y = clamp(player.y + player.vy * dt, 88, H - 72);
    player.fireTimer -= dt;
    player.droneCooldown = Math.max(0, player.droneCooldown - dt);
    player.invuln = Math.max(0, player.invuln - dt);

    if (input.charge) {
      player.charge = clamp(player.charge + dt * 58, 0, 100);
      player.heat = clamp(player.heat + dt * 22, 0, 100);
    } else {
      if (player.charge > 34) fireLance();
      player.charge = Math.max(0, player.charge - dt * 120);
      player.heat = Math.max(0, player.heat - dt * 26);
    }

    if (input.fire && player.fireTimer <= 0 && player.heat < 96) {
      fireBolt(player.x + 54, player.y - 3, 860, 0, 16, "#54f3ff", 11, "player");
      fireBolt(player.x + 34, player.y + 16, 780, 18, 10, "#bfff75", 7, "player");
      player.fireTimer = 0.075;
      player.heat = clamp(player.heat + 3.8, 0, 100);
    }

    if (input.drone && player.droneCooldown <= 0) {
      player.droneMode = player.droneMode === "orbit" ? "strike" : "orbit";
      player.droneCooldown = 0.36;
      setBanner(player.droneMode === "orbit" ? "DRONE GUARD" : "DRONE STRIKE", 0.8);
    }

    if (!input.charge && !input.fire) {
      player.heat = Math.max(0, player.heat - dt * 18);
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
      fireBolt(drone.x + 20, drone.y, 760, rand(-20, 20), 9, "#ffbc55", 6, "player");
      drone.fireTimer = player.droneMode === "strike" ? 0.18 : 0.28;
    }
  }

  function fireBolt(x, y, vx, vy, damage, color, radius, owner) {
    bullets.push({ x, y, vx, vy, damage, color, radius, owner, life: 1.4, kind: "bolt" });
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
      life: 0.42,
      kind: "lance",
      pierce: 5 + Math.floor(power * 5),
    });
    player.charge = 0;
    player.heat = clamp(player.heat + 24, 0, 100);
    state.flash = 0.8;
    state.shake = state.reducedMotion ? 0.1 : 0.45;
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
    state.bossTimer -= dt;
    if (state.spawnTimer <= 0) {
      const count = state.wave > 3 ? 2 : 1;
      for (let i = 0; i < count; i += 1) spawnEnemy();
      state.spawnTimer = clamp(0.95 - state.wave * 0.055, 0.32, 0.95);
    }
    if (state.hazardTimer <= 0) {
      spawnHazard();
      state.hazardTimer = rand(1.1, 2.4);
    }
    if (state.bossTimer <= 0 && !enemies.some((e) => e.kind === "boss")) {
      spawnBoss();
      state.bossTimer = 52 + state.wave * 6;
      setBanner("RIFT CRUISER", 1.4);
    }
  }

  function spawnEnemy() {
    const kinds = ["skimmer", "blade", "turret"];
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
      r: kind === "blade" ? 32 : 27,
      hp: kind === "turret" ? 48 + state.wave * 8 : 30 + state.wave * 6,
      maxHp: 1,
      t: rand(0, TAU),
      shot: rand(0.45, 1.4),
      value: kind === "turret" ? 240 : 150,
    };
    enemy.maxHp = enemy.hp;
    enemies.push(enemy);
  }

  function spawnHazard() {
    enemies.push({
      kind: "asteroid",
      x: W + 100,
      y: rand(120, H - 80),
      vx: -rand(250, 430) - state.wave * 10,
      vy: rand(-40, 40),
      r: rand(20, 46),
      hp: 22 + state.wave * 5,
      maxHp: 22 + state.wave * 5,
      rot: rand(0, TAU),
      spin: rand(-2.5, 2.5),
      value: 90,
    });
  }

  function spawnBoss() {
    enemies.push({
      kind: "boss",
      x: W + 280,
      y: H * 0.5,
      vx: -120,
      vy: 0,
      r: 104,
      hp: 760 + state.wave * 180,
      maxHp: 760 + state.wave * 180,
      t: 0,
      shot: 0.8,
      value: 2400,
    });
  }

  function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const e = enemies[i];
      e.t = (e.t || 0) + dt;
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
          enemyShot(e.x - 35, e.y, -420, (player.y - e.y) * 1.2);
          e.shot = clamp(1.15 - state.wave * 0.055, 0.46, 1.15);
        }
      } else if (e.kind === "boss") {
        e.vx += ((W - 210) - e.x) * dt * 0.26;
        e.vx = clamp(e.vx, -130, 40);
        e.y = H * 0.5 + Math.sin(e.t * 1.8) * 155;
        e.shot -= dt;
        if (e.shot <= 0) {
          const lanes = [-92, -46, 0, 46, 92];
          lanes.forEach((lane) => enemyShot(e.x - 170, e.y + lane, -500, (player.y - e.y - lane) * 0.9));
          e.shot = clamp(0.92 - state.wave * 0.03, 0.48, 0.92);
        }
      } else if (e.kind === "asteroid") {
        e.rot += e.spin * dt;
      }
      if (e.x < -260 || e.y < -160 || e.y > H + 160) enemies.splice(i, 1);
    }
  }

  function enemyShot(x, y, vx, vy) {
    const mag = Math.hypot(vx, vy) || 1;
    enemyBullets.push({
      x,
      y,
      vx: (vx / mag) * 455,
      vy: (vy / mag) * 455,
      damage: 12,
      radius: 10,
      color: "#ff4d76",
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
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const b = bullets[i];
      for (let j = enemies.length - 1; j >= 0; j -= 1) {
        const e = enemies[j];
        const hitRadius = b.radius + e.r * (e.kind === "boss" ? 1.05 : 0.85);
        if (dist2(b, e) < hitRadius * hitRadius) {
          e.hp -= b.damage;
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
        burst(b.x, b.y, "#54f3ff", 8, 0.7);
        addScore(12);
        continue;
      }
      if (dist2(b, player) < (b.radius + player.r) ** 2) {
        enemyBullets.splice(i, 1);
        damagePlayer(b.damage);
      }
    }

    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const e = enemies[i];
      if (dist2(e, player) < (e.r + player.r) ** 2) {
        killEnemy(e, i, false);
        damagePlayer(e.kind === "boss" ? 28 : 18);
      } else if (dist2(e, drone) < (e.r + drone.r) ** 2 && player.droneMode === "orbit") {
        e.hp -= 16;
        burst(drone.x, drone.y, "#ffbc55", 6, 0.8);
        if (e.hp <= 0) killEnemy(e, i);
      }
    }

    for (let i = pickups.length - 1; i >= 0; i -= 1) {
      const p = pickups[i];
      if (dist2(p, player) < (p.r + player.r) ** 2) {
        pickups.splice(i, 1);
        player.hull = clamp(player.hull + 14, 0, 100);
        player.heat = Math.max(0, player.heat - 36);
        addScore(120);
        setBanner("CORE SYNC", 0.7);
      }
    }
  }

  function killEnemy(enemy, index, score = true) {
    enemies.splice(index, 1);
    const count = enemy.kind === "boss" ? 46 : enemy.kind === "asteroid" ? 16 : 22;
    burst(enemy.x, enemy.y, enemy.kind === "boss" ? "#ffbc55" : "#ff4d76", count, enemy.kind === "boss" ? 2.6 : 1.3);
    state.shake = state.reducedMotion ? 0.08 : Math.max(state.shake, enemy.kind === "boss" ? 0.7 : 0.22);
    if (score) addScore(enemy.value);
    if (Math.random() < (enemy.kind === "boss" ? 1 : 0.12)) {
      pickups.push({ x: enemy.x, y: enemy.y, r: 18, t: 0 });
    }
  }

  function damagePlayer(amount) {
    if (player.invuln > 0) return;
    player.hull -= amount;
    player.invuln = 0.64;
    state.flash = 0.8;
    state.shake = state.reducedMotion ? 0.1 : 0.48;
    burst(player.x, player.y, "#ff4d76", 18, 1.1);
    if (player.hull <= 0) endRun();
  }

  function endRun() {
    state.running = false;
    state.over = true;
    menu.classList.remove("is-hidden");
    startButton.textContent = "Retry";
    setBanner("RUN ENDED", 2);
  }

  function burst(x, y, color, count, power = 1) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(80, 360) * power;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(0.25, 0.72) * power,
        radius: rand(2, 8) * power,
        color,
      });
    }
  }

  function addTrail(x, y, color, alpha) {
    if (state.reducedMotion) return;
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
      const scroll = state.time * (state.reducedMotion ? 28 : 72);
      const imgW = W * 1.78;
      const imgH = H;
      const x = -(scroll % imgW);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(bg, x, 0, imgW, imgH);
      ctx.drawImage(bg, x + imgW, 0, imgW, imgH);
      ctx.globalAlpha = 0.52;
      ctx.drawImage(bg, x * 0.45, -40, imgW, imgH + 80);
      ctx.drawImage(bg, x * 0.45 + imgW, -40, imgW, imgH + 80);
      ctx.globalAlpha = 1;
    }
    drawStars();
    const grd = ctx.createLinearGradient(0, 0, W, 0);
    grd.addColorStop(0, "rgba(5, 7, 13, 0.25)");
    grd.addColorStop(0.55, "rgba(5, 7, 13, 0.02)");
    grd.addColorStop(1, "rgba(255, 77, 118, 0.18)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
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
    drawClip("player", player.x - 58, player.y - 33, 130, 58);
    if (player.charge > 2) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = player.charge > 76 ? "#ffbc55" : "#54f3ff";
      ctx.lineWidth = 3 + player.charge * 0.04;
      ctx.beginPath();
      ctx.arc(player.x + 36, player.y, 22 + player.charge * 0.28, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    drawDrone();
  }

  function drawDrone() {
    ctx.save();
    ctx.translate(drone.x, drone.y);
    ctx.rotate(drone.angle);
    drawClipAt("shield", -24, -24, 48, 48);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = player.droneMode === "orbit" ? "rgba(84,243,255,0.56)" : "rgba(255,188,85,0.62)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(drone.x, drone.y, 26 + Math.sin(state.time * 8) * 3, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawEnemies() {
    for (const e of enemies) {
      if (e.kind === "asteroid") {
        drawAsteroid(e);
      } else if (e.kind === "boss") {
        drawClip("boss", e.x - 164, e.y - 48, 245, 74);
        drawHealthBar(e, 170);
      } else {
        const clip = e.kind === "skimmer" ? "droneA" : e.kind === "blade" ? "droneB" : "droneC";
        drawClip(clip, e.x - 44, e.y - 30, 88, 54);
        drawHealthBar(e, 46);
      }
    }
  }

  function drawAsteroid(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.rot);
    ctx.fillStyle = "#2a3038";
    ctx.strokeStyle = "#ffbc55";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = (i / 10) * TAU;
      const radius = e.r * (0.72 + ((i * 37) % 10) / 34);
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
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
      const length = b.kind === "lance" ? 180 : 38;
      const grad = ctx.createLinearGradient(b.x - length, b.y, b.x + length, b.y);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.45, b.color);
      grad.addColorStop(1, "#ffffff");
      ctx.strokeStyle = grad;
      ctx.lineWidth = b.radius;
      ctx.beginPath();
      ctx.moveTo(b.x - length, b.y);
      ctx.lineTo(b.x + length * 0.45, b.y);
      ctx.stroke();
    }
    for (const b of enemyBullets) {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.radius * 1.4, b.radius, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPickups() {
    for (const p of pickups) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.t * 3);
      drawClipAt("shield", -24, -24, 48, 48);
      ctx.restore();
    }
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2.4)) * (p.alpha || 1);
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

  function drawClip(name, x, y, w, h) {
    drawClipAt(name, x, y, w, h);
  }

  function drawClipAt(name, x, y, w, h) {
    const sheet = assets.sheet;
    const clip = clips[name];
    if (sheet.complete && sheet.naturalWidth && clip) {
      ctx.drawImage(sheet, clip[0], clip[1], clip[2], clip[3], x, y, w, h);
      return;
    }
    ctx.fillStyle = name === "player" ? "#54f3ff" : "#ff4d76";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.45, h * 0.35, 0, 0, TAU);
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
  updateHud();
  const params = new URLSearchParams(window.location.search);
  if (params.get("muted") === "1") toggleMute();
  if (params.get("autostart") === "1") {
    window.setTimeout(startGame, 120);
  }
  requestAnimationFrame((now) => {
    state.last = now;
    requestAnimationFrame(frame);
  });
})();
