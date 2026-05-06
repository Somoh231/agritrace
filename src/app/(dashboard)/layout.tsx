import { redirect } from "next/navigation";

import DashboardShell from "@/components/layout/DashboardShell";
import { createClient } from "@/lib/supabase/server";
import {
  buildDemoProfileForAuthUser,
  TEMP_DEMO_FALLBACK_PROFILE_ENABLED,
} from "@/lib/supabase/temp-demo-profile-fallback";
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
    .single<Profile>();

  // TEMP DEMO FALLBACK — optional synthetic profile when DB row missing (disable after trigger verified).
  let effectiveProfile: Profile | null = profile;
  if (!effectiveProfile && TEMP_DEMO_FALLBACK_PROFILE_ENABLED) {
    effectiveProfile = buildDemoProfileForAuthUser(user);
  }
  if (!effectiveProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-xl p-5">
          <div className="font-display text-lg text-gray-900">Profile provisioning</div>
          <div className="mt-2 text-[12px] text-gray-600 leading-relaxed">
            Your account is authenticated but no <span className="font-mono">profiles</span> row was found.
            Run migrations (including <span className="font-mono">handle_new_user</span> trigger) or ask an administrator
            to create your profile.
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-3 font-mono text-[11px] text-gray-700">
            User id: {user.id}
          </div>
        </div>
      </div>
    );
  }

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

  // Hard guard: only super_admin can access /admin/*
  // (API routes already enforce this too.)
  // This keeps the UX clean during demos.
  // Note: pathname isn't available in layout; guard implemented by middleware + API and sidebar hiding.

  return <DashboardShell profile={effectiveProfile}>{children}</DashboardShell>;
}

