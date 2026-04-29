import Link from "next/link";
import type { ReactNode } from "react";

import { getInstitutionalMetrics } from "@/lib/readiness/metrics";

export const dynamic = "force-dynamic";

const POLICY_ITEMS = [
  "Government of Liberia retains ownership and control of all sovereign agriculture data.",
  "Role-based access is enforced via user profile roles and organization scoping.",
  "All major admin and operational actions are recorded in immutable audit logs.",
  "Data access and usage monitoring is available through activity and analytics events.",
  "Platform resilience is monitored through launch-readiness and health checks.",
];

export default async function GovernancePage() {
  const metrics = await getInstitutionalMetrics();

  return (
    <div className="space-y-4 max-w-6xl">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Data governance</div>
        <h1 className="mt-2 font-display text-[24px] text-gray-900">Governance and data ownership center</h1>
        <p className="mt-2 text-[13px] text-gray-600 max-w-3xl">
          Government owns the data. AgriVault provides controlled access, auditability, and institutional operations
          tooling for Ministry-led governance.
        </p>
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[12px] text-green-800">
          Sovereign statement: <strong>Government of Liberia is the data controller and owner.</strong>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Kpi label="Registered users" value={fmt(metrics.users)} />
        <Kpi label="Organizations" value={fmt(metrics.organizations)} />
        <Kpi label="Audit events" value={fmt(metrics.auditEvents)} />
        <Kpi label="Access events" value={fmt(metrics.analyticsEvents)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Roles & permissions matrix" subtitle="Review and update role assignments and account state.">
          <div className="space-y-2 text-[12px] text-gray-700">
            {[
              "super_admin: full system governance",
              "government_officer: ministry operations and reports",
              "county_officer: county-level operations",
              "field_agent / call_center_agent: data capture",
              "auditor: read-only audit and compliance oversight",
            ].map((item) => (
              <div key={item} className="rounded-md border border-gray-100 px-3 py-2 bg-gray-50">
                {item}
              </div>
            ))}
          </div>
          <Link href="/admin/users" className="mt-3 inline-block text-[12px] text-forest-700 hover:underline">
            Open user management →
          </Link>
        </Card>

        <Card title="Policy & governance controls" subtitle="Operational controls aligned with ministry oversight.">
          <ul className="space-y-2 text-[12px] text-gray-700">
            {POLICY_ITEMS.map((item) => (
              <li key={item} className="rounded-md border border-gray-100 px-3 py-2 bg-gray-50">
                {item}
              </li>
            ))}
          </ul>
          <Link href="/admin/settings" className="mt-3 inline-block text-[12px] text-forest-700 hover:underline">
            Open system settings →
          </Link>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <QuickLink title="Activate / deactivate users" href="/admin/users" body="Control account lifecycle and active state." />
        <QuickLink title="Organization governance" href="/admin/organizations" body="Manage ministry, county, and partner organizations." />
        <QuickLink title="Full audit log UI" href="/activity" body="Review operational events and accountability trails." />
        <QuickLink title="Data access activity logs" href="/admin/analytics" body="Track page-level access and interaction activity." />
        <QuickLink title="Governance readiness checks" href="/admin/launch-readiness" body="Verify infrastructure and schema readiness." />
        <QuickLink title="System health" href="/health" body="Monitor dependencies and runtime health signals." />
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{label}</div>
      <div className="mt-2 font-display text-[24px] text-gray-900">{value}</div>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="font-display text-[18px] text-gray-900">{title}</h2>
      <p className="mt-1 text-[12px] text-gray-600">{subtitle}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function QuickLink({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-gray-200 bg-white p-4 block hover:bg-gray-50 transition">
      <div className="font-display text-[17px] text-gray-900">{title}</div>
      <div className="mt-1 text-[12px] text-gray-600">{body}</div>
    </Link>
  );
}

function fmt(v: number | null) {
  if (v === null) return "—";
  return Intl.NumberFormat().format(v);
}

