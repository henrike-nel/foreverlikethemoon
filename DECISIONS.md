# Locked decisions

The stack, pinned. These are not defaults to revisit per phase — they are decided.
Pin every one **exactly** in `package.json` (no `^`, no `~`). Floating ranges are how a
site that built fine in September stops building in November, and you do not want to debug
that the week before a wedding season.

_Versions current as at 8 September 2026._

| Piece       | Choice                | Version | Why this one                                                                            |
| ----------- | --------------------- | ------- | --------------------------------------------------------------------------------------- |
| Framework   | `astro`               | 7.3.1   | Ships zero JS by default; content collections give you typed product data               |
| Styling     | `tailwindcss`         | 4.3.3   | Via `@tailwindcss/vite`. CSS-first tokens in `@theme`, no JS config file                |
| Animation   | `motion`              | 13.2.0  | 2.3 kb mini build; `animate` / `scroll` / `inView` / `stagger` are all in the free tier |
| Deploy      | `withastro/action@v6` | —       | With `actions/deploy-pages@v5` and `actions/checkout@v7`                                |
| API runtime | `hono` on Workers     | 4.13.7  | Tiny, typed, first-class Workers support. 100k requests/day free                        |
| Worker CLI  | `wrangler`            | 4.129.1 | Local dev, secrets, KV and R2 bindings                                                  |
| Email       | `resend`              | 6.26.0  | 3,000/month and 100/day free, on your own domain                                        |
| Images      | `sharp`               | 0.35.4  | Build-time only — Astro's `<Image>` emits AVIF/WebP at fixed widths                     |

## Notes

- **GSAP vs Motion.** GSAP is also legitimate here — it became fully free including every
  plugin, and its ScrollTrigger is stronger than Motion's scroll API for elaborate pinned
  sequences. Motion is the better default for this site because it is an order of magnitude
  smaller and this is a shop, not a showreel. **Don't install both.**

## When each lands

`astro`, `tailwindcss` / `@tailwindcss/vite` are installed now (Phase 00–01). The rest are
pinned here ahead of the phase that installs them, so the version is decided before the
install, not at it:

- `motion` — Phase 01 (motion primitives) / Phase 06 (motion pass)
- `hono`, `wrangler` — Phase 08 (order API, the separate Cloudflare Worker in `worker/`)
- `resend` — Phase 08 (order email, on your own domain)
- `sharp` — build-time image pipeline, pulled in with Astro `<Image>`
