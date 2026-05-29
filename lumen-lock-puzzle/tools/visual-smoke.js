const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const fileUrl = "file:///" + path.join(projectRoot, "index.html").replace(/\\/g, "/");
const profileDir = path.join(projectRoot, ".chrome-smoke-profile");
const port = 9337;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
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
      })
      .on("error", reject);
  });
}

async function waitForVersion() {
  const url = `http://127.0.0.1:${port}/json/version`;
  for (let i = 0; i < 60; i += 1) {
    try {
      return await getJson(url);
    } catch {
      await delay(250);
    }
  }
  throw new Error("Chrome DevTools endpoint did not become available.");
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("open", () => resolve(ws), { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
}

function makeClient(ws) {
  let id = 0;
  const pending = new Map();
  const listeners = new Map();

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    const key = message.sessionId ? `${message.sessionId}:${message.method}` : message.method;
    const handler = listeners.get(key);
    if (handler) handler(message.params);
  });

  return {
    send(method, params = {}, sessionId) {
      id += 1;
      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      ws.send(JSON.stringify(payload));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    once(method, sessionId) {
      const key = sessionId ? `${sessionId}:${method}` : method;
      return new Promise((resolve) => {
        listeners.set(key, (params) => {
          listeners.delete(key);
          resolve(params);
        });
      });
    },
    close() {
      ws.close();
    }
  };
}

async function capture(client, label, metrics) {
  const { targetId } = await client.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await client.send("Target.attachToTarget", { targetId, flatten: true });
  await client.send("Page.enable", {}, sessionId);
  await client.send("Runtime.enable", {}, sessionId);
  await client.send("Emulation.setDeviceMetricsOverride", metrics, sessionId);
  const loaded = client.once("Page.loadEventFired", sessionId);
  await client.send("Page.navigate", { url: fileUrl }, sessionId);
  await loaded;
  await delay(900);
  const evalResult = await client.send(
    "Runtime.evaluate",
    {
      returnByValue: true,
      expression: `(() => {
        const canvas = document.getElementById("gameCanvas");
        const audioButton = document.getElementById("audioButton");
        const rect = canvas.getBoundingClientRect();
        return {
          viewport: { width: window.innerWidth, height: window.innerHeight },
          scroll: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
          overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
          canvas: { width: Math.round(rect.width), height: Math.round(rect.height) },
          audioButton: audioButton ? audioButton.textContent : null,
          audioPressed: audioButton ? audioButton.getAttribute("aria-pressed") : null,
          badge: document.getElementById("stateBadge").textContent,
          targets: document.getElementById("targetValue").textContent
        };
      })()`
    },
    sessionId
  );
  const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, sessionId);
  const outPath = path.join(projectRoot, `smoke-${label}.png`);
  fs.writeFileSync(outPath, Buffer.from(screenshot.data, "base64"));
  await client.send("Target.closeTarget", { targetId });
  return { label, outPath, metrics: evalResult.result.value };
}

async function removeProfileDir() {
  for (let i = 0; i < 8; i += 1) {
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
      return;
    } catch {
      await delay(250);
    }
  }
  console.warn(`Could not remove temporary profile: ${profileDir}`);
}

(async () => {
  await removeProfileDir();
  fs.mkdirSync(profileDir, { recursive: true });
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "about:blank"
  ]);

  try {
    const version = await waitForVersion();
    const ws = await connect(version.webSocketDebuggerUrl);
    const client = makeClient(ws);
    const desktop = await capture(client, "desktop", {
      width: 1366,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    const mobile = await capture(client, "mobile", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    client.close();
    console.log(JSON.stringify([desktop, mobile], null, 2));
  } finally {
    if (chrome.exitCode === null) {
      chrome.kill();
      await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), delay(2000)]);
    }
    await removeProfileDir();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
