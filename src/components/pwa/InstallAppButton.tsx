"use client";

import * as React from "react";

import InstallAppGuide, { detectInstallSurface } from "@/components/pwa/InstallAppGuide";
import { usePwaInstall } from "@/components/pwa/install-prompt-context";
import { useToast } from "@/components/shared/toast/ToastProvider";

type Props = {
  className?: string;
  /** Button label — keep short for toolbars. */
  label?: string;
  variant?: "toolbar" | "primary" | "compact";
};

const variantClass: Record<NonNullable<Props["variant"]>, string> = {
  toolbar:
    "h-9 px-3 rounded-lg border border-slate-600 bg-slate-950 text-[12px] font-medium text-slate-200 hover:bg-slate-900",
  primary:
    "min-h-[48px] w-full px-4 rounded-xl bg-emerald-600 text-[15px] font-semibold text-white shadow-sm hover:bg-emerald-500 active:scale-[0.99] sm:w-auto",
  compact:
    "h-10 min-h-[44px] px-3 rounded-lg border border-white/15 bg-white/5 text-[13px] font-medium text-slate-100 hover:bg-white/10",
};

export default function InstallAppButton({ className, label = "Install for offline use", variant = "toolbar" }: Props) {
  const toast = useToast();
  const { installed, runBrowserInstall } = usePwaInstall();
  const [guideOpen, setGuideOpen] = React.useState(false);

  const isStandalone = () =>
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true);

  const onClick = async () => {
    const surface = detectInstallSurface();
    if (surface === "installed" || installed || isStandalone()) {
      toast.info("Already installed", "Open Agrivault Data from your home screen or app list.");
      return;
    }
    // Prefer native prompt whenever `beforeinstallprompt` was captured (ref-backed in provider).
    const native = await runBrowserInstall();
    if (native.status === "in_progress") return;
    if (native.status === "accepted") {
      toast.success("App installed", "Agrivault Data is ready for offline field reporting and sync when connected.");
      return;
    }
    if (native.status === "dismissed") {
      toast.info("Install dismissed", "Tap Install again when you are ready, or wait for the install option to return.");
      return;
    }
    // No deferred prompt: iOS / unsupported / prompt not offered yet — show manual steps only.
    setGuideOpen(true);
  };

  const mergedClass = className ? `${variantClass[variant]} ${className}` : variantClass[variant];

  return (
    <>
      <button type="button" className={mergedClass} onClick={() => void onClick()}>
        {label}
      </button>
      <InstallAppGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
