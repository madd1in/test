const fs = require("node:fs");
const path = require("node:path");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require("C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
}

const root = path.resolve(__dirname, "..");
const atlasPath = path.join(root, "assets", "asset-map.svg");
const mapPath = path.join(root, "assets", "asset-map.json");
const outDir = path.join(root, "assets", "sliced");

async function run() {
  const assetMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const atlasSvg = fs.readFileSync(atlasPath, "utf8");
  fs.mkdirSync(outDir, { recursive: true });

  const executablePath = [
    chromium.executablePath(),
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe"
  ].find((candidate) => candidate && fs.existsSync(candidate));
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 512 } });
    await page.setContent(
      `<!doctype html><html><body><img id="atlas" alt="" /></body></html>`,
      { waitUntil: "domcontentloaded" }
    );
    await page.evaluate((svg) => {
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = document.querySelector("#atlas");
      img.src = url;
      return new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    }, atlasSvg);

    const manifest = { source: "asset-map.svg", frames: {} };
    for (const [name, frame] of Object.entries(assetMap.frames)) {
      const pngBase64 = await page.evaluate(({ name, frame }) => {
        const img = document.querySelector("#atlas");
        const canvas = document.createElement("canvas");
        canvas.width = frame.w;
        canvas.height = frame.h;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, frame.w, frame.h);
        ctx.drawImage(img, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
        return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
      }, { name, frame });
      const filename = `${name}.png`;
      fs.writeFileSync(path.join(outDir, filename), Buffer.from(pngBase64, "base64"));
      manifest.frames[name] = { file: filename, w: frame.w, h: frame.h };
    }
    fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(JSON.stringify({ ok: true, frames: Object.keys(assetMap.frames).length, outDir }, null, 2));
  } finally {
    await browser.close().catch(() => {});
  }
}

run().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
