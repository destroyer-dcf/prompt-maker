import { restoreVersion } from "@/actions/prompts";
import { EmptyState } from "@/components/shared/EmptyState";

type VersionEntry = {
  id: string;
  version: number;
  content: string;
  changelog: string | null;
  authorId: string;
  authorName: string;
  createdAt: Date;
};

function toLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function diffSummary(current: string, previous: string | null) {
  if (!previous) return { added: [] as string[], removed: [] as string[] };

  const currentLines = toLines(current);
  const previousLines = toLines(previous);
  const previousSet = new Set(previousLines);
  const currentSet = new Set(currentLines);

  const added = currentLines.filter((line) => !previousSet.has(line)).slice(0, 3);
  const removed = previousLines.filter((line) => !currentSet.has(line)).slice(0, 3);

  return { added, removed };
}

export function PromptVersionHistory({
  promptId,
  versions,
}: {
  promptId: string;
  versions: VersionEntry[];
}) {
  if (versions.length === 0) {
    return (
      <EmptyState
        title="Sin versiones"
        description="Aún no hay versiones anteriores para este prompt."
      />
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((version, index) => {
        const previous = versions[index + 1] ?? null;
        const diff = diffSummary(version.content, previous?.content ?? null);

        async function restore() {
          "use server";
          const result = await restoreVersion(promptId, version.id);
          if (!result.ok) throw new Error(result.error);
        }

        return (
          <article key={version.id} className="rounded-2xl border bg-[--panel] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Versión {version.version}</p>
                <p className="mt-1 text-xs text-[--ink-soft]">
                  {new Date(version.createdAt).toLocaleString("es-ES")}
                </p>
                <p className="text-xs text-[--ink-soft]">Autor: {version.authorName}</p>
              </div>

              <form action={restore}>
                <button
                  type="submit"
                  className="rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:bg-[--panel-soft]"
                >
                  Restaurar esta versión
                </button>
              </form>
            </div>

            {version.changelog ? <p className="mt-3 text-sm">{version.changelog}</p> : null}

            {diff.added.length > 0 || diff.removed.length > 0 ? (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
                  <p className="font-semibold">Líneas añadidas</p>
                  {diff.added.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {diff.added.map((line, lineIndex) => (
                        <li key={`${version.id}-add-${lineIndex}`} className="line-clamp-1">
                          + {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2">Sin cambios añadidos</p>
                  )}
                </div>

                <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900">
                  <p className="font-semibold">Líneas eliminadas</p>
                  {diff.removed.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {diff.removed.map((line, lineIndex) => (
                        <li key={`${version.id}-rem-${lineIndex}`} className="line-clamp-1">
                          - {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2">Sin cambios eliminados</p>
                  )}
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
