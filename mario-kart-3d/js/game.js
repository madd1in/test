(() => {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const shell = document.getElementById("game-shell");
  const minimap = document.getElementById("minimap");
  const mapCtx = minimap.getContext("2d");

  const ui = {
    speed: document.getElementById("speed-value"),
    lap: document.getElementById("lap-value"),
    position: document.getElementById("position-value"),
    item: document.getElementById("item-value"),
    time: document.getElementById("time-value"),
    coins: document.getElementById("coin-value"),
    overdrive: document.getElementById("overdrive-value"),
    style: document.getElementById("style-value"),
    fullscreen: document.getElementById("fullscreen-button"),
    toast: document.getElementById("toast"),
    countdown: document.getElementById("countdown-value"),
    finishTitle: document.getElementById("finish-title"),
    finishStats: document.getElementById("finish-stats"),
    screens: {
      menu: document.getElementById("menu-screen"),
      countdown: document.getElementById("countdown-screen"),
      pause: document.getElementById("pause-screen"),
      finish: document.getElementById("finish-screen")
    }
  };

  const SEGMENT_LENGTH = 180;
  const ROAD_WIDTH = 2200;
  const DRAW_DISTANCE = 42;
  const RENDER_SCALE = 0.68;
  const CAMERA_HEIGHT = 1120;
  const CAMERA_DEPTH = 1 / Math.tan((92 * Math.PI / 180) / 2);
  const LANES = 3;
  const TOTAL_LAPS = 3;
  const RUMBLE_LENGTH = 4;
  const ARCADE_FONT = '"Cooper Black", "Cooper Std Black", "Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif';
  const KART_FRAME_COUNT = 9;
  const KART_CENTER_FRAME = 4;

  const COLORS = {
    skyTop: "#142033",
    skyBottom: "#ffd88b",
    fog: "rgba(255, 214, 149, 0.18)",
    light: {
      road: "#62666d",
      grass: "#277945",
      rumble: "#f4e9d0",
      lane: "#d8d9cf"
    },
    dark: {
      road: "#555961",
      grass: "#22683d",
      rumble: "#e34f44",
      lane: "#c6c9bd"
    },
    start: {
      road: "#d7d2be",
      grass: "#287747",
      rumble: "#171717",
      lane: "#181818"
    },
    finish: {
      road: "#242424",
      grass: "#287747",
      rumble: "#f7f0d5",
      lane: "#f7f0d5"
    }
  };

  const SPRITE_SHEETS = {
    rally: "assets/rally-sprite-sheet.png",
    props: "assets/tiles/design-props.png"
  };

  const SHEET_LAYOUTS = {
    rally: {
      characterRows: 3,
      characterCols: 9,
      characterTopRatio: 0.75,
      iconRows: 1,
      iconCols: 9,
      iconTopRatio: 0.75
    },
    props: {
      characterRows: 1,
      characterCols: 1,
      characterTopRatio: 0,
      iconRows: 4,
      iconCols: 8,
      iconTopRatio: 0
    }
  };

  const ART_ASSETS = {
    map: "assets/coastal-rally-map.png",
    roadTile: "assets/coastal-road-tile.png",
    tileset: "assets/tiles/turbo-rally-tileset.png",
    coastLayer: "assets/tiles/backdrop-coast.png",
    skylineLayer: "assets/tiles/backdrop-skyline.png",
    cloudLayer: "assets/tiles/backdrop-clouds.png",
    horizonElementsLayer: "assets/tiles/backdrop-horizon-elements.png"
  };

  const TILE_SIZE = 64;
  const TILE_RECTS = {
    asphalt: { col: 0, row: 0 },
    lane: { col: 1, row: 0 },
    curb: { col: 2, row: 0 },
    grass: { col: 3, row: 0 },
    sand: { col: 4, row: 0 },
    water: { col: 5, row: 0 },
    boost: { col: 6, row: 0 },
    start: { col: 7, row: 0 },
    wetRoad: { col: 0, row: 1 },
    crackedRoad: { col: 1, row: 1 },
    cliff: { col: 2, row: 1 },
    city: { col: 3, row: 1 },
    darkGrass: { col: 4, row: 1 }
  };

  const KARTS = {
    sprinter: {
      name: "Lime Bolt",
      body: "#59cb49",
      trim: "#f6d73d",
      maxSpeed: 9150,
      accel: 7200,
      grip: 1,
      driftSteer: 1.24,
      sprite: { sheet: "rally", row: 0 }
    },
    drifter: {
      name: "Honey Drift",
      body: "#ffd24a",
      trim: "#272111",
      maxSpeed: 8750,
      accel: 6750,
      grip: 1.12,
      driftSteer: 1.5,
      sprite: { sheet: "rally", row: 1 }
    },
    heavy: {
      name: "Coral Comet",
      body: "#ef5638",
      trim: "#ffcf54",
      maxSpeed: 9500,
      accel: 6000,
      grip: 0.92,
      driftSteer: 1.1,
      sprite: { sheet: "rally", row: 2 }
    }
  };

  const OPPONENTS = [
    { name: "Azure", color: "#4dd6cb", trim: "#f5f7eb", lane: -0.55, speed: 8550, sprite: { sheet: "rally", row: 0 } },
    { name: "Pearl", color: "#f5f7eb", trim: "#151515", lane: 0.15, speed: 8420, sprite: { sheet: "rally", row: 1 } },
    { name: "Copper", color: "#d88f3b", trim: "#513123", lane: 0.56, speed: 8320, sprite: { sheet: "rally", row: 2 } },
    { name: "Violet", color: "#8f7bff", trim: "#f5f7eb", lane: -0.2, speed: 8240, sprite: { sheet: "rally", row: 1 } },
    { name: "Harbor", color: "#6f96d5", trim: "#f5f7eb", lane: 0.42, speed: 8130, sprite: { sheet: "rally", row: 0 } },
    { name: "Circuit", color: "#7ee36d", trim: "#151515", lane: -0.42, speed: 8060, sprite: { sheet: "rally", row: 2 } },
    { name: "Nimbus", color: "#78d6ff", trim: "#f5f7eb", lane: 0, speed: 7980, sprite: { sheet: "rally", row: 1 } }
  ];

  const ITEM_NAMES = {
    turbo: "Turbo",
    pulse: "Saege",
    oil: "Schleim",
    shield: "Shield",
    magnet: "Magnet"
  };

  const WORLD_SPRITES = {
    itemBox: { sheet: "props", kind: "icon", row: 0, col: 2 },
    coin: { sheet: "props", kind: "icon", row: 0, col: 0 },
    puddle: { sheet: "props", kind: "icon", row: 0, col: 3 },
    oil: { sheet: "props", kind: "icon", row: 0, col: 3 },
    turbo: { sheet: "props", kind: "icon", row: 0, col: 1 },
    pulse: { sheet: "props", kind: "icon", row: 1, col: 6 },
    shield: { sheet: "props", kind: "icon", row: 1, col: 5 },
    magnet: { sheet: "props", kind: "icon", row: 0, col: 0 },
    lamp: { sheet: "props", kind: "icon", row: 0, col: 6 },
    palm: { sheet: "props", kind: "icon", row: 0, col: 7 },
    palmAlt: { sheet: "props", kind: "icon", row: 1, col: 0 },
    signRight: { sheet: "props", kind: "icon", row: 0, col: 4 },
    signLeft: { sheet: "props", kind: "icon", row: 0, col: 5 },
    flagLeft: { sheet: "props", kind: "icon", row: 1, col: 1 },
    flagRight: { sheet: "props", kind: "icon", row: 1, col: 2 },
    pennants: { sheet: "props", kind: "icon", row: 1, col: 3 },
    cone: { sheet: "props", kind: "icon", row: 1, col: 4 },
    marker: { sheet: "props", kind: "icon", row: 1, col: 5 },
    sparkle: { sheet: "props", kind: "icon", row: 1, col: 6 },
    chevronBoard: { sheet: "props", kind: "icon", row: 1, col: 7 },
    umbrella: { sheet: "props", kind: "icon", row: 2, col: 0 },
    buoy: { sheet: "props", kind: "icon", row: 2, col: 1 },
    crowd: { sheet: "props", kind: "icon", row: 2, col: 2 },
    tires: { sheet: "props", kind: "icon", row: 2, col: 3 },
    flowerBed: { sheet: "props", kind: "icon", row: 2, col: 4 },
    drone: { sheet: "props", kind: "icon", row: 2, col: 5 },
    speedBoard: { sheet: "props", kind: "icon", row: 2, col: 6 }
  };

  const input = {
    gas: false,
    brake: false,
    left: false,
    right: false,
    drift: false,
    item: false,
    overdrive: false
  };

  const swipe = {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startedAt: 0,
    moved: false
  };

  const keyMap = new Map([
    ["arrowup", "gas"],
    ["w", "gas"],
    ["arrowdown", "brake"],
    ["s", "brake"],
    ["arrowleft", "left"],
    ["a", "left"],
    ["arrowright", "right"],
    ["d", "right"],
    ["shift", "drift"],
    [" ", "item"],
    ["e", "overdrive"]
  ]);

  const audio = createAudioEngine();

  let width = 1280;
  let height = 720;
  let segments = [];
  let trackLength = 0;
  let itemBoxes = [];
  let coins = [];
  let puddles = [];
  let trackProps = [];
  let mapPoints = [];
  let lastTime = 0;
  let toastTimer = 0;
  let screenShake = 0;
  let flashTimer = 0;
  let spritesReady = false;
  let roadFogBand = {
    active: false,
    farY: 0,
    farX: 0,
    farW: 0
  };

  const spriteStore = {
    images: {},
    art: {},
    patterns: {},
    cache: new Map()
  };

  const state = {
    mode: "menu",
    selectedKart: "sprinter",
    countdown: 0,
    demoZ: 0,
    demoX: 0,
    player: createPlayer(),
    racers: [],
    hazards: [],
    particles: [],
    sparks: [],
    popups: [],
    rainTime: 0,
    lightningTimer: 0,
    stormAnnounced: false,
    raceTime: 0,
    finishedAt: 0,
    position: 1
  };

  function loadSpriteAssets() {
    const sheetEntries = Object.entries(SPRITE_SHEETS);
    const artEntries = Object.entries(ART_ASSETS);
    const sheetPromises = sheetEntries.map(([id, src]) => loadImage(src).then((image) => {
      spriteStore.images[id] = image;
    }));
    const artPromises = artEntries.map(([id, src]) => loadImage(src).then((image) => {
      spriteStore.art[id] = image;
    }));
    return Promise.all([...sheetPromises, ...artPromises])
      .then(() => {
        warmSpriteCache();
        setupMenuPreviews();
        spritesReady = true;
      })
      .catch(() => {
        spritesReady = false;
      });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function getSheetCellRect(image, spec) {
    const layout = SHEET_LAYOUTS[spec.sheet] || {
      characterRows: 4,
      characterCols: 5,
      characterTopRatio: 0.72,
      iconRows: 3,
      iconCols: 6,
      iconTopRatio: 0.72
    };

    if (spec.kind === "character") {
      const topArea = image.height * layout.characterTopRatio;
      const cellWidth = image.width / layout.characterCols;
      const cellHeight = topArea / layout.characterRows;
      return {
        x: spec.col * cellWidth + cellWidth * 0.04,
        y: spec.row * cellHeight + cellHeight * 0.04,
        w: cellWidth * 0.92,
        h: cellHeight * 0.9
      };
    }

    const iconTop = image.height * layout.iconTopRatio;
    const rowHeight = (image.height - iconTop) / layout.iconRows;
    const colWidth = image.width / layout.iconCols;
    return {
      x: spec.col * colWidth + colWidth * 0.06,
      y: iconTop + spec.row * rowHeight + rowHeight * 0.08,
      w: colWidth * 0.88,
      h: rowHeight * 0.82
    };
  }

  function getSpriteFrame(spec) {
    if (!spec) return null;
    const key = `${spec.sheet}:${spec.kind}:${spec.row}:${spec.col}`;
    if (spriteStore.cache.has(key)) return spriteStore.cache.get(key);
    const image = spriteStore.images[spec.sheet];
    if (!image) return null;
    const rect = getSheetCellRect(image, spec);
    const frame = trimSpriteFromSheet(image, rect);
    spriteStore.cache.set(key, frame);
    return frame;
  }

  function warmSpriteCache() {
    [...Object.values(KARTS), ...OPPONENTS].forEach((racer) => {
      for (let col = 0; col < KART_FRAME_COUNT; col += 1) getKartFrame(racer.sprite, col);
    });
    Object.values(WORLD_SPRITES).forEach((sprite) => getSpriteFrame(sprite));
  }

  function trimSpriteFromSheet(image, rect) {
    const work = document.createElement("canvas");
    work.width = Math.max(1, Math.round(rect.w));
    work.height = Math.max(1, Math.round(rect.h));
    const workCtx = work.getContext("2d", { willReadFrequently: true });
    workCtx.drawImage(
      image,
      rect.x,
      rect.y,
      rect.w,
      rect.h,
      0,
      0,
      work.width,
      work.height
    );

    const data = workCtx.getImageData(0, 0, work.width, work.height);
    const pixels = data.data;
    let minX = work.width;
    let minY = work.height;
    let maxX = -1;
    let maxY = -1;
    const whiteCutoff = 242;
    const cornerSamples = [
      0,
      (work.width - 1) * 4,
      ((work.height - 1) * work.width) * 4,
      ((work.height - 1) * work.width + work.width - 1) * 4
    ];
    const shouldCutWhite = cornerSamples.filter((index) => (
      pixels[index + 3] > 220 &&
      pixels[index] >= whiteCutoff &&
      pixels[index + 1] >= whiteCutoff &&
      pixels[index + 2] >= whiteCutoff
    )).length >= 3;

    for (let y = 0; y < work.height; y += 1) {
      for (let x = 0; x < work.width; x += 1) {
        const index = (y * work.width + x) * 4;
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const a = pixels[index + 3];
        const whiteish = r >= whiteCutoff && g >= whiteCutoff && b >= whiteCutoff;
        if (a < 10 || (shouldCutWhite && whiteish)) {
          pixels[index + 3] = 0;
          continue;
        }
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX < minX || maxY < minY) return null;
    workCtx.putImageData(data, 0, 0);

    const padding = 4;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(work.width - 1, maxX + padding);
    maxY = Math.min(work.height - 1, maxY + padding);

    const trimmed = document.createElement("canvas");
    trimmed.width = maxX - minX + 1;
    trimmed.height = maxY - minY + 1;
    trimmed.getContext("2d").drawImage(
      work,
      minX,
      minY,
      trimmed.width,
      trimmed.height,
      0,
      0,
      trimmed.width,
      trimmed.height
    );
    return trimmed;
  }

  function getKartFrame(sprite, frameIndex) {
    if (!sprite) return null;
    const clamped = clamp(frameIndex, 0, KART_FRAME_COUNT - 1);
    return getSpriteFrame({
      sheet: sprite.sheet,
      kind: "character",
      row: sprite.row,
      col: clamped
    });
  }

  function getPlayerKartFrame(player) {
    const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const speedRatio = clamp(player.speed / KARTS[state.selectedKart].maxSpeed, 0, 1.4);
    if (steer < 0) return player.drifting ? (player.driftCharge > 1.2 ? 0 : 1) : 2;
    if (steer > 0) return player.drifting ? (player.driftCharge > 1.2 ? 8 : 7) : 6;
    if (speedRatio > 0.48) {
      const wobble = Math.floor((state.raceTime * (7 + speedRatio * 5)) % 3);
      return [3, KART_CENTER_FRAME, 5][wobble];
    }
    return KART_CENTER_FRAME;
  }

  function getAIOpponentFrame(racer) {
    if (racer.spinTimer > 0) {
      return Math.sin(racer.spinTimer * 24) > 0 ? 0 : 8;
    }
    const laneIntent = clamp((racer.targetX - racer.x) * 6, -1, 1);
    const sway = Math.sin(racer.phase + state.raceTime * 1.25) * 0.42 + laneIntent;
    if (sway < -0.72) return 1;
    if (sway < -0.24) return 2;
    if (sway > 0.72) return 7;
    if (sway > 0.24) return 6;
    return [3, KART_CENTER_FRAME, 5][Math.floor((state.raceTime * 5.5 + racer.phase) % 3)];
  }

  function drawSprite(frame, x, y, maxW, maxH, options = {}) {
    if (!frame) return false;
    const scale = Math.min(maxW / frame.width, maxH / frame.height);
    const drawW = frame.width * scale;
    const drawH = frame.height * scale;
    const anchorY = options.anchorY ?? 0.82;
    const alpha = options.alpha ?? 1;
    ctx.save();
    ctx.translate(x, y);
    if (options.rotation) ctx.rotate(options.rotation);
    if (options.flipX) ctx.scale(-1, 1);
    ctx.globalAlpha *= alpha;
    if (options.shadow !== false) {
      const shadowY = options.shadowY ?? (drawH * (1 - anchorY) - drawH * 0.015);
      const shadowW = drawW * (options.shadowWidth ?? 0.36);
      const shadowH = drawH * (options.shadowHeight ?? 0.09);
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.ellipse(0, shadowY, shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.drawImage(frame, -drawW / 2, -drawH * anchorY, drawW, drawH);
    ctx.restore();
    return true;
  }

  function drawKartSprite(x, y, w, h, sprite, frameIndex, rotation, options = {}) {
    if (!spritesReady) return false;
    const frame = getKartFrame(sprite, frameIndex);
    return drawSprite(frame, x, y, w * 1.28, h * 1.58, {
      ...options,
      rotation,
      anchorY: options.anchorY ?? 0.78,
      shadowWidth: options.shadowWidth ?? 0.38,
      shadowHeight: options.shadowHeight ?? 0.075
    });
  }

  function drawWorldSprite(spec, x, y, maxW, maxH, options = {}) {
    if (!spritesReady) return false;
    const frame = getSpriteFrame(spec);
    return drawSprite(frame, x, y, maxW, maxH, options);
  }

  function drawKart3DBase(x, y, w, h, body, trim, rotation, frameIndex, isPlayer) {
    const yaw = clamp((frameIndex - KART_CENTER_FRAME) / KART_CENTER_FRAME, -1, 1);
    const skew = yaw * w * 0.11;
    const depth = h * (isPlayer ? 0.18 : 0.15);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.beginPath();
    ctx.ellipse(skew * 0.16, h * 0.31, w * 0.54, h * 0.15, yaw * 0.08, 0, Math.PI * 2);
    ctx.fill();

    drawKartWheel3D(-w * 0.37 - skew * 0.12, h * 0.12, w * 0.18, h * 0.33, trim, 0.78 + Math.max(-yaw, 0) * 0.16);
    drawKartWheel3D(w * 0.37 - skew * 0.12, h * 0.12, w * 0.18, h * 0.33, trim, 0.78 + Math.max(yaw, 0) * 0.16);
    drawKartWheel3D(-w * 0.31 + skew * 0.08, -h * 0.23, w * 0.14, h * 0.25, trim, 0.62 + Math.max(-yaw, 0) * 0.12);
    drawKartWheel3D(w * 0.31 + skew * 0.08, -h * 0.23, w * 0.14, h * 0.25, trim, 0.62 + Math.max(yaw, 0) * 0.12);

    ctx.globalAlpha *= 0.95;
    polygon(
      -w * 0.45 + skew * 0.2,
      -h * 0.19,
      w * 0.45 + skew * 0.2,
      -h * 0.19,
      w * 0.5 - skew * 0.32,
      h * 0.24,
      -w * 0.5 - skew * 0.32,
      h * 0.24,
      body
    );

    polygon(
      -w * 0.5 - skew * 0.32,
      h * 0.17,
      w * 0.5 - skew * 0.32,
      h * 0.17,
      w * 0.42 - skew * 0.18,
      h * 0.31,
      -w * 0.42 - skew * 0.18,
      h * 0.31,
      "rgba(12, 13, 13, 0.7)"
    );

    ctx.globalAlpha *= 0.88;
    ctx.fillStyle = trim;
    roundRect(-w * 0.3 + skew * 0.1, h * 0.04, w * 0.6, depth, Math.max(4, w * 0.04));
    ctx.fill();

    ctx.globalAlpha *= 0.55;
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    roundRect(-w * 0.2 + skew * 0.18, -h * 0.12, w * 0.32, h * 0.06, Math.max(3, w * 0.025));
    ctx.fill();

    ctx.restore();
  }

  function drawKart3DAccents(x, y, w, h, trim, rotation, frameIndex, isPlayer) {
    const yaw = clamp((frameIndex - KART_CENTER_FRAME) / KART_CENTER_FRAME, -1, 1);
    const skew = yaw * w * 0.08;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha *= isPlayer ? 0.82 : 0.7;

    ctx.fillStyle = isPlayer ? "#f5f7eb" : trim;
    roundRect(-w * 0.27 - skew * 0.1, h * 0.2, w * 0.54, h * 0.08, Math.max(3, w * 0.025));
    ctx.fill();

    ctx.globalAlpha *= 0.82;
    ctx.strokeStyle = "rgba(255, 246, 181, 0.64)";
    ctx.lineWidth = Math.max(1, w * 0.012);
    ctx.beginPath();
    ctx.moveTo(-w * 0.34 + skew * 0.25, -h * 0.2);
    ctx.lineTo(w * 0.34 + skew * 0.25, -h * 0.2);
    ctx.stroke();

    drawKartWheel3D(-w * 0.39 - skew * 0.16, h * 0.12, w * 0.13, h * 0.24, trim, 0.9 + Math.max(-yaw, 0) * 0.12);
    drawKartWheel3D(w * 0.39 - skew * 0.16, h * 0.12, w * 0.13, h * 0.24, trim, 0.9 + Math.max(yaw, 0) * 0.12);

    ctx.restore();
  }

  function drawKartWheel3D(x, y, w, h, trim, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, 1);
    ctx.fillStyle = "#101111";
    roundRect(-w / 2, -h / 2, w, h, Math.max(3, Math.min(w, h) * 0.28));
    ctx.fill();
    ctx.fillStyle = "rgba(245, 247, 235, 0.82)";
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.22, h * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = trim;
    ctx.globalAlpha *= 0.74;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.12, h * 0.19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function setupMenuPreviews() {
    document.querySelectorAll(".kart-option").forEach((button) => {
      const kart = KARTS[button.dataset.kart];
      if (!kart) return;
      const preview = button.querySelector(".kart-preview");
      const label = button.querySelector("span:last-child");
      if (label) label.textContent = kart.name;
      const frame = getKartFrame(kart.sprite, KART_CENTER_FRAME) || getKartFrame(kart.sprite, 3);
      if (preview && frame) {
        preview.style.backgroundImage = `url(${frame.toDataURL()})`;
      }
    });
  }

  function createAudioEngine() {
    const bgmTracks = [
      "assets/sounds/turbo-banana-cup.mp3",
      "assets/sounds/kartfire-parade.mp3"
    ];
    let context = null;
    let master = null;
    let musicGain = null;
    let sfxGain = null;
    let engineGain = null;
    let engineOsc = null;
    let bgm = null;
    let bgmIndex = 0;
    let usingExternalMusic = false;
    let musicTimer = 0;
    let step = 0;
    let muted = false;
    const melody = [392, 440, 523, 659, 587, 523, 440, 330, 392, 494, 587, 784, 659, 587, 494, 392];
    const bass = [98, 98, 131, 131, 110, 110, 147, 147];

    function init() {
      if (context) {
        if (context.state === "suspended") context.resume();
        return;
      }

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      context = new AudioContext();
      master = context.createGain();
      musicGain = context.createGain();
      sfxGain = context.createGain();
      engineGain = context.createGain();
      engineOsc = context.createOscillator();

      master.gain.value = muted ? 0 : 0.68;
      musicGain.gain.value = 0.34;
      sfxGain.gain.value = 0.72;
      engineGain.gain.value = 0;
      engineOsc.type = "sawtooth";
      engineOsc.frequency.value = 76;
      engineOsc.connect(engineGain);
      engineGain.connect(master);
      musicGain.connect(master);
      sfxGain.connect(master);
      master.connect(context.destination);
      engineOsc.start();
      if (!startExternalMusic()) startMusicLoop();
    }

    function createBgmElement() {
      if (bgm || !bgmTracks.length) return bgm;

      bgm = new Audio(bgmTracks[bgmIndex]);
      bgm.preload = "auto";
      bgm.volume = 0.42;
      bgm.addEventListener("ended", playNextBgm);
      bgm.addEventListener("error", () => {
        usingExternalMusic = false;
        startMusicLoop();
      });
      return bgm;
    }

    function startExternalMusic() {
      const track = createBgmElement();
      if (!track) return false;

      track.muted = muted;
      const playPromise = track.play();
      if (!playPromise) {
        usingExternalMusic = true;
        stopMusicLoop();
        return true;
      }

      playPromise
        .then(() => {
          usingExternalMusic = true;
          stopMusicLoop();
        })
        .catch(() => {
          usingExternalMusic = false;
          startMusicLoop();
        });
      return true;
    }

    function playNextBgm() {
      if (!bgmTracks.length || !bgm) return;
      bgmIndex = (bgmIndex + 1) % bgmTracks.length;
      bgm.src = bgmTracks[bgmIndex];
      bgm.currentTime = 0;
      startExternalMusic();
    }

    function startMusicLoop() {
      if (musicTimer || usingExternalMusic) return;
      musicTimer = window.setInterval(scheduleMusic, 132);
    }

    function stopMusicLoop() {
      if (!musicTimer) return;
      window.clearInterval(musicTimer);
      musicTimer = 0;
    }

    function scheduleMusic() {
      if (!context || muted || usingExternalMusic) return;
      const now = context.currentTime + 0.02;
      const note = melody[step % melody.length];
      const low = bass[Math.floor(step / 4) % bass.length];
      if (step % 2 === 0) tone(note, 0.09, "square", 0.028, musicGain, now);
      if (step % 4 === 0) tone(low, 0.16, "triangle", 0.05, musicGain, now);
      if (step % 8 === 6) noise(0.035, 0.025, 4200, musicGain, now);
      step += 1;
    }

    function tone(freq, duration, type, gain, destination, start = context.currentTime) {
      if (!context || muted) return;
      const osc = context.createOscillator();
      const env = context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(gain, start + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(env);
      env.connect(destination);
      osc.start(start);
      osc.stop(start + duration + 0.03);
    }

    function noise(duration, gain, filterFreq, destination, start = context.currentTime) {
      if (!context || muted) return;
      const length = Math.max(1, Math.floor(context.sampleRate * duration));
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const env = context.createGain();
      source.buffer = buffer;
      filter.type = "bandpass";
      filter.frequency.value = filterFreq;
      filter.Q.value = 1.8;
      env.gain.setValueAtTime(gain, start);
      env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(filter);
      filter.connect(env);
      env.connect(destination);
      source.start(start);
      source.stop(start + duration);
    }

    function play(name) {
      init();
      if (!context || muted) return;
      const now = context.currentTime;
      if (name === "coin") {
        tone(880, 0.06, "triangle", 0.16, sfxGain, now);
        tone(1320, 0.08, "triangle", 0.11, sfxGain, now + 0.055);
      } else if (name === "boost") {
        tone(160, 0.14, "sawtooth", 0.16, sfxGain, now);
        tone(420, 0.18, "sawtooth", 0.1, sfxGain, now + 0.05);
        noise(0.14, 0.045, 1700, sfxGain, now);
      } else if (name === "item") {
        tone(523, 0.06, "square", 0.1, sfxGain, now);
        tone(784, 0.08, "square", 0.11, sfxGain, now + 0.06);
      } else if (name === "hit") {
        noise(0.16, 0.16, 240, sfxGain, now);
        tone(110, 0.16, "sawtooth", 0.12, sfxGain, now);
      } else if (name === "lap") {
        [523, 659, 784, 1046].forEach((freq, index) => tone(freq, 0.1, "triangle", 0.11, sfxGain, now + index * 0.07));
      } else if (name === "start") {
        [330, 440, 660].forEach((freq, index) => tone(freq, 0.1, "square", 0.1, sfxGain, now + index * 0.12));
      } else if (name === "overdrive") {
        [220, 330, 440, 660, 880].forEach((freq, index) => tone(freq, 0.13, "sawtooth", 0.1, sfxGain, now + index * 0.035));
        noise(0.22, 0.055, 2400, sfxGain, now);
      } else if (name === "style") {
        [988, 1174, 1568].forEach((freq, index) => tone(freq, 0.06, "triangle", 0.055, sfxGain, now + index * 0.035));
      } else if (name === "storm") {
        noise(0.42, 0.12, 110, sfxGain, now);
        tone(55, 0.34, "sawtooth", 0.09, sfxGain, now);
      } else if (name === "puddle") {
        noise(0.11, 0.07, 520, sfxGain, now);
      }
    }

    function updateEngine(speedRatio, activeMode, boosting) {
      if (!context || !engineOsc || !engineGain) return;
      const targetGain = activeMode === "racing" ? 0.025 + speedRatio * 0.045 + (boosting ? 0.035 : 0) : 0.004;
      engineGain.gain.setTargetAtTime(muted ? 0 : targetGain, context.currentTime, 0.08);
      engineOsc.frequency.setTargetAtTime(62 + speedRatio * 115 + (boosting ? 45 : 0), context.currentTime, 0.04);
    }

    function toggleMute() {
      muted = !muted;
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.68, context.currentTime, 0.04);
      if (bgm) {
        bgm.muted = muted;
        if (!muted && usingExternalMusic && bgm.paused) bgm.play().catch(() => startMusicLoop());
      }
      return muted;
    }

    return { init, play, updateEngine, toggleMute };
  }

  function createPlayer() {
    return {
      x: 0,
      z: 0,
      totalDistance: 0,
      speed: 0,
      lap: 1,
      item: null,
      coins: 0,
      styleScore: 0,
      combo: 0,
      comboTimer: 0,
      bestCombo: 0,
      overdrive: 0,
      overdriveTimer: 0,
      boostTimer: 0,
      shieldTimer: 0,
      magnetTimer: 0,
      driftCharge: 0,
      drifting: false,
      jumpTimer: 0,
      jumpDuration: 0,
      slipstreamTimer: 0,
      slipstreamAwarded: false,
      lastLap: 1,
      hitCooldown: 0
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeIn(a, b, t) {
    return a + (b - a) * Math.pow(t, 2);
  }

  function easeOut(a, b, t) {
    return a + (b - a) * (1 - Math.pow(1 - t, 2));
  }

  function easeInOut(a, b, t) {
    return a + (b - a) * ((-Math.cos(t * Math.PI) / 2) + 0.5);
  }

  function distanceFogOpacity(distance) {
    const start = DRAW_DISTANCE * SEGMENT_LENGTH * 0.62;
    const end = DRAW_DISTANCE * SEGMENT_LENGTH;
    const t = clamp((distance - start) / (end - start), 0, 1);
    return 1 - easeInOut(0, 0.55, t);
  }

  function projectedSpriteSize(screen, base, nearMin, max, farMin = 2) {
    const depth = Math.pow(screen.depthRatio ?? 1, 0.55);
    const horizon = Math.pow(screen.perspectiveRatio ?? 1, 0.18);
    const minSize = lerp(farMin, nearMin, depth);
    return clamp(screen.scale * width * base * horizon, minSize, max);
  }

  function percentRemaining(n, total) {
    return (n % total) / total;
  }

  function mod(n, total) {
    return ((n % total) + total) % total;
  }

  function findSegment(z) {
    return segments[Math.floor(mod(z, trackLength) / SEGMENT_LENGTH) % segments.length];
  }

  function trackDelta(a, b) {
    let delta = mod(a, trackLength) - mod(b, trackLength);
    if (delta > trackLength / 2) delta -= trackLength;
    if (delta < -trackLength / 2) delta += trackLength;
    return delta;
  }

  function forwardDistance(a, b) {
    return mod(a - b, trackLength);
  }

  function addSegment(curve, y) {
    const n = segments.length;
    const lastY = n === 0 ? 0 : segments[n - 1].p2.world.y;
    const color = Math.floor(n / RUMBLE_LENGTH) % 2 ? COLORS.dark : COLORS.light;

    segments.push({
      index: n,
      curve,
      boost: false,
      ramp: false,
      color,
      clip: height,
      p1: {
        world: { x: 0, y: lastY, z: n * SEGMENT_LENGTH },
        camera: {},
        screen: {}
      },
      p2: {
        world: { x: 0, y, z: (n + 1) * SEGMENT_LENGTH },
        camera: {},
        screen: {}
      }
    });
  }

  function addRoad(enter, hold, leave, curve, hill) {
    const startY = segments.length === 0 ? 0 : segments[segments.length - 1].p2.world.y;
    const endY = startY + hill;
    const total = enter + hold + leave;

    for (let n = 0; n < enter; n += 1) {
      addSegment(easeIn(0, curve, n / enter), easeInOut(startY, endY, n / total));
    }
    for (let n = 0; n < hold; n += 1) {
      addSegment(curve, easeInOut(startY, endY, (enter + n) / total));
    }
    for (let n = 0; n < leave; n += 1) {
      addSegment(easeOut(curve, 0, n / leave), easeInOut(startY, endY, (enter + hold + n) / total));
    }
  }

  function addStraight(length) {
    addRoad(length, 0, 0, 0, 0);
  }

  function buildTrack() {
    segments = [];
    addStraight(58);
    addRoad(30, 86, 30, 2.4, 760);
    addRoad(24, 64, 26, -1.6, -620);
    addStraight(26);
    addRoad(34, 102, 32, -3.05, 880);
    addRoad(24, 58, 24, 1.35, -980);
    addStraight(24);
    addRoad(30, 96, 34, 3.35, 420);
    addRoad(26, 72, 28, -2.7, -560);
    addRoad(20, 54, 22, 1.15, 680);
    addStraight(34);
    addRoad(32, 104, 34, -3.45, -860);
    addRoad(22, 68, 24, 2.25, 520);
    addStraight(46);
    addRoad(28, 84, 30, 2.95, -460);
    addRoad(24, 70, 24, -1.9, 500);
    addRoad(28, 86, 32, -2.8, -280);
    addStraight(70);

    for (let i = 0; i < segments.length; i += 1) {
      if (i < 16) segments[i].color = i % 2 ? COLORS.start : COLORS.finish;
      if ((i > 92 && i < 106) || (i > 438 && i < 452) || (i > 782 && i < 798) || (i > 1276 && i < 1292) || (i > 1610 && i < 1624)) {
        segments[i].boost = true;
      }
      if ((i > 246 && i < 254) || (i > 590 && i < 600) || (i > 1018 && i < 1028) || (i > 1450 && i < 1460)) {
        segments[i].ramp = true;
      }
    }

    trackLength = segments.length * SEGMENT_LENGTH;
    buildItems();
    buildCoins();
    buildPuddles();
    buildTrackProps();
    buildMapPoints();
  }

  function buildItems() {
    itemBoxes = [];
    const boxSegments = [88, 178, 310, 474, 590, 760, 894, 1028, 1160, 1320, 1504, 1690];
    const lanes = [-0.48, 0, 0.48];
    for (const segmentIndex of boxSegments) {
      for (const lane of lanes) {
        itemBoxes.push({
          z: mod(segmentIndex * SEGMENT_LENGTH + 45, trackLength),
          x: lane,
          cooldown: 0,
          spin: Math.random() * Math.PI * 2
        });
      }
    }
  }

  function buildCoins() {
    coins = [];
    const lanes = [-0.42, 0, 0.42];
    for (let i = 52; i < segments.length - 20; i += 17) {
      const lane = lanes[Math.floor(i / 17) % lanes.length];
      const wave = Math.sin(i * 0.19) * 0.14;
      coins.push({
        z: mod(i * SEGMENT_LENGTH + 82, trackLength),
        x: clamp(lane + wave, -0.74, 0.74),
        taken: false,
        spin: Math.random() * Math.PI * 2
      });
    }
  }

  function buildPuddles() {
    puddles = [];
    const lanes = [-0.52, -0.18, 0.18, 0.52];
    for (let i = 126; i < segments.length - 40; i += 31) {
      puddles.push({
        z: mod(i * SEGMENT_LENGTH + 120, trackLength),
        x: lanes[Math.floor(i / 31) % lanes.length] + Math.sin(i * 0.4) * 0.08,
        width: 0.18 + ((i % 3) * 0.035),
        spin: Math.random() * Math.PI * 2
      });
    }
  }

  function buildTrackProps() {
    trackProps = [];
    const beachDecor = ["palm", "umbrella", "buoy", "palm", "flowerBed", "pennants", "palmAlt", "umbrella"];
    const inlandDecor = ["lamp", "tires", "crowd", "chevron", "billboard", "lamp", "flowerBed", "speedBoard"];
    let decorSlot = 0;
    for (let i = 24; i < segments.length; i += 16) {
      const side = decorSlot % 2 ? 1 : -1;
      const source = side < 0 ? beachDecor : inlandDecor;
      const type = source[decorSlot % source.length];
      const edge = type === "buoy" ? 1.86 : 1.28 + ((i * 7) % 5) * 0.055;
      trackProps.push({ z: i * SEGMENT_LENGTH, x: side * edge, type, phase: i * 0.31 });
      decorSlot += 1;
    }

    [132, 286, 438, 612, 846, 1056, 1218, 1410, 1628, 1784].forEach((index, slot) => {
      const type = slot % 3 === 0 ? "chevron" : "billboard";
      trackProps.push({ z: mod(index * SEGMENT_LENGTH, trackLength), x: slot % 2 ? -1.46 : 1.46, type, phase: slot });
    });

    [104, 382, 712, 992, 1328, 1660].forEach((index, slot) => {
      trackProps.push({ z: mod(index * SEGMENT_LENGTH, trackLength), x: 0, type: "gate", phase: slot });
      trackProps.push({ z: mod(index * SEGMENT_LENGTH + SEGMENT_LENGTH * 1.7, trackLength), x: -1.22, type: "flag", phase: slot });
      trackProps.push({ z: mod(index * SEGMENT_LENGTH + SEGMENT_LENGTH * 1.7, trackLength), x: 1.22, type: "flag", phase: slot + 1 });
    });
  }

  function buildMapPoints() {
    let angle = 0;
    let x = 0;
    let y = 0;
    const raw = [];
    for (let i = 0; i < segments.length; i += 1) {
      angle += segments[i].curve * 0.0032;
      x += Math.sin(angle) * 5.4;
      y += Math.cos(angle) * 5.4;
      raw.push({ x, y });
    }

    const minX = Math.min(...raw.map((p) => p.x));
    const maxX = Math.max(...raw.map((p) => p.x));
    const minY = Math.min(...raw.map((p) => p.y));
    const maxY = Math.max(...raw.map((p) => p.y));
    const pad = 22;
    const scale = Math.min(
      (minimap.width - pad * 2) / Math.max(1, maxX - minX),
      (minimap.height - pad * 2) / Math.max(1, maxY - minY)
    );

    mapPoints = raw.map((p) => ({
      x: (p.x - minX) * scale + pad,
      y: (p.y - minY) * scale + pad
    }));
  }

  function resizeCanvas() {
    const ratio = Math.max(0.72, Math.min(window.devicePixelRatio || 1, 1.15) * RENDER_SCALE);
    const rect = canvas.getBoundingClientRect();
    width = Math.max(320, Math.floor(rect.width * ratio));
    height = Math.max(480, Math.floor(rect.height * ratio));
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = true;
  }

  function resetRace() {
    state.player = createPlayer();
    state.racers = OPPONENTS.map((opponent, index) => {
      const distance = -520 - index * 360;
      return {
        ...opponent,
        x: opponent.lane,
        targetX: opponent.lane,
        z: mod(distance, trackLength),
        totalDistance: distance,
        spinTimer: 0,
        finished: false,
        phase: Math.random() * Math.PI * 2
      };
    });
    state.hazards = [];
    state.particles = [];
    state.sparks = [];
    state.popups = [];
    state.rainTime = 0;
    state.lightningTimer = 0;
    state.stormAnnounced = false;
    state.raceTime = 0;
    state.finishedAt = 0;
    state.position = 1;
    screenShake = 0;
    flashTimer = 0;
    itemBoxes.forEach((box) => {
      box.cooldown = 0;
    });
    coins.forEach((coin) => {
      coin.taken = false;
    });
    updateHud();
  }

  function setMode(mode) {
    state.mode = mode;
    Object.values(ui.screens).forEach((screen) => screen.classList.remove("active"));
    if (ui.screens[mode]) ui.screens[mode].classList.add("active");
  }

  function startRace() {
    audio.init();
    audio.play("start");
    resetRace();
    state.countdown = 3.15;
    ui.countdown.textContent = "3";
    setMode("countdown");
    showToast("Bereit");
  }

  function finishRace() {
    audio.play("lap");
    state.finishedAt = state.raceTime;
    const placeText = `${state.position}. Platz`;
    ui.finishTitle.textContent = state.position === 1 ? "Sieg!" : "Rennen beendet";
    ui.finishStats.textContent = `${placeText} | Zeit ${formatTime(state.finishedAt)} | Kart ${KARTS[state.selectedKart].name} | Coins ${state.player.coins} | Style ${state.player.styleScore} | Best x${state.player.bestCombo}`;
    setMode("finish");
  }

  function pauseRace() {
    if (state.mode === "racing") setMode("pause");
  }

  function resumeRace() {
    if (state.mode === "pause") setMode("racing");
  }

  function selectKart(type) {
    if (!KARTS[type]) return;
    state.selectedKart = type;
    document.querySelectorAll(".kart-option").forEach((button) => {
      button.classList.toggle("active", button.dataset.kart === type);
    });
  }

  function showToast(text) {
    ui.toast.textContent = text;
    ui.toast.classList.add("visible");
    toastTimer = 1.4;
  }

  function randomItem() {
    const roll = Math.random();
    if (roll < 0.34) return "turbo";
    if (roll < 0.56) return "pulse";
    if (roll < 0.74) return "oil";
    if (roll < 0.88) return "shield";
    return "magnet";
  }

  function useItem() {
    audio.init();
    const player = state.player;
    if (!player.item || state.mode !== "racing") return;

    if (player.item === "turbo") {
      player.boostTimer = Math.max(player.boostTimer, 2.35);
      screenShake = Math.max(screenShake, 0.28);
      flashTimer = Math.max(flashTimer, 0.22);
      audio.play("boost");
      addStyle(120, "Turbo");
      showToast("Turbo gezuendet");
    } else if (player.item === "pulse") {
      let hits = 0;
      state.racers.forEach((racer) => {
        const delta = Math.abs(trackDelta(racer.z, player.z));
        if (delta < 4600) {
          racer.spinTimer = Math.max(racer.spinTimer, 1.25);
          racer.speed *= 0.68;
          hits += 1;
        }
      });
      screenShake = Math.max(screenShake, 0.22);
      flashTimer = Math.max(flashTimer, 0.16);
      audio.play("hit");
      if (hits > 0) addStyle(140 + hits * 60, "Pulse");
      showToast(hits > 0 ? `Pulse trifft ${hits}` : "Pulse verpufft");
    } else if (player.item === "oil") {
      state.hazards.push({
        z: mod(player.z - 640, trackLength),
        x: player.x,
        life: 18
      });
      audio.play("item");
      showToast("Oelspur gelegt");
    } else if (player.item === "shield") {
      player.shieldTimer = Math.max(player.shieldTimer, 8);
      audio.play("item");
      showToast("Shield aktiv");
    } else if (player.item === "magnet") {
      player.magnetTimer = Math.max(player.magnetTimer, 8);
      audio.play("item");
      showToast("Coin-Magnet aktiv");
    }

    player.item = null;
    updateHud();
  }

  function update(dt) {
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) ui.toast.classList.remove("visible");
    }
    if (screenShake > 0) screenShake -= dt;
    if (flashTimer > 0) flashTimer -= dt;
    coins.forEach((coin) => {
      coin.spin += dt * 5.2;
    });
    puddles.forEach((puddle) => {
      puddle.spin += dt * 1.8;
    });
    audio.updateEngine(
      clamp((state.player.speed || 0) / KARTS[state.selectedKart].maxSpeed, 0, 1.5),
      state.mode,
      state.player.boostTimer > 0 || state.player.overdriveTimer > 0
    );

    if (state.mode === "menu") {
      state.demoZ = mod(state.demoZ + 3000 * dt, trackLength);
      state.demoX = Math.sin(performance.now() * 0.0008) * 0.42;
      updateParticles(dt);
      updateSparks(dt);
      updatePopups(dt);
      return;
    }

    if (state.mode === "countdown") {
      state.countdown -= dt;
      if (state.countdown > 0.8) {
        ui.countdown.textContent = String(Math.ceil(state.countdown));
      } else if (state.countdown > 0) {
        ui.countdown.textContent = "GO";
      } else {
        setMode("racing");
        audio.play("start");
        showToast("Los!");
      }
      updateParticles(dt);
      updateSparks(dt);
      updatePopups(dt);
      return;
    }

    if (state.mode !== "racing") {
      updateParticles(dt);
      updateSparks(dt);
      updatePopups(dt);
      return;
    }

    state.raceTime += dt;
    updateWorldEvents(dt);
    updatePlayer(dt);
    updateRacers(dt);
    updateHazards(dt);
    updateParticles(dt);
    updateSparks(dt);
    updatePopups(dt);
    updateRacePosition();
    updateHud();

    if (state.player.totalDistance >= TOTAL_LAPS * trackLength) {
      finishRace();
    }
  }

  function isStormActive() {
    return state.mode === "racing" && state.player.lap >= 2;
  }

  function updateWorldEvents(dt) {
    const player = state.player;
    if (player.comboTimer > 0) {
      player.comboTimer -= dt;
      if (player.comboTimer <= 0) player.combo = 0;
    }

    if (isStormActive()) {
      state.rainTime += dt;
      if (!state.stormAnnounced) {
        state.stormAnnounced = true;
        state.lightningTimer = 0.5;
        screenShake = Math.max(screenShake, 0.28);
        audio.play("storm");
        showToast("Neon storm");
      }

      if (state.lightningTimer > 0) {
        state.lightningTimer -= dt;
      } else if (Math.random() < dt * 0.13) {
        state.lightningTimer = 0.22 + Math.random() * 0.16;
        screenShake = Math.max(screenShake, 0.18);
        audio.play("storm");
      }

      if (Math.random() < dt * 6) spawnRainSplash();
    } else {
      state.lightningTimer = Math.max(0, state.lightningTimer - dt);
    }
  }

  function addStyle(points, label) {
    const player = state.player;
    const multiplier = 1 + Math.min(3, player.combo * 0.16);
    const gain = Math.round(points * multiplier);
    player.styleScore += gain;
    player.combo += 1;
    player.bestCombo = Math.max(player.bestCombo, player.combo);
    player.comboTimer = 4.2;
    player.overdrive = clamp(player.overdrive + points * 0.0008, 0, 1);
    state.popups.push({
      text: `${label} +${gain}`,
      x: width * (0.5 + (Math.random() - 0.5) * 0.16),
      y: height * 0.42,
      vy: -36 - Math.random() * 24,
      life: 1.05,
      color: player.combo >= 6 ? "#ffd24a" : "#37dcc6"
    });
    if (player.combo % 5 === 0) audio.play("style");
  }

  function breakCombo(label) {
    const player = state.player;
    if (player.combo > 2 && label) showToast(label);
    player.combo = 0;
    player.comboTimer = 0;
  }

  function updatePopups(dt) {
    state.popups.forEach((popup) => {
      popup.life -= dt;
      popup.y += popup.vy * dt;
      popup.vy += 18 * dt;
    });
    state.popups = state.popups.filter((popup) => popup.life > 0);
  }

  function updatePlayer(dt) {
    const player = state.player;
    const stats = KARTS[state.selectedKart];
    const segment = findSegment(player.z);
    const speedRatio = clamp(player.speed / stats.maxSpeed, 0, 1.4);
    const steering = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const onRoad = Math.abs(player.x) <= 1;

    if (input.overdrive && player.overdrive >= 1 && player.overdriveTimer <= 0) {
      activateOverdrive();
    }

    if (input.gas) player.speed += stats.accel * dt;
    else player.speed -= 2350 * dt;
    if (input.brake) player.speed -= 7200 * dt;

    if (player.shieldTimer > 0) player.shieldTimer -= dt;
    if (player.magnetTimer > 0) player.magnetTimer -= dt;
    if (player.jumpTimer > 0) player.jumpTimer -= dt;

    if (player.boostTimer > 0) {
      player.boostTimer -= dt;
      player.speed += 5200 * dt;
      spawnBoostParticles();
    }

    if (player.overdriveTimer > 0) {
      player.overdriveTimer -= dt;
      player.speed += 7600 * dt;
      player.overdrive = Math.max(0, player.overdrive - dt * 0.34);
      spawnOverdriveParticles();
    }

    const maxSpeed = stats.maxSpeed * (player.boostTimer > 0 ? 1.35 : 1) * (player.overdriveTimer > 0 ? 1.22 : 1);
    player.speed = clamp(player.speed, 0, maxSpeed);

    if (!onRoad) {
      player.speed = Math.min(player.speed, stats.maxSpeed * 0.62);
      player.speed -= 1700 * dt;
      if (Math.abs(player.x) > 1.24) player.x -= Math.sign(player.x) * 0.55 * dt;
      if (player.speed > 3800) breakCombo("Combo lost");
    }

    if (steering !== 0 && player.speed > 500) {
      const driftActive = input.drift && speedRatio > 0.35;
      const steerPower = (1.18 + speedRatio * 1.42) * stats.grip * (driftActive ? stats.driftSteer : 1);
      player.x += steering * steerPower * dt;

      if (driftActive) {
        player.drifting = true;
        player.driftCharge = clamp(player.driftCharge + dt * (0.7 + speedRatio), 0, 2.4);
        player.overdrive = clamp(player.overdrive + dt * 0.035, 0, 1);
        spawnDriftParticles(steering);
      } else if (player.drifting) {
        releaseDriftBoost();
      }
    } else if (player.drifting) {
      releaseDriftBoost();
    }

    player.x -= segment.curve * speedRatio * dt * 0.19;
    player.x = clamp(player.x, -1.45, 1.45);

    if (segment.boost && Math.abs(player.x) < 0.78 && player.boostTimer < 0.55) {
      player.boostTimer = 1.18;
      screenShake = Math.max(screenShake, 0.12);
      flashTimer = Math.max(flashTimer, 0.14);
      audio.play("boost");
      showToast("Boost-Pad");
    }

    if (segment.ramp && Math.abs(player.x) < 0.82 && player.speed > 5200 && player.jumpTimer <= 0) {
      player.jumpTimer = 0.72;
      player.jumpDuration = 0.72;
      player.speed += 850;
      player.overdrive = clamp(player.overdrive + 0.12, 0, 1);
      screenShake = Math.max(screenShake, 0.1);
      audio.play("boost");
      addStyle(180, "Jump");
      showToast("Jump trick");
    }

    updateSlipstream(dt);

    if (player.hitCooldown > 0) player.hitCooldown -= dt;
    player.totalDistance += player.speed * dt;
    player.z = mod(player.totalDistance, trackLength);
    player.lap = clamp(Math.floor(player.totalDistance / trackLength) + 1, 1, TOTAL_LAPS);
    if (player.lap > player.lastLap && player.lap <= TOTAL_LAPS) {
      player.lastLap = player.lap;
      player.overdrive = clamp(player.overdrive + 0.2, 0, 1);
      audio.play("lap");
      addStyle(320, "Clean lap");
      showToast(`Runde ${player.lap}`);
    }

    handlePlayerPickups();
    handlePlayerCollisions();
    handlePuddles();
  }

  function releaseDriftBoost() {
    const player = state.player;
    if (player.driftCharge > 1.75) {
      player.boostTimer = Math.max(player.boostTimer, 1.45);
      player.overdrive = clamp(player.overdrive + 0.12, 0, 1);
      audio.play("boost");
      addStyle(220, "Mini turbo");
      showToast("Mini-Turbo");
    } else if (player.driftCharge > 0.95) {
      player.boostTimer = Math.max(player.boostTimer, 0.78);
      player.overdrive = clamp(player.overdrive + 0.06, 0, 1);
      audio.play("boost");
      addStyle(110, "Drift");
      showToast("Drift-Boost");
    }
    player.driftCharge = 0;
    player.drifting = false;
  }

  function activateOverdrive() {
    const player = state.player;
    player.overdrive = 1;
    player.overdriveTimer = 3.25;
    screenShake = Math.max(screenShake, 0.36);
    flashTimer = Math.max(flashTimer, 0.32);
    audio.play("overdrive");
    addStyle(260, "Overdrive");
    showToast("Overdrive");
  }

  function updateSlipstream(dt) {
    const player = state.player;
    let drafting = false;
    for (const racer of state.racers) {
      const ahead = forwardDistance(racer.z, player.z);
      if (ahead > 240 && ahead < 1850 && Math.abs(racer.x - player.x) < 0.22 && player.speed > 4800) {
        drafting = true;
        break;
      }
    }

    if (drafting) {
      player.slipstreamTimer = clamp(player.slipstreamTimer + dt, 0, 1.8);
      player.overdrive = clamp(player.overdrive + dt * 0.028, 0, 1);
      if (player.slipstreamTimer > 1.25) {
        player.speed += 950 * dt;
        if (!player.slipstreamAwarded) {
          player.slipstreamAwarded = true;
          addStyle(160, "Draft");
        }
        if (Math.random() < 0.4) spawnSlipstreamSpark();
      }
    } else {
      player.slipstreamTimer = Math.max(0, player.slipstreamTimer - dt * 1.6);
      player.slipstreamAwarded = false;
    }
  }

  function handlePlayerPickups() {
    const player = state.player;
    for (const coin of coins) {
      if (coin.taken) continue;
      const delta = Math.abs(trackDelta(coin.z, player.z));
      const laneGap = Math.abs(player.x - coin.x);
      if (player.magnetTimer > 0 && delta < 760 && laneGap < 1.2) {
        coin.x = lerp(coin.x, player.x, 0.08);
        if (delta < 260) collectCoin(coin);
      } else if (delta < 120 && laneGap < 0.19) {
        collectCoin(coin);
      }
    }

    for (const box of itemBoxes) {
      if (box.cooldown > 0) continue;
      const distance = forwardDistance(box.z, player.z);
      if (distance < 155 && Math.abs(player.x - box.x) < 0.22) {
        box.cooldown = 8;
        if (!player.item) {
          player.item = randomItem();
          audio.play("item");
          showToast(`${ITEM_NAMES[player.item]} erhalten`);
        } else {
          showToast("Item-Box");
        }
      }
    }
  }

  function collectCoin(coin) {
    const player = state.player;
    coin.taken = true;
    player.coins += 1;
    player.overdrive = clamp(player.overdrive + 0.055, 0, 1);
    player.speed += 75;
    addStyle(player.coins % 5 === 0 ? 95 : 35, player.coins % 5 === 0 ? "Coin chain" : "Coin");
    audio.play("coin");
    for (let i = 0; i < 8; i += 1) {
      state.sparks.push({
        x: width * 0.5 + (Math.random() - 0.5) * 80,
        y: height * 0.66 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 220,
        vy: -120 - Math.random() * 180,
        life: 0.45,
        color: "#ffd24a",
        size: 2 + Math.random() * 3
      });
    }
  }

  function handlePlayerCollisions() {
    const player = state.player;
    if (player.hitCooldown > 0) return;

    for (const racer of state.racers) {
      const delta = trackDelta(racer.z, player.z);
      if (Math.abs(delta) < 135 && Math.abs(racer.x - player.x) < 0.2) {
        if (player.shieldTimer > 0) {
          racer.spinTimer = Math.max(racer.spinTimer, 1.1);
          racer.speed *= 0.72;
      screenShake = Math.max(screenShake, 0.18);
      audio.play("hit");
      addStyle(170, "Shield bump");
      showToast("Shield bump");
          return;
        }
        player.speed *= 0.84;
        racer.speed *= 0.96;
        player.x = clamp(player.x - Math.sign(racer.x - player.x || 0.1) * 0.1, -1.45, 1.45);
        player.hitCooldown = 0.35;
        screenShake = Math.max(screenShake, 0.18);
        audio.play("hit");
        breakCombo("Combo lost");
        showToast("Rempler");
        return;
      }
    }

    for (const hazard of state.hazards) {
      const delta = Math.abs(trackDelta(hazard.z, player.z));
      if (delta < 110 && Math.abs(hazard.x - player.x) < 0.18) {
        if (player.shieldTimer > 0) {
          hazard.life = 0;
          audio.play("item");
          addStyle(120, "Shield block");
          showToast("Shield block");
          return;
        }
        player.speed *= 0.55;
        player.hitCooldown = 0.6;
        screenShake = Math.max(screenShake, 0.24);
        audio.play("hit");
        breakCombo("Combo lost");
        showToast("Ausgerutscht");
        return;
      }
    }
  }

  function handlePuddles() {
    if (!isStormActive()) return;
    const player = state.player;
    if (player.hitCooldown > 0 || player.jumpTimer > 0) return;

    for (const puddle of puddles) {
      const delta = Math.abs(trackDelta(puddle.z, player.z));
      if (delta < 120 && Math.abs(puddle.x - player.x) < puddle.width) {
        if (player.shieldTimer > 0) {
          addStyle(80, "Dry line");
          audio.play("item");
          return;
        }
        player.speed *= 0.82;
        player.x = clamp(player.x + Math.sin(puddle.spin + state.raceTime * 6) * 0.08, -1.45, 1.45);
        player.hitCooldown = 0.28;
        screenShake = Math.max(screenShake, 0.1);
        audio.play("puddle");
        breakCombo("Wet line");
        showToast("Wet line");
        return;
      }
    }
  }

  function updateRacers(dt) {
    const player = state.player;
    state.racers.forEach((racer, index) => {
      const segment = findSegment(racer.z);
      const raceGap = player.totalDistance - racer.totalDistance;
      const rubberBand = clamp(raceGap * 0.018, -520, 720);
      const targetSpeed = racer.speed + rubberBand;
      const wobble = Math.sin(state.raceTime * 1.2 + racer.phase) * 0.05;
      racer.targetX = clamp(racer.lane - segment.curve * 0.055 + wobble, -0.82, 0.82);
      racer.x += (racer.targetX - racer.x) * dt * 1.4;

      if (racer.spinTimer > 0) {
        racer.spinTimer -= dt;
        racer.speed -= 3000 * dt;
        racer.x += Math.sin(racer.spinTimer * 28 + index) * dt * 0.5;
      } else {
        racer.speed += (targetSpeed - racer.speed) * dt * 0.38;
      }

      for (const hazard of state.hazards) {
        if (Math.abs(trackDelta(hazard.z, racer.z)) < 125 && Math.abs(hazard.x - racer.x) < 0.18) {
          racer.spinTimer = Math.max(racer.spinTimer, 0.95);
          racer.speed *= 0.66;
        }
      }

      if (isStormActive()) {
        for (const puddle of puddles) {
          if (Math.abs(trackDelta(puddle.z, racer.z)) < 120 && Math.abs(puddle.x - racer.x) < puddle.width) {
            racer.spinTimer = Math.max(racer.spinTimer, 0.55);
            racer.speed *= 0.9;
          }
        }
      }

      racer.speed = clamp(racer.speed, 3600, 9750);
      racer.totalDistance += racer.speed * dt;
      racer.z = mod(racer.totalDistance, trackLength);
      if (racer.totalDistance >= TOTAL_LAPS * trackLength) racer.finished = true;
    });

    itemBoxes.forEach((box) => {
      box.spin += dt * 3;
      if (box.cooldown > 0) box.cooldown -= dt;
    });
  }

  function updateHazards(dt) {
    state.hazards.forEach((hazard) => {
      hazard.life -= dt;
    });
    state.hazards = state.hazards.filter((hazard) => hazard.life > 0);
  }

  function updateParticles(dt) {
    state.particles.forEach((particle) => {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 280 * dt;
    });
    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  function updateSparks(dt) {
    state.sparks.forEach((spark) => {
      spark.life -= dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vy += 420 * dt;
      spark.vx *= 1 - dt * 1.8;
    });
    state.sparks = state.sparks.filter((spark) => spark.life > 0);
  }

  function spawnDriftParticles(direction) {
    const baseX = width * 0.5 + direction * width * 0.07;
    const baseY = height * 0.82;
    for (let i = 0; i < 2; i += 1) {
      state.particles.push({
        x: baseX + (Math.random() - 0.5) * 20,
        y: baseY + Math.random() * 22,
        vx: -direction * (160 + Math.random() * 130),
        vy: -80 - Math.random() * 70,
        life: 0.35 + Math.random() * 0.2,
        color: Math.random() > 0.45 ? "#37dcc6" : "#ffd24a",
        size: 3 + Math.random() * 3
      });
    }
  }

  function spawnBoostParticles() {
    const baseY = height * 0.86;
    for (let i = 0; i < 2; i += 1) {
      state.particles.push({
        x: width * (0.44 + Math.random() * 0.12),
        y: baseY + Math.random() * 26,
        vx: (Math.random() - 0.5) * 60,
        vy: 260 + Math.random() * 180,
        life: 0.18 + Math.random() * 0.16,
        color: Math.random() > 0.5 ? "#ffd24a" : "#ff6f5f",
        size: 3 + Math.random() * 4
      });
    }
  }

  function spawnOverdriveParticles() {
    const baseY = height * 0.86;
    for (let i = 0; i < 4; i += 1) {
      state.particles.push({
        x: width * (0.38 + Math.random() * 0.24),
        y: baseY + Math.random() * 36,
        vx: (Math.random() - 0.5) * 160,
        vy: 360 + Math.random() * 260,
        life: 0.16 + Math.random() * 0.12,
        color: Math.random() > 0.5 ? "#37dcc6" : "#ffd24a",
        size: 3 + Math.random() * 5
      });
    }
  }

  function spawnSlipstreamSpark() {
    state.sparks.push({
      x: width * (0.5 + (Math.random() - 0.5) * 0.34),
      y: height * (0.56 + Math.random() * 0.18),
      vx: (Math.random() - 0.5) * 80,
      vy: 120 + Math.random() * 140,
      life: 0.25,
      color: "rgba(245, 247, 235, 0.9)",
      size: 2 + Math.random() * 3
    });
  }

  function spawnRainSplash() {
    state.sparks.push({
      x: Math.random() * width,
      y: height * (0.48 + Math.random() * 0.44),
      vx: -120 - Math.random() * 80,
      vy: 90 + Math.random() * 90,
      life: 0.18 + Math.random() * 0.14,
      color: "rgba(170, 230, 255, 0.75)",
      size: 1 + Math.random() * 2.5
    });
  }

  function updateRacePosition() {
    const playerDistance = Math.min(state.player.totalDistance, TOTAL_LAPS * trackLength);
    const field = [
      { player: true, distance: playerDistance },
      ...state.racers.map((racer) => ({
        player: false,
        distance: Math.min(racer.totalDistance, TOTAL_LAPS * trackLength)
      }))
    ].sort((a, b) => b.distance - a.distance);
    state.position = field.findIndex((entry) => entry.player) + 1;
  }

  function updateHud() {
    const player = state.player;
    ui.speed.textContent = String(Math.round(player.speed * 0.032));
    ui.lap.textContent = `${Math.min(player.lap, TOTAL_LAPS)}/${TOTAL_LAPS}`;
    ui.position.textContent = `${state.position}/8`;
    ui.item.textContent = player.item ? ITEM_NAMES[player.item] : "-";
    ui.time.textContent = formatTime(state.mode === "finish" ? state.finishedAt : state.raceTime);
    ui.coins.textContent = String(player.coins);
    ui.overdrive.textContent = `${Math.round(player.overdrive * 100)}%`;
    ui.style.textContent = player.combo > 1 ? `${player.styleScore} x${player.combo}` : String(player.styleScore);
  }

  function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    const tenths = Math.floor((time % 1) * 10);
    return `${minutes}:${seconds}.${tenths}`;
  }

  function project(point, cameraX, cameraY, cameraZ) {
    point.camera.x = point.world.x - cameraX;
    point.camera.y = point.world.y - cameraY;
    point.camera.z = point.world.z - cameraZ;
    point.screen.scale = CAMERA_DEPTH / point.camera.z;
    point.screen.x = Math.round((width / 2) + (point.screen.scale * point.camera.x * width / 2));
    point.screen.y = Math.round((height / 2) - (point.screen.scale * point.camera.y * height / 2));
    point.screen.w = Math.round(point.screen.scale * ROAD_WIDTH * width / 2);
  }

  function render() {
    const renderPlayer = getRenderPlayer();
    ctx.save();
    if (screenShake > 0) {
      const amount = Math.min(18, screenShake * 44);
      ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
    }
    drawBackground(renderPlayer);
    drawRoad(renderPlayer);
    drawDistanceHaze(renderPlayer);
    drawVisibleObjects(renderPlayer);
    drawPlayerKart(renderPlayer);
    drawParticles();
    drawSparks();
    drawFlash();
    drawWeather();
    drawPopups();
    ctx.restore();
    drawVignette();
    drawMinimap(renderPlayer);
  }

  function getRenderPlayer() {
    if (state.mode === "menu") {
      return {
        ...state.player,
        x: state.demoX,
        z: state.demoZ,
        speed: 5200,
        boostTimer: 0,
        drifting: false
      };
    }
    return state.player;
  }

  function drawBackground(player) {
    const storm = isStormActive();
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.72);
    sky.addColorStop(0, storm ? "#07111f" : COLORS.skyTop);
    sky.addColorStop(0.58, storm ? "#263a52" : "#477f9d");
    sky.addColorStop(1, storm ? "#47636d" : COLORS.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const offset = (findSegment(player.z).curve * 18 + player.x * -28);
    const horizon = height * 0.42;

    const sunX = width * 0.72 + Math.sin(player.z * 0.00008) * width * 0.04;
    const sunY = horizon * 0.48;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, height * 0.25);
    sunGlow.addColorStop(0, storm ? "rgba(55, 220, 198, 0.72)" : "rgba(255, 210, 74, 0.92)");
    sunGlow.addColorStop(0.34, storm ? "rgba(143, 123, 255, 0.2)" : "rgba(255, 111, 95, 0.34)");
    sunGlow.addColorStop(1, "rgba(255, 111, 95, 0)");
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, width, height * 0.58);
    drawArcadeSunStripes(sunX, sunY, horizon, storm);

    ctx.fillStyle = "rgba(245, 247, 235, 0.72)";
    for (let i = 0; i < 36; i += 1) {
      const x = mod(i * 141 + offset * 0.35, width + 80) - 40;
      const y = 22 + ((i * 47) % Math.max(80, horizon * 0.54));
      const r = 1 + ((i * 11) % 3);
      ctx.globalAlpha = 0.3 + ((i * 13) % 5) * 0.11;
      ctx.fillRect(x, y, r, r);
    }
    ctx.globalAlpha = 1;

    if (!drawTiledBackdrop(player, horizon, offset)) {
      drawGeneratedBackdrop(player, horizon, offset);
      ctx.fillStyle = "#24343f";
      drawMountain(offset - width * 0.3, horizon + 18, 0.9);
      ctx.fillStyle = "#31434a";
      drawMountain(offset + width * 0.2, horizon + 28, 1.08);
    }

    if (!fillTileBand("water", horizon + 6, height * 0.1, player.z * 0.008 + offset * 0.65, storm ? 0.2 : 0.3)) {
      ctx.fillStyle = "#1f7d86";
      ctx.fillRect(0, horizon + 6, width, height * 0.1);
    }
    if (!fillTileBand("darkGrass", horizon + 72, height - horizon - 72, offset * 0.4, storm ? 0.68 : 0.82)) {
      ctx.fillStyle = "#1e5032";
      ctx.fillRect(0, horizon + 72, width, height - horizon);
    }
    drawLeftCoastlineBackdrop(player, horizon, offset, storm);
    drawHorizonMist(horizon, storm);
  }

  function drawArcadeSunStripes(sunX, sunY, horizon, storm) {
    const radius = Math.min(width * 0.1, horizon * 0.26);
    ctx.save();
    ctx.globalAlpha = storm ? 0.22 : 0.68;
    ctx.beginPath();
    ctx.arc(sunX, sunY, radius, 0, Math.PI * 2);
    ctx.clip();
    for (let i = 0; i < 9; i += 1) {
      const y = sunY - radius + i * radius * 0.24;
      const h = Math.max(3, radius * (0.07 + i * 0.008));
      ctx.fillStyle = i % 2 ? "rgba(255, 111, 95, 0.92)" : "rgba(255, 210, 74, 0.94)";
      ctx.fillRect(sunX - radius, y, radius * 2, h);
    }
    ctx.restore();
  }

  function drawTiledBackdrop(player, horizon, offset) {
    const skyline = spriteStore.art.skylineLayer;
    const coast = spriteStore.art.coastLayer;
    const clouds = spriteStore.art.cloudLayer;
    const elements = spriteStore.art.horizonElementsLayer;
    if (!skyline || !coast) return false;

    const storm = isStormActive();
    const cloudHeight = Math.min(height * 0.2, 170);
    const coastHeight = Math.min(height * 0.34, 270);
    const skylineHeight = Math.min(height * 0.38, 310);
    const elementsHeight = Math.min(height * 0.28, 220);

    if (clouds) {
      drawRepeatingImage(
        clouds,
        Math.max(-cloudHeight * 0.18, horizon - skylineHeight * 1.18),
        cloudHeight,
        player.z * 0.0018 + offset * 0.12,
        storm ? 0.18 : 0.42
      );
    }

    drawRepeatingImage(
      coast,
      horizon - coastHeight * 0.4,
      coastHeight,
      player.z * 0.006 + offset * 0.32,
      storm ? 0.48 : 0.78
    );
    drawRepeatingImage(
      skyline,
      horizon - skylineHeight * 0.72,
      skylineHeight,
      player.z * 0.004 + offset * 0.62,
      storm ? 0.42 : 0.72
    );

    if (elements) {
      drawRepeatingImage(
        elements,
        horizon + Math.min(78, height * 0.09) - elementsHeight,
        elementsHeight,
        player.z * 0.014 + offset * 1.12,
        storm ? 0.46 : 0.86
      );
    }

    drawHorizonEffects(player, horizon, offset, storm);

    if (fillTileBand("sand", horizon + 54, 34, player.z * 0.012 + offset * 0.7, storm ? 0.32 : 0.48)) {
      ctx.fillStyle = storm ? "rgba(7, 12, 20, 0.26)" : "rgba(255, 214, 149, 0.08)";
      ctx.fillRect(0, horizon + 54, width, 34);
    }
    return true;
  }

  function drawHorizonEffects(player, horizon, offset, storm) {
    const time = performance.now() * 0.001;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < 7; i += 1) {
      const x = mod(i * 247 - player.z * 0.013 + offset * 1.05, width + 140) - 70;
      const y = horizon - 44 + ((i * 19) % 54);
      const pulse = 0.35 + Math.sin(time * 1.8 + i * 1.7) * 0.18;
      const color = i % 2 ? [55, 220, 198] : [255, 210, 74];
      const glow = ctx.createRadialGradient(x, y, 1, x, y, 22 + pulse * 26);
      glow.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${storm ? 0.22 : 0.36})`);
      glow.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(x - 60, y - 60, 120, 120);
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = storm ? "rgba(118, 225, 213, 0.12)" : "rgba(245, 247, 235, 0.14)";
    ctx.lineWidth = Math.max(1, width * 0.0011);
    for (let i = 0; i < 5; i += 1) {
      const y = horizon + 18 + i * 9 + Math.sin(time * 1.2 + i) * 2;
      const shift = mod(player.z * (0.018 + i * 0.004) + offset * 0.8 + i * 97, 156);
      for (let x = -shift; x < width + 120; x += 156) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 38, y + 4, x + 78, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawLeftCoastlineBackdrop(player, horizon, offset, storm) {
    const wave = Math.sin(player.z * 0.00022 + offset * 0.012) * width * 0.035;
    const shoreTop = width * 0.22 + wave;
    const shoreBottom = width * 0.34 + Math.sin(player.z * 0.00014) * width * 0.05;
    const seaTop = Math.max(0, shoreTop - width * 0.15);
    const seaBottom = Math.max(0, shoreBottom - width * 0.18);
    const yTop = horizon + height * 0.07;
    const yBottom = height;

    ctx.save();
    polygon(
      0,
      yTop,
      seaTop,
      yTop + height * 0.02,
      seaBottom,
      yBottom,
      0,
      yBottom,
      storm ? "rgba(22, 93, 113, 0.52)" : "rgba(26, 145, 166, 0.58)"
    );
    polygon(
      seaTop,
      yTop + height * 0.015,
      shoreTop + width * 0.06,
      yTop,
      shoreBottom + width * 0.09,
      yBottom,
      seaBottom,
      yBottom,
      storm ? "rgba(150, 128, 92, 0.46)" : "rgba(250, 198, 108, 0.62)"
    );

    ctx.globalAlpha = storm ? 0.22 : 0.52;
    ctx.strokeStyle = "rgba(255, 248, 205, 0.9)";
    ctx.lineWidth = Math.max(1, width * 0.0012);
    for (let i = 0; i < 7; i += 1) {
      const t = i / 6;
      const y = lerp(yTop + height * 0.03, height * 0.96, t);
      const x = lerp(seaTop, seaBottom, t) + Math.sin(player.z * 0.001 + i) * width * 0.012;
      ctx.beginPath();
      ctx.moveTo(Math.max(0, x - width * 0.08), y);
      ctx.quadraticCurveTo(x + width * 0.03, y + 5, x + width * 0.14, y - 2);
      ctx.stroke();
    }

    ctx.globalAlpha = storm ? 0.16 : 0.34;
    ctx.strokeStyle = "rgba(255, 210, 74, 0.92)";
    ctx.lineWidth = Math.max(2, width * 0.002);
    for (let i = 0; i < 4; i += 1) {
      const y = horizon + height * (0.12 + i * 0.052);
      const shift = mod(player.z * (0.028 + i * 0.005) + offset + i * 71, 180);
      ctx.beginPath();
      ctx.moveTo(-shift, y);
      for (let x = -shift; x < width * 0.5; x += 180) {
        ctx.lineTo(x + 84, y + Math.sin(i + x * 0.02) * 2);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHorizonMist(horizon, storm) {
    const mistTop = Math.max(0, horizon - height * 0.06);
    const mistBottom = horizon + height * 0.19;
    const softColor = storm ? "118, 200, 210" : "245, 235, 190";
    const warmColor = storm ? "55, 220, 198" : "255, 210, 74";

    ctx.save();
    const vertical = ctx.createLinearGradient(0, mistTop, 0, mistBottom);
    vertical.addColorStop(0, `rgba(${softColor}, 0)`);
    vertical.addColorStop(0.36, `rgba(${softColor}, ${storm ? 0.13 : 0.2})`);
    vertical.addColorStop(0.68, `rgba(${warmColor}, ${storm ? 0.08 : 0.14})`);
    vertical.addColorStop(1, `rgba(${softColor}, 0)`);
    ctx.fillStyle = vertical;
    ctx.fillRect(0, mistTop, width, mistBottom - mistTop);

    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(width * 0.62, horizon + height * 0.04, width * 0.04, width * 0.62, horizon + height * 0.04, width * 0.62);
    glow.addColorStop(0, `rgba(${warmColor}, ${storm ? 0.09 : 0.16})`);
    glow.addColorStop(0.58, `rgba(${softColor}, ${storm ? 0.06 : 0.1})`);
    glow.addColorStop(1, `rgba(${softColor}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, mistTop - height * 0.04, width, mistBottom - mistTop + height * 0.08);
    ctx.restore();
  }

  function drawRepeatingImage(image, y, layerHeight, travel, alpha) {
    if (!image || image.width <= 0 || image.height <= 0) return false;
    const drawHeight = Math.max(1, layerHeight);
    const drawWidth = Math.max(1, image.width * (drawHeight / image.height));
    const shift = mod(travel, drawWidth);

    ctx.save();
    ctx.globalAlpha = alpha;
    for (let x = -shift - drawWidth; x < width + drawWidth; x += drawWidth) {
      ctx.drawImage(image, x, y, drawWidth, drawHeight);
    }
    ctx.restore();
    return true;
  }

  function getTilePattern(name) {
    const rect = TILE_RECTS[name];
    const image = spriteStore.art.tileset;
    if (!rect || !image) return null;

    const key = `tile:${name}`;
    if (spriteStore.patterns[key]) return spriteStore.patterns[key];

    const tile = document.createElement("canvas");
    tile.width = TILE_SIZE;
    tile.height = TILE_SIZE;
    const tileCtx = tile.getContext("2d");
    tileCtx.drawImage(
      image,
      rect.col * TILE_SIZE,
      rect.row * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE,
      0,
      0,
      TILE_SIZE,
      TILE_SIZE
    );
    const pattern = ctx.createPattern(tile, "repeat");
    spriteStore.patterns[key] = pattern;
    return pattern;
  }

  function fillTileBand(name, y, bandHeight, shiftX = 0, alpha = 1) {
    const pattern = getTilePattern(name);
    if (!pattern || bandHeight <= 0) return false;

    const offsetX = -mod(shiftX, TILE_SIZE);
    const offsetY = -mod(y, TILE_SIZE);
    ctx.save();
    ctx.globalAlpha = ctx.globalAlpha * alpha;
    ctx.translate(offsetX, offsetY);
    ctx.fillStyle = pattern;
    ctx.fillRect(-offsetX, y - offsetY, width + TILE_SIZE, bandHeight + TILE_SIZE);
    ctx.restore();
    return true;
  }

  function drawGeneratedBackdrop(player, horizon, offset) {
    const image = spriteStore.art.map;
    if (!image) return;

    const backdropH = Math.min(height * 0.72, horizon + height * 0.22);
    const srcW = Math.min(image.width, Math.max(1, image.height * (width / backdropH)));
    const sxRange = Math.max(0, image.width - srcW);
    const sx = sxRange > 0 ? mod(player.z * 0.002 + offset * 1.8, sxRange) : 0;

    ctx.save();
    ctx.globalAlpha = isStormActive() ? 0.22 : 0.38;
    ctx.drawImage(image, sx, 0, srcW, image.height, 0, 0, width, backdropH);
    ctx.fillStyle = isStormActive() ? "rgba(7, 12, 20, 0.42)" : "rgba(255, 168, 105, 0.12)";
    ctx.fillRect(0, 0, width, backdropH);
    ctx.restore();
  }

  function drawMountain(x, y, scale) {
    ctx.beginPath();
    ctx.moveTo(x - 300 * scale, y + 90 * scale);
    ctx.lineTo(x - 120 * scale, y - 92 * scale);
    ctx.lineTo(x + 20 * scale, y + 32 * scale);
    ctx.lineTo(x + 160 * scale, y - 132 * scale);
    ctx.lineTo(x + 360 * scale, y + 98 * scale);
    ctx.closePath();
    ctx.fill();
  }

  function drawRoad(player) {
    const baseSegment = findSegment(player.z);
    const basePercent = percentRemaining(player.z, SEGMENT_LENGTH);
    const playerY = lerp(baseSegment.p1.world.y, baseSegment.p2.world.y, basePercent);
    let x = 0;
    let dx = -(baseSegment.curve * basePercent);
    let maxY = height;
    let visibleSegments = 0;
    let farY = height;
    let farX = width * 0.5;
    let farW = 0;

    for (let n = 0; n < DRAW_DISTANCE; n += 1) {
      const segment = segments[(baseSegment.index + n) % segments.length];
      segment.looped = segment.index < baseSegment.index;
      segment.clip = maxY;
      segment.p1.world.x = x;
      segment.p2.world.x = x + dx;

      project(
        segment.p1,
        player.x * ROAD_WIDTH - x,
        playerY + CAMERA_HEIGHT,
        player.z - (segment.looped ? trackLength : 0)
      );
      project(
        segment.p2,
        player.x * ROAD_WIDTH - x - dx,
        playerY + CAMERA_HEIGHT,
        player.z - (segment.looped ? trackLength : 0)
      );

      x += dx;
      dx += segment.curve;

      if (segment.p1.camera.z <= CAMERA_DEPTH || segment.p2.screen.y >= maxY) continue;
      drawSegment(segment);
      visibleSegments += 1;
      if (segment.p2.screen.y < farY) {
        farY = segment.p2.screen.y;
        farX = segment.p2.screen.x;
        farW = segment.p2.screen.w;
      }
      maxY = segment.p1.screen.y;
    }

    roadFogBand = {
      active: visibleSegments > 0,
      farY,
      farX,
      farW
    };
  }

  function drawDistanceHaze(player) {
    if (!roadFogBand.active) return;

    const storm = isStormActive();
    const horizon = height * 0.42;
    const focusY = clamp(roadFogBand.farY, horizon + height * 0.05, height * 0.58);
    const top = clamp(focusY - height * 0.14, horizon - height * 0.02, height * 0.56);
    const bottom = clamp(focusY + height * 0.27, height * 0.54, height * 0.78);
    const pulse = Math.sin(performance.now() * 0.0008 + player.z * 0.00011) * 0.02;
    const soft = storm ? "108, 206, 214" : "244, 232, 188";
    const warm = storm ? "55, 220, 198" : "255, 210, 126";

    ctx.save();
    const veil = ctx.createLinearGradient(0, top, 0, bottom);
    veil.addColorStop(0, `rgba(${soft}, 0)`);
    veil.addColorStop(0.26, `rgba(${soft}, ${storm ? 0.13 : 0.2})`);
    veil.addColorStop(0.52, `rgba(${warm}, ${storm ? 0.14 : 0.22 + pulse})`);
    veil.addColorStop(0.78, `rgba(${soft}, ${storm ? 0.1 : 0.14})`);
    veil.addColorStop(1, `rgba(${soft}, 0)`);
    ctx.fillStyle = veil;
    ctx.fillRect(0, top, width, bottom - top);

    const roadHalfTop = clamp(Math.max(roadFogBand.farW * 1.8, width * 0.11), width * 0.08, width * 0.36);
    const roadHalfBottom = width * 0.72;
    const centerX = clamp(roadFogBand.farX, width * 0.22, width * 0.78);
    polygon(
      centerX - roadHalfTop,
      top + height * 0.02,
      centerX + roadHalfTop,
      top + height * 0.02,
      width * 0.5 + roadHalfBottom,
      bottom,
      width * 0.5 - roadHalfBottom,
      bottom,
      storm ? "rgba(86, 189, 204, 0.13)" : "rgba(255, 231, 176, 0.17)"
    );

    ctx.globalCompositeOperation = "screen";
    const bloom = ctx.createRadialGradient(centerX, focusY, width * 0.04, centerX, focusY, width * 0.54);
    bloom.addColorStop(0, `rgba(${warm}, ${storm ? 0.1 : 0.17})`);
    bloom.addColorStop(0.54, `rgba(${soft}, ${storm ? 0.06 : 0.1})`);
    bloom.addColorStop(1, `rgba(${soft}, 0)`);
    ctx.fillStyle = bloom;
    ctx.fillRect(0, top - height * 0.05, width, bottom - top + height * 0.1);

    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = storm ? "rgba(178, 243, 238, 0.11)" : "rgba(255, 245, 206, 0.14)";
    ctx.lineWidth = Math.max(1, height * 0.0014);
    for (let i = 0; i < 7; i += 1) {
      const y = top + (bottom - top) * (0.2 + i * 0.095) + Math.sin(player.z * 0.001 + i) * 2;
      const shift = mod(player.z * (0.02 + i * 0.002) + i * 83, 180);
      ctx.beginPath();
      ctx.moveTo(-70 - shift, y);
      for (let x = -70 - shift; x < width + 180; x += 180) {
        ctx.quadraticCurveTo(x + 52, y - 4, x + 90, y);
        ctx.quadraticCurveTo(x + 134, y + 4, x + 180, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSegment(segment) {
    const p1 = segment.p1.screen;
    const p2 = segment.p2.screen;
    const color = segment.color;
    const grassY = Math.max(0, p2.y);
    const grassH = Math.max(0, p1.y - p2.y);

    ctx.fillStyle = color.grass;
    ctx.fillRect(0, grassY, width, grassH);

    const rumble1 = p1.w * 1.16;
    const rumble2 = p2.w * 1.16;
    drawCoastalShoulder(segment, rumble1, rumble2);
    polygon(p1.x - rumble1, p1.y, p1.x + rumble1, p1.y, p2.x + rumble2, p2.y, p2.x - rumble2, p2.y, color.rumble);
    polygon(p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y, color.road);
    drawRoadTileOverlay(segment);
    drawMode7RoadTexture(segment);
    if (isStormActive()) {
      polygon(
        p1.x - p1.w,
        p1.y,
        p1.x + p1.w,
        p1.y,
        p2.x + p2.w,
        p2.y,
        p2.x - p2.w,
        p2.y,
        segment.index % 2 ? "rgba(111, 169, 190, 0.13)" : "rgba(245, 247, 235, 0.08)"
      );
    }

    if (segment.boost) {
      polygon(
        p1.x - p1.w * 0.46,
        p1.y,
        p1.x + p1.w * 0.46,
        p1.y,
        p2.x + p2.w * 0.34,
        p2.y,
        p2.x - p2.w * 0.34,
        p2.y,
        "rgba(55, 220, 198, 0.56)"
      );
    }

    if (segment.ramp) {
      polygon(
        p1.x - p1.w * 0.52,
        p1.y,
        p1.x + p1.w * 0.52,
        p1.y,
        p2.x + p2.w * 0.42,
        p2.y,
        p2.x - p2.w * 0.42,
        p2.y,
        "rgba(255, 210, 74, 0.78)"
      );
      polygon(
        p1.x - p1.w * 0.18,
        p1.y,
        p1.x + p1.w * 0.18,
        p1.y,
        p2.x + p2.w * 0.12,
        p2.y,
        p2.x - p2.w * 0.12,
        p2.y,
        "rgba(255, 111, 95, 0.64)"
      );
    }

    if (segment.index % 18 < 9) {
      for (let lane = 1; lane < LANES; lane += 1) {
        const laneP = lane / LANES;
        const laneW1 = p1.w * 0.018;
        const laneW2 = p2.w * 0.018;
        const lx1 = p1.x - p1.w + p1.w * 2 * laneP;
        const lx2 = p2.x - p2.w + p2.w * 2 * laneP;
        polygon(lx1 - laneW1, p1.y, lx1 + laneW1, p1.y, lx2 + laneW2, p2.y, lx2 - laneW2, p2.y, color.lane);
      }
    }

    if (segment.index % 10 === 0) {
      polygon(
        p1.x - p1.w * 1.06,
        p1.y,
        p1.x - p1.w * 1.02,
        p1.y,
        p2.x - p2.w * 1.02,
        p2.y,
        p2.x - p2.w * 1.06,
        p2.y,
        "rgba(55, 220, 198, 0.42)"
      );
      polygon(
        p1.x + p1.w * 1.02,
        p1.y,
        p1.x + p1.w * 1.06,
        p1.y,
        p2.x + p2.w * 1.06,
        p2.y,
        p2.x + p2.w * 1.02,
        p2.y,
        "rgba(255, 210, 74, 0.38)"
      );
    }
  }

  function drawCoastalShoulder(segment, rumble1, rumble2) {
    const p1 = segment.p1.screen;
    const p2 = segment.p2.screen;
    const leftRoad1 = p1.x - rumble1;
    const leftRoad2 = p2.x - rumble2;
    if (leftRoad1 < 8 && leftRoad2 < 8) return;

    const shore1 = clamp(leftRoad1 - Math.max(width * 0.08, p1.w * 0.3), 0, width * 0.48);
    const shore2 = clamp(leftRoad2 - Math.max(width * 0.06, p2.w * 0.34), 0, width * 0.46);
    const water1 = clamp(shore1 - Math.max(width * 0.1, p1.w * 0.38), 0, width * 0.34);
    const water2 = clamp(shore2 - Math.max(width * 0.08, p2.w * 0.42), 0, width * 0.32);
    const beach1 = clamp(leftRoad1 - Math.max(width * 0.014, p1.w * 0.08), 0, width);
    const beach2 = clamp(leftRoad2 - Math.max(width * 0.012, p2.w * 0.08), 0, width);
    const storm = isStormActive();
    const pulse = segment.index % 6;

    polygon(
      0,
      p1.y,
      water1,
      p1.y,
      water2,
      p2.y,
      0,
      p2.y,
      storm ? "rgba(19, 87, 108, 0.68)" : "rgba(24, 139, 165, 0.72)"
    );
    polygon(
      water1,
      p1.y,
      shore1,
      p1.y,
      shore2,
      p2.y,
      water2,
      p2.y,
      storm ? "rgba(166, 145, 98, 0.66)" : "rgba(248, 198, 112, 0.82)"
    );
    polygon(
      shore1,
      p1.y,
      beach1,
      p1.y,
      beach2,
      p2.y,
      shore2,
      p2.y,
      storm ? "rgba(37, 99, 72, 0.48)" : "rgba(73, 151, 72, 0.58)"
    );

    if (pulse < 3) {
      const foam1 = lerp(water1, shore1, 0.62);
      const foam2 = lerp(water2, shore2, 0.62);
      polygon(
        foam1,
        p1.y,
        foam1 + Math.max(2, p1.w * 0.026),
        p1.y,
        foam2 + Math.max(1, p2.w * 0.02),
        p2.y,
        foam2,
        p2.y,
        storm ? "rgba(184, 230, 226, 0.2)" : "rgba(255, 248, 210, 0.42)"
      );
    }
  }

  function drawRoadTileOverlay(segment) {
    const p1 = segment.p1.screen;
    const p2 = segment.p2.screen;
    if (p1.y < height * 0.45) return;

    const patternName = isStormActive()
      ? "wetRoad"
      : (segment.index % 7 === 0 ? "crackedRoad" : "asphalt");
    const pattern = getTilePattern(patternName);
    if (!pattern) return;

    const alpha = clamp((p1.y / height - 0.42) * 0.38, 0.07, 0.22);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p1.x - p1.w, p1.y);
    ctx.lineTo(p1.x + p1.w, p1.y);
    ctx.lineTo(p2.x + p2.w, p2.y);
    ctx.lineTo(p2.x - p2.w, p2.y);
    ctx.closePath();
    ctx.clip();
    ctx.globalAlpha = alpha;
    ctx.translate(-mod(segment.index * 11 + state.player.z * 0.004, TILE_SIZE), -mod(p2.y, TILE_SIZE));
    ctx.fillStyle = pattern;
    ctx.fillRect(0, p2.y, width + TILE_SIZE, Math.max(1, p1.y - p2.y) + TILE_SIZE);
    ctx.restore();
  }

  function drawMode7RoadTexture(segment) {
    const p1 = segment.p1.screen;
    const p2 = segment.p2.screen;
    const segmentHeight = p1.y - p2.y;
    if (segmentHeight < 1) return;

    const near = p1.y > height * 0.54;
    const mid = p1.y > height * 0.38;
    if (!near && !mid) return;
    const bandCount = near ? 2 : 1;
    for (let band = 0; band < bandCount; band += 1) {
      if (!near && (segment.index + band) % 2 !== 0) continue;
      const t1 = band / bandCount;
      const t2 = (band + 0.62) / bandCount;
      const stripePhase = (segment.index + band) % 4;
      if (stripePhase > 1 && !near) continue;
      const a = interpolateRoadEdge(p1, p2, t1);
      const b = interpolateRoadEdge(p1, p2, Math.min(1, t2));
      const insetA = a.w * (0.07 + (stripePhase % 2) * 0.025);
      const insetB = b.w * (0.07 + (stripePhase % 2) * 0.025);
      polygon(
        a.x - a.w + insetA,
        a.y,
        a.x + a.w - insetA,
        a.y,
        b.x + b.w - insetB,
        b.y,
        b.x - b.w + insetB,
        b.y,
        stripePhase % 2 ? "rgba(255, 255, 255, 0.045)" : "rgba(0, 0, 0, 0.052)"
      );
    }

    if (!near || segment.index % 3 !== 0) return;
    const crackCount = 2;
    ctx.save();
    ctx.strokeStyle = "rgba(10, 12, 12, 0.18)";
    ctx.lineWidth = Math.max(1, width * 0.0012);
    for (let i = 0; i < crackCount; i += 1) {
      const seed = Math.sin((segment.index + 1) * (i + 3) * 12.9898) * 43758.5453;
      const lane = (seed - Math.floor(seed)) * 1.3 - 0.65;
      const a = interpolateRoadEdge(p1, p2, 0.18 + i * 0.28);
      const b = interpolateRoadEdge(p1, p2, 0.34 + i * 0.28);
      ctx.beginPath();
      ctx.moveTo(a.x + a.w * lane, a.y);
      ctx.lineTo(b.x + b.w * (lane + 0.05), b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function interpolateRoadEdge(p1, p2, t) {
    return {
      x: lerp(p1.x, p2.x, t),
      y: lerp(p1.y, p2.y, t),
      w: lerp(p1.w, p2.w, t)
    };
  }

  function polygon(x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  function drawVisibleObjects(player) {
    const visible = [];

    itemBoxes.forEach((box) => {
      if (box.cooldown > 0) return;
      const distance = forwardDistance(box.z, player.z);
      if (distance > 80 && distance < DRAW_DISTANCE * SEGMENT_LENGTH) {
        visible.push({ type: "box", distance, data: box });
      }
    });

    coins.forEach((coin) => {
      if (coin.taken) return;
      const distance = forwardDistance(coin.z, player.z);
      if (distance > 70 && distance < DRAW_DISTANCE * SEGMENT_LENGTH) {
        visible.push({ type: "coin", distance, data: coin });
      }
    });

    if (isStormActive()) {
      puddles.forEach((puddle) => {
        const distance = forwardDistance(puddle.z, player.z);
        if (distance > 55 && distance < DRAW_DISTANCE * SEGMENT_LENGTH) {
          visible.push({ type: "puddle", distance, data: puddle });
        }
      });
    }

    trackProps.forEach((prop) => {
      const distance = forwardDistance(prop.z, player.z);
      if (distance > 100 && distance < DRAW_DISTANCE * SEGMENT_LENGTH) {
        visible.push({ type: "prop", distance, data: prop });
      }
    });

    state.hazards.forEach((hazard) => {
      const distance = forwardDistance(hazard.z, player.z);
      if (distance > 50 && distance < DRAW_DISTANCE * SEGMENT_LENGTH) {
        visible.push({ type: "hazard", distance, data: hazard });
      }
    });

    state.racers.forEach((racer) => {
      const distance = forwardDistance(racer.z, player.z);
      if (distance > 60 && distance < DRAW_DISTANCE * SEGMENT_LENGTH) {
        visible.push({ type: "racer", distance, data: racer });
      }
    });

    visible.sort((a, b) => b.distance - a.distance);
    visible.forEach((entry) => {
      if (entry.type === "box") drawProjected(entry.data, entry.distance, drawItemBox);
      if (entry.type === "coin") drawProjected(entry.data, entry.distance, drawCoin);
      if (entry.type === "puddle") drawProjected(entry.data, entry.distance, drawPuddle);
      if (entry.type === "prop") drawProjected(entry.data, entry.distance, drawTrackProp);
      if (entry.type === "hazard") drawProjected(entry.data, entry.distance, drawOil);
      if (entry.type === "racer") drawProjected(entry.data, entry.distance, drawAICart);
    });
  }

  function drawProjected(object, distance, drawFn) {
    const segment = findSegment(object.z);
    const percent = percentRemaining(object.z, SEGMENT_LENGTH);
    if (!segment.p1.screen.scale || !segment.p2.screen.scale) return;

    const y = lerp(segment.p1.screen.y, segment.p2.screen.y, percent);
    const horizon = height * 0.42;
    const screen = {
      x: lerp(segment.p1.screen.x, segment.p2.screen.x, percent) + object.x * lerp(segment.p1.screen.w, segment.p2.screen.w, percent),
      y,
      scale: lerp(segment.p1.screen.scale, segment.p2.screen.scale, percent),
      distance,
      depthRatio: clamp(1 - distance / (DRAW_DISTANCE * SEGMENT_LENGTH), 0, 1),
      perspectiveRatio: clamp((y - horizon) / (height - horizon), 0, 1),
      fogOpacity: distanceFogOpacity(distance)
    };

    if (screen.y >= segment.clip || distance < 40) return;
    ctx.save();
    ctx.globalAlpha *= screen.fogOpacity;
    drawFn(object, screen);
    ctx.restore();
  }

  function drawItemBox(box, screen) {
    const size = projectedSpriteSize(screen, 170, 9, 42, 3);
    const wobble = Math.sin(box.spin) * size * 0.08;
    drawItemCube3D(screen.x, screen.y - size * 0.5 + wobble, size, box.spin);
  }

  function drawItemCube3D(x, y, size, spin) {
    const yaw = Math.sin(spin) * 0.7;
    const side = (yaw >= 0 ? 1 : -1) * size * (0.22 + Math.abs(yaw) * 0.12);
    const frontW = size * (0.9 - Math.abs(yaw) * 0.12);
    const frontH = size * 0.78;
    const depth = size * 0.34;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(spin * 0.7) * 0.07);

    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(side * 0.18, size * 0.54, size * 0.52, size * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();

    polygon(
      -frontW / 2,
      -frontH / 2,
      frontW / 2,
      -frontH / 2,
      frontW / 2 + side,
      -frontH / 2 - depth * 0.46,
      -frontW / 2 + side,
      -frontH / 2 - depth * 0.46,
      "#fff2a6"
    );
    polygon(
      side > 0 ? frontW / 2 : -frontW / 2,
      -frontH / 2,
      side > 0 ? frontW / 2 + side : -frontW / 2 + side,
      -frontH / 2 - depth * 0.46,
      side > 0 ? frontW / 2 + side : -frontW / 2 + side,
      frontH / 2 - depth * 0.34,
      side > 0 ? frontW / 2 : -frontW / 2,
      frontH / 2,
      "#e59735"
    );

    ctx.fillStyle = "#ffd24a";
    roundRect(-frontW / 2, -frontH / 2, frontW, frontH, Math.max(4, size * 0.08));
    ctx.fill();
    ctx.strokeStyle = "#17180e";
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.stroke();

    ctx.globalAlpha *= 0.55;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
    ctx.lineWidth = Math.max(1, size * 0.035);
    ctx.beginPath();
    ctx.moveTo(-frontW * 0.36, -frontH * 0.26);
    ctx.lineTo(frontW * 0.26, -frontH * 0.26);
    ctx.stroke();
    ctx.globalAlpha /= 0.55;

    ctx.fillStyle = "#37dcc6";
    ctx.strokeStyle = "#17180e";
    ctx.lineWidth = Math.max(1.4, size * 0.045);
    ctx.font = `900 ${Math.max(12, size * 0.7)}px ${ARCADE_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText("?", 0, size * 0.04);
    ctx.fillText("?", 0, size * 0.04);
    ctx.restore();
  }

  function drawCoin(coin, screen) {
    const size = projectedSpriteSize(screen, 150, 7, 36, 2.4);
    drawCoin3D(screen.x, screen.y - size * 0.68, size, coin.spin);
  }

  function drawCoin3D(x, y, size, spin) {
    const squash = 0.18 + Math.abs(Math.sin(spin)) * 0.56;
    const thickness = size * (0.08 + (1 - Math.abs(Math.sin(spin))) * 0.11);

    ctx.save();
    ctx.translate(x, y + Math.sin(spin * 1.3) * size * 0.12);

    ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
    ctx.beginPath();
    ctx.ellipse(0, size * 0.62, size * 0.36, size * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.scale(squash, 1);
    ctx.fillStyle = "#b87927";
    for (let offset = -2; offset <= 2; offset += 1) {
      ctx.beginPath();
      ctx.ellipse(offset * thickness, 0, size * 0.5, size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#ffd24a";
    ctx.strokeStyle = "#fff6b5";
    ctx.lineWidth = Math.max(1.5, size * 0.12);
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(21, 21, 13, 0.25)";
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.23, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.34)";
    ctx.beginPath();
    ctx.ellipse(-size * 0.14, -size * 0.16, size * 0.11, size * 0.06, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPuddle(puddle, screen) {
    const w = projectedSpriteSize(screen, 520 * puddle.width, 12, 110, 4);
    const h = w * 0.34;
    if (drawWorldSprite(WORLD_SPRITES.puddle, screen.x, screen.y + h * 0.1, w * 1.06, h * 3.2, {
      shadow: false,
      alpha: 0.88,
      anchorY: 0.64
    })) {
      return;
    }
    ctx.save();
    ctx.translate(screen.x, screen.y - h * 0.2);
    ctx.fillStyle = "rgba(70, 140, 172, 0.46)";
    ctx.beginPath();
    ctx.ellipse(0, 0, w, h, Math.sin(puddle.spin) * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(245, 247, 235, 0.32)";
    ctx.lineWidth = Math.max(1, w * 0.035);
    ctx.beginPath();
    ctx.ellipse(w * 0.1, -h * 0.08, w * 0.48, h * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawTrackProp(prop, screen) {
    if (prop.type === "gate") {
      drawGoalFlags(prop, screen);
      return;
    }

    const size = projectedSpriteSize(screen, 720, 12, 112, 3.6);
    const baseY = screen.y;
    if (prop.type === "lamp" && drawWorldSprite(WORLD_SPRITES.lamp, screen.x, baseY + size * 0.03, size * 0.9, size * 1.7, {
      anchorY: 0.94
    })) {
      return;
    }
    if (prop.type === "billboard" && drawWorldSprite(prop.x < 0 ? WORLD_SPRITES.signRight : WORLD_SPRITES.signLeft, screen.x, baseY + size * 0.02, size * 1.15, size * 1.15, {
      anchorY: 0.88
    })) {
      return;
    }
    if (prop.type === "chevron" && drawWorldSprite(WORLD_SPRITES.chevronBoard, screen.x, baseY + size * 0.01, size * 1.22, size * 1.18, {
      anchorY: 0.88
    })) {
      return;
    }
    if (prop.type === "palm" || prop.type === "palmAlt") {
      const palmSprite = prop.type === "palmAlt" || prop.phase % 2 ? WORLD_SPRITES.palmAlt : WORLD_SPRITES.palm;
      if (drawWorldSprite(palmSprite, screen.x, baseY, size * 1.05, size * 1.55, {
        anchorY: 1,
        shadowY: 0,
        shadowWidth: 0.32,
        shadowHeight: 0.065
      })) {
        return;
      }
    }
    if (prop.type === "speedBoard" && drawWorldSprite(WORLD_SPRITES.speedBoard, screen.x, baseY + size * 0.02, size * 1.02, size * 1.08, {
      anchorY: 0.9,
      shadowY: 0,
      shadowWidth: 0.28,
      shadowHeight: 0.05
    })) {
      return;
    }
    if (prop.type === "flag" && drawWorldSprite(prop.x < 0 ? WORLD_SPRITES.flagRight : WORLD_SPRITES.flagLeft, screen.x, baseY, size * 0.88, size * 1.42, {
      anchorY: 1,
      shadowY: 0,
      shadowWidth: 0.26,
      shadowHeight: 0.058
    })) {
      return;
    }
    if (prop.type === "pennants" && drawWorldSprite(WORLD_SPRITES.pennants, screen.x, baseY, size * 1.28, size * 1.2, {
      anchorY: 1,
      shadowY: 0,
      shadowWidth: 0.34,
      shadowHeight: 0.05
    })) {
      return;
    }
    if (prop.type === "umbrella" && drawWorldSprite(WORLD_SPRITES.umbrella, screen.x, baseY, size * 1.04, size * 1.28, {
      anchorY: 1,
      shadowY: 0,
      shadowWidth: 0.34,
      shadowHeight: 0.06
    })) {
      return;
    }
    if (prop.type === "buoy" && drawWorldSprite(WORLD_SPRITES.buoy, screen.x, baseY, size * 0.78, size * 1.1, {
      anchorY: 1,
      shadowY: 0,
      shadowWidth: 0.2,
      shadowHeight: 0.045
    })) {
      return;
    }
    if (prop.type === "crowd" && drawWorldSprite(WORLD_SPRITES.crowd, screen.x, baseY, size * 1.34, size * 1.1, {
      anchorY: 0.96,
      shadowY: 0,
      shadowWidth: 0.44,
      shadowHeight: 0.055
    })) {
      return;
    }
    if (prop.type === "tires" && drawWorldSprite(WORLD_SPRITES.tires, screen.x, baseY, size * 0.88, size * 1.06, {
      anchorY: 1,
      shadowY: 0,
      shadowWidth: 0.28,
      shadowHeight: 0.055
    })) {
      return;
    }
    if (prop.type === "flowerBed" && drawWorldSprite(WORLD_SPRITES.flowerBed, screen.x, baseY, size * 0.98, size * 0.92, {
      anchorY: 0.95,
      shadowY: 0,
      shadowWidth: 0.32,
      shadowHeight: 0.045
    })) {
      return;
    }
    ctx.save();
    if (prop.type === "lamp") {
      const h = size * 1.8;
      ctx.strokeStyle = "rgba(245, 247, 235, 0.55)";
      ctx.lineWidth = Math.max(2, size * 0.08);
      ctx.beginPath();
      ctx.moveTo(screen.x, baseY);
      ctx.lineTo(screen.x, baseY - h);
      ctx.stroke();
      const glow = ctx.createRadialGradient(screen.x, baseY - h, 2, screen.x, baseY - h, size * 0.62);
      glow.addColorStop(0, "rgba(55, 220, 198, 0.78)");
      glow.addColorStop(1, "rgba(55, 220, 198, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(screen.x - size, baseY - h - size, size * 2, size * 2);
      ctx.fillStyle = "#37dcc6";
      ctx.beginPath();
      ctx.arc(screen.x, baseY - h, size * 0.13, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop.type === "billboard") {
      const w = size * 1.3;
      const h = size * 0.62;
      ctx.fillStyle = "rgba(12, 14, 13, 0.92)";
      roundRect(screen.x - w / 2, baseY - h - size * 0.65, w, h, 6);
      ctx.fill();
      ctx.strokeStyle = prop.phase % 2 ? "#ffd24a" : "#37dcc6";
      ctx.lineWidth = Math.max(2, size * 0.06);
      ctx.stroke();
      ctx.fillStyle = prop.phase % 2 ? "#ffd24a" : "#37dcc6";
      ctx.fillRect(screen.x - w * 0.34, baseY - h - size * 0.43, w * 0.68, Math.max(2, h * 0.12));
      ctx.fillRect(screen.x - w * 0.22, baseY - h - size * 0.22, w * 0.44, Math.max(2, h * 0.09));
    } else {
      const lean = Math.sin(prop.phase) * size * 0.15;
      ctx.strokeStyle = "#1b3f2b";
      ctx.lineWidth = Math.max(3, size * 0.11);
      ctx.beginPath();
      ctx.moveTo(screen.x, baseY);
      ctx.lineTo(screen.x + lean, baseY - size * 1.25);
      ctx.stroke();
      ctx.fillStyle = "#2bd071";
      for (let i = 0; i < 5; i += 1) {
        ctx.save();
        ctx.translate(screen.x + lean, baseY - size * 1.25);
        ctx.rotate((i - 2) * 0.55);
        ctx.beginPath();
        ctx.ellipse(size * 0.22, 0, size * 0.34, size * 0.11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawGoalFlags(prop, screen) {
    const roadHalf = clamp(screen.scale * ROAD_WIDTH * width * 0.52, 22, width * 0.43);
    const size = projectedSpriteSize(screen, 900, 18, 132, 5);
    const leftX = screen.x - roadHalf * 0.94;
    const rightX = screen.x + roadHalf * 0.94;
    const flagY = screen.y + size * 0.02;
    const leftOk = drawWorldSprite(WORLD_SPRITES.flagRight, leftX, flagY, size * 0.72, size * 1.35, {
      anchorY: 1,
      shadowY: 0,
      shadowWidth: 0.22,
      shadowHeight: 0.052
    });
    const rightOk = drawWorldSprite(WORLD_SPRITES.flagLeft, rightX, flagY, size * 0.72, size * 1.35, {
      anchorY: 1,
      shadowY: 0,
      shadowWidth: 0.22,
      shadowHeight: 0.052
    });
    if (leftOk && rightOk) {
      const markerW = Math.max(2, size * 0.12);
      ctx.save();
      ctx.globalAlpha *= 0.42;
      polygon(
        screen.x - roadHalf * 0.5,
        screen.y + markerW,
        screen.x + roadHalf * 0.5,
        screen.y + markerW,
        screen.x + roadHalf * 0.62,
        screen.y + markerW * 2.8,
        screen.x - roadHalf * 0.62,
        screen.y + markerW * 2.8,
        prop.phase % 2 ? "rgba(255, 210, 74, 0.32)" : "rgba(245, 247, 235, 0.24)"
      );
      ctx.restore();
      return;
    }
    drawGoalFlagsFallback(screen);
  }

  function drawGoalFlagsFallback(screen) {
    const roadHalf = clamp(screen.scale * ROAD_WIDTH * width * 0.52, 22, width * 0.43);
    const h = clamp(screen.scale * width * 960, 26, 116);
    ctx.save();
    [screen.x - roadHalf * 0.94, screen.x + roadHalf * 0.94].forEach((x, side) => {
      ctx.strokeStyle = "rgba(245, 247, 235, 0.88)";
      ctx.lineWidth = Math.max(2, h * 0.045);
      ctx.beginPath();
      ctx.moveTo(x, screen.y);
      ctx.lineTo(x, screen.y - h);
      ctx.stroke();
      const dir = side ? -1 : 1;
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          ctx.fillStyle = (row + col) % 2 ? "#171918" : "#f5f7eb";
          ctx.fillRect(x + dir * col * h * 0.12, screen.y - h + row * h * 0.1, dir * h * 0.12, h * 0.1);
        }
      }
    });
    ctx.restore();
  }

  function drawNeonGate(screen) {
    const roadHalf = clamp(screen.scale * ROAD_WIDTH * width * 0.52, 34, width * 0.48);
    const h = clamp(screen.scale * width * 1450, 40, 220);
    const top = screen.y - h;
    ctx.save();
    ctx.strokeStyle = "rgba(55, 220, 198, 0.88)";
    ctx.lineWidth = Math.max(3, h * 0.055);
    ctx.beginPath();
    ctx.moveTo(screen.x - roadHalf, screen.y);
    ctx.lineTo(screen.x - roadHalf, top);
    ctx.lineTo(screen.x + roadHalf, top);
    ctx.lineTo(screen.x + roadHalf, screen.y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 210, 74, 0.62)";
    ctx.lineWidth = Math.max(2, h * 0.025);
    ctx.strokeRect(screen.x - roadHalf * 0.86, top + h * 0.14, roadHalf * 1.72, h * 0.18);
    ctx.restore();
  }

  function drawOil(hazard, screen) {
    const w = projectedSpriteSize(screen, 310, 10, 76, 3);
    const h = w * 0.38;
    if (drawWorldSprite(WORLD_SPRITES.oil, screen.x, screen.y + h * 0.22, w * 1.18, h * 3.5, {
      alpha: clamp(hazard.life / 2, 0.28, 0.86),
      shadow: false,
      anchorY: 0.72
    })) {
      return;
    }
    ctx.save();
    ctx.globalAlpha *= clamp(hazard.life / 2, 0.2, 0.78);
    ctx.fillStyle = "#171717";
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(143, 123, 255, 0.36)";
    ctx.beginPath();
    ctx.ellipse(screen.x + w * 0.14, screen.y - h * 0.08, w * 0.34, h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawAICart(racer, screen) {
    const kartW = projectedSpriteSize(screen, 760, 13, 118, 4.2);
    const kartH = kartW * 0.66;
    const spin = racer.spinTimer > 0 ? Math.sin(racer.spinTimer * 32) * 0.35 : 0;
    const frame = getAIOpponentFrame(racer);
    const x = screen.x;
    const y = screen.y - kartH * 0.44;
    drawKart3DBase(x, y, kartW, kartH, racer.color, racer.trim, spin, frame, false);
    if (drawKartSprite(x, y, kartW, kartH, racer.sprite, frame, spin, { shadow: false })) {
      drawKart3DAccents(x, y, kartW, kartH, racer.trim, spin, frame, false);
    } else {
      drawKartShape(x, y, kartW, kartH, racer.color, racer.trim, spin, false);
    }
  }

  function drawPlayerKart(player) {
    const stats = KARTS[state.selectedKart];
    const kartW = clamp(width * 0.14, 86, 154);
    const kartH = kartW * 0.68;
    const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const tilt = steer * (player.drifting ? 0.16 : 0.08);
    const jumpPct = player.jumpDuration > 0 ? clamp(player.jumpTimer / player.jumpDuration, 0, 1) : 0;
    const jumpLift = Math.sin(jumpPct * Math.PI) * height * 0.12;
    const jumpScale = 1 + Math.sin(jumpPct * Math.PI) * 0.08;
    const x = width * 0.5;
    const y = height * 0.84 - jumpLift;

    if (player.boostTimer > 0 || player.overdriveTimer > 0) {
      ctx.save();
      ctx.globalAlpha = player.overdriveTimer > 0 ? 0.72 : 0.5;
      ctx.fillStyle = player.overdriveTimer > 0 ? "#37dcc6" : "#ffd24a";
      ctx.beginPath();
      ctx.moveTo(x - kartW * 0.33, y + kartH * 0.18);
      ctx.lineTo(x, height + 40);
      ctx.lineTo(x + kartW * 0.33, y + kartH * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (player.slipstreamTimer > 0.2) drawSlipstreamAura(x, y, kartW, player.slipstreamTimer);
    if (player.shieldTimer > 0) drawShieldAura(x, y, kartW, player.shieldTimer);
    if (player.magnetTimer > 0) drawMagnetAura(x, y, kartW, player.magnetTimer);

    const frame = getPlayerKartFrame(player);
    const drawW = kartW * jumpScale;
    const drawH = kartH * jumpScale;
    drawKart3DBase(x, y, drawW, drawH, stats.body, stats.trim, tilt, frame, true);
    if (drawKartSprite(x, y, drawW, drawH, stats.sprite, frame, tilt, { shadow: false })) {
      drawKart3DAccents(x, y, drawW, drawH, stats.trim, tilt, frame, true);
    } else {
      drawKartShape(x, y, drawW, drawH, stats.body, stats.trim, tilt, true);
    }
    if (player.driftCharge > 0.1) drawDriftMeter(player.driftCharge, x, y + kartH * 0.72, kartW);
  }

  function drawSlipstreamAura(x, y, w, timer) {
    ctx.save();
    ctx.globalAlpha = clamp(timer / 1.8, 0, 0.55);
    ctx.strokeStyle = "rgba(245, 247, 235, 0.72)";
    ctx.lineWidth = Math.max(2, w * 0.018);
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(x, y + w * (0.16 + i * 0.13), w * (0.54 + i * 0.11), w * 0.11, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShieldAura(x, y, w, timer) {
    ctx.save();
    ctx.globalAlpha = clamp(timer / 1.8, 0.25, 0.72);
    ctx.strokeStyle = "#37dcc6";
    ctx.lineWidth = Math.max(3, w * 0.025);
    ctx.beginPath();
    ctx.ellipse(x, y - w * 0.03, w * 0.58, w * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawMagnetAura(x, y, w, timer) {
    ctx.save();
    ctx.globalAlpha = clamp(timer / 1.8, 0.2, 0.64);
    ctx.strokeStyle = "#ff6f5f";
    ctx.lineWidth = Math.max(2, w * 0.018);
    ctx.beginPath();
    ctx.arc(x - w * 0.42, y - w * 0.18, w * 0.23, Math.PI * 0.35, Math.PI * 1.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + w * 0.42, y - w * 0.18, w * 0.23, Math.PI * 1.35, Math.PI * 0.65);
    ctx.stroke();
    ctx.restore();
  }

  function drawKartShape(x, y, w, h, body, trim, rotation, isPlayer) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.beginPath();
    ctx.ellipse(0, h * 0.22, w * 0.48, h * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#161616";
    wheel(-w * 0.38, h * 0.08, w * 0.17, h * 0.3);
    wheel(w * 0.38, h * 0.08, w * 0.17, h * 0.3);
    wheel(-w * 0.32, -h * 0.26, w * 0.14, h * 0.25);
    wheel(w * 0.32, -h * 0.26, w * 0.14, h * 0.25);

    ctx.fillStyle = body;
    roundRect(-w * 0.34, -h * 0.35, w * 0.68, h * 0.66, Math.max(6, w * 0.06));
    ctx.fill();
    ctx.fillStyle = trim;
    roundRect(-w * 0.19, -h * 0.48, w * 0.38, h * 0.3, Math.max(5, w * 0.05));
    ctx.fill();
    ctx.fillStyle = "rgba(245, 247, 235, 0.82)";
    roundRect(-w * 0.13, -h * 0.44, w * 0.26, h * 0.13, Math.max(4, w * 0.04));
    ctx.fill();

    ctx.fillStyle = isPlayer ? "#f5f7eb" : trim;
    ctx.fillRect(-w * 0.25, h * 0.2, w * 0.5, h * 0.08);
    ctx.restore();
  }

  function wheel(x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = "#e8e8dc";
    ctx.fillRect(-w * 0.22, -h * 0.28, w * 0.44, h * 0.56);
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function drawDriftMeter(charge, x, y, w) {
    const pct = clamp(charge / 2.2, 0, 1);
    ctx.save();
    ctx.fillStyle = "rgba(10, 12, 12, 0.7)";
    roundRect(x - w * 0.36, y, w * 0.72, 9, 4);
    ctx.fill();
    ctx.fillStyle = pct > 0.78 ? "#ffd24a" : "#37dcc6";
    roundRect(x - w * 0.36, y, w * 0.72 * pct, 9, 4);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    state.particles.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = clamp(particle.life * 3.2, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawSparks() {
    state.sparks.forEach((spark) => {
      ctx.save();
      ctx.globalAlpha = clamp(spark.life * 2.8, 0, 1);
      ctx.fillStyle = spark.color;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawFlash() {
    if (flashTimer <= 0) return;
    ctx.save();
    ctx.globalAlpha = clamp(flashTimer * 2.8, 0, 0.42);
    ctx.fillStyle = "#ffd24a";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function drawWeather() {
    if (!isStormActive()) return;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "rgba(170, 230, 255, 0.72)";
    ctx.lineWidth = Math.max(1, width * 0.0012);
    const drift = state.rainTime * 720;
    for (let i = 0; i < 90; i += 1) {
      const x = mod(i * 97 + drift * 0.35, width + 160) - 80;
      const y = mod(i * 53 + drift, height + 160) - 80;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - width * 0.035, y + height * 0.09);
      ctx.stroke();
    }
    ctx.restore();

    if (state.lightningTimer > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(state.lightningTimer * 3.4, 0, 0.58);
      ctx.fillStyle = "rgba(205, 245, 255, 0.8)";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#f5f7eb";
      ctx.lineWidth = Math.max(2, width * 0.003);
      const x = width * (0.32 + Math.sin(state.raceTime * 2.3) * 0.18);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + width * 0.04, height * 0.16);
      ctx.lineTo(x - width * 0.02, height * 0.31);
      ctx.lineTo(x + width * 0.06, height * 0.48);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPopups() {
    state.popups.forEach((popup) => {
      ctx.save();
      ctx.globalAlpha = clamp(popup.life, 0, 1);
      ctx.fillStyle = popup.color;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
      ctx.lineWidth = 4;
      const popupFontSize = Math.min(30, Math.max(18, height * 0.034));
      ctx.font = `900 ${popupFontSize}px ${ARCADE_FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeText(popup.text, popup.x, popup.y);
      ctx.fillText(popup.text, popup.x, popup.y);
      ctx.restore();
    });
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.55, height * 0.15, width * 0.5, height * 0.55, height * 0.76);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.34)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawMinimap(player) {
    mapCtx.clearRect(0, 0, minimap.width, minimap.height);
    mapCtx.fillStyle = "rgba(10, 12, 12, 0.78)";
    mapCtx.fillRect(0, 0, minimap.width, minimap.height);
    drawMinimapArt();
    mapCtx.strokeStyle = "rgba(245, 247, 235, 0.44)";
    mapCtx.lineWidth = 5;
    mapCtx.lineJoin = "round";
    mapCtx.beginPath();
    mapPoints.forEach((point, index) => {
      if (index === 0) mapCtx.moveTo(point.x, point.y);
      else mapCtx.lineTo(point.x, point.y);
    });
    mapCtx.closePath();
    mapCtx.stroke();

    state.racers.forEach((racer) => {
      const point = mapPointFor(racer.z);
      mapCtx.fillStyle = racer.color;
      mapCtx.beginPath();
      mapCtx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      mapCtx.fill();
    });

    const point = mapPointFor(player.z);
    mapCtx.fillStyle = "#ffd24a";
    mapCtx.strokeStyle = "#151515";
    mapCtx.lineWidth = 2;
    mapCtx.beginPath();
    mapCtx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    mapCtx.fill();
    mapCtx.stroke();
  }

  function drawMinimapArt() {
    const image = spriteStore.art.map;
    if (!image) return;

    const crop = Math.min(image.width, image.height);
    const sx = (image.width - crop) * 0.5;
    mapCtx.save();
    mapCtx.globalAlpha = 0.24;
    mapCtx.drawImage(image, sx, 0, crop, crop, 0, 0, minimap.width, minimap.height);
    mapCtx.fillStyle = "rgba(10, 12, 12, 0.38)";
    mapCtx.fillRect(0, 0, minimap.width, minimap.height);
    mapCtx.restore();
  }

  function mapPointFor(z) {
    const index = Math.floor(mod(z, trackLength) / SEGMENT_LENGTH) % mapPoints.length;
    return mapPoints[index] || { x: minimap.width / 2, y: minimap.height / 2 };
  }

  function clearSwipeInput() {
    input.gas = false;
    input.brake = false;
    input.left = false;
    input.right = false;
    input.drift = false;
    input.overdrive = false;
  }

  function bindSwipeControls() {
    if (!window.PointerEvent) return;

    canvas.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "touch" || state.mode === "menu" || swipe.active) return;
      event.preventDefault();
      audio.init();
      swipe.active = true;
      swipe.pointerId = event.pointerId;
      swipe.startX = event.clientX;
      swipe.startY = event.clientY;
      swipe.lastX = event.clientX;
      swipe.lastY = event.clientY;
      swipe.startedAt = performance.now();
      swipe.moved = false;
      input.gas = true;
      input.brake = false;
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Some browsers only allow capture for trusted pointer streams.
      }
    }, { passive: false });

    canvas.addEventListener("pointermove", (event) => {
      if (!swipe.active || event.pointerId !== swipe.pointerId) return;
      event.preventDefault();
      swipe.lastX = event.clientX;
      swipe.lastY = event.clientY;

      const dx = swipe.lastX - swipe.startX;
      const dy = swipe.lastY - swipe.startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      swipe.moved = swipe.moved || absX > 12 || absY > 12;

      input.left = dx < -24;
      input.right = dx > 24;
      input.drift = absX > 82 && absY < 120;
      input.overdrive = dy < -105 && absX < 95;

      if (dy > 46) {
        input.gas = false;
        input.brake = true;
      } else {
        input.gas = true;
        input.brake = false;
      }
    }, { passive: false });

    const endSwipe = (event) => {
      if (!swipe.active || event.pointerId !== swipe.pointerId) return;
      event.preventDefault();
      const dx = event.clientX - swipe.startX;
      const dy = event.clientY - swipe.startY;
      const distance = Math.hypot(dx, dy);
      const duration = performance.now() - swipe.startedAt;
      if (state.mode === "racing" && !swipe.moved && distance < 18 && duration < 260) useItem();
      clearSwipeInput();
      swipe.active = false;
      swipe.pointerId = null;
      try {
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer may already be gone on gesture cancellation.
      }
    };

    canvas.addEventListener("pointerup", endSwipe, { passive: false });
    canvas.addEventListener("pointercancel", endSwipe, { passive: false });
  }

  function toggleFullscreen() {
    if (!document.fullscreenEnabled) {
      showToast("Vollbild nicht verfuegbar");
      return;
    }

    if (!document.fullscreenElement) {
      shell.requestFullscreen().catch(() => showToast("Vollbild nicht verfuegbar"));
    } else {
      document.exitFullscreen();
    }
  }

  function updateFullscreenButton() {
    if (!ui.fullscreen) return;
    const active = document.fullscreenElement === shell;
    ui.fullscreen.classList.toggle("is-active", active);
    ui.fullscreen.setAttribute("aria-pressed", String(active));
  }

  function bindEvents() {
    window.addEventListener("resize", resizeCanvas);

    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (key === "m") {
        audio.init();
        const muted = audio.toggleMute();
        showToast(muted ? "Sound aus" : "Sound an");
      }
      if (keyMap.has(key)) {
        const action = keyMap.get(key);
        input[action] = true;
        event.preventDefault();
        if (action === "item" && !event.repeat) useItem();
      }
      if (key === "enter" && state.mode === "menu") startRace();
      if (key === "p") {
        if (state.mode === "racing") pauseRace();
        else if (state.mode === "pause") resumeRace();
      }
      if (key === "r" && (state.mode === "finish" || state.mode === "pause")) startRace();
    });

    window.addEventListener("keyup", (event) => {
      const key = event.key.toLowerCase();
      if (keyMap.has(key)) {
        input[keyMap.get(key)] = false;
        event.preventDefault();
      }
    });

    document.getElementById("start-button").addEventListener("click", startRace);
    document.getElementById("resume-button").addEventListener("click", resumeRace);
    document.getElementById("restart-button").addEventListener("click", startRace);
    document.getElementById("race-again-button").addEventListener("click", startRace);
    if (ui.fullscreen) ui.fullscreen.addEventListener("click", toggleFullscreen);
    document.addEventListener("fullscreenchange", updateFullscreenButton);

    document.querySelectorAll(".kart-option").forEach((button) => {
      button.addEventListener("click", () => selectKart(button.dataset.kart));
    });

    document.querySelectorAll("#touch-controls button").forEach((button) => {
      const action = button.dataset.touch;
      const press = (event) => {
        event.preventDefault();
        if (action === "item") {
          useItem();
          return;
        }
        input[action] = true;
      };
      const release = (event) => {
        event.preventDefault();
        if (action !== "item") input[action] = false;
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    });
    bindSwipeControls();
  }

  function frame(time) {
    const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
    lastTime = time;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  buildTrack();
  resetRace();
  resizeCanvas();
  bindEvents();
  loadSpriteAssets();
  setMode("menu");
  requestAnimationFrame(frame);
})();
