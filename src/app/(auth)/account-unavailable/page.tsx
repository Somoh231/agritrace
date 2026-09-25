import type { Metadata } from "next";
import Link from "next/link";

import SignOutButton from "@/app/(auth)/account-unavailable/SignOutButton";
import { LoginShell } from "@/app/(auth)/login/LoginShell";

export const metadata: Metadata = {
  title: "Account unavailable",
  robots: { index: false, follow: false },
};

/**
 * Shown to a signed-in user who has no active AgriVault profile (missing,
 * deactivated or unreadable). Grants nothing; offers sign-out only.
 */
export default function AccountUnavailablePage() {
  return (
    <LoginShell title="Account unavailable" lead="You are signed in, but this account has no active AgriVault access.">
      <p className="avs-body mt-8 text-[1rem] leading-relaxed">
        Your organisation&rsquo;s AgriVault administrator sets up and reactivates accounts. Contact them to request
        access, then sign in again.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SignOutButton />
        <Link href="/" className="avs-link inline-flex min-h-[44px] items-center text-[rgb(var(--av-forest))]">
          Visit the AgriVault Data website
        </Link>
      </div>
    </LoginShell>
  );
}
