const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const browserCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);
const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
};

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || "/", "http://127.0.0.1");
      const pathname = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);
      const fullPath = path.resolve(root, `.${pathname.replace(/\\/g, "/")}`);
      if (!fullPath.startsWith(root)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      const data = await fs.readFile(fullPath);
      res.writeHead(200, { "Content-Type": mimeTypes[path.extname(fullPath).toLowerCase()] || "application/octet-stream" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

(async () => {
  const server = await startServer();
  const port = server.address().port;
  let executablePath;
  for (const candidate of browserCandidates) {
    try {
      await fs.access(candidate);
      executablePath = candidate;
      break;
    } catch {
      // Keep looking for a locally installed browser.
    }
  }
  const browser = await chromium.launch({ headless: true, executablePath });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  const missing = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
      errors.push(message.text());
    }
  });
  page.on("response", (response) => {
    if (response.status() === 404 && !response.url().endsWith("/favicon.ico")) {
      missing.push(response.url());
    }
  });

  try {
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "load" });
    await page.waitForTimeout(900);

    const start = await page.evaluate(() => {
      const canvas = document.querySelector("#viewport canvas");
      const rect = canvas && canvas.getBoundingClientRect();
      const debug = window.AethergateDebug;
      return {
        hasCanvas: Boolean(canvas),
        canvasRect: rect ? { width: Math.round(rect.width), height: Math.round(rect.height) } : null,
        noPageScroll: document.documentElement.scrollHeight <= window.innerHeight + 2,
        scrollHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        partyCards: document.querySelectorAll(".hero-card").length,
        mapCells: document.querySelectorAll(".map-cell").length,
        renderInfo: debug && debug.renderInfo(),
        state: debug && { x: debug.state.x, y: debug.state.y, dir: debug.state.dir },
      };
    });

    await page.getByRole("button", { name: "Forward" }).click();
    await page.getByRole("button", { name: "Forward" }).click();
    await page.getByRole("button", { name: "Forward" }).click();
    await page.waitForTimeout(900);

    const combat = await page.evaluate(() => {
      const debug = window.AethergateDebug;
      return {
        enemyVisible: !document.getElementById("enemyCard").classList.contains("hidden"),
        enemyHealth: document.getElementById("enemyHealth").textContent,
        position: document.getElementById("positionLine").textContent,
        turn: document.getElementById("turnChip").textContent,
        renderInfo: debug && debug.renderInfo(),
        state: debug && { x: debug.state.x, y: debug.state.y, dir: debug.state.dir, combat: Boolean(debug.state.combat) },
      };
    });

    const screenshot = await page.screenshot({ fullPage: false });
    await fs.writeFile(path.join(root, "preview-3d-combat.png"), screenshot);

    if (!start.hasCanvas || start.partyCards !== 4 || start.mapCells !== 144 || !start.noPageScroll) {
      throw new Error(`Boot check failed: ${JSON.stringify(start)}`);
    }
    if (!combat.enemyVisible || !combat.state.combat || combat.position !== "4,1 facing E") {
      throw new Error(`Combat movement check failed: ${JSON.stringify(combat)}`);
    }
    if (errors.length || missing.length) {
      throw new Error(`Browser errors: ${errors.concat(missing).join("; ")}`);
    }

    console.log(JSON.stringify({ start, combat, screenshot: "preview-3d-combat.png" }, null, 2));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
