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

  const manifest = {
    backdrop: "./assets/generated/trail-backdrop-imagen.png",
    rider: "./assets/sprites/rider-imagen.png",
    energy: "./assets/ui/energy-ring.svg",
    rock: "./assets/ui/rock.svg",
    flag: "./assets/ui/trail-flag.svg",
  };

  const assets = {};
  const input = {
    jump: false,
    jumpPressed: false,
    leanBack: false,
    leanForward: false,
    boost: false,
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
    nextSpawn: 600,
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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
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
    world.pickups = [];
    world.hazards = [];
    world.markers = [];
    world.nextSpawn = 560;
    Object.assign(rider, {
      worldX: 0,
      y: terrainY(0),
      vy: 0,
      speed: 370,
      angle: Math.atan(terrainSlope(0)),
      spin: 0,
      airborne: false,
      airAngle: 0,
      flow: 100,
      boost: 72,
      score: 0,
      trick: 0,
      hitCooldown: 0,
    });
    spawnAhead(3600);
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
      menuCopy.textContent = "Hold the line, land clean, keep your flow.";
      startButton.textContent = "Start Ride";
      startButton.disabled = false;
    } else if (mode === "paused") {
      menuCopy.textContent = `Best ${Math.round(world.best)} m`;
      startButton.textContent = "Resume";
      startButton.disabled = false;
    } else if (mode === "gameover") {
      menuCopy.textContent = `Run ${Math.round(rider.score)} m | Best ${Math.round(world.best)} m`;
      startButton.textContent = "Restart";
      startButton.disabled = false;
    }
  }

  function startRide() {
    if (world.mode === "paused") {
      setMode("playing");
      return;
    }
    resetRide();
    setMode("playing");
  }

  function spawnAhead(range) {
    const limit = rider.worldX + range;
    while (world.nextSpawn < limit) {
      const lane = Math.floor(world.nextSpawn / 300);
      const roll = rand01(lane);
      if (roll > 0.68) {
        world.hazards.push({
          x: world.nextSpawn + rand01(lane + 8) * 130,
          hit: false,
          scale: 0.82 + rand01(lane + 15) * 0.42,
        });
      } else {
        const count = roll > 0.28 ? 3 : 2;
        for (let i = 0; i < count; i += 1) {
          world.pickups.push({
            x: world.nextSpawn + i * 74,
            offset: 84 + Math.sin(lane + i) * 34,
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

    const keepAfter = rider.worldX - 600;
    world.pickups = world.pickups.filter((item) => item.x > keepAfter && !item.taken);
    world.hazards = world.hazards.filter((item) => item.x > keepAfter);
    world.markers = world.markers.filter((item) => item.x > keepAfter);
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
    const boosting = input.boost && rider.boost > 2;
    const targetSpeed = 370 + (boosting ? 190 : 0) - slope * 105;
    rider.speed = lerp(rider.speed, targetSpeed, dt * 2.1);
    rider.speed = clamp(rider.speed, 240, 680);
    rider.worldX += rider.speed * dt;
    rider.score = Math.max(rider.score, rider.worldX / 10);

    if (boosting) {
      rider.boost = Math.max(0, rider.boost - dt * 31);
    } else {
      rider.boost = Math.min(100, rider.boost + dt * (rider.airborne ? 8 : 17));
    }

    const lean = (input.leanForward ? 1 : 0) - (input.leanBack ? 1 : 0);
    if (input.jumpPressed && !rider.airborne) {
      rider.airborne = true;
      rider.vy = -720 - clamp(rider.speed - 360, 0, 220) * 0.32;
      rider.spin = lean * 2.3 - slope * 0.7;
      rider.airAngle = 0;
    }
    input.jumpPressed = false;

    if (rider.airborne) {
      rider.vy += 1650 * dt;
      rider.y += rider.vy * dt;
      rider.spin += lean * dt * 5.0;
      rider.spin *= 0.992;
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
        if (landingError > 0.92) {
          damage(22 + landingError * 18);
          rider.spin = 0;
          rider.angle = slopeAngle;
        } else {
          if (rotations > 0.72) {
            rider.trick = Math.round(rotations * 100);
            rider.boost = Math.min(100, rider.boost + 18 + rotations * 12);
            rider.flow = Math.min(100, rider.flow + rotations * 9);
          }
          rider.angle = lerp(rider.angle, slopeAngle, 0.54);
        }
      }
    } else {
      rider.y = terrainY(rider.worldX);
      rider.angle = lerp(rider.angle, slopeAngle + lean * 0.12, dt * 8);
      rider.flow = Math.min(100, rider.flow + dt * 3);
    }

    rider.hitCooldown = Math.max(0, rider.hitCooldown - dt);
    collectAndCollide();
    spawnAhead(3800);
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
    rider.hitCooldown = 0.75;
    rider.speed *= 0.76;
  }

  function collectAndCollide() {
    const sx = screenPlayerX();
    const scale = riderScale();
    const playerRadius = 40 * scale;
    const playerScreenY = rider.y;

    for (const item of world.pickups) {
      if (item.taken) continue;
      const dx = sx + (item.x - rider.worldX) - sx;
      const itemY = terrainY(item.x) - item.offset;
      const dy = itemY - playerScreenY + 42 * scale;
      if (Math.hypot(dx, dy) < 56 * scale) {
        item.taken = true;
        rider.boost = Math.min(100, rider.boost + 14);
        rider.flow = Math.min(100, rider.flow + 4);
      }
    }

    for (const rock of world.hazards) {
      if (rock.hit) continue;
      const dx = rock.x - rider.worldX;
      const rockY = terrainY(rock.x);
      const dy = rockY - playerScreenY;
      if (Math.abs(dx) < 48 * rock.scale + playerRadius && Math.abs(dy) < 64 * rock.scale + playerRadius) {
        rock.hit = true;
        damage(24);
      }
    }
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
    drawPickups();
    drawMarkers();
    drawHazards();
    drawRider();
    drawForeground();
    if (world.mode === "loading") drawLoading();
  }

  function drawBackdrop() {
    const img = assets.backdrop;
    const coverScale = Math.max(world.width / img.width, world.height / img.height);
    const drawW = img.width * coverScale;
    const drawH = img.height * coverScale;
    const y = (world.height - drawH) * 0.5;
    let x = -(rider.worldX * 0.035) % drawW;
    if (x > 0) x -= drawW;
    ctx.fillStyle = "#071013";
    ctx.fillRect(0, 0, world.width, world.height);
    while (x < world.width) {
      ctx.drawImage(img, x, y, drawW, drawH);
      x += drawW;
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
      ctx.drawImage(img, -24, -24, 48, 48);
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
      ctx.drawImage(img, x - size * 0.5, y - size * 0.72, size, size * 0.72);
    }
  }

  function drawMarkers() {
    const img = assets.flag;
    for (const marker of world.markers) {
      const x = screenPlayerX() + (marker.x - rider.worldX);
      if (x < -80 || x > world.width + 80) continue;
      const y = terrainY(marker.x);
      ctx.drawImage(img, x - 18, y - 106, 54, 104);
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

  function drawForeground() {
    ctx.save();
    ctx.globalAlpha = 0.32;
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
        else if (world.mode === "paused") setMode("playing");
        return;
      }
      const action = keys.get(event.code);
      if (!action) return;
      event.preventDefault();
      if (action === "jump" && !input.jump) input.jumpPressed = true;
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
        if (action === "jump" && !input.jump) input.jumpPressed = true;
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
    pauseButton.addEventListener("click", () => {
      if (world.mode === "playing") setMode("paused");
      else if (world.mode === "paused") setMode("playing");
    });
    window.addEventListener("resize", resize);
  }

  async function init() {
    setMode("loading");
    resize();
    bindInput();
    const entries = await Promise.all(Object.entries(manifest).map(async ([key, src]) => [key, await loadImage(src)]));
    for (const [key, image] of entries) assets[key] = image;
    resetRide();
    updateHud();
    setMode("menu");
    window.__RIDGE_RIDER_READY__ = true;
    if (new URLSearchParams(window.location.search).has("autoplay")) {
      startRide();
    }
    requestAnimationFrame(loop);
  }

  init().catch((error) => {
    console.error(error);
    menuCopy.textContent = "Asset loading failed.";
    startButton.textContent = "Reload";
    startButton.disabled = false;
    startButton.addEventListener("click", () => window.location.reload(), { once: true });
  });
})();
