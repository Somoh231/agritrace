"use client";

import * as React from "react";
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
  callCenterSubmissions,
  countyProductionPerformance,
  dataQualityAlerts,
  farmerRegistrationPipeline,
  fieldReports,
  foodSecurityIndicators,
  governanceFraming,
  inputDistributionProgress,
  inventoryTransfers,
  nationalHeroMetrics,
  offlineSyncQueue,
  postHarvestLossAlerts,
  warehouses,
  type CountyProductionRow,
} from "@/lib/demo/agriculture-pilot-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { safePct, seasonLabel } from "@/lib/utils/rice";

import { OpsCard, OpsMetric, OpsSectionTitle, OpsStatusBadge, PilotDatasetNotice } from "@/components/pilot/pilot-ui";
import ProgressBar from "@/components/shared/ProgressBar";

function targetActualPct(actualMt: number, targetMt: number) {
  return safePct(actualMt * 1000, Math.max(1, targetMt * 1000));
}

export default function NationalOperationsDashboard() {
  const season = seasonLabel();
  const [usingPilotDemo, setUsingPilotDemo] = React.useState(false);
  const [liveFarmers, setLiveFarmers] = React.useState<number | null>(null);
  const [liveProductionMt, setLiveProductionMt] = React.useState<number | null>(null);
  const [liveLossRate, setLiveLossRate] = React.useState<number | null>(null);
  const [liveCountyRows, setLiveCountyRows] = React.useState<CountyProductionRow[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const farmersRes = await supabase
          .from("farmers")
          .select("id", { count: "exact", head: true })
          .not("county", "is", null);

        const riceRes = await supabase
          .from("rice_production_records")
          .select("county, expected_yield_kg, actual_yield_kg, post_harvest_loss_kg")
          .eq("season", season);

        if (cancelled) return;

        const fc = farmersRes.error ? 0 : farmersRes.count ?? 0;
        const rows = ((riceRes.data ?? []) as any[]).map((r) => ({
          county: String(r.county ?? "Unknown"),
          expected: Number(r.expected_yield_kg ?? 0),
          actual: Number(r.actual_yield_kg ?? 0),
          loss: Number(r.post_harvest_loss_kg ?? 0),
        }));

        const useDemo = fc === 0 && rows.length === 0;
        setUsingPilotDemo(useDemo);

        if (!useDemo) {
          setLiveFarmers(fc);
          let actualKg = 0;
          let expectedKg = 0;
          let lossKg = 0;
          const byCounty = new Map<string, { p: number; t: number; l: number }>();
          for (const r of rows) {
            actualKg += r.actual;
            expectedKg += r.expected;
            lossKg += r.loss;
            const prev = byCounty.get(r.county) ?? { p: 0, t: 0, l: 0 };
            prev.p += r.actual;
            prev.t += r.expected;
            prev.l += r.loss;
            byCounty.set(r.county, prev);
          }
          const lr = safePct(lossKg, Math.max(1, expectedKg));
          setLiveProductionMt(actualKg / 1000);
          setLiveLossRate(lr);
          const mapped: CountyProductionRow[] = Array.from(byCounty.entries()).map(([county, v]) => {
            const lossPct = safePct(v.l, Math.max(1, v.t));
            const status: CountyProductionRow["status"] =
              lossPct > 14 ? "critical" : lossPct > 11 ? "warning" : "healthy";
            return {
              county,
              productionMt: v.p / 1000,
              targetMt: Math.max(v.t / 1000, 0.001),
              lossPct,
              status,
              farmersRegistered: 0,
            };
          });
          setLiveCountyRows(mapped.sort((a, b) => b.productionMt - a.productionMt));
        } else {
          setLiveFarmers(null);
          setLiveProductionMt(null);
          setLiveLossRate(null);
          setLiveCountyRows(null);
        }
      } catch {
        if (!cancelled) {
          setUsingPilotDemo(true);
          setLiveFarmers(null);
          setLiveProductionMt(null);
          setLiveLossRate(null);
          setLiveCountyRows(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [season]);

  const hero = nationalHeroMetrics;
  const farmersDisplay = liveFarmers ?? hero.registeredFarmers;
  /** Metric tonnes (illustrative pilot totals). */
  const prodMt = liveProductionMt ?? hero.domesticRiceProductionMt;
  const targetMt = hero.nationalProductionTargetMt;
  const productionProgress = targetActualPct(prodMt, targetMt);
  const lossRate = liveLossRate ?? hero.postHarvestLossRatePct;
  const countiesRanked = liveCountyRows ?? countyProductionPerformance;

  const mapboxReady = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim());

  return (
    <div className="space-y-5">
      {/* Ministry command header */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-[#0f2918] via-[#14532d] to-[#1e3a5f] px-5 py-4 text-white shadow-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-100/90">
              National Agricultural Operations
            </div>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-[26px]">
              National Agricultural Operations &amp; Intelligence Platform
            </h1>
            <p className="mt-2 max-w-[920px] text-[13px] font-normal leading-relaxed text-emerald-50/95">
              Rice pilot · {hero.countiesActivePilot} counties active ({hero.countiesReporting} counties reporting,
              expandable nationwide) · Ministry-centered AIS coordination layer.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-100/80">Status</div>
            <div className="flex flex-wrap items-center gap-2">
              <OpsStatusBadge status={usingPilotDemo ? "warning" : "healthy"} />
              <span className="text-[12px] text-emerald-50">
                {usingPilotDemo ? "Pilot demo dataset" : "Live tables contributing"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {usingPilotDemo ? <PilotDatasetNotice /> : null}

      <OpsCard dense className="border-emerald-100 bg-emerald-50/30">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">{governanceFraming.headline}</div>
        <ul className="mt-2 grid gap-1.5 text-[12px] text-slate-800 sm:grid-cols-2">
          {governanceFraming.bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#14532d]" aria-hidden />
              {b}
            </li>
          ))}
        </ul>
      </OpsCard>

      {/* Hero metrics */}
      <OpsSectionTitle kicker="Executive indicators" title="National rice pilot · operational posture" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <OpsMetric label="Registered farmers" value={Intl.NumberFormat("en-US").format(farmersDisplay)} tone="forest" />
        <OpsMetric
          label="Domestic rice production (est.)"
          value={`${Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(prodMt)} t`}
          hint={`Target ${Intl.NumberFormat("en-US").format(hero.nationalProductionTargetMt)} t`}
          tone="forest"
        />
        <OpsMetric
          label="Target vs actual"
          value={`${productionProgress.toFixed(1)}%`}
          hint="National aggregate"
          tone="navy"
        />
        <OpsMetric
          label="Input inventory coverage"
          value={`${hero.inputInventoryCoveragePct}%`}
          hint="Pilot warehouses"
          tone="amber"
        />
        <OpsMetric
          label="Counties reporting"
          value={`${hero.countiesReporting}`}
          hint={`${hero.countiesActivePilot} pilot counties`}
          tone="navy"
        />
        <OpsMetric label="Data quality score" value={`${hero.dataQualityScore}`} hint="Pilot composite" tone="forest" />
        <OpsMetric label="Post-harvest loss rate" value={`${lossRate.toFixed(1)}%`} tone={lossRate > 12 ? "amber" : "forest"} />
        <OpsMetric label="Active field officers" value={`${hero.activeFieldOfficers}`} tone="navy" />
        <OpsMetric label="Offline queue" value={`${hero.offlinePendingSync}`} hint="Pending sync" tone="amber" />
        <OpsMetric label="Call-center assisted (7d)" value={`${hero.callCenterAssistedSubmissions7d}`} tone="navy" />
        <OpsMetric
          label="Import dependency (indic.)"
          value={`${hero.importDependencyPct}%`}
          hint="Illustrative dependency lens"
          tone="rose"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <OpsCard>
            <OpsSectionTitle
              kicker="Production"
              title="County production performance"
              subtitle="Pilot-safe ranking · compares illustrative or live seasonal aggregates."
            />
            <div className="mt-3 space-y-3">
              {countiesRanked.slice(0, 10).map((c) => (
                <div key={c.county}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-slate-900">{c.county}</span>
                      <OpsStatusBadge status={c.status} />
                    </div>
                    <div className="font-mono text-[11px] text-slate-600">
                      {c.productionMt.toFixed(0)} t / {c.targetMt.toFixed(0)} t
                    </div>
                  </div>
                  <ProgressBar
                    valuePct={targetActualPct(c.productionMt, c.targetMt)}
                    tone={c.status === "critical" ? "red" : c.status === "warning" ? "amber" : "green"}
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 h-[220px]">
              <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400">Production by county (kt)</div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={countiesRanked.slice(0, 12).map((c) => ({
                    county: c.county.slice(0, 4),
                    kt: Math.round(c.productionMt),
                  }))}
                >
                  <XAxis dataKey="county" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={36} />
                  <Tooltip />
                  <Bar dataKey="kt" fill="#14532d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </OpsCard>

          <OpsCard>
            <OpsSectionTitle kicker="Registry" title="Farmer registration pipeline" />
            <div className="grid gap-3 sm:grid-cols-4">
              <OpsMetric label="Verified" value={Intl.NumberFormat().format(farmerRegistrationPipeline.verified)} tone="forest" />
              <OpsMetric
                label="Pending verification"
                value={Intl.NumberFormat().format(farmerRegistrationPipeline.pendingVerification)}
                tone="amber"
              />
              <OpsMetric label="Flagged" value={Intl.NumberFormat().format(farmerRegistrationPipeline.flagged)} tone="rose" />
              <OpsMetric
                label="Geo-tag completion"
                value={`${farmerRegistrationPipeline.geoTaggedPct}%`}
                tone="navy"
              />
            </div>
            <div className="mt-3 text-[11px] text-slate-600">
              Last national sync (illustrative): {farmerRegistrationPipeline.lastSyncHoursAgo}h ·{" "}
              <Link href="/farmers" className="font-medium text-[#14532d] underline-offset-2 hover:underline">
                Open farmer registry
              </Link>
            </div>
          </OpsCard>

          <OpsCard>
            <OpsSectionTitle kicker="Inputs" title="Input distribution progress & warehouse risk" />
            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <div className="text-[12px] font-medium text-slate-800">Fertilizer</div>
                <ProgressBar
                  valuePct={safePct(inputDistributionProgress.fertilizerDistributedMt * 1000, inputDistributionProgress.fertilizerAllocatedMt * 1000)}
                  tone="green"
                />
                <div className="mt-1 font-mono text-[11px] text-slate-600">
                  {inputDistributionProgress.fertilizerDistributedMt.toLocaleString()} /{" "}
                  {inputDistributionProgress.fertilizerAllocatedMt.toLocaleString()} t
                </div>
              </div>
              <div>
                <div className="text-[12px] font-medium text-slate-800">Rice seed</div>
                <ProgressBar
                  valuePct={safePct(inputDistributionProgress.seedDistributedMt * 1000, inputDistributionProgress.seedAllocatedMt * 1000)}
                  tone="green"
                />
                <div className="mt-1 font-mono text-[11px] text-slate-600">
                  {inputDistributionProgress.seedDistributedMt.toLocaleString()} /{" "}
                  {inputDistributionProgress.seedAllocatedMt.toLocaleString()} t
                </div>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-[12px]">
                <thead>
                  <tr className="border-b border-slate-200 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="py-2 pr-3">Warehouse</th>
                    <th className="py-2 pr-3">County</th>
                    <th className="py-2 pr-3">Seed (t)</th>
                    <th className="py-2 pr-3">Fertilizer (t)</th>
                    <th className="py-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((w) => (
                    <tr key={w.id} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium text-slate-900">{w.name}</td>
                      <td className="py-2 pr-3 text-slate-700">{w.county}</td>
                      <td className="py-2 pr-3 tabular-nums">{w.riceSeedTons}</td>
                      <td className="py-2 pr-3 tabular-nums">{w.fertilizerTons}</td>
                      <td className="py-2">
                        <OpsStatusBadge status={w.stockRisk} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link href="/inventory" className="text-[12px] font-medium text-[#14532d] underline-offset-2 hover:underline">
                Inventory &amp; inputs center →
              </Link>
            </div>
          </OpsCard>

          <OpsCard>
            <OpsSectionTitle kicker="Food security outlook" title="National intelligence snapshot (illustrative)" />
            <div className="grid gap-3 md:grid-cols-3">
              <OpsMetric
                label="Rice demand (indic.)"
                value={`${Intl.NumberFormat().format(foodSecurityIndicators.riceDemandMt)} t`}
                tone="navy"
              />
              <OpsMetric
                label="Domestic production (est.)"
                value={`${Intl.NumberFormat().format(foodSecurityIndicators.domesticProductionMt)} t`}
                tone="forest"
              />
              <OpsMetric
                label="Food security risk score"
                value={`${foodSecurityIndicators.nationalRiskScore}`}
                hint="Pilot composite · not an official classification"
                tone="amber"
              />
            </div>
            <p className="mt-3 text-[12px] text-slate-600">{foodSecurityIndicators.countyForecastNote}</p>
            <Link href="/food-security" className="mt-2 inline-block text-[12px] font-medium text-[#14532d] underline-offset-2 hover:underline">
              Food security intelligence →
            </Link>
          </OpsCard>

          <OpsCard>
            <OpsSectionTitle kicker="Exports" title="Reports ready for briefing" />
            <div className="flex flex-wrap gap-2">
              {["Cabinet brief", "County pack", "Donor utilization", "Audit trail"].map((x) => (
                <span
                  key={x}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[11px] text-slate-800"
                >
                  {x}
                </span>
              ))}
            </div>
            <Link href="/reports" className="mt-3 inline-block text-[12px] font-medium text-[#14532d] underline-offset-2 hover:underline">
              Ministry reporting center →
            </Link>
          </OpsCard>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <OpsCard>
            <OpsSectionTitle kicker="Alerts" title="Operational alerts" />
            <div className="space-y-3">
              {postHarvestLossAlerts.map((a) => (
                <div key={a.id} className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2">
                  <div className="text-[12px] font-medium text-amber-950">Loss hotspot · {a.county}</div>
                  <div className="mt-1 text-[11px] text-amber-950/90">
                    {a.lossPct}% · {a.driver}
                  </div>
                </div>
              ))}
              {dataQualityAlerts.map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-medium text-slate-900">{a.title}</span>
                    <OpsStatusBadge status={a.severity} />
                  </div>
                  {a.county ? <div className="mt-1 text-[11px] text-slate-600">{a.county}</div> : null}
                </div>
              ))}
            </div>
          </OpsCard>

          <OpsCard>
            <OpsSectionTitle kicker="Field" title="Recent field activity" />
            <ul className="space-y-2">
              {fieldReports.map((r) => (
                <li key={r.id} className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-medium text-slate-900">{r.county}</span>
                    <span className="font-mono text-[10px] uppercase text-slate-500">{r.channel.replace("_", " ")}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-600">{r.summary}</div>
                  <div className="mt-1 font-mono text-[10px] text-slate-400">{r.officer}</div>
                </li>
              ))}
            </ul>
            <Link href="/field-agents" className="mt-3 inline-block text-[12px] font-medium text-[#14532d] underline-offset-2 hover:underline">
              Field agents &amp; offline workflow →
            </Link>
          </OpsCard>

          <OpsCard>
            <OpsSectionTitle kicker="Call center" title="Assisted submissions" />
            <ul className="space-y-2">
              {callCenterSubmissions.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                  <div>
                    <div className="text-[12px] text-slate-900">{c.topic}</div>
                    <div className="text-[11px] text-slate-600">
                      {c.county} · {c.agent}
                    </div>
                  </div>
                  <span className={c.resolved ? "text-[10px] text-emerald-700" : "text-[10px] text-amber-700"}>
                    {c.resolved ? "Closed" : "Open"}
                  </span>
                </li>
              ))}
            </ul>
          </OpsCard>

          <OpsCard>
            <OpsSectionTitle kicker="Sync" title="Offline submission queue" />
            <ul className="space-y-2">
              {offlineSyncQueue.map((q) => (
                <li key={q.id} className="rounded-lg border border-slate-100 px-3 py-2 font-mono text-[11px] text-slate-800">
                  <div className="flex justify-between gap-2">
                    <span>{q.deviceId}</span>
                    <span>{q.county}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    {q.records} records · oldest {q.oldestAgeMinutes}m
                  </div>
                </li>
              ))}
            </ul>
          </OpsCard>

          <OpsCard>
            <OpsSectionTitle kicker="Transfers" title="Recent input movements" />
            <ul className="space-y-2">
              {inventoryTransfers.map((t) => (
                <li key={t.id} className="text-[11px] text-slate-700">
                  <span className="font-medium text-slate-900">{t.commodity}</span> · {t.qtyTons} t · {t.status}
                  <div className="text-[10px] text-slate-500">
                    {t.from} → {t.to}
                  </div>
                </li>
              ))}
            </ul>
          </OpsCard>

          <OpsCard>
            <OpsSectionTitle kicker="Geospatial" title={mapboxReady ? "Map preview" : "Map readiness"} />
            {mapboxReady ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-[12px] text-slate-700">
                Mapbox token detected — embed county density / warehouse layers in Phase 2 wiring.{" "}
                <Link href="/map" className="font-medium text-[#14532d] underline-offset-2 hover:underline">
                  Open map workspace
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {countiesRanked.slice(0, 9).map((c) => (
                  <div
                    key={c.county}
                    className="rounded-md border border-slate-200 px-2 py-2 text-center font-mono text-[10px] text-slate-700"
                    style={{
                      background: `rgba(20, 83, 45, ${0.08 + (c.productionMt % 50) / 200})`,
                    }}
                  >
                    {c.county.slice(0, 6)}
                    <div className="tabular-nums text-slate-600">{Math.round(c.productionMt)}kt</div>
                  </div>
                ))}
              </div>
            )}
          </OpsCard>

          <OpsCard dense>
            <div className="text-[12px] font-semibold text-slate-900">Next operational actions</div>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[11px] text-slate-700">
              <li>Clear highest-risk warehouse replenishment (Margibi · illustrative).</li>
              <li>Resolve pending verification backlog in pilot counties.</li>
              <li>Publish weekly county coordination brief from reporting center.</li>
            </ol>
          </OpsCard>
        </div>
      </div>
    </div>
  );
}
