const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
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
    await wait(50);
  }
  throw new Error("Timed out waiting for browser physics state.");
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

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "castle-fling-physics-"));
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
    await wait(1000);

    const result = await cdp.send("Runtime.evaluate", {
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
            pointerId: 91,
            pointerType: "mouse",
            clientX: point.x,
            clientY: point.y,
            button: 0,
            buttons
          }));
        };
        const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const debug = await new Promise((resolve, reject) => {
          const started = performance.now();
          const tick = () => {
            if (window.__castleFlingDebug) {
              resolve(window.__castleFlingDebug);
              return;
            }
            if (performance.now() - started > 4000) {
              reject(new Error("debug state not ready"));
              return;
            }
            requestAnimationFrame(tick);
          };
          tick();
        });

        const start = toClient(176, 405);
        const pull = toClient(78, 470);
        fire(canvas, "pointerdown", start, 1);
        for (let i = 1; i <= 8; i++) {
          fire(window, "pointermove", {
            x: start.x + (pull.x - start.x) * i / 8,
            y: start.y + (pull.y - start.y) * i / 8
          }, 1);
          await pause(20);
        }

        const aimPath = debug.getAimPath(1);
        fire(window, "pointerup", pull, 0);
        const flight = await new Promise((resolve, reject) => {
          const started = performance.now();
          const tick = () => {
            const state = debug.getShotState();
            if (state && state.launched && state.flightStep >= 20) {
              resolve(state);
              return;
            }
            if (performance.now() - started > 4000) {
              reject(new Error("flight did not advance"));
              return;
            }
            requestAnimationFrame(tick);
          };
          tick();
        });
        const predicted = aimPath.find((point) => point.step === flight.flightStep);
        const distance = predicted
          ? Math.hypot(predicted.x - flight.x, predicted.y - flight.y)
          : Infinity;

        document.getElementById("resetButton").click();
        await pause(120);
        const beforeTarget = debug.getTargets()[0];
        const support = debug.removeSupportsBelowFirstTarget();
        const blocksAfterSupportRemoval = debug.getBlocks();
        const dropped = await new Promise((resolve, reject) => {
          const started = performance.now();
          const tick = () => {
            const target = debug.getTargets()[0];
            if (target && target.y > beforeTarget.y + 36 && target.vy > 0) {
              resolve(target);
              return;
            }
            if (performance.now() - started > 2200) {
              resolve({ timeout: true, ...(target || {}) });
              return;
            }
            requestAnimationFrame(tick);
          };
          tick();
        });

        return { flight, predicted, distance, beforeTarget, support, blocksAfterSupportRemoval, dropped };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails) {
      const text = result.exceptionDetails.text || "Runtime.evaluate failed";
      const detail = result.exceptionDetails.exception && result.exceptionDetails.exception.description;
      throw new Error(detail || text);
    }

    const value = result.result.value;
    if (!value.predicted || value.distance > 2.5) {
      throw new Error(`Trajectory mismatch: ${JSON.stringify(value)}`);
    }
    if (!value.support || value.support.count < 1 || !value.dropped || value.dropped.y <= value.beforeTarget.y + 36) {
      throw new Error(`Target drop mismatch: ${JSON.stringify(value)}`);
    }

    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/?level=3&stability=1` });
    await wait(1000);
    const stabilityResult = await cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const debug = await new Promise((resolve, reject) => {
          const started = performance.now();
          const tick = () => {
            if (window.__castleFlingDebug) {
              resolve(window.__castleFlingDebug);
              return;
            }
            if (performance.now() - started > 4000) {
              reject(new Error("debug state not ready"));
              return;
            }
            requestAnimationFrame(tick);
          };
          tick();
        });
        await pause(300);
        const beforeTargets = debug.getTargets();
        const beforeBlocks = debug.getBlocks();
        await pause(2600);
        const afterTargets = debug.getTargets();
        const afterBlocks = debug.getBlocks();
        const maxTargetDrop = Math.max(0, ...afterTargets.map((target, index) => {
          const before = beforeTargets[index];
          return before ? target.y - before.y : 999;
        }));
        const maxBlockMove = Math.max(0, ...afterBlocks.map((block, index) => {
          const before = beforeBlocks[index];
          return before ? Math.hypot(block.x - before.x, block.y - before.y) : 999;
        }));
        return {
          beforeTargets,
          afterTargets,
          beforeBlocks,
          afterBlocks,
          maxTargetDrop,
          maxBlockMove,
          targetCount: afterTargets.length,
          blockCount: afterBlocks.length,
          deadTargets: afterTargets.filter((target) => target.dead).length
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    if (stabilityResult.exceptionDetails) {
      const text = stabilityResult.exceptionDetails.text || "Runtime.evaluate failed";
      const detail = stabilityResult.exceptionDetails.exception && stabilityResult.exceptionDetails.exception.description;
      throw new Error(detail || text);
    }

    const stability = stabilityResult.result.value;
    if (
      stability.targetCount !== 3 ||
      stability.deadTargets > 0 ||
      stability.maxTargetDrop > 24 ||
      stability.maxBlockMove > 26
    ) {
      throw new Error(`Level 3 stability mismatch: ${JSON.stringify(stability)}`);
    }

    console.log(
      `Physics OK: trajectory distance ${value.distance.toFixed(2)}px, target drop ${(value.dropped.y - value.beforeTarget.y).toFixed(1)}px, level 3 max drift ${stability.maxBlockMove.toFixed(1)}px`
    );
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
