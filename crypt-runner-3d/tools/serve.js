import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4197);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".mp3": "audio/mpeg"
};

const server = createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const safe = normalize(pathname).replace(/^([/\\])+/, "");
  let file = join(root, safe);
  if (!file.startsWith(root) || !existsSync(file)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  if (statSync(file).isDirectory()) file = join(file, "index.html");
  response.writeHead(200, {
    "content-type": types[extname(file)] || "application/octet-stream",
    "cache-control": "no-store"
  });
  createReadStream(file).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Crypt Runner 3D running at http://127.0.0.1:${port}/`);
});
