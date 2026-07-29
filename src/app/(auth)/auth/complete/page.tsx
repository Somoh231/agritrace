import { Suspense } from "react";

import AuthCompletionClient from "@/components/auth/AuthCompletionClient";

export default function AuthCompletePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
          <div className="mx-auto max-w-md rounded-2xl border border-emerald-900 bg-slate-900 p-6">
            Validating secure link…
          </div>
        </main>
      }
    >
      <AuthCompletionClient />
    </Suspense>
  );
}
