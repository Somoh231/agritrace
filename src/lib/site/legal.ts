/**
 * Structure for /privacy and /terms. Until a section's `body` holds approved
 * copy, the page shows a neutral, clearly marked "legal text pending" block.
 * Insert counsel-approved paragraphs into `body` and set LEGAL_DRAFT to false
 * to publish (removes the draft notice and the noindex tag).
 */
export const LEGAL_DRAFT = true;

export type LegalSection = {
  id: string;
  title: string;
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
    { id: "who-we-are", title: "Who we are", body: [] },
    { id: "scope", title: "What this notice covers", body: [] },
    { id: "information-we-collect", title: "Information we collect", body: [] },
    { id: "how-we-use-information", title: "How we use information", body: [] },
    { id: "sharing", title: "Sharing and service providers", body: [] },
    { id: "international-transfers", title: "International transfers", body: [] },
    { id: "retention", title: "How long we keep information", body: [] },
    { id: "security", title: "Security", body: [] },
    { id: "your-rights", title: "Your rights", body: [] },
    { id: "cookies", title: "Cookies and similar technologies", body: [] },
    { id: "children", title: "Children", body: [] },
    { id: "changes", title: "Changes to this notice", body: [] },
    { id: "contact", title: "Contact", body: [] },
  ],
};

export const TERMS: LegalDocument = {
  slug: "terms",
  title: "Terms of use",
  summary: "The terms that apply to using this website.",
  sections: [
    { id: "about-these-terms", title: "About these terms", body: [] },
    { id: "using-the-website", title: "Using the website", body: [] },
    { id: "platform-access", title: "Access to the AgriVault platform", body: [] },
    { id: "intellectual-property", title: "Intellectual property", body: [] },
    { id: "third-party-content", title: "Third-party content and links", body: [] },
    { id: "information-on-the-site", title: "Information on this website", body: [] },
    { id: "disclaimers", title: "Disclaimers", body: [] },
    { id: "liability", title: "Limitation of liability", body: [] },
    { id: "governing-law", title: "Governing law", body: [] },
    { id: "changes", title: "Changes to these terms", body: [] },
    { id: "contact", title: "Contact", body: [] },
  ],
};
