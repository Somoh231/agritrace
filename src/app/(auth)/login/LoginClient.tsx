"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import AlertBanner from "@/components/shared/AlertBanner";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import { AgriVaultLockup } from "@/components/site/AgriVaultMark";
import { Topo } from "@/components/site/Topo";
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
import { siteFontVariables } from "@/lib/site/fonts";

export default function LoginClient() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectToParam = search.get("redirectTo");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

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

  // Presentation only below. Sign-in, readiness checks and redirects above are unchanged.
  const field =
    "block h-12 w-full rounded-[12px] border border-[rgb(var(--av-line)/0.22)] bg-white px-4 text-[1rem] text-[rgb(var(--av-forest))] outline-none transition-colors placeholder:text-[rgb(var(--av-slate)/0.7)] focus:border-[rgb(var(--av-emerald-ink))] focus:ring-2 focus:ring-[rgb(var(--av-emerald)/0.25)]";

  return (
    <div className={`avs ${siteFontVariables} min-h-screen`}>
      <main className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Brand panel */}
        <section
          aria-label="AgriVault"
          className="avs-surface-navy avs-on-dark avs-grain relative isolate flex flex-col justify-between gap-12 overflow-hidden px-6 py-8 sm:px-10 lg:min-h-screen lg:px-14 lg:py-12"
        >
          <Topo lines={18} seed={6} stroke="#9AA7B8" opacity={0.08} emphasis={11} className="-z-10" />
          <Link href="/" className="inline-flex min-h-[44px] w-fit items-center rounded-md" aria-label="AgriVault Data — home">
            <AgriVaultLockup tone="light" size={28} />
          </Link>
          <div className="hidden lg:block">
            <p className="avs-label text-[rgb(var(--av-gold))]">AgriVault operations platform</p>
            <p className="avs-h2 mt-6 max-w-[16ch]">
              One operational record, from the field to the <span className="avs-accent">national</span> view.
            </p>
            <ul className="mt-10 space-y-3 text-[1rem] text-white/75">
              {["Access scoped to your role and geography", "Every decision recorded in the audit ledger", "Field capture that works offline"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span aria-hidden="true" className="h-px w-5 bg-[rgb(var(--av-mint))]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="avs-meta hidden uppercase tracking-[0.12em] text-white/55 lg:block">
            Programme context · Liberia Agricultural Intelligence Programme
          </p>
        </section>

        {/* Sign-in */}
        <section aria-labelledby="signin-title" className="avs-surface-paper flex items-center justify-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-[420px]">
            <h1 id="signin-title" className="avs-h2 text-[clamp(2rem,3vw,2.5rem)]">
              Sign in
            </h1>
            <p className="avs-body mt-3">For programme staff with an AgriVault account.</p>

            <form
              className="mt-8 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void onSignIn();
              }}
            >
              {error ? <AlertBanner severity="danger" message={error} /> : null}

              <div>
                <label htmlFor="operator-email" className="mb-2 block text-[0.9375rem] font-medium">
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
                  className={field}
                />
              </div>

              <div>
                <label htmlFor="operator-password" className="mb-2 block text-[0.9375rem] font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="operator-password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className={`${field} pr-20`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-pressed={showPassword}
                    aria-controls="operator-password"
                    className="absolute inset-y-0 right-1 my-1 min-w-[44px] rounded-[10px] px-3 text-[0.875rem] font-medium text-[rgb(var(--av-slate))] hover:bg-[rgb(var(--av-sand))] hover:text-[rgb(var(--av-forest))]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="avs-btn avs-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-[0.9375rem] leading-relaxed text-[rgb(var(--av-slate))]">
              Accounts are issued by invitation from an authorised AgriVault administrator. Forgot your password or
              locked out? Ask your administrator to send a secure reset link — administrators never see or set your
              password.
            </p>

            <div className="avs-surface-sand mt-8 rounded-[var(--av-radius)] p-5">
              <p className="font-medium">Using AgriVault in the field?</p>
              <p className="avs-body mt-1.5 text-[0.9375rem]">
                Install the app on this device for offline reporting and GPS capture. Drafts stay on the device until you
                are back online.
              </p>
              <div className="mt-4">
                <InstallAppButton variant="primary" label="Install for offline use" className="w-full justify-center" />
              </div>
            </div>

            <p className="mt-8 text-[0.9375rem] text-[rgb(var(--av-slate))]">
              New to AgriVault?{" "}
              <Link href="/" className="avs-link text-[rgb(var(--av-forest))]">
                Visit the AgriVault Data website
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
