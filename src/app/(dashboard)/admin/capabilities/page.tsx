import Link from "next/link";

import { getInstitutionalMetrics } from "@/lib/readiness/metrics";

export const dynamic = "force-dynamic";

const CAPABILITY_GROUPS = [
  {
    title: "Registry and profiles",
    items: [
      { label: "National farmer registry", href: "/cocoa/farmers" },
      { label: "Farm profile records (plots)", href: "/map" },
      { label: "Crop registration records", href: "/rice/production" },
      { label: "Annual renewal / recertification flow", href: "/rice/renewals" },
    ],
  },
  {
    title: "Production intelligence",
    items: [
      { label: "National production dashboard", href: "/rice" },
      { label: "County comparisons and maps", href: "/map" },
      { label: "Alerts and anomaly indicators", href: "/rice/loss" },
      { label: "Compliance tracking", href: "/cocoa/eudr" },
    ],
  },
  {
    title: "Program operations",
    items: [
      { label: "Subsidy / programme management", href: "/rice/programmes" },
      { label: "Resource allocation tracking", href: "/rice/resource-allocation" },
      { label: "Offline-first field operations", href: "/field" },
      { label: "Mobile-friendly field forms", href: "/field" },
    ],
  },
];

export default async function CapabilitiesPage() {
  const metrics = await getInstitutionalMetrics();

  return (
    <div className="space-y-4 max-w-6xl">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">System capabilities</div>
        <h1 className="mt-2 font-display text-[24px] text-gray-900">Operational capabilities for ministry delivery</h1>
        <p className="mt-2 text-[13px] text-gray-600 max-w-3xl">
          This layer demonstrates end-to-end operational readiness: registry, mapping, intelligence, programme
          operations, compliance, and field execution.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Kpi label="Farmers registered" value={fmt(metrics.farmers)} />
        <Kpi label="Farm profiles (plots)" value={fmt(metrics.plots)} />
        <Kpi label="Production records" value={fmt(metrics.productionRecords)} />
        <Kpi label="Audit-backed events" value={fmt(metrics.auditEvents)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {CAPABILITY_GROUPS.map((group) => (
          <div key={group.title} className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="font-display text-[18px] text-gray-900">{group.title}</h2>
            <div className="mt-3 space-y-2">
              {group.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block rounded-md border border-gray-100 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
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

function fmt(v: number | null) {
  if (v === null) return "—";
  return Intl.NumberFormat().format(v);
}

