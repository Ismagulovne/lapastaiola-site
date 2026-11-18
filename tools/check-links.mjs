// Checks that every internal link, image and stylesheet in website/site resolves to a file.
// Usage: node website/tools/check-links.mjs   Node stdlib only.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const walk = d => readdirSync(d).flatMap(f => statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]);
const html = walk(ROOT).filter(f => f.endsWith(".html"));
const bad = new Set(); let n = 0;
for (const f of html) {
  const s = readFileSync(f, "utf8");
  const refs = [...s.matchAll(/(?:href|src)="([^"#?]*)/g), ...s.matchAll(/url\('([^'#?]+)'\)/g), ...s.matchAll(/content="0; url=([^"#?]+)"/g)]
    .map(m => m[1]).filter(u => u && !/^(https?:|mailto:|tel:|data:|\/\/)/.test(u));
  for (const u of refs) {
    n++;
    const t = u.startsWith("/") ? join(ROOT, u) : join(dirname(f), u);
    const ok = existsSync(t) && (statSync(t).isFile() || existsSync(join(t, "index.html")));
    if (!ok) bad.add(`${u}  (in ${f.slice(ROOT.length)})`);
  }
}
console.log(`${html.length} html files, ${n} internal references, ${bad.size} broken`);
for (const b of bad) console.log("  " + b);
process.exit(bad.size ? 1 : 0);
