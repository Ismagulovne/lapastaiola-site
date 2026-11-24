// Builds the multilingual La Pastaiola website into website/dist/ from website/content/*.json + website/static/.
// Usage: node tools/build.mjs        (Node 18+, standard library only)
//
// Content is edited in the admin panel (/admin/) or directly in content/*.json:
//   settings.json  business info, hours, announcement, languages
//   catalog.json   products and collections (localized fields: { en, it, es })
//   pages.json     page texts
//   strings.json   interface labels
// English lives at the site root with the old Shopify URLs (/products/x/, /collections/x/, /pages/x/);
// other languages are under /it/ and /es/. Empty translations fall back to English.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { selfHostFonts, minifyCss, optimizeImages } from "./perf.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist");
const SITE_URL = "https://lapastaiola.co";
const load = f => JSON.parse(readFileSync(join(ROOT, "content", f), "utf8"));
const settings = load("settings.json"), pagesTxt = load("pages.json"), strings = load("strings.json"), catalog = load("catalog.json");

const LANGS = settings.languages?.length ? settings.languages : ["en"];
const DEFAULT = "en";
const LANG_NAMES = { en: "English", it: "Italiano", es: "Español" };
const LOCALES = { en: "en_US", it: "it_IT", es: "es_US" };
const BUILD = Date.now().toString(36);

// ---------- helpers ----------
const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const tr = (v, lang) => (v && typeof v === "object") ? (v[lang] || v[DEFAULT] || "") : (v ?? "");
const S = (key, lang) => tr(strings[key], lang) || key;
const P = (page, field, lang) => tr(pagesTxt[page]?.[field], lang);
const money = n => "$" + Number(n).toFixed(2);
// Valid positive price or null (bad or empty values from the admin are hidden instead of showing "$NaN").
const num = v => { if (v === "" || v === null || v === undefined) return null; const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };
const pricesOf = p => (p.variants?.length ? p.variants.map(v => num(v.price)) : [num(p.price)]).filter(n => n !== null);
const plain = html => String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const prefix = lang => (lang === DEFAULT ? "" : `/${lang}`);
const L = (lang, path) => prefix(lang) + path;

const tel = "+" + settings.phone.replace(/\D/g, "");
const cityLine = `${settings.city}, ${settings.state} ${settings.zip}`;
const products = catalog.products.filter(p => !p.hidden);
const prod = h => products.find(p => p.handle === h);
const col = h => catalog.collections.find(c => c.handle === h);
const shopCols = catalog.collections.filter(c => c.show_in_shop);
const imgOf = p => (p.image ? `/img/p/${p.image}` : "/img/logo.png");
const priceLabel = (p, lang) => {
  const prices = pricesOf(p);
  if (!prices.length) return "";
  const lo = Math.min(...prices), hi = Math.max(...prices);
  return lo === hi ? money(lo) : `${S("price_from", lang)} ${money(lo)}`;
};
// Search snippet: trimmed at a word boundary to about 155 characters.
const clip = (text, max = 155) => {
  const t = plain(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length).replace(/[,.;:\s–-]+$/, "") + "…";
};
// Product/collection snippets lead with the name and the local context, then the product's own text.
const seoDesc = (name, text, lang, key = "seo_product") => clip(`${name}: ${S(key, lang)} ${plain(text)}`);
const mailto = (subject, body = "") =>
  `mailto:${settings.email}?subject=${encodeURIComponent(subject)}${body ? "&body=" + encodeURIComponent(body) : ""}`;

const validTime = t => /^d{1,2}:d{2}$/.test(String(t || ""));
function fmtTime(hhmm, lang) {
  if (!validTime(hhmm)) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if (lang !== "en") return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const ap = h < 12 ? "am" : "pm", h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${ap}` : `${h12} ${ap}`;
}
const hoursTable = lang => `<table class="hours">${settings.hours.map(d =>
  `<tr><th scope="row">${esc(S("day_" + d.day, lang))}</th><td>${d.closed ? esc(S("closed", lang)) : (validTime(d.open) && validTime(d.close) ? `${fmtTime(d.open, lang)} – ${fmtTime(d.close, lang)}` : "–")}</td></tr>`).join("")}</table>`;

// ---------- output ----------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, "static"), OUT, { recursive: true });
// Speed: fonts served from the site itself (in CI), CSS inlined and minified into every page.
const FONTS = await selfHostFonts(OUT);
const CSS = minifyCss((FONTS ? FONTS.css : "") + readFileSync(join(ROOT, "static", "assets", "style.css"), "utf8"));
const HEAD_ASSETS = FONTS
  ? FONTS.preloads.map(u => `<link rel="preload" as="font" type="font/woff2" href="${u}" crossorigin>`).join("\n") + `
<style>${CSS}</style>`
  : `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700&family=Questrial&display=swap" rel="stylesheet">
<style>${CSS}</style>`;
const written = [];

// Root-relative links become page-relative so the site also works under a sub-path.
function relativize(html, path) {
  const segs = path.split("/").filter(Boolean);
  const depth = path.endsWith("/") ? segs.length : segs.length - 1;
  const pre = depth ? "../".repeat(depth) : "./";
  return html
    .replace(/(href|src)="\/(?!\/)/g, `$1="${pre}`)
    .replace(/url\('\/(?!\/)/g, `url('${pre}`)
    .replace(/(content="0; url=)\/(?!\/)/g, `$1${pre}`);
}
function write(path, html, { sitemap = true, base = null } = {}) {
  const file = /\.[a-z]+$/.test(path) ? join(OUT, path) : join(OUT, path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, relativize(html, path));
  if (sitemap) written.push({ path, base });
}
const redirect = (path, to) => write(path,
  `<!doctype html><meta charset="utf-8"><title>Redirecting…</title><meta name="robots" content="noindex"><link rel="canonical" href="${SITE_URL}${to}"><meta http-equiv="refresh" content="0; url=${to}"><a href="${to}">Continue</a>`,
  { sitemap: false });

const NAV = [
  ["/collections/all/", "nav_shop"], ["/pages/book-master-class-1/", "nav_classes"], ["/pages/caterings-1/", "nav_catering"],
  ["/pages/meal-kits/", "nav_meal_kits"], ["/pages/our-shop/", "nav_our_shop"], ["/pages/about-us/", "nav_about"], ["/pages/contact-us/", "nav_contact"]
];
const GLOBE = `<svg class="globe" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9.2"/><path d="M2.8 12h18.4M12 2.8c2.6 2.6 3.9 5.6 3.9 9.2s-1.3 6.6-3.9 9.2M12 2.8C9.4 5.4 8.1 8.4 8.1 12s1.3 6.6 3.9 9.2"/></svg>`;

// Brand glyphs for the footer social links (simple single-path marks, drawn in currentColor).
const ICON_INSTAGRAM = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="18" height="18" rx="5.2"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>`;
const ICON_FACEBOOK = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor"><path d="M13.6 21v-7.4h2.5l.4-2.9h-2.9V8.9c0-.8.2-1.4 1.4-1.4h1.6V4.9c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.1H8v2.9h2.5V21h3.1z"/></svg>`;

function langSwitcher(lang, path) {
  if (path.endsWith(".html")) path = "/"; // 404 page: offer each language's home
  return `<details class="lang">
  <summary aria-label="${esc(S("language", lang))}" title="${esc(S("language", lang))}">${GLOBE}<span>${lang.toUpperCase()}</span></summary>
  <ul class="lang-panel">${LANGS.map(l => `<li><a href="${L(l, path)}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="true"' : ""}><b>${l.toUpperCase()}</b> ${LANG_NAMES[l] || l}</a></li>`).join("")}</ul>
</details>`;
}

function layout({ lang, path, title, description, body, image = "/img/og.jpg", jsonld, home = false, ogType = "website", preload = null, noindex = false }) {
  const full = home ? `${settings.name} · ${title}` : `${title} · ${settings.name}`;
  const desc = clip(description || P("home", "description", lang));
  const ld = [].concat(jsonld || []);
  const nav = NAV.map(([h, k]) => `<a href="${L(lang, h)}"${path.startsWith(h) ? ' aria-current="page"' : ""}>${esc(S(k, lang))}</a>`).join("");
  const alternates = LANGS.map(l => `<link rel="alternate" hreflang="${l}" href="${SITE_URL}${L(l, path)}">`).join("\n") +
    `\n<link rel="alternate" hreflang="x-default" href="${SITE_URL}${path}">`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE_URL}${L(lang, path)}">
${alternates}
<meta property="og:site_name" content="${esc(settings.name)}">
<meta property="og:locale" content="${LOCALES[lang] || lang}">
${LANGS.filter(l => l !== lang).map(l => `<meta property="og:locale:alternate" content="${LOCALES[l] || l}">`).join("\n")}
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE_URL}${L(lang, path)}">
<meta property="og:image" content="${SITE_URL}${image}">
<meta property="og:image:alt" content="${esc(title)}">
<meta property="og:type" content="${ogType}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0e1b4d">
${noindex ? `<meta name="robots" content="noindex">` : `<meta name="robots" content="index, follow, max-image-preview:large">`}
<link rel="icon" href="/img/logo.png">
<link rel="apple-touch-icon" href="/img/logo.png">
${preload ? `<link rel="preload" as="image" href="${preload}" fetchpriority="high">` : ""}
${HEAD_ASSETS}
<script src="/assets/site.js?v=${BUILD}" defer></script>
${ld.map(j => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`).join("\n")}
</head>
<body>
<a class="skip" href="#main">${esc(S("skip", lang))}</a>
<div class="announce">${esc(tr(settings.announcement, lang))} · <a href="tel:${tel}">${esc(settings.phone)}</a></div>
<header class="site-header">
  <div class="wrap header-row">
    <details class="menu">
      <summary aria-label="${esc(S("menu", lang))}"><span></span><span></span><span></span></summary>
      <nav class="menu-panel">${nav}</nav>
    </details>
    <a class="brand" href="${L(lang, "/")}"><img src="/img/logo.png" alt="${esc(settings.name)}" width="180" height="90" sizes="180px"></a>
    <div class="header-actions">
      ${langSwitcher(lang, path)}
      <a class="pill pill-sm header-cta" href="${L(lang, "/pages/contact-us/")}">${esc(S("order", lang))}</a>
    </div>
  </div>
  <nav class="wrap desktop-nav" aria-label="Main">${nav}</nav>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <h2>${esc(S("footer_visit", lang))}</h2>
      <p>${esc(settings.street)}<br>${esc(cityLine)}</p>
      <p><a href="tel:${tel}">${esc(settings.phone)}</a><br><a href="mailto:${settings.email}">${esc(settings.email)}</a></p>
    </div>
    <div><h2>${esc(S("footer_hours", lang))}</h2>${hoursTable(lang)}</div>
    <div><h2>${esc(S("footer_explore", lang))}</h2><ul class="plain">${NAV.map(([h, k]) => `<li><a href="${L(lang, h)}">${esc(S(k, lang))}</a></li>`).join("")}</ul></div>
    <div><h2>${esc(S("footer_follow", lang))}</h2><ul class="social">
      ${settings.instagram ? `<li><a href="${esc(settings.instagram)}" rel="noopener" target="_blank" aria-label="Instagram" title="Instagram">${ICON_INSTAGRAM}</a></li>` : ""}
      ${settings.facebook ? `<li><a href="${esc(settings.facebook)}" rel="noopener" target="_blank" aria-label="Facebook" title="Facebook">${ICON_FACEBOOK}</a></li>` : ""}
    </ul></div>
  </div>
  <div class="wrap legal">© ${new Date().getFullYear()} ${esc(settings.name)} · ${esc(settings.legal_name)}</div>
</footer>
</body>
</html>
`;
}

const card = (p, lang) => `<a class="card" href="${L(lang, `/products/${p.handle}/`)}">
  <div class="card-media"><img src="${imgOf(p)}" alt="${esc(tr(p.title, lang))}" loading="lazy" decoding="async" width="450" height="450" sizes="(max-width: 719px) 46vw, (max-width: 1039px) 31vw, 280px"></div>
  <div class="card-body"><h3>${esc(tr(p.title, lang))}</h3><p class="price">${priceLabel(p, lang)}</p></div>
</a>`;
const grid = (list, lang) => `<div class="grid">${list.map(p => card(p, lang)).join("")}</div>`;
const colProducts = c => c.products.map(prod).filter(Boolean);

const orderBox = (what, lang) => `<div class="order-box">
  <p><strong>${esc(S("how_to_order_title", lang))}</strong> ${esc(S("how_to_order_text", lang))}</p>
  <div class="actions">
    <a class="pill" href="${mailto(`${S("order_subject", lang)}: ${what}`, S("order_body", lang).replace("{item}", what))}">${esc(S("order_by_email", lang))}</a>
    <a class="pill pill-outline" href="tel:${tel}">${esc(S("call", lang))} ${esc(settings.phone)}</a>
  </div>
</div>`;

const requestForm = (topic, lang) => `<form class="request" data-topic="${esc(topic)}" data-to="${esc(settings.email)}" data-from="${esc(S("form_from", lang))}"
  data-l-name="${esc(S("form_name", lang))}" data-l-email="${esc(S("form_email", lang))}" data-l-phone="${esc(S("form_phone", lang))}" data-l-date="${esc(S("form_date", lang))}" data-l-guests="${esc(S("form_guests", lang))}">
  <div class="field"><label for="f-name">${esc(S("form_name", lang))}</label><input id="f-name" name="name" autocomplete="name" required></div>
  <div class="field"><label for="f-email">${esc(S("form_email", lang))}</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
  <div class="field"><label for="f-phone">${esc(S("form_phone", lang))}</label><input id="f-phone" name="phone" type="tel" autocomplete="tel"></div>
  <div class="field"><label for="f-date">${esc(S("form_date", lang))}</label><input id="f-date" name="date" type="date"></div>
  <div class="field"><label for="f-guests">${esc(S("form_guests", lang))}</label><input id="f-guests" name="guests" type="number" min="1" inputmode="numeric"></div>
  <div class="field field-wide"><label for="f-msg">${esc(S("form_message", lang))}</label><textarea id="f-msg" name="message" rows="5"></textarea></div>
  <button class="pill" type="submit">${esc(S("form_send", lang))}</button>
  <p class="hint">${esc(S("form_hint", lang))} <a href="mailto:${settings.email}">${esc(settings.email)}</a> · <a href="tel:${tel}">${esc(settings.phone)}</a></p>
</form>
<script src="/assets/request.js?v=${BUILD}" defer></script>`;

const contactBlock = lang => `<div class="contact-grid">
  <div class="panel"><h2>${esc(S("contact_call", lang))}</h2><p><a class="big" href="tel:${tel}">${esc(settings.phone)}</a></p></div>
  <div class="panel"><h2>${esc(S("contact_email", lang))}</h2><p><a class="big" href="mailto:${settings.email}">${esc(settings.email)}</a></p></div>
  <div class="panel"><h2>${esc(S("contact_visit", lang))}</h2><p>${esc(settings.street)}<br>${esc(cityLine)}</p><p><a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(settings.street + ", " + cityLine)}" target="_blank" rel="noopener">${esc(S("open_maps", lang))}</a></p></div>
  <div class="panel"><h2>${esc(S("contact_hours", lang))}</h2>${hoursTable(lang)}</div>
</div>`;
// Hero photo is a real <img> (not a CSS background) so it gets responsive WebP sizes and loads first.
const hero = (img, inner, small = false) =>
  `<section class="hero${small ? " hero-sm" : ""}"><img class="hero-img" src="${img}" alt="" width="1600" height="1067" fetchpriority="high" sizes="100vw"><div class="hero-inner">${inner}</div></section>`;

// ---------- structured data (schema.org) ----------
const DAY_NAMES = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
const BIZ_ID = `${SITE_URL}/#business`;
const allPrices = products.flatMap(pricesOf);
const orgLd = lang => ({
  "@context": "https://schema.org", "@type": ["Store", "FoodEstablishment"], "@id": BIZ_ID,
  name: settings.name, legalName: settings.legal_name, url: SITE_URL + L(lang, "/"), description: P("home", "description", lang),
  image: [SITE_URL + "/img/og.jpg", SITE_URL + "/img/hero.jpg", SITE_URL + "/img/shop-1.jpg"], logo: SITE_URL + "/img/logo.png",
  telephone: tel, email: settings.email, servesCuisine: "Italian", priceRange: "$$", currenciesAccepted: "USD",
  address: { "@type": "PostalAddress", streetAddress: settings.street, addressLocality: settings.city, addressRegion: settings.state, postalCode: settings.zip, addressCountry: "US" },
  hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.street}, ${cityLine}`)}`,
  areaServed: ["Basalt, CO", "Aspen, CO", "Carbondale, CO", "Glenwood Springs, CO", "Snowmass Village, CO", "Roaring Fork Valley"],
  openingHoursSpecification: settings.hours.filter(d => !d.closed && validTime(d.open) && validTime(d.close)).map(d => ({ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${DAY_NAMES[d.day]}`, opens: d.open, closes: d.close })),
  sameAs: [settings.instagram, settings.facebook].filter(Boolean),
  ...(allPrices.length ? { makesOffer: { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: Math.min(...allPrices).toFixed(2), highPrice: Math.max(...allPrices).toFixed(2) } } : {})
});
const siteLd = lang => ({ "@context": "https://schema.org", "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: settings.name, url: SITE_URL + L(lang, "/"), inLanguage: lang, publisher: { "@id": BIZ_ID } });
const crumbsLd = (lang, items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE_URL + L(lang, path) })) });
function productLd(p, lang, title, desc) {
  const url = `${SITE_URL}${L(lang, `/products/${p.handle}/`)}`;
  const prices = pricesOf(p);
  const base = { priceCurrency: "USD", availability: "https://schema.org/InStoreOnly", url, seller: { "@id": BIZ_ID } };
  const offers = !prices.length ? undefined : prices.length > 1
    ? { "@type": "AggregateOffer", lowPrice: Math.min(...prices).toFixed(2), highPrice: Math.max(...prices).toFixed(2), offerCount: prices.length, ...base }
    : { "@type": "Offer", price: prices[0].toFixed(2), itemCondition: "https://schema.org/NewCondition", ...base };
  return { "@context": "https://schema.org", "@type": "Product", name: title, image: SITE_URL + imgOf(p), description: plain(desc) || title, url, inLanguage: lang,
    brand: { "@type": "Brand", name: settings.name }, offers };
}

// ---------- pages per language ----------
for (const lang of LANGS) {
  const add = (path, opts) => write(L(lang, path), layout({ lang, path, ...opts }), { base: path });

  // Home
  const tiles = shopCols.slice(0, 3).map(c => {
    const first = colProducts(c)[0];
    return `<a class="tile" href="${L(lang, `/collections/${c.handle}/`)}"><img src="${first ? imgOf(first) : "/img/logo.png"}" alt="${esc(tr(c.title, lang))}" loading="lazy" decoding="async" width="450" height="450" sizes="(max-width: 600px) 92vw, 380px"><span>${esc(tr(c.title, lang))}</span></a>`;
  }).join("");
  const reviews = [1, 2, 3].map(i => P("home", `review_${i}`, lang) ? `<blockquote>“${esc(P("home", `review_${i}`, lang))}”<cite>${esc(pagesTxt.home[`review_${i}_author`] || "")}</cite></blockquote>` : "").join("");
  add("/", {
    home: true, title: P("home", "title", lang), jsonld: [orgLd(lang), siteLd(lang)], preload: "/img/hero.jpg",
    body: `${hero("/img/hero.jpg", `<h1>${esc(P("home", "hero_title", lang))}</h1>
    <div class="actions"><a class="pill pill-light" href="${L(lang, "/collections/all/")}">${esc(P("home", "hero_button", lang))}</a><a class="pill pill-ghost" href="${L(lang, "/pages/contact-us/")}">${esc(P("home", "hero_button_2", lang))}</a></div>`)}
<section class="section"><div class="wrap">
  <h2 class="section-title">${esc(P("home", "products_title", lang))}</h2>
  <div class="tiles">${tiles}</div>
  <p class="center"><a class="pill" href="${L(lang, "/collections/all/")}">${esc(P("home", "shop_all", lang))}</a></p>
</div></section>
<section class="section band"><div class="wrap split">
  <img src="/img/pasta-hands.jpg" alt="${esc(P("home", "story_title", lang))}" loading="lazy" decoding="async" width="1200" height="900" sizes="(max-width: 819px) 92vw, 560px">
  <div><h2>${esc(P("home", "story_title", lang))}</h2><div class="rte">${P("home", "story_html", lang)}</div>
  <a class="pill pill-light" href="${L(lang, "/pages/about-us/")}">${esc(P("home", "story_button", lang))}</a></div>
</div></section>
<section class="section"><div class="wrap three">
  <a class="feature" href="${L(lang, "/pages/book-master-class-1/")}"><img src="/img/pasta-room.jpg" alt="${esc(P("home", "classes_title", lang))}" loading="lazy" decoding="async" width="1200" height="900" sizes="(max-width: 600px) 92vw, 380px"><h3>${esc(P("home", "classes_title", lang))}</h3><p>${esc(P("home", "classes_text", lang))}</p></a>
  <a class="feature" href="${L(lang, "/pages/caterings-1/")}"><img src="/img/marco.jpg" alt="${esc(P("home", "catering_title", lang))}" loading="lazy" decoding="async" width="1200" height="900" sizes="(max-width: 600px) 92vw, 380px"><h3>${esc(P("home", "catering_title", lang))}</h3><p>${esc(P("home", "catering_text", lang))}</p></a>
  <a class="feature" href="${L(lang, "/pages/meal-kits/")}"><img src="/img/shop-counter.jpg" alt="${esc(P("home", "mealkits_title", lang))}" loading="lazy" decoding="async" width="1200" height="900" sizes="(max-width: 600px) 92vw, 380px"><h3>${esc(P("home", "mealkits_title", lang))}</h3><p>${esc(P("home", "mealkits_text", lang))}</p></a>
</div></section>
<section class="section band-light"><div class="wrap split">
  <div><h2>${esc(P("home", "visit_title", lang))}</h2><p>${esc(settings.street)}, ${esc(cityLine)}<br><a href="tel:${tel}">${esc(settings.phone)}</a></p>${hoursTable(lang)}</div>
  <div class="quotes">${reviews}</div>
</div></section>`
  });

  // Shop
  const inShop = new Set(shopCols.flatMap(c => c.products));
  const rest = products.filter(p => !inShop.has(p.handle) && p.handle !== "fresh-pasta-making-class");
  add("/collections/all/", {
    title: P("shop", "title", lang), description: P("shop", "description", lang), jsonld: crumbsLd(lang, [[settings.name, "/"], [P("shop", "title", lang), "/collections/all/"]]),
    body: `<section class="section"><div class="wrap">
  <h1 class="page-title">${esc(P("shop", "title", lang))}</h1>
  ${orderBox(S("order_list_placeholder", lang), lang)}
  <nav class="chips" aria-label="${esc(P("shop", "title", lang))}">${shopCols.map(c => `<a href="#${c.handle}">${esc(tr(c.title, lang))}</a>`).join("")}</nav>
  ${shopCols.map(c => `<section id="${c.handle}" class="shop-group"><h2><a href="${L(lang, `/collections/${c.handle}/`)}">${esc(tr(c.title, lang))}</a></h2>${grid(colProducts(c), lang)}</section>`).join("")}
  ${rest.length ? `<section class="shop-group"><h2>${esc(S("more", lang))}</h2>${grid(rest, lang)}</section>` : ""}
</div></section>`
  });

  // Collections
  for (const c of catalog.collections) {
    add(`/collections/${c.handle}/`, {
      title: `${tr(c.title, lang)} · ${S("seo_place", lang)}`, description: seoDesc(tr(c.title, lang), tr(c.description_html, lang), lang, "seo_collection"),
      jsonld: crumbsLd(lang, [[settings.name, "/"], [P("shop", "title", lang), "/collections/all/"], [tr(c.title, lang), `/collections/${c.handle}/`]]),
      body: `<section class="section"><div class="wrap">
  <p class="crumbs"><a href="${L(lang, "/collections/all/")}">${esc(P("shop", "title", lang))}</a> / ${esc(tr(c.title, lang))}</p>
  <h1 class="page-title">${esc(tr(c.title, lang))}</h1>
  ${tr(c.description_html, lang) ? `<div class="rte lead">${tr(c.description_html, lang)}</div>` : ""}
  ${grid(colProducts(c), lang)}
</div></section>`
    });
  }

  // Products
  const PASTA = new Set(["raviolis-short-pasta", "string-pastas", "short-pastas"]);
  for (const p of products) {
    const cols = catalog.collections.filter(c => c.products.includes(p.handle));
    const firstCol = cols.find(c => c.show_in_shop) || cols[0];
    const related = products.filter(x => x !== p && x.handle !== "fresh-pasta-making-class" && cols.some(c => c.products.includes(x.handle))).slice(0, 4);
    const title = tr(p.title, lang), desc = tr(p.description_html, lang);
    const variants = p.variants?.length > 1 ? `<table class="variants"><caption>${esc(S("options", lang))}</caption>${p.variants.map(v => `<tr><th scope="row">${esc(tr(v.name, lang))}</th><td>${num(v.price) === null ? "" : money(v.price)}</td></tr>`).join("")}</table>` : "";
    const isClass = p.handle === "fresh-pasta-making-class";
    add(`/products/${p.handle}/`, {
      title: firstCol && (title + tr(firstCol.title, lang)).length < 46 ? `${title} · ${tr(firstCol.title, lang)}` : title,
      image: imgOf(p), ogType: "product", description: seoDesc(title, desc, lang, isClass ? "seo_class" : "seo_product"),
      jsonld: [productLd(p, lang, title, desc), crumbsLd(lang, [[settings.name, "/"], [P("shop", "title", lang), "/collections/all/"],
        ...(firstCol ? [[tr(firstCol.title, lang), `/collections/${firstCol.handle}/`]] : []), [title, `/products/${p.handle}/`]])],
      body: `<section class="section"><div class="wrap">
  <p class="crumbs"><a href="${L(lang, "/collections/all/")}">${esc(P("shop", "title", lang))}</a>${firstCol ? ` / <a href="${L(lang, `/collections/${firstCol.handle}/`)}">${esc(tr(firstCol.title, lang))}</a>` : ""}</p>
  <div class="product">
    <div class="product-media"><img src="${imgOf(p)}" alt="${esc(title)}" width="700" height="700" sizes="(max-width: 859px) 92vw, 600px"></div>
    <div class="product-info">
      <h1>${esc(title)}</h1>
      <p class="price price-lg">${priceLabel(p, lang)}</p>
      ${variants}
      <div class="rte">${desc}</div>
      ${cols.some(c => PASTA.has(c.handle)) ? `<p class="note">${esc(S("vegan_note", lang))}</p>` : ""}
      ${isClass ? `<div class="actions"><a class="pill" href="${L(lang, "/pages/book-master-class-1/")}">${esc(S("class_details", lang))}</a></div>` : orderBox(title, lang)}
    </div>
  </div>
  ${related.length ? `<h2 class="section-title small">${esc(S("related", lang))}</h2>${grid(related, lang)}` : ""}
</div></section>`
    });
  }

  // Contact
  add("/pages/contact-us/", {
    title: P("contact", "title", lang), description: P("contact", "description", lang), jsonld: orgLd(lang),
    body: `<section class="section"><div class="wrap narrow">
  <h1 class="page-title">${esc(P("contact", "title", lang))}</h1>
  <p class="lead">${esc(P("contact", "lead", lang))}</p>
  ${contactBlock(lang)}
</div></section>`
  });

  // About
  add("/pages/about-us/", {
    title: P("about", "title", lang), description: P("about", "description", lang), image: "/img/about-1.jpg",
    body: `<section class="section"><div class="wrap narrow">
  <h1 class="page-title">${esc(P("about", "heading", lang))}</h1>
  <p class="lead">${esc(P("about", "lead", lang))}</p>
  <div class="gallery">${["about-1", "about-2", "about-3", "about-4"].filter(n => existsSync(join(OUT, "img", n + ".jpg"))).map(n => `<img src="/img/${n}.jpg" alt="" loading="lazy" decoding="async" width="900" height="900" sizes="(max-width: 719px) 46vw, 200px">`).join("")}</div>
  <div class="rte">${P("about", "body_html", lang)}</div>
</div></section>`
  });

  // Our shop
  add("/pages/our-shop/", {
    title: P("our_shop", "title", lang), description: P("our_shop", "description", lang), image: "/img/shop-1.jpg",
    body: `<section class="section"><div class="wrap split">
  <img src="/img/shop-1.jpg" alt="" loading="lazy" decoding="async" width="1200" height="900" sizes="(max-width: 819px) 92vw, 560px">
  <div><h1 class="page-title">${esc(P("our_shop", "heading", lang))}</h1><p class="lead">${esc(P("our_shop", "lead", lang))}</p><div class="rte">${P("our_shop", "body_html", lang)}</div></div>
</div></section>
<section class="section band-light"><div class="wrap">${contactBlock(lang)}<p class="center"><a class="pill" href="${L(lang, "/collections/all/")}">${esc(P("our_shop", "button", lang))}</a></p></div></section>`
  });

  // Classes
  const classProduct = prod("fresh-pasta-making-class");
  add("/pages/book-master-class-1/", {
    title: P("classes", "title", lang), description: P("classes", "description", lang), image: "/img/pasta-room.jpg", preload: "/img/pasta-room.jpg",
    body: `${hero("/img/pasta-room.jpg", `<h1>${esc(P("classes", "heading", lang))}</h1>`, true)}
<section class="section"><div class="wrap narrow">
  <p class="lead">${esc(P("classes", "lead", lang))}</p>
  <div class="order-box">
    <p><strong>${esc(classProduct ? tr(classProduct.title, lang) : P("classes", "title", lang))}</strong> · ${classProduct ? priceLabel(classProduct, lang) : ""} ${esc(P("classes", "price_line", lang))}</p>
    <div class="actions"><a class="pill" href="${mailto(P("classes", "email_subject", lang), P("classes", "email_body", lang))}">${esc(P("classes", "button", lang))}</a><a class="pill pill-outline" href="tel:${tel}">${esc(S("call", lang))} ${esc(settings.phone)}</a></div>
  </div>
  <div class="rte">${P("classes", "body_html", lang)}</div>
  <div class="split split-tight">
    <img src="/img/kids-class.jpg" alt="" loading="lazy" decoding="async" width="1000" height="750" sizes="(max-width: 819px) 92vw, 380px">
    <div><h2>${esc(P("classes", "kids_title", lang))}</h2><div class="rte">${P("classes", "kids_html", lang)}</div><p><a href="mailto:${settings.email}">${esc(settings.email)}</a></p></div>
  </div>
</div></section>`
  });

  // Catering
  add("/pages/caterings-1/", {
    title: P("catering", "title", lang), description: P("catering", "description", lang), image: "/img/marco.jpg",
    body: `<section class="section"><div class="wrap split">
  <img src="/img/marco.jpg" alt="" loading="lazy" decoding="async" width="1000" height="750" sizes="(max-width: 819px) 92vw, 560px">
  <div><h1 class="page-title">${esc(P("catering", "heading", lang))}</h1><p class="lead">${esc(P("catering", "lead", lang))}</p><p>${esc(P("catering", "text", lang))}</p></div>
</div></section>
<section class="section band-light"><div class="wrap narrow"><h2>${esc(P("catering", "form_title", lang))}</h2>${requestForm(P("catering", "form_subject", lang), lang)}</div></section>`
  });

  // Meal kits
  add("/pages/meal-kits/", {
    title: P("meal_kits", "title", lang), description: P("meal_kits", "description", lang),
    body: `<section class="section"><div class="wrap narrow">
  <h1 class="page-title">${esc(P("meal_kits", "heading", lang))}</h1>
  <p class="lead">${esc(P("meal_kits", "lead", lang))}</p>
  <p>${esc(P("meal_kits", "text", lang))}</p>
  <h2>${esc(P("meal_kits", "form_title", lang))}</h2>
  ${requestForm(P("meal_kits", "form_subject", lang), lang)}
</div></section>`
  });

  // Mediterranean Delights (old Shopify page) mirrors its collection
  const med = col("mediterranean-delights");
  if (med) add("/pages/mediterranean-delights/", {
    title: tr(med.title, lang), description: plain(tr(med.description_html, lang)).slice(0, 160),
    body: `<section class="section"><div class="wrap"><h1 class="page-title">${esc(tr(med.title, lang))}</h1><div class="rte lead">${tr(med.description_html, lang)}</div>${grid(colProducts(med), lang)}</div></section>`
  });

  // Redirects for retired Shopify URLs
  for (const [from, to] of [["/collections/", "/collections/all/"], ["/collections/frontpage/", "/collections/all/"], ["/products/", "/collections/all/"],
    ["/cart/", "/pages/contact-us/"], ["/pages/location/", "/pages/contact-us/"], ["/pages/contact/", "/pages/contact-us/"],
    ["/pages/book-master-class/", "/pages/book-master-class-1/"], ["/pages/caterings/", "/pages/caterings-1/"], ["/blogs/news/", "/"], ["/blogs/", "/"]])
    redirect(L(lang, from), L(lang, to));
}

// ---------- 404 (served for any missing path, so links stay absolute) ----------
const nf = layout({ lang: DEFAULT, path: "/404.html", title: P("not_found", "title", DEFAULT), noindex: true,
  body: `<section class="section"><div class="wrap narrow center"><h1 class="page-title">${esc(P("not_found", "title", DEFAULT))}</h1><p class="lead">${esc(P("not_found", "lead", DEFAULT))}</p><div class="actions center">${LANGS.map(l => `<a class="pill${l === DEFAULT ? "" : " pill-outline"}" href="${L(l, "/")}">${esc(S("home", l))} · ${l.toUpperCase()}</a>`).join("")}</div></div></section>` });
writeFileSync(join(OUT, "404.html"), nf);

await optimizeImages(OUT);
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${SITE_URL}/sitemap.xml\n`);
// Sitemap with hreflang alternates for every language version of each page.
const smEntry = ({ path, base }) => {
  const alts = base ? LANGS.map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${L(l, base)}"/>`).join("") +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${base}"/>` : "";
  return `  <url><loc>${SITE_URL}${path}</loc>${alts}</url>`;
};
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${written.map(smEntry).join("\n")}\n</urlset>\n`);
writeFileSync(join(OUT, "CNAME"), "lapastaiola.co\n");
writeFileSync(join(OUT, ".nojekyll"), "");
console.log(`built ${written.length} pages in ${LANGS.length} languages into ${OUT}`);
