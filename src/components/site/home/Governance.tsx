import Link from "next/link";

import { ArrowRight } from "@/components/site/icons";
import { DATA_OWNERSHIP } from "@/lib/site/content";

/*
 * 9 · Data governance. The owner's R-19 working language, then only statements
 * the security verification matrix supports, in its conservative wording
 * (never "append-only", "immutable" or "however the data is requested").
 */
const STATEMENTS = [
  {
    k: "Role-based workspaces",
    v: "Field, district, county, national and administrative users each work in a workspace designed for their role.",
  },
  {
    k: "Recorded decision history",
    v: "Approvals, rejections, correction requests and escalations are recorded with who and when. Platform users cannot edit or delete these entries.",
  },
  {
    k: "Secured web transport",
    v: "The platform is served only over HTTPS with strict transport security, a content security policy and frame protection.",
  },
];

export default function Governance() {
  return (
    <section aria-labelledby="governance-title" data-home-section="governance" className="avs-surface-paper avs-section border-t border-[rgb(var(--av-line)/0.1)]">
      <div className="avs-container grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <p className="avs-label avs-eyebrow avs-reveal">Data governance</p>
          <h2 id="governance-title" className="avs-h-section avs-reveal mt-5 max-w-[16ch]">
            {DATA_OWNERSHIP.heading}
          </h2>
        </div>
        <div className="lg:col-span-7">
          <p className="avs-reveal text-[1.125rem] leading-relaxed">{DATA_OWNERSHIP.body}</p>
          <dl className="avs-reveal mt-10 border-t border-[rgb(var(--av-forest))]">
            {STATEMENTS.map((s) => (
              <div key={s.k} className="grid gap-2 border-b border-[rgb(var(--av-line)/0.12)] py-5 sm:grid-cols-[13rem_1fr] sm:gap-6">
                <dt className="font-medium">{s.k}</dt>
                <dd className="avs-body leading-relaxed">{s.v}</dd>
              </div>
            ))}
          </dl>
          <Link href="/security" className="avs-arrow-link avs-reveal mt-7">
            Security and governance <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
