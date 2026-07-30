import { redirect } from "next/navigation";

import DashboardShell from "@/components/layout/DashboardShell";
import PlatformProviders from "@/platform/providers";
import { normalizeMinistryNavRole } from "@/lib/navigation/ministry-nav";
import { createClient } from "@/lib/supabase/server";
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-950">Operator profile required</h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Your identity is authenticated, but it is not linked to an active Ministry operator
            profile. Access remains blocked until an administrator assigns your role and
            jurisdiction.
          </p>
          <a
            href="/login?error=profile_required"
            className="mt-4 inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Return to sign in
          </a>
        </div>
      </div>
    );
  }
  const effectiveProfile: Profile = profile;

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

  const profileCore = { ...effectiveProfile, role: normalizeMinistryNavRole(effectiveProfile.role) };

  return (
    <PlatformProviders>
      <DashboardShell profile={profileCore}>
        {children}
      </DashboardShell>
    </PlatformProviders>
  );
}
