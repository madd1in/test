const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const bundledNodeModules = "C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";

function resolvePlaywright() {
  try {
    return require("playwright");
  } catch {
    return require(path.join(bundledNodeModules, "playwright"));
  }
}

function mime(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".mp3")) return "audio/mpeg";
  if (file.endsWith(".ogg")) return "audio/ogg";
  if (file.endsWith(".wav")) return "audio/wav";
  return "application/octet-stream";
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
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function closeBrowser(browser) {
  let closed = false;
  const closePromise = browser.close()
    .then(() => { closed = true; })
    .catch(() => { closed = true; });
  await Promise.race([
    closePromise,
    new Promise((resolve) => setTimeout(resolve, 5000))
  ]);
  if (!closed && typeof browser.process === "function") {
    const proc = browser.process();
    if (proc && !proc.killed) proc.kill();
  }
}

async function closeServer(server) {
  if (typeof server.closeIdleConnections === "function") server.closeIdleConnections();
  if (typeof server.closeAllConnections === "function") server.closeAllConnections();
  await new Promise((resolve) => server.close(() => resolve()));
}

function percentile(values, pct) {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * pct))];
}

(async () => {
  const { chromium } = resolvePlaywright();
  const server = await staticServer();
  const port = server.address().port;
  const chromeCandidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe"
  ];
  const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--autoplay-policy=no-user-gesture-required", "--allow-file-access-from-files"]
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({
    status: 200,
    contentType: "text/css; charset=utf-8",
    body: ""
  }));
  await page.route("https://fonts.gstatic.com/**", (route) => route.fulfill({
    status: 200,
    contentType: "font/woff2",
    body: ""
  }));

  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => window.__NOCTURNE_READY === true, null, { timeout: 90000 });
  await page.click("#startButton");
  await page.waitForTimeout(500);

  const result = await page.evaluate(async () => {
    window.__NOCTURNE_TEST_TELEPORT("courtyard", 1072, 352);
    window.__NOCTURNE_PERF_RESET();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const samples = [];
    let last = performance.now();
    const end = last + 3200;
    while (performance.now() < end) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const now = performance.now();
      samples.push(now - last);
      last = now;
    }
    return { samples, state: window.__NOCTURNE_DEBUG_STATE(), perf: window.__NOCTURNE_PERF_STATS() };
  });

  const samples = result.samples.filter((value) => Number.isFinite(value) && value > 0);
  const summary = {
    frames: samples.length,
    avgMs: Number((samples.reduce((sum, value) => sum + value, 0) / samples.length).toFixed(2)),
    p95Ms: Number(percentile(samples, 0.95).toFixed(2)),
    maxMs: Number(Math.max(...samples).toFixed(2)),
    over20ms: samples.filter((value) => value > 20).length,
    over33ms: samples.filter((value) => value > 33.4).length,
    internalPerf: result.perf,
    drawbridgeCache: result.state.drawbridgeCache,
    introBridge: result.state.introBridge
  };

  console.log(JSON.stringify(summary, null, 2));

  if (summary.internalPerf.draw.p95 > 14) throw new Error(`Drawbridge internal draw p95 too high: ${summary.internalPerf.draw.p95}ms`);
  if (summary.internalPerf.frame.p95 > 18) throw new Error(`Drawbridge internal frame p95 too high: ${summary.internalPerf.frame.p95}ms`);
  if (summary.drawbridgeCache.chains > 2) throw new Error(`Chain cache churn: ${summary.drawbridgeCache.chains}`);
  if (!summary.drawbridgeCache.mode7) throw new Error("Mode7 floor cache was not populated");
  await closeBrowser(browser);
  await closeServer(server);
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
