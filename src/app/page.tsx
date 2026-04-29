import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";
import HomeHeroActions from "@/components/marketing/HomeHeroActions";
import { getHeroVariant } from "@/lib/growth/experiments";
import { getPublicContent } from "@/lib/growth/content";

export const metadata: Metadata = {
  title: "AgriVault Data — Agricultural Traceability Infrastructure for Africa — AgriVault Data",
  description:
    "Verified farmer registries, GPS-mapped plots, season-by-season production records, and compliance documentation for government and export readiness.",
};

export default async function Page() {
  const [content, variant] = await Promise.all([getPublicContent(), Promise.resolve(getHeroVariant())]);
  const heroTitle = variant === "authority" ? content.homepage.heroTitleB : content.homepage.heroTitleA;

  return (
    <>
      <PublicNav />
      <main className="page agrivault-html-main">
        <section style={{ padding: "120px 0 80px", background: "var(--warm)" }}>
          <div className="container">
            <div
              className="hero-anim"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(91,191,110,.1)",
                border: "1px solid rgba(91,191,110,.25)",
                borderRadius: 100,
                padding: "5px 14px",
                fontFamily: "var(--ff-m)",
                fontSize: 12,
                color: "var(--forest-brt)",
                letterSpacing: ".04em",
                marginBottom: 32,
              }}
            >
              <span
                className="pulse"
                style={{ width: 6, height: 6, background: "var(--moss)", borderRadius: "50%", display: "inline-block" }}
              />
              {content.homepage.heroBadge}
            </div>
            <h1
              className="hero-anim-2"
              style={{
                fontFamily: "var(--ff-d)",
                fontSize: "clamp(44px,6vw,76px)",
                fontWeight: 700,
                lineHeight: 1.06,
                letterSpacing: "-.025em",
                color: "var(--forest)",
                maxWidth: 860,
                marginBottom: 24,
              }}
            >
              {heroTitle.includes("economy") ? (
                <>
                  {heroTitle.replace("economy", "")}
                  <em style={{ color: "var(--forest-brt)" }}>economy.</em>
                </>
              ) : (
                heroTitle
              )}
            </h1>
            <p
              className="hero-anim-3"
              style={{ fontSize: 19, fontWeight: 300, color: "var(--mid)", maxWidth: 560, lineHeight: 1.65, marginBottom: 40 }}
            >
              {content.homepage.heroBody}
            </p>
            <HomeHeroActions
              variant={variant}
              primaryLabel={content.homepage.ctaPrimary}
              secondaryLabel={content.homepage.ctaSecondary}
            />
            <p style={{ marginTop: 18, fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--muted)", letterSpacing: ".02em" }}>
              {content.homepage.contactLine}
            </p>
          </div>
        </section>

        <section
          style={{
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            padding: "18px 2.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontFamily: "var(--ff-m)",
              fontSize: 10.5,
              letterSpacing: ".1em",
              color: "var(--muted)",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              paddingRight: 28,
              borderRight: "1px solid var(--border)",
              marginRight: 28,
              flexShrink: 0,
            }}
          >
            Operational with
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 36, flexWrap: "wrap" }}>
            {[
              "Ministry of Agriculture · Liberia",
              "Nimba County Agriculture Office",
              "Bong County Agriculture Office",
              "Lofa County Agriculture Office",
            ].map((item) => (
              <span key={item} style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--muted)" }}>
                {item}
              </span>
            ))}
          </div>
        </section>

        <section style={{ background: "var(--forest)" }}>
          <div className="container" style={{ paddingTop: 60, paddingBottom: 60, display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
            {[
              ["40", "K+", "Smallholder farmers in Liberia pilot"],
              ["3", "", "Counties live — Nimba, Bong & Lofa"],
              ["$11", "B", "African exports requiring traceability"],
              ["15", "", "Liberian counties targeted for rollout"],
            ].map(([main, suffix, label], idx) => (
              <div
                key={label}
                style={{
                  padding: idx === 0 ? "0 32px 0 0" : idx === 3 ? "0 0 0 32px" : "0 32px",
                  borderRight: idx < 3 ? "1px solid rgba(91,191,110,.18)" : undefined,
                }}
              >
                <div style={{ fontFamily: "var(--ff-d)", fontSize: 50, fontWeight: 700, color: "var(--moss-lt)", lineHeight: 1, marginBottom: 8 }}>
                  {main}
                  {suffix ? <span style={{ fontSize: 28, color: "var(--moss)" }}>{suffix}</span> : null}
                </div>
                <div style={{ fontSize: 13, color: "rgba(168,221,181,.65)", fontWeight: 300 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: "100px 0", background: "var(--warm)" }}>
          <div className="container">
            <span className="section-tag">The platform</span>
            <h2 className="section-h">One stack. Every crop. Any market.</h2>
            <p className="section-sub">Built for field reality — works without internet, syncs when connectivity is available.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "var(--border)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              {[
                ["Primary", "Farmer Registry", "Permanent unique IDs. GPS-mapped plots.", "/platform"],
                ["Primary", "Production Dashboard", "County-level production vs targets.", "/platform-preview"],
                ["Compliance", "Audit Trail", "Chain-of-custody from farm gate to export port.", "/platform-preview"],
                ["Operations", "Inventory Ledger", "Lot creation, movement logs, weight reconciliation.", "/platform-preview"],
                ["Maps", "County Heatmaps", "Production density and loss incident mapping.", "/platform-preview"],
                ["Reporting", "Ministry Reports", "Cabinet-ready PDFs and donor exports.", "/platform-preview"],
              ].map(([tag, title, text, href]) => (
                <Link
                  key={title}
                  href={href}
                  style={{ background: "var(--warm)", padding: 32, textDecoration: "none", display: "block" }}
                >
                  <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 10 }}>
                    {tag}
                  </span>
                  <strong style={{ fontFamily: "var(--ff-d)", fontSize: 19, fontWeight: 600, color: "var(--forest)", display: "block", marginBottom: 8 }}>
                    {title}
                  </strong>
                  <p style={{ fontSize: 13.5, color: "var(--mid)", lineHeight: 1.6, fontWeight: 300 }}>{text}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
