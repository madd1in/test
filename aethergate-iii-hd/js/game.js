(() => {
  "use strict";

  const THREE = globalThis.THREE;
  const SAVE_KEY = "aethergate-iii-hd-save-v2";
  const CELL = 4;
  const WALL_HEIGHT = 3.25;
  const CAMERA_Y = 1.62;

  const MAP = [
    "############",
    "#S..M..C...#",
    "#.##.##.##.#",
    "#..F..M....#",
    "##.#.###.#M#",
    "#..#...#...#",
    "#M...C.#.F.#",
    "#.###..#.#.#",
    "#...M..K...#",
    "#.##.##.##.#",
    "#...C..M..B#",
    "############",
  ].map((row) => row.split(""));

  const DIRS = [
    { id: "N", dx: 0, dy: -1, yaw: 0 },
    { id: "E", dx: 1, dy: 0, yaw: -Math.PI / 2 },
    { id: "S", dx: 0, dy: 1, yaw: Math.PI },
    { id: "W", dx: -1, dy: 0, yaw: Math.PI / 2 },
  ];

  const SCENES = [
    { name: "Torchvault", objective: "Find the Prism Key", fog: 0x1d1712, wall: 0x4b3829 },
    { name: "Emerald Ruins", objective: "Cross the green ward", fog: 0x12261e, wall: 0x334933 },
    { name: "Crystal Foundry", objective: "Claim the Prism Key", fog: 0x152539, wall: 0x2d4c61 },
    { name: "Obsidian Shrine", objective: "Break the Moon Serpent", fog: 0x241214, wall: 0x4d2721 },
  ];

  const PARTY_TEMPLATE = [
    { name: "Auron", cls: "Sunblade", maxHp: 38, hp: 38, maxMp: 12, mp: 12, atk: 9, mag: 3, def: 5, portrait: 0, xp: 0 },
    { name: "Lyra", cls: "Rune Scholar", maxHp: 24, hp: 24, maxMp: 28, mp: 28, atk: 4, mag: 10, def: 2, portrait: 1, xp: 0 },
    { name: "Kest", cls: "Storm Ranger", maxHp: 30, hp: 30, maxMp: 16, mp: 16, atk: 7, mag: 5, def: 3, portrait: 2, xp: 0 },
    { name: "Mira", cls: "Ember Healer", maxHp: 26, hp: 26, maxMp: 30, mp: 30, atk: 4, mag: 9, def: 3, portrait: 3, xp: 0 },
  ];

  const ENEMY_TYPES = [
    {
      name: "Mossbound Brute",
      lore: "A cave giant wearing living stone and root armor.",
      maxHp: 44,
      atk: 9,
      def: 3,
      portrait: 0,
      xp: 24,
      gold: 22,
    },
    {
      name: "Glasswing Wraith",
      lore: "Its wings ring like crystal when spells strike them.",
      maxHp: 36,
      atk: 8,
      def: 2,
      portrait: 1,
      xp: 30,
      gold: 28,
    },
    {
      name: "Emberforged Sentinel",
      lore: "A furnace knight bound to the forge-road by old vows.",
      maxHp: 52,
      atk: 11,
      def: 5,
      portrait: 2,
      xp: 36,
      gold: 35,
    },
    {
      name: "Moon Serpent Oracle",
      lore: "The gate's final keeper, coiled around a stolen star.",
      maxHp: 96,
      atk: 14,
      def: 4,
      portrait: 3,
      xp: 120,
      gold: 90,
      boss: true,
    },
  ];

  const ITEMS = [
    "Copper astrolabe",
    "Glimmer moss vial",
    "Sapphire fuse",
    "Ashen crown shard",
    "Dawnsteel ring",
  ];

  const AUDIO_FILES = {
    bgm: "assets/audio/bgm/aether-bgm-loop.mp3",
    move: "assets/audio/sfx/checkpoint.mp3",
    ui: "assets/audio/sfx/arcane-start.mp3",
    hit: "assets/audio/sfx/impact.mp3",
    loot: "assets/audio/sfx/gem-pickup.mp3",
    key: "assets/audio/sfx/relic-ping.mp3",
    spell: "assets/audio/sfx/surge-burst.mp3",
    win: "assets/audio/sfx/relic-ping.mp3",
  };

  const dom = {};
  const render = {
    renderer: null,
    scene: null,
    camera: null,
    clock: null,
    targetPos: null,
    currentYaw: 0,
    targetYaw: 0,
    world: null,
    propRoot: null,
    activeEnemy: null,
    activeEnemyKey: "",
    flameSprites: [],
    props: [],
    textures: {},
  };

  const audio = {
    enabled: false,
    unlocked: false,
    bgm: null,
    sfx: {},
  };

  let state = createNewState();

  function createNewState() {
    const created = {
      x: 1,
      y: 1,
      dir: 1,
      day: 1,
      minute: 8 * 60,
      gold: 35,
      food: 8,
      keys: 0,
      party: clone(PARTY_TEMPLATE),
      opened: {},
      defeated: {},
      used: {},
      seen: {},
      inventory: ["Wayfarer map"],
      log: ["The Aethergate opens. Four seekers step into Veyra."],
      combat: null,
      flash: null,
      won: false,
    };
    markSeen(created);
    return created;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function init() {
    bindDom();
    initAudio();
    if (!THREE) {
      log("Three.js could not load. Check assets/vendor/three.global.js.");
      updateAll();
      return;
    }
    initThree();
    bindEvents();
    updateAll();
    log("3D WebGL view ready. Move to start the local MP3 soundtrack.");
  }

  function bindDom() {
    dom.viewport = document.getElementById("viewport");
    dom.placeName = document.getElementById("placeName");
    dom.compass = document.getElementById("compass");
    dom.resourceLine = document.getElementById("resourceLine");
    dom.objectiveChip = document.getElementById("objectiveChip");
    dom.turnChip = document.getElementById("turnChip");
    dom.positionLine = document.getElementById("positionLine");
    dom.roundLine = document.getElementById("roundLine");
    dom.miniMap = document.getElementById("miniMap");
    dom.logList = document.getElementById("logList");
    dom.partyList = document.getElementById("partyList");
    dom.partyPower = document.getElementById("partyPower");
    dom.enemyHealth = document.getElementById("enemyHealth");
    dom.enemyCard = document.getElementById("enemyCard");
    dom.inventoryList = document.getElementById("inventoryList");
    dom.inventoryCount = document.getElementById("inventoryCount");
    dom.soundButton = document.getElementById("soundButton");
  }

  function initAudio() {
    audio.bgm = new window.Audio(AUDIO_FILES.bgm);
    audio.bgm.loop = true;
    audio.bgm.volume = 0.36;
    for (const [key, src] of Object.entries(AUDIO_FILES)) {
      if (key !== "bgm") {
        audio.sfx[key] = src;
      }
    }
  }

  function initThree() {
    render.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    render.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    render.renderer.outputColorSpace = THREE.SRGBColorSpace;
    render.renderer.toneMapping = THREE.AgXToneMapping;
    render.renderer.toneMappingExposure = 1.02;
    render.renderer.shadowMap.enabled = true;
    render.renderer.domElement.setAttribute("aria-label", "Aethergate III true 3D WebGL canvas");
    dom.viewport.innerHTML = "";
    dom.viewport.appendChild(render.renderer.domElement);

    render.scene = new THREE.Scene();
    render.scene.background = new THREE.Color(0x100d0a);
    render.scene.fog = new THREE.FogExp2(0x15100d, 0.035);
    render.camera = new THREE.PerspectiveCamera(68, 1, 0.05, 90);
    render.clock = new THREE.Clock();
    render.targetPos = new THREE.Vector3();
    render.world = new THREE.Group();
    render.propRoot = new THREE.Group();
    render.scene.add(render.world, render.propRoot);

    const hemi = new THREE.HemisphereLight(0xa7d7ff, 0x26140f, 1.35);
    render.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe0a6, 1.4);
    sun.position.set(-8, 12, 4);
    sun.castShadow = true;
    render.scene.add(sun);

    const loader = new THREE.TextureLoader();
    render.textures.enemyAtlas = loadTexture(loader, "assets/imagen/enemy-atlas.png");
    render.textures.sceneAtlas = loadTexture(loader, "assets/imagen/scene-atlas.png");
    render.textures.surfaceAtlas = loadTexture(loader, "assets/imagen/surface-atlas.png");
    render.textures.propAtlas = loadTexture(loader, "assets/imagen/prop-atlas.png");
    render.textures.flame = createFlameTexture();
    buildWorld();
    setCameraTarget(true);
    resizeRenderer();
    window.addEventListener("resize", resizeRenderer);
    render.renderer.setAnimationLoop(animate);
  }

  function loadTexture(loader, src) {
    const texture = loader.load(src);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function createFlameTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(48, 48, 4, 48, 48, 44);
    gradient.addColorStop(0, "rgba(255, 244, 170, 1)");
    gradient.addColorStop(0.3, "rgba(255, 138, 56, 0.9)");
    gradient.addColorStop(0.68, "rgba(202, 53, 42, 0.38)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function buildWorld() {
    render.world.clear();
    render.propRoot.clear();
    render.flameSprites = [];
    render.props = [];

    const floorGeo = new THREE.PlaneGeometry(CELL, CELL);
    floorGeo.rotateX(-Math.PI / 2);
    const ceilingGeo = new THREE.PlaneGeometry(CELL, CELL);
    ceilingGeo.rotateX(Math.PI / 2);
    const wallGeo = new THREE.BoxGeometry(CELL, WALL_HEIGHT, CELL);

    const floorMats = SCENES.map((zone, index) => new THREE.MeshStandardMaterial({
      map: makeAtlasTexture(render.textures.surfaceAtlas, index),
      color: 0xffffff,
      roughness: index === 2 ? 0.46 : 0.86,
      metalness: index === 2 ? 0.2 : 0.05,
    }));
    const ceilingMats = SCENES.map((zone, index) => new THREE.MeshStandardMaterial({
      map: makeAtlasTexture(render.textures.surfaceAtlas, index),
      color: index === 3 ? 0x8b6f62 : 0x958b7c,
      roughness: 0.9,
      metalness: 0.02,
      emissive: index === 3 ? 0x2a0c08 : 0x080706,
      emissiveIntensity: 0.18,
    }));
    const wallMats = SCENES.map((zone, index) => new THREE.MeshStandardMaterial({
      map: makeAtlasTexture(render.textures.surfaceAtlas, index),
      color: 0xffffff,
      roughness: index === 3 ? 0.72 : 0.88,
      metalness: index === 2 ? 0.18 : 0.04,
      emissive: index === 3 ? 0x35100a : 0x000000,
      emissiveIntensity: index === 3 ? 0.35 : 0,
    }));

    for (let y = 0; y < MAP.length; y += 1) {
      for (let x = 0; x < MAP[y].length; x += 1) {
        const pos = cellToWorld(x, y);
        const tile = getTile(x, y);
        const zone = sceneIndexFor(x, y);
        if (tile === "#") {
          const wall = new THREE.Mesh(wallGeo, wallMats[zone]);
          wall.position.set(pos.x, WALL_HEIGHT / 2, pos.z);
          wall.castShadow = true;
          wall.receiveShadow = true;
          render.world.add(wall);
          continue;
        }

        const floor = new THREE.Mesh(floorGeo, floorMats[zone]);
        floor.position.set(pos.x, 0, pos.z);
        floor.receiveShadow = true;
        render.world.add(floor);

        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMats[zone]);
        ceiling.position.set(pos.x, WALL_HEIGHT, pos.z);
        render.world.add(ceiling);

        if ((x + y) % 4 === 0) {
          addTorch(pos.x - CELL * 0.38, pos.z - CELL * 0.38, zone);
        }

        addPropForTile(tile, x, y, pos);
      }
    }

    addSceneMurals();
  }

  function addTorch(x, z, zone) {
    const lightColors = [0xffb562, 0x86ffd5, 0x94caff, 0xff805a];
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: render.textures.flame,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: lightColors[zone],
    }));
    sprite.position.set(x, 1.85, z);
    sprite.scale.set(0.72, 0.72, 0.72);
    sprite.userData.baseScale = 0.72;
    render.world.add(sprite);
    render.flameSprites.push(sprite);

    const light = new THREE.PointLight(lightColors[zone], 1.2, 8, 1.6);
    light.position.copy(sprite.position);
    render.world.add(light);
    sprite.userData.light = light;
  }

  function addPropForTile(tile, x, y, pos) {
    if (tile === "C") {
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.45, 0.62, 0.92),
        new THREE.MeshStandardMaterial({ color: 0x6b3f22, roughness: 0.75, metalness: 0.15 })
      );
      const lid = new THREE.Mesh(
        new THREE.BoxGeometry(1.56, 0.16, 1.02),
        new THREE.MeshStandardMaterial({ color: 0xd0a34d, roughness: 0.4, metalness: 0.65 })
      );
      lid.position.y = 0.42;
      const sprite = makePropSprite(0, 1.75, 0.9);
      sprite.position.set(0, 1.1, 0);
      group.add(base, lid, sprite);
      group.position.set(pos.x, 0.32, pos.z);
      group.userData = { kind: "chest", key: keyOf(x, y) };
      render.propRoot.add(group);
      render.props.push(group);
    }

    if (tile === "F") {
      const stone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 1.12, 0.48, 32),
        new THREE.MeshStandardMaterial({ color: 0x59635c, roughness: 0.72, metalness: 0.08 })
      );
      stone.position.set(pos.x, 0.24, pos.z);
      const water = new THREE.Mesh(
        new THREE.CircleGeometry(0.74, 32),
        new THREE.MeshBasicMaterial({ color: 0x5de0c6, transparent: true, opacity: 0.52, side: THREE.DoubleSide })
      );
      water.rotation.x = -Math.PI / 2;
      water.position.set(pos.x, 0.5, pos.z);
      const group = new THREE.Group();
      group.add(stone, water);
      const sprite = makePropSprite(1, 2.1, 0.82);
      sprite.position.set(0, 1.35, 0);
      group.add(sprite);
      group.userData = { kind: "fountain", key: keyOf(x, y), water };
      render.propRoot.add(group);
      render.props.push(group);
    }

    if (tile === "K") {
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.58, 1),
        new THREE.MeshStandardMaterial({
          color: 0x9decff,
          emissive: 0x2cc9e9,
          emissiveIntensity: 1.4,
          roughness: 0.18,
          metalness: 0.08,
        })
      );
      gem.position.set(pos.x, 1.18, pos.z);
      gem.userData = { kind: "key", key: keyOf(x, y), spin: true };
      render.propRoot.add(gem);
      render.props.push(gem);
      const keySprite = makePropSprite(2, 1.95, 0.78);
      keySprite.position.set(pos.x, 1.45, pos.z);
      keySprite.userData = { kind: "key", key: keyOf(x, y), spin: true };
      render.propRoot.add(keySprite);
      render.props.push(keySprite);
      const light = new THREE.PointLight(0x7cf1ff, 2.1, 9, 1.4);
      light.position.set(pos.x, 1.7, pos.z);
      render.propRoot.add(light);
    }

    if (tile === "B") {
      const group = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0x3a1718, emissive: 0x471112, emissiveIntensity: 0.6 });
      const left = new THREE.Mesh(new THREE.BoxGeometry(0.34, 2.8, 0.42), mat);
      const right = left.clone();
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.34, 0.42), mat);
      left.position.set(-0.95, 1.4, 0);
      right.position.set(0.95, 1.4, 0);
      top.position.set(0, 2.72, 0);
      group.add(left, right, top);
      const sprite = makePropSprite(3, 3.75, 0.88);
      sprite.position.set(0, 1.7, 0.04);
      group.add(sprite);
      group.position.set(pos.x, 0, pos.z);
      group.userData = { kind: "gate", key: keyOf(x, y) };
      render.propRoot.add(group);
      render.props.push(group);
    }
  }

  function addSceneMurals() {
    const placements = [
      { zone: 0, x: 2, y: 1, yaw: Math.PI },
      { zone: 1, x: 9, y: 1, yaw: Math.PI },
      { zone: 2, x: 4, y: 8, yaw: 0 },
      { zone: 3, x: 10, y: 10, yaw: Math.PI / 2 },
    ];
    const geo = new THREE.PlaneGeometry(CELL * 1.55, WALL_HEIGHT * 0.72);
    for (const place of placements) {
      const pos = cellToWorld(place.x, place.y);
      const mat = new THREE.MeshBasicMaterial({
        map: makeAtlasTexture(render.textures.sceneAtlas, place.zone),
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
      });
      const mural = new THREE.Mesh(geo, mat);
      mural.position.set(pos.x, 1.65, pos.z);
      mural.rotation.y = place.yaw;
      render.world.add(mural);
    }
  }

  function bindEvents() {
    document.body.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) {
        return;
      }
      handleAction(button.dataset.action);
    });

    window.addEventListener("keydown", (event) => {
      if (event.defaultPrevented || event.repeat) {
        return;
      }
      const key = event.key.toLowerCase();
      const map = {
        w: "forward",
        arrowup: "forward",
        s: "back",
        arrowdown: "back",
        a: "turnLeft",
        arrowleft: "turnLeft",
        d: "turnRight",
        arrowright: "turnRight",
        " ": state.combat ? "attack" : "search",
        r: "rest",
        m: "sound",
      };
      if (map[key]) {
        event.preventDefault();
        handleAction(map[key]);
      }
    });
  }

  function handleAction(action) {
    if (action === "sound") {
      toggleSound();
      updateAll();
      return;
    }
    unlockAudio();

    if (action === "save") {
      saveGame();
      playSfx("ui");
      return;
    }
    if (action === "load") {
      loadGame();
      playSfx("ui");
      return;
    }
    if (action === "reset") {
      if (window.confirm("Start a new expedition?")) {
        state = createNewState();
        setCameraTarget(true);
        playSfx("ui");
        updateAll();
      }
      return;
    }

    if (isPartyDown()) {
      log("The party is down. Start a new expedition or load a save.");
      updateAll();
      return;
    }

    if (state.combat) {
      handleCombatAction(action);
      return;
    }

    switch (action) {
      case "forward":
        move(1);
        break;
      case "back":
        move(-1);
        break;
      case "turnLeft":
        turn(-1);
        break;
      case "turnRight":
        turn(1);
        break;
      case "search":
        search();
        break;
      case "rest":
        rest();
        break;
      default:
        break;
    }
  }

  function handleCombatAction(action) {
    switch (action) {
      case "attack":
        partyAttack();
        break;
      case "skill":
        partySkill();
        break;
      case "guard":
        log("The party braces behind shields and wards.");
        playSfx("ui");
        enemyTurn(true);
        break;
      case "flee":
        flee();
        break;
      default:
        log("No time for that while a foe is in reach.");
        break;
    }
    updateAll();
  }

  function move(amount) {
    const dir = DIRS[state.dir];
    const target = { x: state.x + dir.dx * amount, y: state.y + dir.dy * amount };
    const tile = getTile(target.x, target.y);
    if (!isWalkable(target.x, target.y)) {
      log(tile === "#" ? "A wall blocks the way." : "The way is sealed.");
      pulse("wall");
      playSfx("ui");
      updateAll();
      return;
    }
    if (tile === "B" && state.keys < 1 && !state.won) {
      log("The obsidian gate asks for the Prism Key.");
      pulse("gate");
      playSfx("spell");
      updateAll();
      return;
    }
    state.x = target.x;
    state.y = target.y;
    spendTime(amount > 0 ? 8 : 10);
    markSeen(state);
    setCameraTarget(false);
    playSfx("move");
    checkCurrentTile();
    updateAll();
  }

  function turn(delta) {
    state.dir = (state.dir + delta + DIRS.length) % DIRS.length;
    spendTime(2);
    setCameraTarget(false);
    playSfx("ui");
    log(`Facing ${DIRS[state.dir].id}.`);
    updateAll();
  }

  function search() {
    const here = getTile(state.x, state.y);
    const ahead = aheadPos();
    const aheadTile = getTile(ahead.x, ahead.y);

    if (here === "K") {
      claimPrismKey();
      updateAll();
      return;
    }

    if (here === "C" || aheadTile === "C") {
      const pos = here === "C" ? { x: state.x, y: state.y } : ahead;
      openChest(pos.x, pos.y);
      updateAll();
      return;
    }

    if (here === "F" || aheadTile === "F") {
      useFountain(here === "F" ? state.x : ahead.x, here === "F" ? state.y : ahead.y);
      updateAll();
      return;
    }

    if ((aheadTile === "M" || aheadTile === "B") && !state.defeated[keyOf(ahead.x, ahead.y)]) {
      log("Tracks, breath, and claw marks: danger waits directly ahead.");
      pulse("threat");
      playSfx("spell");
    } else {
      log(findMapClue());
      playSfx("ui");
    }
    spendTime(6);
    updateAll();
  }

  function rest() {
    if (state.food <= 0) {
      log("No food remains for a safe rest.");
      playSfx("ui");
      updateAll();
      return;
    }
    state.food -= 1;
    spendTime(90);
    for (const hero of state.party) {
      if (hero.hp > 0) {
        hero.hp = clamp(hero.hp + 9 + hero.def, 1, hero.maxHp);
        hero.mp = clamp(hero.mp + 8, 0, hero.maxMp);
      }
    }
    if (Math.random() < 0.18) {
      const open = nearestOpenEncounter();
      if (open) {
        log("A patrol finds the campfire smoke.");
        startCombat(open.x, open.y, true);
      } else {
        log("The party rests under watchful stars.");
      }
    } else {
      log("The party rests and binds wounds.");
    }
    playSfx("spell");
    updateAll();
  }

  function checkCurrentTile() {
    const tile = getTile(state.x, state.y);
    if (tile === "M" || tile === "B") {
      const encounterKey = keyOf(state.x, state.y);
      if (!state.defeated[encounterKey]) {
        startCombat(state.x, state.y, false);
      }
      return;
    }
    if (tile === "K") {
      log("A white prism hums on an anvil-like plinth.");
      return;
    }
    if (tile === "C") {
      log("An old coffer waits here. Search to open it.");
      return;
    }
    if (tile === "F") {
      log("A silver fountain glows. Search to draw from it.");
      return;
    }
    if (tile === "S") {
      log("The gate-stone behind you still remembers daylight.");
    }
  }

  function startCombat(x, y, ambush) {
    const enemy = createEnemy(x, y);
    state.combat = { ...enemy, hp: enemy.maxHp, key: keyOf(x, y), round: 1, ambush };
    log(`${ambush ? "Ambush: " : ""}${enemy.name} blocks the path.`);
    pulse("threat");
    playSfx("spell");
  }

  function createEnemy(x, y) {
    if (getTile(x, y) === "B") {
      return clone(ENEMY_TYPES[3]);
    }
    const zone = sceneIndexFor(x, y);
    const base = clone(ENEMY_TYPES[zone % 3]);
    const depth = Math.floor((x + y) / 4);
    base.maxHp += depth * 4;
    base.atk += Math.floor(depth / 2);
    base.gold += depth * 3;
    base.xp += depth * 3;
    return base;
  }

  function partyAttack() {
    if (!state.combat) {
      return;
    }
    let total = 0;
    for (const hero of livingHeroes()) {
      const damage = rollDamage(hero.atk + Math.floor(hero.xp / 50), state.combat.def);
      total += damage;
      state.combat.hp -= damage;
    }
    log(`The party strikes for ${total} damage.`);
    pulse("hit");
    playSfx("hit");
    if (checkVictory()) {
      return;
    }
    enemyTurn(false);
  }

  function partySkill() {
    if (!state.combat) {
      return;
    }
    let total = 0;
    const knight = state.party[0];
    const scholar = state.party[1];
    const ranger = state.party[2];
    const healer = state.party[3];

    if (knight.hp > 0 && knight.mp >= 3) {
      knight.mp -= 3;
      total += skillDamage(knight, 1.55);
    } else if (knight.hp > 0) {
      total += rollDamage(knight.atk, state.combat.def);
    }

    if (scholar.hp > 0 && scholar.mp >= 7) {
      scholar.mp -= 7;
      total += skillDamage(scholar, 2.3);
    }

    if (ranger.hp > 0 && ranger.mp >= 4) {
      ranger.mp -= 4;
      total += skillDamage(ranger, 1.75);
    } else if (ranger.hp > 0) {
      total += rollDamage(ranger.atk, state.combat.def);
    }

    if (healer.hp > 0 && healer.mp >= 8) {
      healer.mp -= 8;
      const target = lowestLivingHero();
      const amount = 16 + healer.mag + rand(0, 5);
      target.hp = clamp(target.hp + amount, 1, target.maxHp);
      log(`Mira restores ${amount} HP to ${target.name}.`);
    } else if (healer.hp > 0) {
      total += rollDamage(healer.mag, state.combat.def);
    }

    if (total > 0) {
      state.combat.hp -= total;
      log(`Sun, storm, and runes burst for ${total} damage.`);
      pulse("spell");
      playSfx("spell");
    }
    if (checkVictory()) {
      return;
    }
    enemyTurn(false);
  }

  function enemyTurn(guarded) {
    if (!state.combat) {
      return;
    }
    const strikes = state.combat.boss && state.combat.hp < state.combat.maxHp * 0.5 ? 2 : 1;
    for (let i = 0; i < strikes; i += 1) {
      const target = randomLivingHero();
      if (!target) {
        break;
      }
      let damage = rollDamage(state.combat.atk, target.def);
      if (guarded) {
        damage = Math.max(1, Math.floor(damage * 0.48));
      }
      target.hp = clamp(target.hp - damage, 0, target.maxHp);
      log(`${state.combat.name} hits ${target.name} for ${damage}.`);
      playSfx("hit");
    }
    state.combat.round += 1;
    spendTime(5);
    if (isPartyDown()) {
      log("The expedition falls silent in the dark.");
      pulse("down");
    }
  }

  function flee() {
    if (!state.combat) {
      return;
    }
    if (state.combat.boss) {
      log("The Moon Serpent seals every path of retreat.");
      enemyTurn(false);
      return;
    }
    if (Math.random() < 0.62) {
      const old = state.combat.name;
      state.combat = null;
      log(`The party slips away from ${old}.`);
      move(-1);
    } else {
      log("Retreat fails.");
      enemyTurn(false);
    }
  }

  function checkVictory() {
    if (!state.combat || state.combat.hp > 0) {
      return false;
    }
    const enemy = state.combat;
    state.defeated[enemy.key] = true;
    state.gold += enemy.gold;
    state.food += enemy.boss ? 0 : 1;
    for (const hero of state.party) {
      hero.xp += enemy.xp;
      const levelBonus = Math.floor(hero.xp / 90);
      hero.maxHp = PARTY_TEMPLATE[hero.portrait].maxHp + levelBonus * 3;
      hero.maxMp = PARTY_TEMPLATE[hero.portrait].maxMp + levelBonus * 2;
      hero.hp = clamp(hero.hp + 4, 1, hero.maxHp);
    }
    if (enemy.boss) {
      state.won = true;
      state.inventory.push("Star Prism");
      log("The Moon Serpent breaks. Veyra's gate is free.");
      playSfx("win");
    } else {
      const item = ITEMS[(state.inventory.length + enemy.portrait) % ITEMS.length];
      if (!state.inventory.includes(item)) {
        state.inventory.push(item);
      }
      log(`${enemy.name} falls. +${enemy.gold} gold, +${enemy.xp} XP.`);
      playSfx("loot");
    }
    state.combat = null;
    spendTime(12);
    return true;
  }

  function openChest(x, y) {
    const chestKey = keyOf(x, y);
    if (state.opened[chestKey]) {
      log("The coffer is already empty.");
      playSfx("ui");
      return;
    }
    state.opened[chestKey] = true;
    const gold = 24 + (x + y) * 3;
    const food = 1 + ((x + y) % 2);
    state.gold += gold;
    state.food += food;
    const item = ITEMS[(x + y) % ITEMS.length];
    if (!state.inventory.includes(item)) {
      state.inventory.push(item);
    }
    spendTime(8);
    log(`Chest opened: ${gold} gold, ${food} food, ${item}.`);
    pulse("loot");
    playSfx("loot");
  }

  function claimPrismKey() {
    if (state.keys > 0) {
      log("The prism plinth is empty now.");
      playSfx("ui");
      return;
    }
    state.keys = 1;
    state.inventory.push("Prism Key");
    log("Prism Key claimed. The obsidian gate will answer now.");
    pulse("key");
    playSfx("key");
  }

  function useFountain(x, y) {
    const fountainKey = keyOf(x, y);
    if (state.used[fountainKey]) {
      log("The fountain has faded to clear water.");
      playSfx("ui");
      return;
    }
    state.used[fountainKey] = true;
    for (const hero of state.party) {
      if (hero.hp > 0) {
        hero.hp = hero.maxHp;
        hero.mp = hero.maxMp;
      }
    }
    spendTime(5);
    log("Fountain light restores the party.");
    pulse("heal");
    playSfx("spell");
  }

  function saveGame() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    log("Expedition saved.");
    updateAll();
  }

  function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      log("No save found.");
      updateAll();
      return;
    }
    try {
      state = JSON.parse(raw);
      normalizeState();
      setCameraTarget(true);
      log("Expedition loaded.");
    } catch (error) {
      console.error(error);
      log("Save data could not be read.");
    }
    updateAll();
  }

  function normalizeState() {
    state.opened ||= {};
    state.defeated ||= {};
    state.used ||= {};
    state.seen ||= {};
    state.inventory ||= [];
    state.log ||= [];
    state.party ||= clone(PARTY_TEMPLATE);
    state.minute ||= 8 * 60;
    state.day ||= 1;
    state.dir = clamp(state.dir ?? 1, 0, 3);
    markSeen(state);
  }

  function updateAll() {
    updateHud();
    updateParty();
    updateCombat();
    updateInventory();
    updateMap();
    updateLog();
    updateSoundUi();
    update3DState();
  }

  function updateHud() {
    const scene = SCENES[sceneIndexFor(state.x, state.y)];
    dom.placeName.textContent = scene.name;
    dom.compass.textContent = DIRS[state.dir].id;
    dom.resourceLine.textContent = `Gold ${state.gold} / Keys ${state.keys} / Food ${state.food}`;
    dom.objectiveChip.textContent = state.won
      ? "Return to the gate-stone"
      : state.keys > 0
        ? "Find the Obsidian Shrine"
        : scene.objective;
    dom.turnChip.textContent = state.combat ? `Combat round ${state.combat.round}` : `${timeText()} / ${aliveCount()} heroes`;
    dom.positionLine.textContent = `${state.x},${state.y} facing ${DIRS[state.dir].id}`;
    dom.roundLine.textContent = `Day ${state.day} ${timeText()}`;
  }

  function updateParty() {
    const totalPower = state.party.reduce((sum, hero) => sum + hero.atk + hero.mag + hero.def + Math.floor(hero.xp / 60), 0);
    dom.partyPower.textContent = `Power ${totalPower}`;
    dom.partyList.innerHTML = state.party
      .map((hero) => {
        const hpPct = percent(hero.hp, hero.maxHp);
        const mpPct = percent(hero.mp, hero.maxMp);
        return `
          <article class="hero-card ${hero.hp <= 0 ? "down" : ""}">
            <div class="portrait" style="--atlas: url('assets/imagen/party-atlas.png'); background-position: ${quadrantPosition(hero.portrait)}"></div>
            <div>
              <div class="hero-name-row">
                <span>${escapeHtml(hero.name)}</span>
                <span class="hero-class">${escapeHtml(hero.cls)}</span>
              </div>
              <div class="hero-stats">
                <span>HP ${hero.hp}/${hero.maxHp}</span>
                <span>XP ${hero.xp}</span>
                <span>MP ${hero.mp}/${hero.maxMp}</span>
                <span>DEF ${hero.def}</span>
              </div>
              <div class="bar hp" style="--value: ${hpPct}%"><span></span></div>
              <div class="bar mp" style="--value: ${mpPct}%"><span></span></div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function updateCombat() {
    if (!state.combat) {
      dom.enemyHealth.textContent = "No threat";
      dom.enemyCard.classList.add("hidden");
      dom.enemyCard.innerHTML = "";
      return;
    }
    const enemy = state.combat;
    dom.enemyHealth.textContent = `${Math.max(0, enemy.hp)}/${enemy.maxHp} HP`;
    dom.enemyCard.classList.remove("hidden");
    dom.enemyCard.innerHTML = `
      <div class="enemy-portrait" style="--atlas: url('assets/imagen/enemy-atlas.png'); background-position: ${quadrantPosition(enemy.portrait)}"></div>
      <div>
        <p class="enemy-name">${escapeHtml(enemy.name)}</p>
        <p class="enemy-lore">${escapeHtml(enemy.lore)}</p>
        <div class="bar hp" style="--value: ${percent(enemy.hp, enemy.maxHp)}%"><span></span></div>
      </div>
    `;
  }

  function updateInventory() {
    dom.inventoryCount.textContent = `${state.inventory.length} items`;
    dom.inventoryList.innerHTML = state.inventory.map((item) => `<span class="inventory-item">${escapeHtml(item)}</span>`).join("");
  }

  function updateLog() {
    dom.logList.innerHTML = state.log.slice(-9).map((entry) => `<li>${escapeHtml(entry)}</li>`).join("");
  }

  function updateMap() {
    const cells = [];
    for (let y = 0; y < MAP.length; y += 1) {
      for (let x = 0; x < MAP[y].length; x += 1) {
        const key = keyOf(x, y);
        const tile = getTile(x, y);
        let cls = "map-cell";
        if (x === state.x && y === state.y) {
          cls += " player";
        } else if (!state.seen[key]) {
          cls += " unseen";
        } else if (tile === "#") {
          cls += " wall";
        } else if ((tile === "M" || tile === "B") && !state.defeated[key]) {
          cls += " threat";
        } else if ("CFKS".includes(tile)) {
          cls += " event";
        } else {
          cls += " floor";
        }
        cells.push(`<span class="${cls}" title="${x},${y}"></span>`);
      }
    }
    dom.miniMap.innerHTML = cells.join("");
  }

  function update3DState() {
    if (!render.scene) {
      return;
    }
    const zone = SCENES[sceneIndexFor(state.x, state.y)];
    render.scene.fog.color.setHex(zone.fog);
    render.scene.background.setHex(zone.fog);
    for (const prop of render.props) {
      const data = prop.userData;
      if (data.kind === "chest") {
        prop.visible = !state.opened[data.key];
      }
      if (data.kind === "fountain") {
        prop.visible = !state.used[data.key];
      }
      if (data.kind === "key") {
        prop.visible = state.keys < 1;
      }
    }
    syncEnemySprite();
  }

  function syncEnemySprite() {
    if (!render.scene) {
      return;
    }

    let descriptor = null;
    if (state.combat) {
      descriptor = {
        key: `combat-${state.combat.key}-${state.combat.portrait}`,
        enemy: state.combat,
        pos: combatSpritePosition(),
        scale: state.combat.boss ? 3.35 : 2.65,
      };
    } else {
      const ahead = aheadPos();
      const tile = getTile(ahead.x, ahead.y);
      if ((tile === "M" || tile === "B") && !state.defeated[keyOf(ahead.x, ahead.y)]) {
        const enemy = createEnemy(ahead.x, ahead.y);
        descriptor = {
          key: `preview-${ahead.x},${ahead.y}-${enemy.portrait}`,
          enemy,
          pos: cellToWorld(ahead.x, ahead.y),
          scale: enemy.boss ? 2.9 : 2.25,
        };
      }
    }

    if (!descriptor) {
      if (render.activeEnemy) {
        render.scene.remove(render.activeEnemy);
        render.activeEnemy.material.map?.dispose?.();
        render.activeEnemy.material.dispose();
        render.activeEnemy = null;
        render.activeEnemyKey = "";
      }
      return;
    }

    if (!render.activeEnemy || render.activeEnemyKey !== descriptor.key) {
      if (render.activeEnemy) {
        render.scene.remove(render.activeEnemy);
        render.activeEnemy.material.map?.dispose?.();
        render.activeEnemy.material.dispose();
      }
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeAtlasTexture(render.textures.enemyAtlas, descriptor.enemy.portrait),
        transparent: true,
        depthWrite: false,
      }));
      sprite.userData.baseScale = descriptor.scale;
      sprite.userData.baseY = 1.38;
      render.activeEnemy = sprite;
      render.activeEnemyKey = descriptor.key;
      render.scene.add(sprite);
    }

    render.activeEnemy.position.set(descriptor.pos.x, 1.38, descriptor.pos.z);
    render.activeEnemy.scale.set(descriptor.scale, descriptor.scale, descriptor.scale);
  }

  function animate() {
    if (!render.renderer) {
      return;
    }
    const dt = Math.min(render.clock.getDelta(), 0.05);
    const elapsed = render.clock.elapsedTime;
    cameraStep(dt, elapsed);
    animateProps(elapsed);
    render.renderer.render(render.scene, render.camera);
  }

  function cameraStep(dt, elapsed) {
    const ease = 1 - Math.exp(-dt * 9.5);
    render.camera.position.lerp(render.targetPos, ease);
    const yawDelta = shortestAngle(render.currentYaw, render.targetYaw);
    render.currentYaw += yawDelta * ease;
    const stride = render.camera.position.distanceTo(render.targetPos) > 0.03 ? Math.sin(elapsed * 15) * 0.018 : 0;
    render.camera.position.y = CAMERA_Y + stride;
    render.camera.rotation.set(0, render.currentYaw, 0);
  }

  function animateProps(elapsed) {
    for (const sprite of render.flameSprites) {
      const pulseAmount = 1 + Math.sin(elapsed * 7 + sprite.position.x) * 0.16;
      const size = sprite.userData.baseScale * pulseAmount;
      sprite.scale.set(size, size, size);
      if (sprite.userData.light) {
        sprite.userData.light.intensity = 0.9 + Math.sin(elapsed * 6 + sprite.position.z) * 0.28;
      }
      sprite.lookAt(render.camera.position);
    }

    for (const prop of render.props) {
      if (prop.userData.spin) {
        prop.rotation.y = elapsed * 1.4;
        prop.position.y = 1.18 + Math.sin(elapsed * 2.8) * 0.14;
      }
      if (prop.userData.water) {
        prop.userData.water.rotation.z = elapsed * 0.45;
      }
    }

    if (render.activeEnemy) {
      const base = render.activeEnemy.userData.baseScale || 2.5;
      const breathe = 1 + Math.sin(elapsed * 3.2) * 0.055;
      render.activeEnemy.position.y = (render.activeEnemy.userData.baseY || 1.38) + Math.sin(elapsed * 2.7) * 0.12;
      render.activeEnemy.scale.set(base * breathe, base * breathe, base * breathe);
      render.activeEnemy.material.rotation = Math.sin(elapsed * 1.7) * 0.035;
      render.activeEnemy.lookAt(render.camera.position);
    }
  }

  function resizeRenderer() {
    if (!render.renderer) {
      return;
    }
    const rect = dom.viewport.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(240, Math.floor(rect.height));
    render.renderer.setSize(width, height, false);
    render.camera.aspect = width / height;
    render.camera.updateProjectionMatrix();
  }

  function setCameraTarget(instant) {
    if (!render.camera || !render.targetPos) {
      return;
    }
    const pos = cellToWorld(state.x, state.y);
    render.targetPos.set(pos.x, CAMERA_Y, pos.z);
    render.targetYaw = DIRS[state.dir].yaw;
    if (instant) {
      render.camera.position.copy(render.targetPos);
      render.currentYaw = render.targetYaw;
      render.camera.rotation.set(0, render.currentYaw, 0);
    }
  }

  function combatSpritePosition() {
    const dir = DIRS[state.dir];
    const here = cellToWorld(state.x, state.y);
    return {
      x: here.x + dir.dx * CELL * 0.92,
      z: here.z + dir.dy * CELL * 0.92,
    };
  }

  function makeAtlasTexture(base, index) {
    const texture = base.clone();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat.set(0.5, 0.5);
    texture.offset.set(index % 2 === 0 ? 0 : 0.5, index < 2 ? 0.5 : 0);
    if (render.renderer) {
      texture.anisotropy = Math.min(8, render.renderer.capabilities.getMaxAnisotropy());
    }
    texture.needsUpdate = true;
    return texture;
  }

  function makePropSprite(index, scale, opacity) {
    const material = new THREE.SpriteMaterial({
      map: makeAtlasTexture(render.textures.propAtlas, index),
      transparent: true,
      opacity,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(scale, scale, scale);
    return sprite;
  }

  function cellToWorld(x, y) {
    return {
      x: (x - MAP[0].length / 2) * CELL + CELL / 2,
      z: (y - MAP.length / 2) * CELL + CELL / 2,
    };
  }

  function getTile(x, y) {
    if (y < 0 || y >= MAP.length || x < 0 || x >= MAP[0].length) {
      return "#";
    }
    return MAP[y][x];
  }

  function isWalkable(x, y) {
    return getTile(x, y) !== "#";
  }

  function aheadPos() {
    const dir = DIRS[state.dir];
    return { x: state.x + dir.dx, y: state.y + dir.dy };
  }

  function sceneIndexFor(x, y) {
    if (y < 5 && x < 6) {
      return 0;
    }
    if (y < 5 && x >= 6) {
      return 1;
    }
    if (y >= 5 && x < 7) {
      return 2;
    }
    return 3;
  }

  function markSeen(targetState) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const x = targetState.x + dx;
        const y = targetState.y + dy;
        if (x >= 0 && y >= 0 && y < MAP.length && x < MAP[0].length) {
          targetState.seen[keyOf(x, y)] = true;
        }
      }
    }
  }

  function keyOf(x, y) {
    return `${x},${y}`;
  }

  function log(message) {
    state.log.push(message);
    if (state.log.length > 60) {
      state.log = state.log.slice(-60);
    }
  }

  function spendTime(minutes) {
    state.minute += minutes;
    while (state.minute >= 24 * 60) {
      state.minute -= 24 * 60;
      state.day += 1;
      if (state.food > 0) {
        state.food -= 1;
      }
    }
  }

  function timeText() {
    const hours = Math.floor(state.minute / 60);
    const minutes = state.minute % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function pulse(kind) {
    state.flash = { kind, at: performance.now() };
  }

  function livingHeroes() {
    return state.party.filter((hero) => hero.hp > 0);
  }

  function aliveCount() {
    return livingHeroes().length;
  }

  function isPartyDown() {
    return aliveCount() === 0;
  }

  function randomLivingHero() {
    const living = livingHeroes();
    return living.length ? living[rand(0, living.length - 1)] : null;
  }

  function lowestLivingHero() {
    return livingHeroes().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  }

  function rollDamage(power, defense) {
    return Math.max(1, power + rand(0, 5) - Math.floor(defense * 0.65));
  }

  function skillDamage(hero, scale) {
    return Math.max(2, Math.floor((hero.atk + hero.mag + rand(2, 8)) * scale - state.combat.def));
  }

  function nearestOpenEncounter() {
    for (let y = 1; y < MAP.length - 1; y += 1) {
      for (let x = 1; x < MAP[y].length - 1; x += 1) {
        const tile = getTile(x, y);
        if (tile === "M" && !state.defeated[keyOf(x, y)]) {
          return { x, y };
        }
      }
    }
    return null;
  }

  function findMapClue() {
    const surroundings = [
      getTile(state.x + 1, state.y),
      getTile(state.x - 1, state.y),
      getTile(state.x, state.y + 1),
      getTile(state.x, state.y - 1),
    ];
    if (surroundings.includes("C")) {
      return "Metal hinges scrape nearby. A coffer is close.";
    }
    if (surroundings.includes("K") && state.keys < 1) {
      return "A clean star-tone vibrates through the floor.";
    }
    if (surroundings.includes("B")) {
      return "Moonlit scales rasp beyond the stone.";
    }
    return "Dust, old boot prints, and a faint draft. Nothing else.";
  }

  function toggleSound() {
    audio.enabled = !audio.enabled;
    if (audio.enabled) {
      unlockAudio();
      log("Local MP3 BGM and SFX enabled.");
      playSfx("ui");
    } else {
      audio.bgm.pause();
      log("Sound muted.");
    }
  }

  function unlockAudio() {
    if (audio.unlocked) {
      if (audio.enabled && audio.bgm.paused) {
        audio.bgm.play().catch(() => {});
      }
      return;
    }
    audio.unlocked = true;
    audio.enabled = true;
    audio.bgm.play().catch(() => {});
    updateSoundUi();
  }

  function playSfx(name) {
    if (!audio.enabled || !audio.unlocked || !audio.sfx[name]) {
      return;
    }
    const clip = new window.Audio(audio.sfx[name]);
    clip.volume = name === "hit" ? 0.45 : 0.36;
    clip.play().catch(() => {});
  }

  function updateSoundUi() {
    if (!dom.soundButton) {
      return;
    }
    dom.soundButton.textContent = audio.enabled ? "Sound On" : "Sound";
    dom.soundButton.setAttribute("aria-pressed", audio.enabled ? "true" : "false");
  }

  function shortestAngle(from, to) {
    let delta = to - from;
    while (delta > Math.PI) {
      delta -= Math.PI * 2;
    }
    while (delta < -Math.PI) {
      delta += Math.PI * 2;
    }
    return delta;
  }

  function percent(value, max) {
    return clamp(Math.round((value / Math.max(1, max)) * 100), 0, 100);
  }

  function quadrantPosition(index) {
    return `${index % 2 ? "100%" : "0%"} ${index > 1 ? "100%" : "0%"}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  if (typeof window !== "undefined") {
    window.AethergateDebug = {
      get state() {
        return state;
      },
      captureCanvas() {
        return render.renderer ? render.renderer.domElement.toDataURL("image/png") : "";
      },
      renderInfo() {
        return render.renderer ? {
          calls: render.renderer.info.render.calls,
          triangles: render.renderer.info.render.triangles,
          memory: render.renderer.info.memory,
        } : null;
      },
      handleAction,
      getTile,
      createNewState,
    };
    window.addEventListener("DOMContentLoaded", init);
  }
})();
