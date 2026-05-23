import * as THREE from "../assets/vendor/three.module.js";

const ASSETS = {
  art: {
    catacomb: "./assets/art/catacomb-hall.png",
    props: "./assets/art/castle-props.png",
    atlas: "./assets/art/gothic-atlas.png"
  },
  audio: {
    bgm: [
      "./assets/audio/bgm/gasket-thunder.mp3",
      "./assets/audio/bgm/dojo-crash-duel.mp3",
      "./assets/audio/bgm/bamboo-arcade.mp3",
      "./assets/audio/bgm/turbo-banana-cup.mp3",
      "./assets/audio/bgm/jet-fuel-glory.mp3",
      "./assets/audio/bgm/steel-punch-parade.mp3"
    ],
    sfx: {
      start: "./assets/audio/sfx/arcade-start.mp3",
      pickup: "./assets/audio/sfx/gem-pickup.mp3",
      impact: "./assets/audio/sfx/impact.mp3",
      dash: "./assets/audio/sfx/dash.mp3",
      jump: "./assets/audio/sfx/jump.mp3",
      checkpoint: "./assets/audio/sfx/checkpoint.mp3",
      relic: "./assets/audio/sfx/relic-ping.mp3",
      surge: "./assets/audio/sfx/surge-burst.mp3",
      curse: "./assets/audio/sfx/curse-fizzle.mp3",
      warning: "./assets/audio/sfx/danger-tick.mp3"
    }
  }
};

const LANES = [-4.2, 0, 4.2];
const PLAYER_Z = 5.4;
const ROAD_SEGMENT_LENGTH = 18;
const ROAD_SEGMENTS = 34;
const SIDE_PROP_SPACING = 15;
const SIDE_PROP_COUNT = 34;
const SPAWN_AHEAD = 190;
const DESPAWN_BEHIND = -24;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;

const ui = {
  shell: document.getElementById("game-shell"),
  canvas: document.getElementById("scene"),
  menu: document.getElementById("menu"),
  results: document.getElementById("results"),
  startButton: document.getElementById("start-button"),
  againButton: document.getElementById("again-button"),
  audioButton: document.getElementById("audio-button"),
  menuAudioButton: document.getElementById("menu-audio-button"),
  resultAudioButton: document.getElementById("result-audio-button"),
  pauseButton: document.getElementById("pause-button"),
  distance: document.getElementById("distance-value"),
  score: document.getElementById("score-value"),
  speed: document.getElementById("speed-value"),
  streak: document.getElementById("streak-value"),
  health: document.getElementById("health-fill"),
  boost: document.getElementById("boost-fill"),
  toast: document.getElementById("toast"),
  resultTitle: document.getElementById("result-title"),
  resultCopy: document.getElementById("result-copy")
};

function createState() {
  return {
    mode: "menu",
    distance: 0,
    score: 0,
    best: Number(localStorage.getItem("crypt-runner-best") || 0),
    speed: 24,
    targetSpeed: 30,
    health: 100,
    boost: 66,
    lane: 1,
    targetLane: 1,
    laneCooldown: 0,
    playerX: LANES[1],
    playerY: 0,
    playerVy: 0,
    grounded: true,
    dashTimer: 0,
    invulnerable: 0,
    damageFlash: 0,
    cameraShake: 0,
    streak: 0,
    relics: 0,
    surgeTimer: 0,
    checkpoint: 500,
    nextSpawn: 26,
    runTime: 0,
    toastTimer: 0,
    demoInputTimer: 0
  };
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvasTexture(size, painter, repeatX = 1, repeatY = 1) {
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
  texture.anisotropy = 6;
  return texture;
}

function paintRunestone(ctx, size) {
  const rnd = seededRandom(510);
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#4b4f52");
  gradient.addColorStop(0.48, "#20272d");
  gradient.addColorStop(1, "#767062");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(7,9,12,0.62)";
  ctx.lineWidth = 3;
  for (let y = 0; y < size; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y + rnd() * 7);
    ctx.lineTo(size, y + rnd() * 7);
    ctx.stroke();
  }
  for (let x = 0; x < size; x += 35) {
    ctx.beginPath();
    ctx.moveTo(x + rnd() * 6, 0);
    ctx.lineTo(x + rnd() * 6, size);
    ctx.stroke();
  }
  for (let i = 0; i < 220; i += 1) {
    ctx.fillStyle = rnd() > 0.52 ? "rgba(255,236,179,0.14)" : "rgba(0,0,0,0.22)";
    ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 3, 1 + rnd() * 3);
  }
}

function paintLaneMark(ctx, size) {
  ctx.fillStyle = "#0f141b";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(83,229,215,0.48)";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(size * 0.5, 0);
  ctx.lineTo(size * 0.5, size);
  ctx.stroke();
  ctx.strokeStyle = "rgba(243,191,86,0.45)";
  ctx.lineWidth = 2;
  for (let y = 12; y < size; y += 26) {
    ctx.beginPath();
    ctx.moveTo(size * 0.5 - 16, y);
    ctx.lineTo(size * 0.5 + 16, y + 12);
    ctx.stroke();
  }
}

class AudioDeck {
  constructor() {
    this.enabled = false;
    this.unlocked = false;
    this.trackIndex = 0;
    this.bgm = ASSETS.audio.bgm.map((src) => {
      const audio = new Audio(src);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0.58;
      return audio;
    });
    this.sfx = Object.fromEntries(
      Object.entries(ASSETS.audio.sfx).map(([key, src]) => {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.volume = key === "impact" ? 0.68 : key === "surge" ? 0.78 : 0.6;
        return [key, audio];
      })
    );
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    [ui.audioButton, ui.menuAudioButton, ui.resultAudioButton].forEach((button) => {
      button.setAttribute("aria-pressed", String(enabled));
      button.textContent = button === ui.audioButton ? (enabled ? "On" : "BGM") : enabled ? "BGM an" : "BGM aus";
    });
    if (enabled) this.unlock();
    else this.stop();
  }

  unlock() {
    if (!this.enabled) return;
    this.unlocked = true;
    this.playMusic();
  }

  playMusic() {
    if (!this.enabled || !this.unlocked) return;
    this.bgm.forEach((track, index) => {
      if (index === this.trackIndex) {
        track.muted = false;
        track.play().catch(() => {});
      } else {
        track.pause();
      }
    });
  }

  stop() {
    this.bgm.forEach((track) => track.pause());
  }

  play(name, rate = 1, volumeScale = 1) {
    if (!this.enabled || !this.unlocked || !this.sfx[name]) return;
    const sound = this.sfx[name].cloneNode();
    sound.volume = clamp(this.sfx[name].volume * volumeScale, 0, 1);
    sound.playbackRate = rate;
    sound.play().catch(() => {});
  }

  update(speed, distance) {
    if (!this.enabled || !this.unlocked) return;
    const nextTrack = Math.floor(distance / 1300) % this.bgm.length;
    if (nextTrack !== this.trackIndex) {
      this.trackIndex = nextTrack;
      this.playMusic();
    }
    const active = this.bgm[this.trackIndex];
    active.volume = 0.42 + clamp(speed / 70, 0, 1) * 0.22;
    active.playbackRate = 1 + clamp(speed / 72, 0, 1) * 0.08;
  }
}

class CryptRunnerGame {
  constructor() {
    this.state = createState();
    this.audio = new AudioDeck();
    this.keys = new Set();
    this.touch = new Set();
    this.entities = [];
    this.particles = [];
    this.roadSegments = [];
    this.sideProps = [];
    this.clock = new THREE.Clock();
    this.demoMode = new URLSearchParams(window.location.search).get("autoplay") === "1";

    this.renderer = new THREE.WebGLRenderer({
      canvas: ui.canvas,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0d13);
    this.scene.fog = new THREE.Fog(0x0a0d13, 28, 240);
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 420);
    this.cameraTarget = new THREE.Vector3(0, 1.4, PLAYER_Z - 9);
    this.tmp = new THREE.Vector3();

    this.loader = new THREE.TextureLoader();
    this.textures = this.createTextures();
    this.materials = this.createMaterials();
    this.createWorld();
    this.createPlayer();
    this.bindInput();
    this.bindButtons();
    this.resize();
    this.updateHud();
    window.addEventListener("resize", () => this.resize());
    requestAnimationFrame(() => this.loop());

    if (this.demoMode) {
      window.setTimeout(() => this.startRun({ muted: true }), 350);
    }
  }

  createTextures() {
    const catacomb = this.loadTexture(ASSETS.art.catacomb);
    const props = this.loadTexture(ASSETS.art.props);
    const atlas = this.loadTexture(ASSETS.art.atlas, 1.25, 1.25);
    return {
      catacomb,
      props,
      atlas,
      runestone: makeCanvasTexture(256, paintRunestone, 2, 4),
      lane: makeCanvasTexture(128, paintLaneMark, 1, 3)
    };
  }

  loadTexture(src, repeatX = 1, repeatY = 1) {
    const texture = this.loader.load(src, () => {
      texture.needsUpdate = true;
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 6;
    if (repeatX !== 1 || repeatY !== 1) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
    }
    return texture;
  }

  createMaterials() {
    return {
      road: new THREE.MeshStandardMaterial({
        map: this.textures.runestone,
        color: 0xb5b1a7,
        roughness: 0.88,
        metalness: 0.02
      }),
      roadAlt: new THREE.MeshStandardMaterial({
        map: this.textures.atlas,
        color: 0x747983,
        roughness: 0.86,
        metalness: 0.04
      }),
      lane: new THREE.MeshStandardMaterial({
        map: this.textures.lane,
        color: 0x8ddbd2,
        emissive: 0x123c40,
        emissiveIntensity: 0.34,
        roughness: 0.55
      }),
      rail: new THREE.MeshStandardMaterial({ color: 0x1a2029, roughness: 0.72, metalness: 0.18 }),
      runner: new THREE.MeshStandardMaterial({ color: 0xd8e8f2, roughness: 0.43, metalness: 0.28 }),
      runnerCoat: new THREE.MeshStandardMaterial({ color: 0x395f89, roughness: 0.58, metalness: 0.08 }),
      runnerGold: new THREE.MeshStandardMaterial({ color: 0xf0c257, roughness: 0.38, metalness: 0.35 }),
      glowTeal: new THREE.MeshBasicMaterial({
        color: 0x53e5d7,
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }),
      glowGold: new THREE.MeshBasicMaterial({
        color: 0xf3bf56,
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }),
      glowRed: new THREE.MeshBasicMaterial({
        color: 0xe45454,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }),
      crystal: new THREE.MeshStandardMaterial({
        color: 0x9fe070,
        emissive: 0x3b6f21,
        emissiveIntensity: 1.25,
        roughness: 0.2,
        metalness: 0.12
      }),
      boost: new THREE.MeshStandardMaterial({
        color: 0x8b6af8,
        emissive: 0x4b2dd0,
        emissiveIntensity: 1.4,
        roughness: 0.18,
        metalness: 0.18
      }),
      relic: new THREE.MeshStandardMaterial({
        color: 0xf3bf56,
        emissive: 0x7a4a16,
        emissiveIntensity: 1.45,
        roughness: 0.2,
        metalness: 0.38
      }),
      obstacle: new THREE.MeshStandardMaterial({ color: 0x353b43, roughness: 0.8, metalness: 0.08 }),
      obstacleTrim: new THREE.MeshStandardMaterial({
        color: 0xb89145,
        emissive: 0x241200,
        emissiveIntensity: 0.16,
        roughness: 0.42,
        metalness: 0.3
      }),
      spikes: new THREE.MeshStandardMaterial({ color: 0xa9b0bb, roughness: 0.48, metalness: 0.42 }),
      banner: new THREE.MeshStandardMaterial({
        map: this.textures.props,
        color: 0xffffff,
        roughness: 0.7,
        side: THREE.DoubleSide
      }),
      backdrop: new THREE.MeshBasicMaterial({ map: this.textures.catacomb, color: 0xffffff }),
      particle: new THREE.MeshBasicMaterial({
        color: 0x53e5d7,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    };
  }

  createWorld() {
    this.world = new THREE.Group();
    this.roadGroup = new THREE.Group();
    this.propGroup = new THREE.Group();
    this.entityGroup = new THREE.Group();
    this.fxGroup = new THREE.Group();
    this.scene.add(this.world, this.entityGroup, this.fxGroup);
    this.world.add(this.roadGroup, this.propGroup);

    const hemi = new THREE.HemisphereLight(0xbad8ff, 0x18100c, 1.25);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffdfb2, 2.25);
    sun.position.set(-16, 28, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -46;
    sun.shadow.camera.right = 46;
    sun.shadow.camera.top = 46;
    sun.shadow.camera.bottom = -46;
    this.scene.add(sun);

    const tealLight = new THREE.PointLight(0x53e5d7, 6.8, 80);
    tealLight.position.set(0, 5, -22);
    this.scene.add(tealLight);

    const redLight = new THREE.PointLight(0xe45454, 3.2, 80);
    redLight.position.set(-14, 5, -54);
    this.scene.add(redLight);

    this.createRoad();
    this.createBackdrop();
    this.createSideProps();
  }

  createRoad() {
    const roadGeo = new THREE.BoxGeometry(14, 0.42, ROAD_SEGMENT_LENGTH);
    const laneGeo = new THREE.BoxGeometry(0.08, 0.03, ROAD_SEGMENT_LENGTH * 0.94);
    const railGeo = new THREE.BoxGeometry(0.24, 0.58, ROAD_SEGMENT_LENGTH * 0.98);

    for (let i = 0; i < ROAD_SEGMENTS; i += 1) {
      const group = new THREE.Group();
      group.userData.index = i;
      const road = new THREE.Mesh(roadGeo, i % 4 === 0 ? this.materials.roadAlt : this.materials.road);
      road.receiveShadow = true;
      group.add(road);

      for (const x of [-2.1, 2.1]) {
        const mark = new THREE.Mesh(laneGeo, this.materials.lane);
        mark.position.set(x, 0.245, 0);
        mark.receiveShadow = true;
        group.add(mark);
      }

      for (const x of [-7.35, 7.35]) {
        const rail = new THREE.Mesh(railGeo, this.materials.rail);
        rail.position.set(x, 0.35, 0);
        rail.castShadow = true;
        rail.receiveShadow = true;
        group.add(rail);
      }

      this.roadGroup.add(group);
      this.roadSegments.push(group);
    }
  }

  createBackdrop() {
    const far = new THREE.Mesh(new THREE.PlaneGeometry(138, 78), this.materials.backdrop);
    far.position.set(0, 25, -148);
    this.scene.add(far);

    const left = new THREE.Mesh(new THREE.PlaneGeometry(120, 54), this.materials.backdrop);
    left.position.set(-39, 19, -70);
    left.rotation.y = Math.PI / 2;
    this.scene.add(left);

    const right = new THREE.Mesh(new THREE.PlaneGeometry(120, 54), this.materials.backdrop);
    right.position.set(39, 19, -70);
    right.rotation.y = -Math.PI / 2;
    this.scene.add(right);
  }

  createSideProps() {
    for (let i = 0; i < SIDE_PROP_COUNT; i += 1) {
      const pair = new THREE.Group();
      pair.userData.index = i;
      pair.add(this.makeColumn(-9.2, 0, i));
      pair.add(this.makeColumn(9.2, 0, i + 13));
      if (i % 4 === 0) {
        pair.add(this.makeBanner(-10.35, 3.4, 0, Math.PI / 2));
        pair.add(this.makeBanner(10.35, 3.4, 0, -Math.PI / 2));
      }
      if (i % 5 === 0) {
        const arch = new THREE.Mesh(new THREE.BoxGeometry(19, 0.45, 0.5), this.materials.obstacleTrim);
        arch.position.set(0, 7.35, 0);
        arch.castShadow = true;
        pair.add(arch);
      }
      this.propGroup.add(pair);
      this.sideProps.push(pair);
    }
  }

  makeColumn(x, z, seed) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.86, 0.5, 10), this.materials.obstacle);
    base.position.y = 0.25;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.56, 5.4, 12), this.materials.obstacle);
    shaft.position.y = 3.15;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.62, 0.52, 10), this.materials.obstacleTrim);
    cap.position.y = 6.08;
    [base, shaft, cap].forEach((part) => {
      part.castShadow = true;
      part.receiveShadow = true;
      group.add(part);
    });
    if (seed % 3 === 0) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.72, 8), this.materials.glowGold);
      flame.position.set(0, 6.72, 0);
      group.add(flame);
    }
    return group;
  }

  makeBanner(x, y, z, rotation) {
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 3.2), this.materials.banner);
    banner.position.set(x, y, z);
    banner.rotation.y = rotation;
    return banner;
  }

  createPlayer() {
    this.player = new THREE.Group();
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.55, 24), new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.32,
      depthWrite: false
    }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.035;
    this.playerShadow = shadow;

    const hips = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.8, 0.72), this.materials.runnerCoat);
    hips.position.y = 1.28;
    hips.castShadow = true;
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.05, 0.64), this.materials.runner);
    chest.position.y = 2.05;
    chest.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 14), this.materials.runnerGold);
    head.position.y = 2.82;
    head.castShadow = true;

    this.leftLeg = this.makeLimb(-0.36, 0.73, 0.03, this.materials.runnerCoat);
    this.rightLeg = this.makeLimb(0.36, 0.73, 0.03, this.materials.runnerCoat);
    this.leftArm = this.makeLimb(-0.82, 1.92, 0.02, this.materials.runner);
    this.rightArm = this.makeLimb(0.82, 1.92, 0.02, this.materials.runner);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.035, 8, 48), this.materials.glowTeal);
    halo.position.y = 2.85;
    halo.rotation.x = Math.PI / 2;
    this.playerHalo = halo;

    this.player.add(shadow, hips, chest, head, this.leftLeg, this.rightLeg, this.leftArm, this.rightArm, halo);
    this.player.position.set(this.state.playerX, 0, PLAYER_Z);
    this.scene.add(this.player);
  }

  makeLimb(x, y, z, material) {
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.86, 10), material);
    limb.position.set(x, y, z);
    limb.castShadow = true;
    return limb;
  }

  bindButtons() {
    ui.startButton.addEventListener("click", () => this.startRun());
    ui.againButton.addEventListener("click", () => this.startRun());
    ui.pauseButton.addEventListener("click", () => this.togglePause());
    [ui.audioButton, ui.menuAudioButton, ui.resultAudioButton].forEach((button) => {
      button.addEventListener("click", () => this.audio.setEnabled(!this.audio.enabled));
    });
  }

  bindInput() {
    window.addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "ShiftLeft", "ShiftRight"].includes(event.code)) {
        event.preventDefault();
      }
      if (event.repeat) return;
      this.keys.add(event.code);
      if (event.code === "ArrowLeft" || event.code === "KeyA") this.moveLane(-1);
      if (event.code === "ArrowRight" || event.code === "KeyD") this.moveLane(1);
      if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") this.jump();
      if (event.code === "ShiftLeft" || event.code === "ShiftRight" || event.code === "KeyK") this.dash();
      if (event.code === "Enter" && this.state.mode !== "playing") this.startRun();
      if (event.code === "KeyP" || event.code === "Escape") this.togglePause();
      if (event.code === "KeyM") this.audio.setEnabled(!this.audio.enabled);
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });

    document.querySelectorAll("[data-touch]").forEach((button) => {
      const action = button.dataset.touch;
      const down = (event) => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        if (action === "left") this.moveLane(-1);
        if (action === "right") this.moveLane(1);
        if (action === "jump") this.jump();
        if (action === "dash") this.dash();
      };
      button.addEventListener("pointerdown", down);
    });
  }

  startRun(options = {}) {
    this.clearEntities();
    this.state = createState();
    this.state.mode = "playing";
    ui.menu.classList.remove("active");
    ui.results.classList.remove("active");
    ui.pauseButton.textContent = "II";
    if (!options.muted) {
      if (!this.audio.enabled) this.audio.setEnabled(true);
      else this.audio.unlock();
      this.audio.play("start");
    }
    this.showToast("Run gestartet", 1.1);
    this.spawnOpening();
    this.updateHud();
  }

  togglePause() {
    if (this.state.mode === "playing") {
      this.state.mode = "paused";
      ui.pauseButton.textContent = ">";
      this.showToast("Pause", 0.8);
    } else if (this.state.mode === "paused") {
      this.state.mode = "playing";
      ui.pauseButton.textContent = "II";
      this.showToast("Weiter", 0.8);
    }
  }

  endRun() {
    this.state.mode = "ended";
    const meters = Math.floor(this.state.distance);
    if (meters > this.state.best) {
      this.state.best = meters;
      localStorage.setItem("crypt-runner-best", String(meters));
      ui.resultTitle.textContent = "Neue Bestmarke";
    } else {
      ui.resultTitle.textContent = "Krypta geschlossen";
    }
    ui.resultCopy.textContent = `${meters.toLocaleString("de-DE")} m / ${Math.floor(this.state.score).toLocaleString("de-DE")} Punkte / ${this.state.relics} Relikte`;
    ui.results.classList.add("active");
    this.audio.play("impact");
  }

  spawnOpening() {
    this.makeEntity("crystal", 1, 26);
    this.makeEntity("crystal", 1, 34);
    this.makeEntity("obstacle", 0, 44);
    this.makeEntity("crystal", 2, 52);
    this.makeEntity("boost", 2, 62);
    this.state.nextSpawn = 78;
  }

  clearEntities() {
    this.entities.forEach((entity) => this.entityGroup.remove(entity.mesh));
    this.entities = [];
    this.particles.forEach((particle) => this.fxGroup.remove(particle.mesh));
    this.particles = [];
  }

  moveLane(direction) {
    if (this.state.mode !== "playing" && !this.demoMode) return;
    if (this.state.laneCooldown > 0) return;
    this.state.targetLane = clamp(this.state.targetLane + direction, 0, 2);
    this.state.laneCooldown = 0.08;
  }

  jump() {
    if (this.state.mode !== "playing") return;
    if (!this.state.grounded) return;
    this.state.grounded = false;
    this.state.playerVy = 12.8;
    this.audio.play("jump");
    this.spawnSpark(this.state.playerX, 0.3, PLAYER_Z + 0.7, 0x53e5d7, 7);
  }

  dash() {
    if (this.state.mode !== "playing") return;
    if (this.state.boost < 18 || this.state.dashTimer > 0.05) return;
    this.state.boost = Math.max(0, this.state.boost - 22);
    this.state.dashTimer = 0.42;
    this.state.surgeTimer = Math.max(this.state.surgeTimer, 0.9);
    this.state.invulnerable = 0.58;
    this.state.speed += 14;
    this.state.cameraShake = Math.max(this.state.cameraShake, 0.35);
    this.audio.play("dash", 1.02, 1);
    this.spawnSpark(this.state.playerX, 1.2, PLAYER_Z - 0.2, 0x8b6af8, 18);
  }

  makeEntity(type, lane, z) {
    const mesh = new THREE.Group();
    mesh.position.set(LANES[lane], 0, PLAYER_Z - (z - this.state.distance));
    const entity = {
      id: `${type}-${z}-${Math.random().toString(36).slice(2)}`,
      type,
      lane,
      z,
      mesh,
      hit: false,
      phase: Math.random() * Math.PI * 2
    };

    if (type === "crystal") this.buildCrystal(mesh);
    if (type === "boost") this.buildBoostRing(mesh);
    if (type === "relic") this.buildRelic(mesh);
    if (type === "obstacle") this.buildObelisk(mesh);
    if (type === "gate") this.buildLowGate(mesh);
    if (type === "spikes") this.buildSpikes(mesh);

    mesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.entityGroup.add(mesh);
    this.entities.push(entity);
    return entity;
  }

  buildCrystal(group) {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), this.materials.crystal);
    core.position.y = 1.65;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.035, 8, 42), this.materials.glowGold);
    ring.position.y = 1.65;
    ring.rotation.x = Math.PI / 2;
    group.add(core, ring);
  }

  buildBoostRing(group) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.12, 12, 64), this.materials.boost);
    ring.position.y = 1.55;
    ring.rotation.y = Math.PI / 2;
    const glow = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.035, 8, 64), this.materials.glowTeal);
    glow.position.y = 1.55;
    glow.rotation.y = Math.PI / 2;
    group.add(ring, glow);
  }

  buildRelic(group) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.2, 8), this.materials.obstacleTrim);
    base.position.y = 1.02;
    const idol = new THREE.Mesh(new THREE.DodecahedronGeometry(0.54, 0), this.materials.relic);
    idol.position.y = 1.46;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.42, 6), this.materials.glowGold);
    crown.position.y = 2.02;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.045, 8, 44), this.materials.glowTeal);
    halo.position.y = 1.52;
    halo.rotation.x = Math.PI / 2;
    group.add(base, idol, crown, halo);
  }

  buildObelisk(group) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 1.9), this.materials.obstacle);
    base.position.y = 0.25;
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.45, 3.1, 1.22), this.materials.obstacle);
    body.position.y = 1.85;
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.92, 1.2, 4), this.materials.obstacleTrim);
    top.position.y = 3.98;
    top.rotation.y = Math.PI / 4;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.7), this.materials.glowRed);
    glow.position.set(0, 2, 0.65);
    group.add(base, body, top, glow);
  }

  buildLowGate(group) {
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.7, 0.44), this.materials.obstacle);
    left.position.set(-1.58, 1.35, 0);
    const right = left.clone();
    right.position.x = 1.58;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.42, 0.58), this.materials.obstacleTrim);
    beam.position.y = 1.06;
    const warning = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.32), this.materials.glowRed);
    warning.position.set(0, 0.4, 0.35);
    group.add(left, right, beam, warning);
  }

  buildSpikes(group) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.24, 1.8), this.materials.obstacle);
    base.position.y = 0.12;
    group.add(base);
    for (let i = 0; i < 5; i += 1) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.1, 8), this.materials.spikes);
      spike.position.set(-1.1 + i * 0.55, 0.72, (i % 2) * 0.34 - 0.18);
      group.add(spike);
    }
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt);
    this.render();
  }

  update(dt) {
    if (this.state.mode === "playing") {
      this.updateSimulation(dt);
    } else {
      this.updateIdle(dt);
    }
    this.updateWorldPositions();
    this.updateEntities(dt);
    this.updateParticles(dt);
    this.updatePlayerVisuals(dt);
    this.updateCamera(dt);
    this.updateToast(dt);
    this.audio.update(this.state.speed, this.state.distance);
  }

  updateSimulation(dt) {
    const s = this.state;
    s.runTime += dt;
    s.laneCooldown = Math.max(0, s.laneCooldown - dt);
    s.invulnerable = Math.max(0, s.invulnerable - dt);
    s.dashTimer = Math.max(0, s.dashTimer - dt);
    s.surgeTimer = Math.max(0, s.surgeTimer - dt);
    s.damageFlash = Math.max(0, s.damageFlash - dt * 3.2);
    s.cameraShake = Math.max(0, s.cameraShake - dt * 2.5);
    const difficulty = 1 + s.distance / 2200;
    const surgeBonus = s.surgeTimer > 0 ? 5 : 0;
    s.targetSpeed = clamp(30 + difficulty * 4.2 + surgeBonus, 30, 70);
    s.speed = lerp(s.speed, s.targetSpeed + (s.dashTimer > 0 ? 22 : 0), 1 - Math.pow(0.002, dt));
    s.distance += s.speed * dt;
    s.score += s.speed * dt * (1.6 + s.streak * 0.035) * (s.surgeTimer > 0 ? 1.12 : 1);
    s.boost = clamp(s.boost + dt * (s.dashTimer > 0 ? -24 : 7.5), 0, 100);

    if (!s.grounded) {
      s.playerVy -= 28 * dt;
      s.playerY += s.playerVy * dt;
      if (s.playerY <= 0) {
        s.playerY = 0;
        s.playerVy = 0;
        s.grounded = true;
        this.spawnSpark(s.playerX, 0.16, PLAYER_Z, 0xf3bf56, 6);
      }
    }

    s.playerX = lerp(s.playerX, LANES[s.targetLane], 1 - Math.pow(0.0004, dt));
    if (Math.abs(s.playerX - LANES[s.targetLane]) < 0.04) {
      s.playerX = LANES[s.targetLane];
      s.lane = s.targetLane;
    }

    if (s.distance >= s.checkpoint) {
      s.checkpoint += 500;
      s.health = clamp(s.health + 6, 0, 100);
      s.boost = clamp(s.boost + 14, 0, 100);
      s.score += 900;
      this.audio.play("checkpoint");
      this.showToast("Siegel passiert", 1);
    }

    while (s.nextSpawn < s.distance + SPAWN_AHEAD) {
      this.spawnPattern(s.nextSpawn);
      const gap = clamp(20 - difficulty * 1.9 + Math.random() * 10, 11, 24);
      s.nextSpawn += gap;
    }

    if (this.demoMode) this.updateDemo(dt);
    this.updateHud();
    if (s.health <= 0) this.endRun();
  }

  updateDemo(dt) {
    const s = this.state;
    s.demoInputTimer -= dt;
    if (s.demoInputTimer > 0) return;
    const danger = this.entities
      .filter((entity) => !entity.hit && entity.z - s.distance > 14 && entity.z - s.distance < 55)
      .sort((a, b) => a.z - b.z)[0];
    if (danger && danger.type === "relic" && danger.lane !== s.targetLane) {
      s.targetLane = danger.lane;
      s.demoInputTimer = 0.32;
    } else if (danger && ["obstacle", "spikes"].includes(danger.type) && danger.lane === s.targetLane) {
      const options = [0, 1, 2].filter((lane) => lane !== danger.lane);
      s.targetLane = options[Math.floor(Math.random() * options.length)];
      s.demoInputTimer = 0.4;
    } else if (danger && danger.type === "gate" && danger.lane === s.targetLane) {
      this.jump();
      s.demoInputTimer = 0.5;
    } else if (s.boost > 74 && Math.random() > 0.5) {
      this.dash();
      s.demoInputTimer = 0.8;
    }
  }

  updateIdle(dt) {
    this.state.distance += dt * 6;
    this.state.playerX = lerp(this.state.playerX, LANES[this.state.targetLane], 1 - Math.pow(0.002, dt));
  }

  spawnPattern(z) {
    const roll = Math.random();
    const lane = Math.floor(Math.random() * 3);
    if (roll < 0.18) {
      this.makeEntity("crystal", lane, z);
      this.makeEntity("crystal", lane, z + 8);
      this.makeEntity("crystal", lane, z + 16);
    } else if (roll < 0.34) {
      this.makeEntity("boost", lane, z + 4);
      this.makeEntity("crystal", lane, z + 12);
    } else if (roll < 0.54) {
      this.makeEntity("obstacle", lane, z);
      this.makeEntity("crystal", (lane + 1 + Math.floor(Math.random() * 2)) % 3, z + 8);
    } else if (roll < 0.72) {
      this.makeEntity("gate", lane, z);
      this.makeEntity("crystal", lane, z + 10);
    } else if (roll < 0.84) {
      const relicLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
      this.makeEntity("obstacle", lane, z);
      this.makeEntity("relic", relicLane, z + 7);
      this.makeEntity("crystal", relicLane, z + 15);
    } else {
      const openLane = lane;
      [0, 1, 2].forEach((entryLane) => {
        if (entryLane !== openLane) this.makeEntity(Math.random() > 0.5 ? "spikes" : "obstacle", entryLane, z);
      });
      this.makeEntity("boost", openLane, z + 10);
    }
  }

  updateWorldPositions() {
    const offset = this.state.distance % ROAD_SEGMENT_LENGTH;
    const span = ROAD_SEGMENT_LENGTH * ROAD_SEGMENTS;
    this.roadSegments.forEach((segment) => {
      const index = segment.userData.index;
      let z = PLAYER_Z + 16 - index * ROAD_SEGMENT_LENGTH + offset;
      if (z > PLAYER_Z + 18) z -= span;
      segment.position.z = z;
    });

    const propOffset = this.state.distance % SIDE_PROP_SPACING;
    const propSpan = SIDE_PROP_SPACING * SIDE_PROP_COUNT;
    this.sideProps.forEach((prop) => {
      const index = prop.userData.index;
      let z = PLAYER_Z + 12 - index * SIDE_PROP_SPACING + propOffset;
      if (z > PLAYER_Z + 16) z -= propSpan;
      prop.position.z = z;
      prop.position.y = Math.sin((this.state.distance + index * 31) * 0.012) * 0.05;
    });
  }

  updateEntities(dt) {
    const alive = [];
    for (const entity of this.entities) {
      const rel = entity.z - this.state.distance;
      entity.mesh.position.x = LANES[entity.lane];
      entity.mesh.position.z = PLAYER_Z - rel;
      if (entity.type === "crystal") {
        entity.mesh.rotation.y += dt * 2.2;
        entity.mesh.children.forEach((child, index) => {
          child.position.y = 1.65 + Math.sin(this.state.runTime * 4 + entity.phase + index) * 0.08;
        });
      }
      if (entity.type === "boost") {
        entity.mesh.rotation.z += dt * 1.8;
      }
      if (entity.type === "relic") {
        entity.mesh.rotation.y += dt * 2.6;
        entity.mesh.position.y = Math.sin(this.state.runTime * 4.4 + entity.phase) * 0.1;
      }
      if (entity.type === "gate") {
        entity.mesh.position.y = Math.sin(this.state.runTime * 3 + entity.phase) * 0.035;
      }

      if (!entity.hit && rel < 1.35 && rel > -1.8 && Math.abs(this.state.playerX - LANES[entity.lane]) < 1.46) {
        this.collide(entity);
      }
      if (rel > DESPAWN_BEHIND) alive.push(entity);
      else this.entityGroup.remove(entity.mesh);
    }
    this.entities = alive;
  }

  collide(entity) {
    entity.hit = true;
    if (entity.type === "crystal") {
      this.state.streak += 1;
      this.state.score += 360 + this.state.streak * 80;
      this.state.boost = clamp(this.state.boost + 8, 0, 100);
      entity.mesh.visible = false;
      this.audio.play("pickup");
      this.spawnSpark(LANES[entity.lane], 1.45, PLAYER_Z, 0x9fe070, 12);
      if (this.state.streak % 6 === 0) this.showToast(`${this.state.streak}er Serie`, 0.9);
      return;
    }
    if (entity.type === "boost") {
      this.state.score += 640;
      this.state.boost = clamp(this.state.boost + 32, 0, 100);
      this.state.dashTimer = Math.max(this.state.dashTimer, 0.48);
      this.state.surgeTimer = Math.max(this.state.surgeTimer, 1.4);
      this.state.invulnerable = Math.max(this.state.invulnerable, 0.5);
      entity.mesh.visible = false;
      this.audio.play("surge");
      this.spawnSpark(LANES[entity.lane], 1.45, PLAYER_Z, 0x8b6af8, 20);
      return;
    }
    if (entity.type === "relic") {
      this.state.relics += 1;
      this.state.streak += 2;
      this.state.score += 1500 + this.state.streak * 120;
      this.state.health = clamp(this.state.health + 4, 0, 100);
      this.state.boost = clamp(this.state.boost + 18, 0, 100);
      this.state.surgeTimer = Math.max(this.state.surgeTimer, 1.6);
      entity.mesh.visible = false;
      this.audio.play("relic");
      this.spawnSpark(LANES[entity.lane], 1.45, PLAYER_Z, 0xf3bf56, 24);
      this.showToast("Relikt gesichert", 0.85);
      return;
    }

    const clearsGate = entity.type === "gate" && this.state.playerY > 1.05;
    const breaks = this.state.invulnerable > 0 || this.state.dashTimer > 0 || clearsGate;
    if (breaks) {
      this.state.score += entity.type === "gate" ? 740 : 520;
      this.spawnSpark(LANES[entity.lane], 1.0, PLAYER_Z, 0xf3bf56, 16);
      this.audio.play("surge", 0.96, 0.8);
      entity.mesh.visible = false;
      return;
    }

    this.state.health = Math.max(0, this.state.health - (entity.type === "spikes" ? 28 : 21));
    this.state.speed *= 0.62;
    this.state.streak = 0;
    this.state.damageFlash = 1;
    this.state.cameraShake = 1;
    this.state.invulnerable = 0.65;
    this.audio.play("impact");
    this.audio.play("curse", 0.92, 0.48);
    this.spawnSpark(LANES[entity.lane], 0.7, PLAYER_Z + 0.4, 0xe45454, 24);
    this.showToast("Treffer", 0.85);
  }

  spawnSpark(x, y, z, color, count) {
    const material = this.materials.particle;
    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.06 + Math.random() * 0.07, 8, 8), material.clone());
      mesh.material.color.setHex(color);
      mesh.position.set(x, y, z);
      this.fxGroup.add(mesh);
      this.particles.push({
        mesh,
        ttl: 0.45 + Math.random() * 0.45,
        age: 0,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          1.5 + Math.random() * 5,
          (Math.random() - 0.5) * 6
        )
      });
    }
  }

  updateParticles(dt) {
    const alive = [];
    for (const particle of this.particles) {
      particle.age += dt;
      if (particle.age >= particle.ttl) {
        this.fxGroup.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        particle.mesh.material.dispose();
        continue;
      }
      particle.velocity.y -= 8 * dt;
      particle.mesh.position.addScaledVector(particle.velocity, dt);
      const alpha = 1 - particle.age / particle.ttl;
      particle.mesh.material.opacity = alpha;
      particle.mesh.scale.setScalar(0.7 + alpha * 1.6);
      alive.push(particle);
    }
    this.particles = alive;
  }

  updatePlayerVisuals(dt) {
    const s = this.state;
    this.player.position.set(s.playerX, s.playerY, PLAYER_Z);
    this.player.rotation.z = lerp(this.player.rotation.z, (LANES[s.targetLane] - s.playerX) * 0.04, 1 - Math.pow(0.0001, dt));
    const stride = this.state.distance * 0.24;
    const legSwing = Math.sin(stride) * (s.grounded ? 0.62 : 0.18);
    const armSwing = Math.sin(stride + Math.PI) * (s.grounded ? 0.48 : 0.12);
    this.leftLeg.rotation.x = legSwing;
    this.rightLeg.rotation.x = -legSwing;
    this.leftArm.rotation.x = armSwing;
    this.rightArm.rotation.x = -armSwing;
    this.playerShadow.scale.setScalar(clamp(1.1 - s.playerY * 0.15, 0.62, 1.1));
    this.playerShadow.material.opacity = clamp(0.32 - s.playerY * 0.055, 0.06, 0.32);
    this.playerHalo.rotation.z += dt * (s.dashTimer > 0 || s.surgeTimer > 0 ? 8 : 2.2);
    this.playerHalo.material.opacity =
      s.dashTimer > 0 || s.surgeTimer > 0 ? 0.84 : 0.42 + Math.sin(this.state.runTime * 5) * 0.08;
  }

  updateCamera(dt) {
    const s = this.state;
    const shake = s.cameraShake > 0 ? s.cameraShake * 0.28 : 0;
    const camX = s.playerX * 0.28 + (Math.random() - 0.5) * shake;
    const camY = 5.5 + clamp(s.speed / 72, 0, 1) * 2.1 + s.playerY * 0.16;
    const camZ = PLAYER_Z + 10.8 + (Math.random() - 0.5) * shake;
    this.tmp.set(camX, camY, camZ);
    this.camera.position.lerp(this.tmp, 1 - Math.pow(0.0008, dt));
    this.cameraTarget.set(s.playerX * 0.18, 1.45 + s.playerY * 0.22, PLAYER_Z - 12.5);
    this.camera.lookAt(this.cameraTarget);
    this.camera.fov = lerp(
      this.camera.fov,
      62 + clamp(s.speed - 42, 0, 30) * 0.22 + (s.dashTimer > 0 ? 3 : 0) + (s.surgeTimer > 0 ? 1.4 : 0),
      1 - Math.pow(0.002, dt)
    );
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  updateHud() {
    const s = this.state;
    ui.distance.textContent = `${Math.floor(s.distance).toLocaleString("de-DE")} m`;
    ui.score.textContent = Math.floor(s.score).toLocaleString("de-DE");
    ui.speed.textContent = String(Math.round(s.speed * 3.1));
    ui.streak.textContent = String(s.streak);
    ui.health.style.transform = `scaleX(${clamp(s.health / 100, 0, 1)})`;
    ui.boost.style.transform = `scaleX(${clamp(s.boost / 100, 0, 1)})`;
    if (s.damageFlash > 0) {
      ui.shell.style.filter = `brightness(${1 + s.damageFlash * 0.22}) saturate(${1 + s.damageFlash * 0.25})`;
    } else {
      ui.shell.style.filter = "";
    }
  }

  showToast(text, duration) {
    ui.toast.textContent = text;
    ui.toast.classList.add("visible");
    this.state.toastTimer = duration;
  }

  updateToast(dt) {
    if (this.state.toastTimer <= 0) return;
    this.state.toastTimer -= dt;
    if (this.state.toastTimer <= 0) ui.toast.classList.remove("visible");
  }
}

window.cryptRunner3D = new CryptRunnerGame();
