import { NextResponse } from "next/server";

import { beginApiRequestAsync, rejectIfRateLimited } from "@/lib/http/api-response";
import { WORKFLOW_MUTATION_POLICY } from "@/lib/http/rate-limit-policies";
import { requireWorkflowPrincipal } from "@/lib/ops/server-permissions";

/**
 * Legacy fixture-verification endpoint.
 *
 * Canonical VRF rows are illustrative and cannot be mutated. Live queue rows carry an
 * operational_submissions UUID and must use /api/ops/workflows/submission so the state
 * transition, attribution, notification, and append-only audit records persist together.
 */
export async function POST(req: Request) {
  const principal = await requireWorkflowPrincipal();
  if (!principal.ok) {
    return NextResponse.json(
      { ok: false, code: principal.code, message: principal.message },
      { status: principal.status },
    );
  }

  const ctx = await beginApiRequestAsync(req, WORKFLOW_MUTATION_POLICY, principal.userId);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  return NextResponse.json(
    {
      ok: false,
      code: "illustrative_read_only",
      message:
        "Pilot verification fixtures are read-only. Persist decisions through a live operational submission.",
    },
    { status: 409 },
  );
}
