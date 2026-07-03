import * as React from "react";
import { Suspense } from "react";

import LoginClient from "@/app/(auth)/login/LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-[rgb(var(--ministry-workspace))]" />}>
      <LoginClient />
    </Suspense>
  );
}

