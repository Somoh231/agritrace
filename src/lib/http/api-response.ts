import { NextResponse } from "next/server";

import { API_ERROR_GENERIC } from "@/lib/http/api-security";
import { clientRateLimitKey, resolveRequestId, withRequestIdHeader } from "@/lib/http/request-context";
import {
  checkRateLimit,
  checkRateLimitDistributed,
  DEFAULT_POLICY,
  rateLimitHeaders,
  rateLimitPolicyHeaders,
  type RateLimitPolicy,
  type RateLimitResult,
} from "@/lib/http/rate-limit";

export type ApiRequestContext = {
  requestId: string;
  rateLimit: RateLimitResult;
};

type ApiInit = {
  status?: number;
  policy?: RateLimitPolicy;
  userId?: string | null;
};

/** Standard entry for route handlers — attaches request id + rate limit snapshot (memory). */
export function beginApiRequest(request: Request, policy?: RateLimitPolicy, userId?: string | null): ApiRequestContext {
  const requestId = resolveRequestId(request);
  const rateLimit = checkRateLimit(clientRateLimitKey(request, userId), policy);
  return { requestId, rateLimit };
}

/** Production entry — distributed store when Redis/KV is configured. */
export async function beginApiRequestAsync(
  request: Request,
  policy?: RateLimitPolicy,
  userId?: string | null,
): Promise<ApiRequestContext> {
  const requestId = resolveRequestId(request);
  const rateLimit = await checkRateLimitDistributed(clientRateLimitKey(request, userId), policy ?? DEFAULT_POLICY);
  return { requestId, rateLimit };
}

export function apiHeaders(ctx: ApiRequestContext, policy?: RateLimitPolicy): Record<string, string> {
  return withRequestIdHeader(
    {
      ...rateLimitPolicyHeaders(policy),
      ...rateLimitHeaders(ctx.rateLimit),
    },
    ctx.requestId,
  );
}

export function apiJson<T>(ctx: ApiRequestContext, body: T, init?: ApiInit): NextResponse {
  const status = init?.status ?? 200;
  return NextResponse.json(body, {
    status,
    headers: apiHeaders(ctx, init?.policy),
  });
}

export function apiError(
  ctx: ApiRequestContext,
  message: string,
  status: number,
  init?: Omit<ApiInit, "status">,
): NextResponse {
  return apiJson(ctx, { error: message }, { status, ...init });
}

export function apiTooManyRequests(ctx: ApiRequestContext): NextResponse {
  return apiJson(
    ctx,
    { error: "Too many requests. Please retry shortly." },
    { status: 429 },
  );
}

export function apiInternalError(ctx: ApiRequestContext): NextResponse {
  return apiError(ctx, API_ERROR_GENERIC, 500);
}

export function rejectIfRateLimited(ctx: ApiRequestContext): NextResponse | null {
  if (!ctx.rateLimit.allowed) return apiTooManyRequests(ctx);
  return null;
}

export function binaryResponse(
  ctx: ApiRequestContext,
  body: ArrayBuffer | Uint8Array,
  headers: Record<string, string>,
  policy?: RateLimitPolicy,
): NextResponse {
  return new NextResponse(body as BodyInit, {
    status: 200,
    headers: {
      ...apiHeaders(ctx, policy),
      ...headers,
    },
  });
}
