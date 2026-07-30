import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const middleware = readFileSync("src/middleware.ts", "utf8");

for (const route of [
  "/about",
  "/contact",
  "/demo",
  "/platform",
  "/pricing",
  "/request-demo",
  "/setup",
]) {
  assert.ok(
    middleware.includes(`"${route}"`),
    `retired public route must be explicitly denied: ${route}`,
  );
}

assert.match(
  middleware,
  /pathname === "\/"[\s\S]{0,260}loginUrl\.pathname = "\/login"/,
  "root must redirect to private login",
);
assert.equal(
  existsSync("src/app/api/demo-inquiry/route.ts"),
  false,
  "public demo-inquiry endpoint must be removed",
);
assert.equal(
  existsSync("src/app/api/workspace-demo-role/route.ts"),
  false,
  "workspace preview-role endpoint must be removed",
);
assert.equal(
  existsSync("src/lib/auth/workspace-demo-role.ts"),
  false,
  "workspace preview-role cookie authority must be removed",
);

const sourceFiles = [
  "src/app/(dashboard)/layout.tsx",
  "src/app/(dashboard)/command-center/layout.tsx",
  "src/app/(dashboard)/county-dashboard/layout.tsx",
  "src/app/(dashboard)/district-dashboard/layout.tsx",
  "src/components/layout/Topbar.tsx",
].map((path) => readFileSync(path, "utf8"));

assert.doesNotMatch(
  sourceFiles.join("\n"),
  /workspace-demo-role|WORKSPACE_DEMO_ROLE_COOKIE|WorkspaceRoleSwitcher/,
  "dashboard routing must use only database-backed roles",
);

console.log("Private workforce cutover contract passed.");
