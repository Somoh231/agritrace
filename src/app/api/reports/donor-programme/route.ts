import { NextResponse } from "next/server";
import React from "react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import {
  MINISTRY_COUNTY_METRICS,
  MINISTRY_FARMERS,
  MINISTRY_WAREHOUSES,
} from "@/lib/data/ministry-canonical-data";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, color: "#0f172a", fontFamily: "Helvetica" },
  banner: { backgroundColor: "#052e16", color: "#ecfdf5", padding: 10, marginBottom: 12, fontSize: 8 },
  h1: { fontSize: 15, marginBottom: 4, color: "#052e16", fontFamily: "Helvetica" },
  h2: { fontSize: 10, marginTop: 10, marginBottom: 4, color: "#14532d", textTransform: "uppercase" },
  muted: { color: "#64748b", fontSize: 8 },
  row: { flexDirection: "row", borderBottom: "1px solid #e2e8f0", paddingVertical: 5 },
  cell: { flex: 1 },
  cellNum: { width: 28 },
});

function buildDonorDoc({
  generatedAt,
  distributionCount,
  shipmentCount,
}: {
  generatedAt: string;
  distributionCount: number | null;
  shipmentCount: number | null;
}): React.ReactElement {
  const beneficiaryCount = MINISTRY_FARMERS.filter((f) => f.subsidyEligible).length;
  const allocationMt = MINISTRY_FARMERS.filter((f) => f.subsidyEligible).reduce((s, f) => s + f.subsidyAllocationQty, 0);
  const util = beneficiaryCount > 0 ? Math.min(100, Math.round((allocationMt / (beneficiaryCount * 12)) * 100)) : 0;
  const donorHubs = MINISTRY_WAREHOUSES.filter((w) => w.donorResupplyFlag).length;

  const h = React.createElement;
  return h(
    Document,
    null,
    h(
      Page,
      { size: "A4", style: styles.page },
      h(Text, { style: styles.banner }, "AGRIVAULT AIS · DONOR PROGRAMME REPORT · READ-ONLY TRANSPARENCY"),
      h(Text, { style: styles.h1 }, "Donor dashboard export"),
      h(Text, { style: styles.muted }, `Generated ${generatedAt.slice(0, 19).replace("T", " ")} UTC`),
      h(View, { style: { marginTop: 10 } }, h(Text, null, `Beneficiaries eligible: ${beneficiaryCount}`)),
      h(View, null, h(Text, null, `Modeled subsidy utilization: ${util}% (${allocationMt.toFixed(1)} mt allocated)`)),
      h(View, null, h(Text, null, `Donor corridor hubs flagged: ${donorHubs}`)),
      h(
        View,
        null,
        h(
          Text,
          null,
          `Live ledger signals: distributions ${distributionCount ?? "—"} · donor shipments ${shipmentCount ?? "—"} (subject to RLS)`,
        ),
      ),
      h(Text, { style: styles.h2 }, "County comparisons (pilot indices)"),
      ...MINISTRY_COUNTY_METRICS.slice(0, 10).map((c, i) =>
        h(
          View,
          { key: c.county, style: styles.row },
          h(Text, { style: styles.cellNum }, String(i + 1)),
          h(Text, { style: styles.cell }, c.county),
          h(Text, { style: styles.cell }, `Index ${c.productionIndex}`),
          h(Text, { style: styles.cell }, `Food ${c.foodRisk}`),
          h(Text, { style: styles.cell }, `DAO ${c.daoCompliance}%`),
        ),
      ),
      h(Text, { style: styles.h2 }, "Warehouse allocation (flagged corridors)"),
      ...MINISTRY_WAREHOUSES.filter((w) => w.donorResupplyFlag).map((w) =>
        h(Text, { key: w.ministryCode }, `${w.ministryCode} · ${w.name} · ${w.county} · util ${w.utilizationPct}%`),
      ),
    ),
  );
}

export async function GET() {
  const generatedAt = new Date().toISOString();

  let distributionCount: number | null = null;
  let shipmentCount: number | null = null;
  try {
    const supabase = await createClient();
    const [dist, ship] = await Promise.all([
      supabase.from("distribution_logs").select("id", { count: "exact", head: true }),
      supabase.from("donor_shipments").select("id", { count: "exact", head: true }),
    ]);
    distributionCount = dist.count ?? null;
    shipmentCount = ship.count ?? null;
  } catch {
    /* ignore */
  }

  const instance = pdf(buildDonorDoc({ generatedAt, distributionCount, shipmentCount }));
  const blob = await instance.toBlob();
  const ab = await blob.arrayBuffer();

  return new NextResponse(ab, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="Agrivault-Donor-Programme-${generatedAt.slice(0, 10)}.pdf"`,
    },
  });
}

