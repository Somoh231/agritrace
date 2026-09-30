"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";

import { ArrowRight } from "@/components/site/icons";
import { SampleLabel, StatusChip, TabletFrame } from "@/components/site/render/SystemRenders";
import { PRODUCTS } from "@/lib/site/content";

/**
 * 5 · Products / platform. WAI-ARIA tabs (automatic activation) at every
 * width: a horizontal, self-scrolling row on phones, a vertical list on lg+.
 * The panel shows the product's record lineage as a coded render (sample
 * data) inside a tablet frame, with its capabilities as plain text beside it.
 */
export default function ProductShowcase() {
  const [changed, setChanged] = useState(false);
  const [active, setActiveRaw] = useState(0);
  const setActive = (i: number) => {
    setChanged(true);
    setActiveRaw(i);
  };
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();
  const p = PRODUCTS[active];

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    let next: number | null = null;
    if (e.key in keys) next = (i + keys[e.key] + PRODUCTS.length) % PRODUCTS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = PRODUCTS.length - 1;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
    tabs.current[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  return (
    <section aria-labelledby="products-title" data-home-section="products" className="avs-surface-paper avs-section border-t border-[rgb(var(--av-line)/0.1)]">
      <div className="avs-container">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="avs-label avs-eyebrow avs-reveal">Products and platform</p>
            <h2 id="products-title" className="avs-h-section avs-reveal mt-5 max-w-[17ch]">
              Six products on one operational record.
            </h2>
          </div>
          <p className="avs-body avs-reveal text-[1.0625rem] leading-relaxed lg:col-span-5">
            We build our own products and configure them for each programme. Institutions retain ownership and control
            of their operational data.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:mt-14 lg:grid-cols-12 lg:gap-10">
          <div className="avs-no-scrollbar min-w-0 max-w-full overflow-x-auto pb-1 lg:col-span-4 lg:overflow-visible lg:pb-0">
            <div role="tablist" aria-label="Products" className="flex w-max gap-2 lg:w-auto lg:flex-col lg:gap-0 lg:border-t lg:border-[rgb(var(--av-forest))]">
              {PRODUCTS.map((pr, i) => {
                const on = i === active;
                return (
                  <button
                    key={pr.id}
                    ref={(el) => {
                      tabs.current[i] = el;
                    }}
                    role="tab"
                    id={`${base}-tab-${i}`}
                    aria-selected={on}
                    aria-controls={`${base}-panel`}
                    tabIndex={on ? 0 : -1}
                    onClick={() => setActive(i)}
                    onKeyDown={(e) => onKey(e, i)}
                    className={`flex min-h-[44px] shrink-0 items-center gap-3 rounded-[var(--av-radius-sm)] border px-3.5 py-2 text-left transition-colors duration-150 lg:rounded-none lg:border-0 lg:border-b lg:px-0 lg:py-4 ${
                      on
                        ? "border-[rgb(var(--av-forest))] bg-[rgb(var(--av-forest))] text-[rgb(var(--av-paper))] lg:border-[rgb(var(--av-line)/0.12)] lg:bg-transparent lg:text-[rgb(var(--av-forest))]"
                        : "border-[rgb(var(--av-line)/0.18)] text-[rgb(var(--av-slate))] hover:text-[rgb(var(--av-forest))] lg:border-[rgb(var(--av-line)/0.12)]"
                    }`}
                  >
                    <span className={`avs-meta hidden lg:inline ${on ? "text-[rgb(var(--av-emerald-ink))]" : ""}`}>{pr.code}</span>
                    <span className={`whitespace-nowrap text-[0.9375rem] lg:whitespace-normal lg:text-[1.0625rem] ${on ? "font-semibold" : "font-medium"}`}>{pr.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            role="tabpanel"
            id={`${base}-panel`}
            aria-labelledby={`${base}-tab-${active}`}
            tabIndex={0}
            className="grid min-w-0 grid-cols-1 gap-8 lg:col-span-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
          >
            <div key={`r-${p.id}`} className={`min-w-0 ${changed ? "avs-fade-in" : ""}`}>
              <TabletFrame>
                <div aria-hidden="true" className="grid min-w-0 grid-cols-1 gap-3 p-3 text-[rgb(var(--av-forest))] sm:p-5">
                  <div className="flex min-w-0 items-center justify-between gap-3 border-b border-[rgb(var(--av-line)/0.1)] pb-3">
                    <span className="min-w-0">
                      <span className="avs-meta block text-[0.625rem] uppercase tracking-[0.08em] text-[rgb(var(--av-slate))]">{p.code} · record lineage</span>
                      <span className="block truncate text-[0.9375rem] font-semibold">{p.name}</span>
                    </span>
                    <span className="avs-meta shrink-0 text-[0.625rem] uppercase tracking-[0.08em] text-[rgb(var(--av-gold-deep))]">Sample data</span>
                  </div>
                  <ol className="grid min-w-0 grid-cols-1 gap-2">
                    {p.lineage.map((l) => (
                      <li key={l.step} className="flex min-w-0 items-center gap-3 rounded-[6px] border border-[rgb(var(--av-line)/0.1)] bg-white px-3 py-2.5">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
                            l.status === "done"
                              ? "border-[rgb(var(--av-emerald-ink))] bg-[rgb(var(--av-emerald-ink))]"
                              : l.status === "current"
                                ? "border-[rgb(var(--av-gold-ink))] bg-white"
                                : "border-[rgb(var(--av-line)/0.3)] bg-white"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[0.8125rem] font-medium leading-tight">{l.step}</span>
                          <span className="avs-meta block truncate text-[0.6875rem] text-[rgb(var(--av-slate))]">{l.actor}</span>
                        </span>
                        <StatusChip state={l.status === "done" ? "verified" : l.status === "current" ? "review" : "pending"} label={l.label} />
                      </li>
                    ))}
                  </ol>
                </div>
              </TabletFrame>
              <SampleLabel className="mt-3" />
            </div>

            <div key={`c-${p.id}`} className={`grid min-w-0 content-start gap-5 ${changed ? "avs-fade-in" : ""}`}>
              <div>
                <p className="avs-label text-[rgb(var(--av-gold-ink))]">{active === 0 ? "Flagship product" : `Product ${p.code}`}</p>
                <h3 className="avs-h3 mt-3">{p.name}</h3>
                <p className="avs-body mt-3 leading-relaxed">{p.line}</p>
              </div>
              <ul className="grid gap-2 border-t border-[rgb(var(--av-line)/0.12)] pt-4 text-[0.9375rem]">
                {p.capabilities.map((c) => (
                  <li key={c} className="flex gap-2.5">
                    <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--av-emerald-ink))]" />
                    {c}
                  </li>
                ))}
              </ul>
              <Link href={`/products#${p.id}`} className="avs-arrow-link">
                View {p.name} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
