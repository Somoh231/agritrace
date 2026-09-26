/**
 * Builds a @supabase/ssr session cookie for a stub user. The token is unsigned
 * and only meaningful to tests/e2e-auth/support/stub-supabase.mjs.
 */
export const STUB_SUPABASE_URL = `http://127.0.0.1:${process.env.STUB_SUPABASE_PORT ?? 54399}`;

const b64url = (v: string) => Buffer.from(v, "utf8").toString("base64url");

export type StubUser = "u-missing" | "u-inactive" | "u-admin" | "u-field" | "u-clan" | "u-ministry" | "u-callcenter";

export function sessionCookie(sub: StubUser): { name: string; value: string } {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = [
    b64url(JSON.stringify({ alg: "HS256", typ: "JWT" })),
    b64url(JSON.stringify({ sub, exp, aud: "authenticated", role: "authenticated" })),
    "stub-signature",
  ].join(".");
  const session = {
    access_token: token,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: exp,
    refresh_token: "stub-refresh",
    user: { id: sub, aud: "authenticated", role: "authenticated", email: `${sub}@example.test`, app_metadata: {}, user_metadata: {} },
  };
  // Same storage key supabase-js derives: sb-<first hostname label>-auth-token.
  const ref = new URL(STUB_SUPABASE_URL).hostname.split(".")[0];
  return { name: `sb-${ref}-auth-token`, value: `base64-${b64url(JSON.stringify(session))}` };
}

export function cookieHeader(sub: StubUser, extra: Record<string, string> = {}): Record<string, string> {
  const c = sessionCookie(sub);
  const more = Object.entries(extra).map(([k, v]) => `; ${k}=${v}`).join("");
  return { cookie: `${c.name}=${c.value}${more}` };
}
