const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "js/game.js",
  "assets/generated/trail-backdrop-imagen.png",
  "assets/sprites/rider-imagen.png",
  "assets/ui/energy-ring.svg",
  "assets/ui/rock.svg",
  "assets/ui/trail-flag.svg",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error(`Missing files:\n${missing.join("\n")}`);
  process.exit(1);
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const game = fs.readFileSync(path.join(root, "js/game.js"), "utf8");

for (const token of ["<canvas", "./js/game.js", "trail-backdrop-imagen.png", "rider-imagen.png"]) {
  if (!html.includes(token) && !game.includes(token)) {
    console.error(`Expected token not found: ${token}`);
    process.exit(1);
  }
}

if (!/requestAnimationFrame\(loop\)/.test(game) || !/function terrainY/.test(game)) {
  console.error("Game loop or terrain function was not found.");
  process.exit(1);
}

console.log("Ridge Rider smoke test passed.");
