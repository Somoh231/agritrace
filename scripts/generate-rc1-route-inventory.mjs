import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const appRoot = path.join(root, "src/app");
const auditDir = path.join(root, "docs/audits");
const jsonPath = path.join(auditDir, "RC1_ROUTE_INVENTORY.json");
const markdownPath = path.join(auditDir, "RC1_ROUTE_MATRIX.md");

const publicRoutes = new Set([
  "/",
  "/about",
  "/africa",
  "/capabilities",
  "/contact",
  "/demo",
  "/docs",
  "/governance",
  "/government",
  "/health",
  "/integrations",
  "/liberia",
  "/login",
  "/news",
  "/offline",
  "/partners",
  "/platform",
  "/platform-preview",
  "/pricing",
  "/request-demo",
  "/setup",
]);

const roleRules = [
  ["/admin", "Ministry admin roles"],
  ["/command-center", "Ministry national"],
  ["/national-operations", "Ministry national"],
  ["/national-heat-map", "Ministry, CAC, DAO, CLAN"],
  ["/executive-briefing", "Ministry national, CAC"],
  ["/county-dashboard", "CAC, Ministry national"],
  ["/district-dashboard", "CLAN, DAO, CAC, Ministry"],
  ["/workspace/ministry", "Ministry national"],
  ["/workspace/cac", "CAC, Ministry national"],
  ["/workspace/dao", "CLAN, DAO, CAC, Ministry"],
  ["/workspace/clan", "CLAN, DAO, CAC, Ministry"],
  ["/field-agents", "DAO, CAC, Ministry"],
  ["/field", "CLAN, DAO, CAC, Ministry"],
  ["/gis-intelligence", "Ministry national, CAC"],
  ["/geo-registry", "DAO, CAC, Ministry"],
  ["/map", "DAO, CAC, Ministry"],
  ["/verification-queue", "DAO, CAC, Ministry"],
  ["/registration-approvals", "DAO, CAC, Ministry"],
  ["/reporting", "CLAN, DAO, CAC, Ministry"],
  ["/inventory", "DAO, CAC, Ministry, warehouse, cooperative, exporter"],
  ["/transfers", "DAO, CAC, Ministry, warehouse, cooperative, exporter"],
  ["/operations", "DAO, CAC, Ministry, warehouse, cooperative, exporter"],
  ["/logistics", "DAO, CAC, Ministry, warehouse, cooperative, exporter"],
  ["/subsidies", "Operational chain, warehouse"],
  ["/production", "Operational chain, warehouse"],
  ["/rice", "Operational chain, warehouse"],
  ["/cocoa", "Operational chain, warehouse"],
  ["/alerts", "CLAN, DAO, CAC, Ministry"],
  ["/food-security", "Operational chain"],
  ["/compliance", "Authenticated non-donor"],
  ["/farmers", "Authenticated non-donor"],
  ["/cooperatives", "Authenticated non-donor"],
  ["/farm-profiles", "Authenticated non-donor"],
  ["/activity", "Ministry national, call-center"],
  ["/search", "Ministry national, call-center"],
  ["/donor-dashboard", "Donor observer, auditor, Ministry"],
  ["/audit-tools", "Auditor, Ministry"],
];

const userRules = [
  ["/admin", "Platform administrator"],
  ["/workspace/clan", "CLAN technician"],
  ["/workspace/dao", "DAO officer"],
  ["/workspace/cac", "County coordinator"],
  ["/workspace/ministry", "Ministry leader"],
  ["/district-dashboard", "DAO / CLAN"],
  ["/county-dashboard", "CAC"],
  ["/inventory", "Warehouse / logistics"],
  ["/transfers", "Warehouse / logistics"],
  ["/field", "Field operator"],
  ["/report", "Reporting officer"],
  ["/compliance", "Auditor / compliance"],
  ["/donor", "Donor observer"],
  ["/command-center", "Ministry leadership"],
  ["/national", "Ministry leadership"],
];

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name === "page.tsx" || entry.name === "route.ts") out.push(full);
  }
  return out;
}

function urlFor(file) {
  const relative = path.relative(appRoot, path.dirname(file));
  const segments = relative
    .split(path.sep)
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));
  return `/${segments.join("/")}`.replace(/\/$/, "") || "/";
}

function matchRule(url, rules, fallback) {
  const found = rules.find(([prefix]) => url === prefix || url.startsWith(`${prefix}/`));
  return found?.[1] ?? fallback;
}

function sourceFor(code, isApi, url) {
  const live = /createClient|getSupabase|supabase\./.test(code);
  const fixture = /lib\/demo|MINISTRY_|canonical|pilotSource|demoSource/.test(code);
  const offline = /IndexedDB|idb|localStorage|offline|sync-queue/.test(code);
  if (live && fixture) return "Mixed live + disclosed pilot/demo";
  if (live && offline) return "Live + offline device state";
  if (live) return "Supabase (RLS-governed)";
  if (offline) return "Offline device state";
  if (fixture) return "Disclosed pilot/demo canonical data";
  if (isApi && url === "/api/health") return "Runtime configuration checks";
  return "Static application content";
}

function apiMethods(code) {
  const methods = [...code.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/g)].map(
    (match) => match[1],
  );
  return methods.length ? methods.join(", ") : "Unknown";
}

function roleFor(url, isApi, code) {
  if (isApi) {
    if (url === "/api/health" || url === "/api/demo-inquiry" || url === "/api/analytics") {
      return "Public / optional session";
    }
    if (url === "/api/ministry-pilot/summary") return "Public canonical; session-enriched";
    if (url.startsWith("/api/admin")) return "Ministry admin roles";
    if (/requireApiSession|requireWorkflowPrincipal|auth\.getUser|requireSession/.test(code)) {
      return "Authenticated; handler/RLS role gate";
    }
    return "Review required";
  }
  if (publicRoutes.has(url) || url.startsWith("/news/")) return "Public";
  return matchRule(url, roleRules, "Authenticated; middleware + RLS");
}

function status(code, patterns, positive, negative) {
  return patterns.some((pattern) => pattern.test(code)) ? positive : negative;
}

await fs.mkdir(auditDir, { recursive: true });
const files = (await walk(appRoot)).sort();
const records = [];

for (const file of files) {
  const code = await fs.readFile(file, "utf8");
  const stat = await fs.stat(file);
  const url = urlFor(file);
  const isApi = file.endsWith("route.ts");
  const lineCount = code.split("\n").length;
  const siblingDir = path.dirname(file);
  const hasLoadingFile = await fs.access(path.join(siblingDir, "loading.tsx")).then(() => true).catch(() => false);
  const hasErrorFile = await fs.access(path.join(siblingDir, "error.tsx")).then(() => true).catch(() => false);
  const mutation =
    isApi
      ? apiMethods(code)
      : /<form|onSubmit|\.insert\(|\.update\(|\.upsert\(|primary-action|Form\b/.test(code)
        ? "Yes — inspect action-level authorization"
        : "No direct mutation in route entry";
  const risk = [];
  if (lineCount > 500) risk.push(`Oversized route entry (${lineCount} lines)`);
  if (isApi && roleFor(url, isApi, code) === "Review required") risk.push("No explicit session guard detected");
  if (!isApi && !publicRoutes.has(url) && !/redirect|assert|layout/.test(code)) {
    risk.push("Relies on dashboard layout/middleware for access");
  }
  if (/ssr:\s*false/.test(code)) risk.push("Client-only dynamic boundary");
  if (/MINISTRY_|lib\/demo/.test(code)) risk.push("Pilot/demo disclosure must remain visible");
  if (/Map|mapbox|gis/i.test(code)) risk.push("GIS token/config degradation required");
  if (!risk.length) risk.push("No route-entry-specific risk; component/data layer still requires QA");

  records.push({
    url,
    kind: isApi ? "API" : "Page",
    entryPoint: path.relative(root, file),
    roleAccess: roleFor(url, isApi, code),
    primaryUser: isApi ? "System integration / authenticated client" : matchRule(url, userRules, publicRoutes.has(url) ? "Public visitor" : "Operational user"),
    dataSource: sourceFor(code, isApi, url),
    mutationCapability: mutation,
    offlineBehavior: status(
      code,
      [/offline/i, /IndexedDB/, /\bidb\b/, /localStorage/, /sync-queue/],
      "Explicit offline/device behavior referenced",
      isApi ? "Network required" : "Shell/PWA fallback only; route-specific behavior unproven",
    ),
    loadingState: hasLoadingFile || /loading|Loading|Suspense|animate-pulse/.test(code) ? "Present in route/component" : "Inherited / not explicit",
    emptyState: status(code, [/EmptyState/, /No\s+\w+|empty/i], "Present in route/component", "Not explicit in route entry"),
    errorState: hasErrorFile || /error|Error|catch\s*\(/.test(code) ? "Present/inherited boundary" : "Inherited dashboard/global boundary",
    mobileStatus: status(code, [/\bsm:/, /\bmd:/, /\blg:/, /overflow-x/], "Responsive classes present; browser verification required", "Browser verification required"),
    accessibilityStatus: status(code, [/aria-/, /<label/, /<h1/, /<main/, /<nav/], "Semantic/accessibility hooks present; manual verification required", "Inherited semantics; manual verification required"),
    visualSystemStatus: status(code, [/components\/enterprise/, /ent-/, /gov-/, /cmd-/], "Canonical enterprise system referenced", "Component-level visual system requires inspection"),
    testCoverage: isApi && /workflow|reports|admin/.test(url) ? "Unit/security coverage is partial; route smoke required" : "Build coverage only; route smoke required",
    riskNotes: risk.join("; "),
    sourceBytes: stat.size,
  });
}

const inventory = {
  generatedAt: new Date().toISOString(),
  baseline: "c69b4598fe96fbbf4a968922739e4af0a227c8dc",
  branch: "audit/rc1-360-agentic-qa",
  methodology:
    "Generated from current src/app entries and static code signals, then intended for browser-QA annotation. A positive static signal is not a runtime pass.",
  counts: {
    total: records.length,
    pages: records.filter((record) => record.kind === "Page").length,
    api: records.filter((record) => record.kind === "API").length,
  },
  routes: records,
};

await fs.writeFile(jsonPath, `${JSON.stringify(inventory, null, 2)}\n`);

const esc = (value) => String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
const rows = records.map(
  (record) =>
    `| ${esc(record.url)} | ${record.kind} | \`${esc(record.entryPoint)}\` | ${esc(record.roleAccess)} | ${esc(record.primaryUser)} | ${esc(record.dataSource)} | ${esc(record.mutationCapability)} | ${esc(record.offlineBehavior)} | ${esc(record.loadingState)} | ${esc(record.emptyState)} | ${esc(record.errorState)} | ${esc(record.mobileStatus)} | ${esc(record.accessibilityStatus)} | ${esc(record.visualSystemStatus)} | ${esc(record.testCoverage)} | ${esc(record.riskNotes)} |`,
);

const markdown = `# AgriVault RC1 Route Matrix

Generated: ${inventory.generatedAt}

This matrix is generated from the current App Router source tree, not copied from prior documentation. Static signals establish inventory and risk; they do not constitute a browser pass. Runtime findings are recorded in \`RC1_AGENTIC_QA_REPORT.md\`.

Machine-readable companion: \`docs/audits/RC1_ROUTE_INVENTORY.json\`

## Inventory summary

- Total route entries: ${inventory.counts.total}
- Page routes: ${inventory.counts.pages}
- API routes: ${inventory.counts.api}
- Access source of truth: \`src/middleware.ts\`, \`src/lib/auth/workspace-access.ts\`, route layouts, API guards, and Supabase RLS

## Route matrix

| URL | Kind | Entry point | Role access | Primary user | Data source | Mutation capability | Offline behavior | Loading state | Empty state | Error state | Mobile status | Accessibility status | Visual-system status | Test coverage | Risk notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}
`;

await fs.writeFile(markdownPath, markdown);
console.log(`Generated ${records.length} route records.`);
