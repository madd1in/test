const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "js/game.js",
  "assets/vendor/three.global.js",
  "assets/imagen/scene-atlas.png",
  "assets/imagen/enemy-atlas.png",
  "assets/imagen/party-atlas.png",
  "assets/imagen/surface-atlas.png",
  "assets/imagen/prop-atlas.png",
  "assets/imagen/enemy-frames.png",
  "assets/imagen/tile-detail-atlas.png",
  "assets/audio/bgm/aether-bgm-loop.mp3",
  "assets/audio/sfx/impact.mp3",
  "assets/audio/sfx/slash.wav",
  "assets/audio/sfx/hit.wav",
  "assets/audio/sfx/hurt.wav",
  "assets/audio/sfx/pickup.wav",
  "assets/audio/sfx/gate.wav",
  "assets/audio/sfx/gem-pickup.mp3",
  "assets/audio/sfx/relic-ping.mp3",
  "assets/audio/sfx/surge-burst.mp3",
];

for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing required file: ${file}`);
  }
  if (fs.statSync(full).size <= 0) {
    throw new Error(`Empty required file: ${file}`);
  }
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const id of ["viewport", "partyList", "miniMap", "logList"]) {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`Missing DOM mount: ${id}`);
  }
}

const script = fs.readFileSync(path.join(root, "js/game.js"), "utf8");
new vm.Script(script, { filename: "game.js" });

console.log("Smoke test passed: files, DOM mounts, assets, and JS syntax are present.");
