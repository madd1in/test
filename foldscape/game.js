(() => {
  "use strict";

  const canvas = document.querySelector("#gameCanvas");
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
  const bgm = new Audio("assets/audio/mossy-warp-zone.mp3");
  bgm.loop = true;
  bgm.volume = 0.34;

  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    jumpQueued: false,
  };

  let maps = [];
  let totalShards = 0;
  let last = performance.now();
  let running = false;
  let messageTimer = 0;
  let dpr = 1;

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
      anim: 0,
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
      anim: 0,
    });
    state.face = 0;
    state.nextFace = 0;
    state.rotationPulse = 0;
    state.shards = 0;
    state.won = false;
    state.particles.length = 0;
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
    ctx.setTransform(canvas.width / VIEW_W, 0, 0, canvas.height / VIEW_H, 0, 0);
    ctx.imageSmoothingEnabled = false;
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
        p.vy = -14.6;
        p.onGround = false;
        state.shake = 4;
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
    state.shake = 3;
    nudgeOutOfSolids();
    flash(FACE_NAMES[state.face]);
    updateHud();
  }

  function update(dt) {
    state.time += dt;
    const p = state.player;
    const accel = p.onGround ? 42 : 30;
    const friction = p.onGround ? 30 : 8;
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
    p.vx = Math.max(-5.1, Math.min(5.1, p.vx));

    const wantsClimb = p.onLadder && (input.up || input.down);
    if (wantsClimb) {
      p.vy = (input.down ? 1 : -1) * 3.0;
    } else {
      p.vy += 34 * dt;
      p.vy = Math.min(13, p.vy);
    }

    if (input.jumpQueued) {
      if (p.onGround || p.onLadder) {
        p.vy = -11.8;
        p.onGround = false;
        spawnBurst(p.x + p.w * 0.5, p.y + p.h, "#ffffff", 5);
      }
      input.jumpQueued = false;
    }

    p.x += p.vx;
    p.x = Math.max(0, Math.min(WORLD_W - p.w, p.x));
    collideX();

    p.y += p.vy;
    p.y = Math.max(-16, Math.min(WORLD_H - p.h, p.y));
    collideY();

    if (p.y > WORLD_H - p.h - 2) {
      p.y = 292;
      p.x = 86;
      p.vx = 0;
      p.vy = 0;
      flash("Zurueck");
    }

    if (Math.abs(p.vx) > 0.1 && p.onGround) p.anim += dt * 9;
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
    else if (Math.abs(p.vx) > 0.25) frame = 1 + (Math.floor(p.anim) % 4);
    const squash = p.onGround && Math.abs(p.vy) < 0.1 ? 0 : Math.min(4, Math.abs(p.vy) * 0.08);
    drawSpriteFrame(frame, p.x - 14, TOP + p.y - 18 + squash, 48, 64 - squash, p.dir < 0);
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

  function flash(text) {
    messageEl.textContent = text;
    messageEl.classList.add("is-visible");
    messageTimer = 1.25;
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
    if (action === "jump") input.jumpQueued = true;
    if (action === "rotateLeft") rotateWorld(-1);
    if (action === "rotateRight") rotateWorld(1);
    if (action === "music") toggleMusic();
    if (action === "fullscreen") toggleFullscreen();
  }

  function setHold(action, held) {
    if (action in input) input[action] = held;
    if (action === "up" && held) input.jumpQueued = true;
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
        input.jumpQueued = true;
      } else if (code === "Space") input.jumpQueued = true;
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

  async function boot() {
    resize();
    resetGame();
    bindControls();
    await Promise.all(Object.entries(imageSources).map(([name, src]) => loadImage(name, src)));
    running = true;
    last = performance.now();
    updateHud();
    requestAnimationFrame(loop);
  }

  boot();
})();
