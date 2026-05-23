const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "game.js",
  "assets/generated/rift-corridor-hd.png",
  "assets/generated/rift-asset-sheet-alpha.png",
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

const bg = readPngInfo(path.join(root, "assets/generated/rift-corridor-hd.png"));
const sheet = readPngInfo(path.join(root, "assets/generated/rift-asset-sheet-alpha.png"));
if (bg.width < 1200 || bg.height < 650) throw new Error(`Background too small: ${bg.width}x${bg.height}`);
if (sheet.colorType !== 6) throw new Error("Asset sheet should have an alpha channel");

const syntax = spawnSync(process.execPath, ["--check", path.join(root, "game.js")], { encoding: "utf8" });
if (syntax.status !== 0) {
  process.stderr.write(syntax.stderr);
  process.exit(syntax.status || 1);
}

console.log(`Rift Lance smoke ok: bg ${bg.width}x${bg.height}, sheet ${sheet.width}x${sheet.height}`);
