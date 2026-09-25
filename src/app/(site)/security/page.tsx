import type { Metadata } from "next";

import { CtaBand } from "@/components/site/page/CtaBand";
import { PageHero, SectionIntro } from "@/components/site/page/PageHero";
import { CONTACT_EMAIL } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "Security & governance",
  description:
    "How the AgriVault platform is governed: role-based workspaces, database row-level security, approval chains, an append-only decision ledger and hardened web transport.",
  alternates: { canonical: "/security" },
};

/*
 * Every control below exists in the production platform code (row-level
 * security migrations, workflow engine, offline capture queue, HTTP headers)
 * or in the live response headers. No certifications or third-party
 * attestations are claimed.
 */
const CONTROLS = [
  {
    group: "Access",
    items: [
      { t: "Role-based workspaces", b: "Field, district, county, national and administrative users each work in a workspace designed for their role." },
      { t: "Row-level security in the database", b: "Access rules are defined in the database itself, so they apply however the data is requested." },
    ],
  },
  {
    group: "Integrity",
    items: [
      { t: "Approval chains", b: "Records move through verification and approval at the institution's own administrative levels before they count." },
      { t: "Append-only decision ledger", b: "Approvals, rejections, correction requests and escalations are recorded with who and when, and are not edited afterwards." },
    ],
  },
  {
    group: "Field",
    items: [
      { t: "Offline capture queue", b: "Work captured without coverage is queued on the device and submitted when the connection returns." },
      { t: "Visible sync status", b: "Field officers can see what is still waiting to sync." },
    ],
  },
  {
    group: "Web transport",
    items: [
      { t: "Encrypted connections", b: "The platform is served only over HTTPS with strict transport security." },
      { t: "Browser protections", b: "A content security policy and frame protection limit what pages can load and where they can be embedded." },
    ],
  },
];

const GOVERNANCE = [
  { k: "Data ownership", v: "The operational record belongs to the institution. Hosting and operating arrangements are agreed in each engagement." },
  { k: "Boundaries", v: "Plot boundaries are operational outlines for traceability — approximate, not cadastral survey." },
  { k: "Published figures", v: "We do not publish programme figures until they have been validated against criteria agreed with partners." },
  { k: "Identity separation", v: "AgriVault is an independent company. Government and partner marks appear only in labelled programme context." },
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security & governance"
        title={
          <>
            Built to hold up to <span className="avs-accent">review</span>.
          </>
        }
        lead={
          <p>
            Agricultural records decide who receives inputs, subsidies and support. The platform is designed so that
            decisions are attributable and auditable — in the office and in the field.
          </p>
        }
      />

      <section aria-labelledby="controls-title" className="avs-surface-paper avs-section">
        <div className="avs-container">
          <SectionIntro
            id="controls-title"
            eyebrow="Platform controls"
            title="Eight controls, in four groups."
            body="Each describes how the platform behaves today. We will walk your security and audit teams through them in detail."
          />
          <div className="mt-14 space-y-14">
            {CONTROLS.map((g) => (
              <div key={g.group} className="grid gap-6 border-t border-[rgb(var(--av-line)/0.14)] pt-8 lg:grid-cols-12">
                <h3 className="avs-label avs-reveal text-[rgb(var(--av-emerald-ink))] lg:col-span-3">{g.group}</h3>
                <ul className="grid gap-8 md:grid-cols-2 lg:col-span-9">
                  {g.items.map((c) => (
                    <li key={c.t} className="avs-reveal">
                      <h4 className="text-[1.125rem] font-medium leading-snug">{c.t}</h4>
                      <p className="avs-body mt-2 text-[0.9375rem]">{c.b}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="governance-title" className="avs-surface-navy avs-on-dark avs-section">
        <div className="avs-container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="avs-label avs-eyebrow avs-reveal">Governance</p>
            <h2 id="governance-title" className="avs-h2 avs-reveal mt-5 max-w-[14ch]">
              Commitments that shape the work.
            </h2>
          </div>
          <dl className="lg:col-span-7">
            {GOVERNANCE.map((g) => (
              <div key={g.k} className="avs-reveal grid gap-2 border-t border-white/10 py-6 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="avs-label pt-1 text-[rgb(var(--av-gold))]">{g.k}</dt>
                <dd className="text-[1.125rem] leading-relaxed text-white/85">{g.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="disclose-title" className="avs-surface-paper pt-[var(--av-section)]">
        <div className="avs-container">
          <div className="avs-card avs-reveal grid gap-4 p-7 md:grid-cols-12 md:items-center md:p-9">
            <h2 id="disclose-title" className="avs-h3 md:col-span-4">
              Reporting a security concern
            </h2>
            <p className="avs-body text-[1.0625rem] md:col-span-8">
              If you believe you have found a vulnerability, write to{" "}
              <a className="avs-link text-[rgb(var(--av-forest))]" href={`mailto:${CONTACT_EMAIL}?subject=Security%20report`}>
                {CONTACT_EMAIL}
              </a>{" "}
              with the subject &ldquo;Security report&rdquo;. Please do not access data that is not yours or disrupt
              the service while investigating.
            </p>
          </div>
        </div>
      </section>

      <div className="pt-[var(--av-section)]">
        <CtaBand
          title="Bring your security and audit questions."
          body="We will take your team through access, approvals, the decision ledger and offline behaviour."
          secondary={{ label: "For governments", href: "/governments" }}
        />
      </div>
    </>
  );
}
