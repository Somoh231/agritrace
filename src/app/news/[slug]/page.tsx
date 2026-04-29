import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PublicFooter from "@/components/agrivault/site/PublicFooter";
import PublicNav from "@/components/agrivault/site/PublicNav";
import { NEWS_ARTICLES, getArticleBySlug } from "@/content/news/articles";

type Props = {
  params: { slug: string };
};

export function generateStaticParams() {
  return NEWS_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};
  return {
    title: `${article.title} — AgriVault Data`,
    description: article.excerpt,
  };
}

export default function ArticlePage({ params }: Props) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="page agrivault-html-main flex-1">
        <article style={{ padding: "84px 0" }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <div className="font-mono text-[11px] text-[var(--muted)]">
              {article.category} · {article.publishedAt} · {article.author}
            </div>
            <h1 style={{ marginTop: 12, fontFamily: "var(--ff-d)", fontSize: "clamp(34px,5vw,56px)", color: "var(--forest)", lineHeight: 1.08 }}>
              {article.title}
            </h1>
            <p style={{ marginTop: 16, color: "var(--mid)", fontSize: 18, lineHeight: 1.7 }}>{article.excerpt}</p>
            <div style={{ marginTop: 28, display: "grid", gap: 14 }}>
              {article.body.map((paragraph) => (
                <p key={paragraph} style={{ fontSize: 17, lineHeight: 1.8, color: "var(--dark)" }}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}

