import type { ReactNode } from "react";

import { Topo } from "@/components/site/Topo";

const TONES = {
  navy: "linear-gradient(160deg, #0C1F3D 0%, #07152D 60%, #061126 100%)",
  forest: "radial-gradient(80% 70% at 85% 10%, rgba(94,140,116,0.45) 0%, rgba(94,140,116,0) 60%), linear-gradient(160deg, #103A23 0%, #0B2E1A 55%, #08210F 100%)",
  field:
    "radial-gradient(90% 70% at 82% 8%, rgba(143,156,98,0.85) 0%, rgba(143,156,98,0) 60%), linear-gradient(115deg, #0C1D16 0%, #1B3222 38%, #3B4E2E 72%, #5F6E43 100%)",
} as const;

/**
 * Inner-page hero. Dark surface so the transparent header reads the same as
 * on the homepage. `aside` sits right on lg+ (a map, a fact panel, a CTA).
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  aside,
  tone = "navy",
  children,
  id = "page-title",
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
  tone?: keyof typeof TONES;
  children?: ReactNode;
  id?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className="avs-surface-navy avs-on-dark avs-grain relative isolate overflow-hidden"
      style={{ background: TONES[tone] }}
    >
      <Topo lines={18} seed={eyebrow.length} stroke={tone === "navy" ? "#9AA7B8" : "#E4E9C9"} opacity={0.09} className="-z-10" />
      <div className="avs-container grid gap-12 pb-16 pt-[calc(var(--av-header-h)+4.5rem)] md:pb-24 md:pt-[calc(var(--av-header-h)+6rem)] lg:grid-cols-12 lg:items-end">
        <div className={aside ? "lg:col-span-7" : "lg:col-span-10"}>
          <p className="avs-label text-[rgb(var(--av-gold))]">{eyebrow}</p>
          <h1 id={id} className="avs-h1 mt-6 max-w-[18ch]">
            {title}
          </h1>
          {lead ? <div className="avs-lead mt-8 max-w-[40rem] text-white/80">{lead}</div> : null}
          {children ? <div className="mt-10 flex flex-wrap gap-3">{children}</div> : null}
        </div>
        {aside ? <div className="lg:col-span-5">{aside}</div> : null}
      </div>
    </section>
  );
}

/** Section heading row: eyebrow + title left, supporting copy right. */
export function SectionIntro({
  eyebrow,
  title,
  body,
  id,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  id: string;
  as?: "h2" | "h3";
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-7">
        {eyebrow ? <p className="avs-label avs-eyebrow avs-reveal">{eyebrow}</p> : null}
        <Tag id={id} className={`avs-h2 avs-reveal max-w-[20ch] ${eyebrow ? "mt-5" : ""}`}>
          {title}
        </Tag>
      </div>
      {body ? <div className="avs-body avs-reveal lg:col-span-5 lg:pb-1">{body}</div> : null}
    </div>
  );
}
