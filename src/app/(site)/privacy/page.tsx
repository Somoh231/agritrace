import type { Metadata } from "next";

import { LegalPage } from "@/components/site/page/LegalPage";
import { LEGAL_DRAFT, PRIVACY } from "@/lib/site/legal";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: PRIVACY.summary,
  alternates: { canonical: "/privacy" },
  // Draft structure only: keep out of search results until counsel-approved text is published.
  robots: LEGAL_DRAFT ? { index: false, follow: true } : undefined,
};

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} related={{ label: "Terms of use", href: "/terms" }} />;
}
