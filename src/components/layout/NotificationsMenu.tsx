"use client";

import * as React from "react";
import { Bell, CheckCheck, Loader2, Pin, TriangleAlert } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  href?: string;
  tone: "info" | "warning" | "danger";
  createdAt: string;
  pinned?: boolean;
  important?: boolean;
  unread?: boolean;
};

function formatRelative(iso: string) {
  const dt = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((Date.now() - dt) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function NotificationsMenu() {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [reload, setReload] = React.useState(0);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [tableMissing, setTableMissing] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setError(null);
      setIsLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();

        // New system: notifications + per-user reads.
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id ?? null;

        const { data, error: nErr } = await supabase
          .from("notifications")
          .select("id,title,detail,href,tone,created_at,pinned,important")
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(50);

        if (nErr) {
          if (nErr.message.includes("does not exist") || nErr.code === "42P01") {
            setTableMissing(true);
            setItems([]);
            setUnreadCount(0);
            return;
          }
          throw nErr;
        }
        setTableMissing(false);

        let readSet = new Set<string>();
        if (userId) {
          const { data: reads } = await supabase
            .from("notification_reads")
            .select("notification_id")
            .eq("user_id", userId)
            .limit(500);
          readSet = new Set(((reads as any[]) ?? []).map((r) => r.notification_id as string));
        }

        const next = ((data as any[]) ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          detail: r.detail ?? "",
          href: r.href ?? undefined,
          tone: (r.tone ?? "info") as any,
          createdAt: r.created_at ?? new Date().toISOString(),
          pinned: Boolean(r.pinned),
          important: Boolean(r.important),
          unread: userId ? !readSet.has(r.id) : false,
        })) as NotificationItem[];

        const unread = next.filter((x) => x.unread).length;
        if (!cancelled) {
          setUnreadCount(unread);
          setItems(next.slice(0, 12));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load notifications.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, reload]);

  // Keep bell unread count updated even when menu is closed (best-effort).
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id ?? null;
        if (!userId) return;

        const { data: notifs, error: nErr } = await supabase
          .from("notifications")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(50);
        if (nErr) return;

        const { data: reads } = await supabase
          .from("notification_reads")
          .select("notification_id")
          .eq("user_id", userId)
          .limit(500);
        const readSet = new Set(((reads as any[]) ?? []).map((r) => r.notification_id as string));
        const unread = ((notifs as any[]) ?? []).filter((n) => !readSet.has(n.id)).length;
        if (!cancelled) setUnreadCount(unread);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const markAllRead = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      if (!userId) return;
      const unreadIds = items.filter((i) => i.unread).map((i) => i.id);
      if (!unreadIds.length) return;
      await supabase.from("notification_reads").upsert(
        unreadIds.map((id) => ({ notification_id: id, user_id: userId, read_at: new Date().toISOString() })),
      );
      setReload((v) => v + 1);
    } catch {
      // ignore
    }
  };

  const markRead = async (id: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      if (!userId) return;
      await supabase
        .from("notification_reads")
        .upsert({ notification_id: id, user_id: userId, read_at: new Date().toISOString() } as any);
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8 rounded-md border border-gray-200 bg-white grid place-items-center text-gray-700 hover:bg-gray-50"
        aria-label="Notifications"
      >
        <div className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 rounded-full bg-amber-500 text-white text-[9px] font-mono grid place-items-center">
              {Math.min(99, unreadCount)}
            </span>
          ) : null}
        </div>
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-[340px] rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <div className="text-[12px] font-medium text-gray-900">Notifications</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => markAllRead()}
                className="h-8 px-2 rounded-md border border-gray-200 bg-white text-[11px] text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
                Read
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[11px] text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
          </div>

          <div className="max-h-[340px] overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-[12px] text-gray-600 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : tableMissing ? (
              <div className="p-3 text-[12px] text-gray-700 flex items-start gap-2">
                <TriangleAlert className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <div className="font-medium">Notifications not configured</div>
                  <div className="text-[11px] text-gray-500">
                    Run <span className="font-mono">schema.notifications.sql</span> in Supabase.
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="p-3 text-[12px] text-gray-700 flex items-start gap-2">
                <TriangleAlert className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <div className="font-medium">Couldn’t load notifications</div>
                  <div className="text-[11px] text-gray-500">{error}</div>
                  <button
                    type="button"
                    onClick={() => setReload((v) => v + 1)}
                    className="mt-2 h-8 px-3 rounded-md border border-gray-200 bg-white text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-[12px] text-gray-900 font-medium">All clear</div>
                <div className="mt-1 text-[11px] text-gray-500">
                  No alerts based on your current access.
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {items.map((it) => (
                  <a
                    key={it.id}
                    href={it.href ?? "#"}
                    onClick={() => markRead(it.id)}
                    className="block rounded-lg border border-gray-100 hover:bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {it.pinned ? <Pin className="h-3 w-3 text-amber-700" /> : null}
                          {it.unread ? <span className="h-2 w-2 rounded-full bg-amber-500" /> : null}
                          <div className="text-[12px] font-medium text-gray-900">{it.title}</div>
                        </div>
                        <div className="text-[11px] text-gray-500">{it.detail}</div>
                      </div>
                      <div
                        className={`shrink-0 text-[10px] font-mono ${
                          it.tone === "danger"
                            ? "text-red-700"
                            : it.tone === "warning"
                              ? "text-amber-700"
                              : "text-gray-400"
                        }`}
                      >
                        {formatRelative(it.createdAt)}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

