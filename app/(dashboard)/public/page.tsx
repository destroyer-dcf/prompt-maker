import Link from "next/link";
import type { Metadata } from "next";

import { PromptList } from "@/components/prompts/PromptList";
import { ViewToggle } from "@/components/prompts/ViewToggle";
import { requireProfile } from "@/lib/auth";
import { listPrompts } from "@/lib/db/queries/prompts";

export const metadata: Metadata = {
  title: "Prompts Públicos",
  description: "Explora prompts públicos del equipo con búsqueda y ordenación.",
};

export default async function PublicPromptsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    tags?: string;
    sort?:
      | "recent"
      | "oldest"
      | "title_asc"
      | "title_desc"
      | "copies_desc"
      | "clones_desc"
      | "rating_desc";
    view?: "grid" | "list" | "kanban";
  }>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;

  const publicPrompts = await listPrompts({
    userId: profile.id,
    scope: "public",
    status: "active",
    q: params.q,
    type: params.type,
    tags: params.tags
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    sort: params.sort,
    limit: 200,
  });

  const view = params.view === "list" || params.view === "kanban" ? params.view : "grid";
  const hasExplicitViewParam =
    params.view === "grid" || params.view === "list" || params.view === "kanban";

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Prompts Públicos</h1>
          <p className="text-sm text-[--ink-soft]">
            Explora prompts activos compartidos por el equipo.
          </p>
        </div>
        <ViewToggle currentView={view} hasExplicitViewParam={hasExplicitViewParam} />
      </div>

      <form method="GET" className="grid gap-3 rounded-2xl border bg-[--panel] p-4 md:grid-cols-5">
        <input type="hidden" name="view" value={view} />

        <div className="space-y-1 md:col-span-2">
          <label htmlFor="q" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Titulo o contenido"
            className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="type" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
            Tipo
          </label>
          <select id="type" name="type" defaultValue={params.type ?? ""} className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm">
            <option value="">Todos</option>
            <option value="custom">custom</option>
            <option value="system">system</option>
            <option value="user">user</option>
            <option value="instruction">instruction</option>
            <option value="persona">persona</option>
            <option value="template">template</option>
            <option value="few-shot">few-shot</option>
            <option value="assistant">assistant</option>
            <option value="chain-of-thought">chain-of-thought</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="tags" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
            Tags
          </label>
          <input
            id="tags"
            name="tags"
            defaultValue={params.tags ?? ""}
            placeholder="tag1, tag2"
            className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
            Ordenar
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={params.sort ?? "copies_desc"}
            className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
          >
            <option value="copies_desc">Mas copiados</option>
            <option value="clones_desc">Mas clonados</option>
            <option value="recent">Mas reciente</option>
            <option value="oldest">Mas antiguo</option>
            <option value="title_asc">Titulo A-Z</option>
            <option value="title_desc">Titulo Z-A</option>
            <option value="rating_desc">Mejor rating</option>
          </select>
        </div>

        <div className="md:col-span-5 flex flex-wrap items-end justify-end gap-2">
          <Link
            href={`/public?view=${encodeURIComponent(view)}`}
            className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-[--panel-soft]"
          >
            Limpiar
          </Link>
          <button
            type="submit"
            className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Aplicar filtros
          </button>
        </div>
      </form>

      <PromptList prompts={publicPrompts} view={view} currentUserId={profile.id} />
    </section>
  );
}
