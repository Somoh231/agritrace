import dynamic from "next/dynamic";

const PostHarvestLossAlerts = dynamic(() => import("@/components/rice/PostHarvestLossAlerts"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function RiceLossPage() {
  return <PostHarvestLossAlerts />;
}

