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
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("response", (res) => {
    if (res.status() >= 400) badResponses.push(`${res.status()} ${res.url()}`);
  });
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
  await page.keyboard.press("KeyJ");
  await page.keyboard.press("ArrowUp");
  await page.evaluate(() => window.__NOCTURNE_TEST_INPUT("right", true));
  await page.waitForTimeout(3200);
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
    await page.waitForTimeout(1400);
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
  transitionStates.push(await transitionProbe("library right to archive", () => {
    window.__NOCTURNE_TEST_TELEPORT("library", 1370, 330);
    window.__NOCTURNE_TEST_INPUT("right", true);
  }, "archive"));

  await page.evaluate(() => {
    for (const action of ["left", "right", "up", "down"]) window.__NOCTURNE_TEST_INPUT(action, false);
    window.__NOCTURNE_TEST_TELEPORT("courtyard", 1090, 352);
  });
  await page.waitForTimeout(1000);
  const drawbridgeRaisedState = await page.evaluate(() => window.__NOCTURNE_DEBUG_STATE());
  await page.evaluate(() => window.__NOCTURNE_TEST_PLACE_PLAYER(500, 352));
  await page.waitForTimeout(900);
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
      inputInfo: window.__NOCTURNE_INPUT_INFO,
      tuningInfo: window.__NOCTURNE_TUNING_INFO,
      debugState: window.__NOCTURNE_DEBUG_STATE(),
      hasFullscreen: Boolean(document.getElementById("fullscreenButton")),
      hasMobile: Boolean(document.getElementById("mobileButton")),
      hasTouchDown: Boolean(document.querySelector('#touchControls button[data-touch="down"]')),
      touchButtonText: Array.from(document.querySelectorAll("#touchControls button"), (button) => button.textContent.trim()).join(""),
      touchUserSelect: getComputedStyle(document.querySelector("#touchControls button")).userSelect,
      touchWebkitUserSelect: getComputedStyle(document.querySelector("#touchControls button")).webkitUserSelect,
      touchButtonMinSize: Math.min(...Array.from(document.querySelectorAll("#touchControls button"), (button) => {
        const rect = button.getBoundingClientRect();
        return Math.min(rect.width, rect.height);
      })),
      lit,
      alpha,
      hpTransform: document.getElementById("hpFill").style.transform
    };
  });

  await closeBrowser(browser);
  server.close();
  return { url, state, titleState, titleHudDisplay, titleFrameA, titleFrameB, titleFrameDelta, movementState, transitionStates, drawbridgeRaisedState, drawbridgeLoweringState, mobileJumpStart, mobileJumpState, consoleErrors, pageErrors, badResponses };
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
  assert(result.state.frameInfo.playerFrames === 24, "player frame count should be 24");
  assert(result.state.frameInfo.whipFrameW === 192, "whip frame width should be 192");
  assert(result.state.frameInfo.whipFrames === 8, "whip frame count should be 8");
  assert(result.state.frameInfo.bossFrameW === 320, "boss frame width should be 320");
  assert(result.state.frameInfo.bossFrames === 16, "boss should use the HD 16-frame strip");
  assert(result.state.inputInfo.jumpKeys.includes("ArrowUp"), "ArrowUp should trigger jump");
  assert(result.state.inputInfo.upKeys.includes("KeyW"), "W should trigger up/door control");
  assert(result.state.inputInfo.feel.includes("downWhipPogo"), "down-whip pogo should be enabled");
  assert(result.state.hasTouchDown, "mobile controls should include a down/crouch button");
  assert(result.state.tuningInfo.longRoomWidth > 960, "rooms should be wider than one screen");
  assert(result.state.tuningInfo.longRoomHeight > 540, "rooms should be taller than one screen");
  assert(result.state.tuningInfo.whipSideReach >= 150, "side whip reach should be forgiving");
  assert(result.state.tuningInfo.spriteSet === "stable-v4", "sprites should use the stable pre-reference-slice sheets");
  assert(result.state.tuningInfo.backgroundSet === "imagen-hd-roomfill-v3", "Imagen HD room-fill backgrounds should be wired");
  assert(result.state.tuningInfo.parallaxSet === "imagen-parallax-v1", "Imagen parallax overlays should be wired");
  assert(result.state.tuningInfo.introParallaxSet === "imagen-intro-parallax-v1", "Imagen intro parallax overlays should be wired");
  assert(result.state.tuningInfo.titleScreenSet === "imagen-title-mode7-parallax-v1", "Imagegen HD title screen should be wired");
  assert(result.state.tuningInfo.mode7Set === "background-stretch-mode7-v1", "Mode7/stretch background fill should be wired");
  assert(result.state.tuningInfo.tileSet === "imagen-hd-platforms-v1", "Imagen HD platform tiles should be wired");
  assert(result.state.tuningInfo.introTileSet === "imagen-intro-props-v1", "Imagen intro tile props should be wired");
  assert(result.state.tuningInfo.itemSet === "imagen-items-hd-v1", "Imagen item icon sheet should be wired");
  assert(result.state.tuningInfo.tileSourceSize === 256, "platform tile source cells should be HD 256px");
  assert(result.state.tuningInfo.tileDrawSize === 48, "platform collision draw tiles should stay gameplay-sized");
  assert(result.state.tuningInfo.roomSet === "forest-garden-expanded-21-hd", "expanded optional room set should be wired");
  assert(result.state.tuningInfo.introSet === "castlevania-drawbridge-v2", "Castlevania-style drawbridge intro should be wired");
  assert(result.state.tuningInfo.mobileTouch === "large-hit-targets-v2", "mobile touch tuning should include larger hit targets");
  assert(result.state.tuningInfo.difficulty === "mercy-pass", "difficulty tuning should be softened");
  assert(result.movementState.visuals && result.movementState.visuals.bg === "bgForest", "new run should open in the forest room");
  assert(result.movementState.visuals.parallax.includes("paraForest"), "forest opening should use intro parallax elements");
  assert(result.movementState.visuals.mode7, "forest opening should use stretched/Mode7 background fill");
  assert(result.drawbridgeRaisedState.introBridge && result.drawbridgeRaisedState.introBridge.progress > 0.45 && result.drawbridgeRaisedState.introBridge.target === 1, `drawbridge should raise after crossing trigger: ${JSON.stringify(result.drawbridgeRaisedState)}`);
  assert(result.drawbridgeRaisedState.visuals && result.drawbridgeRaisedState.visuals.parallax.includes("paraStatues"), "castle garden should use statue parallax elements");
  assert(result.drawbridgeRaisedState.visuals.mode7, "castle garden should use stretched/Mode7 background fill");
  assert(result.drawbridgeLoweringState.introBridge && result.drawbridgeLoweringState.introBridge.target === 0 && result.drawbridgeLoweringState.introBridge.progress < result.drawbridgeRaisedState.introBridge.progress, `drawbridge should lower for return path: ${JSON.stringify(result.drawbridgeLoweringState)}`);
  assert(result.mobileJumpState.playerY < result.mobileJumpStart.playerY - 35, `mobile tap jump should climb high enough: ${JSON.stringify({ before: result.mobileJumpStart, after: result.mobileJumpState })}`);
  assert(result.movementState.cameraX > 20, `camera should scroll after moving right: ${JSON.stringify(result.movementState)}`);
  assert(result.movementState.roomHeight > 540, "debug state should expose tall rooms");
  assert(result.state.touchButtonText === "", "touch buttons should not expose selectable text");
  assert(result.state.touchUserSelect === "none" || result.state.touchWebkitUserSelect === "none", "touch buttons should disable text selection");
  assert(result.state.touchButtonMinSize >= 64, `touch buttons should be at least 64px: ${result.state.touchButtonMinSize}`);
  assert(result.state.hasFullscreen, "fullscreen button missing");
  assert(result.state.hasMobile, "mobile mode button missing");
  assert(result.state.lit > 1800, `canvas appears too dark: ${result.state.lit}`);
  assert(result.state.room.length > 0, "room label missing");
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
