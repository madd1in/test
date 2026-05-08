const fs = require("node:fs");
const path = require("node:path");

let sharp;
try {
  sharp = require("sharp");
} catch {
  sharp = require("C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");
}

const root = path.resolve(__dirname, "..");
const dirs = {
  sprites: path.join(root, "assets", "sprites"),
  tiles: path.join(root, "assets", "tiles"),
  backgrounds: path.join(root, "assets", "backgrounds"),
  fx: path.join(root, "assets", "fx"),
  ui: path.join(root, "assets", "ui"),
  maps: path.join(root, "assets", "maps"),
  audio: path.join(root, "assets", "audio")
};

for (const dir of Object.values(dirs)) {
  fs.mkdirSync(dir, { recursive: true });
}

const palette = {
  ink: "#151822",
  graphite: "#242734",
  teal: "#2fb7a5",
  tealDark: "#17665e",
  coral: "#f05d49",
  gold: "#f7b955",
  cream: "#f7f4e8",
  dirt: "#8d5530",
  dirtDark: "#5f3826",
  dirtLight: "#c08342",
  grass: "#6d9a5e",
  sage: "#92aa78",
  sky: "#8fd3df"
};

function svg(width, height, body, defs = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="dirtGrad" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.dirtLight}"/>
      <stop offset="0.55" stop-color="${palette.dirt}"/>
      <stop offset="1" stop-color="${palette.dirtDark}"/>
    </linearGradient>
    <linearGradient id="boostGrad" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.teal}"/>
      <stop offset="0.55" stop-color="${palette.gold}"/>
      <stop offset="1" stop-color="${palette.coral}"/>
    </linearGradient>
    <radialGradient id="tireGrad" cx="50%" cy="50%" r="55%">
      <stop offset="0" stop-color="#576071"/>
      <stop offset="0.4" stop-color="#242734"/>
      <stop offset="1" stop-color="#0b0d12"/>
    </radialGradient>
    <linearGradient id="metalGrad" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#eef7f4"/>
      <stop offset="0.45" stop-color="${palette.teal}"/>
      <stop offset="1" stop-color="${palette.tealDark}"/>
    </linearGradient>
    <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.22"/>
    </filter>
    ${defs}
  </defs>
  ${body}
</svg>`;
}

async function writePng(file, markup) {
  await sharp(Buffer.from(markup)).png().toFile(file);
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

async function buildImagenHdAssets(manifest) {
  const tileSource = path.join(root, "assets", "source", "imagen-hd-mode7-tile-map.png");
  const backgroundSource = path.join(root, "assets", "source", "imagen-hd-background-strips.png");
  if (fs.existsSync(tileSource)) {
    const file = "imagen-hd-mode7-tiles.png";
    await sharp(tileSource).resize(1536, 1024, { fit: "fill" }).png().toFile(path.join(dirs.tiles, file));
    const names = [
      "packed_dirt", "tire_grooves", "dust_shoulder", "gravel", "wet_mud", "cracked_clay", "teal_boost", "hazard_stripe",
      "ramp_lip", "banked_berm", "bridge_plank", "metal_grate", "finish", "checkpoint", "dark_fill", "sand_wash",
      "canyon_edge", "pine_edge", "storm_asphalt", "oil_slick", "jump_marker", "deep_ruts", "cracked_asphalt", "barrier",
      "grass_edge", "red_clay", "ocher_dust", "black_shadow", "teal_lane", "coral_lane", "white_lane", "worn_dirt"
    ];
    const frames = {};
    names.forEach((name, index) => {
      frames[name] = { x: (index % 8) * 192, y: Math.floor(index / 8) * 256, w: 192, h: 256 };
    });
    manifest.images.mode7Tiles = { file: `assets/tiles/${file}`, frameWidth: 192, frameHeight: 256, columns: 8, rows: 4, frames };
  }
  if (fs.existsSync(backgroundSource)) {
    const file = "imagen-hd-background-strips.png";
    await sharp(backgroundSource).resize(1920, 960, { fit: "fill" }).png().toFile(path.join(dirs.backgrounds, file));
    manifest.images.hdBackgrounds = {
      file: `assets/backgrounds/${file}`,
      frameWidth: 1920,
      frameHeight: 320,
      columns: 1,
      rows: 3,
      frames: {
        canyon: { x: 0, y: 0, w: 1920, h: 320 },
        pine: { x: 0, y: 320, w: 1920, h: 320 },
        storm: { x: 0, y: 640, w: 1920, h: 320 }
      }
    };
  }
}

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function dots(seed, x, y, width, height, count, colors) {
  const rand = seeded(seed);
  let out = "";
  for (let i = 0; i < count; i += 1) {
    const cx = x + Math.round(rand() * width);
    const cy = y + Math.round(rand() * height);
    const r = 0.7 + rand() * 2.8;
    const color = colors[Math.floor(rand() * colors.length)];
    const opacity = 0.18 + rand() * 0.42;
    out += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(2)}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`;
  }
  return out;
}

function tire(cx, cy, radius, spin) {
  let spokes = "";
  for (let i = 0; i < 10; i += 1) {
    const a = (Math.PI * 2 * i) / 10 + spin;
    const x2 = cx + Math.cos(a) * (radius - 5);
    const y2 = cy + Math.sin(a) * (radius - 5);
    spokes += `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#cbd4d0" stroke-width="1.4" opacity="0.74"/>`;
  }
  return `
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="url(#tireGrad)"/>
    <circle cx="${cx}" cy="${cy}" r="${radius - 5}" fill="none" stroke="#697182" stroke-width="3"/>
    ${spokes}
    <circle cx="${cx}" cy="${cy}" r="4.5" fill="${palette.cream}"/>
  `;
}

function drawBikeFrame(slotX, slotY, options) {
  const {
    angle = 0,
    lean = 0,
    fork = 0,
    compression = 0,
    spin = 0,
    flame = 0,
    crash = 0,
    dust = 0,
    air = 0
  } = options;
  const cx = slotX + 64;
  const cy = slotY + 61 + air;
  const rearX = 34;
  const frontX = 91 + fork;
  const wheelY = 70 + compression;
  const riderHip = { x: 58 + lean * 0.08, y: 42 - crash * 4 };
  const torsoTop = { x: 60 + lean * 0.5, y: 23 - crash * 11 };
  const head = { x: 64 + lean * 0.6, y: 14 - crash * 13 };
  const armX = 82 + lean * 0.35;
  const armY = 33 - crash * 2;
  const legX = 48 - lean * 0.15;
  const legY = 58 + compression * 0.2;
  const crashRotate = crash ? -32 * crash : 0;
  const ghost = crash ? `<path d="M78 9 l5 -7 l5 7 l8 -2 l-4 8 l7 5 l-9 2 l0 9 l-8 -5 l-7 5 l1 -9 l-9 -2 l7 -5 l-4 -8z" fill="${palette.gold}" opacity="${0.35 + crash * 0.35}"/>` : "";
  const turbo = flame > 0 ? `<path d="M17 55 C4 50 2 63 16 65 C9 72 24 76 31 66 C24 65 23 57 17 55z" fill="${palette.coral}" opacity="${flame}"/><path d="M19 58 C11 56 10 63 18 64 C15 68 23 70 27 64 C23 63 23 59 19 58z" fill="${palette.gold}" opacity="${flame}"/>` : "";
  const dustPuffs = dust > 0 ? `<g opacity="${dust}"><circle cx="18" cy="76" r="6" fill="#d7aa73"/><circle cx="9" cy="79" r="3.5" fill="#b77b4a"/><circle cx="27" cy="80" r="4" fill="#ead2a9"/></g>` : "";

  return `<g transform="translate(${slotX} ${slotY})">
    <ellipse cx="64" cy="83" rx="43" ry="6" fill="#000" opacity="0.16"/>
    <g filter="url(#softShadow)" transform="rotate(${(angle + crashRotate).toFixed(2)} 64 58)">
      ${dustPuffs}
      ${turbo}
      ${tire(rearX, wheelY, 17, spin)}
      ${tire(frontX, wheelY - fork * 0.06, 17, -spin * 1.1)}
      <path d="M${rearX} ${wheelY - 2} L51 49 L70 68 L${frontX} ${wheelY - 5} L76 44 L51 49 Z" fill="none" stroke="url(#metalGrad)" stroke-width="5.2" stroke-linejoin="round"/>
      <path d="M47 45 C58 37 72 36 83 43 L79 53 L49 53 Z" fill="${palette.coral}"/>
      <path d="M51 38 L77 38 L86 45 L45 48 Z" fill="${palette.cream}" opacity="0.95"/>
      <path d="M74 42 L96 31" stroke="${palette.graphite}" stroke-width="4" stroke-linecap="round"/>
      <path d="M92 28 L104 29" stroke="${palette.cream}" stroke-width="3" stroke-linecap="round"/>
      <path d="M42 43 L28 32" stroke="${palette.graphite}" stroke-width="4" stroke-linecap="round"/>
      <path d="M35 38 L27 32 L31 51" stroke="${palette.teal}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <g transform="rotate(${lean.toFixed(2)} ${riderHip.x} ${riderHip.y})">
        <path d="M${riderHip.x} ${riderHip.y} L${torsoTop.x} ${torsoTop.y}" stroke="${palette.teal}" stroke-width="10" stroke-linecap="round"/>
        <path d="M${torsoTop.x - 2} ${torsoTop.y + 8} L${armX} ${armY} L96 31" stroke="${palette.cream}" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M${riderHip.x - 4} ${riderHip.y + 6} L${legX} ${legY} L${rearX + 11} ${wheelY - 5}" stroke="${palette.graphite}" stroke-width="6" stroke-linecap="round" fill="none"/>
        <path d="M${riderHip.x + 3} ${riderHip.y + 7} L70 ${legY + 4} L82 ${wheelY - 7}" stroke="${palette.coral}" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M${head.x - 10} ${head.y + 7} C${head.x - 10} ${head.y - 2} ${head.x} ${head.y - 7} ${head.x + 10} ${head.y + 1} C${head.x + 14} ${head.y + 11} ${head.x + 6} ${head.y + 17} ${head.x - 5} ${head.y + 16} C${head.x - 12} ${head.y + 15} ${head.x - 15} ${head.y + 11} ${head.x - 10} ${head.y + 7}z" fill="${palette.cream}"/>
        <path d="M${head.x + 3} ${head.y + 1} L${head.x + 16} ${head.y + 5} L${head.x + 4} ${head.y + 8}z" fill="${palette.graphite}"/>
      </g>
      ${ghost}
    </g>
  </g>`;
}

async function buildBikeSheet(manifest) {
  const frameW = 128;
  const frameH = 96;
  const columns = 8;
  const rows = 6;
  const frames = {};
  const animations = {
    idle: [],
    ride: [],
    air: [],
    brake: [],
    crash: [],
    turbo: []
  };
  const parts = [];
  const animOrder = Object.keys(animations);
  for (let row = 0; row < rows; row += 1) {
    const anim = animOrder[row];
    for (let col = 0; col < columns; col += 1) {
      const index = row * columns + col;
      const key = `${anim}_${String(col).padStart(2, "0")}`;
      frames[key] = { x: col * frameW, y: row * frameH, w: frameW, h: frameH };
      animations[anim].push(key);
      const t = col / columns;
      const wobble = Math.sin(t * Math.PI * 2);
      const opts = {
        angle: anim === "air" ? -12 + wobble * 8 : anim === "brake" ? 7 + wobble * 2 : wobble * 1.8,
        lean: anim === "air" ? -12 + col * 3 : anim === "brake" ? -18 : anim === "turbo" ? 15 + wobble * 4 : wobble * 5,
        fork: anim === "brake" ? -3 : anim === "air" ? 2 : wobble * 1.4,
        compression: anim === "ride" ? Math.max(0, wobble) * 2.2 : anim === "turbo" ? Math.max(0, wobble) * 3 : 0,
        spin: t * Math.PI * 2,
        flame: anim === "turbo" ? 0.7 + Math.max(0, wobble) * 0.25 : 0,
        crash: anim === "crash" ? Math.min(1, 0.25 + col / 6) : 0,
        dust: anim === "ride" || anim === "turbo" ? 0.35 + Math.max(0, wobble) * 0.45 : 0,
        air: anim === "air" ? -8 - Math.abs(wobble) * 5 : 0
      };
      parts.push(drawBikeFrame(col * frameW, row * frameH, opts));
    }
  }
  const file = "bike-rider-sheet.png";
  await writePng(path.join(dirs.sprites, file), svg(frameW * columns, frameH * rows, parts.join("\n")));
  manifest.images.bike = { file: `assets/sprites/${file}`, frameWidth: frameW, frameHeight: frameH, columns, rows, frames, animations };
}

function terrainTile(col, row, name, draw) {
  const x = col * 64;
  const y = row * 64;
  const clip = `clip-${name}`;
  return `<g>
    <clipPath id="${clip}"><rect x="${x}" y="${y}" width="64" height="64" rx="0"/></clipPath>
    <g clip-path="url(#${clip})">${draw(x, y)}</g>
  </g>`;
}

function tileBase(x, y, top = 17, shape = "flat", seed = 1) {
  let topPath = `M${x} ${y + top} L${x + 64} ${y + top} L${x + 64} ${y + 64} L${x} ${y + 64}z`;
  if (shape === "up") topPath = `M${x} ${y + 50} L${x + 64} ${y + 13} L${x + 64} ${y + 64} L${x} ${y + 64}z`;
  if (shape === "down") topPath = `M${x} ${y + 13} L${x + 64} ${y + 50} L${x + 64} ${y + 64} L${x} ${y + 64}z`;
  if (shape === "rampUp") topPath = `M${x} ${y + 58} C${x + 24} ${y + 56} ${x + 42} ${y + 18} ${x + 64} ${y + 12} L${x + 64} ${y + 64} L${x} ${y + 64}z`;
  if (shape === "rampDown") topPath = `M${x} ${y + 12} C${x + 22} ${y + 18} ${x + 40} ${y + 56} ${x + 64} ${y + 58} L${x + 64} ${y + 64} L${x} ${y + 64}z`;
  return `<rect x="${x}" y="${y}" width="64" height="64" fill="none"/>
    <path d="${topPath}" fill="url(#dirtGrad)"/>
    ${dots(seed, x + 2, y + top + 4, 60, 58 - top, 34, ["#442817", "#d69b5d", "#fff0bb"])}
    <path d="${topPath}" fill="none" stroke="#f0be72" stroke-width="4" opacity="0.58"/>`;
}

async function buildTerrainSheet(manifest) {
  const names = [
    "dirt_flat", "dirt_fill", "slope_up", "slope_down", "ramp_up", "ramp_down", "mud", "boost",
    "grass_edge", "rock_face", "loose_gravel", "packed_shadow", "bridge_left", "bridge_mid", "bridge_right", "water",
    "stripe", "checkpoint_pad", "finish_tile", "warning", "sand", "deep_mud", "rail", "shadow",
    "flower_grass", "mesa_block", "pine_floor", "night_dirt", "snow_cap", "root_rut", "metal_panel", "dark_fill"
  ];
  const frames = {};
  const parts = [];
  names.forEach((name, index) => {
    const col = index % 8;
    const row = Math.floor(index / 8);
    frames[name] = { x: col * 64, y: row * 64, w: 64, h: 64 };
    parts.push(terrainTile(col, row, name, (x, y) => {
      if (name === "dirt_fill") return `<rect x="${x}" y="${y}" width="64" height="64" fill="url(#dirtGrad)"/>${dots(index + 4, x, y, 64, 64, 42, ["#412717", "#b8733d", "#f4c27b"])}`;
      if (name === "slope_up") return tileBase(x, y, 18, "up", index + 7);
      if (name === "slope_down") return tileBase(x, y, 18, "down", index + 7);
      if (name === "ramp_up") return `${tileBase(x, y, 16, "rampUp", index + 7)}<path d="M${x + 9} ${y + 53} C${x + 32} ${y + 42} ${x + 41} ${y + 23} ${x + 58} ${y + 18}" fill="none" stroke="${palette.cream}" stroke-width="2" opacity="0.7"/>`;
      if (name === "ramp_down") return `${tileBase(x, y, 16, "rampDown", index + 7)}<path d="M${x + 9} ${y + 18} C${x + 29} ${y + 24} ${x + 37} ${y + 43} ${x + 58} ${y + 53}" fill="none" stroke="${palette.cream}" stroke-width="2" opacity="0.7"/>`;
      if (name === "mud") return `<rect x="${x}" y="${y}" width="64" height="64" fill="${palette.dirtDark}"/><ellipse cx="${x + 32}" cy="${y + 34}" rx="30" ry="14" fill="#5a3c32"/><path d="M${x + 5} ${y + 33} C${x + 18} ${y + 25} ${x + 39} ${y + 44} ${x + 58} ${y + 30}" fill="none" stroke="#b08c68" stroke-width="4" opacity="0.45"/>`;
      if (name === "boost") return `<rect x="${x}" y="${y + 18}" width="64" height="36" rx="5" fill="url(#boostGrad)"/><path d="M${x + 12} ${y + 46} L${x + 32} ${y + 24} L${x + 52} ${y + 46}" fill="none" stroke="${palette.cream}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (name === "grass_edge") return `${tileBase(x, y, 22, "flat", index + 7)}<path d="M${x} ${y + 20} C${x + 15} ${y + 11} ${x + 31} ${y + 25} ${x + 48} ${y + 15} C${x + 55} ${y + 11} ${x + 60} ${y + 15} ${x + 64} ${y + 14} L${x + 64} ${y + 27} L${x} ${y + 27}z" fill="${palette.grass}"/>`;
      if (name === "rock_face") return `<rect x="${x}" y="${y}" width="64" height="64" fill="#4a4d59"/><path d="M${x + 4} ${y + 8} L${x + 29} ${y + 3} L${x + 61} ${y + 18} L${x + 54} ${y + 60} L${x + 8} ${y + 58}z" fill="#686d7b"/><path d="M${x + 8} ${y + 20} L${x + 28} ${y + 31} L${x + 20} ${y + 55}" stroke="#353946" stroke-width="3" fill="none"/>`;
      if (name === "water") return `<rect x="${x}" y="${y}" width="64" height="64" fill="#2b8198"/><path d="M${x} ${y + 24} C${x + 16} ${y + 12} ${x + 30} ${y + 34} ${x + 48} ${y + 22} C${x + 56} ${y + 17} ${x + 60} ${y + 21} ${x + 64} ${y + 18}" stroke="#b8fff6" stroke-width="3" fill="none" opacity="0.7"/>`;
      if (name.includes("bridge")) return `<rect x="${x}" y="${y + 25}" width="64" height="18" fill="#65442e"/><path d="M${x} ${y + 31} H${x + 64}" stroke="#c18a57" stroke-width="4"/><path d="M${x + 10} ${y + 21} V${y + 48} M${x + 38} ${y + 21} V${y + 48}" stroke="#39251a" stroke-width="5"/>`;
      if (name === "stripe" || name === "finish_tile") return `<rect x="${x}" y="${y}" width="64" height="64" fill="#f7f4e8"/><path d="M${x} ${y} h32 v32 h-32z M${x + 32} ${y + 32} h32 v32 h-32z" fill="#17191f"/><path d="M${x} ${y + 56} h64" stroke="${palette.coral}" stroke-width="5"/>`;
      if (name === "warning") return `<rect x="${x}" y="${y + 18}" width="64" height="31" rx="4" fill="${palette.gold}"/><path d="M${x + 10} ${y + 41} L${x + 32} ${y + 21} L${x + 54} ${y + 41}z" fill="${palette.graphite}"/>`;
      if (name === "metal_panel") return `<rect x="${x + 3}" y="${y + 16}" width="58" height="34" rx="5" fill="#7b8492"/><path d="M${x + 8} ${y + 40} H${x + 56}" stroke="#d8e2df" stroke-width="4"/><circle cx="${x + 12}" cy="${y + 23}" r="3" fill="#252833"/><circle cx="${x + 52}" cy="${y + 43}" r="3" fill="#252833"/>`;
      if (name === "shadow" || name === "dark_fill") return `<rect x="${x}" y="${y}" width="64" height="64" fill="#2b2528"/>${dots(index + 9, x, y, 64, 64, 30, ["#574238", "#1a171b"])}`;
      return tileBase(x, y, name === "loose_gravel" ? 24 : 17, "flat", index + 11);
    }));
  });
  const file = "terrain-tiles.png";
  await writePng(path.join(dirs.tiles, file), svg(512, 256, parts.join("\n")));
  manifest.images.terrain = { file: `assets/tiles/${file}`, tileSize: 64, columns: 8, rows: 4, frames };
}

async function buildBackgroundSheet(manifest) {
  const w = 256;
  const h = 144;
  const names = ["sky_clear", "cloud_soft", "cloud_long", "mesa_far", "mesa_near", "pine_ridge", "scrubland", "grandstand", "bridge_back", "dust_haze", "sunset_sky", "night_ridge"];
  const frames = {};
  let body = "";
  names.forEach((name, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = col * w;
    const y = row * h;
    frames[name] = { x, y, w, h };
    if (name === "sky_clear") {
      body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none"/><circle cx="${x + 208}" cy="${y + 33}" r="18" fill="#fff2b7" opacity="0.95"/><path d="M${x + 10} ${y + 102} C${x + 76} ${y + 88} ${x + 127} ${y + 111} ${x + 246} ${y + 93}" fill="none" stroke="#f7f4e8" stroke-width="15" opacity="0.12"/>`;
    } else if (name === "sunset_sky") {
      body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none"/><circle cx="${x + 208}" cy="${y + 35}" r="21" fill="#fff2b7" opacity="0.65"/><path d="M${x} ${y + 88} C${x + 70} ${y + 42} ${x + 150} ${y + 118} ${x + 256} ${y + 64}" fill="none" stroke="#f05d49" stroke-width="42" opacity="0.24"/>`;
    } else if (name.includes("cloud")) {
      body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none"/><g fill="#f7f4e8" opacity="${name === "cloud_soft" ? 0.82 : 0.62}"><ellipse cx="${x + 64}" cy="${y + 54}" rx="52" ry="15"/><ellipse cx="${x + 110}" cy="${y + 48}" rx="34" ry="19"/><ellipse cx="${x + 172}" cy="${y + 63}" rx="60" ry="17"/></g>`;
    } else if (name === "mesa_far" || name === "mesa_near" || name === "night_ridge") {
      const fill = name === "night_ridge" ? "#222936" : name === "mesa_far" ? "#b87956" : "#7c523d";
      body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none"/><path d="M${x} ${y + 110} L${x + 28} ${y + 83} L${x + 74} ${y + 88} L${x + 96} ${y + 48} L${x + 151} ${y + 55} L${x + 179} ${y + 28} L${x + 236} ${y + 101} L${x + 256} ${y + 98} V${y + 144} H${x}z" fill="${fill}"/><path d="M${x + 98} ${y + 49} L${x + 121} ${y + 88} M${x + 180} ${y + 30} L${x + 161} ${y + 96}" stroke="#fff5ca" stroke-width="2" opacity="0.2"/>`;
    } else if (name === "pine_ridge") {
      let trees = "";
      for (let i = 0; i < 11; i += 1) {
        const tx = x + i * 25 - 4;
        const ty = y + 95 + (i % 3) * 8;
        trees += `<path d="M${tx} ${ty} l14 -42 l14 42z M${tx + 3} ${ty - 20} l11 -35 l11 35z" fill="${i % 2 ? "#335844" : "#41694e"}"/><rect x="${tx + 12}" y="${ty - 2}" width="4" height="22" fill="#5b3d2a"/>`;
      }
      body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none"/>${trees}`;
    } else if (name === "grandstand") {
      body += `<rect x="${x}" y="${y + 56}" width="${w}" height="48" fill="#404758"/><path d="M${x} ${y + 55} H${x + 256}" stroke="#f7f4e8" stroke-width="5"/><path d="M${x + 10} ${y + 70} H${x + 244} M${x + 10} ${y + 87} H${x + 244}" stroke="#252833" stroke-width="5"/><g fill="${palette.coral}" opacity="0.8">${dots(index + 70, x + 10, y + 63, 230, 34, 40, [palette.coral, palette.gold, palette.teal, palette.cream])}</g>`;
    } else if (name === "bridge_back") {
      body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none"/><path d="M${x} ${y + 88} H${x + 256}" stroke="#574238" stroke-width="18"/><path d="M${x + 20} ${y + 88} L${x + 70} ${y + 32} L${x + 120} ${y + 88} L${x + 170} ${y + 32} L${x + 224} ${y + 88}" fill="none" stroke="#8a6244" stroke-width="9"/>`;
    } else {
      body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none"/><path d="M${x} ${y + 116} C${x + 54} ${y + 93} ${x + 114} ${y + 127} ${x + 165} ${y + 101} C${x + 195} ${y + 88} ${x + 222} ${y + 108} ${x + 256} ${y + 94} V${y + 144} H${x}z" fill="${name === "dust_haze" ? "#d7aa73" : "#6d9a5e"}" opacity="${name === "dust_haze" ? 0.38 : 0.82}"/>`;
    }
  });
  const file = "parallax-backgrounds.png";
  await writePng(path.join(dirs.backgrounds, file), svg(w * 4, h * 3, body));
  manifest.images.backgrounds = { file: `assets/backgrounds/${file}`, frameWidth: w, frameHeight: h, columns: 4, rows: 3, frames };
}

function decorFrame(name, x, y, index) {
  const base = `<rect x="${x}" y="${y}" width="96" height="96" fill="none"/>`;
  if (name === "cone") return `${base}<path d="M${x + 37} ${y + 76} L${x + 48} ${y + 24} L${x + 60} ${y + 76}z" fill="${palette.coral}"/><path d="M${x + 40} ${y + 62} H${x + 57} M${x + 43} ${y + 48} H${x + 54}" stroke="${palette.cream}" stroke-width="5"/><ellipse cx="${x + 48}" cy="${y + 78}" rx="25" ry="5" fill="#22252e" opacity="0.55"/>`;
  if (name === "hay") return `${base}<rect x="${x + 16}" y="${y + 48}" width="66" height="29" rx="6" fill="${palette.gold}"/><path d="M${x + 22} ${y + 55} C${x + 39} ${y + 49} ${x + 54} ${y + 69} ${x + 76} ${y + 56} M${x + 24} ${y + 68} H${x + 75}" stroke="#8e6331" stroke-width="3" fill="none"/>`;
  if (name === "barrel") return `${base}<ellipse cx="${x + 48}" cy="${y + 31}" rx="22" ry="8" fill="#c74b3d"/><rect x="${x + 26}" y="${y + 31}" width="44" height="42" fill="${palette.coral}"/><ellipse cx="${x + 48}" cy="${y + 73}" rx="22" ry="8" fill="#8b302e"/><path d="M${x + 29} ${y + 43} H${x + 67} M${x + 29} ${y + 60} H${x + 67}" stroke="${palette.cream}" stroke-width="4" opacity="0.82"/>`;
  if (name === "flag") return `${base}<path d="M${x + 24} ${y + 78} V${y + 20}" stroke="${palette.cream}" stroke-width="5"/><path d="M${x + 28} ${y + 22} C${x + 47} ${y + 15} ${x + 60} ${y + 32} ${x + 76} ${y + 24} V${y + 51} C${x + 59} ${y + 58} ${x + 44} ${y + 42} ${x + 28} ${y + 50}z" fill="${palette.teal}"/>`;
  if (name === "checkpoint") return `${base}<circle cx="${x + 48}" cy="${y + 44}" r="27" fill="none" stroke="${palette.teal}" stroke-width="7"/><circle cx="${x + 48}" cy="${y + 44}" r="13" fill="${palette.cream}" opacity="0.84"/><path d="M${x + 48} ${y + 70} V${y + 86}" stroke="${palette.tealDark}" stroke-width="6" stroke-linecap="round"/>`;
  if (name === "finish_left" || name === "finish_right") return `${base}<path d="M${x + 25} ${y + 84} V${y + 14}" stroke="${palette.cream}" stroke-width="7"/><rect x="${x + 30}" y="${y + 16}" width="44" height="28" fill="#f7f4e8"/><path d="M${x + 30} ${y + 16} h22 v14 h-22z M${x + 52} ${y + 30} h22 v14 h-22z" fill="#151822"/>`;
  if (name === "arrow_sign") return `${base}<rect x="${x + 15}" y="${y + 31}" width="66" height="30" rx="5" fill="${palette.cream}"/><path d="M${x + 25} ${y + 46} H${x + 61} M${x + 51} ${y + 35} L${x + 63} ${y + 46} L${x + 51} ${y + 57}" fill="none" stroke="${palette.coral}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M${x + 48} ${y + 61} V${y + 83}" stroke="#5b3d2a" stroke-width="6"/>`;
  if (name === "wrench") return `${base}<path d="M${x + 31} ${y + 64} L${x + 60} ${y + 35} M${x + 62} ${y + 26} C${x + 72} ${y + 35} ${x + 65} ${y + 50} ${x + 52} ${y + 46}" stroke="#d6e1df" stroke-width="11" stroke-linecap="round"/><circle cx="${x + 29}" cy="${y + 66}" r="11" fill="${palette.teal}"/>`;
  if (name === "clock") return `${base}<circle cx="${x + 48}" cy="${y + 48}" r="27" fill="${palette.cream}"/><circle cx="${x + 48}" cy="${y + 48}" r="22" fill="#26303b"/><path d="M${x + 48} ${y + 48} V${y + 33} M${x + 48} ${y + 48} L${x + 60} ${y + 55}" stroke="${palette.gold}" stroke-width="5" stroke-linecap="round"/>`;
  if (name === "heat_pickup") return `${base}<path d="M${x + 49} ${y + 18} C${x + 31} ${y + 39} ${x + 65} ${y + 42} ${x + 42} ${y + 76} C${x + 77} ${y + 65} ${x + 74} ${y + 35} ${x + 49} ${y + 18}z" fill="${palette.coral}"/><path d="M${x + 49} ${y + 45} C${x + 39} ${y + 57} ${x + 56} ${y + 61} ${x + 48} ${y + 74}" fill="none" stroke="${palette.gold}" stroke-width="8" stroke-linecap="round"/>`;
  if (name === "rock_cluster") return `${base}<path d="M${x + 16} ${y + 76} L${x + 29} ${y + 45} L${x + 49} ${y + 75}z" fill="#656a74"/><path d="M${x + 39} ${y + 77} L${x + 59} ${y + 34} L${x + 82} ${y + 77}z" fill="#4d5360"/><path d="M${x + 57} ${y + 37} L${x + 66} ${y + 76}" stroke="#c8d0d0" stroke-width="2" opacity="0.35"/>`;
  if (name === "scrub" || name === "pine") return `${base}<path d="M${x + 19} ${y + 76} C${x + 32} ${y + 35} ${x + 52} ${y + 58} ${x + 66} ${y + 29} C${x + 62} ${y + 56} ${x + 79} ${y + 51} ${x + 77} ${y + 78}z" fill="${name === "pine" ? "#31553d" : palette.sage}"/><rect x="${x + 45}" y="${y + 59}" width="6" height="20" fill="#5d3f29"/>`;
  return `${base}<circle cx="${x + 48}" cy="${y + 48}" r="${12 + (index % 4) * 4}" fill="${[palette.teal, palette.coral, palette.gold, palette.cream][index % 4]}"/>`;
}

async function buildDecorSheet(manifest) {
  const names = ["cone", "hay", "barrel", "flag", "checkpoint", "finish_left", "finish_right", "arrow_sign", "wrench", "clock", "heat_pickup", "rock_cluster", "scrub", "pine", "camera", "banner", "boost_marker", "lamp", "sandbag", "ribbon"];
  const frames = {};
  let body = "";
  names.forEach((name, index) => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    const x = col * 96;
    const y = row * 96;
    frames[name] = { x, y, w: 96, h: 96 };
    body += decorFrame(name, x, y, index);
  });
  const file = "decor-objects.png";
  await writePng(path.join(dirs.sprites, file), svg(480, 384, body));
  manifest.images.decor = { file: `assets/sprites/${file}`, frameWidth: 96, frameHeight: 96, columns: 5, rows: 4, frames };
}

async function buildFxSheet(manifest) {
  const frame = 96;
  const rows = ["dust", "spark", "turbo", "confetti"];
  const frames = {};
  const animations = {};
  let body = "";
  rows.forEach((anim, row) => {
    animations[anim] = [];
    for (let col = 0; col < 12; col += 1) {
      const x = col * frame;
      const y = row * frame;
      const key = `${anim}_${String(col).padStart(2, "0")}`;
      frames[key] = { x, y, w: frame, h: frame };
      animations[anim].push(key);
      const t = col / 11;
      if (anim === "dust") {
        body += `<g opacity="${(1 - t * 0.7).toFixed(2)}">${dots(200 + col, x + 14, y + 36 - t * 16, 68, 34 + t * 14, 18, ["#d7aa73", "#bf7e43", "#f3d2a1"])}</g>`;
      } else if (anim === "spark") {
        for (let i = 0; i < 9; i += 1) {
          const a = (Math.PI * 2 * i) / 9 + t;
          const r = 8 + t * 35;
          body += `<path d="M${x + 48} ${y + 50} L${x + 48 + Math.cos(a) * r} ${y + 50 + Math.sin(a) * r}" stroke="${i % 2 ? palette.gold : palette.coral}" stroke-width="${Math.max(1, 5 - t * 4).toFixed(2)}" stroke-linecap="round" opacity="${(1 - t * 0.65).toFixed(2)}"/>`;
        }
      } else if (anim === "turbo") {
        body += `<path d="M${x + 16} ${y + 48} C${x + 38} ${y + 16} ${x + 62} ${y + 26} ${x + 78} ${y + 8} C${x + 65} ${y + 42} ${x + 86} ${y + 57} ${x + 53} ${y + 85} C${x + 58} ${y + 61} ${x + 26} ${y + 70} ${x + 16} ${y + 48}z" fill="${palette.coral}" opacity="${0.9 - t * 0.45}"/><path d="M${x + 35} ${y + 55} C${x + 48} ${y + 32} ${x + 62} ${y + 41} ${x + 69} ${y + 29} C${x + 61} ${y + 55} ${x + 69} ${y + 62} ${x + 48} ${y + 78} C${x + 51} ${y + 63} ${x + 39} ${y + 67} ${x + 35} ${y + 55}z" fill="${palette.gold}"/>`;
      } else {
        for (let i = 0; i < 12; i += 1) {
          const rx = x + 18 + ((i * 19 + col * 7) % 62);
          const ry = y + 18 + ((i * 13 + col * 11) % 58);
          const color = [palette.teal, palette.coral, palette.gold, palette.cream][i % 4];
          body += `<rect x="${rx}" y="${ry + t * 20}" width="5" height="9" transform="rotate(${(i * 23 + col * 14) % 180} ${rx + 2.5} ${ry + 4.5})" fill="${color}" opacity="${(1 - t * 0.35).toFixed(2)}"/>`;
        }
      }
    }
  });
  const file = "fx-sheet.png";
  await writePng(path.join(dirs.fx, file), svg(1152, 384, body));
  manifest.images.fx = { file: `assets/fx/${file}`, frameWidth: frame, frameHeight: frame, columns: 12, rows: 4, frames, animations };
}

async function buildUiSheet(manifest) {
  const names = ["time", "speed", "heat", "checkpoint", "turbo", "restart", "medal", "wrench"];
  const frames = {};
  let body = "";
  names.forEach((name, index) => {
    const x = index * 48;
    frames[name] = { x, y: 0, w: 48, h: 48 };
    body += `<rect x="${x}" y="0" width="48" height="48" fill="none"/>`;
    if (name === "time") body += `<circle cx="${x + 24}" cy="25" r="15" fill="none" stroke="${palette.cream}" stroke-width="5"/><path d="M${x + 24} 25 V14 M${x + 24} 25 L${x + 34} 30" stroke="${palette.gold}" stroke-width="4" stroke-linecap="round"/>`;
    else if (name === "speed") body += `<path d="M${x + 9} 32 A17 17 0 0 1 ${x + 39} 32" fill="none" stroke="${palette.teal}" stroke-width="7" stroke-linecap="round"/><path d="M${x + 24} 31 L${x + 36} 18" stroke="${palette.cream}" stroke-width="5" stroke-linecap="round"/>`;
    else if (name === "heat") body += `<path d="M${x + 25} 8 C${x + 12} 24 ${x + 34} 27 ${x + 19} 41 C${x + 42} 36 ${x + 41} 18 ${x + 25} 8z" fill="${palette.coral}"/><path d="M${x + 25} 25 C${x + 18} 33 ${x + 30} 34 ${x + 24} 42" stroke="${palette.gold}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    else if (name === "checkpoint") body += `<path d="M${x + 13} 41 V8" stroke="${palette.cream}" stroke-width="5"/><path d="M${x + 17} 9 C${x + 27} 5 ${x + 32} 16 ${x + 41} 11 V28 C${x + 31} 32 ${x + 25} 21 ${x + 17} 26z" fill="${palette.teal}"/>`;
    else if (name === "turbo") body += `<path d="M${x + 11} 37 L${x + 25} 7 L${x + 23} 23 H${x + 37}z" fill="${palette.gold}"/><path d="M${x + 15} 35 L${x + 23} 26" stroke="${palette.coral}" stroke-width="4"/>`;
    else if (name === "restart") body += `<path d="M${x + 37} 17 A16 16 0 1 0 ${x + 38} 33" fill="none" stroke="${palette.cream}" stroke-width="5" stroke-linecap="round"/><path d="M${x + 37} 8 V19 H${x + 26}" fill="none" stroke="${palette.teal}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    else if (name === "medal") body += `<circle cx="${x + 24}" cy="27" r="13" fill="${palette.gold}"/><path d="M${x + 16} 5 L${x + 24} 21 L${x + 32} 5" stroke="${palette.coral}" stroke-width="7" fill="none"/>`;
    else body += `<path d="M${x + 15} 35 L${x + 34} 16" stroke="${palette.cream}" stroke-width="7" stroke-linecap="round"/><circle cx="${x + 14}" cy="36" r="7" fill="${palette.teal}"/>`;
  });
  const file = "hud-icons.png";
  await writePng(path.join(dirs.ui, file), svg(384, 48, body));
  manifest.images.ui = { file: `assets/ui/${file}`, frameWidth: 48, frameHeight: 48, columns: 8, rows: 1, frames };
}

function makeTrack(points) {
  return points.map((point, index) => ({
    x: Math.round(point[0]),
    y: Math.round(point[1]),
    type: point[2] || "dirt",
    marker: point[3] || null,
    id: index
  }));
}

function makeTileLayer(name, tileNames, columns, rows, parallax, offsetY) {
  const data = [];
  for (let r = 0; r < rows; r += 1) {
    const row = [];
    for (let c = 0; c < columns; c += 1) {
      row.push(tileNames[(c + r * 3) % tileNames.length]);
    }
    data.push(row);
  }
  return { name, tileWidth: 256, tileHeight: 144, columns, rows, parallax, offsetY, data };
}

function extendPoints(points, length, theme) {
  const extended = points.slice();
  const last = extended[extended.length - 1];
  if (last && last[2] === "finish") extended.pop();
  const base = theme === "pine" ? 492 : theme === "storm" ? 505 : 500;
  let x = extended[extended.length - 1][0];
  let stepIndex = 0;
  while (x < length - 520) {
    x += 360 + (stepIndex % 4) * 95;
    const wave = Math.sin(stepIndex * 0.9) * 54 + Math.sin(stepIndex * 0.37) * 28;
    const y = Math.max(378, Math.min(548, base + wave));
    let type = "dirt";
    if (stepIndex % 8 === 4) type = "checkpoint";
    else if (stepIndex % 7 === 3) type = "ramp";
    else if (stepIndex % 9 === 1) type = "boost";
    else if (stepIndex % 10 === 5) type = "mud";
    extended.push([Math.min(x, length - 260), y, type]);
    stepIndex += 1;
  }
  extended.push([length, base, "finish"]);
  return extended;
}

function extendZones(zones, length) {
  const out = zones.slice();
  for (let x = 7100; x < length - 800; x += 1450) {
    out.push({ x, w: 340, type: x % 2900 === 0 ? "mud" : "boost" });
    out.push({ x: x + 620, w: 290, type: "draft" });
  }
  return out;
}

function extendObjects(objects, length, kinds, start, spacing) {
  const out = objects.slice();
  for (let x = start; x < length - 600; x += spacing) {
    out.push({ x, kind: kinds[Math.floor(x / spacing) % kinds.length] });
  }
  return out;
}

function buildLevel(id, title, theme, length, points, zones, hazards, pickups, decorations) {
  const routePoints = extendPoints(points, length, theme);
  const columns = Math.ceil(length / 256) + 8;
  const gold = Math.round((length / 245) * 10) / 10;
  const silver = Math.round((length / 198) * 10) / 10;
  const bronze = Math.round((length / 155) * 10) / 10;
  return {
    id,
    title,
    theme,
    length,
    medals: { gold, silver, bronze },
    gravity: theme === "storm" ? 1610 : 1530,
    perspective: true,
    start: { x: 140, y: routePoints[0][1] - 52 },
    track: makeTrack(routePoints),
    checkpoints: routePoints.filter((p) => p[2] === "checkpoint" || p[3] === "checkpoint").map((p) => p[0]),
    zones: extendZones(zones, length),
    hazards: extendObjects(hazards, length, ["cone", "hay", "barrel", "rock_cluster"], 8200, 1850),
    pickups: extendObjects(pickups, length, ["clock", "wrench", "heat_pickup"], 7600, 1720),
    decorations: extendObjects(decorations, length, ["flag", "arrow_sign", "camera", "banner", "lamp", "scrub", "pine"], 7000, 690),
    tileLayers: [
      makeTileLayer("sky", theme === "pine" ? ["sky_clear", "cloud_soft", "cloud_long"] : theme === "storm" ? ["night_ridge", "cloud_long", "dust_haze"] : ["sky_clear", "sunset_sky", "cloud_soft"], Math.ceil(columns * 0.22), 2, 0.08, 0),
      makeTileLayer("far", theme === "pine" ? ["pine_ridge", "mesa_far", "cloud_soft"] : theme === "storm" ? ["night_ridge", "mesa_far", "bridge_back"] : ["mesa_far", "dust_haze", "cloud_long"], Math.ceil(columns * 0.38), 2, 0.18, 130),
      makeTileLayer("near", theme === "pine" ? ["pine_ridge", "scrubland", "bridge_back"] : ["mesa_near", "scrubland", "grandstand"], Math.ceil(columns * 0.62), 2, 0.34, 265)
    ]
  };
}

function buildMaps() {
  const canyon = buildLevel(
    "canyon-run",
    "Canyon Run",
    "canyon",
    12800,
    [
      [0, 520], [420, 520], [760, 492], [1080, 492, "boost"], [1320, 540, "ramp"], [1580, 452], [1840, 462, "checkpoint"], [2140, 500],
      [2500, 500, "mud"], [2860, 462], [3180, 448, "ramp"], [3420, 390], [3700, 462, "checkpoint"], [4100, 512], [4420, 512, "boost"],
      [4740, 474], [5060, 500, "mud"], [5350, 432, "ramp"], [5640, 410, "checkpoint"], [6020, 500], [6500, 500, "finish"]
    ],
    [
      { x: 1040, w: 260, type: "boost" },
      { x: 2380, w: 320, type: "mud" },
      { x: 4340, w: 260, type: "boost" },
      { x: 4930, w: 270, type: "mud" }
    ],
    [
      { x: 1560, kind: "cone" },
      { x: 2900, kind: "hay" },
      { x: 5180, kind: "barrel" }
    ],
    [
      { x: 2220, kind: "clock" },
      { x: 3850, kind: "wrench" },
      { x: 5800, kind: "heat_pickup" }
    ],
    [
      { x: 820, kind: "arrow_sign" }, { x: 1840, kind: "checkpoint" }, { x: 3700, kind: "checkpoint" }, { x: 5640, kind: "checkpoint" },
      { x: 6420, kind: "finish_left" }, { x: 6470, kind: "finish_right" }, { x: 1220, kind: "scrub" }, { x: 3320, kind: "rock_cluster" }, { x: 4560, kind: "flag" }
    ]
  );
  const pine = buildLevel(
    "pine-switchbacks",
    "Pine Switchbacks",
    "pine",
    14200,
    [
      [0, 510], [480, 510], [830, 470], [1160, 528, "mud"], [1460, 528], [1740, 458, "ramp"], [2040, 438, "checkpoint"],
      [2360, 478], [2760, 438], [3110, 438, "boost"], [3420, 505], [3740, 500], [4080, 455, "checkpoint"], [4440, 432, "ramp"],
      [4720, 382], [5070, 480], [5400, 520, "mud"], [5780, 460], [6150, 442, "checkpoint"], [6510, 500], [7200, 500, "finish"]
    ],
    [
      { x: 1120, w: 300, type: "mud" },
      { x: 3040, w: 320, type: "boost" },
      { x: 5320, w: 340, type: "mud" }
    ],
    [
      { x: 980, kind: "rock_cluster" },
      { x: 3530, kind: "hay" },
      { x: 5960, kind: "cone" }
    ],
    [
      { x: 2520, kind: "clock" },
      { x: 4220, kind: "wrench" },
      { x: 6400, kind: "heat_pickup" }
    ],
    [
      { x: 520, kind: "pine" }, { x: 2040, kind: "checkpoint" }, { x: 4080, kind: "checkpoint" }, { x: 6150, kind: "checkpoint" },
      { x: 7130, kind: "finish_left" }, { x: 7180, kind: "finish_right" }, { x: 1600, kind: "flag" }, { x: 4700, kind: "scrub" }
    ]
  );
  const storm = buildLevel(
    "storm-lights",
    "Storm Lights",
    "storm",
    15600,
    [
      [0, 522], [500, 522], [870, 480], [1180, 480, "boost"], [1480, 545], [1840, 430, "ramp"], [2160, 414, "checkpoint"],
      [2480, 475], [2850, 538, "mud"], [3220, 494], [3560, 438, "ramp"], [3900, 405], [4260, 462, "checkpoint"], [4620, 520],
      [5040, 498, "boost"], [5400, 454], [5750, 528, "mud"], [6120, 448, "ramp"], [6460, 420, "checkpoint"], [6840, 470], [7300, 500], [7800, 500, "finish"]
    ],
    [
      { x: 1100, w: 280, type: "boost" },
      { x: 2780, w: 350, type: "mud" },
      { x: 4960, w: 300, type: "boost" },
      { x: 5660, w: 320, type: "mud" }
    ],
    [
      { x: 1540, kind: "barrel" },
      { x: 3300, kind: "hay" },
      { x: 5920, kind: "cone" }
    ],
    [
      { x: 2360, kind: "clock" },
      { x: 4500, kind: "wrench" },
      { x: 6680, kind: "heat_pickup" }
    ],
    [
      { x: 720, kind: "lamp" }, { x: 2160, kind: "checkpoint" }, { x: 4260, kind: "checkpoint" }, { x: 6460, kind: "checkpoint" },
      { x: 7730, kind: "finish_left" }, { x: 7780, kind: "finish_right" }, { x: 5050, kind: "flag" }, { x: 3720, kind: "camera" }
    ]
  );
  for (const level of [canyon, pine, storm]) {
    writeJson(path.join(dirs.maps, `${level.id}.json`), level);
  }
  return [canyon, pine, storm].map((level) => ({ id: level.id, title: level.title, file: `assets/maps/${level.id}.json`, length: level.length, theme: level.theme }));
}

async function main() {
  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceImages: [
      "assets/source/imagen-bike-rider-source.png",
      "assets/source/imagen-terrain-tiles-source.png",
      "assets/source/imagen-fx-objects-source.png",
      "assets/source/imagen-hd-mode7-tile-map.png",
      "assets/source/imagen-hd-background-strips.png"
    ],
    images: {},
    audio: {
      bgm: "assets/audio/ridge-bgm.wav",
      jump: "assets/audio/jump.wav",
      land: "assets/audio/land.wav",
      pickup: "assets/audio/pickup.wav",
      crash: "assets/audio/crash.wav",
      finish: "assets/audio/finish.wav"
    }
  };

  await buildBikeSheet(manifest);
  await buildTerrainSheet(manifest);
  await buildBackgroundSheet(manifest);
  await buildImagenHdAssets(manifest);
  await buildDecorSheet(manifest);
  await buildFxSheet(manifest);
  await buildUiSheet(manifest);
  manifest.levels = buildMaps();
  writeJson(path.join(root, "assets", "manifest.json"), manifest);
  console.log(JSON.stringify({ ok: true, images: Object.keys(manifest.images), levels: manifest.levels.map((level) => level.id) }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
