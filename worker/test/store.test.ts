import { describe, expect, it, vi } from "vitest";
import {
  PRODUCTS,
  quote,
  shippingFlatZar,
} from "../../functions/_lib/catalogue";
import {
  invoiceEmail,
  ownerAlertEmail,
  resendMailer,
} from "../../functions/_lib/email";
import { handle, type Env, type HandlerDeps } from "../../functions/_lib/index";
import {
  MemoryStore,
  UnconfiguredStore,
  nextReference,
  orderStatus,
  reassignIfCollided,
  saveWithUniqueReference,
  type OrderRow,
  type OrderStore,
} from "../../functions/_lib/orders";
import { CardGatewayNotConfigured } from "../../functions/_lib/payments";
import { readDownloadToken, signDownload } from "../../functions/_lib/r2";
import {
  GoogleSheetStore,
  googleAccessToken,
} from "../../functions/_lib/sheet";
import { accessAllowed, accessTeamName } from "../../functions/_lib/access";
import {
  markPaid,
  placeOrder,
  type ServiceContext,
} from "../../functions/_lib/service";
import { verifyTurnstile } from "../../functions/_lib/turnstile";
import type { Business } from "../../functions/_lib/catalogue";

const now = () => new Date("2026-11-02T08:00:00.000Z");

const business: Business = {
  legalName: "__OWNER_TODO__",
  status: "__OWNER_TODO__",
  address: "__OWNER_TODO__",
  contact: "__OWNER_TODO__",
  bankName: "__OWNER_TODO__",
  accountName: "__OWNER_TODO__",
  accountNumber: "__OWNER_TODO__",
  branchCode: "__OWNER_TODO__",
  payshapId: "__OWNER_TODO__",
  snapscanUrl: "",
  whatsapp: "",
  ownerEmail: "owner@example.com",
  fromEmail: "Forever Like The Moon <orders@foreverlikethemoon.com>",
};

function digitalBody(extra: Record<string, unknown> = {}) {
  return {
    product_id: "digital-wedding-planner",
    qty: 1,
    customer_name: "Amahle Dlamini",
    customer_email: "amahle@example.com",
    delivery_address: "",
    notes: "",
    turnstile_token: "ok",
    price: 1,
    ...extra,
  };
}

function ctx(
  store: OrderStore,
  mailer: ServiceContext["mailer"],
  shippingFlat = 0,
): ServiceContext {
  return {
    store,
    mailer,
    turnstile: async (token) => token === "ok",
    shippingFlat,
    business,
    origin: "https://preview.example",
    now,
    signingKey: "test-signing-key",
  };
}

function capturingMailer() {
  const sent: { subject: string; text: string; to: string }[] = [];
  return {
    sent,
    mailer: {
      async send(email: { subject: string; text: string; to: string }) {
        sent.push(email);
      },
    },
  };
}

describe("catalogue and references", () => {
  it("prices the three products and ignores a client price", () => {
    expect(PRODUCTS["digital-wedding-planner"].price).toBe(300);
    expect(PRODUCTS["physical-wedding-planner"].price).toBe(400);
    expect(PRODUCTS["emergency-kit"].price).toBe(450);
    expect(quote("digital-wedding-planner", 2, 80)).toMatchObject({
      total: 600,
      shipping: 0,
      unitPrice: 300,
    });
    expect(quote("physical-wedding-planner", 2, 80)).toMatchObject({
      total: 880,
      shipping: 80,
    });
    expect(quote("missing", 1, 0)).toBeNull();
    expect(quote("physical-wedding-planner", 0, 0)).toBeNull();
    expect(shippingFlatZar(undefined)).toBe(90);
    expect(shippingFlatZar("75")).toBe(75);
  });

  it("numbers references per Johannesburg month and repairs a collision", () => {
    expect(nextReference([], new Date("2026-08-31T22:30:00.000Z"))).toBe(
      "FLTM-2609-001",
    );
    expect(
      nextReference(["FLTM-2611-001", "FLTM-2611-014", "FLTM-2610-099"], now()),
    ).toBe("FLTM-2611-015");
    expect(
      reassignIfCollided(
        "FLTM-2611-001",
        ["FLTM-2611-001", "FLTM-2611-001"],
        now(),
      ),
    ).toBe("FLTM-2611-002");
    expect(reassignIfCollided("FLTM-2611-001", ["FLTM-2611-001"], now())).toBe(
      "FLTM-2611-001",
    );
  });
});

describe("placeOrder", () => {
  it("saves one pending row, invoices the customer, and ignores the client price", async () => {
    const store = new MemoryStore();
    const mail = capturingMailer();
    const result = await placeOrder(digitalBody(), "", ctx(store, mail.mailer));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body).toMatchObject({
      reference: "FLTM-2611-001",
      total: 300,
      shipping: 0,
      record: "saved",
    });
    const row = await store.findByReference("FLTM-2611-001");
    expect(row?.status).toBe("pending");
    expect(row?.unit_price).toBe(300);
    expect(mail.sent.map((email) => email.to).sort()).toEqual([
      "amahle@example.com",
      "owner@example.com",
    ]);
    const invoice = mail.sent.find(
      (email) => email.to === "amahle@example.com",
    );
    expect(invoice?.text).toContain("Digital Wedding Planner × 1");
    expect(invoice?.text).toContain("Unit price: R300");
    expect(invoice?.text).toContain("Shipping: R0");
    expect(invoice?.text).toContain("Total: R300 ZAR");
    expect(invoice?.text).toContain(
      "https://preview.example/legal/refund-policy.html",
    );
    expect(invoice?.text).toContain(
      "https://preview.example/legal/privacy.html",
    );
    expect(invoice?.text).not.toContain("application/pdf");
  });

  it("adds flat shipping for a physical order and requires an address", async () => {
    const store = new MemoryStore();
    const mail = capturingMailer();
    const missing = await placeOrder(
      digitalBody({ product_id: "emergency-kit", delivery_address: "  " }),
      "",
      ctx(store, mail.mailer, 90),
    );
    expect(missing).toMatchObject({
      ok: false,
      status: 400,
      error: "Enter a delivery address",
    });
    const saved = await placeOrder(
      digitalBody({
        product_id: "emergency-kit",
        qty: 1,
        delivery_address: "12 Long Street, Cape Town",
        price: 5,
      }),
      "",
      ctx(store, mail.mailer, 90),
    );
    expect(saved).toMatchObject({
      ok: true,
      body: { total: 540, shipping: 90 },
    });
  });

  it("rejects a missing or invalid turnstile token and does not write a row", async () => {
    const store = new MemoryStore();
    const mail = capturingMailer();
    const missing = await placeOrder(
      digitalBody({ turnstile_token: "" }),
      "",
      ctx(store, mail.mailer),
    );
    expect(missing).toMatchObject({
      ok: false,
      error: "Turnstile check failed",
    });
    const bad = await placeOrder(
      digitalBody({ turnstile_token: "nope" }),
      "",
      ctx(store, mail.mailer),
    );
    expect(bad).toMatchObject({ ok: false, error: "Turnstile check failed" });
    expect(await store.listReferences()).toEqual([]);
    expect(mail.sent).toHaveLength(0);
  });

  it("keeps the buyer reference when the sheet write fails", async () => {
    const store: OrderStore = {
      async listReferences() {
        throw new Error("down");
      },
      async listOrders() {
        throw new Error("down");
      },
      async append() {
        throw new Error("down");
      },
      async findByReference() {
        return null;
      },
      async update() {
        throw new Error("down");
      },
    };
    const mail = capturingMailer();
    const result = await placeOrder(digitalBody(), "", ctx(store, mail.mailer));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body.record).toBe("failed");
    expect(result.body.reference).toMatch(/^FLTM-2611-\d{3}$/);
    const owner = mail.sent.find((email) => email.to === "owner@example.com");
    expect(owner?.text).toContain("order received, record failed");
    expect(mail.sent.some((email) => email.to === "amahle@example.com")).toBe(
      true,
    );
  });

  it("gives parallel orders distinct references", async () => {
    const store = new MemoryStore();
    const mail = capturingMailer();
    await Promise.all([
      placeOrder(
        digitalBody({ customer_email: "a@example.com" }),
        "",
        ctx(store, mail.mailer),
      ),
      placeOrder(
        digitalBody({ customer_email: "b@example.com" }),
        "",
        ctx(store, mail.mailer),
      ),
    ]);
    const refs = await store.listReferences();
    expect(new Set(refs).size).toBe(2);
    expect(refs.every((ref) => /^FLTM-2611-\d{3}$/.test(ref))).toBe(true);
  });

  it("repairs a store that writes the same reference twice", async () => {
    const inner = new MemoryStore();
    let armed = true;
    const store: OrderStore = {
      listReferences: () => inner.listReferences(),
      listOrders: () => inner.listOrders(),
      findByReference: (reference) => inner.findByReference(reference),
      update: (row, previous) => inner.update(row, previous),
      async append(row) {
        await inner.append(row);
        if (armed) {
          armed = false;
          await inner.append({ ...row });
        }
      },
    };
    const mail = capturingMailer();
    const result = await placeOrder(digitalBody(), "", ctx(store, mail.mailer));
    expect(result.ok).toBe(true);
    const refs = await inner.listReferences();
    expect(new Set(refs).size).toBe(refs.length);
  });

  it("repairs a collided reference without overwriting the other buyer", async () => {
    const store = new MemoryStore();
    const first = draftFrom(
      digitalBody({ customer_email: "a@example.com", customer_name: "A" }),
    );
    const second = draftFrom(
      digitalBody({ customer_email: "b@example.com", customer_name: "B" }),
    );
    const [left, right] = await Promise.all([
      saveWithUniqueReference(store, first, now),
      saveWithUniqueReference(store, second, now),
    ]);
    expect(store.rows).toHaveLength(2);
    const a = store.rows.find((row) => row.customer_email === "a@example.com");
    const b = store.rows.find((row) => row.customer_email === "b@example.com");
    expect(a?.customer_name).toBe("A");
    expect(b?.customer_name).toBe("B");
    expect(a?.reference).toBe(left.reference);
    expect(b?.reference).toBe(right.reference);
    expect(left.reference).not.toBe(right.reference);
  });
});

describe("turnstile and resend", () => {
  it("accepts only a successful siteverify response", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ success: false }), { status: 200 }),
    );
    expect(await verifyTurnstile("", "secret", "", fetchImpl)).toBe(false);
    expect(await verifyTurnstile("token", "", "", fetchImpl)).toBe(false);
    expect(await verifyTurnstile("token", "secret", "1.2.3.4", fetchImpl)).toBe(
      false,
    );
    fetchImpl.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    expect(await verifyTurnstile("token", "secret", "", fetchImpl)).toBe(true);
  });

  it("posts a text email with no attachment", async () => {
    let body: Record<string, unknown> = {};
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return new Response("{}", { status: 200 });
    });
    const row = {
      reference: "FLTM-2611-001",
      product_name: "Digital Wedding Planner",
      qty: 1,
      unit_price: 300,
      shipping: 0,
      total: 300,
      currency: "ZAR" as const,
      customer_email: "amahle@example.com",
    };
    await resendMailer("re_test", fetchImpl as unknown as typeof fetch).send(
      invoiceEmail(row as OrderRow, business, "https://preview.example"),
    );
    expect(body.attachments).toBeUndefined();
    expect(body.html).toEqual(expect.any(String));
    expect(String(body.text)).toContain("FLTM-2611-001");
  });
});

describe("mark paid and downloads", () => {
  async function pending(
    store: MemoryStore,
    type: "digital" | "physical" = "digital",
  ) {
    const mail = capturingMailer();
    const body =
      type === "digital"
        ? digitalBody()
        : digitalBody({
            product_id: "physical-wedding-planner",
            delivery_address: "12 Long Street, Cape Town",
          });
    await placeOrder(body, "", ctx(store, mail.mailer, 0));
    mail.sent.length = 0;
    return mail;
  }

  it("emails one download link and ignores a second click", async () => {
    const store = new MemoryStore();
    const mail = await pending(store);
    const service = ctx(store, mail.mailer);
    const first = await (
      await import("../../functions/_lib/service")
    ).markPaid("FLTM-2611-001", service);
    const second = await (
      await import("../../functions/_lib/service")
    ).markPaid("FLTM-2611-001", service);
    expect(first).toMatchObject({
      ok: true,
      body: { result: "sent", status: "delivered" },
    });
    expect(second).toMatchObject({
      ok: true,
      body: { result: "already sent", status: "delivered" },
    });
    expect(mail.sent).toHaveLength(1);
    expect(mail.sent[0].text).toContain(
      "https://preview.example/api/download?token=",
    );
    expect(mail.sent[0].text).not.toContain("filename=");
    const row = await store.findByReference("FLTM-2611-001");
    expect(row?.delivered_at).not.toBe("");
  });

  it("marks a physical order paid once and says it will ship", async () => {
    const store = new MemoryStore();
    const mail = await pending(store, "physical");
    const service = ctx(store, mail.mailer);
    const { markPaid } = await import("../../functions/_lib/service");
    expect(await markPaid("FLTM-2611-001", service)).toMatchObject({
      body: { result: "sent", status: "paid" },
    });
    expect(await markPaid("FLTM-2611-001", service)).toMatchObject({
      body: { result: "already sent", status: "paid" },
    });
    expect(mail.sent).toHaveLength(1);
    expect(mail.sent[0].text).toContain("shipped soon");
    expect(mail.sent[0].text).not.toContain("/api/download");
  });

  it("expires a link after 7 days and stops after 3 downloads", async () => {
    const secret = "test-signing-key";
    const issuedAt = now();
    const token = await signDownload(
      "FLTM-2611-001",
      Math.floor(issuedAt.getTime() / 1000) + 7 * 24 * 60 * 60,
      secret,
    );
    expect(await readDownloadToken(token, secret, issuedAt)).toMatchObject({
      ref: "FLTM-2611-001",
    });
    const later = new Date(issuedAt.getTime() + 7 * 24 * 60 * 60 * 1000 + 1000);
    expect(await readDownloadToken(token, secret, later)).toBeNull();
    expect(await readDownloadToken(token + "x", secret, issuedAt)).toBeNull();

    const store = new MemoryStore();
    const mail = capturingMailer();
    await placeOrder(digitalBody(), "", ctx(store, mail.mailer));
    mail.sent.length = 0;
    await markPaid("FLTM-2611-001", ctx(store, mail.mailer));
    const deps = handlerDeps(store);
    const env = fakeEnv();
    const link = mail.sent
      .find((email) => email.to === "amahle@example.com")
      ?.text.match(/https:\/\/preview\.example\/api\/download\?token=(\S+)/);
    expect(link?.[1]).toBeTruthy();
    const tokenValue = decodeURIComponent(link?.[1] ?? "");
    const pdf = new TextEncoder().encode("%PDF-1.4");
    deps.bucket = {
      async get() {
        return { body: new Blob([pdf]).stream() };
      },
    };
    for (let i = 0; i < 3; i += 1) {
      const response = await handle(
        new Request(
          `https://preview.example/api/download?token=${encodeURIComponent(tokenValue)}`,
        ),
        env,
        deps,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/pdf");
    }
    const blocked = await handle(
      new Request(
        `https://preview.example/api/download?token=${encodeURIComponent(tokenValue)}`,
      ),
      env,
      deps,
    );
    expect(blocked.status).toBe(403);
    expect(await store.findByReference("FLTM-2611-001")).toMatchObject({
      download_count: 3,
    });
  });
});

describe("http guards", () => {
  it("denies access when Cloudflare Access is not configured or the token is missing", async () => {
    expect(orderStatus("Delivered")).toBe("delivered");
    expect(orderStatus("nope")).toBe("pending");
    expect(accessTeamName("team.cloudflareaccess.com")).toBe("team");
    expect(
      await accessAllowed(new Request("https://preview.example/admin"), {}),
    ).toBe(false);
    expect(
      await accessAllowed(new Request("https://preview.example/admin"), {
        ACCESS_TEAM_DOMAIN: "team",
        ACCESS_AUD: "aud",
      }),
    ).toBe(false);
    expect(
      await accessAllowed(
        new Request("https://preview.example/admin", {
          headers: { "Cf-Access-Jwt-Assertion": "not-a-jwt" },
        }),
        { ACCESS_TEAM_DOMAIN: "team", ACCESS_AUD: "aud" },
      ),
    ).toBe(false);
  });

  it("hides admin and order records without Cloudflare Access", async () => {
    const store = new MemoryStore();
    const deps = handlerDeps(store);
    deps.access = async () => false;
    const env = fakeEnv();
    expect(
      (await handle(new Request("https://preview.example/admin"), env, deps))
        .status,
    ).toBe(401);
    expect(
      (
        await handle(
          new Request("https://preview.example/api/orders"),
          env,
          deps,
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await handle(
          new Request(
            "https://preview.example/api/orders/FLTM-2611-001/mark-paid",
            { method: "POST" },
          ),
          env,
          deps,
        )
      ).status,
    ).toBe(401);
  });

  it("returns JSON when the order record cannot be read", async () => {
    const response = await handle(
      new Request("https://preview.example/api/orders/FLTM-2611-001/summary"),
      fakeEnv(),
      handlerDeps(new UnconfiguredStore()),
    );
    expect(response.status).toBe(500);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Something went wrong. Please try again.");
    expect(JSON.stringify(body)).not.toContain("orders.ts");
  });

  it("serves a summary with no customer details", async () => {
    const store = new MemoryStore();
    const mail = capturingMailer();
    await placeOrder(digitalBody(), "", ctx(store, mail.mailer));
    const response = await handle(
      new Request("https://preview.example/api/summary/FLTM-2611-001"),
      fakeEnv(),
      handlerDeps(store),
    );
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.reference).toBe("FLTM-2611-001");
    const legacy = await handle(
      new Request("https://preview.example/api/orders/FLTM-2611-001/summary"),
      fakeEnv(),
      handlerDeps(store),
    );
    expect(((await legacy.json()) as { reference: string }).reference).toBe(
      "FLTM-2611-001",
    );
    expect(body.customer_email).toBeUndefined();
    expect(body.customer_name).toBeUndefined();
    expect(body.delivery_address).toBeUndefined();
  });

  it("does not start card checkout from the EFT order route", async () => {
    const gateway = new CardGatewayNotConfigured();
    await expect(
      gateway.createCheckout({
        reference: "FLTM-2611-001",
        total: 300,
        currency: "ZAR",
        customer_email: "a@example.com",
        product_name: "Digital Wedding Planner",
      }),
    ).rejects.toThrow(/not configured/);
    const store = new MemoryStore();
    const response = await handle(
      jsonRequest("/api/order", digitalBody()),
      fakeEnv(),
      handlerDeps(store),
    );
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.redirectUrl).toBeUndefined();
    expect(await store.findByReference(String(body.reference))).toMatchObject({
      status: "pending",
    });
  });
});

describe("google sheet", () => {
  it("asks for the spreadsheets scope and appends a row", async () => {
    const key = (await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign"],
    )) as CryptoKeyPair;
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", key.privateKey);
    const bytes = new Uint8Array(pkcs8 as ArrayBuffer);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(binary)}\n-----END PRIVATE KEY-----\n`;
    const calls: unknown[][] = [];
    const fetchImpl: typeof fetch = async (_url, init) => {
      calls.push([_url, init]);
      return new Response(JSON.stringify({ access_token: "ya29.test" }), {
        status: 200,
      });
    };
    const token = await googleAccessToken(
      "sheets@example.iam.gserviceaccount.com",
      pem,
      fetchImpl,
    );
    expect(token).toBe("ya29.test");
    const init = calls[0][1] as RequestInit;
    const assertion =
      new URLSearchParams(String(init.body)).get("assertion") ?? "";
    const payload = JSON.parse(
      atob(assertion.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    expect(payload.scope).toBe("https://www.googleapis.com/auth/spreadsheets");
    expect(payload.iss).toBe("sheets@example.iam.gserviceaccount.com");

    const sheetCalls: { url: string; method: string; body?: string }[] = [];
    const sheetFetch = vi.fn(async (url: string, init?: RequestInit) => {
      sheetCalls.push({
        url: String(url),
        method: init?.method ?? "GET",
        body: init?.body ? String(init.body) : undefined,
      });
      if (!init?.method || init.method === "GET")
        return new Response(JSON.stringify({ values: [] }), { status: 200 });
      return new Response("{}", { status: 200 });
    });
    const sheet = new GoogleSheetStore(
      "sheet-id",
      async () => "tok",
      sheetFetch as unknown as typeof fetch,
    );
    const row = (await import("../../functions/_lib/orders")).draftFromValid(
      {
        productId: "digital-wedding-planner",
        name: "Amahle",
        email: "amahle@example.com",
        address: "",
        notes: "",
        token: "ok",
        qty: 1,
        unitPrice: 300,
        shipping: 0,
        total: 300,
        currency: "ZAR",
        type: "digital",
        productName: "Digital Wedding Planner",
      },
      now(),
    );
    row.reference = "FLTM-2611-001";
    await sheet.append(row);
    expect(sheetCalls[0].url).toContain("/spreadsheets/sheet-id/values/");
    expect(sheetCalls[1].method).toBe("POST");
    expect(sheetCalls[1].url).toContain(":append");
    expect(sheetCalls[1].body).toContain("FLTM-2611-001");
    expect(sheetCalls[1].body).toContain("reference");
  });
});

function fakeEnv(): Env {
  return {
    PLANNER_BUCKET: {
      get: async () => null,
      put: async () => undefined,
      delete: async () => undefined,
      list: async () => ({ objects: [], truncated: false }),
      head: async () => null,
      createMultipartUpload: async () => {
        throw new Error("unused");
      },
      resumeMultipartUpload: async () => {
        throw new Error("unused");
      },
    },
  } as unknown as Env;
}

function handlerDeps(store: OrderStore): Partial<HandlerDeps> {
  const sent: { subject: string; text: string; to: string }[] = [];
  const deps: Partial<HandlerDeps> & { sent: typeof sent } = {
    sent,
    store,
    now,
    signingKey: "test-signing-key",
    shippingFlat: 0,
    business,
    turnstileSiteKey: "1x00000000000000000000AA",
    turnstile: async (token) => token === "ok",
    access: async () => true,
    bucket: {
      async get() {
        return null;
      },
    },
    mailer: {
      async send(email) {
        sent.push(email);
      },
    },
  };
  return deps;
}

function draftFrom(body: ReturnType<typeof digitalBody>): OrderRow {
  return {
    reference: "",
    created_at: now().toISOString(),
    status: "pending",
    product_id: "digital-wedding-planner",
    product_name: "Digital Wedding Planner",
    type: "digital",
    unit_price: 300,
    qty: 1,
    shipping: 0,
    total: 300,
    currency: "ZAR",
    customer_name: String(body.customer_name),
    customer_email: String(body.customer_email),
    delivery_address: "",
    notes: "",
    paid_at: "",
    delivered_at: "",
    download_count: 0,
  };
}

function jsonRequest(path: string, body: unknown): Request {
  return new Request(`https://preview.example${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
