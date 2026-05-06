import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { normalizeHttpUrl } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  if (pathname === "/" && !request.cookies.get("av_exp_home_hero")) {
    if (process.env.NEXT_PUBLIC_ENABLE_HOMEPAGE_EXPERIMENT !== "false") {
      const variant = Math.random() < 0.5 ? "control" : "authority";
      response.cookies.set("av_exp_home_hero", variant, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 90,
      });
    }
  }

  const url = normalizeHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Allow clean startup before Supabase is configured.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Edge/network outages must not hard-fail the whole site; treat as signed-out.
    user = null;
  }

  const isProtected =
    pathname.startsWith("/national-operations") ||
    pathname.startsWith("/farmers") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/county-operations") ||
    pathname.startsWith("/field-agents") ||
    pathname.startsWith("/food-security") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/rice") ||
    pathname.startsWith("/cocoa") ||
    pathname.startsWith("/field") ||
    pathname.startsWith("/map") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/system-health") ||
    pathname.startsWith("/dashboard");

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

