(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const ui = {
    speed: document.getElementById("speedValue"),
    time: document.getElementById("timeValue"),
    distance: document.getElementById("distanceValue"),
    score: document.getElementById("scoreValue"),
    boostFill: document.getElementById("boostFill"),
    hullFill: document.getElementById("hullFill"),
    itemValue: document.getElementById("itemValue"),
    overlay: document.getElementById("overlay"),
    overlayTitle: document.getElementById("overlayTitle"),
    overlayText: document.getElementById("overlayText"),
    primaryButton: document.getElementById("primaryButton"),
    soundButton: document.getElementById("soundButton"),
    messageFeed: document.getElementById("messageFeed"),
    touchLeft: document.getElementById("touchLeft"),
    touchRight: document.getElementById("touchRight"),
    touchBoost: document.getElementById("touchBoost")
  };

  const W = 1280;
  const H = 720;
  const HORIZON = 246;
  const DEPTH_SCALE = 42000;
  const ROAD_SCREEN_SCALE = 64000;
  const ROAD_WORLD_HALF = 720;
  const CAMERA_Z = 100;
  const FINISH_DISTANCE = 14800;
  const CHECKPOINT_STEP = 2100;
  const LANES = [-420, -140, 140, 420];

  const imageSources = {
    playerChase: "assets/images/player-chase-imagen.png",
    playerSheet: "assets/images/player-car-sheet.png",
    horizon3d: "assets/images/horizon-3d-imagen.png",
    bgClean: "assets/images/bg-clean-imagen.png",
    parallaxForeground: "assets/images/parallax-foreground-imagen.png",
    roadTexture: "assets/images/road-texture-imagen.png",
    rivalCar: "assets/images/rival-car-imagen.png",
    rivalSheet: "assets/images/rival-car-sheet.png",
    itemMorphSheet: "assets/images/item-morph-sheet.png",
    boostCell: "assets/images/boost-cell-imagen.png",
    boostPad: "assets/images/boost-pad-imagen.png",
    drone: "assets/images/drone-imagen.png",
    uiPanel: "assets/images/ui-panel-imagen.png",
    skyline: "assets/images/skyline.svg"
  };

  const audioSources = {
    bgm: "assets/audio/bgm-loop.wav",
    bgmLocal: "assets/audio/local/ridge-bgm.wav",
    engine: "assets/audio/engine-loop.wav",
    boost: "assets/audio/boost.wav",
    crash: "assets/audio/crash.wav",
    crashLocal: "assets/audio/local/ridge-crash.wav",
    pickup: "assets/audio/pickup.wav",
    pickupLocal: "assets/audio/local/ridge-pickup.wav",
    checkpoint: "assets/audio/checkpoint.wav",
    checkpointLocal: "assets/audio/local/ridge-finish.wav"
  };

  const images = {};
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false
  };

  let dpr = 1;
  let lastTime = 0;
  let mode = "ready";
  let primaryAction = () => startRace();
  let messageTimer = 0;

  const state = createInitialState();

  class AudioDeck {
    constructor() {
      this.enabled = true;
      this.unlocked = false;
      this.bgm = new Audio(audioSources.bgmLocal);
      this.bgmLayer = new Audio(audioSources.bgm);
      this.engine = new Audio(audioSources.engine);
      this.sfx = {
        boost: new Audio(audioSources.boost),
        crash: new Audio(audioSources.crashLocal),
        pickup: new Audio(audioSources.pickupLocal),
        checkpoint: new Audio(audioSources.checkpointLocal),
        crashSynth: new Audio(audioSources.crash),
        pickupSynth: new Audio(audioSources.pickup),
        checkpointSynth: new Audio(audioSources.checkpoint)
      };
      this.bgm.loop = true;
      this.bgmLayer.loop = true;
      this.engine.loop = true;
      this.bgm.volume = 0.38;
      this.bgmLayer.volume = 0.1;
      this.engine.volume = 0.16;
      for (const sound of Object.values(this.sfx)) {
        sound.preload = "auto";
        sound.volume = 0.62;
      }
    }

    unlock() {
      if (this.unlocked || !this.enabled) return;
      this.unlocked = true;
      this.bgm.play().catch(() => {});
      this.bgmLayer.play().catch(() => {});
      this.engine.play().catch(() => {});
    }

    setEnabled(enabled) {
      this.enabled = enabled;
      ui.soundButton.setAttribute("aria-pressed", String(!enabled));
      ui.soundButton.textContent = enabled ? "Sound" : "Muted";
      if (enabled) {
        this.unlock();
      } else {
        this.bgm.pause();
        this.bgmLayer.pause();
        this.engine.pause();
      }
    }

    play(name) {
      if (!this.enabled || !this.unlocked || !this.sfx[name]) return;
      const sound = this.sfx[name].cloneNode();
      sound.volume = this.sfx[name].volume;
      sound.play().catch(() => {});
    }

    update(speed, boosting) {
      if (!this.enabled || !this.unlocked) return;
      this.engine.volume = mode === "playing" ? 0.1 + Math.min(speed / 720, 1) * 0.18 : 0.04;
      this.engine.playbackRate = 0.72 + Math.min(speed / 720, 1) * 0.92 + (boosting ? 0.16 : 0);
      this.bgm.volume = mode === "playing" ? 0.38 : 0.22;
      this.bgmLayer.volume = mode === "playing" ? 0.08 : 0.03;
    }
  }

  const audio = new AudioDeck();

  function createInitialState() {
    return {
      distance: 0,
      speed: 0,
      score: 0,
      timeLeft: 98,
      health: 100,
      boost: 72,
      playerLane: 0,
      playerLaneV: 0,
      cameraLean: 0,
      cameraBob: 0,
      spawnTimer: 0,
      nextCheckpoint: CHECKPOINT_STEP,
      objects: [],
      particles: [],
      combo: 0,
      comboTimer: 0,
      itemName: "Ready",
      itemTimer: 0,
      shield: 0,
      overdrive: 0,
      empPulse: 0,
      roadShake: 0,
      flash: 0
    };
  }

  function resetState() {
    Object.assign(state, createInitialState());
    spawnOpeningTraffic();
    updateHud();
  }

  function spawnOpeningTraffic() {
    state.objects.push(makeTraffic(state.distance + 760, LANES[1]));
    state.objects.push(makeTraffic(state.distance + 1220, LANES[2]));
    state.objects.push(makePickup(state.distance + 1540, LANES[0]));
    state.objects.push(makeBoostPad(state.distance + 1960, LANES[3]));
    state.objects.push(makeDrone(state.distance + 2360, LANES[1]));
  }

  function loadImages() {
    return Promise.all(Object.entries(imageSources).map(([key, src]) => new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        images[key] = image;
        resolve();
      };
      image.onerror = () => {
        console.warn(`Image failed: ${src}`);
        resolve();
      };
      image.src = src;
    })));
  }

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomChoice(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function roadCurve(world) {
    return Math.sin(world * 0.00105) * 390
      + Math.sin(world * 0.00034 + 1.4) * 260
      + Math.sin(world * 0.0023 + 0.5) * 70;
  }

  function roadPitch(world) {
    return Math.sin(world * 0.0017 + 0.6) * 18 + Math.sin(world * 0.00072) * 26;
  }

  function cameraLane() {
    return state.playerLane * 0.74;
  }

  function roadCenterScreen(world, depth) {
    const cameraWorld = state.distance + CAMERA_Z;
    const curveOffset = (roadCurve(world) - roadCurve(cameraWorld)) * 44 / Math.max(depth, 70);
    const leanOffset = -state.cameraLean * 34;
    return W / 2 + curveOffset - cameraLane() * roadScale(depth) + leanOffset;
  }

  function roadHalfScreen(depth) {
    return ROAD_SCREEN_SCALE / Math.max(depth, 42);
  }

  function roadScale(depth) {
    return roadHalfScreen(depth) / ROAD_WORLD_HALF;
  }

  function depthForRow(y) {
    return DEPTH_SCALE / Math.max(1, y - HORIZON);
  }

  function yForDepth(depth) {
    return HORIZON + DEPTH_SCALE / Math.max(depth, 1);
  }

  function project(world, lane) {
    const depth = world - state.distance;
    if (depth < 54) return null;
    const y = yForDepth(depth) + roadPitch(world) * 0.26;
    if (y < HORIZON - 80 || y > H + 170) return null;
    const x = roadCenterScreen(world, depth) + (lane - cameraLane()) * roadScale(depth);
    const scale = clamp(300 / depth, 0.08, 3.2);
    return { x, y, depth, scale };
  }

  function makeTraffic(world, lane, imageKey = "rivalCar") {
    return {
      type: "traffic",
      imageKey,
      world,
      lane,
      w: 104,
      h: 130,
      hit: false,
      scored: false,
      drift: (Math.random() - 0.5) * 18,
      phase: Math.random() * Math.PI * 2
    };
  }

  function makePickup(world, lane) {
    return {
      type: "pickup",
      imageKey: "itemMorphSheet",
      world,
      lane,
      w: 86,
      h: 72,
      hit: false,
      phase: Math.random() * Math.PI * 2
    };
  }

  function makeBoostPad(world, lane) {
    return {
      type: "boostPad",
      imageKey: "boostPad",
      world,
      lane,
      w: 190,
      h: 86,
      hit: false,
      phase: 0
    };
  }

  function makeDrone(world, lane) {
    return {
      type: "drone",
      imageKey: "drone",
      world,
      lane,
      w: 90,
      h: 90,
      hit: false,
      scored: false,
      phase: Math.random() * Math.PI * 2
    };
  }

  function startRace() {
    resetState();
    mode = "playing";
    audio.unlock();
    closeOverlay();
    showMessage("Polished HD rush");
  }

  function pauseRace() {
    if (mode !== "playing") return;
    mode = "paused";
    openOverlay("Paused", "Third-person pursuit view is holding position.", "Resume");
    primaryAction = resumeRace;
  }

  function resumeRace() {
    if (mode !== "paused") return;
    mode = "playing";
    closeOverlay();
    lastTime = performance.now();
  }

  function finishRace() {
    mode = "finished";
    state.score += Math.round(state.timeLeft * 190 + state.health * 40 + state.boost * 22);
    audio.play("checkpoint");
    openOverlay("Finish Clear", `Score ${Math.round(state.score).toLocaleString("de-DE")} - chase run complete.`, "Race Again");
    primaryAction = startRace;
  }

  function failRace(reason) {
    mode = "failed";
    audio.play("crash");
    openOverlay("Run Ended", reason, "Restart");
    primaryAction = startRace;
  }

  function openOverlay(title, text, button) {
    ui.overlayTitle.textContent = title;
    ui.overlayText.textContent = text;
    ui.primaryButton.textContent = button;
    ui.overlay.classList.add("is-open");
  }

  function closeOverlay() {
    ui.overlay.classList.remove("is-open");
  }

  function showMessage(text) {
    ui.messageFeed.textContent = text;
    ui.messageFeed.classList.add("is-visible");
    messageTimer = 1.8;
  }

  function update(dt) {
    if (mode !== "playing") {
      audio.update(state.speed, false);
      return;
    }

    const accelerating = keys.up || (!keys.down && state.speed < 270);
    const braking = keys.down;
    const boosting = keys.boost && state.boost > 0 && state.speed > 135;

    if (accelerating) state.speed += 222 * dt;
    if (braking) state.speed -= 370 * dt;
    state.speed -= 36 * dt;

    const maxSpeed = boosting ? 720 : 492;
    if (boosting) {
      state.speed += state.overdrive > 0 ? 500 * dt : 430 * dt;
      state.boost = Math.max(0, state.boost - 29 * dt);
      state.score += 110 * dt;
      addTrailParticles(2);
    } else {
      state.boost = Math.min(100, state.boost + (state.speed > 260 ? 4.7 : 7.6) * dt);
    }
    state.speed = clamp(state.speed, 0, maxSpeed);

    const steer = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
    const steerPower = 760 + state.speed * 0.46;
    state.playerLaneV += steer * steerPower * dt;
    state.playerLaneV *= Math.pow(0.0012, dt);
    state.playerLane += state.playerLaneV * dt;
    state.playerLane = clamp(state.playerLane, -ROAD_WORLD_HALF + 86, ROAD_WORLD_HALF - 86);
    state.cameraLean += (steer * 0.9 + state.playerLaneV / 880 - state.cameraLean) * Math.min(1, dt * 7);
    state.cameraBob += dt * (4.2 + state.speed / 120);

    const offroad = Math.abs(state.playerLane) > ROAD_WORLD_HALF - 130;
    if (offroad) {
      state.speed -= 130 * dt;
      state.health = Math.max(0, state.health - 4.5 * dt);
      if (Math.random() < 0.12) addSparks(W / 2 + state.playerLane * 0.12, H - 122, "#ffb247", 1);
    }

    state.distance += state.speed * dt;
    state.timeLeft -= dt;
    state.score += (state.speed * 0.24 + (boosting ? 135 : 0)) * dt;
    state.spawnTimer -= dt;
    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer === 0) state.combo = 0;
    state.itemTimer = Math.max(0, state.itemTimer - dt);
    state.shield = Math.max(0, state.shield - dt);
    state.overdrive = Math.max(0, state.overdrive - dt);
    state.empPulse = Math.max(0, state.empPulse - dt);
    if (state.itemTimer === 0 && state.itemName !== "Ready") state.itemName = "Ready";
    state.roadShake = Math.max(0, state.roadShake - dt * 8);
    state.flash = Math.max(0, state.flash - dt * 2.2);

    if (state.spawnTimer <= 0) {
      spawnRoadObject();
      state.spawnTimer = clamp(0.74 - state.distance / 56000, 0.34, 0.74);
    }

    updateObjects(dt);
    updateParticles(dt);
    handleCheckpoints();

    if (state.distance >= FINISH_DISTANCE) finishRace();
    if (state.timeLeft <= 0) failRace("The clock won this one.");
    if (state.health <= 0) failRace("Hull integrity collapsed.");

    audio.update(state.speed, boosting);
    updateHud();
    if (messageTimer > 0) {
      messageTimer -= dt;
      if (messageTimer <= 0) ui.messageFeed.classList.remove("is-visible");
    }
  }

  function spawnRoadObject() {
    const lane = randomChoice(LANES);
    const world = state.distance + 1350 + Math.random() * 780;
    const roll = Math.random();
    if (roll < 0.47) {
      state.objects.push(makeTraffic(world, lane));
    } else if (roll < 0.68) {
      state.objects.push(makePickup(world, lane));
    } else if (roll < 0.83) {
      state.objects.push(makeBoostPad(world, lane));
    } else {
      state.objects.push(makeDrone(world, lane));
    }
  }

  function updateObjects(dt) {
    const remaining = [];
    for (const obj of state.objects) {
      const z = obj.world - state.distance;
      if (z < -80) continue;
      if (obj.type === "traffic") obj.lane += obj.drift * dt;
      if (obj.type === "drone") obj.lane += Math.sin(state.distance * 0.012 + obj.phase) * 18 * dt;

      if (!obj.hit && z > 80 && z < 172) {
        const collisionWidth = obj.type === "boostPad" ? 150 : obj.type === "pickup" ? 82 : 118;
        if (Math.abs(obj.lane - state.playerLane) < collisionWidth) collideWith(obj);
      }
      if (!obj.hit && !obj.scored && (obj.type === "traffic" || obj.type === "drone") && z < 70) {
        obj.scored = true;
        if (Math.abs(obj.lane - state.playerLane) < 230) {
          state.score += 420;
          state.boost = Math.min(100, state.boost + 5);
          showMessage("Near miss +boost");
          addSparks(W / 2 + (obj.lane - state.playerLane) * 0.22, H - 168, "#35e7ff", 8);
        }
      }
      remaining.push(obj);
    }
    state.objects = remaining;
  }

  function collideWith(obj) {
    obj.hit = true;
    const screenX = W / 2 + (obj.lane - state.playerLane) * 0.34;
    const screenY = H - 138;
    if (obj.type === "traffic" || obj.type === "drone") {
      if (state.shield > 0) {
        state.shield = 0;
        state.score += 500;
        state.speed *= 0.9;
        addSparks(screenX, screenY, "#35e7ff", 24);
        audio.play("checkpointSynth");
        showMessage("Shield break");
        return;
      }
      const damage = obj.type === "drone" ? 22 : 17;
      state.health = Math.max(0, state.health - damage);
      state.speed *= obj.type === "drone" ? 0.48 : 0.62;
      state.roadShake = 1;
      state.flash = 1;
      state.score = Math.max(0, state.score - 700);
      addSparks(screenX, screenY, "#ff4e5f", 20);
      audio.play("crash");
      audio.play("crashSynth");
      showMessage("Impact");
    } else if (obj.type === "pickup") {
      state.combo += 1;
      state.comboTimer = 2.2;
      state.score += 500 + state.combo * 110;
      activateMorphItem();
      addSparks(screenX, screenY - 50, "#9cff46", 16);
      audio.play("pickup");
      audio.play("pickupSynth");
    } else if (obj.type === "boostPad") {
      state.boost = Math.min(100, state.boost + 44);
      state.speed = Math.max(state.speed, 540);
      state.score += 980;
      addTrailParticles(18);
      audio.play("boost");
      showMessage("Launch strip");
    }
  }

  function activateMorphItem() {
    const roll = Math.floor((state.distance * 0.017 + performance.now() * 0.006) % 6);
    const items = [
      { name: "Nitro", run: () => { state.boost = Math.min(100, state.boost + 38); state.speed = Math.max(state.speed, 560); } },
      { name: "Shield", run: () => { state.shield = 6.5; } },
      { name: "EMP", run: () => { state.empPulse = 1.4; state.objects.forEach((obj) => { if (obj.type === "drone" && obj.world - state.distance < 1400) obj.hit = true; }); } },
      { name: "Repair", run: () => { state.health = Math.min(100, state.health + 22); } },
      { name: "Prism", run: () => { state.score += 1400; state.comboTimer = 3; } },
      { name: "Overdrive", run: () => { state.overdrive = 4.2; state.boost = Math.min(100, state.boost + 16); } }
    ];
    const item = items[roll];
    item.run();
    state.itemName = item.name;
    state.itemTimer = 4.5;
    showMessage(`${item.name} item`);
  }

  function handleCheckpoints() {
    if (state.distance < state.nextCheckpoint) return;
    const left = Math.max(0, FINISH_DISTANCE - state.distance);
    state.timeLeft += left > 0 ? 18 : 0;
    state.score += 2200;
    state.nextCheckpoint += CHECKPOINT_STEP;
    state.boost = Math.min(100, state.boost + 16);
    state.flash = 0.82;
    audio.play("checkpoint");
    audio.play("checkpointSynth");
    showMessage(left > 0 ? "Checkpoint +" : "Finish gate");
  }

  function addSparks(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 560,
        vy: (Math.random() - 0.5) * 360,
        life: 0.35 + Math.random() * 0.45,
        age: 0,
        size: 2 + Math.random() * 5,
        color
      });
    }
  }

  function addTrailParticles(count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x: W / 2 + (Math.random() - 0.5) * 130 + state.cameraLean * 20,
        y: H - 46 + Math.random() * 28,
        vx: (Math.random() - 0.5) * 110,
        vy: 230 + Math.random() * 180,
        life: 0.32 + Math.random() * 0.38,
        age: 0,
        size: 5 + Math.random() * 12,
        color: Math.random() > 0.5 ? "#35e7ff" : "#ff3dbd"
      });
    }
  }

  function updateParticles(dt) {
    const alive = [];
    for (const p of state.particles) {
      p.age += dt;
      if (p.age >= p.life) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.18, dt);
      p.vy *= Math.pow(0.4, dt);
      alive.push(p);
    }
    state.particles = alive;
  }

  function draw() {
    ctx.save();
    const shake = state.roadShake > 0 ? state.roadShake * 9 : 0;
    if (shake) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    drawBackground();
    drawMode7Road();
    drawRoadObjects();
    drawPlayer();
    drawParticles();
    drawVignette();
    if (state.flash > 0) drawFlash();
    ctx.restore();
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#070914");
    sky.addColorStop(0.45, "#11152c");
    sky.addColorStop(1, "#05070d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    if (images.bgClean) {
      const horizonShift = (roadCurve(state.distance + 1800) - roadCurve(state.distance)) * 0.018;
      drawCoverImage(images.bgClean, -60 + horizonShift, -52, W + 120, 448);
    } else if (images.horizon3d) {
      const horizonShift = (roadCurve(state.distance + 1300) - roadCurve(state.distance)) * 0.05;
      drawCoverImage(images.horizon3d, -80 + horizonShift, -28, W + 160, 420);
    } else if (images.skyline) {
      const parallax = (state.distance * 0.02) % W;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(images.skyline, -parallax, 30, W, 214);
      ctx.drawImage(images.skyline, W - parallax, 30, W, 214);
      ctx.globalAlpha = 1;
    }

    if (images.parallaxForeground) {
      drawParallaxLayer(images.parallaxForeground, 0.045, 130, 360, 0.2);
      drawParallaxLayer(images.parallaxForeground, 0.12, 252, 300, 0.12);
    }

    const fog = ctx.createLinearGradient(0, 140, 0, HORIZON + 42);
    fog.addColorStop(0, "rgba(5, 7, 13, 0)");
    fog.addColorStop(1, "rgba(5, 7, 13, 0.86)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, W, HORIZON + 64);
  }

  function drawParallaxLayer(image, speed, y, h, alpha) {
    const w = W + 180;
    const shift = ((state.distance * speed) % w + w) % w;
    ctx.save();
    ctx.globalAlpha = alpha;
    drawCoverImage(image, -shift - 90, y, w, h);
    drawCoverImage(image, w - shift - 90, y, w, h);
    ctx.restore();
  }

  function drawCoverImage(image, x, y, w, h) {
    const sourceRatio = image.naturalWidth / image.naturalHeight;
    const targetRatio = w / h;
    let sx = 0;
    let sy = 0;
    let sw = image.naturalWidth;
    let sh = image.naturalHeight;
    if (sourceRatio > targetRatio) {
      sw = image.naturalHeight * targetRatio;
      sx = (image.naturalWidth - sw) / 2;
    } else {
      sh = image.naturalWidth / targetRatio;
      sy = (image.naturalHeight - sh) / 2;
    }
    ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
  }

  function drawMode7Road() {
    const rowStep = 5;
    const cameraWorld = state.distance + CAMERA_Z;
    for (let y = HORIZON; y < H + rowStep; y += rowStep) {
      const y1 = y;
      const y2 = y + rowStep;
      const d1 = depthForRow(y1);
      const d2 = depthForRow(y2);
      const w1 = cameraWorld + d1;
      const w2 = cameraWorld + d2;
      const c1 = roadCenterScreen(w1, d1);
      const c2 = roadCenterScreen(w2, d2);
      const h1 = roadHalfScreen(d1);
      const h2 = roadHalfScreen(d2);
      const left1 = c1 - h1;
      const right1 = c1 + h1;
      const left2 = c2 - h2;
      const right2 = c2 + h2;
      const alt = Math.floor((w1 + state.distance * 0.25) / 150) % 2 === 0;

      ctx.beginPath();
      ctx.moveTo(left1, y1);
      ctx.lineTo(right1, y1);
      ctx.lineTo(right2, y2);
      ctx.lineTo(left2, y2);
      ctx.closePath();
      if (images.roadTexture) {
        ctx.save();
        ctx.clip();
        const sourceY = Math.min(images.roadTexture.naturalHeight - 2, Math.floor((w1 * 0.46) % images.roadTexture.naturalHeight));
        ctx.globalAlpha = 0.82;
        ctx.drawImage(
          images.roadTexture,
          0,
          sourceY,
          images.roadTexture.naturalWidth,
          2,
          Math.min(left1, left2),
          y1,
          Math.max(right1, right2) - Math.min(left1, left2),
          rowStep + 1
        );
        ctx.globalAlpha = alt ? 0.11 : 0.17;
        ctx.fillStyle = alt ? "#35e7ff" : "#ff3dbd";
        ctx.fillRect(Math.min(left1, left2), y1, Math.max(right1, right2) - Math.min(left1, left2), rowStep + 1);
        ctx.restore();
      } else {
        ctx.fillStyle = alt ? "#151923" : "#10141d";
        ctx.fill();
      }

      drawShoulder(left1, left2, y1, y2, alt ? "#ff3dbd" : "#35e7ff", -1);
      drawShoulder(right1, right2, y1, y2, alt ? "#35e7ff" : "#ffd34d", 1);

      for (const lane of [-ROAD_WORLD_HALF / 2, 0, ROAD_WORLD_HALF / 2]) {
        drawLaneLine(w1, w2, d1, d2, y1, y2, lane);
      }
    }

    const nearGrad = ctx.createLinearGradient(0, HORIZON, 0, H);
    nearGrad.addColorStop(0, "rgba(5,7,13,0.45)");
    nearGrad.addColorStop(0.35, "rgba(5,7,13,0)");
    nearGrad.addColorStop(1, "rgba(0,0,0,0.16)");
    ctx.fillStyle = nearGrad;
    ctx.fillRect(0, HORIZON, W, H - HORIZON);
  }

  function drawShoulder(edge1, edge2, y1, y2, color, side) {
    const width1 = 18 + (y1 - HORIZON) * 0.055;
    const width2 = 18 + (y2 - HORIZON) * 0.055;
    ctx.beginPath();
    ctx.moveTo(edge1, y1);
    ctx.lineTo(edge1 + width1 * side, y1);
    ctx.lineTo(edge2 + width2 * side, y2);
    ctx.lineTo(edge2, y2);
    ctx.closePath();
    ctx.globalAlpha = 0.46;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawLaneLine(w1, w2, d1, d2, y1, y2, lane) {
    if (Math.floor(w1 / 130) % 2 !== 0) return;
    const x1 = roadCenterScreen(w1, d1) + (lane - cameraLane()) * roadScale(d1);
    const x2 = roadCenterScreen(w2, d2) + (lane - cameraLane()) * roadScale(d2);
    ctx.strokeStyle = lane === 0 ? "rgba(255,255,255,0.62)" : "rgba(53,231,255,0.42)";
    ctx.lineWidth = lane === 0 ? 5 : 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1 + 1);
    ctx.lineTo(x2, y2 - 1);
    ctx.stroke();
  }

  function drawRoadObjects() {
    const drawables = state.objects
      .filter((obj) => !obj.hit)
      .map((obj) => ({ obj, p: project(obj.world, obj.lane) }))
      .filter(({ p }) => p)
      .sort((a, b) => b.p.depth - a.p.depth);

    for (const { obj, p } of drawables) {
      let bob = 0;
      let rotation = 0;
      if (obj.type === "pickup") bob = Math.sin(performance.now() * 0.006 + obj.phase) * 6 * p.scale;
      if (obj.type === "drone") bob = Math.sin(performance.now() * 0.005 + obj.phase) * 12 * p.scale;
      if (obj.type === "traffic") rotation = Math.sin(obj.phase + state.distance * 0.005) * 0.035;

      const width = obj.w * p.scale;
      const height = obj.h * p.scale;
      if (obj.type === "boostPad") drawRoadGlow(p.x, p.y, width * 1.3, height * 0.7, "#9cff46");
      if (obj.type === "traffic" && images.rivalSheet) {
        const frame = state.empPulse > 0 ? 3 : Math.abs(obj.drift) > 8 ? (obj.drift < 0 ? 1 : 2) : Math.floor((state.distance * 0.015 + obj.phase) % 2);
        drawSheetFrame("rivalSheet", 4, frame, p.x, p.y + bob, width * 1.18, height * 1.18, rotation);
      } else if (obj.type === "pickup" && images.itemMorphSheet) {
        const frame = Math.floor((performance.now() * 0.012 + obj.phase + p.depth * 0.004) % 8);
        drawSheetFrame("itemMorphSheet", 8, frame, p.x, p.y + bob, width * 1.4, height * 1.4, rotation + Math.sin(performance.now() * 0.004 + obj.phase) * 0.18);
      } else {
        drawAsset(obj.imageKey, p.x, p.y + bob, width, height, rotation);
      }
      if (obj.type === "pickup") drawPickupRing(p.x, p.y + bob, p.scale);
      if (obj.type === "drone") drawDroneBeam(p.x, p.y, p.scale);
    }
  }

  function drawRoadGlow(x, y, w, h, color) {
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y + h * 0.18, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPickupRing(x, y, scale) {
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = "#9cff46";
    ctx.lineWidth = Math.max(2, 4 * scale);
    ctx.beginPath();
    ctx.arc(x, y, 36 * scale + Math.sin(performance.now() * 0.006) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawDroneBeam(x, y, scale) {
    ctx.save();
    const beam = ctx.createLinearGradient(x, y, x, y + 160 * scale);
    beam.addColorStop(0, "rgba(255,78,95,0.38)");
    beam.addColorStop(1, "rgba(255,78,95,0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(x - 18 * scale, y + 28 * scale);
    ctx.lineTo(x + 18 * scale, y + 28 * scale);
    ctx.lineTo(x + 62 * scale, y + 180 * scale);
    ctx.lineTo(x - 62 * scale, y + 180 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    const boosting = keys.boost && state.boost > 0 && state.speed > 135 && mode === "playing";
    const x = W / 2 + state.playerLane * 0.1 + state.cameraLean * 12;
    const y = H - 110 + Math.sin(state.cameraBob) * 3;
    const tilt = clamp(state.cameraLean * 0.08, -0.14, 0.14);

    ctx.save();
    if (boosting) {
      const boost = ctx.createLinearGradient(x, y + 72, x, H + 60);
      boost.addColorStop(0, "rgba(53,231,255,0.78)");
      boost.addColorStop(0.42, "rgba(255,61,189,0.42)");
      boost.addColorStop(1, "rgba(255,61,189,0)");
      ctx.fillStyle = boost;
      ctx.beginPath();
      ctx.moveTo(x - 84, y + 78);
      ctx.lineTo(x + 84, y + 78);
      ctx.lineTo(x + 210, H + 44);
      ctx.lineTo(x - 210, H + 44);
      ctx.closePath();
      ctx.fill();
    }

    const shadow = ctx.createRadialGradient(x, y + 132, 10, x, y + 132, 190);
    shadow.addColorStop(0, "rgba(0,0,0,0.48)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(x, y + 130, 186, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y);
    ctx.rotate(tilt);
    if (state.shield > 0) drawPlayerShield(0, -72, 1);
    if (images.playerSheet) {
      let frame = 0;
      if (state.flash > 0.25) frame = 4;
      else if (boosting || state.overdrive > 0) frame = 3;
      else if (state.cameraLean < -0.18) frame = 1;
      else if (state.cameraLean > 0.18) frame = 2;
      drawSheetFrameAtCurrentTransform("playerSheet", 5, frame, -214, -250, 428, 388);
    } else if (images.playerChase) {
      ctx.drawImage(images.playerChase, -190, -246, 380, 380);
    } else {
      ctx.fillStyle = "#35e7ff";
      ctx.fillRect(-70, -180, 140, 220);
    }
    ctx.restore();
    if (state.shield > 0) drawHudAura(x, y - 70, "#35e7ff", 0.22 + Math.sin(performance.now() * 0.012) * 0.08);
    if (state.empPulse > 0) drawEmpPulse();
  }

  function drawPlayerShield(x, y, scale) {
    ctx.save();
    ctx.globalAlpha = 0.34 + Math.sin(performance.now() * 0.012) * 0.08;
    ctx.strokeStyle = "#35e7ff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(x, y, 205 * scale, 148 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawHudAura(x, y, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, 220, 160, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawEmpPulse() {
    ctx.save();
    const radius = (1.4 - state.empPulse) * 460;
    ctx.globalAlpha = Math.max(0, state.empPulse / 1.4) * 0.42;
    ctx.strokeStyle = "#ff3dbd";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(W / 2, H - 120, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawAsset(key, x, y, w, h, rotation = 0) {
    const image = images[key];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    if (image) {
      ctx.drawImage(image, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillStyle = "#35e7ff";
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    ctx.restore();
  }

  function drawSheetFrame(key, columns, frame, x, y, w, h, rotation = 0) {
    const image = images[key];
    if (!image) return drawAsset(key, x, y, w, h, rotation);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    drawSheetFrameAtCurrentTransform(key, columns, frame, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function drawSheetFrameAtCurrentTransform(key, columns, frame, x, y, w, h) {
    const image = images[key];
    if (!image) return;
    const frameWidth = image.naturalWidth / columns;
    const sx = Math.max(0, Math.min(columns - 1, frame)) * frameWidth;
    ctx.drawImage(image, sx, 0, frameWidth, image.naturalHeight, x, y, w, h);
  }

  function drawParticles() {
    for (const p of state.particles) {
      const alpha = 1 - p.age / p.life;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawVignette() {
    const vignette = ctx.createRadialGradient(W / 2, H * 0.52, 240, W / 2, H * 0.52, 770);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.46)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function drawFlash() {
    ctx.globalAlpha = state.flash * 0.18;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  function updateHud() {
    ui.speed.textContent = Math.round(state.speed).toString();
    ui.time.textContent = Math.max(0, Math.ceil(state.timeLeft)).toString();
    ui.distance.textContent = (state.distance / 1000).toFixed(1);
    ui.score.textContent = Math.round(state.score).toLocaleString("de-DE");
    ui.itemValue.textContent = state.itemName;
    ui.boostFill.style.transform = `scaleX(${clamp(state.boost / 100, 0, 1)})`;
    ui.hullFill.style.transform = `scaleX(${clamp(state.health / 100, 0, 1)})`;
  }

  function frame(now) {
    const dt = Math.min((now - lastTime) / 1000 || 0, 0.033);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function setKey(action, pressed) {
    keys[action] = pressed;
  }

  function bindInput() {
    window.addEventListener("keydown", (event) => {
      if (event.repeat && event.code !== "Space") return;
      if (event.code === "ArrowLeft" || event.code === "KeyA") setKey("left", true);
      if (event.code === "ArrowRight" || event.code === "KeyD") setKey("right", true);
      if (event.code === "ArrowUp" || event.code === "KeyW") setKey("up", true);
      if (event.code === "ArrowDown" || event.code === "KeyS") setKey("down", true);
      if (event.code === "Space") {
        event.preventDefault();
        setKey("boost", true);
        audio.unlock();
      }
      if (event.code === "Enter" && mode !== "playing") primaryAction();
      if (event.code === "KeyP" || event.code === "Escape") {
        if (mode === "playing") pauseRace();
        else if (mode === "paused") resumeRace();
      }
      if (event.code === "KeyM") audio.setEnabled(!audio.enabled);
    });

    window.addEventListener("keyup", (event) => {
      if (event.code === "ArrowLeft" || event.code === "KeyA") setKey("left", false);
      if (event.code === "ArrowRight" || event.code === "KeyD") setKey("right", false);
      if (event.code === "ArrowUp" || event.code === "KeyW") setKey("up", false);
      if (event.code === "ArrowDown" || event.code === "KeyS") setKey("down", false);
      if (event.code === "Space") setKey("boost", false);
    });

    ui.primaryButton.addEventListener("click", () => {
      audio.unlock();
      primaryAction();
    });
    ui.soundButton.addEventListener("click", () => audio.setEnabled(!audio.enabled));

    bindTouch(ui.touchLeft, "left");
    bindTouch(ui.touchRight, "right");
    bindTouch(ui.touchBoost, "boost");
  }

  function bindTouch(button, action) {
    const press = (event) => {
      event.preventDefault();
      audio.unlock();
      setKey(action, true);
    };
    const release = (event) => {
      event.preventDefault();
      setKey(action, false);
    };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  }

  async function boot() {
    resizeCanvas();
    bindInput();
    await loadImages();
    resetState();
    updateHud();
    primaryAction = startRace;
    requestAnimationFrame((time) => {
      lastTime = time;
      frame(time);
    });
  }

  window.addEventListener("resize", resizeCanvas);
  boot();
})();
