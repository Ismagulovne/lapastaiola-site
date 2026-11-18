// Builds the static La Pastaiola website into website/site/ from website/data/catalog.json.
// Usage: node website/tools/build.mjs
// Node stdlib only. URLs mirror the old Shopify store (/products/x, /collections/x, /pages/x),
// written as folder/index.html so they work on GitHub Pages, Cloudflare Pages or any static host.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "site");
const SITE_URL = "https://lapastaiola.co";
const { products, collections } = JSON.parse(readFileSync(join(ROOT, "data", "catalog.json"), "utf8"));

const BIZ = {
  name: "La Pastaiola",
  legal: "Hospitality Adventure LLC",
  email: "info@lapastaiola.co",
  phone: "+1 (970) 975-0858",
  tel: "+19709750858",
  street: "72 Sunset Dr, Unit B",
  city: "Basalt, CO 81623",
  hours: [["Monday", "Closed"], ["Tuesday", "11 am – 6 pm"], ["Wednesday", "11 am – 6 pm"], ["Thursday", "11 am – 6 pm"],
          ["Friday", "11 am – 6 pm"], ["Saturday", "Closed"], ["Sunday", "Closed"]],
  instagram: "https://www.instagram.com/lapastaiola.co/",
  facebook: "https://www.facebook.com/profile.php?id=100089574455702"
};

// Storefront collections, in menu order.
// "short-pastas" is a subset of "raviolis-short-pasta": it keeps its own page but is not repeated on /collections/all/.
const SHOP = ["raviolis-short-pasta", "string-pastas", "sauces", "i-nostri-dolci", "mediterranean-delights"];
const col = h => collections.find(c => c.handle === h);
const prod = h => products.find(p => p.handle === h);
// Cavatelli was sold on the old site but sat in no collection; list it with the short pastas.
for (const h of ["raviolis-short-pasta", "short-pastas"]) if (!col(h).products.includes("cavatelli")) col(h).products.push("cavatelli");
if (prod("cavatelli") && !prod("cavatelli").collections.length) prod("cavatelli").collections.push("raviolis-short-pasta", "short-pastas");
const retail = products.filter(p => p.handle !== "fresh-pasta-making-class");

// ---------- helpers ----------
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = n => "$" + n.toFixed(2);
const imgOf = p => {
  const f = readdirSync(join(OUT, "img", "p")).find(x => x.startsWith(p.handle + ".") );
  return f ? `/img/p/${f}` : "/img/logo.png";
};
const priceLabel = p => {
  const prices = p.variants.length ? p.variants.map(v => v.price) : [p.price];
  const lo = Math.min(...prices), hi = Math.max(...prices);
  return lo === hi ? money(lo) : `From ${money(lo)}`;
};
const mailto = (subject, body = "") =>
  `mailto:${BIZ.email}?subject=${encodeURIComponent(subject)}${body ? "&body=" + encodeURIComponent(body) : ""}`;

function write(path, html) {
  const file = path.endsWith(".html") || path.includes(".") ? join(OUT, path) : join(OUT, path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, relativize(html, path));
  return path;
}

// Rewrites root-relative links ("/x") to page-relative ones ("../x") so the site also works
// under a sub-path such as <user>.github.io/<repo>/ before the custom domain is switched.
// Absolute https:// URLs (canonical, og:image, JSON-LD) are left as they are.
function relativize(html, path) {
  const depth = path.endsWith("/") ? path.split("/").filter(Boolean).length : path.split("/").filter(Boolean).length - 1;
  const pre = depth ? "../".repeat(depth) : "./";
  return html
    .replace(/(href|src)="\/(?!\/)/g, `$1="${pre}`)
    .replace(/url\('\/(?!\/)/g, `url('${pre}`)
    .replace(/(content="0; url=)\/(?!\/)/g, `$1${pre}`);
}

const NAV = [
  ["/collections/all/", "Shop"],
  ["/pages/book-master-class-1/", "Pasta classes"],
  ["/pages/caterings-1/", "Catering"],
  ["/pages/meal-kits/", "Meal kits"],
  ["/pages/our-shop/", "Our shop"],
  ["/pages/about-us/", "About"],
  ["/pages/contact-us/", "Contact"]
];

function layout({ title, description, path, body, image = "/img/og.jpg", jsonld }) {
  const full = title === BIZ.name ? `${BIZ.name} · Fresh pasta in Basalt, Colorado` : `${title} · ${BIZ.name}`;
  const desc = description || "Artisanal fresh pasta, sauces and Italian specialties made in Basalt, Colorado. Pasta classes, catering and meal kits.";
  const nav = NAV.map(([h, t]) => `<a href="${h}"${path.startsWith(h) ? ' aria-current="page"' : ""}>${t}</a>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE_URL}${path}">
<meta property="og:site_name" content="${BIZ.name}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE_URL}${path}">
<meta property="og:image" content="${SITE_URL}${image}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#0e1b4d">
<link rel="icon" href="/img/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700&family=Questrial&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css?v=${BUILD}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="announce">Order by phone or email · Pick up in Basalt · <a href="tel:${BIZ.tel}">${BIZ.phone}</a></div>
<header class="site-header">
  <div class="wrap header-row">
    <details class="menu">
      <summary aria-label="Menu"><span></span><span></span><span></span></summary>
      <nav class="menu-panel">${nav}</nav>
    </details>
    <a class="brand" href="/"><img src="/img/logo.png" alt="${BIZ.name}" width="180" height="90"></a>
    <a class="pill pill-sm header-cta" href="/pages/contact-us/">Order</a>
  </div>
  <nav class="wrap desktop-nav" aria-label="Main">${nav}</nav>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <h2>Visit us</h2>
      <p>${BIZ.street}<br>${BIZ.city}</p>
      <p><a href="tel:${BIZ.tel}">${BIZ.phone}</a><br><a href="mailto:${BIZ.email}">${BIZ.email}</a></p>
    </div>
    <div>
      <h2>Store hours</h2>
      ${hoursTable()}
    </div>
    <div>
      <h2>Explore</h2>
      <ul class="plain">${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul>
    </div>
    <div>
      <h2>Follow</h2>
      <ul class="plain">
        <li><a href="${BIZ.instagram}" rel="noopener" target="_blank">Instagram</a></li>
        <li><a href="${BIZ.facebook}" rel="noopener" target="_blank">Facebook</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap legal">© ${new Date().getFullYear()} ${BIZ.name} · ${BIZ.legal}</div>
</footer>
</body>
</html>
`;
}

function hoursTable() {
  return `<table class="hours">${BIZ.hours.map(([d, h]) => `<tr><th scope="row">${d}</th><td>${h}</td></tr>`).join("")}</table>`;
}

function card(p) {
  return `<a class="card" href="/products/${p.handle}/">
  <div class="card-media"><img src="${imgOf(p)}" alt="${esc(p.title)}" loading="lazy" width="450" height="450"></div>
  <div class="card-body"><h3>${esc(p.title)}</h3><p class="price">${priceLabel(p)}</p></div>
</a>`;
}
const grid = list => `<div class="grid">${list.map(card).join("")}</div>`;

const orderBox = (what, extra = "") => `<div class="order-box">
  <p><strong>How to order:</strong> online checkout is paused. Call or email us and pick up at the shop in Basalt.${extra}</p>
  <div class="actions">
    <a class="pill" href="${mailto("Order: " + what, `Hello La Pastaiola,\n\nI would like to order: ${what}\nQuantity:\nPick-up date:\nName:\nPhone:\n\nThank you!`)}">Order by email</a>
    <a class="pill pill-outline" href="tel:${BIZ.tel}">Call ${BIZ.phone}</a>
  </div>
</div>`;

// Request form that opens the visitor's email app (free, no third-party form service).
function requestForm(topic) {
  return `<form class="request" data-topic="${esc(topic)}" data-to="${BIZ.email}">
  <div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required></div>
  <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
  <div class="field"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" autocomplete="tel"></div>
  <div class="field"><label for="f-date">Event date</label><input id="f-date" name="date" type="date"></div>
  <div class="field"><label for="f-guests">Guests</label><input id="f-guests" name="guests" type="number" min="1" inputmode="numeric"></div>
  <div class="field field-wide"><label for="f-msg">Tell us about it</label><textarea id="f-msg" name="message" rows="5"></textarea></div>
  <button class="pill" type="submit">Send request</button>
  <p class="hint">This opens your email app with the details filled in. You can also write to <a href="mailto:${BIZ.email}">${BIZ.email}</a> or call <a href="tel:${BIZ.tel}">${BIZ.phone}</a>.</p>
</form>
<script src="/assets/request.js?v=${BUILD}" defer></script>`;
}

const BUILD = Date.now().toString(36);
const pages = [];
const add = (path, opts) => pages.push(write(path, layout({ path, ...opts })));
const redirect = (path, to) => {
  write(path, `<!doctype html><meta charset="utf-8"><title>Redirecting…</title><link rel="canonical" href="${SITE_URL}${to}"><meta http-equiv="refresh" content="0; url=${to}"><a href="${to}">Continue</a>`);
};

const orgLd = {
  "@context": "https://schema.org", "@type": ["Store", "FoodEstablishment"], name: BIZ.name, url: SITE_URL,
  image: SITE_URL + "/img/og.jpg", logo: SITE_URL + "/img/logo.png", telephone: BIZ.tel, email: BIZ.email,
  address: { "@type": "PostalAddress", streetAddress: BIZ.street, addressLocality: "Basalt", addressRegion: "CO", postalCode: "81623", addressCountry: "US" },
  openingHours: "Tu-Fr 11:00-18:00", sameAs: [BIZ.instagram, BIZ.facebook]
};

// ---------- home ----------
add("/", {
  title: BIZ.name, jsonld: orgLd,
  body: `
<section class="hero" style="--img:url('/img/hero.jpg')">
  <div class="hero-inner">
    <h1>Experience the taste of Italy with every bite of our artisanal fresh pasta and sauces</h1>
    <div class="actions"><a class="pill pill-light" href="/collections/all/">See our pasta</a><a class="pill pill-ghost" href="/pages/contact-us/">How to order</a></div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2 class="section-title">Our products, made with Italian soul</h2>
    <div class="tiles">
      ${[["raviolis-short-pasta", "/img/p/butternut-squash-ricotta-ravioli.jpg"], ["string-pastas", "/img/p/tagliatelle.jpg"], ["sauces", "/img/p/pomodoro.jpg"]]
        .map(([h, img]) => { const c = col(h); const src = existsSync(join(OUT, img)) ? img : imgOf(prod(c.products[0]));
          return `<a class="tile" href="/collections/${h}/"><img src="${src}" alt="" loading="lazy"><span>${esc(c.title)}</span></a>`; }).join("")}
    </div>
    <p class="center"><a class="pill" href="/collections/all/">Shop all</a></p>
  </div>
</section>

<section class="section band">
  <div class="wrap split">
    <img src="/img/pasta-hands.jpg" alt="Fresh pasta being made by hand" loading="lazy">
    <div>
      <h2>Our story</h2>
      <p>Aina and Marco Baghetti bring La Pastaiola's traditional Italian <em>mercato</em> to the Roaring Fork Valley. We make fresh pasta from scratch every day using premium ingredients and traditional bronze dies, which give the pasta a rough texture that holds the sauce.</p>
      <a class="pill pill-light" href="/pages/about-us/">Read more</a>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap three">
    <a class="feature" href="/pages/book-master-class-1/"><img src="/img/pasta-room.jpg" alt="" loading="lazy"><h3>Pasta-making classes</h3><p>From kneading dough to finishing the sauce. Small groups of up to 6.</p></a>
    <a class="feature" href="/pages/caterings-1/"><img src="/img/marco.jpg" alt="" loading="lazy"><h3>Boutique catering</h3><p>Handcrafted pasta, rich sauces and Italian dishes tailored to your event.</p></a>
    <a class="feature" href="/pages/meal-kits/"><img src="/img/shop-counter.jpg" alt="" loading="lazy"><h3>Meal kits</h3><p>Pre-packaged three-course meals for family gatherings and parties.</p></a>
  </div>
</section>

<section class="section band-light">
  <div class="wrap split">
    <div>
      <h2>Visit our pasta shop</h2>
      <p>${BIZ.street}, ${BIZ.city}<br><a href="tel:${BIZ.tel}">${BIZ.phone}</a></p>
      ${hoursTable()}
    </div>
    <div class="quotes">
      <blockquote>“The best Italian products I've truly ever tasted.”<cite>Michael M.</cite></blockquote>
      <blockquote>“Their balsamic selection from Modena is simply divine.”<cite>David R.</cite></blockquote>
      <blockquote>“The service here is as exceptional as the pasta. Aina and Marco are so friendly, knowledgeable and very helpful.”<cite>Olivia T.</cite></blockquote>
    </div>
  </div>
</section>`
});

// ---------- shop ----------
add("/collections/all/", {
  title: "Shop", description: "Fresh pasta, ravioli, sauces, Italian desserts and Mediterranean pantry items from La Pastaiola in Basalt, Colorado.",
  body: `<section class="section"><div class="wrap">
  <h1 class="page-title">Shop</h1>
  ${orderBox("(list the items you want)")}
  <nav class="chips" aria-label="Collections">${SHOP.map(h => `<a href="#${h}">${esc(col(h).title)}</a>`).join("")}</nav>
  ${SHOP.map(h => { const c = col(h); const list = c.products.map(prod).filter(Boolean);
    return `<section id="${h}" class="shop-group"><h2><a href="/collections/${h}/">${esc(c.title)}</a></h2>${grid(list)}</section>`; }).join("")}
  ${(() => { const rest = retail.filter(p => !p.collections.some(c => SHOP.includes(c))); return rest.length ? `<section class="shop-group"><h2>More</h2>${grid(rest)}</section>` : ""; })()}
</div></section>`
});
redirect("/collections/", "/collections/all/");
redirect("/collections/frontpage/", "/collections/all/");
redirect("/products/", "/collections/all/");
redirect("/cart/", "/pages/contact-us/");

for (const h of [...SHOP, "short-pastas"]) {
  const c = col(h);
  add(`/collections/${h}/`, {
    title: c.title, description: c.descriptionHtml.replace(/<[^>]+>/g, "").slice(0, 160) || undefined,
    body: `<section class="section"><div class="wrap">
  <p class="crumbs"><a href="/collections/all/">Shop</a> / ${esc(c.title)}</p>
  <h1 class="page-title">${esc(c.title)}</h1>
  ${c.descriptionHtml ? `<div class="rte lead">${c.descriptionHtml}</div>` : ""}
  ${grid(c.products.map(prod).filter(Boolean))}
</div></section>`
  });
}

// ---------- products ----------
const PASTA = new Set(["raviolis-short-pasta", "string-pastas", "short-pastas"]);
for (const p of products) {
  const isClass = p.handle === "fresh-pasta-making-class";
  const related = retail.filter(x => x !== p && x.collections.some(c => p.collections.includes(c))).slice(0, 4);
  const firstCol = p.collections.find(c => SHOP.includes(c));
  const variants = p.variants.length > 1 ? `<table class="variants"><caption>Options</caption>${p.variants.map(v => `<tr><th scope="row">${esc(v.name)}</th><td>${money(v.price)}</td></tr>`).join("")}</table>` : "";
  add(`/products/${p.handle}/`, {
    title: p.title, image: imgOf(p),
    description: p.descriptionHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160),
    jsonld: { "@context": "https://schema.org", "@type": "Product", name: p.title, image: SITE_URL + imgOf(p),
      description: p.descriptionHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      brand: { "@type": "Brand", name: BIZ.name },
      offers: { "@type": "Offer", price: p.price.toFixed(2), priceCurrency: "USD", url: `${SITE_URL}/products/${p.handle}/` } },
    body: `<section class="section"><div class="wrap">
  <p class="crumbs"><a href="/collections/all/">Shop</a>${firstCol ? ` / <a href="/collections/${firstCol}/">${esc(col(firstCol).title)}</a>` : ""}</p>
  <div class="product">
    <div class="product-media"><img src="${imgOf(p)}" alt="${esc(p.title)}" width="700" height="700"></div>
    <div class="product-info">
      <h1>${esc(p.title)}</h1>
      <p class="price price-lg">${priceLabel(p)}</p>
      ${variants}
      <div class="rte">${p.descriptionHtml}</div>
      ${p.collections.some(c => PASTA.has(c)) ? `<p class="note">All pastas can be made vegan or with eggs. Tell us which when you order.</p>` : ""}
      ${isClass ? `<div class="actions"><a class="pill" href="/pages/book-master-class-1/">Class details and booking</a></div>` : orderBox(p.title)}
    </div>
  </div>
  ${related.length ? `<h2 class="section-title small">You may also like</h2>${grid(related)}` : ""}
</div></section>`
  });
}

// ---------- content pages ----------
const contactBlock = `<div class="contact-grid">
  <div class="panel"><h2>Call</h2><p><a class="big" href="tel:${BIZ.tel}">${BIZ.phone}</a></p></div>
  <div class="panel"><h2>Email</h2><p><a class="big" href="mailto:${BIZ.email}">${BIZ.email}</a></p></div>
  <div class="panel"><h2>Visit</h2><p>${BIZ.street}<br>${BIZ.city}</p><p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BIZ.street + ", " + BIZ.city)}" target="_blank" rel="noopener">Open in Maps</a></p></div>
  <div class="panel"><h2>Hours</h2>${hoursTable()}</div>
</div>`;

add("/pages/contact-us/", {
  title: "Contact & ordering", description: "Call, email or visit La Pastaiola at 72 Sunset Dr, Basalt, Colorado.",
  body: `<section class="section"><div class="wrap narrow">
  <h1 class="page-title">Contact &amp; ordering</h1>
  <p class="lead">Online checkout is paused for now. To order fresh pasta, sauces or desserts, call or email us with what you need and when you'd like to pick it up.</p>
  ${contactBlock}
</div></section>`
});
redirect("/pages/location/", "/pages/contact-us/");
redirect("/pages/contact/", "/pages/contact-us/");

add("/pages/about-us/", {
  title: "About us", description: "Aina and Marco Baghetti, fresh pasta artisans in the Roaring Fork Valley.", image: "/img/about-1.jpg",
  body: `<section class="section"><div class="wrap narrow">
  <h1 class="page-title">Fresh pasta artisans in the Roaring Fork Valley</h1>
  <p class="lead">Aina and Marco Baghetti are excited to bring La Pastaiola's artisanal Italian fresh pasta and sauces to the Roaring Fork Valley.</p>
  <div class="gallery">${["about-1", "about-2", "about-3", "about-4"].map(n => `<img src="/img/${n}.jpg" alt="" loading="lazy">`).join("")}</div>
  <div class="rte">
    <p>Marco is from Naples, Italy. His childhood memories are mostly of being in the kitchen with his nonna and mother, watching them cook, debating the best ingredients and deciding the day's menu for the family. Holidays are his best memories, with the traditional Neapolitan food of the festive season. Every Easter, Marco and his mom still cook together over video call.</p>
    <p>Aina is from Almaty, Kazakhstan, and grew up in a large family of seven children where experimenting with family meals was always fun. She built a career in hospitality and mastered the art of pasta making in Italy, to create a product made with skill, love and tradition.</p>
    <p>Marco and Aina met while working at Il Gattopardo restaurant in New York City. They share a passion for Italian food and exceptional service. Years of experience in food and wine, restaurant management and catering led them to open an artisanal <em>pastificio</em> in the Roaring Fork Valley.</p>
    <p>They have two sons, Matteo and Stefano, to whom they hope to pass on their passion.</p>
  </div>
</div></section>`
});

add("/pages/our-shop/", {
  title: "Our shop", description: "An authentic pastificio in Basalt, Colorado: fresh pasta made daily, in-house sauces and Italian imports.", image: "/img/shop-1.jpg",
  body: `<section class="section"><div class="wrap split">
  <img src="/img/shop-1.jpg" alt="Inside the La Pastaiola shop" loading="lazy">
  <div>
    <h1 class="page-title">Our shop</h1>
    <p class="lead">It's not just a store to us. It is our lifestyle, where we come from, and what we hold most important.</p>
    <div class="rte">
      <p>Italian food culture is about sharing a meal with family. Meals are made with attention, care and pride, using only fresh, quality ingredients. We have taken that tradition, along with our experience in the industry, to create a place where friends and family can shop for the freshest pasta and Italian imported goods.</p>
      <p>At La Pastaiola we are an authentic <em>pastificio</em>, making fresh pasta from scratch in our kitchen with premium ingredients and traditional Italian recipes. Our bronze extruding dies give the pasta a rough, porous texture that absorbs the sauce when you finish the dish.</p>
      <p>In the shop you'll find fresh pasta, sauces made in-house and carefully selected artisanal products made in Italy. We also create custom Italian menus for catering.</p>
    </div>
  </div>
</div></section>
<section class="section band-light"><div class="wrap">${contactBlock}<p class="center"><a class="pill" href="/collections/all/">See what's available</a></p></div></section>`
});

const classProduct = prod("fresh-pasta-making-class");
add("/pages/book-master-class-1/", {
  title: "Pasta-making classes", description: "Hands-on fresh pasta classes in Basalt, Colorado. Groups of up to 6, 2–3 hours, all ingredients and tools provided.", image: "/img/pasta-room.jpg",
  body: `<section class="hero hero-sm" style="--img:url('/img/pasta-room.jpg')"><div class="hero-inner"><h1>Discover the ultimate pasta-making experience</h1></div></section>
<section class="section"><div class="wrap narrow">
  <p class="lead">Dive into the art of authentic pasta making. Our hands-on classes take you through the heart of Italian cuisine, where you'll learn to make exquisite pasta from scratch.</p>
  <div class="order-box">
    <p><strong>${esc(classProduct?.title || "Fresh Pasta Making Class")}</strong> · ${classProduct ? priceLabel(classProduct) : "$150.00"} per person · about 2–3 hours · up to 6 guests</p>
    <div class="actions"><a class="pill" href="${mailto("Pasta class booking", "Hello La Pastaiola,\n\nI would like to book a pasta-making class.\nPreferred date(s):\nNumber of guests (and ages of any children):\nDietary requirements:\nName:\nPhone:\n")}">Request a class</a><a class="pill pill-outline" href="tel:${BIZ.tel}">Call ${BIZ.phone}</a></div>
  </div>
  <div class="rte">
    <h3>Why choose us</h3>
    <ul>
      <li><strong>Authentic Italian expertise.</strong> Learn techniques passed down through generations.</li>
      <li><strong>Hands-on learning.</strong> Every step, from kneading and rolling to shaping and cooking.</li>
      <li><strong>Fresh, high-quality ingredients.</strong> All ingredients and tools are provided.</li>
      <li><strong>Fun and friendly.</strong> Welcoming for complete beginners and experienced cooks alike.</li>
    </ul>
    <h3>Class details</h3>
    <ul>
      <li>Classes last 2 to 3 hours and start with Italian finger foods. Refreshments are served throughout.</li>
      <li>Please bring your own reusable containers to take your pasta home.</li>
      <li>Each class is limited to 6 attendees, and everyone needs their own paid spot.</li>
      <li>Private classes at your home are available at an additional cost.</li>
      <li>We can accommodate dietary requirements; tell us when you book.</li>
    </ul>
    <h3>Class options</h3>
    <ul>
      <li><strong>Introduction to pasta making:</strong> dough basics, traditional shapes and classic sauces.</li>
      <li><strong>Advanced pasta techniques:</strong> intricate shapes and new recipes.</li>
      <li><strong>Custom private classes:</strong> for special occasions and group events.</li>
    </ul>
  </div>
  <div class="split split-tight">
    <img src="/img/kids-class.jpg" alt="Children making pasta in the class room" loading="lazy">
    <div><h2>Kids' pasta fun</h2><p>Our pasta room is a great place for children to discover cooking. Children under 6 join for free; kids aged 6 to 14 get a discounted rate. Email <a href="mailto:${BIZ.email}">${BIZ.email}</a> for details.</p></div>
  </div>
</div></section>`
});
redirect("/pages/book-master-class/", "/pages/book-master-class-1/");

add("/pages/caterings-1/", {
  title: "Catering", description: "Boutique Italian catering from La Pastaiola: handcrafted pasta, sauces and traditional dishes for your event.", image: "/img/marco.jpg",
  body: `<section class="section"><div class="wrap split">
  <img src="/img/marco.jpg" alt="Chef Marco preparing food" loading="lazy">
  <div>
    <h1 class="page-title">Book your next event</h1>
    <p class="lead">Looking to cater your next event? We'd love to bring you the best of Italy's traditional dishes, made with passion and care.</p>
    <p>We use imported Italian goods and love to support local farmers and growers. We'll take you through the regions of Italy in a couple of hours. Guaranteed!</p>
  </div>
</div></section>
<section class="section band-light"><div class="wrap narrow"><h2>Request a quote</h2>${requestForm("Catering request")}</div></section>`
});
redirect("/pages/caterings/", "/pages/caterings-1/");

add("/pages/meal-kits/", {
  title: "Meal kits", description: "Pre-packaged three-course Italian meal kits for gatherings and parties.",
  body: `<section class="section"><div class="wrap narrow">
  <h1 class="page-title">Meal kits</h1>
  <p class="lead">Planning a gathering with family and friends, or need an easy party solution? We prepare pre-packaged three-course meal kits made for your event.</p>
  <p>Each kit includes an appetizer or salad, your choice of pasta, meat or seafood, and a dessert. If you have something specific in mind, get in touch and we'll make it happen.</p>
  <h2>Request a meal kit</h2>
  ${requestForm("Meal kit request")}
</div></section>`
});

add("/pages/mediterranean-delights/", {
  title: "Mediterranean Delights", description: "Premium Italian olive oils, aged balsamic vinegar and Mediterranean pantry items.",
  body: `<section class="section"><div class="wrap">
  <h1 class="page-title">Mediterranean Delights</h1>
  <div class="rte lead">${col("mediterranean-delights").descriptionHtml}</div>
  ${grid(col("mediterranean-delights").products.map(prod).filter(Boolean))}
</div></section>`
});
redirect("/blogs/news/", "/");
redirect("/blogs/", "/");

// ---------- 404, robots, sitemap, CNAME ----------
writeFileSync(join(OUT, "404.html"), layout({ title: "Page not found", path: "/404.html",
  body: `<section class="section"><div class="wrap narrow center"><h1 class="page-title">Page not found</h1><p class="lead">This page may have moved when our website was updated.</p><div class="actions center"><a class="pill" href="/">Home</a><a class="pill pill-outline" href="/collections/all/">Shop</a></div></div></section>` }));
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `  <url><loc>${SITE_URL}${p}</loc></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(OUT, "CNAME"), "lapastaiola.co\n");
writeFileSync(join(OUT, ".nojekyll"), "");
console.log(`built ${pages.length} pages into ${OUT}`);
