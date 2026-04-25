import dynamic from "next/dynamic";

const MovementLedger = dynamic(() => import("@/components/cocoa/MovementLedger"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function CocoaMovementsPage() {
  return <MovementLedger />;
}

