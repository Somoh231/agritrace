"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { StatusBadge } from "@/components/enterprise";
import { getPendingCount, getSyncErrors, processSyncQueue, recordQueueClearTimestamp } from "@/lib/offline/sync-queue";

export default function SyncStatusIndicator() {
  const [online, setOnline] = React.useState<boolean>(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [pendingCount, setPendingCount] = React.useState<number>(0);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const syncingRef = React.useRef(false);

  const refresh = React.useCallback(async () => {
    try {
      const [pending, errs] = await Promise.all([getPendingCount(), getSyncErrors()]);
      setPendingCount((prev) => {
        if (prev > 0 && pending === 0) recordQueueClearTimestamp();
        return pending;
      });
      setErrors(errs);
    } catch {
      // Offline DB should never break topbar rendering
    }
  }, []);

  const runSync = React.useCallback(async () => {
    if (!online) return;
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      await processSyncQueue();
    } catch {
      // processSyncQueue already tracks retry counts; UI shows errors via getSyncErrors()
    } finally {
      syncingRef.current = false;
      await refresh();
    }
  }, [online, refresh]);

  React.useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 30_000);

    const onOnline = () => {
      setOnline(true);
      void runSync();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh, runSync]);

  React.useEffect(() => {
    if (pendingCount > 0 && online && errors.length === 0) {
      void runSync();
    }
  }, [pendingCount, online, errors.length, runSync]);

  if (errors.length > 0) {
    return (
      <>
        <button
          type="button"
          onClick={() => setReviewOpen(true)}
          className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-200"
        >
          <StatusBadge tone="danger" dot>
            Sync failed
          </StatusBadge>
          <span className="font-mono text-[11px] text-slate-600">Tap to review</span>
        </button>

        {reviewOpen ?
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                  <h2 className="ent-section-title">Sync failed</h2>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">
                    Records that failed after multiple retries — review, correct, then retry sync
                  </p>
                </div>
                <button type="button" onClick={() => setReviewOpen(false)} className="btn-gov-outline h-9 px-3 text-[13px]">
                  Close
                </button>
              </div>

              <div className="p-5">
                <div className="max-h-[50vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <ul className="space-y-2">
                    {errors.map((e) => (
                      <li key={e} className="break-words font-mono text-[12px] text-slate-700">
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => void refresh()} className="btn-gov-outline h-9 px-3 text-[13px]">
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        : null}
      </>
    );
  }

  if (pendingCount === 0) {
    return (
      <div className="flex items-center gap-2">
        <StatusBadge tone="success" dot>
          Synced
        </StatusBadge>
        <span className="font-mono text-[11px] text-slate-500">No pending sync</span>
      </div>
    );
  }

  if (!online) {
    return (
      <div className="flex items-center gap-2">
        <StatusBadge tone="warning" dot>
          Offline
        </StatusBadge>
        <span className="font-mono text-[11px] text-slate-600">
          {pendingCount} on device until connected
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" aria-hidden="true" />
      <StatusBadge tone="syncing">Pending sync · {pendingCount}</StatusBadge>
    </div>
  );
}
