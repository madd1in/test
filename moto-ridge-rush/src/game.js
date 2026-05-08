(function () {
  const MotoRidge = (window.MotoRidge = window.MotoRidge || {});
  const canvas = document.querySelector("#game");
  const menu = document.querySelector("#menu");
  const levelButtons = document.querySelector("#levelButtons");
  const startButton = document.querySelector("#startButton");
  const againButton = document.querySelector("#againButton");
  const finishPanel = document.querySelector("#finishPanel");
  const finishTime = document.querySelector("#finishTime");
  const timeValue = document.querySelector("#timeValue");
  const speedValue = document.querySelector("#speedValue");
  const checkpointValue = document.querySelector("#checkpointValue");
  const heatFill = document.querySelector("#heatFill");

  let input;
  let renderer;
  let assets;
  let state;
  let selectedLevel = 0;
  let lastTime = 0;
  let paused = false;

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
      button.innerHTML = `<strong>${level.title}</strong><span>${Math.round(level.length / 100) / 10} km</span>`;
      button.addEventListener("click", () => {
        selectedLevel = index;
        buildMenu();
      });
      levelButtons.appendChild(button);
    });
  }

  function startSelectedLevel() {
    const level = assets.levels[selectedLevel];
    state = MotoRidge.Simulation.createState(level);
    window.__MOTO_RIDGE_DEBUG.state = state;
    finishPanel.hidden = true;
    document.body.classList.add("is-racing");
    document.body.classList.remove("is-finished");
    input.clear("restart");
  }

  function showFinish() {
    if (!state || !state.race.finished || !finishPanel.hidden) return;
    finishPanel.hidden = false;
    finishTime.textContent = `${state.race.time.toFixed(2)}s`;
    document.body.classList.add("is-finished");
  }

  function updateHud() {
    if (!state) return;
    const bike = state.bike;
    const checkpoints = state.level.checkpoints.length;
    timeValue.textContent = state.race.time.toFixed(2);
    speedValue.textContent = String(Math.max(0, Math.round(Math.abs(bike.vx) * 0.18)));
    checkpointValue.textContent = `${bike.checkpointIndex}/${checkpoints}`;
    heatFill.style.width = `${Math.round(MotoRidge.Simulation.clamp(bike.heat, 0, 1) * 100)}%`;
  }

  function loop(time) {
    const dt = Math.min(1 / 30, Math.max(0, (time - lastTime) / 1000 || 0));
    lastTime = time;

    if (input && input.wasPressed("pause")) paused = !paused;

    if (state && !paused) {
      MotoRidge.Simulation.updateState(state, input, dt);
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
    assets = await loadAssets();
    renderer = MotoRidge.createRenderer(canvas, assets);
    buildMenu();
    startButton.addEventListener("click", startSelectedLevel);
    againButton.addEventListener("click", () => {
      state = null;
      finishPanel.hidden = true;
      document.body.classList.remove("is-racing", "is-finished");
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
