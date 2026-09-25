"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { ArrowLeft, ArrowRight } from "@/components/site/icons";
import { Topo } from "@/components/site/Topo";
import { STAGES } from "@/lib/site/content";

/**
 * Six delivery stages as a native horizontal scroller with scroll-snap.
 * Buttons, keyboard and trackpad all move the same scroll position; the
 * progress rail reflects it. No scroll-jacking of the vertical page scroll.
 */
export default function StageProgression() {
  const track = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const x = el.scrollLeft;
    setProgress(max > 0 ? x / max : 1);
    setAtStart(x <= 4);
    setAtEnd(x >= max - 4);
  }, []);

  useEffect(() => {
    sync();
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>("li");
    if (!el || !card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section aria-labelledby="stages-title" className="avs-surface-navy avs-on-dark relative isolate overflow-hidden py-[var(--av-section)]">
      <Topo lines={16} seed={5} stroke="#9AA7B8" opacity={0.06} className="-z-10" />
      <div className="avs-container">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="avs-label avs-eyebrow avs-reveal">How we work</p>
            <h2 id="stages-title" className="avs-h-section avs-reveal mt-6 max-w-[20ch]">
              An implementation partner, from diagnosis to <span className="avs-accent">handover</span>.
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="avs-body avs-reveal">
              Every engagement follows the same six stages. Software arrives in the middle of the process, and the last
              stage exists to leave the institution able to run the system itself.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={atStart}
                aria-label="Previous stage"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 transition-colors hover:border-white/70 disabled:opacity-35"
              >
                <ArrowLeft />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={atEnd}
                aria-label="Next stage"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 transition-colors hover:border-white/70 disabled:opacity-35"
              >
                <ArrowRight />
              </button>
              <div aria-hidden="true" className="relative ml-3 h-px flex-1 bg-white/15">
                <span
                  className="absolute left-0 top-[-0.5px] h-[2px] bg-[rgb(var(--av-emerald))]"
                  style={{ width: `${Math.max(8, progress * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ol
        ref={track}
        tabIndex={0}
        aria-label="Six delivery stages, scroll horizontally"
        className="avs-no-scrollbar mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2"
        style={{ paddingInline: "max(var(--av-gutter), calc((100vw - var(--av-max)) / 2 + var(--av-gutter)))", scrollPaddingInline: "max(var(--av-gutter), calc((100vw - var(--av-max)) / 2 + var(--av-gutter)))" }}
      >
        {STAGES.map((s) => (
          <li
            key={s.n}
            className="flex w-[min(84vw,27rem)] shrink-0 snap-start flex-col rounded-[var(--av-radius)] border border-white/10 bg-[rgb(var(--av-navy-2))] p-7 lg:w-[29rem]"
          >
            <div className="flex items-start justify-between">
              <p className="avs-serif text-[clamp(3.5rem,6vw,5.5rem)] leading-[0.9] text-[rgb(var(--av-gold))]">
                {s.n}
              </p>
              <span className="avs-chip border-white/25 text-white/80">{s.phase}</span>
            </div>
            <h3 className="avs-h2 mt-16 text-[clamp(1.875rem,2.6vw,2.5rem)]">{s.name}</h3>
            <p className="avs-body mb-7 mt-4">{s.body}</p>
            <div className="mt-auto border-t border-white/10 pt-5">
              <p className="avs-label text-[0.6875rem] text-[rgb(var(--av-gold))]">Output</p>
              <p className="mt-1.5 text-[1rem]">{s.output}</p>
            </div>
          </li>
        ))}
        <li className="flex w-[min(70vw,18rem)] shrink-0 snap-start flex-col justify-end rounded-[var(--av-radius)] border border-dashed border-white/20 p-7">
          <p className="avs-body">The detail of each stage, and what the institution receives.</p>
          <Link href="/how-we-work" className="avs-arrow-link mt-4">
            Our methodology <ArrowRight />
          </Link>
        </li>
      </ol>
    </section>
  );
}
