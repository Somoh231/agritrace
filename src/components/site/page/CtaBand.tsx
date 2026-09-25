import Link from "next/link";

import { ArrowRight } from "@/components/site/icons";
import { Topo } from "@/components/site/Topo";

/** Closing band for inner pages: one primary action, one secondary. */
export function CtaBand({
  title = "Start a conversation about your programme.",
  body = "Tell us about the institution, the programme and where it runs today. We will reply with a view on where to start.",
  secondary = { label: "See engagement models", href: "/how-we-work#engagement-models" },
}: {
  title?: string;
  body?: string;
  secondary?: { label: string; href: string };
}) {
  return (
    <section aria-labelledby="cta-title" className="avs-surface-paper pb-[var(--av-section)]">
      <div className="avs-container">
        <div className="avs-surface-forest avs-on-dark avs-reveal relative isolate overflow-hidden rounded-[var(--av-radius-lg)] px-6 py-14 sm:px-12 md:py-20">
          <Topo lines={12} seed={4} stroke="#E4E9C9" opacity={0.08} className="-z-10" />
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <h2 id="cta-title" className="avs-h2 max-w-[20ch]">
                {title}
              </h2>
              <p className="mt-5 max-w-[36rem] text-[1.0625rem] leading-relaxed text-white/80">{body}</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
              <Link href="/contact" className="avs-btn avs-btn-primary">
                Start a conversation <ArrowRight />
              </Link>
              <Link href={secondary.href} className="avs-btn avs-btn-ghost">
                {secondary.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
