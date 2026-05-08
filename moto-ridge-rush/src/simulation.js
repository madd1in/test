(function () {
  const MotoRidge = (window.MotoRidge = window.MotoRidge || {});

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (from, to, t) => from + (to - from) * t;

  function sampleTrack(level, x) {
    const track = level.track;
    if (x <= track[0].x) return { y: track[0].y, angle: 0, type: track[0].type, index: 0 };
    for (let i = 0; i < track.length - 1; i += 1) {
      const a = track[i];
      const b = track[i + 1];
      if (x >= a.x && x <= b.x) {
        const t = (x - a.x) / (b.x - a.x);
        const y = lerp(a.y, b.y, smooth(t));
        const dy = (b.y - a.y) * smoothDerivative(t) / (b.x - a.x);
        return { y, angle: Math.atan(dy), type: a.type || "dirt", index: i };
      }
    }
    const last = track[track.length - 1];
    return { y: last.y, angle: 0, type: last.type, index: track.length - 1 };
  }

  function smooth(t) {
    return t * t * (3 - 2 * t);
  }

  function smoothDerivative(t) {
    return 6 * t * (1 - t);
  }

  function zoneAt(level, x) {
    return level.zones.find((zone) => x >= zone.x && x <= zone.x + zone.w) || null;
  }

  function createState(level) {
    const startGround = sampleTrack(level, level.start.x);
    return {
      level,
      bike: {
        x: level.start.x,
        y: startGround.y - 38,
        vx: 0,
        vy: 0,
        angle: startGround.angle,
        angularVelocity: 0,
        grounded: true,
        heat: 0,
        overheat: 0,
        crashTimer: 0,
        invincible: 0,
        checkpointIndex: 0,
        lastSafeX: level.start.x,
        lastSafeY: startGround.y - 38,
        airborneTime: 0
      },
      camera: { x: 0, y: 0, shake: 0 },
      race: {
        running: false,
        finished: false,
        time: 0,
        best: getBest(level.id),
        bestScore: getBestScore(level.id),
        medal: getMedal(level.id),
        score: 0,
        trickReady: false,
        pickups: new Set(),
        hazardsHit: new Set()
      },
      particles: [],
      events: [],
      randomSeed: 12
    };
  }

  function getBest(id) {
    try {
      const raw = localStorage.getItem(`moto-ridge-best-${id}`);
      return raw ? Number(raw) : null;
    } catch {
      return null;
    }
  }

  function setBest(id, time) {
    try {
      const current = getBest(id);
      if (!current || time < current) localStorage.setItem(`moto-ridge-best-${id}`, String(time));
    } catch {
      // Ignore storage failures; gameplay should not depend on it.
    }
  }

  function getBestScore(id) {
    try {
      const raw = localStorage.getItem(`moto-ridge-score-${id}`);
      return raw ? Number(raw) : 0;
    } catch {
      return 0;
    }
  }

  function setBestScore(id, score) {
    try {
      const current = getBestScore(id);
      if (score > current) localStorage.setItem(`moto-ridge-score-${id}`, String(score));
    } catch {
      // Ignore storage failures.
    }
  }

  function getMedal(id) {
    try {
      return localStorage.getItem(`moto-ridge-medal-${id}`) || "";
    } catch {
      return "";
    }
  }

  function setMedal(id, medal) {
    const order = { "": 0, bronze: 1, silver: 2, gold: 3 };
    try {
      const current = getMedal(id);
      if ((order[medal] || 0) > (order[current] || 0)) {
        localStorage.setItem(`moto-ridge-medal-${id}`, medal);
      }
    } catch {
      // Ignore storage failures.
    }
  }

  function updateState(state, input, dt) {
    const bike = state.bike;
    const level = state.level;
    state.events.length = 0;

    if (state.race.finished) {
      updateParticles(state, dt);
      return;
    }

    if (input.wasPressed("restart")) {
      resetBike(state, true);
    }

    if (!state.race.running) {
      state.race.running = true;
    }

    if (bike.crashTimer > 0) {
      bike.crashTimer -= dt;
      bike.vx *= Math.pow(0.08, dt);
      bike.vy += level.gravity * dt;
      bike.y += bike.vy * dt;
      bike.angle += bike.angularVelocity * dt;
      bike.angularVelocity *= Math.pow(0.35, dt);
      if (bike.crashTimer <= 0) {
        resetBike(state, false);
      }
      updateCamera(state, dt);
      updateParticles(state, dt);
      return;
    }

    state.race.time += dt;
    bike.invincible = Math.max(0, bike.invincible - dt);

    const throttle = input.isDown("throttle") ? 1 : 0;
    const brake = input.isDown("brake") ? 1 : 0;
    const turbo = input.isDown("turbo") && bike.heat < 0.96 && bike.overheat <= 0 ? 1 : 0;
    const lean = (input.isDown("leanForward") ? 1 : 0) - (input.isDown("leanBack") ? 1 : 0);
    const zone = zoneAt(level, bike.x);
    const ground = sampleTrack(level, bike.x);
    const groundY = ground.y - 35;
    bike.throttleActive = throttle > 0;
    bike.brakeActive = brake > 0;
    bike.turboActive = turbo > 0 || (zone && zone.type === "boost");
    bike.zoneType = zone ? zone.type : null;

    if (bike.grounded && input.wasPressed("hop")) {
      bike.vy = -470 - clamp(Math.abs(bike.vx) * 0.08, 0, 95);
      bike.grounded = false;
      bike.airborneTime = 0;
      spawnFx(state, "dust", bike.x - 22, ground.y + 6, 0.75);
    }

    const slopeDrag = Math.sin(ground.angle) * 680;
    const mudDrag = zone && zone.type === "mud" ? 0.54 : 1;
    const boostForce = zone && zone.type === "boost" ? 840 : 0;
    const heatPenalty = bike.overheat > 0 ? 0.35 : 1;
    const accel = (throttle * 760 + turbo * 620 + boostForce) * mudDrag * heatPenalty;
    const brakeForce = brake * 760;

    bike.heat = clamp(bike.heat + (throttle * 0.055 + turbo * 0.19 - 0.075) * dt, 0, 1.08);
    if (bike.heat >= 1) {
      bike.overheat = 1.25;
      bike.heat = 1;
      state.camera.shake = Math.max(state.camera.shake, 4);
      state.events.push({ type: "overheat" });
    }
    bike.overheat = Math.max(0, bike.overheat - dt);
    if (bike.overheat > 0) bike.heat = clamp(bike.heat - 0.18 * dt, 0, 1);

    if (bike.grounded) {
      bike.vx += (accel - brakeForce - slopeDrag) * dt;
      bike.vx *= Math.pow(zone && zone.type === "mud" ? 0.78 : 0.92, dt);
      bike.vx = clamp(bike.vx, -220, turbo ? 980 : 820);
      bike.x += bike.vx * dt;
      const nextGround = sampleTrack(level, bike.x);
      bike.y = nextGround.y - 35;
      const targetAngle = nextGround.angle + lean * 0.18;
      bike.angle = approachAngle(bike.angle, targetAngle, 7.5 * dt);
      bike.angularVelocity = 0;
      bike.lastSafeX = bike.x;
      bike.lastSafeY = bike.y;
      if (Math.abs(nextGround.angle) > 0.36 && bike.vx > 520) {
        bike.vy = -Math.abs(bike.vx) * 0.22;
        bike.grounded = false;
        state.race.trickReady = true;
      }
    } else {
      bike.airborneTime += dt;
      bike.vx += (throttle * 150 + turbo * 180) * dt;
      bike.vx *= Math.pow(0.986, dt);
      bike.vy += level.gravity * dt;
      bike.angularVelocity += lean * 3.5 * dt;
      bike.angularVelocity *= Math.pow(0.65, dt);
      bike.angle += bike.angularVelocity * dt;
      bike.x += bike.vx * dt;
      bike.y += bike.vy * dt;

      const landingGround = sampleTrack(level, bike.x);
      const landingY = landingGround.y - 35;
      if (bike.y >= landingY && bike.vy > 0) {
        const angleDelta = Math.abs(normalizeAngle(bike.angle - landingGround.angle));
        const hardLanding = bike.vy > 1250 || angleDelta > 1.35;
        const airtime = bike.airborneTime;
        bike.y = landingY;
        bike.grounded = true;
        bike.airborneTime = 0;
        bike.angle = approachAngle(bike.angle, landingGround.angle, 0.75);
        bike.vx *= hardLanding ? 0.38 : 0.86;
        bike.vy = 0;
        spawnFx(state, hardLanding ? "spark" : "dust", bike.x - 14, landingGround.y + 3, hardLanding ? 1.1 : 0.85);
        if (hardLanding) crash(state, "landing");
        else if (state.race.trickReady && airtime > 0.42) {
          const points = Math.round(80 + airtime * 190 + Math.abs(bike.vx) * 0.08);
          state.race.score += points;
          state.events.push({ type: "stunt", points });
        }
        state.race.trickReady = false;
      }
    }

    bike.x = clamp(bike.x, 80, level.length + 80);
    if (bike.y > 820) crash(state, "fall");

    checkHazards(state);
    checkPickups(state);
    checkCheckpoints(state);
    checkFinish(state);
    emitRollingFx(state, throttle || turbo, zone);
    updateCamera(state, dt);
    updateParticles(state, dt);
  }

  function approachAngle(current, target, amount) {
    return current + normalizeAngle(target - current) * clamp(amount, 0, 1);
  }

  function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  function crash(state, reason) {
    const bike = state.bike;
    if (bike.invincible > 0 || bike.crashTimer > 0) return;
    bike.crashTimer = 1.15;
    bike.invincible = 2;
    bike.vy = -320;
    bike.angularVelocity = reason === "landing" ? -3.8 : 4.2;
    bike.vx *= 0.22;
    state.camera.shake = Math.max(state.camera.shake, 13);
    state.events.push({ type: "crash", reason });
    spawnFx(state, "spark", bike.x, bike.y - 8, 1.25);
  }

  function resetBike(state, hard) {
    const bike = state.bike;
    const x = hard ? state.level.start.x : Math.max(state.level.start.x, bike.lastSafeX - 120);
    const ground = sampleTrack(state.level, x);
    bike.x = x;
    bike.y = ground.y - 35;
    bike.vx = hard ? 0 : 130;
    bike.vy = 0;
    bike.angle = ground.angle;
    bike.angularVelocity = 0;
    bike.grounded = true;
    bike.crashTimer = 0;
    bike.invincible = 1.4;
    bike.heat = hard ? 0 : clamp(bike.heat - 0.35, 0, 1);
    if (hard) {
      state.race.time = 0;
      state.race.finished = false;
      state.race.pickups.clear();
      state.race.hazardsHit.clear();
    }
    spawnFx(state, "dust", bike.x - 20, ground.y + 5, 1);
  }

  function checkHazards(state) {
    const bike = state.bike;
    for (const hazard of state.level.hazards) {
      if (state.race.hazardsHit.has(hazard.x)) continue;
      if (Math.abs(bike.x - hazard.x) < 34 && bike.grounded && bike.invincible <= 0) {
        state.race.hazardsHit.add(hazard.x);
        crash(state, hazard.kind);
      }
    }
  }

  function checkPickups(state) {
    const bike = state.bike;
    for (const pickup of state.level.pickups) {
      const key = `${pickup.kind}-${pickup.x}`;
      if (state.race.pickups.has(key)) continue;
      const ground = sampleTrack(state.level, pickup.x);
      const dx = Math.abs(bike.x - pickup.x);
      const dy = Math.abs(bike.y - (ground.y - 78));
      if (dx < 42 && dy < 46) {
        state.race.pickups.add(key);
        if (pickup.kind === "clock") state.race.time = Math.max(0, state.race.time - 3.5);
        if (pickup.kind === "wrench") bike.invincible = Math.max(bike.invincible, 2.2);
        if (pickup.kind === "heat_pickup") bike.heat = clamp(bike.heat - 0.42, 0, 1);
        state.race.score += pickup.kind === "clock" ? 350 : 250;
        state.events.push({ type: "pickup", kind: pickup.kind });
        spawnFx(state, "confetti", pickup.x, ground.y - 85, 0.9);
      }
    }
  }

  function checkCheckpoints(state) {
    const bike = state.bike;
    const checkpoints = state.level.checkpoints;
    while (bike.checkpointIndex < checkpoints.length && bike.x >= checkpoints[bike.checkpointIndex]) {
      bike.checkpointIndex += 1;
      state.events.push({ type: "checkpoint", index: bike.checkpointIndex });
      state.camera.shake = Math.max(state.camera.shake, 5);
    }
  }

  function checkFinish(state) {
    const bike = state.bike;
    if (bike.x >= state.level.length && !state.race.finished) {
      state.race.finished = true;
      state.race.running = false;
      setBest(state.level.id, state.race.time);
      setBestScore(state.level.id, state.race.score);
      const medal = calculateMedal(state.level, state.race.time);
      state.race.finishMedal = medal;
      setMedal(state.level.id, medal);
      state.race.best = getBest(state.level.id);
      state.race.bestScore = getBestScore(state.level.id);
      state.race.medal = getMedal(state.level.id);
      spawnFx(state, "confetti", bike.x + 40, bike.y - 70, 1.5);
      state.events.push({ type: "finish", time: state.race.time });
    }
  }

  function calculateMedal(level, time) {
    if (!level.medals) return "bronze";
    if (time <= level.medals.gold) return "gold";
    if (time <= level.medals.silver) return "silver";
    return "bronze";
  }

  function emitRollingFx(state, active, zone) {
    const bike = state.bike;
    if (!bike.grounded || !active || Math.abs(bike.vx) < 80) return;
    state.randomSeed = (state.randomSeed * 1664525 + 1013904223) >>> 0;
    if (state.randomSeed % 5 !== 0) return;
    const ground = sampleTrack(state.level, bike.x - 22);
    const boost = zone && zone.type === "boost";
    spawnFx(state, boost ? "turbo" : "dust", bike.x - 34, ground.y + 4, boost ? 0.7 : 0.45);
    if (boost && state.randomSeed % 23 === 0) state.events.push({ type: "boost" });
  }

  function spawnFx(state, kind, x, y, scale) {
    state.particles.push({
      kind,
      x,
      y,
      age: 0,
      life: kind === "confetti" ? 1.2 : kind === "spark" ? 0.55 : 0.72,
      scale,
      drift: kind === "dust" ? -60 : 0
    });
  }

  function updateParticles(state, dt) {
    for (const particle of state.particles) {
      particle.age += dt;
      particle.x += (particle.drift || 0) * dt;
      if (particle.kind === "confetti") particle.y += 30 * dt;
    }
    state.particles = state.particles.filter((particle) => particle.age < particle.life);
  }

  function updateCamera(state, dt) {
    const bike = state.bike;
    state.camera.x = lerp(state.camera.x, clamp(bike.x - 430, 0, state.level.length - 960), 1 - Math.pow(0.0001, dt));
    state.camera.y = lerp(state.camera.y, clamp(bike.y - 390, -90, 100), 1 - Math.pow(0.002, dt));
    state.camera.shake = Math.max(0, state.camera.shake - 38 * dt);
  }

  MotoRidge.Simulation = {
    createState,
    updateState,
    sampleTrack,
    zoneAt,
    resetBike,
    clamp
  };
})();
