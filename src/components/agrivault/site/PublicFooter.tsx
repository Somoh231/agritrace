import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-emerald-900/40 bg-[#0f2e14] text-slate-400">
      <div className="mx-auto max-w-[90rem] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="max-w-sm">
            <div className="text-[15px] font-semibold text-white">Agrivault Data</div>
            <p className="mt-3 text-[13px] font-light leading-relaxed text-white/45">
              Institutional agricultural data infrastructure for national reporting, field coordination, and auditable traceability.
            </p>
            <p className="mt-4 text-[11px] font-medium tracking-wide text-white/25">agrivaultdata.com</p>
          </div>
          <div>
            <h4 className="text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-400/90">Company</h4>
            <ul className="mt-4 flex flex-col gap-2.5 text-[13px] font-light">
              <li>
                <Link href="/about" className="text-white/45 transition hover:text-white/90">
                  About
                </Link>
              </li>
              <li>
                <Link href="/liberia" className="text-white/45 transition hover:text-white/90">
                  Liberia
                </Link>
              </li>
              <li>
                <Link href="/africa" className="text-white/45 transition hover:text-white/90">
                  Africa
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-white/45 transition hover:text-white/90">
                  Partners
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/45 transition hover:text-white/90">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-400/90">Platform</h4>
            <ul className="mt-4 flex flex-col gap-2.5 text-[13px] font-light">
              <li>
                <Link href="/platform" className="text-white/45 transition hover:text-white/90">
                  Platform overview
                </Link>
              </li>
              <li>
                <Link href="/platform-preview" className="text-white/45 transition hover:text-white/90">
                  Product preview
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-white/45 transition hover:text-white/90">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-white/45 transition hover:text-white/90">
                  News
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-400/90">Governments</h4>
            <ul className="mt-4 flex flex-col gap-2.5 text-[13px] font-light">
              <li>
                <Link href="/government" className="text-white/45 transition hover:text-white/90">
                  Partnership model
                </Link>
              </li>
              <li>
                <Link href="/government#sovereignty" className="text-white/45 transition hover:text-white/90">
                  Data sovereignty
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-white/45 transition hover:text-white/90">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-8 text-[11px] text-white/25 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Agrivault Data · All rights reserved</span>
          <span className="text-white/35">
            <a href="mailto:msdonzo@agrivaultdata.com" className="text-emerald-400/80 no-underline hover:text-emerald-300">
              msdonzo@agrivaultdata.com
            </a>{" "}
            · Sacramento, CA · Monrovia, Liberia
          </span>
        </div>
      </div>
    </footer>
  );
}
