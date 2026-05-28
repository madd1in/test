const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "vendor/phaser.min.js",
  "assets/generated/emberwild-key-art.png",
  "assets/generated/emberwild-shrine-hd.png",
  "assets/generated/emberwild-ward-hd.png",
  "assets/generated/ashwarden-boss-hd.png",
  "assets/generated/tile-atlas-imagen-hd-source.png",
  "assets/environment/tiles-imagen-hd.png",
  "assets/environment/objects.png",
  "assets/characters/player.png",
  "assets/characters/thornling.png",
  "assets/characters/ashwarden.png",
  "assets/fx/slash.png",
  "assets/audio/bgm/moonlit-castle-ruins.mp3",
  "assets/audio/bgm/ashwarden-boss.mp3",
  "assets/audio/sfx/slash.mp3",
  "assets/audio/sfx/dash.wav",
  "assets/audio/sfx/pickup-gem.wav",
  "assets/audio/sfx/gate-open.ogg",
  "assets/audio/sfx/beacon.wav",
  "assets/audio/sfx/enemy-hurt.wav",
  "assets/audio/sfx/player-hit.wav",
  "assets/audio/sfx/heal.wav",
  "assets/audio/sfx/ui-confirm.wav",
  "assets/audio/sfx/boss-die.wav",
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
