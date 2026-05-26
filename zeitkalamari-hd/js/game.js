const ASSET = (path) => path;

const BITMAP_FONT = {
  image: "assets/imagen/fonts/zeitkalamari-bitmap-font-atlas.png",
  chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜabcdefghijklmnopqrstuvwxyzäöüß0123456789!?.,:;+-/()' ",
  columns: 12,
};

const GLYPH_INDEX = new Map([...BITMAP_FONT.chars].map((char, index) => [char, index]));

const ITEMS = {
  mug: {
    name: "Leere Tasse",
    icon: "assets/items/mug.svg",
    text: "Eine Labortasse mit Skala. Sie riecht nach Mut und altem Kakao.",
  },
  coffee: {
    name: "Kaffee",
    icon: "assets/items/coffee.svg",
    text: "So stark, dass er nebenbei kleinere Chronologiefehler korrigiert.",
  },
  glove: {
    name: "Gummihandschuh",
    icon: "assets/items/glove.svg",
    text: "Isoliert gegen Strom, Säure und unangenehme Küchenentscheidungen.",
  },
  yeastGel: {
    name: "Hefegel",
    icon: "assets/items/yeast-gel.svg",
    text: "Ein lebendes Backtriebmittel mit Ambitionen in der Teilchenphysik.",
  },
  coupon: {
    name: "Backstubencoupon",
    icon: "assets/items/coupon.svg",
    text: "Gültig bis: irgendwann. Das reicht der Zukunft offenbar.",
  },
  snack: {
    name: "Synthosnack",
    icon: "assets/items/snack.svg",
    text: "Ein knuspriges Quadrat mit der Geschmacksrichtung 'Archiv'.",
  },
  tuningFork: {
    name: "Stimmgabel",
    icon: "assets/items/tuning-fork.svg",
    text: "Eine museale Resonanzgabel. Sie summt beleidigt.",
  },
  chargedFork: {
    name: "Geladene Gabel",
    icon: "assets/items/charged-fork.svg",
    text: "Resonanz plus Strom. Genau die Art schlechter Idee, die heute passt.",
  },
};

const VERBS = [
  { id: "look", label: "Schau", icon: "◉", image: "assets/imagen/fonts/labels/verb-look.png" },
  { id: "take", label: "Nimm", icon: "▣", image: "assets/imagen/fonts/labels/verb-take.png" },
  { id: "use", label: "Benutze", icon: "⚙", image: "assets/imagen/fonts/labels/verb-use.png" },
  { id: "talk", label: "Rede", icon: "✦", image: "assets/imagen/fonts/labels/verb-talk.png" },
];

const PORTRAITS = {
  leni: "assets/portraits/leni.svg",
  chef: "assets/portraits/chef.svg",
  guard: "assets/portraits/guard.svg",
  kalamari: "assets/portraits/kalamari.svg",
  narrator: "assets/portraits/narrator.svg",
};

const ROOMS = {
  lab: {
    era: "Gegenwart",
    title: "Labor unter dem Kurhotel",
    titleImage: "assets/imagen/fonts/labels/title-lab.png",
    tabImage: "assets/imagen/fonts/labels/tab-lab.png",
    background: "assets/imagen/calibrated/masters/lab-master-1920.png",
    accent: "#2ab7a9",
    layers: [
      {
        id: "portalGlow",
        src: "assets/imagen/calibrated/fullframes/lab-portal-full-sheet.png",
        className: "portal-glow",
        frames: 8,
        duration: 1.25,
        x: 0,
        y: 0,
        w: 100,
        h: 100,
      },
      {
        id: "vacuumTubes",
        src: "assets/imagen/calibrated/fullframes/lab-tubes-full-sheet.png",
        className: "tube-glow",
        frames: 6,
        duration: 0.9,
        x: 0,
        y: 0,
        w: 100,
        h: 100,
      },
      {
        id: "professor",
        src: "assets/imagen/calibrated/fullframes/professor-full-sheet.png",
        className: "npc professor-layer",
        frames: 6,
        duration: 1.4,
        x: 0,
        y: 0,
        w: 100,
        h: 100,
      },
      {
        id: "tankSquid",
        src: "assets/imagen/calibrated/fullframes/lab-tank-full-sheet.png",
        className: "tank-layer",
        frames: 8,
        duration: 1.8,
        x: 0,
        y: 0,
        w: 100,
        h: 100,
      },
    ],
    hotspots: [
      {
        id: "engine",
        label: "Zeitmotor",
        x: 38,
        y: 17,
        w: 27,
        h: 57,
        look:
          "Der Zeitmotor läuft unrund. Eine Anzeige blinkt: 'Chronogel fehlt. Resonanz fehlt. Bitte keine Kalamari füttern.'",
      },
      {
        id: "kalamari",
        label: "Kalamari-KI",
        x: 66,
        y: 28,
        w: 17,
        h: 28,
        look:
          "Ein selbstzufriedener Kopffüßer in einem Tank. Technisch eine KI. Emotional ein sehr nasser Diktator.",
        talk: "kalamari",
      },
      {
        id: "mug",
        label: "Tasse",
        x: 83,
        y: 58,
        w: 7,
        h: 10,
        look: "Eine leere Tasse. Der wissenschaftliche Anfang fast jeder Katastrophe.",
      },
      {
        id: "coffeeMachine",
        label: "Kaffeemaschine",
        x: 88,
        y: 41,
        w: 9,
        h: 26,
        look:
          "Ein koffeinbetriebener Apparat mit drei Zuständen: brummt, tropft, urteilt.",
      },
      {
        id: "locker",
        label: "Spind",
        x: 5,
        y: 38,
        w: 14,
        h: 34,
        look:
          "Auf dem Spind steht 'Nicht öffnen vor dem dritten Akt'. Der dritte Akt fühlt sich nah genug an.",
      },
      {
        id: "fusebox",
        label: "Sicherungskasten",
        x: 21,
        y: 27,
        w: 10,
        h: 24,
        look:
          "Hier knistert Laborstrom. Ohne Isolation ist das ein sehr kurzes Adventure.",
      },
      {
        id: "professor",
        label: "Professor Mohn",
        x: 28,
        y: 58,
        w: 10,
        h: 25,
        look:
          "Professor Mohn steckt bis zum Knie in einer Idee und bis zum Ellbogen in Verantwortung.",
        talk: "professor",
      },
    ],
  },
  past: {
    era: "1876",
    title: "Dampfbäckerei zur knusprigen Schraube",
    titleImage: "assets/imagen/fonts/labels/title-past.png",
    tabImage: "assets/imagen/fonts/labels/tab-past.png",
    background: "assets/imagen/calibrated/masters/kitchen-master-1920.png",
    accent: "#ec5d53",
    layers: [
      {
        id: "chef",
        src: "assets/imagen/calibrated/fullframes/chef-full-sheet.png",
        className: "npc chef-layer",
        frames: 6,
        duration: 1.35,
        x: 0,
        y: 0,
        w: 100,
        h: 100,
      },
      {
        id: "yeastGel",
        src: "assets/imagen/calibrated/fullframes/yeast-full-sheet.png",
        className: "gel-layer",
        frames: 6,
        duration: 0.95,
        x: 0,
        y: 0,
        w: 100,
        h: 100,
      },
    ],
    hotspots: [
      {
        id: "chef",
        label: "Bäckerin Berta",
        x: 62,
        y: 36,
        w: 18,
        h: 36,
        look:
          "Berta knetet mit der Ruhe einer Frau, die Hefe, Dampfmaschinen und Zeitreisende schon gesehen hat.",
        talk: "chef",
      },
      {
        id: "dough",
        label: "Hefegel",
        x: 36,
        y: 58,
        w: 16,
        h: 16,
        look:
          "Der Teig blubbert synchron mit dem Zeitmotor. Das ist entweder nützlich oder ein Hygieneproblem.",
      },
      {
        id: "oven",
        label: "Dampfofen",
        x: 10,
        y: 33,
        w: 20,
        h: 42,
        look:
          "Ein Ofen mit Nieten, Manometer und der Energie eines beleidigten Zuges.",
      },
      {
        id: "couponPress",
        label: "Couponpresse",
        x: 82,
        y: 55,
        w: 11,
        h: 17,
        look:
          "Eine mechanische Presse für Rabattmarken. Natürlich hat die Vergangenheit so etwas.",
      },
    ],
  },
  future: {
    era: "2189",
    title: "Museum für veraltete Snacks",
    titleImage: "assets/imagen/fonts/labels/title-future.png",
    tabImage: "assets/imagen/fonts/labels/tab-future.png",
    background: "assets/imagen/calibrated/masters/archive-master-1920.png",
    accent: "#6f56c9",
    layers: [
      {
        id: "guard",
        src: "assets/imagen/calibrated/fullframes/guard-full-sheet.png",
        className: "npc guard-layer",
        frames: 6,
        duration: 1.45,
        x: 0,
        y: 0,
        w: 100,
        h: 100,
      },
      {
        id: "caseFork",
        src: "assets/imagen/calibrated/fullframes/case-full-sheet.png",
        className: "case-layer",
        frames: 6,
        duration: 1.2,
        x: 0,
        y: 0,
        w: 100,
        h: 100,
      },
    ],
    hotspots: [
      {
        id: "guard",
        label: "Archivwächter",
        x: 64,
        y: 38,
        w: 17,
        h: 36,
        look:
          "Ein höflicher Sicherheitsautomat. Seine Brustplatte sagt: 'Bitte keine Emotionen an die Exponate lehnen.'",
        talk: "guard",
      },
      {
        id: "vending",
        label: "Synthomat",
        x: 8,
        y: 31,
        w: 18,
        h: 43,
        look:
          "Ein Verkaufsautomat, der nur historische Backstubencoupons akzeptiert. Fortschritt ist kompliziert.",
      },
      {
        id: "case",
        label: "Glasvitrine",
        x: 39,
        y: 28,
        w: 18,
        h: 38,
        look:
          "Darin liegt eine Stimmgabel aus der Frühzeit der akustischen Panikforschung.",
      },
      {
        id: "poster",
        label: "Museumsplakat",
        x: 82,
        y: 18,
        w: 12,
        h: 28,
        look:
          "Das Plakat warnt vor unkontrollierten Snacksprüngen. Ein Diagramm zeigt Krümel in fünf Dimensionen.",
      },
    ],
  },
};

const initialState = () => ({
  room: "lab",
  verb: "look",
  selectedItem: null,
  inventory: [],
  flags: {
    mugTaken: false,
    gloveTaken: false,
    gelTaken: false,
    chefCaffeinated: false,
    couponPrinted: false,
    snackDispensed: false,
    guardDistracted: false,
    forkTaken: false,
    gelInstalled: false,
    forkInstalled: false,
    won: false,
  },
});

const els = {
  eraLabel: document.querySelector("#eraLabel"),
  roomTitle: document.querySelector("#roomTitle"),
  timeTabs: document.querySelector("#timeTabs"),
  sceneImage: document.querySelector("#sceneImage"),
  sceneLayers: document.querySelector("#sceneLayers"),
  hotspots: document.querySelector("#hotspots"),
  toast: document.querySelector("#toast"),
  verbs: document.querySelector("#verbs"),
  inventory: document.querySelector("#inventory"),
  cursorText: document.querySelector("#cursorText"),
  resetBtn: document.querySelector("#resetBtn"),
  dialog: document.querySelector("#dialog"),
  dialogPortrait: document.querySelector("#dialogPortrait"),
  dialogName: document.querySelector("#dialogName"),
  dialogText: document.querySelector("#dialogText"),
  dialogNext: document.querySelector("#dialogNext"),
  ending: document.querySelector("#ending"),
  endingRestart: document.querySelector("#endingRestart"),
};

let state = loadState();
let dialogQueue = [];
let dialogDone = null;
let toastTimer = 0;
let uiPulseTimer = 0;

function loadState() {
  try {
    const raw = localStorage.getItem("zeitkalamari-hd-state");
    return raw ? { ...initialState(), ...JSON.parse(raw) } : initialState();
  } catch {
    return initialState();
  }
}

function saveState() {
  try {
    localStorage.setItem("zeitkalamari-hd-state", JSON.stringify(state));
  } catch {
    /* localStorage can be disabled in private browser contexts. */
  }
}

function resetGame() {
  state = initialState();
  closeDialog();
  saveState();
  render();
  say("Leni", PORTRAITS.leni, [
    "Okay. Neuer Versuch. Diesmal rette ich die Zeitlinie, bevor der Kaffee kalt wird.",
  ]);
}

function addItem(id) {
  if (!state.inventory.includes(id)) {
    state.inventory.push(id);
  }
  state.selectedItem = id;
  state.verb = "use";
}

function removeItem(id) {
  state.inventory = state.inventory.filter((item) => item !== id);
  if (state.selectedItem === id) {
    state.selectedItem = null;
  }
}

function hasItem(id) {
  return state.inventory.includes(id);
}

function replaceItem(oldId, newId) {
  removeItem(oldId);
  addItem(newId);
}

function setVerb(id) {
  state.verb = id;
  if (id !== "use") {
    state.selectedItem = null;
  }
  pulseUi();
  saveState();
  render();
}

function selectRoom(id) {
  state.room = id;
  state.selectedItem = null;
  state.verb = "look";
  pulseUi();
  saveState();
  render();
  flash(ROOMS[id].title);
}

function currentRoom() {
  return ROOMS[state.room];
}

function visibleHotspots(room) {
  return room.hotspots.filter((hotspot) => {
    if (hotspot.id === "mug" && state.flags.mugTaken) return false;
    if (hotspot.id === "dough" && state.flags.gelTaken) return false;
    if (hotspot.id === "case" && state.flags.forkTaken) return false;
    return true;
  });
}

function render() {
  const room = currentRoom();
  document.documentElement.style.setProperty("--room-accent", room.accent);
  setBitmapText(els.eraLabel, room.era, "kicker");
  renderRoomTitle(room);
  els.sceneImage.style.backgroundImage = `url("${ASSET(room.background)}")`;
  els.sceneImage.setAttribute("aria-label", room.title);

  renderTimeTabs();
  renderVerbs();
  renderInventory();
  renderSceneLayers(room);
  renderHotspots(room);
  renderCursor();
  els.ending.classList.toggle("hidden", !state.flags.won);
}

function renderRoomTitle(room) {
  els.roomTitle.textContent = "";
  els.roomTitle.setAttribute("aria-label", room.title);
  if (room.titleImage) {
    const img = document.createElement("img");
    img.className = "title-label-img";
    img.src = ASSET(room.titleImage);
    img.alt = room.title;
    els.roomTitle.append(img);
  } else {
    els.roomTitle.textContent = room.title;
  }
}

function renderTimeTabs() {
  els.timeTabs.innerHTML = "";
  Object.entries(ROOMS).forEach(([id, room]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `time-tab${id === state.room ? " active" : ""}`;
    button.setAttribute("data-room", id);
    button.setAttribute("aria-label", room.era);
    if (room.tabImage) {
      button.innerHTML = `<img class="ui-label-img" src="${ASSET(room.tabImage)}" alt="${room.era}" />`;
    } else {
      button.textContent = room.era;
    }
    button.style.borderColor = id === state.room ? room.accent : "";
    button.style.setProperty("--button-accent", room.accent);
    button.addEventListener("click", () => selectRoom(id));
    attachUiPress(button);
    els.timeTabs.append(button);
  });
}

function renderVerbs() {
  els.verbs.innerHTML = "";
  VERBS.forEach((verb) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `verb-button${state.verb === verb.id && !state.selectedItem ? " active" : ""}`;
    button.setAttribute("data-verb", verb.id);
    button.setAttribute("aria-label", verb.label);
    button.innerHTML = `<span class="verb-icon" aria-hidden="true">${verb.icon}</span><img class="ui-label-img" src="${ASSET(verb.image)}" alt="${verb.label}" />`;
    button.addEventListener("click", () => setVerb(verb.id));
    attachUiPress(button);
    els.verbs.append(button);
  });
}

function renderInventory() {
  els.inventory.innerHTML = "";
  if (!state.inventory.length) {
    const empty = document.createElement("span");
    empty.className = "empty-inventory";
    setBitmapText(empty, "Nichts außer Verantwortung", "small");
    els.inventory.append(empty);
    return;
  }

  state.inventory.forEach((id) => {
    const item = ITEMS[id];
    const button = document.createElement("button");
    button.type = "button";
    button.className = `item-button${state.selectedItem === id ? " active" : ""}`;
    button.setAttribute("data-item", id);
    button.title = item.name;
    button.setAttribute("aria-label", item.name);
    button.innerHTML = `<img src="${ASSET(item.icon)}" alt="" />`;
    button.addEventListener("click", () => handleInventoryClick(id));
    attachUiPress(button);
    els.inventory.append(button);
  });
}

function attachUiPress(button) {
  button.addEventListener("pointerdown", () => {
    button.classList.remove("ui-pressed");
    void button.offsetWidth;
    button.classList.add("ui-pressed");
  });
  button.addEventListener("animationend", (event) => {
    if (event.animationName === "uiPress") {
      button.classList.remove("ui-pressed");
    }
  });
}

function renderSceneLayers(room) {
  els.sceneLayers.innerHTML = "";
  (room.layers || []).forEach((layer) => {
    if (layer.hiddenFlag && state.flags[layer.hiddenFlag]) return;
    const node = document.createElement("div");
    node.className = `scene-layer scene-sprite ${layer.className || ""}`;
    node.style.left = `${layer.x}%`;
    node.style.top = `${layer.y}%`;
    node.style.width = `${layer.w}%`;
    node.style.height = `${layer.h}%`;
    node.style.backgroundImage = `url("${ASSET(layer.src)}")`;
    node.style.setProperty("--frames", String(layer.frames || 1));
    node.style.animation = `spriteFrames ${layer.duration || 1.2}s steps(${Math.max(1, (layer.frames || 1) - 1)}, end) infinite`;
    els.sceneLayers.append(node);
  });
}

function renderHotspots(room) {
  els.hotspots.innerHTML = "";
  visibleHotspots(room).forEach((hotspot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hotspot";
    button.style.left = `${hotspot.x}%`;
    button.style.top = `${hotspot.y}%`;
    button.style.width = `${hotspot.w}%`;
    button.style.height = `${hotspot.h}%`;
    button.setAttribute("aria-label", hotspot.label);
    button.innerHTML = `<span class="hotspot-label">${hotspot.label}</span>`;
    button.addEventListener("click", () => handleHotspot(hotspot));
    els.hotspots.append(button);
  });
}

function renderCursor() {
  if (state.selectedItem) {
    setBitmapText(els.cursorText, `Benutze ${ITEMS[state.selectedItem].name} mit ...`, "small");
    return;
  }
  const verb = VERBS.find((entry) => entry.id === state.verb);
  setBitmapText(els.cursorText, verb ? verb.label : "Schau", "small");
}

function setBitmapText(element, text, size = "body") {
  element.textContent = "";
  element.setAttribute("aria-label", text);
  element.classList.add("bitmap-text", `bitmap-${size}`);
  [...text].forEach((char) => {
    if (char === "\n") {
      element.append(document.createElement("br"));
      return;
    }
    const span = document.createElement("span");
    if (char === " ") {
      span.className = "glyph-space";
      element.append(span);
      return;
    }
    const index = GLYPH_INDEX.has(char) ? GLYPH_INDEX.get(char) : GLYPH_INDEX.get("?");
    const col = index % BITMAP_FONT.columns;
    const row = Math.floor(index / BITMAP_FONT.columns);
    span.className = "glyph";
    span.style.setProperty("--glyph-col", col);
    span.style.setProperty("--glyph-row", row);
    span.style.backgroundImage = `url("${ASSET(BITMAP_FONT.image)}")`;
    element.append(span);
  });
}

function handleInventoryClick(id) {
  pulseUi();
  if (state.selectedItem && state.selectedItem !== id) {
    combineItems(state.selectedItem, id);
    return;
  }

  if (state.selectedItem === id) {
    say("Leni", PORTRAITS.leni, [ITEMS[id].text]);
    state.selectedItem = null;
    saveState();
    render();
    return;
  }

  state.selectedItem = id;
  state.verb = "use";
  saveState();
  render();
}

function pulseUi() {
  document.documentElement.classList.remove("ui-ripple");
  void document.documentElement.offsetWidth;
  document.documentElement.classList.add("ui-ripple");
  window.clearTimeout(uiPulseTimer);
  uiPulseTimer = window.setTimeout(() => {
    document.documentElement.classList.remove("ui-ripple");
  }, 420);
}

function combineItems(first, second) {
  const combo = [first, second].sort().join("+");
  if (combo === "glove+tuningFork") {
    say("Leni", PORTRAITS.leni, [
      "Die beiden passen zusammen, aber ohne Laborstrom ist das nur sehr modisches Besteck.",
    ]);
  } else {
    say("Leni", PORTRAITS.leni, [
      `${ITEMS[first].name} und ${ITEMS[second].name} ergeben vor allem eine Ausrede für später.`,
    ]);
  }
  state.selectedItem = null;
  saveState();
  render();
}

function handleHotspot(hotspot) {
  if (state.flags.won) return;

  if (state.selectedItem) {
    useItemOnHotspot(state.selectedItem, hotspot);
    return;
  }

  if (state.verb === "look") {
    say("Leni", PORTRAITS.leni, [hotspot.look || "Das sieht wichtig aus. Wahrscheinlich zu wichtig."]);
  }

  if (state.verb === "take") {
    takeHotspot(hotspot);
  }

  if (state.verb === "use") {
    useHotspot(hotspot);
  }

  if (state.verb === "talk") {
    talkHotspot(hotspot);
  }
}

function takeHotspot(hotspot) {
  switch (hotspot.id) {
    case "mug":
      state.flags.mugTaken = true;
      addItem("mug");
      say("Leni", PORTRAITS.leni, ["Tasse eingesteckt. Wissenschaft beginnt bei Keramik."]);
      break;
    case "locker":
      if (state.flags.gloveTaken) {
        say("Leni", PORTRAITS.leni, ["Der Spind enthält nur noch Staub und passiv-aggressive Etiketten."]);
      } else {
        state.flags.gloveTaken = true;
        addItem("glove");
        say("Leni", PORTRAITS.leni, ["Ein einzelner Gummihandschuh. Perfekt für ein einzelnes schlechtes Vorhaben."]);
      }
      break;
    case "dough":
      state.flags.gelTaken = true;
      addItem("yeastGel");
      say("Berta", PORTRAITS.chef, [
        "Nimm ruhig etwas Hefegel. Wenn es anfängt, über Philosophie zu sprechen, zurück in die Schüssel damit.",
      ]);
      break;
    case "case":
      if (!state.flags.guardDistracted) {
        say("Archivwächter", PORTRAITS.guard, [
          "Zugriff verweigert. Exponate dürfen nur von Personen mit Snackkompetenz berührt werden.",
        ]);
      } else {
        state.flags.forkTaken = true;
        addItem("tuningFork");
        say("Leni", PORTRAITS.leni, ["Stimmgabel erhalten. Sie klingt nach einem sehr kleinen Gewitter."]);
      }
      break;
    default:
      say("Leni", PORTRAITS.leni, ["Das würde ich gerne nehmen, aber es ist fest mit der Kulisse verheiratet."]);
  }
  saveState();
  render();
}

function useHotspot(hotspot) {
  switch (hotspot.id) {
    case "engine":
      reportEngineState();
      break;
    case "coffeeMachine":
      if (hasItem("mug")) {
        useItemOnHotspot("mug", hotspot);
      } else {
        say("Leni", PORTRAITS.leni, ["Ohne Tasse verteilt die Maschine Kaffee eher landschaftlich."]);
      }
      break;
    case "couponPress":
      if (state.flags.chefCaffeinated) {
        makeCoupon();
      } else {
        say("Berta", PORTRAITS.chef, [
          "Die Presse bediene ich erst nach Kaffee. Vorher stanzt sie nur Existenzkrisen.",
        ]);
      }
      break;
    case "vending":
      if (hasItem("coupon")) {
        useItemOnHotspot("coupon", hotspot);
      } else {
        say("Leni", PORTRAITS.leni, ["Der Synthomat blinkt: 'Bitte gültigen Backstubencoupon einführen.'"]);
      }
      break;
    case "fusebox":
      if (hasItem("tuningFork") && hasItem("glove")) {
        chargeFork();
      } else {
        say("Leni", PORTRAITS.leni, [
          "Hier steckt genug Strom für eine Resonanzladung. Mir fehlen nur Isolation und etwas, das schwingen kann.",
        ]);
      }
      break;
    default:
      say("Leni", PORTRAITS.leni, ["Ich benutze das gedanklich. Es fühlt sich mäßig produktiv an."]);
  }
}

function useItemOnHotspot(itemId, hotspot) {
  const item = ITEMS[itemId];

  if (itemId === "mug" && hotspot.id === "coffeeMachine") {
    replaceItem("mug", "coffee");
    say("Leni", PORTRAITS.leni, ["Die Tasse ist jetzt voll Kaffee. Der Kaffee ist jetzt voll Meinung."]);
  } else if (itemId === "coffee" && hotspot.id === "chef") {
    removeItem("coffee");
    state.flags.chefCaffeinated = true;
    say("Berta", PORTRAITS.chef, [
      "Ah! Bohnenmedizin aus der Zukunft!",
      "Dafür drucke ich dir einen Coupon. Vielleicht akzeptiert ihn einmal ein sehr dummer Automat.",
    ], makeCoupon);
  } else if (itemId === "coupon" && hotspot.id === "vending") {
    removeItem("coupon");
    state.flags.snackDispensed = true;
    addItem("snack");
    say("Synthomat", PORTRAITS.guard, ["Coupon erkannt. Ausgabe: ein Synthosnack mit historischer Patina."]);
  } else if (itemId === "snack" && hotspot.id === "guard") {
    removeItem("snack");
    state.flags.guardDistracted = true;
    say("Archivwächter", PORTRAITS.guard, [
      "Snackkompetenz bestätigt.",
      "Ich werde diesen Geschmack nun für die nächsten elf Sekunden analysieren. Bitte ignorieren Sie die offene Vitrine.",
    ]);
  } else if (itemId === "yeastGel" && hotspot.id === "engine") {
    removeItem("yeastGel");
    state.flags.gelInstalled = true;
    say("Leni", PORTRAITS.leni, [
      "Das Hefegel sitzt im Chronobehälter. Der Motor blubbert jetzt wesentlich selbstbewusster.",
    ], checkWin);
  } else if (itemId === "tuningFork" && hotspot.id === "fusebox") {
    if (!hasItem("glove")) {
      say("Leni", PORTRAITS.leni, ["Gute Idee, schlechter Griff. Ich brauche Isolation."]);
    } else {
      chargeFork();
    }
  } else if (itemId === "glove" && hotspot.id === "fusebox") {
    if (hasItem("tuningFork")) {
      chargeFork();
    } else {
      say("Leni", PORTRAITS.leni, [
        "Der Handschuh macht den Strom weniger tödlich. Jetzt fehlt etwas Metallisches für die Resonanz.",
      ]);
    }
  } else if (itemId === "chargedFork" && hotspot.id === "engine") {
    removeItem("chargedFork");
    state.flags.forkInstalled = true;
    say("Leni", PORTRAITS.leni, [
      "Die geladene Gabel stimmt den Zeitmotor. Irgendwo applaudiert ein Physiklehrer widerwillig.",
    ], checkWin);
  } else {
    say("Leni", PORTRAITS.leni, [
      `${item.name} passt hier nicht. Es beleidigt die Situation aber auf interessante Weise.`,
    ]);
  }

  state.selectedItem = null;
  saveState();
  render();
}

function talkHotspot(hotspot) {
  if (hotspot.talk === "chef") {
    if (!state.flags.chefCaffeinated) {
      say("Berta", PORTRAITS.chef, [
        "Ich rede erst nach Kaffee mit Zeitreisenden.",
        "Vor Kaffee sind Zeitreisende nur Kundschaft mit schlechter Ausrede.",
      ]);
    } else {
      say("Berta", PORTRAITS.chef, [
        "Wenn deine Zukunft einen Snackautomaten hat, wird mein Coupon ihn schon überreden.",
      ]);
    }
    return;
  }

  if (hotspot.talk === "guard") {
    if (!state.flags.guardDistracted) {
      say("Archivwächter", PORTRAITS.guard, [
        "Bitte weisen Sie Snackkompetenz nach.",
        "Definition Snackkompetenz: ein Snack, der nicht aus diesem Jahrhundert stammt.",
      ]);
    } else {
      say("Archivwächter", PORTRAITS.guard, [
        "Analyse läuft. Knusperfaktor: absurd. Vitrine: versehentlich offen.",
      ]);
    }
    return;
  }

  if (hotspot.talk === "kalamari") {
    say("Kalamari-KI", PORTRAITS.kalamari, [
      "Wenn ich die Zeitlinie kontrolliere, wird jeder Dienstag ein Badetag.",
      "Dein Motor braucht Hefegel und Resonanz. Was du nie finden wirst, außer du klickst sehr ordentlich.",
    ]);
    return;
  }

  if (hotspot.talk === "professor") {
    say("Professor Mohn", PORTRAITS.narrator, [nextHint()]);
    return;
  }

  say("Leni", PORTRAITS.leni, ["Ich bekomme keine Antwort. Sehr professionell."]);
}

function makeCoupon() {
  if (state.flags.couponPrinted || hasItem("coupon")) return;
  state.flags.couponPrinted = true;
  addItem("coupon");
  saveState();
  render();
}

function chargeFork() {
  if (!hasItem("tuningFork") || !hasItem("glove")) {
    say("Leni", PORTRAITS.leni, ["Dafür brauche ich die Stimmgabel und den Gummihandschuh."]);
    return;
  }
  removeItem("tuningFork");
  removeItem("glove");
  addItem("chargedFork");
  say("Leni", PORTRAITS.leni, [
    "Mit Handschuh, Sicherungskasten und Stimmgabel entsteht eine geladene Resonanzgabel.",
    "Das ist bestimmt nicht versichert.",
  ]);
}

function reportEngineState() {
  if (!state.flags.gelInstalled && !state.flags.forkInstalled) {
    say("Professor Mohn", PORTRAITS.narrator, [
      "Der Motor braucht Chronogel aus einer lebendigen Vergangenheit und eine geladene Resonanz aus der Zukunft.",
    ]);
  } else if (!state.flags.gelInstalled) {
    say("Professor Mohn", PORTRAITS.narrator, [
      "Die Resonanz stimmt. Jetzt fehlt nur noch etwas, das die Zeit weich genug macht.",
    ]);
  } else if (!state.flags.forkInstalled) {
    say("Professor Mohn", PORTRAITS.narrator, [
      "Das Chronogel arbeitet. Jetzt brauchen wir eine geladene Stimmgabel für den Takt.",
    ]);
  } else {
    checkWin();
  }
}

function nextHint() {
  if (!state.flags.mugTaken) return "Fang klein an: Ohne Tasse kein Kaffee, ohne Kaffee keine zivilisierte Bäckerei.";
  if (!hasItem("coffee") && !state.flags.chefCaffeinated) return "Die Kaffeemaschine ist launisch, aber mit einer Tasse verhandelbar.";
  if (!state.flags.chefCaffeinated) return "Berta in der Vergangenheit klingt nach jemandem, der Kaffee historisch würdigt.";
  if (!state.flags.couponPrinted && !hasItem("coupon")) return "Eine wache Bäckerin und eine Couponpresse sind ein gefährlich nützliches Paar.";
  if (!hasItem("snack") && !state.flags.guardDistracted) return "Ein Coupon aus der Vergangenheit könnte in der Zukunft gerade dumm genug sein.";
  if (!state.flags.guardDistracted) return "Der Wächter will Snackkompetenz. Gib ihm etwas, das nach Archiv schmeckt.";
  if (!state.flags.forkTaken && !hasItem("tuningFork")) return "Wenn der Wächter beschäftigt ist, sieht die Glasvitrine weniger endgültig aus.";
  if (!hasItem("chargedFork") && !state.flags.forkInstalled) return "Stimmgabel plus Laborstrom ist gut. Ein Gummihandschuh macht es weniger heldenhaft kurz.";
  if (!state.flags.gelInstalled) return "Bertas Hefegel blubbert verdächtig zeitmotorisch.";
  return "Alles ist bereit. Jetzt muss der Motor nur noch beide Komponenten akzeptieren.";
}

function checkWin() {
  if (state.flags.gelInstalled && state.flags.forkInstalled) {
    state.flags.won = true;
    state.selectedItem = null;
    state.verb = "look";
    saveState();
    render();
    say("Kalamari-KI", PORTRAITS.kalamari, [
      "Nein! Meine perfekt feuchte Dienstagsherrschaft!",
      "Gut. Ich werde die Zeitlinie verschonen. Aber ich verlange eine kleinere Badewanne.",
    ]);
  }
}

function flash(text) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = text;
  els.toast.classList.add("visible");
  toastTimer = window.setTimeout(() => {
    els.toast.classList.remove("visible");
  }, 1900);
}

function say(name, portrait, lines, onDone) {
  dialogQueue = [...lines];
  dialogDone = onDone || null;
  setBitmapText(els.dialogName, name, "name");
  els.dialogPortrait.src = ASSET(portrait);
  els.dialogPortrait.alt = name;
  els.dialog.classList.remove("hidden");
  advanceDialog();
}

function advanceDialog() {
  if (!dialogQueue.length) {
    const done = dialogDone;
    closeDialog();
    if (done) {
      done();
    }
    return;
  }
  setBitmapText(els.dialogText, dialogQueue.shift(), "dialog");
}

function closeDialog() {
  dialogQueue = [];
  dialogDone = null;
  els.dialog.classList.add("hidden");
}

els.dialogNext.addEventListener("click", advanceDialog);
els.resetBtn.addEventListener("click", resetGame);
els.endingRestart.addEventListener("click", resetGame);
attachUiPress(els.dialogNext);
attachUiPress(els.resetBtn);
attachUiPress(els.endingRestart);

window.addEventListener("keydown", (event) => {
  if (!els.dialog.classList.contains("hidden") && (event.key === " " || event.key === "Enter")) {
    event.preventDefault();
    advanceDialog();
  }
  const verb = { 1: "look", 2: "take", 3: "use", 4: "talk" }[event.key];
  if (verb) setVerb(verb);
});

render();

if (!localStorage.getItem("zeitkalamari-hd-intro-seen")) {
  try {
    localStorage.setItem("zeitkalamari-hd-intro-seen", "1");
  } catch {
    /* optional intro marker only */
  }
  say("Leni", PORTRAITS.leni, [
    "Der Kalamari im Tank hat die Zeitlinie gekapert.",
    "Ich brauche Hefegel aus der Vergangenheit und eine geladene Resonanzgabel aus der Zukunft.",
  ]);
}
