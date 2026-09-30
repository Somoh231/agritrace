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
  "/privacy",
  "/terms",
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

test.describe("public site: a website, not an installable app", () => {
  test("no manifest, service worker, install control or diagnostics on public pages and login", async ({ page }) => {
    const downloads: string[] = [];
    page.on("download", (d) => downloads.push(d.suggestedFilename()));
    for (const route of [...PUBLIC_ROUTES, "/login"]) {
      await page.goto(route, { waitUntil: "load" });
      const state = await page.evaluate(async () => {
        await new Promise((r) => setTimeout(r, 400));
        return {
          manifestLink: !!document.querySelector('link[rel="manifest"]'),
          serviceWorkers: "serviceWorker" in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0,
          diagnostics: !!document.querySelector("[data-pwa-diagnostics]"),
          installControl: [...document.querySelectorAll("button, a")].some((el) => /install/i.test(el.textContent ?? "")),
        };
      });
      expect(state, route).toEqual({ manifestLink: false, serviceWorkers: 0, diagnostics: false, installControl: false });
    }
    expect(downloads).toEqual([]);
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

test.describe("public site: homepage guardrails (redesign checkpoint 1)", () => {
  const HOME_ORDER = [
    "hero",
    "problem",
    "product-preview",
    "practices",
    "products",
    "how-it-works",
    "field-to-decision",
    "liberia",
    "governance",
    "engagement",
    "closing-cta",
  ];
  const SAMPLE_LABEL = "Illustrative system view · Sample data";

  test("sections follow the approved order", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const order = await page.locator("[data-home-section]").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.homeSection));
    expect(order).toEqual(HOME_ORDER);
  });

  test("hero is map-led, photo-free and labels its sample data", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const hero = page.locator('[data-home-section="hero"]');
    await expect(hero.locator("img")).toHaveCount(0);
    await expect(hero.locator("[data-sample-label]").first()).toHaveText(SAMPLE_LABEL);
    await expect(hero.locator("[data-sample-label]").first()).toBeVisible();
    await expect(hero.getByText("Built for", { exact: true })).toBeVisible();
    await expect(page.getByText("We work with")).toHaveCount(0);
  });

  test("H1/H2 are Newsreader, UI text is Geist, and no heading uses the retired accent word", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const fonts = await page.evaluate(() => ({
      headings: [...document.querySelectorAll("main h1, main h2:not(.avs-label)")].map((h) => getComputedStyle(h).fontFamily),
      nav: getComputedStyle(document.querySelector("header nav button, header a")!).fontFamily,
      accents: document.querySelectorAll("main h1 .avs-accent, main h2 .avs-accent").length,
    }));
    for (const f of fonts.headings) expect(f.toLowerCase()).toContain("newsreader");
    expect(fonts.nav.toLowerCase()).toContain("geist");
    expect(fonts.accents).toBe(0);
  });

  test("no unsupported metric, partner or security claim on the homepage", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/append-only|immutable|tamper|however the data is requested|nationwide|across Liberia|institution's own administrative levels|as it is recorded|counterpart/i);
    expect(text).not.toMatch(/\b\d[\d,.]*\s*(farmers|hectares|ha\b|acres|warehouses|tonnes|beneficiaries|counties)/i);
    expect(text).not.toContain("partnerships@agrivaultdata.com");
    await expect(page.locator("main img")).toHaveCount(0);
  });

  test("the Liberia programme is AgriVault's framing and always carries its status", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const block = page.locator('[data-home-section="liberia"]');
    await expect(block.getByRole("heading", { level: 2 })).toHaveText("AgriVault's Liberia Agricultural Intelligence Programme");
    await expect(block.locator("[data-programme-status]")).toHaveText(/Pilot · 2026 · being validated/);
    await expect(block).toContainText("Initial focus: rice · Nimba, Bong, and Lofa");
    await expect(block).toContainText("The programme is designed to operate within existing national, county, and district agricultural structures.");
  });

  test("every product render is labelled as sample data", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    for (const id of ["hero", "product-preview", "products"]) {
      await expect(page.locator(`[data-home-section="${id}"]`), id).toContainText(SAMPLE_LABEL);
    }
  });

  test("field-to-decision sequence: still frames under reduced motion, sticky panel only with motion on desktop", async ({ browser }, info) => {
    const reduced = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const p1 = await reduced.newPage();
    await p1.goto("/", { waitUntil: "load" });
    await expect(p1.locator(".avs-seq-inline")).toHaveCount(6);
    expect(await p1.locator(".avs-seq-inline").evaluateAll((els) => els.every((e) => getComputedStyle(e).display !== "none"))).toBe(true);
    await expect(p1.locator(".avs-seq-panel")).toBeHidden();
    await reduced.close();
    test.skip(info.project.name !== "desktop-chromium", "Sticky panel is desktop-only.");
    const motion = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });
    const p2 = await motion.newPage();
    await p2.goto("/", { waitUntil: "load" });
    await expect(p2.locator(".avs-seq-panel")).toBeVisible();
    await motion.close();
  });
});

test.describe("public site: legal pages", () => {
  for (const route of ["/privacy", "/terms"]) {
    test(`${route} is a clearly marked draft and not indexed`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("note")).toContainText("Draft — not yet in effect");
      await expect(page.getByText("Draft — legal text pending")).toBeVisible();
      await expect(page.getByText("Pending", { exact: true }).first()).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    });
  }

  test("footer links to Privacy and Terms", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: "Privacy", exact: true })).toHaveAttribute("href", "/privacy");
    await expect(footer.getByRole("link", { name: "Terms", exact: true })).toHaveAttribute("href", "/terms");
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
