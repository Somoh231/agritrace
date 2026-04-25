import dynamic from "next/dynamic";

const InventoryLedgerClient = dynamic(() => import("@/components/cocoa/InventoryLedgerClient"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function CocoaInventoryPage() {
  return <InventoryLedgerClient />;
}
