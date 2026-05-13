import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";
import PublicSiteShell from "@/components/agrivault/site/PublicSiteShell";

export const metadata: Metadata = {
  title: "For Governments — AgriVault Data",
  description:
    "Asset-based government partnership model with data sovereignty, grant support, and fast implementation framework.",
};

export default function Page() {
  return (
    <PublicSiteShell>
      <PublicNav />
      <main className="page agrivault-html-main flex-1">
        <section style={{ padding: "64px 0 48px", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <span className="section-tag">For Governments</span>
            <h1 className="section-h" style={{ maxWidth: 700 }}>
              The partnership model that makes this possible without a budget line.
            </h1>
            <p style={{ fontSize: 19, fontWeight: 300, color: "var(--mid)", maxWidth: 620, lineHeight: 1.7 }}>
              AgriVault Data proposes an asset-based public-private partnership. No cash changes hands. Both parties
              contribute what they already have.
            </p>
          </div>
        </section>

        <section style={{ padding: "56px 0" }}>
          <div className="container">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 56 }}>
              <ContributionCard
                title="The Ministry contributes"
                items={[
                  "District Agriculture Officers already deployed in the field",
                  "County Agriculture Officers already supervising them",
                  "Years of accumulated farmer data held at district offices",
                  "Institutional authority that gives the program national legitimacy",
                  "Letters of support for international grant funding applications",
                ]}
              />
              <ContributionCard
                highlighted
                title="AgriVault Data contributes"
                items={[
                  "Fully built technology platform, production-ready",
                  "Data engineering methodology and migration expertise",
                  "Training for all participating DAOs and CACs",
                  "Dedicated call centre during data collection hours",
                  "Monthly data quality reports and quarterly production reports",
                ]}
              />
            </div>

            <PolicyBlock
              id="sovereignty"
              title="Data sovereignty"
              body="All data belongs to the Government and to farmers. This is not commercially negotiable. AgriVault Data operates as data processor under the Ministry's authority, not as data owner. The Ministry receives a full data export on request at any time. If the program ends, all data is returned in portable format with no restriction."
            />
            <PolicyBlock
              id="grants"
              title="Grant support"
              body="A successful pilot with verified production data and a working national farmer registry positions the Ministry to apply for significant development grants. AgriVault Data supports preparation of these applications: FAO, IFAD, African Development Bank, USAID Feed the Future, World Bank Agriculture and Food Global Practice, EU Global Europe / NDICI, UK FCDO."
            />
            <PolicyBlock
              id="mou"
              title="MOU framework"
              body="The partnership is formalised through a Memorandum of Understanding between the Ministry of Agriculture and AgriVault Data. The MOU covers the pilot scope, data governance, roles and responsibilities, and the principle of revenue sharing at national rollout. AgriVault Data is ready to begin within 30 days of MOU signing."
              cta
            />
          </div>
        </section>
      </main>
      <PublicFooter />
    </PublicSiteShell>
  );
}

function ContributionCard({ title, items, highlighted = false }: { title: string; items: string[]; highlighted?: boolean }) {
  return (
    <article
      style={{
        border: highlighted ? "1px solid var(--forest-brt)" : "1px solid var(--border)",
        borderRadius: 12,
        padding: 36,
        background: highlighted ? "rgba(45,122,62,.03)" : "#fff",
      }}
    >
      <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 22, fontWeight: 600, color: "var(--forest)", marginBottom: 20 }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map((item) => (
          <div key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ color: "var(--forest-brt)", fontSize: 18, flexShrink: 0, marginTop: -2 }}>✓</span>
            <span style={{ fontSize: 15, color: "var(--mid)", fontWeight: 300 }}>{item}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function PolicyBlock({ id, title, body, cta = false }: { id: string; title: string; body: string; cta?: boolean }) {
  return (
    <section id={id} style={{ paddingTop: 40, borderTop: "1px solid var(--border)", marginBottom: 60 }}>
      <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 30, fontWeight: 600, color: "var(--forest)", marginBottom: 16, letterSpacing: "-.01em" }}>
        {title}
      </h2>
      <p style={{ fontSize: 16, fontWeight: 300, color: "var(--mid)", lineHeight: 1.7, marginBottom: cta ? 24 : 0 }}>{body}</p>
      {cta ? (
        <Link href="/contact" className="btn-primary" style={{ fontSize: 15, padding: "12px 24px" }}>
          Request partnership conversation →
        </Link>
      ) : null}
    </section>
  );
}
