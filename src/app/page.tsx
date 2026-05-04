import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";

export const metadata: Metadata = {
  title: "AgriVault — National agricultural data infrastructure",
  description:
    "Government-grade registry, mapping, and production intelligence for national food sovereignty and trusted reporting.",
};

const METRICS = [
  { label: "Pilot counties live", value: "3", note: "Nimba · Bong · Lofa" },
  { label: "Geotagged farmer profiles", value: "38,214", note: "registry + plots" },
  { label: "Production tracked (YTD)", value: "482,940 MT", note: "season 2025/26" },
  { label: "Avg post-harvest loss", value: "14.2%", note: "target <10%" },
] as const;

const CAPABILITY_CARDS = [
  {
    title: "National farmer registry",
    body: "Permanent IDs, county coverage, household profiles, and auditable registration history.",
  },
  {
    title: "Farm geo-mapping",
    body: "Plot records, GPS references, and operational geography for field planning and verification.",
  },
  {
    title: "Production intelligence",
    body: "County comparisons, yield signals, loss alerts, and season-by-season performance.",
  },
  {
    title: "Audit trail & exports",
    body: "Every change is logged and exportable for ministry oversight, donors, and compliance workflows.",
  },
  {
    title: "Offline-first field operations",
    body: "Mobile-friendly forms that work without internet and sync automatically when connected.",
  },
  {
    title: "Programme operations",
    body: "Coverage, beneficiary targeting, and reporting surfaces for subsidy and programme execution.",
  },
] as const;

const TRUST_SIGNALS = [
  "Government-owned data",
  "Role-based access control",
  "Audit trails and exportable history",
  "Offline-first field execution",
  "API-ready interoperability",
] as const;

const STAKEHOLDERS = [
  {
    title: "Ministry leadership",
    body: "Defensible national numbers by county, by season, by farmer — ready for cabinet and parliament.",
  },
  { title: "County offices", body: "Work queues, coverage visibility, and operational follow-up in one system." },
  { title: "Donors & DFIs", body: "Audit-ready reporting, transparent KPIs, and traceable field activity." },
  { title: "Cooperatives & exporters", body: "Registry + records + compliance artifacts packaged for market access." },
] as const;

export default function Page() {
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
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,.72)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  width: 20,
                  height: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  background: "var(--navy)",
                  color: "white",
                  fontFamily: "var(--ff-m)",
                  fontSize: 10,
                }}
              >
                ★
              </span>
              <span style={{ fontSize: 12, color: "var(--mid)" }}>
                <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--amber)" }}>
                  Pilot program in development
                </span>
              </span>
            </div>

            <h1 className="section-h" style={{ marginTop: 18, maxWidth: 920 }}>
              Real-time data infrastructure for Africa&apos;s{" "}
              <span style={{ fontStyle: "italic", color: "var(--amber)" }}>agricultural economy</span>.
            </h1>
            <p style={{ fontSize: 18, fontWeight: 300, color: "var(--mid)", maxWidth: 820, lineHeight: 1.7 }}>
              AgriVault is the operational backbone for national food sovereignty — geotagged farmer registry,
              county-level production telemetry, and the audit trail ministries, donors, and exporters can rely on.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }}>
              <Link href="/request-demo" className="btn-primary">
                Request a demo →
              </Link>
              <Link href="/platform" className="btn-outline">
                Explore platform
              </Link>
              <Link href="/government" className="btn-outline">
                Government partnership
              </Link>
            </div>

            <div style={{ marginTop: 14, fontSize: 12, color: "var(--muted)" }}>
              Used by ministries, cooperatives, and exporters. Designed for pilot-to-national rollout.
            </div>
          </div>
        </section>

        <section style={{ padding: "34px 0", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,.55)" }}>
          <div className="container">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
              {METRICS.map((m) => (
                <article key={m.label} style={{ border: "1px solid var(--border)", borderRadius: 12, background: "#fff", padding: 16 }}>
                  <div style={{ fontFamily: "var(--ff-d)", fontSize: 24, color: "var(--navy)" }}>{m.value}</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--mid)" }}>{m.label}</div>
                  <div style={{ marginTop: 4, fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--muted)" }}>{m.note}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "80px 0", background: "var(--warm)" }}>
          <div className="container">
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 22, alignItems: "start" }}>
              <div>
                <span className="section-tag">National priority</span>
                <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 44, lineHeight: 1.05, letterSpacing: "-.02em", color: "var(--ink)", marginTop: 12 }}>
                  Liberia imports <span style={{ fontStyle: "italic", color: "var(--amber)" }}>59%</span> of its rice.
                  <br />
                  We make every kilogram count.
                </h2>
                <p style={{ marginTop: 14, fontSize: 16, fontWeight: 300, color: "var(--mid)", lineHeight: 1.7, maxWidth: 640 }}>
                  Cutting import dependence requires defensible data — not estimates. AgriVault instruments the full chain:
                  planting → harvest → loss → market, with auditable records and ministry-ready reports.
                </p>
              </div>

              <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "#fff", padding: 22 }}>
                <div style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".18em" }}>
                  Pilot trust signals
                </div>
                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  {TRUST_SIGNALS.map((t) => (
                    <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ color: "var(--forest-brt)", fontSize: 16, lineHeight: "18px", marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 14, color: "var(--mid)", fontWeight: 300, lineHeight: 1.5 }}>{t}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link href="/docs" className="btn-outline">
                    Docs
                  </Link>
                  <Link href="/news" className="btn-outline">
                    News
                  </Link>
                  <Link href="/pricing" className="btn-outline">
                    Pricing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "80px 0", background: "#fff", borderTop: "1px solid var(--border)" }}>
          <div className="container">
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ maxWidth: 720 }}>
                <span className="section-tag">Platform</span>
                <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 40, lineHeight: 1.1, letterSpacing: "-.02em", color: "var(--forest)", marginTop: 12 }}>
                  Government-grade modules built for field reality.
                </h2>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/platform" className="btn-primary">
                  View platform →
                </Link>
                <Link href="/platform-preview" className="btn-outline">
                  Preview
                </Link>
              </div>
            </div>

            <div style={{ marginTop: 18, fontSize: 16, fontWeight: 300, color: "var(--mid)", lineHeight: 1.7, maxWidth: 820 }}>
              Registry, mapping, dashboards, reporting, and compliance surfaces — designed to produce numbers ministries can
              defend.
            </div>

            <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
              {CAPABILITY_CARDS.map((c) => (
                <article key={c.title} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 22, background: "rgba(45,122,62,.03)" }}>
                  <h3 style={{ fontFamily: "var(--ff-d)", fontSize: 22, color: "var(--forest)", marginBottom: 8 }}>{c.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--mid)", fontWeight: 300, lineHeight: 1.7 }}>{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "80px 0", background: "var(--warm)", borderTop: "1px solid var(--border)" }}>
          <div className="container">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
              <div style={{ maxWidth: 680 }}>
                <span className="section-tag">Stakeholders</span>
                <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 40, lineHeight: 1.1, letterSpacing: "-.02em", color: "var(--ink)", marginTop: 12 }}>
                  One source of truth across institutions.
                </h2>
                <p style={{ marginTop: 14, fontSize: 16, fontWeight: 300, color: "var(--mid)", lineHeight: 1.7 }}>
                  AgriVault supports government oversight, donor reporting, and market readiness with a single operational
                  system and a consistent audit trail.
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
                {STAKEHOLDERS.map((s) => (
                  <article key={s.title} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 18, background: "#fff" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{s.title}</div>
                    <div style={{ marginTop: 8, fontSize: 13, color: "var(--mid)", fontWeight: 300, lineHeight: 1.6 }}>{s.body}</div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "86px 0", background: "var(--navy)", color: "white" }}>
          <div className="container">
            <div style={{ maxWidth: 960 }}>
              <div style={{ fontFamily: "var(--ff-m)", fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(255,255,255,.6)" }}>
                Trust signal
              </div>
              <blockquote style={{ marginTop: 18, fontFamily: "var(--ff-d)", fontSize: 40, lineHeight: 1.15, letterSpacing: "-.02em" }}>
                “For the first time, we have a single number for national rice production that we can defend — by county, by
                season, by farmer.”
              </blockquote>
              <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,.74)" }}>
                <div style={{ width: 44, height: 44, borderRadius: 999, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.12)" }} />
                <div>
                  <div style={{ fontSize: 13, color: "white" }}>Senior Advisor, Food Security</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.62)" }}>Public-sector pilot program</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "80px 0", background: "var(--warm)", borderTop: "1px solid var(--border)" }}>
          <div className="container">
            <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "#fff", padding: 34 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                <div style={{ maxWidth: 720 }}>
                  <span className="section-tag">Request demo</span>
                  <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 36, lineHeight: 1.12, letterSpacing: "-.02em", color: "var(--ink)", marginTop: 12 }}>
                    Brief us. We’ll bring the numbers.
                  </h2>
                  <p style={{ marginTop: 12, fontSize: 16, fontWeight: 300, color: "var(--mid)", lineHeight: 1.7 }}>
                    A 90-minute walkthrough tailored to ministry oversight, donor reporting, or commercial deployment —
                    Monrovia or remote.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link href="/request-demo" className="btn-primary">
                    Request demo →
                  </Link>
                  <Link href="/platform-preview" className="btn-outline">
                    Preview platform
                  </Link>
                </div>
              </div>
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--border)", fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--muted)" }}>
                {TRUST_SIGNALS.join(" · ")}
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
