"use client";

import * as React from "react";

import { usePwaInstall } from "@/components/pwa/install-prompt-context";

function bool(n: boolean | null | undefined) {
  if (n === true) return "yes";
  if (n === false) return "no";
  return "…";
}

/**
 * Shown only in production builds. Collapsed by default; for pilot PWA verification (Chrome Application tab).
 */
export default function PwaDiagnosticsPanel() {
  const { deferredPrompt, beforeInstallPromptCaptured, installed } = usePwaInstall();
  const [open, setOpen] = React.useState(false);
  const [manifestOk, setManifestOk] = React.useState<boolean | null>(null);
  const [manifestMime, setManifestMime] = React.useState<string | null>(null);
  const [iconChecks, setIconChecks] = React.useState<Record<string, "ok" | "fail" | "pending">>({});
  const [swReg, setSwReg] = React.useState(false);
  const [controlling, setControlling] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (process.env.NODE_ENV !== "production") return;
    try {
      const r = await fetch("/manifest.webmanifest", { cache: "no-store" });
      setManifestOk(r.ok);
      setManifestMime(r.headers.get("content-type"));
      if (!r.ok) return;
      const j = (await r.json()) as { icons?: { src: string }[] };
      const icons = j.icons ?? [];
      const next: Record<string, "ok" | "fail" | "pending"> = {};
      for (const ic of icons) {
        if (typeof ic.src !== "string") continue;
        next[ic.src] = "pending";
      }
      setIconChecks(next);
      await Promise.all(
        icons.map(async (ic) => {
          if (typeof ic.src !== "string") return;
          try {
            const ir = await fetch(ic.src, { method: "HEAD", cache: "no-store" });
            setIconChecks((prev) => ({ ...prev, [ic.src]: ir.ok ? "ok" : "fail" }));
          } catch {
            setIconChecks((prev) => ({ ...prev, [ic.src]: "fail" }));
          }
        }),
      );
    } catch {
      setManifestOk(false);
    }

    try {
      const reg = await navigator.serviceWorker?.getRegistration?.();
      setSwReg(Boolean(reg?.active));
    } catch {
      setSwReg(false);
    }
    setControlling(Boolean(navigator.serviceWorker?.controller));
  }, []);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    void refresh();
    const id = window.setInterval(() => void refresh(), 5000);
    const onCc = () => void refresh();
    navigator.serviceWorker.addEventListener("controllerchange", onCc);
    return () => {
      window.clearInterval(id);
      navigator.serviceWorker.removeEventListener("controllerchange", onCc);
    };
  }, [refresh]);

  const standalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true);

  let installability = "Checking…";
  if (standalone || installed) installability = "Installed / standalone";
  else if (deferredPrompt) installability = "Native install prompt available";
  else if (beforeInstallPromptCaptured) installability = "beforeinstallprompt seen (prompt may be consumed)";
  else installability = "Waiting (HTTPS, manifest icons, SW, engagement criteria)";

  if (process.env.NODE_ENV !== "production") return null;

  return (
    <div className="fixed bottom-3 right-3 z-[200] font-mono text-[10px] text-slate-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-slate-600 bg-slate-950/95 px-2 py-1 shadow-lg hover:bg-slate-900"
      >
        PWA
      </button>
      {open ? (
        <div className="mt-1 max-h-[min(70vh,420px)] w-[min(92vw,320px)] overflow-auto rounded-lg border border-slate-600 bg-slate-950/98 p-2 text-left shadow-xl">
          <div className="text-emerald-400/90">Production diagnostics</div>
          <ul className="mt-2 space-y-1 text-slate-300">
            <li>manifest fetch: {bool(manifestOk)}</li>
            <li>manifest content-type: {manifestMime ?? "—"}</li>
            <li>service worker registered: {bool(swReg)}</li>
            <li>service worker controlling: {bool(controlling)}</li>
            <li>beforeinstallprompt received: {bool(beforeInstallPromptCaptured)}</li>
            <li>deferred prompt in memory: {bool(deferredPrompt != null)}</li>
            <li>standalone display mode: {bool(standalone)}</li>
            <li className="border-t border-slate-800 pt-1 text-slate-200">installability: {installability}</li>
          </ul>
          {Object.keys(iconChecks).length ? (
            <div className="mt-2 border-t border-slate-800 pt-2 text-slate-400">
              <div className="text-slate-500">icons</div>
              <ul className="mt-1 space-y-0.5 break-all">
                {Object.entries(iconChecks).map(([src, st]) => (
                  <li key={src}>
                    {st === "ok" ? "✓" : st === "fail" ? "✗" : "…"} {src}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <button type="button" className="mt-2 text-emerald-400 underline" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
      ) : null}
    </div>
  );
}
