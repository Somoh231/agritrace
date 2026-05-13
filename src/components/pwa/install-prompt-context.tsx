"use client";

import * as React from "react";

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaInstallContextValue = {
  /** Browser install prompt (Chrome / Edge / Android Chrome) when available. */
  deferredPrompt: InstallPromptEvent | null;
  /** Fired after `appinstalled` or successful accepted install flow. */
  installed: boolean;
  /** Run OS install UI; returns result for toasts. */
  /** Run OS install UI; `in_progress` = prompt already showing (ignore duplicate taps). */
  runBrowserInstall: () => Promise<{ status: "accepted" | "dismissed" | "unavailable" | "in_progress" }>;
};

const PwaInstallContext = React.createContext<PwaInstallContextValue | null>(null);

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = React.useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState(false);
  /** Source of truth for `prompt()` — set synchronously on `beforeinstallprompt` before React re-renders. */
  const deferredRef = React.useRef<InstallPromptEvent | null>(null);
  const installInFlightRef = React.useRef(false);

  React.useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const ev = e as InstallPromptEvent;
      deferredRef.current = ev;
      setDeferredPrompt(ev);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      deferredRef.current = null;
      setDeferredPrompt(null);
      installInFlightRef.current = false;
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const runBrowserInstall = React.useCallback(async () => {
    if (installInFlightRef.current) return { status: "in_progress" as const };
    const ev = deferredRef.current;
    if (!ev) return { status: "unavailable" as const };
    installInFlightRef.current = true;
    try {
      await ev.prompt();
      const choice = await ev.userChoice;
      deferredRef.current = null;
      setDeferredPrompt(null);
      if (choice.outcome === "accepted") {
        setInstalled(true);
        return { status: "accepted" as const };
      }
      return { status: "dismissed" as const };
    } catch {
      deferredRef.current = null;
      setDeferredPrompt(null);
      return { status: "dismissed" as const };
    } finally {
      installInFlightRef.current = false;
    }
  }, []);

  const value = React.useMemo(
    () => ({
      deferredPrompt,
      installed,
      runBrowserInstall,
    }),
    [deferredPrompt, installed, runBrowserInstall],
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall(): PwaInstallContextValue {
  const ctx = React.useContext(PwaInstallContext);
  if (!ctx) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider");
  }
  return ctx;
}
