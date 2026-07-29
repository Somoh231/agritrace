import { isAdminConsoleRole } from "@/lib/supabase/admin-access";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

/** Guards `/admin` APIs using the authenticated, active database profile. */
export async function requireAdminConsole(): Promise<
  | { ok: true; userId: string; role: UserRole }
  | { ok: false; status: number; message: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, message: "Not authenticated." };

  const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", user.id).maybeSingle();

  const typedProfile = profile as { role: UserRole; is_active?: boolean | null } | null;
  const role = typedProfile?.role;
  if (!role || typedProfile?.is_active === false || !isAdminConsoleRole(role)) {
    return { ok: false, status: 403, message: "Administrator access required." };
  }

  return { ok: true, userId: user.id, role };
}
