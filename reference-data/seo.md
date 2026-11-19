# SEO setup — lapastaiola.co (2026-11-19)

## Done

**On the website (every page, EN / IT / ES)**
- Titles: product pages add their category ("Bucatini · String Pastas · La Pastaiola"); collection pages add "Fresh Pasta in Basalt, CO".
- Descriptions: product and collection snippets start with the name and the local context (made fresh in Basalt, Colorado; order by phone or email), then the product text, cut at about 155 characters on a word boundary.
- Structured data (schema.org JSON-LD):
  - Business: `Store` + `FoodEstablishment` with address, phone, email, opening hours by day, Italian cuisine, price range, service area (Basalt, Aspen, Carbondale, Glenwood Springs, Snowmass Village, Roaring Fork Valley), map link, Instagram and Facebook.
  - `WebSite` on each home page.
  - `Product` on every product, with `Offer`, or `AggregateOffer` for products with options (for example ravioli $25–28). Availability is `InStoreOnly`, because online checkout is paused.
  - `BreadcrumbList` on shop, collection and product pages.
- Languages: `hreflang` links on every page and in the sitemap (en, it, es, x-default), plus `og:locale` with alternates.
- Sharing: Open Graph and `twitter:card` with a large image; `og:type=product` on products.
- Indexing: `robots.txt` allows everything except `/admin/`; the 404 page and redirect pages are `noindex`; the old Shopify URLs still work.
- Speed: the hero image is preloaded on the home and classes pages; other images load lazily.
- Images: descriptive `alt` text on home page tiles and cards.

**Google Search Console** (property `https://lapastaiola.co/`, owner account)
- Ownership verified with the HTML file `google0a5f954fc0ccb57a.html`. Keep this file on the site.
- `sitemap.xml` submitted: status Success, 177 pages found.
- Indexing requested for `/`, `/it/` and `/es/`. Google already had them in the index from the Shopify site.

## Next steps (owner)

1. **Google Business Profile.** This matters most for a local shop. Claim or update the listing at business.google.com: new address 355 Gold Rivers Court, Ste 2, Basalt, CO 81621, hours, phone, website `https://lapastaiola.co`, categories "Pasta shop" and "Italian grocery store", photos, and the pasta classes as a service.
2. **Same name, address and phone everywhere:** Facebook, Instagram bio, Yelp, Apple Maps (Business Connect), Bing Places, TripAdvisor. The old addresses (72 Sunset Dr, 81623) should be replaced.
3. **Reviews:** ask happy customers and class guests for Google reviews. A short link to the review form, from the Business Profile, can go on a card at the counter.
4. **Bing Webmaster Tools:** sign in and import the site from Google Search Console (one click). This also covers DuckDuckGo and Yahoo.
5. **Local links:** Basalt and Roaring Fork Valley chambers of commerce, farmers' market pages, local food blogs and partner restaurants (wholesale customers) linking to `lapastaiola.co`.
6. **Content:** seasonal posts or pages (holiday ravioli, class dates, recipes). Fresh, local text helps the site rank for "fresh pasta Aspen" and "pasta class Basalt".
7. **Fix source texts** listed in `content-issues.md`. The admin panel → Products.

## Later (developer)

- Compress the photos (about 8 MB total; the largest is around 370 KB) and serve WebP in the GitHub Actions build.
- Add a `Course` or `Event` schema for the pasta classes once fixed class dates are published.
- Check Search Console in 1–2 weeks: Pages (indexing), Enhancements (Products, Breadcrumbs) and Core Web Vitals.
