"use client";

import type { FormEvent, ReactNode } from "react";

type PromptVariantFormProps = {
  formIdPrefix: string;
  submitLabel: string;
  pendingLabel: string;
  pending: boolean;
  disabled?: boolean;
  initial?: {
    label?: string;
    content?: string;
    notes?: string;
  };
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  actions?: ReactNode;
};

export function PromptVariantForm({
  formIdPrefix,
  submitLabel,
  pendingLabel,
  pending,
  disabled = false,
  initial,
  onSubmit,
  actions,
}: PromptVariantFormProps) {
  const blocked = pending || disabled;

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor={`${formIdPrefix}-label`} className="text-sm font-medium">
          Label
        </label>
        <input
          id={`${formIdPrefix}-label`}
          name="label"
          required
          defaultValue={initial?.label ?? ""}
          className="w-full rounded-xl border bg-[--panel] px-3 py-2"
          placeholder="Mas conciso"
          disabled={blocked}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor={`${formIdPrefix}-content`} className="text-sm font-medium">
          Contenido
        </label>
        <textarea
          id={`${formIdPrefix}-content`}
          name="content"
          rows={10}
          required
          defaultValue={initial?.content ?? ""}
          className="w-full rounded-xl border bg-[--panel] px-3 py-2 font-mono text-sm"
          disabled={blocked}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor={`${formIdPrefix}-notes`} className="text-sm font-medium">
          Notas privadas
        </label>
        <textarea
          id={`${formIdPrefix}-notes`}
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          className="w-full rounded-xl border bg-[--panel] px-3 py-2"
          disabled={blocked}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {actions}
        <button
          type="submit"
          disabled={blocked}
          className="rounded-xl bg-[--brand] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
