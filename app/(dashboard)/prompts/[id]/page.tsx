import { and, eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PromptDetail } from "@/components/prompts/PromptDetail";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { favorites, prompts } from "@/lib/db/schema";
import { listVariantsForPrompt } from "@/lib/db/queries/variants";

async function getPromptForViewer(id: string, profileId: string) {
  const db = getDb();
  return db.query.prompts.findFirst({
    where: and(eq(prompts.id, id), or(eq(prompts.authorId, profileId), eq(prompts.visibility, "public"))),
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const profile = await requireProfile();
    const prompt = await getPromptForViewer(id, profile.id);

    if (!prompt) {
      return {
        title: "Prompt no encontrado",
      };
    }

    return {
      title: prompt.title,
      description: prompt.description || "Detalle de prompt",
    };
  } catch {
    return {
      title: "Prompt",
    };
  }
}

export default async function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const db = getDb();

  const prompt = await getPromptForViewer(id, profile.id);

  if (!prompt) {
    notFound();
  }

  const isOwner = prompt.authorId === profile.id;
  const favoriteEntry = isOwner
    ? null
    : await db.query.favorites.findFirst({
        where: and(eq(favorites.userId, profile.id), eq(favorites.promptId, prompt.id)),
        columns: { userId: true },
      });

  const isFavorite = isOwner ? prompt.isFavorite : Boolean(favoriteEntry);
  const variants = isOwner
    ? await listVariantsForPrompt(prompt.id, profile.id)
    : [];

  return (
    <PromptDetail
      prompt={prompt}
      isOwner={isOwner}
      isFavorite={isFavorite}
      variants={variants.map((item) => ({
        id: item.id,
        label: item.label,
        content: item.content,
        notes: item.notes,
        rating: item.rating,
        updatedAt: item.updatedAt.toISOString(),
      }))}
    />
  );
}
