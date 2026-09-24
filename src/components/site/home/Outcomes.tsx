import { OUTCOMES } from "@/lib/site/content";

/** Outcomes the work is designed to produce. Qualitative by policy: no figures before validation. */
export default function Outcomes() {
  return (
    <section aria-labelledby="outcomes-title" className="avs-surface-sand avs-section">
      <div className="avs-container grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--av-header-h)+40px)]">
            <p className="avs-label avs-eyebrow">Institutional outcomes</p>
            <h2 id="outcomes-title" className="avs-h1 mt-6 max-w-[11ch] text-[clamp(2.5rem,4.6vw,4.5rem)]">
              What changes when the system works.
            </h2>
            <p className="avs-body mt-8 max-w-[24rem]">
              What engagements are designed to produce. Results are measured against criteria agreed with each partner,
              and we don&rsquo;t publish figures before they are validated.
            </p>
          </div>
        </div>
        <ol className="lg:col-span-8">
          {OUTCOMES.map((o, i) => (
            <li key={o.title} className="avs-reveal grid grid-cols-[3rem_1fr] gap-x-4 border-t border-[rgb(var(--av-line)/0.16)] py-8 last:border-b sm:grid-cols-[4rem_1fr]">
              <p className="avs-meta pt-3 text-[rgb(var(--av-emerald-ink))]">{String(i + 1).padStart(2, "0")}</p>
              <div>
                <h3 className="avs-serif text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.08]" style={{ fontVariationSettings: '"opsz" 60' }}>
                  {o.title}
                </h3>
                <p className="avs-body mt-3 max-w-[36rem]">{o.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
