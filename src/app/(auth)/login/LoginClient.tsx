"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import AlertBanner from "@/components/shared/AlertBanner";
import { LoginAccountNote, LoginShell } from "@/app/(auth)/login/LoginShell";
import { postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { ACCOUNT_UNAVAILABLE_PATH, roleFromProfile } from "@/lib/auth/profile-access";
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
          const role = roleFromProfile(prof);
          destination = role ? postLoginHomeForRole(role) : ACCOUNT_UNAVAILABLE_PATH;
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

  // Presentation only below.
  const field =
    "block h-12 w-full rounded-[12px] border border-[rgb(var(--av-line)/0.22)] bg-white px-4 text-[1rem] text-[rgb(var(--av-forest))] outline-none transition-colors placeholder:text-[rgb(var(--av-slate)/0.7)] focus:border-[rgb(var(--av-emerald-ink))] focus:ring-2 focus:ring-[rgb(var(--av-emerald)/0.25)]";

  return (
    <LoginShell>
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
          <input
            id="operator-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            className={field}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="avs-btn avs-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <LoginAccountNote />

      <p className="mt-8 text-[0.9375rem] text-[rgb(var(--av-slate))]">
        New to AgriVault?{" "}
        <Link href="/" className="avs-link text-[rgb(var(--av-forest))]">
          Visit the AgriVault Data website
        </Link>
      </p>
    </LoginShell>
  );
}
