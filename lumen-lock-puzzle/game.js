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
  const TIER_NAMES = ["Glass Vault", "Clockwork Ring", "Verdant Lens", "Eclipse Engine"];

  const makeTile = (x, y, type, rot = 0, locked = false, color = null) => ({
    x,
    y,
    type,
    rot,
    initialRot: rot,
    locked,
    color
  });

  const LEVELS = [
    {
      id: "first-seal",
      name: "First Seal",
      size: 6,
      par: 2,
      note: "Two mirrored turns wake the first lock.",
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
      note: "One prism must split a single beam into two promises.",
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
      note: "Two colors cross without forgiving the wrong crystal.",
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
      note: "The violet fork only opens when both branches agree.",
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
      note: "Three old circuits share the same cramped machine.",
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
    },
    {
      id: "split-current",
      name: "Split Current",
      size: 7,
      par: 6,
      note: "Green light is greedy: one gate, two distant receivers.",
      sources: [{ x: -1, y: 3, dir: DIR.E, color: "green" }],
      targets: [
        { x: 6, y: 1, color: "green" },
        { x: 6, y: 5, color: "green" }
      ],
      tiles: [
        makeTile(2, 3, "split", 3),
        makeTile(2, 1, "corner", 3),
        makeTile(2, 5, "corner", 2),
        makeTile(4, 2, "wall", 0, true),
        makeTile(4, 4, "wall", 0, true)
      ]
    },
    {
      id: "glass-meridian",
      name: "Glass Meridian",
      size: 7,
      par: 8,
      note: "Two beams share a meridian and refuse to collide.",
      sources: [
        { x: 1, y: -1, dir: DIR.S, color: "cyan" },
        { x: -1, y: 5, dir: DIR.E, color: "amber" }
      ],
      targets: [
        { x: 5, y: 5, color: "cyan" },
        { x: 5, y: 1, color: "amber" }
      ],
      tiles: [
        makeTile(1, 2, "corner", 2),
        makeTile(5, 2, "corner", 0),
        makeTile(2, 5, "corner", 1),
        makeTile(2, 1, "corner", 3),
        makeTile(2, 2, "cross", 0, true),
        makeTile(4, 4, "wall", 0, true),
        makeTile(0, 1, "wall", 0, true)
      ]
    },
    {
      id: "crown-aperture",
      name: "Crown Aperture",
      size: 8,
      par: 14,
      note: "The crown chamber wants four receivers to settle into one rhythm.",
      sources: [
        { x: -1, y: 2, dir: DIR.E, color: "cyan" },
        { x: 5, y: -1, dir: DIR.S, color: "amber" },
        { x: 8, y: 6, dir: DIR.W, color: "violet" }
      ],
      targets: [
        { x: 7, y: 0, color: "cyan" },
        { x: 7, y: 4, color: "cyan" },
        { x: 1, y: 6, color: "amber" },
        { x: 3, y: 1, color: "violet" }
      ],
      tiles: [
        makeTile(2, 2, "split", 3),
        makeTile(2, 0, "corner", 3),
        makeTile(2, 4, "corner", 2),
        makeTile(5, 5, "corner", 1),
        makeTile(1, 5, "corner", 3),
        makeTile(6, 6, "corner", 2),
        makeTile(6, 1, "corner", 0),
        makeTile(4, 5, "line", 1, true),
        makeTile(4, 1, "line", 1, true),
        makeTile(0, 6, "wall", 0, true),
        makeTile(7, 2, "wall", 0, true)
      ]
    },
    {
      id: "aurora-circuit",
      name: "Aurora Circuit",
      size: 8,
      par: 8,
      note: "The aurora chamber makes green and cyan share the same breath.",
      sources: [
        { x: -1, y: 4, dir: DIR.E, color: "green" },
        { x: 5, y: -1, dir: DIR.S, color: "cyan" }
      ],
      targets: [
        { x: 7, y: 1, color: "green" },
        { x: 7, y: 6, color: "green" },
        { x: 1, y: 3, color: "cyan" }
      ],
      tiles: [
        makeTile(2, 4, "split", 3),
        makeTile(2, 1, "corner", 3),
        makeTile(2, 6, "corner", 2),
        makeTile(5, 3, "corner", 1),
        makeTile(4, 4, "wall", 0, true),
        makeTile(6, 2, "wall", 0, true)
      ]
    },
    {
      id: "solar-lattice",
      name: "Solar Lattice",
      size: 8,
      par: 8,
      note: "Amber gears and violet glass answer from opposite edges.",
      sources: [
        { x: -1, y: 2, dir: DIR.E, color: "amber" },
        { x: 8, y: 5, dir: DIR.W, color: "violet" }
      ],
      targets: [
        { x: 6, y: 6, color: "amber" },
        { x: 1, y: 1, color: "violet" }
      ],
      tiles: [
        makeTile(3, 2, "corner", 0),
        makeTile(3, 6, "corner", 2),
        makeTile(5, 5, "corner", 2),
        makeTile(5, 1, "corner", 0),
        makeTile(4, 3, "cross", 0, true),
        makeTile(2, 4, "wall", 0, true)
      ]
    },
    {
      id: "verdant-spiral",
      name: "Verdant Spiral",
      size: 8,
      par: 6,
      note: "A living conduit bends around one old clockwork scar.",
      sources: [
        { x: 3, y: 8, dir: DIR.N, color: "green" },
        { x: 6, y: -1, dir: DIR.S, color: "amber" }
      ],
      targets: [
        { x: 7, y: 0, color: "green" },
        { x: 0, y: 4, color: "green" },
        { x: 1, y: 6, color: "amber" }
      ],
      tiles: [
        makeTile(3, 4, "split", 3),
        makeTile(3, 0, "corner", 3),
        makeTile(6, 6, "corner", 1),
        makeTile(4, 2, "line", 1, true),
        makeTile(5, 4, "wall", 0, true)
      ]
    },
    {
      id: "eclipse-engine",
      name: "Eclipse Engine",
      size: 8,
      par: 10,
      note: "Four colors lock the final engine into a single hush.",
      sources: [
        { x: -1, y: 1, dir: DIR.E, color: "cyan" },
        { x: 6, y: -1, dir: DIR.S, color: "amber" },
        { x: 8, y: 6, dir: DIR.W, color: "violet" },
        { x: 1, y: 8, dir: DIR.N, color: "green" }
      ],
      targets: [
        { x: 7, y: 3, color: "cyan" },
        { x: 0, y: 5, color: "amber" },
        { x: 4, y: 0, color: "violet" },
        { x: 7, y: 7, color: "green" }
      ],
      tiles: [
        makeTile(3, 1, "corner", 0),
        makeTile(3, 3, "corner", 2),
        makeTile(6, 5, "corner", 1),
        makeTile(4, 6, "corner", 2),
        makeTile(1, 7, "corner", 3),
        makeTile(2, 2, "wall", 0, true),
        makeTile(5, 2, "wall", 0, true),
        makeTile(5, 7, "line", 1, true)
      ]
    },
    {
      id: "moonlit-relay",
      name: "Moonlit Relay",
      size: 8,
      par: 8,
      note: "A cyan branch and amber relay trade paths across the lower vault.",
      sources: [
        { x: -1, y: 4, dir: DIR.E, color: "cyan" },
        { x: 6, y: -1, dir: DIR.S, color: "amber" }
      ],
      targets: [
        { x: 7, y: 2, color: "cyan" },
        { x: 7, y: 6, color: "cyan" },
        { x: 1, y: 5, color: "amber" }
      ],
      tiles: [
        makeTile(3, 4, "split", 3),
        makeTile(3, 2, "corner", 3),
        makeTile(3, 6, "corner", 2),
        makeTile(6, 5, "corner", 1),
        makeTile(5, 3, "wall", 0, true),
        makeTile(0, 6, "wall", 0, true)
      ]
    },
    {
      id: "star-foundry",
      name: "Star Foundry",
      size: 8,
      par: 10,
      note: "Three foundry lines wrap the engine from different edges.",
      sources: [
        { x: -1, y: 1, dir: DIR.E, color: "violet" },
        { x: 8, y: 4, dir: DIR.W, color: "green" },
        { x: 6, y: -1, dir: DIR.S, color: "amber" }
      ],
      targets: [
        { x: 6, y: 6, color: "violet" },
        { x: 0, y: 2, color: "green" },
        { x: 1, y: 5, color: "amber" }
      ],
      tiles: [
        makeTile(2, 1, "corner", 0),
        makeTile(2, 6, "corner", 2),
        makeTile(5, 4, "corner", 2),
        makeTile(5, 2, "corner", 0),
        makeTile(6, 5, "corner", 1),
        makeTile(4, 4, "cross", 0, true),
        makeTile(3, 3, "wall", 0, true)
      ]
    },
    {
      id: "obsidian-halo",
      name: "Obsidian Halo",
      size: 8,
      par: 8,
      note: "A halo split answers two cyan receivers while violet slips below.",
      sources: [
        { x: -1, y: 3, dir: DIR.E, color: "cyan" },
        { x: 4, y: 8, dir: DIR.N, color: "violet" }
      ],
      targets: [
        { x: 7, y: 1, color: "cyan" },
        { x: 7, y: 5, color: "cyan" },
        { x: 1, y: 6, color: "violet" }
      ],
      tiles: [
        makeTile(2, 3, "split", 3),
        makeTile(2, 1, "corner", 3),
        makeTile(2, 5, "corner", 2),
        makeTile(4, 6, "corner", 0),
        makeTile(5, 3, "wall", 0, true),
        makeTile(6, 6, "wall", 0, true)
      ]
    },
    {
      id: "final-resonance",
      name: "Final Resonance",
      size: 9,
      par: 12,
      note: "Every edge speaks at once; the vault only opens on resonance.",
      sources: [
        { x: -1, y: 1, dir: DIR.E, color: "cyan" },
        { x: 8, y: -1, dir: DIR.S, color: "amber" },
        { x: 9, y: 8, dir: DIR.W, color: "violet" },
        { x: 0, y: 9, dir: DIR.N, color: "green" }
      ],
      targets: [
        { x: 8, y: 5, color: "cyan" },
        { x: 2, y: 7, color: "amber" },
        { x: 4, y: 0, color: "violet" },
        { x: 7, y: 3, color: "green" }
      ],
      tiles: [
        makeTile(3, 1, "corner", 0),
        makeTile(3, 5, "corner", 2),
        makeTile(8, 7, "corner", 1),
        makeTile(6, 8, "corner", 2),
        makeTile(6, 0, "corner", 0),
        makeTile(0, 3, "corner", 3),
        makeTile(4, 4, "cross", 0, true),
        makeTile(2, 2, "wall", 0, true),
        makeTile(5, 6, "wall", 0, true)
      ]
    },
    {
      id: "cyan-sieve",
      name: "Cyan Sieve",
      size: 8,
      par: 8,
      note: "Color lenses begin judging which light deserves passage.",
      sources: [
        { x: -1, y: 2, dir: DIR.E, color: "cyan" },
        { x: -1, y: 5, dir: DIR.E, color: "amber" }
      ],
      targets: [
        { x: 7, y: 6, color: "cyan" },
        { x: 7, y: 1, color: "amber" }
      ],
      tiles: [
        makeTile(2, 2, "corner", 0),
        makeTile(2, 6, "corner", 2),
        makeTile(4, 6, "filter", 1, true, "cyan"),
        makeTile(5, 5, "corner", 1),
        makeTile(5, 1, "corner", 3),
        makeTile(6, 1, "filter", 1, true, "amber"),
        makeTile(3, 3, "wall", 0, true)
      ]
    },
    {
      id: "lens-exchange",
      name: "Lens Exchange",
      size: 8,
      par: 10,
      note: "Rotating the lens is now part of the lock.",
      sources: [
        { x: 1, y: -1, dir: DIR.S, color: "cyan" },
        { x: 8, y: 6, dir: DIR.W, color: "green" }
      ],
      targets: [
        { x: 6, y: 6, color: "cyan" },
        { x: 1, y: 1, color: "green" }
      ],
      tiles: [
        makeTile(1, 3, "corner", 2),
        makeTile(6, 3, "corner", 0),
        makeTile(6, 5, "filter", 1, false, "cyan"),
        makeTile(3, 6, "corner", 2),
        makeTile(3, 1, "corner", 0),
        makeTile(2, 1, "filter", 0, false, "green"),
        makeTile(4, 4, "wall", 0, true)
      ]
    },
    {
      id: "prismatic-warden",
      name: "Prismatic Warden",
      size: 9,
      par: 8,
      note: "The warden lets only the named colors reach the rim.",
      sources: [
        { x: -1, y: 4, dir: DIR.E, color: "cyan" },
        { x: 6, y: -1, dir: DIR.S, color: "violet" }
      ],
      targets: [
        { x: 8, y: 0, color: "cyan" },
        { x: 1, y: 7, color: "violet" }
      ],
      tiles: [
        makeTile(2, 4, "corner", 1),
        makeTile(2, 0, "corner", 3),
        makeTile(5, 0, "filter", 0, false, "cyan"),
        makeTile(6, 7, "corner", 1),
        makeTile(3, 7, "filter", 0, false, "violet"),
        makeTile(4, 4, "cross", 0, true),
        makeTile(7, 2, "wall", 0, true)
      ]
    },
    {
      id: "master-key",
      name: "Master Key",
      size: 9,
      par: 18,
      note: "Every filter in the vault has to agree before the master key turns.",
      sources: [
        { x: -1, y: 2, dir: DIR.E, color: "cyan" },
        { x: 8, y: -1, dir: DIR.S, color: "amber" },
        { x: 9, y: 1, dir: DIR.W, color: "violet" },
        { x: 0, y: 9, dir: DIR.N, color: "green" }
      ],
      targets: [
        { x: 8, y: 6, color: "cyan" },
        { x: 2, y: 8, color: "amber" },
        { x: 4, y: 0, color: "violet" },
        { x: 7, y: 5, color: "green" }
      ],
      tiles: [
        makeTile(3, 2, "corner", 0),
        makeTile(3, 6, "corner", 2),
        makeTile(6, 6, "filter", 0, false, "cyan"),
        makeTile(8, 4, "corner", 1),
        makeTile(2, 4, "corner", 3),
        makeTile(2, 7, "filter", 1, false, "amber"),
        makeTile(6, 1, "corner", 2),
        makeTile(6, 0, "corner", 0),
        makeTile(5, 0, "filter", 0, false, "violet"),
        makeTile(0, 5, "corner", 3),
        makeTile(4, 5, "filter", 0, false, "green"),
        makeTile(4, 4, "cross", 0, true),
        makeTile(1, 1, "wall", 0, true),
        makeTile(7, 7, "wall", 0, true)
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
    masteryStrip: document.getElementById("masteryStrip"),
    mastery: document.getElementById("masteryValue"),
    tier: document.getElementById("tierValue"),
    badge: document.getElementById("stateBadge"),
    levelButtons: document.getElementById("levelButtons"),
    undo: document.getElementById("undoButton"),
    reset: document.getElementById("resetButton"),
    next: document.getElementById("nextButton"),
    audio: document.getElementById("audioButton"),
    lockState: document.getElementById("lockState"),
    note: document.getElementById("levelNote"),
    signalValue: document.getElementById("signalValue"),
    signalList: document.getElementById("signalList")
  };

  const assets = {
    background: loadImage("assets/lumen-lock-background-imagen-v3.png"),
    glyphs: loadImage("assets/lumen-lock-glyphs.png"),
    uiSkin: loadImage("assets/lumen-lock-gui-imagen-v2.png"),
    boardSkin: loadImage("assets/lumen-lock-board-imagen-v2.png"),
    boardBiomes: loadImage("assets/lumen-lock-board-biomes-imagen-v3.png"),
    elementSkin: loadImage("assets/lumen-lock-elements-imagen-v2.png"),
    flareSkin: loadImage("assets/lumen-lock-beam-flares-imagen-v1.png"),
    rewardPlaque: loadImage("assets/lumen-lock-reward-plaque-imagen-v1.png")
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
    newBest: false,
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
    state.newBest = false;
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

    if (tile.type === "line" || tile.type === "filter") {
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

  function routeTile(tile, incomingDir, color) {
    if (!tile) return [incomingDir];
    if (tile.type === "wall") return [];
    if (tile.type === "filter" && tile.color !== color) return [];

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
      const outDirs = routeTile(tile, beam.dir, beam.color);
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
    const solvedNow = state.solved && !wasSolved;
    if (!state.solved) state.newBest = false;
    if (state.beams.activeTargets.size > previousTargets) {
      playSound("target");
    }
    if (solvedNow) {
      const level = getLevel();
      playSound("solve");
      const previous = state.best[level.id];
      if (!previous || state.moves < previous) {
        state.best[level.id] = state.moves;
        state.newBest = true;
        saveBest();
      }
    }
    updateDom();
    if (solvedNow) renderLevelButtons();
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
    if (nodes.mastery) nodes.mastery.textContent = `${completedCount()}/${LEVELS.length} sealed`;
    if (nodes.tier) nodes.tier.textContent = TIER_NAMES[boardVariantIndex()] ?? TIER_NAMES[0];
    if (nodes.masteryStrip) {
      const variant = boardVariantIndex();
      nodes.masteryStrip.style.setProperty("--tier-medal-x", `${(variant % 2) * 100}%`);
      nodes.masteryStrip.style.setProperty("--tier-medal-y", `${Math.floor(variant / 2) * 100}%`);
    }
    if (nodes.note) nodes.note.textContent = level.note;
    nodes.badge.textContent = badgeText(level);
    nodes.badge.classList.toggle("is-solved", state.solved);
    nodes.undo.disabled = state.undo.length === 0;
    nodes.next.disabled = !state.solved || state.levelIndex >= LEVELS.length - 1;
    renderSignals();
  }

  function badgeText(level) {
    if (!state.solved) return "Align";
    if (state.newBest) return "New Best";
    return state.moves <= level.par ? "Par Lock" : "Unlocked";
  }

  function completedCount() {
    return LEVELS.filter((level) => state.best[level.id]).length;
  }

  function boardVariantIndex(index = state.levelIndex) {
    const groupSize = Math.max(1, Math.ceil(LEVELS.length / TIER_NAMES.length));
    return Math.min(TIER_NAMES.length - 1, Math.floor(index / groupSize));
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
      button.style.setProperty("--relic-x", `${(index % 4) * 33.333}%`);
      button.style.setProperty("--relic-y", `${Math.floor(index / 4) * 33.333}%`);
      button.classList.toggle("is-active", index === state.levelIndex);
      button.classList.toggle("is-complete", Boolean(state.best[level.id]));
      button.classList.toggle("is-par", Boolean(state.best[level.id] && state.best[level.id] <= level.par));
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
    if (tile.type === "line" || tile.type === "filter") return 2;
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
    drawMotes(time, w, h);
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

  function drawMotes(time, w, h) {
    const count = Math.max(18, Math.min(42, Math.floor((w * h) / 30000)));
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < count; i += 1) {
      const speed = 0.018 + (i % 5) * 0.006;
      const x = ((i * 113 + time * speed) % (w + 80)) - 40;
      const y = ((i * 67 + Math.sin(time * 0.0007 + i) * 24) % (h + 80)) - 40;
      const radius = 0.9 + (i % 4) * 0.35;
      ctx.globalAlpha = 0.08 + (i % 3) * 0.025;
      ctx.fillStyle = i % 2 === 0 ? "#66e8ff" : "#ffc75a";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCoverImage(image, x, y, w, h) {
    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const iw = image.naturalWidth * scale;
    const ih = image.naturalHeight * scale;
    ctx.drawImage(image, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }

  function drawAtlasImage(image, index, columns, x, y, w, h) {
    const cell = image.naturalWidth / columns;
    const sx = (index % columns) * cell;
    const sy = Math.floor(index / columns) * cell;
    ctx.drawImage(image, sx, sy, cell, cell, x, y, w, h);
  }

  function flareIndex(color, variant = 0) {
    const row = { cyan: 0, amber: 1, green: 2, violet: 3 }[color] ?? 0;
    return row * 4 + variant;
  }

  function drawFlare(index, center, size, alpha, rotation = 0) {
    const flares = assets.flareSkin;
    if (!flares.complete || !flares.naturalWidth) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    ctx.translate(center.x, center.y);
    ctx.rotate(rotation);
    drawAtlasImage(flares, index, 4, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  function drawBoardBase() {
    const level = getLevel();
    const board = boardRect();
    const boardSkin = assets.boardSkin;
    const biomeSkin = assets.boardBiomes;
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
      ctx.globalAlpha = 0.07;
      drawCoverImage(skin, board.x - 26, board.y - 26, board.size + 52, board.size + 52);
      ctx.restore();
    }

    if (biomeSkin.complete && biomeSkin.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = 0.76;
      drawAtlasImage(biomeSkin, boardVariantIndex(), 2, board.x - board.cell * 0.32, board.y - board.cell * 0.32, board.size + board.cell * 0.64, board.size + board.cell * 0.64);
      ctx.restore();
    } else if (boardSkin.complete && boardSkin.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = 0.72;
      drawCoverImage(boardSkin, board.x - board.cell * 0.32, board.y - board.cell * 0.32, board.size + board.cell * 0.64, board.size + board.cell * 0.64);
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
        drawElementIcon(5, x + pad, y + pad, size, size, 0.82);
        drawGlyph(4, x + pad, y + pad, size, size, 0.16);
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
      drawElementIcon(0, x + pad, y + pad, size, size, 0.42);
      if (tile.type === "filter") {
        drawElementIcon(elementIconIndex(tile.color, "target"), x + pad, y + pad, size, size, 0.26);
      }
      drawGlyph(glyphIndex(tile.type), x + pad, y + pad, size, size, 0.13);
      ctx.strokeStyle = "rgba(216, 183, 108, 0.58)";
      ctx.lineWidth = Math.max(1, board.cell * 0.022);
      ctx.stroke();

      const center = { x: x + board.cell / 2, y: y + board.cell / 2 };
      const connectors = connectorsFor(tile);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(255, 199, 90, 0.35)";
      ctx.shadowBlur = board.cell * 0.13;
      ctx.strokeStyle = conduitColor(tile);
      ctx.lineWidth = Math.max(5, board.cell * 0.105) * pulse;
      connectors.forEach((dir) => {
        const end = connectorPoint(center, dir, board.cell * 0.31);
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;
      ctx.fillStyle = tile.type === "split" ? "#66e8ff" : tile.type === "filter" ? COLORS[tile.color] : "#ffe1a0";
      ctx.beginPath();
      ctx.arc(center.x, center.y, Math.max(4, board.cell * 0.07), 0, Math.PI * 2);
      ctx.fill();
      if (tile.locked) drawLockPin(center, board.cell);
      ctx.restore();
    });
  }

  function drawLockPin(center, cellSize) {
    const r = Math.max(4, cellSize * 0.052);
    ctx.save();
    ctx.translate(center.x + cellSize * 0.18, center.y - cellSize * 0.18);
    ctx.shadowColor = "rgba(255, 199, 90, 0.42)";
    ctx.shadowBlur = cellSize * 0.12;
    ctx.fillStyle = "rgba(255, 229, 161, 0.96)";
    ctx.strokeStyle = "rgba(7, 10, 11, 0.7)";
    ctx.lineWidth = Math.max(1, cellSize * 0.018);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, 0);
    ctx.lineTo(r * 0.42, 0);
    ctx.stroke();
    ctx.restore();
  }

  function glyphIndex(type) {
    return { line: 1, corner: 2, split: 3, wall: 4, cross: 10, filter: 8 }[type] ?? 0;
  }

  function conduitColor(tile) {
    if (tile.type === "filter") return COLORS[tile.color] ?? "rgba(255, 219, 142, 0.95)";
    if (tile.type === "split") return "rgba(102, 232, 255, 0.92)";
    return "rgba(255, 219, 142, 0.95)";
  }

  function elementIconIndex(typeOrColor, role = "tile") {
    if (role === "target") {
      return { cyan: 6, amber: 7, violet: 8, green: 9 }[typeOrColor] ?? 6;
    }
    if (role === "source") {
      return { cyan: 10, amber: 11, violet: 10, green: 11 }[typeOrColor] ?? 10;
    }
    return { wall: 5 }[typeOrColor] ?? 0;
  }

  function drawElementIcon(index, x, y, w, h, alpha) {
    const elements = assets.elementSkin;
    if (!elements.complete || !elements.naturalWidth) return;
    const cell = elements.naturalWidth / 4;
    const sx = (index % 4) * cell;
    const sy = Math.floor(index / 4) * cell;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(elements, sx, sy, cell, cell, x, y, w, h);
    ctx.restore();
  }

  function drawRotatedElementIcon(index, center, size, direction, alpha) {
    const elements = assets.elementSkin;
    if (!elements.complete || !elements.naturalWidth) return;
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(direction * (Math.PI / 2));
    drawElementIcon(index, -size / 2, -size / 2, size, size, alpha);
    ctx.restore();
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
      const iconSize = board.cell * 0.82;
      drawElementIcon(
        elementIconIndex(target.color, "target"),
        center.x - iconSize / 2,
        center.y - iconSize / 2,
        iconSize,
        iconSize,
        active ? 0.72 : 0.36
      );
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
      if (active) {
        drawFlare(flareIndex(target.color, 1), center, board.cell * 1.25, 0.32, time * 0.001 + index);
        drawTargetSparks(center, radius, color, time + index * 180);
      }
    });
  }

  function drawTargetSparks(center, radius, color, time) {
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, radius * 0.08);
    ctx.globalAlpha = 0.48;
    ctx.shadowColor = color;
    ctx.shadowBlur = radius * 0.65;
    for (let i = 0; i < 6; i += 1) {
      const angle = time * 0.0022 + i * (Math.PI / 3);
      const inner = radius * 1.46;
      const outer = radius * (1.72 + Math.sin(time * 0.004 + i) * 0.08);
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.restore();
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
      drawFlare(flareIndex(source.color, 0), center, board.cell * 1.06, 0.18, time * 0.0009);
      drawRotatedElementIcon(elementIconIndex(source.color, "source"), center, board.cell * 0.78, source.dir, 0.46);
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
    const w = Math.min(board.size * 0.62, 360);
    const x = board.x + (board.size - w) / 2;
    const h = Math.max(34, board.cell * 0.42);
    ctx.save();
    ctx.globalAlpha = 0.86 + Math.sin(time * 0.007) * 0.05;
    const plaque = assets.rewardPlaque;
    drawFlare(flareIndex("cyan", 0), { x: x + w / 2, y: y + h / 2 }, w * 0.74, 0.2, time * 0.0008);
    if (plaque.complete && plaque.naturalWidth) {
      drawCoverImage(plaque, x - h * 0.6, y - h * 0.52, w + h * 1.2, h * 2.04);
      ctx.fillStyle = "rgba(4, 10, 12, 0.58)";
      roundRect(x + h * 0.24, y + h * 0.12, w - h * 0.48, h * 0.78, 8);
      ctx.fill();
    } else {
      roundRect(x, y, w, h, 8);
      ctx.fillStyle = "rgba(6, 18, 20, 0.84)";
      ctx.fill();
      ctx.strokeStyle = "rgba(102, 232, 255, 0.72)";
      ctx.stroke();
    }
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
    getLevelCount: () => LEVELS.length,
    getSnapshot: () => ({
      levelIndex: state.levelIndex,
      levelId: getLevel().id,
      levelCount: LEVELS.length,
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
