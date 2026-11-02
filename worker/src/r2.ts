const encoder = new TextEncoder();

export const PDF_KEY = "digital-wedding-planner.pdf";
export const DOWNLOAD_TTL_SECONDS = 7 * 24 * 60 * 60;
export const DOWNLOAD_CAP = 3;

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToBase64Url(sig);
}

export async function signDownload(reference: string, exp: number, secret: string): Promise<string> {
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify({ ref: reference, exp })));
  const sig = await hmac(payload, secret);
  return `${payload}.${sig}`;
}

export async function readDownloadToken(
  token: string,
  secret: string,
  now: Date,
): Promise<{ ref: string; exp: number } | null> {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify("HMAC", key, base64UrlToBytes(sig), encoder.encode(payload));
  if (!valid) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as { ref?: string; exp?: number };
    if (!parsed.ref || typeof parsed.exp !== "number") return null;
    if (parsed.exp <= Math.floor(now.getTime() / 1000)) return null;
    return { ref: parsed.ref, exp: parsed.exp };
  } catch {
    return null;
  }
}
