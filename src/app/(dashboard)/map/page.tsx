import dynamic from "next/dynamic";

const MAP_SKELETON = "min-h-[240px] rounded-xl border border-white/10 bg-white/[0.03]";

const CountyHeatmap = dynamic(() => import("@/components/maps/CountyHeatmap"), {
  ssr: false,
  loading: () => <div className={MAP_SKELETON} />,
});
const FarmPlotMap = dynamic(() => import("@/components/maps/FarmPlotMap"), {
  ssr: false,
  loading: () => <div className={MAP_SKELETON} />,
});
const MovementMap = dynamic(() => import("@/components/maps/MovementMap"), {
  ssr: false,
  loading: () => <div className={MAP_SKELETON} />,
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

