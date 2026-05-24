const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "game.js",
  "assets/generated/rift-loop-bg-source.png",
  "assets/generated/rift-loop-bg-tile.png",
  "assets/generated/rift-asset-sheet-alpha.png",
  "assets/generated/rift-props-sheet-alpha.png",
  "assets/generated/rift-projectiles-sheet-alpha.png",
  "assets/generated/rift-explosions-sheet-alpha.png",
  "assets/generated/rift-ui-sheet-alpha.png",
  "assets/generated/rift-shards-sheet-alpha.png",
  "assets/generated/rift-orbs-sheet-alpha.png",
  "assets/generated/rift-ring-sheet-alpha.png",
  "assets/generated/rift-ui-chrome-sheet-alpha.png",
  "assets/generated/rift-font-atlas.png",
  "assets/generated/rift-title-logo.png",
  "assets/audio/steel-punch-parade.mp3",
];

function readPngInfo(file) {
  const buf = fs.readFileSync(file);
  if (buf.toString("ascii", 1, 4) !== "PNG") throw new Error(`${file} is not a PNG`);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    colorType: buf.readUInt8(25),
  };
}

for (const rel of required) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) throw new Error(`Missing ${rel}`);
  const size = fs.statSync(file).size;
  if (size <= 0) throw new Error(`Empty ${rel}`);
}

const bg = readPngInfo(path.join(root, "assets/generated/rift-loop-bg-tile.png"));
const sheet = readPngInfo(path.join(root, "assets/generated/rift-asset-sheet-alpha.png"));
const props = readPngInfo(path.join(root, "assets/generated/rift-props-sheet-alpha.png"));
const fx = readPngInfo(path.join(root, "assets/generated/rift-projectiles-sheet-alpha.png"));
const boom = readPngInfo(path.join(root, "assets/generated/rift-explosions-sheet-alpha.png"));
const ui = readPngInfo(path.join(root, "assets/generated/rift-ui-sheet-alpha.png"));
const shards = readPngInfo(path.join(root, "assets/generated/rift-shards-sheet-alpha.png"));
const orbs = readPngInfo(path.join(root, "assets/generated/rift-orbs-sheet-alpha.png"));
const rings = readPngInfo(path.join(root, "assets/generated/rift-ring-sheet-alpha.png"));
const chrome = readPngInfo(path.join(root, "assets/generated/rift-ui-chrome-sheet-alpha.png"));
const fontAtlas = readPngInfo(path.join(root, "assets/generated/rift-font-atlas.png"));
const logo = readPngInfo(path.join(root, "assets/generated/rift-title-logo.png"));
if (bg.width < 1200 || bg.height < 650) throw new Error(`Background too small: ${bg.width}x${bg.height}`);
if (sheet.colorType !== 6) throw new Error("Asset sheet should have an alpha channel");
if (props.colorType !== 6) throw new Error("Props sheet should have an alpha channel");
if (fx.colorType !== 6) throw new Error("Projectile sheet should have an alpha channel");
if (boom.colorType !== 6) throw new Error("Explosion sheet should have an alpha channel");
if (ui.colorType !== 6) throw new Error("UI sheet should have an alpha channel");
if (shards.colorType !== 6) throw new Error("Rift shard sheet should have an alpha channel");
if (orbs.colorType !== 6) throw new Error("Orb residue sheet should have an alpha channel");
if (rings.colorType !== 6) throw new Error("Ring sheet should have an alpha channel");
if (chrome.colorType !== 6) throw new Error("UI chrome sheet should have an alpha channel");
if (fontAtlas.colorType !== 6) throw new Error("Font atlas should have an alpha channel");
if (logo.colorType !== 6) throw new Error("Title logo should have an alpha channel");

const syntax = spawnSync(process.execPath, ["--check", path.join(root, "game.js")], { encoding: "utf8" });
if (syntax.status !== 0) {
  process.stderr.write(syntax.stderr);
  process.exit(syntax.status || 1);
}

console.log(`Rift Lance smoke ok: bg ${bg.width}x${bg.height}, ships ${sheet.width}x${sheet.height}, props ${props.width}x${props.height}, fx ${fx.width}x${fx.height}, boom ${boom.width}x${boom.height}, ui ${ui.width}x${ui.height}, shards ${shards.width}x${shards.height}, orbs ${orbs.width}x${orbs.height}, rings ${rings.width}x${rings.height}, chrome ${chrome.width}x${chrome.height}, font ${fontAtlas.width}x${fontAtlas.height}, logo ${logo.width}x${logo.height}`);
