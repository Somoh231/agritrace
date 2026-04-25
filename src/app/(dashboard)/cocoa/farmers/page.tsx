import dynamic from "next/dynamic";

const FarmerRegistryTable = dynamic(() => import("@/components/cocoa/FarmerRegistryTable"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function CocoaFarmersPage() {
  return <FarmerRegistryTable />;
}

