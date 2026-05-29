(() => {
  "use strict";

  const DIR = { N: 0, E: 1, S: 2, W: 3 };
  const VEC = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 }
  ];
  const OPP = [DIR.S, DIR.W, DIR.N, DIR.E];
  const COLORS = {
    cyan: "#66e8ff",
    amber: "#ffc75a",
    violet: "#c993ff",
    green: "#8dffb1"
  };
  const STORAGE_KEY = "lumen-lock-best-v1";
  const AUDIO_FILES = {
    bgm: "assets/audio/bgm-lumen-lock.mp3",
    rotate: "assets/audio/sfx-rotate.wav",
    target: "assets/audio/sfx-target.wav",
    solve: "assets/audio/sfx-solve.wav",
    click: "assets/audio/sfx-click.wav"
  };

  const makeTile = (x, y, type, rot = 0, locked = false) => ({
    x,
    y,
    type,
    rot,
    initialRot: rot,
    locked
  });

  const LEVELS = [
    {
      id: "first-seal",
      name: "First Seal",
      size: 6,
      par: 2,
      sources: [{ x: -1, y: 2, dir: DIR.E, color: "cyan" }],
      targets: [{ x: 4, y: 4, color: "cyan" }],
      tiles: [
        makeTile(2, 2, "corner", 1),
        makeTile(2, 4, "corner", 3)
      ]
    },
    {
      id: "twin-prism",
      name: "Twin Prism",
      size: 6,
      par: 5,
      sources: [{ x: -1, y: 1, dir: DIR.E, color: "cyan" }],
      targets: [
        { x: 5, y: 1, color: "cyan" },
        { x: 4, y: 3, color: "cyan" }
      ],
      tiles: [
        makeTile(2, 1, "split", 1),
        makeTile(2, 3, "corner", 2)
      ]
    },
    {
      id: "amber-crossing",
      name: "Amber Crossing",
      size: 6,
      par: 7,
      sources: [
        { x: -1, y: 0, dir: DIR.E, color: "cyan" },
        { x: 4, y: -1, dir: DIR.S, color: "amber" }
      ],
      targets: [
        { x: 4, y: 3, color: "cyan" },
        { x: 2, y: 4, color: "amber" }
      ],
      tiles: [
        makeTile(1, 0, "corner", 0),
        makeTile(1, 3, "corner", 3),
        makeTile(4, 1, "corner", 1),
        makeTile(2, 1, "corner", 3)
      ]
    },
    {
      id: "north-fork",
      name: "North Fork",
      size: 7,
      par: 4,
      sources: [{ x: -1, y: 5, dir: DIR.E, color: "violet" }],
      targets: [
        { x: 5, y: 5, color: "violet" },
        { x: 5, y: 2, color: "violet" }
      ],
      tiles: [
        makeTile(2, 5, "split", 0),
        makeTile(2, 2, "corner", 3),
        makeTile(4, 4, "wall", 0, true),
        makeTile(1, 1, "wall", 0, true)
      ]
    },
    {
      id: "triple-lock",
      name: "Triple Lock",
      size: 7,
      par: 11,
      sources: [
        { x: -1, y: 1, dir: DIR.E, color: "cyan" },
        { x: 1, y: 7, dir: DIR.N, color: "amber" },
        { x: 7, y: 5, dir: DIR.W, color: "violet" }
      ],
      targets: [
        { x: 5, y: 4, color: "cyan" },
        { x: 5, y: 1, color: "amber" },
        { x: 1, y: 2, color: "violet" }
      ],
      tiles: [
        makeTile(3, 1, "corner", 0),
        makeTile(3, 4, "corner", 2),
        makeTile(1, 3, "corner", 3),
        makeTile(5, 3, "corner", 2),
        makeTile(4, 5, "corner", 2),
        makeTile(4, 2, "corner", 0),
        makeTile(6, 1, "wall", 0, true),
        makeTile(0, 5, "wall", 0, true)
      ]
    }
  ];

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const nodes = {
    levelName: document.getElementById("levelName"),
    moves: document.getElementById("movesValue"),
    par: document.getElementById("parValue"),
    targets: document.getElementById("targetValue"),
    best: document.getElementById("bestValue"),
    badge: document.getElementById("stateBadge"),
    levelButtons: document.getElementById("levelButtons"),
    undo: document.getElementById("undoButton"),
    reset: document.getElementById("resetButton"),
    next: document.getElementById("nextButton"),
    audio: document.getElementById("audioButton"),
    lockState: document.getElementById("lockState"),
    signalValue: document.getElementById("signalValue"),
    signalList: document.getElementById("signalList")
  };

  const assets = {
    background: loadImage("assets/lumen-lock-background.png"),
    glyphs: loadImage("assets/lumen-lock-glyphs.png"),
    uiSkin: loadImage("assets/lumen-lock-ui-skin.png")
  };

  const audio = {
    supported: typeof Audio !== "undefined",
    enabled: false,
    bgm: null,
    sfx: {}
  };

  const state = {
    levelIndex: 0,
    grid: [],
    moves: 0,
    undo: [],
    selected: { x: 0, y: 0 },
    beams: { segments: [], activeTargets: new Set() },
    solved: false,
    best: loadBest(),
    canvasWidth: 0,
    canvasHeight: 0,
    board: null
  };

  function loadImage(src) {
    const image = new Image();
    image.addEventListener("load", () => draw(performance.now()));
    image.src = src;
    return image;
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveBest() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.best));
    } catch {
      // Local storage is optional; the game stays playable without it.
    }
  }

  function createAudio(src, volume, loop = false) {
    if (!audio.supported) return null;
    const sound = new Audio(src);
    sound.preload = "auto";
    sound.volume = volume;
    sound.loop = loop;
    return sound;
  }

  function setupAudio() {
    if (!audio.supported) {
      updateAudioButton();
      return;
    }
    audio.bgm = createAudio(AUDIO_FILES.bgm, 0.34, true);
    audio.sfx = {
      rotate: createAudio(AUDIO_FILES.rotate, 0.22),
      target: createAudio(AUDIO_FILES.target, 0.32),
      solve: createAudio(AUDIO_FILES.solve, 0.48),
      click: createAudio(AUDIO_FILES.click, 0.16)
    };
    updateAudioButton();
  }

  function updateAudioButton() {
    if (!nodes.audio) return;
    nodes.audio.textContent = audio.enabled ? "Sound On" : "Sound";
    nodes.audio.setAttribute("aria-pressed", String(audio.enabled));
    nodes.audio.classList.toggle("is-on", audio.enabled);
    nodes.audio.disabled = !audio.supported;
  }

  function setAudioEnabled(enabled) {
    if (!audio.supported) return;
    audio.enabled = enabled;
    updateAudioButton();
    if (audio.enabled) {
      audio.bgm?.play().catch(() => {});
    } else {
      audio.bgm?.pause();
    }
  }

  function primeAudio() {
    if (audio.supported && !audio.enabled) {
      setAudioEnabled(true);
    }
  }

  function playSound(name) {
    if (!audio.supported || !audio.enabled) return;
    const sound = audio.sfx[name];
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }

  function cloneTile(tile) {
    return tile ? { ...tile } : null;
  }

  function loadLevel(index) {
    const level = LEVELS[index];
    state.levelIndex = index;
    state.moves = 0;
    state.undo = [];
    state.solved = false;
    state.selected = { x: 0, y: 0 };
    state.grid = Array.from({ length: level.size }, () => Array.from({ length: level.size }, () => null));
    level.tiles.forEach((tile) => {
      state.grid[tile.y][tile.x] = cloneTile(tile);
    });
    focusFirstTile();
    recompute();
    renderLevelButtons();
  }

  function focusFirstTile() {
    const tile = flatTiles().find((item) => item && !item.locked && item.type !== "wall");
    if (tile) {
      state.selected = { x: tile.x, y: tile.y };
    }
  }

  function flatTiles() {
    return state.grid.flat().filter(Boolean);
  }

  function getLevel() {
    return LEVELS[state.levelIndex];
  }

  function connectorsFor(tile) {
    if (!tile || tile.type === "wall") return [];
    const rot = ((tile.rot % 4) + 4) % 4;

    if (tile.type === "line") {
      return rot % 2 === 0 ? [DIR.N, DIR.S] : [DIR.E, DIR.W];
    }

    if (tile.type === "corner") {
      const pairs = [
        [DIR.N, DIR.E],
        [DIR.E, DIR.S],
        [DIR.S, DIR.W],
        [DIR.W, DIR.N]
      ];
      return pairs[rot];
    }

    if (tile.type === "split") {
      return [DIR.N, DIR.E, DIR.S, DIR.W].filter((dir) => dir !== rot);
    }

    if (tile.type === "cross") {
      return [DIR.N, DIR.E, DIR.S, DIR.W];
    }

    return [];
  }

  function routeTile(tile, incomingDir) {
    if (!tile) return [incomingDir];
    if (tile.type === "wall") return [];

    const entrySide = OPP[incomingDir];
    const connectors = connectorsFor(tile);
    if (!connectors.includes(entrySide)) {
      return [];
    }
    return connectors.filter((dir) => dir !== entrySide);
  }

  function computeBeams() {
    const level = getLevel();
    const activeTargets = new Set();
    const segments = [];
    const queue = [];
    const visited = new Set();

    level.sources.forEach((source) => {
      const vector = VEC[source.dir];
      queue.push({
        x: source.x + vector.x,
        y: source.y + vector.y,
        dir: source.dir,
        color: source.color,
        fromX: source.x + 0.5,
        fromY: source.y + 0.5,
        depth: 0
      });
    });

    while (queue.length) {
      const beam = queue.shift();
      if (beam.depth > level.size * level.size * 3) continue;
      if (beam.x < 0 || beam.y < 0 || beam.x >= level.size || beam.y >= level.size) continue;

      const key = `${beam.x},${beam.y},${beam.dir},${beam.color}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const centerX = beam.x + 0.5;
      const centerY = beam.y + 0.5;
      segments.push({
        x1: beam.fromX,
        y1: beam.fromY,
        x2: centerX,
        y2: centerY,
        color: beam.color
      });

      level.targets.forEach((target, index) => {
        if (target.x === beam.x && target.y === beam.y && target.color === beam.color) {
          activeTargets.add(index);
        }
      });

      const tile = state.grid[beam.y][beam.x];
      const outDirs = routeTile(tile, beam.dir);
      outDirs.forEach((outDir) => {
        const vector = VEC[outDir];
        queue.push({
          x: beam.x + vector.x,
          y: beam.y + vector.y,
          dir: outDir,
          color: beam.color,
          fromX: centerX,
          fromY: centerY,
          depth: beam.depth + 1
        });
      });
    }

    return { segments, activeTargets, visited };
  }

  function recompute() {
    const wasSolved = state.solved;
    const previousTargets = state.beams.activeTargets.size;
    state.beams = computeBeams();
    state.solved = state.beams.activeTargets.size === getLevel().targets.length;
    if (state.beams.activeTargets.size > previousTargets) {
      playSound("target");
    }
    if (state.solved && !wasSolved) {
      const level = getLevel();
      playSound("solve");
      const previous = state.best[level.id];
      if (!previous || state.moves < previous) {
        state.best[level.id] = state.moves;
        saveBest();
      }
    }
    updateDom();
    draw(performance.now());
  }

  function updateDom() {
    const level = getLevel();
    const lit = state.beams.activeTargets.size;
    nodes.levelName.textContent = level.name;
    nodes.moves.textContent = String(state.moves);
    nodes.par.textContent = String(level.par);
    nodes.targets.textContent = `${lit}/${level.targets.length}`;
    nodes.signalValue.textContent = String(state.beams.segments.length);
    nodes.lockState.textContent = state.solved ? "Solved" : "Open";
    nodes.best.textContent = state.best[level.id] ? `Best ${state.best[level.id]}` : "Best -";
    nodes.badge.textContent = state.solved ? "Unlocked" : "Align";
    nodes.badge.classList.toggle("is-solved", state.solved);
    nodes.undo.disabled = state.undo.length === 0;
    nodes.next.disabled = !state.solved && state.levelIndex < LEVELS.length - 1;
    renderSignals();
  }

  function renderSignals() {
    const level = getLevel();
    nodes.signalList.innerHTML = "";
    level.targets.forEach((target, index) => {
      const chip = document.createElement("div");
      chip.className = "signal-chip";
      const label = document.createElement("span");
      const dot = document.createElement("i");
      dot.style.color = COLORS[target.color];
      dot.style.background = COLORS[target.color];
      label.append(dot, target.color);
      const stateText = document.createElement("strong");
      stateText.textContent = state.beams.activeTargets.has(index) ? "Lit" : "Dark";
      chip.append(label, stateText);
      nodes.signalList.append(chip);
    });
  }

  function renderLevelButtons() {
    nodes.levelButtons.innerHTML = "";
    LEVELS.forEach((level, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(index + 1);
      button.setAttribute("aria-label", level.name);
      button.classList.toggle("is-active", index === state.levelIndex);
      button.addEventListener("click", () => {
        primeAudio();
        playSound("click");
        loadLevel(index);
      });
      nodes.levelButtons.append(button);
    });
  }

  function captureRotations() {
    return {
      moves: state.moves,
      rotations: state.grid.map((row) => row.map((tile) => (tile ? tile.rot : null))),
      selected: { ...state.selected }
    };
  }

  function restoreSnapshot(snapshot) {
    state.moves = snapshot.moves;
    state.selected = { ...snapshot.selected };
    state.grid.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile) tile.rot = snapshot.rotations[y][x];
      });
    });
    recompute();
  }

  function rotationLimit(tile) {
    if (!tile || tile.locked || tile.type === "wall") return 1;
    if (tile.type === "line") return 2;
    return 4;
  }

  function rotateCell(x, y, delta = 1) {
    const tile = state.grid[y]?.[x];
    const limit = rotationLimit(tile);
    if (!tile || limit <= 1) return;
    state.undo.push(captureRotations());
    tile.rot = (tile.rot + delta + limit) % limit;
    state.moves += 1;
    state.selected = { x, y };
    playSound("rotate");
    recompute();
  }

  function resetLevel() {
    state.grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile) tile.rot = tile.initialRot;
      });
    });
    state.moves = 0;
    state.undo = [];
    state.solved = false;
    focusFirstTile();
    recompute();
  }

  function nextLevel() {
    if (state.levelIndex < LEVELS.length - 1) {
      loadLevel(state.levelIndex + 1);
    }
  }

  function undo() {
    const snapshot = state.undo.pop();
    if (snapshot) restoreSnapshot(snapshot);
  }

  function fitCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(320, Math.floor(rect.height));
    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.canvasWidth = width;
      state.canvasHeight = height;
      state.board = null;
    }
  }

  function boardRect() {
    if (state.board) return state.board;
    const level = getLevel();
    const margin = Math.min(74, Math.max(32, Math.min(state.canvasWidth, state.canvasHeight) * 0.095));
    const size = Math.max(260, Math.min(state.canvasWidth - margin * 2, state.canvasHeight - margin * 2));
    state.board = {
      x: (state.canvasWidth - size) / 2,
      y: (state.canvasHeight - size) / 2,
      size,
      cell: size / level.size
    };
    return state.board;
  }

  function logicalPoint(x, y) {
    const board = boardRect();
    return {
      x: board.x + x * board.cell,
      y: board.y + y * board.cell
    };
  }

  function cellFromPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const board = boardRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const x = Math.floor((px - board.x) / board.cell);
    const y = Math.floor((py - board.y) / board.cell);
    const level = getLevel();
    if (x < 0 || y < 0 || x >= level.size || y >= level.size) return null;
    return { x, y };
  }

  function draw(time) {
    fitCanvas();
    const w = state.canvasWidth;
    const h = state.canvasHeight;
    ctx.clearRect(0, 0, w, h);
    drawBackdrop(w, h);
    drawBoardBase();
    drawTiles(time);
    drawBeams(time);
    drawSources(time);
    drawTargets(time);
    drawSelection(time);
    if (state.solved) drawSolved(time);
  }

  function drawBackdrop(w, h) {
    const bg = assets.background;
    ctx.fillStyle = "#080b0c";
    ctx.fillRect(0, 0, w, h);
    if (bg.complete && bg.naturalWidth) {
      drawCoverImage(bg, 0, 0, w, h);
      ctx.fillStyle = "rgba(4, 7, 8, 0.42)";
      ctx.fillRect(0, 0, w, h);
    }
    const gradient = ctx.createRadialGradient(w * 0.5, h * 0.48, 40, w * 0.5, h * 0.48, Math.max(w, h) * 0.58);
    gradient.addColorStop(0, "rgba(102, 232, 255, 0.16)");
    gradient.addColorStop(0.58, "rgba(255, 199, 90, 0.05)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.38)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  function drawCoverImage(image, x, y, w, h) {
    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const iw = image.naturalWidth * scale;
    const ih = image.naturalHeight * scale;
    ctx.drawImage(image, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }

  function drawBoardBase() {
    const level = getLevel();
    const board = boardRect();
    ctx.save();
    roundRect(board.x - 10, board.y - 10, board.size + 20, board.size + 20, 8);
    ctx.fillStyle = "rgba(8, 10, 10, 0.66)";
    ctx.fill();
    ctx.strokeStyle = "rgba(216, 183, 108, 0.42)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const skin = assets.uiSkin;
    if (skin.complete && skin.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = 0.04;
      drawCoverImage(skin, board.x - 26, board.y - 26, board.size + 52, board.size + 52);
      ctx.restore();
    }

    ctx.save();
    roundRect(board.x, board.y, board.size, board.size, 6);
    ctx.clip();
    const bg = assets.background;
    if (bg.complete && bg.naturalWidth) {
      ctx.globalAlpha = 0.18;
      drawCoverImage(bg, board.x, board.y, board.size, board.size);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "rgba(7, 10, 11, 0.62)";
    ctx.fillRect(board.x, board.y, board.size, board.size);

    for (let y = 0; y < level.size; y += 1) {
      for (let x = 0; x < level.size; x += 1) {
        const px = board.x + x * board.cell;
        const py = board.y + y * board.cell;
        ctx.fillStyle = (x + y) % 2 === 0 ? "rgba(255, 255, 255, 0.035)" : "rgba(102, 232, 255, 0.025)";
        ctx.fillRect(px, py, board.cell, board.cell);
      }
    }

    ctx.strokeStyle = "rgba(216, 183, 108, 0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= level.size; i += 1) {
      const p = board.x + i * board.cell;
      ctx.beginPath();
      ctx.moveTo(p, board.y);
      ctx.lineTo(p, board.y + board.size);
      ctx.stroke();
      const q = board.y + i * board.cell;
      ctx.beginPath();
      ctx.moveTo(board.x, q);
      ctx.lineTo(board.x + board.size, q);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  function drawTiles(time) {
    const board = boardRect();
    flatTiles().forEach((tile) => {
      const x = board.x + tile.x * board.cell;
      const y = board.y + tile.y * board.cell;
      const pad = board.cell * 0.12;
      const size = board.cell - pad * 2;
      const pulse = Math.sin(time * 0.002 + tile.x * 0.8 + tile.y) * 0.04 + 0.96;

      ctx.save();
      roundRect(x + pad, y + pad, size, size, 7);
      if (tile.type === "wall") {
        const wall = ctx.createLinearGradient(x, y, x + size, y + size);
        wall.addColorStop(0, "#161a1c");
        wall.addColorStop(1, "#050607");
        ctx.fillStyle = wall;
        ctx.fill();
        drawGlyph(4, x + pad, y + pad, size, size, 0.34);
        ctx.strokeStyle = "rgba(216, 183, 108, 0.28)";
        ctx.stroke();
        ctx.restore();
        return;
      }

      const fill = ctx.createLinearGradient(x, y, x + size, y + size);
      fill.addColorStop(0, "rgba(30, 44, 43, 0.92)");
      fill.addColorStop(0.5, "rgba(18, 23, 24, 0.96)");
      fill.addColorStop(1, "rgba(60, 45, 31, 0.9)");
      ctx.fillStyle = fill;
      ctx.fill();
      drawGlyph(glyphIndex(tile.type), x + pad, y + pad, size, size, 0.24);
      ctx.strokeStyle = "rgba(216, 183, 108, 0.58)";
      ctx.lineWidth = Math.max(1, board.cell * 0.022);
      ctx.stroke();

      const center = { x: x + board.cell / 2, y: y + board.cell / 2 };
      const connectors = connectorsFor(tile);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(255, 199, 90, 0.35)";
      ctx.shadowBlur = board.cell * 0.13;
      ctx.strokeStyle = tile.type === "split" ? "rgba(102, 232, 255, 0.92)" : "rgba(255, 219, 142, 0.95)";
      ctx.lineWidth = Math.max(5, board.cell * 0.105) * pulse;
      connectors.forEach((dir) => {
        const end = connectorPoint(center, dir, board.cell * 0.31);
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;
      ctx.fillStyle = tile.type === "split" ? "#66e8ff" : "#ffe1a0";
      ctx.beginPath();
      ctx.arc(center.x, center.y, Math.max(4, board.cell * 0.07), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function glyphIndex(type) {
    return { line: 1, corner: 2, split: 3, wall: 4, cross: 10 }[type] ?? 0;
  }

  function drawGlyph(index, x, y, w, h, alpha) {
    const glyphs = assets.glyphs;
    if (!glyphs.complete || !glyphs.naturalWidth) return;
    const cell = glyphs.naturalWidth / 4;
    const sx = (index % 4) * cell;
    const sy = Math.floor(index / 4) * cell;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(glyphs, sx, sy, cell, cell, x, y, w, h);
    ctx.restore();
  }

  function connectorPoint(center, dir, length) {
    return {
      x: center.x + VEC[dir].x * length,
      y: center.y + VEC[dir].y * length
    };
  }

  function drawBeams(time) {
    const board = boardRect();
    const dash = Math.max(10, board.cell * 0.18);
    state.beams.segments.forEach((segment, index) => {
      const from = logicalPoint(segment.x1, segment.y1);
      const to = logicalPoint(segment.x2, segment.y2);
      const color = COLORS[segment.color];
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = board.cell * 0.22;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.34;
      ctx.lineWidth = Math.max(12, board.cell * 0.16);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      ctx.globalAlpha = 0.9;
      ctx.lineWidth = Math.max(4, board.cell * 0.055);
      ctx.setLineDash([dash, dash * 0.72]);
      ctx.lineDashOffset = -time * 0.045 - index * 7;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
      ctx.lineWidth = Math.max(1.5, board.cell * 0.018);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawTargets(time) {
    const board = boardRect();
    const level = getLevel();
    level.targets.forEach((target, index) => {
      const center = logicalPoint(target.x + 0.5, target.y + 0.5);
      const active = state.beams.activeTargets.has(index);
      const color = COLORS[target.color];
      const radius = board.cell * (active ? 0.26 + Math.sin(time * 0.006) * 0.018 : 0.22);
      drawGlyph(targetGlyphIndex(target.color), center.x - radius * 1.25, center.y - radius * 1.25, radius * 2.5, radius * 2.5, active ? 0.5 : 0.28);

      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(Math.PI / 4);
      ctx.shadowColor = color;
      ctx.shadowBlur = active ? board.cell * 0.38 : board.cell * 0.1;
      ctx.fillStyle = active ? color : "rgba(209, 206, 190, 0.5)";
      ctx.strokeStyle = active ? "rgba(255, 255, 255, 0.75)" : "rgba(216, 183, 108, 0.36)";
      ctx.lineWidth = Math.max(1, board.cell * 0.024);
      roundRect(-radius, -radius, radius * 2, radius * 2, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }

  function targetGlyphIndex(color) {
    return { cyan: 5, amber: 6, violet: 7, green: 11 }[color] ?? 5;
  }

  function drawSources(time) {
    const board = boardRect();
    getLevel().sources.forEach((source) => {
      const center = logicalPoint(source.x + 0.5, source.y + 0.5);
      const color = COLORS[source.color];
      const pulse = 0.9 + Math.sin(time * 0.006 + source.x + source.y) * 0.08;
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(source.dir * (Math.PI / 2));
      ctx.shadowColor = color;
      ctx.shadowBlur = board.cell * 0.32;
      ctx.fillStyle = color;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
      ctx.lineWidth = Math.max(1, board.cell * 0.025);
      ctx.beginPath();
      ctx.moveTo(board.cell * 0.2 * pulse, 0);
      ctx.lineTo(-board.cell * 0.18, -board.cell * 0.16);
      ctx.lineTo(-board.cell * 0.12, 0);
      ctx.lineTo(-board.cell * 0.18, board.cell * 0.16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawSelection(time) {
    const board = boardRect();
    const tile = state.grid[state.selected.y]?.[state.selected.x];
    if (!tile || tile.type === "wall") return;
    const x = board.x + state.selected.x * board.cell;
    const y = board.y + state.selected.y * board.cell;
    const inset = board.cell * 0.07 + Math.sin(time * 0.005) * 1.5;
    ctx.save();
    ctx.strokeStyle = "rgba(102, 232, 255, 0.9)";
    ctx.lineWidth = Math.max(2, board.cell * 0.03);
    ctx.shadowColor = "rgba(102, 232, 255, 0.55)";
    ctx.shadowBlur = board.cell * 0.18;
    roundRect(x + inset, y + inset, board.cell - inset * 2, board.cell - inset * 2, 7);
    ctx.stroke();
    ctx.restore();
  }

  function drawSolved(time) {
    const board = boardRect();
    const y = board.y + board.size * 0.045;
    const w = Math.min(board.size * 0.54, 310);
    const x = board.x + (board.size - w) / 2;
    const h = Math.max(34, board.cell * 0.42);
    ctx.save();
    ctx.globalAlpha = 0.86 + Math.sin(time * 0.007) * 0.05;
    roundRect(x, y, w, h, 8);
    ctx.fillStyle = "rgba(6, 18, 20, 0.84)";
    ctx.fill();
    ctx.strokeStyle = "rgba(102, 232, 255, 0.72)";
    ctx.stroke();
    ctx.fillStyle = "#f3efe3";
    ctx.font = `900 ${Math.max(16, h * 0.42)}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("UNLOCKED", x + w / 2, y + h / 2);
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function moveSelection(dx, dy) {
    const level = getLevel();
    let x = state.selected.x;
    let y = state.selected.y;
    for (let step = 0; step < level.size; step += 1) {
      x = (x + dx + level.size) % level.size;
      y = (y + dy + level.size) % level.size;
      const tile = state.grid[y][x];
      if (tile && tile.type !== "wall") {
        state.selected = { x, y };
        draw(performance.now());
        return;
      }
    }
  }

  canvas.addEventListener("pointerdown", (event) => {
    const cell = cellFromPointer(event);
    if (!cell) return;
    primeAudio();
    canvas.focus();
    rotateCell(cell.x, cell.y, event.shiftKey || event.button === 2 ? -1 : 1);
  });

  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  canvas.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      primeAudio();
      moveSelection(0, -1);
      event.preventDefault();
    } else if (event.key === "ArrowDown") {
      primeAudio();
      moveSelection(0, 1);
      event.preventDefault();
    } else if (event.key === "ArrowLeft") {
      primeAudio();
      moveSelection(-1, 0);
      event.preventDefault();
    } else if (event.key === "ArrowRight") {
      primeAudio();
      moveSelection(1, 0);
      event.preventDefault();
    } else if (event.key === " " || event.key === "Enter") {
      primeAudio();
      rotateCell(state.selected.x, state.selected.y, event.shiftKey ? -1 : 1);
      event.preventDefault();
    } else if (event.key.toLowerCase() === "z") {
      primeAudio();
      undo();
      event.preventDefault();
    } else if (event.key.toLowerCase() === "r") {
      primeAudio();
      resetLevel();
      event.preventDefault();
    } else if (event.key.toLowerCase() === "n" && state.solved) {
      primeAudio();
      nextLevel();
      event.preventDefault();
    }
  });

  nodes.undo.addEventListener("click", () => {
    primeAudio();
    playSound("click");
    undo();
  });
  nodes.reset.addEventListener("click", () => {
    primeAudio();
    playSound("click");
    resetLevel();
  });
  nodes.next.addEventListener("click", () => {
    primeAudio();
    playSound("click");
    nextLevel();
  });
  nodes.audio?.addEventListener("click", () => {
    setAudioEnabled(!audio.enabled);
    playSound("click");
  });
  window.addEventListener("resize", () => {
    state.board = null;
    draw(performance.now());
  });

  function animate(time) {
    draw(time);
    requestAnimationFrame(animate);
  }

  window.LumenLock = {
    loadLevel,
    resetLevel,
    rotateCell,
    nextLevel,
    getSnapshot: () => ({
      levelIndex: state.levelIndex,
      levelId: getLevel().id,
      moves: state.moves,
      solved: state.solved,
      targetsLit: state.beams.activeTargets.size,
      targetsTotal: getLevel().targets.length,
      segments: state.beams.segments.length
    })
  };

  setupAudio();
  loadLevel(0);
  requestAnimationFrame(animate);
})();
