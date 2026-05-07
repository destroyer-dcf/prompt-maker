"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

type PromptEditorProps = {
  id: string;
  name: string;
  label?: string;
  rows?: number;
  required?: boolean;
  className?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
};

export function PromptEditor({
  id,
  name,
  label = "Contenido",
  rows = 12,
  required = false,
  className,
  placeholder,
  defaultValue = "",
  value,
  onChange,
}: PromptEditorProps) {
  const controlled = typeof value === "string";
  const [internalValue, setInternalValue] = useState(defaultValue);
  const editorValue = controlled ? value : internalValue;
  const { copy } = useCopyToClipboard();

  useEffect(() => {
    if (!controlled) {
      setInternalValue(defaultValue);
    }
  }, [controlled, defaultValue]);

  const rootClass = useMemo(
    () => className ?? "w-full rounded-xl border bg-[--panel] px-3 py-2 font-mono text-sm",
    [className],
  );

  function setValue(next: string) {
    if (!controlled) {
      setInternalValue(next);
    }
    onChange?.(next);
  }

  function addBoldMarkers() {
    const next = `${editorValue}\n**texto**`;
    setValue(next.trimStart());
  }

  async function copyContent() {
    const copied = await copy(editorValue);
    if (!copied) {
      toast.error("No se pudo copiar el contenido");
      return;
    }
    toast.success("Contenido copiado");
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={addBoldMarkers}
            className="rounded-lg border px-2 py-1 text-xs font-medium hover:bg-[--panel-soft]"
          >
            Negrita
          </button>
          <button
            type="button"
            onClick={() => setValue("")}
            className="rounded-lg border px-2 py-1 text-xs font-medium hover:bg-[--panel-soft]"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => {
              void copyContent();
            }}
            className="rounded-lg border px-2 py-1 text-xs font-medium hover:bg-[--panel-soft]"
          >
            Copiar
          </button>
        </div>
      </div>

      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        value={editorValue}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className={rootClass}
      />
    </div>
  );
}
