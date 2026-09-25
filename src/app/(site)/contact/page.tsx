import type { Metadata } from "next";
import Link from "next/link";

import ContactForm from "@/components/site/ContactForm";
import { PageHero } from "@/components/site/page/PageHero";
import { CONTACT_EMAIL } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a conversation with AgriVault Data about an agricultural programme, system or partnership.",
  alternates: { canonical: "/contact" },
};

const NEXT = [
  { k: "We reply", v: "A member of the team replies to your email, usually to arrange a short call." },
  { k: "We listen", v: "We ask how the programme runs today, who it serves and what it needs to achieve." },
  { k: "We recommend", v: "We suggest where to start — often a diagnostic — before any system is proposed." },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Start a <span className="avs-accent">conversation</span>.
          </>
        }
        lead={<p>Tell us about the institution, the programme and where it runs today.</p>}
      />

      <section aria-label="Contact AgriVault Data" className="avs-surface-paper avs-section">
        <div className="avs-container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
          <aside className="space-y-10 lg:col-span-5 lg:pl-6">
            <div>
              <h2 className="avs-label text-[rgb(var(--av-slate))]">Email us directly</h2>
              <a href={`mailto:${CONTACT_EMAIL}`} className="avs-link mt-3 inline-flex min-h-[44px] items-center text-[1.25rem] text-[rgb(var(--av-forest))]">
                {CONTACT_EMAIL}
              </a>
            </div>
            <div>
              <h2 className="avs-label text-[rgb(var(--av-slate))]">What happens next</h2>
              <ol className="mt-4">
                {NEXT.map((n, i) => (
                  <li key={n.k} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-t border-[rgb(var(--av-line)/0.14)] py-4">
                    <span className="avs-meta pt-1 text-[rgb(var(--av-emerald-ink))]">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="block font-medium">{n.k}</span>
                      <span className="avs-body mt-1 block text-[0.9375rem]">{n.v}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="avs-surface-sand rounded-[var(--av-radius)] p-6">
              <h2 className="text-[1.0625rem] font-medium">Already work with us?</h2>
              <p className="avs-body mt-2 text-[0.9375rem]">Programme staff sign in to the AgriVault platform with the account their administrator created.</p>
              <Link href="/login" className="avs-arrow-link mt-4 inline-flex min-h-[44px] items-center">
                Sign in
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
