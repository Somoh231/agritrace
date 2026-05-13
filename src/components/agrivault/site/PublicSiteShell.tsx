import type { ReactNode } from "react";

/**
 * Wraps all public marketing pages so scoped CSS (`public-marketing.css`) and
 * design tokens apply only here — never bleeds into the dashboard shell.
 */
export default function PublicSiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="public-site-root flex min-h-screen flex-col bg-[var(--warm)] text-[var(--dark)] antialiased">
      {children}
    </div>
  );
}
