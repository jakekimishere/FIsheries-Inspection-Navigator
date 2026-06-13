# GitHub Pages setup for FIN

## Correct URL

| What | URL |
|------|-----|
| **Live app** | https://jakekimishere.github.io/Fin-Fisheries/ |
| **Source code** | https://github.com/jakekimishere/Fin-Fisheries |

The app does **not** run on the github.com repo page. You must use the **github.io** link.

## Repository visibility vs Pages

| Repo visibility | GitHub Free (personal) | GitHub Pro |
|-----------------|----------------------|------------|
| **Public** | Pages works | Pages works |
| **Private** | Pages **disabled** (site 404) | Pages works |

If you made the repo private to hide source code, the public **github.io** site will stop working until you:

1. Make the repo **public** again (simplest), or
2. Upgrade to **GitHub Pro** (~$4/mo) for private repo + public Pages, or
3. Use a **two-repo deploy**: private source repo + public deploy-only repo (see below).

## One-time GitHub settings (public repo or Pro)

### Option A — GitHub Actions (recommended)

1. **Pages**: Settings → Pages → Build and deployment:
   - **Source:** GitHub Actions
2. Push to `main` — workflow `.github/workflows/deploy-pages.yml` deploys automatically.
3. Check **Actions** → **Deploy to GitHub Pages** → green checkmark.

### Option B — Deploy from branch

1. **Pages**: Settings → Pages → Build and deployment:
   - **Source:** Deploy from a branch
   - **Branch:** `gh-pages` / **/(root)**
2. The same workflow also syncs the `gh-pages` branch after each deploy.

### About link (optional)

Repo home → ⚙️ next to About → Website → paste the github.io URL.

## How deploy works

Every push to `main` runs the deploy workflow:

1. Uploads the full site as a Pages artifact and deploys via GitHub Actions.
2. Syncs the `gh-pages` branch (for branch-based Pages or backup).

Verify the live site picked up your build:

```bash
npm run pages:check
```

Compares `APP_CACHE_NAME` in `main` vs `origin/gh-pages`. If they differ, deploy did not finish or Pages is not serving the latest build.

## Troubleshooting

### 404 — “There isn’t a GitHub Pages site here”

- Repo is **private** on GitHub Free (see table above).
- Pages source not configured (see settings above).
- Wrong URL (must include `/Fin-Fisheries/`).

### Blank page with header but no species list

- DevTools → **Console** for red errors.
- **Application** → **Service Workers** → Unregister → hard refresh.
- Network tab: `species-data.js`, `app/main.js` should return **200**.

### Old version after update

- Hard refresh or Incognito.
- Cache version in `js/config/appBundle.js` (`fin-fisheries-v*`).
- Run `npm run pages:check` — if remote is behind, wait for Actions or fix deploy.

### Deploy workflow fails

- **Private repo on Free:** upgrade, make public, or use two-repo pattern.
- **Environment `github-pages`:** first Actions deploy may require approving the environment under Settings → Environments.

## Two-repo pattern (private source, public site)

Keep `Fin-Fisheries` private and create a public repo e.g. `Fin-Fisheries-site` with only the built static files.

In the private repo workflow, add to `peaceiris/actions-gh-pages`:

```yaml
external_repository: jakekimishere/Fin-Fisheries-site
```

Enable Pages on the **public** deploy repo (`gh-pages` branch or GitHub Actions).

## Local testing

```bash
npx --yes serve .
```

Open http://localhost:3000 (local does not use the `/Fin-Fisheries/` base path).
