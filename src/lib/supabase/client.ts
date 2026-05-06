import { createBrowserClient } from "@supabase/ssr";

let browserClient:
  | ReturnType<typeof createBrowserClient>
  | undefined;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  if (typeof window !== "undefined") {
    console.log("[Agrivault] Supabase browser client", {
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_present: true,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_length: anonKey.length,
    });
  }

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
  );

  return browserClient;
}
