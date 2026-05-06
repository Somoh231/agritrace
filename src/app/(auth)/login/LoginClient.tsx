"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AlertBanner from "@/components/shared/AlertBanner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { describeAuthFetchFailure } from "@/lib/supabase/env";
import { track } from "@/lib/analytics/client";

function LogoMark() {
  return (
    <div className="h-10 w-10 rounded-xl bg-forest-700 grid place-items-center shadow-sm">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 4c-7 1-12 6-13 13 7-1 12-6 13-13Z"
          stroke="#c4edcb"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M7 17c2-3 6-7 10-9"
          stroke="#c4edcb"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function LoginClient() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirectTo") || "/national-operations";

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
      router.push(creds?.redirect ?? redirectTo);
      router.refresh();
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Sign-in failed.";
      setError(describeAuthFetchFailure(raw));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--surface-muted))] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[380px]">
        <div className="av-card p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div className="min-w-0">
              <div className="font-display text-lg text-ink-900 leading-tight">Agrivault</div>
              <div className="text-[12px] text-slate-600">
                Agricultural traceability platform · Liberia
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {error ? <AlertBanner severity="danger" message={error} /> : null}

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1.5">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputMode="email"
                autoComplete="email"
                placeholder="name@organization.org"
                className="av-input"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1.5">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="av-input"
              />
            </div>

            <button
              type="button"
              onClick={() => onSignIn()}
              disabled={isLoading || !email || !password}
              className="av-btn-primary h-12 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>

            <div className="pt-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                Try Demo Roles
              </div>
              <div className="grid grid-cols-1 gap-2">
                <DemoRoleButton
                  title="Ministry Officer"
                  subtitle="Rice dashboard + reports"
                  onClick={() =>
                    onSignIn({
                      email: "demo-ministry@agritrace.demo",
                      password: "DemoPass!2026",
                      redirect: "/national-operations",
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
                  title="Field Agent"
                  subtitle="Mobile field entry"
                  onClick={() =>
                    onSignIn({
                      email: "demo-field@agritrace.demo",
                      password: "DemoPass!2026",
                      redirect: "/field",
                    })
                  }
                />
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Run <span className="font-mono">npm run seed:demo</span> to create these demo users.
              </div>
            </div>

            <div className="pt-1 text-[11px] text-slate-500">
              For first-time setup: create a user in Supabase Auth, then insert a matching row
              in <span className="font-mono">profiles</span>.
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-[11px] text-slate-400 font-mono">
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
      className="w-full text-left rounded-xl border border-gray-200 bg-white px-3 py-2.5 hover:bg-gray-50"
    >
      <div className="text-[12px] font-medium text-ink-900">{title}</div>
      <div className="text-[11px] text-slate-600">{subtitle}</div>
    </button>
  );
}

