const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const required = ["index.html", "style.css", "game.js"];

for (const file of required) {
  assertFile(path.join(root, file));
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const id of [
  "game", "minimap", "hearts", "sealCount", "keyCount", "bagCount",
  "potionCount", "rankText", "timeText", "questText", "progressBar",
  "toast", "startOverlay", "pauseOverlay", "endOverlay", "fullscreenButton"
]) {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`Missing DOM id: ${id}`);
  }
}

const gameJs = fs.readFileSync(path.join(root, "game.js"), "utf8");
const assetRefs = [...gameJs.matchAll(/"assets\/[^"]+"/g)].map((match) => match[0].slice(1, -1));
if (assetRefs.length < 20) {
  throw new Error(`Expected local asset manifest, found only ${assetRefs.length} refs`);
}

for (const asset of assetRefs) {
  assertFile(path.join(root, asset));
}

console.log(`Smoke OK: ${assetRefs.length} local assets referenced and present.`);

function assertFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }
  if (fs.statSync(filePath).size === 0) {
    throw new Error(`Empty file: ${filePath}`);
  }
}
