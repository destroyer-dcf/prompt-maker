import Link from "next/link";
import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/EmptyState";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { requireProfile } from "@/lib/auth";
import { listTemplates } from "@/lib/db/queries/templates";

export const metadata: Metadata = {
  title: "Templates",
  description: "Plantillas reutilizables con variables para crear prompts más rápido.",
};

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;

  const templates = await listTemplates({
    userId: profile.id,
    q: params.q,
    limit: 120,
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-sm text-[--ink-soft]">Plantillas reutilizables con variables {"{{...}}"}.</p>
        </div>
        <Link href="/templates/new" className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          + Nuevo template
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {templates.length === 0 ? (
        <EmptyState
          title="Sin templates"
          description="No hay templates todavía."
        />
      ) : null}
    </section>
  );
}
