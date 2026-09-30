/**
 * Separation of duties: no self-approval, and capture roles never review.
 * Run with: npm run test:workflow
 */

import assert from "node:assert/strict";

import { mapUserRoleToOperationalPersona, resolveOperationalActor } from "@/lib/ops/current-actor";
import { canPerform, type OperationalWorkflowAction } from "@/lib/ops/permissions";
import { checkWorkflowPermission, REVIEW_DECISIONS, workflowStageForRole } from "@/lib/workflow/roles";
import type { UserRole } from "@/lib/supabase/types";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("separation of duties");

check("an author cannot approve, reject, return or archive their own submission (any stage)", () => {
  for (const stage of ["dao", "cac", "ministry"] as const) {
    for (const action of REVIEW_DECISIONS) {
      const r = checkWorkflowPermission({ stage, action, actorCounty: "Nimba", submissionCounty: "Nimba", isAuthor: true });
      assert.equal(r.ok, false, `${stage} ${action}`);
    }
  }
});

check("a different reviewer in scope still can", () => {
  const r = checkWorkflowPermission({ stage: "dao", action: "approve", actorCounty: "Nimba", submissionCounty: "Nimba", isAuthor: false });
  assert.equal(r.ok, true);
});

check("authors may still submit and comment on their own work", () => {
  assert.equal(checkWorkflowPermission({ stage: "clan", action: "submit", actorCounty: "Nimba", submissionCounty: "Nimba", isAuthor: true }).ok, true);
  assert.equal(checkWorkflowPermission({ stage: "dao", action: "comment", actorCounty: "Nimba", submissionCounty: "Nimba", isAuthor: true }).ok, true);
});

check("CLAN technicians and field agents map to a capture-only persona", () => {
  for (const role of ["clan_technician", "field_agent"] as UserRole[]) {
    assert.equal(mapUserRoleToOperationalPersona(role), "field_operator");
    assert.equal(workflowStageForRole(role), "clan");
  }
});

check("capture roles can perform no verification or custody action", () => {
  const actions: OperationalWorkflowAction[] = [
    "verification.approve", "verification.reject", "verification.escalate", "verification.request_revision",
    "verification.assign_investigation", "transfer.approve", "transfer.dispatch", "transfer.verify", "transfer.mark_received",
    "warehouse.adjust_status",
  ];
  for (const role of ["clan_technician", "field_agent"] as UserRole[]) {
    const actor = resolveOperationalActor({ id: "u", full_name: "Field", role, county: "Nimba" });
    for (const action of actions) {
      assert.equal(canPerform(actor, action, { rowCounty: "Nimba", verificationSubmissionType: "farmer_registration" }), false, `${role} ${action}`);
    }
  }
});

console.log(`${passed} checks passed`);
