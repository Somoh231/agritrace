import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";
import { getPublicContent } from "@/lib/growth/content";
import { createClient } from "@/lib/supabase/server";

const CAPABILITIES = [
  "National farmer registry",
  "Farm profile and geo-mapping",
  "Production intelligence dashboards",
  "County comparisons",
  "Offline field tools",
  "Subsidy programme management",
  "Resource allocation tracking",
  "Compliance and audit support",
] as const;

const INTEGRATIONS = [
  "National ID systems",
  "Land administration systems",
  "Finance and treasury systems",
  "Customs and export systems",
  "Donor reporting platforms",
] as const;

function hasBackendConnection(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && anonKey);
}

export const metadata: Metadata = {
  title: "Platform — AgriVault Data",
  description:
    "Explore the AgriVault platform experience with dashboard, map, reporting, and workflow previews.",
};

export default async function Page() {
  if (!hasBackendConnection()) {
    redirect("/platform-preview");
  }

  // If the real app is configured and the user is authenticated, use /platform as the
  // production entry point and send them straight into the dashboard.
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/rice");
  } catch {
    // If Supabase isn't configured correctly, fall back to the public marketing experience.
  }

  const content = await getPublicContent();
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="page agrivault-html-main flex-1">
        <section
          style={{
            padding: "90px 0 70px",
            borderBottom: "1px solid var(--border)",
            background: "linear-gradient(180deg,var(--warm),var(--cream))",
          }}
        >
          <div className="container">
            <span className="section-tag">Platform experience</span>
            <h1 className="section-h" style={{ maxWidth: 760 }}>
              {content.platform.heroTitle}
            </h1>
            <p style={{ fontSize: 18, fontWeight: 300, color: "var(--mid)", maxWidth: 760 }}>
              {content.platform.heroBody}
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
              <Link href="/rice" className="btn-primary">
                {content.platform.ctaExplore} →
              </Link>
              <Link href="/platform-preview" className="btn-outline">
                Preview platform
              </Link>
              <Link href="/request-demo" className="btn-outline">
                {content.platform.ctaDemo}
              </Link>
            </div>
          </div>
        </section>

        <section style={{ padding: "70px 0", background: "var(--warm)" }}>
          <div className="container">
            <h2 className="section-h" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
              Four workflows. One operating system.
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
              {[
                ["Dashboard", "National production, import gap, loss alerts."],
                ["Maps", "County heatmaps and operational geography."],
                ["Reports", "Cabinet PDFs and donor exports."],
                ["Compliance", "Audit trail, chain-of-custody, EUDR readiness."],
              ].map(([title, detail]) => (
                <article
                  key={title}
                  style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 24, background: "#fff" }}
                >
                  <h3 style={{ fontFamily: "var(--ff-d)", fontSize: 24, color: "var(--forest)", marginBottom: 8 }}>{title}</h3>
                  <p style={{ color: "var(--mid)", fontWeight: 300 }}>{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="capabilities" style={{ padding: "80px 0", borderTop: "1px solid var(--border)", background: "#fff" }}>
          <div className="container">
            <span className="section-tag">Capabilities</span>
            <h2 className="section-h" style={{ maxWidth: 860 }}>
              Operational capabilities for national agricultural execution.
            </h2>
            <p style={{ fontSize: 18, fontWeight: 300, color: "var(--mid)", maxWidth: 760, lineHeight: 1.7 }}>
              Designed for field reality and ministry oversight, with built-in intelligence, programme operations, and
              compliance-ready reporting.
            </p>

            <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              {CAPABILITIES.map((card) => (
                <article key={card} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 18, background: "rgba(45,122,62,.03)" }}>
                  <div style={{ fontSize: 15, color: "var(--forest)", fontWeight: 500 }}>{card}</div>
                </article>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 26 }}>
              <Link href="/request-demo" className="btn-primary">
                Request Demo →
              </Link>
              <Link href="/platform-preview" className="btn-outline">
                Preview platform
              </Link>
              <Link href="/docs" className="btn-outline">
                Docs
              </Link>
              <Link href="/government#sovereignty" className="btn-outline">
                Data sovereignty
              </Link>
            </div>
          </div>
        </section>

        <section id="integrations" style={{ padding: "80px 0", borderTop: "1px solid var(--border)", background: "var(--warm)" }}>
          <div className="container">
            <span className="section-tag">Integrations</span>
            <h2 className="section-h">API-ready architecture for connected government operations.</h2>
            <p style={{ fontSize: 18, fontWeight: 300, color: "var(--mid)", maxWidth: 780, lineHeight: 1.7 }}>
              Secure APIs, import/export workflows, and practical integration pathways for national digital public
              infrastructure.
            </p>

            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 }}>
              <article style={{ border: "1px solid var(--border)", borderRadius: 12, background: "#fff", padding: 24 }}>
                <h3 style={{ fontFamily: "var(--ff-d)", fontSize: 26, color: "var(--forest)" }}>Integration readiness</h3>
                <p style={{ marginTop: 8, color: "var(--mid)", fontWeight: 300, lineHeight: 1.7 }}>
                  Structured data contracts and export-ready operations for institutional partners.
                </p>
                <div style={{ marginTop: 14, fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--muted)" }}>
                  Endpoints: /api/farmers · /api/registrations · /api/production · /api/reports
                </div>
              </article>
              <article style={{ border: "1px solid var(--border)", borderRadius: 12, background: "#fff", padding: 24 }}>
                <h3 style={{ fontFamily: "var(--ff-d)", fontSize: 26, color: "var(--forest)" }}>Connected systems</h3>
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  {INTEGRATIONS.map((item) => (
                    <div key={item} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
