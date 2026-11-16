/**
 * The browser side of the order API (functions/api/[[path]].ts).
 *
 * The site never sends a price. It sends a product id and a quantity; the
 * server prices the order from its own catalogue and returns the reference.
 * Amounts the API returns are whole rands — `randsToCents` turns them into the
 * integer cents `formatZAR` expects.
 */

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

export interface ApiProduct {
  id: string;
  name: string;
  type: ProductKind;
  /** Rands. */
  price: number;
}

export interface ApiBusiness {
  legalName: string;
  status: string;
  address: string;
  contact: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  payshapId: string;
  snapscanUrl: string;
  whatsapp: string;
}

export interface ApiConfig {
  products: ApiProduct[];
  shippingFlatZar: number;
  turnstileSiteKey: string;
  business: ApiBusiness;
}

export interface OrderRequest {
  product_id: string;
  qty: number;
  customer_name: string;
  customer_email: string;
  delivery_address?: string;
  notes?: string;
  turnstile_token: string;
}

export interface OrderPlaced {
  reference: string;
  product_name: string;
  qty: number;
  unit_price: number;
  total: number;
  shipping: number;
  currency: "ZAR";
  record: "saved" | "failed";
}

export type OrderStatus = "pending" | "paid" | "delivered" | "cancelled";

export interface OrderSummary {
  reference: string;
  product_name: string;
  type: ProductKind;
  unit_price: number;
  qty: number;
  shipping: number;
  total: number;
  currency: "ZAR";
  status: OrderStatus;
}

export type ApiResult<T> =
  { ok: true; data: T } | { ok: false; status: number; error: string };

/** Server-issued references: FLTM-YYMM-NNN. */
const REFERENCE_PATTERN = /^FLTM-\d{4}-\d{3}$/;

export function isReference(value: string): boolean {
  return REFERENCE_PATTERN.test(value);
}

export const QTY_MIN = 1;
export const QTY_MAX = 99;
export const NAME_MAX = 200;
export const EMAIL_MAX = 200;
export const ADDRESS_MAX = 500;
export const NOTES_MAX = 1000;

/** Same shape the server checks; the server stays the authority. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function randsToCents(rands: number): number {
  return Math.round(rands * 100);
}

/** A business field is usable once it is set and not the setup placeholder. */
export function isFilled(value: string | undefined): value is string {
  const trimmed = value?.trim() ?? "";
  return trimmed !== "" && trimmed !== "__OWNER_TODO__";
}

export interface DeliveryAddress {
  line1: string;
  line2: string;
  suburb: string;
  city: string;
  province: SaProvince | "";
  postalCode: string;
}

/** One line per part, the way a courier label reads. */
export function formatAddress(address: DeliveryAddress): string {
  return [
    address.line1,
    address.line2,
    address.suburb,
    address.city,
    [address.province, address.postalCode].filter(Boolean).join(" "),
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");
}

export const WHATSAPP_MAX = 20;

export type WhatsAppResult =
  { ok: true; e164: string } | { ok: false; message: string };

/**
 * Accepts a South African number in local form (082 123 4567) or with the
 * country code (+27 82 123 4567, 27821234567), or any other country in
 * international form (+44 7700 900123). Spaces, dashes, dots and brackets are
 * ignored. Returns the number in E.164 so it opens straight in wa.me.
 */
export function parseWhatsApp(input: string): WhatsAppResult {
  const compact = input.trim().replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(compact)) {
    return {
      ok: false,
      message: "Use digits only, with an optional + at the start.",
    };
  }
  const international = compact.startsWith("+");
  const digits = compact.replace("+", "");
  if (!international && /^0[1-9]\d{8}$/.test(digits)) {
    return { ok: true, e164: `+27${digits.slice(1)}` };
  }
  // South African numbers are checked exactly, so +27 0… is caught here.
  if (digits.startsWith("27")) {
    if (/^27[1-9]\d{8}$/.test(digits)) return { ok: true, e164: `+${digits}` };
  } else if (international && /^[1-9]\d{7,14}$/.test(digits)) {
    return { ok: true, e164: `+${digits}` };
  }
  return {
    ok: false,
    message:
      "Enter a South African number like 082 123 4567, or an international number starting with +.",
  };
}

/** The API has no WhatsApp field, so the number travels at the top of notes. */
export function composeNotes(whatsapp: string, notes: string): string {
  const parts: string[] = [];
  if (whatsapp.trim()) parts.push(`WhatsApp: ${whatsapp.trim()}`);
  if (notes.trim()) parts.push(notes.trim());
  return parts.join("\n\n");
}

async function request<T>(
  input: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers: { accept: "application/json", ...init?.headers },
    });
  } catch {
    return {
      ok: false,
      status: 0,
      error: "We couldn't reach the shop. Check your connection and try again.",
    };
  }
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    const error =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Something went wrong. Please try again.";
    return { ok: false, status: response.status, error };
  }
  return { ok: true, data: body as T };
}

export function fetchConfig(): Promise<ApiResult<ApiConfig>> {
  return request<ApiConfig>("/api/config");
}

export function placeOrder(
  order: OrderRequest,
): Promise<ApiResult<OrderPlaced>> {
  return request<OrderPlaced>("/api/order", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(order),
  });
}

/** Public summary: no name, email or address. Never the Access-gated path. */
export function fetchSummary(
  reference: string,
): Promise<ApiResult<OrderSummary>> {
  return request<OrderSummary>(`/api/summary/${encodeURIComponent(reference)}`);
}

/** Only the reference goes in the URL. */
export function confirmationPath(reference: string): string {
  return `/order/confirmation?ref=${encodeURIComponent(reference)}`;
}

/**
 * If the Sheet write failed, the summary endpoint has nothing to return, so
 * the order page leaves its own copy in this tab's sessionStorage. It holds no
 * personal data — the same fields the public summary would show.
 */
const HANDOFF_PREFIX = "fltm-order:";

export function rememberPlaced(order: OrderPlaced): void {
  try {
    sessionStorage.setItem(
      `${HANDOFF_PREFIX}${order.reference}`,
      JSON.stringify({
        reference: order.reference,
        product_name: order.product_name,
        qty: order.qty,
        unit_price: order.unit_price,
        shipping: order.shipping,
        total: order.total,
      }),
    );
  } catch {
    // Storage blocked: the confirmation page falls back to the email copy.
  }
}

export type PlacedSnapshot = Pick<
  OrderPlaced,
  "reference" | "product_name" | "qty" | "unit_price" | "shipping" | "total"
>;

export function recallPlaced(reference: string): PlacedSnapshot | null {
  try {
    const raw = sessionStorage.getItem(`${HANDOFF_PREFIX}${reference}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlacedSnapshot>;
    if (
      parsed.reference !== reference ||
      typeof parsed.product_name !== "string" ||
      typeof parsed.qty !== "number" ||
      typeof parsed.unit_price !== "number" ||
      typeof parsed.shipping !== "number" ||
      typeof parsed.total !== "number"
    ) {
      return null;
    }
    return parsed as PlacedSnapshot;
  } catch {
    return null;
  }
}

/** wa.me wants digits only. */
export function whatsappUrl(number: string, text: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export function proofOfPaymentText(reference: string): string {
  return `Hi Foreverlikethemoon, here is my proof of payment for order ${reference}.`;
}
