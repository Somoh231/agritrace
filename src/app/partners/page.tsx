import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";

export const metadata: Metadata = {
  title: "Partners — AgriVault Data",
  description: "Partnership opportunities across ministries, donors, DFIs, cooperatives, exporters, and research institutions.",
};

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="page agrivault-html-main flex-1">
        <section style={{ padding: "80px 0 60px", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <span className="section-tag">Partners</span>
            <h1 className="section-h">Implementation partners who move agriculture forward.</h1>
            <p style={{ fontSize: 18, fontWeight: 300, color: "var(--mid)", maxWidth: 720 }}>
              AgriVault Data collaborates with ministries, development partners, exporters, and technical institutions to
              build trusted agricultural data infrastructure across West Africa.
            </p>
          </div>
        </section>

        <section style={{ padding: "70px 0" }}>
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groups.map((group) => (
                <article key={group.title} style={{ border: "1px solid var(--border)", borderRadius: 12, background: "#fff", padding: 24 }}>
                  <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 24, color: "var(--forest)", marginBottom: 8 }}>{group.title}</h2>
                  <p style={{ fontSize: 14, color: "var(--mid)", fontWeight: 300, lineHeight: 1.65, marginBottom: 14 }}>{group.description}</p>
                  <ul style={{ listStyle: "none", display: "grid", gap: 8 }}>
                    {group.items.map((item) => (
                      <li key={item} style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--ff-m)" }}>
                        • {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={{ background: "var(--cream)", borderTop: "1px solid var(--border)", padding: "60px 0" }}>
          <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 28, color: "var(--forest)", marginBottom: 8 }}>Partner with AgriVault Data</h2>
              <p style={{ fontSize: 15, color: "var(--mid)", fontWeight: 300 }}>
                If you work in food systems, traceability, or ag-finance, we can build a collaboration model tailored to your mandate.
              </p>
            </div>
            <Link href="/contact" className="btn-primary">
              Contact partnership team →
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

const groups = [
  {
    title: "Government",
    description: "Ministries and agencies leading agricultural modernization and food-security operations.",
    items: ["Ministry of Agriculture", "County Agriculture Offices", "National statistics units"],
  },
  {
    title: "Donors & DFIs",
    description: "Institutions that need transparent field verification and defensible impact reporting.",
    items: ["World Bank", "IFAD / FAO", "USAID / FCDO / AfDB"],
  },
  {
    title: "Market actors",
    description: "Cooperatives and exporters requiring document-of-record and compliance-grade workflows.",
    items: ["Cooperative unions", "Commodity exporters", "Aggregation networks"],
  },
  {
    title: "Research",
    description: "Universities and analytics partners supporting production forecasting and risk insights.",
    items: ["Agricultural universities", "Research institutes", "Policy think tanks"],
  },
  {
    title: "Technology",
    description: "Partners integrating maps, remote sensing, and digital extension services into deployment programs.",
    items: ["GIS providers", "Remote sensing tools", "Extension platforms"],
  },
  {
    title: "Capital",
    description: "Investors and blended-finance operators who depend on verified agricultural intelligence.",
    items: ["Impact funds", "Blended finance vehicles", "Commercial lending partners"],
  },
];
