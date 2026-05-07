"use client";

import * as React from "react";

import { useToast } from "@/components/shared/toast/ToastProvider";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallAppButton({ className }: { className?: string }) {
  const toast = useToast();
  const [promptEvt, setPromptEvt] = React.useState<InstallPromptEvent | null>(null);

  React.useEffect(() => {
    const handler = (e: Event) => {
      // Chrome / Edge: `beforeinstallprompt` is non-standard but the only way to show an install prompt on demand.
      e.preventDefault();
      setPromptEvt(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler as any);
    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);

  if (!promptEvt) return null;

  return (
    <button
      type="button"
      className={
        className ??
        "h-9 px-3 rounded-lg border border-slate-600 bg-slate-950 text-[12px] text-slate-200 hover:bg-slate-900"
      }
      onClick={() => {
        void (async () => {
          try {
            await promptEvt.prompt();
            const res = await promptEvt.userChoice;
            if (res.outcome === "accepted") toast.success("Install started", "Agrivault will install as an offline-capable app.");
            else toast.info("Install dismissed", "You can install later from the Reporting hub.");
          } catch (e) {
            console.error("[pwa] install prompt failed", e);
            toast.error("Install failed", "This device/browser cannot install the app right now.");
          } finally {
            setPromptEvt(null);
          }
        })();
      }}
    >
      Install app
    </button>
  );
}

