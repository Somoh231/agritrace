import { NextResponse } from "next/server";

import { postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { parseJsonObject } from "@/lib/http/api-security";
import { apiHeaders, beginApiRequestAsync, rejectIfRateLimited } from "@/lib/http/api-response";
import { ADMIN_MUTATION_POLICY } from "@/lib/http/rate-limit-policies";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const ctx = await beginApiRequestAsync(request, ADMIN_MUTATION_POLICY, user.id);
  const limited = rejectIfRateLimited(ctx);
  if (limited) return limited;
  const headers = apiHeaders(ctx);
  const parsed = await parseJsonObject(request, 4_000);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status, headers });

  const role = (parsed.body as { role?: UserRole }).role;
  if (!role) return NextResponse.json({ error: "Select an assigned role." }, { status: 400, headers });

  const result = await supabase.rpc("select_active_workforce_role", {
    selected_role: role,
    audit_request_id: ctx.requestId,
  });
  if (result.error) {
    return NextResponse.json(
      { error: "That role is not assigned to this active account." },
      { status: 403, headers },
    );
  }

  return NextResponse.json({ ok: true, role, redirectTo: postLoginHomeForRole(role) }, { headers });
}
