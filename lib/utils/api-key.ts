import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { apiKeys, profiles } from "@/lib/db/schema";

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `pm_${randomBytes(32).toString("base64url")}`;
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 10);
  return { raw, hash, prefix };
}

export async function validateApiKey(authHeader: string | null) {
  const db = getDb();
  if (!authHeader?.startsWith("Bearer pm_")) {
    return null;
  }

  const raw = authHeader.slice(7);
  const hash = createHash("sha256").update(raw).digest("hex");

  const key = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, hash),
  });

  if (!key) return null;

  await db.update(apiKeys).set({ lastUsed: new Date() }).where(eq(apiKeys.id, key.id));

  return db.query.profiles.findFirst({
    where: eq(profiles.id, key.userId),
  });
}
