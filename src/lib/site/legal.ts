/**
 * Structure for /privacy and /terms. Each section's `brief` tells counsel what
 * to cover; it is never rendered. Until `body` has approved copy, the page
 * shows a neutral, clearly marked "legal text pending" block. Replace each section's `body` with approved
 * copy and set LEGAL_DRAFT to false to publish (removes the draft notice and
 * the noindex tag). Verified technical facts for counsel:
 * docs/legal/COUNSEL_FACTS.md.
 */
export const LEGAL_DRAFT = true;

export type LegalSection = {
  id: string;
  title: string;
  /** What counsel needs to cover (internal; not rendered). */
  brief: string;
  /** Approved paragraphs. Empty until counsel supplies them. */
  body: string[];
};

export type LegalDocument = {
  slug: "privacy" | "terms";
  title: string;
  summary: string;
  sections: LegalSection[];
};

export const PRIVACY: LegalDocument = {
  slug: "privacy",
  title: "Privacy notice",
  summary: "How AgriVault Data handles personal information on this website and in its services.",
  sections: [
    { id: "who-we-are", title: "Who we are", brief: "Legal entity, registered address and the data controller for this website and for programme data.", body: [] },
    { id: "scope", title: "What this notice covers", brief: "Which websites, services and programmes this notice applies to, and which are covered by a partner institution's own notice.", body: [] },
    { id: "information-we-collect", title: "Information we collect", brief: "Page-view analytics (path including query string), contact by email, sign-in data for programme staff, and programme records — see COUNSEL_FACTS.md.", body: [] },
    { id: "how-we-use-information", title: "How we use information", brief: "Purposes and lawful bases for each category of information.", body: [] },
    { id: "sharing", title: "Sharing and service providers", brief: "Hosting, error monitoring, mapping and other providers, and any sharing with partner institutions.", body: [] },
    { id: "international-transfers", title: "International transfers", brief: "Where information is stored and processed, and the safeguards used.", body: [] },
    { id: "retention", title: "How long we keep information", brief: "Retention periods for each category. None are defined in the code today.", body: [] },
    { id: "security", title: "Security", brief: "A proportionate description of safeguards. Keep it factual; do not claim certifications that have not been obtained.", body: [] },
    { id: "your-rights", title: "Your rights", brief: "Rights available to the people whose information is processed, and how to exercise them.", body: [] },
    { id: "cookies", title: "Cookies and similar technologies", brief: "Sign-in cookies for programme staff, the offline service worker, and any hosting-platform cookies.", body: [] },
    { id: "children", title: "Children", brief: "Whether the services are directed at children.", body: [] },
    { id: "changes", title: "Changes to this notice", brief: "How changes are communicated and the effective date.", body: [] },
    { id: "contact", title: "Contact", brief: "Contact route for privacy questions and requests.", body: [] },
  ],
};

export const TERMS: LegalDocument = {
  slug: "terms",
  title: "Terms of use",
  summary: "The terms that apply to using this website.",
  sections: [
    { id: "about-these-terms", title: "About these terms", brief: "Who the terms are with, what they cover, and how they are accepted.", body: [] },
    { id: "using-the-website", title: "Using the website", brief: "Permitted and prohibited uses of the public website.", body: [] },
    { id: "platform-access", title: "Access to the AgriVault platform", brief: "Platform accounts are issued by partner institutions' administrators; the relationship to engagement agreements.", body: [] },
    { id: "intellectual-property", title: "Intellectual property", brief: "Ownership of site content, the AgriVault name and marks, and third-party content (fonts, map data, partner marks).", body: [] },
    { id: "third-party-content", title: "Third-party content and links", brief: "Map data attribution (UNMIL / OCHA via geoBoundaries, CC BY 3.0 IGO) and links to other sites.", body: [] },
    { id: "information-on-the-site", title: "Information on this website", brief: "Status of descriptive content, including that the Liberia programme is a pilot being validated.", body: [] },
    { id: "disclaimers", title: "Disclaimers", brief: "Counsel-approved disclaimer language only.", body: [] },
    { id: "liability", title: "Limitation of liability", brief: "Counsel-approved liability language only.", body: [] },
    { id: "governing-law", title: "Governing law", brief: "Governing law and forum, to be decided by counsel.", body: [] },
    { id: "changes", title: "Changes to these terms", brief: "How changes are made and communicated.", body: [] },
    { id: "contact", title: "Contact", brief: "Contact route for questions about these terms.", body: [] },
  ],
};
