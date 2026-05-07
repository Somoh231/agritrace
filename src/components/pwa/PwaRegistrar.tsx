"use client";

import * as React from "react";

import { useToast } from "@/components/shared/toast/ToastProvider";

export default function PwaRegistrar() {
  const toast = useToast();

  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator)) return;

      const onLoad = () => {
        void (async () => {
          try {
            const reg = await navigator.serviceWorker.register("/sw.js");
            console.info("[pwa] service worker registered", reg.scope);
          } catch (e) {
            console.error("[pwa] service worker registration failed", e);
            toast.info("Offline mode", "Service worker registration failed — offline caching may be limited.");
          }
        })();
      };

      window.addEventListener("load", onLoad, { once: true });
      return () => window.removeEventListener("load", onLoad);
    } catch (e) {
      console.error("[pwa] registrar init failed", e);
    }
  }, [toast]);

  return null;
}

