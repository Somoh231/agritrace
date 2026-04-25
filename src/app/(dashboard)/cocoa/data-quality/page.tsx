import dynamic from "next/dynamic";

const DataQualityClient = dynamic(() => import("@/components/cocoa/DataQualityClient"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function CocoaDataQualityPage() {
  return <DataQualityClient />;
}
