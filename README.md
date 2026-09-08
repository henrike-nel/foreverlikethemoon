# Foreverlikethemoon

Static Astro site. Until phase 04, it publishes to
[new.foreverlikethemoon.com](https://new.foreverlikethemoon.com). The apex
[foreverlikethemoon.com](https://foreverlikethemoon.com) still serves the live Ecwid
store. The homepage is intentionally unstyled.

The stack is pinned — see [`DECISIONS.md`](DECISIONS.md) for the locked versions and why.
Pin every dependency exactly; no floating ranges.

## Local development

Use the Node version in `.nvmrc` (`nvm use`).

```sh
npm install
npm run dev
```

| Command                | Purpose                            |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Dev server                         |
| `npm run build`        | Production build to `dist/`        |
| `npm run preview`      | Serve the production build locally |
| `npm run check`        | `astro check` (TypeScript)         |
| `npm run lint`         | ESLint                             |
| `npm run format:check` | Prettier check                     |
| `npm run format`       | Prettier write                     |

## Deploy

The site is a static Astro build published to GitHub Pages.

- Pushes to `main` (and manual `workflow_dispatch`) run `.github/workflows/deploy.yml`.
- That workflow builds with `withastro/action@v6` and publishes with `actions/deploy-pages@v5`.
- `astro.config.mjs` sets `site` to `https://new.foreverlikethemoon.com` and does **not** set `base`. A path like `/new` would prefix every internal link; a subdomain does not.
- The custom domain is **Settings → Pages**, not `public/CNAME`. GitHub ignores a CNAME file on an Actions deploy.
- `public/robots.txt` disallows all crawlers. `Seo.astro` emits `noindex` whenever `site` is not the apex, so this half-built host cannot compete with the live shop.
- Pull requests run `.github/workflows/ci.yml` only: `astro check`, ESLint, and `prettier --check`. CI never deploys.

Cutover steps (swap staging for the apex once the new store can take an order) are commented at the top of `astro.config.mjs`.

## Worker

The `worker/` directory is a placeholder for a Cloudflare Worker. It is deployed separately by Wrangler and is not part of the Pages build.
