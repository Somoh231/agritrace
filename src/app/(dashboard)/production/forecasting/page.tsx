import MinistryNarrativePage from "@/components/operations/MinistryNarrativePage";

export default function YieldForecastingPage() {
  return (
    <MinistryNarrativePage
      title="Yield forecasting"
      description="Scenario engines blend remote sensing, rainfall anomalies, and historical yield curves."
    >
      <p>
        Connect national meteorological feeds and satellite NDVI stacks through the integrations console; forecasts publish as
        structured datasets consumed by this workspace.
      </p>
    </MinistryNarrativePage>
  );
}
