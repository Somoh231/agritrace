import type { Metadata } from "next";
import type { CSSProperties } from "react";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";
import { getPublicContent } from "@/lib/growth/content";

export const metadata: Metadata = {
  title: "Contact — AgriVault Data",
  description:
    "Request a demo or partnership conversation with AgriVault Data. Ministry, donor, exporter, cooperative, and investor briefings.",
};

export default async function Page() {
  const content = await getPublicContent();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="page agrivault-html-main flex-1">
        <section style={{ padding: "80px 0 60px", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <span className="section-tag">Contact</span>
            <h1 className="section-h">Brief us. We&apos;ll bring the numbers.</h1>
            <p style={{ fontSize: 19, fontWeight: 300, color: "var(--mid)", maxWidth: 560, lineHeight: 1.7 }}>
              90-minute walkthrough tailored to your mandate — ministry oversight, donor reporting, commercial
              deployment, or investment thesis. Monrovia or remote.
            </p>
          </div>
        </section>

        <section style={{ padding: "80px 0" }}>
          <div className="container grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-start">
            <article>
              <h2 style={{ fontFamily: "var(--ff-d)", fontSize: 26, fontWeight: 600, color: "var(--forest)", marginBottom: 20 }}>
                Direct contact
              </h2>
              <div style={{ padding: 28, background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 52, height: 52, background: "var(--forest)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-d)", fontSize: 18, fontWeight: 600, color: "white" }}>
                    MS
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 500, color: "var(--forest)" }}>{content.contact.contactName}</div>
                    <div style={{ fontSize: 13, color: "var(--mid)", fontWeight: 300 }}>{content.contact.contactRole}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a href={`mailto:${content.contact.contactEmail}`} style={{ fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--forest-brt)", textDecoration: "none" }}>
                    {content.contact.contactEmail}
                  </a>
                  <span style={{ fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--muted)" }}>{content.contact.contactPhone}</span>
                  <span style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--muted)" }}>
                    {content.contact.contactLocations}
                  </span>
                </div>
              </div>

              <h3 style={{ fontFamily: "var(--ff-d)", fontSize: 20, fontWeight: 600, color: "var(--forest)", marginBottom: 14 }}>
                Who reaches out
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Government Ministries and Agriculture Agencies",
                  "Development Finance Institutions and donors",
                  "Agricultural cooperatives and exporters",
                  "Impact investors and development-focused funds",
                ].map((item) => (
                  <div key={item} style={{ padding: "14px 18px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--mid)", fontWeight: 300 }}>
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <section style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 36 }} aria-labelledby="contact-form-title">
              <h2 id="contact-form-title" style={{ fontFamily: "var(--ff-d)", fontSize: 22, fontWeight: 600, color: "var(--forest)", marginBottom: 8 }}>
                Request a demo or partnership
              </h2>
              <p style={{ fontSize: 14, color: "var(--mid)", fontWeight: 300, marginBottom: 28 }}>We respond within one business day.</p>
              <form action="/request-demo" method="get" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label className="sr-only" htmlFor="full-name">
                  Full name
                </label>
                <input id="full-name" type="text" name="name" placeholder="Full name" style={field} />
                <label className="sr-only" htmlFor="org">
                  Organisation / Ministry
                </label>
                <input id="org" type="text" name="organisation" placeholder="Organisation / Ministry" style={field} />
                <label className="sr-only" htmlFor="email">
                  Email address
                </label>
                <input id="email" type="email" name="email" placeholder="Email address" style={field} />
                <label className="sr-only" htmlFor="persona">
                  Persona
                </label>
                <select id="persona" name="persona" style={field}>
                  <option>I am a...</option>
                  <option>Government Ministry or Agency</option>
                  <option>Development Finance Institution</option>
                  <option>Agricultural Cooperative</option>
                  <option>Commodity Exporter</option>
                  <option>Impact Investor</option>
                  <option>Donor or Grant Organisation</option>
                  <option>Other</option>
                </select>
                <label className="sr-only" htmlFor="country">
                  Country of operation
                </label>
                <select id="country" name="country" style={field}>
                  <option>Country of operation</option>
                  <option>Liberia</option>
                  <option>Sierra Leone</option>
                  <option>Guinea</option>
                  <option>Ghana</option>
                  <option>Côte d&apos;Ivoire</option>
                  <option>Nigeria</option>
                  <option>Other West Africa</option>
                  <option>Other</option>
                </select>
                <label className="sr-only" htmlFor="message">
                  Project details
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Tell us briefly what you are working on (optional)"
                  style={{ ...field, height: 100, resize: "vertical" }}
                />
                <button type="submit" className="btn-primary" style={{ padding: 14, fontSize: 16, justifyContent: "center", width: "100%" }}>
                  Send request →
                </button>
                <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", fontFamily: "var(--ff-m)" }}>
                  No commitment. No card required.
                </p>
              </form>
            </section>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

const field: CSSProperties = {
  background: "#fafaf8",
  border: "1px solid var(--border-mid)",
  borderRadius: 8,
  padding: "12px 16px",
  fontSize: 15,
  fontFamily: "var(--ff-b)",
  color: "var(--dark)",
  outline: "none",
  width: "100%",
  appearance: "none",
};
