const fs = require("fs");
const { chromium } = require("C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const url = process.argv[2] || "file:///C:/Users/User/Documents/Playground/castlevania_from_scratch/index.html";
const screenshot = process.argv[3] || "C:/Users/User/Documents/Playground/castlevania_from_scratch/smoke_bush_fence_tilemap_v52.png";
const asset = "C:/Users/User/Documents/Playground/castlevania_from_scratch/assets/generated/bush_fence_tilemap_imagegen_v52.png";
const meta = "C:/Users/User/Documents/Playground/castlevania_from_scratch/assets/generated/bush_fence_tilemap_imagegen_v52.json";
const chromeCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe",
];
const executablePath = chromeCandidates.find((p) => fs.existsSync(p));

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--autoplay-policy=no-user-gesture-required", "--allow-file-access-from-files"],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.goto(url, { waitUntil: "load", timeout: 90000 });
  await page.waitForFunction(() => getSheet("bushFence").complete && getSheet("bushFence").naturalWidth > 0, null, { timeout: 30000 });
  const result = await page.evaluate(() => {
    game.selectedStage = 1;
    game.qualityMode = "high";
    game.fxQuality = 2;
    startGame(false);
    const views = [];
    for (const cam of [0, 720, 1320]) {
      game.cameraX = cam;
      render();
      views.push({ cam, debug: { ...game._bushFenceTilemapDebug } });
    }
    const img = getSheet("bushFence");
    return {
      sheetLoaded: img.complete && img.naturalWidth === 256 && img.naturalHeight === 128,
      sheetSrc: img.src,
      views,
      hedges: level.setPieces.filter((p) => p.type === "hedge").length,
      roses: level.setPieces.filter((p) => p.type === "roseBush").length,
      fences: level.setPieces.filter((p) => p.type === "ironFence").length,
      gates: level.setPieces.filter((p) => p.type === "gardenGate" || p.type === "gardenArch").length,
    };
  });

  let screenshotError = null;
  try {
    await page.screenshot({ path: screenshot, timeout: 20000 });
  } catch (err) {
    screenshotError = err.message;
  }
  await browser.close();

  const metaJson = JSON.parse(fs.readFileSync(meta, "utf8"));
  const maxBushTiles = Math.max(...result.views.map((v) => v.debug.bushTiles));
  const maxFenceTiles = Math.max(...result.views.map((v) => v.debug.fenceTiles));
  const maxLatticeTiles = Math.max(...result.views.map((v) => v.debug.latticeTiles));
  const ok =
    fs.existsSync(asset) &&
    fs.existsSync(meta) &&
    metaJson.tileSize === 32 &&
    metaJson.columns === 8 &&
    Object.keys(metaJson.tiles || {}).length === 32 &&
    result.sheetLoaded &&
    result.hedges >= 1 &&
    result.roses >= 1 &&
    result.fences >= 1 &&
    result.gates >= 2 &&
    maxBushTiles >= 20 &&
    maxFenceTiles >= 20 &&
    maxLatticeTiles >= 4 &&
    !screenshotError &&
    pageErrors.length === 0 &&
    consoleErrors.length === 0;

  console.log(JSON.stringify({ ok, url, screenshot, screenshotError, result, maxBushTiles, maxFenceTiles, maxLatticeTiles, pageErrors, consoleErrors }, null, 2));
  process.exit(ok ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
