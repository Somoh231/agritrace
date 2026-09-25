import type { Metadata } from "next";
import Link from "next/link";

import { Check } from "@/components/site/icons";
import { ImageFrame, type Scene } from "@/components/site/ImageFrame";
import { CtaBand } from "@/components/site/page/CtaBand";
import { PageHero } from "@/components/site/page/PageHero";
import { SectionIndex } from "@/components/site/page/SectionIndex";
import { PRACTICES, PRODUCTS } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "What we do",
  description:
    "Six practices — agricultural systems, field operations, GIS, supply chain, reporting and programme implementation — each defined by the institutional outcome it produces.",
  alternates: { canonical: "/what-we-do" },
};

const SCENE: Record<string, Scene> = {
  systems: "operations-room",
  field: "cooperative-store",
  gis: "field-boundary",
  supply: "warehouse",
  reporting: "operations-room",
  programmes: "aerial-fields",
};

const productName = (id: string) => PRODUCTS.find((p) => p.id === id)?.name ?? id;

export default function WhatWeDoPage() {
  return (
    <>
      <PageHero
        eyebrow="What we do"
        title={
          <>
            Six practices, each defined by the <span className="avs-accent">outcome</span> it produces.
          </>
        }
        lead={
          <p>
            We work across the systems, field operations and reporting an agricultural institution depends on. Each
            practice can stand alone; most programmes combine several, delivered by one accountable team.
          </p>
        }
      />

      <section aria-label="Practices" className="avs-surface-paper avs-section">
        <div className="avs-container grid gap-12 lg:grid-cols-12">
          <div className="hidden lg:col-span-3 lg:block">
            <SectionIndex items={PRACTICES.map((p) => ({ id: p.id, n: p.n, label: p.title.split(" & ")[0] }))} label="Practices" />
          </div>

          <div className="lg:col-span-9">
            {PRACTICES.map((p, i) => (
              <article
                key={p.id}
                id={p.id}
                aria-labelledby={`${p.id}-title`}
                className={`scroll-mt-[calc(var(--av-header-h)+24px)] ${i > 0 ? "mt-20 border-t border-[rgb(var(--av-line)/0.14)] pt-20 md:mt-28 md:pt-28" : ""}`}
              >
                <p className="avs-meta avs-reveal text-[rgb(var(--av-emerald-ink))]">Practice {p.n}</p>
                <h2 id={`${p.id}-title`} className="avs-h2 avs-reveal mt-4 max-w-[20ch]">
                  {p.title}
                </h2>
                <p className="avs-lead avs-reveal mt-6 max-w-[42rem]">{p.short}</p>

                <ImageFrame scene={SCENE[p.id]} alt="" ratio="21 / 9" className="avs-reveal mt-10 rounded-[var(--av-radius)]">
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                    <p className="avs-label text-[rgb(var(--av-gold))]">Institutional outcome</p>
                    <p className="avs-editorial mt-2 max-w-[28ch] text-[rgb(var(--av-paper))]">{p.outcome}</p>
                  </div>
                </ImageFrame>

                <div className="mt-10 grid gap-10 md:grid-cols-2">
                  <div className="avs-reveal">
                    <h3 className="avs-label text-[rgb(var(--av-slate))]">Scope</h3>
                    <ul className="mt-4">
                      {p.scope.map((s) => (
                        <li key={s} className="flex items-start gap-3 border-t border-[rgb(var(--av-line)/0.12)] py-3 text-[1.0625rem]">
                          <Check className="mt-1 h-4 w-4 shrink-0 text-[rgb(var(--av-emerald-ink))]" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="avs-reveal">
                    <h3 className="avs-label text-[rgb(var(--av-slate))]">What the institution receives</h3>
                    <p className="mt-4 border-t border-[rgb(var(--av-line)/0.12)] pt-4 text-[1.0625rem] leading-relaxed">{p.delivers}</p>
                    <h3 className="avs-label mt-8 text-[rgb(var(--av-slate))]">Products used</h3>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {p.products.map((id) => (
                        <li key={id}>
                          <Link
                            href={`/products#${id}`}
                            className="inline-flex min-h-[40px] items-center rounded-full border border-[rgb(var(--av-line)/0.2)] px-4 text-[0.9375rem] transition-colors hover:border-[rgb(var(--av-emerald-ink))] hover:text-[rgb(var(--av-emerald-ink))]"
                          >
                            {productName(id)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Most programmes combine several practices."
        body="We scope the combination with you during diagnosis, before any system is chosen."
        secondary={{ label: "How we work", href: "/how-we-work" }}
      />
    </>
  );
}
