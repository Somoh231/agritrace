import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";

export const metadata: Metadata = {
  title: "Liberia — AgriVault Data",
  description:
    "Flagship AgriVault deployment in Liberia: pilot counties, implementation timeline, and partnership structure.",
};

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="page agrivault-html-main flex-1">
        <section style={{ padding: "80px 0 60px", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(200,120,10,.1)",
                border: "1px solid rgba(200,120,10,.2)",
                borderRadius: 100,
                padding: "5px 14px",
                fontFamily: "var(--ff-m)",
                fontSize: 11,
                color: "var(--amber)",
                letterSpacing: ".06em",
                marginBottom: 24,
              }}
            >
              <span className="pulse" style={{ width: 6, height: 6, background: "var(--amber)", borderRadius: "50%" }} />
              Implementation commencing · Liberia 2026
            </div>
            <h1 className="section-h" style={{ maxWidth: 680 }}>
              Liberia — the flagship deployment.
            </h1>
            <p style={{ fontSize: 18, fontWeight: 300, color: "var(--mid)", maxWidth: 640, lineHeight: 1.7 }}>
              Selected by the Ministry of Agriculture of the Republic of Liberia following a formal proposal and
              ministerial review. The documentation has been passed to the Ministry&apos;s technical team. Implementation is
              commencing.
            </p>
          </div>
        </section>

        <section style={{ padding: "80px 0" }}>
          <div className="container grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-start">
            <article>
              <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 28, fontWeight: 600, color: "var(--forest)", marginBottom: 20 }}>
                The problem AgriVault Data solves in Liberia
              </h2>
              <p style={{ fontSize: 16, fontWeight: 300, color: "var(--mid)", lineHeight: 1.7, marginBottom: 18 }}>
                Liberia imports 80% of its rice at a cost of approximately $200 million per year. The National
                Agricultural Development Plan sets clear production targets. But the government has never had a
                verified, real-time picture of domestic rice production — county by county, season by season, farmer by
                farmer.
              </p>
              <p style={{ fontSize: 16, fontWeight: 300, color: "var(--mid)", lineHeight: 1.7, marginBottom: 32 }}>
                AgriVault Data gives the Ministry of Agriculture that picture for the first time — built on the existing
                infrastructure of County Agriculture Officers and District Agriculture Officers who are already deployed in
                the field, and cleaned from years of historical data already held at district level.
              </p>
              <h3 style={{ fontFamily: "var(--ff-d)", fontSize: 20, fontWeight: 600, color: "var(--forest)", marginBottom: 16 }}>
                Pilot counties
              </h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
                {["Nimba County", "Bong County", "Lofa County"].map((county) => (
                  <div key={county} style={{ background: "var(--forest)", color: "white", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 500 }}>
                    {county}
                  </div>
                ))}
                <div style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 18px", fontSize: 14 }}>
                  + 12 counties · Year 2
                </div>
              </div>
              <div style={{ padding: 24, background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, letterSpacing: ".1em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>
                  Partnership structure
                </div>
                <p style={{ fontSize: 14, color: "var(--mid)", fontWeight: 300, lineHeight: 1.65 }}>
                  This is an asset-based public-private partnership. AgriVault Data contributes its built technology
                  platform and technical expertise. The Ministry contributes its existing field officers, accumulated
                  data, and institutional authority. No budget line required from the government during the pilot phase.
                </p>
              </div>
            </article>
            <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                ["Target farmer registrations", "80% coverage by month 4", "40K+", "Across 3 counties"],
                ["Pilot structure", "Trial then full pilot", "90 day", "Then 12-month pilot"],
                ["Cost to Ministry during pilot", "Asset-based PPP", "$0", "No budget line required"],
                ["Ready to launch after MOU signing", "Platform built and operational", "30", "Days to operational"],
              ].map(([label, sub, value, foot]) => (
                <MetricCard key={label} label={label} sub={sub} value={value} foot={foot} />
              ))}
              <div style={{ background: "var(--forest)", borderRadius: 10, padding: "22px 24px" }}>
                <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, letterSpacing: ".1em", color: "var(--moss)", textTransform: "uppercase", marginBottom: 12 }}>
                  Phase timeline
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <TimelineRow text="Phase 1 — Rice pilot, 3 counties" year="2026" live />
                  <TimelineRow text="Phase 2 — National rollout, 15 counties" year="2027" />
                  <TimelineRow text="Phase 3 — Commodity expansion" year="2028" />
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section style={{ background: "var(--cream)", borderTop: "1px solid var(--border)", padding: "60px 0" }}>
          <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontFamily: "var(--ff-d)", fontSize: 24, fontWeight: 600, color: "var(--forest)", marginBottom: 8 }}>
                For governments interested in a similar partnership
              </h3>
              <p style={{ fontSize: 15, color: "var(--mid)", fontWeight: 300 }}>
                AgriVault Data is accepting expressions of interest from Ministries of Agriculture across West Africa.
              </p>
            </div>
            <Link href="/government" className="btn-primary" style={{ whiteSpace: "nowrap" }}>
              Explore partnership →
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function MetricCard({ label, sub, value, foot }: { label: string; sub: string; value: string; foot: string }) {
  return (
    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 14, color: "var(--mid)", fontWeight: 300 }}>{label}</div>
        <div style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--ff-d)", fontSize: 26, fontWeight: 700, color: "var(--forest)" }}>{value}</div>
        <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--muted)" }}>{foot}</div>
      </div>
    </div>
  );
}

function TimelineRow({ text, year, live = false }: { text: string; year: string; live?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 14, color: live ? "rgba(255,255,255,.8)" : "rgba(255,255,255,.5)" }}>{text}</span>
      <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: live ? "var(--moss)" : "rgba(255,255,255,.35)" }}>{year}</span>
    </div>
  );
}
