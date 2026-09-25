import Link from "next/link";

import { ArrowRight } from "@/components/site/icons";
import { LiberiaMap, LiberiaMapCredit } from "@/components/site/LiberiaMap";
import { LIBERIA } from "@/lib/site/content";

/**
 * Starting market, shown as real programme context: the map is the visual.
 * Status language is fixed: a pilot being validated — no results are claimed.
 */
export default function LiberiaFeature() {
  return (
    <section aria-labelledby="liberia-title" className="avs-surface-paper avs-section pt-0">
      <div className="avs-container">
        <div className="avs-reveal flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[rgb(var(--av-line)/0.2)] pt-6">
          <p className="avs-label text-[rgb(var(--av-forest))]">Starting market · Liberia</p>
          <span aria-hidden="true" className="hidden h-px min-w-8 flex-1 bg-[rgb(var(--av-line)/0.2)] sm:block" />
          <p className="avs-label text-[rgb(var(--av-gold-ink))]">Pilot · being validated</p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <h2 id="liberia-title" className="avs-h-section avs-reveal max-w-[16ch]">
              {LIBERIA.name}
            </h2>
            <p className="avs-serif avs-reveal mt-6 max-w-[34rem] text-[clamp(1.1875rem,1.6vw,1.4375rem)] leading-[1.45] text-[rgb(var(--av-forest))]">
              Where the work begins: one country, three pilot counties, and an implementation programme designed to
              expand in phases and travel to other markets.
            </p>
            <dl className="avs-reveal mt-8 max-w-[36rem]">
              {LIBERIA.posture.map((row) => (
                <div key={row.k} className="grid grid-cols-[7.5rem_1fr] gap-4 border-t border-[rgb(var(--av-line)/0.14)] py-3 sm:grid-cols-[9rem_1fr]">
                  <dt className="avs-meta pt-0.5 uppercase tracking-[0.08em] text-[rgb(var(--av-slate))]">{row.k}</dt>
                  <dd className="text-[1rem] leading-snug">{row.v}</dd>
                </div>
              ))}
            </dl>
            <Link href="/programmes/liberia" className="avs-arrow-link mt-8">
              Read the programme <ArrowRight />
            </Link>
          </div>

          <figure className="avs-reveal relative self-start overflow-hidden rounded-[var(--av-radius-lg)] bg-[rgb(var(--av-sand))] p-6 sm:p-8 lg:col-span-5">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(11,46,26,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(11,46,26,0.05) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            <LiberiaMap titleId="home-lbr-map" className="relative mx-auto h-auto w-full max-w-[26rem]" />
            <figcaption className="avs-meta relative mt-3 flex items-center gap-2 uppercase tracking-[0.1em] text-[rgb(var(--av-slate))]">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[2px] border border-[rgb(var(--av-emerald-ink))] bg-[rgb(var(--av-emerald)/0.2)]" />
              Pilot counties · Nimba, Bong, Lofa
            </figcaption>
            <LiberiaMapCredit className="relative mt-2" />
          </figure>
        </div>
      </div>
    </section>
  );
}
