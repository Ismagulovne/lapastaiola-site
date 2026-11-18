# La Pastaiola website (static)

Free replacement for the closed Shopify store at `lapastaiola.co`. Rebuilt from the archived Shopify pages (Wayback Machine, 2024-12 to 2026-08) and the store's own photos from the Shopify CDN.

- **Cost:** $0. Hosted on GitHub Pages (free HTTPS). No server, database or paid form service.
- **Ordering:** online checkout is replaced by "Order by email" / "Call" buttons; catering and meal-kit forms open the visitor's email app pre-filled to `info@lapastaiola.co`.
- **URLs:** the old Shopify paths still work (`/products/<handle>/`, `/collections/<handle>/`, `/pages/<handle>/`); retired pages redirect.

## Layout

| Path | What |
|---|---|
| `data/catalog.json` | 44 products and 8 collections extracted from the archive |
| `site/` | The published website (generated pages + `assets/` + `img/`) |
| `tools/extract.mjs` | Archive HTML → `data/catalog.json` |
| `tools/fetch-images.mjs` | Downloads the store's photos into `site/img/` |
| `tools/build.mjs` | Generates every page into `site/` (texts, hours, contacts are at the top) |
| `tools/check-links.mjs` | Fails if any internal link or image is missing |
| `tools/serve.mjs` | Local preview, `node tools/serve.mjs 8130` |
| `.github/workflows/pages.yml` | Deploys `site/` to GitHub Pages on push to `main` |

All tools use Node's standard library only (no `npm install`).

## Update content

1. Edit texts, hours or contacts in `tools/build.mjs` (object `BIZ` and the page sections), or products in `data/catalog.json`.
2. `node tools/build.mjs && node tools/check-links.mjs`
3. Commit and push; GitHub Actions publishes it.

## Go live (owner approval required for each step)

1. **GitHub:** create a public repository with the contents of this folder, push to `main`. Settings → Pages → Source: *GitHub Actions*. Settings → Pages → Custom domain: `lapastaiola.co` (the `site/CNAME` file sets it too).
2. **GoDaddy DNS for lapastaiola.co** (do not touch MX, TXT, autodiscover, msoid, SIP/Lync records):
   - Remove the applied **Shopify** template (it locks `A @` and `CNAME www`), or edit those two records.
   - `A @` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (four records, replacing `23.227.38.32`).
   - `CNAME www` → `<github-user>.github.io`.
3. Wait for DNS (minutes to an hour), then GitHub → Settings → Pages → tick **Enforce HTTPS**.
4. **lapastaiola.com** already forwards (301) to `http://lapastaiola.co`; change the destination to `https://lapastaiola.co`.
5. Verify: `https://lapastaiola.co`, `https://www.lapastaiola.co`, an old product URL, and that email to `info@lapastaiola.co` still arrives.

**Rollback:** set `A @` back to `23.227.38.32` and `CNAME www` back to `@` (the Shopify values).

## Before going live, confirm with the owner

- The shop is still open at **72 Sunset Dr, Unit B, Basalt** with hours **Tue–Fri 11 am–6 pm** (the newest archived page; an older one listed 355 Gold Rivers Court and 7-day hours).
- Prices are as of the last archived snapshot.
- Phone `+1 (970) 975-0858` and `info@lapastaiola.co` are current.
- Classes, catering and meal kits are still offered.
