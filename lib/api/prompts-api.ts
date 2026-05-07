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

type PromptApiQuery = URLSearchParams;

export async function searchPromptsForApi(
  profileId: string,
  params: PromptApiQuery,
) {
  const q = params.get("q")?.trim();
  const type = params.get("type");
  const status = params.get("status");
  const scope = params.get("scope");
  const visibility = params.get("visibility");
  const collectionId = params.get("collectionId");
  const tags = params
    .get("tags")
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const targetModel = params.get("targetModel")?.trim();
  const favoriteOnly = params.get("favoriteOnly") === "1";
  const rating = params.get("rating");
  const sort = params.get("sort") ?? "updated_desc";
  const limit = Math.min(Number(params.get("limit") ?? 20), 100);

  const relevanceOrder = q
    ? [
        sql`ts_rank(
          to_tsvector('spanish', coalesce(${prompts.title}, '') || ' ' || coalesce(${prompts.content}, '')),
          plainto_tsquery('spanish', ${q})
        ) desc`,
      ]
    : [];
  const sortOrder =
    sort === "updated_asc"
      ? [asc(prompts.updatedAt)]
      : sort === "title_asc"
        ? [asc(prompts.title)]
        : [desc(prompts.updatedAt)];
  const orderBy = [...relevanceOrder, ...sortOrder];

  const db = getDb();
  const validType = type && promptTypes.has(type as PromptType) ? (type as PromptType) : undefined;
  const validStatus =
    status === "draft" || status === "active" || status === "archived" ? status : undefined;
  const validScope =
    scope === "all" || scope === "mine" || scope === "public" ? scope : "all";
  const validVisibility =
    visibility === "private" || visibility === "public" ? visibility : undefined;
  const unratedOnly = rating === "unrated";
  const parsedRating = Number(rating ?? "");
  const ratingMin =
    !unratedOnly && Number.isFinite(parsedRating) && parsedRating > 0 ? parsedRating : null;

  const rows = await db.query.prompts.findMany({
    where: and(
      validScope === "mine"
        ? eq(prompts.authorId, profileId)
        : validScope === "public"
          ? eq(prompts.visibility, "public")
          : or(eq(prompts.authorId, profileId), eq(prompts.visibility, "public")),
      q
        ? sql`to_tsvector('spanish', coalesce(${prompts.title}, '') || ' ' || coalesce(${prompts.content}, '')) @@ plainto_tsquery('spanish', ${q})`
        : undefined,
      validType ? eq(prompts.type, validType) : undefined,
      validStatus ? eq(prompts.status, validStatus) : undefined,
      validVisibility ? eq(prompts.visibility, validVisibility) : undefined,
      collectionId ? eq(prompts.collectionId, collectionId) : undefined,
      unratedOnly ? isNull(prompts.rating) : undefined,
      ratingMin !== null ? gte(prompts.rating, ratingMin) : undefined,
    ),
    orderBy,
    limit: Math.min(Math.max(limit * 2, 40), 200),
  });

  const modelFiltered =
    targetModel && targetModel.length > 0
      ? rows.filter((prompt) => prompt.targetModels?.includes(targetModel))
      : rows;

  const tagsFiltered =
    tags && tags.length > 0
      ? modelFiltered.filter((prompt) =>
          tags.every((tag) => (prompt.tags ?? []).includes(tag)),
        )
      : modelFiltered;

  const favoritesFiltered = favoriteOnly
    ? await (async () => {
        const favoritesRows = await db.query.favorites.findMany({
          where: eq(favorites.userId, profileId),
          columns: { promptId: true },
        });
        const favoriteIds = new Set(favoritesRows.map((item) => item.promptId));

        return tagsFiltered.filter((prompt) => {
          if (prompt.authorId === profileId) return Boolean(prompt.isFavorite);
          return favoriteIds.has(prompt.id);
        });
      })()
    : tagsFiltered;

  const data = favoritesFiltered.slice(0, limit);

  return data.map((prompt) =>
    prompt.authorId === profileId
      ? prompt
      : {
          ...prompt,
          notes: null,
        },
  );
}
