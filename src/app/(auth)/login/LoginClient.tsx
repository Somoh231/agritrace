"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AlertBanner from "@/components/shared/AlertBanner";
import MinistryBrandLogo from "@/components/brand/MinistryBrandLogo";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import {
  assessOperationalAccess,
  type AccessRoleAssignment,
  INACTIVE_ACCOUNT_MESSAGE,
  INCOMPLETE_PROFILE_MESSAGE,
  NO_AUTHORIZED_ROLE_MESSAGE,
} from "@/lib/auth/access-readiness";
import { postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { safeInternalRedirect } from "@/lib/auth/safe-redirect";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { describeAuthFetchFailure } from "@/lib/supabase/env";
import { track } from "@/lib/analytics/client";

export default function LoginClient() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectToParam = search.get("redirectTo");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const reason = search.get("error");
    if (reason === "profile_required" || reason === "profile_incomplete") {
      setError(INCOMPLETE_PROFILE_MESSAGE);
    } else if (reason === "account_inactive") {
      setError(INACTIVE_ACCOUNT_MESSAGE);
    } else if (reason === "role_required") {
      setError(NO_AUTHORIZED_ROLE_MESSAGE);
    }
  }, [search]);

  const onSignIn = async (creds?: { email: string; password: string; redirect?: string }) => {
    setError(null);
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const nextEmail = creds?.email ?? email;
      const nextPassword = creds?.password ?? password;
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: nextEmail,
        password: nextPassword,
      });
      if (signInError) {
        setError(describeAuthFetchFailure(signInError.message));
        return;
      }
      track("login_success", { email_domain: nextEmail.split("@")[1] ?? "" });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Sign-in completed without a usable session. Please retry.");
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role,is_active,account_status,access_transition_status,organization_id,county,district,clan_or_field_area,deactivated_at,suspended_at")
        .eq("id", user.id)
        .maybeSingle();
      const [roleResult, warehouseResult] = await Promise.all([
        supabase
          .from("profile_role_assignments")
          .select("role,is_primary,starts_at,expires_at,ended_at")
          .eq("profile_id", user.id)
          .is("ended_at", null),
        supabase
          .from("warehouse_assignments")
          .select("warehouse_id", { count: "exact", head: true })
          .eq("profile_id", user.id),
      ]);
      const readiness =
        profileError || roleResult.error || warehouseResult.error
          ? null
          : assessOperationalAccess(
              {
                ...profile,
                has_warehouse_assignment: (warehouseResult.count ?? 0) > 0,
              },
              (roleResult.data ?? []) as AccessRoleAssignment[],
            );
      if (!readiness?.ok) {
        await supabase.auth.signOut();
        setError(readiness?.message ?? INCOMPLETE_PROFILE_MESSAGE);
        return;
      }
      const roleHome = readiness.multipleRoles ? "/workspace/select" : postLoginHomeForRole(readiness.role);
      const destination = safeInternalRedirect(creds?.redirect ?? redirectToParam, roleHome);
      router.replace(destination);
      router.refresh();
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Sign-in failed.";
      setError(describeAuthFetchFailure(raw));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-[rgb(var(--ministry-workspace))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 500px at 50% -10%, rgba(52,211,153,0.10), transparent 60%), radial-gradient(700px 400px at 50% 110%, rgba(201,162,75,0.08), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-[400px]">
        <div className="text-center mb-5">
          <div className="mx-auto mb-4 flex justify-center">
            <MinistryBrandLogo variant="brand" className="mx-auto" priority />
          </div>
          <div className="cmd-kicker">Ministry of Agriculture · Liberia</div>
          <div className="mt-2 font-serif-display text-[30px] leading-none text-white">
            AgriVault <span className="text-[rgb(var(--ministry-gold))]">Data</span>
          </div>
          <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-200/50">
            National Agricultural Intelligence Platform
          </div>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--ministry-gold))]/15 bg-[rgb(var(--ministry-panel))]/55 backdrop-blur-sm p-6 sm:p-7 shadow-2xl">
          <div className="flex items-center gap-3">
            <MinistryBrandLogo variant="seal" size="lg" />
            <div className="min-w-0">
              <div className="font-serif-display text-[17px] text-white leading-tight">Operator sign-in</div>
              <div className="text-[11px] text-emerald-100/55">
                Secure access · Role-based command views
              </div>
            </div>
          </div>

          <div className="cmd-rule my-4" aria-hidden />

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void onSignIn();
            }}
          >
            {error ? <AlertBanner severity="danger" message={error} /> : null}

            <div>
              <label
                htmlFor="operator-email"
                className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[rgb(var(--ministry-gold))]/70 mb-1.5"
              >
                Email
              </label>
              <input
                id="operator-email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputMode="email"
                autoComplete="email"
                placeholder="name@organization.org"
                className="h-11 w-full rounded-lg border border-[rgb(var(--ministry-panel-border))]/80 bg-[rgb(var(--ministry-workspace))]/60 px-3 text-[13px] text-emerald-50 placeholder:text-emerald-200/30 outline-none focus:border-[rgb(var(--ministry-gold))]/60"
              />
            </div>

            <div>
              <label
                htmlFor="operator-password"
                className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[rgb(var(--ministry-gold))]/70 mb-1.5"
              >
                Password
              </label>
              <input
                id="operator-password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-[rgb(var(--ministry-panel-border))]/80 bg-[rgb(var(--ministry-workspace))]/60 px-3 text-[13px] text-emerald-50 placeholder:text-emerald-200/30 outline-none focus:border-[rgb(var(--ministry-gold))]/60"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="h-12 w-full rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 text-white text-[13px] font-semibold shadow-lg ring-1 ring-[rgb(var(--ministry-gold))]/30 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? "Signing in…" : "Sign in to command center"}
            </button>

            <div className="cmd-surface px-4 py-4">
              <div className="text-[13px] font-semibold text-white">Using AgriVault in the field?</div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-emerald-100/55">
                Install the app on this device for offline reporting and GPS capture. Drafts stay on the device until you are back online.
              </p>
              <div className="mt-3">
                <InstallAppButton variant="primary" label="Install for Offline Use" className="w-full justify-center" />
              </div>
            </div>

            <div className="pt-1 text-[11px] text-emerald-100/40">
              First-time users receive a secure invitation from an authorized AgriVault administrator.
              Passwords are chosen privately and are never visible in the administration workspace.
            </div>
          </form>
        </div>

        <div className="mt-4 text-center text-[10px] text-emerald-200/40 font-mono uppercase tracking-[0.18em]">
          Secure access · Role-based views · Audit-ready outputs
        </div>
      </div>
    </div>
  );
}
