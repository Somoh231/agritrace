import type { Metadata } from "next";

import { CtaBand } from "@/components/site/page/CtaBand";
import { PageHero, SectionIntro } from "@/components/site/page/PageHero";
import { CONTACT_EMAIL } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "Security & governance",
  description:
    "How the AgriVault platform protects institutional data: role- and geography-scoped access, approval chains, an append-only decision ledger, safe offline capture and controlled exports.",
  alternates: { canonical: "/security" },
};

/*
 * Every control below is implemented in this repository (database row-level
 * security, workflow engine, offline sync queue, CSV export, HTTP headers).
 * No certifications or third-party attestations are claimed.
 */
const CONTROLS = [
  {
    group: "Access",
    items: [
      { t: "Accounts are provisioned, not self-registered", b: "There is no public sign-up. Users are created and assigned roles by the institution's administrators." },
      { t: "Role- and geography-scoped access", b: "Access is enforced in the database for every request: a field officer sees their assigned area, a county coordinator their county, the national team the national view." },
      { t: "Fail-closed identity", b: "If identity services are unavailable or a profile is incomplete, protected workspaces do not render." },
    ],
  },
  {
    group: "Integrity",
    items: [
      { t: "Approval chains", b: "Records move through verification and approval at the institution's own administrative levels before they count." },
      { t: "Append-only decision ledger", b: "Every approval, rejection, correction request and escalation is recorded with who, when and why, and cannot be edited afterwards." },
      { t: "Provenance on every record", b: "Each record keeps who captured it, where and when — so any reported figure can be traced back to its source." },
    ],
  },
  {
    group: "Field & devices",
    items: [
      { t: "Duplicate-safe offline capture", b: "Work captured without coverage is queued on the device and submitted once, safely, when the connection returns." },
      { t: "Replayed under the officer's own permissions", b: "Queued work is submitted with the same access rules as online work — being offline grants nothing extra." },
      { t: "Personal data removed after sync", b: "Once queued records have synced, they are removed from the device. Signing out clears cached private pages." },
    ],
  },
  {
    group: "Reporting & transport",
    items: [
      { t: "Exports scoped to the user", b: "Reports and exports contain only what the requesting user's role and geography allow." },
      { t: "Spreadsheet-safe CSV", b: "Exported cells are neutralised so they cannot execute as spreadsheet formulas." },
      { t: "Hardened web transport", b: "HTTPS with strict transport security, a restrictive content security policy, frame protection and rate limiting on sensitive endpoints." },
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
            every record is scoped, attributable and auditable — in the office and in the field.
          </p>
        }
      />

      <section aria-labelledby="controls-title" className="avs-surface-paper avs-section">
        <div className="avs-container">
          <SectionIntro
            id="controls-title"
            eyebrow="Platform controls"
            title="Twelve controls, in four groups."
            body="Each describes how the platform behaves today. We will walk your security and audit teams through any of them."
          />
          <div className="mt-14 space-y-14">
            {CONTROLS.map((g) => (
              <div key={g.group} className="grid gap-6 border-t border-[rgb(var(--av-line)/0.14)] pt-8 lg:grid-cols-12">
                <h3 className="avs-label avs-reveal text-[rgb(var(--av-emerald-ink))] lg:col-span-3">{g.group}</h3>
                <ul className="grid gap-8 md:grid-cols-3 lg:col-span-9">
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
          body="We will take your team through access, approvals, the decision ledger and offline behaviour in detail."
          secondary={{ label: "For governments", href: "/governments" }}
        />
      </div>
    </>
  );
}
