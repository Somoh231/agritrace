"use client";

export type AnalyticsEventName =
  | "page_view"
  | "cta_click"
  | "demo_request_submitted"
  | "experiment_exposure"
  | "login_success"
  | "module_opened";

export async function track(event: AnalyticsEventName, payload?: Record<string, unknown>) {
  try {
    const path =
      typeof window !== "undefined" ? `${window.location.pathname}${window.location.search ?? ""}` : undefined;
    const endpoint = path ? `/api/analytics?path=${encodeURIComponent(path)}` : "/api/analytics";
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload }),
      keepalive: true,
    });
  } catch {
    // analytics must never break UX
  }
}

