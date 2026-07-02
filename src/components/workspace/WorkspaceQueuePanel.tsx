import type { ReactNode } from "react";

import { DashboardPanel, SectionHeader } from "@/components/enterprise";

export default function WorkspaceQueuePanel({
  kicker,
  title,
  subtitle,
  action,
  children,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <DashboardPanel>
      <SectionHeader kicker={kicker} title={title} subtitle={subtitle} action={action} />
      <div className="mt-4 space-y-0.5">{children}</div>
    </DashboardPanel>
  );
}
