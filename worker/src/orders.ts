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
  listOrders(): Promise<OrderRow[]>;
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

const STATUSES: readonly OrderStatus[] = ["pending", "paid", "delivered", "cancelled"];

export function orderStatus(raw: string | undefined): OrderStatus {
  const value = (raw ?? "").trim().toLowerCase();
  return (STATUSES as readonly string[]).includes(value) ? (value as OrderStatus) : "pending";
}

export function valuesToRow(values: string[]): OrderRow | null {
  if (values[0] === "reference" || !values[0]?.startsWith("FLTM-")) return null;
  const product = productById(values[3] ?? "");
  if (!product) return null;
  return {
    reference: values[0],
    created_at: values[1] ?? "",
    status: orderStatus(values[2]),
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

  async listOrders(): Promise<OrderRow[]> {
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

  async listOrders(): Promise<OrderRow[]> {
    return this.rows.map((row) => ({ ...row }));
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
    const index = rowIndex(this.rows, previousReference, row);
    if (index < 0) throw new Error("Order not found");
    this.rows[index] = { ...row };
  }
}

function sameWriter(existing: OrderRow, next: OrderRow): boolean {
  return existing.created_at === next.created_at && existing.customer_email === next.customer_email;
}

export function rowIndex(rows: OrderRow[], previousReference: string, next: OrderRow): number {
  const matches: number[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].reference === previousReference) matches.push(i);
  }
  const mine = matches.filter((i) => sameWriter(rows[i], next));
  if (mine.length > 0) return mine[mine.length - 1];
  if (matches.length === 1) return matches[0];
  return -1;
}

function repairReference(existing: string[], now: Date, email: string): string {
  const prefix = referencePrefix(now);
  const base = Number(nextReference(existing, now).slice(prefix.length));
  let bump = 0;
  for (let i = 0; i < email.length; i += 1) bump = (bump + email.charCodeAt(i)) % 50;
  let n = base + bump;
  while (n > 999) n -= 999;
  if (n < 1) n = 1;
  const candidate = prefix + String(n).padStart(3, "0");
  if (existing.includes(candidate)) return nextReference(existing, now);
  return candidate;
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
  const existing = await store.listReferences();
  const reference = nextReference(existing, now());
  let row = { ...draft, reference };
  await store.append(row);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const after = await store.listReferences();
    if (after.filter((ref) => ref === row.reference).length <= 1) return row;
    const repaired = { ...row, reference: repairReference(after, now(), row.customer_email) };
    if (repaired.reference === row.reference) return row;
    try {
      await store.update(repaired, row.reference);
    } catch {
      return row;
    }
    row = repaired;
  }
  return row;
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
