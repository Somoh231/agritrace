import dynamic from "next/dynamic";

const LotRegisterTable = dynamic(() => import("@/components/cocoa/LotRegisterTable"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function CocoaLotsPage() {
  return <LotRegisterTable />;
}

