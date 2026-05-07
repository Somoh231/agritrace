import Link from "next/link";

export default function MarketPricesPage() {
  return (
    <div className="space-y-6 text-slate-100 pb-8">
      <header className="rounded-2xl border border-white/10 bg-slate-950/55 px-6 py-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-200/75">Production intelligence</div>
        <h1 className="mt-2 font-display text-[clamp(1.35rem,2.4vw,1.85rem)] font-semibold text-white">Market prices</h1>
        <p className="mt-2 max-w-[720px] text-[13px] text-slate-300 leading-relaxed">
          Wholesale and farm-gate reference pricing across pilot counties supports procurement benchmarking and subsidy valuation adjustments.
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/60">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead className="font-mono text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Commodity</th>
              <th className="px-4 py-3">Reference window</th>
              <th className="px-4 py-3">Farm gate (USD / 50kg)</th>
              <th className="px-4 py-3">Trend</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {[
              { c: "NERICA rice · Grade A", w: "Season 2026-A · rolling 14d", p: "26.40", t: "Stable" },
              { c: "Parboiled rice · wholesale", w: "Monrovia hubs", p: "31.10", t: "↑ 1.8%" },
              { c: "Urea · bulk contract", w: "National tender basket", p: "418 / MT", t: "Monitoring" },
            ].map((row) => (
              <tr key={row.c} className="border-b border-slate-800/80">
                <td className="px-4 py-3 font-medium text-white">{row.c}</td>
                <td className="px-4 py-3 text-slate-400">{row.w}</td>
                <td className="px-4 py-3 tabular-nums">{row.p}</td>
                <td className="px-4 py-3">{row.t}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link href="/production/rice" className="inline-flex text-[13px] font-medium text-emerald-400 hover:text-emerald-300">
        Rice production intelligence →
      </Link>
    </div>
  );
}
