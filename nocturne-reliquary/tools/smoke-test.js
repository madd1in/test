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

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => window.__NOCTURNE_READY === true, null, { timeout: 90000 });
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
      touchButtonText: Array.from(document.querySelectorAll("#touchControls button"), (button) => button.textContent.trim()).join(""),
      touchUserSelect: getComputedStyle(document.querySelector("#touchControls button")).userSelect,
      touchWebkitUserSelect: getComputedStyle(document.querySelector("#touchControls button")).webkitUserSelect,
      lit,
      alpha,
      hpTransform: document.getElementById("hpFill").style.transform
    };
  });

  await browser.close();
  server.close();
  return { url, state, movementState, transitionStates, consoleErrors, pageErrors, badResponses };
}

(async () => {
  for (const rel of ["index.html", "style.css", "game.js"]) {
    assert(fs.existsSync(path.join(root, rel)), `${rel} missing`);
  }

  const gameJs = read("game.js");
  const indexHtml = read("index.html");
  assert(gameJs.includes("Nocturne Reliquary"), "game title missing in JS");
  assert(indexHtml.includes("canvas"), "canvas missing in HTML");

  const paths = new Set(Array.from(gameJs.matchAll(/"assets\/[^"]+"/g), (match) => match[0].slice(1, -1)));
  for (const asset of paths) {
    assert(fs.existsSync(path.join(root, asset)), `missing asset: ${asset}`);
  }

  const result = await browserSmoke();
  assert(result.pageErrors.length === 0, `page errors: ${result.pageErrors.join("; ")}`);
  assert(result.consoleErrors.length === 0, `console errors: ${result.consoleErrors.join("; ")}`);
  assert(result.badResponses.length === 0, `bad responses: ${result.badResponses.join("; ")}`);
  assert(result.state.ready, "game never became ready");
  assert(result.state.titleHidden, "title did not hide after begin");
  assert(result.state.frameInfo.playerFrameW === 128, "player frame width should be 128");
  assert(result.state.frameInfo.playerFrames === 24, "player frame count should be 24");
  assert(result.state.frameInfo.whipFrameW === 192, "whip frame width should be 192");
  assert(result.state.frameInfo.whipFrames === 8, "whip frame count should be 8");
  assert(result.state.inputInfo.jumpKeys.includes("ArrowUp"), "ArrowUp should trigger jump");
  assert(result.state.inputInfo.upKeys.includes("KeyW"), "W should trigger up/door control");
  assert(result.state.inputInfo.feel.includes("downWhipPogo"), "down-whip pogo should be enabled");
  assert(result.state.tuningInfo.longRoomWidth > 960, "rooms should be wider than one screen");
  assert(result.state.tuningInfo.longRoomHeight > 540, "rooms should be taller than one screen");
  assert(result.state.tuningInfo.whipSideReach >= 150, "side whip reach should be forgiving");
  assert(result.state.tuningInfo.spriteSet === "stable-v4", "sprites should use the stable pre-reference-slice sheets");
  assert(result.state.tuningInfo.backgroundSet === "imagen-hd-roomfill-v2", "Imagen HD room-fill backgrounds should be wired");
  assert(result.state.tuningInfo.tileSet === "imagen-hd-platforms-v1", "Imagen HD platform tiles should be wired");
  assert(result.state.tuningInfo.tileSourceSize === 256, "platform tile source cells should be HD 256px");
  assert(result.state.tuningInfo.tileDrawSize === 48, "platform collision draw tiles should stay gameplay-sized");
  assert(result.state.tuningInfo.difficulty === "mercy-pass", "difficulty tuning should be softened");
  assert(result.movementState.cameraX > 20, `camera should scroll after moving right: ${JSON.stringify(result.movementState)}`);
  assert(result.movementState.roomHeight > 540, "debug state should expose tall rooms");
  assert(result.state.touchButtonText === "", "touch buttons should not expose selectable text");
  assert(result.state.touchUserSelect === "none" || result.state.touchWebkitUserSelect === "none", "touch buttons should disable text selection");
  assert(result.state.hasFullscreen, "fullscreen button missing");
  assert(result.state.hasMobile, "mobile mode button missing");
  assert(result.state.lit > 1800, `canvas appears too dark: ${result.state.lit}`);
  assert(result.state.room.length > 0, "room label missing");
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
