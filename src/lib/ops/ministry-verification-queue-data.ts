import type { OperationalChipVariant } from "@/lib/ops/operational-chip-types";
import {
  MINISTRY_DAO_OFFICERS,
  MINISTRY_FARMERS,
  MINISTRY_INVENTORY_MOVEMENTS,
  MINISTRY_WAREHOUSES,
} from "@/lib/data/ministry-canonical-data";

export type VerificationSubmissionType =
  | "farmer_registration"
  | "dao_inspection"
  | "subsidy_verification"
  | "warehouse_transfer_confirmation"
  | "donor_shipment_verification"
  | "gps_verification";

export type VerificationQueueStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "escalated"
  | "resolved";

export type VerificationAuditEvent = {
  at: string;
  actor: string;
  stage: string;
  note: string;
};

export type VerificationQueueDetail = {
  id: string;
  submissionType: VerificationSubmissionType;
  submissionTypeLabel: string;
  county: string;
  district: string;
  dao: string;
  status: VerificationQueueStatus;
  priority: "routine" | "elevated" | "critical";
  narrativeSummary: string;
  auditTimeline: VerificationAuditEvent[];
  metadata: Record<string, string>;
  relatedWarehouse: string | null;
  linkedFarmers: string[];
  operationalNotes: string[];
  attachmentPlaceholders: string[];
  aiSummary: string;
  routingCaption: string;
  chips: OperationalChipVariant[];
};

const REVIEWERS = [
  "CAC · J. Weah (pool)",
  "DAO reviewer · M. Kanneh",
  "Ministry logistics · P. Dennis",
  "Subsidy desk · A. Johnson",
  "Warehouse custody · S. Paye",
  "National reconcile · V. Sumo",
];

function vrfSeq(n: number) {
  return `VRF-2026-${String(n).padStart(4, "0")}`;
}

function hoursBetween(iso: string): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.round((Date.now() - t) / 3600000));
}

function labelSubmission(t: VerificationSubmissionType): string {
  switch (t) {
    case "farmer_registration":
      return "Farmer registration";
    case "dao_inspection":
      return "DAO inspection";
    case "subsidy_verification":
      return "Subsidy verification";
    case "warehouse_transfer_confirmation":
      return "Warehouse transfer confirmation";
    case "donor_shipment_verification":
      return "Donor shipment verification";
    case "gps_verification":
      return "GPS verification";
    default:
      return t;
  }
}

function statusLabel(s: VerificationQueueStatus): string {
  return s.replace(/_/g, " ");
}

function priorityLabel(p: "routine" | "elevated" | "critical"): string {
  return p.toUpperCase();
}

/** DAO → CAC → Ministry narrative cues */
function routingFor(type: VerificationSubmissionType): string {
  switch (type) {
    case "farmer_registration":
      return "Routing: DAO capture → CAC desk QA → Ministry registry attestation.";
    case "dao_inspection":
      return "Routing: DAO field packet → CAC compliance → Ministry oversight if escalated.";
    case "subsidy_verification":
      return "Routing: DAO beneficiary checks → CAC consolidation → Ministry subsidy clearance.";
    case "warehouse_transfer_confirmation":
      return "Routing: Warehouse custody event → County logistics sign-off → Ministry corridor reconcile.";
    case "donor_shipment_verification":
      return "Routing: Donor manifest → Ministry verification (direct) → warehouse receipt attestation.";
    case "gps_verification":
      return "Routing: Field GPS capture → DAO geometry QA → CAC sign-off → Ministry registry linkage.";
    default:
      return "Routing: Standard ministry workflow chain.";
  }
}

function pickChips(params: {
  type: VerificationSubmissionType;
  status: VerificationQueueStatus;
  hours: number;
  donor?: boolean;
  daoWarning?: boolean;
  inventoryHeavy?: boolean;
}): OperationalChipVariant[] {
  const chips: OperationalChipVariant[] = [];
  if (params.status === "escalated") chips.push("escalated");
  if (params.status === "pending" && params.hours > 72) chips.push("compliance_delay");
  if (params.status === "pending" || params.status === "under_review") chips.push("awaiting_verification");
  if (params.donor) chips.push("donor_flagged");
  if (params.inventoryHeavy) chips.push("inventory_risk");
  if (params.daoWarning && params.type === "dao_inspection") chips.push("high_risk");
  if (params.type === "gps_verification") chips.push("connectivity_issue");
  return [...new Set(chips)];
}

export type VerificationGridRow = Record<string, unknown> & { _detail: VerificationQueueDetail };

export function buildUnifiedVerificationQueue(): VerificationGridRow[] {
  const rows: VerificationGridRow[] = [];
  let n = 1;

  const reviewerAt = (i: number) => REVIEWERS[i % REVIEWERS.length];

  for (const f of MINISTRY_FARMERS.filter((x) => x.verification === "Pending")) {
    const submitted = `${f.registrationDate}T14:20:00Z`;
    const hours = hoursBetween(submitted);
    const st: VerificationQueueStatus =
      f.county === "Montserrado" ? "under_review" : f.daoCode.includes("NIM") ? "pending" : "pending";
    const detail: VerificationQueueDetail = {
      id: vrfSeq(n),
      submissionType: "farmer_registration",
      submissionTypeLabel: labelSubmission("farmer_registration"),
      county: f.county,
      district: f.district,
      dao: f.daoCode,
      status: st,
      priority: f.county === "Montserrado" ? "elevated" : "routine",
      narrativeSummary: `District registry packet for ${f.fullName} (${f.registryPublicId}) awaits ministry reconciliation before subsidy enrollment. Cooperative linkage (${f.cooperative}) and primary warehouse custody (${f.primaryWarehouseCode}) require attestation.`,
      routingCaption: routingFor("farmer_registration"),
      auditTimeline: [
        { at: submitted, actor: "DAO capture", stage: "field", note: "Biometric + household capture submitted." },
        {
          at: submitted,
          actor: "System",
          stage: "validation",
          note: "Automated duplicate scan — no collision on national ID placeholder.",
        },
      ],
      metadata: {
        Crop: f.cropType,
        Acreage: `${f.acreageHa} ha`,
        Cooperative: f.cooperative,
        "Primary WH": f.primaryWarehouseCode,
      },
      relatedWarehouse: f.primaryWarehouseCode,
      linkedFarmers: [f.registryPublicId],
      operationalNotes: [
        "DAO officer attestation PDF pending upload.",
        "Subsidy eligibility precondition: verification closure.",
      ],
      attachmentPlaceholders: ["dao_inspection_photo_01.jpg", "hh_roster_stub.pdf"],
      aiSummary:
        hours > 120
          ? "Verification latency exceeds ministry SLA for this county — CAC routing recommended."
          : "Queue posture stable — prioritize subsidy-linked pending farmers before inputs window.",
      chips: pickChips({ type: "farmer_registration", status: st, hours }),
    };
    rows.push({
      id: detail.id,
      county: detail.county,
      district: detail.district,
      dao: detail.dao,
      submissionType: detail.submissionTypeLabel,
      timestamp: submitted,
      priority: priorityLabel(detail.priority),
      status: statusLabel(detail.status),
      verificationAge: `${hours}h`,
      assignedReviewer: reviewerAt(n),
      posture: detail.chips.map((c) => c.replace(/_/g, " ")).join(" · ") || "—",
      _detail: detail,
    });
    n++;
  }

  for (const d of MINISTRY_DAO_OFFICERS.filter((o) => o.overdueReports > 0)) {
    const submitted = `${d.lastActivity}T09:00:00Z`;
    const hours = hoursBetween(submitted);
    const st: VerificationQueueStatus =
      d.status === "Warning" ? "escalated" : d.overdueReports >= 3 ? "under_review" : "pending";
    const detail: VerificationQueueDetail = {
      id: vrfSeq(n),
      submissionType: "dao_inspection",
      submissionTypeLabel: labelSubmission("dao_inspection"),
      county: d.county,
      district: d.district,
      dao: d.daoCode,
      status: st,
      priority: d.overdueReports >= 3 ? "elevated" : "routine",
      narrativeSummary: `Inspection cadence backlog for ${d.daoCode} — ${d.overdueReports} overdue supervisory reports against ${d.reportsSubmitted} filed. Field visits (${d.farmVisits}) remain active; documentation chain breaks ministry QA.`,
      routingCaption: routingFor("dao_inspection"),
      auditTimeline: [
        { at: submitted, actor: d.daoCode, stage: "dao", note: "Partial inspection bundle uploaded." },
        {
          at: submitted,
          actor: "CAC routing",
          stage: "county",
          note: "Compliance reminder issued — awaiting closing narratives.",
        },
      ],
      metadata: {
        "Compliance score": `${d.complianceScore}%`,
        "Overdue reports": String(d.overdueReports),
        "Farm visits (90d)": String(d.farmVisits),
      },
      relatedWarehouse: MINISTRY_WAREHOUSES.find((w) => w.county === d.county)?.ministryCode ?? null,
      linkedFarmers: MINISTRY_FARMERS.filter((x) => x.daoCode === d.daoCode)
        .slice(0, 4)
        .map((x) => x.registryPublicId),
      operationalNotes: ["Escalation path opens if overdue count does not clear within 7 days."],
      attachmentPlaceholders: ["dao_supervisory_form.pdf", "visit_log.csv"],
      aiSummary:
        d.county === "Montserrado"
          ? "Montserrado DAO cadence diverging — connectivity and staffing risk flagged for ministry desk."
          : "District inspection documentation drift detected — consolidate CAC review before subsidy releases.",
      chips: pickChips({
        type: "dao_inspection",
        status: st,
        hours,
        daoWarning: d.status === "Warning",
      }),
    };
    rows.push({
      id: detail.id,
      county: detail.county,
      district: detail.district,
      dao: detail.dao,
      submissionType: detail.submissionTypeLabel,
      timestamp: submitted,
      priority: priorityLabel(detail.priority),
      status: statusLabel(detail.status),
      verificationAge: `${hours}h`,
      assignedReviewer: reviewerAt(n),
      posture: detail.chips.map((c) => c.replace(/_/g, " ")).join(" · ") || "—",
      _detail: detail,
    });
    n++;
  }

  for (const m of MINISTRY_INVENTORY_MOVEMENTS.filter((x) => x.movementType === "transfer")) {
    const submitted = m.occurredAt;
    const hours = hoursBetween(submitted);
    const st: VerificationQueueStatus =
      m.reference.endsWith("051") ? "pending" : m.reference.endsWith("052") ? "under_review" : "verified";
    const detail: VerificationQueueDetail = {
      id: vrfSeq(n),
      submissionType: "warehouse_transfer_confirmation",
      submissionTypeLabel: labelSubmission("warehouse_transfer_confirmation"),
      county: MINISTRY_WAREHOUSES.find((w) => w.ministryCode === m.fromWarehouseCode)?.county ?? "—",
      district: "Corridor",
      dao: "DAO-LOG-OPS",
      status: st,
      priority: m.quantity >= 100 ? "elevated" : "routine",
      narrativeSummary: `Custody movement ${m.reference} (${m.sku}) ${m.fromWarehouseCode} → ${m.toWarehouseCode} requires signed corridor confirmation and receiver reconciliation before ministry ledger closure.`,
      routingCaption: routingFor("warehouse_transfer_confirmation"),
      auditTimeline: [
        { at: submitted, actor: "Warehouse manager", stage: "warehouse", note: "Dispatch stub logged." },
        {
          at: submitted,
          actor: "County logistics",
          stage: "county",
          note: "Cross-county attestation pending seal.",
        },
      ],
      metadata: {
        Reference: m.reference,
        SKU: m.sku,
        Quantity: String(m.quantity),
        From: m.fromWarehouseCode,
        To: m.toWarehouseCode,
      },
      relatedWarehouse: m.toWarehouseCode,
      linkedFarmers: [],
      operationalNotes: ["Seal photographs required at offload bay.", "Variance tolerance ±2% ministry policy."],
      attachmentPlaceholders: ["waybill_scan.pdf", "receiver_stamp.jpg"],
      aiSummary: "Transfer verification backlog correlates with elevated fertilizer drawdown in Nimba–Bong corridor.",
      chips: pickChips({ type: "warehouse_transfer_confirmation", status: st, hours, inventoryHeavy: true }),
    };
    rows.push({
      id: detail.id,
      county: detail.county,
      district: detail.district,
      dao: detail.dao,
      submissionType: detail.submissionTypeLabel,
      timestamp: submitted,
      priority: priorityLabel(detail.priority),
      status: statusLabel(detail.status),
      verificationAge: `${hours}h`,
      assignedReviewer: reviewerAt(n),
      posture: detail.chips.map((c) => c.replace(/_/g, " ")).join(" · ") || "—",
      _detail: detail,
    });
    n++;
  }

  const donorWh = MINISTRY_WAREHOUSES.find((w) => w.donorResupplyFlag);
  if (donorWh) {
    const submitted = "2026-05-05T11:40:00Z";
    const hours = hoursBetween(submitted);
    const detail: VerificationQueueDetail = {
      id: vrfSeq(n),
      submissionType: "donor_shipment_verification",
      submissionTypeLabel: labelSubmission("donor_shipment_verification"),
      county: donorWh.county,
      district: "Regional inbound",
      dao: "DAO-DONOR-LIASON",
      status: "under_review",
      priority: "critical",
      narrativeSummary: `Donor programme inbound for ${donorWh.ministryCode} requires ministry verification of manifest weights, batch IDs, and quarantine documents prior to stock posting.`,
      routingCaption: routingFor("donor_shipment_verification"),
      auditTimeline: [
        { at: submitted, actor: "Donor liaison", stage: "donor", note: "ASN transmitted." },
        { at: submitted, actor: "Ministry reviewer", stage: "ministry", note: "Samples routed to QA bench." },
      ],
      metadata: {
        Warehouse: donorWh.ministryCode,
        Programme: "AGR-DONOR-2026-Q2",
        Manager: donorWh.managerName,
      },
      relatedWarehouse: donorWh.ministryCode,
      linkedFarmers: [],
      operationalNotes: ["Hold stock posting until QA clearance token issued."],
      attachmentPlaceholders: ["manifest.pdf", "bill_of_lading.pdf", "qa_certificate.pdf"],
      aiSummary: "Donor-flagged corridor — prioritize seal continuity checks and variance reconciliation.",
      chips: pickChips({
        type: "donor_shipment_verification",
        status: "under_review",
        hours,
        donor: true,
      }),
    };
    rows.push({
      id: detail.id,
      county: detail.county,
      district: detail.district,
      dao: detail.dao,
      submissionType: detail.submissionTypeLabel,
      timestamp: submitted,
      priority: priorityLabel(detail.priority),
      status: statusLabel(detail.status),
      verificationAge: `${hours}h`,
      assignedReviewer: reviewerAt(n),
      posture: detail.chips.map((c) => c.replace(/_/g, " ")).join(" · ") || "—",
      _detail: detail,
    });
    n++;
  }

  const subsidyPick = MINISTRY_FARMERS.filter((x) => x.verification === "Verified" && x.subsidyEligible).slice(0, 3);
  for (const f of subsidyPick) {
    const submitted = `${f.lastDistributionDate}T13:00:00Z`;
    const hours = hoursBetween(submitted);
    const detail: VerificationQueueDetail = {
      id: vrfSeq(n),
      submissionType: "subsidy_verification",
      submissionTypeLabel: labelSubmission("subsidy_verification"),
      county: f.county,
      district: f.district,
      dao: f.daoCode,
      status: "pending",
      priority: "routine",
      narrativeSummary: `Subsidy reconciliation for ${f.registryPublicId} references distribution ${f.lastDistributionDate} and allocation qty ${f.subsidyAllocationQty}. DAO voucher attestations must align before ministry disbursement lock.`,
      routingCaption: routingFor("subsidy_verification"),
      auditTimeline: [
        { at: submitted, actor: f.daoCode, stage: "dao", note: "Voucher packet assembled." },
        { at: submitted, actor: "CAC subsidy desk", stage: "county", note: "Awaiting secondary signature." },
      ],
      metadata: {
        "Allocation qty": String(f.subsidyAllocationQty),
        "Last distribution": f.lastDistributionDate,
        Crop: f.cropType,
      },
      relatedWarehouse: f.primaryWarehouseCode,
      linkedFarmers: [f.registryPublicId],
      operationalNotes: ["Cross-check cooperative ledger hash against ministry subsidy engine export."],
      attachmentPlaceholders: ["voucher_scan.pdf"],
      aiSummary: "Subsidy verification latency concentrated in rice corridors feeding Nimba and Bong redistribution.",
      chips: pickChips({ type: "subsidy_verification", status: "pending", hours }),
    };
    rows.push({
      id: detail.id,
      county: detail.county,
      district: detail.district,
      dao: detail.dao,
      submissionType: detail.submissionTypeLabel,
      timestamp: submitted,
      priority: priorityLabel(detail.priority),
      status: statusLabel(detail.status),
      verificationAge: `${hours}h`,
      assignedReviewer: reviewerAt(n),
      posture: detail.chips.map((c) => c.replace(/_/g, " ")).join(" · ") || "—",
      _detail: detail,
    });
    n++;
  }

  const gpsTargets = MINISTRY_FARMERS.filter((x) => x.verification === "Pending").slice(0, 2);
  for (const f of gpsTargets) {
    const submitted = `${f.registrationDate}T16:45:00Z`;
    const hours = hoursBetween(submitted);
    const detail: VerificationQueueDetail = {
      id: vrfSeq(n),
      submissionType: "gps_verification",
      submissionTypeLabel: labelSubmission("gps_verification"),
      county: f.county,
      district: f.district,
      dao: f.daoCode,
      status: "under_review",
      priority: "elevated",
      narrativeSummary: `Plot geometry for ${f.registryPublicId} requires DAO cross-check against handheld capture and ministry reference tiles. Connectivity outages reported in district submission logs.`,
      routingCaption: routingFor("gps_verification"),
      auditTimeline: [
        { at: submitted, actor: "Field tablet", stage: "capture", note: "GPS trace uploaded (partial)." },
        {
          at: submitted,
          actor: "DAO QA",
          stage: "district",
          note: "Awaiting ministerial tile overlay confirmation.",
        },
      ],
      metadata: {
        Lat: String(f.gpsLat),
        Lng: String(f.gpsLng),
        Plot: "Primary parcel",
      },
      relatedWarehouse: f.primaryWarehouseCode,
      linkedFarmers: [f.registryPublicId],
      operationalNotes: ["Fallback: manual DAO sketch map attestation if GPS checksum fails."],
      attachmentPlaceholders: ["gps_trace.geojson", "plot_photo.jpg"],
      aiSummary: "GPS reconciliation delays correlate with uplink instability — queue risk increasing for fringe districts.",
      chips: pickChips({ type: "gps_verification", status: "under_review", hours }),
    };
    rows.push({
      id: detail.id,
      county: detail.county,
      district: detail.district,
      dao: detail.dao,
      submissionType: detail.submissionTypeLabel,
      timestamp: submitted,
      priority: priorityLabel(detail.priority),
      status: statusLabel(detail.status),
      verificationAge: `${hours}h`,
      assignedReviewer: reviewerAt(n),
      posture: detail.chips.map((c) => c.replace(/_/g, " ")).join(" · ") || "—",
      _detail: detail,
    });
    n++;
  }

  return rows;
}
