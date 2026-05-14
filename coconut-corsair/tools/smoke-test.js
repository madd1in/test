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
    return require(path.join(bundledNodeModules, "playwright"));
  }
}

async function closeServer(server) {
  if (typeof server.closeIdleConnections === "function") server.closeIdleConnections();
  if (typeof server.closeAllConnections === "function") server.closeAllConnections();
  await new Promise((resolve) => server.close(() => resolve()));
}

async function closeBrowser(browser) {
  let closed = false;
  const closePromise = browser.close()
    .then(() => { closed = true; })
    .catch(() => { closed = true; });
  await Promise.race([
    closePromise,
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);
  if (!closed && typeof browser.process === "function") {
    const proc = browser.process();
    if (proc && !proc.killed) proc.kill();
  }
}

function checkFiles() {
  [
    "assets/source/background_atlas_imagen_hd.png",
    "assets/source/backgrounds_single/harbor_single_imagen_hd.png",
    "assets/source/backgrounds_single/tavern_single_imagen_hd.png",
    "assets/source/backgrounds_single/jungle_single_imagen_hd.png",
    "assets/source/backgrounds_single/beach_single_imagen_hd.png",
    "assets/source/backgrounds_single/market_single_imagen_hd.png",
    "assets/source/backgrounds_single/observatory_single_imagen_hd.png",
    "assets/source/player_anim_atlas_imagen_key.png",
    "assets/source/npc_anim_atlas_imagen_key.png",
    "assets/source/keeper_moon_door_solid_sheet_source.png",
    "assets/source/npcs_market_observatory_imagen_sheet_source.png",
    "assets/source/npcs_market_observatory_normalized_sheet_source.png",
    "assets/source/observatory_props_imagen_hd_raw.png",
    "assets/source/mini_games_imagen_hd_raw.png",
    "assets/source/item_atlas_imagen_hd.png",
    "assets/backgrounds/harbor_imagen_hd.png",
    "assets/backgrounds/tavern_imagen_hd.png",
    "assets/backgrounds/jungle_imagen_hd.png",
    "assets/backgrounds/beach_imagen_hd.png",
    "assets/backgrounds/market_imagen_hd.png",
    "assets/backgrounds/observatory_imagen_hd.png",
    "assets/sprites/characters_imagen_hd_sheet.png",
    "assets/sprites/keeper_moon_door_solid_sheet.png",
    "assets/sprites/npcs_market_observatory_imagen_sheet.png",
    "assets/sprites/npcs_market_observatory_normalized_sheet.png",
    "assets/sprites/items_imagen_hd_sheet.png",
    "assets/sprites/scene_items_imagen_hd_sheet.png",
    "assets/sprites/interactive_props_sheet.png",
    "assets/sprites/observatory_imagen_props_hd_sheet.png",
    "assets/sprites/mini_games_imagen_hd_sheet.png",
    "assets/audio/bgm/moonlit-rum-islet.mp3",
    "assets/audio/bgm/tavern-tide.mp3",
    "assets/audio/bgm/tidewheel-cove.mp3",
    "assets/audio/bgm/shoreline-rum-riddle.mp3",
    "assets/audio/bgm/coconut-caper-loop.mp3",
    "assets/audio/pickup.wav",
    "assets/audio/gate.wav",
    "assets/audio/ui_confirm.wav",
    "assets/audio/chime.wav",
  ].forEach((rel) => {
    const file = path.join(root, rel);
    assert(fs.existsSync(file), `Missing ${rel}`);
    assert(fs.statSync(file).size > 1000, `${rel} looks empty`);
  });
}

async function run() {
  checkFiles();
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
    args: ["--autoplay-policy=no-user-gesture-required", "--allow-file-access-from-files"],
  });

  const page = await browser.newPage({ viewport: { width: 1365, height: 768 } });
  const consoleErrors = [];
  const pageErrors = [];
  const badResponses = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("ERR_NETWORK_CHANGED")) consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("response", (res) => {
    if (res.status() >= 400) badResponses.push(`${res.status()} ${res.url()}`);
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => window.__COCONUT_READY === true, null, { timeout: 90000 });
  const loading = await page.evaluate(() => ({
    counter: document.getElementById("loadingCounter")?.textContent || "",
    text: document.getElementById("loadingText")?.textContent || "",
    disabled: document.getElementById("startButton")?.disabled,
  }));
  assert(loading.counter === "70/70", `Loading counter should be themed 70-step progress: ${JSON.stringify(loading)}`);
  assert(!/asset/i.test(loading.text), `Loading text should not expose asset counts: ${JSON.stringify(loading)}`);
  assert(loading.disabled === false, "Start button stayed disabled after loading");
  await page.evaluate(() => document.getElementById("startButton").click());
  await page.waitForTimeout(600);
  const hud = await page.evaluate(() => ({
    questHidden: document.getElementById("questTracker").hidden,
    questText: document.getElementById("questTracker").innerText,
    fullscreenText: document.getElementById("fullscreenButton").textContent,
    viewport: document.querySelector("meta[name='viewport']")?.content || "",
    hasMobileModeHook: typeof window.__COCONUT_IS_MOBILE_MODE === "function",
    hasMobileImmersiveHook: typeof window.__COCONUT_ENTER_MOBILE_IMMERSIVE === "function",
  }));
  assert(hud.questHidden === false, "Quest tracker did not open after start");
  assert(hud.questText.includes("Rope"), `Quest tracker missing first clear step: ${hud.questText}`);
  assert(hud.questText.includes("Location: Harbor"), `Quest tracker missing direct location: ${hud.questText}`);
  assert(!hud.questText.includes("Copper Token"), `Quest tracker should show only one next step: ${hud.questText}`);
  assert(!hud.questText.includes("Hint"), `Quest tracker should not show extra controls: ${hud.questText}`);
  assert(/Full|Exit/.test(hud.fullscreenText), `Fullscreen toggle label looks wrong: ${hud.fullscreenText}`);
  assert(hud.viewport.includes("viewport-fit=cover"), `Viewport is not mobile fullscreen friendly: ${hud.viewport}`);
  assert(hud.hasMobileModeHook && hud.hasMobileImmersiveHook, "Mobile immersive hooks are missing");

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
      if (r + g + b > 44) lit += 1;
      checksum = (checksum + r * 3 + g * 5 + b * 7 + a * 11 + i) % 1000000007;
    }
    return { lit, alpha, checksum };
  });
  assert(probe.alpha > 1000 && probe.lit > 1000, `Canvas appears blank: ${JSON.stringify(probe)}`);

  await page.evaluate(() => window.__COCONUT_TEST_ACTION("harbor", "rope", "take"));
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("harbor", "crate", "take"));
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("tavern", "lime", "take"));
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("tavern", "spyglass", "take"));
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("tavern", "barkeep", "talk"));
  await page.evaluate(() => window.__COCONUT_TEST_CHOICE(0));
  const earlyCharts = await page.evaluate(() => window.__COCONUT_TEST_ACTION("observatory", "starCharts", "use", "brassNote"));
  assert(earlyCharts.flags.starChartsRead === false, "Star charts should be blocked until market mini games are complete");
  const earlyTelescope = await page.evaluate(() => window.__COCONUT_TEST_ACTION("observatory", "telescope", "use", "spyglass"));
  assert(
    earlyTelescope.flags.telescopeAligned === false && earlyTelescope.miniGame === null,
    "Telescope focus should not start before the market mini-game gates",
  );
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("market", "fruitStand", "use"));
  await page.evaluate(() => window.__COCONUT_TEST_MINI_CHOICE(2));
  await page.evaluate(() => window.__COCONUT_TEST_MINI_CHOICE(0));
  await page.evaluate(() => window.__COCONUT_TEST_MINI_CHOICE(1));
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("market", "smuggler", "talk"));
  await page.evaluate(() => window.__COCONUT_TEST_CHOICE(0));
  await page.evaluate(() => window.__COCONUT_TEST_MINI_CHOICE(1));
  await page.evaluate(() => window.__COCONUT_TEST_MINI_CHOICE(1));
  await page.evaluate(() => window.__COCONUT_TEST_MINI_CHOICE(0));
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("market", "smuggler", "talk"));
  await page.evaluate(() => window.__COCONUT_TEST_CHOICE(0));
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("market", "ledger", "look"));
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("observatory", "starCharts", "use", "brassNote"));
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("observatory", "telescope", "use", "spyglass"));
  await page.evaluate(() => window.__COCONUT_TEST_MINI_CHOICE(1));
  await page.evaluate(() => window.__COCONUT_TEST_MINI_CHOICE(2));
  await page.evaluate(() => window.__COCONUT_TEST_MINI_CHOICE(0));
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("observatory", "archivist", "talk"));
  await page.evaluate(() => window.__COCONUT_TEST_CHOICE(0));
  const earlyShell = await page.evaluate(() => window.__COCONUT_TEST_ACTION("beach", "tidepool", "take"));
  assert(
    earlyShell.flags.shellKeyTaken === false && !earlyShell.inventory.includes("shellKey"),
    "Shell Key should be blocked until the citrus mini game is complete",
  );
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("tavern", "stage", "use"));
  await page.evaluate(() => window.__COCONUT_TEST_MINI_CHOICE(1));
  await page.evaluate(() => window.__COCONUT_TEST_MINI_CHOICE(0));
  await page.evaluate(() => window.__COCONUT_TEST_MINI_CHOICE(1));
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("beach", "tidepool", "take"));
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("beach", "bottle", "take"));
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("harbor", "skiff", "use", "rope"));
  await page.evaluate(() => window.__COCONUT_TEST_ACTION("jungle", "shrineDoor", "use", "shellKey"));
  const solved = await page.evaluate(() => window.__COCONUT_DEBUG_STATE());
  assert(solved.flags.solved === true, `Puzzle chain did not solve: ${JSON.stringify(solved)}`);
  assert(
    solved.flags.smugglerTip === true
      && solved.flags.starChartsRead === true
      && solved.flags.telescopeAligned === true
      && solved.flags.telescopeFocusWon === true
      && solved.flags.archivistClearance === true,
    `Required market/observatory content did not update flags: ${JSON.stringify(solved.flags)}`,
  );
  assert(solved.inventory.includes("starCompass"), "Star Compass was not awarded");
  assert(solved.flags.bananaShuffleWon === true, "Banana shell mini game did not register a win");
  assert(solved.flags.reparteeWon === true, "Repartee mini game did not register a win");
  assert(solved.flags.citrusSpitWon === true, "Citrus mini game did not register a win");
  assert(solved.quest.next.includes("Done"), `Quest tracker did not complete: ${JSON.stringify(solved.quest)}`);

  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join("\n")}`);
  assert(pageErrors.length === 0, `Page errors: ${pageErrors.join("\n")}`);
  assert(badResponses.length === 0, `Bad responses: ${badResponses.join("\n")}`);

  await closeBrowser(browser);
  await closeServer(server);
  console.log(`smoke ok ${url}`);
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
