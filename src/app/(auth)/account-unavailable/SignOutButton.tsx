"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Ends the session and returns to sign-in (same calls as the workspace menu's sign-out). */
export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const signOut = async () => {
    setBusy(true);
    try {
      await getSupabaseBrowserClient().auth.signOut();
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <button type="button" onClick={() => void signOut()} disabled={busy} className="avs-btn avs-btn-primary disabled:opacity-60">
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
