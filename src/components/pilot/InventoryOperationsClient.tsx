"use client";

import * as React from "react";

import {
  donorInventoryRecords,
  inputDistributionProgress,
  inventoryTransfers,
  warehouses,
} from "@/lib/demo/agriculture-pilot-data";
import { safePct } from "@/lib/utils/rice";

import { OpsCard, OpsMetric, OpsStatusBadge } from "@/components/pilot/pilot-ui";
import ProgressBar from "@/components/shared/ProgressBar";

export default function InventoryOperationsClient() {
  const lowStock = warehouses.filter((w) => w.stockRisk !== "healthy");

  return (
    <div className="space-y-5 p-4 md:p-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <OpsMetric label="Fertilizer distributed" value={`${inputDistributionProgress.fertilizerDistributedMt} t`} tone="forest" />
        <OpsMetric label="Fertilizer allocated" value={`${inputDistributionProgress.fertilizerAllocatedMt} t`} tone="navy" />
        <OpsMetric label="Seed distributed" value={`${inputDistributionProgress.seedDistributedMt} t`} tone="forest" />
        <OpsMetric label="Counties completed" value={`${inputDistributionProgress.countiesFullyDistributed}`} tone="amber" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <OpsCard>
          <div className="text-[13px] font-semibold text-slate-900">County allocation · fertilizer</div>
          <ProgressBar
            valuePct={safePct(
              inputDistributionProgress.fertilizerDistributedMt * 1000,
              inputDistributionProgress.fertilizerAllocatedMt * 1000,
            )}
            tone="green"
          />
        </OpsCard>
        <OpsCard>
          <div className="text-[13px] font-semibold text-slate-900">County allocation · rice seed</div>
          <ProgressBar
            valuePct={safePct(
              inputDistributionProgress.seedDistributedMt * 1000,
              inputDistributionProgress.seedAllocatedMt * 1000,
            )}
            tone="green"
          />
        </OpsCard>
      </div>

      <OpsCard>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-display text-[15px] font-semibold text-slate-900">Low stock / risk warehouses</div>
          <div className="flex gap-2">
            <button type="button" className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-800 hover:bg-slate-50">
              Request replenishment (placeholder)
            </button>
            <button type="button" className="h-9 rounded-lg bg-[#14532d] px-3 text-[12px] font-medium text-white hover:bg-[#0f2918]">
              Record distribution (placeholder)
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {lowStock.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2">
              <div>
                <div className="text-[12px] font-medium text-slate-900">{w.name}</div>
                <div className="text-[11px] text-slate-600">
                  Seed {w.riceSeedTons} t · Fertilizer {w.fertilizerTons} t · Donor share {w.donorTaggedPct}%
                </div>
              </div>
              <OpsStatusBadge status={w.stockRisk} />
            </div>
          ))}
        </div>
      </OpsCard>

      <OpsCard>
        <div className="font-display text-[15px] font-semibold text-slate-900">Warehouse stock summary</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-2">Warehouse</th>
                <th className="py-2 pr-2">County</th>
                <th className="py-2 pr-2">Rice seed (t)</th>
                <th className="py-2 pr-2">Fertilizer (t)</th>
                <th className="py-2 pr-2">Pesticide/tools (t)</th>
                <th className="py-2">Flags</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 font-medium">{w.name}</td>
                  <td className="py-2 pr-2">{w.county}</td>
                  <td className="py-2 pr-2 tabular-nums">{w.riceSeedTons}</td>
                  <td className="py-2 pr-2 tabular-nums">{w.fertilizerTons}</td>
                  <td className="py-2 pr-2 tabular-nums">{w.pesticideTons}</td>
                  <td className="py-2">
                    <OpsStatusBadge status={w.stockRisk} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OpsCard>

      <OpsCard>
        <div className="font-display text-[15px] font-semibold text-slate-900">Recent transfers</div>
        <ul className="mt-3 space-y-2 text-[12px] text-slate-700">
          {inventoryTransfers.map((t) => (
            <li key={t.id} className="rounded-lg border border-slate-100 px-3 py-2">
              <div className="font-medium text-slate-900">{t.commodity} · {t.qtyTons} t</div>
              <div className="text-[11px] text-slate-600">
                {t.from} → {t.to} · <span className="font-mono uppercase">{t.status}</span> · {t.date}
              </div>
            </li>
          ))}
        </ul>
      </OpsCard>

      <OpsCard>
        <div className="font-display text-[15px] font-semibold text-slate-900">Donor-funded inventory (illustrative)</div>
        <ul className="mt-3 space-y-2">
          {donorInventoryRecords.map((d, i) => (
            <li key={i} className="rounded-lg border border-slate-100 px-3 py-2 text-[12px] text-slate-800">
              <span className="font-medium">{d.donor}</span> · {d.sku} · {d.tons} · {d.warehouse}
            </li>
          ))}
        </ul>
      </OpsCard>
    </div>
  );
}
