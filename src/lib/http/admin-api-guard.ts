import { NextResponse } from "next/server";

import { beginApiRequestAsync, rejectIfRateLimited, type ApiRequestContext } from "@/lib/http/api-response";
import { ADMIN_MUTATION_POLICY, ADMIN_READ_POLICY } from "@/lib/http/rate-limit-policies";
import { requireAdminConsole } from "@/lib/supabase/require-admin-console";
import type { UserRole } from "@/lib/supabase/types";

type AdminGuardSuccess = {
  ok: true;
  userId: string;
  role: UserRole;
  ctx: ApiRequestContext;
};

type AdminGuardFailure = {
  ok: false;
  response: NextResponse;
};

export async function guardAdminApiRequest(
  request: Request,
  kind: "read" | "mutation" = "read",
): Promise<AdminGuardSuccess | AdminGuardFailure> {
  const guard = await requireAdminConsole();
  if (!guard.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: guard.message }, { status: guard.status }),
    };
  }

  const ctx = await beginApiRequestAsync(
    request,
    kind === "mutation" ? ADMIN_MUTATION_POLICY : ADMIN_READ_POLICY,
    guard.userId,
  );
  const limited = rejectIfRateLimited(ctx);
  if (limited) return { ok: false, response: limited };

  return { ok: true, userId: guard.userId, role: guard.role, ctx };
}
