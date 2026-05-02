(() => {
  "use strict";

  const BASE_W = 1024;
  const BASE_H = 576;
  const GROUND_Y = 522;
  const SLING = { x: 176, y: 405 };
  const SLING_ART = { x: SLING.x - 2, y: SLING.y + 40, w: 112, h: 112 };
  const SLING_ANCHORS = {
    backLeft: { x: SLING.x - 31, y: SLING.y + 4 },
    backRight: { x: SLING.x + 29, y: SLING.y + 3 },
    frontLeft: { x: SLING.x - 26, y: SLING.y + 13 },
    frontRight: { x: SLING.x + 23, y: SLING.y + 12 }
  };
  const MAX_PULL = 112;
  const MIN_LAUNCH_PULL = 8;
  const LAUNCH_POWER = 0.205;
  const PHYSICS_STEP = 1000 / 60;
  const MAX_PHYSICS_STEPS = 4;
  const TRAJECTORY_STEPS = 128;
  const TRAJECTORY_SAMPLE_EVERY = 4;

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

  const AI_SPRITE_GRID = { cols: 8, rows: 4 };
  const BIRD_GRID = { cols: 6, rows: 5 };
  const BIRD_ROWS = {
    "relic-crimson": 0,
    "relic-azure": 1,
    "relic-gold": 2,
    "relic-violet": 3,
    "relic-emerald": 4
  };
  const AI_SPRITES = {
    "relic-crimson": { col: 0, row: 0 },
    "relic-violet": { col: 1, row: 0 },
    "relic-azure": { col: 2, row: 0 },
    "relic-emerald": { col: 3, row: 0 },
    "relic-gold": { col: 4, row: 0 },
    sling: { col: 6, row: 0 },
    skull: { col: 7, row: 0 },
    skeleton: { col: 0, row: 1 },
    bat: { col: 1, row: 1 },
    knight: { col: 2, row: 1 },
    phantom: { col: 3, row: 1 },
    puff: { col: 4, row: 1 },
    star: { col: 5, row: 1 },
    "wood-block": { col: 6, row: 1 },
    crate: { col: 6, row: 1 },
    "stone-block": { col: 7, row: 1 },
    "stone-long": { col: 0, row: 2 },
    "wood-long": { col: 3, row: 3 },
    "glass-block": { col: 6, row: 3 },
    "glass-long": { col: 6, row: 3 },
    ground: { col: 0, row: 3 },
    leaf: { col: 5, row: 3 }
  };

  const ART_SOURCES = {
    aiBackground: "assets/ai/ai-background-map.png",
    aiTiles: "assets/ai/ai-tile-map.png",
    aiSprites: "assets/ai/ai-sprite-map.png",
    aiBirds: "assets/ai/ai-bird-animation-map.png",
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
        block(792, 512, 196, 22, "stone-long");
        block(728, 486, 42, 54, "stone-block");
        block(856, 486, 42, 54, "stone-block");
        block(742, 437, 34, 86, "wood-block", -0.05);
        block(842, 437, 34, 86, "wood-block", 0.05);
        block(792, 404, 156, 24, "wood-long");
        block(792, 365, 124, 22, "stone-long");
        target(792, 326, "skeleton");
      }
    },
    {
      name: "Glass Chapel",
      shots: ["relic-crimson", "relic-gold", "relic-azure"],
      build() {
        block(784, 514, 238, 22, "stone-long");
        block(704, 492, 34, 62, "glass-block");
        block(762, 492, 38, 68, "wood-block");
        block(822, 492, 38, 68, "wood-block");
        block(880, 492, 34, 62, "glass-block");
        block(792, 445, 214, 24, "stone-long");
        block(735, 405, 30, 72, "glass-block", -0.04);
        block(849, 405, 30, 72, "glass-block", 0.04);
        block(792, 362, 150, 22, "wood-long");
        target(735, 365, "bat");
        target(849, 365, "phantom");
      }
    },
    {
      name: "Clocktower Ruin",
      shots: ["relic-crimson", "relic-violet", "relic-gold", "relic-azure"],
      build() {
        block(810, 514, 264, 22, "stone-long");
        block(704, 493, 42, 58, "stone-block");
        block(764, 493, 38, 62, "wood-block");
        block(856, 493, 38, 62, "wood-block");
        block(916, 493, 42, 58, "stone-block");
        block(810, 450, 250, 24, "glass-long");
        block(742, 407, 32, 78, "wood-block", -0.08);
        block(878, 407, 32, 78, "wood-block", 0.08);
        block(810, 366, 188, 24, "stone-long");
        block(810, 326, 126, 22, "wood-long");
        target(810, 285, "knight");
        target(742, 365, "skeleton");
        target(878, 365, "phantom");
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
  let physicsAccumulator = 0;
  let physicsStepCount = 0;
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
    Pairs,
    Sleeping,
    Vector
  } = M;

  spriteImage.onload = () => {
    spriteReady = true;
  };
  spriteImage.src = "assets/sprite-map.png";
  for (const [key, src] of Object.entries(ART_SOURCES)) {
    const img = new Image();
    if (key === "aiSprites") {
      img.addEventListener("load", () => {
        artImages.aiSpritesKeyed = createTransparentSpriteSheet(img);
      });
    }
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
  canvas.addEventListener("lostpointercapture", pointerLostCapture);
  window.addEventListener("pointermove", pointerMove, { passive: false });
  window.addEventListener("pointerup", pointerUp, { passive: false });
  window.addEventListener("pointercancel", pointerUp, { passive: false });
  document.addEventListener("mouseup", finishDragFromDocument, true);
  document.addEventListener("touchend", finishDragFromDocument, true);
  document.addEventListener("touchcancel", finishDragFromDocument, true);
  window.addEventListener("blur", finishDragFromDocument);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) finishDragFromDocument();
  });
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  document.addEventListener("webkitfullscreenchange", updateFullscreenButton);

  detectTouchMode();
  resizeCanvas();
  resetLevel(true);
  exposeDebugState();
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

  function exposeDebugState() {
    window.__castleFlingDebug = {
      getShotState() {
        if (!currentShot) return null;
        return {
          x: currentShot.position.x,
          y: currentShot.position.y,
          vx: currentShot.velocity.x,
          vy: currentShot.velocity.y,
          isStatic: currentShot.isStatic,
          launched,
          dragging: Boolean(drag),
          sprite: currentShot.plugin ? currentShot.plugin.sprite : currentShotSprite,
          physicsStep: physicsStepCount,
          launchedStep: currentShot.plugin ? currentShot.plugin.launchedStep || 0 : 0,
          flightStep: currentShot.plugin && currentShot.plugin.launchedStep !== undefined
            ? physicsStepCount - currentShot.plugin.launchedStep
            : 0
        };
      },
      getAimPath(sampleEvery) {
        if (!currentShot || !drag) return [];
        const pull = Vector.sub(SLING, currentShot.position);
        return buildTrajectoryPoints(
          currentShot.position,
          launchVelocityFromPull(pull),
          currentShot.plugin && currentShot.plugin.radius,
          sampleEvery
        );
      },
      getTargets() {
        return Composite.allBodies(world)
          .filter((body) => body.plugin && body.plugin.kind === "target")
          .map((body) => ({
            x: body.position.x,
            y: body.position.y,
            minY: body.bounds.min.y,
            maxY: body.bounds.max.y,
            vx: body.velocity.x,
            vy: body.velocity.y,
            isSleeping: body.isSleeping,
            supported: hasSupportBelow(body),
            dropFrames: body.plugin.dropFrames || 0,
            dead: Boolean(body.plugin.dead),
            enemy: body.plugin.enemy
          }));
      },
      getBlocks() {
        return Composite.allBodies(world)
          .filter((body) => body.plugin && body.plugin.kind === "block")
          .map((body) => ({
            x: body.position.x,
            y: body.position.y,
            minX: body.bounds.min.x,
            maxX: body.bounds.max.x,
            minY: body.bounds.min.y,
            maxY: body.bounds.max.y,
            dead: Boolean(body.plugin.dead),
            sprite: body.plugin.sprite
          }));
      },
      removeSupportUnderFirstTarget() {
        const targetBody = Composite.allBodies(world).find((body) => body.plugin && body.plugin.kind === "target" && !body.plugin.dead);
        if (!targetBody) return null;
        const support = findSupportUnderTarget(targetBody);
        if (!support) return null;
        const before = {
          targetY: targetBody.position.y,
          supportX: support.position.x,
          supportY: support.position.y,
          sprite: support.plugin.sprite
        };
        removeBodyFromWorld(support);
        wakeDynamicBodies(support.position, 280);
        return before;
      },
      removeSupportsBelowFirstTarget() {
        const targetBody = Composite.allBodies(world).find((body) => body.plugin && body.plugin.kind === "target" && !body.plugin.dead);
        if (!targetBody) return null;
        const supports = Composite.allBodies(world).filter((body) => {
          const data = body.plugin;
          if (!data || data.kind !== "block" || data.dead) return false;
          const horizontallyAligned =
            body.bounds.min.x <= targetBody.position.x + 30 &&
            body.bounds.max.x >= targetBody.position.x - 30;
          return horizontallyAligned && body.bounds.min.y > targetBody.bounds.max.y - 8;
        });
        for (const support of supports) removeBodyFromWorld(support);
        wakeDynamicBodies(targetBody.position, 320);
        Body.setVelocity(targetBody, {
          x: targetBody.velocity.x,
          y: Math.max(targetBody.velocity.y, 2.2)
        });
        return { count: supports.length, targetY: targetBody.position.y };
      }
    };
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
    engine = Engine.create({ enableSleeping: false });
    world = engine.world;
    engine.gravity.y = 1.05;
    engine.timing.timeScale = 1;
    physicsAccumulator = 0;
    physicsStepCount = 0;
    lastTime = performance.now();
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
        markShotImpact(pair.bodyA, speed);
        markShotImpact(pair.bodyB, speed);
        damage(pair.bodyA, pair.bodyB, speed);
        damage(pair.bodyB, pair.bodyA, speed);
      }
    });
  }

  function markShotImpact(body, speed) {
    if (!body.plugin || body.plugin.kind !== "shot" || speed < 2.1) return;
    body.plugin.impactUntil = performance.now() + 240;
  }

  function block(x, y, w, h, sprite, angle = 0) {
    const material = sprite.includes("stone")
      ? { density: 0.0088, health: 16, restitution: 0.025, friction: 0.92, frictionStatic: 1.08 }
      : sprite.includes("glass")
        ? { density: 0.0027, health: 5.4, restitution: 0.12, friction: 0.58, frictionStatic: 0.72 }
        : { density: 0.0049, health: 8.2, restitution: 0.045, friction: 0.82, frictionStatic: 0.98 };

    const body = Bodies.rectangle(x, y, w, h, {
      friction: material.friction,
      frictionStatic: material.frictionStatic,
      frictionAir: 0.006,
      restitution: material.restitution,
      density: material.density,
      sleepThreshold: 42,
      slop: 0.025,
      chamfer: { radius: Math.min(5, Math.max(2, Math.min(w, h) * 0.12)) },
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
      friction: 0.88,
      frictionStatic: 0.95,
      frictionAir: 0.004,
      restitution: 0.12,
      density: 0.0035,
      sleepThreshold: 34,
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
    Body.setStatic(body, true);
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
    const shotBonus = otherKind === "shot" ? 1.85 : 1;
    const massBonus = Math.min(2.7, Math.max(0.8, other.mass * 0.13));
    const materialBonus = data.sprite && data.sprite.includes("glass") ? 1.25 : data.sprite && data.sprite.includes("stone") ? 0.82 : 1;
    const amount = Math.max(0, (speed - 0.95) * shotBonus * massBonus * materialBonus);

    data.health -= amount;
    if (data.kind === "target" && otherKind === "shot" && speed > 2.4) {
      data.health -= 2.8;
    }

    if (data.health <= 0) {
      data.dead = true;
      wakeDynamicBodies(body.position, 240);
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
    if (!point) return;
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
    drag = {
      id: event.pointerId,
      pointerType: event.pointerType || "mouse",
      mobileSwipe: mobileSwipeStart,
      start: point,
      last: point,
      maxPull: 0,
      startedAt: performance.now()
    };
    Body.setStatic(currentShot, true);
    Body.setVelocity(currentShot, { x: 0, y: 0 });
    Body.setAngularVelocity(currentShot, 0);
    moveShotToPull(mobileSwipeStart ? SLING : point);
  }

  function pointerMove(event) {
    if (!drag || drag.id !== event.pointerId || !currentShot) return;
    event.preventDefault();
    if (event.buttons === 0 && event.pointerType !== "touch") {
      finishDrag(event);
      return;
    }
    const point = pointerPoint(event);
    if (!point) return;
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
    if (!drag || !currentShot) return;
    if (event.pointerId !== undefined && drag.id !== event.pointerId) return;
    event.preventDefault();
    finishDrag(event);
  }

  function pointerLostCapture(event) {
    if (!drag || !currentShot) return;
    if (event.pointerId !== undefined && drag.id !== event.pointerId) return;
    if (performance.now() - drag.startedAt < 40) return;
    finishDrag(event);
  }

  function finishDragFromDocument(event) {
    if (!drag || !currentShot) return;
    if (event && event.pointerId !== undefined && drag.id !== event.pointerId) return;
    finishDrag(event);
  }

  function finishDrag(event) {
    if (!drag || !currentShot) return;
    if (event && event.preventDefault) event.preventDefault();
    const pointerId = event && event.pointerId !== undefined ? event.pointerId : drag.id;
    releasePointer(pointerId);
    launchCurrentShot();
  }

  function launchCurrentShot() {
    const shot = currentShot;
    let pull = Vector.sub(SLING, shot.position);
    let distance = Vector.magnitude(pull);
    const rememberedPull = drag && drag.launchPull;
    if (distance < MIN_LAUNCH_PULL && rememberedPull && Vector.magnitude(rememberedPull) >= MIN_LAUNCH_PULL) {
      pull = rememberedPull;
      distance = Vector.magnitude(pull);
      Body.setPosition(shot, {
        x: SLING.x - pull.x,
        y: SLING.y - pull.y
      });
    }
    const hadIntent = drag && drag.maxPull >= MIN_LAUNCH_PULL;
    drag = null;

    if (distance < MIN_LAUNCH_PULL && !hadIntent) {
      Body.setPosition(shot, SLING);
      return;
    }

    Body.setStatic(shot, false);
    Sleeping.set(shot, false);
    Body.setPosition(shot, {
      x: shot.position.x,
      y: shot.position.y
    });
    Body.setVelocity(shot, launchVelocityFromPull(pull));
    Body.setAngularVelocity(shot, -pull.x * 0.008);
    launched = true;
    launchStarted = performance.now();
    settleStarted = 0;
    if (shot.plugin) {
      shot.plugin.launchedAt = launchStarted;
      shot.plugin.launchedStep = physicsStepCount;
    }
    puff(shot.position.x, shot.position.y, 10, "#f0d79a");
    updateHud();
  }

  function pointerPoint(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
      return null;
    }
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
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    const delta = Vector.sub(point, SLING);
    const dist = Vector.magnitude(delta);
    const clamped = dist > MAX_PULL ? Vector.mult(Vector.normalise(delta), MAX_PULL) : delta;
    if (drag) {
      drag.last = point;
      drag.maxPull = Math.max(drag.maxPull, Vector.magnitude(clamped));
      drag.launchPull = {
        x: -clamped.x,
        y: -clamped.y
      };
    }
    Body.setPosition(currentShot, {
      x: SLING.x + clamped.x,
      y: SLING.y + clamped.y
    });
  }

  function loop(now) {
    const delta = Math.min(80, now - lastTime);
    lastTime = now;

    if (!drag) {
      physicsAccumulator = Math.min(physicsAccumulator + delta, PHYSICS_STEP * MAX_PHYSICS_STEPS);
      while (physicsAccumulator >= PHYSICS_STEP) {
        Engine.update(engine, PHYSICS_STEP);
        physicsStepCount += 1;
        physicsAccumulator -= PHYSICS_STEP;
      }
    } else {
      physicsAccumulator = 0;
    }

    cleanupBodies();
    enforceTargetDrops();
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
      const removedAt = { x: body.position.x, y: body.position.y };
      removeBodyFromWorld(body);
      wakeDynamicBodies(removedAt, 260);
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

  function findSupportUnderTarget(targetBody) {
    const targetBottom = targetBody.bounds.max.y;
    let best = null;
    let bestDistance = Infinity;

    for (const body of Composite.allBodies(world)) {
      const data = body.plugin;
      if (!data || data.kind !== "block" || data.dead) continue;
      const horizontallyAligned =
        body.bounds.min.x <= targetBody.position.x + 28 &&
        body.bounds.max.x >= targetBody.position.x - 28;
      if (!horizontallyAligned) continue;
      const distance = body.bounds.min.y - targetBottom;
      if (distance < -8 || distance > 150 || distance >= bestDistance) continue;
      best = body;
      bestDistance = distance;
    }

    return best;
  }

  function removeBodyFromWorld(body) {
    Composite.remove(world, body);
    if (Pairs && typeof Pairs.clear === "function" && engine && engine.pairs) {
      Pairs.clear(engine.pairs);
    }
  }

  function wakeDynamicBodies(origin, radius) {
    if (!world) return;
    for (const body of Composite.allBodies(world)) {
      const data = body.plugin;
      if (!data || data.dead || body.isStatic || data.kind === "terrain" || data.kind === "shot") continue;
      const distance = origin ? Vector.magnitude(Vector.sub(body.position, origin)) : 0;
      if (origin && distance > radius) continue;
      Sleeping.set(body, false);
      if (data.kind === "target") {
        Body.setVelocity(body, {
          x: body.velocity.x,
          y: Math.max(body.velocity.y, 0.55)
        });
        Body.setAngularVelocity(body, body.angularVelocity + (!origin || body.position.x >= origin.x ? 0.012 : -0.012));
      }
    }
  }

  function enforceTargetDrops() {
    for (const body of Composite.allBodies(world)) {
      const data = body.plugin;
      if (!data || data.kind !== "target" || data.dead || body.position.y > GROUND_Y - 18) continue;
      if (hasSupportBelow(body)) {
        data.dropFrames = 0;
        continue;
      }
      data.dropFrames = (data.dropFrames || 0) + 1;
      Sleeping.set(body, false);
      Body.setVelocity(body, {
        x: body.velocity.x,
        y: Math.max(body.velocity.y + 0.42, 1.15)
      });
      Body.translate(body, {
        x: 0,
        y: Math.min(2.8, 0.45 + data.dropFrames * 0.08)
      });
    }
  }

  function hasSupportBelow(body) {
    const footY = body.bounds.max.y;
    for (const other of Composite.allBodies(world)) {
      if (other === body || !other.bounds) continue;
      const data = other.plugin;
      if (!data || data.dead || (data.kind !== "block" && data.kind !== "terrain")) continue;
      const horizontalOverlap =
        other.bounds.max.x > body.bounds.min.x + 5 &&
        other.bounds.min.x < body.bounds.max.x - 5;
      if (!horizontalOverlap) continue;
      const gap = other.bounds.min.y - footY;
      if (gap >= -3 && gap <= 12) return true;
    }
    return false;
  }

  function launchVelocityFromPull(pull) {
    return {
      x: pull.x * LAUNCH_POWER,
      y: pull.y * LAUNCH_POWER
    };
  }

  function buildTrajectoryPoints(start, velocity, radius, sampleEvery = TRAJECTORY_SAMPLE_EVERY) {
    const points = [];
    let x = start.x;
    let y = start.y;
    let vx = velocity.x;
    let vy = velocity.y;
    const frictionAir = currentShot && Number.isFinite(currentShot.frictionAir) ? currentShot.frictionAir : 0.01;
    const air = Math.max(0, 1 - frictionAir * (PHYSICS_STEP / (1000 / 60)));
    const gravityScale = engine && engine.gravity && Number.isFinite(engine.gravity.scale) ? engine.gravity.scale : 0.001;
    const gravityStep = (engine && engine.gravity ? engine.gravity.y : 1) * gravityScale * PHYSICS_STEP * PHYSICS_STEP;
    const groundLimit = GROUND_Y - (radius || 20);

    for (let step = 1; step <= TRAJECTORY_STEPS; step++) {
      vx *= air;
      vy = vy * air + gravityStep;
      x += vx;
      y += vy;
      if (step % sampleEvery === 0) {
        points.push({ x, y, pct: step / TRAJECTORY_STEPS, step });
      }
      if (y > groundLimit || x > BASE_W + 160 || x < -160) break;
    }

    return points;
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

    drawSlingFrame();

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

    const aiBackdrop = drawAiBackgroundLayers();

    if (!aiBackdrop) {
      drawImageCover(artImages.bgFar, 0, 0, BASE_W, BASE_H, 0.38);

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

      ctx.save();
      const farMist = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      farMist.addColorStop(0, "rgba(222, 213, 238, 0.26)");
      farMist.addColorStop(0.48, "rgba(160, 137, 190, 0.13)");
      farMist.addColorStop(1, "rgba(45, 31, 57, 0)");
      ctx.fillStyle = farMist;
      ctx.fillRect(0, 0, BASE_W, GROUND_Y);
      ctx.restore();

      drawImageCover(artImages.bgMid, 0, 0, BASE_W, BASE_H, 0.62);
      drawGothicSilhouettes();
    }

    drawBackgroundDepthWash();

    if (!drawAiGround()) {
      for (let x = -12; x < BASE_W + 96; x += 96) {
        drawArt(artImages.floor, x + 48, GROUND_Y + 34, 96, 96, 0, 1);
      }
    }
    drawForegroundSeparation();
  }

  function imageReady(image) {
    const w = image ? image.naturalWidth || image.width || 0 : 0;
    const h = image ? image.naturalHeight || image.height || 0 : 0;
    return Boolean(image && w > 0 && h > 0 && (image.complete !== false));
  }

  function drawImageCover(image, x, y, w, h, alpha = 1) {
    if (!imageReady(image)) return false;
    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (image.naturalWidth - sw) / 2;
    const sy = (image.naturalHeight - sh) / 2;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
    return true;
  }

  function drawBackgroundDepthWash() {
    ctx.save();
    const upperMist = ctx.createLinearGradient(0, 190, 0, GROUND_Y + 18);
    upperMist.addColorStop(0, "rgba(210, 202, 232, 0.02)");
    upperMist.addColorStop(0.46, "rgba(174, 159, 205, 0.075)");
    upperMist.addColorStop(0.82, "rgba(24, 18, 34, 0.22)");
    upperMist.addColorStop(1, "rgba(5, 4, 8, 0.42)");
    ctx.fillStyle = upperMist;
    ctx.fillRect(0, 190, BASE_W, GROUND_Y - 190 + 18);

    const footShadow = ctx.createLinearGradient(0, GROUND_Y - 42, 0, GROUND_Y + 16);
    footShadow.addColorStop(0, "rgba(1, 1, 3, 0)");
    footShadow.addColorStop(0.58, "rgba(1, 1, 4, 0.38)");
    footShadow.addColorStop(1, "rgba(0, 0, 0, 0.68)");
    ctx.fillStyle = footShadow;
    ctx.fillRect(0, GROUND_Y - 42, BASE_W, 58);
    ctx.restore();
  }

  function drawAiBackgroundLayers() {
    if (!imageReady(artImages.aiBackground)) return false;
    drawImageCoverFiltered(artImages.aiBackground, 0, 0, BASE_W, BASE_H, 0.29, "blur(1.4px) saturate(0.58) brightness(1.12)");

    ctx.save();
    const farWash = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    farWash.addColorStop(0, "rgba(238, 229, 255, 0.48)");
    farWash.addColorStop(0.34, "rgba(194, 174, 226, 0.34)");
    farWash.addColorStop(0.66, "rgba(118, 91, 141, 0.14)");
    farWash.addColorStop(1, "rgba(8, 5, 12, 0)");
    ctx.fillStyle = farWash;
    ctx.fillRect(0, 0, BASE_W, GROUND_Y);
    ctx.restore();

    drawImageCoverSlice(artImages.aiBackground, 218, 210, 0.2, "blur(0.8px) saturate(0.72) brightness(1.05)");
    drawImageCoverSlice(artImages.aiBackground, 354, 168, 0.38, "saturate(0.85) brightness(0.95)");

    ctx.save();
    const nearShade = ctx.createLinearGradient(0, 318, 0, GROUND_Y + 10);
    nearShade.addColorStop(0, "rgba(10, 7, 14, 0)");
    nearShade.addColorStop(0.54, "rgba(5, 4, 8, 0.18)");
    nearShade.addColorStop(1, "rgba(5, 4, 8, 0.44)");
    ctx.fillStyle = nearShade;
    ctx.fillRect(0, 300, BASE_W, GROUND_Y - 300 + 10);
    ctx.restore();

    return true;
  }

  function drawImageCoverFiltered(image, x, y, w, h, alpha = 1, filter = "none") {
    if (!imageReady(image)) return false;
    ctx.save();
    ctx.filter = filter;
    drawImageCover(image, x, y, w, h, alpha);
    ctx.restore();
    return true;
  }

  function drawImageCoverSlice(image, destY, destH, alpha = 1, filter = "none") {
    if (!imageReady(image)) return false;
    const imageW = image.naturalWidth || image.width;
    const imageH = image.naturalHeight || image.height;
    const scale = Math.max(BASE_W / imageW, BASE_H / imageH);
    const sw = BASE_W / scale;
    const sh = destH / scale;
    const sx = (imageW - sw) / 2;
    const sy = (imageH - BASE_H / scale) / 2 + destY / scale;
    ctx.save();
    ctx.filter = filter;
    ctx.globalAlpha *= alpha;
    ctx.drawImage(image, sx, sy, sw, sh, 0, destY, BASE_W, destH);
    ctx.restore();
    return true;
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

  function drawAiGround() {
    if (!imageReady(artImages.aiTiles)) return false;
    const topCells = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 1 }
    ];
    const frontCells = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 }
    ];

    ctx.save();
    ctx.fillStyle = "rgba(1, 1, 4, 0.72)";
    ctx.fillRect(0, GROUND_Y - 14, BASE_W, 25);
    ctx.restore();

    for (let x = -22; x < BASE_W + 76; x += 64) {
      const cell = topCells[Math.abs(Math.floor((x + 22) / 64)) % topCells.length];
      drawAiCell(
        artImages.aiTiles,
        cell.col,
        cell.row,
        8,
        4,
        x + 32,
        GROUND_Y + 12,
        72,
        72,
        0,
        1,
        0.12,
        { color: "rgba(0, 0, 0, 0.86)", blur: 9, y: 5 }
      );
    }

    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.fillStyle = "rgba(3, 2, 6, 0.82)";
    ctx.fillRect(0, GROUND_Y + 22, BASE_W, BASE_H - GROUND_Y);
    ctx.strokeStyle = "rgba(255, 234, 183, 0.48)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 2);
    ctx.lineTo(BASE_W, GROUND_Y + 2);
    ctx.stroke();
    ctx.restore();

    for (let x = -36; x < BASE_W + 96; x += 96) {
      const cell = frontCells[Math.abs(Math.floor((x + 36) / 96)) % frontCells.length];
      drawAiCell(
        artImages.aiTiles,
        cell.col,
        cell.row,
        8,
        4,
        x + 48,
        GROUND_Y + 58,
        102,
        76,
        0,
        1,
        0.12,
        { color: "rgba(0, 0, 0, 0.9)", blur: 10, y: 7 }
      );
    }
    return true;
  }

  function drawForegroundSeparation() {
    ctx.save();
    const upperRim = ctx.createLinearGradient(0, GROUND_Y - 18, 0, GROUND_Y + 16);
    upperRim.addColorStop(0, "rgba(0, 0, 0, 0)");
    upperRim.addColorStop(0.42, "rgba(0, 0, 0, 0.48)");
    upperRim.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = upperRim;
    ctx.fillRect(0, GROUND_Y - 18, BASE_W, 34);

    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(0, 0, 0, 0.86)";
    ctx.shadowBlur = 9;
    ctx.shadowOffsetY = 4;
    ctx.strokeStyle = "rgba(255, 232, 176, 0.56)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 1.5);
    ctx.lineTo(BASE_W, GROUND_Y + 1.5);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(8, 5, 10, 0.78)";
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 18);
    ctx.lineTo(BASE_W, GROUND_Y + 18);
    ctx.stroke();
    ctx.restore();
  }

  function drawAiCell(image, col, row, cols, rows, x, y, w, h, rotation = 0, alpha = 1, inset = 0.06, shadow = null) {
    if (!imageReady(image)) return false;
    const sourceW = image.naturalWidth || image.width;
    const sourceH = image.naturalHeight || image.height;
    const cellW = sourceW / cols;
    const cellH = sourceH / rows;
    const sx = col * cellW + cellW * inset;
    const sy = row * cellH + cellH * inset;
    const sw = cellW * (1 - inset * 2);
    const sh = cellH * (1 - inset * 2);

    ctx.save();
    ctx.globalAlpha *= alpha;
    if (shadow) {
      ctx.shadowColor = shadow.color || "rgba(0, 0, 0, 0.72)";
      ctx.shadowBlur = shadow.blur || 0;
      ctx.shadowOffsetX = shadow.x || 0;
      ctx.shadowOffsetY = shadow.y || 0;
    }
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.drawImage(image, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }

  function createTransparentSpriteSheet(image) {
    const sheet = document.createElement("canvas");
    sheet.width = image.naturalWidth;
    sheet.height = image.naturalHeight;
    const sheetCtx = sheet.getContext("2d", { willReadFrequently: true });
    sheetCtx.drawImage(image, 0, 0);
    const pixels = sheetCtx.getImageData(0, 0, sheet.width, sheet.height);
    const data = pixels.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const chroma = max - min;
      const veryDark = max < 30;
      const darkSheetBackdrop = max < 48 && b >= r && b >= g && chroma < 30;

      if (veryDark || darkSheetBackdrop) {
        data[i + 3] = 0;
      } else if (max < 58 && chroma < 34) {
        data[i + 3] = Math.min(data[i + 3], 120);
      }
    }

    sheetCtx.putImageData(pixels, 0, 0);
    return sheet;
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
    const stretch = Math.min(1, Vector.magnitude(Vector.sub(p, SLING)) / MAX_PULL);
    const wobble = Math.sin(performance.now() / 70) * (1 + stretch * 1.6);
    const anchors = behind
      ? [SLING_ANCHORS.backLeft, SLING_ANCHORS.backRight]
      : [SLING_ANCHORS.frontLeft, SLING_ANCHORS.frontRight];
    const pouch = {
      x: p.x - 1,
      y: p.y + 7 + wobble * 0.35
    };
    const bandColor = behind ? "rgba(53, 31, 22, 0.9)" : "rgba(88, 52, 31, 0.98)";
    const highlight = behind ? "rgba(151, 91, 54, 0.58)" : "rgba(220, 144, 75, 0.74)";

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = behind ? 5 : 8;
    ctx.shadowOffsetY = 2;

    for (const anchor of anchors) {
      const control = {
        x: (anchor.x + pouch.x) / 2 + (anchor.x < pouch.x ? -5 : 5),
        y: (anchor.y + pouch.y) / 2 + 7 + stretch * 7 + wobble
      };
      ctx.lineWidth = behind ? 8 : 6;
      ctx.strokeStyle = bandColor;
      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y);
      ctx.quadraticCurveTo(control.x, control.y, pouch.x, pouch.y);
      ctx.stroke();

      ctx.lineWidth = behind ? 2.2 : 1.8;
      ctx.strokeStyle = highlight;
      ctx.beginPath();
      ctx.moveTo(anchor.x + 0.5, anchor.y - 1);
      ctx.quadraticCurveTo(control.x, control.y - 1.5, pouch.x, pouch.y - 1.2);
      ctx.stroke();
    }

    if (!behind) {
      ctx.shadowBlur = 4;
      ctx.fillStyle = "rgba(58, 32, 21, 0.96)";
      ctx.strokeStyle = "rgba(226, 159, 84, 0.68)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(pouch.x, pouch.y + 2, 15 + stretch * 3, 7, -0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAim() {
    if (!currentShot || !drag) return;
    const pull = Vector.sub(SLING, currentShot.position);
    if (Vector.magnitude(pull) < MIN_LAUNCH_PULL) return;
    const points = buildTrajectoryPoints(
      currentShot.position,
      launchVelocityFromPull(pull),
      currentShot.plugin && currentShot.plugin.radius
    );

    if (points.length < 2) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(255, 214, 112, 0.95)";
    ctx.shadowBlur = 10;
    ctx.setLineDash([9, 7]);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(23, 12, 5, 0.72)";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 218, 118, 0.98)";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < points.length; i += 2) {
      const point = points[i];
      const fade = 1 - point.pct * 0.72;
      const radius = Math.max(2.8, 6.2 - point.pct * 4);
      ctx.globalAlpha = fade;
      ctx.fillStyle = "rgba(20, 9, 4, 0.85)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = i % 4 === 0 ? "#fff2ba" : "#ffca59";
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSlingFrame() {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.78)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    drawSprite("sling", SLING_ART.x, SLING_ART.y, SLING_ART.w, SLING_ART.h, 0, { shadow: false });
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = "rgba(242, 185, 98, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SLING_ANCHORS.frontLeft.x - 2, SLING_ANCHORS.frontLeft.y + 2);
    ctx.lineTo(SLING_ANCHORS.backLeft.x + 3, SLING_ANCHORS.backLeft.y - 2);
    ctx.moveTo(SLING_ANCHORS.frontRight.x + 2, SLING_ANCHORS.frontRight.y + 2);
    ctx.lineTo(SLING_ANCHORS.backRight.x - 3, SLING_ANCHORS.backRight.y - 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawBody(body) {
    const data = body.plugin || {};
    const p = body.position;

    if (data.kind === "shot") {
      drawContactShadow(body, 30, 0.24);
      drawBirdShot(body, data.sprite || currentShotSprite);
      return;
    }

    if (data.kind === "target") {
      const scale = data.enemy === "knight" ? 68 : data.enemy === "bat" ? 58 : 62;
      drawContactShadow(body, scale * 0.44, data.enemy === "bat" ? 0.14 : 0.32);
      if (
        !drawSprite(data.enemy, p.x, p.y, scale, scale, body.angle, {
          fallback: false,
          shadow: { color: "rgba(0, 0, 0, 0.9)", blur: 12, y: 5 }
        }) &&
        !drawArt(artImages[data.enemy], p.x, p.y, scale, scale, body.angle, 1)
      ) {
        drawSprite("skull", p.x, p.y, 56, 56, body.angle);
      }
      drawHealthRing(body, 31);
      return;
    }

    if (data.kind === "block") {
      const alpha = Math.max(0.35, Math.min(1, data.health / data.maxHealth));
      drawContactShadow(body, Math.max(data.width, data.height) * 0.42, 0.3);
      drawSprite(data.sprite, p.x, p.y, data.width, data.height, body.angle, {
        alpha,
        shadow: { color: "rgba(0, 0, 0, 0.88)", blur: 10, y: 5 }
      });
      if (alpha < 0.7) drawCracks(p.x, p.y, data.width, data.height, body.angle);
    }
  }

  function drawContactShadow(body, width, alpha) {
    if (!body || body.position.y > GROUND_Y + 32) return;
    const drop = Math.max(0, Math.min(1, 1 - Math.max(0, GROUND_Y - body.bounds.max.y) / 150));
    if (drop <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = alpha * drop;
    ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
    ctx.filter = "blur(1.5px)";
    ctx.beginPath();
    ctx.ellipse(body.position.x, Math.min(GROUND_Y + 7, body.bounds.max.y + 7), width, Math.max(5, width * 0.18), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBirdShot(body, spriteKey) {
    const row = BIRD_ROWS[spriteKey];
    const p = body.position;
    const speed = Vector.magnitude(body.velocity);
    const now = performance.now();
    const pulled = body === currentShot && !launched && drag;
    let frame = pulled ? 1 : 0;

    if (launched && body === currentShot) {
      if (body.plugin && body.plugin.impactUntil && now < body.plugin.impactUntil) {
        frame = 5;
      } else if (speed > 7.5) {
        frame = 4;
      } else {
        frame = 2 + (Math.floor(now / 95) % 2);
      }
    }

    const rotation = launched && speed > 0.8
      ? Math.max(-0.65, Math.min(0.55, Math.atan2(body.velocity.y, body.velocity.x) * 0.22))
      : body.angle * 0.25;

    if (
      row !== undefined &&
      drawAiCell(
        artImages.aiBirds,
        frame,
        row,
        BIRD_GRID.cols,
        BIRD_GRID.rows,
        p.x,
        p.y,
        76,
        66,
        rotation,
        1,
        0.035,
        { color: "rgba(0, 0, 0, 0.82)", blur: 9, y: 4 }
      )
    ) {
      return;
    }

    drawSprite(spriteKey, p.x, p.y, 54, 54, body.angle);
  }

  function drawSprite(key, x, y, w, h, rotation, options = {}) {
    const safeKey = key || "";
    const alpha = options.alpha === undefined ? 1 : options.alpha;
    const aiCell = AI_SPRITES[safeKey];
    const aiSpriteSheet = artImages.aiSpritesKeyed || artImages.aiSprites;
    const shadow = options.shadow === false
      ? null
      : options.shadow || { color: "rgba(0, 0, 0, 0.78)", blur: 7, y: 3 };
    if (
      aiCell &&
      drawAiCell(
        aiSpriteSheet,
        aiCell.col,
        aiCell.row,
        AI_SPRITE_GRID.cols,
        AI_SPRITE_GRID.rows,
        x,
        y,
        w,
        h,
        rotation,
        alpha,
        0.055,
        shadow
      )
    ) {
      return true;
    }

    const frame = FRAMES[key];

    if (spriteReady && frame) {
      ctx.save();
      ctx.globalAlpha *= alpha;
      if (shadow) {
        ctx.shadowColor = shadow.color || "rgba(0, 0, 0, 0.72)";
        ctx.shadowBlur = shadow.blur || 0;
        ctx.shadowOffsetX = shadow.x || 0;
        ctx.shadowOffsetY = shadow.y || 0;
      }
      ctx.translate(x, y);
      ctx.rotate(rotation || 0);
      ctx.drawImage(spriteImage, frame.x, frame.y, frame.w, frame.h, -w / 2, -h / 2, w, h);
      ctx.restore();
      return true;
    }

    if (options.fallback === false) return false;

    ctx.save();
    ctx.globalAlpha *= alpha;
    if (shadow) {
      ctx.shadowColor = shadow.color || "rgba(0, 0, 0, 0.72)";
      ctx.shadowBlur = shadow.blur || 0;
      ctx.shadowOffsetX = shadow.x || 0;
      ctx.shadowOffsetY = shadow.y || 0;
    }
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.fillStyle = fallbackColor(safeKey);
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
    return false;
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
      if (spriteReady || imageReady(artImages.aiSprites)) {
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
