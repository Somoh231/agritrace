import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";

export const metadata: Metadata = {
  title: "Governance — AgriVault Data",
  description:
    "Government-grade data governance for agricultural systems: ownership, role-based access, audit trails, resilience, and policy alignment.",
};

const ITEMS = [
  "Government ownership of sovereign data",
  "Role-based access control for all user classes",
  "Comprehensive audit trails for accountability",
  "Data access activity monitoring",
  "Cloud resilience and high-availability architecture",
  "Policy alignment with ministry mandates",
];

export default function GovernancePublicPage() {
  return (
    <>
      <PublicNav />
      <main className="page agrivault-html-main">
        <section style={{ padding: "88px 0 60px", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <span className="section-tag">Governance</span>
            <h1 className="section-h">Government-led governance, built into daily operations.</h1>
            <p style={{ fontSize: 18, color: "var(--mid)", maxWidth: 720 }}>
              AgriVault enforces sovereign ownership, controlled access, and full traceability so ministries can govern
              agricultural data with confidence.
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
          <div className="container grid grid-cols-1 md:grid-cols-2 gap-3">
            {ITEMS.map((item) => (
              <div key={item} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 20, background: "white" }}>
                <div style={{ fontSize: 16, color: "var(--forest)", fontWeight: 500 }}>{item}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

