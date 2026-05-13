import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";
import PublicSiteShell from "@/components/agrivault/site/PublicSiteShell";

export const metadata: Metadata = {
  title: "Pricing — AgriVault Data",
  description: "Institutional pricing model: pilot-phase government partnership at $0 and commercial terms at national scale.",
};

export default function Page() {
  return (
    <PublicSiteShell>
      <PublicNav />
      <main className="page agrivault-html-main flex-1">
        <section style={{ padding: "64px 0 48px", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <span className="section-tag">Pricing</span>
            <h1 className="section-h">Priced for the institutions that matter.</h1>
            <p style={{ fontSize: 19, fontWeight: 300, color: "var(--mid)", maxWidth: 540, lineHeight: 1.7 }}>
              No cash required during the pilot phase. Commercial terms begin at national rollout.
            </p>
          </div>
        </section>

        <section style={{ padding: "56px 0" }}>
          <div className="container grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PricingCard
              tier="For cooperatives"
              price="Contact"
              sub="Per-lot compliance documentation"
              items={[
                "Farmer registry access",
                "Lot-level chain of custody",
                "EUDR Due Diligence Statements",
                "Buyer-facing origin documentation",
              ]}
              ctaLabel="Get pricing"
              ctaHref="/contact"
            />

            <article style={{ border: "1px solid var(--forest)", borderRadius: 12, padding: 36, background: "var(--forest)", position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--moss)",
                  color: "var(--forest)",
                  fontFamily: "var(--ff-m)",
                  fontSize: 10,
                  letterSpacing: ".08em",
                  padding: "4px 14px",
                  borderRadius: 100,
                  whiteSpace: "nowrap",
                  fontWeight: 500,
                }}
              >
                Government partnership
              </span>
              <span style={{ fontFamily: "var(--ff-m)", fontSize: 10.5, letterSpacing: ".1em", color: "var(--moss)", textTransform: "uppercase", display: "block", marginBottom: 18 }}>
                Pilot phase
              </span>
              <div style={{ fontFamily: "var(--ff-d)", fontSize: 38, fontWeight: 700, color: "var(--moss-lt)", lineHeight: 1, marginBottom: 6 }}>$0</div>
              <span style={{ fontSize: 13, color: "rgba(168,221,181,.55)", display: "block", marginBottom: 28 }}>
                During pilot · No budget line required
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {[
                  "Full platform — registry to export port",
                  "Historical data migration and cleaning",
                  "DAO and CAC training and support",
                  "Dedicated call centre",
                  "Ministry dashboard and reporting",
                  "Grant application support",
                  "Revenue sharing at national rollout",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 10, fontSize: 14, color: "rgba(255,255,255,.7)", fontWeight: 300 }}>
                    <span style={{ color: "var(--moss)" }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
              <Link
                href="/government"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                  background: "rgba(255,255,255,.12)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,.2)",
                  borderRadius: 6,
                  padding: "10px 18px",
                  fontSize: 14,
                  fontFamily: "var(--ff-b)",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Apply for partnership →
              </Link>
            </article>

            <PricingCard
              tier="Exporters & DFIs"
              price="Contact"
              sub="Annual platform license"
              items={[
                "Full registry and compliance access",
                "Supply chain verification API",
                "Custom report templates",
                "Multi-country data access at rollout",
              ]}
              ctaLabel="Get pricing"
              ctaHref="/contact"
            />
          </div>
        </section>
      </main>
      <PublicFooter />
    </PublicSiteShell>
  );
}

function PricingCard({
  tier,
  price,
  sub,
  items,
  ctaLabel,
  ctaHref,
}: {
  tier: string;
  price: string;
  sub: string;
  items: string[];
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <article style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 36, background: "#fff" }}>
      <span style={{ fontFamily: "var(--ff-m)", fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)", textTransform: "uppercase", display: "block", marginBottom: 18 }}>
        {tier}
      </span>
      <div style={{ fontFamily: "var(--ff-d)", fontSize: 38, fontWeight: 700, color: "var(--forest)", lineHeight: 1, marginBottom: 6 }}>{price}</div>
      <span style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 28 }}>{sub}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {items.map((item) => (
          <div key={item} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--mid)", fontWeight: 300 }}>
            <span style={{ color: "var(--forest-brt)" }}>✓</span>
            {item}
          </div>
        ))}
      </div>
      <Link href={ctaHref} className="btn-outline" style={{ width: "100%", justifyContent: "center" }}>
        {ctaLabel}
      </Link>
    </article>
  );
}
