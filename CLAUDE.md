# Foreverlikethemoon

Wedding stationery, wedding websites and planners. Cape Town.
Owner: Henrike Basson — software engineer, so speak to me as a peer. No hand-holding, and do
flag trade-offs rather than smoothing them over.

Read `DESIGN.md` before writing anything that renders. It is the locked design system.

## Architecture

- Static **Astro 7** site, deployed to **GitHub Pages** by GitHub Actions.
- The order / email / delivery API is a **separate Cloudflare Worker** in `worker/`, deployed
  by wrangler. It is not part of the Pages build.
- The site NEVER holds a secret. Anything secret is a Worker secret, set via
  `wrangler secret put`, never in `wrangler.toml` and never in this repo.

### Domains — we are in staging

`foreverlikethemoon.com` still serves the **live Ecwid store** and must keep earning until
phase 04 can take an order. So:

- This build publishes to **`new.foreverlikethemoon.com`**.
- `site` is the staging URL. **`base` stays unset** — a subdomain is a host, not a subpath,
  so internal links stay root-relative and nothing needs rewriting at cutover.
- On an Actions deploy GitHub **ignores `public/CNAME`**; the custom domain comes from repo
  Settings → Pages. The file is documentation only.
- `public/robots.txt` disallows everything, and the SEO component must emit `noindex`
  whenever `site` is not the apex. A crawlable half-built site would compete with the live
  shop for the brand's own search results.
- Cutover steps are commented at the top of `astro.config.mjs`. Do not perform them early.

## Non-negotiables

- **TypeScript strict.** No `any`, no `@ts-ignore`. If types fight you, fix the model.
- **Zero client JS on a route unless that route needs interaction.** Justify every island.
- **Tailwind 4 `@theme` tokens only.** No `tailwind.config.js`. No arbitrary values like
  `text-[13px]` in components — if you need a value, it becomes a token in `DESIGN.md` first.
- No component library. No shadcn, no DaisyUI. This identity is bespoke.
- Every colour comes from a semantic token defined for light AND dark. Never declare a colour
  whose only definition sits inside a media query or `[data-theme]` block.
- **One accent hue, two values.** `--color-accent` for anything readable or clickable;
  `--color-accent-decorative` is ornament only and fails AA for text. No third hue.
- Every animation goes through `src/lib/motion.ts` and no-ops under reduced motion.
- Accessible by construction: real landmarks, visible focus, labelled controls, keyboard
  operable everything, alt text that says what the image shows. Never colour alone.
- **No lorem ipsum, ever.** Real copy lives in `src/content/`. If copy is missing, ask me.

## Performance budget — enforced in CI from phase 07

- Lighthouse mobile: performance 95+, accessibility 100, best-practices 100, SEO 100
- Total JS on the home page: **under 30 kB gzipped**
- LCP image is `loading="eager" fetchpriority="high"`; everything else lazy
- CLS stays at 0

## Media

- **Images:** `src/assets/`, rendered through Astro `<Image>`. Never `public/`, which bypasses
  the pipeline. Masters are already resized to 2400px on the long edge.
- **Video: NEVER in this repo.** GitHub warns above 50 MB and rejects above 100 MB, and Pages
  bandwidth is a shared soft allowance. Video lives in a **public R2 bucket** on
  `video.foreverlikethemoon.com` and is referenced through `videoUrl()` in `src/lib/media.ts`.
- **Paid product files** (the planner PDF) live in a **separate private R2 bucket**, reachable
  only by the Worker. Never the same bucket as the portfolio video.
- `images/` (camera originals) and `media-out/` (encoded video awaiting upload) are gitignored
  and must stay that way.

## Data model notes

- Prices are **integer cents**. Never a float. `formatZAR()` is the only thing that renders a
  currency string.
- **Stock is a first-class field** from the start: `in-stock` / `out-of-stock` / `sold-out`.
  Two of three products are currently not available. An out-of-stock product still renders
  fully, with the buy control replaced by an honest sentence — never a dead button.
- Wedding-website case studies show real couples' names, dates and venues. The schema carries
  `consent: boolean` and `redactions: string[]`, and the build **fails** on a case study
  without consent rather than silently skipping it.

## Working style

- Small commits, conventional-commit messages, one concern each.
- Before a big change, tell me the plan in under 10 lines and wait.
- After each phase: run `astro check` and `npm run build`, and report what you did NOT do.
- If a requirement is ambiguous, ask one sharp question rather than guessing.
- If something in `DESIGN.md` seems wrong, say so before building on it. Do not quietly
  substitute your own value.

## Do not

- Do not add a dependency without saying why in the commit body.
- Do not install both Motion and GSAP. We use **Motion**.
- Do not commit a video. Not even a small one. Not even temporarily.
- Do not commit anything to `public/` that could go through the image pipeline.
- Do not set `base` in `astro.config.mjs`.
- Do not point anything at the apex domain until cutover.
