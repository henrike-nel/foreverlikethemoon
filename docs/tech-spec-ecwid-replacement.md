# Tech Spec — Replacing Ecwid (Astro Integration)

**Project:** foreverlikethemoon.com store migration
**Status:** Approved for build. **This is a v2 rewrite** — the plan is now to *integrate* a store
into the existing **Astro rebrand**, not build greenfield on the old HTML site.
**Implementation base:** the `feature/rebrand` branch (Astro).
**Source plan:** "Leaving Ecwid" artifact, 8 Sep 2026.

This document is the implementation contract for coding agents. Do **not** re-make the §3 decisions.
If a genuinely new architectural fork appears, stop and ask the owner a yes/no question.

---

## 0. What changed from v1 (read this first)

v1 assumed a hand-coded Nicepage HTML site with no build step, deployed to Cloudflare Pages,
with a backend built from scratch. That was wrong. Ground truth:

- **`feature/rebrand`** is a full **Astro 7 + Tailwind 4** site and already contains the
  **storefront frontend**: `src/pages/store/index.astro`, `store/[slug].astro`,
  `order/index.astro` (progressively-enhanced order form with a no-JS mailto fallback),
  `order/confirmation.astro`, legal pages (`refunds`, `privacy`, `terms`), a `ProductCard` /
  `StockBadge` component set, and products modelled as a content collection in
  `src/content/products/*.md` (with `price` in integer cents, `kind`, `stock`, `fileKey`, gallery).
  It currently deploys to **GitHub Pages** (staging `new.foreverlikethemoon.com`).
- **`cursor/ecwid-replacement-store-c8da`** (branched from PR #2) already **implemented the v1
  backend**: a complete, **tested** Cloudflare Worker — `worker/src/{index,orders,sheet,email,r2,
  turnstile,access,catalogue,payments,service}.ts` + a 534-line `worker/test/store.test.ts` +
  `wrangler.toml`. Its frontend is the old plain HTML and is **discarded**.

So this is a **reconciliation**: keep the Astro frontend, port the cursor branch's tested Worker as
its backend, host the whole thing on Cloudflare, and align prices.

## 1. Goal

Replace Ecwid with a store the business owns: the Astro site + a Cloudflare Worker backend, at
~R0/month plus domain, card fees only per-order if/when Phase 4 is enabled.

Products (owner-confirmed prices — these override the current content values):

| Product | content slug | Type | Price (ZAR) | cents |
|---|---|---|---|---|
| Digital Wedding Planner | `digital-wedding-planner` | digital | 300 | 30000 |
| Wedding Planner | `physical-wedding-planner` | physical | 400 | 40000 |
| Wedding Emergency Kit | `emergency-kit` | physical | 450 | 45000 |

**Action:** update `price` in each `src/content/products/*.md` to the cents above. The current
content has the digital planner at `49500` (R495) — that is stale; set it to `30000`.

## 2. Non-goals

- No cart. One order = one product (quantity allowed). (The Astro order form already works this way.)
- No buyer accounts.
- No DRM beyond expiring, download-capped R2 links.
- No automated courier rates — flat R90 shipping (Aramex Store to Door) on physical items.

## 3. Settled decisions (do not revisit)

| # | Decision | Choice |
|---|---|---|
| D1 | Implementation base | Integrate into the **Astro `feature/rebrand`** site |
| D2 | Frontend | **Reuse the existing Astro** store/order/confirmation/legal pages + product content |
| D3 | Backend | **Port the tested Worker from `cursor/ecwid-replacement-store-c8da`**; drop its HTML |
| D4 | Static site hosting | **Cloudflare Pages** (retire the GitHub Pages pipeline) |
| D5 | Backend host | Cloudflare **Pages Functions** (`functions/api/*`, same origin as the Astro site; no CORS) |
| D6 | Order records | **Google Sheet** via Sheets API (service account) |
| D7 | Card gateway (Phase 4) | **Gateway-agnostic** hosted-checkout + webhook interface |
| D8 | Prices | **R300 / R400 / R450** (update the Astro content to match) |
| D9 | Delivery cost | **Flat R90** on physical items, shown on form + invoice |
| D10 | Admin security | **Cloudflare Access** in front of admin + the mark-paid route |
| D11 | Bot protection | **Cloudflare Turnstile** on the order form |
| D12 | Email | Resend, from the business domain |
| D13 | Digital file storage | Cloudflare R2, private, expiring signed links |

## 4. Branch & base strategy

1. The agent works off **`feature/rebrand`** — cut an integration branch from it
   (e.g. `feature/store-backend`). Do **not** build on the old-HTML `feature/ecwid-replacement-store`
   branch (that was the v1 base; PR #2 now carries only these docs).
2. **Coordinate first:** `feature/rebrand` has uncommitted changes in the main checkout. The owner
   commits/settles those before (or the agent bases on the committed tip and the owner rebases).
3. **Port the Worker** from `cursor/ecwid-replacement-store-c8da`: bring `worker/` across, then
   review and adapt it to this spec (see §6). Keep its tests. Discard the cursor branch's
   `shop/*.html`, `legal/*.html`, `admin/index.html` — superseded by the Astro pages.

## 5. Architecture

```
Buyer ─> Astro site on Cloudflare Pages (store/, order/, confirmation/, legal/)
            │  order form POST (+ Turnstile token)   [no-JS fallback: mailto]
            ▼
        Cloudflare Pages Functions /api/* (ported from cursor Worker — same origin)
            │   ├─> Google Sheets API   (append order, status=pending)
            │   ├─> Resend              (invoice→customer, alert→owner)
            │   └─> R2                  (private PDF; signed link on release)
            ▼
        confirmation.astro (reference, total, banking + PayShap + SnapScan)

Owner ─> Cloudflare Access ─> admin (order list) + "Mark paid & send"
```

- **Static site:** Astro build output on **Cloudflare Pages**, custom domain
  `foreverlikethemoon.com`. Update `astro.config.mjs` `site` to the apex at cutover and retire the
  GitHub Pages `deploy.yml` (replace with a Cloudflare Pages deploy). Drop the staging `noindex`/
  `robots.txt` at cutover.
- **Backend:** **Cloudflare Pages Functions** (`functions/api/*`) on the **same Pages project/origin**
  as the Astro build — no CORS. Port the cursor Worker's modules (`orders`, `sheet`, `email`, `r2`,
  `turnstile`, `access`, `catalogue`, `payments`, `service`) into the Functions handler, keeping its
  vitest suite. **Remove the old asset-serving** (`[assets] directory=".."` / the `env.ASSETS`
  fallthrough in `index.ts`) — Pages serves the Astro build. Access guards `/admin` + `/api/orders`;
  the rest of the API stays public.
- **Catalogue / price authority:** the Astro content collection (`src/content/products/*.md`) is
  the display source of truth. The Worker must **independently** hold authoritative prices
  (`worker/src/catalogue.ts`) and recompute totals server-side — never trust a client-sent price.
  Keep the two in sync; the single source for the owner to edit is the content `.md` files, and the
  catalogue mirrors them (document this so they can't silently drift).

## 6. Reconciliation task list (the core of the build)

1. **Port the Worker** (`worker/`) from the cursor branch; get its test suite green under this repo.
2. **Align prices:** set `price` in the three product `.md` files to 30000 / 40000 / 45000, and make
   `worker/src/catalogue.ts` match (same slugs, types, cents, flat R90 shipping on physical).
3. **Wire the order form:** point `src/pages/order/index.astro`'s enhanced `submitOrder()` at the
   Worker endpoint; add the Turnstile widget + `TURNSTILE_SITE_KEY`; keep the mailto no-JS fallback.
4. **Confirmation:** ensure `order/confirmation.astro` shows the reference, total incl. R90 shipping,
   banking details, **PayShap**, the **SnapScan link**
   (`https://pos.snapscan.io/qr/p2p/henrike-nel?act=pay&token=YDQBsV`), and a WhatsApp button.
5. **Legal pages:** use the Astro `refunds.astro` / `privacy.astro` / `terms.astro`. Port the
   owner-approved refund copy from `docs/legal/refund-policy.md` into `refunds.astro`. Ensure the
   contact number is **072 035 1440** everywhere.
6. **Admin:** reimplement the cursor branch's admin as an Astro route or a Worker route, behind
   **Cloudflare Access** — order list + idempotent "Mark paid & send" (Phase 3).
7. **Digital delivery:** the content already references `fileKey: products/digital-wedding-planner.pdf`
   — upload the planner PDF to R2 under that key; the Worker issues 7-day / 3-download signed links.
8. **Hosting cutover:** Cloudflare Pages project for the Astro build; retire GitHub Pages; set the
   apex to Pages; drop staging `noindex`.

### 6a. Ported-Worker API contract (the integration surface)

The cursor Worker is sound and tested — port it; don't rewrite it. Its endpoints are the contract
the Astro frontend binds to (keep these paths under Pages Functions `/api/*`):

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/config` | public | catalogue + Turnstile site key + public business info |
| `POST /api/order` | Turnstile | place order → record (pending) → invoice + owner alert |
| `GET /api/summary/FLTM-…` | public | order summary for `confirmation.astro` |
| `GET /api/orders` | **Access** | admin order list |
| `POST /api/orders/FLTM-…/mark-paid` | **Access** | idempotent; digital → signed download link |
| `GET /api/download?token=…` | signed HMAC | streams the PDF; 7-day / 3-download cap |

### 6b. Divergences to fix while porting (from the cursor branch)

- **Drop site-serving:** remove `[assets] directory=".."`, `run_worker_first`, and the `env.ASSETS`
  fallthrough — Pages serves the Astro build now.
- **Shipping:** set `SHIPPING_FLAT_ZAR = 90` (default is `0`).
- **R2 key:** Worker uses `digital-wedding-planner.pdf` in bucket `fltm-planner`; Astro content says
  `products/digital-wedding-planner.pdf`. Align on one key and bucket; upload the PDF there.
- **Prices:** Worker catalogue is already R300/400/450 (correct) — update the **Astro content** to match.
- **Bank details:** set the account number as a dashboard var/secret, not a committed `wrangler.toml` var.
- **Frontend + legal:** discard the cursor branch's `shop/*.html`, `legal/*.html`, `admin/index.html`;
  wire the Astro order form to the contract above and port the legal/ECTA/POPIA copy into the Astro
  `refunds/privacy/terms.astro` (refund source: `docs/legal/refund-policy.md`).
- **Take only `worker/` + tests** from the cursor branch — it branched from old HTML, so do not merge it.

## 7. Phases (revised — frontend largely exists)

Each phase is independently shippable. Hours assume the owner drives and the agent writes code.

**Phase 1 — Store live, manual payment (now mostly wiring, 3–5h).**
Prices aligned; order form posts to the Worker; confirmation page complete with banking/PayShap/
SnapScan/WhatsApp; legal pages finalised; deploy the Astro build to a Cloudflare Pages **preview**.
*Acceptance:* a buyer can order on the preview and reach a correct confirmation (reference + total
incl. R90 for physical); legal pages linked from the footer.

**Phase 2 — Orders report themselves (Worker ported, 4–8h).**
Worker verifies Turnstile, validates, recomputes total from `catalogue.ts`, assigns a reference
(`FLTM-YYMM-NNN`), appends a `pending` Sheet row, emails an itemised invoice to the customer and an
alert to the owner. *Acceptance:* one Sheet row per order with correct total; both emails inbox
(not spam); client price tampering ignored; Turnstile rejects bad tokens; no duplicate references.

**Phase 3 — One-click digital delivery (6–10h).**
PDF in private R2; admin behind Cloudflare Access with an idempotent "Mark paid & send" that issues
a 7-day/3-download signed link for digital orders (physical → payment-received email + status).
*Acceptance:* admin blocked without Access; mark-paid emails a working, expiring link; double-click
safe; PDF never public or attached.

**Phase 4 — Real card checkout (OUTLINE ONLY, optional, 12–20h).**
Gateway-agnostic `PaymentGateway` interface (the cursor Worker already has a `payments.ts` stub to
build on); hosted checkout; signature-verified, amount-checked, idempotent webhook that auto-releases
the download; EFT/PayShap kept as the zero-fee path. Merchant onboarding (FICA) is the lead-time.

## 8. Order data model

Unchanged from the cursor Worker implementation; keep it. Reference `FLTM-YYMM-NNN`. Google Sheet
tab **Orders**, columns A–R:
`reference | created_at | status | product_id | product_name | type | unit_price | qty | shipping |
total | currency | customer_name | customer_email | delivery_address | notes | paid_at |
delivered_at | download_count`. `status ∈ pending|paid|delivered|cancelled`. Never put PII in URLs.

## 9. Environment & secrets

See `OWNER-SETUP.md` for status. Worker secrets (set via `wrangler secret put`, never committed):
`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `GOOGLE_SA_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`, `SHEET_ID`,
`R2_*` binding, `OWNER_EMAIL`, `BANK_*`. Public: `TURNSTILE_SITE_KEY` (in the Astro form). A
committed `worker/.dev.vars.example` holds names only (the cursor branch already has one — reuse it).

## 10. Compliance & pre-launch

- **ECTA s43 disclosures** in `terms.astro`: legal name/status (Foreverlikethemoon, sole trader,
  Henrike Nel), address (Villa Italia, Century City, 7441, Cape Town), contact, full price incl.
  delivery.
- **Refund policy** (`refunds.astro`, from `docs/legal/refund-policy.md`) — attorney flag: the
  physical section reads narrower than ECTA's 7-day online cooling-off; confirm wording.
- **POPIA** privacy notice (`privacy.astro`): what's collected, why, retention, contact; Sheet
  access-controlled.
- **Email deliverability:** Resend domain already **Verified** (DKIM + `rsend`/`send` CNAMEs on
  Cloudflare). Add DMARC (`_dmarc` present).
- **Export Ecwid data** before cancelling (deferred — Ecwid currently down).
- **End-to-end test order** on the preview, incl. spam check + mobile.

## 11. Testing

Keep the cursor Worker's `vitest` suite (reference generation, totals incl. shipping, catalogue
lookup, Turnstile verify, idempotent mark-paid). Add: Astro build passes `astro check`; the order
form posts and the Worker records a row; mark-paid issues a signed link that dies on expiry/cap.
Security: client price ignored; admin blocked without Access; no PII in URLs.

## 12. Rollout / cutover

1. Deploy the Astro build to a Cloudflare Pages **preview**; deploy the Worker to a `*.workers.dev`
   or staging route.
2. Resend verified ✅; confirm a test send inboxes.
3. Full E2E test order on the preview.
4. Export Ecwid data.
5. Point `foreverlikethemoon.com` at the Cloudflare Pages project (DNS already on Cloudflare); set
   `astro.config` `site` to the apex; drop staging `noindex`/`robots.txt`; map the Worker route.
6. Live test order, then cancel Ecwid.

## 13. Risks

- **Catalogue/content drift** (prices in two places) → document the sync; content `.md` is the
  owner-editable source, catalogue mirrors it.
- Manual EFT reconciliation doesn't scale past ~15 orders/mo → trigger for Phase 4.
- Download links shared → expiring + capped links; no DRM.
- Free tiers change → every component swappable (Resend↔Brevo, R2↔S3). You own the code.
- **Coordination with the live rebrand** → the agent must base on `feature/rebrand` and not clobber
  the owner's in-flight changes; commit/settle those first.

---

*§3 decisions D1–D13 were approved by the owner. v2 supersedes v1's greenfield/HTML/Cloudflare-Pages-
only assumptions.*
