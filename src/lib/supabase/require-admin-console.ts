import { roleFromProfile } from "@/lib/auth/profile-access";
import { isAdminConsoleRole } from "@/lib/supabase/admin-access";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/types";

/** Guards `/admin` APIs — ministry console roles from an active profile row only. */
export async function requireAdminConsole(): Promise<
  | { ok: true; userId: string; role: UserRole }
  | { ok: false; status: number; message: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, message: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle<Pick<Profile, "role" | "is_active">>();

  const role = roleFromProfile(profile);
  if (!role || !isAdminConsoleRole(role)) {
    return { ok: false, status: 403, message: "Administrator access required." };
  }

  return { ok: true, userId: user.id, role };
}
