import MinistryNarrativePage from "@/components/operations/MinistryNarrativePage";
import Link from "next/link";

export default function DonorReportingPage() {
  return (
    <MinistryNarrativePage
      title="Donor reporting"
      description="Curated analytics packs for development partners — scoped via donor_partner role policies."
    >
      <p>
        Layer aggregated farmer counts, input throughput, and verified subsidy disbursements into templated donor dashboards while
        preserving sovereign redaction rules.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/donor-dashboard" className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-[12px] text-emerald-100 hover:bg-white/[0.06]">
          Open donor dashboard →
        </Link>
        <a href="/api/reports/donor-programme" className="rounded-lg border border-emerald-700/45 bg-emerald-950/40 px-4 py-2 text-[12px] text-emerald-100 hover:bg-emerald-950/60">
          Download donor PDF →
        </a>
      </div>
    </MinistryNarrativePage>
  );
}
