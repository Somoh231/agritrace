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
  toolbar: "btn-gov-outline h-9 rounded-lg px-3 text-[13px]",
  primary: "btn-emerald min-h-[44px] w-full rounded-lg px-4 text-[14px] sm:w-auto",
  compact: "btn-gov-outline h-10 min-h-[44px] rounded-lg px-3 text-[13px]",
};

export default function InstallAppButton({ className, label = "Install for offline use", variant = "toolbar" }: Props) {
  const toast = useToast();
  const { installed, runBrowserInstall, hasDeferredInstallPrompt } = usePwaInstall();
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
    let native = await runBrowserInstall();
    if (native.status === "unavailable" && hasDeferredInstallPrompt()) {
      native = await runBrowserInstall();
    }
    if (native.status === "in_progress") return;
    if (native.status === "accepted") {
      toast.success("App installed", "Agrivault Data is ready for offline field reporting and sync when connected.");
      return;
    }
    if (native.status === "dismissed") {
      toast.info("Install dismissed", "Tap Install again when you are ready, or wait for the install option to return.");
      return;
    }
    if (native.status === "unavailable") {
      if (hasDeferredInstallPrompt()) return;
      setGuideOpen(true);
    }
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
