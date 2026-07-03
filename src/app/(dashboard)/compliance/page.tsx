import Link from "next/link";
import { Shield } from "lucide-react";

import { PageHeader, SectionHeader } from "@/components/enterprise";

type LinkCard = {
  title: string;
  body: string;
  href: string;
  meta: string;
  tone?: "default" | "risk";
};

function Card({ item }: { item: LinkCard }) {
  return (
    <Link
      href={item.href}
      className="gov-card gov-card-hover group block px-5 py-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="ent-section-title truncate group-hover:text-forest-800 transition">{item.title}</div>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{item.body}</p>
          <div className="mt-3 ent-label">{item.meta}</div>
        </div>
        <span className="font-mono text-[12px] text-forest-700 shrink-0 opacity-70 group-hover:opacity-100">→</span>
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
          tone: "risk",
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
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="Administration · Compliance"
        title="Compliance command center"
        description="Audit posture, anomaly review, procurement oversight, and donor exports — organized for ministry administrators and auditors."
        actions={
          <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
            <Shield className="h-4 w-4 text-forest-700" aria-hidden />
            <span className="ent-label !text-[9px]">Enterprise compliance</span>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="enterprise-card px-4 py-3">
          <p className="ent-label">Audit events (24h)</p>
          <p className="ent-metric mt-1">1,284</p>
        </div>
        <div className="enterprise-card px-4 py-3">
          <p className="ent-label">Open anomalies</p>
          <p className="ent-metric mt-1 text-amber-700">12</p>
        </div>
        <div className="enterprise-card px-4 py-3">
          <p className="ent-label">Compliance score</p>
          <p className="ent-metric mt-1 text-emerald-700">94%</p>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((sec) => (
          <section key={sec.label} className="space-y-3">
            <SectionHeader kicker="Compliance" title={sec.label} />
            <div className="grid gap-3 md:grid-cols-2">
              {sec.items.map((item) => (
                <Card key={item.href} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
