"use client";

import { useMemo, useState } from "react";

type TemplateSelectorItem = {
  id: string;
  title: string;
  description: string;
  type: string;
};

type TemplateSelectorProps = {
  open: boolean;
  onClose: () => void;
  templates: TemplateSelectorItem[];
  onSelect: (templateId: string) => void;
};

export function TemplateSelector({
  open,
  onClose,
  templates,
  onSelect,
}: TemplateSelectorProps) {
  const [search, setSearch] = useState("");

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return templates;

    return templates.filter((template) => {
      return (
        template.title.toLowerCase().includes(term) ||
        template.description.toLowerCase().includes(term)
      );
    });
  }, [search, templates]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <div className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl border bg-[--panel] shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Seleccionar template</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-2 py-1 text-sm"
          >
            Cerrar
          </button>
        </div>

        <div className="border-b p-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar template..."
            className="w-full rounded-xl border bg-[--panel] px-3 py-2"
          />
        </div>

        <div className="max-h-[56vh] overflow-auto p-4">
          <div className="space-y-3">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  onSelect(template.id);
                  onClose();
                  setSearch("");
                }}
                className="w-full rounded-xl border p-3 text-left transition hover:bg-[--panel-soft]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{template.title}</p>
                  <span className="rounded-full bg-[--brand-soft] px-2 py-0.5 text-xs text-[--brand]">
                    {template.type}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-[--ink-soft]">
                  {template.description || "Sin descripcion"}
                </p>
              </button>
            ))}

            {filteredTemplates.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-[--ink-soft]">
                No se encontraron templates.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
