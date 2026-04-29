import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";

export const metadata: Metadata = {
  title: "Integrations — AgriVault Data",
  description:
    "API-ready interoperability for government systems, donor reporting, and secure data exchange workflows.",
};

const INTEGRATIONS = [
  "National ID systems",
  "Land administration systems",
  "Finance and treasury systems",
  "Customs and export systems",
  "Donor reporting platforms",
];

export default function IntegrationsPublicPage() {
  return (
    <>
      <PublicNav />
      <main className="page agrivault-html-main">
        <section style={{ padding: "88px 0 60px", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <span className="section-tag">Interoperability</span>
            <h1 className="section-h">API-ready architecture for connected government operations.</h1>
            <p style={{ fontSize: 18, color: "var(--mid)", maxWidth: 760 }}>
              AgriVault supports secure APIs, import/export workflows, and practical integration pathways for national
              digital public infrastructure.
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
          <div className="container grid grid-cols-1 md:grid-cols-2 gap-4">
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "white", padding: 24 }}>
              <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 30, color: "var(--forest)" }}>Integration readiness</h2>
              <p style={{ marginTop: 8, color: "var(--mid)" }}>
                Secure API endpoints, structured data contracts, and export-ready operations for institutional partners.
              </p>
              <div style={{ marginTop: 14, fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--muted)" }}>
                Endpoints: /api/farmers · /api/registrations · /api/production · /api/reports
              </div>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "white", padding: 24 }}>
              <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 30, color: "var(--forest)" }}>Connected systems</h2>
              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                {INTEGRATIONS.map((item) => (
                  <div key={item} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", fontSize: 13 }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

