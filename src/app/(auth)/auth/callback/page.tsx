import type { Metadata } from "next";

import AuthCallbackClient from "@/app/(auth)/auth/callback/AuthCallbackClient";

export const metadata: Metadata = {
  title: "Confirming your link",
  robots: { index: false, follow: false },
};

/**
 * Landing point for Supabase invitation, recovery and magic links. A normal
 * web page: no manifest, no service worker, no install UI.
 */
export default function AuthCallbackPage() {
  return <AuthCallbackClient />;
}
