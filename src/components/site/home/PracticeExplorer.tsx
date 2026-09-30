"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";

import { PracticeDiagram } from "@/components/site/home/PracticeDiagram";
import { ArrowRight, Chevron } from "@/components/site/icons";
import { PRACTICES, type Practice } from "@/lib/site/content";

/**
 * 4 · Six practices. Desktop (lg+): WAI-ARIA tabs with the practice diagram
 * beside them. Below lg: an accordion, one practice open at a time, so the
 * phone layout reads as a list of practices rather than a squeezed tab rail.
 */
export default function PracticeExplorer() {
  const [active, setActive] = useState(0);
  const [openMobile, setOpenMobile] = useState<number | null>(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    let next: number | null = null;
    if (e.key in keys) next = (i + keys[e.key] + PRACTICES.length) % PRACTICES.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = PRACTICES.length - 1;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  const p = PRACTICES[active];

  return (
    <section aria-labelledby="practices-title" data-home-section="practices" className="avs-surface-paper avs-section border-t border-[rgb(var(--av-line)/0.1)]">
      <div className="avs-container">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="avs-label avs-eyebrow avs-reveal">What we do</p>
            <h2 id="practices-title" className="avs-h-section avs-reveal mt-5 max-w-[16ch]">
              Six practices, one operational record.
            </h2>
          </div>
          <p className="avs-body avs-reveal text-[1.0625rem] leading-relaxed lg:col-span-5">
            Each practice is defined by what it changes for the institution. Most programmes combine several, and each
            can draw on the products we build.
          </p>
        </div>

        {/* Desktop: tabs */}
        <div className="mt-14 hidden gap-10 lg:grid lg:grid-cols-12">
          <div role="tablist" aria-orientation="vertical" aria-label="Practices" className="flex flex-col border-t border-[rgb(var(--av-forest))] lg:col-span-5">
            {PRACTICES.map((pr, i) => {
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
                  className={`group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-3 border-b border-[rgb(var(--av-line)/0.12)] py-4 text-left transition-colors duration-150 ${
                    on ? "text-[rgb(var(--av-forest))]" : "text-[rgb(var(--av-slate))] hover:text-[rgb(var(--av-forest))]"
                  }`}
                >
                  <span className={`avs-meta ${on ? "text-[rgb(var(--av-emerald-ink))]" : ""}`}>{pr.n}</span>
                  <span className={`text-[1.0625rem] leading-snug ${on ? "font-semibold" : "font-medium"}`}>{pr.title}</span>
                  <ArrowRight className={`h-4 w-4 self-center transition-opacity duration-150 ${on ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`} />
                </button>
              );
            })}
          </div>
          <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${active}`} tabIndex={0} className="lg:col-span-7">
            <PracticeBody practice={p} />
          </div>
        </div>

        {/* Below lg: accordion */}
        <ul className="mt-10 border-t border-[rgb(var(--av-forest))] lg:hidden">
          {PRACTICES.map((pr, i) => {
            const open = openMobile === i;
            const panelId = `${base}-acc-${i}`;
            return (
              <li key={pr.id} className="border-b border-[rgb(var(--av-line)/0.12)]">
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenMobile(open ? null : i)}
                    className="grid w-full grid-cols-[2.25rem_1fr_auto] items-baseline gap-x-3 py-4 text-left"
                  >
                    <span className="avs-meta text-[rgb(var(--av-emerald-ink))]">{pr.n}</span>
                    <span className="text-[1.0625rem] font-medium leading-snug">{pr.title}</span>
                    <Chevron className={`h-4 w-4 self-center transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                  </button>
                </h3>
                <div id={panelId} hidden={!open} className="pb-6">
                  <PracticeBody practice={pr} compact />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function PracticeBody({ practice: p, compact = false }: { practice: Practice; compact?: boolean }) {
  return (
    <div className={compact ? "grid gap-5" : "grid gap-7"}>
      <div className="rounded-[var(--av-radius)] bg-[rgb(var(--av-linen))] px-4 py-5 sm:px-6">
        <PracticeDiagram id={p.id} className="mx-auto block h-auto max-h-[15rem] w-full" />
      </div>
      <div className={compact ? "grid gap-4" : "grid gap-6 md:grid-cols-2"}>
        <div>
          <p className="avs-label text-[rgb(var(--av-gold-ink))]">What changes</p>
          <p className="mt-2 text-[1.0625rem] leading-relaxed">{p.outcome}</p>
        </div>
        <div>
          <p className="avs-label text-[rgb(var(--av-gold-ink))]">Scope</p>
          <ul className="mt-2 grid gap-1 text-[0.9375rem] text-[rgb(var(--av-slate))]">
            {p.scope.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
      <Link href={`/what-we-do#${p.id}`} aria-label={`More on this practice: ${p.title}`} className="avs-arrow-link">
        More on this practice <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
