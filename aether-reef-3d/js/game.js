import * as THREE from "../assets/vendor/three.module.js";

const WORLD = {
  minX: -48,
  maxX: 48,
  minZ: -62,
  maxZ: 46,
};

const CORE_LAYOUT = [
  { x: -22, z: 34, y: 4.2 },
  { x: 3, z: 31, y: 4.8 },
  { x: 27, z: 32, y: 4.1 },
  { x: -36, z: 18, y: 4.6 },
  { x: -12, z: 14, y: 5.2 },
  { x: 19, z: 11, y: 4.4 },
  { x: 38, z: 4, y: 4.9 },
  { x: -29, z: -3, y: 4.3 },
  { x: -3, z: -1, y: 5.1 },
  { x: 21, z: -8, y: 4.6 },
  { x: -40, z: -22, y: 4.7 },
  { x: -16, z: -26, y: 4.2 },
  { x: 9, z: -23, y: 5.0 },
  { x: 34, z: -29, y: 4.2 },
  { x: -27, z: -43, y: 4.9 },
  { x: -2, z: -40, y: 4.4 },
  { x: 25, z: -46, y: 5.2 },
  { x: 7, z: -56, y: 4.8 },
];

const GATE_LAYOUT = [
  { x: 0, z: 23, radius: 4.2 },
  { x: -33, z: 5, radius: 4.0 },
  { x: 31, z: -14, radius: 4.1 },
  { x: -11, z: -35, radius: 4.2 },
  { x: 20, z: -52, radius: 4.0 },
];

const HAZARD_LAYOUT = [
  { x: -8, z: 25, r: 2.2 },
  { x: 18, z: 24, r: 2.1 },
  { x: -26, z: 9, r: 2.4 },
  { x: 33, z: 17, r: 2.2 },
  { x: 7, z: 6, r: 2.1 },
  { x: -37, z: -8, r: 2.4 },
  { x: 13, z: -15, r: 2.2 },
  { x: -25, z: -31, r: 2.3 },
  { x: 28, z: -37, r: 2.2 },
  { x: 0, z: -49, r: 2.5 },
];

const DRONE_LAYOUT = [
  { cx: -22, cz: 21, rx: 8, rz: 5, speed: 0.82, phase: 0.4 },
  { cx: 27, cz: 7, rx: 7, rz: 9, speed: 0.72, phase: 1.9 },
  { cx: -29, cz: -18, rx: 9, rz: 7, speed: 0.9, phase: 2.7 },
  { cx: 20, cz: -28, rx: 8, rz: 8, speed: 0.76, phase: 3.3 },
  { cx: 2, cz: -44, rx: 12, rz: 5, speed: 0.68, phase: 5.1 },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const dist2 = (a, b) => {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
};
const formatScore = (value) => Math.max(0, Math.round(value)).toLocaleString("de-DE");

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Simulation {
  constructor() {
    this.best = readBestScore();
    this.setMenu();
  }

  setMenu() {
    this.resetRun();
    this.phase = "menu";
  }

  resetRun() {
    this.phase = "ready";
    this.elapsed = 0;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.stability = 100;
    this.coresCollected = 0;
    this.events = [];
    this.finish = { x: 0, z: -59, radius: 5.2, active: false };
    this.player = {
      x: 0,
      y: 2.7,
      z: 41,
      vx: 0,
      vz: 0,
      yaw: Math.PI,
      speed: 0,
      hull: 100,
      boost: 88,
      bank: 0,
      damageCooldown: 0,
      wallCooldown: 0,
    };
    this.cores = CORE_LAYOUT.map((core, index) => ({ ...core, index, collected: false }));
    this.gates = GATE_LAYOUT.map((gate, index) => ({ ...gate, index, cooldown: 0, flash: 0 }));
    this.hazards = HAZARD_LAYOUT.map((hazard, index) => ({ ...hazard, index, near: 0, spin: index * 0.7 }));
    this.drones = DRONE_LAYOUT.map((drone, index) => ({
      ...drone,
      index,
      x: drone.cx,
      y: 4.5,
      z: drone.cz,
      alert: 0,
      near: 0,
    }));
  }

  begin() {
    this.phase = "playing";
    this.emit("toast", "Aether-Kerne online");
  }

  pause() {
    if (this.phase === "playing") {
      this.phase = "paused";
    }
  }

  resume() {
    if (this.phase === "paused") {
      this.phase = "playing";
    }
  }

  update(dt, actions) {
    if (this.phase !== "playing") {
      return;
    }

    dt = Math.min(dt, 0.04);
    this.elapsed += dt;
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer === 0) {
      this.combo = lerp(this.combo, 1, 1 - Math.exp(-dt * 1.2));
    }

    this.updatePlayer(dt, actions);
    this.updateDrones(dt);
    this.resolveCollectibles();
    this.resolveHazards(dt);
    this.resolveBeacon();

    this.stability = clamp(this.stability - dt * (0.95 + this.coresCollected * 0.018), 0, 100);
    if (this.stability <= 0 && this.player.damageCooldown <= 0) {
      this.triggerDamage(8, "Riffspannung");
    }
  }

  updatePlayer(dt, actions) {
    const p = this.player;
    p.damageCooldown = Math.max(0, p.damageCooldown - dt);
    p.wallCooldown = Math.max(0, p.wallCooldown - dt);

    const steer = actions.right - actions.left;
    const throttle = actions.up - actions.down * 0.52;
    const boostActive = actions.boost && p.boost > 2 && throttle > 0.05;
    const speedFactor = clamp(p.speed / 38, 0, 1);

    p.yaw += steer * (2.35 + speedFactor * 0.9) * dt;

    const forwardX = Math.sin(p.yaw);
    const forwardZ = Math.cos(p.yaw);
    const acceleration = throttle * 31 + (boostActive ? 52 : 0);

    p.vx += forwardX * acceleration * dt;
    p.vz += forwardZ * acceleration * dt;

    const drag = Math.pow(boostActive ? 0.966 : 0.952, dt * 60);
    p.vx *= drag;
    p.vz *= drag;

    const speed = Math.hypot(p.vx, p.vz);
    const maxSpeed = boostActive ? 43 : 29;
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      p.vx *= scale;
      p.vz *= scale;
    }

    p.x += p.vx * dt;
    p.z += p.vz * dt;
    p.speed = Math.hypot(p.vx, p.vz);
    p.y = 2.65 + Math.sin(this.elapsed * 3.2) * 0.15 + clamp(p.speed / 34, 0, 1) * 0.48;
    p.bank = lerp(p.bank, clamp(-steer * 0.58 - p.vx * 0.006, -0.72, 0.72), 1 - Math.exp(-dt * 6));

    if (boostActive) {
      p.boost = clamp(p.boost - dt * 32, 0, 100);
      this.score += dt * 5;
    } else {
      p.boost = clamp(p.boost + dt * (8 + (throttle <= 0 ? 4 : 0)), 0, 100);
    }

    this.resolveBounds();
  }

  resolveBounds() {
    const p = this.player;
    let bounced = false;
    if (p.x < WORLD.minX) {
      p.x = WORLD.minX;
      p.vx = Math.abs(p.vx) * 0.42;
      bounced = true;
    } else if (p.x > WORLD.maxX) {
      p.x = WORLD.maxX;
      p.vx = -Math.abs(p.vx) * 0.42;
      bounced = true;
    }
    if (p.z < WORLD.minZ) {
      p.z = WORLD.minZ;
      p.vz = Math.abs(p.vz) * 0.42;
      bounced = true;
    } else if (p.z > WORLD.maxZ) {
      p.z = WORLD.maxZ;
      p.vz = -Math.abs(p.vz) * 0.42;
      bounced = true;
    }

    if (bounced && p.wallCooldown <= 0 && p.speed > 12) {
      p.wallCooldown = 0.8;
      this.triggerDamage(7, "Riffkante");
    }
  }

  updateDrones(dt) {
    const p = this.player;
    for (const drone of this.drones) {
      drone.phase += drone.speed * dt;
      const orbitX = drone.cx + Math.cos(drone.phase) * drone.rx;
      const orbitZ = drone.cz + Math.sin(drone.phase * 1.17) * drone.rz;
      const chaseDistance = Math.hypot(p.x - orbitX, p.z - orbitZ);
      const chase = clamp((15 - chaseDistance) / 15, 0, 1);
      drone.alert = lerp(drone.alert, chase, 1 - Math.exp(-dt * 3));
      drone.x = lerp(orbitX, p.x - Math.sin(p.yaw) * 4, drone.alert * 0.28);
      drone.z = lerp(orbitZ, p.z - Math.cos(p.yaw) * 4, drone.alert * 0.28);
      drone.y = 4.3 + Math.sin(this.elapsed * 2.6 + drone.index) * 0.45;
    }
  }

  resolveCollectibles() {
    const p = this.player;
    for (const core of this.cores) {
      if (!core.collected && dist2(p, core) < 7.1) {
        this.collectCore(core);
      }
    }

    for (const gate of this.gates) {
      gate.cooldown = Math.max(0, gate.cooldown - 1 / 60);
      gate.flash = Math.max(0, gate.flash - 1 / 45);
      if (dist2(p, gate) < gate.radius * gate.radius && gate.cooldown <= 0) {
        gate.cooldown = 2.4;
        gate.flash = 1;
        p.boost = 100;
        this.stability = clamp(this.stability + 5, 0, 100);
        this.score += 75 * this.combo;
        this.emit("gate", gate.index);
      }
    }
  }

  collectCore(core) {
    core.collected = true;
    this.coresCollected += 1;
    this.combo = clamp(this.combo + 0.34, 1, 5);
    this.comboTimer = 6;
    this.score += 180 * this.combo + this.player.speed * 4;
    this.player.boost = clamp(this.player.boost + 18, 0, 100);
    this.stability = clamp(this.stability + 9, 0, 100);
    this.emit("core", core.index);

    if (this.coresCollected === this.cores.length) {
      this.finish.active = true;
      this.score += 600;
      this.emit("beacon", "Beacon wach");
    }
  }

  resolveHazards(dt) {
    const p = this.player;
    for (const hazard of this.hazards) {
      hazard.spin += dt;
      hazard.near = Math.max(0, hazard.near - dt);
      const distanceSq = dist2(p, hazard);
      if (distanceSq < (hazard.r + 1.35) * (hazard.r + 1.35)) {
        this.knockAwayFrom(hazard, 10);
        this.triggerDamage(16, "Sturm-Mine");
      } else if (distanceSq < (hazard.r + 4.2) * (hazard.r + 4.2) && hazard.near <= 0) {
        hazard.near = 2.2;
        this.score += 30 * this.combo;
        this.player.boost = clamp(this.player.boost + 3, 0, 100);
        this.emit("skim", "Riskanter Schnitt");
      }
    }

    for (const drone of this.drones) {
      drone.near = Math.max(0, drone.near - dt);
      const dronePoint = { x: drone.x, z: drone.z };
      const distanceSq = dist2(p, dronePoint);
      if (distanceSq < 9.2) {
        this.knockAwayFrom(dronePoint, 12);
        this.triggerDamage(18, "Sentinel");
      } else if (distanceSq < 38 && drone.near <= 0) {
        drone.near = 1.8;
        this.score += 45 * this.combo;
        this.emit("skim", "Sentinel gekappt");
      }
    }
  }

  knockAwayFrom(source, impulse) {
    const p = this.player;
    const dx = p.x - source.x;
    const dz = p.z - source.z;
    const length = Math.max(0.001, Math.hypot(dx, dz));
    p.vx += (dx / length) * impulse;
    p.vz += (dz / length) * impulse;
  }

  triggerDamage(amount, source) {
    const p = this.player;
    if (p.damageCooldown > 0) {
      return;
    }
    p.damageCooldown = 0.82;
    p.hull = clamp(p.hull - amount, 0, 100);
    this.combo = 1;
    this.comboTimer = 0;
    this.emit("damage", source);
    if (p.hull <= 0) {
      this.finishRun(false);
    }
  }

  resolveBeacon() {
    if (this.finish.active && dist2(this.player, this.finish) < this.finish.radius * this.finish.radius) {
      this.finishRun(true);
    }
  }

  finishRun(won) {
    if (this.phase === "won" || this.phase === "lost") {
      return;
    }
    if (won) {
      const timeBonus = Math.max(0, 1500 - this.elapsed * 18);
      const hullBonus = this.player.hull * 12;
      this.score += timeBonus + hullBonus + this.stability * 6;
      this.phase = "won";
      if (this.score > this.best) {
        this.best = Math.round(this.score);
        writeBestScore(this.best);
      }
    } else {
      this.phase = "lost";
    }
    this.emit("result", { won, score: this.score, cores: this.coresCollected, elapsed: this.elapsed });
  }

  emit(type, detail) {
    this.events.push({ type, detail });
  }

  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }
}

class InputController {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.keys = new Set();
    this.touch = new Set();
    this.bindKeyboard();
    this.bindTouch();
  }

  bindKeyboard() {
    window.addEventListener("keydown", (event) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat && (event.code === "Escape" || event.code === "KeyP")) {
        this.callbacks.togglePause();
      }
      if (!event.repeat && event.code === "KeyR") {
        this.callbacks.restart();
      }
      if (!event.repeat && event.code === "Enter") {
        this.callbacks.enter();
      }
      this.keys.add(event.code);
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });

    window.addEventListener("blur", () => {
      this.keys.clear();
      this.touch.clear();
    });
  }

  bindTouch() {
    for (const button of document.querySelectorAll("[data-touch]")) {
      const action = button.dataset.touch;
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.touch.add(action);
      });
      button.addEventListener("pointerup", (event) => {
        event.preventDefault();
        this.touch.delete(action);
      });
      button.addEventListener("pointercancel", () => this.touch.delete(action));
      button.addEventListener("lostpointercapture", () => this.touch.delete(action));
    }
  }

  get actions() {
    const left = this.keys.has("ArrowLeft") || this.keys.has("KeyA") || this.touch.has("left");
    const right = this.keys.has("ArrowRight") || this.keys.has("KeyD") || this.touch.has("right");
    const up = this.keys.has("ArrowUp") || this.keys.has("KeyW") || this.touch.has("up");
    const down = this.keys.has("ArrowDown") || this.keys.has("KeyS") || this.touch.has("down");
    const boost = this.keys.has("Space") || this.keys.has("ShiftLeft") || this.touch.has("boost");
    return {
      left: left ? 1 : 0,
      right: right ? 1 : 0,
      up: up ? 1 : 0,
      down: down ? 1 : 0,
      boost,
    };
  }
}

class GameUI {
  constructor(simulation, audio) {
    this.simulation = simulation;
    this.audio = audio;
    this.toastTimer = 0;
    this.elements = {
      menu: document.getElementById("menuOverlay"),
      pause: document.getElementById("pauseOverlay"),
      result: document.getElementById("resultOverlay"),
      objective: document.getElementById("objectiveText"),
      zone: document.getElementById("zoneText"),
      coreFill: document.getElementById("coreFill"),
      hullFill: document.getElementById("hullFill"),
      boostFill: document.getElementById("boostFill"),
      stabilityFill: document.getElementById("stabilityFill"),
      coreText: document.getElementById("coreText"),
      scoreText: document.getElementById("scoreText"),
      bestText: document.getElementById("bestText"),
      resultKicker: document.getElementById("resultKicker"),
      resultTitle: document.getElementById("resultTitle"),
      resultStats: document.getElementById("resultStats"),
      toast: document.getElementById("toast"),
      damageFlash: document.getElementById("damageFlash"),
      audioButton: document.getElementById("audioButton"),
      menuSoundButton: document.getElementById("menuSoundButton"),
    };
    this.updateAudioState();
    this.updateBest();
  }

  showGame() {
    this.elements.menu.classList.add("hidden");
    this.elements.menu.classList.remove("active");
    this.elements.pause.classList.add("hidden");
    this.elements.result.classList.add("hidden");
  }

  showMenu() {
    this.elements.menu.classList.remove("hidden");
    this.elements.menu.classList.add("active");
    this.elements.pause.classList.add("hidden");
    this.elements.result.classList.add("hidden");
    this.updateBest();
  }

  showPause() {
    this.elements.pause.classList.remove("hidden");
  }

  hidePause() {
    this.elements.pause.classList.add("hidden");
  }

  update() {
    const sim = this.simulation;
    const p = sim.player;
    const coreRatio = sim.coresCollected / sim.cores.length;
    this.elements.coreFill.style.width = `${coreRatio * 100}%`;
    this.elements.hullFill.style.width = `${p.hull}%`;
    this.elements.boostFill.style.width = `${p.boost}%`;
    this.elements.stabilityFill.style.width = `${sim.stability}%`;
    this.elements.coreText.textContent = `${sim.coresCollected}/${sim.cores.length}`;
    this.elements.scoreText.textContent = formatScore(sim.score);
    this.elements.zone.textContent = sim.finish.active ? "Beacon offen" : "Aether Reef";
    this.elements.objective.textContent = sim.finish.active
      ? "Beacon erreichen"
      : `Kerne ${sim.coresCollected}/${sim.cores.length}`;
    document.documentElement.dataset.gamePhase = sim.phase;
    document.documentElement.dataset.playerX = p.x.toFixed(2);
    document.documentElement.dataset.playerZ = p.z.toFixed(2);
    document.documentElement.dataset.playerSpeed = p.speed.toFixed(2);
    document.documentElement.dataset.cores = String(sim.coresCollected);
    document.documentElement.dataset.score = String(Math.round(sim.score));

    if (this.toastTimer > 0) {
      this.toastTimer -= 1 / 60;
      if (this.toastTimer <= 0) {
        this.elements.toast.classList.add("hidden");
      }
    }
  }

  handleEvent(event) {
    if (event.type === "core") {
      this.showToast("Kern gesichert");
    } else if (event.type === "gate") {
      this.showToast("Boost geladen");
    } else if (event.type === "beacon") {
      this.showToast(event.detail);
    } else if (event.type === "damage") {
      this.flashDamage();
      this.showToast(event.detail);
    } else if (event.type === "skim") {
      this.showToast(event.detail);
    } else if (event.type === "toast") {
      this.showToast(event.detail);
    } else if (event.type === "result") {
      this.showResult(event.detail);
    }
  }

  showToast(text) {
    this.elements.toast.textContent = text;
    this.elements.toast.classList.remove("hidden");
    this.toastTimer = 1.45;
  }

  flashDamage() {
    const flash = this.elements.damageFlash;
    flash.classList.add("active");
    window.setTimeout(() => flash.classList.remove("active"), 120);
  }

  showResult(result) {
    this.elements.result.classList.remove("hidden");
    this.elements.pause.classList.add("hidden");
    this.elements.resultKicker.textContent = result.won ? "Beacon wach" : "Skiff verloren";
    this.elements.resultTitle.textContent = result.won ? "Riff stabil" : "Run gebrochen";
    this.elements.resultStats.textContent = `Score ${formatScore(result.score)} | Kerne ${result.cores}/${this.simulation.cores.length}`;
    this.updateBest();
  }

  updateBest() {
    this.elements.bestText.textContent = `Best: ${formatScore(this.simulation.best)}`;
  }

  updateAudioState() {
    const muted = !this.audio.enabled;
    this.elements.audioButton.classList.toggle("muted", muted);
    this.elements.menuSoundButton.textContent = this.audio.enabled ? "Sound an" : "Sound aus";
  }
}

class AudioSystem {
  constructor() {
    this.enabled = readBoolean("aether-reef-sound", false);
    this.context = null;
    this.master = null;
  }

  async setEnabled(enabled) {
    this.enabled = enabled;
    writeBoolean("aether-reef-sound", enabled);
    if (enabled) {
      await this.ensureContext();
      this.play("gate");
    }
  }

  async toggle() {
    await this.setEnabled(!this.enabled);
  }

  async ensureContext() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.12;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  async play(kind) {
    if (!this.enabled) {
      return;
    }
    await this.ensureContext();
    const now = this.context.currentTime;
    if (kind === "core") {
      this.tone(660, 0.08, "triangle", 0.5, now);
      this.tone(990, 0.12, "sine", 0.34, now + 0.04);
    } else if (kind === "damage") {
      this.tone(120, 0.18, "sawtooth", 0.45, now);
      this.tone(84, 0.22, "square", 0.28, now + 0.03);
    } else if (kind === "win") {
      this.tone(440, 0.12, "triangle", 0.4, now);
      this.tone(660, 0.12, "triangle", 0.4, now + 0.12);
      this.tone(880, 0.18, "triangle", 0.4, now + 0.24);
    } else {
      this.tone(360, 0.08, "sine", 0.35, now);
      this.tone(540, 0.1, "triangle", 0.22, now + 0.03);
    }
  }

  tone(frequency, duration, type, volume, start) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  handleEvent(event) {
    if (event.type === "core") {
      this.play("core");
    } else if (event.type === "gate" || event.type === "beacon") {
      this.play("gate");
    } else if (event.type === "damage") {
      this.play("damage");
    } else if (event.type === "result") {
      this.play(event.detail.won ? "win" : "damage");
    }
  }
}

class GameView {
  constructor(canvas, simulation) {
    this.canvas = canvas;
    this.simulation = simulation;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07100f);
    this.scene.fog = new THREE.FogExp2(0x07100f, 0.016);
    this.camera = new THREE.PerspectiveCamera(63, 1, 0.1, 220);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.clockTime = 0;
    this.coreGroups = [];
    this.gateGroups = [];
    this.hazardGroups = [];
    this.droneGroups = [];
    this.trail = [];
    this.materials = this.createMaterials();
    this.buildScene();
    this.bindResize();
    this.bindContextLoss();
    this.resize();
  }

  createMaterials() {
    return {
      hull: new THREE.MeshStandardMaterial({ color: 0xe9fff5, roughness: 0.42, metalness: 0.35 }),
      trim: new THREE.MeshStandardMaterial({ color: 0x48d6b2, roughness: 0.38, metalness: 0.35, emissive: 0x0d806a, emissiveIntensity: 0.25 }),
      canopy: new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.22, metalness: 0.18, emissive: 0x6a4200, emissiveIntensity: 0.18 }),
      glow: new THREE.MeshBasicMaterial({ color: 0x6df2ff, transparent: true, opacity: 0.72 }),
      reefTop: new THREE.MeshStandardMaterial({ color: 0x315f4f, roughness: 0.78, metalness: 0.05 }),
      reefRock: new THREE.MeshStandardMaterial({ color: 0x6d6654, roughness: 0.86, metalness: 0.02 }),
      coral: new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.58, metalness: 0.08, emissive: 0x521414, emissiveIntensity: 0.18 }),
      violet: new THREE.MeshStandardMaterial({ color: 0xc97bff, roughness: 0.5, metalness: 0.08, emissive: 0x3b115f, emissiveIntensity: 0.2 }),
      core: new THREE.MeshStandardMaterial({ color: 0xfff5b7, roughness: 0.22, metalness: 0.1, emissive: 0xffc34a, emissiveIntensity: 1.8 }),
      gate: new THREE.MeshStandardMaterial({ color: 0x48d6b2, roughness: 0.36, metalness: 0.16, emissive: 0x1ccca6, emissiveIntensity: 0.8 }),
      hazard: new THREE.MeshStandardMaterial({ color: 0xff4f5f, roughness: 0.44, metalness: 0.14, emissive: 0x8f1020, emissiveIntensity: 0.72 }),
      drone: new THREE.MeshStandardMaterial({ color: 0xf6f1e5, roughness: 0.36, metalness: 0.32, emissive: 0x331556, emissiveIntensity: 0.18 }),
      beacon: new THREE.MeshStandardMaterial({ color: 0x9aa39a, roughness: 0.44, metalness: 0.24, emissive: 0x48d6b2, emissiveIntensity: 0.08 }),
    };
  }

  buildScene() {
    this.addLights();
    this.addAetherSea();
    this.addIslands();
    this.addCollectibles();
    this.addHazards();
    this.addDrones();
    this.addBeacon();
    this.playerGroup = createPlayerSkiff(this.materials);
    this.scene.add(this.playerGroup);
    this.addTrail();
  }

  addLights() {
    const hemi = new THREE.HemisphereLight(0xbfffe9, 0x331c2c, 1.95);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffe0a1, 2.4);
    sun.position.set(-34, 54, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -70;
    sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 70;
    sun.shadow.camera.bottom = -70;
    this.scene.add(sun);

    const rim = new THREE.DirectionalLight(0x9c7bff, 0.9);
    rim.position.set(40, 18, -48);
    this.scene.add(rim);
  }

  addAetherSea() {
    const texture = createReefTexture();
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0x6ad8bb,
      roughness: 0.78,
      metalness: 0.02,
      emissive: 0x05221d,
      emissiveIntensity: 0.22,
    });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(180, 180, 32, 32), material);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -1.2;
    sea.receiveShadow = true;
    this.scene.add(sea);

    const gridMaterial = new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.12 });
    const grid = new THREE.GridHelper(112, 16, 0xffd166, 0x48d6b2);
    grid.material = gridMaterial;
    grid.position.y = -1.06;
    this.scene.add(grid);
  }

  addIslands() {
    const random = seededRandom(3917);
    const basePoints = [
      ...CORE_LAYOUT.filter((_, index) => index % 2 === 0),
      ...GATE_LAYOUT,
      { x: -42, z: 38 },
      { x: 43, z: 24 },
      { x: -46, z: -42 },
      { x: 43, z: -56 },
      { x: 0, z: -60 },
    ];

    basePoints.forEach((point, index) => {
      const radius = 3.2 + random() * 3.6;
      const height = 1.8 + random() * 2.4;
      const island = new THREE.Group();
      island.position.set(point.x + (random() - 0.5) * 5, -0.7, point.z + (random() - 0.5) * 5);

      const rock = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.72, radius * 1.05, height, 8),
        this.materials.reefRock
      );
      rock.position.y = -height * 0.35;
      rock.castShadow = true;
      rock.receiveShadow = true;
      island.add(rock);

      const top = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.92, 0.38, 18), this.materials.reefTop);
      top.position.y = height * 0.16;
      top.castShadow = true;
      top.receiveShadow = true;
      island.add(top);

      const coralCount = 3 + Math.floor(random() * 5);
      for (let i = 0; i < coralCount; i += 1) {
        const angle = random() * Math.PI * 2;
        const distance = radius * (0.25 + random() * 0.6);
        const coral = new THREE.Mesh(
          new THREE.ConeGeometry(0.18 + random() * 0.22, 0.7 + random() * 1.2, 6),
          random() > 0.5 ? this.materials.coral : this.materials.violet
        );
        coral.position.set(Math.cos(angle) * distance, height * 0.36 + coral.geometry.parameters.height * 0.4, Math.sin(angle) * distance);
        coral.rotation.z = (random() - 0.5) * 0.5;
        coral.castShadow = true;
        island.add(coral);
      }

      if (index % 3 === 0) {
        const arc = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.62, 0.055, 8, 28, Math.PI * 1.45), this.materials.gate);
        arc.position.y = height * 0.44 + 1.2;
        arc.rotation.x = Math.PI / 2;
        arc.rotation.z = random() * Math.PI;
        island.add(arc);
      }

      this.scene.add(island);
    });
  }

  addCollectibles() {
    for (const core of this.simulation.cores) {
      const group = new THREE.Group();
      group.position.set(core.x, core.y, core.z);

      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 14), this.materials.core);
      group.add(sphere);

      const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.035, 8, 32), this.materials.gate);
      ringA.rotation.x = Math.PI / 2;
      group.add(ringA);

      const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.025, 8, 32), this.materials.violet);
      ringB.rotation.y = Math.PI / 2;
      group.add(ringB);

      this.coreGroups.push({ group, sphere, ringA, ringB });
      this.scene.add(group);
    }

    for (const gate of this.simulation.gates) {
      const group = new THREE.Group();
      group.position.set(gate.x, 3.8, gate.z);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(gate.radius, 0.1, 12, 54), this.materials.gate);
      group.add(ring);
      const postGeo = new THREE.CylinderGeometry(0.09, 0.16, 5.2, 8);
      const left = new THREE.Mesh(postGeo, this.materials.trim);
      const right = new THREE.Mesh(postGeo, this.materials.trim);
      left.position.set(-gate.radius, -0.55, 0);
      right.position.set(gate.radius, -0.55, 0);
      group.add(left, right);
      this.gateGroups.push({ group, ring, left, right });
      this.scene.add(group);
    }
  }

  addHazards() {
    for (const hazard of this.simulation.hazards) {
      const group = new THREE.Group();
      group.position.set(hazard.x, 2.25, hazard.z);
      const body = new THREE.Mesh(new THREE.IcosahedronGeometry(hazard.r, 1), this.materials.hazard);
      body.castShadow = true;
      group.add(body);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(hazard.r * 1.16, 0.045, 8, 30), this.materials.coral);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      this.hazardGroups.push({ group, body, ring });
      this.scene.add(group);
    }
  }

  addDrones() {
    for (const drone of this.simulation.drones) {
      const group = createSentinelDrone(this.materials);
      this.droneGroups.push(group);
      this.scene.add(group);
    }
  }

  addBeacon() {
    this.beaconGroup = new THREE.Group();
    this.beaconGroup.position.set(this.simulation.finish.x, 0, this.simulation.finish.z);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.5, 8, 14), this.materials.beacon);
    mast.position.y = 3.2;
    mast.castShadow = true;
    this.beaconGroup.add(mast);

    this.beaconCore = new THREE.Mesh(new THREE.OctahedronGeometry(1.45, 1), this.materials.core);
    this.beaconCore.position.y = 7.8;
    this.beaconGroup.add(this.beaconCore);

    this.beaconRings = [];
    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.0 + i * 0.55, 0.055, 8, 48), i % 2 ? this.materials.violet : this.materials.gate);
      ring.position.y = 7.8;
      ring.rotation.x = Math.PI / 2 + i * 0.35;
      this.beaconRings.push(ring);
      this.beaconGroup.add(ring);
    }
    this.scene.add(this.beaconGroup);
  }

  addTrail() {
    const material = new THREE.MeshBasicMaterial({ color: 0x6df2ff, transparent: true, opacity: 0.42, depthWrite: false });
    for (let i = 0; i < 28; i += 1) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09 + i * 0.003, 8, 6), material.clone());
      dot.visible = false;
      this.trail.push(dot);
      this.scene.add(dot);
    }
  }

  bindResize() {
    window.addEventListener("resize", () => this.resize());
  }

  bindContextLoss() {
    this.canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.simulation.emit("toast", "Renderer wartet");
    });
  }

  resize() {
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render(dt) {
    this.clockTime += dt;
    this.syncPlayer(dt);
    this.syncCollectibles(dt);
    this.syncHazards(dt);
    this.syncDrones();
    this.syncBeacon(dt);
    this.syncCamera(dt);
    this.renderer.render(this.scene, this.camera);
  }

  syncPlayer(dt) {
    const p = this.simulation.player;
    this.playerGroup.position.set(p.x, p.y, p.z);
    this.playerGroup.rotation.set(0, p.yaw, p.bank);
    const engine = this.playerGroup.userData.engine;
    const boostScale = 0.7 + p.boost / 100 + p.speed / 60;
    engine.scale.setScalar(boostScale);
    engine.material.opacity = 0.35 + clamp(p.speed / 36, 0, 1) * 0.5;

    if (this.simulation.phase === "playing" && p.speed > 5 && this.trail.length > 0) {
      const index = Math.floor(this.clockTime * 28) % this.trail.length;
      const dot = this.trail[index];
      dot.visible = true;
      dot.position.set(p.x - Math.sin(p.yaw) * 1.3, p.y - 0.25, p.z - Math.cos(p.yaw) * 1.3);
      dot.material.opacity = 0.42;
      dot.scale.setScalar(1);
    }
    for (const dot of this.trail) {
      dot.material.opacity *= Math.pow(0.88, dt * 60);
      dot.scale.multiplyScalar(1 + dt * 1.1);
      if (dot.material.opacity < 0.025) {
        dot.visible = false;
      }
    }
  }

  syncCollectibles(dt) {
    this.simulation.cores.forEach((core, index) => {
      const item = this.coreGroups[index];
      item.group.visible = !core.collected;
      item.group.position.y = core.y + Math.sin(this.clockTime * 2.7 + index) * 0.22;
      item.ringA.rotation.z += dt * 1.3;
      item.ringB.rotation.x += dt * 1.1;
      item.sphere.rotation.y += dt * 0.8;
    });

    this.simulation.gates.forEach((gate, index) => {
      const item = this.gateGroups[index];
      item.ring.rotation.z += dt * (0.7 + gate.flash * 2);
      item.group.scale.setScalar(1 + gate.flash * 0.08);
    });
  }

  syncHazards(dt) {
    this.simulation.hazards.forEach((hazard, index) => {
      const item = this.hazardGroups[index];
      item.group.position.y = 2.2 + Math.sin(this.clockTime * 2.4 + index) * 0.22;
      item.body.rotation.x += dt * 0.6;
      item.body.rotation.y += dt * 1.1;
      item.ring.rotation.z -= dt * 1.5;
    });
  }

  syncDrones() {
    this.simulation.drones.forEach((drone, index) => {
      const group = this.droneGroups[index];
      group.position.set(drone.x, drone.y, drone.z);
      group.rotation.y = -drone.phase + Math.PI * 0.5;
      group.userData.eye.material.emissiveIntensity = 0.55 + drone.alert * 1.3;
      group.scale.setScalar(1 + drone.alert * 0.15);
    });
  }

  syncBeacon(dt) {
    const active = this.simulation.finish.active;
    this.beaconCore.visible = active || Math.sin(this.clockTime * 2) > 0.35;
    this.beaconCore.rotation.y += dt * (active ? 1.8 : 0.5);
    this.beaconCore.scale.setScalar(active ? 1 + Math.sin(this.clockTime * 5) * 0.08 : 0.72);
    this.beaconRings.forEach((ring, index) => {
      ring.visible = active || index === 0;
      ring.rotation.z += dt * (0.55 + index * 0.3) * (active ? 2.6 : 0.65);
      ring.scale.setScalar(active ? 1 : 0.72);
    });
    this.materials.beacon.emissiveIntensity = active ? 0.75 : 0.08;
  }

  syncCamera(dt) {
    const p = this.simulation.player;
    const target = new THREE.Vector3(p.x, p.y + 1.4, p.z);
    const forward = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
    let desired;

    if (this.simulation.phase === "menu") {
      const angle = this.clockTime * 0.12;
      desired = new THREE.Vector3(Math.sin(angle) * 34, 20, 50 + Math.cos(angle) * 16);
      target.set(0, 4.5, -6);
    } else {
      desired = target.clone().addScaledVector(forward, -10.8 - clamp(p.speed / 8, 0, 4));
      desired.y += 6.2 + clamp(p.speed / 32, 0, 1.8);
      desired.x += -p.bank * 2.0;
    }

    const amount = 1 - Math.exp(-dt * 5.8);
    this.camera.position.lerp(desired, amount);
    const lookAt = target.clone().addScaledVector(forward, this.simulation.phase === "menu" ? 0 : 6);
    this.camera.lookAt(lookAt);
  }
}

function createPlayerSkiff(materials) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.38, 2.15), materials.hull);
  body.castShadow = true;
  group.add(body);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.47, 0.98, 4), materials.trim);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = 1.48;
  nose.castShadow = true;
  group.add(nose);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 10), materials.canopy);
  canopy.scale.set(1, 0.45, 1.12);
  canopy.position.set(0, 0.33, 0.38);
  group.add(canopy);

  const wingGeo = new THREE.BoxGeometry(1.55, 0.12, 0.52);
  const leftWing = new THREE.Mesh(wingGeo, materials.trim);
  const rightWing = new THREE.Mesh(wingGeo, materials.trim);
  leftWing.position.set(-1.08, -0.05, -0.18);
  rightWing.position.set(1.08, -0.05, -0.18);
  leftWing.rotation.z = -0.18;
  rightWing.rotation.z = 0.18;
  leftWing.castShadow = true;
  rightWing.castShadow = true;
  group.add(leftWing, rightWing);

  const engine = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 10), materials.glow.clone());
  engine.scale.set(0.9, 0.52, 1.25);
  engine.position.z = -1.34;
  group.userData.engine = engine;
  group.add(engine);

  const runnerGeo = new THREE.CylinderGeometry(0.07, 0.08, 2.2, 8);
  const leftRunner = new THREE.Mesh(runnerGeo, materials.hull);
  const rightRunner = new THREE.Mesh(runnerGeo, materials.hull);
  leftRunner.rotation.x = Math.PI / 2;
  rightRunner.rotation.x = Math.PI / 2;
  leftRunner.position.set(-0.55, -0.35, -0.1);
  rightRunner.position.set(0.55, -0.35, -0.1);
  group.add(leftRunner, rightRunner);

  return group;
}

function createSentinelDrone(materials) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 18, 12), materials.drone);
  body.scale.set(1, 0.7, 1.35);
  body.castShadow = true;
  group.add(body);

  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6b6b,
    roughness: 0.22,
    metalness: 0.1,
    emissive: 0xff233b,
    emissiveIntensity: 0.9,
  });
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), eyeMaterial);
  eye.position.set(0, 0.08, 0.78);
  group.userData.eye = eye;
  group.add(eye);

  const wingGeo = new THREE.BoxGeometry(1.9, 0.08, 0.34);
  const wingA = new THREE.Mesh(wingGeo, materials.violet);
  const wingB = new THREE.Mesh(wingGeo, materials.violet);
  wingA.position.y = 0.08;
  wingB.position.y = 0.08;
  wingA.rotation.z = 0.32;
  wingB.rotation.z = -0.32;
  group.add(wingA, wingB);

  return group;
}

function createReefTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#10332f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const random = seededRandom(8242);
  for (let i = 0; i < 180; i += 1) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const radius = 8 + random() * 40;
    const hue = i % 3 === 0 ? "#48d6b2" : i % 3 === 1 ? "#ffd166" : "#c97bff";
    ctx.globalAlpha = 0.08 + random() * 0.14;
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * (0.28 + random() * 0.35), random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#f4fff9";
  ctx.lineWidth = 2;
  for (let y = 0; y < canvas.height; y += 48) {
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 16) {
      const wave = Math.sin((x + y) * 0.035) * 8;
      if (x === 0) {
        ctx.moveTo(x, y + wave);
      } else {
        ctx.lineTo(x, y + wave);
      }
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function readBestScore() {
  try {
    return Number(localStorage.getItem("aether-reef-best") || 0);
  } catch {
    return 0;
  }
}

function writeBestScore(score) {
  try {
    localStorage.setItem("aether-reef-best", String(Math.round(score)));
  } catch {
    // Local storage can be unavailable in hardened browser contexts.
  }
}

function readBoolean(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value == null ? fallback : value === "true";
  } catch {
    return fallback;
  }
}

function writeBoolean(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Sound preference is optional.
  }
}

const simulation = new Simulation();
const audio = new AudioSystem();
const ui = new GameUI(simulation, audio);
const view = new GameView(document.getElementById("game"), simulation);
const smokeDrive = new URLSearchParams(window.location.search).get("smoke") === "drive";

const app = {
  startRun() {
    simulation.resetRun();
    simulation.begin();
    ui.showGame();
  },
  restart() {
    if (simulation.phase === "menu") {
      this.startRun();
      return;
    }
    simulation.resetRun();
    simulation.begin();
    ui.showGame();
  },
  togglePause() {
    if (simulation.phase === "playing") {
      simulation.pause();
      ui.showPause();
    } else if (simulation.phase === "paused") {
      simulation.resume();
      ui.hidePause();
    }
  },
  enter() {
    if (simulation.phase === "menu" || simulation.phase === "ready") {
      this.startRun();
    } else if (simulation.phase === "paused") {
      this.togglePause();
    } else if (simulation.phase === "won" || simulation.phase === "lost") {
      this.restart();
    }
  },
  menu() {
    simulation.setMenu();
    ui.showMenu();
  },
};

const input = new InputController({
  togglePause: () => app.togglePause(),
  restart: () => app.restart(),
  enter: () => app.enter(),
});

document.getElementById("startButton").addEventListener("click", () => app.startRun());
document.getElementById("restartButton").addEventListener("click", () => app.restart());
document.getElementById("pauseButton").addEventListener("click", () => app.togglePause());
document.getElementById("resumeButton").addEventListener("click", () => app.togglePause());
document.getElementById("pauseRestartButton").addEventListener("click", () => app.restart());
document.getElementById("playAgainButton").addEventListener("click", () => app.restart());
document.getElementById("resultMenuButton").addEventListener("click", () => app.menu());

const toggleSound = async () => {
  await audio.toggle();
  ui.updateAudioState();
};
document.getElementById("audioButton").addEventListener("click", toggleSound);
document.getElementById("menuSoundButton").addEventListener("click", toggleSound);

let lastTime = performance.now();
function frame(now) {
  const rawDt = (now - lastTime) / 1000;
  const dt = Number.isFinite(rawDt) ? clamp(rawDt > 0 ? rawDt : 0.016, 0, 0.05) : 0.016;
  lastTime = now;
  const smokeActions =
    smokeDrive && simulation.phase === "playing"
      ? {
          left: Math.sin(now * 0.002) < -0.35 ? 1 : 0,
          right: Math.sin(now * 0.002) > 0.35 ? 1 : 0,
          up: 1,
          down: 0,
          boost: Math.sin(now * 0.004) > 0.15,
        }
      : input.actions;
  simulation.update(dt, smokeActions);
  const events = simulation.drainEvents();
  for (const event of events) {
    ui.handleEvent(event);
    audio.handleEvent(event);
  }
  ui.update();
  view.render(dt);
  document.documentElement.dataset.drawCalls = String(view.renderer.info.render.calls);
  document.documentElement.dataset.triangles = String(view.renderer.info.render.triangles);
  if (!window.__AETHER_FREEZE_FRAME) {
    requestAnimationFrame(frame);
  }
}
requestAnimationFrame(frame);

if (smokeDrive) {
  window.setTimeout(() => app.startRun(), 120);
}

window.AETHER_REEF_DEBUG = {
  simulation,
  view,
  start: () => app.startRun(),
  step(frames = 1) {
    const actions = { left: 0, right: 1, up: 1, down: 0, boost: true };
    const bufferedEvents = [];
    for (let i = 0; i < frames; i += 1) {
      simulation.update(1 / 60, actions);
      bufferedEvents.push(...simulation.drainEvents());
    }
    for (const event of bufferedEvents) {
      ui.handleEvent(event);
    }
    ui.update();
    view.render(1 / 60);
    document.documentElement.dataset.drawCalls = String(view.renderer.info.render.calls);
    document.documentElement.dataset.triangles = String(view.renderer.info.render.triangles);
  },
};
