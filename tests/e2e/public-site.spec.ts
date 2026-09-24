import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Public corporate site ((site) route group). Runs unauthenticated against any
 * base URL; no credentials, no data writes.
 */
const PUBLIC_ROUTES = [
  "/",
  "/what-we-do",
  "/products",
  "/programmes",
  "/programmes/liberia",
  "/how-we-work",
  "/governments",
  "/security",
  "/about",
  "/contact",
];

const RETIRED_ROUTES = ["/platform", "/pricing", "/request-demo", "/liberia", "/news", "/partners", "/demo"];

test.describe("public site: routing", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} renders one h1 and the site chrome`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("link", { name: "Skip to content" })).toBeAttached();
      await expect(page.getByRole("contentinfo")).toBeVisible();
    });
  }

  test("/ is the public home, not a redirect to sign-in", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Building the systems behind");
  });

  for (const route of RETIRED_ROUTES) {
    test(`legacy marketing route ${route} stays 404`, async ({ request }) => {
      const res = await request.get(route, { maxRedirects: 0 });
      expect(res.status()).toBe(404);
    });
  }

  test("/app is protected and sends signed-out visitors to sign-in", async ({ page }) => {
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    const url = new URL(page.url());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("redirectTo")).toBe("/app");
  });
});

test.describe("public site: brand separation", () => {
  for (const route of [...PUBLIC_ROUTES, "/login"]) {
    test(`${route} does not use the Ministry mark as identity`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator('img[src*="moa-"], img[src*="liberia-moa"], img[alt*="Ministry of Agriculture"]')).toHaveCount(0);
    });
  }

  test("icons and manifest carry AgriVault identity", async ({ request }) => {
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest.name).toBe("AgriVault");
    expect(manifest.start_url).toBe("/app");
    expect((await request.get("/icon.svg")).status()).toBe(200);
    expect((await request.get("/icons/apple-touch-icon.png")).status()).toBe(200);
  });
});

test.describe("public site: navigation", () => {
  test("desktop mega menu opens on click, closes on Escape and returns focus", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop-chromium", "Desktop navigation only.");
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const trigger = page.getByRole("button", { name: "What We Do" });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: /GIS & Land Intelligence/ }).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });

  test("mobile menu is a modal dialog that traps and restores focus", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile-chromium", "Mobile navigation only.");
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const open = page.getByRole("button", { name: /open menu/i });
    await open.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(open).toBeFocused();
  });

  test("product tabs follow the WAI-ARIA keyboard pattern", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const tabs = page.getByRole("tablist", { name: "Products" }).getByRole("tab");
    await tabs.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(1)).toBeFocused();
    await page.keyboard.press("End");
    await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
  });
});

test.describe("public site: contact", () => {
  test("validates with visible labels, an error summary and field errors", async ({ page }) => {
    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Compose email/ }).click();
    // Next.js also renders an (empty) route-announcer alert; target the form's summary.
    const summary = page.getByRole("alert").filter({ hasText: "Please check" });
    await expect(summary).toContainText("Please check 4 fields");
    await expect(summary).toBeFocused();
    const email = page.getByLabel("Work email");
    await email.fill("not-an-email");
    await email.blur();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    // The message appears in the summary and next to the field; the field error is wired to the input.
    const fieldError = page.locator("#contact-email-err");
    await expect(fieldError).toContainText("Enter an email address in the format");
    await expect(email).toHaveAttribute("aria-describedby", /contact-email-err/);
  });

  test("states that nothing is stored by the site", async ({ page }) => {
    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Nothing you type here is sent to or stored by this website.")).toBeVisible();
  });
});

test.describe("public site: quality gates", () => {
  test("no horizontal overflow and no console errors on any public route", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    // Failed requests are checked by URL below; the generic console line carries no URL.
    page.on("console", (m) => {
      if (m.type() === "error" && !m.text().includes("[PWA]") && !m.text().startsWith("Failed to load resource")) errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() < 400) return;
      const { pathname } = new URL(r.url());
      // The analytics rate limit (120/min per IP) is expected to trip when a whole suite runs from one IP.
      if (pathname === "/api/analytics" && r.status() === 429) return;
      errors.push(`${r.status()} ${pathname}`);
    });
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route, { waitUntil: "load" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} overflows horizontally`).toBeLessThanOrEqual(0);
    }
    expect(errors).toEqual([]);
  });

  test("reduced motion shows final content without waiting for scroll", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "load" });
    const hidden = await page.evaluate(
      () => [...document.querySelectorAll(".avs-reveal")].filter((e) => getComputedStyle(e).opacity !== "1").length,
    );
    expect(hidden).toBe(0);
    await context.close();
  });

  test("public routes have no WCAG 2.2 AA axe violations", async ({ page }) => {
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route, { waitUntil: "load" });
      // Reveal everything before scanning so contrast is measured on final state.
      await page.evaluate(() => document.querySelectorAll(".avs-reveal").forEach((e) => e.setAttribute("data-visible", "true")));
      await page.waitForTimeout(1000);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`), route).toEqual([]);
    }
  });
});
