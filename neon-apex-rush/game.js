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
  const PLAYER_Y = 584;
  const FINISH_DISTANCE = 12800;
  const CHECKPOINT_STEP = 1850;
  const ROAD_HALF_WIDTH = 334;
  const LANES = [-210, -70, 70, 210];

  const imageSources = {
    player: "assets/images/player-car.svg",
    trafficRuby: "assets/images/traffic-ruby.svg",
    trafficCyan: "assets/images/traffic-cyan.svg",
    trafficGold: "assets/images/traffic-gold.svg",
    boostCell: "assets/images/boost-cell.svg",
    boostPad: "assets/images/boost-pad.svg",
    drone: "assets/images/hazard-drone.svg",
    skyline: "assets/images/skyline.svg"
  };

  const audioSources = {
    bgm: "assets/audio/bgm-loop.wav",
    engine: "assets/audio/engine-loop.wav",
    boost: "assets/audio/boost.wav",
    crash: "assets/audio/crash.wav",
    pickup: "assets/audio/pickup.wav",
    checkpoint: "assets/audio/checkpoint.wav"
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
      this.bgm = new Audio(audioSources.bgm);
      this.engine = new Audio(audioSources.engine);
      this.sfx = {
        boost: new Audio(audioSources.boost),
        crash: new Audio(audioSources.crash),
        pickup: new Audio(audioSources.pickup),
        checkpoint: new Audio(audioSources.checkpoint)
      };
      this.bgm.loop = true;
      this.engine.loop = true;
      this.bgm.volume = 0.33;
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
      this.engine.volume = mode === "playing" ? 0.1 + Math.min(speed / 680, 1) * 0.16 : 0.04;
      this.engine.playbackRate = 0.78 + Math.min(speed / 680, 1) * 0.82 + (boosting ? 0.12 : 0);
      this.bgm.volume = mode === "playing" ? 0.34 : 0.22;
    }
  }

  const audio = new AudioDeck();

  function createInitialState() {
    return {
      distance: 0,
      speed: 0,
      targetSpeed: 0,
      score: 0,
      timeLeft: 95,
      health: 100,
      boost: 68,
      playerX: W / 2,
      playerVX: 0,
      roadShake: 0,
      spawnTimer: 0,
      nextCheckpoint: CHECKPOINT_STEP,
      objects: [],
      particles: [],
      combo: 0,
      comboTimer: 0,
      flash: 0
    };
  }

  function resetState() {
    Object.assign(state, createInitialState());
    spawnOpeningTraffic();
    updateHud();
  }

  function spawnOpeningTraffic() {
    state.objects.push(makeTraffic(state.distance + 760, LANES[1], "trafficCyan"));
    state.objects.push(makePickup(state.distance + 1100, LANES[2]));
    state.objects.push(makeBoostPad(state.distance + 1480, LANES[0]));
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

  function roadCenterAt(worldY) {
    return W / 2
      + Math.sin(worldY * 0.00138) * 132
      + Math.sin(worldY * 0.00039 + 1.6) * 74
      + Math.sin(worldY * 0.0028 + 0.4) * 22;
  }

  function roadTiltAt(worldY) {
    return Math.cos(worldY * 0.00138) * 0.11 + Math.cos(worldY * 0.00039 + 1.6) * 0.045;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomChoice(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function makeTraffic(world, lane, imageKey = randomChoice(["trafficRuby", "trafficCyan", "trafficGold"])) {
    return {
      type: "traffic",
      imageKey,
      world,
      lane,
      w: 58,
      h: 108,
      drift: (Math.random() - 0.5) * 18,
      hit: false,
      spin: (Math.random() - 0.5) * 0.05
    };
  }

  function makePickup(world, lane) {
    return {
      type: "pickup",
      imageKey: "boostCell",
      world,
      lane,
      w: 54,
      h: 54,
      bob: Math.random() * Math.PI * 2,
      hit: false
    };
  }

  function makeBoostPad(world, lane) {
    return {
      type: "boostPad",
      imageKey: "boostPad",
      world,
      lane,
      w: 118,
      h: 62,
      hit: false
    };
  }

  function makeDrone(world, lane) {
    return {
      type: "drone",
      imageKey: "drone",
      world,
      lane,
      w: 66,
      h: 66,
      hit: false,
      phase: Math.random() * Math.PI * 2
    };
  }

  function startRace() {
    resetState();
    mode = "playing";
    audio.unlock();
    closeOverlay();
    showMessage("Checkpoint sprint");
  }

  function pauseRace() {
    if (mode !== "playing") return;
    mode = "paused";
    openOverlay("Paused", "The highway is holding its breath.", "Resume");
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
    state.score += Math.round(state.timeLeft * 180 + state.health * 35 + state.boost * 18);
    audio.play("checkpoint");
    openOverlay("Finish Clear", `Score ${Math.round(state.score).toLocaleString("de-DE")} - neon run complete.`, "Race Again");
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

    const accelerating = keys.up || (!keys.down && state.speed < 230);
    const braking = keys.down;
    const boosting = keys.boost && state.boost > 0 && state.speed > 125;

    if (accelerating) state.speed += 212 * dt;
    if (braking) state.speed -= 360 * dt;
    state.speed -= 38 * dt;

    const maxSpeed = boosting ? 690 : 472;
    if (boosting) {
      state.speed += 420 * dt;
      state.boost = Math.max(0, state.boost - 28 * dt);
      state.score += 95 * dt;
      addTrailParticles(2);
    } else {
      state.boost = Math.min(100, state.boost + (state.speed > 240 ? 4.8 : 7.2) * dt);
    }
    state.speed = clamp(state.speed, 0, maxSpeed);

    const steer = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
    const steerPower = 560 + state.speed * 0.36;
    state.playerVX += steer * steerPower * dt;
    state.playerVX *= Math.pow(0.0018, dt);
    state.playerX += state.playerVX * dt;

    const roadCenter = roadCenterAt(state.distance + 630);
    const margin = 44;
    const leftEdge = roadCenter - ROAD_HALF_WIDTH + margin;
    const rightEdge = roadCenter + ROAD_HALF_WIDTH - margin;
    if (state.playerX < leftEdge) {
      state.playerX = leftEdge;
      state.playerVX *= -0.18;
      offroadPenalty(dt);
    } else if (state.playerX > rightEdge) {
      state.playerX = rightEdge;
      state.playerVX *= -0.18;
      offroadPenalty(dt);
    }

    state.distance += state.speed * dt;
    state.timeLeft -= dt;
    state.score += (state.speed * 0.22 + (boosting ? 120 : 0)) * dt;
    state.spawnTimer -= dt;
    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer === 0) state.combo = 0;
    state.roadShake = Math.max(0, state.roadShake - dt * 8);
    state.flash = Math.max(0, state.flash - dt * 2.2);

    if (state.spawnTimer <= 0) {
      spawnRoadObject();
      state.spawnTimer = clamp(0.72 - state.distance / 52000, 0.38, 0.72);
    }

    updateObjects();
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

  function offroadPenalty(dt) {
    state.speed -= 115 * dt;
    state.health = Math.max(0, state.health - 4 * dt);
    if (Math.random() < 0.16) addSparks(state.playerX, PLAYER_Y + 26, "#ffb247", 1);
  }

  function spawnRoadObject() {
    const lane = randomChoice(LANES);
    const world = state.distance + 930 + Math.random() * 240;
    const roll = Math.random();
    if (roll < 0.54) {
      state.objects.push(makeTraffic(world, lane));
    } else if (roll < 0.78) {
      state.objects.push(makePickup(world, lane));
    } else if (roll < 0.91) {
      state.objects.push(makeBoostPad(world, lane));
    } else {
      state.objects.push(makeDrone(world, lane));
    }
  }

  function updateObjects() {
    const remaining = [];
    for (const obj of state.objects) {
      if (obj.type === "traffic") obj.lane += obj.drift * 0.0018;
      const screen = screenForObject(obj);
      if (screen.y > H + 150) continue;
      if (!obj.hit && screen.y > PLAYER_Y - 72 && screen.y < PLAYER_Y + 62) {
        const playerHalf = 42;
        const objectHalf = obj.w * 0.48;
        if (Math.abs(screen.x - state.playerX) < playerHalf + objectHalf) {
          collideWith(obj, screen);
        }
      }
      remaining.push(obj);
    }
    state.objects = remaining;
  }

  function collideWith(obj, screen) {
    obj.hit = true;
    if (obj.type === "traffic" || obj.type === "drone") {
      const damage = obj.type === "drone" ? 20 : 16;
      state.health = Math.max(0, state.health - damage);
      state.speed *= obj.type === "drone" ? 0.48 : 0.62;
      state.roadShake = 1;
      state.flash = 1;
      state.score = Math.max(0, state.score - 650);
      addSparks(screen.x, screen.y, "#ff4e5f", 18);
      audio.play("crash");
      showMessage("Impact");
    } else if (obj.type === "pickup") {
      state.boost = Math.min(100, state.boost + 24);
      state.combo += 1;
      state.comboTimer = 2.2;
      state.score += 420 + state.combo * 85;
      addSparks(screen.x, screen.y, "#9cff46", 14);
      audio.play("pickup");
      showMessage(state.combo > 1 ? `Cell chain x${state.combo}` : "Boost cell");
    } else if (obj.type === "boostPad") {
      state.boost = Math.min(100, state.boost + 42);
      state.speed = Math.max(state.speed, 520);
      state.score += 900;
      addTrailParticles(16);
      audio.play("boost");
      showMessage("Launch strip");
    }
  }

  function screenForObject(obj) {
    const screenY = 104 + (obj.world - state.distance) * 0.58;
    const center = roadCenterAt(obj.world);
    const sway = obj.type === "drone" ? Math.sin(performance.now() * 0.004 + obj.phase) * 18 : 0;
    return {
      x: center + obj.lane + sway,
      y: screenY
    };
  }

  function handleCheckpoints() {
    if (state.distance < state.nextCheckpoint) return;
    const left = Math.max(0, FINISH_DISTANCE - state.distance);
    state.timeLeft += left > 0 ? 18 : 0;
    state.score += 2000;
    state.nextCheckpoint += CHECKPOINT_STEP;
    state.boost = Math.min(100, state.boost + 16);
    state.flash = 0.8;
    audio.play("checkpoint");
    showMessage(left > 0 ? "Checkpoint +" : "Finish gate");
  }

  function addSparks(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 520,
        vy: (Math.random() - 0.5) * 320,
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
        x: state.playerX + (Math.random() - 0.5) * 58,
        y: PLAYER_Y + 58 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 90,
        vy: 210 + Math.random() * 160,
        life: 0.3 + Math.random() * 0.35,
        age: 0,
        size: 4 + Math.random() * 9,
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
    const shake = state.roadShake > 0 ? state.roadShake * 8 : 0;
    if (shake) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    drawBackground();
    drawRoad();
    drawRoadObjects();
    drawPlayer();
    drawParticles();
    if (state.flash > 0) drawFlash();
    ctx.restore();
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#080a18");
    sky.addColorStop(0.48, "#111128");
    sky.addColorStop(1, "#05070d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const parallax = (state.distance * 0.02) % W;
    if (images.skyline) {
      ctx.globalAlpha = 0.9;
      ctx.drawImage(images.skyline, -parallax, 36, W, 210);
      ctx.drawImage(images.skyline, W - parallax, 36, W, 210);
    }
    ctx.globalAlpha = 0.32;
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 91 - state.distance * 0.085) % (W + 120) - 60;
      const h = 88 + ((i * 37) % 130);
      ctx.fillStyle = i % 3 === 0 ? "#122739" : "#181b31";
      ctx.fillRect(x, 204 - h, 48 + (i % 4) * 14, h);
      ctx.fillStyle = i % 2 ? "rgba(255, 211, 77, 0.34)" : "rgba(53, 231, 255, 0.28)";
      for (let y = 204 - h + 12; y < 192; y += 22) {
        ctx.fillRect(x + 9, y, 8, 5);
        ctx.fillRect(x + 28, y, 8, 5);
      }
    }
    ctx.restore();
  }

  function drawRoad() {
    const segmentH = 36;
    const start = -segmentH;
    const worldBase = state.distance + 60;

    for (let y = start; y < H + segmentH; y += segmentH) {
      const w1 = worldBase + y * 1.6;
      const w2 = worldBase + (y + segmentH) * 1.6;
      const c1 = roadCenterAt(w1);
      const c2 = roadCenterAt(w2);
      const alt = Math.floor(w1 / 92) % 2 === 0;
      drawRoadStrip(y, y + segmentH, c1, c2, alt);
      drawLaneMarkers(y, y + segmentH, c1, c2, w1);
      drawRails(y, y + segmentH, c1, c2, w1);
    }
  }

  function drawRoadStrip(y1, y2, c1, c2, alt) {
    const left1 = c1 - ROAD_HALF_WIDTH;
    const right1 = c1 + ROAD_HALF_WIDTH;
    const left2 = c2 - ROAD_HALF_WIDTH;
    const right2 = c2 + ROAD_HALF_WIDTH;
    ctx.beginPath();
    ctx.moveTo(left1, y1);
    ctx.lineTo(right1, y1);
    ctx.lineTo(right2, y2);
    ctx.lineTo(left2, y2);
    ctx.closePath();
    ctx.fillStyle = alt ? "#151923" : "#10141d";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(left1 - 18, y1);
    ctx.lineTo(left1, y1);
    ctx.lineTo(left2, y2);
    ctx.lineTo(left2 - 18, y2);
    ctx.closePath();
    ctx.fillStyle = alt ? "#ff3dbd" : "#35e7ff";
    ctx.globalAlpha = 0.42;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(right1, y1);
    ctx.lineTo(right1 + 18, y1);
    ctx.lineTo(right2 + 18, y2);
    ctx.lineTo(right2, y2);
    ctx.closePath();
    ctx.fillStyle = alt ? "#35e7ff" : "#ffd34d";
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawLaneMarkers(y1, y2, c1, c2, world) {
    if (Math.floor(world / 72) % 2 !== 0) return;
    for (const offset of [-140, 0, 140]) {
      const x1 = c1 + offset;
      const x2 = c2 + offset;
      ctx.strokeStyle = offset === 0 ? "rgba(255,255,255,0.58)" : "rgba(53,231,255,0.42)";
      ctx.lineWidth = offset === 0 ? 5 : 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1 + 7);
      ctx.lineTo(x2, y2 - 7);
      ctx.stroke();
    }
  }

  function drawRails(y1, y2, c1, c2, world) {
    const pulse = Math.floor(world / 120) % 2;
    ctx.strokeStyle = pulse ? "rgba(156,255,70,0.34)" : "rgba(255,211,77,0.34)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c1 - ROAD_HALF_WIDTH - 38, y1);
    ctx.lineTo(c2 - ROAD_HALF_WIDTH - 38, y2);
    ctx.moveTo(c1 + ROAD_HALF_WIDTH + 38, y1);
    ctx.lineTo(c2 + ROAD_HALF_WIDTH + 38, y2);
    ctx.stroke();
  }

  function drawRoadObjects() {
    const drawables = state.objects
      .filter((obj) => !obj.hit)
      .map((obj) => ({ obj, screen: screenForObject(obj) }))
      .filter(({ screen }) => screen.y > -140 && screen.y < H + 140)
      .sort((a, b) => a.screen.y - b.screen.y);

    for (const { obj, screen } of drawables) {
      const scale = 0.82 + (screen.y / H) * 0.24;
      const bob = obj.type === "pickup" ? Math.sin(performance.now() * 0.006 + obj.bob) * 7 : 0;
      drawAsset(obj.imageKey, screen.x, screen.y + bob, obj.w * scale, obj.h * scale, obj.spin || 0);
      if (obj.type === "pickup") {
        ctx.save();
        ctx.globalAlpha = 0.38;
        ctx.strokeStyle = "#9cff46";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y + bob, 34 + Math.sin(performance.now() * 0.006) * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function drawPlayer() {
    const tilt = clamp(state.playerVX / 760, -0.22, 0.22) + roadTiltAt(state.distance + 620) * 0.26;
    const boosting = keys.boost && state.boost > 0 && state.speed > 125 && mode === "playing";
    if (boosting) {
      const grad = ctx.createLinearGradient(state.playerX, PLAYER_Y + 44, state.playerX, H);
      grad.addColorStop(0, "rgba(53,231,255,0.7)");
      grad.addColorStop(0.55, "rgba(255,61,189,0.34)");
      grad.addColorStop(1, "rgba(255,61,189,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(state.playerX - 38, PLAYER_Y + 46);
      ctx.lineTo(state.playerX + 38, PLAYER_Y + 46);
      ctx.lineTo(state.playerX + 92, H);
      ctx.lineTo(state.playerX - 92, H);
      ctx.closePath();
      ctx.fill();
    }
    drawAsset("player", state.playerX, PLAYER_Y, 92, 142, tilt);
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
