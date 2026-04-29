import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";

export const metadata: Metadata = {
  title: "Capabilities — AgriVault Data",
  description:
    "Operational capabilities for ministries: farmer registry, mapping, production dashboards, field tools, programmes, reporting, and compliance.",
};

const CARDS = [
  "National farmer registry",
  "Farm profile and geo-mapping",
  "Production intelligence dashboards",
  "County comparisons",
  "Offline field tools",
  "Subsidy programme management",
  "Resource allocation tracking",
  "Compliance and audit support",
];

export default function CapabilitiesPublicPage() {
  return (
    <>
      <PublicNav />
      <main className="page agrivault-html-main">
        <section style={{ padding: "88px 0 60px", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <span className="section-tag">Capabilities</span>
            <h1 className="section-h">Operational capabilities for national agricultural execution.</h1>
            <p style={{ fontSize: 18, color: "var(--mid)", maxWidth: 720 }}>
              Designed for field reality and ministry oversight, with built-in intelligence, programme operations, and
              compliance-ready reporting.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              <Link href="/request-demo" className="btn-primary">Request Demo →</Link>
              <Link href="/platform-preview" className="btn-outline">View Platform</Link>
              <Link href="/docs" className="btn-outline">Download Proposal</Link>
              <Link href="/contact" className="btn-outline">Contact Ministry Partnerships</Link>
            </div>
          </div>
        </section>

        <section style={{ padding: "70px 0" }}>
          <div className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {CARDS.map((card) => (
              <div key={card} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 18, background: "white" }}>
                <div style={{ fontSize: 15, color: "var(--forest)", fontWeight: 500 }}>{card}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

