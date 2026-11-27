# La Pastaiola website

Static, multilingual (English / Italian / Spanish) website for La Pastaiola, Basalt, Colorado, live at **https://lapastaiola.co**, with a bilingual (English / Russian) admin panel at **https://lapastaiola.co/admin/**.

Rebuilt from the archived Shopify store (Wayback Machine, 2024-12 to 2026-08) after the Shopify store was closed. Cost: $0 (GitHub Pages, free HTTPS). No server, database or paid form service.

## How it works

```
content/*.json  ──┐
static/ (css, js, images, admin) ──┤  node tools/build.mjs  →  dist/  →  GitHub Pages
                                    │  (runs in GitHub Actions on every push to main)
admin panel ──(GitHub API, commits to content/ and static/img/p/)──┘
```

- **English** lives at the site root and keeps the old Shopify URLs (`/products/<handle>/`, `/collections/<handle>/`, `/pages/<handle>/`). **Italian** and **Spanish** are under `/it/` and `/es/`. A globe button in the header switches language and keeps the current page. Empty translations fall back to English.
- **Ordering**: online checkout is replaced by "Order by email" / "Call" buttons; catering and meal-kit forms open the visitor's email app pre-filled to `info@lapastaiola.co`.

## Layout

| Path | What |
|---|---|
| `content/settings.json` | Business info, opening hours, announcement bar, site languages |
| `content/catalog.json` | Products (title, description, price, options, photo, hidden) and collections (order, shown on Shop page) |
| `content/pages.json` | Texts of every page |
| `content/strings.json` | Buttons, menu and small labels |
| `static/` | CSS, JS, photos (`static/img/p/` = product photos) and the admin panel (`static/admin/`) |
| `tools/build.mjs` | Generates every page in every language into `dist/` |
| `tools/check-links.mjs` | Fails if any internal link or image is missing |
| `tools/serve.mjs` | Local preview of `dist/`, `node tools/serve.mjs 8130` |
| `tools/extract.mjs`, `tools/fetch-images.mjs` | One-off tools used to recover the catalog and photos from the archive |
| `reference-data/` | Archive extract and the original machine translations, kept for reference |
| `.github/workflows/pages.yml` | Builds and deploys on push to `main` |

All tools use Node's standard library only (no `npm install`).

## Admin panel

- Open `https://lapastaiola.co/admin/`, choose the interface language with the globe (EN / RU), and sign in with a GitHub personal access token of an account that has **write access** to this repository (instructions are on the sign-in page).
- Sections: Overview (translation status, recent changes), Business info and hours, Products (add, edit, hide, delete, photos with automatic resize, options with prices), Collections (order of products), Page texts, Interface texts, Help.
- Every content form has EN / IT / ES tabs; the English original is shown under Italian and Spanish fields, with a "copy English text" shortcut.
- **Save and publish** commits the changed files in one commit (`Admin: update … (by <login>)`) and shows the build status until the site is live (about a minute). If someone else published content in the meantime, the save is refused instead of overwriting their work.
- Security: the page talks only to `api.github.com` (enforced by its Content-Security-Policy), loads no third-party scripts, is excluded from search engines, and keeps the token only in the browser.

**Giving someone access:** add their GitHub account as a collaborator with write access (repository Settings → Collaborators). Remove them there to revoke access.

## Edit without the admin

1. Edit `content/*.json` (or `static/`).
2. Optional local check: `node tools/build.mjs && node tools/check-links.mjs && node tools/serve.mjs 8130`.
3. Commit and push to `main`; GitHub Actions publishes it.

## Domains and DNS

See `../reference/godaddy/dns-plan.md` in the project folder. `lapastaiola.co` points to GitHub Pages (`A @` 185.199.108–111.153, `CNAME www` → `ismagulovne.github.io`); `lapastaiola.com` forwards (301) to `https://lapastaiola.co`. Rollback to Shopify: `A @` → 23.227.38.32, `CNAME www` → `@`.

## To confirm with the owner

- Address (355 Gold Rivers Court, Ste 2, Basalt, CO 81621) and hours (Mon–Sat 10 am–7 pm, Sunday closed) were set by the owner in Nov 2026. Still to confirm with the client: prices, and whether catering and meal kits are still offered.
- Italian and Spanish texts were machine-assisted; a native speaker should review them. Open questions about product texts are listed in `reference-data/content-issues.md`.
