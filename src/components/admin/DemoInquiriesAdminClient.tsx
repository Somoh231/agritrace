"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import AlertBanner from "@/components/shared/AlertBanner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DemoInquiry, DemoInquiryStatus } from "@/lib/supabase/types";
import { formatDateTime } from "@/lib/utils/formatters";

const STATUSES: DemoInquiryStatus[] = ["new", "contacted", "closed"];

export default function DemoInquiriesAdminClient() {
  const [rows, setRows] = React.useState<DemoInquiry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tableMissing, setTableMissing] = React.useState(false);
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: qErr } = await supabase
        .from("demo_inquiries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (qErr) {
        if (qErr.message.includes("does not exist") || qErr.code === "42P01") {
          setTableMissing(true);
          setRows([]);
          return;
        }
        throw qErr;
      }
      setTableMissing(false);
      setRows((data as DemoInquiry[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inquiries.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const saveRow = async (id: string, status: DemoInquiryStatus, admin_notes: string) => {
    setSavingId(id);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: uErr } = await supabase
        .from("demo_inquiries")
        .update({ status, admin_notes: admin_notes.trim() || null } as any)
        .eq("id", id);
      if (uErr) throw uErr;
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setSavingId(null);
    }
  };

  if (tableMissing) {
    return (
      <div className="max-w-2xl">
        <AlertBanner
          severity="warning"
          message="Run agritrace/src/lib/supabase/schema.demo_inquiries.sql in the Supabase SQL editor to enable demo inquiries."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[18px] text-gray-900">Demo & contact inquiries</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Submissions from the public Request demo form. Super admin only.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error ? <AlertBanner severity="danger" message={error} /> : null}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 flex items-center gap-2 text-[12px] text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-[13px] text-gray-600">
          No inquiries yet. Share the public Request demo link from the marketing site.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <InquiryCard key={r.id} row={r} saving={savingId === r.id} onSave={saveRow} />
          ))}
        </div>
      )}
    </div>
  );
}

function InquiryCard({
  row,
  saving,
  onSave,
}: {
  row: DemoInquiry;
  saving: boolean;
  onSave: (id: string, status: DemoInquiryStatus, notes: string) => void;
}) {
  const [status, setStatus] = React.useState<DemoInquiryStatus>(row.status);
  const [notes, setNotes] = React.useState(row.admin_notes ?? "");

  React.useEffect(() => {
    setStatus(row.status);
    setNotes(row.admin_notes ?? "");
  }, [row.id, row.status, row.admin_notes]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-medium text-gray-900">{row.full_name}</div>
          <div className="text-[12px] text-forest-700">{row.email}</div>
          <div className="mt-1 text-[11px] text-gray-500 font-mono">{formatDateTime(row.created_at)}</div>
        </div>
        <span
          className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md border ${
            row.status === "new"
              ? "bg-amber-50 text-amber-900 border-amber-200"
              : row.status === "contacted"
                ? "bg-blue-50 text-blue-800 border-blue-200"
                : "bg-gray-50 text-gray-600 border-gray-200"
          }`}
        >
          {row.status}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-gray-700">
        {row.organization ? (
          <div>
            <span className="text-gray-400">Organization · </span>
            {row.organization}
          </div>
        ) : null}
        {row.phone ? (
          <div>
            <span className="text-gray-400">Phone · </span>
            {row.phone}
          </div>
        ) : null}
      </div>
      {row.message ? (
        <p className="mt-3 text-[12px] text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{row.message}</p>
      ) : null}

      <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DemoInquiryStatus)}
            className="h-9 w-full max-w-[200px] rounded-md border border-gray-200 px-2 text-[12px]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-[2] min-w-0">
          <label className="block font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1">
            Internal notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-200 p-2 text-[12px]"
            placeholder="Call notes, next follow-up…"
          />
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(row.id, status, notes)}
          className="h-9 px-4 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800 disabled:opacity-50 shrink-0"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
