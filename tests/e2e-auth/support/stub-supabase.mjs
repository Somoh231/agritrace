/**
 * Minimal local stand-in for Supabase Auth + PostgREST, used only by the
 * route-protection tests in tests/e2e-auth. No real project, users or data.
 *
 * Users are identified by the `sub` of an unsigned test token (see fixtures.ts):
 *   u-missing   authenticated, no profiles row
 *   u-inactive  authenticated, profile role "admin" with is_active = false
 *   u-admin     authenticated, active "admin" profile
 *   u-field     authenticated, active "field_agent" profile
 *   u-clan      authenticated, active "clan_technician" profile
 *   u-ministry  authenticated, active "ministry_officer" profile
 *   u-invitee   authenticated via an invite link, inactive "field_agent" (not yet activated)
 *   u-invitee-active  authenticated via an invite link, active "field_agent"
 *
 * Every other table returns an empty result.
 */
import http from "node:http";

export const STUB_PORT = Number(process.env.STUB_SUPABASE_PORT ?? 54399);

const PROFILES = {
  "u-inactive": { role: "admin", is_active: false },
  "u-admin": { role: "admin", is_active: true },
  "u-field": { role: "field_agent", is_active: true },
  "u-clan": { role: "clan_technician", is_active: true },
  "u-ministry": { role: "ministry_officer", is_active: true },
  // Invited accounts: one not yet activated by an administrator, one activated.
  "u-invitee": { role: "field_agent", is_active: false },
  "u-invitee-active": { role: "field_agent", is_active: true },
};

const b64url = (v) => Buffer.from(v).toString("base64url");
const token = (sub) =>
  [b64url(JSON.stringify({ alg: "HS256", typ: "JWT" })), b64url(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600, aud: "authenticated", role: "authenticated" })), "stub-signature"].join(".");

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function subFromBearer(req) {
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization ?? "");
  if (!m) return null;
  const parts = m[1].split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")).sub ?? null;
  } catch {
    return null;
  }
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version, accept, accept-profile, content-profile, prefer, range",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "access-control-expose-headers": "content-range",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "application/json", ...CORS, ...headers });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

const hits = { user: 0, profiles: 0, passwordUpdates: 0, verify: 0 };

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${STUB_PORT}`);
  const accept = String(req.headers.accept ?? "");
  const wantsObject = accept.includes("application/vnd.pgrst.object+json");

  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    return res.end();
  }
  if (url.pathname === "/__stub/hits") return send(res, 200, hits);

  // verifyOtp for ?token_hash links: "valid-invite" signs in u-invitee-active.
  if (url.pathname === "/auth/v1/verify" && req.method === "POST") {
    hits.verify += 1;
    return void readBody(req).then((body) => {
      if (body.token_hash !== "valid-invite") return send(res, 403, { code: 403, error_code: "otp_expired", msg: "Token has expired or is invalid" });
      const sub = "u-invitee-active";
      send(res, 200, { access_token: token(sub), refresh_token: "stub-refresh", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: sub, aud: "authenticated", role: "authenticated", email: `${sub}@example.test` } });
    });
  }

  if (url.pathname === "/auth/v1/user") {
    hits.user += 1;
    if (req.method === "PUT") hits.passwordUpdates += 1;
    const sub = subFromBearer(req);
    if (!sub) return send(res, 401, { code: 401, msg: "invalid token" });
    return send(res, 200, {
      id: sub,
      aud: "authenticated",
      role: "authenticated",
      email: `${sub}@example.test`,
      app_metadata: { provider: "email" },
      user_metadata: {},
      created_at: "2026-01-01T00:00:00Z",
    });
  }
  if (url.pathname.startsWith("/auth/v1/")) return send(res, 204);

  if (url.pathname === "/rest/v1/profiles") {
    hits.profiles += 1;
    const id = (url.searchParams.get("id") ?? "").replace(/^eq\./, "");
    const p = PROFILES[id];
    const row = p
      ? {
          id,
          email: `${id}@example.test`,
          full_name: "Test user",
          role: p.role,
          is_active: p.is_active,
          organization_id: null,
          county: null,
          district: null,
          phone: null,
          created_at: "2026-01-01T00:00:00Z",
        }
      : null;
    if (wantsObject) {
      return row
        ? send(res, 200, row)
        : send(res, 406, { code: "PGRST116", details: "The result contains 0 rows", hint: null, message: "no rows" });
    }
    return send(res, 200, row ? [row] : [], { "content-range": row ? "0-0/1" : "*/0" });
  }

  if (url.pathname.startsWith("/rest/v1/rpc/")) return send(res, 200, null);
  if (url.pathname.startsWith("/rest/v1/")) {
    if (wantsObject) return send(res, 406, { code: "PGRST116", details: "The result contains 0 rows", hint: null, message: "no rows" });
    return send(res, 200, [], { "content-range": "*/0" });
  }
  return send(res, 404, { message: "not stubbed" });
});

server.listen(STUB_PORT, "127.0.0.1", () => {
  console.log(`stub supabase listening on http://127.0.0.1:${STUB_PORT}`);
});
