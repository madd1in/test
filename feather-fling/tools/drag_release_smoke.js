const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "smoke-drag-release.png");
const aimOut = path.join(root, "smoke-aim.png");
const edgeCandidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
];

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const safePath = path
      .normalize(url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname))
      .replace(/^(\.\.[/\\])+/, "");
    const file = path.join(root, safePath);
    if (!file.startsWith(root)) {
      send(res, 403, "Forbidden");
      return;
    }
    fs.readFile(file, (error, data) => {
      if (error) {
        send(res, 404, "Not found");
        return;
      }
      send(res, 200, data, mime[path.extname(file).toLowerCase()] || "application/octet-stream");
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(check, timeout = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const result = await check();
    if (result) return result;
    await wait(100);
  }
  throw new Error("Timed out waiting for browser state.");
}

function httpJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    }).on("error", reject);
  });
}

class CdpClient {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.ws = new WebSocket(url);
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(payload);
    });
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  const server = await startServer();
  const port = server.address().port;
  const browser = edgeCandidates.find((candidate) => fs.existsSync(candidate));
  if (!browser) throw new Error("No Edge or Chrome executable found.");

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "castle-fling-drag-"));
  const child = spawn(browser, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--remote-debugging-port=0",
    "--remote-allow-origins=*",
    "--window-size=1280,720",
    `--user-data-dir=${userDataDir}`,
    `http://127.0.0.1:${port}/`
  ], { stdio: "ignore" });

  try {
    const devToolsFile = path.join(userDataDir, "DevToolsActivePort");
    const debugPort = await waitFor(() => {
      if (!fs.existsSync(devToolsFile)) return null;
      const [line] = fs.readFileSync(devToolsFile, "utf8").trim().split(/\r?\n/);
      return line;
    });

    const page = await waitFor(async () => {
      const pages = await httpJson(`http://127.0.0.1:${debugPort}/json/list`);
      return pages.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
    });

    const cdp = new CdpClient(page.webSocketDebuggerUrl);
    await cdp.open();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await wait(1200);

    const aimStateResult = await cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        const canvas = document.getElementById("gameCanvas");
        const rect = canvas.getBoundingClientRect();
        const toClient = (x, y) => ({
          x: rect.left + x / 1024 * rect.width,
          y: rect.top + y / 576 * rect.height
        });
        const fire = (target, type, point, buttons) => {
          target.dispatchEvent(new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId: 77,
            pointerType: "mouse",
            clientX: point.x,
            clientY: point.y,
            button: 0,
            buttons
          }));
        };
        const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const start = toClient(176, 405);
        const pull = toClient(78, 470);
        fire(canvas, "pointerdown", start, 1);
        for (let i = 1; i <= 8; i++) {
          fire(window, "pointermove", {
            x: start.x + (pull.x - start.x) * i / 8,
            y: start.y + (pull.y - start.y) * i / 8
          }, 1);
          await pause(35);
        }
        return window.__castleFlingDebug && window.__castleFlingDebug.getShotState();
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    const aimShot = aimStateResult.result.value;
    if (!aimShot || !aimShot.dragging || aimShot.isStatic !== true) {
      throw new Error(`Shot was not held during drag aim: ${JSON.stringify(aimShot)}`);
    }

    const aimScreenshot = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(aimOut, Buffer.from(aimScreenshot.data, "base64"));

    const stateResult = await cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        const canvas = document.getElementById("gameCanvas");
        const rect = canvas.getBoundingClientRect();
        const toClient = (x, y) => ({
          x: rect.left + x / 1024 * rect.width,
          y: rect.top + y / 576 * rect.height
        });
        const fire = (target, type, point, buttons) => {
          target.dispatchEvent(new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId: 77,
            pointerType: "mouse",
            clientX: point.x,
            clientY: point.y,
            button: 0,
            buttons
          }));
        };
        const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const pull = toClient(78, 470);
        fire(window, "pointerup", pull, 0);
        await pause(850);
        return {
          rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
          state: window.__castleFlingDebug && window.__castleFlingDebug.getShotState()
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    const result = stateResult.result.value;
    const state = result.state;
    if (!state || !state.launched || state.isStatic || state.dragging || Math.abs(state.vx) < 0.5) {
      throw new Error(`Shot did not launch after drag release: ${JSON.stringify(result)}`);
    }

    const screenshot = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(out, Buffer.from(screenshot.data, "base64"));
    console.log(`Drag release OK: ${JSON.stringify(state)}`);
    console.log(`Wrote ${aimOut} (${fs.statSync(aimOut).size} bytes)`);
    console.log(`Wrote ${out} (${fs.statSync(out).size} bytes)`);
    cdp.close();
  } finally {
    child.kill();
    server.close();
  }
}

run().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
