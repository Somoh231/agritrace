import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { normalizeHttpUrl } from "@/lib/supabase/env";

function matchesProtectedRoute(pathname: string, pattern: string) {
  return pathname === pattern || pathname.startsWith(`${pattern}/`);
}

function isProtectedPath(pathname: string): boolean {
  const roots = [
    "/command-center",
    "/county-dashboard",
    "/district-dashboard",
    "/executive-briefing",
    "/alerts",
    "/national-operations",
    "/farmers",
    "/cooperatives",
    "/geo-registry",
    "/verification-queue",
    "/registration-approvals",
    "/field-agents",
    "/field",
    "/inventory",
    "/operations",
    "/subsidies",
    "/production",
    "/compliance",
    "/reports",
    "/food-security",
    "/county-operations",
    "/rice",
    "/cocoa",
    "/map",
    "/national-heat-map",
    "/farm-profiles",
    "/inventory/equipment",
    "/inventory/warehouse",
    "/production/market-prices",
    "/search",
    "/activity",
    "/admin",
    "/dashboard",
  ];
  return roots.some((p) => matchesProtectedRoute(pathname, p));
}

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
    user = null;
  }

  if (isProtectedPath(pathname) && !user) {
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
