"use client";

import * as React from "react";

import { useToast } from "@/components/shared/toast/ToastProvider";

const SW_URL = "/sw.js";
const SW_SCOPE = "/";

export default function PwaRegistrar() {
  const toast = useToast();

  React.useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;
    let registration: ServiceWorkerRegistration | null = null;

    const pingUpdate = () => {
      if (!registration) return;
      void registration.update().catch(() => {});
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") pingUpdate();
    };

    const onControllerChange = () => {
      console.log("[PWA] controllerchange");
      console.log("[PWA] controller active", navigator.serviceWorker.controller);
    };

    void (async () => {
      try {
        registration = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
        if (cancelled) return;

        console.log("[PWA] service worker registered", registration.scope);

        void pingUpdate();
        await navigator.serviceWorker.ready;
        if (cancelled) return;

        console.log("[PWA] controller active", navigator.serviceWorker.controller);

        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("focus", pingUpdate);
      } catch (e) {
        console.error("[PWA] service worker registration failed", e);
        toast.info("Offline mode", "Service worker registration failed — offline caching may be limited.");
      }
    })();

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", pingUpdate);
    };
  }, [toast]);

  return null;
}
