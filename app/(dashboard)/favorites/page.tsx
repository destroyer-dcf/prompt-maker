import { and, desc, eq } from "drizzle-orm";

import { PromptList } from "@/components/prompts/PromptList";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { favorites, prompts } from "@/lib/db/schema";

export default async function FavoritesPage() {
  const profile = await requireProfile();
  const db = getDb();

  const ownFavorites = await db.query.prompts.findMany({
    where: and(eq(prompts.authorId, profile.id), eq(prompts.isFavorite, true)),
    orderBy: [desc(prompts.updatedAt)],
  });

  const externalFavorites = await db
    .select({ prompt: prompts })
    .from(favorites)
    .innerJoin(prompts, eq(favorites.promptId, prompts.id))
    .where(eq(favorites.userId, profile.id));

  const combined = [...ownFavorites, ...externalFavorites.map((row) => row.prompt)];

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold">Favoritos</h1>
      <PromptList prompts={combined} view="grid" currentUserId={profile.id} />
    </section>
  );
}
