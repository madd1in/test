const fs = require("fs");
const http = require("http");
const path = require("path");

process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = "1";

function resolvePlaywright() {
  try {
    return require("playwright");
  } catch (firstError) {
    const bundled = "C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright";
    try {
      return require(bundled);
    } catch {
      throw firstError;
    }
  }
}

const { chromium } = resolvePlaywright();
const root = path.resolve(__dirname, "..");
let smokeUrl = process.env.SMOKE_URL || "";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".png": "image/png",
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
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  const targetUrl = `${smokeUrl}${smokeUrl.includes("?") ? "&" : "?"}mute=1&capture=1`;
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("load", { timeout: 30000 }).catch(() => {});
  await page.waitForSelector("#game");
  await page.waitForSelector("#startButton");
  await page.evaluate(() => document.getElementById("startButton").click());
  await page.waitForTimeout(350);
  await page.keyboard.down("KeyW");
  await page.keyboard.press("Space");
  await page.waitForTimeout(180);
  await page.keyboard.press("Space");
  await page.waitForTimeout(180);
  await page.keyboard.press("Space");
  await page.waitForTimeout(720);
  await page.keyboard.up("KeyW");
  const fpsEstimate = await page.evaluate(() => new Promise((resolve) => {
    let last = performance.now();
    let total = 0;
    let frames = 0;
    function step(now) {
      total += now - last;
      last = now;
      frames += 1;
      if (frames >= 45) resolve(Math.round(1000 / (total / frames)));
      else requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }));

  const metrics = await page.evaluate(() => {
    const canvas = document.getElementById("game");
    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true }) || canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) return { webgl: false };
    const samples = [
      [Math.floor(canvas.width * 0.5), Math.floor(canvas.height * 0.5)],
      [Math.floor(canvas.width * 0.32), Math.floor(canvas.height * 0.58)],
      [Math.floor(canvas.width * 0.66), Math.floor(canvas.height * 0.45)],
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
      jumpText: document.getElementById("jumpText").textContent,
    };
  });
  metrics.fpsEstimate = fpsEstimate;

  if (errors.length) throw new Error(`${name} console errors: ${errors.join(" | ")}`);
  if (!metrics.webgl) throw new Error(`${name} WebGL context missing`);
  if (!metrics.menuHidden) throw new Error(`${name} menu did not close`);
  if (mobile && !metrics.touchVisible) throw new Error(`${name} touch controls are hidden`);
  if (!/^[0-3]\/3$/.test(metrics.jumpText)) throw new Error(`${name} triple jump HUD is invalid`);
  if (metrics.fpsEstimate < 18) throw new Error(`${name} FPS estimate too low: ${metrics.fpsEstimate}`);
  if (!metrics.pixels.some((pixel) => pixel[3] > 0 && (pixel[0] + pixel[1] + pixel[2]) > 8)) {
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
    await browser.close();
    if (server) {
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(resolve));
    }
  }
})();
