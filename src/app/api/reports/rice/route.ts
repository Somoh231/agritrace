import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import React from "react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

type ReqBody = {
  county?: string;
  season?: string;
  format: "pdf" | "csv";
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#111827" },
  h1: { fontSize: 16, marginBottom: 6 },
  h2: { fontSize: 11, marginTop: 14, marginBottom: 6 },
  muted: { color: "#6b7280" },
  row: { flexDirection: "row", borderBottom: "1px solid #e5e7eb", paddingVertical: 6 },
  cell: { flexGrow: 1 },
  cellRight: { flexGrow: 1, textAlign: "right" },
  footer: { marginTop: 18, paddingTop: 10, borderTop: "1px solid #e5e7eb" },
  sigLine: { marginTop: 10, borderBottom: "1px solid #9ca3af", width: 240 },
});

function csvCell(v: unknown) {
  const s = String(v ?? "");
  const needs = /[",\n]/.test(s);
  return needs ? `"${s.replaceAll("\"", "\"\"")}"` : s;
}

function buildRiceReportDoc({
  title,
  generatedAt,
  rows,
}: {
  title: string;
  generatedAt: string;
  rows: Array<{ county: string; expected: number; actual: number; loss: number }>;
}): React.ReactElement {
  const totals = rows.reduce(
    (a, r) => {
      a.expected += r.expected;
      a.actual += r.actual;
      a.loss += r.loss;
      return a;
    },
    { expected: 0, actual: 0, loss: 0 },
  );

  const h = React.createElement;
  return h(
    Document,
    null,
    h(
      Page,
      { size: "A4", style: styles.page },
      h(Text, { style: styles.h1 }, "Ministry of Agriculture Liberia"),
      h(Text, { style: styles.muted }, title),
      h(
        Text,
        { style: [styles.muted, { marginTop: 6 }] },
        `Report date: ${generatedAt.slice(0, 10)}`,
      ),
      h(
        View,
        { style: { marginTop: 14 } },
        h(Text, { style: styles.h2 }, "Summary"),
        h(Text, null, `Total expected yield (kg): ${Math.round(totals.expected)}`),
        h(Text, null, `Total actual yield (kg): ${Math.round(totals.actual)}`),
        h(Text, null, `Total loss (kg): ${Math.round(totals.loss)}`),
      ),
      h(
        View,
        { style: { marginTop: 14 } },
        h(Text, { style: styles.h2 }, "County breakdown"),
        h(
          View,
          { style: [styles.row, { borderBottom: "1px solid #9ca3af" }] },
          h(Text, { style: [styles.cell, styles.muted] }, "County"),
          h(Text, { style: [styles.cellRight, styles.muted] }, "Expected (kg)"),
          h(Text, { style: [styles.cellRight, styles.muted] }, "Actual (kg)"),
          h(Text, { style: [styles.cellRight, styles.muted] }, "Loss (kg)"),
        ),
        ...rows.map((r) =>
          h(
            View,
            { key: r.county, style: styles.row },
            h(Text, { style: styles.cell }, r.county),
            h(Text, { style: styles.cellRight }, String(Math.round(r.expected))),
            h(Text, { style: styles.cellRight }, String(Math.round(r.actual))),
            h(Text, { style: styles.cellRight }, String(Math.round(r.loss))),
          ),
        ),
      ),
      h(
        View,
        { style: styles.footer },
        h(Text, { style: styles.muted }, "Signature"),
        h(View, { style: styles.sigLine }),
        h(Text, { style: [styles.muted, { marginTop: 6 }] }, "Name / Title · Ministry of Agriculture Liberia"),
      ),
    ),
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as ReqBody;
  if (!body?.format) return NextResponse.json({ error: "format required" }, { status: 400 });

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Supabase not configured." },
      { status: 503 },
    );
  }

  let q = supabase
    .from("rice_production_records")
    .select("county, expected_yield_kg, actual_yield_kg, post_harvest_loss_kg")
    .limit(5000);
  if (body.season) q = q.eq("season", body.season);
  if (body.county) q = q.eq("county", body.county);
  const { data } = await q;

  const agg = new Map<string, { expected: number; actual: number; loss: number }>();
  for (const r of (data as any[]) ?? []) {
    const c = (r.county ?? "Unknown") as string;
    const expected = Number(r.expected_yield_kg ?? 0);
    const actual = Number(r.actual_yield_kg ?? 0);
    const loss = Number(r.post_harvest_loss_kg ?? Math.max(0, expected - actual));
    const prev = agg.get(c) ?? { expected: 0, actual: 0, loss: 0 };
    prev.expected += expected;
    prev.actual += actual;
    prev.loss += loss;
    agg.set(c, prev);
  }

  const rows = Array.from(agg.entries())
    .map(([county, v]) => ({ county, ...v }))
    .sort((a, b) => b.actual - a.actual);

  const generatedAt = new Date().toISOString();
  const title = `Rice Production Report${body.season ? ` · Season ${body.season}` : ""}${body.county ? ` · ${body.county}` : ""}`;

  if (body.format === "csv") {
    const csv = [
      ["County", "Expected (kg)", "Actual (kg)", "Loss (kg)"].map(csvCell).join(","),
      ...rows.map((r) =>
        [r.county, Math.round(r.expected), Math.round(r.actual), Math.round(r.loss)].map(csvCell).join(","),
      ),
    ].join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="Agrivault-Rice-Report-${generatedAt.slice(0, 10)}.csv"`,
      },
    });
  }

  const doc = buildRiceReportDoc({ title, generatedAt, rows });
  const instance = pdf(doc);
  const buf = (await instance.toBuffer()) as unknown as Uint8Array;
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  return new NextResponse(ab, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="Agrivault-Rice-Report-${generatedAt.slice(0, 10)}.pdf"`,
    },
  });
}

