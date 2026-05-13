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
  const dialogue = document.getElementById("dialogue");
  const speaker = document.getElementById("speaker");
  const line = document.getElementById("line");
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
  const questSteps = document.getElementById("questSteps");
  const hintButton = document.getElementById("hintButton");

  const imageSources = {
    harbor: "assets/backgrounds/harbor_imagen_hd.png",
    tavern: "assets/backgrounds/tavern_imagen_hd.png",
    jungle: "assets/backgrounds/jungle_imagen_hd.png",
    beach: "assets/backgrounds/beach_imagen_hd.png",
    characters: "assets/sprites/characters_imagen_hd_sheet.png?v=imagen-hd-characters-3279e0dff",
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
    dockmaster: { row: 6, frames: 16, fps: 8 },
    barkeep: { row: 7, frames: 16, fps: 10 },
    keeper: { row: 8, frames: 16, fps: 9 },
    keeperIdle: { row: 9, frames: 16, fps: 6 },
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
      shrineOpen: false,
      solved: false,
    },
    player: {
      x: 430,
      y: 824,
      target: null,
      facing: 1,
      action: "idle",
      actionUntil: 0,
      frameT: 0,
    },
    pending: null,
    hover: null,
    lineUntil: 0,
    started: false,
    lastTime: 0,
  };

  const images = {};

  const scenes = {
    harbor: {
      title: "Harbor",
      bg: "harbor",
      music: "harbor",
      walkY: 824,
      walkMin: 170,
      walkMax: 1745,
      actors: [
        { id: "dockmasterActor", anim: "dockmaster", x: 1160, y: 824, scale: 0.82 },
      ],
      exits: [
        { id: "toTavern", label: "Tavern", rect: [1425, 530, 260, 325], to: "tavern", spawn: [380, 816], walkTo: [1510, 824] },
        { id: "toBeach", label: "Beach", rect: [90, 575, 260, 320], to: "beach", spawn: [1510, 836], walkTo: [240, 824] },
      ],
      hotspots: [
        { id: "dockmaster", label: "Dockmaster", rect: [1060, 560, 220, 290], walkTo: [1010, 824], verbs: ["look", "talk"] },
        { id: "rope", label: "Rope Coil", rect: [585, 742, 170, 100], walkTo: [655, 824], hidden: () => state.flags.ropeTaken, verbs: ["look", "take"], item: "rope", itemPos: [642, 827, 100] },
        { id: "crate", label: "Crates", rect: [772, 710, 180, 145], walkTo: [850, 824], hidden: () => state.flags.tokenTaken, verbs: ["look", "take"], item: "token", itemPos: [850, 804, 72] },
        { id: "skiff", label: "Jungle Skiff", rect: [1540, 700, 280, 160], walkTo: [1585, 824], verbs: ["look", "use"] },
      ],
    },
    tavern: {
      title: "Tavern",
      bg: "tavern",
      music: "tavern",
      walkY: 818,
      walkMin: 190,
      walkMax: 1690,
      actors: [
        { id: "barkeepActor", anim: "barkeep", x: 1135, y: 812, scale: 0.86 },
      ],
      exits: [
        { id: "toHarbor", label: "Harbor", rect: [95, 540, 250, 350], to: "harbor", spawn: [1345, 824], walkTo: [260, 818] },
      ],
      hotspots: [
        { id: "barkeep", label: "Barkeep", rect: [1015, 560, 245, 280], walkTo: [930, 818], verbs: ["look", "talk", "use"] },
        { id: "lime", label: "Lime Bowl", rect: [740, 610, 160, 115], walkTo: [785, 818], hidden: () => state.flags.limeTaken, verbs: ["look", "take"], item: "lime", itemPos: [808, 704, 74] },
        { id: "chart", label: "Old Sea Chart", rect: [1330, 412, 225, 190], walkTo: [1395, 818], verbs: ["look"] },
        { id: "spyglass", label: "Brass Spyglass", rect: [585, 676, 180, 95], walkTo: [650, 818], hidden: () => state.flags.spyglassTaken, verbs: ["look", "take"], item: "spyglass", itemPos: [665, 766, 104] },
      ],
    },
    beach: {
      title: "Wreck Beach",
      bg: "beach",
      music: "beach",
      walkY: 836,
      walkMin: 150,
      walkMax: 1760,
      actors: [],
      exits: [
        { id: "toHarbor", label: "Harbor", rect: [1465, 540, 310, 330], to: "harbor", spawn: [290, 824], walkTo: [1510, 836] },
      ],
      hotspots: [
        { id: "wreck", label: "Shipwreck", rect: [850, 410, 480, 330], walkTo: [1000, 836], verbs: ["look", "use"] },
        { id: "tidepool", label: "Tide Pool", rect: [440, 760, 260, 115], walkTo: [585, 836], hidden: () => state.flags.shellKeyTaken, verbs: ["look", "take"], item: "shellKey", itemPos: [585, 842, 82] },
        { id: "bottle", label: "Message Bottle", rect: [680, 770, 170, 100], walkTo: [760, 836], hidden: () => state.flags.bottleTaken, verbs: ["look", "take"], item: "bottle", itemPos: [760, 846, 92] },
        { id: "cliff", label: "Cliff Path", rect: [110, 488, 245, 385], walkTo: [275, 836], verbs: ["look", "use"] },
      ],
    },
    jungle: {
      title: "Jungle Shrine",
      bg: "jungle",
      music: "jungle",
      walkY: 828,
      walkMin: 170,
      walkMax: 1720,
      actors: [
        { id: "keeperActor", anim: "keeperIdle", x: 1360, y: 824, scale: 0.82 },
      ],
      exits: [
        { id: "toHarbor", label: "Harbor", rect: [70, 548, 255, 330], to: "harbor", spawn: [1585, 824], walkTo: [250, 828] },
      ],
      hotspots: [
        { id: "keeper", label: "Shrine Keeper", rect: [1270, 565, 215, 285], walkTo: [1190, 828], verbs: ["look", "talk"] },
        { id: "shrineDoor", label: "Moon Door", rect: [765, 425, 360, 365], walkTo: [920, 828], verbs: ["look", "use"] },
        { id: "vines", label: "Jungle Vines", rect: [300, 355, 260, 365], walkTo: [445, 828], verbs: ["look", "use"] },
      ],
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
      await this.playMusic(scenes[state.scene].music);
    }

    mute() {
      this.enabled = false;
      audioButton.textContent = "Audio";
      Object.values(this.tracks).forEach((audio) => audio.pause());
      this.current = null;
    }

    async playMusic(key) {
      if (!this.enabled) return;
      if (this.current === key) return;
      if (this.current && this.tracks[this.current]) this.tracks[this.current].pause();
      const track = this.tracks[key];
      if (!track) return;
      track.currentTime = 0;
      this.current = key;
      try {
        await track.play();
      } catch {
        this.enabled = false;
        audioButton.textContent = "Audio";
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
      } else if (who === "Keeper") {
        utterance.rate = 0.82;
        utterance.pitch = 0.72;
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
      button.style.setProperty("--icon-sheet", `url("${imageSources.items}")`);
      button.style.setProperty("--icon-pos", `${-col * 78}px ${-row * 78 - 12}px`);
      button.addEventListener("click", () => {
        state.activeItem = state.activeItem === id ? null : id;
        state.verb = "use";
        updateVerbButtons();
        updateInventory();
        statusLine.textContent = state.activeItem ? `Use ${meta.name} with...` : "Choose a command.";
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
    const steps = [
      { id: "rope", label: "Rope from harbor dock", done: hasRope },
      { id: "token", label: "Copper token from crates", done: hasToken || hasVerse },
      { id: "verse", label: "Trade token with barkeep", done: hasVerse },
      { id: "shell", label: "Shell key from tide pool", done: hasShell },
      { id: "skiff", label: "Tie skiff with rope", done: skiffReady },
      { id: "door", label: "Use shell key on Moon Door", done: solved },
    ];

    if (solved) {
      return {
        title: "Star Compass",
        next: "Done: the Star Compass is yours.",
        need: "Treasure recovered.",
        hint: "The compass is safe. Keep exploring or reload if you want another run.",
        current: "door",
        steps,
      };
    }

    if (!hasRope) {
      return {
        title: "Step 1",
        next: "Next: take the Rope Coil on the harbor dock.",
        need: "Place: Harbor",
        hint: "Use Take on the Rope Coil near the left-middle dock.",
        current: "rope",
        steps,
      };
    }

    if (!hasVerse) {
      if (!hasToken) {
        return {
          title: "Step 2",
          next: "Next: take the Copper Token from the harbor crates.",
          need: "Place: Harbor",
          hint: "Use Take on the Crates near the middle of the harbor.",
          current: "token",
          steps,
        };
      }
      return {
        title: "Step 3",
        next: "Next: talk to the Barkeep and spend the Copper Token.",
        need: "Place: Tavern",
        hint: "Walk to the tavern, then Talk to the Barkeep while carrying the token.",
        current: "verse",
        steps,
      };
    }

    if (!hasShell) {
      return {
        title: "Step 4",
        next: "Next: take the Shell Key from the tide pool.",
        need: "Place: Wreck Beach",
        hint: "Go to Wreck Beach and use Take on the Tide Pool near the sand.",
        current: "shell",
        steps,
      };
    }

    if (!skiffReady) {
      return {
        title: "Step 5",
        next: "Next: use the Rope with the Jungle Skiff.",
        need: "Item: Rope",
        hint: "Return to Harbor, choose Use, select the Rope, then click the Jungle Skiff.",
        current: "skiff",
        steps,
      };
    }

    return {
      title: "Final Step",
      next: "Next: sail to the Jungle Shrine and open the Moon Door.",
      need: "Item: Shell Key",
      hint: "Click the tied skiff in Harbor to reach the jungle, then Use Shell Key with Moon Door.",
      current: "door",
      steps,
    };
  }

  function updateQuestTracker() {
    if (!questTracker || !questTitle || !questNext || !questNeed || !questSteps) return;
    const quest = getQuestState();
    questTitle.textContent = quest.title;
    questNext.textContent = quest.next;
    questNeed.textContent = quest.need;
    questSteps.innerHTML = "";
    quest.steps.forEach((step) => {
      const item = document.createElement("li");
      item.textContent = step.label;
      item.classList.toggle("done", step.done);
      item.classList.toggle("current", step.id === quest.current && !step.done);
      questSteps.appendChild(item);
    });
  }

  function showQuestHint() {
    const quest = getQuestState();
    say("Mara", quest.hint, 5200);
  }

  function getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
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

  async function toggleFullscreen() {
    if (!fullscreenButton || fullscreenButton.disabled) return;
    try {
      if (getFullscreenElement()) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      } else if (document.documentElement.webkitRequestFullscreen) {
        await document.documentElement.webkitRequestFullscreen();
      }
    } catch {
      statusLine.textContent = "Fullscreen is not available here.";
    }
    updateFullscreenButton();
  }

  function say(who, text, ms = 3600) {
    speaker.textContent = who;
    line.textContent = text;
    dialogue.classList.add("visible");
    state.lineUntil = performance.now() + ms;
    speech.say(who, text);
  }

  function hideLine(now) {
    if (state.lineUntil && now > state.lineUntil) {
      state.lineUntil = 0;
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
    statusLine.textContent = "Choose a command.";
    audio.playMusic(scenes[to].music);
    updateQuestTracker();
    saveGame(false);
  }

  function handleCanvasClick(event) {
    if (!state.started) return;
    const point = worldFromEvent(event);
    const hit = findHotspot(point);
    if (!hit) {
      walkTo(point.x, point.y);
      return;
    }

    if (hit.type === "exit") {
      const exit = hit.data;
      if (exit.to === "jungle" && !state.flags.skiffReady) {
        walkTo(exit.walkTo[0], exit.walkTo[1], { type: "hotspot", id: "skiff", verb: "look" });
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
      statusLine.textContent = `${prefix} ${hit.data.label}`;
    } else if (hit?.type === "exit") {
      statusLine.textContent = `Walk to ${hit.data.label}`;
    } else {
      statusLine.textContent = "Walk";
    }
  }

  function interactPending() {
    const pending = state.pending;
    state.pending = null;
    if (!pending) return;

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
          transition("jungle", [360, scenes.jungle.walkY]);
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
            transition("jungle", [360, scenes.jungle.walkY]);
          }
        } else {
          say("Mara", state.flags.skiffReady ? "A tied skiff, ready for shrine business." : "A skiff tugging at the dock like it wants a better plan.");
        }
        break;
      case "barkeep":
        if (verb === "talk") {
          setAction("talk", 900);
          if (hasItem("token") && !state.flags.gotNote) {
            removeItem("token");
            state.flags.gotNote = true;
            addItem("brassNote");
            say("Barkeep", "For that token, you get the old verse: shell turns moon, moon wakes star.");
          } else if (state.flags.gotNote) {
            say("Barkeep", "Remember the verse. It has survived three storms and one accordion night.");
          } else {
            say("Barkeep", "No tab, no tale. Bring a dock token and I might become educational.");
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
          ? "Through the spyglass, a tiny ink mark points from the wreck to the shrine."
          : "The chart marks a wreck, a shrine, and the phrase: shell turns moon.");
        break;
      case "wreck":
        if (verb === "use") {
          setAction("use", 700);
          say("Mara", "The planks groan a sea shanty in a key nobody asked for.");
        } else {
          say("Mara", "A proud ship, now mostly an argument with sand.");
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
          say("Keeper", state.flags.gotNote
            ? "The door listens for the old verse. The shell key is only half the manners."
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
      case "vines":
        say("Mara", "The vines have wrapped themselves into a botanical no-entry sign.");
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
    } else if (item === "bottle" && hotspotId === "keeper") {
      say("Keeper", "The sea still sends letters. Mostly complaints, but this one is helpful.");
    } else if (item === "lime" && hotspotId === "wreck") {
      say("Mara", "The wreck refuses the lime. Fair.");
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
    player.frameT = (player.frameT + dt * anim.fps) % anim.frames;
  }

  function drawSprite(animName, x, y, scale = 1, frameOffset = 0) {
    const anim = anims[animName] || anims.idle;
    const frame = Math.floor((state.player.frameT + frameOffset) % anim.frames);
    const sx = frame * FRAME_W;
    const sy = anim.row * FRAME_H;
    const w = FRAME_W * scale;
    const h = FRAME_H * scale;
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.beginPath();
    ctx.ellipse(x, y - 8 * scale, 46 * scale, 12 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.drawImage(images.characters, sx, sy, FRAME_W, FRAME_H, x - w / 2, y - h, w, h);
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

  function drawHover() {
    const hit = state.hover;
    if (!hit) return;
    const rect = hit.data.rect;
    ctx.save();
    ctx.strokeStyle = hit.type === "exit" ? "rgba(121, 216, 255, 0.72)" : "rgba(240, 199, 102, 0.72)";
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 12]);
    ctx.strokeRect(rect[0], rect[1], rect[2], rect[3]);
    ctx.restore();
  }

  function drawScene(now) {
    const scene = getScene();
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    ctx.drawImage(images[scene.bg], 0, 0, WORLD_W, WORLD_H);

    scene.actors.forEach((actor, index) => {
      drawSprite(actor.anim, actor.x, actor.y, actor.scale, index * 3);
    });

    drawSceneItems(scene);
    drawSprite(state.player.action, state.player.x, state.player.y, 0.86);

    if (state.flags.shrineOpen && state.scene === "jungle") {
      ctx.save();
      ctx.globalAlpha = 0.64 + Math.sin(now / 180) * 0.12;
      ctx.fillStyle = "#f0c766";
      ctx.beginPath();
      ctx.ellipse(950, 570, 82, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawHover();
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
    statusLine.textContent = "Choose a command.";
    updateVerbButtons();
    updateInventory();
    updateQuestTracker();
    audio.playMusic(getScene().music);
  }

  function bindEvents() {
    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousemove", handleHover);
    canvas.addEventListener("mouseleave", () => {
      state.hover = null;
      if (state.started) statusLine.textContent = "Choose a command.";
    });
    verbs.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-verb]");
      if (!button) return;
      setVerb(button.dataset.verb);
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
    hintButton.addEventListener("click", showQuestHint);
    saveButton.addEventListener("click", () => saveGame(true));
    resetButton.addEventListener("click", resetGame);
  }

  async function boot() {
    await Promise.all(Object.entries(imageSources).map(([key, src]) => loadImage(key, src)));
    loadGame();
    bindEvents();
    sceneName.textContent = getScene().title;
    statusLine.textContent = "Ready.";
    updateVerbButtons();
    updateInventory();
    updateQuestTracker();
    updateFullscreenButton();
    window.__COCONUT_READY = true;
    window.__COCONUT_DEBUG_STATE = () => ({
      scene: state.scene,
      inventory: [...state.inventory],
      flags: { ...state.flags },
      quest: getQuestState(),
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
    window.__COCONUT_TEST_ADD_ITEM = (id) => {
      addItem(id);
      return window.__COCONUT_DEBUG_STATE();
    };
    requestAnimationFrame(loop);
  }

  boot().catch((error) => {
    console.error(error);
    statusLine.textContent = error.message;
  });
})();
