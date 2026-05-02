const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const isMobile = process.argv.includes("--mobile");
const isLaunch = process.argv.includes("--launch");
const out = path.join(root, isLaunch ? "smoke-launch.png" : isMobile ? "smoke-mobile.png" : "smoke.png");
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

function runBrowser(browserPath, port) {
  return new Promise((resolve, reject) => {
    const args = [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      isMobile ? "--window-size=390,844" : "--window-size=1280,720",
      `--screenshot=${out}`,
      `http://127.0.0.1:${port}/${isLaunch ? "?autolaunch=1&instant=1" : ""}`
    ];
    const child = spawn(browserPath, args, { stdio: "pipe" });
    let stderr = "";
    let settled = false;
    const screenshotTimer = setInterval(() => {
      if (!fs.existsSync(out)) return;
      settled = true;
      clearInterval(screenshotTimer);
      child.kill();
      resolve();
    }, 250);
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      if (settled) return;
      clearInterval(screenshotTimer);
      reject(error);
    });
    child.on("exit", (code) => {
      if (settled) return;
      clearInterval(screenshotTimer);
      if (code === 0 && fs.existsSync(out)) resolve();
      else reject(new Error(stderr || `Browser exited with ${code}`));
    });
  });
}

server.listen(0, "127.0.0.1", async () => {
  try {
    const port = server.address().port;
    const browser = edgeCandidates.find((candidate) => fs.existsSync(candidate));
    if (!browser) throw new Error("No Edge or Chrome executable found.");
    if (fs.existsSync(out)) fs.unlinkSync(out);
    await runBrowser(browser, port);
    const size = fs.statSync(out).size;
    console.log(`Wrote ${out} (${size} bytes)`);
  } catch (error) {
    console.error(error.stack || error.message || error);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
