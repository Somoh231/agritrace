"use client";

import * as React from "react";

import DataTable from "@/components/shared/DataTable";
import Drawer from "@/components/shared/Drawer";
import StatusPill from "@/components/shared/StatusPill";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { seasonLabel } from "@/lib/utils/rice";

type ReportRow = {
  id: string;
  report_code: string;
  title: string;
  period_label: string;
  generated_at: string;
  status: "draft" | "final";
  pdf_url: string | null;
};

function year() {
  return new Date().getFullYear();
}

export default function MinistryReportsTable() {
  const [rows, setRows] = React.useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isNewOpen, setIsNewOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("reports")
        .select("id, report_code, title, period_label, generated_at, status, pdf_url")
        .order("generated_at", { ascending: false })
        .limit(200);
      setRows((data as any) ?? []);
    } catch {
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const columns = [
    {
      key: "report_code",
      label: "Report ID",
      width: "130px",
      render: (v: unknown) => <span className="font-mono text-[11px]">{String(v ?? "")}</span>,
    },
    { key: "title", label: "Title", width: "220px" },
    { key: "period_label", label: "Period", width: "140px" },
    {
      key: "generated_at",
      label: "Generated",
      width: "120px",
      render: (v: unknown) => (
        <span className="font-mono text-[11px] text-gray-600">{String(v ?? "").slice(0, 10)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: "90px",
      render: (v: unknown) =>
        v === "final" ? (
          <StatusPill status="ok" label="Final" />
        ) : (
          <StatusPill status="neutral" label="Draft" />
        ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "140px",
      render: (_: unknown, row: Record<string, unknown>) => {
        const status = row.status as string;
        const pdfUrl = row.pdf_url as string | null;
        return (
          <div className="flex items-center gap-2">
            {status === "final" && pdfUrl ? (
              <a
                className="text-[12px] underline underline-offset-2"
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
              >
                PDF
              </a>
            ) : (
              <button type="button" className="text-[12px] underline underline-offset-2">
                Edit
              </button>
            )}
            <button type="button" className="text-[12px] underline underline-offset-2">
              CSV
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      <div className="space-y-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between">
          <div>
            <div className="font-display text-[16px] text-gray-900">Ministry reports</div>
            <div className="text-[12px] text-gray-500">
              Official PDF/CSV exports (Phase 4).
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsNewOpen(true)}
            className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800"
          >
            Generate new report
          </button>
        </div>

        <DataTable
          columns={columns}
          data={isLoading ? [] : (rows as any)}
          emptyMessage={isLoading ? "Loading…" : "No reports yet."}
        />

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="font-mono text-[9px] uppercase tracking-[2px] text-gray-400">
            Export
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                const res = await fetch("/api/reports/rice", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ format: "pdf", season: seasonLabel() }),
                });
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `rice-report-${seasonLabel()}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="h-9 px-3 rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800"
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={async () => {
                const res = await fetch("/api/reports/rice", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ format: "csv", season: seasonLabel() }),
                });
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `rice-report-${seasonLabel()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="h-9 px-3 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <Drawer title="Generate report" isOpen={isNewOpen} onClose={() => setIsNewOpen(false)}>
        <div className="space-y-3">
          <div className="text-[12px] text-gray-600">
            This creates a draft report record. PDF/CSV generation is implemented in Phase 4.
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
              Report type
            </div>
            <select className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-[12px]">
              <option>Production summary</option>
              <option>Food security gap</option>
              <option>Post-harvest loss</option>
              <option>Import substitution</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                From
              </div>
              <input type="date" className="h-9 w-full rounded-md border border-gray-200 px-2 text-[12px]" />
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                To
              </div>
              <input type="date" className="h-9 w-full rounded-md border border-gray-200 px-2 text-[12px]" />
            </div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1">
              Notes
            </div>
            <textarea className="min-h-20 w-full rounded-md border border-gray-200 px-2 py-2 text-[12px]" />
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                const supabase = getSupabaseBrowserClient();
                const seq = Math.floor(Math.random() * 900 + 100);
                await supabase.from("reports").insert({
                  report_code: `RPT-MOA-${year()}-${String(seq).padStart(5, "0")}`,
                  title: `Production summary · ${seasonLabel()}`,
                  period_label: seasonLabel(),
                  status: "draft",
                } as any);
              } finally {
                setIsNewOpen(false);
                load();
              }
            }}
            className="h-9 w-full rounded-md bg-forest-700 text-white text-[12px] hover:bg-forest-800"
          >
            Create draft
          </button>
        </div>
      </Drawer>
    </div>
  );
}

