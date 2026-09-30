import Link from "next/link";

import { ArrowRight } from "@/components/site/icons";
import { Topo } from "@/components/site/Topo";

/** 11 · Closing institutional CTA. Forest, running straight into the forest footer. */
export default function ClosingCTA() {
  return (
    <section aria-labelledby="closing-title" data-home-section="closing-cta" className="avs-surface-forest avs-on-dark relative isolate overflow-hidden">
      <Topo lines={12} seed={9} stroke="#E4E9C9" opacity={0.07} className="-z-10" />
      <div className="avs-container grid gap-10 py-[var(--av-section)] lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="avs-label avs-eyebrow">Start a conversation</p>
          <h2 id="closing-title" className="avs-h-section mt-5 max-w-[18ch]">
            Tell us how your programme runs today.
          </h2>
          <p className="mt-6 max-w-[36rem] text-[1.0625rem] leading-relaxed text-white/80">
            Most engagements begin with a short diagnostic of how the programme runs today: its structures, records,
            connectivity and constraints. We will reply with a view on where to start.
          </p>
        </div>
        <div className="flex flex-col gap-5 lg:col-span-5 lg:items-end">
          <Link href="/contact" className="avs-btn avs-btn-primary w-full sm:w-auto">
            Start a conversation <ArrowRight />
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Link href="/products" className="avs-arrow-link">
              Explore products <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/how-we-work" className="avs-arrow-link">
              How we work <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
