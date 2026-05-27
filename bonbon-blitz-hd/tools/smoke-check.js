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
  "assets/candies/prism-swirl.svg",
  "assets/generated/candy-asset-sheet-imagen-hd.png",
  "assets/environment/candy-garden-bg.svg",
  "assets/ui/logo.svg",
  "assets/ui/hammer.svg",
  "assets/ui/shuffle.svg",
  "tools/static-server.js"
];

for (const file of required) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Missing ${file}`);
  }
}

const gameJs = fs.readFileSync(path.join(root, "game.js"), "utf8");
for (const token of ["findMatches", "attemptSwap", "resolveSpecialSwap", "collapseColumns"]) {
  if (!gameJs.includes(token)) {
    throw new Error(`Missing gameplay token ${token}`);
  }
}

console.log(`Smoke check passed: ${required.length} files present.`);
