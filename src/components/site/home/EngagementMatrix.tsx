import Link from "next/link";

import { ArrowRight } from "@/components/site/icons";
import { ENGAGEMENT_MODELS, STAGES } from "@/lib/site/content";

/**
 * 10 · Engagement models as a matrix: which of the six stages each model
 * covers. A real table on md+ (no "recommended" column: this is a map, not a
 * sales device); a stacked list with a six-square stage row on phones.
 */
export default function EngagementMatrix() {
  return (
    <section aria-labelledby="engagement-title" data-home-section="engagement" className="avs-surface-paper avs-section border-t border-[rgb(var(--av-line)/0.1)]">
      <div className="avs-container">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="avs-label avs-eyebrow avs-reveal">Engagement models</p>
            <h2 id="engagement-title" className="avs-h-section avs-reveal mt-5 max-w-[16ch]">
              Five ways to work with us.
            </h2>
          </div>
          <p className="avs-body avs-reveal text-[1.0625rem] leading-relaxed lg:col-span-5">
            Start where the institution is. Each model covers a different part of the six stages, and most engagements
            begin with a diagnostic.
          </p>
        </div>

        {/* md+: table */}
        <div className="avs-reveal mt-12 hidden md:block">
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">Engagement models and the stages each one covers</caption>
            <thead>
              <tr className="border-b border-[rgb(var(--av-forest))]">
                <th scope="col" className="avs-label w-[44%] pb-3 pr-6 text-[0.6875rem] font-normal text-[rgb(var(--av-slate))]">
                  Model
                </th>
                {STAGES.map((s) => (
                  <th key={s.n} scope="col" className="pb-3 text-center align-bottom">
                    <span className="avs-meta block text-[0.6875rem] text-[rgb(var(--av-slate))]">{s.n}</span>
                    <span className="mt-1 block text-[0.75rem] font-medium leading-tight">{s.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ENGAGEMENT_MODELS.map((m) => (
                <tr key={m.n} className="border-b border-[rgb(var(--av-line)/0.12)]">
                  <th scope="row" className="py-5 pr-6 align-top font-normal">
                    <span className="avs-label block text-[0.625rem] text-[rgb(var(--av-gold-ink))]">{m.kind}</span>
                    <span className="mt-1 block text-[1.0625rem] font-semibold leading-snug">{m.name}</span>
                    <span className="avs-body mt-1.5 block text-[0.9375rem] leading-relaxed">{m.summary}</span>
                  </th>
                  {STAGES.map((s) => {
                    const on = m.stages.includes(s.n);
                    return (
                      <td key={s.n} className="py-5 text-center align-middle">
                        <span
                          aria-hidden="true"
                          className={`mx-auto block h-4 w-4 rounded-[2px] border ${
                            on ? "border-[rgb(var(--av-forest))] bg-[rgb(var(--av-forest))]" : "border-[rgb(var(--av-line)/0.25)]"
                          }`}
                        />
                        <span className="sr-only">{on ? "Included" : "Not included"}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* phones: stacked list */}
        <ul className="mt-10 border-t border-[rgb(var(--av-forest))] md:hidden">
          {ENGAGEMENT_MODELS.map((m) => (
            <li key={m.n} className="border-b border-[rgb(var(--av-line)/0.12)] py-5">
              <p className="avs-label text-[0.625rem] text-[rgb(var(--av-gold-ink))]">{m.kind}</p>
              <h3 className="mt-1 text-[1.0625rem] font-semibold">{m.name}</h3>
              <p className="avs-body mt-1.5 text-[0.9375rem] leading-relaxed">{m.summary}</p>
              <div className="mt-3 flex items-center gap-1.5">
                {STAGES.map((s) => {
                  const on = m.stages.includes(s.n);
                  return (
                    <span
                      key={s.n}
                      title={s.label}
                      aria-hidden="true"
                      className={`h-3.5 w-3.5 rounded-[2px] border ${on ? "border-[rgb(var(--av-forest))] bg-[rgb(var(--av-forest))]" : "border-[rgb(var(--av-line)/0.25)]"}`}
                    />
                  );
                })}
                <span className="avs-meta ml-2 text-[0.6875rem] text-[rgb(var(--av-slate))]">
                  Stages {m.stages.map((n) => Number(n)).join(", ")}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <Link href="/how-we-work#engagement-models" className="avs-arrow-link avs-reveal mt-8">
          Compare engagement models <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
