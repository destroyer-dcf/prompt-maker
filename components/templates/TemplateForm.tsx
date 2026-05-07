"use client";

import { useEffect, useState } from "react";

import type { TemplateVariable } from "@/lib/db/schema";
import { parseVariables } from "@/lib/utils/variables";

type TemplateLike = {
  title?: string;
  description?: string | null;
  content?: string;
  type?:
    | "system"
    | "user"
    | "assistant"
    | "few-shot"
    | "chain-of-thought"
    | "instruction"
    | "persona"
    | "template"
    | "custom"
    | null;
  visibility?: "private" | "public" | null;
  tags?: string[] | null;
  variables?: TemplateVariable[] | null;
};

type TemplateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initial?: TemplateLike;
  availableTags?: Array<{ name: string; color: string | null }>;
};

function buildVariableDefinitions(content: string, current: TemplateVariable[] = []): TemplateVariable[] {
  const names = parseVariables(content);

  return names.map((name) => {
    const existing = current.find((item) => item.name === name);
    return (
      existing ?? {
        name,
        label: name,
        type: "text",
        required: true,
      }
    );
  });
}

export function TemplateForm({
  action,
  submitLabel,
  initial,
  availableTags = [],
}: TemplateFormProps) {
  const [content, setContent] = useState(initial?.content ?? "");
  const [tags, setTags] = useState(Array.isArray(initial?.tags) ? initial?.tags.join(", ") : "");
  const [variableDefinitions, setVariableDefinitions] = useState<TemplateVariable[]>(
    () => buildVariableDefinitions(initial?.content ?? "", initial?.variables ?? []),
  );

  useEffect(() => {
    setVariableDefinitions((previous) => buildVariableDefinitions(content, previous));
  }, [content]);

  function updateVariable(
    name: string,
    patch: Partial<TemplateVariable>,
  ) {
    setVariableDefinitions((previous) =>
      previous.map((item) => (item.name === name ? { ...item, ...patch } : item)),
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border bg-[--panel] p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1 md:col-span-2">
          <label htmlFor="title" className="text-sm font-medium">
            Título
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={initial?.title ?? ""}
            className="w-full rounded-xl border bg-[--panel] px-3 py-2"
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label htmlFor="description" className="text-sm font-medium">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={initial?.description ?? ""}
            className="w-full rounded-xl border bg-[--panel] px-3 py-2"
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label htmlFor="content" className="text-sm font-medium">
            Contenido del template
          </label>
          <textarea
            id="content"
            name="content"
            rows={12}
            required
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="w-full rounded-xl border bg-[--panel] px-3 py-2 font-mono text-sm"
            placeholder="Actúa como {{rol}} y haz {{tarea}}..."
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="type" className="text-sm font-medium">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            defaultValue={initial?.type ?? "custom"}
            className="w-full rounded-xl border bg-[--panel] px-3 py-2"
          >
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
          <label htmlFor="visibility" className="text-sm font-medium">
            Visibilidad
          </label>
          <select
            id="visibility"
            name="visibility"
            defaultValue={initial?.visibility ?? "private"}
            className="w-full rounded-xl border bg-[--panel] px-3 py-2"
          >
            <option value="private">private</option>
            <option value="public">public</option>
          </select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label htmlFor="tags" className="text-sm font-medium">
            Tags (coma separada)
          </label>
          <input
            id="tags"
            name="tags"
            list="template-tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="w-full rounded-xl border bg-[--panel] px-3 py-2"
          />
          <datalist id="template-tags">
            {availableTags.map((tag) => (
              <option key={tag.name} value={tag.name} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="rounded-2xl border bg-[--panel-soft] p-4">
        <p className="text-sm font-semibold">Variables detectadas</p>
        {variableDefinitions.length > 0 ? (
          <div className="mt-3 space-y-3">
            {variableDefinitions.map((variable) => (
              <div key={variable.name} className="rounded-xl border bg-[--panel] p-3">
                <p className="text-xs font-mono text-[--ink-soft]">{`{{${variable.name}}}`}</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Label</label>
                    <input
                      value={variable.label ?? variable.name}
                      onChange={(event) =>
                        updateVariable(variable.name, { label: event.target.value })
                      }
                      className="w-full rounded-lg border bg-[--panel] px-2 py-1.5 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Tipo</label>
                    <select
                      value={variable.type}
                      onChange={(event) =>
                        updateVariable(variable.name, {
                          type: event.target.value as TemplateVariable["type"],
                          options:
                            event.target.value === "select"
                              ? variable.options ?? []
                              : undefined,
                        })
                      }
                      className="w-full rounded-lg border bg-[--panel] px-2 py-1.5 text-sm"
                    >
                      <option value="text">text</option>
                      <option value="textarea">textarea</option>
                      <option value="select">select</option>
                      <option value="number">number</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Valor por defecto</label>
                    <input
                      value={variable.defaultValue ?? ""}
                      onChange={(event) =>
                        updateVariable(variable.name, { defaultValue: event.target.value })
                      }
                      className="w-full rounded-lg border bg-[--panel] px-2 py-1.5 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Placeholder</label>
                    <input
                      value={variable.placeholder ?? ""}
                      onChange={(event) =>
                        updateVariable(variable.name, { placeholder: event.target.value })
                      }
                      className="w-full rounded-lg border bg-[--panel] px-2 py-1.5 text-sm"
                    />
                  </div>

                  {variable.type === "select" ? (
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium">Opciones (coma separada)</label>
                      <input
                        value={(variable.options ?? []).join(", ")}
                        onChange={(event) =>
                          updateVariable(variable.name, {
                            options: event.target.value
                              .split(",")
                              .map((value) => value.trim())
                              .filter(Boolean),
                          })
                        }
                        className="w-full rounded-lg border bg-[--panel] px-2 py-1.5 text-sm"
                      />
                    </div>
                  ) : null}

                  <label className="inline-flex items-center gap-2 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={Boolean(variable.required)}
                      onChange={(event) =>
                        updateVariable(variable.name, { required: event.target.checked })
                      }
                    />
                    <span className="text-xs">Variable requerida</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[--ink-soft]">No se detectaron placeholders.</p>
        )}
      </div>

      <input type="hidden" name="variables" value={JSON.stringify(variableDefinitions)} />

      <div className="flex justify-end">
        <button type="submit" className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
