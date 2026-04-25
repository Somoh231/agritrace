import dynamic from "next/dynamic";

const EUDRChecklist = dynamic(() => import("@/components/cocoa/EUDRChecklist"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function CocoaEudrPage() {
  return <EUDRChecklist />;
}

