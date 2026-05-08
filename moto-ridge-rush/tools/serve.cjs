const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4179);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  const rawUrl = new URL(req.url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(rawUrl.pathname === "/" ? "/index.html" : rawUrl.pathname);
  const target = path.resolve(root, `.${pathname}`);
  if (!target.startsWith(root)) {
    send(res, 403, { "content-type": "text/plain; charset=utf-8" }, "Forbidden");
    return;
  }
  fs.readFile(target, (error, data) => {
    if (error) {
      send(res, 404, { "content-type": "text/plain; charset=utf-8" }, "Not found");
      return;
    }
    send(res, 200, { "content-type": types[path.extname(target)] || "application/octet-stream" }, data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Moto Ridge Rush: http://127.0.0.1:${port}/`);
});
