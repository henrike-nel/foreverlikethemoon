import type { Business } from "./catalogue";
import type { OrderRow } from "./orders";

export interface OutboundEmail {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}

export interface Mailer {
  send(email: OutboundEmail): Promise<void>;
}

function money(amount: number): string {
  return `R${amount}`;
}

function linesToHtml(lines: string[]): string {
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function paymentBlock(business: Business, origin: string): string[] {
  const lines = [
    `Account name: ${business.accountName}`,
    `Bank: ${business.bankName}`,
    `Account number: ${business.accountNumber}`,
    `Branch code: ${business.branchCode}`,
    `PayShap: ${business.payshapId} (https://www.payshap.co.za/)`,
  ];
  if (business.snapscanUrl) lines.push(`SnapScan: ${business.snapscanUrl}`);
  lines.push(`Refunds: ${origin}/legal/refund-policy.html`);
  lines.push(`Privacy: ${origin}/legal/privacy.html`);
  lines.push(`${business.legalName}, ${business.status}`);
  lines.push(business.address);
  lines.push(business.contact);
  return lines;
}

export function invoiceEmail(row: OrderRow, business: Business, origin: string): OutboundEmail {
  const lines = [
    `Order ${row.reference}`,
    `${row.product_name} × ${row.qty}`,
    `Unit price: ${money(row.unit_price)}`,
    `Shipping: ${money(row.shipping)}`,
    `Total: ${money(row.total)} ${row.currency}`,
    "Pay by EFT or PayShap using the reference as the payment reference.",
    ...paymentBlock(business, origin),
  ];
  return {
    to: row.customer_email,
    from: business.fromEmail,
    subject: `Order ${row.reference}`,
    text: lines.join("\n"),
    html: linesToHtml(lines),
  };
}

export function ownerAlertEmail(
  row: OrderRow,
  business: Business,
  record: "saved" | "failed",
): OutboundEmail {
  const lines = [
    record === "failed" ? "order received, record failed" : "New order",
    `Reference: ${row.reference}`,
    `When: ${row.created_at}`,
    `Customer: ${row.customer_name} <${row.customer_email}>`,
    `Product: ${row.product_name} (${row.product_id})`,
    `Qty: ${row.qty}`,
    `Total: ${money(row.total)} ${row.currency}`,
    `Delivery: ${row.delivery_address || "-"}`,
    `Notes: ${row.notes || "-"}`,
  ];
  return {
    to: business.ownerEmail,
    from: business.fromEmail,
    subject: record === "failed" ? `Record failed ${row.reference}` : `New order ${row.reference}`,
    text: lines.join("\n"),
    html: linesToHtml(lines),
  };
}

export function downloadEmail(row: OrderRow, link: string, business: Business, origin: string): OutboundEmail {
  const lines = [
    `Payment received for ${row.reference}.`,
    "Your digital wedding planner download is ready.",
    "The link works for 7 days and 3 downloads.",
    link,
    `Refunds: ${origin}/legal/refund-policy.html`,
    `Privacy: ${origin}/legal/privacy.html`,
  ];
  return {
    to: row.customer_email,
    from: business.fromEmail,
    subject: `Your download ${row.reference}`,
    text: lines.join("\n"),
    html: linesToHtml(lines),
  };
}

export function shippingEmail(row: OrderRow, business: Business, origin: string): OutboundEmail {
  const lines = [
    `Payment received for ${row.reference}.`,
    `${row.product_name} will be shipped soon.`,
    `Total paid: ${money(row.total)} ${row.currency}`,
    `Delivery: ${row.delivery_address}`,
    `Refunds: ${origin}/legal/refund-policy.html`,
  ];
  return {
    to: row.customer_email,
    from: business.fromEmail,
    subject: `Payment received ${row.reference}`,
    text: lines.join("\n"),
    html: linesToHtml(lines),
  };
}

export function resendMailer(apiKey: string | undefined, fetchImpl: typeof fetch = fetch): Mailer {
  return {
    async send(email) {
      if (!apiKey || apiKey === "__OWNER_TODO__") {
        throw new Error("Email is not configured");
      }
      const response = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: email.from,
          to: [email.to],
          subject: email.subject,
          text: email.text,
          html: email.html,
        }),
      });
      if (!response.ok) {
        throw new Error(`Resend failed (${response.status})`);
      }
    },
  };
}
