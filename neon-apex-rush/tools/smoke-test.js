const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "game.js",
  "assets/images/key-art.png",
  "assets/images/bg-clean-imagen.png",
  "assets/images/horizon-3d-imagen.png",
  "assets/images/parallax-foreground-imagen.png",
  "assets/images/road-texture-imagen.png",
  "assets/images/player-chase-source.png",
  "assets/images/player-chase-imagen.png",
  "assets/images/player-car-sheet-source.png",
  "assets/images/player-car-sheet.png",
  "assets/images/rival-car-imagen-source.png",
  "assets/images/rival-car-imagen.png",
  "assets/images/rival-car-sheet-source.png",
  "assets/images/rival-car-sheet.png",
  "assets/images/item-morph-sheet-source.png",
  "assets/images/item-morph-sheet.png",
  "assets/images/boost-gate-sheet-source.png",
  "assets/images/boost-gate-sheet.png",
  "assets/images/status-badge-sheet-source.png",
  "assets/images/status-badge-sheet.png",
  "assets/images/boost-cell-imagen-source.png",
  "assets/images/boost-cell-imagen.png",
  "assets/images/boost-pad-imagen-source.png",
  "assets/images/boost-pad-imagen.png",
  "assets/images/drone-imagen-source.png",
  "assets/images/drone-imagen.png",
  "assets/images/ui-panel-imagen-source.png",
  "assets/images/ui-panel-imagen.png",
  "assets/images/player-car.svg",
  "assets/images/traffic-ruby.svg",
  "assets/images/traffic-cyan.svg",
  "assets/images/traffic-gold.svg",
  "assets/images/boost-cell.svg",
  "assets/images/boost-pad.svg",
  "assets/images/hazard-drone.svg",
  "assets/images/skyline.svg",
  "assets/audio/bgm-loop.wav",
  "assets/audio/engine-loop.wav",
  "assets/audio/boost.wav",
  "assets/audio/crash.wav",
  "assets/audio/pickup.wav",
  "assets/audio/checkpoint.wav",
  "assets/audio/local/ridge-bgm.wav",
  "assets/audio/local/ridge-crash.wav",
  "assets/audio/local/ridge-pickup.wav",
  "assets/audio/local/ridge-finish.wav",
  "assets/audio/downloads/jet-fuel-glory-upbeat.mp3",
  "assets/audio/downloads/retro-pickup.mp3",
  "assets/audio/downloads/retro-boost.mp3",
  "assets/audio/downloads/playful-checkpoint.mp3",
  "assets/audio/downloads/healing-sparkle.mp3",
  "assets/audio/downloads/arcade-impact.mp3"
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error(`Missing files:\n${missing.join("\n")}`);
  process.exit(1);
}

const check = spawnSync(process.execPath, ["--check", path.join(root, "game.js")], { encoding: "utf8" });
if (check.status !== 0) {
  console.error(check.stderr || check.stdout);
  process.exit(check.status || 1);
}

for (const audio of required.filter((file) => file.endsWith(".wav"))) {
  const buffer = fs.readFileSync(path.join(root, audio));
  const riff = buffer.toString("ascii", 0, 4);
  const wave = buffer.toString("ascii", 8, 12);
  if (riff !== "RIFF" || wave !== "WAVE" || buffer.length < 1000) {
    console.error(`Invalid WAV asset: ${audio}`);
    process.exit(1);
  }
}

for (const audio of required.filter((file) => file.endsWith(".mp3"))) {
  const buffer = fs.readFileSync(path.join(root, audio));
  const id3 = buffer.toString("ascii", 0, 3);
  const frame = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
  if ((id3 !== "ID3" && !frame) || buffer.length < 1000) {
    console.error(`Invalid MP3 asset: ${audio}`);
    process.exit(1);
  }
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const js = fs.readFileSync(path.join(root, "game.js"), "utf8");
if (!html.includes("itemValue") || !html.includes("rushValue") || !js.includes("requestAnimationFrame") || !js.includes("AudioDeck") || !js.includes("drawMode7Road") || !js.includes("itemMorphSheet") || !js.includes("playerSheet") || !js.includes("bgClean") || !js.includes("boostGateSheet") || !js.includes("bgmDownload")) {
  console.error("Game wiring check failed.");
  process.exit(1);
}

console.log("Smoke test passed: files, JS syntax, image references, and WAV headers look good.");
