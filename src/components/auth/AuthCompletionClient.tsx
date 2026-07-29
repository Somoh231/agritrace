"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import AlertBanner from "@/components/shared/AlertBanner";
import { postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";

export default function AuthCompletionClient() {
  const router = useRouter();
  const search = useSearchParams();
  const mode = search.get("mode") === "recovery" ? "recovery" : "invite";
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [sessionReady, setSessionReady] = React.useState<boolean | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then((result: { data: { session: Session | null } }) =>
      setSessionReady(Boolean(result.data.session)),
    );
    const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSessionReady(Boolean(session));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 12) {
      setError("Use at least 12 characters for your password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const update = await supabase.auth.updateUser({ password });
      if (update.error) throw update.error;

      const activation = await fetch("/api/auth/activate", { method: "POST" });
      const result = await activation.json().catch(() => ({}));
      if (!activation.ok) throw new Error(result.error ?? "Account activation failed.");

      if (result.multipleRoles) {
        router.replace("/workspace/select");
      } else {
        router.replace(postLoginHomeForRole(result.role as UserRole));
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Password setup failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-md rounded-2xl border border-emerald-900 bg-slate-900 p-6 shadow-2xl">
        <div className="font-display text-[22px]">
          {mode === "recovery" ? "Reset your password" : "Complete your AgriVault account"}
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
          Choose a private password. Administrators cannot see it and AgriVault never stores it in application tables.
        </p>

        {sessionReady === false ? (
          <div className="mt-5">
            <AlertBanner
              severity="danger"
              message="This setup link is invalid or expired. Ask an administrator for a new secure link."
            />
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={submit}>
            {error ? <AlertBanner severity="danger" message={error} /> : null}
            <label className="block text-[12px] text-slate-200">
              New password
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3"
              />
            </label>
            <label className="block text-[12px] text-slate-200">
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3"
              />
            </label>
            <button
              type="submit"
              disabled={!sessionReady || isSaving}
              className="h-11 w-full rounded-lg bg-emerald-700 text-[13px] font-semibold hover:bg-emerald-600 disabled:opacity-50"
            >
              {isSaving ? "Securing account…" : "Set password and continue"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
