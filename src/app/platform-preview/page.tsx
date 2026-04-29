import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";

export const metadata: Metadata = {
  title: "Platform Preview — Agrivault",
  description:
    "Experience Agrivault with investor-ready mock data: national dashboards, county maps, reporting exports, and workflow intelligence.",
};

export default async function PlatformPreviewPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="page agrivault-html-main flex-1">
        <section style={{ padding: "86px 0 28px", borderBottom: "1px solid var(--border)", background: "var(--warm)" }}>
          <div className="container">
            <span className="section-tag">Preview mode</span>
            <h1 className="section-h" style={{ maxWidth: 860 }}>
              Full platform experience, no login required.
            </h1>
            <p style={{ fontSize: 18, fontWeight: 300, color: "var(--mid)", maxWidth: 760 }}>
              This guided preview runs on realistic mock data so ministries, investors, and partners can evaluate the
              workflow before backend provisioning is complete.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
              <Link href="/request-demo" className="btn-primary">
                Request Demo →
              </Link>
              <Link href="/platform" className="btn-outline">
                Platform page
              </Link>
            </div>
          </div>
        </section>

        <section style={{ padding: "34px 0 60px", background: "var(--warm)" }}>
          <div className="container" style={{ display: "grid", gap: 18 }}>
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 14,
                background: "#fff",
                overflow: "hidden",
                boxShadow: "0 8px 28px rgba(15,46,20,.06)",
              }}
            >
              <div
                style={{
                  borderBottom: "1px solid var(--border)",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--muted)" }}>
                  agrivault.gov.lr / rice / national
                </div>
                <div style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--forest-brt)" }}>LIVE PREVIEW</div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-0">
                <aside style={{ borderRight: "1px solid var(--border)", padding: 16, background: "var(--cream)" }}>
                  <div style={{ fontFamily: "var(--ff-d)", fontSize: 20, color: "var(--forest)", marginBottom: 14 }}>
                    Rice National
                  </div>
                  <div style={{ display: "grid", gap: 8, fontSize: 13, color: "var(--mid)" }}>
                    <div>Overview</div>
                    <div>Farmer Registry</div>
                    <div>Demand Gap</div>
                    <div>Counties</div>
                    <div>Compliance</div>
                    <div>Audit Trail</div>
                  </div>
                </aside>
                <div style={{ padding: 18 }}>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-[10px]">
                    {[
                      ["Production YTD", "482,940 MT", "+12.4%"],
                      ["Import dependence", "59%", "-2pt"],
                      ["Farmers registered", "38,214", "+1,840"],
                      ["Avg loss", "14.2%", "-0.6pt"],
                    ].map(([k, v, d]) => (
                      <div key={k} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                        <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--muted)" }}>{k}</div>
                        <div style={{ fontFamily: "var(--ff-d)", fontSize: 24, color: "var(--forest)", marginTop: 4 }}>{v}</div>
                        <div style={{ fontSize: 12, color: "var(--forest-brt)" }}>{d}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_.8fr] gap-[10px] mt-[10px]">
                    <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--dark)", marginBottom: 10 }}>
                        Production by county
                      </div>
                      {[
                        ["Lofa", "18,420", 86],
                        ["Bong", "15,630", 74],
                        ["Nimba", "14,180", 68],
                        ["Grand Bassa", "9,420", 50],
                      ].map(([county, val, width]) => (
                        <div key={county} style={{ display: "grid", gridTemplateColumns: "92px 1fr 74px", gap: 8, marginBottom: 7 }}>
                          <div style={{ fontSize: 12, color: "var(--mid)" }}>{county}</div>
                          <div style={{ height: 8, background: "var(--cream)", borderRadius: 999 }}>
                            <div style={{ width: `${width}%`, height: "100%", borderRadius: 999, background: "var(--amber)" }} />
                          </div>
                          <div style={{ textAlign: "right", fontSize: 12, color: "var(--muted)" }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--dark)", marginBottom: 10 }}>Loss alerts</div>
                      {[
                        ["Lofa", "drying delay", "14.2%"],
                        ["Bomi", "storage moisture", "11.8%"],
                        ["Montserrado", "transport gap", "9.4%"],
                      ].map(([county, issue, pct]) => (
                        <div key={county} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 12, color: "var(--dark)", fontWeight: 500 }}>{county}</div>
                            <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--muted)" }}>{issue}</div>
                          </div>
                          <div style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--forest-brt)" }}>{pct}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
              <Card
                title="County maps"
                detail="Interactive geospatial view with production, loss hotspots, and infrastructure layers."
              />
              <Card
                title="Reports & exports"
                detail="Cabinet-ready PDFs, donor dashboards, and structured exports for USAID/World Bank."
              />
              <Card
                title="Workflows"
                detail="Field registration → approvals → discrepancy resolution → compliance trace."
              />
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function Card({ title, detail }: { title: string; detail: string }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "#fff", padding: 18 }}>
      <div style={{ fontFamily: "var(--ff-d)", fontSize: 22, color: "var(--forest)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: "var(--mid)", fontWeight: 300, lineHeight: 1.6 }}>{detail}</div>
    </div>
  );
}

