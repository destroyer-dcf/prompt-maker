"use client";

import { useMemo, useState } from "react";

import type { TemplateVariable } from "@/lib/db/schema";
import { resolveVariables } from "@/lib/utils/variables";
import { PromptEditor } from "@/components/prompts/PromptEditor";
import { TemplateSelector } from "@/components/templates/TemplateSelector";

type PromptType =
  | "system"
  | "user"
  | "assistant"
  | "few-shot"
  | "chain-of-thought"
  | "instruction"
  | "persona"
  | "template"
  | "custom";

type TemplateOption = {
  id: string;
  title: string;
  description: string;
  content: string;
  type: PromptType;
  visibility: "private" | "public";
  tags: string[];
  variables: TemplateVariable[];
};

type NewPromptComposerProps = {
  action: (formData: FormData) => void | Promise<void>;
  templates: TemplateOption[];
  collections: Array<{ id: string; name: string }>;
  availableTags: Array<{ name: string; color: string | null }>;
  initialTemplateId?: string;
};

function fieldForVariable(
  variable: TemplateVariable,
  value: string,
  onChange: (next: string) => void,
) {
  const common = {
    id: `tplvar__${variable.name}`,
    name: `tplvar__${variable.name}`,
    required: variable.required,
    className: "w-full rounded-xl border bg-[--panel] px-3 py-2",
  };

  if (variable.type === "textarea") {
    return (
      <textarea
        {...common}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={variable.placeholder ?? `Valor para ${variable.name}`}
      />
    );
  }

  if (variable.type === "select") {
    return (
      <select {...common} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Selecciona una opción</option>
        {(variable.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      {...common}
      type={variable.type === "number" ? "number" : "text"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={variable.placeholder ?? `Valor para ${variable.name}`}
    />
  );
}

export function NewPromptComposer({
  action,
  templates,
  collections,
  availableTags,
  initialTemplateId,
}: NewPromptComposerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId ?? "");
  const [contentTouched, setContentTouched] = useState(false);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const [title, setTitle] = useState(
    selectedTemplate ? `${selectedTemplate.title} (nuevo)` : "",
  );
  const [description, setDescription] = useState(selectedTemplate?.description ?? "");
  const [content, setContent] = useState(selectedTemplate?.content ?? "");
  const [type, setType] = useState<PromptType>(selectedTemplate?.type ?? "custom");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [status, setStatus] = useState<"active" | "draft" | "archived">("active");
  const [collectionId, setCollectionId] = useState("");
  const [tags, setTags] = useState(selectedTemplate?.tags.join(", ") ?? "");
  const [targetModels, setTargetModels] = useState("");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");

  const [templateValues, setTemplateValues] = useState<Record<string, string>>(() => {
    const initial = selectedTemplate?.variables ?? [];
    return Object.fromEntries(initial.map((variable) => [variable.name, variable.defaultValue ?? ""]));
  });

  const preview = useMemo(() => {
    if (!selectedTemplate) return content;
    return resolveVariables(content, templateValues);
  }, [content, selectedTemplate, templateValues]);

  function chooseTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;

    setSelectedTemplateId(template.id);

    if (!contentTouched) {
      setContent(template.content);
      setType(template.type);
      setTags(template.tags.join(", "));
      setDescription(template.description);
      setTitle(`${template.title} (nuevo)`);
    }

    setTemplateValues(
      Object.fromEntries(
        (template.variables ?? []).map((variable) => [variable.name, variable.defaultValue ?? ""]),
      ),
    );
  }

  function clearTemplate() {
    setSelectedTemplateId("");
    setTemplateValues({});
  }

  return (
    <>
      <form action={action} className="space-y-4 rounded-2xl border bg-[--panel] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-[--panel-soft] p-4">
          <div>
            <p className="text-sm font-semibold">Template</p>
            <p className="text-sm text-[--ink-soft]">
              {selectedTemplate ? selectedTemplate.title : "Sin template seleccionado"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-xl border px-3 py-1.5 text-sm font-medium hover:bg-[--panel]"
            >
              Seleccionar template
            </button>
            {selectedTemplate ? (
              <button
                type="button"
                onClick={clearTemplate}
                className="rounded-xl border px-3 py-1.5 text-sm font-medium text-[--danger]"
              >
                Quitar
              </button>
            ) : null}
          </div>
        </div>

        {selectedTemplate ? <input type="hidden" name="templateId" value={selectedTemplate.id} /> : null}

        {selectedTemplate && selectedTemplate.variables.length > 0 ? (
          <fieldset className="space-y-3 rounded-2xl border bg-[--panel-soft] p-4">
            <legend className="px-1 text-sm font-semibold">Variables del template</legend>
            {selectedTemplate.variables.map((variable) => (
              <div key={variable.name} className="space-y-1">
                <label htmlFor={`tplvar__${variable.name}`} className="text-sm font-medium">
                  {variable.label || variable.name}
                </label>
                {fieldForVariable(variable, templateValues[variable.name] ?? "", (next) => {
                  setTemplateValues((prev) => ({ ...prev, [variable.name]: next }));
                })}
              </div>
            ))}
          </fieldset>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="title" className="text-sm font-medium">
              Título
            </label>
            <input
              id="title"
              name="title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
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
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-xl border bg-[--panel] px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <PromptEditor
              id="content"
              name="content"
              required
              rows={12}
              value={content}
              onChange={(next) => {
                setContentTouched(true);
                setContent(next);
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="type" className="text-sm font-medium">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value as PromptType)}
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
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as "private" | "public")}
              className="w-full rounded-xl border bg-[--panel] px-3 py-2"
            >
              <option value="private">private</option>
              <option value="public">public</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="status" className="text-sm font-medium">
              Estado
            </label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as "active" | "draft" | "archived")}
              className="w-full rounded-xl border bg-[--panel] px-3 py-2"
            >
              <option value="active">active</option>
              <option value="draft">draft</option>
              <option value="archived">archived</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="rating" className="text-sm font-medium">
              Rating (1-5)
            </label>
            <input
              id="rating"
              name="rating"
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              className="w-full rounded-xl border bg-[--panel] px-3 py-2"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="tags" className="text-sm font-medium">
              Tags (coma separada)
            </label>
            <input
              id="tags"
              name="tags"
              list="new-prompt-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              className="w-full rounded-xl border bg-[--panel] px-3 py-2"
            />
            <datalist id="new-prompt-tags">
              {availableTags.map((tag) => (
                <option key={tag.name} value={tag.name} />
              ))}
            </datalist>
            {availableTags.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-1">
                {availableTags.slice(0, 12).map((tag) => (
                  <button
                    key={`new-tag-suggest-${tag.name}`}
                    type="button"
                    onClick={() => {
                      const current = tags
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean);
                      if (current.includes(tag.name)) return;
                      setTags([...current, tag.name].join(", "));
                    }}
                    className="rounded-full border px-2 py-0.5 text-xs hover:bg-[--panel-soft]"
                    style={tag.color ? { borderColor: tag.color } : undefined}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="collectionId" className="text-sm font-medium">
              Colección
            </label>
            <select
              id="collectionId"
              name="collectionId"
              value={collectionId}
              onChange={(event) => setCollectionId(event.target.value)}
              className="w-full rounded-xl border bg-[--panel] px-3 py-2"
            >
              <option value="">Sin colección</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="targetModels" className="text-sm font-medium">
              Target Models (coma separada)
            </label>
            <input
              id="targetModels"
              name="targetModels"
              value={targetModels}
              onChange={(event) => setTargetModels(event.target.value)}
              className="w-full rounded-xl border bg-[--panel] px-3 py-2"
              placeholder="gpt-4o, claude-3-5-sonnet"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notas privadas
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-xl border bg-[--panel] px-3 py-2"
            />
          </div>
        </div>

        {selectedTemplate ? (
          <div className="space-y-2 rounded-2xl border bg-[--panel-soft] p-4">
            <p className="text-sm font-semibold">Vista previa resuelta</p>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border bg-[--panel] p-3 font-mono text-xs">
              {preview}
            </pre>
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Crear prompt
          </button>
        </div>
      </form>

      <TemplateSelector
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        templates={templates.map((template) => ({
          id: template.id,
          title: template.title,
          description: template.description,
          type: template.type,
        }))}
        onSelect={chooseTemplate}
      />
    </>
  );
}
