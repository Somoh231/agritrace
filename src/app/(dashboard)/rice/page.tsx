import dynamic from "next/dynamic";

const NationalDashboard = dynamic(() => import("@/components/rice/NationalDashboard"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function RiceDashboardPage() {
  return <NationalDashboard />;
}

