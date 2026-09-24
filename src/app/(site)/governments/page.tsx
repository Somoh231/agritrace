import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRight } from "@/components/site/icons";
import { ImageFrame } from "@/components/site/ImageFrame";
import { CtaBand } from "@/components/site/page/CtaBand";
import { PageHero, SectionIntro } from "@/components/site/page/PageHero";
import { ENGAGEMENT_MODELS } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "Governments & ministries",
  description:
    "For ministries and agencies: operational visibility from field offices to the national level, accountable records, interoperability and continuity — with the institution in control.",
  alternates: { canonical: "/governments" },
};

const PILLARS = [
  {
    title: "Operational visibility",
    body: "Leadership sees field activity as it is recorded and approved — by county and district — rather than weeks later in a compiled report.",
  },
  {
    title: "Accountable records",
    body: "Every record carries who captured it, who verified and who approved it. Decisions are kept in an append-only ledger that auditors can follow.",
  },
  {
    title: "Interoperability",
    body: "Existing registries and ledgers come in through CSV import; reports and controlled exports go out as PDF and CSV; approved integrations use a documented API.",
  },
  {
    title: "Continuity",
    body: "Field work continues without coverage, and the process lives in the system rather than in individuals — so it survives staff changes and handover.",
  },
];

const CONTROL = [
  { k: "Ownership", v: "The operational record belongs to the institution. How it is hosted and operated is agreed in each engagement." },
  { k: "Access", v: "Every user sees only what their role and assigned geography allow — from a field officer's area to the national view." },
  { k: "Approvals", v: "Approval chains follow the institution's own administrative levels; nothing counts until the right level has approved it." },
  { k: "Exit", v: "Capacity transfer is a planned stage of every engagement, with documentation, skills and an ownership plan." },
];

export default function GovernmentsPage() {
  return (
    <>
      <PageHero
        eyebrow="Governments & ministries"
        title={
          <>
            Institutional modernisation that leaves the institution in <span className="avs-accent">control</span>.
          </>
        }
        lead={
          <p>
            We work with ministries of agriculture, their agencies and county and district offices to strengthen the
            systems behind national agricultural programmes — from registration in the field to national reporting.
          </p>
        }
      >
        <Link href="/contact" className="avs-btn avs-btn-primary">
          Start a conversation <ArrowRight />
        </Link>
        <Link href="/security" className="avs-btn avs-btn-ghost">
          Security & governance
        </Link>
      </PageHero>

      <section aria-labelledby="pillars-title" className="avs-surface-paper avs-section">
        <div className="avs-container">
          <SectionIntro
            id="pillars-title"
            eyebrow="What changes"
            title="Four things a ministry gains."
            body="Each is designed into the workflow and measured against criteria agreed with the ministry."
          />
          <ol className="mt-12 grid gap-4 md:grid-cols-2">
            {PILLARS.map((p, i) => (
              <li key={p.title} className="avs-card avs-reveal p-7 md:p-9">
                <p className="avs-meta text-[rgb(var(--av-emerald-ink))]">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="avs-h3 mt-6">{p.title}</h3>
                <p className="avs-body mt-3 text-[1.0625rem]">{p.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="control-title" className="avs-surface-navy avs-on-dark avs-section">
        <div className="avs-container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="avs-label avs-eyebrow avs-reveal">Institutional control</p>
            <h2 id="control-title" className="avs-h2 avs-reveal mt-5 max-w-[14ch]">
              The institution stays in charge of its data.
            </h2>
            <ImageFrame scene="operations-room" alt="" ratio="4 / 3" className="mt-10 hidden rounded-[var(--av-radius)] lg:block" />
          </div>
          <div className="lg:col-span-7">
            <dl>
              {CONTROL.map((c) => (
                <div key={c.k} className="avs-reveal grid gap-2 border-t border-white/10 py-6 sm:grid-cols-[9rem_1fr] sm:gap-6">
                  <dt className="avs-label pt-1 text-[rgb(var(--av-gold))]">{c.k}</dt>
                  <dd className="text-[1.125rem] leading-relaxed text-white/85">{c.v}</dd>
                </div>
              ))}
            </dl>
            <Link href="/security" className="avs-arrow-link mt-6">
              How the platform protects institutional data <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="engage-title" className="avs-surface-paper avs-section">
        <div className="avs-container">
          <SectionIntro
            id="engage-title"
            eyebrow="Engaging with us"
            title="Start with a diagnostic, not a procurement of software."
            body="Most ministries begin with an independent diagnostic. It produces a recommended path before any system is chosen."
          />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-[var(--av-radius)] border border-[rgb(var(--av-line)/0.14)] bg-[rgb(var(--av-line)/0.14)] sm:grid-cols-2 lg:grid-cols-5">
            {ENGAGEMENT_MODELS.map((m) => (
              <li key={m.n} className="avs-reveal flex flex-col bg-[rgb(var(--av-paper))] p-6">
                <p className="avs-label text-[rgb(var(--av-gold-ink))]">{m.kind}</p>
                <h3 className="mt-4 text-[1.125rem] font-medium leading-snug">{m.name}</h3>
                <p className="avs-body mt-2 text-[0.9375rem]">{m.suited}</p>
              </li>
            ))}
          </ul>
          <Link href="/how-we-work#engagement-models" className="avs-arrow-link mt-8">
            Compare engagement models <ArrowRight />
          </Link>
        </div>
      </section>

      <CtaBand
        title="Talk to us about a national programme."
        body="We can start with a short diagnostic conversation about how the programme runs today."
        secondary={{ label: "Security & governance", href: "/security" }}
      />
    </>
  );
}
