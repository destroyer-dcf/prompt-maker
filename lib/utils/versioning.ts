import { asc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { promptVersions } from "@/lib/db/schema";

export const MAX_PROMPT_VERSIONS = 10;

export async function trimPromptVersions(promptId: string, max = MAX_PROMPT_VERSIONS) {
  const db = getDb();

  const versions = await db.query.promptVersions.findMany({
    where: eq(promptVersions.promptId, promptId),
    columns: { id: true },
    orderBy: [asc(promptVersions.version)],
  });

  if (versions.length <= max) return;

  const idsToDelete = versions
    .slice(0, versions.length - max)
    .map((item) => item.id);

  if (idsToDelete.length === 0) return;

  await db.delete(promptVersions).where(inArray(promptVersions.id, idsToDelete));
}
