# Owner Setup & Handoff Checklist

Companion to `tech-spec-ecwid-replacement.md`. Tracks the real values the owner (Henrike)
supplies and the accounts to set up. The build agent reads this to know what's ready, what's
stubbed, and what it can configure itself (via the Cloudflare MCP).

**Never commit secrets.** API keys, the service-account key, and bank account numbers are set
as `wrangler` secrets at build time — names only live in the repo. Business identity below is
public (it goes on the legal pages), so it is safe to keep here.

---

## ✅ Provided (ready to use)

### Business identity (public — for ECTA/POPIA legal pages + invoices)
- **Trading name:** Foreverlikethemoon (not a registered company — sole trader; present as
  "Foreverlikethemoon, operated by Henrike Nel")
- **Physical address:** Villa Italia, Century City, 7441, Cape Town, South Africa
- **Contact:** foreverlikethemoon@gmail.com · 072 035 2440

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

### Resend (email) — IN PROGRESS
Owner has created an account and generated an API key. Remaining:
1. Copy the API key → store safely → provide as `RESEND_API_KEY` secret. (Shown once.)
2. Domains → Add Domain → `foreverlikethemoon.com`.
3. Add the SPF / DKIM / return-path MX / DMARC records Resend shows, at the domain's DNS host.
4. Click Verify; wait for "Verified".
- **DNS host TBD** — confirm whether foreverlikethemoon.com DNS is on Cloudflare (agent can add
  records via MCP) or another registrar (owner adds them).

### Google Sheet + service account (order records, D2) — TODO
1. console.cloud.google.com → create/select a project.
2. Enable **Google Sheets API**.
3. Create a **service account** → create a **JSON key** (download).
4. Create a blank Google Sheet (owned by foreverlikethemoon@gmail.com).
5. Share the Sheet with the service-account email (Editor).
6. Provide to the agent: the JSON key (as secrets `GOOGLE_SA_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`)
   and the Sheet ID from its URL (`SHEET_ID`).

### Cloudflare account scope — TODO (confirm)
Confirm on dash.cloudflare.com:
- foreverlikethemoon.com zone is on this account (or note where DNS lives).
- **Workers, Pages, R2, Turnstile, Access** enabled (R2 needs a one-time activation; free < 10 GB).
- Authorize the Cloudflare MCP (`/mcp`) so the agent can create Pages/Workers/R2/Turnstile/Access
  and deploy to a preview.

### Turnstile — the agent creates this (needs Cloudflare access)
- Create a Turnstile widget → `TURNSTILE_SITE_KEY` (public, in the form) + `TURNSTILE_SECRET_KEY`
  (secret, in the Worker).

---

## 🕓 Deferred (not blocking the build; needed before live cutover)

- **Ecwid export** — product copy, images, customer list, order history, testimonial screenshots.
  *(Ecwid is currently down; owner will export later. Do BEFORE cancelling Ecwid.)*
- **Refund policy content** — owner's stance on digital (already-accessed) vs physical refunds;
  attorney review recommended. Agent drafts the page from owner's plain-English input.
- **Go-live cutover (owner actions):** point the live domain at Cloudflare Pages, final live test
  order, then cancel Ecwid. The agent prepares everything up to this point on a preview URL.

---

## Secrets checklist (names only — set via `wrangler secret`)

| Secret | Status |
|---|---|
| `RESEND_API_KEY` | ⏳ owner generating |
| `OWNER_EMAIL` | ✅ foreverlikethemoon@gmail.com |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | ⏳ agent to create |
| `GOOGLE_SA_EMAIL` / `GOOGLE_SA_PRIVATE_KEY` / `SHEET_ID` | ⏳ owner to create |
| `BANK_*` (5 fields) | ✅ owner holds; set at build |
| `R2_*` binding | ⏳ agent to create (Phase 3) |
| `PAYSHAP_ID` | ❓ owner — optional; SnapScan + EFT already cover payment |
