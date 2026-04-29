const PROGRAMMES = [
  { name: "Rice Input Support 2026-A", county: "Nimba", beneficiaries: 1240, budgetUsd: 420000, disbursedPct: 64 },
  { name: "Mechanization Access Pool", county: "Bong", beneficiaries: 830, budgetUsd: 280000, disbursedPct: 51 },
  { name: "Post-harvest Recovery Pack", county: "Lofa", beneficiaries: 690, budgetUsd: 195000, disbursedPct: 47 },
];

export default function RiceProgrammesPage() {
  return (
    <div className="space-y-4 max-w-5xl">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Programme management</div>
        <h1 className="mt-2 font-display text-[24px] text-gray-900">Subsidy and programme operations</h1>
        <p className="mt-2 text-[13px] text-gray-600">
          Ministry-facing tracker for programme coverage, budget execution, and beneficiary oversight.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Kpi label="Programmes active" value="3" />
        <Kpi label="Beneficiaries" value="2,760" />
        <Kpi label="Allocated budget (USD)" value="895,000" />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="font-display text-[18px] text-gray-900">Active programme lines</h2>
        <div className="mt-3 space-y-2">
          {PROGRAMMES.map((p) => (
            <div key={p.name} className="rounded-lg border border-gray-100 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[13px] font-medium text-gray-900">{p.name}</div>
                <div className="font-mono text-[11px] text-gray-500">{p.county}</div>
              </div>
              <div className="mt-1 text-[12px] text-gray-600">
                {p.beneficiaries} beneficiaries · ${Intl.NumberFormat().format(p.budgetUsd)} budget · {p.disbursedPct}%
                disbursed
              </div>
            </div>
          ))}
        </div>
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

