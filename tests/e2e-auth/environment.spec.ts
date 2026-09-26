/**
 * Environment label and staging indicator, for whichever build is under test.
 * Set EXPECT_APP_ENV to the build's NEXT_PUBLIC_APP_ENV (default: development).
 */
import { expect, test } from "@playwright/test";

import { cookieHeader } from "./support/session";

const expected = process.env.EXPECT_APP_ENV ?? "development";

test("health reports the environment label and nothing identifying", async ({ request }) => {
  const res = await request.get("/api/health");
  const body = await res.json();
  expect(body.environment).toBe(expected);
  const raw = JSON.stringify(body);
  expect(raw).not.toMatch(/supabase\.co|127\.0\.0\.1|eyJ|stub-anon-key/);
});

test(`authenticated shell ${expected === "staging" ? "shows" : "never shows"} the staging indicator`, async ({ request }) => {
  const html = await (await request.get("/farmers", { maxRedirects: 0, headers: cookieHeader("u-admin") })).text();
  expect(html.includes('data-testid="staging-indicator"')).toBe(expected === "staging");
  if (expected === "staging") expect(html).toContain("Staging · Synthetic data");
});

test("the public website never shows the indicator", async ({ request }) => {
  const html = await (await request.get("/")).text();
  expect(html.includes('data-testid="staging-indicator"')).toBe(false);
});
