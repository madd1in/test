const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require("C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
}

const root = path.resolve(__dirname, "..");
const screenshot = path.join(root, "smoke", "browser-smoke.png");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".mp3": "audio/mpeg"
};

function serveFile(request, response) {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  if (url.pathname === "/favicon.ico") {
    response.writeHead(204, { "cache-control": "no-store" });
    response.end();
    return;
  }
  const target = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const file = path.resolve(root, `.${target}`);
  if (!file.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "content-type": mime[path.extname(file)] || "application/octet-stream",
      "cache-control": "no-store"
    });
    response.end(data);
  });
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

async function run() {
  fs.mkdirSync(path.dirname(screenshot), { recursive: true });
  const server = http.createServer(serveFile);
  const port = await listen(server);
  const url = `http://127.0.0.1:${port}/`;
  const executablePath = [
    chromium.executablePath(),
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe"
  ].find((candidate) => candidate && fs.existsSync(candidate));

  const errors = { console: [], page: [], responses: [] };
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath,
      timeout: 30000
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.setDefaultTimeout(15000);
    page.on("console", (message) => {
      if (message.type() === "error") errors.console.push(message.text());
    });
    page.on("pageerror", (error) => errors.page.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400) errors.responses.push(`${response.status()} ${response.url()}`);
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForFunction(() => window.__voltLynxDebug, null, { timeout: 10000 });
    await page.waitForFunction(() => window.__voltLynxDebug.getState().atlasReady, null, { timeout: 10000 });
    await page.waitForFunction(() => window.__voltLynxDebug.getState().slicesReady, null, { timeout: 10000 });
    await page.waitForFunction(() => window.__voltLynxDebug.getState().hdReady, null, { timeout: 10000 });
    await page.waitForFunction(
      () => Object.values(window.__voltLynxDebug.getState().importedGraphicsReady).every(Boolean),
      null,
      { timeout: 10000 }
    );
    await page.click("#startButton");
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(350);
    await page.keyboard.press("Space");
    await page.waitForTimeout(250);
    await page.keyboard.press("Shift");
    await page.waitForTimeout(1700);
    await page.keyboard.up("ArrowRight");
    const perf = await page.evaluate(async () => {
      const frames = [];
      let last = performance.now();
      for (let i = 0; i < 60; i += 1) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const now = performance.now();
        frames.push(now - last);
        last = now;
      }
      const avg = frames.reduce((sum, value) => sum + value, 0) / frames.length;
      return {
        avgFrameMs: avg,
        maxFrameMs: Math.max(...frames),
        minFrameMs: Math.min(...frames)
      };
    });
    await page.screenshot({ path: screenshot, timeout: 20000 });

    const state = await page.evaluate((perf) => {
      const canvas = document.querySelector("#game");
      const context = canvas.getContext("2d");
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let alpha = 0;
      let lit = 0;
      let colorSpread = 0;
      for (let i = 0; i < pixels.length; i += 128) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        if (a > 0) alpha += 1;
        if (r + g + b > 64) lit += 1;
        if (Math.max(r, g, b) - Math.min(r, g, b) > 18) colorSpread += 1;
      }
      const resources = performance.getEntriesByType("resource").map((entry) => entry.name);
      return {
        ...window.__voltLynxDebug.getState(),
        perf,
        overlayHidden: !document.querySelector("#overlay").classList.contains("overlay--visible"),
        assetMapUiAbsent:
          !document.querySelector("#assetButton") &&
          !document.querySelector("#overlayAssetButton") &&
          !document.querySelector("#assetPanel"),
        hudHoops: document.querySelector("#hudHoops").textContent,
        hudScore: document.querySelector("#hudScore").textContent,
        hudSpeed: document.querySelector("#hudSpeed").textContent,
        boostWidth: document.querySelector("#hudBoost").style.width,
        audioButtonVisible: Boolean(document.querySelector("#audioButton").getBoundingClientRect().width > 0),
        importedResources: resources.filter((name) => name.includes("/assets/imported/")).length,
        slicedResources: resources.filter((name) => name.includes("/assets/sliced/")).length,
        hdResources: resources.filter((name) => name.includes("/assets/imagen-hd/sliced/")).length,
        bgmLoaded: resources.some((name) => name.includes("needle-meadow-sprint.mp3")),
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        alpha,
        lit,
        colorSpread
      };
    }, perf);

    await page.setViewportSize({ width: 390, height: 740 });
    await page.waitForTimeout(160);
    const mobile = await page.evaluate(() => {
      const pad = document.querySelector(".touch-pad");
      const jump = document.querySelector('[data-action="jump"]');
      const rect = jump.getBoundingClientRect();
      const options = {
        bubbles: true,
        cancelable: true,
        pointerId: 31,
        pointerType: "touch",
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        button: 0,
        buttons: 1
      };
      jump.dispatchEvent(new PointerEvent("pointerdown", options));
      const pressed = jump.classList.contains("is-active");
      jump.dispatchEvent(new PointerEvent("pointerup", { ...options, buttons: 0 }));
      const released = !jump.classList.contains("is-active");
      const sizes = [...document.querySelectorAll(".touch-pad__button")].map((button) => {
        const r = button.getBoundingClientRect();
        return Math.min(r.width, r.height);
      });
      return {
        display: getComputedStyle(pad).display,
        count: sizes.length,
        minButtonSize: Math.min(...sizes),
        touchAction: getComputedStyle(document.querySelector(".game-shell")).touchAction,
        pressed,
        released
      };
    });

    const ok =
      errors.console.length === 0 &&
      errors.page.length === 0 &&
      errors.responses.length === 0 &&
      state.mode === "playing" &&
      state.overlayHidden &&
      state.assetMapUiAbsent &&
      state.assetMapLoaded &&
      state.atlasReady &&
      state.slicesReady &&
      state.sliceFramesLoaded === state.sliceFrameCount &&
      state.hdManifestLoaded &&
      state.hdReady &&
      state.hdFramesLoaded === state.hdFrameCount &&
      state.mode7TextureReady &&
      Object.values(state.importedGraphicsReady).every(Boolean) &&
      state.importedResources >= 3 &&
      state.slicedResources >= 30 &&
      state.hdResources >= 30 &&
      state.levelWidth >= 9500 &&
      state.totalLoops >= 4 &&
      state.totalCheckpoints >= 5 &&
      state.totalRings >= 140 &&
      state.audioButtonVisible &&
      state.audio.bgmSrc.includes("needle-meadow-sprint.mp3") &&
      state.audio.bgmReady &&
      state.player.x > 260 &&
      state.player.boost >= 0 &&
      state.ringsRemaining <= state.totalRings &&
      Number(state.hudScore) >= 0 &&
      Number(state.hudSpeed) >= 0 &&
      state.canvasWidth === 1280 &&
      state.canvasHeight === 720 &&
      state.alpha > 6000 &&
      state.lit > 5000 &&
      state.colorSpread > 2500 &&
      state.perf.avgFrameMs < 30 &&
      state.perf.maxFrameMs < 80 &&
      mobile.display === "flex" &&
      mobile.count === 4 &&
      mobile.minButtonSize >= 60 &&
      mobile.touchAction === "none" &&
      mobile.pressed &&
      mobile.released;

    console.log(JSON.stringify({ ok, url, screenshot, state, mobile, errors }, null, 2));
    process.exitCode = ok ? 0 : 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.close();
  }
}

run().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
