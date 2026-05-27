(() => {
  "use strict";

  const BOARD_SIZE = 8;
  const PIECE_TYPES = ["berry", "citrus", "mint", "plum", "ruby", "cocoa"];
  const ASSET_PATHS = {
    berry: "assets/candies/berry-glaze.svg",
    citrus: "assets/candies/citrus-star.svg",
    mint: "assets/candies/mint-drop.svg",
    plum: "assets/candies/plum-moon.svg",
    ruby: "assets/candies/ruby-heart.svg",
    cocoa: "assets/candies/cocoa-cube.svg",
    prism: "assets/candies/prism-swirl.svg"
  };

  const PIECE_COLORS = {
    berry: "#ec3f95",
    citrus: "#ffad1f",
    mint: "#28c972",
    plum: "#8b4cf4",
    ruby: "#ef333b",
    cocoa: "#8b431d",
    prism: "#2bb9f0"
  };

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const ui = {
    level: document.getElementById("levelValue"),
    moves: document.getElementById("movesValue"),
    score: document.getElementById("scoreValue"),
    target: document.getElementById("targetValue"),
    best: document.getElementById("bestValue"),
    combo: document.getElementById("comboValue"),
    progress: document.getElementById("progressFill"),
    toast: document.getElementById("toast"),
    pause: document.getElementById("pauseButton"),
    hammer: document.getElementById("hammerButton"),
    hammerCount: document.getElementById("hammerCount"),
    shuffle: document.getElementById("shuffleButton"),
    shuffleCount: document.getElementById("shuffleCount"),
    modal: document.getElementById("modalLayer"),
    modalTitle: document.getElementById("modalTitle"),
    modalCopy: document.getElementById("modalCopy"),
    primary: document.getElementById("primaryAction"),
    secondary: document.getElementById("secondaryAction")
  };

  let dpr = 1;
  let lastId = 1;
  let toastTimer = 0;
  let audioContext = null;

  const metrics = {
    width: 960,
    height: 960,
    originX: 80,
    originY: 80,
    boardPx: 800,
    tile: 100
  };

  const images = {};
  const state = {
    board: [],
    phase: "boot",
    selected: null,
    pointerStart: null,
    dragUsed: false,
    boosterMode: null,
    level: 1,
    moves: 25,
    score: 0,
    target: 12000,
    best: Number(localStorage.getItem("bonbon-blitz-best") || 0),
    combo: 0,
    hammer: 3,
    shuffle: 2,
    particles: [],
    floaters: [],
    flashes: [],
    shake: 0
  };

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("de-DE").format(value);
  }

  function randomOf(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function shuffleArray(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function preloadAssets() {
    return Promise.all(
      Object.entries(ASSET_PATHS).map(([key, src]) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          images[key] = image;
          resolve();
        };
        image.onerror = () => reject(new Error(`Asset konnte nicht geladen werden: ${src}`));
        image.src = src;
      }))
    );
  }

  function computeMetrics() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    metrics.width = Math.max(320, rect.width);
    metrics.height = Math.max(320, rect.height);
    canvas.width = Math.floor(metrics.width * dpr);
    canvas.height = Math.floor(metrics.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const margin = metrics.width < 520 ? 18 : 34;
    metrics.boardPx = Math.min(metrics.width, metrics.height) - margin * 2;
    metrics.tile = metrics.boardPx / BOARD_SIZE;
    metrics.originX = (metrics.width - metrics.boardPx) / 2;
    metrics.originY = (metrics.height - metrics.boardPx) / 2;
    syncTileTargets(true);
  }

  function tileCenter(row, col) {
    return {
      x: metrics.originX + col * metrics.tile + metrics.tile / 2,
      y: metrics.originY + row * metrics.tile + metrics.tile / 2
    };
  }

  function makeTile(type, row, col, spawnOffset = 0) {
    const target = tileCenter(row, col);
    return {
      id: lastId += 1,
      type,
      special: null,
      row,
      col,
      x: target.x,
      y: target.y - spawnOffset * metrics.tile,
      targetX: target.x,
      targetY: target.y,
      scale: 1,
      alpha: 1,
      rot: 0,
      wobble: Math.random() * Math.PI * 2
    };
  }

  function syncTileTargets(snap = false) {
    forEachTile((tile) => {
      const target = tileCenter(tile.row, tile.col);
      tile.targetX = target.x;
      tile.targetY = target.y;
      if (snap) {
        tile.x = target.x;
        tile.y = target.y;
      }
    });
  }

  function forEachTile(callback) {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const tile = state.board[row]?.[col];
        if (tile) {
          callback(tile);
        }
      }
    }
  }

  function allTiles() {
    const tiles = [];
    forEachTile((tile) => tiles.push(tile));
    return tiles;
  }

  function formsMatchAt(board, type, row, col) {
    const left1 = board[row]?.[col - 1];
    const left2 = board[row]?.[col - 2];
    const up1 = board[row - 1]?.[col];
    const up2 = board[row - 2]?.[col];
    return (
      (left1 && left2 && left1.type === type && left2.type === type && !left1.special && !left2.special) ||
      (up1 && up2 && up1.type === type && up2.type === type && !up1.special && !up2.special)
    );
  }

  function chooseCleanType(board, row, col) {
    for (const type of shuffleArray(PIECE_TYPES)) {
      if (!formsMatchAt(board, type, row, col)) {
        return type;
      }
    }
    return randomOf(PIECE_TYPES);
  }

  function buildBoard() {
    let board = [];
    let guard = 0;
    do {
      guard += 1;
      board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
      for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
          const type = chooseCleanType(board, row, col);
          board[row][col] = makeTile(type, row, col);
        }
      }
      state.board = board;
    } while (!hasAvailableMove(board) && guard < 40);
    syncTileTargets(true);
  }

  function matchKey(tile) {
    if (!tile || tile.special === "prism") {
      return "";
    }
    return tile.type;
  }

  function findMatches(board = state.board) {
    const groups = [];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      let col = 0;
      while (col < BOARD_SIZE) {
        const key = matchKey(board[row][col]);
        if (!key) {
          col += 1;
          continue;
        }
        const tiles = [];
        let cursor = col;
        while (cursor < BOARD_SIZE && matchKey(board[row][cursor]) === key) {
          tiles.push(board[row][cursor]);
          cursor += 1;
        }
        if (tiles.length >= 3) {
          groups.push({ direction: "row", tiles });
        }
        col = cursor;
      }
    }

    for (let col = 0; col < BOARD_SIZE; col += 1) {
      let row = 0;
      while (row < BOARD_SIZE) {
        const key = matchKey(board[row][col]);
        if (!key) {
          row += 1;
          continue;
        }
        const tiles = [];
        let cursor = row;
        while (cursor < BOARD_SIZE && matchKey(board[cursor][col]) === key) {
          tiles.push(board[cursor][col]);
          cursor += 1;
        }
        if (tiles.length >= 3) {
          groups.push({ direction: "col", tiles });
        }
        row = cursor;
      }
    }

    return groups;
  }

  function hasAvailableMove(board = state.board) {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const here = board[row][col];
        const neighbors = [board[row]?.[col + 1], board[row + 1]?.[col]];
        for (const next of neighbors) {
          if (!here || !next) {
            continue;
          }
          board[here.row][here.col] = next;
          board[next.row][next.col] = here;
          const hasMatch = findMatches(board).length > 0;
          board[here.row][here.col] = here;
          board[next.row][next.col] = next;
          if (hasMatch) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function startNewGame() {
    state.level = 1;
    state.score = 0;
    state.hammer = 3;
    state.shuffle = 2;
    startLevel();
  }

  function startLevel() {
    state.moves = Math.max(16, 25 - Math.floor((state.level - 1) * 0.65));
    state.target = Math.round(12000 * Math.pow(1.42, state.level - 1));
    state.combo = 0;
    state.selected = null;
    state.boosterMode = null;
    state.phase = "ready";
    state.particles.length = 0;
    state.floaters.length = 0;
    state.flashes.length = 0;
    buildBoard();
    updateUI();
    hideModal();
    showToast(`Level ${state.level}`);
  }

  function updateUI() {
    state.best = Math.max(state.best, state.score);
    localStorage.setItem("bonbon-blitz-best", String(state.best));
    ui.level.textContent = state.level;
    ui.moves.textContent = state.moves;
    ui.score.textContent = formatNumber(state.score);
    ui.target.textContent = formatNumber(state.target);
    ui.best.textContent = formatNumber(state.best);
    ui.combo.textContent = `x${Math.max(1, state.combo || 1)}`;
    ui.hammerCount.textContent = state.hammer;
    ui.shuffleCount.textContent = state.shuffle;
    ui.hammer.classList.toggle("is-active", state.boosterMode === "hammer");
    ui.shuffle.classList.toggle("is-active", state.boosterMode === "shuffle");
    const percent = clamp((state.score / state.target) * 100, 0, 100);
    ui.progress.style.width = `${percent}%`;
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    ui.toast.textContent = message;
    ui.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => ui.toast.classList.remove("is-visible"), 1250);
  }

  function showModal(kind) {
    state.phase = "modal";
    ui.modal.hidden = false;
    if (kind === "win") {
      ui.modalTitle.textContent = `Level ${state.level} geschafft`;
      ui.modalCopy.textContent = `${formatNumber(state.score)} Punkte`;
      ui.primary.textContent = "Weiter";
      ui.secondary.textContent = "Neu";
      ui.primary.onclick = () => {
        state.level += 1;
        if (state.level % 2 === 0) {
          state.hammer += 1;
        }
        if (state.level % 3 === 0) {
          state.shuffle += 1;
        }
        startLevel();
      };
      ui.secondary.onclick = startNewGame;
    } else if (kind === "lose") {
      ui.modalTitle.textContent = "Keine Zuege";
      ui.modalCopy.textContent = `${formatNumber(state.score)} Punkte`;
      ui.primary.textContent = "Nochmal";
      ui.secondary.textContent = "Neu";
      ui.primary.onclick = startLevel;
      ui.secondary.onclick = startNewGame;
    } else {
      ui.modalTitle.textContent = "Pause";
      ui.modalCopy.textContent = `${formatNumber(state.score)} Punkte`;
      ui.primary.textContent = "Weiter";
      ui.secondary.textContent = "Neu";
      ui.primary.onclick = () => {
        hideModal();
        state.phase = "ready";
      };
      ui.secondary.onclick = startNewGame;
    }
  }

  function hideModal() {
    ui.modal.hidden = true;
  }

  function getTileFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor((x - metrics.originX) / metrics.tile);
    const row = Math.floor((y - metrics.originY) / metrics.tile);
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return null;
    }
    return state.board[row][col];
  }

  function getNeighbor(tile, dx, dy) {
    if (!tile) {
      return null;
    }
    const row = tile.row + dy;
    const col = tile.col + dx;
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return null;
    }
    return state.board[row][col];
  }

  function isAdjacent(a, b) {
    return a && b && Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
  }

  function selectTile(tile) {
    state.selected = tile;
    state.boosterMode = null;
    tile.scale = 1.08;
    updateUI();
    playTone(540, 0.035, "sine", 0.025);
  }

  async function attemptSwap(a, b) {
    if (state.phase !== "ready" || !isAdjacent(a, b)) {
      return;
    }

    state.phase = "swapping";
    state.selected = null;
    state.boosterMode = null;
    updateUI();
    swapTiles(a, b);
    playTone(420, 0.045, "triangle", 0.035);
    await wait(150);

    const specialSwap = Boolean(a.special || b.special);
    const matches = findMatches();

    if (!specialSwap && matches.length === 0) {
      swapTiles(a, b);
      state.shake = 1;
      playTone(150, 0.08, "sawtooth", 0.02);
      showToast("Knapp daneben");
      await wait(190);
      state.phase = "ready";
      updateUI();
      return;
    }

    state.moves -= 1;
    state.combo = 0;
    updateUI();

    if (specialSwap) {
      await resolveSpecialSwap(a, b);
    } else {
      await resolveMatches(matches, { a, b });
    }
  }

  function swapTiles(a, b) {
    state.board[a.row][a.col] = b;
    state.board[b.row][b.col] = a;
    const row = a.row;
    const col = a.col;
    a.row = b.row;
    a.col = b.col;
    b.row = row;
    b.col = col;
    syncTileTargets(false);
  }

  function collectTiles(groups) {
    const set = new Set();
    for (const group of groups) {
      for (const tile of group.tiles) {
        set.add(tile);
      }
    }
    return set;
  }

  function chooseSpecial(groups, context) {
    const clearSet = collectTiles(groups);
    const membership = new Map();
    for (const group of groups) {
      for (const tile of group.tiles) {
        membership.set(tile, (membership.get(tile) || 0) + 1);
      }
    }

    const overlap = [...membership.entries()].find(([, count]) => count > 1)?.[0];
    const five = groups.find((group) => group.tiles.length >= 5);
    const four = groups.find((group) => group.tiles.length === 4);
    const special = five ? "prism" : overlap ? "bomb" : four ? four.direction : null;

    if (!special) {
      return null;
    }

    let tile = null;
    if (context?.a && clearSet.has(context.a)) {
      tile = context.a;
    } else if (context?.b && clearSet.has(context.b)) {
      tile = context.b;
    } else if (overlap) {
      tile = overlap;
    } else {
      tile = (five || four).tiles[Math.floor((five || four).tiles.length / 2)];
    }

    return tile ? { tile, special } : null;
  }

  async function resolveMatches(groups, context = null) {
    state.phase = "resolving";
    state.combo += 1;
    let clearSet = collectTiles(groups);
    const special = chooseSpecial(groups, context);

    if (special && clearSet.has(special.tile)) {
      clearSet.delete(special.tile);
      special.tile.special = special.special;
      special.tile.scale = 1.32;
      special.tile.rot += special.special === "prism" ? 0.32 : 0.16;
      spawnBurst(special.tile, 16, "#ffffff");
      showToast(special.special === "prism" ? "Prisma" : special.special === "bomb" ? "Bonbon-Bombe" : "Streifen");
    }

    clearSet = expandSpecialClears(clearSet);
    await clearTilesAndCascade(clearSet);
  }

  async function resolveSpecialSwap(a, b) {
    state.phase = "resolving";
    state.combo += 1;
    let clearSet = new Set();

    if (a.special === "prism" || b.special === "prism") {
      const prism = a.special === "prism" ? a : b;
      const other = prism === a ? b : a;
      clearSet.add(prism);
      if (other.special === "prism") {
        forEachTile((tile) => clearSet.add(tile));
      } else {
        forEachTile((tile) => {
          if (tile.type === other.type) {
            clearSet.add(tile);
          }
        });
      }
      showToast("Prisma-Kette");
      playTone(780, 0.11, "sine", 0.045);
    } else {
      if (a.special) {
        clearSet.add(a);
      }
      if (b.special) {
        clearSet.add(b);
      }
      showToast("Booster-Kette");
      playTone(640, 0.08, "triangle", 0.04);
    }

    clearSet = expandSpecialClears(clearSet);
    await clearTilesAndCascade(clearSet);
  }

  function expandSpecialClears(seed) {
    const clearSet = new Set(seed);
    const queue = [...seed];
    const visited = new Set();

    while (queue.length) {
      const tile = queue.shift();
      if (!tile || visited.has(tile.id)) {
        continue;
      }
      visited.add(tile.id);

      const add = (candidate) => {
        if (candidate && !clearSet.has(candidate)) {
          clearSet.add(candidate);
          if (candidate.special) {
            queue.push(candidate);
          }
        }
      };

      if (tile.special === "row") {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
          add(state.board[tile.row][col]);
        }
        state.flashes.push({ mode: "row", row: tile.row, life: 1 });
      } else if (tile.special === "col") {
        for (let row = 0; row < BOARD_SIZE; row += 1) {
          add(state.board[row][tile.col]);
        }
        state.flashes.push({ mode: "col", col: tile.col, life: 1 });
      } else if (tile.special === "bomb") {
        for (let row = tile.row - 1; row <= tile.row + 1; row += 1) {
          for (let col = tile.col - 1; col <= tile.col + 1; col += 1) {
            if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
              add(state.board[row][col]);
            }
          }
        }
      } else if (tile.special === "prism") {
        forEachTile((candidate) => {
          if (candidate.type === tile.type || candidate.special === "prism") {
            add(candidate);
          }
        });
      }
    }

    return clearSet;
  }

  async function clearTilesAndCascade(clearSet) {
    if (!clearSet.size) {
      state.phase = "ready";
      return;
    }

    const gained = Math.round(clearSet.size * 130 * Math.max(1, state.combo) * (1 + state.level * 0.04));
    state.score += gained;
    state.best = Math.max(state.best, state.score);
    const center = averageTilePosition(clearSet);
    state.floaters.push({ text: `+${formatNumber(gained)}`, x: center.x, y: center.y, life: 1 });
    playTone(500 + Math.min(5, state.combo) * 70, 0.08, "sine", 0.04);

    for (const tile of clearSet) {
      if (state.board[tile.row]?.[tile.col] === tile) {
        spawnBurst(tile, tile.special ? 20 : 11, PIECE_COLORS[tile.type] || "#ffffff");
        state.board[tile.row][tile.col] = null;
      }
    }

    updateUI();
    await wait(160);
    collapseColumns();
    await wait(280);

    const nextMatches = findMatches();
    if (nextMatches.length) {
      await wait(90);
      await resolveMatches(nextMatches);
      return;
    }

    await finishTurn();
  }

  function averageTilePosition(clearSet) {
    let x = 0;
    let y = 0;
    for (const tile of clearSet) {
      x += tile.x;
      y += tile.y;
    }
    return { x: x / clearSet.size, y: y / clearSet.size };
  }

  function collapseColumns() {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      let writeRow = BOARD_SIZE - 1;
      for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
        const tile = state.board[row][col];
        if (!tile) {
          continue;
        }
        if (row !== writeRow) {
          state.board[writeRow][col] = tile;
          state.board[row][col] = null;
          tile.row = writeRow;
          tile.col = col;
        }
        writeRow -= 1;
      }

      for (let row = writeRow; row >= 0; row -= 1) {
        const type = randomOf(PIECE_TYPES);
        const spawnDistance = writeRow - row + 2;
        state.board[row][col] = makeTile(type, row, col, spawnDistance);
      }
    }
    syncTileTargets(false);
  }

  async function finishTurn() {
    state.combo = 0;
    updateUI();

    if (state.score >= state.target) {
      playTone(880, 0.18, "sine", 0.04);
      showModal("win");
      return;
    }

    if (state.moves <= 0) {
      showModal("lose");
      return;
    }

    if (!hasAvailableMove()) {
      showToast("Frisch gemischt");
      await reshuffleBoard(false);
    }

    state.phase = "ready";
    updateUI();
  }

  async function useHammer(tile) {
    if (state.phase !== "ready" || !tile || state.hammer <= 0) {
      return;
    }
    state.phase = "resolving";
    state.hammer -= 1;
    state.boosterMode = null;
    state.selected = null;
    updateUI();
    playTone(210, 0.06, "square", 0.04);
    await clearTilesAndCascade(expandSpecialClears(new Set([tile])));
  }

  async function reshuffleBoard(spendBooster = true) {
    if (state.phase !== "ready" && spendBooster) {
      return;
    }
    if (spendBooster && state.shuffle <= 0) {
      showToast("Leer");
      return;
    }
    if (spendBooster) {
      state.shuffle -= 1;
    }
    state.phase = "shuffling";
    state.selected = null;
    state.boosterMode = null;
    forEachTile((tile) => {
      tile.rot += (Math.random() - 0.5) * 1.8;
      tile.scale = 0.82;
    });
    updateUI();
    playTone(330, 0.08, "triangle", 0.035);
    await wait(180);
    buildBoard();
    await wait(120);
    state.phase = "ready";
    updateUI();
    showToast("Gemischt");
  }

  function toggleBooster(mode) {
    if (state.phase !== "ready") {
      return;
    }
    const amount = mode === "hammer" ? state.hammer : state.shuffle;
    if (amount <= 0) {
      showToast("Leer");
      return;
    }
    if (mode === "shuffle") {
      reshuffleBoard(true);
      return;
    }
    state.boosterMode = state.boosterMode === mode ? null : mode;
    state.selected = null;
    updateUI();
  }

  function spawnBurst(tile, count, color) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5.4;
      state.particles.push({
        x: tile.x,
        y: tile.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: metrics.tile * (0.035 + Math.random() * 0.045),
        color,
        life: 1,
        decay: 0.018 + Math.random() * 0.018
      });
    }
  }

  function playTone(freq, duration, type = "sine", gain = 0.03) {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      const oscillator = audioContext.createOscillator();
      const amp = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.value = freq;
      amp.gain.setValueAtTime(0, audioContext.currentTime);
      amp.gain.linearRampToValueAtTime(gain, audioContext.currentTime + 0.005);
      amp.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
      oscillator.connect(amp);
      amp.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration + 0.015);
    } catch {
      audioContext = null;
    }
  }

  function handlePointerDown(event) {
    if (state.phase !== "ready") {
      return;
    }
    if (audioContext?.state === "suspended") {
      audioContext.resume();
    }
    const tile = getTileFromEvent(event);
    if (!tile) {
      state.selected = null;
      return;
    }
    canvas.setPointerCapture?.(event.pointerId);
    canvas.focus({ preventScroll: true });
    state.pointerStart = { tile, x: event.clientX, y: event.clientY };
    state.dragUsed = false;

    if (state.boosterMode === "hammer") {
      useHammer(tile);
      return;
    }

    if (!state.selected) {
      selectTile(tile);
      return;
    }

    if (state.selected === tile) {
      state.selected = null;
      updateUI();
      return;
    }

    if (isAdjacent(state.selected, tile)) {
      attemptSwap(state.selected, tile);
    } else {
      selectTile(tile);
    }
  }

  function handlePointerMove(event) {
    if (state.phase !== "ready" || !state.pointerStart || state.dragUsed || state.selected) {
      return;
    }
    const dx = event.clientX - state.pointerStart.x;
    const dy = event.clientY - state.pointerStart.y;
    const minDrag = metrics.tile * 0.38;
    if (Math.hypot(dx, dy) < minDrag) {
      return;
    }

    const dirX = Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0;
    const dirY = Math.abs(dy) >= Math.abs(dx) ? Math.sign(dy) : 0;
    const target = getNeighbor(state.pointerStart.tile, dirX, dirY);
    state.dragUsed = true;
    if (target) {
      attemptSwap(state.pointerStart.tile, target);
    }
  }

  function handlePointerUp() {
    state.pointerStart = null;
    state.dragUsed = false;
  }

  function handleKeyDown(event) {
    if (state.phase !== "ready" || !state.selected) {
      return;
    }
    const arrows = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    };
    const direction = arrows[event.key];
    if (!direction) {
      return;
    }
    event.preventDefault();
    const target = getNeighbor(state.selected, direction[0], direction[1]);
    if (target) {
      attemptSwap(state.selected, target);
    }
  }

  function roundRectPath(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawBoardBase() {
    const shakeX = state.shake > 0 ? Math.sin(performance.now() * 0.055) * state.shake * 10 : 0;
    if (state.shake > 0) {
      state.shake *= 0.88;
      if (state.shake < 0.02) {
        state.shake = 0;
      }
    }

    ctx.save();
    ctx.translate(shakeX, 0);
    const pad = metrics.tile * 0.08;
    const x = metrics.originX - pad;
    const y = metrics.originY - pad;
    const size = metrics.boardPx + pad * 2;
    roundRectPath(x, y, size, size, metrics.tile * 0.18);
    const bg = ctx.createLinearGradient(x, y, x + size, y + size);
    bg.addColorStop(0, "rgba(255,255,255,0.76)");
    bg.addColorStop(0.45, "rgba(255,222,241,0.62)");
    bg.addColorStop(1, "rgba(222,247,255,0.7)");
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.74)";
    ctx.stroke();

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const cellX = metrics.originX + col * metrics.tile + metrics.tile * 0.055;
        const cellY = metrics.originY + row * metrics.tile + metrics.tile * 0.055;
        const cellSize = metrics.tile * 0.89;
        roundRectPath(cellX, cellY, cellSize, cellSize, metrics.tile * 0.14);
        ctx.fillStyle = (row + col) % 2 === 0 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.24)";
        ctx.fill();
      }
    }

    for (const flash of state.flashes) {
      flash.life -= 0.035;
      ctx.save();
      ctx.globalAlpha = Math.max(0, flash.life);
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      if (flash.mode === "row") {
        ctx.fillRect(metrics.originX, metrics.originY + flash.row * metrics.tile + metrics.tile * 0.38, metrics.boardPx, metrics.tile * 0.24);
      } else {
        ctx.fillRect(metrics.originX + flash.col * metrics.tile + metrics.tile * 0.38, metrics.originY, metrics.tile * 0.24, metrics.boardPx);
      }
      ctx.restore();
    }
    state.flashes = state.flashes.filter((flash) => flash.life > 0);
  }

  function drawTile(tile) {
    const targetScale = tile === state.selected ? 1.09 : 1;
    tile.x += (tile.targetX - tile.x) * 0.22;
    tile.y += (tile.targetY - tile.y) * 0.22;
    tile.scale += (targetScale - tile.scale) * 0.16;
    tile.rot *= 0.92;

    const size = metrics.tile * 0.82 * tile.scale;
    const image = tile.special === "prism" ? images.prism : images[tile.type];

    ctx.save();
    ctx.translate(tile.x, tile.y);
    ctx.rotate(tile.rot);
    ctx.globalAlpha = tile.alpha;

    if (tile === state.selected) {
      ctx.beginPath();
      ctx.arc(0, 0, metrics.tile * 0.48, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.74)";
      ctx.fill();
      ctx.lineWidth = Math.max(3, metrics.tile * 0.035);
      ctx.strokeStyle = "#24b9ed";
      ctx.stroke();
    }

    ctx.shadowColor = "rgba(43, 17, 62, 0.28)";
    ctx.shadowBlur = metrics.tile * 0.12;
    ctx.shadowOffsetY = metrics.tile * 0.08;
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    if (tile.special && tile.special !== "prism") {
      drawSpecialOverlay(tile.special, size);
    }

    ctx.restore();
  }

  function drawSpecialOverlay(special, size) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";
    if (special === "row") {
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.lineWidth = size * 0.11;
      ctx.beginPath();
      ctx.moveTo(-size * 0.34, 0);
      ctx.lineTo(size * 0.34, 0);
      ctx.stroke();
      ctx.strokeStyle = "rgba(37,185,237,0.82)";
      ctx.lineWidth = size * 0.045;
      ctx.stroke();
    } else if (special === "col") {
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.lineWidth = size * 0.11;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.34);
      ctx.lineTo(0, size * 0.34);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,178,26,0.82)";
      ctx.lineWidth = size * 0.045;
      ctx.stroke();
    } else if (special === "bomb") {
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.lineWidth = size * 0.065;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.31, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(232,70,157,0.72)";
      ctx.lineWidth = size * 0.035;
      ctx.beginPath();
      ctx.moveTo(-size * 0.25, -size * 0.25);
      ctx.lineTo(size * 0.25, size * 0.25);
      ctx.moveTo(size * 0.25, -size * 0.25);
      ctx.lineTo(-size * 0.25, size * 0.25);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of state.particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.05;
      particle.life -= particle.decay;
      ctx.save();
      ctx.globalAlpha = clamp(particle.life, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  function drawFloaters() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.max(18, metrics.tile * 0.22)}px Inter, system-ui, sans-serif`;
    for (const floater of state.floaters) {
      floater.y -= metrics.tile * 0.012;
      floater.life -= 0.018;
      ctx.globalAlpha = clamp(floater.life, 0, 1);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(36,20,53,0.32)";
      ctx.strokeText(floater.text, floater.x, floater.y);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(floater.text, floater.x, floater.y);
    }
    ctx.restore();
    state.floaters = state.floaters.filter((floater) => floater.life > 0);
  }

  function render() {
    ctx.clearRect(0, 0, metrics.width, metrics.height);
    drawBoardBase();
    allTiles()
      .sort((a, b) => a.row - b.row || a.col - b.col)
      .forEach(drawTile);
    drawParticles();
    drawFloaters();
    ctx.restore();
    requestAnimationFrame(render);
  }

  function bindEvents() {
    window.addEventListener("resize", computeMetrics);
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    canvas.addEventListener("keydown", handleKeyDown);
    ui.hammer.addEventListener("click", () => toggleBooster("hammer"));
    ui.shuffle.addEventListener("click", () => toggleBooster("shuffle"));
    ui.pause.addEventListener("click", () => {
      if (state.phase === "modal") {
        return;
      }
      showModal("pause");
    });
  }

  async function init() {
    bindEvents();
    computeMetrics();
    await preloadAssets();
    startNewGame();
    requestAnimationFrame(render);
  }

  init().catch((error) => {
    console.error(error);
    showToast("Asset-Fehler");
  });
})();
