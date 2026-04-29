import { createClient } from "@supabase/supabase-js";

import { normalizeHttpUrl } from "@/lib/supabase/env";

export function getSupabaseAdminClient() {
  const url = normalizeHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

