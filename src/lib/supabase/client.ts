import { createBrowserClient } from "@supabase/ssr";

import { normalizeHttpUrl } from "@/lib/supabase/env";

let browserClient:
  | ReturnType<typeof createBrowserClient>
  | undefined;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const url = normalizeHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}

