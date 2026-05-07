import { NextResponse } from "next/server";
import React from "react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import {
  MINISTRY_OPERATIONAL_EVENTS,
  MINISTRY_WAREHOUSES,
} from "@/lib/data/ministry-canonical-data";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, color: "#0f172a", fontFamily: "Helvetica" },
  banner: { backgroundColor: "#0b2410", color: "#ecfdf5", padding: 10, marginBottom: 12, fontSize: 8 },
  h1: { fontSize: 15, marginBottom: 4, color: "#052e16", fontFamily: "Helvetica" },
  h2: { fontSize: 10, marginTop: 10, marginBottom: 4, color: "#14532d", textTransform: "uppercase" },
  muted: { color: "#64748b", fontSize: 8 },
  row: { flexDirection: "row", borderBottom: "1px solid #e2e8f0", paddingVertical: 5 },
  cell: { flex: 1 },
});

function buildComplianceDoc({
  generatedAt,
  auditCount,
  fieldCount,
}: {
  generatedAt: string;
  auditCount: number | null;
  fieldCount: number | null;
}): React.ReactElement {
  const escalations = MINISTRY_OPERATIONAL_EVENTS.filter((e) => e.status === "Open" || e.status === "Escalated");
  const bottlenecks = MINISTRY_WAREHOUSES.filter((w) => w.utilizationPct >= 90);
  const h = React.createElement;
  return h(
    Document,
    null,
    h(
      Page,
      { size: "A4", style: styles.page },
      h(Text, { style: styles.banner }, "AGRIVAULT AIS · COMPLIANCE OVERSIGHT REPORT · READ-ONLY"),
      h(Text, { style: styles.h1 }, "Compliance & audit posture"),
      h(Text, { style: styles.muted }, `Generated ${generatedAt.slice(0, 19).replace("T", " ")} UTC`),
      h(View, { style: { marginTop: 10 } }, h(Text, null, `Audit log rows visible (RLS): ${auditCount ?? "—"}`)),
      h(View, null, h(Text, null, `Field reports visible (RLS): ${fieldCount ?? "—"}`)),
      h(Text, { style: styles.h2 }, "Operational incidents (pilot feed)"),
      ...escalations.slice(0, 10).map((e) =>
        h(
          View,
          { key: e.eventCode, style: styles.row },
          h(Text, { style: styles.cell }, `[${e.severity}] ${e.county}`),
          h(Text, { style: styles.cell }, e.eventType),
          h(Text, { style: styles.cell }, e.status),
        ),
      ),
      h(Text, { style: styles.h2 }, "Warehouse bottlenecks (≥90% utilization)"),
      ...bottlenecks.map((w) =>
        h(Text, { key: w.ministryCode }, `${w.ministryCode} · ${w.name} · util ${w.utilizationPct}%`),
      ),
    ),
  );
}

export async function GET() {
  const generatedAt = new Date().toISOString();
  let auditCount: number | null = null;
  let fieldCount: number | null = null;
  try {
    const supabase = await createClient();
    const [aud, field] = await Promise.all([
      supabase.from("audit_log").select("id", { count: "exact", head: true }),
      supabase.from("field_reports").select("id", { count: "exact", head: true }),
    ]);
    auditCount = aud.count ?? null;
    fieldCount = field.count ?? null;
  } catch {
    /* ignore */
  }

  const instance = pdf(buildComplianceDoc({ generatedAt, auditCount, fieldCount }));
  const blob = await instance.toBlob();
  const ab = await blob.arrayBuffer();

  return new NextResponse(ab, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="Agrivault-Compliance-Oversight-${generatedAt.slice(0, 10)}.pdf"`,
    },
  });
}

