"use client";

import { useCallback, useEffect, useId, useMemo, useState, useTransition } from "react";
import { Command } from "lucide-react";
import { toast } from "sonner";

import { incrementCopyCount } from "@/actions/prompts";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useShortcut } from "@/hooks/useShortcut";
import { parseVariables, resolveVariables } from "@/lib/utils/variables";

type CommandPrompt = {
  id: string;
  title: string;
  type: string;
  content: string;
  targetModels: string[];
  templateDefaults?: Record<string, string>;
};

type CommandPaletteProps = {
  prompts: CommandPrompt[];
};

export function CommandPalette({ prompts }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<CommandPrompt | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const { copy } = useCopyToClipboard();
  const dialogId = useId();
  const searchId = useId();
  const listId = useId();

  const closePalette = useCallback(() => {
    setOpen(false);
    setSelectedPrompt(null);
    setQuery("");
    setValues({});
  }, []);

  useShortcut({
    key: "k",
    requireMod: true,
    onTrigger: () => {
      setOpen((prev) => !prev);
      setSelectedPrompt(null);
    },
  });

  useShortcut({
    key: "c",
    requireMod: true,
    shift: true,
    onTrigger: () => {
      setOpen(true);
      setSelectedPrompt(null);
    },
  });

  useShortcut({
    key: "escape",
    enabled: open,
    onTrigger: () => {
      closePalette();
    },
  });

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return prompts.slice(0, 30);

    return prompts
      .filter((prompt) => {
        return prompt.title.toLowerCase().includes(term) || prompt.content.toLowerCase().includes(term);
      })
      .slice(0, 30);
  }, [prompts, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  const variables = useMemo(
    () => (selectedPrompt ? parseVariables(selectedPrompt.content) : []),
    [selectedPrompt],
  );

  const resolved = useMemo(() => {
    if (!selectedPrompt) return "";
    return resolveVariables(selectedPrompt.content, values);
  }, [selectedPrompt, values]);

  async function copyWithTracking(promptId: string, text: string) {
    const copied = await copy(text);
    if (!copied) {
      toast.error("No se pudo copiar");
      return;
    }

    try {
      startTransition(async () => {
        await incrementCopyCount(promptId);
      });
      toast.success("Prompt copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  function selectForCopy(prompt: CommandPrompt) {
    const vars = parseVariables(prompt.content);
    if (vars.length === 0) {
      void copyWithTracking(prompt.id, prompt.content);
      return;
    }

    setSelectedPrompt(prompt);
    setValues(
      Object.fromEntries(
        vars.map((name) => [name, prompt.templateDefaults?.[name] ?? ""]),
      ),
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir paleta de comandos"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border bg-[--panel] px-3 text-xs font-semibold text-[--ink-soft] shadow-sm hover:bg-[--panel-soft]"
      >
        <Command className="h-3.5 w-3.5" />
        Cmd+K
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePalette();
            }
          }}
        >
          <div
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-label="Paleta de comandos"
            className="w-full max-w-3xl rounded-2xl border bg-[--panel] shadow-xl"
          >
            <div className="border-b p-4">
              <input
                id={searchId}
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar prompts y copiar rápido..."
                className="w-full rounded-xl border bg-[--panel] px-3 py-2"
                role="combobox"
                aria-expanded={!selectedPrompt}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                  selectedPrompt || filtered.length === 0
                    ? undefined
                    : `${listId}-option-${filtered[activeIndex]?.id ?? ""}`
                }
                onKeyDown={(event) => {
                  if (selectedPrompt) return;
                  if (filtered.length === 0) return;

                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveIndex((prev) => (prev + 1) % filtered.length);
                  }

                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
                  }

                  if (event.key === "Enter") {
                    event.preventDefault();
                    const active = filtered[activeIndex];
                    if (active) selectForCopy(active);
                  }
                }}
              />
            </div>

            {!selectedPrompt ? (
              <div
                id={listId}
                role="listbox"
                aria-labelledby={searchId}
                className="max-h-[60vh] overflow-auto p-3"
              >
                <div className="space-y-2">
                  {filtered.map((prompt, index) => (
                    <div
                      key={prompt.id}
                      id={`${listId}-option-${prompt.id}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={`flex items-center justify-between rounded-xl border p-3 text-sm ${
                        index === activeIndex ? "border-[--brand] bg-[--brand-soft]" : ""
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{prompt.title}</p>
                        <p className="text-xs text-[--ink-soft]">
                          {prompt.type}
                          {prompt.targetModels.length > 0
                            ? ` · ${prompt.targetModels.join(", ")}`
                            : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectForCopy(prompt)}
                        aria-label={`Copiar prompt ${prompt.title}`}
                        className="rounded-lg border px-2 py-1 text-xs font-semibold"
                      >
                        Copiar
                      </button>
                    </div>
                  ))}

                  {filtered.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-[--ink-soft]">
                      Sin resultados
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 p-4 md:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-sm font-semibold">{selectedPrompt.title}</p>
                  {selectedPrompt.targetModels.length > 0 ? (
                    <p className="text-xs text-[--ink-soft]">
                      Modelos: {selectedPrompt.targetModels.join(", ")}
                    </p>
                  ) : null}
                  {variables.map((name) => (
                    <div key={name} className="space-y-1">
                      <label htmlFor={`cmdk-var-${name}`} className="text-sm font-medium">
                        {name}
                      </label>
                      <input
                        id={`cmdk-var-${name}`}
                        value={values[name] ?? ""}
                        onChange={(event) => setValues((prev) => ({ ...prev, [name]: event.target.value }))}
                        className="w-full rounded-xl border bg-[--panel] px-3 py-2"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Vista previa</p>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border bg-[--panel-soft] p-3 font-mono text-xs">
                    {resolved}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-[--ink-soft]">
                Atajos: Cmd/Ctrl+K abrir, Cmd/Ctrl+Shift+C quick copy, Esc cerrar
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    closePalette();
                  }}
                  className="rounded-lg border px-3 py-1.5 text-sm"
                >
                  Cerrar
                </button>
                {selectedPrompt ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedPrompt(null)}
                      className="rounded-lg border px-3 py-1.5 text-sm"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await copyWithTracking(selectedPrompt.id, resolved);
                        setSelectedPrompt(null);
                        setOpen(false);
                      }}
                      className="rounded-lg bg-[--brand] px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      {pending ? "Copiando..." : "Copiar resuelto"}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
