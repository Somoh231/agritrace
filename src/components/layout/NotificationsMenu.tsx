"use client";

import * as React from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  href?: string;
  tone: "info" | "warning" | "danger";
  createdAt: string;
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

function toneChip(tone: NotificationItem["tone"]): { label: string; cls: string } {
  if (tone === "danger") return { label: "Critical", cls: "border-rose-900/45 bg-rose-950/25 text-rose-100" };
  if (tone === "warning") return { label: "Warning", cls: "border-amber-900/45 bg-amber-950/20 text-amber-100" };
  return { label: "Watch", cls: "border-slate-700/70 bg-slate-950/25 text-slate-200" };
}

function readKey(userId: string) {
  return `agrivault-notifications-read:${userId}`;
}

export default function NotificationsMenu() {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [reload, setReload] = React.useState(0);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [readSet, setReadSet] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: auth } = await supabase.auth.getUser();
        const id = auth.user?.id ?? null;
        if (!cancelled) setUserId(id);
        if (!id) return;
        try {
          const raw = window.localStorage.getItem(readKey(id));
          const parsed = raw ? (JSON.parse(raw) as string[]) : [];
          if (!cancelled) setReadSet(new Set(Array.isArray(parsed) ? parsed : []));
        } catch {
          if (!cancelled) setReadSet(new Set());
        }
      } catch {
        if (!cancelled) setUserId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        setError(null);
        setIsLoading(true);

        // Pull operational sources (latest 20 max combined). RLS governs visibility.
        const [events, dao, stock, donor, dist] = await Promise.all([
          supabase
            .from("pilot_operational_events")
            .select("event_code,occurred_at,severity,county,event_type,message,status")
            .order("occurred_at", { ascending: false })
            .limit(20),
          supabase
            .from("pilot_dao_officers")
            .select("dao_code,county,overdue_reports,compliance_score,status,last_activity")
            .order("overdue_reports", { ascending: false })
            .limit(12),
          supabase
            .from("warehouse_stock")
            .select("warehouse_id,quantity,expiry_date,loss_flag,theft_flag")
            .limit(120),
          supabase
            .from("donor_shipments")
            .select("donor_name,programme_code,quantity,received_at,created_at")
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("distribution_logs")
            .select("distributed_at,channel,quantity")
            .order("distributed_at", { ascending: false })
            .limit(8),
        ]);

        const next: NotificationItem[] = [];

        // Events
        for (const r of (events.data as any[]) ?? []) {
          const tone =
            String(r.severity ?? "").toUpperCase() === "HIGH" || String(r.status ?? "").toLowerCase() === "escalated"
              ? "danger"
              : String(r.severity ?? "").toUpperCase() === "MEDIUM"
                ? "warning"
                : "info";
          next.push({
            id: `evt:${String(r.event_code ?? r.occurred_at)}`,
            title: `${String(r.event_type ?? "Operational event")} · ${String(r.county ?? "National")}`,
            detail: String(r.message ?? "—"),
            href: "/alerts",
            tone,
            createdAt: String(r.occurred_at ?? new Date().toISOString()),
          });
        }

        // DAO overdue
        for (const d of ((dao.data as any[]) ?? []).filter((x) => Number(x.overdue_reports ?? 0) > 0).slice(0, 6)) {
          next.push({
            id: `dao:${String(d.dao_code)}`,
            title: `DAO overdue reports · ${String(d.dao_code)} (${String(d.county ?? "—")})`,
            detail: `Overdue ${Number(d.overdue_reports ?? 0)} · compliance ${Number(d.compliance_score ?? 0)}% · status ${String(d.status ?? "—")}`,
            href: "/field-agents",
            tone: Number(d.overdue_reports ?? 0) >= 3 ? "danger" : "warning",
            createdAt: d.last_activity ? new Date(String(d.last_activity)).toISOString() : new Date().toISOString(),
          });
        }

        // Warehouse low stock + expiry risk (heuristics)
        const lowCount = ((stock.data as any[]) ?? []).filter((s) => {
          const q = Number(s.quantity ?? 0);
          return q > 0 && q < 500;
        }).length;
        if (lowCount > 0) {
          next.push({
            id: "wh:low-stock",
            title: "Warehouse low stock signals detected",
            detail: `${lowCount} stock lines below threshold (heuristic). Review inventory command for SKUs at risk.`,
            href: "/inventory",
            tone: lowCount >= 12 ? "danger" : "warning",
            createdAt: new Date().toISOString(),
          });
        }

        const now = Date.now();
        const horizon = 90 * 86400000;
        const expCount = ((stock.data as any[]) ?? []).filter((s) => {
          if (!s.expiry_date) return false;
          const t = new Date(String(s.expiry_date)).getTime();
          return Number.isFinite(t) && t >= now && t - now < horizon;
        }).length;
        if (expCount > 0) {
          next.push({
            id: "wh:expiry",
            title: "Expiry risk window (90d)",
            detail: `${expCount} stock lines within 90-day expiry window (as available).`,
            href: "/inventory/expiry",
            tone: expCount >= 10 ? "warning" : "info",
            createdAt: new Date().toISOString(),
          });
        }

        // Donor shipments received
        for (const s of (donor.data as any[]) ?? []) {
          next.push({
            id: `donor:${String(s.created_at ?? s.received_at)}`,
            title: `Donor shipment received · ${String(s.donor_name ?? "Donor")}`,
            detail: `${String(s.programme_code ?? "Programme")} · qty ${String(s.quantity ?? "—")} · received ${String(s.received_at ?? "—")}`,
            href: "/donor-dashboard",
            tone: "info",
            createdAt: String(s.created_at ?? new Date().toISOString()),
          });
        }

        // Subsidy verification pending (recent distributions present)
        if (((dist.data as any[]) ?? []).length) {
          const latest = (dist.data as any[])[0];
          next.push({
            id: `subsidy:${String(latest.distributed_at ?? "recent")}`,
            title: "Subsidy verification activity",
            detail: `Latest distribution channel ${String(latest.channel ?? "—")} · qty ${String(latest.quantity ?? "—")}`,
            href: "/audit-tools",
            tone: "info",
            createdAt: String(latest.distributed_at ?? new Date().toISOString()),
          });
        }

        // Apply local read set + compute unread
        const read = readSet;
        const merged = next
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 20)
          .map((n) => ({ ...n, unread: userId ? !read.has(n.id) : false }));

        const unread = merged.filter((x) => x.unread).length;
        if (!cancelled) {
          setItems(merged);
          setUnreadCount(unread);
        }
      } catch {
        if (!cancelled) setError("Unable to load operational alerts for your current access.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, reload, readSet, userId]);

  const markAllRead = async () => {
    if (!userId) return;
    const unreadIds = items.filter((i) => i.unread).map((i) => i.id);
    if (!unreadIds.length) return;
    const next = new Set(readSet);
    unreadIds.forEach((id) => next.add(id));
    setReadSet(next);
    try {
      window.localStorage.setItem(readKey(userId), JSON.stringify([...next].slice(-500)));
    } catch {
      /* ignore */
    }
    setReload((v) => v + 1);
  };

  const markRead = async (id: string) => {
    if (!userId) return;
    if (readSet.has(id)) return;
    const next = new Set(readSet);
    next.add(id);
    setReadSet(next);
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      window.localStorage.setItem(readKey(userId), JSON.stringify([...next].slice(-500)));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 grid place-items-center hover:bg-slate-800"
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
        <div className="absolute right-0 mt-2 w-[360px] rounded-xl border border-white/10 bg-slate-950 shadow-2xl overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <div className="text-[12px] font-medium text-white">Ministry notifications</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => markAllRead()}
                className="h-8 px-2 rounded-md border border-slate-700 bg-slate-900 text-[11px] text-slate-200 hover:bg-slate-800 inline-flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
                Read
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[11px] text-slate-500 hover:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>

          <div className="max-h-[340px] overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-[12px] text-slate-400 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : error ? (
              <div className="p-3">
                <div className="rounded-lg border border-amber-900/45 bg-amber-950/15 px-3 py-2 text-[12px] text-amber-100">
                  <div className="font-medium text-white">Notifications unavailable</div>
                  <div className="mt-1 text-[11px] text-amber-100/80">{error}</div>
                  <button
                    type="button"
                    onClick={() => setReload((v) => v + 1)}
                    className="mt-2 h-8 px-3 rounded-md border border-slate-700 bg-slate-900 text-[11px] text-slate-200 hover:bg-slate-800"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-[12px] text-white font-medium">All clear</div>
                <div className="mt-1 text-[11px] text-slate-500">No operational alerts from available signals.</div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {items.map((it) => (
                  <a
                    key={it.id}
                    href={it.href ?? "#"}
                    onClick={() => markRead(it.id)}
                    className="block rounded-lg border border-white/10 bg-black/20 hover:bg-white/[0.05] px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {it.unread ? <span className="h-2 w-2 rounded-full bg-amber-500" /> : null}
                          <div className="text-[12px] font-medium text-white">{it.title}</div>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">{it.detail}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] ${toneChip(it.tone).cls}`}>{toneChip(it.tone).label}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-[10px] font-mono text-slate-500">
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

