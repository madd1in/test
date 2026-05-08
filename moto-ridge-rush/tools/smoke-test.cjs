const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require("C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
}

const root = path.resolve(__dirname, "..");
const artifacts = path.join(root, "artifacts");
fs.mkdirSync(artifacts, { recursive: true });

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png"
};

function createServer() {
  return http.createServer((req, res) => {
    const rawUrl = new URL(req.url, "http://127.0.0.1");
    const pathname = decodeURIComponent(rawUrl.pathname === "/" ? "/index.html" : rawUrl.pathname);
    const target = path.resolve(root, `.${pathname}`);
    if (!target.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs.readFile(target, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, { "content-type": types[path.extname(target)] || "application/octet-stream" });
      res.end(data);
    });
  });
}

async function run() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const executablePath = [
    chromium.executablePath(),
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  ].find((candidate) => candidate && fs.existsSync(candidate));

  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__MOTO_RIDGE_READY === true);
    await page.click("#startButton");
    await page.keyboard.down("ArrowRight");
    await page.keyboard.down("ShiftLeft");
    await page.waitForTimeout(2200);
    await page.keyboard.up("ShiftLeft");
    await page.keyboard.press("Space");
    await page.waitForTimeout(900);
    await page.keyboard.up("ArrowRight");
    const desktopState = await page.evaluate(() => ({
      x: window.__MOTO_RIDGE_DEBUG.state.bike.x,
      speed: window.__MOTO_RIDGE_DEBUG.state.bike.vx,
      heat: window.__MOTO_RIDGE_DEBUG.state.bike.heat,
      particles: window.__MOTO_RIDGE_DEBUG.state.particles.length
    }));
    await page.screenshot({ path: path.join(artifacts, "smoke-desktop.png"), fullPage: true });
    if (desktopState.x < 360) {
      throw new Error(`Bike did not move far enough: ${JSON.stringify(desktopState)}`);
    }

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await mobile.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
    await mobile.waitForFunction(() => window.__MOTO_RIDGE_READY === true);
    await mobile.tap("#startButton");
    await mobile.locator('[data-action="throttle"]').dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", isPrimary: true, buttons: 1 });
    await mobile.waitForTimeout(1200);
    await mobile.locator('[data-action="throttle"]').dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", isPrimary: true, buttons: 0 });
    const mobileState = await mobile.evaluate(() => ({
      x: window.__MOTO_RIDGE_DEBUG.state.bike.x,
      hud: getComputedStyle(document.querySelector("#touchControls")).display
    }));
    await mobile.screenshot({ path: path.join(artifacts, "smoke-mobile.png"), fullPage: true });
    if (mobileState.x < 210 || mobileState.hud === "none") {
      throw new Error(`Mobile controls did not respond: ${JSON.stringify(mobileState)}`);
    }

    console.log(JSON.stringify({ ok: true, desktopState, mobileState, artifacts }, null, 2));
  } finally {
    await browser.close().catch(() => {});
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
