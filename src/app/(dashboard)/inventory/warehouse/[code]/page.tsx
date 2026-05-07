import WarehouseWorkspaceDetail from "@/components/inventory/WarehouseWorkspaceDetail";

export default function WarehouseDetailPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code ?? "").trim();
  return <WarehouseWorkspaceDetail code={code || "UNKNOWN"} />;
}
