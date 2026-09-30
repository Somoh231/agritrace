import Link from "next/link";

import { ArrowRight } from "@/components/site/icons";
import { LiberiaMap, LiberiaMapCredit } from "@/components/site/LiberiaMap";
import { LIBERIA } from "@/lib/site/content";

/**
 * 8 · Liberia programme: AgriVault's own programme framing (never styled as a
 * government programme), the validation status every time the programme is
 * named, and only the three pilot counties on the map. No photograph, no
 * figures, no named offices.
 */
export default function LiberiaFeature() {
  return (
    <section aria-labelledby="liberia-title" data-home-section="liberia" className="avs-surface-paper avs-section border-t border-[rgb(var(--av-line)/0.1)]">
      <div className="avs-container grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-5">
          <p className="avs-label avs-eyebrow avs-reveal">Starting market</p>
          <h2 id="liberia-title" className="avs-h-section avs-reveal mt-5 max-w-[16ch]">
            {LIBERIA.framing}
          </h2>
          <p className="avs-reveal mt-6 inline-flex items-center gap-2 rounded-[var(--av-radius-xs)] border border-[rgb(var(--av-gold-ink))] px-2.5 py-1.5 avs-label text-[0.6875rem] text-[rgb(var(--av-gold-deep))]" data-programme-status>
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--av-gold))]" />
            {LIBERIA.badge}
          </p>
          <p className="avs-data avs-reveal mt-6 font-medium">{LIBERIA.focusShort}</p>
          <p className="avs-body avs-reveal mt-4 max-w-[32rem] text-[1.0625rem] leading-relaxed">{LIBERIA.focusLong}</p>
          <dl className="avs-reveal mt-7 grid gap-4 border-t border-[rgb(var(--av-line)/0.14)] pt-5 sm:grid-cols-[9rem_1fr]">
            <dt className="avs-label pt-0.5 text-[0.6875rem] text-[rgb(var(--av-gold-ink))]">Institutional context</dt>
            <dd className="text-[0.9375rem] leading-relaxed">{LIBERIA.institutionalContext}</dd>
            <dt className="avs-label pt-0.5 text-[0.6875rem] text-[rgb(var(--av-gold-ink))]">Phasing</dt>
            <dd className="text-[0.9375rem] leading-relaxed">Diagnose → pilot → phased expansion</dd>
          </dl>
          <Link href="/programmes/liberia" className="avs-arrow-link avs-reveal mt-7">
            Read about the programme <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="avs-caption avs-reveal mt-6 max-w-[32rem]">
            Liberia is AgriVault&rsquo;s starting market. {LIBERIA.disclosure}
          </p>
        </div>

        <figure className="avs-reveal lg:col-span-7">
          <div className="rounded-[var(--av-radius)] bg-[rgb(var(--av-linen))] p-5 sm:p-8">
            <LiberiaMap
              tone="field"
              titleId="home-lbr-map-title"
              title="Map of Liberia's fifteen counties with Nimba, Bong and Lofa, the initial validation counties, highlighted."
              className="mx-auto h-auto w-full max-w-[34rem]"
            />
          </div>
          <figcaption className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="avs-label text-[0.6875rem] text-[rgb(var(--av-gold-deep))]">Nimba · Bong · Lofa highlighted</span>
            <LiberiaMapCredit />
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
