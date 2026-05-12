const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const bundledNodeModules = "C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function mime(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".mp3")) return "audio/mpeg";
  if (file.endsWith(".ogg")) return "audio/ogg";
  if (file.endsWith(".wav")) return "audio/wav";
  return "application/octet-stream";
}

function staticServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
    const target = path.resolve(root, rel);
    if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": mime(target) });
    fs.createReadStream(target).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function resolvePlaywright() {
  try {
    return require("playwright");
  } catch {
    return require(path.join(bundledNodeModules, "playwright"));
  }
}

async function closeBrowser(browser) {
  let closed = false;
  const closePromise = browser.close()
    .then(() => { closed = true; })
    .catch(() => { closed = true; });
  await Promise.race([
    closePromise,
    new Promise((resolve) => setTimeout(resolve, 5000))
  ]);
  if (!closed && typeof browser.process === "function") {
    const proc = browser.process();
    if (proc && !proc.killed) proc.kill();
  }
}

async function closeServer(server) {
  if (typeof server.closeIdleConnections === "function") server.closeIdleConnections();
  if (typeof server.closeAllConnections === "function") server.closeAllConnections();
  await new Promise((resolve) => server.close(() => resolve()));
}

function watchPage(page, consoleErrors, pageErrors, badResponses) {
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("ERR_NETWORK_CHANGED")) consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("response", (res) => {
    if (res.status() >= 400) badResponses.push(`${res.status()} ${res.url()}`);
  });
}

async function stubExternalFonts(page) {
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({
    status: 200,
    contentType: "text/css; charset=utf-8",
    body: "/* External font CSS is stubbed for offline smoke tests. */"
  }));
  await page.route("https://fonts.gstatic.com/**", (route) => route.fulfill({
    status: 200,
    contentType: "font/woff2",
    body: ""
  }));
}

async function browserSmoke() {
  const { chromium } = resolvePlaywright();
  const server = await staticServer();
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/index.html`;
  const chromeCandidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe"
  ];
  const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--autoplay-policy=no-user-gesture-required", "--allow-file-access-from-files"]
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const consoleErrors = [];
  const pageErrors = [];
  const badResponses = [];
  watchPage(page, consoleErrors, pageErrors, badResponses);
  await stubExternalFonts(page);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => window.__NOCTURNE_READY === true, null, { timeout: 90000 });

  async function canvasProbe() {
    return page.evaluate(() => {
      const canvas = document.getElementById("game");
      const ctx = canvas.getContext("2d");
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let lit = 0;
      let alpha = 0;
      let checksum = 0;
      for (let i = 0; i < data.length; i += 96) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a > 0) alpha += 1;
        if (r + g + b > 35) lit += 1;
        checksum = (checksum + r * 3 + g * 5 + b * 7 + a * 11 + i) % 1000000007;
      }
      return { lit, alpha, checksum };
    });
  }

  await page.waitForTimeout(260);
  const titleFrameA = await canvasProbe();
  const titleState = await page.evaluate(() => window.__NOCTURNE_DEBUG_STATE());
  const titleHudDisplay = await page.evaluate(() => getComputedStyle(document.getElementById("hud")).display);
  await page.waitForTimeout(640);
  const titleFrameB = await canvasProbe();
  const titleFrameDelta = Math.abs(titleFrameB.checksum - titleFrameA.checksum);

  await page.click("#startButton");
  await page.waitForTimeout(900);
  const newRunState = await page.evaluate(() => window.__NOCTURNE_DEBUG_STATE());
  await page.keyboard.press("KeyJ");
  await page.keyboard.press("ArrowUp");
  await page.evaluate(() => {
    window.__NOCTURNE_TEST_TELEPORT("forest", 640, 352);
    window.__NOCTURNE_TEST_INPUT("right", true);
  });
  await page.waitForTimeout(900);
  const movementState = await page.evaluate(() => window.__NOCTURNE_DEBUG_STATE());
  await page.evaluate(() => window.__NOCTURNE_TEST_INPUT("right", false));
  await page.waitForTimeout(500);

  async function transitionProbe(name, setup, expectedRoom) {
    await page.evaluate(() => {
      for (const action of ["left", "right", "up", "down"]) {
        window.__NOCTURNE_TEST_INPUT(action, false);
      }
    });
    await page.evaluate(setup);
    await page.waitForFunction((room) => window.__NOCTURNE_DEBUG_STATE().room === room, expectedRoom, { timeout: 2600 }).catch(() => {});
    await page.waitForTimeout(180);
    const probe = await page.evaluate(() => window.__NOCTURNE_DEBUG_STATE());
    assert(probe.room === expectedRoom, `${name} expected ${expectedRoom}: ${JSON.stringify(probe)}`);
    assert(probe.playerY < probe.roomHeight, `${name} left player below room: ${JSON.stringify(probe)}`);
    return probe;
  }

  const transitionStates = [];
  transitionStates.push(await transitionProbe("forest to castle garden", () => {
    window.__NOCTURNE_TEST_TELEPORT("forest", 1370, 352);
    window.__NOCTURNE_TEST_INPUT("right", true);
  }, "courtyard"));
  transitionStates.push(await transitionProbe("castle garden back to forest", () => {
    window.__NOCTURNE_TEST_TELEPORT("courtyard", 60, 360);
    window.__NOCTURNE_TEST_INPUT("left", true);
  }, "forest"));
  transitionStates.push(await transitionProbe("castle garden to gate hall", () => {
    window.__NOCTURNE_TEST_TELEPORT("courtyard", 1370, 352);
    window.__NOCTURNE_TEST_INPUT("right", true);
  }, "gate"));
  transitionStates.push(await transitionProbe("castle garden down to moat culvert", () => {
    window.__NOCTURNE_TEST_TELEPORT("courtyard", 270, 352);
    window.__NOCTURNE_TEST_INPUT("down", true);
  }, "moat"));
  transitionStates.push(await transitionProbe("moat culvert right to crypt", () => {
    window.__NOCTURNE_TEST_TELEPORT("moat", 1370, 352);
    window.__NOCTURNE_TEST_INPUT("right", true);
  }, "crypt"));
  transitionStates.push(await transitionProbe("crypt left to moat culvert", () => {
    window.__NOCTURNE_TEST_TELEPORT("crypt", 60, 352);
    window.__NOCTURNE_TEST_INPUT("left", true);
  }, "moat"));
  transitionStates.push(await transitionProbe("library left to armory", () => {
    window.__NOCTURNE_TEST_TELEPORT("library", 60, 352);
    window.__NOCTURNE_TEST_INPUT("left", true);
  }, "armory"));
  transitionStates.push(await transitionProbe("armory right to library", () => {
    window.__NOCTURNE_TEST_TELEPORT("armory", 1370, 352);
    window.__NOCTURNE_TEST_INPUT("right", true);
  }, "library"));
  transitionStates.push(await transitionProbe("tower to belltower", () => {
    window.__NOCTURNE_TEST_TELEPORT("tower", 1370, 352);
    window.__NOCTURNE_TEST_INPUT("right", true);
  }, "belltower"));
  transitionStates.push(await transitionProbe("belltower to tower", () => {
    window.__NOCTURNE_TEST_TELEPORT("belltower", 60, 360);
    window.__NOCTURNE_TEST_INPUT("left", true);
  }, "tower"));
  transitionStates.push(await transitionProbe("belltower falling left exit", () => {
    window.__NOCTURNE_TEST_TELEPORT("belltower", -8, 210);
    window.__NOCTURNE_TEST_INPUT("left", true);
  }, "tower"));
  transitionStates.push(await transitionProbe("garden down to cavern", () => {
    window.__NOCTURNE_TEST_TELEPORT("garden", 230, 352);
    window.__NOCTURNE_TEST_INPUT("down", true);
  }, "cavern"));
  transitionStates.push(await transitionProbe("cavern down to sapphire grotto", () => {
    window.__NOCTURNE_TEST_TELEPORT("cavern", 620, 352);
    window.__NOCTURNE_TEST_INPUT("down", true);
  }, "cavernDepths"));
  transitionStates.push(await transitionProbe("belltower right to loft", () => {
    window.__NOCTURNE_TEST_TELEPORT("belltower", 1370, 360);
    window.__NOCTURNE_TEST_INPUT("right", true);
  }, "loft"));
  transitionStates.push(await transitionProbe("loft left to belltower", () => {
    window.__NOCTURNE_TEST_TELEPORT("loft", 60, 360);
    window.__NOCTURNE_TEST_INPUT("left", true);
  }, "belltower"));
  transitionStates.push(await transitionProbe("loft right to observatory", () => {
    window.__NOCTURNE_TEST_TELEPORT("loft", 1370, 360);
    window.__NOCTURNE_TEST_INPUT("right", true);
  }, "observatory"));
  transitionStates.push(await transitionProbe("observatory down to aqueduct", () => {
    window.__NOCTURNE_TEST_TELEPORT("observatory", 456, 352);
    window.__NOCTURNE_TEST_INPUT("down", true);
  }, "aqueduct"));
  transitionStates.push(await transitionProbe("aqueduct up to observatory", () => {
    window.__NOCTURNE_TEST_TELEPORT("aqueduct", 456, 60);
    window.__NOCTURNE_TEST_INPUT("up", true);
  }, "observatory"));
  transitionStates.push(await transitionProbe("cavern right to aqueduct", () => {
    window.__NOCTURNE_TEST_TELEPORT("cavern", 1370, 330);
    window.__NOCTURNE_TEST_INPUT("right", true);
  }, "aqueduct"));
  transitionStates.push(await transitionProbe("sapphire grotto right to aqueduct", () => {
    window.__NOCTURNE_TEST_TELEPORT("cavernDepths", 1370, 330);
    window.__NOCTURNE_TEST_INPUT("right", true);
  }, "aqueduct"));
  transitionStates.push(await transitionProbe("library right to archive", () => {
    window.__NOCTURNE_TEST_TELEPORT("library", 1370, 330);
    window.__NOCTURNE_TEST_INPUT("right", true);
  }, "archive"));
  transitionStates.push(await transitionProbe("mobile auto library upper hatch to forgotten vault", () => {
    window.__NOCTURNE_TEST_SET_PUZZLE("libraryRunes", true);
    window.__NOCTURNE_TEST_TELEPORT("library", 430, 64);
    window.__NOCTURNE_TEST_SET_PLAYER_RAW(430, 64, true);
    if (!document.body.classList.contains("mobile-mode")) document.getElementById("mobileButton").click();
  }, "vault"));
  transitionStates.push(await transitionProbe("gallery right to mirror cloister", () => {
    window.__NOCTURNE_TEST_TELEPORT("gallery", 1370, 330);
    window.__NOCTURNE_TEST_INPUT("right", true);
  }, "mirrorCloister"));
  transitionStates.push(await transitionProbe("mobile clockwork down to gallery without rebound", () => {
    window.__NOCTURNE_TEST_TELEPORT("clock", 456, 382);
    if (!document.body.classList.contains("mobile-mode")) document.getElementById("mobileButton").click();
    window.__NOCTURNE_TEST_INPUT("down", true);
  }, "gallery"));

  const puzzleProbe = await page.evaluate(async () => {
    for (const action of ["left", "right", "up", "down"]) window.__NOCTURNE_TEST_INPUT(action, false);
    window.__NOCTURNE_TEST_SET_PUZZLE("mirrorRunes", false);
    window.__NOCTURNE_TEST_TELEPORT("mirrorCloister", 1370, 330);
    window.__NOCTURNE_TEST_INPUT("right", true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const locked = window.__NOCTURNE_DEBUG_STATE();
    window.__NOCTURNE_TEST_INPUT("right", false);
    window.__NOCTURNE_TEST_SET_PUZZLE("mirrorRunes", true);
    window.__NOCTURNE_TEST_TELEPORT("mirrorCloister", 1370, 330);
    window.__NOCTURNE_TEST_INPUT("right", true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    const unlocked = window.__NOCTURNE_DEBUG_STATE();
    window.__NOCTURNE_TEST_INPUT("right", false);
    window.__NOCTURNE_TEST_SET_PUZZLE("forgeRunes", true);
    window.__NOCTURNE_TEST_SET_PUZZLE("libraryRunes", true);
    window.__NOCTURNE_TEST_SET_PUZZLE("tideRunes", true);
    return { locked, unlocked };
  });

  const mapCycleProbe = await page.evaluate(() => {
    const btn = document.getElementById("mapButton");
    const panel = document.getElementById("mapPanel");
    const mini = document.getElementById("miniMap");
    const snap = () => ({
      mode: window.__NOCTURNE_DEBUG_STATE().mapMode,
      button: btn.textContent.trim(),
      panelHidden: panel.hidden,
      miniHidden: mini.hidden,
      miniCells: document.querySelectorAll(".mini-map-cell").length
    });
    const states = [snap()];
    btn.click();
    states.push(snap());
    btn.click();
    states.push(snap());
    btn.click();
    states.push(snap());
    return states;
  });

  const grottoMechanicProbe = await page.evaluate(async () => {
    for (const action of ["left", "right", "up", "down"]) window.__NOCTURNE_TEST_INPUT(action, false);
    window.__NOCTURNE_TEST_TELEPORT("cavernDepths", 360, 260);
    window.__NOCTURNE_TEST_CLEAR_ROOM_THREATS();
    window.__NOCTURNE_TEST_ALIGN_GROTTO_RIDE(392);
    window.__NOCTURNE_TEST_INPUT("down", true);
    await new Promise((resolve) => setTimeout(resolve, 120));
    let state = window.__NOCTURNE_DEBUG_STATE();
    const ride = state.grotto.platform;
    window.__NOCTURNE_TEST_SET_PLAYER_RAW(ride.x + 44, ride.y - 116, true);
    const carryStart = window.__NOCTURNE_DEBUG_STATE();
    await new Promise((resolve) => setTimeout(resolve, 900));
    const carryEnd = window.__NOCTURNE_DEBUG_STATE();
    window.__NOCTURNE_TEST_INPUT("down", false);

    state = window.__NOCTURNE_DEBUG_STATE();
    const gate = state.grotto.duckGates[0];
    window.__NOCTURNE_TEST_ALIGN_GROTTO_RIDE(gate.x + gate.w / 2 - 44);
    const platform = window.__NOCTURNE_DEBUG_STATE().grotto.platform;
    window.__NOCTURNE_TEST_SET_PLAYER_RAW(gate.x + gate.w / 2 - 21, platform.y - 116, true);
    const noDuckStart = window.__NOCTURNE_DEBUG_STATE();
    await new Promise((resolve) => setTimeout(resolve, 460));
    const noDuckEnd = window.__NOCTURNE_DEBUG_STATE();

    window.__NOCTURNE_TEST_TELEPORT("cavernDepths", 360, 260);
    window.__NOCTURNE_TEST_CLEAR_ROOM_THREATS();
    await new Promise((resolve) => setTimeout(resolve, 120));
    state = window.__NOCTURNE_DEBUG_STATE();
    const duckGate = state.grotto.duckGates[0];
    window.__NOCTURNE_TEST_ALIGN_GROTTO_RIDE(duckGate.x + duckGate.w / 2 - 44);
    const duckPlatform = window.__NOCTURNE_DEBUG_STATE().grotto.platform;
    window.__NOCTURNE_TEST_INPUT("down", true);
    window.__NOCTURNE_TEST_SET_PLAYER_RAW(duckGate.x + duckGate.w / 2 - 21, duckPlatform.y - 116, true);
    const duckStart = window.__NOCTURNE_DEBUG_STATE();
    await new Promise((resolve) => setTimeout(resolve, 460));
    const duckEnd = window.__NOCTURNE_DEBUG_STATE();
    window.__NOCTURNE_TEST_INPUT("down", false);

    return { carryStart, carryEnd, noDuckStart, noDuckEnd, duckStart, duckEnd };
  });

  const enemyVisibilityProbe = await page.evaluate(async () => {
    window.__NOCTURNE_TEST_SET_KILLED("gate", "gatePanther1", true);
    window.__NOCTURNE_TEST_TELEPORT("gate", 120, 330);
    await new Promise((resolve) => setTimeout(resolve, 160));
    const gate = window.__NOCTURNE_DEBUG_STATE();

    window.__NOCTURNE_TEST_SET_KILLED("cavernDepths", "zg1", true);
    window.__NOCTURNE_TEST_TELEPORT("cavernDepths", 180, 82);
    await new Promise((resolve) => setTimeout(resolve, 160));
    const grotto = window.__NOCTURNE_DEBUG_STATE();

    window.__NOCTURNE_TEST_SET_KILLED("gate", "gatePanther1", false);
    window.__NOCTURNE_TEST_SET_KILLED("cavernDepths", "zg1", false);
    return { gate, grotto };
  });

  const chestVisualProbe = await page.evaluate(async () => {
    window.__NOCTURNE_TEST_SET_CHEST_OPENED("vault", "vault_axe_chest", false);
    window.__NOCTURNE_TEST_TELEPORT("vault", 650, 352);
    await new Promise((resolve) => setTimeout(resolve, 180));
    const closed = window.__NOCTURNE_DEBUG_STATE();
    window.__NOCTURNE_TEST_SET_CHEST_OPENED("vault", "vault_axe_chest", true);
    await new Promise((resolve) => setTimeout(resolve, 120));
    const opened = window.__NOCTURNE_DEBUG_STATE();
    window.__NOCTURNE_TEST_SET_CHEST_OPENED("vault", "vault_axe_chest", false);
    return { closed, opened };
  });

  await page.evaluate(() => {
    for (const action of ["left", "right", "up", "down"]) window.__NOCTURNE_TEST_INPUT(action, false);
    window.__NOCTURNE_TEST_TELEPORT("courtyard", 1090, 352);
  });
  await page.waitForTimeout(2400);
  const drawbridgeRaisedState = await page.evaluate(() => window.__NOCTURNE_DEBUG_STATE());
  await page.evaluate(() => window.__NOCTURNE_TEST_PLACE_PLAYER(500, 352));
  await page.waitForTimeout(1800);
  const drawbridgeLoweringState = await page.evaluate(() => window.__NOCTURNE_DEBUG_STATE());

  await page.evaluate(() => {
    window.__NOCTURNE_TEST_TELEPORT("gate", 190, 352);
    if (!document.body.classList.contains("mobile-mode")) document.getElementById("mobileButton").click();
  });
  await page.waitForTimeout(240);
  const mobileJumpStart = await page.evaluate(() => window.__NOCTURNE_DEBUG_STATE());
  const canvasBox = await page.locator("#game").boundingBox();
  assert(canvasBox, "canvas box missing for mobile jump probe");
  await page.mouse.click(canvasBox.x + canvasBox.width * 0.25, canvasBox.y + canvasBox.height * 0.82);
  await page.waitForTimeout(360);
  const mobileJumpState = await page.evaluate(() => window.__NOCTURNE_DEBUG_STATE());

  const state = await page.evaluate(() => {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    let alpha = 0;
    for (let i = 0; i < data.length; i += 96) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a > 0) alpha += 1;
      if (r + g + b > 35) lit += 1;
    }
    return {
      ready: window.__NOCTURNE_READY === true,
      titleHidden: document.getElementById("titlePanel").hidden,
      room: document.getElementById("roomName").textContent,
      frameInfo: window.__NOCTURNE_FRAME_INFO,
      enemyFrameMap: window.__NOCTURNE_ENEMY_FRAME_MAP,
      inputInfo: window.__NOCTURNE_INPUT_INFO,
      tuningInfo: window.__NOCTURNE_TUNING_INFO,
      debugState: window.__NOCTURNE_DEBUG_STATE(),
      hasFullscreen: Boolean(document.getElementById("fullscreenButton")),
      hasMobile: Boolean(document.getElementById("mobileButton")),
      mapButtonText: document.getElementById("mapButton").textContent.trim(),
      objectiveText: document.getElementById("objectiveChip").textContent.trim(),
      compassText: document.getElementById("compassChip").textContent.trim(),
      statusText: document.getElementById("statusLine").textContent.trim(),
      miniMapDisplay: getComputedStyle(document.getElementById("miniMap")).display,
      miniMapObjectiveDisplay: getComputedStyle(document.getElementById("miniMapObjective")).display,
      miniMapCells: document.querySelectorAll(".mini-map-cell").length,
      mapPanelHidden: document.getElementById("mapPanel").hidden,
      hasTouchDown: Boolean(document.querySelector('#touchControls button[data-touch="down"]')),
      mobileMode: document.body.classList.contains("mobile-mode"),
      fullscreen: Boolean(document.fullscreenElement || document.webkitFullscreenElement),
      touchDisplay: getComputedStyle(document.getElementById("touchControls")).display,
      h1FontFamily: getComputedStyle(document.querySelector(".title-inner h1")).fontFamily,
      bodyFontFamily: getComputedStyle(document.body).fontFamily,
      iconButtonFontFamily: getComputedStyle(document.getElementById("mapButton")).fontFamily,
      viewportMeta: document.querySelector('meta[name="viewport"]').content,
      touchButtonText: Array.from(document.querySelectorAll("#touchControls button"), (button) => button.textContent.trim()).join(""),
      touchUserSelect: getComputedStyle(document.querySelector("#touchControls button")).userSelect,
      touchWebkitUserSelect: getComputedStyle(document.querySelector("#touchControls button")).webkitUserSelect,
      touchButtonClipPath: getComputedStyle(document.querySelector("#touchControls button")).clipPath,
      touchButtonBorderRadius: getComputedStyle(document.querySelector("#touchControls button")).borderRadius,
      touchButtonMinSize: Math.min(...Array.from(document.querySelectorAll("#touchControls button"), (button) => {
        const rect = button.getBoundingClientRect();
        return Math.min(rect.width, rect.height);
      })),
      lit,
      alpha,
      hpTransform: document.getElementById("hpFill").style.transform
    };
  });

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileContext.newPage();
  watchPage(mobilePage, consoleErrors, pageErrors, badResponses);
  await stubExternalFonts(mobilePage);
  await mobilePage.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await mobilePage.waitForFunction(() => window.__NOCTURNE_READY === true, null, { timeout: 150000 });
  await mobilePage.waitForTimeout(260);
  const mobileTitleState = await mobilePage.evaluate(() => {
    const h1Style = getComputedStyle(document.querySelector(".title-inner h1"));
    const subtitleStyle = getComputedStyle(document.querySelector(".subtitle"));
    return {
      debug: window.__NOCTURNE_DEBUG_STATE(),
      bodyMobile: document.body.classList.contains("mobile-mode"),
      titleHidden: document.getElementById("titlePanel").hidden,
      h1FontFamily: h1Style.fontFamily,
      h1FontSize: Number.parseFloat(h1Style.fontSize),
      h1LetterSpacing: h1Style.letterSpacing,
      subtitleFontSize: Number.parseFloat(subtitleStyle.fontSize),
      subtitleLetterSpacing: subtitleStyle.letterSpacing,
      viewportMeta: document.querySelector('meta[name="viewport"]').content
    };
  });
  await mobilePage.click("#startButton");
  await mobilePage.waitForTimeout(700);
  const mobileStartState = await mobilePage.evaluate(() => {
    const objectiveChip = document.getElementById("objectiveChip");
    const compassChip = document.getElementById("compassChip");
    const objectiveRect = objectiveChip.getBoundingClientRect();
    const compassRect = compassChip.getBoundingClientRect();
    return {
      debug: window.__NOCTURNE_DEBUG_STATE(),
      bodyMobile: document.body.classList.contains("mobile-mode"),
      titleHidden: document.getElementById("titlePanel").hidden,
      touchDisplay: getComputedStyle(document.getElementById("touchControls")).display,
      objectiveDisplay: getComputedStyle(objectiveChip).display,
      objectiveText: objectiveChip.textContent,
      objectiveRect: {
        width: Math.round(objectiveRect.width),
        height: Math.round(objectiveRect.height),
        top: Math.round(objectiveRect.top),
        left: Math.round(objectiveRect.left)
      },
      compassDisplay: getComputedStyle(compassChip).display,
      compassText: compassChip.textContent,
      compassRect: {
        width: Math.round(compassRect.width),
        height: Math.round(compassRect.height),
        top: Math.round(compassRect.top),
        left: Math.round(compassRect.left)
      },
      miniMapDisplay: getComputedStyle(document.getElementById("miniMap")).display,
      miniMapCells: document.querySelectorAll(".mini-map-cell").length,
      appHeight: Math.round(document.getElementById("app").getBoundingClientRect().height),
      viewportHeight: window.innerHeight,
      fullscreen: Boolean(document.fullscreenElement || document.webkitFullscreenElement)
    };
  });
  await mobileContext.close();

  await closeBrowser(browser);
  await closeServer(server);
  return { url, state, titleState, titleHudDisplay, titleFrameA, titleFrameB, titleFrameDelta, newRunState, movementState, transitionStates, puzzleProbe, mapCycleProbe, grottoMechanicProbe, enemyVisibilityProbe, chestVisualProbe, drawbridgeRaisedState, drawbridgeLoweringState, mobileJumpStart, mobileJumpState, mobileTitleState, mobileStartState, consoleErrors, pageErrors, badResponses };
}

(async () => {
  for (const rel of ["index.html", "style.css", "game.js"]) {
    assert(fs.existsSync(path.join(root, rel)), `${rel} missing`);
  }

  const gameJs = read("game.js");
  const indexHtml = read("index.html");
  assert(gameJs.includes("Nocturne Reliquary"), "game title missing in JS");
  assert(indexHtml.includes("canvas"), "canvas missing in HTML");
  assert(!gameJs.includes('playSound("gate"'), "room-transition gate/gong SFX should stay removed");
  const enemyFrameMapPath = path.join(root, "assets/generated/enemy_imagen_zora_panther_frame_map.json");
  assert(fs.existsSync(enemyFrameMapPath), "zora/panther enemy frame map JSON missing");
  const enemyFrameMap = JSON.parse(fs.readFileSync(enemyFrameMapPath, "utf8"));
  assert(enemyFrameMap.version === "zora-panther-hd-24f-v2", "zora/panther frame map version mismatch");
  assert(enemyFrameMap.animations.zora.frames === 24 && enemyFrameMap.animations.blackPanther.frames === 24, "zora/panther frame map should expose 24 frames each");
  const questBossMapPath = path.join(root, "assets/generated/enemy_imagen_quest_minibosses_frame_map.json");
  assert(fs.existsSync(questBossMapPath), "quest mini-boss frame map JSON missing");
  const questBossMap = JSON.parse(fs.readFileSync(questBossMapPath, "utf8"));
  assert(questBossMap.version === "quest-seal-minibosses-hd-24f-v1", "quest mini-boss frame map version mismatch");
  assert(
    questBossMap.animations.tideWarden.frames === 24 &&
    questBossMap.animations.starWarden.frames === 24,
    "quest mini-boss frame map should keep 24-frame tide/star rows"
  );
  const archiveWardenMapPath = path.join(root, "assets/generated/enemy_imagen_archive_warden_48f_frame_map.json");
  assert(fs.existsSync(archiveWardenMapPath), "Moonlit Archives 48-frame Archive Warden map JSON missing");
  const archiveWardenMap = JSON.parse(fs.readFileSync(archiveWardenMapPath, "utf8"));
  assert(archiveWardenMap.version === "archive-warden-imagen-hd-48f-v1", "Archive Warden frame map version mismatch");
  assert(archiveWardenMap.animations.inkWarden.frames === 48 && archiveWardenMap.animations.inkWarden.attack.length === 12, "Archive Warden should expose a 48-frame attack-capable HD strip");
  assert(fs.existsSync(path.join(root, "assets/generated/props_imagen_hd_armory_moon_cases.png")), "Candlelit Armory Imagen HD moon/case atlas missing");
  assert(fs.existsSync(path.join(root, "assets/generated/props_imagen_hd_library_switches.png")), "Forgotten Library Imagen HD rune switch atlas missing");
  assert(fs.existsSync(path.join(root, "assets/generated/props_imagen_hd_moon_chain_tower.png")), "Moon Chain Tower Imagen HD prop atlas missing");
  assert(fs.existsSync(path.join(root, "assets/generated/props_imagen_hd_gallery_portraits.png")), "Silver Portrait Gallery Imagen HD portrait atlas missing");

  const paths = new Set(Array.from(gameJs.matchAll(/"assets\/[^"]+"/g), (match) => match[0].slice(1, -1)));
  for (const asset of paths) {
    assert(fs.existsSync(path.join(root, asset)), `missing asset: ${asset}`);
  }

  const result = await browserSmoke();
  assert(result.pageErrors.length === 0, `page errors: ${result.pageErrors.join("; ")}`);
  assert(result.consoleErrors.length === 0, `console errors: ${result.consoleErrors.join("; ")}`);
  assert(result.badResponses.length === 0, `bad responses: ${result.badResponses.join("; ")}`);
  assert(result.state.ready, "game never became ready");
  assert(result.titleState.mode === "title", `title scene should render before begin: ${JSON.stringify(result.titleState)}`);
  assert(result.titleState.titleVisuals && result.titleState.titleVisuals.bg === "titleBg", "title screen should use the Imagegen HD title background");
  assert(result.titleState.titleVisuals.parallax.includes("paraForest") && result.titleState.titleVisuals.parallax.includes("paraMist"), "title screen should expose parallax layers");
  assert(result.titleState.titleVisuals.mode7, "title screen should expose Mode7/stretch visuals");
  assert(result.titleHudDisplay === "none", `HUD should be hidden behind the title screen: ${result.titleHudDisplay}`);
  assert(result.titleFrameA.lit > 1800 && result.titleFrameB.lit > 1800, `title canvas appears too dark: ${JSON.stringify({ before: result.titleFrameA, after: result.titleFrameB })}`);
  assert(result.titleFrameDelta > 0, `title canvas should animate between frames: ${JSON.stringify({ before: result.titleFrameA, after: result.titleFrameB })}`);
  assert(result.state.titleHidden, "title did not hide after begin");
  assert(result.state.frameInfo.playerFrameW === 128, "player frame width should be 128");
  assert(result.state.frameInfo.playerFrames === 48, "player frame count should be 48");
  assert(result.state.frameInfo.whipFrameW === 192, "whip frame width should be 192");
  assert(result.state.frameInfo.whipFrames === 16, "whip frame count should be 16");
  assert(result.state.frameInfo.bossFrameW === 320, "boss frame width should be 320");
  assert(result.state.frameInfo.bossFrames === 32, "boss should use the smooth HD 32-frame strip");
  assert(result.state.frameInfo.enemyExtFrameW === 256 && result.state.frameInfo.enemyExtFrameH === 192 && result.state.frameInfo.enemyExtFrames === 24, "extended zora/panther enemy HD frames should be wired");
  assert(result.state.frameInfo.questBossFrameW === 320 && result.state.frameInfo.questBossFrameH === 256 && result.state.frameInfo.questBossFrames === 48, "smooth quest mini-boss HD frames should be wired");
  assert(result.state.frameInfo.archiveWardenFrameW === 320 && result.state.frameInfo.archiveWardenFrameH === 256 && result.state.frameInfo.archiveWardenFrames === 48, "Archive Warden HD 48-frame strip should be wired");
  assert(result.state.frameInfo.chestFrameW === 256 && result.state.frameInfo.chestFrameH === 256 && result.state.frameInfo.chestFrames === 4, "Imagen HD treasure chest sheet should expose four 256px frames");
  assert(result.state.enemyFrameMap.zora.frames === 24 && result.state.enemyFrameMap.blackPanther.frames === 24, "runtime enemy frame map should expose 24-frame zora and panther rows");
  assert(result.state.enemyFrameMap.tideWarden.frames === 48 && result.state.enemyFrameMap.starWarden.frames === 48 && result.state.enemyFrameMap.inkWarden.frames === 48 && result.state.enemyFrameMap.inkWarden.attack.length === 12, "runtime enemy frame map should expose 48-frame quest warden rows");
  assert(result.state.inputInfo.jumpKeys.includes("ArrowUp"), "ArrowUp should trigger jump");
  assert(result.state.inputInfo.upKeys.includes("KeyW"), "W should trigger up/door control");
  assert(result.state.inputInfo.feel.includes("downWhipPogo"), "down-whip pogo should be enabled");
  assert(result.state.inputInfo.mobileStart === "manual-fullscreen-button", "mobile start should not auto-toggle fullscreen");
  assert(result.state.hasTouchDown, "mobile controls should include a down/crouch button");
  assert(result.state.tuningInfo.longRoomWidth > 960, "rooms should be wider than one screen");
  assert(result.state.tuningInfo.longRoomHeight > 540, "rooms should be taller than one screen");
  assert(result.state.tuningInfo.whipSideReach >= 150, "side whip reach should be forgiving");
  assert(result.state.tuningInfo.spriteSet === "stable-v4", "sprites should use the stable pre-reference-slice sheets");
  assert(result.state.tuningInfo.backgroundSet === "imagen-hd-roomfill-v4-room-specific", "Imagen HD room-fill backgrounds should be room-specific");
  assert(result.state.tuningInfo.parallaxSet === "imagen-parallax-v1", "Imagen parallax overlays should be wired");
  assert(result.state.tuningInfo.introParallaxSet === "imagen-intro-parallax-v1", "Imagen intro parallax overlays should be wired");
  assert(result.state.tuningInfo.titleScreenSet === "imagen-title-mode7-parallax-v1", "Imagegen HD title screen should be wired");
  assert(result.state.tuningInfo.mode7Set === "background-stretch-mode7-v1", "Mode7/stretch background fill should be wired");
  assert(result.state.tuningInfo.tileSet === "imagen-hd-platforms-v1", "Imagen HD platform tiles should be wired");
  assert(result.state.tuningInfo.introTileSet === "imagen-intro-props-v1", "Imagen intro tile props should be wired");
  assert(result.state.tuningInfo.itemSet === "imagen-items-hd-v1", "Imagen item icon sheet should be wired");
  assert(result.state.tuningInfo.tileSourceSize === 256, "platform tile source cells should be HD 256px");
  assert(result.state.tuningInfo.tileDrawSize === 48, "platform collision draw tiles should stay gameplay-sized");
  assert(result.state.tuningInfo.roomSet === "forest-garden-expanded-27-hd-puzzle", "expanded puzzle room set should be wired");
  assert(result.state.tuningInfo.introSet === "castlevania-drawbridge-v2", "Castlevania-style drawbridge intro should be wired");
  assert(result.state.tuningInfo.drawbridgeTileSet === "imagen-existing-root-trim-v1", "drawbridge should use existing Imagen HD tile sheets");
  assert(result.state.tuningInfo.drawbridgeChainSet === "existing-fg-chain-rotated-v1", "drawbridge chains should use the existing chain asset");
  assert(result.state.tuningInfo.drawbridgeAnchorSet === "imagen-trim-anchor-plates-v1", "drawbridge anchors should use existing Imagen HD trim tiles");
  assert(result.state.tuningInfo.drawbridgePerf === "world-layer-warmed-water-v3", "drawbridge should use warmed world layers instead of per-camera cache churn");
  assert(result.state.tuningInfo.cavernSection === "sapphire-grotto-zora-v1", "new cavern section should be wired");
  assert(result.state.tuningInfo.grottoMechanic === "moving-water-raft-duck-spikes-v2-hd-assets", "sapphire grotto moving raft and HD duck spikes should be wired");
  assert(result.state.tuningInfo.enemyVisibility === "panther-zora-rim-respawn-v1", "zora and panther visibility tuning should be wired");
  assert(result.state.tuningInfo.chestSet === "imagen-hd-treasure-chests-v2", "Imagen HD treasure chest tuning should be wired");
  assert(result.state.tuningInfo.weaponSet === "hd-subweapons-projectiles-v1", "HD subweapon/projectile sheet should be wired");
  assert(result.state.tuningInfo.doorSet === "imagen-hd-transition-doors-v2", "Imagen HD transition door sheet should be wired");
  assert(result.state.tuningInfo.moatWaterSet === "imagen-hd-mode7-parallax-warmed-v3", "HD moat water tileset should use warmed Mode7 parallax tuning");
  assert(result.state.tuningInfo.puzzleSet === "rune-sequence-gates-v1", "room puzzle gate tuning should be wired");
  assert(result.state.tuningInfo.librarySwitchSet === "imagen-hd-library-rune-switches-v1", "Forgotten Library rune switches should use HD prop assets");
  assert(result.state.tuningInfo.forgePuzzleFlow === "linear-nearby-no-reset-v1", "forge numerals should use a linear no-reset flow");
  assert(result.state.tuningInfo.shrineSet === "imagen-hd-reset-shrine-v1", "reset shrine HD sheet should be wired");
  assert(result.state.tuningInfo.grottoSpikeSet === "imagen-hd-stalagmite-stalactite-v1", "grotto stalagmite/stalactite HD sheet should be wired");
  assert(result.state.tuningInfo.armoryProps === "imagen-hd-armory-moon-cases-v1", "Candlelit Armory HD moon/case props should be wired");
  assert(result.state.tuningInfo.towerGalleryProps === "imagen-hd-moon-chain-gallery-props-v1", "Moon Chain Tower and Gallery Imagen HD prop tuning should be wired");
  assert(result.state.tuningInfo.mapMode === "cycle-off-mini-full-v1", "map mode cycle tuning should be wired");
  assert(result.state.tuningInfo.questSealRoute === "archive-observatory-grotto-full-boss-v2", "quest seal route should force the new sections into full milestone boss progression");
  assert(result.state.tuningInfo.questSealSet === "imagen-quest-seals-hd-v1", "Imagen HD quest seals should be wired");
  assert(result.state.tuningInfo.storyNpcSet === "imagen-story-npc-atlas-v1", "Imagen HD story NPC atlas should be wired");
  assert(result.state.tuningInfo.mapMazeSet === "organic-looped-castle-v2-root-sluice-reservoir", "organic maze loop tuning should be wired");
  assert(result.state.tuningInfo.bossMilestones === "quest-wardens-full-bossfight-v2", "quest wardens should be promoted to full bossfight milestones");
  assert(result.state.tuningInfo.enemyFrameMap === "zora-panther-hd-24f-v2+quest-warden-48f-smooth-v1+archive-warden-imagen-hd-48f-v1", "zora/panther plus smooth quest warden HD frame map tuning should be wired");
  assert(result.state.tuningInfo.objectiveDoorGuide === "in-world-next-exit-v1", "in-world next-exit route guide should be wired");
  assert(result.state.tuningInfo.accessibilityHud === "low-reading-hud-v1", "low-reading accessibility HUD should be wired");
  assert(result.state.tuningInfo.controlSkin === "gothic-medallion-controls-v1", "gothic medallion control skin should be wired");
  assert(result.state.tuningInfo.mobileTouch === "large-hit-targets-v3-readable-fonts", "mobile touch tuning should include readable-font touch targets");
  assert(result.state.tuningInfo.mobileCeilingDoors === "auto-enter-touch-overlap-v1", "mobile ceiling doors should auto-enter when the player overlaps the hatch");
  assert(result.state.tuningInfo.mobileDoorReentryGuard === "block-reverse-door-until-exit-v1", "mobile door reentry guard should prevent immediate bounce-backs");
  assert(result.state.tuningInfo.mobileFont === "compact-cinzel-v1", "mobile font tuning should be wired");
  assert(result.state.tuningInfo.mobileStartFullscreen === "manual-fs-button-v1", "mobile start should keep fullscreen manual");
  assert(result.state.tuningInfo.progressRoute === "full-castle-survey-v1", "full-map survey route should be wired");
  assert(result.state.tuningInfo.difficulty === "classic-puzzle-pressure-v1+warden-milestones-v2", "difficulty tuning should add classic puzzle pressure and warden milestones");
  assert(result.newRunState.visuals && result.newRunState.visuals.bg === "bgForest", "new run should open in the forest room");
  assert(result.newRunState.visuals.parallax.includes("paraForest"), "forest opening should use intro parallax elements");
  assert(result.newRunState.visuals.mode7, "forest opening should use stretched/Mode7 background fill");
  assert(result.newRunState.objectiveDoor && result.newRunState.objectiveDoor.to === "courtyard" && result.newRunState.objectiveDoor.side === "right", `new run should mark the next exit in-world: ${JSON.stringify(result.newRunState.objectiveDoor)}`);
  assert(result.drawbridgeRaisedState.introBridge && result.drawbridgeRaisedState.introBridge.progress > 0.45 && result.drawbridgeRaisedState.introBridge.target === 1, `drawbridge should raise after crossing trigger: ${JSON.stringify(result.drawbridgeRaisedState)}`);
  assert(result.drawbridgeRaisedState.drawbridgeCache && result.drawbridgeRaisedState.drawbridgeCache.deck && result.drawbridgeRaisedState.drawbridgeCache.anchor && result.drawbridgeRaisedState.drawbridgeCache.chains > 0 && result.drawbridgeRaisedState.drawbridgeCache.mode7 > 0 && result.drawbridgeRaisedState.drawbridgeCache.backgrounds > 0 && result.drawbridgeRaisedState.drawbridgeCache.scenery > 0, `drawbridge cached render layers should be active: ${JSON.stringify(result.drawbridgeRaisedState.drawbridgeCache)}`);
  assert(result.drawbridgeRaisedState.drawbridgeCache.chains <= 2, `drawbridge should reuse stable chain strips instead of producing per-frame canvases: ${JSON.stringify(result.drawbridgeRaisedState.drawbridgeCache)}`);
  assert(result.drawbridgeRaisedState.visuals && result.drawbridgeRaisedState.visuals.parallax.includes("paraStatues"), "castle garden should use statue parallax elements");
  assert(result.drawbridgeRaisedState.visuals.mode7, "castle garden should use stretched/Mode7 background fill");
  assert(result.drawbridgeLoweringState.introBridge && result.drawbridgeLoweringState.introBridge.target === 0 && result.drawbridgeLoweringState.introBridge.progress < result.drawbridgeRaisedState.introBridge.progress, `drawbridge should lower for return path: ${JSON.stringify(result.drawbridgeLoweringState)}`);
  assert(result.mobileJumpState.playerY < result.mobileJumpStart.playerY - 35, `mobile tap jump should climb high enough: ${JSON.stringify({ before: result.mobileJumpStart, after: result.mobileJumpState })}`);
  assert(result.movementState.cameraX > 20, `camera should scroll after moving right: ${JSON.stringify(result.movementState)}`);
  assert(result.movementState.roomHeight > 540, "debug state should expose tall rooms");
  const grottoState = result.transitionStates.find((entry) => entry.room === "cavernDepths");
  const moatState = result.transitionStates.find((entry) => entry.room === "moat");
  assert(moatState && moatState.visuals.water && moatState.visuals.water.asset && moatState.visuals.water.width === 1024 && moatState.visuals.water.height === 256, `Moon Moat Culvert should use the HD animated water tilesheet: ${JSON.stringify(moatState && moatState.visuals)}`);
  assert(moatState.visuals.water.mode7 && moatState.visuals.water.parallax && moatState.visuals.water.frames === 4, `Moon Moat Culvert water should expose Mode7 parallax animation metadata: ${JSON.stringify(moatState.visuals.water)}`);
  assert(moatState.visuals.water.cache >= 1 || result.state.debugState.drawbridgeCache.moatWater >= 1, `Moon Moat Culvert water should use cached render layers: ${JSON.stringify(moatState.visuals.water)}`);
  assert(grottoState && grottoState.visuals.bg === "bgCavernDepths", `sapphire grotto should use the new cavern depths background: ${JSON.stringify(grottoState)}`);
  assert(grottoState.visuals.parallax.includes("paraCavernSpires") && grottoState.visuals.parallax.includes("paraCavernMist"), `sapphire grotto should use new parallax layers: ${JSON.stringify(grottoState.visuals)}`);
  assert(grottoState.visuals.mode7, "sapphire grotto should use stretched/Mode7 background fill");
  assert(grottoState.enemyTypes.includes("zora"), `sapphire grotto should spawn zora waterspout enemies: ${JSON.stringify(grottoState.enemyTypes)}`);
  assert(grottoState.enemyTypes.includes("tideWarden"), `sapphire grotto should spawn the Tide Warden quest mini-boss: ${JSON.stringify(grottoState.enemyTypes)}`);
  assert(grottoState.grotto && grottoState.grotto.platform && grottoState.grotto.duckGates.length === 3 && grottoState.grotto.spikesAsset && grottoState.grotto.spikeFrameW === 256, `sapphire grotto should expose moving raft and HD duck gate spikes: ${JSON.stringify(grottoState.grotto)}`);
  const carryOffsetStart = result.grottoMechanicProbe.carryStart.playerX - result.grottoMechanicProbe.carryStart.grotto.platform.x;
  const carryOffsetEnd = result.grottoMechanicProbe.carryEnd.playerX - result.grottoMechanicProbe.carryEnd.grotto.platform.x;
  assert(Math.abs(carryOffsetEnd - carryOffsetStart) <= 18, `moving grotto raft should carry the player: ${JSON.stringify(result.grottoMechanicProbe)}`);
  assert(result.grottoMechanicProbe.noDuckEnd.hp < result.grottoMechanicProbe.noDuckStart.hp, `standing under grotto spikes should hurt: ${JSON.stringify(result.grottoMechanicProbe.noDuckEnd)}`);
  assert(result.grottoMechanicProbe.duckEnd.grotto.ducking && result.grottoMechanicProbe.duckEnd.hp === result.grottoMechanicProbe.duckStart.hp, `ducking should clear the low grotto spikes without damage: ${JSON.stringify(result.grottoMechanicProbe.duckEnd)}`);
  assert(result.enemyVisibilityProbe.gate.enemyTypes.includes("blackPanther"), `black panther should respawn even if a regular kill was saved: ${JSON.stringify(result.enemyVisibilityProbe.gate.enemyTypes)}`);
  assert(result.enemyVisibilityProbe.grotto.enemyTypes.includes("zora"), `zora should respawn even if a regular kill was saved: ${JSON.stringify(result.enemyVisibilityProbe.grotto.enemyTypes)}`);
  const visiblePanther = result.enemyVisibilityProbe.gate.featuredEnemies.find((enemy) => enemy.type === "blackPanther");
  const visibleZora = result.enemyVisibilityProbe.grotto.featuredEnemies.find((enemy) => enemy.type === "zora");
  assert(visiblePanther && visiblePanther.x < 620 && visiblePanther.dw >= 200, `black panther should be readable in the first Gate Hall screen: ${JSON.stringify(result.enemyVisibilityProbe.gate.featuredEnemies)}`);
  assert(visibleZora && visibleZora.x < 620 && visibleZora.dw >= 140, `zora should be readable in the first Sapphire Grotto screen: ${JSON.stringify(result.enemyVisibilityProbe.grotto.featuredEnemies)}`);
  const closedChest = result.chestVisualProbe.closed.chests.find((chest) => chest.id === "vault_axe_chest");
  const openedChest = result.chestVisualProbe.opened.chests.find((chest) => chest.id === "vault_axe_chest");
  assert(closedChest && !closedChest.opened && closedChest.asset && closedChest.frameW === 256 && closedChest.drawW >= 90, `closed vault chest should use the Imagen HD chest sheet: ${JSON.stringify(result.chestVisualProbe.closed.chests)}`);
  assert(openedChest && openedChest.opened && openedChest.asset && openedChest.frames === 4, `opened vault chest should use the HD open-frame sheet: ${JSON.stringify(result.chestVisualProbe.opened.chests)}`);
  const archiveState = result.transitionStates.find((entry) => entry.room === "archive");
  assert(archiveState && archiveState.enemyTypes.includes("inkWarden"), `Moonlit Archives should spawn the Ink Warden quest mini-boss: ${JSON.stringify(archiveState && archiveState.enemyTypes)}`);
  assert(archiveState.hdProps && archiveState.hdProps.archiveWarden && archiveState.hdProps.archiveWardenSize === "15360x256", `Moonlit Archives should use the 48-frame Archive Warden HD sheet: ${JSON.stringify(archiveState && archiveState.hdProps)}`);
  const observatoryState = result.transitionStates.find((entry) => entry.room === "observatory");
  assert(observatoryState && observatoryState.enemyTypes.includes("starWarden"), `Starfall Observatory should spawn the Star Warden quest mini-boss: ${JSON.stringify(observatoryState && observatoryState.enemyTypes)}`);
  assert(observatoryState.visuals.bg === "bgObservatory" && observatoryState.visuals.parallax.includes("paraMoonwellRipples"), `Starfall Observatory should use its HD background/parallax: ${JSON.stringify(observatoryState.visuals)}`);
  const armoryState = result.transitionStates.find((entry) => entry.room === "armory");
  assert(armoryState && armoryState.visuals.bg === "bgArmory" && armoryState.visuals.parallax.includes("paraArches"), `Candlelit Armory should use its HD background/parallax: ${JSON.stringify(armoryState && armoryState.visuals)}`);
  assert(armoryState.hdProps && armoryState.hdProps.armory && armoryState.hdProps.armorySize === "1920x1080", `Candlelit Armory should replace flat moon/rectangles with the HD moon/case overlay: ${JSON.stringify(armoryState && armoryState.hdProps)}`);
  const libraryState = result.transitionStates.find((entry) => entry.room === "library");
  assert(libraryState && libraryState.hdProps && libraryState.hdProps.librarySwitches && libraryState.hdProps.librarySwitchSize === "768x768", `Forgotten Library should render the HD rune switch sheet: ${JSON.stringify(libraryState && libraryState.hdProps)}`);
  const towerState = result.transitionStates.find((entry) => entry.room === "tower");
  assert(towerState && towerState.visuals.bg === "bgTower" && towerState.visuals.parallax.includes("paraMachinery"), `Moon Chain Tower should use its HD background/parallax: ${JSON.stringify(towerState && towerState.visuals)}`);
  assert(towerState.hdProps && towerState.hdProps.tower && towerState.hdProps.towerSize === "1254x1254" && towerState.hdProps.chromaCaches >= 1, `Moon Chain Tower should use the new Imagen HD chain/moon prop atlas: ${JSON.stringify(towerState && towerState.hdProps)}`);
  const galleryState = result.transitionStates.find((entry) => entry.room === "gallery");
  assert(galleryState && galleryState.hdProps && galleryState.hdProps.galleryPortraits && galleryState.hdProps.gallerySize === "1254x1254" && galleryState.hdProps.chromaCaches >= 1, `Silver Portrait Gallery should use the new Imagen HD portrait atlas: ${JSON.stringify(galleryState && galleryState.hdProps)}`);
  const mirrorState = result.transitionStates.find((entry) => entry.room === "mirrorCloister");
  assert(mirrorState && mirrorState.visuals.bg === "bgMirrorCloister" && mirrorState.roomPuzzle && mirrorState.roomPuzzle.id === "mirrorRunes", `Mirror Cloister should expose its HD room and puzzle: ${JSON.stringify(mirrorState)}`);
  assert(result.puzzleProbe.locked.room === "mirrorCloister", `unsolved mirror puzzle should keep chapel door locked: ${JSON.stringify(result.puzzleProbe.locked)}`);
  assert(result.puzzleProbe.unlocked.room === "chapel", `solved mirror puzzle should unlock chapel transition: ${JSON.stringify(result.puzzleProbe.unlocked)}`);
  assert(Array.isArray(result.mapCycleProbe) && result.mapCycleProbe.length === 4, `map cycle probe should expose four states: ${JSON.stringify(result.mapCycleProbe)}`);
  assert(result.mapCycleProbe[0].mode === "mini" && !result.mapCycleProbe[0].miniHidden && result.mapCycleProbe[0].panelHidden, `map should default to mini mode: ${JSON.stringify(result.mapCycleProbe)}`);
  assert(result.mapCycleProbe[1].mode === "full" && !result.mapCycleProbe[1].panelHidden && result.mapCycleProbe[1].miniHidden, `map button should open full map: ${JSON.stringify(result.mapCycleProbe)}`);
  assert(result.mapCycleProbe[2].mode === "off" && result.mapCycleProbe[2].panelHidden && result.mapCycleProbe[2].miniHidden, `map button should turn the map off: ${JSON.stringify(result.mapCycleProbe)}`);
  assert(result.mapCycleProbe[3].mode === "mini" && !result.mapCycleProbe[3].miniHidden && result.mapCycleProbe[3].miniCells >= 30, `map button should cycle back to mini map: ${JSON.stringify(result.mapCycleProbe)}`);
  assert(result.state.debugState.enemyTypes.includes("blackPanther"), `Gate Hall should spawn the black panther enemy: ${JSON.stringify(result.state.debugState.enemyTypes)}`);
  assert(result.state.debugState.survey && result.state.debugState.survey.total >= 30, `survey debug state should include the full organic castle route plus puzzle rooms: ${JSON.stringify(result.state.debugState.survey)}`);
  assert(result.state.debugState.mapMode === "mini" && result.state.mapButtonText === "MINI" && result.state.miniMapDisplay !== "none" && result.state.miniMapCells >= 30 && result.state.mapPanelHidden, `mini map should be visible while full map is closed: ${JSON.stringify(result.state)}`);
  assert(result.state.objectiveText.length <= 8 && result.state.compassText.length <= 4 && result.state.statusText.length <= 32 && result.state.miniMapObjectiveDisplay === "none", `low-reading HUD should keep persistent text compact: ${JSON.stringify(result.state)}`);
  assert(result.state.debugState.questSeals && result.state.debugState.questSeals.total === 3, `debug state should expose the three quest seals: ${JSON.stringify(result.state.debugState.questSeals)}`);
  assert(result.state.debugState.story && result.state.debugState.story.npcAtlas && result.state.debugState.story.npcAtlasSize, `debug state should expose the Imagen story NPC atlas: ${JSON.stringify(result.state.debugState.story)}`);
  assert(result.state.debugState.enemyFrameMap.zoraFrames === 24 && result.state.debugState.enemyFrameMap.pantherFrames === 24 && result.state.debugState.enemyFrameMap.questBossFrames === 48 && result.state.debugState.enemyFrameMap.archiveWardenFrames === 48, "debug state should expose extended enemy frame counts");
  assert(result.state.debugState.enemyFrameMap.version === "zora-panther-hd-24f-v2+quest-warden-48f-smooth-v1+archive-warden-imagen-hd-48f-v1", "debug state should expose the smooth quest warden frame map version");
  assert(result.state.touchButtonText === "", "touch buttons should not expose selectable text");
  assert(result.state.touchUserSelect === "none" || result.state.touchWebkitUserSelect === "none", "touch buttons should disable text selection");
  assert(result.state.touchButtonClipPath !== "none" && /Pirata|Cinzel/.test(result.state.iconButtonFontFamily), `controls should use gothic medallion/plaque styling: ${JSON.stringify({ clip: result.state.touchButtonClipPath, font: result.state.iconButtonFontFamily })}`);
  assert(result.state.touchButtonMinSize >= 64, `touch buttons should be at least 64px: ${result.state.touchButtonMinSize}`);
  assert(result.state.hasFullscreen, "fullscreen button missing");
  assert(result.state.hasMobile, "mobile mode button missing");
  assert(result.state.mobileMode, "manual mobile toggle should leave mobile mode enabled for desktop probe");
  assert(result.state.bodyFontFamily.includes("Cinzel"), `mobile mode should switch to readable Cinzel UI font: ${result.state.bodyFontFamily}`);
  assert(result.state.viewportMeta.includes("viewport-fit=cover"), "mobile viewport should opt into full-screen safe-area coverage");
  assert(result.mobileTitleState.bodyMobile, `mobile title should auto-arm mobile mode: ${JSON.stringify(result.mobileTitleState)}`);
  assert(result.mobileTitleState.debug.mobileLayout, `mobile debug state should detect mobile layout: ${JSON.stringify(result.mobileTitleState.debug)}`);
  assert(result.mobileTitleState.h1FontFamily.includes("Cinzel"), `mobile title should use readable heading font: ${result.mobileTitleState.h1FontFamily}`);
  assert(result.mobileTitleState.h1FontSize <= 48, `mobile title font should be compact: ${result.mobileTitleState.h1FontSize}`);
  assert(["0px", "normal"].includes(result.mobileTitleState.h1LetterSpacing), `mobile title should not widen letters: ${result.mobileTitleState.h1LetterSpacing}`);
  assert(["0px", "normal"].includes(result.mobileTitleState.subtitleLetterSpacing), `mobile subtitle should keep normal tracking: ${result.mobileTitleState.subtitleLetterSpacing}`);
  assert(result.mobileTitleState.viewportMeta.includes("viewport-fit=cover"), "mobile page should use viewport-fit=cover");
  assert(result.mobileStartState.titleHidden, `mobile start should hide title: ${JSON.stringify(result.mobileStartState)}`);
  assert(result.mobileStartState.bodyMobile, `mobile start should keep mobile controls armed: ${JSON.stringify(result.mobileStartState)}`);
  assert(result.mobileStartState.touchDisplay === "flex", `mobile touch controls should appear after start: ${result.mobileStartState.touchDisplay}`);
  assert(result.mobileStartState.debug.mobileStartFullscreenAttempted === 0, `mobile start should not auto-request fullscreen: ${JSON.stringify(result.mobileStartState.debug)}`);
  assert(!result.mobileStartState.fullscreen && !result.mobileStartState.debug.fullscreen, `mobile start should stay in browser mode until FS is tapped: ${JSON.stringify(result.mobileStartState)}`);
  assert(result.mobileStartState.objectiveDisplay !== "none", `mobile objective tracker should be visible: ${JSON.stringify(result.mobileStartState)}`);
  assert(result.mobileStartState.miniMapDisplay !== "none" && result.mobileStartState.miniMapCells >= 27, `mobile mini map should stay visible by default: ${JSON.stringify(result.mobileStartState)}`);
  assert(result.mobileStartState.objectiveRect.width >= 50 && result.mobileStartState.objectiveRect.height >= 18, `mobile objective tracker should keep a compact readable target: ${JSON.stringify(result.mobileStartState.objectiveRect)}`);
  assert(result.mobileStartState.objectiveText.length <= 8, `mobile objective tracker should avoid long reading text: ${result.mobileStartState.objectiveText}`);
  assert(result.mobileStartState.compassDisplay !== "none" && result.mobileStartState.compassRect.width >= 36 && result.mobileStartState.compassText.length <= 4, `mobile compass tracker should stay compact: ${JSON.stringify(result.mobileStartState)}`);
  assert(result.state.lit > 1800, `canvas appears too dark: ${result.state.lit}`);
  assert(result.state.room.length > 0, "room label missing");
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
