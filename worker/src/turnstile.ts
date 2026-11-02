export async function verifyTurnstile(
  token: string,
  secret: string | undefined,
  ip: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (!token || !secret || secret === "__OWNER_TODO__") return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const response = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!response.ok) return false;
  const data = (await response.json()) as { success?: boolean };
  return data.success === true;
}
