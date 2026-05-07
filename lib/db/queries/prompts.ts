import { and, asc, desc, eq, gte, isNull, or, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { favorites, prompts } from "@/lib/db/schema";

type PromptType = NonNullable<(typeof prompts.$inferSelect)["type"]>;

const promptTypes = new Set<PromptType>([
  "system",
  "user",
  "assistant",
  "few-shot",
  "chain-of-thought",
  "instruction",
  "persona",
  "template",
  "custom",
]);

type PromptFilters = {
  userId: string;
  q?: string;
  type?: string | null;
  status?: "draft" | "active" | "archived" | null;
  scope?: "all" | "mine" | "public" | null;
  visibility?: "private" | "public" | null;
  collectionId?: string | null;
  tags?: string[] | null;
  favoriteOnly?: boolean;
  ratingMin?: number | null;
  unratedOnly?: boolean;
  targetModel?: string | null;
  sort?:
    | "recent"
    | "oldest"
    | "title_asc"
    | "title_desc"
    | "copies_desc"
    | "clones_desc"
    | "rating_desc"
    | null;
  limit?: number;
};

export async function listPrompts(filters: PromptFilters) {
  const db = getDb();
  const q = filters.q?.trim();
  const validType =
    filters.type && promptTypes.has(filters.type as PromptType)
      ? (filters.type as PromptType)
      : undefined;

  const validStatus =
    filters.status === "draft" || filters.status === "active" || filters.status === "archived"
      ? filters.status
      : undefined;

  const baseScope =
    filters.scope === "mine"
      ? eq(prompts.authorId, filters.userId)
      : filters.scope === "public"
        ? eq(prompts.visibility, "public")
        : or(eq(prompts.authorId, filters.userId), eq(prompts.visibility, "public"));

  const where = and(
    baseScope,
    q
      ? sql`to_tsvector('spanish', coalesce(${prompts.title}, '') || ' ' || coalesce(${prompts.content}, '')) @@ plainto_tsquery('spanish', ${q})`
      : undefined,
    validType ? eq(prompts.type, validType) : undefined,
    validStatus ? eq(prompts.status, validStatus) : undefined,
    filters.visibility ? eq(prompts.visibility, filters.visibility) : undefined,
    filters.collectionId ? eq(prompts.collectionId, filters.collectionId) : undefined,
    filters.unratedOnly ? isNull(prompts.rating) : undefined,
    filters.ratingMin !== null && filters.ratingMin !== undefined
      ? gte(prompts.rating, filters.ratingMin)
      : undefined,
  );

  const sort = filters.sort ?? "recent";
  const relevanceOrder = q
    ? [
        sql`ts_rank(
          to_tsvector('spanish', coalesce(${prompts.title}, '') || ' ' || coalesce(${prompts.content}, '')),
          plainto_tsquery('spanish', ${q})
        ) desc`,
      ]
    : [];

  const orderBy = [
    ...relevanceOrder,
    sort === "oldest"
      ? [asc(prompts.updatedAt)]
      : sort === "title_asc"
        ? [asc(prompts.title)]
        : sort === "title_desc"
          ? [desc(prompts.title)]
          : sort === "copies_desc"
            ? [desc(prompts.copyCount), desc(prompts.updatedAt)]
            : sort === "clones_desc"
              ? [desc(prompts.cloneCount), desc(prompts.updatedAt)]
              : sort === "rating_desc"
                ? [desc(prompts.rating), desc(prompts.updatedAt)]
                : [desc(prompts.pinned), desc(prompts.updatedAt)],
  ].flat();

  const rows = await db.query.prompts.findMany({
    where,
    orderBy,
    limit: Math.min(Math.max((filters.limit ?? 80) * 2, 80), 200),
  });

  const model = filters.targetModel?.trim();
  const requestedTags = (filters.tags ?? []).map((item) => item.trim()).filter(Boolean);
  const modelFiltered =
    model && model.length > 0
      ? rows.filter((prompt) => prompt.targetModels?.includes(model))
      : rows;

  const tagsFiltered =
    requestedTags.length > 0
      ? modelFiltered.filter((prompt) =>
          requestedTags.every((tag) => (prompt.tags ?? []).includes(tag)),
        )
      : modelFiltered;

  const favoritesFiltered = filters.favoriteOnly
    ? await (async () => {
        const favoritesRows = await db.query.favorites.findMany({
          where: eq(favorites.userId, filters.userId),
          columns: { promptId: true },
        });
        const favoriteIds = new Set(favoritesRows.map((item) => item.promptId));

        return tagsFiltered.filter((prompt) => {
          if (prompt.authorId === filters.userId) return Boolean(prompt.isFavorite);
          return favoriteIds.has(prompt.id);
        });
      })()
    : tagsFiltered;

  return favoritesFiltered.slice(0, Math.min(filters.limit ?? 80, 100));
}

export async function getPromptById(id: string, userId: string) {
  const db = getDb();
  return db.query.prompts.findFirst({
    where: and(
      eq(prompts.id, id),
      or(eq(prompts.authorId, userId), eq(prompts.visibility, "public")),
    ),
  });
}

export async function getPromptBySlug(slug: string, userId: string) {
  const db = getDb();
  return db.query.prompts.findFirst({
    where: and(
      eq(prompts.slug, slug),
      or(eq(prompts.authorId, userId), eq(prompts.visibility, "public")),
    ),
  });
}

export async function fullTextSearch(query: string, userId: string, limit = 20) {
  const db = getDb();
  const term = query.trim();
  if (!term) return [];

  return db
    .select()
    .from(prompts)
    .where(
      and(
        or(eq(prompts.authorId, userId), eq(prompts.visibility, "public")),
        sql`to_tsvector('spanish', ${prompts.title} || ' ' || ${prompts.content}) @@ plainto_tsquery('spanish', ${term})`,
      ),
    )
    .orderBy(desc(prompts.updatedAt))
    .limit(Math.min(limit, 100));
}
