import type { Metadata } from "next";
import { Suspense } from "react";

import SetPasswordClient from "@/app/(auth)/auth/set-password/SetPasswordClient";
import { LoginShell } from "@/app/(auth)/login/LoginShell";

export const metadata: Metadata = {
  title: "Set your password",
  robots: { index: false, follow: false },
};

/** Password setup after an invitation or recovery link. A normal web page: no PWA. */
export default function SetPasswordPage() {
  return (
    <Suspense fallback={<LoginShell title="Set your password" lead="Loading…">{null}</LoginShell>}>
      <SetPasswordClient />
    </Suspense>
  );
}
