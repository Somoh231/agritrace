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
 *   u-callcenter authenticated, active "call_center_agent" profile
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
  "u-callcenter": { role: "call_center_agent", is_active: true },
};

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

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

const hits = { user: 0, profiles: 0 };

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${STUB_PORT}`);
  const accept = String(req.headers.accept ?? "");
  const wantsObject = accept.includes("application/vnd.pgrst.object+json");

  if (url.pathname === "/__stub/hits") return send(res, 200, hits);

  if (url.pathname === "/auth/v1/user") {
    hits.user += 1;
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
