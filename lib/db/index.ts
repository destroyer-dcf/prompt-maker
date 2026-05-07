import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env, assertEnv } from "@/lib/env";
import * as schema from "@/lib/db/schema";

let instance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (instance) return instance;

  const connection = assertEnv("DATABASE_URL", env.databaseUrl);
  const client = postgres(connection, { prepare: false });
  instance = drizzle(client, { schema });
  return instance;
}
