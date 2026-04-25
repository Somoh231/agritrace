import dynamic from "next/dynamic";

const AuditTrail = dynamic(() => import("@/components/cocoa/AuditTrail"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function CocoaAuditPage() {
  return <AuditTrail />;
}

