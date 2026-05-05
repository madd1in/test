import * as THREE from "three";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distanceXZ = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

const ITEM_ORDER = [
  "broom",
  "cheese",
  "bellows",
  "crank",
  "clearWater",
  "pocketSpark",
  "owlFeather",
  "rubberMushroom",
  "gatePotion"
];

const ITEMS = {
  broom: { label: "Besen", icon: "B" },
  cheese: { label: "Mondkaese", icon: "K" },
  bellows: { label: "Blasebalg", icon: "L" },
  crank: { label: "Brunnenkurbel", icon: "C" },
  clearWater: { label: "Klares Wasser", icon: "W" },
  pocketSpark: { label: "Taschenglut", icon: "G" },
  owlFeather: { label: "Eulenfeder", icon: "F" },
  rubberMushroom: { label: "Gummipilz", icon: "P" },
  gatePotion: { label: "Portaltrank", icon: "T" }
};

const VERB_LABELS = {
  look: "Schau",
  take: "Nimm",
  use: "Benutz",
  push: "Schieb",
  talk: "Rede"
};

const ASSETS = {
  bgm: [
    "./assets/audio/bgm/marzipan-compass.mp3",
    "./assets/audio/bgm/sky-garden-relay.mp3"
  ],
  sfx: {
    collect: "./assets/audio/sfx/collect.mp3",
    switch: "./assets/audio/sfx/switch.mp3",
    error: "./assets/audio/sfx/error.mp3",
    portal: "./assets/audio/sfx/portal.mp3",
    push: "./assets/audio/sfx/push.mp3"
  },
  art: {
    kitchen: "./assets/art/alchemy-cellar.png",
    library: "./assets/art/tower-library.png",
    garden: "./assets/art/mushroom-glade.png",
    courtyard: "./assets/art/wizard-garden.png"
  }
};

const STAR_SEQUENCE = ["moon", "mushroom", "star"];
const STAR_LABELS = {
  moon: "Mond",
  frog: "Frosch",
  mushroom: "Pilz",
  candle: "Kerze",
  star: "Stern",
  boot: "Stiefel"
};

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
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
  texture.anisotropy = 2;
  return texture;
}

function paintStone(ctx, size) {
  const random = seededRandom(19);
  ctx.fillStyle = "#77746e";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 32) {
    for (let x = 0; x < size; x += 32) {
      const shade = 92 + Math.floor(random() * 38);
      ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade})`;
      ctx.fillRect(x + 1, y + 1, 30, 30);
      ctx.strokeStyle = "rgba(25, 24, 22, 0.45)";
      ctx.strokeRect(x + 0.5, y + 0.5, 31, 31);
    }
  }
  for (let i = 0; i < 140; i += 1) {
    ctx.fillStyle = random() > 0.55 ? "rgba(236, 220, 169, 0.18)" : "rgba(23, 32, 26, 0.18)";
    ctx.fillRect(random() * size, random() * size, 1 + random() * 3, 1 + random() * 3);
  }
}

function paintGrass(ctx, size) {
  const random = seededRandom(33);
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#506b55");
  gradient.addColorStop(0.48, "#87965b");
  gradient.addColorStop(1, "#33433b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 160; i += 1) {
    ctx.strokeStyle = random() > 0.5 ? "rgba(205, 204, 134, 0.28)" : "rgba(26, 45, 31, 0.34)";
    ctx.beginPath();
    const x = random() * size;
    const y = random() * size;
    ctx.moveTo(x, y);
    ctx.lineTo(x + random() * 10 - 5, y + random() * 12 - 6);
    ctx.stroke();
  }
}

function paintWood(ctx, size) {
  const random = seededRandom(51);
  const gradient = ctx.createLinearGradient(0, 0, size, 0);
  gradient.addColorStop(0, "#6f4b2c");
  gradient.addColorStop(0.5, "#9c7041");
  gradient.addColorStop(1, "#4a3324");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  for (let y = 12; y < size; y += 24) {
    ctx.strokeStyle = "rgba(37, 25, 19, 0.44)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y + random() * 4);
    ctx.bezierCurveTo(size * 0.25, y - 8, size * 0.7, y + 10, size, y + random() * 4);
    ctx.stroke();
  }
}

function paintSign(ctx, size, clean) {
  paintWood(ctx, size);
  ctx.fillStyle = clean ? "rgba(244, 228, 169, 0.94)" : "rgba(45, 38, 31, 0.45)";
  ctx.fillRect(20, 26, size - 40, size - 52);
  ctx.strokeStyle = "rgba(47, 29, 18, 0.72)";
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 26, size - 40, size - 52);
  ctx.fillStyle = clean ? "#2d241b" : "rgba(32, 29, 24, 0.8)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = clean ? "bold 33px sans-serif" : "bold 30px sans-serif";
  const lines = clean ? ["MOND", "PILZ", "STERN"] : ["STAUB", "STAUB", "STAUB"];
  lines.forEach((line, index) => ctx.fillText(line, size / 2, 72 + index * 58));
  if (!clean) {
    const random = seededRandom(71);
    for (let i = 0; i < 65; i += 1) {
      ctx.fillStyle = `rgba(222, 215, 183, ${0.12 + random() * 0.18})`;
      ctx.beginPath();
      ctx.arc(random() * size, random() * size, 5 + random() * 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function paintStarMap(ctx, size) {
  ctx.fillStyle = "#151d2a";
  ctx.fillRect(0, 0, size, size);
  const random = seededRandom(88);
  for (let i = 0; i < 140; i += 1) {
    ctx.fillStyle = random() > 0.82 ? "#f1d07a" : "#8fc4dc";
    ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
  }
  ctx.strokeStyle = "rgba(217, 169, 69, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 90);
  ctx.lineTo(130, 150);
  ctx.lineTo(218, 104);
  ctx.lineTo(184, 214);
  ctx.lineTo(78, 220);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = "#e7d9a6";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("MOND", 64, 54);
  ctx.fillText("PILZ", 142, 252);
  ctx.fillText("STERN", 220, 54);
}

function paintLabel(ctx, size, text, bg = "#30251e", fg = "#f3e4b5") {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 38px sans-serif";
  const words = text.split(" ");
  words.forEach((word, index) => {
    ctx.fillText(word, size / 2, size / 2 + (index - (words.length - 1) / 2) * 42);
  });
}

class MurrwaldGame {
  constructor() {
    this.shell = document.getElementById("game-shell");
    this.canvas = document.getElementById("scene");
    this.ui = {
      objective: document.getElementById("objective-text"),
      location: document.getElementById("location-label"),
      hover: document.getElementById("hover-label"),
      dialogue: document.getElementById("dialogue"),
      speaker: document.getElementById("speaker-label"),
      line: document.getElementById("dialogue-line"),
      action: document.getElementById("action-readout"),
      inventory: document.getElementById("inventory-list"),
      guideButton: document.getElementById("guide-button"),
      guideStep: document.getElementById("guide-step"),
      guideTarget: document.getElementById("guide-target"),
      guideAction: document.getElementById("guide-action"),
      questPointer: document.getElementById("quest-pointer"),
      questPointerLabel: document.getElementById("quest-pointer-label"),
      startScreen: document.getElementById("start-screen"),
      finishScreen: document.getElementById("finish-screen"),
      startButton: document.getElementById("start-button"),
      againButton: document.getElementById("again-button"),
      audioButton: document.getElementById("audio-button"),
      fullscreenButton: document.getElementById("fullscreen-button"),
      starPanel: document.getElementById("star-panel"),
      starReadout: document.getElementById("star-readout"),
      starReset: document.getElementById("star-reset"),
      starClose: document.getElementById("star-close"),
      verbButtons: Array.from(document.querySelectorAll(".verb-button"))
    };

    this.locations = {
      courtyard: {
        label: "Hof",
        center: new THREE.Vector3(0, 0, 0),
        camera: new THREE.Vector3(8.5, 8.8, 11.5),
        target: new THREE.Vector3(0, 0.9, 0),
        bounds: { minX: -6.2, maxX: 6.2, minZ: -6.6, maxZ: 5.6 },
        entry: new THREE.Vector3(0, 0, 2.2),
        objective: "Repariere das Portal mit Wasser, Feder und Glut."
      },
      kitchen: {
        label: "Kueche",
        center: new THREE.Vector3(-16, 0, 2),
        camera: new THREE.Vector3(-23.2, 7.8, 11.2),
        target: new THREE.Vector3(-16, 0.8, 2),
        bounds: { minX: -21.4, maxX: -10.6, minZ: -3.8, maxZ: 7.2 },
        entry: new THREE.Vector3(-14.2, 0, 5.2),
        objective: "Suche brauchbare Zutaten, ohne die Kueche anzuzuenden."
      },
      library: {
        label: "Turmbibliothek",
        center: new THREE.Vector3(16, 0, 2),
        camera: new THREE.Vector3(9.1, 8.4, 11.8),
        target: new THREE.Vector3(16, 0.95, 2),
        bounds: { minX: 10.4, maxX: 21.6, minZ: -3.8, maxZ: 7.2 },
        entry: new THREE.Vector3(14.3, 0, 5.1),
        objective: "Die Sternkarte wirkt beleidigt. Irgendwo muss die Reihenfolge stehen."
      },
      garden: {
        label: "Pilzgarten",
        center: new THREE.Vector3(0, 0, -15),
        camera: new THREE.Vector3(8.2, 7.8, -5.8),
        target: new THREE.Vector3(0, 0.8, -15),
        bounds: { minX: -6.6, maxX: 6.6, minZ: -20.8, maxZ: -9.8 },
        entry: new THREE.Vector3(0, 0, -11.5),
        objective: "Ein guter Ort fuer Hinweise. Und fuer Dinge, die quieken."
      }
    };

    this.state = {
      running: false,
      location: "courtyard",
      activeVerb: "use",
      selectedItem: null,
      inventory: new Set(),
      flags: {},
      starInput: [],
      audioEnabled: false,
      guide: null,
      pushBlockTarget: null
    };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x16191a);
    this.scene.fog = new THREE.Fog(0x151617, 18, 48);
    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.clock = new THREE.Clock();
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.groundMeshes = [];
    this.pickables = [];
    this.animatables = [];
    this.interactives = new Map();
    this.visuals = {};
    this.keys = new Set();
    this.walkTarget = null;
    this.pendingAction = null;
    this.hoveredId = null;
    this.cameraLook = new THREE.Vector3();
    this.audio = { context: null, bgm: null, sfx: {} };

    this.createTextures();
    this.createMaterials();
    this.createLights();
    this.createWorld();
    this.createPlayer();
    this.createHoverMarker();
    this.createGuideMarker();
    this.bindUI();
    this.resetGame();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.animate();
  }

  createTextures() {
    this.textures = {
      stone: makeCanvasTexture(256, paintStone, 3, 3),
      grass: makeCanvasTexture(256, paintGrass, 3, 3),
      wood: makeCanvasTexture(256, paintWood, 2, 2),
      dirtySign: makeCanvasTexture(256, (ctx, size) => paintSign(ctx, size, false)),
      cleanSign: makeCanvasTexture(256, (ctx, size) => paintSign(ctx, size, true)),
      starMap: makeCanvasTexture(256, paintStarMap),
      labelKitchen: makeCanvasTexture(256, (ctx, size) => paintLabel(ctx, size, "KUECHE")),
      labelLibrary: makeCanvasTexture(256, (ctx, size) => paintLabel(ctx, size, "TURM")),
      labelGarden: makeCanvasTexture(256, (ctx, size) => paintLabel(ctx, size, "PILZE")),
      labelBack: makeCanvasTexture(256, (ctx, size) => paintLabel(ctx, size, "ZURUECK"))
    };
    const loader = new THREE.TextureLoader();
    this.assetTextures = {};
    Object.entries(ASSETS.art).forEach(([key, url]) => {
      const texture = loader.load(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 2;
      this.assetTextures[key] = texture;
    });
  }

  createMaterials() {
    this.materials = {
      stone: new THREE.MeshStandardMaterial({ map: this.textures.stone, roughness: 0.86 }),
      grass: new THREE.MeshStandardMaterial({ map: this.textures.grass, roughness: 0.92 }),
      wood: new THREE.MeshStandardMaterial({ map: this.textures.wood, roughness: 0.8 }),
      darkWood: new THREE.MeshStandardMaterial({ color: 0x563927, roughness: 0.82 }),
      brass: new THREE.MeshStandardMaterial({ color: 0xd9a945, roughness: 0.42, metalness: 0.25 }),
      moss: new THREE.MeshStandardMaterial({ color: 0x78a06c, roughness: 0.76 }),
      wine: new THREE.MeshStandardMaterial({ color: 0x8f3858, roughness: 0.72 }),
      blue: new THREE.MeshStandardMaterial({ color: 0x79a9c9, roughness: 0.58, metalness: 0.08 }),
      parchment: new THREE.MeshStandardMaterial({ color: 0xd7c995, roughness: 0.8 }),
      soot: new THREE.MeshStandardMaterial({ color: 0x262323, roughness: 0.92 }),
      black: new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.75 }),
      robe: new THREE.MeshStandardMaterial({ color: 0x425e92, roughness: 0.68 }),
      hat: new THREE.MeshStandardMaterial({ color: 0x7c4964, roughness: 0.7 }),
      skin: new THREE.MeshStandardMaterial({ color: 0xe0bb82, roughness: 0.64 }),
      cheese: new THREE.MeshStandardMaterial({ color: 0xf0ca55, roughness: 0.55 }),
      spark: new THREE.MeshStandardMaterial({
        color: 0xffbc55,
        emissive: 0xff7b18,
        emissiveIntensity: 1.2,
        roughness: 0.34
      }),
      portal: new THREE.MeshStandardMaterial({
        color: 0x79a9c9,
        emissive: 0x226d94,
        emissiveIntensity: 0.75,
        roughness: 0.35,
        transparent: true,
        opacity: 0.78
      }),
      potion: new THREE.MeshStandardMaterial({
        color: 0xa7d66f,
        emissive: 0x4f8d38,
        emissiveIntensity: 0.8,
        roughness: 0.42
      }),
      guide: new THREE.MeshBasicMaterial({
        color: 0xefc765,
        transparent: true,
        opacity: 0.78
      }),
      pressurePlate: new THREE.MeshStandardMaterial({
        color: 0x54706e,
        emissive: 0x1d585d,
        emissiveIntensity: 0.35,
        roughness: 0.52,
        metalness: 0.15
      }),
      pressurePlateSolved: new THREE.MeshStandardMaterial({
        color: 0xe1b45a,
        emissive: 0xb06d18,
        emissiveIntensity: 1.1,
        roughness: 0.38,
        metalness: 0.25
      }),
      switchOff: new THREE.MeshStandardMaterial({ color: 0x684b3a, roughness: 0.72 }),
      switchOn: new THREE.MeshStandardMaterial({
        color: 0xd9a945,
        emissive: 0x9d5f18,
        emissiveIntensity: 0.75,
        roughness: 0.38
      })
    };
  }

  createLights() {
    const hemi = new THREE.HemisphereLight(0xdde8ff, 0x443a2b, 1.65);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffedc1, 2.15);
    sun.position.set(7, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -24;
    this.scene.add(sun);

    const blueFill = new THREE.PointLight(0x79a9c9, 1.4, 30);
    blueFill.position.set(0, 5, -8);
    this.scene.add(blueFill);
  }

  createWorld() {
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.createCourtyard();
    this.createKitchen();
    this.createLibrary();
    this.createGarden();
    this.createSkyBits();
  }

  createBase(locationKey, width, depth, material, y = -0.12) {
    const loc = this.locations[locationKey];
    const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.24, depth), material);
    base.position.set(loc.center.x, y, loc.center.z);
    base.receiveShadow = true;
    base.userData.ground = true;
    base.userData.location = locationKey;
    this.world.add(base);
    this.groundMeshes.push(base);
    this.pickables.push(base);

    const borderMat = this.materials.darkWood;
    const north = this.makeBox(width, 0.45, 0.28, borderMat, loc.center.x, 0.15, loc.center.z - depth / 2);
    const south = this.makeBox(width, 0.45, 0.28, borderMat, loc.center.x, 0.15, loc.center.z + depth / 2);
    const west = this.makeBox(0.28, 0.45, depth, borderMat, loc.center.x - width / 2, 0.15, loc.center.z);
    const east = this.makeBox(0.28, 0.45, depth, borderMat, loc.center.x + width / 2, 0.15, loc.center.z);
    [north, south, west, east].forEach((mesh) => this.world.add(mesh));
    return base;
  }

  createArtBackdrop(locationKey, textureKey, x, y, z, rotationY, width = 5.2, height = 3.1) {
    const texture = this.assetTextures[textureKey];
    if (!texture) return;
    const frame = new THREE.Group();
    frame.position.set(x, y, z);
    frame.rotation.y = rotationY;
    frame.add(this.makeBox(width + 0.34, height + 0.34, 0.12, this.materials.darkWood, 0, 0, -0.04));
    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.64, emissive: 0x22170f, emissiveIntensity: 0.12 })
    );
    art.position.z = 0.05;
    frame.add(art);
    frame.userData.location = locationKey;
    this.world.add(frame);
  }

  createMagicMotifs(locationKey, center, count, colors) {
    const random = seededRandom(locationKey.length * 99 + count);
    const points = [];
    for (let i = 0; i < count; i += 1) {
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.74
      });
      const mote = new THREE.Mesh(new THREE.SphereGeometry(0.035 + random() * 0.045, 8, 6), mat);
      mote.position.set(center.x - 4.6 + random() * 9.2, 1.2 + random() * 2.6, center.z - 4.4 + random() * 8.8);
      mote.userData.baseY = mote.position.y;
      mote.userData.phase = random() * Math.PI * 2;
      this.world.add(mote);
      points.push(mote);
    }
    this.animatables.push((dt, elapsed) => {
      points.forEach((mote, index) => {
        mote.position.y = mote.userData.baseY + Math.sin(elapsed * 1.4 + mote.userData.phase) * 0.16;
        mote.material.opacity = 0.45 + Math.sin(elapsed * 2.2 + index) * 0.18;
      });
    });
  }

  createCourtyard() {
    this.createBase("courtyard", 13.2, 12.8, this.materials.stone);
    this.createArtBackdrop("courtyard", "courtyard", -6.42, 2.0, -1.8, Math.PI / 2, 3.8, 2.4);
    this.createMagicMotifs("courtyard", this.locations.courtyard.center, 28, [0xefc765, 0x79a9c9, 0x9d4662]);

    const pathMat = new THREE.MeshStandardMaterial({ color: 0xa08e73, roughness: 0.86 });
    this.world.add(this.makeBox(2.2, 0.04, 11.4, pathMat, 0, 0.02, -0.4));
    this.world.add(this.makeBox(10.8, 0.04, 2.0, pathMat, 0, 0.03, 2.2));

    const gate = new THREE.Group();
    gate.position.set(0, 0, -5.55);
    gate.add(this.makeBox(0.65, 3.1, 0.55, this.materials.stone, -1.45, 1.45, 0));
    gate.add(this.makeBox(0.65, 3.1, 0.55, this.materials.stone, 1.45, 1.45, 0));
    gate.add(this.makeBox(3.5, 0.55, 0.6, this.materials.stone, 0, 3.05, 0));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.08, 16, 96), this.materials.portal);
    ring.position.set(0, 1.48, 0.05);
    ring.rotation.x = Math.PI / 2;
    gate.add(ring);
    const disk = new THREE.Mesh(new THREE.CircleGeometry(1.05, 48), this.materials.portal);
    disk.position.set(0, 1.48, 0.08);
    disk.rotation.x = Math.PI;
    gate.add(disk);
    this.visuals.portalRing = ring;
    this.visuals.portalDisk = disk;
    this.addInteractive("moon-gate", gate, {
      label: "Murrportal",
      kind: "gate",
      location: "courtyard",
      interactPoint: new THREE.Vector3(0, 0, -4.05)
    });

    const well = new THREE.Group();
    well.position.set(-3.8, 0, -1.2);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.78, 28), this.materials.stone);
    wall.castShadow = true;
    wall.receiveShadow = true;
    well.add(wall);
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.62, 32), this.materials.blue);
    water.position.y = 0.42;
    water.rotation.x = -Math.PI / 2;
    well.add(water);
    const posts = new THREE.Group();
    posts.add(this.makeBox(0.16, 1.6, 0.16, this.materials.wood, -0.72, 0.95, 0));
    posts.add(this.makeBox(0.16, 1.6, 0.16, this.materials.wood, 0.72, 0.95, 0));
    posts.add(this.makeBox(1.75, 0.15, 0.15, this.materials.wood, 0, 1.68, 0));
    well.add(posts);
    const handle = new THREE.Group();
    handle.add(this.makeBox(0.95, 0.11, 0.11, this.materials.brass, 0, 1.27, 0.62));
    handle.add(this.makeBox(0.12, 0.46, 0.12, this.materials.brass, 0.45, 1.1, 0.62));
    handle.visible = false;
    well.add(handle);
    this.visuals.wellHandle = handle;
    this.addInteractive("well", well, {
      label: "Brunnen",
      kind: "prop",
      location: "courtyard",
      interactPoint: new THREE.Vector3(-3.0, 0, -0.35)
    });

    const sign = new THREE.Group();
    sign.position.set(3.9, 0, -2.0);
    sign.add(this.makeBox(0.18, 1.2, 0.18, this.materials.darkWood, 0, 0.55, 0));
    const boardMat = new THREE.MeshStandardMaterial({ map: this.textures.dirtySign, roughness: 0.76 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.06, 0.12), boardMat);
    board.position.set(0, 1.22, 0);
    board.rotation.y = -0.24;
    board.castShadow = true;
    sign.add(board);
    this.visuals.signBoard = board;
    this.addInteractive("dusty-sign", sign, {
      label: "Staubiges Schild",
      kind: "prop",
      location: "courtyard",
      interactPoint: new THREE.Vector3(3.35, 0, -1.25)
    });

    const broom = new THREE.Group();
    broom.position.set(3.7, 0.08, 2.75);
    const handleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.8, 10), this.materials.wood);
    handleMesh.rotation.z = 0.72;
    handleMesh.position.set(0, 0.55, 0);
    broom.add(handleMesh);
    const brush = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 10), this.materials.brass);
    brush.position.set(-0.48, 0.06, 0);
    brush.rotation.z = 0.72;
    broom.add(brush);
    this.visuals.broom = broom;
    this.addInteractive("broom", broom, {
      label: "Besen",
      kind: "item",
      item: "broom",
      location: "courtyard",
      interactPoint: new THREE.Vector3(3.35, 0, 2.25)
    });

    const gargoyle = new THREE.Group();
    gargoyle.position.set(-4.3, 0, 3.0);
    gargoyle.add(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.62, 0.85, 16), this.materials.stone));
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.62, 0.72), this.materials.stone);
    head.position.y = 0.82;
    gargoyle.add(head);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 8), this.materials.stone);
    nose.position.set(0, 0.84, 0.49);
    nose.rotation.x = Math.PI / 2;
    gargoyle.add(nose);
    const wingL = this.makeBox(0.12, 0.72, 0.9, this.materials.stone, -0.58, 0.72, -0.18);
    const wingR = this.makeBox(0.12, 0.72, 0.9, this.materials.stone, 0.58, 0.72, -0.18);
    wingL.rotation.z = 0.42;
    wingR.rotation.z = -0.42;
    gargoyle.add(wingL, wingR);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x9d4662, emissive: 0x4c1028, emissiveIntensity: 0.6 });
    gargoyle.add(this.makeSphere(0.06, eyeMat, -0.18, 0.95, 0.38));
    gargoyle.add(this.makeSphere(0.06, eyeMat, 0.18, 0.95, 0.38));
    this.visuals.gargoyle = gargoyle;
    this.addInteractive("gargoyle", gargoyle, {
      label: "Gargoyle",
      kind: "npc",
      location: "courtyard",
      interactPoint: new THREE.Vector3(-3.55, 0, 3.05)
    });

    this.createSwitchPuzzle();

    this.createDoor("door-kitchen", "courtyard", "Kuechentuer", "kitchen", -5.9, 0, 2.2, Math.PI / 2, this.textures.labelKitchen);
    this.createDoor("door-library", "courtyard", "Turmtuer", "library", 5.9, 0, 2.2, -Math.PI / 2, this.textures.labelLibrary);
    this.createDoor("door-garden", "courtyard", "Pilzpfad", "garden", 0, 0, -6.1, 0, this.textures.labelGarden);
  }

  createSwitchPuzzle() {
    this.pushPuzzle = {
      goal: new THREE.Vector3(4.2, 0, -3.9),
      start: new THREE.Vector3(2.35, 0, -0.85)
    };

    const plate = new THREE.Group();
    plate.position.copy(this.pushPuzzle.goal);
    const plateMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.08, 28), this.materials.pressurePlate);
    plateMesh.position.y = 0.05;
    plateMesh.castShadow = true;
    plateMesh.receiveShadow = true;
    plate.add(plateMesh);
    const plateRing = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.035, 8, 44), this.materials.guide);
    plateRing.position.y = 0.12;
    plateRing.rotation.x = Math.PI / 2;
    plate.add(plateRing);
    this.visuals.pushPlate = plateMesh;
    this.visuals.pushPlateRing = plateRing;
    this.addInteractive("pressure-plate", plate, {
      label: "Druckplatte",
      kind: "prop",
      location: "courtyard",
      interactPoint: new THREE.Vector3(3.6, 0, -3.25)
    });

    const block = new THREE.Group();
    block.position.copy(this.pushPuzzle.start);
    block.add(this.makeBox(0.96, 0.96, 0.96, this.materials.stone, 0, 0.5, 0));
    const rune = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 8, 32), this.materials.brass);
    rune.position.set(0, 0.76, 0.5);
    rune.rotation.x = Math.PI / 2;
    block.add(rune);
    this.visuals.pushBlock = block;
    this.addInteractive("push-block", block, {
      label: "Runenblock",
      kind: "push",
      location: "courtyard",
      interactPoint: new THREE.Vector3(2.35, 0, -0.05)
    });

    const makeSwitch = (id, label, x, z, side) => {
      const lever = new THREE.Group();
      lever.position.set(x, 0, z);
      lever.add(this.makeBox(0.64, 0.18, 0.64, this.materials.darkWood, 0, 0.12, 0));
      const stick = this.makeBox(0.15, 0.9, 0.15, this.materials.switchOff, 0, 0.62, 0);
      stick.rotation.z = side * 0.42;
      lever.add(stick);
      const knob = this.makeSphere(0.18, this.materials.brass, side * 0.25, 1.03, 0);
      lever.add(knob);
      this.visuals[id] = { stick, knob };
      this.addInteractive(id, lever, {
        label,
        kind: "switch",
        location: "courtyard",
        interactPoint: new THREE.Vector3(x, 0, z + 0.74)
      });
    };

    makeSwitch("left-switch", "Linker Schalter", -4.55, -4.35, -1);
    makeSwitch("right-switch", "Rechter Schalter", 4.95, 0.95, 1);
  }

  createKitchen() {
    this.createBase("kitchen", 11.6, 11.6, this.materials.wood);
    const c = this.locations.kitchen.center;
    this.createArtBackdrop("kitchen", "kitchen", c.x, 2.55, c.z - 5.36, 0, 4.2, 2.5);
    this.createMagicMotifs("kitchen", c, 18, [0xefc765, 0xff7b18, 0x78a06c]);

    this.world.add(this.makeBox(10.4, 2.6, 0.42, this.materials.stone, c.x, 1.22, c.z - 5.2));
    this.world.add(this.makeBox(0.42, 2.4, 9.6, this.materials.stone, c.x - 5.1, 1.1, c.z));
    this.world.add(this.makeBox(0.42, 2.4, 9.6, this.materials.stone, c.x + 5.1, 1.1, c.z));

    const cauldron = new THREE.Group();
    cauldron.position.set(c.x - 0.7, 0, c.z - 1.1);
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.95, 28, 18, 0, Math.PI * 2, 0.35, Math.PI * 0.72), this.materials.black);
    pot.scale.y = 0.78;
    pot.castShadow = true;
    pot.receiveShadow = true;
    cauldron.add(pot);
    const brew = new THREE.Mesh(new THREE.CircleGeometry(0.72, 28), this.materials.potion);
    brew.position.y = 0.68;
    brew.rotation.x = -Math.PI / 2;
    brew.visible = false;
    cauldron.add(brew);
    this.visuals.cauldronBrew = brew;
    const steam = [];
    for (let i = 0; i < 7; i += 1) {
      const bubble = this.makeSphere(0.08 + i * 0.008, this.materials.portal, -0.42 + i * 0.14, 0.86 + (i % 3) * 0.08, -0.08 + (i % 2) * 0.18);
      bubble.visible = false;
      cauldron.add(bubble);
      steam.push(bubble);
    }
    this.visuals.cauldronSteam = steam;
    this.animatables.push((dt, elapsed) => {
      steam.forEach((bubble, index) => {
        bubble.position.y = 0.86 + ((elapsed * 0.55 + index * 0.22) % 0.55);
        bubble.material.opacity = 0.45;
      });
    });
    this.addInteractive("cauldron", cauldron, {
      label: "Kessel",
      kind: "prop",
      location: "kitchen",
      interactPoint: new THREE.Vector3(c.x - 0.7, 0, c.z + 0.25)
    });

    const oven = new THREE.Group();
    oven.position.set(c.x + 3.45, 0, c.z - 3.55);
    oven.add(this.makeBox(2.2, 1.5, 1.25, this.materials.stone, 0, 0.72, 0));
    const mouth = this.makeBox(1.22, 0.58, 0.08, this.materials.soot, 0, 0.58, 0.66);
    oven.add(mouth);
    const ember = this.makeSphere(0.22, this.materials.spark, 0, 0.58, 0.75);
    ember.visible = false;
    oven.add(ember);
    this.visuals.ovenEmber = ember;
    this.addInteractive("oven", oven, {
      label: "Schlafender Ofen",
      kind: "prop",
      location: "kitchen",
      interactPoint: new THREE.Vector3(c.x + 2.65, 0, c.z - 2.7)
    });

    const shelf = new THREE.Group();
    shelf.position.set(c.x - 3.8, 0, c.z - 3.85);
    shelf.add(this.makeBox(2.6, 0.18, 0.72, this.materials.darkWood, 0, 0.8, 0));
    shelf.add(this.makeBox(2.6, 0.18, 0.72, this.materials.darkWood, 0, 1.42, 0));
    shelf.add(this.makeBox(0.18, 1.45, 0.72, this.materials.darkWood, -1.2, 0.8, 0));
    shelf.add(this.makeBox(0.18, 1.45, 0.72, this.materials.darkWood, 1.2, 0.8, 0));
    const jars = [-0.72, 0, 0.72].map((x, index) => {
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.42, 12), index === 1 ? this.materials.wine : this.materials.blue);
      jar.position.set(x, 1.1, 0.02);
      jar.castShadow = true;
      shelf.add(jar);
      return jar;
    });
    this.visuals.shelfJars = jars;
    this.addInteractive("shelf", shelf, {
      label: "Regal",
      kind: "prop",
      location: "kitchen",
      interactPoint: new THREE.Vector3(c.x - 3.0, 0, c.z - 3.05)
    });

    const cheese = new THREE.Group();
    cheese.position.set(c.x - 4.2, 1.62, c.z - 3.8);
    const cheeseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 3), this.materials.cheese);
    cheeseMesh.rotation.y = Math.PI / 6;
    cheese.add(cheeseMesh);
    this.visuals.cheese = cheese;
    this.addInteractive("cheese", cheese, {
      label: "Mondkaese",
      kind: "item",
      item: "cheese",
      location: "kitchen",
      interactPoint: new THREE.Vector3(c.x - 3.1, 0, c.z - 3.05)
    });

    const bellows = new THREE.Group();
    bellows.position.set(c.x + 1.9, 0.2, c.z + 3.45);
    bellows.add(this.makeBox(0.9, 0.28, 0.48, this.materials.wood, 0, 0.15, 0));
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.62, 12), this.materials.brass);
    nozzle.rotation.z = -Math.PI / 2;
    nozzle.position.set(0.62, 0.16, 0);
    bellows.add(nozzle);
    this.visuals.bellows = bellows;
    this.addInteractive("bellows", bellows, {
      label: "Blasebalg",
      kind: "item",
      item: "bellows",
      location: "kitchen",
      interactPoint: new THREE.Vector3(c.x + 1.55, 0, c.z + 2.65)
    });

    const table = new THREE.Group();
    table.position.set(c.x - 2.6, 0, c.z + 2.45);
    table.add(this.makeBox(2.8, 0.18, 1.35, this.materials.darkWood, 0, 0.85, 0));
    [-1.1, 1.1].forEach((x) => {
      [-0.48, 0.48].forEach((z) => table.add(this.makeBox(0.14, 0.9, 0.14, this.materials.wood, x, 0.42, z)));
    });
    this.addInteractive("kitchen-table", table, {
      label: "Kuechentisch",
      kind: "prop",
      location: "kitchen",
      interactPoint: new THREE.Vector3(c.x - 2.6, 0, c.z + 1.45)
    });

    this.createDoor("door-kitchen-back", "kitchen", "Hofausgang", "courtyard", c.x, 0, c.z + 5.32, Math.PI, this.textures.labelBack);
  }

  createLibrary() {
    this.createBase("library", 11.6, 11.6, this.materials.stone);
    const c = this.locations.library.center;
    this.createArtBackdrop("library", "library", c.x, 2.55, c.z - 5.36, 0, 4.4, 2.5);
    this.createMagicMotifs("library", c, 24, [0x79a9c9, 0xefc765, 0xf4efe2]);

    const towerRing = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.08, 12, 80), this.materials.brass);
    towerRing.position.set(c.x, 0.06, c.z);
    towerRing.rotation.x = Math.PI / 2;
    this.world.add(towerRing);

    const map = new THREE.Group();
    map.position.set(c.x, 0, c.z - 4.7);
    map.add(this.makeBox(2.85, 2.0, 0.18, this.materials.darkWood, 0, 1.45, 0));
    const mapFace = new THREE.Mesh(
      new THREE.PlaneGeometry(2.35, 1.55),
      new THREE.MeshStandardMaterial({ map: this.textures.starMap, roughness: 0.65, emissive: 0x111a28, emissiveIntensity: 0.25 })
    );
    mapFace.position.set(0, 1.45, 0.11);
    map.add(mapFace);
    this.addInteractive("star-map", map, {
      label: "Sternkarte",
      kind: "prop",
      location: "library",
      interactPoint: new THREE.Vector3(c.x, 0, c.z - 3.45)
    });

    const chest = new THREE.Group();
    chest.position.set(c.x - 3.55, 0, c.z - 1.55);
    chest.add(this.makeBox(1.45, 0.72, 0.94, this.materials.darkWood, 0, 0.36, 0));
    const band = this.makeBox(1.55, 0.16, 1.02, this.materials.brass, 0, 0.68, 0);
    chest.add(band);
    const lid = this.makeBox(1.52, 0.18, 0.98, this.materials.wood, 0, 0.82, -0.02);
    lid.geometry.translate(0, 0, -0.42);
    lid.position.z = 0.42;
    chest.add(lid);
    const glow = this.makeSphere(0.28, this.materials.spark, 0, 0.85, 0);
    glow.visible = false;
    chest.add(glow);
    this.visuals.chest = chest;
    this.visuals.chestLid = lid;
    this.visuals.chestGlow = glow;
    this.addInteractive("chest", chest, {
      label: "Truhe",
      kind: "prop",
      location: "library",
      interactPoint: new THREE.Vector3(c.x - 2.62, 0, c.z - 1.05)
    });

    const owl = new THREE.Group();
    owl.position.set(c.x + 3.45, 0, c.z - 1.85);
    owl.add(this.makeBox(0.45, 1.4, 0.45, this.materials.wood, 0, 0.7, 0));
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 16), this.materials.wine);
    body.position.y = 1.55;
    body.scale.set(0.9, 1.15, 0.82);
    body.castShadow = true;
    owl.add(body);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xe8d8a8, roughness: 0.65 });
    owl.add(this.makeSphere(0.16, faceMat, -0.16, 1.68, 0.36));
    owl.add(this.makeSphere(0.16, faceMat, 0.16, 1.68, 0.36));
    owl.add(this.makeSphere(0.045, this.materials.black, -0.16, 1.69, 0.49));
    owl.add(this.makeSphere(0.045, this.materials.black, 0.16, 1.69, 0.49));
    this.visuals.owl = owl;
    this.animatables.push((dt, elapsed) => {
      owl.rotation.y = Math.sin(elapsed * 1.6) * 0.08;
      body.position.y = 1.55 + Math.sin(elapsed * 2.3) * 0.035;
    });
    this.addInteractive("owl", owl, {
      label: "Eule Agathe",
      kind: "npc",
      location: "library",
      interactPoint: new THREE.Vector3(c.x + 2.78, 0, c.z - 1.15)
    });

    const books = new THREE.Group();
    books.position.set(c.x + 2.9, 0, c.z + 2.45);
    books.add(this.makeBox(2.25, 2.2, 0.48, this.materials.darkWood, 0, 1.08, 0));
    for (let i = 0; i < 11; i += 1) {
      const mat = [this.materials.wine, this.materials.blue, this.materials.brass, this.materials.moss][i % 4];
      books.add(this.makeBox(0.16, 0.72 + (i % 3) * 0.14, 0.22, mat, -0.92 + i * 0.18, 0.82, 0.28));
    }
    this.addInteractive("books", books, {
      label: "Buecher",
      kind: "prop",
      location: "library",
      interactPoint: new THREE.Vector3(c.x + 2.2, 0, c.z + 1.65)
    });

    this.createDoor("door-library-back", "library", "Hofausgang", "courtyard", c.x, 0, c.z + 5.32, Math.PI, this.textures.labelBack);
  }

  createGarden() {
    this.createBase("garden", 13.2, 11.6, this.materials.grass);
    const c = this.locations.garden.center;
    this.createArtBackdrop("garden", "garden", c.x + 5.94, 2.15, c.z - 1.8, -Math.PI / 2, 3.8, 2.4);
    this.createMagicMotifs("garden", c, 34, [0x78a06c, 0xefc765, 0x9d4662]);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 3.4, 12), this.materials.wood);
    trunk.position.set(c.x - 3.8, 1.55, c.z - 2.35);
    trunk.castShadow = true;
    this.world.add(trunk);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x496a4f, roughness: 0.8 });
    for (let i = 0; i < 5; i += 1) {
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.25 - i * 0.07, 18, 14), crownMat);
      crown.position.set(c.x - 4.2 + (i % 3) * 0.55, 3.0 + (i % 2) * 0.35, c.z - 2.55 + Math.floor(i / 2) * 0.6);
      crown.castShadow = true;
      this.world.add(crown);
    }

    const stump = new THREE.Group();
    stump.position.set(c.x + 2.8, 0, c.z - 2.25);
    stump.add(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.78, 18), this.materials.wood));
    const faceMat = new THREE.MeshStandardMaterial({ color: 0x1b1712, roughness: 0.5 });
    stump.add(this.makeSphere(0.055, faceMat, -0.18, 0.18, 0.63));
    stump.add(this.makeSphere(0.055, faceMat, 0.18, 0.18, 0.63));
    stump.add(this.makeBox(0.32, 0.04, 0.03, faceMat, 0, -0.03, 0.67));
    this.addInteractive("stump", stump, {
      label: "Genervter Baumstumpf",
      kind: "npc",
      location: "garden",
      interactPoint: new THREE.Vector3(c.x + 2.1, 0, c.z - 1.45)
    });

    const mushrooms = new THREE.Group();
    mushrooms.position.set(c.x - 0.5, 0, c.z + 1.1);
    for (let i = 0; i < 9; i += 1) {
      const angle = (i / 9) * Math.PI * 2;
      const radius = 0.45 + (i % 3) * 0.34;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.35, 8), this.materials.parchment);
      stem.position.set(Math.cos(angle) * radius, 0.18, Math.sin(angle) * radius);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), i % 2 ? this.materials.wine : this.materials.brass);
      cap.position.set(stem.position.x, 0.38, stem.position.z);
      mushrooms.add(stem, cap);
    }
    this.visuals.rubberMushrooms = mushrooms;
    this.addInteractive("mushrooms", mushrooms, {
      label: "Quiekpilze",
      kind: "prop",
      location: "garden",
      interactPoint: new THREE.Vector3(c.x - 0.3, 0, c.z + 0.15)
    });

    const rubber = new THREE.Group();
    rubber.position.set(c.x + 1.0, 0.1, c.z + 2.45);
    rubber.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), this.materials.wine));
    rubber.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.32, 8), this.materials.parchment));
    this.visuals.rubberMushroom = rubber;
    this.addInteractive("rubber-mushroom", rubber, {
      label: "Gummipilz",
      kind: "item",
      item: "rubberMushroom",
      location: "garden",
      interactPoint: new THREE.Vector3(c.x + 0.55, 0, c.z + 1.72)
    });

    const pond = new THREE.Mesh(new THREE.CircleGeometry(1.45, 42), this.materials.blue);
    pond.position.set(c.x - 3.7, 0.02, c.z + 2.55);
    pond.rotation.x = -Math.PI / 2;
    this.world.add(pond);
    this.animatables.push((dt, elapsed) => {
      pond.scale.setScalar(1 + Math.sin(elapsed * 1.7) * 0.018);
    });
    this.addInteractive("pond", pond, {
      label: "Flacher Teich",
      kind: "prop",
      location: "garden",
      interactPoint: new THREE.Vector3(c.x - 2.75, 0, c.z + 2.25)
    });

    this.createDoor("door-garden-back", "garden", "Hofpfad", "courtyard", c.x, 0, c.z + 5.3, Math.PI, this.textures.labelBack);
  }

  createSkyBits() {
    const random = seededRandom(101);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffe4aa });
    for (let i = 0; i < 80; i += 1) {
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.025 + random() * 0.035, 8, 6), starMat);
      star.position.set(-24 + random() * 48, 12 + random() * 12, -28 + random() * 35);
      this.scene.add(star);
    }
  }

  createDoor(id, location, label, targetLocation, x, y, z, rotationY, texture) {
    const door = new THREE.Group();
    door.position.set(x, y, z);
    door.rotation.y = rotationY;
    const postMat = this.materials.darkWood;
    door.add(this.makeBox(0.22, 1.8, 0.22, postMat, -0.9, 0.9, 0));
    door.add(this.makeBox(0.22, 1.8, 0.22, postMat, 0.9, 0.9, 0));
    door.add(this.makeBox(2.1, 0.2, 0.22, postMat, 0, 1.72, 0));
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.62), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.7 }));
    sign.position.set(0, 1.13, 0.13);
    door.add(sign);
    this.addInteractive(id, door, {
      label,
      kind: "door",
      targetLocation,
      location,
      interactPoint: new THREE.Vector3(x - Math.sin(rotationY) * 0.72, 0, z - Math.cos(rotationY) * 0.72)
    });
  }

  createPlayer() {
    const player = new THREE.Group();
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.48, 0.86, 16), this.materials.robe);
    robe.position.y = 0.48;
    robe.castShadow = true;
    const head = this.makeSphere(0.23, this.materials.skin, 0, 1.04, 0.03);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.07, 18), this.materials.hat);
    brim.position.y = 1.22;
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.82, 18), this.materials.hat);
    hat.position.y = 1.62;
    hat.rotation.z = -0.12;
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.18, 8), this.materials.skin);
    nose.position.set(0, 1.03, 0.25);
    nose.rotation.x = Math.PI / 2;
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.58, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    player.add(shadow, robe, head, brim, hat, nose);
    player.position.copy(this.locations.courtyard.entry);
    this.player = player;
    this.world.add(player);
    this.animatables.push((dt, elapsed) => {
      if (!this.player) return;
      robe.position.y = 0.48 + Math.sin(elapsed * 5.6) * 0.018;
      hat.rotation.z = -0.12 + Math.sin(elapsed * 3.8) * 0.025;
    });
  }

  createHoverMarker() {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.025, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0xf0c75c, transparent: true, opacity: 0.82 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.visible = false;
    this.hoverMarker = ring;
    this.scene.add(ring);
  }

  createGuideMarker() {
    const marker = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.035, 8, 64), this.materials.guide);
    ring.rotation.x = Math.PI / 2;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.28, 2.4, 18, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xefc765, transparent: true, opacity: 0.18 })
    );
    beam.position.y = 1.18;
    marker.add(ring, beam);
    marker.visible = false;
    this.guideMarker = marker;
    this.scene.add(marker);
  }

  makeBox(width, height, depth, material, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  makeSphere(radius, material, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    return mesh;
  }

  addInteractive(id, group, data) {
    group.userData.interactiveId = id;
    this.world.add(group);
    const entry = {
      id,
      group,
      label: data.label,
      kind: data.kind,
      item: data.item,
      location: data.location,
      targetLocation: data.targetLocation,
      interactPoint: data.interactPoint.clone()
    };
    group.traverse((child) => {
      if (child.isMesh) {
        child.userData.interactiveId = id;
        this.pickables.push(child);
      }
    });
    this.interactives.set(id, entry);
    return group;
  }

  bindUI() {
    this.ui.startButton.addEventListener("click", () => {
      this.initAudio();
      this.state.audioEnabled = true;
      this.ui.audioButton.setAttribute("aria-pressed", "true");
      this.playBgm();
      this.state.running = true;
      this.ui.startScreen.classList.remove("active");
      this.say("Mika", "Also gut. Portal reparieren. Nicht in ein Schaf verwandeln. Reihenfolge ist wichtig.");
    });

    this.ui.againButton.addEventListener("click", () => {
      this.resetGame();
      this.playBgm();
      this.state.running = true;
      this.ui.finishScreen.classList.remove("active");
      this.say("Mika", "Neuer Versuch. Diesmal mit noch mehr kontrolliertem Chaos.");
    });

    this.ui.audioButton.addEventListener("click", () => {
      this.initAudio();
      this.state.audioEnabled = !this.state.audioEnabled;
      this.ui.audioButton.setAttribute("aria-pressed", String(this.state.audioEnabled));
      this.say("Mika", this.state.audioEnabled ? "Die Magie brummt jetzt hoerbar." : "Stille Magie. Sehr vornehm.");
      if (this.state.audioEnabled) this.playBgm();
      else this.pauseBgm();
      this.playTone(440, 0.06, "triangle", 0.04);
    });

    this.ui.guideButton.addEventListener("click", () => this.followGuide());

    this.ui.fullscreenButton.addEventListener("click", () => this.toggleFullscreen());
    document.addEventListener("fullscreenchange", () => {
      this.ui.fullscreenButton.setAttribute("aria-pressed", String(Boolean(document.fullscreenElement)));
    });

    this.ui.verbButtons.forEach((button) => {
      button.addEventListener("click", () => this.setVerb(button.dataset.verb));
    });

    this.canvas.addEventListener("pointermove", (event) => this.handlePointerMove(event));
    this.canvas.addEventListener("pointerdown", (event) => this.handlePointerDown(event));
    this.canvas.addEventListener("pointerleave", () => this.clearHover());

    document.addEventListener("keydown", (event) => {
      if (event.repeat) return;
      if (event.key === "Escape") {
        if (this.ui.starPanel.classList.contains("active")) {
          this.closeStarPanel();
        } else {
          this.clearSelectedItem();
        }
        return;
      }
      if (event.key === "1") this.setVerb("look");
      if (event.key === "2") this.setVerb("take");
      if (event.key === "3") this.setVerb("use");
      if (event.key === "4") this.setVerb("talk");
      if (event.key === "5") this.setVerb("push");
      if (event.key.toLowerCase() === "f" || event.key === " ") {
        this.queueNearestInteraction();
      }
      this.keys.add(event.key.toLowerCase());
    });

    document.addEventListener("keyup", (event) => {
      this.keys.delete(event.key.toLowerCase());
    });

    this.ui.starPanel.querySelectorAll("[data-symbol]").forEach((button) => {
      button.addEventListener("click", () => this.inputStarSymbol(button.dataset.symbol));
    });
    this.ui.starReset.addEventListener("click", () => {
      this.state.starInput = [];
      this.updateStarReadout();
      this.playTone(260, 0.05, "square", 0.025);
    });
    this.ui.starClose.addEventListener("click", () => this.closeStarPanel());
  }

  initAudio() {
    if (!this.audio.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audio.context = new AudioContext();
      }
    }
    if (!this.audio.bgm) {
      this.audio.bgm = new Audio(ASSETS.bgm[0]);
      this.audio.bgm.loop = true;
      this.audio.bgm.volume = 0.32;
      Object.entries(ASSETS.sfx).forEach(([key, src]) => {
        const sound = new Audio(src);
        sound.preload = "auto";
        sound.volume = key === "portal" ? 0.45 : 0.38;
        this.audio.sfx[key] = sound;
      });
    }
    if (this.audio.context?.state === "suspended") {
      this.audio.context.resume();
    }
  }

  playBgm() {
    if (!this.state.audioEnabled || !this.audio.bgm) return;
    this.audio.bgm.play().catch(() => {
      this.state.audioEnabled = false;
      this.ui.audioButton.setAttribute("aria-pressed", "false");
    });
  }

  pauseBgm() {
    this.audio.bgm?.pause();
  }

  playAsset(name) {
    if (!this.state.audioEnabled) return;
    const source = this.audio.sfx[name];
    if (!source) return;
    const sound = source.cloneNode();
    sound.volume = source.volume;
    sound.play().catch(() => {});
  }

  playTone(freq = 440, duration = 0.08, type = "sine", gain = 0.035) {
    if (!this.state.audioEnabled || !this.audio.context) return;
    const ctx = this.audio.context;
    const osc = ctx.createOscillator();
    const volume = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    volume.gain.value = 0.0001;
    osc.connect(volume);
    volume.connect(ctx.destination);
    const now = ctx.currentTime;
    volume.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playChime() {
    this.playAsset("collect");
    this.playTone(523, 0.08, "triangle", 0.04);
    window.setTimeout(() => this.playTone(659, 0.08, "triangle", 0.035), 90);
    window.setTimeout(() => this.playTone(784, 0.12, "triangle", 0.03), 180);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.shell.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  resetGame() {
    this.state.activeVerb = "use";
    this.state.selectedItem = null;
    this.state.inventory = new Set();
    this.state.location = "courtyard";
    this.state.starInput = [];
    this.state.flags = {
      signCleaned: false,
      gargoyleFed: false,
      crankAttached: false,
      waterDrawn: false,
      sparkTaken: false,
      starSolved: false,
      potionBrewed: false,
      gateOpen: false,
      rubberTaken: false,
      leftSwitch: false,
      rightSwitch: false,
      pushBlockPlaced: false,
      sigilOpen: false
    };
    this.state.pushBlockTarget = null;
    this.pendingAction = null;
    this.walkTarget = null;
    this.player.position.copy(this.locations.courtyard.entry);
    this.player.rotation.y = Math.PI;
    if (this.visuals.pushBlock) {
      this.visuals.pushBlock.position.copy(this.pushPuzzle.start);
      this.updatePushBlockInteractivePoint();
    }
    this.ui.finishScreen.classList.remove("active");
    this.setLocation("courtyard", true);
    this.updateVerbUI();
    this.updateInventoryUI();
    this.updateVisuals();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  setVerb(verb) {
    this.state.activeVerb = verb;
    this.state.selectedItem = null;
    this.updateVerbUI();
  }

  updateVerbUI() {
    this.ui.verbButtons.forEach((button) => {
      const active = button.dataset.verb === this.state.activeVerb && !this.state.selectedItem;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    this.ui.action.textContent = this.getActionReadout();
  }

  getActionReadout() {
    if (this.state.selectedItem) {
      return `Benutz ${ITEMS[this.state.selectedItem].label} mit ...`;
    }
    return VERB_LABELS[this.state.activeVerb] || "Benutz";
  }

  updateInventoryUI() {
    this.ui.inventory.innerHTML = "";
    const items = ITEM_ORDER.filter((item) => this.state.inventory.has(item));
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Noch leer. Das Inventar ist schockiert.";
      this.ui.inventory.append(empty);
      this.updateVerbUI();
      return;
    }

    items.forEach((item) => {
      const def = ITEMS[item];
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.item = item;
      button.className = item === this.state.selectedItem ? "active" : "";
      button.setAttribute("aria-pressed", String(item === this.state.selectedItem));
      button.innerHTML = `<span class="item-icon">${def.icon}</span><span>${def.label}</span>`;
      button.addEventListener("click", () => {
        if (this.state.selectedItem === item) {
          this.clearSelectedItem();
        } else {
          this.state.selectedItem = item;
          this.state.activeVerb = "use";
          this.updateInventoryUI();
          this.updateVerbUI();
        }
      });
      this.ui.inventory.append(button);
    });
    this.updateVerbUI();
  }

  clearSelectedItem() {
    this.state.selectedItem = null;
    this.updateInventoryUI();
    this.updateVerbUI();
  }

  addItem(item) {
    if (this.state.inventory.has(item)) return false;
    this.state.inventory.add(item);
    this.updateInventoryUI();
    this.playChime();
    return true;
  }

  removeItem(item) {
    this.state.inventory.delete(item);
    if (this.state.selectedItem === item) this.state.selectedItem = null;
    this.updateInventoryUI();
  }

  setLocation(locationKey, instant = false) {
    const loc = this.locations[locationKey];
    this.state.location = locationKey;
    this.ui.location.textContent = loc.label;
    this.updateObjective();
    if (!instant) {
      this.player.position.copy(loc.entry);
      this.walkTarget = null;
      this.pendingAction = null;
      this.say("Mika", this.locationArrivalLine(locationKey));
      this.playTone(330, 0.07, "triangle", 0.035);
    }
  }

  locationArrivalLine(locationKey) {
    if (locationKey === "courtyard") return "Zurueck im Hof. Das Portal schaut immer noch vorwurfsvoll.";
    if (locationKey === "kitchen") return "Kueche. Hier riecht es nach Pflichtverletzung und Kaese.";
    if (locationKey === "library") return "Turmbibliothek. Die Buecher tun so, als waeren sie wichtiger als ich.";
    return "Pilzgarten. Alles hier hat zu viele Meinungen.";
  }

  updateObjective() {
    const guide = this.getGuide();
    this.state.guide = guide;
    this.ui.objective.textContent = guide.text;
    this.ui.guideStep.textContent = String(guide.step);
    this.ui.guideTarget.textContent = guide.targetLabel;
    this.ui.guideAction.textContent = guide.action;
    this.ui.questPointerLabel.textContent = guide.shortLabel;
  }

  getGuide() {
    const flags = this.state.flags;
    const has = (item) => this.state.inventory.has(item);
    if (flags.gateOpen) {
      return this.makeGuide(12, "Fertig", "Portal stabil", "Feiere kurz. Der Murrwald ist gerettet.", "moon-gate", "courtyard", "OK");
    }
    if (has("gatePotion")) {
      if (!flags.sigilOpen) {
        if (!flags.leftSwitch) {
          return this.makeGuide(9, "Benutz", "Linker Schalter", "Lege zuerst den linken Schalter um. Er leuchtet danach golden.", "left-switch", "courtyard", "Schalter");
        }
        if (!flags.rightSwitch) {
          return this.makeGuide(10, "Benutz", "Rechter Schalter", "Lege den rechten Schalter um. Beide Schalter muessen an sein.", "right-switch", "courtyard", "Schalter");
        }
        if (!flags.pushBlockPlaced) {
          return this.makeGuide(11, "Schieb", "Runenblock", "Schieb den Runenblock auf die leuchtende Druckplatte.", "push-block", "courtyard", "Block");
        }
      }
      return this.makeGuide(12, "Benutz", "Murrportal", "Benutz den Portaltrank am Murrportal. Jetzt darf es nicht mehr meckern.", "moon-gate", "courtyard", "Portal");
    }
    if (!flags.potionBrewed && this.hasBrewingIngredients()) {
      return this.makeGuide(8, "Benutz", "Kessel", "Alle Zutaten sind da. Benutz den Kessel und braue den Portaltrank.", "cauldron", "kitchen", "Kessel");
    }
    if (!has("broom") && !flags.signCleaned) {
      return this.makeGuide(1, "Nimm", "Besen", "Nimm den Besen im Hof. Danach kannst du das staubige Schild putzen.", "broom", "courtyard", "Besen");
    }
    if (has("broom") && !flags.signCleaned) {
      return this.makeGuide(2, "Benutz", "Staubiges Schild", "Benutz den Besen mit dem staubigen Schild. Darauf steht die Sternfolge.", "dusty-sign", "courtyard", "Schild");
    }
    if (!has("cheese") && !flags.gargoyleFed) {
      return this.makeGuide(3, "Nimm", "Mondkaese", "Geh in die Kueche und nimm den Mondkaese vom Regal.", "cheese", "kitchen", "Kaese");
    }
    if (has("cheese") && !flags.gargoyleFed) {
      return this.makeGuide(4, "Benutz", "Gargoyle", "Gib dem Gargoyle den Mondkaese. Er rueckt dafuer die Eulenfeder raus.", "gargoyle", "courtyard", "Gargoyle");
    }
    if (!has("bellows") && !flags.sparkTaken) {
      return this.makeGuide(5, "Nimm", "Blasebalg", "Nimm den Blasebalg in der Kueche.", "bellows", "kitchen", "Blasebalg");
    }
    if (has("bellows") && !flags.sparkTaken) {
      return this.makeGuide(6, "Benutz", "Schlafender Ofen", "Benutz den Blasebalg am Ofen. So bekommst du Taschenglut.", "oven", "kitchen", "Ofen");
    }
    if (!flags.starSolved && !has("crank") && !flags.crankAttached) {
      return this.makeGuide(7, "Benutz", "Sternkarte", "Geh zur Sternkarte und druecke: Mond, Pilz, Stern. Dann gibt es die Kurbel.", "star-map", "library", "Karte");
    }
    if ((has("crank") || flags.crankAttached) && !flags.waterDrawn) {
      return this.makeGuide(7, "Benutz", "Brunnen", flags.crankAttached ? "Benutz den Brunnen und hol klares Wasser." : "Benutz die Kurbel mit dem Brunnen, dann hol Wasser.", "well", "courtyard", "Brunnen");
    }
    return this.makeGuide(1, "Schau", this.locations[this.state.location].label, this.locations[this.state.location].objective, null, this.state.location, "Ziel");
  }

  makeGuide(step, action, targetLabel, text, targetId, location, shortLabel) {
    return { step, action, targetLabel, text, targetId, location, shortLabel };
  }

  followGuide() {
    const guide = this.state.guide || this.getGuide();
    if (guide.location && guide.location !== this.state.location) {
      this.setLocation(guide.location);
      return;
    }
    if (guide.targetId) {
      const target = this.interactives.get(guide.targetId);
      if (target) {
        const action = (guide.action || "Benutz").toLowerCase();
        const verb = action.startsWith("schieb") ? "push" : action.startsWith("nimm") ? "take" : action.startsWith("rede") ? "talk" : "use";
        this.setVerb(verb);
        this.queueInteraction(target.id);
      }
    }
  }

  hasBrewingIngredients() {
    return this.state.inventory.has("clearWater") && this.state.inventory.has("owlFeather") && this.state.inventory.has("pocketSpark");
  }

  say(speaker, line) {
    this.ui.speaker.textContent = speaker;
    this.ui.line.textContent = line;
  }

  handlePointerMove(event) {
    if (!this.state.running) return;
    const hit = this.pickFromPointer(event);
    const interactive = hit?.interactive;
    if (interactive && interactive.location === this.state.location) {
      this.hoveredId = interactive.id;
      this.ui.hover.textContent = interactive.label;
      this.ui.hover.style.left = `${event.clientX}px`;
      this.ui.hover.style.top = `${event.clientY}px`;
      this.ui.hover.classList.add("visible");
      this.hoverMarker.visible = true;
      this.hoverMarker.position.copy(interactive.interactPoint);
      this.hoverMarker.position.y = 0.045;
    } else {
      this.clearHover();
    }
  }

  clearHover() {
    this.hoveredId = null;
    this.ui.hover.classList.remove("visible");
    this.hoverMarker.visible = false;
  }

  handlePointerDown(event) {
    if (!this.state.running || this.ui.starPanel.classList.contains("active")) return;
    this.initAudio();
    const hit = this.pickFromPointer(event);
    if (hit?.interactive && hit.interactive.location === this.state.location) {
      this.queueInteraction(hit.interactive.id);
      return;
    }
    if (hit?.ground && hit.ground.userData.location === this.state.location) {
      const point = hit.point.clone();
      const bounds = this.locations[this.state.location].bounds;
      point.x = clamp(point.x, bounds.minX + 0.45, bounds.maxX - 0.45);
      point.z = clamp(point.z, bounds.minZ + 0.45, bounds.maxZ - 0.45);
      point.y = 0;
      this.walkTarget = point;
      this.pendingAction = null;
      this.playTone(220, 0.03, "sine", 0.018);
    }
  }

  pickFromPointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, true);
    let groundHit = null;
    for (const hit of hits) {
      const id = this.findInteractiveId(hit.object);
      if (id) {
        return { interactive: this.interactives.get(id), point: hit.point };
      }
      if (!groundHit && hit.object.userData.ground) {
        groundHit = hit;
      }
    }
    if (groundHit) {
      return { ground: groundHit.object, point: groundHit.point };
    }
    return null;
  }

  findInteractiveId(object) {
    let current = object;
    while (current) {
      if (current.userData?.interactiveId) return current.userData.interactiveId;
      current = current.parent;
    }
    return null;
  }

  queueInteraction(id) {
    const interactive = this.interactives.get(id);
    if (!interactive || interactive.location !== this.state.location) return;
    this.pendingAction = {
      id,
      verb: this.state.activeVerb,
      item: this.state.selectedItem
    };
    this.walkTarget = interactive.interactPoint.clone();
    if (distanceXZ(this.player.position, this.walkTarget) < 0.55) {
      this.executePendingAction();
    }
  }

  queueNearestInteraction() {
    if (!this.state.running || this.ui.starPanel.classList.contains("active")) return;
    const nearest = this.nearestInteractive(1.65);
    if (nearest) {
      this.queueInteraction(nearest.id);
    } else {
      this.say("Mika", "Nichts in Griffweite. Meine Arme bleiben leider serienmaessig.");
    }
  }

  nearestInteractive(maxDistance) {
    let best = null;
    for (const entry of this.interactives.values()) {
      if (entry.location !== this.state.location || !entry.group.visible) continue;
      const dist = distanceXZ(this.player.position, entry.interactPoint);
      if (dist <= maxDistance && (!best || dist < best.dist)) {
        best = { id: entry.id, dist };
      }
    }
    return best;
  }

  executePendingAction() {
    if (!this.pendingAction) return;
    const action = this.pendingAction;
    this.pendingAction = null;
    this.executeObjectAction(action.id, action.verb, action.item);
  }

  executeObjectAction(id, verb, item) {
    const object = this.interactives.get(id);
    if (!object) return;
    this.player.lookAt(object.group.position.x, this.player.position.y, object.group.position.z);

    if (item) {
      this.tryUseItemOnObject(item, id);
      return;
    }

    if (verb === "look") {
      this.lookAtObject(id);
      return;
    }
    if (verb === "take") {
      this.tryTakeObject(id);
      return;
    }
    if (verb === "talk") {
      this.talkToObject(id);
      return;
    }
    if (verb === "push") {
      this.pushObject(id);
      return;
    }

    if (object.kind === "item") {
      this.tryTakeObject(id);
    } else if (object.kind === "door") {
      this.useDoor(id);
    } else if (object.kind === "switch") {
      this.toggleSwitch(id);
    } else if (object.kind === "push") {
      this.pushObject(id);
    } else if (object.kind === "npc") {
      this.talkToObject(id);
    } else {
      this.useObject(id);
    }
  }

  lookAtObject(id) {
    const flags = this.state.flags;
    const lines = {
      "moon-gate": flags.gateOpen
        ? "Das Portal schnurrt. Es sieht aus, als wuerde es gleich eine Quittung verlangen."
        : "Ein Murrportal mit drei leeren Runennasen: Wasser, Feder, Glut. Natuerlich steht das nirgends ordentlich.",
      well: flags.crankAttached
        ? "Mit Kurbel sieht der Brunnen fast professionell aus. Fast."
        : "Ein Brunnen ohne Kurbel. Wasser: vorhanden. Bedienbarkeit: beleidigend niedrig.",
      "dusty-sign": flags.signCleaned
        ? "Jetzt steht es da: Mond, Pilz, Stern. Wer Schilder putzt, wird mit Wissen bestraft."
        : "Das Schild ist so staubig, dass der Staub vermutlich Miete zahlt.",
      "left-switch": flags.leftSwitch
        ? "Der linke Schalter ist an. Er wirkt furchtbar stolz."
        : "Ein linker Schalter. Solide Bauweise, schlechte Beschriftung.",
      "right-switch": flags.rightSwitch
        ? "Der rechte Schalter ist an. Jetzt fehlt nur noch der Block, falls er nicht schon sitzt."
        : "Ein rechter Schalter. Klassisch: Erst ziehen, dann hoffen.",
      "pressure-plate": flags.pushBlockPlaced
        ? "Die Druckplatte leuchtet. Der Runenblock sitzt genau darauf."
        : "Eine Druckplatte mit leuchtender Umrandung. Sie will ganz offensichtlich einen schweren Block.",
      "push-block": flags.pushBlockPlaced
        ? "Der Runenblock sitzt auf der Platte. Ein seltener Moment von Ordnung."
        : "Ein Runenblock. Mit 'Schieb' oder dem Zielknopf bewegt er sich Richtung Druckplatte.",
      broom: "Ein Besen. Nicht magisch, aber entschlossen genug fuer Staub.",
      gargoyle: flags.gargoyleFed
        ? "Der Gargoyle kaut zufrieden auf Erinnerungen an Mondkaese."
        : "Eine Steinfratze mit Federkragen und dem Blick eines hungrigen Theaterkritikers.",
      cauldron: flags.potionBrewed
        ? "Der Kessel riecht nach Portaltrank und mildem Versicherungsfall."
        : "Ein Kessel fuer drei Zutaten: klares Wasser, Eulenfeder, Taschenglut.",
      oven: flags.sparkTaken
        ? "Der Ofen wirkt erleichtert. Oder leer. Schwer zu sagen bei Oefen."
        : "Ein Ofen, der Luft braucht. Ich kenne das Gefuehl.",
      shelf: "Gewuerze, Glaeser, und ein Schild: 'Nicht essen, falls es zurueckspricht.'",
      cheese: "Mondkaese. Leuchtet nicht wirklich, tut aber sehr wichtig.",
      bellows: "Ein Blasebalg. Perfekt, um Flammen oder Egos aufzupumpen.",
      "kitchen-table": "Auf dem Tisch steht ein Rezept: Wasser, Feder, Glut. Keine Pilze. Verdaechtig klar.",
      "star-map": flags.starSolved
        ? "Die Sternkarte hat nachgegeben. Der Mond wirkt noch etwas nachtragend."
        : "Sechs Zeichen, drei Slots. Die Karte wartet auf eine Reihenfolge.",
      chest: flags.starSolved
        ? "Die Truhe ist offen. Sie sieht aus, als haette sie gerne dramatischere Musik gehabt."
        : "Eine Truhe mit Sternschloss. Sie ignoriert Gewalt mit akademischer Eleganz.",
      owl: "Agathe, die Eule. Sie sieht aus, als haette sie schon drei Zauberlehrlinge ueberlebt.",
      books: "Buecher ueber Portale, Kessel und warum beides nicht nebeneinander gelagert werden sollte.",
      stump: "Ein Baumstumpf mit Gesicht. Evolution hat heute Humor gewaehlt.",
      mushrooms: "Quiekpilze. Sie quieken nicht immer. Nur wenn es lustig waere.",
      "rubber-mushroom": "Ein Gummipilz. Nutzlos, aber mit hervorragender Haltung.",
      pond: "Ein flacher Teich. Nicht klar genug fuer Portalmagie, aber gut fuer dramatische Spiegelungen.",
      "door-kitchen": "Zur Kueche. Dort passieren die meisten Fehler mit Besteck.",
      "door-library": "Zur Bibliothek. Wissen, Staub und beleidigte Karten.",
      "door-garden": "Zum Pilzgarten. Die Natur hat hier das letzte Wort. Leider mehrere.",
      "door-kitchen-back": "Zurueck in den Hof.",
      "door-library-back": "Zurueck in den Hof.",
      "door-garden-back": "Zurueck in den Hof."
    };
    this.say("Mika", lines[id] || "Das ist bestimmt wichtig. Oder teuer. Beides ist schlecht.");
  }

  talkToObject(id) {
    const flags = this.state.flags;
    if (id === "gargoyle") {
      if (flags.gargoyleFed) {
        this.say("Gargoyle", "Ich bewache jetzt das Portal und meine Wuerde. Eins davon klappt.");
      } else {
        this.say("Gargoyle", "Bring mir Mondkaese, Menschlein. Dann schenke ich dir eine Feder. Frag nicht, woher.");
      }
      return;
    }
    if (id === "owl") {
      if (!flags.signCleaned) {
        this.say("Agathe", "Staub ist nur Wissen mit schlechter Koerperhaltung. Fang beim Schild an.");
      } else if (!flags.starSolved) {
        this.say("Agathe", "Mond, Pilz, Stern. Ich wiederhole mich ungern, aber du blinkst so hilflos.");
      } else {
        this.say("Agathe", "Die Truhe ist offen. Bitte behandle die Kurbel besser als deine Karriere.");
      }
      return;
    }
    if (id === "stump") {
      this.say("Baumstumpf", "Der Kessel mag Wasser, Feder und Glut. Pilze sind nur fuer komische Nebengeraeusche.");
      return;
    }
    if (id === "cauldron") {
      this.say("Kessel", flags.potionBrewed ? "Blubb. Ich war hervorragend." : "Blubb. Drei Zutaten. Keine Ausreden.");
      return;
    }
    this.say("Mika", "Keine Antwort. Sehr reif.");
  }

  tryTakeObject(id) {
    const object = this.interactives.get(id);
    if (!object) return;
    if (object.kind !== "item" || !object.item) {
      if (id === "chest" && this.state.flags.starSolved && !this.state.inventory.has("crank") && !this.state.flags.crankAttached) {
        this.addItem("crank");
        this.say("Mika", "Eine Brunnenkurbel. Genau das Richtige fuer Leute, die Brunnen bedienen muessen.");
        this.updateObjective();
      } else {
        this.say("Mika", "Das nehme ich lieber nicht. Es ist entweder fest, schwer, oder hat Anwaltspotenzial.");
      }
      return;
    }

    if (object.item === "rubberMushroom") {
      this.state.flags.rubberTaken = true;
    }
    if (this.addItem(object.item)) {
      object.group.visible = false;
      this.say("Mika", `${ITEMS[object.item].label} eingesteckt. Das Inventar fuehlt sich gleich wichtiger.`);
      this.updateObjective();
      this.updateVisuals();
    }
  }

  useObject(id) {
    const flags = this.state.flags;
    if (id === "left-switch" || id === "right-switch") {
      this.toggleSwitch(id);
      return;
    }
    if (id === "push-block") {
      this.pushObject(id);
      return;
    }
    if (id === "pressure-plate") {
      this.say("Mika", flags.pushBlockPlaced ? "Die Platte ist gedrueckt. Das Zauberschloss hat endlich verstanden." : "Die Platte will Gewicht. Ich bin leicht wie Verantwortungslosigkeit.");
      return;
    }
    if (id === "well") {
      if (!flags.crankAttached) {
        this.say("Mika", "Der Brunnen braucht eine Kurbel. Haende reinstecken ist Plan B fuer Leute ohne Zukunft.");
        return;
      }
      if (!this.state.inventory.has("clearWater")) {
        flags.waterDrawn = true;
        this.addItem("clearWater");
        this.say("Mika", "Klares Wasser. Es sieht aus, als haette es noch nie einen Kessel bereut.");
        this.updateObjective();
      } else {
        this.say("Mika", "Noch mehr Wasser waere nur schwerer Sarkasmus.");
      }
      return;
    }
    if (id === "oven") {
      if (this.state.inventory.has("bellows")) {
        this.tryUseItemOnObject("bellows", "oven");
      } else {
        this.say("Mika", "Der Ofen braucht Luft. Ich weigere mich, ihn persoenlich anzupusten.");
      }
      return;
    }
    if (id === "cauldron") {
      this.brewPotion();
      return;
    }
    if (id === "star-map") {
      this.openStarPanel();
      return;
    }
    if (id === "chest") {
      if (flags.starSolved && !this.state.inventory.has("crank") && !flags.crankAttached) {
        this.tryTakeObject("chest");
      } else if (flags.starSolved) {
        this.say("Mika", "Die Truhe ist leer. Sie wirkt erleichtert.");
      } else {
        this.say("Mika", "Das Sternschloss will erst die richtige Zeichenfolge.");
      }
      return;
    }
    if (id === "moon-gate") {
      if (this.state.inventory.has("gatePotion")) {
        this.tryUseItemOnObject("gatePotion", "moon-gate");
      } else {
        this.say("Murrportal", "Murr. Trank fehlt. Murr.");
      }
      return;
    }
    if (id === "mushrooms") {
      this.say("Quiekpilze", "Quiek. Quiek? Quiek!");
      this.playTone(710, 0.05, "square", 0.02);
      return;
    }
    if (id === "pond") {
      this.say("Mika", "Nicht klar genug. Der Teich hat Algen und ein sehr kleines Selbstbewusstsein.");
      return;
    }
    if (id === "dusty-sign") {
      if (this.state.inventory.has("broom")) {
        this.tryUseItemOnObject("broom", "dusty-sign");
      } else {
        this.say("Mika", "Ich koennte den Staub wegmachen. Mit einem Werkzeug. Oder einem kleineren Lehrling.");
      }
      return;
    }
    this.lookAtObject(id);
  }

  useDoor(id) {
    const object = this.interactives.get(id);
    if (!object?.targetLocation) return;
    this.setLocation(object.targetLocation);
  }

  toggleSwitch(id) {
    const flags = this.state.flags;
    const key = id === "left-switch" ? "leftSwitch" : "rightSwitch";
    flags[key] = !flags[key];
    this.say("Mika", `${id === "left-switch" ? "Linker" : "Rechter"} Schalter ${flags[key] ? "an" : "aus"}. Zaubertechnik mit gutem Klick.`);
    this.playAsset("switch");
    this.playTone(flags[key] ? 520 : 260, 0.07, "triangle", 0.03);
    this.updateSwitchPuzzle();
    this.updateVisuals();
    this.updateObjective();
  }

  pushObject(id) {
    if (id !== "push-block") {
      this.say("Mika", "Schieben? Das bewegt sich nur emotional.");
      this.playAsset("error");
      return;
    }
    if (this.state.flags.pushBlockPlaced) {
      this.say("Mika", "Der Block sitzt perfekt. Ich geniesse diesen Moment, bevor ich ihn ruiniere.");
      return;
    }
    if (this.state.pushBlockTarget) {
      this.say("Mika", "Der Block rutscht schon. Magische Moebel brauchen kurz.");
      return;
    }
    const block = this.visuals.pushBlock;
    const goal = this.pushPuzzle.goal;
    const delta = new THREE.Vector3().subVectors(goal, block.position);
    const next = block.position.clone();
    if (Math.abs(delta.x) > 0.18) {
      next.x += Math.sign(delta.x) * Math.min(0.95, Math.abs(delta.x));
    } else if (Math.abs(delta.z) > 0.18) {
      next.z += Math.sign(delta.z) * Math.min(0.95, Math.abs(delta.z));
    }
    next.x = clamp(next.x, 1.6, 4.2);
    next.z = clamp(next.z, -3.9, -0.85);
    this.state.pushBlockTarget = next;
    this.say("Mika", "Runenblock unterwegs. Er bewegt sich langsam, aber mit Absicht.");
    this.playAsset("push");
  }

  updateSwitchPuzzle() {
    const flags = this.state.flags;
    const solved = flags.leftSwitch && flags.rightSwitch && flags.pushBlockPlaced;
    if (solved && !flags.sigilOpen) {
      flags.sigilOpen = true;
      this.say("Bodensiegel", "Klick. Zwei Schalter, ein Block, null Ausreden.");
      this.playAsset("portal");
      this.playChime();
    }
  }

  updatePushBlockInteractivePoint() {
    const entry = this.interactives.get("push-block");
    if (!entry || !this.visuals.pushBlock) return;
    entry.interactPoint.set(this.visuals.pushBlock.position.x, 0, this.visuals.pushBlock.position.z + 0.82);
  }

  tryUseItemOnObject(item, id) {
    const flags = this.state.flags;
    if (item === "broom" && id === "dusty-sign") {
      if (!flags.signCleaned) {
        flags.signCleaned = true;
        this.say("Mika", "Staub besiegt. Das Schild sagt: Mond, Pilz, Stern. Subtil wie ein Amboss.");
        this.playChime();
        this.clearSelectedItem();
        this.updateVisuals();
        this.updateObjective();
      } else {
        this.say("Mika", "Noch sauberer und das Schild entwickelt Eitelkeit.");
      }
      return;
    }

    if (item === "cheese" && id === "gargoyle") {
      if (!flags.gargoyleFed) {
        flags.gargoyleFed = true;
        this.removeItem("cheese");
        this.addItem("owlFeather");
        this.say("Gargoyle", "Mondkaese! Nimm diese Feder. Sie ist voellig legal erworben. Fast.");
        this.playChime();
        this.updateVisuals();
        this.updateObjective();
      } else {
        this.say("Gargoyle", "Ich bin satt. Ein Zustand, den ich dramatisch unterschaetzt habe.");
      }
      return;
    }

    if (item === "crank" && id === "well") {
      if (!flags.crankAttached) {
        flags.crankAttached = true;
        this.removeItem("crank");
        this.say("Mika", "Kurbel dran. Der Brunnen ist jetzt offiziell weniger nutzlos.");
        this.playChime();
        this.updateVisuals();
        this.updateObjective();
      } else {
        this.say("Mika", "Die Kurbel ist schon dran. Mehr Kurbel waere albern.");
      }
      return;
    }

    if (item === "bellows" && id === "oven") {
      if (!flags.sparkTaken) {
        flags.sparkTaken = true;
        this.addItem("pocketSpark");
        this.say("Mika", "Taschenglut! Warm, klein, und wahrscheinlich gegen mindestens zwei Regeln.");
        this.playChime();
        this.clearSelectedItem();
        this.updateVisuals();
        this.updateObjective();
      } else {
        this.say("Mika", "Der Ofen ist leergepustet. Selbst die Asche wirkt muede.");
      }
      return;
    }

    if (id === "cauldron" && ["clearWater", "owlFeather", "pocketSpark"].includes(item)) {
      this.brewPotion();
      return;
    }

    if (item === "gatePotion" && id === "moon-gate") {
      if (!flags.sigilOpen) {
        this.say("Murrportal", "Murr. Trank gut. Bodensiegel noch beleidigt: beide Schalter an, Block auf Platte.");
        this.playAsset("error");
        this.updateObjective();
        return;
      }
      flags.gateOpen = true;
      this.removeItem("gatePotion");
      this.say("Murrportal", "Mrrrrr... akzeptabel.");
      this.playAsset("portal");
      this.playChime();
      this.updateVisuals();
      this.updateObjective();
      window.setTimeout(() => this.finishGame(), 850);
      return;
    }

    if (item === "rubberMushroom" && id === "moon-gate") {
      this.say("Murrportal", "Murr. Das ist ein Pilz. Ein frecher Pilz.");
      return;
    }

    const object = this.interactives.get(id);
    const itemLabel = ITEMS[item]?.label || "Ding";
    this.say("Mika", `${itemLabel} mit ${object?.label || "dem da"}? Kuehn. Nutzlos, aber kuehn.`);
    this.playTone(160, 0.08, "sawtooth", 0.018);
  }

  brewPotion() {
    const flags = this.state.flags;
    if (flags.potionBrewed) {
      this.say("Kessel", "Blubb. Ein Portaltrank reicht. Ich bin Kessel, kein Grosshandel.");
      return;
    }
    if (!this.hasBrewingIngredients()) {
      const missing = [];
      if (!this.state.inventory.has("clearWater")) missing.push("klares Wasser");
      if (!this.state.inventory.has("owlFeather")) missing.push("Eulenfeder");
      if (!this.state.inventory.has("pocketSpark")) missing.push("Taschenglut");
      this.say("Kessel", `Blubb. Es fehlt noch: ${missing.join(", ")}.`);
      this.playTone(180, 0.08, "square", 0.018);
      return;
    }
    this.removeItem("clearWater");
    this.removeItem("owlFeather");
    this.removeItem("pocketSpark");
    flags.potionBrewed = true;
    this.addItem("gatePotion");
    this.say("Mika", "Portaltrank fertig. Er riecht nach Sieg und leichtem Moebelschaden.");
    this.playChime();
    this.updateVisuals();
    this.updateObjective();
  }

  openStarPanel() {
    if (this.state.flags.starSolved) {
      this.say("Sternkarte", "Die Karte ist geloest. Sie verlangt jetzt Ruhe und Bewunderung.");
      return;
    }
    if (!this.state.flags.signCleaned) {
      this.say("Mika", "Ohne Hinweis ist das nur Sternbilder-Raten. Also ein normaler Dienstag, aber langsamer.");
    } else {
      this.say("Mika", "Mond, Pilz, Stern. Ich schreibe es mir auf die Stirn, falls noetig.");
    }
    this.state.starInput = [];
    this.updateStarReadout();
    this.ui.starPanel.classList.add("active");
    this.ui.starPanel.setAttribute("aria-hidden", "false");
  }

  closeStarPanel() {
    this.ui.starPanel.classList.remove("active");
    this.ui.starPanel.setAttribute("aria-hidden", "true");
  }

  inputStarSymbol(symbol) {
    if (symbol === "moon") {
      this.playTone(392, 0.05, "triangle", 0.025);
    } else {
      this.playTone(300 + this.state.starInput.length * 70, 0.05, "triangle", 0.022);
    }
    this.state.starInput.push(symbol);
    this.updateStarReadout();
    if (this.state.starInput.length < STAR_SEQUENCE.length) return;
    const solved = STAR_SEQUENCE.every((expected, index) => this.state.starInput[index] === expected);
    if (solved) {
      this.state.flags.starSolved = true;
      this.addItem("crank");
      this.say("Sternkarte", "Klick. Die Truhe oeffnet sich und spuckt eine Kurbel aus. Sehr galant.");
      this.playChime();
      this.closeStarPanel();
      this.updateVisuals();
      this.updateObjective();
    } else {
      this.say("Sternkarte", "Falsch. Die Sterne kichern, was wissenschaftlich unerfreulich ist.");
      this.state.starInput = [];
      this.updateStarReadout();
      this.playAsset("error");
      this.playTone(130, 0.12, "sawtooth", 0.018);
    }
  }

  updateStarReadout() {
    if (!this.state.starInput.length) {
      this.ui.starReadout.textContent = "---";
      return;
    }
    this.ui.starReadout.textContent = this.state.starInput.map((symbol) => STAR_LABELS[symbol]).join(" - ");
  }

  finishGame() {
    this.state.running = false;
    this.ui.finishScreen.classList.add("active");
    this.playChime();
  }

  updateVisuals() {
    const flags = this.state.flags;
    const inventory = this.state.inventory;
    if (this.visuals.broom) this.visuals.broom.visible = !inventory.has("broom");
    if (this.visuals.cheese) this.visuals.cheese.visible = !inventory.has("cheese") && !flags.gargoyleFed;
    if (this.visuals.bellows) this.visuals.bellows.visible = !inventory.has("bellows");
    if (this.visuals.rubberMushroom) this.visuals.rubberMushroom.visible = !inventory.has("rubberMushroom") && !flags.rubberTaken;
    if (this.visuals.wellHandle) this.visuals.wellHandle.visible = flags.crankAttached;
    if (this.visuals.signBoard) {
      this.visuals.signBoard.material.map = flags.signCleaned ? this.textures.cleanSign : this.textures.dirtySign;
      this.visuals.signBoard.material.needsUpdate = true;
    }
    if (this.visuals.chestLid) {
      this.visuals.chestLid.rotation.x = flags.starSolved ? -0.95 : 0;
    }
    if (this.visuals.chestGlow) this.visuals.chestGlow.visible = flags.starSolved && !flags.crankAttached && !inventory.has("crank");
    if (this.visuals.ovenEmber) this.visuals.ovenEmber.visible = flags.sparkTaken;
    if (this.visuals.cauldronBrew) this.visuals.cauldronBrew.visible = flags.potionBrewed;
    if (this.visuals.cauldronSteam) {
      this.visuals.cauldronSteam.forEach((bubble) => {
        bubble.visible = flags.potionBrewed;
      });
    }
    if (this.visuals.portalDisk) {
      this.visuals.portalDisk.material.emissiveIntensity = flags.gateOpen ? 1.8 : 0.75;
      this.visuals.portalDisk.material.opacity = flags.gateOpen ? 0.96 : 0.58;
    }
    if (this.visuals.portalRing) {
      this.visuals.portalRing.material.emissiveIntensity = flags.gateOpen ? 1.7 : flags.sigilOpen ? 1.05 : 0.75;
    }
    if (this.visuals.gargoyle) {
      this.visuals.gargoyle.rotation.y = flags.gargoyleFed ? 0.22 : 0;
    }
    if (this.visuals.pushPlate) {
      this.visuals.pushPlate.material = flags.pushBlockPlaced ? this.materials.pressurePlateSolved : this.materials.pressurePlate;
    }
    if (this.visuals.pushPlateRing) {
      this.visuals.pushPlateRing.material.opacity = flags.pushBlockPlaced ? 0.98 : 0.62;
    }
    ["left-switch", "right-switch"].forEach((id) => {
      const parts = this.visuals[id];
      if (!parts) return;
      const on = id === "left-switch" ? flags.leftSwitch : flags.rightSwitch;
      parts.stick.material = on ? this.materials.switchOn : this.materials.switchOff;
      parts.knob.material = on ? this.materials.switchOn : this.materials.brass;
      parts.stick.rotation.z = (id === "left-switch" ? -1 : 1) * (on ? -0.38 : 0.42);
    });
  }

  updatePushBlock(dt) {
    const block = this.visuals.pushBlock;
    const target = this.state.pushBlockTarget;
    if (!block || !target) return;
    const delta = new THREE.Vector3().subVectors(target, block.position);
    const dist = delta.length();
    if (dist < 0.035) {
      block.position.copy(target);
      this.state.pushBlockTarget = null;
      this.updatePushBlockInteractivePoint();
      const placed = distanceXZ(block.position, this.pushPuzzle.goal) < 0.12;
      if (placed && !this.state.flags.pushBlockPlaced) {
        this.state.flags.pushBlockPlaced = true;
        this.say("Mika", "Der Block sitzt auf der Druckplatte. Das war fast wie geplant.");
        this.updateSwitchPuzzle();
        this.updateVisuals();
        this.updateObjective();
      }
      return;
    }
    delta.normalize();
    block.position.addScaledVector(delta, Math.min(dist, dt * 2.9));
    block.rotation.y += dt * 1.35;
    this.updatePushBlockInteractivePoint();
  }

  updatePlayer(dt) {
    if (!this.state.running || this.ui.starPanel.classList.contains("active")) return;
    const loc = this.locations[this.state.location];
    const move = new THREE.Vector3();
    if (this.keys.has("w") || this.keys.has("arrowup")) move.z -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) move.z += 1;
    if (this.keys.has("a") || this.keys.has("arrowleft")) move.x -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) move.x += 1;

    if (move.lengthSq() > 0) {
      move.normalize();
      this.walkTarget = null;
      this.pendingAction = null;
      const speed = 4.2;
      this.player.position.addScaledVector(move, speed * dt);
      this.player.rotation.y = Math.atan2(move.x, move.z);
    } else if (this.walkTarget) {
      const delta = new THREE.Vector3().subVectors(this.walkTarget, this.player.position);
      delta.y = 0;
      const dist = delta.length();
      if (dist < 0.06) {
        this.player.position.copy(this.walkTarget);
        this.walkTarget = null;
        this.executePendingAction();
      } else {
        delta.normalize();
        const step = Math.min(dist, 4.6 * dt);
        this.player.position.addScaledVector(delta, step);
        this.player.rotation.y = Math.atan2(delta.x, delta.z);
      }
    }

    this.player.position.x = clamp(this.player.position.x, loc.bounds.minX + 0.38, loc.bounds.maxX - 0.38);
    this.player.position.z = clamp(this.player.position.z, loc.bounds.minZ + 0.38, loc.bounds.maxZ - 0.38);
    this.player.position.y = 0;

    if (this.pendingAction && distanceXZ(this.player.position, this.interactives.get(this.pendingAction.id).interactPoint) < 0.28) {
      this.walkTarget = null;
      this.executePendingAction();
    }
  }

  updateCamera(dt) {
    const loc = this.locations[this.state.location];
    this.camera.position.lerp(loc.camera, clamp(dt * 2.8, 0, 1));
    const target = loc.target.clone();
    target.x += (this.player.position.x - loc.center.x) * 0.08;
    target.z += (this.player.position.z - loc.center.z) * 0.08;
    this.cameraLook.lerp(target, clamp(dt * 4, 0, 1));
    this.camera.lookAt(this.cameraLook);
  }

  updateGuideMarker(elapsed) {
    const guide = this.state.guide || this.getGuide();
    const target = guide.targetId ? this.interactives.get(guide.targetId) : null;
    const visible = Boolean(target && target.location === this.state.location && target.group.visible && this.state.running);
    this.guideMarker.visible = visible;
    this.ui.questPointer.classList.toggle("visible", visible);
    if (!visible) return;

    this.guideMarker.position.copy(target.interactPoint);
    this.guideMarker.position.y = 0.08;
    this.guideMarker.rotation.z = elapsed * 1.5;
    this.guideMarker.scale.setScalar(1 + Math.sin(elapsed * 3) * 0.06);

    const projected = target.interactPoint.clone();
    projected.y = 1.6;
    projected.project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    const x = (projected.x * 0.5 + 0.5) * rect.width;
    const y = (-projected.y * 0.5 + 0.5) * rect.height;
    this.ui.questPointer.style.left = `${clamp(x, 46, rect.width - 46)}px`;
    this.ui.questPointer.style.top = `${clamp(y, 96, rect.height - 164)}px`;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;
    this.updatePushBlock(dt);
    this.updatePlayer(dt);
    this.updateCamera(dt);
    this.updateGuideMarker(elapsed);
    if (this.hoverMarker.visible) {
      this.hoverMarker.rotation.z += dt * 2.2;
    }
    if (this.visuals.portalRing) {
      this.visuals.portalRing.rotation.z += dt * (this.state.flags.gateOpen ? 2.7 : 0.75);
      this.visuals.portalDisk.rotation.z -= dt * (this.state.flags.gateOpen ? 1.8 : 0.45);
      const pulse = 1 + Math.sin(elapsed * 2.2) * (this.state.flags.gateOpen ? 0.06 : 0.025);
      this.visuals.portalDisk.scale.setScalar(pulse);
    }
    if (this.visuals.ovenEmber?.visible) {
      this.visuals.ovenEmber.scale.setScalar(1 + Math.sin(elapsed * 8) * 0.12);
    }
    this.animatables.forEach((fn) => fn(dt, elapsed));
    this.renderer.render(this.scene, this.camera);
  }
}

window.murrwaldGame = new MurrwaldGame();
