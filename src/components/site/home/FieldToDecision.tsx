"use client";

import { useEffect, useRef, useState } from "react";

import { SAMPLE_LABEL } from "@/components/site/render/SystemRenders";

/**
 * 7 · Field → verification → geography → custody → reporting → decision-making.
 * The site's one scroll narrative (scroll-world principles, no video):
 *   - no cuts: layers accumulate and the walked plot persists through every
 *     stage, so each stage's end state is the next stage's start;
 *   - scroll drives the stage (one IntersectionObserver), with a stage rail;
 *   - still frames for reduced motion, no-JS and < 1024px: every step renders
 *     its own frame inline. The sticky panel only appears via CSS when
 *     html.avs-js is set (before first paint), lg+, and motion is allowed.
 * Wording is limited to what the platform records (see content.ts claims policy).
 */

const STEPS = [
  {
    key: "field",
    rail: "Field",
    title: "A plot is walked and a farmer registered",
    body: "Captured on the device, even without coverage, for selected record types: farmer registration, plot outlines and production records.",
  },
  {
    key: "verification",
    rail: "Verification",
    title: "District review verifies or returns it",
    body: "A reviewer at the level above verifies the record or returns it for correction. Each decision is recorded with who and when.",
  },
  {
    key: "geography",
    rail: "Geography",
    title: "The plot takes its place on the map",
    body: "The outline joins district and county geography. It is an operational outline for traceability: approximate, not cadastral survey.",
  },
  {
    key: "custody",
    rail: "Custody",
    title: "Inputs and produce keep their custody trail",
    body: "Receipts and transfers between warehouses move through request, approval, dispatch and delivery, each step attributed.",
  },
  {
    key: "reporting",
    rail: "Reporting",
    title: "Reports are built from approved records",
    body: "County and national reports are produced from the operational record, so a figure can be traced to the records behind it.",
  },
  {
    key: "decision",
    rail: "Decision-making",
    title: "Decisions stay attached to the record",
    body: "Approvals, corrections and escalations are recorded with who and when, so leadership can follow a decision back through the record.",
  },
] as const;

export default function FieldToDecision() {
  const [stage, setStage] = useState(0);
  const steps = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    if (!mq.matches || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setStage(Number((e.target as HTMLElement).dataset.stage));
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    steps.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="field-to-decision"
      aria-labelledby="sequence-title"
      data-home-section="field-to-decision"
      className="avs-surface-navy avs-on-dark avs-section"
    >
      <div className="avs-container">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="avs-label avs-eyebrow">One record, end to end</p>
            <h2 id="sequence-title" className="avs-h-section mt-5 max-w-[18ch]">
              How a field record becomes institutional intelligence.
            </h2>
          </div>
          <p className="text-[1.0625rem] leading-relaxed text-white/80 lg:col-span-5">
            Field, verification, geography, custody, reporting and decision-making, on one record. Follow a single sample
            plot through each stage.
          </p>
        </div>

        <div className="mt-12 lg:grid lg:grid-cols-12 lg:gap-12">
          <ol className="avs-seq-steps">
            {STEPS.map((s, i) => (
              <li
                key={s.key}
                ref={(el) => {
                  steps.current[i] = el;
                }}
                data-stage={i}
                className="avs-seq-step border-t border-white/10 py-8 first:border-t-0 first:pt-0"
              >
                <div>
                  <p className="avs-meta text-[rgb(var(--av-gold))]">
                    {String(i + 1).padStart(2, "0")} · {s.rail}
                  </p>
                  <h3 className={`avs-h3 mt-3 transition-colors duration-300 ${i === stage ? "" : "avs-seq-dim"}`}>{s.title}</h3>
                  <p className="mt-3 max-w-[34rem] leading-relaxed text-white/75">{s.body}</p>
                </div>
                <figure className="avs-seq-inline mt-6 lg:mt-0">
                  <div className="overflow-hidden rounded-[var(--av-radius)] border border-white/10">
                    <SequenceScene stage={i} framed />
                  </div>
                  <figcaption className="avs-label mt-2 text-[0.625rem] text-[rgb(var(--av-gold))]">{SAMPLE_LABEL}</figcaption>
                </figure>
              </li>
            ))}
          </ol>

          <div className="avs-seq-panel lg:col-span-7" aria-hidden="true">
            <div className="sticky top-[calc(var(--av-header-h)+2rem)]">
              <ol className="flex overflow-hidden rounded-t-[var(--av-radius)] border border-b-0 border-white/10">
                {STEPS.map((s, i) => (
                  <li
                    key={s.key}
                    aria-current={i === stage ? "step" : undefined}
                    className={`flex-1 border-r border-white/10 px-2 py-2.5 text-center avs-meta text-[0.625rem] uppercase tracking-[0.08em] transition-colors duration-300 last:border-r-0 ${
                      i === stage ? "bg-[rgb(var(--av-mint))] text-[rgb(var(--av-navy))]" : i < stage ? "text-[rgb(var(--av-mint))]" : "text-white/55"
                    }`}
                  >
                    {s.rail}
                  </li>
                ))}
              </ol>
              <div className="overflow-hidden rounded-b-[var(--av-radius)] border border-white/10">
                <SequenceScene stage={stage} animate />
              </div>
              <p className="avs-label mt-3 text-[0.625rem] text-[rgb(var(--av-gold))]">{SAMPLE_LABEL}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Scene: one synthetic geography, built up stage by stage ---------- */

const MINT = "#6FD3A4";
const GOLD = "#C7A56A";
const MIST = "#9AA7B8";
const LINE = "#142B4E";
const PANEL = "#0C1F3D";
const mono = { fontFamily: "var(--av-font-mono)", fontSize: 10, letterSpacing: 0.8 } as const;

function Layer({ show, animate, children }: { show: boolean; animate?: boolean; children: React.ReactNode }) {
  return (
    <g style={{ opacity: show ? 1 : 0, transition: animate ? "opacity 420ms cubic-bezier(0.16,1,0.3,1)" : undefined }}>{children}</g>
  );
}

/* Still frames crop to what their stage is about, so labels stay legible on phones. */
const FRAME_VIEW = ["20 76 250 170", "90 70 340 170", "10 20 470 310", "20 120 290 216", "90 80 450 240", "240 24 320 290"];

export function SequenceScene({ stage, animate = false, framed = false }: { stage: number; animate?: boolean; framed?: boolean }) {
  const at = (n: number) => stage >= n;
  return (
    <svg viewBox={framed ? FRAME_VIEW[stage] : "0 0 560 360"} className="block h-auto w-full bg-[rgb(var(--av-navy))]" role="presentation" aria-hidden="true" focusable="false">
      {/* 3 · geography: district boundaries (drawn first so they sit underneath) */}
      <Layer show={at(2)} animate={animate}>
        <path d="M20 40 L250 22 L300 150 L262 300 L40 320 Z" fill={PANEL} stroke={LINE} strokeWidth="2" />
        <path d="M250 22 L420 30 L470 170 L300 150 Z" fill={PANEL} stroke={LINE} strokeWidth="2" />
        <text x="42" y="66" {...mono} fill={MIST}>
          DISTRICT A
        </text>
        <text x="312" y="48" {...mono} fill={MIST}>
          DISTRICT B
        </text>
      </Layer>

      {/* 1 · field: the walked plot — persists through every stage */}
      <g>
        <path d="M112 150 L176 138 L190 186 L126 198 Z" fill="rgba(111,211,164,0.2)" stroke={MINT} strokeWidth="2.5" strokeLinejoin="round" />
        {[
          [112, 150],
          [176, 138],
          [190, 186],
          [126, 198],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#07152D" stroke={MINT} strokeWidth="2" />
        ))}
        <text x="104" y="222" {...mono} fill="#F7F7F2">
          SAMPLE PLOT 01
        </text>
      </g>
      <Layer show={stage === 0} animate={animate}>
        <rect x="36" y="112" width="44" height="72" rx="7" fill="none" stroke={MIST} strokeWidth="1.5" />
        <circle cx="58" cy="172" r="3" fill={GOLD} />
        <text x="24" y="100" {...mono} fill={GOLD}>
          QUEUED OFFLINE
        </text>
      </Layer>

      {/* 2 · verification: the record card */}
      <Layer show={at(1)} animate={animate}>
        <path d="M190 170 C 220 170, 230 150, 250 132" fill="none" stroke={GOLD} strokeDasharray="4 4" />
        <rect x="250" y="84" width="170" height="92" rx="4" fill={PANEL} stroke={LINE} />
        <text x="262" y="104" {...mono} fill="#F7F7F2">
          SAMPLE FARMER 01
        </text>
        <circle cx="266" cy="124" r="4" fill={MINT} />
        <text x="278" y="128" {...mono} fill={MIST}>
          CAPTURED · SYNCED
        </text>
        <circle cx="266" cy="146" r="4" fill={at(1) ? MINT : "none"} stroke={MINT} />
        <text x="278" y="150" {...mono} fill={MIST}>
          DISTRICT · VERIFIED
        </text>
        <circle cx="266" cy="166" r="4" fill={at(4) ? MINT : "none"} stroke={at(4) ? MINT : GOLD} />
        <text x="278" y="170" {...mono} fill={MIST}>
          COUNTY · {at(4) ? "APPROVED" : "IN REVIEW"}
        </text>
      </Layer>

      {/* 4 · custody: warehouse transfer */}
      <Layer show={at(3)} animate={animate}>
        <rect x="40" y="258" width="58" height="40" rx="2" fill="none" stroke={MIST} />
        <text x="36" y="316" {...mono} fill={MIST}>
          WAREHOUSE A
        </text>
        <rect x="200" y="258" width="58" height="40" rx="2" fill="none" stroke={MIST} />
        <text x="196" y="316" {...mono} fill={MIST}>
          WAREHOUSE B
        </text>
        <path d="M100 278 H198" stroke={GOLD} strokeWidth="2" strokeDasharray="5 4" />
        {[118, 146, 174].map((x, i) => (
          <circle key={x} cx={x} cy="278" r="4.5" fill={i < 2 ? GOLD : "#07152D"} stroke={GOLD} strokeWidth="1.5" />
        ))}
      </Layer>

      {/* 5 · reporting: report built from approved records, linked back */}
      <Layer show={at(4)} animate={animate}>
        <rect x="330" y="196" width="190" height="110" rx="4" fill={PANEL} stroke={LINE} />
        <text x="344" y="218" {...mono} fill="#F7F7F2">
          COUNTY REPORT
        </text>
        <text x="344" y="234" {...mono} fontSize={8.5} fill={MIST}>
          FROM APPROVED RECORDS
        </text>
        {[30, 46, 38, 54].map((h, i) => (
          <rect key={i} x={350 + i * 30} y={296 - h} width="18" height={h} fill={i === 3 ? MINT : "#1E3A5F"} />
        ))}
        <path d="M330 262 C 280 250, 230 214, 190 190" fill="none" stroke={MINT} strokeOpacity="0.6" strokeDasharray="3 4" />
      </Layer>

      {/* 6 · decision-making: recorded decision history */}
      <Layer show={at(5)} animate={animate}>
        <rect x="428" y="36" width="120" height="132" rx="4" fill={PANEL} stroke={GOLD} strokeOpacity="0.7" />
        <text x="438" y="55" {...mono} fontSize={8.5} fill={GOLD}>
          DECISION HISTORY
        </text>
        <text x="438" y="69" {...mono} fontSize={7.5} fill={MIST}>
          WHO · WHEN · WHAT
        </text>
        {["APPROVED", "RETURNED", "ESCALATED"].map((d, i) => (
          <g key={d}>
            <rect x="438" y={78 + i * 28} width="100" height="20" rx="2" fill="#07152D" stroke={LINE} />
            <circle cx="448" cy={88 + i * 28} r="3" fill={i === 1 ? GOLD : MINT} />
            <text x="457" y={91 + i * 28} {...mono} fontSize={8} fill="#F7F7F2">
              {d}
            </text>
          </g>
        ))}
        <path d="M428 120 C 410 130, 440 190, 470 196" fill="none" stroke={GOLD} strokeOpacity="0.6" strokeDasharray="3 4" />
      </Layer>
    </svg>
  );
}
