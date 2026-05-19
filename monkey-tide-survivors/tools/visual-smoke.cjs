const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const bundledNodeModules = "C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";

function mime(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".mp3")) return "audio/mpeg";
  if (file.endsWith(".wav")) return "audio/wav";
  return "application/octet-stream";
}

function resolvePlaywright() {
  try {
    return require("playwright");
  } catch {
    try {
      return require(path.join(bundledNodeModules, "playwright"));
    } catch {
      return require(path.join(bundledNodeModules, ".pnpm", "playwright@1.59.1", "node_modules", "playwright"));
    }
  }
}

function staticServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
    const target = path.resolve(root, rel);
    if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": mime(target) });
    fs.createReadStream(target).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function capturePng(page, outputPath) {
  const session = await page.context().newCDPSession(page);
  try {
    const result = await session.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
      fromSurface: true,
    });
    fs.writeFileSync(outputPath, Buffer.from(result.data, "base64"));
  } finally {
    await session.detach().catch(() => {});
  }
}

async function run() {
  const { chromium } = resolvePlaywright();
  const server = await staticServer();
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const chromeCandidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe",
  ];
  const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => window.__MONKEY_TIDE_READY === true, null, { timeout: 90000 });
  await page.click('[data-skin="freelanceDuo"]');
  await page.evaluate(() => window.__MONKEY_TIDE_START());
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__MONKEY_TIDE_STEP(5));
  await page.evaluate(() => window.__MONKEY_TIDE_PROP_VISUAL_PROBE());
  await page.evaluate(() => window.__MONKEY_TIDE_THREE_MONKEY_PROBE());
  await page.evaluate(() => window.__MONKEY_TIDE_NEW_ENEMY_PROBE());
  await capturePng(page, path.join(root, "preview.png"));
  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 5000))]);
  if (typeof server.closeIdleConnections === "function") server.closeIdleConnections();
  if (typeof server.closeAllConnections === "function") server.closeAllConnections();
  await Promise.race([new Promise((resolve) => server.close(resolve)), new Promise((resolve) => setTimeout(resolve, 5000))]);
  console.log(`visual ok ${url}`);
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
