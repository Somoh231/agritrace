import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRight } from "@/components/site/icons";
import { LiberiaMap } from "@/components/site/LiberiaMap";
import { CtaBand } from "@/components/site/page/CtaBand";
import { PageHero, SectionIntro } from "@/components/site/page/PageHero";
import { LIBERIA, MARKETS } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "Programmes",
  description:
    "Programme-led delivery: design, deployment, field operations, measurement and handover delivered as one programme, with the system arriving inside the work.",
  alternates: { canonical: "/programmes" },
};

const COMPONENTS = [
  { title: "Programme design", body: "Diagnosis, scope, roles and approval chains agreed with the institution before anything is built." },
  { title: "System configuration", body: "Our products configured to the programme's workflows, geography and reporting requirements." },
  { title: "Field operations", body: "Officer training, devices, supervision and support through go-live and beyond." },
  { title: "Measurement", body: "Evidence from the operational record, assessed against criteria agreed at design." },
  { title: "Handover", body: "Documentation, skills and ownership transferred on an agreed timeline." },
];

const PHASES = [
  { k: "Diagnose", v: "Understand the programme as it runs today and agree where to start." },
  { k: "Pilot", v: "Go live in a defined area, supported in the field, measured against agreed criteria." },
  { k: "Expand", v: "Extend in phases once the pilot has been validated, geography by geography." },
];

export default function ProgrammesPage() {
  return (
    <>
      <PageHero
        eyebrow="Programmes"
        tone="field"
        title={
          <>
            The system arrives inside the <span className="avs-accent">work</span>, not before it.
          </>
        }
        lead={
          <p>
            We deliver agricultural programmes end to end — design, deployment, field operations, measurement and
            handover — so technology is adopted as part of how the programme runs, not bolted on afterwards.
          </p>
        }
      />

      <section aria-labelledby="components-title" className="avs-surface-paper avs-section">
        <div className="avs-container">
          <SectionIntro
            id="components-title"
            eyebrow="Programme-led delivery"
            title="What a programme includes."
            body="Components are scoped to each programme. Some partners need all five; others engage us for one."
          />
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {COMPONENTS.map((c, i) => (
              <li key={c.title} className="avs-card avs-reveal flex flex-col p-6">
                <p className="avs-meta text-[rgb(var(--av-emerald-ink))]">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-6 text-[1.1875rem] font-medium leading-snug">{c.title}</h3>
                <p className="avs-body mt-3 text-[0.9375rem]">{c.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-20 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="avs-h3 avs-reveal">Phased by design</h2>
              <p className="avs-body avs-reveal mt-4">
                Programmes expand only after a pilot has been validated in its own geography. No figures are published
                before that validation.
              </p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3 lg:col-span-8">
              {PHASES.map((p, i) => (
                <li key={p.k} className="avs-reveal border-t-2 border-[rgb(var(--av-emerald))] pt-5">
                  <p className="avs-meta text-[rgb(var(--av-slate))]">Phase {i + 1}</p>
                  <h3 className="mt-2 text-[1.375rem] font-medium">{p.k}</h3>
                  <p className="avs-body mt-2 text-[0.9375rem]">{p.v}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section aria-labelledby="current-title" className="avs-surface-sand avs-section">
        <div className="avs-container">
          <SectionIntro id="current-title" eyebrow="Current programme" title="Where the work begins." />
          <div className="avs-surface-navy avs-reveal relative mt-12 grid overflow-hidden rounded-[var(--av-radius-lg)] md:grid-cols-12">
            <div className="flex flex-col justify-between gap-10 p-7 sm:p-10 md:col-span-7">
              <div>
                <p className="avs-label text-[rgb(var(--av-gold))]">Starting market · Liberia</p>
                <h3 className="avs-h2 mt-5 max-w-[16ch]">{LIBERIA.name}</h3>
                <p className="mt-5 max-w-[34rem] text-[1.0625rem] leading-relaxed text-white/80">
                  A pilot implementation programme in Nimba, Bong and Lofa counties, designed for phased expansion.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <span className="avs-chip border-white/25 text-[rgb(var(--av-gold))]">{LIBERIA.status}</span>
                <Link href="/programmes/liberia" className="avs-arrow-link after:absolute after:inset-0 after:content-['']">
                  Read the programme <ArrowRight />
                </Link>
              </div>
            </div>
            <div className="bg-[rgb(var(--av-navy-2))] p-8 md:col-span-5">
              <LiberiaMap tone="dark" titleId="prog-lbr-map" className="mx-auto h-auto w-full max-w-[22rem]" />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="partners-title" className="avs-surface-paper avs-section">
        <div className="avs-container">
          <SectionIntro id="partners-title" eyebrow="Who we deliver with" title="Built for the institutions that run agriculture." />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-[var(--av-radius)] border border-[rgb(var(--av-line)/0.14)] bg-[rgb(var(--av-line)/0.14)] sm:grid-cols-2 lg:grid-cols-3">
            {MARKETS.map((m) => (
              <li key={m.name} className="avs-reveal bg-[rgb(var(--av-paper))] p-6">
                <h3 className="text-[1.125rem] font-medium">{m.name}</h3>
                <p className="avs-body mt-2 text-[0.9375rem]">{m.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand title="Planning a programme?" body="Tell us what the programme needs to achieve and where it runs today." />
    </>
  );
}
