"use client";

import * as React from "react";

import LiveQueryGrid from "@/components/operations/LiveQueryGrid";
import MinistryPageShell from "@/components/operations/MinistryPageShell";
import type { GridColumn } from "@/components/operations/EnterpriseDataGrid";

const FIELD_COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "submitted_at", header: "When" },
  { key: "county", header: "County" },
  { key: "summary", header: "Signal" },
  { key: "channel", header: "Channel" },
];

const EXP_COLS: GridColumn<Record<string, unknown>>[] = [
  { key: "checked_at", header: "Checked" },
  { key: "alert_level", header: "Level" },
  { key: "warehouse_stock_id", header: "Stock row" },
];

export default function LiveAlertsClient() {
  return (
    <MinistryPageShell
      title="Live alerts"
      description="Recent field intelligence submissions and expiry risk watches pulled from operational tables."
    >
      <div className="space-y-8">
        <LiveQueryGrid
          table="field_reports"
          select="submitted_at,county,summary,channel"
          columns={FIELD_COLS}
          filename="field-alerts.csv"
          title="Field intelligence queue"
        />
        <LiveQueryGrid
          table="expiry_tracking"
          select="checked_at,alert_level,warehouse_stock_id"
          columns={EXP_COLS}
          filename="expiry-alerts.csv"
          title="Expiry / loss sentinel events"
        />
      </div>
    </MinistryPageShell>
  );
}
