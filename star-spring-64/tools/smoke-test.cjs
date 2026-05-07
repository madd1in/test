const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "js/game.js",
  "js/level.js",
  "assets/vendor/three.module.js",
  "tools/build-assets.cjs",
  "tools/browser-smoke.cjs",
  "tools/serve.cjs",
];

for (const file of required) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing ${file}`);
  }
}

for (const file of ["js/game.js", "js/level.js", "tools/build-assets.cjs", "tools/browser-smoke.cjs", "tools/serve.cjs"]) {
  execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "pipe" });
}

(async () => {
  const level = await import(pathToFileURL(path.join(root, "js", "level.js")));
  if (level.PLATFORMS.length < 22) throw new Error("Expected a multi-zone platform level");
  if (level.STARS.length < level.LEVEL_TARGET_STARS) throw new Error("Star target mismatch");
  if (level.LEVEL_TARGET_STARS > 10) throw new Error("Assist target should stay approachable");
  if (!level.PLATFORMS.some((platform) => platform.moving)) throw new Error("Expected moving platforms");
  if (level.SPRINGS.length < 6) throw new Error("Expected spring pads");
  if (!Array.isArray(level.BOOST_RINGS) || level.BOOST_RINGS.length < 7) throw new Error("Expected boost rings");
  if (!Array.isArray(level.WIND_COLUMNS) || level.WIND_COLUMNS.length < 5) throw new Error("Expected wind columns");
  if (level.ENEMIES.length < 9) throw new Error("Expected enemies");
  const enemyTypes = new Set(level.ENEMIES.map((enemy) => enemy.type || "bouncer"));
  for (const type of ["bouncer", "snapFlower", "crusher", "rocket"]) {
    if (!enemyTypes.has(type)) throw new Error(`Expected enemy type ${type}`);
  }
  if (!level.DECOR.some((decor) => decor.type === "pipe")) throw new Error("Expected pipe decor");

  const ids = new Set();
  for (const platform of level.PLATFORMS) {
    if (ids.has(platform.id)) throw new Error(`Duplicate platform id ${platform.id}`);
    ids.add(platform.id);
  }

  const textureNames = [
    "grass_tile.svg",
    "cliff_tile.svg",
    "brick_tile.svg",
    "flower_tile.svg",
    "cloud_tile.svg",
    "spring_pad.svg",
    "star_texture.svg",
    "hero_cloth.svg",
    "enemy_skin.svg",
    "water_tile.svg",
  ];
  for (const name of textureNames) {
    const texture = path.join(root, "assets", "textures", name);
    if (!fs.existsSync(texture) || fs.statSync(texture).size < 200) {
      throw new Error(`Texture asset missing or too small: ${name}`);
    }
  }

  const audioNames = ["jump.wav", "land.wav", "pickup.wav", "star.wav", "bounce.wav", "hurt.wav", "win.wav", "bgm_loop.wav", "downloads-bgm.mp3"];
  for (const name of audioNames) {
    const audio = path.join(root, "assets", "audio", name);
    if (!fs.existsSync(audio) || fs.statSync(audio).size < 4000) {
      throw new Error(`Audio asset missing or too small: ${name}`);
    }
  }

  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  if (!html.includes('type="module" src="js/game.js"')) throw new Error("Game module script tag missing");
  if (!html.includes("moveStick") || !html.includes("cameraStick")) throw new Error("Mobile joystick markup missing");
  if (!html.includes("fullscreenButton")) throw new Error("Fullscreen toggle markup missing");

  const vendorSize = fs.statSync(path.join(root, "assets", "vendor", "three.module.js")).size;
  if (vendorSize < 1000000) throw new Error("Three.js vendor file looks truncated");

  console.log("Star Spring 64 smoke test passed");
  console.log(`${level.PLATFORMS.length} platforms, ${level.STARS.length} stars, ${level.COINS.length} coins`);
})();
