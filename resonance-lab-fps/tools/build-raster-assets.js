const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const root = path.resolve(__dirname, "..");

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  typeBuffer.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return out;
}

function pngEncode(image) {
  const raw = Buffer.alloc((image.width * 4 + 1) * image.height);
  for (let y = 0; y < image.height; y += 1) {
    const row = y * (image.width * 4 + 1);
    raw[row] = 0;
    image.pixels.copy(raw, row + 1, y * image.width * 4, (y + 1) * image.width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width, 0);
  ihdr.writeUInt32BE(image.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function img(width, height, clear = [0, 0, 0, 0]) {
  const image = { width, height, pixels: Buffer.alloc(width * height * 4) };
  fillRect(image, 0, 0, width, height, clear);
  return image;
}

function rgba(hex, alpha = 255) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), alpha];
}

function put(image, x, y, color) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  if (ix < 0 || iy < 0 || ix >= image.width || iy >= image.height) return;
  const idx = (iy * image.width + ix) * 4;
  const a = color[3] / 255;
  const inv = 1 - a;
  image.pixels[idx] = Math.round(color[0] * a + image.pixels[idx] * inv);
  image.pixels[idx + 1] = Math.round(color[1] * a + image.pixels[idx + 1] * inv);
  image.pixels[idx + 2] = Math.round(color[2] * a + image.pixels[idx + 2] * inv);
  image.pixels[idx + 3] = Math.min(255, Math.round(color[3] + image.pixels[idx + 3] * inv));
}

function fillRect(image, x, y, width, height, color) {
  for (let yy = Math.max(0, Math.floor(y)); yy < Math.min(image.height, Math.ceil(y + height)); yy += 1) {
    for (let xx = Math.max(0, Math.floor(x)); xx < Math.min(image.width, Math.ceil(x + width)); xx += 1) {
      put(image, xx, yy, color);
    }
  }
}

function ellipse(image, cx, cy, rx, ry, color) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) put(image, x, y, color);
    }
  }
}

function line(image, x0, y0, x1, y1, width, color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    ellipse(image, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, width / 2, width / 2, color);
  }
}

function polygon(image, points, color) {
  const minY = Math.floor(Math.min(...points.map((p) => p[1])));
  const maxY = Math.ceil(Math.max(...points.map((p) => p[1])));
  for (let y = minY; y <= maxY; y += 1) {
    const nodes = [];
    let j = points.length - 1;
    for (let i = 0; i < points.length; i += 1) {
      const pi = points[i];
      const pj = points[j];
      if ((pi[1] < y && pj[1] >= y) || (pj[1] < y && pi[1] >= y)) {
        nodes.push(pi[0] + ((y - pi[1]) / (pj[1] - pi[1])) * (pj[0] - pi[0]));
      }
      j = i;
    }
    nodes.sort((a, b) => a - b);
    for (let i = 0; i < nodes.length; i += 2) {
      fillRect(image, nodes[i], y, nodes[i + 1] - nodes[i], 1, color);
    }
  }
}

function noise(image, amount = 16, alpha = 28) {
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const v = Math.floor((rand() - 0.5) * amount);
      put(image, x, y, [Math.max(0, v), Math.max(0, v), Math.max(0, v), alpha]);
    }
  }
}

function save(name, image) {
  const fullPath = path.join(root, name);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, pngEncode(image));
}

function makeWall() {
  const image = img(128, 128, rgba("#263638", 255));
  for (const [x, y, c] of [
    [4, 4, "#31484b"],
    [68, 4, "#2c4045"],
    [4, 68, "#385253"],
    [68, 68, "#293b40"]
  ]) fillRect(image, x, y, 56, 56, rgba(c));
  line(image, 64, 0, 64, 128, 5, rgba("#11191a"));
  line(image, 0, 64, 128, 64, 5, rgba("#11191a"));
  line(image, 96, 6, 96, 58, 3, rgba("#ffb13d", 120));
  line(image, 101, 6, 101, 58, 2, rgba("#ffe2a0", 70));
  line(image, 19, 70, 19, 123, 3, rgba("#5ee0cf", 75));
  for (const [x, y] of [[58, 58], [70, 58], [58, 70], [70, 70]]) ellipse(image, x, y, 4, 4, rgba("#060909"));
  for (const [x, y] of [[12, 18], [78, 18], [12, 84], [78, 84]]) line(image, x, y, x + 34, y, 2, rgba("#b6c7bd", 70));
  noise(image, 22, 22);
  return image;
}

function makeFloor() {
  const image = img(128, 128, rgba("#0b1110"));
  for (let i = 0; i <= 128; i += 32) {
    line(image, i, 0, i, 128, 3, rgba("#263130"));
    line(image, 0, i, 128, i, 3, rgba("#263130"));
  }
  for (const [x, y, c] of [[7, 7, "#13201f"], [71, 7, "#172322"], [7, 71, "#192524"], [71, 71, "#111d1c"]]) fillRect(image, x, y, 50, 50, rgba(c));
  line(image, 6, 62, 122, 62, 4, rgba("#ffb13d", 55));
  for (let x = 10; x < 124; x += 18) line(image, x, 64, x + 14, 50, 3, rgba("#ffb13d", 105));
  for (const [x, y] of [[32, 32], [96, 32], [32, 96], [96, 96]]) ellipse(image, x, y, 3, 3, rgba("#040807"));
  noise(image, 24, 30);
  return image;
}

function makeCeiling() {
  const image = img(128, 128, rgba("#081013"));
  for (let i = 42; i <= 86; i += 44) line(image, 0, i, 128, i, 4, rgba("#1d2b30"));
  for (let i = 42; i <= 86; i += 44) line(image, i, 0, i, 128, 4, rgba("#1d2b30"));
  fillRect(image, 12, 17, 104, 18, rgba("#122226"));
  ellipse(image, 64, 26, 52, 8, rgba("#153035"));
  fillRect(image, 22, 21, 84, 10, rgba("#a7fff0", 120));
  fillRect(image, 16, 94, 42, 16, rgba("#111f24"));
  fillRect(image, 70, 94, 42, 16, rgba("#132329"));
  line(image, 6, 41, 122, 41, 2, rgba("#ffb13d", 50));
  line(image, 6, 87, 122, 87, 2, rgba("#ffb13d", 50));
  noise(image, 16, 18);
  return image;
}

function makeDoorA() {
  const image = img(128, 128, rgba("#2e383d"));
  fillRect(image, 9, 5, 110, 118, rgba("#58676d"));
  line(image, 9, 5, 119, 5, 7, rgba("#13191c"));
  line(image, 9, 123, 119, 123, 7, rgba("#13191c"));
  line(image, 9, 5, 9, 123, 7, rgba("#13191c"));
  line(image, 119, 5, 119, 123, 7, rgba("#13191c"));
  fillRect(image, 24, 39, 80, 50, rgba("#252e31"));
  fillRect(image, 30, 46, 68, 10, rgba("#ffb13d"));
  fillRect(image, 30, 72, 68, 10, rgba("#ffb13d"));
  line(image, 94, 8, 94, 120, 7, rgba("#101719"));
  ellipse(image, 101, 64, 8, 8, rgba("#ffd073"));
  noise(image, 14, 16);
  return image;
}

function makeDoorB() {
  const image = img(128, 128, rgba("#231b19"));
  fillRect(image, 8, 5, 112, 118, rgba("#553b34"));
  line(image, 8, 5, 120, 5, 8, rgba("#120c0b"));
  line(image, 8, 123, 120, 123, 8, rgba("#120c0b"));
  line(image, 64, 7, 64, 121, 6, rgba("#15100e"));
  line(image, 22, 34, 106, 94, 8, rgba("#ff503e", 190));
  line(image, 106, 34, 22, 94, 8, rgba("#ff503e", 190));
  ellipse(image, 64, 64, 14, 14, rgba("#0d1112"));
  ellipse(image, 64, 64, 6, 6, rgba("#ff503e"));
  noise(image, 14, 20);
  return image;
}

function makePistol() {
  const image = img(512, 256);
  ellipse(image, 330, 214, 130, 16, rgba("#000000", 90));
  polygon(image, [[54, 206], [120, 166], [232, 164], [328, 198], [456, 190], [488, 218], [92, 232]], rgba("#23170b", 255));
  polygon(image, [[96, 188], [152, 156], [252, 165], [236, 232], [98, 232], [62, 216]], rgba("#c86118", 255));
  polygon(image, [[112, 160], [330, 160], [374, 132], [480, 136], [504, 166], [488, 186], [136, 187]], rgba("#2f454b", 255));
  polygon(image, [[162, 104], [342, 105], [366, 148], [142, 148]], rgba("#40565c", 255));
  fillRect(image, 376, 143, 118, 38, rgba("#070b0c"));
  polygon(image, [[190, 184], [270, 184], [244, 252], [168, 252]], rgba("#11191b", 255));
  fillRect(image, 212, 118, 40, 32, rgba("#0b1011"));
  fillRect(image, 225, 121, 18, 27, rgba("#5ee0cf"));
  line(image, 132, 166, 214, 166, 4, rgba("#f2fff2", 95));
  line(image, 340, 123, 390, 123, 5, rgba("#ffb13d", 150));
  ellipse(image, 502, 164, 30, 30, rgba("#5ee0cf", 75));
  ellipse(image, 505, 164, 9, 9, rgba("#eafff9", 230));
  return image;
}

function makeBar() {
  const image = img(320, 320);
  ellipse(image, 154, 290, 70, 18, rgba("#000000", 90));
  line(image, 154, 54, 190, 282, 34, rgba("#111719"));
  line(image, 160, 54, 196, 282, 18, rgba("#b9c5bb"));
  line(image, 168, 54, 204, 282, 6, rgba("#f2f3e6", 160));
  line(image, 147, 48, 75, 132, 30, rgba("#8f311d"));
  line(image, 179, 47, 260, 126, 30, rgba("#a63b20"));
  line(image, 76, 132, 118, 102, 28, rgba("#a74322"));
  line(image, 259, 126, 210, 102, 28, rgba("#a74322"));
  line(image, 153, 80, 182, 80, 6, rgba("#fff4d7", 120));
  line(image, 161, 132, 188, 132, 5, rgba("#fff4d7", 110));
  line(image, 170, 212, 198, 212, 5, rgba("#fff4d7", 90));
  return image;
}

function makeSpecimen() {
  const image = img(220, 260);
  ellipse(image, 110, 238, 74, 15, rgba("#000000", 90));
  ellipse(image, 110, 116, 72, 86, rgba("#76ff8d", 45));
  line(image, 64, 111, 44, 220, 28, rgba("#112019"));
  line(image, 156, 111, 176, 220, 28, rgba("#112019"));
  ellipse(image, 110, 104, 52, 90, rgba("#317b54", 255));
  ellipse(image, 110, 80, 40, 64, rgba("#a5ff9a", 180));
  ellipse(image, 88, 94, 13, 9, rgba("#f6fff2"));
  ellipse(image, 132, 94, 13, 9, rgba("#f6fff2"));
  ellipse(image, 88, 94, 5, 5, rgba("#061211"));
  ellipse(image, 132, 94, 5, 5, rgba("#061211"));
  line(image, 76, 144, 144, 144, 10, rgba("#041814"));
  line(image, 88, 202, 74, 245, 15, rgba("#162b22"));
  line(image, 132, 202, 146, 245, 15, rgba("#162b22"));
  line(image, 75, 235, 110, 235, 7, rgba("#86f686"));
  line(image, 110, 235, 145, 235, 7, rgba("#86f686"));
  return image;
}

function makeDrone() {
  const image = img(230, 230);
  ellipse(image, 115, 211, 74, 14, rgba("#000000", 90));
  line(image, 33, 77, 75, 77, 12, rgba("#ffb13d"));
  line(image, 155, 77, 197, 77, 12, rgba("#ffb13d"));
  line(image, 50, 142, 14, 171, 12, rgba("#ffb13d"));
  line(image, 180, 142, 216, 171, 12, rgba("#ffb13d"));
  ellipse(image, 31, 77, 13, 13, rgba("#151b1c"));
  ellipse(image, 199, 77, 13, 13, rgba("#151b1c"));
  ellipse(image, 115, 90, 72, 80, rgba("#34444a"));
  ellipse(image, 115, 70, 62, 42, rgba("#8f9c96", 160));
  fillRect(image, 51, 78, 128, 54, rgba("#070b0c"));
  ellipse(image, 115, 105, 33, 33, rgba("#ffb13d"));
  ellipse(image, 115, 105, 10, 10, rgba("#fffbea"));
  line(image, 77, 153, 153, 153, 6, rgba("#c0c9c1", 140));
  line(image, 91, 181, 77, 220, 14, rgba("#232d30"));
  line(image, 139, 181, 153, 220, 14, rgba("#232d30"));
  return image;
}

function makeGuard() {
  const image = img(230, 270);
  ellipse(image, 115, 250, 79, 16, rgba("#000000", 95));
  line(image, 54, 103, 62, 222, 30, rgba("#171a1a"));
  line(image, 176, 103, 168, 222, 30, rgba("#171a1a"));
  ellipse(image, 115, 124, 57, 108, rgba("#5b2218"));
  ellipse(image, 115, 70, 46, 58, rgba("#9e4a29"));
  fillRect(image, 74, 76, 82, 39, rgba("#0a0d0e"));
  ellipse(image, 115, 96, 42, 22, rgba("#ffb13d"));
  ellipse(image, 115, 96, 14, 8, rgba("#fff1d8", 210));
  line(image, 76, 147, 154, 147, 6, rgba("#ffd09b", 110));
  line(image, 73, 169, 157, 169, 6, rgba("#ffd09b", 100));
  fillRect(image, 108, 130, 14, 80, rgba("#ffb13d", 105));
  line(image, 90, 214, 74, 257, 16, rgba("#151b1c"));
  line(image, 140, 214, 156, 257, 16, rgba("#151b1c"));
  line(image, 75, 245, 119, 245, 7, rgba("#ff9b4f"));
  line(image, 111, 245, 155, 245, 7, rgba("#ff9b4f"));
  return image;
}

save("assets/textures/wall-lab.png", makeWall());
save("assets/textures/floor-panel.png", makeFloor());
save("assets/textures/ceiling-panel.png", makeCeiling());
save("assets/textures/door-a.png", makeDoorA());
save("assets/textures/door-b.png", makeDoorB());
save("assets/sprites/gun-pistol.png", makePistol());
save("assets/sprites/gun-bar.png", makeBar());
save("assets/sprites/enemy-specimen.png", makeSpecimen());
save("assets/sprites/enemy-drone.png", makeDrone());
save("assets/sprites/enemy-guard.png", makeGuard());

console.log("Raster assets generated.");
