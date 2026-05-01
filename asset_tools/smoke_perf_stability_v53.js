const fs = require("fs");
const { chromium } = require("C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const url = process.argv[2] || "file:///C:/Users/User/Documents/Playground/castlevania_from_scratch/index.html";
const screenshot = process.argv[3] || "C:/Users/User/Documents/Playground/castlevania_from_scratch/smoke_perf_stability_v53.png";
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
  await page.waitForFunction(() => getSheet("player").complete && getSheet("bushFence").complete && getTile("ig_floor_00").complete, null, { timeout: 30000 });
  const result = await page.evaluate(async () => {
    game.selectedStage = 1;
    game.qualityMode = "auto";
    game.fxQuality = 1;
    game.perfHold = 0;
    game.fxRecover = 0;
    game.qualitySwitches = 0;
    const beforeStart = criticalArtStatus(1);
    requestStartGame(false);
    await new Promise((resolve) => {
      const t0 = performance.now();
      const tick = () => {
        if (game.state === "playing" || performance.now() - t0 > 2600) resolve();
        else setTimeout(tick, 40);
      };
      tick();
    });
    const afterStart = criticalArtStatus(1);

    const frames = [];
    const renderTimes = [];
    for (let i = 0; i < 18; i += 1) {
      game.cameraX = 80 + i * 72.25;
      const before = performance.now();
      render();
      renderTimes.push(performance.now() - before);
      frames.push({
        cam: game.cameraX,
        bush: { ...game._bushFenceTilemapDebug },
        mode7: { ...game._mode7Debug },
        fog: { ...game._fogDebug },
      });
    }

    for (let i = 0; i < 150; i += 1) {
      game.frameAvg = 0.0172;
      game.fps = 58;
      updateAutoQuality();
    }
    const stableQuality = { fxQuality: game.fxQuality, perfHold: game.perfHold, fxRecover: game.fxRecover, switches: game.qualitySwitches };
    game.frameAvg = 0.023;
    game.fps = 48;
    updateAutoQuality();
    const slowQuality = { fxQuality: game.fxQuality, perfHold: game.perfHold, perfMode: game.perfMode };

    const caches = {
      art: Object.keys(_imgCache).length,
      pixels: Object.keys(_pixelCache).length,
      sheets: Object.keys(_sheetCache).length,
      tiles: Object.keys(_tileCache).length,
      preload: game._preloadDebug || null,
    };

    return {
      stage: game.stage,
      qualityMode: game.qualityMode,
      frames,
      avgRenderMs: renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length,
      maxRenderMs: Math.max(...renderTimes),
      maxBushTiles: Math.max(...frames.map((f) => f.bush.bushTiles)),
      maxFenceTiles: Math.max(...frames.map((f) => f.bush.fenceTiles)),
      mode7Budgets: frames.map((f) => f.mode7.budget),
      stableQuality,
      slowQuality,
      caches,
      startGuard: { beforeStart, afterStart, state: game.state },
    };
  });

  let screenshotError = null;
  try {
    await page.screenshot({ path: screenshot, timeout: 20000 });
  } catch (err) {
    screenshotError = err.message;
  }
  await browser.close();

  const ok =
    result.stage === 1 &&
    result.qualityMode === "auto" &&
    result.maxBushTiles <= 76 &&
    result.maxFenceTiles <= 34 &&
    result.mode7Budgets.every((b) => b <= 1) &&
    result.stableQuality.fxQuality === 1 &&
    result.stableQuality.switches <= 1 &&
    result.slowQuality.fxQuality <= 1 &&
    result.slowQuality.perfMode === 1 &&
    result.startGuard.state === "playing" &&
    result.startGuard.afterStart.ready >= result.startGuard.beforeStart.ready &&
    result.caches.sheets >= 7 &&
    result.caches.preload?.started === true &&
    !screenshotError &&
    pageErrors.length === 0 &&
    consoleErrors.length === 0;

  console.log(JSON.stringify({ ok, url, screenshot, screenshotError, result, pageErrors, consoleErrors }, null, 2));
  process.exit(ok ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
