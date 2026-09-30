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
  /** The budget this request was counted against (drives headers and 429s). */
  policy: RateLimitPolicy;
};

type ApiInit = {
  status?: number;
  policy?: RateLimitPolicy;
  userId?: string | null;
};

/** Standard entry for route handlers — attaches request id + rate limit snapshot (memory). */
export function beginApiRequest(request: Request, policy?: RateLimitPolicy, userId?: string | null): ApiRequestContext {
  const requestId = resolveRequestId(request);
  const effective = policy ?? DEFAULT_POLICY;
  const rateLimit = checkRateLimit(clientRateLimitKey(request, userId), effective);
  return { requestId, rateLimit, policy: effective };
}

/** Production entry — distributed store when Redis/KV is configured. */
export async function beginApiRequestAsync(
  request: Request,
  policy?: RateLimitPolicy,
  userId?: string | null,
): Promise<ApiRequestContext> {
  const requestId = resolveRequestId(request);
  const effective = policy ?? DEFAULT_POLICY;
  const rateLimit = await checkRateLimitDistributed(clientRateLimitKey(request, userId), effective);
  return { requestId, rateLimit, policy: effective };
}

export function apiHeaders(ctx: ApiRequestContext, policy?: RateLimitPolicy): Record<string, string> {
  return withRequestIdHeader(
    {
      ...rateLimitPolicyHeaders(policy ?? ctx.policy),
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
  const retryAfter = Math.max(1, Math.ceil((ctx.rateLimit.resetAt - Date.now()) / 1000));
  const res = apiJson(ctx, { error: "Too many requests. Please retry shortly.", retryAfterSeconds: retryAfter }, { status: 429 });
  res.headers.set("Retry-After", String(retryAfter));
  return res;
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
