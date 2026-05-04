const fs = require("fs");
const { chromium } = require("C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const url = process.argv[2] || "file:///C:/Users/User/Documents/Playground/castlevania_from_scratch/index.html";
const screenshot = process.argv[3] || "C:/Users/User/Documents/Playground/castlevania_from_scratch/smoke_solid_index_v55.png";
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
    requestStartGame(false);
    await new Promise((resolve) => {
      const started = performance.now();
      const tick = () => {
        if (game.state === "playing" || performance.now() - started > 2600) resolve();
        else setTimeout(tick, 40);
      };
      tick();
    });

    const samples = [];
    let misses = 0;
    for (const stage of [1, 4, 6]) {
      game.stage = stage;
      buildStage(stage);
      for (const cam of [0, 620, 1480, Math.max(0, game.worldWidth - 1760), Math.max(0, game.worldWidth - 1040)]) {
        game.cameraX = cam;
        const near = solidsNear(cam, canvas.width, visPad);
        const nearSet = new Set(near);
        const visible = level.solids.filter((s) => s.x + s.w > game.cameraX && s.x < game.cameraX + canvas.width);
        const missing = visible.filter((s) => !nearSet.has(s)).length;
        misses += missing;
        render();
        samples.push({
          stage,
          cam,
          total: level.solids.length,
          near: near.length,
          visible: visible.length,
          missing,
          index: { ...game._solidIndexDebug },
          solidDraw: { ...game._solidTileDebug },
        });
      }
    }

    game.stage = 1;
    buildStage(1);
    const lock = level.locks[0];
    const beforeGate = { solids: level.solids.length, buckets: game._solidIndexDebug.buckets };
    const opened = lock ? openSeal(lock.id) : false;
    const afterGate = { solids: level.solids.length, buckets: game._solidIndexDebug.buckets };

    const maxNear = Math.max(...samples.map((s) => s.near));
    const minTotal = Math.min(...samples.map((s) => s.total));
    const maxVisible = Math.max(...samples.map((s) => s.visible));
    const maxSolidDraws = Math.max(...samples.map((s) => s.solidDraw.tileDraws));

    return {
      state: game.state,
      samples,
      misses,
      maxNear,
      minTotal,
      maxVisible,
      maxSolidDraws,
      beforeGate,
      afterGate,
      opened,
      indexed: !!level.solidBuckets && level.solidBuckets instanceof Map,
      indexDebug: { ...game._solidIndexDebug },
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
    result.indexed === true &&
    result.misses === 0 &&
    result.maxNear < result.minTotal &&
    result.maxVisible <= result.maxNear &&
    result.maxSolidDraws <= 90 &&
    result.opened === true &&
    result.afterGate.solids < result.beforeGate.solids &&
    !screenshotError &&
    pageErrors.length === 0 &&
    consoleErrors.length === 0;

  console.log(JSON.stringify({ ok, url, screenshot, screenshotError, result, pageErrors, consoleErrors }, null, 2));
  process.exit(ok ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
