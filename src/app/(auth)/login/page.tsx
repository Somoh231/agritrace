import * as React from "react";
import { Suspense } from "react";

import LoginClient from "@/app/(auth)/login/LoginClient";
import { LoginFormPlaceholder, LoginShell } from "@/app/(auth)/login/LoginShell";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        // Same chrome as the client page, so the prerendered HTML is complete while the form loads.
        <LoginShell>
          <LoginFormPlaceholder />
        </LoginShell>
      }
    >
      <LoginClient />
    </Suspense>
  );
}

