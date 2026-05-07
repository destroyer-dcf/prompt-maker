import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { updatePrompt } from "@/actions/prompts";
import { PromptForm } from "@/components/prompts/PromptForm";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listCollectionsForUser } from "@/lib/db/queries/collections";
import { listTagSuggestions } from "@/lib/db/queries/tags";
import { prompts } from "@/lib/db/schema";

export default async function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const db = getDb();

  const prompt = await db.query.prompts.findFirst({
    where: and(eq(prompts.id, id), eq(prompts.authorId, profile.id)),
  });

  if (!prompt) notFound();
  const [collections, availableTags] = await Promise.all([
    listCollectionsForUser(profile.id),
    listTagSuggestions(profile.id),
  ]);

  async function submit(formData: FormData) {
    "use server";

    const result = await updatePrompt(id, formData);
    if (!result.ok) throw new Error(result.error);
    redirect(`/prompts/${result.data.promptId}`);
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Editar Prompt</h1>
      <PromptForm
        action={submit}
        submitLabel="Guardar cambios"
        initial={prompt}
        collections={collections.map((collection) => ({
          id: collection.id,
          name: collection.name,
        }))}
        availableTags={availableTags}
      />
    </section>
  );
}
