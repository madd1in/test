const dom = {
  app: document.getElementById("app"),
  roundLabel: document.getElementById("roundLabel"),
  timer: document.getElementById("timer"),
  timerFill: document.getElementById("timerFill"),
  score: document.getElementById("score"),
  scoreMultiplier: document.getElementById("scoreMultiplier"),
  sessionInfo: document.getElementById("sessionInfo"),
  dailyFocus: document.getElementById("dailyFocus"),
  dailyFocusHint: document.getElementById("dailyFocusHint"),
  heartRow: document.getElementById("heartRow"),
  missionPanel: document.getElementById("missionPanel"),
  missionList: document.getElementById("missionList"),
  missionCount: document.getElementById("missionCount"),
  momentumFill: document.getElementById("momentumFill"),
  momentumValue: document.getElementById("momentumValue"),
  weeklyFill: document.getElementById("weeklyFill"),
  weeklyValue: document.getElementById("weeklyValue"),
  toggleSfx: document.getElementById("toggleSfx"),
  toggleBgm: document.getElementById("toggleBgm"),
  toggleSpeech: document.getElementById("toggleSpeech"),
  toggleFull: document.getElementById("toggleFull"),
  toggleFocus: document.getElementById("toggleFocus"),
  toggleCompact: document.getElementById("toggleCompact"),
  toggleMissions: document.getElementById("toggleMissions"),
  toggleMissionsInline: document.getElementById("toggleMissionsInline"),
  roundProgress: document.getElementById("roundProgress"),
  progressPanel: document.getElementById("progressPanel"),
  progressSummary: document.getElementById("progressSummary"),
  clearProgress: document.getElementById("clearProgress"),
  quickFull: document.getElementById("quickFull"),
  quickBgm: document.getElementById("quickBgm"),
  quickSfx: document.getElementById("quickSfx"),
  quickSpeech: document.getElementById("quickSpeech"),
  coachTip: document.getElementById("coachTip"),
  modeRelic: document.getElementById("modeRelic"),
  artifactFill: document.getElementById("artifactFill"),
  questBanner: document.getElementById("questBanner"),
  miniHud: document.getElementById("miniHud"),
  miniRound: document.getElementById("miniRound"),
  miniTimer: document.getElementById("miniTimer"),
  miniScore: document.getElementById("miniScore"),
  miniMissions: document.getElementById("miniMissions"),
  modeTitle: document.getElementById("modeTitle"),
  prompt: document.getElementById("prompt"),
  subprompt: document.getElementById("subprompt"),
  options: document.getElementById("options"),
  inputArea: document.getElementById("inputArea"),
  feedback: document.getElementById("feedback"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayBody: document.getElementById("overlayBody"),
  overlayStats: document.getElementById("overlayStats"),
  overlayPrimary: document.getElementById("overlayPrimary"),
  overlaySecondary: document.getElementById("overlaySecondary"),
};

const settings = {
  roundSeconds: 90,
};

const storageKeys = {
  profile: "gj_profile_v1",
  history: "gj_history_v1",
  modeHistory: "gj_mode_history_v1",
  weekly: "gj_weekly_v1",
  progress: "omas_spiele_progress_v2",
  speech: "omas_spiele_speech_v1",
};

const profile = loadProfile();
const progress = loadProgress();
const speechState = loadSpeechState();

const modes = [
  {
    id: "crossword",
    title: "Kreuzwortraetsel",
    intro: "Loese ein grosses, gut lesbares Kreuzwortraetsel.",
    setup: setupCrossword,
  },
  {
    id: "wordle",
    title: "Wordle",
    intro: "Errate das Wort in ruhigen Schritten.",
    setup: setupWordle,
  },
  {
    id: "math",
    title: "Rechen-Tempo",
    intro: "Finde die richtige Loesung.",
    setup: setupMath,
  },
  {
    id: "stroop",
    title: "Farb-Wort-Check",
    intro: "Passt Wort und Farbe?",
    setup: setupStroop,
  },
  {
    id: "reaction",
    title: "Reaktion Dual",
    intro: "Schnell reagieren und gerade/ungerade entscheiden.",
    setup: setupReaction,
  },
  {
    id: "symbolscan",
    title: "Symbol-Scan",
    intro: "Zaehle das Zielsymbol.",
    setup: setupSymbolScan,
  },
  {
    id: "compare",
    title: "Groesser-Kleiner",
    intro: "Entscheide, welche Zahl groesser ist.",
    setup: setupCompare,
  },
  {
    id: "category",
    title: "Kategorien-Filter",
    intro: "Finde das Wort, das passt.",
    setup: setupCategory,
  },
  {
    id: "wordlength",
    title: "Wortlaenge",
    intro: "Finde das laengste oder kuerzeste Wort.",
    setup: setupWordLength,
  },
  {
    id: "pattern",
    title: "Pattern Memory",
    intro: "Merke das Muster.",
    setup: setupPatternMemory,
  },
  {
    id: "wordchain",
    title: "Wortkette",
    intro: "Baue die Kette weiter.",
    setup: setupWordChain,
  },
  {
    id: "rotation",
    title: "Dreh-Check",
    intro: "Welche Richtung entsteht?",
    setup: setupRotation,
  },
  {
    id: "dualtask",
    title: "Dual-Check",
    intro: "Zwei Regeln gleichzeitig.",
    setup: setupDualTask,
  },
  {
    id: "memory",
    title: "Zahlen-Memory",
    intro: "Merke die Ziffernfolge und tippe sie ein.",
    setup: setupMemory,
  },
];

const modeLore = {
  crossword: "Kreuzwort-Tafel",
  wordle: "Wort-Siegel",
  math: "Relikt der Zahlen",
  stroop: "Spiegel-Siegel",
  reaction: "Blitzamulett",
  symbolscan: "Runenlupe",
  compare: "Waage der Alten",
  category: "Wortkristall",
  wordlength: "Schriftrolle der Laengen",
  pattern: "Mosaik-Stein",
  wordchain: "Kettenrelikt",
  rotation: "Kompass-Siegel",
  dualtask: "Zwillingsring",
  memory: "Erinnerungsperle",
};

const categoryBank = [
  {
    name: "Tiere",
    items: ["Hund", "Katze", "Pferd", "Tiger", "Frosch", "Hai"],
  },
  {
    name: "Obst",
    items: ["Apfel", "Birne", "Banane", "Kiwi", "Ananas", "Kirsche"],
  },
  {
    name: "Sport",
    items: ["Fussball", "Tennis", "Rad", "Boxen", "Schwimmen", "Golf"],
  },
  {
    name: "Musik",
    items: ["Gitarre", "Piano", "Floete", "Schlagzeug", "Bass", "Violine"],
  },
  {
    name: "Stadt",
    items: ["Berlin", "Paris", "Rom", "Madrid", "London", "Prag"],
  },
  {
    name: "Farbe",
    items: ["Rot", "Blau", "Gruen", "Gelb", "Violett", "Grau"],
  },
  {
    name: "Werkzeug",
    items: ["Hammer", "Zange", "Saege", "Bohrer", "Schraube", "Meissel"],
  },
  {
    name: "Natur",
    items: ["Berg", "See", "Wald", "Fluss", "Wolke", "Wind"],
  },
  {
    name: "Haushalt",
    items: ["Becher", "Teller", "Toaster", "Pfanne", "Kissen", "Schrank"],
  },
  {
    name: "Kleidung",
    items: ["Hemd", "Jacke", "Schal", "Hose", "Muetze", "Schuh"],
  },
  {
    name: "Technik",
    items: ["Laptop", "Handy", "Router", "Monitor", "Kabel", "Tastatur"],
  },
  {
    name: "Getraenk",
    items: ["Wasser", "Saft", "Kaffee", "Tee", "Limo", "Kakao"],
  },
  {
    name: "Laender",
    items: ["Deutschland", "Kanada", "Brasilien", "Japan", "Norwegen", "Italien"],
  },
  {
    name: "Moebel",
    items: ["Stuhl", "Tisch", "Sofa", "Regal", "Bett", "Kommode"],
  },
  {
    name: "Reise",
    items: ["Ticket", "Koffer", "Pass", "Hotel", "Gepaeck", "Karte"],
  },
];

const wordBank = [
  "Lampe",
  "Fenster",
  "Kamera",
  "Abenteuer",
  "Bibliothek",
  "Sonnenschein",
  "Krokodil",
  "Schmetterling",
  "Zitronenlimonade",
  "Brillenputztuch",
  "Rennstrecke",
  "Feuerwehr",
  "Zugticket",
  "Stadtplan",
  "Kopfkino",
  "Wasserflasche",
  "Fernsehstudio",
  "Schreibtisch",
  "Bleistift",
  "Fahrrad",
  "Schneeflocke",
  "Handschuh",
  "Sternkarte",
  "Bergkamm",
  "Erdbeere",
  "Holzweg",
  "Regenbogen",
  "Weltreise",
  "Buecherregal",
  "Zahnbuerste",
  "Sonnenblume",
  "Teekanne",
  "Staubsauger",
  "Gletscher",
  "Puzzleteil",
  "Ohrensessel",
  "Hinterhof",
  "Zeitfenster",
  "Stromkabel",
  "Mosaik",
  "Nebelwand",
  "Kreuzung",
  "Eisenbahn",
  "Feuerfunke",
  "Glasvase",
  "Sanduhr",
  "Bergwiese",
  "Kieselstein",
  "Wintergarten",
  "Papierflieger",
  "Buehnentuch",
  "Keksdose",
  "Wegweiser",
  "Gipfelkreuz",
  "Fabelwesen",
  "Kraeutertopf",
  "Kuestenwind",
  "Schneefeld",
  "Wolkenband",
  "Reisebuch",
  "Sternenbild",
  "Lichtkegel",
  "Schlosspark",
  "Teppichrand",
  "Sammelmappe",
  "Rucksack",
  "Taschuhr",
  "Buecherwurm",
  "Klangfarbe",
  "Fruehstisch",
  "Mondlicht",
];

const scanSymbols = ["@", "#", "$", "%", "&", "+", "*", "?", "=", "!"];
const chainWords = [
  "Auto",
  "Eule",
  "Lampe",
  "Eimer",
  "Regen",
  "Nebel",
  "Eis",
  "Sonne",
  "Ecke",
  "Esel",
  "Limo",
  "Orange",
  "Ente",
  "Erde",
  "Energie",
  "Insel",
  "Radio",
  "Ozean",
  "Nacht",
  "Tasse",
  "Efeu",
  "Ufer",
  "Uhr",
  "Eiche",
  "Elefant",
  "Teller",
  "Rakete",
  "Garten",
  "Nadel",
  "Apfel",
  "Sofa",
  "Lager",
  "Riegel",
  "Leder",
  "Rabe",
  "Elan",
  "Nuss",
  "Salz",
  "Zelt",
  "Tanne",
  "Feld",
  "Dachs",
  "Hafen",
  "Turm",
  "Mond",
  "Ohr",
  "Rinne",
  "Fackel",
  "Logik",
  "Karte",
  "Anker",
  "Riese",
  "Edel",
  "Luft",
  "Tafel",
  "Limonade",
  "Erdnuss",
  "Schiff",
  "Feldweg",
  "Gartenzaun",
  "Nachtzug",
  "Gipfel",
];
const dualWords = [
  "Apfel",
  "Orange",
  "Eis",
  "Ufer",
  "Eule",
  "Igel",
  "Ampel",
  "Ozean",
  "Eiche",
  "Brot",
  "Karte",
  "Tisch",
  "Lampe",
  "Buch",
  "Korb",
  "Fluss",
  "Ball",
  "Dorf",
  "Zug",
  "Kerze",
  "Sofa",
  "Punkt",
  "Nebel",
  "Zange",
  "Maus",
  "Brille",
  "Nadel",
  "Keks",
  "Lampe",
  "Radio",
  "Hafen",
  "Kissen",
  "Uhu",
  "Eimer",
  "Tanne",
  "Orange",
  "Karte",
];
const rotationDirs = ["N", "E", "S", "W"];

const wordleWords = [
  "APFEL",
  "BLUME",
  "SONNE",
  "LAMPE",
  "WOLKE",
  "TISCH",
  "RADIO",
  "KASSE",
  "KARTE",
  "HONIG",
  "WAGEN",
  "GABEL",
  "BIRNE",
  "PFERD",
  "WASSER",
  "GARTEN",
].filter((word) => word.length === 5);

const crosswordPuzzles = [
  {
    title: "Daheim und Garten",
    size: 9,
    entries: [
      {
        clue: "Rotes oder gruenes Obst",
        answer: "APFEL",
        row: 1,
        col: 1,
        dir: "across",
      },
      {
        clue: "Tier, auf dem man reiten kann",
        answer: "PFERD",
        row: 1,
        col: 2,
        dir: "down",
      },
      {
        clue: "Helle Oeffnung in der Wand",
        answer: "FENSTER",
        row: 1,
        col: 3,
        dir: "down",
      },
      {
        clue: "Macht am Abend Licht",
        answer: "LAMPE",
        row: 1,
        col: 5,
        dir: "down",
      },
      {
        clue: "Daraus trinkt man Tee",
        answer: "TASSE",
        row: 6,
        col: 4,
        dir: "across",
      },
    ],
  },
  {
    title: "Alltag",
    size: 9,
    entries: [
      {
        clue: "Damit schaut man Nachrichten",
        answer: "RADIO",
        row: 0,
        col: 0,
        dir: "across",
      },
      {
        clue: "Hilft beim Heimweg",
        answer: "KARTE",
        row: 2,
        col: 0,
        dir: "across",
      },
      {
        clue: "Kleines Heft zum Lesen",
        answer: "BUCH",
        row: 3,
        col: 0,
        dir: "across",
      },
      {
        clue: "Steht oft neben dem Sofa",
        answer: "TISCH",
        row: 5,
        col: 0,
        dir: "across",
      },
      {
        clue: "Warm und weich im Bett",
        answer: "KISSEN",
        row: 0,
        col: 7,
        dir: "down",
      },
    ],
  },
];

const game = {
  modeIndex: 0,
  score: 0,
  rounds: [],
  currentMode: null,
  roundStats: null,
  timerId: null,
  roundEnd: 0,
  running: false,
  sessionBoost: 0,
  playMode: "sprint",
  sessionModes: [],
  sessionGoals: [],
  sessionMeta: null,
  dailyFocus: null,
  missionAutoCollapsed: false,
  missionManualToggle: false,
  questBannerTimer: null,
  questBannerHideTimer: null,
  speechAction: null,
};

const audioState = {
  ctx: null,
  sfx: true,
  bgm: true,
  bgmTimer: null,
  bgmAudio: null,
  localSfx: {},
  localAudioReady: false,
  usingLocalBgm: false,
  bgmStep: 0,
  bgmInterval: 1100,
  baseInterval: 1100,
  theme: "calm",
  themeLockUntil: 0,
};

let audioAutoArmed = false;
let fullscreenAutoArmed = false;
let speechAutoArmed = false;

const audioAssets = {
  bgm: "../assets/audio/glimmerwald-theme.wav",
  sfx: {
    correct: "../assets/audio/pickup.wav",
    wrong: "../assets/audio/hurt.wav",
    start: "../assets/audio/gate.wav",
    roundEnd: "../assets/audio/hit.wav",
    finish: "../assets/audio/gate.wav",
    mission: "../assets/audio/pickup.wav",
    rupee: "../assets/audio/pickup.wav",
    fairy: "../assets/audio/gate.wav",
    select: "../assets/audio/slash.wav",
  },
};

const bgmThemes = {
  calm: {
    label: "Calm",
    interval: 1250,
    arp: [
      [261.63, 329.63, 392.0],
      [220.0, 261.63, 329.63],
      [196.0, 246.94, 392.0],
      [174.61, 220.0, 349.23],
    ],
    bass: [130.81, 110.0, 98.0, 87.31],
    arpGain: 0.026,
    bassGain: 0.032,
    padGain: 0.015,
    padEvery: 4,
  },
  quest: {
    label: "Quest",
    interval: 1050,
    arp: [
      [261.63, 329.63, 392.0],
      [246.94, 293.66, 369.99],
      [220.0, 277.18, 349.23],
      [246.94, 311.13, 392.0],
    ],
    bass: [130.81, 123.47, 110.0, 123.47],
    arpGain: 0.03,
    bassGain: 0.036,
    padGain: 0.018,
    padEvery: 3,
  },
  flow: {
    label: "Flow",
    interval: 900,
    arp: [
      [261.63, 329.63, 392.0],
      [293.66, 369.99, 440.0],
      [329.63, 392.0, 493.88],
      [293.66, 369.99, 440.0],
    ],
    bass: [130.81, 146.83, 164.81, 146.83],
    arpGain: 0.032,
    bassGain: 0.038,
    padGain: 0.016,
    padEvery: 4,
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatTime(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function setTimerFill(ratio) {
  if (!dom.timerFill) {
    return;
  }
  const clamped = Math.max(0, Math.min(1, ratio));
  dom.timerFill.style.width = `${Math.round(clamped * 100)}%`;
  dom.timerFill.classList.toggle("low", clamped <= 0.18);
}

function getComboMultiplier(streak) {
  if (streak >= 12) {
    return 1.6;
  }
  if (streak >= 9) {
    return 1.45;
  }
  if (streak >= 6) {
    return 1.3;
  }
  if (streak >= 4) {
    return 1.15;
  }
  return 1;
}

function formatMultiplier(multiplier) {
  return (Math.round(multiplier * 10) / 10).toFixed(1);
}

function updateComboBadge(multiplier) {
  if (!dom.scoreMultiplier) {
    return;
  }
  const label = `x${formatMultiplier(multiplier)}`;
  dom.scoreMultiplier.textContent = label;
  dom.scoreMultiplier.classList.toggle("hot", multiplier >= 1.3);
  if (game.sessionMeta) {
    const last = game.sessionMeta.lastMultiplier || 1;
    if (multiplier > last) {
      pulse(dom.scoreMultiplier);
      playSfx("rupee");
    }
    game.sessionMeta.lastMultiplier = multiplier;
  }
}

function ensureAudio() {
  setupLocalAudio();
  if (!audioState.ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }
    audioState.ctx = new AudioContext();
  }
  if (audioState.ctx && audioState.ctx.state === "suspended") {
    audioState.ctx.resume();
  }
}

function setupLocalAudio() {
  if (audioState.localAudioReady || typeof Audio === "undefined") {
    return;
  }
  audioState.localAudioReady = true;
  audioState.bgmAudio = new Audio(audioAssets.bgm);
  audioState.bgmAudio.loop = true;
  audioState.bgmAudio.preload = "auto";
  audioState.bgmAudio.volume = 0.18;
  Object.entries(audioAssets.sfx).forEach(([name, src]) => {
    const clip = new Audio(src);
    clip.preload = "auto";
    clip.volume = name === "wrong" ? 0.28 : 0.34;
    audioState.localSfx[name] = clip;
  });
}

function playLocalSfx(name) {
  setupLocalAudio();
  const source = audioState.localSfx[name] || audioState.localSfx.select;
  if (!source) {
    return false;
  }
  const clip = source.cloneNode();
  clip.volume = source.volume;
  clip.play().catch(() => {});
  return true;
}

function startLocalBgm() {
  setupLocalAudio();
  if (!audioState.bgmAudio) {
    return false;
  }
  audioState.usingLocalBgm = true;
  audioState.bgmAudio.volume = document.body.classList.contains("focus-mode") ? 0.12 : 0.18;
  audioState.bgmAudio
    .play()
    .catch(() => {
      audioState.usingLocalBgm = false;
      if (audioState.bgm) {
        startProceduralBgm();
      }
    });
  return true;
}

function playTone(freq, duration = 0.12, type = "sine", gain = 0.06, when = 0) {
  if (!audioState.ctx) {
    return;
  }
  const ctx = audioState.ctx;
  const now = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.linearRampToValueAtTime(gain, now + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

function playChord(freqs, duration, gain) {
  freqs.forEach((freq) => playTone(freq, duration, "sine", gain));
}

function playArp(freqs, duration = 0.18, gain = 0.03) {
  freqs.forEach((freq, index) => playTone(freq, duration, "triangle", gain, index * 0.12));
}

function setBgmTheme(nextTheme, force = false) {
  if (!bgmThemes[nextTheme]) {
    return;
  }
  if (!force && audioState.theme === nextTheme) {
    return;
  }
  const now = Date.now();
  if (!force && now < audioState.themeLockUntil) {
    return;
  }
  audioState.theme = nextTheme;
  audioState.baseInterval = bgmThemes[nextTheme].interval;
  audioState.bgmInterval = audioState.baseInterval;
  audioState.themeLockUntil = now + 3500;
  if (audioState.bgm) {
    startBgm();
  }
  updateAudioButtons();
}

function playSfx(name) {
  if (!audioState.sfx) {
    return;
  }
  if (playLocalSfx(name)) {
    return;
  }
  if (!audioState.ctx) {
    ensureAudio();
  }
  if (!audioState.ctx) {
    return;
  }
  switch (name) {
    case "correct":
      playTone(880, 0.08, "sine", 0.06);
      playTone(1120, 0.1, "sine", 0.05, 0.06);
      break;
    case "wrong":
      playTone(220, 0.14, "sawtooth", 0.05);
      playTone(180, 0.16, "sawtooth", 0.04, 0.08);
      break;
    case "start":
      playTone(520, 0.12, "triangle", 0.05);
      break;
    case "roundEnd":
      playTone(330, 0.12, "triangle", 0.05);
      playTone(392, 0.12, "triangle", 0.04, 0.08);
      break;
    case "finish":
      playTone(392, 0.12, "sine", 0.05);
      playTone(523.25, 0.12, "sine", 0.05, 0.1);
      playTone(659.25, 0.16, "sine", 0.05, 0.2);
      break;
    case "mission":
      playTone(659.25, 0.08, "triangle", 0.05);
      playTone(880, 0.1, "triangle", 0.04, 0.08);
      break;
    case "rupee":
      playTone(659.25, 0.08, "square", 0.05);
      playTone(988, 0.1, "square", 0.04, 0.05);
      break;
    case "fairy":
      playTone(523.25, 0.1, "triangle", 0.05);
      playTone(659.25, 0.12, "triangle", 0.04, 0.06);
      playTone(783.99, 0.14, "triangle", 0.04, 0.12);
      break;
    default:
      playTone(440, 0.1, "sine", 0.04);
      break;
  }
}

function startBgm() {
  if (audioState.bgmTimer) {
    clearInterval(audioState.bgmTimer);
    audioState.bgmTimer = null;
  }
  if (!audioState.bgm) {
    return;
  }
  if (startLocalBgm()) {
    return;
  }
  startProceduralBgm();
}

function startProceduralBgm() {
  if (audioState.bgmTimer) {
    clearInterval(audioState.bgmTimer);
    audioState.bgmTimer = null;
  }
  if (!audioState.bgm) {
    return;
  }
  ensureAudio();
  if (!audioState.ctx) {
    return;
  }
  const theme = bgmThemes[audioState.theme] || bgmThemes.calm;
  audioState.baseInterval = theme.interval;
  audioState.bgmInterval = theme.interval;
  audioState.bgmStep = 0;
  const playStep = () => {
    if (!audioState.bgm) {
      return;
    }
    const chord = theme.arp[audioState.bgmStep % theme.arp.length];
    const bass = theme.bass[audioState.bgmStep % theme.bass.length];
    playArp(chord, 0.2, theme.arpGain);
    playTone(bass, 0.22, "sine", theme.bassGain, 0.02);
    if (theme.padEvery && audioState.bgmStep % theme.padEvery === 0) {
      playChord(chord, 0.6, theme.padGain);
    }
    audioState.bgmStep += 1;
  };
  playStep();
  audioState.bgmTimer = setInterval(playStep, audioState.bgmInterval);
}

function stopBgm() {
  audioState.usingLocalBgm = false;
  if (audioState.bgmAudio) {
    audioState.bgmAudio.pause();
  }
  if (audioState.bgmTimer) {
    clearInterval(audioState.bgmTimer);
    audioState.bgmTimer = null;
  }
}

function refreshBgmTempo(streak) {
  if (audioState.usingLocalBgm) {
    return;
  }
  const base = audioState.baseInterval || 1100;
  const min = Math.max(680, base - 380);
  const nextInterval = clamp(base - streak * 40, min, base);
  if (Math.abs(nextInterval - audioState.bgmInterval) < 40) {
    return;
  }
  audioState.bgmInterval = nextInterval;
  if (audioState.bgm) {
    startBgm();
  }
}

function updateAudioButtons() {
  if (dom.toggleSfx) {
    dom.toggleSfx.textContent = `SFX: ${audioState.sfx ? "An" : "Aus"}`;
    dom.toggleSfx.setAttribute("aria-pressed", String(audioState.sfx));
    dom.toggleSfx.classList.toggle("active", audioState.sfx);
  }
  if (dom.quickSfx) {
    dom.quickSfx.textContent = audioState.sfx ? "Klang an" : "Klang aus";
    dom.quickSfx.setAttribute("aria-pressed", String(audioState.sfx));
    dom.quickSfx.classList.toggle("active", audioState.sfx);
  }
  if (dom.toggleBgm) {
    const themeLabel = bgmThemes[audioState.theme] ? bgmThemes[audioState.theme].label : "Calm";
    const label = audioState.usingLocalBgm ? "Lokal" : themeLabel;
    dom.toggleBgm.textContent = audioState.bgm ? `BGM: An (${label})` : "BGM: Aus";
    dom.toggleBgm.setAttribute("aria-pressed", String(audioState.bgm));
    dom.toggleBgm.classList.toggle("active", audioState.bgm);
  }
  if (dom.quickBgm) {
    dom.quickBgm.textContent = audioState.bgm ? "Musik an" : "Musik aus";
    dom.quickBgm.setAttribute("aria-pressed", String(audioState.bgm));
    dom.quickBgm.classList.toggle("active", audioState.bgm);
  }
}

function updateFullButton() {
  const isFull = Boolean(document.fullscreenElement);
  if (dom.toggleFull) {
    dom.toggleFull.textContent = isFull ? "Fenster" : "Vollbild";
    dom.toggleFull.setAttribute("aria-pressed", String(isFull));
    dom.toggleFull.classList.toggle("active", isFull);
  }
  if (dom.quickFull) {
    dom.quickFull.textContent = isFull ? "Fenster" : "Vollbild";
    dom.quickFull.setAttribute("aria-pressed", String(isFull));
    dom.quickFull.classList.toggle("active", isFull);
  }
}

async function enterFullscreen(options = {}) {
  const silent = Boolean(options.silent);
  if (document.fullscreenElement) {
    updateFullButton();
    return true;
  }
  const target = document.documentElement;
  if (!target || !target.requestFullscreen) {
    if (!silent) {
      setFeedback("Vollbild ist in diesem Browser nicht verfuegbar.", "bad");
    }
    updateFullButton();
    return false;
  }
  try {
    await target.requestFullscreen();
    updateFullButton();
    return true;
  } catch (err) {
    if (!silent) {
      setFeedback("Vollbild ist in diesem Browser blockiert.", "bad");
    }
    updateFullButton();
    return false;
  }
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await enterFullscreen();
    return;
  }
  try {
    await document.exitFullscreen();
  } catch (err) {
    setFeedback("Vollbild konnte nicht beendet werden.", "bad");
  }
  updateFullButton();
}

function armStartupFullscreen() {
  if (fullscreenAutoArmed || document.fullscreenElement) {
    return;
  }
  fullscreenAutoArmed = true;
  const events = ["pointerdown", "keydown", "touchstart"];
  const handler = () => {
    events.forEach((eventName) => {
      window.removeEventListener(eventName, handler, true);
    });
    enterFullscreen({ silent: true });
  };
  events.forEach((eventName) => {
    window.addEventListener(eventName, handler, { once: true, capture: true });
  });
}

function requestStartupFullscreen() {
  enterFullscreen({ silent: true }).then((didEnter) => {
    if (!didEnter) {
      armStartupFullscreen();
    }
  });
}

function loadSpeechState() {
  try {
    const raw = localStorage.getItem(storageKeys.speech);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.manual === true) {
        return {
          enabled: Boolean(data.enabled),
          manual: true,
        };
      }
      return {
        enabled: true,
        manual: false,
      };
    }
  } catch (err) {
    // ignore storage errors
  }
  return { enabled: true, manual: false };
}

function saveSpeechState() {
  try {
    localStorage.setItem(
      storageKeys.speech,
      JSON.stringify({ enabled: Boolean(speechState.enabled), manual: true })
    );
  } catch (err) {
    // ignore storage errors
  }
}

function supportsSpeech() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function getSpeechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function supportsVoiceInput() {
  return Boolean(getSpeechRecognitionCtor());
}

function makeSpeechText(value) {
  return String(value || "")
    .replace(/Kreuzwortraetsel/g, "Kreuzwortr\u00e4tsel")
    .replace(/Kreuzwort/g, "Kreuzwort")
    .replace(/gruen/g, "gr\u00fcn")
    .replace(/gruenes/g, "gr\u00fcnes")
    .replace(/Oeffnung/g, "\u00d6ffnung")
    .replace(/fuer/g, "f\u00fcr")
    .replace(/waehlen/g, "w\u00e4hlen")
    .replace(/geloest/g, "gel\u00f6st")
    .replace(/Loesung/g, "L\u00f6sung")
    .replace(/naechst/g, "n\u00e4chst");
}

function speakText(text, options = {}) {
  if (!supportsSpeech()) {
    if (!options.silent) {
      setFeedback("Sprachausgabe ist in diesem Browser nicht verfuegbar.", "bad");
    }
    return false;
  }
  const utterance = new SpeechSynthesisUtterance(makeSpeechText(text));
  utterance.lang = "de-DE";
  utterance.rate = 0.78;
  utterance.pitch = 0.96;
  utterance.volume = 1;
  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    if (!options.silent) {
      setFeedback("Sprachausgabe konnte nicht gestartet werden.", "bad");
    }
  }
  return false;
}

function updateSpeechButtons() {
  const supported = supportsSpeech();
  const isOn = Boolean(speechState.enabled && supported);
  if (dom.toggleSpeech) {
    dom.toggleSpeech.textContent = isOn ? "Sprache: An" : "Sprache: Aus";
    dom.toggleSpeech.setAttribute("aria-pressed", String(isOn));
    dom.toggleSpeech.disabled = !supported;
    dom.toggleSpeech.classList.toggle("active", isOn);
  }
  if (dom.quickSpeech) {
    dom.quickSpeech.textContent = "Vorlesen";
    dom.quickSpeech.setAttribute("aria-pressed", String(isOn));
    dom.quickSpeech.disabled = !supported;
    dom.quickSpeech.classList.toggle("active", isOn);
  }
}

function speakCurrentClue(options = {}) {
  if (game.speechAction) {
    return game.speechAction(options);
  }
  return speakText("Keine Frage zum Vorlesen.", options);
}

function setSpeechEnabled(enabled, options = {}) {
  if (enabled && !supportsSpeech()) {
    speakText("", { silent: false });
    updateSpeechButtons();
    return false;
  }
  speechState.enabled = Boolean(enabled);
  saveSpeechState();
  updateSpeechButtons();
  if (!speechState.enabled && supportsSpeech()) {
    window.speechSynthesis.cancel();
    if (!options.silent) {
      setFeedback("Sprachausgabe aus.", "good");
    }
    return false;
  }
  if (!options.silent) {
    speakCurrentClue({ force: true });
  }
  return true;
}

function armSpeechAutoStart() {
  if (speechAutoArmed || !supportsSpeech()) {
    return;
  }
  speechAutoArmed = true;
  const events = ["pointerdown", "keydown", "touchstart"];
  const handler = () => {
    events.forEach((eventName) => {
      window.removeEventListener(eventName, handler, true);
    });
    speechAutoArmed = false;
    if (speechState.enabled && game.speechAction) {
      speakCurrentClue({ silent: true });
    }
  };
  events.forEach((eventName) => {
    window.addEventListener(eventName, handler, { once: true, capture: true });
  });
}

function maybeSpeakCurrentClue(options = {}) {
  if (!speechState.enabled || !game.speechAction) {
    return;
  }
  if (options.key && game.lastAutoSpeechKey === options.key) {
    return;
  }
  if (options.key) {
    game.lastAutoSpeechKey = options.key;
  }
  armSpeechAutoStart();
  setTimeout(() => {
    if (speechState.enabled && game.speechAction) {
      speakCurrentClue({ silent: true });
    }
  }, options.delay ?? 420);
}

function updateFocusButton() {
  if (!dom.toggleFocus) {
    return;
  }
  const isFocus = document.body.classList.contains("focus-mode");
  dom.toggleFocus.textContent = isFocus ? "Einfach An" : "Einfach";
  dom.toggleFocus.setAttribute("aria-pressed", String(isFocus));
  dom.toggleFocus.classList.toggle("active", isFocus);
}

function updateCompactButton() {
  if (!dom.toggleCompact) {
    return;
  }
  const isCompact = document.body.classList.contains("compact-hud");
  dom.toggleCompact.textContent = isCompact ? "Gross An" : "Grosse Ansicht";
  dom.toggleCompact.setAttribute("aria-pressed", String(isCompact));
  dom.toggleCompact.classList.toggle("active", isCompact);
}

function updateMissionToggleButtons() {
  const collapsed = dom.missionPanel ? dom.missionPanel.classList.contains("collapsed") : false;
  if (dom.toggleMissions) {
    dom.toggleMissions.textContent = collapsed ? "Missionen An" : "Missionen";
    dom.toggleMissions.setAttribute("aria-pressed", String(!collapsed));
    dom.toggleMissions.classList.toggle("active", !collapsed);
  }
  if (dom.toggleMissionsInline) {
    dom.toggleMissionsInline.textContent = collapsed ? "Ein" : "Aus";
    dom.toggleMissionsInline.setAttribute("aria-pressed", String(!collapsed));
    dom.toggleMissionsInline.classList.toggle("active", !collapsed);
  }
  updateMiniHud();
}

function armAudioAutoStart() {
  if (audioAutoArmed) {
    return;
  }
  audioAutoArmed = true;
  const handler = () => {
    if (audioState.bgm || audioState.sfx) {
      ensureAudio();
    }
    if (audioState.bgm) {
      startBgm();
    }
    updateAudioButtons();
  };
  window.addEventListener("pointerdown", handler, { once: true });
  window.addEventListener("keydown", handler, { once: true });
  window.addEventListener("touchstart", handler, { once: true });
}

function setupAudioControls() {
  if (dom.toggleSfx) {
    dom.toggleSfx.addEventListener("click", () => {
      ensureAudio();
      audioState.sfx = !audioState.sfx;
      updateAudioButtons();
      if (audioState.sfx) {
        playSfx("start");
      }
    });
  }
  if (dom.toggleBgm) {
    dom.toggleBgm.addEventListener("click", () => {
      ensureAudio();
      audioState.bgm = !audioState.bgm;
      if (audioState.bgm) {
        startBgm();
      } else {
        stopBgm();
      }
      updateAudioButtons();
    });
  }
  if (dom.toggleSpeech) {
    dom.toggleSpeech.addEventListener("click", () => {
      setSpeechEnabled(!speechState.enabled);
    });
  }
  if (dom.toggleFull) {
    dom.toggleFull.addEventListener("click", toggleFullscreen);
    document.addEventListener("fullscreenchange", updateFullButton);
  }
  if (dom.quickFull) {
    dom.quickFull.addEventListener("click", toggleFullscreen);
  }
  if (dom.quickBgm) {
    dom.quickBgm.addEventListener("click", () => {
      if (dom.toggleBgm) {
        dom.toggleBgm.click();
      }
    });
  }
  if (dom.quickSfx) {
    dom.quickSfx.addEventListener("click", () => {
      if (dom.toggleSfx) {
        dom.toggleSfx.click();
      }
    });
  }
  if (dom.quickSpeech) {
    dom.quickSpeech.addEventListener("click", () => {
      if (!speechState.enabled) {
        setSpeechEnabled(true);
        return;
      }
      speakCurrentClue({ force: true });
    });
  }
  if (dom.clearProgress) {
    dom.clearProgress.addEventListener("click", resetSavedProgress);
  }
  if (dom.toggleFocus) {
    dom.toggleFocus.addEventListener("click", () => {
      document.body.classList.toggle("focus-mode");
      updateFocusButton();
      updateBgmThemeForMode(game.currentMode);
      refreshLayout();
    });
  }
  if (dom.toggleCompact) {
    dom.toggleCompact.addEventListener("click", () => {
      document.body.classList.toggle("compact-hud");
      updateCompactButton();
      refreshLayout();
    });
  }
  const toggleMissions = () => {
    if (!dom.missionPanel) {
      return;
    }
    game.missionManualToggle = true;
    game.missionAutoCollapsed = false;
    dom.missionPanel.classList.toggle("collapsed");
    updateMissionToggleButtons();
    refreshLayout();
  };
  if (dom.toggleMissions) {
    dom.toggleMissions.addEventListener("click", toggleMissions);
  }
  if (dom.toggleMissionsInline) {
    dom.toggleMissionsInline.addEventListener("click", toggleMissions);
  }
  updateAudioButtons();
  updateFullButton();
  updateFocusButton();
  updateCompactButton();
  updateMissionToggleButtons();
  armAudioAutoStart();
}

function getLevel(correct, step, max) {
  return Math.min(max, Math.floor(correct / step));
}

function getProfileOffset() {
  const offset = Math.round((profile.skill - 50) / 20);
  return clamp(offset, -2, 3);
}

function getAdaptiveLevel(stats, step, max, bias = 0) {
  const base = getLevel(stats.correct, step, max);
  const offset = getProfileOffset() + game.sessionBoost + bias;
  return clamp(base + offset, 0, max);
}

function calcAccuracy(stats) {
  return stats.attempts ? stats.correct / stats.attempts : 0;
}

function calcPerformanceIndex(stats) {
  const accuracy = calcAccuracy(stats);
  const scoreRate = stats.score / settings.roundSeconds;
  const pace = stats.attempts / settings.roundSeconds;
  const scorePart = Math.min(1, scoreRate / 1.4);
  const pacePart = Math.min(1, pace / 1.2);
  return clamp(accuracy * 0.55 + scorePart * 0.3 + pacePart * 0.15, 0, 1);
}

function updateSessionBoost(perfIndex) {
  if (perfIndex >= 0.78) {
    game.sessionBoost = clamp(game.sessionBoost + 1, -2, 2);
  } else if (perfIndex <= 0.42) {
    game.sessionBoost = clamp(game.sessionBoost - 1, -2, 2);
  }
}

function updateProfileSkill(perfIndex) {
  const target = Math.round(perfIndex * 100);
  const weight = 0.18;
  profile.skill = Math.round(profile.skill * (1 - weight) + target * weight);
  profile.lastUpdated = Date.now();
  saveProfile(profile);
}

function gradeFromIndex(index) {
  if (index >= 0.9) {
    return { grade: 1, label: "1 (Sehr gut)" };
  }
  if (index >= 0.8) {
    return { grade: 2, label: "2 (Gut)" };
  }
  if (index >= 0.7) {
    return { grade: 3, label: "3 (Befriedigend)" };
  }
  if (index >= 0.6) {
    return { grade: 4, label: "4 (Ausreichend)" };
  }
  if (index >= 0.45) {
    return { grade: 5, label: "5 (Mangelhaft)" };
  }
  return { grade: 6, label: "6 (Ungenuegend)" };
}

function getQuestRank(skill = profile.skill) {
  if (skill >= 85) {
    return "Meister";
  }
  if (skill >= 70) {
    return "Veteran";
  }
  if (skill >= 55) {
    return "Abenteurer";
  }
  if (skill >= 40) {
    return "Lehrling";
  }
  return "Novize";
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(storageKeys.profile);
    if (raw) {
      const data = JSON.parse(raw);
      if (typeof data.skill === "number") {
        return {
          skill: clamp(Math.round(data.skill), 0, 100),
          sessions: data.sessions || 0,
          lastUpdated: data.lastUpdated || 0,
          streak: data.streak || 0,
          streakBest: data.streakBest || data.streak || 0,
          lastSessionDay: data.lastSessionDay || "",
        };
      }
    }
  } catch (err) {
    // ignore storage errors
  }
  return { skill: 52, sessions: 0, lastUpdated: 0, streak: 0, streakBest: 0, lastSessionDay: "" };
}

function saveProfile(nextProfile) {
  try {
    localStorage.setItem(storageKeys.profile, JSON.stringify(nextProfile));
  } catch (err) {
    // ignore storage errors
  }
}

function createEmptyProgress() {
  return {
    crossword: {},
    wordle: {
      currentAnswer: "",
      guesses: [],
      solvedWords: [],
    },
    updatedAt: 0,
  };
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(storageKeys.progress);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === "object") {
        return {
          crossword:
            data.crossword && typeof data.crossword === "object" && !Array.isArray(data.crossword)
              ? data.crossword
              : {},
          wordle: {
            currentAnswer:
              data.wordle && typeof data.wordle.currentAnswer === "string"
                ? normalizeGermanWord(data.wordle.currentAnswer)
                : "",
            guesses: data.wordle && Array.isArray(data.wordle.guesses) ? data.wordle.guesses.slice(0, 6) : [],
            solvedWords:
              data.wordle && Array.isArray(data.wordle.solvedWords)
                ? [...new Set(data.wordle.solvedWords.map(normalizeGermanWord).filter(Boolean))]
                : [],
          },
          updatedAt: data.updatedAt || 0,
        };
      }
    }
  } catch (err) {
    // ignore storage errors
  }
  return createEmptyProgress();
}

function saveProgress() {
  progress.updatedAt = Date.now();
  try {
    localStorage.setItem(storageKeys.progress, JSON.stringify(progress));
  } catch (err) {
    // ignore storage errors
  }
  updateProgressUI();
}

function resetSavedProgress() {
  Object.assign(progress, createEmptyProgress());
  saveProgress();
  setFeedback("Fortschritt geloescht.", "good");
  playSfx("select");
}

function resetCrosswordProgress() {
  crosswordPuzzles.forEach((puzzle) => {
    delete progress.crossword[getCrosswordKey(puzzle)];
  });
  saveProgress();
}

function getCrosswordKey(puzzle) {
  return puzzle.title;
}

function getCrosswordState(puzzle) {
  const key = getCrosswordKey(puzzle);
  if (!progress.crossword[key]) {
    progress.crossword[key] = { solved: [], completed: false };
  }
  const state = progress.crossword[key];
  state.solved = Array.isArray(state.solved)
    ? [...new Set(state.solved.filter((index) => Number.isInteger(index) && index >= 0 && index < puzzle.entries.length))]
    : [];
  state.completed = Boolean(state.completed);
  return state;
}

function markCrosswordSolved(puzzle, index) {
  const state = getCrosswordState(puzzle);
  if (!state.solved.includes(index)) {
    state.solved.push(index);
  }
  state.completed = state.solved.length >= puzzle.entries.length;
  saveProgress();
}

function getProgressSummary() {
  const counts = getCrosswordProgressCounts();
  return `${counts.solved} von ${counts.total} geloest.`;
}

function updateProgressUI() {
  if (!dom.progressSummary) {
    return;
  }
  dom.progressSummary.textContent = getProgressSummary();
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(storageKeys.history);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    // ignore storage errors
  }
  return [];
}

function saveHistory(history) {
  try {
    localStorage.setItem(storageKeys.history, JSON.stringify(history));
  } catch (err) {
    // ignore storage errors
  }
}

function getDayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function updateDailyStreak(nextProfile, nowTs) {
  const todayKey = getDayKey(nowTs);
  if (nextProfile.lastSessionDay === todayKey) {
    return nextProfile;
  }
  const yesterday = new Date(nowTs);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDayKey(yesterday);
  if (nextProfile.lastSessionDay === yesterdayKey) {
    nextProfile.streak = (nextProfile.streak || 0) + 1;
  } else {
    nextProfile.streak = 1;
  }
  nextProfile.lastSessionDay = todayKey;
  nextProfile.streakBest = Math.max(nextProfile.streakBest || 0, nextProfile.streak || 0);
  return nextProfile;
}

function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  const year = d.getFullYear();
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

function loadWeeklyProgress() {
  try {
    const raw = localStorage.getItem(storageKeys.weekly);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === "object") {
        return data;
      }
    }
  } catch (err) {
    // ignore storage errors
  }
  return { weekKey: "", count: 0, best: 0 };
}

function saveWeeklyProgress(progress) {
  try {
    localStorage.setItem(storageKeys.weekly, JSON.stringify(progress));
  } catch (err) {
    // ignore storage errors
  }
}

function updateWeeklyProgress(nowTs) {
  const target = 5;
  const weekKey = getWeekKey(nowTs);
  const progress = loadWeeklyProgress();
  if (progress.weekKey !== weekKey) {
    progress.weekKey = weekKey;
    progress.count = 0;
  }
  progress.count += 1;
  progress.best = Math.max(progress.best || 0, progress.count);
  saveWeeklyProgress(progress);
  updateWeeklyDisplay(progress, target);
  return progress;
}

function updateWeeklyDisplay(progress = loadWeeklyProgress(), target = 5) {
  if (!dom.weeklyFill || !dom.weeklyValue) {
    return;
  }
  const count = Math.min(progress.count || 0, target);
  const ratio = target ? clamp(count / target, 0, 1) : 0;
  dom.weeklyFill.style.width = `${Math.round(ratio * 100)}%`;
  dom.weeklyValue.textContent = `${count}/${target} Sessions`;
}

function loadModeHistory() {
  try {
    const raw = localStorage.getItem(storageKeys.modeHistory);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === "object" && !Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    // ignore storage errors
  }
  return {};
}

function saveModeHistory(modeHistory) {
  try {
    localStorage.setItem(storageKeys.modeHistory, JSON.stringify(modeHistory));
  } catch (err) {
    // ignore storage errors
  }
}

function pushHistory(entry) {
  const history = loadHistory();
  history.push(entry);
  if (history.length > 20) {
    history.shift();
  }
  saveHistory(history);
  return history;
}

function pushModeHistoryEntry(modeHistory, modeId, entry) {
  if (!modeHistory[modeId]) {
    modeHistory[modeId] = [];
  }
  modeHistory[modeId].push(entry);
  if (modeHistory[modeId].length > 12) {
    modeHistory[modeId].shift();
  }
  return modeHistory[modeId];
}

function getTrendLabel(history) {
  if (history.length < 2) {
    return "neutral";
  }
  const last = history[history.length - 1].perfIndex || 0;
  const window = history.slice(Math.max(0, history.length - 4), history.length - 1);
  const avgPrev =
    window.reduce((sum, entry) => sum + (entry.perfIndex || 0), 0) /
    Math.max(1, window.length);
  if (last > avgPrev + 0.05) {
    return "steigend";
  }
  if (last < avgPrev - 0.05) {
    return "fallend";
  }
  return "stabil";
}

function formatRecentScores(history) {
  if (!history.length) {
    return "-";
  }
  return history
    .slice(-5)
    .map((entry) => entry.score)
    .join(" | ");
}

function formatRecentIndexes(history) {
  if (!history.length) {
    return "-";
  }
  return history
    .slice(-5)
    .map((entry) => Math.round((entry.perfIndex || 0) * 100))
    .join(" | ");
}

function formatRecentGrades(history) {
  if (!history.length) {
    return "-";
  }
  return history
    .slice(-5)
    .map((entry) => entry.grade)
    .join(" | ");
}

function getSessionBadges({ accuracyPct, bestStreak, sessionIndex, trend, scoreRate, totalAttempts }) {
  const badges = [];
  if (accuracyPct >= 90) {
    badges.push("Praezisions-Profi");
  } else if (accuracyPct >= 80) {
    badges.push("Praezise 80%+");
  }
  if (bestStreak >= 8) {
    badges.push(`Serie ${bestStreak}`);
  } else if (bestStreak >= 5) {
    badges.push("Serie 5+");
  }
  if (scoreRate >= 1.6) {
    badges.push("Tempo-Boost");
  }
  if (totalAttempts >= 45) {
    badges.push("Ausdauer");
  }
  if (trend === "steigend") {
    badges.push("Formkurve hoch");
  }
  if (!badges.length) {
    badges.push("Konstant dabei");
  }
  return badges.slice(0, 4);
}

function getLootRewards({ accuracyPct, bestStreak, scoreRate, trend }) {
  const loot = [];
  if (accuracyPct >= 85) {
    loot.push("Praezisions-Kristall");
  }
  if (bestStreak >= 6) {
    loot.push("Serien-Talisman");
  }
  if (scoreRate >= 1.4) {
    loot.push("Tempo-Stiefel");
  }
  if (trend === "steigend") {
    loot.push("Formkurven-Kompass");
  }
  if (loot.length < 2) {
    loot.push("Wachsamkeits-Laterne");
  }
  if (loot.length < 2) {
    loot.push("Entdecker-Karte");
  }
  return shuffle(loot).slice(0, 2);
}

function initSessionMeta() {
  game.sessionMeta = {
    startedAt: Date.now(),
    totalAttempts: 0,
    totalCorrect: 0,
    totalWrong: 0,
    currentStreak: 0,
    maxStreak: 0,
    fastReactions: 0,
    earlyReactions: 0,
    reactionCount: 0,
    goalsCompleted: 0,
    missionPulse: null,
    lastMultiplier: 1,
    lastStreakMilestone: 0,
    fairyActive: false,
    fairyUsed: false,
    allGoalsComplete: false,
  };
}

function getSessionSummary(overrides = {}) {
  const meta = game.sessionMeta || {};
  const totalAttempts = meta.totalAttempts || 0;
  const totalCorrect = meta.totalCorrect || 0;
  const totalWrong = meta.totalWrong || 0;
  const accuracyPct =
    typeof overrides.accuracyPct === "number"
      ? overrides.accuracyPct
      : totalAttempts
        ? Math.round((totalCorrect / totalAttempts) * 100)
        : 0;
  const bestStreak = Math.max(overrides.bestStreak || 0, meta.maxStreak || 0);
  const sessionSeconds = getActiveModes().length * settings.roundSeconds;
  const scoreRate = sessionSeconds ? game.score / sessionSeconds : 0;
  return {
    accuracyPct,
    bestStreak,
    totalAttempts,
    totalCorrect,
    totalWrong,
    score: game.score,
    scoreRate,
    fastReactions: meta.fastReactions || 0,
    earlyReactions: meta.earlyReactions || 0,
  };
}

function getDailyFocus(nowTs = Date.now()) {
  const focusPool = [
    {
      id: "accuracy",
      label: "Praezision",
      hint: "Hohe Trefferquote halten.",
      goalId: "accuracy",
      zone: "Wald der Praezision",
    },
    {
      id: "streak",
      label: "Serie",
      hint: "Serie ohne Fehler ausbauen.",
      goalId: "streak",
      zone: "Pfad der Serien",
    },
    {
      id: "tempo",
      label: "Tempo",
      hint: "Punkte schnell sammeln.",
      goalId: "score",
      zone: "Sturmsteppe",
    },
    {
      id: "endurance",
      label: "Ausdauer",
      hint: "Viele Versuche schaffen.",
      goalId: "attempts",
      zone: "Klippen der Ausdauer",
    },
    {
      id: "reaction",
      label: "Reaktion",
      hint: "Schnell reagieren ohne Fruehstarts.",
      goalId: "fastreaction",
      zone: "Blitzschrein",
    },
  ];
  const dayKey = getDayKey(nowTs);
  const hash = dayKey.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const focus = focusPool[hash % focusPool.length];
  return { ...focus, dayKey };
}

function updateDailyFocusDisplay() {
  game.dailyFocus = getDailyFocus(Date.now());
  if (dom.dailyFocus) {
    dom.dailyFocus.textContent = game.dailyFocus.label;
  }
  if (dom.dailyFocusHint) {
    const zone = game.dailyFocus.zone ? ` | Zone: ${game.dailyFocus.zone}` : "";
    dom.dailyFocusHint.textContent = `${game.dailyFocus.hint}${zone}`;
  }
}

function pickSessionGoals(activeModes, dailyFocus) {
  const rounds = activeModes.length || 1;
  const hasReaction = activeModes.some((mode) => mode.id === "reaction");
  const correctTarget = Math.max(16, rounds * 10);
  const attemptTarget = correctTarget + 6;
  const scoreTarget = Math.max(120, rounds * 70);
  const streakTarget = rounds >= 2 ? 6 : 5;
  const accuracyTarget = rounds >= 2 ? 85 : 80;
  const fastReactionTarget = rounds >= 2 ? 4 : 3;

  const goalById = {
    accuracy: {
      id: "accuracy",
      label: `Trefferquote ${accuracyTarget}%+`,
      check: (summary) => summary.accuracyPct >= accuracyTarget,
      progress: (summary) => ({
        current: summary.accuracyPct,
        target: accuracyTarget,
        unit: "%",
      }),
    },
    streak: {
      id: "streak",
      label: `Serie ${streakTarget}+`,
      check: (summary) => summary.bestStreak >= streakTarget,
      progress: (summary) => ({
        current: summary.bestStreak,
        target: streakTarget,
      }),
    },
    correct: {
      id: "correct",
      label: `Mind. ${correctTarget} richtige`,
      check: (summary) => summary.totalCorrect >= correctTarget,
      progress: (summary) => ({
        current: summary.totalCorrect,
        target: correctTarget,
      }),
    },
    attempts: {
      id: "attempts",
      label: `Mind. ${attemptTarget} Versuche`,
      check: (summary) => summary.totalAttempts >= attemptTarget,
      progress: (summary) => ({
        current: summary.totalAttempts,
        target: attemptTarget,
      }),
    },
    score: {
      id: "score",
      label: `Score ${scoreTarget}+`,
      check: (summary) => summary.score >= scoreTarget,
      progress: (summary) => ({
        current: summary.score,
        target: scoreTarget,
      }),
    },
  };

  if (hasReaction) {
    goalById.fastreaction = {
      id: "fastreaction",
      label: `${fastReactionTarget} schnelle Reaktionen`,
      check: (summary) => summary.fastReactions >= fastReactionTarget,
      progress: (summary) => ({
        current: summary.fastReactions,
        target: fastReactionTarget,
      }),
    };
    goalById.noearly = {
      id: "noearly",
      label: "0 Fruehstarts",
      check: (summary) => summary.earlyReactions === 0,
      progress: (summary) => ({
        current: summary.earlyReactions,
        target: 0,
        invert: true,
        text: `Fruehstarts: ${summary.earlyReactions}`,
      }),
    };
  }

  const basePool = [
    goalById.accuracy,
    goalById.streak,
    goalById.correct,
    goalById.attempts,
    goalById.score,
  ];

  const specials = [];
  if (hasReaction) {
    specials.push(goalById.fastreaction, goalById.noearly);
  }

  const goals = [];
  let dailyGoal = null;
  if (dailyFocus && dailyFocus.goalId) {
    dailyGoal = goalById[dailyFocus.goalId] || null;
    if (!dailyGoal && dailyFocus.goalId === "fastreaction") {
      dailyGoal = goalById.accuracy;
    }
    if (dailyGoal) {
      dailyGoal = { ...dailyGoal, isDaily: true, label: `Daily: ${dailyGoal.label}` };
      goals.push(dailyGoal);
    }
  }

  if (specials.length && goals.length < 3) {
    const available = specials.filter((goal) => !goals.some((pick) => pick.id === goal.id));
    if (available.length) {
      goals.push(available[randInt(0, available.length - 1)]);
    }
  }

  const pool = shuffle(basePool.filter((goal) => !goals.some((pick) => pick.id === goal.id)));
  while (goals.length < 3 && pool.length) {
    goals.push(pool.shift());
  }
  return goals;
}

function renderSessionGoals(goals, summary) {
  if (!goals.length) {
    return "";
  }
  let completed = 0;
  const items = goals
    .map((goal) => {
      const done = goal.check(summary);
      if (done) {
        completed += 1;
      }
      const status = done ? "OK" : "OFFEN";
      const cls = done ? "goal-done" : "goal-miss";
      return `
        <div class="goal-row ${cls}">
          <span class="goal-icon">${status}</span>
          <span>${goal.label}</span>
        </div>
      `;
    })
    .join("");
  return `
    <div class="goal-box">
      <div class="goal-title">Session-Missionen ${completed}/${goals.length}</div>
      ${items}
    </div>
  `;
}

function renderMissionHUD(goals, summary) {
  if (!dom.missionList) {
    return;
  }
  if (!goals.length) {
    dom.missionList.innerHTML = `<div class="mission-empty">Missionen starten mit einer Session.</div>`;
    if (dom.missionCount) {
      dom.missionCount.textContent = "0/0";
    }
    return;
  }
  let completed = 0;
  const items = goals
    .map((goal) => {
      const done = goal.check(summary);
      if (done) {
        completed += 1;
      }
      const progress = goal.progress ? goal.progress(summary) : null;
      let ratio = done ? 1 : 0;
      let progressText = "";
      if (progress) {
        if (progress.text) {
          progressText = progress.text;
        } else if (progress.unit === "%") {
          progressText = `${Math.min(progress.current, progress.target)}% / ${progress.target}%`;
        } else if (progress.target > 0) {
          progressText = `${Math.min(progress.current, progress.target)}/${progress.target}`;
        }
        if (progress.invert) {
          ratio = progress.current <= progress.target ? 1 : 0;
        } else if (progress.target > 0) {
          ratio = clamp(progress.current / progress.target, 0, 1);
        }
      }
      const className = `mission-item${done ? " done" : ""}${goal.isDaily ? " daily" : ""}`;
      return `
        <div class="${className}">
          <div class="mission-top">
            <span class="mission-name">${goal.label}</span>
            <span class="mission-progress">${done ? "OK" : progressText || "..."}</span>
          </div>
          <div class="mission-bar">
            <div class="mission-fill" style="width:${Math.round(ratio * 100)}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
  dom.missionList.innerHTML = items;
  if (dom.missionCount) {
    dom.missionCount.textContent = `${completed}/${goals.length}`;
  }
  if (game.sessionMeta) {
    if (completed > (game.sessionMeta.goalsCompleted || 0) && dom.missionPanel) {
      dom.missionPanel.classList.remove("mission-celebrate");
      void dom.missionPanel.offsetWidth;
      dom.missionPanel.classList.add("mission-celebrate");
      playSfx("mission");
      spawnConfetti(10);
    }
    game.sessionMeta.goalsCompleted = completed;
    if (goals.length && completed === goals.length && !game.sessionMeta.allGoalsComplete) {
      game.sessionMeta.allGoalsComplete = true;
      showQuestBanner("Schatztruhe!");
      spawnConfetti(20);
      playSfx("finish");
    }
  }
}

function maybeActivateFairy(streak) {
  if (!game.sessionMeta || game.sessionMeta.fairyUsed || game.sessionMeta.fairyActive) {
    return;
  }
  if (streak >= 6) {
    game.sessionMeta.fairyActive = true;
    playSfx("fairy");
    showQuestBanner("Fee bereit!");
  }
}

function updateHearts(streak) {
  if (!dom.heartRow) {
    return;
  }
  const maxHearts = 6;
  const filled = Math.min(maxHearts, Math.ceil(streak / 2));
  dom.heartRow.innerHTML = "";
  for (let i = 0; i < maxHearts; i += 1) {
    const heart = document.createElement("span");
    heart.className = "heart";
    if (i < filled) {
      heart.classList.add("filled");
    }
    dom.heartRow.appendChild(heart);
  }
  const orb = document.createElement("span");
  orb.className = "fairy-orb";
  if (game.sessionMeta && game.sessionMeta.fairyActive) {
    orb.classList.add("active");
  }
  dom.heartRow.appendChild(orb);
}

function updateFlowVisuals(streak) {
  const glow = clamp((streak - 2) / 8, 0, 1);
  document.documentElement.style.setProperty("--flow-glow", glow.toFixed(2));
  document.body.classList.toggle("flow-high", streak >= 6);
}

function updateMomentum() {
  if (!dom.momentumFill || !dom.momentumValue) {
    return;
  }
  const streak = game.sessionMeta ? game.sessionMeta.currentStreak : 0;
  const multiplier = getComboMultiplier(streak);
  const target = 8;
  const ratio = Math.min(streak / target, 1);
  dom.momentumFill.style.width = `${Math.round(ratio * 100)}%`;
  dom.momentumValue.textContent = streak ? `Serie ${streak}` : "Start";
  maybeActivateFairy(streak);
  updateHearts(streak);
  updateArtifactGauge(streak);
  updateFlowVisuals(streak);
  maybeBoostBgmTheme(streak);
  if (game.sessionMeta && streak < 2) {
    game.sessionMeta.lastMultiplier = 1;
  }
  updateComboBadge(multiplier);
  if (dom.score) {
    dom.score.classList.toggle("score-hot", streak >= 5);
  }
  if (audioState.bgm) {
    refreshBgmTempo(streak);
  }
  if (game.sessionMeta) {
    if (streak < 4) {
      game.sessionMeta.lastStreakMilestone = 0;
    }
    const milestones = [4, 8, 12];
    if (milestones.includes(streak) && game.sessionMeta.lastStreakMilestone !== streak) {
      game.sessionMeta.lastStreakMilestone = streak;
      spawnConfetti(6);
      playSfx("mission");
    }
  }
}

function updateCoachTip(summary = getSessionSummary()) {
  if (!dom.coachTip) {
    return;
  }
  const tips = [];
  if (!game.running) {
    tips.push("Waehle eine Uebung oder starte den Sprint.");
  }
  if (game.dailyFocus) {
    tips.push(`Daily Fokus: ${game.dailyFocus.label}.`);
  }
  if (summary.totalAttempts < 4 && game.running) {
    tips.push("Finde den Rhythmus: erst sauber, dann schneller.");
  }
  if (summary.accuracyPct >= 85 && summary.totalAttempts >= 6) {
    tips.push("Praezision top! Jetzt Tempo leicht anziehen.");
  }
  if (summary.accuracyPct > 0 && summary.accuracyPct < 60 && summary.totalAttempts >= 6) {
    tips.push("Atme kurz durch, dann sicherer klicken.");
  }
  if (summary.bestStreak >= 5) {
    tips.push(`Serie ${summary.bestStreak}! Halte den Flow.`);
  }
  if (summary.totalAttempts >= 4 && summary.bestStreak < 4) {
    tips.push("Combo-Boost startet ab Serie 4.");
  }
  if (summary.bestStreak >= 4) {
    const combo = formatMultiplier(getComboMultiplier(summary.bestStreak));
    tips.push(`Combo x${combo} erreichbar. Bleib dran.`);
  }
  if (summary.bestStreak >= 4 && summary.bestStreak < 6) {
    tips.push("Serie 6 laedt die Fee.");
  }
  if (game.sessionMeta && game.sessionMeta.fairyActive) {
    tips.push("Fee bereit: Der naechste Fehler kostet keinen Malus.");
  }
  if (!tips.length) {
    tips.push("Bleib dran! Kleine Serien bringen grosse Punkte.");
  }
  const index = summary.totalAttempts % tips.length;
  dom.coachTip.textContent = tips[index];
}

function updateMissionHUD() {
  const summary = getSessionSummary();
  renderMissionHUD(game.sessionGoals, summary);
  updateMomentum();
  updateCoachTip(summary);
  updateWeeklyDisplay();
  updateMiniHud();
}

function refreshLayout() {
  appBaseSize = null;
  updateAppScale();
}

function maybeAutoCollapseMissions() {
  if (!dom.missionPanel || game.missionManualToggle) {
    return;
  }
  const shouldCollapse = document.body.classList.contains("compact");
  if (shouldCollapse && !dom.missionPanel.classList.contains("collapsed")) {
    dom.missionPanel.classList.add("collapsed");
    game.missionAutoCollapsed = true;
    updateMissionToggleButtons();
    appBaseSize = null;
    requestAnimationFrame(updateAppScale);
  }
}

function restoreAutoMissions() {
  if (!dom.missionPanel || !game.missionAutoCollapsed) {
    return;
  }
  dom.missionPanel.classList.remove("collapsed");
  game.missionAutoCollapsed = false;
  updateMissionToggleButtons();
  appBaseSize = null;
  requestAnimationFrame(updateAppScale);
}

function updatePlayLayout() {
  document.body.classList.toggle("playing", game.running);
  if (game.running) {
    maybeAutoCollapseMissions();
  } else {
    restoreAutoMissions();
  }
  refreshLayout();
  updateMiniHud();
}

function applyDefaultUIState() {
  document.body.classList.add("focus-mode", "compact-hud");
  audioState.theme = "calm";
  audioState.baseInterval = bgmThemes.calm.interval;
  audioState.bgmInterval = bgmThemes.calm.interval;
  updateAudioButtons();
  updateFocusButton();
  updateCompactButton();
  updateSpeechButtons();
  updateProgressUI();
  updateMiniHud();
}

let appBaseSize = null;

function updateAppScale() {
  if (!dom.app) {
    return;
  }
  if (!appBaseSize) {
    appBaseSize = {
      width: dom.app.offsetWidth,
      height: dom.app.offsetHeight,
    };
  }
  const padding = 32;
  const availableW = Math.max(320, window.innerWidth - padding * 2);
  const availableH = Math.max(420, window.innerHeight - padding * 2);
  const scaleW = availableW / appBaseSize.width;
  const scaleH = availableH / appBaseSize.height;
  const scale = clamp(Math.min(scaleW, scaleH), 0.85, 1.2);
  dom.app.style.setProperty("--app-scale", scale.toFixed(3));
  const compact = window.innerHeight < 820 || window.innerWidth < 980;
  document.body.classList.toggle("compact", compact);
  if (game.running) {
    maybeAutoCollapseMissions();
  } else if (game.missionAutoCollapsed) {
    restoreAutoMissions();
  }
}

function updateRoundProgress() {
  if (!dom.roundProgress) {
    return;
  }
  const total = game.sessionModes.length
    ? game.sessionModes.length
    : game.playMode === "select"
      ? 1
      : 3;
  const completed = game.rounds.length;
  const activeIndex = game.running ? game.modeIndex : -1;
  dom.roundProgress.innerHTML = "";
  for (let i = 0; i < total; i += 1) {
    const dot = document.createElement("span");
    dot.className = "round-dot";
    if (i < completed) {
      dot.classList.add("done");
    }
    if (i === activeIndex) {
      dot.classList.add("active");
    }
    dom.roundProgress.appendChild(dot);
  }
  updateMiniHud();
}

function updateMiniHud() {
  if (!dom.miniHud) {
    return;
  }
  const show =
    document.body.classList.contains("compact-hud") ||
    document.body.classList.contains("focus-mode") ||
    (dom.missionPanel && dom.missionPanel.classList.contains("collapsed"));
  dom.miniHud.classList.toggle("hidden", !show);
  if (dom.miniRound) {
    dom.miniRound.textContent = dom.roundLabel ? dom.roundLabel.textContent : "-";
  }
  if (dom.miniTimer) {
    dom.miniTimer.textContent = dom.timer ? dom.timer.textContent : "--:--";
  }
  if (dom.miniScore) {
    dom.miniScore.textContent = dom.score ? dom.score.textContent : "0";
  }
  if (dom.miniMissions) {
    dom.miniMissions.textContent = dom.missionCount ? dom.missionCount.textContent : "0/0";
  }
}

function ensureConfettiLayer() {
  let layer = document.querySelector(".confetti-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "confetti-layer";
    document.body.appendChild(layer);
  }
  return layer;
}

function spawnConfetti(count = 16) {
  if (document.body.classList.contains("focus-mode") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  const layer = ensureConfettiLayer();
  const colors = ["#f26b4f", "#f1b631", "#3aa370", "#2f7ea8", "#f08c2e"];
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    const size = randInt(6, 10);
    piece.style.width = `${size}px`;
    piece.style.height = `${size + 4}px`;
    piece.style.left = `${randInt(5, 95)}%`;
    piece.style.background = colors[randInt(0, colors.length - 1)];
    piece.style.animationDuration = `${randInt(120, 220) / 100}s`;
    piece.style.animationDelay = `${randInt(0, 40) / 100}s`;
    layer.appendChild(piece);
    setTimeout(() => {
      piece.remove();
    }, 2400);
  }
}

function renderModeProgress(modeHistory, modeList) {
  if (!modeList.length) {
    return "";
  }
  return modeList
    .map((mode) => {
      const entries = (modeHistory[mode.id] || []).slice(-10);
      const latest = entries[entries.length - 1];
      const latestPct = latest ? Math.round((latest.perfIndex || 0) * 100) : "-";
      const latestGrade = latest ? latest.grade : "-";
      const bestPerf = entries.reduce((best, entry) => Math.max(best, entry.perfIndex || 0), 0);
      const bestScore = entries.reduce((best, entry) => Math.max(best, entry.score || 0), 0);
      const bestPct = bestPerf ? Math.round(bestPerf * 100) : "-";
      const bars = entries
        .map((entry) => {
          const height = Math.round(8 + (entry.perfIndex || 0) * 36);
          const label = Math.round((entry.perfIndex || 0) * 100);
          return `<span class="mini-bar" style="height:${height}px" title="${label}%"></span>`;
        })
        .join("");
      const chart = bars || `<span class="mini-chart-empty">keine Daten</span>`;
      return `
        <div class="mode-report">
          <div class="mode-report-title">${mode.title}</div>
          <div class="mode-report-meta">Letzte Note: ${latestGrade} | Index: ${latestPct}%</div>
          <div class="mode-report-meta">Best: ${bestPct}% | Best-Score: ${bestScore || "-"}</div>
          <div class="mini-chart">${chart}</div>
        </div>
      `;
    })
    .join("");
}

function setFeedback(text, type) {
  dom.feedback.textContent = text || "";
  dom.feedback.className = "feedback";
  if (type) {
    dom.feedback.classList.add(type);
  }
  if (text) {
    pulse(dom.feedback);
  }
}

function setPrompt(text, sub) {
  dom.prompt.textContent = text || "";
  dom.subprompt.textContent = sub || "";
  dom.prompt.classList.remove("stroop-word");
  dom.prompt.style.color = "";
  pulse(dom.prompt);
}

function applyModeTheme(mode) {
  if (!mode) {
    return;
  }
  document.body.dataset.mode = mode.id;
  if (dom.modeRelic) {
    const relic = modeLore[mode.id];
    dom.modeRelic.textContent = relic ? `Relikt: ${relic}` : "";
  }
}

function getThemeForMode(mode) {
  if (document.body.classList.contains("focus-mode")) {
    return "calm";
  }
  if (!mode) {
    return "calm";
  }
  if (mode.id === "reaction" || mode.id === "dualtask") {
    return "flow";
  }
  if (mode.id === "pattern" || mode.id === "memory") {
    return "calm";
  }
  return "quest";
}

function updateBgmThemeForMode(mode) {
  setBgmTheme(getThemeForMode(mode));
}

function maybeBoostBgmTheme(streak) {
  if (streak >= 9) {
    setBgmTheme("flow");
  } else if (streak <= 2 && document.body.classList.contains("focus-mode")) {
    setBgmTheme("calm");
  }
}

function clearModeTheme() {
  document.body.removeAttribute("data-mode");
  if (dom.modeRelic) {
    dom.modeRelic.textContent = "";
  }
}

function updateArtifactGauge(streak) {
  if (!dom.artifactFill) {
    return;
  }
  const ratio = Math.min(streak / 8, 1);
  dom.artifactFill.style.width = `${Math.round(ratio * 100)}%`;
}

function showQuestBanner(text) {
  if (!dom.questBanner) {
    return;
  }
  dom.questBanner.textContent = text;
  dom.questBanner.classList.remove("hidden");
  dom.questBanner.classList.remove("show");
  if (game.questBannerTimer) {
    clearTimeout(game.questBannerTimer);
  }
  if (game.questBannerHideTimer) {
    clearTimeout(game.questBannerHideTimer);
  }
  requestAnimationFrame(() => {
    dom.questBanner.classList.add("show");
  });
  game.questBannerTimer = setTimeout(() => {
    dom.questBanner.classList.remove("show");
    game.questBannerHideTimer = setTimeout(() => {
      dom.questBanner.classList.add("hidden");
    }, 220);
  }, 1200);
}

function clearStage() {
  dom.options.innerHTML = "";
  dom.inputArea.innerHTML = "";
}

function setOptions(options, onSelect) {
  dom.options.innerHTML = "";
  options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = option.label;
    const key = document.createElement("span");
    key.className = "option-key";
    key.textContent = `${index + 1}`;
    btn.appendChild(key);
    btn.addEventListener("click", () => onSelect(index, option));
    dom.options.appendChild(btn);
  });
  pulse(dom.options);
}

function pulse(el) {
  el.classList.remove("pulse");
  void el.offsetWidth;
  el.classList.add("pulse");
}

function bumpScore() {
  dom.score.classList.remove("score-bump");
  void dom.score.offsetWidth;
  dom.score.classList.add("score-bump");
}

function addScore(delta) {
  game.score = Math.max(0, game.score + delta);
  if (game.roundStats) {
    game.roundStats.score += delta;
  }
  dom.score.textContent = String(game.score);
  bumpScore();
}

function noteCorrect(stats, basePoints, label) {
  stats.attempts += 1;
  stats.correct += 1;
  stats.streak += 1;
  stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
  if (game.sessionMeta) {
    game.sessionMeta.totalAttempts += 1;
    game.sessionMeta.totalCorrect += 1;
    game.sessionMeta.currentStreak += 1;
    game.sessionMeta.maxStreak = Math.max(game.sessionMeta.maxStreak, game.sessionMeta.currentStreak);
  }
  const bonus = Math.min(6, stats.streak - 1);
  const comboStreak = game.sessionMeta ? game.sessionMeta.currentStreak : stats.streak;
  const multiplier = getComboMultiplier(comboStreak);
  const total = Math.round((basePoints + bonus) * multiplier);
  addScore(total);
  const streakNote =
    stats.streak >= 3 && (stats.streak === 3 || stats.streak === 5 || stats.streak % 4 === 0)
      ? ` | Serie ${stats.streak}!`
      : "";
  const comboNote = multiplier > 1 ? ` (x${formatMultiplier(multiplier)})` : "";
  setFeedback(`${label} +${total}${streakNote}${comboNote}`, "good");
  playSfx("correct");
  updateMissionHUD();
}

function noteWrong(stats, penalty, label) {
  stats.attempts += 1;
  stats.wrong += 1;
  const hasFairy = Boolean(game.sessionMeta && game.sessionMeta.fairyActive);
  stats.streak = 0;
  if (game.sessionMeta) {
    game.sessionMeta.totalAttempts += 1;
    game.sessionMeta.totalWrong += 1;
    game.sessionMeta.currentStreak = 0;
  }
  if (hasFairy && game.sessionMeta) {
    game.sessionMeta.fairyActive = false;
    game.sessionMeta.fairyUsed = true;
    setFeedback("Fee rettet dich! Kein Malus.", "good");
    playSfx("fairy");
    updateMissionHUD();
    return;
  }
  addScore(-penalty);
  setFeedback(`${label} -${penalty}`, "bad");
  playSfx("wrong");
  updateMissionHUD();
}

function updateSessionInfo() {
  if (!dom.sessionInfo) {
    return;
  }
  let base = "";
  if (game.playMode === "select") {
    if (game.sessionModes.length === 1) {
      base = `Einzeluebung: ${game.sessionModes[0].title}`;
    } else {
      base = "Einzeluebung: bitte waehlen.";
    }
  }
  if (!base) {
    if (game.sessionModes.length) {
      const titles = game.sessionModes.map((mode) => mode.title).join(" | ");
      base = `Sprint: ${titles}`;
    } else {
      base = "Sprint: 3 zufaellige Uebungen.";
    }
  }
  const rank = getQuestRank(profile.skill);
  dom.sessionInfo.textContent = `${base} | Rang: ${rank}`;
}

function getActiveModes() {
  return game.sessionModes.length ? game.sessionModes : modes;
}

function getCrosswordMode() {
  return modes.find((mode) => mode.id === "crossword") || modes[0];
}

function getWordleMode() {
  return modes.find((mode) => mode.id === "wordle") || modes[0];
}

function isCrosswordOnlySession() {
  const activeModes = getActiveModes();
  return activeModes.length === 1 && activeModes[0].id === "crossword";
}

function getCrosswordProgressCounts() {
  const total = crosswordPuzzles.reduce((sum, puzzle) => sum + puzzle.entries.length, 0);
  const solved = crosswordPuzzles.reduce(
    (sum, puzzle) => sum + getCrosswordState(puzzle).solved.length,
    0
  );
  return { solved, total };
}

function areCrosswordsComplete() {
  const counts = getCrosswordProgressCounts();
  return counts.total > 0 && counts.solved >= counts.total;
}

function pickRandomModes(count) {
  const priority = modes.filter((mode) => mode.id === "crossword" || mode.id === "wordle");
  const pool = [...priority, ...shuffle(modes.filter((mode) => !priority.includes(mode)))];
  return pool.slice(0, Math.min(count, pool.length));
}

function startSprint() {
  game.playMode = "sprint";
  game.sessionModes = pickRandomModes(3);
  startGame();
}

function startSingleMode(mode) {
  game.playMode = "select";
  game.sessionModes = [mode];
  startGame();
}

function startCrosswordSession() {
  game.playMode = "select";
  game.sessionModes = [getCrosswordMode()];
  startGame();
}

function startWordleSession() {
  game.playMode = "select";
  game.sessionModes = [getWordleMode()];
  startGame();
}

function showExercisePicker() {
  game.running = false;
  game.currentMode = null;
  game.roundStats = null;
  game.playMode = "select";
  game.sessionModes = [];
  game.sessionGoals = [];
  stopTimer();
  clearStage();
  clearModeTheme();
  dom.roundLabel.textContent = "-";
  dom.timer.textContent = "Ohne Zeit";
  setTimerFill(1);
  updateSessionInfo();
  updateDailyFocusDisplay();
  updateMissionHUD();
  updateRoundProgress();
  updateWeeklyDisplay();
  dom.modeTitle.textContent = "Uebung waehlen";
  setPrompt("Uebung waehlen", "Klicke eine Uebung an. Ohne Zeitlimit.");
  setOptions(
    modes.map((mode) => ({ label: mode.title, value: mode })),
    (index, option) => startSingleMode(option.value)
  );
  updatePlayLayout();
}

function showOverlay(config) {
  dom.overlayTitle.textContent = config.title || "";
  dom.overlayBody.textContent = config.body || "";
  dom.overlayStats.innerHTML = config.statsHtml || "";

  dom.overlayPrimary.textContent = config.primaryLabel || "OK";
  dom.overlayPrimary.onclick = () => {
    hideOverlay();
    if (config.onPrimary) {
      config.onPrimary();
    }
  };

  if (config.secondaryLabel) {
    dom.overlaySecondary.textContent = config.secondaryLabel;
    dom.overlaySecondary.classList.remove("hidden");
    dom.overlaySecondary.onclick = () => {
      hideOverlay();
      if (config.onSecondary) {
        config.onSecondary();
      }
    };
  } else {
    dom.overlaySecondary.classList.add("hidden");
  }

  dom.overlay.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function hideOverlay() {
  dom.overlay.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function resetGame() {
  game.modeIndex = 0;
  game.score = 0;
  game.rounds = [];
  game.currentMode = null;
  game.roundStats = null;
  game.roundEnd = 0;
  game.sessionBoost = 0;
  game.running = false;
  game.sessionGoals = [];
  game.missionAutoCollapsed = false;
  game.missionManualToggle = false;
  game.speechAction = null;
  clearModeTheme();
  if (game.questBannerTimer) {
    clearTimeout(game.questBannerTimer);
    game.questBannerTimer = null;
  }
  if (game.questBannerHideTimer) {
    clearTimeout(game.questBannerHideTimer);
    game.questBannerHideTimer = null;
  }
  if (dom.questBanner) {
    dom.questBanner.classList.add("hidden");
    dom.questBanner.classList.remove("show");
  }
  initSessionMeta();
  dom.score.textContent = "0";
  dom.roundLabel.textContent = "-";
  dom.timer.textContent = "Ohne Zeit";
  setTimerFill(1);
  updateSessionInfo();
  updateDailyFocusDisplay();
  updateMissionHUD();
  updateRoundProgress();
  updateWeeklyDisplay();
  updateProgressUI();
  setPrompt("Warte auf den Start.", "");
  setFeedback("", "");
  clearStage();
  updatePlayLayout();
}

function startGame() {
  if (!game.sessionModes.length) {
    game.playMode = "sprint";
    game.sessionModes = pickRandomModes(3);
  }
  resetGame();
  game.sessionGoals = pickSessionGoals(getActiveModes(), game.dailyFocus);
  updateMissionHUD();
  startRound();
}

function startRound() {
  const activeModes = getActiveModes();
  const mode = activeModes[game.modeIndex];
  game.roundEnd = 0;
  game.roundStats = {
    id: mode.id,
    title: mode.title,
    correct: 0,
    wrong: 0,
    attempts: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    accuracy: 0,
    performance: 0,
  };
  dom.roundLabel.textContent = `${game.modeIndex + 1}/${activeModes.length}`;
  dom.modeTitle.textContent = mode.title;
  setPrompt(mode.title, mode.intro);
  applyModeTheme(mode);
  updateBgmThemeForMode(mode);
  showQuestBanner(`Quest ${game.modeIndex + 1}/${activeModes.length}: ${mode.title}`);
  setFeedback("", "");
  clearStage();
  game.running = true;
  updatePlayLayout();
  game.currentMode = mode.setup(game.roundStats);
  updateRoundProgress();
  playSfx("start");
  startTimer();
}

function startTimer() {
  stopTimer();
  if (dom.timer) {
    dom.timer.textContent = "Ohne Zeit";
  }
  setTimerFill(1);
  updateMiniHud();
}

function stopTimer() {
  if (game.timerId) {
    clearInterval(game.timerId);
    game.timerId = null;
  }
}

function endRound() {
  if (!game.running) {
    return;
  }
  game.running = false;
  updatePlayLayout();
  stopTimer();
  if (game.currentMode && game.currentMode.destroy) {
    game.currentMode.destroy();
  }
  const perfIndex = calcPerformanceIndex(game.roundStats);
  game.roundStats.performance = perfIndex;
  game.roundStats.accuracy = Math.round(calcAccuracy(game.roundStats) * 100);
  updateSessionBoost(perfIndex);
  updateProfileSkill(perfIndex);
  game.rounds.push(game.roundStats);
  updateRoundProgress();
  playSfx("roundEnd");
  if (isCrosswordOnlySession()) {
    finishGame();
  } else {
    showRoundSummary();
  }
}

function showRoundSummary() {
  const stats = game.roundStats;
  const perfPct = Math.round((stats.performance || 0) * 100);
  const gradeLabel = gradeFromIndex(stats.performance || 0).label;
  const statsHtml = `
    <div>Richtige: ${stats.correct}</div>
    <div>Falsche: ${stats.wrong}</div>
    <div>Trefferquote: ${stats.accuracy}%</div>
    <div>Runden-Index: ${perfPct}%</div>
    <div>Runden-Note: ${gradeLabel}</div>
    <div>Beste Serie: ${stats.bestStreak}</div>
    <div>Runden-Score: ${stats.score}</div>
  `;

  const activeModes = getActiveModes();
  const isLast = game.modeIndex >= activeModes.length - 1;
  const crosswordOnly = isCrosswordOnlySession();
  const secondaryLabel = crosswordOnly ? "" : game.playMode === "select" ? "Uebung waehlen" : "Neu starten";
  showOverlay({
    title: `Runde ${game.modeIndex + 1} fertig`,
    body: crosswordOnly
      ? "Dein Fortschritt ist gespeichert."
      : isLast
        ? "Fertig."
        : "Kurze Pause, dann geht es weiter.",
    statsHtml,
    primaryLabel: crosswordOnly ? "Weiter Kreuzwort" : isLast ? "Weiter" : "Weiter",
    secondaryLabel,
    onPrimary: () => {
      if (crosswordOnly) {
        startCrosswordSession();
      } else if (isLast) {
        finishGame();
      } else {
        game.modeIndex += 1;
        startRound();
      }
    },
    onSecondary: () => {
      if (crosswordOnly) {
        startCrosswordSession();
      } else if (game.playMode === "select") {
        showExercisePicker();
      } else {
        startSprint();
      }
    },
  });
}

function finishGame() {
  const totalCorrect = game.rounds.reduce((sum, r) => sum + r.correct, 0);
  const totalWrong = game.rounds.reduce((sum, r) => sum + r.wrong, 0);
  const totalAttempts = totalCorrect + totalWrong;
  const accuracy = totalAttempts ? totalCorrect / totalAttempts : 0;
  const accuracyPct = Math.round(accuracy * 100);
  const bestRound = game.rounds.reduce((best, round) => {
    if (!best || round.score > best.score) {
      return round;
    }
    return best;
  }, null);
  const bestStreak = game.rounds.reduce(
    (best, round) => Math.max(best, round.bestStreak || 0),
    0
  );
  const activeModes = getActiveModes();
  const sessionSeconds = activeModes.length * settings.roundSeconds;
  const scoreRate = game.score / sessionSeconds;
  const scorePart = Math.min(1, scoreRate / 1.4);
  const streakPart = Math.min(1, bestStreak / 10);
  const sessionIndex = clamp(accuracy * 0.6 + scorePart * 0.3 + streakPart * 0.1, 0, 1);
  const grade = gradeFromIndex(sessionIndex);

  const now = Date.now();
  const modeHistory = loadModeHistory();
  game.rounds.forEach((round) => {
    const roundGrade = gradeFromIndex(round.performance || 0);
    pushModeHistoryEntry(modeHistory, round.id, {
      ts: now,
      score: round.score,
      accuracy: round.accuracy,
      perfIndex: round.performance || 0,
      grade: roundGrade.grade,
    });
  });
  saveModeHistory(modeHistory);
  const modeReport = renderModeProgress(modeHistory, modes);

  profile.sessions = (profile.sessions || 0) + 1;
  updateDailyStreak(profile, now);
  updateWeeklyProgress(now);
  saveProfile(profile);

  const historyEntry = {
    ts: now,
    score: game.score,
    accuracy: accuracyPct,
    perfIndex: sessionIndex,
    grade: grade.grade,
  };
  const history = pushHistory(historyEntry);
  const trend = getTrendLabel(history);
  const recentScores = formatRecentScores(history);
  const recentIndexes = formatRecentIndexes(history);
  const recentGrades = formatRecentGrades(history);
  const badges = getSessionBadges({
    accuracyPct,
    bestStreak,
    sessionIndex,
    trend,
    scoreRate,
    totalAttempts,
  });
  const summary = getSessionSummary({ accuracyPct, bestStreak });
  const goalsCompleted = game.sessionGoals.filter((goal) => goal.check(summary)).length;
  const dailyGoal = game.sessionGoals.find((goal) => goal.isDaily);
  const extraBadges = [];
  if (dailyGoal && dailyGoal.check(summary)) {
    extraBadges.push("Daily geschafft");
  }
  if (goalsCompleted && goalsCompleted === game.sessionGoals.length) {
    extraBadges.push(`Missionen ${goalsCompleted}/${game.sessionGoals.length}`);
  }
  const allBadges = extraBadges.concat(badges).slice(0, 4);
  const badgeHtml = allBadges.map((badge) => `<span class="badge">${badge}</span>`).join("");
  const goalsHtml = renderSessionGoals(game.sessionGoals, summary);
  const loot = getLootRewards({ accuracyPct, bestStreak, scoreRate, trend });
  const lootHtml = loot.length
    ? `<div class="loot-row"><div class="loot-title">Loot gefunden</div><div class="loot-list">${loot
        .map((item) => `<span class="loot-item">${item}</span>`)
        .join("")}</div></div>`
    : "";

  const statsHtml = `
    <div>Note: ${grade.label}</div>
    <div class="badge-row">${badgeHtml}</div>
    ${lootHtml}
    <div>Tages-Streak: ${profile.streak || 0} (Best: ${profile.streakBest || 0})</div>
    <div>Leistungs-Index: ${Math.round(sessionIndex * 100)}%</div>
    <div>Trefferquote: ${accuracyPct}%</div>
    <div>Gesamt-Score: ${game.score}</div>
    <div>Beste Serie: ${bestStreak}</div>
    <div>Beste Runde: ${bestRound ? bestRound.title : "-"}</div>
    <div>Trend: ${trend}</div>
    ${goalsHtml}
    <div>Leistungskurve (Index): ${recentIndexes}</div>
    <div>Letzte Sessions (Score): ${recentScores}</div>
    <div>Letzte Sessions (Noten): ${recentGrades}</div>
    <div>Profil-Skill: ${profile.skill}</div>
    <div>Rang: ${getQuestRank(profile.skill)}</div>
    <div class="mode-progress">
      <div class="mode-progress-title">Uebungs-Progress</div>
      <div class="mode-grid">
        ${modeReport}
      </div>
    </div>
  `;

  const crosswordOnly = isCrosswordOnlySession();
  const isSelect = game.playMode === "select";
  const finishTitle = crosswordOnly ? "Kreuzwort gespeichert" : isSelect ? "Uebung abgeschlossen" : "Sprint abgeschlossen";
  playSfx("finish");
  spawnConfetti(isSelect ? 18 : 28);
  showOverlay({
    title: finishTitle,
    body: crosswordOnly
      ? "Dein Stand bleibt gespeichert. Weiter geht es mit der naechsten offenen Frage."
      : "Dynamischer Schwierigkeitsgrad aktiv. Deine Leistung wird gespeichert.",
    statsHtml,
    primaryLabel: crosswordOnly ? "Weiter Kreuzwort" : isSelect ? "Nochmal" : "Nochmal spielen",
    secondaryLabel: crosswordOnly ? "" : isSelect ? "Uebung waehlen" : "Schliessen",
    onPrimary: () => {
      if (crosswordOnly) {
        startCrosswordSession();
      } else if (isSelect) {
        startSingleMode(activeModes[0]);
      } else {
        startSprint();
      }
    },
    onSecondary: () => {
      if (crosswordOnly) {
        startCrosswordSession();
      } else if (isSelect) {
        showExercisePicker();
      } else {
        resetGame();
      }
    },
  });
}

function normalizeGermanWord(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\u00c4/g, "AE")
    .replace(/\u00d6/g, "OE")
    .replace(/\u00dc/g, "UE")
    .replace(/\u1e9e/g, "SS")
    .replace(/\u00df/g, "SS")
    .replace(/[^A-Z]/g, "");
}

function setupCrossword(stats) {
  let active = true;
  let voiceRecognition = null;
  const hintCounts = new Map();
  if (areCrosswordsComplete()) {
    resetCrosswordProgress();
  }
  let puzzleIndex = crosswordPuzzles.findIndex((item) => !getCrosswordState(item).completed);
  if (puzzleIndex < 0) {
    puzzleIndex = 0;
  }
  let puzzle = crosswordPuzzles[puzzleIndex];
  let solved = new Set(getCrosswordState(puzzle).solved);
  let activeIndex = Math.max(0, puzzle.entries.findIndex((entry, index) => !solved.has(index)));

  const loadPuzzle = (index) => {
    puzzleIndex = index;
    puzzle = crosswordPuzzles[puzzleIndex];
    solved = new Set(getCrosswordState(puzzle).solved);
    const firstOpen = puzzle.entries.findIndex((entry, entryIndex) => !solved.has(entryIndex));
    activeIndex = firstOpen >= 0 ? firstOpen : 0;
  };

  const entryCells = (entry) => {
    const cells = [];
    for (let i = 0; i < entry.answer.length; i += 1) {
      cells.push({
        row: entry.row + (entry.dir === "down" ? i : 0),
        col: entry.col + (entry.dir === "across" ? i : 0),
        letter: entry.answer[i],
      });
    }
    return cells;
  };

  const moveToNextOpen = () => {
    const next = puzzle.entries.findIndex((entry, index) => index > activeIndex && !solved.has(index));
    if (next >= 0) {
      activeIndex = next;
      return;
    }
    const first = puzzle.entries.findIndex((entry, index) => !solved.has(index));
    if (first >= 0) {
      activeIndex = first;
    }
  };

  const buildCellMap = () => {
    const map = new Map();
    puzzle.entries.forEach((entry, index) => {
      entryCells(entry).forEach((cell, letterIndex) => {
        const key = `${cell.row},${cell.col}`;
        if (!map.has(key)) {
          map.set(key, {
            letter: cell.letter,
            entries: [],
            numbers: [],
          });
        }
        const item = map.get(key);
        item.entries.push(index);
        if (letterIndex === 0) {
          item.numbers.push(index + 1);
        }
      });
    });
    return map;
  };

  const getHintKey = () => `${puzzle.title}:${activeIndex}`;

  const stopVoiceRecognition = () => {
    if (!voiceRecognition) {
      return;
    }
    try {
      voiceRecognition.onresult = null;
      voiceRecognition.onerror = null;
      voiceRecognition.onend = null;
      voiceRecognition.stop();
    } catch (err) {
      // ignore recognition stop errors
    }
    voiceRecognition = null;
  };

  const render = () => {
    if (!active) {
      return;
    }
    const entry = puzzle.entries[activeIndex];
    const cellMap = buildCellMap();
    const expectedAnswer = normalizeGermanWord(entry.answer);
    const progressCounts = getCrosswordProgressCounts();
    const overallStep = Math.min(progressCounts.solved + 1, progressCounts.total);
    const clueSpeech = `Frage ${activeIndex + 1} von ${puzzle.entries.length}. ${entry.clue}. ${entry.answer.length} Buchstaben.`;
    game.speechAction = (options = {}) => speakText(`${clueSpeech} Bitte Antwort eintippen.`, options);
    setPrompt(
      `Frage ${activeIndex + 1} von ${puzzle.entries.length}`,
      `${entry.answer.length} Buchstaben`
    );
    if (dom.coachTip) {
      dom.coachTip.textContent = "";
    }
    dom.options.innerHTML = "";
    dom.inputArea.innerHTML = "";

    const layout = document.createElement("div");
    layout.className = "crossword-layout crossword-card-mode";

    const grid = document.createElement("div");
    grid.className = "crossword-grid";
    grid.style.setProperty("--crossword-size", puzzle.size);
    grid.setAttribute("aria-label", "Kreuzwortraetsel Raster");

    for (let row = 0; row < puzzle.size; row += 1) {
      for (let col = 0; col < puzzle.size; col += 1) {
        const key = `${row},${col}`;
        const data = cellMap.get(key);
        const cell = document.createElement("div");
        cell.className = data ? "crossword-cell" : "crossword-cell blocked";
        if (data) {
          const isActive = data.entries.includes(activeIndex);
          const isSolved = data.entries.some((index) => solved.has(index));
          cell.classList.toggle("active", isActive);
          cell.classList.toggle("solved", isSolved);
          cell.textContent = isSolved ? data.letter : "";
          if (data.numbers.length) {
            const num = document.createElement("span");
            num.className = "crossword-number";
            num.textContent = data.numbers[0];
            cell.appendChild(num);
          }
        }
        grid.appendChild(cell);
      }
    }

    const panel = document.createElement("div");
    panel.className = "crossword-panel";

    const step = document.createElement("div");
    step.className = "crossword-step";
    step.textContent = `${overallStep}/${progressCounts.total} | ${entry.answer.length} Buchstaben`;

    const clue = document.createElement("div");
    clue.className = "crossword-clue";
    clue.textContent = entry.clue;

    const voiceButton = document.createElement("button");
    voiceButton.type = "button";
    voiceButton.className = "voice-button";
    voiceButton.textContent = "Sprechen";
    voiceButton.disabled = !supportsVoiceInput();

    const hintButton = document.createElement("button");
    hintButton.type = "button";
    hintButton.className = "hint-button";
    hintButton.textContent = "Tipp";

    const hintLine = document.createElement("div");
    hintLine.className = "crossword-hint-line";
    hintLine.hidden = true;

    const slots = document.createElement("div");
    slots.className = "answer-slots";
    slots.setAttribute("aria-hidden", "true");
    for (let i = 0; i < entry.answer.length; i += 1) {
      const slot = document.createElement("span");
      slot.className = "answer-slot";
      slots.appendChild(slot);
    }

    const input = document.createElement("input");
    input.className = "crossword-answer-input";
    input.type = "text";
    input.autocomplete = "off";
    input.inputMode = "text";
    input.maxLength = entry.answer.length + 2;
    input.placeholder = "Antwort";
    input.setAttribute("aria-label", `Antwort fuer Frage ${activeIndex + 1}`);

    const updateSlots = () => {
      const letters = normalizeGermanWord(input.value).slice(0, entry.answer.length);
      [...slots.children].forEach((slot, index) => {
        slot.textContent = letters[index] || "";
        slot.classList.toggle("filled", Boolean(letters[index]));
      });
    };

    const submit = document.createElement("button");
    submit.type = "button";
    submit.className = "primary";
    submit.textContent = "OK";

    const actionRow = document.createElement("div");
    actionRow.className = "crossword-action-row";
    actionRow.appendChild(submit);

    const extraDetails = document.createElement("details");
    extraDetails.className = "crossword-extra";
    const extraSummary = document.createElement("summary");
    extraSummary.textContent = "Tafel zeigen";
    extraDetails.appendChild(extraSummary);

    const clueList = document.createElement("div");
    clueList.className = "crossword-clue-list";
    clueList.setAttribute("aria-label", "Fragenliste");
    puzzle.entries.forEach((item, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "clue-chip";
      btn.classList.toggle("active", index === activeIndex);
      btn.classList.toggle("solved", solved.has(index));
      btn.textContent = `${index + 1}. ${item.clue}`;
      btn.addEventListener("click", () => {
        activeIndex = index;
        playSfx("select");
        render();
      });
      clueList.appendChild(btn);
    });

    const updateHintLine = () => {
      const count = hintCounts.get(getHintKey()) || 0;
      if (!count) {
        hintLine.hidden = true;
        hintLine.textContent = "";
        return;
      }
      const revealed = entry.answer
        .split("")
        .map((letter, index) => (index < count ? letter : "_"))
        .join(" ");
      hintLine.textContent = `Tipp: ${revealed}`;
      hintLine.hidden = false;
    };

    const checkAnswer = (options = {}) => {
      if (!active || solved.has(activeIndex)) {
        return;
      }
      const value = normalizeGermanWord(input.value);
      if (!value) {
        setFeedback("Bitte eine Antwort eintippen.", "bad");
        if (speechState.enabled) {
          speakText("Bitte eine Antwort eintippen.", { silent: true });
        }
        return;
      }
      if (value === expectedAnswer) {
        const willCompletePuzzle = solved.size + 1 >= puzzle.entries.length;
        solved.add(activeIndex);
        markCrosswordSolved(puzzle, activeIndex);
        noteCorrect(stats, 16, "Sehr gut!");
        setFeedback("Richtig.", "good");
        input.disabled = true;
        submit.disabled = true;
        voiceButton.disabled = true;
        hintButton.disabled = true;
        if (speechState.enabled && !willCompletePuzzle) {
          speakText("Sehr gut. Weiter zur naechsten Frage.", { silent: true });
        }
        if (solved.size >= puzzle.entries.length) {
          const nextOpen = crosswordPuzzles.findIndex((item) => !getCrosswordState(item).completed);
          const allCrosswordsDone = nextOpen < 0;
          setFeedback(allCrosswordsDone ? "Alles geloest." : "Tafel fertig.", "good");
          if (speechState.enabled) {
            speakText(
              allCrosswordsDone
                ? "Sehr gut. Alle Kreuzwortraetsel sind geloest. Es geht wieder von vorne los."
                : "Sehr gut. Kreuzwortraetsel geloest.",
              { silent: true }
            );
          }
          playSfx("finish");
          setTimeout(() => {
            if (allCrosswordsDone) {
              resetCrosswordProgress();
              loadPuzzle(0);
            } else {
              loadPuzzle(nextOpen);
            }
            render();
          }, 900);
          return;
        }
        moveToNextOpen();
        setTimeout(render, 260);
      } else {
        noteWrong(stats, 1, "Noch einmal langsam.");
        setFeedback("Noch einmal.", "bad");
        if (speechState.enabled) {
          speakText("Noch einmal langsam. Die Antwort passt noch nicht.", { silent: true });
        }
        input.select();
      }
    };

    const startVoiceAnswer = () => {
      if (!supportsVoiceInput()) {
        setFeedback("Sprechen geht hier nicht.", "bad");
        if (speechState.enabled) {
          speakText("Spracheingabe ist in diesem Browser nicht verfuegbar.", { silent: true });
        }
        return;
      }
      stopVoiceRecognition();
      if (supportsSpeech()) {
        window.speechSynthesis.cancel();
      }
      const Recognition = getSpeechRecognitionCtor();
      voiceRecognition = new Recognition();
      voiceRecognition.lang = "de-DE";
      voiceRecognition.interimResults = false;
      voiceRecognition.maxAlternatives = 1;
      voiceButton.classList.add("listening");
      voiceButton.textContent = "Hoere...";
      setFeedback("Sprechen.", "good");
      voiceRecognition.onresult = (event) => {
        const transcript =
          event.results && event.results[0] && event.results[0][0]
            ? event.results[0][0].transcript
            : "";
        const heard = normalizeGermanWord(transcript).slice(0, entry.answer.length + 2);
        input.value = heard;
        updateSlots();
        if (!heard) {
          setFeedback("Nichts gehoert.", "bad");
          if (speechState.enabled) {
            speakText("Ich habe nichts verstanden. Bitte nochmal sprechen.", { silent: true });
          }
          return;
        }
        if (heard === expectedAnswer) {
          checkAnswer({ fromVoice: true });
          return;
        }
        setFeedback(`Gehoert: ${heard}`, "good");
        if (speechState.enabled) {
          speakText(`Ich habe ${heard} verstanden. Bitte pruefen oder nochmal sprechen.`, { silent: true });
        }
      };
      voiceRecognition.onerror = () => {
        setFeedback("Mikrofon klappt nicht.", "bad");
        if (speechState.enabled) {
          speakText("Mikrofon hat nicht geklappt. Tippen geht weiter.", { silent: true });
        }
      };
      voiceRecognition.onend = () => {
        voiceRecognition = null;
        voiceButton.classList.remove("listening");
        voiceButton.textContent = "Sprechen";
      };
      try {
        voiceRecognition.start();
      } catch (err) {
        voiceRecognition = null;
        voiceButton.classList.remove("listening");
        voiceButton.textContent = "Sprechen";
        setFeedback("Mikrofon klappt nicht.", "bad");
      }
    };

    hintButton.addEventListener("click", () => {
      const key = getHintKey();
      const nextCount = Math.min(entry.answer.length, (hintCounts.get(key) || 0) + 1);
      hintCounts.set(key, nextCount);
      updateHintLine();
      const spokenLetters = entry.answer
        .slice(0, nextCount)
        .split("")
        .join(", ");
      setFeedback(`Tipp: ${entry.answer.slice(0, nextCount)}...`, "good");
      if (speechState.enabled) {
        speakText(`Tipp. Die ersten Buchstaben sind ${spokenLetters}.`, { silent: true });
      }
      playSfx("select");
    });

    voiceButton.addEventListener("click", startVoiceAnswer);

    submit.addEventListener("click", checkAnswer);
    input.addEventListener("input", () => {
      input.value = normalizeGermanWord(input.value);
      updateSlots();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        checkAnswer();
      }
    });

    panel.appendChild(step);
    panel.appendChild(clue);
    panel.appendChild(slots);
    panel.appendChild(input);
    panel.appendChild(actionRow);
    extraDetails.appendChild(grid);
    extraDetails.appendChild(clueList);
    layout.appendChild(panel);
    dom.inputArea.appendChild(layout);
    updateHintLine();
    updateSlots();
    input.focus();
    maybeSpeakCurrentClue({ key: `crossword:${puzzle.title}:${activeIndex}` });
  };

  render();

  return {
    destroy() {
      active = false;
      stopVoiceRecognition();
      game.speechAction = null;
      dom.inputArea.innerHTML = "";
    },
    onKey(event) {
      if (event.key === "Enter") {
        const button = dom.inputArea.querySelector(".crossword-panel button.primary");
        if (button) {
          button.click();
        }
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        moveToNextOpen();
        render();
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        const open = puzzle.entries
          .map((entry, index) => index)
          .filter((index) => !solved.has(index));
        const current = open.indexOf(activeIndex);
        if (current > 0) {
          activeIndex = open[current - 1];
        } else if (open.length) {
          activeIndex = open[open.length - 1];
        }
        render();
      }
    },
  };
}

function setupWordle(stats) {
  let active = true;
  let answer = "";
  let guesses = [];
  const maxGuesses = 6;

  const pickFreshAnswer = () => {
    const solvedWords = new Set(progress.wordle.solvedWords);
    const openWords = wordleWords.filter((word) => !solvedWords.has(word));
    const pool = openWords.length ? openWords : wordleWords;
    return pool[randInt(0, pool.length - 1)];
  };

  const startNewWordle = () => {
    answer = pickFreshAnswer();
    guesses = [];
    progress.wordle.currentAnswer = answer;
    progress.wordle.guesses = [];
    saveProgress();
  };

  const resumeWordle = () => {
    const savedAnswer = normalizeGermanWord(progress.wordle.currentAnswer);
    const validAnswer = wordleWords.includes(savedAnswer);
    const savedGuesses = Array.isArray(progress.wordle.guesses)
      ? progress.wordle.guesses.map(normalizeGermanWord).filter((guess) => guess.length === 5).slice(0, maxGuesses)
      : [];
    if (validAnswer && savedGuesses.length < maxGuesses && !savedGuesses.includes(savedAnswer)) {
      answer = savedAnswer;
      guesses = savedGuesses;
      return;
    }
    startNewWordle();
  };

  const scoreGuess = (guess) => {
    const result = Array(answer.length).fill("miss");
    const counts = {};
    answer.split("").forEach((letter, index) => {
      if (guess[index] !== letter) {
        counts[letter] = (counts[letter] || 0) + 1;
      }
    });
    guess.split("").forEach((letter, index) => {
      if (answer[index] === letter) {
        result[index] = "hit";
      }
    });
    guess.split("").forEach((letter, index) => {
      if (result[index] === "hit") {
        return;
      }
      if (counts[letter]) {
        result[index] = "near";
        counts[letter] -= 1;
      }
    });
    return result;
  };

  const getWordleHints = () => {
    const fixed = Array(answer.length).fill("");
    const present = new Set();
    const near = new Set();
    const blocked = new Set();
    const scoredGuesses = guesses.map((guess) => ({ guess, score: scoreGuess(guess) }));

    scoredGuesses.forEach(({ guess, score }) => {
      score.forEach((state, index) => {
        const letter = guess[index];
        if (state === "hit") {
          fixed[index] = letter;
          present.add(letter);
          return;
        }
        if (state === "near") {
          present.add(letter);
          near.add(letter);
        }
      });
    });

    scoredGuesses.forEach(({ guess, score }) => {
      score.forEach((state, index) => {
        const letter = guess[index];
        if (state === "miss" && !present.has(letter)) {
          blocked.add(letter);
        }
      });
    });

    return { fixed, near, blocked };
  };

  const formatLetters = (letters) => [...letters].sort().join(" ");

  const buildWordleHelp = (hints) => {
    const fixedText = hints.fixed.map((letter) => letter || "_").join(" ");
    const parts = [`Fest: ${fixedText}`];
    const nearLetters = [...hints.near].filter((letter) => !hints.fixed.includes(letter));
    if (nearLetters.length) {
      parts.push(`Dabei: ${nearLetters.sort().join(" ")}`);
    }
    if (hints.blocked.size) {
      parts.push(`Nicht: ${formatLetters(hints.blocked)}`);
    }
    return parts.join(" | ");
  };

  const renderBoard = () => {
    dom.options.innerHTML = "";
    dom.inputArea.innerHTML = "";
    setPrompt("Wordle", "5 Buchstaben");
    const hints = getWordleHints();
    game.speechAction = (options = {}) =>
      speakText(`Wordle. ${buildWordleHelp(hints)}. Bitte fehlende Kaestchen fuellen.`, options);
    if (dom.coachTip) {
      dom.coachTip.textContent = "";
    }

    const wrap = document.createElement("div");
    wrap.className = "wordle-wrap";

    const board = document.createElement("div");
    board.className = "wordle-board";
    board.setAttribute("aria-label", "Wordle Raster");
    for (let row = 0; row < maxGuesses; row += 1) {
      const guess = guesses[row] || "";
      const score = guess ? scoreGuess(guess) : [];
      for (let col = 0; col < answer.length; col += 1) {
        const tile = document.createElement("div");
        tile.className = "wordle-tile";
        if (score[col]) {
          tile.classList.add(score[col]);
        }
        tile.textContent = guess[col] || "";
        board.appendChild(tile);
      }
    }

    const help = document.createElement("div");
    help.className = "wordle-help";
    help.textContent = buildWordleHelp(hints);

    const form = document.createElement("div");
    form.className = "wordle-form";
    const entry = document.createElement("div");
    entry.className = "wordle-entry";
    entry.setAttribute("aria-label", "Wordle Wort eingeben");
    const letterInputs = [];
    const submit = document.createElement("button");
    submit.type = "button";
    submit.className = "primary";
    submit.textContent = "OK";

    const openIndexes = () => letterInputs
      .map((box, index) => (box.readOnly ? -1 : index))
      .filter((index) => index >= 0);

    const focusBox = (index) => {
      const box = letterInputs[index];
      if (box && !box.readOnly) {
        box.focus();
        box.select();
        return true;
      }
      return false;
    };

    const focusNextOpen = (fromIndex = 0) => {
      const indexes = openIndexes();
      const next = indexes.find((index) => index >= fromIndex && !letterInputs[index].value)
        ?? indexes.find((index) => index >= fromIndex)
        ?? indexes[0];
      if (Number.isInteger(next)) {
        focusBox(next);
      }
    };

    const focusPreviousOpen = (fromIndex) => {
      const indexes = openIndexes().filter((index) => index < fromIndex);
      const previous = indexes[indexes.length - 1];
      if (Number.isInteger(previous)) {
        focusBox(previous);
      }
    };

    const showBlockedLetter = (letter) => {
      setFeedback(`${letter} geht nicht mehr.`, "bad");
      if (speechState.enabled) {
        speakText(`${letter} geht nicht mehr.`, { silent: true });
      }
    };

    const applyLetters = (rawValue, startIndex) => {
      const letters = normalizeGermanWord(rawValue).split("");
      let index = startIndex;
      let blockedLetter = "";
      letters.forEach((letter) => {
        if (!letter) {
          return;
        }
        if (hints.blocked.has(letter)) {
          blockedLetter = blockedLetter || letter;
          return;
        }
        while (index < answer.length && letterInputs[index] && letterInputs[index].readOnly) {
          index += 1;
        }
        if (index < answer.length && letterInputs[index]) {
          letterInputs[index].value = letter;
          index += 1;
        }
      });
      if (blockedLetter) {
        showBlockedLetter(blockedLetter);
      }
      focusNextOpen(index);
    };

    hints.fixed.forEach((letter, index) => {
      const box = document.createElement("input");
      box.type = "text";
      box.inputMode = "text";
      box.autocomplete = "off";
      box.maxLength = 1;
      box.className = "wordle-letter-input";
      box.value = letter;
      box.readOnly = Boolean(letter);
      box.classList.toggle("locked", Boolean(letter));
      box.setAttribute(
        "aria-label",
        letter ? `Buchstabe ${index + 1}, richtig ${letter}` : `Buchstabe ${index + 1}`
      );
      if (letter) {
        box.tabIndex = -1;
      }
      box.addEventListener("input", () => {
        const value = box.value;
        box.value = "";
        applyLetters(value, index);
      });
      box.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          checkGuess();
          return;
        }
        if (event.key === "Backspace" && !box.value) {
          event.preventDefault();
          focusPreviousOpen(index);
        }
      });
      letterInputs.push(box);
      entry.appendChild(box);
    });

    const getGuess = () => letterInputs.map((box) => normalizeGermanWord(box.value).slice(0, 1)).join("");

    const checkGuess = () => {
      if (!active) {
        return;
      }
      const guess = getGuess();
      if (guess.length !== answer.length) {
        setFeedback("Bitte alle 5 Kaestchen fuellen.", "bad");
        if (speechState.enabled) {
          speakText("Bitte alle 5 Kaestchen fuellen.", { silent: true });
        }
        focusNextOpen(0);
        return;
      }
      guesses.push(guess);
      progress.wordle.currentAnswer = answer;
      progress.wordle.guesses = guesses.slice(0, maxGuesses);
      saveProgress();
      if (guess === answer) {
        const points = Math.max(10, 22 - guesses.length * 2);
        if (!progress.wordle.solvedWords.includes(answer)) {
          progress.wordle.solvedWords.push(answer);
        }
        progress.wordle.currentAnswer = "";
        progress.wordle.guesses = [];
        saveProgress();
        noteCorrect(stats, points, "Wort geloest!");
        setTimeout(() => {
          startNewWordle();
          renderBoard();
        }, 850);
        return;
      }
      if (guesses.length >= maxGuesses) {
        progress.wordle.currentAnswer = "";
        progress.wordle.guesses = [];
        saveProgress();
        noteWrong(stats, 2, `Loesung: ${answer}`);
        setTimeout(() => {
          startNewWordle();
          renderBoard();
        }, 1100);
        return;
      }
      setFeedback(`${maxGuesses - guesses.length} Versuche uebrig.`, "good");
      playSfx("select");
      renderBoard();
    };

    submit.addEventListener("click", checkGuess);

    form.appendChild(entry);
    form.appendChild(submit);
    wrap.appendChild(board);
    wrap.appendChild(help);
    wrap.appendChild(form);
    dom.inputArea.appendChild(wrap);
    focusNextOpen(0);
    maybeSpeakCurrentClue({ key: `wordle:${answer}` });
  };

  resumeWordle();
  renderBoard();

  return {
    destroy() {
      active = false;
      dom.inputArea.innerHTML = "";
    },
    onKey(event) {
      if (event.key === "Enter") {
        const button = dom.inputArea.querySelector(".wordle-form button");
        if (button) {
          button.click();
        }
      }
    },
  };
}

function setupMath(stats) {
  let active = true;
  let locked = false;
  let correctIndex = 0;
  let optionValues = [];
  let currentLevel = 0;

  const ask = () => {
    if (!active) {
      return;
    }
    locked = false;
    currentLevel = getAdaptiveLevel(stats, 4, 4, 0);
    let question = "";
    let answer = 0;

    const makeAddSub = () => {
      const min = 6 + currentLevel * 4;
      const max = 18 + currentLevel * 7;
      const a = randInt(min, max);
      const b = randInt(3 + currentLevel, 16 + currentLevel * 3);
      const op = Math.random() > 0.5 ? "+" : "-";
      const x = op === "-" && a < b ? b : a;
      const y = op === "-" && a < b ? a : b;
      return {
        question: `${x} ${op} ${y} = ?`,
        answer: op === "+" ? x + y : x - y,
      };
    };

    const makeMultiply = () => {
      const a = randInt(2, 7 + currentLevel);
      const b = randInt(2, 8 + currentLevel);
      return { question: `${a} x ${b} = ?`, answer: a * b };
    };

    const makeDivide = () => {
      const divisor = randInt(2, 7 + currentLevel);
      const quotient = randInt(2, 8 + currentLevel);
      const dividend = divisor * quotient;
      return { question: `${dividend} / ${divisor} = ?`, answer: quotient };
    };

    const makeTwoStep = () => {
      const a = randInt(10 + currentLevel * 3, 26 + currentLevel * 6);
      const b = randInt(4, 12 + currentLevel * 3);
      const c = randInt(2, 10 + currentLevel * 2);
      const useMinus = Math.random() > 0.35;
      const answerValue = useMinus ? a + b - c : a + b + c;
      return {
        question: useMinus ? `${a} + ${b} - ${c} = ?` : `${a} + ${b} + ${c} = ?`,
        answer: answerValue,
      };
    };

    const makeMissing = () => {
      const pick = randInt(0, 2);
      if (pick === 0) {
        const a = randInt(6, 20 + currentLevel * 4);
        const b = randInt(4, 16 + currentLevel * 3);
        const result = a + b;
        const hideLeft = Math.random() < 0.5;
        return {
          question: hideLeft ? `? + ${b} = ${result}` : `${a} + ? = ${result}`,
          answer: hideLeft ? a : b,
        };
      }
      if (pick === 1) {
        const base = randInt(12, 32 + currentLevel * 6);
        const sub = randInt(2, 12 + currentLevel * 3);
        const result = base - sub;
        const hideLeft = Math.random() < 0.5;
        return {
          question: hideLeft ? `? - ${sub} = ${result}` : `${base} - ? = ${result}`,
          answer: hideLeft ? base : sub,
        };
      }
      const a = randInt(2, 7 + currentLevel);
      const b = randInt(2, 8 + currentLevel);
      const product = a * b;
      const hideLeft = Math.random() < 0.5;
      return {
        question: hideLeft ? `? x ${b} = ${product}` : `${a} x ? = ${product}`,
        answer: hideLeft ? a : b,
      };
    };

    const variants = [makeAddSub, makeAddSub];
    if (currentLevel >= 1) {
      variants.push(makeMissing);
    }
    if (currentLevel >= 2) {
      variants.push(makeMultiply, makeDivide);
    }
    if (currentLevel >= 3) {
      variants.push(makeTwoStep, makeMissing);
    }

    const pickVariant = variants[randInt(0, variants.length - 1)];
    const result = pickVariant();
    question = result.question;
    answer = result.answer;

    const spreadBase = Math.max(3, 7 - currentLevel);
    const magnitude = Math.max(3, Math.round(Math.abs(answer) * 0.22));
    const spread = Math.min(14 + currentLevel * 2, Math.max(spreadBase, magnitude));
    const optionsSet = new Set([answer]);
    while (optionsSet.size < 4) {
      const tweak = randInt(-spread, spread);
      if (tweak === 0) {
        continue;
      }
      const candidate = Math.max(0, answer + tweak);
      optionsSet.add(candidate);
    }
    optionValues = shuffle([...optionsSet]);
    correctIndex = optionValues.indexOf(answer);
    const hints = [
      `Level ${currentLevel + 1} Tempo.`,
      "Fokus: Genauigkeit.",
      "Fokus: Tempo.",
      "Ziel: Serie halten.",
      "Kopf rechnen, los!",
    ];
    setPrompt(question, hints[randInt(0, hints.length - 1)]);
    setOptions(
      optionValues.map((value) => ({ label: String(value), value })),
      (index) => handleAnswer(index)
    );
  };

  const handleAnswer = (index) => {
    if (!active || locked) {
      return;
    }
    locked = true;
    if (index === correctIndex) {
      noteCorrect(stats, 10 + currentLevel * 2, "Richtig!");
    } else {
      noteWrong(stats, 4 + currentLevel, "Knapp daneben.");
    }
    const delay = Math.max(130, 220 - currentLevel * 25);
    setTimeout(ask, delay);
  };

  ask();

  return {
    destroy() {
      active = false;
    },
    onKey(event) {
      const key = event.key;
      if (key >= "1" && key <= "4") {
        handleAnswer(Number(key) - 1);
      }
    },
  };
}

function setupStroop(stats) {
  let active = true;
  let locked = false;
  let isMatch = false;
  let currentLevel = 0;

  const basePalette = [
    { word: "ROT", color: "#ff4f4f" },
    { word: "BLAU", color: "#2f7ea8" },
    { word: "GRUEN", color: "#3aa370" },
    { word: "GELB", color: "#f1b631" },
  ];

  const extraPalette = [
    { word: "ORANGE", color: "#f08c2e" },
    { word: "TURKIS", color: "#28a7a3" },
    { word: "BRAUN", color: "#8b5a2b" },
  ];

  const ask = () => {
    if (!active) {
      return;
    }
    locked = false;
    currentLevel = getAdaptiveLevel(stats, 5, 3, 0);
    const palette = basePalette.concat(extraPalette.slice(0, currentLevel));
    const wordItem = palette[randInt(0, palette.length - 1)];
    const match = Math.random() > 0.5;
    let colorItem = wordItem;
    if (!match) {
      const other = palette.filter((item) => item.word !== wordItem.word);
      colorItem = other[randInt(0, other.length - 1)];
    }
    isMatch = match;
    dom.prompt.textContent = wordItem.word;
    dom.prompt.classList.add("stroop-word");
    dom.prompt.style.color = colorItem.color;
    dom.subprompt.textContent = "Stimmt Wort und Farbe?";
    pulse(dom.prompt);
    setOptions(
      [
        { label: "Match", value: true },
        { label: "No Match", value: false },
      ],
      (index) => handleAnswer(index === 0)
    );
  };

  const handleAnswer = (choice) => {
    if (!active || locked) {
      return;
    }
    locked = true;
    if (choice === isMatch) {
      noteCorrect(stats, 8 + currentLevel * 2, "Korrekt!");
    } else {
      noteWrong(stats, 3 + currentLevel, "Falsch.");
    }
    const delay = Math.max(140, 210 - currentLevel * 25);
    setTimeout(ask, delay);
  };

  ask();

  return {
    destroy() {
      active = false;
    },
    onKey(event) {
      const key = event.key.toLowerCase();
      if (key === "j" || key === "y") {
        handleAnswer(true);
      }
      if (key === "n") {
        handleAnswer(false);
      }
    },
  };
}

function setupReaction(stats) {
  let active = true;
  let waiting = true;
  let goTime = 0;
  let goTimeout = null;
  let repeatTimeout = null;
  let isEven = false;
  let currentLevel = 0;

  const renderWaitButton = () => {
    dom.options.innerHTML = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = "Bereit...";
    btn.addEventListener("click", () => handleAnswer(null));
    dom.options.appendChild(btn);
    pulse(dom.options);
  };

  const schedule = () => {
    if (!active) {
      return;
    }
    if (goTimeout) {
      clearTimeout(goTimeout);
    }
    if (repeatTimeout) {
      clearTimeout(repeatTimeout);
    }
    waiting = true;
    currentLevel = getAdaptiveLevel(stats, 4, 3, 0);
    setPrompt("Bereit?", "Reagiere und waehle gerade/ungerade.");
    renderWaitButton();
    const delay = randInt(1200, 2800);
    goTimeout = setTimeout(() => {
      if (!active) {
        return;
      }
      waiting = false;
      const maxNumber = currentLevel >= 2 ? 29 : 19;
      const number = randInt(2, maxNumber);
      isEven = number % 2 === 0;
      goTime = performance.now();
      setPrompt(`Zahl: ${number}`, "Waehle gerade oder ungerade.");
      setOptions(
        [
          { label: "Gerade", value: "even" },
          { label: "Ungerade", value: "odd" },
        ],
        (index, option) => handleAnswer(option.value)
      );
    }, delay);
  };

  const handleAnswer = (value) => {
    if (!active) {
      return;
    }
    if (waiting) {
      if (goTimeout) {
        clearTimeout(goTimeout);
      }
      if (game.sessionMeta) {
        game.sessionMeta.earlyReactions += 1;
      }
      noteWrong(stats, 6 + currentLevel, "Zu frueh.");
      repeatTimeout = setTimeout(schedule, 600);
      return;
    }
    const reaction = Math.round(performance.now() - goTime);
    const fast = Math.max(220, 320 - currentLevel * 20);
    const mid = Math.max(300, 420 - currentLevel * 15);
    const slow = Math.max(380, 520 - currentLevel * 10);
    const correct = (value === "even") === isEven;
    if (correct) {
      let basePoints = 10 + currentLevel;
      if (reaction < fast) {
        basePoints = 22 + currentLevel;
      } else if (reaction < mid) {
        basePoints = 17 + currentLevel;
      } else if (reaction < slow) {
        basePoints = 13 + currentLevel;
      }
      if (game.sessionMeta) {
        game.sessionMeta.reactionCount += 1;
        if (reaction < fast) {
          game.sessionMeta.fastReactions += 1;
        }
      }
      noteCorrect(stats, basePoints, `Reaktion ${reaction}ms`);
    } else {
      if (game.sessionMeta) {
        game.sessionMeta.reactionCount += 1;
      }
      noteWrong(stats, 6 + currentLevel, "Falsch.");
    }
    repeatTimeout = setTimeout(schedule, 600);
  };

  schedule();

  return {
    destroy() {
      active = false;
      if (goTimeout) {
        clearTimeout(goTimeout);
      }
      if (repeatTimeout) {
        clearTimeout(repeatTimeout);
      }
    },
    onKey(event) {
      const key = event.key.toLowerCase();
      if (key === "1" || key === "g") {
        handleAnswer("even");
      }
      if (key === "2" || key === "u") {
        handleAnswer("odd");
      }
    },
  };
}

function setupSymbolScan(stats) {
  let active = true;
  let locked = false;
  let currentLevel = 0;
  let correctCount = 0;
  let targetSymbol = "";

  const renderGrid = (symbols) => {
    dom.inputArea.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "symbol-grid";
    symbols.forEach((symbol) => {
      const cell = document.createElement("div");
      cell.className = "symbol-cell";
      cell.textContent = symbol;
      grid.appendChild(cell);
    });
    dom.inputArea.appendChild(grid);
  };

  const ask = () => {
    if (!active) {
      return;
    }
    locked = false;
    currentLevel = getAdaptiveLevel(stats, 5, 3, 0);
    targetSymbol = scanSymbols[randInt(0, scanSymbols.length - 1)];
    const gridSize = 12;
    const maxCount = Math.min(5, 2 + currentLevel + (Math.random() < 0.35 ? 1 : 0));
    correctCount = randInt(0, maxCount);
    const positions = new Set();
    while (positions.size < correctCount) {
      positions.add(randInt(0, gridSize - 1));
    }
    const symbols = [];
    for (let i = 0; i < gridSize; i += 1) {
      if (positions.has(i)) {
        symbols.push(targetSymbol);
      } else {
        let symbol = scanSymbols[randInt(0, scanSymbols.length - 1)];
        if (symbol === targetSymbol) {
          symbol = scanSymbols[(scanSymbols.indexOf(symbol) + 1) % scanSymbols.length];
        }
        symbols.push(symbol);
      }
    }
    renderGrid(symbols);
    setPrompt(`Suche: ${targetSymbol}`, "Wie oft ist das Symbol da?");
    const optionsSet = new Set([correctCount]);
    while (optionsSet.size < 4) {
      optionsSet.add(randInt(0, 5));
    }
    const options = shuffle([...optionsSet]);
    setOptions(
      options.map((value) => ({ label: String(value), value })),
      (index, option) => handleAnswer(option.value)
    );
  };

  const handleAnswer = (value) => {
    if (!active || locked) {
      return;
    }
    locked = true;
    if (value === correctCount) {
      noteCorrect(stats, 9 + currentLevel, "Richtig!");
    } else {
      noteWrong(stats, 4 + currentLevel, "Falsch.");
    }
    const delay = Math.max(180, 260 - currentLevel * 20);
    setTimeout(ask, delay);
  };

  ask();

  return {
    destroy() {
      active = false;
      dom.inputArea.innerHTML = "";
    },
    onKey(event) {
      const key = event.key;
      if (key >= "1" && key <= "4") {
        const index = Number(key) - 1;
        const buttons = [...dom.options.querySelectorAll("button")];
        if (buttons[index]) {
          buttons[index].click();
        }
      }
    },
  };
}

function setupWordChain(stats) {
  let active = true;
  let locked = false;
  let currentLevel = 0;
  let currentWord = "";

  const startLetter = (word) => word[0].toLowerCase();
  const endLetter = (word) => word[word.length - 1].toLowerCase();

  const pickSeed = () => {
    for (let i = 0; i < 20; i += 1) {
      const candidate = chainWords[randInt(0, chainWords.length - 1)];
      const letter = endLetter(candidate);
      const hasNext = chainWords.some(
        (word) => startLetter(word) === letter && word !== candidate
      );
      if (hasNext) {
        return candidate;
      }
    }
    return chainWords[0];
  };

  currentWord = pickSeed();

  const ask = () => {
    if (!active) {
      return;
    }
    locked = false;
    currentLevel = getAdaptiveLevel(stats, 4, 3, 0);
    const last = endLetter(currentWord);
    let candidates = chainWords.filter(
      (word) => startLetter(word) === last && word !== currentWord
    );
    if (candidates.length === 0) {
      currentWord = pickSeed();
      candidates = chainWords.filter(
        (word) => startLetter(word) === endLetter(currentWord) && word !== currentWord
      );
      if (candidates.length === 0) {
        return;
      }
    }
    const correct = candidates[randInt(0, candidates.length - 1)];
    const decoys = chainWords.filter((word) => startLetter(word) !== last);
    const options = shuffle([correct, ...shuffle(decoys).slice(0, 3)]);
    setPrompt(`Wort: ${currentWord}`, `Naechstes beginnt mit "${last.toUpperCase()}"`);
    setOptions(
      options.map((word) => ({ label: word, value: word })),
      (index, option) => handleAnswer(option.value, correct)
    );
  };

  const handleAnswer = (value, correct) => {
    if (!active || locked) {
      return;
    }
    locked = true;
    if (value === correct) {
      noteCorrect(stats, 9 + currentLevel, "Richtig!");
    } else {
      noteWrong(stats, 4 + currentLevel, "Falsch.");
    }
    currentWord = correct;
    const delay = Math.max(160, 230 - currentLevel * 20);
    setTimeout(ask, delay);
  };

  ask();

  return {
    destroy() {
      active = false;
    },
    onKey(event) {
      const key = event.key;
      if (key >= "1" && key <= "4") {
        const index = Number(key) - 1;
        const buttons = [...dom.options.querySelectorAll("button")];
        if (buttons[index]) {
          buttons[index].click();
        }
      }
    },
  };
}

function setupRotation(stats) {
  let active = true;
  let locked = false;
  let currentLevel = 0;
  let correctDir = "N";

  const ask = () => {
    if (!active) {
      return;
    }
    locked = false;
    currentLevel = getAdaptiveLevel(stats, 4, 3, 0);
    const baseDir = rotationDirs[randInt(0, rotationDirs.length - 1)];
    let degrees = 90;
    if (currentLevel === 1) {
      degrees = Math.random() < 0.5 ? 90 : 180;
    } else if (currentLevel >= 2) {
      const options = [90, 180, 270];
      degrees = options[randInt(0, options.length - 1)];
    }
    const steps = Math.round(degrees / 90);
    const baseIndex = rotationDirs.indexOf(baseDir);
    correctDir = rotationDirs[(baseIndex + steps) % rotationDirs.length];
    setPrompt(`Ausgang: ${baseDir}`, `Drehung: ${degrees} Grad`);
    setOptions(
      rotationDirs.map((dir) => ({ label: dir, value: dir })),
      (index, option) => handleAnswer(option.value)
    );
  };

  const handleAnswer = (value) => {
    if (!active || locked) {
      return;
    }
    locked = true;
    if (value === correctDir) {
      noteCorrect(stats, 9 + currentLevel, "Richtig!");
    } else {
      noteWrong(stats, 4 + currentLevel, "Falsch.");
    }
    const delay = Math.max(160, 230 - currentLevel * 20);
    setTimeout(ask, delay);
  };

  ask();

  return {
    destroy() {
      active = false;
    },
    onKey(event) {
      const key = event.key;
      if (key >= "1" && key <= "4") {
        const index = Number(key) - 1;
        const buttons = [...dom.options.querySelectorAll("button")];
        if (buttons[index]) {
          buttons[index].click();
        }
      }
    },
  };
}

function setupDualTask(stats) {
  let active = true;
  let locked = false;
  let currentLevel = 0;
  let isTrue = false;

  const vowels = ["a", "e", "i", "o", "u"];

  const ask = () => {
    if (!active) {
      return;
    }
    locked = false;
    currentLevel = getAdaptiveLevel(stats, 4, 3, 0);
    const word = dualWords[randInt(0, dualWords.length - 1)];
    const maxNumber = currentLevel >= 2 ? 29 : 19;
    const number = randInt(2, maxNumber);
    const startsVowel = vowels.includes(word[0].toLowerCase());
    const isEven = number % 2 === 0;
    isTrue = startsVowel && isEven;
    setPrompt(`Wort: ${word} | Zahl: ${number}`, "Regel: Vokalstart UND gerade Zahl?");
    setOptions(
      [
        { label: "Ja", value: true },
        { label: "Nein", value: false },
      ],
      (index) => handleAnswer(index === 0)
    );
  };

  const handleAnswer = (value) => {
    if (!active || locked) {
      return;
    }
    locked = true;
    if (value === isTrue) {
      noteCorrect(stats, 9 + currentLevel, "Korrekt!");
    } else {
      noteWrong(stats, 4 + currentLevel, "Falsch.");
    }
    const delay = Math.max(150, 230 - currentLevel * 20);
    setTimeout(ask, delay);
  };

  ask();

  return {
    destroy() {
      active = false;
    },
    onKey(event) {
      const key = event.key.toLowerCase();
      if (key === "j" || key === "y") {
        handleAnswer(true);
      }
      if (key === "n") {
        handleAnswer(false);
      }
    },
  };
}

function setupCompare(stats) {
  let active = true;
  let locked = false;
  let currentLevel = 0;
  let correctChoice = "left";

  const ask = () => {
    if (!active) {
      return;
    }
    locked = false;
    currentLevel = getAdaptiveLevel(stats, 4, 4, 0);
    const base = randInt(12 + currentLevel * 8, 60 + currentLevel * 18);
    const maxDiff = 8 + currentLevel * 6;
    const diff = randInt(1 + currentLevel, maxDiff);
    let left = base + randInt(-diff, diff);
    let right = base + randInt(-diff, diff);
    const allowEqual = currentLevel >= 2 && Math.random() < 0.25;
    if (allowEqual) {
      right = left;
    } else if (left === right) {
      right += diff;
    }
    if (left === right) {
      correctChoice = "equal";
    } else {
      correctChoice = left > right ? "left" : "right";
    }
    const options = [
      { label: `${left} links`, value: "left" },
      { label: `${right} rechts`, value: "right" },
    ];
    if (allowEqual) {
      options.push({ label: "Gleich", value: "equal" });
    }
    setPrompt(
      `${left}  vs  ${right}`,
      allowEqual ? "Groesser, kleiner oder gleich?" : "Welche Zahl ist groesser?"
    );
    setOptions(options, (index, option) => handleAnswer(option.value));
  };

  const handleAnswer = (value) => {
    if (!active || locked) {
      return;
    }
    locked = true;
    if (value === correctChoice) {
      noteCorrect(stats, 9 + currentLevel, "Richtig!");
    } else {
      noteWrong(stats, 4 + currentLevel, "Falsch.");
    }
    const delay = Math.max(150, 230 - currentLevel * 20);
    setTimeout(ask, delay);
  };

  ask();

  return {
    destroy() {
      active = false;
    },
    onKey(event) {
      const key = event.key;
      if (key >= "1" && key <= "3") {
        const index = Number(key) - 1;
        const buttons = [...dom.options.querySelectorAll("button")];
        if (buttons[index]) {
          buttons[index].click();
        }
      }
    },
  };
}

function setupCategory(stats) {
  let active = true;
  let locked = false;
  let currentLevel = 0;
  let correctItem = "";

  const ask = () => {
    if (!active) {
      return;
    }
    locked = false;
    currentLevel = getAdaptiveLevel(stats, 5, 3, 0);
    const category = categoryBank[randInt(0, categoryBank.length - 1)];
    correctItem = category.items[randInt(0, category.items.length - 1)];
    const decoyPool = categoryBank
      .filter((cat) => cat.name !== category.name)
      .flatMap((cat) => cat.items);
    const decoys = [];
    while (decoys.length < 3) {
      const candidate = decoyPool[randInt(0, decoyPool.length - 1)];
      if (candidate !== correctItem && !decoys.includes(candidate)) {
        decoys.push(candidate);
      }
    }
    const options = shuffle([correctItem, ...decoys]);
    setPrompt(category.name, "Welches Wort passt zur Kategorie?");
    setOptions(
      options.map((value) => ({ label: value, value })),
      (index, option) => handleAnswer(option.value)
    );
  };

  const handleAnswer = (value) => {
    if (!active || locked) {
      return;
    }
    locked = true;
    if (value === correctItem) {
      noteCorrect(stats, 9 + currentLevel, "Richtig!");
    } else {
      noteWrong(stats, 4 + currentLevel, "Nicht ganz.");
    }
    const delay = Math.max(150, 230 - currentLevel * 20);
    setTimeout(ask, delay);
  };

  ask();

  return {
    destroy() {
      active = false;
    },
    onKey(event) {
      const key = event.key;
      if (key >= "1" && key <= "4") {
        const index = Number(key) - 1;
        const buttons = [...dom.options.querySelectorAll("button")];
        if (buttons[index]) {
          buttons[index].click();
        }
      }
    },
  };
}

function setupWordLength(stats) {
  let active = true;
  let locked = false;
  let currentLevel = 0;
  let correctIndex = 0;

  const pickWords = (count) => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const words = shuffle(wordBank).slice(0, count);
      const lengths = new Set(words.map((word) => word.length));
      if (lengths.size === words.length) {
        return words;
      }
    }
    return shuffle(wordBank).slice(0, count);
  };

  const ask = () => {
    if (!active) {
      return;
    }
    locked = false;
    currentLevel = getAdaptiveLevel(stats, 4, 3, 0);
    const count = currentLevel >= 2 ? 4 : 3;
    const chooseLongest = Math.random() > 0.5;
    const words = pickWords(count);
    const lengths = words.map((word) => word.length);
    const targetLength = chooseLongest ? Math.max(...lengths) : Math.min(...lengths);
    correctIndex = lengths.indexOf(targetLength);
    setPrompt(
      chooseLongest ? "Laengstes Wort?" : "Kuerzestes Wort?",
      "Waehle die passende Option."
    );
    setOptions(
      words.map((word) => ({ label: word, value: word })),
      (index) => handleAnswer(index)
    );
  };

  const handleAnswer = (index) => {
    if (!active || locked) {
      return;
    }
    locked = true;
    if (index === correctIndex) {
      noteCorrect(stats, 9 + currentLevel, "Richtig!");
    } else {
      noteWrong(stats, 4 + currentLevel, "Falsch.");
    }
    const delay = Math.max(160, 240 - currentLevel * 20);
    setTimeout(ask, delay);
  };

  ask();

  return {
    destroy() {
      active = false;
    },
    onKey(event) {
      const key = event.key;
      if (key >= "1" && key <= "4") {
        const index = Number(key) - 1;
        const buttons = [...dom.options.querySelectorAll("button")];
        if (buttons[index]) {
          buttons[index].click();
        }
      }
    },
  };
}

function setupPatternMemory(stats) {
  let active = true;
  let locked = false;
  let currentLevel = 0;
  let correctKey = "";
  let showTimeout = null;
  const size = 3;

  const patternKey = (pattern) => pattern.slice().sort((a, b) => a - b).join(",");

  const makePattern = (count) => {
    const positions = new Set();
    while (positions.size < count) {
      positions.add(randInt(0, size * size - 1));
    }
    return [...positions].sort((a, b) => a - b);
  };

  const mutatePattern = (pattern) => {
    const set = new Set(pattern);
    const flips = 1 + (Math.random() < 0.5 ? 1 : 0);
    for (let i = 0; i < flips; i += 1) {
      const idx = randInt(0, size * size - 1);
      if (set.has(idx)) {
        set.delete(idx);
      } else {
        set.add(idx);
      }
    }
    if (set.size < 2) {
      set.add(randInt(0, size * size - 1));
    }
    return [...set].sort((a, b) => a - b);
  };

  const buildGrid = (pattern, small) => {
    const grid = document.createElement("div");
    grid.className = small ? "pattern-grid small" : "pattern-grid";
    const filled = new Set(pattern);
    for (let i = 0; i < size * size; i += 1) {
      const cell = document.createElement("div");
      cell.className = "pattern-cell";
      if (filled.has(i)) {
        cell.classList.add("filled");
      }
      grid.appendChild(cell);
    }
    return grid;
  };

  const renderPattern = (pattern) => {
    dom.inputArea.innerHTML = "";
    dom.inputArea.appendChild(buildGrid(pattern, false));
  };

  const renderOptions = (patterns) => {
    dom.options.innerHTML = "";
    patterns.forEach((pattern, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn pattern-option";
      const grid = buildGrid(pattern, true);
      const key = document.createElement("span");
      key.className = "option-key";
      key.textContent = `${index + 1}`;
      btn.appendChild(grid);
      btn.appendChild(key);
      btn.addEventListener("click", () => handleAnswer(patternKey(pattern)));
      dom.options.appendChild(btn);
    });
    pulse(dom.options);
  };

  const ask = () => {
    if (!active) {
      return;
    }
    locked = false;
    currentLevel = getAdaptiveLevel(stats, 2, 4, -1);
    const count = 3 + Math.min(3, currentLevel);
    const correctPattern = makePattern(count);
    correctKey = patternKey(correctPattern);
    dom.options.innerHTML = "";
    setPrompt("Pattern merken", "Merke das Muster.");
    renderPattern(correctPattern);
    const showMs = Math.max(800, 1700 - currentLevel * 140);
    showTimeout = setTimeout(() => {
      if (!active) {
        return;
      }
      dom.inputArea.innerHTML = "";
      setPrompt("Welches Pattern war es?", "Waehle eine Option.");
      const options = [correctPattern];
      const keys = new Set([correctKey]);
      while (options.length < 4) {
        const variant = mutatePattern(correctPattern);
        const key = patternKey(variant);
        if (!keys.has(key)) {
          options.push(variant);
          keys.add(key);
        }
      }
      renderOptions(shuffle(options));
    }, showMs);
  };

  const handleAnswer = (key) => {
    if (!active || locked) {
      return;
    }
    locked = true;
    if (key === correctKey) {
      noteCorrect(stats, 12 + currentLevel * 2, "Richtig!");
    } else {
      noteWrong(stats, 5 + currentLevel, "Falsch.");
    }
    const delay = Math.max(200, 320 - currentLevel * 20);
    setTimeout(ask, delay);
  };

  ask();

  return {
    destroy() {
      active = false;
      if (showTimeout) {
        clearTimeout(showTimeout);
      }
      dom.inputArea.innerHTML = "";
    },
    onKey(event) {
      const key = event.key;
      if (key >= "1" && key <= "4") {
        const index = Number(key) - 1;
        const buttons = [...dom.options.querySelectorAll("button")];
        if (buttons[index]) {
          buttons[index].click();
        }
      }
    },
  };
}

function setupMemory(stats) {
  let active = true;
  let expected = "";
  let showTimeout = null;

  const ask = () => {
    if (!active) {
      return;
    }
    clearStage();
    if (showTimeout) {
      clearTimeout(showTimeout);
    }
    const currentLevel = getAdaptiveLevel(stats, 3, 3, -1);
    const lengthBoost = Math.floor(currentLevel / 2);
    const length = 3 + Math.min(4, Math.floor(stats.correct / 3) + lengthBoost);
    const showMs = Math.max(700, 1800 - currentLevel * 140);
    expected = "";
    for (let i = 0; i < length; i += 1) {
      expected += String(randInt(0, 9));
    }
    setPrompt(expected, "Merken!");

    showTimeout = setTimeout(() => {
      if (!active) {
        return;
      }
      setPrompt("Jetzt eintippen", `Laenge ${length} Ziffern`);
      renderInput(length);
    }, showMs);
  };

  const renderInput = (length) => {
    dom.inputArea.innerHTML = "";
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.placeholder = "Ziffernfolge";
    input.maxLength = expected.length;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "primary";
    btn.textContent = "Pruefen";
    dom.inputArea.appendChild(input);
    dom.inputArea.appendChild(btn);
    input.focus();

    const submit = () => {
      if (!active) {
        return;
      }
      const value = input.value.replace(/\s+/g, "");
      if (value.length < length) {
        setFeedback("Zu kurz.", "bad");
        return;
      }
      if (value === expected) {
        noteCorrect(stats, 12 + length, "Richtig!");
      } else {
        noteWrong(stats, 5 + Math.floor(length / 3), `Falsch. ${expected}`);
      }
      ask();
    };

    btn.addEventListener("click", submit);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        submit();
      }
    });
  };

  ask();

  return {
    destroy() {
      active = false;
      if (showTimeout) {
        clearTimeout(showTimeout);
      }
    },
    onKey(event) {
      if (event.key === "Enter") {
        const btn = dom.inputArea.querySelector("button");
        if (btn) {
          btn.click();
        }
      }
    },
  };
}

function handleGlobalHotkeys(event) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }
  const target = event.target;
  const tag = target && target.tagName ? target.tagName.toLowerCase() : "";
  if (tag === "input" || tag === "textarea" || (target && target.isContentEditable)) {
    return;
  }
  const key = event.key.toLowerCase();
  if (key === "m" && dom.toggleMissions) {
    dom.toggleMissions.click();
  }
  if (key === "f" && dom.toggleFocus) {
    dom.toggleFocus.click();
  }
  if (key === "c" && dom.toggleCompact) {
    dom.toggleCompact.click();
  }
  if (key === "b" && dom.toggleBgm) {
    dom.toggleBgm.click();
  }
  if (key === "s" && dom.toggleSfx) {
    dom.toggleSfx.click();
  }
  if (key === "v" && dom.toggleSpeech) {
    dom.toggleSpeech.click();
  }
}

document.addEventListener("keydown", handleGlobalHotkeys);

document.addEventListener("keydown", (event) => {
  if (!game.running || !game.currentMode || !game.currentMode.onKey) {
    return;
  }
  const target = event.target;
  const tag = target && target.tagName ? target.tagName.toLowerCase() : "";
  if (tag === "input" || tag === "textarea" || (target && target.isContentEditable)) {
    return;
  }
  game.currentMode.onKey(event);
});

function showStartOverlay() {
  updateSessionInfo();
  updateDailyFocusDisplay();
  updateMissionHUD();
  updateRoundProgress();
  updateWeeklyDisplay();
  const statsHtml = modes
    .map((mode) => `<div>${mode.title}</div>`)
    .join("");
  showOverlay({
    title: "Omas Spiele",
    body: "Startet mit Kreuzwortraetsel. Alles ist gross, ruhig und ohne Zeitlimit.",
    statsHtml,
    primaryLabel: "Start: Kreuzwort",
    secondaryLabel: "Uebung waehlen",
    onPrimary: () => {
      startCrosswordSession();
    },
    onSecondary: () => {
      showExercisePicker();
    },
  });
}

applyDefaultUIState();
setupAudioControls();
updateAppScale();
window.addEventListener("resize", updateAppScale);

startCrosswordSession();
requestStartupFullscreen();
