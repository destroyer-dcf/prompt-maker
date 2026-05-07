"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { incrementCopyCount } from "@/actions/prompts";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { resolveVariables } from "@/lib/utils/variables";

type PromptVariablesFillProps = {
  promptId: string;
  content: string;
  variables: string[];
};

export function PromptVariablesFill({
  promptId,
  content,
  variables,
}: PromptVariablesFillProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(variables.map((name) => [name, ""],)),
  );
  const [pending, startTransition] = useTransition();
  const { copy, copying } = useCopyToClipboard();

  const resolved = useMemo(() => resolveVariables(content, values), [content, values]);

  async function copyResolved() {
    const copied = await copy(resolved);
    if (!copied) {
      toast.error("No se pudo copiar el prompt");
      return;
    }

    startTransition(async () => {
      await incrementCopyCount(promptId);
    });
    toast.success("Prompt resuelto copiado");
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-[--panel-soft] p-4">
      <p className="text-sm font-semibold">Rellenar variables</p>

      <div className="grid gap-3 md:grid-cols-2">
        {variables.map((name) => (
          <div key={name} className="space-y-1">
            <label htmlFor={`prompt-var-${name}`} className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
              {name}
            </label>
            <input
              id={`prompt-var-${name}`}
              value={values[name] ?? ""}
              onChange={(event) => setValues((prev) => ({ ...prev, [name]: event.target.value }))}
              className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
              placeholder={`Valor para ${name}`}
            />
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
          Vista previa
        </p>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border bg-[--panel] p-3 font-mono text-xs">
          {resolved}
        </pre>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            void copyResolved();
          }}
          disabled={pending || copying}
          className="rounded-xl bg-[--brand] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending || copying ? "Copiando..." : "Copiar resuelto"}
        </button>
      </div>
    </div>
  );
}
