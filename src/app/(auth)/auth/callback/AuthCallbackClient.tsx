"use client";

import * as React from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

import { LoginShell } from "@/app/(auth)/login/LoginShell";

type State = "working" | "expired" | "failed" | "empty";

const PASSWORD_FLOWS = new Set(["invite", "recovery"]);

/**
 * Completes sign-in from an emailed link, then sends the user to set a password
 * (invitation / recovery) or into the platform. Handles the three link shapes
 * Supabase produces: session tokens in the fragment (dashboard invites and the
 * default templates), `?token_hash=&type=` (OTP templates) and `?code=` (PKCE).
 * Tokens are only passed to Supabase, never logged or stored elsewhere, and the
 * URL is cleaned before navigating on.
 */
export default function AuthCallbackClient() {
  const [state, setState] = React.useState<State>("working");

  React.useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const read = (k: string) => hash.get(k) ?? query.get(k);
    const clearUrl = () => window.history.replaceState(null, "", "/auth/callback");

    const error = read("error");
    const errorCode = read("error_code");
    if (error || errorCode) {
      clearUrl();
      setState(errorCode === "otp_expired" ? "expired" : "failed");
      return;
    }

    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const tokenHash = query.get("token_hash");
    const code = query.get("code");
    const type = read("type") ?? "";

    if (!(accessToken && refreshToken) && !tokenHash && !code) {
      setState("empty");
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
      // Own instance: this page alone consumes the link, exactly once.
      { isSingleton: false, auth: { detectSessionInUrl: false } },
    );

    void (async () => {
      let failed = false;
      try {
        if (accessToken && refreshToken) {
          const { error: e } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          failed = Boolean(e);
        } else if (tokenHash) {
          const { error: e } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: (type || "email") as EmailOtpType });
          failed = Boolean(e);
        } else if (code) {
          const { error: e } = await supabase.auth.exchangeCodeForSession(code);
          failed = Boolean(e);
        }
      } catch {
        failed = true;
      }
      clearUrl();
      if (failed) {
        setState("failed");
        return;
      }
      const next = PASSWORD_FLOWS.has(type) ? `/auth/set-password?flow=${type}` : "/app";
      window.location.replace(next);
    })();
  }, []);

  const copy: Record<State, { title: string; lead: string; body?: string }> = {
    working: { title: "Confirming your link", lead: "One moment while we check your invitation." },
    expired: {
      title: "This link has expired",
      lead: "Invitation and password links work once and expire after a short time.",
      body: "Ask your organisation's AgriVault administrator to send a new invitation.",
    },
    failed: {
      title: "We couldn't confirm this link",
      lead: "It may already have been used, or copied incompletely.",
      body: "Open the link again from your email, or ask your administrator for a new invitation.",
    },
    empty: {
      title: "Nothing to confirm",
      lead: "This page completes invitation and password links.",
      body: "If you were invited to AgriVault, open the link in your invitation email.",
    },
  };
  const c = copy[state];

  return (
    <LoginShell title={c.title} lead={c.lead}>
      <div className="mt-8" aria-live="polite">
        {state === "working" ? (
          <p className="avs-body text-[1rem]" data-testid="auth-callback-working">
            Checking…
          </p>
        ) : (
          <>
            <p className="avs-body text-[1rem] leading-relaxed" data-testid={`auth-callback-${state}`}>
              {c.body}
            </p>
            <Link href="/login" className="avs-btn avs-btn-primary mt-8">
              Go to sign in
            </Link>
          </>
        )}
      </div>
    </LoginShell>
  );
}
