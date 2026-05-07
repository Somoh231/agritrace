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

export default function LogisticsHubPage() {
  const sections: Array<{ label: string; items: LinkCard[] }> = [
    {
      label: "Warehouse command",
      items: [
        {
          title: "Warehouses",
          body: "Warehouse posture, thresholds, and operational status.",
          href: "/operations/warehouses",
          meta: "Command · custody posture",
        },
        {
          title: "Inventory (national)",
          body: "National inventory workspace and reconciliation surfaces.",
          href: "/inventory",
          meta: "Inventory",
        },
        {
          title: "Transfers",
          body: "Chain-of-custody workflow for dispatch, receipt, verification, and audit.",
          href: "/transfers",
          meta: "Trace · workflow",
        },
      ],
    },
    {
      label: "Stock movement and trace",
      items: [
        {
          title: "Stock movement",
          body: "Movement ledger and operational transfer listings.",
          href: "/inventory/transfers",
          meta: "Movement",
        },
        {
          title: "Donor shipments",
          body: "Read-only donor shipments ledger and reconciliation notes.",
          href: "/inventory/donor-shipments",
          meta: "Donor",
        },
      ],
    },
    {
      label: "Inputs and distribution",
      items: [
        {
          title: "Fertilizer",
          body: "Fertilizer inventory and distribution posture.",
          href: "/inventory/fertilizer",
          meta: "Inputs",
        },
        {
          title: "Seed distribution",
          body: "Seed distribution operations and tracking.",
          href: "/inventory/seed-distribution",
          meta: "Inputs",
        },
        {
          title: "Equipment",
          body: "Equipment inventory and operational tracking.",
          href: "/inventory/equipment",
          meta: "Assets",
        },
      ],
    },
  ];

  return (
    <MinistryPageShell
      title="Warehouse command"
      description="Warehouses and logistics are managed as one operational workspace. Transfers, inventory, stock movement, and donor shipments remain accessible here without sidebar sprawl."
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

