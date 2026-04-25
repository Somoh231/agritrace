"use client";

export type AnalyticsEventName =
  | "page_view"
  | "demo_request_submitted"
  | "login_success"
  | "module_opened";

export async function track(event: AnalyticsEventName, payload?: Record<string, unknown>) {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload }),
      keepalive: true,
    });
  } catch {
    // analytics must never break UX
  }
}

