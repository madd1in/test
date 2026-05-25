const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.argv[2] || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function send(response, status, body, type) {
  response.writeHead(status, {
    "Content-Type": type || "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(body);
}

http.createServer((request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") {
    pathname = "/index.html";
  }
  const target = path.resolve(root, `.${pathname}`);
  if (!target.startsWith(root)) {
    send(response, 403, "Forbidden");
    return;
  }
  fs.readFile(target, (err, body) => {
    if (err) {
      send(response, 404, "Not found");
      return;
    }
    send(response, 200, body, types[path.extname(target).toLowerCase()] || "application/octet-stream");
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`Capsule Clinic HD serving at http://127.0.0.1:${port}/`);
});
