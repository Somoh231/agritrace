"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import Drawer from "@/components/shared/Drawer";
import ProgressBar from "@/components/shared/ProgressBar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildDemoProfileForAuthUser } from "@/lib/supabase/temp-demo-profile-fallback";
import type { UserRole } from "@/lib/supabase/types";

type RegRow = {
  county: string;
  total_farmers: number;
  synced_from_mobile: number;
  entered_directly: number;
  with_gps: number;
  without_gps: number;
  last_registration: string | null;
};

type DupRow = {
  full_name: string;
  village: string | null;
  county: string;
  record_count: number;
  farmer_ids: string[];
  created_dates: string[];
};

type SyncLogRow = {
  device_id: string | null;
  agent_id: string | null;
  sync_type: string | null;
  records_synced: number | null;
  records_failed: number | null;
  synced_at: string | null;
};

function pct(n: number, d: number) {
  if (!d) return 0;
  return (n / d) * 100;
}

function toneForGps(p: number) {
  if (p < 70) return "red" as const;
  if (p < 85) return "amber" as const;
  return "green" as const;
}

function fmtWhen(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function reviewedKey(ids: string[]) {
  return `dup:${ids.slice().sort().join("|")}`;
}

export default function DataQualityPanel() {
  const [allowed, setAllowed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [reg, setReg] = React.useState<RegRow[]>([]);
  const [dups, setDups] = React.useState<DupRow[]>([]);
  const [syncLogs, setSyncLogs] = React.useState<SyncLogRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const [dupExpanded, setDupExpanded] = React.useState(false);
  const [selectedDup, setSelectedDup] = React.useState<DupRow | null>(null);
  const [leftFarmer, setLeftFarmer] = React.useState<any>(null);
  const [rightFarmer, setRightFarmer] = React.useState<any>(null);

  const [reviewed, setReviewed] = React.useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("agrivault-reviewed-dups");
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      return new Set(arr);
    } catch {
      return new Set();
    }
  });

  const saveReviewed = (next: Set<string>) => {
    setReviewed(next);
    try {
      localStorage.setItem("agrivault-reviewed-dups", JSON.stringify(Array.from(next)));
    } catch {
      // ignore
    }
  };

  const load = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      if (!uid) {
        setAllowed(false);
        return;
      }
      const { data: prof, error: pErr } = await supabase.from("profiles").select("role").eq("id", uid).single();
      let role: UserRole | undefined = (prof as { role?: UserRole } | null)?.role;
      if (!prof) {
        // TEMP DEMO FALLBACK — allow panel shell when profiles row is missing
        role = buildDemoProfileForAuthUser({ id: uid }).role;
      } else if (pErr) {
        throw pErr;
      }
      const ok =
        role === "super_admin" || role === "government_officer" || role === "admin"; // TEMP DEMO FALLBACK
      setAllowed(ok);
      if (!ok) return;

      const [{ data: regRows, error: rErr }, { data: dupRows, error: dErr }, { data: syncRows, error: sErr }] =
        await Promise.all([
          supabase.from("pilot_registration_summary").select("*"),
          supabase.from("potential_duplicate_farmers").select("*").limit(50),
          supabase
            .from("sync_log")
            .select("device_id,agent_id,sync_type,records_synced,records_failed,synced_at")
            .order("synced_at", { ascending: false })
            .limit(500),
        ]);

      const missing =
        (rErr && ((rErr as any).code === "42P01" || String((rErr as any).message ?? "").includes("does not exist"))) ||
        (dErr && ((dErr as any).code === "42P01" || String((dErr as any).message ?? "").includes("does not exist"))) ||
        (sErr && ((sErr as any).code === "42P01" || String((sErr as any).message ?? "").includes("does not exist")));
      if (missing) {
        setError(
          "Pilot monitoring views/tables not found in Supabase. Run the pilot monitoring SQL to enable Data Quality.",
        );
        setReg([]);
        setDups([]);
        setSyncLogs([]);
        return;
      }

      if (rErr) throw rErr;
      if (dErr) throw dErr;
      if (sErr) throw sErr;

      setReg(((regRows as any[]) ?? []) as RegRow[]);
      const filtered = (((dupRows as any[]) ?? []) as DupRow[]).filter(
        (row) => !reviewed.has(reviewedKey((row as any).farmer_ids ?? [])),
      );
      setDups(filtered);
      setSyncLogs(((syncRows as any[]) ?? []) as SyncLogRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data quality panel.");
    } finally {
      setLoading(false);
    }
  }, [reviewed]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openReview = async (row: DupRow) => {
    setSelectedDup(row);
    setLeftFarmer(null);
    setRightFarmer(null);
    try {
      const ids = (row.farmer_ids ?? []).slice(0, 2);
      if (ids.length < 2) return;
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.from("farmers").select("*").in("id", ids).limit(2);
      const arr = (data as any[]) ?? [];
      setLeftFarmer(arr.find((f) => f.id === ids[0]) ?? arr[0] ?? null);
      setRightFarmer(arr.find((f) => f.id === ids[1]) ?? arr[1] ?? null);
    } catch {
      // ignore
    }
  };

  const markReviewed = (row: DupRow) => {
    const key = reviewedKey(row.farmer_ids ?? []);
    const next = new Set(reviewed);
    next.add(key);
    saveReviewed(next);
  };

  if (!allowed) return null;

  const now = Date.now();
  const byAgent = new Map<string, SyncLogRow>();
  for (const r of syncLogs) {
    const id = r.agent_id ?? "";
    if (!id) continue;
    if (!byAgent.has(id)) byAgent.set(id, r);
  }

  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const todayKey = dayKey(today);
  const yesterdayKey = dayKey(yesterday);
  let syncedToday = 0;
  let syncedYesterday = 0;
  for (const r of syncLogs) {
    const ts = r.synced_at ? new Date(r.synced_at) : null;
    if (!ts || Number.isNaN(ts.getTime())) continue;
    const k = dayKey(ts);
    const n = Number(r.records_synced ?? 0);
    if (k === todayKey) syncedToday += n;
    if (k === yesterdayKey) syncedYesterday += n;
  }

  return (
    <div className="av-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-[16px] text-ink-900">Pilot data quality</div>
          <div className="mt-1 text-[12px] text-slate-600">
            Registration health, duplicate alerts, and sync health for the rice pilot.
          </div>
        </div>
        <button type="button" onClick={() => void load()} className="av-btn-secondary h-9 px-3">
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-3 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="av-card-muted p-4">
          <div className="font-mono text-[10px] uppercase tracking-[2px] text-slate-500">
            Registration health
          </div>
          {loading ? (
            <div className="mt-3 text-[12px] text-slate-600">Loading…</div>
          ) : reg.length === 0 ? (
            <div className="mt-3 text-[12px] text-slate-600">No data yet.</div>
          ) : (
            <div className="mt-3 space-y-3">
              {reg.map((r) => {
                const total = Math.max(1, r.total_farmers ?? 0);
                const gpsPct = pct(r.with_gps ?? 0, total);
                const mobilePct = pct(r.synced_from_mobile ?? 0, total);
                const directPct = pct(r.entered_directly ?? 0, total);
                return (
                  <div key={r.county} className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] font-medium text-ink-900">{r.county}</div>
                      <div className="font-mono text-[11px] text-slate-600">
                        {Intl.NumberFormat("en-US").format(r.total_farmers ?? 0)} farmers
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>GPS coverage</span>
                        <span className="font-mono">{gpsPct.toFixed(0)}%</span>
                      </div>
                      <div className="mt-1">
                        <ProgressBar valuePct={gpsPct} tone={toneForGps(gpsPct)} />
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <div className="font-mono text-[10px] text-slate-500">Mobile</div>
                        <div className="font-mono text-[11px] text-ink-900">{mobilePct.toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] text-slate-500">Direct</div>
                        <div className="font-mono text-[11px] text-ink-900">{directPct.toFixed(0)}%</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-600">
                      <span className="font-mono text-[10px] text-slate-500">Last registration</span>
                      <div className="font-mono text-[11px] text-ink-900">{fmtWhen(r.last_registration)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="av-card-muted p-4">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[2px] text-slate-500">Duplicate alerts</div>
            <button
              type="button"
              onClick={() => setDupExpanded((v) => !v)}
              className="av-btn-secondary h-8 px-2"
            >
              {dupExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-[12px] text-slate-600">Potential duplicates detected</div>
            <div className="font-mono text-[12px] text-ink-900">{dups.length}</div>
          </div>

          {dupExpanded ? (
            <div className="mt-3 space-y-2 max-h-[320px] overflow-auto pr-1">
              {dups.length === 0 ? (
                <div className="text-[12px] text-slate-600">No duplicate signals.</div>
              ) : (
                dups.map((d) => (
                  <div key={reviewedKey(d.farmer_ids ?? [])} className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[12px] font-medium text-ink-900 truncate">{d.full_name}</div>
                        <div className="text-[11px] text-slate-600">
                          {d.village ?? "—"} · {d.county} · {d.record_count} records
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <button type="button" onClick={() => void openReview(d)} className="av-btn-secondary h-8 px-2">
                          Review
                        </button>
                        <button type="button" onClick={() => markReviewed(d)} className="av-btn-secondary h-8 px-2">
                          Mark reviewed
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </section>

        <section className="av-card-muted p-4">
          <div className="font-mono text-[10px] uppercase tracking-[2px] text-slate-500">Sync health</div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="font-mono text-[10px] text-slate-500">Synced today</div>
              <div className="font-display text-[18px] text-ink-900">{Intl.NumberFormat("en-US").format(syncedToday)}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="font-mono text-[10px] text-slate-500">Synced yesterday</div>
              <div className="font-display text-[18px] text-ink-900">
                {Intl.NumberFormat("en-US").format(syncedYesterday)}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2 max-h-[320px] overflow-auto pr-1">
            {Array.from(byAgent.entries()).length === 0 ? (
              <div className="text-[12px] text-slate-600">{loading ? "Loading…" : "No sync logs yet."}</div>
            ) : (
              Array.from(byAgent.entries()).map(([agentId, row]) => {
                const ts = row.synced_at ? new Date(row.synced_at).getTime() : 0;
                const ageHrs = ts ? (now - ts) / 3600000 : 9999;
                const tone = ageHrs > 48 ? "text-red-700" : ageHrs > 24 ? "text-amber-700" : "text-green-700";
                return (
                  <div key={agentId} className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] text-slate-500 truncate">Agent</div>
                        <div className="font-mono text-[11px] text-ink-900 truncate">{agentId}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`font-mono text-[11px] ${tone}`}>{fmtWhen(row.synced_at)}</div>
                        <div className="font-mono text-[10px] text-slate-500">
                          +{Number(row.records_synced ?? 0)} / -{Number(row.records_failed ?? 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <Drawer title="Duplicate review" isOpen={Boolean(selectedDup)} onClose={() => setSelectedDup(null)} widthClass="w-[720px]">
        {selectedDup ? (
          <div className="space-y-3">
            <div className="text-[12px] text-slate-600">
              {selectedDup.full_name} · {selectedDup.village ?? "—"} · {selectedDup.county}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="font-mono text-[10px] uppercase tracking-[2px] text-slate-500">Record A</div>
                <pre className="mt-2 text-[11px] text-gray-800 whitespace-pre-wrap break-words">
                  {leftFarmer ? JSON.stringify(leftFarmer, null, 2) : "Loading…"}
                </pre>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="font-mono text-[10px] uppercase tracking-[2px] text-slate-500">Record B</div>
                <pre className="mt-2 text-[11px] text-gray-800 whitespace-pre-wrap break-words">
                  {rightFarmer ? JSON.stringify(rightFarmer, null, 2) : "Loading…"}
                </pre>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedDup) markReviewed(selectedDup);
                  setSelectedDup(null);
                }}
                className="av-btn-secondary h-9 px-3"
              >
                Mark reviewed
              </button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

