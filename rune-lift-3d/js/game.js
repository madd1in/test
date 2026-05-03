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
  texture.anisotropy = 8;
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
    this.bgm = new Audio("./assets/audio/bgm/catacomb-bell-vault.mp3");
    this.bgm.loop = true;
    this.bgm.preload = "auto";
    this.bgm.volume = 0.22;
    this.bgm.playbackRate = 0.94;

    this.sounds = {
      jump: new Audio("./assets/audio/sfx/jump.mp3"),
      land: new Audio("./assets/audio/sfx/land.mp3"),
      switch: new Audio("./assets/audio/sfx/switch.mp3"),
      reset: new Audio("./assets/audio/sfx/reset.mp3")
    };

    Object.values(this.sounds).forEach((sound) => {
      sound.preload = "auto";
      sound.volume = 0.55;
    });

    this.button.addEventListener("click", () => this.toggle());
  }

  unlock() {
    this.unlocked = true;
    if (!this.muted) {
      this.bgm.play().catch(() => {});
    }
  }

  toggle() {
    this.muted = !this.muted;
    this.button.setAttribute("aria-pressed", String(this.muted));
    if (this.muted) {
      this.bgm.pause();
      return;
    }
    this.unlock();
  }

  play(name, volume = 0.55, rate = 1, cooldown = 40) {
    if (this.muted || !this.unlocked) return;
    const now = performance.now();
    if ((this.lastPlayed.get(name) ?? 0) + cooldown > now) return;
    this.lastPlayed.set(name, now);

    const source = this.sounds[name];
    if (!source) return;
    const sound = source.cloneNode(true);
    sound.volume = volume;
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
    this.objective = document.querySelector("#objective");
    this.shardCount = document.querySelector("#shard-count");
    this.levelValue = document.querySelector("#level-value");
    this.finishStats = document.querySelector("#finish-stats");
    this.toast = document.querySelector("#toast");
    this.touchRing = document.querySelector("#touch-ring");
    this.audio = new AudioBus(document.querySelector("#audio-button"));
    this.performanceMode = window.innerWidth < 760 || (window.devicePixelRatio || 1) > 1.6;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.performanceMode,
      powerPreference: "high-performance"
    });
    this.renderer.setClearColor(0x101419, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
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
    this.totalShards = 5;
    this.collected = 0;
    this.state = { bridge: false, lift: false, spire: false };
    this.hudState = { objective: "", count: "", level: "" };
    this.framePressure = { slowTime: 0, qualityReduced: false };

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
      safeTimer: 0
    };

    this.moveInput = new THREE.Vector2();
    this.cameraOffsetDesktop = new THREE.Vector3(8.4, 6.8, 9.2);
    this.cameraOffsetMobile = new THREE.Vector3(6.7, 7.1, 9.1);
    this.cameraDesired = new THREE.Vector3();
    this.cameraTargetDesired = new THREE.Vector3();
    this.platforms = [];
    this.switches = [];
    this.shards = [];
    this.bouncePads = [];
    this.hazards = [];

    this.createLights();
    this.createMaterials();
    this.createSky();
    this.createAtmosphere();
    this.createLevel();
    this.createPlayer();
    this.bindEvents();
    this.resize();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  createLights() {
    const hemi = new THREE.HemisphereLight(0xc8fff0, 0x1a1218, 1.65);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffe2a0, 2.6);
    sun.position.set(-8, 12, 8);
    sun.castShadow = true;
    const shadowSize = this.performanceMode ? 768 : 1280;
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 45;
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    this.scene.add(sun);

    const fill = new THREE.PointLight(0x7fe1c0, 1.1, 28, 2);
    fill.position.set(0, 6, -6);
    this.scene.add(fill);
  }

  createMaterials() {
    const stone = makeCanvasTexture(256, 2, 2, paintStone);
    const moss = makeCanvasTexture(256, 2, 2, paintMoss);
    const rune = makeCanvasTexture(256, 1, 1, paintRune);
    const hazard = makeCanvasTexture(256, 1, 1, paintHazard);

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
      })
    };
  }

  createSky() {
    const texture = makeCanvasTexture(512, 1, 1, paintSky);
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(92, 36, 18),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
    );
    sky.position.y = 10;
    this.scene.add(sky);
  }

  createAtmosphere() {
    const moteCount = this.performanceMode ? 90 : 170;
    const positions = new Float32Array(moteCount * 3);
    const random = seededRandom(902);
    for (let i = 0; i < moteCount; i += 1) {
      positions[i * 3] = (random() - 0.5) * 48;
      positions[i * 3 + 1] = 1.2 + random() * 12;
      positions[i * 3 + 2] = (random() - 0.12) * 44;
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
    this.moteField = new THREE.Points(geometry, material);
    this.scene.add(this.moteField);

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 24, 12),
      new THREE.MeshBasicMaterial({ color: 0xf6e3a8, transparent: true, opacity: 0.82 })
    );
    moon.position.set(-18, 19, -28);
    this.scene.add(moon);
  }

  createLevel() {
    this.addPlatform("hub", [0, 0, 0], [6, 1, 6], { material: "stone" });
    this.addPlatform("north-walk", [0, 0, -4.7], [2.25, 0.55, 3.7], { material: "moss" });
    this.addPlatform("north", [0, 0, -8.2], [4.8, 1, 4.8], { material: "rune" });
    this.addPlatform("light-bridge", [4.55, 0, -8.2], [4.8, 0.42, 1.8], {
      material: "bridge",
      activeWhen: () => this.state.bridge,
      ghost: true,
      ghostOpacity: 0.13
    });
    this.addPlatform("east", [8.4, 0, -8.2], [4.8, 1, 4.8], { material: "moss" });
    this.addPlatform("west-walk", [-4.1, 0, 1.8], [3.5, 0.55, 1.9], { material: "moss" });
    this.addPlatform("west", [-7.35, 0, 1.8], [4.4, 1, 4.4], { material: "stone" });
    this.addPlatform("sky-step", [-9.8, 2.15, 1.8], [2.9, 0.62, 2.9], { material: "lift" });
    this.addPlatform("sky-ledge", [-12.05, 4.05, 1.8], [4.8, 1, 4.8], { material: "rune" });
    this.addPlatform("south-dock", [0, 0, 4.95], [3.25, 0.55, 3.45], { material: "stone" });
    this.addPlatform("moving-lift", [0, 0, 9.55], [3.15, 0.55, 3.15], {
      material: "lift",
      activeWhen: () => this.state.lift,
      moving: { axis: [0, 0, 1], range: 3.25, speed: 0.82, phase: 0.1 },
      ghost: false
    });
    this.addPlatform("south", [0, 0, 14.55], [5.2, 1, 5.2], { material: "moss" });
    this.addPlatform("portal-bridge", [0, 0, 18.65], [2.4, 0.44, 4.25], {
      material: "bridge",
      activeWhen: () => this.collected >= 3,
      ghost: true,
      ghostOpacity: 0.11
    });
    this.addPlatform("portal-island", [0, 0, 22.55], [5.5, 1, 5.5], { material: "rune" });
    this.addPlatform("threshold-bridge", [4.75, 0, 22.55], [4.55, 0.42, 1.7], {
      material: "bridge",
      activeWhen: () => this.collected >= 3,
      ghost: true,
      ghostOpacity: 0.1
    });
    this.addPlatform("spire-foyer", [8.6, 0, 22.55], [4.9, 1, 4.9], { material: "stone" });
    this.addPlatform("spiral-low", [11.65, 1.15, 20.2], [3.1, 0.58, 2.8], { material: "moss" });
    this.addPlatform("spiral-mid", [14.1, 2.35, 17.7], [3.1, 0.58, 2.8], { material: "lift" });
    this.addPlatform("spiral-high", [16.8, 3.6, 15.2], [3.3, 0.62, 3.3], { material: "stone" });
    this.addPlatform("spire-bridge", [17.7, 3.6, 18.75], [2.0, 0.42, 5.35], {
      material: "bridge",
      activeWhen: () => this.state.spire,
      ghost: true,
      ghostOpacity: 0.1
    });
    this.addPlatform("moon-gate", [18.3, 3.6, 22.65], [5.25, 1, 5.25], { material: "rune" });

    this.addSwitch("bridge", [0, 0.64, -8.2], "Lichtbrücke aktiv");
    this.addSwitch("lift", [8.4, 0.64, -6.75], "Runenlift aktiv");
    this.addSwitch("spire", [8.6, 0.64, 22.55], "Mondspitze geöffnet");
    this.addBouncePad([-7.35, 0.64, 1.8]);
    this.addBouncePad([8.6, 0.64, 21.25]);
    this.addShard("east", [8.4, 1.72, -8.2]);
    this.addShard("sky", [-12.05, 5.72, 1.8]);
    this.addShard("south", [0, 1.72, 14.55]);
    this.addShard("spire", [16.8, 5.05, 15.2]);
    this.addShard("moon", [18.3, 5.15, 22.65]);
    this.addHazard([-1.7, 0.72, 14.25], 0.78);
    this.addHazard([1.55, 0.72, 15.1], 0.68);
    this.addHazard([14.1, 3.04, 17.7], 0.58);
    this.addHazard([18.9, 4.25, 21.1], 0.64);
    this.addPortal();
    this.addDecor();
  }

  addPlatform(id, positionArray, sizeArray, options = {}) {
    const size = new THREE.Vector3(...sizeArray);
    const basePosition = new THREE.Vector3(...positionArray);
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = this.materials[options.material ?? "stone"].clone();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(basePosition);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: options.material === "bridge" ? 0xdcfff4 : 0xf4f0e7,
      transparent: true,
      opacity: options.material === "bridge" ? 0.38 : 0.13
    });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
    mesh.add(edges);
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
      active: true,
      activeOpacity: material.opacity,
      ghostOpacity: options.ghostOpacity ?? 0.16
    };
    this.platforms.push(platform);
    return platform;
  }

  addSwitch(id, positionArray, label) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.82, 0.16, 48),
      this.materials.rune.clone()
    );
    base.castShadow = true;
    base.receiveShadow = true;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.035, 10, 48),
      new THREE.MeshStandardMaterial({
        color: 0x7fe1c0,
        emissive: 0x235f54,
        emissiveIntensity: 0.65,
        roughness: 0.35
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    const light = new THREE.PointLight(0x7fe1c0, 0.15, 5, 2);
    light.position.y = 0.35;
    group.add(base, ring, light);
    group.position.set(...positionArray);
    this.scene.add(group);

    this.switches.push({ id, label, group, ring, light, active: false });
  }

  addBouncePad(positionArray) {
    const group = new THREE.Group();
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.86, 0.92, 0.14, 48),
      new THREE.MeshStandardMaterial({
        color: 0xf2c14e,
        emissive: 0x8e5c19,
        emissiveIntensity: 0.65,
        roughness: 0.32,
        metalness: 0.08
      })
    );
    disc.castShadow = true;
    disc.receiveShadow = true;
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
    const halo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.74, 1),
      new THREE.MeshBasicMaterial({
        color: 0xf2c14e,
        transparent: true,
        opacity: 0.16,
        wireframe: true
      })
    );
    const light = new THREE.PointLight(0x7fe1c0, 1.25, 6, 2);
    group.add(core, halo, light);
    group.position.set(...positionArray);
    this.scene.add(group);
    this.shards.push({ id, group, baseY: positionArray[1], collected: false });
  }

  addHazard(positionArray, radius) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, 1),
      this.materials.hazard.clone()
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.05, 0.035, 8, 40),
      new THREE.MeshBasicMaterial({ color: 0xf07f5f, transparent: true, opacity: 0.52 })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(core, ring);
    group.position.set(...positionArray);
    this.scene.add(group);
    this.hazards.push({ group, radius });
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
    const light = new THREE.PointLight(0xf2c14e, 1.2, 9, 1.8);
    light.position.z = -0.3;
    this.portal.add(ring, inner, light);
    this.portal.position.set(18.3, 5.05, 22.65);
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
      [7.0, 1.7, 24.6], [10.1, 1.7, 20.4], [16.2, 5.3, 13.4], [20.1, 5.3, 24.9]
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
    const rockCount = this.performanceMode ? 24 : 36;
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
      [1.9, 0.78, 16.8], [7.3, 0.78, 20.9], [12.7, 1.94, 19.2], [18.8, 4.38, 24.8]
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
    body.castShadow = true;
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
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));

    this.startButton.addEventListener("click", () => {
      this.startRun();
    });
    this.againButton.addEventListener("click", () => {
      this.finishScreen.classList.remove("active");
      this.startRun();
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
  }

  resize() {
    const width = this.shell.clientWidth;
    const height = this.shell.clientHeight;
    const compact = width < 760;
    const cap = this.framePressure.qualityReduced ? 1 : compact ? 1.1 : 1.45;
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
    this.switches.forEach((switchPlate) => {
      switchPlate.active = false;
      switchPlate.light.intensity = 0.15;
    });
    this.shards.forEach((shard) => {
      shard.collected = false;
      shard.group.visible = true;
    });
    this.audio.unlock();
    this.showToast("Der Runenpfad erwacht");
  }

  requestJump() {
    this.jumpQueued = true;
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.033);
    this.elapsed += dt;
    this.monitorPerformance(dt);
    this.updatePlatforms();
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
    if (dt > 0.027) {
      this.framePressure.slowTime += dt;
    } else {
      this.framePressure.slowTime = Math.max(0, this.framePressure.slowTime - dt * 0.5);
    }
    if (this.framePressure.slowTime > 1.15) {
      this.applyAdaptiveQuality();
    }
  }

  applyAdaptiveQuality() {
    this.framePressure.qualityReduced = true;
    this.renderer.shadowMap.enabled = false;
    if (this.moteField) this.moteField.visible = false;
    this.resize();
    this.showToast("Performance-Modus aktiv");
  }

  updatePlatforms() {
    for (const platform of this.platforms) {
      platform.previousPosition.copy(platform.position);
      platform.active = platform.activeWhen ? Boolean(platform.activeWhen()) : true;
      platform.position.copy(platform.basePosition);
      if (platform.moving && platform.active) {
        const amount = Math.sin(this.elapsed * platform.moving.speed + platform.moving.phase) * platform.moving.range;
        platform.position.addScaledVector(platform.moving.axis, amount);
        platform.position.y += Math.sin(this.elapsed * 1.6 + platform.moving.phase) * 0.08;
      }
      platform.delta.subVectors(platform.position, platform.previousPosition);
      platform.mesh.position.copy(platform.position);
      platform.mesh.visible = platform.active || platform.ghost;
      platform.mesh.material.transparent = platform.ghost || platform.mesh.material.transparent;
      platform.mesh.material.opacity = platform.active ? platform.activeOpacity : platform.ghostOpacity;
      platform.edges.material.opacity = platform.active ? 0.22 : 0.11;
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
    const speed = this.player.grounded ? 5.35 : 4.3;
    const acceleration = this.player.grounded ? 28 : 12;

    if (this.player.grounded && this.player.currentPlatform?.active) {
      this.player.position.add(this.player.currentPlatform.delta);
    }

    this.player.velocity.x = approach(this.player.velocity.x, input.x * speed, acceleration * dt);
    this.player.velocity.z = approach(this.player.velocity.z, input.y * speed, acceleration * dt);

    if (this.jumpQueued && this.player.grounded) {
      this.player.velocity.y = 7.25;
      this.player.grounded = false;
      this.player.currentPlatform = null;
      this.audio.play("jump", 0.5, 1.28, 70);
    }
    this.jumpQueued = false;

    const previousFeet = this.player.position.y - this.player.height * 0.5;
    this.player.velocity.y -= 18.4 * dt;
    this.player.velocity.y = Math.max(this.player.velocity.y, -24);
    this.player.position.x += this.player.velocity.x * dt;
    this.player.position.z += this.player.velocity.z * dt;
    this.player.position.y += this.player.velocity.y * dt;

    this.resolveGround(previousFeet);
    if (this.player.position.y < -7.5) {
      this.resetPlayer("Vom Pfad gefallen");
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
        if (!platform.active) continue;
        const top = platform.position.y + platform.size.y * 0.5;
        const xOverlap = Math.abs(this.player.position.x - platform.position.x) <= platform.size.x * 0.5 + this.player.radius;
        const zOverlap = Math.abs(this.player.position.z - platform.position.z) <= platform.size.z * 0.5 + this.player.radius;
        if (!xOverlap || !zOverlap) continue;
        if (previousFeet >= top - 0.1 && feet <= top + 0.1 && top > bestTop) {
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
      if (distanceXZ(this.player.position, switchPlate.group.position) < 0.78 && Math.abs(feetY - switchPlate.group.position.y) < 0.6) {
        switchPlate.active = true;
        this.state[switchPlate.id] = true;
        this.audio.play("switch", 0.58, switchPlate.id === "lift" ? 1.12 : 0.96, 120);
        this.showToast(switchPlate.label);
      }
    }

    for (const pad of this.bouncePads) {
      pad.cooldown = Math.max(0, pad.cooldown - dt);
      pad.group.rotation.y += dt * 1.6;
      if (pad.cooldown <= 0 && this.player.grounded && distanceXZ(this.player.position, pad.group.position) < 0.84) {
        this.player.velocity.y = 10.1;
        this.player.grounded = false;
        this.player.currentPlatform = null;
        pad.cooldown = 0.8;
        this.audio.play("jump", 0.56, 1.55, 80);
        this.showToast("Aufwind");
      }
    }

    for (const shard of this.shards) {
      if (shard.collected) continue;
      if (this.player.position.distanceTo(shard.group.position) < 1.05) {
        shard.collected = true;
        shard.group.visible = false;
        this.collected += 1;
        this.audio.play("switch", 0.48, 1.34 + this.collected * 0.08, 60);
        this.showToast(this.collected >= this.totalShards ? "Mondportal geöffnet" : "Runensplitter geborgen");
      }
    }

    for (const hazard of this.hazards) {
      if (distanceXZ(this.player.position, hazard.group.position) < hazard.radius + 0.35 && Math.abs(this.player.position.y - hazard.group.position.y) < 1.2) {
        this.resetPlayer("Instabile Rune");
        return;
      }
    }

    if (this.collected >= this.totalShards && this.player.position.distanceTo(this.portal.position) < 1.35) {
      this.finishRun();
    }
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
      switchPlate.light.intensity = switchPlate.active ? 1.35 + Math.sin(this.elapsed * 5) * 0.12 : 0.18;
      switchPlate.group.scale.y = approach(switchPlate.group.scale.y, switchPlate.active ? 0.78 : 1, dt * 3);
    }

    for (const hazard of this.hazards) {
      hazard.group.rotation.x += dt * 1.2;
      hazard.group.rotation.y -= dt * 1.8;
    }

    const portalOpen = this.collected >= this.totalShards;
    this.portal.rotation.z += dt * (portalOpen ? 1.15 : 0.32);
    this.portal.scale.setScalar(approach(this.portal.scale.x, portalOpen ? 1 : 0.72, dt * 2.3));
    this.portal.children[1].material.opacity = approach(this.portal.children[1].material.opacity, portalOpen ? 0.4 : 0.08, dt * 1.4);
    this.portal.children[2].intensity = portalOpen ? 2.4 + Math.sin(this.elapsed * 4) * 0.28 : 0.55;

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
    let level = "Ebene I";
    let text = "Ebene I · Aktiviere die Nordrune";
    if (this.state.bridge && !this.state.lift) text = "Ebene I · Folge der Lichtbrücke";
    if (this.state.lift && this.collected < 3) text = "Ebene I · Sammle die ersten Splitter";
    if (this.collected >= 3) {
      level = "Ebene II";
      text = "Ebene II · Öffne die Mondspitze";
    }
    if (this.state.spire) {
      level = "Ebene III";
      text = this.collected < this.totalShards ? "Ebene III · Steig zur Mondpforte" : "Ebene III · Betritt das Mondportal";
    }
    if (this.finished) text = "Runenpfad gelöst";

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
    this.player.position.copy(this.player.checkpoint);
    this.player.velocity.set(0, 0, 0);
    this.player.grounded = false;
    this.player.currentPlatform = null;
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
    this.finishStats.textContent = `Zeit ${minutes}:${rest} · ${this.totalShards}/${this.totalShards} Runen`;
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
