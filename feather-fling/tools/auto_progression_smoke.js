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
    await wait(100);
  }
  throw new Error("Timed out waiting for auto progression state.");
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

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "castle-fling-auto-"));
  const child = spawn(browser, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--remote-debugging-port=0",
    "--remote-allow-origins=*",
    "--window-size=1280,720",
    `--user-data-dir=${userDataDir}`,
    `http://127.0.0.1:${port}/?level=1`
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
    await wait(900);

    const result = await cdp.send("Runtime.evaluate", {
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
        const before = debug.getLevelState();
        const defeated = debug.defeatAllTargets();
        const won = await new Promise((resolve, reject) => {
          const started = performance.now();
          const tick = () => {
            const state = debug.getLevelState();
            if (state.won && state.pendingAdvance) {
              resolve(state);
              return;
            }
            if (performance.now() - started > 2500) {
              reject(new Error("level win did not schedule auto advance"));
              return;
            }
            requestAnimationFrame(tick);
          };
          tick();
        });
        await pause(1700);
        const after = debug.getLevelState();
        return { before, defeated, won, after };
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
    if (value.before.number !== 1 || value.defeated.count < 1 || !value.won.pendingAdvance || value.after.number !== 2) {
      throw new Error(`Auto progression mismatch: ${JSON.stringify(value)}`);
    }

    console.log(`Auto progression OK: level ${value.before.number} -> ${value.after.number}, defeated ${value.defeated.count} targets`);
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
