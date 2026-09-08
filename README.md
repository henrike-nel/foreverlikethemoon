# Foreverlikethemoon

Static Astro site for [foreverlikethemoon.com](https://foreverlikethemoon.com). The homepage is intentionally unstyled.

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
- `public/CNAME` sets the custom apex domain `foreverlikethemoon.com`. `astro.config.mjs` sets `site` to that URL and does **not** set `base`, because this is an apex domain, not a project subpath.
- Pull requests run `.github/workflows/ci.yml` only: `astro check`, ESLint, and `prettier --check`. CI never deploys.

## Worker

The `worker/` directory is a placeholder for a Cloudflare Worker. It is deployed separately by Wrangler and is not part of the Pages build.
