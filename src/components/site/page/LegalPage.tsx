import Link from "next/link";

import { PageHero } from "@/components/site/page/PageHero";
import { SectionIndex } from "@/components/site/page/SectionIndex";
import { CONTACT_EMAIL } from "@/lib/site/content";
import { LEGAL_DRAFT, type LegalDocument } from "@/lib/site/legal";

/**
 * Layout for /privacy and /terms. Sections without approved copy render a
 * clearly marked placeholder; nothing on the page makes a legal commitment
 * until counsel's text is inserted in src/lib/site/legal.ts.
 */
export function LegalPage({ doc, related }: { doc: LegalDocument; related: { label: string; href: string } }) {
  return (
    <>
      <PageHero eyebrow="Legal" title={doc.title} lead={<p>{doc.summary}</p>} />

      {LEGAL_DRAFT ? (
        <section aria-labelledby="legal-status" className="avs-surface-paper pt-12 md:pt-16">
          <div className="avs-container">
            <div
              role="note"
              className="grid gap-3 rounded-[var(--av-radius)] border border-[rgb(var(--av-gold-ink)/0.4)] bg-[rgb(var(--av-gold)/0.1)] p-6 md:grid-cols-12 md:items-center md:p-8"
            >
              <h2 id="legal-status" className="avs-label text-[rgb(var(--av-gold-deep))] md:col-span-3">
                Draft — not yet in effect
              </h2>
              <p className="text-[1.0625rem] leading-relaxed md:col-span-9">
                This page shows the structure of the {doc.title.toLowerCase()} only. The wording is being prepared and
                reviewed by counsel; until it is published here, no section below states a commitment. Questions in the
                meantime:{" "}
                <a className="avs-link text-[rgb(var(--av-forest))]" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section aria-label={doc.title} className="avs-surface-paper avs-section">
        <div className="avs-container grid gap-12 lg:grid-cols-12">
          <div className="hidden lg:col-span-3 lg:block">
            <SectionIndex
              label="Sections"
              items={doc.sections.map((s, i) => ({ id: s.id, n: String(i + 1).padStart(2, "0"), label: s.title }))}
            />
          </div>

          <div className="lg:col-span-8 lg:col-start-5">
            <dl className="avs-meta flex flex-wrap gap-x-8 gap-y-2 border-b border-[rgb(var(--av-line)/0.14)] pb-6 text-[rgb(var(--av-slate))]">
              <div className="flex gap-2">
                <dt className="uppercase tracking-[0.1em]">Status</dt>
                <dd>{LEGAL_DRAFT ? "Draft — legal text pending" : "Published"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="uppercase tracking-[0.1em]">Effective date</dt>
                <dd>{LEGAL_DRAFT ? "Not yet set" : "[set on publication]"}</dd>
              </div>
            </dl>

            {doc.sections.map((s, i) => (
              <article
                key={s.id}
                id={s.id}
                aria-labelledby={`${s.id}-title`}
                className="scroll-mt-[calc(var(--av-header-h)+24px)] border-b border-[rgb(var(--av-line)/0.1)] py-10"
              >
                <h2 id={`${s.id}-title`} className="avs-h3 flex gap-4">
                  <span className="avs-meta pt-2 text-[rgb(var(--av-emerald-ink))]">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                {s.body.length ? (
                  <div className="avs-body mt-4 space-y-4 text-[1.0625rem] leading-relaxed">
                    {s.body.map((para, j) => (
                      <p key={j}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[14px] border border-dashed border-[rgb(var(--av-line)/0.35)] bg-[rgb(var(--av-sand)/0.6)] p-5">
                    <p className="avs-label text-[0.6875rem] text-[rgb(var(--av-slate))]">Legal text pending — counsel review</p>
                    <p className="avs-body mt-2 text-[0.9375rem]">
                      Counsel-approved text for &ldquo;{s.title}&rdquo; will appear here.
                    </p>
                  </div>
                )}
              </article>
            ))}

            <p className="avs-body mt-10 flex flex-wrap items-center gap-x-2 text-[0.9375rem]">
              See also:
              <Link href={related.href} className="avs-link inline-flex min-h-[44px] items-center text-[rgb(var(--av-forest))]">
                {related.label}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
