import { and, eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { deleteTemplate } from "@/actions/templates";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { templates } from "@/lib/db/schema";

async function getTemplateForViewer(id: string, profileId: string) {
  const db = getDb();
  return db.query.templates.findFirst({
    where: and(eq(templates.id, id), or(eq(templates.authorId, profileId), eq(templates.visibility, "public"))),
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
    const template = await getTemplateForViewer(id, profile.id);

    if (!template) {
      return { title: "Template no encontrado" };
    }

    return {
      title: template.title,
      description: template.description || "Detalle de template",
    };
  } catch {
    return { title: "Template" };
  }
}

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const template = await getTemplateForViewer(id, profile.id);

  if (!template) notFound();

  const isOwner = template.authorId === profile.id;
  const templateVariables = template.variables ?? [];

  return (
    <section className="space-y-5">
      <article className="space-y-4 rounded-2xl border bg-[--panel] p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{template.title}</h1>
            <p className="mt-1 text-sm text-[--ink-soft]">{template.description || "Sin descripción"}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/prompts/new?templateId=${template.id}`}
              className="rounded-xl bg-[--brand] px-3 py-1.5 text-sm font-semibold text-white"
            >
              Usar template
            </Link>
            {isOwner ? (
              <Link href={`/templates/${template.id}/edit`} className="rounded-xl border px-3 py-1.5 text-sm font-medium">
                Editar
              </Link>
            ) : null}
          </div>
        </header>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[--brand-soft] px-2 py-1 text-[--brand]">{template.type}</span>
          <span className="rounded-full border px-2 py-1">{template.visibility}</span>
          <span className="rounded-full border px-2 py-1">usage: {template.usageCount}</span>
        </div>

        <pre className="whitespace-pre-wrap rounded-2xl border bg-[--panel-soft] p-4 font-mono text-sm">{template.content}</pre>

        <div>
          <h2 className="text-sm font-semibold">Variables</h2>
          {templateVariables.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-[--ink-soft]">
              {templateVariables.map((variable) => (
                <li key={variable.name} className="font-mono">
                  {`{{${variable.name}}}`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[--ink-soft]">Sin variables.</p>
          )}
        </div>
      </article>

      {isOwner ? (
        <form
          action={async () => {
            "use server";
            const result = await deleteTemplate(template.id);
            if (!result.ok) throw new Error(result.error);
            redirect("/templates");
          }}
        >
          <button className="rounded-xl border border-[--danger] px-4 py-2 text-sm font-semibold text-[--danger]">
            Eliminar template
          </button>
        </form>
      ) : null}
    </section>
  );
}
