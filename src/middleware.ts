import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { ACCOUNT_UNAVAILABLE_PATH, roleFromProfile } from "@/lib/auth/profile-access";
import { assertPilotRouteAccess } from "@/lib/auth/workspace-access";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/http/request-context";
import { normalizeHttpUrl } from "@/lib/supabase/env";
import type { Profile } from "@/lib/supabase/types";

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
    "/transfers",
    "/registration-approvals",
    "/field-agents",
    "/field",
    "/inventory",
    "/operations",
    "/subsidies",
    "/production",
    "/compliance",
    "/reports",
    "/reporting",
    "/logistics",
    "/food-security",
    "/county-operations",
    "/rice",
    "/cocoa",
    "/map",
    "/national-heat-map",
    "/gis-intelligence",
    "/donor-dashboard",
    "/audit-tools",
    "/farm-profiles",
    "/inventory/equipment",
    "/inventory/warehouse",
    "/production/market-prices",
    "/search",
    "/activity",
    "/workspace",
    "/admin",
    "/dashboard",
    "/app",
  ];
  return roots.some((p) => matchesProtectedRoute(pathname, p));
}

export async function middleware(request: NextRequest) {
  const requestId = resolveRequestId(request);
  const response = NextResponse.next({ request });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  const pathname = request.nextUrl.pathname;

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
    const redirect = NextResponse.redirect(redirectUrl);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return redirect;
  }

  if (user && isProtectedPath(pathname)) {
    // Fail closed: a missing, deactivated or unreadable profile grants no access.
    let prof: Pick<Profile, "role" | "is_active"> | null = null;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .maybeSingle<Pick<Profile, "role" | "is_active">>();
      prof = data;
    } catch {
      prof = null;
    }
    const role = roleFromProfile(prof);
    if (!role) {
      const denied = request.nextUrl.clone();
      denied.pathname = ACCOUNT_UNAVAILABLE_PATH;
      denied.search = "";
      const redirect = NextResponse.redirect(denied);
      redirect.headers.set(REQUEST_ID_HEADER, requestId);
      return redirect;
    }

    // Role gates are unchanged; paths without a pilot gate pass (see assertPilotRouteAccess).
    const gate = assertPilotRouteAccess(role, pathname);
    if (!gate.ok) {
      const normalized = pathname.split("?")[0] ?? pathname;
      if (gate.redirectTo !== normalized) {
        const next = request.nextUrl.clone();
        next.pathname = gate.redirectTo;
        next.search = "";
        const redirect = NextResponse.redirect(next);
        redirect.headers.set(REQUEST_ID_HEADER, requestId);
        return redirect;
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
