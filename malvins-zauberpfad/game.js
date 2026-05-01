"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const sceneNameEl = document.querySelector("#sceneName");
const objectiveEl = document.querySelector("#objective");
const dialogEl = document.querySelector("#dialog");
const dialogTextEl = document.querySelector("#dialogText");
const portraitEl = document.querySelector("#portrait");
const inventorySlotsEl = document.querySelector("#inventorySlots");
const gameWrapEl = document.querySelector(".game-wrap");
const hotspotToggle = document.querySelector("#hotspotToggle");
const pathToggle = document.querySelector("#pathToggle");
const compassToggle = document.querySelector("#compassToggle");
const hintButton = document.querySelector("#hintButton");
const journalToggle = document.querySelector("#journalToggle");
const journalClose = document.querySelector("#journalClose");
const mapToggle = document.querySelector("#mapToggle");
const mapClose = document.querySelector("#mapClose");
const saveButton = document.querySelector("#saveButton");
const loadButton = document.querySelector("#loadButton");
const fullscreenToggle = document.querySelector("#fullscreenToggle");
const journalEl = document.querySelector("#journal");
const journalProgressEl = document.querySelector("#journalProgress");
const journalBadgesEl = document.querySelector("#journalBadges");
const journalNextEl = document.querySelector("#journalNext");
const journalEntriesEl = document.querySelector("#journalEntries");
const mapPanelEl = document.querySelector("#mapPanel");
const mapGridEl = document.querySelector("#mapGrid");
const mapNoteEl = document.querySelector("#mapNote");
const toastEl = document.querySelector("#toast");
const finalePanelEl = document.querySelector("#finalePanel");
const finaleContinue = document.querySelector("#finaleContinue");
const touchControlsEl = document.querySelector("#touchControls");
const touchVerbPrev = document.querySelector("#touchVerbPrev");
const touchVerbNext = document.querySelector("#touchVerbNext");
const touchAction = document.querySelector("#touchAction");
const touchFullscreen = document.querySelector("#touchFullscreen");
const musicToggle = document.querySelector("#musicToggle");
const soundToggle = document.querySelector("#soundToggle");
const speechToggle = document.querySelector("#speechToggle");
const bgmTrack = document.querySelector("#bgmTrack");

const SAVE_KEY = "malvins-zauberpfad-save-v2";
const W = 320;
const H = 180;
const SCALE = 2;
const DISPLAY_W = W * SCALE;
const DISPLAY_H = H * SCALE;
const verbs = ["walk", "look", "talk", "take", "use"];
const verbLabels = {
  walk: "Gehen",
  look: "Ansehen",
  talk: "Reden",
  take: "Nehmen",
  use: "Benutzen",
};

const interactionMeta = {
  exit: { color: "#e6b341", fill: "rgba(230,179,65,0.14)", marker: "exit_arrow", cursor: "exit" },
  item: { color: "#4cdac9", fill: "rgba(76,218,201,0.16)", marker: "item_spark", cursor: "item" },
  talk: { color: "#f4eedb", fill: "rgba(244,238,219,0.12)", marker: "talk_bubble", cursor: "talk" },
  use: { color: "#af84d6", fill: "rgba(175,132,214,0.14)", marker: "use_rune", cursor: "use" },
  look: { color: "#7ac7ff", fill: "rgba(122,199,255,0.12)", marker: "look_eye", cursor: "look" },
  hotspot: { color: "#e6b341", fill: "rgba(230,179,65,0.12)", marker: "hotspot_pin", cursor: "hotspot" },
};

const AUDIO_LEVELS = {
  trackMusic: 0.32,
  trackMusicWithSpeech: 0.18,
  proceduralMusic: 0.055,
  sfx: 0.24,
  speech: 1.0,
};

const bgmLibrary = {
  clockwork: { title: "Clockwork Farewell", src: "assets/audio/clockwork-farewell.mp3" },
  clockworkAlt: { title: "Clockwork Farewell II", src: "assets/audio/clockwork-farewell-alt.mp3" },
  heraldic: { title: "Heraldic Teacups", src: "assets/audio/heraldic-teacups.mp3" },
  marzipan: { title: "Marzipan Compass", src: "assets/audio/marzipan-compass.mp3" },
  marzipanAlt: { title: "Marzipan Compass II", src: "assets/audio/marzipan-compass-alt.mp3" },
};

const sceneMusic = {
  forest: "clockwork",
  tavern: "heraldic",
  tower: "clockworkAlt",
  glade: "marzipan",
  garden: "marzipan",
  market: "heraldic",
  cellar: "marzipanAlt",
  observatory: "clockworkAlt",
  archive: "clockworkAlt",
};

const sceneShortLabels = {
  forest: "Wald",
  tavern: "Taverne",
  tower: "Turm",
  glade: "Pilzhain",
  garden: "Garten",
  market: "Markt",
  cellar: "Keller",
  observatory: "Observatorium",
  archive: "Archiv",
};

const mapLocations = [
  { scene: "forest", label: "Waldlichtung", hint: "Kreuzung", at: [154, 145, "front"] },
  { scene: "tavern", label: "Taverne", hint: "Wirt und Mondtrank", at: [238, 145, "front"] },
  { scene: "tower", label: "Turmbibliothek", hint: "Buch und Siegel", at: [166, 145, "front"] },
  { scene: "glade", label: "Pilzhain", hint: "Mondteich", at: [56, 146, "right"] },
  { scene: "garden", label: "Zaubergarten", hint: "Kraeuter", at: [165, 150, "front"] },
  { scene: "market", label: "Marktgasse", hint: "Tauschhandel", at: [80, 150, "right"] },
  { scene: "cellar", label: "Alchemiekeller", hint: "Silberschloss", at: [148, 151, "front"] },
  { scene: "observatory", label: "Observatorium", hint: "Fernrohr", at: [100, 150, "front"] },
  { scene: "archive", label: "Mondarchiv", hint: "Sternenmechanik", at: [158, 150, "front"] },
];

const secretLocations = [
  { id: "forest", scene: "forest", label: "Sternsplitter im Moos", rect: [216, 138, 22, 18], stand: [205, 144], x: 226, y: 138, clue: "Zwischen Moos und Wurzeln steckt ein Sternsplitter. Er funkelt so schuldbewusst, dass Malvin ihn einsteckt." },
  { id: "tavern", scene: "tavern", label: "Sternsplitter im Krug", rect: [106, 104, 30, 24], stand: [139, 150], x: 121, y: 105, clue: "Unter einem klebrigen Krug liegt ein Sternsplitter. Der Krug behauptet, das sei Pfand." },
  { id: "tower", scene: "tower", label: "Sternsplitter im Regal", rect: [35, 39, 34, 44], stand: [112, 146], x: 53, y: 58, clue: "Ein Sternsplitter steckt als Lesezeichen in einem Buch ueber schlechte Entscheidungen. Passend." },
  { id: "glade", scene: "glade", label: "Sternsplitter im Pilzlicht", rect: [64, 112, 34, 30], stand: [94, 160], x: 79, y: 119, clue: "Der Pilz gibt einen Sternsplitter frei und tut danach, als waere nichts gewesen. Klassisches Pilzverhalten." },
  { id: "garden", scene: "garden", label: "Sternsplitter am Brunnen", rect: [239, 75, 30, 28], stand: [220, 149], x: 255, y: 80, clue: "Im Brunnenrand sitzt ein Sternsplitter. Das Wasser murmelt neidisch, aber rhythmisch." },
  { id: "market", scene: "market", label: "Sternsplitter in der Kiste", rect: [119, 115, 29, 24], stand: [150, 151], x: 134, y: 117, clue: "In der Kiste liegt ein Sternsplitter zwischen Rechnungen und einem sehr beleidigten Lappen." },
  { id: "cellar", scene: "cellar", label: "Sternsplitter am Kessel", rect: [190, 98, 32, 33], stand: [178, 151], x: 205, y: 106, clue: "Am Kesselrand klebt ein Sternsplitter. Er riecht nach Zauber und einer Suppe, die Fragen stellt." },
  { id: "observatory", scene: "observatory", label: "Sternsplitter auf der Karte", rect: [146, 116, 36, 27], stand: [166, 151], x: 164, y: 119, clue: "Auf der Sternenkarte liegt ein Splitter exakt dort, wo der Himmel 'bitte nicht anfassen' sagt." },
  { id: "archive", scene: "archive", label: "Sternsplitter im Archiv", rect: [30, 139, 24, 22], stand: [72, 150], x: 42, y: 142, clue: "Zwischen kaltem Mondstein und viel zu ehrgeizigem Staub steckt ein Sternsplitter. Er tut so, als sei er ein Fussnoten-Stern." },
];

const images = {
  backgrounds: {},
  atlas: null,
};

const itemInfo = {
  wand: { label: "Zauberstab", icon: "wand" },
  coin: { label: "Goldmuenze", icon: "coin" },
  potion: { label: "Mondtrank", icon: "potion" },
  spellbook: { label: "Zauberbuch", icon: "spellbook" },
  rune_stone: { label: "Runenstein", icon: "rune_stone" },
  herb_bundle: { label: "Kraeuterbund", icon: "herb_bundle" },
  star_lens: { label: "Sternenlinse", icon: "star_lens" },
  silver_key: { label: "Silberschluessel", icon: "silver_key" },
  moon_badge: { label: "Mondabzeichen", icon: "moon_badge" },
  moon_pearl: { label: "Mondperle", icon: "moon_pearl" },
};

const journalSteps = [
  { flag: "wandTaken", text: "Zauberstab aus der Waldlichtung sichern." },
  { flag: "coinGiven", text: "Beim Wirt eine Goldmuenze organisieren." },
  { flag: "spellbookTaken", text: "Das Zauberbuch in der Turmbibliothek ausloesen." },
  { flag: "herbsTaken", text: "Kraeuter im Zaubergarten pfluecken." },
  { flag: "marketKeyGiven", text: "Kraeuter gegen den Silberschluessel tauschen." },
  { flag: "lensTaken", text: "Die Sternenlinse aus dem Kellerschrank holen." },
  { flag: "observatorySolved", text: "Im Observatorium das Mondabzeichen finden." },
  { flag: "runeTaken", text: "Den Runenstein im Pilzhain bergen." },
  { flag: "sealOpened", text: "Runenstein und Mondabzeichen am Turmsiegel einsetzen." },
  { flag: "archiveSolved", text: "Im Mondarchiv die Sternenmechanik beruhigen." },
];

const achievementDefs = [
  { flag: "achievementFirstFind", label: "Erster Fund", test: () => state.inventory.length > 0 || state.flags.wandTaken },
  { flag: "achievementHalfPath", label: "Halber Pfad", test: () => journalSteps.filter((entry) => state.flags[entry.flag]).length >= 5 },
  { flag: "achievementFirstSecret", label: "Sternenblick", test: () => secretCount() > 0 },
  { flag: "achievementArchive", label: "Archivruh", test: () => state.flags.archiveSolved },
  { flag: "achievementStarMaster", label: "Sternenmeister", test: () => state.flags.finalReward },
];

const state = {
  scene: "forest",
  verb: "walk",
  selectedItem: null,
  inventory: [],
  flags: {
    wandTaken: false,
    coinGiven: false,
    potionTaken: false,
    spellbookTaken: false,
    runeRevealed: false,
    runeTaken: false,
    sealOpened: false,
    herbsTaken: false,
    marketKeyGiven: false,
    lensTaken: false,
    observatorySolved: false,
    archivePearlTaken: false,
    archiveSolved: false,
    finalReward: false,
    finaleSeen: false,
    achievementFirstFind: false,
    achievementHalfPath: false,
    achievementFirstSecret: false,
    achievementArchive: false,
    achievementStarMaster: false,
    secretForestTaken: false,
    secretTavernTaken: false,
    secretTowerTaken: false,
    secretGladeTaken: false,
    secretGardenTaken: false,
    secretMarketTaken: false,
    secretCellarTaken: false,
    secretObservatoryTaken: false,
    secretArchiveTaken: false,
    secretReward: false,
  },
  discovered: {
    forest: true,
    tavern: false,
    tower: false,
    glade: false,
    garden: false,
    market: false,
    cellar: false,
    observatory: false,
    archive: false,
  },
  actor: {
    x: 154,
    y: 145,
    targetX: 154,
    targetY: 145,
    dir: "front",
    speed: 58,
    pose: "idle",
    poseUntil: 0,
    path: [],
    onArrive: null,
  },
  dialogUntil: 0,
  dialogSpeechToken: 0,
  effectUntil: 0,
  effectAt: null,
  hover: null,
  pathProbe: null,
  pathBlockedUntil: 0,
  sceneFadeUntil: 0,
  showHotspots: false,
  showPathTrace: false,
  showCompass: true,
  music: true,
  sound: true,
  speech: "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
  userActivated: false,
  lastDialogText: "",
  lastDialogSpeaker: "neutral",
};

const speechState = {
  voices: [],
  token: 0,
  pauseTimer: null,
};

let toastTimer = null;

const voiceProfiles = {
  neutral: { rate: 0.92, pitch: 1.06, pause: 95, voiceSlot: 0 },
  talk: { rate: 0.96, pitch: 1.12, pause: 105, voiceSlot: 1 },
  worried: { rate: 0.99, pitch: 1.18, pause: 90, voiceSlot: 2 },
  spell: { rate: 0.88, pitch: 1.2, pause: 135, voiceSlot: 3 },
  keeper: { rate: 0.86, pitch: 0.82, pause: 130, voiceSlot: 4, prefer: "low" },
  herbalist: { rate: 0.96, pitch: 1.2, pause: 105, voiceSlot: 1, prefer: "bright" },
  merchant: { rate: 1.02, pitch: 1.08, pause: 85, voiceSlot: 2, prefer: "bright" },
  alchemist: { rate: 0.88, pitch: 0.94, pause: 145, voiceSlot: 5, prefer: "low" },
  astronomer: { rate: 0.83, pitch: 0.78, pause: 165, voiceSlot: 6, prefer: "low" },
  statue: { rate: 0.74, pitch: 0.68, pause: 210, voiceSlot: 7, prefer: "low" },
};

const musicPatterns = {
  forest: {
    tempo: 0.38,
    scale: [392, 440, 493.88, 587.33, 659.25, 587.33, 493.88, 440],
    bass: [196, 196, 246.94, 220],
    wave: "triangle",
  },
  tavern: {
    tempo: 0.34,
    scale: [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 329.63],
    bass: [130.81, 196, 174.61, 196],
    wave: "square",
  },
  tower: {
    tempo: 0.44,
    scale: [329.63, 392, 466.16, 523.25, 622.25, 523.25, 466.16, 392],
    bass: [164.81, 164.81, 233.08, 196],
    wave: "sine",
  },
  glade: {
    tempo: 0.42,
    scale: [349.23, 415.3, 523.25, 622.25, 698.46, 622.25, 523.25, 415.3],
    bass: [174.61, 207.65, 261.63, 207.65],
    wave: "triangle",
  },
  garden: {
    tempo: 0.39,
    scale: [329.63, 392, 440, 493.88, 587.33, 493.88, 440, 392],
    bass: [164.81, 196, 220, 196],
    wave: "triangle",
  },
  market: {
    tempo: 0.31,
    scale: [293.66, 349.23, 440, 523.25, 440, 392, 349.23, 329.63],
    bass: [146.83, 220, 196, 220],
    wave: "square",
  },
  cellar: {
    tempo: 0.46,
    scale: [220, 261.63, 311.13, 349.23, 415.3, 349.23, 311.13, 261.63],
    bass: [110, 130.81, 155.56, 130.81],
    wave: "sine",
  },
  observatory: {
    tempo: 0.48,
    scale: [392, 466.16, 554.37, 659.25, 783.99, 659.25, 554.37, 466.16],
    bass: [196, 233.08, 277.18, 233.08],
    wave: "sine",
  },
};

let audioCtx = null;
let touchMoveTimer = null;
let suppressNextClickUntil = 0;
const audioState = {
  musicTimer: null,
  musicStep: 0,
  musicGain: null,
  sfxGain: null,
  usingTrack: false,
  speaking: false,
  currentTrack: null,
};

const scenes = {
  forest: {
    name: "Waldlichtung",
    bg: "forest-clearing",
    start: { x: 154, y: 145, dir: "front" },
    depth: { yFar: 116, yNear: 164, farScale: 0.72, nearScale: 1.16 },
    walk: {
      yMin: 104,
      yMax: 166,
      polygons: [
        [[82, 162], [111, 145], [132, 126], [150, 113], [178, 113], [202, 126], [239, 162]],
        [[0, 143], [33, 135], [75, 133], [111, 145], [82, 162], [0, 166]],
        [[201, 126], [260, 111], [320, 119], [320, 163], [239, 162]],
        [[111, 104], [177, 104], [187, 123], [132, 126]],
      ],
    },
    nav: {
      forcePath: true,
      connectRadius: 54,
      points: [
        { id: "leftExit", x: 42, y: 144 },
        { id: "leftBend", x: 82, y: 145 },
        { id: "stump", x: 85, y: 145 },
        { id: "crossroad", x: 118, y: 145 },
        { id: "center", x: 151, y: 142 },
        { id: "tower", x: 169, y: 143 },
        { id: "rightBend", x: 205, y: 144 },
        { id: "tavernBend", x: 238, y: 143 },
        { id: "tavern", x: 282, y: 139 },
      ],
      edges: [
        ["leftExit", "leftBend"],
        ["leftBend", "stump"],
        ["stump", "crossroad"],
        ["leftBend", "crossroad"],
        ["crossroad", "center"],
        ["center", "tower"],
        ["center", "rightBend"],
        ["rightBend", "tavernBend"],
        ["tavernBend", "tavern"],
      ],
    },
    foreground: [
      { id: "stumpLayer", label: "Baumstumpf", rect: [32, 106, 64, 55], depthY: 146 },
      { id: "signLayer", label: "Wegweiser", rect: [112, 93, 58, 42], depthY: 136 },
    ],
    exits: [
      { id: "toTower", label: "Pfad zum Turm", rect: [135, 118, 72, 42], stand: [169, 143], to: "tower", at: [166, 145, "front"] },
      { id: "toTavern", label: "Tavernenschild", rect: [258, 96, 62, 70], stand: [282, 139], to: "tavern", at: [238, 145, "front"] },
      { id: "toGlade", label: "Dunkler Waldweg", rect: [0, 104, 58, 70], stand: [42, 144], to: "glade", at: [56, 146, "right"] },
      { id: "toGarden", label: "Sonnenpfad", rect: [105, 86, 70, 43], stand: [151, 142], to: "garden", at: [165, 150, "front"] },
    ],
    hotspots: [
      {
        id: "sign",
        label: "Wegweiser",
        rect: [252, 101, 38, 32],
        stand: [248, 143],
        look: "Auf dem Schild steht: Taverne rechts, Turm geradeaus, Pilze links. Darunter: Bei Beschwerden bitte an den naechstbesten Baum wenden.",
        talk: "Der Wegweiser sagt nichts. Das macht ihn bereits zum hoeflichsten Beamten des Waldes.",
      },
      {
        id: "stump",
        label: "alter Stumpf",
        rect: [38, 120, 39, 22],
        stand: [85, 145],
        look: "Auf dem Stumpf liegt ein krummer Zauberstab. Er sieht aus, als waere er in einer Schublade mit schlechter Laune gewachsen.",
        take: () => takeItem("wand", "Der Stab summt. Malvin beschliesst, das als Zustimmung zu werten, bevor der Stab einen Anwalt verlangt."),
        active: () => !state.flags.wandTaken,
      },
    ],
    worldItems: [
      { item: "wand", x: 59, y: 116, front: true, active: () => !state.flags.wandTaken },
    ],
  },
  tavern: {
    name: "Taverne Zur Schrillen Kroete",
    bg: "tavern",
    exits: [
      { id: "toForest", label: "Tavernentuer", rect: [222, 107, 40, 50], stand: [235, 147], to: "forest", at: [282, 139, "left"] },
      { id: "toMarket", label: "Marktgasse", rect: [260, 102, 60, 58], stand: [252, 148], to: "market", at: [170, 151, "front"] },
    ],
    npcs: [
      { id: "keeperNpc", sprite: "keeper_idle", x: 225, y: 102 },
    ],
    hotspots: [
      {
        id: "keeper",
        label: "Wirt",
        rect: [184, 70, 98, 38],
        stand: [203, 145],
        look: "Der Wirt poliert einen Becher, als koenne er darin die Zukunft sehen. Die Zukunft riecht nach Suppe und schlechten Trinkgeldern.",
        talk: () => {
          if (!state.flags.coinGiven) {
            addInventory("coin");
            state.flags.coinGiven = true;
            setPose("talk", 900);
            showDialog("Wirt: Ein Zauberlehrling ohne Muenze? Nimm diese. Aber falls sie flucht, war sie schon so.", "keeper", 4400);
            sfx("talk");
            refreshUi();
            saveGame("Fortschritt gespeichert.");
            return;
          }
          showDialog("Wirt: Der Turm fluestert nachts. Ich fluestere zurueck, aber nur, weil ich schlecht Nein sagen kann.", "keeper");
        },
      },
      {
        id: "hearth",
        label: "Kamin",
        rect: [28, 49, 69, 56],
        stand: [94, 146],
        look: "Das Feuer riecht nach Fichtenholz, Mut und einem Suppenexperiment, das vermutlich einen eigenen Namen hat.",
      },
      {
        id: "table",
        label: "Tavernentisch",
        rect: [104, 108, 81, 48],
        stand: [139, 150],
        look: "Ein kleiner Mondtrank steht auf dem Tisch. Er tut so, als gehoere er hierher. Respektabel, aber nicht ueberzeugend.",
        take: () => takeItem("potion", "Malvin steckt den Mondtrank ein. Er gluckert mit der Zuversicht eines Getraenks ohne Fluchtplan."),
        active: () => !state.flags.potionTaken,
      },
    ],
    worldItems: [
      { item: "potion", x: 139, y: 113, active: () => !state.flags.potionTaken },
    ],
  },
  tower: {
    name: "Turmbibliothek",
    bg: "tower-library",
    exits: [
      { id: "toForest", label: "Steintreppe", rect: [0, 132, 58, 48], stand: [42, 148], to: "forest", at: [169, 143, "front"] },
      { id: "toCellar", label: "Kellertreppe", rect: [105, 132, 44, 31], stand: [121, 150], to: "cellar", at: [148, 151, "front"] },
      { id: "toObservatory", label: "Observatorium", rect: [132, 13, 56, 59], stand: [158, 143], to: "observatory", at: [100, 150, "front"] },
      { id: "toArchive", label: "Mondarchiv", rect: [218, 96, 58, 58], stand: [229, 150], to: "archive", at: [158, 150, "front"], active: () => state.flags.sealOpened },
    ],
    hotspots: [
      {
        id: "books",
        label: "Buecherwand",
        rect: [23, 28, 84, 94],
        stand: [112, 146],
        look: "Die Buecher sind nach Gefaehrlichkeit sortiert. Ganz oben: Backrezepte. Offenbar hatte jemand einmal einen sehr entschlossenen Pudding.",
      },
      {
        id: "window",
        label: "Mondfenster",
        rect: [134, 15, 51, 56],
        stand: [158, 143],
        look: "Der Mond steht exakt ueber dem Pilzhain. Praktisch, wenn auch so theatralisch, dass selbst die Vorhaenge genervt waeren.",
      },
      {
        id: "desk",
        label: "Zauberbuch",
        rect: [135, 97, 64, 47],
        stand: [168, 150],
        look: () => state.flags.spellbookTaken
          ? "Auf dem Pult liegt nur noch ein Abdruck in Buchform."
          : "Das Buch ist mit einer Klammer verschlossen, die sehr nach Goldmuenze aussieht. Bildung war schon immer ein Bezahlmodell.",
        take: () => {
          if (!hasItem("coin")) {
            sfx("error");
            showDialog("Die Buchklammer schnappt zu. Sie akzeptiert offenbar nur Muenzen. Gute Absichten haben hier keinen Wechselkurs.", "worried");
            return;
          }
          removeInventory("coin");
          takeItem("spellbook", "Die Klammer verschluckt die Muenze. Das Buch klappt auf, wie ein Gelehrter, der gerade Trinkgeld bekommen hat.");
        },
        active: () => !state.flags.spellbookTaken,
      },
      {
        id: "pedestal",
        label: "Turmsiegel",
        rect: [218, 121, 46, 27],
        stand: [229, 150],
        look: () => state.flags.sealOpened
          ? "Das Siegel leuchtet freundlich. Fuer ein Siegel ist das fast schon unanstaendig sympathisch."
          : "Ein kalter Runenkreis wartet auf den passenden Stein. Oder auf Applaus. Schwer zu sagen bei Runen.",
        use: (item) => {
          if (state.flags.sealOpened) {
            sfx("spell");
            showDialog("Das Siegel ist offen. Dahinter wartet ein Mondarchiv, das definitiv zu lange allein mit seinen Sternen war.", "spell", 5200);
            return;
          }
          if (item !== "rune_stone") {
            sfx("error");
            showDialog("Das Siegel reagiert nur auf echte Runenlaune. Dieser Gegenstand hat eher Brotdosenenergie.", "neutral");
            return;
          }
          if (!hasItem("moon_badge")) {
            sfx("error");
            showDialog("Der Runenstein passt, aber das Siegel will noch ein Mondabzeichen. Magie ist im Grunde Verwaltung mit Funken.", "worried", 5400);
            return;
          }
          state.flags.sealOpened = true;
          removeInventory("rune_stone");
          removeInventory("moon_badge");
          state.effectUntil = performance.now() + 3000;
          state.effectAt = null;
          setPose("cast", 1400);
          showDialog("Der Turm atmet auf. Malvin hat das Siegel geweckt und darf sich heute fast Magier nennen. Fast ist ein wichtiges Wort. Pruefer lieben wichtige Woerter.", "spell", 7000);
          sfx("success");
          refreshUi();
          saveGame("Pruefung gespeichert.");
        },
      },
    ],
    worldItems: [
      { item: "spellbook", x: 168, y: 105, active: () => !state.flags.spellbookTaken },
    ],
  },
  glade: {
    name: "Pilzhain",
    bg: "mushroom-glade",
    walk: {
      yMin: 132,
      yMax: 166,
      polygons: [
        [[0, 138], [70, 132], [104, 142], [112, 157], [94, 166], [0, 166]],
        [[92, 157], [238, 157], [262, 166], [82, 166]],
        [[219, 148], [320, 130], [320, 166], [238, 166]],
      ],
    },
    exits: [
      { id: "toForest", label: "Rueckweg", rect: [0, 120, 58, 60], stand: [48, 160], to: "forest", at: [42, 144, "right"] },
      { id: "toGarden", label: "Blumenpfad", rect: [245, 112, 75, 58], stand: [260, 160], to: "garden", at: [150, 150, "left"] },
    ],
    hotspots: [
      {
        id: "pond",
        label: "Mondteich",
        rect: [112, 128, 91, 28],
        stand: [152, 160],
        look: () => state.flags.runeRevealed
          ? "Im Mondteich glitzert noch immer Zauberstaub. Der Teich tut so, als waere das Absicht gewesen."
          : "Unter der Wasseroberflaeche funkelt etwas. Der Teich sieht aus wie jemand, der ein Geheimnis und zu viel Selbstachtung hat.",
        use: (item) => {
          if (state.flags.runeRevealed) {
            sfx("error");
            showDialog("Der Teich hat seinen grossen Auftritt schon gehabt. Mehr Drama und er verlangt eine Garderobe.", "neutral");
            return;
          }
          if ((item === "wand" && hasItem("spellbook")) || (item === "spellbook" && hasItem("wand"))) {
            state.flags.runeRevealed = true;
            state.effectUntil = performance.now() + 2500;
            state.effectAt = null;
            setPose("cast", 1200);
            showDialog("Ein Spruch, ein Spritzer, ein beleidigter Frosch: Der Runenstein steigt aus dem Wasser, als haette ihn jemand beim Baden erwischt.", "spell", 5600);
            sfx("spell");
            refreshUi();
            saveGame("Fortschritt gespeichert.");
            return;
          }
          sfx("error");
          showDialog("Der Teich blubbert: Ein Stab allein ist nett. Mit Buch wirkt es weniger wie Herumfuchteln mit Holz.", "worried");
        },
      },
      {
        id: "rune",
        label: "Runenstein",
        rect: [198, 119, 29, 28],
        stand: [203, 160],
        look: "Der Stein hat eine Rune, die aussieht wie ein X mit Schlafmangel und einem kleinen Autoritaetsproblem.",
        take: () => takeItem("rune_stone", "Der Runenstein ist warm, schwer und erstaunlich ueberzeugt von sich selbst. Also praktisch ein sehr kleiner Adeliger."),
        active: () => state.flags.runeRevealed && !state.flags.runeTaken,
      },
      {
        id: "mushrooms",
        label: "Riesenpilze",
        rect: [52, 111, 239, 52],
        stand: [94, 160],
        look: "Die Pilze summen leise. Einer klingt wie ein schlecht gestimmtes Cembalo, ein anderer wie ein beleidigter Kessel.",
      },
    ],
    worldItems: [
      { item: "rune_stone", x: 212, y: 126, active: () => state.flags.runeRevealed && !state.flags.runeTaken },
    ],
  },
  garden: {
    name: "Zaubergarten",
    bg: "wizard-garden",
    exits: [
      { id: "toForest", label: "Waldpfad", rect: [112, 69, 76, 66], stand: [158, 150], to: "forest", at: [151, 142, "front"] },
      { id: "toMarket", label: "Stadtbogen", rect: [188, 73, 50, 49], stand: [202, 148], to: "market", at: [80, 150, "right"] },
      { id: "toGlade", label: "Blumenpfad", rect: [0, 116, 50, 56], stand: [52, 151], to: "glade", at: [260, 160, "left"] },
    ],
    npcs: [
      { id: "herbalistNpc", sprite: "herbalist_idle", x: 62, y: 150 },
      { id: "statueNpc", sprite: "statue_idle", x: 282, y: 151 },
    ],
    hotspots: [
      {
        id: "herbalist",
        label: "Gaertnerin",
        rect: [43, 88, 42, 67],
        stand: [98, 151],
        look: "Die Gaertnerin traegt mehr Taschen als ein Zauberbuch Fussnoten hat. In einer davon raschelt vermutlich eine Ausrede.",
        talk: () => {
          if (!state.flags.herbsTaken) {
            showDialog("Gaertnerin: Nimm dir ruhig Kraeuter. Aber nur die, die nicht zurueckwinken. Die anderen sind Gewerkschaft.", "herbalist");
            sfx("talk");
            return;
          }
          showDialog("Gaertnerin: In der Marktgasse zahlt man fuer Kraeuter. Nicht gut, aber mit genuegend Gesichtsausdruck.", "herbalist");
          sfx("talk");
        },
      },
      {
        id: "herbBed",
        label: "Kraeuterbeet",
        rect: [206, 119, 63, 30],
        stand: [200, 151],
        look: () => state.flags.herbsTaken
          ? "Das Beet sieht erleichtert aus. Pflanzen moegen es, wenn Drama den Besitzer wechselt."
          : "Ein Kraeuterbund duftet nach Minze, Sternstaub und leichter Ueberheblichkeit.",
        take: () => takeItem("herb_bundle", "Malvin bindet ein Kraeuterbund. Es riecht so gesund, dass es beinahe unhoeflich ist."),
        active: () => !state.flags.herbsTaken,
      },
      {
        id: "fountain",
        label: "Gartenbrunnen",
        rect: [225, 73, 57, 49],
        stand: [220, 149],
        look: "Das Wasser murmelt Reime, aber nur halbe. Ein Brunnen mit Stil und sehr begrenztem Lektorat.",
      },
      {
        id: "gardenStatue",
        label: "sprechende Statue",
        rect: [262, 82, 44, 73],
        stand: [238, 151],
        look: "Die Statue ist klein, grau und sieht aus, als haette sie seit hundert Jahren eine Meinung und keine Gelegenheit, sie kurz zu halten.",
        talk: () => {
          showDialog("Statue: Ich bin nicht klein. Ich bin platzsparend monumental. Das ist Architektur, kein Problem.", "statue", 5000);
          sfx("talk");
        },
      },
    ],
    worldItems: [
      { item: "herb_bundle", x: 239, y: 119, active: () => !state.flags.herbsTaken },
    ],
  },
  market: {
    name: "Marktgasse",
    bg: "market-street",
    exits: [
      { id: "toGarden", label: "Stadtbogen", rect: [0, 98, 54, 70], stand: [48, 150], to: "garden", at: [202, 148, "left"] },
      { id: "toTavern", label: "Tavernenschild", rect: [247, 92, 73, 70], stand: [246, 151], to: "tavern", at: [252, 148, "left"] },
    ],
    npcs: [
      { id: "merchantNpc", sprite: "merchant_idle", x: 74, y: 151 },
    ],
    hotspots: [
      {
        id: "merchant",
        label: "Haendlerin",
        rect: [50, 84, 49, 73],
        stand: [112, 151],
        look: "Die Haendlerin laechelt, als kenne sie bereits den Preis deiner Frage und die Rueckgabebedingungen deiner Seele.",
        talk: () => {
          if (!hasItem("herb_bundle") && !state.flags.marketKeyGiven) {
            showDialog("Haendlerin: Bring mir Gartenkraeuter, und ich tausche gegen etwas Silbernes. Nein, nicht meinen Charme. Der ist geleast.", "merchant", 5200);
            sfx("talk");
            return;
          }
          if (!state.flags.marketKeyGiven) {
            removeInventory("herb_bundle");
            addInventory("silver_key");
            state.flags.marketKeyGiven = true;
            showDialog("Haendlerin: Ein fairer Tausch. Der Silberschluessel oeffnet gern Dinge, die wichtig aussehen. Er ist da sehr oberflaechlich.", "merchant", 5600);
            sfx("pickup");
            refreshUi();
            saveGame("Fortschritt gespeichert.");
            return;
          }
          showDialog("Haendlerin: Der Keller unter dem Turm hat passende Schloesser. Und vermutlich passende schlechte Entscheidungen.", "merchant");
          sfx("talk");
        },
      },
      {
        id: "potionStall",
        label: "Trankstand",
        rect: [0, 50, 98, 70],
        stand: [95, 150],
        look: "Flaschen in allen Farben. Mindestens drei haben schlechte Laune, eine hat ein Start-up.",
      },
      {
        id: "crates",
        label: "Kistenstapel",
        rect: [95, 114, 62, 36],
        stand: [150, 151],
        look: "Auf einer Kiste steht: Zerbrechlich, magisch, nicht schuetteln. Also exakt die Sorte Kiste, die schuetteln sagt, ohne schuetteln zu sagen.",
      },
    ],
    worldItems: [],
  },
  cellar: {
    name: "Alchemiekeller",
    bg: "alchemy-cellar",
    exits: [
      { id: "toTower", label: "Treppe zur Bibliothek", rect: [0, 126, 62, 52], stand: [51, 151], to: "tower", at: [121, 150, "front"] },
    ],
    npcs: [
      { id: "alchemistNpc", sprite: "alchemist_idle", x: 116, y: 151 },
    ],
    hotspots: [
      {
        id: "alchemist",
        label: "Alchemist",
        rect: [92, 82, 52, 73],
        stand: [153, 151],
        look: "Der Alchemist riecht nach Kerzen, Glas und der Art von Experiment, bei dem man erst klopft und dann rennt.",
        talk: () => {
          showDialog("Alchemist: Wenn du eine Sternenlinse findest, bring sie nach oben. Der Himmel wartet ungern, und ich habe ihm noch Geld geschuldet.", "alchemist", 5200);
          sfx("talk");
        },
      },
      {
        id: "cabinet",
        label: "verschlossener Schrank",
        rect: [235, 51, 61, 77],
        stand: [229, 151],
        look: () => state.flags.lensTaken
          ? "Der Schrank steht offen und sieht zufrieden gepluendert aus. Manche Moebel finden ihre Berufung spaet."
          : "Ein schwerer Schrank mit einem silbernen Schloss. Er wirkt, als wuerde er bei falscher Behandlung sehr ausfuehrlich knarren.",
        use: (item) => {
          if (item !== "silver_key") {
            sfx("error");
            showDialog("Das Schloss ignoriert alles, was nicht eindeutig silbern und schluesselig ist. Es hat hohe Standards fuer ein Loch.", "worried");
            return;
          }
          removeInventory("silver_key");
          takeItem("star_lens", "Im Schrank liegt eine Sternenlinse. Sie funkelt, als haette sie Theaterunterricht und einen Nebenjob als Kronleuchter.");
        },
        active: () => !state.flags.lensTaken,
      },
      {
        id: "cauldron",
        label: "Kessel",
        rect: [182, 96, 49, 45],
        stand: [178, 151],
        look: "Im Kessel brodelt etwas Gruenes. Es wirkt lernfaehig, was bei Suppe selten ein gutes Zeichen ist.",
      },
    ],
    worldItems: [
      { item: "star_lens", x: 263, y: 74, active: () => false },
    ],
  },
  observatory: {
    name: "Observatorium",
    bg: "observatory",
    exits: [
      { id: "toTower", label: "Rueckweg zur Bibliothek", rect: [0, 128, 54, 51], stand: [48, 151], to: "tower", at: [158, 143, "front"] },
    ],
    npcs: [
      { id: "astronomerNpc", sprite: "astronomer_idle", x: 84, y: 151 },
    ],
    hotspots: [
      {
        id: "astronomer",
        label: "Astronom",
        rect: [60, 84, 50, 72],
        stand: [124, 151],
        look: "Der Astronom hat Augenringe in exakt astronomischer Groesse. Vermutlich kartografiert er sie bei Vollmond.",
        talk: () => {
          if (!state.flags.observatorySolved) {
            showDialog("Astronom: Ohne Sternenlinse sieht das Fernrohr nur Himmel. Mit Linse sieht es Absichten. Beides ist beunruhigend.", "astronomer", 5400);
          } else {
            showDialog("Astronom: Der Mond hat dich bemerkt. Das ist in Pruefungen meistens gut. In Romanzen ist es komplizierter.", "astronomer");
          }
          sfx("talk");
        },
      },
      {
        id: "telescope",
        label: "Fernrohr",
        rect: [70, 47, 86, 62],
        stand: [137, 151],
        look: () => state.flags.observatorySolved
          ? "Das Fernrohr zeigt ein Mondzeichen, das langsam ueber den Himmel wandert. Sehr poetisch fuer ein Rohr."
          : "Ein grosses Fernrohr wartet auf eine fehlende Linse. Es schaut dabei vorwurfsvoller, als ein Fernrohr sollte.",
        use: (item) => {
          if (item !== "star_lens") {
            sfx("error");
            showDialog("Das Fernrohr braucht eine Linse, keine improvisierte Tapferkeit. Tapferkeit vergroessert nur die Peinlichkeit.", "worried");
            return;
          }
          removeInventory("star_lens");
          addInventory("moon_badge");
          state.flags.observatorySolved = true;
          state.effectUntil = performance.now() + 2800;
          state.effectAt = null;
          setPose("cast", 1200);
          showDialog("Die Sternenlinse rastet ein. Ein Mondabzeichen faellt klimpernd auf den Tisch, als haette es den Einsatz verschlafen.", "spell", 5600);
          sfx("success");
          refreshUi();
          saveGame("Fortschritt gespeichert.");
        },
      },
      {
        id: "starTable",
        label: "Sternenkarte",
        rect: [129, 116, 80, 38],
        stand: [166, 151],
        look: "Die Karte zeigt drei Sternbilder: Hut, Stab und sehr spaeter Abgabetermin. Malvin fuehlt sich persoenlich angegriffen.",
      },
    ],
    worldItems: [],
  },
  archive: {
    name: "Mondarchiv",
    bg: "moon-archive",
    start: { x: 158, y: 150, dir: "front" },
    walk: {
      yMin: 114,
      yMax: 168,
      polygons: [
        [[0, 145], [70, 130], [145, 116], [230, 126], [320, 142], [320, 168], [0, 168]],
        [[64, 128], [150, 112], [220, 122], [186, 152], [94, 152]],
      ],
    },
    exits: [
      { id: "toTower", label: "Rueckweg zur Bibliothek", rect: [130, 47, 60, 74], stand: [158, 146], to: "tower", at: [229, 150, "front"] },
    ],
    hotspots: [
      {
        id: "archiveDoor",
        label: "Mondpforte",
        rect: [132, 47, 57, 75],
        stand: [158, 146],
        look: () => state.flags.archiveSolved
          ? "Die Mondpforte summt ruhig. Das ist bei Tueren ungewoehnlich, aber Malvin ist heute grosszuegig mit Definitionen."
          : "Die Pforte haelt ihre Sternenmechanik fest wie ein Buch, das sein Ende nicht verraten will.",
      },
      {
        id: "pearlCasket",
        label: "Perlenkaestchen",
        rect: [54, 107, 55, 30],
        stand: [92, 151],
        look: () => state.flags.archivePearlTaken
          ? "Das Kaestchen ist leer und wirkt erleichtert, als haette es gerade ein sehr rundes Geheimnis losgeworden."
          : "Im Kaestchen liegt eine Mondperle. Sie glimmt so konzentriert, dass sogar der Staub leiser wird.",
        take: () => takeItem("moon_pearl", "Malvin nimmt die Mondperle. Sie ist kuehl, schwer und wahrscheinlich sehr stolz auf ihre Rundheit."),
        active: () => !state.flags.archivePearlTaken,
      },
      {
        id: "starDesk",
        label: "Sternenmechanik",
        rect: [172, 103, 91, 54],
        stand: [190, 151],
        look: () => state.flags.archiveSolved
          ? "Die Sternenmechanik laeuft im Takt. Ausnahmsweise ist das kein Zeichen fuer nahende Pruefungsfragen."
          : "Ein Astrolabium dreht sich ruckelnd ueber einem Pult. In der Mitte fehlt eine runde Fassung.",
        use: (item) => {
          if (state.flags.archiveSolved) {
            sfx("spell");
            showDialog("Die Mechanik ist schon beruhigt. Noch mehr Ordnung waere fast schon unmagisch.", "spell", 3600);
            return;
          }
          if (item !== "moon_pearl") {
            sfx("error");
            showDialog("Die Fassung will etwas Mondrundes. Alles andere fuehlt sich fuer sie offenbar wie Besteck in einer Harfe an.", "worried", 4600);
            return;
          }
          removeInventory("moon_pearl");
          state.flags.archiveSolved = true;
          state.effectUntil = performance.now() + 3200;
          state.effectAt = { x: 218, y: 118 };
          setPose("cast", 1400);
          showDialog("Die Mondperle rastet ein. Das Archiv klappt seine Sternenbahnen zurecht und Malvins Pruefung bekommt ein echtes Nachwort.", "spell", 7000);
          sfx("success");
          maybeUnlockFinalReward();
          maybeUnlockAchievements();
          refreshUi();
          saveGame("Mondarchiv gespeichert.");
        },
      },
      {
        id: "moonMap",
        label: "Himmelskarte",
        rect: [238, 44, 55, 70],
        stand: [228, 151],
        look: "Die Karte zeigt neun Sternsplitter und einen winzigen Pfeil mit der Beschriftung: Hier nicht panisch werden. Hilfreich, aber spaet.",
      },
      {
        id: "crystalShelf",
        label: "Kristallregal",
        rect: [64, 50, 47, 80],
        stand: [92, 151],
        look: "Die Kristalle flackern wie eingefrorene Gedanken. Einige davon wirken klueger als Malvins letzte drei Plaene zusammen.",
      },
    ],
    worldItems: [
      { item: "moon_pearl", x: 83, y: 116, active: () => !state.flags.archivePearlTaken },
    ],
  },
};

const assetList = [
  ...Object.values(scenes).map((scene) => ["backgrounds", scene.bg, `assets/backgrounds/${scene.bg}.png`]),
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

async function loadAssets() {
  await Promise.all(assetList.map(async ([group, key, src]) => {
    images[group][key] = await loadImage(src);
  }));
  images.atlas = await loadImage(window.SPRITE_MAP.image);
  document.querySelectorAll(".verb-icon").forEach((icon) => {
    applySpriteBackground(icon, "cursors", icon.dataset.sprite, 24, 24);
  });
  document.querySelectorAll(".verb").forEach((button) => {
    const label = verbLabels[button.dataset.verb] || button.textContent.trim();
    button.title = label;
    button.setAttribute("aria-label", label);
  });
  refreshHotspotToggle();
  refreshPathToggle();
  updateCanvasCursor();
  refreshAudioToggles();
  initSpeechControls();
}

function spriteEntry(group, key) {
  return window.SPRITE_MAP[group] && window.SPRITE_MAP[group][key];
}

function applySpriteBackground(el, group, key, displayW = null, displayH = null) {
  const entry = spriteEntry(group, key);
  const frameW = entry.frameW || entry.w;
  const frameH = entry.frameH || entry.h;
  const scaleX = (displayW || frameW) / frameW;
  const scaleY = (displayH || frameH) / frameH;
  el.style.width = `${Math.round(frameW * scaleX)}px`;
  el.style.height = `${Math.round(frameH * scaleY)}px`;
  el.style.backgroundImage = `url("${window.SPRITE_MAP.image}")`;
  el.style.backgroundSize = `${window.SPRITE_MAP.size[0] * scaleX}px ${window.SPRITE_MAP.size[1] * scaleY}px`;
  el.style.backgroundPosition = `-${entry.x * scaleX}px -${entry.y * scaleY}px`;
}

function drawSprite(group, key, dx, dy, dw = null, dh = null) {
  const entry = spriteEntry(group, key);
  if (!entry) return;
  const w = entry.frameW || entry.w;
  const h = entry.frameH || entry.h;
  ctx.drawImage(images.atlas, entry.x, entry.y, w, h, dx, dy, dw || w, dh || h);
}

function activeCursorKind() {
  return state.hover && state.hover.spot ? cursorKindForSpot(state.hover.spot) : state.verb;
}

function updateCanvasCursor(kind = activeCursorKind()) {
  const entry = spriteEntry("cursors", kind) || spriteEntry("cursors", state.verb) || spriteEntry("cursors", "walk");
  const [hx, hy] = entry.hotspot || [4, 4];
  const cursorKind = spriteEntry("cursors", kind) ? kind : state.verb;
  canvas.style.cursor = `url("assets/sprites/cursors/${cursorKind}.png") ${hx} ${hy}, pointer`;
}

function speechSupported() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function initSpeechControls() {
  if (!speechSupported()) {
    state.speech = false;
    speechToggle.disabled = true;
    speechToggle.textContent = "Keine Stimme";
    speechToggle.setAttribute("aria-pressed", "false");
    return;
  }

  updateVoiceList();
  window.speechSynthesis.addEventListener("voiceschanged", updateVoiceList);
  refreshSpeechToggle();
}

function updateVoiceList() {
  speechState.voices = window.speechSynthesis.getVoices();
}

function voiceQualityScore(voice, speaker = "neutral") {
  const name = `${voice.name || ""} ${voice.voiceURI || ""}`.toLowerCase();
  const profile = voiceProfiles[speaker] || voiceProfiles.neutral;
  let score = 0;
  if (voice.lang === "de-DE") score += 40;
  else if (voice.lang && voice.lang.startsWith("de")) score += 28;
  if (voice.localService) score += 5;
  ["natural", "neural", "premium", "google", "microsoft", "desktop"].forEach((word) => {
    if (name.includes(word)) score += 7;
  });
  ["katja", "hedda", "anna", "amala", "seraphina"].forEach((word) => {
    if (name.includes(word)) score += profile.prefer === "low" ? 1 : 8;
  });
  ["stefan", "markus", "conrad", "hans", "bernd"].forEach((word) => {
    if (name.includes(word)) score += profile.prefer === "low" ? 9 : 2;
  });
  return score;
}

function pickGermanVoice(speaker = "neutral") {
  if (!speechState.voices.length) updateVoiceList();
  const candidates = speechState.voices.filter((voice) => voice.lang && voice.lang.startsWith("de"));
  const pool = candidates.length ? candidates : speechState.voices;
  const sorted = pool.slice().sort((a, b) => voiceQualityScore(b, speaker) - voiceQualityScore(a, speaker));
  if (!sorted.length) return null;
  const profile = voiceProfiles[speaker] || voiceProfiles.neutral;
  const usableCount = Math.min(sorted.length, 8);
  return sorted[profile.voiceSlot % usableCount] || sorted[0];
}

function normalizeSpeechText(text) {
  return text
    .replaceAll("Muenze", "M\u00fcnze")
    .replaceAll("Muenzen", "M\u00fcnzen")
    .replaceAll("wuerde", "w\u00fcrde")
    .replaceAll("ueberzeugender", "\u00fcberzeugender")
    .replaceAll("Rueckweg", "R\u00fcckweg")
    .replaceAll("grosse", "gro\u00dfe")
    .replaceAll("grossen", "gro\u00dfen")
    .replaceAll("laesst", "l\u00e4sst")
    .replaceAll("spaet", "sp\u00e4t")
    .replaceAll("Magierpruefung", "Magierpr\u00fcfung")
    .replaceAll("Kraeuter", "Kr\u00e4uter")
    .replaceAll("Schluessel", "Schl\u00fcssel")
    .replaceAll("oeffnet", "\u00f6ffnet")
    .replaceAll("oeffne", "\u00f6ffne")
    .replaceAll("fuer", "f\u00fcr")
    .replaceAll("ae", "\u00e4")
    .replaceAll("oe", "\u00f6")
    .replaceAll("ue", "\u00fc")
    .replaceAll("Ae", "\u00c4")
    .replaceAll("Oe", "\u00d6")
    .replaceAll("Ue", "\u00dc")
    .replace(/^\s*([^:]{2,24}):\s*/, "$1 sagt: ");
}

function splitSpeechText(text) {
  return normalizeSpeechText(text)
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function refreshSpeechToggle() {
  speechToggle.disabled = !speechSupported();
  speechToggle.setAttribute("aria-pressed", String(state.speech));
  speechToggle.textContent = state.speech ? "Vorlesen" : "Still";
}

function markUserActivated() {
  state.userActivated = true;
  startBgm();
}

function speakDialog(text, speaker = "neutral") {
  if (!state.speech || !state.userActivated || !speechSupported()) return 0;
  stopSpeech();
  const chunks = splitSpeechText(text);
  if (!chunks.length) return 0;
  const token = ++speechState.token;
  audioState.speaking = true;
  updateTrackVolume();
  speakSpeechChunk(chunks, speaker, 0, token);
  return token;
}

function speakSpeechChunk(chunks, speaker, index, token) {
  if (token !== speechState.token || !chunks[index]) return;
  const profile = voiceProfiles[speaker] || voiceProfiles.neutral;
  const chunk = chunks[index];
  const utterance = new SpeechSynthesisUtterance(chunk);
  utterance.lang = "de-DE";
  const emphasis = /[!?]/.test(chunk) ? 0.045 : 0;
  const longLinePenalty = chunk.length > 92 ? 0.035 : 0;
  const rateLift = index % 2 === 0 ? -0.005 : 0.025;
  const pitchLift = (index % 3 === 1 ? 0.035 : 0) + emphasis;
  utterance.rate = clamp(profile.rate + rateLift - longLinePenalty, 0.72, 1.12);
  utterance.pitch = clamp(profile.pitch + pitchLift, 0.62, 1.42);
  utterance.volume = clamp(AUDIO_LEVELS.speech, 0, 1);
  utterance.onstart = () => {
    audioState.speaking = true;
    updateTrackVolume();
  };
  utterance.onend = () => {
    if (token !== speechState.token) return;
    if (index + 1 < chunks.length) {
      speechState.pauseTimer = window.setTimeout(() => {
        speakSpeechChunk(chunks, speaker, index + 1, token);
      }, profile.pause);
      return;
    }
    audioState.speaking = false;
    if (state.dialogSpeechToken === token) {
      state.dialogSpeechToken = 0;
      state.dialogUntil = Math.max(state.dialogUntil, performance.now() + 850);
    }
    updateTrackVolume();
  };
  utterance.onerror = () => {
    if (token !== speechState.token) return;
    audioState.speaking = false;
    if (state.dialogSpeechToken === token) {
      state.dialogSpeechToken = 0;
    }
    updateTrackVolume();
  };
  const voice = pickGermanVoice(speaker);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
  speechState.token += 1;
  state.dialogSpeechToken = 0;
  if (speechState.pauseTimer) {
    window.clearTimeout(speechState.pauseTimer);
    speechState.pauseTimer = null;
  }
  if (speechSupported()) {
    window.speechSynthesis.cancel();
  }
  audioState.speaking = false;
  updateTrackVolume();
}

function setVerb(verb) {
  state.verb = verb;
  if (verb !== "use") {
    state.selectedItem = null;
  }
  document.querySelectorAll(".verb").forEach((button) => {
    button.classList.toggle("active", button.dataset.verb === verb);
  });
  refreshInventory();
  refreshContextUi();
  updateCanvasCursor();
  refreshTouchControls();
}

function hasItem(item) {
  return state.inventory.includes(item);
}

function addInventory(item) {
  if (!hasItem(item)) {
    state.inventory.push(item);
  }
  if (item === "wand") state.flags.wandTaken = true;
  if (item === "potion") state.flags.potionTaken = true;
  if (item === "spellbook") state.flags.spellbookTaken = true;
  if (item === "rune_stone") state.flags.runeTaken = true;
  if (item === "herb_bundle") state.flags.herbsTaken = true;
  if (item === "star_lens") state.flags.lensTaken = true;
  if (item === "moon_pearl") state.flags.archivePearlTaken = true;
}

function secretFlag(secretOrId) {
  const raw = typeof secretOrId === "string" ? secretOrId : secretOrId.id;
  return `secret${raw.charAt(0).toUpperCase()}${raw.slice(1)}Taken`;
}

function secretCount() {
  return secretLocations.filter((secret) => state.flags[secretFlag(secret)]).length;
}

function secretForScene(sceneId) {
  return secretLocations.find((secret) => secret.scene === sceneId && !state.flags[secretFlag(secret)]);
}

function secretByScene(sceneId) {
  return secretLocations.find((secret) => secret.scene === sceneId) || null;
}

function mapFocusScene() {
  const step = getNextStep();
  if (!step.done) return step.scene;
  if (state.flags.archiveSolved && secretCount() < secretLocations.length) {
    const secret = missingSecretTrace();
    return secret ? secret.scene : null;
  }
  return null;
}

function missingSecretTrace() {
  const current = secretForScene(state.scene);
  if (current) return current;
  return secretLocations.find((secret) => !state.flags[secretFlag(secret)]) || null;
}

function makeSecretHotspot(secret) {
  return {
    id: `secret-${secret.id}`,
    label: secret.label,
    rect: secret.rect,
    stand: secret.stand,
    look: "Ein winziger Sternsplitter flackert am Rand der Szene. Er wartet darauf, fuer optional wichtig gehalten zu werden.",
    take: () => takeSecret(secret),
    secret: true,
  };
}

function takeSecret(secret) {
  const flag = secretFlag(secret);
  if (state.flags[flag]) return;
  state.flags[flag] = true;
  state.effectUntil = performance.now() + 1800;
  state.effectAt = { x: secret.x, y: secret.y };
  setPose("pickup", 700);
  const found = secretCount();
  if (found === secretLocations.length && (!state.flags.secretReward || secret.id === "archive")) {
    state.flags.secretReward = true;
    showDialog(`${secret.clue} Alle Sternsplitter sind gesammelt. Malvins Tagebuch summt zufrieden und fuehlt sich kurz wie ein sehr kleines Planetarium.`, "spell", 7200);
    sfx("success");
  } else {
    showDialog(`${secret.clue} Sternsplitter ${found}/${secretLocations.length} gefunden.`, "spell", 5200);
    sfx("spell");
  }
  maybeUnlockFinalReward();
  maybeUnlockAchievements();
  refreshUi();
  saveGame("Sternsplitter gespeichert.");
}

function completionReady() {
  return state.flags.archiveSolved && secretCount() === secretLocations.length;
}

function maybeUnlockFinalReward({ quiet = false } = {}) {
  if (!completionReady() || state.flags.finalReward) return false;
  state.flags.finalReward = true;
  state.flags.finaleSeen = false;
  state.effectUntil = performance.now() + 2600;
  state.effectAt = { x: state.actor.x, y: state.actor.y - 28 };
  if (!quiet) {
    showToast("Meisterstueck freigeschaltet.");
    sfx("success");
  }
  return true;
}

function maybeUnlockAchievements({ quiet = false } = {}) {
  const unlocked = [];
  achievementDefs.forEach((achievement) => {
    if (!state.flags[achievement.flag] && achievement.test()) {
      state.flags[achievement.flag] = true;
      unlocked.push(achievement.label);
    }
  });
  if (!quiet && unlocked.length) {
    const suffix = unlocked.length > 1 ? ` +${unlocked.length - 1}` : "";
    showToast(`Erfolg: ${unlocked[0]}${suffix}`);
    sfx("success");
  }
  return unlocked.length > 0;
}

function removeInventory(item) {
  state.inventory = state.inventory.filter((entry) => entry !== item);
  if (state.selectedItem === item) {
    state.selectedItem = null;
  }
}

function takeItem(item, message) {
  addInventory(item);
  state.hover = null;
  setPose("pickup", 700);
  showDialog(message, "neutral");
  sfx("pickup");
  maybeUnlockAchievements();
  refreshUi();
  saveGame("Fortschritt gespeichert.");
  updateCanvasCursor();
}

function refreshUi() {
  sceneNameEl.textContent = scenes[state.scene].name;
  objectiveEl.textContent = getObjective();
  refreshHotspotToggle();
  refreshPathToggle();
  refreshCompassToggle();
  refreshAudioToggles();
  refreshInventory();
  refreshJournal();
  refreshMap();
  refreshTouchControls();
  refreshFullscreenToggle();
  refreshFinalePanel();
  refreshContextUi();
}

function refreshContextUi() {
  gameWrapEl.classList.toggle("has-inventory", state.inventory.length > 0);
  gameWrapEl.classList.toggle("using-tool", state.verb !== "walk" || Boolean(state.selectedItem));
  gameWrapEl.classList.toggle("has-hover", Boolean(state.hover && state.hover.spot));
  gameWrapEl.classList.toggle("dialog-open", !dialogEl.classList.contains("hidden"));
  gameWrapEl.classList.toggle("journal-open", !journalEl.classList.contains("hidden"));
  gameWrapEl.classList.toggle("map-open", !mapPanelEl.classList.contains("hidden"));
  gameWrapEl.classList.toggle("finale-open", !finalePanelEl.classList.contains("hidden"));
}

function refreshFinalePanel() {
  const open = state.flags.finalReward && !state.flags.finaleSeen;
  finalePanelEl.classList.toggle("hidden", !open);
}

function refreshHotspotToggle() {
  hotspotToggle.setAttribute("aria-pressed", String(state.showHotspots));
  hotspotToggle.textContent = state.showHotspots ? "Hotspots" : "Hotspots aus";
}

function refreshPathToggle() {
  pathToggle.setAttribute("aria-pressed", String(state.showPathTrace));
  pathToggle.textContent = state.showPathTrace ? "Pfad" : "Pfad aus";
}

function refreshCompassToggle() {
  compassToggle.setAttribute("aria-pressed", String(state.showCompass));
  compassToggle.textContent = state.showCompass ? "Kompass" : "Kompass aus";
}

function refreshInventory() {
  inventorySlotsEl.innerHTML = "";
  const slots = [...state.inventory];
  while (slots.length < 6) slots.push(null);
  slots.slice(0, 6).forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `slot${item ? "" : " empty"}${state.selectedItem === item ? " selected" : ""}`;
    if (item) {
      const img = document.createElement("span");
      img.className = "item-icon";
      img.setAttribute("aria-hidden", "true");
      applySpriteBackground(img, "items", itemInfo[item].icon, 32, 32);
      button.setAttribute("aria-label", itemInfo[item].label);
      button.title = itemInfo[item].label;
      button.append(img);
      button.addEventListener("click", () => {
        markUserActivated();
        sfx("ui");
        state.selectedItem = state.selectedItem === item ? null : item;
        setVerb("use");
        refreshInventory();
      });
    }
    inventorySlotsEl.append(button);
  });
}

function getObjective() {
  if (state.flags.finalReward) {
    return "Meisterstueck: Malvins Pruefung ist vollendet.";
  }
  if (state.flags.archiveSolved && secretCount() < secretLocations.length) {
    return `Bonus: ${secretCount()}/${secretLocations.length} Sternsplitter gefunden.`;
  }
  const step = getNextStep();
  if (step.done) return "Geschafft: Das Mondarchiv summt ruhig.";
  const route = nextExitToward(step.scene);
  if (state.scene === step.scene) return `Jetzt: ${step.action}`;
  if (route) return `Jetzt: Nach ${exitDestination(route, true)} gehen. Danach: ${step.action}`;
  return `Jetzt: ${step.action}`;
}

function refreshJournal() {
  const completed = journalSteps.filter((entry) => state.flags[entry.flag]).length;
  const secretsFound = secretCount();
  journalProgressEl.innerHTML = "";
  journalSteps.forEach((entry) => {
    const dot = document.createElement("span");
    dot.className = `progress-dot${state.flags[entry.flag] ? " done" : ""}`;
    dot.title = entry.text;
    journalProgressEl.append(dot);
  });

  journalBadgesEl.innerHTML = "";
  achievementDefs.forEach((achievement) => {
    const badge = document.createElement("span");
    const unlocked = Boolean(state.flags[achievement.flag]);
    badge.className = `journal-badge${unlocked ? " unlocked" : ""}`;
    badge.textContent = unlocked ? achievement.label : "???";
    badge.title = unlocked ? `Erfolg: ${achievement.label}` : "Noch nicht freigeschaltet";
    journalBadgesEl.append(badge);
  });

  const next = getNextStep();
  if (state.flags.finalReward) {
    journalNextEl.textContent = `Meisterstueck vollendet. Sternsplitter: ${secretsFound}/${secretLocations.length}.`;
  } else if (next.done && secretsFound < secretLocations.length) {
    journalNextEl.textContent = `Pruefung bestanden. Bonus offen: ${secretsFound}/${secretLocations.length} Sternsplitter.`;
  } else if (next.done) {
    journalNextEl.textContent = `Pruefung bestanden. Alle Sternsplitter sind bereit.`;
  } else {
    journalNextEl.textContent = `${completed}/${journalSteps.length} erledigt. Naechstes Ziel: ${next.action} Sternsplitter: ${secretsFound}/${secretLocations.length}.`;
  }

  journalEntriesEl.innerHTML = "";
  journalSteps.forEach((entry) => {
    const li = document.createElement("li");
    li.className = state.flags[entry.flag] ? "done" : "";
    li.textContent = `${state.flags[entry.flag] ? "Erledigt: " : "Offen: "}${entry.text}`;
    journalEntriesEl.append(li);
  });
}

function toggleJournal(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : journalEl.classList.contains("hidden");
  journalEl.classList.toggle("hidden", !shouldOpen);
  journalToggle.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen) toggleMap(false);
  if (shouldOpen) refreshJournal();
  refreshContextUi();
}

function refreshMap() {
  const focusScene = mapFocusScene();
  mapNoteEl.textContent = focusScene
    ? `Kartenfokus: ${locationLabel(focusScene)}. Besuchte Orte lassen sich direkt anspringen.`
    : "Kartenfokus: Alles erledigt. Sehr unmagisch waere laufen.";
  mapGridEl.innerHTML = "";
  mapLocations.forEach((location) => {
    const button = document.createElement("button");
    const discovered = Boolean(state.discovered[location.scene]);
    const secret = secretByScene(location.scene);
    const secretFound = Boolean(secret && state.flags[secretFlag(secret)]);
    const isFocus = focusScene === location.scene;
    button.type = "button";
    button.className = `map-node${state.scene === location.scene ? " current" : ""}${isFocus ? " focus" : ""}${secretFound ? " star-done" : ""}`;
    button.disabled = !discovered || state.scene === location.scene;
    const label = document.createElement("strong");
    label.textContent = discovered ? location.label : "Unentdeckt";
    const hint = document.createElement("span");
    hint.className = "map-hint";
    hint.textContent = discovered
      ? (state.scene === location.scene ? "Aktueller Ort" : location.hint)
      : "Noch nicht besucht";
    const badges = document.createElement("div");
    badges.className = "map-badges";
    if (discovered && secret) {
      const starBadge = document.createElement("span");
      starBadge.className = `map-badge${secretFound ? " done" : " open"}`;
      starBadge.textContent = secretFound ? "Stern gefunden" : "Stern offen";
      badges.append(starBadge);
    }
    if (discovered && isFocus) {
      const focusBadge = document.createElement("span");
      focusBadge.className = "map-badge focus";
      focusBadge.textContent = "Ziel";
      badges.append(focusBadge);
    }
    button.append(label, hint, badges);
    if (discovered && state.scene !== location.scene) {
      button.addEventListener("click", () => {
        markUserActivated();
        sfx("spell");
        fastTravel(location.scene);
      });
    }
    mapGridEl.append(button);
  });
}

function toggleMap(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : mapPanelEl.classList.contains("hidden");
  mapPanelEl.classList.toggle("hidden", !shouldOpen);
  mapToggle.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen) toggleJournal(false);
  if (shouldOpen) refreshMap();
  refreshContextUi();
}

function fastTravel(sceneId) {
  const location = mapLocations.find((entry) => entry.scene === sceneId);
  if (!location || !state.discovered[sceneId] || sceneId === state.scene) return;
  toggleMap(false);
  state.effectAt = null;
  showToast(`Karte: ${location.label}`);
  goScene(sceneId, location.at);
}

function locationLabel(sceneId) {
  const location = mapLocations.find((entry) => entry.scene === sceneId);
  return location ? location.label : (scenes[sceneId] ? scenes[sceneId].name : sceneId);
}

function focusHintSpot(spot) {
  if (!spot) return;
  state.hover = {
    spot,
    x: spot.rect[0] + spot.rect[2] / 2,
    y: spot.rect[1] + spot.rect[3] / 2,
  };
}

function showSmartHint() {
  state.showCompass = true;
  refreshCompassToggle();
  const step = getNextStep();
  if (!step.done) {
    if (state.scene === step.scene) {
      const spot = findSpotById(scenes[state.scene], step.spot);
      focusHintSpot(spot);
      showDialog(`Tagebuch-Tipp: ${step.action}`, "neutral", 5200);
    } else {
      const route = nextExitToward(step.scene);
      const routeText = route
        ? `Geh zuerst nach ${exitDestination(route, true)}.`
        : `Oeffne die Karte und reise nach ${locationLabel(step.scene)}.`;
      showDialog(`Kompass-Tipp: ${routeText} Danach: ${step.action}`, "neutral", 5600);
    }
    sfx("ui");
    refreshUi();
    return;
  }

  if (state.flags.archiveSolved && secretCount() < secretLocations.length) {
    const secret = missingSecretTrace();
    if (secret && secret.scene === state.scene) {
      const spot = findSpotById(scenes[state.scene], `secret-${secret.id}`);
      focusHintSpot(spot);
      showDialog(`Sternsplitter-Tipp: In diesem Ort fehlt noch etwas. Such bei: ${secret.label}.`, "spell", 5600);
    } else if (secret) {
      showDialog(`Sternsplitter-Tipp: Die naechste Spur zeigt nach ${locationLabel(secret.scene)}.`, "spell", 5200);
    }
    sfx("spell");
    refreshUi();
    return;
  }

  if (maybeUnlockFinalReward()) {
    maybeUnlockAchievements();
    refreshUi();
    saveGame("Meisterstueck gespeichert.");
    return;
  }

  showDialog("Tagebuch-Tipp: Alles Wichtige ist geschafft. Jetzt bleibt nur noch sehr professionell herumstolzieren.", "spell", 5200);
  sfx("ui");
}

function snapshotGame() {
  return {
    version: 2,
    savedAt: new Date().toISOString(),
    scene: state.scene,
    inventory: [...state.inventory],
    flags: { ...state.flags },
    discovered: { ...state.discovered },
    actor: {
      x: state.actor.x,
      y: state.actor.y,
      dir: state.actor.dir,
    },
    settings: {
      showHotspots: state.showHotspots,
      showPathTrace: state.showPathTrace,
      showCompass: state.showCompass,
      music: state.music,
      sound: state.sound,
      speech: state.speech,
    },
  };
}

function saveGame(message = "Spiel gespeichert.") {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(snapshotGame()));
    if (message) showToast(message);
    return true;
  } catch (err) {
    showToast("Speichern nicht moeglich.");
    return false;
  }
}

function loadSavedGame({ quiet = false } = {}) {
  let raw = null;
  try {
    raw = window.localStorage.getItem(SAVE_KEY);
  } catch (err) {
    if (!quiet) showToast("Laden nicht moeglich.");
    return false;
  }
  if (!raw) {
    if (!quiet) showToast("Kein Speicherstand gefunden.");
    return false;
  }
  try {
    const saved = JSON.parse(raw);
    if (!saved || !scenes[saved.scene]) throw new Error("Invalid save");
    state.scene = saved.scene;
    state.inventory = Array.isArray(saved.inventory)
      ? saved.inventory.filter((item) => itemInfo[item])
      : [];
    Object.keys(state.flags).forEach((key) => {
      state.flags[key] = Boolean(saved.flags && saved.flags[key]);
    });
    Object.keys(state.discovered).forEach((key) => {
      state.discovered[key] = Boolean(saved.discovered && saved.discovered[key]);
    });
    state.discovered.forest = true;
    state.discovered[state.scene] = true;
    const actor = saved.actor || {};
    const fallback = sceneStart(state.scene);
    state.actor.x = Number.isFinite(actor.x) ? actor.x : fallback[0];
    state.actor.y = Number.isFinite(actor.y) ? actor.y : fallback[1];
    state.actor.targetX = state.actor.x;
    state.actor.targetY = state.actor.y;
    state.actor.dir = actor.dir || fallback[2] || "front";
    state.actor.path = [];
    state.actor.onArrive = null;
    state.actor.pose = "idle";
    state.actor.poseUntil = 0;
    if (saved.settings) {
      state.showHotspots = Boolean(saved.settings.showHotspots);
      state.showPathTrace = Boolean(saved.settings.showPathTrace);
      state.showCompass = saved.settings.showCompass !== false;
      state.music = saved.settings.music !== false;
      state.sound = saved.settings.sound !== false;
      state.speech = speechSupported() && saved.settings.speech !== false;
    }
    state.selectedItem = null;
  state.hover = null;
  state.pathProbe = null;
    state.pathBlockedUntil = 0;
    state.effectAt = null;
    state.sceneFadeUntil = performance.now() + 420;
    maybeUnlockFinalReward({ quiet: true });
    maybeUnlockAchievements({ quiet: true });
    stopSpeech();
    setVerb("walk");
    refreshUi();
    prepareSceneTrack();
    if (state.music && state.userActivated) startBgm();
    if (!quiet) {
      showToast("Spielstand geladen.");
      showDialog("Malvin blaettert im Tagebuch zurueck. Alles ist wieder da, sogar die fragwuerdigen Entscheidungen.", "neutral", 3600);
    }
    return true;
  } catch (err) {
    if (!quiet) showToast("Speicherstand ist unlesbar.");
    return false;
  }
}

function showToast(message, duration = 1700) {
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastEl.classList.add("hidden");
    toastTimer = null;
  }, duration);
}

function refreshTouchControls() {
  if (!touchAction) return;
  touchAction.textContent = state.selectedItem
    ? `${itemInfo[state.selectedItem].label} benutzen`
    : verbLabels[state.verb];
}

function fullscreenActive() {
  return document.fullscreenElement === gameWrapEl || gameWrapEl.classList.contains("fullscreen-fallback");
}

function refreshFullscreenToggle() {
  const active = fullscreenActive();
  fullscreenToggle.setAttribute("aria-pressed", String(active));
  fullscreenToggle.textContent = active ? "Fenster" : "Vollbild";
  if (touchFullscreen) touchFullscreen.textContent = active ? "Fenster" : "Vollbild";
}

async function toggleFullscreen() {
  markUserActivated();
  const active = fullscreenActive();
  try {
    if (active) {
      gameWrapEl.classList.remove("fullscreen-fallback");
      if (document.fullscreenElement) await document.exitFullscreen();
    } else if (gameWrapEl.requestFullscreen) {
      await gameWrapEl.requestFullscreen({ navigationUI: "hide" });
    } else {
      gameWrapEl.classList.add("fullscreen-fallback");
      showToast("Vollbildmodus aktiv.");
    }
  } catch (err) {
    gameWrapEl.classList.toggle("fullscreen-fallback", !active);
  }
  refreshFullscreenToggle();
}

function cycleVerb(direction) {
  const current = verbs.indexOf(state.verb);
  const next = (current + direction + verbs.length) % verbs.length;
  setVerb(verbs[next]);
  sfx("ui");
}

function touchMoveTarget(direction) {
  const stepX = 20;
  const stepY = 15;
  const deltas = {
    up: [0, -stepY],
    down: [0, stepY],
    left: [-stepX, 0],
    right: [stepX, 0],
  };
  const [dx, dy] = deltas[direction] || [0, 0];
  return normalizeMovePoint(scenes[state.scene], state.actor.targetX + dx, state.actor.targetY + dy);
}

function touchMoveStep(direction) {
  const target = touchMoveTarget(direction);
  const probe = makePathProbeFor(target.x, target.y);
  state.pathProbe = probe;
  if (!probe.ok) {
    state.pathBlockedUntil = performance.now() + 520;
    return;
  }
  moveAlongRoute(probe.path);
}

function startTouchMove(direction) {
  markUserActivated();
  stopTouchMove();
  touchMoveStep(direction);
  touchMoveTimer = window.setInterval(() => touchMoveStep(direction), 170);
}

function stopTouchMove() {
  if (touchMoveTimer) {
    window.clearInterval(touchMoveTimer);
    touchMoveTimer = null;
  }
}

function nearestTouchSpot() {
  const spots = allHotspots(scenes[state.scene]);
  let best = null;
  for (const spot of spots) {
    const [sx, sy] = spot.stand || [spot.rect[0] + spot.rect[2] / 2, spot.rect[1] + spot.rect[3] / 2];
    const dist = Math.hypot(sx - state.actor.x, sy - state.actor.y);
    if (!best || dist < best.dist) best = { spot, dist };
  }
  return best && best.dist <= 42 ? best.spot : null;
}

function touchPrimaryAction() {
  markUserActivated();
  const spot = nearestTouchSpot();
  if (spot) {
    const stand = spot.stand || [state.actor.x, state.actor.y];
    requestMoveTo(stand[0], stand[1], () => performHotspot(spot), { forceNav: Boolean(spot.to) });
    return;
  }
  showDialog("Tippe direkt in die Szene oder laufe mit dem Steuerkreis naeher an ein Objekt heran.", "neutral", 2600);
  sfx("ui");
}

function getNextStep() {
  if (!state.flags.wandTaken) return { scene: "forest", spot: "stump", action: "Zauberstab am Baumstumpf nehmen." };
  if (!state.flags.coinGiven) return { scene: "tavern", spot: "keeper", action: "Mit dem Wirt reden." };
  if (!state.flags.spellbookTaken) return { scene: "tower", spot: "desk", action: "Zauberbuch vom Pult holen." };
  if (!state.flags.herbsTaken) return { scene: "garden", spot: "herbBed", action: "Kraeuter im Beet nehmen." };
  if (!state.flags.marketKeyGiven) return { scene: "market", spot: "merchant", action: "Kraeuter bei der Haendlerin tauschen." };
  if (!state.flags.lensTaken) return { scene: "cellar", spot: "cabinet", action: "Kellerschrank mit dem Silberschluessel benutzen." };
  if (!state.flags.observatorySolved) return { scene: "observatory", spot: "telescope", action: "Sternenlinse am Fernrohr benutzen." };
  if (!state.flags.runeRevealed) return { scene: "glade", spot: "pond", action: "Stab oder Buch am Mondteich benutzen." };
  if (!state.flags.runeTaken) return { scene: "glade", spot: "rune", action: "Runenstein nehmen." };
  if (!state.flags.sealOpened) return { scene: "tower", spot: "pedestal", action: "Runenstein am Turmsiegel benutzen." };
  if (!state.flags.archivePearlTaken) return { scene: "archive", spot: "pearlCasket", action: "Mondperle aus dem Archiv nehmen." };
  if (!state.flags.archiveSolved) return { scene: "archive", spot: "starDesk", action: "Mondperle an der Sternenmechanik benutzen." };
  return { done: true };
}

function showDialog(text, portrait = "neutral", duration = 3600, speaker = portrait) {
  dialogTextEl.textContent = text;
  state.lastDialogText = text;
  state.lastDialogSpeaker = speaker;
  applySpriteBackground(portraitEl, "portraits", portrait, 64, 64);
  dialogEl.classList.remove("hidden");
  state.dialogUntil = performance.now() + duration;
  state.dialogSpeechToken = speakDialog(text, speaker);
  refreshContextUi();
}

function hideDialogIfExpired(now) {
  if (state.dialogSpeechToken && audioState.speaking) return;
  if (state.dialogUntil && now > state.dialogUntil) {
    dialogEl.classList.add("hidden");
    state.dialogUntil = 0;
    state.dialogSpeechToken = 0;
    refreshContextUi();
  }
}

function setPose(pose, ms) {
  state.actor.pose = pose;
  state.actor.poseUntil = performance.now() + ms;
}

function allHotspots(scene) {
  const sceneId = sceneIdFor(scene);
  const secret = sceneId ? secretForScene(sceneId) : null;
  const secretHotspots = secret ? [makeSecretHotspot(secret)] : [];
  return [...scene.exits, ...secretHotspots, ...scene.hotspots].filter((spot) => !spot.active || spot.active());
}

function sceneIdFor(scene) {
  const match = Object.entries(scenes).find(([, value]) => value === scene);
  return match ? match[0] : null;
}

function sceneStart(sceneId) {
  const start = scenes[sceneId] && scenes[sceneId].start;
  if (Array.isArray(start)) return start;
  if (start) return [start.x, start.y, start.dir || "front"];
  const location = mapLocations.find((entry) => entry.scene === sceneId);
  return location ? location.at : [154, 145, "front"];
}

function findSpotById(scene, id) {
  if (!scene || !id) return null;
  return allHotspots(scene).find((spot) => spot.id === id) || null;
}

function nextExitToward(targetScene) {
  if (!targetScene || targetScene === state.scene) return null;
  const queue = [{ scene: state.scene, firstExit: null }];
  const seen = new Set([state.scene]);
  while (queue.length) {
    const node = queue.shift();
    const scene = scenes[node.scene];
    for (const exit of scene.exits || []) {
      if (!exit.to || seen.has(exit.to)) continue;
      const firstExit = node.firstExit || exit;
      if (exit.to === targetScene) return firstExit;
      seen.add(exit.to);
      queue.push({ scene: exit.to, firstExit });
    }
  }
  return null;
}

function interactionKind(spot) {
  if (!spot) return "hotspot";
  if (spot.to) return "exit";
  if (spot.take) return "item";
  if (spot.talk) return "talk";
  if (spot.use) return "use";
  if (spot.look) return "look";
  return "hotspot";
}

function cursorKindForSpot(spot) {
  const kind = interactionKind(spot);
  return (interactionMeta[kind] && interactionMeta[kind].cursor) || "hotspot";
}

function exitDestination(spot, short = false) {
  if (short && spot.to && sceneShortLabels[spot.to]) return sceneShortLabels[spot.to];
  return spot.to && scenes[spot.to] ? scenes[spot.to].name : spot.label;
}

function interactionLabel(spot) {
  if (spot.to) return `Nach ${exitDestination(spot, true)}`;
  if (spot.take) return `Nehmen: ${spot.label}`;
  if (spot.talk) return `Reden: ${spot.label}`;
  if (spot.use) return `Benutzen: ${spot.label}`;
  if (spot.look) return `Ansehen: ${spot.label}`;
  return spot.label;
}

function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersects = ((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function sceneWalk(scene = scenes[state.scene]) {
  return scene && scene.walk ? scene.walk : null;
}

function normalizeMovePoint(scene, x, y) {
  const walk = sceneWalk(scene);
  return {
    x: clamp(x, 22, W - 22),
    y: clamp(y, walk ? walk.yMin : 116, walk ? walk.yMax : H - 24),
  };
}

function isWalkable(scene, x, y) {
  const walk = sceneWalk(scene);
  if (!walk) return true;
  return walk.polygons.some((polygon) => pointInPolygon(x, y, polygon));
}

function samplePath(scene, x0, y0, x1, y1, steps = 28) {
  const samples = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    samples.push({ x, y, ok: isWalkable(scene, x, y) });
  }
  return samples;
}

function segmentSampleCount(x0, y0, x1, y1) {
  return Math.max(3, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 5));
}

function segmentIsWalkable(scene, a, b) {
  return pathIsWalkable(samplePath(scene, a.x, a.y, b.x, b.y, segmentSampleCount(a.x, a.y, b.x, b.y)));
}

function pathIsWalkable(samples) {
  return samples.every((sample) => sample.ok);
}

function makeRouteSamples(scene, route) {
  const samples = [];
  let from = { x: state.actor.x, y: state.actor.y };
  for (const to of route) {
    const segment = samplePath(scene, from.x, from.y, to.x, to.y, segmentSampleCount(from.x, from.y, to.x, to.y));
    if (samples.length) segment.shift();
    samples.push(...segment);
    from = to;
  }
  return samples;
}

function sceneNav(scene) {
  return scene && scene.nav && Array.isArray(scene.nav.points) ? scene.nav : null;
}

function compactRoute(route) {
  const compact = [];
  for (const point of route) {
    const previous = compact[compact.length - 1];
    if (previous && Math.hypot(previous.x - point.x, previous.y - point.y) < 1.2) continue;
    compact.push(point);
  }
  return compact;
}

function shortestNodePath(nodes, neighbors, startId, targetId) {
  const open = [startId];
  const cameFrom = new Map();
  const gScore = new Map([[startId, 0]]);
  const fScore = new Map([[startId, Math.hypot(nodes[targetId].x - nodes[startId].x, nodes[targetId].y - nodes[startId].y)]]);
  const closed = new Set();

  while (open.length) {
    open.sort((a, b) => (fScore.get(a) ?? Infinity) - (fScore.get(b) ?? Infinity));
    const current = open.shift();
    if (current === targetId) {
      const ids = [current];
      let cursor = current;
      while (cameFrom.has(cursor)) {
        cursor = cameFrom.get(cursor);
        ids.push(cursor);
      }
      ids.reverse();
      return ids;
    }
    closed.add(current);
    for (const next of neighbors(current)) {
      if (closed.has(next)) continue;
      const node = nodes[current];
      const other = nodes[next];
      const tentative = (gScore.get(current) ?? Infinity) + Math.hypot(other.x - node.x, other.y - node.y);
      if (tentative >= (gScore.get(next) ?? Infinity)) continue;
      cameFrom.set(next, current);
      gScore.set(next, tentative);
      fScore.set(next, tentative + Math.hypot(nodes[targetId].x - other.x, nodes[targetId].y - other.y));
      if (!open.includes(next)) open.push(next);
    }
  }
  return null;
}

function findNavRoute(scene, start, target, forcePath = false) {
  const nav = sceneNav(scene);
  if (!nav) return null;
  const nodes = nav.points.map((point, index) => ({ id: index, key: point.id, x: point.x, y: point.y, nav: true }));
  const byKey = new Map(nodes.map((node) => [node.key, node.id]));
  const links = new Map();
  const link = (a, b) => {
    if (!links.has(a)) links.set(a, []);
    if (!links.has(b)) links.set(b, []);
    links.get(a).push(b);
    links.get(b).push(a);
  };

  for (const [fromKey, toKey] of nav.edges || []) {
    const from = byKey.get(fromKey);
    const to = byKey.get(toKey);
    if (from === undefined || to === undefined) continue;
    if (segmentIsWalkable(scene, nodes[from], nodes[to])) link(from, to);
  }

  const startId = nodes.length;
  nodes.push({ id: startId, x: start.x, y: start.y, special: true });
  const targetId = nodes.length;
  nodes.push({ id: targetId, x: target.x, y: target.y, special: true });

  const connectRadius = nav.connectRadius || 48;
  const maxConnect = nav.maxConnect || 5;
  const connectSpecial = (specialId) => {
    const special = nodes[specialId];
    const visible = nodes
      .filter((node) => node.nav)
      .map((node) => ({ id: node.id, d: Math.hypot(node.x - special.x, node.y - special.y) }))
      .sort((a, b) => a.d - b.d)
      .filter((entry) => entry.d <= connectRadius && segmentIsWalkable(scene, special, nodes[entry.id]))
      .slice(0, maxConnect);
    for (const entry of visible) link(specialId, entry.id);
  };

  connectSpecial(startId);
  connectSpecial(targetId);
  if (!forcePath && segmentIsWalkable(scene, start, target)) link(startId, targetId);
  if (!links.has(startId) || !links.has(targetId)) return null;

  const pathIds = shortestNodePath(nodes, (id) => links.get(id) || [], startId, targetId);
  if (!pathIds) return null;
  return compactRoute(pathIds.slice(1).map((id) => ({ x: nodes[id].x, y: nodes[id].y })));
}

function findWalkRoute(scene, x0, y0, x1, y1, options = {}) {
  const walk = sceneWalk(scene);
  const start = { x: x0, y: y0 };
  const target = { x: x1, y: y1 };
  if (!walk) return [target];
  if (!isWalkable(scene, target.x, target.y)) return null;
  if (!isWalkable(scene, start.x, start.y)) return null;
  const forceNav = Boolean(options.forceNav && sceneNav(scene));
  if (forceNav) return findNavRoute(scene, start, target, true);
  if (segmentIsWalkable(scene, start, target)) return [target];

  const navRoute = findNavRoute(scene, start, target, false);
  if (navRoute) return navRoute;

  const step = 8;
  const nodes = [];
  const grid = new Map();
  const keyFor = (x, y) => `${x},${y}`;
  const addGridNode = (x, y) => {
    if (!isWalkable(scene, x, y)) return;
    const id = nodes.length;
    nodes.push({ id, x, y, grid: true });
    grid.set(keyFor(x, y), id);
  };

  for (let y = Math.ceil(walk.yMin / step) * step; y <= walk.yMax; y += step) {
    for (let x = 0; x <= W; x += step) {
      addGridNode(x, y);
    }
  }
  if (!nodes.length) return null;

  const startId = nodes.length;
  nodes.push({ id: startId, x: start.x, y: start.y, special: true });
  const targetId = nodes.length;
  nodes.push({ id: targetId, x: target.x, y: target.y, special: true });

  const extraLinks = new Map();
  const link = (a, b) => {
    if (!extraLinks.has(a)) extraLinks.set(a, []);
    if (!extraLinks.has(b)) extraLinks.set(b, []);
    extraLinks.get(a).push(b);
    extraLinks.get(b).push(a);
  };
  const connectPoint = (pointId) => {
    const point = nodes[pointId];
    const visible = nodes
      .filter((node) => node.grid)
      .map((node) => ({ id: node.id, d: Math.hypot(node.x - point.x, node.y - point.y) }))
      .sort((a, b) => a.d - b.d)
      .filter((entry) => entry.d <= 34 && segmentIsWalkable(scene, point, nodes[entry.id]))
      .slice(0, 10);
    for (const entry of visible) link(pointId, entry.id);
  };

  connectPoint(startId);
  connectPoint(targetId);
  if (!extraLinks.has(startId) || !extraLinks.has(targetId)) return null;

  const dirs = [
    [-step, 0], [step, 0], [0, -step], [0, step],
    [-step, -step], [step, -step], [-step, step], [step, step],
  ];
  const neighbors = (id) => {
    const node = nodes[id];
    const result = extraLinks.get(id) ? extraLinks.get(id).slice() : [];
    if (!node.grid) return result;
    for (const [dx, dy] of dirs) {
      const otherId = grid.get(keyFor(node.x + dx, node.y + dy));
      if (otherId === undefined) continue;
      const other = nodes[otherId];
      if (segmentIsWalkable(scene, node, other)) result.push(otherId);
    }
    return result;
  };

  const open = [startId];
  const cameFrom = new Map();
  const gScore = new Map([[startId, 0]]);
  const fScore = new Map([[startId, Math.hypot(target.x - start.x, target.y - start.y)]]);
  const closed = new Set();

  while (open.length) {
    open.sort((a, b) => (fScore.get(a) ?? Infinity) - (fScore.get(b) ?? Infinity));
    const current = open.shift();
    if (current === targetId) {
      const ids = [current];
      let cursor = current;
      while (cameFrom.has(cursor)) {
        cursor = cameFrom.get(cursor);
        ids.push(cursor);
      }
      ids.reverse();
      return ids.slice(1).map((id) => ({ x: nodes[id].x, y: nodes[id].y }));
    }
    closed.add(current);
    for (const next of neighbors(current)) {
      if (closed.has(next)) continue;
      const node = nodes[current];
      const other = nodes[next];
      const tentative = (gScore.get(current) ?? Infinity) + Math.hypot(other.x - node.x, other.y - node.y);
      if (tentative >= (gScore.get(next) ?? Infinity)) continue;
      cameFrom.set(next, current);
      gScore.set(next, tentative);
      fScore.set(next, tentative + Math.hypot(target.x - other.x, target.y - other.y));
      if (!open.includes(next)) open.push(next);
    }
  }
  return null;
}

function makePathProbe(x, y) {
  return makePathProbeFor(x, y);
}

function makePathProbeFor(x, y, options = {}) {
  const scene = scenes[state.scene];
  const target = normalizeMovePoint(scene, x, y);
  const samples = samplePath(scene, state.actor.x, state.actor.y, target.x, target.y);
  if (!options.forceNav && isWalkable(scene, target.x, target.y) && pathIsWalkable(samples)) {
    return {
      x: target.x,
      y: target.y,
      samples,
      path: [{ x: target.x, y: target.y }],
      ok: true,
    };
  }
  const route = findWalkRoute(scene, state.actor.x, state.actor.y, target.x, target.y, options);
  if (route && route.length) {
    return {
      x: target.x,
      y: target.y,
      samples: makeRouteSamples(scene, route),
      path: route,
      ok: true,
    };
  }
  return {
    x: target.x,
    y: target.y,
    samples,
    path: [],
    ok: false,
  };
}

function depthScaleFor(scene, y) {
  if (!scene || !scene.depth) return 1;
  const { yFar, yNear, farScale, nearScale } = scene.depth;
  const t = clamp((y - yFar) / (yNear - yFar), 0, 1);
  return farScale + (nearScale - farScale) * t;
}

function drawImagePatch(img, rect) {
  const [x, y, w, h] = rect;
  const srcScaleX = img.naturalWidth / W;
  const srcScaleY = img.naturalHeight / H;
  ctx.drawImage(
    img,
    Math.round(x * srcScaleX),
    Math.round(y * srcScaleY),
    Math.round(w * srcScaleX),
    Math.round(h * srcScaleY),
    x,
    y,
    w,
    h
  );
}

function pointInSpotHitArea(spot, x, y) {
  const [rx, ry, rw, rh] = spot.rect;
  if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) return true;
  if (!spot.to) return false;
  const labelPadX = 28;
  const labelPadTop = 28;
  return x >= rx - labelPadX && x <= rx + rw + labelPadX && y >= ry - labelPadTop && y <= ry + rh;
}

function findHotspot(x, y) {
  const list = allHotspots(scenes[state.scene])
    .slice()
    .sort((a, b) => (a.rect[2] * a.rect[3]) - (b.rect[2] * b.rect[3]));
  return list.find((spot) => pointInSpotHitArea(spot, x, y));
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor((event.clientX - rect.left) * (W / rect.width)),
    y: Math.floor((event.clientY - rect.top) * (H / rect.height)),
  };
}

function moveTo(x, y, onArrive = null) {
  const target = normalizeMovePoint(scenes[state.scene], x, y);
  state.actor.path = [];
  state.actor.targetX = target.x;
  state.actor.targetY = target.y;
  state.actor.onArrive = onArrive;
  updateDirection();
  if (Math.hypot(state.actor.targetX - state.actor.x, state.actor.targetY - state.actor.y) > 6) {
    sfx("move");
  }
}

function moveAlongRoute(route, onArrive = null) {
  if (!route || !route.length) return false;
  const first = route[0];
  state.actor.path = route.slice(1);
  state.actor.targetX = first.x;
  state.actor.targetY = first.y;
  state.actor.onArrive = onArrive;
  updateDirection();
  if (Math.hypot(state.actor.targetX - state.actor.x, state.actor.targetY - state.actor.y) > 6 || state.actor.path.length) {
    sfx("move");
  }
  return true;
}

function requestMoveTo(x, y, onArrive = null, options = {}) {
  const probe = makePathProbeFor(x, y, options);
  state.pathProbe = probe;
  if (!probe.ok) {
    state.pathBlockedUntil = performance.now() + 1800;
    state.actor.path = [];
    state.actor.onArrive = null;
    sfx("error");
    showDialog("Da kommt Malvin nicht hin. Der Pfad leuchtet rot. Praktisch, denn in Dornenbueschen verliert man schnell die Wuerde.", "worried", 3400);
    return false;
  }
  return moveAlongRoute(probe.path, onArrive);
}

function updateDirection() {
  const dx = state.actor.targetX - state.actor.x;
  const dy = state.actor.targetY - state.actor.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    state.actor.dir = dx < 0 ? "left" : "right";
  } else if (Math.abs(dy) > 2) {
    state.actor.dir = dy < 0 ? "back" : "front";
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function goScene(sceneId, at) {
  state.scene = sceneId;
  state.discovered[sceneId] = true;
  state.actor.x = at[0];
  state.actor.y = at[1];
  state.actor.targetX = at[0];
  state.actor.targetY = at[1];
  state.actor.dir = at[2] || "front";
  state.actor.path = [];
  state.actor.onArrive = null;
  state.hover = null;
  state.pathProbe = null;
  state.pathBlockedUntil = 0;
  state.sceneFadeUntil = performance.now() + 420;
  setVerb("walk");
  refreshUi();
  audioState.musicStep = 0;
  if (state.music && state.userActivated) startBgm();
  sfx("scene");
  saveGame("");
}

function primaryVerbForSpot(spot) {
  if (!spot) return state.verb;
  if (spot.to) return "walk";
  if (spot.take) return "take";
  if (spot.talk) return "talk";
  if (spot.look) return "look";
  if (spot.use) return "use";
  return state.verb;
}

function effectiveVerbForSpot(spot) {
  if (!spot) return state.verb;
  if (spot.to) return "walk";
  if (state.verb === "walk") return primaryVerbForSpot(spot);
  return state.verb;
}

function performHotspot(spot) {
  const verb = effectiveVerbForSpot(spot);
  if (spot.to) {
    goScene(spot.to, spot.at);
    return;
  }

  if (verb === "use") {
    if (!state.selectedItem) {
      sfx("error");
      showDialog("Waehle erst einen Gegenstand im Inventar aus. Magie ohne Requisite ist nur selbstbewusstes Zeigen.", "neutral");
      return;
    }
    if (spot.use) {
      spot.use(state.selectedItem);
    } else {
      sfx("error");
      showDialog(`${itemInfo[state.selectedItem].label} passt hier nicht. Malvin schuettelt es kurz, um wissenschaftlich zu wirken.`, "neutral");
    }
    return;
  }

  const handler = spot[verb];
  if (typeof handler === "function") {
    handler();
    return;
  }
  if (typeof handler === "string") {
    const portrait = verb === "talk" ? "talk" : "neutral";
    showDialog(handler, portrait);
    if (verb === "talk") sfx("talk");
    if (verb === "talk") setPose("talk", 700);
    return;
  }

  if (verb === "take") {
    sfx("error");
    showDialog("Das laesst sich leider nicht einstecken. Malvins Taschen sind tapfer, aber nicht architektonisch.", "worried");
    return;
  }
  if (verb === "talk") {
    sfx("talk");
    showDialog("Keine Antwort. Geheimnisvoll, ja. Hilfreich, nein. Wie ein Orakel mit Mittagspause.", "talk");
    return;
  }
  showDialog("Malvin findet nichts Auffaelliges. Er notiert: Unauffaelligkeit weiterhin unauffaellig.", "neutral");
}

function handleSceneClick(x, y) {
  const spot = findHotspot(x, y);
  if (spot) {
    const isExit = Boolean(spot.to);
    if (isExit) {
      state.selectedItem = null;
      setVerb("walk");
    }
    const stand = spot.stand || [x, y];
    requestMoveTo(stand[0], stand[1], () => performHotspot(spot), { forceNav: isExit });
    return;
  }

  if (state.verb === "walk") {
    requestMoveTo(x, y);
    return;
  }

  showDialog(`${verbLabels[state.verb]} womit? Malvin ist talentiert, aber nicht telepathisch.`, "neutral", 2300);
  sfx("error");
}

function updateHover(point) {
  const spot = findHotspot(point.x, point.y);
  state.hover = spot ? { spot, x: point.x, y: point.y } : null;
  const pathTarget = spot && spot.stand ? { x: spot.stand[0], y: spot.stand[1] } : point;
  state.pathProbe = makePathProbeFor(pathTarget.x, pathTarget.y, { forceNav: Boolean(spot && spot.to) });
  canvas.title = spot ? interactionLabel(spot) : verbLabels[state.verb];
  refreshContextUi();
  updateCanvasCursor();
}

function updateActor(dt, now) {
  const dx = state.actor.targetX - state.actor.x;
  const dy = state.actor.targetY - state.actor.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 0.4) {
    const step = Math.min(dist, state.actor.speed * dt);
    state.actor.x += (dx / dist) * step;
    state.actor.y += (dy / dist) * step;
    updateDirection();
  } else {
    state.actor.x = state.actor.targetX;
    state.actor.y = state.actor.targetY;
    if (state.actor.path.length) {
      const next = state.actor.path.shift();
      state.actor.targetX = next.x;
      state.actor.targetY = next.y;
      updateDirection();
      return;
    }
    const callback = state.actor.onArrive;
    state.actor.onArrive = null;
    if (callback) callback();
  }

  if (state.actor.poseUntil && now > state.actor.poseUntil) {
    state.actor.pose = "idle";
    state.actor.poseUntil = 0;
  }
}

function isMoving() {
  return Math.hypot(state.actor.targetX - state.actor.x, state.actor.targetY - state.actor.y) > 0.6;
}

function draw() {
  const scene = scenes[state.scene];
  const now = performance.now();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, DISPLAY_W, DISPLAY_H);
  ctx.drawImage(images.backgrounds[scene.bg], 0, 0, DISPLAY_W, DISPLAY_H);
  ctx.save();
  ctx.scale(SCALE, SCALE);
  drawAmbientScene(scene, now);
  drawSceneDetails(scene);
  drawSecretGlints(scene, now);
  drawPathTrace(scene, now);
  drawWorldItems(scene, false);
  drawNpcs(scene, now);
  drawActor(now);
  drawForegroundOverlays(scene);
  drawWorldItems(scene, true);
  drawEffects(now);
  drawInteractionHighlights(scene, now);
  drawNextStepHint(scene, now);
  ctx.restore();
  drawSceneFade(now);
}

function drawSceneDetails(scene) {
  if (state.scene === "tower" && state.flags.sealOpened) {
    drawSealGlow();
  }
  if (state.scene === "archive" && state.flags.archiveSolved) {
    drawArchiveHarmony();
  }
}

function drawAmbientScene(scene, now) {
  const t = now / 1000;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  if (state.scene === "forest") {
    drawAmbientDots([[44, 102], [82, 72], [212, 88], [260, 126], [146, 116]], t, "120,255,180", 7);
  } else if (state.scene === "tavern") {
    drawAmbientGlow(128, 104, 22, "255,188,92", t * 2.1);
    drawAmbientGlow(246, 82, 18, "255,221,150", t * 2.7);
    drawAmbientDots([[92, 70], [172, 84], [220, 112], [275, 62]], t, "255,236,170", 5);
  } else if (state.scene === "tower") {
    drawAmbientDots([[46, 48], [86, 76], [152, 34], [226, 94], [282, 62]], t, "159,132,214", 6);
  } else if (state.scene === "glade") {
    drawAmbientDots([[58, 118], [104, 126], [156, 132], [226, 120], [276, 132]], t, "120,255,180", 8);
  } else if (state.scene === "garden") {
    drawAmbientPetals(t);
    drawAmbientGlow(246, 90, 20, "255,236,125", t * 1.8);
  } else if (state.scene === "market") {
    drawAmbientGlow(52, 76, 18, "255,188,92", t * 2.3);
    drawAmbientGlow(252, 80, 16, "255,221,150", t * 2.9);
  } else if (state.scene === "cellar") {
    drawAmbientBubbles(t);
    drawAmbientGlow(205, 112, 25, "98,255,145", t * 2.2);
  } else if (state.scene === "observatory") {
    drawAmbientDots([[176, 48], [205, 38], [242, 62], [275, 44], [224, 92]], t, "170,224,255", 5);
  } else if (state.scene === "archive") {
    drawArchiveOrbit(t);
    drawAmbientDots([[44, 142], [74, 88], [147, 48], [258, 72], [296, 118]], t, "76,218,201", 6);
  }
  ctx.restore();
}

function drawAmbientGlow(x, y, radius, rgb, phase) {
  const pulse = 0.78 + Math.sin(phase) * 0.18;
  const glow = ctx.createRadialGradient(x, y, 1, x, y, radius);
  glow.addColorStop(0, `rgba(${rgb},${0.24 * pulse})`);
  glow.addColorStop(0.48, `rgba(${rgb},${0.11 * pulse})`);
  glow.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawAmbientDots(points, t, rgb, drift = 5) {
  points.forEach(([baseX, baseY], index) => {
    const phase = t * (0.8 + index * 0.11) + index * 1.73;
    const x = baseX + Math.sin(phase) * drift;
    const y = baseY + Math.cos(phase * 0.72) * (drift * 0.62);
    const r = 1.4 + Math.sin(phase * 1.8) * 0.45;
    ctx.fillStyle = `rgba(${rgb},${0.18 + Math.sin(phase) * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r + 4, r + 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(${rgb},${0.72 + Math.sin(phase) * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.8, r), Math.max(0.8, r * 0.72), 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawAmbientPetals(t) {
  [[38, 118], [92, 72], [172, 96], [238, 118], [286, 82]].forEach(([baseX, baseY], index) => {
    const phase = t * (0.9 + index * 0.08) + index;
    const x = (baseX + phase * 13) % 340 - 10;
    const y = baseY + Math.sin(phase * 1.6) * 7;
    ctx.fillStyle = "rgba(255,196,176,0.42)";
    ctx.beginPath();
    ctx.ellipse(x, y, 3, 1.3, phase, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawAmbientBubbles(t) {
  [[196, 110], [205, 106], [214, 113], [188, 120]].forEach(([baseX, baseY], index) => {
    const phase = (t * (0.7 + index * 0.18) + index * 0.31) % 1;
    const y = baseY - phase * 26;
    const x = baseX + Math.sin(t * 3 + index) * 2;
    ctx.strokeStyle = `rgba(165,255,188,${0.5 - phase * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, 2 + index * 0.25, 2 + index * 0.18, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawArchiveOrbit(t) {
  const cx = 218;
  const cy = 118;
  ctx.strokeStyle = "rgba(76,218,201,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 30, 11, Math.sin(t) * 0.08, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 4; i += 1) {
    const phase = t * 1.4 + i * Math.PI * 0.5;
    const x = cx + Math.cos(phase) * 30;
    const y = cy + Math.sin(phase) * 11;
    ctx.fillStyle = "rgba(255,236,125,0.72)";
    ctx.beginPath();
    ctx.ellipse(x, y, 1.8, 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSceneFade(now) {
  if (!state.sceneFadeUntil || now >= state.sceneFadeUntil) return;
  const alpha = clamp((state.sceneFadeUntil - now) / 420, 0, 1) * 0.58;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = `rgba(5,7,10,${alpha})`;
  ctx.fillRect(0, 0, DISPLAY_W, DISPLAY_H);
  ctx.restore();
}

function drawSealGlow() {
  const pulse = Math.sin(performance.now() / 180) * 2;
  ctx.strokeStyle = "#4cdac9";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(240, 132, 22 + pulse, 11 + pulse / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,236,125,0.32)";
  ctx.fillRect(234, 126, 12, 12);
}

function drawArchiveHarmony() {
  const pulse = Math.sin(performance.now() / 210);
  ctx.save();
  ctx.strokeStyle = "rgba(255,236,125,0.72)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(218, 118, 33 + pulse * 2, 13 + pulse, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(76,218,201,0.24)";
  ctx.beginPath();
  ctx.ellipse(218, 118, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSecretGlints(scene, now) {
  const sceneId = sceneIdFor(scene);
  const secret = sceneId ? secretForScene(sceneId) : null;
  if (!secret) return;
  const phase = now / 260;
  ctx.save();
  ctx.globalAlpha = 0.58 + Math.sin(phase) * 0.18;
  const glow = ctx.createRadialGradient(secret.x, secret.y, 1, secret.x, secret.y, 16);
  glow.addColorStop(0, "rgba(255,236,125,0.45)");
  glow.addColorStop(0.45, "rgba(76,218,201,0.18)");
  glow.addColorStop(1, "rgba(76,218,201,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(secret.x, secret.y, 15, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawQuestSparkle(secret.x, secret.y, phase);
}

function drawPathTrace(scene, now) {
  const walk = sceneWalk(scene);
  if (!walk) return;
  const probe = state.pathProbe;
  const showProbe = Boolean(probe && (state.showPathTrace || state.hover || state.pathBlockedUntil > now));
  if (!state.showPathTrace && !showProbe) return;

  ctx.save();
  if (state.showPathTrace) {
    for (const polygon of walk.polygons) {
      ctx.beginPath();
      polygon.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = "rgba(76,218,201,0.04)";
      ctx.fill();
      ctx.strokeStyle = "rgba(76,218,201,0.26)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.lineDashOffset = -Math.floor(now / 120) % 9;
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);

  if (showProbe && probe.samples && probe.samples.length > 1) {
    for (let i = 1; i < probe.samples.length; i += 1) {
      const a = probe.samples[i - 1];
      const b = probe.samples[i];
      ctx.strokeStyle = a.ok && b.ok ? "rgba(120,255,180,0.62)" : "rgba(255,84,88,0.9)";
      ctx.lineWidth = a.ok && b.ok ? 2 : 3;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.fillStyle = probe.ok ? "rgba(120,255,180,0.9)" : "rgba(255,84,88,0.95)";
    ctx.strokeStyle = "rgba(20,18,24,0.92)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(probe.x, probe.y, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (state.pathBlockedUntil > now && probe) {
    ctx.strokeStyle = "rgba(255,84,88,0.96)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(probe.x - 6, probe.y - 6);
    ctx.lineTo(probe.x + 6, probe.y + 6);
    ctx.moveTo(probe.x + 6, probe.y - 6);
    ctx.lineTo(probe.x - 6, probe.y + 6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWorldItems(scene, frontLayer = false) {
  for (const entry of scene.worldItems || []) {
    if (entry.active && !entry.active()) continue;
    if (Boolean(entry.front) !== frontLayer) continue;
    const info = itemInfo[entry.item];
    const scale = depthScaleFor(scene, entry.y);
    const size = Math.round(24 * scale);
    drawSprite("items", info.icon, Math.round(entry.x - size / 2), Math.round(entry.y - size / 2), size, size);
  }
}

function npcSpeakerKey(npc) {
  return npc.speaker || (npc.sprite ? npc.sprite.replace(/_idle$/, "") : "");
}

function npcSpriteFor(npc, now) {
  const speaker = npcSpeakerKey(npc);
  const talkKey = `${speaker}_talk`;
  const isTalking = speaker && state.lastDialogSpeaker === speaker && state.dialogUntil > now;
  return isTalking && spriteEntry("npcs", talkKey) ? talkKey : npc.sprite;
}

function drawNpcs(scene, now) {
  for (const npc of scene.npcs || []) {
    if (npc.active && !npc.active()) continue;
    const scale = depthScaleFor(scene, npc.y);
    drawAtlasAnimation(
      "npcs",
      npcSpriteFor(npc, now),
      now,
      Math.round(npc.x - 32 * scale),
      Math.round(npc.y - 58 * scale),
      Math.round(64 * scale),
      Math.round(64 * scale)
    );
  }
}

function drawAtlasAnimation(group, key, now, dx, dy, dw, dh) {
  const entry = spriteEntry(group, key);
  const frames = entry.frames || 1;
  const fps = entry.fps || 6;
  const frame = Math.floor((now / 1000) * fps) % frames;
  ctx.drawImage(
    images.atlas,
    entry.x + frame * entry.frameW,
    entry.y,
    entry.frameW,
    entry.frameH,
    dx,
    dy,
    dw,
    dh
  );
}

function drawActor(now) {
  let action = isMoving() ? "walk" : "idle";
  if (state.actor.poseUntil && now <= state.actor.poseUntil) {
    action = state.actor.pose;
  }

  let dir = state.actor.dir;
  if (action === "pickup" || action === "inspect" || action === "surprised") {
    dir = "front";
  }
  if (action === "talk" && dir === "back") dir = "front";
  if (action === "cast" && dir === "back") dir = "front";

  const key = `apprentice_${action}_${dir}`;
  const fallback = `apprentice_idle_${dir}`;
  const sheetKey = spriteEntry("animations", key) ? key : fallback;
  const entry = spriteEntry("animations", sheetKey);
  const frames = entry.frames || 4;
  const fps = entry.fps || 8;
  const frame = Math.floor((now / 1000) * fps) % frames;
  const scale = depthScaleFor(scenes[state.scene], state.actor.y);
  const spriteW = Math.round(64 * scale);
  const spriteH = Math.round(64 * scale);
  const anchorX = Math.round(32 * scale);
  const anchorY = Math.round(58 * scale);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(Math.round(state.actor.x), Math.round(state.actor.y - 2), 16 * scale, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(
    images.atlas,
    entry.x + frame * entry.frameW,
    entry.y,
    entry.frameW,
    entry.frameH,
    Math.round(state.actor.x - anchorX),
    Math.round(state.actor.y - anchorY),
    spriteW,
    spriteH
  );
}

function drawForegroundOverlays(scene) {
  if (!scene.foreground || !images.backgrounds[scene.bg]) return;
  for (const layer of scene.foreground) {
    if (layer.active && !layer.active()) continue;
    if (state.actor.y < layer.depthY) {
      drawImagePatch(images.backgrounds[scene.bg], layer.rect);
    }
  }
}

function drawEffects(now) {
  if (!state.effectUntil || now > state.effectUntil) return;
  const entry = spriteEntry("effects", "spell_sparkle");
  const frame = Math.floor(now / 80) % entry.frames;
  let x = state.effectAt ? state.effectAt.x : 154;
  let y = state.effectAt ? state.effectAt.y : 122;
  if (!state.effectAt && state.scene === "tower") {
    x = 240;
    y = 130;
  }
  ctx.drawImage(images.atlas, entry.x + frame * entry.frameW, entry.y, entry.frameW, entry.frameH, x - 32, y - 32, 64, 64);
}

function drawInteractionHighlights(scene, now) {
  const activeSpots = allHotspots(scene);
  const hoverSpot = state.hover
    ? activeSpots.find((spot) => spot === state.hover.spot || spot.id === state.hover.spot.id)
    : null;
  if (state.hover && !hoverSpot) state.hover = null;
  if (state.showHotspots) {
    for (const spot of activeSpots) {
      drawSpotHighlight(spot, spot === hoverSpot, now);
    }
  } else if (hoverSpot) {
    drawSpotHighlight(hoverSpot, true, now);
  }

  if (hoverSpot) {
    drawInteractionTag(hoverSpot, state.hover.x + 10, state.hover.y - 18, true);
  }
}

function drawSpotHighlight(spot, hovered, now) {
  const [x, y, w, h] = spot.rect;
  const kind = interactionKind(spot);
  const meta = interactionMeta[kind] || interactionMeta.hotspot;
  if (spot.to) {
    drawExitHighlight(spot, hovered, now, meta);
    if (state.showHotspots && !hovered) {
      drawInteractionTag(spot, x + w / 2, y - 9, false);
    }
    return;
  }
  const pulse = hovered ? 0.75 + Math.sin(now / 110) * 0.25 : 0.48;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = hovered ? meta.fill : "rgba(0,0,0,0)";
  ctx.strokeStyle = meta.color;
  ctx.lineWidth = hovered ? 2 : 1;
  ctx.setLineDash(hovered ? [5, 2] : [3, 3]);
  ctx.lineDashOffset = -Math.floor(now / 130) % 8;
  if (hovered) ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  ctx.setLineDash([]);
  drawCornerTicks(x, y, w, h, meta.color);
  ctx.restore();

  const markerSize = hovered ? 18 : 14;
  const markerX = clamp(Math.round(x + w / 2 - markerSize / 2), 2, W - markerSize - 2);
  const markerY = clamp(Math.round(y - markerSize / 2), 2, H - markerSize - 2);
  drawSprite("markers", meta.marker, markerX, markerY, markerSize, markerSize);

  if (state.showHotspots && spot.to && !hovered) {
    drawInteractionTag(spot, x + w / 2, y - 9, false);
  }
}

function drawExitHighlight(spot, hovered, now, meta) {
  const [x, y, w, h] = spot.rect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const pulse = hovered ? 0.58 + Math.sin(now / 120) * 0.18 : 0.34;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = meta.color;
  ctx.fillStyle = hovered ? "rgba(230,179,65,0.12)" : "rgba(230,179,65,0.04)";
  ctx.lineWidth = hovered ? 3 : 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.22, Math.max(16, w * 0.36), Math.max(7, h * 0.16), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.28, cy + h * 0.24);
  ctx.quadraticCurveTo(cx, cy - h * 0.08 + Math.sin(now / 220) * 2, cx + w * 0.28, cy + h * 0.22);
  ctx.strokeStyle = hovered ? "rgba(255,236,125,0.92)" : "rgba(255,236,125,0.55)";
  ctx.stroke();
  ctx.restore();

  const markerSize = hovered ? 19 : 15;
  const markerX = clamp(Math.round(cx - markerSize / 2), 2, W - markerSize - 2);
  const markerY = clamp(Math.round(cy - markerSize / 2), 2, H - markerSize - 2);
  drawSprite("markers", meta.marker, markerX, markerY, markerSize, markerSize);
}

function drawCornerTicks(x, y, w, h, color) {
  const len = 6;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + len, y);
  ctx.moveTo(x + w - len, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + len);
  ctx.moveTo(x, y + h - len);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + len, y + h);
  ctx.moveTo(x + w - len, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - len);
  ctx.stroke();
}

function drawInteractionTag(spot, anchorX, anchorY, hovered) {
  const text = hovered ? interactionLabel(spot) : `Nach ${exitDestination(spot, true)}`;
  const kind = interactionKind(spot);
  const meta = interactionMeta[kind] || interactionMeta.hotspot;
  if (spot.to) {
    drawFloatingText(text, anchorX, anchorY, meta.color, hovered ? 8 : 6);
    return;
  }
  let fontSize = hovered ? 8 : 5;
  ctx.save();
  ctx.font = `${hovered ? "bold " : ""}${fontSize}px Georgia, serif`;
  let textW = Math.ceil(ctx.measureText(text).width);
  while (textW > W - 16 && fontSize > 5) {
    fontSize -= 1;
    ctx.font = `${hovered ? "bold " : ""}${fontSize}px Georgia, serif`;
    textW = Math.ceil(ctx.measureText(text).width);
  }
  const padX = hovered ? 5 : 3;
  const boxW = Math.min(W - 8, textW + padX * 2);
  const boxH = hovered ? 14 : 9;
  const x = clamp(Math.round(anchorX - boxW / 2), 4, W - boxW - 4);
  let y = Math.round(anchorY);
  if (y < 4) y = Math.round((spot.rect[1] || 0) + spot.rect[3] + 4);
  y = clamp(y, 4, H - boxH - 4);
  ctx.fillStyle = hovered ? "rgba(24,22,25,0.94)" : "rgba(24,22,25,0.68)";
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeStyle = meta.color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, boxW, boxH);
  ctx.fillStyle = "#f4eedb";
  ctx.fillText(text, x + padX, y + boxH - 3);
  ctx.restore();
}

function drawFloatingText(text, anchorX, anchorY, color, fontSize = 7) {
  ctx.save();
  ctx.font = `bold ${fontSize}px Georgia, serif`;
  const textW = Math.ceil(ctx.measureText(text).width);
  const x = clamp(Math.round(anchorX - textW / 2), 4, W - textW - 4);
  const y = clamp(Math.round(anchorY), 8, H - 6);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(18,16,18,0.88)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,236,125,0.52)";
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 3);
  ctx.lineTo(x + textW - 2, y + 3);
  ctx.stroke();
  ctx.restore();
}

function drawNextStepHint(scene, now) {
  if (!state.showCompass) return;
  const step = getNextStep();
  let spot = null;
  let text = "Hier weiter";
  let color = "#78ffb4";

  if (!step.done && state.scene === step.scene) {
    spot = findSpotById(scene, step.spot);
  } else if (!step.done) {
    spot = nextExitToward(step.scene);
    if (spot) text = `Weiter nach ${exitDestination(spot, true)}`;
  } else if (state.flags.archiveSolved && secretCount() < secretLocations.length) {
    const secret = missingSecretTrace();
    if (!secret) return;
    color = "#ffec7d";
    if (secret.scene === state.scene) {
      spot = findSpotById(scene, `secret-${secret.id}`);
      text = "Sternsplitter";
    } else {
      spot = nextExitToward(secret.scene);
      if (spot) text = `Splitter: ${exitDestination(spot, true)}`;
    }
  } else {
    return;
  }
  if (!spot) return;
  const [x, y, w, h] = spot.rect;
  if (spot.to) {
    drawExitHighlight(spot, true, now, interactionMeta.exit);
    drawFloatingText(text, x + w / 2, y - 12, color, 7);
    return;
  }
  drawQuestTargetHighlight(spot, now);
  drawFloatingText(text, x + w / 2, y - 12, color, 7);
}

function drawQuestTargetHighlight(spot, now) {
  const [x, y, w, h] = spot.rect;
  const cx = x + w / 2;
  const focusY = y + h * 0.5;
  const groundY = y + h * 0.88;
  const rx = clamp(w * 0.5, 14, 38);
  const ry = clamp(h * 0.2, 6, 15);
  const pulse = 0.58 + Math.sin(now / 180) * 0.16;
  const aura = ctx.createRadialGradient(cx, focusY, 2, cx, focusY, Math.max(rx * 1.55, h * 0.72));
  ctx.save();
  aura.addColorStop(0, "rgba(120,255,180,0.22)");
  aura.addColorStop(0.52, "rgba(255,236,125,0.10)");
  aura.addColorStop(1, "rgba(120,255,180,0)");
  ctx.globalAlpha = 0.78 + Math.sin(now / 260) * 0.08;
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.ellipse(cx, focusY, rx * 1.45, Math.max(16, h * 0.58), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = pulse;
  ctx.fillStyle = "rgba(120,255,180,0.09)";
  ctx.strokeStyle = "rgba(120,255,180,0.78)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, groundY, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 0.54 + Math.sin(now / 150) * 0.14;
  ctx.strokeStyle = "rgba(120,255,180,0.92)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, groundY, rx * 0.62, ry * 0.62, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.84;
  ctx.strokeStyle = "rgba(255,236,125,0.72)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - rx * 0.82, groundY - ry * 0.45);
  ctx.quadraticCurveTo(cx, groundY - ry * 1.7 + Math.sin(now / 210) * 2, cx + rx * 0.82, groundY - ry * 0.45);
  ctx.stroke();
  ctx.restore();

  drawQuestWisp(cx - rx * 0.68, focusY + h * 0.06, cx + rx * 0.58, focusY - h * 0.28, now, 0);
  drawQuestWisp(cx + rx * 0.62, focusY + h * 0.12, cx - rx * 0.46, focusY - h * 0.22, now, 1.7);

  const sparkles = [
    [cx - rx * 0.92, y + h * 0.2, 0],
    [cx + rx * 0.88, y + h * 0.34, 1.2],
    [cx - rx * 0.28, groundY - ry * 2.0, 2.1],
    [cx + rx * 0.12, y + h * 0.05, 3.4],
  ];
  for (const [sx, sy, phase] of sparkles) {
    drawQuestSparkle(sx, sy, now / 190 + phase);
  }
}

function drawQuestWisp(x1, y1, x2, y2, now, phase) {
  const drift = Math.sin(now / 260 + phase) * 3;
  ctx.save();
  ctx.globalAlpha = 0.45 + Math.cos(now / 210 + phase) * 0.12;
  ctx.strokeStyle = "rgba(120,255,180,0.72)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1 + drift);
  ctx.bezierCurveTo((x1 + x2) / 2, y1 - 12 - drift, (x1 + x2) / 2, y2 + 12 + drift, x2, y2 - drift);
  ctx.stroke();
  ctx.restore();
}

function drawQuestSparkle(x, y, phase) {
  const size = 2.6 + Math.sin(phase) * 0.95;
  ctx.save();
  ctx.globalAlpha = 0.72 + Math.cos(phase) * 0.2;
  ctx.strokeStyle = "#78ffb4";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.moveTo(x - size * 0.58, y - size * 0.58);
  ctx.lineTo(x + size * 0.58, y + size * 0.58);
  ctx.moveTo(x + size * 0.58, y - size * 0.58);
  ctx.lineTo(x - size * 0.58, y + size * 0.58);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,236,125,0.82)";
  ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
  ctx.restore();
}

function audioSupported() {
  return "AudioContext" in window || "webkitAudioContext" in window;
}

function ensureAudio() {
  if (!audioSupported()) return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
    audioState.musicGain = audioCtx.createGain();
    audioState.sfxGain = audioCtx.createGain();
    audioState.musicGain.gain.value = state.music ? AUDIO_LEVELS.proceduralMusic : 0;
    audioState.sfxGain.gain.value = state.sound ? AUDIO_LEVELS.sfx : 0;
    audioState.musicGain.connect(audioCtx.destination);
    audioState.sfxGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function refreshAudioToggles() {
  musicToggle.disabled = !bgmTrack && !audioSupported();
  soundToggle.disabled = !audioSupported();
  musicToggle.setAttribute("aria-pressed", String(state.music));
  soundToggle.setAttribute("aria-pressed", String(state.sound));
  const track = musicTrackForScene();
  musicToggle.textContent = state.music ? "Musik" : "Musik aus";
  musicToggle.title = track ? `Musik: ${track.title}` : "Musik";
  soundToggle.textContent = state.sound ? "SFX" : "SFX aus";
}

function canUseBgmTrack() {
  return Boolean(bgmTrack && bgmTrack.canPlayType && bgmTrack.canPlayType("audio/mpeg"));
}

function musicTrackForScene(sceneId = state.scene) {
  const key = sceneMusic[sceneId] || "clockwork";
  return bgmLibrary[key] || bgmLibrary.clockwork;
}

function prepareSceneTrack() {
  if (!bgmTrack) return null;
  const track = musicTrackForScene();
  if (audioState.currentTrack !== track.src) {
    audioState.currentTrack = track.src;
    bgmTrack.src = track.src;
    bgmTrack.load();
  }
  bgmTrack.loop = true;
  bgmTrack.preload = "auto";
  return track;
}

function updateTrackVolume() {
  if (!bgmTrack) return;
  bgmTrack.volume = audioState.speaking ? AUDIO_LEVELS.trackMusicWithSpeech : AUDIO_LEVELS.trackMusic;
}

function tone(freq, duration, options = {}) {
  const ctxAudio = ensureAudio();
  if (!ctxAudio) return;
  const destination = options.destination || audioState.sfxGain;
  const osc = ctxAudio.createOscillator();
  const gain = ctxAudio.createGain();
  const when = ctxAudio.currentTime + (options.delay || 0);
  const volume = options.volume ?? 0.08;
  osc.type = options.type || "triangle";
  osc.frequency.setValueAtTime(freq, when);
  if (options.to) {
    osc.frequency.exponentialRampToValueAtTime(options.to, when + duration);
  }
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(gain).connect(destination);
  osc.start(when);
  osc.stop(when + duration + 0.03);
}

function sfx(kind) {
  if (!state.sound) return;
  if (kind === "ui") {
    tone(440, 0.07, { volume: 0.035, type: "square" });
  } else if (kind === "move") {
    tone(180, 0.05, { volume: 0.025, type: "triangle", to: 140 });
  } else if (kind === "pickup") {
    tone(330, 0.09, { volume: 0.05 });
    tone(495, 0.1, { delay: 0.08, volume: 0.045 });
    tone(660, 0.11, { delay: 0.16, volume: 0.04 });
  } else if (kind === "scene") {
    tone(220, 0.12, { volume: 0.045, to: 330 });
    tone(164.81, 0.16, { delay: 0.06, volume: 0.025, type: "sine" });
  } else if (kind === "error") {
    tone(146.83, 0.14, { volume: 0.06, type: "sawtooth", to: 110 });
  } else if (kind === "talk") {
    tone(392, 0.055, { volume: 0.028, type: "square" });
    tone(493.88, 0.055, { delay: 0.065, volume: 0.022, type: "square" });
  } else if (kind === "spell") {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      tone(freq, 0.22, { delay: i * 0.07, volume: 0.045, type: "sine", to: freq * 1.5 });
    });
  } else if (kind === "success") {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      tone(freq, 0.18, { delay: i * 0.1, volume: 0.06, type: "triangle" });
    });
  }
}

function musicNote(freq, duration, delay, volume, type) {
  tone(freq, duration, {
    delay,
    volume,
    type,
    destination: audioState.musicGain,
  });
}

function playMusicStep() {
  if (!state.music || !state.userActivated) return;
  const ctxAudio = ensureAudio();
  if (!ctxAudio) return;
  const pattern = musicPatterns[state.scene] || musicPatterns.forest;
  const step = audioState.musicStep++;
  const note = pattern.scale[step % pattern.scale.length];
  const bass = pattern.bass[Math.floor(step / 4) % pattern.bass.length];
  const tempo = pattern.tempo;

  if (step % 2 === 0) {
    musicNote(note, tempo * 0.82, 0, 0.035, pattern.wave);
  }
  if (step % 4 === 0) {
    musicNote(bass, tempo * 1.8, 0, 0.028, "sine");
  }
  if (step % 8 === 6) {
    musicNote(note * 2, tempo * 0.55, 0, 0.018, "sine");
  }
}

function startBgm() {
  if (!state.music || !state.userActivated) return;
  if (canUseBgmTrack()) {
    stopProceduralBgm();
    prepareSceneTrack();
    audioState.usingTrack = true;
    updateTrackVolume();
    const playPromise = bgmTrack.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        audioState.usingTrack = false;
        startProceduralBgm();
      });
    }
    return;
  }
  startProceduralBgm();
}

function startProceduralBgm() {
  if (audioState.musicTimer) return;
  ensureAudio();
  if (!audioCtx || !audioState.musicGain) return;
  audioState.musicGain.gain.setTargetAtTime(AUDIO_LEVELS.proceduralMusic, audioCtx.currentTime, 0.18);
  playMusicStep();
  audioState.musicTimer = window.setInterval(playMusicStep, 185);
}

function stopBgm() {
  if (bgmTrack) {
    bgmTrack.pause();
  }
  audioState.usingTrack = false;
  stopProceduralBgm();
}

function stopProceduralBgm() {
  if (audioState.musicTimer) {
    window.clearInterval(audioState.musicTimer);
    audioState.musicTimer = null;
  }
  if (audioCtx && audioState.musicGain) {
    audioState.musicGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.12);
  }
}

document.querySelectorAll(".verb").forEach((button) => {
  button.addEventListener("click", () => {
    markUserActivated();
    sfx("ui");
    setVerb(button.dataset.verb);
  });
});

hotspotToggle.addEventListener("click", () => {
  markUserActivated();
  state.showHotspots = !state.showHotspots;
  refreshHotspotToggle();
  sfx("ui");
});

pathToggle.addEventListener("click", () => {
  markUserActivated();
  state.showPathTrace = !state.showPathTrace;
  refreshPathToggle();
  sfx("ui");
});

compassToggle.addEventListener("click", () => {
  markUserActivated();
  state.showCompass = !state.showCompass;
  refreshCompassToggle();
  sfx("ui");
});

hintButton.addEventListener("click", () => {
  markUserActivated();
  showSmartHint();
});

journalToggle.addEventListener("click", () => {
  markUserActivated();
  sfx("ui");
  toggleJournal();
});

journalClose.addEventListener("click", () => {
  markUserActivated();
  sfx("ui");
  toggleJournal(false);
});

mapToggle.addEventListener("click", () => {
  markUserActivated();
  sfx("ui");
  toggleMap();
});

mapClose.addEventListener("click", () => {
  markUserActivated();
  sfx("ui");
  toggleMap(false);
});

saveButton.addEventListener("click", () => {
  markUserActivated();
  sfx("ui");
  saveGame("Spiel gespeichert.");
});

loadButton.addEventListener("click", () => {
  markUserActivated();
  sfx("ui");
  loadSavedGame();
});

fullscreenToggle.addEventListener("click", () => {
  sfx("ui");
  toggleFullscreen();
});

touchFullscreen.addEventListener("click", () => {
  sfx("ui");
  toggleFullscreen();
});

finaleContinue.addEventListener("click", () => {
  markUserActivated();
  state.flags.finaleSeen = true;
  sfx("ui");
  refreshUi();
  saveGame("");
});

touchVerbPrev.addEventListener("click", () => {
  markUserActivated();
  cycleVerb(-1);
});

touchVerbNext.addEventListener("click", () => {
  markUserActivated();
  cycleVerb(1);
});

touchAction.addEventListener("click", () => {
  touchPrimaryAction();
});

touchControlsEl.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    startTouchMove(button.dataset.move);
  });
  button.addEventListener("pointerup", stopTouchMove);
  button.addEventListener("pointercancel", stopTouchMove);
  button.addEventListener("lostpointercapture", stopTouchMove);
});

musicToggle.addEventListener("click", () => {
  markUserActivated();
  state.music = !state.music;
  refreshAudioToggles();
  if (state.music) {
    startBgm();
  } else {
    stopBgm();
  }
});

soundToggle.addEventListener("click", () => {
  markUserActivated();
  state.sound = !state.sound;
  refreshAudioToggles();
  if (state.sound) sfx("ui");
});

speechToggle.addEventListener("click", () => {
  markUserActivated();
  if (!speechSupported()) return;
  state.speech = !state.speech;
  refreshSpeechToggle();
  if (state.speech && state.lastDialogText) {
    dialogEl.classList.remove("hidden");
    state.dialogUntil = Math.max(state.dialogUntil, performance.now() + 2200);
    state.dialogSpeechToken = speakDialog(state.lastDialogText, state.lastDialogSpeaker);
    refreshContextUi();
  } else {
    stopSpeech();
  }
});

canvas.addEventListener("click", (event) => {
  if (performance.now() < suppressNextClickUntil) return;
  markUserActivated();
  const point = canvasPoint(event);
  handleSceneClick(point.x, point.y);
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse") return;
  event.preventDefault();
  suppressNextClickUntil = performance.now() + 520;
  markUserActivated();
  const point = canvasPoint(event);
  updateHover(point);
  handleSceneClick(point.x, point.y);
});

canvas.addEventListener("mousemove", (event) => {
  const point = canvasPoint(event);
  updateHover(point);
});

canvas.addEventListener("mouseleave", () => {
  state.hover = null;
  state.pathProbe = null;
  canvas.title = verbLabels[state.verb];
  refreshContextUi();
  updateCanvasCursor();
});

window.addEventListener("keydown", (event) => {
  markUserActivated();
  const index = Number(event.key) - 1;
  if (index >= 0 && index < verbs.length) {
    sfx("ui");
    setVerb(verbs[index]);
  }
  if (event.key.toLowerCase() === "escape") {
    if (!finalePanelEl.classList.contains("hidden")) {
      state.flags.finaleSeen = true;
      refreshUi();
      saveGame("");
      return;
    }
    dialogEl.classList.add("hidden");
    state.dialogUntil = 0;
    state.dialogSpeechToken = 0;
    state.selectedItem = null;
    stopSpeech();
    setVerb("walk");
    refreshContextUi();
  }
  if (event.key.toLowerCase() === "h") {
    state.showHotspots = !state.showHotspots;
    refreshHotspotToggle();
    sfx("ui");
  }
  if (event.key.toLowerCase() === "p") {
    state.showPathTrace = !state.showPathTrace;
    refreshPathToggle();
    sfx("ui");
  }
  if (event.key.toLowerCase() === "k") {
    state.showCompass = !state.showCompass;
    refreshCompassToggle();
    sfx("ui");
  }
  if (event.key === "?") {
    showSmartHint();
  }
  if (event.key.toLowerCase() === "j") {
    toggleJournal();
    sfx("ui");
  }
  if (event.key.toLowerCase() === "m") {
    toggleMap();
    sfx("ui");
  }
  if (event.key.toLowerCase() === "f") {
    toggleFullscreen();
    sfx("ui");
  }
  if (event.key.toLowerCase() === "s" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    saveGame("Spiel gespeichert.");
    sfx("ui");
  }
  if (event.key.toLowerCase() === "l" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    loadSavedGame();
    sfx("ui");
  }
});

document.addEventListener("fullscreenchange", refreshFullscreenToggle);

let last = performance.now();

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  updateActor(dt, now);
  hideDialogIfExpired(now);
  draw();
  requestAnimationFrame(loop);
}

loadAssets()
  .then(() => {
    const restored = loadSavedGame({ quiet: true });
    refreshUi();
    if (restored) {
      showToast("Spielstand geladen.");
    } else {
      showDialog("Malvin ist spaet dran fuer seine Magierpruefung. Sein Wecker wurde in einen Keks verwandelt. Der Keks bestreitet alles.", "neutral", 6200);
    }
    requestAnimationFrame(loop);
  })
  .catch((err) => {
    dialogEl.classList.remove("hidden");
    dialogTextEl.textContent = err.message;
    refreshContextUi();
  });
