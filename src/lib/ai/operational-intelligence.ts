import { MINISTRY_COUNTY_METRICS, MINISTRY_OPERATIONAL_EVENTS, MINISTRY_WAREHOUSES } from "@/lib/data/ministry-canonical-data";
import type { TransferOrderView } from "@/lib/logistics/types";

export type AiInsightSeverity = "critical" | "warning" | "watch";

export type AiInsight = {
  id: string;
  severity: AiInsightSeverity;
  title: string;
  detail: string;
  recommendedActions: string[];
  signalTags: string[];
};

export type AiIntelligenceInputs = {
  transfers: TransferOrderView[];
  /** Approx from warehouse_stock; if unavailable, pass null */
  lowStockSkuApprox: number | null;
  /** Approx from warehouse_stock expiry_date window; if unavailable, pass null */
  expiryRiskApprox: number | null;
  /** distribution_logs count; if unavailable, pass null */
  distributionCount: number | null;
  /** field_reports count in last 30d; if unavailable, pass null */
  daoReports30d: number | null;
};

function sevRank(s: AiInsightSeverity): number {
  return s === "critical" ? 3 : s === "warning" ? 2 : 1;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function countyFraudRiskHeuristic(county: { foodRisk: string; daoCompliance: number; productionIndex: number }) {
  // Higher risk when compliance low and production weak; food risk “Elevated” adds pressure.
  const food = county.foodRisk.toLowerCase().includes("elevated") ? 22 : county.foodRisk.toLowerCase().includes("moderate") ? 10 : 4;
  const dao = (100 - county.daoCompliance) * 0.6;
  const prod = (78 - county.productionIndex) * 0.45;
  return clamp(Math.round(food + dao + prod), 0, 100);
}

function predictStockoutDays(lowSkuApprox: number | null, inTransit: number): number | null {
  if (lowSkuApprox == null) return null;
  // Simple (demo) model: more low SKUs and more in-transit corridors => shorter runway.
  const base = 18 - Math.min(14, Math.round(lowSkuApprox / 5));
  const corridor = Math.min(6, Math.round(inTransit / 2));
  return clamp(base - corridor, 3, 21);
}

export function buildAiOperationalInsights(inputs: AiIntelligenceInputs): {
  insights: AiInsight[];
  anomalies: AiInsight[];
  recommendedActions: AiInsight[];
  interventionPriorities: Array<{ county: string; score: number; reason: string }>;
} {
  const inTransit = inputs.transfers.filter((t) => t.status === "in_transit" || t.status === "dispatched").length;
  const disputed = inputs.transfers.filter((t) => t.status === "disputed").length;
  const pendingApproval = inputs.transfers.filter((t) => t.status === "requested").length;

  const stockoutDays = predictStockoutDays(inputs.lowStockSkuApprox, inTransit);

  const overCap = MINISTRY_WAREHOUSES.filter((w) => w.utilizationPct >= 90);
  const capStress = MINISTRY_WAREHOUSES.filter((w) => w.utilizationPct >= 88);

  const pestEscalations = MINISTRY_OPERATIONAL_EVENTS.filter((e) => e.eventType.toLowerCase().includes("pest") && (e.status === "Open" || e.status === "Escalated"));

  const interventionPriorities = [...MINISTRY_COUNTY_METRICS]
    .map((c) => {
      const food = c.foodRisk.toLowerCase().includes("elevated") ? 22 : c.foodRisk.toLowerCase().includes("moderate") ? 12 : 6;
      const dao = (100 - c.daoCompliance) * 0.55;
      const prod = (76 - c.productionIndex) * 0.5;
      const score = clamp(Math.round(food + dao + prod), 0, 100);
      const reason =
        c.foodRisk.toLowerCase().includes("elevated")
          ? "Food risk elevated"
          : c.daoCompliance < 84
            ? "DAO compliance under target"
            : "Production index below target";
      return { county: c.county, score, reason };
    })
    .sort((a, b) => b.score - a.score);

  const topIntervention = interventionPriorities[0];
  const bong = MINISTRY_COUNTY_METRICS.find((c) => c.county === "Bong") ?? null;

  const insights: AiInsight[] = [];
  const anomalies: AiInsight[] = [];
  const actions: AiInsight[] = [];

  if (bong && bong.daoCompliance < 86) {
    anomalies.push({
      id: "ai-bong-subsidy-low",
      severity: "warning",
      title: "Bong County subsidy utilization unusually low",
      detail: "Heuristic flag: subsidy footprint vs county posture suggests lagging delivery or reporting gaps. Validate distribution_logs channels and DAO cadence.",
      recommendedActions: [
        "Pull distribution_logs for Bong channels (dao_subsidy:*).",
        "Review DAO overdue reports and run a supervision sweep for evidence refs.",
        "Cross-check warehouse allocations feeding Bong corridor.",
      ],
      signalTags: ["subsidy", "dao", "county:Bong"],
    });
  }

  if (stockoutDays != null) {
    insights.push({
      id: "ai-stockout-runway",
      severity: stockoutDays <= 7 ? "critical" : stockoutDays <= 12 ? "warning" : "watch",
      title: `Warehouse WH-NIM-001 likely stockout in ${stockoutDays} days`,
      detail: "Demo forecast based on low-stock SKU count and corridor activity. Replace with real consumption rates once warehouse_stock velocity is modeled.",
      recommendedActions: [
        "Prioritize inbound replenishment for WH-NIM-001 (seed/fertilizer SKUs).",
        "Expedite in-transit confirmations to unlock reallocation buffers.",
        "Review donor shipments routing into Nimba corridor.",
      ],
      signalTags: ["inventory", "stockout", "warehouse:WH-NIM-001"],
    });
  }

  if ((inputs.daoReports30d ?? 0) > 0 && inputs.daoReports30d != null && inputs.daoReports30d < 10) {
    anomalies.push({
      id: "ai-dao-reporting-drop",
      severity: "warning",
      title: "DAO reporting compliance dropped below threshold",
      detail: "Low volume of field_reports in last 30 days suggests reduced cadence or RLS redaction for this role.",
      recommendedActions: [
        "Validate field_reports ingestion and RLS permissions for oversight role.",
        "Check network/offline queue health for DAO clients.",
        "Escalate counties with low compliance to intervention queue.",
      ],
      signalTags: ["dao", "anomaly", "reporting"],
    });
  } else {
    const lowDao = interventionPriorities.filter((c) => c.reason.includes("DAO") || c.score >= 55).slice(0, 4);
    if (lowDao.length) {
      insights.push({
        id: "ai-dao-cadence",
        severity: "watch",
        title: "DAO cadence variance detected across counties",
        detail: `Top supervision priorities: ${lowDao.map((c) => c.county).join(", ")}.`,
        recommendedActions: [
          "Review DAO officer warning list; assign county-level backstops.",
          "Enforce weekly submission SLAs and verify evidence capture (geo_locations).",
        ],
        signalTags: ["dao", "compliance"],
      });
    }
  }

  if (pestEscalations.length) {
    const counties = [...new Set(pestEscalations.map((p) => p.county).filter(Boolean))];
    insights.push({
      id: "ai-pest-risk",
      severity: "critical",
      title: "Pest outbreak risk elevated in Lofa",
      detail: counties.length ? `Active pest escalations: ${counties.join(", ")}.` : "Active pest escalation signals detected in pilot ledger.",
      recommendedActions: [
        "Dispatch DAO verification + field inspections for affected districts.",
        "Pre-position inputs and plan targeted distributions to reduce yield loss.",
        "Open GIS intelligence and enable Pest outbreaks layer for spatial triage.",
      ],
      signalTags: ["pest", "risk", "field_reports"],
    });
  }

  if (capStress.length) {
    const worst = capStress.sort((a, b) => b.utilizationPct - a.utilizationPct)[0];
    actions.push({
      id: "ai-capacity-forecast",
      severity: overCap.length ? "warning" : "watch",
      title: `Warehouse utilization forecast: ${overCap.length ? "over-capacity pressure" : "elevated fill rates"}`,
      detail: `Hubs ≥88% utilization: ${capStress.length}. Peak pressure at ${worst?.ministryCode ?? "—"} (${worst?.utilizationPct ?? "—"}%).`,
      recommendedActions: [
        "Schedule redistribution from ≥90% hubs to relief facilities.",
        "Reduce dwell time: clear inbound/outbound dispatch queues and confirmations.",
        "Audit loss/adjustment movements for leakage signals.",
      ],
      signalTags: ["warehouse", "capacity", "forecast"],
    });
  }

  if (disputed > 0 || pendingApproval > 0) {
    anomalies.push({
      id: "ai-transfer-friction",
      severity: disputed > 0 ? "warning" : "watch",
      title: "Transfer workflow friction detected",
      detail: `${pendingApproval} pending approvals · ${disputed} disputed confirmations · ${inTransit} in motion.`,
      recommendedActions: [
        "Prioritize dispute resolution where receiver sign-off is missing.",
        "Escalate corridors with >72h in_transit dwell to logistics lead.",
        "Use warehouse detail pages to reconcile damaged/expiry risk lines.",
      ],
      signalTags: ["transfer", "workflow", "anomaly"],
    });
  }

  if (topIntervention && topIntervention.score >= 62) {
    actions.push({
      id: "ai-intervention-priority",
      severity: topIntervention.score >= 78 ? "critical" : "warning",
      title: `Intervention priority: ${topIntervention.county}`,
      detail: `Priority score ${topIntervention.score}/100 — ${topIntervention.reason}.`,
      recommendedActions: [
        "Open county operations and assign DAO supervision + targeted distribution schedule.",
        "Cross-check food security indicators and post-harvest loss posture.",
        "Verify subsidy delivery chain completeness (distribution_logs + geo_locations).",
      ],
      signalTags: ["county", "priority", "action"],
    });
  }

  // Fraud risk: show top counties by heuristic score.
  const fraudTop = [...MINISTRY_COUNTY_METRICS]
    .map((c) => ({ county: c.county, score: countyFraudRiskHeuristic(c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  if (fraudTop.length) {
    insights.push({
      id: "ai-fraud-risk",
      severity: fraudTop[0]!.score >= 70 ? "warning" : "watch",
      title: "Subsidy fraud risk hotspots (heuristic)",
      detail: `Highest-risk counties: ${fraudTop.map((x) => `${x.county} ${x.score}/100`).join(" · ")}.`,
      recommendedActions: [
        "Review distribution_logs for missing evidence refs and outlier quantities.",
        "Cross-check farmer verification posture and GPS evidence coverage.",
        "Sample audit_log chain for DAO_SUBSIDY_DELIVERY_VERIFY sequences.",
      ],
      signalTags: ["subsidy", "fraud_risk", "audit"],
    });
  }

  const all = [...insights, ...anomalies, ...actions].sort((a, b) => sevRank(b.severity) - sevRank(a.severity));
  return {
    insights: all.filter((x) => x.signalTags.includes("risk") || x.signalTags.includes("forecast") || x.signalTags.includes("priority")).slice(0, 6),
    anomalies: anomalies.slice(0, 6),
    recommendedActions: actions.slice(0, 6),
    interventionPriorities: interventionPriorities.slice(0, 8),
  };
}

