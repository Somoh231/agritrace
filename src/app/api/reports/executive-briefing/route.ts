import { NextResponse } from "next/server";
import React from "react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

import { buildExecutiveBriefingSnapshot } from "@/lib/briefing/executive-intelligence";
import { createClient } from "@/lib/supabase/server";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, color: "#0f172a", fontFamily: "Helvetica" },
  banner: {
    backgroundColor: "#052e16",
    color: "#ecfdf5",
    padding: 10,
    marginBottom: 14,
    fontSize: 8,
    letterSpacing: 0.5,
  },
  h1: { fontSize: 15, marginBottom: 4, color: "#052e16", fontFamily: "Helvetica" },
  h2: { fontSize: 10, marginTop: 10, marginBottom: 4, fontFamily: "Helvetica", color: "#14532d", textTransform: "uppercase" },
  p: { marginBottom: 4, lineHeight: 1.35 },
  muted: { color: "#64748b", fontSize: 8 },
  row: { flexDirection: "row", borderBottom: "1px solid #e2e8f0", paddingVertical: 5 },
  cell: { flex: 1 },
  cellNum: { width: 28 },
  footer: { marginTop: 16, paddingTop: 8, borderTop: "1px solid #cbd5e1", fontSize: 8, color: "#64748b" },
});

function BriefingPdf({ snap }: { snap: ReturnType<typeof buildExecutiveBriefingSnapshot> }) {
  const stamp = snap.generatedAtIso.slice(0, 19).replace("T", " ");
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.banner }, "AGRIVAULT AIS · EXECUTIVE INTELLIGENCE · MINISTRY OF AGRICULTURE"),
      React.createElement(Text, { style: styles.h1 }, "Minister briefing — national snapshot"),
      React.createElement(Text, { style: styles.muted }, `Generated ${stamp} UTC`),
      React.createElement(Text, { style: { ...styles.p, marginTop: 10 } }, snap.nationalProduction.headline),
      React.createElement(Text, { style: styles.h2 }, "Food security"),
      React.createElement(
        Text,
        { style: styles.p },
        `${snap.foodSecurity.postureLabel}. Elevated counties: ${snap.foodSecurity.elevatedCounties.join(", ") || "—"}.`,
      ),
      snap.foodSecurity.nationalRiskScoreLive != null ?
        React.createElement(
          Text,
          { style: styles.p },
          `Live national risk score: ${snap.foodSecurity.nationalRiskScoreLive}.`,
        )
      : null,
      React.createElement(Text, { style: styles.h2 }, "Subsidy & warehouses"),
      React.createElement(Text, { style: styles.p }, snap.subsidyUtilization.narrative),
      React.createElement(
        Text,
        { style: styles.p },
        `${snap.warehouseCoverage.facilityCount} facilities · ${snap.warehouseCoverage.countiesCovered} counties · avg utilization ${snap.warehouseCoverage.avgUtilizationPct}% · ≥90% sites: ${snap.warehouseCoverage.overCapacityCount}.`,
      ),
      React.createElement(Text, { style: styles.h2 }, "County ranking (production index)"),
      ...snap.countyRanking.slice(0, 10).map((c, i) =>
        React.createElement(
          View,
          { key: c.county, style: styles.row },
          React.createElement(Text, { style: styles.cellNum }, String(i + 1)),
          React.createElement(Text, { style: styles.cell }, c.county),
          React.createElement(Text, { style: styles.cell }, `Index ${c.productionIndex}`),
          React.createElement(Text, { style: styles.cell }, c.foodRisk),
        ),
      ),
      React.createElement(Text, { style: styles.h2 }, "Operational incidents (recent)"),
      ...snap.incidents.slice(0, 6).map((e) =>
        React.createElement(
          Text,
          { key: e.code, style: styles.p },
          `[${e.severity}] ${e.county} · ${e.eventType}: ${e.message}`,
        ),
      ),
      React.createElement(Text, { style: styles.h2 }, "Pest outbreaks"),
      snap.pestOutbreaks.length ?
        snap.pestOutbreaks.map((p) =>
          React.createElement(Text, { key: p.code, style: styles.p }, `${p.county}: ${p.message} (${p.status})`),
        )
      : React.createElement(Text, { style: styles.p }, "No active pest flags in pilot ledger."),
      React.createElement(Text, { style: styles.h2 }, "Donor programmes"),
      ...snap.donorProgrammes.map((d, i) =>
        React.createElement(
          Text,
          { key: i, style: styles.p },
          `${d.programme} — ${d.status}. ${d.notes}`,
        ),
      ),
      React.createElement(
        Text,
        { style: styles.footer },
        "Confidential — government custody. Aggregated from operational registries and pilot canonical analytics.",
      ),
    ),
  );
}

export async function GET() {
  let live:
    | Partial<{
        farmersCount: number | null;
        riceKgBooked: number | null;
        nationalRiskScore: number | null;
      }>
    | undefined;

  try {
    const supabase = await createClient();
    const [fc, rice, fs] = await Promise.all([
      supabase.from("farmers").select("id", { count: "exact", head: true }),
      supabase.from("rice_production_records").select("actual_yield_kg"),
      supabase.from("food_security_indicators").select("national_risk_score").limit(1).maybeSingle(),
    ]);
    const kg = ((rice.data ?? []) as { actual_yield_kg?: number }[]).reduce(
      (s, r) => s + Number(r.actual_yield_kg ?? 0),
      0,
    );
    live = {
      farmersCount: fc.count ?? null,
      riceKgBooked: kg > 0 ? kg : null,
      nationalRiskScore: fs.data?.national_risk_score ?? null,
    };
  } catch {
    live = undefined;
  }

  const snap = buildExecutiveBriefingSnapshot(live);
  const instance = pdf(BriefingPdf({ snap }));
  const blob = await instance.toBlob();
  const ab = await blob.arrayBuffer();

  return new NextResponse(ab, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="agrivault-executive-briefing.pdf"',
    },
  });
}
