# FIN — Fisheries Inspection Navigator

**Personal project disclaimer:** Not affiliated with, endorsed by, or representative of the U.S. Coast Guard, NOAA, or any government agency. Always verify regulations with official NOAA sources.

Offline-capable web app for Northeast fisheries and Atlantic HMS compliance assessments. Data is sourced from public NOAA regulations (50 CFR Parts 648 and 635).

## Features

- Multi-species selection with search and favorites
- Date-aware assessments (`REGULATION_DATES_CONFIG.js`)
- Dynamic question flows for HMS species (e.g. Bluefin Tuna)
- Grouped steps for scallop, flounder, and multispecies groundfish
- Printable compliance report with CFR citations
- PWA offline support after first load

## Live app (GitHub Pages)

**This is the app URL (not the GitHub repo page):**

**https://jakekimishere.github.io/FIsheries-Inspection-Navigator/**

Bookmark that link. The repo at `github.com/jakekimishere/FIsheries-Inspection-Navigator` shows code — it does not run the app.

Repo name is **case-sensitive**: `FIsheries-Inspection-Navigator`.

### If you see a blank page, 404, or “site not loaded”

1. Use the **github.io** URL above — not the `github.com` repo page.
2. **Settings → Pages**: enable Pages if needed, then **Source** = Deploy from a branch → **Branch** = `gh-pages` → **/ (root)** → Save.
3. **Actions** tab: latest **Deploy to GitHub Pages** must be green (runs on every push to `main`).
4. Wait 2–5 minutes after a deploy, then open in **Incognito** or hard refresh (**Ctrl+Shift+R** / **Cmd+Shift+R**).
5. If still broken: DevTools → Application → Service Workers → **Unregister**, then reload (stale offline cache).
6. Repo must be **Public** (Settings → General → Danger Zone is not “Private”).

See `docs/GITHUB_PAGES.md` for full setup.

Local testing: open `index.html` directly or use any static file server.

## Install on mobile (PWA)

FIN is a **Progressive Web App** — install it like an app for offline use after one online visit.

**iPhone (Safari):** Open the live URL → **Share** (□↑) → **Add to Home Screen** → Add.

**Android (Chrome):** Open the URL → menu **⋮** → **Install app** or **Add to Home screen**.

**Offline:** Open FIN once while online so the service worker caches files. Later it works without signal (regulation data is bundled; NOAA RSS checks may fail offline — that is expected).

## Quick start

1. Open the live link above (or `index.html` locally).
2. Select **Northeast Regional Fisheries** → choose species → complete assessment → print report.

## Project layout

| Path | Purpose |
|------|---------|
| `species-data/` | Regulation data by fishery (**primary maintenance files**) |
| `js/config/regulationMeta.js` | `dataLastUpdated` and app version |
| `js/legacy/assessmentEngine.js` | Report generation, violations, grouped UI (being migrated) |
| `app/main.js` | Application entry point |
| `ARCHITECTURE.md` | System design and Bluefin flow map |
| `docs/REGULATION_UPDATES.md` | **Step-by-step regulation update workflow** |

## Updating regulations

When NOAA publishes changes:

1. Edit the relevant file under `species-data/` (and date/group configs if needed).
2. Set `REGULATION_META.dataLastUpdated` in `js/config/regulationMeta.js`.
3. Sync `regulation-updates.json`.
4. Follow the full checklist in **[docs/REGULATION_UPDATES.md](docs/REGULATION_UPDATES.md)**.

## Development

- Script load order is defined in `index.html` and mirrored in `js/config/appBundle.js`.
- After changing cached assets, bump `APP_CACHE_NAME` in `appBundle.js` for offline users.
- `automated-tests.js` runs smoke checks in the browser on load.

## Data sources

- [NOAA Greater Atlantic](https://www.greateratlantic.fisheries.noaa.gov/)
- [Atlantic HMS](https://www.fisheries.noaa.gov/topic/atlantic-highly-migratory-species)
- 50 CFR Part 648 (Northeast) · 50 CFR Part 635 (HMS)

See `DATA_VERIFICATION.md` for HMS sourcing detail.

## License

Personal / educational reference only.
