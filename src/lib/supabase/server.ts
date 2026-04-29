import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { normalizeHttpUrl } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();

  const url = normalizeHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Setting cookies can fail in Server Components during render.
          // Middleware will refresh the session cookies on the next request.
        }
      },
    },
  });
}

