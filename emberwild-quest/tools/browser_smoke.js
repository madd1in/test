const fs = require("fs");
const path = require("path");
const Module = require("module");

function loadPlaywright() {
  try {
    return require("playwright");
  } catch (firstError) {
    const runtimeModules = path.join(
      process.env.USERPROFILE || process.env.HOME || "",
      ".cache",
      "codex-runtimes",
      "codex-primary-runtime",
      "dependencies",
      "node",
      "node_modules",
    );
    const extraPaths = [];
    if (fs.existsSync(runtimeModules)) extraPaths.push(runtimeModules);
    const pnpmDir = path.join(runtimeModules, ".pnpm");
    if (fs.existsSync(pnpmDir)) {
      for (const entry of fs.readdirSync(pnpmDir)) {
        if (entry.startsWith("playwright@") || entry.startsWith("playwright-core@")) {
          extraPaths.push(path.join(pnpmDir, entry, "node_modules"));
        }
      }
    }
    process.env.NODE_PATH = [process.env.NODE_PATH, ...extraPaths].filter(Boolean).join(path.delimiter);
    Module._initPaths();
    try {
      return require("playwright");
    } catch {
      throw firstError;
    }
  }
}

const { chromium } = loadPlaywright();

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, ".qa");
fs.mkdirSync(outDir, { recursive: true });

const url = process.argv[2] || "http://127.0.0.1:4179";
const errors = [];

async function bootPage(page) {
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector("canvas", { timeout: 10000 });
  try {
    await page.waitForFunction(() => window.__emberScene?.state && !document.querySelector("#start-button")?.disabled, null, {
      timeout: 20000,
    });
  } catch (error) {
    const bootState = await page.evaluate(() => ({
      hasScene: Boolean(window.__emberScene),
      hasState: Boolean(window.__emberScene?.state),
      startDisabled: document.querySelector("#start-button")?.disabled ?? null,
      bodyText: document.body.innerText.slice(0, 200),
    }));
    throw new Error(`Boot timed out: ${JSON.stringify(bootState)} errors=${errors.join(" | ") || "none"}`);
  }
}

async function sampleFramePace(page, frames = 90) {
  return page.evaluate(
    async (frameCount) =>
      new Promise((resolve) => {
        const deltas = [];
        let last = performance.now();
        const tick = (now) => {
          deltas.push(now - last);
          last = now;
          if (deltas.length >= frameCount) {
            const sorted = [...deltas].sort((a, b) => a - b);
            const avg = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
            resolve({
              avgFps: Math.round(1000 / avg),
              avgFrameMs: Number(avg.toFixed(2)),
              p95FrameMs: Number(sorted[Math.floor(sorted.length * 0.95)].toFixed(2)),
            });
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    frames,
  );
}

async function main() {
  const chromePath =
    process.env.PLAYWRIGHT_CHROME ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const launchOptions = fs.existsSync(chromePath)
    ? { headless: true, executablePath: chromePath }
    : { headless: true };
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  await bootPage(page);
  await page.screenshot({ path: path.join(outDir, "menu-desktop.png"), fullPage: true });
  await page.click("#start-button");
  await page.waitForTimeout(800);
  const beforeMove = await page.evaluate(() => {
    const scene = window.__emberScene;
    return scene?.player ? { x: scene.player.x, y: scene.player.y } : null;
  });
  await page.keyboard.down("d");
  await page.keyboard.down("s");
  await page.waitForTimeout(420);
  await page.keyboard.up("d");
  await page.keyboard.up("s");
  await page.keyboard.press("Space");
  await page.keyboard.press("e");
  await page.keyboard.press("q");
  await page.waitForTimeout(500);
  const desktopPerf = await sampleFramePace(page);
  const desktop = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const scene = window.__emberScene;
    const box = canvas.getBoundingClientRect();
    return {
      canvas: { width: box.width, height: box.height },
      hudHidden: document.querySelector("#hud").hidden,
      menuHidden: document.querySelector("#menu").hidden,
      activePlay: scene?.activePlay ?? false,
      player: scene?.player ? { x: Math.round(scene.player.x), y: Math.round(scene.player.y) } : null,
      pulseReady: Boolean(scene?.nextPulseAt > 0),
      objective: document.querySelector("#objective")?.textContent,
    };
  });
  desktop.perf = desktopPerf;
  await page.screenshot({ path: path.join(outDir, "gameplay-desktop.png"), fullPage: true });
  await page.close();

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await bootPage(mobile);
  await mobile.tap("#start-button");
  await mobile.waitForTimeout(700);
  const mobilePerf = await sampleFramePace(mobile, 70);
  const mobileState = await mobile.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const box = canvas.getBoundingClientRect();
    return {
      canvas: { width: box.width, height: box.height },
      mobileControlsVisible: getComputedStyle(document.querySelector("#mobile-controls")).display !== "none",
      hudHidden: document.querySelector("#hud").hidden,
    };
  });
  mobileState.perf = mobilePerf;
  await mobile.screenshot({ path: path.join(outDir, "gameplay-mobile.png"), fullPage: true });
  await mobile.close();
  await browser.close();

  const failed = [];
  if (errors.length) failed.push(`Console/page errors: ${errors.join(" | ")}`);
  if (desktop.canvas.width < 300 || desktop.canvas.height < 240) failed.push("Desktop canvas is too small.");
  if (desktop.hudHidden || !desktop.menuHidden || !desktop.activePlay) failed.push("Desktop start state did not activate correctly.");
  if (!beforeMove || !desktop.player) failed.push("Player position was not readable.");
  else if (Math.hypot(desktop.player.x - beforeMove.x, desktop.player.y - beforeMove.y) < 12) {
    failed.push("Player did not move during keyboard smoke.");
  }
  if (!desktop.pulseReady) failed.push("Ember pulse did not trigger from keyboard input.");
  if (desktop.perf.avgFps < 35) failed.push(`Desktop frame pace is too low: ${desktop.perf.avgFps}fps avg.`);
  if (mobileState.canvas.width < 300 || mobileState.canvas.height < 500) failed.push("Mobile canvas is too small.");
  if (mobileState.hudHidden || !mobileState.mobileControlsVisible) failed.push("Mobile HUD or touch controls are not visible.");
  if (mobileState.perf.avgFps < 28) failed.push(`Mobile frame pace is too low: ${mobileState.perf.avgFps}fps avg.`);

  if (failed.length) {
    console.error(failed.join("\n"));
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        url,
        desktop,
        mobile: mobileState,
        screenshots: {
          menu: path.join(outDir, "menu-desktop.png"),
          gameplay: path.join(outDir, "gameplay-desktop.png"),
          mobile: path.join(outDir, "gameplay-mobile.png"),
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
