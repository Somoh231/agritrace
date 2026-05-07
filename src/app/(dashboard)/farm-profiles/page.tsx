import Link from "next/link";

export default function FarmProfilesPage() {
  return (
    <div className="space-y-6 text-slate-100 pb-8">
      <header className="rounded-2xl border border-white/10 bg-slate-950/55 px-6 py-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-200/75">Farmer system</div>
        <h1 className="mt-2 font-display text-[clamp(1.35rem,2.4vw,1.85rem)] font-semibold text-white">Farm profiles</h1>
        <p className="mt-2 max-w-[760px] text-[13px] leading-relaxed text-slate-300">
          Farm-scale dossiers extend national registry rows with plot topology, production envelopes, subsidy utilization, and inspection chronologies.
          Registry identifiers follow ministry conventions (for example NIM-0001, BON-0007).
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/farmers"
          className="rounded-xl border border-emerald-500/25 bg-emerald-950/25 px-4 py-4 hover:bg-emerald-950/40 transition"
        >
          <div className="font-display text-[15px] font-semibold text-white">National farmer registry</div>
          <p className="mt-2 text-[12px] text-emerald-100/75 leading-relaxed">
            Searchable master grid with verification state, cooperative linkage, DAO assignment, and warehouse routing.
          </p>
        </Link>
        <Link href="/geo-registry" className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-4 hover:border-emerald-500/30 transition">
          <div className="font-display text-[15px] font-semibold text-white">Geo registry</div>
          <p className="mt-2 text-[12px] text-slate-400 leading-relaxed">Parcel captures, GPS QA, and raster overlays.</p>
        </Link>
        <Link href="/cooperatives" className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-4 hover:border-emerald-500/30 transition">
          <div className="font-display text-[15px] font-semibold text-white">Cooperatives</div>
          <p className="mt-2 text-[12px] text-slate-400 leading-relaxed">Membership spine backing farm clusters.</p>
        </Link>
      </div>
    </div>
  );
}
