import Link from "next/link";
import { redirect } from "next/navigation";

import { createPrompt } from "@/actions/prompts";
import { NewPromptComposer } from "@/components/prompts/NewPromptComposer";
import { requireProfile } from "@/lib/auth";
import { listCollectionsForUser } from "@/lib/db/queries/collections";
import { listTagSuggestions } from "@/lib/db/queries/tags";
import { listTemplates } from "@/lib/db/queries/templates";

export default async function NewPromptPage({
  searchParams,
}: {
  searchParams: Promise<{ templateId?: string }>;
}) {
  const profile = await requireProfile();
  const { templateId } = await searchParams;

  const [templates, collections, availableTags] = await Promise.all([
    listTemplates({
      userId: profile.id,
      limit: 200,
    }),
    listCollectionsForUser(profile.id),
    listTagSuggestions(profile.id),
  ]);

  async function submit(formData: FormData) {
    "use server";

    const result = await createPrompt(formData);
    if (!result.ok) throw new Error(result.error);
    redirect(`/prompts/${result.data.promptId}`);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Nuevo Prompt</h1>
        <Link href="/templates" className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-[--panel-soft]">
          Ver templates
        </Link>
      </div>

      <NewPromptComposer
        action={submit}
        templates={templates.map((template) => ({
          id: template.id,
          title: template.title,
          description: template.description ?? "",
          content: template.content,
          type: template.type ?? "custom",
          visibility: template.visibility ?? "private",
          tags: template.tags ?? [],
          variables: template.variables ?? [],
        }))}
        collections={collections.map((collection) => ({ id: collection.id, name: collection.name }))}
        availableTags={availableTags}
        initialTemplateId={templateId}
      />
    </section>
  );
}
