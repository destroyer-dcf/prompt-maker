import { and, desc, eq, ilike, or } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { templates } from "@/lib/db/schema";

type TemplateFilters = {
  userId: string;
  q?: string;
  limit?: number;
};

export async function listTemplates(filters: TemplateFilters) {
  const db = getDb();

  return db.query.templates.findMany({
    where: and(
      or(eq(templates.authorId, filters.userId), eq(templates.visibility, "public")),
      filters.q
        ? or(ilike(templates.title, `%${filters.q}%`), ilike(templates.content, `%${filters.q}%`))
        : undefined,
    ),
    orderBy: [desc(templates.updatedAt)],
    limit: Math.min(filters.limit ?? 100, 200),
  });
}

export async function getTemplateByIdForUser(id: string, userId: string) {
  const db = getDb();

  return db.query.templates.findFirst({
    where: and(eq(templates.id, id), or(eq(templates.authorId, userId), eq(templates.visibility, "public"))),
  });
}
