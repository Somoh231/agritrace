import Link from "next/link";

import { ArrowRight } from "@/components/site/icons";
import { STAGES } from "@/lib/site/content";

/**
 * 6 · How AgriVault works: the six stages as a vertical timeline (numbered
 * nodes on one rail). The order is real, so the numbering carries meaning.
 * Each stage names what it produces.
 */
export default function StageProgression() {
  return (
    <section aria-labelledby="stages-title" data-home-section="how-it-works" className="avs-surface-paper avs-section border-t border-[rgb(var(--av-line)/0.1)]">
      <div className="avs-container grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--av-header-h)+2rem)]">
            <p className="avs-label avs-eyebrow avs-reveal">How AgriVault works</p>
            <h2 id="stages-title" className="avs-h-section avs-reveal mt-5 max-w-[13ch]">
              From diagnosis to capability transfer.
            </h2>
            <p className="avs-body avs-reveal mt-6 max-w-[28rem] text-[1.0625rem] leading-relaxed">
              One accountable team across six stages. Software arrives in the middle of the work, not before it, and
              every engagement plans for the institution to run the system itself.
            </p>
            <Link href="/how-we-work" className="avs-arrow-link avs-reveal mt-7">
              How we work <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <ol className="relative lg:col-span-8">
          <span aria-hidden="true" className="absolute bottom-6 left-[1.1875rem] top-6 w-px bg-[rgb(var(--av-forest)/0.35)]" />
          {STAGES.map((s) => (
            <li key={s.n} className="avs-reveal relative grid grid-cols-[2.5rem_1fr] gap-x-5 pb-10 last:pb-0 sm:gap-x-7">
              <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[rgb(var(--av-forest))] bg-[rgb(var(--av-paper))] avs-meta text-[0.8125rem] text-[rgb(var(--av-forest))]">
                {s.n}
              </span>
              <div className="grid gap-4 pt-1.5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:gap-8">
                <div>
                  <p className="avs-label text-[0.6875rem] text-[rgb(var(--av-slate))]">{s.phase}</p>
                  <h3 className="avs-h3 mt-1.5">{s.label}</h3>
                  <p className="avs-body mt-2 leading-relaxed">{s.body}</p>
                </div>
                <div className="border-t border-[rgb(var(--av-line)/0.12)] pt-3 md:border-l md:border-t-0 md:pl-6 md:pt-1.5">
                  <p className="avs-label text-[0.6875rem] text-[rgb(var(--av-gold-ink))]">Output</p>
                  <p className="mt-1.5 text-[0.9375rem] font-medium leading-snug">{s.output}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
