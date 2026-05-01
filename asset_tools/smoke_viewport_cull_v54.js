const fs = require("fs");
const { chromium } = require("C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const url = process.argv[2] || "file:///C:/Users/User/Documents/Playground/castlevania_from_scratch/index.html";
const screenshot = process.argv[3] || "C:/Users/User/Documents/Playground/castlevania_from_scratch/smoke_viewport_cull_v54.png";
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
  await page.waitForFunction(() => getSheet("player").complete && getTile("ig_floor_00").complete, null, { timeout: 30000 });

  const result = await page.evaluate(async () => {
    game.selectedStage = 1;
    game.qualityMode = "auto";
    game.fxQuality = 1;
    requestStartGame(false);
    await new Promise((resolve) => {
      const started = performance.now();
      const tick = () => {
        if (game.state === "playing" || performance.now() - started > 2600) resolve();
        else setTimeout(tick, 40);
      };
      tick();
    });

    const status = criticalArtStatus(1);
    const bgmWarm = Object.keys(_bgmCache).length;
    const samples = [];
    for (const stage of [1, 3, 6]) {
      game.stage = stage;
      preloadStageArt(stage);
      preloadStageBgm(stage);
      buildStage(stage);
      for (const cam of [0, 480, 1240, Math.max(0, game.worldWidth - 1600), Math.max(0, game.worldWidth - 980)]) {
        game.cameraX = cam;
        render();
        samples.push({
          stage,
          cam,
          solid: { ...game._solidTileDebug },
          mode7: { ...game._mode7Debug },
          bush: { ...game._bushFenceTilemapDebug },
        });
      }
    }

    return {
      state: game.state,
      status,
      bgmWarm,
      bgmAfterStageWarm: Object.keys(_bgmCache).length,
      decodedQueued: status.decoded >= 0,
      maxTileDraws: Math.max(...samples.map((s) => s.solid.tileDraws)),
      maxTrimTiles: Math.max(...samples.map((s) => s.solid.trimTiles)),
      maxZiselLines: Math.max(...samples.map((s) => s.solid.ziselLines)),
      maxZiselArches: Math.max(...samples.map((s) => s.solid.ziselArches)),
      maxBushTiles: Math.max(...samples.map((s) => s.bush.bushTiles || 0)),
      samples,
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
    result.state === "playing" &&
    result.status.ready >= 20 &&
    result.bgmWarm >= 4 &&
    result.bgmAfterStageWarm >= result.bgmWarm &&
    result.maxTileDraws <= 90 &&
    result.maxTrimTiles <= 75 &&
    result.maxZiselLines <= 120 &&
    result.maxZiselArches <= 75 &&
    result.maxBushTiles <= 76 &&
    !screenshotError &&
    pageErrors.length === 0 &&
    consoleErrors.length === 0;

  console.log(JSON.stringify({ ok, url, screenshot, screenshotError, result, pageErrors, consoleErrors }, null, 2));
  process.exit(ok ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
