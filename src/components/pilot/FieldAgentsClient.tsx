"use client";

import * as React from "react";

import {
  callCenterSubmissions,
  connectivityRiskByCounty,
  districtAgOfficersSample,
  fieldOfficers,
  fieldReports,
  offlineSyncQueue,
} from "@/lib/demo/agriculture-pilot-data";

import { OpsCard, OpsMetric, OpsSectionTitle, PilotDatasetNotice } from "@/components/pilot/pilot-ui";

export default function FieldAgentsClient() {
  return (
    <div className="space-y-5">
      <OpsSectionTitle
        kicker="Field layer"
        title="Field officers · offline workflow · call-center support"
        subtitle="Designed for Liberia connectivity realities — offline capture, sync discipline, voice/SMS-assisted intake, and manual verification queues."
      />
      <PilotDatasetNotice />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <OpsMetric label="Daily submissions (est.)" value="312" tone="forest" />
        <OpsMetric label="Offline queue" value={`${offlineSyncQueue.reduce((s, q) => s + q.records, 0)}`} tone="amber" />
        <OpsMetric label="Call-center assists (24h)" value="54" tone="navy" />
        <OpsMetric label="Escalations open" value="6" tone="rose" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <OpsCard>
          <div className="font-display text-[15px] font-semibold text-slate-900">Offline submissions pending sync</div>
          <ul className="mt-3 space-y-2 font-mono text-[11px] text-slate-800">
            {offlineSyncQueue.map((q) => (
              <li key={q.id} className="rounded-lg border border-slate-100 px-3 py-2">
                {q.deviceId} · {q.county} · {q.records} records · oldest {q.oldestAgeMinutes}m
              </li>
            ))}
          </ul>
        </OpsCard>
        <OpsCard>
          <div className="font-display text-[15px] font-semibold text-slate-900">Call-center assisted reports</div>
          <ul className="mt-3 space-y-2 text-[12px] text-slate-700">
            {callCenterSubmissions.map((c) => (
              <li key={c.id} className="rounded-lg border border-slate-100 px-3 py-2">
                <div className="font-medium">{c.topic}</div>
                <div className="text-[11px] text-slate-600">{c.county} · {c.agent}</div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-slate-600">
            SMS/phone backup collection · pilot placeholder hooks for USSP gateway integration.
          </p>
        </OpsCard>
      </div>

      <OpsCard>
        <div className="font-display text-[15px] font-semibold text-slate-900">Field officer activity · illustrative</div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {fieldOfficers.map((f) => (
            <div key={f.id} className="rounded-lg border border-slate-100 px-3 py-2">
              <div className="text-[12px] font-semibold text-slate-900">{f.name}</div>
              <div className="text-[11px] text-slate-600">{f.county}</div>
              <div className="mt-1 font-mono text-[10px] text-slate-500">7d submissions · {f.activeSubmissions7d}</div>
            </div>
          ))}
        </div>
      </OpsCard>

      <OpsCard>
        <div className="font-display text-[15px] font-semibold text-slate-900">DAO coordination sample</div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {districtAgOfficersSample.map((d) => (
            <div key={d.id} className="rounded-lg border border-slate-100 px-3 py-2 text-[12px] text-slate-800">
              {d.name} · <span className="font-mono text-[11px] text-slate-600">{d.activeSubmissions7d} submissions</span>
            </div>
          ))}
        </div>
      </OpsCard>

      <OpsCard>
        <div className="font-display text-[15px] font-semibold text-slate-900">Connectivity risk · county lens</div>
        <div className="mt-3 space-y-2">
          {connectivityRiskByCounty.map((r) => (
            <div key={r.county} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <div>
                <div className="text-[12px] font-medium text-slate-900">{r.county}</div>
                <div className="text-[11px] text-slate-600">{r.note}</div>
              </div>
              <div className="font-display text-lg tabular-nums text-[#1e3a5f]">{r.riskScore}</div>
            </div>
          ))}
        </div>
      </OpsCard>

      <OpsCard>
        <div className="font-display text-[15px] font-semibold text-slate-900">Recent production / verification notes</div>
        <ul className="mt-3 space-y-2 text-[12px] text-slate-700">
          {fieldReports.map((r) => (
            <li key={r.id} className="rounded-lg border border-slate-100 px-3 py-2">
              <span className="font-mono text-[10px] uppercase text-slate-500">{r.channel}</span> · {r.county} · {r.summary}
            </li>
          ))}
        </ul>
      </OpsCard>
    </div>
  );
}
