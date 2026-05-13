"use client";

import * as React from "react";
import { Share2, PlusSquare, X } from "lucide-react";

export type InstallGuideSurface =
  | "desktop-chrome-edge"
  | "android-chrome"
  | "ios-safari"
  | "unsupported"
  | "installed";

export function detectInstallSurface(): InstallGuideSurface {
  if (typeof window === "undefined") return "unsupported";
  const mq = window.matchMedia("(display-mode: standalone)");
  if (mq.matches) return "installed";
  if ((navigator as unknown as { standalone?: boolean }).standalone === true) return "installed";

  const ua = navigator.userAgent;
  const isIOSDevice =
    /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !/Edg/i.test(ua);
  const isEdge = /Edg/i.test(ua);

  if (isIOSDevice) return "ios-safari";
  if (isAndroid && isChrome) return "android-chrome";
  if (!isIOSDevice && !isAndroid && (isChrome || isEdge)) return "desktop-chrome-edge";
  return "unsupported";
}

function headline(surface: InstallGuideSurface): string {
  switch (surface) {
    case "desktop-chrome-edge":
      return "Install on this computer";
    case "android-chrome":
      return "Install on this phone";
    case "ios-safari":
      return "Add to Home Screen (iPhone / iPad)";
    case "installed":
      return "App already on this device";
    default:
      return "Install for offline field use";
  }
}

function bodyText(surface: InstallGuideSurface): string {
  switch (surface) {
    case "desktop-chrome-edge":
      return "Click Install App to open Agrivault Data as a desktop application for offline reporting and faster return visits.";
    case "android-chrome":
      return "Tap Install App to add Agrivault Data to your home screen for offline field reporting, GPS boundary capture, and sync when connectivity returns.";
    case "ios-safari":
      return "Use the steps below to add Agrivault Data to your Home Screen. Safari is required for the best install experience on iPhone and iPad.";
    case "installed":
      return "You are already using the installed view. Field drafts and the offline queue stay on this device until you are back online.";
    default:
      return "Use Chrome on Android or Chrome / Edge on a computer for the best offline installation experience. You can still sign in and use drafts in the browser.";
  }
}

export default function InstallAppGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [surface, setSurface] = React.useState<InstallGuideSurface>("unsupported");

  React.useEffect(() => {
    if (!open) return;
    setSurface(detectInstallSurface());
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="install-guide-title">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-700 bg-slate-950 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400/90">Offline field operations</p>
            <h2 id="install-guide-title" className="mt-1 text-lg font-semibold text-white">
              {headline(surface)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4 text-[14px] leading-relaxed text-slate-300 sm:px-5">
          <p>{bodyText(surface)}</p>

          {surface === "ios-safari" ? (
            <ol className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-[13px] text-slate-200">
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-950 text-emerald-300">
                  <Share2 className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="font-medium text-white">1.</span> Tap the <strong className="text-white">Share</strong> button at the bottom of Safari (square with an arrow).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-950 text-emerald-300">
                  <PlusSquare className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="font-medium text-white">2.</span> Scroll and tap <strong className="text-white">Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-950 text-emerald-300 font-semibold text-[12px]">3</span>
                <span>
                  <span className="font-medium text-white">3.</span> Confirm the name, then open Agrivault Data from your home screen for offline-ready reporting.
                </span>
              </li>
            </ol>
          ) : null}

          <p className="text-[12px] text-slate-500">
            Designed for low-connectivity environments: drafts stay on the device and sync when the connection is stable.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-11 min-w-[100px] rounded-lg bg-emerald-600 px-4 text-[14px] font-medium text-white hover:bg-emerald-500 sm:h-10">
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
