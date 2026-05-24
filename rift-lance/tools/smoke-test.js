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
if (bg.width < 1200 || bg.height < 650) throw new Error(`Background too small: ${bg.width}x${bg.height}`);
if (sheet.colorType !== 6) throw new Error("Asset sheet should have an alpha channel");
if (props.colorType !== 6) throw new Error("Props sheet should have an alpha channel");
if (fx.colorType !== 6) throw new Error("Projectile sheet should have an alpha channel");

const syntax = spawnSync(process.execPath, ["--check", path.join(root, "game.js")], { encoding: "utf8" });
if (syntax.status !== 0) {
  process.stderr.write(syntax.stderr);
  process.exit(syntax.status || 1);
}

console.log(`Rift Lance smoke ok: bg ${bg.width}x${bg.height}, ships ${sheet.width}x${sheet.height}, props ${props.width}x${props.height}, fx ${fx.width}x${fx.height}`);
