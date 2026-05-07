"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { incrementCopyCount } from "@/actions/prompts";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { parseVariables, resolveVariables } from "@/lib/utils/variables";

type CopyPromptButtonProps = {
  promptId: string;
  title: string;
  content: string;
  className?: string;
};

export function CopyPromptButton({ promptId, title, content, className }: CopyPromptButtonProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const { copy, copying } = useCopyToClipboard();

  const variables = useMemo(() => parseVariables(content), [content]);
  const resolved = useMemo(() => resolveVariables(content, values), [content, values]);

  async function registerCopy() {
    startTransition(async () => {
      await incrementCopyCount(promptId);
    });
  }

  async function copyText(text: string) {
    const copied = await copy(text);
    if (!copied) {
      toast.error("No se pudo copiar el contenido");
      return;
    }

    void registerCopy();
    toast.success("Prompt copiado al portapapeles");
  }

  function onCopyClick() {
    if (variables.length === 0) {
      void copyText(content);
      return;
    }

    const initialValues = Object.fromEntries(variables.map((name) => [name, ""]));
    setValues(initialValues);
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={onCopyClick}
        className={
          className ?? "rounded-xl border px-3 py-1.5 text-sm font-medium hover:bg-[--panel-soft]"
        }
      >
        {pending || copying ? "Registrando..." : "Copiar"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl border bg-[--panel] shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-lg font-semibold">Rellenar variables</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border px-2 py-1 text-sm"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm text-[--ink-soft]">{title}</p>
                {variables.map((name) => (
                  <div key={name} className="space-y-1">
                    <label htmlFor={`copy-var-${name}`} className="text-sm font-medium">
                      {name}
                    </label>
                    <input
                      id={`copy-var-${name}`}
                      value={values[name] ?? ""}
                      onChange={(event) => setValues((prev) => ({ ...prev, [name]: event.target.value }))}
                      className="w-full rounded-xl border bg-[--panel] px-3 py-2"
                      placeholder={`Valor para ${name}`}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Vista previa</p>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border bg-[--panel-soft] p-3 font-mono text-xs">
                  {resolved}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t px-4 py-3">
              <button
                type="button"
                onClick={() => copyText(content)}
                className="rounded-xl border px-3 py-2 text-sm font-medium"
              >
                Copiar tal cual
              </button>
              <button
                type="button"
                onClick={async () => {
                  await copyText(resolved);
                  setOpen(false);
                }}
                className="rounded-xl bg-[--brand] px-3 py-2 text-sm font-semibold text-white"
              >
                Copiar resuelto
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
