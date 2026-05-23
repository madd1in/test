import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import Module, { createRequire } from "node:module";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const sitePort = 4198;
const url = `http://127.0.0.1:${sitePort}/?autoplay=1`;
const localChrome =
  process.env.CHROME_PATH ||
  (existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe");

process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = "1";
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".mp3": "audio/mpeg"
};

function ensureBundledNodeModules() {
  if (process.env.NODE_PATH) return;
  const home = process.env.USERPROFILE || process.env.HOME;
  if (!home) return;
  const mainModules = join(
    home,
    ".cache",
    "codex-runtimes",
    "codex-primary-runtime",
    "dependencies",
    "node",
    "node_modules"
  );
  const pnpmModules = join(mainModules, ".pnpm", "node_modules");
  process.env.NODE_PATH = `${mainModules};${pnpmModules}`;
  Module._initPaths();
}

async function loadPlaywright() {
  ensureBundledNodeModules();
  const require = createRequire(import.meta.url);
  try {
    return require("playwright");
  } catch (error) {
    throw new Error(`Playwright is not available. Set NODE_PATH to the bundled node_modules. ${error.message}`);
  }
}

async function serveSite() {
  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") pathname = "/index.html";
    const safe = normalize(pathname).replace(/^([/\\])+/, "");
    let file = join(root, safe);
    if (!file.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    try {
      const info = await stat(file);
      if (info.isDirectory()) file = join(file, "index.html");
      response.writeHead(200, {
        "content-type": mime[extname(file)] || "application/octet-stream",
        "cache-control": "no-store"
      });
      createReadStream(file).pipe(response);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(sitePort, "127.0.0.1", resolve));
  return server;
}

async function probePage(page) {
  return page.evaluate(() => {
    const game = window.cryptRunner3D;
    const gl = game?.renderer?.getContext?.();
    if (!game || !gl) return { ok: false, reason: "missing WebGL context" };
    const points = [[0.18, 0.2], [0.38, 0.38], [0.52, 0.58], [0.7, 0.72], [0.48, 0.84]];
    const pixel = new Uint8Array(4);
    const samples = [];
    for (const [px, py] of points) {
      const x = Math.max(0, Math.min(gl.drawingBufferWidth - 1, Math.floor(gl.drawingBufferWidth * px)));
      const y = Math.max(0, Math.min(gl.drawingBufferHeight - 1, Math.floor(gl.drawingBufferHeight * py)));
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      samples.push(Array.from(pixel));
    }
    const unique = new Set(samples.map((sample) => sample.join(","))).size;
    const lit = samples.filter(([r, g, b, a]) => a > 0 && r + g + b > 35).length;
    return {
      ok: unique >= 3 && lit >= 2 && game.state.distance > 5 && game.entities.length > 0,
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      unique,
      lit,
      distance: Math.floor(game.state.distance),
      entities: game.entities.length,
      samples
    };
  });
}

async function capture(browser, viewport, fileName) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.cryptRunner3D?.renderer?.getContext), null, { timeout: 30000 });
  await page.waitForTimeout(2800);
  const probe = await probePage(page);
  await page.screenshot({ path: join(root, fileName), fullPage: false });
  await page.close();
  if (errors.length) {
    throw new Error(`Browser errors: ${errors.join("; ")}`);
  }
  return { fileName, probe };
}

async function run() {
  const { chromium } = await loadPlaywright();
  const server = await serveSite();
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: localChrome,
      args: [
        "--disable-gpu",
        "--disable-gpu-sandbox",
        "--enable-webgl",
        "--enable-unsafe-swiftshader",
        "--use-angle=swiftshader",
        "--ignore-gpu-blocklist",
        "--mute-audio"
      ]
    });
    const desktop = await capture(browser, { width: 1365, height: 768 }, "smoke-desktop.png");
    const mobile = await capture(browser, { width: 390, height: 844, isMobile: true }, "smoke-mobile.png");
    if (!desktop.probe.ok || !mobile.probe.ok) {
      throw new Error(`Canvas probe failed: ${JSON.stringify({ desktop, mobile })}`);
    }
    console.log(JSON.stringify({ desktop, mobile }, null, 2));
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
