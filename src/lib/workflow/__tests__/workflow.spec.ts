/**
 * Lightweight, framework-free unit checks for the workflow engine's pure logic.
 * Run with:  npm run test:workflow   (uses tsx)
 *
 * Covers transition legality (status model) and role/scope authorization (roles).
 */

import assert from "node:assert/strict";

import { checkWorkflowPermission, workflowStageForRole } from "../roles";
import { allowedActionsFor, computeSubmissionTransition } from "../status-model";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("workflow status model — transitions");

check("submit moves draft → submitted", () => {
  const r = computeSubmissionTransition("draft", "submit", "clan");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.nextStatus, "submitted");
});

check("DAO approves submitted → dao_approved", () => {
  const r = computeSubmissionTransition("submitted", "approve", "dao");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.nextStatus, "dao_approved");
});

check("CAC cannot approve a freshly submitted item (must clear DAO first)", () => {
  const r = computeSubmissionTransition("submitted", "approve", "cac");
  assert.equal(r.ok, false);
});

check("CAC approves dao_approved → cac_approved", () => {
  const r = computeSubmissionTransition("dao_approved", "approve", "cac");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.nextStatus, "cac_approved");
});

check("Ministry approves cac_approved → ministry_approved", () => {
  const r = computeSubmissionTransition("cac_approved", "approve", "ministry");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.nextStatus, "ministry_approved");
});

check("Ministry approves escalated → ministry_approved", () => {
  const r = computeSubmissionTransition("escalated", "approve", "ministry");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.nextStatus, "ministry_approved");
});

check("DAO request_corrections → dao_corrections_requested", () => {
  const r = computeSubmissionTransition("submitted", "request_corrections", "dao");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.nextStatus, "dao_corrections_requested");
});

check("resubmit from corrections → submitted", () => {
  const r = computeSubmissionTransition("dao_corrections_requested", "submit", "dao");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.nextStatus, "submitted");
});

check("assign_reviewer submitted → dao_review", () => {
  const r = computeSubmissionTransition("submitted", "assign_reviewer", "dao");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.nextStatus, "dao_review");
});

check("comment never changes state and is allowed mid-flow", () => {
  const r = computeSubmissionTransition("cac_review", "comment", "cac");
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.nextStatus, "cac_review");
    assert.equal(r.changed, false);
  }
});

check("archived is read-only (no comment)", () => {
  const r = computeSubmissionTransition("archived", "comment", "ministry");
  assert.equal(r.ok, false);
});

check("ministry archives a final state", () => {
  const r = computeSubmissionTransition("ministry_approved", "archive", "ministry");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.nextStatus, "archived");
});

check("DAO cannot approve a cac_approved item (no stage match)", () => {
  const r = computeSubmissionTransition("cac_approved", "approve", "dao");
  assert.equal(r.ok, false);
});

check("allowedActionsFor(submitted, dao) includes approve/reject/escalate/assign", () => {
  const a = allowedActionsFor("submitted", "dao");
  for (const x of ["approve", "reject", "escalate", "assign_reviewer", "request_corrections"]) {
    assert.ok(a.includes(x as never), `expected ${x}`);
  }
});

console.log("workflow roles — stage mapping & permissions");

check("role → stage mapping", () => {
  assert.equal(workflowStageForRole("clan_technician"), "clan");
  assert.equal(workflowStageForRole("dao_officer"), "dao");
  assert.equal(workflowStageForRole("county_agriculture_coordinator"), "cac");
  assert.equal(workflowStageForRole("ministry_officer"), "ministry");
  assert.equal(workflowStageForRole("auditor"), "auditor");
  assert.equal(workflowStageForRole("donor_observer"), "donor");
});

check("auditor is read-only", () => {
  const r = checkWorkflowPermission({ stage: "auditor", action: "approve", actorCounty: "Bong", submissionCounty: "Bong" });
  assert.equal(r.ok, false);
});

check("donor is read-only", () => {
  const r = checkWorkflowPermission({ stage: "donor", action: "comment", actorCounty: null, submissionCounty: "Bong" });
  assert.equal(r.ok, false);
});

check("DAO can act only within county scope", () => {
  const inScope = checkWorkflowPermission({ stage: "dao", action: "approve", actorCounty: "Bong", submissionCounty: "Bong" });
  const outScope = checkWorkflowPermission({ stage: "dao", action: "approve", actorCounty: "Bong", submissionCounty: "Lofa" });
  assert.equal(inScope.ok, true);
  assert.equal(outScope.ok, false);
});

check("CLAN cannot review", () => {
  const r = checkWorkflowPermission({ stage: "clan", action: "approve", actorCounty: "Bong", submissionCounty: "Bong" });
  assert.equal(r.ok, false);
});

check("Ministry is not county-bound", () => {
  const r = checkWorkflowPermission({ stage: "ministry", action: "approve", actorCounty: null, submissionCounty: "Lofa" });
  assert.equal(r.ok, true);
});

check("author can comment on own out-of-county submission", () => {
  const r = checkWorkflowPermission({ stage: "clan", action: "comment", actorCounty: "Bong", submissionCounty: "Lofa", isAuthor: true });
  assert.equal(r.ok, true);
});

console.log(`\nAll ${passed} workflow checks passed.`);
