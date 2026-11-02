import { createRemoteJWKSet, jwtVerify } from "jose";

export interface AccessEnv {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function verifyAccessJwt(token: string, team: string, audience: string): Promise<void> {
  const issuer = `https://${team}.cloudflareaccess.com`;
  let jwks = jwksCache.get(issuer);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    jwksCache.set(issuer, jwks);
  }
  await jwtVerify(token, jwks, { issuer, audience });
}

export function accessTeamName(raw: string | undefined): string {
  return (raw ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\.cloudflareaccess\.com\/?$/i, "")
    .replace(/\/$/, "");
}

export async function accessAllowed(
  request: Request,
  env: AccessEnv,
  verify: (token: string, team: string, audience: string) => Promise<void> = verifyAccessJwt,
): Promise<boolean> {
  const team = accessTeamName(env.ACCESS_TEAM_DOMAIN);
  const audience = env.ACCESS_AUD?.trim() ?? "";
  if (!team || !audience || team === "__OWNER_TODO__" || audience === "__OWNER_TODO__") return false;
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return false;
  try {
    await verify(token, team, audience);
    return true;
  } catch {
    return false;
  }
}
