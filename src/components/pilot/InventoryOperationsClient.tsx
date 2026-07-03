"use client";

import * as React from "react";
import Link from "next/link";

import {
  warehouses,
  donorInventoryRecords,
  inputDistributionProgress,
  inventoryTransfers,
} from "@/lib/demo/agriculture-pilot-data";
import { safePct } from "@/lib/utils/rice";

import {
  AlertCard,
  DashboardPanel,
  SectionHeader,
  StatusBadge,
} from "@/components/enterprise";
import { RegistryKpiStrip } from "@/components/registry";
import ProgressBar from "@/components/shared/ProgressBar";

function stockRiskTone(status: string): "success" | "warning" | "danger" {
  if (status === "healthy") return "success";
  if (status === "warning") return "warning";
  return "danger";
}

export default function InventoryOperationsClient() {
  const lowStock = warehouses.filter((w) => w.stockRisk !== "healthy");

  return (
    <div className="space-y-6">
      <RegistryKpiStrip
        items={[
          { label: "Fertilizer distributed", value: `${inputDistributionProgress.fertilizerDistributedMt} t`, hint: "National programme" },
          { label: "Fertilizer allocated", value: `${inputDistributionProgress.fertilizerAllocatedMt} t` },
          { label: "Seed distributed", value: `${inputDistributionProgress.seedDistributedMt} t` },
          { label: "Counties completed", value: String(inputDistributionProgress.countiesFullyDistributed), hint: "Full distribution" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader title="County allocation · fertilizer" />
          <ProgressBar
            valuePct={safePct(
              inputDistributionProgress.fertilizerDistributedMt * 1000,
              inputDistributionProgress.fertilizerAllocatedMt * 1000,
            )}
            tone="green"
          />
        </DashboardPanel>
        <DashboardPanel>
          <SectionHeader title="County allocation · rice seed" />
          <ProgressBar
            valuePct={safePct(
              inputDistributionProgress.seedDistributedMt * 1000,
              inputDistributionProgress.seedAllocatedMt * 1000,
            )}
            tone="green"
          />
        </DashboardPanel>
      </div>

      <DashboardPanel>
        <SectionHeader
          kicker="Risk posture"
          title="Low stock / risk warehouses"
          subtitle="Hubs requiring replenishment or supervisory review"
        />
        <div className="mt-4 space-y-2">
          {lowStock.map((w) => (
            <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-ink-900">{w.name}</p>
                <p className="text-[12px] text-slate-600">
                  Seed {w.riceSeedTons} t · Fertilizer {w.fertilizerTons} t · Donor share {w.donorTaggedPct}%
                </p>
              </div>
              <StatusBadge tone={stockRiskTone(w.stockRisk)}>{w.stockRisk}</StatusBadge>
            </div>
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel padding="none">
        <div className="border-b border-slate-100 px-5 py-4">
          <SectionHeader title="Warehouse stock summary" />
        </div>
        <div className="overflow-x-auto p-2">
          <table className="enterprise-table min-w-[720px]">
            <thead>
              <tr>
                <th>Warehouse</th>
                <th>County</th>
                <th>Rice seed (t)</th>
                <th>Fertilizer (t)</th>
                <th>Pesticide/tools (t)</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id}>
                  <td className="font-medium">{w.name}</td>
                  <td>{w.county}</td>
                  <td className="tabular-nums">{w.riceSeedTons}</td>
                  <td className="tabular-nums">{w.fertilizerTons}</td>
                  <td className="tabular-nums">{w.pesticideTons}</td>
                  <td>
                    <StatusBadge tone={stockRiskTone(w.stockRisk)}>{w.stockRisk}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel>
          <SectionHeader title="Recent transfers" action={<Link href="/transfers" className="text-[12px] font-medium text-forest-700">Open TRF trace →</Link>} />
          <ul className="mt-3 space-y-2 text-[12px] text-slate-700">
            {inventoryTransfers.map((t) => (
              <li key={t.id} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                <p className="font-medium text-ink-900">
                  {t.commodity} · {t.qtyTons} t
                </p>
                <p className="text-[11px] text-slate-600">
                  {t.from} → {t.to} · <span className="font-mono uppercase">{t.status}</span> · {t.date}
                </p>
              </li>
            ))}
          </ul>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader title="Donor-funded inventory" subtitle="Illustrative programme stock" />
          <ul className="mt-3 space-y-2">
            {donorInventoryRecords.map((d, i) => (
              <li key={i} className="rounded-xl border border-slate-100 px-3 py-2 text-[12px] text-slate-800">
                <span className="font-medium">{d.donor}</span> · {d.sku} · {d.tons} · {d.warehouse}
              </li>
            ))}
          </ul>
          <AlertCard tone="info" className="mt-4">
            Pilot allocation figures — reconcile against live donor_shipments when connected.
          </AlertCard>
        </DashboardPanel>
      </div>
    </div>
  );
}
