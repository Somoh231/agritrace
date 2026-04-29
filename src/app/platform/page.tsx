import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";
import { getPublicContent } from "@/lib/growth/content";

function hasBackendConnection(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
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
  const content = await getPublicContent();
  return (
    <>
      <PublicNav />
      <main className="page agrivault-html-main">
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
              <Link href="/platform-preview" className="btn-primary">
                {content.platform.ctaExplore} →
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
      </main>
      <PublicFooter />
    </>
  );
}
