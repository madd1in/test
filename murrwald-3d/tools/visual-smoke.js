import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9339;
const url = "http://127.0.0.1:4189/";
const profileDir = join(root, "chrome-visual-profile");

class CdpClient {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Map();
    this.events = [];
    this.exceptions = [];
    ws.addEventListener("message", (event) => this.handleMessage(event.data));
  }

  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });
    return new CdpClient(ws);
  }

  handleMessage(raw) {
    const message = JSON.parse(String(raw));
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    if (message.method) {
      this.events.push(message);
      if (message.method === "Runtime.exceptionThrown") {
        this.exceptions.push(message.params?.exceptionDetails?.text || "Runtime exception");
      }
      const waiters = this.waiters.get(message.method);
      if (waiters?.length) {
        const waiter = waiters.shift();
        waiter.resolve(message.params);
      }
    }
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  waitFor(method, timeout = 10000) {
    const existingIndex = this.events.findIndex((event) => event.method === method);
    if (existingIndex >= 0) {
      const [event] = this.events.splice(existingIndex, 1);
      return Promise.resolve(event.params);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeout);
      const wrapped = {
        resolve: (params) => {
          clearTimeout(timer);
          resolve(params);
        }
      };
      const list = this.waiters.get(method) || [];
      list.push(wrapped);
      this.waiters.set(method, list);
    });
  }

  close() {
    this.ws.close();
  }
}

async function waitForChrome() {
  const endpoint = `http://127.0.0.1:${port}/json/version`;
  const start = Date.now();
  while (Date.now() - start < 12000) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) return;
    } catch {
      // Keep polling until Chrome opens the debugging endpoint.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("Chrome debugging endpoint did not open.");
}

async function createPage() {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  if (!response.ok) throw new Error(`Could not create Chrome target: ${response.status}`);
  const target = await response.json();
  return CdpClient.connect(target.webSocketDebuggerUrl);
}

async function evaluate(client, expression, awaitPromise = true) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  }
  return result.result?.value;
}

async function loadGame(client) {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Log.enable");
  await client.send("Page.navigate", { url });
  await client.waitFor("Page.loadEventFired", 12000);
  await evaluate(client, "new Promise((resolve) => setTimeout(resolve, 900))");
  await evaluate(client, "document.getElementById('start-button').click(); true");
  await evaluate(client, "new Promise((resolve) => setTimeout(resolve, 900))");
}

async function pixelProbe(client) {
  return evaluate(
    client,
    `(() => {
      const game = window.murrwaldGame;
      const gl = game?.renderer?.getContext?.();
      if (!game || !gl) return { ok: false, reason: "missing game or WebGL context" };
      const points = [[0.18, 0.22], [0.42, 0.34], [0.62, 0.48], [0.78, 0.66], [0.5, 0.82]];
      const pixel = new Uint8Array(4);
      const samples = [];
      for (const [px, py] of points) {
        const x = Math.max(0, Math.min(gl.drawingBufferWidth - 1, Math.floor(gl.drawingBufferWidth * px)));
        const y = Math.max(0, Math.min(gl.drawingBufferHeight - 1, Math.floor(gl.drawingBufferHeight * py)));
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        samples.push(Array.from(pixel));
      }
      const unique = new Set(samples.map((sample) => sample.join(","))).size;
      const lit = samples.filter(([r, g, b, a]) => a > 0 && r + g + b > 35).length;
      return {
        ok: unique >= 3 && lit >= 3,
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
        unique,
        lit,
        samples
      };
    })()`,
    false
  );
}

async function capture(client, fileName) {
  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false
  });
  const filePath = join(root, fileName);
  await writeFile(filePath, Buffer.from(screenshot.data, "base64"));
  return filePath;
}

async function run() {
  await rm(profileDir, { recursive: true, force: true });
  await mkdir(profileDir, { recursive: true });
  const chrome = spawn(chromePath, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--mute-audio",
    "--window-size=1365,768",
    "about:blank"
  ], { stdio: "ignore" });

  let client;
  try {
    await waitForChrome();
    client = await createPage();
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1365,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false
    });
    await loadGame(client);
    const desktopProbe = await pixelProbe(client);
    const desktopPath = await capture(client, "smoke-desktop.png");

    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await loadGame(client);
    const mobileProbe = await pixelProbe(client);
    const mobilePath = await capture(client, "smoke-mobile.png");

    const logic = await evaluate(client, `(() => {
      const game = window.murrwaldGame;
      game.state.running = true;
      document.getElementById("start-screen").classList.remove("active");
      game.addItem("broom");
      game.tryUseItemOnObject("broom", "dusty-sign");
      game.addItem("cheese");
      game.tryUseItemOnObject("cheese", "gargoyle");
      game.addItem("bellows");
      game.tryUseItemOnObject("bellows", "oven");
      game.inputStarSymbol("moon");
      game.inputStarSymbol("mushroom");
      game.inputStarSymbol("star");
      game.tryUseItemOnObject("crank", "well");
      game.useObject("well");
      game.brewPotion();
      const hasPotion = game.state.inventory.has("gatePotion");
      game.toggleSwitch("left-switch");
      game.toggleSwitch("right-switch");
      for (let move = 0; move < 8 && !game.state.flags.pushBlockPlaced; move += 1) {
        game.pushObject("push-block");
        for (let i = 0; i < 80 && game.state.pushBlockTarget; i += 1) {
          game.updatePushBlock(0.08);
        }
      }
      game.tryUseItemOnObject("gatePotion", "moon-gate");
      return {
        signCleaned: game.state.flags.signCleaned,
        gargoyleFed: game.state.flags.gargoyleFed,
        sparkTaken: game.state.flags.sparkTaken,
        starSolved: game.state.flags.starSolved,
        waterDrawn: game.state.flags.waterDrawn,
        potionWasBrewed: hasPotion,
        leftSwitch: game.state.flags.leftSwitch,
        rightSwitch: game.state.flags.rightSwitch,
        pushBlockPlaced: game.state.flags.pushBlockPlaced,
        sigilOpen: game.state.flags.sigilOpen,
        gateOpen: game.state.flags.gateOpen
      };
    })()`, false);

    if (!desktopProbe.ok || !mobileProbe.ok) {
      throw new Error(`Canvas pixel probe failed: ${JSON.stringify({ desktopProbe, mobileProbe })}`);
    }
    if (Object.values(logic).some((value) => value !== true)) {
      throw new Error(`Puzzle chain failed: ${JSON.stringify(logic)}`);
    }
    if (client.exceptions.length) {
      throw new Error(`Browser exceptions: ${client.exceptions.join("; ")}`);
    }
    console.log(JSON.stringify({ desktopPath, mobilePath, desktopProbe, mobileProbe, logic }, null, 2));
  } finally {
    client?.close();
    chrome.kill();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
