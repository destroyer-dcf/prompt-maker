import Link from "next/link";
import { and, asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";

import { PromptFilters } from "@/components/prompts/PromptFilters";
import { PromptList } from "@/components/prompts/PromptList";
import { PinnedPrompts } from "@/components/prompts/PinnedPrompts";
import { PromptStatusQuickFilter } from "@/components/prompts/PromptStatusQuickFilter";
import { ViewToggle } from "@/components/prompts/ViewToggle";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listCollectionsForUser } from "@/lib/db/queries/collections";
import { listPrompts } from "@/lib/db/queries/prompts";
import { listTagSuggestions } from "@/lib/db/queries/tags";
import { prompts as promptsTable } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Prompts",
  description: "Explora, filtra y organiza prompts de trabajo.",
};

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    view?: "grid" | "list" | "kanban";
    type?: string;
    tags?: string;
    status?: "draft" | "active" | "archived";
    scope?: "all" | "mine" | "public";
    visibility?: "private" | "public";
    collectionId?: string;
    favoriteOnly?: string;
    targetModel?: string;
    rating?: string;
    sort?:
      | "recent"
      | "oldest"
      | "title_asc"
      | "title_desc"
      | "copies_desc"
      | "clones_desc"
      | "rating_desc";
  }>;
}) {
  const profile = await requireProfile();
  const db = getDb();
  const params = await searchParams;
  const [collections, availableTags, pinnedPrompts] = await Promise.all([
    listCollectionsForUser(profile.id),
    listTagSuggestions(profile.id),
    db.query.prompts.findMany({
      where: and(eq(promptsTable.authorId, profile.id), eq(promptsTable.pinned, true)),
      columns: { id: true, title: true, type: true, pinnedOrder: true },
      orderBy: [asc(promptsTable.pinnedOrder), desc(promptsTable.updatedAt)],
      limit: 5,
    }),
  ]);

  const unratedOnly = params.rating === "unrated";
  const parsedRating = Number(params.rating ?? "");
  const ratingMin =
    !unratedOnly && Number.isFinite(parsedRating) && parsedRating > 0
      ? parsedRating
      : null;

  const promptItems = await listPrompts({
    userId: profile.id,
    q: params.q,
    type: params.type,
    tags: params.tags
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    status: params.status,
    scope: params.scope,
    visibility: params.visibility,
    collectionId: params.collectionId,
    targetModel: params.targetModel,
    favoriteOnly: params.favoriteOnly === "1",
    ratingMin,
    unratedOnly,
    sort: params.sort,
    limit: 80,
  });

  const view =
    params.view === "list" || params.view === "kanban" ? params.view : "grid";
  const hasExplicitViewParam =
    params.view === "grid" || params.view === "list" || params.view === "kanban";

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Prompts</h1>
          <p className="text-sm text-[--ink-soft]">Tus prompts privados y los públicos del equipo.</p>
        </div>

        <div className="flex items-center gap-2">
          <ViewToggle currentView={view} hasExplicitViewParam={hasExplicitViewParam} />
          <Link href="/prompts/new" className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            + Nuevo
          </Link>
        </div>
      </div>

      <PromptStatusQuickFilter />

      <PinnedPrompts items={pinnedPrompts} />

      <PromptFilters
        collections={collections.map((item) => ({ id: item.id, name: item.name }))}
        availableTags={availableTags}
        state={{
          q: params.q,
          type: params.type,
          tags: params.tags,
          status: params.status,
          scope: params.scope,
          visibility: params.visibility,
          collectionId: params.collectionId,
          favoriteOnly: params.favoriteOnly,
          targetModel: params.targetModel,
          rating: params.rating,
          sort: params.sort,
          view,
        }}
      />

      <PromptList prompts={promptItems} view={view} currentUserId={profile.id} />
    </section>
  );
}
