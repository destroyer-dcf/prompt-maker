import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { promptVariants } from "@/lib/db/schema";

export async function listVariantsForPrompt(promptId: string, userId: string) {
  const db = getDb();

  return db.query.promptVariants.findMany({
    where: and(
      eq(promptVariants.promptId, promptId),
      eq(promptVariants.authorId, userId),
    ),
    orderBy: [desc(promptVariants.updatedAt)],
  });
}
