import dynamic from "next/dynamic";

const ProductionRecordsTable = dynamic(() => import("@/components/rice/ProductionRecordsTable"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function RiceProductionRecordsPage() {
  return <ProductionRecordsTable />;
}

