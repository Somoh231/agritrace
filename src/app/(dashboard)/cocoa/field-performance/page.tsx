import dynamic from "next/dynamic";

const FieldPerformanceClient = dynamic(() => import("@/components/cocoa/FieldPerformanceClient"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function CocoaFieldPerformancePage() {
  return <FieldPerformanceClient />;
}
