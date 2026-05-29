const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "js/game.js",
  "assets/generated/trail-backdrop-imagen.webp",
  "assets/sprites/rider-imagen.webp",
  "assets/foreground/front-tiles-imagen.webp",
  "assets/foreground/trail-props-imagen.webp",
  "assets/imagen/coin-imagen.webp",
  "assets/imagen/flag-imagen.webp",
  "assets/audio/ridge-bgm.wav",
  "assets/audio/jump.wav",
  "assets/audio/land.wav",
  "assets/audio/pickup.wav",
  "assets/audio/crash.wav",
  "assets/ui/rock.svg",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error(`Missing files:\n${missing.join("\n")}`);
  process.exit(1);
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const game = fs.readFileSync(path.join(root, "js/game.js"), "utf8");

for (const token of ["<canvas", "./js/game.js", "coin-imagen.webp", "flag-imagen.webp", "ridge-bgm.wav"]) {
  if (!html.includes(token) && !game.includes(token)) {
    console.error(`Expected token not found: ${token}`);
    process.exit(1);
  }
}

for (const token of ["flagGroundAnchor", "groundInset", "foot:", '"ramp"']) {
  if (!game.includes(token)) {
    console.error(`Expected terrain anchor token not found: ${token}`);
    process.exit(1);
  }
}

if (/const lift = prop\.name/.test(game)) {
  console.error("Prop rendering still uses the old lifted-frame positioning.");
  process.exit(1);
}

if (!/requestAnimationFrame\(loop\)/.test(game) || !/function terrainY/.test(game)) {
  console.error("Game loop or terrain function was not found.");
  process.exit(1);
}

console.log("Ridge Rider smoke test passed.");
