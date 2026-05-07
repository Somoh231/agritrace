import Link from "next/link";

import MinistryPageShell from "@/components/operations/MinistryPageShell";
import SyncStatusIndicator from "@/components/shared/SyncStatusIndicator";
import InstallAppButton from "@/components/pwa/InstallAppButton";

type ReportLink = {
  title: string;
  body: string;
  href: string;
  meta: string;
};

const REPORTING_LINKS: Array<{ label: string; items: ReportLink[] }> = [
  {
    label: "Field capture (DAO)",
    items: [
      {
        title: "Field activity reports",
        body: "Offline-capable checklist capture and operational notes for extension officers.",
        href: "/field/mobile",
        meta: "DAO submit · GPS stubs · attachments placeholders",
      },
      {
        title: "DAO inspection reports",
        body: "Geo-stamped inspection visits tied to farmer IDs and verification outcomes.",
        href: "/field/inspections",
        meta: "DAO submit · timestamps · geo evidence",
      },
      {
        title: "Pest / disease reports",
        body: "Structured phytosanitary alerts routed to county and ministry desks.",
        href: "/field/pest-reports",
        meta: "DAO submit · escalation-ready",
      },
      {
        title: "Extension officer reports",
        body: "Extension intelligence correlated with programmes and county posture.",
        href: "/field/extension-reports",
        meta: "DAO submit · coordination notes",
      },
    ],
  },
  {
    label: "County review (CAO) + verification",
    items: [
      {
        title: "Pending verifications",
        body: "Unified verification queue for DAO artefacts, subsidy attestations, and custody confirmations.",
        href: "/verification-queue",
        meta: "CAO review · approve/reject/escalate",
      },
      {
        title: "Registration approvals",
        body: "Flagged registrations requiring supervisory sign-off.",
        href: "/registration-approvals",
        meta: "CAO review · reject/escalate routing",
      },
      {
        title: "Escalations & incidents",
        body: "Active escalation ledger — unresolved anomalies requiring oversight.",
        href: "/alerts",
        meta: "CAO→Ministry escalation desk",
      },
    ],
  },
  {
    label: "Ministry consolidation",
    items: [
      {
        title: "Farmer registration reports",
        body: "Registry table (demo + Supabase) with verification posture and routing metadata.",
        href: "/farmers",
        meta: "Consolidate · verify · export",
      },
      {
        title: "Subsidy distribution reports",
        body: "Ground-truth issuance events reconciling allocations vs deliveries.",
        href: "/subsidies/distribution",
        meta: "Ledger · audit-ready",
      },
      {
        title: "Warehouse reports",
        body: "Warehouse operations, thresholds, and geo anchors for routing and compliance.",
        href: "/operations/warehouses",
        meta: "Custody · pressure posture",
      },
      {
        title: "Transfer verification reports",
        body: "National transfer trace — corridor approval/dispatch/receipt/verify workflow.",
        href: "/transfers",
        meta: "Chain of custody · audit timeline",
      },
    ],
  },
  {
    label: "National operational intelligence (derived from reporting)",
    items: [
      {
        title: "Command center",
        body: "National posture from reporting pipelines: reporting cadence, risks, verification backlog, warehouse pressure.",
        href: "/command-center",
        meta: "National ops",
      },
      {
        title: "Food security reports",
        body: "Food risk posture derived from county signals and field reporting cadence.",
        href: "/food-security",
        meta: "Early warning",
      },
      {
        title: "GIS intelligence",
        body: "Operational layers: submitted reporting signals, verification backlog, and warehouse posture.",
        href: "/gis-intelligence",
        meta: "Operational map",
      },
      {
        title: "Audit reports",
        body: "Immutable audit trail for workflow and reporting mutations.",
        href: "/compliance/audit-log",
        meta: "Audit",
      },
    ],
  },
];

function Card({ item }: { item: ReportLink }) {
  return (
    <Link
      href={item.href}
      className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-4 hover:border-emerald-600/40 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-white truncate">{item.title}</div>
          <p className="mt-2 text-[12px] leading-relaxed text-slate-400">{item.body}</p>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {item.meta}
          </div>
        </div>
        <span className="font-mono text-[12px] text-emerald-300/80 shrink-0">→</span>
      </div>
    </Link>
  );
}

export default function ReportingHubPage() {
  return (
    <MinistryPageShell
      title="Reporting hub"
      description="Reporting is the operational core: DAO capture → CAO review/verification → Ministry consolidation → National operational intelligence. All dashboards, GIS, inventory posture, alerts, and AI derive from these reporting workflows."
      actions={
        <div className="flex items-center gap-2">
          <InstallAppButton />
          <Link
            href="/field/sync-queue"
            className="h-9 px-3 rounded-lg border border-slate-600 bg-slate-950 text-[12px] text-slate-200 hover:bg-slate-900 inline-flex items-center"
          >
            Offline queue
          </Link>
          <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1">
            <SyncStatusIndicator />
          </div>
        </div>
      }
    >
      <div className="rounded-xl border border-emerald-900/35 bg-emerald-950/15 px-5 py-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">
          Offline operational mode enabled
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
          Forms support offline capture and queued synchronization via IndexedDB. When connectivity is restored, queued records replay through the sync pipeline automatically.
        </p>
      </div>

      <div className="space-y-6">
        {REPORTING_LINKS.map((sec) => (
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

