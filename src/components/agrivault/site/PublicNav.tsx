"use client";

import Link from "next/link";

import LanguageSwitcher from "@/components/agrivault/site/LanguageSwitcher";
import { track } from "@/lib/analytics/client";

function Chevron() {
  return (
    <svg className="chevron" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 1l4 4 4-4" />
    </svg>
  );
}

export default function PublicNav() {
  const trackCta = (label: string) => {
    track("cta_click", { label, placement: "public_nav" });
  };

  return (
    <nav aria-label="Primary">
      <Link href="/" className="logo">
        <div className="logo-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2C8 2 5 6 5 10c0 4 3 7 7 9 4-2 7-5 7-9 0-4-3-8-7-8z" />
            <path d="M12 2v18M8 8c1.5 1 2.5 2.5 4 4 1.5-1.5 2.5-3 4-4" />
          </svg>
        </div>
        <div className="logo-name">
          <strong>AgriVault Data</strong>
          <span>Africa · Traceability</span>
        </div>
      </Link>

      <ul className="nav-center">
        <li>
          <button>
            Platform <Chevron />
          </button>
          <div className="drop">
            <span className="drop-label">Core modules</span>
            <Link href="/platform">
              <div className="drop-text">
                <strong>Farmer Registry</strong>
                <span>Permanent IDs, GPS plots, records</span>
              </div>
            </Link>
            <Link href="/platform-preview">
              <div className="drop-text">
                <strong>Production Dashboard</strong>
                <span>Live county data, NADP tracking</span>
              </div>
            </Link>
            <Link href="/platform-preview">
              <div className="drop-text">
                <strong>Audit Trail & Compliance</strong>
                <span>Chain of custody, EUDR docs</span>
              </div>
            </Link>
            <Link href="/platform-preview">
              <div className="drop-text">
                <strong>Ministry Reports</strong>
                <span>Cabinet PDFs, donor exports</span>
              </div>
            </Link>
          </div>
        </li>
        <li>
          <button>
            Countries <Chevron />
          </button>
          <div className="drop">
            <span className="drop-label">Active</span>
            <Link href="/liberia">
              <span className="status-dot dot-live pulse" />
              <div className="drop-text">
                <strong>Liberia</strong>
                <span>Pilot live · Nimba, Bong & Lofa</span>
              </div>
            </Link>
            <div className="drop-divider" />
            <span className="drop-label">Pipeline</span>
            <Link href="/africa">
              <span className="status-dot dot-plan" />
              <div className="drop-text">
                <strong>Sierra Leone</strong>
                <span>2027</span>
              </div>
            </Link>
            <Link href="/africa">
              <span className="status-dot dot-plan" />
              <div className="drop-text">
                <strong>Guinea</strong>
                <span>2028</span>
              </div>
            </Link>
          </div>
        </li>
        <li>
          <button>
            Company <Chevron />
          </button>
          <div className="drop drop-wide">
            <div className="drop-col">
              <span className="drop-label">Company</span>
              <Link href="/about" className="drop-simple">
                <div className="drop-text">
                  <strong>About</strong>
                  <span>Mission, founder, story</span>
                </div>
              </Link>
              <Link href="/partners" className="drop-simple">
                <div className="drop-text">
                  <strong>Partners</strong>
                  <span>Who we work with</span>
                </div>
              </Link>
              <Link href="/contact" className="drop-simple">
                <div className="drop-text">
                  <strong>Contact</strong>
                  <span>Get in touch</span>
                </div>
              </Link>
            </div>
            <div className="drop-col">
              <span className="drop-label">For Governments</span>
              <Link href="/government" className="drop-simple">
                <div className="drop-text">
                  <strong>Partnership model</strong>
                  <span>Asset-based PPP framework</span>
                </div>
              </Link>
              <Link href="/governance" className="drop-simple">
                <div className="drop-text">
                  <strong>Data governance</strong>
                  <span>Ownership, access, audit</span>
                </div>
              </Link>
              <Link href="/capabilities" className="drop-simple">
                <div className="drop-text">
                  <strong>System capabilities</strong>
                  <span>Operational modules and field tools</span>
                </div>
              </Link>
              <Link href="/integrations" className="drop-simple">
                <div className="drop-text">
                  <strong>Integrations</strong>
                  <span>API and interoperability readiness</span>
                </div>
              </Link>
              <Link href="/government#sovereignty" className="drop-simple">
                <div className="drop-text">
                  <strong>Data sovereignty</strong>
                  <span>Ownership and governance</span>
                </div>
              </Link>
            </div>
          </div>
        </li>
        <li>
          <Link href="/pricing">Pricing</Link>
        </li>
        <li>
          <Link href="/docs">Docs</Link>
        </li>
        <li>
          <Link href="/news">News</Link>
        </li>
      </ul>

      <div className="nav-right">
        <LanguageSwitcher />
        <Link href="/contact" className="btn-ghost" onClick={() => trackCta("sign_in")}>
          Sign in
        </Link>
        <Link href="/government" className="btn-outline" onClick={() => trackCta("government_partnership")}>
          Government partnership
        </Link>
        <Link href="/request-demo" className="btn-primary" onClick={() => trackCta("request_demo")}>
          Request demo →
        </Link>
      </div>
    </nav>
  );
}

