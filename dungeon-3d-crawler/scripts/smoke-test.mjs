import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browserCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
];
const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".png", "image/png"],
  [".mp3", "audio/mpeg"]
]);

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  const rawPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(root, decodeURIComponent(rawPath)));
  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": mime.get(ext) || "application/octet-stream" });
  res.end(await readFile(filePath));
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;
const executablePath = browserCandidates.find((candidate) => existsSync(candidate));
const browser = await chromium.launch({ headless: true, executablePath });
const results = [];

async function runViewport(name, viewport) {
  const mobile = name === "mobile";
  const page = await browser.newPage({ viewport, hasTouch: mobile, isMobile: mobile });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) errors.push(msg.text());
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.click("#overlayStartBtn");
  await page.waitForTimeout(1400);
  await page.keyboard.press("KeyW");
  await page.waitForTimeout(260);
  await page.keyboard.press("KeyQ");
  await page.waitForTimeout(260);
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);
  if (name === "mobile") {
    const box = await page.locator("#game").boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 110, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(320);
  }

  const sample = await page.evaluate(async () => {
    const canvas = document.querySelector("#game");
    const url = canvas.toDataURL("image/png");
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    const probe = document.createElement("canvas");
    probe.width = 96;
    probe.height = 54;
    const ctx = probe.getContext("2d");
    ctx.drawImage(image, 0, 0, probe.width, probe.height);
    const pixels = ctx.getImageData(0, 0, probe.width, probe.height).data;
    let lit = 0;
    let varied = 0;
    let last = null;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      if (r + g + b > 35) lit += 1;
      const key = `${r},${g},${b}`;
      if (last !== key) varied += 1;
      last = key;
    }
    return {
      lit,
      varied,
      message: document.querySelector("#messageText").textContent,
      scrollOk: document.documentElement.scrollWidth <= window.innerWidth + 1,
      overlayHidden: document.querySelector("#startOverlay").classList.contains("is-hidden"),
      fullscreenButton: Boolean(document.querySelector("#fullscreenBtn")),
      mobileMode: document.body.classList.contains("mobile-mode")
    };
  });

  const screenshotPath = path.join(root, `smoke-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await page.close();

  if (errors.length) throw new Error(`${name} browser errors: ${errors.join(" | ")}`);
  if (!sample.overlayHidden) throw new Error(`${name} start overlay did not hide`);
  if (!sample.scrollOk) throw new Error(`${name} horizontal overflow detected`);
  if (!sample.fullscreenButton) throw new Error(`${name} fullscreen button missing`);
  if (name === "mobile" && !sample.mobileMode) throw new Error("mobile mode did not activate");
  if (sample.lit < 700 || sample.varied < 1000) {
    throw new Error(`${name} canvas looks blank: ${JSON.stringify(sample)}`);
  }
  results.push({ name, screenshotPath, ...sample });
}

try {
  await runViewport("desktop", { width: 1280, height: 720 });
  await runViewport("mobile", { width: 390, height: 844 });
  console.log(JSON.stringify({ ok: true, results }, null, 2));
} finally {
  await browser.close();
  server.close();
}
