import * as React from "react";
import { Suspense } from "react";

import LoginClient from "@/app/(auth)/login/LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F7F2] lg:bg-[linear-gradient(90deg,#07152D_48.8%,#F7F7F2_48.8%)]" />}>
      <LoginClient />
    </Suspense>
  );
}

