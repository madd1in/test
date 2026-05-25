const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const js = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");

const requiredHtml = [
  '<canvas id="game"',
  '<canvas id="next"',
  'id="overlay"',
  'id="primaryButton"',
  'id="pauseButton"',
  'data-action="left"',
  'data-action="rotate"',
  'src="js/game.js"'
];

for (const token of requiredHtml) {
  if (!html.includes(token)) {
    throw new Error(`Missing HTML token: ${token}`);
  }
}

const requiredCss = [
  ".app-shell",
  ".play-area",
  ".hud__stats",
  ".touch-controls",
  "assets/hd/background-lab-hd.png",
  "@media (max-width: 860px)"
];

for (const token of requiredCss) {
  if (!css.includes(token)) {
    throw new Error(`Missing CSS token: ${token}`);
  }
}

const requiredJs = [
  "function buildLevel",
  "function findMatches",
  "function applyGravityStep",
  "function clearMatches",
  "function hardDrop",
  "function rotatePiece",
  "function drawBottle",
  "function loadAssets",
  "localStorage",
  "AudioContext"
];

for (const token of requiredJs) {
  if (!js.includes(token)) {
    throw new Error(`Missing game system: ${token}`);
  }
}

new vm.Script(js, { filename: "game.js" });

function readPngSize(file) {
  const buffer = fs.readFileSync(file);
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error(`Not a PNG: ${file}`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

const assets = [
  ["assets/hd/background-lab-hd.png", 1920, 1080],
  ["assets/hd/capsule-atlas-hd.png", 1024, 256],
  ["assets/hd/virus-atlas-hd.png", 1024, 256],
  ["assets/hd/bottle-frame-hd.png", 1200, 1700],
  ["assets/hd/fx-atlas-hd.png", 1024, 256],
  ["assets/hd/asset-manifest.json", 0, 0]
];

for (const [asset, width, height] of assets) {
  const file = path.join(root, asset);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing asset: ${asset}`);
  }
  if (width && height) {
    const size = readPngSize(file);
    if (size.width !== width || size.height !== height) {
      throw new Error(`Unexpected size for ${asset}: ${size.width}x${size.height}`);
    }
  }
}

console.log("Smoke test passed: Capsule Clinic HD static files, systems, and PNG assets are present.");
