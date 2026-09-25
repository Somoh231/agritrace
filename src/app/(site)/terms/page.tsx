import type { Metadata } from "next";

import { LegalPage } from "@/components/site/page/LegalPage";
import { LEGAL_DRAFT, TERMS } from "@/lib/site/legal";

export const metadata: Metadata = {
  title: "Terms of use",
  description: TERMS.summary,
  alternates: { canonical: "/terms" },
  // Draft structure only: keep out of search results until counsel-approved text is published.
  robots: LEGAL_DRAFT ? { index: false, follow: true } : undefined,
};

export default function TermsPage() {
  return <LegalPage doc={TERMS} related={{ label: "Privacy notice", href: "/privacy" }} />;
}
