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
  banner: { backgroundColor: "#052e16", color: "#ecfdf5", padding: 10, marginBottom: 12, fontSize: 8 },
  h1: { fontSize: 15, marginBottom: 4, color: "#052e16", fontFamily: "Helvetica" },
  h2: { fontSize: 10, marginTop: 10, marginBottom: 4, color: "#14532d", textTransform: "uppercase" },
  muted: { color: "#64748b", fontSize: 8 },
  row: { flexDirection: "row", borderBottom: "1px solid #e2e8f0", paddingVertical: 5 },
  cell: { flex: 1 },
  cellNum: { width: 28 },
});

type Ledger = { records: number; total: number } | null;
type CountyRow = { county: string; production_index: number; food_risk: string; dao_compliance: number };

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function buildDonorDoc({
  generatedAt,
  subsidies,
  distributions,
  shipments,
  counties,
}: {
  generatedAt: string;
  subsidies: Ledger;
  distributions: Ledger;
  shipments: Ledger;
  counties: CountyRow[] | null;
}): React.ReactElement {
  const h = React.createElement;
  const line = (label: string, ledger: Ledger, unit: string) =>
    h(
      View,
      { style: styles.row },
      h(Text, { style: styles.cell }, label),
      h(
        Text,
        { style: styles.cell },
        ledger === null
          ? "Not available to your role"
          : ledger.records === 0
            ? "No records yet"
            : `${ledger.records} records · ${fmt(ledger.total)} ${unit}`,
      ),
    );
  return h(
    Document,
    null,
    h(
      Page,
      { size: "A4", style: styles.page },
      h(Text, { style: styles.banner }, "AGRIVAULT AIS · DONOR PROGRAMME REPORT · READ-ONLY TRANSPARENCY"),
      h(Text, { style: styles.h1 }, "Donor programme export"),
      h(
        Text,
        { style: styles.muted },
        `Generated ${generatedAt.slice(0, 19).replace("T", " ")} UTC · live ledger records within your access scope; no modeled or illustrative figures`,
      ),
      h(Text, { style: styles.h2 }, "Programme ledgers"),
      line("Farmer subsidy awards", subsidies, "USD"),
      line("Input distributions", distributions, "units distributed"),
      line("Donor shipments received", shipments, "units received"),
      h(Text, { style: styles.h2 }, "County indices (recorded)"),
      ...(counties === null
        ? [h(Text, { style: styles.muted }, "County indices are not available to your role.")]
        : counties.length === 0
          ? [h(Text, { style: styles.muted }, "No county indices have been recorded yet.")]
          : counties.map((c, i) =>
              h(
                View,
                { key: c.county, style: styles.row },
                h(Text, { style: styles.cellNum }, String(i + 1)),
                h(Text, { style: styles.cell }, c.county),
                h(Text, { style: styles.cell }, `Index ${c.production_index}`),
                h(Text, { style: styles.cell }, `Food ${c.food_risk}`),
                h(Text, { style: styles.cell }, `DAO ${c.dao_compliance}%`),
              ),
            )),
    ),
  );
}

async function sumLedger(
  query: PromiseLike<{ data: Array<Record<string, unknown>> | null; error: unknown }>,
  column: string,
): Promise<Ledger> {
  const { data, error } = await query;
  if (error) return null;
  const rows = data ?? [];
  return { records: rows.length, total: rows.reduce((s, r) => s + (Number(r[column]) || 0), 0) };
}

export async function GET(request: Request) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;
  const forbidden = forbidReportExport(auth.session, "donor");
  if (forbidden) return forbidden;

  const ctx = await beginApiRequestAsync(request, EXPORT_POLICY, auth.session.userId);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  const generatedAt = new Date().toISOString();

  let subsidies: Ledger = null;
  let distributions: Ledger = null;
  let shipments: Ledger = null;
  let counties: CountyRow[] | null = null;
  try {
    const supabase = await createClient();
    const cap = 10_000;
    [subsidies, distributions, shipments] = await Promise.all([
      sumLedger(supabase.from("farmer_subsidies").select("amount_usd").limit(cap), "amount_usd"),
      sumLedger(supabase.from("distribution_logs").select("quantity").limit(cap), "quantity"),
      sumLedger(supabase.from("donor_shipments").select("quantity").limit(cap), "quantity"),
    ]);
    const metrics = await supabase
      .from("pilot_county_metrics")
      .select("county,production_index,food_risk,dao_compliance")
      .order("production_index", { ascending: false })
      .limit(15);
    counties = metrics.error ? null : ((metrics.data ?? []) as CountyRow[]);
  } catch {
    /* sections render "not available" */
  }

  const instance = pdf(
    buildDonorDoc({ generatedAt, subsidies, distributions, shipments, counties }) as React.ReactElement<DocumentProps>,
  );
  const blob = await instance.toBlob();
  const ab = await blob.arrayBuffer();

  return binaryResponse(ctx, ab, {
    "content-type": "application/pdf",
    "content-disposition": `attachment; filename="Agrivault-Donor-Programme-${generatedAt.slice(0, 10)}.pdf"`,
  }, EXPORT_POLICY);
}

