import Link from "next/link";

import { ArrowRight } from "@/components/site/icons";
import { Topo } from "@/components/site/Topo";
import { MARKETS } from "@/lib/site/content";

/**
 * Hero: aerial field atmosphere, survey contours and an illustrative parcel
 * layer. The parcel annotations are sample UI (labelled), not data.
 * No reveal animation here — the hero is the LCP and renders immediately.
 */
export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="avs-on-dark avs-grain relative isolate flex min-h-[max(640px,100svh)] flex-col overflow-hidden text-[rgb(var(--av-paper))] lg:max-h-[1040px]"
      style={{
        background:
          "radial-gradient(90% 70% at 82% 8%, rgba(143,156,98,0.9) 0%, rgba(143,156,98,0) 60%), radial-gradient(70% 60% at 10% 100%, rgba(7,21,45,0.65) 0%, rgba(7,21,45,0) 70%), linear-gradient(115deg, #0C1D16 0%, #1B3222 34%, #3B4E2E 64%, #5F6E43 100%)",
      }}
    >
      <div aria-hidden="true" className="avs-hero-drift absolute inset-[-4%] -z-10">
        <Topo lines={22} seed={3} stroke="#E4E9C9" opacity={0.11} emphasis={13} />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(90deg, rgba(8,20,14,0.72) 0%, rgba(8,20,14,0.35) 45%, rgba(8,20,14,0) 75%)" }}
      />

      <ParcelLayer />

      <div className="avs-container relative flex flex-1 flex-col justify-end pb-10 pt-[calc(var(--av-header-h)+4rem)] md:pb-12">
        <p className="avs-label text-[rgb(var(--av-gold))]">Agricultural systems · Technology · Advisory</p>
        <h1 id="hero-title" className="avs-display mt-6 max-w-[15ch] text-[rgb(var(--av-paper))]">
          Building the systems behind <span className="avs-accent">stronger</span> agricultural institutions.
        </h1>

        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end">
          <p className="avs-lead max-w-[38rem] text-white/85 lg:col-span-6">
            AgriVault Data works with governments, development partners and agricultural organisations to design and
            deploy the data systems, field operations, digital products and reporting infrastructure needed to manage
            agriculture at scale.
          </p>
          <div className="flex flex-wrap gap-3 lg:col-span-6">
            <Link href="/contact" className="avs-btn avs-btn-primary">
              Start a conversation <ArrowRight />
            </Link>
            <Link href="/what-we-do" className="avs-btn avs-btn-ghost">
              Explore our work
            </Link>
          </div>
        </div>

        <div className="mt-14 border-t border-white/15 pt-5 md:mt-16">
          <h2 className="sr-only">Who we work with</h2>
          <div className="flex flex-col gap-3 md:flex-row md:items-baseline md:gap-8">
            <p aria-hidden="true" className="avs-label shrink-0 text-[rgb(var(--av-gold))]">
              We work with
            </p>
            <ul className="avs-meta flex flex-wrap gap-x-7 gap-y-2 text-[0.8125rem] text-white/75">
              {MARKETS.map((m) => (
                <li key={m.name}>{m.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Illustrative plot outlines with a boundary being traced. Decorative + labelled sample. */
function ParcelLayer() {
  const plots = [
    "M40 40 L215 12 L262 182 L78 212 Z",
    "M235 8 L420 -12 L468 150 L282 178 Z",
    "M92 236 L278 204 L318 390 L136 422 Z",
    "M300 200 L488 170 L530 346 L338 386 Z",
    "M150 446 L336 412 L372 590 L190 626 Z",
  ];
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-[3%] top-[17%] hidden w-[min(38vw,560px)] xl:block"
    >
      <svg viewBox="-10 -30 560 680" className="h-auto w-full overflow-visible">
        {plots.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#EEF0DA" strokeOpacity={0.42} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        ))}
        <path d={plots[0]} fill="rgba(111,211,164,0.22)" stroke="none" className="avs-parcel-fill" />
        <path
          d={plots[0]}
          fill="none"
          stroke="#6FD3A4"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          className="avs-parcel-trace"
        />
        {[
          [40, 40],
          [215, 12],
          [262, 182],
          [78, 212],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={4} fill="#6FD3A4" className="avs-parcel-vertex" style={{ animationDelay: `${0.5 + i * 0.35}s` }} />
        ))}
      </svg>
      <Tag className="left-[4%] top-[-6%]" dot="#E4E9C9">
        Bong County · 6.83° N, 9.37° W
      </Tag>
      <Tag className="left-[42%] top-[17%]" dot="#0FA36B">
        Plot · boundary verified
      </Tag>
      <Tag className="left-[56%] top-[36%]" dot="#F7F7F2">
        Rec LR-BG-······ · <span className="text-[rgb(var(--av-gold))]">Sample</span>
      </Tag>
    </div>
  );
}

function Tag({ children, className, dot }: { children: React.ReactNode; className: string; dot: string }) {
  return (
    <span className={`avs-meta absolute flex items-center gap-2 whitespace-nowrap uppercase ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      <span className="rounded-[4px] bg-[rgba(7,21,45,0.62)] px-2 py-1 text-[0.6875rem] tracking-[0.1em] text-white/90 backdrop-blur-sm">
        {children}
      </span>
    </span>
  );
}
