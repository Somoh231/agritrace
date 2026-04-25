import dynamic from "next/dynamic";

const FieldHome = dynamic(() => import("@/components/field/FieldHome"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] rounded-xl border border-gray-200 bg-white" />,
});

export default function FieldPage() {
  return <FieldHome />;
}

