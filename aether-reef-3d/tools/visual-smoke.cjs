const fs = require("fs");
const http = require("http");
const path = require("path");
const zlib = require("zlib");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const shotDir = path.join(root, "screenshots");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function serve() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const fullPath = path.resolve(root, `.${pathname}`);
    if (!fullPath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    fs.readFile(fullPath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": types[path.extname(fullPath)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      response.end(data);
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error("No Chrome or Edge executable found");
  return found;
}

function launchBrowser(browserPath) {
  const profile = path.join(root, `chrome-visual-profile-${Date.now()}`);
  const child = spawn(browserPath, [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--disable-gpu-sandbox",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--use-angle=swiftshader",
    "--disable-extensions",
    "--no-first-run",
    "--hide-scrollbars",
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out waiting for DevTools endpoint")), 20000);
    child.stderr.on("data", (chunk) => {
      const text = String(chunk);
      const match = text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolve({ child, browserWs: match[1], profile });
      }
    });
    child.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Browser exited before DevTools endpoint: ${code}`));
    });
  });
}

class Cdp {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  open() {
    this.ws = new WebSocket(this.url);
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
        return;
      }
      if (message.method && this.listeners.has(message.method)) {
        for (const listener of this.listeners.get(message.method)) listener(message.params);
      }
    });
    return new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 20000);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });
    });
  }

  once(method) {
    return new Promise((resolve) => {
      const listener = (params) => {
        const list = this.listeners.get(method) || [];
        this.listeners.set(method, list.filter((item) => item !== listener));
        resolve(params);
      };
      const list = this.listeners.get(method) || [];
      list.push(listener);
      this.listeners.set(method, list);
    });
  }

  close() {
    this.ws.close();
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureRun(cdp, url, width, height, waitMs, fileName) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  const load = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url });
  await load;
  await wait(waitMs);
  await cdp.send("Runtime.evaluate", {
    expression: `if (window.AETHER_REEF_DEBUG?.simulation?.phase !== "playing") window.AETHER_REEF_DEBUG?.start?.(); window.AETHER_REEF_DEBUG?.step?.(${Math.max(1, Math.round(waitMs / 16))})`,
  });
  const state = await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const d = document.documentElement.dataset;
      const canvas = document.getElementById("game").getBoundingClientRect();
      const hud = document.getElementById("hud").getBoundingClientRect();
      return {
        phase: d.gamePhase,
        x: Number(d.playerX),
        z: Number(d.playerZ),
        speed: Number(d.playerSpeed),
        cores: Number(d.cores),
        score: Number(d.score),
        drawCalls: Number(d.drawCalls),
        triangles: Number(d.triangles),
        debug: Boolean(window.AETHER_REEF_DEBUG),
        sceneChildren: window.AETHER_REEF_DEBUG?.view?.scene?.children?.length,
        camera: window.AETHER_REEF_DEBUG?.view?.camera
          ? {
              x: Number(window.AETHER_REEF_DEBUG.view.camera.position.x.toFixed(2)),
              y: Number(window.AETHER_REEF_DEBUG.view.camera.position.y.toFixed(2)),
              z: Number(window.AETHER_REEF_DEBUG.view.camera.position.z.toFixed(2))
            }
          : null,
        objective: document.getElementById("objectiveText").textContent,
        menuHidden: document.getElementById("menuOverlay").classList.contains("hidden"),
        canvas: { width: Math.round(canvas.width), height: Math.round(canvas.height) },
        hud: { x: Math.round(hud.x), y: Math.round(hud.y), width: Math.round(hud.width), height: Math.round(hud.height) }
      };
    })()`,
    returnByValue: true,
  });
  await cdp.send("Runtime.evaluate", { expression: "window.__AETHER_FREEZE_FRAME = true" });
  await wait(120);
  const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const bytes = Buffer.from(screenshot.data, "base64");
  const file = path.join(shotDir, fileName);
  fs.writeFileSync(file, bytes);
  return { state: state.result.value, image: readPng(bytes), file };
}

function readPng(buffer) {
  if (buffer.toString("hex", 0, 8) !== "89504e470d0a1a0a") throw new Error("Not a PNG");
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (type === "IHDR") {
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer[dataStart + 8];
      colorType = buffer[dataStart + 9];
    } else if (type === "IDAT") {
      idat.push(buffer.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      break;
    }
    offset = dataEnd + 4;
  }
  if (bitDepth !== 8 || ![2, 6].includes(colorType)) throw new Error(`Unsupported PNG ${bitDepth}/${colorType}`);
  const bpp = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const pixels = Buffer.alloc(stride * height);
  let source = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[source++];
    const rowStart = y * stride;
    const prevStart = rowStart - stride;
    for (let x = 0; x < stride; x += 1) {
      const current = raw[source++];
      const left = x >= bpp ? pixels[rowStart + x - bpp] : 0;
      const up = y > 0 ? pixels[prevStart + x] : 0;
      const upLeft = y > 0 && x >= bpp ? pixels[prevStart + x - bpp] : 0;
      let value = current;
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += Math.floor((left + up) / 2);
      else if (filter === 4) value += paeth(left, up, upLeft);
      else if (filter !== 0) throw new Error(`Bad PNG filter ${filter}`);
      pixels[rowStart + x] = value & 255;
    }
  }
  return { width, height, bpp, pixels, size: buffer.length };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function stats(image) {
  const seen = new Set();
  let luminance = 0;
  let samples = 0;
  const step = Math.max(1, Math.floor((image.width * image.height) / 16000));
  for (let i = 0; i < image.width * image.height; i += step) {
    const offset = i * image.bpp;
    const r = image.pixels[offset];
    const g = image.pixels[offset + 1];
    const b = image.pixels[offset + 2];
    seen.add(`${r},${g},${b}`);
    luminance += r * 0.2126 + g * 0.7152 + b * 0.0722;
    samples += 1;
  }
  return { width: image.width, height: image.height, size: image.size, unique: seen.size, luminance: luminance / samples };
}

function diff(a, b) {
  if (a.width !== b.width || a.height !== b.height) throw new Error("Cannot diff different image sizes");
  let total = 0;
  let samples = 0;
  const step = Math.max(1, Math.floor((a.width * a.height) / 18000));
  for (let i = 0; i < a.width * a.height; i += step) {
    const ao = i * a.bpp;
    const bo = i * b.bpp;
    total += Math.abs(a.pixels[ao] - b.pixels[bo]);
    total += Math.abs(a.pixels[ao + 1] - b.pixels[bo + 1]);
    total += Math.abs(a.pixels[ao + 2] - b.pixels[bo + 2]);
    samples += 3;
  }
  return total / samples;
}

(async () => {
  fs.mkdirSync(shotDir, { recursive: true });
  const server = await serve();
  let browserProcess;
  let cdp;
  try {
    const browser = findBrowser();
    browserProcess = await launchBrowser(browser);
    cdp = new Cdp(browserProcess.browserWs);
    await cdp.open();
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    cdp.close();

    const pageWs = browserProcess.browserWs.replace("/devtools/browser/", `/devtools/page/${targetId}?sessionId=${sessionId}&unused=`);
    cdp = new Cdp(pageWs.split("?")[0]);
    await cdp.open();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    const port = server.address().port;
    const url = `http://127.0.0.1:${port}/?smoke=drive`;
    const desktopEarly = await captureRun(cdp, url, 1280, 720, 2200, "desktop-early.png");
    const desktopLate = await captureRun(cdp, url, 1280, 720, 4200, "desktop-late.png");
    const mobile = await captureRun(cdp, url, 390, 844, 3600, "mobile.png");

    const desktopStats = stats(desktopLate.image);
    const mobileStats = stats(mobile.image);
    const motion = diff(desktopEarly.image, desktopLate.image);
    const moved = Math.hypot(desktopLate.state.x - desktopEarly.state.x, desktopLate.state.z - desktopEarly.state.z);

    for (const [name, value, state] of [["desktop", desktopStats, desktopLate.state], ["mobile", mobileStats, mobile.state]]) {
      if (value.size < 50000 || value.unique < 450 || value.luminance < 8) {
        throw new Error(`${name} screenshot looks blank: ${JSON.stringify({ value, state })}`);
      }
    }
    if (motion < 1.1 || moved < 6) {
      throw new Error(`Scene did not move enough: ${JSON.stringify({ pixel: Number(motion.toFixed(2)), world: Number(moved.toFixed(2)), early: desktopEarly.state, late: desktopLate.state })}`);
    }
    if (!desktopLate.state.menuHidden || desktopLate.state.phase !== "playing") {
      throw new Error(`Desktop run did not enter play state: ${JSON.stringify(desktopLate.state)}`);
    }
    if (mobile.state.canvas.width !== 390 || mobile.state.canvas.height !== 844) {
      throw new Error(`Mobile viewport mismatch: ${JSON.stringify(mobile.state.canvas)}`);
    }

    console.log("Aether Reef 3D visual smoke passed");
    console.log(`Desktop screenshot: ${desktopLate.file}`);
    console.log(`Mobile screenshot: ${mobile.file}`);
    console.log(`Motion diff: ${motion.toFixed(2)}, world move: ${moved.toFixed(2)}`);
  } finally {
    if (cdp) cdp.close();
    if (browserProcess) {
      browserProcess.child.kill();
      await Promise.race([
        new Promise((resolve) => browserProcess.child.once("exit", resolve)),
        wait(2500),
      ]);
      try {
        fs.rmSync(browserProcess.profile, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Warning: could not remove temp browser profile: ${error.message}`);
      }
    }
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
