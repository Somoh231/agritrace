import { ILLUSTRATIVE_DATA_ENABLED } from "@/lib/data/illustrative-policy";

const SAMPLE_PROGRAMMES = [
  { name: "Rice Input Support 2026-A", county: "Nimba", beneficiaries: 1240, budgetUsd: 420000, disbursedPct: 64 },
  { name: "Mechanization Access Pool", county: "Bong", beneficiaries: 830, budgetUsd: 280000, disbursedPct: 51 },
  { name: "Post-harvest Recovery Pack", county: "Lofa", beneficiaries: 690, budgetUsd: 195000, disbursedPct: 47 },
];

// There is no programme registry table yet; the sample lines are training-only.
const PROGRAMMES = ILLUSTRATIVE_DATA_ENABLED ? SAMPLE_PROGRAMMES : [];

export default function RiceProgrammesPage() {
  const beneficiaries = PROGRAMMES.reduce((sum, p) => sum + p.beneficiaries, 0);
  const budget = PROGRAMMES.reduce((sum, p) => sum + p.budgetUsd, 0);
  return (
    <div className="space-y-4 max-w-5xl">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-gray-600">Programme management</div>
        <h1 className="mt-2 font-display text-[24px] text-gray-900">Subsidy and programme operations</h1>
        <p className="mt-2 text-[13px] text-gray-600">
          Ministry-facing tracker for programme coverage, budget execution, and beneficiary oversight.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Kpi label="Programmes active" value={PROGRAMMES.length ? String(PROGRAMMES.length) : "—"} />
        <Kpi label="Beneficiaries" value={PROGRAMMES.length ? Intl.NumberFormat().format(beneficiaries) : "—"} />
        <Kpi label="Allocated budget (USD)" value={PROGRAMMES.length ? Intl.NumberFormat().format(budget) : "—"} />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="font-display text-[18px] text-gray-900">Active programme lines</h2>
        {PROGRAMMES.length === 0 ? (
          <p className="mt-3 text-[13px] text-gray-600">
            No programme lines are recorded yet. Programme budgets and beneficiaries appear here once a programme registry is configured.
          </p>
        ) : null}
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
      <div className="font-mono text-[10px] uppercase tracking-widest text-gray-600">{label}</div>
      <div className="mt-2 font-display text-[24px] text-gray-900">{value}</div>
    </div>
  );
}

