const fs = require("fs");
const path = require("path");

function resolveSharp() {
  try {
    return require("sharp");
  } catch (firstError) {
    const candidates = [
      "C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp",
      "C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp",
    ];
    for (const candidate of candidates) {
      try {
        return require(candidate);
      } catch {}
    }
    throw firstError;
  }
}

const sharp = resolveSharp();
const root = path.resolve(__dirname, "..");
const generatedDir = path.join(root, "assets", "generated");
const audioDir = path.join(root, "assets", "audio");
fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(audioDir, { recursive: true });

function svgNoiseFilter(id, freq = 0.018, octaves = 4, seed = 13) {
  return `
    <filter id="${id}">
      <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${octaves}" seed="${seed}"/>
      <feColorMatrix type="saturate" values="1.25"/>
    </filter>`;
}

function nebulaSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1024" viewBox="0 0 2048 1024">
  <defs>
    <radialGradient id="core" cx="48%" cy="52%" r="60%">
      <stop offset="0" stop-color="#44e6ff" stop-opacity=".44"/>
      <stop offset=".33" stop-color="#a98cff" stop-opacity=".20"/>
      <stop offset=".68" stop-color="#ff5f9a" stop-opacity=".12"/>
      <stop offset="1" stop-color="#03040a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="veil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#06142a"/>
      <stop offset=".5" stop-color="#11091f"/>
      <stop offset="1" stop-color="#03130f"/>
    </linearGradient>
    ${svgNoiseFilter("noise", 0.011, 5, 27)}
    <filter id="blur"><feGaussianBlur stdDeviation="20"/></filter>
  </defs>
  <rect width="2048" height="1024" fill="url(#veil)"/>
  <rect width="2048" height="1024" filter="url(#noise)" opacity=".22"/>
  <ellipse cx="960" cy="510" rx="760" ry="360" fill="url(#core)" filter="url(#blur)"/>
  <ellipse cx="1410" cy="240" rx="410" ry="170" fill="#ffca62" opacity=".13" filter="url(#blur)"/>
  <ellipse cx="470" cy="720" rx="520" ry="210" fill="#b7ff68" opacity=".11" filter="url(#blur)"/>
  ${stars(210, 2048, 1024)}
  <path d="M0 612 C340 452 620 692 930 520 S1530 430 2048 585" fill="none" stroke="#44e6ff" stroke-width="5" opacity=".16"/>
  <path d="M0 682 C300 540 650 740 970 610 S1560 540 2048 680" fill="none" stroke="#ff5f9a" stroke-width="3" opacity=".18"/>
</svg>`;
}

function materialSvg(kind) {
  const configs = {
    hull: ["#111c2e", "#44e6ff", "#f6fbff", "#ffca62"],
    enemy: ["#220d24", "#ff5f9a", "#a98cff", "#ffca62"],
    asteroid: ["#31271e", "#8b7055", "#d8ba82", "#4a3729"],
    ring: ["#04151b", "#44e6ff", "#b7ff68", "#ffca62"],
    prism: ["#130b2b", "#a98cff", "#ff5f9a", "#44e6ff"],
  };
  const [bg, a, b, c] = configs[kind];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>${svgNoiseFilter("grain", 0.045, 4, kind.length * 9)}
      <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${b}" stop-opacity=".28"/>
        <stop offset=".48" stop-color="${a}" stop-opacity=".08"/>
        <stop offset="1" stop-color="${c}" stop-opacity=".22"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="${bg}"/>
    <rect width="512" height="512" filter="url(#grain)" opacity=".24"/>
    <rect x="26" y="46" width="460" height="420" rx="28" fill="url(#shine)" opacity=".75"/>
    ${materialLines(kind, a, b, c)}
  </svg>`;
}

function materialLines(kind, a, b, c) {
  if (kind === "asteroid") {
    return `<path d="M52 160l128-96 168 42 96 132-58 154-174 72-144-80z" fill="${a}" opacity=".38"/>
    <path d="M120 178l92-64 74 32-36 82zM268 294l88-48 24 82-90 54zM114 354l82 34 18 48-122-38z" fill="${c}" opacity=".42"/>
    <path d="M52 96l398 310M78 448L430 78" stroke="${b}" stroke-width="10" opacity=".12"/>`;
  }
  if (kind === "ring") {
    return `<circle cx="256" cy="256" r="178" fill="none" stroke="${a}" stroke-width="46" opacity=".65"/>
    <circle cx="256" cy="256" r="116" fill="none" stroke="${b}" stroke-width="18" opacity=".55"/>
    <path d="M256 28v108M256 376v108M28 256h108M376 256h108" stroke="${c}" stroke-width="23" opacity=".72"/>`;
  }
  if (kind === "prism") {
    return `<path d="M256 54l176 102-66 246H146L80 156z" fill="${a}" opacity=".34"/>
    <path d="M256 54v348M80 156l286 246M432 156L146 402" stroke="${b}" stroke-width="14" opacity=".33"/>
    <circle cx="256" cy="256" r="78" fill="${c}" opacity=".28"/>`;
  }
  return `<path d="M46 114h420M46 256h420M46 398h420" stroke="${a}" stroke-width="10" opacity=".35"/>
    <path d="M92 38l328 436M420 38L92 474" stroke="${b}" stroke-width="12" opacity=".18"/>
    <circle cx="256" cy="256" r="86" fill="${c}" opacity=".18"/>
    <circle cx="256" cy="256" r="38" fill="${a}" opacity=".42"/>`;
}

function logoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="512" viewBox="0 0 1024 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#44e6ff"/>
      <stop offset=".52" stop-color="#f6fbff"/>
      <stop offset="1" stop-color="#ffca62"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1024" height="512" fill="#02030a"/>
  <path d="M116 298l112-150 88 88 196-154 198 154 88-88 112 150-198-34-200 122-198-122z" fill="none" stroke="#44e6ff" stroke-width="18" opacity=".5" filter="url(#glow)"/>
  <text x="512" y="248" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="96" font-weight="900" fill="url(#g)" letter-spacing="8" filter="url(#glow)">NOVA WING</text>
  <text x="512" y="318" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700" fill="#b7ff68" letter-spacing="14">PRISM RUN</text>
  </svg>`;
}

function decalSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" fill="#03040a"/>
    ${decalCell(0, 0, "#44e6ff", "wing")}
    ${decalCell(512, 0, "#ff5f9a", "burst")}
    ${decalCell(0, 512, "#b7ff68", "core")}
    ${decalCell(512, 512, "#ffca62", "warning")}
  </svg>`;
}

function decalCell(x, y, color, type) {
  const cx = x + 256;
  const cy = y + 256;
  if (type === "wing") return `<g transform="translate(${x} ${y})"><path d="M88 292l168-168 168 168-118-36-50 74-50-74z" fill="${color}" opacity=".82"/><circle cx="256" cy="256" r="138" fill="none" stroke="${color}" stroke-width="14" opacity=".42"/></g>`;
  if (type === "burst") return `<g transform="translate(${x} ${y})"><circle cx="256" cy="256" r="82" fill="${color}" opacity=".72"/><path d="M256 56v400M56 256h400M114 114l284 284M398 114L114 398" stroke="${color}" stroke-width="22" opacity=".35"/></g>`;
  if (type === "core") return `<g transform="translate(${x} ${y})"><path d="M256 68l164 94v188l-164 94-164-94V162z" fill="none" stroke="${color}" stroke-width="18"/><circle cx="256" cy="256" r="54" fill="${color}" opacity=".76"/></g>`;
  return `<g><path d="M${cx} ${cy - 170}l154 300H${cx - 154}z" fill="${color}" opacity=".7"/><rect x="${cx - 16}" y="${cy - 72}" width="32" height="130" fill="#03040a"/><rect x="${cx - 16}" y="${cy + 86}" width="32" height="32" fill="#03040a"/></g>`;
}

function stars(count, width, height) {
  let out = "";
  let n = 912931;
  for (let i = 0; i < count; i += 1) {
    n = (n * 1664525 + 1013904223) >>> 0;
    const x = n % width;
    n = (n * 1664525 + 1013904223) >>> 0;
    const y = n % height;
    n = (n * 1664525 + 1013904223) >>> 0;
    const r = 1 + (n % 4);
    const color = ["#f6fbff", "#44e6ff", "#ffca62", "#b7ff68", "#ff5f9a"][n % 5];
    out += `<circle cx="${x}" cy="${y}" r="${r / 2}" fill="${color}" opacity="${0.35 + (n % 40) / 100}"/>`;
  }
  return out;
}

async function writePng(file, svg, width, height) {
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(path.join(generatedDir, file));
}

function writeWav(file, samples, sampleRate = 44100) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(audioDir, file), buffer);
}

function synthBgm(seconds = 38, sampleRate = 44100) {
  const length = seconds * sampleRate;
  const out = new Float32Array(length);
  const bass = [55, 55, 65.41, 49, 73.42, 65.41, 55, 82.41];
  const lead = [220, 277.18, 329.63, 440, 392, 329.63, 277.18, 246.94];
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const step = Math.floor(t * 2) % bass.length;
    const beat = (t * 2) % 1;
    const env = Math.exp(-beat * 2.4);
    const kick = Math.sin(2 * Math.PI * (68 - beat * 34) * t) * Math.exp(-((t * 2) % 1) * 11);
    const b = Math.sin(2 * Math.PI * bass[step] * t) * 0.22;
    const arp = Math.sin(2 * Math.PI * lead[(Math.floor(t * 8) + step) % lead.length] * t) * 0.12 * env;
    const pad = (Math.sin(2 * Math.PI * 110 * t) + Math.sin(2 * Math.PI * 164.81 * t + 0.8)) * 0.045;
    const noise = ((Math.sin(t * 1103.3) * 43758.5453) % 1) * 0.012 * (beat < 0.08 ? 1 : 0);
    out[i] = (b + arp + pad + kick * 0.18 + noise) * 0.56;
  }
  return out;
}

function synthSfx(kind, seconds, sampleRate = 44100) {
  const length = Math.floor(seconds * sampleRate);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const p = t / seconds;
    const env = Math.sin(Math.PI * Math.min(1, p)) * Math.exp(-p * 2.2);
    let sample = 0;
    if (kind === "laser") sample = Math.sin(2 * Math.PI * (920 - p * 360) * t) * env;
    if (kind === "explosion") sample = (((Math.sin(i * 91.7) * 43758.5453) % 1) * 2 - 1) * Math.exp(-p * 6) + Math.sin(2 * Math.PI * (120 - p * 80) * t) * Math.exp(-p * 4);
    if (kind === "pickup") sample = (Math.sin(2 * Math.PI * (540 + p * 820) * t) + Math.sin(2 * Math.PI * (810 + p * 960) * t)) * 0.45 * env;
    if (kind === "hit") sample = Math.sin(2 * Math.PI * (150 - p * 80) * t) * Math.exp(-p * 7) + (((Math.sin(i * 33.1) * 9173.11) % 1) * 2 - 1) * Math.exp(-p * 9);
    if (kind === "boost") sample = (Math.sin(2 * Math.PI * (160 + p * 90) * t) + (((Math.sin(i * 17.7) * 131.13) % 1) * 2 - 1) * 0.25) * env;
    if (kind === "win") sample = (Math.sin(2 * Math.PI * 523.25 * t) + Math.sin(2 * Math.PI * 659.25 * t) + Math.sin(2 * Math.PI * 783.99 * t)) * 0.24 * env;
    out[i] = sample * 0.58;
  }
  return out;
}

(async () => {
  await writePng("nova-nebula-panorama.png", nebulaSvg(), 2048, 1024);
  await writePng("nova-hull-albedo.png", materialSvg("hull"), 512, 512);
  await writePng("nova-enemy-albedo.png", materialSvg("enemy"), 512, 512);
  await writePng("nova-asteroid-albedo.png", materialSvg("asteroid"), 512, 512);
  await writePng("nova-ring-emissive.png", materialSvg("ring"), 512, 512);
  await writePng("nova-prism-core.png", materialSvg("prism"), 512, 512);
  await writePng("nova-logo.png", logoSvg(), 1024, 512);
  await writePng("nova-decal-atlas.png", decalSvg(), 1024, 1024);

  writeWav("nova-bgm-loop.wav", synthBgm());
  writeWav("laser.wav", synthSfx("laser", 0.18));
  writeWav("explosion.wav", synthSfx("explosion", 0.8));
  writeWav("pickup.wav", synthSfx("pickup", 0.42));
  writeWav("hit.wav", synthSfx("hit", 0.36));
  writeWav("boost.wav", synthSfx("boost", 0.5));
  writeWav("win.wav", synthSfx("win", 1.2));
  console.log("Generated Nova Wing graphics and audio assets");
})();
