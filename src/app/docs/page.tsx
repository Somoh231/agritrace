import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";
import PublicSiteShell from "@/components/agrivault/site/PublicSiteShell";

export const metadata: Metadata = {
  title: "Docs — AgriVault Data",
  description:
    "Technical and operational documentation for AgriVault modules, implementation setup, governance, and reporting workflows.",
};

export default function Page() {
  return (
    <PublicSiteShell>
      <PublicNav />
      <main className="page agrivault-html-main flex-1">
        <section style={{ padding: "64px 0 48px", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <span className="section-tag">Documentation</span>
            <h1 className="section-h">Technical documentation for public-sector deployment.</h1>
            <p style={{ fontSize: 18, fontWeight: 300, color: "var(--mid)", maxWidth: 680 }}>
              Structured guidance covering platform modules, governance, implementation readiness, and reporting outputs.
            </p>
          </div>
        </section>

        <section style={{ padding: "56px 0" }}>
          <div className="container grid grid-cols-1 lg:grid-cols-[1.3fr_.7fr] gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docCards.map((card) => (
                <article key={card.title} style={{ border: "1px solid var(--border)", borderRadius: 12, background: "#fff", padding: 24 }}>
                  <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, letterSpacing: ".1em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 10 }}>
                    {card.tag}
                  </div>
                  <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 24, color: "var(--forest)", marginBottom: 8 }}>{card.title}</h2>
                  <p style={{ fontSize: 14, color: "var(--mid)", fontWeight: 300, lineHeight: 1.65 }}>{card.body}</p>
                </article>
              ))}
            </div>

            <aside style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--cream)", padding: 24 }}>
              <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 24, color: "var(--forest)", marginBottom: 8 }}>Need implementation docs now?</h2>
              <p style={{ fontSize: 14, color: "var(--mid)", fontWeight: 300, lineHeight: 1.65, marginBottom: 18 }}>
                Request the latest technical packet: architecture brief, pilot implementation SOP, data dictionary, and reporting templates.
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                <Link href="/request-demo" className="btn-primary" style={{ justifyContent: "center" }}>
                  Request demo →
                </Link>
                <Link href="/platform" className="btn-outline" style={{ justifyContent: "center" }}>
                  View platform
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <PublicFooter />
    </PublicSiteShell>
  );
}

const docCards = [
  {
    tag: "Modules",
    title: "Registry & Field Data",
    body: "Farmer identity standards, plot geotagging schema, season records, and verification workflows.",
  },
  {
    tag: "Governance",
    title: "Data Sovereignty",
    body: "Government ownership model, export portability commitments, and processor role boundaries.",
  },
  {
    tag: "Operations",
    title: "Pilot Runbook",
    body: "DAO/CAC onboarding, support protocols, QA controls, and escalation model for parallel paper-digital ops.",
  },
  {
    tag: "Reporting",
    title: "Ministry Outputs",
    body: "Cabinet-ready reporting templates, KPI definitions, and donor/DFI structured data export standards.",
  },
];
