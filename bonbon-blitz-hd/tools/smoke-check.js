const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "game.js",
  "assets/candies/berry-glaze.svg",
  "assets/candies/citrus-star.svg",
  "assets/candies/mint-drop.svg",
  "assets/candies/plum-moon.svg",
  "assets/candies/ruby-heart.svg",
  "assets/candies/cocoa-cube.svg",
  "assets/candies/vanilla-spiral.svg",
  "assets/candies/sky-jelly.svg",
  "assets/candies/prism-swirl.svg",
  "assets/generated/candy-asset-sheet-imagen-hd.png",
  "assets/generated/candy-festival-backdrop-imagen-hd.png",
  "assets/generated/candy-lagoon-backdrop-imagen-hd.png",
  "assets/generated/caramel-workshop-backdrop-imagen-hd.png",
  "assets/environment/candy-garden-bg.svg",
  "assets/ui/logo.svg",
  "assets/ui/hammer.svg",
  "assets/ui/shuffle.svg",
  "assets/audio/bgm/marzipan-compass.mp3",
  "assets/audio/sfx/soft-chime.mp3",
  "assets/audio/sfx/pickup-gem.mp3",
  "assets/audio/sfx/treasure-clink.mp3",
  "assets/audio/sfx/ui-confirm.mp3",
  "assets/audio/sfx/upgrade-card.mp3",
  "tools/static-server.js"
];

for (const file of required) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Missing ${file}`);
  }
}

const gameJs = fs.readFileSync(path.join(root, "game.js"), "utf8");
for (const token of ["findMatches", "attemptSwap", "resolveSpecialSwap", "collapseColumns", "WORLD_THEMES", "collectOrder"]) {
  if (!gameJs.includes(token)) {
    throw new Error(`Missing gameplay token ${token}`);
  }
}

console.log(`Smoke check passed: ${required.length} files present.`);
