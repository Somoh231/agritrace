/** Run with: npm run test:gis */
import assert from "node:assert/strict";

import { boundaryValidationError, buildOperationalBoundaryRecord, estimateAreasSqm, polygonFromPoints } from "../operational-boundary-math";
import type { OperationalBoundaryPoint } from "../operational-boundary-types";

const at = (latitude: number, longitude: number): OperationalBoundaryPoint => ({
  latitude,
  longitude,
  timestamp: "2026-09-23T00:00:00Z",
  accuracyM: 4,
});

// ~100 m x ~100 m square near Gbarnga, Bong County.
const square = [at(7.0, -9.47), at(7.0, -9.4691), at(7.0009, -9.4691), at(7.0009, -9.47)];

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

check("valid square is accepted with a plausible area (~1 ha)", () => {
  assert.equal(boundaryValidationError(square), null);
  const ha = estimateAreasSqm(polygonFromPoints(square)!).hectares;
  assert.ok(ha > 0.9 && ha < 1.1, `area ${ha} ha`);
  assert.ok(buildOperationalBoundaryRecord({ points: square }));
});

check("fewer than three distinct corners is rejected", () => {
  assert.match(boundaryValidationError([square[0]!, square[0]!, square[1]!])!, /three different corners/);
});

check("self-intersecting bow-tie outline is rejected", () => {
  const bowTie = [square[0]!, square[2]!, square[1]!, square[3]!];
  assert.match(boundaryValidationError(bowTie)!, /crosses itself/);
  assert.equal(buildOperationalBoundaryRecord({ points: bowTie }), null);
});

check("GPS garbage outside Liberia (0,0) is rejected", () => {
  assert.match(boundaryValidationError([at(0, 0), square[1]!, square[2]!])!, /outside Liberia/);
});

check("near-zero area (collinear corners) is rejected", () => {
  assert.match(boundaryValidationError([at(7.0, -9.47), at(7.0001, -9.47), at(7.0002, -9.47)])!, /too small/);
});

console.log(`\nAll ${passed} GIS boundary checks passed.`);
