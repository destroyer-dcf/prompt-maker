import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const REQUIRED_TABLES = [
  "api_keys",
  "collections",
  "favorites",
  "notifications",
  "profiles",
  "prompt_variants",
  "prompt_versions",
  "prompts",
  "tags",
  "templates",
] as const;

function loadDotenvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    if (!key || process.env[key]) continue;
    const value = line.slice(separator + 1).replace(/^"|"$/g, "");
    process.env[key] = value;
  }
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

async function main() {
  loadDotenvLocal();

  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseAnonKey) {
    throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const databaseUrl = requiredEnv("DATABASE_URL");
  const adminEmail = requiredEnv("ADMIN_EMAIL");

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const sql = postgres(databaseUrl, { ssl: "require", connect_timeout: 15, max: 1 });

  let failed = false;
  const fail = (message: string) => {
    failed = true;
    console.error(`[FAIL] ${message}`);
  };
  const pass = (message: string) => {
    console.log(`[OK] ${message}`);
  };

  try {
    const ping = await sql<{ ok: number }[]>`select 1 as ok`;
    if (ping[0]?.ok === 1) pass("DB connection");
    else fail("DB connection returned unexpected payload");

    const tables = await sql<{ table_name: string }[]>`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `;
    const tableSet = new Set(tables.map((row) => row.table_name));
    const missingTables = REQUIRED_TABLES.filter((name) => !tableSet.has(name));
    if (missingTables.length === 0) {
      pass("Required tables exist");
    } else {
      fail(`Missing tables: ${missingTables.join(", ")}`);
    }

    const rlsRows = await sql<{ relname: string; relrowsecurity: boolean }[]>`
      select c.relname, c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
      order by c.relname
    `;
    const rlsMap = new Map(rlsRows.map((row) => [row.relname, row.relrowsecurity]));
    const rlsOff = REQUIRED_TABLES.filter((name) => rlsMap.get(name) !== true);
    if (rlsOff.length === 0) {
      pass("RLS enabled on required tables");
    } else {
      fail(`RLS disabled on: ${rlsOff.join(", ")}`);
    }

    const policyRows = await sql<{ tablename: string; count: number }[]>`
      select tablename, count(*)::int as count
      from pg_policies
      where schemaname = 'public'
      group by tablename
    `;
    const policyMap = new Map(policyRows.map((row) => [row.tablename, row.count]));
    const noPolicies = REQUIRED_TABLES.filter((name) => (policyMap.get(name) ?? 0) === 0);
    if (noPolicies.length === 0) {
      pass("RLS policies present on required tables");
    } else {
      fail(`Missing policies on: ${noPolicies.join(", ")}`);
    }

    const { data: usersPage, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    if (usersError) fail(`Supabase service role admin check failed: ${usersError.message}`);
    else pass(`Supabase service role works (sample users=${usersPage.users.length})`);

    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from("profiles")
      .select("email,role,status")
      .eq("email", adminEmail)
      .limit(1);

    if (adminError) {
      fail(`Admin profile query failed: ${adminError.message}`);
    } else if (!adminProfile || adminProfile.length === 0) {
      fail(`Admin profile not found for ${adminEmail}`);
    } else if (adminProfile[0].role !== "admin") {
      fail(`Admin profile role is ${adminProfile[0].role}, expected admin`);
    } else {
      pass(`Admin profile ready (${adminProfile[0].email})`);
    }

    const { data: settings, error: settingsError } = await createClient(
      supabaseUrl,
      supabaseAnonKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    ).auth.getSession();
    if (settingsError) {
      fail(`Anon key sanity check failed: ${settingsError.message}`);
    } else {
      pass(`Anon key sanity check ok (session=${settings.session ? "present" : "none"})`);
    }
  } finally {
    await sql.end({ timeout: 1 });
  }

  if (failed) {
    process.exit(1);
  }

  console.log("Smoke check completed successfully.");
}

main().catch((error) => {
  console.error(`[FATAL] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
