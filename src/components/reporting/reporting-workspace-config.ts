export type ReportingTabId =
  | "dao"
  | "cac"
  | "drafts"
  | "submitted"
  | "review"
  | "verified"
  | "escalated"
  | "archived";

export type ReportingTab = {
  id: ReportingTabId;
  label: string;
  hint: string;
};

export type ReportingLinkCard = {
  title: string;
  body: string;
  href: string;
  meta: string;
};

export const REPORTING_TABS: ReportingTab[] = [
  { id: "dao", label: "DAO reporting", hint: "CLAN field capture consolidated at district level" },
  { id: "cac", label: "CAC reporting", hint: "County verification, approval, and consolidation" },
  { id: "drafts", label: "Drafts", hint: "Offline drafts and queued submissions" },
  { id: "submitted", label: "Submitted", hint: "Recently submitted reporting artefacts" },
  { id: "review", label: "Under review", hint: "Items awaiting CAC verification decisions" },
  { id: "verified", label: "Verified", hint: "Approved, verified, and closed-out items" },
  { id: "escalated", label: "Escalated", hint: "Incidents and verification escalations" },
  { id: "archived", label: "Archived", hint: "Historical packages and exports" },
];

export function reportingSectionsForTab(tab: ReportingTabId): { label: string; items: ReportingLinkCard[] }[] {
  if (tab === "dao") {
    return [
      {
        label: "DAO reports (capture)",
        items: [
          {
            title: "Field activity",
            body: "Offline-capable checklist capture and operational notes.",
            href: "/field/mobile",
            meta: "DAO submit · GPS stubs · attachments placeholders",
          },
          {
            title: "Farmer registration",
            body: "Registry capture and updates tied to county/district assignment.",
            href: "/farmers",
            meta: "DAO submit · identity + traceability",
          },
          {
            title: "Inspection",
            body: "Geo-stamped inspection visits tied to farmer IDs and outcomes.",
            href: "/field/inspections",
            meta: "DAO submit · timestamps · geo evidence",
          },
          {
            title: "Subsidy distribution",
            body: "Field issuance events and reconciliation notes.",
            href: "/subsidies/distribution",
            meta: "DAO submit · ledger",
          },
          {
            title: "Warehouse operations",
            body: "Local warehouse posture capture and basic conditions reporting.",
            href: "/operations/warehouses",
            meta: "DAO submit · custody posture",
          },
          {
            title: "Food security",
            body: "Field signals that feed early warning and county posture.",
            href: "/food-security",
            meta: "DAO submit · early warning",
          },
          {
            title: "Pest / disease",
            body: "Structured phytosanitary alerts routed to county/ministry desks.",
            href: "/field/pest-reports",
            meta: "DAO submit · escalation-ready",
          },
          {
            title: "Extension activity",
            body: "Extension intelligence correlated with programmes and county posture.",
            href: "/field/extension-reports",
            meta: "DAO submit · coordination notes",
          },
        ],
      },
    ];
  }

  if (tab === "cac") {
    return [
      {
        label: "CAC reports (county consolidation)",
        items: [
          {
            title: "County summaries",
            body: "County-level consolidation of DAO submissions and posture.",
            href: "/county-dashboard",
            meta: "CAC consolidate · cadence + posture",
          },
          {
            title: "DAO / CLAN verification reviews",
            body: "Unified verification queue for approvals, rejections, escalations, and investigations.",
            href: "/verification-queue",
            meta: "CAC review · approve/reject/escalate",
          },
          {
            title: "County escalations",
            body: "Incidents, anomalies, and escalation routing to ministry desks.",
            href: "/alerts",
            meta: "CAC→Ministry escalation desk",
          },
          {
            title: "County operational risk",
            body: "Operational intelligence derived from reporting cadence and backlogs.",
            href: "/command-center",
            meta: "Derived · national posture view",
          },
          {
            title: "Warehouse county summaries",
            body: "Warehouse and corridor posture for county oversight.",
            href: "/operations/warehouses",
            meta: "CAC oversight · custody posture",
          },
          {
            title: "County food security summaries",
            body: "County early warning signals derived from submitted reporting.",
            href: "/food-security",
            meta: "CAC oversight · early warning",
          },
          {
            title: "Compliance reviews",
            body: "Compliance reports, audits, and anomaly tooling.",
            href: "/compliance",
            meta: "CAC oversight · compliance",
          },
        ],
      },
    ];
  }

  if (tab === "drafts") {
    return [
      {
        label: "Offline-first posture",
        items: [
          {
            title: "Offline sync queue",
            body: "Review drafts and queued records; push when connectivity returns.",
            href: "/field/sync-queue",
            meta: "IndexedDB queue · reconciliation",
          },
          {
            title: "Field activity (offline entry)",
            body: "Capture checklists and notes even when disconnected.",
            href: "/field/mobile",
            meta: "Offline-capable",
          },
        ],
      },
    ];
  }

  if (tab === "review") {
    return [
      {
        label: "Under review",
        items: [
          {
            title: "Pending verifications",
            body: "Operational verification desk with audit trails and workflow actions.",
            href: "/verification-queue",
            meta: "Approve · reject · escalate · investigation",
          },
          {
            title: "Inspection queue",
            body: "Inspection items requiring review and follow-up.",
            href: "/field/inspections",
            meta: "Queue",
          },
          {
            title: "Registration approvals",
            body: "Flagged registrations requiring supervisory sign-off.",
            href: "/registration-approvals",
            meta: "Review · reject/escalate",
          },
        ],
      },
    ];
  }

  if (tab === "escalated") {
    return [
      {
        label: "Escalations",
        items: [
          {
            title: "Escalations & incidents",
            body: "Active escalation ledger — unresolved anomalies requiring oversight.",
            href: "/alerts",
            meta: "Escalation desk",
          },
          {
            title: "Compliance anomalies",
            body: "Distribution anomalies and compliance tooling.",
            href: "/compliance/anomalies",
            meta: "Anomalies",
          },
        ],
      },
    ];
  }

  if (tab === "archived") {
    return [
      {
        label: "Exports and dossiers",
        items: [
          {
            title: "Export center",
            body: "Export packages and data extracts for reporting cycles.",
            href: "/reports/export",
            meta: "Export",
          },
          {
            title: "PDF dossiers",
            body: "Signed PDF packages and operational dossiers.",
            href: "/reports/pdf",
            meta: "PDF",
          },
          {
            title: "Audit logs",
            body: "Immutable audit trail for workflow and reporting mutations.",
            href: "/compliance/audit-log",
            meta: "Audit",
          },
        ],
      },
    ];
  }

  if (tab === "verified") {
    return [
      {
        label: "Verified posture (derived views)",
        items: [
          {
            title: "Ministry reports",
            body: "Consolidated ministry reporting center.",
            href: "/reports/ministry",
            meta: "Consolidated",
          },
          {
            title: "Command Center",
            body: "National posture derived from reporting pipelines and verification outcomes.",
            href: "/command-center",
            meta: "Derived",
          },
        ],
      },
    ];
  }

  return [
    {
      label: "Submitted posture",
      items: [
        {
          title: "Ministry reports center",
          body: "Primary institutional reporting surfaces and summaries.",
          href: "/reports",
          meta: "Analytics",
        },
        {
          title: "Warehouse command",
          body: "Chain of custody posture from transfers and inventory movement.",
          href: "/logistics",
          meta: "Logistics",
        },
      ],
    },
  ];
}

export function normalizeReportingTab(raw?: string): ReportingTabId {
  const normalized = raw === "cao" ? "cac" : raw;
  return REPORTING_TABS.some((t) => t.id === normalized) ? (normalized as ReportingTabId) : "dao";
}
