"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/actions/types";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { generateApiKey } from "@/lib/utils/api-key";

export async function createApiKey(name: string): Promise<ActionResult<{ raw: string; prefix: string }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const existing = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, profile.id),
      columns: { id: true },
    });

    if (existing.length >= 5) throw new Error("Máximo 5 API keys por usuario");

    const { raw, hash, prefix } = generateApiKey();

    await db.insert(apiKeys).values({
      userId: profile.id,
      name,
      keyHash: hash,
      prefix,
    });

    revalidatePath("/settings/api-keys");
    return ok({ raw, prefix });
  } catch (error) {
    return fail(error);
  }
}

export async function listApiKeys() {
  const profile = await requireProfile();
  const db = getDb();

  return db.query.apiKeys.findMany({
    where: eq(apiKeys.userId, profile.id),
    orderBy: [desc(apiKeys.createdAt)],
  });
}

export async function revokeApiKey(id: string): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, profile.id)));

    revalidatePath("/settings/api-keys");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
