import { OUTCOMES } from "@/lib/site/content";

/** Outcomes the work is designed to produce. Qualitative by policy: no figures before validation. */
export default function Outcomes() {
  return (
    <section aria-labelledby="outcomes-title" className="avs-surface-sand avs-section">
      <div className="avs-container">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="avs-label avs-eyebrow">Institutional outcomes</p>
            <h2 id="outcomes-title" className="avs-h-section mt-5 max-w-[16ch]">
              What changes when the system works.
            </h2>
          </div>
          <p className="avs-body max-w-[26rem] lg:col-span-5 lg:justify-self-end">
            Results are measured against criteria agreed with each partner. We don&rsquo;t publish figures before they
            are validated.
          </p>
        </div>
        <ol className="mt-12 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {OUTCOMES.map((o, i) => (
            <li key={o.title} className="avs-reveal border-t border-[rgb(var(--av-line)/0.18)] py-7">
              <p className="avs-meta text-[rgb(var(--av-emerald-ink))]">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="avs-serif mt-3 text-[clamp(1.375rem,1.8vw,1.625rem)] leading-[1.15]">{o.title}</h3>
              <p className="avs-body mt-2.5 max-w-[26rem]">{o.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
