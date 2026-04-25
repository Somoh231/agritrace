import dynamic from "next/dynamic";

const DiscrepanciesClient = dynamic(() => import("@/components/cocoa/DiscrepanciesClient"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function CocoaDiscrepanciesPage() {
  return <DiscrepanciesClient />;
}
