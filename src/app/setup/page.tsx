import { createClient } from "@/lib/supabase/server";
import { isValidHttpUrl } from "@/lib/supabase/env";
import CopyButton from "@/components/shared/CopyButton";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-xl border border-gray-200 bg-gray-50 p-4 overflow-auto text-[11px] font-mono text-gray-800">
      {children}
    </pre>
  );
}

export default async function SetupPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mapbox = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const supabaseConfigured = Boolean(supabaseAnon) && isValidHttpUrl(supabaseUrl);

  let profilesCount: number | null = null;
  let profilesError: string | null = null;
  let userId: string | null = null;

  if (supabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;

      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      if (error) profilesError = error.message;
      profilesCount = count ?? 0;
    } catch (e) {
      profilesError = e instanceof Error ? e.message : "Failed to query profiles.";
    }
  }

  const missingEnv = [
    !isValidHttpUrl(supabaseUrl) ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !supabaseAnon ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
    !mapbox ? "NEXT_PUBLIC_MAPBOX_TOKEN" : null,
    !serviceRole ? "SUPABASE_SERVICE_ROLE_KEY (only for seed)" : null,
  ].filter(Boolean) as string[];

  const bootstrapSql = userId
    ? `-- Run in Supabase SQL editor after creating the user in Auth
insert into public.profiles (id, full_name, role, organization_id, county, phone)
values ('${userId}', 'System Admin', 'super_admin', null, null, null);`
    : `-- 1) Create a user in Supabase Auth (email/password)
-- 2) Copy the user's UUID from Authentication → Users
-- 3) Paste it below
insert into public.profiles (id, full_name, role, organization_id, county, phone)
values ('<AUTH_USER_UUID>', 'System Admin', 'super_admin', null, null, null);`;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="font-display text-[20px] text-gray-900">First-time setup</div>
          <div className="mt-1 text-[12px] text-gray-600">
            Configure environment, run schema, and bootstrap the first super admin.
          </div>
          <div className="mt-4 flex gap-2">
            <a
              href="/health"
              className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 inline-flex items-center"
            >
              Go to /health
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="font-display text-[16px] text-gray-900">1) Environment variables</div>
          <div className="mt-2 text-[12px] text-gray-700">
            Edit this file:
            <div className="mt-2">
              <CodeBlock>{`agritrace/.env.local`}</CodeBlock>
            </div>
            Add real values:
            <div className="mt-2">
              <CodeBlock>{`NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
SUPABASE_SERVICE_ROLE_KEY=<service-role>   # needed for npm run seed only
NEXT_PUBLIC_MAPBOX_TOKEN=<mapbox-token>
NEXT_PUBLIC_APP_URL=http://localhost:3000`}</CodeBlock>
            </div>
            {missingEnv.length ? (
              <div className="mt-2 text-[12px] text-amber-800">
                Missing right now: <span className="font-mono">{missingEnv.join(", ")}</span>
              </div>
            ) : (
              <div className="mt-2 text-[12px] text-green-700">Env looks present.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="font-display text-[16px] text-gray-900">2) Database schema</div>
          <div className="mt-2 text-[12px] text-gray-700">
            Run these SQL files in the Supabase SQL editor (in order):
            <div className="mt-2">
              <CodeBlock>{`1) agritrace/src/lib/supabase/schema.sql
2) agritrace/src/lib/supabase/schema.enterprise.sql
3) agritrace/src/lib/supabase/schema.integrity.sql
4) agritrace/src/lib/supabase/schema.demo_inquiries.sql
5) agritrace/src/lib/supabase/schema.analytics.sql
6) agritrace/src/lib/supabase/schema.notifications.sql`}</CodeBlock>
            </div>
            <div className="mt-2 text-[12px] text-gray-500 leading-relaxed">
              Notes: integrity enables inventory + discrepancies + approvals; inquiries powers{" "}
              <span className="font-mono">/request-demo</span>; analytics powers{" "}
              <span className="font-mono">/admin/analytics</span>; notifications v2 powers the bell menu.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="font-display text-[16px] text-gray-900">3) Super admin bootstrap</div>
          <div className="mt-2 text-[12px] text-gray-700 leading-relaxed">
            {profilesError ? (
              <div className="text-red-700">Profiles check failed: {profilesError}</div>
            ) : profilesCount != null ? (
              <div>
                Detected <span className="font-mono">{profilesCount}</span> rows in{" "}
                <span className="font-mono">profiles</span>.
                {profilesCount === 0 ? (
                  <div className="mt-1 text-amber-800">
                    No profiles exist yet. Create the first super admin row using the SQL below.
                  </div>
                ) : (
                  <div className="mt-1 text-green-700">Bootstrap not required.</div>
                )}
              </div>
            ) : (
              <div className="text-gray-600">Supabase not configured yet.</div>
            )}

            <div className="mt-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                  SQL snippet
                </div>
                <CopyButton text={bootstrapSql} label="Copy SQL" />
              </div>
              <CodeBlock>{bootstrapSql}</CodeBlock>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="font-display text-[16px] text-gray-900">4) Seed demo data (optional)</div>
          <div className="mt-2 text-[12px] text-gray-700">
            After schema is applied and service role key is set:
            <div className="mt-2">
              <CodeBlock>{`cd agritrace
npm run seed:demo`}</CodeBlock>
            </div>
            This will also create demo Auth users for the “Try Demo Roles” buttons on{" "}
            <span className="font-mono">/login</span>.
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="font-display text-[16px] text-gray-900">Next manual steps</div>
          <div className="mt-2 text-[12px] text-gray-700 leading-relaxed">
            <ol className="list-decimal pl-5 space-y-1">
              <li>Create Supabase project</li>
              <li>Add environment variables</li>
              <li>Run schema.sql</li>
              <li>Create first auth user</li>
              <li>Run admin profile SQL</li>
              <li>Add Mapbox token</li>
              <li>Replace Liberia GeoJSON</li>
              <li>Restart dev server</li>
            </ol>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="font-display text-[16px] text-gray-900">Deployment notes</div>
          <div className="mt-2 text-[12px] text-gray-700 leading-relaxed">
            Key launch docs live in the repo root:
            <div className="mt-2">
              <CodeBlock>{`agritrace/README.md\nagritrace/DEMO_SCRIPT.md`}</CodeBlock>
            </div>
            Recommended final checks:
            <div className="mt-2">
              <CodeBlock>{`/health\n/admin/launch-readiness\n/demo`}</CodeBlock>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

