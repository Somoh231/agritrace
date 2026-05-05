import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";

export const metadata: Metadata = {
  title: "About — AgriVault Data",
  description:
    "About AgriVault Data, founder background, and the mission to deliver verified agricultural data infrastructure for African institutions.",
};

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="page agrivault-html-main flex-1">
        <section style={{ padding: "64px 0 48px", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <span className="section-tag">About AgriVault Data</span>
            <h1 className="section-h" style={{ maxWidth: 700 }}>
              Built by someone who knows what broken agricultural data costs.
            </h1>
            <p style={{ fontSize: 19, fontWeight: 300, color: "var(--mid)", maxWidth: 680, lineHeight: 1.7 }}>
              AgriVault Data was founded by Mohammed Donzo Soumaoro — Liberian-born, with direct experience of what
              happens when agricultural institutions operate without verified data.
            </p>
          </div>
        </section>

        <section style={{ padding: "56px 0" }}>
          <div className="container grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
            <article>
              <p style={bodyP}>
                As a Program Officer at the Ministry of Health in Monrovia, he sat in eighteen inter-ministerial
                meetings where decisions affecting millions of people were made on estimates and fragmented district
                records. He built AgriVault Data to fix that — starting with the agricultural sector, where the data
                gap is most consequential and least served.
              </p>
              <p style={bodyP}>
                The platform is purpose-built for frontier agricultural markets — designed for the field conditions that
                most software ignores, structured for the governance requirements that most startups don&apos;t understand,
                and priced for the partnerships that actually move at government speed.
              </p>
              <p style={{ ...bodyP, marginBottom: 40 }}>
                AgriVault Data is not a compliance product that happens to work in Africa. It is African agricultural
                infrastructure that happens to satisfy any compliance requirement in any market — because it starts from
                what farmers, governments, and buyers all actually need: a single verified record they can trust.
              </p>
              <FounderCard />
            </article>

            <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <BioCard
                title="Government & Policy"
                body="Former Program Officer, Ministry of Health, Monrovia. Co-led four national health programs across Liberia. Served on 18 inter-ministerial meetings and three national technical committees. Former student leader in Liberia."
              />
              <BioCard
                title="Education & Research"
                body="MS Social Policy & Data Analytics, University of Pennsylvania. BA International Business & Trade, African Leadership University, Kigali. Wharton Startup Challenge semifinalist. Princess Diana Award winner."
              />
              <BioCard
                title="Operations & Management"
                body="Member Experience & Program Coordinator, BioForward Wisconsin — managed a $30M purchasing consortium delivering $5M in annual savings across 230 pharmaceutical and medical device organisations."
              />
            </aside>
          </div>
        </section>

        <section style={{ background: "var(--forest)", padding: "56px 0" }}>
          <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 620 }}>
              <p style={{ fontFamily: "var(--ff-d)", fontSize: 22, fontWeight: 500, fontStyle: "italic", color: "rgba(255,255,255,.92)", lineHeight: 1.45, marginBottom: 10 }}>
                The intersection of Liberian institutional experience, data systems expertise, and operational
                management is not a coincidence.
              </p>
              <p style={{ fontSize: 15, color: "rgba(168,221,181,.7)", fontWeight: 300 }}>
                It is why this system can actually be built to work in African field conditions — not just designed to.
              </p>
            </div>
            <Link href="/contact" className="btn-primary" style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", whiteSpace: "nowrap", padding: "12px 22px" }}>
              Request a conversation →
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

const bodyP: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 300,
  color: "var(--mid)",
  lineHeight: 1.7,
  marginBottom: 24,
};

function FounderCard() {
  return (
    <div style={{ padding: 24, background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 10, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 52, height: 52, background: "var(--forest)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-d)", fontSize: 18, fontWeight: 600, color: "white", flexShrink: 0 }}>
        MS
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, color: "var(--forest)", marginBottom: 2 }}>Mohammed Donzo Soumaoro</div>
        <div style={{ fontSize: 13, color: "var(--mid)", fontWeight: 300, marginBottom: 6 }}>Founder & CEO, AgriVault Data</div>
        <a href="mailto:msdonzo@agrivaultdata.com" style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--forest-brt)", textDecoration: "none" }}>
          msdonzo@agrivaultdata.com
        </a>
      </div>
    </div>
  );
}

function BioCard({ title, body }: { title: string; body: string }) {
  return (
    <article style={{ padding: 28, border: "1px solid var(--border)", borderRadius: 12, background: "#fff" }}>
      <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, letterSpacing: ".1em", color: "var(--muted)", textTransform: "uppercase", display: "block", marginBottom: 14 }}>
        {title}
      </span>
      <p style={{ fontSize: 15, color: "var(--mid)", fontWeight: 300, lineHeight: 1.65 }}>{body}</p>
    </article>
  );
}
