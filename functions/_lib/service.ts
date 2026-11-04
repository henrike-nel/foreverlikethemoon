import type { Business } from "./catalogue";
import {
  downloadEmail,
  invoiceEmail,
  ownerAlertEmail,
  shippingEmail,
  type Mailer,
} from "./email";
import {
  draftFromValid,
  publicSummary,
  referencePrefix,
  saveWithUniqueReference,
  serial,
  validateOrder,
  type OrderRow,
  type OrderStore,
} from "./orders";
import { DOWNLOAD_TTL_SECONDS, signDownload } from "./r2";

export interface ServiceContext {
  store: OrderStore;
  mailer: Mailer;
  turnstile: (token: string, ip: string) => Promise<boolean>;
  shippingFlat: number;
  business: Business;
  origin: string;
  now: () => Date;
  signingKey: string;
}

export type ApiOk<T> = { ok: true; status: number; body: T };
export type ApiErr = { ok: false; status: number; error: string };
export type ApiResult<T> = ApiOk<T> | ApiErr;

async function sendQuiet(
  mailer: Mailer,
  email: Parameters<Mailer["send"]>[0],
): Promise<void> {
  try {
    await mailer.send(email);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Email failed");
  }
}

export async function placeOrder(
  input: unknown,
  ip: string,
  ctx: ServiceContext,
): Promise<
  ApiResult<{
    reference: string;
    product_name: string;
    qty: number;
    unit_price: number;
    total: number;
    shipping: number;
    currency: "ZAR";
    record: "saved" | "failed";
  }>
> {
  const parsed = validateOrder(input, ctx.shippingFlat);
  if (!parsed.ok) return { ok: false, status: 400, error: parsed.error };
  const human = await ctx.turnstile(parsed.value.token, ip);
  if (!human)
    return { ok: false, status: 400, error: "Turnstile check failed" };

  const draft = draftFromValid(parsed.value, ctx.now());
  let row: OrderRow;
  let record: "saved" | "failed" = "saved";
  try {
    row = await serial(() =>
      saveWithUniqueReference(ctx.store, draft, ctx.now),
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Sheet failed");
    record = "failed";
    const n = (crypto.getRandomValues(new Uint32Array(1))[0] % 900) + 100;
    row = {
      ...draft,
      reference: `${referencePrefix(ctx.now())}${String(n).padStart(3, "0")}`,
    };
  }

  await sendQuiet(ctx.mailer, invoiceEmail(row, ctx.business, ctx.origin));
  await sendQuiet(ctx.mailer, ownerAlertEmail(row, ctx.business, record));
  return {
    ok: true,
    status: 200,
    body: {
      reference: row.reference,
      product_name: row.product_name,
      qty: row.qty,
      unit_price: row.unit_price,
      total: row.total,
      shipping: row.shipping,
      currency: row.currency,
      record,
    },
  };
}

export async function markPaid(
  reference: string,
  ctx: ServiceContext,
): Promise<
  ApiResult<{ result: "sent" | "already sent"; status: OrderRow["status"] }>
> {
  const row = await ctx.store.findByReference(reference);
  if (!row) return { ok: false, status: 404, error: "Order not found" };
  if (row.status === "cancelled")
    return { ok: false, status: 400, error: "Order is cancelled" };
  if (
    row.status === "delivered" ||
    (row.type === "physical" && row.status === "paid")
  ) {
    return {
      ok: true,
      status: 200,
      body: { result: "already sent", status: row.status },
    };
  }
  const paidAt = row.paid_at || ctx.now().toISOString();
  if (row.type === "physical") {
    const next = { ...row, status: "paid" as const, paid_at: paidAt };
    await ctx.mailer.send(shippingEmail(next, ctx.business, ctx.origin));
    await ctx.store.update(next);
    return { ok: true, status: 200, body: { result: "sent", status: "paid" } };
  }
  if (!ctx.signingKey || ctx.signingKey === "__OWNER_TODO__") {
    return {
      ok: false,
      status: 500,
      error: "Download links are not configured",
    };
  }
  const exp = Math.floor(ctx.now().getTime() / 1000) + DOWNLOAD_TTL_SECONDS;
  const token = await signDownload(row.reference, exp, ctx.signingKey);
  const link = `${ctx.origin}/api/download?token=${encodeURIComponent(token)}`;
  const next = {
    ...row,
    status: "delivered" as const,
    paid_at: paidAt,
    delivered_at: ctx.now().toISOString(),
  };
  await ctx.mailer.send(downloadEmail(next, link, ctx.business, ctx.origin));
  await ctx.store.update(next);
  return {
    ok: true,
    status: 200,
    body: { result: "sent", status: "delivered" },
  };
}

export async function orderSummary(reference: string, store: OrderStore) {
  const row = await store.findByReference(reference);
  if (!row) return null;
  return publicSummary(row);
}
