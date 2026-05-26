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
  'id="overlayStateImage"',
  'id="primaryButton"',
  'imagen-title-logo-hd.png',
  'imagen-hud-logo-hd.png',
  'id="pauseButton"',
  'id="doseButton"',
  'id="assay"',
  'data-action="left"',
  'data-action="dose"',
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
  "assets/hd/background-lab-imagen-hd.jpg",
  "assets/hd/imagen-button-start-hd.png",
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
  "function useDose",
  "function hardDrop",
  "function rotatePiece",
  "function drawBottle",
  "function drawClearBursts",
  "function drawBackgroundPropLayer",
  "function drawScannerSweep",
  "function drawAssayBeacon",
  "function setOverlayVisual",
  "function setupAudioAssets",
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
  ["assets/hd/background-lab-imagen-hd.png", 1920, 1080],
  ["assets/hd/background-lab-imagen-hd.jpg", 0, 0],
  ["assets/hd/background-prop-atlas-hd.png", 1024, 512],
  ["assets/imagen-hd/imagen-lab-background-source.png", 1536, 1024],
  ["assets/hd/capsule-atlas-hd.png", 1024, 256],
  ["assets/hd/imagen-pill-anim-atlas-hd.png", 4096, 256],
  ["assets/hd/virus-atlas-hd.png", 1024, 256],
  ["assets/hd/virus-anim-atlas-hd.png", 4096, 256],
  ["assets/hd/bottle-frame-hd.png", 1200, 1700],
  ["assets/hd/imagen-vial-frame-hd.png", 1200, 1700],
  ["assets/hd/imagen-virus-anim-atlas-hd.png", 4096, 256],
  ["assets/hd/imagen-title-logo-hd.png", 1100, 320],
  ["assets/hd/imagen-hud-logo-hd.png", 760, 186],
  ["assets/hd/imagen-button-start-hd.png", 512, 192],
  ["assets/hd/imagen-button-restart-hd.png", 512, 192],
  ["assets/hd/imagen-button-resume-hd.png", 512, 192],
  ["assets/hd/imagen-overlay-ready-hd.png", 720, 170],
  ["assets/hd/imagen-overlay-paused-hd.png", 720, 170],
  ["assets/hd/imagen-overlay-gameover-hd.png", 720, 170],
  ["assets/hd/imagen-assay-badge-hd.png", 320, 112],
  ["assets/hd/imagen-status-ribbon-hd.png", 460, 120],
  ["assets/hd/fx-atlas-hd.png", 1024, 256],
  ["assets/hd/clear-fx-anim-atlas-hd.png", 2048, 256],
  ["assets/hd/lab-tile-atlas-hd.png", 1024, 1024],
  ["assets/imagen-hd/imagen-clinic-animation-atlas-source.png", 1254, 1254],
  ["assets/imagen-hd/imagen-gameplay-ui-source.png", 1536, 1024],
  ["assets/audio/bgm/local-lab-loop.mp3", 0, 0],
  ["assets/audio/sfx/local-confirm.wav", 0, 0],
  ["assets/audio/sfx/local-pickup.wav", 0, 0],
  ["assets/audio/sfx/local-impact.wav", 0, 0],
  ["assets/audio/sfx/local-clear.wav", 0, 0],
  ["assets/audio/sfx/local-gameover.wav", 0, 0],
  ["assets/audio/sfx/local-level.wav", 0, 0],
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
