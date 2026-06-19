"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AlertBanner from "@/components/shared/AlertBanner";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import { postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { describeAuthFetchFailure } from "@/lib/supabase/env";
import { resolveUserRoleWithDemoFallback } from "@/lib/supabase/temp-demo-profile-fallback";
import { track } from "@/lib/analytics/client";

function LogoMark() {
  return (
    <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-[#0c4a21] to-[#052e16] grid place-items-center shadow-md ring-1 ring-[rgb(var(--ministry-gold))]/40">
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="rgb(var(--ministry-gold))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2C8 2 5 6 5 10c0 4 3 7 7 9 4-2 7-5 7-9 0-4-3-8-7-8z" />
        <path d="M12 2v18" />
      </svg>
    </div>
  );
}

export default function LoginClient() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectToParam = search.get("redirectTo");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

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
      let destination = creds?.redirect ?? redirectToParam ?? undefined;
      if (!destination) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
          destination = postLoginHomeForRole(resolveUserRoleWithDemoFallback(prof, user));
        }
      }
      router.push(destination ?? "/command-center");
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
            <LogoMark />
            <div className="min-w-0">
              <div className="font-serif-display text-[17px] text-white leading-tight">Operator sign-in</div>
              <div className="text-[11px] text-emerald-100/55">
                Secure access · Role-based command views
              </div>
            </div>
          </div>

          <div className="cmd-rule my-4" aria-hidden />

          <div className="space-y-3">
            {error ? <AlertBanner severity="danger" message={error} /> : null}

            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[rgb(var(--ministry-gold))]/70 mb-1.5">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputMode="email"
                autoComplete="email"
                placeholder="name@organization.org"
                className="h-11 w-full rounded-lg border border-[rgb(var(--ministry-panel-border))]/80 bg-[rgb(var(--ministry-workspace))]/60 px-3 text-[13px] text-emerald-50 placeholder:text-emerald-200/30 outline-none focus:border-[rgb(var(--ministry-gold))]/60"
              />
            </div>

            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[rgb(var(--ministry-gold))]/70 mb-1.5">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-[rgb(var(--ministry-panel-border))]/80 bg-[rgb(var(--ministry-workspace))]/60 px-3 text-[13px] text-emerald-50 placeholder:text-emerald-200/30 outline-none focus:border-[rgb(var(--ministry-gold))]/60"
              />
            </div>

            <button
              type="button"
              onClick={() => onSignIn()}
              disabled={isLoading || !email || !password}
              className="h-12 w-full rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 text-white text-[13px] font-semibold shadow-lg ring-1 ring-[rgb(var(--ministry-gold))]/30 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? "Signing in…" : "Sign in to command center"}
            </button>

            <div className="pt-2">
              <div className="cmd-kicker mb-2">
                Demo access profiles
              </div>
              <div className="grid grid-cols-1 gap-2">
                <DemoRoleButton
                  title="Ministry Officer"
                  subtitle="National command center"
                  onClick={() =>
                    onSignIn({
                      email: "demo-ministry@agritrace.demo",
                      password: "DemoPass!2026",
                      redirect: "/command-center",
                    })
                  }
                />
                <DemoRoleButton
                  title="Exporter"
                  subtitle="Lots, movements, EUDR"
                  onClick={() =>
                    onSignIn({
                      email: "demo-exporter@agritrace.demo",
                      password: "DemoPass!2026",
                      redirect: "/cocoa/lots",
                    })
                  }
                />
                <DemoRoleButton
                  title="Cooperative Manager"
                  subtitle="Farmers + lots operations"
                  onClick={() =>
                    onSignIn({
                      email: "demo-coop@agritrace.demo",
                      password: "DemoPass!2026",
                      redirect: "/cocoa/farmers",
                    })
                  }
                />
                <DemoRoleButton
                  title="District Agriculture Officer (DAO)"
                  subtitle="District operations hub"
                  onClick={() =>
                    onSignIn({
                      email: "demo-field@agritrace.demo",
                      password: "DemoPass!2026",
                      redirect: "/district-dashboard",
                    })
                  }
                />
              </div>
              <div className="mt-2 text-[11px] text-emerald-100/40">
                Run <span className="font-mono text-emerald-100/60">npm run seed:demo</span> to create these demo users.
              </div>
            </div>

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
              For first-time setup: create a user in Supabase Auth, then insert a matching row
              in <span className="font-mono text-emerald-100/60">profiles</span>.
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-[10px] text-emerald-200/40 font-mono uppercase tracking-[0.18em]">
          Secure access · Role-based views · Audit-ready outputs
        </div>
      </div>
    </div>
  );
}

function DemoRoleButton({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-lg border border-[rgb(var(--ministry-panel-border))]/70 bg-[rgb(var(--ministry-workspace))]/40 px-3 py-2.5 hover:border-[rgb(var(--ministry-gold))]/40 hover:bg-[rgb(var(--ministry-panel))]/60 transition"
    >
      <div className="text-[12px] font-medium text-white">{title}</div>
      <div className="text-[11px] text-emerald-100/50">{subtitle}</div>
    </button>
  );
}

