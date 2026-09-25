"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ArrowRight } from "@/components/site/icons";
import { ImageFrame, type Scene } from "@/components/site/ImageFrame";
import { PRACTICES } from "@/lib/site/content";

const SCENE_FOR: Record<string, Scene> = {
  systems: "operations-room",
  field: "cooperative-store",
  gis: "field-boundary",
  supply: "warehouse",
  reporting: "operations-room",
  programmes: "aerial-fields",
};

/**
 * Six practices with a sticky "institutional outcome" card (lg+). The active
 * practice follows native scroll (IntersectionObserver on a band through the
 * middle of the viewport) and also follows hover and keyboard focus. Nothing is
 * pinned or hijacked; below lg every outcome is shown inline.
 */
export default function PracticeExplorer() {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    if (!mq.matches || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const p = PRACTICES[active];

  return (
    <section aria-labelledby="practices-title" className="avs-surface-paper avs-section pt-0">
      <div className="avs-container">
        <hr className="avs-rule" style={{ borderColor: "rgb(var(--av-forest))" }} />
        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="practices-title" className="avs-h1 avs-reveal">
            What we <span className="avs-accent">do</span>
          </h2>
          <p className="avs-body avs-reveal max-w-[27rem]">
            Six practices. Each is defined by the institutional outcome it produces, and each can draw on the products
            we build.
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Visual echo of the list; the same outcomes are in the list for assistive tech. */}
          <div aria-hidden="true" className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-[calc(var(--av-header-h)+24px)]">
              <div className="relative overflow-hidden rounded-[var(--av-radius-lg)] bg-[rgb(var(--av-navy))]">
                {PRACTICES.map((pr, i) => (
                  <div
                    key={pr.id}
                    aria-hidden="true"
                    className="transition-opacity duration-700"
                    style={{ opacity: i === active ? 1 : 0, position: i === 0 ? "relative" : "absolute", inset: 0 }}
                  >
                    <ImageFrame scene={SCENE_FOR[pr.id]} alt="" ratio="4 / 5" className="h-full w-full" />
                  </div>
                ))}
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg, rgba(7,21,45,0.25) 0%, rgba(7,21,45,0.1) 40%, rgba(7,21,45,0.92) 100%)" }}
                />
                <div className="absolute inset-0 flex flex-col justify-between p-7 text-[rgb(var(--av-paper))]">
                  <p className="avs-meta self-start rounded-[4px] bg-[rgba(7,21,45,0.6)] px-2.5 py-1.5 uppercase tracking-[0.12em]">
                    Practice {p.n} / 06
                  </p>
                  <div>
                    <p className="avs-label text-[rgb(var(--av-gold))]">Institutional outcome</p>
                    <p key={p.id} className="avs-editorial avs-fade-in mt-3 max-w-[22ch] text-[rgb(var(--av-paper))]">
                      {p.outcome}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Practice list */}
          <ol className="lg:col-span-7">
            {PRACTICES.map((pr, i) => {
              const on = i === active;
              return (
                <li
                  key={pr.id}
                  ref={(el) => {
                    items.current[i] = el;
                  }}
                  data-index={i}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className={`group relative border-t py-8 transition-colors duration-500 lg:py-10 ${
                    on ? "border-[rgb(var(--av-emerald))]" : "border-[rgb(var(--av-line)/0.14)]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute -top-px left-0 h-0.5 bg-[rgb(var(--av-emerald))] transition-[width] duration-700 ${on ? "w-full" : "w-0"}`}
                  />
                  <div className="grid grid-cols-[3rem_1fr] gap-x-4 sm:grid-cols-[5rem_1fr]">
                    <p className={`avs-meta pt-2 ${on ? "text-[rgb(var(--av-emerald-ink))]" : "text-[rgb(var(--av-slate))]"}`}>{pr.n}</p>
                    <div>
                      <h3
                        className={`text-[clamp(1.5rem,2.5vw,2.25rem)] font-medium leading-[1.1] tracking-[-0.025em] transition-colors duration-500 ${
                          on ? "text-[rgb(var(--av-forest))]" : "text-[rgb(var(--av-forest))] lg:text-[rgb(var(--av-sage))]"
                        }`}
                      >
                        <Link href={`/what-we-do#${pr.id}`} className="after:absolute after:inset-0 after:content-['']">
                          {pr.title}
                        </Link>
                      </h3>
                      <p className="avs-body mt-3 max-w-[36rem]">{pr.short}</p>
                      {/* Outcome inline below lg; at lg+ the sticky card shows it visually. */}
                      <div className="mt-5 rounded-[14px] bg-[rgb(var(--av-navy))] p-5 text-[rgb(var(--av-paper))] lg:sr-only">
                        <p className="avs-label text-[rgb(var(--av-gold))]">Institutional outcome</p>
                        <p className="avs-serif mt-2 text-[1.25rem] leading-snug">{pr.outcome}</p>
                      </div>
                      <p
                        aria-hidden="true"
                        className={`avs-arrow-link mt-5 text-[0.9375rem] transition-opacity duration-500 ${on ? "lg:opacity-100" : "lg:opacity-0"}`}
                      >
                        Explore the practice <ArrowRight />
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
