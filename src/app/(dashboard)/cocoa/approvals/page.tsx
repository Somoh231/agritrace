import dynamic from "next/dynamic";

const ApprovalsClient = dynamic(() => import("@/components/cocoa/ApprovalsClient"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function CocoaApprovalsPage() {
  return <ApprovalsClient />;
}
