/**
 * API budgets are per endpoint family: analytics traffic never spends the AI
 * assistant's budget, and one user's AI usage never blocks another user on the
 * same IP. Runs against a production build wired to the stub Supabase.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";

import { cookieHeader, type StubUser } from "./support/session";

const analytics = (request: APIRequestContext, user: StubUser) =>
  request.post("/api/analytics?path=%2Ffarmers", {
    headers: { ...cookieHeader(user), "content-type": "application/json" },
    data: { event: "page_view" },
  });

const aiChat = (request: APIRequestContext, user: StubUser) =>
  request.post("/api/ai/chat", {
    headers: { ...cookieHeader(user), "content-type": "application/json" },
    data: { messages: [{ role: "user", content: "status" }] },
  });

test("100 analytics events do not make the AI assistant return 429", async ({ request }) => {
  for (let i = 0; i < 100; i++) expect((await analytics(request, "u-quota")).status()).not.toBe(429);
  expect((await aiChat(request, "u-quota")).status()).not.toBe(429);
});

test("exhausting the AI budget returns a clear 429 and leaves analytics working", async ({ request }) => {
  let last = await aiChat(request, "u-quota-2");
  for (let i = 1; i <= 20; i++) last = await aiChat(request, "u-quota-2");
  expect(last.status()).toBe(429);
  expect(Number(last.headers()["retry-after"])).toBeGreaterThanOrEqual(1);
  expect(last.headers()["x-ratelimit-scope"]).toBe("ai-chat");
  expect((await last.json()).error).toMatch(/Too many requests/);

  expect((await analytics(request, "u-quota-2")).status()).not.toBe(429);
});

test("another user on the same IP still has their own AI budget", async ({ request }) => {
  expect((await aiChat(request, "u-field")).status()).not.toBe(429);
});
