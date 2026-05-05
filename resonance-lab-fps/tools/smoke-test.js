const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html",
  "style.css",
  "game.js",
  "assets/sprites/gun-pistol.png",
  "assets/sprites/gun-bar.png",
  "assets/sprites/enemy-specimen.png",
  "assets/sprites/enemy-drone.png",
  "assets/sprites/enemy-guard.png",
  "assets/textures/wall-lab.png",
  "assets/textures/door-a.png",
  "assets/textures/door-b.png",
  "assets/textures/floor-panel.png",
  "assets/textures/ceiling-panel.png",
  "assets/audio/bgm/lab-loop.mp3",
  "assets/audio/sfx/pulse-fire.ogg",
  "assets/audio/sfx/impact.wav",
  "assets/audio/sfx/enemy-hurt.wav",
  "assets/audio/sfx/enemy-die.wav",
  "assets/audio/sfx/door-open.ogg",
  "assets/audio/sfx/pickup.wav",
  "assets/audio/sfx/player-hit.wav"
];

for (const file of required) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing ${file}`);
  }
  if (file.endsWith(".png")) {
    const signature = fs.readFileSync(fullPath).subarray(0, 8).toString("hex");
    if (signature !== "89504e470d0a1a0a") {
      throw new Error(`${file} is not a valid PNG`);
    }
  }
}

const game = fs.readFileSync(path.join(root, "game.js"), "utf8");
const mapMatch = game.match(/const MAP_LAYOUT = \[([\s\S]*?)\];/);
if (!mapMatch) {
  throw new Error("MAP_LAYOUT not found");
}

const rows = [...mapMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
if (rows.length < 8) {
  throw new Error("Map is too small for the FPS loop");
}

const width = rows[0].length;
for (const row of rows) {
  if (row.length !== width) {
    throw new Error(`Map row has width ${row.length}; expected ${width}`);
  }
}

for (const token of ["S", "A", "B", "P", "F", "K", "E"]) {
  if (!rows.some((row) => row.includes(token))) {
    throw new Error(`Map token ${token} missing`);
  }
}

const findAll = (token) => {
  const matches = [];
  rows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === token) matches.push([x, y]);
    });
  });
  return matches;
};

const adjacentReachable = (seen, [x, y]) =>
  [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ].some(([dx, dy]) => seen.has(`${x + dx},${y + dy}`));

const reachable = (openDoors = new Set()) => {
  const start = findAll("S")[0];
  const queue = [start];
  const seen = new Set([start.join(",")]);
  while (queue.length > 0) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      const cell = (rows[ny] || "")[nx] || "#";
      if (cell === "#") continue;
      if ((cell === "A" || cell === "B") && !openDoors.has(cell)) continue;
      const key = `${nx},${ny}`;
      if (!seen.has(key)) {
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
  }
  return seen;
};

const firstReach = reachable();
const lowerReach = reachable(new Set(["A"]));
const finalReach = reachable(new Set(["A", "B"]));
if (!findAll("K").some((pos) => firstReach.has(pos.join(",")))) {
  throw new Error("No access card reachable before opening doors");
}
if (!findAll("A").some((pos) => adjacentReachable(firstReach, pos))) {
  throw new Error("Sector door A is not reachable before it opens");
}
if (!findAll("P").some((pos) => lowerReach.has(pos.join(",")))) {
  throw new Error("Power relay is not reachable after opening door A");
}
if (!findAll("K").some((pos) => lowerReach.has(pos.join(",")) && !firstReach.has(pos.join(",")))) {
  throw new Error("Second access card is not reachable after opening door A");
}
if (!findAll("B").some((pos) => adjacentReachable(lowerReach, pos))) {
  throw new Error("Blast door B is not reachable before it opens");
}
if (!findAll("F").some((pos) => finalReach.has(pos.join(",")))) {
  throw new Error("Final core is not reachable after opening both doors");
}

for (const needle of ["TARGET_RENDER_WIDTH", "RAY_STEP = 4", ".png", "requestAnimationFrame", "castRay", "drawWeapon", "findInteractable", "drawWallTextureColumn", "aiComment", "speechSynthesis", "playSound", "startMusic"]) {
  if (!game.includes(needle)) {
    throw new Error(`Expected ${needle} in game runtime`);
  }
}

console.log(`Smoke ok: ${rows.length}x${width} map, ${required.length} files present.`);
