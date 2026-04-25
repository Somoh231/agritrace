import dynamic from "next/dynamic";

const CountyHeatmap = dynamic(() => import("@/components/maps/CountyHeatmap"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});
const FarmPlotMap = dynamic(() => import("@/components/maps/FarmPlotMap"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});
const MovementMap = dynamic(() => import("@/components/maps/MovementMap"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function MapPage() {
  return (
    <div className="space-y-4">
      <CountyHeatmap />
      <FarmPlotMap />
      <MovementMap />
    </div>
  );
}

