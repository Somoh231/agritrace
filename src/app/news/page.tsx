import type { Metadata } from "next";
import Link from "next/link";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";
import { NEWS_ARTICLES } from "@/content/news/articles";

export const metadata: Metadata = {
  title: "Newsroom — AgriVault Data",
  description: "Latest updates from Agrivault on pilot execution, product delivery, and government data infrastructure.",
};

export default function NewsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="page agrivault-html-main flex-1">
        <section style={{ padding: "80px 0 24px" }}>
          <div className="container">
            <span className="section-tag">Newsroom</span>
            <h1 className="section-h">Updates from the field, platform, and policy desk.</h1>
          </div>
        </section>
        <section style={{ padding: "10px 0 80px" }}>
          <div className="container grid grid-cols-1 md:grid-cols-2 gap-4">
            {NEWS_ARTICLES.map((article) => (
              <Link
                key={article.slug}
                href={`/news/${article.slug}`}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  background: "white",
                  padding: 24,
                  textDecoration: "none",
                }}
              >
                <div className="font-mono text-[11px] text-[var(--muted)]">
                  {article.category} · {article.publishedAt}
                </div>
                <h2 style={{ marginTop: 8, fontFamily: "var(--ff-d)", fontSize: 28, color: "var(--forest)" }}>{article.title}</h2>
                <p style={{ marginTop: 10, color: "var(--mid)", fontSize: 15, lineHeight: 1.7 }}>{article.excerpt}</p>
                <div className="mt-4 font-mono text-[12px] text-[var(--forest-brt)]">Read article →</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

