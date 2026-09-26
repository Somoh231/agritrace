"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { LoginShell } from "@/app/(auth)/login/LoginShell";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const MIN_LENGTH = 10;

type Phase = "checking" | "ready" | "no-session" | "saving";

/**
 * Sets the account password for a user who arrived through an invitation or
 * recovery link (session already established by /auth/callback), then enters
 * the platform. Access is still decided there: an account an administrator has
 * not activated yet lands on the account-unavailable page.
 */
export default function SetPasswordClient() {
  const flow = useSearchParams().get("flow") === "recovery" ? "recovery" : "invite";
  const [phase, setPhase] = React.useState<Phase>("checking");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getSupabaseBrowserClient()
      .auth.getUser()
      .then((res: { data: { user: unknown } }) => {
        if (!cancelled) setPhase(res.data.user ? "ready" : "no-session");
      })
      .catch(() => {
        if (!cancelled) setPhase("no-session");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const problem =
    password.length > 0 && password.length < MIN_LENGTH
      ? `Use at least ${MIN_LENGTH} characters.`
      : confirm.length > 0 && confirm !== password
        ? "The two passwords do not match."
        : null;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_LENGTH || password !== confirm) {
      setError(problem ?? `Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    setError(null);
    setPhase("saving");
    const { error: e } = await getSupabaseBrowserClient().auth.updateUser({ password });
    if (e) {
      setError(e.message || "The password could not be saved. Try a different one.");
      setPhase("ready");
      return;
    }
    window.location.replace("/app");
  };

  const title = flow === "recovery" ? "Choose a new password" : "Set up your account";
  const lead =
    flow === "recovery"
      ? "Choose a new password for your AgriVault account."
      : "Choose a password to finish accepting your invitation.";

  if (phase === "checking") {
    return (
      <LoginShell title={title} lead={lead}>
        <p className="avs-body mt-8" aria-live="polite">
          Checking your invitation…
        </p>
      </LoginShell>
    );
  }

  if (phase === "no-session") {
    return (
      <LoginShell title="Link needed" lead="Open this page from your invitation or password email.">
        <p className="avs-body mt-8 text-[1rem] leading-relaxed" data-testid="set-password-no-session">
          Your link may have expired. Ask your organisation&rsquo;s AgriVault administrator to send a new invitation.
        </p>
        <Link href="/login" className="avs-btn avs-btn-primary mt-8">
          Go to sign in
        </Link>
      </LoginShell>
    );
  }

  const field =
    "block h-12 w-full rounded-[12px] border border-[rgb(var(--av-line)/0.22)] bg-white px-4 text-[1rem] text-[rgb(var(--av-forest))] outline-none transition-colors placeholder:text-[rgb(var(--av-slate)/0.7)] focus:border-[rgb(var(--av-emerald-ink))] focus:ring-2 focus:ring-[rgb(var(--av-emerald)/0.25)]";

  return (
    <LoginShell title={title} lead={lead}>
      <form className="mt-8 space-y-5" onSubmit={(e) => void onSubmit(e)} noValidate data-testid="set-password-form">
        {error ? (
          <p role="alert" className="rounded-[12px] border border-[rgb(var(--av-rust)/0.4)] bg-[rgb(var(--av-rust)/0.06)] px-4 py-3 text-[0.9375rem] text-[rgb(var(--av-rust))]">
            {error}
          </p>
        ) : null}
        <div>
          <label htmlFor="new-password" className="mb-2 block text-[0.9375rem] font-medium">
            New password
          </label>
          <input
            id="new-password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-help"
            className={field}
          />
          <p id="password-help" className="mt-2 text-[0.875rem] text-[rgb(var(--av-slate))]">
            At least {MIN_LENGTH} characters.
          </p>
        </div>
        <div>
          <label htmlFor="confirm-password" className="mb-2 block text-[0.9375rem] font-medium">
            Confirm password
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={Boolean(problem)}
            className={field}
          />
          {problem ? <p className="mt-2 text-[0.875rem] text-[rgb(var(--av-rust))]">{problem}</p> : null}
        </div>
        <button
          type="submit"
          disabled={phase === "saving"}
          className="avs-btn avs-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {phase === "saving" ? "Saving…" : flow === "recovery" ? "Save new password" : "Set password and continue"}
        </button>
      </form>
    </LoginShell>
  );
}
