"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { getPendingCount, getSyncErrors, processSyncQueue } from "@/lib/offline/sync-queue";

export default function SyncStatusIndicator() {
  const [online, setOnline] = React.useState<boolean>(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [pendingCount, setPendingCount] = React.useState<number>(0);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const syncingRef = React.useRef(false);

  const refresh = React.useCallback(async () => {
    try {
      const [pending, errs] = await Promise.all([getPendingCount(), getSyncErrors()]);
      setPendingCount(pending);
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

  // State 4 — Sync errors
  if (errors.length > 0) {
    return (
      <>
        <button
          type="button"
          onClick={() => setReviewOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-gray-50"
        >
          <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
          <span className="font-mono text-[10px] text-red-700">Sync failed · tap to review</span>
        </button>

        {reviewOpen ? (
          <div className="fixed inset-0 z-[130] bg-black/30 flex items-center justify-center px-4">
            <div className="w-full max-w-[640px] rounded-2xl border border-gray-200 bg-white shadow-lift overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-[16px] text-ink-900">Sync failed</div>
                  <div className="mt-1 font-mono text-[10px] text-slate-500">
                    Records that failed after multiple retries — review, correct, then retry sync
                  </div>
                </div>
                <button type="button" onClick={() => setReviewOpen(false)} className="av-btn-secondary h-9 px-3">
                  Close
                </button>
              </div>

              <div className="p-5">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 max-h-[50vh] overflow-auto">
                  <ul className="space-y-2">
                    {errors.map((e) => (
                      <li key={e} className="font-mono text-[11px] text-gray-800 break-words">
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => void refresh()} className="av-btn-secondary h-9 px-3">
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  // State 1 — All synced
  if (pendingCount === 0) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
        <span className="font-mono text-[10px] text-green-600">Synced</span>
      </div>
    );
  }

  // State 3 — Offline with pending records
  if (!online) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-gray-400" aria-hidden="true" />
        <span className="font-mono text-[10px] text-gray-500">
          Pending sync · {pendingCount} on device until connected
        </span>
      </div>
    );
  }

  // State 2 — Pending records (online)
  return (
    <div className="flex items-center gap-1.5">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" aria-hidden="true" />
      <span className="font-mono text-[10px] text-amber-700">Pending sync · {pendingCount}</span>
    </div>
  );
}

