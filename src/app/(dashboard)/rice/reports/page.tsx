import dynamic from "next/dynamic";

const MinistryReportsTable = dynamic(() => import("@/components/rice/MinistryReportsTable"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function RiceReportsPage() {
  return <MinistryReportsTable />;
}

