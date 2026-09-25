import type { Metadata } from "next";

import EngagementModels from "@/components/site/home/EngagementModels";
import { CtaBand } from "@/components/site/page/CtaBand";
import { PageHero, SectionIntro } from "@/components/site/page/PageHero";
import { STAGES } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "How we work",
  description:
    "Six stages from diagnosis to handover, and five ways to engage — advisory, deployment, programme implementation, managed operations and capacity transfer.",
  alternates: { canonical: "/how-we-work" },
};

const stageId = (name: string) => name.toLowerCase().split(" ")[0];

const PRINCIPLES = [
  { title: "Diagnose before choosing a system", body: "We start from how the programme runs today — its structures, data, connectivity and constraints — not from a product." },
  { title: "Start in a defined area", body: "Deployment begins in an agreed geography, is supported in the field, and expands in phases once it works." },
  { title: "Configure to the institution", body: "Workflows, roles and reports follow the institution's own administrative levels and approval chains." },
  { title: "Agree the measures up front", body: "Results are assessed against criteria agreed at design, using evidence from the record itself." },
  { title: "Leave capability behind", body: "Skills, documentation and ownership are transferred so the institution can run the system itself." },
];

const PHASE_TONE: Record<string, string> = {
  Before: "text-[rgb(var(--av-gold-ink))]",
  Live: "text-[rgb(var(--av-emerald-ink))]",
  Review: "text-[rgb(var(--av-slate))]",
  After: "text-[rgb(var(--av-forest))]",
};

export default function HowWeWorkPage() {
  return (
    <>
      <PageHero
        eyebrow="How we work"
        title={
          <>
            An implementation partner, from diagnosis to <span className="avs-accent">handover</span>.
          </>
        }
        lead={
          <p>
            Every engagement follows the same six stages. Software arrives in the middle of the process, and the last
            stage exists to leave the institution able to run the system itself.
          </p>
        }
      />

      <section aria-labelledby="stages-title" className="avs-surface-paper avs-section">
        <div className="avs-container">
          <SectionIntro
            id="stages-title"
            eyebrow="Methodology"
            title="Six stages, one accountable team."
            body="Each stage ends with something the institution can hold: a report, a design, a live pilot, a service, an evaluation or a plan."
          />
          <ol className="mt-14">
            {STAGES.map((s) => (
              <li
                key={s.n}
                id={stageId(s.name)}
                className="avs-reveal grid scroll-mt-[calc(var(--av-header-h)+24px)] gap-6 border-t border-[rgb(var(--av-line)/0.14)] py-10 md:grid-cols-12 md:gap-8"
              >
                <div className="flex items-baseline gap-4 md:col-span-3 md:flex-col md:gap-2">
                  <span className="avs-serif text-[clamp(3rem,5vw,4.5rem)] leading-none text-[rgb(var(--av-gold-ink))]">
                    {s.n}
                  </span>
                  <span className={`avs-label ${PHASE_TONE[s.phase]}`}>{s.phase}</span>
                </div>
                <div className="md:col-span-5">
                  <h3 className="avs-h3">{s.name}</h3>
                  <p className="avs-body mt-3 text-[1.0625rem]">{s.body}</p>
                </div>
                <div className="md:col-span-4">
                  <p className="avs-label text-[rgb(var(--av-slate))]">Activities</p>
                  <ul className="mt-2 space-y-1.5 text-[1rem]">
                    {s.activities.map((a) => (
                      <li key={a} className="flex gap-2">
                        <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-[rgb(var(--av-emerald))]" />
                        {a}
                      </li>
                    ))}
                  </ul>
                  <p className="avs-label mt-5 text-[rgb(var(--av-slate))]">Output</p>
                  <p className="mt-1.5 font-medium">{s.output}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="principles-title" className="avs-surface-sand avs-section">
        <div className="avs-container">
          <SectionIntro id="principles-title" eyebrow="Principles" title="How engagements are run." />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-[var(--av-radius)] bg-[rgb(var(--av-line)/0.14)] sm:grid-cols-2 lg:grid-cols-5">
            {PRINCIPLES.map((p, i) => (
              <li key={p.title} className="avs-reveal bg-[rgb(var(--av-sand))] p-6">
                <p className="avs-meta text-[rgb(var(--av-emerald-ink))]">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-4 text-[1.125rem] font-medium leading-snug">{p.title}</h3>
                <p className="avs-body mt-3 text-[0.9375rem]">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <EngagementModels />

      <CtaBand secondary={{ label: "What we do", href: "/what-we-do" }} />
    </>
  );
}
