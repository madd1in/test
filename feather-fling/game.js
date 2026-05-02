(() => {
  "use strict";

  const BASE_W = 1024;
  const BASE_H = 576;
  const GROUND_Y = 522;
  const SLING = { x: 176, y: 405 };
  const MAX_PULL = 112;
  const LAUNCH_POWER = 0.175;

  const FRAMES = {
    "relic-crimson": { x: 0, y: 0, w: 64, h: 64 },
    "relic-azure": { x: 64, y: 0, w: 64, h: 64 },
    "relic-gold": { x: 128, y: 0, w: 64, h: 64 },
    skull: { x: 192, y: 0, w: 64, h: 64 },
    "wood-block": { x: 256, y: 0, w: 64, h: 64 },
    "stone-block": { x: 320, y: 0, w: 64, h: 64 },
    "glass-block": { x: 384, y: 0, w: 64, h: 64 },
    ground: { x: 448, y: 0, w: 64, h: 64 },
    sling: { x: 0, y: 64, w: 64, h: 64 },
    puff: { x: 64, y: 64, w: 64, h: 64 },
    star: { x: 128, y: 64, w: 64, h: 64 },
    leaf: { x: 192, y: 64, w: 64, h: 64 },
    "wood-long": { x: 256, y: 64, w: 64, h: 64 },
    "stone-long": { x: 320, y: 64, w: 64, h: 64 },
    "glass-long": { x: 384, y: 64, w: 64, h: 64 },
    crate: { x: 448, y: 64, w: 64, h: 64 },
    "relic-violet": { x: 0, y: 128, w: 64, h: 64 },
    "relic-emerald": { x: 64, y: 128, w: 64, h: 64 }
  };

  const ART_SOURCES = {
    bgFar: "assets/gothic/bg_stage1_far.png",
    bgMid: "assets/gothic/bg_stage1_mid.png",
    floor: "assets/gothic/ig_floor_00.png",
    bat: "assets/gothic/enemy_bat.png",
    skeleton: "assets/gothic/enemy_skeleton.png",
    knight: "assets/gothic/enemy_knight.png",
    phantom: "assets/gothic/enemy_phantom.png",
    window: "assets/gothic/bg_window.png",
    column: "assets/gothic/bg_column.png"
  };

  const LEVELS = [
    {
      name: "Moon Gate",
      shots: ["relic-crimson", "relic-azure", "relic-gold"],
      build() {
        block(742, 486, 36, 74, "wood-block");
        block(842, 486, 36, 74, "wood-block");
        block(792, 436, 132, 28, "wood-long");
        target(792, 394, "skeleton");
        block(792, 512, 176, 22, "stone-long");
      }
    },
    {
      name: "Glass Chapel",
      shots: ["relic-crimson", "relic-gold", "relic-azure"],
      build() {
        block(724, 492, 34, 70, "glass-block");
        block(794, 492, 34, 70, "wood-block");
        block(864, 492, 34, 70, "glass-block");
        block(794, 435, 164, 26, "wood-long");
        block(794, 388, 34, 70, "stone-block");
        target(724, 405, "bat");
        target(864, 405, "phantom");
      }
    },
    {
      name: "Clocktower Ruin",
      shots: ["relic-crimson", "relic-violet", "relic-gold", "relic-azure"],
      build() {
        block(720, 498, 40, 60, "stone-block");
        block(780, 498, 40, 60, "wood-block");
        block(840, 498, 40, 60, "stone-block");
        block(900, 498, 40, 60, "wood-block");
        block(810, 452, 220, 24, "glass-long");
        block(748, 410, 34, 70, "wood-block");
        block(872, 410, 34, 70, "wood-block");
        block(810, 358, 160, 26, "stone-long");
        target(810, 315, "knight");
        target(748, 366, "skeleton");
        target(872, 366, "phantom");
      }
    }
  ];

  const canvas = document.getElementById("gameCanvas");
  const gameShell = document.getElementById("gameShell");
  const ctx = canvas.getContext("2d");
  const levelText = document.getElementById("levelText");
  const shotText = document.getElementById("shotText");
  const scoreText = document.getElementById("scoreText");
  const toast = document.getElementById("toast");
  const bgm = document.getElementById("bgm");
  const musicButton = document.getElementById("musicButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const resetButton = document.getElementById("resetButton");
  const nextButton = document.getElementById("nextButton");
  const spriteImage = new Image();
  const artImages = {};
  const query = new URLSearchParams(window.location.search);

  let spriteReady = false;
  let engine;
  let world;
  let dpr = 1;
  let levelIndex = 0;
  let shotQueue = [];
  let score = 0;
  let currentShot = null;
  let currentShotSprite = "relic-crimson";
  let launched = false;
  let launchStarted = 0;
  let settleStarted = 0;
  let drag = null;
  let particles = [];
  let messageTimer = 0;
  let lastTime = performance.now();
  let levelWon = false;
  let musicEnabled = false;
  let pseudoFullscreen = false;
  let touchMode = false;

  const M = window.Matter;

  if (!M) {
    showToast("Matter.js fehlt. Bitte npm install ausfuehren.");
    return;
  }

  const {
    Engine,
    Events,
    Composite,
    Bodies,
    Body,
    Vector
  } = M;

  spriteImage.onload = () => {
    spriteReady = true;
  };
  spriteImage.src = "assets/sprite-map.png";
  for (const [key, src] of Object.entries(ART_SOURCES)) {
    const img = new Image();
    img.src = src;
    artImages[key] = img;
  }

  bgm.volume = 0.55;
  bgm.addEventListener("play", updateAudioButton);
  bgm.addEventListener("pause", updateAudioButton);

  musicButton.addEventListener("click", () => {
    if (musicEnabled) {
      bgm.pause();
      musicEnabled = false;
    } else {
      musicEnabled = true;
      playMusic();
    }
    updateAudioButton();
  });

  fullscreenButton.addEventListener("click", toggleFullscreen);
  resetButton.addEventListener("click", () => resetLevel(false));
  nextButton.addEventListener("click", () => {
    levelIndex = (levelIndex + 1) % LEVELS.length;
    resetLevel(true);
  });

  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  canvas.addEventListener("lostpointercapture", pointerUp);
  window.addEventListener("pointermove", pointerMove, { passive: false });
  window.addEventListener("pointerup", pointerUp, { passive: false });
  window.addEventListener("pointercancel", pointerUp, { passive: false });
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  document.addEventListener("webkitfullscreenchange", updateFullscreenButton);

  detectTouchMode();
  resizeCanvas();
  resetLevel(true);
  if (query.has("autolaunch")) {
    setTimeout(() => {
      if (currentShot && !launched) {
        Body.setPosition(currentShot, { x: SLING.x - 86, y: SLING.y + 44 });
        launchCurrentShot();
      }
    }, query.has("instant") ? 0 : 450);
  }
  requestAnimationFrame(loop);

  function detectTouchMode() {
    touchMode = Boolean(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    document.body.classList.toggle("touch-mode", touchMode);
  }

  function playMusic() {
    if (!musicEnabled) return;
    const playPromise = bgm.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        musicEnabled = false;
        updateAudioButton();
      });
    }
  }

  function updateAudioButton() {
    musicButton.classList.toggle("active", musicEnabled && !bgm.paused);
    musicButton.setAttribute("aria-pressed", String(musicEnabled && !bgm.paused));
    musicButton.textContent = musicEnabled && !bgm.paused ? "♫" : "♪";
  }

  function toggleFullscreen() {
    const activeElement = document.fullscreenElement || document.webkitFullscreenElement;
    if (activeElement) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) exit.call(document);
      return;
    }

    const request = gameShell.requestFullscreen || gameShell.webkitRequestFullscreen;
    if (request) {
      const result = request.call(gameShell);
      if (result && typeof result.catch === "function") {
        result.catch(() => togglePseudoFullscreen());
      }
    } else {
      togglePseudoFullscreen();
    }
  }

  function togglePseudoFullscreen() {
    pseudoFullscreen = !pseudoFullscreen;
    gameShell.classList.toggle("pseudo-fullscreen", pseudoFullscreen);
    updateFullscreenButton();
    resizeCanvas();
  }

  function updateFullscreenButton() {
    const active = Boolean(document.fullscreenElement || document.webkitFullscreenElement || pseudoFullscreen);
    fullscreenButton.classList.toggle("active", active);
    fullscreenButton.setAttribute("aria-pressed", String(active));
  }

  function resizeCanvas() {
    detectTouchMode();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(BASE_W * dpr);
    canvas.height = Math.round(BASE_H * dpr);
  }

  function resetLevel(showIntro) {
    engine = Engine.create({ enableSleeping: true });
    world = engine.world;
    engine.gravity.y = 1.05;
    engine.timing.timeScale = 1;
    Composite.clear(world, false, true);

    levelWon = false;
    launched = false;
    drag = null;
    particles = [];
    shotQueue = [...LEVELS[levelIndex].shots];

    addTerrain();
    LEVELS[levelIndex].build();
    spawnShot();
    attachCollisionHandler();
    updateHud();

    if (showIntro) {
      showToast("Ziehen, zielen, loslassen.");
    }
  }

  function addTerrain() {
    const options = {
      isStatic: true,
      friction: 1,
      restitution: 0.15,
      plugin: { kind: "terrain" }
    };
    Composite.add(world, [
      Bodies.rectangle(BASE_W / 2, GROUND_Y + 31, BASE_W + 220, 64, options),
      Bodies.rectangle(-40, BASE_H / 2, 80, BASE_H * 2, options),
      Bodies.rectangle(BASE_W + 40, BASE_H / 2, 80, BASE_H * 2, options),
      Bodies.rectangle(BASE_W / 2, -60, BASE_W, 80, options)
    ]);
  }

  function attachCollisionHandler() {
    Events.on(engine, "collisionStart", (event) => {
      for (const pair of event.pairs) {
        const rel = Vector.sub(pair.bodyA.velocity, pair.bodyB.velocity);
        const speed = Vector.magnitude(rel);
        if (speed < 1.3) continue;
        damage(pair.bodyA, pair.bodyB, speed);
        damage(pair.bodyB, pair.bodyA, speed);
      }
    });
  }

  function block(x, y, w, h, sprite, angle = 0) {
    const material = sprite.includes("stone")
      ? { density: 0.0065, health: 13, restitution: 0.04 }
      : sprite.includes("glass")
        ? { density: 0.003, health: 6, restitution: 0.08 }
        : { density: 0.0042, health: 9, restitution: 0.06 };

    const body = Bodies.rectangle(x, y, w, h, {
      friction: 0.78,
      frictionStatic: 0.9,
      restitution: material.restitution,
      density: material.density,
      label: "block",
      plugin: {
        kind: "block",
        sprite,
        width: w,
        height: h,
        health: material.health,
        maxHealth: material.health,
        score: sprite.includes("glass") ? 95 : sprite.includes("stone") ? 120 : 85
      }
    });
    if (angle !== 0) Body.rotate(body, angle);
    Composite.add(world, body);
    return body;
  }

  function target(x, y, enemy = "skeleton") {
    const body = Bodies.circle(x, y, 22, {
      friction: 0.75,
      restitution: 0.2,
      density: 0.0027,
      label: "target",
      plugin: {
        kind: "target",
        sprite: "skull",
        enemy,
        radius: 22,
        health: 7,
        maxHealth: 7,
        score: 1000
      }
    });
    Composite.add(world, body);
    return body;
  }

  function spawnShot() {
    if (currentShot && Composite.get(world, currentShot.id, "body")) {
      Composite.remove(world, currentShot);
    }

    const sprite = shotQueue.shift();
    currentShotSprite = sprite || "relic-crimson";

    if (!sprite) {
      currentShot = null;
      if (targetsLeft() > 0) showToast("Keine Relikte mehr. Level neu starten?");
      updateHud();
      return;
    }

    const body = Bodies.circle(SLING.x, SLING.y, 20, {
      isStatic: true,
      friction: 0.4,
      restitution: 0.34,
      density: 0.005,
      label: "shot",
      plugin: {
        kind: "shot",
        sprite,
        radius: 20
      }
    });
    currentShot = body;
    launched = false;
    launchStarted = 0;
    settleStarted = 0;
    Composite.add(world, body);
    updateHud();
  }

  function damage(body, other, speed) {
    const data = body.plugin;
    if (!data || data.dead || data.kind === "terrain" || data.kind === "shot") return;

    const otherKind = other.plugin ? other.plugin.kind : "";
    const shotBonus = otherKind === "shot" ? 1.5 : 1;
    const massBonus = Math.min(2.4, Math.max(0.75, other.mass * 0.12));
    const amount = Math.max(0, (speed - 1.1) * shotBonus * massBonus);

    data.health -= amount;
    if (data.kind === "target" && otherKind === "shot" && speed > 2.4) {
      data.health -= 2.2;
    }

    if (data.health <= 0) {
      data.dead = true;
    }
  }

  function pointerDown(event) {
    if (!currentShot || launched || levelWon) return;
    event.preventDefault();
    if (!musicEnabled) {
      musicEnabled = true;
      playMusic();
      updateAudioButton();
    }
    const point = pointerPoint(event);
    const distance = Vector.magnitude(Vector.sub(point, currentShot.position));
    const mobileSwipeStart = touchMode && point.x < 360 && point.y > 180;
    if (distance > 46 && !mobileSwipeStart) return;
    if (canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (_) {
        // Window-level listeners still complete the release path if capture is unavailable.
      }
    }
    drag = { id: event.pointerId, mobileSwipe: mobileSwipeStart, start: point };
    Body.setStatic(currentShot, true);
    Body.setVelocity(currentShot, { x: 0, y: 0 });
    Body.setAngularVelocity(currentShot, 0);
    moveShotToPull(mobileSwipeStart ? SLING : point);
  }

  function pointerMove(event) {
    if (!drag || drag.id !== event.pointerId || !currentShot) return;
    event.preventDefault();
    if (event.buttons === 0 && event.pointerType !== "touch") {
      pointerUp(event);
      return;
    }
    const point = pointerPoint(event);
    if (drag.mobileSwipe) {
      moveShotToPull({
        x: SLING.x + point.x - drag.start.x,
        y: SLING.y + point.y - drag.start.y
      });
      return;
    }
    moveShotToPull(point);
  }

  function pointerUp(event) {
    if (!drag || drag.id !== event.pointerId || !currentShot) return;
    event.preventDefault();
    releasePointer(event.pointerId);
    launchCurrentShot();
  }

  function launchCurrentShot() {
    const pull = Vector.sub(SLING, currentShot.position);
    const distance = Vector.magnitude(pull);
    drag = null;

    if (distance < 12) {
      Body.setPosition(currentShot, SLING);
      return;
    }

    Body.setStatic(currentShot, false);
    Body.setVelocity(currentShot, {
      x: pull.x * LAUNCH_POWER,
      y: pull.y * LAUNCH_POWER
    });
    Body.setAngularVelocity(currentShot, -pull.x * 0.006);
    launched = true;
    launchStarted = performance.now();
    settleStarted = 0;
    puff(currentShot.position.x, currentShot.position.y, 10, "#f0d79a");
    updateHud();
  }

  function pointerPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * BASE_W / rect.width,
      y: (event.clientY - rect.top) * BASE_H / rect.height
    };
  }

  function releasePointer(pointerId) {
    if (canvas.hasPointerCapture && canvas.hasPointerCapture(pointerId)) {
      try {
        canvas.releasePointerCapture(pointerId);
      } catch (_) {
        // Capture may already be gone on some mobile browsers.
      }
    }
  }

  function moveShotToPull(point) {
    const delta = Vector.sub(point, SLING);
    const dist = Vector.magnitude(delta);
    const clamped = dist > MAX_PULL ? Vector.mult(Vector.normalise(delta), MAX_PULL) : delta;
    Body.setPosition(currentShot, {
      x: SLING.x + clamped.x,
      y: SLING.y + clamped.y
    });
  }

  function loop(now) {
    const delta = Math.min(32, now - lastTime);
    lastTime = now;

    if (!drag) {
      Engine.update(engine, delta);
    }

    cleanupBodies();
    updateShotState(now);
    updateParticles(delta);
    draw();
    requestAnimationFrame(loop);
  }

  function cleanupBodies() {
    const bodies = Composite.allBodies(world);
    for (const body of bodies) {
      const data = body.plugin;
      if (!data || !data.dead) continue;
      Composite.remove(world, body);
      score += data.score || 0;
      puff(body.position.x, body.position.y, data.kind === "target" ? 20 : 12, data.kind === "target" ? "#ffd760" : "#ffffff");
      updateHud();
    }

    if (!levelWon && targetsLeft() === 0) {
      levelWon = true;
      score += Math.max(0, shotQueue.length + (currentShot && !launched ? 1 : 0)) * 500;
      updateHud();
      setTimeout(() => {
        showToast("Level geschafft. Weiter mit >.");
      }, 250);
    }
  }

  function updateShotState(now) {
    if (!currentShot || !launched || levelWon) return;

    const out =
      currentShot.position.x > BASE_W + 90 ||
      currentShot.position.y > BASE_H + 110 ||
      currentShot.position.x < -120;
    const speed = Vector.magnitude(currentShot.velocity);

    if (out || now - launchStarted > 9500) {
      spawnShot();
      return;
    }

    if (now - launchStarted > 1100 && speed < 0.18) {
      settleStarted = settleStarted || now;
      if (now - settleStarted > 900) spawnShot();
    } else {
      settleStarted = 0;
    }
  }

  function targetsLeft() {
    return Composite.allBodies(world).filter((body) => body.plugin && body.plugin.kind === "target" && !body.plugin.dead).length;
  }

  function updateParticles(delta) {
    const step = delta / 16.67;
    particles = particles.filter((particle) => {
      particle.life -= delta;
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
      particle.vy += 0.06 * step;
      return particle.life > 0;
    });
  }

  function puff(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 6 + Math.random() * 11,
        life: 420 + Math.random() * 380,
        color
      });
    }
  }

  function updateHud() {
    levelText.textContent = `${levelIndex + 1}`;
    shotText.textContent = `${shotQueue.length + (currentShot ? 1 : 0)}`;
    scoreText.textContent = `${score}`;
  }

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => toast.classList.remove("show"), 1900);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, BASE_W, BASE_H);
    drawBackground();

    if (currentShot && !launched) {
      drawAim();
      drawElastic(true);
    }

    drawSprite("sling", SLING.x - 10, SLING.y + 34, 96, 96, 0);

    const bodies = Composite.allBodies(world).filter((body) => body.plugin && body.plugin.kind !== "terrain");
    bodies.sort((a, b) => {
      const ak = a.plugin.kind === "shot" ? 2 : a.plugin.kind === "target" ? 1 : 0;
      const bk = b.plugin.kind === "shot" ? 2 : b.plugin.kind === "target" ? 1 : 0;
      return ak - bk;
    });

    for (const body of bodies) drawBody(body);

    if (currentShot && !launched) {
      drawElastic(false);
    }

    drawParticles();
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, BASE_H);
    sky.addColorStop(0, "#080713");
    sky.addColorStop(0.52, "#181427");
    sky.addColorStop(1, "#3b2630");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    drawImageCover(artImages.bgFar, 0, 0, BASE_W, BASE_H, 0.82);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const moon = ctx.createRadialGradient(778, 118, 8, 778, 118, 82);
    moon.addColorStop(0, "rgba(255, 233, 180, 0.62)");
    moon.addColorStop(0.42, "rgba(199, 133, 120, 0.18)");
    moon.addColorStop(1, "rgba(199, 133, 120, 0)");
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(778, 118, 82, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawImageCover(artImages.bgMid, 0, 0, BASE_W, BASE_H, 0.9);
    drawGothicSilhouettes();

    ctx.fillStyle = "rgba(16, 11, 18, 0.35)";
    ctx.fillRect(0, GROUND_Y - 12, BASE_W, 18);

    for (let x = -12; x < BASE_W + 96; x += 96) {
      drawArt(artImages.floor, x + 48, GROUND_Y + 34, 96, 96, 0, 0.98);
    }
  }

  function imageReady(image) {
    return image && image.complete && image.naturalWidth > 0;
  }

  function drawImageCover(image, x, y, w, h, alpha = 1) {
    if (!imageReady(image)) return;
    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (image.naturalWidth - sw) / 2;
    const sy = (image.naturalHeight - sh) / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
  }

  function drawArt(image, x, y, w, h, rotation = 0, alpha = 1) {
    if (!imageReady(image)) return false;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.drawImage(image, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }

  function drawGothicSilhouettes() {
    ctx.save();
    ctx.fillStyle = "rgba(7, 6, 12, 0.58)";
    for (const tower of [
      { x: 86, y: 276, w: 42, h: 220 },
      { x: 132, y: 318, w: 34, h: 178 },
      { x: 910, y: 292, w: 52, h: 208 },
      { x: 972, y: 330, w: 34, h: 170 }
    ]) {
      ctx.fillRect(tower.x, tower.y, tower.w, tower.h);
      ctx.beginPath();
      ctx.moveTo(tower.x - 8, tower.y);
      ctx.lineTo(tower.x + tower.w / 2, tower.y - 52);
      ctx.lineTo(tower.x + tower.w + 8, tower.y);
      ctx.closePath();
      ctx.fill();
    }
    for (let x = 42; x < 1000; x += 92) {
      drawArt(artImages.window, x, 358 + ((x / 92) % 2) * 18, 52, 52, 0, 0.45);
    }
    ctx.restore();
  }

  function hill(cx, cy, w, h) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, w / 2, h / 2, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(cx + w / 2, BASE_H);
    ctx.lineTo(cx - w / 2, BASE_H);
    ctx.closePath();
    ctx.fill();
  }

  function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.beginPath();
    ctx.arc(0, 10, 22, 0, Math.PI * 2);
    ctx.arc(28, 0, 30, 0, Math.PI * 2);
    ctx.arc(66, 12, 23, 0, Math.PI * 2);
    ctx.rect(-4, 11, 78, 24);
    ctx.fill();
    ctx.restore();
  }

  function drawElastic(behind) {
    if (!currentShot) return;
    const p = currentShot.position;
    const leftFork = { x: SLING.x - 25, y: SLING.y - 58 };
    const rightFork = { x: SLING.x + 20, y: SLING.y - 59 };
    const bandColor = behind ? "rgba(78, 45, 28, 0.82)" : "rgba(55, 29, 18, 0.92)";

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = behind ? 7 : 5;
    ctx.strokeStyle = bandColor;
    ctx.beginPath();
    ctx.moveTo(leftFork.x, leftFork.y);
    ctx.lineTo(p.x - 2, p.y + 3);
    ctx.lineTo(rightFork.x, rightFork.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawAim() {
    if (!currentShot || !drag) return;
    const pull = Vector.sub(SLING, currentShot.position);
    const vx = pull.x * LAUNCH_POWER;
    const vy = pull.y * LAUNCH_POWER;
    let x = currentShot.position.x;
    let y = currentShot.position.y;

    ctx.save();
    ctx.fillStyle = "rgba(31, 44, 53, 0.32)";
    for (let i = 1; i < 18; i++) {
      const t = i * 5.2;
      x = currentShot.position.x + vx * t;
      y = currentShot.position.y + vy * t + 0.5 * engine.gravity.y * 0.18 * t * t;
      if (y > GROUND_Y) break;
      ctx.globalAlpha = 1 - i / 21;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(2, 5 - i * 0.12), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBody(body) {
    const data = body.plugin || {};
    const p = body.position;

    if (data.kind === "shot") {
      drawSprite(data.sprite || currentShotSprite, p.x, p.y, 54, 54, body.angle);
      return;
    }

    if (data.kind === "target") {
      const scale = data.enemy === "knight" ? 68 : data.enemy === "bat" ? 58 : 62;
      if (!drawArt(artImages[data.enemy], p.x, p.y, scale, scale, body.angle, 1)) {
        drawSprite("skull", p.x, p.y, 56, 56, body.angle);
      }
      drawHealthRing(body, 31);
      return;
    }

    if (data.kind === "block") {
      const alpha = Math.max(0.35, Math.min(1, data.health / data.maxHealth));
      ctx.save();
      ctx.globalAlpha = alpha;
      drawSprite(data.sprite, p.x, p.y, data.width, data.height, body.angle);
      ctx.restore();
      if (alpha < 0.7) drawCracks(p.x, p.y, data.width, data.height, body.angle);
    }
  }

  function drawSprite(key, x, y, w, h, rotation) {
    const frame = FRAMES[key];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);

    if (spriteReady && frame) {
      ctx.drawImage(spriteImage, frame.x, frame.y, frame.w, frame.h, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillStyle = fallbackColor(key);
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    ctx.restore();
  }

  function fallbackColor(key) {
    if (key.includes("relic")) return "#d94b55";
    if (key.includes("stone")) return "#9ca9b4";
    if (key.includes("glass")) return "#8edce8";
    if (key.includes("wood") || key === "crate") return "#c78343";
    if (key === "skull") return "#dac9aa";
    return "#4d3948";
  }

  function drawCracks(x, y, w, h, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.strokeStyle = "rgba(38, 34, 30, 0.48)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.24, -h * 0.2);
    ctx.lineTo(-w * 0.06, -h * 0.02);
    ctx.lineTo(-w * 0.15, h * 0.2);
    ctx.moveTo(w * 0.12, -h * 0.22);
    ctx.lineTo(w * 0.02, h * 0.02);
    ctx.lineTo(w * 0.24, h * 0.18);
    ctx.stroke();
    ctx.restore();
  }

  function drawHealthRing(body, radius) {
    const data = body.plugin;
    if (!data || data.health >= data.maxHealth) return;
    const pct = Math.max(0, data.health / data.maxHealth);
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = pct > 0.5 ? "#72c855" : "#ff9d43";
    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of particles) {
      const alpha = Math.max(0, particle.life / 800);
      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha);
      if (spriteReady) {
        drawSprite(particle.color === "#ffd760" ? "star" : "puff", particle.x, particle.y, particle.size, particle.size, 0);
      } else {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
})();
