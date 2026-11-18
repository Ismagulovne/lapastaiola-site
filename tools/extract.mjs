// Extracts products and collections from the archived Shopify pages into website/data/catalog.json.
// Usage: node website/tools/extract.mjs <snapshot_html_dir> <out_json>
// Node stdlib only. Reads archived HTML as data; nothing is executed.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const [, , dir, out] = process.argv;
if (!dir || !out) { console.error("usage: extract.mjs <html_dir> <out_json>"); process.exit(1); }

const decode = s => s
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));

// Keep only simple, safe formatting tags from Shopify rich text.
function cleanRte(html) {
  let s = html.replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<(\/?)(p|br|strong|b|em|i|ul|ol|li|h[2-6])\b[^>]*>/gi, (_, c, t) => {
    t = t.toLowerCase(); if (t === "b") t = "strong"; if (t === "i") t = "em";
    if (/^h[2-6]$/.test(t)) t = "h3";
    return t === "br" ? "<br>" : `<${c}${t}>`;
  });
  s = s.replace(/<(?!\/?(p|br|strong|em|ul|ol|li|h3)>)[^>]+>/gi, "");
  s = s.replace(/<p>\s*(<br>)?\s*<\/p>/g, "").replace(/\s+/g, " ").trim();
  return decode(s).replace(/&(?![a-z#0-9]+;)/gi, "&amp;");
}

const files = readdirSync(dir);
const products = [];
for (const f of files.filter(f => f.startsWith("products__"))) {
  const h = readFileSync(join(dir, f), "utf8");
  const handle = f.slice(10, -5);
  const ld = [...h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map(m => { try { return JSON.parse(m[1]); } catch { return null; } })
    .find(j => j && j["@type"] === "Product");
  if (!ld) { console.warn("no product data:", f); continue; }
  const images = [...new Set((ld.image || []).map(u => decodeURIComponent(u.split("/cdn/shop/files/")[1].split("?")[0])))];
  const offers = Array.isArray(ld.offers) ? ld.offers : [ld.offers];
  const desc = h.match(/<div class="product__description[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  // Variant names come from Shopify's analytics JSON ("variants":[{...,"public_title":...}]).
  const vj = [...h.matchAll(/"price":(\d+),"name":"(?:[^"\\]|\\.)*","public_title":("(?:[^"\\]|\\.)*"|null)/g)]
    .map(m => ({ price: +m[1] / 100, name: m[2] === "null" ? "" : JSON.parse(m[2]) }));
  const variants = offers.map((o, i) => ({
    name: (vj[i]?.name || o.name || "").replace(/^Default Title$/, ""),
    price: +o.price,
    available: /InStock/.test(o.availability || "")
  }));
  products.push({
    handle, title: decode(ld.name), images,
    price: Math.min(...variants.map(v => v.price)),
    variants: variants.length > 1 || variants[0].name ? variants : [],
    descriptionHtml: desc ? cleanRte(desc[1]) : `<p>${decode(ld.description || "")}</p>`,
    collections: []
  });
}

const collections = [];
for (const f of files.filter(f => f.startsWith("collections__"))) {
  const h = readFileSync(join(dir, f), "utf8");
  const handle = f.slice(13, -5);
  const title = decode((h.match(/<h1[^>]*>[\s\S]*?<\/span>\s*([^<]+)/) || h.match(/<title>([^<|–-]+)/) || [, handle])[1].trim())
    .replace(/^Collection:\s*/, "");
  const desc = h.match(/<div class="collection-hero__description[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  // Only the collection's own grid; the header menu also links to featured products.
  const gridHtml = h.slice(Math.max(0, h.indexOf('id="product-grid"')));
  const members = [...new Set([...gridHtml.matchAll(/href="\/products\/([a-z0-9-]+)"/g)].map(m => m[1]))];
  collections.push({ handle, title, descriptionHtml: desc ? cleanRte(desc[1]) : "", products: members });
  for (const p of products) if (members.includes(p.handle) && handle !== "all" && handle !== "frontpage") p.collections.push(handle);
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ source: "Wayback Machine snapshot of lapastaiola.co (2024-12..2026-08)", products, collections }, null, 2));
console.log(`products: ${products.length}, collections: ${collections.length}`);
for (const c of collections) console.log(` ${c.handle}: "${c.title}" ${c.products.length}`);
console.log("no collection:", products.filter(p => !p.collections.length).map(p => p.handle).join(", ") || "none");
