import { and, eq, ne } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { prompts } from "@/lib/db/schema";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

export async function uniqueSlug(title: string, excludeId?: string) {
  const db = getDb();
  const baseSlug = slugify(title) || "prompt";
  let slug = baseSlug;
  let suffix = 2;

  for (;;) {
    const existing = await db.query.prompts.findFirst({
      where: excludeId
        ? and(eq(prompts.slug, slug), ne(prompts.id, excludeId))
        : eq(prompts.slug, slug),
      columns: { id: true },
    });

    if (!existing) return slug;

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}
