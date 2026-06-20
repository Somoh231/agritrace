import Link from "next/link";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import OfflineFieldOperationsCard from "@/components/pwa/OfflineFieldOperationsCard";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import { StatTile } from "@/components/workspace/ui";
import {
  dataQualityAlerts,
  farmerRegistrationPipeline,
  nationalHeroMetrics,
  postHarvestLossAlerts,
} from "@/lib/demo/agriculture-pilot-data";

type TabId = "dao" | "cac" | "drafts" | "submitted" | "review" | "verified" | "escalated" | "archived";

type Tab = {
  id: TabId;
  label: string;
  hint: string;
};

const TABS: Tab[] = [
  { id: "dao", label: "DAO reporting", hint: "CLAN field capture consolidated at district level" },
  { id: "cac", label: "CAC reporting", hint: "County verification, approval, and consolidation" },
  { id: "drafts", label: "Drafts", hint: "Offline drafts and queued submissions" },
  { id: "submitted", label: "Submitted", hint: "Recently submitted reporting artefacts" },
  { id: "review", label: "Under review", hint: "Items awaiting CAC verification decisions" },
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
    <Link href={item.href} className="group gov-card gov-card-hover px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate">{item.title}</div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">{item.body}</p>
          <div className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">{item.meta}</div>
        </div>
        <span className="font-mono text-[13px] text-[rgb(var(--ministry-gold-strong))] shrink-0 transition group-hover:translate-x-0.5">→</span>
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

export default async function ReportingWorkspacePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const tabRaw = typeof sp.tab === "string" ? sp.tab : Array.isArray(sp.tab) ? sp.tab[0] : undefined;
  const normalizedTab = tabRaw === "cao" ? "cac" : tabRaw;
  const tab = (TABS.some((t) => t.id === normalizedTab) ? normalizedTab : "dao") as TabId;
  const tabMeta = TABS.find((t) => t.id === tab) ?? TABS[0]!;
  const sections = sectionForTab(tab);

  const hero = nationalHeroMetrics;
  const pipeline = farmerRegistrationPipeline;
  const activeAlerts =
    postHarvestLossAlerts.filter((a) => a.lossPct > 10).length + dataQualityAlerts.length;
  const nf = (n: number) => Intl.NumberFormat().format(n);

  return (
    <MinistryPageShell
      title="Reporting operations center"
      kicker="Operations · DAO & CAC Reporting"
      description="Unified reporting workspace. Operational chain: CLAN field capture → DAO district review and consolidation → CAC county verification and approval → Ministry national aggregation and intelligence."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <InstallAppButton label="Install App" />
          <Link
            href="/field/sync-queue"
            className="btn-gov-outline h-9 px-3 rounded-lg text-[12px]"
          >
            Offline queue
          </Link>
          <div className="gov-card px-3 py-1.5">
            <SyncStatusIndicator />
          </div>
        </div>
      }
    >
      <div className="gov-card px-4 py-3.5">
        <div className="gov-kicker gov-kicker-gold">Operational posture</div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">
          Offline-first capture is supported. Workflow decisions and audits remain authoritative and traceable across counties.
        </p>
      </div>

      {/* Reporting status strip — seeded pilot metrics */}
      <div className="gov-kicker gov-kicker-gold mt-5">Reporting status</div>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile href="/national-heat-map" label="Counties reporting" value={`${hero.countiesReporting}/15`} hint="pilot cadence" />
        <StatTile href="/field-agents" label="Active field officers" value={nf(hero.activeFieldOfficers)} hint={`${hero.activeCountyAgOfficers} county coordinators`} />
        <StatTile href="/verification-queue" label="Pending verification" value={nf(pipeline.pendingVerification)} hint="awaiting CAC decision" />
        <StatTile href="/alerts" label="Active alerts" value={String(activeAlerts)} hint="escalations & quality signals" />
      </div>

      <div className="mt-4">
        <OfflineFieldOperationsCard />
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <Link
              key={t.id}
              href={`/reporting/workspace?tab=${t.id}`}
              className={[
                "h-8 px-3 rounded-md border text-[12px] inline-flex items-center transition",
                active
                  ? "border-[rgb(var(--ministry-gold-strong))]/50 bg-[rgb(var(--ministry-gold))]/[0.16] text-slate-900 font-medium"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[rgb(var(--ministry-gold))]/40",
              ].join(" ")}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-2.5 text-[12px] text-slate-600">
        <span className="font-semibold text-slate-900">{tabMeta.label}.</span> {tabMeta.hint}
      </div>

      <div className="mt-5 space-y-5">
        {sections.map((sec) => (
          <section key={sec.label} className="space-y-2.5">
            <div className="gov-kicker gov-kicker-gold">{sec.label}</div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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

