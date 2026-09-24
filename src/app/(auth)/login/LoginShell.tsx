import Link from "next/link";
import type { ReactNode } from "react";

import { AgriVaultLockup } from "@/components/site/AgriVaultMark";
import { Topo } from "@/components/site/Topo";
import { siteFontVariables } from "@/lib/site/fonts";

/**
 * Sign-in page chrome (presentation only). Shared by the interactive
 * LoginClient and its Suspense fallback, so the prerendered HTML already shows
 * the full page while the client bundle loads.
 */
export function LoginShell({ children }: { children: ReactNode }) {
  return (
    <div className={`avs ${siteFontVariables} min-h-screen`}>
      <main className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <section
          aria-label="AgriVault"
          className="avs-surface-navy avs-on-dark avs-grain relative isolate flex flex-col justify-between gap-12 overflow-hidden px-6 py-8 sm:px-10 lg:min-h-screen lg:px-14 lg:py-12"
        >
          <Topo lines={18} seed={6} stroke="#9AA7B8" opacity={0.08} emphasis={11} className="-z-10" />
          <Link href="/" className="inline-flex min-h-[44px] w-fit items-center rounded-md" aria-label="AgriVault Data — home">
            <AgriVaultLockup tone="light" size={28} />
          </Link>
          <div className="hidden lg:block">
            <p className="avs-label text-[rgb(var(--av-gold))]">AgriVault operations platform</p>
            <p className="avs-h2 mt-6 max-w-[16ch]">
              One operational record, from the field to the <span className="avs-accent">national</span> view.
            </p>
            <ul className="mt-10 space-y-3 text-[1rem] text-white/75">
              {["Access scoped to your role and geography", "Every decision recorded in the audit ledger", "Field capture that works offline"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span aria-hidden="true" className="h-px w-5 bg-[rgb(var(--av-mint))]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="avs-meta hidden uppercase tracking-[0.12em] text-white/55 lg:block">
            Programme context · Liberia Agricultural Intelligence Programme
          </p>
        </section>

        <section aria-labelledby="signin-title" className="avs-surface-paper flex items-center justify-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-[420px]">
            <h1 id="signin-title" className="avs-h2 text-[clamp(2rem,3vw,2.5rem)]">
              Sign in
            </h1>
            <p className="avs-body mt-3">For programme staff with an AgriVault account.</p>
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}

/** Invitation / reset guidance shown under the form. */
export function LoginAccountNote() {
  return (
    <p className="mt-6 text-[0.9375rem] leading-relaxed text-[rgb(var(--av-slate))]">
      Accounts are issued by invitation from an authorised AgriVault administrator. Forgot your password or locked out?
      Ask your administrator to send a secure reset link — administrators never see or set your password.
    </p>
  );
}

/** Static placeholder for the form while the sign-in client loads (not interactive, hidden from AT). */
export function LoginFormPlaceholder() {
  return (
    <>
      <div aria-hidden="true" className="mt-8 space-y-5">
        {["Email", "Password"].map((l) => (
          <div key={l}>
            <div className="mb-2 text-[0.9375rem] font-medium">{l}</div>
            <div className="h-12 rounded-[12px] border border-[rgb(var(--av-line)/0.22)] bg-white" />
          </div>
        ))}
        <div className="h-12 rounded-full bg-[rgb(var(--av-forest)/0.5)]" />
      </div>
      <LoginAccountNote />
    </>
  );
}
