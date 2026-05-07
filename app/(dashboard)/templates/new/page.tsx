import { redirect } from "next/navigation";

import { createTemplate } from "@/actions/templates";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { requireProfile } from "@/lib/auth";
import { listTagSuggestions } from "@/lib/db/queries/tags";

export default async function NewTemplatePage() {
  const profile = await requireProfile();
  const availableTags = await listTagSuggestions(profile.id);

  async function submit(formData: FormData) {
    "use server";

    const result = await createTemplate(formData);
    if (!result.ok) throw new Error(result.error);
    redirect(`/templates/${result.data.templateId}`);
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo Template</h1>
      <TemplateForm action={submit} submitLabel="Crear template" availableTags={availableTags} />
    </section>
  );
}
