/**
 * Claude Opus 5.5 agentic QA suite.
 *
 * Runs against any AgriVault deployment with individually provisioned QA
 * operators (never shared credentials). Every credential comes from env:
 *   QA55_<KEY>_EMAIL / QA_PASSWORD (one password for a disposable QA stack)
 * Workflow-mutation tests additionally require QA_ALLOW_SYNTHETIC_MUTATIONS=true
 * and refuse to run against production.
 *
 * Evidence (screenshots, per-page text digests) goes to QA_EVIDENCE_DIR when set.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { requireSafeSyntheticTarget, watchBrowserFailures } from "./rc1-test-support";

type Operator = {
  key: string;
  landing: string;
  routes: string[];
  denied: string[];
};

const OPERATORS: Operator[] = [
  {
    key: "CLAN_BONG",
    landing: "/district-dashboard",
    routes: ["/workspace/clan", "/field", "/farmers", "/field/inspections", "/field/boundary-capture", "/field/sync-queue"],
    denied: ["/command-center", "/admin/users", "/workspace/ministry", "/verification-queue"],
  },
  {
    key: "DAO_BONG",
    landing: "/district-dashboard",
    routes: ["/workspace/dao", "/verification-queue", "/registration-approvals", "/farmers"],
    denied: ["/command-center", "/admin/users", "/workspace/cac"],
  },
  {
    key: "CAC_BONG",
    landing: "/county-dashboard",
    routes: ["/workspace/cac", "/verification-queue", "/farmers"],
    denied: ["/command-center", "/admin/users", "/workspace/ministry"],
  },
  {
    key: "MINISTRY",
    landing: "/command-center",
    routes: ["/workspace/ministry", "/national-operations", "/reporting/workspace", "/executive-briefing", "/map", "/transfers"],
    denied: [],
  },
  {
    key: "ADMIN",
    landing: "/command-center",
    routes: ["/admin/users", "/admin/organizations"],
    denied: [],
  },
  {
    key: "WAREHOUSE",
    landing: "/inventory",
    routes: ["/inventory", "/transfers"],
    denied: ["/command-center", "/admin/users", "/workspace/clan"],
  },
  {
    key: "AUDITOR",
    landing: "/audit-tools",
    routes: ["/audit-tools", "/compliance/audit-log"],
    denied: ["/command-center", "/workspace/dao", "/admin/users"],
  },
  {
    key: "DONOR",
    landing: "/donor-dashboard",
    routes: ["/donor-dashboard"],
    denied: ["/farmers", "/command-center", "/verification-queue", "/admin/users"],
  },
];

const password = process.env.QA_PASSWORD ?? "";
const evidenceDir = process.env.QA_EVIDENCE_DIR ?? "";
const emailFor = (key: string) => process.env[`QA55_${key}_EMAIL`] ?? "";
const configured = (key: string) => Boolean(password && emailFor(key));

const sessions = new Map<string, string>();
const landings = new Map<string, string>();

async function settle(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
}

async function signIn(browser: Browser, key: string): Promise<BrowserContext> {
  const cached = sessions.get(key);
  if (cached) return browser.newContext({ storageState: JSON.parse(cached) });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(emailFor(key));
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /Sign in/ }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
  await settle(page);
  landings.set(key, new URL(page.url()).pathname);
  sessions.set(key, JSON.stringify(await context.storageState()));
  await page.close();
  return context;
}

async function evidence(page: Page, name: string) {
  if (!evidenceDir) return;
  fs.mkdirSync(evidenceDir, { recursive: true });
  const safe = name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  await page.screenshot({ path: path.join(evidenceDir, `${safe}.png`), fullPage: true });
  const text = await page.locator("body").innerText();
  fs.writeFileSync(path.join(evidenceDir, `${safe}.txt`), text);
}

// ---------------------------------------------------------------------------
// Lifecycle / fail-closed identity
// ---------------------------------------------------------------------------
test.describe("identity lifecycle", () => {
  for (const [key, expected] of [
    ["INACTIVE", /inactive/i],
    ["NOROLE", /(authorized AgriVault role|access profile is incomplete)/i],
  ] as const) {
    test(`${key} operator is refused at sign-in`, async ({ page }) => {
      test.skip(!configured(key), `Set QA55_${key}_EMAIL and QA_PASSWORD.`);
      await page.goto("/login");
      await page.getByLabel("Email", { exact: true }).fill(emailFor(key));
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByRole("button", { name: /Sign in/ }).click();
      // Next.js also renders an (empty) route-announcer alert; target the sign-in banner.
      await expect(page.getByRole("alert").filter({ hasText: expected })).toBeVisible({ timeout: 20_000 });
      await expect(page).toHaveURL(/\/login/);
      const protectedResponse = await page.goto("/farmers");
      expect(new URL(page.url()).pathname).toBe("/login");
      expect(protectedResponse?.status()).toBeLessThan(500);
    });
  }

  test("invalid password fails without enumeration", async ({ page }) => {
    test.skip(!configured("CLAN_BONG"), "Set QA55_CLAN_BONG_EMAIL and QA_PASSWORD.");
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(emailFor("CLAN_BONG"));
    await page.getByLabel("Password", { exact: true }).fill(`${password}-wrong`);
    await page.getByRole("button", { name: /Sign in/ }).click();
    const banner = page.getByRole("alert").filter({ hasText: /\S/ });
    const wrongPassword = await banner.innerText({ timeout: 20_000 });
    await page.getByLabel("Email", { exact: true }).fill("nobody-registered@agrivault.test");
    await page.getByRole("button", { name: /Sign in/ }).click();
    await expect(banner).toHaveText(wrongPassword);
    expect(wrongPassword).not.toMatch(/not (found|registered)|no (user|account)/i);
  });

  test("open redirect is neutralised after sign-in", async ({ browser }) => {
    test.skip(!configured("MINISTRY"), "Set QA55_MINISTRY_EMAIL and QA_PASSWORD.");
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/login?redirectTo=%2F%2Fevil.example%2Fsteal");
    await page.getByLabel("Email", { exact: true }).fill(emailFor("MINISTRY"));
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: /Sign in/ }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
    expect(new URL(page.url()).host).toBe(new URL(test.info().project.use.baseURL ?? page.url()).host);
    await context.close();
  });
});

// ---------------------------------------------------------------------------
// Role matrix: landing, allowed routes (with axe), and denied routes
// ---------------------------------------------------------------------------
for (const operator of OPERATORS) {
  test.describe(`${operator.key} role matrix`, () => {
    test.skip(!configured(operator.key), `Set QA55_${operator.key}_EMAIL and QA_PASSWORD.`);

    test(`${operator.key} lands on ${operator.landing}`, async ({ browser }) => {
      sessions.delete(operator.key);
      const context = await signIn(browser, operator.key);
      expect(landings.get(operator.key), "post-login destination").toBe(operator.landing);
      const page = await context.newPage();
      await page.goto(operator.landing);
      await settle(page);
      await evidence(page, `${test.info().project.name}_${operator.key}_landing`);
      await context.close();
    });

    for (const route of operator.routes) {
      test(`${operator.key} can use ${route}`, async ({ browser }) => {
        const context = await signIn(browser, operator.key);
        const page = await context.newPage();
        const failures = watchBrowserFailures(page);
        const response = await page.goto(route);
        await settle(page);
        expect(response?.status()).toBeLessThan(400);
        expect(new URL(page.url()).pathname).toBe(route);
        await expect(page.locator("main")).toHaveCount(1);
        await evidence(page, `${test.info().project.name}_${operator.key}${route}`);
        const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
        const serious = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        test.info().annotations.push({
          type: "axe",
          description: serious.map((v) => `${v.id}(${v.nodes.length})`).join(", ") || "none",
        });
        expect(failures.consoleErrors, "console errors").toEqual([]);
        expect(serious.map((v) => v.id), "serious/critical axe violations").toEqual([]);
        await context.close();
      });
    }

    for (const route of operator.denied) {
      test(`${operator.key} is denied ${route}`, async ({ browser }) => {
        const context = await signIn(browser, operator.key);
        const page = await context.newPage();
        await page.goto(route);
        await settle(page);
        expect(new URL(page.url()).pathname).not.toBe(route);
        await context.close();
      });
    }
  });
}

// ---------------------------------------------------------------------------
// API authorization and exports
// ---------------------------------------------------------------------------
test.describe("export authorization", () => {
  const cases: Array<[string, string, number]> = [
    ["DONOR", "/api/reports/executive-briefing", 403],
    ["CLAN_BONG", "/api/reports/dds", 403],
    ["CLAN_BONG", "/api/reports/donor-programme", 403],
    ["AUDITOR", "/api/reports/executive-briefing", 200],
    ["MINISTRY", "/api/reports/executive-briefing", 200],
    ["DONOR", "/api/reports/donor-programme", 200],
  ];
  for (const [key, route, status] of cases) {
    test(`${key} ${route} -> ${status}`, async ({ browser }) => {
      test.skip(!configured(key), `Set QA55_${key}_EMAIL and QA_PASSWORD.`);
      const context = await signIn(browser, key);
      const response = await context.request.get(route);
      expect(response.status()).toBe(status);
      if (status === 200) {
        const body = await response.body();
        const type = response.headers()["content-type"] ?? "";
        if (type.includes("pdf")) expect(body.subarray(0, 5).toString()).toBe("%PDF-");
        expect(response.headers()["content-disposition"] ?? "").toMatch(/attachment|inline/);
      }
      await context.close();
    });
  }

  test("ministry officer may read admin data but cannot mutate via service-role admin APIs", async ({ browser }) => {
    test.skip(!configured("MINISTRY") || !configured("ADMIN"), "Requires MINISTRY and ADMIN operators.");
    const officer = await signIn(browser, "MINISTRY");
    expect((await officer.request.get("/api/admin/organizations")).status()).toBe(200);
    for (const [method, path] of [
      ["post", "/api/admin/organizations"],
      ["post", "/api/admin/import"],
      ["patch", "/api/admin/settings"],
      ["patch", "/api/admin/content"],
      ["post", "/api/admin/users"],
    ] as const) {
      const response = await officer.request[method](path, { data: {} });
      expect(response.status(), `${method.toUpperCase()} ${path}`).toBe(403);
    }
    await officer.close();
    const admin = await signIn(browser, "ADMIN");
    expect((await admin.request.get("/api/admin/users")).status()).toBe(200);
    await admin.close();
  });

  test("donor cannot pull farmer PII through the API", async ({ browser }) => {
    test.skip(!configured("DONOR"), "Set QA55_DONOR_EMAIL and QA_PASSWORD.");
    const context = await signIn(browser, "DONOR");
    const response = await context.request.get("/api/farmers");
    expect(response.status()).toBe(403);
    await context.close();
  });
});

// ---------------------------------------------------------------------------
// End-to-end approval chain through the real API + database RPCs
// ---------------------------------------------------------------------------
test.describe("workflow chain (synthetic mutations)", () => {
  test.skip(
    !["CLAN_BONG", "DAO_BONG", "DAO_NIMBA", "CAC_BONG", "MINISTRY"].every(configured),
    "Requires CLAN_BONG, DAO_BONG, DAO_NIMBA, CAC_BONG and MINISTRY operators.",
  );

  test("CLAN -> DAO -> CAC -> Ministry with scope, legality and idempotency", async ({ browser, baseURL }) => {
    requireSafeSyntheticTarget(baseURL ?? "");
    const post = async (key: string, body: unknown) => {
      const context = await signIn(browser, key);
      const response = await context.request.post("/api/ops/workflows/submission", { data: body });
      const json = await response.json();
      await context.close();
      return { status: response.status(), json };
    };

    const dedupeKey = `QA55-${Date.now()}`;
    const create = {
      action: "submit",
      create: {
        submissionType: "field_inspection",
        title: `QA55 synthetic inspection ${dedupeKey}`,
        county: "Nimba", // must be ignored/refused: CLAN is bound to Bong
        metadata: { dedupe_key: dedupeKey, synthetic: true },
      },
    };
    const refused = await post("CLAN_BONG", create);
    expect(refused.status, "client-supplied out-of-scope county is refused").toBe(403);

    const created = await post("CLAN_BONG", { ...create, create: { ...create.create, county: undefined } });
    expect(created.status).toBe(200);
    expect(created.json.submission.county).toBe("Bong");
    const id = created.json.submission.id as string;

    const replay = await post("CLAN_BONG", { ...create, create: { ...create.create, county: undefined } });
    expect(replay.json.submission.id, "same dedupe key returns the same submission").toBe(id);
    expect(replay.json.deduplicated).toBe(true);

    expect((await post("CLAN_BONG", { action: "approve", submissionId: id })).status).toBe(403);
    expect((await post("DAO_NIMBA", { action: "approve", submissionId: id })).status).toBeGreaterThanOrEqual(403);
    expect((await post("CAC_BONG", { action: "approve", submissionId: id })).status, "CAC cannot skip DAO").toBe(422);

    const dao = await post("DAO_BONG", { action: "approve", submissionId: id, note: "QA55 DAO approve" });
    expect(dao.status).toBe(200);
    expect(dao.json.submission.status).toBe("dao_approved");
    const daoAgain = await post("DAO_BONG", { action: "approve", submissionId: id });
    expect(daoAgain.status, "double submit of the same decision is rejected").toBeGreaterThanOrEqual(409);

    const cac = await post("CAC_BONG", { action: "approve", submissionId: id });
    expect(cac.json.submission.status).toBe("cac_approved");
    const ministry = await post("MINISTRY", { action: "approve", submissionId: id });
    expect(ministry.json.submission.status).toBe("ministry_approved");

    const context = await signIn(browser, "MINISTRY");
    const thread = await (await context.request.get(`/api/ops/workflows/submission?submissionId=${id}`)).json();
    await context.close();
    expect(thread.thread.actions.map((a: { toStatus: string }) => a.toStatus)).toEqual([
      "submitted",
      "dao_approved",
      "cac_approved",
      "ministry_approved",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Offline capture -> persist -> reconnect -> replay -> dedupe -> cleanup
// ---------------------------------------------------------------------------
test.describe("offline field capture (synthetic mutations)", () => {
  test.skip(!configured("CLAN_BONG"), "Requires CLAN_BONG operator.");

  test("farmer captured offline replays once under the operator's scope and leaves no PII behind", async ({
    browser,
    baseURL,
  }) => {
    requireSafeSyntheticTarget(baseURL ?? "");
    const context = await signIn(browser, "CLAN_BONG");
    const page = await context.newPage();
    const pendingFarmers = () =>
      page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            const open = indexedDB.open("agrivault-offline");
            open.onsuccess = () => {
              const db = open.result;
              if (!db.objectStoreNames.contains("pending_farmers")) return resolve(0);
              const req = db.transaction("pending_farmers").objectStore("pending_farmers").getAll();
              req.onsuccess = () => resolve((req.result as Array<{ synced?: boolean }>).filter((r) => !r.synced).length);
              req.onerror = () => resolve(-1);
            };
            open.onerror = () => resolve(-1);
          }),
      );

    await page.goto("/field");
    await settle(page);
    const name = `QA55 Offline Farmer ${Date.now()}`;
    await context.setOffline(true);
    await page.getByRole("button", { name: /Register Farmer/i }).click();
    await page.getByPlaceholder("Full name").fill(name);
    await page.getByPlaceholder(/National ID/).fill(`LBR-QA55-${Date.now()}`);
    await page.getByRole("button", { name: /^Save$/ }).click();
    await expect.poll(pendingFarmers, { message: "record queued in IndexedDB while offline" }).toBe(1);

    // Survives a reload while still queued (reload online; offline navigation needs the service worker).
    await context.setOffline(false);
    await page.reload();
    await settle(page);

    // Replay (triggered by the online event / sync indicator) persists exactly one server row.
    await expect.poll(pendingFarmers, { timeout: 30_000, message: "queue drained after reconnect" }).toBe(0);
    const response = await context.request.get(`/api/farmers?limit=200`);
    const farmers = ((await response.json()).farmers ?? []) as Array<{ full_name: string; county: string }>;
    const matches = farmers.filter((f) => f.full_name === name);
    expect(matches, "exactly one server record (idempotent replay)").toHaveLength(1);
    expect(matches[0]?.county).toBe("Bong");

    // Synced PII is purged from the device.
    const stored = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const open = indexedDB.open("agrivault-offline");
          open.onsuccess = () => {
            const req = open.result.transaction("pending_farmers").objectStore("pending_farmers").count();
            req.onsuccess = () => resolve(req.result);
          };
        }),
    );
    expect(stored, "synced farmer PII purged from IndexedDB").toBe(0);
    await context.close();
  });
});

// ---------------------------------------------------------------------------
// Service worker never serves live data from cache
// ---------------------------------------------------------------------------
test.describe("service worker data freshness (synthetic mutations)", () => {
  test.skip(!["CLAN_BONG", "DAO_BONG"].every(configured), "Requires CLAN_BONG and DAO_BONG operators.");

  test("verification queue shows a submission created after the first visit; no API/RSC responses cached", async ({
    browser,
    baseURL,
  }) => {
    requireSafeSyntheticTarget(baseURL ?? "");
    const dao = await signIn(browser, "DAO_BONG");
    const page = await dao.newPage();
    await page.goto("/verification-queue");
    await settle(page);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), undefined, { timeout: 20_000 }).catch(() => undefined);
    await page.reload();
    await settle(page);

    const title = `QA55 freshness ${Date.now()}`;
    const clan = await signIn(browser, "CLAN_BONG");
    const created = await clan.request.post("/api/ops/workflows/submission", {
      data: { action: "submit", create: { submissionType: "field_inspection", title, metadata: { synthetic: true } } },
    });
    expect(created.status()).toBe(200);
    const reference = (await created.json()).submission.referenceCode as string;
    await clan.close();

    await page.reload();
    await settle(page);
    await expect(page.getByText(reference).first()).toBeVisible({ timeout: 20_000 });

    const cachedLiveData = await page.evaluate(async () => {
      const hits: string[] = [];
      for (const key of await caches.keys()) {
        for (const req of await (await caches.open(key)).keys()) {
          const u = new URL(req.url);
          if (u.pathname.startsWith("/api/") || u.searchParams.has("_rsc")) hits.push(u.pathname);
        }
      }
      return hits;
    });
    expect(cachedLiveData, "no API or RSC responses in Cache Storage").toEqual([]);
    await dao.close();
  });
});

// ---------------------------------------------------------------------------
// GIS boundary capture with real browser geolocation (no data is saved)
// ---------------------------------------------------------------------------
async function chooseFirstFarmer(page: Page) {
  const picker = page.getByRole("combobox").first();
  await expect(picker, "farmer picker lists in-scope farmers (run the offline test first on an empty stack)").toBeVisible({
    timeout: 15_000,
  });
  await picker.selectOption({ index: 1 });
}
test.describe("GIS boundary capture", () => {
  test.skip(!configured("CLAN_BONG"), "Requires CLAN_BONG operator.");

  test("GPS denied explains the problem; bow-tie is rejected; a valid square closes", async ({ browser }) => {
    const signedIn = await signIn(browser, "CLAN_BONG");
    const storageState = await signedIn.storageState();
    await signedIn.close();

    const denied = await browser.newContext({ storageState, permissions: [] });
    const deniedPage = await denied.newPage();
    await deniedPage.goto("/field/boundary-capture");
    await chooseFirstFarmer(deniedPage);
    await deniedPage.getByRole("button", { name: "Capture Point" }).click();
    await expect(deniedPage.getByText(/Could not read GPS/)).toBeVisible({ timeout: 15_000 });
    await denied.close();

    const allowed = await browser.newContext({
      storageState,
      permissions: ["geolocation"],
      geolocation: { latitude: 7.05, longitude: -9.45, accuracy: 4 },
    });
    const page = await allowed.newPage();
    await page.goto("/field/boundary-capture");
    await chooseFirstFarmer(page);
    const capture = async (latitude: number, longitude: number, n: number) => {
      // Walking to a new corner produces a new live fix; give the watch a moment to deliver it.
      await allowed.setGeolocation({ latitude, longitude, accuracy: 4 });
      await page.waitForTimeout(400);
      await page.getByRole("button", { name: "Capture Point" }).click();
      await expect(page.getByText(`Corners captured: ${n}`)).toBeVisible({ timeout: 30_000 });
    };
    // Bow-tie: corners out of order.
    await capture(7.0, -9.47, 1);
    await capture(7.0009, -9.4691, 2);
    await capture(7.0, -9.4691, 3);
    await capture(7.0009, -9.47, 4);
    await page.getByRole("button", { name: "Close Boundary" }).click();
    await expect(page.getByText(/crosses itself/)).toBeVisible();

    await page.getByRole("button", { name: "Clear Polygon" }).click();
    // A different (valid, in-order) square so no corner repeats the previous fix.
    await capture(7.002, -9.472, 1);
    await capture(7.002, -9.4711, 2);
    await capture(7.0029, -9.4711, 3);
    await capture(7.0029, -9.472, 4);
    await page.getByRole("button", { name: "Close Boundary" }).click();
    await expect(page.getByText(/Boundary closed — review the outline/)).toBeVisible();
    await allowed.close();
  });
});
