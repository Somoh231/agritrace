import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { assertPilotRouteAccess, needsPilotRoleGate } from "@/lib/auth/workspace-access";
import {
  assessOperationalAccess,
  type AccessRoleAssignment,
} from "@/lib/auth/access-readiness";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/http/request-context";
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

const RETIRED_PUBLIC_ROUTES = [
  "/about",
  "/africa",
  "/capabilities",
  "/contact",
  "/demo",
  "/docs",
  "/governance",
  "/government",
  "/integrations",
  "/liberia",
  "/news",
  "/partners",
  "/platform",
  "/platform-preview",
  "/pricing",
  "/request-demo",
  "/setup",
] as const;

function isRetiredPublicRoute(pathname: string): boolean {
  return RETIRED_PUBLIC_ROUTES.some((route) => matchesProtectedRoute(pathname, route));
}

export async function middleware(request: NextRequest) {
  const requestId = resolveRequestId(request);
  const response = NextResponse.next({ request });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    const redirect = NextResponse.redirect(loginUrl);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return redirect;
  }

  if (isRetiredPublicRoute(pathname)) {
    const notFoundUrl = request.nextUrl.clone();
    notFoundUrl.pathname = "/_not-found";
    notFoundUrl.search = "";
    const notFound = NextResponse.rewrite(notFoundUrl, { status: 404 });
    notFound.headers.set(REQUEST_ID_HEADER, requestId);
    return notFound;
  }

  const url = normalizeHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    // Fail closed: without identity configuration no protected surface may render.
    if (isProtectedPath(pathname)) {
      const unavailable = new NextResponse("AgriVault is temporarily unavailable. Contact your system administrator.", {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8", "retry-after": "300" },
      });
      unavailable.headers.set(REQUEST_ID_HEADER, requestId);
      return unavailable;
    }
    return response;
  }

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
    const { data: prof, error: profileError } = await supabase
      .from("profiles")
      .select("role,is_active,account_status,access_transition_status,organization_id,county,district,clan_or_field_area,deactivated_at,suspended_at")
      .eq("id", user.id)
      .maybeSingle();
    const [assignmentResult, warehouseResult] = await Promise.all([
      supabase
        .from("profile_role_assignments")
        .select("role,is_primary,starts_at,expires_at,ended_at")
        .eq("profile_id", user.id)
        .is("ended_at", null),
      supabase
        .from("warehouse_assignments")
        .select("warehouse_id", { count: "exact", head: true })
        .eq("profile_id", user.id),
    ]);
    const readiness =
      profileError || assignmentResult.error || warehouseResult.error
        ? null
        : assessOperationalAccess(
            {
              ...prof,
              has_warehouse_assignment: (warehouseResult.count ?? 0) > 0,
            },
            (assignmentResult.data ?? []) as AccessRoleAssignment[],
          );
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
