import type { DaoWorkflowStatus } from "@/lib/dao/dao-workflow-types";

/** Pilot-standard labels for the DAO IndexedDB reporting queue (CLAN + DAO capture). */
export function pilotQueueStatusLabel(status: DaoWorkflowStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "pending_sync":
      return "Pending sync";
    case "submitted":
      return "Synced";
    case "failed":
      return "Sync failed";
    default:
      return status;
  }
}
