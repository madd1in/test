const fs = require("fs");
const http = require("http");
const path = require("path");

process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = "1";

function resolvePlaywright() {
  try {
    return require("playwright");
  } catch (firstError) {
    const candidates = [
      "C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
      "C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright",
    ];
    for (const bundled of candidates) {
      try {
        return require(bundled);
      } catch {}
    }
    throw firstError;
  }
}

const { chromium } = resolvePlaywright();
const root = path.resolve(__dirname, "..");
let smokeUrl = process.env.SMOKE_URL || "";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".wav": "audio/wav",
};

function serveFile(request, response) {
  const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
  if (requestUrl.pathname === "/favicon.ico") {
    response.writeHead(204, { "cache-control": "no-store" });
    response.end();
    return;
  }
  const target = requestUrl.pathname === "/" ? "/index.html" : decodeURIComponent(requestUrl.pathname);
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
      "cache-control": "no-store",
    });
    response.end(data);
  });
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

async function runViewport(browser, name, viewport, mobile = false) {
  const page = await browser.newPage({
    viewport,
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource/i.test(message.text())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() >= 400 && !/\/favicon\.ico$/i.test(new URL(url).pathname)) {
      errors.push(`${response.status()} ${url}`);
    }
  });

  const targetUrl = `${smokeUrl}${smokeUrl.includes("?") ? "&" : "?"}mute=1&capture=1`;
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#game", { timeout: 15000 });
  await page.waitForSelector("#startButton", { timeout: 15000 });
  await page.click("#startButton");
  await page.waitForTimeout(450);
  await page.keyboard.down("KeyW");
  await page.keyboard.down("KeyD");
  await page.keyboard.press("Space");
  await page.waitForTimeout(170);
  await page.keyboard.press("Space");
  await page.keyboard.down("ShiftLeft");
  await page.waitForTimeout(750);
  await page.keyboard.up("ShiftLeft");
  await page.waitForFunction(() => window.__novaWingDebug?.getState?.().progress > 185, null, { timeout: 8000 });
  await page.evaluate(() => window.__novaWingDebug?.chargeNova?.(1));
  await page.keyboard.press("KeyX");
  await page.waitForTimeout(220);
  await page.keyboard.press("Space");
  await page.waitForTimeout(260);
  await page.keyboard.up("KeyW");
  await page.keyboard.up("KeyD");

  const metrics = await page.evaluate(() => {
    const canvas = document.getElementById("game");
    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true }) || canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) return { webgl: false };
    const samples = [
      [Math.floor(canvas.width * 0.5), Math.floor(canvas.height * 0.5)],
      [Math.floor(canvas.width * 0.28), Math.floor(canvas.height * 0.42)],
      [Math.floor(canvas.width * 0.72), Math.floor(canvas.height * 0.58)],
    ];
    const pixels = samples.map(([x, y]) => {
      const pixel = new Uint8Array(4);
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      return Array.from(pixel);
    });
    return {
      webgl: true,
      width: canvas.width,
      height: canvas.height,
      pixels,
      menuHidden: document.getElementById("menu").classList.contains("hidden"),
      touchVisible: getComputedStyle(document.getElementById("touchControls")).display !== "none",
      objective: document.getElementById("objectiveText").textContent,
      score: document.getElementById("scoreText").textContent,
      debug: window.__novaWingDebug?.getState?.(),
    };
  });

  if (errors.length) throw new Error(`${name} console errors: ${errors.join(" | ")}`);
  if (!metrics.webgl) throw new Error(`${name} WebGL context missing`);
  if (!metrics.menuHidden) throw new Error(`${name} menu did not close`);
  if (mobile && !metrics.touchVisible) throw new Error(`${name} touch controls are hidden`);
  if (!metrics.debug || metrics.debug.mode !== "playing") throw new Error(`${name} debug state did not enter play`);
  if (metrics.debug.progress < 185) throw new Error(`${name} did not advance far enough for the first wave`);
  if (metrics.debug.enemies < 1 && metrics.debug.score < 1) throw new Error(`${name} first enemy wave did not spawn or score`);
  if (metrics.debug.nova > 0.2) throw new Error(`${name} Nova Burst did not discharge`);
  if (!metrics.pixels.some((pixel) => pixel[3] > 0 && pixel[0] + pixel[1] + pixel[2] > 14)) {
    throw new Error(`${name} canvas pixel check looks blank`);
  }

  const screenshotPath = path.join(root, `browser-smoke-${name}.png`);
  try {
    await page.screenshot({ path: screenshotPath, fullPage: false, timeout: 10000 });
  } catch {
    const canvasPng = await page.evaluate(() => document.getElementById("game").toDataURL("image/png").split(",")[1]);
    fs.writeFileSync(screenshotPath, Buffer.from(canvasPng, "base64"));
  }
  await page.close({ runBeforeUnload: false });
  return { name, screenshotPath, metrics };
}

async function settleCleanup(promise, timeoutMs) {
  try {
    await Promise.race([promise, new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
  } catch {}
}

(async () => {
  let server = null;
  if (!smokeUrl) {
    server = http.createServer(serveFile);
    const port = await listen(server);
    smokeUrl = `http://127.0.0.1:${port}/`;
  }
  const executablePath = [
    chromium.executablePath(),
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find((candidate) => candidate && fs.existsSync(candidate));
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    timeout: 30000,
    args: ["--allow-file-access-from-files"],
  });

  try {
    console.log(`Browser smoke URL ${smokeUrl}`);
    const desktop = await runViewport(browser, "desktop", { width: 1280, height: 720 });
    console.log("Desktop viewport passed");
    const mobile = await runViewport(browser, "mobile", { width: 390, height: 844 }, true);
    console.log("Mobile viewport passed");
    console.log("Browser smoke test passed");
    console.log(JSON.stringify({ desktop, mobile }, null, 2));
  } finally {
    await settleCleanup(browser.close(), 6000);
    if (server) {
      server.closeAllConnections?.();
      await settleCleanup(new Promise((resolve) => server.close(resolve)), 2000);
    }
  }
})();
