# Handoff: lapastaiola-site (server session)

Last update: 2026-11-27.

## State
- Live at https://lapastaiola.co (GitHub Pages, deploy on push to `main`), admin at /admin/.
- 2026-11-27: fixed opening hours missing on all pages since 2026-11-24 (broken time regex in `tools/build.mjs`); crash test (empty/invalid/edge times) and gentle prod stress test (200 req, 5 parallel, all 200, p95 0.39 s) passed.
- Re-running an old failed deploy run fails with "No artifacts named github-pages" — push a new commit or use workflow_dispatch instead of "Re-run".

## Waiting for the client (via the owner)
See `reference-data/content-issues.md`: balsamic aging years (6 yr / 8 yr texts), Peranzana "Provence", Panettone "2024", mushroom tapenade duplicate, pasta ingredients wording, Sicilia oil "From Apulia" ending; prices; catering and meal kits still offered; native review of IT/ES.

## Optional next step (needs owner OK: DNS)
Move hosting to Cloudflare Pages for long cache and Brotli (GitHub Pages cache is fixed 10 min).
