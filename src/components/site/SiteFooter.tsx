import Link from "next/link";

import { AgriVaultMark } from "@/components/site/AgriVaultMark";
import { ArrowRight } from "@/components/site/icons";
import { CONTACT_EMAIL } from "@/lib/site/content";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "What we do",
    links: [
      { label: "Systems & infrastructure", href: "/what-we-do#systems" },
      { label: "Field operations", href: "/what-we-do#field" },
      { label: "GIS & land intelligence", href: "/what-we-do#gis" },
      { label: "Supply chain & traceability", href: "/what-we-do#supply" },
      { label: "Reporting & intelligence", href: "/what-we-do#reporting" },
      { label: "Programme implementation", href: "/what-we-do#programmes" },
    ],
  },
  {
    title: "Products",
    links: [
      { label: "Operations Platform", href: "/products#operations-platform" },
      { label: "Farmer Registry", href: "/products#farmer-registry" },
      { label: "GIS & Boundary", href: "/products#gis-boundary" },
      { label: "Warehouse & Traceability", href: "/products#warehouse-traceability" },
      { label: "Reporting & Intelligence", href: "/products#reporting-intelligence" },
      { label: "Offline Field Ops", href: "/products#offline-field" },
    ],
  },
  {
    title: "Programmes",
    links: [
      { label: "Programme-led delivery", href: "/programmes" },
      { label: "Liberia programme", href: "/programmes/liberia" },
      { label: "Governments", href: "/governments" },
    ],
  },
  {
    title: "How we work",
    links: [
      { label: "Methodology", href: "/how-we-work" },
      { label: "Engagement models", href: "/how-we-work#engagement-models" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Security & governance", href: "/security" },
      { label: "Contact", href: "/contact" },
      { label: "Sign in", href: "/login" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="avs-surface-navy avs-on-dark relative isolate overflow-hidden">
      <FooterContours />
      <div className="avs-container pt-20 md:pt-28">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="avs-h2">Agricultural systems, technology and advisory.</p>
            <p className="avs-lead mt-5">
              We design and deploy the data systems, field operations and reporting infrastructure that agricultural
              institutions run on.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="avs-btn avs-btn-primary">
              Start a conversation <ArrowRight />
            </Link>
            <Link href="/login" className="avs-btn avs-btn-ghost">
              Sign in
            </Link>
          </div>
        </div>

        <hr className="avs-rule mt-16" />

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 sm:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="avs-label text-[rgb(var(--av-gold))]">{col.title}</h2>
              <ul className="mt-5 space-y-1">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="inline-flex min-h-[36px] items-center text-[0.9375rem] text-white/75 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Signature lockup: brand, not a link target. */}
        <div aria-hidden="true" className="flex items-center gap-[3.5vw] pb-12 pt-4 text-[rgb(var(--av-paper))]">
          <AgriVaultMark size={140} tone="light" className="h-auto w-[clamp(40px,10vw,150px)]" />
          <span className="whitespace-nowrap text-[clamp(2rem,10.4vw,8.5rem)] font-semibold leading-none tracking-[-0.045em]">
            AgriVault<span className="ml-[0.18em] font-normal text-white/50">Data</span>
          </span>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-8 text-[0.875rem] text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} AgriVault Data. An independent, privately held company.</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex min-h-[44px] items-center text-white/75 transition-colors hover:text-white">
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}

/** Concentric survey contours, bottom-right — the footer's only ornament. */
function FooterContours() {
  const rings = Array.from({ length: 11 }, (_, i) => i);
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 800 800"
      className="pointer-events-none absolute -bottom-64 -right-40 -z-10 h-[900px] w-[900px] opacity-[0.09]"
    >
      {rings.map((i) => {
        const r = 40 + i * 34;
        const wob = 6 + i * 2.2;
        const pts = Array.from({ length: 49 }, (_, s) => {
          const a = (s / 48) * Math.PI * 2;
          const rr = r + wob * Math.sin(a * 3 + i * 0.6) + wob * 0.5 * Math.cos(a * 5 - i);
          return `${s === 0 ? "M" : "L"}${(400 + rr * Math.cos(a) * 1.25).toFixed(1)} ${(400 + rr * Math.sin(a)).toFixed(1)}`;
        }).join("");
        return <path key={i} d={`${pts}Z`} fill="none" stroke="#B7C3D1" strokeWidth={1} vectorEffect="non-scaling-stroke" />;
      })}
    </svg>
  );
}
