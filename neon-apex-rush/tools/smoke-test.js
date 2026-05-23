const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "game.js",
  "assets/images/key-art.png",
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
  "assets/audio/checkpoint.wav"
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

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const js = fs.readFileSync(path.join(root, "game.js"), "utf8");
if (!html.includes("gameCanvas") || !js.includes("requestAnimationFrame") || !js.includes("AudioDeck")) {
  console.error("Game wiring check failed.");
  process.exit(1);
}

console.log("Smoke test passed: files, JS syntax, image references, and WAV headers look good.");
