(() => {
  "use strict";

  const canvas = document.querySelector("#gameCanvas");
  const webglCanvas = document.querySelector("#webglCanvas");
  const ctx = canvas.getContext("2d");
  const shell = document.querySelector("#gameShell");
  const statusLine = document.querySelector("#statusLine");
  const messageEl = document.querySelector("#message");
  const musicButton = document.querySelector("#musicButton");
  const fullscreenButton = document.querySelector("#fullscreenButton");
  const touchControls = document.querySelector("#touchControls");

  const VIEW_W = 960;
  const VIEW_H = 540;
  const TOP = 24;
  const TILE = 32;
  const COLS = 30;
  const ROWS = 16;
  const WORLD_W = COLS * TILE;
  const WORLD_H = ROWS * TILE;

  const TILE_IDS = {
    G: 0,
    "#": 1,
    S: 2,
    P: 3,
    B: 4,
    "~": 12,
    T: 14,
    O: 15,
  };

  const FACE_NAMES = ["Morgen", "Garten", "Turm", "Nacht"];
  const SOLID = new Set(["G", "#", "S", "P", "B"]);
  const PASSIVE = new Set(["L", "*", "D", "~", "T", "O", "."]);

  const imageSources = {
    tiles: "assets/foldscape_tilemap.png",
    sprites: "assets/foldscape_sprite_sheet.png",
    backdrop: "assets/imported/observatory.png",
    concept: "assets/imported/imagegen-concept-sheet.png",
  };

  const images = {};
  const bgm = new Audio("assets/audio/moonlit-maple-trail.mp3");
  bgm.loop = true;
  bgm.volume = 0.24;

  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    jumpBuffer: 0,
  };

  let maps = [];
  let totalShards = 0;
  let last = performance.now();
  let running = false;
  let messageTimer = 0;
  let dpr = 1;
  let renderer3D = null;

  const state = {
    face: 0,
    nextFace: 0,
    rotationPulse: 0,
    rotationDir: 1,
    shards: 0,
    won: false,
    musicOn: true,
    time: 0,
    shake: 0,
    player: {
      x: 86,
      y: 290,
      vx: 0,
      vy: 0,
      w: 20,
      h: 40,
      dir: 1,
      onGround: false,
      onLadder: false,
      airJumps: 1,
      coyote: 0,
      anim: 0,
      renderX: 86,
      renderY: 290,
    },
    particles: [],
  };

  const rawFaces = [
    [
      "..............................",
      "..............................",
      "..........................*...",
      ".......................GGGG...",
      "..............................",
      "............PPP...............",
      "..............................",
      "..*.......GGGGG.......PPP.....",
      "..GGG.........................",
      "..................B...........",
      "......PPP........GGG....D.....",
      "......................GGGGG...",
      ".............L................",
      ".............L.........*......",
      "GGGGGGGGGGGGGG....GGGGGGGGGGG",
      "##############################",
    ],
    [
      "..............................",
      "..............................",
      "....................*.........",
      ".................GGGGG........",
      "..............................",
      "......PPP..............PPP....",
      "..............................",
      "..............B...............",
      "...*.......GGGGGG.........D...",
      "..GGG..................GGGGG..",
      ".............L................",
      ".............L......PPP.......",
      ".............L................",
      ".........................*....",
      "GGGGGG....GGGGGGGGGGGGGGGGGGG",
      "##############################",
    ],
    [
      "..............................",
      "..............................",
      "........*.....................",
      "......SSSS....................",
      "......................*.......",
      "....................SSSS......",
      "............B.................",
      ".........SSSSSS...............",
      "........................D.....",
      ".....................SSSSS....",
      ".....PPP......................",
      "...............L..............",
      "...............L......PPP.....",
      "..*............L..............",
      "SSSSSSSS....SSSSSSSSSSSSSSSSS",
      "##############################",
    ],
    [
      "..............................",
      "..............................",
      ".......................*......",
      "....................GGGGG.....",
      ".........*....................",
      ".......GGGG...................",
      "..............................",
      ".............PPP..............",
      ".....................B........",
      ".....D..............GGGG......",
      "..GGGGG.......................",
      "...............L..............",
      "...............L...PPP........",
      "...............L........*.....",
      "GGGGGGGGGGGGGGGG....GGGGGGGGG",
      "##############################",
    ],
  ];

  function normalizeRow(row) {
    return row.padEnd(COLS, ".").slice(0, COLS).split("");
  }

  function resetMaps() {
    maps = rawFaces.map((face) => face.map(normalizeRow));
    totalShards = maps.reduce((count, face) => (
      count + face.reduce((rowCount, row) => (
        rowCount + row.filter((cell) => cell === "*").length
      ), 0)
    ), 0);
  }

  function resetGame() {
    resetMaps();
    Object.assign(state.player, {
      x: 86,
      y: 292,
      vx: 0,
      vy: 0,
      dir: 1,
      onGround: false,
      onLadder: false,
      airJumps: 1,
      coyote: 0,
      anim: 0,
      renderX: 86,
      renderY: 292,
    });
    state.face = 0;
    state.nextFace = 0;
    state.rotationPulse = 0;
    state.shards = 0;
    state.won = false;
    state.particles.length = 0;
    if (renderer3D) renderer3D.rebuildWorld();
    flash("Start");
    updateHud();
  }

  function loadImage(name, src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        images[name] = img;
        resolve();
      };
      img.onerror = () => {
        images[name] = null;
        resolve();
      };
      img.src = src;
    });
  }

  function resize() {
    const rect = shell.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    webglCanvas.width = canvas.width;
    webglCanvas.height = canvas.height;
    webglCanvas.style.width = `${rect.width}px`;
    webglCanvas.style.height = `${rect.height}px`;
    ctx.setTransform(canvas.width / VIEW_W, 0, 0, canvas.height / VIEW_H, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (renderer3D) renderer3D.resize();
  }

  function tileAt(face, col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return "#";
    return maps[face][row][col] || ".";
  }

  function setTile(face, col, row, value) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    maps[face][row][col] = value;
  }

  function isSolidAt(face, col, row) {
    return SOLID.has(tileAt(face, col, row));
  }

  function rectTiles(x, y, w, h) {
    const left = Math.floor(x / TILE);
    const right = Math.floor((x + w - 1) / TILE);
    const top = Math.floor(y / TILE);
    const bottom = Math.floor((y + h - 1) / TILE);
    return { left, right, top, bottom };
  }

  function rectHitsSolid(x, y, w, h) {
    const tiles = rectTiles(x, y, w, h);
    for (let row = tiles.top; row <= tiles.bottom; row += 1) {
      for (let col = tiles.left; col <= tiles.right; col += 1) {
        if (isSolidAt(state.face, col, row)) return true;
      }
    }
    return false;
  }

  function currentLadderOverlap() {
    const p = state.player;
    const tiles = rectTiles(p.x + 4, p.y, p.w - 8, p.h);
    for (let row = tiles.top; row <= tiles.bottom; row += 1) {
      for (let col = tiles.left; col <= tiles.right; col += 1) {
        if (tileAt(state.face, col, row) === "L") return true;
      }
    }
    return false;
  }

  function collideX() {
    const p = state.player;
    if (!rectHitsSolid(p.x, p.y, p.w, p.h)) return;
    const dir = Math.sign(p.vx) || 1;
    while (rectHitsSolid(p.x, p.y, p.w, p.h)) {
      p.x -= dir;
    }
    p.vx = 0;
  }

  function collideY() {
    const p = state.player;
    p.onGround = false;
    if (!rectHitsSolid(p.x, p.y, p.w, p.h)) return;
    const dir = Math.sign(p.vy) || 1;
    const beforeBottom = p.y + p.h - dir;
    while (rectHitsSolid(p.x, p.y, p.w, p.h)) {
      p.y -= dir;
    }
    if (dir > 0) {
      p.onGround = true;
      const col = Math.floor((p.x + p.w * 0.5) / TILE);
      const row = Math.floor(beforeBottom / TILE);
      if (tileAt(state.face, col, row) === "B") {
        p.vy = -560;
        p.onGround = false;
        p.airJumps = 1;
        state.shake = 1.2;
        spawnBurst(p.x + p.w * 0.5, p.y + p.h, "#ffcf65", 9);
      } else {
        p.vy = 0;
      }
    } else {
      p.vy = 0;
    }
  }

  function nudgeOutOfSolids() {
    const p = state.player;
    p.x = Math.max(2, Math.min(WORLD_W - p.w - 2, p.x));
    p.y = Math.max(0, Math.min(WORLD_H - p.h - 2, p.y));
    for (let i = 0; i < 48 && rectHitsSolid(p.x, p.y, p.w, p.h); i += 1) {
      p.y -= 1;
    }
  }

  function collectShards() {
    const p = state.player;
    const tiles = rectTiles(p.x - 8, p.y - 8, p.w + 16, p.h + 16);
    for (let row = tiles.top; row <= tiles.bottom; row += 1) {
      for (let col = tiles.left; col <= tiles.right; col += 1) {
        const cell = tileAt(state.face, col, row);
        if (cell === "*") {
          setTile(state.face, col, row, ".");
          state.shards += 1;
          state.shake = 2;
          spawnBurst(col * TILE + TILE / 2, row * TILE + TILE / 2, "#76ecff", 12);
          if (renderer3D) renderer3D.rebuildWorld();
          if (state.shards >= totalShards) flash("Portal offen");
          else flash(`Scherbe ${state.shards}/${totalShards}`);
        }
      }
    }
  }

  function checkDoor() {
    if (state.won) return;
    const p = state.player;
    const tiles = rectTiles(p.x, p.y, p.w, p.h);
    for (let row = tiles.top; row <= tiles.bottom; row += 1) {
      for (let col = tiles.left; col <= tiles.right; col += 1) {
        if (tileAt(state.face, col, row) === "D") {
          if (state.shards >= totalShards) {
            state.won = true;
            spawnBurst(col * TILE + TILE / 2, row * TILE + TILE / 2, "#fff2a1", 32);
            flash("Fertig");
          } else {
            flash(`Noch ${totalShards - state.shards}`);
          }
        }
      }
    }
  }

  function rotateWorld(dir) {
    if (state.rotationPulse > 0.15 || state.won) return;
    state.rotationDir = dir;
    state.face = (state.face + dir + maps.length) % maps.length;
    state.rotationPulse = 1;
    state.shake = 1.4;
    nudgeOutOfSolids();
    if (renderer3D) renderer3D.rebuildWorld();
    flash(FACE_NAMES[state.face]);
    updateHud();
  }

  function update(dt) {
    state.time += dt;
    const p = state.player;
    input.jumpBuffer = Math.max(0, input.jumpBuffer - dt);
    const accel = p.onGround ? 1180 : 820;
    const friction = p.onGround ? 1450 : 330;
    const maxSpeed = p.onGround ? 176 : 188;
    const desired = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    p.onLadder = currentLadderOverlap();

    if (desired !== 0) {
      p.vx += desired * accel * dt;
      p.dir = desired;
    } else {
      const slow = friction * dt;
      if (Math.abs(p.vx) <= slow) p.vx = 0;
      else p.vx -= Math.sign(p.vx) * slow;
    }
    p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));

    const wantsClimb = p.onLadder && (input.up || input.down);
    if (wantsClimb) {
      p.vy = (input.down ? 1 : -1) * 118;
      p.airJumps = 1;
    } else {
      p.vy += 1480 * dt;
      p.vy = Math.min(650, p.vy);
    }

    if (input.jumpBuffer > 0) {
      if (p.onGround || p.onLadder || p.coyote > 0) {
        p.vy = -470;
        p.onGround = false;
        p.coyote = 0;
        p.airJumps = 1;
        spawnBurst(p.x + p.w * 0.5, p.y + p.h, "#ffffff", 5);
        input.jumpBuffer = 0;
      } else if (p.airJumps > 0) {
        p.vy = -430;
        p.airJumps -= 1;
        state.shake = 0.8;
        spawnBurst(p.x + p.w * 0.5, p.y + p.h * 0.55, "#76ecff", 9);
        input.jumpBuffer = 0;
      }
    }

    p.x += p.vx * dt;
    p.x = Math.max(0, Math.min(WORLD_W - p.w, p.x));
    collideX();

    p.y += p.vy * dt;
    p.y = Math.max(-16, Math.min(WORLD_H - p.h, p.y));
    collideY();
    if (p.onGround) {
      p.airJumps = 1;
      p.coyote = 0.105;
    } else {
      p.coyote = Math.max(0, p.coyote - dt);
    }

    if (p.y > WORLD_H - p.h - 2) {
      p.y = 292;
      p.x = 86;
      p.renderX = p.x;
      p.renderY = p.y;
      p.vx = 0;
      p.vy = 0;
      flash("Zurueck");
    }

    p.renderX += (p.x - p.renderX) * Math.min(1, dt * 18);
    p.renderY += (p.y - p.renderY) * Math.min(1, dt * 18);

    if (Math.abs(p.vx) > 4 && p.onGround) p.anim += dt * 9;
    else p.anim = 0;

    collectShards();
    checkDoor();

    state.rotationPulse = Math.max(0, state.rotationPulse - dt * 2.25);
    state.shake = Math.max(0, state.shake - dt * 12);
    updateParticles(dt);
    if (messageTimer > 0) {
      messageTimer -= dt;
      if (messageTimer <= 0) messageEl.classList.remove("is-visible");
    }
    updateHud();
  }

  function spawnBurst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.35;
      const speed = 40 + Math.random() * 110;
      state.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 35,
        life: 0.45 + Math.random() * 0.35,
        max: 0.8,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  function updateParticles(dt) {
    for (const part of state.particles) {
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.vy += 150 * dt;
      part.life -= dt;
    }
    state.particles = state.particles.filter((part) => part.life > 0);
  }

  function draw() {
    if (renderer3D && renderer3D.ready) {
      renderer3D.render();
      return;
    }

    ctx.save();
    ctx.setTransform(canvas.width / VIEW_W, 0, 0, canvas.height / VIEW_H, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const sx = state.shake ? (Math.random() - 0.5) * state.shake : 0;
    const sy = state.shake ? (Math.random() - 0.5) * state.shake : 0;
    ctx.translate(sx, sy);

    drawBackdrop();
    drawWorldWithRotation();
    drawPlayer();
    drawParticles();
    drawOverlay();

    ctx.restore();
  }

  function drawBackdrop() {
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    sky.addColorStop(0, "#82d7f0");
    sky.addColorStop(0.46, "#d8f4f4");
    sky.addColorStop(1, "#34384b");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    const backdrop = images.backdrop;
    if (backdrop) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      const scale = Math.max(VIEW_W / backdrop.width, VIEW_H / backdrop.height);
      const w = backdrop.width * scale;
      const h = backdrop.height * scale;
      ctx.drawImage(backdrop, (VIEW_W - w) * 0.5, (VIEW_H - h) * 0.5, w, h);
      ctx.restore();
    }

    const concept = images.concept;
    if (concept) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.drawImage(concept, 0, 0, concept.width, concept.height, 604, 72, 276, 276);
      ctx.restore();
    }

    for (let i = 0; i < 9; i += 1) {
      const x = ((i * 137 - state.face * 35 + state.time * 8) % 1100) - 90;
      const y = 76 + (i % 3) * 42;
      drawSpriteFrame(16 + (i % 8), x, y, 64, 42, false, 0.62);
    }

    ctx.fillStyle = "rgba(255,255,255,0.25)";
    for (let i = 0; i < 40; i += 1) {
      const x = (i * 89 + state.face * 47) % VIEW_W;
      const y = 30 + ((i * 53) % 220);
      ctx.fillRect(x, y, 2, 2);
    }
  }

  function drawWorldWithRotation() {
    const pulse = state.rotationPulse;
    const wave = Math.sin(pulse * Math.PI);
    const squash = 1 - wave * 0.24;
    const skew = wave * state.rotationDir * 0.16;
    ctx.save();
    ctx.translate(VIEW_W * 0.5, TOP);
    ctx.transform(squash, 0, skew, 1, 0, 0);
    ctx.translate(-VIEW_W * 0.5, -TOP);
    drawMap(state.face);
    ctx.restore();

    if (pulse > 0) {
      ctx.save();
      ctx.globalAlpha = 0.16 * pulse;
      ctx.fillStyle = state.rotationDir > 0 ? "#123546" : "#3a2752";
      ctx.fillRect(0, TOP, VIEW_W, WORLD_H);
      ctx.restore();
    }
  }

  function drawMap(face) {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const cell = tileAt(face, col, row);
        const x = col * TILE;
        const y = TOP + row * TILE;
        if (TILE_IDS[cell] !== undefined) drawTile(TILE_IDS[cell], x, y, TILE, TILE);
        else if (cell === "L") drawTile(7, x, y, TILE, TILE);
        else if (cell === "*") drawCollectible(x, y);
        else if (cell === "D") drawDoor(x, y);
        else if (!PASSIVE.has(cell)) drawTile(1, x, y, TILE, TILE);
      }
    }
  }

  function drawTile(id, x, y, w, h) {
    const img = images.tiles;
    if (!img) {
      ctx.fillStyle = "#69706e";
      ctx.fillRect(x, y, w, h);
      return;
    }
    const sx = (id % 8) * TILE;
    const sy = Math.floor(id / 8) * TILE;
    ctx.drawImage(img, sx, sy, TILE, TILE, Math.round(x), Math.round(y), w, h);
  }

  function drawSpriteFrame(index, x, y, w, h, flip = false, alpha = 1) {
    const img = images.sprites;
    if (!img) {
      ctx.fillStyle = "#58a3a5";
      ctx.fillRect(x, y, w, h);
      return;
    }
    const fw = 48;
    const fh = 64;
    const sx = (index % 8) * fw;
    const sy = Math.floor(index / 8) * fh;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (flip) {
      ctx.translate(Math.round(x + w), Math.round(y));
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, fw, fh, 0, 0, w, h);
    } else {
      ctx.drawImage(img, sx, sy, fw, fh, Math.round(x), Math.round(y), w, h);
    }
    ctx.restore();
  }

  function drawCollectible(x, y) {
    const frame = 8 + Math.floor(state.time * 8) % 4;
    const bob = Math.sin(state.time * 5 + x * 0.03) * 3;
    drawSpriteFrame(frame, x - 8, y - 11 + bob, 48, 64);
  }

  function drawDoor(x, y) {
    const frame = 12 + Math.floor(state.time * 7) % 4;
    const open = state.shards >= totalShards;
    drawSpriteFrame(frame, x - 8, y - 35, 48, 64, false, open ? 1 : 0.42);
    if (open) {
      ctx.save();
      ctx.globalAlpha = 0.18 + Math.sin(state.time * 6) * 0.06;
      ctx.fillStyle = "#fff2a1";
      ctx.fillRect(x + 8, y - 18, 16, 42);
      ctx.restore();
    }
  }

  function drawPlayer() {
    const p = state.player;
    let frame = 0;
    if (!p.onGround && !p.onLadder) frame = 5;
    else if (Math.abs(p.vx) > 4) frame = 1 + (Math.floor(p.anim) % 4);
    const squash = p.onGround && Math.abs(p.vy) < 0.1 ? 0 : Math.min(4, Math.abs(p.vy) * 0.08);
    drawSpriteFrame(frame, p.renderX - 14, TOP + p.renderY - 18 + squash, 48, 64 - squash, p.dir < 0);
  }

  function drawParticles() {
    for (const part of state.particles) {
      ctx.globalAlpha = Math.max(0, part.life / part.max);
      ctx.fillStyle = part.color;
      ctx.fillRect(Math.round(part.x), Math.round(TOP + part.y), part.size, part.size);
      ctx.globalAlpha = 1;
    }
  }

  function drawOverlay() {
    const x = 22;
    const y = VIEW_H - 46;
    ctx.save();
    ctx.globalAlpha = 0.86;
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = i === state.face ? "#ffcf65" : "rgba(8,18,28,0.62)";
      ctx.fillRect(x + i * 26, y, 20, 20);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.strokeRect(x + i * 26 + 0.5, y + 0.5, 19, 19);
    }
    ctx.restore();
  }

  class Foldscape3DRenderer {
    constructor(THREE) {
      this.THREE = THREE;
      this.ready = false;
      this.tileTextures = new Map();
      this.spriteTextures = new Map();
      this.materials = new Map();
      this.dynamicMeshes = [];
    }

    init() {
      const THREE = this.THREE;
      this.renderer = new THREE.WebGLRenderer({
        canvas: webglCanvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color("#82d7f0");
      this.scene.fog = new THREE.Fog("#82d7f0", 24, 48);

      this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 90);
      this.camera.position.set(0, 5.6, 24.2);
      this.camera.lookAt(0, -0.8, 0);
      this.cameraBaseZ = 24.2;
      this.cameraTargetX = 0;

      const hemi = new THREE.HemisphereLight("#eafcff", "#304a54", 2.4);
      this.scene.add(hemi);

      const ambient = new THREE.AmbientLight("#ffffff", 1.35);
      this.scene.add(ambient);

      const key = new THREE.DirectionalLight("#fff3c4", 3.8);
      key.position.set(-6, 12, 10);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -20;
      key.shadow.camera.right = 20;
      key.shadow.camera.top = 14;
      key.shadow.camera.bottom = -12;
      this.scene.add(key);

      const rim = new THREE.DirectionalLight("#75edff", 1.2);
      rim.position.set(9, 4, 12);
      this.scene.add(rim);

      this.worldGroup = new THREE.Group();
      this.scene.add(this.worldGroup);
      this.terrainGroup = new THREE.Group();
      this.dynamicGroup = new THREE.Group();
      this.playerGroup = new THREE.Group();
      this.particleGroup = new THREE.Group();
      this.worldGroup.add(this.terrainGroup, this.dynamicGroup, this.playerGroup, this.particleGroup);

      this.createBackdrop();
      this.createPlayer();
      this.rebuildWorld();
      this.resize();
      this.ready = true;
      shell.classList.add("has-webgl");
      window.__foldscapeRenderMode = "three";
    }

    resize() {
      if (!this.renderer) return;
      const rect = shell.getBoundingClientRect();
      const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      this.renderer.setPixelRatio(pixelRatio);
      this.renderer.setSize(rect.width, rect.height, false);
      this.camera.aspect = Math.max(0.1, rect.width / Math.max(1, rect.height));
      this.cameraBaseZ = this.camera.aspect < 0.72 ? 36 : this.camera.aspect < 1.05 ? 30 : 24.2;
      this.cameraTargetX = this.camera.aspect < 0.72 ? -4.8 : 0;
      this.camera.position.z = this.cameraBaseZ;
      this.camera.updateProjectionMatrix();
    }

    clearGroup(group) {
      while (group.children.length) {
        const child = group.children[0];
        group.remove(child);
        child.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.userData && obj.userData.transientMaterial && obj.material) obj.material.dispose();
        });
      }
    }

    atlasTexture(image, sx, sy, sw, sh, cache, key) {
      if (cache.has(key)) return cache.get(key);
      const THREE = this.THREE;
      const tileCanvas = document.createElement("canvas");
      tileCanvas.width = sw;
      tileCanvas.height = sh;
      const tileCtx = tileCanvas.getContext("2d");
      tileCtx.imageSmoothingEnabled = false;
      tileCtx.clearRect(0, 0, sw, sh);
      tileCtx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
      const texture = new THREE.CanvasTexture(tileCanvas);
      texture.needsUpdate = true;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      cache.set(key, texture);
      return texture;
    }

    tileTexture(id) {
      const key = `painted-tile-${id}`;
      if (this.tileTextures.has(key)) return this.tileTextures.get(key);
      const THREE = this.THREE;
      const tileCanvas = document.createElement("canvas");
      tileCanvas.width = TILE;
      tileCanvas.height = TILE;
      const g = tileCanvas.getContext("2d");
      g.imageSmoothingEnabled = false;
      const rect = (color, x, y, w, h) => {
        g.fillStyle = color;
        g.fillRect(x, y, w, h);
      };
      const line = (color, x1, y1, x2, y2) => {
        g.strokeStyle = color;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.stroke();
      };
      if (id === 0) {
        rect("#566660", 0, 8, 32, 24);
        rect("#3d4847", 0, 24, 32, 8);
        rect("#74b85a", 0, 0, 32, 8);
        rect("#a8df72", 0, 0, 32, 3);
        rect("#46783e", 3, 7, 5, 7);
        rect("#767f78", 4, 12, 8, 3);
        rect("#5b625f", 7, 18, 11, 3);
        line("#2a2f2e", 0, 31, 31, 31);
      } else if (id === 1) {
        rect("#69706e", 0, 0, 32, 32);
        rect("#474d4d", 0, 24, 32, 8);
        rect("#969d94", 2, 2, 28, 3);
        line("#3b4141", 2, 12, 30, 10);
        line("#3b4141", 9, 2, 8, 26);
        line("#3b4141", 20, 11, 21, 31);
      } else if (id === 2) {
        rect("#a88857", 0, 0, 32, 32);
        rect("#765c3b", 0, 24, 32, 8);
        rect("#d4b36f", 2, 2, 28, 3);
        line("#6c5133", 2, 12, 30, 10);
        line("#6c5133", 9, 2, 8, 26);
        line("#6c5133", 20, 11, 21, 31);
      } else if (id === 3) {
        rect("#8e6138", 0, 9, 32, 15);
        rect("#b47b45", 0, 9, 32, 4);
        line("#583923", 0, 15, 31, 15);
        line("#583923", 10, 10, 10, 23);
        line("#583923", 22, 10, 22, 23);
        rect("#ffd072", 6, 13, 2, 2);
        rect("#ffd072", 25, 20, 2, 2);
      } else if (id === 4) {
        rect("#44404e", 0, 6, 32, 26);
        rect("#ffcc66", 2, 5, 28, 7);
        rect("#ff8c4a", 5, 12, 22, 4);
        rect("#2b2a34", 4, 23, 24, 7);
      } else if (id === 7) {
        rect("#00000000", 0, 0, 32, 32);
        rect("#8a5937", 8, 0, 4, 32);
        rect("#8a5937", 20, 0, 4, 32);
        for (const y of [4, 12, 20, 28]) rect("#c88b4a", 8, y, 16, 3);
      } else {
        rect("#77d7f3", 0, 0, 32, 32);
        rect("#ffffff", 8, 13, 18, 7);
        rect("#b6dbe7", 7, 21, 22, 3);
      }
      const texture = new THREE.CanvasTexture(tileCanvas);
      texture.needsUpdate = true;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      this.tileTextures.set(key, texture);
      return texture;
    }

    spriteTexture(index) {
      const fw = 48;
      const fh = 64;
      const sx = (index % 8) * fw;
      const sy = Math.floor(index / 8) * fh;
      return this.atlasTexture(images.sprites, sx, sy, fw, fh, this.spriteTextures, `sprite-${index}`);
    }

    tileMaterial(id, tone = "#ffffff") {
      const key = `tile-${id}-${tone}`;
      if (this.materials.has(key)) return this.materials.get(key);
      const THREE = this.THREE;
      const mat = new THREE.MeshBasicMaterial({
        map: this.tileTexture(id),
        color: tone,
      });
      this.materials.set(key, mat);
      return mat;
    }

    colorMaterial(key, color, roughness = 0.75) {
      if (this.materials.has(key)) return this.materials.get(key);
      const THREE = this.THREE;
      const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.04 });
      this.materials.set(key, mat);
      return mat;
    }

    spriteMaterial(index, opacity = 1) {
      const key = `sprite-${index}-${opacity}`;
      if (this.materials.has(key)) return this.materials.get(key);
      const THREE = this.THREE;
      const mat = new THREE.MeshBasicMaterial({
        map: this.spriteTexture(index),
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: opacity >= 1,
      });
      this.materials.set(key, mat);
      return mat;
    }

    createBackdrop() {
      const THREE = this.THREE;
      if (!images.backdrop) return;
      const texture = new THREE.Texture(images.backdrop);
      texture.needsUpdate = true;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.36,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(35, 20), mat);
      mesh.position.set(0, 0.8, -7.5);
      this.scene.add(mesh);
    }

    createPlayer() {
      const THREE = this.THREE;
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 1.05, 0.34),
        this.colorMaterial("player-body", "#59a9aa", 0.64),
      );
      body.position.z = -0.03;
      body.castShadow = true;
      this.playerGroup.add(body);

      const hat = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.18, 0.38),
        this.colorMaterial("player-hat", "#e95143", 0.72),
      );
      hat.position.set(0, 0.64, 0.03);
      hat.castShadow = true;
      this.playerGroup.add(hat);

      this.playerPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 1.2),
        this.spriteMaterial(0),
      );
      this.playerPlane.position.set(0, 0.03, 0.22);
      this.playerGroup.add(this.playerPlane);

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.42, 20),
        new THREE.MeshBasicMaterial({ color: "#111924", transparent: true, opacity: 0.28 }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(0, -0.64, 0.01);
      this.playerGroup.add(shadow);
    }

    cellPosition(col, row, z = 0) {
      return {
        x: col - COLS / 2 + 0.5,
        y: ROWS - row - 8.5,
        z,
      };
    }

    playerPosition() {
      const p = state.player;
      return {
        x: (p.renderX + p.w * 0.5) / TILE - COLS / 2,
        y: ROWS - (p.renderY + p.h * 0.5) / TILE - 8,
        z: 0.82,
      };
    }

    rebuildWorld() {
      if (!this.terrainGroup || !images.tiles || !images.sprites) return;
      const THREE = this.THREE;
      this.clearGroup(this.terrainGroup);
      this.clearGroup(this.dynamicGroup);
      this.dynamicMeshes = [];

      for (let row = 0; row < ROWS; row += 1) {
        for (let col = 0; col < COLS; col += 1) {
          const cell = tileAt(state.face, col, row);
          const pos = this.cellPosition(col, row);

          if (TILE_IDS[cell] !== undefined && SOLID.has(cell)) {
            const depth = cell === "P" ? 0.45 : cell === "B" ? 0.7 : 0.86;
            const height = cell === "P" ? 0.45 : 0.92;
            const mesh = new THREE.Mesh(
              new THREE.BoxGeometry(1, height, depth),
              this.tileMaterial(TILE_IDS[cell]),
            );
            mesh.position.set(pos.x, pos.y - (1 - height) * 0.5, 0);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.terrainGroup.add(mesh);
          } else if (cell === "L") {
            const ladder = new THREE.Mesh(
              new THREE.PlaneGeometry(0.9, 1.08),
              this.tileMaterial(7),
            );
            ladder.position.set(pos.x, pos.y, 0.48);
            this.dynamicGroup.add(ladder);
          } else if (cell === "*") {
            const shard = new THREE.Mesh(
              new THREE.PlaneGeometry(0.9, 1.2),
              this.spriteMaterial(8),
            );
            shard.position.set(pos.x, pos.y + 0.1, 0.62);
            shard.userData.kind = "shard";
            shard.userData.baseY = shard.position.y;
            this.dynamicMeshes.push(shard);
            this.dynamicGroup.add(shard);
          } else if (cell === "D") {
            const door = new THREE.Mesh(
              new THREE.PlaneGeometry(0.9, 1.24),
              this.spriteMaterial(12, state.shards >= totalShards ? 1 : 0.46),
            );
            door.position.set(pos.x, pos.y + 0.02, 0.55);
            door.userData.kind = "door";
            this.dynamicMeshes.push(door);
            this.dynamicGroup.add(door);
          }
        }
      }
    }

    updatePlayer() {
      const p = state.player;
      const pos = this.playerPosition();
      this.playerGroup.position.set(pos.x, pos.y, pos.z);
      this.playerGroup.rotation.z = -p.vx / 680;
      this.playerGroup.rotation.y = p.dir < 0 ? Math.PI : 0;
      const airborne = !p.onGround && !p.onLadder;
      const frame = airborne ? 5 : Math.abs(p.vx) > 4 ? 1 + (Math.floor(p.anim) % 4) : 0;
      this.playerPlane.material = this.spriteMaterial(frame);
      const stretch = airborne ? 1.08 : 1;
      this.playerGroup.scale.set(1, stretch, 1);
    }

    updateDynamicMeshes() {
      for (const mesh of this.dynamicMeshes) {
        if (mesh.userData.kind === "shard") {
          const frame = 8 + Math.floor(state.time * 7) % 4;
          mesh.material = this.spriteMaterial(frame);
          mesh.position.y = mesh.userData.baseY + Math.sin(state.time * 4 + mesh.position.x) * 0.12;
          mesh.rotation.y += 0.045;
        } else if (mesh.userData.kind === "door") {
          const frame = 12 + Math.floor(state.time * 5) % 4;
          mesh.material = this.spriteMaterial(frame, state.shards >= totalShards ? 1 : 0.46);
          mesh.scale.setScalar(state.shards >= totalShards ? 1 + Math.sin(state.time * 4) * 0.04 : 1);
        }
      }
    }

    updateParticles() {
      const THREE = this.THREE;
      this.clearGroup(this.particleGroup);
      for (const part of state.particles.slice(0, 42)) {
        const mat = new THREE.MeshBasicMaterial({
          color: part.color,
          transparent: true,
          opacity: Math.max(0, part.life / part.max),
        });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), mat);
        mesh.userData.transientMaterial = true;
        mesh.position.set(part.x / TILE - COLS / 2, ROWS - part.y / TILE - 8, 0.9);
        this.particleGroup.add(mesh);
      }
    }

    render() {
      const pulse = state.rotationPulse;
      const ease = pulse * pulse * (3 - 2 * pulse);
      const tilt = Math.sin(pulse * Math.PI);
      this.worldGroup.rotation.y = -state.rotationDir * ease * Math.PI * 0.52;
      this.worldGroup.rotation.z = state.rotationDir * tilt * 0.035;
      this.worldGroup.position.y = tilt * 0.1;
      this.worldGroup.scale.set(1 - tilt * 0.035, 1 + tilt * 0.02, 1);

      this.camera.position.x = this.cameraTargetX + state.rotationDir * tilt * 1.45;
      this.camera.position.y = 5.6 + tilt * 0.42;
      this.camera.position.z = this.cameraBaseZ - tilt * 0.8;
      this.camera.lookAt(this.cameraTargetX, -0.8, 0);

      this.updatePlayer();
      this.updateDynamicMeshes();
      this.updateParticles();
      this.renderer.render(this.scene, this.camera);
    }
  }

  function flash(text) {
    messageEl.textContent = text;
    messageEl.classList.add("is-visible");
    messageTimer = 1.25;
  }

  function queueJump() {
    input.jumpBuffer = 0.16;
  }

  function updateHud() {
    const portal = state.shards >= totalShards ? "offen" : "zu";
    const end = state.won ? " | Fertig" : "";
    statusLine.textContent = `${FACE_NAMES[state.face]} | Scherben ${state.shards}/${totalShards} | Portal ${portal}${end}`;
    musicButton.classList.toggle("is-active", state.musicOn && !bgm.paused);
  }

  async function tryPlayMusic() {
    if (!state.musicOn) return;
    try {
      await bgm.play();
    } catch {
      updateHud();
    }
  }

  function toggleMusic() {
    state.musicOn = !state.musicOn;
    if (state.musicOn) tryPlayMusic();
    else bgm.pause();
    updateHud();
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
  }

  function updateFullscreenButton() {
    const active = !!fullscreenElement() || shell.classList.contains("is-fallback-fullscreen");
    fullscreenButton.setAttribute("aria-pressed", String(active));
    fullscreenButton.classList.toggle("is-active", active);
  }

  async function toggleFullscreen() {
    const active = fullscreenElement() || shell.classList.contains("is-fallback-fullscreen");
    try {
      if (active) {
        shell.classList.remove("is-fallback-fullscreen");
        if (fullscreenElement() && document.exitFullscreen) await document.exitFullscreen();
      } else if (shell.requestFullscreen) {
        await shell.requestFullscreen({ navigationUI: "hide" });
      } else {
        shell.classList.add("is-fallback-fullscreen");
      }
    } catch {
      shell.classList.toggle("is-fallback-fullscreen", !active);
    }
    updateFullscreenButton();
    resize();
  }

  function handlePress(action) {
    if (action === "jump") queueJump();
    if (action === "rotateLeft") rotateWorld(-1);
    if (action === "rotateRight") rotateWorld(1);
    if (action === "music") toggleMusic();
    if (action === "fullscreen") toggleFullscreen();
  }

  function setHold(action, held) {
    if (action in input) input[action] = held;
    if (action === "up" && held) queueJump();
  }

  function bindControls() {
    window.addEventListener("keydown", (event) => {
      if (event.repeat && event.code !== "KeyM") return;
      const code = event.code;
      if (code === "ArrowLeft" || code === "KeyA") input.left = true;
      else if (code === "ArrowRight" || code === "KeyD") input.right = true;
      else if (code === "ArrowDown" || code === "KeyS") input.down = true;
      else if (code === "ArrowUp" || code === "KeyW") {
        input.up = true;
        queueJump();
      } else if (code === "Space") queueJump();
      else if (code === "KeyQ") rotateWorld(-1);
      else if (code === "KeyE") rotateWorld(1);
      else if (code === "KeyR") resetGame();
      else if (code === "KeyM") toggleMusic();
      else if (code === "KeyF") toggleFullscreen();
      else return;
      event.preventDefault();
      tryPlayMusic();
    });

    window.addEventListener("keyup", (event) => {
      const code = event.code;
      if (code === "ArrowLeft" || code === "KeyA") input.left = false;
      else if (code === "ArrowRight" || code === "KeyD") input.right = false;
      else if (code === "ArrowDown" || code === "KeyS") input.down = false;
      else if (code === "ArrowUp" || code === "KeyW") input.up = false;
    });

    canvas.addEventListener("pointerdown", () => {
      tryPlayMusic();
    });

    musicButton.addEventListener("click", toggleMusic);
    fullscreenButton.addEventListener("click", toggleFullscreen);

    touchControls.querySelectorAll("[data-hold]").forEach((button) => {
      const action = button.dataset.hold;
      const stop = () => {
        setHold(action, false);
        button.classList.remove("is-held");
      };
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        setHold(action, true);
        button.classList.add("is-held");
        tryPlayMusic();
      });
      button.addEventListener("pointerup", stop);
      button.addEventListener("pointercancel", stop);
      button.addEventListener("lostpointercapture", stop);
    });

    touchControls.querySelectorAll("[data-press]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        button.classList.add("is-held");
        handlePress(button.dataset.press);
        tryPlayMusic();
      });
      const stop = () => button.classList.remove("is-held");
      button.addEventListener("pointerup", stop);
      button.addEventListener("pointercancel", stop);
      button.addEventListener("lostpointercapture", stop);
    });

    touchControls.addEventListener("contextmenu", (event) => event.preventDefault());
    document.addEventListener("fullscreenchange", () => {
      updateFullscreenButton();
      resize();
    });
    window.addEventListener("resize", resize);
    window.addEventListener("blur", () => {
      input.left = false;
      input.right = false;
      input.up = false;
      input.down = false;
    });
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  async function init3DRenderer() {
    if (!webglCanvas || !images.tiles || !images.sprites) return;
    try {
      const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js");
      renderer3D = new Foldscape3DRenderer(THREE);
      renderer3D.init();
    } catch (error) {
      renderer3D = null;
      shell.classList.remove("has-webgl");
      window.__foldscapeRenderMode = "canvas";
      console.warn("Three.js renderer unavailable, using canvas fallback.", error);
    }
  }

  async function boot() {
    resize();
    resetGame();
    bindControls();
    await Promise.all(Object.entries(imageSources).map(([name, src]) => loadImage(name, src)));
    await init3DRenderer();
    running = true;
    last = performance.now();
    updateHud();
    requestAnimationFrame(loop);
  }

  boot();
})();
