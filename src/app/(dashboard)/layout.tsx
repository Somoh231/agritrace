import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/layout/DashboardShell";
import PlatformProviders from "@/platform/providers";
import { applyWorkspaceDemoRoleToProfile, WORKSPACE_DEMO_ROLE_COOKIE } from "@/lib/auth/workspace-demo-role";
import { normalizeMinistryNavRole } from "@/lib/navigation/ministry-nav";
import { createClient } from "@/lib/supabase/server";
import { buildDemoProfileForAuthUser } from "@/lib/supabase/temp-demo-profile-fallback";
import type { Profile } from "@/lib/supabase/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  try {
    supabase = await createClient();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Supabase is not configured.";
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-xl p-5">
          <div className="font-display text-lg text-gray-900">Setup required</div>
          <div className="mt-2 text-[12px] text-gray-600 leading-relaxed">
            {message} Add real values to <span className="font-mono">.env.local</span>:
            <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-3 font-mono text-[11px] text-gray-700">
              NEXT_PUBLIC_SUPABASE_URL=https://…<br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=…<br />
              SUPABASE_SERVICE_ROLE_KEY=… (seed script only)
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <a
              href="/login"
              className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800 inline-flex items-center"
            >
              Go to login
            </a>
          </div>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  // TEMP DEMO FALLBACK — missing profiles row: use synthetic profile instead of blocking.
  const effectiveProfile: Profile = profile ?? buildDemoProfileForAuthUser(user);

  if (effectiveProfile.is_active === false) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-xl p-5">
          <div className="font-display text-lg text-gray-900">Account deactivated</div>
          <div className="mt-2 text-[12px] text-gray-600 leading-relaxed">
            Your account is currently deactivated. Contact a system administrator to restore
            access.
          </div>
          <div className="mt-4 flex gap-2">
            <a
              href="/login"
              className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 inline-flex items-center"
            >
              Back to login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // `/admin/*` access is enforced by `admin/layout.tsx` (role guard), admin APIs, and sidebar visibility.

  const cookieStore = await cookies();
  const workspacePreviewCookie = cookieStore.get(WORKSPACE_DEMO_ROLE_COOKIE)?.value ?? null;
  const profileCore = { ...effectiveProfile, role: normalizeMinistryNavRole(effectiveProfile.role) };
  const authenticRole = profileCore.role;
  const workspaceProfile = applyWorkspaceDemoRoleToProfile(profileCore, workspacePreviewCookie);

  return (
    <PlatformProviders>
      <DashboardShell profile={workspaceProfile} authenticRole={authenticRole}>
        {children}
      </DashboardShell>
    </PlatformProviders>
  );
}

