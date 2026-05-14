(() => {
  "use strict";

  const WORLD_W = 1920;
  const WORLD_H = 1080;
  const FRAME_W = 192;
  const FRAME_H = 256;
  const ITEM_SIZE = 96;
  const STORAGE_KEY = "coconut-corsair-save-v1";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const sceneName = document.getElementById("sceneName");
  const statusLine = document.getElementById("statusLine");
  const commandSentence = document.getElementById("commandSentence");
  const dialogue = document.getElementById("dialogue");
  const speaker = document.getElementById("speaker");
  const line = document.getElementById("line");
  const choiceOptions = document.getElementById("choiceOptions");
  const miniGameEl = document.getElementById("miniGame");
  const miniTitle = document.getElementById("miniTitle");
  const miniPrompt = document.getElementById("miniPrompt");
  const miniStats = document.getElementById("miniStats");
  const miniChoices = document.getElementById("miniChoices");
  const miniClose = document.getElementById("miniClose");
  const verbs = document.getElementById("verbs");
  const inventoryEl = document.getElementById("inventory");
  const startScreen = document.getElementById("startScreen");
  const endingScreen = document.getElementById("endingScreen");
  const startButton = document.getElementById("startButton");
  const continueButton = document.getElementById("continueButton");
  const audioButton = document.getElementById("audioButton");
  const voiceButton = document.getElementById("voiceButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const saveButton = document.getElementById("saveButton");
  const resetButton = document.getElementById("resetButton");
  const questTracker = document.getElementById("questTracker");
  const questTitle = document.getElementById("questTitle");
  const questNext = document.getElementById("questNext");
  const questNeed = document.getElementById("questNeed");
  const loadingFill = document.getElementById("loadingFill");
  const loadingText = document.getElementById("loadingText");
  const loadingCounter = document.getElementById("loadingCounter");

  const imageSources = {
    harbor: "assets/backgrounds/harbor_imagen_hd.png",
    tavern: "assets/backgrounds/tavern_imagen_hd.png",
    jungle: "assets/backgrounds/jungle_imagen_hd.png",
    beach: "assets/backgrounds/beach_imagen_hd.png",
    market: "assets/backgrounds/market_imagen_hd.png",
    observatory: "assets/backgrounds/observatory_imagen_hd.png",
    characters: "assets/sprites/characters_imagen_hd_sheet.png?v=imagen-hd-characters-npc-size-lock",
    npcExtras: "assets/sprites/npcs_market_observatory_normalized_sheet.png?v=imagen-hd-npc-clean-v2",
    keeperSolid: "assets/sprites/keeper_moon_door_solid_sheet.png?v=keeper-solid-v2",
    items: "assets/sprites/items_imagen_hd_sheet.png",
    sceneItems: "assets/sprites/scene_items_imagen_hd_sheet.png",
  };

  const audioSources = {
    harbor: "assets/audio/bgm/moonlit-rum-islet.mp3",
    tavern: "assets/audio/bgm/tavern-tide.mp3",
    jungle: "assets/audio/bgm/tidewheel-cove.mp3",
    beach: "assets/audio/bgm/shoreline-rum-riddle.mp3",
    ending: "assets/audio/bgm/coconut-caper-loop.mp3",
    pickup: "assets/audio/pickup.wav",
    gate: "assets/audio/gate.wav",
    confirm: "assets/audio/ui_confirm.wav",
    chime: "assets/audio/chime.wav",
  };

  const itemMeta = {
    rope: { name: "Rope", icon: 0 },
    token: { name: "Token", icon: 1 },
    lime: { name: "Lime", icon: 2 },
    shellKey: { name: "Shell Key", icon: 3 },
    brassNote: { name: "Brass Note", icon: 4 },
    starCompass: { name: "Star Compass", icon: 5 },
    bottle: { name: "Message Bottle", icon: 6 },
    spyglass: { name: "Spyglass", icon: 7 },
  };

  const anims = {
    idle: { row: 0, frames: 16, fps: 7 },
    walkRight: { row: 1, frames: 16, fps: 14 },
    walkLeft: { row: 2, frames: 16, fps: 14 },
    talk: { row: 3, frames: 16, fps: 12 },
    pickup: { row: 4, frames: 10, fps: 13 },
    use: { row: 5, frames: 12, fps: 12 },
    dockmasterIdle: { row: 6, frames: [0, 1, 2, 1], fps: 0.9, blend: true },
    dockmasterTalk: { row: 6, frames: [2, 3, 4, 5, 6, 7, 8, 7, 6, 5], fps: 3.8, blend: true },
    barkeepIdle: { row: 7, frames: [0, 1, 2, 1], fps: 0.85, blend: true, cropTop: 38 },
    barkeepTalk: { row: 7, frames: [2, 3, 4, 5, 6, 7, 8, 9, 8, 7], fps: 3.6, blend: true, cropTop: 38 },
    smugglerIdle: { sheet: "npcExtras", row: 0, frames: [0, 1, 2, 3, 4, 5, 6, 5, 4, 3], fps: 0.62 },
    smugglerTalk: { sheet: "npcExtras", row: 1, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], fps: 3.1 },
    keeperIdle: { sheet: "keeperSolid", row: 1, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5], fps: 0.42 },
    keeperTalk: { sheet: "keeperSolid", row: 0, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], fps: 2.35 },
    archivistIdle: { sheet: "npcExtras", row: 2, frames: [0, 1, 2, 3, 4, 5, 6, 5, 4, 3], fps: 0.5 },
    archivistTalk: { sheet: "npcExtras", row: 3, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], fps: 2.65 },
  };

  const loadingLines = [
    "Füttere Affen mit Bananen",
    "Rücke die Augenklappe zurecht",
    "Sortiere Beleidigungen alphabetisch",
    "Poliere Messing, bis es wichtig wirkt",
    "Besteche den Papagei mit falschen Keksen",
    "Verstecke Gummihuhn im Inventar",
    "Stimme Mondtür auf dramatisches Knarzen",
    "Male weiße Umrisse auf echte Gegenstände",
    "Zähle Kokosnüsse, verliere Absicht",
    "Lade Rumfässer ohne Rum",
  ];

  const speakerActors = {
    Dockmaster: "dockmasterActor",
    Barkeep: "barkeepActor",
    Smuggler: "smugglerActor",
    Keeper: "keeperActor",
    Archivist: "archivistActor",
  };

  const state = {
    scene: "harbor",
    verb: "walk",
    activeItem: null,
    inventory: [],
    flags: {
      ropeTaken: false,
      tokenTaken: false,
      limeTaken: false,
      shellKeyTaken: false,
      bottleTaken: false,
      spyglassTaken: false,
      gotNote: false,
      skiffReady: false,
      lighthouseClue: false,
      bottleDecoded: false,
      glyphsRead: false,
      smugglerTip: false,
      starChartsRead: false,
      telescopeAligned: false,
      archivistClearance: false,
      reparteeWon: false,
      bananaShuffleWon: false,
      telescopeFocusWon: false,
      citrusSpitWon: false,
      hatchPeeked: false,
      shrineOpen: false,
      solved: false,
    },
    player: {
      x: 430,
      y: 856,
      target: null,
      facing: 1,
      action: "idle",
      actionUntil: 0,
      frameT: 0,
    },
    pending: null,
    hover: null,
    actorTalk: null,
    choiceHandlers: [],
    miniGame: null,
    quips: {},
    lineUntil: 0,
    started: false,
    lastTime: 0,
  };

  const images = {};
  const outlineCanvas = document.createElement("canvas");
  const outlineCtx = outlineCanvas.getContext("2d");

  const scenes = {
    harbor: {
      title: "Harbor",
      bg: "harbor",
      music: "harbor",
      walkY: 856,
      walkMin: 165,
      walkMax: 1715,
      actors: [
        { id: "dockmasterActor", idleAnim: "dockmasterIdle", talkAnim: "dockmasterTalk", x: 1168, y: 856, scale: 0.82 },
      ],
      exits: [
        { id: "toTavern", label: "Tavern", rect: [1395, 415, 445, 365], to: "tavern", spawn: [330, 856], walkTo: [1455, 856] },
        { id: "toBeach", label: "Beach", rect: [0, 430, 315, 430], to: "beach", spawn: [1510, 846], walkTo: [205, 856] },
        { id: "toMarket", label: "Moon Market", rect: [755, 250, 360, 420], to: "market", spawn: [940, 858], walkTo: [880, 856] },
      ],
      hotspots: [
        { id: "dockmaster", label: "Dockmaster", rect: [1062, 590, 220, 290], walkTo: [1010, 856], verbs: ["look", "talk"] },
        { id: "rope", label: "Rope Coil", rect: [575, 705, 190, 115], walkTo: [655, 856], hidden: () => state.flags.ropeTaken, verbs: ["look", "take"], item: "rope", itemPos: [650, 794, 88] },
        { id: "crate", label: "Crates", rect: [305, 640, 245, 155], walkTo: [530, 856], hidden: () => state.flags.tokenTaken, verbs: ["look", "take"], item: "token", itemPos: [505, 764, 66] },
        { id: "skiff", label: "Jungle Skiff", rect: [1385, 660, 500, 195], walkTo: [1515, 856], verbs: ["look", "use"] },
        { id: "lighthouse", label: "Moon Lighthouse", rect: [420, 185, 155, 285], walkTo: [640, 856], verbs: ["look", "use"] },
        { id: "lanternRig", label: "Lantern Rig", rect: [460, 265, 170, 315], walkTo: [615, 856], verbs: ["look", "use"] },
      ],
    },
    market: {
      title: "Moon Market",
      bg: "market",
      music: "harbor",
      walkY: 858,
      walkMin: 225,
      walkMax: 1690,
      actors: [
        { id: "smugglerActor", idleAnim: "smugglerIdle", talkAnim: "smugglerTalk", x: 1188, y: 858, scale: 0.74 },
      ],
      exits: [
        { id: "toHarbor", label: "Harbor", rect: [690, 365, 470, 360], to: "harbor", spawn: [880, 856], walkTo: [940, 858] },
        { id: "toObservatory", label: "Observatory", rect: [1478, 245, 360, 520], to: "observatory", spawn: [315, 842], walkTo: [1530, 858] },
      ],
      hotspots: [
        { id: "smuggler", label: "Soft-Spoken Smuggler", rect: [1090, 600, 230, 270], walkTo: [1045, 858], verbs: ["look", "talk", "use"] },
        { id: "fruitStand", label: "Questionable Fruit Stand", rect: [45, 455, 500, 285], walkTo: [455, 858], verbs: ["look", "use"] },
        { id: "pulleyRelic", label: "Rubber Pulley Relic", rect: [155, 160, 240, 225], walkTo: [390, 858], verbs: ["look", "use"] },
        { id: "ledger", label: "Three-Headed Ledger", rect: [510, 515, 250, 170], walkTo: [640, 858], verbs: ["look", "use"] },
        { id: "dirtJar", label: "Suspicious Jar", rect: [1350, 708, 170, 145], walkTo: [1360, 858], verbs: ["look", "use"] },
        { id: "marketSign", label: "Carved Market Sign", rect: [285, 85, 330, 185], walkTo: [560, 858], verbs: ["look"] },
      ],
    },
    tavern: {
      title: "Tavern",
      bg: "tavern",
      music: "tavern",
      walkY: 852,
      walkMin: 230,
      walkMax: 1660,
      actors: [
        { id: "barkeepActor", idleAnim: "barkeepIdle", talkAnim: "barkeepTalk", x: 1135, y: 842, scale: 0.84 },
      ],
      exits: [
        { id: "toHarbor", label: "Harbor", rect: [105, 300, 310, 470], to: "harbor", spawn: [1385, 856], walkTo: [305, 852] },
      ],
      hotspots: [
        { id: "barkeep", label: "Barkeep", rect: [1008, 552, 250, 290], walkTo: [935, 852], verbs: ["look", "talk", "use"] },
        { id: "lime", label: "Lime Bowl", rect: [640, 510, 160, 120], walkTo: [735, 852], hidden: () => state.flags.limeTaken, verbs: ["look", "take"], item: "lime", itemPos: [708, 618, 70] },
        { id: "chart", label: "Old Sea Chart", rect: [1308, 374, 292, 248], walkTo: [1395, 852], verbs: ["look"] },
        { id: "spyglass", label: "Brass Spyglass on Table", rect: [58, 690, 440, 225], walkTo: [390, 852], hidden: () => state.flags.spyglassTaken, verbs: ["look", "take"], item: "spyglass", itemPos: [244, 846, 112] },
        { id: "stage", label: "Tiny Stage", rect: [1500, 505, 330, 190], walkTo: [1485, 852], verbs: ["look", "use"] },
        { id: "mapChest", label: "Map Chest", rect: [1410, 565, 210, 115], walkTo: [1345, 852], verbs: ["look", "use"] },
      ],
    },
    observatory: {
      title: "Observatory",
      bg: "observatory",
      music: "jungle",
      walkY: 842,
      walkMin: 225,
      walkMax: 1650,
      actors: [
        { id: "archivistActor", idleAnim: "archivistIdle", talkAnim: "archivistTalk", x: 1320, y: 842, scale: 0.76 },
      ],
      exits: [
        { id: "toMarket", label: "Moon Market", rect: [0, 230, 325, 570], to: "market", spawn: [1490, 858], walkTo: [280, 842] },
        { id: "toJungle", label: "Shrine Path", rect: [1590, 185, 300, 520], to: "jungle", spawn: [1425, 822], walkTo: [1570, 842] },
      ],
      hotspots: [
        { id: "archivist", label: "Sleepless Archivist", rect: [1225, 565, 220, 285], walkTo: [1160, 842], verbs: ["look", "talk", "use"] },
        { id: "telescope", label: "Moon Telescope", rect: [780, 330, 390, 310], walkTo: [930, 842], verbs: ["look", "use"] },
        { id: "starCharts", label: "Star Charts", rect: [565, 420, 310, 270], walkTo: [650, 842], verbs: ["look", "use"] },
        { id: "fedoraRelic", label: "Well-Travelled Hat", rect: [1160, 325, 150, 95], walkTo: [1230, 842], verbs: ["look", "use"] },
        { id: "crystalMug", label: "Crystal Skull Mug", rect: [1325, 380, 195, 170], walkTo: [1320, 842], verbs: ["look", "use"] },
        { id: "archiveHatch", label: "Round Archive Hatch", rect: [415, 790, 360, 185], walkTo: [660, 842], verbs: ["look", "use"] },
        { id: "redCurtain", label: "Suspicious Red Curtain", rect: [1240, 330, 205, 395], walkTo: [1300, 842], verbs: ["look", "use"] },
      ],
    },
    beach: {
      title: "Wreck Beach",
      bg: "beach",
      music: "beach",
      walkY: 846,
      walkMin: 170,
      walkMax: 1710,
      actors: [],
      exits: [
        { id: "toHarbor", label: "Harbor", rect: [1355, 150, 500, 610], to: "harbor", spawn: [250, 856], walkTo: [1485, 846] },
      ],
      hotspots: [
        { id: "shipCabin", label: "Broken Captain's Cabin", rect: [640, 330, 420, 300], walkTo: [895, 846], verbs: ["look", "use"] },
        { id: "wreck", label: "Shipwreck", rect: [500, 245, 650, 450], walkTo: [930, 846], verbs: ["look", "use"] },
        { id: "tidepool", label: "Tide Pool", rect: [780, 670, 520, 230], walkTo: [970, 846], hidden: () => state.flags.shellKeyTaken, verbs: ["look", "take"], item: "shellKey", itemPos: [1030, 866, 74] },
        { id: "bottle", label: "Message Bottle", rect: [1610, 735, 190, 120], walkTo: [1510, 846], hidden: () => state.flags.bottleTaken, verbs: ["look", "take"], item: "bottle", itemPos: [1695, 862, 84] },
        { id: "cliff", label: "Cliff Path", rect: [1365, 120, 470, 450], walkTo: [1455, 846], verbs: ["look", "use"] },
        { id: "stormBarrel", label: "Storm Barrel", rect: [45, 695, 195, 145], walkTo: [260, 846], verbs: ["look", "use"] },
      ],
    },
    jungle: {
      title: "Jungle Shrine",
      bg: "jungle",
      music: "jungle",
      walkY: 822,
      walkMin: 250,
      walkMax: 1620,
      actors: [
        { id: "keeperActor", idleAnim: "keeperIdle", talkAnim: "keeperTalk", x: 1185, y: 822, scale: 0.82 },
      ],
      exits: [
        { id: "toHarbor", label: "Harbor", rect: [1230, 560, 565, 330], to: "harbor", spawn: [1555, 856], walkTo: [1425, 822] },
      ],
      hotspots: [
        { id: "keeper", label: "Shrine Keeper", rect: [1090, 555, 220, 285], walkTo: [1015, 822], verbs: ["look", "talk"] },
        { id: "shrineDoor", label: "Moon Door", rect: [405, 215, 430, 425], walkTo: [640, 822], verbs: ["look", "use"] },
        { id: "vines", label: "Jungle Vines", rect: [150, 30, 285, 600], walkTo: [420, 822], verbs: ["look", "use"] },
        { id: "waterfall", label: "Mist Falls", rect: [980, 210, 470, 430], walkTo: [1120, 822], verbs: ["look", "use"] },
        { id: "bridge", label: "Rope Bridge", rect: [1220, 610, 300, 190], walkTo: [1390, 822], verbs: ["look", "use"] },
        { id: "glyphs", label: "Stone Glyphs", rect: [220, 105, 190, 300], walkTo: [455, 822], verbs: ["look", "use"] },
      ],
    },
  };

  const exitMarkers = {
    harbor: {
      toTavern: { x: 1708, y: 545, dir: "right", label: "To Tavern" },
      toBeach: { x: 178, y: 605, dir: "left", label: "To Beach" },
      toMarket: { x: 955, y: 430, dir: "right", label: "To Market" },
    },
    market: {
      toHarbor: { x: 910, y: 520, dir: "left", label: "To Harbor" },
      toObservatory: { x: 1688, y: 500, dir: "right", label: "To Observatory" },
    },
    tavern: {
      toHarbor: { x: 190, y: 520, dir: "left", label: "To Harbor" },
    },
    observatory: {
      toMarket: { x: 170, y: 548, dir: "left", label: "To Market" },
      toJungle: { x: 1715, y: 520, dir: "right", label: "To Shrine" },
    },
    beach: {
      toHarbor: { x: 1645, y: 620, dir: "right", label: "To Harbor" },
    },
    jungle: {
      toHarbor: { x: 1652, y: 652, dir: "right", label: "To Harbor" },
    },
  };

  const hotspotOutlines = {
    dockmaster: { kind: "actor", actor: "dockmasterActor" },
    barkeep: { kind: "actor", actor: "barkeepActor" },
    smuggler: { kind: "actor", actor: "smugglerActor" },
    keeper: { kind: "actor", actor: "keeperActor" },
    archivist: { kind: "actor", actor: "archivistActor" },
    skiff: { kind: "polygon", smooth: true, points: [[1298, 692], [1405, 652], [1548, 640], [1738, 662], [1842, 710], [1818, 760], [1708, 802], [1512, 814], [1368, 790], [1292, 742]] },
    lighthouse: { kind: "polygon", points: [[438, 456], [455, 290], [505, 222], [548, 294], [562, 456], [522, 493], [460, 490]] },
    lanternRig: { kind: "polygon", points: [[492, 258], [604, 264], [620, 548], [580, 568], [510, 560], [472, 420]] },
    chart: { kind: "polygon", points: [[1318, 388], [1570, 408], [1552, 612], [1306, 588]] },
    stage: { kind: "polygon", points: [[1484, 588], [1625, 520], [1830, 532], [1840, 690], [1550, 704]] },
    mapChest: { kind: "polygon", points: [[1414, 580], [1588, 558], [1624, 648], [1458, 684], [1392, 628]] },
    wreck: { kind: "polygon", points: [[520, 545], [660, 170], [910, 265], [1135, 520], [1010, 705], [610, 690]] },
    shipCabin: { kind: "polygon", points: [[620, 492], [710, 315], [932, 338], [1078, 520], [1005, 645], [685, 625]] },
    stormBarrel: { kind: "polygon", points: [[58, 735], [140, 704], [230, 740], [210, 840], [92, 852]] },
    cliff: { kind: "polygon", points: [[1440, 150], [1810, 112], [1800, 555], [1602, 652], [1370, 520]] },
    shrineDoor: { kind: "polygon", smooth: true, points: [[454, 600], [404, 544], [392, 442], [426, 322], [506, 220], [616, 176], [728, 208], [798, 306], [834, 430], [804, 558], [734, 640], [600, 666], [500, 640]] },
    vines: { kind: "polygon", points: [[160, 42], [342, 35], [430, 330], [390, 612], [214, 650], [120, 320]] },
    waterfall: { kind: "polygon", points: [[1020, 300], [1125, 220], [1320, 238], [1445, 345], [1400, 610], [1112, 668], [960, 560]] },
    bridge: { kind: "polygon", points: [[1215, 645], [1395, 595], [1720, 642], [1765, 752], [1540, 830], [1260, 770]] },
    glyphs: { kind: "polygon", points: [[220, 108], [372, 96], [410, 270], [330, 420], [215, 365], [180, 205]] },
    fruitStand: { kind: "polygon", points: [[50, 595], [160, 465], [410, 455], [530, 570], [500, 725], [130, 760]] },
    pulleyRelic: { kind: "polygon", points: [[170, 180], [350, 150], [410, 260], [332, 360], [178, 330]] },
    ledger: { kind: "polygon", points: [[510, 548], [715, 512], [764, 640], [560, 692]] },
    dirtJar: { kind: "polygon", smooth: true, points: [[1375, 724], [1468, 714], [1518, 760], [1498, 842], [1405, 858], [1348, 812]] },
    marketSign: { kind: "polygon", points: [[295, 112], [585, 104], [620, 236], [330, 268]] },
    telescope: { kind: "polygon", smooth: true, points: [[805, 432], [885, 378], [1038, 340], [1158, 430], [1130, 488], [1048, 488], [1012, 530], [970, 654], [906, 646], [944, 520], [780, 514]] },
    starCharts: { kind: "polygon", points: [[585, 458], [828, 424], [846, 638], [604, 690]] },
    fedoraRelic: { kind: "polygon", smooth: true, points: [[1166, 382], [1218, 336], [1298, 350], [1310, 395], [1235, 424]] },
    crystalMug: { kind: "polygon", points: [[1338, 410], [1494, 386], [1520, 508], [1368, 548]] },
    archiveHatch: { kind: "polygon", smooth: true, points: [[430, 885], [474, 820], [604, 792], [746, 822], [780, 910], [692, 972], [520, 970]] },
    redCurtain: { kind: "polygon", points: [[1274, 342], [1420, 338], [1455, 700], [1350, 758], [1248, 682]] },
  };

  const sceneAmbience = {
    harbor: {
      glows: [
        { x: 92, y: 543, radius: 150, rgb: "255, 178, 82", alpha: 0.16, phase: 0.1 },
        { x: 532, y: 367, radius: 126, rgb: "255, 186, 92", alpha: 0.15, phase: 2.2 },
        { x: 626, y: 536, radius: 74, rgb: "255, 201, 115", alpha: 0.11, phase: 4.1 },
        { x: 1270, y: 448, radius: 62, rgb: "255, 192, 96", alpha: 0.09, phase: 1.4 },
        { x: 1540, y: 650, radius: 78, rgb: "255, 178, 82", alpha: 0.12, phase: 3.3 },
      ],
      water: { x: 335, y: 470, w: 1225, h: 260, rows: 18, rgb: "140, 207, 224", alpha: 0.06, drift: 0.045 },
      reflections: [
        { x: 532, y: 445, h: 190, rgb: "255, 198, 96", phase: 1.2 },
        { x: 1540, y: 618, h: 130, rgb: "255, 183, 88", phase: 2.8 },
      ],
    },
    tavern: {
      glows: [
        { x: 820, y: 168, radius: 250, rgb: "255, 149, 76", alpha: 0.11, phase: 1.1 },
        { x: 1018, y: 430, radius: 190, rgb: "255, 170, 88", alpha: 0.1, phase: 3.6 },
        { x: 1430, y: 410, radius: 142, rgb: "255, 195, 112", alpha: 0.08, phase: 5.2 },
      ],
      motes: { x: 250, y: 120, w: 1340, h: 510, count: 18, rgb: "255, 220, 154", alpha: 0.048 },
    },
    market: {
      glows: [
        { x: 160, y: 255, radius: 170, rgb: "255, 178, 82", alpha: 0.13, phase: 0.7 },
        { x: 740, y: 390, radius: 155, rgb: "255, 195, 105", alpha: 0.11, phase: 2.2 },
        { x: 1390, y: 250, radius: 178, rgb: "255, 168, 80", alpha: 0.12, phase: 4.0 },
        { x: 1780, y: 592, radius: 140, rgb: "255, 205, 112", alpha: 0.11, phase: 1.3 },
      ],
      water: { x: 790, y: 315, w: 420, h: 255, rows: 10, rgb: "120, 198, 228", alpha: 0.045, drift: 0.034 },
      reflections: [
        { x: 832, y: 472, h: 120, rgb: "255, 198, 96", phase: 1.1 },
        { x: 1115, y: 452, h: 126, rgb: "142, 204, 238", phase: 2.6 },
      ],
      motes: { x: 120, y: 140, w: 1650, h: 610, count: 24, rgb: "255, 226, 160", alpha: 0.038 },
      smoke: { x: 40, y: 280, w: 760, h: 270, rows: 7, rgb: "226, 201, 164", alpha: 0.024 },
      cloth: [
        { x: 72, y: 472, w: 450, h: 86, strips: 5, rgb: "255, 169, 94", alpha: 0.04, phase: 0.2 },
        { x: 1260, y: 628, w: 360, h: 70, strips: 4, rgb: "255, 213, 122", alpha: 0.036, phase: 2.8 },
      ],
      sparkles: { x: 135, y: 170, w: 1590, h: 520, count: 20, rgb: "255, 232, 166", alpha: 0.06 },
    },
    beach: {
      glows: [
        { x: 1578, y: 92, radius: 330, rgb: "214, 232, 210", alpha: 0.07, phase: 0.6 },
        { x: 1045, y: 760, radius: 170, rgb: "255, 215, 126", alpha: 0.045, phase: 2.4 },
      ],
      water: { x: 0, y: 520, w: 1340, h: 300, rows: 18, rgb: "157, 217, 226", alpha: 0.07, drift: 0.058 },
      surf: { x: 285, y: 642, w: 980, rows: 7, rgb: "232, 239, 218", alpha: 0.07 },
    },
    jungle: {
      glows: [
        { x: 410, y: 458, radius: 122, rgb: "255, 154, 72", alpha: 0.09, phase: 0.8 },
        { x: 870, y: 452, radius: 122, rgb: "255, 174, 82", alpha: 0.09, phase: 3.8 },
        { x: 1320, y: 165, radius: 330, rgb: "171, 235, 162", alpha: 0.05, phase: 2.1 },
      ],
      motes: { x: 440, y: 90, w: 1040, h: 470, count: 16, rgb: "128, 235, 171", alpha: 0.042 },
      mist: { x: 920, y: 470, w: 780, h: 230, rows: 6, rgb: "164, 226, 204", alpha: 0.032 },
      runes: { x: 620, y: 454, rx: 174, ry: 220, count: 18, rgb: "255, 226, 148", alpha: 0.052 },
      sparkles: { x: 455, y: 270, w: 410, h: 360, count: 16, rgb: "255, 231, 158", alpha: 0.058 },
    },
    observatory: {
      glows: [
        { x: 734, y: 594, radius: 190, rgb: "255, 198, 112", alpha: 0.11, phase: 0.4 },
        { x: 58, y: 470, radius: 132, rgb: "255, 190, 92", alpha: 0.09, phase: 2.7 },
        { x: 1625, y: 315, radius: 154, rgb: "255, 179, 90", alpha: 0.085, phase: 4.6 },
      ],
      motes: { x: 360, y: 110, w: 960, h: 580, count: 26, rgb: "185, 218, 255", alpha: 0.05 },
      mist: { x: 550, y: 155, w: 520, h: 470, rows: 6, rgb: "170, 205, 255", alpha: 0.026 },
      beams: [
        { x: 710, y: 45, w: 250, h: 520, tilt: -125, rgb: "170, 207, 255", alpha: 0.045, phase: 0.2 },
        { x: 945, y: 0, w: 210, h: 610, tilt: 90, rgb: "158, 196, 255", alpha: 0.036, phase: 2.8 },
      ],
      cloth: [
        { x: 1255, y: 348, w: 185, h: 370, strips: 5, rgb: "255, 114, 92", alpha: 0.03, phase: 1.7, vertical: true },
      ],
      lens: [
        { x: 905, y: 462, radius: 84, rgb: "178, 219, 255", alpha: 0.045, phase: 0.9 },
        { x: 626, y: 536, radius: 46, rgb: "255, 226, 160", alpha: 0.032, phase: 3.2 },
      ],
      sparkles: { x: 430, y: 130, w: 835, h: 500, count: 18, rgb: "195, 222, 255", alpha: 0.072 },
    },
  };

  class AudioDesk {
    constructor() {
      this.enabled = false;
      this.current = null;
      this.tracks = {};
      this.musicKeys = new Set(["harbor", "tavern", "jungle", "beach", "ending"]);
      Object.entries(audioSources).forEach(([key, src]) => {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.volume = this.musicKeys.has(key) ? 0.34 : 0.58;
        audio.loop = this.musicKeys.has(key);
        this.tracks[key] = audio;
      });
    }

    async enable() {
      this.enabled = true;
      audioButton.textContent = "Mute";
      return this.playMusic(scenes[state.scene].music);
    }

    mute() {
      this.enabled = false;
      audioButton.textContent = "Audio";
      Object.values(this.tracks).forEach((audio) => audio.pause());
      this.current = null;
    }

    async playMusic(key) {
      if (!this.enabled) return false;
      if (this.current === key && this.tracks[key] && !this.tracks[key].paused) return true;
      if (this.current && this.tracks[this.current]) this.tracks[this.current].pause();
      const track = this.tracks[key];
      if (!track) return false;
      track.currentTime = 0;
      try {
        await track.play();
        this.current = key;
        return true;
      } catch {
        this.enabled = false;
        this.current = null;
        audioButton.textContent = "Audio";
        return false;
      }
    }

    sfx(key) {
      if (!this.enabled) return;
      const source = this.tracks[key];
      if (!source) return;
      const clone = source.cloneNode(true);
      clone.volume = source.volume;
      clone.play().catch(() => {});
    }
  }

  const audio = new AudioDesk();

  class SpeechDesk {
    constructor() {
      this.enabled = localStorage.getItem("coconut-corsair-voice") === "on";
      this.voices = [];
      this.supported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
      this.updateButton();
      if (this.supported) {
        this.voices = window.speechSynthesis.getVoices();
        window.speechSynthesis.addEventListener("voiceschanged", () => {
          this.voices = window.speechSynthesis.getVoices();
        });
      }
    }

    updateButton() {
      voiceButton.textContent = this.enabled ? "Voice On" : "Voice";
      voiceButton.disabled = !this.supported;
      voiceButton.title = this.supported ? "Voice" : "Voice is not supported in this browser";
    }

    toggle() {
      if (!this.supported) return;
      this.enabled = !this.enabled;
      localStorage.setItem("coconut-corsair-voice", this.enabled ? "on" : "off");
      if (!this.enabled) window.speechSynthesis.cancel();
      this.updateButton();
      if (this.enabled) this.say("Mara", "Voice enabled.");
    }

    pickVoice(who) {
      const lower = who.toLowerCase();
      const preferred = lower === "keeper" ? ["en-GB", "English"] : ["en-US", "English"];
      return this.voices.find((voice) => preferred.some((needle) => voice.lang.includes(needle) || voice.name.includes(needle)))
        || this.voices.find((voice) => voice.lang.startsWith("en"))
        || this.voices[0]
        || null;
    }

    say(who, text) {
      if (!this.enabled || !this.supported || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      utterance.pitch = 1.02;
      if (who === "Dockmaster") {
        utterance.rate = 0.88;
        utterance.pitch = 0.82;
      } else if (who === "Barkeep") {
        utterance.rate = 0.98;
        utterance.pitch = 0.92;
      } else if (who === "Smuggler") {
        utterance.rate = 0.86;
        utterance.pitch = 0.78;
      } else if (who === "Keeper") {
        utterance.rate = 0.82;
        utterance.pitch = 0.72;
      } else if (who === "Archivist") {
        utterance.rate = 0.9;
        utterance.pitch = 1.08;
      }
      const voice = this.pickVoice(who);
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    }
  }

  const speech = new SpeechDesk();

  function loadImage(key, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        images[key] = img;
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Could not load ${src}`));
      img.src = src;
    });
  }

  function updateLoading(done, total, ready = false) {
    if (!loadingFill || !loadingText || !loadingCounter) return;
    const count = ready ? 70 : Math.min(69, Math.max(1, Math.round((done / Math.max(1, total)) * 68)));
    loadingFill.style.width = `${(count / 70) * 100}%`;
    loadingCounter.textContent = `${count}/70`;
    loadingText.textContent = ready ? "Abenteuer entkorkt" : loadingLines[done % loadingLines.length];
  }

  async function preloadImages() {
    const entries = Object.entries(imageSources);
    let done = 0;
    updateLoading(0, entries.length);
    await Promise.all(entries.map(([key, src]) => loadImage(key, src).then((img) => {
      done += 1;
      updateLoading(done, entries.length);
      return img;
    })));
    updateLoading(entries.length, entries.length, true);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getScene() {
    return scenes[state.scene];
  }

  function worldFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / WORLD_W, rect.height / WORLD_H);
    const drawW = WORLD_W * scale;
    const drawH = WORLD_H * scale;
    const offX = (rect.width - drawW) / 2;
    const offY = (rect.height - drawH) / 2;
    return {
      x: clamp((event.clientX - rect.left - offX) / scale, 0, WORLD_W),
      y: clamp((event.clientY - rect.top - offY) / scale, 0, WORLD_H),
    };
  }

  function pointInRect(point, rect) {
    return point.x >= rect[0] && point.y >= rect[1] && point.x <= rect[0] + rect[2] && point.y <= rect[1] + rect[3];
  }

  function availableHotspots(scene = getScene()) {
    return scene.hotspots.filter((spot) => !spot.hidden || !spot.hidden());
  }

  function findHotspot(point) {
    const scene = getScene();
    const hotspot = availableHotspots(scene).find((spot) => pointInRect(point, spot.rect));
    if (hotspot) return { type: "hotspot", data: hotspot };
    const exit = scene.exits.find((candidate) => pointInRect(point, candidate.rect));
    if (exit) return { type: "exit", data: exit };
    return null;
  }

  function setVerb(verb) {
    state.verb = verb;
    state.activeItem = null;
    updateVerbButtons();
    updateInventory();
  }

  function updateVerbButtons() {
    verbs.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("active", button.dataset.verb === state.verb);
    });
  }

  function setStatus(text) {
    statusLine.textContent = text;
    if (commandSentence) commandSentence.textContent = text;
  }

  function hasItem(id) {
    return state.inventory.includes(id);
  }

  function addItem(id) {
    if (hasItem(id)) return false;
    state.inventory.push(id);
    updateInventory();
    updateQuestTracker();
    audio.sfx("pickup");
    return true;
  }

  function removeItem(id) {
    state.inventory = state.inventory.filter((item) => item !== id);
    if (state.activeItem === id) state.activeItem = null;
    updateInventory();
    updateQuestTracker();
  }

  function updateInventory() {
    inventoryEl.innerHTML = "";
    state.inventory.forEach((id) => {
      const meta = itemMeta[id];
      if (!meta) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "inventoryItem";
      button.title = meta.name;
      button.setAttribute("aria-label", meta.name);
      button.classList.toggle("active", state.activeItem === id);
      const col = meta.icon % 4;
      const row = Math.floor(meta.icon / 4);
      button.style.setProperty("--icon-sheet", `url("${imageSources.sceneItems}")`);
      button.style.setProperty("--icon-pos", `${-col * 54 - 9}px ${-row * 54 - 9}px`);
      button.addEventListener("click", () => {
        state.activeItem = state.activeItem === id ? null : id;
        state.verb = "use";
        updateVerbButtons();
        updateInventory();
        setStatus(state.activeItem ? `Use ${meta.name} with...` : "Choose a command.");
      });
      inventoryEl.appendChild(button);
    });
  }

  function getQuestState() {
    const hasRope = state.flags.ropeTaken || hasItem("rope");
    const hasToken = state.flags.tokenTaken || hasItem("token");
    const hasVerse = state.flags.gotNote || hasItem("brassNote");
    const hasShell = state.flags.shellKeyTaken || hasItem("shellKey");
    const skiffReady = state.flags.skiffReady;
    const solved = state.flags.solved || hasItem("starCompass");
    if (solved) {
      return {
        title: "Complete",
        next: "Done: the Star Compass is yours.",
        need: "Location: Treasure recovered",
        hint: "The compass is safe. Keep exploring or reload if you want another run.",
        current: "door",
      };
    }

    if (!hasRope) {
      return {
        title: "Next Step",
        next: "Take the Rope Coil on the harbor dock.",
        need: "Location: Harbor",
        hint: "Use Take on the Rope Coil near the left-middle dock.",
        current: "rope",
      };
    }

    if (!hasVerse) {
      if (!hasToken) {
        return {
          title: "Next Step",
          next: "Take the Copper Token from the harbor crates.",
          need: "Location: Harbor",
          hint: "Use Take on the Crates near the middle of the harbor.",
          current: "token",
        };
      }
      return {
        title: "Next Step",
        next: "Talk to the Barkeep and spend the Copper Token.",
        need: "Location: Tavern",
        hint: "Walk to the tavern, then Talk to the Barkeep while carrying the token.",
        current: "verse",
      };
    }

    if (!state.flags.smugglerTip) {
      return {
        title: "Next Step",
        next: "Ask the Smuggler about the moon verse.",
        need: "Location: Moon Market",
        hint: "Walk from Harbor to the Moon Market, then Talk to the Soft-Spoken Smuggler.",
        current: "smuggler",
      };
    }

    if (!state.flags.starChartsRead) {
      return {
        title: "Next Step",
        next: "Match the Brass Note with the Star Charts.",
        need: "Location: Observatory",
        hint: "Go through the Moon Market to the Observatory, select the Brass Note, then use it with the Star Charts.",
        current: "starCharts",
      };
    }

    if (!state.flags.telescopeAligned) {
      return {
        title: "Next Step",
        next: "Align the Moon Telescope with the Spyglass.",
        need: "Location: Observatory",
        hint: "Take the Spyglass in the Tavern, then use it with the Moon Telescope.",
        current: "telescope",
      };
    }

    if (!state.flags.archivistClearance) {
      return {
        title: "Next Step",
        next: "Tell the Archivist what the telescope revealed.",
        need: "Location: Observatory",
        hint: "Talk to the Sleepless Archivist after the Star Charts and Moon Telescope are aligned.",
        current: "archivist",
      };
    }

    if (!hasShell) {
      return {
        title: "Next Step",
        next: "Take the Shell Key from the tide pool.",
        need: "Location: Wreck Beach",
        hint: "Go to Wreck Beach and use Take on the Tide Pool near the sand.",
        current: "shell",
      };
    }

    if (!skiffReady) {
      return {
        title: "Next Step",
        next: "Use the Rope with the Jungle Skiff.",
        need: "Location: Harbor",
        hint: "Return to Harbor, choose Use, select the Rope, then click the Jungle Skiff.",
        current: "skiff",
      };
    }

    return {
      title: "Next Step",
      next: "Open the Moon Door with the Shell Key.",
      need: "Location: Jungle Shrine",
      hint: "Click the tied skiff in Harbor to reach the jungle, then Use Shell Key with Moon Door.",
      current: "door",
    };
  }

  function updateQuestTracker() {
    if (!questTracker || !questTitle || !questNext || !questNeed) return;
    const quest = getQuestState();
    questTitle.textContent = quest.title;
    questNext.textContent = quest.next;
    questNeed.textContent = quest.need;
  }

  function getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function isMobileMode() {
    const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    const compact = window.matchMedia?.("(max-width: 820px)")?.matches;
    const mobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    return Boolean(mobileUA || (coarse && compact) || (navigator.maxTouchPoints > 1 && window.innerWidth <= 980));
  }

  function updateFullscreenButton() {
    if (!fullscreenButton) return;
    const canRequest = Boolean(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
    const canExit = Boolean(document.exitFullscreen || document.webkitExitFullscreen);
    const active = Boolean(getFullscreenElement());
    fullscreenButton.disabled = !(canRequest && canExit);
    fullscreenButton.textContent = active ? "Exit" : "Full";
    fullscreenButton.title = active ? "Exit fullscreen" : "Fullscreen";
    fullscreenButton.setAttribute("aria-pressed", active ? "true" : "false");
  }

  async function requestAppFullscreen() {
    if (getFullscreenElement()) return true;
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    } else if (document.documentElement.webkitRequestFullscreen) {
      await document.documentElement.webkitRequestFullscreen();
    } else {
      return false;
    }
    updateFullscreenButton();
    return true;
  }

  async function exitAppFullscreen() {
    if (screen.orientation?.unlock) screen.orientation.unlock();
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
    updateFullscreenButton();
  }

  async function lockLandscapeOrientation() {
    if (!screen.orientation?.lock) return false;
    for (const mode of ["landscape", "landscape-primary"]) {
      try {
        await screen.orientation.lock(mode);
        return true;
      } catch {
        // Try the next browser-supported spelling.
      }
    }
    return false;
  }

  async function enterMobileImmersiveMode() {
    if (!isMobileMode()) return false;
    let fullscreenOk = false;
    try {
      fullscreenOk = await requestAppFullscreen();
    } catch {
      fullscreenOk = false;
    }
    if (fullscreenOk) await lockLandscapeOrientation();
    if (window.innerHeight > window.innerWidth) setStatus("Rotate to landscape for the full view.");
    updateFullscreenButton();
    return fullscreenOk;
  }

  async function toggleFullscreen() {
    if (!fullscreenButton || fullscreenButton.disabled) return;
    try {
      if (getFullscreenElement()) {
        await exitAppFullscreen();
      } else {
        await requestAppFullscreen();
        if (isMobileMode()) await lockLandscapeOrientation();
      }
    } catch {
      setStatus("Fullscreen is not available here.");
    }
    updateFullscreenButton();
  }

  function clearChoices() {
    state.choiceHandlers = [];
    if (choiceOptions) choiceOptions.innerHTML = "";
    dialogue.classList.remove("hasChoices");
  }

  function say(who, text, ms = 3600) {
    clearChoices();
    speaker.textContent = who;
    line.textContent = text;
    dialogue.classList.add("visible");
    state.lineUntil = performance.now() + ms;
    const actorId = speakerActors[who];
    state.actorTalk = actorId ? { id: actorId, until: state.lineUntil } : null;
    speech.say(who, text);
  }

  function ask(who, prompt, options) {
    clearChoices();
    speaker.textContent = who;
    line.textContent = prompt;
    state.choiceHandlers = options;
    if (choiceOptions) {
      options.forEach((option, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choiceButton";
        button.dataset.choice = String(index);
        button.textContent = option.text;
        choiceOptions.appendChild(button);
      });
    }
    dialogue.classList.add("visible", "hasChoices");
    state.lineUntil = 0;
    const actorId = speakerActors[who];
    state.actorTalk = actorId ? { id: actorId, until: performance.now() + 10000 } : null;
    speech.say(who, prompt);
  }

  function chooseDialogue(index) {
    const option = state.choiceHandlers[index];
    if (!option) return false;
    clearChoices();
    if (option.run) option.run();
    if (option.action) {
      option.action();
      updateQuestTracker();
      saveGame(false);
      return true;
    }
    say(option.replyWho || speaker.textContent || "Mara", option.reply, option.ms || 4200);
    updateQuestTracker();
    saveGame(false);
    return true;
  }

  function closeMiniGame() {
    state.miniGame = null;
    if (miniGameEl) miniGameEl.hidden = true;
    if (miniChoices) miniChoices.innerHTML = "";
  }

  function openMiniGame(config) {
    clearChoices();
    dialogue.classList.remove("visible");
    state.actorTalk = null;
    state.lineUntil = 0;
    state.miniGame = {
      ...config,
      round: 0,
      score: 0,
      feedback: config.intro || "",
    };
    if (miniGameEl) miniGameEl.hidden = false;
    renderMiniGame();
  }

  function renderMiniGame() {
    const game = state.miniGame;
    if (!game || !miniTitle || !miniPrompt || !miniStats || !miniChoices) return;
    const round = game.rounds[game.round];
    miniTitle.textContent = game.title;
    miniPrompt.textContent = round.prompt;
    miniStats.textContent = `Round ${game.round + 1}/${game.rounds.length} - Score ${game.score}/${game.rounds.length}${game.feedback ? ` - ${game.feedback}` : ""}`;
    miniChoices.innerHTML = "";
    round.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "miniChoice";
      button.dataset.choice = String(index);
      button.textContent = choice;
      miniChoices.appendChild(button);
    });
  }

  function chooseMiniGame(index) {
    const game = state.miniGame;
    if (!game) return false;
    const round = game.rounds[game.round];
    const correct = index === round.correct;
    if (correct) {
      game.score += 1;
      audio.sfx("confirm");
    }
    game.feedback = correct ? (round.good || "Correct.") : (round.bad || "Not quite.");
    game.round += 1;
    if (game.round >= game.rounds.length) {
      const won = game.score >= (game.need || game.rounds.length);
      const score = game.score;
      const onFinish = game.onFinish;
      closeMiniGame();
      if (onFinish) onFinish(won, score);
      updateQuestTracker();
      saveGame(false);
      return true;
    }
    renderMiniGame();
    return true;
  }

  function startReparteeGame() {
    openMiniGame({
      title: "Moon-Market Repartee",
      intro: "Choose the comeback with the least dignity loss.",
      need: 2,
      rounds: [
        {
          prompt: "Smuggler: Your map looks like it was drawn by a sleepy squid.",
          choices: ["Then your prices must be ink tax.", "At least the squid had depth perception.", "I only read maps upside down."],
          correct: 1,
          good: "The smuggler laughs despite himself.",
          bad: "The smuggler writes that down as evidence.",
        },
        {
          prompt: "Smuggler: I have met seaweed with stronger negotiation skills.",
          choices: ["Seaweed knows when to cling.", "And I have met invoices with warmer hearts.", "I charge extra for floating."],
          correct: 1,
          good: "A small crowd pretends not to listen.",
          bad: "A barrel nearby wins the exchange.",
        },
        {
          prompt: "Smuggler: You swing wit like a wet mop.",
          choices: ["Good. I was aiming for your floor-level ethics.", "Wet mops are traditional here.", "My mop has union representation."],
          correct: 0,
          good: "He gives the tiniest defeated bow.",
          bad: "The mop comparison survives.",
        },
      ],
      onFinish: (won, score) => {
        state.flags.reparteeWon = won || state.flags.reparteeWon;
        say("Smuggler", won
          ? `Fine. ${score} clean hits. You may insult my business model, but not my tailoring.`
          : "A brave attempt. The mop remains undefeated.");
      },
    });
  }

  function startBananaShuffleGame() {
    openMiniGame({
      title: "Banana Shell Shuffle",
      intro: "Follow the banana, distrust the baskets.",
      need: 2,
      rounds: [
        {
          prompt: "A banana vanishes under three coconut cups. The left cup coughs suspiciously.",
          choices: ["Left cup", "Middle cup", "Right cup"],
          correct: 2,
          good: "The right cup smells faintly of victory.",
          bad: "That cup contains only stage fright.",
        },
        {
          prompt: "The vendor spins the cups and mutters something about maritime fruit law.",
          choices: ["Left cup", "Middle cup", "Right cup"],
          correct: 0,
          good: "Banana located. Dignity still missing.",
          bad: "A tiny peel mocks you.",
        },
        {
          prompt: "Final shuffle: one cup glides too smoothly, like it has legal counsel.",
          choices: ["Left cup", "Middle cup", "Right cup"],
          correct: 1,
          good: "The banana surrenders peacefully.",
          bad: "You have chosen decorative coconut.",
        },
      ],
      onFinish: (won, score) => {
        state.flags.bananaShuffleWon = won || state.flags.bananaShuffleWon;
        say("Mara", won
          ? `I beat the banana shuffle ${score} to 3. Somewhere, a monkey is reconsidering higher education.`
          : "The banana remains hidden. I respect its commitment to theater.");
      },
    });
  }

  function startTelescopeFocusGame() {
    openMiniGame({
      title: "Moon Telescope Focus",
      intro: "Align lens, knob, phrase. Pretend this is science.",
      need: 3,
      rounds: [
        {
          prompt: "First, which lens catches the fake third star without making it smug?",
          choices: ["Salt-crusted wide lens", "Tiny heroic spyglass lens", "Bottle-bottom party lens"],
          correct: 1,
          good: "The tiny lens bites into the moonbeam.",
          bad: "The star gets blurrier and somehow more confident.",
        },
        {
          prompt: "Now choose the knob that moves moonlight instead of furniture.",
          choices: ["Barnacle knob", "Tax knob", "Moon-silver knob"],
          correct: 2,
          good: "The telescope hums in academic approval.",
          bad: "Something in the rafters files a complaint.",
        },
        {
          prompt: "The reflection waits for the phrase that makes ancient stone nervous.",
          choices: ["Shell turns moon, moon wakes star", "Star eats shell, moon pays rent", "Open, because I am tired"],
          correct: 0,
          good: "The false star folds into a moon-door glint.",
          bad: "The telescope produces only judgment.",
        },
      ],
      onFinish: (won) => {
        if (won) {
          state.flags.telescopeFocusWon = true;
          state.flags.telescopeAligned = true;
          say("Mara", "The telescope locks on. The fake third star collapses into a moon-door reflection.");
        } else {
          say("Mara", "The telescope refuses the alignment. I need the right lens, knob, and phrase.");
        }
      },
    });
  }

  function startCitrusSpitGame() {
    openMiniGame({
      title: "Citrus Spit Timing",
      intro: "A tiny stage, a lime, and very little public safety.",
      need: 2,
      rounds: [
        {
          prompt: "The lantern sways left. The bucket waits in the spotlight.",
          choices: ["Spit now", "Wait one beat", "Apologize to the lime"],
          correct: 1,
          good: "Perfect wind-up. Questionable manners.",
          bad: "The lime demonstrates gravity.",
        },
        {
          prompt: "A floorboard creaks under your heroic stance.",
          choices: ["Shift weight", "Ignore physics", "Blame the floorboard"],
          correct: 0,
          good: "Balance restored. Audience mildly impressed.",
          bad: "The floorboard wins the duel.",
        },
        {
          prompt: "Final shot: the bucket, the breeze, the entire concept of dignity.",
          choices: ["Spit low", "Spit high", "Spit at destiny"],
          correct: 1,
          good: "The lime lands with a musical plink.",
          bad: "Destiny ducks.",
        },
      ],
      onFinish: (won, score) => {
        state.flags.citrusSpitWon = won || state.flags.citrusSpitWon;
        say("Mara", won
          ? `A ${score}-point citrus performance. No refunds, no survivors of taste.`
          : "The lime and I agree never to discuss this show again.");
      },
    });
  }

  function quip(key, lines) {
    const index = state.quips[key] || 0;
    state.quips[key] = (index + 1) % lines.length;
    return lines[index % lines.length];
  }

  function hideLine(now) {
    if (state.choiceHandlers.length) return;
    if (state.lineUntil && now > state.lineUntil) {
      state.lineUntil = 0;
      state.actorTalk = null;
      dialogue.classList.remove("visible");
    }
  }

  function setAction(name, ms = 650) {
    state.player.action = name;
    state.player.actionUntil = performance.now() + ms;
    state.player.frameT = 0;
  }

  function walkTo(x, y, pending = null) {
    const scene = getScene();
    state.player.target = {
      x: clamp(x, scene.walkMin, scene.walkMax),
      y: scene.walkY,
    };
    state.pending = pending;
  }

  function transition(to, spawn) {
    state.scene = to;
    state.player.x = spawn[0];
    state.player.y = spawn[1];
    state.player.target = null;
    state.pending = null;
    state.hover = null;
    sceneName.textContent = scenes[to].title;
    setStatus("Choose a command.");
    audio.playMusic(scenes[to].music);
    updateQuestTracker();
    saveGame(false);
  }

  function handleCanvasClick(event) {
    if (!state.started) return;
    if (state.miniGame) return;
    const point = worldFromEvent(event);
    const hit = findHotspot(point);
    if (!hit) {
      walkTo(point.x, point.y);
      return;
    }

    if (hit.type === "exit") {
      const exit = hit.data;
      if (exit.to === "jungle" && !state.flags.skiffReady) {
        const pending = state.scene === "harbor"
          ? { type: "hotspot", id: "skiff", verb: "look" }
          : { type: "line", who: "Mara", text: "The shrine path is flooded. The skiff still needs a proper harbor knot first." };
        walkTo(exit.walkTo[0], exit.walkTo[1], pending);
        return;
      }
      walkTo(exit.walkTo[0], exit.walkTo[1], { type: "exit", exit });
      return;
    }

    const hotspot = hit.data;
    const verb = state.activeItem ? "use" : state.verb;
    walkTo(hotspot.walkTo[0], hotspot.walkTo[1], {
      type: "hotspot",
      id: hotspot.id,
      verb,
      item: state.activeItem,
    });
  }

  function handleHover(event) {
    if (!state.started) return;
    const point = worldFromEvent(event);
    const hit = findHotspot(point);
    state.hover = hit;
    if (hit?.type === "hotspot") {
      const prefix = state.activeItem ? `Use ${itemMeta[state.activeItem]?.name || "item"} with` : state.verb[0].toUpperCase() + state.verb.slice(1);
      setStatus(`${prefix} ${hit.data.label}`);
    } else if (hit?.type === "exit") {
      setStatus(`Walk to ${hit.data.label}`);
    } else {
      setStatus("Walk");
    }
  }

  function interactPending() {
    const pending = state.pending;
    state.pending = null;
    if (!pending) return;

    if (pending.type === "line") {
      say(pending.who, pending.text);
      return;
    }

    if (pending.type === "exit") {
      transition(pending.exit.to, pending.exit.spawn);
      return;
    }

    interact(pending.id, pending.verb, pending.item);
  }

  function interact(id, verb, item = null) {
    if (item) {
      useItemOn(item, id);
      return;
    }
    switch (id) {
      case "dockmaster":
        if (verb === "talk") {
          setAction("talk", 900);
          say("Dockmaster", state.flags.skiffReady
            ? "That knot would hold through a hurricane and a bad review."
            : "Tie that skiff proper, and the jungle ferry is yours.");
        } else {
          say("Mara", "He looks like he has personally argued with every rope in port.");
        }
        break;
      case "rope":
        if (verb === "take") {
          state.flags.ropeTaken = true;
          addItem("rope");
          setAction("pickup", 680);
          say("Mara", "One heroic coil of rope. Adventure officially has equipment.");
        } else {
          say("Mara", "Salt-stiff, strong, and only mildly judgmental.");
        }
        break;
      case "crate":
        if (verb === "take") {
          state.flags.tokenTaken = true;
          addItem("token");
          setAction("pickup", 650);
          say("Mara", "A copper token. It smells like old dock bets.");
        } else {
          say("Mara", "The crate is labeled FRAGILE, then crossed out and replaced with PROBABLY.");
        }
        break;
      case "skiff":
        if (state.flags.skiffReady && (verb === "walk" || verb === "use")) {
          transition("jungle", [1425, scenes.jungle.walkY]);
          return;
        }
        if (verb === "use") {
          if (!hasItem("rope")) {
            say("Mara", "The skiff needs a line before it becomes transport instead of driftwood.");
          } else if (!state.flags.skiffReady) {
            state.flags.skiffReady = true;
            setAction("use", 820);
            audio.sfx("gate");
            say("Mara", "Secure. The jungle route is open.");
          } else {
            transition("jungle", [1425, scenes.jungle.walkY]);
          }
        } else {
          say("Mara", state.flags.skiffReady ? "A tied skiff, ready for shrine business." : "A skiff tugging at the dock like it wants a better plan.");
        }
        break;
      case "lighthouse":
        if (verb === "use") {
          setAction("use", 650);
          say("Mara", hasItem("spyglass")
            ? "Through the spyglass, the lighthouse beam taps a route: wreck, tavern, shrine."
            : "The lighthouse is too far to read without something brass and telescopic.");
          if (hasItem("spyglass")) state.flags.lighthouseClue = true;
        } else {
          say("Mara", "The moon lighthouse blinks over the cove like it knows the punchline early.");
        }
        break;
      case "lanternRig":
        if (verb === "use") {
          setAction("use", 650);
          say("Mara", state.flags.skiffReady
            ? "The lantern rig swings toward the tied skiff, politely implying: yes, that is the way."
            : "If I fixed the skiff line, this lantern could mark a very dramatic departure.");
        } else {
          say("Mara", "A lantern rig on the dock crane. Excellent for mood, mediocre for subtlety.");
        }
        break;
      case "smuggler":
        if (verb === "talk") {
          setAction("talk", 900);
          if (!state.flags.gotNote) {
            ask("Smuggler", "The smuggler smiles like a locked drawer. He waits for a proper conversational bribe.", [
              {
                text: "Do you accept heroic confidence?",
                reply: "Confidence is legal tender only in very small countries and very large mistakes.",
              },
              {
                text: "Where do I get tavern-certified brass poetry?",
                reply: "Try the barkeep. He sells verses by the token and regret by the barrel.",
              },
              {
                text: "Can I just guess the moon secret?",
                reply: "You can. The door will enjoy the comedy.",
              },
            ]);
          } else if (!state.flags.smugglerTip) {
            ask("Smuggler", "He taps the brass note twice, then once more for dramatic accounting.", [
              {
                text: "What is missing from shell, moon, star?",
                run: () => {
                  state.flags.smugglerTip = true;
                },
                reply: "The market clause: the third star is fake. Ask the archivist to prove which moon is lying.",
              },
              {
                text: "Can you sell me a shortcut?",
                reply: "Certainly. It is called 'walking to the observatory' and costs your patience.",
              },
              {
                text: "Are you a villain?",
                reply: "Only on invoices. In person I prefer 'aggressively helpful'.",
              },
              {
                text: "Challenge him to a repartee duel.",
                action: startReparteeGame,
              },
            ]);
          } else if (!state.flags.archivistClearance) {
            ask("Smuggler", "The smuggler leans in, smelling faintly of lantern oil and questionable footnotes.", [
              {
                text: "Remind me where the proof is.",
                reply: "Use the brass note on the observatory star charts. Scholars love paperwork disguised as destiny.",
              },
              {
                text: "What if the telescope complains?",
                reply: "Put your spyglass to work. Tools enjoy feeling promoted.",
              },
              {
                text: "Why help me?",
                reply: "A moon door that opens is a market opportunity. A moon door that sulks is architecture.",
              },
              {
                text: "Settle this with repartee.",
                action: startReparteeGame,
              },
            ]);
          } else {
            ask("Smuggler", "He gives a tiny bow, the kind that probably has a customs fee.", [
              {
                text: "Any last advice?",
                reply: "You have the archivist's nod. That is rarer than a cheap souvenir with honest stitching.",
              },
              {
                text: "Any first advice?",
                reply: "Never buy a map that still has wet ink unless the seller is running.",
              },
              {
                text: "One more repartee duel.",
                action: startReparteeGame,
              },
            ]);
          }
        } else {
          say("Mara", "He has the relaxed posture of a man who can invoice a shadow.");
        }
        break;
      case "fruitStand":
        if (verb === "use") {
          setAction("use", 650);
          startBananaShuffleGame();
          return;
        } else {
          say("Mara", quip("fruitStand", [
            "A fruit stand. The pineapples look like they know too much.",
            state.flags.bananaShuffleWon
              ? "The bananas look defeated, but only contractually."
              : "The bananas are arranged in a way that implies a trap, or very confident merchandising.",
          ]));
        }
        break;
      case "pulleyRelic":
        if (verb === "use") {
          setAction("use", 650);
          say("Mara", "The rubber pulley stretches, squeaks, and refuses to solve transport puzzles for legal reasons.");
        } else {
          say("Mara", "A rubbery pulley relic. Somewhere, an old adventure designer just smiled into his coffee.");
        }
        break;
      case "ledger":
        if (verb === "use") {
          setAction("use", 650);
          say("Mara", "I open it to page one: debit, credit, and a third head for sarcasm.");
        } else {
          say("Mara", "A three-headed ledger. One head counts coins, one counts curses, one asks for overtime.");
        }
        break;
      case "dirtJar":
        if (verb === "use") {
          setAction("use", 620);
          say("Mara", hasItem("bottle")
            ? "Bottle meets jar. The dirt remains unimpressed, which is dirt's main talent."
            : "I shake the jar. It answers with the confidence of a pirate who owns a soundtrack.");
        } else {
          say("Mara", "A jar of dirt. Probably valuable to anyone with a dramatic enough escape plan.");
        }
        break;
      case "marketSign":
        say("Mara", "The sign says nothing readable, but it strongly implies snacks, smuggling, and limited liability.");
        break;
      case "barkeep":
        if (verb === "talk") {
          setAction("talk", 900);
          if (hasItem("token") && !state.flags.gotNote) {
            ask("Barkeep", "The barkeep eyes your copper token like it owes him rent.", [
              {
                text: "Trade the token for the old verse.",
                run: () => {
                  removeItem("token");
                  state.flags.gotNote = true;
                  addItem("brassNote");
                },
                reply: "For that token: shell turns moon, moon wakes star. Then ask the market why that is not enough.",
              },
              {
                text: "Ask for something with bananas.",
                reply: "This is a tavern, not a monkey catering service. Though I admire the ambition.",
              },
              {
                text: "Haggle using a dramatic eyebrow.",
                reply: "That eyebrow has potential. The token still pays retail.",
              },
            ]);
          } else if (state.flags.gotNote) {
            ask("Barkeep", "He polishes the same mug with the determination of a man avoiding plot responsibility.", [
              {
                text: state.flags.smugglerTip ? "The market sent me to the observatory." : "Where does the verse go next?",
                reply: state.flags.smugglerTip
                  ? "Good. That means the expensive part of the rumor worked. Now make the charts and telescope agree."
                  : "Find the moon-market smuggler. He sells the missing uncomfortable bit.",
              },
              {
                text: "Why are old verses always incomplete?",
                reply: "Complete verses get taxed as books. Pirates have always been strong on loopholes.",
              },
              {
                text: "Any tavern wisdom?",
                reply: "Never trust a quiet parrot, a dry mop, or a treasure map with decorative confidence.",
              },
            ]);
          } else {
            ask("Barkeep", "The barkeep drums his fingers beside a tiny brass note.", [
              {
                text: "Can I hear the old verse?",
                reply: "No tab, no tale. Bring a dock token and I might become educational.",
              },
              {
                text: "Where might a dock token hide?",
                reply: "Dock crates collect coins, splinters, and poor decisions. Start there.",
              },
              {
                text: "Can I pay with charm?",
                reply: "Charm is accepted only after copper, silver, gold, and sincere apologizing.",
              },
            ]);
          }
        } else {
          say("Mara", "A keeper of mugs, rumors, and extremely specific prices.");
        }
        break;
      case "lime":
        if (verb === "take") {
          state.flags.limeTaken = true;
          addItem("lime");
          setAction("pickup", 650);
          say("Mara", "A lime. Pirate medicine, seasoning, and moral support.");
        } else {
          say("Mara", "Fresh enough to make a curse reconsider.");
        }
        break;
      case "spyglass":
        if (verb === "take") {
          state.flags.spyglassTaken = true;
          addItem("spyglass");
          setAction("pickup", 650);
          say("Mara", "A spyglass. Excellent for spotting danger after it has already spotted me.");
        } else {
          say("Mara", "Brass, polished, and probably better at distance than judgment.");
        }
        break;
      case "chart":
        say("Mara", hasItem("spyglass")
          ? "Through the spyglass, a tiny ink mark points past the market, into the observatory, then toward the shrine."
          : "The chart marks a wreck, a shrine, and the phrase: shell turns moon.");
        break;
      case "stage":
        if (verb === "use") {
          setAction("use", 680);
          if (hasItem("lime")) {
            startCitrusSpitGame();
            return;
          }
          say("Mara", "The stage is ready for a shanty. Unfortunately, so am I.");
        } else {
          say("Mara", "A stage barely large enough for one song, two lies, or half a swordfight.");
        }
        break;
      case "mapChest":
        if (verb === "use") {
          setAction("use", 700);
          say("Mara", state.flags.gotNote
            ? "Inside is a damp receipt for candles and one very smug moon symbol."
            : "Locked. The tavern clearly respects paperwork more than pirates.");
        } else {
          say("Mara", "A chest beneath the chart. It smells of wax seals, old salt, and missing context.");
        }
        break;
      case "wreck":
        if (verb === "use") {
          setAction("use", 700);
          say("Mara", "The planks groan a sea shanty in a key nobody asked for.");
        } else {
          say("Mara", "A proud ship, now mostly an argument with sand.");
        }
        break;
      case "shipCabin":
        if (verb === "use") {
          setAction("use", 720);
          say("Mara", hasItem("spyglass")
            ? "With the spyglass I spot a scratched moon mark under the cabin rail."
            : "The cabin is cracked open, but the useful scratches are too far in the shade.");
        } else {
          say("Mara", "The captain's cabin still points at the horizon, mostly out of habit.");
        }
        break;
      case "stormBarrel":
        if (verb === "use") {
          setAction("use", 680);
          say("Mara", "The barrel replies with a hollow thunk. That is barrel for 'please stop'.");
        } else {
          say("Mara", "Storm-tossed barrel, half-buried. It has survived worse plans than mine.");
        }
        break;
      case "tidepool":
        if (verb === "take") {
          state.flags.shellKeyTaken = true;
          addItem("shellKey");
          setAction("pickup", 650);
          say("Mara", "A shell key, polished by tides and possibly smug about it.");
        } else {
          say("Mara", "Something bright is caught between the stones.");
        }
        break;
      case "bottle":
        if (verb === "take") {
          state.flags.bottleTaken = true;
          addItem("bottle");
          setAction("pickup", 650);
          say("Mara", "A message bottle. It contains a damp warning and a very confident cork.");
        } else {
          say("Mara", "A bottle rolled in by the tide. The ocean has dramatic delivery.");
        }
        break;
      case "cliff":
        say("Mara", hasItem("rope") ? "With the rope I could climb it, but the shrine is the real prize." : "Too steep without a line, and I prefer my bones alphabetized.");
        break;
      case "keeper":
        if (verb === "talk") {
          setAction("talk", 800);
          say("Keeper", state.flags.archivistClearance
            ? "You carry chart, gossip, and verse. The moon door has run out of excuses."
            : state.flags.gotNote
              ? "The verse is old, but not complete. Market tongue and observatory eye must agree before stone listens."
              : "The moon door opens for anyone who remembers what the sea forgot.");
        } else {
          say("Mara", "The keeper has the calm of someone who has seen many dramatic entrances.");
        }
        break;
      case "shrineDoor":
        if (verb === "use") {
          if (!hasItem("shellKey")) {
            say("Mara", "The lock is shaped like a shell. Subtle, but effective.");
          } else if (!state.flags.gotNote) {
            say("Mara", "The shell fits, but the door waits for a spoken verse.");
          } else if (!state.flags.smugglerTip) {
            say("Mara", "The verse bounces off the stone. The market still owes me the missing clause.");
          } else if (!state.flags.starChartsRead) {
            say("Mara", "The moon symbol is wrong-side-up. I need the observatory charts before I embarrass myself in front of architecture.");
          } else if (!state.flags.telescopeAligned) {
            say("Mara", "The door waits for moonlight proof. The telescope needs one final squint.");
          } else if (!state.flags.archivistClearance) {
            say("Mara", "The door almost listens, then gets academic. I need the archivist to confirm the line.");
          } else {
            state.flags.shrineOpen = true;
            state.flags.solved = true;
            addItem("starCompass");
            setAction("use", 1000);
            audio.sfx("chime");
            audio.playMusic("ending");
            say("Mara", "Shell turns moon, moon wakes star. The compass is ours.", 4400);
            setTimeout(() => {
              endingScreen.hidden = false;
            }, 1100);
          }
        } else {
          say("Mara", "A stone moon door, carved with little stars that seem inconveniently awake.");
        }
        break;
      case "waterfall":
        if (verb === "use") {
          setAction("use", 700);
          say("Mara", hasItem("bottle")
            ? "A splash of waterfall water wakes hidden ink in the bottle note: speak the verse before the shell."
            : "Mist from the falls makes the stones glow like they have secrets to sell.");
          if (hasItem("bottle")) state.flags.bottleDecoded = true;
        } else {
          say("Mara", "Mist Falls keeps the shrine cool, loud, and just mysterious enough.");
        }
        break;
      case "bridge":
        if (verb === "use") {
          setAction("use", 650);
          say("Mara", hasItem("rope")
            ? "My rope is better than this bridge. The bridge seems offended but not surprised."
            : "The bridge creaks in a dialect I understand as 'single file, please'.");
        } else {
          say("Mara", "A rope bridge vanishing into mist. It was built by people with confidence or poor depth perception.");
        }
        break;
      case "glyphs":
        if (verb === "use") {
          setAction("use", 700);
          state.flags.glyphsRead = true;
          say("Mara", hasItem("brassNote")
            ? "The note matches the glyphs: shell turns moon, moon wakes star. Officially not a coincidence."
            : "The glyphs show a shell, a moon, and a star. Ancient people loved visual spoilers.");
        } else {
          say("Mara", "Weathered stone glyphs. The moon symbol has been touched smooth by nervous hands.");
        }
        break;
      case "vines":
        say("Mara", "The vines have wrapped themselves into a botanical no-entry sign.");
        break;
      case "archivist":
        if (verb === "talk") {
          setAction("talk", 900);
          if (!state.flags.smugglerTip) {
            ask("Archivist", "The archivist peers over his spectacles as if you are filed under 'miscellaneous damp'.", [
              {
                text: "Can you read my moon verse?",
                reply: "I do not open sealed moon records without market testimony. Even questionable smugglers outrank unverified poetry.",
              },
              {
                text: "What counts as testimony?",
                reply: "A smuggler with a secret, a note with a lie, and a hero with comfortable shoes.",
              },
            ]);
          } else if (!state.flags.starChartsRead) {
            ask("Archivist", "He points at the chart board with the patience of a man who has alphabetized moonlight.", [
              {
                text: "What do I do with the brass note?",
                reply: "Lay it across the star charts. If the third star blinks, pretend you expected that.",
              },
              {
                text: "Can you do it for me?",
                reply: "I am an archivist, not a plot forklift.",
              },
            ]);
          } else if (!state.flags.telescopeAligned) {
            ask("Archivist", "He checks a ledger titled 'Things Adventurers Could Have Seen If They Looked Slightly Left'.", [
              {
                text: "The charts say the third star is false.",
                reply: "Correct. Now use the Spyglass from the tavern table on the Moon Telescope. Spyglass first, dignity later.",
              },
              {
                text: "Where was the Spyglass again?",
                reply: "On the left tavern table, large, brass, and practically begging to be overused.",
              },
            ]);
          } else if (!state.flags.archivistClearance) {
            ask("Archivist", "The telescope hums. The archivist waits for you to say the part that makes the lock nervous.", [
              {
                text: "The third star is a moon-door reflection.",
                run: () => {
                  state.flags.archivistClearance = true;
                },
                reply: "Confirmed. Say the verse, turn the shell, and do not improvise jazz near ancient locks.",
              },
              {
                text: "The third star is probably cheese.",
                reply: "A courageous theory, rejected by astronomy, dairy, and the lock.",
              },
              {
                text: "Can I call it a shiny lie?",
                reply: "Informally yes. Officially, please use 'moon-door reflection' so the door feels respected.",
              },
            ]);
          } else {
            ask("Archivist", "The archivist has relaxed all the way from 'stern' to 'professionally concerned'.", [
              {
                text: "Anything else in the records?",
                reply: "The telescope sees stars, ships, and occasionally a hero making poor inventory choices.",
              },
              {
                text: "How do you catalog magical objects?",
                reply: "Rule one: if it hums, glows, or judges you, shelve it under nautical.",
              },
              {
                text: "Was this clearance official?",
                reply: "If anyone asks, this clearance was always filed under perfectly sensible moon business.",
              },
            ]);
          }
        } else {
          say("Mara", "The archivist looks like sleep once asked for an appointment and got filed under 'myth'.");
        }
        break;
      case "telescope":
        if (verb === "use") {
          setAction("use", 820);
          if (!state.flags.starChartsRead) {
            say("Mara", "The telescope shows too many shiny lies. I need the charts to tell me which moon is pretending to be a star.");
          } else if (!hasItem("spyglass")) {
            say("Mara", "The chart gives me the target, but I need the Brass Spyglass from the left tavern table to finish the squint.");
          } else if (!state.flags.telescopeAligned) {
            startTelescopeFocusGame();
            return;
          } else {
            say("Mara", "The telescope is already aligned. It is enjoying the rare sensation of being useful.");
          }
        } else {
          say("Mara", state.flags.telescopeAligned
            ? "The telescope is aligned on the moon-door reflection. It looks pleased with itself."
            : "A brass moon telescope. It has more knobs than a pirate council.");
        }
        break;
      case "starCharts":
        if (verb === "use") {
          setAction("use", 760);
          if (!hasItem("brassNote") && !state.flags.gotNote) {
            say("Mara", "The chart has a note-shaped blank. Very rude of astronomy to demand paperwork.");
          } else {
            state.flags.starChartsRead = true;
            say("Mara", "The brass note lines up with the chart: the third star is not a star. It is a tiny moon-door reflection with stage fright.");
          }
        } else {
          say("Mara", state.flags.starChartsRead
            ? "The marked route now points from market rumor to telescope proof. Astronomy, but with receipts."
            : "Star charts pinned with knives. Academics here have commitment issues.");
        }
        break;
      case "fedoraRelic":
        if (verb === "use") {
          setAction("use", 600);
          say("Mara", "I try the hat angle. It instantly adds confidence and archaeology homework.");
        } else {
          say("Mara", "A well-travelled hat. It gives off strong museum-nearby energy.");
        }
        break;
      case "crystalMug":
        if (verb === "use") {
          setAction("use", 600);
          say("Mara", "The mug shows my future: more walking, less dignity, better lighting.");
        } else {
          say("Mara", "A crystal skull mug. I do not trust cups with cheekbones.");
        }
        break;
      case "archiveHatch":
        if (verb === "use") {
          state.flags.hatchPeeked = true;
          setAction("use", 780);
          say("Mara", "The hatch opens three inches, reveals one stair, then changes its mind.");
        } else {
          say("Mara", "A round hatch with bite marks in the varnish. Either bad carpentry, or very small critics.");
        }
        break;
      case "redCurtain":
        if (verb === "use") {
          setAction("use", 650);
          say("Mara", "I tug the curtain. Behind it: another curtain. That is either secrecy or interior design panic.");
        } else {
          say("Mara", "A suspicious red curtain. Theatrical enough to charge admission.");
        }
        break;
      default:
        say("Mara", "Nothing happens. It does so with confidence.");
    }
    state.activeItem = null;
    updateInventory();
    updateQuestTracker();
  }

  function useItemOn(item, hotspotId) {
    setAction("use", 800);
    if (item === "rope" && hotspotId === "skiff") {
      state.flags.skiffReady = true;
      audio.sfx("gate");
      say("Mara", "A proper knot. The skiff can reach the jungle now.");
    } else if (item === "token" && hotspotId === "barkeep") {
      interact("barkeep", "talk");
      return;
    } else if (item === "shellKey" && hotspotId === "shrineDoor") {
      interact("shrineDoor", "use");
      return;
    } else if (item === "spyglass" && hotspotId === "chart") {
      say("Mara", "The magnified note says: shell turns moon, moon wakes star.");
    } else if (item === "spyglass" && hotspotId === "lighthouse") {
      state.flags.lighthouseClue = true;
      say("Mara", "The lighthouse shutters blink three stops: wreck, tavern, shrine. Someone made a breadcrumb trail out of moonlight.");
    } else if (item === "spyglass" && hotspotId === "shipCabin") {
      say("Mara", "The far scratch under the cabin rail reads: ask the barkeep why the moon owes him money.");
    } else if (item === "spyglass" && hotspotId === "telescope") {
      if (!state.flags.starChartsRead) {
        say("Mara", "The spyglass sharpens the telescope, but without the star charts I am just admiring expensive confusion.");
      } else if (!state.flags.telescopeAligned) {
        startTelescopeFocusGame();
      } else {
        say("Mara", "Spyglass through telescope: the fake third star is already pinned neatly to the moon-door reflection.");
      }
    } else if (item === "brassNote" && hotspotId === "starCharts") {
      state.flags.starChartsRead = true;
      say("Mara", "The note and chart agree: shell, moon, star, except the last star is a reflected moon-door. Helpful and deeply smug.");
    } else if (item === "lime" && hotspotId === "fruitStand") {
      say("Mara", "My lime returns from the fruit stand with a tiny sense of superiority.");
    } else if (item === "bottle" && hotspotId === "dirtJar") {
      say("Mara", "Bottle plus dirt jar creates archaeology. Bad archaeology, but still.");
    } else if (item === "starCompass" && hotspotId === "telescope") {
      say("Archivist", "Ah. The Star Compass. Please do not point that at the moon unless everyone has signed something.");
    } else if (item === "bottle" && hotspotId === "keeper") {
      say("Keeper", "The sea still sends letters. Mostly complaints, but this one is helpful.");
    } else if (item === "bottle" && hotspotId === "waterfall") {
      state.flags.bottleDecoded = true;
      say("Mara", "Fresh waterfall water reveals hidden ink: speak first, shell second. Rude, but useful.");
    } else if (item === "lime" && hotspotId === "wreck") {
      say("Mara", "The wreck refuses the lime. Fair.");
    } else if (item === "lime" && hotspotId === "stage") {
      say("Mara", "I leave the lime on stage. It gets the best reviews of the evening.");
    } else if (item === "brassNote" && hotspotId === "glyphs") {
      state.flags.glyphsRead = true;
      say("Mara", "The brass note matches the old glyphs exactly. The verse is a key, not just tavern poetry.");
    } else if (item === "rope" && hotspotId === "bridge") {
      say("Mara", "I add a sensible knot to the bridge rail. The bridge looks marginally less theatrical.");
    } else {
      const name = itemMeta[item]?.name || "that";
      say("Mara", `${name} does not help here.`);
    }
    state.activeItem = null;
    updateInventory();
    updateQuestTracker();
  }

  function updatePlayer(dt, now) {
    const player = state.player;
    if (player.target) {
      const dx = player.target.x - player.x;
      const dy = player.target.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= 5) {
        player.x = player.target.x;
        player.y = player.target.y;
        player.target = null;
        player.action = "idle";
        interactPending();
      } else {
        const speed = 470;
        const step = Math.min(dist, speed * dt);
        player.x += (dx / dist) * step;
        player.y += (dy / dist) * step;
        player.facing = dx >= 0 ? 1 : -1;
        player.action = player.facing >= 0 ? "walkRight" : "walkLeft";
      }
    } else if (player.actionUntil && now > player.actionUntil) {
      player.action = "idle";
      player.actionUntil = 0;
    }

    const anim = anims[player.action] || anims.idle;
    player.frameT = (player.frameT + dt * anim.fps) % animFrameCount(anim);
  }

  function animFrameCount(anim) {
    return Array.isArray(anim.frames) ? anim.frames.length : anim.frames;
  }

  function animFrameAt(anim, framePosition) {
    const count = animFrameCount(anim);
    const index = ((Math.floor(framePosition) % count) + count) % count;
    return Array.isArray(anim.frames) ? anim.frames[index] : index;
  }

  function actorAnimName(actor, now) {
    const talking = state.actorTalk?.id === actor.id && now < state.actorTalk.until;
    return talking ? (actor.talkAnim || actor.idleAnim || actor.anim) : (actor.idleAnim || actor.anim);
  }

  function drawSpriteFrame(anim, frame, x, y, w, h, alpha = 1) {
    const sheet = images[anim.sheet || "characters"] || images.characters;
    if (!sheet) return;
    const cropTop = anim.cropTop || 0;
    const cropBottom = anim.cropBottom || 0;
    const sourceH = FRAME_H - cropTop - cropBottom;
    const scaleY = h / FRAME_H;
    const sx = frame * FRAME_W;
    const sy = anim.row * FRAME_H + cropTop;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(sheet, sx, sy, FRAME_W, sourceH, x - w / 2, y - h + cropTop * scaleY, w, sourceH * scaleY);
    ctx.restore();
  }

  function drawSprite(animName, x, y, scale = 1, frameOffset = 0, timing = {}) {
    const anim = anims[animName] || anims.idle;
    const framePosition = timing.player
      ? state.player.frameT + frameOffset
      : ((timing.now || state.lastTime || performance.now()) / 1000) * anim.fps + frameOffset;
    const frame = animFrameAt(anim, framePosition);
    const w = FRAME_W * scale;
    const h = FRAME_H * scale;
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.beginPath();
    ctx.ellipse(x, y - 8 * scale, 46 * scale, 12 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (anim.blend && !timing.player) {
      const blend = framePosition - Math.floor(framePosition);
      const next = animFrameAt(anim, framePosition + 1);
      drawSpriteFrame(anim, frame, x, y, w, h, 1 - blend * 0.55);
      if (next !== frame) drawSpriteFrame(anim, next, x, y, w, h, blend * 0.55);
      return;
    }
    drawSpriteFrame(anim, frame, x, y, w, h);
  }

  function drawSceneItemIcon(itemId, x, y, size) {
    const meta = itemMeta[itemId];
    if (!meta) return;
    const sheet = images.sceneItems || images.items;
    const cellW = sheet.width / 4;
    const cellH = sheet.height / 2;
    const col = meta.icon % 4;
    const row = Math.floor(meta.icon / 4);
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.06, size * 0.34, size * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.drawImage(sheet, col * cellW, row * cellH, cellW, cellH, x - size / 2, y - size, size, size);
    ctx.restore();
  }

  function drawSceneItems(scene) {
    availableHotspots(scene).forEach((spot) => {
      if (!spot.item || !spot.itemPos) return;
      drawSceneItemIcon(spot.item, spot.itemPos[0], spot.itemPos[1], spot.itemPos[2]);
    });
  }

  function drawSheetOutline(sheet, sx, sy, sw, sh, dx, dy, dw, dh, thickness = 5) {
    if (!sheet || !outlineCtx) return;
    const pad = Math.ceil(thickness * 2.4);
    const width = Math.ceil(dw + pad * 2);
    const height = Math.ceil(dh + pad * 2);
    if (outlineCanvas.width !== width || outlineCanvas.height !== height) {
      outlineCanvas.width = width;
      outlineCanvas.height = height;
    }

    outlineCtx.clearRect(0, 0, width, height);
    outlineCtx.globalAlpha = 1;
    outlineCtx.globalCompositeOperation = "source-over";
    const offsets = [
      [-thickness, 0], [thickness, 0], [0, -thickness], [0, thickness],
      [-thickness * 0.72, -thickness * 0.72], [thickness * 0.72, -thickness * 0.72],
      [-thickness * 0.72, thickness * 0.72], [thickness * 0.72, thickness * 0.72],
    ];
    offsets.forEach(([ox, oy]) => {
      outlineCtx.drawImage(sheet, sx, sy, sw, sh, pad + ox, pad + oy, dw, dh);
    });
    outlineCtx.globalCompositeOperation = "source-in";
    outlineCtx.fillStyle = "rgba(255, 255, 255, 0.96)";
    outlineCtx.fillRect(0, 0, width, height);
    outlineCtx.globalCompositeOperation = "destination-out";
    outlineCtx.drawImage(sheet, sx, sy, sw, sh, pad, pad, dw, dh);
    outlineCtx.globalCompositeOperation = "source-over";

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.78)";
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 2;
    ctx.drawImage(outlineCanvas, dx - pad, dy - pad);
    ctx.restore();
  }

  function drawItemShapeOutline(itemId, x, y, size) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.96)";
    ctx.lineWidth = Math.max(3, size * 0.045);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(0, 0, 0, 0.82)";
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();

    if (itemId === "rope") {
      ctx.ellipse(x, y - size * 0.47, size * 0.33, size * 0.2, -0.08, 0, Math.PI * 2);
      ctx.moveTo(x + size * 0.2, y - size * 0.44);
      ctx.ellipse(x, y - size * 0.47, size * 0.2, size * 0.11, -0.08, 0, Math.PI * 2);
      ctx.moveTo(x + size * 0.11, y - size * 0.25);
      ctx.quadraticCurveTo(x + size * 0.26, y - size * 0.18, x + size * 0.2, y - size * 0.07);
    } else if (itemId === "token") {
      ctx.ellipse(x, y - size * 0.5, size * 0.28, size * 0.28, 0, 0, Math.PI * 2);
    } else if (itemId === "lime") {
      ctx.ellipse(x, y - size * 0.5, size * 0.3, size * 0.27, -0.2, 0, Math.PI * 2);
    } else if (itemId === "shellKey") {
      ctx.ellipse(x - size * 0.08, y - size * 0.58, size * 0.23, size * 0.16, -0.18, 0, Math.PI * 2);
      ctx.moveTo(x + size * 0.08, y - size * 0.48);
      ctx.lineTo(x + size * 0.28, y - size * 0.25);
      ctx.moveTo(x + size * 0.2, y - size * 0.31);
      ctx.lineTo(x + size * 0.34, y - size * 0.35);
    } else if (itemId === "bottle") {
      ctx.translate(x, y - size * 0.48);
      ctx.rotate(-0.42);
      if (ctx.roundRect) ctx.roundRect(-size * 0.14, -size * 0.34, size * 0.28, size * 0.62, size * 0.08);
      else ctx.rect(-size * 0.14, -size * 0.34, size * 0.28, size * 0.62);
      ctx.moveTo(-size * 0.08, -size * 0.4);
      ctx.lineTo(size * 0.08, -size * 0.4);
    } else if (itemId === "spyglass") {
      ctx.translate(x, y - size * 0.5);
      ctx.rotate(-0.18);
      ctx.moveTo(-size * 0.36, 0);
      ctx.lineTo(size * 0.34, 0);
      ctx.moveTo(-size * 0.38, -size * 0.1);
      ctx.lineTo(-size * 0.38, size * 0.1);
      ctx.moveTo(size * 0.36, -size * 0.13);
      ctx.lineTo(size * 0.36, size * 0.13);
    } else {
      ctx.ellipse(x, y - size * 0.5, size * 0.28, size * 0.28, 0, 0, Math.PI * 2);
    }

    ctx.stroke();
    ctx.restore();
  }

  function drawActorShapeOutline(scene, actorId) {
    const index = scene.actors.findIndex((actor) => actor.id === actorId);
    if (index < 0) return false;
    const actor = scene.actors[index];
    const animName = actorAnimName(actor, state.lastTime || performance.now());
    const anim = anims[animName] || anims.idle;
    const framePosition = ((state.lastTime || performance.now()) / 1000) * anim.fps + index * 2.37;
    const frame = animFrameAt(anim, framePosition);
    const cropTop = anim.cropTop || 0;
    const cropBottom = anim.cropBottom || 0;
    const sourceH = FRAME_H - cropTop - cropBottom;
    const sx = frame * FRAME_W;
    const sy = anim.row * FRAME_H + cropTop;
    const w = FRAME_W * actor.scale;
    const h = FRAME_H * actor.scale;
    const sheet = images[anim.sheet || "characters"] || images.characters;
    drawSheetOutline(sheet, sx, sy, FRAME_W, sourceH, actor.x - w / 2, actor.y - h + cropTop * actor.scale, w, sourceH * actor.scale, 6);
    return true;
  }

  function drawPolygonOutline(points, smooth = false) {
    if (!points?.length) return;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.94)";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(0, 0, 0, 0.82)";
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    if (smooth) {
      for (let i = 1; i < points.length; i += 1) {
        const prev = points[i - 1];
        const point = points[i];
        const cx = (prev[0] + point[0]) / 2;
        const cy = (prev[1] + point[1]) / 2;
        ctx.quadraticCurveTo(prev[0], prev[1], cx, cy);
      }
      const last = points[points.length - 1];
      const first = points[0];
      ctx.quadraticCurveTo(last[0], last[1], first[0], first[1]);
    } else {
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawHotspotShapeOutline(scene, spot) {
    if (spot.item && spot.itemPos) {
      drawItemShapeOutline(spot.item, spot.itemPos[0], spot.itemPos[1], spot.itemPos[2]);
      return;
    }

    const outline = hotspotOutlines[spot.id];
    if (outline?.kind === "actor" && drawActorShapeOutline(scene, outline.actor)) return;
    if (outline?.kind === "polygon") {
      drawPolygonOutline(outline.points, outline.smooth === true);
      return;
    }

    const rect = spot.rect;
    drawPolygonOutline([
      [rect[0] + rect[2] * 0.12, rect[1] + rect[3] * 0.08],
      [rect[0] + rect[2] * 0.9, rect[1] + rect[3] * 0.16],
      [rect[0] + rect[2] * 0.84, rect[1] + rect[3] * 0.9],
      [rect[0] + rect[2] * 0.18, rect[1] + rect[3] * 0.86],
    ]);
  }

  function ambientPulse(now, phase = 0, speed = 0.004) {
    return 0.78
      + Math.sin(now * speed + phase) * 0.12
      + Math.sin(now * speed * 2.37 + phase * 1.9) * 0.06;
  }

  function drawSoftGlow(x, y, radius, rgb, alpha, now, phase = 0) {
    const pulse = ambientPulse(now, phase);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${rgb}, ${alpha * pulse})`);
    gradient.addColorStop(0.42, `rgba(${rgb}, ${alpha * 0.34 * pulse})`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function drawWaterSheen(config, now) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(config.x, config.y, config.w, config.h);
    ctx.clip();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";
    ctx.lineWidth = 2;
    for (let i = 0; i < config.rows; i += 1) {
      const t = i / Math.max(1, config.rows - 1);
      const y = config.y + config.h * t + Math.sin(now * 0.0017 + i * 0.9) * 5;
      const width = 90 + t * 150 + Math.sin(now * 0.0011 + i) * 20;
      const x = config.x + ((i * 149 + now * config.drift) % (config.w + 220)) - 120;
      ctx.globalAlpha = config.alpha * (0.65 + t * 0.55);
      ctx.strokeStyle = `rgb(${config.rgb})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + width * 0.28, y - 4, x + width * 0.68, y + 5, x + width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLightReflections(reflections, now) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";
    reflections.forEach((reflection, index) => {
      for (let i = 0; i < 7; i += 1) {
        const t = i / 6;
        const y = reflection.y + t * reflection.h;
        const sway = Math.sin(now * 0.003 + reflection.phase + i * 1.7) * (8 + t * 12);
        const half = 18 * (1 - t * 0.72) + Math.sin(now * 0.002 + i) * 2;
        ctx.globalAlpha = 0.04 * (1 - t * 0.62);
        ctx.strokeStyle = `rgb(${reflection.rgb})`;
        ctx.lineWidth = 2.2 - t;
        ctx.beginPath();
        ctx.moveTo(reflection.x + sway - half, y);
        ctx.lineTo(reflection.x + sway + half, y + Math.sin(now * 0.002 + index) * 2);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  function drawSurf(config, now) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";
    ctx.strokeStyle = `rgb(${config.rgb})`;
    for (let i = 0; i < config.rows; i += 1) {
      const y = config.y + i * 12 + Math.sin(now * 0.0022 + i) * 3;
      const x = config.x + Math.sin(now * 0.0014 + i * 1.4) * 28;
      ctx.globalAlpha = config.alpha * (1 - i * 0.09);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + config.w * 0.24, y - 8, x + config.w * 0.58, y + 8, x + config.w, y - 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMotes(config, now) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgb(${config.rgb})`;
    for (let i = 0; i < config.count; i += 1) {
      const seed = i * 37.17;
      const x = config.x + ((seed * 29 + Math.sin(now * 0.00019 + seed) * 24) % config.w);
      const y = config.y + ((seed * 17 + now * 0.006 + Math.sin(now * 0.00037 + seed) * 18) % config.h);
      const a = config.alpha * (0.42 + Math.sin(now * 0.0021 + seed) * 0.28);
      ctx.globalAlpha = Math.max(0, a);
      ctx.beginPath();
      ctx.ellipse(x, y, 1.6, 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMist(config, now) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(config.x, config.y, config.w, config.h);
    ctx.clip();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgb(${config.rgb})`;
    ctx.lineCap = "round";
    for (let i = 0; i < config.rows; i += 1) {
      const y = config.y + i * 16 + Math.sin(now * 0.0012 + i) * 6;
      const x = config.x + Math.sin(now * 0.0007 + i * 1.3) * 46;
      ctx.globalAlpha = config.alpha;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + config.w * 0.28, y + 12, x + config.w * 0.58, y - 10, x + config.w, y + 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMoonbeams(beams, now) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    beams.forEach((beam, index) => {
      const sway = Math.sin(now * 0.00045 + beam.phase + index) * 10;
      const pulse = 0.72 + Math.sin(now * 0.001 + beam.phase) * 0.18;
      const topLeft = beam.x + sway;
      const topRight = topLeft + beam.w;
      const bottomLeft = beam.x + beam.tilt - beam.w * 0.18 - sway * 0.4;
      const bottomRight = bottomLeft + beam.w * 1.36;
      const gradient = ctx.createLinearGradient(beam.x, beam.y, beam.x + beam.tilt, beam.y + beam.h);
      gradient.addColorStop(0, `rgba(${beam.rgb}, ${beam.alpha * pulse})`);
      gradient.addColorStop(0.55, `rgba(${beam.rgb}, ${beam.alpha * 0.38 * pulse})`);
      gradient.addColorStop(1, `rgba(${beam.rgb}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(topLeft, beam.y);
      ctx.lineTo(topRight, beam.y);
      ctx.lineTo(bottomRight, beam.y + beam.h);
      ctx.lineTo(bottomLeft, beam.y + beam.h);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }

  function drawClothSway(cloths, now) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";
    cloths.forEach((cloth) => {
      const strips = cloth.strips || 5;
      ctx.strokeStyle = `rgb(${cloth.rgb})`;
      for (let i = 0; i < strips; i += 1) {
        const t = strips <= 1 ? 0.5 : i / (strips - 1);
        const wave = Math.sin(now * 0.0016 + cloth.phase + i * 0.82) * 10;
        ctx.globalAlpha = cloth.alpha * (0.7 + Math.sin(now * 0.0011 + i) * 0.18);
        ctx.lineWidth = cloth.vertical ? 4 : 3;
        ctx.beginPath();
        if (cloth.vertical) {
          const x = cloth.x + cloth.w * t + wave * 0.18;
          ctx.moveTo(x, cloth.y);
          ctx.bezierCurveTo(
            x + wave * 0.55,
            cloth.y + cloth.h * 0.28,
            x - wave * 0.4,
            cloth.y + cloth.h * 0.7,
            x + wave * 0.25,
            cloth.y + cloth.h,
          );
        } else {
          const y = cloth.y + cloth.h * t + wave * 0.16;
          ctx.moveTo(cloth.x, y);
          ctx.bezierCurveTo(
            cloth.x + cloth.w * 0.28,
            y - wave * 0.5,
            cloth.x + cloth.w * 0.68,
            y + wave * 0.45,
            cloth.x + cloth.w,
            y - wave * 0.18,
          );
        }
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  function drawSparkles(config, now) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgb(${config.rgb})`;
    ctx.lineCap = "round";
    for (let i = 0; i < config.count; i += 1) {
      const seed = i * 53.91;
      const x = config.x + ((seed * 19 + Math.sin(now * 0.00023 + seed) * 18) % config.w);
      const y = config.y + ((seed * 31 + Math.cos(now * 0.00031 + seed) * 14) % config.h);
      const twinkle = Math.max(0, Math.sin(now * 0.0025 + seed));
      const r = 2 + twinkle * 4;
      ctx.globalAlpha = config.alpha * (0.28 + twinkle * 0.72);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.lineTo(x + r, y);
      ctx.moveTo(x, y - r * 0.72);
      ctx.lineTo(x, y + r * 0.72);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLensGlints(lenses, now) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    lenses.forEach((lens) => {
      const pulse = 0.66 + Math.sin(now * 0.0018 + lens.phase) * 0.22;
      const gradient = ctx.createRadialGradient(lens.x, lens.y, 0, lens.x, lens.y, lens.radius);
      gradient.addColorStop(0, `rgba(${lens.rgb}, ${lens.alpha * pulse})`);
      gradient.addColorStop(0.34, `rgba(${lens.rgb}, ${lens.alpha * 0.38 * pulse})`);
      gradient.addColorStop(1, `rgba(${lens.rgb}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(lens.x, lens.y, lens.radius, lens.radius * 0.48, -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = lens.alpha * 1.7 * pulse;
      ctx.strokeStyle = `rgb(${lens.rgb})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lens.x - lens.radius * 0.72, lens.y);
      ctx.lineTo(lens.x + lens.radius * 0.72, lens.y + Math.sin(now * 0.001 + lens.phase) * 4);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawRuneRing(config, now) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = `rgb(${config.rgb})`;
    ctx.fillStyle = `rgb(${config.rgb})`;
    for (let i = 0; i < config.count; i += 1) {
      const angle = (Math.PI * 2 * i) / config.count + Math.sin(now * 0.00055 + i) * 0.018;
      const x = config.x + Math.cos(angle) * config.rx;
      const y = config.y + Math.sin(angle) * config.ry;
      const pulse = 0.46 + Math.sin(now * 0.0022 + i * 1.7) * 0.3;
      const tangent = angle + Math.PI / 2;
      const len = 11 + Math.sin(now * 0.0013 + i) * 3;
      ctx.globalAlpha = Math.max(0, config.alpha * pulse);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(tangent) * len, y - Math.sin(tangent) * len);
      ctx.lineTo(x + Math.cos(tangent) * len, y + Math.sin(tangent) * len);
      ctx.stroke();
      if (i % 3 === 0) {
        ctx.beginPath();
        ctx.ellipse(x, y, 2.2, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawSceneAmbience(sceneId, now) {
    const ambience = sceneAmbience[sceneId];
    if (!ambience) return;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ambience.glows?.forEach((glow) => {
      drawSoftGlow(glow.x, glow.y, glow.radius, glow.rgb, glow.alpha, now, glow.phase);
    });
    ctx.restore();

    if (ambience.water) drawWaterSheen(ambience.water, now);
    if (ambience.reflections) drawLightReflections(ambience.reflections, now);
    if (ambience.surf) drawSurf(ambience.surf, now);
    if (ambience.motes) drawMotes(ambience.motes, now);
    if (ambience.mist) drawMist(ambience.mist, now);
    if (ambience.smoke) drawMist(ambience.smoke, now);
    if (ambience.beams) drawMoonbeams(ambience.beams, now);
    if (ambience.cloth) drawClothSway(ambience.cloth, now);
    if (ambience.lens) drawLensGlints(ambience.lens, now);
    if (ambience.runes) drawRuneRing(ambience.runes, now);
    if (ambience.sparkles) drawSparkles(ambience.sparkles, now);
  }

  function drawExitIndicator(exit, marker, now, active = false) {
    if (!marker) return;
    const pulse = active ? 1 : 0.74 + Math.sin(now * 0.004 + marker.x * 0.01) * 0.08;
    const dir = marker.dir === "left" ? -1 : 1;
    const arrowX = marker.x + Math.sin(now * 0.0032) * 3 * dir;
    const labelX = marker.x + dir * 34;
    const align = dir < 0 ? "right" : "left";

    ctx.save();
    ctx.globalAlpha = active ? 0.98 : 0.72;
    ctx.lineWidth = active ? 5 : 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.82 * pulse})`;
    ctx.shadowColor = "rgba(0, 0, 0, 0.82)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.moveTo(arrowX - dir * 18, marker.y - 18);
    ctx.lineTo(arrowX + dir * 3, marker.y);
    ctx.lineTo(arrowX - dir * 18, marker.y + 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(arrowX - dir * 44, marker.y);
    ctx.lineTo(arrowX + dir * 4, marker.y);
    ctx.stroke();

    ctx.font = "900 28px Bookman Old Style, Book Antiqua, Georgia, serif";
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(28, 13, 8, 0.86)";
    ctx.strokeText(marker.label, labelX, marker.y);
    ctx.fillStyle = active ? "#fff8dd" : "#ffd56e";
    ctx.fillText(marker.label, labelX, marker.y);
    ctx.restore();
  }

  function drawExitIndicators(scene, now) {
    const markers = exitMarkers[state.scene] || {};
    scene.exits.forEach((exit) => {
      const active = state.hover?.type === "exit" && state.hover.data.id === exit.id;
      drawExitIndicator(exit, markers[exit.id], now, active);
    });
  }

  function drawHover(now) {
    const hit = state.hover;
    if (!hit) return;
    const scene = getScene();
    if (hit.type === "exit") {
      const marker = exitMarkers[state.scene]?.[hit.data.id];
      drawExitIndicator(hit.data, marker, now, true);
      return;
    }
    drawHotspotShapeOutline(scene, hit.data);
  }

  function drawScene(now) {
    const scene = getScene();
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    ctx.drawImage(images[scene.bg], 0, 0, WORLD_W, WORLD_H);
    drawSceneAmbience(scene.bg, now);

    scene.actors.forEach((actor, index) => {
      drawSprite(actorAnimName(actor, now), actor.x, actor.y, actor.scale, index * 2.37, { now });
    });

    drawSceneItems(scene);
    drawSprite(state.player.action, state.player.x, state.player.y, 0.86, 0, { player: true });

    if (state.flags.shrineOpen && state.scene === "jungle") {
      ctx.save();
      ctx.globalAlpha = 0.64 + Math.sin(now / 180) * 0.12;
      ctx.fillStyle = "#f0c766";
      ctx.beginPath();
      ctx.ellipse(630, 500, 68, 118, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawExitIndicators(scene, now);
    drawHover(now);
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - state.lastTime) / 1000 || 0.016);
    state.lastTime = now;
    if (state.started) updatePlayer(dt, now);
    hideLine(now);
    drawScene(now);
    requestAnimationFrame(loop);
  }

  function saveGame(announce = true) {
    const data = {
      scene: state.scene,
      inventory: state.inventory,
      flags: state.flags,
      player: { x: state.player.x, y: state.player.y },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (announce) say("Mara", "Saved.");
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!scenes[data.scene]) return false;
      state.scene = data.scene;
      state.inventory = Array.isArray(data.inventory) ? data.inventory.filter((id) => itemMeta[id]) : [];
      state.flags = { ...state.flags, ...data.flags };
      state.player.x = Number(data.player?.x) || scenes[state.scene].walkMin + 120;
      state.player.y = Number(data.player?.y) || scenes[state.scene].walkY;
      return true;
    } catch {
      return false;
    }
  }

  function resetGame() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  function startGame() {
    state.started = true;
    startScreen.style.display = "none";
    if (questTracker) questTracker.hidden = false;
    sceneName.textContent = getScene().title;
    setStatus("Choose a command.");
    updateVerbButtons();
    updateInventory();
    updateQuestTracker();
    if (isMobileMode()) {
      const audioStart = audio.enable();
      const immersiveStart = enterMobileImmersiveMode();
      Promise.allSettled([audioStart, immersiveStart]).then(() => {
        if (!audio.enabled) setStatus("Tap Audio if music stays muted.");
      });
    } else {
      audio.playMusic(getScene().music);
    }
  }

  function bindEvents() {
    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousemove", handleHover);
    canvas.addEventListener("mouseleave", () => {
      state.hover = null;
      if (state.started) setStatus("Choose a command.");
    });
    verbs.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-verb]");
      if (!button) return;
      setVerb(button.dataset.verb);
    });
    choiceOptions?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-choice]");
      if (!button) return;
      chooseDialogue(Number(button.dataset.choice));
    });
    miniChoices?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-choice]");
      if (!button) return;
      chooseMiniGame(Number(button.dataset.choice));
    });
    miniClose?.addEventListener("click", () => {
      closeMiniGame();
      say("Mara", "Mini game politely abandoned. No coconuts were harmed in the paperwork.");
    });
    startButton.addEventListener("click", startGame);
    continueButton.addEventListener("click", () => {
      endingScreen.hidden = true;
    });
    audioButton.addEventListener("click", () => {
      if (audio.enabled) audio.mute();
      else audio.enable();
    });
    voiceButton.addEventListener("click", () => speech.toggle());
    fullscreenButton.addEventListener("click", toggleFullscreen);
    document.addEventListener("fullscreenchange", updateFullscreenButton);
    document.addEventListener("webkitfullscreenchange", updateFullscreenButton);
    saveButton.addEventListener("click", () => saveGame(true));
    resetButton.addEventListener("click", resetGame);
  }

  async function boot() {
    await preloadImages();
    loadGame();
    bindEvents();
    sceneName.textContent = getScene().title;
    setStatus("Ready.");
    startButton.disabled = false;
    startButton.textContent = "Start";
    updateVerbButtons();
    updateInventory();
    updateQuestTracker();
    updateFullscreenButton();
    window.__COCONUT_READY = true;
    window.__COCONUT_IS_MOBILE_MODE = isMobileMode;
    window.__COCONUT_ENTER_MOBILE_IMMERSIVE = enterMobileImmersiveMode;
    window.__COCONUT_DEBUG_STATE = () => ({
      scene: state.scene,
      inventory: [...state.inventory],
      flags: { ...state.flags },
      quest: getQuestState(),
      choiceOpen: state.choiceHandlers.length,
      miniGame: state.miniGame ? {
        id: state.miniGame.title,
        round: state.miniGame.round,
        score: state.miniGame.score,
      } : null,
      player: { x: state.player.x, y: state.player.y, action: state.player.action },
      started: state.started,
    });
    window.__COCONUT_TEST_ACTION = (sceneId, hotspotId, verb = "look", item = null) => {
      if (sceneId && scenes[sceneId]) {
        state.scene = sceneId;
        state.player.x = scenes[sceneId].walkMin + 180;
        state.player.y = scenes[sceneId].walkY;
      }
      interact(hotspotId, verb, item);
      return window.__COCONUT_DEBUG_STATE();
    };
    window.__COCONUT_TEST_CHOICE = (index = 0) => {
      chooseDialogue(index);
      return window.__COCONUT_DEBUG_STATE();
    };
    window.__COCONUT_TEST_MINI_CHOICE = (index = 0) => {
      chooseMiniGame(index);
      return window.__COCONUT_DEBUG_STATE();
    };
    window.__COCONUT_TEST_ADD_ITEM = (id) => {
      addItem(id);
      return window.__COCONUT_DEBUG_STATE();
    };
    requestAnimationFrame(loop);
  }

  boot().catch((error) => {
    console.error(error);
    setStatus(error.message);
  });
})();
