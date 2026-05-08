(function () {
  const MotoRidge = (window.MotoRidge = window.MotoRidge || {});
  const canvas = document.querySelector("#game");
  const menu = document.querySelector("#menu");
  const levelButtons = document.querySelector("#levelButtons");
  const startButton = document.querySelector("#startButton");
  const againButton = document.querySelector("#againButton");
  const finishPanel = document.querySelector("#finishPanel");
  const finishMedal = document.querySelector("#finishMedal");
  const finishTime = document.querySelector("#finishTime");
  const finishDetails = document.querySelector("#finishDetails");
  const nextButton = document.querySelector("#nextButton");
  const timeValue = document.querySelector("#timeValue");
  const speedValue = document.querySelector("#speedValue");
  const checkpointValue = document.querySelector("#checkpointValue");
  const scoreValue = document.querySelector("#scoreValue");
  const heatFill = document.querySelector("#heatFill");
  const progressFill = document.querySelector("#progressFill");
  const progressBike = document.querySelector("#progressBike");
  const toast = document.querySelector("#toast");

  let input;
  let renderer;
  let audio;
  let assets;
  let state;
  let selectedLevel = 0;
  let lastTime = 0;
  let paused = false;
  let toastTimer = 0;

  function createAudio() {
    let context = null;
    let master = null;
    let engineOsc = null;
    let engineGain = null;
    let noiseBuffer = null;
    let enabled = false;
    let media = {};
    let bgm = null;
    const clipVolumes = {
      bgm: 0.34,
      jump: 0.48,
      land: 0.42,
      pickup: 0.56,
      crash: 0.5,
      finish: 0.62
    };

    function load(audioManifest) {
      media = {};
      bgm = null;
      if (!audioManifest || typeof Audio === "undefined") return;
      for (const [name, src] of Object.entries(audioManifest)) {
        const clip = new Audio(src);
        clip.preload = "auto";
        clip.volume = clipVolumes[name] || 0.46;
        if (name === "bgm") {
          clip.loop = true;
          bgm = clip;
        } else {
          media[name] = clip;
        }
      }
    }

    function ensure() {
      if (context) return context;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.32;
      master.connect(context.destination);
      noiseBuffer = makeNoiseBuffer(context);
      return context;
    }

    function unlock() {
      const ctx = ensure();
      if (!ctx) return;
      enabled = true;
      if (ctx.state === "suspended") ctx.resume();
      startBgm();
      if (!engineOsc) {
        engineOsc = ctx.createOscillator();
        engineOsc.type = "sawtooth";
        engineGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 420;
        engineGain.gain.value = 0.0001;
        engineOsc.connect(filter);
        filter.connect(engineGain);
        engineGain.connect(master);
        engineOsc.start();
      }
    }

    function update(currentState) {
      if (!enabled || !context || !engineOsc || !currentState) return;
      const bike = currentState.bike;
      const speed = Math.min(1, Math.abs(bike.vx) / 900);
      const throttle = bike.throttleActive || bike.turboActive ? 1 : 0.35;
      const heat = Math.max(0, bike.heat || 0);
      const targetFreq = 62 + speed * 126 + throttle * 34 + heat * 35;
      const targetGain = bike.crashTimer > 0 ? 0.02 : 0.035 + speed * 0.085 + throttle * 0.025;
      engineOsc.frequency.setTargetAtTime(targetFreq, context.currentTime, 0.045);
      engineGain.gain.setTargetAtTime(targetGain, context.currentTime, 0.06);
    }

    function playEvent(event) {
      if (!enabled || !ensure()) return;
      if (event.type === "pickup") {
        playClip("pickup");
        blip(720, 0.08, "triangle", 0.14);
      }
      if (event.type === "checkpoint") blip(520, 0.11, "square", 0.12);
      if (event.type === "jump") playClip("jump");
      if (event.type === "land") playClip("land");
      if (event.type === "bump") {
        playClip("land");
        thud(0.12, 0.14);
      }
      if (event.type === "stunt") {
        blip(640, 0.08, "triangle", 0.13);
        setTimeout(() => blip(900, 0.08, "triangle", 0.1), 70);
      }
      if (event.type === "boost") whoosh(0.16, 0.12);
      if (event.type === "crash") {
        playClip("crash");
        thud();
        burstNoise(0.18, 0.18);
      }
      if (event.type === "finish") {
        playClip("finish");
        blip(540, 0.12, "triangle", 0.16);
        setTimeout(() => blip(720, 0.12, "triangle", 0.14), 95);
        setTimeout(() => blip(960, 0.18, "triangle", 0.12), 190);
      }
      if (event.type === "overheat") burstNoise(0.12, 0.14);
    }

    function startBgm() {
      if (!bgm || !enabled) return;
      bgm.play().catch(() => {});
    }

    function playClip(name) {
      const clip = media[name];
      if (!clip || !enabled) return;
      const instance = clip.cloneNode(true);
      instance.volume = clip.volume;
      instance.play().catch(() => {});
    }

    function blip(freq, duration, type, gainValue) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(gainValue, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(context.currentTime + duration + 0.02);
    }

    function whoosh(duration, gainValue) {
      const source = context.createBufferSource();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      source.buffer = noiseBuffer;
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(320, context.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1800, context.currentTime + duration);
      gain.gain.setValueAtTime(gainValue, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start();
      source.stop(context.currentTime + duration + 0.02);
    }

    function thud(duration = 0.2, gainValue = 0.18) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(96, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(38, context.currentTime + duration * 0.9);
      gain.gain.setValueAtTime(gainValue, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(context.currentTime + duration + 0.02);
    }

    function burstNoise(duration, gainValue) {
      const source = context.createBufferSource();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      source.buffer = noiseBuffer;
      filter.type = "lowpass";
      filter.frequency.value = 900;
      gain.gain.setValueAtTime(gainValue, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start();
      source.stop(context.currentTime + duration + 0.02);
    }

    function makeNoiseBuffer(ctx) {
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      return buffer;
    }

    return { load, unlock, update, playEvent };
  }

  async function loadJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${url}`);
    return response.json();
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load image ${url}`));
      image.src = url;
    });
  }

  async function loadAssets() {
    const manifest = await loadJson("assets/manifest.json");
    const imageEntries = Object.entries(manifest.images);
    const loadedImages = {};
    await Promise.all(imageEntries.map(async ([key, meta]) => {
      loadedImages[key] = await loadImage(meta.file);
    }));
    const levels = await Promise.all(manifest.levels.map((level) => loadJson(level.file)));
    return { manifest, images: loadedImages, levels };
  }

  function buildMenu() {
    levelButtons.innerHTML = "";
    assets.levels.forEach((level, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-pressed", String(index === selectedLevel));
      const best = getStoredNumber(`moto-ridge-best-${level.id}`);
      const medal = getStoredString(`moto-ridge-medal-${level.id}`);
      const suffix = best ? `${best.toFixed(2)}s` : `${Math.round(level.length / 100) / 10} km`;
      button.innerHTML = `<strong>${level.title}</strong><span>${formatMedal(medal)} ${suffix}</span>`;
      button.addEventListener("click", () => {
        selectedLevel = index;
        buildMenu();
      });
      levelButtons.appendChild(button);
    });
  }

  function startSelectedLevel() {
    audio.unlock();
    const level = assets.levels[selectedLevel];
    state = MotoRidge.Simulation.createState(level);
    window.__MOTO_RIDGE_DEBUG.state = state;
    finishPanel.hidden = true;
    toast.hidden = true;
    toastTimer = 0;
    document.body.classList.add("is-racing");
    document.body.classList.remove("is-finished");
    input.clear("restart");
  }

  function showFinish() {
    if (!state || !state.race.finished || !finishPanel.hidden) return;
    finishPanel.hidden = false;
    finishMedal.textContent = formatMedal(state.race.finishMedal || "bronze", true);
    finishTime.textContent = `${state.race.time.toFixed(2)}s`;
    const best = state.race.best ? `${state.race.best.toFixed(2)}s` : "--";
    const score = state.race.score;
    const bestScore = state.race.bestScore || score;
    finishDetails.innerHTML = `<span>Best ${best}</span><span>Score ${score}</span><span>Top Score ${bestScore}</span>`;
    document.body.classList.add("is-finished");
    buildMenu();
  }

  function updateHud() {
    if (!state) return;
    const bike = state.bike;
    const checkpoints = state.level.checkpoints.length;
    timeValue.textContent = state.race.time.toFixed(2);
    speedValue.textContent = String(Math.max(0, Math.round(Math.abs(bike.vx) * 0.18)));
    checkpointValue.textContent = `${bike.checkpointIndex}/${checkpoints}`;
    scoreValue.textContent = String(state.race.score);
    heatFill.style.width = `${Math.round(MotoRidge.Simulation.clamp(bike.heat, 0, 1) * 100)}%`;
    const progress = MotoRidge.Simulation.clamp(bike.x / state.level.length, 0, 1);
    progressFill.style.width = `${Math.round(progress * 100)}%`;
    progressBike.style.left = `${Math.round(progress * 100)}%`;
    updateToast();
  }

  function processEvents(events) {
    for (const event of events) {
      audio.playEvent(event);
      if (event.type === "pickup") showToast(event.kind.replace("_", " "));
      if (event.type === "checkpoint") showToast(`Checkpoint ${event.index}`);
      if (event.type === "stunt") showToast(`Stunt +${event.points}`);
      if (event.type === "overheat") showToast("Overheat");
      if (event.type === "crash") showToast("Crash");
    }
  }

  function showToast(text) {
    toast.textContent = text;
    toast.hidden = false;
    toastTimer = 1.15;
  }

  function updateToast() {
    if (toast.hidden) return;
    toastTimer -= 1 / 60;
    if (toastTimer <= 0) toast.hidden = true;
  }

  function getStoredNumber(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? Number(raw) : 0;
    } catch {
      return 0;
    }
  }

  function getStoredString(key) {
    try {
      return localStorage.getItem(key) || "";
    } catch {
      return "";
    }
  }

  function formatMedal(medal, title) {
    const labels = { gold: "Gold", silver: "Silver", bronze: "Bronze" };
    if (!medal) return title ? "Finish" : "";
    return title ? `${labels[medal] || "Bronze"} Finish` : labels[medal] || "";
  }

  function loop(time) {
    const dt = Math.min(1 / 30, Math.max(0, (time - lastTime) / 1000 || 0));
    lastTime = time;

    if (input && input.wasPressed("pause")) paused = !paused;

    if (state && !paused) {
      MotoRidge.Simulation.updateState(state, input, dt);
      processEvents(state.events);
      audio.update(state);
      renderer.draw(state, time);
      updateHud();
      showFinish();
    } else if (renderer) {
      renderer.drawSplash(time);
    }

    if (input) input.endFrame();
    requestAnimationFrame(loop);
  }

  async function boot() {
    input = MotoRidge.createInput();
    audio = createAudio();
    assets = await loadAssets();
    audio.load(assets.manifest.audio);
    renderer = MotoRidge.createRenderer(canvas, assets);
    buildMenu();
    startButton.addEventListener("click", startSelectedLevel);
    againButton.addEventListener("click", startSelectedLevel);
    nextButton.addEventListener("click", () => {
      selectedLevel = (selectedLevel + 1) % assets.levels.length;
      buildMenu();
      startSelectedLevel();
    });
    window.__MOTO_RIDGE_READY = true;
    window.__MOTO_RIDGE_DEBUG = {
      assets,
      state,
      startLevel(index) {
        selectedLevel = Math.max(0, Math.min(assets.levels.length - 1, index || 0));
        startSelectedLevel();
      }
    };
    requestAnimationFrame(loop);
  }

  boot().catch((error) => {
    console.error(error);
    menu.innerHTML = `<h1>Moto Ridge Rush</h1><button class="primary-btn" type="button">Reload</button>`;
    menu.querySelector("button").addEventListener("click", () => location.reload());
  });
})();
