// Speed helpers for tools/build.mjs.
// - selfHostFonts(): downloads the Google Fonts woff2 files (latin subset) into dist/fonts and returns @font-face CSS
//   with font-display: swap. Runs only when SELFHOST_FONTS=1 (set in GitHub Actions); otherwise returns null.
// - minifyCss(): small, safe CSS minifier (comments and whitespace only).
// - optimizeImages(): with `sharp` installed (GitHub Actions installs it), writes responsive WebP copies
//   next to every JPEG/PNG in dist/img and rewrites <img> tags into <picture> with a WebP srcset.
//   Without sharp (local builds) it does nothing, so the site still works with the original images.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, extname, relative } from "node:path";

const FONTS_URL = "https://fonts.googleapis.com/css2?family=Archivo:wght@500;700&family=Questrial&display=swap";
const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

export async function selfHostFonts(outDir) {
  if (process.env.SELFHOST_FONTS !== "1") return null;
  try {
    const css = await (await fetch(FONTS_URL, { headers: { "User-Agent": CHROME_UA } })).text();
    const blocks = css.split("@font-face").slice(1).map(b => "@font-face" + b.slice(0, b.indexOf("}") + 1));
    // Keep the basic Latin block (U+0000-00FF covers English, Italian and Spanish letters).
    const latin = blocks.filter(b => /unicode-range:\s*U\+0000-00FF/i.test(b));
    if (!latin.length) throw new Error("no latin font blocks");
    mkdirSync(join(outDir, "fonts"), { recursive: true });
    const preloads = [];
    let out = "";
    for (const b of latin) {
      const family = b.match(/font-family:\s*'([^']+)'/)[1];
      const weight = b.match(/font-weight:\s*(\d+)/)[1];
      const url = b.match(/url\((https:[^)]+\.woff2)\)/)[1];
      const file = `${family.toLowerCase()}-${weight}.woff2`;
      writeFileSync(join(outDir, "fonts", file), Buffer.from(await (await fetch(url)).arrayBuffer()));
      out += b.replace(/url\([^)]+\)/, `url(/fonts/${file})`).replace(/font-display:\s*\w+/, "font-display:swap");
      if ((family === "Questrial") || (family === "Archivo" && weight === "700")) preloads.push(`/fonts/${file}`);
    }
    return { css: minifyCss(out), preloads };
  } catch (e) {
    console.warn("fonts: self-hosting skipped:", e.message);
    return null;
  }
}

export function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

export async function optimizeImages(outDir) {
  let sharp;
  try { sharp = (await import("sharp")).default; } catch { console.log("images: sharp not installed, keeping originals"); return { count: 0 }; }
  const imgDir = join(outDir, "img");
  const variants = new Map(); // "img/p/x.jpg" -> [[url, width], ...]
  let saved = 0, before = 0;
  for (const file of walk(imgDir).filter(f => /\.(jpe?g|png)$/i.test(f))) {
    const rel = relative(outDir, file).replace(/\\/g, "/");
    const meta = await sharp(file).metadata();
    const widths = [320, 640, 960, 1280, 1600].filter(w => w < meta.width);
    widths.push(Math.min(meta.width, 1600));
    const list = [];
    before += statSync(file).size;
    for (const w of [...new Set(widths)]) {
      const outRel = rel.replace(/\.(jpe?g|png)$/i, `-${w}.webp`);
      await sharp(file).resize({ width: w, withoutEnlargement: true }).webp({ quality: 74, effort: 5 }).toFile(join(outDir, outRel));
      list.push([outRel, w]);
    }
    saved += statSync(join(outDir, list[list.length - 1][0])).size;
    variants.set(rel, list);
  }
  // Rewrite HTML
  for (const html of walk(outDir).filter(f => f.endsWith(".html") && !f.includes(`${join("", "admin")}`))) {
    let s = readFileSync(html, "utf8");
    const orig = s;
    s = s.replace(/<img ([^>]*?)src="((?:\.\.\/|\.\/)*)(img\/[^"]+\.(?:jpe?g|png))"([^>]*)>/gi, (m, pre, prefix, rel, post) => {
      const list = variants.get(rel);
      if (!list) return m;
      const attrs = pre + post;
      const sizes = (attrs.match(/sizes="([^"]+)"/) || [, "(max-width: 800px) 100vw, 50vw"])[1];
      const srcset = list.map(([u, w]) => `${prefix}${u} ${w}w`).join(", ");
      return `<picture><source type="image/webp" srcset="${srcset}" sizes="${sizes}">${m}</picture>`;
    });
    s = s.replace(/<link rel="preload" as="image" href="((?:\.\.\/|\.\/)*)(img\/[^"]+\.(?:jpe?g|png))"/gi, (m, prefix, rel) => {
      const list = variants.get(rel);
      if (!list) return m;
      return `<link rel="preload" as="image" type="image/webp" imagesrcset="${list.map(([u, w]) => `${prefix}${u} ${w}w`).join(", ")}" imagesizes="100vw" href="${prefix}${list[list.length - 1][0]}"`;
    });
    if (s !== orig) writeFileSync(html, s);
  }
  console.log(`images: ${variants.size} images → WebP variants (largest copies ${Math.round(saved / 1024)} KiB vs originals ${Math.round(before / 1024)} KiB)`);
  return { count: variants.size };
}
