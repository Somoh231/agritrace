import Link from "next/link";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";

type TabId = "dao" | "cao" | "drafts" | "submitted" | "review" | "verified" | "escalated" | "archived";

type Tab = {
  id: TabId;
  label: string;
  hint: string;
};

const TABS: Tab[] = [
  { id: "dao", label: "DAO reporting", hint: "Capture and submit field evidence" },
  { id: "cao", label: "CAO reporting", hint: "Review, verify, and consolidate county posture" },
  { id: "drafts", label: "Drafts", hint: "Offline drafts and queued submissions" },
  { id: "submitted", label: "Submitted", hint: "Recently submitted reporting artefacts" },
  { id: "review", label: "Under review", hint: "Items awaiting CAO verification decisions" },
  { id: "verified", label: "Verified", hint: "Approved, verified, and closed-out items" },
  { id: "escalated", label: "Escalated", hint: "Incidents and verification escalations" },
  { id: "archived", label: "Archived", hint: "Historical packages and exports" },
];

type LinkCard = {
  title: string;
  body: string;
  href: string;
  meta: string;
};

function Card({ item }: { item: LinkCard }) {
  return (
    <Link
      href={item.href}
      className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-4 hover:border-emerald-600/40 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-white truncate">{item.title}</div>
          <p className="mt-2 text-[12px] leading-relaxed text-slate-400">{item.body}</p>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{item.meta}</div>
        </div>
        <span className="font-mono text-[12px] text-emerald-300/80 shrink-0">→</span>
      </div>
    </Link>
  );
}

function sectionForTab(tab: TabId): { label: string; items: LinkCard[] }[] {
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

  if (tab === "cao") {
    return [
      {
        label: "CAO reports (county consolidation)",
        items: [
          {
            title: "County summaries",
            body: "County-level consolidation of DAO submissions and posture.",
            href: "/county-dashboard",
            meta: "CAO consolidate · cadence + posture",
          },
          {
            title: "DAO verification reviews",
            body: "Unified verification queue for approvals, rejections, escalations, and investigations.",
            href: "/verification-queue",
            meta: "CAO review · approve/reject/escalate",
          },
          {
            title: "County escalations",
            body: "Incidents, anomalies, and escalation routing to ministry desks.",
            href: "/alerts",
            meta: "CAO→Ministry escalation desk",
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
            meta: "CAO oversight · custody posture",
          },
          {
            title: "County food security summaries",
            body: "County early warning signals derived from submitted reporting.",
            href: "/food-security",
            meta: "CAO oversight · early warning",
          },
          {
            title: "Compliance reviews",
            body: "Compliance reports, audits, and anomaly tooling.",
            href: "/compliance",
            meta: "CAO oversight · compliance",
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

export default async function ReportingWorkspacePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const tabRaw = typeof sp.tab === "string" ? sp.tab : Array.isArray(sp.tab) ? sp.tab[0] : undefined;
  const tab = (TABS.some((t) => t.id === tabRaw) ? tabRaw : "dao") as TabId;
  const tabMeta = TABS.find((t) => t.id === tab) ?? TABS[0]!;
  const sections = sectionForTab(tab);

  return (
    <MinistryPageShell
      title="DAO & CAO reports"
      description="Unified reporting workspace. Reporting is the core workflow: DAO capture → CAO review/verification → Ministry consolidation → National operational intelligence."
      actions={
        <div className="flex items-center gap-2">
          <InstallAppButton />
          <Link
            href="/field/sync-queue"
            className="h-9 px-3 rounded-lg border border-slate-600 bg-slate-950 text-[12px] text-slate-200 hover:bg-slate-900 inline-flex items-center"
          >
            Drafts / offline queue
          </Link>
          <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1">
            <SyncStatusIndicator />
          </div>
        </div>
      }
    >
      <div className="rounded-xl border border-emerald-900/35 bg-emerald-950/15 px-5 py-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">Operational posture</div>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
          Offline-first capture is supported. Workflow decisions and audits remain authoritative and traceable across counties.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <Link
              key={t.id}
              href={`/reporting/workspace?tab=${t.id}`}
              className={[
                "h-9 px-3 rounded-lg border text-[12px] inline-flex items-center",
                active
                  ? "border-emerald-600/60 bg-emerald-950/25 text-emerald-200"
                  : "border-slate-700 bg-slate-950/40 text-slate-300 hover:bg-slate-900/60",
              ].join(" ")}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 text-[12px] text-slate-400">
        <span className="font-semibold text-slate-200">{tabMeta.label}.</span> {tabMeta.hint}
      </div>

      <div className="mt-6 space-y-6">
        {sections.map((sec) => (
          <section key={sec.label} className="space-y-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-500">{sec.label}</div>
            <div className="grid gap-3 md:grid-cols-2">
              {sec.items.map((item) => (
                <Card key={item.href} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </MinistryPageShell>
  );
}

