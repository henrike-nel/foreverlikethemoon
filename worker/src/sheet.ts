import { ORDER_COLUMNS, rowIndex, rowToValues, valuesToRow, type OrderRow, type OrderStore } from "./orders";

const SHEET = "Orders";
const encoder = new TextEncoder();

function pemToPkcs8(pem: string): ArrayBuffer {
  const normalized = pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
  const body = normalized.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function googleAccessToken(email: string, privateKeyPem: string, fetchImpl: typeof fetch): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = base64Url(
    encoder.encode(
      JSON.stringify({
        iss: email,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      }),
    ),
  );
  const unsigned = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(unsigned));
  const assertion = `${unsigned}.${base64Url(signature)}`;
  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Google token failed (${response.status})`);
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google token missing");
  return data.access_token;
}

export class GoogleSheetStore implements OrderStore {
  private cachedToken: Promise<string> | null = null;

  constructor(
    private readonly sheetId: string,
    private readonly token: () => Promise<string>,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private auth(): Promise<string> {
    if (!this.cachedToken) {
      this.cachedToken = this.token().catch((error) => {
        this.cachedToken = null;
        throw error;
      });
    }
    return this.cachedToken;
  }

  private async values(): Promise<string[][]> {
    const token = await this.auth();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/${encodeURIComponent(`${SHEET}!A:R`)}`;
    const response = await this.fetchImpl(url, { headers: { authorization: `Bearer ${token}` } });
    if (response.status === 400 || response.status === 404) throw new Error("Sheet is not reachable");
    if (!response.ok) throw new Error(`Sheet read failed (${response.status})`);
    const data = (await response.json()) as { values?: string[][] };
    return data.values ?? [];
  }

  async listReferences(): Promise<string[]> {
    const orders = await this.listOrders();
    return orders.map((row) => row.reference);
  }

  async listOrders(): Promise<OrderRow[]> {
    const rows = await this.values();
    return rows.map((row) => valuesToRow(row)).filter((row): row is OrderRow => row !== null);
  }

  async findByReference(reference: string): Promise<OrderRow | null> {
    const rows = await this.values();
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      if (rows[i][0] === reference) return valuesToRow(rows[i]);
    }
    return null;
  }

  async append(row: OrderRow): Promise<void> {
    const existing = await this.values();
    const values = existing.length === 0 ? [Array.from(ORDER_COLUMNS), rowToValues(row)] : [rowToValues(row)];
    await this.write("append", values);
  }

  async update(row: OrderRow, previousReference = row.reference): Promise<void> {
    const existing = await this.values();
    const parsed = existing.map((values) => valuesToRow(values) ?? ({ ...row, reference: values[0] ?? "", created_at: values[1] ?? "", customer_email: values[12] ?? "" }));
    const index = rowIndex(parsed, previousReference, row);
    if (index < 0) throw new Error("Order not found");
    const rowNumber = index + 1;
    await this.write("update", [rowToValues(row)], rowNumber);
  }

  private async write(mode: "append" | "update", values: string[][], rowNumber?: number): Promise<void> {
    const token = await this.auth();
    const range = mode === "append" ? `${SHEET}!A:R` : `${SHEET}!A${rowNumber}:R${rowNumber}`;
    const suffix = mode === "append" ? ":append?valueInputOption=RAW" : "?valueInputOption=RAW";
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/${encodeURIComponent(range).replace("%3A", ":")}${suffix}`;
    const response = await this.fetchImpl(url, {
      method: mode === "append" ? "POST" : "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ values }),
    });
    if (!response.ok) throw new Error(`Sheet write failed (${response.status})`);
  }
}
