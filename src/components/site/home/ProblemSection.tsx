"use client";

import { useState } from "react";

import { Topo } from "@/components/site/Topo";
import { FRAGMENTS } from "@/lib/site/content";

type View = "today" | "with";

/*
 * Fragment layout on the canvas (md+). `at` is the aligned position around the
 * central record; `drift` is the transform applied in the "Today" view so the
 * same cards read as scattered, tilted and unconnected. Transform-only motion.
 */
const LAYOUT = [
  { at: { left: "3%", top: "10%" }, drift: "translate(1%, 14%) rotate(-4deg)", anchor: [27, 20] },
  { at: { left: "3%", top: "40%" }, drift: "translate(24%, -40%) rotate(-2deg)", anchor: [27, 50] },
  { at: { left: "3%", top: "70%" }, drift: "translate(12%, -8%) rotate(3deg)", anchor: [27, 80] },
  { at: { right: "3%", top: "10%" }, drift: "translate(-6%, 12%) rotate(3deg)", anchor: [73, 20] },
  { at: { right: "3%", top: "40%" }, drift: "translate(-2%, 58%) rotate(-3deg)", anchor: [73, 50] },
  { at: { right: "3%", top: "70%" }, drift: "translate(-36%, 18%) rotate(2deg)", anchor: [73, 80] },
] as const;
// Card order around the hub: left column 01 03 05, right column 02 04 06.
const ORDER = [0, 2, 4, 1, 3, 5];

export default function ProblemSection() {
  const [view, setView] = useState<View>("today");
  const linked = view === "with";

  return (
    <section aria-labelledby="problem-title" className="avs-surface-paper avs-section">
      <div className="avs-container">
        <p className="avs-label avs-eyebrow avs-reveal">The institutional problem</p>
        <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-end">
          <h2
            id="problem-title"
            className="avs-serif avs-reveal max-w-[18ch] text-[clamp(2.125rem,3.9vw,3.75rem)] leading-[1.04] tracking-[-0.025em] lg:col-span-7"
          >
            Agricultural programmes often run on <em className="avs-accent text-[rgb(var(--av-rust))]">disconnected</em>{" "}
            records.
          </h2>
          <p className="avs-body avs-reveal max-w-[30rem] text-[1.0625rem] leading-relaxed lg:col-span-5">
            Field forms, spreadsheets, GIS files, warehouse ledgers and reports are held separately, so figures cannot
            be traced back to the field. AgriVault brings technology, programme design and implementation together to
            connect them.
          </p>
        </div>

        <div className="mt-12 flex justify-start">
          <div
            role="group"
            aria-label="Compare how programme records are held"
            className="inline-flex self-start rounded-full border border-[rgb(var(--av-line)/0.14)] bg-[rgb(var(--av-sand))] p-1 md:self-auto"
          >
            {(
              [
                ["today", "Today"],
                ["with", "With AgriVault"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                onClick={() => setView(id)}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-[0.9375rem] font-medium transition-colors duration-200 ${
                  view === id ? "bg-white text-[rgb(var(--av-forest))] shadow-sm" : "text-[rgb(var(--av-slate))] hover:text-[rgb(var(--av-forest))]"
                }`}
              >
                {id === "with" ? (
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 rounded-[2px] transition-colors ${linked ? "bg-[rgb(var(--av-emerald))]" : "bg-[rgb(var(--av-slate)/0.4)]"}`}
                  />
                ) : null}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="relative isolate mt-5 overflow-hidden rounded-[var(--av-radius-lg)] bg-[rgb(var(--av-sand))] px-3 py-5 sm:px-4 sm:py-6 md:h-[560px] md:p-0"
        >
          <p className="sr-only" aria-live="polite">
            {linked
              ? "Showing with AgriVault: all six sources linked to one operational record."
              : "Showing today: six sources held separately, with no links between them."}
          </p>
          <Topo lines={14} seed={11} stroke="#0B2E1A" opacity={0.07} className="-z-10" />

          {/* Connectors (md+) */}
          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 -z-10 hidden h-full w-full md:block">
            {LAYOUT.map((l, i) => {
              const [x, y] = l.anchor;
              const hx = x < 50 ? 41 : 59;
              // Today: short broken stubs that stop before the centre. Linked: solid to the record.
              const reach = linked ? 1 : 0.42;
              return (
                <line
                  key={i}
                  x1={x}
                  y1={y}
                  x2={x + (hx - x) * reach}
                  y2={y + (50 - y) * reach}
                  stroke={linked ? "#0FA36B" : "#B4564A"}
                  strokeWidth={linked ? 1.5 : 1.2}
                  strokeDasharray={linked ? undefined : "4 5"}
                  vectorEffect="non-scaling-stroke"
                  className="transition-[stroke,opacity] duration-700"
                  style={{ opacity: linked ? 0.9 : 0.6 }}
                />
              );
            })}
          </svg>

          {/* Central record */}
          <div
            className={`relative z-10 mx-auto mb-5 flex w-full max-w-[16rem] flex-col items-center justify-center rounded-[18px] border px-5 py-5 text-center transition-all duration-700 md:absolute md:left-1/2 md:top-1/2 md:mb-0 md:-translate-x-1/2 md:-translate-y-1/2 ${
              linked
                ? "border-transparent bg-[rgb(var(--av-forest))] text-[rgb(var(--av-paper))] shadow-[0_24px_60px_-24px_rgba(11,46,26,0.55)]"
                : "border-dashed border-[rgb(var(--av-slate)/0.35)] bg-[rgb(var(--av-paper)/0.6)] text-[rgb(var(--av-slate))]"
            }`}
          >
            <p className="text-[1.0625rem] font-medium">{linked ? "One operational record" : "No single record"}</p>
            <p className={`avs-meta mt-1.5 uppercase tracking-[0.12em] ${linked ? "text-[rgb(var(--av-mint))]" : ""}`}>
              {linked ? "6 sources · linked" : "6 sources · 0 links"}
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 md:block">
            {/* DOM (and mobile stacking) order is 01–06; on md+ each card takes its slot around the hub. */}
            {FRAGMENTS.map((f, fi) => {
              const slot = ORDER.indexOf(fi);
              const l = LAYOUT[slot];
              return (
                <li
                  key={f.title}
                  className="avs-frag md:absolute md:w-[clamp(15rem,24%,18.5rem)]"
                  style={
                    {
                      ...l.at,
                      "--drift": linked ? "none" : l.drift,
                      transitionDelay: `${slot * 40}ms`,
                    } as unknown as React.CSSProperties
                  }
                >
                  <div
                    className={`h-full rounded-[14px] border bg-white px-3 py-3 transition-shadow duration-700 sm:px-4 sm:py-3.5 ${
                      linked ? "border-[rgb(var(--av-emerald)/0.35)] shadow-[0_10px_30px_-18px_rgba(11,46,26,0.45)]" : "border-[rgb(var(--av-line)/0.12)] shadow-[0_8px_24px_-16px_rgba(11,46,26,0.35)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="avs-label text-[0.6875rem] text-[rgb(var(--av-gold-ink))]">{f.kind}</p>
                      <p className="avs-meta text-[rgb(var(--av-slate))]">{String(fi + 1).padStart(2, "0")}</p>
                    </div>
                    <p className="mt-1 text-[0.9375rem] font-medium leading-snug text-[rgb(var(--av-forest))] sm:text-[1.0625rem]">{f.title}</p>
                    <p
                      className={`avs-meta mt-2.5 flex items-center gap-2 border-t border-[rgb(var(--av-line)/0.1)] pt-2.5 ${
                        linked ? "text-[rgb(var(--av-emerald-ink))]" : "text-[rgb(var(--av-rust))]"
                      }`}
                    >
                      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${linked ? "bg-[rgb(var(--av-emerald))]" : "bg-[rgb(var(--av-rust))]"}`} />
                      {linked ? f.resolved : f.issue}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="avs-meta mt-5 flex items-center gap-2 uppercase tracking-[0.12em] text-[rgb(var(--av-slate))] md:absolute md:bottom-5 md:left-6 md:mt-0">
            <span aria-hidden="true" className={`inline-block w-6 border-t ${linked ? "border-solid border-[rgb(var(--av-emerald))]" : "border-dashed border-[rgb(var(--av-rust-2))]"}`} />
            {linked ? "With AgriVault · one record, traceable to source" : "Today · sources held separately"}
          </p>
        </div>
      </div>
    </section>
  );
}
