import { isAdminConsoleRole } from "@/lib/supabase/admin-access";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRoleWithDemoFallback } from "@/lib/supabase/temp-demo-profile-fallback";
import type { UserRole } from "@/lib/supabase/types";

/** Guards `/admin` APIs — ministry console roles + TEMP DEMO synthetic `admin`. */
export async function requireAdminConsole(): Promise<
  | { ok: true; userId: string; role: UserRole }
  | { ok: false; status: number; message: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, message: "Not authenticated." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  const role = resolveUserRoleWithDemoFallback(profile as { role: UserRole } | null, user);
  if (!isAdminConsoleRole(role)) {
    return { ok: false, status: 403, message: "Administrator access required." };
  }

  return { ok: true, userId: user.id, role };
}
