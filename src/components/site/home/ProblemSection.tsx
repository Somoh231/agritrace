import { FRAGMENTS } from "@/lib/site/content";

/**
 * 2 · Institutional problem, as a ledger: where each record lives today and
 * what it becomes in one shared operational record. No cards; one reading
 * order that holds from 360px to desktop.
 */
export default function ProblemSection() {
  return (
    <section aria-labelledby="problem-title" data-home-section="problem" className="avs-surface-paper avs-section border-t border-[rgb(var(--av-line)/0.1)]">
      <div className="avs-container grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <p className="avs-label avs-eyebrow avs-reveal">The institutional problem</p>
          <h2 id="problem-title" className="avs-h-section avs-reveal mt-5 max-w-[14ch]">
            Six places the record breaks.
          </h2>
          <p className="avs-body avs-reveal mt-6 max-w-[30rem] text-[1.0625rem] leading-relaxed">
            Field forms, spreadsheets, GIS files, warehouse ledgers and reports are held separately, so a figure in a
            report cannot be traced back to the field. The work is to connect them in one operational record.
          </p>
        </div>

        <div className="lg:col-span-8">
          <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-6 border-b border-[rgb(var(--av-forest))] pb-3 md:grid">
            <span className="avs-label text-[rgb(var(--av-slate))]">Record</span>
            <span className="avs-label text-[rgb(var(--av-rust))]">Today</span>
            <span className="avs-label text-[rgb(var(--av-emerald-ink))]">In a shared record</span>
          </div>
          <ol className="avs-reveal">
            {FRAGMENTS.map((f, i) => (
              <li
                key={f.title}
                className="grid gap-x-6 gap-y-2 border-b border-[rgb(var(--av-line)/0.12)] py-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-baseline"
              >
                <p className="flex items-baseline gap-3">
                  <span className="avs-meta text-[rgb(var(--av-slate))]">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block text-[1.0625rem] font-medium leading-snug">{f.title}</span>
                    <span className="avs-meta block text-[rgb(var(--av-slate))]">{f.kind}</span>
                  </span>
                </p>
                <p className="flex items-baseline gap-2 pl-9 text-[0.9375rem] text-[rgb(var(--av-slate))] md:pl-0">
                  <span className="avs-label shrink-0 text-[0.625rem] text-[rgb(var(--av-rust))] md:hidden">Today</span>
                  {f.issue}
                </p>
                <p className="flex items-baseline gap-2 pl-9 text-[0.9375rem] font-medium md:pl-0">
                  <span className="avs-label shrink-0 text-[0.625rem] text-[rgb(var(--av-emerald-ink))] md:hidden">Shared</span>
                  {f.resolved}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
