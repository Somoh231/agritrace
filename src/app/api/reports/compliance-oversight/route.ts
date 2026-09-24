import React from "react";
import { Document, Page, StyleSheet, Text, View, pdf, type DocumentProps } from "@react-pdf/renderer";

import {
  binaryResponse,
  beginApiRequestAsync,
  rejectIfRateLimited,
} from "@/lib/http/api-response";
import { EXPORT_POLICY } from "@/lib/http/rate-limit-policies";
import { forbidReportExport, requireApiSession } from "@/lib/http/require-api-session";
import { createClient } from "@/lib/supabase/server";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, color: "#0f172a", fontFamily: "Helvetica" },
  banner: { backgroundColor: "#0b2410", color: "#ecfdf5", padding: 10, marginBottom: 12, fontSize: 8 },
  h1: { fontSize: 15, marginBottom: 4, color: "#052e16", fontFamily: "Helvetica" },
  h2: { fontSize: 10, marginTop: 10, marginBottom: 4, color: "#14532d", textTransform: "uppercase" },
  muted: { color: "#64748b", fontSize: 8 },
  row: { flexDirection: "row", borderBottom: "1px solid #e2e8f0", paddingVertical: 5 },
  cell: { flex: 1 },
});

type IncidentRow = { event_code: string | null; severity: string; county: string | null; event_type: string; status: string };
type BottleneckRow = { ministry_code: string | null; name: string; county: string; utilization_pct: number | null };

function buildComplianceDoc({
  generatedAt,
  auditCount,
  fieldCount,
  incidents,
  bottlenecks,
}: {
  generatedAt: string;
  auditCount: number | null;
  fieldCount: number | null;
  incidents: IncidentRow[] | null;
  bottlenecks: BottleneckRow[] | null;
}): React.ReactElement {
  const h = React.createElement;
  const none = (message: string) => h(Text, { style: styles.muted }, message);
  return h(
    Document,
    null,
    h(
      Page,
      { size: "A4", style: styles.page },
      h(Text, { style: styles.banner }, "AGRIVAULT AIS · COMPLIANCE OVERSIGHT REPORT · READ-ONLY"),
      h(Text, { style: styles.h1 }, "Compliance & audit posture"),
      h(Text, { style: styles.muted }, `Generated ${generatedAt.slice(0, 19).replace("T", " ")} UTC · live records within your access scope`),
      h(View, { style: { marginTop: 10 } }, h(Text, null, `Audit log rows visible: ${auditCount ?? "unavailable"}`)),
      h(View, null, h(Text, null, `Field reports visible: ${fieldCount ?? "unavailable"}`)),
      h(Text, { style: styles.h2 }, "Open and escalated operational incidents"),
      ...(incidents === null
        ? [none("Incident records could not be loaded.")]
        : incidents.length === 0
          ? [none("No open or escalated incidents recorded.")]
          : incidents.map((e, i) =>
              h(
                View,
                { key: e.event_code ?? String(i), style: styles.row },
                h(Text, { style: styles.cell }, `[${e.severity}] ${e.county ?? "National"}`),
                h(Text, { style: styles.cell }, e.event_type),
                h(Text, { style: styles.cell }, e.status),
              ),
            )),
      h(Text, { style: styles.h2 }, "Warehouse bottlenecks (≥90% utilization)"),
      ...(bottlenecks === null
        ? [none("Warehouse records could not be loaded.")]
        : bottlenecks.length === 0
          ? [none("No warehouse is recorded at or above 90% utilization.")]
          : bottlenecks.map((w, i) =>
              h(Text, { key: w.ministry_code ?? String(i) }, `${w.ministry_code ?? "—"} · ${w.name} · ${w.county} · util ${w.utilization_pct}%`),
            )),
    ),
  );
}

export async function GET(request: Request) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;
  const forbidden = forbidReportExport(auth.session, "compliance");
  if (forbidden) return forbidden;

  const ctx = await beginApiRequestAsync(request, EXPORT_POLICY, auth.session.userId);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  const generatedAt = new Date().toISOString();
  let auditCount: number | null = null;
  let fieldCount: number | null = null;
  let incidents: IncidentRow[] | null = null;
  let bottlenecks: BottleneckRow[] | null = null;
  try {
    const supabase = await createClient();
    const [aud, field, events, stores] = await Promise.all([
      supabase.from("audit_log").select("id", { count: "exact", head: true }),
      supabase.from("field_reports").select("id", { count: "exact", head: true }),
      supabase
        .from("pilot_operational_events")
        .select("event_code,severity,county,event_type,status")
        .in("status", ["Open", "Escalated"])
        .order("occurred_at", { ascending: false })
        .limit(20),
      supabase
        .from("warehouses")
        .select("ministry_code,name,county,utilization_pct")
        .gte("utilization_pct", 90)
        .order("utilization_pct", { ascending: false })
        .limit(20),
    ]);
    auditCount = aud.error ? null : (aud.count ?? 0);
    fieldCount = field.error ? null : (field.count ?? 0);
    incidents = events.error ? null : ((events.data ?? []) as IncidentRow[]);
    bottlenecks = stores.error ? null : ((stores.data ?? []) as BottleneckRow[]);
  } catch {
    /* each section renders an explicit "could not be loaded" state */
  }

  const instance = pdf(
    buildComplianceDoc({ generatedAt, auditCount, fieldCount, incidents, bottlenecks }) as React.ReactElement<DocumentProps>,
  );
  const blob = await instance.toBlob();
  const ab = await blob.arrayBuffer();

  return binaryResponse(ctx, ab, {
    "content-type": "application/pdf",
    "content-disposition": `attachment; filename="Agrivault-Compliance-Oversight-${generatedAt.slice(0, 10)}.pdf"`,
  }, EXPORT_POLICY);
}

