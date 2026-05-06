(() => {
  "use strict";

  const TILE = 32;
  const MAP_COLS = 232;
  const MAP_ROWS = 18;
  const GRAVITY = 2100;
  const MAX_FALL = 980;
  const WALK_SPEED = 235;
  const RUN_SPEED = 335;
  const GROUND_ACCEL = 3000;
  const AIR_ACCEL = 1900;
  const FRICTION = 2800;
  const JUMP_SPEED = 690;
  const DOUBLE_JUMP_SPEED = 640;
  const TRIPLE_JUMP_SPEED = 675;
  const RING_BOOST_SPEED = 760;
  const DASH_SPEED = 640;
  const DASH_TIME = 0.18;
  const MAX_JUMPS = 3;
  const MAX_DASHES = 1;
  const STAR_POWER_TIME = 6.5;
  const STOMP_COMBO_WINDOW = 1.1;
  const COYOTE_TIME = 0.105;
  const JUMP_BUFFER = 0.13;
  const DASH_BUFFER = 0.18;
  const TOUCH_ZONE_DEADZONE = 16;
  const GLIDER_POWER_TIME = 14;
  const PIPE_WARP_COOLDOWN = 0.85;
  const CANNON_LAUNCH_COOLDOWN = 1.05;
  const MEGA_ROCKET_SPEED = 230;
  const GRAPHIC_PATHS = {
    bgFar: "assets/gfx/bg-far.svg",
    bgMid: "assets/gfx/bg-mid.svg",
    bgNear: "assets/gfx/bg-near.svg",
    aeroRing: "assets/gfx/aero-ring.svg",
    skyShard: "assets/gfx/sky-shard.svg",
    importTiles: "assets/imported/gfx/imagen-tile-map.png",
    importPlayer: "assets/imported/gfx/imagen-player-map.png",
    importEnemies: "assets/imported/gfx/imagen-enemy-map.png",
    importObjects: "assets/imported/gfx/imagen-object-map.png",
    importCloudBank: "assets/imported/gfx/workspace-cloud-bank.png",
    originalTiles: "assets/original/gfx/original-tileset.png",
    originalSprites: "assets/original/gfx/original-sprite-map.png",
    originalBackground: "assets/original/gfx/original-background-map.png",
    hdAtlas: "assets/imagen-hd/gfx/hd-imagen-atlas.png",
    hdAtlasRaw: "assets/imagen-hd/gfx/hd-imagen-atlas.png",
    mascotAtlas: "assets/imagen-hd/gfx/hd-mascot-platformer-atlas.png",
    mascotAtlasRaw: "assets/imagen-hd/gfx/hd-mascot-platformer-atlas.png",
    cleanGameplayAtlas: "assets/imagen-hd/gfx/hd-clean-gameplay-atlas.png",
    playfieldTileset: "assets/imagen-hd/gfx/hd-playfield-tileset-imagen.png",
    themeHazardAtlas: "assets/imagen-hd/gfx/hd-theme-hazard-atlas-imagen.png",
    undergroundBossAtlas: "assets/imagen-hd/gfx/hd-underground-boss-atlas-imagen.png",
    repeatBackground: "assets/imagen-hd/gfx/hd-repeatable-background-imagen.png",
  };
  const BLACK_KEY_GRAPHICS = new Set(["importPlayer", "importEnemies", "importObjects"]);
  const LIGHT_KEY_GRAPHICS = new Set(["hdAtlas"]);
  const FRAME_KEY_GRAPHICS = new Set(["mascotAtlas", "cleanGameplayAtlas", "playfieldTileset", "themeHazardAtlas", "undergroundBossAtlas"]);
  const ASSET_MAP = {
    tileAsset: "mascotAtlas",
    spriteAsset: "mascotAtlas",
    cleanAsset: "cleanGameplayAtlas",
    playfieldAsset: "playfieldTileset",
    themeAsset: "themeHazardAtlas",
    undergroundAsset: "undergroundBossAtlas",
    backgroundAsset: "repeatBackground",
    backgroundFrame: null,
    backgroundRepeat: "mirror-x",
    backgroundLayers: [
      { name: "skyClouds", frame: [0, 0, 1774, 520], y: 0, h: 0.72, speed: 0.025, alpha: 1 },
      { name: "farHills", frame: [0, 340, 1774, 310], y: 0.34, h: 0.42, speed: 0.09, alpha: 0.94, fadeTop: 96, fadeBottom: 36 },
      { name: "nearHills", frame: [0, 500, 1774, 270], y: 0.53, h: 0.38, speed: 0.2, alpha: 0.98, fadeTop: 72, fadeBottom: 32 },
      { name: "foregroundFoliage", frame: [0, 650, 1774, 237], y: 0.7, h: 0.33, speed: 0.42, alpha: 1, fadeTop: 72 },
    ],
    tileFrames: {
      G: [14, 96, 112, 126],
      D: [127, 96, 108, 126],
      B: [237, 96, 102, 114],
      Q: [340, 96, 104, 114],
      U: [445, 96, 110, 114],
      P: [554, 116, 116, 82],
      S: [678, 96, 110, 118],
    },
    playerFrames: {
      idle: [14, 250, 151, 204],
      run0: [170, 250, 151, 204],
      run1: [324, 250, 151, 204],
      jump: [480, 250, 146, 204],
      fall: [629, 250, 154, 204],
      hurt: [787, 250, 149, 204],
      triple: [939, 250, 153, 204],
      dash: [1097, 250, 144, 204],
    },
    enemyFrames: [
      [684, 484, 128, 152],
      [815, 484, 140, 152],
      [963, 484, 136, 152],
      [684, 484, 128, 152],
    ],
    cleanFrames: {
      beetle: [50, 91, 412, 330],
      cloudTile: [540, 149, 456, 213],
      finishFlag: [1141, 13, 277, 486],
      checkpointFlag: [1653, 70, 277, 372],
    },
    playfieldFrames: {
      grass: [52, 68, 408, 376],
      dirt: [564, 57, 408, 398],
      brick: [1076, 64, 408, 383],
      bonus: [1589, 52, 405, 408],
      used: [101, 564, 310, 408],
      pipeTop: [553, 639, 430, 258],
      pipeShaft: [1100, 592, 360, 352],
      cloudTile: [1580, 653, 424, 230],
      piranhaUp: [106, 1050, 300, 460],
      piranhaDown: [577, 1120, 381, 320],
      flagA: [1115, 1089, 330, 382],
      flagB: [1627, 1087, 330, 385],
    },
    playfieldTileFrames: {
      G: "grass",
      D: "dirt",
      B: "brick",
      Q: "bonus",
      U: "used",
      W: "cloudTile",
      I: "pipeTop",
      J: "pipeShaft",
    },
    themeFrames: {
      meadowBlock: [53, 65, 406, 381],
      cloudBlock: [557, 136, 421, 240],
      pipeTop: [1100, 126, 360, 260],
      pipeShaft: [1630, 51, 323, 410],
      piranhaTall: [118, 530, 276, 476],
      piranhaBite: [604, 573, 328, 390],
      piranhaClosed: [1093, 595, 373, 345],
      blueBeetle: [1603, 603, 377, 330],
      caveBlock: [61, 1075, 389, 410],
      palaceBlock: [569, 1075, 397, 410],
      meadowBg: [1084, 1065, 391, 430],
      caveBg: [1597, 1065, 389, 430],
    },
    undergroundFrames: {
      undergroundBlock: [0, 0, 313, 418],
      bonusPipe: [313, 0, 314, 418],
      cannonPipe: [627, 0, 313, 418],
      megaRocket: [940, 0, 314, 418],
      gliderSuit: [0, 418, 313, 418],
      airshipHull: [313, 418, 314, 418],
      shellBossIdle: [627, 418, 313, 418],
      shellBossAttack: [940, 418, 314, 418],
      undergroundBg: [0, 836, 313, 418],
      airshipBg: [313, 836, 314, 418],
      cannonBurst: [627, 836, 313, 418],
      pipeValve: [940, 836, 314, 418],
    },
    objectFrames: {
      gem: [324, 484, 106, 152],
      portal: [1126, 484, 116, 152],
      chest: [553, 484, 128, 152],
      heart: [438, 484, 108, 152],
      star: [340, 96, 104, 114],
      coin0: [14, 484, 106, 152],
      coin1: [124, 484, 90, 152],
      coin2: [214, 484, 106, 152],
      coin3: [124, 484, 90, 152],
    },
  };
  const AUDIO_PATHS = {
    jump: "assets/audio/jump.wav",
    doubleJump: "assets/audio/double-jump.wav",
    tripleJump: "assets/audio/double-jump.wav",
    coin: "assets/imported/audio/workspace-pickup.wav",
    shard: "assets/imported/audio/workspace-pickup.wav",
    ring: "assets/imported/audio/workspace-gate.wav",
    spring: "assets/audio/spring.wav",
    stomp: "assets/imported/audio/workspace-hit.wav",
    hurt: "assets/imported/audio/workspace-hurt.wav",
    bump: "assets/audio/bump.wav",
    checkpoint: "assets/imported/audio/workspace-gate.wav",
    win: "assets/imported/audio/workspace-gate.wav",
  };
  const LEVELS = [
    { name: "Meadow Gate", theme: "meadow", bgm: "assets/downloads/audio/pixel-quest-parade.mp3" },
    { name: "Cloud Lift Climb", theme: "sky", bgm: "assets/downloads/audio/skygarden-march.mp3" },
    { name: "Flag Rush Gauntlet", theme: "cave", bgm: "assets/downloads/audio/pixel-boss-rush.mp3" },
    { name: "Pipeworks Airship Siege", theme: "underground", bgm: "assets/downloads/audio/mossy-warp-zone.mp3" },
  ];

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const gameShell = document.querySelector(".game-shell");
  const overlay = document.getElementById("overlay");
  const overlayKicker = document.getElementById("overlayKicker");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const primaryButton = document.getElementById("primaryButton");
  const pauseButton = document.getElementById("pauseButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const restartButton = document.getElementById("restartButton");
  const hudCoins = document.getElementById("hudCoins");
  const hudShards = document.getElementById("hudShards");
  const hudRelics = document.getElementById("hudRelics");
  const hudLives = document.getElementById("hudLives");
  const hudLevel = document.getElementById("hudLevel");
  const hudAir = document.getElementById("hudAir");
  const hudDash = document.getElementById("hudDash");
  const hudPower = document.getElementById("hudPower");
  const hudTime = document.getElementById("hudTime");

  const view = { w: 960, h: 540, cssW: 960, cssH: 540, dpr: 1, zoom: 1 };
  const input = {
    left: false,
    right: false,
    run: false,
    jump: false,
    down: false,
    jumpPressed: false,
    dashPressed: false,
  };
  const keyHolds = { left: false, right: false, run: false, jump: false, down: false };
  const touchHolds = {
    left: new Set(),
    right: new Set(),
    run: new Set(),
    jump: new Set(),
    down: new Set(),
  };
  const screenPointers = new Map();

  const solidTiles = new Set(["G", "D", "B", "Q", "U", "P", "S", "W", "I", "J", "A"]);
  const decorTiles = new Set(["a", "f", "v", "x"]);
  const keyMap = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    ShiftLeft: "run",
    ShiftRight: "run",
    KeyK: "run",
    Space: "jump",
    ArrowUp: "jump",
    KeyW: "jump",
    ArrowDown: "down",
    KeyS: "down",
  };

  let tileAtlas;
  let spriteAtlas;
  let imageAssets = {};
  let audioAssets = {};
  let bgmTrack = null;
  let bgmTracks = [];
  let audioContext = null;
  let world;
  let game;
  let player;
  let lastTime = performance.now();
  let backgroundLayerCanvas = null;
  let backgroundLayerContext = null;

  boot();

  function boot() {
    loadLocalAssets();
    tileAtlas = createTileAtlas();
    spriteAtlas = createSpriteAtlas();
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    wireControls();
    newRun(false);
    showOverlay("Neues Jump-and-run", "Super Tile Hopper", "Die Wolkentore warten.", "Start", () => {
      unlockAudio();
      newRun(true);
    });
    requestAnimationFrame(frame);
  }

  function loadLocalAssets() {
    imageAssets = {};
    for (const [key, src] of Object.entries(GRAPHIC_PATHS)) {
      const image = new Image();
      image.decoding = "async";
      image.addEventListener("load", () => {
        if (BLACK_KEY_GRAPHICS.has(key)) {
          imageAssets[key] = keyBlackToAlpha(image);
        } else if (FRAME_KEY_GRAPHICS.has(key)) {
          imageAssets[key] = keyFramesToAlpha(image, atlasFramesForKey(key));
        } else if (LIGHT_KEY_GRAPHICS.has(key)) {
          imageAssets[key] = keyLightToAlpha(image);
        }
      });
      image.src = src;
      imageAssets[key] = image;
    }

    audioAssets = {};
    for (const [key, src] of Object.entries(AUDIO_PATHS)) {
      if (key === "bgm") continue;
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.volume = key === "hurt" ? 0.32 : 0.44;
      audioAssets[key] = audio;
    }

    bgmTracks = LEVELS.map((level) => {
      const audio = new Audio(level.bgm);
      audio.preload = "auto";
      audio.loop = true;
      audio.volume = 0.22;
      return audio;
    });
    bgmTrack = bgmTracks[0] || null;
  }

  function atlasFramesForKey(key) {
    if (key === ASSET_MAP.cleanAsset) return Object.values(ASSET_MAP.cleanFrames);
    if (key === ASSET_MAP.playfieldAsset) return Object.values(ASSET_MAP.playfieldFrames);
    if (key === ASSET_MAP.themeAsset) return Object.values(ASSET_MAP.themeFrames);
    if (key === ASSET_MAP.undergroundAsset) return Object.values(ASSET_MAP.undergroundFrames);
    if (key !== ASSET_MAP.tileAsset && key !== ASSET_MAP.spriteAsset) return [];
    return [
      ...Object.values(ASSET_MAP.tileFrames),
      ...Object.values(ASSET_MAP.playerFrames),
      ...ASSET_MAP.enemyFrames,
      ...Object.values(ASSET_MAP.objectFrames),
    ].filter(Boolean);
  }

  function keyBlackToAlpha(image) {
    const w = image.naturalWidth || image.width;
    const h = image.naturalHeight || image.height;
    const keyed = document.createElement("canvas");
    keyed.width = w;
    keyed.height = h;
    const k = keyed.getContext("2d");
    k.imageSmoothingEnabled = false;
    k.drawImage(image, 0, 0);
    try {
      const pixels = k.getImageData(0, 0, w, h);
      const data = pixels.data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 7 && data[i + 1] < 7 && data[i + 2] < 7) {
          data[i + 3] = 0;
        }
      }
      k.putImageData(pixels, 0, 0);
      return keyed;
    } catch {
      return image;
    }
  }

  function keyLightToAlpha(image) {
    const w = image.naturalWidth || image.width;
    const h = image.naturalHeight || image.height;
    const keyed = document.createElement("canvas");
    keyed.width = w;
    keyed.height = h;
    const k = keyed.getContext("2d");
    k.imageSmoothingEnabled = false;
    k.drawImage(image, 0, 0);
    try {
      const pixels = k.getImageData(0, 0, w, h);
      const data = pixels.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const isSheetBackground = r > 232 && g > 226 && b > 212;
        if (isSheetBackground) data[i + 3] = 0;
      }
      k.putImageData(pixels, 0, 0);
      return keyed;
    } catch {
      return image;
    }
  }

  function keyFramesToAlpha(image, frames) {
    const w = image.naturalWidth || image.width;
    const h = image.naturalHeight || image.height;
    const keyed = document.createElement("canvas");
    keyed.width = w;
    keyed.height = h;
    const k = keyed.getContext("2d");
    k.imageSmoothingEnabled = false;
    k.drawImage(image, 0, 0);
    try {
      const pixels = k.getImageData(0, 0, w, h);
      const data = pixels.data;
      for (const frame of frames) floodClearFrameBackground(data, w, h, frame);
      k.putImageData(pixels, 0, 0);
      return keyed;
    } catch {
      return image;
    }
  }

  function floodClearFrameBackground(data, imageW, imageH, frame) {
    const x0 = Math.max(0, Math.floor(frame[0]));
    const y0 = Math.max(0, Math.floor(frame[1]));
    const x1 = Math.min(imageW, Math.ceil(frame[0] + frame[2]));
    const y1 = Math.min(imageH, Math.ceil(frame[1] + frame[3]));
    const fw = x1 - x0;
    const fh = y1 - y0;
    if (fw <= 0 || fh <= 0) return;

    const seen = new Uint8Array(fw * fh);
    const stack = [];
    const push = (x, y) => {
      const lx = x - x0;
      const ly = y - y0;
      const local = ly * fw + lx;
      if (seen[local]) return;
      seen[local] = 1;
      const i = (y * imageW + x) * 4;
      if (!isImagenSheetBackground(data, i)) return;
      data[i + 3] = 0;
      stack.push([x, y]);
    };

    for (let x = x0; x < x1; x += 1) {
      push(x, y0);
      push(x, y1 - 1);
    }
    for (let y = y0 + 1; y < y1 - 1; y += 1) {
      push(x0, y);
      push(x1 - 1, y);
    }

    while (stack.length) {
      const [x, y] = stack.pop();
      if (x > x0) push(x - 1, y);
      if (x < x1 - 1) push(x + 1, y);
      if (y > y0) push(x, y - 1);
      if (y < y1 - 1) push(x, y + 1);
    }
  }

  function isImagenSheetBackground(data, i) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    return r > 226 && g > 218 && b > 198 && spread < 58;
  }

  function isImageReady(asset) {
    return Boolean(asset && ((asset.complete && asset.naturalWidth) || asset.width));
  }

  function imageWidth(asset) {
    return asset.naturalWidth || asset.width || 0;
  }

  function imageHeight(asset) {
    return asset.naturalHeight || asset.height || 0;
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.cssW = Math.max(320, Math.floor(rect.width));
    view.cssH = Math.max(240, Math.floor(rect.height));
    view.zoom = view.cssW >= 900 && view.cssH >= 560 ? 1.14 : view.cssW >= 700 ? 1.08 : 1;
    view.w = Math.max(320, Math.floor(view.cssW / view.zoom));
    view.h = Math.max(240, Math.floor(view.cssH / view.zoom));
    canvas.width = Math.floor(view.cssW * view.dpr);
    canvas.height = Math.floor(view.cssH * view.dpr);
    ctx.setTransform(view.dpr * view.zoom, 0, 0, view.dpr * view.zoom, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function wireControls() {
    window.addEventListener("keydown", (event) => {
      if (event.code === "KeyP" || event.code === "Escape") {
        event.preventDefault();
        togglePause();
        return;
      }
      if (event.code === "KeyR") {
        event.preventDefault();
        newRun(true);
        return;
      }
      const action = keyMap[event.code];
      if (!action) return;
      event.preventDefault();
      if (action === "jump" && !input.jump && !event.repeat) {
        input.jumpPressed = true;
      }
      if (action === "run" && !input.run && !event.repeat) {
        bufferDash();
      }
      keyHolds[action] = true;
      syncInputAction(action);
    });

    window.addEventListener("keyup", (event) => {
      const action = keyMap[event.code];
      if (!action) return;
      event.preventDefault();
      keyHolds[action] = false;
      syncInputAction(action);
      if (action === "jump" && player && player.vy < -260) {
        player.vy *= 0.52;
      }
    });

    document.querySelectorAll("[data-action]").forEach((button) => {
      const action = button.dataset.action;
      const press = (event) => {
        event.preventDefault();
        try {
          button.setPointerCapture?.(event.pointerId);
        } catch {}
        button.classList.add("is-active");
        pressTouchAction(action, event.pointerId);
        unlockAudio();
      };
      const release = (event) => {
        event.preventDefault();
        releaseTouchAction(action, event.pointerId);
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", (event) => {
        releaseTouchAction(action, event.pointerId, false);
      });
    });

    wireScreenTouchZones();

    pauseButton.addEventListener("click", () => {
      unlockAudio();
      togglePause();
    });
    fullscreenButton?.addEventListener("click", () => {
      unlockAudio();
      toggleFullscreen();
    });
    document.addEventListener("fullscreenchange", syncFullscreenButton);
    restartButton.addEventListener("click", () => {
      unlockAudio();
      newRun(true);
    });
  }

  function wireScreenTouchZones() {
    gameShell.addEventListener("contextmenu", (event) => event.preventDefault());
    gameShell.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
      if (event.target.closest?.(".hud, .overlay, .touch-pad")) return;
      event.preventDefault();
      try {
        gameShell.setPointerCapture?.(event.pointerId);
      } catch {}
      unlockAudio();

      const rect = gameShell.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      if (localX < rect.width * 0.52) {
        const action = localX < rect.width * 0.26 ? "left" : "right";
        screenPointers.set(event.pointerId, {
          type: "move",
          action,
          startX: event.clientX,
          startY: event.clientY,
        });
        pressTouchAction(action, `screen-${event.pointerId}`);
      } else {
        screenPointers.set(event.pointerId, {
          type: "action",
          startX: event.clientX,
          startY: event.clientY,
          didDash: false,
          didDown: false,
        });
        pressTouchAction("jump", `screen-${event.pointerId}`);
        if (localY > rect.height * 0.64) bufferDash();
      }
    });

    gameShell.addEventListener("pointermove", (event) => {
      const pointer = screenPointers.get(event.pointerId);
      if (!pointer) return;
      event.preventDefault();
      if (pointer.type === "move") {
        const dx = event.clientX - pointer.startX;
        const nextAction = Math.abs(dx) < TOUCH_ZONE_DEADZONE ? pointer.action : dx < 0 ? "left" : "right";
        if (nextAction !== pointer.action) {
          releaseTouchAction(pointer.action, `screen-${event.pointerId}`, false);
          pointer.action = nextAction;
          pressTouchAction(pointer.action, `screen-${event.pointerId}`, false);
        }
      } else {
        const dx = event.clientX - pointer.startX;
        const dy = event.clientY - pointer.startY;
        const downId = `screen-down-${event.pointerId}`;
        const wantsDown = dy > 42 && Math.abs(dy) > Math.abs(dx) * 1.08;
        if (wantsDown && !pointer.didDown) {
          pointer.didDown = true;
          pressTouchAction("down", downId, false);
        } else if (!wantsDown && pointer.didDown) {
          pointer.didDown = false;
          releaseTouchAction("down", downId, false);
        }
        if (!pointer.didDash && Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy) * 1.25) {
          pointer.didDash = true;
          pressTouchAction("run", `screen-dash-${event.pointerId}`);
          bufferDash();
          window.setTimeout(() => releaseTouchAction("run", `screen-dash-${event.pointerId}`, false), 90);
        }
      }
    });

    const releaseScreenPointer = (event) => {
      const pointer = screenPointers.get(event.pointerId);
      if (!pointer) return;
      event.preventDefault();
      if (pointer.type === "move") {
        releaseTouchAction(pointer.action, `screen-${event.pointerId}`, false);
      } else {
        releaseTouchAction("jump", `screen-${event.pointerId}`);
        releaseTouchAction("run", `screen-dash-${event.pointerId}`, false);
        releaseTouchAction("down", `screen-down-${event.pointerId}`, false);
      }
      screenPointers.delete(event.pointerId);
    };
    gameShell.addEventListener("pointerup", releaseScreenPointer);
    gameShell.addEventListener("pointercancel", releaseScreenPointer);
    gameShell.addEventListener("lostpointercapture", releaseScreenPointer);
  }

  function pressTouchAction(action, pointerId, edge = true) {
    const wasHeld = input[action];
    touchHolds[action].add(pointerId);
    syncInputAction(action);
    if (edge && action === "jump" && !wasHeld) input.jumpPressed = true;
    if (edge && action === "run" && !wasHeld) bufferDash();
    syncTouchButtonState(action);
  }

  function releaseTouchAction(action, pointerId, cutJump = true) {
    touchHolds[action].delete(pointerId);
    syncInputAction(action);
    if (cutJump && action === "jump" && player && player.vy < -260) player.vy *= 0.58;
    syncTouchButtonState(action);
  }

  function syncInputAction(action) {
    input[action] = Boolean(keyHolds[action] || touchHolds[action].size);
  }

  function syncTouchButtonState(action) {
    document.querySelectorAll(`[data-action="${action}"]`).forEach((button) => {
      button.classList.toggle("is-active", touchHolds[action].size > 0);
    });
  }

  function bufferDash() {
    input.dashPressed = true;
    if (player) player.dashBuffer = DASH_BUFFER;
  }

  function toggleFullscreen() {
    if (!document.fullscreenEnabled) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
      return;
    }
    const target = gameShell || document.documentElement;
    target.requestFullscreen?.({ navigationUI: "hide" }).catch(() => {});
  }

  function syncFullscreenButton() {
    fullscreenButton?.classList.toggle("is-active", Boolean(document.fullscreenElement));
  }

  function newRun(startPlaying, requestedLevelIndex = game ? game.levelIndex : 0) {
    const levelIndex = clamp(Math.trunc(requestedLevelIndex || 0), 0, LEVELS.length - 1);
    world = buildWorld(levelIndex);
    player = createPlayer(world.start.x, world.start.y);
    game = {
      mode: startPlaying ? "playing" : "menu",
      levelIndex,
      levelName: world.levelName,
      totalLevels: LEVELS.length,
      lives: 3,
      collected: 0,
      totalCoins: world.coins.length + world.bonusCoins,
      shards: 0,
      totalShards: world.shards.length,
      relics: 0,
      totalRelics: world.relics.length,
      time: 0,
      cameraX: 0,
      cameraY: 0,
      shake: 0,
      checkpoint: { ...world.start },
      reachedCheckpointIds: new Set(),
      message: "",
      messageTimer: 0,
    };
    setBgmForLevel(levelIndex);
    clearInputEdges();
    updateHud();
    if (startPlaying) {
      hideOverlay();
      startBgm();
    } else {
      pauseBgm();
    }
  }

  function createPlayer(x, y) {
    return {
      x,
      y,
      w: 23,
      h: 34,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      coyote: 0,
      jumpBuffer: 0,
      jumpsLeft: MAX_JUMPS - 1,
      dashesLeft: MAX_DASHES,
      dashTimer: 0,
      dashBuffer: 0,
      invulnerable: 0,
      anim: 0,
      hurtPulse: 0,
      doubleJumpFlash: 0,
      starTimer: 0,
      gliderTimer: 0,
      combo: 0,
      comboTimer: 0,
    };
  }

  function frame(now) {
    const dt = Math.min(0.033, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function update(dt) {
    if (!game || game.mode !== "playing") return;
    game.time += dt;
    game.shake = Math.max(0, game.shake - dt * 28);
    game.messageTimer = Math.max(0, game.messageTimer - dt);
    if (input.jumpPressed) {
      player.jumpBuffer = JUMP_BUFFER;
      input.jumpPressed = false;
    }
    if (input.dashPressed) {
      player.dashBuffer = DASH_BUFFER;
      input.dashPressed = false;
    }
    player.dashBuffer = Math.max(0, player.dashBuffer - dt);

    updateMovingPlatforms(dt);
    updatePlayer(dt);
    if (player.dashBuffer > 0 && tryStartDash()) player.dashBuffer = 0;
    updateEnemies(dt);
    updatePiranhas(dt);
    updateBonusPipes(dt);
    updateCannonPipes(dt);
    updateMegaRockets(dt);
    updateShellBosses(dt);
    updateCoins(dt);
    updateShardsAndRings(dt);
    updateSuitPowerups(dt);
    updatePickupsAndGoals();
    updateEffects(dt);
    updateCamera(dt);
    updateHud();
  }

  function updatePlayer(dt) {
    player.anim += dt;
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.hurtPulse = Math.max(0, player.hurtPulse - dt);
    player.doubleJumpFlash = Math.max(0, player.doubleJumpFlash - dt);
    player.dashTimer = Math.max(0, player.dashTimer - dt);
    player.starTimer = Math.max(0, player.starTimer - dt);
    player.gliderTimer = Math.max(0, player.gliderTimer - dt);
    player.comboTimer = Math.max(0, player.comboTimer - dt);
    if (player.comboTimer <= 0) player.combo = 0;
    if (player.grounded) {
      player.jumpsLeft = MAX_JUMPS - 1;
      player.dashesLeft = MAX_DASHES;
    }
    player.coyote = player.grounded ? COYOTE_TIME : Math.max(0, player.coyote - dt);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);

    const direction = Number(input.right) - Number(input.left);
    const hasGlider = player.gliderTimer > 0;
    const targetSpeed = player.starTimer > 0 ? RUN_SPEED + 86 : hasGlider && !player.grounded ? RUN_SPEED + 42 : input.run ? RUN_SPEED : WALK_SPEED;
    const accel = player.grounded ? GROUND_ACCEL : AIR_ACCEL;
    const previousY = player.y;
    if (player.dashTimer > 0) {
      player.vx = player.facing * DASH_SPEED;
    } else if (direction !== 0) {
      player.vx += direction * accel * dt;
      player.vx = clamp(player.vx, -targetSpeed, targetSpeed);
      player.facing = direction;
    } else {
      player.vx = approach(player.vx, 0, FRICTION * dt);
    }

    if (player.jumpBuffer > 0) {
      if (player.coyote > 0) {
        performJump("ground");
      } else if (player.jumpsLeft > 0) {
        performJump("double");
      }
    }

    const gliding = hasGlider && input.jump && !player.grounded && player.vy > 35 && player.dashTimer <= 0;
    const gravityBoost = !input.jump && player.vy < 0 ? 1.55 : 1;
    const gravityScale = gliding ? 0.24 : player.dashTimer > 0 ? 0.18 : gravityBoost;
    const fallCap = gliding ? 245 : MAX_FALL;
    player.vy = Math.min(fallCap, player.vy + GRAVITY * gravityScale * dt);
    if (gliding && direction !== 0) {
      player.vx = clamp(player.vx + direction * AIR_ACCEL * 0.18 * dt, -RUN_SPEED - 58, RUN_SPEED + 58);
    }

    moveWithTiles(player, player.vx * dt, 0, {
      onHorizontalHit: () => {
        player.vx = 0;
      },
    });

    player.grounded = false;
    moveWithTiles(player, 0, player.vy * dt, {
      onGroundTile: (tile) => {
        if (tile.ch === "S") {
          player.y = tile.ty * TILE - player.h - 0.01;
          player.vy = -860;
          player.grounded = false;
          player.coyote = 0;
          player.jumpsLeft = MAX_JUMPS - 1;
          player.dashesLeft = MAX_DASHES;
          player.doubleJumpFlash = 0.25;
          game.shake = Math.max(game.shake, 4);
          spawnSpark(tile.tx * TILE + TILE * 0.5, tile.ty * TILE + 5, "#9bfff1", 12);
          playSound("spring");
          return "bounce";
        }
        player.vy = 0;
        player.grounded = true;
        player.jumpsLeft = MAX_JUMPS - 1;
        player.dashesLeft = MAX_DASHES;
        return "land";
      },
      onCeilingTile: (tile) => {
        player.vy = 0;
        bumpTile(tile.tx, tile.ty, tile.ch);
      },
    });
    resolveMovingPlatforms(previousY);

    if (player.y > world.height + 180) {
      hurtPlayer(true);
    }
  }

  function updateMovingPlatforms(dt) {
    for (const platform of world.platforms) {
      platform.prevX = platform.x;
      platform.prevY = platform.y;
      platform.phase += dt * platform.speed;
      const wave = Math.sin(platform.phase);
      platform.x = platform.baseX + platform.moveX * wave;
      platform.y = platform.baseY + platform.moveY * wave;
      platform.dx = platform.x - platform.prevX;
      platform.dy = platform.y - platform.prevY;
    }
  }

  function resolveMovingPlatforms(previousY) {
    const previousBottom = previousY + player.h;
    const currentBottom = player.y + player.h;
    for (const platform of world.platforms) {
      const withinX = player.x + player.w > platform.x + 4 && player.x < platform.x + platform.w - 4;
      const crossingTop = previousBottom <= platform.y + Math.max(8, Math.abs(platform.dy) + 5) && currentBottom >= platform.y;
      if (player.vy >= 0 && withinX && crossingTop && player.y < platform.y) {
        player.y = platform.y - player.h - 0.01;
        player.x += platform.dx;
        player.vy = 0;
        player.grounded = true;
        player.jumpsLeft = MAX_JUMPS - 1;
        player.dashesLeft = MAX_DASHES;
        return;
      }
    }

  }

  function performJump(kind) {
    const isDouble = kind === "double";
    const isFinalAirJump = isDouble && player.jumpsLeft === 1;
    player.vy = isDouble ? (isFinalAirJump ? -TRIPLE_JUMP_SPEED : -DOUBLE_JUMP_SPEED) : -JUMP_SPEED;
    player.grounded = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
    if (isDouble) {
      player.jumpsLeft = Math.max(0, player.jumpsLeft - 1);
      player.doubleJumpFlash = isFinalAirJump ? 0.65 : 0.42;
      spawnSpark(player.x + player.w * 0.5, player.y + player.h * 0.46, isFinalAirJump ? "#ffd35a" : "#9bfff1", isFinalAirJump ? 22 : 14);
      popDust(player.x + player.w * 0.5, player.y + player.h, isFinalAirJump ? 7 : 4);
      if (isFinalAirJump) showGameMessage("Triple jump");
      playSound(isFinalAirJump ? "tripleJump" : "doubleJump");
    } else {
      player.jumpsLeft = MAX_JUMPS - 1;
      popDust(player.x + player.w * 0.5, player.y + player.h, 8);
      playSound("jump");
    }
  }

  function tryStartDash() {
    if (!player || player.dashesLeft <= 0 || player.dashTimer > 0 || player.grounded) return false;
    const direction = Number(input.right) - Number(input.left) || player.facing || 1;
    player.facing = direction > 0 ? 1 : -1;
    player.dashesLeft -= 1;
    player.dashTimer = DASH_TIME;
    player.vx = player.facing * DASH_SPEED;
    player.vy = Math.min(player.vy, -72);
    player.doubleJumpFlash = 0.35;
    game.shake = Math.max(game.shake, 4);
    spawnSpark(player.x + player.w * 0.5, player.y + player.h * 0.5, "#ffd35a", 18);
    spawnText(player.x + player.w * 0.5, player.y - 10, "Dash");
    playSound("ring");
    return true;
  }

  function updateEnemies(dt) {
    for (const enemy of world.enemies) {
      if (!enemy.active) continue;
      if (Math.abs(enemy.x - player.x) > view.w * 1.35) continue;

      enemy.anim += dt;
      enemy.vy = Math.min(MAX_FALL, enemy.vy + GRAVITY * dt);
      moveWithTiles(enemy, enemy.vx * dt, 0, {
        onHorizontalHit: () => {
          enemy.vx *= -1;
        },
      });

      enemy.grounded = false;
      moveWithTiles(enemy, 0, enemy.vy * dt, {
        onGroundTile: () => {
          enemy.vy = 0;
          enemy.grounded = true;
          return "land";
        },
      });

      if (enemy.grounded) {
        const ahead = enemy.vx > 0 ? enemy.x + enemy.w + 3 : enemy.x - 3;
        const floorY = enemy.y + enemy.h + 4;
        if (!isSolidAtWorld(ahead, floorY)) {
          enemy.vx *= -1;
        }
      }

      if (rectsOverlap(player, enemy)) {
        if (player.starTimer > 0) {
          defeatEnemy(enemy, "rush");
          continue;
        }
        if (player.invulnerable > 0) continue;
        const playerBottom = player.y + player.h;
        const stomp = player.vy > 120 && playerBottom - enemy.y < 24;
        if (stomp) {
          player.vy = -440;
          player.grounded = false;
          player.jumpsLeft = MAX_JUMPS - 1;
          player.dashesLeft = MAX_DASHES;
          player.doubleJumpFlash = 0.2;
          defeatEnemy(enemy, "stomp");
        } else {
          hurtPlayer(false);
        }
      }
    }
  }

  function updatePiranhas(dt) {
    for (const piranha of world.piranhas) {
      piranha.anim += dt;
      const hitbox = piranhaHitbox(piranha);
      if (rectsOverlap(player, hitbox)) {
        if (player.starTimer > 0) {
          piranha.stunned = 1.6;
          spawnSpark(hitbox.x + hitbox.w * 0.5, hitbox.y + hitbox.h * 0.4, "#54d682", 18);
          spawnText(hitbox.x + hitbox.w * 0.5, hitbox.y - 4, "Chomp");
          playSound("stomp");
        } else if (player.invulnerable <= 0) {
          hurtPlayer(false);
        }
      }
      piranha.stunned = Math.max(0, piranha.stunned - dt);
    }
  }

  function piranhaRise(piranha) {
    if (piranha.stunned > 0) return 0;
    const cycle = ((piranha.anim + piranha.phase) % 3.1) / 3.1;
    if (cycle < 0.22) return easeInOut(cycle / 0.22);
    if (cycle < 0.64) return 1;
    if (cycle < 0.86) return 1 - easeInOut((cycle - 0.64) / 0.22);
    return 0;
  }

  function piranhaHitbox(piranha) {
    const rise = piranhaRise(piranha);
    if (rise <= 0.08) {
      return { x: piranha.x + 18, y: piranha.pipeY, w: 28, h: 0 };
    }
    const h = 18 + 34 * rise;
    return {
      x: piranha.x + 18,
      y: piranha.pipeY - h + 4,
      w: 28,
      h,
    };
  }

  function updateBonusPipes(dt) {
    for (const pipe of world.bonusPipes) {
      pipe.cooldown = Math.max(0, pipe.cooldown - dt);
      if (!pipe.target || pipe.cooldown > 0) continue;
      if (!rectsOverlap(player, pipe)) continue;
      const wantsWarp = input.down || input.run || (player.grounded && Math.abs(player.vx) < 18 && player.y + player.h <= pipe.pipeY + 8);
      if (!wantsWarp) continue;
      for (const otherPipe of world.bonusPipes) otherPipe.cooldown = PIPE_WARP_COOLDOWN;
      spawnSpark(player.x + player.w * 0.5, player.y + player.h * 0.5, "#54d682", 16);
      player.x = pipe.target.spawnX;
      player.y = pipe.target.spawnY;
      player.vx = 0;
      player.vy = -150;
      player.grounded = false;
      player.coyote = 0;
      player.jumpsLeft = MAX_JUMPS - 1;
      player.dashesLeft = MAX_DASHES;
      player.invulnerable = Math.max(player.invulnerable, 0.35);
      game.cameraX = clamp(player.x - view.w * 0.35, 0, Math.max(0, world.width - view.w));
      game.cameraY = clamp(player.y - view.h * 0.55, 0, Math.max(0, world.height - view.h));
      spawnSpark(player.x + player.w * 0.5, player.y + player.h * 0.8, "#9bfff1", 24);
      showGameMessage("Pipe bonus");
      playSound("ring");
      return;
    }
  }

  function updateCannonPipes(dt) {
    for (const cannon of world.cannonPipes) {
      cannon.anim += dt;
      cannon.cooldown = Math.max(0, cannon.cooldown - dt);
      if (cannon.cooldown > 0 || !rectsOverlap(player, cannon)) continue;
      cannon.cooldown = CANNON_LAUNCH_COOLDOWN;
      player.x = cannon.x + 18;
      player.y = cannon.y - player.h + 22;
      player.vx = 675;
      player.vy = -820;
      player.grounded = false;
      player.coyote = 0;
      player.jumpsLeft = MAX_JUMPS - 1;
      player.dashesLeft = MAX_DASHES;
      player.doubleJumpFlash = 0.56;
      game.shake = Math.max(game.shake, 8);
      spawnSpark(cannon.x + cannon.w * 0.68, cannon.y + cannon.h * 0.28, "#fff0a6", 28);
      showGameMessage("Cannon launch");
      playSound("spring");
    }
  }

  function updateMegaRockets(dt) {
    for (const rocket of world.megaRockets) {
      if (!rocket.active) continue;
      rocket.anim += dt;
      rocket.x += rocket.vx * dt;
      if (rocket.life != null) rocket.life -= dt;
      if (rocket.life != null && rocket.life <= 0) {
        rocket.active = false;
        continue;
      }
      if (rocket.x < rocket.minX || rocket.x > rocket.maxX) {
        if (rocket.oneShot) {
          rocket.active = false;
        } else {
          rocket.x = rocket.homeX + randomRange(0, 120);
        }
      }
      const hitbox = megaRocketHitbox(rocket);
      if (!rectsOverlap(player, hitbox)) continue;
      if (player.starTimer > 0) {
        rocket.active = false;
        spawnSpark(hitbox.x + hitbox.w * 0.5, hitbox.y + hitbox.h * 0.5, "#fff35a", 28);
        spawnText(hitbox.x + hitbox.w * 0.5, hitbox.y - 8, "Boom");
        playSound("stomp");
      } else if (player.invulnerable <= 0) {
        hurtPlayer(false);
      }
    }
    world.megaRockets = world.megaRockets.filter((rocket) => rocket.active || !rocket.oneShot);
  }

  function megaRocketHitbox(rocket) {
    return { x: rocket.x + 16, y: rocket.y + 13, w: 72, h: 30 };
  }

  function updateShellBosses(dt) {
    for (const boss of world.bosses) {
      if (!boss.active) continue;
      boss.anim += dt;
      boss.invulnerable = Math.max(0, boss.invulnerable - dt);
      boss.attackTimer -= dt;
      boss.x += boss.vx * dt;
      if (boss.x < boss.minX || boss.x > boss.maxX) {
        boss.x = clamp(boss.x, boss.minX, boss.maxX);
        boss.vx *= -1;
      }
      boss.y = boss.homeY + Math.sin(boss.anim * 2.4) * 7;
      boss.facing = player.x < boss.x ? -1 : 1;
      if (boss.attackTimer <= 0) {
        boss.attackTimer = 1.45 + Math.random() * 0.85;
        world.megaRockets.push({
          x: boss.x + (boss.facing < 0 ? -64 : boss.w + 16),
          y: boss.y + 16,
          homeX: boss.x + (boss.facing < 0 ? -64 : boss.w + 16),
          minX: boss.x - 740,
          maxX: boss.x + 740,
          vx: boss.facing * MEGA_ROCKET_SPEED,
          active: true,
          oneShot: true,
          life: 3.6,
          anim: 0,
        });
        spawnSpark(boss.x + boss.w * 0.5, boss.y + 18, "#9bfff1", 10);
      }
      if (!rectsOverlap(player, boss)) continue;
      const stomp = player.vy > 120 && player.y + player.h - boss.y < 28;
      if ((stomp || player.starTimer > 0) && boss.invulnerable <= 0) {
        damageShellBoss(boss, stomp ? "stomp" : "rush");
      } else if (player.invulnerable <= 0 && boss.invulnerable <= 0) {
        hurtPlayer(false);
      }
    }
  }

  function damageShellBoss(boss, mode) {
    boss.hp -= player.starTimer > 0 ? 2 : 1;
    boss.invulnerable = 0.55;
    player.vy = -520;
    player.grounded = false;
    player.jumpsLeft = MAX_JUMPS - 1;
    player.dashesLeft = MAX_DASHES;
    player.doubleJumpFlash = 0.35;
    boss.vx = Math.abs(boss.vx) * (player.x < boss.x ? 1 : -1);
    game.shake = Math.max(game.shake, mode === "rush" ? 9 : 6);
    spawnSpark(boss.x + boss.w * 0.5, boss.y + boss.h * 0.35, "#ffd35a", 26);
    spawnText(boss.x + boss.w * 0.5, boss.y - 10, boss.hp > 0 ? `Boss ${boss.hp}` : "Boss clear");
    playSound("stomp");
    if (boss.hp <= 0) {
      boss.active = false;
      world.megaRockets.forEach((rocket) => {
        if (rocket.oneShot) rocket.active = false;
      });
      spawnSpark(boss.x + boss.w * 0.5, boss.y + boss.h * 0.5, "#54d682", 42);
      showGameMessage("Airship clear");
      playSound("win");
    }
  }

  function defeatEnemy(enemy, mode) {
    enemy.active = false;
    player.combo = player.comboTimer > 0 ? player.combo + 1 : 1;
    player.comboTimer = STOMP_COMBO_WINDOW;
    const bonus = Math.max(0, Math.min(5, player.combo - 1));
    if (bonus > 0) {
      game.collected += bonus;
      game.totalCoins += bonus;
    }
    const label = player.combo > 1 ? `Combo x${player.combo}` : mode === "rush" ? "Rush" : "Pop";
    spawnSpark(enemy.x + enemy.w * 0.5, enemy.y + 12, mode === "rush" ? "#fff35a" : "#ffd35a", 18 + bonus * 2);
    spawnText(enemy.x + enemy.w * 0.5, enemy.y - 8, bonus > 0 ? `${label} +${bonus}` : label);
    game.shake = Math.max(game.shake, mode === "rush" ? 5 : 3);
    playSound(mode === "rush" ? "ring" : "stomp");
  }

  function updateCoins(dt) {
    for (const coin of world.coins) {
      if (coin.collected) continue;
      coin.anim += dt;
      const coinRect = { x: coin.x - 9, y: coin.y - 12, w: 18, h: 24 };
      if (rectsOverlap(player, coinRect)) {
        collectCoin(coin);
      }
    }
  }

  function updateShardsAndRings(dt) {
    for (const shard of world.shards) {
      if (shard.collected) continue;
      shard.anim += dt;
      const shardRect = { x: shard.x - 13, y: shard.y - 16, w: 26, h: 32 };
      if (rectsOverlap(player, shardRect)) {
        shard.collected = true;
        game.shards += 1;
        player.jumpsLeft = MAX_JUMPS - 1;
        player.dashesLeft = MAX_DASHES;
        player.doubleJumpFlash = 0.35;
        spawnSpark(shard.x, shard.y, "#9bfff1", 14);
        spawnText(shard.x, shard.y - 14, "Air +");
        playSound("shard");
        if (game.shards === game.totalShards) showGameMessage("Sky set complete");
      }
    }

    for (const ring of world.rings) {
      ring.anim += dt;
      ring.cooldown = Math.max(0, ring.cooldown - dt);
      const ringRect = { x: ring.x - 22, y: ring.y - 22, w: 44, h: 44 };
      if (ring.cooldown <= 0 && rectsOverlap(player, ringRect)) {
        ring.cooldown = 3.5;
        player.vy = Math.min(player.vy, -RING_BOOST_SPEED);
        player.grounded = false;
        player.coyote = 0;
        player.jumpsLeft = MAX_JUMPS - 1;
        player.dashesLeft = MAX_DASHES;
        player.doubleJumpFlash = 0.5;
        game.shake = Math.max(game.shake, 3);
        spawnSpark(ring.x, ring.y, "#9bfff1", 18);
        showGameMessage("Aero reset");
        playSound("ring");
      }
    }

    for (const relic of world.relics) {
      if (relic.collected) continue;
      relic.anim += dt;
      const relicRect = { x: relic.x - 18, y: relic.y - 18, w: 36, h: 36 };
      if (rectsOverlap(player, relicRect)) {
        relic.collected = true;
        game.relics += 1;
        game.lives = Math.min(5, game.lives + 1);
        player.jumpsLeft = MAX_JUMPS - 1;
        player.dashesLeft = MAX_DASHES;
        player.doubleJumpFlash = 0.65;
        game.shake = Math.max(game.shake, 5);
        spawnSpark(relic.x, relic.y, "#ff6f61", 24);
        spawnText(relic.x, relic.y - 16, "Relic");
        showGameMessage("Relic boost");
        playSound("win");
      }
    }

    for (const star of world.stars) {
      if (star.collected) continue;
      star.anim += dt;
      const starRect = { x: star.x - 18, y: star.y - 18, w: 36, h: 36 };
      if (rectsOverlap(player, starRect)) {
        star.collected = true;
        player.starTimer = STAR_POWER_TIME;
        player.invulnerable = Math.max(player.invulnerable, 0.45);
        player.jumpsLeft = MAX_JUMPS - 1;
        player.dashesLeft = MAX_DASHES;
        player.doubleJumpFlash = 0.8;
        game.shake = Math.max(game.shake, 6);
        spawnSpark(star.x, star.y, "#fff35a", 30);
        spawnText(star.x, star.y - 16, "Star rush");
        showGameMessage("Star rush");
        playSound("win");
      }
    }
  }

  function updateSuitPowerups(dt) {
    for (const suit of world.suitPowerups) {
      if (suit.collected) continue;
      suit.anim += dt;
      const suitRect = { x: suit.x - 19, y: suit.y - 22, w: 38, h: 44 };
      if (rectsOverlap(player, suitRect)) {
        suit.collected = true;
        player.gliderTimer = GLIDER_POWER_TIME;
        player.jumpsLeft = MAX_JUMPS - 1;
        player.dashesLeft = MAX_DASHES;
        player.doubleJumpFlash = 0.52;
        spawnSpark(suit.x, suit.y, "#d69a4d", 28);
        spawnText(suit.x, suit.y - 16, "Glider suit");
        showGameMessage("Hold jump to glide");
        playSound("win");
      }
    }
  }

  function updatePickupsAndGoals() {
    for (const checkpoint of world.checkpoints) {
      if (checkpoint.reached) continue;
      if (rectsOverlap(player, checkpoint)) {
        checkpoint.reached = true;
        game.checkpoint = { x: checkpoint.spawnX, y: checkpoint.spawnY };
        game.reachedCheckpointIds.add(checkpoint.id);
        showGameMessage("Checkpoint");
        spawnSpark(checkpoint.x + checkpoint.w * 0.5, checkpoint.y + 6, "#54d682", 18);
        playSound("checkpoint");
      }
    }

    if (world.goal && rectsOverlap(player, world.goal)) {
      if (world.bosses.some((boss) => boss.active)) {
        showGameMessage("Boss zuerst");
        player.vx = -Math.abs(player.vx || 160);
        return;
      }
      const nextLevel = game.levelIndex + 1;
      const hasNextLevel = nextLevel < LEVELS.length;
      game.mode = hasNextLevel ? "levelclear" : "win";
      if (!hasNextLevel) pauseBgm();
      showOverlay(
        hasNextLevel ? "Fahne erreicht" : "Ziel erreicht",
        hasNextLevel ? LEVELS[nextLevel].name : "Wolkentor offen",
        hasNextLevel
          ? `Level ${game.levelIndex + 1}/${LEVELS.length} geschafft`
          : `Coins ${game.collected}/${game.totalCoins}`,
        hasNextLevel ? "Weiter" : "Noch einmal",
        () => {
          unlockAudio();
          newRun(true, hasNextLevel ? nextLevel : 0);
        }
      );
      playSound("win");
    }
  }

  function updateEffects(dt) {
    for (const effect of world.effects) {
      effect.life -= dt;
      effect.age += dt;
      effect.x += effect.vx * dt;
      effect.y += effect.vy * dt;
      effect.vy += effect.gravity * dt;
    }
    world.effects = world.effects.filter((effect) => effect.life > 0);
  }

  function updateCamera(dt) {
    const maxX = Math.max(0, world.width - view.w);
    const maxY = Math.max(0, world.height - view.h);
    const lead = player.facing > 0 ? view.w * 0.18 : view.w * 0.08;
    const targetX = clamp(player.x - view.w * 0.36 + lead, 0, maxX);
    const targetY = clamp(player.y - view.h * 0.58, 0, maxY);
    const snap = 1 - Math.pow(0.0007, dt);
    game.cameraX += (targetX - game.cameraX) * snap;
    game.cameraY += (targetY - game.cameraY) * snap;
  }

  function render() {
    ctx.save();
    ctx.setTransform(view.dpr * view.zoom, 0, 0, view.dpr * view.zoom, 0, 0);
    ctx.clearRect(0, 0, view.w, view.h);
    drawBackground();

    const shakeX = game && game.shake > 0 ? (Math.random() - 0.5) * game.shake : 0;
    const shakeY = game && game.shake > 0 ? (Math.random() - 0.5) * game.shake : 0;
    ctx.translate(-game.cameraX + shakeX, -game.cameraY + shakeY);

    drawDecorBack();
    drawTiles();
    drawMovingPlatforms();
    drawBonusPipes();
    drawCannonPipes();
    drawCheckpointsAndGoal();
    drawCoins();
    drawShardsAndRings();
    drawPiranhas();
    drawMegaRockets();
    drawEnemies();
    drawShellBosses();
    drawPlayer();
    drawEffects();
    drawDecorFront();
    ctx.restore();

    drawMessage();
  }

  function drawBackground() {
    const cx = game ? game.cameraX : 0;
    if (drawOriginalBackgroundMap(cx)) {
      drawLevelThemeOverlay(cx);
      if (world?.theme !== "cave") drawAssetLayer("importCloudBank", cx * 0.12 + 90, 44, 116, 0.18);
      return;
    }
    const gradient = ctx.createLinearGradient(0, 0, 0, view.h);
    gradient.addColorStop(0, "#6cbcff");
    gradient.addColorStop(0.58, "#a9e7ff");
    gradient.addColorStop(1, "#fff1a8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, view.w, view.h);

    drawSun(view.w - 94 - (cx * 0.04) % 70, 88);
    drawAssetLayer("importCloudBank", cx * 0.12 + 90, 42, 132, 0.4);
    drawCloudLayer(cx * 0.16, 74, 0.88, "#ffffff");
    drawCloudLayer(cx * 0.26 + 220, 128, 0.62, "#eaf8ff");
    drawAssetLayer("bgFar", cx * 0.08, view.h - 318, 240, 0.72);
    drawMountainLayer(cx * 0.1, view.h - 245, "#5ba6c7", "#4b90b8", 1.15);
    drawAssetLayer("bgMid", cx * 0.2, view.h - 246, 250, 0.78);
    drawMountainLayer(cx * 0.22 + 170, view.h - 168, "#67b978", "#4ea465", 0.82);
    drawHillLayer(cx * 0.38, view.h - 92);
    drawAssetLayer("bgNear", cx * 0.48, view.h - 134, 140, 0.94);
    drawLevelThemeOverlay(cx);
  }

  function drawLevelThemeOverlay(offset) {
    const theme = world?.theme || "meadow";
    ctx.save();
    if (theme === "sky") {
      const glow = ctx.createLinearGradient(0, 0, 0, view.h);
      glow.addColorStop(0, "rgba(210, 252, 255, 0.2)");
      glow.addColorStop(0.58, "rgba(118, 224, 255, 0.12)");
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, view.w, view.h);
      drawThemeCloudBand(offset * 0.18, view.h * 0.36, 0.34);
    } else if (theme === "cave") {
      const shade = ctx.createLinearGradient(0, 0, 0, view.h);
      shade.addColorStop(0, "rgba(48, 18, 10, 0.24)");
      shade.addColorStop(0.45, "rgba(255, 125, 42, 0.1)");
      shade.addColorStop(1, "rgba(42, 14, 7, 0.28)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, view.w, view.h);
      const frame = ASSET_MAP.themeFrames.caveBg;
      const size = view.h * 0.42;
      drawImportedFrame(ASSET_MAP.themeAsset, frame, view.w - size * 0.88, view.h - size * 0.82, size, size, false, 0.34);
    } else if (theme === "underground") {
      const shade = ctx.createLinearGradient(0, 0, 0, view.h);
      shade.addColorStop(0, "rgba(10, 28, 39, 0.34)");
      shade.addColorStop(0.5, "rgba(15, 80, 64, 0.2)");
      shade.addColorStop(1, "rgba(7, 16, 20, 0.42)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, view.w, view.h);
      drawUndergroundThemePanel(offset, ASSET_MAP.undergroundFrames.undergroundBg, view.h * 0.42, view.h * 0.58, 0.11, 0.5);
      drawUndergroundThemePanel(offset + 260, ASSET_MAP.undergroundFrames.airshipBg, 22, view.h * 0.46, 0.04, 0.32);
    } else {
      const warm = ctx.createLinearGradient(0, 0, 0, view.h);
      warm.addColorStop(0, "rgba(255, 246, 185, 0.1)");
      warm.addColorStop(1, "rgba(91, 214, 130, 0.08)");
      ctx.fillStyle = warm;
      ctx.fillRect(0, 0, view.w, view.h);
    }
    ctx.restore();
  }

  function drawUndergroundThemePanel(offset, frame, y, h, speed, alpha) {
    const image = imageAssets[ASSET_MAP.undergroundAsset];
    if (!isImageReady(image) || !frame) return;
    const scale = h / frame[3];
    const w = frame[2] * scale;
    const start = -((offset * speed) % w + w) % w;
    ctx.save();
    ctx.globalAlpha = alpha;
    drawBackgroundTiles(image, start, w, h, "mirror-x", frame, y);
    ctx.restore();
  }

  function drawThemeCloudBand(offset, y, alpha) {
    const image = imageAssets[ASSET_MAP.themeAsset];
    const frame = ASSET_MAP.themeFrames.cloudBlock;
    if (!isImageReady(image) || !frame) return;
    const tileW = 188;
    const tileH = 54;
    const start = -((offset % tileW) + tileW) % tileW;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let x = start - tileW; x < view.w + tileW; x += tileW) {
      ctx.drawImage(image, frame[0], frame[1], frame[2], frame[3], x, y + Math.sin((x + offset) * 0.015) * 6, tileW, tileH);
    }
    ctx.restore();
  }

  function drawOriginalBackgroundMap(offset) {
    const image = imageAssets[ASSET_MAP.backgroundAsset];
    if (!isImageReady(image)) return false;
    if (Array.isArray(ASSET_MAP.backgroundLayers) && ASSET_MAP.backgroundLayers.length > 0) {
      drawParallaxBackgroundLayers(image, offset, ASSET_MAP.backgroundLayers);
      return true;
    }
    if (ASSET_MAP.backgroundFrame) {
      const [sx, sy, sw, sh] = ASSET_MAP.backgroundFrame;
      const scale = view.h / sh;
      const w = sw * scale;
      const start = -((offset * 0.14) % w + w) % w;
      drawBackgroundTiles(image, start, w, view.h, ASSET_MAP.backgroundRepeat, [sx, sy, sw, sh]);
      return true;
    }
    const scale = view.h / imageHeight(image);
    const w = imageWidth(image) * scale;
    const start = -((offset * 0.16) % w + w) % w;
    drawBackgroundTiles(image, start, w, view.h, ASSET_MAP.backgroundRepeat);
    return true;
  }

  function drawParallaxBackgroundLayers(image, offset, layers) {
    drawBackgroundGradient();
    for (const layer of layers) {
      const frame = layer.frame || [0, 0, imageWidth(image), imageHeight(image)];
      const destY = Math.round((layer.y || 0) * view.h + (layer.offsetY || 0));
      const destH = Math.ceil((layer.h || 1) * view.h);
      const scale = destH / frame[3];
      const w = frame[2] * scale;
      const speed = layer.speed ?? 0.16;
      const start = -((offset * speed) % w + w) % w;
      if (layer.fadeTop || layer.fadeBottom) {
        drawFadedParallaxLayer(image, start, w, destH, frame, destY, layer);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = layer.alpha ?? 1;
      drawBackgroundTiles(image, start, w, destH, ASSET_MAP.backgroundRepeat, frame, destY);
      ctx.restore();
    }
  }

  function drawFadedParallaxLayer(image, start, w, h, frame, y, layer) {
    const layerCtx = getBackgroundLayerContext();
    layerCtx.clearRect(0, 0, view.w, view.h);
    drawBackgroundTiles(image, start, w, h, ASSET_MAP.backgroundRepeat, frame, y, layerCtx);
    layerCtx.save();
    layerCtx.globalCompositeOperation = "destination-in";
    const mask = layerCtx.createLinearGradient(0, y, 0, y + h);
    const fadeTop = clamp((layer.fadeTop || 0) / h, 0, 0.48);
    const fadeBottom = clamp((layer.fadeBottom || 0) / h, 0, 0.48);
    mask.addColorStop(0, fadeTop > 0 ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");
    if (fadeTop > 0) mask.addColorStop(fadeTop, "rgba(0,0,0,1)");
    if (fadeBottom > 0) mask.addColorStop(1 - fadeBottom, "rgba(0,0,0,1)");
    mask.addColorStop(1, fadeBottom > 0 ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");
    layerCtx.fillStyle = mask;
    layerCtx.fillRect(0, y, view.w, h);
    layerCtx.restore();

    ctx.save();
    ctx.globalAlpha = layer.alpha ?? 1;
    ctx.drawImage(backgroundLayerCanvas, 0, 0, view.w, view.h);
    ctx.restore();
  }

  function getBackgroundLayerContext() {
    if (!backgroundLayerCanvas) {
      backgroundLayerCanvas = document.createElement("canvas");
      backgroundLayerContext = backgroundLayerCanvas.getContext("2d");
    }
    if (backgroundLayerCanvas.width !== view.w || backgroundLayerCanvas.height !== view.h) {
      backgroundLayerCanvas.width = view.w;
      backgroundLayerCanvas.height = view.h;
    }
    return backgroundLayerContext;
  }

  function drawBackgroundGradient() {
    const gradient = ctx.createLinearGradient(0, 0, 0, view.h);
    gradient.addColorStop(0, "#087cff");
    gradient.addColorStop(0.48, "#4bd3ff");
    gradient.addColorStop(1, "#c8f77d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, view.w, view.h);
  }

  function drawBackgroundTiles(image, start, w, h, repeatMode, frame = null, y = 0, targetCtx = ctx) {
    let index = -1;
    for (let x = start - w; x < view.w + w; x += w) {
      const drawX = Math.round(x);
      const drawW = Math.ceil(w);
      const flip = repeatMode === "mirror-x" && Math.abs(index % 2) === 1;
      targetCtx.save();
      if (flip) {
        targetCtx.translate(drawX + drawW, y);
        targetCtx.scale(-1, 1);
        if (frame) targetCtx.drawImage(image, frame[0], frame[1], frame[2], frame[3], 0, 0, drawW, h);
        else targetCtx.drawImage(image, 0, 0, drawW, h);
      } else if (frame) {
        targetCtx.drawImage(image, frame[0], frame[1], frame[2], frame[3], drawX, y, drawW, h);
      } else {
        targetCtx.drawImage(image, drawX, y, drawW, h);
      }
      targetCtx.restore();
      index += 1;
    }
  }

  function drawAssetLayer(name, offset, y, h, alpha) {
    const image = imageAssets[name];
    if (!isImageReady(image)) return false;
    const w = imageWidth(image) * (h / imageHeight(image));
    const start = -((offset % w) + w) % w - w;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let x = start; x < view.w + w; x += w) {
      ctx.drawImage(image, Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
    }
    ctx.restore();
    return true;
  }

  function drawSun(x, y) {
    ctx.fillStyle = "#ffe27a";
    ctx.beginPath();
    ctx.arc(x, y, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 244, 183, 0.45)";
    ctx.beginPath();
    ctx.arc(x, y, 52, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCloudLayer(offset, y, scale, color) {
    const spacing = 330 * scale;
    const base = -((offset % spacing) + spacing) % spacing - spacing;
    for (let x = base; x < view.w + spacing; x += spacing) {
      drawPixelCloud(x, y + ((x / spacing) % 2) * 30, scale, color);
    }
  }

  function drawPixelCloud(x, y, scale, color) {
    const s = 8 * scale;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y + s * 2), Math.round(s * 15), Math.round(s * 4));
    ctx.fillRect(Math.round(x + s * 3), Math.round(y), Math.round(s * 5), Math.round(s * 4));
    ctx.fillRect(Math.round(x + s * 8), Math.round(y + s), Math.round(s * 5), Math.round(s * 5));
    ctx.fillStyle = "rgba(91, 153, 190, 0.12)";
    ctx.fillRect(Math.round(x + s * 2), Math.round(y + s * 5), Math.round(s * 11), Math.round(s));
  }

  function drawMountainLayer(offset, baseY, light, dark, scale) {
    const spacing = 420 * scale;
    const start = -((offset % spacing) + spacing) % spacing - spacing;
    for (let x = start; x < view.w + spacing; x += spacing) {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(x, view.h);
      ctx.lineTo(x + spacing * 0.34, baseY - 96 * scale);
      ctx.lineTo(x + spacing * 0.74, view.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.moveTo(x + spacing * 0.19, view.h);
      ctx.lineTo(x + spacing * 0.34, baseY - 96 * scale);
      ctx.lineTo(x + spacing * 0.47, view.h);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawHillLayer(offset, baseY) {
    const spacing = 280;
    const start = -((offset % spacing) + spacing) % spacing - spacing;
    for (let x = start; x < view.w + spacing; x += spacing) {
      ctx.fillStyle = "#72ca71";
      ctx.beginPath();
      ctx.ellipse(x + 130, baseY + 52, 170, 96, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4daf67";
      ctx.beginPath();
      ctx.ellipse(x + 36, baseY + 74, 116, 68, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDecorBack() {
    const firstX = Math.max(0, Math.floor(game.cameraX / TILE) - 2);
    const lastX = Math.min(MAP_COLS - 1, Math.ceil((game.cameraX + view.w) / TILE) + 2);
    for (let y = 0; y < MAP_ROWS; y += 1) {
      for (let x = firstX; x <= lastX; x += 1) {
        const ch = world.tiles[y][x];
        if (decorTiles.has(ch)) drawTile(ch, x * TILE, y * TILE);
      }
    }
  }

  function drawTiles() {
    const firstX = Math.max(0, Math.floor(game.cameraX / TILE) - 2);
    const lastX = Math.min(MAP_COLS - 1, Math.ceil((game.cameraX + view.w) / TILE) + 2);
    const firstY = Math.max(0, Math.floor(game.cameraY / TILE) - 2);
    const lastY = Math.min(MAP_ROWS - 1, Math.ceil((game.cameraY + view.h) / TILE) + 2);

    for (let y = firstY; y <= lastY; y += 1) {
      for (let x = firstX; x <= lastX; x += 1) {
        const ch = world.tiles[y][x];
        if (solidTiles.has(ch)) {
          drawTile(ch, x * TILE, y * TILE);
        }
      }
    }
  }

  function drawDecorFront() {
    for (const plant of world.plants) {
      if (plant.x < game.cameraX - 80 || plant.x > game.cameraX + view.w + 80) continue;
      const frame = plant.kind === "flower" ? "flower" : "tuft";
      drawSprite(frame, plant.x, plant.y, 32, 32, false);
    }
  }

  function drawCheckpointsAndGoal() {
    for (const checkpoint of world.checkpoints) {
      if (checkpoint.x < game.cameraX - 80 || checkpoint.x > game.cameraX + view.w + 80) continue;
      const flagFrame = Math.floor((game.time + checkpoint.phase) * 5) % 2 === 0 ? ASSET_MAP.playfieldFrames.flagA : ASSET_MAP.playfieldFrames.flagB;
      const flagOffset = Math.sin((game.time + checkpoint.phase) * 5.8) * 2;
      if (
        drawImportedFrame(
          ASSET_MAP.playfieldAsset,
          flagFrame,
          checkpoint.x - 7 + flagOffset,
          checkpoint.y - 4,
          70,
          88
        )
      ) {
        if (checkpoint.reached) {
          drawImportedFrame(ASSET_MAP.spriteAsset, ASSET_MAP.objectFrames.heart, checkpoint.x + 17, checkpoint.y - 14, 30, 30);
        }
        continue;
      }
      if (
        drawImportedFrame(
          ASSET_MAP.cleanAsset,
          ASSET_MAP.cleanFrames.checkpointFlag,
          checkpoint.x - 5,
          checkpoint.y - 10,
          64,
          86
        )
      ) {
        if (checkpoint.reached) {
          drawImportedFrame(ASSET_MAP.spriteAsset, ASSET_MAP.objectFrames.heart, checkpoint.x + 17, checkpoint.y - 14, 30, 30);
        }
        continue;
      }
      ctx.fillStyle = "#f8f0d0";
      ctx.fillRect(checkpoint.x + 14, checkpoint.y + 2, 4, checkpoint.h);
      ctx.fillStyle = checkpoint.reached ? "#54d682" : "#ff6f61";
      ctx.fillRect(checkpoint.x + 18, checkpoint.y + 6, 24, 16);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(checkpoint.x + 18, checkpoint.y + 20, 24, 4);
      if (checkpoint.reached) {
        drawImportedFrame(ASSET_MAP.spriteAsset, ASSET_MAP.objectFrames.heart, checkpoint.x + 16, checkpoint.y - 10, 30, 30);
      }
    }

    if (world.goal) {
      const goal = world.goal;
      const flagFrame = Math.floor(game.time * 5) % 2 === 0 ? ASSET_MAP.playfieldFrames.flagA : ASSET_MAP.playfieldFrames.flagB;
      const flagOffset = Math.sin(game.time * 6.2) * 3;
      if (drawImportedFrame(ASSET_MAP.playfieldAsset, flagFrame, goal.x - 7 + flagOffset, goal.y - 70, 98, 142)) {
        return;
      }
      if (drawImportedFrame(ASSET_MAP.cleanAsset, ASSET_MAP.cleanFrames.finishFlag, goal.x - 8, goal.y - 72, 88, 154)) {
        return;
      }
      if (drawImportedFrame(ASSET_MAP.spriteAsset, ASSET_MAP.objectFrames.portal, goal.x - 12, goal.y - 70, 104, 104)) {
        ctx.fillStyle = "#fff7dc";
        ctx.fillRect(goal.x + 22, goal.y - 80, 5, 116);
        return;
      }
      ctx.fillStyle = "#fff7dc";
      ctx.fillRect(goal.x + 22, goal.y - 80, 5, 116);
      ctx.fillStyle = "#2f6fd6";
      ctx.fillRect(goal.x + 27, goal.y - 76, 42, 28);
      ctx.fillStyle = "#ffd35a";
      ctx.fillRect(goal.x + 34, goal.y - 68, 20, 12);
      ctx.fillStyle = "#d9534f";
      ctx.fillRect(goal.x + 10, goal.y + 31, 40, 9);
      ctx.fillStyle = "rgba(255,255,255,0.38)";
      ctx.fillRect(goal.x + 30, goal.y - 76, 5, 28);
    }
  }

  function drawCoins() {
    for (const coin of world.coins) {
      if (coin.collected) continue;
      if (coin.x < game.cameraX - 50 || coin.x > game.cameraX + view.w + 50) continue;
      const frame = Math.floor((coin.anim * 10 + coin.phase) % 4);
      const y = coin.y + Math.sin(coin.anim * 5 + coin.phase) * 2;
      const coinFrame = ASSET_MAP.objectFrames[`coin${frame}`];
      if (drawImportedFrame(ASSET_MAP.spriteAsset, coinFrame, coin.x - 16, y - 16, 32, 32)) continue;
      drawSprite(`coin${frame}`, coin.x - 16, y - 16, 32, 32, false);
    }
  }

  function drawShardsAndRings() {
    for (const ring of world.rings) {
      if (ring.x < game.cameraX - 70 || ring.x > game.cameraX + view.w + 70) continue;
      const alpha = ring.cooldown > 0 ? 0.28 + Math.sin(ring.anim * 12) * 0.08 : 0.95;
      const pulse = ring.cooldown > 0 ? 0.88 : 1 + Math.sin(ring.anim * 6) * 0.06;
      drawAssetOrRing(ring.x, ring.y, 64 * pulse, alpha);
    }

    for (const shard of world.shards) {
      if (shard.collected) continue;
      if (shard.x < game.cameraX - 60 || shard.x > game.cameraX + view.w + 60) continue;
      const bob = Math.sin(shard.anim * 4 + shard.phase) * 4;
      const pulse = 1 + Math.sin(shard.anim * 7 + shard.phase) * 0.04;
      drawAssetOrShard(shard.x, shard.y + bob, 44 * pulse);
    }

    for (const relic of world.relics) {
      if (relic.collected) continue;
      if (relic.x < game.cameraX - 60 || relic.x > game.cameraX + view.w + 60) continue;
      const bob = Math.sin(relic.anim * 3.2 + relic.phase) * 5;
      const pulse = 1 + Math.sin(relic.anim * 8 + relic.phase) * 0.06;
      drawAssetOrRelic(relic.x, relic.y + bob, 42 * pulse);
    }

    for (const star of world.stars) {
      if (star.collected) continue;
      if (star.x < game.cameraX - 60 || star.x > game.cameraX + view.w + 60) continue;
      const bob = Math.sin(star.anim * 4.6 + star.phase) * 5;
      const pulse = 1 + Math.sin(star.anim * 9 + star.phase) * 0.08;
      drawAssetOrStar(star.x, star.y + bob, 42 * pulse, star.anim);
    }

    for (const suit of world.suitPowerups) {
      if (suit.collected) continue;
      if (suit.x < game.cameraX - 70 || suit.x > game.cameraX + view.w + 70) continue;
      const bob = Math.sin(suit.anim * 4.2 + suit.phase) * 5;
      const pulse = 1 + Math.sin(suit.anim * 7.1 + suit.phase) * 0.05;
      if (drawImportedFrame(ASSET_MAP.undergroundAsset, ASSET_MAP.undergroundFrames.gliderSuit, suit.x - 25, suit.y - 29 + bob, 50 * pulse, 58 * pulse)) continue;
      ctx.fillStyle = "#d69a4d";
      ctx.fillRect(suit.x - 14, suit.y - 12 + bob, 28, 24);
      ctx.fillStyle = "#7a4c24";
      ctx.fillRect(suit.x + 10, suit.y - 2 + bob, 16, 8);
    }
  }

  function drawBonusPipes() {
    for (const pipe of world.bonusPipes) {
      if (pipe.x < game.cameraX - 90 || pipe.x > game.cameraX + view.w + 90) continue;
      const glow = pipe.cooldown > 0 ? 0.2 : 0.44 + Math.sin(game.time * 5 + pipe.phase) * 0.08;
      drawImportedFrame(ASSET_MAP.undergroundAsset, ASSET_MAP.undergroundFrames.pipeValve, pipe.x + 16, pipe.pipeY - 58, 34, 48, false, glow);
    }
  }

  function drawCannonPipes() {
    for (const cannon of world.cannonPipes) {
      if (cannon.x < game.cameraX - 120 || cannon.x > game.cameraX + view.w + 120) continue;
      const kick = cannon.cooldown > CANNON_LAUNCH_COOLDOWN - 0.18 ? Math.sin(cannon.anim * 36) * 3 : 0;
      drawImportedFrame(ASSET_MAP.undergroundAsset, ASSET_MAP.undergroundFrames.cannonPipe, cannon.x - kick, cannon.y - 18 + kick, 84, 86);
      if (cannon.cooldown > CANNON_LAUNCH_COOLDOWN - 0.28) {
        drawImportedFrame(ASSET_MAP.undergroundAsset, ASSET_MAP.undergroundFrames.cannonBurst, cannon.x + 42, cannon.y - 24, 74, 74, false, 0.62);
      }
    }
  }

  function drawMegaRockets() {
    for (const rocket of world.megaRockets) {
      if (!rocket.active) continue;
      if (rocket.x < game.cameraX - 150 || rocket.x > game.cameraX + view.w + 150) continue;
      const bob = Math.sin(rocket.anim * 18) * 1.8;
      if (drawImportedFrame(ASSET_MAP.undergroundAsset, ASSET_MAP.undergroundFrames.megaRocket, rocket.x, rocket.y - 8 + bob, 116, 58, rocket.vx > 0)) {
        continue;
      }
      const hitbox = megaRocketHitbox(rocket);
      ctx.fillStyle = "#1b1f2b";
      ctx.fillRect(hitbox.x - 12, hitbox.y - 9, hitbox.w + 24, hitbox.h + 18);
      ctx.fillStyle = "#ff8a2f";
      ctx.fillRect(hitbox.x - 28, hitbox.y + 7, 22, 16);
    }
  }

  function drawShellBosses() {
    for (const boss of world.bosses) {
      if (!boss.active) continue;
      if (boss.x < game.cameraX - 120 || boss.x > game.cameraX + view.w + 120) continue;
      const attacking = boss.attackTimer < 0.42;
      const frame = attacking ? ASSET_MAP.undergroundFrames.shellBossAttack : ASSET_MAP.undergroundFrames.shellBossIdle;
      const alpha = boss.invulnerable > 0 ? 0.52 + Math.sin(game.time * 28) * 0.22 : 1;
      if (!drawImportedFrame(ASSET_MAP.undergroundAsset, frame, boss.x - 18, boss.y - 30, 92, 96, boss.facing > 0, alpha)) {
        ctx.fillStyle = "#54d682";
        ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
      }
      ctx.fillStyle = "rgba(20, 14, 8, 0.45)";
      ctx.fillRect(boss.x - 3, boss.y - 17, 62, 7);
      ctx.fillStyle = "#ff6f61";
      ctx.fillRect(boss.x - 3, boss.y - 17, Math.max(0, 62 * (boss.hp / boss.maxHp)), 7);
      ctx.fillStyle = "#fff7dc";
      ctx.fillRect(boss.x - 3, boss.y - 19, 62, 2);
    }
  }

  function drawMovingPlatforms() {
    for (const platform of world.platforms) {
      if (platform.x + platform.w < game.cameraX - 90 || platform.x > game.cameraX + view.w + 90) continue;
      const platformStyle = movingPlatformStyle();
      ctx.save();
      ctx.fillStyle = "rgba(72, 38, 0, 0.2)";
      ctx.fillRect(Math.round(platform.x + 4), Math.round(platform.y + platform.h + 5), Math.round(platform.w - 8), 5);
      for (let x = 0; x < platform.w; x += TILE) {
        const w = Math.min(TILE, platform.w - x);
        if (!drawImportedFrame(platformStyle.asset, platformStyle.frame, platform.x + x, platform.y + platformStyle.yOffset, w, platformStyle.h)) {
          ctx.fillStyle = "#9c5c2a";
          ctx.fillRect(platform.x + x, platform.y, w, platform.h);
          ctx.fillStyle = "#ffd35a";
          ctx.fillRect(platform.x + x + 3, platform.y + 3, Math.max(2, w - 6), 3);
        }
      }
      ctx.fillStyle = "#ffd35a";
      ctx.fillRect(Math.round(platform.x + 8), Math.round(platform.y + 4), 5, 5);
      ctx.fillRect(Math.round(platform.x + platform.w - 13), Math.round(platform.y + 4), 5, 5);
      ctx.restore();
    }
  }

  function movingPlatformStyle() {
    if (world.theme === "sky") {
      return { asset: ASSET_MAP.themeAsset, frame: ASSET_MAP.themeFrames.cloudBlock, yOffset: -7, h: 30 };
    }
    if (world.theme === "cave") {
      return { asset: ASSET_MAP.themeAsset, frame: ASSET_MAP.themeFrames.caveBlock, yOffset: -1, h: 24 };
    }
    if (world.theme === "underground") {
      return { asset: ASSET_MAP.undergroundAsset, frame: ASSET_MAP.undergroundFrames.airshipHull, yOffset: -4, h: 30 };
    }
    return { asset: ASSET_MAP.tileAsset, frame: ASSET_MAP.tileFrames.P, yOffset: 0, h: 28 };
  }

  function drawAssetOrRing(x, y, size, alpha) {
    if (drawImportedFrame(ASSET_MAP.spriteAsset, ASSET_MAP.objectFrames.portal, x - size * 0.58, y - size * 0.58, size * 1.16, size * 1.16, false, alpha)) {
      return;
    }
    const image = imageAssets.aeroRing;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (image && image.complete && image.naturalWidth) {
      ctx.drawImage(image, x - size * 0.5, y - size * 0.5, size, size);
    } else {
      ctx.strokeStyle = "#9bfff1";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#fff7dc";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAssetOrShard(x, y, size) {
    if (drawImportedFrame(ASSET_MAP.spriteAsset, ASSET_MAP.objectFrames.gem, x - size * 0.58, y - size * 0.58, size * 1.16, size * 1.16)) {
      return;
    }
    const image = imageAssets.skyShard;
    if (image && image.complete && image.naturalWidth) {
      ctx.drawImage(image, x - size * 0.5, y - size * 0.5, size, size);
      return;
    }
    ctx.fillStyle = "#9bfff1";
    ctx.fillRect(x - 7, y - 18, 14, 36);
    ctx.fillStyle = "#2f6fd6";
    ctx.fillRect(x - 11, y - 8, 22, 18);
  }

  function drawAssetOrRelic(x, y, size) {
    if (drawImportedFrame(ASSET_MAP.spriteAsset, ASSET_MAP.objectFrames.heart, x - size * 0.58, y - size * 0.58, size * 1.16, size * 1.16)) {
      return;
    }
    ctx.fillStyle = "#ff6f61";
    ctx.fillRect(x - 12, y - 10, 24, 22);
    ctx.fillStyle = "#ffd35a";
    ctx.fillRect(x - 5, y - 4, 10, 10);
  }

  function drawAssetOrStar(x, y, size, anim) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(anim * 5) * 0.1);
    const r1 = size * 0.48;
    const r2 = size * 0.22;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? r1 : r2;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = "#fff35a";
    ctx.strokeStyle = "#a85f00";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = "#fffbe2";
    ctx.fillRect(-4, -10, 3, 3);
    ctx.fillRect(7, -10, 3, 3);
    ctx.restore();
  }

  function drawPiranhas() {
    for (const piranha of world.piranhas) {
      if (piranha.x < game.cameraX - 90 || piranha.x > game.cameraX + view.w + 90) continue;
      const rise = piranhaRise(piranha);
      const bite = Math.floor((piranha.anim + piranha.phase) * 8) % 2 === 0;
      const frame =
        rise < 0.18
          ? ASSET_MAP.themeFrames.piranhaClosed
          : rise < 0.62
            ? ASSET_MAP.themeFrames.piranhaBite
            : bite
              ? ASSET_MAP.themeFrames.piranhaTall
              : ASSET_MAP.themeFrames.piranhaBite;
      const h = frame === ASSET_MAP.themeFrames.piranhaTall ? 126 : 104;
      const y = piranha.pipeY + 62 - h;
      const alpha = piranha.stunned > 0 ? 0.35 + Math.sin(game.time * 18) * 0.14 : 1;
      if (drawImportedFrame(ASSET_MAP.themeAsset, frame, piranha.x - 8, y, 80, h, false, alpha)) {
        continue;
      }
      const hitbox = piranhaHitbox(piranha);
      ctx.fillStyle = "#d92b37";
      ctx.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
      ctx.fillStyle = "#fff7dc";
      ctx.fillRect(hitbox.x + 6, hitbox.y + 6, 8, 8);
    }
  }

  function drawEnemies() {
    for (const enemy of world.enemies) {
      if (!enemy.active) continue;
      if (enemy.x < game.cameraX - 80 || enemy.x > game.cameraX + view.w + 80) continue;
      const frame = Math.floor(enemy.anim * 8) % 2 === 0 ? "snail0" : "snail1";
      const bob = Math.sin(enemy.anim * 13) * 1.4;
      if (
        world.theme === "sky" &&
        drawImportedFrame(ASSET_MAP.themeAsset, ASSET_MAP.themeFrames.blueBeetle, enemy.x - 14, enemy.y - 25 + bob, 64, 54, enemy.vx > 0)
      ) {
        continue;
      }
      if (drawImportedFrame(ASSET_MAP.cleanAsset, ASSET_MAP.cleanFrames.beetle, enemy.x - 13, enemy.y - 23 + bob, 62, 50, enemy.vx > 0)) {
        continue;
      }
      const importedFrame = ASSET_MAP.enemyFrames[enemy.kind % ASSET_MAP.enemyFrames.length];
      if (drawImportedFrame(ASSET_MAP.spriteAsset, importedFrame, enemy.x - 22, enemy.y - 42, 72, 78, enemy.vx > 0)) {
        continue;
      }
      drawSprite(frame, enemy.x - 10, enemy.y - 14, 48, 48, enemy.vx > 0);
    }
  }

  function drawPlayer() {
    const flicker = player.invulnerable > 0 && Math.floor(player.invulnerable * 24) % 2 === 0;
    if (flicker) return;

    let frame = "heroIdle";
    if (player.hurtPulse > 0) frame = "heroHurt";
    else if (player.dashTimer > 0) frame = "heroDash";
    else if (!player.grounded && player.vy < 0) frame = "heroJump";
    else if (!player.grounded && player.jumpsLeft === 0) frame = "heroTriple";
    else if (!player.grounded) frame = "heroFall";
    else if (Math.abs(player.vx) > 24) frame = Math.floor(player.anim * 12) % 2 === 0 ? "heroRun0" : "heroRun1";

    if (player.doubleJumpFlash > 0) {
      const alpha = Math.min(0.78, player.doubleJumpFlash * 2.4);
      const size = 54 + Math.sin(player.anim * 20) * 4;
      drawAssetOrRing(player.x + player.w * 0.5, player.y + player.h * 0.55, size, alpha);
    }
    const importedFrame =
      {
        heroRun0: ASSET_MAP.playerFrames.run0,
        heroRun1: ASSET_MAP.playerFrames.run1,
        heroDash: ASSET_MAP.playerFrames.dash,
        heroTriple: ASSET_MAP.playerFrames.triple,
        heroJump: ASSET_MAP.playerFrames.jump,
        heroFall: ASSET_MAP.playerFrames.fall,
        heroHurt: ASSET_MAP.playerFrames.hurt,
        heroIdle: ASSET_MAP.playerFrames.idle,
      }[frame] || ASSET_MAP.playerFrames.idle;
    if (drawImportedFrame(ASSET_MAP.spriteAsset, importedFrame, player.x - 17, player.y - 38, 58, 76, player.facing < 0)) {
      drawGliderSuitAccent();
      return;
    }
    drawSprite(frame, player.x - 12, player.y - 13, 48, 48, player.facing < 0);
    drawGliderSuitAccent();
  }

  function drawGliderSuitAccent() {
    if (player.gliderTimer <= 0) return;
    const alpha = clamp(player.gliderTimer / GLIDER_POWER_TIME, 0.35, 0.88);
    const x = player.facing > 0 ? player.x - 25 : player.x + player.w - 6;
    const y = player.y - 8 + Math.sin(player.anim * 8) * 1.5;
    if (drawImportedFrame(ASSET_MAP.undergroundAsset, ASSET_MAP.undergroundFrames.gliderSuit, x, y, 38, 43, player.facing < 0, alpha)) return;
    ctx.fillStyle = `rgba(214, 154, 77, ${alpha})`;
    ctx.fillRect(x + 4, y + 14, 24, 10);
  }

  function drawEffects() {
    for (const effect of world.effects) {
      const alpha = clamp(effect.life / effect.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      if (effect.type === "text") {
        ctx.font = "900 16px ui-sans-serif, system-ui";
        ctx.fillStyle = "#fff7dc";
        ctx.strokeStyle = "rgba(32, 20, 8, 0.75)";
        ctx.lineWidth = 4;
        ctx.strokeText(effect.text, effect.x - 10, effect.y);
        ctx.fillText(effect.text, effect.x - 10, effect.y);
      } else {
        ctx.fillStyle = effect.color;
        ctx.fillRect(Math.round(effect.x), Math.round(effect.y), effect.size, effect.size);
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawMessage() {
    if (!game.message || game.messageTimer <= 0) return;
    const alpha = Math.min(1, game.messageTimer / 0.35);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = "900 22px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff7dc";
    ctx.strokeStyle = "rgba(18, 24, 36, 0.78)";
    ctx.lineWidth = 6;
    ctx.strokeText(game.message, view.w * 0.5, 92);
    ctx.fillText(game.message, view.w * 0.5, 92);
    ctx.restore();
  }

  function drawTile(ch, x, y) {
    const tx = Math.round(x / TILE);
    const ty = Math.round(y / TILE);
    if ((ch === "I" || ch === "J") && getTile(tx - 1, ty) === ch) return;
    const frame = tileFrame(ch);
    if (!frame) {
      drawImportedTile(ch, x, y);
      return;
    }
    ctx.drawImage(tileAtlas, frame.x, frame.y, TILE, TILE, x, y, TILE, TILE);
    drawImportedTile(ch, x, y);
  }

  function drawImportedTile(ch, x, y) {
    const themedTile = themeTileFrame(ch);
    if (themedTile) {
      const tx = Math.round(x / TILE);
      const ty = Math.round(y / TILE);
      const pipeSpan = (ch === "I" || ch === "J") && getTile(tx + 1, ty) === ch ? TILE * 2 : TILE;
      const yOffset = ch === "W" ? -5 : ch === "I" ? -4 : 0;
      const height = ch === "W" ? TILE + 8 : ch === "I" ? TILE + 7 : TILE;
      if (drawImportedFrame(themedTile.asset, themedTile.frame, x, y + yOffset, pipeSpan, height, false, themedTile.alpha ?? 1)) {
        return;
      }
    }
    const playfieldKey = ASSET_MAP.playfieldTileFrames[ch];
    const playfieldFrame = playfieldKey ? ASSET_MAP.playfieldFrames[playfieldKey] : null;
    if (playfieldFrame) {
      const tx = Math.round(x / TILE);
      const ty = Math.round(y / TILE);
      const pipeSpan = (ch === "I" || ch === "J") && getTile(tx + 1, ty) === ch ? TILE * 2 : TILE;
      const yOffset = ch === "W" ? -5 : ch === "I" ? -4 : 0;
      const height = ch === "W" ? TILE + 8 : ch === "I" ? TILE + 7 : TILE;
      const alpha = ch === "D" || ch === "J" ? 0.98 : 1;
      if (drawImportedFrame(ASSET_MAP.playfieldAsset, playfieldFrame, x, y + yOffset, pipeSpan, height, false, alpha)) {
        return;
      }
    }
    if (ch === "W" && drawImportedFrame(ASSET_MAP.cleanAsset, ASSET_MAP.cleanFrames.cloudTile, x - 7, y - 6, TILE + 14, TILE + 9)) {
      return;
    }
    const frame = ASSET_MAP.tileFrames[ch];
    const image = imageAssets[ASSET_MAP.tileAsset] || imageAssets.importTiles;
    if (!frame || !isImageReady(image)) return;
    ctx.save();
    ctx.globalAlpha = ch === "D" ? 0.88 : 0.96;
    ctx.drawImage(image, frame[0], frame[1], frame[2], frame[3], x, y, TILE, TILE);
    if (ch === "Q") {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#ffd35a";
      ctx.fillRect(x + 12, y + 9, 8, 12);
    }
    ctx.restore();
  }

  function themeTileFrame(ch) {
    const theme = world?.theme || "meadow";
    if (ch === "W") return { asset: ASSET_MAP.themeAsset, frame: ASSET_MAP.themeFrames.cloudBlock };
    if (ch === "A") return { asset: ASSET_MAP.undergroundAsset, frame: ASSET_MAP.undergroundFrames.airshipHull, alpha: 0.98 };
    if (theme === "underground" && ch === "I") return { asset: ASSET_MAP.undergroundAsset, frame: ASSET_MAP.undergroundFrames.bonusPipe };
    if (ch === "I") return { asset: ASSET_MAP.themeAsset, frame: ASSET_MAP.themeFrames.pipeTop };
    if (ch === "J") return { asset: ASSET_MAP.themeAsset, frame: ASSET_MAP.themeFrames.pipeShaft, alpha: 0.98 };
    if (theme === "underground" && (ch === "G" || ch === "D" || ch === "B" || ch === "U" || ch === "P")) {
      return { asset: ASSET_MAP.undergroundAsset, frame: ASSET_MAP.undergroundFrames.undergroundBlock, alpha: ch === "D" ? 0.94 : 1 };
    }
    if (theme === "sky" && (ch === "G" || ch === "D" || ch === "B" || ch === "U")) {
      return { asset: ASSET_MAP.themeAsset, frame: ASSET_MAP.themeFrames.palaceBlock, alpha: ch === "D" ? 0.94 : 1 };
    }
    if (theme === "cave" && (ch === "G" || ch === "D" || ch === "B" || ch === "U")) {
      return { asset: ASSET_MAP.themeAsset, frame: ASSET_MAP.themeFrames.caveBlock, alpha: ch === "D" ? 0.96 : 1 };
    }
    if (theme === "meadow" && ch === "G") {
      return { asset: ASSET_MAP.themeAsset, frame: ASSET_MAP.themeFrames.meadowBlock };
    }
    return null;
  }

  function drawSprite(name, x, y, w, h, flip) {
    const frame = spriteAtlas.frames[name];
    if (!frame) return;
    if (flip) {
      ctx.save();
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(spriteAtlas.canvas, frame.x, frame.y, frame.w, frame.h, 0, 0, w, h);
      ctx.restore();
      return;
    }
    ctx.drawImage(spriteAtlas.canvas, frame.x, frame.y, frame.w, frame.h, x, y, w, h);
  }

  function drawImportedFrame(assetName, frame, x, y, w, h, flip = false, alpha = 1) {
    const image = imageAssets[assetName];
    if (!frame || !isImageReady(image)) return false;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (flip) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(image, frame[0], frame[1], frame[2], frame[3], 0, 0, w, h);
    } else {
      ctx.drawImage(image, frame[0], frame[1], frame[2], frame[3], x, y, w, h);
    }
    ctx.restore();
    return true;
  }

  function moveWithTiles(actor, dx, dy, hooks = {}) {
    if (dx !== 0) {
      actor.x += dx;
      const tiles = collidingTiles(actor);
      for (const tile of tiles) {
        if (dx > 0) actor.x = tile.tx * TILE - actor.w - 0.01;
        else actor.x = (tile.tx + 1) * TILE + 0.01;
        hooks.onHorizontalHit?.(tile);
      }
    }

    if (dy !== 0) {
      actor.y += dy;
      const tiles = collidingTiles(actor);
      for (const tile of tiles) {
        if (dy > 0) {
          actor.y = tile.ty * TILE - actor.h - 0.01;
          const result = hooks.onGroundTile?.(tile);
          if (result === "bounce") return;
        } else {
          actor.y = (tile.ty + 1) * TILE + 0.01;
          hooks.onCeilingTile?.(tile);
        }
      }
    }
  }

  function collidingTiles(actor) {
    const tiles = [];
    const left = Math.floor(actor.x / TILE);
    const right = Math.floor((actor.x + actor.w - 0.001) / TILE);
    const top = Math.floor(actor.y / TILE);
    const bottom = Math.floor((actor.y + actor.h - 0.001) / TILE);

    for (let ty = top; ty <= bottom; ty += 1) {
      for (let tx = left; tx <= right; tx += 1) {
        const ch = getTile(tx, ty);
        if (solidTiles.has(ch)) tiles.push({ tx, ty, ch });
      }
    }
    return tiles;
  }

  function isSolidAtWorld(x, y) {
    return solidTiles.has(getTile(Math.floor(x / TILE), Math.floor(y / TILE)));
  }

  function getTile(tx, ty) {
    if (tx < 0) return "D";
    if (ty < 0 || tx >= MAP_COLS || ty >= MAP_ROWS) return ".";
    return world.tiles[ty][tx];
  }

  function setTile(tx, ty, ch) {
    if (tx < 0 || tx >= MAP_COLS || ty < 0 || ty >= MAP_ROWS) return;
    world.tiles[ty][tx] = ch;
  }

  function bumpTile(tx, ty, ch) {
    const x = tx * TILE + TILE * 0.5;
    const y = ty * TILE;
    if (ch === "Q") {
      setTile(tx, ty, "U");
      game.collected += 1;
      spawnText(x, y - 4, "+1");
      spawnSpark(x, y, "#ffd35a", 10);
      game.shake = Math.max(game.shake, 3);
      playSound("coin");
      updateHud();
      return;
    }
    if (ch === "B") {
      spawnSpark(x, y + 12, "#c86d38", 8);
      game.shake = Math.max(game.shake, 2);
      playSound("bump");
    }
  }

  function collectCoin(coin) {
    coin.collected = true;
    game.collected += 1;
    spawnText(coin.x, coin.y - 12, "+1");
    spawnSpark(coin.x, coin.y, "#ffd35a", 8);
    playSound("coin");
  }

  function hurtPlayer(fall) {
    if (player.starTimer > 0 && !fall) return;
    if (player.invulnerable > 0 && !fall) return;
    game.lives -= 1;
    player.hurtPulse = 0.45;
    player.invulnerable = 1.35;
    game.shake = Math.max(game.shake, 8);
    playSound("hurt");

    if (game.lives <= 0) {
      game.mode = "gameover";
      pauseBgm();
      showOverlay("Run vorbei", "Noch ein Versuch", `Coins ${game.collected}/${game.totalCoins}`, "Neustart", () => {
        unlockAudio();
        newRun(true);
      });
      return;
    }

    const spawn = game.checkpoint;
    player.x = spawn.x;
    player.y = spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    showGameMessage(game.lives === 1 ? "Letztes Leben" : "Zurueck");
    resetNearbyEnemies();
  }

  function resetNearbyEnemies() {
    for (const enemy of world.enemies) {
      if (Math.abs(enemy.homeX - player.x) < view.w * 0.8) {
        enemy.active = true;
        enemy.x = enemy.homeX;
        enemy.y = enemy.homeY;
        enemy.vx = enemy.baseSpeed * (enemy.flip ? 1 : -1);
        enemy.vy = 0;
      }
    }
  }

  function togglePause() {
    if (!game) return;
    if (game.mode === "playing") {
      game.mode = "paused";
      pauseBgm();
      showOverlay("Pause", "Pausiert", "Der Lauf wartet.", "Weiter", () => {
        unlockAudio();
        hideOverlay();
        game.mode = "playing";
        startBgm();
      });
      return;
    }
    if (game.mode === "paused") {
      hideOverlay();
      game.mode = "playing";
      startBgm();
    }
  }

  function showOverlay(kicker, title, text, buttonText, onPrimary) {
    overlayKicker.textContent = kicker;
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    primaryButton.textContent = buttonText;
    primaryButton.onclick = onPrimary;
    overlay.classList.add("overlay--visible");
  }

  function hideOverlay() {
    overlay.classList.remove("overlay--visible");
  }

  function showGameMessage(text) {
    game.message = text;
    game.messageTimer = 1.35;
  }

  function updateHud() {
    hudLevel.textContent = `Level ${game.levelIndex + 1}/${game.totalLevels}`;
    hudLevel.title = game.levelName;
    hudCoins.textContent = `Coins ${game.collected}/${game.totalCoins}`;
    hudShards.textContent = `Shards ${game.shards}/${game.totalShards}`;
    hudRelics.textContent = `Relics ${game.relics}/${game.totalRelics}`;
    hudLives.textContent = `Lives ${game.lives}`;
    hudAir.textContent = `Air ${player.jumpsLeft}`;
    hudDash.textContent = `Dash ${player.dashesLeft}`;
    hudPower.textContent =
      player.starTimer > 0
        ? `Star ${Math.ceil(player.starTimer)}`
        : player.gliderTimer > 0
          ? `Suit ${Math.ceil(player.gliderTimer)}`
          : player.combo > 1
            ? `Combo x${player.combo}`
            : "Power 0";
    hudTime.textContent = `Time ${Math.floor(game.time).toString().padStart(3, "0")}`;
  }

  function clearInputEdges() {
    input.jumpPressed = false;
    input.left = false;
    input.right = false;
    input.run = false;
    input.jump = false;
    input.down = false;
    input.dashPressed = false;
    Object.keys(keyHolds).forEach((action) => {
      keyHolds[action] = false;
    });
    Object.values(touchHolds).forEach((held) => held.clear());
    screenPointers.clear();
    document.querySelectorAll("[data-action]").forEach((button) => button.classList.remove("is-active"));
  }

  function finishLevel(tiles, platforms, start, levelIndex) {
    const bonusCoins = tiles.reduce((sum, line) => sum + line.filter((ch) => ch === "Q").length, 0);
    const parsed = parseObjects(tiles);
    linkBonusPipes(parsed.bonusPipes);
    const level = LEVELS[levelIndex] || LEVELS[0];
    return {
      levelIndex,
      levelName: level.name,
      theme: level.theme || "meadow",
      tiles,
      coins: parsed.coins,
      bonusCoins,
      shards: parsed.shards,
      rings: parsed.rings,
      relics: parsed.relics,
      stars: parsed.stars,
      platforms,
      enemies: parsed.enemies,
      piranhas: parsed.piranhas,
      bonusPipes: parsed.bonusPipes,
      cannonPipes: parsed.cannonPipes,
      megaRockets: parsed.megaRockets,
      suitPowerups: parsed.suitPowerups,
      bosses: parsed.bosses,
      checkpoints: parsed.checkpoints,
      plants: parsed.plants,
      goal: parsed.goal,
      effects: [],
      start,
      width: MAP_COLS * TILE,
      height: MAP_ROWS * TILE,
    };
  }

  function linkBonusPipes(pipes) {
    if (pipes.length < 2) return;
    for (let i = 0; i < pipes.length; i += 1) {
      const target = pipes[(i + 1) % pipes.length];
      pipes[i].target = {
        x: target.x,
        y: target.y,
        spawnX: target.x + TILE * 0.5,
        spawnY: target.pipeY - 46,
      };
    }
  }

  function buildWorld(levelIndex = 0) {
    if (levelIndex === 1) return buildCloudLiftLevel(levelIndex);
    if (levelIndex === 2) return buildFlagRushLevel(levelIndex);
    if (levelIndex === 3) return buildPipeworksAirshipLevel(levelIndex);
    const tiles = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill("."));
    const set = (x, y, ch) => {
      if (x >= 0 && x < MAP_COLS && y >= 0 && y < MAP_ROWS) tiles[y][x] = ch;
    };
    const ground = (from, to, top) => {
      for (let x = from; x <= to; x += 1) {
        set(x, top, "G");
        for (let y = top + 1; y < MAP_ROWS; y += 1) set(x, y, "D");
      }
    };
    const row = (y, from, to, ch) => {
      for (let x = from; x <= to; x += 1) set(x, y, ch);
    };
    const coins = (points) => {
      for (const [x, y] of points) set(x, y, "C");
    };
    const coinLine = (from, to, y) => {
      for (let x = from; x <= to; x += 1) set(x, y, "C");
    };
    const coinArc = (from, y, length) => {
      for (let i = 0; i < length; i += 1) {
        const dy = Math.abs(i - (length - 1) / 2) > length / 3 ? 1 : 0;
        set(from + i, y + dy, "C");
      }
    };
    const pipeWithPiranha = (x, y) => {
      row(y, x, x + 1, "I");
      row(y + 1, x, x + 1, "J");
      set(x, y - 1, "Y");
    };

    ground(0, 20, 14);
    ground(23, 46, 15);
    ground(49, 68, 13);
    ground(72, 94, 15);
    ground(98, 122, 12);
    ground(126, 149, 14);
    ground(153, 175, 11);
    ground(179, 202, 14);
    ground(205, 231, 13);

    row(10, 8, 12, "B");
    set(13, 10, "Q");
    row(8, 23, 30, "W");
    row(11, 52, 58, "B");
    set(62, 9, "S");
    row(10, 76, 83, "W");
    set(88, 9, "Q");
    row(9, 103, 108, "B");
    row(8, 112, 117, "W");
    row(7, 130, 137, "W");
    set(141, 8, "Q");
    row(8, 157, 164, "B");
    set(168, 8, "S");
    row(7, 181, 188, "W");
    row(10, 194, 199, "B");
    row(8, 211, 218, "W");
    pipeWithPiranha(15, 13);
    pipeWithPiranha(74, 14);
    pipeWithPiranha(181, 13);

    for (let step = 0; step < 5; step += 1) {
      row(13 - step, 116 + step * 2, 117 + step * 2, "B");
      row(12 - step, 154 - step * 2, 155 - step * 2, "B");
    }

    coinLine(4, 8, 11);
    coinArc(22, 5, 10);
    coinLine(35, 39, 12);
    coinArc(52, 8, 8);
    coinLine(75, 80, 8);
    coinArc(82, 6, 8);
    coins([
      [96, 9],
      [99, 8],
      [105, 7],
      [115, 6],
      [131, 5],
      [136, 5],
      [145, 8],
      [156, 6],
      [163, 6],
      [170, 5],
      [182, 5],
      [187, 5],
      [197, 8],
      [213, 6],
      [218, 6],
      [225, 9],
    ]);

    [
      [31, 8],
      [67, 9],
      [94, 10],
      [123, 6],
      [149, 7],
      [174, 8],
      [202, 9],
    ].forEach(([x, y]) => set(x, y, "O"));

    [
      [27, 4],
      [58, 7],
      [83, 5],
      [106, 5],
      [135, 4],
      [166, 4],
      [186, 4],
      [216, 5],
    ].forEach(([x, y]) => set(x, y, "M"));

    [
      [45, 7],
      [121, 5],
      [176, 5],
      [220, 7],
    ].forEach(([x, y]) => set(x, y, "R"));

    [
      [64, 8],
      [111, 6],
      [190, 5],
    ].forEach(([x, y]) => set(x, y, "T"));

    [
      [6, 13, "a"],
      [15, 13, "f"],
      [26, 14, "v"],
      [41, 14, "f"],
      [54, 12, "x"],
      [80, 14, "f"],
      [101, 11, "a"],
      [118, 11, "f"],
      [128, 13, "v"],
      [155, 10, "f"],
      [170, 10, "a"],
      [183, 13, "f"],
      [194, 13, "v"],
      [214, 12, "f"],
      [228, 12, "a"],
    ].forEach(([x, y, ch]) => set(x, y, ch));

    [
      [17, 13],
      [39, 14],
      [57, 12],
      [86, 14],
      [109, 11],
      [139, 13],
      [162, 10],
      [196, 13],
      [222, 12],
    ].forEach(([x, y], index) => set(x, y, index % 2 === 0 ? "E" : "N"));

    set(122, 10, "K");
    set(226, 11, "F");

    const platforms = [
      movingPlatform(44, 12, 4, 42, 0, 0.95, 0.1),
      movingPlatform(200, 9, 4, 54, 0, 0.9, 2.1),
    ];
    return finishLevel(tiles, platforms, { x: 76, y: 14 * TILE - 34 }, levelIndex);
  }

  function createLevelSketch() {
    const tiles = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill("."));
    const set = (x, y, ch) => {
      if (x >= 0 && x < MAP_COLS && y >= 0 && y < MAP_ROWS) tiles[y][x] = ch;
    };
    const ground = (from, to, top) => {
      for (let x = from; x <= to; x += 1) {
        set(x, top, "G");
        for (let y = top + 1; y < MAP_ROWS; y += 1) set(x, y, "D");
      }
    };
    const row = (y, from, to, ch) => {
      for (let x = from; x <= to; x += 1) set(x, y, ch);
    };
    const coins = (points) => {
      for (const [x, y] of points) set(x, y, "C");
    };
    const coinLine = (from, to, y) => {
      for (let x = from; x <= to; x += 1) set(x, y, "C");
    };
    const coinArc = (from, y, length) => {
      for (let i = 0; i < length; i += 1) {
        const dy = Math.abs(i - (length - 1) / 2) > length / 3 ? 1 : 0;
        set(from + i, y + dy, "C");
      }
    };
    const pipeWithPiranha = (x, y) => {
      row(y, x, x + 1, "I");
      row(y + 1, x, x + 1, "J");
      set(x, y - 1, "Y");
    };
    return { tiles, set, ground, row, coins, coinLine, coinArc, pipeWithPiranha };
  }

  function buildCloudLiftLevel(levelIndex) {
    const { tiles, set, ground, row, coins, coinLine, coinArc, pipeWithPiranha } = createLevelSketch();

    ground(0, 19, 14);
    ground(23, 39, 15);
    ground(44, 60, 13);
    ground(68, 86, 15);
    ground(92, 108, 12);
    ground(116, 134, 15);
    ground(142, 159, 12);
    ground(166, 187, 15);
    ground(194, 231, 13);

    row(10, 7, 12, "W");
    row(8, 22, 26, "W");
    row(6, 31, 35, "W");
    row(9, 59, 64, "W");
    row(7, 66, 71, "W");
    row(8, 106, 111, "W");
    row(7, 132, 138, "W");
    row(6, 146, 152, "W");
    row(8, 159, 165, "W");
    row(9, 186, 193, "W");
    row(8, 208, 215, "W");
    row(12, 40, 43, "W");
    row(11, 109, 115, "W");
    row(10, 160, 165, "W");
    row(11, 49, 53, "B");
    row(9, 97, 101, "B");
    row(10, 171, 177, "B");
    set(53, 12, "S");
    set(166, 14, "S");
    set(18, 11, "Q");
    set(84, 11, "Q");
    set(139, 8, "Q");
    set(219, 9, "Q");
    pipeWithPiranha(73, 14);
    pipeWithPiranha(119, 14);
    pipeWithPiranha(199, 12);

    coinArc(6, 7, 8);
    coinLine(22, 26, 6);
    coinArc(30, 4, 7);
    coinLine(48, 52, 9);
    coinArc(58, 6, 9);
    coinLine(96, 101, 7);
    coinArc(128, 6, 11);
    coinLine(146, 153, 4);
    coinArc(158, 6, 9);
    coinLine(186, 193, 7);
    coinArc(208, 5, 8);
    coins([
      [74, 11],
      [80, 11],
      [119, 11],
      [124, 10],
      [151, 9],
      [174, 8],
      [200, 10],
      [225, 9],
    ]);

    [
      [28, 5],
      [65, 5],
      [90, 8],
      [113, 6],
      [156, 6],
      [183, 7],
      [204, 7],
    ].forEach(([x, y]) => set(x, y, "O"));
    [
      [25, 5],
      [62, 5],
      [99, 5],
      [135, 5],
      [150, 4],
      [190, 6],
      [212, 5],
    ].forEach(([x, y]) => set(x, y, "M"));
    [
      [55, 8],
      [147, 4],
      [217, 6],
    ].forEach(([x, y]) => set(x, y, "R"));
    [
      [72, 10],
      [163, 6],
    ].forEach(([x, y]) => set(x, y, "T"));
    [
      [34, 14],
      [78, 14],
      [126, 14],
      [178, 14],
      [211, 12],
      [221, 12],
    ].forEach(([x, y], index) => set(x, y, index % 2 === 0 ? "E" : "N"));
    [
      [5, 13, "f"],
      [26, 14, "a"],
      [49, 12, "v"],
      [75, 14, "f"],
      [99, 11, "x"],
      [121, 14, "f"],
      [148, 11, "a"],
      [175, 14, "f"],
      [207, 12, "v"],
      [228, 12, "a"],
    ].forEach(([x, y, ch]) => set(x, y, ch));

    set(122, 13, "K");
    set(226, 11, "F");

    const platforms = [
      movingPlatform(40, 11, 4, 46, 0, 0.95, 0.2),
      movingPlatform(88, 10, 4, 0, 58, 1.1, 1.2),
      movingPlatform(176, 10, 4, 0, 50, 1.05, 2.8),
    ];
    return finishLevel(tiles, platforms, { x: 76, y: 14 * TILE - 34 }, levelIndex);
  }

  function buildFlagRushLevel(levelIndex) {
    const { tiles, set, ground, row, coins, coinLine, coinArc, pipeWithPiranha } = createLevelSketch();

    ground(0, 20, 14);
    ground(24, 45, 14);
    ground(49, 70, 15);
    ground(73, 98, 13);
    ground(102, 129, 15);
    ground(134, 159, 12);
    ground(162, 190, 15);
    ground(196, 231, 13);

    row(9, 14, 19, "W");
    row(10, 45, 49, "W");
    row(7, 56, 62, "W");
    row(8, 97, 103, "W");
    row(6, 128, 134, "W");
    row(8, 156, 162, "W");
    row(7, 190, 196, "W");
    row(10, 21, 23, "W");
    row(12, 46, 48, "W");
    row(11, 130, 133, "W");
    row(10, 191, 195, "W");
    row(11, 78, 84, "B");
    row(9, 111, 118, "B");
    row(10, 171, 178, "B");
    set(67, 14, "S");
    set(155, 11, "S");
    set(22, 10, "Q");
    set(88, 10, "Q");
    set(133, 5, "Q");
    set(202, 10, "Q");
    pipeWithPiranha(31, 13);
    pipeWithPiranha(116, 14);
    pipeWithPiranha(173, 14);
    pipeWithPiranha(213, 12);

    coinArc(10, 7, 10);
    coinLine(28, 41, 10);
    coinArc(53, 5, 10);
    coinLine(77, 84, 9);
    coinArc(96, 6, 11);
    coinLine(111, 118, 7);
    coinArc(128, 4, 8);
    coinLine(158, 163, 6);
    coinArc(170, 8, 12);
    coinLine(190, 196, 5);
    coinArc(208, 6, 11);
    coins([
      [63, 12],
      [76, 9],
      [106, 12],
      [122, 11],
      [141, 8],
      [150, 8],
      [184, 12],
      [221, 9],
    ]);

    [
      [20, 9],
      [70, 10],
      [102, 6],
      [126, 7],
      [161, 6],
      [189, 5],
    ].forEach(([x, y]) => set(x, y, "O"));
    [
      [17, 6],
      [58, 5],
      [101, 5],
      [131, 4],
      [159, 6],
      [193, 4],
      [214, 6],
    ].forEach(([x, y]) => set(x, y, "M"));
    [
      [48, 7],
      [139, 5],
      [205, 7],
    ].forEach(([x, y]) => set(x, y, "R"));
    [
      [23, 11],
      [151, 7],
    ].forEach(([x, y]) => set(x, y, "T"));
    [
      [29, 13],
      [34, 13],
      [39, 13],
      [82, 12],
      [90, 12],
      [112, 14],
      [120, 14],
      [170, 14],
      [176, 14],
      [182, 14],
      [209, 12],
      [216, 12],
      [223, 12],
    ].forEach(([x, y], index) => set(x, y, index % 2 === 0 ? "E" : "N"));
    [
      [6, 13, "f"],
      [31, 13, "a"],
      [52, 14, "v"],
      [78, 12, "f"],
      [114, 14, "x"],
      [141, 11, "f"],
      [168, 14, "a"],
      [184, 14, "f"],
      [207, 12, "v"],
      [228, 12, "a"],
    ].forEach(([x, y, ch]) => set(x, y, ch));

    set(96, 11, "K");
    set(166, 13, "K");
    set(226, 11, "F");

    const platforms = [
      movingPlatform(68, 11, 4, 52, 0, 1.05, 0.5),
      movingPlatform(187, 9, 4, 48, 0, 1.0, 2.4),
    ];
    return finishLevel(tiles, platforms, { x: 76, y: 14 * TILE - 34 }, levelIndex);
  }

  function buildPipeworksAirshipLevel(levelIndex) {
    const { tiles, set, ground, row, coins, coinLine, coinArc, pipeWithPiranha } = createLevelSketch();
    const bonusPipe = (x, y) => {
      row(y, x, x + 1, "I");
      row(y + 1, x, x + 1, "J");
      set(x, y - 1, "Z");
    };
    const cannonPipe = (x, y) => set(x, y, "V");
    const megaRocket = (x, y) => set(x, y, "L");
    const airship = (from, to, y) => {
      row(y, from, to, "A");
      for (let x = from + 4; x <= to; x += 8) set(x, y - 1, "A");
    };

    ground(0, 24, 14);
    ground(28, 43, 15);
    ground(46, 78, 15);
    ground(82, 108, 13);
    ground(112, 130, 15);
    ground(134, 143, 14);
    ground(207, 231, 13);
    airship(145, 171, 12);
    airship(175, 205, 11);

    row(8, 45, 78, "B");
    row(11, 30, 34, "B");
    row(10, 55, 61, "B");
    row(11, 70, 76, "B");
    row(9, 92, 98, "B");
    row(8, 115, 121, "B");
    row(9, 150, 158, "A");
    row(8, 184, 192, "A");
    row(10, 198, 204, "A");
    set(66, 14, "S");
    set(137, 13, "S");
    set(32, 10, "Q");
    set(58, 9, "Q");
    set(95, 8, "Q");
    set(188, 7, "Q");

    bonusPipe(18, 13);
    bonusPipe(49, 14);
    bonusPipe(75, 14);
    bonusPipe(100, 12);
    pipeWithPiranha(36, 14);
    pipeWithPiranha(88, 12);
    pipeWithPiranha(119, 14);
    pipeWithPiranha(216, 12);
    cannonPipe(126, 12);
    cannonPipe(184, 9);
    megaRocket(140, 8);
    megaRocket(168, 6);
    megaRocket(214, 8);

    coinLine(5, 10, 11);
    coinArc(27, 10, 8);
    coinLine(50, 55, 12);
    coinArc(57, 8, 9);
    coinLine(69, 75, 9);
    coinArc(87, 7, 9);
    coinLine(115, 121, 6);
    coinArc(136, 9, 8);
    coinLine(149, 157, 7);
    coinArc(176, 6, 10);
    coinLine(196, 203, 8);
    coinArc(211, 7, 10);
    coins([
      [21, 10],
      [40, 11],
      [65, 11],
      [101, 9],
      [129, 10],
      [160, 8],
      [190, 6],
      [222, 8],
    ]);

    [
      [31, 9],
      [63, 8],
      [103, 8],
      [146, 9],
      [183, 6],
      [207, 8],
    ].forEach(([x, y]) => set(x, y, "O"));
    [
      [52, 11],
      [72, 8],
      [97, 7],
      [121, 6],
      [152, 7],
      [187, 5],
      [219, 6],
    ].forEach(([x, y]) => set(x, y, "M"));
    [
      [59, 7],
      [158, 6],
      [202, 7],
    ].forEach(([x, y]) => set(x, y, "R"));
    [
      [57, 11],
      [154, 8],
    ].forEach(([x, y]) => set(x, y, "H"));
    [
      [91, 8],
      [198, 6],
    ].forEach(([x, y]) => set(x, y, "T"));
    [
      [22, 13],
      [38, 14],
      [70, 14],
      [93, 12],
      [116, 14],
      [151, 11],
      [164, 11],
      [181, 10],
      [218, 12],
    ].forEach(([x, y], index) => set(x, y, index % 2 === 0 ? "E" : "N"));
    [
      [6, 13, "x"],
      [19, 13, "f"],
      [35, 14, "v"],
      [52, 14, "a"],
      [76, 14, "f"],
      [99, 12, "x"],
      [122, 14, "v"],
      [146, 11, "f"],
      [178, 10, "a"],
      [205, 10, "v"],
      [226, 12, "f"],
    ].forEach(([x, y, ch]) => set(x, y, ch));

    set(106, 11, "K");
    set(180, 9, "K");
    set(194, 10, "X");
    set(226, 11, "F");

    const platforms = [
      movingPlatform(41, 12, 4, 40, 0, 0.95, 0.3),
      movingPlatform(110, 11, 4, 0, 50, 1.05, 1.5),
      movingPlatform(132, 10, 4, 44, 0, 1.0, 2.2),
      movingPlatform(170, 9, 4, 36, 0, 1.18, 0.7),
    ];
    return finishLevel(tiles, platforms, { x: 76, y: 14 * TILE - 34 }, levelIndex);
  }

  function movingPlatform(tileX, tileY, tileW, moveX, moveY, speed, phase) {
    const baseX = tileX * TILE;
    const baseY = tileY * TILE;
    return {
      baseX,
      baseY,
      x: baseX,
      y: baseY,
      prevX: baseX,
      prevY: baseY,
      w: tileW * TILE,
      h: 18,
      moveX,
      moveY,
      speed,
      phase,
      dx: 0,
      dy: 0,
    };
  }

  function parseObjects(tiles) {
    const coins = [];
    const shards = [];
    const rings = [];
    const relics = [];
    const stars = [];
    const enemies = [];
    const piranhas = [];
    const bonusPipes = [];
    const cannonPipes = [];
    const megaRockets = [];
    const suitPowerups = [];
    const bosses = [];
    const checkpoints = [];
    const plants = [];
    let goal = null;

    for (let y = 0; y < MAP_ROWS; y += 1) {
      for (let x = 0; x < MAP_COLS; x += 1) {
        const ch = tiles[y][x];
        if (ch === "C") {
          coins.push({
            x: x * TILE + TILE * 0.5,
            y: y * TILE + TILE * 0.5,
            collected: false,
            anim: 0,
            phase: coins.length * 0.37,
          });
          tiles[y][x] = ".";
        } else if (ch === "M") {
          shards.push({
            x: x * TILE + TILE * 0.5,
            y: y * TILE + TILE * 0.5,
            collected: false,
            anim: 0,
            phase: shards.length * 0.51,
          });
          tiles[y][x] = ".";
        } else if (ch === "R") {
          relics.push({
            x: x * TILE + TILE * 0.5,
            y: y * TILE + TILE * 0.5,
            collected: false,
            anim: 0,
            phase: relics.length * 0.71,
          });
          tiles[y][x] = ".";
        } else if (ch === "T") {
          stars.push({
            x: x * TILE + TILE * 0.5,
            y: y * TILE + TILE * 0.5,
            collected: false,
            anim: 0,
            phase: stars.length * 0.83,
          });
          tiles[y][x] = ".";
        } else if (ch === "O") {
          rings.push({
            x: x * TILE + TILE * 0.5,
            y: y * TILE + TILE * 0.5,
            cooldown: 0,
            anim: rings.length * 0.33,
          });
          tiles[y][x] = ".";
        } else if (ch === "E" || ch === "N") {
          const flip = ch === "N";
          enemies.push({
            x: x * TILE - 2,
            y: y * TILE + 3,
            w: 36,
            h: 28,
            homeX: x * TILE - 2,
            homeY: y * TILE + 3,
            vx: flip ? 52 : -52,
            vy: 0,
            baseSpeed: 52,
            flip,
            kind: enemies.length % ASSET_MAP.enemyFrames.length,
            grounded: false,
            active: true,
            anim: 0,
          });
          tiles[y][x] = ".";
        } else if (ch === "Y") {
          piranhas.push({
            x: x * TILE,
            pipeY: (y + 1) * TILE,
            anim: 0,
            phase: piranhas.length * 0.67,
            stunned: 0,
          });
          tiles[y][x] = ".";
        } else if (ch === "Z") {
          bonusPipes.push({
            x: x * TILE,
            y: (y + 1) * TILE - 36,
            pipeY: (y + 1) * TILE,
            w: TILE * 2,
            h: 46,
            cooldown: 0,
            phase: bonusPipes.length * 0.41,
            target: null,
          });
          tiles[y][x] = ".";
        } else if (ch === "V") {
          cannonPipes.push({
            x: x * TILE - 10,
            y: y * TILE - 12,
            w: 74,
            h: 64,
            cooldown: 0,
            anim: 0,
          });
          tiles[y][x] = ".";
        } else if (ch === "L") {
          const homeX = x * TILE;
          megaRockets.push({
            x: homeX + megaRockets.length * 46,
            y: y * TILE,
            homeX,
            minX: Math.max(0, homeX - 620),
            maxX: Math.min(MAP_COLS * TILE, homeX + 160),
            vx: -MEGA_ROCKET_SPEED,
            active: true,
            oneShot: false,
            anim: megaRockets.length * 0.33,
          });
          tiles[y][x] = ".";
        } else if (ch === "H") {
          suitPowerups.push({
            x: x * TILE + TILE * 0.5,
            y: y * TILE + TILE * 0.5,
            collected: false,
            anim: 0,
            phase: suitPowerups.length * 0.64,
          });
          tiles[y][x] = ".";
        } else if (ch === "X") {
          bosses.push({
            x: x * TILE - 12,
            y: y * TILE - 52,
            homeY: y * TILE - 52,
            w: 56,
            h: 60,
            homeX: x * TILE - 12,
            minX: x * TILE - 116,
            maxX: x * TILE + 84,
            vx: -74,
            hp: 5,
            maxHp: 5,
            active: true,
            invulnerable: 0,
            attackTimer: 1.1,
            anim: 0,
            facing: -1,
          });
          tiles[y][x] = ".";
        } else if (ch === "K") {
          checkpoints.push({
            id: `k-${x}-${y}`,
            x: x * TILE,
            y: y * TILE - 44,
            w: 48,
            h: 76,
            spawnX: x * TILE - 28,
            spawnY: y * TILE - 34,
            phase: checkpoints.length * 0.31,
            reached: false,
          });
          tiles[y][x] = ".";
        } else if (ch === "F") {
          goal = {
            x: x * TILE,
            y: y * TILE - 34,
            w: 72,
            h: 96,
          };
          tiles[y][x] = ".";
        } else if (decorTiles.has(ch)) {
          plants.push({
            x: x * TILE,
            y: y * TILE,
            kind: ch === "f" ? "flower" : "tuft",
          });
          tiles[y][x] = ".";
        }
      }
    }

    return { coins, shards, rings, relics, stars, enemies, piranhas, bonusPipes, cannonPipes, megaRockets, suitPowerups, bosses, checkpoints, plants, goal };
  }

  function createTileAtlas() {
    const atlas = document.createElement("canvas");
    atlas.width = TILE * 8;
    atlas.height = TILE * 4;
    const a = atlas.getContext("2d");
    a.imageSmoothingEnabled = false;

    cell(a, 0, 0, () => {
      a.fillStyle = "#7b4b2f";
      a.fillRect(0, 8, 32, 24);
      a.fillStyle = "#54d682";
      a.fillRect(0, 0, 32, 10);
      a.fillStyle = "#2da75d";
      a.fillRect(0, 8, 32, 4);
      a.fillStyle = "#8f5a34";
      for (let i = 0; i < 6; i += 1) a.fillRect((i * 7) % 30, 14 + ((i * 5) % 14), 4, 3);
    });

    cell(a, 1, 0, () => {
      a.fillStyle = "#74442b";
      a.fillRect(0, 0, 32, 32);
      a.fillStyle = "#8d5637";
      for (let y = 3; y < 32; y += 8) {
        for (let x = (y % 16) / 2; x < 32; x += 12) a.fillRect(x, y, 5, 3);
      }
    });

    cell(a, 2, 0, () => {
      a.fillStyle = "#b85d37";
      a.fillRect(0, 0, 32, 32);
      a.fillStyle = "#e08045";
      a.fillRect(2, 2, 28, 6);
      a.fillRect(2, 14, 28, 5);
      a.fillStyle = "#7e3a2e";
      a.fillRect(0, 9, 32, 3);
      a.fillRect(0, 21, 32, 3);
      for (let x = 7; x < 32; x += 15) a.fillRect(x, 0, 3, 32);
    });

    cell(a, 3, 0, () => {
      a.fillStyle = "#ffd35a";
      a.fillRect(0, 0, 32, 32);
      a.fillStyle = "#fff0a6";
      a.fillRect(4, 4, 24, 6);
      a.fillStyle = "#cb7a2e";
      a.fillRect(0, 0, 32, 4);
      a.fillRect(0, 28, 32, 4);
      a.fillRect(0, 0, 4, 32);
      a.fillRect(28, 0, 4, 32);
      a.fillStyle = "#6f3e19";
      a.fillRect(13, 8, 6, 7);
      a.fillRect(16, 15, 4, 7);
      a.fillRect(13, 24, 6, 4);
    });

    cell(a, 4, 0, () => {
      a.fillStyle = "#9c8a62";
      a.fillRect(0, 0, 32, 32);
      a.fillStyle = "#c0b27a";
      a.fillRect(4, 4, 24, 5);
      a.fillStyle = "#756949";
      a.fillRect(0, 28, 32, 4);
      a.fillRect(0, 0, 4, 32);
      a.fillRect(28, 0, 4, 32);
    });

    cell(a, 5, 0, () => {
      a.fillStyle = "#6d4b36";
      a.fillRect(0, 10, 32, 16);
      a.fillStyle = "#b27349";
      a.fillRect(0, 6, 32, 8);
      a.fillStyle = "#e49a5a";
      a.fillRect(2, 6, 28, 3);
      a.fillStyle = "#4b3427";
      a.fillRect(0, 24, 32, 4);
    });

    cell(a, 6, 0, () => {
      a.fillStyle = "#35b7b2";
      a.fillRect(2, 8, 28, 22);
      a.fillStyle = "#9bfff1";
      a.fillRect(5, 3, 22, 8);
      a.fillStyle = "#1d7777";
      a.fillRect(4, 22, 24, 5);
      a.fillStyle = "#ffffff";
      a.fillRect(9, 5, 14, 3);
    });

    cell(a, 7, 0, () => {
      a.fillStyle = "rgba(115, 171, 220, 0.34)";
      a.fillRect(3, 19, 26, 7);
      a.fillStyle = "#f8fdff";
      a.fillRect(3, 15, 26, 10);
      a.fillRect(7, 11, 8, 8);
      a.fillRect(15, 9, 10, 10);
      a.fillStyle = "#9dc0e7";
      a.fillRect(3, 24, 26, 3);
      a.fillRect(7, 18, 4, 3);
    });

    cell(a, 0, 1, () => {
      a.fillStyle = "#2da75d";
      a.fillRect(8, 18, 5, 12);
      a.fillRect(18, 14, 5, 16);
      a.fillStyle = "#54d682";
      a.fillRect(5, 12, 10, 8);
      a.fillRect(16, 8, 10, 8);
    });

    cell(a, 1, 1, () => {
      a.fillStyle = "#2da75d";
      a.fillRect(14, 14, 4, 16);
      a.fillStyle = "#ff6f61";
      a.fillRect(8, 8, 8, 8);
      a.fillRect(17, 7, 8, 8);
      a.fillStyle = "#ffd35a";
      a.fillRect(14, 10, 5, 5);
    });

    return atlas;
  }

  function createSpriteAtlas() {
    const cellSize = 48;
    const canvas = document.createElement("canvas");
    canvas.width = cellSize * 8;
    canvas.height = cellSize * 3;
    const s = canvas.getContext("2d");
    s.imageSmoothingEnabled = false;
    const frames = {};

    const add = (name, col, row, draw) => {
      const ox = col * cellSize;
      const oy = row * cellSize;
      frames[name] = { x: ox, y: oy, w: cellSize, h: cellSize };
      s.save();
      s.translate(ox, oy);
      draw(s);
      s.restore();
    };

    add("heroIdle", 0, 0, (g) => drawHero(g, 0));
    add("heroRun0", 1, 0, (g) => drawHero(g, 1));
    add("heroRun1", 2, 0, (g) => drawHero(g, 2));
    add("heroJump", 3, 0, (g) => drawHero(g, 3));
    add("heroFall", 4, 0, (g) => drawHero(g, 4));
    add("heroHurt", 5, 0, (g) => drawHero(g, 5));
    add("snail0", 0, 1, (g) => drawSnail(g, 0));
    add("snail1", 1, 1, (g) => drawSnail(g, 1));
    add("tuft", 2, 1, (g) => drawTuft(g));
    add("flower", 3, 1, (g) => drawFlower(g));
    for (let i = 0; i < 4; i += 1) add(`coin${i}`, i, 2, (g) => drawCoin(g, i));

    return { canvas, frames };
  }

  function cell(ctx2d, x, y, draw) {
    ctx2d.save();
    ctx2d.translate(x * TILE, y * TILE);
    draw();
    ctx2d.restore();
  }

  function tileFrame(ch) {
    const frames = {
      G: [0, 0],
      D: [1, 0],
      B: [2, 0],
      Q: [3, 0],
      U: [4, 0],
      P: [5, 0],
      S: [6, 0],
      W: [7, 0],
      I: [6, 0],
      J: [4, 0],
      A: [5, 0],
      a: [0, 1],
      f: [1, 1],
      v: [0, 1],
      x: [1, 1],
    };
    const frame = frames[ch];
    return frame ? { x: frame[0] * TILE, y: frame[1] * TILE } : null;
  }

  function drawHero(g, pose) {
    const skin = "#f2bd7d";
    const hair = "#4a2b1e";
    const cap = pose === 5 ? "#ff6f61" : "#35b7b2";
    const capDark = "#1d7777";
    const shirt = "#fff7dc";
    const overalls = "#2f6fd6";
    const boots = "#3a2a23";
    const armShift = pose === 1 ? 3 : pose === 2 ? -2 : 0;
    const legShift = pose === 1 ? 4 : pose === 2 ? -3 : pose === 3 ? 2 : 0;

    g.fillStyle = "rgba(0,0,0,0.14)";
    g.fillRect(13, 41, 23, 4);
    g.fillStyle = capDark;
    g.fillRect(12, 7, 23, 8);
    g.fillStyle = cap;
    g.fillRect(9, 11, 30, 7);
    g.fillRect(29, 15, 10, 4);
    g.fillStyle = hair;
    g.fillRect(12, 18, 8, 10);
    g.fillStyle = skin;
    g.fillRect(18, 17, 16, 14);
    g.fillRect(32, 22, 5, 5);
    g.fillStyle = "#2b1f18";
    g.fillRect(29, 21, 3, 3);
    g.fillStyle = shirt;
    g.fillRect(15, 30, 20, 8);
    g.fillStyle = overalls;
    g.fillRect(17, 34, 16, 9);
    g.fillRect(17 + legShift, 41, 7, 5);
    g.fillRect(27 - legShift, 41, 7, 5);
    g.fillStyle = boots;
    g.fillRect(14 + legShift, 44, 10, 3);
    g.fillRect(27 - legShift, 44, 11, 3);
    g.fillStyle = skin;
    g.fillRect(9 - armShift, 31, 7, 8);
    g.fillRect(34 + armShift, 31, 7, 8);
    g.fillStyle = "#ffffff";
    g.fillRect(31, 20, 2, 2);
  }

  function drawSnail(g, step) {
    g.fillStyle = "rgba(0,0,0,0.16)";
    g.fillRect(9, 37, 30, 4);
    g.fillStyle = "#5e6b33";
    g.fillRect(10, 25, 28, 12);
    g.fillStyle = "#8bd24a";
    g.fillRect(8, 21, 18, 12);
    g.fillStyle = "#ffd35a";
    g.fillRect(20, 15, 17, 18);
    g.fillStyle = "#c67235";
    g.fillRect(25, 19, 8, 8);
    g.fillStyle = "#2b1f18";
    g.fillRect(13, 23, 3, 3);
    g.fillRect(19 + step * 3, 36, 7, 3);
    g.fillRect(31 - step * 3, 36, 7, 3);
  }

  function drawTuft(g) {
    g.fillStyle = "#2da75d";
    g.fillRect(16, 22, 4, 18);
    g.fillRect(8, 28, 4, 12);
    g.fillRect(25, 26, 4, 14);
    g.fillStyle = "#54d682";
    g.fillRect(7, 19, 10, 9);
    g.fillRect(14, 13, 10, 12);
    g.fillRect(23, 18, 11, 9);
  }

  function drawFlower(g) {
    g.fillStyle = "#2da75d";
    g.fillRect(22, 21, 4, 19);
    g.fillRect(15, 28, 8, 4);
    g.fillStyle = "#ff6f61";
    g.fillRect(16, 12, 9, 9);
    g.fillRect(25, 11, 9, 9);
    g.fillRect(21, 6, 8, 8);
    g.fillStyle = "#ffd35a";
    g.fillRect(22, 14, 6, 6);
  }

  function drawCoin(g, frame) {
    const widths = [18, 12, 6, 12];
    const x = 24 - widths[frame] / 2;
    g.fillStyle = "#a8681f";
    g.fillRect(x + 2, 13, widths[frame], 24);
    g.fillStyle = "#ffd35a";
    g.fillRect(x, 10, widths[frame], 24);
    g.fillStyle = "#fff0a6";
    g.fillRect(x + 3, 13, Math.max(2, widths[frame] - 7), 5);
  }

  function spawnSpark(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 80 + Math.random() * 170;
      world.effects.push({
        type: "spark",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        gravity: 420,
        color,
        size: 3 + Math.floor(Math.random() * 3),
        life: 0.38 + Math.random() * 0.25,
        maxLife: 0.65,
        age: 0,
      });
    }
  }

  function popDust(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      world.effects.push({
        type: "dust",
        x: x + randomRange(-16, 16),
        y: y + randomRange(-4, 4),
        vx: randomRange(-90, 90),
        vy: randomRange(-80, -25),
        gravity: 320,
        color: "#fff0a6",
        size: 3,
        life: 0.28 + Math.random() * 0.12,
        maxLife: 0.4,
        age: 0,
      });
    }
  }

  function spawnText(x, y, text) {
    world.effects.push({
      type: "text",
      text,
      x,
      y,
      vx: 0,
      vy: -46,
      gravity: 0,
      color: "#fff7dc",
      size: 0,
      life: 0.75,
      maxLife: 0.75,
      age: 0,
    });
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function easeInOut(value) {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function approach(value, target, amount) {
    if (value < target) return Math.min(target, value + amount);
    if (value > target) return Math.max(target, value - amount);
    return target;
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function unlockAudio() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioContext = new AudioCtx();
    }
    audioContext?.resume?.();
  }

  function setBgmForLevel(levelIndex) {
    const next = bgmTracks[levelIndex] || bgmTracks[0] || bgmTrack;
    if (!next || next === bgmTrack) return;
    const shouldResume = bgmTrack && !bgmTrack.paused && game?.mode === "playing";
    bgmTrack?.pause();
    if (bgmTrack) bgmTrack.currentTime = 0;
    bgmTrack = next;
    if (shouldResume) startBgm();
  }

  function startBgm() {
    if (!bgmTrack) return;
    bgmTrack.volume = 0.24;
    bgmTrack.play().catch(() => {});
  }

  function pauseBgm() {
    bgmTrack?.pause();
  }

  function playSound(name) {
    const audio = audioAssets[name];
    if (audio) {
      const shot = audio.cloneNode();
      shot.volume = audio.volume;
      shot.play().catch(() => synthSound(name));
      return;
    }
    synthSound(name);
  }

  function synthSound(name) {
    if (!audioContext) return;
    const now = audioContext.currentTime;
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    gain.connect(audioContext.destination);

    const tone = (frequency, start, duration, type = "square") => {
      const osc = audioContext.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now + start);
      osc.connect(gain);
      osc.start(now + start);
      osc.stop(now + start + duration);
    };

    if (name === "coin") {
      tone(880, 0, 0.08);
      tone(1320, 0.07, 0.12);
    } else if (name === "shard") {
      tone(660, 0, 0.08, "triangle");
      tone(990, 0.06, 0.12, "triangle");
    } else if (name === "jump") {
      tone(440, 0, 0.08);
      tone(660, 0.05, 0.1);
    } else if (name === "doubleJump") {
      tone(660, 0, 0.08, "triangle");
      tone(1180, 0.05, 0.14);
    } else if (name === "ring") {
      tone(330, 0, 0.09, "sawtooth");
      tone(990, 0.06, 0.16, "triangle");
    } else if (name === "spring") {
      tone(330, 0, 0.06);
      tone(990, 0.05, 0.16);
    } else if (name === "stomp") {
      tone(220, 0, 0.09, "sawtooth");
      tone(520, 0.04, 0.12);
    } else if (name === "hurt") {
      tone(180, 0, 0.18, "sawtooth");
    } else if (name === "checkpoint") {
      tone(660, 0, 0.08);
      tone(880, 0.07, 0.08);
      tone(1180, 0.14, 0.12);
    } else if (name === "win") {
      tone(523, 0, 0.09);
      tone(659, 0.09, 0.09);
      tone(784, 0.18, 0.16);
    } else {
      tone(150, 0, 0.08, "triangle");
    }
  }
})();
