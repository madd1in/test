const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const bundledNodeModules = "C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function mime(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".mp3")) return "audio/mpeg";
  if (file.endsWith(".wav")) return "audio/wav";
  return "application/octet-stream";
}

function staticServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
    if (rel === "favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
    const target = path.resolve(root, rel);
    if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": mime(target) });
    fs.createReadStream(target).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function resolvePlaywright() {
  try {
    return require("playwright");
  } catch {
    try {
      return require(path.join(bundledNodeModules, "playwright"));
    } catch {
      return require(path.join(bundledNodeModules, ".pnpm", "playwright@1.59.1", "node_modules", "playwright"));
    }
  }
}

async function closeServer(server) {
  if (typeof server.closeIdleConnections === "function") server.closeIdleConnections();
  if (typeof server.closeAllConnections === "function") server.closeAllConnections();
  await Promise.race([
    new Promise((resolve) => server.close(() => resolve())),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);
}

async function run() {
  [
    "index.html",
    "style.css",
    "game.js",
    "assets/backgrounds/topdown_beach_repeatable_clean_hd.jpg",
    "assets/backgrounds/map_moonlit_lagoon_hd.jpg",
    "assets/backgrounds/map_gothic_cove_hd.jpg",
    "assets/backgrounds/map_treasure_atoll_hd.jpg",
    "assets/sprites/characters_imagen_hd_sheet.webp",
    "assets/sprites/player_skins_imagen_hd.webp",
    "assets/sprites/player_skin_walkcycles_imagen_hd.webp",
    "assets/sprites/player_skin_select_imagen_hd.webp",
    "assets/sprites/sam_max_duo_fixed_hd.png",
    "assets/sprites/sam_max_duo_walk_imagen_hd.webp",
    "assets/sprites/scene_items_imagen_hd_sheet.webp",
    "assets/sprites/new_sprites_imagen_hd.webp",
    "assets/sprites/gothic_enemies_hd_sheet.webp",
    "assets/sprites/gothic_items_hd_sheet.webp",
    "assets/sprites/gothic_props_hd_sheet.webp",
    "assets/sprites/spectral_captain_hd_sheet.webp",
    "assets/sprites/bosses/three_headed_monkey_imagen_hd.webp",
    "assets/sprites/bosses/blackbeard_imagen_hd.webp",
    "assets/sprites/bosses/three_headed_monkey_anim_imagen_hd.webp",
    "assets/sprites/bosses/blackbeard_anim_imagen_hd.webp",
    "assets/sprites/beach-props-v2/clear_puddle.webp",
    "assets/sprites/beach-props-v2/tide_puddle.webp",
    "assets/sprites/beach-props-v2/hedge_cluster.webp",
    "assets/sprites/beach-props-v2/palm_hedge.webp",
    "assets/sprites/beach-props-v2/buried_treasure.webp",
    "assets/sprites/beach-props-v2/open_treasure_chest_imagen_hd.webp",
    "assets/sprites/beach-props-v2/conch_shrine.webp",
    "assets/sprites/beach-props-v2/beach_hut.webp",
    "assets/sprites/beach-props-v2/boat_wreck.webp",
    "assets/sprites/projectile_fx_imagen_hd.webp",
    "assets/sprites/player_effects_imagen_hd.webp",
    "assets/sprites/weapon_evolution_fx_imagen_hd.png",
    "assets/sprites/extra_enemies_imagen_hd.webp",
    "assets/sprites/extra_items_imagen_hd.webp",
    "assets/ui/parchment_panel_imagen_hd.webp",
    "assets/ui/parchment_button_imagen_hd.webp",
    "assets/ui/parchment_card_imagen_hd.webp",
    "assets/ui/parchment_scrap_imagen_hd.webp",
    "assets/audio/bgm/crimson-galleon.mp3",
    "assets/audio/bgm/gargoyle-chapel-run.mp3",
    "assets/audio/bgm/coconut-caper-loop.mp3",
    "assets/audio/bgm/shoreline-rum-riddle.mp3",
    "assets/audio/sfx/from-downloads/pickup-gem.mp3",
    "assets/audio/sfx/from-downloads/soft-chime.mp3",
    "assets/audio/sfx/from-downloads/curse-gate.mp3",
    "assets/audio/sfx/from-downloads/ui-confirm.mp3",
    "assets/audio/sfx/from-downloads/coin-pickup.mp3",
    "assets/audio/sfx/from-downloads/dash-swish.mp3",
    "assets/audio/sfx/from-downloads/cursed-hit.mp3",
    "assets/audio/sfx/from-downloads/upgrade-card.mp3",
    "assets/audio/sfx/from-downloads/boss-warning.mp3",
    "assets/audio/sfx/from-downloads/boss-down.mp3",
  ].forEach((rel) => {
    const target = path.join(root, rel);
    assert(fs.existsSync(target), `Missing ${rel}`);
    assert(fs.statSync(target).size > 500, `${rel} looks empty`);
  });

  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  assert(css.includes("parchment_panel_imagen_hd.webp") && css.includes("parchment_button_imagen_hd.webp"), "Parchment UI assets are not wired into CSS");

  const { chromium } = resolvePlaywright();
  const server = await staticServer();
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/index.html`;
  const chromeCandidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe",
  ];
  const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const consoleErrors = [];
  const pageErrors = [];
  const badResponses = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("response", (res) => {
    if (res.status() >= 400) badResponses.push(`${res.status()} ${res.url()}`);
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => window.__MONKEY_TIDE_READY === true, null, { timeout: 90000 });
  const hedgeAlphaProbe = await page.evaluate(async () => {
    const results = [];
    for (const src of [
      "assets/sprites/beach-props-v2/hedge_cluster.webp?alpha-clean",
      "assets/sprites/beach-props-v2/palm_hedge.webp?alpha-clean",
    ]) {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let edgeAlpha = 0;
      let visible = 0;
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          const alpha = data[(y * canvas.width + x) * 4 + 3];
          if (alpha > 8) {
            visible += 1;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            if (x === 0 || y === 0 || x === canvas.width - 1 || y === canvas.height - 1) edgeAlpha += 1;
          }
        }
      }
      results.push({ src, size: [canvas.width, canvas.height], edgeAlpha, visible, bbox: [minX, minY, maxX, maxY] });
    }
    return results;
  });
  assert(hedgeAlphaProbe.every((asset) => asset.edgeAlpha === 0 && asset.visible > 10000 && asset.bbox[0] > 0 && asset.bbox[1] > 0 && asset.bbox[2] < asset.size[0] - 1 && asset.bbox[3] < asset.size[1] - 1), `Hedge assets still look sliced at the alpha edge: ${JSON.stringify(hedgeAlphaProbe)}`);
  const readMenuFit = () => {
    const panel = document.querySelector("#startOverlay .start-panel");
    const start = document.getElementById("startButton");
    const panelRect = panel.getBoundingClientRect();
    const startRect = start.getBoundingClientRect();
    const style = getComputedStyle(panel);
    return {
      viewport: { w: innerWidth, h: innerHeight },
      panel: { top: panelRect.top, bottom: panelRect.bottom, height: panelRect.height, scrollHeight: panel.scrollHeight, overflowY: style.overflowY },
      startVisible: startRect.bottom <= panelRect.bottom + 1 && startRect.top >= panelRect.top - 1,
    };
  };
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  const portraitMenu = await page.evaluate(readMenuFit);
  assert(portraitMenu.panel.top >= -1 && portraitMenu.panel.bottom <= portraitMenu.viewport.h + 1 && portraitMenu.panel.overflowY !== "visible", `Portrait mobile menu is clipped: ${JSON.stringify(portraitMenu)}`);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(100);
  const landscapeMenu = await page.evaluate(readMenuFit);
  assert(landscapeMenu.panel.top >= -1 && landscapeMenu.panel.bottom <= landscapeMenu.viewport.h + 1 && landscapeMenu.startVisible, `Landscape mobile menu is clipped: ${JSON.stringify(landscapeMenu)}`);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(100);
  const skinUi = await page.evaluate(() => Array.from(document.querySelectorAll("#skinPicker [data-skin]")).map((button) => ({
    id: button.dataset.skin,
    checked: button.getAttribute("aria-checked") === "true",
    label: button.textContent.trim(),
  })));
  assert(skinUi.length >= 7, `Player skin picker is missing options: ${JSON.stringify(skinUi)}`);
  assert(skinUi.some((skin) => skin.id === "curseMonkey") && skinUi.some((skin) => skin.id === "freelanceDuo"), `Requested alternate skins missing: ${JSON.stringify(skinUi)}`);
  const pickerUsesSelectSheet = await page.evaluate(() => getComputedStyle(document.querySelector("#skinPicker .skin-icon")).backgroundImage.includes("player_skin_select_imagen_hd.webp"));
  assert(pickerUsesSelectSheet, "Character picker is not using the normalized first-sheet selection atlas");
  const freelanceDuoUsesFixedCrop = await page.evaluate(() => getComputedStyle(document.querySelector('[data-skin="freelanceDuo"] .skin-icon')).backgroundImage.includes("sam_max_duo_fixed_hd.png"));
  assert(freelanceDuoUsesFixedCrop, "Sam and Max/Freelance Duo picker is still using the bad sliced atlas cell");
  await page.click('[data-skin="freelanceDuo"]');
  const pickedDuoSkin = await page.evaluate(() => window.__MONKEY_TIDE_DEBUG());
  assert(pickedDuoSkin.playerSkin === "freelanceDuo" && pickedDuoSkin.playerSkinAnimated === true && pickedDuoSkin.playerSkinDuoWalkAsset === true, `Sam and Max/Freelance Duo runtime is not using the walk animation sheet: ${JSON.stringify(pickedDuoSkin)}`);
  assert(pickedDuoSkin.playerSkinDuoWalkFrames.frames === 8 && pickedDuoSkin.playerSkinDuoWalkFrames.w === 384 && pickedDuoSkin.playerSkinDuoWalkFrames.h === 512, `Sam and Max/Freelance Duo walk frames are misconfigured: ${JSON.stringify(pickedDuoSkin.playerSkinDuoWalkFrames)}`);
  const duoWalkProbe = await page.evaluate(async () => {
    const img = new Image();
    img.src = "assets/sprites/sam_max_duo_walk_imagen_hd.webp?alpha-clean";
    await img.decode();
    const frameW = 384;
    const frameH = 512;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const frames = [];
    for (let frame = 0; frame < 8; frame += 1) {
      const data = ctx.getImageData(frame % 4 * frameW, Math.floor(frame / 4) * frameH, frameW, frameH).data;
      let edgeAlpha = 0;
      let visible = 0;
      let sampleHash = 0;
      for (let y = 0; y < frameH; y += 1) {
        for (let x = 0; x < frameW; x += 1) {
          const index = (y * frameW + x) * 4;
          const alpha = data[index + 3];
          if (alpha > 8) {
            visible += 1;
            if (x === 0 || y === 0 || x === frameW - 1 || y === frameH - 1) edgeAlpha += 1;
          }
          if (x % 17 === 0 && y % 19 === 0) sampleHash = (sampleHash + data[index] * 3 + data[index + 1] * 5 + data[index + 2] * 7 + alpha * 11) % 1000003;
        }
      }
      frames.push({ frame, edgeAlpha, visible, sampleHash });
    }
    return { size: [canvas.width, canvas.height], frames };
  });
  assert(duoWalkProbe.size[0] === 1536 && duoWalkProbe.size[1] === 1024, `Sam and Max/Freelance Duo walk sheet has the wrong dimensions: ${JSON.stringify(duoWalkProbe)}`);
  assert(duoWalkProbe.frames.every((frame) => frame.edgeAlpha === 0 && frame.visible > 40000), `Sam and Max/Freelance Duo walk frames are still sliced: ${JSON.stringify(duoWalkProbe)}`);
  assert(new Set(duoWalkProbe.frames.map((frame) => frame.sampleHash)).size >= 4, `Sam and Max/Freelance Duo walk frames do not vary enough: ${JSON.stringify(duoWalkProbe)}`);
  await page.click('[data-skin="curseMonkey"]');
  const pickedSkin = await page.evaluate(() => document.querySelector('[data-skin="curseMonkey"]')?.getAttribute("aria-checked"));
  assert(pickedSkin === "true", `Skin picker did not select curseMonkey: ${pickedSkin}`);
  const mapUi = await page.evaluate(() => Array.from(document.querySelectorAll("#mapPicker [data-map]")).map((button) => ({
    id: button.dataset.map,
    checked: button.getAttribute("aria-checked") === "true",
    locked: button.disabled,
    label: button.textContent.trim(),
  })));
  assert(mapUi.length >= 4 && mapUi.filter((map) => !map.locked).length >= 2, `Map picker is missing variants or default unlocks: ${JSON.stringify(mapUi)}`);
  await page.click('[data-map="moonlitLagoon"]');
  const pickedMap = await page.evaluate(() => document.querySelector('[data-map="moonlitLagoon"]')?.getAttribute("aria-checked"));
  assert(pickedMap === "true", `Map picker did not select moonlitLagoon: ${pickedMap}`);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    window.__MONKEY_TIDE_TEST_FULLSCREEN_REQUESTED = false;
    window.__MONKEY_TIDE_TEST_ORIENTATION_LOCKS = [];
    document.documentElement.requestFullscreen = () => {
      window.__MONKEY_TIDE_TEST_FULLSCREEN_REQUESTED = true;
      return Promise.resolve();
    };
    try {
      Object.defineProperty(document, "fullscreenEnabled", { configurable: true, get: () => true });
    } catch {}
    const lock = async (mode) => window.__MONKEY_TIDE_TEST_ORIENTATION_LOCKS.push(mode);
    if (!screen.orientation) {
      Object.defineProperty(screen, "orientation", {
        configurable: true,
        value: { type: "portrait-primary", lock },
      });
    } else {
      try {
        Object.defineProperty(screen.orientation, "lock", { configurable: true, value: lock });
      } catch {
        screen.orientation.lock = lock;
      }
    }
  });
  await page.click("#quickButton");
  await page.waitForTimeout(500);
  const mobileStartDisplay = await page.evaluate(() => ({
    debug: window.__MONKEY_TIDE_DEBUG(),
    fullscreenRequested: window.__MONKEY_TIDE_TEST_FULLSCREEN_REQUESTED,
    orientationLocks: window.__MONKEY_TIDE_TEST_ORIENTATION_LOCKS,
  }));
  assert(mobileStartDisplay.debug.phase === "playing", `Mobile quick start did not enter gameplay: ${JSON.stringify(mobileStartDisplay)}`);
  assert(mobileStartDisplay.fullscreenRequested === true, `Mobile start did not request fullscreen: ${JSON.stringify(mobileStartDisplay)}`);
  assert(mobileStartDisplay.debug.mobileDisplay.requested === true && mobileStartDisplay.debug.mobileDisplay.orientationPreference === "portrait-primary", `Mobile start should prefer portrait fullscreen: ${JSON.stringify(mobileStartDisplay.debug.mobileDisplay)}`);
  assert(mobileStartDisplay.orientationLocks.some((mode) => String(mode).startsWith("portrait")) && !mobileStartDisplay.orientationLocks.includes("landscape"), `Mobile start requested the wrong orientation: ${JSON.stringify(mobileStartDisplay)}`);
  assert(mobileStartDisplay.debug.performance.mobile === true && mobileStartDisplay.debug.performance.dpr <= 1.01, `Mobile DPR guardrail is too high: ${JSON.stringify(mobileStartDisplay.debug.performance)}`);
  assert(mobileStartDisplay.debug.performance.enemyCap <= 125 && mobileStartDisplay.debug.performance.textCap <= 18 && mobileStartDisplay.debug.performance.lowFx === true, `Mobile performance caps missing: ${JSON.stringify(mobileStartDisplay.debug.performance)}`);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => {
    window.__MONKEY_TIDE_TEST_ORIENTATION_LOCKS = [];
    try {
      Object.defineProperty(screen.orientation, "type", { configurable: true, get: () => "landscape-primary" });
    } catch {}
  });
  await page.click("#fullscreenButton");
  await page.waitForTimeout(100);
  const mobileLandscapeDisplay = await page.evaluate(() => ({
    debug: window.__MONKEY_TIDE_DEBUG(),
    orientationLocks: window.__MONKEY_TIDE_TEST_ORIENTATION_LOCKS,
  }));
  assert(mobileLandscapeDisplay.debug.mobileDisplay.orientationPreference === "landscape-primary", `Landscape mobile should prefer landscape fullscreen: ${JSON.stringify(mobileLandscapeDisplay.debug.mobileDisplay)}`);
  assert(mobileLandscapeDisplay.orientationLocks.some((mode) => String(mode).startsWith("landscape")) && !mobileLandscapeDisplay.orientationLocks.some((mode) => String(mode).startsWith("portrait")), `Landscape mobile requested the wrong orientation: ${JSON.stringify(mobileLandscapeDisplay)}`);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(100);
  const debug = await page.evaluate(() => window.__MONKEY_TIDE_STEP(8));
  assert(debug.phase === "playing" || debug.phase === "levelup", `Unexpected phase ${debug.phase}`);
  assert(debug.enemies > 0, `No enemies spawned: ${JSON.stringify(debug)}`);
  assert(debug.scene.zoom <= 0.58, `Desktop camera is not zoomed out enough: ${JSON.stringify(debug.scene)}`);
  assert(debug.world.repeatable === true && debug.world.width >= 1000000 && debug.world.activePropChunks > 0, `World is still behaving like a bounded arena: ${JSON.stringify(debug.world)}`);
  assert(debug.world.backgroundSeamBleed >= 48 && debug.world.backgroundSourceInset >= 32, `Map background tiles do not hide seams aggressively enough: ${JSON.stringify(debug.world)}`);
  assert(debug.world.immersivePropSpawning === true && debug.world.recentVisiblePropSpawns === 0, `Runtime props can still pop into view: ${JSON.stringify(debug.world)}`);
  assert(debug.performance.enemyCap <= 230 && debug.performance.dpr <= 1.75, `Desktop performance guardrails missing: ${JSON.stringify(debug.performance)}`);
  assert(debug.playerSkin === "curseMonkey" && debug.player.skin === "curseMonkey", `Selected player skin did not reach runtime: ${JSON.stringify(debug)}`);
  assert(debug.playerSkinAsset === true && debug.preloadedAssetKeys.includes("playerSkins"), `Player skin atlas is not preloaded: ${JSON.stringify(debug)}`);
  assert(debug.playerSkinAnimationAsset === true && debug.preloadedAssetKeys.includes("playerSkinWalks"), `Player walkcycle atlas is not preloaded: ${JSON.stringify(debug)}`);
  assert(debug.playerSkinSelectAsset === true && debug.preloadedAssetKeys.includes("playerSkinSelect"), `Player selection atlas is not preloaded: ${JSON.stringify(debug)}`);
  assert(debug.playerSkinFixedDuoAsset === true && debug.preloadedAssetKeys.includes("samMaxDuo"), `Fixed Sam and Max duo asset is not preloaded: ${JSON.stringify(debug)}`);
  assert(debug.playerSkinAnimated === true && debug.playerSkinAnimationFrames.cols === 8 && debug.playerSkinAnimationFrames.rows === 6, `Selected player skin is not using the animation frameset: ${JSON.stringify(debug)}`);
  assert(debug.playerSkinTypes.length >= 7 && debug.playerSkinTypes.includes("dhampirHunter") && debug.playerSkinTypes.includes("starFarmboy"), `Player skin archetypes missing: ${JSON.stringify(debug)}`);
  const starFarmboySlice = await page.evaluate(async () => {
    const img = new Image();
    img.src = "assets/sprites/player_skin_walkcycles_imagen_hd.webp?slice-guard";
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const row = 4;
    const cell = 256;
    const counts = [];
    for (let col = 0; col < 8; col += 1) {
      const data = ctx.getImageData(col * cell, row * cell + 200, cell, 56).data;
      let pixels = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 48) pixels += 1;
      }
      counts.push(pixels);
    }
    return counts;
  });
  assert(starFarmboySlice.every((count) => count <= 8), `Skywalker/starFarmboy walk row has lower stray pixels: ${JSON.stringify(starFarmboySlice)}`);
  assert(debug.weapons.cutlass >= 1, "Cutlass weapon missing");
  assert(typeof debug.speech.supported === "boolean", `Speech debug missing: ${JSON.stringify(debug)}`);
  assert(debug.speech.muted === false, `Speech should follow audio mute state: ${JSON.stringify(debug)}`);
  assert(debug.map.selected === "moonlitLagoon" && debug.map.variants.length >= 4, `Selected map did not reach runtime: ${JSON.stringify(debug.map)}`);
  assert(debug.map.cleanSandBackground === true, `Default sand background still points at the old puddle texture: ${JSON.stringify(debug.map)}`);
  assert(debug.map.selectedBackground === "mapMoonlitLagoon", `Selected map did not get its unique background: ${JSON.stringify(debug.map)}`);
  assert(Object.values(debug.map.backgrounds).filter(Boolean).length >= 4 && new Set(Object.values(debug.map.backgrounds)).size >= 4, `Map backgrounds are not varied: ${JSON.stringify(debug.map)}`);
  assert(Object.values(debug.map.backgrounds).every((key) => debug.preloadedAssetKeys.includes(key)), `Map backgrounds are not preloaded: ${JSON.stringify(debug.map)}`);
  assert(Object.values(debug.map.musicProfiles).some((profile) => profile.mainKey === "bgmCaper") && Object.values(debug.map.musicProfiles).some((profile) => profile.mainKey === "bgmShoreline"), `Map BGM profiles are not varied: ${JSON.stringify(debug.map.musicProfiles)}`);
  assert(debug.audio.music.main >= 0.6, `Main music config should be prominent: ${JSON.stringify(debug)}`);
  assert(debug.audio.music.rush >= 0.48 && debug.audio.music.rushStart <= 125, `Rush music should enter earlier and louder: ${JSON.stringify(debug)}`);
  assert(debug.audio.activeTrack === "rush" && debug.audio.rushVolume >= 0.48, `Quick wave should hand off to rush BGM: ${JSON.stringify(debug.audio)}`);
  assert(debug.audio.overlapSafe === true && !(debug.audio.tracksPlaying.main && debug.audio.tracksPlaying.rush), `BGM tracks are overlapping: ${JSON.stringify(debug.audio)}`);
  assert(debug.audio.music.trackKeys.rush === "bgmCaper" && debug.audio.sources.bgmCaper.includes("coconut-caper-loop.mp3"), `Selected map did not switch to its BGM profile: ${JSON.stringify(debug.audio)}`);
  assert(debug.audio.sources.bgmMain.includes("crimson-galleon.mp3") && debug.audio.sources.bgmRush.includes("gargoyle-chapel-run.mp3") && debug.audio.sources.bgmShoreline.includes("shoreline-rum-riddle.mp3"), `Driving BGM tracks are not selected: ${JSON.stringify(debug.audio)}`);
  assert(debug.audio.musicPreload.ready && debug.audio.musicPreload.loaded === debug.audio.musicPreload.total && debug.audio.musicPreload.decoded === debug.audio.musicPreload.total && debug.audio.musicPreload.failed.length === 0, `BGM was not fully preloaded before start: ${JSON.stringify(debug.audio.musicPreload)}`);
  assert(debug.audio.sfx.pickup <= 0.025 && debug.audio.sfx.gate <= 0.025, `SFX should sit under music: ${JSON.stringify(debug)}`);
  assert(debug.audio.sfx.downloadBossWarning <= 0.05 && Math.max(debug.audio.mainVolume, debug.audio.rushVolume) > debug.audio.sfx.downloadBossWarning * 10, `Downloaded SFX should remain under music: ${JSON.stringify(debug)}`);
  assert(debug.audio.sfxLocalDownloads && debug.audio.sources.pickup.includes("/from-downloads/") && debug.audio.sources.confirm.includes("/from-downloads/"), `Base SFX are not using Downloads assets: ${JSON.stringify(debug)}`);
  assert(debug.stats.speed >= 250 && debug.stats.magnet >= 260, `Flow balance is too sluggish: ${JSON.stringify(debug)}`);
  assert(debug.balance.bossHpMult >= 2.6 && debug.balance.normalSpawnIntensity >= 1.2, `Difficulty did not get sharper: ${JSON.stringify(debug)}`);
  assert(debug.balance.bossHpMult <= 2.75 && debug.balance.normalSpawnIntensity <= 1.28, `Difficulty balance is too punishing: ${JSON.stringify(debug)}`);
  assert(debug.balance.firstBossAt <= 150 && debug.balance.rangedPressureAt <= 65 && debug.balance.pressureWaveFirstAt <= 30, `Pressure events arrive too late: ${JSON.stringify(debug)}`);
  assert(debug.engagement.pressureWaves >= 1 && debug.engagement.pressureWave >= 1, `Pressure waves did not fire: ${JSON.stringify(debug.engagement)}`);
  assert(debug.enemyRoster.liveRosterIsMonsterOnly === true, `Live enemy roster still includes human NPCs: ${JSON.stringify(debug.enemyRoster)}`);
  assert(debug.enemyRoster.activeBossCycle.every((id) => !debug.enemyRoster.humanNpcTypes.includes(id)), `Live boss cycle still includes human NPCs: ${JSON.stringify(debug.enemyRoster)}`);
  assert(debug.loading.loaded === debug.loading.total && debug.loading.total === debug.preloadedAssetKeys.length + debug.audio.musicPreload.total, `Loading progress is inaccurate: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.gothicEnemies && debug.crossoverAssets.gothicItems && debug.crossoverAssets.gothicProps, `Gothic crossover sheets missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.gothicEnemyTypes.length >= 3, `Gothic enemy types missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.gothicItemTypes.includes("bloodRose"), `Blood rose upgrade icon missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.spectralCaptain, `Spectral captain sheet missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.threeHeadedMonkey && debug.preloadedAssetKeys.includes("threeHeadedMonkey"), `Three-headed monkey boss asset missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.blackbeard && debug.preloadedAssetKeys.includes("blackbeard"), `Blackbeard boss asset missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.threeHeadedMonkeyAnim && debug.preloadedAssetKeys.includes("threeHeadedMonkeyAnim"), `Three-headed monkey animation sheet missing: ${JSON.stringify(debug.crossoverAssets)}`);
  assert(debug.crossoverAssets.blackbeardAnim && debug.preloadedAssetKeys.includes("blackbeardAnim"), `Blackbeard animation sheet missing: ${JSON.stringify(debug.crossoverAssets)}`);
  assert(debug.crossoverAssets.bossAnimationFrames.threeHeadedMonkey.frames === 8 && debug.crossoverAssets.bossAnimationFrames.blackbeard.frames === 8, `Boss animation framesets should expose 8 frames: ${JSON.stringify(debug.crossoverAssets.bossAnimationFrames)}`);
  const bossAnimAlphaProbe = await page.evaluate(async () => {
    const assets = [
      { src: "assets/sprites/bosses/three_headed_monkey_anim_imagen_hd.webp?alpha-clean", w: 706, h: 720, frames: 8 },
      { src: "assets/sprites/bosses/blackbeard_anim_imagen_hd.webp?alpha-clean", w: 758, h: 900, frames: 8 },
    ];
    const results = [];
    for (const asset of assets) {
      const img = new Image();
      img.src = asset.src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const frameResults = [];
      for (let frame = 0; frame < asset.frames; frame += 1) {
        const x0 = frame % 4 * asset.w;
        const y0 = Math.floor(frame / 4) * asset.h;
        const data = ctx.getImageData(x0, y0, asset.w, asset.h).data;
        let edgeAlpha = 0;
        let visible = 0;
        for (let y = 0; y < asset.h; y += 1) {
          for (let x = 0; x < asset.w; x += 1) {
            const alpha = data[(y * asset.w + x) * 4 + 3];
            if (alpha > 8) {
              visible += 1;
              if (x === 0 || y === 0 || x === asset.w - 1 || y === asset.h - 1) edgeAlpha += 1;
            }
          }
        }
        frameResults.push({ frame, edgeAlpha, visible });
      }
      results.push({ src: asset.src, size: [canvas.width, canvas.height], frameResults });
    }
    return results;
  });
  assert(bossAnimAlphaProbe.every((asset) => asset.frameResults.every((frame) => frame.edgeAlpha === 0 && frame.visible > 30000)), `Boss animation sheets still look sliced: ${JSON.stringify(bossAnimAlphaProbe)}`);
  assert(debug.crossoverAssets.bossTypes.includes("spectralCaptain") && debug.crossoverAssets.bossTypes.includes("coralBrute") && debug.crossoverAssets.bossTypes.includes("threeHeadedMonkey") && debug.crossoverAssets.bossTypes.includes("blackbeard"), `Boss roster missing: ${JSON.stringify(debug)}`);
  assert(debug.extraAssets.extraEnemies && debug.extraAssets.extraItems, `Extra Imagen sheets missing: ${JSON.stringify(debug)}`);
  assert(debug.extraAssets.extraEnemyTypes.length >= 8 && debug.extraAssets.extraEnemyTypes.includes("tideWitch") && debug.extraAssets.extraEnemyTypes.includes("stormDuelist"), `Extra enemies missing: ${JSON.stringify(debug)}`);
  assert(debug.extraAssets.extraItemTypes.length >= 8 && debug.extraAssets.extraItemTypes.includes("cursedPearl") && debug.extraAssets.extraItemTypes.includes("grogLantern"), `Extra item icons missing: ${JSON.stringify(debug)}`);
  assert(debug.extraAssets.extraUpgradeTypes.length >= 8 && debug.extraAssets.extraUpgradeTypes.includes("powderPouch"), `Extra item upgrades missing: ${JSON.stringify(debug)}`);
  assert(debug.preloadedAssetKeys.includes("extraEnemies") && debug.preloadedAssetKeys.includes("extraItems"), `Extra sheets are not preloaded: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.beachProps, `Beach exploration prop sheet missing: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.beachPropTypes.includes("beachHut") && debug.explorationAssets.beachPropTypes.includes("boatWreck"), `Explorable landmarks missing: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.beachPropTypes.includes("clearPuddle") && debug.explorationAssets.beachPropTypes.includes("hedgeCluster"), `HD puddles or hedges missing: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.visiblePuddles >= 8, `HD puddle decals are not visible enough in the generated chunks: ${JSON.stringify(debug.explorationAssets)}`);
  assert(debug.explorationAssets.beachPropTypes.includes("conchShrine") && debug.explorationAssets.beachPropTypes.includes("buriedTreasure"), `New exploration ideas missing: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.openTreasureUsesDedicatedAsset === true, `Opened chests should use the Imagen open-chest asset: ${JSON.stringify(debug.explorationAssets)}`);
  assert(debug.explorationAssets.discoveredPropsStayPainted === true, `Discovered huts/bushes/chests should not be greyed out: ${JSON.stringify(debug.explorationAssets)}`);
  assert(debug.explorationAssets.interactiveProps >= 3, `Not enough explorable props: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.beachPropAssetKeys.every((key) => debug.preloadedAssetKeys.includes(key)), `Clean beach props are not preloaded: ${JSON.stringify(debug)}`);
  assert(!debug.preloadedAssetKeys.includes("beachProps"), `Old sliced beach atlas is still preloaded: ${JSON.stringify(debug)}`);
  assert(debug.preloadedAssetKeys.includes("projectileFx"), `Projectile FX not preloaded: ${JSON.stringify(debug)}`);
  assert(debug.preloadedAssetKeys.includes("playerEffects"), `Player raster effect FX not preloaded: ${JSON.stringify(debug)}`);
  assert(!debug.preloadedAssetKeys.includes("beach") && !debug.preloadedAssetKeys.includes("jungle") && !debug.preloadedAssetKeys.includes("topdownBeach"), `Unused heavy backgrounds are still preloaded: ${JSON.stringify(debug)}`);
  assert(debug.combatAssets.projectileFx, `Projectile FX sheet missing: ${JSON.stringify(debug)}`);
  assert(debug.combatAssets.projectileFxTypes.includes("coconutBoomerang") && debug.combatAssets.projectileFxTypes.includes("monkeyCurseOrb"), `Projectile FX types missing: ${JSON.stringify(debug)}`);
  assert(debug.combatAssets.playerEffects, `Player raster effect sheet missing: ${JSON.stringify(debug)}`);
  assert(debug.combatAssets.playerEffectTypes.includes("ropeAura") && debug.combatAssets.playerEffectTypes.includes("compassBeam"), `Raster player effect types missing: ${JSON.stringify(debug)}`);
  assert(debug.combatAssets.weaponEvolutionFx && debug.combatAssets.weaponEvolutionFxTypes.includes("fusion3"), `Weapon evolution FX frameset missing: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.weaponEvolution?.frames?.cols === 4 && debug.weaponEvolution?.frames?.rows === 4, `Weapon evolution sheet should expose 4x4 frames: ${JSON.stringify(debug.weaponEvolution)}`);
  assert(debug.combatAssets.threeHeadedMonkeyVolley === true, `Three-headed monkey should fire a three-shot curse volley: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.combatAssets.blackbeardBroadside === true, `Blackbeard should fire a three-shot cannon broadside: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.upgradeIcons.coconut === "coconutBoomerang" && debug.weaponLoadoutIcons.coconut === "coconutBoomerang", `Coconut boomerang preview still uses the wrong icon: ${JSON.stringify(debug)}`);
  assert(debug.upgradeIcons.rope === "ropeRing" && debug.weaponLoadoutIcons.rope === "ropeRing", `Rope ring preview still uses the old rope icon: ${JSON.stringify(debug)}`);
  assert(debug.uiIconSources.projectileFxIcons === true, `Projectile FX icons are not available to the UI: ${JSON.stringify(debug)}`);
  assert(debug.ropeVisual.renderMode === "ropeWardSprites" && debug.ropeVisual.sprite === "ropeRing", `Rope ring still uses the old rotating aura mode: ${JSON.stringify(debug)}`);
  assert(debug.engagement?.streak?.nextCache >= 18 && debug.engagement?.streak?.caches >= 0, `Streak treasure loop missing: ${JSON.stringify(debug)}`);
  assert(debug.obstacles.blockingProps >= 20, `Massive blocking obstacles are missing: ${JSON.stringify(debug.obstacles)}`);
  assert(debug.obstacles.blockingPropTypes.includes("beachHut") && debug.obstacles.blockingPropTypes.includes("boatWreck"), `Huts and wrecks are not blocking: ${JSON.stringify(debug.obstacles)}`);
  assert(debug.obstacles.blockingPropTypes.includes("hedgeCluster") || debug.obstacles.blockingPropTypes.includes("palmHedge"), `Hedge blockers are missing: ${JSON.stringify(debug.obstacles)}`);
  assert(debug.obstacles.passThroughEnemyTypes.includes("cryptBat") && debug.obstacles.passThroughEnemyTypes.includes("gargoyle"), `Flying enemies should ignore obstacles: ${JSON.stringify(debug.obstacles)}`);
  assert(debug.obstacles.passThroughEnemyTypes.includes("lanternWraith") && debug.obstacles.passThroughEnemyTypes.includes("spectralCaptain"), `Ghost enemies should phase through obstacles: ${JSON.stringify(debug.obstacles)}`);

  const obstacleProbe = await page.evaluate(() => window.__MONKEY_TIDE_OBSTACLE_PROBE());
  assert(obstacleProbe.playerBlocked && obstacleProbe.playerStayedOnApproachSide, `Player did not route around blocker: ${JSON.stringify(obstacleProbe)}`);
  assert(obstacleProbe.groundPushed, `Ground enemy was not pushed out of blocker: ${JSON.stringify(obstacleProbe)}`);
  assert(obstacleProbe.ghostCanPass, `Ghost/flying pass-through rule failed: ${JSON.stringify(obstacleProbe)}`);

  const propProbe = await page.evaluate(() => window.__MONKEY_TIDE_PROP_VISUAL_PROBE());
  assert(propProbe.props.some((prop) => prop.icon === "openTreasureChest" && prop.image === "beachOpenTreasure"), `Open chest probe did not use the Imagen asset: ${JSON.stringify(propProbe)}`);
  assert(propProbe.props.filter((prop) => prop.discovered).every((prop) => prop.alpha >= 0.7), `Discovered props are still being greyed out: ${JSON.stringify(propProbe)}`);

  const streakProbe = await page.evaluate(() => window.__MONKEY_TIDE_STREAK_CACHE_PROBE());
  assert(streakProbe.cache?.hasFade && !streakProbe.cache.inSightline && streakProbe.cache.distance >= 900, `Streak cache spawned inside the visible playfield: ${JSON.stringify(streakProbe)}`);

  const monkeyProbe = await page.evaluate(() => window.__MONKEY_TIDE_THREE_MONKEY_PROBE());
  assert(monkeyProbe.assetLoaded && monkeyProbe.boss?.id === "threeHeadedMonkey", `Three-headed monkey boss did not spawn: ${JSON.stringify(monkeyProbe)}`);
  assert(monkeyProbe.animationLoaded && monkeyProbe.animationFrames.frames === 8, `Three-headed monkey animation probe missing: ${JSON.stringify(monkeyProbe)}`);
  assert(monkeyProbe.profile?.count === 3 && monkeyProbe.monkeyProjectiles >= 3, `Three-headed monkey volley did not fire: ${JSON.stringify(monkeyProbe)}`);

  const blackbeardProbe = await page.evaluate(() => window.__MONKEY_TIDE_BLACKBEARD_PROBE());
  assert(blackbeardProbe.assetLoaded && blackbeardProbe.boss?.id === "blackbeard", `Blackbeard boss did not spawn: ${JSON.stringify(blackbeardProbe)}`);
  assert(blackbeardProbe.animationLoaded && blackbeardProbe.animationFrames.frames === 8, `Blackbeard animation probe missing: ${JSON.stringify(blackbeardProbe)}`);
  assert(blackbeardProbe.profile?.count === 3 && blackbeardProbe.cannonballs >= 3, `Blackbeard broadside did not fire: ${JSON.stringify(blackbeardProbe)}`);

  const newEnemyProbe = await page.evaluate(() => window.__MONKEY_TIDE_NEW_ENEMY_PROBE());
  assert(newEnemyProbe.assetLoaded && newEnemyProbe.animationFrames.frames === 8, `New enemy animation sheet missing: ${JSON.stringify(newEnemyProbe)}`);
  assert(["tideTentacle", "reefSquid", "cactusStack"].every((id) => newEnemyProbe.spawned.includes(id)), `New enemy trio did not spawn: ${JSON.stringify(newEnemyProbe)}`);

  const weaponEvolutionProbe = await page.evaluate(() => window.__MONKEY_TIDE_WEAPON_EVOLUTION_PROBE());
  assert(weaponEvolutionProbe.assetLoaded && weaponEvolutionProbe.slash?.blades === 5, `Fivefold cutlass animation did not activate: ${JSON.stringify(weaponEvolutionProbe)}`);
  assert(weaponEvolutionProbe.tornado?.fused === true && weaponEvolutionProbe.debug.weaponEvolution.saberTornadoFusionReady, `Saber tornado fusion did not activate: ${JSON.stringify(weaponEvolutionProbe)}`);

  const progressProbe = await page.evaluate(() => window.__MONKEY_TIDE_PROGRESS_PROBE());
  assert(progressProbe.powerups.types.length >= 4 && progressProbe.powerups.active.length >= 3, `Power-up system did not activate: ${JSON.stringify(progressProbe.powerups)}`);
  assert(progressProbe.powerups.randomDropChance <= 0.004 && progressProbe.powerups.streakDropEvery >= 40, `Power-up drops are too frequent: ${JSON.stringify(progressProbe.powerups)}`);
  assert(progressProbe.powerups.combatCooldown >= 40 && progressProbe.powerups.magnetRange <= 90, `Power-up pickups are too intrusive: ${JSON.stringify(progressProbe.powerups)}`);
  assert(progressProbe.levelFlow.reducedInterruptions && progressProbe.levelFlow.choiceLevels[2] === 10, `Level-up interruptions were not reduced: ${JSON.stringify(progressProbe.levelFlow)}`);
  assert(progressProbe.progression.achievements.powerCollector && progressProbe.progression.achievements.wreckDiver && progressProbe.progression.achievements.nightRaid, `Progress achievements did not unlock: ${JSON.stringify(progressProbe.progression)}`);
  assert(progressProbe.map.unlocked.includes("gothicCove") && progressProbe.map.unlocked.includes("treasureAtoll"), `Unlockable maps did not unlock: ${JSON.stringify(progressProbe.map)}`);
  assert(progressProbe.progression.unlockedRelics.includes("Grog-Stiefel") && progressProbe.progression.unlockedRelics.includes("Flutkompass"), `Unlockable relics missing: ${JSON.stringify(progressProbe.progression)}`);

  const upgradeProbe = await page.evaluate(() => {
    if (window.__MONKEY_TIDE_DEBUG().phase !== "levelup") window.__MONKEY_TIDE_FORCE_LEVELUP();
    const before = window.__MONKEY_TIDE_DEBUG();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    const selected = document.querySelector(".upgrade-card.selected")?.dataset.upgradeIndex;
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    return { before, selected, after: window.__MONKEY_TIDE_DEBUG() };
  });
  assert(upgradeProbe.before.phase === "levelup", `Forced level-up did not open upgrades: ${JSON.stringify(upgradeProbe)}`);
  assert(upgradeProbe.selected === "1", `Keyboard did not move upgrade focus: ${JSON.stringify(upgradeProbe)}`);
  assert(upgradeProbe.after.phase === "playing", `Enter did not choose upgrade: ${JSON.stringify(upgradeProbe)}`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const touchProbe = await page.evaluate(() => {
    if (window.__MONKEY_TIDE_DEBUG().phase === "levelup") document.querySelector(".upgrade-card")?.click();
    const before = window.__MONKEY_TIDE_DEBUG();
    const target = document.elementFromPoint(82, 570) || document.getElementById("gameCanvas");
    target.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      pointerId: 77,
      pointerType: "touch",
      clientX: 82,
      clientY: 570,
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true,
      cancelable: true,
      pointerId: 77,
      pointerType: "touch",
      clientX: 82,
      clientY: 650,
    }));
    const active = window.__MONKEY_TIDE_DEBUG();
    window.__MONKEY_TIDE_STEP(0.35);
    const moved = window.__MONKEY_TIDE_DEBUG();
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true,
      cancelable: true,
      pointerId: 77,
      pointerType: "touch",
      clientX: 82,
      clientY: 650,
    }));
    const after = window.__MONKEY_TIDE_DEBUG();
    const rightTarget = document.elementFromPoint(330, 420) || document.getElementById("gameCanvas");
    rightTarget.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      pointerId: 78,
      pointerType: "touch",
      clientX: 330,
      clientY: 420,
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true,
      cancelable: true,
      pointerId: 78,
      pointerType: "touch",
      clientX: 260,
      clientY: 420,
    }));
    const rightActive = window.__MONKEY_TIDE_DEBUG();
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true,
      cancelable: true,
      pointerId: 78,
      pointerType: "touch",
      clientX: 260,
      clientY: 420,
    }));
    return { before, active, moved, after, rightActive, rightAfter: window.__MONKEY_TIDE_DEBUG() };
  });
  assert(touchProbe.active.pointer.active === true, `Mobile thumbstick did not activate: ${JSON.stringify(touchProbe)}`);
  assert(touchProbe.active.pointer.dy > 0.6, `Mobile thumbstick did not point down: ${JSON.stringify(touchProbe)}`);
  assert(touchProbe.moved.player.y > touchProbe.before.player.y + 10, `Mobile thumbstick did not move player: ${JSON.stringify(touchProbe)}`);
  assert(touchProbe.moved.scene.zoom <= 0.39, `Mobile camera is not zoomed out: ${JSON.stringify(touchProbe)}`);
  assert(touchProbe.after.pointer.active === false, `Mobile thumbstick did not reset: ${JSON.stringify(touchProbe)}`);
  assert(touchProbe.rightActive.pointer.active === true, `Right-side thumbstick did not activate: ${JSON.stringify(touchProbe)}`);
  assert(touchProbe.rightActive.pointer.dx < -0.6, `Right-side thumbstick did not point left: ${JSON.stringify(touchProbe)}`);
  assert(touchProbe.rightAfter.pointer.active === false, `Right-side thumbstick did not reset: ${JSON.stringify(touchProbe)}`);

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(200);
  const landscapeUi = await page.evaluate(() => {
    const box = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
    };
    return {
      debug: window.__MONKEY_TIDE_DEBUG(),
      hud: box("#hud"),
      controls: box("#cornerControls"),
      loadout: box("#loadout"),
      dash: box("#dashButton"),
      fullscreenText: document.getElementById("fullscreenButton").textContent,
    };
  });
  assert(landscapeUi.debug.scene.zoom <= 0.36, `Landscape camera is not zoomed out: ${JSON.stringify(landscapeUi)}`);
  assert(landscapeUi.hud.width <= 360 && landscapeUi.hud.bottom <= 58, `Landscape HUD covers too much playfield: ${JSON.stringify(landscapeUi)}`);
  assert(landscapeUi.loadout.height <= 54, `Landscape loadout is too tall: ${JSON.stringify(landscapeUi)}`);
  assert(landscapeUi.dash.width <= 72 && landscapeUi.dash.height <= 72, `Landscape dash button is too large: ${JSON.stringify(landscapeUi)}`);
  assert(["FS", "MIN"].includes(landscapeUi.fullscreenText), `Fullscreen toggle missing: ${JSON.stringify(landscapeUi)}`);

  const probe = await page.evaluate(() => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    let alpha = 0;
    let checksum = 0;
    for (let i = 0; i < data.length; i += 128) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a > 0) alpha += 1;
      if (r + g + b > 60) lit += 1;
      checksum = (checksum + r * 3 + g * 5 + b * 7 + a * 11 + i) % 1000000007;
    }
    return { lit, alpha, checksum };
  });
  assert(probe.alpha > 1000 && probe.lit > 1000, `Canvas appears blank: ${JSON.stringify(probe)}`);
  assert(consoleErrors.length === 0, `Console errors:\n${consoleErrors.join("\n")}`);
  assert(pageErrors.length === 0, `Page errors:\n${pageErrors.join("\n")}`);
  assert(badResponses.length === 0, `Bad responses:\n${badResponses.join("\n")}`);

  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 5000))]);
  await closeServer(server);
  console.log(`smoke ok ${url}`);
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
