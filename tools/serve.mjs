// Local preview server for website/site (behaves like GitHub Pages: folder/index.html, 404.html).
// Usage: node website/tools/serve.mjs [port]   Node stdlib only.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const PORT = +(process.argv[2] || 8130);
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".xml": "application/xml", ".txt": "text/plain", ".svg": "image/svg+xml" };

createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([\\/])+/, "");
  if (p.includes("..")) { res.writeHead(400).end(); return; }
  let file = join(ROOT, p);
  try {
    const s = await stat(file);
    if (s.isDirectory()) {
      if (!req.url.split("?")[0].endsWith("/")) { res.writeHead(301, { Location: req.url.split("?")[0] + "/" }).end(); return; }
      file = join(file, "index.html");
    }
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" }).end(await readFile(file));
  } catch {
    res.writeHead(404, { "Content-Type": TYPES[".html"] }).end(await readFile(join(ROOT, "404.html")));
  }
}).listen(PORT, () => console.log(`preview: http://localhost:${PORT}/`));
