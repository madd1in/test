const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const required = ["index.html", "style.css", "game.js"];

for (const file of required) {
  assertFile(path.join(root, file));
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const id of [
  "game", "minimap", "hearts", "sealCount", "keyCount", "bagCount",
  "potionCount", "rankText", "timeText", "questText", "progressBar",
  "toast", "startOverlay", "pauseOverlay", "endOverlay", "fullscreenButton"
]) {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`Missing DOM id: ${id}`);
  }
}

const gameJs = fs.readFileSync(path.join(root, "game.js"), "utf8");
const assetRefs = [...gameJs.matchAll(/"assets\/[^"]+"/g)].map((match) => match[0].slice(1, -1));
if (assetRefs.length < 20) {
  throw new Error(`Expected local asset manifest, found only ${assetRefs.length} refs`);
}

for (const asset of assetRefs) {
  assertFile(path.join(root, asset));
}

const tileAtlas = path.join(root, "assets", "environment", "tile-sprite-map-quality-seamless-v9.png");
const tileAtlasSize = readPngSize(tileAtlas);
if (tileAtlasSize.width !== 6528 || tileAtlasSize.height !== 128) {
  throw new Error(`Tile atlas must be 6528x128, got ${tileAtlasSize.width}x${tileAtlasSize.height}`);
}

const enemyAtlas = path.join(root, "assets", "characters", "enemy-sprite-map-animated-v2.png");
const enemyAtlasSize = readPngSize(enemyAtlas);
if (enemyAtlasSize.width !== 2048 || enemyAtlasSize.height !== 128) {
  throw new Error(`Enemy atlas must be 2048x128, got ${enemyAtlasSize.width}x${enemyAtlasSize.height}`);
}

const objectAtlas = path.join(root, "assets", "items", "object-sprite-map-imagen.png");
const objectAtlasSize = readPngSize(objectAtlas);
if (objectAtlasSize.width !== 864 || objectAtlasSize.height !== 96) {
  throw new Error(`Object atlas must be 864x96, got ${objectAtlasSize.width}x${objectAtlasSize.height}`);
}

const playerAtlas = path.join(root, "assets", "characters", "player-sprite-map-combat-v2.png");
const playerAtlasSize = readPngSize(playerAtlas);
if (playerAtlasSize.width !== 2304 || playerAtlasSize.height !== 96) {
  throw new Error(`Player atlas must be 2304x96, got ${playerAtlasSize.width}x${playerAtlasSize.height}`);
}

const slashAtlas = path.join(root, "assets", "ui", "slash-sprite-map.png");
const slashAtlasSize = readPngSize(slashAtlas);
if (slashAtlasSize.width !== 384 || slashAtlasSize.height !== 96) {
  throw new Error(`Slash atlas must be 384x96, got ${slashAtlasSize.width}x${slashAtlasSize.height}`);
}

console.log(`Smoke OK: ${assetRefs.length} local assets referenced and present.`);

function assertFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }
  if (fs.statSync(filePath).size === 0) {
    throw new Error(`Empty file: ${filePath}`);
  }
}

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error(`Not a PNG: ${filePath}`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}
