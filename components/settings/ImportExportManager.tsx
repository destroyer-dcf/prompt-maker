"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { applyImport, previewImport } from "@/actions/import-export";

type PreviewItem = {
  id: string;
  title: string;
  type: string;
  visibility: "private" | "public";
  tags: string[];
  hasConflict: boolean;
  conflictWithTitle: string | null;
};

type PreviewResult = {
  source: "json" | "markdown" | "zip";
  errors: string[];
  items: PreviewItem[];
  payload: string;
};

export function ImportExportManager() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [mode, setMode] = useState<"skip" | "rename" | "overwrite">("skip");
  const [itemModes, setItemModes] = useState<Record<string, "skip" | "rename" | "overwrite">>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
  const [busy, startTransition] = useTransition();

  const selectedCount = selectedIds.length;
  const conflicts = useMemo(
    () => preview?.items.filter((item) => item.hasConflict).length ?? 0,
    [preview],
  );

  function toggleItem(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  function selectAll() {
    if (!preview) return;
    setSelectedIds(preview.items.map((item) => item.id));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function handlePreview() {
    if (!file) {
      toast.error("Selecciona un archivo primero");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);

      const result = await previewImport(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setPreview(result.data);
      setSelectedIds(result.data.items.map((item) => item.id));
      setItemModes(
        Object.fromEntries(
          result.data.items
            .filter((item) => item.hasConflict)
            .map((item) => [item.id, "skip" as const]),
        ),
      );
      setProgress(null);
      toast.success(`Preview listo: ${result.data.items.length} items`);
    });
  }

  async function handleImport() {
    if (!preview) {
      toast.error("Primero genera una preview");
      return;
    }

    if (selectedIds.length === 0) {
      toast.error("Selecciona al menos un item para importar");
      return;
    }

    startTransition(async () => {
      const selectedPlan = selectedIds.map((id) => ({
        id,
        mode: itemModes[id],
      }));

      const chunkSize = 20;
      const chunks: Array<typeof selectedPlan> = [];
      for (let i = 0; i < selectedPlan.length; i += chunkSize) {
        chunks.push(selectedPlan.slice(i, i + chunkSize));
      }

      let imported = 0;
      let overwritten = 0;
      let skipped = 0;
      let processed = 0;
      setProgress({ processed: 0, total: selectedPlan.length });

      for (const chunk of chunks) {
        const result = await applyImport(preview.payload, chunk, mode);
        if (!result.ok) {
          toast.error(result.error);
          setProgress(null);
          return;
        }

        imported += result.data.imported;
        overwritten += result.data.overwritten;
        skipped += result.data.skipped;
        processed += result.data.processed;
        setProgress({ processed, total: selectedPlan.length });
      }

      toast.success(
        `Importación completada: ${imported} creados, ${overwritten} sobreescritos, ${skipped} omitidos`,
      );
      setPreview(null);
      setSelectedIds([]);
      setItemModes({});
      setFile(null);
      setProgress(null);
    });
  }

  const progressPercent = progress
    ? Math.min(100, Math.round((progress.processed / Math.max(progress.total, 1)) * 100))
    : 0;

  return (
    <section className="space-y-6">
      <article className="rounded-2xl border bg-[--panel] p-5">
        <h2 className="text-lg font-semibold">Exportar</h2>
        <p className="mt-1 text-sm text-[--ink-soft]">
          Descarga tus datos en JSON, Markdown o ZIP.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/api/export?format=json" className="rounded-xl border px-3 py-2 text-sm font-medium">
            Export JSON
          </Link>
          <Link
            href="/api/export?format=markdown"
            className="rounded-xl border px-3 py-2 text-sm font-medium"
          >
            Export Markdown
          </Link>
          <Link href="/api/export?format=zip" className="rounded-xl border px-3 py-2 text-sm font-medium">
            Export ZIP
          </Link>
        </div>
      </article>

      <article className="rounded-2xl border bg-[--panel] p-5">
        <h2 className="text-lg font-semibold">Importar</h2>
        <p className="mt-1 text-sm text-[--ink-soft]">
          Soporta archivos <code>.json</code>, <code>.md</code> y <code>.zip</code>.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-1">
            <label htmlFor="import-file" className="text-sm font-medium">
              Archivo
            </label>
            <input
              id="import-file"
              type="file"
              accept=".json,.md,.markdown,.zip"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={handlePreview}
            disabled={busy}
            className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Procesando..." : "Generar preview"}
          </button>
        </div>

        {preview ? (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-[--panel-soft] p-3 text-sm">
              <div>
                <p>
                  Fuente: <strong>{preview.source}</strong>
                </p>
                <p>
                  Items detectados: <strong>{preview.items.length}</strong> · Conflictos: <strong>{conflicts}</strong>
                </p>
                <p>
                  Seleccionados: <strong>{selectedCount}</strong>
                </p>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="rounded-lg border px-2 py-1 text-xs">
                  Seleccionar todo
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-lg border px-2 py-1 text-xs"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {preview.errors.length > 0 ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                {preview.errors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-[1fr_220px] md:items-end">
              <div className="space-y-1">
                <label htmlFor="conflict-mode" className="text-sm font-medium">
                  Conflictos por título
                </label>
                <select
                  id="conflict-mode"
                  value={mode}
                  onChange={(event) => setMode(event.target.value as "skip" | "rename" | "overwrite")}
                  className="w-full rounded-xl border bg-[--panel] px-3 py-2"
                >
                  <option value="skip">Saltar duplicados</option>
                  <option value="rename">Renombrar duplicados</option>
                  <option value="overwrite">Sobrescribir duplicados</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={busy || selectedIds.length === 0}
                className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Importando..." : "Importar seleccionados"}
              </button>
            </div>

            {progress ? (
              <div className="space-y-1 rounded-xl border bg-[--panel-soft] p-3">
                <div className="flex items-center justify-between text-xs text-[--ink-soft]">
                  <span>Progreso de importación</span>
                  <span>
                    {progress.processed}/{progress.total} · {progressPercent}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[--panel]">
                  <div
                    className="h-full bg-[--brand] transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : null}

            <div className="max-h-96 overflow-auto rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[--panel-soft] text-xs uppercase tracking-wide text-[--ink-soft]">
                  <tr>
                    <th className="px-3 py-2">Sel.</th>
                    <th className="px-3 py-2">Título</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Visibilidad</th>
                    <th className="px-3 py-2">Tags</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Resolución</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.items.map((item) => {
                    const checked = selectedIds.includes(item.id);
                    return (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={checked} onChange={() => toggleItem(item.id)} />
                        </td>
                        <td className="px-3 py-2 font-medium">{item.title}</td>
                        <td className="px-3 py-2">{item.type}</td>
                        <td className="px-3 py-2">{item.visibility}</td>
                        <td className="px-3 py-2 text-xs text-[--ink-soft]">{item.tags.join(", ") || "-"}</td>
                        <td className="px-3 py-2">
                          {item.hasConflict ? (
                            <div className="space-y-1">
                              <span className="rounded-full border border-amber-400 px-2 py-0.5 text-xs text-amber-700">
                                Conflicto
                              </span>
                              <p className="text-[10px] text-[--ink-soft]">
                                Existe: {item.conflictWithTitle ?? item.title}
                              </p>
                            </div>
                          ) : (
                            <span className="rounded-full border border-emerald-400 px-2 py-0.5 text-xs text-emerald-700">
                              Nuevo
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {item.hasConflict ? (
                            <select
                              value={itemModes[item.id] ?? "skip"}
                              onChange={(event) =>
                                setItemModes((prev) => ({
                                  ...prev,
                                  [item.id]: event.target.value as "skip" | "rename" | "overwrite",
                                }))
                              }
                              className="rounded-lg border bg-[--panel] px-2 py-1 text-xs"
                            >
                              <option value="skip">Saltar</option>
                              <option value="rename">Renombrar</option>
                              <option value="overwrite">Sobrescribir</option>
                            </select>
                          ) : (
                            <span className="text-xs text-[--ink-soft]">Crear</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </article>
    </section>
  );
}
