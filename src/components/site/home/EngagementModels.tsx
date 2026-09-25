"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Check } from "@/components/site/icons";
import { ENGAGEMENT_MODELS, STAGES } from "@/lib/site/content";

/** Five engagement models; selecting one shows which of the six stages it covers. */
export default function EngagementModels({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  // Fade only on user-initiated changes, never on first paint.
  const [changed, setChanged] = useState(false);
  const [active, setActiveRaw] = useState(2);
  const setActive = (i: number) => {
    setChanged(true);
    setActiveRaw(i);
  };
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabList = useRef<HTMLDivElement>(null);
  const base = useId();

  // Keep the selected tab visible when the tab row scrolls sideways (phones).
  // Scrolls the row only, never the page.
  useEffect(() => {
    const list = tabList.current;
    const tab = tabs.current[active];
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    const pad = 16;
    const left = tab.offsetLeft - list.offsetLeft;
    if (left < list.scrollLeft + pad || left + tab.offsetWidth > list.scrollLeft + list.clientWidth - pad) {
      list.scrollTo({ left: Math.max(0, left - pad), behavior: changed ? "smooth" : "auto" });
    }
  }, [active, changed]);
  const m = ENGAGEMENT_MODELS[active];
  const Heading = headingLevel === 2 ? "h2" : "h3";

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number | null = null;
    if (e.key in keys) next = (i + keys[e.key] + ENGAGEMENT_MODELS.length) % ENGAGEMENT_MODELS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = ENGAGEMENT_MODELS.length - 1;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <section id="engagement-models" aria-labelledby={`${base}-title`} className="avs-surface-paper avs-section">
      <div className="avs-container">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <Heading id={`${base}-title`} className="avs-h2 avs-reveal lg:col-span-8">
            Engagement <span className="avs-accent">models</span>
          </Heading>
          <p className="avs-body avs-reveal lg:col-span-4">
            Five ways to work with us. Select one to see which delivery stages it covers.
          </p>
        </div>

        <div ref={tabList} role="tablist" aria-label="Engagement models" className="avs-no-scrollbar -mx-[var(--av-gutter)] mt-10 flex gap-2 overflow-x-auto px-[var(--av-gutter)] pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
          {ENGAGEMENT_MODELS.map((em, i) => {
            const on = i === active;
            return (
              <button
                key={em.n}
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
                className={`inline-flex min-h-[48px] shrink-0 items-center gap-2.5 rounded-full border px-5 text-[0.9375rem] font-medium transition-colors duration-200 ${
                  on
                    ? "border-[rgb(var(--av-forest))] bg-[rgb(var(--av-forest))] text-[rgb(var(--av-paper))]"
                    : "border-[rgb(var(--av-line)/0.2)] text-[rgb(var(--av-forest))] hover:border-[rgb(var(--av-line)/0.5)]"
                }`}
              >
                <span className={`avs-meta ${on ? "text-white/70" : "text-[rgb(var(--av-slate))]"}`}>{em.n}</span>
                {em.name}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`${base}-panel`}
          aria-labelledby={`${base}-tab-${active}`}
          className="avs-surface-forest mt-4 grid gap-10 rounded-[var(--av-radius-lg)] p-6 sm:p-10 lg:grid-cols-12 lg:gap-12 lg:p-12"
        >
          <div key={m.n} className={`${changed ? "avs-fade-in" : ""} lg:col-span-5`}>
            <p className="avs-label text-[rgb(var(--av-gold))]">{m.kind}</p>
            <p className="avs-h3 mt-4 text-[clamp(1.625rem,2.4vw,2.25rem)]">{m.name}</p>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-white/80">{m.summary}</p>
            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="avs-label text-[0.6875rem] text-white/60">Suited to</p>
              <p className="avs-serif mt-1.5 text-[1.375rem]">{m.suited}</p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <p className="avs-label text-[0.6875rem] text-white/60" id={`${base}-stages`}>
              Stages covered
            </p>
            <ul aria-labelledby={`${base}-stages`} className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-3">
              {STAGES.map((s) => {
                const inc = m.stages.includes(s.n);
                return (
                  <li
                    key={s.n}
                    className={`flex min-h-[92px] flex-col justify-between gap-4 rounded-[14px] border p-4 transition-colors duration-500 sm:min-h-[104px] ${
                      inc
                        ? "border-[rgb(var(--av-mint)/0.45)] bg-white/[0.06] text-[rgb(var(--av-paper))]"
                        : "border-dashed border-white/15 text-white/55"
                    }`}
                  >
                    <p className="avs-meta flex items-start justify-between gap-2 uppercase tracking-[0.08em]">
                      <span>{s.n}</span>
                      {inc ? (
                        <span className="inline-flex items-center gap-1 text-[rgb(var(--av-mint))]">
                          <Check className="h-3.5 w-3.5" /> <span className="max-sm:sr-only">Included</span>
                        </span>
                      ) : (
                        <span>
                          <span aria-hidden="true" className="sm:hidden">—</span>
                          <span className="max-sm:sr-only">Not included</span>
                        </span>
                      )}
                    </p>
                    <p className="text-[1.0625rem] font-medium leading-tight">{s.name}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
