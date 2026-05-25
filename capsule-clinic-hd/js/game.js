(function () {
  "use strict";

  var COLS = 8;
  var ROWS = 16;
  var BASE_DROP_MS = 950;
  var CLEAR_DELAY_MS = 170;
  var GRAVITY_DELAY_MS = 48;
  var START_LEVEL = 1;
  var COLORS = [
    { key: "ruby", main: "#f85f77", dark: "#8e203b", glow: "#ffc0cb" },
    { key: "cyan", main: "#48dacd", dark: "#126f7a", glow: "#b9fff6" },
    { key: "amber", main: "#ffd166", dark: "#9f6518", glow: "#fff2a8" },
    { key: "violet", main: "#a98cff", dark: "#4d3a92", glow: "#ddd1ff" }
  ];
  var ASSETS = {
    background: "assets/hd/background-lab-imagen-hd.jpg",
    bgProps: "assets/hd/background-prop-atlas-hd.png",
    frame: "assets/hd/bottle-frame-hd.png",
    pills: "assets/hd/capsule-atlas-hd.png",
    viruses: "assets/hd/virus-atlas-hd.png",
    virusAnim: "assets/hd/virus-anim-atlas-hd.png",
    fx: "assets/hd/fx-atlas-hd.png",
    clearFx: "assets/hd/clear-fx-anim-atlas-hd.png",
    tiles: "assets/hd/lab-tile-atlas-hd.png",
    imagenSource: "assets/imagen-hd/imagen-clinic-animation-atlas-source.png"
  };
  var AUDIO = {
    bgm: "assets/audio/bgm/local-lab-loop.mp3",
    confirm: "assets/audio/sfx/local-confirm.wav",
    move: "assets/audio/sfx/local-pickup.wav",
    rotate: "assets/audio/sfx/local-impact.wav",
    clear: "assets/audio/sfx/local-clear.wav",
    level: "assets/audio/sfx/local-level.wav",
    gameover: "assets/audio/sfx/local-gameover.wav"
  };
  var OFFSETS = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 }
  ];

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var nextCanvas = document.getElementById("next");
  var nextCtx = nextCanvas.getContext("2d");
  var overlay = document.getElementById("overlay");
  var overlayTitle = document.getElementById("overlayTitle");
  var primaryButton = document.getElementById("primaryButton");
  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var levelEl = document.getElementById("level");
  var virusesEl = document.getElementById("viruses");
  var comboEl = document.getElementById("combo");
  var speedEl = document.getElementById("speed");
  var doseEl = document.getElementById("dose");
  var assayEl = document.getElementById("assay");
  var pauseButton = document.getElementById("pauseButton");
  var soundButton = document.getElementById("soundButton");
  var doseButton = document.getElementById("doseButton");
  var restartButton = document.getElementById("restartButton");

  var images = {};
  var audioElements = {};
  var bgm = null;
  var lastTime = 0;
  var assetsReady = false;
  var audioContext = null;
  var muted = localStorage.getItem("capsuleClinicMuted") === "1";
  var bestScore = Number(localStorage.getItem("capsuleClinicBest") || 0);
  var pieceSerial = 1;
  var rngSeed = 0x5f3759df;
  var boardRect = { x: 218, y: 176, w: 464, h: 928, cell: 58 };
  var particles = [];
  var clearBursts = [];
  var heldDown = false;

  var state = {
    mode: "menu",
    board: createEmptyBoard(),
    current: null,
    next: null,
    level: START_LEVEL,
    score: 0,
    viruses: 0,
    combo: 0,
    dose: 0,
    assayColor: 0,
    assayStreak: 0,
    dropMs: BASE_DROP_MS,
    dropTimer: 0,
    settleTimer: 0,
    flash: 0,
    shake: 0,
    message: "Ready"
  };

  function createEmptyBoard() {
    var rows = [];
    for (var y = 0; y < ROWS; y += 1) {
      var row = [];
      for (var x = 0; x < COLS; x += 1) {
        row.push(null);
      }
      rows.push(row);
    }
    return rows;
  }

  function seededRandom() {
    rngSeed ^= rngSeed << 13;
    rngSeed ^= rngSeed >>> 17;
    rngSeed ^= rngSeed << 5;
    return ((rngSeed >>> 0) % 100000) / 100000;
  }

  function pickColorIndex() {
    return Math.floor(seededRandom() * COLORS.length);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatNumber(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function loadImage(key, src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        images[key] = img;
        resolve();
      };
      img.onerror = function () {
        reject(new Error("Could not load asset: " + src));
      };
      img.src = src;
    });
  }

  function loadAssets() {
    var pending = Object.keys(ASSETS).map(function (key) {
      return loadImage(key, ASSETS[key]);
    });
    return Promise.all(pending).then(function () {
      assetsReady = true;
    });
  }

  function setupAudioAssets() {
    Object.keys(AUDIO).forEach(function (key) {
      var audio = new Audio(AUDIO[key]);
      audio.preload = key === "bgm" ? "auto" : "metadata";
      if (key === "bgm") {
        audio.loop = true;
        audio.volume = 0.32;
        bgm = audio;
      } else {
        audio.volume = 0.62;
      }
      audioElements[key] = audio;
    });
  }

  function newPiece() {
    return {
      id: pieceSerial++,
      x: 3,
      y: 0,
      dir: 0,
      colors: [pickColorIndex(), pickColorIndex()],
      lockPulse: 0
    };
  }

  function pieceCells(piece, xOverride, yOverride, dirOverride) {
    var x = typeof xOverride === "number" ? xOverride : piece.x;
    var y = typeof yOverride === "number" ? yOverride : piece.y;
    var dir = typeof dirOverride === "number" ? dirOverride : piece.dir;
    var o = OFFSETS[dir];
    return [
      { x: x, y: y, color: piece.colors[0], half: 0 },
      { x: x + o.x, y: y + o.y, color: piece.colors[1], half: 1 }
    ];
  }

  function canPlacePiece(piece, x, y, dir) {
    var cells = pieceCells(piece, x, y, dir);
    for (var i = 0; i < cells.length; i += 1) {
      var c = cells[i];
      if (c.x < 0 || c.x >= COLS || c.y >= ROWS) {
        return false;
      }
      if (c.y >= 0 && state.board[c.y][c.x]) {
        return false;
      }
    }
    return true;
  }

  function spawnPiece() {
    state.current = state.next || newPiece();
    state.current.x = 3;
    state.current.y = 0;
    state.current.dir = 0;
    state.next = newPiece();
    state.dropTimer = 0;
    state.mode = canPlacePiece(state.current, state.current.x, state.current.y, state.current.dir) ? "falling" : "gameover";
    if (state.mode === "gameover") {
      endGame();
    }
  }

  function canCreateRun(board, x, y, color) {
    var temp = board[y][x];
    board[y][x] = { type: "virus", color: color, id: 0 };
    var found = false;
    var line;
    var i;

    line = 1;
    for (i = x - 1; i >= 0 && board[y][i] && board[y][i].color === color; i -= 1) {
      line += 1;
    }
    for (i = x + 1; i < COLS && board[y][i] && board[y][i].color === color; i += 1) {
      line += 1;
    }
    found = found || line >= 4;

    line = 1;
    for (i = y - 1; i >= 0 && board[i][x] && board[i][x].color === color; i -= 1) {
      line += 1;
    }
    for (i = y + 1; i < ROWS && board[i][x] && board[i][x].color === color; i += 1) {
      line += 1;
    }
    found = found || line >= 4;
    board[y][x] = temp;
    return found;
  }

  function buildLevel(level) {
    var board = createEmptyBoard();
    var virusCount = clamp(6 + level * 3, 8, 62);
    var placed = 0;
    var attempts = 0;
    rngSeed = (0xabcddcba + level * 2654435761) >>> 0;

    while (placed < virusCount && attempts < virusCount * 120) {
      attempts += 1;
      var x = Math.floor(seededRandom() * COLS);
      var minY = Math.max(5, ROWS - 7 - Math.floor(level * 0.6));
      var y = minY + Math.floor(seededRandom() * (ROWS - minY));
      var color = pickColorIndex();
      if (!board[y][x] && !canCreateRun(board, x, y, color)) {
        board[y][x] = { type: "virus", color: color, id: -placed - 1 };
        placed += 1;
      }
    }

    state.board = board;
    state.viruses = placed;
    state.current = null;
    state.next = newPiece();
    state.combo = 0;
    state.assayColor = (level + 3) % COLORS.length;
    state.assayStreak = 0;
    state.dropMs = clamp(BASE_DROP_MS - (level - 1) * 48, 250, BASE_DROP_MS);
    state.settleTimer = 340;
    state.mode = "spawning";
    state.message = "Level " + level;
  }

  function startGame() {
    unlockAudio();
    state.level = START_LEVEL;
    state.score = 0;
    state.dose = 0;
    state.flash = 0;
    state.message = "Level 1";
    particles = [];
    clearBursts = [];
    pieceSerial = 1;
    buildLevel(state.level);
    overlay.classList.remove("overlay--visible");
    startBgm();
    playLocalSound("confirm", 0.48) || playTone(520, 0.06, "triangle", 0.06);
    updateHud();
  }

  function restartGame() {
    startGame();
  }

  function endGame() {
    state.mode = "gameover";
    state.message = "Game Over";
    overlayTitle.textContent = "Game Over";
    primaryButton.textContent = "Restart";
    overlay.classList.add("overlay--visible");
    stopBgm();
    playLocalSound("gameover", 0.5) || playTone(110, 0.24, "sawtooth", 0.045);
  }

  function completeLevel() {
    state.mode = "levelclear";
    state.score += state.level * 1200;
    state.level += 1;
    state.message = "Level " + state.level;
    state.settleTimer = 980;
    burstAt(boardRect.x + boardRect.w / 2, boardRect.y + boardRect.h * 0.28, COLORS[1], 36);
    playLocalSound("level", 0.64) || playTone(740, 0.1, "triangle", 0.08);
    setTimeout(function () {
      if (state.mode === "levelclear") {
        buildLevel(state.level);
      }
    }, 920);
  }

  function updateHud() {
    bestScore = Math.max(bestScore, state.score);
    localStorage.setItem("capsuleClinicBest", String(bestScore));
    scoreEl.textContent = formatNumber(state.score);
    bestEl.textContent = formatNumber(bestScore);
    levelEl.textContent = String(state.level);
    virusesEl.textContent = String(state.viruses);
    comboEl.textContent = String(state.combo);
    speedEl.textContent = (BASE_DROP_MS / state.dropMs).toFixed(1) + "x";
    doseEl.textContent = Math.floor(state.dose) + "%";
    assayEl.textContent = COLORS[state.assayColor].key;
    assayEl.style.color = COLORS[state.assayColor].glow;
    assayEl.title = "Bonus for clearing " + COLORS[state.assayColor].key + " microbes";
    doseButton.disabled = state.dose < 100 || state.viruses <= 0;
    doseButton.classList.toggle("icon-button--ready", state.dose >= 100 && state.viruses > 0);
    soundButton.textContent = muted ? "M" : "\u266b";
  }

  function actionMove(dx) {
    if (state.mode !== "falling" || !state.current) {
      return;
    }
    if (canPlacePiece(state.current, state.current.x + dx, state.current.y, state.current.dir)) {
      state.current.x += dx;
      state.current.lockPulse = 90;
      playLocalSound("move", 0.22) || playTone(260 + dx * 30, 0.025, "square", 0.025);
    }
  }

  function actionDown() {
    if (state.mode !== "falling" || !state.current) {
      return;
    }
    if (canPlacePiece(state.current, state.current.x, state.current.y + 1, state.current.dir)) {
      state.current.y += 1;
      state.score += 1;
      state.dropTimer = 0;
    } else {
      lockPiece();
    }
  }

  function hardDrop() {
    if (state.mode !== "falling" || !state.current) {
      return;
    }
    var distance = 0;
    while (canPlacePiece(state.current, state.current.x, state.current.y + 1, state.current.dir)) {
      state.current.y += 1;
      distance += 1;
    }
    state.score += distance * 4;
    lockPiece();
  }

  function useDose() {
    if (state.dose < 100 || state.viruses <= 0 || (state.mode !== "falling" && state.mode !== "settling" && state.mode !== "spawning")) {
      return;
    }
    var target = null;
    for (var y = 0; y < ROWS; y += 1) {
      for (var x = 0; x < COLS; x += 1) {
        var cell = state.board[y][x];
        if (cell && cell.type === "virus") {
          target = { x: x, y: y, cell: cell };
          break;
        }
      }
      if (target) {
        break;
      }
    }
    if (!target) {
      return;
    }
    var px = boardRect.x + target.x * boardRect.cell + boardRect.cell / 2;
    var py = boardRect.y + target.y * boardRect.cell + boardRect.cell / 2;
    burstAt(px, py, COLORS[target.cell.color], 28);
    clearBursts.push({ x: px, y: py, life: 420, age: 0, color: target.cell.color });
    state.board[target.y][target.x] = null;
    state.viruses = Math.max(0, state.viruses - 1);
    state.score += 750 + state.level * 100;
    state.dose = 0;
    state.flash = 1;
    state.shake = 10;
    if (state.mode !== "falling") {
      state.mode = "settling";
      state.settleTimer = GRAVITY_DELAY_MS;
    }
    playLocalSound("level", 0.55) || playChord([620, 930, 1240], 0.08, 0.055);
    updateHud();
    if (state.viruses <= 0) {
      state.current = null;
      completeLevel();
    }
  }

  function rotatePiece(clockwise) {
    if (state.mode !== "falling" || !state.current) {
      return;
    }
    var dir = (state.current.dir + (clockwise ? 1 : 3)) % 4;
    var kicks = [0, -1, 1, -2, 2];
    for (var i = 0; i < kicks.length; i += 1) {
      var nx = state.current.x + kicks[i];
      if (canPlacePiece(state.current, nx, state.current.y, dir)) {
        state.current.x = nx;
        state.current.dir = dir;
        state.current.lockPulse = 130;
        playLocalSound("rotate", 0.34) || playTone(390, 0.045, "triangle", 0.04);
        return;
      }
    }
  }

  function lockPiece() {
    var piece = state.current;
    var cells = pieceCells(piece);
    for (var i = 0; i < cells.length; i += 1) {
      var c = cells[i];
      if (c.y < 0) {
        endGame();
        return;
      }
      state.board[c.y][c.x] = {
        type: "pill",
        color: c.color,
        id: piece.id,
        half: c.half
      };
    }
    state.current = null;
    state.mode = "settling";
    state.settleTimer = CLEAR_DELAY_MS;
    playLocalSound("rotate", 0.2) || playTone(160, 0.05, "square", 0.04);
  }

  function findMatches() {
    var marks = new Set();
    var x;
    var y;
    for (y = 0; y < ROWS; y += 1) {
      var runStart = 0;
      for (x = 1; x <= COLS; x += 1) {
        var prev = state.board[y][x - 1];
        var cur = x < COLS ? state.board[y][x] : null;
        if (!prev || !cur || prev.color !== cur.color) {
          if (prev && x - runStart >= 4) {
            for (var mx = runStart; mx < x; mx += 1) {
              marks.add(mx + "," + y);
            }
          }
          runStart = x;
        }
      }
    }

    for (x = 0; x < COLS; x += 1) {
      var colStart = 0;
      for (y = 1; y <= ROWS; y += 1) {
        var prevCell = state.board[y - 1][x];
        var curCell = y < ROWS ? state.board[y][x] : null;
        if (!prevCell || !curCell || prevCell.color !== curCell.color) {
          if (prevCell && y - colStart >= 4) {
            for (var my = colStart; my < y; my += 1) {
              marks.add(x + "," + my);
            }
          }
          colStart = y;
        }
      }
    }

    return Array.from(marks).map(function (key) {
      var parts = key.split(",");
      return { x: Number(parts[0]), y: Number(parts[1]) };
    });
  }

  function clearMatches(matches) {
    if (!matches.length) {
      return;
    }
    state.combo += 1;
    var virusHits = 0;
    var assayHits = 0;
    for (var i = 0; i < matches.length; i += 1) {
      var c = matches[i];
      var cell = state.board[c.y][c.x];
      if (!cell) {
        continue;
      }
      if (cell.type === "virus") {
        virusHits += 1;
        if (cell.color === state.assayColor) {
          assayHits += 1;
        }
      }
      var px = boardRect.x + c.x * boardRect.cell + boardRect.cell / 2;
      var py = boardRect.y + c.y * boardRect.cell + boardRect.cell / 2;
      burstAt(px, py, COLORS[cell.color], 10 + state.combo * 2);
      clearBursts.push({ x: px, y: py, life: 360, age: 0, color: cell.color });
      state.board[c.y][c.x] = null;
    }
    state.viruses = Math.max(0, state.viruses - virusHits);
    state.assayStreak = assayHits ? state.assayStreak + assayHits : 0;
    state.score += matches.length * 90 * state.combo + virusHits * 360 + assayHits * (480 + state.assayStreak * 80);
    state.dose = clamp(state.dose + matches.length * 4 + virusHits * 12 + assayHits * 10 + state.combo * 2, 0, 100);
    state.flash = 1;
    state.shake = Math.min(14, 4 + virusHits * 2 + state.combo);
    playLocalSound("clear", 0.58) || playChord(virusHits ? [520, 780, 1040] : [450, 675], 0.08, 0.055);
    updateHud();
  }

  function groupPills() {
    var groups = new Map();
    for (var y = 0; y < ROWS; y += 1) {
      for (var x = 0; x < COLS; x += 1) {
        var cell = state.board[y][x];
        if (cell && cell.type === "pill") {
          if (!groups.has(cell.id)) {
            groups.set(cell.id, []);
          }
          groups.get(cell.id).push({ x: x, y: y, cell: cell });
        }
      }
    }
    return Array.from(groups.values()).sort(function (a, b) {
      var ay = Math.max.apply(null, a.map(function (c) { return c.y; }));
      var by = Math.max.apply(null, b.map(function (c) { return c.y; }));
      return by - ay;
    });
  }

  function applyGravityStep() {
    var groups = groupPills();
    var moved = false;
    for (var i = 0; i < groups.length; i += 1) {
      var group = groups[i];
      var canFall = true;
      for (var j = 0; j < group.length; j += 1) {
        var c = group[j];
        if (c.y + 1 >= ROWS) {
          canFall = false;
          break;
        }
        var below = state.board[c.y + 1][c.x];
        if (below && below.id !== c.cell.id) {
          canFall = false;
          break;
        }
      }
      if (canFall) {
        group.sort(function (a, b) { return b.y - a.y; });
        for (var k = 0; k < group.length; k += 1) {
          var cellInfo = group[k];
          state.board[cellInfo.y + 1][cellInfo.x] = cellInfo.cell;
          state.board[cellInfo.y][cellInfo.x] = null;
        }
        moved = true;
      }
    }
    return moved;
  }

  function settleStep() {
    var matches = findMatches();
    if (matches.length) {
      clearMatches(matches);
      state.settleTimer = CLEAR_DELAY_MS + state.combo * 22;
      return;
    }

    if (applyGravityStep()) {
      state.settleTimer = GRAVITY_DELAY_MS;
      return;
    }

    state.combo = 0;
    updateHud();
    if (state.viruses <= 0) {
      completeLevel();
    } else {
      spawnPiece();
    }
  }

  function update(dt) {
    if (state.flash > 0) {
      state.flash = Math.max(0, state.flash - dt * 0.004);
    }
    updateParticles(dt);

    if (state.current && state.current.lockPulse > 0) {
      state.current.lockPulse = Math.max(0, state.current.lockPulse - dt);
    }

    if (state.mode === "spawning") {
      state.settleTimer -= dt;
      if (state.settleTimer <= 0) {
        spawnPiece();
      }
      return;
    }

    if (state.mode === "settling") {
      state.settleTimer -= dt;
      if (state.settleTimer <= 0) {
        settleStep();
      }
      return;
    }

    if (state.mode !== "falling" || !state.current) {
      return;
    }

    var speed = heldDown ? 0.12 : 1;
    state.dropTimer += dt / speed;
    if (state.dropTimer >= state.dropMs) {
      state.dropTimer = 0;
      actionDown();
    }
  }

  function updateParticles(dt) {
    state.shake = Math.max(0, state.shake - dt * 0.035);
    for (var i = particles.length - 1; i >= 0; i -= 1) {
      var p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.00045 * dt;
      p.spin += p.spinV * dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
    for (var b = clearBursts.length - 1; b >= 0; b -= 1) {
      clearBursts[b].age += dt;
      clearBursts[b].life -= dt;
      if (clearBursts[b].life <= 0) {
        clearBursts.splice(b, 1);
      }
    }
  }

  function burstAt(x, y, color, amount) {
    for (var i = 0; i < amount; i += 1) {
      var a = seededRandom() * Math.PI * 2;
      var s = 0.08 + seededRandom() * 0.21;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.05,
        life: 360 + seededRandom() * 300,
        maxLife: 660,
        size: 5 + seededRandom() * 8,
        color: color,
        spin: seededRandom() * Math.PI,
        spinV: -0.006 + seededRandom() * 0.012
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }
    drawBackground();
    drawBottle();
    drawGhost();
    drawBoard();
    drawCurrentPiece();
    drawClearBursts();
    drawParticles();
    drawStatusRibbon();
    ctx.restore();
    drawNext();
  }

  function drawBackground() {
    if (images.background) {
      drawCoverImage(ctx, images.background, 0, 0, canvas.width, canvas.height);
    } else {
      var bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0, "#10233d");
      bg.addColorStop(1, "#07101e");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    drawBackgroundPropLayer();
    drawScannerSweep();
    if (state.flash > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, " + (state.flash * 0.1).toFixed(3) + ")";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function drawCoverImage(context, image, x, y, w, h) {
    var sourceRatio = image.width / image.height;
    var destRatio = w / h;
    var sx = 0;
    var sy = 0;
    var sw = image.width;
    var sh = image.height;
    if (sourceRatio > destRatio) {
      sw = image.height * destRatio;
      sx = (image.width - sw) / 2;
    } else {
      sh = image.width / destRatio;
      sy = (image.height - sh) * 0.35;
    }
    context.drawImage(image, sx, sy, sw, sh, x, y, w, h);
  }

  function drawBackgroundPropLayer() {
    if (!images.bgProps) {
      return;
    }
    var drift = Math.sin(lastTime * 0.0014) * 7;
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.drawImage(images.bgProps, 0, 0, 256, 256, 18, 186 + drift, 132, 186);
    ctx.drawImage(images.bgProps, 256, 0, 256, 256, 750, 186 - drift, 132, 186);
    ctx.globalAlpha = 0.36;
    ctx.drawImage(images.bgProps, 512, 0, 256, 256, 90, 690 - drift, 118, 118);
    ctx.drawImage(images.bgProps, 768, 0, 256, 256, 692, 690 + drift, 118, 118);
    ctx.globalAlpha = 0.28;
    ctx.drawImage(images.bgProps, 512, 256, 256, 256, 34, 880, 180, 116);
    ctx.drawImage(images.bgProps, 768, 256, 256, 256, 686, 880, 180, 116);
    ctx.restore();
  }

  function drawScannerSweep() {
    var r = boardRect;
    var sweep = (lastTime * 0.055) % (r.h + 160);
    ctx.save();
    roundRect(ctx, r.x + 6, r.y + 6, r.w - 12, r.h - 12, 28);
    ctx.clip();
    var y = r.y - 80 + sweep;
    var grad = ctx.createLinearGradient(0, y - 34, 0, y + 54);
    grad.addColorStop(0, "rgba(83, 225, 209, 0)");
    grad.addColorStop(0.48, "rgba(83, 225, 209, 0.2)");
    grad.addColorStop(0.52, "rgba(255, 255, 255, 0.34)");
    grad.addColorStop(1, "rgba(83, 225, 209, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(r.x, y - 34, r.w, 88);
    ctx.restore();
  }

  function drawBottle() {
    var r = boardRect;
    ctx.save();
    ctx.fillStyle = "rgba(2, 9, 18, 0.58)";
    roundRect(ctx, r.x - 10, r.y - 12, r.w + 20, r.h + 22, 34);
    ctx.fill();
    drawLabTileBackdrop();

    ctx.strokeStyle = "rgba(141, 226, 255, 0.18)";
    ctx.lineWidth = 2;
    for (var x = 0; x <= COLS; x += 1) {
      ctx.beginPath();
      ctx.moveTo(r.x + x * r.cell, r.y);
      ctx.lineTo(r.x + x * r.cell, r.y + r.h);
      ctx.stroke();
    }
    for (var y = 0; y <= ROWS; y += 1) {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y + y * r.cell);
      ctx.lineTo(r.x + r.w, r.y + y * r.cell);
      ctx.stroke();
    }

    if (images.frame) {
      ctx.drawImage(images.frame, r.x - 124, r.y - 164, r.w + 248, r.h + 278);
    } else {
      ctx.strokeStyle = "rgba(173, 242, 255, 0.75)";
      ctx.lineWidth = 10;
      roundRect(ctx, r.x - 18, r.y - 18, r.w + 36, r.h + 36, 42);
      ctx.stroke();
    }
    drawAssayBeacon();
    ctx.restore();
  }

  function drawAssayBeacon() {
    var r = boardRect;
    var color = COLORS[state.assayColor];
    var pulse = 0.65 + Math.sin(lastTime * 0.006) * 0.2;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(5, 12, 22, 0.68)";
    roundRect(ctx, r.x + r.w - 128, r.y - 72, 116, 40, 8);
    ctx.fill();
    ctx.strokeStyle = color.glow;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = color.main;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(r.x + r.w - 102, r.y - 52, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "#eef8ff";
    ctx.font = "800 14px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("ASSAY", r.x + r.w - 82, r.y - 52);
    ctx.restore();
  }

  function drawLabTileBackdrop() {
    if (!images.tiles) {
      return;
    }
    var r = boardRect;
    ctx.save();
    roundRect(ctx, r.x + 4, r.y + 4, r.w - 8, r.h - 8, 24);
    ctx.clip();
    ctx.globalAlpha = 0.22;
    var tile = r.cell * 2;
    var drift = ((lastTime * 0.006) % tile);
    for (var y = -tile; y < r.h + tile; y += tile) {
      for (var x = -tile; x < r.w + tile; x += tile) {
        var frame = Math.abs(Math.floor((x + y + drift) / tile)) % 16;
        var sx = (frame % 4) * 256;
        var sy = Math.floor(frame / 4) * 256;
        ctx.drawImage(images.tiles, sx, sy, 256, 256, r.x + x, r.y + y + drift * 0.12, tile, tile);
      }
    }
    ctx.restore();
  }

  function drawBoard() {
    for (var y = 0; y < ROWS; y += 1) {
      for (var x = 0; x < COLS; x += 1) {
        var cell = state.board[y][x];
        if (cell) {
          drawCell(cell, x, y, 1);
        }
      }
    }
  }

  function drawGhost() {
    if (state.mode !== "falling" || !state.current) {
      return;
    }
    var ghostY = state.current.y;
    while (canPlacePiece(state.current, state.current.x, ghostY + 1, state.current.dir)) {
      ghostY += 1;
    }
    var cells = pieceCells(state.current, state.current.x, ghostY, state.current.dir);
    ctx.save();
    ctx.globalAlpha = 0.22;
    for (var i = 0; i < cells.length; i += 1) {
      drawPillSprite(cells[i].color, cells[i].x, cells[i].y, 1);
    }
    ctx.restore();
  }

  function drawCurrentPiece() {
    if (!state.current) {
      return;
    }
    var cells = pieceCells(state.current);
    var alpha = state.mode === "falling" ? 1 : 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    drawPieceBridge(cells[0], cells[1], state.current.lockPulse);
    for (var i = 0; i < cells.length; i += 1) {
      drawPillSprite(cells[i].color, cells[i].x, cells[i].y, 1);
    }
    ctx.restore();
  }

  function drawCell(cell, x, y, alpha) {
    if (cell.type === "virus") {
      drawVirusSprite(cell.color, x, y, alpha);
    } else {
      drawPillSprite(cell.color, x, y, alpha);
    }
  }

  function drawPieceBridge(a, b, pulse) {
    if (a.y < 0 || b.y < 0) {
      return;
    }
    var r = boardRect;
    var ax = r.x + a.x * r.cell + r.cell / 2;
    var ay = r.y + a.y * r.cell + r.cell / 2;
    var bx = r.x + b.x * r.cell + r.cell / 2;
    var by = r.y + b.y * r.cell + r.cell / 2;
    var width = r.cell * (pulse > 0 ? 0.46 : 0.42);
    var grad = ctx.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0, COLORS[a.color].main);
    grad.addColorStop(1, COLORS[b.color].main);
    ctx.strokeStyle = grad;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.globalAlpha *= 0.92;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  function drawPillSprite(colorIndex, x, y, alpha) {
    if (y < 0) {
      return;
    }
    var r = boardRect;
    var px = r.x + x * r.cell;
    var py = r.y + y * r.cell;
    ctx.save();
    ctx.globalAlpha *= alpha;
    if (images.pills) {
      ctx.drawImage(images.pills, colorIndex * 256, 0, 256, 256, px + 4, py + 4, r.cell - 8, r.cell - 8);
    } else {
      fallbackGem(colorIndex, px + 5, py + 5, r.cell - 10);
    }
    ctx.restore();
  }

  function drawVirusSprite(colorIndex, x, y, alpha) {
    var r = boardRect;
    var px = r.x + x * r.cell;
    var py = r.y + y * r.cell;
    ctx.save();
    ctx.globalAlpha *= alpha;
    if (images.virusAnim) {
      var frame = (Math.floor(lastTime * 0.006 + x + y) % 4 + 4) % 4;
      ctx.drawImage(images.virusAnim, (colorIndex * 4 + frame) * 256, 0, 256, 256, px + 2, py + 2, r.cell - 4, r.cell - 4);
    } else if (images.viruses) {
      ctx.drawImage(images.viruses, colorIndex * 256, 0, 256, 256, px + 2, py + 2, r.cell - 4, r.cell - 4);
    } else {
      fallbackGem(colorIndex, px + 5, py + 5, r.cell - 10);
    }
    if (colorIndex === state.assayColor) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(px + 6, py + 6, r.cell - 12, r.cell - 12);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function fallbackGem(colorIndex, x, y, size) {
    var c = COLORS[colorIndex];
    var grad = ctx.createRadialGradient(x + size * 0.3, y + size * 0.25, size * 0.1, x + size / 2, y + size / 2, size * 0.58);
    grad.addColorStop(0, c.glow);
    grad.addColorStop(0.55, c.main);
    grad.addColorStop(1, c.dark);
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, size, size, size * 0.28);
    ctx.fill();
  }

  function drawParticles() {
    ctx.save();
    for (var i = 0; i < particles.length; i += 1) {
      var p = particles[i];
      var alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color.glow;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      roundRect(ctx, -p.size / 2, -p.size / 2, p.size, p.size, 2);
      ctx.fill();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.restore();
  }

  function drawClearBursts() {
    if (!images.clearFx) {
      return;
    }
    ctx.save();
    for (var i = 0; i < clearBursts.length; i += 1) {
      var burst = clearBursts[i];
      var frame = clamp(Math.floor((burst.age / 360) * 8), 0, 7);
      var alpha = clamp(burst.life / 360, 0, 1);
      var size = boardRect.cell * (1.25 + frame * 0.08);
      ctx.globalAlpha = alpha;
      ctx.drawImage(images.clearFx, frame * 256, 0, 256, 256, burst.x - size / 2, burst.y - size / 2, size, size);
    }
    ctx.restore();
  }

  function drawStatusRibbon() {
    if (state.mode !== "levelclear" && state.mode !== "spawning" && state.mode !== "paused") {
      return;
    }
    ctx.save();
    ctx.fillStyle = "rgba(5, 12, 22, 0.56)";
    roundRect(ctx, 260, 60, 380, 72, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.stroke();
    ctx.fillStyle = "#eef8ff";
    ctx.font = "900 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(state.mode === "paused" ? "Paused" : state.message, 450, 96);
    ctx.restore();
  }

  function drawNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextCtx.fillStyle = "rgba(5, 12, 22, 0.28)";
    roundRect(nextCtx, 12, 16, nextCanvas.width - 24, nextCanvas.height - 28, 8);
    nextCtx.fill();
    if (!state.next) {
      return;
    }
    var tile = 56;
    var cx = nextCanvas.width / 2 - tile;
    var cy = nextCanvas.height / 2 - tile / 2;
    drawNextPillHalf(state.next.colors[0], cx, cy, tile);
    drawNextPillHalf(state.next.colors[1], cx + tile, cy, tile);
    nextCtx.strokeStyle = "rgba(255,255,255,0.16)";
    nextCtx.lineWidth = 10;
    nextCtx.lineCap = "round";
    nextCtx.beginPath();
    nextCtx.moveTo(cx + tile / 2, cy + tile / 2);
    nextCtx.lineTo(cx + tile * 1.5, cy + tile / 2);
    nextCtx.stroke();
    drawNextPillHalf(state.next.colors[0], cx, cy, tile);
    drawNextPillHalf(state.next.colors[1], cx + tile, cy, tile);
  }

  function drawNextPillHalf(colorIndex, x, y, size) {
    if (images.pills) {
      nextCtx.drawImage(images.pills, colorIndex * 256, 0, 256, 256, x, y, size, size);
    } else {
      var old = ctx;
      ctx = nextCtx;
      fallbackGem(colorIndex, x, y, size);
      ctx = old;
    }
  }

  function roundRect(context, x, y, w, h, r) {
    var radius = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + w, y, x + w, y + h, radius);
    context.arcTo(x + w, y + h, x, y + h, radius);
    context.arcTo(x, y + h, x, y, radius);
    context.arcTo(x, y, x + w, y, radius);
    context.closePath();
  }

  function setPaused(paused) {
    if (paused && state.mode === "falling") {
      state.mode = "paused";
      overlayTitle.textContent = "Paused";
      primaryButton.textContent = "Resume";
      overlay.classList.add("overlay--visible");
      if (bgm) {
        bgm.volume = 0.16;
      }
    } else if (!paused && state.mode === "paused") {
      state.mode = "falling";
      overlay.classList.remove("overlay--visible");
      if (bgm) {
        bgm.volume = 0.3;
      }
    }
  }

  function handleAction(action, pressed) {
    if (action === "down") {
      heldDown = pressed;
      if (pressed) {
        actionDown();
      }
      return;
    }
    if (!pressed) {
      return;
    }
    if (action === "left") {
      actionMove(-1);
    } else if (action === "right") {
      actionMove(1);
    } else if (action === "rotate") {
      rotatePiece(true);
    } else if (action === "drop") {
      hardDrop();
    } else if (action === "dose") {
      useDose();
    }
  }

  function bindInput() {
    document.addEventListener("keydown", function (event) {
      if (event.repeat && event.code !== "ArrowDown") {
        return;
      }
      if (event.code === "ArrowLeft" || event.code === "KeyA") {
        event.preventDefault();
        handleAction("left", true);
      } else if (event.code === "ArrowRight" || event.code === "KeyD") {
        event.preventDefault();
        handleAction("right", true);
      } else if (event.code === "ArrowDown" || event.code === "KeyS") {
        event.preventDefault();
        handleAction("down", true);
      } else if (event.code === "ArrowUp" || event.code === "KeyW") {
        event.preventDefault();
        handleAction("rotate", true);
      } else if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        if (state.mode === "menu" || state.mode === "gameover") {
          startGame();
        } else {
          handleAction("drop", true);
        }
      } else if (event.code === "KeyP" || event.code === "Escape") {
        event.preventDefault();
        setPaused(state.mode === "falling");
      } else if (event.code === "KeyF" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
        event.preventDefault();
        useDose();
      }
    });
    document.addEventListener("keyup", function (event) {
      if (event.code === "ArrowDown" || event.code === "KeyS") {
        handleAction("down", false);
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-action]"), function (button) {
      var action = button.getAttribute("data-action");
      button.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        handleAction(action, true);
      });
      button.addEventListener("pointerup", function (event) {
        event.preventDefault();
        handleAction(action, false);
      });
      button.addEventListener("pointercancel", function () {
        handleAction(action, false);
      });
      button.addEventListener("pointerleave", function () {
        if (action === "down") {
          handleAction(action, false);
        }
      });
    });

    primaryButton.addEventListener("click", function () {
      if (state.mode === "paused") {
        setPaused(false);
      } else {
        startGame();
      }
    });
    pauseButton.addEventListener("click", function () {
      setPaused(state.mode === "falling");
    });
    doseButton.addEventListener("click", useDose);
    restartButton.addEventListener("click", restartGame);
    soundButton.addEventListener("click", function () {
      muted = !muted;
      localStorage.setItem("capsuleClinicMuted", muted ? "1" : "0");
      unlockAudio();
      if (muted) {
        stopBgm();
      } else {
        startBgm();
        playLocalSound("confirm", 0.4) || playTone(440, 0.04, "triangle", 0.06);
      }
      updateHud();
    });
  }

  function unlockAudio() {
    if (!audioContext) {
      var AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) {
        audioContext = new AudioCtor();
      }
    }
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume();
    }
  }

  function startBgm() {
    if (muted || !bgm) {
      return;
    }
    bgm.volume = 0.3;
    var playPromise = bgm.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {});
    }
  }

  function stopBgm() {
    if (!bgm) {
      return;
    }
    bgm.pause();
  }

  function playLocalSound(key, volume) {
    if (muted || !audioElements[key]) {
      return false;
    }
    try {
      var sound = audioElements[key].cloneNode();
      sound.volume = volume;
      var promise = sound.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {});
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  function playTone(freq, duration, type, gainValue) {
    if (muted || !audioContext) {
      return;
    }
    var now = audioContext.currentTime;
    var osc = audioContext.createOscillator();
    var gain = audioContext.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue || 0.04, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playChord(freqs, duration, gainValue) {
    for (var i = 0; i < freqs.length; i += 1) {
      setTimeout(function (freq) {
        playTone(freq, duration, "triangle", gainValue);
      }.bind(null, freqs[i]), i * 25);
    }
  }

  function loop(time) {
    if (!lastTime) {
      lastTime = time;
    }
    var dt = Math.min(32, time - lastTime);
    lastTime = time;
    if (assetsReady) {
      update(dt);
      updateHud();
      draw();
    }
    requestAnimationFrame(loop);
  }

  function bootFallbackIfNeeded(error) {
    console.warn(error);
    assetsReady = true;
  }

  function runSmokeSequence() {
    if (!new URLSearchParams(window.location.search).has("smoke")) {
      return;
    }
    setTimeout(function () {
      startGame();
    }, 120);
    setTimeout(function () {
      actionMove(1);
      rotatePiece(true);
      actionMove(-1);
    }, 520);
    setTimeout(function () {
      hardDrop();
    }, 900);
  }

  bestEl.textContent = formatNumber(bestScore);
  setupAudioAssets();
  updateHud();
  bindInput();
  loadAssets().catch(bootFallbackIfNeeded).finally(function () {
    runSmokeSequence();
    requestAnimationFrame(loop);
  });
}());
