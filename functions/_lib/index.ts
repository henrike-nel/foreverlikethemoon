import { accessAllowed } from "./access";
import {
  businessFromEnv,
  cataloguePayload,
  publicBusiness,
  shippingFlatZar,
  type Business,
} from "./catalogue";
import { resendMailer, type Mailer } from "./email";
import { UnconfiguredStore, type OrderStore } from "./orders";
import { DOWNLOAD_CAP, PDF_KEY, readDownloadToken } from "./r2";
import { GoogleSheetStore, googleAccessToken } from "./sheet";
import {
  markPaid,
  orderSummary,
  placeOrder,
  type ServiceContext,
} from "./service";
import { verifyTurnstile } from "./turnstile";

export interface Env {
  PLANNER_BUCKET?: R2Bucket;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  GOOGLE_SA_EMAIL?: string;
  GOOGLE_SA_PRIVATE_KEY?: string;
  SHEET_ID?: string;
  OWNER_EMAIL?: string;
  DOWNLOAD_SIGNING_KEY?: string;
  SHIPPING_FLAT_ZAR?: string;
  BUSINESS_LEGAL_NAME?: string;
  BUSINESS_STATUS?: string;
  BUSINESS_ADDRESS?: string;
  BUSINESS_CONTACT?: string;
  BUSINESS_BANK_NAME?: string;
  BUSINESS_ACCOUNT_NAME?: string;
  BUSINESS_ACCOUNT_NUMBER?: string;
  BUSINESS_BRANCH_CODE?: string;
  BUSINESS_PAYSHAP_ID?: string;
  SNAPSCAN_URL?: string;
  BUSINESS_WHATSAPP?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  RESEND_FROM?: string;
}

export interface HandlerDeps {
  store: OrderStore;
  mailer: Mailer;
  turnstile: (token: string, ip: string) => Promise<boolean>;
  access: (request: Request) => Promise<boolean>;
  bucket: { get(key: string): Promise<{ body: ReadableStream } | null> };
  now: () => Date;
  signingKey: string;
  business: Business;
  shippingFlat: number;
  turnstileSiteKey: string;
}

const REFERENCE = /^FLTM-\d{4}-\d{3}$/;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function clientIp(request: Request): string {
  return request.headers.get("CF-Connecting-IP") ?? "";
}

export function depsFromEnv(env: Env): HandlerDeps {
  const business = businessFromEnv(env);
  const shippingFlat = shippingFlatZar(env.SHIPPING_FLAT_ZAR);
  let store: OrderStore = new UnconfiguredStore();
  if (env.SHEET_ID && env.GOOGLE_SA_EMAIL && env.GOOGLE_SA_PRIVATE_KEY) {
    const email = env.GOOGLE_SA_EMAIL;
    const key = env.GOOGLE_SA_PRIVATE_KEY;
    store = new GoogleSheetStore(env.SHEET_ID, () =>
      googleAccessToken(email, key, fetch),
    );
  }
  return {
    store,
    mailer: resendMailer(env.RESEND_API_KEY),
    turnstile: (token, ip) =>
      verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip),
    access: (request) => accessAllowed(request, env),
    bucket: env.PLANNER_BUCKET ?? {
      async get() {
        return null;
      },
    },
    now: () => new Date(),
    signingKey: env.DOWNLOAD_SIGNING_KEY ?? "",
    business,
    shippingFlat,
    turnstileSiteKey: env.TURNSTILE_SITE_KEY?.trim() ?? "",
  };
}

function context(request: Request, deps: HandlerDeps): ServiceContext {
  return {
    store: deps.store,
    mailer: deps.mailer,
    turnstile: deps.turnstile,
    shippingFlat: deps.shippingFlat,
    business: deps.business,
    origin: new URL(request.url).origin,
    now: deps.now,
    signingKey: deps.signingKey,
  };
}

export async function handle(
  request: Request,
  env: Env,
  overrides: Partial<HandlerDeps> = {},
): Promise<Response> {
  try {
    return await route(request, env, overrides);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Request failed");
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}

async function route(
  request: Request,
  env: Env,
  overrides: Partial<HandlerDeps>,
): Promise<Response> {
  const deps: HandlerDeps = { ...depsFromEnv(env), ...overrides };
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/api/config" && request.method === "GET") {
    return json({
      ...cataloguePayload(deps.shippingFlat),
      turnstileSiteKey: deps.turnstileSiteKey,
      business: publicBusiness(deps.business),
    });
  }

  if (path === "/api/order" && request.method === "POST") {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Enter the order details" }, 400);
    }
    const result = await placeOrder(
      body,
      clientIp(request),
      context(request, deps),
    );
    return result.ok
      ? json(result.body, result.status)
      : json({ error: result.error }, result.status);
  }

  if (path === "/api/orders" && request.method === "GET") {
    if (!(await deps.access(request)))
      return json({ error: "Sign in through Cloudflare Access" }, 401);
    return json(await deps.store.listOrders());
  }

  const summary = path.match(
    /^\/api\/(?:summary\/(FLTM-\d{4}-\d{3})|orders\/(FLTM-\d{4}-\d{3})\/summary)$/,
  );
  if (summary && request.method === "GET") {
    const row = await orderSummary(summary[1] ?? summary[2], deps.store);
    if (!row) return json({ error: "Order not found" }, 404);
    return json(row);
  }

  const paid = path.match(/^\/api\/orders\/(FLTM-\d{4}-\d{3})\/mark-paid$/);
  if (paid && request.method === "POST") {
    if (!(await deps.access(request)))
      return json({ error: "Sign in through Cloudflare Access" }, 401);
    const result = await markPaid(paid[1], context(request, deps));
    return result.ok
      ? json(result.body, result.status)
      : json({ error: result.error }, result.status);
  }

  if (path === "/api/download" && request.method === "GET") {
    const token = url.searchParams.get("token") ?? "";
    const parsed = await readDownloadToken(token, deps.signingKey, deps.now());
    if (!parsed || !REFERENCE.test(parsed.ref))
      return json({ error: "This download link is not valid" }, 403);
    const row = await deps.store.findByReference(parsed.ref);
    if (!row || row.status !== "delivered")
      return json({ error: "This download link is not valid" }, 403);
    if (row.download_count >= DOWNLOAD_CAP)
      return json({ error: "This download link has been used up" }, 403);
    const object = await deps.bucket.get(PDF_KEY);
    if (!object)
      return json({ error: "The planner file is not available yet" }, 404);
    await deps.store.update({ ...row, download_count: row.download_count + 1 });
    return new Response(object.body, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition":
          'attachment; filename="digital-wedding-planner.pdf"',
        "cache-control": "no-store",
      },
    });
  }

  if (path === "/admin" || path.startsWith("/admin/")) {
    if (!(await deps.access(request)))
      return json({ error: "Sign in through Cloudflare Access" }, 401);
    return json({ error: "Not found" }, 404);
  }

  return json({ error: "Not found" }, 404);
}
