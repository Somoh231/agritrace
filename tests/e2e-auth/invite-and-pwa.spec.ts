/**
 * Invitation flow and PWA boundary, against a production build wired to the
 * stub Supabase (see playwright.auth.config.ts).
 *
 *   - Public website, login and invitation pages are plain web pages: no
 *     manifest, no service worker, no install UI, no diagnostics.
 *   - An invitation link completes (password set, signed in) without any
 *     install prompt or download.
 *   - The authenticated platform keeps its manifest, service worker, install
 *     control, diagnostics and offline navigation.
 */
import { expect, test, type Page } from "@playwright/test";

import { postLoginHomeForRole } from "@/lib/auth/post-login-home";
import { PUBLIC_SITE_ROUTES } from "@/lib/site/routes";

import { sessionCookie, stubAccessToken, STUB_SUPABASE_URL, type StubUser } from "./support/session";

const inviteFragment = (sub: StubUser) =>
  `#access_token=${stubAccessToken(sub)}&refresh_token=stub-refresh&expires_in=3600&token_type=bearer&type=invite`;

async function stubHits(): Promise<{ passwordUpdates: number; verify: number }> {
  return (await fetch(`${STUB_SUPABASE_URL}/__stub/hits`)).json();
}

/** Everything that would make a page behave like an installable app. */
async function appSignals(page: Page) {
  return page.evaluate(async () => {
    await new Promise((r) => setTimeout(r, 600));
    const ev = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt?: () => Promise<void>; userChoice?: Promise<unknown> };
    let prompted = false;
    ev.prompt = async () => {
      prompted = true;
    };
    ev.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(ev);
    await new Promise((r) => setTimeout(r, 200));
    return {
      manifestLink: !!document.querySelector('link[rel="manifest"]'),
      serviceWorkers: "serviceWorker" in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0,
      diagnostics: !!document.querySelector("[data-pwa-diagnostics]"),
      installControl: [...document.querySelectorAll("button, a")].some((el) => /install/i.test(el.textContent ?? "")),
      installPromptCaptured: ev.defaultPrevented,
      prompted,
    };
  });
}

// Page views post analytics events; the API rate limiter shares one bucket per
// client across policies, so browsing tests must not spend other suites' budget.
test.beforeEach(async ({ context }) => {
  await context.route(/\/api\/analytics/, (r) => r.abort());
});

const NOT_AN_APP = { manifestLink: false, serviceWorkers: 0, diagnostics: false, installControl: false, installPromptCaptured: false, prompted: false };

test.describe("public website and auth entry pages are not an app", () => {
  test("public pages, login and invitation pages carry no PWA behaviour", async ({ page }) => {
    const downloads: string[] = [];
    page.on("download", (d) => downloads.push(d.suggestedFilename()));
    for (const path of [...PUBLIC_SITE_ROUTES, "/login", "/auth/callback", "/auth/set-password", "/account-unavailable"]) {
      await page.goto(path, { waitUntil: "load" });
      expect(await appSignals(page), path).toEqual(NOT_AN_APP);
    }
    expect(downloads).toEqual([]);
  });
});

test.describe("invitation flow", () => {
  test("invite link → normal page → password set → platform, with no install or download", async ({ page }) => {
    const downloads: string[] = [];
    const manifestRequests: string[] = [];
    page.on("download", (d) => downloads.push(d.suggestedFilename()));
    page.on("request", (r) => {
      if (r.url().includes(".webmanifest")) manifestRequests.push(new URL(page.url()).pathname);
    });
    const before = await stubHits();

    await page.goto(`/${inviteFragment("u-invitee-active")}`);
    await page.waitForURL(/\/auth\/set-password\?flow=invite$/);
    await expect(page.getByRole("heading", { level: 1, name: "Set up your account" })).toBeVisible();
    expect(new URL(page.url()).hash).toBe("");
    expect(await appSignals(page)).toEqual(NOT_AN_APP);

    await page.getByLabel("New password").fill("stub-only-password-1");
    await page.getByLabel("Confirm password").fill("stub-only-password-1");
    await page.getByRole("button", { name: "Set password and continue" }).click();
    await page.waitForURL((u) => !u.pathname.startsWith("/auth/") && u.pathname !== "/app");

    expect(new URL(page.url()).pathname).toBe(postLoginHomeForRole("field_agent"));
    expect((await stubHits()).passwordUpdates - before.passwordUpdates).toBe(1);
    expect(downloads).toEqual([]);
    // The manifest is only requested once the user is inside the platform.
    expect(manifestRequests.filter((p) => !["/district-dashboard", "/app"].includes(p) && !p.startsWith("/workspace"))).toEqual([]);
  });

  test("an invitee whose account is not activated yet ends on account-unavailable, not an install prompt", async ({ page }) => {
    await page.goto(`/${inviteFragment("u-invitee")}`);
    await page.waitForURL(/\/auth\/set-password/);
    await page.getByLabel("New password").fill("stub-only-password-2");
    await page.getByLabel("Confirm password").fill("stub-only-password-2");
    await page.getByRole("button", { name: "Set password and continue" }).click();
    await page.waitForURL(/\/account-unavailable$/);
    expect(await appSignals(page)).toEqual(NOT_AN_APP);
  });

  test("invite links landing on /login or carrying ?token_hash are handled the same way", async ({ page }) => {
    await page.goto(`/login${inviteFragment("u-invitee-active")}`);
    await page.waitForURL(/\/auth\/set-password\?flow=invite$/);

    await page.context().clearCookies();
    await page.goto("/auth/callback?token_hash=valid-invite&type=invite");
    await page.waitForURL(/\/auth\/set-password\?flow=invite$/);
    await expect(page.getByTestId("set-password-form")).toBeVisible();
  });

  test("an expired invitation explains what to do", async ({ page }) => {
    await page.goto("/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
    await page.waitForURL(/\/auth\/callback$/);
    await expect(page.getByTestId("auth-callback-expired")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "This link has expired" })).toBeVisible();
    expect(await appSignals(page)).toEqual(NOT_AN_APP);
  });

  test("the password page without a valid link asks for the invitation email", async ({ page }) => {
    await page.goto("/auth/set-password");
    await expect(page.getByTestId("set-password-no-session")).toBeVisible();
  });
});

test.describe("authenticated platform keeps its PWA", () => {
  test("manifest, service worker, install control and diagnostics exist only after sign-in", async ({ page, context, baseURL }) => {
    const c = sessionCookie("u-admin");
    await context.addCookies([{ name: c.name, value: c.value, url: baseURL! }]);
    await page.goto("/farmers", { waitUntil: "load" });

    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifestHref).toBe("/manifest.webmanifest");
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(new URL(scope).pathname).toBe("/");
    await expect(page.locator("[data-pwa-diagnostics]")).toHaveCount(1);
    // User-initiated only: the Install button lives in the platform toolbar's "⋯" menu.
    await expect(page.locator("button", { hasText: "Install App" })).toHaveCount(1);

    // The platform captures the browser's install event for its own button; it never prompts on its own.
    const signals = await appSignals(page);
    expect(signals.installPromptCaptured).toBe(true);
    expect(signals.prompted).toBe(false);

    const manifest = await (await page.request.get("/manifest.webmanifest")).json();
    expect(manifest).toMatchObject({ id: "/app", start_url: "/app", display: "standalone" });
  });

  test("platform pages work offline; public pages are never served by the worker", async ({ page, context, baseURL }) => {
    const c = sessionCookie("u-admin");
    await context.addCookies([{ name: c.name, value: c.value, url: baseURL! }]);
    await page.goto("/farmers", { waitUntil: "load" });
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    const controlled = await page.reload({ waitUntil: "load" });
    expect(controlled?.fromServiceWorker()).toBe(true);

    const publicPage = await page.goto("/about", { waitUntil: "load" });
    expect(publicPage?.fromServiceWorker()).toBe(false);
    const login = await page.goto("/login", { waitUntil: "load" });
    expect(login?.fromServiceWorker()).toBe(false);

    await page.goto("/farmers", { waitUntil: "load" });
    await context.setOffline(true);
    const offline = await page.reload({ waitUntil: "load" });
    expect(offline?.fromServiceWorker()).toBe(true);
    expect(offline?.status()).toBe(200);

    // Public pages were never cached as an app shell: offline, they are simply unavailable.
    await expect(page.goto("/about")).rejects.toThrow();
    await context.setOffline(false);
  });
});
