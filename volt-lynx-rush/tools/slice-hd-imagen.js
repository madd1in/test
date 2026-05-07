const fs = require("node:fs");
const path = require("node:path");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require("C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
}

const root = path.resolve(__dirname, "..");
const hdDir = path.join(root, "assets", "imagen-hd");
const sourcePath = path.join(hdDir, "volt-lynx-hd-tile-sprite-map.png");
const manifestPath = path.join(hdDir, "manifest.json");
const outDir = path.join(hdDir, "sliced");

async function run() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  fs.mkdirSync(outDir, { recursive: true });
  const sourceData = fs.readFileSync(sourcePath).toString("base64");
  const sourceUrl = `data:image/png;base64,${sourceData}`;
  const executablePath = [
    chromium.executablePath(),
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe"
  ].find((candidate) => candidate && fs.existsSync(candidate));
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
    await page.setContent(`<!doctype html><html><body><img id="source" src="${sourceUrl}" /></body></html>`);
    await page.waitForFunction(() => {
      const image = document.querySelector("#source");
      return image && image.complete && image.naturalWidth > 0;
    });

    const sliced = { source: manifest.source, frames: {} };
    for (const [name, frame] of Object.entries(manifest.frames)) {
      const pngBase64 = await page.evaluate(({ frame }) => {
        const source = document.querySelector("#source");
        const canvas = document.createElement("canvas");
        canvas.width = frame.w;
        canvas.height = frame.h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(source, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
        return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
      }, { frame });
      const file = `${name}.png`;
      fs.writeFileSync(path.join(outDir, file), Buffer.from(pngBase64, "base64"));
      sliced.frames[name] = { file, w: frame.w, h: frame.h };
    }
    fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify(sliced, null, 2)}\n`);
    console.log(JSON.stringify({ ok: true, frames: Object.keys(sliced.frames).length, outDir }, null, 2));
  } finally {
    await browser.close().catch(() => {});
  }
}

run().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
