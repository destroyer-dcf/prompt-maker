import fs from "node:fs";
import path from "node:path";

import postgres from "postgres";

function loadDotenvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const sep = line.indexOf("=");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = line.slice(sep + 1).replace(/^"|"$/g, "");
  }
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

async function main() {
  loadDotenvLocal();

  const databaseUrl = requireEnv("DATABASE_URL");
  const sqlScriptPath = path.resolve(process.cwd(), "scripts/supabase-rls.sql");
  const sqlScript = fs.readFileSync(sqlScriptPath, "utf8");

  const sql = postgres(databaseUrl, { ssl: "require", connect_timeout: 15, max: 1 });

  try {
    await sql.unsafe(sqlScript);
    console.log("RLS policies applied successfully.");
  } finally {
    await sql.end({ timeout: 1 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
