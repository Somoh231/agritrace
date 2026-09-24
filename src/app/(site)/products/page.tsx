import type { Metadata } from "next";
import Link from "next/link";

import { Check } from "@/components/site/icons";
import { CtaBand } from "@/components/site/page/CtaBand";
import { PageHero } from "@/components/site/page/PageHero";
import { SectionIndex } from "@/components/site/page/SectionIndex";
import { PRACTICES, PRODUCTS, type Product } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "Products",
  description:
    "The AgriVault Operations Platform, Farmer Registry, GIS & Boundary Intelligence, Warehouse & Traceability, Reporting and Offline Field Operations — configured to each programme.",
  alternates: { canonical: "/products" },
};

const practiceFor = (n: string) => PRACTICES.find((p) => p.n === n);

export default function ProductsPage() {
  return (
    <>
      <PageHero
        eyebrow="Products"
        tone="forest"
        title={
          <>
            Systems we build, configured to each <span className="avs-accent">institution</span>.
          </>
        }
        lead={
          <p>
            Six products share one operational record. They are deployed inside a programme — configured to its
            workflows, roles and administrative geography — rather than sold as standalone licences.
          </p>
        }
      />

      <section aria-label="Products" className="avs-surface-paper avs-section">
        <div className="avs-container grid gap-12 lg:grid-cols-12">
          <div className="hidden lg:col-span-3 lg:block">
            <SectionIndex items={PRODUCTS.map((p) => ({ id: p.id, n: p.code, label: p.name.replace("AgriVault ", "") }))} label="Products" />
          </div>
          <div className="lg:col-span-9">
            {PRODUCTS.map((p, i) => (
              <ProductArticle key={p.id} p={p} first={i === 0} />
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="See the products in the context of your programme."
        body="We walk through the workflows that matter to your institution — registration, verification, custody or reporting — rather than a generic demo."
      />
    </>
  );
}

function ProductArticle({ p, first }: { p: Product; first: boolean }) {
  return (
    <article
      id={p.id}
      aria-labelledby={`${p.id}-title`}
      className={`scroll-mt-[calc(var(--av-header-h)+24px)] ${first ? "" : "mt-20 border-t border-[rgb(var(--av-line)/0.14)] pt-20 md:mt-28 md:pt-28"}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="avs-chip avs-reveal text-[rgb(var(--av-emerald-ink))]">{p.code}</span>
        {first ? <span className="avs-label avs-reveal text-[rgb(var(--av-gold-ink))]">Flagship product</span> : null}
      </div>
      <h2 id={`${p.id}-title`} className="avs-h2 avs-reveal mt-5 max-w-[20ch]">
        {p.name}
      </h2>
      <p className="avs-lead avs-reveal mt-6 max-w-[42rem]">{p.line}</p>

      <div className="mt-10 grid gap-4 md:grid-cols-5">
        <div className="avs-surface-navy avs-reveal rounded-[var(--av-radius)] p-6 md:col-span-3 md:p-8">
          <h3 className="avs-label text-[rgb(var(--av-gold))]">The problem it addresses</h3>
          <p className="avs-serif mt-4 text-[1.375rem] leading-[1.4]">{p.problem}</p>
        </div>
        {/* Illustrative record lineage */}
        <div className="avs-reveal rounded-[var(--av-radius)] border border-[rgb(var(--av-line)/0.14)] bg-white p-5 md:col-span-2">
          <div className="flex items-center justify-between border-b border-[rgb(var(--av-line)/0.12)] pb-2.5">
            <h3 className="avs-label text-[0.6875rem] text-[rgb(var(--av-slate))]">Record lineage</h3>
            <p className="avs-sample">Sample</p>
          </div>
          <ol className="mt-1">
            {p.lineage.map((l) => (
              <li key={l.step} className="flex items-center gap-3 border-b border-[rgb(var(--av-line)/0.08)] py-2.5 last:border-0">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${l.status === "pending" ? "border border-[rgb(var(--av-slate)/0.5)]" : "bg-[rgb(var(--av-emerald))]"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] font-medium leading-tight">{l.step}</span>
                  <span className="avs-meta block text-[rgb(var(--av-slate))]">{l.actor}</span>
                </span>
                <span className={`avs-meta shrink-0 uppercase ${l.status === "pending" ? "text-[rgb(var(--av-slate))]" : "text-[rgb(var(--av-emerald-ink))]"}`}>
                  {l.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="avs-reveal mt-10">
        <h3 className="avs-label text-[rgb(var(--av-slate))]">Workflow</h3>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {p.workflow.map((w, i) => (
            <li key={w} className="relative rounded-[14px] bg-[rgb(var(--av-sand))] px-4 py-4">
              <span className="avs-meta text-[rgb(var(--av-slate))]">{String(i + 1).padStart(2, "0")}</span>
              <span className="mt-2 block text-[1.0625rem] font-medium leading-tight">{w}</span>
              {i < p.workflow.length - 1 ? (
                <span aria-hidden="true" className="absolute -right-2 top-1/2 z-10 hidden h-px w-4 bg-[rgb(var(--av-emerald))] lg:block" />
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div className="avs-reveal">
          <h3 className="avs-label text-[rgb(var(--av-slate))]">Capabilities</h3>
          <ul className="mt-4">
            {p.capabilities.map((c) => (
              <li key={c} className="flex items-start gap-3 border-t border-[rgb(var(--av-line)/0.12)] py-3 text-[1.0625rem]">
                <Check className="mt-1 h-4 w-4 shrink-0 text-[rgb(var(--av-emerald-ink))]" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <dl className="avs-reveal grid content-start gap-6">
          <div>
            <dt className="avs-label text-[rgb(var(--av-slate))]">Who uses it</dt>
            <dd className="mt-2 border-t border-[rgb(var(--av-line)/0.12)] pt-3 text-[1.0625rem]">{p.users.join(" · ")}</dd>
          </div>
          <div>
            <dt className="avs-label text-[rgb(var(--av-slate))]">Data in and out</dt>
            <dd className="mt-2 border-t border-[rgb(var(--av-line)/0.12)] pt-3 text-[1.0625rem]">{p.integrations.join(" · ")}</dd>
          </div>
          <div>
            <dt className="avs-label text-[rgb(var(--av-slate))]">Deployment</dt>
            <dd className="mt-2 border-t border-[rgb(var(--av-line)/0.12)] pt-3 text-[1.0625rem]">{p.deployment}</dd>
          </div>
          <div>
            <dt className="avs-label text-[rgb(var(--av-slate))]">Practices</dt>
            <dd className="mt-2 flex flex-wrap gap-2 border-t border-[rgb(var(--av-line)/0.12)] pt-3">
              {p.practices.map((n) => {
                const pr = practiceFor(n);
                return pr ? (
                  <Link key={n} href={`/what-we-do#${pr.id}`} className="avs-link text-[0.9375rem]">
                    {n} · {pr.title}
                  </Link>
                ) : null;
              })}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
