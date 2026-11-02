# Owner inputs still needed

Placeholders in the Worker config use `__OWNER_TODO__`. The order path still runs. Replace these before announcing the store or taking a real payment. Do not point `foreverlikethemoon.com` at the new site, and do not cancel Ecwid, until the cutover list at the bottom is done.

| Input | Where it goes | Current value |
|---|---|---|
| Flat shipping fee (ZAR) | `SHIPPING_FLAT_ZAR` | `0` |
| SnapScan merchant URL | `SNAPSCAN_URL` | omitted until set |
| Bank name, account name, account number, branch code | `BUSINESS_BANK_*` | `__OWNER_TODO__` |
| PayShap ShapID | `BUSINESS_PAYSHAP_ID` | `__OWNER_TODO__` |
| Legal name, status, physical address, contact | `BUSINESS_LEGAL_NAME`, `BUSINESS_STATUS`, `BUSINESS_ADDRESS`, `BUSINESS_CONTACT` | `__OWNER_TODO__` |
| WhatsApp number for proof of payment (digits, country code) | `BUSINESS_WHATSAPP` | empty, button still renders |
| Orders inbox | `OWNER_EMAIL` | `__OWNER_TODO__` |
| Google account that owns the orders Sheet | `GOOGLE_SA_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`, `SHEET_ID` | unset, orders still email the buyer and flag the owner that the record failed |
| Planner PDF | R2 object `digital-wedding-planner.pdf` in bucket `fltm-planner` | download link returns "not available yet" until the file is there |
| Resend API key and from-address on the business domain | secret `RESEND_API_KEY`, var `RESEND_FROM` | email send is skipped until the key is set |
| Turnstile site key and secret | var `TURNSTILE_SITE_KEY`, secret `TURNSTILE_SECRET_KEY` | preview uses Cloudflare's always-pass test site key; submissions are rejected until the secret is set |
| Download signing key | secret `DOWNLOAD_SIGNING_KEY` | digital "mark paid" refuses to send a link until this is set |
| Cloudflare Access team name and audience tag | `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` | `/admin` stays closed until both are set. Create Access applications for `/admin` and `/api/orders` only. Leave `/api/summary` public. A team value of `name.cloudflareaccess.com` is accepted. |
| Ecwid export (products, images, customers, orders, testimonial screenshots) | keep offline | not done |

Secrets are set with `wrangler secret put` from `worker/`. Names only are listed in `worker/.dev.vars.example`. The Google private key should be the PKCS8 PEM (`BEGIN PRIVATE KEY`) with newlines written as `\n`.

Attorney review of `legal/terms.html`, `legal/refund-policy.html`, and `legal/privacy.html` is still yours. The pages state the ECTA disclosures, the 7-day cooling-off, the digital-download carve-out, and the POPIA notice, using the placeholders above.

## Cutover (do not do this from the build)

1. Deploy stays on a Pages/Workers preview URL.
2. Put the real secrets and the PDF in place. Add SPF, DKIM, and DMARC for Resend.
3. Place a test order to a real inbox, including a phone on mobile data, and check spam.
4. Export Ecwid.
5. Point `foreverlikethemoon.com` at the new host and confirm SSL plus one live test order.
6. Cancel Ecwid.
