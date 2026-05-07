import Link from "next/link";

import type { templates } from "@/lib/db/schema";

type Template = typeof templates.$inferSelect;

export function TemplateCard({ template }: { template: Template }) {
  return (
    <article className="rounded-2xl border bg-[--panel] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold">{template.title}</h3>
        <span className="rounded-full bg-[--brand-soft] px-2 py-0.5 text-xs font-medium text-[--brand]">{template.type}</span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-[--ink-soft]">{template.description || "Sin descripción"}</p>
      <pre className="mt-3 line-clamp-4 whitespace-pre-wrap rounded-xl border bg-[--panel-soft] p-3 font-mono text-xs">
        {template.content}
      </pre>

      <div className="mt-4 flex items-center justify-between text-xs text-[--ink-soft]">
        <span>{template.visibility === "public" ? "Público" : "Privado"}</span>
        <Link href={`/templates/${template.id}`} className="font-semibold text-[--brand] hover:underline">
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
