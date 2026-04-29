export type NewsArticle = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  category: "Product" | "Policy" | "Pilot";
  author: string;
  body: string[];
};

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    slug: "pilot-county-visibility-milestone",
    title: "Agrivault reaches live county visibility milestone in Liberia pilot",
    excerpt:
      "Field teams in Nimba, Bong, and Lofa now submit synchronized records into a single operational view for ministry oversight.",
    publishedAt: "2026-04-22",
    category: "Pilot",
    author: "Agrivault Data Team",
    body: [
      "Agrivault has reached a key milestone in its Phase 1 Liberia deployment, with county-level registration and production telemetry now visible in one dashboard.",
      "The rollout improves the speed and quality of weekly reporting for ministry stakeholders, while maintaining auditability for donor and exporter use cases.",
      "Next steps include broader data quality automation and regional expansion planning for additional ECOWAS-aligned deployments.",
    ],
  },
  {
    slug: "compliance-ready-audit-exports",
    title: "Compliance-ready audit exports now available for partner reporting",
    excerpt:
      "New report outputs package farmer records, plot links, and movement trails into regulator-friendly formats for compliance workflows.",
    publishedAt: "2026-04-10",
    category: "Product",
    author: "Product Engineering",
    body: [
      "Teams can now generate packaged audit exports directly from the platform, reducing manual reconciliation and spreadsheet overhead.",
      "Exports include chain-of-custody metadata designed to support government, donor, and cross-border commercial reporting expectations.",
    ],
  },
];

export function getArticleBySlug(slug: string) {
  return NEWS_ARTICLES.find((article) => article.slug === slug) ?? null;
}

