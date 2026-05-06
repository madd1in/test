(() => {
  "use strict";

  const WIDTH = 1280;
  const HEIGHT = 720;
  const GRAVITY = 2350;
  const ACCEL = 2200;
  const AIR_ACCEL = 1320;
  const FRICTION = 1850;
  const MAX_RUN = 760;
  const MAX_BOOST = 1180;
  const JUMP = 840;
  const SPRING_JUMP = 1180;
  const PLAYER_W = 46;
  const PLAYER_H = 56;

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const overlay = document.querySelector("#overlay");
  const startButton = document.querySelector("#startButton");
  const restartButton = document.querySelector("#restartButton");
  const pauseButton = document.querySelector("#pauseButton");
  const audioButton = document.querySelector("#audioButton");
  const hudHoops = document.querySelector("#hudHoops");
  const hudScore = document.querySelector("#hudScore");
  const hudTime = document.querySelector("#hudTime");
  const hudSpeed = document.querySelector("#hudSpeed");
  const hudBoost = document.querySelector("#hudBoost");

  const DEFAULT_ASSET_MAP = {
    frames: {
      hero_idle: { x: 0, y: 0, w: 64, h: 64 },
      hero_run_1: { x: 64, y: 0, w: 64, h: 64 },
      hero_run_2: { x: 128, y: 0, w: 64, h: 64 },
      hero_run_3: { x: 192, y: 0, w: 64, h: 64 },
      hero_run_4: { x: 256, y: 0, w: 64, h: 64 },
      hero_jump: { x: 320, y: 0, w: 64, h: 64 },
      hero_dash: { x: 384, y: 0, w: 64, h: 64 },
      hero_skid: { x: 448, y: 0, w: 64, h: 64 },
      hero_hurt: { x: 512, y: 0, w: 64, h: 64 },
      fx_trail: { x: 576, y: 0, w: 64, h: 64 },
      fx_spark: { x: 640, y: 0, w: 64, h: 64 },
      fx_burst: { x: 704, y: 0, w: 64, h: 64 },
      tile_grass: { x: 0, y: 64, w: 64, h: 64 },
      tile_dirt: { x: 64, y: 64, w: 64, h: 64 },
      tile_stone: { x: 128, y: 64, w: 64, h: 64 },
      tile_slope_up: { x: 192, y: 64, w: 64, h: 64 },
      tile_slope_down: { x: 256, y: 64, w: 64, h: 64 },
      tile_loop: { x: 320, y: 64, w: 64, h: 64 },
      tile_cave: { x: 384, y: 64, w: 64, h: 64 },
      tile_rail: { x: 448, y: 64, w: 64, h: 64 },
      tile_bridge: { x: 512, y: 64, w: 64, h: 64 },
      tile_water: { x: 576, y: 64, w: 64, h: 64 },
      item_hoop_1: { x: 0, y: 128, w: 64, h: 64 },
      item_hoop_2: { x: 64, y: 128, w: 64, h: 64 },
      item_hoop_3: { x: 128, y: 128, w: 64, h: 64 },
      item_hoop_4: { x: 192, y: 128, w: 64, h: 64 },
      item_spring: { x: 256, y: 128, w: 64, h: 64 },
      item_boost: { x: 320, y: 128, w: 64, h: 64 },
      item_shield: { x: 384, y: 128, w: 64, h: 64 },
      enemy_drone: { x: 448, y: 128, w: 64, h: 64 },
      hazard_spike: { x: 512, y: 128, w: 64, h: 64 },
      item_checkpoint: { x: 576, y: 128, w: 64, h: 64 },
      item_goal: { x: 640, y: 128, w: 64, h: 64 },
      bg_cloud: { x: 0, y: 192, w: 64, h: 64 },
      bg_hill: { x: 64, y: 192, w: 64, h: 64 },
      bg_palm: { x: 128, y: 192, w: 64, h: 64 },
      bg_crystal: { x: 192, y: 192, w: 64, h: 64 },
      ui_hoop: { x: 0, y: 256, w: 64, h: 64 },
      ui_speed: { x: 64, y: 256, w: 64, h: 64 },
      ui_energy: { x: 128, y: 256, w: 64, h: 64 }
    },
    animations: {
      run: ["hero_run_1", "hero_run_2", "hero_run_3", "hero_run_4"],
      hoop: ["item_hoop_1", "item_hoop_2", "item_hoop_3", "item_hoop_4"]
    }
  };

  let assetMap = DEFAULT_ASSET_MAP;
  let assetMapLoaded = false;
  const sliceImages = new Map();
  let slicesReady = false;
  let sliceFramesLoaded = 0;
  let sliceFrameCount = 0;
  const atlas = new Image();
  let atlasReady = false;
  atlas.addEventListener("load", () => {
    atlasReady = true;
  });
  atlas.src = "assets/asset-map.svg";

  function loadImage(src) {
    const image = new Image();
    image.src = src;
    return image;
  }

  function loadSlicedFrames(map) {
    sliceImages.clear();
    slicesReady = false;
    sliceFramesLoaded = 0;
    sliceFrameCount = Object.keys(map.frames || {}).length;
    for (const name of Object.keys(map.frames || {})) {
      const image = new Image();
      image.addEventListener("load", () => {
        sliceFramesLoaded += 1;
        slicesReady = sliceFramesLoaded >= sliceFrameCount;
      });
      image.src = `assets/sliced/${name}.png`;
      sliceImages.set(name, image);
    }
  }

  const importedImages = {
    cloudBank: loadImage("assets/imported/bg-cloud-bank.png"),
    silhouettes: loadImage("assets/imported/bg-distant-silhouettes.png"),
    mistBands: loadImage("assets/imported/bg-mist-bands.png")
  };

  const mode7Texture = document.createElement("canvas");
  mode7Texture.width = 256;
  mode7Texture.height = 256;
  const mode7Ctx = mode7Texture.getContext("2d");
  let mode7TextureReady = false;

  const audioState = {
    context: null,
    master: null,
    sfx: null,
    muted: false,
    unlocked: false,
    bgmReady: false,
    bgm: new Audio("assets/audio/needle-meadow-sprint.mp3")
  };
  audioState.bgm.loop = true;
  audioState.bgm.preload = "auto";
  audioState.bgm.volume = 0.32;
  audioState.bgm.addEventListener("canplaythrough", () => {
    audioState.bgmReady = true;
  });

  fetch("assets/asset-map.json", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : DEFAULT_ASSET_MAP))
    .then((data) => {
      if (data && data.frames) {
        assetMap = data;
        assetMapLoaded = true;
        loadSlicedFrames(assetMap);
      }
    })
    .catch(() => {
      assetMap = DEFAULT_ASSET_MAP;
      loadSlicedFrames(assetMap);
    });

  function imageReady(image) {
    return Boolean(image && image.complete && image.naturalWidth > 0);
  }

  function ensureAudio() {
    if (audioState.context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioState.context = new AudioContext();
    audioState.master = audioState.context.createGain();
    audioState.master.gain.value = audioState.muted ? 0 : 0.42;
    audioState.master.connect(audioState.context.destination);
    audioState.sfx = audioState.context.createGain();
    audioState.sfx.gain.value = 0.58;
    audioState.sfx.connect(audioState.master);
  }

  function unlockAudio() {
    ensureAudio();
    if (audioState.context && audioState.context.state === "suspended") {
      audioState.context.resume().catch(() => {});
    }
    audioState.unlocked = true;
    updateAudioButton();
  }

  function startBgm() {
    unlockAudio();
    if (audioState.muted) return;
    audioState.bgm.play().catch(() => {});
  }

  function toggleAudio() {
    unlockAudio();
    audioState.muted = !audioState.muted;
    audioState.bgm.muted = audioState.muted;
    if (audioState.master) audioState.master.gain.value = audioState.muted ? 0 : 0.42;
    if (!audioState.muted && state.mode === "playing") audioState.bgm.play().catch(() => {});
    updateAudioButton();
  }

  function updateAudioButton() {
    if (!audioButton) return;
    audioButton.classList.toggle("is-muted", audioState.muted);
    audioButton.setAttribute("aria-label", audioState.muted ? "Audio muted" : "Audio on");
  }

  function playSfx(type) {
    if (audioState.muted) return;
    ensureAudio();
    const context = audioState.context;
    if (!context || !audioState.sfx) return;
    const now = context.currentTime;
    const table = {
      hoop: [880, 1320, 0.075, "triangle", 0.18],
      jump: [520, 760, 0.11, "square", 0.14],
      dash: [160, 860, 0.16, "sawtooth", 0.16],
      spring: [360, 1120, 0.18, "square", 0.18],
      boost: [260, 980, 0.24, "sawtooth", 0.18],
      shield: [620, 1240, 0.24, "sine", 0.16],
      hit: [220, 80, 0.2, "sawtooth", 0.2],
      checkpoint: [660, 990, 0.28, "triangle", 0.18],
      goal: [520, 1560, 0.5, "triangle", 0.2],
      retry: [260, 170, 0.22, "square", 0.16],
      enemy: [760, 320, 0.15, "square", 0.18],
      loop: [440, 980, 0.32, "sawtooth", 0.13]
    };
    const spec = table[type] || table.hoop;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = spec[3];
    oscillator.frequency.setValueAtTime(spec[0], now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, spec[1]), now + spec[2]);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(spec[4], now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + spec[2]);
    oscillator.connect(gain);
    gain.connect(audioState.sfx);
    oscillator.start(now);
    oscillator.stop(now + spec[2] + 0.03);
  }

  const terrain = [
    { x: -320, w: 900, y: 590, tile: "tile_grass" },
    { x: 580, w: 430, y1: 590, y2: 516, slope: "up" },
    { x: 1010, w: 670, y: 516, tile: "tile_grass" },
    { x: 1680, w: 390, y1: 516, y2: 610, slope: "down" },
    { x: 2070, w: 590, y: 610, tile: "tile_grass" },
    { x: 2660, w: 520, y1: 610, y2: 532, slope: "up" },
    { x: 3180, w: 700, y: 532, tile: "tile_cave" },
    { x: 3880, w: 460, y1: 532, y2: 600, slope: "down" },
    { x: 4340, w: 1200, y: 600, tile: "tile_grass" }
  ];

  const platforms = [
    { x: 720, y: 432, w: 240 },
    { x: 1220, y: 356, w: 230 },
    { x: 2290, y: 464, w: 260 },
    { x: 3380, y: 374, w: 290 },
    { x: 4100, y: 430, w: 260 },
    { x: 4740, y: 388, w: 240 }
  ];

  const loops = [
    { x: 1770, y: 330, w: 360, h: 250, used: false },
    { x: 3600, y: 282, w: 340, h: 260, used: false }
  ];

  const levelWidth = 5350;
  const input = {
    left: false,
    right: false,
    down: false,
    jump: false,
    dash: false,
    jumpPressed: false,
    dashPressed: false
  };

  const state = {
    mode: "menu",
    paused: false,
    time: 0,
    score: 0,
    hoops: 0,
    cameraX: 0,
    shake: 0,
    message: "",
    messageTime: 0,
    checkpoint: { x: 100, y: 450 },
    particles: [],
    rings: [],
    springs: [],
    boosts: [],
    shields: [],
    enemies: [],
    spikes: [],
    checkpoints: [],
    goal: { x: 5140, y: 486, w: 82, h: 108 }
  };

  const player = {
    x: 120,
    y: 420,
    vx: 0,
    vy: 0,
    w: PLAYER_W,
    h: PLAYER_H,
    facing: 1,
    grounded: false,
    rolling: false,
    dashing: 0,
    dashCooldown: 0,
    invuln: 0,
    shield: false,
    boost: 62,
    loop: null,
    rotation: 0,
    lastGroundY: 590
  };

  function makeLevel() {
    state.rings = [];
    state.springs = [];
    state.boosts = [];
    state.shields = [];
    state.enemies = [];
    state.spikes = [];
    state.checkpoints = [];

    addHoopArc(360, 510, 8, 48, 54);
    addHoopArc(780, 370, 6, 42, 34);
    addHoopArc(1160, 292, 8, 42, 44);
    addHoopArc(1560, 445, 7, 44, 30);
    addHoopArc(2140, 532, 10, 44, 48);
    addHoopArc(2750, 540, 8, 46, 44);
    addHoopArc(3340, 470, 7, 44, 38);
    addHoopArc(3840, 430, 8, 42, 60);
    addHoopArc(4380, 520, 10, 44, 42);
    addHoopArc(4840, 330, 8, 42, 50);

    state.springs.push(
      { x: 1080, y: 480, used: 0 },
      { x: 2520, y: 574, used: 0 },
      { x: 4020, y: 565, used: 0 },
      { x: 4680, y: 558, used: 0 }
    );
    state.boosts.push(
      { x: 610, y: 520, collected: false },
      { x: 1505, y: 455, collected: false },
      { x: 3060, y: 536, collected: false },
      { x: 4250, y: 540, collected: false }
    );
    state.shields.push({ x: 1315, y: 302, collected: false }, { x: 3490, y: 320, collected: false });
    state.enemies.push(
      { x: 1430, y: 438, baseY: 438, vx: 80, t: 0, defeated: false },
      { x: 2360, y: 520, baseY: 520, vx: -90, t: 1.2, defeated: false },
      { x: 3740, y: 454, baseY: 454, vx: 70, t: 0.4, defeated: false },
      { x: 4550, y: 508, baseY: 508, vx: -80, t: 1.9, defeated: false }
    );
    state.spikes.push(
      { x: 1960, y: 558 },
      { x: 3210, y: 480 },
      { x: 4440, y: 548 }
    );
    state.checkpoints.push(
      { x: 2180, y: 496, reached: false },
      { x: 3980, y: 486, reached: false }
    );
    loops.forEach((loop) => {
      loop.used = false;
    });
  }

  function addHoopArc(x, y, count, spacing, height) {
    for (let i = 0; i < count; i += 1) {
      const p = count <= 1 ? 0 : i / (count - 1);
      state.rings.push({
        x: x + i * spacing,
        y: y - Math.sin(p * Math.PI) * height,
        collected: false,
        phase: i * 0.3
      });
    }
  }

  function resetGame() {
    startBgm();
    makeLevel();
    state.mode = "playing";
    state.paused = false;
    state.time = 0;
    state.score = 0;
    state.hoops = 0;
    state.cameraX = 0;
    state.shake = 0;
    state.message = "";
    state.messageTime = 0;
    state.checkpoint = { x: 120, y: 420 };
    state.particles.length = 0;
    Object.assign(player, {
      x: 120,
      y: 420,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      rolling: false,
      dashing: 0,
      dashCooldown: 0,
      invuln: 0,
      shield: false,
      boost: 62,
      loop: null,
      rotation: 0,
      lastGroundY: 590
    });
    overlay.classList.remove("overlay--visible");
    updateHud();
  }

  function showOverlay(title, copy) {
    const titleNode = overlay.querySelector("h1");
    const copyNode = overlay.querySelector(".overlay__copy");
    titleNode.textContent = title;
    copyNode.textContent = copy;
    overlay.classList.add("overlay--visible");
  }

  function setAction(action, down) {
    if (input[action] === down) return;
    input[action] = down;
    if (down && action === "jump") input.jumpPressed = true;
    if (down && action === "dash") input.dashPressed = true;
  }

  const keyMap = new Map([
    ["ArrowLeft", "left"],
    ["KeyA", "left"],
    ["ArrowRight", "right"],
    ["KeyD", "right"],
    ["ArrowDown", "down"],
    ["KeyS", "down"],
    ["Space", "jump"],
    ["ArrowUp", "jump"],
    ["KeyW", "jump"],
    ["ShiftLeft", "dash"],
    ["ShiftRight", "dash"],
    ["KeyK", "dash"]
  ]);

  window.addEventListener("keydown", (event) => {
    unlockAudio();
    const action = keyMap.get(event.code);
    if (action) {
      event.preventDefault();
      setAction(action, true);
    }
    if (event.code === "KeyP") togglePause();
    if (event.code === "KeyR") resetGame();
  });

  window.addEventListener("keyup", (event) => {
    const action = keyMap.get(event.code);
    if (action) {
      event.preventDefault();
      setAction(action, false);
    }
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    const action = button.dataset.action;
    const press = (event) => {
      event.preventDefault();
      unlockAudio();
      button.classList.add("is-active");
      setAction(action, true);
    };
    const release = (event) => {
      event.preventDefault();
      button.classList.remove("is-active");
      setAction(action, false);
    };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  });

  startButton.addEventListener("click", resetGame);
  restartButton.addEventListener("click", resetGame);
  pauseButton.addEventListener("click", togglePause);
  audioButton.addEventListener("click", toggleAudio);

  function togglePause() {
    if (state.mode !== "playing") return;
    state.paused = !state.paused;
    if (state.paused) {
      showOverlay("Paused", "Die Strecke wartet. Ein weiterer Druck auf P setzt den Lauf fort.");
    } else {
      overlay.classList.remove("overlay--visible");
    }
  }

  function frame(name) {
    return assetMap.frames[name] || DEFAULT_ASSET_MAP.frames[name] || DEFAULT_ASSET_MAP.frames.hero_idle;
  }

  function drawFrame(name, x, y, w = 64, h = 64, options = {}) {
    const slicedImage = sliceImages.get(name);
    if (imageReady(slicedImage)) {
      ctx.save();
      if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
      if (options.rotate) {
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate(options.rotate);
        x = -w / 2;
        y = -h / 2;
      }
      if (options.flip) {
        ctx.translate(x + w, y);
        ctx.scale(-1, 1);
        ctx.drawImage(slicedImage, 0, 0, w, h);
      } else {
        ctx.drawImage(slicedImage, x, y, w, h);
      }
      ctx.restore();
      return;
    }
    if (!atlasReady) {
      ctx.fillStyle = options.tint || "#ffc64a";
      ctx.fillRect(x, y, w, h);
      return;
    }
    const f = frame(name);
    ctx.save();
    if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
    if (options.rotate) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(options.rotate);
      x = -w / 2;
      y = -h / 2;
    }
    if (options.flip) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(atlas, f.x, f.y, f.w, f.h, 0, 0, w, h);
    } else {
      ctx.drawImage(atlas, f.x, f.y, f.w, f.h, x, y, w, h);
    }
    ctx.restore();
  }

  function groundYAt(x) {
    for (const segment of terrain) {
      if (x >= segment.x && x <= segment.x + segment.w) {
        if (segment.slope) {
          const p = (x - segment.x) / segment.w;
          return segment.y1 + (segment.y2 - segment.y1) * p;
        }
        return segment.y;
      }
    }
    return 660;
  }

  function update(dt) {
    if (state.mode !== "playing" || state.paused) {
      input.jumpPressed = false;
      input.dashPressed = false;
      return;
    }

    state.time += dt;
    state.messageTime = Math.max(0, state.messageTime - dt);
    state.shake = Math.max(0, state.shake - dt * 28);
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.dashing = Math.max(0, player.dashing - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.boost = Math.min(100, player.boost + dt * 4.5);

    if (player.loop) {
      updateLoop(dt);
      updateWorld(dt);
      afterMove();
      consumePressed();
      return;
    }

    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (direction !== 0) {
      const appliedAccel = player.grounded ? ACCEL : AIR_ACCEL;
      player.vx += direction * appliedAccel * dt;
      player.facing = direction;
    } else if (player.grounded) {
      const slow = FRICTION * dt;
      if (Math.abs(player.vx) <= slow) player.vx = 0;
      else player.vx -= Math.sign(player.vx) * slow;
    }

    player.rolling = input.down && player.grounded && Math.abs(player.vx) > 130;
    if (player.rolling) {
      player.vx += player.facing * 280 * dt;
    }

    if (input.jumpPressed && player.grounded) {
      player.vy = -JUMP;
      player.grounded = false;
      spawnBurst(player.x + player.w / 2, player.y + player.h, "#2fe7ff", 9);
      playSfx("jump");
    }

    if (input.dashPressed && player.dashCooldown <= 0 && player.boost >= 22) {
      player.dashing = 0.22;
      player.dashCooldown = 0.42;
      player.boost -= 22;
      player.vx += player.facing * 650;
      player.vy *= 0.65;
      state.shake = 4;
      spawnBurst(player.x + player.w / 2, player.y + player.h / 2, "#ffc64a", 14);
      playSfx("dash");
    }

    const topSpeed = player.dashing > 0 || player.rolling ? MAX_BOOST : MAX_RUN;
    player.vx = clamp(player.vx, -topSpeed * 0.82, topSpeed);
    player.vy += GRAVITY * dt;

    const previousBottom = player.y + player.h;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.x = clamp(player.x, 0, levelWidth - player.w);

    collideGround(previousBottom);
    collidePlatforms(previousBottom);
    maybeStartLoop();
    updateWorld(dt);
    afterMove();
    consumePressed();
  }

  function consumePressed() {
    input.jumpPressed = false;
    input.dashPressed = false;
  }

  function updateLoop(dt) {
    const loop = player.loop.loop;
    player.loop.p += dt * clamp(Math.abs(player.vx) / 470, 0.75, 1.85);
    const p = Math.min(1, player.loop.p);
    player.x = loop.x + loop.w * p - player.w / 2;
    player.y = loop.y + loop.h - Math.sin(p * Math.PI) * loop.h - player.h;
    player.rotation = p * Math.PI * 2;
    player.grounded = false;
    player.vx = Math.max(player.vx, 720);
    player.boost = Math.min(100, player.boost + dt * 20);
    if (p >= 1) {
      player.loop = null;
      player.rotation = 0;
      player.x = loop.x + loop.w + 10;
      player.y = groundYAt(player.x + player.w / 2) - player.h;
      player.grounded = true;
      loop.used = true;
      spawnBurst(player.x, player.y + player.h / 2, "#2fe7ff", 12);
      playSfx("loop");
    }
  }

  function maybeStartLoop() {
    if (!player.grounded || Math.abs(player.vx) < 520 || player.loop) return;
    for (const loop of loops) {
      const inEntry = player.x + player.w > loop.x - 28 && player.x < loop.x + 38;
      const closeY = Math.abs(player.y + player.h - (loop.y + loop.h)) < 78;
      if (inEntry && closeY && !loop.used) {
        player.loop = { loop, p: 0 };
        player.vx = Math.max(player.vx, 720);
        state.message = "Loop Rail";
        state.messageTime = 1.2;
        spawnBurst(player.x, player.y + player.h / 2, "#ffc64a", 10);
        playSfx("loop");
        return;
      }
    }
  }

  function collideGround(previousBottom) {
    const centerX = player.x + player.w / 2;
    const groundY = groundYAt(centerX);
    player.lastGroundY = groundY;
    if (player.y + player.h >= groundY) {
      if (player.vy >= 0 || previousBottom <= groundY + 28) {
        player.y = groundY - player.h;
        player.vy = 0;
        player.grounded = true;
      }
    } else {
      player.grounded = false;
    }
  }

  function collidePlatforms(previousBottom) {
    if (player.vy < 0) return;
    for (const platform of platforms) {
      const insideX = player.x + player.w > platform.x && player.x < platform.x + platform.w;
      const crossed = previousBottom <= platform.y + 8 && player.y + player.h >= platform.y;
      if (insideX && crossed) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.grounded = true;
      }
    }
  }

  function updateWorld(dt) {
    updateParticles(dt);
    for (const spring of state.springs) spring.used = Math.max(0, spring.used - dt);
    for (const enemy of state.enemies) {
      if (enemy.defeated) continue;
      enemy.t += dt;
      enemy.x += enemy.vx * dt;
      enemy.y = enemy.baseY + Math.sin(enemy.t * 3.4) * 16;
      if (enemy.x < 1260 || enemy.x > 4760) enemy.vx *= -1;
    }
    collectItems();
    hitEnemies();
    hitHazards();
    hitCheckpoints();
    hitGoal();
  }

  function afterMove() {
    if (player.y > HEIGHT + 200) damagePlayer(true);
    state.cameraX += (clamp(player.x - 360, 0, levelWidth - WIDTH) - state.cameraX) * 0.14;
    updateHud();
  }

  function collectItems() {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    for (const ring of state.rings) {
      if (!ring.collected && distance(cx, cy, ring.x, ring.y) < 44) {
        ring.collected = true;
        state.hoops += 1;
        state.score += 100;
        player.boost = Math.min(100, player.boost + 6);
        spawnBurst(ring.x, ring.y, "#ffc64a", 7);
        playSfx("hoop");
      }
    }
    for (const boost of state.boosts) {
      if (!boost.collected && overlaps(player, { x: boost.x, y: boost.y, w: 44, h: 44 })) {
        boost.collected = true;
        player.boost = 100;
        player.vx += player.facing * 520;
        state.score += 500;
        state.message = "Full Boost";
        state.messageTime = 1.1;
        spawnBurst(boost.x + 24, boost.y + 24, "#2fe7ff", 16);
        playSfx("boost");
      }
    }
    for (const shield of state.shields) {
      if (!shield.collected && overlaps(player, { x: shield.x, y: shield.y, w: 48, h: 48 })) {
        shield.collected = true;
        player.shield = true;
        state.score += 300;
        state.message = "Shield";
        state.messageTime = 1.1;
        spawnBurst(shield.x + 24, shield.y + 24, "#9efaff", 15);
        playSfx("shield");
      }
    }
    for (const spring of state.springs) {
      if (overlaps(player, { x: spring.x, y: spring.y, w: 52, h: 34 }) && player.vy >= 0) {
        spring.used = 0.18;
        player.y = spring.y - player.h;
        player.vy = -SPRING_JUMP;
        player.grounded = false;
        player.boost = Math.min(100, player.boost + 12);
        state.shake = 3;
        spawnBurst(spring.x + 28, spring.y + 14, "#ff685f", 12);
        playSfx("spring");
      }
    }
  }

  function hitEnemies() {
    for (const enemy of state.enemies) {
      if (enemy.defeated) continue;
      const enemyBox = { x: enemy.x - 24, y: enemy.y - 24, w: 48, h: 42 };
      if (!overlaps(player, enemyBox)) continue;
      const attacking = player.rolling || player.dashing > 0 || player.vy > 260 || player.loop;
      if (attacking) {
        enemy.defeated = true;
        player.vy = -460;
        player.vx += player.facing * 160;
        state.score += 800;
        spawnBurst(enemy.x, enemy.y, "#2fe7ff", 18);
        playSfx("enemy");
      } else {
        damagePlayer(false);
      }
    }
  }

  function hitHazards() {
    for (const spike of state.spikes) {
      if (overlaps(player, { x: spike.x + 8, y: spike.y + 22, w: 48, h: 34 })) {
        damagePlayer(false);
      }
    }
  }

  function hitCheckpoints() {
    for (const checkpoint of state.checkpoints) {
      if (!checkpoint.reached && overlaps(player, { x: checkpoint.x, y: checkpoint.y - 42, w: 44, h: 90 })) {
        checkpoint.reached = true;
        state.checkpoint = { x: checkpoint.x, y: checkpoint.y - player.h };
        state.score += 1000;
        state.message = "Checkpoint";
        state.messageTime = 1.2;
        spawnBurst(checkpoint.x + 22, checkpoint.y, "#ffc64a", 14);
        playSfx("checkpoint");
      }
    }
  }

  function hitGoal() {
    if (state.mode === "playing" && overlaps(player, state.goal)) {
      state.mode = "won";
      state.score += Math.max(0, Math.round((95 - state.time) * 120));
      playSfx("goal");
      showOverlay("Run Clear", `Score ${state.score} mit ${state.hoops} Hoops.`);
    }
  }

  function damagePlayer(fell) {
    if (player.invuln > 0) return;
    if (!fell && player.shield) {
      player.shield = false;
      player.invuln = 1.2;
      player.vx = -player.facing * 320;
      player.vy = -520;
      state.shake = 6;
      spawnBurst(player.x + player.w / 2, player.y + player.h / 2, "#9efaff", 18);
      playSfx("shield");
      return;
    }
    if (!fell && state.hoops > 0) {
      const lost = Math.ceil(state.hoops * 0.5);
      state.hoops -= lost;
      player.invuln = 1.4;
      player.vx = -player.facing * 420;
      player.vy = -560;
      state.shake = 7;
      for (let i = 0; i < Math.min(lost, 14); i += 1) {
        state.particles.push({
          x: player.x + player.w / 2,
          y: player.y + player.h / 2,
          vx: Math.cos((i / 14) * Math.PI * 2) * 260,
          vy: Math.sin((i / 14) * Math.PI * 2) * 180 - 120,
          life: 0.8,
          size: 10,
          color: "#ffc64a"
        });
      }
      playSfx("hit");
      return;
    }
    respawn();
  }

  function respawn() {
    player.x = state.checkpoint.x;
    player.y = state.checkpoint.y;
    player.vx = 0;
    player.vy = 0;
    player.loop = null;
    player.rotation = 0;
    player.invuln = 1.8;
    player.boost = Math.max(player.boost, 42);
    state.shake = 8;
    state.message = "Retry";
    state.messageTime = 1.2;
    spawnBurst(player.x + player.w / 2, player.y + player.h / 2, "#ff685f", 20);
    playSfx("retry");
  }

  function updateParticles(dt) {
    for (const particle of state.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += GRAVITY * 0.28 * dt;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);
    if (Math.abs(player.vx) > 380 && player.grounded && Math.random() < 0.42) {
      state.particles.push({
        x: player.x + player.w / 2 - player.facing * 28,
        y: player.y + player.h - 6,
        vx: -player.facing * (80 + Math.random() * 150),
        vy: -40 - Math.random() * 90,
        life: 0.35,
        size: 8 + Math.random() * 10,
        color: player.rolling ? "#2fe7ff" : "#dca96a"
      });
    }
  }

  function spawnBurst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 120 + Math.random() * 220;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        life: 0.35 + Math.random() * 0.35,
        size: 6 + Math.random() * 9,
        color
      });
    }
  }

  function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawSky();
    const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    ctx.save();
    ctx.translate(-state.cameraX + shakeX, shakeY);
    drawParallax();
    drawMode7Floor();
    drawLoops();
    drawTerrain();
    drawPlatforms();
    drawItems();
    drawEnemies();
    drawParticles();
    drawPlayer();
    drawGoal();
    ctx.restore();
    drawMessage();
    if (state.mode === "menu") drawAttractRunner();
  }

  function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, "#5ed8ff");
    gradient.addColorStop(0.44, "#a6f1ff");
    gradient.addColorStop(0.58, "#ffe39b");
    gradient.addColorStop(1, "#13233b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "rgba(22, 40, 64, 0.14)";
    ctx.fillRect(0, HEIGHT * 0.58, WIDTH, HEIGHT * 0.42);
  }

  function drawRepeatingImage(image, y, w, h, parallax, alpha = 1) {
    if (!imageReady(image)) return false;
    const cam = state.cameraX;
    const offset = (cam * parallax) % w;
    const start = cam - offset - w;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let x = start; x < cam + WIDTH + w; x += w) {
      ctx.drawImage(image, x, y, w, h);
    }
    ctx.restore();
    return true;
  }

  function ensureMode7Texture() {
    if (mode7TextureReady) return true;
    if (!atlasReady && !slicesReady) return false;
    mode7Ctx.clearRect(0, 0, mode7Texture.width, mode7Texture.height);
    const repeatTiles = ["tile_grass", "tile_dirt", "tile_cave", "tile_rail"];
    for (let y = 0; y < 256; y += 64) {
      for (let x = 0; x < 256; x += 64) {
        const tile = repeatTiles[((x / 64) + (y / 64)) % repeatTiles.length];
        const slicedImage = sliceImages.get(tile);
        if (imageReady(slicedImage)) {
          mode7Ctx.drawImage(slicedImage, x, y, 64, 64);
        } else if (atlasReady) {
          const f = frame(tile);
          mode7Ctx.drawImage(atlas, f.x, f.y, f.w, f.h, x, y, 64, 64);
        }
      }
    }
    mode7Ctx.fillStyle = "rgba(47, 231, 255, 0.18)";
    for (let x = 0; x < 256; x += 32) mode7Ctx.fillRect(x, 0, 2, 256);
    for (let y = 0; y < 256; y += 32) mode7Ctx.fillRect(0, y, 256, 2);
    mode7TextureReady = true;
    return true;
  }

  function drawMode7Floor() {
    if (!ensureMode7Texture()) return;
    const horizon = 420;
    ctx.save();
    ctx.globalAlpha = 0.32;
    const bandCount = 8;
    for (let i = 0; i < bandCount; i += 1) {
      const t0 = i / bandCount;
      const t1 = (i + 1) / bandCount;
      const y = horizon + Math.pow(t0, 1.55) * (HEIGHT - horizon);
      const nextY = horizon + Math.pow(t1, 1.55) * (HEIGHT - horizon);
      const t = (y - horizon) / (HEIGHT - horizon);
      const scale = 0.42 + t * t * 4.2;
      const stripW = 256 * scale;
      const stripH = Math.max(3, nextY - y + 1);
      const srcY = Math.floor((state.cameraX * 0.08 + state.time * 34 + 60 / (0.12 + t)) % 256);
      const offset = (state.cameraX * (0.18 + t * 1.7) + state.time * 90) % stripW;
      const start = state.cameraX - offset - stripW;
      for (let x = start; x < state.cameraX + WIDTH + stripW; x += stripW) {
        ctx.drawImage(mode7Texture, 0, srcY, 256, 2, x, y, stripW, stripH);
      }
    }
    ctx.restore();
  }

  function drawParallax() {
    const cam = state.cameraX;
    const importedSkyline = drawRepeatingImage(importedImages.silhouettes, 286, 1024, 256, 0.2, 0.36);
    const importedMist = drawRepeatingImage(importedImages.mistBands, 246, 1024, 240, 0.34, 0.32);
    const importedClouds = drawRepeatingImage(importedImages.cloudBank, 78, 1024, 150, 0.12, 0.72);
    for (let i = -1; i < 15; i += 1) {
      const x = i * 420 + 80 - cam * 0.14;
      if (!importedClouds) drawFrame("bg_cloud", x, 72 + Math.sin(i) * 22, 118, 72, { alpha: 0.9 });
    }
    for (let i = -1; i < 14; i += 1) {
      const x = i * 380 - cam * 0.25;
      if (!importedSkyline) drawFrame("bg_hill", x, 398, 280, 190, { alpha: 0.72 });
      if (i % 2 === 0) drawFrame("bg_palm", x + 170, 332, 130, 160, { alpha: 0.82 });
    }
    if (!importedMist) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#e9fbff";
      for (let y = 266; y < 430; y += 42) ctx.fillRect(state.cameraX - 80, y, WIDTH + 160, 11);
      ctx.restore();
    }
    for (let i = 0; i < 12; i += 1) {
      const x = i * 510 + 310;
      if (x > cam - 200 && x < cam + WIDTH + 200) {
        drawFrame("bg_crystal", x, 398, 92, 132, { alpha: i % 2 ? 0.55 : 0.34 });
      }
    }
  }

  function drawTerrain() {
    for (const segment of terrain) {
      if (segment.x + segment.w < state.cameraX - 120 || segment.x > state.cameraX + WIDTH + 160) continue;
      if (segment.slope) {
        const topFrame = segment.slope === "up" ? "tile_slope_up" : "tile_slope_down";
        for (let x = segment.x; x < segment.x + segment.w; x += 64) {
          const ground = groundYAt(x + 32);
          drawFrame(topFrame, x, ground - 64, 64, 64);
          for (let y = ground; y < HEIGHT + 128; y += 64) drawFrame("tile_dirt", x, y, 64, 64);
        }
        continue;
      }
      for (let x = Math.floor(segment.x / 64) * 64; x < segment.x + segment.w; x += 64) {
        drawFrame(segment.tile || "tile_grass", x, segment.y - 64, 64, 64);
        for (let y = segment.y; y < HEIGHT + 128; y += 64) {
          drawFrame(segment.tile === "tile_cave" ? "tile_cave" : "tile_dirt", x, y, 64, 64);
        }
      }
    }
    for (let x = -128; x < levelWidth + 128; x += 64) {
      if (x < state.cameraX - 160 || x > state.cameraX + WIDTH + 160) continue;
      drawFrame("tile_water", x, 668, 64, 64, { alpha: 0.82 });
    }
  }

  function drawPlatforms() {
    for (const platform of platforms) {
      if (platform.x + platform.w < state.cameraX - 90 || platform.x > state.cameraX + WIDTH + 90) continue;
      for (let x = platform.x; x < platform.x + platform.w; x += 64) {
        drawFrame("tile_bridge", x, platform.y - 28, 64, 64);
      }
    }
  }

  function drawLoops() {
    for (const loop of loops) {
      if (loop.x + loop.w < state.cameraX - 160 || loop.x > state.cameraX + WIDTH + 160) continue;
      const cx = loop.x + loop.w / 2;
      const cy = loop.y + loop.h / 2;
      ctx.save();
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255, 198, 74, 0.95)";
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.ellipse(cx, cy, loop.w / 2, loop.h / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(47, 231, 255, 0.88)";
      ctx.lineWidth = 6;
      ctx.setLineDash([18, 18]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, loop.w / 2 - 15, loop.h / 2 - 15, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        drawFrame("tile_loop", cx + Math.cos(a) * (loop.w / 2) - 18, cy + Math.sin(a) * (loop.h / 2) - 18, 36, 36, { alpha: 0.7 });
      }
      ctx.restore();
    }
  }

  function drawItems() {
    const hoopFrames = assetMap.animations?.hoop || DEFAULT_ASSET_MAP.animations.hoop;
    for (const ring of state.rings) {
      if (ring.collected || ring.x < state.cameraX - 80 || ring.x > state.cameraX + WIDTH + 80) continue;
      const frameName = hoopFrames[Math.floor((state.time * 12 + ring.phase) % hoopFrames.length)];
      drawFrame(frameName, ring.x - 22, ring.y - 24, 44, 48);
    }
    for (const boost of state.boosts) {
      if (!boost.collected) drawFrame("item_boost", boost.x - 8, boost.y - 8, 58, 58);
    }
    for (const shield of state.shields) {
      if (!shield.collected) drawFrame("item_shield", shield.x - 8, shield.y - 8, 58, 58);
    }
    for (const spring of state.springs) {
      drawFrame("item_spring", spring.x - 6, spring.y - 22 - spring.used * 22, 62, 62);
    }
    for (const spike of state.spikes) {
      drawFrame("hazard_spike", spike.x, spike.y, 64, 64);
    }
    for (const checkpoint of state.checkpoints) {
      drawFrame("item_checkpoint", checkpoint.x - 8, checkpoint.y - 58, 64, 64, { alpha: checkpoint.reached ? 0.6 : 1 });
    }
  }

  function drawEnemies() {
    for (const enemy of state.enemies) {
      if (enemy.defeated || enemy.x < state.cameraX - 80 || enemy.x > state.cameraX + WIDTH + 80) continue;
      drawFrame("enemy_drone", enemy.x - 32, enemy.y - 32, 64, 64);
      drawFrame("fx_spark", enemy.x - 22, enemy.y - 46 + Math.sin(state.time * 8) * 4, 44, 44, { alpha: 0.46 });
    }
  }

  function drawParticles() {
    for (const particle of state.particles) {
      ctx.save();
      ctx.globalAlpha = clamp(particle.life / 0.8, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * clamp(particle.life, 0, 1), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPlayer() {
    if (player.invuln > 0 && Math.floor(state.time * 18) % 2 === 0) return;
    let frameName = "hero_idle";
    const speed = Math.abs(player.vx);
    if (!player.grounded && !player.loop) frameName = "hero_jump";
    if (player.rolling || player.loop) frameName = "hero_jump";
    if (player.dashing > 0) frameName = "hero_dash";
    if (player.grounded && speed > 80) {
      const runFrames = assetMap.animations?.run || DEFAULT_ASSET_MAP.animations.run;
      frameName = runFrames[Math.floor((state.time * (8 + speed / 95)) % runFrames.length)];
      if ((input.left && player.vx > 170) || (input.right && player.vx < -170)) frameName = "hero_skid";
    }
    if (player.shield) {
      ctx.save();
      ctx.globalAlpha = 0.46 + Math.sin(state.time * 10) * 0.12;
      ctx.strokeStyle = "#9efaff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(player.x + player.w / 2, player.y + player.h / 2, 36, 42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    drawFrame(frameName, player.x - 12, player.y - 8, 72, 72, {
      flip: player.facing < 0,
      rotate: player.rotation
    });
  }

  function drawGoal() {
    drawFrame("item_goal", state.goal.x, state.goal.y - 12, 92, 112);
  }

  function drawMessage() {
    if (state.messageTime <= 0) return;
    ctx.save();
    ctx.globalAlpha = clamp(state.messageTime, 0, 1);
    ctx.fillStyle = "rgba(4, 12, 20, 0.72)";
    ctx.strokeStyle = "rgba(47, 231, 255, 0.45)";
    ctx.lineWidth = 2;
    roundRect(ctx, WIDTH / 2 - 118, 82, 236, 46, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f7fbff";
    ctx.font = "800 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(state.message, WIDTH / 2, 112);
    ctx.restore();
  }

  function drawAttractRunner() {
    const x = 170 + Math.sin(performance.now() / 240) * 18;
    const y = 494 + Math.sin(performance.now() / 190) * 6;
    drawFrame("hero_dash", x, y, 94, 94);
    drawFrame("fx_trail", x - 62, y + 20, 82, 52, { alpha: 0.72 });
    drawFrame("item_hoop_1", x + 130, y + 25, 54, 58);
  }

  function updateHud() {
    hudHoops.textContent = String(state.hoops);
    hudScore.textContent = String(state.score);
    hudTime.textContent = state.time.toFixed(1);
    hudSpeed.textContent = String(Math.round(Math.abs(player.vx) / MAX_BOOST * 320));
    hudBoost.style.width = `${Math.round(player.boost)}%`;
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function distance(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function roundRect(context, x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(tick);
  }

  window.__voltLynxDebug = {
    start: resetGame,
    getState: () => ({
      mode: state.mode,
      paused: state.paused,
      time: state.time,
      score: state.score,
      hoops: state.hoops,
      cameraX: state.cameraX,
      player: {
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        boost: player.boost,
        shield: player.shield,
        grounded: player.grounded,
        loop: Boolean(player.loop)
      },
      assetMapLoaded,
      atlasReady,
      slicesReady,
      sliceFramesLoaded,
      sliceFrameCount,
      mode7TextureReady,
      importedGraphicsReady: Object.fromEntries(
        Object.entries(importedImages).map(([key, image]) => [key, imageReady(image)])
      ),
      audio: {
        muted: audioState.muted,
        unlocked: audioState.unlocked,
        bgmReady: audioState.bgmReady || audioState.bgm.readyState >= 3,
        bgmSrc: audioState.bgm.currentSrc || audioState.bgm.src
      },
      ringsRemaining: state.rings.filter((ring) => !ring.collected).length,
      particles: state.particles.length,
      enemiesActive: state.enemies.filter((enemy) => !enemy.defeated).length
    })
  };

  makeLevel();
  updateHud();
  updateAudioButton();
  requestAnimationFrame(tick);
})();
