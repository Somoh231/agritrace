import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRight } from "@/components/site/icons";
import { ImageFrame } from "@/components/site/ImageFrame";
import { CtaBand } from "@/components/site/page/CtaBand";
import { PageHero, SectionIntro } from "@/components/site/page/PageHero";

export const metadata: Metadata = {
  title: "About",
  description:
    "AgriVault Data is an agricultural systems, technology, advisory and implementation company. Liberia is our starting market.",
  alternates: { canonical: "/about" },
};

const WHAT_WE_ARE = [
  { k: "Systems", v: "We design the data model, workflows and approval chains an agricultural institution runs on." },
  { k: "Technology", v: "We build and operate our own products, configured to each programme rather than customised from scratch." },
  { k: "Advisory", v: "We give an independent view of how a programme runs today and what it would take to strengthen it." },
  { k: "Implementation", v: "We train, deploy, support and measure in the field — and hand the system over." },
];

const BELIEFS = [
  { title: "Records before dashboards", body: "A national figure is only as good as the field record behind it. We start with how records are captured, verified and approved." },
  { title: "Designed for the field", body: "Intermittent coverage, shared devices and staff changes are the normal operating environment, not edge cases." },
  { title: "Evidence before claims", body: "We publish results only after they have been validated against criteria agreed with our partners." },
  { title: "Institutions in control", body: "The record belongs to the institution, and every engagement plans for the institution to run the system itself." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About AgriVault Data"
        tone="forest"
        title={
          <>
            The systems behind agriculture deserve the same care as the <span className="avs-accent">harvest</span>.
          </>
        }
        lead={
          <p>
            AgriVault Data is an agricultural systems, technology, advisory and implementation company. We work with
            governments, development partners and agricultural organisations to build the infrastructure that
            agricultural programmes run on.
          </p>
        }
      />

      <section aria-labelledby="why-title" className="avs-surface-paper avs-section">
        <div className="avs-container grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <p className="avs-label avs-eyebrow avs-reveal">Why we exist</p>
            <h2 id="why-title" className="avs-h2 avs-reveal mt-5">
              Programmes are held back by records, not by intent.
            </h2>
            <div className="avs-body avs-reveal mt-6 space-y-4 text-[1.0625rem]">
              <p>
                Agricultural programmes are often run across field forms, spreadsheets, GIS files, warehouse ledgers and
                reports that no one can reconcile. Leadership sees activity late, and figures cannot be traced back to
                what happened in the field.
              </p>
              <p>
                We exist to close that gap — by combining technology with programme design and the operational work of
                implementation, so that better records become part of how a programme actually runs.
              </p>
            </div>
          </div>
          <ImageFrame scene="aerial-fields" alt="" ratio="4 / 3" className="avs-reveal rounded-[var(--av-radius-lg)] lg:col-span-6" />
        </div>
      </section>

      <section aria-labelledby="what-title" className="avs-surface-navy avs-on-dark avs-section">
        <div className="avs-container">
          <SectionIntro id="what-title" eyebrow="What we are" title="Four disciplines, one team." />
          <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHAT_WE_ARE.map((w) => (
              <div key={w.k} className="avs-reveal rounded-[var(--av-radius)] border border-white/10 bg-[rgb(var(--av-navy-2))] p-6">
                <dt className="avs-serif text-[1.875rem] text-[rgb(var(--av-gold))]">{w.k}</dt>
                <dd className="mt-4 text-[1rem] leading-relaxed text-white/80">{w.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="beliefs-title" className="avs-surface-paper avs-section">
        <div className="avs-container">
          <SectionIntro id="beliefs-title" eyebrow="What we believe" title="How we approach the work." />
          <ol className="mt-12">
            {BELIEFS.map((b, i) => (
              <li key={b.title} className="avs-reveal grid gap-3 border-t border-[rgb(var(--av-line)/0.14)] py-8 md:grid-cols-12">
                <p className="avs-meta pt-2 text-[rgb(var(--av-emerald-ink))] md:col-span-1">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="avs-serif text-[clamp(1.625rem,2.6vw,2.25rem)] leading-[1.1] md:col-span-5">{b.title}</h3>
                <p className="avs-body text-[1.0625rem] md:col-span-6">{b.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="market-title" className="avs-surface-sand avs-section">
        <div className="avs-container grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="avs-label avs-eyebrow avs-reveal">Where we start</p>
            <h2 id="market-title" className="avs-h2 avs-reveal mt-5 max-w-[18ch]">
              Liberia is our starting market, not our limit.
            </h2>
            <p className="avs-body avs-reveal mt-6 max-w-[40rem] text-[1.0625rem]">
              Our first programme is a pilot in three Liberian counties, designed for phased expansion. What we build
              there is designed to travel to other countries and institutions.
            </p>
          </div>
          <div className="avs-reveal flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
            <Link href="/programmes/liberia" className="avs-btn avs-btn-primary">
              The Liberia programme <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="independence-title" className="avs-surface-paper pt-[var(--av-section)]">
        <div className="avs-container">
          <div className="avs-card avs-reveal grid gap-4 p-7 md:grid-cols-12 md:items-center md:p-9">
            <h2 id="independence-title" className="avs-h3 md:col-span-4">
              An independent company
            </h2>
            <p className="avs-body text-[1.0625rem] md:col-span-8">
              AgriVault Data is privately held and independent of the governments and partners it works with. Their
              names and marks appear on this site only in labelled programme context and never as AgriVault&rsquo;s
              identity.
            </p>
          </div>
        </div>
      </section>

      <div className="pt-[var(--av-section)]">
        <CtaBand />
      </div>
    </>
  );
}
