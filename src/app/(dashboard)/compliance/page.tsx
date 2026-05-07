import Link from "next/link";

import MinistryPageShell from "@/components/operations/MinistryPageShell";

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

export default function ComplianceHubPage() {
  const sections: Array<{ label: string; items: LinkCard[] }> = [
    {
      label: "Audit and compliance",
      items: [
        {
          title: "Audit logs",
          body: "Immutable audit trail for workflow and reporting mutations.",
          href: "/compliance/audit-log",
          meta: "Audit",
        },
        {
          title: "Compliance reports",
          body: "Automated compliance reporting surfaces and dossiers.",
          href: "/compliance/reports",
          meta: "Compliance",
        },
        {
          title: "Distribution anomalies",
          body: "Anomaly review desk for operational exceptions and investigations.",
          href: "/compliance/anomalies",
          meta: "Anomalies",
        },
        {
          title: "Procurement oversight",
          body: "Procurement compliance and oversight workspace.",
          href: "/compliance/procurement",
          meta: "Procurement",
        },
      ],
    },
    {
      label: "Oversight exports",
      items: [
        {
          title: "Donor reports",
          body: "Donor-facing reporting extracts (read-only).",
          href: "/reports/donor",
          meta: "Donor",
        },
        {
          title: "Audit tools",
          body: "Operational audit tools for internal oversight and verification.",
          href: "/audit-tools",
          meta: "Tools",
        },
        {
          title: "Donor dashboard",
          body: "Oversight dashboard for partners and auditors (read-only posture).",
          href: "/donor-dashboard",
          meta: "Oversight",
        },
      ],
    },
  ];

  return (
    <MinistryPageShell
      title="Compliance"
      description="Administration is organized around compliance and audit posture. Donor reports, audit tools, procurement oversight, and anomalies remain accessible here without inflating the sidebar."
    >
      <div className="space-y-6">
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

