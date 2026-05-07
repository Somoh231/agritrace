import Link from "next/link";

export default function EquipmentInventoryPage() {
  return (
    <div className="space-y-6 text-slate-100 pb-8">
      <header className="rounded-2xl border border-white/10 bg-slate-950/55 px-6 py-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-200/75">Inputs & inventory</div>
        <h1 className="mt-2 font-display text-[clamp(1.35rem,2.4vw,1.85rem)] font-semibold text-white">Equipment ledger</h1>
        <p className="mt-2 max-w-[720px] text-[13px] text-slate-300 leading-relaxed">
          Mechanization assets (tools, power tillers, pumps) are tracked alongside inputs programmes with custody chains mirroring warehouse IDs
          (for example INV-0001 allocations staged against WH-NIM-001).
        </p>
      </header>

      <div className="rounded-xl border border-dashed border-slate-600 bg-slate-950/40 px-5 py-8 text-center text-[13px] text-slate-400">
        Equipment SKU catalog ties into national inventory once ministry catalogue rows are synchronized from procurement.
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/inventory" className="text-emerald-400 hover:text-emerald-300 text-[13px] font-medium">
            National inventory →
          </Link>
          <Link href="/inventory/transfers" className="text-emerald-400 hover:text-emerald-300 text-[13px] font-medium">
            Stock movement →
          </Link>
        </div>
      </div>
    </div>
  );
}
