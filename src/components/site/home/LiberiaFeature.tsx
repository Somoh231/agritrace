import Link from "next/link";

import { ArrowRight } from "@/components/site/icons";
import { ImageFrame } from "@/components/site/ImageFrame";
import { LiberiaMap, LiberiaMapCredit } from "@/components/site/LiberiaMap";
import { LIBERIA } from "@/lib/site/content";

/** Starting market. Status language is fixed: a pilot being validated — no results are claimed. */
export default function LiberiaFeature() {
  return (
    <section aria-labelledby="liberia-title" className="avs-surface-paper avs-section pt-0">
      <div className="avs-container">
        <div className="avs-reveal flex flex-wrap items-center gap-x-5 gap-y-2">
          <p className="avs-label text-[rgb(var(--av-forest))]">Starting market · Liberia</p>
          <span aria-hidden="true" className="hidden h-px min-w-8 flex-1 bg-[rgb(var(--av-line)/0.25)] sm:block" />
          <p className="avs-label text-[rgb(var(--av-gold-ink))]">Pilot · being validated</p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          <ImageFrame
            scene="field-boundary"
            alt=""
            ratio="auto"
            overlay={false}
            className="avs-reveal min-h-[520px] rounded-[var(--av-radius-lg)] lg:col-span-7 lg:row-span-2 lg:min-h-[760px]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(11,46,26,0) 25%, rgba(11,46,26,0.7) 62%, rgba(8,24,15,0.96) 100%)" }}
            />
            <div className="absolute inset-x-0 bottom-0 p-6 text-[rgb(var(--av-paper))] sm:p-10">
              <h2 id="liberia-title" className="avs-h1 max-w-[14ch] text-[clamp(2.25rem,4.6vw,4.5rem)]">
                {LIBERIA.name}
              </h2>
              <p className="avs-serif mt-5 max-w-[34rem] text-[clamp(1.1875rem,1.7vw,1.5rem)] leading-[1.45] text-white/90">
                Where the work begins: one country, three pilot counties, an implementation programme designed for
                phased expansion and built to travel.
              </p>
            </div>
          </ImageFrame>

          <div className="avs-surface-navy avs-reveal rounded-[var(--av-radius-lg)] p-6 sm:p-8 lg:col-span-5">
            <h3 className="avs-label text-[rgb(var(--av-gold))]">Programme posture</h3>
            <dl className="mt-4">
              {LIBERIA.posture.map((row) => (
                <div key={row.k} className="grid grid-cols-[7.5rem_1fr] gap-4 border-t border-white/10 py-3.5 sm:grid-cols-[9rem_1fr]">
                  <dt className="avs-meta pt-0.5 uppercase tracking-[0.08em] text-[rgb(var(--av-mist))]">{row.k}</dt>
                  <dd className="text-[1rem] leading-snug">{row.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <figure className="avs-reveal relative overflow-hidden rounded-[var(--av-radius-lg)] bg-[rgb(var(--av-sand))] p-6 lg:col-span-5">
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

        <ol className="avs-reveal mt-4 grid gap-px overflow-hidden rounded-[var(--av-radius)] border border-[rgb(var(--av-line)/0.16)] bg-[rgb(var(--av-line)/0.14)] sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {LIBERIA.components.map((c, i) => (
            <li key={c.title} className="bg-[rgb(var(--av-paper))] p-5">
              <p className="avs-meta text-[rgb(var(--av-emerald-ink))]">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 text-[1.0625rem] font-medium leading-tight">{c.title}</h3>
              <p className="avs-body mt-2 text-[0.9375rem] leading-snug">{c.body}</p>
            </li>
          ))}
        </ol>

        <Link href="/programmes/liberia" className="avs-arrow-link mt-8">
          Read the programme <ArrowRight />
        </Link>
      </div>
    </section>
  );
}
