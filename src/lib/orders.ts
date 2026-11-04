import { CONTACT } from "./site";
import { formatZAR } from "./format-zar";

/**
 * The single order-submission seam.
 *
 * Everything the checkout needs to know about "where an order goes" lives in
 * this module. Today the site is a static GitHub Pages build with no server on
 * its own origin, so an order is handed off through the customer's own
 * WhatsApp (primary) with a mailto fallback. In phase 07 the *body of
 * `submitOrder` alone* changes to a single POST to the order Worker — see the
 * note on that function. No other module composes an order, a currency string,
 * or a reference, so nothing else has to change at cutover.
 */

/** The nine South African provinces, for the physical delivery address. */
export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export type SaProvince = (typeof SA_PROVINCES)[number];

export type ProductKind = "digital" | "physical";

/** The minimum a submitted order needs to know about the product it is for. */
export interface OrderProduct {
  slug: string;
  title: string;
  priceCents: number;
  kind: ProductKind;
}

/** A South African postal address. Only present on physical orders. */
export interface DeliveryAddress {
  line1: string;
  line2: string;
  suburb: string;
  city: string;
  province: SaProvince | "";
  postalCode: string;
}

export interface Order {
  /** Client-generated reference, FLTM-YYMM-XXXX. See `generateReference`. */
  reference: string;
  name: string;
  email: string;
  whatsapp: string;
  quantity: number;
  product: OrderProduct;
  /** null for digital products, which are emailed, not shipped. */
  address: DeliveryAddress | null;
}

/**
 * Unambiguous by construction: no O/0, I/1, or vowels that spell words. A
 * reference is read aloud over WhatsApp and typed back on a bank transfer, so
 * legibility beats entropy — 30^4 ≈ 810k is ample for a hand-run shop, and the
 * Worker is the authority on uniqueness once phase 07 lands.
 */
const REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateReference(now: Date = new Date()): string {
  const yy = String(now.getFullYear() % 100).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) {
    code += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
  }

  return `FLTM-${yy}${mm}-${code}`;
}

const REFERENCE_PATTERN = /^FLTM-\d{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;

/** Advisory only — the Worker is the real check. Guards what we display. */
export function isReferenceShaped(value: string): boolean {
  return REFERENCE_PATTERN.test(value);
}

/** Digits only, for a wa.me path. tel: and display strings never reach it. */
function businessWhatsAppNumber(): string {
  return CONTACT.phoneHref.replace(/\D/g, "");
}

/** The human-readable order, one fact per line. Used by both hand-off channels. */
export function orderSummaryLines(order: Order): string[] {
  const lines = [
    `Order ${order.reference}`,
    `${order.product.title} (${order.product.kind}) × ${String(order.quantity)}`,
    `Total ${formatZAR(order.product.priceCents * order.quantity)}`,
    `Name: ${order.name}`,
    `Email: ${order.email}`,
    `WhatsApp: ${order.whatsapp}`,
  ];

  if (order.address) {
    const { line1, line2, suburb, city, province, postalCode } = order.address;
    lines.push("Deliver to:");
    lines.push(line1);
    if (line2) {
      lines.push(line2);
    }
    lines.push([suburb, city].filter(Boolean).join(", "));
    lines.push([province, postalCode].filter(Boolean).join(" "));
  }

  return lines;
}

export function whatsappOrderUrl(order: Order): string {
  const text = encodeURIComponent(orderSummaryLines(order).join("\n"));
  return `https://wa.me/${businessWhatsAppNumber()}?text=${text}`;
}

export function mailtoOrderUrl(order: Order): string {
  const subject = encodeURIComponent(`Order ${order.reference}`);
  const body = encodeURIComponent(orderSummaryLines(order).join("\n"));
  return `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
}

/** Proof-of-payment hand-off from the confirmation page. Needs only the reference. */
export function proofOfPaymentUrl(reference: string): string {
  const text = encodeURIComponent(
    `Hi Foreverlikethemoon — proof of payment for order ${reference} attached.`,
  );
  return `https://wa.me/${businessWhatsAppNumber()}?text=${text}`;
}

/** Where the checkout sends the buyer once the order has been handed off. */
export function confirmationPath(reference: string): string {
  return `/order/confirmation?ref=${encodeURIComponent(reference)}`;
}

/**
 * PHASE 07 — THE ONE FUNCTION THAT CHANGES.
 *
 * Hand the order off. Resolves once it has been dispatched; rejects on
 * failure so the caller can keep the buyer on the form. Today that means
 * opening the customer's WhatsApp with the order pre-composed; the caller also
 * renders the same `whatsappOrderUrl` / `mailtoOrderUrl` as visible fallbacks,
 * so a blocked popup is not a dead end.
 *
 * At cutover this body becomes exactly:
 *
 *   const res = await fetch(ORDER_ENDPOINT, {
 *     method: "POST",
 *     headers: { "content-type": "application/json" },
 *     body: JSON.stringify(order),
 *   });
 *   if (!res.ok) throw new Error(`Order failed: ${res.status}`);
 *
 * and nothing outside this function is touched.
 */
export async function submitOrder(order: Order): Promise<void> {
  const opened = window.open(whatsappOrderUrl(order), "_blank", "noopener");
  // A blocked popup is not an error: the caller shows the same link to click.
  if (opened) {
    opened.opener = null;
  }
  await Promise.resolve();
}
