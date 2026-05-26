const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "README.md",
  "js/level.js",
  "js/game.js",
  "tools/build-assets.cjs",
  "assets/vendor/three.module.js",
  "assets/textures/hull.svg",
  "assets/textures/enemy.svg",
  "assets/textures/asteroid.svg",
  "assets/textures/ring.svg",
  "assets/textures/plasma.svg",
  "assets/generated/nova-nebula-panorama.png",
  "assets/generated/nova-hull-albedo.png",
  "assets/generated/nova-enemy-albedo.png",
  "assets/generated/nova-asteroid-albedo.png",
  "assets/generated/nova-ring-emissive.png",
  "assets/generated/nova-prism-core.png",
  "assets/generated/nova-logo.png",
  "assets/generated/nova-decal-atlas.png",
  "assets/audio/nova-bgm-loop.wav",
  "assets/audio/laser.wav",
  "assets/audio/explosion.wav",
  "assets/audio/pickup.wav",
  "assets/audio/hit.wav",
  "assets/audio/boost.wav",
  "assets/audio/win.wav",
  "tools/serve.cjs",
  "tools/browser-smoke.cjs",
];

for (const rel of required) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) throw new Error(`Missing ${rel}`);
  if (fs.statSync(file).size <= 0) throw new Error(`Empty ${rel}`);
}

for (const rel of ["js/level.js", "js/game.js", "tools/build-assets.cjs", "tools/serve.cjs", "tools/browser-smoke.cjs"]) {
  execFileSync(process.execPath, ["--check", path.join(root, rel)], { stdio: "pipe" });
}

(async () => {
  const level = await import(pathToFileURL(path.join(root, "js", "level.js")));
  if (level.COURSE_LENGTH < 4000) throw new Error("Course should feel like a full mission");
  if (level.WAVE_BLUEPRINTS.length < 12) throw new Error("Expected a varied enemy mission");
  if (level.RINGS.length < 20) throw new Error("Expected boost ring route");
  if (level.OBSTACLES.length < 35) throw new Error("Expected asteroid and crystal hazards");
  if (level.PICKUPS.length < 5) throw new Error("Expected repair, shield, and charge pickups");
  if (level.DATA_CORES.length < 8) throw new Error("Expected optional data core collectibles");
  if (level.TUNNEL_GATES.length < 40) throw new Error("Expected tunnel gate depth markers");
  if (!level.WAVE_BLUEPRINTS.some((wave) => wave.type === "prism")) throw new Error("Expected prism elite waves");

  const gameSource = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  for (const token of [
    "createPlayerShip",
    "spawnScheduledWaves",
    "spawnBoss",
    "updateStaticInteractions",
    "touchControls",
    "__novaWingDebug",
    "Aegis Prism",
    "updateWingDrones",
    "dataCoreCollected",
    "comboTimer",
    "startBgm",
    "playSfx",
    "nova-nebula-panorama.png",
    "useNovaBurst",
    "registerGraze",
    "missionMedals",
    "novaFill",
  ]) {
    if (!gameSource.includes(token)) throw new Error(`Missing gameplay token: ${token}`);
  }
  if (/star\s*fox/i.test(gameSource)) throw new Error("Do not use protected franchise naming in source");

  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  if (!html.includes('type="module" src="js/game.js"')) throw new Error("Module script missing");
  if (!html.includes("touchControls")) throw new Error("Touch controls missing");
  if (!html.includes("Nova Wing 3D")) throw new Error("Original title missing");

  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  for (const color of ["#44e6ff", "#ffca62", "#ff5f9a", "#b7ff68"]) {
    if (!css.includes(color)) throw new Error(`Theme color missing: ${color}`);
  }

  const vendorSize = fs.statSync(path.join(root, "assets", "vendor", "three.module.js")).size;
  if (vendorSize < 1000000) throw new Error("Three.js vendor file looks truncated");

  const pngs = [
    "nova-nebula-panorama.png",
    "nova-hull-albedo.png",
    "nova-enemy-albedo.png",
    "nova-asteroid-albedo.png",
    "nova-ring-emissive.png",
    "nova-prism-core.png",
    "nova-logo.png",
    "nova-decal-atlas.png",
  ];
  for (const name of pngs) {
    const file = path.join(root, "assets", "generated", name);
    const header = fs.readFileSync(file).subarray(1, 4).toString("ascii");
    if (header !== "PNG" || fs.statSync(file).size < 20000) throw new Error(`Generated PNG looks invalid: ${name}`);
  }

  const wavs = ["nova-bgm-loop.wav", "laser.wav", "explosion.wav", "pickup.wav", "hit.wav", "boost.wav", "win.wav"];
  for (const name of wavs) {
    const file = path.join(root, "assets", "audio", name);
    const header = fs.readFileSync(file).subarray(0, 4).toString("ascii");
    if (header !== "RIFF" || fs.statSync(file).size < 12000) throw new Error(`Generated WAV looks invalid: ${name}`);
  }

  console.log("Nova Wing 3D smoke test passed");
  console.log(`${level.WAVE_BLUEPRINTS.length} waves, ${level.RINGS.length} rings, ${level.OBSTACLES.length} hazards`);
})();
