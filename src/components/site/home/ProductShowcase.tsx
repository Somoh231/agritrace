"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";

import { ArrowRight } from "@/components/site/icons";
import { ImageFrame, type Scene } from "@/components/site/ImageFrame";
import { PRODUCTS } from "@/lib/site/content";

const SCENE_FOR: Record<string, Scene> = {
  "operations-platform": "cooperative-store",
  "farmer-registry": "cooperative-store",
  "gis-boundary": "field-boundary",
  "warehouse-traceability": "warehouse",
  "reporting-intelligence": "operations-room",
  "offline-field": "aerial-fields",
};

/** Products as an accessible vertical tab list (WAI-ARIA tabs, automatic activation). */
export default function ProductShowcase() {
  // Fade only on user-initiated changes, never on first paint.
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
  };

  return (
    <section aria-labelledby="products-title" className="avs-surface-paper avs-section">
      <div className="avs-container">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="avs-label avs-eyebrow avs-reveal">Products we deploy</p>
            <h2 id="products-title" className="avs-h1 avs-reveal mt-6 max-w-[15ch]">
              Products, deployed inside the <span className="avs-accent">work</span>.
            </h2>
          </div>
          <p className="avs-body avs-reveal lg:col-span-4">
            We build our own systems and configure them to each programme, geography and institutional structure.
          </p>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-12">
          <div role="tablist" aria-orientation="vertical" aria-label="Products" className="flex flex-col lg:col-span-4">
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
                  className={`group grid min-h-[76px] grid-cols-[2.75rem_1fr_auto] items-center gap-x-3 border-b px-3 py-4 text-left transition-colors duration-300 ${
                    on
                      ? "border-transparent bg-[rgb(var(--av-forest))] text-[rgb(var(--av-paper))]"
                      : "border-[rgb(var(--av-line)/0.14)] text-[rgb(var(--av-forest))] hover:bg-[rgb(var(--av-sand))]"
                  }`}
                >
                  <span className={`avs-meta ${on ? "text-white/70" : "text-[rgb(var(--av-slate))]"}`}>{pr.code}</span>
                  <span>
                    <span className="block text-[1.125rem] font-medium leading-tight tracking-[-0.01em]">{pr.name}</span>
                    <span className={`avs-meta mt-1 block uppercase tracking-[0.1em] ${on ? "text-white/70" : "text-[rgb(var(--av-slate))]"}`}>
                      {pr.practices.length > 1 ? "Practices" : "Practice"} {pr.practices.join(" · ")}
                    </span>
                  </span>
                  <ArrowRight className={`transition-transform duration-300 ${on ? "translate-x-0.5" : "opacity-50 group-hover:translate-x-0.5"}`} />
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`${base}-panel`}
            aria-labelledby={`${base}-tab-${active}`}
            tabIndex={0}
            className="relative overflow-hidden rounded-[var(--av-radius-lg)] bg-[rgb(var(--av-forest))] lg:col-span-8"
          >
            <ImageFrame key={p.id} scene={SCENE_FOR[p.id]} alt="" ratio="auto" className={`${changed ? "avs-fade-in" : ""} absolute inset-0 h-full w-full`} overlay={false} />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(11,46,26,0.05) 0%, rgba(11,46,26,0.35) 45%, rgba(9,26,17,0.94) 100%)" }}
            />
            <div className="relative grid min-h-[620px] content-between gap-10 p-6 sm:p-8 lg:min-h-[680px] lg:p-11">
              {/* Illustrative record lineage */}
              <div key={`lin-${p.id}`} className={`${changed ? "avs-fade-in" : ""} w-full max-w-[21rem] justify-self-end rounded-[16px] bg-[rgb(var(--av-paper)/0.96)] p-4 text-[rgb(var(--av-forest))] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)] backdrop-blur`}>
                <div className="flex items-center justify-between border-b border-[rgb(var(--av-line)/0.12)] pb-2.5">
                  <p className="avs-label text-[0.6875rem] text-[rgb(var(--av-slate))]">Record lineage</p>
                  <p className="avs-sample">Sample</p>
                </div>
                <ol className="mt-1">
                  {p.lineage.map((l) => (
                    <li key={l.step} className="flex items-center gap-3 border-b border-[rgb(var(--av-line)/0.08)] py-2.5 last:border-0">
                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          l.status === "pending" ? "border border-[rgb(var(--av-slate)/0.5)]" : "bg-[rgb(var(--av-emerald))]"
                        } ${l.status === "current" ? "ring-4 ring-[rgb(var(--av-emerald)/0.18)]" : ""}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.9375rem] font-medium leading-tight">{l.step}</span>
                        <span className="avs-meta block text-[rgb(var(--av-slate))]">{l.actor}</span>
                      </span>
                      <span
                        className={`avs-meta shrink-0 uppercase tracking-[0.08em] ${
                          l.status === "pending" ? "text-[rgb(var(--av-slate))]" : "text-[rgb(var(--av-emerald-ink))]"
                        }`}
                      >
                        {l.label}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div key={`copy-${p.id}`} className={`avs-on-dark ${changed ? "avs-fade-in" : ""} text-[rgb(var(--av-paper))]`}>
                <p className="avs-label text-[rgb(var(--av-gold))]">{active === 0 ? "Flagship product" : `Product ${p.code}`}</p>
                <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-[36rem]">
                    <h3 className="avs-h2 text-[clamp(2rem,3.4vw,3.25rem)]">{p.name}</h3>
                    <p className="mt-4 text-[1.0625rem] leading-relaxed text-white/80">{p.line}</p>
                  </div>
                  <Link href={`/products#${p.id}`} className="avs-btn avs-btn-primary shrink-0 self-start md:self-auto">
                    View product <ArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
