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

function shieldSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="52%">
      <stop offset="0" stop-color="#44e6ff" stop-opacity=".04"/>
      <stop offset=".58" stop-color="#44e6ff" stop-opacity=".10"/>
      <stop offset=".82" stop-color="#b7ff68" stop-opacity=".34"/>
      <stop offset="1" stop-color="#f6fbff" stop-opacity=".02"/>
    </radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <rect width="1024" height="1024" fill="transparent"/>
  <circle cx="512" cy="512" r="430" fill="url(#g)"/>
  <circle cx="512" cy="512" r="396" fill="none" stroke="#44e6ff" stroke-width="18" opacity=".36" filter="url(#soft)"/>
  <circle cx="512" cy="512" r="312" fill="none" stroke="#a98cff" stroke-width="9" opacity=".22"/>
  ${Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const x1 = 512 + Math.cos(a) * 330;
    const y1 = 512 + Math.sin(a) * 330;
    const x2 = 512 + Math.cos(a) * 430;
    const y2 = 512 + Math.sin(a) * 430;
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#f6fbff" stroke-width="7" opacity=".17"/>`;
  }).join("")}
  </svg>`;
}

function shardSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="facet" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6fbff"/>
      <stop offset=".32" stop-color="#44e6ff"/>
      <stop offset=".66" stop-color="#b7ff68"/>
      <stop offset="1" stop-color="#ffca62"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="16" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1024" height="1024" fill="#02030a"/>
  <path d="M512 76l256 206-94 522-162 144-168-144-88-522z" fill="url(#facet)" filter="url(#glow)"/>
  <path d="M512 76v872M256 282l418 522M768 282L344 804" stroke="#03131a" stroke-width="22" opacity=".28"/>
  <path d="M360 236l152-160 150 160-150 114z" fill="#f6fbff" opacity=".32"/>
  <circle cx="512" cy="512" r="212" fill="none" stroke="#44e6ff" stroke-width="18" opacity=".24"/>
  </svg>`;
}

function flareSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="f" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#f6fbff" stop-opacity=".95"/>
      <stop offset=".22" stop-color="#ffca62" stop-opacity=".82"/>
      <stop offset=".55" stop-color="#ff5f9a" stop-opacity=".36"/>
      <stop offset="1" stop-color="#44e6ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="transparent"/>
  <circle cx="256" cy="256" r="238" fill="url(#f)"/>
  <path d="M256 20v472M20 256h472M92 92l328 328M420 92L92 420" stroke="#f6fbff" stroke-width="10" opacity=".22"/>
  </svg>`;
}

function eliteSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="e" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffca62"/>
      <stop offset=".5" stop-color="#ff5f9a"/>
      <stop offset="1" stop-color="#44e6ff"/>
    </linearGradient>
    ${svgNoiseFilter("grain", 0.028, 5, 44)}
  </defs>
  <rect width="1024" height="1024" fill="#08020f"/>
  <rect width="1024" height="1024" filter="url(#grain)" opacity=".25"/>
  <path d="M512 82l332 178-126 576H306L180 260z" fill="url(#e)" opacity=".62"/>
  <path d="M512 82v754M180 260l538 576M844 260L306 836" stroke="#f6fbff" stroke-width="18" opacity=".24"/>
  <circle cx="512" cy="512" r="164" fill="none" stroke="#b7ff68" stroke-width="24" opacity=".38"/>
  </svg>`;
}

function cockpitSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#44e6ff" stop-opacity=".24"/>
      <stop offset=".55" stop-color="#44e6ff" stop-opacity=".03"/>
      <stop offset="1" stop-color="#ffca62" stop-opacity=".16"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <rect width="1920" height="1080" fill="transparent"/>
  <path d="M0 0h1920v150c-376-72-705-92-960-92S376 78 0 150z" fill="url(#edge)" opacity=".55"/>
  <path d="M0 1080h1920V890c-386 90-705 118-960 118S386 980 0 890z" fill="#020814" opacity=".36"/>
  <path d="M86 1060C210 760 352 562 520 418M1834 1060C1710 760 1568 562 1400 418" fill="none" stroke="#44e6ff" stroke-width="8" opacity=".16" filter="url(#soft)"/>
  <path d="M290 1020C412 704 548 484 720 322M1630 1020C1508 704 1372 484 1200 322" fill="none" stroke="#f6fbff" stroke-width="3" opacity=".13"/>
  <path d="M870 1018h180l52 62H818z" fill="#061221" opacity=".45"/>
  <circle cx="960" cy="540" r="112" fill="none" stroke="#44e6ff" stroke-width="3" opacity=".18"/>
  </svg>`;
}

function supplyPodSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="pod" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6fbff"/>
      <stop offset=".34" stop-color="#44e6ff"/>
      <stop offset=".72" stop-color="#b7ff68"/>
      <stop offset="1" stop-color="#0b1f2a"/>
    </linearGradient>
    ${svgNoiseFilter("grain", 0.02, 4, 91)}
  </defs>
  <rect width="1024" height="1024" fill="#020814"/>
  <rect width="1024" height="1024" filter="url(#grain)" opacity=".18"/>
  <path d="M256 214h512l116 298-116 298H256L140 512z" fill="url(#pod)" opacity=".78"/>
  <path d="M256 214l256 298 256-298M256 810l256-298 256 298" fill="none" stroke="#f6fbff" stroke-width="18" opacity=".3"/>
  <circle cx="512" cy="512" r="134" fill="#061221" opacity=".58"/>
  <path d="M512 390v244M390 512h244" stroke="#b7ff68" stroke-width="54" stroke-linecap="round"/>
  <circle cx="512" cy="512" r="214" fill="none" stroke="#44e6ff" stroke-width="18" opacity=".32"/>
  </svg>`;
}

function waypointSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="w" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#f6fbff" stop-opacity=".9"/>
      <stop offset=".25" stop-color="#b7ff68" stop-opacity=".72"/>
      <stop offset=".55" stop-color="#44e6ff" stop-opacity=".28"/>
      <stop offset="1" stop-color="#44e6ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="transparent"/>
  <circle cx="512" cy="512" r="420" fill="url(#w)"/>
  <path d="M512 112l92 258 270 10-212 166 74 266-224-150-224 150 74-266-212-166 270-10z" fill="#f6fbff" opacity=".24"/>
  <circle cx="512" cy="512" r="170" fill="none" stroke="#44e6ff" stroke-width="20" opacity=".42"/>
  </svg>`;
}

function auroraRibbonSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="512" viewBox="0 0 1600 512">
  <defs>
    <linearGradient id="cyan" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#44e6ff" stop-opacity="0"/>
      <stop offset=".22" stop-color="#44e6ff" stop-opacity=".48"/>
      <stop offset=".55" stop-color="#b7ff68" stop-opacity=".42"/>
      <stop offset=".82" stop-color="#ff5f9a" stop-opacity=".34"/>
      <stop offset="1" stop-color="#44e6ff" stop-opacity="0"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="10"/></filter>
  </defs>
  <rect width="1600" height="512" fill="transparent"/>
  <path d="M-40 282C216 116 398 356 624 230s408-70 582 38 266 48 438-92" fill="none" stroke="url(#cyan)" stroke-width="84" opacity=".62" filter="url(#soft)"/>
  <path d="M-20 316C226 188 438 390 658 278s420-54 604 64 242 22 366-62" fill="none" stroke="#f6fbff" stroke-width="9" opacity=".26"/>
  <path d="M10 220C280 70 484 278 712 170s408-52 566 30 226 76 332-10" fill="none" stroke="#44e6ff" stroke-width="14" opacity=".28"/>
  </svg>`;
}

function slipstreamWakeSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="wake" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#f6fbff" stop-opacity=".86"/>
      <stop offset=".18" stop-color="#44e6ff" stop-opacity=".56"/>
      <stop offset=".48" stop-color="#b7ff68" stop-opacity=".22"/>
      <stop offset="1" stop-color="#44e6ff" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect width="1024" height="1024" fill="transparent"/>
  <circle cx="512" cy="512" r="420" fill="url(#wake)" filter="url(#soft)"/>
  <circle cx="512" cy="512" r="306" fill="none" stroke="#f6fbff" stroke-width="18" opacity=".24"/>
  <path d="M512 166l74 186 198 24-148 132 40 196-164-104-164 104 40-196-148-132 198-24z" fill="#44e6ff" opacity=".16"/>
  <path d="M244 512h536M512 244v536" stroke="#b7ff68" stroke-width="34" stroke-linecap="round" opacity=".34"/>
  </svg>`;
}

function signalBeaconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#f6fbff" stop-opacity=".95"/>
      <stop offset=".26" stop-color="#44e6ff" stop-opacity=".68"/>
      <stop offset=".58" stop-color="#b7ff68" stop-opacity=".28"/>
      <stop offset="1" stop-color="#44e6ff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="core" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6fbff"/>
      <stop offset=".42" stop-color="#44e6ff"/>
      <stop offset="1" stop-color="#a98cff"/>
    </linearGradient>
    ${svgNoiseFilter("grain", 0.024, 4, 117)}
  </defs>
  <rect width="1024" height="1024" fill="#020814"/>
  <circle cx="512" cy="512" r="470" fill="url(#halo)"/>
  <rect width="1024" height="1024" filter="url(#grain)" opacity=".16"/>
  <path d="M512 98l252 184v300L512 926 260 582V282z" fill="url(#core)" opacity=".74"/>
  <path d="M512 98v828M260 282l504 300M764 282L260 582" stroke="#03131a" stroke-width="22" opacity=".24"/>
  <circle cx="512" cy="512" r="176" fill="#061221" opacity=".55"/>
  <path d="M512 326v372M326 512h372" stroke="#b7ff68" stroke-width="36" stroke-linecap="round" opacity=".88"/>
  <circle cx="512" cy="512" r="292" fill="none" stroke="#f6fbff" stroke-width="18" opacity=".22"/>
  </svg>`;
}

function briefingCardSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="420" viewBox="0 0 1400 420">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#061b2d"/>
      <stop offset=".54" stop-color="#10091f"/>
      <stop offset="1" stop-color="#06291e"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1400" height="420" rx="36" fill="url(#bg)"/>
  <path d="M64 320C260 142 478 292 704 184s424-86 632 70" fill="none" stroke="#44e6ff" stroke-width="10" opacity=".28"/>
  <path d="M106 102h1188M106 318h1188" stroke="#f6fbff" stroke-width="4" opacity=".14"/>
  <circle cx="242" cy="210" r="82" fill="none" stroke="#44e6ff" stroke-width="10" opacity=".48"/>
  <path d="M242 116v188M148 210h188" stroke="#b7ff68" stroke-width="18" opacity=".7" stroke-linecap="round"/>
  <path d="M460 120h520M460 184h730M460 248h640" stroke="#f6fbff" stroke-width="18" opacity=".2"/>
  <text x="460" y="330" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="900" fill="#ffca62" letter-spacing="8" filter="url(#glow)">SIGNAL RELAY ROUTE</text>
  </svg>`;
}

function medalBadgeSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="medal" cx="50%" cy="40%" r="58%">
      <stop offset="0" stop-color="#f6fbff"/>
      <stop offset=".35" stop-color="#ffca62"/>
      <stop offset=".72" stop-color="#44e6ff"/>
      <stop offset="1" stop-color="#0b1524"/>
    </radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="12" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1024" height="1024" fill="transparent"/>
  <path d="M328 48h368l-62 286H390z" fill="#ff5f9a" opacity=".8"/>
  <circle cx="512" cy="572" r="344" fill="url(#medal)" filter="url(#glow)"/>
  <circle cx="512" cy="572" r="258" fill="none" stroke="#061221" stroke-width="26" opacity=".42"/>
  <path d="M512 342l68 146 160 20-118 110 30 158-140-78-140 78 30-158-118-110 160-20z" fill="#f6fbff" opacity=".82"/>
  <circle cx="512" cy="572" r="392" fill="none" stroke="#44e6ff" stroke-width="18" opacity=".3"/>
  </svg>`;
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
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(path.join(generatedDir, file));
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
    const hat = (((Math.sin(i * 19.13) * 9317.21) % 1) * 2 - 1) * 0.04 * (beat > 0.48 && beat < 0.56 ? 1 : 0);
    const noise = ((Math.sin(t * 1103.3) * 43758.5453) % 1) * 0.018 * (beat < 0.08 ? 1 : 0);
    out[i] = (b + arp + pad + kick * 0.24 + hat + noise) * 0.86;
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
  await writePng("nova-nebula-panorama.png", nebulaSvg(), 2560, 1280);
  await writePng("nova-hull-albedo.png", materialSvg("hull"), 512, 512);
  await writePng("nova-enemy-albedo.png", materialSvg("enemy"), 512, 512);
  await writePng("nova-asteroid-albedo.png", materialSvg("asteroid"), 512, 512);
  await writePng("nova-ring-emissive.png", materialSvg("ring"), 512, 512);
  await writePng("nova-prism-core.png", materialSvg("prism"), 512, 512);
  await writePng("nova-logo.png", logoSvg(), 1024, 512);
  await writePng("nova-decal-atlas.png", decalSvg(), 1024, 1024);
  await writePng("nova-shield-shell.png", shieldSvg(), 1024, 1024);
  await writePng("nova-power-shard.png", shardSvg(), 1024, 1024);
  await writePng("nova-engine-flare.png", flareSvg(), 512, 512);
  await writePng("nova-elite-mask.png", eliteSvg(), 1024, 1024);
  await writePng("nova-cockpit-overlay.png", cockpitSvg(), 1920, 1080);
  await writePng("nova-supply-pod.png", supplyPodSvg(), 1024, 1024);
  await writePng("nova-waypoint-bloom.png", waypointSvg(), 1024, 1024);
  await writePng("nova-signal-beacon.png", signalBeaconSvg(), 1024, 1024);
  await writePng("nova-aurora-ribbon.png", auroraRibbonSvg(), 1600, 512);
  await writePng("nova-slipstream-wake.png", slipstreamWakeSvg(), 1024, 1024);
  await writePng("nova-briefing-card.png", briefingCardSvg(), 1400, 420);
  await writePng("nova-medal-badge.png", medalBadgeSvg(), 1024, 1024);

  writeWav("nova-bgm-loop.wav", synthBgm());
  writeWav("laser.wav", synthSfx("laser", 0.18));
  writeWav("explosion.wav", synthSfx("explosion", 0.8));
  writeWav("pickup.wav", synthSfx("pickup", 0.42));
  writeWav("hit.wav", synthSfx("hit", 0.36));
  writeWav("boost.wav", synthSfx("boost", 0.5));
  writeWav("win.wav", synthSfx("win", 1.2));
  console.log("Generated Nova Wing graphics and audio assets");
})();
