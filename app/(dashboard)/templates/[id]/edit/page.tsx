import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { updateTemplate } from "@/actions/templates";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listTagSuggestions } from "@/lib/db/queries/tags";
import { templates } from "@/lib/db/schema";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const db = getDb();

  const template = await db.query.templates.findFirst({
    where: and(eq(templates.id, id), eq(templates.authorId, profile.id)),
  });

  if (!template) notFound();
  const availableTags = await listTagSuggestions(profile.id);

  async function submit(formData: FormData) {
    "use server";

    const result = await updateTemplate(id, formData);
    if (!result.ok) throw new Error(result.error);
    redirect(`/templates/${result.data.templateId}`);
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Editar Template</h1>
      <TemplateForm
        action={submit}
        submitLabel="Guardar template"
        initial={template}
        availableTags={availableTags}
      />
    </section>
  );
}
