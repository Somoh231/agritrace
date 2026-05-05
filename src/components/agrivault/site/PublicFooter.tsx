import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <strong>AgriVault Data</strong>
            <p>
              Institutional-grade agricultural data infrastructure for field operations, governance, and reporting.
            </p>
            <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "rgba(255,255,255,.28)" }}>
              agrivaultdata.com
            </span>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul className="footer-links">
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/liberia">Liberia</Link>
              </li>
              <li>
                <Link href="/africa">Africa</Link>
              </li>
              <li>
                <Link href="/partners">Partners</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <ul className="footer-links">
              <li>
                <Link href="/platform">Platform overview</Link>
              </li>
              <li>
                <Link href="/rice">View platform</Link>
              </li>
              <li>
                <Link href="/docs">Docs</Link>
              </li>
              <li>
                <Link href="/news">News</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Governments</h4>
            <ul className="footer-links">
              <li>
                <Link href="/government">Partnership model</Link>
              </li>
              <li>
                <Link href="/government#sovereignty">Data sovereignty</Link>
              </li>
              <li>
                <Link href="/government#grants">Grant support</Link>
              </li>
              <li>
                <Link href="/government#mou">MOU framework</Link>
              </li>
              <li>
                <Link href="/pricing">Pricing</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 AgriVault Data · All rights reserved</span>
          <span>
            <a href="mailto:msdonzo@agrivaultdata.com">msdonzo@agrivaultdata.com</a> · +1 571-427-5538 · Sacramento,
            CA · Monrovia, Liberia
          </span>
        </div>
      </div>
    </footer>
  );
}

