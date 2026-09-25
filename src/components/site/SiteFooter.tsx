import Link from "next/link";

import { AgriVaultLockup } from "@/components/site/AgriVaultMark";
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
    title: "Delivery",
    links: [
      { label: "Programme-led delivery", href: "/programmes" },
      { label: "How we work", href: "/how-we-work" },
      { label: "Engagement models", href: "/how-we-work#engagement-models" },
      { label: "Governments & ministries", href: "/governments" },
      { label: "Liberia programme", href: "/programmes/liberia" },
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

const linkClass =
  "inline-flex min-h-[44px] items-center py-1.5 text-[0.9375rem] leading-snug text-white/70 transition-colors hover:text-white md:min-h-[34px] md:py-1";

/**
 * Closing section of every public page: compact identity, sitemap, legal.
 * Inner pages already end on a CTA band, so the footer carries no second hero.
 */
export default function SiteFooter() {
  return (
    <footer className="avs-surface-navy avs-on-dark relative isolate overflow-hidden">
      <FooterContours />
      <div className="avs-container pt-14 md:pt-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link href="/" aria-label="AgriVault Data — home" className="inline-flex min-h-[44px] items-center rounded-md">
              <AgriVaultLockup tone="light" size={24} />
            </Link>
            <p className="mt-4 max-w-[34ch] text-[0.9375rem] leading-relaxed text-white/70">
              Agricultural systems, technology, advisory and implementation for governments, development partners and
              agricultural institutions.
            </p>
            <div className="mt-6 flex flex-col items-start gap-1">
              <a href={`mailto:${CONTACT_EMAIL}`} className={`${linkClass} text-white/85`}>
                {CONTACT_EMAIL}
              </a>
              <Link href="/contact" className="avs-arrow-link inline-flex min-h-[44px] items-center text-[0.9375rem]">
                Start a conversation <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-4 lg:col-span-8">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h2 className="avs-label text-white/50">{col.title}</h2>
                <ul className="mt-4">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className={linkClass}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 py-6 text-[0.875rem] text-white/55 md:mt-14 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} AgriVault Data. An independent, privately held company.</p>
          <div className="flex items-center gap-x-6">
            <Link href="/privacy" className="inline-flex min-h-[44px] items-center text-white/70 transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="inline-flex min-h-[44px] items-center text-white/70 transition-colors hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** Faint survey contours at the right edge — the footer's only ornament. */
function FooterContours() {
  const rings = Array.from({ length: 9 }, (_, i) => i);
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 800 800"
      className="pointer-events-none absolute -right-48 -top-40 -z-10 h-[640px] w-[640px] opacity-[0.06]"
    >
      {rings.map((i) => {
        const r = 40 + i * 38;
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
