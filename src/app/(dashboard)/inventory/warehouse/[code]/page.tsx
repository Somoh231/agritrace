import WarehouseWorkspaceDetail from "@/components/inventory/WarehouseWorkspaceDetail";

export default async function WarehouseDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode ?? "").trim();
  return <WarehouseWorkspaceDetail code={code || "UNKNOWN"} />;
}
