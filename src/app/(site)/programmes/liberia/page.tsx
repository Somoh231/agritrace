import type { Metadata } from "next";

import { ImageFrame } from "@/components/site/ImageFrame";
import { LiberiaMap, LiberiaMapCredit } from "@/components/site/LiberiaMap";
import { CtaBand } from "@/components/site/page/CtaBand";
import { PageHero, SectionIntro } from "@/components/site/page/PageHero";
import { LIBERIA, PRODUCTS } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "Liberia Agricultural Intelligence Programme",
  description:
    "AgriVault's starting market: a pilot implementation programme in Nimba, Bong and Lofa counties, designed for phased expansion. Pilot, 2026 — being validated.",
  alternates: { canonical: "/programmes/liberia" },
};

const CHAIN = PRODUCTS[0].workflow; // Captured in the field → District verification → County approval → National consolidation

// Programme design, not a progress report: only the current phase is marked, per the published status.
const PHASES = [
  { k: "Diagnose", v: "Review of programme structures, data, connectivity and constraints with county and district offices.", current: false },
  { k: "Pilot", v: "The field-to-national workflow in the three pilot counties, supported in the field and measured against agreed criteria.", current: true },
  { k: "Phased expansion", v: "Further counties only after the pilot has been validated against those criteria.", current: false },
];

export default function LiberiaProgrammePage() {
  return (
    <>
      <PageHero
        eyebrow="Starting market · Liberia"
        tone="field"
        title={LIBERIA.name}
        lead={
          <p className="avs-serif text-[clamp(1.25rem,1.8vw,1.625rem)] leading-[1.45] text-white/90">
            Where the work begins: one country, three pilot counties, an implementation programme designed for phased
            expansion and built to travel.
          </p>
        }
        aside={
          <figure className="rounded-[var(--av-radius-lg)] border border-white/10 bg-[rgb(7_21_45/0.55)] p-6 backdrop-blur-sm">
            <LiberiaMap tone="dark" labels="highlight" titleId="lbr-hero-map" className="mx-auto h-auto w-full max-w-[20rem]" />
            <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <span className="avs-meta uppercase tracking-[0.1em] text-white/75">Pilot counties · Nimba, Bong, Lofa</span>
              <span className="avs-chip border-white/25 text-[rgb(var(--av-gold))]">{LIBERIA.status}</span>
            </figcaption>
            <LiberiaMapCredit tone="dark" className="mt-3" />
          </figure>
        }
      />

      <section aria-labelledby="status-title" className="avs-surface-paper pt-16 md:pt-20">
        <div className="avs-container">
          <div className="avs-reveal grid gap-4 rounded-[var(--av-radius)] border border-[rgb(var(--av-gold-ink)/0.35)] bg-[rgb(var(--av-gold)/0.08)] p-6 md:grid-cols-12 md:items-center md:p-8">
            <h2 id="status-title" className="avs-label text-[rgb(var(--av-gold-deep))] md:col-span-3">
              Programme status
            </h2>
            <p className="text-[1.0625rem] leading-relaxed md:col-span-9">
              This is a pilot that is being validated. We describe its scope and design here; we do not publish farmer,
              warehouse, production or impact figures until they have been validated against criteria agreed with our
              programme partners.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="posture-title" className="avs-surface-paper avs-section">
        <div className="avs-container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="avs-label avs-eyebrow avs-reveal">Programme posture</p>
            <h2 id="posture-title" className="avs-h2 avs-reveal mt-5">
              How the programme is set up.
            </h2>
          </div>
          <dl className="avs-reveal lg:col-span-7">
            {LIBERIA.posture.map((row) => (
              <div key={row.k} className="grid gap-2 border-t border-[rgb(var(--av-line)/0.14)] py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt className="avs-label pt-1 text-[rgb(var(--av-slate))]">{row.k}</dt>
                <dd className="text-[1.125rem]">{row.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="chain-title" className="avs-surface-navy avs-on-dark avs-section">
        <div className="avs-container">
          <SectionIntro
            id="chain-title"
            eyebrow="Field to national"
            title="One record, approved level by level."
            body="Records are captured by field officers, verified by district reviewers and approved by county offices before they count in national reporting."
          />
          <ol className="mt-14 grid gap-4 md:grid-cols-4">
            {CHAIN.map((step, i) => (
              <li key={step} className="avs-reveal relative rounded-[var(--av-radius)] border border-white/10 bg-[rgb(var(--av-navy-2))] p-6">
                <p className="avs-meta text-[rgb(var(--av-mint))]">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-8 text-[1.25rem] font-medium leading-snug">{step}</p>
                <p className="avs-meta mt-2 uppercase tracking-[0.08em] text-[rgb(var(--av-mist))]">
                  {["Field officer", "District reviewer", "County office", "Programme team"][i]}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="components-title" className="avs-surface-paper avs-section">
        <div className="avs-container">
          <SectionIntro id="components-title" eyebrow="Programme components" title="Seven components, one programme." />
          <div className="mt-12 grid gap-4 lg:grid-cols-12">
            <ImageFrame scene="field-boundary" alt="" ratio="auto" className="avs-reveal min-h-[360px] rounded-[var(--av-radius-lg)] lg:col-span-5" />
            <ol className="grid gap-px overflow-hidden rounded-[var(--av-radius-lg)] border border-[rgb(var(--av-line)/0.14)] bg-[rgb(var(--av-line)/0.14)] sm:grid-cols-2 lg:col-span-7">
              {LIBERIA.components.map((c, i) => (
                <li key={c.title} className="avs-reveal bg-[rgb(var(--av-paper))] p-6">
                  <p className="avs-meta text-[rgb(var(--av-emerald-ink))]">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-3 text-[1.125rem] font-medium">{c.title}</h3>
                  <p className="avs-body mt-1.5 text-[0.9375rem]">{c.body}</p>
                </li>
              ))}
              <li aria-hidden="true" className="hidden bg-[rgb(var(--av-sand))] sm:block" />
            </ol>
          </div>
        </div>
      </section>

      <section aria-labelledby="phasing-title" className="avs-surface-sand avs-section">
        <div className="avs-container">
          <SectionIntro
            id="phasing-title"
            eyebrow="Phasing"
            title="Diagnose, pilot, then expand."
            body="Expansion beyond the three pilot counties depends on the pilot being validated."
          />
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {PHASES.map((p, i) => (
              <li key={p.k} className="avs-reveal rounded-[var(--av-radius)] bg-[rgb(var(--av-paper))] p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="avs-meta text-[rgb(var(--av-slate))]">Phase {i + 1}</p>
                  {p.current ? <span className="avs-chip text-[rgb(var(--av-forest))]">Current phase</span> : null}
                </div>
                <h3 className="mt-6 text-[1.375rem] font-medium">{p.k}</h3>
                <p className="avs-body mt-2 text-[0.9375rem]">{p.v}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand
        title="Working on agriculture in Liberia?"
        body="We work alongside county and district agriculture offices and programme partners. Tell us about your programme."
      />
    </>
  );
}
