type PromptFiltersState = {
  q?: string;
  type?: string;
  tags?: string;
  status?: string;
  scope?: string;
  visibility?: string;
  collectionId?: string;
  favoriteOnly?: string;
  targetModel?: string;
  rating?: string;
  sort?: string;
  view?: string;
};

export function PromptFilters({
  state,
  collections,
  availableTags,
}: {
  state: PromptFiltersState;
  collections: Array<{ id: string; name: string }>;
  availableTags: Array<{ name: string; color: string | null }>;
}) {
  const view = state.view ?? "grid";

  return (
    <form method="GET" className="grid gap-3 rounded-2xl border bg-[--panel] p-4 md:grid-cols-6">
      <input type="hidden" name="view" value={view} />

      <div className="space-y-1 md:col-span-2">
        <label htmlFor="q" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
          Buscar
        </label>
        <input
          id="q"
          name="q"
          defaultValue={state.q ?? ""}
          placeholder="Titulo o contenido"
          className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="type" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
          Tipo
        </label>
        <select id="type" name="type" defaultValue={state.type ?? ""} className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm">
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
          list="prompt-filter-tags"
          defaultValue={state.tags ?? ""}
          placeholder="tag1, tag2"
          className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
        />
        <datalist id="prompt-filter-tags">
          {availableTags.map((tag) => (
            <option key={tag.name} value={tag.name} />
          ))}
        </datalist>
      </div>

      <div className="space-y-1">
        <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
          Estado
        </label>
        <select id="status" name="status" defaultValue={state.status ?? ""} className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm">
          <option value="">Todos</option>
          <option value="active">active</option>
          <option value="draft">draft</option>
          <option value="archived">archived</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="scope" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
          Alcance
        </label>
        <select id="scope" name="scope" defaultValue={state.scope ?? "all"} className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm">
          <option value="all">Todos</option>
          <option value="mine">Solo mios</option>
          <option value="public">Solo publicos</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="visibility" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
          Visibilidad
        </label>
        <select
          id="visibility"
          name="visibility"
          defaultValue={state.visibility ?? ""}
          className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
        >
          <option value="">Todas</option>
          <option value="private">private</option>
          <option value="public">public</option>
        </select>
      </div>

      <label className="flex items-center gap-2 self-end rounded-xl border px-3 py-2 text-sm">
        <input
          type="checkbox"
          name="favoriteOnly"
          value="1"
          defaultChecked={state.favoriteOnly === "1"}
        />
        Solo favoritos
      </label>

      <div className="space-y-1">
        <label htmlFor="rating" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
          Rating
        </label>
        <select id="rating" name="rating" defaultValue={state.rating ?? ""} className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm">
          <option value="">Cualquiera</option>
          <option value="4">&gt;= 4</option>
          <option value="5">= 5</option>
          <option value="unrated">Sin valorar</option>
        </select>
      </div>

      <div className="space-y-1 md:col-span-2">
        <label htmlFor="collectionId" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
          Coleccion
        </label>
        <select
          id="collectionId"
          name="collectionId"
          defaultValue={state.collectionId ?? ""}
          className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
        >
          <option value="">Todas</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1 md:col-span-2">
        <label htmlFor="targetModel" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
          Target Model
        </label>
        <input
          id="targetModel"
          name="targetModel"
          defaultValue={state.targetModel ?? ""}
          placeholder="gpt-4o"
          className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1 md:col-span-2">
        <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
          Ordenar
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={state.sort ?? "recent"}
          className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
        >
          <option value="recent">Mas reciente</option>
          <option value="oldest">Mas antiguo</option>
          <option value="title_asc">Titulo A-Z</option>
          <option value="title_desc">Titulo Z-A</option>
          <option value="copies_desc">Mas copiados</option>
          <option value="clones_desc">Mas clonados</option>
          <option value="rating_desc">Mejor rating</option>
        </select>
      </div>

      <div className="md:col-span-4 flex flex-wrap items-end justify-end gap-2">
        <a
          href={`/prompts?view=${encodeURIComponent(view)}`}
          className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-[--panel-soft]"
        >
          Limpiar
        </a>
        <button
          type="submit"
          className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Aplicar filtros
        </button>
      </div>
    </form>
  );
}
