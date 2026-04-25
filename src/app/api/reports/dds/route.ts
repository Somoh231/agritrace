import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// IMPORTANT: @react-pdf/renderer must only be imported server-side.
import React from "react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

type ReqBody = { lotId: string };

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#111827" },
  h1: { fontSize: 16, marginBottom: 6 },
  h2: { fontSize: 11, marginTop: 14, marginBottom: 6 },
  muted: { color: "#6b7280" },
  row: { flexDirection: "row", borderBottom: "1px solid #e5e7eb", paddingVertical: 6 },
  cell: { flexGrow: 1 },
  mono: {},
  badge: { fontSize: 9, padding: 3, border: "1px solid #e5e7eb", borderRadius: 4, alignSelf: "flex-start" },
  cellRight: { flexGrow: 1, textAlign: "right" },
  footer: { marginTop: 18, paddingTop: 10, borderTop: "1px solid #e5e7eb" },
  sigLine: { marginTop: 10, borderBottom: "1px solid #9ca3af", width: 240 },
});

function buildDDSDoc({
  lot,
  org,
  movements,
  farmers,
  plots,
  generatedAt,
}: {
  lot: any;
  org: any;
  movements: any[];
  farmers: any[];
  plots: any[];
  generatedAt: string;
}): React.ReactElement {
  const h = React.createElement;
  return h(
    Document,
    null,
    h(
      Page,
      { size: "A4", style: styles.page },
      h(
        View,
        null,
        h(Text, { style: styles.h1 }, "Agrivault — Due Diligence Statement"),
        h(Text, { style: styles.muted }, "EU Deforestation Regulation (EUDR) 2023/1115"),
        h(
          View,
          { style: { marginTop: 8 } },
          h(
            Text,
            null,
            "Generated: ",
            h(Text, { style: styles.mono }, generatedAt),
            " · Reference: ",
            h(Text, { style: styles.mono }, lot.lot_code),
          ),
        ),
      ),
      h(
        View,
        null,
        h(Text, { style: styles.h2 }, "Exporter"),
        h(
          Text,
          null,
          `${org?.name ?? "—"} · License: `,
          h(Text, { style: styles.mono }, org?.license_number ?? "—"),
          ` · Country: ${org?.country ?? "Liberia"}`,
        ),
      ),
      h(
        View,
        null,
        h(Text, { style: styles.h2 }, "Lot information"),
        h(
          Text,
          null,
          "Lot ID: ",
          h(Text, { style: styles.mono }, lot.lot_code),
          ` · Commodity: ${lot.commodity} · Season: ${lot.season ?? "—"} · Total weight: ${String(
            lot.weight_kg_current ?? lot.weight_kg_in ?? "—",
          )} kg · Grade: ${lot.quality_grade ?? "—"}`,
        ),
      ),
      h(
        View,
        null,
        h(Text, { style: styles.h2 }, "Chain of custody"),
        h(
          View,
          { style: [styles.row, { borderBottom: "1px solid #9ca3af" }] },
          h(Text, { style: [styles.cell, styles.muted] }, "Date"),
          h(Text, { style: [styles.cell, styles.muted] }, "From"),
          h(Text, { style: [styles.cell, styles.muted] }, "To"),
          h(Text, { style: [styles.cellRight, styles.muted] }, "Dispatched (kg)"),
          h(Text, { style: [styles.cellRight, styles.muted] }, "Received (kg)"),
          h(Text, { style: [styles.cell, styles.muted] }, "Status"),
        ),
        ...movements.map((m) =>
          h(
            View,
            { key: m.id, style: styles.row },
            h(Text, { style: styles.cell }, String((m.dispatched_at ?? m.created_at ?? "").slice(0, 10))),
            h(Text, { style: styles.cell }, m.from?.name ?? "—"),
            h(Text, { style: styles.cell }, m.to?.name ?? "—"),
            h(Text, { style: styles.cellRight }, String(m.weight_kg_dispatched ?? "—")),
            h(Text, { style: styles.cellRight }, String(m.weight_kg_received ?? "—")),
            h(Text, { style: styles.cell }, String(m.status ?? "—")),
          ),
        ),
      ),
      h(
        View,
        null,
        h(Text, { style: styles.h2 }, "Contributing farmers & plots"),
        h(Text, { style: styles.muted }, `Farmers: ${farmers.length} · Plots: ${plots.length}`),
        h(
          View,
          { style: { marginTop: 6 } },
          ...farmers.slice(0, 40).map((f) =>
            h(
              View,
              { key: f.id, style: { marginBottom: 4 } },
              h(
                Text,
                null,
                h(Text, { style: styles.mono }, f.id),
                ` · ${f.full_name} · ID: `,
                h(Text, { style: styles.mono }, f.national_id ?? "—"),
                ` · County: ${f.county}`,
              ),
            ),
          ),
        ),
      ),
      h(
        View,
        null,
        h(Text, { style: styles.h2 }, "EUDR compliance checklist"),
        h(
          View,
          { style: { gap: 6 } },
          ...[
            "All farmers registered (national_id on file)",
            "All plots have GPS coordinates",
            "All plots passed deforestation check (clear)",
            "Full chain of custody recorded",
            "No unresolved weight anomalies",
            "Exporter license on file",
          ].map((t) =>
            h(
              View,
              { key: t, style: { flexDirection: "row", gap: 8 } },
              h(Text, { style: styles.badge }, "□"),
              h(Text, null, t),
            ),
          ),
        ),
      ),
      h(
        View,
        { style: { marginTop: 16 } },
        h(Text, { style: styles.h2 }, "Audit trail reference"),
        h(
          Text,
          { style: styles.muted },
          "This document was generated from the Agrivault system audit trail. Reference ID: ",
          h(Text, { style: styles.mono }, `${lot.lot_code}-DDS-${generatedAt.slice(0, 10)}`),
          ".",
        ),
      ),
      h(
        View,
        { style: { marginTop: 18 } },
        h(
          Text,
          { style: styles.muted },
          "Document valid for EUDR due diligence purposes as per Regulation 2023/1115 Article 9.",
        ),
      ),
      h(
        View,
        { style: styles.footer },
        h(Text, { style: styles.muted }, "Sign-off"),
        h(View, { style: styles.sigLine }),
        h(Text, { style: [styles.muted, { marginTop: 6 }] }, "Exporter representative · Name / Title / Date"),
      ),
    ),
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as ReqBody;
  if (!body?.lotId) return NextResponse.json({ error: "lotId required" }, { status: 400 });

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Supabase not configured." },
      { status: 503 },
    );
  }

  const { data: lot, error: lotErr } = await supabase
    .from("lots")
    .select("*")
    .eq("id", body.lotId)
    .single();
  if (lotErr || !lot) return NextResponse.json({ error: "Lot not found" }, { status: 404 });

  const { data: org } = lot.organization_id
    ? await supabase.from("organizations").select("*").eq("id", lot.organization_id).single()
    : { data: null as any };

  const { data: movements } = await supabase
    .from("movements")
    .select("*, from:locations!movements_from_location_id_fkey(name), to:locations!movements_to_location_id_fkey(name)")
    .eq("lot_id", body.lotId)
    .order("created_at", { ascending: true });

  const farmerIds = (lot.farmer_group_ids ?? []) as string[];
  const { data: farmers } = farmerIds.length
    ? await supabase.from("farmers").select("*").in("id", farmerIds)
    : { data: [] as any[] };
  const { data: plots } = farmerIds.length
    ? await supabase.from("plots").select("*").in("farmer_id", farmerIds)
    : { data: [] as any[] };

  const generatedAt = new Date().toISOString();
  const doc = buildDDSDoc({
    lot,
    org,
    movements: (movements as any[]) ?? [],
    farmers: (farmers as any[]) ?? [],
    plots: (plots as any[]) ?? [],
    generatedAt,
  });
  const instance = pdf(doc);

  const buf = (await instance.toBuffer()) as unknown as Uint8Array;
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  return new NextResponse(ab, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="Agrivault-${lot.lot_code}-DDS-${generatedAt.slice(0, 10)}.pdf"`,
    },
  });
}

