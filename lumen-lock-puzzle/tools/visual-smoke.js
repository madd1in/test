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

async function capture(client, label, metrics, levelButtonIndex = 0, options = {}) {
  const { targetId } = await client.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await client.send("Target.attachToTarget", { targetId, flatten: true });
  await client.send("Page.enable", {}, sessionId);
  await client.send("Runtime.enable", {}, sessionId);
  await client.send("Emulation.setDeviceMetricsOverride", metrics, sessionId);
  const loaded = client.once("Page.loadEventFired", sessionId);
  await client.send("Page.navigate", { url: fileUrl }, sessionId);
  await loaded;
  await delay(900);
  if (levelButtonIndex > 0 || levelButtonIndex === "last") {
    const levelExpression = levelButtonIndex === "last"
      ? `(window.LumenLock?.getLevelCount?.() ?? 1) - 1`
      : String(levelButtonIndex);
    await client.send(
      "Runtime.evaluate",
      {
        expression: `window.LumenLock?.loadLevel(${levelExpression})`
      },
      sessionId
    );
    await delay(500);
  }
  if (options.toggleFx) {
    await client.send(
      "Runtime.evaluate",
      {
        expression: `document.getElementById("fxButton")?.click()`
      },
      sessionId
    );
    await delay(250);
  }
  const evalResult = await client.send(
    "Runtime.evaluate",
    {
      returnByValue: true,
      expression: `(() => {
        const canvas = document.getElementById("gameCanvas");
        const audioButton = document.getElementById("audioButton");
        const fxButton = document.getElementById("fxButton");
        const rect = canvas.getBoundingClientRect();
        const stage = document.querySelector(".board-stage").getBoundingClientRect();
        const rail = document.querySelector(".command-rail").getBoundingClientRect();
        const levelPanel = document.querySelector("#levelButtons").closest(".panel").getBoundingClientRect();
        const levelButtons = [...document.querySelectorAll("#levelButtons button")].map((button) => {
          const buttonRect = button.getBoundingClientRect();
          return {
            left: Math.round(buttonRect.left),
            right: Math.round(buttonRect.right),
            top: Math.round(buttonRect.top),
            bottom: Math.round(buttonRect.bottom)
          };
        });
        return {
          viewport: { width: window.innerWidth, height: window.innerHeight },
          scroll: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
          overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
          canvas: { width: Math.round(rect.width), height: Math.round(rect.height) },
          stage: {
            top: Math.round(stage.top),
            bottom: Math.round(stage.bottom),
            width: Math.round(stage.width),
            height: Math.round(stage.height),
            fullyVisible: stage.top >= -1 && stage.bottom <= window.innerHeight + 1
          },
          rail: {
            left: Math.round(rail.left),
            right: Math.round(rail.right),
            width: Math.round(rail.width),
            withinViewport: rail.left >= -1 && rail.right <= window.innerWidth + 1
          },
          levelPanel: {
            left: Math.round(levelPanel.left),
            right: Math.round(levelPanel.right),
            width: Math.round(levelPanel.width),
            withinViewport: levelPanel.left >= -1 && levelPanel.right <= window.innerWidth + 1
          },
          levelButtonsWithinViewport: levelButtons.every((button) => (
            button.left >= -1 && button.right <= window.innerWidth + 1
          )),
          levelButtonsWithinPanel: levelButtons.every((button) => (
            button.left >= levelPanel.left - 1 && button.right <= levelPanel.right + 1
          )),
          audioButton: audioButton ? audioButton.textContent : null,
          audioPressed: audioButton ? audioButton.getAttribute("aria-pressed") : null,
          fxButton: fxButton ? fxButton.textContent : null,
          fxPressed: fxButton ? fxButton.getAttribute("aria-pressed") : null,
          signalLabels: [...document.querySelectorAll(".signal-chip span")].map((chip) => chip.textContent.trim()),
          level: document.getElementById("levelName").textContent,
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

async function collectAllLevelSafety(client, label, metrics) {
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
        const count = window.LumenLock?.getLevelCount?.() ?? 0;
        const levels = [];
        for (let index = 0; index < count; index += 1) {
          window.LumenLock.loadLevel(index);
          levels.push(window.LumenLock.getRenderMetrics());
        }
        return levels;
      })()`
    },
    sessionId
  );
  await client.send("Target.closeTarget", { targetId });
  return { label, metrics: evalResult.result.value };
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
    const narrowDesktop = await capture(client, "narrow-desktop", {
      width: 1024,
      height: 820,
      deviceScaleFactor: 1,
      mobile: false
    });
    const breakpoint = await capture(client, "breakpoint", {
      width: 930,
      height: 820,
      deviceScaleFactor: 1,
      mobile: false
    });
    const mobile = await capture(client, "mobile", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    const mobileFinal = await capture(client, "mobile-final", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    }, "last");
    const mobileCalmFx = await capture(client, "mobile-calm-fx", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    }, "last", { toggleFx: true });
    const allLevelSafety = await collectAllLevelSafety(client, "all-level-mobile-bottom-safety", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    client.close();
    const results = [desktop, narrowDesktop, breakpoint, mobile, mobileFinal, mobileCalmFx];
    const failures = results.flatMap((result) => {
      const metrics = result.metrics;
      const problems = [];
      if (metrics.overflowX) problems.push("page has horizontal overflow");
      if (!metrics.stage.fullyVisible) problems.push("board stage is clipped in the viewport");
      if (!metrics.rail.withinViewport) problems.push("command rail is outside the viewport");
      if (!metrics.levelPanel.withinViewport) problems.push("level panel is outside the viewport");
      if (!metrics.levelButtonsWithinViewport) problems.push("level buttons are outside the viewport");
      if (!metrics.levelButtonsWithinPanel) problems.push("level buttons overflow their panel");
      if (result.label === "mobile-calm-fx" && metrics.fxPressed !== "true") problems.push("FX button did not switch to calm mode");
      return problems.map((problem) => `${result.label}: ${problem}`);
    });
    const safetyFailures = allLevelSafety.metrics.flatMap((level) => {
      const problems = [];
      if (level.visual.bottomSafePx < 28) {
        problems.push(`visual bottom safe area is only ${level.visual.bottomSafePx}px`);
      }
      level.targets.forEach((target) => {
        if (target.bottomSafePx < 28) {
          problems.push(`${target.color} receiver at ${target.x},${target.y} has only ${target.bottomSafePx}px bottom safety`);
        }
      });
      return problems.map((problem) => `${allLevelSafety.label}: ${level.levelIndex + 1} ${level.levelName}: ${problem}`);
    });
    console.log(JSON.stringify({ captures: results, allLevelSafety }, null, 2));
    failures.push(...safetyFailures);
    if (failures.length) {
      console.error(`Visual smoke failed:\n${failures.join("\n")}`);
      process.exitCode = 1;
    }
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
