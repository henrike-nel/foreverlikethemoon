# Tech Spec — Replacing Ecwid with a Self-Hosted Store

**Project:** foreverlikethemoon.com store migration
**Branch:** `feature/ecwid-replacement-store`
**Status:** Approved for build (Phases 1–3). Phase 4 outline only.
**Source plan:** "Leaving Ecwid" artifact, 8 Sep 2026.

This document is the implementation contract for coding agents. Each phase is independently shippable and lists concrete tasks with acceptance criteria. Do **not** re-make the decisions in §3 — they are settled. If a genuinely new architectural fork appears mid-build, stop and ask the owner a yes/no question rather than choosing.

---

## 1. Goal

Replace Ecwid (R560/mo shell with no SA payment method) with a store the business owns outright: static site + a small serverless backend, running at **R0/month** plus domain renewal, with card fees applied only per-order if/when Phase 4 is switched on.

Sell three products:

| Product | Type | Price (ZAR) |
|---|---|---|
| Digital Wedding Planner | digital | 300 |
| Wedding Planner | physical | 400 |
| Wedding Emergency Kit | physical | 450 |

Prices are fixed; there is no cart. Product pages + a single order form are sufficient.

## 2. Non-goals

- No cart / multi-item basket. One order = one product (quantity field allowed).
- No customer accounts or login for buyers.
- No DRM beyond expiring, download-capped links.
- No inventory management for physical goods in Phases 1–3 (manual).
- No automated courier-rate lookup. Shipping is a configurable flat fee (§3).

## 3. Settled decisions (do not revisit)

| # | Decision | Choice |
|---|---|---|
| D1 | Spec depth | Phases 1–3 full detail; Phase 4 outline only |
| D2 | Order records | **Google Sheet** via Sheets API (service account) |
| D3 | Card gateway (Phase 4) | **Gateway-agnostic** hosted-checkout + webhook interface |
| D4 | Shop page design | **Match existing Nicepage site style** |
| D5 | Delivery cost | **Flat shipping fee** added at checkout for physical items, shown on form + invoice |
| D6 | Admin security | **Cloudflare Access** (password) in front of admin page + mark-paid link |
| D7 | Bot protection | **Cloudflare Turnstile** on the order form, validated in the Worker |
| D8 | Host | Cloudflare Pages (site) + one Cloudflare Worker (backend) |
| D9 | Email | Resend, sending from the business domain |
| D10 | Digital file storage | Cloudflare R2, private, served via expiring signed links |

## 4. Architecture

```
Buyer ──> Cloudflare Pages (static HTML: existing site + product/order/confirm pages)
             │  order form POST (+ Turnstile token)
             ▼
         Cloudflare Worker  ── validates, verifies Turnstile, assigns reference
             │   ├─> Google Sheets API      (append order row, status=pending)
             │   ├─> Resend                 (invoice→customer, alert→owner)
             │   └─> R2 (Phase 3)           (private PDF; signed link on release)
             ▼
         Confirmation page (banking details, PayShap/SnapScan link, reference)

Owner ──> Cloudflare Access ──> /admin (order list) + "Mark paid & send" link
                                   │
                                   └─> Worker: set status=paid, issue signed R2 link, email it
```

**Data flow, happy path (Phases 1–3):**
1. Buyer fills order form, Turnstile solves invisibly, submits.
2. Worker verifies Turnstile, validates payload, computes total (price × qty + flat shipping for physical), assigns reference, appends Sheet row (`pending`), emails invoice + owner alert.
3. Buyer pays by EFT/PayShap/SnapScan using the reference.
4. Owner opens `/admin`, confirms the EFT landed, clicks **Mark paid & send**.
5. Worker sets row to `paid`; for digital products it issues a 7-day / 3-download signed R2 link and emails it.

## 5. Repository layout

The site is plain static HTML (Nicepage export). Keep that intact; add the store alongside.

```
/                         existing static site (index.html, Home.html, css/, js/, images/)
/shop/                    NEW product + order pages (static)
  digital-wedding-planner.html
  wedding-planner.html
  wedding-emergency-kit.html
  order.html              the single order form
  confirmation.html       post-submit payment instructions (reads reference from query/state)
/legal/                   NEW compliance pages (§11)
  terms.html
  refund-policy.html
  privacy.html
/worker/                  NEW Cloudflare Worker (backend)
  src/index.ts
  src/orders.ts           sheet append/read, reference generation
  src/email.ts            Resend calls + templates
  src/turnstile.ts        token verification
  src/r2.ts               signed-link issuance (Phase 3)
  wrangler.toml
/admin/                   NEW owner pages (behind Cloudflare Access)
  index.html              order list
/docs/
  tech-spec-ecwid-replacement.md   (this file)
```

Agents: confirm the actual framework/tooling already present before scaffolding (`package.json`, existing build). The site is hand-coded/Nicepage with no build step today; the Worker introduces the first Node tooling. Keep the Worker self-contained so the static site needs no build.

## 6. Data model

### 6.1 Order reference
Format: `FLTM-YYMM-NNN` (e.g. `FLTM-2609-014`). `NNN` is a zero-padded monotonic counter per month. The counter source of truth is the Sheet row count for the current month; the Worker must assign references atomically enough to avoid collisions at this volume (single-writer Worker; on collision, retry with next number).

### 6.2 Google Sheet columns (one row per order)
`reference | created_at (ISO) | status | product_id | product_name | type | unit_price | qty | shipping | total | currency | customer_name | customer_email | delivery_address | notes | paid_at | delivered_at | download_count`

- `status` ∈ `pending | paid | delivered | cancelled`.
- `currency` = `ZAR`.
- `delivery_address` empty for digital-only orders.
- `download_count` incremented when a signed link is issued/used (Phase 3; best-effort).

### 6.3 Config / product catalogue
A single source of truth for prices, types and the flat shipping fee, editable without touching HTML. Store as `/worker/src/catalogue.ts` (imported by the Worker) **and** mirror the display prices into the static product pages. Flag in the spec: if drift becomes a problem, Phase 4 add-on moves copy+prices into one file the site reads at build — out of scope for 1–3.

```ts
// catalogue.ts (authoritative for server-side validation)
export const SHIPPING_FLAT_ZAR = /* owner to confirm amount */ 0;
export const PRODUCTS = {
  "digital-wedding-planner": { name: "Digital Wedding Planner", type: "digital",  price: 300 },
  "wedding-planner":         { name: "Wedding Planner",         type: "physical", price: 400 },
  "wedding-emergency-kit":   { name: "Wedding Emergency Kit",   type: "physical", price: 450 },
} as const;
```
The Worker must **never** trust a price sent from the client; it looks up price/type from `catalogue.ts` by `product_id` and computes the total server-side.

## 7. Environment & secrets

Set via `wrangler secret` / Cloudflare dashboard; never commit. Agents scaffold `.dev.vars.example` and `wrangler.toml` with names only.

| Secret / var | Purpose |
|---|---|
| `RESEND_API_KEY` | send email |
| `TURNSTILE_SECRET_KEY` | verify form token |
| `GOOGLE_SA_EMAIL` | Sheets service-account email |
| `GOOGLE_SA_PRIVATE_KEY` | Sheets service-account key |
| `SHEET_ID` | target Google Sheet |
| `R2_*` (Phase 3) | bucket binding / signing |
| `OWNER_EMAIL` | where order alerts go |
| `BUSINESS_*` | legal name, address, banking details, PayShap ShapID, SnapScan link — for invoices/confirmation |

Owner-supplied operational inputs still outstanding are tracked in §13.

## 8. Shared conventions

- **Language/runtime:** TypeScript on Cloudflare Workers. Keep dependencies minimal.
- **Validation:** reject on missing/invalid fields with a 400 and a clear JSON error the form surfaces inline. Validate email format, required fields, qty ≥ 1, and that `delivery_address` is present for physical products.
- **Idempotency:** the mark-paid action must be safe to click twice (second click does not re-charge/re-email a second download link for an already-delivered order; surface "already sent").
- **Email:** all mail from Resend on the business domain. SPF/DKIM/DMARC configured before any send (§11). Never attach the PDF — always a signed link.
- **No PII in URLs/query strings.** Reference is fine; names/emails are not.
- **Errors:** Worker logs to Cloudflare; owner-facing failures (e.g. Sheet append failed) still return the buyer a success page but queue an owner alert flagged "order received, record failed" so no sale is lost.

---

## 9. Phase 1 — Selling again, by hand (4–6h, R0/mo)

**Outcome:** store live on the business's own domain with the manual payment flow; Ecwid can be cancelled.

### Tasks
1. **Product pages** (`/shop/*.html`) — three pages in the existing Nicepage visual style (D4): image, description, price (incl. a note that physical prices add the flat shipping fee), and a "Order" button linking to the order form with the product preselected.
2. **Order form** (`/shop/order.html`) — fields: product (preselectable), qty, name, email, and delivery address (shown/required only for physical products). Include the Turnstile widget. Static page; posts to the Worker endpoint (Phase 2 wires the backend — for Phase 1 ship-fast, the form may `mailto:`/formless fallback **only if** Phase 2 is not landing same-day; prefer wiring the Worker).
3. **Confirmation page** (`/shop/confirmation.html`) — shows the reference, total incl. shipping, business banking details, a **PayShap link**, a **SnapScan link** (if a merchant profile exists — else omit), and a **WhatsApp** button for proof-of-payment.
4. **Deploy** — Cloudflare Pages project on the repo; point `foreverlikethemoon.com` at it; verify SSL.
5. **Cut over** — after a successful test order (§12) and the Ecwid export (§11), cancel Ecwid.

### Acceptance criteria
- [ ] All three products reachable from the live site in the existing style.
- [ ] A buyer can submit an order and reach a confirmation page showing a correct reference and total (price × qty + flat shipping for physical).
- [ ] Banking details + PayShap link render correctly on mobile.
- [ ] Site served on the real domain with valid SSL.
- [ ] Ecwid data exported and account cancelled.

## 10. Phase 2 — Orders that report themselves (10–14h, R0/mo)

**Outcome:** replaces what Ecwid was actually used for — order notifications and customer invoices.

### Tasks
1. **Worker endpoint** `POST /api/order` — verify Turnstile token (D7); validate payload (§8); look up product in `catalogue.ts`; compute total; assign reference (§6.1).
2. **Record** — append a `pending` row to the Google Sheet (D2) via service account.
3. **Customer invoice email** (Resend) — itemised: product, qty, unit price, shipping, total, currency; business legal details; banking details + PayShap/SnapScan; the reference; link to refund/privacy pages.
4. **Owner alert email** — everything needed to reconcile: reference, customer, product, total, delivery address, timestamp.
5. **Turnstile** fully wired client+server.
6. **Resilience** — on Sheet failure, still succeed the buyer and send the owner a "record failed" alert (§8).

### Acceptance criteria
- [ ] Submitting the form creates exactly one Sheet row with correct computed total and `status=pending`.
- [ ] Customer receives a correct, itemised invoice; owner receives an alert; both from the business domain and landing in inbox (not spam).
- [ ] Turnstile rejects a submission with a missing/invalid token (verified test).
- [ ] Server recomputes price from catalogue and ignores any client-sent price (verified by tampering test).
- [ ] Duplicate rapid submits don't produce duplicate references.

## 11. Phase 3 — One-click digital delivery (8–12h, R0/mo)

**Outcome:** owner still confirms EFT, but confirming is one click instead of finding the file and writing an email.

### Tasks
1. **Store PDF in R2** (D10) — private bucket, no public access.
2. **Admin order list** (`/admin`, behind Cloudflare Access, D6) — table of orders with status, reference, customer, total, and a **Mark paid & send** action per pending order.
3. **Mark-paid endpoint** (Worker, behind Access) — sets `status=paid`, `paid_at`; for digital products issues a signed R2 link valid **7 days / 3 downloads** and emails it to the customer; sets `status=delivered`, `delivered_at`. Idempotent (§8).
4. **Download gate** — signed link enforces expiry; download cap tracked best-effort (`download_count`).
5. For physical products, **Mark paid** simply flips status (fulfilment is manual) and emails a "payment received, shipping soon" confirmation.

### Acceptance criteria
- [ ] `/admin` is unreachable without Cloudflare Access auth.
- [ ] Clicking Mark paid on a digital order emails a working download link that expires after 7 days and stops after 3 downloads.
- [ ] Clicking Mark paid twice does not send a second link / does not error.
- [ ] The PDF is never a public URL and never emailed as an attachment.
- [ ] Physical orders get a payment-received email and status update.

## 12. Phase 4 — Real card checkout (OUTLINE ONLY, optional, 12–20h)

Build only once Phases 1–3 are earning. **Gateway-agnostic** (D3): define a thin internal interface so Paystack or Yoco (or Ozow/Peach) drops in without touching order logic.

Outline:
- Define `PaymentGateway` interface: `createCheckout(order) -> {redirectUrl, gatewayRef}` and `verifyWebhook(req) -> {gatewayRef, status, amount}`.
- Hosted checkout: buyer pays on the gateway; on return, land on confirmation.
- **Webhook endpoint** verifies signature, matches `gatewayRef`→order, confirms amount == total, sets `paid`, and auto-releases the digital download (reusing Phase 3 logic) with no owner action.
- Keep EFT/PayShap alongside as the zero-fee path.
- Merchant onboarding (FICA docs) is the slow part — flag it as a lead-time, not a coding task.

Acceptance (when built): webhook is signature-verified, amount-checked, idempotent, and releases downloads automatically; EFT path still works.

## 13. Compliance & pre-launch checklist

Must be done before announcing / before first real send.

- [ ] **ECTA s43 disclosures** — `/legal/terms.html`: full legal name & status, physical address, contact details, full price incl. delivery. Link from footer.
- [ ] **Digital-goods refund policy** — `/legal/refund-policy.html`: 7-day cooling-off with the digital-goods-already-accessed carve-out stated explicitly. (Owner: 20 min with an attorney recommended.)
- [ ] **POPIA privacy notice** — `/legal/privacy.html`: what's collected (name, email, delivery address), why, retention, contact. Keep the Sheet access-controlled.
- [ ] **Email deliverability** — SPF, DKIM, DMARC on the domain when Resend is added. Non-negotiable; the top failure mode for home-built stores.
- [ ] **Export Ecwid data first** — products, images, customer list, order history, and screenshots of testimonials — **before** cancelling.
- [ ] **End-to-end test order** — buy from yourself with a real email; then one friend on a phone over mobile data.

## 14. Email templates (Resend)

Three templates, plain and on-brand:
1. **Order invoice** (customer) — itemised, business + banking details, reference, legal links.
2. **Order alert** (owner) — reconciliation details.
3. **Download delivery / payment received** (customer) — signed link (digital) or "shipping soon" (physical).

Keep them text-first HTML for deliverability. No PDF attachments.

## 15. Testing plan

- **Unit:** reference generation, total computation (digital vs physical + shipping), catalogue lookup, Turnstile verify (mock), idempotent mark-paid.
- **Integration:** form→Worker→Sheet append; Worker→Resend (test key); mark-paid→R2 signed link issuance + expiry.
- **Manual E2E:** the §13 test order, including spam-folder check and mobile.
- **Security checks:** client price tampering ignored; `/admin` blocked without Access; signed link dead after expiry/cap; no PII in URLs.

## 16. Rollout / cutover sequence

1. Build + deploy to a Pages preview URL (not the live domain yet).
2. Configure Resend + SPF/DKIM/DMARC; verify a test send inboxes.
3. Run the full E2E test order on the preview.
4. Export Ecwid data (§13).
5. Point `foreverlikethemoon.com` at Pages; verify SSL + a live test order.
6. Cancel Ecwid.

## 17. Owner inputs still required (blocking specific tasks, not the spec)

Track these; several are just config values:
- Bank account details + **PayShap ShapID** (Phase 1 confirmation + invoices).
- **SnapScan** merchant profile? (include link in Phase 1 or omit.)
- Business **legal name, status, physical address, contact** (ECTA/invoices).
- **Flat shipping fee** amount (D5 / `catalogue.ts`).
- Google account to own the orders **Sheet**.
- The **planner PDF** file for R2 (Phase 3).
- Ecwid **export** (copy + testimonials).

## 18. Risks (from the plan)

- You become support desk for your own bugs → keep it small; manual EFT stays as the always-works fallback.
- Manual reconciliation doesn't scale past ~15 orders/mo → rising volume is the trigger for Phase 4.
- Download links get shared → expiring + capped links deter casual sharing; don't build DRM.
- Free tiers change / a service vanishes → every component is swappable (Resend↔Brevo, Cloudflare↔Netlify, R2↔any S3). You own the HTML, so none is a migration project.
- Losing Ecwid's drag-and-drop editing → real loss; the single-file prices/copy add-on mitigates; a light CMS (Decap) later if needed.

---

*Decisions D1–D10 and the §3 table were approved by the owner on this branch. Phase ordering is the owner-approved priority — do not reorder.*
