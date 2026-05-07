import type { Prompt } from "@/types";
import type { TemplateVariable } from "@/lib/db/schema";
import { CollectionSelector } from "@/components/collections/CollectionSelector";
import { PromptEditor } from "@/components/prompts/PromptEditor";
import { TagInput } from "@/components/prompts/TagInput";
import { TargetModelInput } from "@/components/prompts/TargetModelInput";
import { TemplateVariablesFillForm } from "@/components/templates/TemplateVariablesFillForm";

type PromptFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initial?: Partial<Prompt>;
  collections?: Array<{ id: string; name: string }>;
  availableTags?: Array<{ name: string; color: string | null }>;
  template?: {
    id: string;
    title: string;
    variables: TemplateVariable[];
  } | null;
};

export function PromptForm({
  action,
  submitLabel,
  initial,
  collections = [],
  availableTags = [],
  template,
}: PromptFormProps) {
  return (
    <form action={action} className="space-y-4 rounded-2xl border bg-[--panel] p-5">
      {template ? (
        <>
          <input type="hidden" name="templateId" value={template.id} />
          <div className="rounded-2xl border bg-[--panel-soft] p-4">
            <p className="text-sm font-semibold">Creando desde template</p>
            <p className="mt-1 text-sm text-[--ink-soft]">{template.title}</p>
          </div>
          <TemplateVariablesFillForm variables={template.variables} />
        </>
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

        <div className="md:col-span-2">
          <PromptEditor
            id="content"
            name="content"
            required
            rows={12}
            defaultValue={initial?.content ?? ""}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="type" className="text-sm font-medium">
            Tipo
          </label>
          <select id="type" name="type" defaultValue={initial?.type ?? "custom"} className="w-full rounded-xl border bg-[--panel] px-3 py-2">
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
          <select id="visibility" name="visibility" defaultValue={initial?.visibility ?? "private"} className="w-full rounded-xl border bg-[--panel] px-3 py-2">
            <option value="private">private</option>
            <option value="public">public</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="status" className="text-sm font-medium">
            Estado
          </label>
          <select id="status" name="status" defaultValue={initial?.status ?? "active"} className="w-full rounded-xl border bg-[--panel] px-3 py-2">
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
            defaultValue={initial?.rating ?? undefined}
            className="w-full rounded-xl border bg-[--panel] px-3 py-2"
          />
        </div>

        <TagInput
          defaultValue={Array.isArray(initial?.tags) ? initial.tags.join(", ") : ""}
          availableTags={availableTags}
        />

        <CollectionSelector
          collections={collections}
          defaultValue={initial?.collectionId ?? ""}
        />

        <TargetModelInput
          defaultValue={
            Array.isArray(initial?.targetModels) ? initial.targetModels.join(", ") : ""
          }
        />

        <div className="space-y-1 md:col-span-2">
          <label htmlFor="notes" className="text-sm font-medium">
            Notas privadas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={initial?.notes ?? ""}
            className="w-full rounded-xl border bg-[--panel] px-3 py-2"
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label htmlFor="changelog" className="text-sm font-medium">
            Changelog (solo en edición)
          </label>
          <input id="changelog" name="changelog" className="w-full rounded-xl border bg-[--panel] px-3 py-2" />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
