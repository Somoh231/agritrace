import MinistryNarrativePage from "@/components/operations/MinistryNarrativePage";

export default function ComplianceReportsPage() {
  return (
    <MinistryNarrativePage
      title="Compliance reports"
      description="Automated PDF dossiers bundle audit excerpts, procurement attestations, and anomaly resolutions."
    >
      <p>Wire scheduled jobs via Supabase Edge Functions or external reporting fabric to publish signed PDF packages.</p>
    </MinistryNarrativePage>
  );
}
