const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "README.md",
  "package.json",
  "assets/vendor/three.module.js",
  "js/game.js",
  "tools/serve.cjs",
];

for (const file of required) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing ${file}`);
  }
}

execFileSync(process.execPath, ["--check", path.join(root, "js/game.js")], { stdio: "pipe" });

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const id of ["game", "hud", "startButton", "pauseButton", "resultOverlay", "touchControls"]) {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`Missing #${id}`);
  }
}
if (!html.includes('type="module" src="js/game.js"')) {
  throw new Error("Game module script tag is missing");
}

const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
if (!css.includes(".touch-controls") || !css.includes("@media (max-width: 760px)")) {
  throw new Error("Responsive touch UI is missing");
}

const source = fs.readFileSync(path.join(root, "js/game.js"), "utf8");
for (const token of [
  "class Simulation",
  "class GameView",
  "class InputController",
  "collectCore",
  "triggerDamage",
  "createPlayerSkiff",
  "createReefTexture",
]) {
  if (!source.includes(token)) {
    throw new Error(`Missing gameplay hook ${token}`);
  }
}

const vendorSize = fs.statSync(path.join(root, "assets/vendor/three.module.js")).size;
if (vendorSize < 1000000) {
  throw new Error("Three.js vendor file looks truncated");
}

console.log("Aether Reef 3D smoke test passed");
