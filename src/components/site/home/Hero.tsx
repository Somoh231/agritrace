import Link from "next/link";

import { FieldPlate } from "@/components/site/home/FieldPlate";
import { ArrowRight } from "@/components/site/icons";
import { RecordPanel, SAMPLE_LABEL } from "@/components/site/render/SystemRenders";
import { MARKETS } from "@/lib/site/content";

/**
 * 1 · Hero. Map-style and product-led: a schematic field plate with the
 * record it produces, so the technology is visible in the first viewport.
 * No photograph. Sized to its content; the H1 is the LCP element and never
 * waits on a reveal.
 */
export default function Hero() {
  return (
    <section aria-labelledby="hero-title" data-home-section="hero" className="avs-surface-paper relative">
      <div className="avs-container grid gap-10 pb-16 pt-[calc(var(--av-header-h)+3rem)] md:pb-20 md:pt-[calc(var(--av-header-h)+4.5rem)] lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0 lg:pb-24">
        <div className="lg:col-span-6 lg:row-start-1 lg:self-end">
          <p className="avs-label text-[rgb(var(--av-gold-ink))]">Independent agricultural systems company</p>
          <h1 id="hero-title" className="avs-display mt-6 max-w-[16ch]">
            Building the systems behind stronger agricultural institutions.
          </h1>
          <p className="avs-lead mt-7 max-w-[38rem]">
            AgriVault Data designs, deploys and operates the data infrastructure behind agricultural programmes: field
            capture, verification, GIS, traceability and reporting, configured for each programme.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="avs-btn avs-btn-primary">
              Start a conversation <ArrowRight />
            </Link>
            <Link href="/how-we-work" className="avs-btn avs-btn-ghost">
              How we work
            </Link>
          </div>
        </div>

        <figure className="relative lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 lg:self-center lg:pb-10 lg:pl-6">
          <div className="relative aspect-[4/3] w-full max-w-full overflow-hidden rounded-[var(--av-radius)] border border-[rgb(var(--av-line)/0.12)] lg:aspect-[7/8]">
            <FieldPlate className="absolute inset-0 h-full w-full" />
          </div>
          <figcaption className="avs-label mt-3 text-[0.6875rem] text-[rgb(var(--av-gold-deep))] lg:absolute lg:bottom-0 lg:right-0 lg:mt-0 lg:text-right" data-sample-label>
            {SAMPLE_LABEL}
          </figcaption>
          <div className="mt-5 lg:absolute lg:-bottom-6 lg:-left-10 lg:mt-0 lg:w-[min(21rem,64%)]">
            <RecordPanel
              title="Sample plot 01 · Sample farmer 01"
              state="synced"
              facts={[
                { k: "Area", v: "District A" },
                { k: "Outline", v: "Walked · approximate" },
              ]}
              steps={[
                { step: "Captured in the field", actor: "Field officer · offline", status: "done", label: "Synced" },
                { step: "District verification", actor: "District reviewer", status: "done", label: "Verified" },
                { step: "County approval", actor: "County reviewer", status: "current", label: "In review" },
                { step: "National consolidation", actor: "Programme team", status: "pending", label: "Pending" },
              ]}
            />
          </div>
        </figure>

        <div className="border-t border-[rgb(var(--av-line)/0.14)] pt-5 lg:col-span-6 lg:row-start-2 lg:mt-12 lg:self-start">
          <h2 className="avs-label text-[rgb(var(--av-gold-ink))]">Built for</h2>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[0.9375rem] text-[rgb(var(--av-slate))]">
            {MARKETS.map((m) => (
              <li key={m.name}>{m.name}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
