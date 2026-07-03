import ReportingWorkspaceView from "@/components/reporting/ReportingWorkspaceView";
import { normalizeReportingTab } from "@/components/reporting/reporting-workspace-config";

export default async function ReportingWorkspacePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const tabRaw = typeof sp.tab === "string" ? sp.tab : Array.isArray(sp.tab) ? sp.tab[0] : undefined;
  const tab = normalizeReportingTab(tabRaw);

  return <ReportingWorkspaceView tab={tab} />;
}
