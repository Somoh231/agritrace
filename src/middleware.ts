import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { assertPilotRouteAccess, needsPilotRoleGate } from "@/lib/auth/workspace-access";
import { assessOperationalAccess } from "@/lib/auth/access-readiness";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/http/request-context";
import { normalizeHttpUrl } from "@/lib/supabase/env";
import type { UserRole } from "@/lib/supabase/types";

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
  ];
  return roots.some((p) => matchesProtectedRoute(pathname, p));
}

export async function middleware(request: NextRequest) {
  const requestId = resolveRequestId(request);
  const response = NextResponse.next({ request });
  response.headers.set(REQUEST_ID_HEADER, requestId);
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
    const redirect = NextResponse.redirect(redirectUrl);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return redirect;
  }

  if (user && isProtectedPath(pathname)) {
    let { data: prof, error: profileError } = await supabase
      .from("profiles")
      .select("role,is_active,account_status,organization_id,county,district,clan_or_field_area")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) {
      const legacy = await supabase
        .from("profiles")
        .select("role,is_active,organization_id,county,district")
        .eq("id", user.id)
        .maybeSingle();
      prof = legacy.data as typeof prof;
      profileError = legacy.error;
    }
    const assignmentResult = await supabase
      .from("profile_role_assignments")
      .select("role")
      .eq("profile_id", user.id)
      .is("removed_at", null);
    const roles =
      assignmentResult.error || !assignmentResult.data
        ? prof?.role
          ? [prof.role as UserRole]
          : []
        : assignmentResult.data.map((item: { role: UserRole }) => item.role);
    const readiness = profileError ? null : assessOperationalAccess(prof, roles);
    if (!readiness?.ok) {
      const next = request.nextUrl.clone();
      next.pathname = "/login";
      next.search = "";
      next.searchParams.set("error", readiness?.code ?? "profile_incomplete");
      const redirect = NextResponse.redirect(next);
      redirect.headers.set(REQUEST_ID_HEADER, requestId);
      return redirect;
    }
    if (needsPilotRoleGate(pathname)) {
      const role = readiness.role;
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
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
