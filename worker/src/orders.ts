import { productById, quote, type ProductId } from "./catalogue";

export type OrderStatus = "pending" | "paid" | "delivered" | "cancelled";

export interface OrderRow {
  reference: string;
  created_at: string;
  status: OrderStatus;
  product_id: ProductId;
  product_name: string;
  type: "digital" | "physical";
  unit_price: number;
  qty: number;
  shipping: number;
  total: number;
  currency: "ZAR";
  customer_name: string;
  customer_email: string;
  delivery_address: string;
  notes: string;
  paid_at: string;
  delivered_at: string;
  download_count: number;
}

export const ORDER_COLUMNS = [
  "reference",
  "created_at",
  "status",
  "product_id",
  "product_name",
  "type",
  "unit_price",
  "qty",
  "shipping",
  "total",
  "currency",
  "customer_name",
  "customer_email",
  "delivery_address",
  "notes",
  "paid_at",
  "delivered_at",
  "download_count",
] as const;

export interface OrderStore {
  listReferences(): Promise<string[]>;
  append(row: OrderRow): Promise<void>;
  findByReference(reference: string): Promise<OrderRow | null>;
  update(row: OrderRow, previousReference?: string): Promise<void>;
}

export function johannesburgYearMonth(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg",
    year: "2-digit",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value ?? "00";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  return `${year}${month}`;
}

export function referencePrefix(now: Date): string {
  return `FLTM-${johannesburgYearMonth(now)}-`;
}

export function nextReference(existing: string[], now: Date): string {
  const prefix = referencePrefix(now);
  let max = 0;
  for (const ref of existing) {
    if (!ref.startsWith(prefix)) continue;
    const n = Number(ref.slice(prefix.length));
    if (Number.isInteger(n) && n > max) max = n;
  }
  return prefix + String(max + 1).padStart(3, "0");
}

export function reassignIfCollided(written: string, allRefs: string[], now: Date): string {
  if (allRefs.filter((ref) => ref === written).length <= 1) return written;
  const withoutCopies = allRefs.filter((ref) => ref !== written);
  return nextReference([...withoutCopies, written], now);
}

export function rowToValues(row: OrderRow): string[] {
  return ORDER_COLUMNS.map((column) => String(row[column] ?? ""));
}

export function valuesToRow(values: string[]): OrderRow | null {
  if (values[0] === "reference" || !values[0]?.startsWith("FLTM-")) return null;
  const product = productById(values[3] ?? "");
  if (!product) return null;
  return {
    reference: values[0],
    created_at: values[1] ?? "",
    status: (values[2] as OrderStatus) || "pending",
    product_id: values[3] as ProductId,
    product_name: values[4] || product.name,
    type: product.type,
    unit_price: Number(values[6] ?? product.price),
    qty: Number(values[7] ?? 1),
    shipping: Number(values[8] ?? 0),
    total: Number(values[9] ?? 0),
    currency: "ZAR",
    customer_name: values[11] ?? "",
    customer_email: values[12] ?? "",
    delivery_address: values[13] ?? "",
    notes: values[14] ?? "",
    paid_at: values[15] ?? "",
    delivered_at: values[16] ?? "",
    download_count: Number(values[17] ?? 0),
  };
}

export function publicSummary(row: OrderRow) {
  return {
    reference: row.reference,
    product_name: row.product_name,
    type: row.type,
    unit_price: row.unit_price,
    qty: row.qty,
    shipping: row.shipping,
    total: row.total,
    currency: row.currency,
    status: row.status,
  };
}

export class UnconfiguredStore implements OrderStore {
  async listReferences(): Promise<string[]> {
    throw new Error("Sheet is not configured");
  }

  async append(): Promise<void> {
    throw new Error("Sheet is not configured");
  }

  async findByReference(): Promise<OrderRow | null> {
    throw new Error("Sheet is not configured");
  }

  async update(): Promise<void> {
    throw new Error("Sheet is not configured");
  }
}

export class MemoryStore implements OrderStore {
  rows: OrderRow[] = [];

  async listReferences(): Promise<string[]> {
    return this.rows.map((row) => row.reference);
  }

  async append(row: OrderRow): Promise<void> {
    this.rows.push({ ...row });
  }

  async findByReference(reference: string): Promise<OrderRow | null> {
    for (let i = this.rows.length - 1; i >= 0; i -= 1) {
      if (this.rows[i].reference === reference) return { ...this.rows[i] };
    }
    return null;
  }

  async update(row: OrderRow, previousReference = row.reference): Promise<void> {
    for (let i = this.rows.length - 1; i >= 0; i -= 1) {
      if (this.rows[i].reference === previousReference) {
        this.rows[i] = { ...row };
        return;
      }
    }
    throw new Error("Order not found");
  }
}

let tail: Promise<void> = Promise.resolve();

export function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(fn, fn);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function saveWithUniqueReference(
  store: OrderStore,
  draft: OrderRow,
  now: () => Date,
): Promise<OrderRow> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await store.listReferences();
    const reference = nextReference(existing, now());
    const row = { ...draft, reference };
    await store.append(row);
    const after = await store.listReferences();
    if (after.filter((ref) => ref === reference).length === 1) return row;
    const fixed = reassignIfCollided(reference, after, now());
    const repaired = { ...row, reference: fixed };
    await store.update(repaired, reference);
    const check = await store.listReferences();
    if (check.filter((ref) => ref === fixed).length === 1) return repaired;
  }
  throw new Error("Could not assign a unique reference");
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidOrder {
  productId: ProductId;
  name: string;
  email: string;
  address: string;
  notes: string;
  token: string;
  qty: number;
  unitPrice: number;
  shipping: number;
  total: number;
  currency: "ZAR";
  type: "digital" | "physical";
  productName: string;
}

export function validateOrder(
  input: unknown,
  shippingFlat: number,
): { ok: true; value: ValidOrder } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Enter the order details" };
  const body = input as Record<string, unknown>;
  const productId = String(body.product_id ?? "").trim();
  const qty = typeof body.qty === "number" ? body.qty : Number(body.qty);
  if (!productById(productId)) return { ok: false, error: "Choose a product" };
  const priced = quote(productId, qty, shippingFlat);
  if (!priced) return { ok: false, error: "Enter a quantity from 1 to 99" };
  const name = String(body.customer_name ?? "").trim();
  const email = String(body.customer_email ?? "").trim();
  const address = String(body.delivery_address ?? "").trim();
  const notes = String(body.notes ?? "").trim();
  const token = String(body.turnstile_token ?? "").trim();
  if (!name || name.length > 200) return { ok: false, error: "Enter your name" };
  if (!EMAIL.test(email) || email.length > 200) return { ok: false, error: "Enter a valid email address" };
  if (priced.type === "physical" && !address) return { ok: false, error: "Enter a delivery address" };
  if (address.length > 500) return { ok: false, error: "Enter a shorter delivery address" };
  if (notes.length > 1000) return { ok: false, error: "Notes are too long" };
  if (!token) return { ok: false, error: "Turnstile check failed" };
  return {
    ok: true,
    value: {
      productId: priced.productId,
      name,
      email,
      address: priced.type === "physical" ? address : "",
      notes,
      token,
      qty: priced.qty,
      unitPrice: priced.unitPrice,
      shipping: priced.shipping,
      total: priced.total,
      currency: priced.currency,
      type: priced.type,
      productName: priced.name,
    },
  };
}

export function draftFromValid(value: ValidOrder, now: Date): OrderRow {
  return {
    reference: "",
    created_at: now.toISOString(),
    status: "pending",
    product_id: value.productId,
    product_name: value.productName,
    type: value.type,
    unit_price: value.unitPrice,
    qty: value.qty,
    shipping: value.shipping,
    total: value.total,
    currency: "ZAR",
    customer_name: value.name,
    customer_email: value.email,
    delivery_address: value.address,
    notes: value.notes,
    paid_at: "",
    delivered_at: "",
    download_count: 0,
  };
}
