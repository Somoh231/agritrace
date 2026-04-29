import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";

export const metadata: Metadata = {
  title: "Africa — AgriVault Data",
  description:
    "AgriVault expansion roadmap across West Africa: Liberia proof, then Sierra Leone, Guinea, and Nigeria rollout.",
};

export default function Page() {
  return (
    <>
      <PublicNav />
      <main className="page agrivault-html-main">
        <section style={{ padding: "80px 0 60px", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <span className="section-tag">Africa expansion</span>
            <h1 className="section-h" style={{ maxWidth: 700 }}>
              Liberia is the proof. West Africa is the prize.
            </h1>
            <p style={{ fontSize: 19, fontWeight: 300, color: "var(--mid)", maxWidth: 600, lineHeight: 1.7 }}>
              The model proven in Liberia replicates sequentially — same infrastructure, same methodology, each country
              adding national scale to a continental data layer.
            </p>
          </div>
        </section>

        <section style={{ padding: "80px 0" }}>
          <div className="container">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[18px] mb-[60px]">
              <CountryCard
                phase="Phase 1 · Now"
                country="Liberia"
                subtitle="Rice → Cocoa, Coffee, Rubber"
                status="Live · Pilot 2026"
                live
              />
              <CountryCard phase="Phase 2 · Year 2–3" country="Sierra Leone" subtitle="Cocoa, Rice" status="Planned 2027" />
              <CountryCard phase="Phase 3 · Year 3–4" country="Guinea" subtitle="Cocoa, Coffee" status="Pipeline 2028" />
              <CountryCard phase="Phase 4 · Year 4–5" country="Nigeria" subtitle="Cocoa, Coffee, Palm" status="Pipeline 2029" />
            </div>

            <section style={{ padding: 36, background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 24, fontWeight: 600, color: "var(--forest)", marginBottom: 8 }}>
                  $11B in sub-Saharan African export revenue requires traceability.
                </h2>
                <p style={{ fontSize: 15, color: "var(--mid)", fontWeight: 300 }}>
                  Countries that build the standard first define the infrastructure for everyone that follows.
                </p>
              </div>
              <Link href="/contact" className="btn-primary" style={{ whiteSpace: "nowrap", padding: "12px 22px" }}>
                Partner with us →
              </Link>
            </section>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

function CountryCard({
  phase,
  country,
  subtitle,
  status,
  live = false,
}: {
  phase: string;
  country: string;
  subtitle: string;
  status: string;
  live?: boolean;
}) {
  return (
    <article
      style={{
        border: live ? "1px solid var(--forest-brt)" : "1px solid var(--border)",
        borderRadius: 10,
        padding: 28,
        background: live ? "rgba(45,122,62,.04)" : "#fff",
      }}
    >
      <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, letterSpacing: ".1em", color: live ? "var(--forest-brt)" : "var(--muted)", textTransform: "uppercase", marginBottom: 10 }}>
        {phase}
      </div>
      <div style={{ fontFamily: "var(--ff-d)", fontSize: 24, fontWeight: 600, color: "var(--forest)", marginBottom: 6 }}>{country}</div>
      <div style={{ fontSize: 13, color: "var(--mid)", fontWeight: 300, marginBottom: 18 }}>{subtitle}</div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: live ? "rgba(91,191,110,.12)" : "rgba(122,148,128,.1)",
          border: live ? "1px solid rgba(91,191,110,.25)" : "1px solid rgba(122,148,128,.2)",
          borderRadius: 100,
          padding: "4px 10px",
          fontFamily: "var(--ff-m)",
          fontSize: 10,
          color: live ? "var(--forest-brt)" : "var(--muted)",
        }}
      >
        {live ? <span className="pulse" style={{ width: 6, height: 6, background: "var(--moss)", borderRadius: "50%" }} /> : null}
        {status}
      </div>
    </article>
  );
}
