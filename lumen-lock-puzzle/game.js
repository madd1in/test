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
    cyan: "#2f9dff",
    amber: "#ffc75a",
    violet: "#c993ff",
    green: "#b7ff37"
  };
  const SIGNAL_NAMES = {
    cyan: "blue",
    amber: "amber",
    violet: "violet",
    green: "lime"
  };
  const STORAGE_KEY = "lumen-lock-best-v1";
  const FX_STORAGE_KEY = "lumen-lock-fx-v1";
  const FULL_FRAME_MS = 1000 / 30;
  const CALM_FRAME_MS = 1000 / 20;
  const VISUAL_BLEED = {
    frame: 1.05,
    source: 1.65,
    target: 1.38,
    tile: 0.58,
    bottomSafety: 0.85
  };
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
      size: 10,
      par: 18,
      note: "Every filter in the vault has to agree before the master key turns.",
      sources: [
        { x: -1, y: 2, dir: DIR.E, color: "cyan" },
        { x: 8, y: -1, dir: DIR.S, color: "amber" },
        { x: 10, y: 1, dir: DIR.W, color: "violet" },
        { x: 0, y: 6, dir: DIR.N, color: "green" }
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
    },
    {
      id: "prism-exchange",
      name: "Prism Exchange",
      size: 8,
      par: 8,
      note: "New color converters rewrite a beam before it reaches the old receivers.",
      sources: [
        { x: -1, y: 2, dir: DIR.E, color: "cyan" },
        { x: 7, y: -1, dir: DIR.S, color: "amber" }
      ],
      targets: [
        { x: 7, y: 6, color: "amber" },
        { x: 1, y: 7, color: "cyan" }
      ],
      tiles: [
        makeTile(3, 2, "corner", 0),
        makeTile(3, 5, "converter", 0, true, "amber"),
        makeTile(3, 6, "corner", 2),
        makeTile(7, 3, "corner", 1),
        makeTile(4, 3, "converter", 1, true, "cyan"),
        makeTile(1, 3, "corner", 3),
        makeTile(5, 5, "wall", 0, true),
        makeTile(6, 1, "wall", 0, true)
      ]
    },
    {
      id: "chromatic-switchback",
      name: "Chromatic Switchback",
      size: 9,
      par: 7,
      note: "One green current splits, then each branch must become a different promise.",
      sources: [{ x: -1, y: 4, dir: DIR.E, color: "green" }],
      targets: [
        { x: 8, y: 1, color: "violet" },
        { x: 8, y: 7, color: "amber" }
      ],
      tiles: [
        makeTile(2, 4, "split", 0),
        makeTile(2, 1, "corner", 3),
        makeTile(5, 1, "converter", 0, false, "violet"),
        makeTile(2, 7, "corner", 2),
        makeTile(5, 7, "converter", 0, false, "amber"),
        makeTile(6, 1, "filter", 1, true, "violet"),
        makeTile(6, 7, "filter", 1, true, "amber"),
        makeTile(4, 4, "wall", 0, true),
        makeTile(4, 5, "wall", 0, true)
      ]
    },
    {
      id: "rose-window",
      name: "Rose Window",
      size: 9,
      par: 8,
      note: "The upper lens blooms violet while the lower relay turns green into amber.",
      sources: [
        { x: -1, y: 1, dir: DIR.E, color: "cyan" },
        { x: 9, y: 7, dir: DIR.W, color: "green" }
      ],
      targets: [
        { x: 8, y: 1, color: "violet" },
        { x: 0, y: 2, color: "amber" }
      ],
      tiles: [
        makeTile(3, 1, "converter", 0, false, "violet"),
        makeTile(7, 1, "filter", 1, true, "violet"),
        makeTile(5, 7, "corner", 2),
        makeTile(5, 3, "converter", 0, true, "amber"),
        makeTile(5, 2, "corner", 0),
        makeTile(2, 2, "filter", 1, true, "amber"),
        makeTile(4, 4, "cross", 0, true),
        makeTile(1, 6, "wall", 0, true),
        makeTile(7, 5, "wall", 0, true)
      ]
    },
    {
      id: "crown-dial",
      name: "Crown Dial",
      size: 10,
      par: 7,
      note: "A crown splitter must feed two rewritten side lines while a third beam falls through.",
      sources: [
        { x: 5, y: 10, dir: DIR.N, color: "cyan" },
        { x: 1, y: -1, dir: DIR.S, color: "violet" }
      ],
      targets: [
        { x: 0, y: 5, color: "green" },
        { x: 9, y: 5, color: "amber" },
        { x: 1, y: 9, color: "cyan" }
      ],
      tiles: [
        makeTile(5, 5, "split", 3),
        makeTile(2, 5, "converter", 0, false, "green"),
        makeTile(7, 5, "converter", 0, false, "amber"),
        makeTile(1, 6, "converter", 0, true, "cyan"),
        makeTile(8, 5, "filter", 1, true, "amber"),
        makeTile(4, 7, "wall", 0, true),
        makeTile(6, 3, "wall", 0, true)
      ]
    },
    {
      id: "filter-loom",
      name: "Filter Loom",
      size: 10,
      par: 10,
      note: "Two long routes weave through converters and color gates on opposite sides.",
      sources: [
        { x: -1, y: 2, dir: DIR.E, color: "amber" },
        { x: 8, y: -1, dir: DIR.S, color: "violet" }
      ],
      targets: [
        { x: 9, y: 8, color: "green" },
        { x: 0, y: 6, color: "cyan" }
      ],
      tiles: [
        makeTile(3, 2, "corner", 0),
        makeTile(3, 5, "converter", 0, true, "green"),
        makeTile(3, 8, "corner", 2),
        makeTile(6, 8, "filter", 1, true, "green"),
        makeTile(8, 3, "corner", 1),
        makeTile(5, 3, "converter", 1, true, "cyan"),
        makeTile(2, 3, "corner", 3),
        makeTile(2, 5, "filter", 0, true, "cyan"),
        makeTile(2, 6, "corner", 1),
        makeTile(5, 6, "cross", 0, true),
        makeTile(6, 1, "wall", 0, true),
        makeTile(7, 7, "wall", 0, true)
      ]
    },
    {
      id: "aurora-exchange",
      name: "Aurora Exchange",
      size: 11,
      par: 10,
      note: "The aurora branch splits into two conversions while violet dives into cyan.",
      sources: [
        { x: -1, y: 5, dir: DIR.E, color: "cyan" },
        { x: 8, y: -1, dir: DIR.S, color: "violet" }
      ],
      targets: [
        { x: 10, y: 2, color: "amber" },
        { x: 10, y: 8, color: "green" },
        { x: 8, y: 10, color: "cyan" }
      ],
      tiles: [
        makeTile(3, 5, "split", 0),
        makeTile(3, 2, "corner", 3),
        makeTile(6, 2, "converter", 0, false, "amber"),
        makeTile(9, 2, "filter", 1, true, "amber"),
        makeTile(3, 8, "corner", 2),
        makeTile(6, 8, "converter", 0, false, "green"),
        makeTile(9, 8, "filter", 1, true, "green"),
        makeTile(8, 4, "converter", 0, true, "cyan"),
        makeTile(5, 5, "cross", 0, true),
        makeTile(1, 1, "wall", 0, true),
        makeTile(9, 6, "wall", 0, true)
      ]
    },
    {
      id: "null-cathedral",
      name: "Null Cathedral",
      size: 11,
      par: 12,
      note: "Three aisles trade identities across the cathedral floor.",
      sources: [
        { x: -1, y: 1, dir: DIR.E, color: "amber" },
        { x: 11, y: 9, dir: DIR.W, color: "green" },
        { x: 2, y: 11, dir: DIR.N, color: "cyan" }
      ],
      targets: [
        { x: 10, y: 1, color: "violet" },
        { x: 0, y: 2, color: "amber" },
        { x: 10, y: 6, color: "green" }
      ],
      tiles: [
        makeTile(4, 1, "converter", 0, false, "violet"),
        makeTile(7, 1, "filter", 1, true, "violet"),
        makeTile(7, 9, "corner", 2),
        makeTile(7, 5, "converter", 1, false, "amber"),
        makeTile(7, 2, "corner", 0),
        makeTile(3, 2, "filter", 1, true, "amber"),
        makeTile(2, 6, "corner", 3),
        makeTile(5, 6, "converter", 0, false, "green"),
        makeTile(8, 6, "filter", 1, true, "green"),
        makeTile(5, 5, "cross", 0, true),
        makeTile(1, 8, "wall", 0, true),
        makeTile(9, 4, "wall", 0, true)
      ]
    },
    {
      id: "lumen-crown",
      name: "The Lumen Crown",
      size: 12,
      par: 16,
      note: "The last crown chamber uses every trick: routes, filters, crossings, and rewritten color.",
      sources: [
        { x: -1, y: 2, dir: DIR.E, color: "cyan" },
        { x: 10, y: -1, dir: DIR.S, color: "amber" },
        { x: 12, y: 7, dir: DIR.W, color: "violet" },
        { x: 6, y: 12, dir: DIR.N, color: "green" }
      ],
      targets: [
        { x: 11, y: 9, color: "amber" },
        { x: 2, y: 10, color: "violet" },
        { x: 0, y: 7, color: "cyan" },
        { x: 11, y: 8, color: "green" }
      ],
      tiles: [
        makeTile(3, 2, "corner", 0),
        makeTile(3, 6, "converter", 0, true, "amber"),
        makeTile(3, 9, "corner", 2),
        makeTile(8, 9, "filter", 1, true, "amber"),
        makeTile(10, 3, "corner", 1),
        makeTile(6, 3, "converter", 1, true, "violet"),
        makeTile(2, 3, "corner", 3),
        makeTile(2, 8, "filter", 0, true, "violet"),
        makeTile(8, 7, "converter", 1, true, "cyan"),
        makeTile(6, 7, "line", 0, false),
        makeTile(4, 7, "filter", 1, true, "cyan"),
        makeTile(6, 8, "corner", 3),
        makeTile(9, 8, "filter", 1, true, "green"),
        makeTile(6, 6, "cross", 0, true),
        makeTile(4, 4, "wall", 0, true),
        makeTile(8, 5, "wall", 0, true)
      ]
    }
  ];

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
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
    fx: document.getElementById("fxButton"),
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
    board: null,
    fxMode: loadFxMode(),
    lastFrameTime: 0
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

  function loadFxMode() {
    try {
      return localStorage.getItem(FX_STORAGE_KEY) === "calm" ? "calm" : "full";
    } catch {
      return "full";
    }
  }

  function saveFxMode() {
    try {
      localStorage.setItem(FX_STORAGE_KEY, state.fxMode);
    } catch {
      // Visual quality preference is optional.
    }
  }

  function calmFxActive() {
    return state.fxMode === "calm" || prefersReducedMotion();
  }

  function fxIntensity() {
    return calmFxActive() ? 0.48 : 1;
  }

  function prefersReducedMotion() {
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
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
    state.board = null;
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

    if (tile.type === "line" || tile.type === "filter" || tile.type === "converter") {
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

  function outputColorFor(tile, color) {
    if (tile?.type === "converter" && tile.color) return tile.color;
    return color;
  }

  function computeBeams() {
    const level = getLevel();
    const activeTargets = new Set();
    const segments = [];
    const queue = [];
    const visited = new Set();

    level.sources.forEach((source) => {
      const vector = VEC[source.dir];
      const origin = sourcePoint(source, level);
      queue.push({
        x: source.x + vector.x,
        y: source.y + vector.y,
        dir: source.dir,
        color: source.color,
        fromX: origin.x,
        fromY: origin.y,
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
      const outColor = outputColorFor(tile, beam.color);
      outDirs.forEach((outDir) => {
        const vector = VEC[outDir];
        queue.push({
          x: beam.x + vector.x,
          y: beam.y + vector.y,
          dir: outDir,
          color: outColor,
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
    if (nodes.fx) {
      const calm = calmFxActive();
      nodes.fx.textContent = calm ? "FX Calm" : "FX Full";
      nodes.fx.setAttribute("aria-pressed", String(calm));
      nodes.fx.setAttribute("title", calm ? "Reduced glow and motion for smoother play" : "Full glow and motion");
    }
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
      chip.setAttribute("data-color", target.color);
      const label = document.createElement("span");
      const dot = document.createElement("i");
      dot.style.color = COLORS[target.color];
      dot.style.background = COLORS[target.color];
      label.append(dot, SIGNAL_NAMES[target.color] ?? target.color);
      const stateText = document.createElement("strong");
      stateText.textContent = state.beams.activeTargets.has(index) ? "Lit" : "Dark";
      chip.append(label, stateText);
      nodes.signalList.append(chip);
    });
    level.tiles
      .filter((tile) => tile.type === "filter" || tile.type === "converter")
      .forEach((tile) => {
        const chip = document.createElement("div");
        chip.className = "signal-chip is-mechanic";
        chip.setAttribute("data-color", tile.color);
        chip.setAttribute("data-role", tile.type);
        const label = document.createElement("span");
        const dot = document.createElement("i");
        dot.style.color = COLORS[tile.color];
        dot.style.background = COLORS[tile.color];
        label.append(dot, tile.type === "converter" ? `lens -> ${SIGNAL_NAMES[tile.color] ?? tile.color}` : `${SIGNAL_NAMES[tile.color] ?? tile.color} gate`);
        const stateText = document.createElement("strong");
        stateText.textContent = tile.locked ? "Pinned" : "Turn";
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
      const best = state.best[level.id];
      const tier = index >= LEVELS.length - 4 ? "final" : index >= Math.floor(LEVELS.length * 0.55) ? "late" : "early";
      button.setAttribute("data-tier", tier);
      button.setAttribute("title", `${index + 1}. ${level.name}`);
      button.setAttribute("aria-label", `${index + 1}. ${level.name}${best ? `, best ${best}` : ""}`);
      button.style.setProperty("--relic-x", `${(index % 4) * 33.333}%`);
      button.style.setProperty("--relic-y", `${Math.floor(index / 4) * 33.333}%`);
      button.classList.toggle("is-active", index === state.levelIndex);
      button.classList.toggle("is-complete", Boolean(best));
      button.classList.toggle("is-par", Boolean(best && best <= level.par));
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
    if (tile.type === "line" || tile.type === "filter" || tile.type === "converter") return 2;
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
    const dprLimit = calmFxActive() ? 1 : 1.45;
    const dpr = Math.min(window.devicePixelRatio || 1, dprLimit);
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
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
    const bounds = levelVisualBounds(level);
    const pad = Math.max(34, Math.min(state.canvasWidth, state.canvasHeight) * 0.085);
    const availableWidth = Math.max(1, state.canvasWidth - pad * 2);
    const availableHeight = Math.max(1, state.canvasHeight - pad * 2);
    const cell = Math.max(1, Math.min(
      availableWidth / (bounds.maxX - bounds.minX),
      availableHeight / (bounds.maxY - bounds.minY)
    ));
    const contentWidth = (bounds.maxX - bounds.minX) * cell;
    const contentHeight = (bounds.maxY - bounds.minY) * cell;
    const x = (state.canvasWidth - contentWidth) / 2 - bounds.minX * cell;
    const y = (state.canvasHeight - contentHeight) / 2 - bounds.minY * cell;
    state.board = {
      x,
      y,
      size: cell * level.size,
      cell
    };
    return state.board;
  }

  function levelVisualBounds(level) {
    const bounds = {
      minX: -VISUAL_BLEED.frame,
      minY: -VISUAL_BLEED.frame,
      maxX: level.size + VISUAL_BLEED.frame,
      maxY: level.size + VISUAL_BLEED.frame
    };

    level.sources.forEach((source) => {
      const point = sourcePoint(source, level);
      extendBounds(bounds, point.x, point.y, VISUAL_BLEED.source);
    });
    level.targets.forEach((target) => {
      extendBounds(bounds, target.x + 0.5, target.y + 0.5, VISUAL_BLEED.target);
    });
    level.tiles.forEach((tile) => {
      bounds.minX = Math.min(bounds.minX, tile.x - VISUAL_BLEED.tile);
      bounds.minY = Math.min(bounds.minY, tile.y - VISUAL_BLEED.tile);
      bounds.maxX = Math.max(bounds.maxX, tile.x + 1 + VISUAL_BLEED.tile);
      bounds.maxY = Math.max(bounds.maxY, tile.y + 1 + VISUAL_BLEED.tile);
    });
    bounds.maxY += VISUAL_BLEED.bottomSafety;
    return bounds;
  }

  function extendBounds(bounds, x, y, bleed) {
    bounds.minX = Math.min(bounds.minX, x - bleed);
    bounds.minY = Math.min(bounds.minY, y - bleed);
    bounds.maxX = Math.max(bounds.maxX, x + bleed);
    bounds.maxY = Math.max(bounds.maxY, y + bleed);
  }

  function sourcePoint(source, level = getLevel()) {
    const x = source.x < 0
      ? 0.5
      : source.x >= level.size
        ? level.size - 0.5
        : source.x + 0.5;
    const y = source.y < 0
      ? 0.5
      : source.y >= level.size
        ? level.size - 0.5
        : source.y + 0.5;
    return { x, y };
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
    if (calmFxActive()) return;
    const count = Math.max(8, Math.min(24, Math.floor((w * h) / 52000)));
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < count; i += 1) {
      const speed = 0.018 + (i % 5) * 0.006;
      const x = ((i * 113 + time * speed) % (w + 80)) - 40;
      const y = ((i * 67 + Math.sin(time * 0.0007 + i) * 24) % (h + 80)) - 40;
      const radius = 0.9 + (i % 4) * 0.35;
      ctx.globalAlpha = 0.08 + (i % 3) * 0.025;
      ctx.fillStyle = i % 2 === 0 ? COLORS.cyan : "#ffc75a";
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
    const quality = fxIntensity();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha * quality;
    ctx.translate(center.x, center.y);
    ctx.rotate(rotation);
    const scaledSize = size * (0.82 + quality * 0.18);
    drawAtlasImage(flares, index, 4, -scaledSize / 2, -scaledSize / 2, scaledSize, scaledSize);
    ctx.restore();
  }

  function drawBoardBase() {
    const level = getLevel();
    const board = boardRect();
    const boardSkin = assets.boardSkin;
    const biomeSkin = assets.boardBiomes;
    const bleed = boardFrameBleed(board);
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
      drawCoverImage(skin, board.x - bleed * 1.7, board.y - bleed * 1.7, board.size + bleed * 3.4, board.size + bleed * 3.4);
      ctx.restore();
    }

    if (biomeSkin.complete && biomeSkin.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = 0.76;
      drawAtlasImage(biomeSkin, boardVariantIndex(), 2, board.x - bleed, board.y - bleed, board.size + bleed * 2, board.size + bleed * 2);
      ctx.restore();
    } else if (boardSkin.complete && boardSkin.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = 0.72;
      drawCoverImage(boardSkin, board.x - bleed, board.y - bleed, board.size + bleed * 2, board.size + bleed * 2);
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

  function boardFrameBleed(board) {
    const available = Math.min(
      board.x,
      board.y,
      state.canvasWidth - (board.x + board.size),
      state.canvasHeight - (board.y + board.size)
    );
    return Math.max(0, Math.min(board.cell * 0.32, available - 4));
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
      if (tile.type === "filter" || tile.type === "converter") {
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
      ctx.fillStyle = tile.type === "split" ? "#66e8ff" : tile.type === "filter" || tile.type === "converter" ? COLORS[tile.color] : "#ffe1a0";
      ctx.beginPath();
      ctx.arc(center.x, center.y, Math.max(4, board.cell * 0.07), 0, Math.PI * 2);
      ctx.fill();
      if (tile.type === "converter") drawConverterBands(center, board.cell, tile.color, pulse);
      if (tile.locked) drawLockPin(center, board.cell);
      ctx.restore();
    });
  }

  function drawConverterBands(center, cellSize, colorName, pulse) {
    const color = COLORS[colorName] ?? "#ffe1a0";
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = cellSize * 0.12 * fxIntensity();
    ctx.lineWidth = Math.max(1, cellSize * 0.024);
    ctx.globalAlpha = 0.76;
    ctx.beginPath();
    ctx.arc(0, 0, cellSize * 0.17 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(Math.PI / 4);
    roundRect(-cellSize * 0.105, -cellSize * 0.105, cellSize * 0.21, cellSize * 0.21, 3);
    ctx.stroke();
    ctx.restore();
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
    return { line: 1, corner: 2, split: 3, wall: 4, cross: 10, filter: 8, converter: 9 }[type] ?? 0;
  }

  function conduitColor(tile) {
    if (tile.type === "filter") return COLORS[tile.color] ?? "rgba(255, 219, 142, 0.95)";
    if (tile.type === "converter") return COLORS[tile.color] ?? "rgba(255, 219, 142, 0.95)";
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
    const quality = fxIntensity();
    state.beams.segments.forEach((segment, index) => {
      const from = logicalPoint(segment.x1, segment.y1);
      const to = logicalPoint(segment.x2, segment.y2);
      const color = COLORS[segment.color];
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = board.cell * 0.16 * quality;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.22 + quality * 0.12;
      ctx.lineWidth = Math.max(9, board.cell * 0.125);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      ctx.globalAlpha = 0.9;
      ctx.lineWidth = Math.max(4, board.cell * 0.052);
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
      drawBeamSignature(segment.color, from, to, board.cell, time + index * 91);
      ctx.restore();
    });
  }

  function drawBeamSignature(colorName, from, to, cellSize, time) {
    if (colorName !== "cyan" && colorName !== "green") return;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    if (length < cellSize * 0.7) return;
    const count = calmFxActive() ? 1 : Math.min(3, Math.max(1, Math.floor(length / (cellSize * 1.45))));
    const angle = Math.atan2(dy, dx);
    const color = COLORS[colorName];
    const size = Math.max(4, cellSize * 0.052);
    ctx.save();
    ctx.globalAlpha = colorName === "cyan" ? 0.78 : 0.86;
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(6, 9, 10, 0.72)";
    ctx.lineWidth = Math.max(1, cellSize * 0.014);
    for (let i = 0; i < count; i += 1) {
      const t = (i + 1) / (count + 1);
      const wobble = Math.sin(time * 0.005 + i) * cellSize * 0.012;
      const x = from.x + dx * t + Math.cos(angle + Math.PI / 2) * wobble;
      const y = from.y + dy * t + Math.sin(angle + Math.PI / 2) * wobble;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      if (colorName === "cyan") {
        ctx.rotate(Math.PI / 4);
        roundRect(-size, -size, size * 2, size * 2, 2);
      } else {
        ctx.beginPath();
        ctx.moveTo(size * 1.35, 0);
        ctx.lineTo(-size * 0.9, -size);
        ctx.lineTo(-size * 0.9, size);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
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
      ctx.shadowBlur = (active ? board.cell * 0.34 : board.cell * 0.08) * fxIntensity();
      ctx.fillStyle = active ? color : "rgba(209, 206, 190, 0.5)";
      ctx.strokeStyle = active ? "rgba(255, 255, 255, 0.75)" : "rgba(216, 183, 108, 0.36)";
      ctx.lineWidth = Math.max(1, board.cell * 0.024);
      roundRect(-radius, -radius, radius * 2, radius * 2, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      drawColorMark(target.color, center, board.cell, active);
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
    ctx.globalAlpha = calmFxActive() ? 0.22 : 0.48;
    ctx.shadowColor = color;
    ctx.shadowBlur = radius * 0.45 * fxIntensity();
    const count = calmFxActive() ? 3 : 6;
    for (let i = 0; i < count; i += 1) {
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
    const level = getLevel();
    level.sources.forEach((source) => {
      const origin = sourcePoint(source, level);
      const center = logicalPoint(origin.x, origin.y);
      const color = COLORS[source.color];
      const pulse = 0.9 + Math.sin(time * 0.006 + source.x + source.y) * 0.08;
      drawFlare(flareIndex(source.color, 0), center, board.cell * 1.06, 0.18, time * 0.0009);
      drawRotatedElementIcon(elementIconIndex(source.color, "source"), center, board.cell * 0.78, source.dir, 0.46);
      drawSourcePort(center, color, board.cell, time);
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(source.dir * (Math.PI / 2));
      ctx.shadowColor = color;
      ctx.shadowBlur = board.cell * 0.24 * fxIntensity();
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
      drawColorMark(source.color, center, board.cell, true);
    });
  }

  function drawSourcePort(center, color, cellSize, time) {
    const radius = cellSize * (0.18 + Math.sin(time * 0.006) * 0.012);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = color;
    ctx.shadowBlur = cellSize * 0.16 * fxIntensity();
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
    ctx.lineWidth = Math.max(1, cellSize * 0.025);
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawColorMark(colorName, center, cellSize, active = false) {
    const color = COLORS[colorName];
    const size = cellSize * (active ? 0.085 : 0.072);
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(4, 7, 8, 0.78)";
    ctx.lineWidth = Math.max(1, cellSize * 0.016);
    ctx.shadowColor = color;
    ctx.shadowBlur = cellSize * 0.08 * fxIntensity();
    if (colorName === "cyan") {
      ctx.rotate(Math.PI / 4);
      roundRect(-size, -size, size * 2, size * 2, 2);
    } else if (colorName === "green") {
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.35);
      ctx.lineTo(size * 1.22, size * 0.95);
      ctx.lineTo(-size * 1.22, size * 0.95);
      ctx.closePath();
    } else if (colorName === "amber") {
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.15, 0, Math.PI * 2);
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.88, size * 1.3, Math.PI / 5, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawSelection(time) {
    const board = boardRect();
    const tile = state.grid[state.selected.y]?.[state.selected.x];
    if (!tile || tile.type === "wall") return;
    const x = board.x + state.selected.x * board.cell;
    const y = board.y + state.selected.y * board.cell;
    const inset = board.cell * 0.07 + Math.sin(time * 0.005) * 1.5;
    ctx.save();
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = Math.max(2, board.cell * 0.03);
    ctx.shadowColor = "rgba(102, 232, 255, 0.55)";
    ctx.shadowBlur = board.cell * 0.14 * fxIntensity();
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
  nodes.fx?.addEventListener("click", () => {
    state.fxMode = state.fxMode === "calm" ? "full" : "calm";
    state.board = null;
    state.lastFrameTime = 0;
    saveFxMode();
    playSound("click");
    updateDom();
    draw(performance.now());
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
    const frameMs = calmFxActive() ? CALM_FRAME_MS : FULL_FRAME_MS;
    if (!state.lastFrameTime || time - state.lastFrameTime >= frameMs) {
      state.lastFrameTime = time;
      draw(time);
    }
    requestAnimationFrame(animate);
  }

  function getRenderMetrics() {
    fitCanvas();
    const level = getLevel();
    const board = boardRect();
    const bounds = levelVisualBounds(level);
    const visual = {
      top: board.y + bounds.minY * board.cell,
      bottom: board.y + bounds.maxY * board.cell,
      left: board.x + bounds.minX * board.cell,
      right: board.x + bounds.maxX * board.cell
    };
    return {
      levelIndex: state.levelIndex,
      levelId: level.id,
      levelName: level.name,
      canvas: {
        width: Math.round(state.canvasWidth),
        height: Math.round(state.canvasHeight)
      },
      board: {
        top: Math.round(board.y),
        bottom: Math.round(board.y + board.size),
        cell: Number(board.cell.toFixed(2))
      },
      visual: {
        top: Math.round(visual.top),
        bottom: Math.round(visual.bottom),
        bottomSafePx: Math.round(state.canvasHeight - visual.bottom)
      },
      targets: level.targets.map((target) => {
        const bottom = board.y + (target.y + 0.5 + VISUAL_BLEED.target) * board.cell;
        return {
          color: target.color,
          x: target.x,
          y: target.y,
          bottomSafePx: Math.round(state.canvasHeight - bottom)
        };
      })
    };
  }

  window.LumenLock = {
    loadLevel,
    resetLevel,
    rotateCell,
    nextLevel,
    getLevelCount: () => LEVELS.length,
    getRenderMetrics,
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
