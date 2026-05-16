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
  await new Promise((resolve) => server.close(() => resolve()));
}

async function run() {
  [
    "index.html",
    "style.css",
    "game.js",
    "assets/backgrounds/topdown_beach_repeatable_hd.png",
    "assets/sprites/characters_imagen_hd_sheet.webp",
    "assets/sprites/player_skins_imagen_hd.webp",
    "assets/sprites/scene_items_imagen_hd_sheet.webp",
    "assets/sprites/new_sprites_imagen_hd.webp",
    "assets/sprites/gothic_enemies_hd_sheet.webp",
    "assets/sprites/gothic_items_hd_sheet.webp",
    "assets/sprites/gothic_props_hd_sheet.webp",
    "assets/sprites/spectral_captain_hd_sheet.webp",
    "assets/sprites/beach-props-v2/clear_puddle.webp",
    "assets/sprites/beach-props-v2/tide_puddle.webp",
    "assets/sprites/beach-props-v2/hedge_cluster.webp",
    "assets/sprites/beach-props-v2/palm_hedge.webp",
    "assets/sprites/beach-props-v2/buried_treasure.webp",
    "assets/sprites/beach-props-v2/conch_shrine.webp",
    "assets/sprites/beach-props-v2/beach_hut.webp",
    "assets/sprites/beach-props-v2/boat_wreck.webp",
    "assets/sprites/projectile_fx_imagen_hd.webp",
    "assets/audio/bgm/shoreline-rum-riddle.mp3",
    "assets/audio/bgm/coconut-caper-loop.mp3",
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
  const skinUi = await page.evaluate(() => Array.from(document.querySelectorAll("#skinPicker [data-skin]")).map((button) => ({
    id: button.dataset.skin,
    checked: button.getAttribute("aria-checked") === "true",
    label: button.textContent.trim(),
  })));
  assert(skinUi.length >= 7, `Player skin picker is missing options: ${JSON.stringify(skinUi)}`);
  assert(skinUi.some((skin) => skin.id === "curseMonkey") && skinUi.some((skin) => skin.id === "freelanceDuo"), `Requested alternate skins missing: ${JSON.stringify(skinUi)}`);
  await page.click('[data-skin="curseMonkey"]');
  const pickedSkin = await page.evaluate(() => document.querySelector('[data-skin="curseMonkey"]')?.getAttribute("aria-checked"));
  assert(pickedSkin === "true", `Skin picker did not select curseMonkey: ${pickedSkin}`);
  await page.evaluate(() => window.__MONKEY_TIDE_START());
  await page.waitForTimeout(500);
  const debug = await page.evaluate(() => window.__MONKEY_TIDE_STEP(8));
  assert(debug.phase === "playing" || debug.phase === "levelup", `Unexpected phase ${debug.phase}`);
  assert(debug.enemies > 0, `No enemies spawned: ${JSON.stringify(debug)}`);
  assert(debug.playerSkin === "curseMonkey" && debug.player.skin === "curseMonkey", `Selected player skin did not reach runtime: ${JSON.stringify(debug)}`);
  assert(debug.playerSkinAsset === true && debug.preloadedAssetKeys.includes("playerSkins"), `Player skin atlas is not preloaded: ${JSON.stringify(debug)}`);
  assert(debug.playerSkinTypes.length >= 7 && debug.playerSkinTypes.includes("dhampirHunter") && debug.playerSkinTypes.includes("starFarmboy"), `Player skin archetypes missing: ${JSON.stringify(debug)}`);
  assert(debug.weapons.cutlass >= 1, "Cutlass weapon missing");
  assert(typeof debug.speech.supported === "boolean", `Speech debug missing: ${JSON.stringify(debug)}`);
  assert(debug.speech.muted === false, `Speech should follow audio mute state: ${JSON.stringify(debug)}`);
  assert(debug.audio.mainVolume >= 0.5, `Main music should be prominent: ${JSON.stringify(debug)}`);
  assert(debug.audio.music.rush >= 0.4 && debug.audio.music.rushStart <= 190, `Rush music should enter earlier and louder: ${JSON.stringify(debug)}`);
  assert(debug.audio.sfx.pickup <= 0.025 && debug.audio.sfx.gate <= 0.025, `SFX should sit under music: ${JSON.stringify(debug)}`);
  assert(debug.audio.sfx.downloadBossWarning <= 0.05 && debug.audio.mainVolume > debug.audio.sfx.downloadBossWarning * 10, `Downloaded SFX should remain under music: ${JSON.stringify(debug)}`);
  assert(debug.audio.sources.pickup.includes("/from-downloads/") && debug.audio.sources.confirm.includes("/from-downloads/"), `Base SFX are not using Downloads assets: ${JSON.stringify(debug)}`);
  assert(debug.stats.speed >= 250 && debug.stats.magnet >= 260, `Flow balance is too sluggish: ${JSON.stringify(debug)}`);
  assert(debug.balance.bossHpMult >= 2.45 && debug.balance.normalSpawnIntensity >= 1.1, `Difficulty did not get sharper: ${JSON.stringify(debug)}`);
  assert(debug.balance.bossHpMult <= 2.65 && debug.balance.normalSpawnIntensity <= 1.18, `Difficulty balance is too punishing: ${JSON.stringify(debug)}`);
  assert(debug.balance.firstBossAt <= 190 && debug.balance.rangedPressureAt <= 95, `Pressure events arrive too late: ${JSON.stringify(debug)}`);
  assert(debug.loading.loaded === debug.loading.total && debug.loading.total === debug.preloadedAssetKeys.length, `Loading progress is inaccurate: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.gothicEnemies && debug.crossoverAssets.gothicItems && debug.crossoverAssets.gothicProps, `Gothic crossover sheets missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.gothicEnemyTypes.length >= 3, `Gothic enemy types missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.gothicItemTypes.includes("bloodRose"), `Blood rose upgrade icon missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.spectralCaptain, `Spectral captain sheet missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.bossTypes.includes("spectralCaptain"), `Spectral captain boss missing: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.beachProps, `Beach exploration prop sheet missing: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.beachPropTypes.includes("beachHut") && debug.explorationAssets.beachPropTypes.includes("boatWreck"), `Explorable landmarks missing: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.beachPropTypes.includes("clearPuddle") && debug.explorationAssets.beachPropTypes.includes("hedgeCluster"), `HD puddles or hedges missing: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.beachPropTypes.includes("conchShrine") && debug.explorationAssets.beachPropTypes.includes("buriedTreasure"), `New exploration ideas missing: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.interactiveProps >= 3, `Not enough explorable props: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.beachPropAssetKeys.every((key) => debug.preloadedAssetKeys.includes(key)), `Clean beach props are not preloaded: ${JSON.stringify(debug)}`);
  assert(!debug.preloadedAssetKeys.includes("beachProps"), `Old sliced beach atlas is still preloaded: ${JSON.stringify(debug)}`);
  assert(debug.preloadedAssetKeys.includes("projectileFx"), `Projectile FX not preloaded: ${JSON.stringify(debug)}`);
  assert(!debug.preloadedAssetKeys.includes("beach") && !debug.preloadedAssetKeys.includes("jungle") && !debug.preloadedAssetKeys.includes("topdownBeach"), `Unused heavy backgrounds are still preloaded: ${JSON.stringify(debug)}`);
  assert(debug.combatAssets.projectileFx, `Projectile FX sheet missing: ${JSON.stringify(debug)}`);
  assert(debug.combatAssets.projectileFxTypes.includes("coconutBoomerang") && debug.combatAssets.projectileFxTypes.includes("monkeyCurseOrb"), `Projectile FX types missing: ${JSON.stringify(debug)}`);

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
  assert(touchProbe.moved.scene.zoom <= 0.72, `Mobile camera is not zoomed out: ${JSON.stringify(touchProbe)}`);
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
  assert(landscapeUi.debug.scene.zoom <= 0.64, `Landscape camera is not zoomed out: ${JSON.stringify(landscapeUi)}`);
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

  await browser.close();
  await closeServer(server);
  console.log(`smoke ok ${url}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
