// Downloads the store's own photos from the Shopify CDN into website/site/img/.
// Usage: node website/tools/fetch-images.mjs <catalog.json> <site_dir>
// Node 18+ stdlib (global fetch). Skips files that already exist.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [, , catalogPath, siteDir] = process.argv;
const CDN = "https://cdn.shopify.com/s/files/1/0832/1364/8186/files/";
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

// [source file on CDN, local name, width]
const PAGE_IMAGES = [
  ["a8554203-4d16-4795-b2ab-3d9295b11599-removebg-preview_1.png", "logo.png", 500],
  ["jrj1756.jpg", "hero.jpg", 1600],
  ["jrj2525_2.jpg", "pasta-hands.jpg", 1200],
  ["jrj1964.jpg", "shop-counter.jpg", 1200],
  ["Kids_pasta.jpg", "kids-pasta.jpg", 1000],
  ["Kids_Class.jpg", "kids-class.jpg", 1000],
  ["Pasta_Room.jpg", "pasta-room.jpg", 1200],
  ["Cindy.jpg", "class-guest.jpg", 1000],
  ["Marco.jpg", "marco.jpg", 1000],
  ["IMG_3242.jpg", "about-1.jpg", 900],
  ["IMG_3243.jpg", "about-2.jpg", 900],
  ["IMG_3261_e40e158d-07d1-4ed2-9cf3-f9df8f23afa5.jpg", "about-3.jpg", 900],
  ["IMG_3261_4ac68b5b-a59e-4b28-aff6-e590b29073ae.jpg", "shop-1.jpg", 1200],
  ["a3c08f19-b9f5-4257-a589-a222cd53047b.jpg", "about-4.jpg", 900],
  ["a8554203-4d16-4795-b2ab-3d9295b11599_175a1d70-f482-4ae7-969d-bb770546b03e.jpg", "og.jpg", 1200]
];

const jobs = PAGE_IMAGES.map(([src, name, w]) => ({ src, dest: join(siteDir, "img", name), w }));
for (const p of catalog.products) p.images.forEach((src, i) => {
  const ext = src.split(".").pop().toLowerCase().replace("jpeg", "jpg");
  jobs.push({ src, dest: join(siteDir, "img", "p", `${p.handle}${i ? "-" + (i + 1) : ""}.${ext}`), w: 900 });
});

mkdirSync(join(siteDir, "img", "p"), { recursive: true });
let ok = 0, skipped = 0; const failed = [];
for (const j of jobs) {
  if (existsSync(j.dest)) { skipped++; continue; }
  try {
    const r = await fetch(`${CDN}${encodeURIComponent(j.src)}?width=${j.w}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    writeFileSync(j.dest, Buffer.from(await r.arrayBuffer()));
    ok++;
  } catch (e) { failed.push(`${j.src}: ${e.message}`); }
}
console.log(`downloaded ${ok}, already had ${skipped}, failed ${failed.length}`);
if (failed.length) console.log(failed.join("\n"));
