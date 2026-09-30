import Link from "next/link";

import { ArrowRight } from "@/components/site/icons";
import { FieldCaptureScreen, ReviewQueueScreen, SampleLabel, TabletFrame } from "@/components/site/render/SystemRenders";

/**
 * 3 · Early product preview: one field record and the institutional view it
 * lands in, joined by its lineage. A navy panel inset in the paper page (not a
 * full-width band). Still by design; section 7 carries the motion.
 */
export default function ProductPreview() {
  return (
    <section aria-labelledby="preview-title" data-home-section="product-preview" className="avs-surface-paper pb-[var(--av-section)]">
      <div className="avs-container">
        <div className="avs-surface-navy avs-on-dark relative overflow-hidden rounded-[var(--av-radius-lg)] px-5 py-12 sm:px-10 md:py-16 lg:px-14">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="avs-label avs-eyebrow avs-reveal">What AgriVault builds</p>
              <h2 id="preview-title" className="avs-h-section avs-reveal mt-5 max-w-[18ch]">
                From one field record to an institutional view.
              </h2>
            </div>
            <p className="avs-reveal text-[1.0625rem] leading-relaxed text-white/80 lg:col-span-5">
              A plot is walked and a farmer registered on a device, even without coverage. The same record reaches the
              county review queue with its history attached, so a figure can be traced back to the field.
            </p>
          </div>

          <div
            className="mt-12 grid items-center gap-6 lg:grid-cols-[minmax(0,0.8fr)_auto_minmax(0,1.2fr)] lg:gap-4"
            role="img"
            aria-label="Illustrative system view with sample data: a farmer registration captured offline on a field device, and the county review queue where the same record appears for review."
          >
            <div className="mx-auto w-full max-w-[26rem] lg:max-w-none">
              <p className="avs-label mb-3 text-[0.6875rem] text-white/60">In the field</p>
              <TabletFrame>
                <FieldCaptureScreen />
              </TabletFrame>
            </div>
            <div aria-hidden="true" className="flex items-center justify-center gap-2 lg:flex-col">
              <span className="h-px w-10 border-t border-dashed border-[rgb(var(--av-gold))] lg:h-10 lg:w-px lg:border-l lg:border-t-0" />
              <span className="avs-meta whitespace-nowrap rounded-[2px] border border-white/15 px-2 py-1 text-[0.625rem] uppercase tracking-[0.08em] text-[rgb(var(--av-gold))]">
                Synced · lineage kept
              </span>
              <span className="h-px w-10 border-t border-dashed border-[rgb(var(--av-gold))] lg:h-10 lg:w-px lg:border-l lg:border-t-0" />
            </div>
            <div>
              <p className="avs-label mb-3 text-[0.6875rem] text-white/60">At the county</p>
              <TabletFrame>
                <ReviewQueueScreen />
              </TabletFrame>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <SampleLabel tone="dark" />
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <Link href="/products" className="avs-arrow-link">
                Explore products <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#field-to-decision" className="avs-arrow-link">
                See how a record travels <ArrowRight className="h-4 w-4 rotate-90" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
