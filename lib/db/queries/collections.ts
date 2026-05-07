import { and, asc, count, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { collections, prompts } from "@/lib/db/schema";

export type UserCollectionSummary = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  promptCount: number;
};

export async function listCollectionsForUser(userId: string): Promise<UserCollectionSummary[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: collections.id,
      name: collections.name,
      description: collections.description,
      color: collections.color,
      icon: collections.icon,
      promptCount: count(prompts.id),
    })
    .from(collections)
    .leftJoin(
      prompts,
      and(eq(prompts.collectionId, collections.id), eq(prompts.authorId, userId)),
    )
    .where(eq(collections.authorId, userId))
    .groupBy(collections.id)
    .orderBy(asc(collections.name));

  return rows.map((row) => ({
    ...row,
    promptCount: Number(row.promptCount),
  }));
}

export async function getCollectionWithPrompts(collectionId: string, userId: string) {
  const db = getDb();

  const collection = await db.query.collections.findFirst({
    where: and(eq(collections.id, collectionId), eq(collections.authorId, userId)),
  });

  if (!collection) return null;

  const items = await db.query.prompts.findMany({
    where: and(eq(prompts.authorId, userId), eq(prompts.collectionId, collection.id)),
    orderBy: [desc(prompts.updatedAt)],
  });

  return { collection, prompts: items };
}
