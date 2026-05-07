import type { TransferOrderView } from "@/lib/logistics/types";

import { warehouseCountyForMinistryCode } from "@/lib/ops/warehouse-scope";

/** Institutional desk personas — map from DB roles via `resolveOperationalActor`. */
export type OperationalPersona =
  | "dao_officer"
  | "county_supervisor"
  | "warehouse_manager"
  | "national_admin"
  | "donor_observer"
  | "investigation_officer";

export type OperationalActor = {
  id: string;
  displayName: string;
  role: OperationalPersona;
  county: string | null;
  /** Primary ministry warehouse code when assigned; optional scope for managers. */
  warehouseMinistryCode: string | null;
};

export type OperationalWorkflowAction =
  | "verification.approve"
  | "verification.reject"
  | "verification.escalate"
  | "verification.request_revision"
  | "verification.assign_investigation"
  | "transfer.mark_received"
  | "transfer.verify"
  | "transfer.escalate"
  | "transfer.approve"
  | "transfer.dispatch"
  | "transfer.reject"
  | "transfer.investigate"
  | "warehouse.adjust_status"
  | "warehouse.flag_stock_pressure"
  | "donor.export_audit_bundle"
  | "gis.view_operational_layers";

export type OperationalPermissionContext = {
  /** Queue row county */
  rowCounty?: string | null;
  verificationSubmissionType?: string;
  verificationStatus?: string;
  relatedWarehouseMinistryCode?: string | null;
  transfer?: Pick<TransferOrderView, "fromMinistryCode" | "toMinistryCode" | "status"> & {
    corridorCounty?: string | null;
  };
};

const ALL_ACTIONS: OperationalWorkflowAction[] = [
  "verification.approve",
  "verification.reject",
  "verification.escalate",
  "verification.request_revision",
  "verification.assign_investigation",
  "transfer.mark_received",
  "transfer.verify",
  "transfer.escalate",
  "transfer.approve",
  "transfer.dispatch",
  "transfer.reject",
  "transfer.investigate",
  "warehouse.adjust_status",
  "warehouse.flag_stock_pressure",
  "donor.export_audit_bundle",
  "gis.view_operational_layers",
];

/** DAO-facing capture types only — not donor manifests or sealed warehouse corridors. */
const DAO_FIELD_SUBMISSIONS = new Set([
  "farmer_registration",
  "dao_inspection",
  "gps_verification",
]);

function normCounty(v: string | null | undefined): string | null {
  const t = v?.trim();
  return t ? t.toLowerCase() : null;
}

function scopedCounty(actor: OperationalActor, rowCounty: string | null | undefined): boolean {
  const ac = normCounty(actor.county);
  const rc = normCounty(rowCounty ?? undefined);
  if (actor.role === "national_admin") return true;
  if (!ac || !rc) return false;
  return ac === rc;
}

function transferTouchesCounty(t: NonNullable<OperationalPermissionContext["transfer"]>, county: string | null): boolean {
  if (!county) return false;
  const c = normCounty(county);
  const cc = normCounty(t.corridorCounty ?? undefined);
  if (cc && cc === c) return true;
  const fc = normCounty(warehouseCountyForMinistryCode(t.fromMinistryCode) ?? undefined);
  const tc = normCounty(warehouseCountyForMinistryCode(t.toMinistryCode) ?? undefined);
  return fc === c || tc === c;
}

function transferTouchesWarehouse(t: NonNullable<OperationalPermissionContext["transfer"]>, code: string | null): boolean {
  if (!code) return false;
  return t.fromMinistryCode === code || t.toMinistryCode === code;
}

export function canPerform(actor: OperationalActor, action: OperationalWorkflowAction, context?: OperationalPermissionContext): boolean {
  if (actor.role === "national_admin") return true;

  if (actor.role === "donor_observer") {
    return action === "donor.export_audit_bundle" || action === "gis.view_operational_layers";
  }

  const ctx = context ?? {};

  switch (action) {
    case "gis.view_operational_layers":
      return true;

    case "donor.export_audit_bundle":
      return actor.role === "county_supervisor" || actor.role === "investigation_officer" || actor.role === "warehouse_manager";

    case "verification.approve": {
      if (actor.role === "investigation_officer") {
        const st = ctx.verificationStatus ?? "";
        return st === "escalated" && Boolean(normCounty(actor.county) ? scopedCounty(actor, ctx.rowCounty) : true);
      }
      if (actor.role === "county_supervisor") {
        return scopedCounty(actor, ctx.rowCounty);
      }
      if (actor.role === "dao_officer") {
        if (!scopedCounty(actor, ctx.rowCounty)) return false;
        const st = ctx.verificationSubmissionType ?? "";
        return DAO_FIELD_SUBMISSIONS.has(st);
      }
      if (actor.role === "warehouse_manager") return false;
      return false;
    }

    case "verification.request_revision": {
      if (actor.role === "county_supervisor") return scopedCounty(actor, ctx.rowCounty);
      if (actor.role === "dao_officer") {
        if (!scopedCounty(actor, ctx.rowCounty)) return false;
        const st = ctx.verificationSubmissionType ?? "";
        return DAO_FIELD_SUBMISSIONS.has(st);
      }
      if (actor.role === "warehouse_manager") {
        if ((ctx.verificationSubmissionType ?? "") !== "warehouse_transfer_confirmation") return false;
        if (!ctx.relatedWarehouseMinistryCode || !actor.county) return false;
        const whCounty = warehouseCountyForMinistryCode(ctx.relatedWarehouseMinistryCode);
        return normCounty(whCounty) === normCounty(actor.county);
      }
      return false;
    }

    case "verification.reject":
    case "verification.assign_investigation": {
      if (actor.role === "county_supervisor") return scopedCounty(actor, ctx.rowCounty);
      if (actor.role === "investigation_officer") {
        const st = ctx.verificationStatus ?? "";
        if (!["escalated", "under_review"].includes(st)) return action === "verification.assign_investigation";
        return normCounty(actor.county) ? scopedCounty(actor, ctx.rowCounty) : true;
      }
      return false;
    }

    case "verification.escalate": {
      if (actor.role === "county_supervisor") return scopedCounty(actor, ctx.rowCounty);
      if (actor.role === "investigation_officer") return normCounty(actor.county) ? scopedCounty(actor, ctx.rowCounty) : true;
      return false;
    }

    case "transfer.mark_received": {
      if (!ctx.transfer || !actor.county) return false;
      if (actor.role === "warehouse_manager") {
        if (actor.warehouseMinistryCode) return ctx.transfer.toMinistryCode === actor.warehouseMinistryCode;
        const recvCounty = warehouseCountyForMinistryCode(ctx.transfer.toMinistryCode);
        return normCounty(recvCounty) === normCounty(actor.county);
      }
      if (actor.role === "county_supervisor") return transferTouchesCounty(ctx.transfer, actor.county);
      return false;
    }

    case "transfer.verify": {
      if (!ctx.transfer) return false;
      if (actor.role === "county_supervisor") return actor.county ? transferTouchesCounty(ctx.transfer, actor.county) : false;
      return false;
    }

    case "transfer.escalate":
    case "transfer.reject":
    case "transfer.investigate": {
      if (!ctx.transfer) return false;
      if (actor.role === "county_supervisor") return scopedCounty(actor, ctx.transfer.corridorCounty ?? ctx.rowCounty);
      if (actor.role === "investigation_officer") return normCounty(actor.county) ? transferTouchesCounty(ctx.transfer, actor.county) : true;
      return false;
    }

    case "transfer.approve":
    case "transfer.dispatch": {
      if (!ctx.transfer) return false;
      if (actor.role === "county_supervisor") return actor.county ? transferTouchesCounty(ctx.transfer, actor.county) : false;
      if (actor.role === "warehouse_manager") {
        if (actor.warehouseMinistryCode) return transferTouchesWarehouse(ctx.transfer, actor.warehouseMinistryCode);
        return actor.county ? transferTouchesCounty(ctx.transfer, actor.county) : false;
      }
      return false;
    }

    case "warehouse.adjust_status":
      return actor.role === "warehouse_manager" || actor.role === "county_supervisor";

    case "warehouse.flag_stock_pressure":
      return actor.role === "warehouse_manager" || actor.role === "county_supervisor";

    default:
      return false;
  }
}

export function getAllowedActions(actor: OperationalActor, context?: OperationalPermissionContext): OperationalWorkflowAction[] {
  return ALL_ACTIONS.filter((a) => canPerform(actor, a, context));
}

export function explainPermission(actor: OperationalActor, action: OperationalWorkflowAction, context?: OperationalPermissionContext): string {
  if (canPerform(actor, action, context)) {
    return "Action permitted under current institutional routing.";
  }
  if (actor.role === "donor_observer") {
    return "Donor observer posture is read-only — workflow mutations require ministry or logistics custody roles.";
  }
  if (actor.role === "national_admin") {
    return "Unexpected denial — escalate to engineering.";
  }
  switch (action) {
    case "verification.approve":
      if (actor.role === "dao_officer") return "DAO officers may approve field-captured artefacts only (registration / inspection / GPS) within their assigned county.";
      if (actor.role === "investigation_officer") return "Investigation officers approve only escalated queue artefacts.";
      return "Insufficient desk clearance for verification approval.";
    case "verification.reject":
    case "verification.escalate":
    case "verification.assign_investigation":
      return "County supervisors handle routine dispositions; investigation desks handle escalations — confirm county scope or escalation state.";
    case "verification.request_revision":
      if (actor.role === "warehouse_manager") return "Warehouse managers may request revisions only on warehouse transfer confirmations tied to hubs in their county.";
      return "Revision routing requires DAO / county / warehouse scope aligned to the submission.";
    case "transfer.mark_received":
      return "Receiving confirmation requires warehouse manager custody aligned to destination hub county or assigned ministry warehouse code.";
    case "transfer.verify":
      return "National reconcile verification requires county supervisor scope over this corridor.";
    case "transfer.escalate":
      return "Escalation requires county supervisor or investigation desk scope on this corridor.";
    case "transfer.approve":
    case "transfer.dispatch":
      return "Corridor approval/dispatch requires county logistics scope or warehouse custody association.";
    default:
      return "Action denied — operational scope or role does not align with ministry routing.";
  }
}
