import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const configuredServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!configuredSupabaseUrl || !configuredServiceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
  );
}

const supabaseUrl: string = configuredSupabaseUrl;
const serviceRoleKey: string = configuredServiceRoleKey;

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const projectRef = new URL(supabaseUrl).hostname.split(".")[0] ?? "unknown";

async function linkedProjectMetadata(): Promise<JsonRecord> {
  try {
    const raw = await readFile("supabase/.temp/linked-project.json", "utf8");
    const parsed = JSON.parse(raw) as JsonRecord;
    return {
      ref: typeof parsed.ref === "string" ? parsed.ref : null,
      name: typeof parsed.name === "string" ? parsed.name : null,
    };
  } catch {
    return { ref: null, name: null };
  }
}

async function listAllAuthUsers() {
  const users = [];
  const perPage = 1000;

  for (let page = 1; ; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < perPage) break;
  }

  return users;
}

async function countRows(table: string) {
  const query = client.from(table).select("*", { count: "exact", head: true });
  const { count, error } = await query;
  if (error) {
    return {
      count: null,
      available: false,
      errorCode: error.code ?? "unknown",
    };
  }
  return { count: count ?? 0, available: true, errorCode: null };
}

async function exposedSchema(): Promise<Record<string, string[] | null>> {
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      accept: "application/openapi+json",
    },
  });
  if (!response.ok) {
    throw new Error(`PostgREST schema request failed (${response.status})`);
  }

  const schema = (await response.json()) as {
    definitions?: Record<string, { properties?: Record<string, unknown> }>;
  };
  const inspectedTables = [
    "profiles",
    "profile_role_assignments",
    "workforce_role_catalog",
    "workforce_identity_transitions",
  ];

  return Object.fromEntries(
    inspectedTables.map((table) => [
      table,
      schema.definitions?.[table]?.properties
        ? Object.keys(schema.definitions[table].properties).sort()
        : null,
    ]),
  );
}

async function main() {
  const [authUsers, linkedProject, schema] = await Promise.all([
    listAllAuthUsers(),
    linkedProjectMetadata(),
    exposedSchema(),
  ]);

  const { data: profiles, error: profilesError } = await client
    .from("profiles")
    .select(
      "id,email,role,is_active,deactivated_at,organization_id,county,district,created_at",
    );
  if (profilesError) throw profilesError;

  const { data: warehouseAssignments, error: warehouseAssignmentsError } =
    await client.from("warehouse_assignments").select("profile_id");
  if (warehouseAssignmentsError) throw warehouseAssignmentsError;

  const [{ data: counties, error: countiesError }, { data: districts, error: districtsError }] =
    await Promise.all([
      client.from("counties").select("id,name"),
      client.from("districts").select("name,county_id"),
    ]);
  if (countiesError) throw countiesError;
  if (districtsError) throw districtsError;

  const authIds = new Set(authUsers.map((user) => user.id));
  const profileIds = new Set(profiles.map((profile) => profile.id));
  const assignedWarehouseProfiles = new Set(
    warehouseAssignments.map((assignment) => assignment.profile_id),
  );
  const countyById = new Map(
    counties.map((county) => [county.id, county.name.trim().toLowerCase()]),
  );
  const canonicalCounties = new Set(countyById.values());
  const canonicalDistrictCountyPairs = new Set(
    districts.map(
      (district) =>
        `${countyById.get(district.county_id) ?? ""}::${district.name.trim().toLowerCase()}`,
    ),
  );

  const roleCounts: Record<string, { total: number; active: number }> = {};
  const missingByRole: Record<
    string,
    {
      organization: number;
      county: number;
      district: number;
      warehouseAssignment: number;
    }
  > = {};

  for (const profile of profiles) {
    const role = String(profile.role);
    roleCounts[role] ??= { total: 0, active: 0 };
    missingByRole[role] ??= {
      organization: 0,
      county: 0,
      district: 0,
      warehouseAssignment: 0,
    };
    roleCounts[role].total += 1;
    if (profile.is_active) roleCounts[role].active += 1;
    if (!profile.organization_id) missingByRole[role].organization += 1;
    if (!profile.county?.trim()) missingByRole[role].county += 1;
    if (!profile.district?.trim()) missingByRole[role].district += 1;
    if (
      role === "warehouse_manager" &&
      !assignedWarehouseProfiles.has(profile.id)
    ) {
      missingByRole[role].warehouseAssignment += 1;
    }
  }

  const demoLikePattern = /(^|[+._-])(demo|test|seed|shared)([+._-]|@|$)/i;
  const demoLikeAuthUsers = authUsers.filter((user) =>
    demoLikePattern.test(user.email ?? ""),
  ).length;
  const demoLikeProfiles = profiles.filter((profile) =>
    demoLikePattern.test(profile.email ?? ""),
  ).length;

  const operationalTables = [
    "organizations",
    "warehouses",
    "warehouse_stock",
    "inventory_movements",
    "farmers",
    "plots",
    "lots",
    "movements",
    "rice_production_records",
    "field_reports",
    "geo_locations",
    "operational_submissions",
    "workflow_actions",
    "workflow_comments",
    "workflow_assignments",
    "workflow_notifications",
    "warehouse_transfer_orders",
    "pilot_dao_officers",
    "pilot_operational_events",
    "pilot_county_metrics",
  ];

  const rowCounts = Object.fromEntries(
    await Promise.all(
      operationalTables.map(async (table) => [
        table,
        await countRows(table),
      ]),
    ),
  );

  const identityTables = Object.fromEntries(
    [
      "profile_role_assignments",
      "workforce_role_catalog",
      "workforce_identity_transitions",
    ].map((table) => [
      table,
      schema[table]
        ? { count: null, available: true, errorCode: null }
        : { count: null, available: false, errorCode: "not_exposed" },
    ]),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    mode: "read-only-counts-no-pii",
    project: {
      urlProjectRef: projectRef,
      linkedProject,
      refsMatch:
        typeof linkedProject.ref === "string"
          ? linkedProject.ref === projectRef
          : null,
      environmentClassification: "UNPROVEN",
    },
    identity: {
      authUsers: authUsers.length,
      profiles: profiles.length,
      authUsersMissingProfile: authUsers.filter(
        (user) => !profileIds.has(user.id),
      ).length,
      profilesMissingAuthUser: profiles.filter(
        (profile) => !authIds.has(profile.id),
      ).length,
      activeProfiles: profiles.filter((profile) => profile.is_active).length,
      inactiveProfiles: profiles.filter((profile) => !profile.is_active).length,
      activeProfilesWithDeactivatedTimestamp: profiles.filter(
        (profile) => profile.is_active && profile.deactivated_at,
      ).length,
      authUsersCurrentlyBanned: authUsers.filter(
        (user) =>
          Boolean(user.banned_until) &&
          new Date(user.banned_until as string).getTime() > Date.now(),
      ).length,
      authUsersWithoutConfirmedEmail: authUsers.filter(
        (user) => !user.email_confirmed_at,
      ).length,
      nonCanonicalProfileCounties: profiles.filter(
        (profile) =>
          Boolean(profile.county?.trim()) &&
          !canonicalCounties.has(profile.county.trim().toLowerCase()),
      ).length,
      nonCanonicalProfileDistrictCountyPairs: profiles.filter(
        (profile) =>
          Boolean(profile.district?.trim()) &&
          !canonicalDistrictCountyPairs.has(
            `${profile.county?.trim().toLowerCase() ?? ""}::${profile.district
              .trim()
              .toLowerCase()}`,
          ),
      ).length,
      demoLikeAuthUsers,
      demoLikeProfiles,
      roleCounts,
      missingPrerequisitesByRole: missingByRole,
      identityTables,
      exposedIdentitySchema: schema,
    },
    data: {
      operationalRowCounts: rowCounts,
    },
    gate: {
      linkedTargetProvenStaging: false,
      bootstrapRoleProvenanceApproved: false,
      safeToApply: false,
    },
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

void main();
