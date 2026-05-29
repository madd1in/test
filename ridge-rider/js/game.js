(function () {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const distanceEl = document.getElementById("distance");
  const flowEl = document.getElementById("flow");
  const boostFill = document.getElementById("boostFill");
  const menu = document.getElementById("menu");
  const menuCopy = document.getElementById("menuCopy");
  const startButton = document.getElementById("startButton");
  const pauseButton = document.getElementById("pauseButton");
  const audioButton = document.getElementById("audioButton");

  const criticalManifest = {
    backdrop: "./assets/generated/trail-backdrop-imagen.webp",
    rider: "./assets/sprites/rider-imagen.webp",
  };

  const optionalManifest = {
    frontTiles: "./assets/foreground/front-tiles-imagen.webp",
    props: "./assets/foreground/trail-props-imagen.webp",
    energy: "./assets/ui/energy-ring.svg",
    rock: "./assets/ui/rock.svg",
    flag: "./assets/ui/trail-flag.svg",
  };

  const audioManifest = {
    bgm: "./assets/audio/ridge-bgm.wav",
    jump: "./assets/audio/jump.wav",
    land: "./assets/audio/land.wav",
    pickup: "./assets/audio/pickup.wav",
    crash: "./assets/audio/crash.wav",
  };

  const propFrames = {
    ramp: { sx: 0, sy: 183, sw: 329, sh: 241 },
    bale: { sx: 315, sy: 219, sw: 197, sh: 161 },
    sign: { sx: 538, sy: 190, sw: 150, sh: 219 },
    stump: { sx: 695, sy: 205, sw: 183, sh: 216 },
    dust: { sx: 878, sy: 223, sw: 208, sh: 179 },
    berm: { sx: 1068, sy: 205, sw: 183, sh: 227 },
    ribbon: { sx: 1243, sy: 190, sw: 205, sh: 234 },
  };

  const assets = {};
  const audio = {
    muted: localStorage.getItem("ridge-rider-muted") === "1",
    unlocked: false,
    bgm: null,
    sfx: {},
  };

  const input = {
    jump: false,
    jumpPressed: false,
    jumpBuffer: 0,
    leanBack: false,
    leanForward: false,
    boost: false,
    lean: 0,
    boostEase: 0,
  };

  const world = {
    width: 0,
    height: 0,
    dpr: 1,
    lastTime: 0,
    mode: "loading",
    best: Number(localStorage.getItem("ridge-rider-best") || 0),
    pickups: [],
    hazards: [],
    markers: [],
    props: [],
    particles: [],
    nextSpawn: 600,
    nextProp: 340,
  };

  const rider = {
    worldX: 0,
    y: 0,
    vy: 0,
    speed: 360,
    angle: 0,
    spin: 0,
    airborne: false,
    airAngle: 0,
    flow: 100,
    boost: 72,
    score: 0,
    trick: 0,
    hitCooldown: 0,
    coyote: 0,
  };

  const keys = new Map([
    ["ArrowUp", "jump"],
    ["KeyW", "jump"],
    ["Space", "jump"],
    ["ArrowLeft", "leanBack"],
    ["KeyA", "leanBack"],
    ["ArrowRight", "leanForward"],
    ["KeyD", "leanForward"],
    ["ShiftLeft", "boost"],
    ["ShiftRight", "boost"],
    ["KeyX", "boost"],
  ]);

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not load ${src}`));
      img.src = src;
    });
  }

  async function loadImageSet(manifest) {
    const entries = await Promise.all(Object.entries(manifest).map(async ([key, src]) => [key, await loadImage(src)]));
    for (const [key, image] of entries) assets[key] = image;
  }

  function setupAudio() {
    updateAudioButton();
  }

  function ensureAudio() {
    if (audio.bgm) return;
    audio.bgm = new Audio();
    audio.bgm.preload = "none";
    audio.bgm.loop = true;
    audio.bgm.volume = 0.28;
    audio.bgm.src = audioManifest.bgm;
    audio.sfx.jump = makeAudio(audioManifest.jump, 0.36);
    audio.sfx.land = makeAudio(audioManifest.land, 0.24);
    audio.sfx.pickup = makeAudio(audioManifest.pickup, 0.36);
    audio.sfx.crash = makeAudio(audioManifest.crash, 0.32);
  }

  function makeAudio(src, volume) {
    const clip = new Audio();
    clip.preload = "none";
    clip.volume = volume;
    clip.src = src;
    return clip;
  }

  function updateAudioButton() {
    audioButton.textContent = audio.muted ? "MUTE" : "SND";
    audioButton.setAttribute("aria-pressed", String(!audio.muted));
  }

  function unlockAudio() {
    audio.unlocked = true;
    if (audio.muted) return;
    ensureAudio();
    playBgm();
  }

  function playBgm() {
    if (!audio.bgm || audio.muted || !audio.unlocked || world.mode !== "playing") return;
    audio.bgm.play().catch(() => {});
  }

  function stopBgm() {
    if (audio.bgm) audio.bgm.pause();
  }

  function playSfx(name, volumeScale = 1) {
    if (audio.muted || !audio.unlocked) return;
    const clip = audio.sfx[name];
    if (!clip) return;
    clip.pause();
    clip.currentTime = 0;
    const baseVolume = name === "land" ? 0.24 : name === "jump" ? 0.36 : name === "crash" ? 0.32 : 0.36;
    clip.volume = clamp(baseVolume * volumeScale, 0, 0.7);
    clip.play().catch(() => {});
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function approach(value, target, amount) {
    if (value < target) return Math.min(target, value + amount);
    return Math.max(target, value - amount);
  }

  function wrapAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  function rand01(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function terrainY(x) {
    const base = world.height * 0.71;
    const long = Math.sin(x * 0.00135 + 1.3) * world.height * 0.095;
    const mid = Math.sin(x * 0.0043 + 4.1) * world.height * 0.038;
    const fast = Math.sin(x * 0.0105) * world.height * 0.014;
    return base + long + mid + fast;
  }

  function terrainSlope(x) {
    return (terrainY(x + 8) - terrainY(x - 8)) / 16;
  }

  function resetRide() {
    input.jumpBuffer = 0;
    input.lean = 0;
    input.boostEase = 0;
    world.pickups = [];
    world.hazards = [];
    world.markers = [];
    world.props = [];
    world.particles = [];
    world.nextSpawn = 700;
    world.nextProp = 340;
    Object.assign(rider, {
      worldX: 0,
      y: terrainY(0),
      vy: 0,
      speed: 335,
      angle: Math.atan(terrainSlope(0)),
      spin: 0,
      airborne: false,
      airAngle: 0,
      flow: 100,
      boost: 86,
      score: 0,
      trick: 0,
      hitCooldown: 0,
      coyote: 0.14,
    });
    spawnAhead(4200);
  }

  function setMode(mode) {
    world.mode = mode;
    const open = mode === "menu" || mode === "gameover" || mode === "paused" || mode === "loading";
    menu.classList.toggle("is-open", open);
    pauseButton.textContent = mode === "paused" ? ">" : "II";

    if (mode === "loading") {
      menuCopy.textContent = "Loading assets.";
      startButton.textContent = "Loading";
      startButton.disabled = true;
    } else if (mode === "menu") {
      stopBgm();
      menuCopy.textContent = "Hold the line, land clean, keep your flow.";
      startButton.textContent = "Start Ride";
      startButton.disabled = false;
    } else if (mode === "paused") {
      stopBgm();
      menuCopy.textContent = `Best ${Math.round(world.best)} m`;
      startButton.textContent = "Resume";
      startButton.disabled = false;
    } else if (mode === "gameover") {
      stopBgm();
      menuCopy.textContent = `Run ${Math.round(rider.score)} m | Best ${Math.round(world.best)} m`;
      startButton.textContent = "Restart";
      startButton.disabled = false;
      playSfx("crash", 0.55);
    }
  }

  function startRide() {
    unlockAudio();
    if (world.mode === "paused") {
      setMode("playing");
      playBgm();
      return;
    }
    resetRide();
    setMode("playing");
    playSfx("land", 0.32);
    playBgm();
  }

  function spawnAhead(range) {
    const limit = rider.worldX + range;
    while (world.nextSpawn < limit) {
      const lane = Math.floor(world.nextSpawn / 300);
      const roll = rand01(lane);
      if (roll > 0.83) {
        world.hazards.push({
          x: world.nextSpawn + rand01(lane + 8) * 155,
          hit: false,
          scale: 0.66 + rand01(lane + 15) * 0.28,
        });
      } else {
        const count = roll > 0.24 ? 4 : 3;
        for (let i = 0; i < count; i += 1) {
          world.pickups.push({
            x: world.nextSpawn + i * 74,
            offset: 78 + Math.sin(lane + i) * 28,
            taken: false,
            wobble: rand01(lane + i + 27) * Math.PI * 2,
          });
        }
      }

      if (lane > 0 && lane % 8 === 0) {
        world.markers.push({ x: world.nextSpawn + 160 });
      }

      world.nextSpawn += 280 + rand01(lane + 3) * 290;
    }

    while (world.nextProp < limit) {
      const lane = Math.floor(world.nextProp / 240);
      const names = ["sign", "stump", "ribbon", "bale", "berm"];
      const name = names[Math.floor(rand01(lane + 41) * names.length)];
      world.props.push({
        x: world.nextProp + rand01(lane + 44) * 100,
        name,
        scale: 0.72 + rand01(lane + 45) * 0.24,
        side: rand01(lane + 47) > 0.58 ? 1 : -1,
      });
      world.nextProp += 430 + rand01(lane + 49) * 380;
    }

    const keepAfter = rider.worldX - 600;
    world.pickups = world.pickups.filter((item) => item.x > keepAfter && !item.taken);
    world.hazards = world.hazards.filter((item) => item.x > keepAfter);
    world.markers = world.markers.filter((item) => item.x > keepAfter);
    world.props = world.props.filter((item) => item.x > keepAfter);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    world.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    world.width = Math.max(320, Math.floor(rect.width));
    world.height = Math.max(360, Math.floor(rect.height));
    canvas.width = Math.floor(world.width * world.dpr);
    canvas.height = Math.floor(world.height * world.dpr);
    ctx.setTransform(world.dpr, 0, 0, world.dpr, 0, 0);
    if (!rider.y) rider.y = terrainY(rider.worldX);
  }

  function update(dt) {
    if (world.mode !== "playing") return;
    dt = Math.min(dt, 1 / 30);
    const slope = terrainSlope(rider.worldX);
    const slopeAngle = Math.atan(slope);
    const rawLean = (input.leanForward ? 1 : 0) - (input.leanBack ? 1 : 0);
    const leanRate = rawLean === 0 ? 5.8 : 4.4;
    input.lean = approach(input.lean, rawLean, dt * leanRate);
    input.boostEase = approach(input.boostEase, input.boost && rider.boost > 2 ? 1 : 0, dt * 3.2);
    input.jumpBuffer = Math.max(0, input.jumpBuffer - dt);
    rider.coyote = rider.airborne ? Math.max(0, rider.coyote - dt) : 0.14;

    const boosting = input.boostEase > 0.04 && rider.boost > 2;
    const targetSpeed = 335 + input.boostEase * 145 - slope * 86;
    rider.speed = lerp(rider.speed, targetSpeed, dt * (boosting ? 2.05 : 2.7));
    rider.speed = clamp(rider.speed, 230, 590);
    rider.worldX += rider.speed * dt;
    rider.score = Math.max(rider.score, rider.worldX / 10);

    if (boosting) {
      rider.boost = Math.max(0, rider.boost - dt * (18 + input.boostEase * 8));
      if (Math.random() < dt * 11 * input.boostEase) spawnDust(screenPlayerX() - 42, rider.y - 28, 0.8 + input.boostEase * 0.6);
    } else {
      rider.boost = Math.min(100, rider.boost + dt * (rider.airborne ? 12 : 22));
    }

    const lean = input.lean;
    if (input.jumpBuffer > 0 && (!rider.airborne || rider.coyote > 0)) {
      rider.airborne = true;
      rider.coyote = 0;
      rider.vy = -625 - clamp(rider.speed - 320, 0, 180) * 0.22;
      rider.spin = lean * 1.38 - slope * 0.42;
      rider.airAngle = 0;
      input.jumpBuffer = 0;
      spawnDust(screenPlayerX() - 28, rider.y - 12, 1.25);
      playSfx("jump", 0.72);
    }
    input.jumpPressed = false;

    if (rider.airborne) {
      const jumpHeld = input.jump && rider.vy < 0 ? 0.9 : 1;
      rider.vy += 1450 * jumpHeld * dt;
      rider.y += rider.vy * dt;
      rider.spin += lean * dt * 2.65;
      rider.spin *= 0.988;
      const prev = rider.angle;
      rider.angle += rider.spin * dt;
      rider.airAngle += wrapAngle(rider.angle - prev);
      const ground = terrainY(rider.worldX);
      if (rider.y >= ground) {
        rider.y = ground;
        rider.airborne = false;
        rider.vy = 0;
        const landingError = Math.abs(wrapAngle(rider.angle - slopeAngle));
        const rotations = Math.abs(rider.airAngle) / (Math.PI * 2);
        spawnDust(screenPlayerX() - 38, rider.y - 8, 1.45);
        playSfx("land", clamp(0.55 + landingError * 0.35, 0.45, 1.0));
        if (landingError > 1.24) {
          damage(11 + landingError * 9);
          rider.spin = 0;
          rider.angle = slopeAngle;
        } else {
          if (rotations > 0.62) {
            rider.trick = Math.round(rotations * 100);
            rider.boost = Math.min(100, rider.boost + 20 + rotations * 15);
            rider.flow = Math.min(100, rider.flow + rotations * 11);
          }
          rider.spin *= 0.45;
          rider.angle = lerp(rider.angle, slopeAngle, 0.66);
        }
      }
    } else {
      rider.y = terrainY(rider.worldX);
      rider.spin = lerp(rider.spin, 0, dt * 8);
      rider.angle = lerp(rider.angle, slopeAngle + lean * 0.1, dt * 9.5);
      rider.flow = Math.min(100, rider.flow + dt * 6);
    }

    rider.hitCooldown = Math.max(0, rider.hitCooldown - dt);
    updateParticles(dt);
    collectAndCollide();
    spawnAhead(4300);
    updateHud();

    if (rider.flow <= 0) {
      rider.flow = 0;
      world.best = Math.max(world.best, rider.score);
      localStorage.setItem("ridge-rider-best", String(world.best));
      setMode("gameover");
    }
  }

  function damage(amount) {
    if (rider.hitCooldown > 0) return;
    rider.flow = Math.max(0, rider.flow - amount);
    rider.hitCooldown = 0.55;
    rider.speed *= 0.86;
    spawnDust(screenPlayerX() + 46, rider.y - 12, 2);
    playSfx("crash", 0.8);
  }

  function collectAndCollide() {
    const sx = screenPlayerX();
    const scale = riderScale();
    const playerRadius = 34 * scale;
    const playerScreenY = rider.y;

    for (const item of world.pickups) {
      if (item.taken) continue;
      const dx = sx + (item.x - rider.worldX) - sx;
      const itemY = terrainY(item.x) - item.offset;
      const dy = itemY - playerScreenY + 42 * scale;
      if (Math.hypot(dx, dy) < 72 * scale) {
        item.taken = true;
        rider.boost = Math.min(100, rider.boost + 18);
        rider.flow = Math.min(100, rider.flow + 7);
        spawnSpark(screenPlayerX() + dx, itemY, 7);
        playSfx("pickup", 0.8);
      }
    }

    for (const rock of world.hazards) {
      if (rock.hit) continue;
      const dx = rock.x - rider.worldX;
      const rockY = terrainY(rock.x);
      const dy = rockY - playerScreenY;
      if (Math.abs(dx) < 30 * rock.scale + playerRadius && Math.abs(dy) < 44 * rock.scale + playerRadius) {
        rock.hit = true;
        damage(13);
      }
    }
  }

  function spawnDust(x, y, intensity) {
    for (let i = 0; i < 7 * intensity; i += 1) {
      world.particles.push({
        x,
        y,
        vx: -55 - Math.random() * 120,
        vy: -24 - Math.random() * 60,
        r: 4 + Math.random() * 10,
        life: 0.38 + Math.random() * 0.3,
        age: 0,
        color: "dust",
      });
    }
  }

  function spawnSpark(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      world.particles.push({
        x,
        y,
        vx: Math.cos(angle) * (60 + Math.random() * 110),
        vy: Math.sin(angle) * (60 + Math.random() * 90),
        r: 3 + Math.random() * 5,
        life: 0.28 + Math.random() * 0.2,
        age: 0,
        color: i % 2 ? "cyan" : "gold",
      });
    }
  }

  function updateParticles(dt) {
    for (const particle of world.particles) {
      particle.age += dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 110 * dt;
      particle.r *= 0.985;
    }
    world.particles = world.particles.filter((particle) => particle.age < particle.life);
  }

  function updateHud() {
    distanceEl.textContent = `${Math.round(rider.score)} m`;
    flowEl.textContent = `${Math.round(rider.flow)}%`;
    boostFill.style.width = `${Math.round(rider.boost)}%`;
  }

  function screenPlayerX() {
    return world.width * (world.width < 720 ? 0.35 : 0.31);
  }

  function riderScale() {
    return clamp(world.width / 980, 0.72, 1.18);
  }

  function draw() {
    drawBackdrop();
    drawTrail();
    drawFlowGuide();
    drawTrailTiles();
    drawProps();
    drawPickups();
    drawMarkers();
    drawHazards();
    drawRider();
    drawParticles();
    drawForeground();
    if (world.mode === "loading") drawLoading();
  }

  function drawBackdrop() {
    const img = assets.backdrop;
    if (!img) {
      const sky = ctx.createLinearGradient(0, 0, 0, world.height);
      sky.addColorStop(0, "#1d617c");
      sky.addColorStop(0.52, "#d78b45");
      sky.addColorStop(1, "#071013");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, world.width, world.height);
      return;
    }
    const coverScale = Math.max(world.width / img.width, world.height / img.height);
    const drawW = img.width * coverScale;
    const drawH = img.height * coverScale;
    const y = (world.height - drawH) * 0.5;
    const scroll = rider.worldX * 0.018;
    const firstTile = Math.floor(scroll / drawW) - 1;
    ctx.fillStyle = "#071013";
    ctx.fillRect(0, 0, world.width, world.height);
    for (let tile = firstTile; tile * drawW - scroll < world.width; tile += 1) {
      const x = tile * drawW - scroll;
      const mirrored = Math.abs(tile) % 2 === 1;
      if (mirrored) {
        ctx.save();
        ctx.translate(x + drawW, y);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, drawW, drawH);
        ctx.restore();
      } else {
        ctx.drawImage(img, x, y, drawW, drawH);
      }
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, world.height);
    gradient.addColorStop(0, "rgba(7, 16, 19, 0.08)");
    gradient.addColorStop(0.55, "rgba(7, 16, 19, 0.05)");
    gradient.addColorStop(1, "rgba(7, 16, 19, 0.55)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, world.width, world.height);
  }

  function drawTrail() {
    const startWorld = rider.worldX - screenPlayerX() - 160;
    const step = 18;
    ctx.save();
    ctx.beginPath();
    for (let sx = -160; sx <= world.width + 180; sx += step) {
      const wx = startWorld + sx + 160;
      const y = terrainY(wx);
      if (sx === -160) ctx.moveTo(sx, y);
      else ctx.lineTo(sx, y);
    }
    ctx.lineTo(world.width + 180, world.height + 160);
    ctx.lineTo(-160, world.height + 160);
    ctx.closePath();
    const dirt = ctx.createLinearGradient(0, world.height * 0.55, 0, world.height);
    dirt.addColorStop(0, "#8f5a33");
    dirt.addColorStop(0.36, "#51341f");
    dirt.addColorStop(1, "#172022");
    ctx.fillStyle = dirt;
    ctx.fill();

    ctx.beginPath();
    for (let sx = -160; sx <= world.width + 180; sx += step) {
      const wx = startWorld + sx + 160;
      const y = terrainY(wx) - 8;
      if (sx === -160) ctx.moveTo(sx, y);
      else ctx.lineTo(sx, y);
    }
    ctx.lineWidth = 16;
    ctx.strokeStyle = "#d39554";
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    for (let sx = -160; sx <= world.width + 180; sx += step) {
      const wx = startWorld + sx + 160;
      const y = terrainY(wx) - 18;
      if (sx === -160) ctx.moveTo(sx, y);
      else ctx.lineTo(sx, y);
    }
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(248, 225, 108, 0.42)";
    ctx.stroke();
    ctx.restore();
  }

  function drawFlowGuide() {
    const startWorld = rider.worldX - screenPlayerX();
    ctx.save();
    ctx.beginPath();
    for (let sx = screenPlayerX() + 80; sx <= world.width + 260; sx += 34) {
      const wx = startWorld + sx;
      const y = terrainY(wx) - 32 - Math.sin(wx * 0.009) * 6;
      if (sx === screenPlayerX() + 80) ctx.moveTo(sx, y);
      else ctx.lineTo(sx, y);
    }
    ctx.setLineDash([18, 18]);
    ctx.lineDashOffset = -performance.now() * 0.045;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(51, 214, 194, 0.58)";
    ctx.shadowColor = "rgba(51, 214, 194, 0.65)";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.restore();
  }

  function drawTrailTiles() {
    const img = assets.frontTiles;
    if (!img) return;
    const scale = clamp(world.width / 1100, 0.62, 0.94);
    const drawW = 720 * scale;
    const drawH = (img.height / img.width) * drawW;
    const first = Math.floor((rider.worldX - screenPlayerX() - 900) / 610) * 610;
    ctx.save();
    for (let wx = first; wx < rider.worldX + world.width + 1200; wx += 610) {
      const x = screenPlayerX() + (wx - rider.worldX);
      const y = terrainY(wx) + 18;
      const slope = Math.atan(terrainSlope(wx)) * 0.42;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(slope);
      ctx.drawImage(img, -drawW * 0.5, -drawH * 0.48, drawW, drawH);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawProps() {
    const img = assets.props;
    if (!img) return;
    for (const prop of world.props) {
      const frame = propFrames[prop.name];
      if (!frame) continue;
      const x = screenPlayerX() + (prop.x - rider.worldX);
      if (x < -180 || x > world.width + 180) continue;
      const y = terrainY(prop.x);
      const slope = Math.atan(terrainSlope(prop.x)) * 0.28;
      const sizeScale = prop.scale * clamp(world.width / 1080, 0.5, 0.78);
      const drawW = frame.sw * sizeScale;
      const drawH = frame.sh * sizeScale;
      const lift = prop.name === "ribbon" ? 118 : prop.name === "sign" ? 86 : prop.name === "berm" ? 38 : 28;
      ctx.save();
      ctx.translate(x + prop.side * 18, y - lift * sizeScale);
      ctx.rotate(slope);
      ctx.globalAlpha = prop.name === "bale" || prop.name === "berm" ? 0.86 : 0.92;
      ctx.drawImage(img, frame.sx, frame.sy, frame.sw, frame.sh, -drawW * 0.5, -drawH * 0.86, drawW, drawH);
      ctx.restore();
    }
  }

  function drawPickups() {
    const img = assets.energy;
    for (const item of world.pickups) {
      if (item.taken) continue;
      const x = screenPlayerX() + (item.x - rider.worldX);
      if (x < -70 || x > world.width + 70) continue;
      const y = terrainY(item.x) - item.offset + Math.sin(performance.now() * 0.004 + item.wobble) * 7;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(performance.now() * 0.002 + item.wobble);
      if (img) {
        ctx.drawImage(img, -24, -24, 48, 48);
      } else {
        ctx.fillStyle = "#33d6c2";
        ctx.strokeStyle = "#f8e16c";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawHazards() {
    const img = assets.rock;
    for (const rock of world.hazards) {
      if (rock.hit) continue;
      const x = screenPlayerX() + (rock.x - rider.worldX);
      if (x < -110 || x > world.width + 110) continue;
      const y = terrainY(rock.x);
      const size = 70 * rock.scale;
      if (img) {
        ctx.drawImage(img, x - size * 0.5, y - size * 0.72, size, size * 0.72);
      } else {
        ctx.fillStyle = "#536063";
        ctx.beginPath();
        ctx.moveTo(x - size * 0.5, y);
        ctx.lineTo(x - size * 0.2, y - size * 0.55);
        ctx.lineTo(x + size * 0.38, y - size * 0.44);
        ctx.lineTo(x + size * 0.5, y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function drawMarkers() {
    const img = assets.flag;
    for (const marker of world.markers) {
      const x = screenPlayerX() + (marker.x - rider.worldX);
      if (x < -80 || x > world.width + 80) continue;
      const y = terrainY(marker.x);
      if (img) {
        ctx.drawImage(img, x - 18, y - 106, 54, 104);
      } else {
        ctx.fillStyle = "#eef7f5";
        ctx.fillRect(x, y - 92, 6, 92);
        ctx.fillStyle = "#ff6b35";
        ctx.fillRect(x + 6, y - 92, 42, 24);
      }
    }
  }

  function drawRider() {
    const img = assets.rider;
    const scale = riderScale();
    const drawW = 180 * scale;
    const drawH = (img.height / img.width) * drawW;
    const x = screenPlayerX();
    const y = rider.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rider.angle);
    if (rider.hitCooldown > 0 && Math.floor(performance.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }
    ctx.drawImage(img, -drawW * 0.5, -drawH * 0.78, drawW, drawH);
    ctx.restore();

    if (rider.trick > 0) {
      rider.trick *= 0.94;
      ctx.save();
      ctx.globalAlpha = clamp(rider.trick / 100, 0, 1);
      ctx.fillStyle = "#f8e16c";
      ctx.font = "900 22px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`+${Math.round(rider.trick)}`, x, y - drawH - 20);
      ctx.restore();
    }
  }

  function drawParticles() {
    ctx.save();
    for (const particle of world.particles) {
      const t = 1 - particle.age / particle.life;
      ctx.globalAlpha = clamp(t, 0, 1);
      if (particle.color === "cyan") ctx.fillStyle = "#33d6c2";
      else if (particle.color === "gold") ctx.fillStyle = "#f8e16c";
      else ctx.fillStyle = "rgba(218, 165, 96, 0.76)";
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r * t, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawForeground() {
    ctx.save();
    const img = assets.frontTiles;
    if (img) {
      const drawW = clamp(world.width * 0.65, 340, 620);
      const drawH = (img.height / img.width) * drawW;
      let tileX = -(rider.worldX * 0.28) % drawW;
      if (tileX > 0) tileX -= drawW;
      ctx.globalAlpha = 0.42;
      while (tileX < world.width + drawW) {
        ctx.drawImage(img, tileX, world.height - drawH * 0.72, drawW, drawH);
        tileX += drawW * 0.9;
      }
    }

    ctx.globalAlpha = 0.26;
    ctx.fillStyle = "#071013";
    const baseY = world.height * 0.86;
    for (let i = -2; i < 20; i += 1) {
      const x = ((i * 140 - rider.worldX * 0.42) % (world.width + 280)) - 120;
      const h = 28 + rand01(i + Math.floor(rider.worldX / 1200)) * 34;
      ctx.beginPath();
      ctx.moveTo(x, world.height);
      ctx.lineTo(x + 24, baseY - h);
      ctx.lineTo(x + 64, world.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLoading() {
    ctx.fillStyle = "rgba(7, 16, 19, 0.55)";
    ctx.fillRect(0, 0, world.width, world.height);
  }

  function loop(time) {
    const dt = world.lastTime ? (time - world.lastTime) / 1000 : 0;
    world.lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function bindInput() {
    window.addEventListener("keydown", (event) => {
      if (event.code === "KeyP" || event.code === "Escape") {
        if (world.mode === "playing") setMode("paused");
        else if (world.mode === "paused") {
          setMode("playing");
          playBgm();
        }
        return;
      }
      const action = keys.get(event.code);
      if (!action) return;
      event.preventDefault();
      if (action === "jump" && !input.jump) {
        input.jumpPressed = true;
        input.jumpBuffer = 0.16;
      }
      input[action] = true;
    });

    window.addEventListener("keyup", (event) => {
      const action = keys.get(event.code);
      if (!action) return;
      event.preventDefault();
      input[action] = false;
    });

    document.querySelectorAll("[data-action]").forEach((button) => {
      const action = button.dataset.action;
      const down = (event) => {
        event.preventDefault();
        if (action === "jump" && !input.jump) {
          input.jumpPressed = true;
          input.jumpBuffer = 0.16;
        }
        input[action] = true;
        button.setPointerCapture?.(event.pointerId);
      };
      const up = (event) => {
        event.preventDefault();
        input[action] = false;
      };
      button.addEventListener("pointerdown", down);
      button.addEventListener("pointerup", up);
      button.addEventListener("pointercancel", up);
      button.addEventListener("lostpointercapture", () => {
        input[action] = false;
      });
    });

    startButton.addEventListener("click", startRide);
    audioButton.addEventListener("click", () => {
      audio.muted = !audio.muted;
      localStorage.setItem("ridge-rider-muted", audio.muted ? "1" : "0");
      updateAudioButton();
      if (audio.muted) {
        stopBgm();
      } else {
        unlockAudio();
        playSfx("pickup", 0.42);
      }
    });
    pauseButton.addEventListener("click", () => {
      if (world.mode === "playing") setMode("paused");
      else if (world.mode === "paused") {
        setMode("playing");
        playBgm();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopBgm();
      else playBgm();
    });
    window.addEventListener("resize", resize);
  }

  async function init() {
    setMode("loading");
    resize();
    setupAudio();
    bindInput();
    await loadImageSet(criticalManifest);
    resetRide();
    updateHud();
    setMode("menu");
    window.__RIDGE_RIDER_READY__ = true;
    document.documentElement.dataset.ridgeReady = "true";
    document.documentElement.dataset.ridgeReadyMs = String(Math.round(performance.now()));
    if (new URLSearchParams(window.location.search).has("autoplay")) {
      startRide();
    }
    requestAnimationFrame(loop);
    loadImageSet(optionalManifest).catch((error) => console.warn("Optional assets failed", error));
  }

  init().catch((error) => {
    console.error(error);
    menuCopy.textContent = "Asset loading failed.";
    startButton.textContent = "Reload";
    startButton.disabled = false;
    startButton.addEventListener("click", () => window.location.reload(), { once: true });
  });
})();
