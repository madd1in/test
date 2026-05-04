import * as THREE from "three";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const approach = (current, target, amount) => {
  if (current < target) return Math.min(current + amount, target);
  if (current > target) return Math.max(current - amount, target);
  return target;
};

const distanceXZ = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

const seededRandom = (seed) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
};

function makeCanvasTexture(size, repeatX, repeatY, painter) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  painter(ctx, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 2;
  return texture;
}

function paintStone(ctx, size) {
  const random = seededRandom(42);
  ctx.fillStyle = "#6f746d";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 32) {
    for (let x = 0; x < size; x += 32) {
      const shade = 92 + Math.floor(random() * 44);
      ctx.fillStyle = `rgb(${shade}, ${shade + 5}, ${shade + 2})`;
      ctx.fillRect(x + 1, y + 1, 30, 30);
      ctx.strokeStyle = "rgba(24, 28, 28, 0.42)";
      ctx.strokeRect(x + 0.5, y + 0.5, 31, 31);
    }
  }
  for (let i = 0; i < 180; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const alpha = 0.18 + random() * 0.24;
    ctx.fillStyle = `rgba(247, 233, 190, ${alpha})`;
    ctx.fillRect(x, y, 1 + random() * 2, 1 + random() * 2);
  }
}

function paintMoss(ctx, size) {
  const random = seededRandom(84);
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#41685d");
  gradient.addColorStop(0.48, "#7b8662");
  gradient.addColorStop(1, "#39433a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 95; i += 1) {
    const radius = 6 + random() * 22;
    ctx.beginPath();
    ctx.arc(random() * size, random() * size, radius, 0, Math.PI * 2);
    ctx.fillStyle = random() > 0.45 ? "rgba(128, 184, 120, 0.24)" : "rgba(38, 54, 42, 0.28)";
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(231, 203, 129, 0.18)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i += 1) {
    ctx.beginPath();
    ctx.moveTo(random() * size, random() * size);
    ctx.lineTo(random() * size, random() * size);
    ctx.stroke();
  }
}

function paintRune(ctx, size) {
  ctx.fillStyle = "#243037";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(127, 225, 192, 0.62)";
  ctx.lineWidth = 7;
  for (let i = 0; i < 5; i += 1) {
    const inset = 18 + i * 20;
    ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
  }
  ctx.strokeStyle = "rgba(242, 193, 78, 0.72)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.16);
  ctx.lineTo(size * 0.7, size * 0.48);
  ctx.lineTo(size * 0.5, size * 0.84);
  ctx.lineTo(size * 0.3, size * 0.48);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = "rgba(127, 225, 192, 0.2)";
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, size * 0.13, 0, Math.PI * 2);
  ctx.fill();
}

function paintHazard(ctx, size) {
  ctx.fillStyle = "#2b1518";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(240, 127, 95, 0.74)";
  ctx.lineWidth = 12;
  for (let i = -size; i < size * 2; i += 34) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
  }
}

function paintSky(ctx, size) {
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, "#34415b");
  gradient.addColorStop(0.45, "#243642");
  gradient.addColorStop(1, "#17161f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const random = seededRandom(144);
  for (let i = 0; i < 180; i += 1) {
    const radius = random() > 0.86 ? 1.7 : 0.9;
    ctx.fillStyle = `rgba(246, 235, 194, ${0.24 + random() * 0.58})`;
    ctx.beginPath();
    ctx.arc(random() * size, random() * size * 0.68, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class AudioBus {
  constructor(button) {
    this.button = button;
    this.muted = false;
    this.unlocked = false;
    this.lastPlayed = new Map();
    this.bgmUrl = "./assets/audio/bgm/catacomb-bell-vault.mp3";
    this.soundUrls = {
      jump: "./assets/audio/sfx/jump.mp3",
      land: "./assets/audio/sfx/land.mp3",
      switch: "./assets/audio/sfx/switch.mp3",
      reset: "./assets/audio/sfx/reset.mp3"
    };
    this.bgm = null;
    this.sounds = {};
    this.assetsQueued = false;
    this.context = null;
    this.padGain = null;

    this.button.addEventListener("click", () => this.toggle());
  }

  ensureContext() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      this.context = new AudioContext();
    }
    this.context.resume?.().catch(() => {});
    return this.context;
  }

  queueAssets() {
    if (this.assetsQueued) return;
    this.assetsQueued = true;
    const warmAssets = () => {
      for (const [name, url] of Object.entries(this.soundUrls)) {
        const sound = new Audio(url);
        sound.preload = "none";
        sound.volume = 0.4;
        this.sounds[name] = sound;
      }
      this.getBgm();
    };
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(warmAssets, { timeout: 2600 });
    } else {
      window.setTimeout(warmAssets, 1400);
    }
  }

  getBgm() {
    if (!this.bgm) {
      this.bgm = new Audio(this.bgmUrl);
      this.bgm.loop = true;
      this.bgm.preload = "none";
      this.bgm.volume = 0.16;
      this.bgm.playbackRate = 0.92;
    }
    return this.bgm;
  }

  startPad() {
    const context = this.ensureContext();
    if (!context || this.padGain) return;
    const gain = context.createGain();
    gain.gain.value = this.muted ? 0 : 0.018;
    gain.connect(context.destination);
    [110, 165].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      const voiceGain = context.createGain();
      voiceGain.gain.value = index === 0 ? 0.55 : 0.24;
      oscillator.connect(voiceGain).connect(gain);
      oscillator.start();
    });
    this.padGain = gain;
  }

  unlock() {
    this.unlocked = true;
    this.ensureContext();
    this.startPad();
    this.queueAssets();
    if (!this.muted) {
      window.setTimeout(() => {
        if (!this.muted) this.getBgm().play().catch(() => {});
      }, 600);
    }
  }

  toggle() {
    this.muted = !this.muted;
    this.button.setAttribute("aria-pressed", String(this.muted));
    if (this.muted) {
      if (this.bgm) this.bgm.pause();
      if (this.padGain) this.padGain.gain.setTargetAtTime(0, this.context.currentTime, 0.04);
      return;
    }
    this.unlock();
    if (this.padGain) this.padGain.gain.setTargetAtTime(0.018, this.context.currentTime, 0.08);
  }

  synth(name, volume, rate) {
    const context = this.ensureContext();
    if (!context || this.muted) return;
    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.14), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (name === "land" ? 0.16 : 0.28));
    gain.connect(context.destination);

    const oscillator = context.createOscillator();
    oscillator.type = name === "land" ? "sine" : name === "reset" ? "sawtooth" : "triangle";
    const base = {
      jump: 420,
      land: 90,
      switch: 620,
      reset: 260,
      relay: 720
    }[name] ?? 360;
    oscillator.frequency.setValueAtTime(base * rate, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(60, base * rate * (name === "jump" ? 1.75 : 0.55)), now + 0.18);
    oscillator.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + 0.32);
  }

  play(name, volume = 0.55, rate = 1, cooldown = 40) {
    if (this.muted || !this.unlocked) return;
    const now = performance.now();
    if ((this.lastPlayed.get(name) ?? 0) + cooldown > now) return;
    this.lastPlayed.set(name, now);
    this.synth(name, volume, rate);

    const source = this.sounds[name];
    if (!source) return;
    const sound = source.cloneNode(true);
    sound.preload = "none";
    sound.volume = Math.min(0.22, volume * 0.35);
    sound.playbackRate = rate;
    sound.play().catch(() => {});
  }
}

class RuneLiftGame {
  constructor() {
    this.canvas = document.querySelector("#scene");
    this.shell = document.querySelector("#game-shell");
    this.startScreen = document.querySelector("#start-screen");
    this.finishScreen = document.querySelector("#finish-screen");
    this.startButton = document.querySelector("#start-button");
    this.againButton = document.querySelector("#again-button");
    this.assistButton = document.querySelector("#assist-button");
    this.assistModeButton = document.querySelector("#assist-mode-button");
    this.normalModeButton = document.querySelector("#normal-mode-button");
    this.objective = document.querySelector("#objective");
    this.shardCount = document.querySelector("#shard-count");
    this.levelValue = document.querySelector("#level-value");
    this.finishStats = document.querySelector("#finish-stats");
    this.toast = document.querySelector("#toast");
    this.touchRing = document.querySelector("#touch-ring");
    this.jumpButton = document.querySelector("#jump-button");
    this.qualityButton = document.querySelector("#quality-button");
    this.fullscreenButton = document.querySelector("#fullscreen-button");
    this.audio = new AudioBus(document.querySelector("#audio-button"));
    const deviceMemory = navigator.deviceMemory ?? 4;
    const dpr = window.devicePixelRatio || 1;
    this.basePerformanceMode = window.innerWidth < 1200 || dpr > 1.05 || deviceMemory <= 8;
    this.turboMode = (() => {
      try {
        return localStorage.getItem("runeLiftQuality") !== "fx";
      } catch {
        return true;
      }
    })();
    this.performanceMode = this.turboMode || this.basePerformanceMode;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: "high-performance"
    });
    this.renderer.setClearColor(0x101419, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = !this.performanceMode;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x101419, 0.028);
    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 180);
    this.camera.position.set(7, 6.5, 9);
    this.cameraTarget = new THREE.Vector3(0, 1.1, 0);

    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.runStartedAt = 0;
    this.running = false;
    this.finished = false;
    this.totalShards = 22;
    this.collected = 0;
    this.state = {
      bridge: false,
      lift: false,
      spire: false,
      echo: false,
      relay: false,
      crown: false,
      eclipse: false,
      dawn: false,
      dusk: false,
      chrono: false,
      mirror: false,
      orrery: false,
      sanctum: false,
      skyKey: false,
      guardian: false
    };
    this.relayIndex = 0;
    this.hudState = { objective: "", count: "", level: "" };
    this.framePressure = { slowTime: 0, qualityReduced: this.performanceMode, renderSkip: false };
    this.assistMode = true;
    this.assistProfiles = {
      assist: {
        name: "Assist",
        maxJumps: 2,
        coyoteTime: 0.34,
        jumpBufferTime: 0.3,
        landingForgiveness: 1.75,
        platformMargin: 1.12,
        rescueY: -1.15,
        switchRadius: 1.65,
        shardRadius: 1.95,
        groundSpeed: 4.7,
        airSpeed: 4.05,
        groundAcceleration: 22,
        airAcceleration: 13,
        gravity: 15.8,
        maxFallSpeed: 16,
        jumpVelocity: 7.7,
        doubleJumpVelocity: 7.05,
        bounceVelocity: 10.1,
        ghostSupport: true,
        hazardRecovery: true
      },
      normal: {
        name: "Normal",
        maxJumps: 1,
        coyoteTime: 0.14,
        jumpBufferTime: 0.14,
        landingForgiveness: 0.62,
        platformMargin: 0.42,
        rescueY: -4.9,
        switchRadius: 1.08,
        shardRadius: 1.28,
        groundSpeed: 4.95,
        airSpeed: 4.0,
        groundAcceleration: 23,
        airAcceleration: 11,
        gravity: 17.6,
        maxFallSpeed: 18,
        jumpVelocity: 7.45,
        doubleJumpVelocity: 0,
        bounceVelocity: 9.2,
        ghostSupport: false,
        hazardRecovery: false
      }
    };
    this.assist = { ...this.assistProfiles.assist };

    this.keys = new Set();
    this.touch = {
      active: false,
      id: null,
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
      swipeConsumed: false,
      vector: new THREE.Vector2()
    };

    this.player = {
      position: new THREE.Vector3(0, 1.42, 0),
      velocity: new THREE.Vector3(),
      checkpoint: new THREE.Vector3(0, 1.42, 0),
      radius: 0.38,
      height: 1.32,
      grounded: false,
      currentPlatform: null,
      safeTimer: 0,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      jumpsRemaining: 2
    };

    this.moveInput = new THREE.Vector2();
    this.cameraOffsetDesktop = new THREE.Vector3(8.4, 6.8, 9.2);
    this.cameraOffsetMobile = new THREE.Vector3(6.7, 7.1, 9.1);
    this.cameraDesired = new THREE.Vector3();
    this.cameraTargetDesired = new THREE.Vector3();
    this.enemyMoveScratch = new THREE.Vector3();
    this.enemyContactScratch = new THREE.Vector3();
    this.enemySafeScratch = new THREE.Vector3();
    this.geometryCache = new Map();
    this.platforms = [];
    this.switches = [];
    this.shards = [];
    this.bouncePads = [];
    this.hazards = [];
    this.relayNodes = [];
    this.timeAnchors = [];
    this.mirrorBeacons = [];
    this.gravityWells = [];
    this.glyphSeals = [];
    this.riftPairs = [];
    this.treasureChests = [];
    this.enemies = [];
    this.guideWisps = [];
    this.safetyNets = [];
    this.auroraRibbons = [];
    this.eclipseGates = [];
    this.windZones = [];
    this.driftFields = [];
    this.mirrorBeam = null;
    this.wispDummy = new THREE.Object3D();

    this.createLights();
    this.createMaterials();
    this.createSky();
    this.createAtmosphere();
    this.createLevel();
    this.createPlayer();
    this.bindEvents();
    this.updateModeUi();
    this.updateQualityUi();
    this.updateFullscreenUi();
    this.updateAssistVisibility();
    this.resize();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  createLights() {
    const hemi = new THREE.HemisphereLight(0xc8fff0, 0x1a1218, 1.65);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffe2a0, 2.6);
    sun.position.set(-8, 12, 8);
    sun.castShadow = !this.performanceMode;
    const shadowSize = this.performanceMode ? 256 : 768;
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 45;
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    this.scene.add(sun);

    if (!this.performanceMode) {
      const fill = new THREE.PointLight(0x7fe1c0, 1.1, 28, 2);
      fill.position.set(0, 6, -6);
      this.scene.add(fill);
    }
  }

  createMaterials() {
    const textureSize = this.performanceMode ? 96 : 160;
    const stone = makeCanvasTexture(textureSize, 2, 2, paintStone);
    const moss = makeCanvasTexture(textureSize, 2, 2, paintMoss);
    const rune = makeCanvasTexture(textureSize, 1, 1, paintRune);
    const hazard = makeCanvasTexture(textureSize, 1, 1, paintHazard);

    this.materials = {
      stone: new THREE.MeshStandardMaterial({ map: stone, roughness: 0.86, metalness: 0.04 }),
      moss: new THREE.MeshStandardMaterial({ map: moss, roughness: 0.92, metalness: 0.02 }),
      rune: new THREE.MeshStandardMaterial({
        map: rune,
        color: 0xffffff,
        emissive: 0x243d37,
        emissiveIntensity: 0.42,
        roughness: 0.58,
        metalness: 0.08
      }),
      bridge: new THREE.MeshStandardMaterial({
        color: 0x80dfc0,
        emissive: 0x235f54,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.74,
        roughness: 0.28,
        metalness: 0.12
      }),
      lift: new THREE.MeshStandardMaterial({
        color: 0x8d9fb5,
        emissive: 0x263a5f,
        emissiveIntensity: 0.35,
        roughness: 0.48,
        metalness: 0.12
      }),
      portal: new THREE.MeshStandardMaterial({
        color: 0xf2c14e,
        emissive: 0xf07f5f,
        emissiveIntensity: 1.2,
        roughness: 0.34,
        metalness: 0.2
      }),
      hazard: new THREE.MeshStandardMaterial({
        map: hazard,
        emissive: 0x9e302f,
        emissiveIntensity: 0.85,
        roughness: 0.5,
        metalness: 0.04
      }),
      player: new THREE.MeshStandardMaterial({
        color: 0xf4f0e7,
        roughness: 0.42,
        metalness: 0.08
      }),
      playerAccent: new THREE.MeshStandardMaterial({
        color: 0x7fe1c0,
        emissive: 0x246f5b,
        emissiveIntensity: 0.55,
        roughness: 0.32,
        metalness: 0.18
      }),
      enemy: new THREE.MeshStandardMaterial({
        color: 0x3a303f,
        emissive: 0x241a2b,
        emissiveIntensity: 0.38,
        roughness: 0.5,
        metalness: 0.08
      }),
      enemyAccent: new THREE.MeshStandardMaterial({
        color: 0xf07f5f,
        emissive: 0x812821,
        emissiveIntensity: 0.72,
        roughness: 0.34,
        metalness: 0.12
      })
    };
  }

  createSky() {
    const texture = makeCanvasTexture(this.performanceMode ? 192 : 320, 1, 1, paintSky);
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(92, this.performanceMode ? 16 : 26, this.performanceMode ? 8 : 12),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
    );
    sky.position.y = 10;
    this.scene.add(sky);
  }

  createAtmosphere() {
    const moteCount = this.performanceMode ? 0 : 80;
    const positions = new Float32Array(moteCount * 3);
    const random = seededRandom(902);
    for (let i = 0; i < moteCount; i += 1) {
      positions[i * 3] = (random() - 0.12) * 92;
      positions[i * 3 + 1] = 1.2 + random() * 12;
      positions[i * 3 + 2] = (random() - 0.32) * 62;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x9ff5d8,
      size: this.performanceMode ? 0.055 : 0.075,
      transparent: true,
      opacity: 0.48,
      depthWrite: false
    });
    this.moteField = moteCount > 0 ? new THREE.Points(geometry, material) : null;
    if (this.moteField) this.scene.add(this.moteField);

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, this.performanceMode ? 10 : 18, this.performanceMode ? 6 : 9),
      new THREE.MeshBasicMaterial({ color: 0xf6e3a8, transparent: true, opacity: 0.82 })
    );
    moon.position.set(-18, 19, -28);
    this.scene.add(moon);
  }

  createLevel() {
    this.addPlatform("hub", [0, 0, 0], [6, 1, 6], { material: "stone" });
    this.addPlatform("north-walk", [0, 0, -4.7], [3.15, 0.55, 3.9], { material: "moss" });
    this.addPlatform("north", [0, 0, -8.2], [4.8, 1, 4.8], { material: "rune" });
    this.addPlatform("light-bridge", [4.55, 0, -8.2], [5.35, 0.42, 2.65], {
      material: "bridge",
      activeWhen: () => this.state.bridge,
      ghost: true,
      ghostOpacity: 0.13
    });
    this.addPlatform("east", [8.4, 0, -8.2], [4.8, 1, 4.8], { material: "moss" });
    this.addPlatform("west-walk", [-4.1, 0, 1.8], [4.25, 0.55, 2.65], { material: "moss" });
    this.addPlatform("west", [-7.35, 0, 1.8], [4.4, 1, 4.4], { material: "stone" });
    this.addPlatform("sky-step", [-9.75, 1.75, 1.8], [3.55, 0.62, 3.4], { material: "lift" });
    this.addPlatform("sky-helper-ledge", [-10.95, 2.85, 1.8], [4.05, 0.46, 3.15], {
      material: "bridge",
      ghost: true,
      ghostOpacity: 0.16,
      assistOnly: true
    });
    this.addPlatform("sky-ledge", [-12.05, 3.55, 1.8], [5.15, 1, 5.15], { material: "rune" });
    this.addPlatform("south-dock", [0, 0, 4.95], [4.25, 0.55, 4.05], { material: "stone" });
    this.addPlatform("moving-lift", [0, 0, 9.55], [3.15, 0.55, 3.15], {
      material: "lift",
      activeWhen: () => this.state.lift,
      moving: { axis: [0, 0, 1], range: 2.4, speed: 0.55, phase: 0.1 },
      ghost: true,
      ghostOpacity: 0.2
    });
    this.addPlatform("south-helper-bridge", [0, -0.02, 10.1], [3.75, 0.38, 8.8], {
      material: "bridge",
      ghost: true,
      ghostOpacity: 0.15,
      assistOnly: true
    });
    this.addPlatform("south", [0, 0, 14.55], [5.85, 1, 5.85], { material: "moss" });
    this.addPlatform("portal-bridge", [0, 0, 18.65], [3.7, 0.44, 5.45], {
      material: "bridge",
      activeWhen: () => this.collected >= 3,
      ghost: true,
      ghostOpacity: 0.11
    });
    this.addPlatform("portal-island", [0, 0, 22.55], [5.5, 1, 5.5], { material: "rune" });
    this.addPlatform("threshold-bridge", [4.75, 0, 22.55], [5.45, 0.42, 2.55], {
      material: "bridge",
      activeWhen: () => this.collected >= 3,
      ghost: true,
      ghostOpacity: 0.1
    });
    this.addPlatform("spire-foyer", [8.6, 0, 22.55], [4.9, 1, 4.9], { material: "stone" });
    this.addPlatform("spiral-low", [11.65, 0.92, 20.2], [4.0, 0.58, 3.55], { material: "moss" });
    this.addPlatform("spiral-mid", [14.1, 1.9, 17.7], [4.0, 0.58, 3.55], { material: "lift" });
    this.addPlatform("spiral-high", [16.8, 3.0, 15.2], [4.25, 0.62, 4.05], { material: "stone" });
    this.addPlatform("spire-helper-bridge", [15.35, 2.45, 16.4], [3.9, 0.42, 3.8], {
      material: "bridge",
      ghost: true,
      ghostOpacity: 0.15,
      assistOnly: true
    });
    this.addPlatform("spire-bridge", [17.7, 3.0, 18.75], [3.15, 0.42, 5.75], {
      material: "bridge",
      activeWhen: () => this.state.spire,
      ghost: true,
      ghostOpacity: 0.1
    });
    this.addPlatform("moon-gate", [18.3, 3.0, 22.65], [5.75, 1, 5.75], { material: "rune" });
    this.addPlatform("echo-causeway", [22.8, 3.0, 22.65], [4.8, 0.44, 2.7], {
      material: "bridge",
      ghost: true,
      ghostOpacity: 0.14
    });
    this.addPlatform("echo-court", [26.9, 3.0, 22.65], [5.35, 1, 5.35], { material: "moss" });
    this.addPlatform("echo-helper-wing", [30.55, 3.0, 24.35], [4.4, 0.38, 2.55], {
      material: "bridge",
      ghost: true,
      ghostOpacity: 0.15,
      assistOnly: true
    });
    this.addPlatform("echo-bridge", [31.0, 3.0, 22.65], [4.65, 0.42, 2.35], {
      material: "bridge",
      activeWhen: () => this.state.echo,
      ghost: true,
      ghostOpacity: 0.1
    });
    this.addPlatform("prism-garden", [35.0, 3.0, 22.65], [5.4, 1, 5.4], { material: "stone" });
    this.addPlatform("relay-vault-bridge", [35.0, 3.25, 19.15], [3.45, 0.38, 6.35], {
      material: "bridge",
      activeWhen: () => this.state.relay,
      ghost: true,
      ghostOpacity: 0.1,
      supportWhenGhost: false
    });
    this.addPlatform("relay-vault", [35.0, 3.35, 15.45], [4.75, 0.82, 4.75], { material: "rune" });
    this.addPlatform("prism-step", [37.75, 3.82, 20.2], [4.0, 0.58, 3.45], { material: "lift" });
    this.addPlatform("sunrise-bridge", [40.35, 4.45, 20.2], [3.75, 0.42, 2.5], {
      material: "bridge",
      activeWhen: () => this.collected >= 6,
      ghost: true,
      ghostOpacity: 0.11
    });
    this.addPlatform("sunrise-gate", [43.2, 4.45, 20.2], [5.65, 1, 5.65], { material: "rune" });
    this.addPlatform("aurora-drift", [47.6, 4.95, 17.65], [4.55, 0.52, 3.25], {
      material: "lift",
      moving: { axis: [0.35, 0, -0.94], range: 0.92, speed: 0.42, phase: 1.4 },
      ghost: true,
      ghostOpacity: 0.16
    });
    this.addPlatform("aurora-rest", [51.15, 5.75, 14.6], [4.8, 0.62, 3.85], { material: "moss" });
    this.addPlatform("aurora-helper-rail", [54.0, 6.15, 13.0], [4.65, 0.38, 2.7], {
      material: "bridge",
      ghost: true,
      ghostOpacity: 0.16,
      assistOnly: true
    });
    this.addPlatform("crown-bridge", [54.85, 6.35, 11.8], [4.55, 0.42, 2.45], {
      material: "bridge",
      activeWhen: () => this.state.crown,
      ghost: true,
      ghostOpacity: 0.11
    });
    this.addPlatform("crown-garden", [58.4, 6.35, 10.95], [5.95, 1, 5.95], { material: "rune" });
    this.addPlatform("eclipse-causeway", [62.25, 6.62, 9.1], [4.7, 0.42, 2.35], {
      material: "bridge",
      activeWhen: () => this.state.crown,
      ghost: true,
      ghostOpacity: 0.12
    });
    this.addPlatform("eclipse-ring", [66.0, 6.75, 7.1], [5.4, 0.86, 5.4], { material: "stone" });
    this.addPlatform("eclipse-sway", [70.25, 7.15, 5.2], [3.8, 0.48, 2.7], {
      material: "lift",
      moving: { axis: [0.72, 0, -0.7], range: 0.78, speed: 0.46, phase: 2.2 },
      ghost: true,
      ghostOpacity: 0.16
    });
    this.addPlatform("eclipse-helper-rail", [70.9, 7.2, 4.65], [7.4, 0.38, 2.25], {
      material: "bridge",
      ghost: true,
      ghostOpacity: 0.14,
      assistOnly: true
    });
    this.addPlatform("eclipse-rest", [73.7, 7.8, 2.75], [4.8, 0.62, 3.7], { material: "moss" });
    this.addPlatform("star-forge-bridge", [76.85, 8.05, 1.45], [4.3, 0.42, 2.4], {
      material: "bridge",
      activeWhen: () => this.state.eclipse,
      ghost: true,
      ghostOpacity: 0.11
    });
    this.addPlatform("star-forge", [80.1, 8.05, 0.4], [5.8, 1, 5.8], { material: "rune" });
    this.addPlatform("chrono-approach", [84.65, 8.35, -1.8], [5.2, 0.42, 2.45], {
      material: "bridge",
      activeWhen: () => this.collected >= 12,
      ghost: true,
      ghostOpacity: 0.12
    });
    this.addPlatform("chrono-archive", [88.85, 8.45, -4.25], [5.8, 0.9, 5.8], { material: "stone" });
    this.addPlatform("dawn-dial", [92.7, 8.95, -8.0], [3.75, 0.52, 3.2], {
      material: "lift",
      moving: { axis: [0.55, 0, -0.2], range: 0.42, speed: 0.62, phase: 0.8 },
      ghost: true,
      ghostOpacity: 0.16
    });
    this.addPlatform("dusk-dial", [92.85, 9.1, -0.6], [3.75, 0.52, 3.2], {
      material: "lift",
      moving: { axis: [-0.5, 0, 0.24], range: 0.42, speed: 0.58, phase: 2.4 },
      ghost: true,
      ghostOpacity: 0.16
    });
    this.addPlatform("chrono-helper-rail", [94.55, 9.22, -4.25], [6.6, 0.36, 2.25], {
      material: "bridge",
      ghost: true,
      ghostOpacity: 0.14,
      assistOnly: true
    });
    this.addPlatform("chrono-gate-bridge", [97.0, 9.4, -4.25], [5.2, 0.42, 2.5], {
      material: "bridge",
      activeWhen: () => this.state.chrono,
      ghost: true,
      ghostOpacity: 0.1
    });
    this.addPlatform("zenith-vault", [101.0, 9.55, -4.25], [6.1, 1, 6.1], { material: "rune" });
    this.addPlatform("mirror-causeway", [105.45, 9.8, -4.25], [5.1, 0.42, 2.45], {
      material: "bridge",
      activeWhen: () => this.collected >= 14,
      ghost: true,
      ghostOpacity: 0.12
    });
    this.addPlatform("mirror-observatory", [109.9, 9.95, -4.25], [6.0, 0.9, 6.0], { material: "stone" });
    this.addPlatform("mirror-north-dish", [114.2, 10.35, -8.3], [3.8, 0.52, 3.2], {
      material: "lift",
      moving: { axis: [0.35, 0, -0.2], range: 0.34, speed: 0.54, phase: 0.4 },
      ghost: true,
      ghostOpacity: 0.15
    });
    this.addPlatform("mirror-south-dish", [114.2, 10.35, -0.2], [3.8, 0.52, 3.2], {
      material: "lift",
      moving: { axis: [-0.28, 0, 0.24], range: 0.34, speed: 0.5, phase: 1.8 },
      ghost: true,
      ghostOpacity: 0.15
    });
    this.addPlatform("mirror-helper-rail", [116.25, 10.48, -4.25], [6.9, 0.36, 2.3], {
      material: "bridge",
      ghost: true,
      ghostOpacity: 0.14,
      assistOnly: true
    });
    this.addPlatform("astral-bridge", [117.95, 10.65, -4.25], [5.2, 0.42, 2.5], {
      material: "bridge",
      activeWhen: () => this.state.mirror,
      ghost: true,
      ghostOpacity: 0.1
    });
    this.addPlatform("astral-vault", [122.0, 10.85, -4.25], [6.25, 1, 6.25], { material: "rune" });
    this.addPlatform("gravity-causeway", [126.45, 11.08, -4.25], [5.25, 0.42, 2.45], {
      material: "bridge",
      activeWhen: () => this.collected >= 16,
      ghost: true,
      ghostOpacity: 0.12
    });
    this.addPlatform("orrery-hub", [130.8, 11.22, -4.25], [5.9, 0.9, 5.9], { material: "stone" });
    this.addPlatform("orbital-north", [135.25, 11.75, -7.55], [3.8, 0.52, 3.2], {
      material: "lift",
      moving: { axis: [0.34, 0, -0.44], range: 0.48, speed: 0.55, phase: 0.6 },
      ghost: true,
      ghostOpacity: 0.15
    });
    this.addPlatform("orbital-south", [135.45, 12.25, -0.95], [3.8, 0.52, 3.2], {
      material: "lift",
      moving: { axis: [-0.32, 0, 0.48], range: 0.48, speed: 0.52, phase: 2.1 },
      ghost: true,
      ghostOpacity: 0.15
    });
    this.addPlatform("gravity-helper-rail", [138.0, 12.42, -4.25], [7.4, 0.36, 2.35], {
      material: "bridge",
      ghost: true,
      ghostOpacity: 0.14,
      assistOnly: true
    });
    this.addPlatform("gravity-gate-bridge", [140.3, 12.62, -4.25], [5.25, 0.42, 2.5], {
      material: "bridge",
      activeWhen: () => this.state.orrery,
      ghost: true,
      ghostOpacity: 0.1
    });
    this.addPlatform("nebula-vault", [144.45, 12.82, -4.25], [6.45, 1, 6.45], { material: "rune" });
    this.addPlatform("rift-causeway", [148.9, 13.05, -4.25], [5.2, 0.42, 2.45], {
      material: "bridge",
      activeWhen: () => this.collected >= 18,
      ghost: true,
      ghostOpacity: 0.12
    });
    this.addPlatform("rift-entry", [153.1, 13.18, -4.25], [5.2, 0.86, 5.2], { material: "stone" });
    this.addPlatform("rift-exit", [153.1, 14.55, -13.15], [4.9, 0.72, 4.9], { material: "moss" });
    this.addPlatform("temple-foyer", [158.05, 14.7, -13.15], [5.8, 0.92, 5.8], { material: "rune" });
    this.addPlatform("glyph-west", [162.0, 15.05, -17.1], [3.55, 0.5, 3.1], {
      material: "lift",
      moving: { axis: [0.24, 0, -0.3], range: 0.32, speed: 0.5, phase: 0.2 },
      ghost: true,
      ghostOpacity: 0.15
    });
    this.addPlatform("glyph-east", [162.0, 15.05, -9.2], [3.55, 0.5, 3.1], {
      material: "lift",
      moving: { axis: [-0.24, 0, 0.3], range: 0.32, speed: 0.52, phase: 1.5 },
      ghost: true,
      ghostOpacity: 0.15
    });
    this.addPlatform("sanctum-helper-rail", [164.2, 15.22, -13.15], [7.2, 0.36, 2.25], {
      material: "bridge",
      ghost: true,
      ghostOpacity: 0.14,
      assistOnly: true
    });
    this.addPlatform("sanctum-bridge", [165.75, 15.38, -13.15], [5.25, 0.42, 2.5], {
      material: "bridge",
      activeWhen: () => this.state.sanctum,
      ghost: true,
      ghostOpacity: 0.1
    });
    this.addPlatform("sanctum-vault", [169.95, 15.55, -13.15], [6.55, 1, 6.55], { material: "rune" });
    this.addPlatform("keeper-causeway", [174.35, 15.82, -13.15], [5.3, 0.42, 2.55], {
      material: "bridge",
      activeWhen: () => this.state.sanctum,
      ghost: true,
      ghostOpacity: 0.12
    });
    this.addPlatform("key-hall", [178.55, 15.95, -13.15], [6.2, 0.9, 6.2], { material: "stone" });
    this.addPlatform("key-west", [182.6, 16.28, -17.2], [3.8, 0.52, 3.2], {
      material: "lift",
      moving: { axis: [0.24, 0, -0.26], range: 0.3, speed: 0.48, phase: 0.9 },
      ghost: true,
      ghostOpacity: 0.15
    });
    this.addPlatform("key-east", [182.6, 16.28, -9.1], [3.8, 0.52, 3.2], {
      material: "lift",
      moving: { axis: [-0.24, 0, 0.26], range: 0.3, speed: 0.5, phase: 1.9 },
      ghost: true,
      ghostOpacity: 0.15
    });
    this.addPlatform("key-helper-rail", [184.35, 16.45, -13.15], [7.3, 0.36, 2.25], {
      material: "bridge",
      ghost: true,
      ghostOpacity: 0.14,
      assistOnly: true
    });
    this.addPlatform("sky-lock-bridge", [186.3, 16.58, -13.15], [5.35, 0.42, 2.5], {
      material: "bridge",
      activeWhen: () => this.state.skyKey,
      ghost: true,
      ghostOpacity: 0.1
    });
    this.addPlatform("sky-keep", [190.5, 16.75, -13.15], [6.45, 1, 6.45], { material: "rune" });
    this.addPlatform("guardian-causeway", [195.0, 17.0, -13.15], [5.2, 0.42, 2.45], {
      material: "bridge",
      activeWhen: () => this.collected >= 21,
      ghost: true,
      ghostOpacity: 0.11
    });
    this.addPlatform("guardian-arena", [199.2, 17.15, -13.15], [7.05, 1, 7.05], { material: "stone" });
    this.addPlatform("portal-dais-bridge", [204.0, 17.42, -13.15], [5.35, 0.42, 2.45], {
      material: "bridge",
      activeWhen: () => this.state.guardian,
      ghost: true,
      ghostOpacity: 0.1
    });
    this.addPlatform("portal-dais", [208.35, 17.6, -13.15], [6.7, 1, 6.7], { material: "rune" });

    this.addSwitch("bridge", [0, 0.64, -8.2], "Lichtbruecke aktiv");
    this.addSwitch("lift", [8.4, 0.64, -6.75], "Runenlift aktiv");
    this.addSwitch("spire", [8.6, 0.64, 22.55], "Mondspitze geoeffnet");
    this.addSwitch("echo", [26.9, 3.64, 22.65], "Echo-Bruecke aktiv");
    this.addSwitch("crown", [43.2, 5.09, 20.2], "Aurora-Bruecke aktiv");
    this.addSwitch("eclipse", [66.0, 7.32, 7.1], "Eclipse-Schmiede offen");
    this.addTimeAnchor("dawn", [92.7, 9.52, -8.0], "Morgenanker", 0xf2c14e);
    this.addTimeAnchor("dusk", [92.85, 9.67, -0.6], "Daemmeranker", 0x9fd8ff);
    this.addMirrorBeacon("north", [114.2, 10.92, -8.3], "Nordspiegel", 0x9fd8ff);
    this.addMirrorBeacon("south", [114.2, 10.92, -0.2], "Suedspiegel", 0xf2c14e);
    this.addMirrorBeacon("core", [109.9, 10.48, -4.25], "Kernspiegel", 0x7fe1c0);
    this.addGravityWell("north", [135.25, 12.75, -7.55], 3.3, "Nordgravitation", 0x9fd8ff);
    this.addGravityWell("south", [135.45, 13.05, -0.95], 3.3, "Suedgravitation", 0xf2c14e);
    this.addRiftPair("temple", [153.1, 14.15, -4.25], [153.1, 15.45, -13.15], "Rissportal");
    this.addGlyphSeal("west", [162.0, 15.6, -17.1], "West-Glyphe", 0x9fd8ff);
    this.addGlyphSeal("east", [162.0, 15.6, -9.2], "Ost-Glyphe", 0xf2c14e);
    this.addGlyphSeal("core", [158.05, 15.28, -13.15], "Kern-Glyphe", 0x7fe1c0);
    this.addTreasureChest("hall", [178.55, 16.56, -13.15], "Hallen-Truhe", 0xf2c14e);
    this.addTreasureChest("west", [182.6, 16.86, -17.2], "West-Truhe", 0x9fd8ff);
    this.addTreasureChest("east", [182.6, 16.86, -9.1], "Ost-Truhe", 0x7fe1c0);
    this.addRelayNode("sun", [33.4, 3.66, 23.95], 0, "Sonnen-Relais", 0xf2c14e);
    this.addRelayNode("moon", [37.75, 4.42, 20.2], 1, "Mond-Relais", 0x9fd8ff);
    this.addRelayNode("crown", [43.2, 5.1, 18.45], 2, "Kronen-Relais", 0x7fe1c0);
    this.addBouncePad([-7.35, 0.64, 1.8]);
    this.addBouncePad([8.6, 0.64, 21.25]);
    this.addBouncePad([35.0, 3.64, 21.35]);
    this.addBouncePad([51.15, 6.39, 14.6]);
    this.addBouncePad([73.7, 8.2, 2.75]);
    this.addBouncePad([88.85, 9.02, -4.25]);
    this.addBouncePad([109.9, 10.52, -4.25]);
    this.addBouncePad([130.8, 11.78, -4.25]);
    this.addBouncePad([158.05, 15.28, -13.15]);
    this.addWindZone([37.4, 4.35, 21.1], 3.4, [1.1, 0, -0.3], "Rueckenwind");
    this.addWindZone([49.3, 6.1, 16.1], 3.8, [1.0, 0, -0.8], "Aurora-Schub");
    this.addWindZone([70.2, 7.9, 5.0], 3.6, [1.1, 0, -0.72], "Sternenstrom");
    this.addDriftField([94.9, 10.15, -4.25], 4.15, "Zeitdrift");
    this.addDriftField([116.2, 11.12, -4.25], 3.55, "Spiegeldrift");
    this.addShard("east", [8.4, 1.72, -8.2]);
    this.addShard("sky", [-12.05, 5.22, 1.8]);
    this.addShard("south", [0, 1.72, 14.55]);
    this.addShard("spire", [16.8, 4.45, 15.2]);
    this.addShard("moon", [18.3, 4.55, 22.65]);
    this.addShard("echo", [26.9, 4.72, 24.25]);
    this.addShard("relay-vault", [35.0, 5.02, 15.45]);
    this.addShard("sunrise", [43.2, 6.0, 20.2]);
    this.addShard("aurora", [51.15, 7.12, 14.6]);
    this.addShard("crown", [58.4, 8.02, 10.95]);
    this.addShard("eclipse", [66.0, 8.42, 7.1]);
    this.addShard("star-forge", [80.1, 9.72, 0.4]);
    this.addShard("chrono", [88.85, 10.12, -4.25]);
    this.addShard("zenith", [101.0, 11.22, -4.25]);
    this.addShard("mirror", [109.9, 11.58, -4.25]);
    this.addShard("astral", [122.0, 12.52, -4.25]);
    this.addShard("orrery", [130.8, 12.92, -4.25]);
    this.addShard("nebula", [144.45, 14.48, -4.25]);
    this.addShard("rift", [153.1, 16.12, -13.15]);
    this.addShard("sanctum", [169.95, 17.25, -13.15]);
    this.addShard("sky-keep", [190.5, 18.48, -13.15]);
    this.addShard("portal-dais", [208.35, 19.25, -13.15]);
    this.addHazard([-1.7, 0.72, 14.25], 0.78);
    this.addHazard([1.55, 0.72, 15.1], 0.68);
    this.addHazard([14.1, 3.04, 17.7], 0.58);
    this.addHazard([18.9, 4.25, 21.1], 0.64);
    this.addHazard([35.0, 3.72, 24.25], 0.58);
    this.addHazard([54.75, 7.0, 11.8], 0.52);
    this.addHazard([70.1, 7.92, 5.25], 0.5);
    this.addHazard([78.45, 8.72, 1.9], 0.5);
    this.addHazard([94.7, 10.05, -4.25], 0.48);
    this.addHazard([99.35, 10.23, -2.1], 0.5);
    this.addHazard([116.15, 11.05, -5.8], 0.48);
    this.addHazard([120.4, 11.48, -2.15], 0.5);
    this.addHazard([139.0, 13.05, -5.9], 0.48);
    this.addHazard([142.6, 13.4, -2.1], 0.5);
    this.addHazard([164.5, 15.9, -15.45], 0.48);
    this.addHazard([167.6, 16.05, -10.9], 0.5);
    this.addEnemyPatrol("echo-warden", [[24.7, 3.56, 21.25], [29.2, 3.56, 24.05]], {
      label: "Echo-Wache",
      speed: 0.98,
      activeWhen: () => this.collected >= 4
    });
    this.addEnemyPatrol("crown-warden", [[56.3, 6.9, 8.9], [60.35, 6.9, 12.75]], {
      label: "Kronen-Wache",
      speed: 0.92,
      activeWhen: () => this.collected >= 8
    });
    this.addEnemyPatrol("chrono-warden", [[87.0, 8.92, -6.25], [91.0, 8.92, -2.35]], {
      label: "Chrono-Wache",
      speed: 0.86,
      activeWhen: () => this.collected >= 12
    });
    this.addEnemyPatrol("mirror-warden", [[107.7, 10.42, -6.45], [112.2, 10.42, -2.2]], {
      label: "Spiegel-Wache",
      speed: 0.9,
      activeWhen: () => this.collected >= 14
    });
    this.addEnemyPatrol("sanctum-warden", [[156.2, 15.18, -15.35], [160.15, 15.18, -10.95]], {
      label: "Sanctum-Wache",
      speed: 0.82,
      radius: 0.7,
      activeWhen: () => this.collected >= 18
    });
    this.addEnemyPatrol("guardian-boss", [[197.35, 17.75, -15.55], [201.0, 17.75, -10.75], [201.35, 17.75, -15.45]], {
      label: "Runenwaechter",
      speed: 0.72,
      radius: 1.05,
      scale: 1.38,
      hitPoints: 3,
      defeatState: "guardian",
      activeWhen: () => this.state.skyKey && !this.state.guardian
    });
    this.addPortal();
    this.addGuideWisps();
    this.addSafetyNets();
    this.addRouteRails();
    this.addAuroraRibbons();
    this.addConstellationWeb();
    this.addEclipseHalo();
    this.addMirrorBeams();
    this.addGuideCompass();
    this.addDecor();
  }

  getBoxGeometry(size) {
    const key = `${size.x.toFixed(2)}:${size.y.toFixed(2)}:${size.z.toFixed(2)}`;
    if (!this.geometryCache.has(key)) {
      this.geometryCache.set(key, new THREE.BoxGeometry(size.x, size.y, size.z));
    }
    return this.geometryCache.get(key);
  }

  addPlatform(id, positionArray, sizeArray, options = {}) {
    const size = new THREE.Vector3(...sizeArray);
    const basePosition = new THREE.Vector3(...positionArray);
    const geometry = this.getBoxGeometry(size);
    const materialName = options.material ?? "stone";
    const needsUniqueMaterial = Boolean(options.ghost || options.assistOnly || materialName === "bridge");
    const material = needsUniqueMaterial ? this.materials[materialName].clone() : this.materials[materialName];
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(basePosition);
    mesh.castShadow = !this.performanceMode;
    mesh.receiveShadow = !this.performanceMode;

    let edges = null;
    const needsEdges = !this.performanceMode || materialName === "bridge";
    if (needsEdges) {
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: materialName === "bridge" ? 0xdcfff4 : 0xf4f0e7,
        transparent: true,
        opacity: materialName === "bridge" ? 0.32 : 0.1
      });
      edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
      edges.visible = true;
      mesh.add(edges);
    }
    this.scene.add(mesh);

    const platform = {
      id,
      mesh,
      edges,
      size,
      basePosition,
      position: basePosition.clone(),
      previousPosition: basePosition.clone(),
      delta: new THREE.Vector3(),
      moving: options.moving
        ? {
            axis: new THREE.Vector3(...options.moving.axis).normalize(),
            range: options.moving.range,
            speed: options.moving.speed,
            phase: options.moving.phase ?? 0
          }
        : null,
      activeWhen: options.activeWhen ?? null,
      ghost: Boolean(options.ghost),
      assistOnly: Boolean(options.assistOnly),
      supportWhenGhost: options.supportWhenGhost ?? true,
      active: true,
      solid: true,
      activeOpacity: material.opacity,
      ghostOpacity: Math.max(options.ghostOpacity ?? 0.18, 0.2)
    };
    this.platforms.push(platform);
    return platform;
  }

  addSwitch(id, positionArray, label) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.82, 0.16, this.performanceMode ? 16 : 32),
      this.materials.rune.clone()
    );
    base.castShadow = !this.performanceMode;
    base.receiveShadow = !this.performanceMode;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.035, 6, this.performanceMode ? 18 : 32),
      new THREE.MeshStandardMaterial({
        color: 0x7fe1c0,
        emissive: 0x235f54,
        emissiveIntensity: 0.65,
        roughness: 0.35
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    const light = this.performanceMode ? null : new THREE.PointLight(0x7fe1c0, 0.15, 5, 2);
    if (light) {
      light.position.y = 0.35;
      group.add(light);
    }
    group.add(base, ring);
    group.position.set(...positionArray);
    this.scene.add(group);

    this.switches.push({ id, label, group, ring, light, active: false });
  }

  addBouncePad(positionArray) {
    const group = new THREE.Group();
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.86, 0.92, 0.14, this.performanceMode ? 16 : 32),
      new THREE.MeshStandardMaterial({
        color: 0xf2c14e,
        emissive: 0x8e5c19,
        emissiveIntensity: 0.65,
        roughness: 0.32,
        metalness: 0.08
      })
    );
    disc.castShadow = !this.performanceMode;
    disc.receiveShadow = !this.performanceMode;
    const arrows = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 0.38, 4),
      new THREE.MeshStandardMaterial({
        color: 0xf4f0e7,
        emissive: 0xf2c14e,
        emissiveIntensity: 0.35,
        roughness: 0.38
      })
    );
    arrows.position.y = 0.34;
    arrows.rotation.y = Math.PI / 4;
    group.add(disc, arrows);
    group.position.set(...positionArray);
    this.scene.add(group);
    this.bouncePads.push({ group, cooldown: 0 });
  }

  addWindZone(positionArray, radius, directionArray, label) {
    const direction = new THREE.Vector3(...directionArray).normalize();
    this.windZones.push({
      position: new THREE.Vector3(...positionArray),
      radius,
      direction,
      label,
      cooldown: 0
    });
  }

  addDriftField(positionArray, radius, label) {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({
      color: 0x9fd8ff,
      transparent: true,
      opacity: this.performanceMode ? 0.14 : 0.24,
      depthWrite: false
    });
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0xf6d36d,
      transparent: true,
      opacity: this.performanceMode ? 0.12 : 0.2,
      depthWrite: false
    });
    const outer = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.025, 5, this.performanceMode ? 36 : 64),
      material
    );
    const inner = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.56, 0.02, 5, this.performanceMode ? 28 : 48),
      innerMaterial
    );
    outer.rotation.x = Math.PI / 2;
    inner.rotation.x = Math.PI / 2;
    group.add(outer, inner);
    group.position.set(...positionArray);
    this.scene.add(group);
    this.driftFields.push({ group, outer, inner, radius, label, cooldown: 0, baseY: positionArray[1] });
  }

  addRelayNode(id, positionArray, sequence, label, color) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.56, 0.18, this.performanceMode ? 12 : 24),
      this.materials.rune.clone()
    );
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.86 })
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.025, 5, this.performanceMode ? 16 : 28),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.48 })
    );
    ring.rotation.x = Math.PI / 2;
    core.position.y = 0.36;
    group.add(base, ring, core);
    group.position.set(...positionArray);
    this.scene.add(group);
    this.relayNodes.push({ id, sequence, label, color, group, ring, core, active: false, cooldown: 0 });
  }

  addTimeAnchor(id, positionArray, label, color) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.62, 0.16, this.performanceMode ? 12 : 24),
      this.materials.rune.clone()
    );
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 })
    );
    const upper = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.022, 5, this.performanceMode ? 18 : 30),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.46 })
    );
    const lower = upper.clone();
    upper.rotation.x = Math.PI / 2;
    lower.rotation.x = Math.PI / 2;
    upper.position.y = 0.42;
    lower.position.y = 0.2;
    core.position.y = 0.32;
    group.add(base, upper, lower, core);
    group.position.set(...positionArray);
    this.scene.add(group);
    this.timeAnchors.push({ id, label, color, group, upper, lower, core, active: false, cooldown: 0 });
  }

  addMirrorBeacon(id, positionArray, label, color) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.62, 0.14, this.performanceMode ? 12 : 24),
      this.materials.rune.clone()
    );
    const dish = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.12, 0.46),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.66
      })
    );
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.68 })
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.54, 0.022, 5, this.performanceMode ? 18 : 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.44 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.16;
    dish.position.y = 0.38;
    dish.rotation.y = id === "north" ? -0.55 : id === "south" ? 0.55 : 0;
    core.position.y = 0.66;
    group.add(base, ring, dish, core);
    group.position.set(...positionArray);
    this.scene.add(group);
    this.mirrorBeacons.push({ id, label, color, group, ring, dish, core, active: false, cooldown: 0 });
  }

  addMirrorBeams() {
    const focus = new THREE.Vector3(117.0, 12.0, -4.25);
    const finale = new THREE.Vector3(122.0, 12.35, -4.25);
    const positions = [];
    for (const beacon of this.mirrorBeacons) {
      positions.push(
        beacon.group.position.x,
        beacon.group.position.y + 0.55,
        beacon.group.position.z,
        focus.x,
        focus.y,
        focus.z
      );
    }
    positions.push(focus.x, focus.y, focus.z, finale.x, finale.y, finale.z);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    this.mirrorBeam = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: 0x9fd8ff,
        transparent: true,
        opacity: this.performanceMode ? 0.08 : 0.14,
        depthWrite: false
      })
    );
    this.scene.add(this.mirrorBeam);
  }

  addGravityWell(id, positionArray, radius, label, color) {
    const group = new THREE.Group();
    const outer = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.025, 5, this.performanceMode ? 34 : 58),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: this.performanceMode ? 0.12 : 0.2,
        depthWrite: false
      })
    );
    const vertical = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.62, 0.022, 5, this.performanceMode ? 30 : 48),
      new THREE.MeshBasicMaterial({
        color: 0x7fe1c0,
        transparent: true,
        opacity: this.performanceMode ? 0.11 : 0.18,
        depthWrite: false
      })
    );
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.3, 0),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 })
    );
    outer.rotation.x = Math.PI / 2;
    vertical.rotation.y = Math.PI / 2;
    group.add(outer, vertical, core);
    group.position.set(...positionArray);
    this.scene.add(group);
    this.gravityWells.push({ id, label, color, group, outer, vertical, core, radius, active: false, cooldown: 0, baseY: positionArray[1] });
  }

  addRiftPair(id, entryArray, exitArray, label) {
    const makeEnd = (positionArray, color, accent) => {
      const group = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.82, 0.055, 8, this.performanceMode ? 32 : 54),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: this.performanceMode ? 0.42 : 0.62,
          depthWrite: false
        })
      );
      const core = new THREE.Mesh(
        new THREE.CircleGeometry(0.68, this.performanceMode ? 24 : 40),
        new THREE.MeshBasicMaterial({
          color: accent,
          transparent: true,
          opacity: this.performanceMode ? 0.16 : 0.24,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      ring.rotation.x = Math.PI / 2;
      core.rotation.x = Math.PI / 2;
      group.add(ring, core);
      group.position.set(...positionArray);
      this.scene.add(group);
      return { group, ring, core };
    };
    const entry = makeEnd(entryArray, 0x45b7ff, 0x7fe1c0);
    const exit = makeEnd(exitArray, 0xf2c14e, 0xf07f5f);
    this.riftPairs.push({ id, label, entry, exit, cooldown: 0 });
  }

  addGlyphSeal(id, positionArray, label, color) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.64, 0.14, this.performanceMode ? 12 : 24),
      this.materials.rune.clone()
    );
    const glyph = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.026, 5, this.performanceMode ? 18 : 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.52 })
    );
    const core = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.24, 0),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 })
    );
    glyph.rotation.x = Math.PI / 2;
    glyph.position.y = 0.2;
    core.position.y = 0.42;
    group.add(base, glyph, core);
    group.position.set(...positionArray);
    this.scene.add(group);
    this.glyphSeals.push({ id, label, color, group, glyph, core, active: false, cooldown: 0 });
  }

  addShard(id, positionArray) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.48, 1),
      new THREE.MeshStandardMaterial({
        color: 0x7fe1c0,
        emissive: 0x37b995,
        emissiveIntensity: 1.35,
        roughness: 0.18,
        metalness: 0.18
      })
    );
    const halo = this.performanceMode
      ? null
      : new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.74, 1),
          new THREE.MeshBasicMaterial({
            color: 0xf2c14e,
            transparent: true,
            opacity: 0.16,
            wireframe: true
          })
        );
    const light = this.performanceMode ? null : new THREE.PointLight(0x7fe1c0, 1.25, 6, 2);
    group.add(core);
    if (halo) group.add(halo);
    if (light) group.add(light);
    group.position.set(...positionArray);
    this.scene.add(group);
    this.shards.push({ id, group, baseY: positionArray[1], collected: false });
  }

  addHazard(positionArray, radius) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, this.performanceMode ? 0 : 1),
      this.materials.hazard.clone()
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.05, 0.035, 6, this.performanceMode ? 24 : 36),
      new THREE.MeshBasicMaterial({ color: 0xf07f5f, transparent: true, opacity: 0.52 })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(core, ring);
    group.position.set(...positionArray);
    this.scene.add(group);
    this.hazards.push({ group, radius });
  }

  addTreasureChest(id, positionArray, label, color) {
    const group = new THREE.Group();
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a4a28,
      emissive: 0x21140a,
      emissiveIntensity: 0.22,
      roughness: 0.54,
      metalness: 0.08
    });
    const trimMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.42,
      roughness: 0.28,
      metalness: 0.18
    });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.44, 0.64), baseMaterial);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.18, 0.68), baseMaterial.clone());
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.08), trimMaterial.clone());
    const glow = new THREE.Mesh(
      new THREE.TorusGeometry(0.56, 0.022, 5, this.performanceMode ? 18 : 30),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: this.performanceMode ? 0.24 : 0.38,
        depthWrite: false
      })
    );
    base.position.y = 0.22;
    lid.position.y = 0.56;
    lid.userData.closedY = lid.position.y;
    lock.position.set(0, 0.42, -0.36);
    glow.position.y = 0.08;
    glow.rotation.x = Math.PI / 2;
    group.add(base, lid, lock, glow);
    group.position.set(...positionArray);
    this.scene.add(group);
    this.treasureChests.push({ id, label, color, group, lid, lock, glow, opened: false, cooldown: 0 });
  }

  addEnemyPatrol(id, patrolPointsArray, options = {}) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 0.5, this.performanceMode ? 4 : 6, this.performanceMode ? 8 : 12),
      this.materials.enemy.clone()
    );
    body.position.y = 0.66;
    body.castShadow = !this.performanceMode;

    const helm = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.2, 0.52),
      this.materials.enemyAccent.clone()
    );
    helm.position.y = 1.1;

    const shield = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.4, 0.11, 6),
      new THREE.MeshStandardMaterial({
        color: 0xf2c14e,
        emissive: 0x6f4213,
        emissiveIntensity: 0.5,
        roughness: 0.38,
        metalness: 0.18
      })
    );
    shield.position.set(0, 0.68, -0.36);
    shield.rotation.x = Math.PI / 2;

    const eye = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.08, 0.055),
      new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.88 })
    );
    eye.position.set(0, 1.12, -0.29);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.025, 5, this.performanceMode ? 18 : 30),
      new THREE.MeshBasicMaterial({
        color: 0xf07f5f,
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;

    group.add(body, helm, shield, eye, ring);
    const path = patrolPointsArray.map((point) => new THREE.Vector3(...point));
    group.position.copy(path[0]);
    group.scale.setScalar(options.scale ?? 1);
    group.visible = options.activeWhen ? Boolean(options.activeWhen()) : true;
    this.scene.add(group);

    this.enemies.push({
      id,
      label: options.label ?? "Tempel-Wache",
      group,
      body,
      helm,
      shield,
      eye,
      ring,
      path,
      speed: options.speed ?? 0.9,
      radius: options.radius ?? 0.64,
      activeWhen: options.activeWhen ?? null,
      active: group.visible,
      targetIndex: path.length > 1 ? 1 : 0,
      direction: 1,
      cooldown: 0,
      disabledTimer: 0,
      hitPoints: options.hitPoints ?? null,
      hits: 0,
      defeatState: options.defeatState ?? null,
      defeated: false,
      baseScale: options.scale ?? 1,
      velocity: new THREE.Vector3(),
      lastPosition: path[0].clone()
    });
  }

  addGuideWisps() {
    const path = [
      [0, 1.08, -2.8], [0, 1.08, -5.8], [1.9, 1.08, -8.2], [5.0, 1.08, -8.2],
      [8.4, 1.08, -8.2], [5.6, 1.08, -3.4], [0, 1.08, 2.8], [-4.1, 1.08, 1.8],
      [-7.35, 1.08, 1.8], [-9.8, 2.7, 1.8], [-10.95, 3.8, 1.8], [-12.05, 4.58, 1.8],
      [0, 1.08, 5.0], [0, 1.08, 10.2], [0, 1.08, 14.55], [0, 1.08, 20.2],
      [8.6, 1.08, 22.55], [12.4, 1.95, 19.6], [15.35, 3.45, 16.4], [16.8, 4.0, 15.2],
      [18.3, 4.0, 22.65], [22.8, 4.0, 22.65], [26.9, 4.0, 22.65], [31.0, 4.0, 22.65],
      [35.0, 4.0, 22.65], [35.0, 4.35, 19.15], [35.0, 4.55, 15.45],
      [37.75, 4.78, 20.2], [40.35, 5.38, 20.2], [43.2, 5.5, 20.2],
      [47.6, 5.8, 17.65], [51.15, 6.8, 14.6], [54.85, 7.25, 11.8], [58.4, 7.5, 10.95],
      [62.25, 7.45, 9.1], [66.0, 8.0, 7.1], [70.25, 8.25, 5.2], [73.7, 8.75, 2.75],
      [76.85, 9.0, 1.45], [80.1, 9.25, 0.4], [84.65, 9.15, -1.8],
      [88.85, 9.55, -4.25], [92.7, 10.08, -8.0], [92.85, 10.22, -0.6],
      [97.0, 10.2, -4.25], [101.0, 10.65, -4.25], [105.45, 10.75, -4.25],
      [109.9, 11.0, -4.25], [114.2, 11.35, -8.3], [114.2, 11.35, -0.2],
      [117.95, 11.68, -4.25], [122.0, 11.95, -4.25], [126.45, 11.92, -4.25],
      [130.8, 12.25, -4.25], [135.25, 12.82, -7.55], [135.45, 13.15, -0.95],
      [140.3, 13.38, -4.25], [144.45, 13.62, -4.25], [148.9, 14.0, -4.25],
      [153.1, 14.7, -4.25], [153.1, 16.0, -13.15], [158.05, 15.7, -13.15],
      [162.0, 16.0, -17.1], [162.0, 16.0, -9.2], [165.75, 16.35, -13.15],
      [169.95, 16.85, -13.15], [174.35, 16.75, -13.15], [178.55, 16.95, -13.15],
      [182.6, 17.35, -17.2], [182.6, 17.35, -9.1], [186.3, 17.45, -13.15],
      [190.5, 17.85, -13.15], [195.0, 18.05, -13.15], [199.2, 18.22, -13.15],
      [204.0, 18.55, -13.15], [208.35, 18.95, -13.15]
    ];
    const geometry = new THREE.OctahedronGeometry(0.16, 0);
    const material = new THREE.MeshBasicMaterial({
      color: 0x9ff5d8,
      transparent: true,
      opacity: 0.72
    });
    this.guideWispMesh = new THREE.InstancedMesh(geometry, material, path.length);
    path.forEach((position, index) => {
      this.guideWisps.push({ position: new THREE.Vector3(...position), baseY: position[1], phase: index * 0.7 });
      this.wispDummy.position.set(...position);
      this.wispDummy.rotation.set(0, index * 0.6, 0);
      this.wispDummy.updateMatrix();
      this.guideWispMesh.setMatrixAt(index, this.wispDummy.matrix);
    });
    this.guideWispMesh.instanceMatrix.needsUpdate = true;
    this.guideWispMesh.visible = this.assistMode;
    this.scene.add(this.guideWispMesh);
  }

  addSafetyNets() {
    const material = new THREE.MeshBasicMaterial({
      color: 0x7fe1c0,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const nets = [
      [[0, -0.82, -4.1], [5.8, 4.6]],
      [[4.7, -0.82, -8.2], [7.2, 3.2]],
      [[-6.9, -0.82, 1.8], [7.4, 3.2]],
      [[0, -0.82, 10.0], [4.6, 9.0]],
      [[5.9, -0.82, 22.55], [10.4, 3.4]],
      [[15.1, 2.2, 18.7], [10.8, 5.2]],
      [[29.4, 2.18, 22.65], [9.8, 4.4]],
      [[39.8, 3.6, 21.2], [9.2, 4.6]],
      [[50.3, 4.2, 15.2], [9.8, 5.4]],
      [[56.7, 5.15, 11.5], [8.6, 4.6]],
      [[66.7, 5.72, 6.35], [10.8, 5.0]],
      [[77.2, 6.72, 1.25], [11.0, 4.8]],
      [[90.6, 7.0, -4.25], [12.0, 8.2]],
      [[99.2, 8.0, -4.25], [10.4, 5.2]],
      [[111.4, 8.18, -4.25], [13.0, 8.4]],
      [[120.2, 9.05, -4.25], [10.2, 5.4]],
      [[133.6, 9.7, -4.25], [13.6, 8.8]],
      [[142.4, 10.42, -4.25], [10.8, 5.6]],
      [[156.0, 11.5, -8.8], [11.8, 9.0]],
      [[166.6, 13.0, -13.15], [10.6, 5.8]],
      [[181.0, 13.4, -13.15], [12.8, 9.6]],
      [[195.8, 14.2, -13.15], [14.4, 7.4]],
      [[207.0, 14.6, -13.15], [10.8, 5.8]]
    ];

    const dummy = new THREE.Object3D();
    const netMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1, 1, 1), material, nets.length);
    nets.forEach(([position, size], index) => {
      dummy.position.set(...position);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(size[0], size[1], 1);
      dummy.updateMatrix();
      netMesh.setMatrixAt(index, dummy.matrix);
    });
    netMesh.instanceMatrix.needsUpdate = true;
    netMesh.visible = this.assistMode;
    this.scene.add(netMesh);
    this.safetyNets.push(netMesh);
  }

  addRouteRails() {
    const route = [
      [0, 0.72, 0], [0, 0.72, -8.2], [8.4, 0.72, -8.2], [0, 0.72, 14.55],
      [0, 0.72, 22.55], [8.6, 0.72, 22.55], [16.8, 3.7, 15.2], [18.3, 3.7, 22.65],
      [26.9, 3.7, 22.65], [35.0, 3.7, 22.65], [43.2, 5.15, 20.2],
      [51.15, 6.45, 14.6], [58.4, 7.05, 10.95], [66.0, 7.5, 7.1],
      [73.7, 8.35, 2.75], [80.1, 8.8, 0.4], [88.85, 9.05, -4.25],
      [92.7, 9.7, -8.0], [92.85, 9.85, -0.6], [101.0, 10.15, -4.25],
      [109.9, 10.58, -4.25], [114.2, 11.0, -8.3], [114.2, 11.0, -0.2],
      [122.0, 11.4, -4.25], [130.8, 11.95, -4.25], [135.25, 12.4, -7.55],
      [135.45, 12.8, -0.95], [144.45, 13.42, -4.25], [153.1, 14.2, -4.25],
      [153.1, 15.42, -13.15], [158.05, 15.28, -13.15], [162.0, 15.88, -17.1],
      [162.0, 15.88, -9.2], [169.95, 16.5, -13.15], [178.55, 16.55, -13.15],
      [182.6, 16.95, -17.2], [182.6, 16.95, -9.1], [190.5, 17.35, -13.15],
      [199.2, 17.78, -13.15], [208.35, 18.25, -13.15]
    ];
    const positions = [];
    for (let i = 0; i < route.length - 1; i += 1) {
      positions.push(...route[i], ...route[i + 1]);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: 0xf6d36d,
      transparent: true,
      opacity: this.performanceMode ? 0.08 : 0.18,
      depthWrite: false
    });
    this.routeRail = new THREE.LineSegments(geometry, material);
    this.scene.add(this.routeRail);
  }

  addAuroraRibbons() {
    const ribbonCount = this.performanceMode ? 1 : 3;
    const colors = [0x7fe1c0, 0xf2c14e, 0xa8d8ff, 0xf4f0e7];
    for (let i = 0; i < ribbonCount; i += 1) {
      const ribbon = new THREE.Mesh(
        new THREE.PlaneGeometry(22 - i * 2.4, 1.9 + i * 0.28, 1, 1),
        new THREE.MeshBasicMaterial({
          color: colors[i],
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      ribbon.position.set(49.5 + i * 2.2, 11.8 + i * 0.55, 9.6 - i * 1.25);
      ribbon.rotation.set(-0.38 + i * 0.04, 0.7 - i * 0.08, 0.12 + i * 0.1);
      this.scene.add(ribbon);
      this.auroraRibbons.push({ mesh: ribbon, baseY: ribbon.position.y, phase: i * 0.7 });
    }
  }

  addConstellationWeb() {
    const anchors = [
      [-4, 12.2, -12], [6, 13.4, -10], [13, 12.6, -2], [22, 13.8, 8],
      [34, 14.5, 18], [46, 13.2, 15], [57, 14.2, 9], [42, 15.1, 25],
      [68, 15.4, 5], [80, 16.0, 0], [91, 16.4, -6], [102, 15.8, -4],
      [113, 16.5, -8], [123, 15.9, -4], [134, 16.6, -8], [145, 16.1, -4],
      [156, 17.1, -11], [170, 17.5, -13], [182, 18.0, -17], [190, 18.4, -13],
      [199, 19.0, -16], [208, 19.5, -13]
    ];
    const linePositions = [];
    for (let i = 0; i < anchors.length - 1; i += 1) {
      linePositions.push(...anchors[i], ...anchors[i + 1]);
    }
    linePositions.push(...anchors[2], ...anchors[5], ...anchors[4], ...anchors[7]);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    this.constellationLines = new THREE.LineSegments(
      lineGeometry,
      new THREE.LineBasicMaterial({
        color: 0x9ff5d8,
        transparent: true,
        opacity: this.performanceMode ? 0.13 : 0.24,
        depthWrite: false
      })
    );
    this.scene.add(this.constellationLines);

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute("position", new THREE.Float32BufferAttribute(anchors.flat(), 3));
    this.constellationPoints = new THREE.Points(
      pointGeometry,
      new THREE.PointsMaterial({
        color: 0xf6d36d,
        size: this.performanceMode ? 0.12 : 0.18,
        transparent: true,
        opacity: 0.78,
        depthWrite: false
      })
    );
    this.scene.add(this.constellationPoints);
  }

  addEclipseHalo() {
    const centers = [
      { position: [66.0, 10.8, 7.1], scale: 0.86, phase: 0.2 },
      { position: [80.1, 12.25, 0.4], scale: 1.08, phase: 1.4 }
    ];
    for (const center of centers) {
      const group = new THREE.Group();
      const outer = new THREE.Mesh(
        new THREE.TorusGeometry(2.2 * center.scale, 0.035, 6, this.performanceMode ? 34 : 58),
        new THREE.MeshBasicMaterial({
          color: 0xf6d36d,
          transparent: true,
          opacity: this.performanceMode ? 0.14 : 0.24,
          depthWrite: false
        })
      );
      const inner = new THREE.Mesh(
        new THREE.TorusGeometry(1.34 * center.scale, 0.028, 6, this.performanceMode ? 30 : 48),
        new THREE.MeshBasicMaterial({
          color: 0x7fe1c0,
          transparent: true,
          opacity: this.performanceMode ? 0.16 : 0.28,
          depthWrite: false
        })
      );
      outer.rotation.x = Math.PI / 2;
      inner.rotation.x = Math.PI / 2;
      inner.rotation.y = Math.PI / 8;
      group.add(outer, inner);
      group.position.set(...center.position);
      this.scene.add(group);
      this.eclipseGates.push({ group, outer, inner, baseY: center.position[1], phase: center.phase });
    }
  }

  addGuideCompass() {
    this.compassGroup = new THREE.Group();
    const compassMaterial = new THREE.MeshBasicMaterial({
      color: 0xf6d36d,
      transparent: true,
      opacity: 0.82,
      depthWrite: false
    });
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x7fe1c0,
      transparent: true,
      opacity: 0.48,
      depthWrite: false
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.024, 6, 34), ringMaterial);
    ring.rotation.x = Math.PI / 2;
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.48, 3), compassMaterial);
    arrow.rotation.x = Math.PI / 2;
    arrow.position.z = 0.34;
    this.compassGroup.add(ring, arrow);
    this.compassGroup.visible = false;
    this.scene.add(this.compassGroup);
    this.compassMaterials = [compassMaterial, ringMaterial];

    this.checkpointBeacon = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.025, 6, 38),
      new THREE.MeshBasicMaterial({
        color: 0x7fe1c0,
        transparent: true,
        opacity: 0.34,
        depthWrite: false
      })
    );
    this.checkpointBeacon.rotation.x = Math.PI / 2;
    this.checkpointBeacon.visible = false;
    this.scene.add(this.checkpointBeacon);
  }

  addPortal() {
    this.portal = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.18, 0.12, 18, 72),
      this.materials.portal.clone()
    );
    const inner = new THREE.Mesh(
      new THREE.CircleGeometry(1.02, 48),
      new THREE.MeshBasicMaterial({
        color: 0x7fe1c0,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide
      })
    );
    const light = this.performanceMode ? new THREE.Object3D() : new THREE.PointLight(0xf2c14e, 1.2, 9, 1.8);
    light.position.z = -0.3;
    light.intensity = this.performanceMode ? 0 : 1.2;
    this.portal.add(ring, inner, light);
    this.portal.position.set(208.35, 19.05, -13.15);
    this.scene.add(this.portal);
  }

  addDecor() {
    const pillarGeometry = new THREE.CylinderGeometry(0.23, 0.31, 2.6, 10);
    const rockGeometry = new THREE.DodecahedronGeometry(0.5, 0);
    const crystalGeometry = new THREE.OctahedronGeometry(0.34, 0);
    const pillarMaterial = this.materials.stone.clone();
    const rockMaterial = this.materials.moss.clone();
    const crystalMaterial = new THREE.MeshStandardMaterial({
      color: 0x7fe1c0,
      emissive: 0x23836f,
      emissiveIntensity: 0.5,
      roughness: 0.34,
      metalness: 0.08
    });

    const corners = [
      [-2.4, 1.7, -10.2], [2.4, 1.7, -10.2], [10.2, 1.7, -10], [6.6, 1.7, -6.4],
      [-13.8, 5.7, -0.2], [-10.3, 5.7, 3.8], [-2.1, 1.7, 24.8], [2.1, 1.7, 24.8],
      [7.0, 1.7, 24.6], [10.1, 1.7, 20.4], [16.2, 5.0, 13.4], [20.1, 5.0, 24.9],
      [25.0, 4.7, 25.6], [29.5, 4.7, 20.2], [41.3, 6.1, 17.7], [45.3, 6.1, 23.0],
      [50.0, 7.4, 12.5], [53.5, 7.9, 16.0], [56.0, 8.4, 8.3], [60.9, 8.4, 13.4],
      [63.8, 8.7, 11.1], [68.6, 8.95, 4.1], [77.4, 10.0, -2.3], [82.9, 10.0, 3.1],
      [86.4, 10.3, -7.6], [91.6, 10.8, -10.2], [98.3, 11.7, -8.0], [103.7, 11.7, -1.6],
      [107.0, 11.85, -8.0], [113.4, 12.3, -11.0], [118.6, 12.4, -0.4], [125.1, 12.45, -7.0],
      [128.0, 13.15, -8.6], [136.6, 13.5, -10.4], [140.2, 14.1, -0.3], [147.3, 14.35, -7.1],
      [151.0, 15.2, -1.5], [156.0, 16.6, -16.4], [165.2, 17.3, -18.4], [173.2, 17.4, -9.0],
      [176.4, 17.8, -16.8], [181.4, 18.1, -20.0], [186.2, 18.4, -7.0], [192.8, 18.9, -17.2],
      [201.8, 19.3, -9.0], [211.5, 19.5, -16.0]
    ];
    const dummy = new THREE.Object3D();
    const pillars = new THREE.InstancedMesh(pillarGeometry, pillarMaterial, corners.length);
    corners.forEach((position, index) => {
      dummy.position.set(...position);
      dummy.rotation.set(0, index % 2 ? 0.08 : -0.06, 0);
      dummy.scale.setScalar(index > 7 ? 1.12 : 1);
      dummy.updateMatrix();
      pillars.setMatrixAt(index, dummy.matrix);
    });
    pillars.instanceMatrix.needsUpdate = true;
    pillars.castShadow = !this.performanceMode;
    pillars.receiveShadow = true;
    this.scene.add(pillars);

    const random = seededRandom(216);
    const rockCount = this.performanceMode ? 14 : 30;
    const rocks = new THREE.InstancedMesh(rockGeometry, rockMaterial, rockCount);
    for (let i = 0; i < rockCount; i += 1) {
      dummy.position.set((random() - 0.5) * 44, -3.8 - random() * 5, (random() - 0.05) * 56);
      dummy.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
      const scale = 0.35 + random() * 1.4;
      dummy.scale.set(scale, scale * (0.6 + random() * 0.7), scale);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
    }
    rocks.instanceMatrix.needsUpdate = true;
    rocks.receiveShadow = true;
    this.scene.add(rocks);

    const crystalAnchors = [
      [-2.8, 0.78, -2.2], [2.6, 0.78, 2.4], [9.9, 0.78, -10.3], [-12.9, 4.82, 3.8],
      [1.9, 0.78, 16.8], [7.3, 0.78, 20.9], [12.7, 1.94, 19.2], [18.8, 4.38, 24.8],
      [27.7, 3.78, 24.9], [36.6, 3.78, 24.6], [43.6, 5.22, 22.7],
      [50.0, 6.48, 12.9], [56.0, 7.06, 8.8], [60.3, 7.06, 12.8],
      [66.8, 7.5, 9.3], [73.1, 8.42, 0.8], [80.8, 8.7, -2.4],
      [88.1, 9.12, -7.0], [96.8, 10.08, -1.4], [102.4, 10.2, -7.0],
      [110.6, 10.55, -8.4], [116.2, 11.05, -1.0], [123.2, 11.05, -6.8],
      [131.1, 11.7, -7.6], [139.5, 13.0, -1.0], [145.2, 13.08, -7.2],
      [154.0, 14.05, -6.4], [160.6, 15.75, -16.2], [170.4, 16.05, -16.6],
      [178.7, 16.58, -10.5], [183.2, 16.88, -18.8], [190.6, 17.35, -10.0],
      [199.4, 17.8, -17.0], [208.7, 18.15, -10.4]
    ];
    const crystals = new THREE.InstancedMesh(crystalGeometry, crystalMaterial, crystalAnchors.length * 3);
    let instance = 0;
    for (const anchor of crystalAnchors) {
      for (let i = 0; i < 3; i += 1) {
        dummy.position.set(anchor[0] + (i - 1) * 0.28, anchor[1] + i * 0.08, anchor[2] + (random() - 0.5) * 0.42);
        dummy.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
        const scale = 0.45 + random() * 0.32;
        dummy.scale.set(scale * 0.75, scale, scale * 0.75);
        dummy.updateMatrix();
        crystals.setMatrixAt(instance, dummy.matrix);
        instance += 1;
      }
    }
    crystals.instanceMatrix.needsUpdate = true;
    this.scene.add(crystals);
  }

  createPlayer() {
    this.playerGroup = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.34, 0.58, 8, 18),
      this.materials.player.clone()
    );
    body.position.y = 0.03;
    body.castShadow = !this.performanceMode;
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.11, 0.08),
      this.materials.playerAccent.clone()
    );
    visor.position.set(0, 0.32, -0.32);
    const pack = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      this.materials.playerAccent.clone()
    );
    pack.position.set(0, 0.1, 0.39);
    this.playerGroup.add(body, visor, pack);
    this.scene.add(this.playerGroup);
    this.syncPlayerMesh();
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (event) => {
      this.keys.add(event.code);
      if (event.code === "Space") {
        event.preventDefault();
        this.requestJump();
      }
      if (event.code === "KeyR") {
        this.resetPlayer("Zur letzten Plattform");
      }
      if (event.code === "KeyM") {
        this.audio.toggle();
      }
      if (event.code === "KeyF") {
        this.toggleFullscreen();
      }
      if (event.code === "KeyH") {
        this.setAssistMode(!this.assistMode, true);
      }
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));

    this.startButton.addEventListener("click", () => {
      this.startRun();
    });
    this.againButton.addEventListener("click", () => {
      this.finishScreen.classList.remove("active");
      this.startRun();
    });
    this.assistButton.addEventListener("click", () => {
      this.setAssistMode(!this.assistMode, true);
    });
    this.qualityButton.addEventListener("click", () => {
      this.setQualityMode(!this.turboMode);
    });
    this.fullscreenButton.addEventListener("click", () => {
      this.toggleFullscreen();
    });
    this.jumpButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.requestJump();
    });
    this.assistModeButton.addEventListener("click", () => {
      this.setAssistMode(true, true);
    });
    this.normalModeButton.addEventListener("click", () => {
      this.setAssistMode(false, true);
    });

    this.shell.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) return;
      this.touch.active = true;
      this.touch.id = event.pointerId;
      this.touch.startX = event.clientX;
      this.touch.startY = event.clientY;
      this.touch.x = event.clientX;
      this.touch.y = event.clientY;
      this.touch.swipeConsumed = false;
      this.touch.vector.set(0, 0);
      this.touchRing.style.left = `${event.clientX}px`;
      this.touchRing.style.top = `${event.clientY}px`;
      this.touchRing.classList.add("active");
      this.shell.setPointerCapture?.(event.pointerId);
    });

    this.shell.addEventListener("pointermove", (event) => {
      if (!this.touch.active || event.pointerId !== this.touch.id) return;
      this.touch.x = event.clientX;
      this.touch.y = event.clientY;
      const dx = event.clientX - this.touch.startX;
      const dy = event.clientY - this.touch.startY;
      this.touch.vector.set(clamp(dx / 74, -1, 1), clamp(dy / 74, -1, 1));
      this.touchRing.style.left = `${this.touch.startX + dx * 0.22}px`;
      this.touchRing.style.top = `${this.touch.startY + dy * 0.22}px`;

      const swipeDistance = Math.hypot(dx, dy);
      if (!this.touch.swipeConsumed && swipeDistance > 56) {
        if (dy < -48 && Math.abs(dy) > Math.abs(dx) * 1.12) {
          this.touch.swipeConsumed = true;
          this.requestJump();
        }
        if (dy > 78 && Math.abs(dy) > Math.abs(dx) * 1.18) {
          this.touch.swipeConsumed = true;
          this.resetPlayer("Zur letzten Plattform");
        }
      }
    });

    const clearTouch = (event) => {
      if (event.pointerId !== this.touch.id) return;
      this.touch.active = false;
      this.touch.id = null;
      this.touch.vector.set(0, 0);
      this.touchRing.classList.remove("active");
    };
    this.shell.addEventListener("pointerup", clearTouch);
    this.shell.addEventListener("pointercancel", clearTouch);
    document.addEventListener("fullscreenchange", () => this.updateFullscreenUi());
    document.addEventListener("webkitfullscreenchange", () => this.updateFullscreenUi());
  }

  setAssistMode(enabled, announce = false) {
    if (this.assistMode === enabled && this.assist.name === (enabled ? "Assist" : "Normal")) return;
    this.assistMode = enabled;
    this.assist = { ...(enabled ? this.assistProfiles.assist : this.assistProfiles.normal) };
    this.player.jumpsRemaining = Math.min(this.player.jumpsRemaining, this.assist.maxJumps);
    this.updateModeUi();
    this.updateAssistVisibility();
    this.platforms.forEach((platform) => {
      platform.cachedVisible = undefined;
      platform.cachedSolid = undefined;
      platform.cachedOpacity = undefined;
    });
    if (this.running && !enabled && this.player.currentPlatform?.assistOnly) {
      this.recoverPlayer("Normal: Hauptpfad");
    } else if (announce) {
      this.showToast(`${this.assist.name}-Modus aktiv`);
    }
    this.hudState.objective = "";
    this.hudState.level = "";
  }

  updateModeUi() {
    this.assistButton.textContent = this.assistMode ? "Assist" : "Normal";
    this.assistButton.setAttribute("aria-pressed", String(this.assistMode));
    this.assistModeButton.classList.toggle("active", this.assistMode);
    this.normalModeButton.classList.toggle("active", !this.assistMode);
    this.assistModeButton.setAttribute("aria-pressed", String(this.assistMode));
    this.normalModeButton.setAttribute("aria-pressed", String(!this.assistMode));
  }

  setQualityMode(turbo) {
    this.turboMode = turbo;
    try {
      localStorage.setItem("runeLiftQuality", turbo ? "turbo" : "fx");
    } catch {}
    this.showToast(turbo ? "Turbo-Modus aktiv" : "FX-Modus laedt neu");
    window.setTimeout(() => window.location.reload(), 180);
  }

  updateQualityUi() {
    const forced = this.basePerformanceMode && !this.turboMode;
    this.qualityButton.textContent = this.performanceMode ? "T" : "FX";
    this.qualityButton.setAttribute("aria-pressed", String(this.performanceMode));
    this.qualityButton.setAttribute(
      "aria-label",
      forced ? "Turbo-Modus wegen Geraet aktiv" : "Turbo-Modus umschalten"
    );
  }

  getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  async toggleFullscreen() {
    try {
      if (this.getFullscreenElement()) {
        const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
        if (!exitFullscreen) throw new Error("Fullscreen exit unavailable");
        await exitFullscreen.call(document);
      } else {
        const requestFullscreen = this.shell.requestFullscreen || this.shell.webkitRequestFullscreen;
        if (!requestFullscreen) throw new Error("Fullscreen request unavailable");
        await requestFullscreen.call(this.shell);
      }
    } catch {
      this.showToast("Vollbild nicht verfuegbar");
    }
    this.updateFullscreenUi();
    window.setTimeout(() => this.resize(), 120);
  }

  updateFullscreenUi() {
    const active = Boolean(this.getFullscreenElement());
    this.fullscreenButton.textContent = active ? "X" : "F";
    this.fullscreenButton.setAttribute("aria-pressed", String(active));
    this.fullscreenButton.setAttribute(
      "aria-label",
      active ? "Vollbild beenden" : "Vollbild umschalten"
    );
  }

  updateAssistVisibility() {
    if (this.guideWispMesh) this.guideWispMesh.visible = this.assistMode;
    for (const net of this.safetyNets) {
      net.visible = this.assistMode;
    }
  }

  resize() {
    const width = this.shell.clientWidth;
    const height = this.shell.clientHeight;
    const compact = width < 760;
    const cap = this.framePressure.qualityReduced ? (compact ? 0.5 : 0.68) : compact ? 0.78 : 0.95;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  startRun() {
    this.running = true;
    this.finished = false;
    this.collected = 0;
    Object.keys(this.state).forEach((key) => {
      this.state[key] = false;
    });
    this.relayIndex = 0;
    this.hudState.objective = "";
    this.hudState.count = "";
    this.hudState.level = "";
    this.runStartedAt = performance.now();
    this.startScreen.classList.remove("active");
    this.finishScreen.classList.remove("active");
    this.player.position.set(0, 1.42, 0);
    this.player.velocity.set(0, 0, 0);
    this.player.checkpoint.set(0, 1.42, 0);
    this.player.grounded = false;
    this.player.currentPlatform = null;
    this.player.coyoteTimer = 0;
    this.player.jumpBufferTimer = 0;
    this.player.jumpsRemaining = this.assist.maxJumps;
    this.switches.forEach((switchPlate) => {
      switchPlate.active = false;
      if (switchPlate.light) switchPlate.light.intensity = 0.15;
    });
    this.relayNodes.forEach((node) => {
      node.active = false;
      node.cooldown = 0;
      node.core.material.opacity = 0.86;
      node.group.scale.setScalar(1);
    });
    this.timeAnchors.forEach((anchor) => {
      anchor.active = false;
      anchor.cooldown = 0;
      anchor.core.material.opacity = 0.72;
      anchor.group.scale.setScalar(1);
    });
    this.mirrorBeacons.forEach((beacon) => {
      beacon.active = false;
      beacon.cooldown = 0;
      beacon.core.material.opacity = 0.68;
      beacon.dish.material.opacity = 0.66;
      beacon.group.scale.setScalar(1);
    });
    this.gravityWells.forEach((well) => {
      well.active = false;
      well.cooldown = 0;
      well.core.material.opacity = 0.72;
      well.group.scale.setScalar(1);
    });
    this.glyphSeals.forEach((seal) => {
      seal.active = false;
      seal.cooldown = 0;
      seal.core.material.opacity = 0.72;
      seal.glyph.material.opacity = 0.52;
      seal.group.scale.setScalar(1);
    });
    this.riftPairs.forEach((pair) => {
      pair.cooldown = 0;
    });
    this.treasureChests.forEach((chest) => {
      chest.opened = false;
      chest.cooldown = 0;
      chest.lid.rotation.x = 0;
      chest.lid.position.y = chest.lid.userData.closedY;
      chest.lock.visible = true;
      chest.glow.material.opacity = this.performanceMode ? 0.24 : 0.38;
      chest.group.scale.setScalar(1);
    });
    this.enemies.forEach((enemy) => {
      enemy.group.position.copy(enemy.path[0]);
      enemy.lastPosition.copy(enemy.path[0]);
      enemy.targetIndex = enemy.path.length > 1 ? 1 : 0;
      enemy.direction = 1;
      enemy.cooldown = 0;
      enemy.disabledTimer = 0;
      enemy.hits = 0;
      enemy.defeated = false;
      enemy.active = enemy.activeWhen ? Boolean(enemy.activeWhen()) : true;
      enemy.group.visible = enemy.active;
      enemy.group.scale.setScalar(enemy.baseScale);
    });
    this.shards.forEach((shard) => {
      shard.collected = false;
      shard.group.visible = true;
    });
    this.audio.unlock();
    this.showToast(`${this.assist.name}-Modus gestartet`);
  }

  requestJump() {
    this.jumpQueued = true;
    this.player.jumpBufferTimer = this.assist.jumpBufferTime;
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.033);
    this.elapsed += dt;
    this.monitorPerformance(dt);
    this.updatePlatforms();
    this.updateEnemies(dt);
    if (this.running && !this.finished) {
      this.updatePlayer(dt);
      this.checkMechanics(dt);
    }
    this.animateScene(dt);
    this.updateCamera(dt);
    this.updateHud();
    this.renderer.render(this.scene, this.camera);
  }

  monitorPerformance(dt) {
    if (this.framePressure.qualityReduced) return;
    if (dt > 0.024) {
      this.framePressure.slowTime += dt;
    } else {
      this.framePressure.slowTime = Math.max(0, this.framePressure.slowTime - dt * 0.5);
    }
    if (this.framePressure.slowTime > 0.75) {
      this.applyAdaptiveQuality();
    }
  }

  applyAdaptiveQuality() {
    this.framePressure.qualityReduced = true;
    this.performanceMode = true;
    this.renderer.shadowMap.enabled = false;
    if (this.moteField) this.moteField.visible = false;
    if (this.routeRail) this.routeRail.material.opacity = 0.07;
    for (const ribbon of this.auroraRibbons) {
      ribbon.mesh.visible = false;
    }
    for (const platform of this.platforms) {
      if (platform.edges && !platform.id.includes("bridge")) platform.edges.visible = false;
    }
    this.resize();
    this.updateQualityUi();
    this.showToast("Performance-Modus aktiv");
  }

  updatePlatforms() {
    for (const platform of this.platforms) {
      platform.previousPosition.copy(platform.position);
      platform.active = platform.activeWhen ? Boolean(platform.activeWhen()) : true;
      const assistHidden = platform.assistOnly && !this.assistMode;
      platform.solid = !assistHidden && (platform.active || (platform.ghost && this.assist.ghostSupport && platform.supportWhenGhost));
      platform.position.copy(platform.basePosition);
      if (platform.moving && platform.active) {
        const amount = Math.sin(this.elapsed * platform.moving.speed + platform.moving.phase) * platform.moving.range;
        platform.position.addScaledVector(platform.moving.axis, amount);
        platform.position.y += Math.sin(this.elapsed * 1.6 + platform.moving.phase) * 0.08;
      }
      platform.delta.subVectors(platform.position, platform.previousPosition);
      platform.mesh.position.copy(platform.position);
      const visible = !assistHidden && (platform.active || platform.ghost);
      const opacity = platform.active ? platform.activeOpacity : platform.ghostOpacity;
      if (platform.cachedVisible !== visible) {
        platform.mesh.visible = visible;
        platform.cachedVisible = visible;
      }
      if (platform.cachedOpacity !== opacity) {
        platform.mesh.material.transparent = platform.ghost || platform.mesh.material.transparent;
        platform.mesh.material.opacity = opacity;
        platform.cachedOpacity = opacity;
      }
      const edgeOpacity = platform.solid ? 0.22 : 0.07;
      if (platform.edges && platform.cachedEdgeOpacity !== edgeOpacity) {
        platform.edges.material.opacity = edgeOpacity;
        platform.cachedEdgeOpacity = edgeOpacity;
      }
    }
  }

  updateEnemies(dt) {
    for (const enemy of this.enemies) {
      enemy.lastPosition.copy(enemy.group.position);
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      enemy.disabledTimer = Math.max(0, enemy.disabledTimer - dt);
      enemy.active = !enemy.defeated && (enemy.activeWhen ? Boolean(enemy.activeWhen()) : true);
      enemy.group.visible = enemy.active;
      if (!enemy.active) continue;

      if (enemy.disabledTimer <= 0 && enemy.path.length > 1) {
        const target = enemy.path[enemy.targetIndex];
        const toTarget = this.enemyMoveScratch.subVectors(target, enemy.group.position);
        const distance = toTarget.length();
        const step = enemy.speed * dt;
        if (distance <= step) {
          enemy.group.position.copy(target);
          if (enemy.targetIndex === enemy.path.length - 1 || enemy.targetIndex === 0) {
            enemy.direction *= -1;
          }
          enemy.targetIndex = clamp(enemy.targetIndex + enemy.direction, 0, enemy.path.length - 1);
        } else if (distance > 0.001) {
          enemy.group.position.addScaledVector(toTarget.normalize(), step);
        }
      }

      enemy.velocity.subVectors(enemy.group.position, enemy.lastPosition);
      if (dt > 0) enemy.velocity.divideScalar(dt);
      const moveAmount = Math.hypot(enemy.velocity.x, enemy.velocity.z);
      if (moveAmount > 0.04) {
        enemy.group.rotation.y = Math.atan2(enemy.velocity.x, enemy.velocity.z);
      }

      const stunScale = enemy.disabledTimer > 0 ? 0.72 : 1;
      enemy.group.scale.set(enemy.baseScale, enemy.baseScale * stunScale, enemy.baseScale);
      enemy.body.position.y = 0.66 + Math.sin(this.elapsed * 4.2 + enemy.group.position.x) * 0.035;
      enemy.ring.rotation.z += dt * (enemy.disabledTimer > 0 ? 0.7 : 2.1);
      enemy.ring.material.opacity = enemy.disabledTimer > 0 ? 0.18 : 0.34 + Math.sin(this.elapsed * 3.0) * 0.08;
      enemy.eye.material.opacity = enemy.disabledTimer > 0 ? 0.28 : 0.78 + Math.sin(this.elapsed * 5.0) * 0.12;
    }
  }

  readMoveInput() {
    let x = 0;
    let z = 0;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) x += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) z -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) z += 1;

    if (this.touch.active) {
      x += Math.abs(this.touch.vector.x) > 0.12 ? this.touch.vector.x : 0;
      z += Math.abs(this.touch.vector.y) > 0.12 ? this.touch.vector.y : 0;
    }

    this.moveInput.set(x, z);
    if (this.moveInput.lengthSq() > 1) this.moveInput.normalize();
    return this.moveInput;
  }

  updatePlayer(dt) {
    const input = this.readMoveInput();
    const speed = this.player.grounded ? this.assist.groundSpeed : this.assist.airSpeed;
    const acceleration = this.player.grounded ? this.assist.groundAcceleration : this.assist.airAcceleration;

    if (this.player.grounded && this.player.currentPlatform?.active) {
      this.player.position.add(this.player.currentPlatform.delta);
    }

    this.player.velocity.x = approach(this.player.velocity.x, input.x * speed, acceleration * dt);
    this.player.velocity.z = approach(this.player.velocity.z, input.y * speed, acceleration * dt);

    this.player.coyoteTimer = this.player.grounded
      ? this.assist.coyoteTime
      : Math.max(0, this.player.coyoteTimer - dt);
    this.player.jumpBufferTimer = Math.max(0, this.player.jumpBufferTimer - dt);
    const wantsJump = this.jumpQueued || this.player.jumpBufferTimer > 0;
    const canGroundJump = this.player.grounded || this.player.coyoteTimer > 0;
    const canDoubleJump = this.player.jumpsRemaining > 0;
    if (wantsJump && (canGroundJump || canDoubleJump)) {
      const doubleJump = !canGroundJump;
      this.player.velocity.y = doubleJump ? this.assist.doubleJumpVelocity : this.assist.jumpVelocity;
      this.player.grounded = false;
      this.player.currentPlatform = null;
      this.player.coyoteTimer = 0;
      this.player.jumpBufferTimer = 0;
      this.player.jumpsRemaining = doubleJump ? Math.max(0, this.player.jumpsRemaining - 1) : this.assist.maxJumps - 1;
      this.audio.play("jump", 0.48, doubleJump ? 1.58 : 1.18, 70);
      if (doubleJump) this.showToast("Double Jump");
    }
    this.jumpQueued = false;

    const previousFeet = this.player.position.y - this.player.height * 0.5;
    this.player.velocity.y -= this.assist.gravity * dt;
    this.player.velocity.y = Math.max(this.player.velocity.y, -this.assist.maxFallSpeed);
    this.player.position.x += this.player.velocity.x * dt;
    this.player.position.z += this.player.velocity.z * dt;
    this.player.position.y += this.player.velocity.y * dt;

    this.resolveGround(previousFeet);
    if (this.player.position.y < this.assist.rescueY) {
      this.recoverPlayer("Fangnetz");
    }
    this.updateCheckpoint(dt);
    this.syncPlayerMesh();
  }

  resolveGround(previousFeet) {
    const feet = this.player.position.y - this.player.height * 0.5;
    let landedPlatform = null;
    let bestTop = -Infinity;

    if (this.player.velocity.y <= 0) {
      for (const platform of this.platforms) {
        if (!platform.solid) continue;
        const top = platform.position.y + platform.size.y * 0.5;
        const xOverlap = Math.abs(this.player.position.x - platform.position.x) <= platform.size.x * 0.5 + this.assist.platformMargin;
        const zOverlap = Math.abs(this.player.position.z - platform.position.z) <= platform.size.z * 0.5 + this.assist.platformMargin;
        if (!xOverlap || !zOverlap) continue;
        const crossedTop = previousFeet >= top - this.assist.landingForgiveness && feet <= top + this.assist.landingForgiveness;
        const closeAbove = feet >= top - this.assist.landingForgiveness && feet <= top + 0.35;
        if ((crossedTop || closeAbove) && top > bestTop) {
          bestTop = top;
          landedPlatform = platform;
        }
      }
    }

    const wasGrounded = this.player.grounded;
    if (landedPlatform) {
      this.player.position.y = bestTop + this.player.height * 0.5;
      if (!wasGrounded && this.player.velocity.y < -3.2) {
        this.audio.play("land", 0.38, 1.12, 90);
      }
      this.player.velocity.y = 0;
      this.player.grounded = true;
      this.player.currentPlatform = landedPlatform;
      this.player.coyoteTimer = this.assist.coyoteTime;
      this.player.jumpsRemaining = this.assist.maxJumps;
    } else {
      this.player.grounded = false;
      this.player.currentPlatform = null;
    }
  }

  updateCheckpoint(dt) {
    if (!this.player.grounded || !this.player.currentPlatform || this.player.currentPlatform.moving) return;
    for (const hazard of this.hazards) {
      if (distanceXZ(this.player.position, hazard.group.position) < hazard.radius + 0.65 && Math.abs(this.player.position.y - hazard.group.position.y) < 1.35) {
        return;
      }
    }
    for (const enemy of this.enemies) {
      if (enemy.defeated || !enemy.active) continue;
      const enemyCenterY = enemy.group.position.y + 0.65 * enemy.baseScale;
      if (enemy.active && enemy.disabledTimer <= 0 && distanceXZ(this.player.position, enemy.group.position) < enemy.radius + 0.95 && Math.abs(this.player.position.y - enemyCenterY) < 1.55) {
        return;
      }
    }
    this.player.safeTimer += dt;
    if (this.player.safeTimer > 0.2) {
      this.player.safeTimer = 0;
      this.player.checkpoint.copy(this.player.position);
      this.player.checkpoint.y += 0.05;
    }
  }

  checkMechanics(dt) {
    const feetY = this.player.position.y - this.player.height * 0.5;

    for (const switchPlate of this.switches) {
      if (switchPlate.active) continue;
      if (distanceXZ(this.player.position, switchPlate.group.position) < this.assist.switchRadius && Math.abs(feetY - switchPlate.group.position.y) < 0.9) {
        switchPlate.active = true;
        this.state[switchPlate.id] = true;
        this.audio.play("switch", 0.58, switchPlate.id === "lift" ? 1.12 : 0.96, 120);
        this.showToast(switchPlate.label);
      }
    }

    for (const node of this.relayNodes) {
      node.cooldown = Math.max(0, node.cooldown - dt);
      if (node.active || node.cooldown > 0) continue;
      const near = distanceXZ(this.player.position, node.group.position) < this.assist.switchRadius;
      const heightMatch = Math.abs(feetY - node.group.position.y) < 1.25;
      if (!near || !heightMatch) continue;
      if (node.sequence === this.relayIndex) {
        node.active = true;
        this.relayIndex += 1;
        this.audio.play("relay", 0.5, 1.05 + node.sequence * 0.14, 90);
        if (this.relayIndex >= this.relayNodes.length) {
          this.state.relay = true;
          this.showToast("Prisma-Relais synchron");
        } else {
          this.showToast(`${node.label} ${this.relayIndex}/${this.relayNodes.length}`);
        }
      } else {
        node.cooldown = 1.0;
        if (this.assistMode) {
          this.showToast(`Relais ${this.relayIndex + 1} zuerst`);
        } else {
          this.relayIndex = 0;
          this.relayNodes.forEach((relayNode) => {
            relayNode.active = false;
            relayNode.core.material.opacity = 0.86;
          });
          this.audio.play("reset", 0.28, 0.76, 160);
          this.showToast("Relaisfolge neu starten");
        }
      }
    }

    for (const anchor of this.timeAnchors) {
      anchor.cooldown = Math.max(0, anchor.cooldown - dt);
      if (anchor.active || anchor.cooldown > 0) continue;
      const near = distanceXZ(this.player.position, anchor.group.position) < this.assist.switchRadius;
      const heightMatch = Math.abs(feetY - anchor.group.position.y) < 1.28;
      if (!near || !heightMatch) continue;
      anchor.active = true;
      this.state[anchor.id] = true;
      this.audio.play("relay", 0.48, anchor.id === "dawn" ? 1.24 : 1.42, 90);
      const activeCount = this.timeAnchors.filter((timeAnchor) => timeAnchor.active).length;
      if (activeCount >= this.timeAnchors.length) {
        this.state.chrono = true;
        this.showToast("Chrono-Tor stabil");
      } else {
        this.showToast(`${anchor.label} ${activeCount}/${this.timeAnchors.length}`);
      }
    }

    for (const beacon of this.mirrorBeacons) {
      beacon.cooldown = Math.max(0, beacon.cooldown - dt);
      if (beacon.active || beacon.cooldown > 0) continue;
      const near = distanceXZ(this.player.position, beacon.group.position) < this.assist.switchRadius;
      const heightMatch = Math.abs(feetY - beacon.group.position.y) < 1.28;
      if (!near || !heightMatch) continue;
      beacon.active = true;
      this.audio.play("relay", 0.46, 1.52 + this.mirrorBeacons.indexOf(beacon) * 0.1, 85);
      const activeCount = this.mirrorBeacons.filter((mirrorBeacon) => mirrorBeacon.active).length;
      if (activeCount >= this.mirrorBeacons.length) {
        this.state.mirror = true;
        this.showToast("Spiegelpfad fokussiert");
      } else {
        this.showToast(`${beacon.label} ${activeCount}/${this.mirrorBeacons.length}`);
      }
    }

    for (const well of this.gravityWells) {
      well.cooldown = Math.max(0, well.cooldown - dt);
      const near = distanceXZ(this.player.position, well.group.position) < well.radius;
      const heightMatch = Math.abs(this.player.position.y - well.group.position.y) < 3.2;
      if (!near || !heightMatch) continue;

      const pull = new THREE.Vector3().subVectors(well.group.position, this.player.position);
      pull.y = 0;
      if (pull.lengthSq() > 0.001) {
        pull.normalize();
        const strength = this.assistMode ? 5.6 : 3.6;
        this.player.velocity.x += pull.x * strength * dt;
        this.player.velocity.z += pull.z * strength * dt;
      }
      if (this.player.velocity.y < -1.4) this.player.velocity.y *= this.assistMode ? 0.62 : 0.78;
      if (this.player.velocity.y < 3.0) this.player.velocity.y += (this.assistMode ? 4.0 : 2.55) * dt;

      if (!well.active && well.cooldown <= 0) {
        well.active = true;
        const activeCount = this.gravityWells.filter((gravityWell) => gravityWell.active).length;
        this.audio.play("relay", 0.44, 1.68 + activeCount * 0.08, 85);
        if (activeCount >= this.gravityWells.length) {
          this.state.orrery = true;
          this.showToast("Orrery-Bruecke stabil");
        } else {
          this.showToast(`${well.label} ${activeCount}/${this.gravityWells.length}`);
        }
      }
    }

    for (const pair of this.riftPairs) {
      pair.cooldown = Math.max(0, pair.cooldown - dt);
      if (pair.cooldown > 0) continue;
      const endpoints = [
        [pair.entry, pair.exit],
        [pair.exit, pair.entry]
      ];
      for (const [from, to] of endpoints) {
        const near = distanceXZ(this.player.position, from.group.position) < this.assist.switchRadius;
        const heightMatch = Math.abs(this.player.position.y - from.group.position.y) < 1.45;
        if (!near || !heightMatch) continue;
        this.player.position.copy(to.group.position);
        this.player.position.y += 0.72;
        this.player.velocity.multiplyScalar(0.58);
        this.player.velocity.y = Math.max(this.player.velocity.y, 2.4);
        this.player.grounded = false;
        this.player.currentPlatform = null;
        this.player.jumpsRemaining = this.assist.maxJumps;
        pair.cooldown = 1.15;
        this.audio.play("relay", 0.5, from === pair.entry ? 1.78 : 1.42, 70);
        this.showToast(pair.label);
        break;
      }
    }

    for (const seal of this.glyphSeals) {
      seal.cooldown = Math.max(0, seal.cooldown - dt);
      if (seal.active || seal.cooldown > 0) continue;
      const near = distanceXZ(this.player.position, seal.group.position) < this.assist.switchRadius;
      const heightMatch = Math.abs(feetY - seal.group.position.y) < 1.25;
      if (!near || !heightMatch) continue;
      seal.active = true;
      this.audio.play("switch", 0.5, 1.08 + this.glyphSeals.indexOf(seal) * 0.12, 90);
      const activeCount = this.glyphSeals.filter((glyphSeal) => glyphSeal.active).length;
      if (activeCount >= this.glyphSeals.length) {
        this.state.sanctum = true;
        this.showToast("Sanctum-Siegel offen");
      } else {
        this.showToast(`${seal.label} ${activeCount}/${this.glyphSeals.length}`);
      }
    }

    for (const chest of this.treasureChests) {
      chest.cooldown = Math.max(0, chest.cooldown - dt);
      if (chest.opened || chest.cooldown > 0) continue;
      const near = distanceXZ(this.player.position, chest.group.position) < this.assist.switchRadius;
      const heightMatch = Math.abs(feetY - chest.group.position.y) < 1.28;
      if (!near || !heightMatch) continue;
      chest.opened = true;
      chest.lock.visible = false;
      chest.cooldown = 0.6;
      this.audio.play("switch", 0.55, 1.62 + this.treasureChests.indexOf(chest) * 0.08, 80);
      const openCount = this.treasureChests.filter((treasureChest) => treasureChest.opened).length;
      if (openCount >= this.treasureChests.length) {
        this.state.skyKey = true;
        this.showToast("Himmelsschluessel geschmiedet");
      } else {
        this.showToast(`${chest.label} ${openCount}/${this.treasureChests.length}`);
      }
    }

    for (const pad of this.bouncePads) {
      pad.cooldown = Math.max(0, pad.cooldown - dt);
      pad.group.rotation.y += dt * 1.6;
      if (pad.cooldown <= 0 && this.player.grounded && distanceXZ(this.player.position, pad.group.position) < 0.84) {
        this.player.velocity.y = this.assist.bounceVelocity;
        this.player.grounded = false;
        this.player.currentPlatform = null;
        pad.cooldown = 0.8;
        this.audio.play("jump", 0.56, 1.55, 80);
        this.showToast("Aufwind");
      }
    }

    for (const wind of this.windZones) {
      wind.cooldown = Math.max(0, wind.cooldown - dt);
      const near = distanceXZ(this.player.position, wind.position) < wind.radius;
      const heightMatch = Math.abs(this.player.position.y - wind.position.y) < 2.4;
      if (near && heightMatch) {
        this.player.velocity.x += wind.direction.x * (this.assistMode ? 7.2 : 4.4) * dt;
        this.player.velocity.z += wind.direction.z * (this.assistMode ? 7.2 : 4.4) * dt;
        if (this.player.velocity.y < 1.2) this.player.velocity.y += 1.2 * dt;
        if (wind.cooldown <= 0) {
          wind.cooldown = 1.4;
          this.showToast(wind.label);
        }
      }
    }

    for (const drift of this.driftFields) {
      drift.cooldown = Math.max(0, drift.cooldown - dt);
      const near = distanceXZ(this.player.position, drift.group.position) < drift.radius;
      const heightMatch = Math.abs(this.player.position.y - drift.group.position.y) < 2.8;
      if (near && heightMatch) {
        if (this.player.velocity.y < -1.2) this.player.velocity.y *= this.assistMode ? 0.62 : 0.78;
        this.player.velocity.y += (this.assistMode ? 2.7 : 1.65) * dt;
        this.player.velocity.x *= 1 - 0.22 * dt;
        this.player.velocity.z *= 1 - 0.22 * dt;
        if (drift.cooldown <= 0) {
          drift.cooldown = 1.6;
          this.showToast(drift.label);
        }
      }
    }

    for (const shard of this.shards) {
      if (shard.collected) continue;
      if (this.player.position.distanceTo(shard.group.position) < this.assist.shardRadius) {
        shard.collected = true;
        shard.group.visible = false;
        this.collected += 1;
        this.audio.play("switch", 0.48, 1.34 + this.collected * 0.08, 60);
        this.showToast(this.collected >= this.totalShards ? "Mondportal geoeffnet" : "Runensplitter geborgen");
      }
    }

    for (const hazard of this.hazards) {
      if (distanceXZ(this.player.position, hazard.group.position) < hazard.radius + 0.08 && Math.abs(this.player.position.y - hazard.group.position.y) < 1.0) {
        if (!this.assist.hazardRecovery) {
          this.recoverPlayer("Zur letzten Plattform");
          return;
        }
        this.player.velocity.y = 5.8;
        this.player.velocity.x *= -0.35;
        this.player.velocity.z *= -0.35;
        this.player.jumpsRemaining = this.assist.maxJumps;
        this.showToast("Runenpuffer");
        return;
      }
    }

    for (const enemy of this.enemies) {
      if (this.handleEnemyContact(enemy)) return;
    }

    if (this.collected >= this.totalShards && this.player.position.distanceTo(this.portal.position) < 1.35) {
      this.finishRun();
    }
  }

  handleEnemyContact(enemy) {
    if (enemy.defeated || !enemy.active || enemy.cooldown > 0 || enemy.disabledTimer > 0) return false;
    const horizontal = distanceXZ(this.player.position, enemy.group.position);
    if (horizontal > enemy.radius + this.player.radius) return false;

    const feetY = this.player.position.y - this.player.height * 0.5;
    const enemyCenterY = enemy.group.position.y + 0.65 * enemy.baseScale;
    const stomped = this.player.velocity.y < -0.45 && feetY > enemy.group.position.y + 0.42 * enemy.baseScale;
    if (stomped) {
      enemy.hits += 1;
      enemy.cooldown = 0.5;
      this.player.velocity.y = this.assist.bounceVelocity * 0.72;
      this.player.grounded = false;
      this.player.currentPlatform = null;
      this.player.jumpsRemaining = this.assist.maxJumps;
      this.audio.play("jump", 0.52, 1.72, 75);
      if (enemy.hitPoints && enemy.hits >= enemy.hitPoints) {
        enemy.defeated = true;
        enemy.active = false;
        enemy.group.visible = false;
        if (enemy.defeatState) this.state[enemy.defeatState] = true;
        this.showToast(`${enemy.label} besiegt`);
      } else {
        enemy.disabledTimer = enemy.hitPoints ? 1.65 : this.assistMode ? 4.2 : 2.7;
        this.showToast(enemy.hitPoints ? `${enemy.label} ${enemy.hits}/${enemy.hitPoints}` : `${enemy.label} betaeubt`);
      }
      return false;
    }

    if (Math.abs(this.player.position.y - enemyCenterY) > 1.25) return false;
    if (!this.assistMode) {
      this.recoverPlayer(enemy.label);
      return true;
    }

    const away = this.enemyContactScratch.subVectors(this.player.position, enemy.group.position);
    away.y = 0;
    if (away.lengthSq() < 0.001) away.set(0, 0, 1);
    away.normalize();
    this.player.velocity.x = away.x * 5.4;
    this.player.velocity.z = away.z * 5.4;
    this.player.velocity.y = Math.max(this.player.velocity.y, 4.7);
    this.player.grounded = false;
    this.player.currentPlatform = null;
    this.player.jumpsRemaining = this.assist.maxJumps;
    enemy.cooldown = 1.0;
    this.audio.play("reset", 0.3, 1.18, 120);
    this.showToast(enemy.hitPoints ? "Waechter geblockt" : "Wache geblockt");
    return false;
  }

  getNextObjectivePosition() {
    if (this.collected >= 13 && !this.state.chrono) {
      const nextAnchor = this.timeAnchors.find((anchor) => !anchor.active);
      if (nextAnchor) return nextAnchor.group.position;
    }
    if (this.collected >= 15 && !this.state.mirror) {
      const nextBeacon = this.mirrorBeacons.find((beacon) => !beacon.active);
      if (nextBeacon) return nextBeacon.group.position;
    }
    if (this.collected >= 17 && !this.state.orrery) {
      const nextWell = this.gravityWells.find((well) => !well.active);
      if (nextWell) return nextWell.group.position;
    }
    if (this.collected >= 19 && !this.state.sanctum) {
      const nextSeal = this.glyphSeals.find((seal) => !seal.active);
      if (nextSeal) return nextSeal.group.position;
    }
    if (this.collected >= 20 && !this.state.skyKey) {
      const nextChest = this.treasureChests.find((chest) => !chest.opened);
      if (nextChest) return nextChest.group.position;
    }
    if (this.collected >= 21 && !this.state.guardian) {
      const guardian = this.enemies.find((enemy) => enemy.id === "guardian-boss" && !enemy.defeated);
      if (guardian) return guardian.group.position;
    }
    const nextShard = this.shards.find((shard) => !shard.collected);
    return nextShard ? nextShard.group.position : this.portal.position;
  }

  updateGuideCompass() {
    if (!this.compassGroup || !this.checkpointBeacon) return;
    const visible = this.running && !this.finished;
    this.compassGroup.visible = visible;
    this.checkpointBeacon.visible = visible && this.assistMode;
    if (!visible) return;

    const target = this.getNextObjectivePosition();
    const dx = target.x - this.player.position.x;
    const dz = target.z - this.player.position.z;
    this.compassGroup.position.copy(this.player.position);
    this.compassGroup.position.y += 1.42 + Math.sin(this.elapsed * 2.2) * 0.06;
    this.compassGroup.rotation.y = Math.atan2(dx, dz);
    this.compassGroup.rotation.z = Math.sin(this.elapsed * 3.4) * 0.06;
    this.compassGroup.scale.setScalar(this.assistMode ? 1 : 0.82);
    this.compassMaterials[0].opacity = this.assistMode ? 0.86 : 0.48;
    this.compassMaterials[1].opacity = this.assistMode ? 0.5 : 0.24;

    this.checkpointBeacon.position.copy(this.player.checkpoint);
    this.checkpointBeacon.position.y -= 0.62;
    this.checkpointBeacon.rotation.z += 0.018;
    this.checkpointBeacon.material.opacity = 0.27 + Math.sin(this.elapsed * 2.4) * 0.08;
  }

  animateScene(dt) {
    if (this.moteField?.visible) {
      this.moteField.rotation.y += dt * 0.015;
      this.moteField.position.y = Math.sin(this.elapsed * 0.55) * 0.18;
    }

    for (const shard of this.shards) {
      shard.group.rotation.y += dt * 1.8;
      shard.group.rotation.x += dt * 0.65;
      shard.group.position.y = shard.baseY + Math.sin(this.elapsed * 2.4 + shard.baseY) * 0.18;
    }

    for (const switchPlate of this.switches) {
      switchPlate.ring.rotation.z += dt * (switchPlate.active ? 2.6 : 0.9);
      if (switchPlate.light) {
        switchPlate.light.intensity = switchPlate.active ? 1.35 + Math.sin(this.elapsed * 5) * 0.12 : 0.18;
      }
      switchPlate.group.scale.y = approach(switchPlate.group.scale.y, switchPlate.active ? 0.78 : 1, dt * 3);
    }

    for (const node of this.relayNodes) {
      node.ring.rotation.z += dt * (node.active ? 2.9 : 1.1);
      node.core.rotation.y -= dt * 1.4;
      node.core.material.opacity = approach(node.core.material.opacity, node.active ? 1 : 0.64, dt * 2);
      node.group.scale.setScalar(approach(node.group.scale.x, node.active ? 1.18 : 1, dt * 2.4));
    }

    for (const anchor of this.timeAnchors) {
      const speed = anchor.active ? 2.8 : 1.05;
      anchor.upper.rotation.z += dt * speed;
      anchor.lower.rotation.z -= dt * (speed * 0.82);
      anchor.core.rotation.y += dt * 1.5;
      anchor.core.position.y = 0.32 + Math.sin(this.elapsed * 2.1 + anchor.group.position.x) * 0.05;
      anchor.core.material.opacity = approach(anchor.core.material.opacity, anchor.active ? 1 : 0.62, dt * 2.5);
      anchor.group.scale.setScalar(approach(anchor.group.scale.x, anchor.active ? 1.16 : 1, dt * 2.2));
    }

    for (const beacon of this.mirrorBeacons) {
      const speed = beacon.active ? 2.7 : 0.85;
      beacon.ring.rotation.z += dt * speed;
      beacon.dish.rotation.z = Math.sin(this.elapsed * 1.4 + beacon.group.position.x) * 0.08;
      beacon.core.rotation.y -= dt * 1.6;
      beacon.core.position.y = 0.66 + Math.sin(this.elapsed * 2.4 + beacon.group.position.z) * 0.05;
      beacon.core.material.opacity = approach(beacon.core.material.opacity, beacon.active ? 1 : 0.58, dt * 2.4);
      beacon.dish.material.opacity = approach(beacon.dish.material.opacity, beacon.active ? 0.92 : 0.58, dt * 2);
      beacon.group.scale.setScalar(approach(beacon.group.scale.x, beacon.active ? 1.15 : 1, dt * 2.2));
    }

    for (const well of this.gravityWells) {
      const speed = well.active ? 1.7 : 0.62;
      well.group.position.y = well.baseY + Math.sin(this.elapsed * 0.7 + well.group.position.x) * 0.18;
      well.outer.rotation.z += dt * speed;
      well.vertical.rotation.x += dt * (speed * 0.7);
      well.core.rotation.y -= dt * 1.8;
      well.core.position.y = Math.sin(this.elapsed * 2.2 + well.group.position.z) * 0.08;
      well.core.material.opacity = approach(well.core.material.opacity, well.active ? 1 : 0.62, dt * 2.2);
      well.outer.material.opacity = (this.performanceMode ? 0.1 : 0.18) + Math.sin(this.elapsed * 0.9 + well.group.position.x) * 0.035;
      well.vertical.material.opacity = (this.performanceMode ? 0.09 : 0.16) + Math.sin(this.elapsed * 1.1 + well.group.position.z) * 0.03;
      well.group.scale.setScalar(approach(well.group.scale.x, well.active ? 1.12 : 1, dt * 2));
    }

    for (const pair of this.riftPairs) {
      pair.entry.ring.rotation.z += dt * 1.45;
      pair.entry.core.rotation.z -= dt * 0.9;
      pair.exit.ring.rotation.z -= dt * 1.28;
      pair.exit.core.rotation.z += dt * 0.8;
      const pulse = Math.sin(this.elapsed * 2.3 + pair.entry.group.position.x) * 0.05;
      pair.entry.ring.material.opacity = (this.performanceMode ? 0.36 : 0.58) + pulse;
      pair.exit.ring.material.opacity = (this.performanceMode ? 0.36 : 0.58) - pulse;
      pair.entry.group.scale.setScalar(1 + Math.sin(this.elapsed * 2.0) * 0.035);
      pair.exit.group.scale.setScalar(1 + Math.cos(this.elapsed * 1.9) * 0.035);
    }

    for (const seal of this.glyphSeals) {
      seal.glyph.rotation.z += dt * (seal.active ? 2.4 : 0.72);
      seal.core.rotation.y -= dt * 1.5;
      seal.core.position.y = 0.42 + Math.sin(this.elapsed * 2.1 + seal.group.position.x) * 0.05;
      seal.core.material.opacity = approach(seal.core.material.opacity, seal.active ? 1 : 0.62, dt * 2.5);
      seal.glyph.material.opacity = approach(seal.glyph.material.opacity, seal.active ? 0.9 : 0.46, dt * 2.2);
      seal.group.scale.setScalar(approach(seal.group.scale.x, seal.active ? 1.15 : 1, dt * 2.2));
    }

    for (const chest of this.treasureChests) {
      const targetRotation = chest.opened ? -1.08 : 0;
      chest.lid.rotation.x = approach(chest.lid.rotation.x, targetRotation, dt * 4.2);
      chest.lid.position.y = approach(chest.lid.position.y, chest.lid.userData.closedY + (chest.opened ? 0.08 : 0), dt * 3.5);
      chest.glow.rotation.z += dt * (chest.opened ? 2.2 : 0.75);
      chest.glow.material.opacity = approach(
        chest.glow.material.opacity,
        chest.opened ? 0.62 : this.performanceMode ? 0.24 : 0.38,
        dt * 2.4
      );
      chest.group.scale.setScalar(approach(chest.group.scale.x, chest.opened ? 1.08 : 1, dt * 2.2));
    }

    for (const hazard of this.hazards) {
      hazard.group.rotation.x += dt * 1.2;
      hazard.group.rotation.y -= dt * 1.8;
    }

    if (this.guideWispMesh?.visible) {
      if (this.performanceMode) {
        this.guideWispMesh.material.opacity = 0.56 + Math.sin(this.elapsed * 1.4) * 0.08;
      } else {
        this.guideWisps.forEach((wisp, index) => {
          this.wispDummy.position.copy(wisp.position);
          this.wispDummy.position.y = wisp.baseY + Math.sin(this.elapsed * 2.2 + wisp.phase) * 0.12;
          this.wispDummy.rotation.set(0, this.elapsed * 1.3 + wisp.phase, 0);
          this.wispDummy.updateMatrix();
          this.guideWispMesh.setMatrixAt(index, this.wispDummy.matrix);
        });
        this.guideWispMesh.instanceMatrix.needsUpdate = true;
      }
    }

    const portalOpen = this.collected >= this.totalShards;
    this.portal.rotation.z += dt * (portalOpen ? 1.15 : 0.32);
    this.portal.scale.setScalar(approach(this.portal.scale.x, portalOpen ? 1 : 0.72, dt * 2.3));
    this.portal.children[1].material.opacity = approach(this.portal.children[1].material.opacity, portalOpen ? 0.4 : 0.08, dt * 1.4);
    if (this.portal.children[2].isLight) {
      this.portal.children[2].intensity = portalOpen ? 2.4 + Math.sin(this.elapsed * 4) * 0.28 : 0.55;
    }

    for (const ribbon of this.auroraRibbons) {
      ribbon.mesh.position.y = ribbon.baseY + Math.sin(this.elapsed * 0.8 + ribbon.phase) * 0.28;
      ribbon.mesh.material.opacity = 0.09 + Math.sin(this.elapsed * 0.9 + ribbon.phase) * 0.035;
    }

    if (this.constellationLines) {
      this.constellationLines.material.opacity = this.performanceMode
        ? 0.12 + Math.sin(this.elapsed * 0.42) * 0.025
        : 0.22 + Math.sin(this.elapsed * 0.42) * 0.04;
    }

    for (const gate of this.eclipseGates) {
      gate.group.position.y = gate.baseY + Math.sin(this.elapsed * 0.7 + gate.phase) * 0.22;
      gate.group.rotation.y += dt * 0.16;
      gate.outer.rotation.z += dt * 0.74;
      gate.inner.rotation.z -= dt * 1.08;
      gate.outer.material.opacity = (this.performanceMode ? 0.12 : 0.22) + Math.sin(this.elapsed * 0.9 + gate.phase) * 0.035;
      gate.inner.material.opacity = (this.performanceMode ? 0.14 : 0.26) + Math.sin(this.elapsed * 1.1 + gate.phase) * 0.04;
    }

    for (const drift of this.driftFields) {
      drift.group.position.y = drift.baseY + Math.sin(this.elapsed * 0.78) * 0.16;
      drift.outer.rotation.z += dt * 0.72;
      drift.inner.rotation.z -= dt * 1.05;
      drift.outer.material.opacity = (this.performanceMode ? 0.1 : 0.2) + Math.sin(this.elapsed * 0.9) * 0.035;
      drift.inner.material.opacity = (this.performanceMode ? 0.09 : 0.17) + Math.sin(this.elapsed * 1.1) * 0.03;
    }

    if (this.mirrorBeam) {
      const activeCount = this.mirrorBeacons.filter((beacon) => beacon.active).length;
      const baseOpacity = this.state.mirror ? 0.48 : 0.1 + activeCount * 0.08;
      this.mirrorBeam.material.opacity = (this.performanceMode ? baseOpacity * 0.62 : baseOpacity) + Math.sin(this.elapsed * 1.15) * 0.035;
    }

    this.updateGuideCompass();

    const moveAmount = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    if (moveAmount > 0.2) {
      this.playerGroup.rotation.y = Math.atan2(this.player.velocity.x, this.player.velocity.z);
    }
    this.playerGroup.rotation.z = approach(this.playerGroup.rotation.z, clamp(-this.player.velocity.x * 0.045, -0.22, 0.22), dt * 7);
  }

  updateCamera(dt) {
    const mobile = this.shell.clientWidth < 680;
    const offset = mobile ? this.cameraOffsetMobile : this.cameraOffsetDesktop;
    this.cameraDesired.copy(this.player.position).add(offset);
    this.cameraTargetDesired.copy(this.player.position);
    this.cameraTargetDesired.y += 0.75;
    this.camera.position.lerp(this.cameraDesired, 1 - Math.pow(0.003, dt));
    this.cameraTarget.lerp(this.cameraTargetDesired, 1 - Math.pow(0.002, dt));
    this.camera.lookAt(this.cameraTarget);
  }

  syncPlayerMesh() {
    this.playerGroup.position.copy(this.player.position);
  }

  updateHud() {
    const count = `${this.collected}/${this.totalShards}`;
    const mode = this.assistMode ? "Assist" : "Normal";
    let level = `${mode} I`;
    let text = this.assistMode ? "Ebene I - Folge den Wisps" : "Ebene I - Runenplatten aktivieren";
    if (this.state.bridge && !this.state.lift) text = "Ebene I - Bruecken sind sicher";
    if (this.state.lift && this.collected < 3) text = this.assistMode ? "Ebene I - Double Jump hilft" : "Ebene I - Timing zaehlt";
    if (this.collected >= 3) {
      level = `${mode} II`;
      text = this.assistMode ? "Ebene II - Keine Eile, Fangnetze halten" : "Ebene II - Mondspitze finden";
    }
    if (this.state.spire) {
      level = `${mode} III`;
      text = this.collected < 5 ? "Ebene III - Folge den hellen Wisps" : "Ebene III - Echo-Schalter suchen";
    }
    if (this.state.echo || this.collected >= 6) {
      level = `${mode} IV`;
      text = this.state.relay
        ? "Ebene IV - Relais-Vault offen"
        : "Ebene IV - Relais: Sonne, Mond, Krone";
    }
    if (this.state.crown || this.collected >= 8) {
      level = `${mode} V`;
      text = this.collected < this.totalShards ? "Ebene V - Aurora-Krone" : "Ebene V - Portal bereit";
    }
    if (this.state.eclipse || this.collected >= 10) {
      level = `${mode} VI`;
      text = this.collected < 12 ? "Ebene VI - Eclipse-Schmiede" : "Ebene VI - Sternenpfad";
    }
    if (this.state.chrono || this.collected >= 12) {
      level = `${mode} VII`;
      text = this.state.chrono
        ? this.collected < 14 ? "Ebene VII - Zenith-Vault" : "Ebene VII - Sternwarte"
        : "Ebene VII - Zwei Zeitanker";
    }
    if (this.state.mirror || this.collected >= 14) {
      level = `${mode} VIII`;
      text = this.state.mirror
        ? this.collected < 16 ? "Ebene VIII - Astral-Vault" : "Ebene VIII - Orrery-Pfad"
        : "Ebene VIII - Drei Spiegel";
    }
    if (this.state.orrery || this.collected >= 16) {
      level = `${mode} IX`;
      text = this.state.orrery
        ? this.collected < 18 ? "Ebene IX - Nebula-Vault" : "Ebene IX - Risspfad"
        : "Ebene IX - Gravitaetsbrunnen";
    }
    if (this.state.sanctum || this.collected >= 18) {
      level = `${mode} X`;
      text = this.state.sanctum
        ? this.collected < 20 ? "Ebene X - Rift-Sanctum" : "Ebene X - Himmelsschluessel"
        : "Ebene X - Rissportal und Glyphen";
    }
    if (this.state.skyKey || this.collected >= 20) {
      level = `${mode} XI`;
      text = this.state.guardian
        ? this.collected < this.totalShards ? "Ebene XI - Portal-Dais" : "Ebene XI - Portal bereit"
        : this.state.skyKey
          ? this.collected < 21 ? "Ebene XI - Sky Keep" : "Ebene XI - Runenwaechter"
          : "Ebene XI - Drei Schatztruhen";
    }
    if (this.finished) text = "Runenpfad geloest";

    if (this.hudState.count !== count) {
      this.hudState.count = count;
      this.shardCount.textContent = count;
    }
    if (this.hudState.level !== level) {
      this.hudState.level = level;
      this.levelValue.textContent = level;
    }
    if (this.hudState.objective !== text) {
      this.hudState.objective = text;
      this.objective.textContent = text;
    }
  }

  resetPlayer(message) {
    if (!this.running || this.finished) return;
    this.recoverPlayer(message);
  }

  recoverPlayer(message) {
    this.player.position.copy(this.player.checkpoint);
    this.player.position.y += 0.35;
    this.player.velocity.set(0, 0, 0);
    this.player.grounded = false;
    this.player.currentPlatform = null;
    this.player.coyoteTimer = this.assist.coyoteTime;
    this.player.jumpBufferTimer = 0;
    this.player.jumpsRemaining = this.assist.maxJumps;
    this.syncPlayerMesh();
    this.audio.play("reset", 0.42, 1, 150);
    this.showToast(message);
  }

  finishRun() {
    this.finished = true;
    this.running = false;
    const seconds = Math.max(1, Math.round((performance.now() - this.runStartedAt) / 1000));
    const minutes = Math.floor(seconds / 60);
    const rest = String(seconds % 60).padStart(2, "0");
    this.finishStats.textContent = `${this.assist.name} - Zeit ${minutes}:${rest} - ${this.totalShards}/${this.totalShards} Runen`;
    this.finishScreen.classList.add("active");
    this.audio.play("switch", 0.62, 1.55, 160);
  }

  showToast(message) {
    clearTimeout(this.toastTimer);
    this.toast.textContent = message;
    this.toast.classList.add("visible");
    this.toastTimer = setTimeout(() => this.toast.classList.remove("visible"), 1600);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new RuneLiftGame();
});
