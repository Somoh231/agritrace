import Link from "next/link";

import MinistryNarrativePage from "@/components/operations/MinistryNarrativePage";

export default function PdfExportsPage() {
  return (
    <MinistryNarrativePage
      title="PDF exports"
      description="High-resolution ministry-ready decks rendered via server-side PDF pipelines."
    >
      <p className="mb-4">Jump into the rice reporting workspace for composable PDF bundles.</p>
      <Link href="/rice/reports" className="text-emerald-400 hover:text-emerald-300 font-medium">
        Open rice PDF composer →
      </Link>
    </MinistryNarrativePage>
  );
}
