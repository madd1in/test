const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "vendor/phaser.min.js",
  "assets/generated/emberwild-key-art.png",
  "assets/environment/tiles.png",
  "assets/environment/objects.png",
  "assets/characters/player.png",
  "assets/characters/thornling.png",
  "assets/characters/ashwarden.png",
  "assets/fx/slash.png",
  "js/assets.js",
  "js/sim.js",
  "js/game.js",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error(`Missing files:\n${missing.join("\n")}`);
  process.exit(1);
}

for (const file of required.filter((item) => item.endsWith(".png") || item.endsWith(".js"))) {
  const size = fs.statSync(path.join(root, file)).size;
  if (size <= 0) {
    console.error(`Empty file: ${file}`);
    process.exit(1);
  }
}

console.log(`Asset smoke passed for ${required.length} files.`);
