"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function HealthActions() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setBusy(true);
        router.refresh();
        setTimeout(() => setBusy(false), 400);
      }}
      className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
    >
      {busy ? "Re-running…" : "Re-run checks"}
    </button>
  );
}

