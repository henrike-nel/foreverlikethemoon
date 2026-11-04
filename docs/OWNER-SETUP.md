# Owner Setup & Handoff Checklist

Companion to `tech-spec-ecwid-replacement.md`. Tracks the real values the owner (Henrike)
supplies and the accounts to set up. The build agent reads this to know what's ready, what's
stubbed, and what it can configure itself (via the Cloudflare MCP).

> **v2 (integration):** the store is built **into the Astro `feature/rebrand` site**, not the old
> HTML. Frontend = the existing Astro store/order/legal pages; backend = the **tested Worker ported
> from `cursor/ecwid-replacement-store-c8da`**. Hosting = **Cloudflare Pages** + Worker (retire the
> GitHub Pages pipeline). **Prices = R300 / R400 / R450** (update the product content, which is
> currently stale at R495 for the digital planner). See the spec's §0 and §3–§6.

**Never commit secrets.** API keys, the service-account key, and bank account numbers are set
as `wrangler` secrets at build time — names only live in the repo. Business identity below is
public (it goes on the legal pages), so it is safe to keep here.

---

## ✅ Provided (ready to use)

### Business identity (public — for ECTA/POPIA legal pages + invoices)
- **Trading name:** Foreverlikethemoon (not a registered company — sole trader; present as
  "Foreverlikethemoon, operated by Henrike Nel")
- **Physical address:** Villa Italia, Century City, 7441, Cape Town, South Africa
- **Contact:** foreverlikethemoon@gmail.com · 072 035 1440

### Shipping
- **Flat R90.00 per physical order** (Aramex Store to Door). `SHIPPING_FLAT_ZAR = 90`.
  Digital-only orders: no shipping.

### SnapScan (merchant profile exists — include in Phase 1)
- Payment link: `https://pos.snapscan.io/qr/p2p/henrike-nel?act=pay&token=YDQBsV`

### Banking (EFT — shown to customers on confirmation page + invoice)
- Set as secrets at build time, NOT committed. Values held by owner:
  Capitec Bank · acct holder Henrike Nel · account no. (provided) · branch code 470010 · branch "Capitec Bank CPC".
- Secret names: `BANK_NAME`, `BANK_ACCOUNT_HOLDER`, `BANK_ACCOUNT_NUMBER`, `BANK_BRANCH_CODE`, `BANK_BRANCH_NAME`.

### Digital product file (for R2, Phase 3)
- `FLM Digital Wedding Planner.pdf` (~63 MB) — held by owner in iCloud:
  `~/Library/Mobile Documents/com~apple~CloudDocs/FLM/FLM Digital Wedding Planner.pdf`.
  Copy into a gitignored path or upload directly to R2 at Phase 3. Private bucket; never emailed
  as an attachment. (Large — fine under the 10 GB R2 free tier; consider compressing later.)

### Email approach (no mailbox purchase needed)
- **Sending** invoices from `orders@foreverlikethemoon.com` via Resend — no mailbox required,
  authenticated by DNS.
- **Order alerts** go to the existing inbox: foreverlikethemoon@gmail.com (`OWNER_EMAIL`).
- Replies: set `Reply-To: foreverlikethemoon@gmail.com`, or add free Cloudflare Email Routing
  (`orders@…` → gmail) if a real reply inbox is wanted.

---

## ⏳ In progress / owner action required

### Resend (email) — ✅ DONE
Account created; domain `foreverlikethemoon.com` added and **Verified**. API key held by owner;
set as `RESEND_API_KEY` secret at build. Send from `orders@foreverlikethemoon.com`.
- **DNS host: GoDaddy** (nameservers `*.domaincontrol.com`). Resend records added at GoDaddy.

### Google Sheet + service account (order records, D2) — ✅ DONE
Project created, Sheets API enabled, service account + JSON key created, blank Sheet created and
shared (Editor) with the service-account email. Tab named **Orders**, A–R headers from spec §6.2
in row 1 (verified). Owner holds `GOOGLE_SA_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`, `SHEET_ID` — set as
secrets at build. Never commit the JSON key.

### Cloudflare account — nearly done
- **R2 enabled** ✅ (account already has a `fltm-video` bucket). The agent creates a **separate
  private bucket** (e.g. `fltm-digital-products`) for the planner PDF — do NOT reuse the video bucket.
- Workers, Pages, Turnstile, Access available on the free plan ✅.
- **Cloudflare MCP authorized** ✅ (connected in WebStorm Claude Code). The agent can create
  Pages/Workers/the R2 bucket/Turnstile/Access, set secrets, deploy to a `*.pages.dev` preview,
  and manage the domain.

### DNS — ✅ moved to Cloudflare (zone Active)
`foreverlikethemoon.com` DNS now runs on Cloudflare; the zone is **Active**. Resend records
(`resend._domainkey`, `rsend`, `send`, `_dmarc`) carried over as **DNS-only**; web records
(`A` apex `52.73.226.108`, `A` www, site CNAMEs) are **Proxied** with Cloudflare SSL.
Post-switch checks: live site loads over HTTPS, Resend domain still **Verified**, and
SSL/TLS mode = **Full** (not Flexible, to avoid loops with the GitHub Pages origin).
**Go-live cutover (later, agent via MCP):** re-point the apex from GitHub Pages
(`52.73.226.108`) to the Cloudflare Pages project, then a final live test order. Until then the
agent builds/tests on a `*.pages.dev` preview.

### Turnstile — the agent creates this (needs Cloudflare access)
- Create a Turnstile widget → `TURNSTILE_SITE_KEY` (public, in the form) + `TURNSTILE_SECRET_KEY`
  (secret, in the Worker).

---

## 🕓 Deferred (not blocking the build; needed before live cutover)

- **Ecwid export** — product copy, images, customer list, order history, testimonial screenshots.
  *(Ecwid is currently down; owner will export later. Do BEFORE cancelling Ecwid.)*
- **Refund policy** — owner-approved draft at `docs/legal/refund-policy.md` (source for the Phase 1
  `/legal/refund-policy` page). Open flag for attorney: the physical section ("3 days, damaged/
  faulty only") reads narrower than ECTA's 7-day online cooling-off right; the "nothing limits your
  statutory rights" clause covers it, but confirm wording before launch.
- **Go-live cutover (owner actions):** point the live domain at Cloudflare Pages, final live test
  order, then cancel Ecwid. The agent prepares everything up to this point on a preview URL.

---

## Where the secrets live

**Never commit secrets or put them in a shared chat.** Hold them now in a password manager (one
entry per secret; attach the Google service-account JSON there too). Their runtime home is
**Cloudflare Worker secrets** — encrypted, injected at runtime — set with `wrangler secret put <NAME>`
(prompts; value not echoed) or in the dashboard under the Worker → Settings → Variables and Secrets.
For local dev the agent adds a gitignored `.dev.vars` (with a committed `.dev.vars.example` holding
names only). Public / non-secret values: `TURNSTILE_SITE_KEY` goes in the HTML form; `SHEET_ID` and
`OWNER_EMAIL` can be plain vars. To keep values out of chat logs, the owner sets them via
`wrangler secret put` after the agent scaffolds the Worker — the agent references names only.

## Secrets checklist (names only — set via `wrangler secret`)

| Secret | Status |
|---|---|
| `RESEND_API_KEY` | ✅ owner holds; domain verified; set at build |
| `OWNER_EMAIL` | ✅ foreverlikethemoon@gmail.com |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | ⏳ agent to create |
| `GOOGLE_SA_EMAIL` / `GOOGLE_SA_PRIVATE_KEY` / `SHEET_ID` | ✅ owner holds; set at build |
| `BANK_*` (5 fields) | ✅ owner holds; set at build |
| `R2_*` binding | ✅ R2 enabled; agent creates bucket + binding (Phase 3) |
| `PAYSHAP_ID` | ❓ owner — optional; SnapScan + EFT already cover payment |
