import Link from "next/link";

import { updateTagColor } from "@/actions/tags";
import { requireProfile } from "@/lib/auth";
import { listTagUsage } from "@/lib/db/queries/tags";
import { getDb } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { tags } from "@/lib/db/schema";

export default async function TagsPage() {
  const profile = await requireProfile();
  const db = getDb();

  const [usage, ownRows] = await Promise.all([
    listTagUsage(profile.id, 500),
    db.query.tags.findMany({
      where: and(eq(tags.createdBy, profile.id)),
      columns: { name: true },
    }),
  ]);
  const ownTagSet = new Set(ownRows.map((row) => row.name));

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Tags</h1>
        <p className="text-sm text-[--ink-soft]">
          Gestiona colores y revisa el uso en prompts y templates.
        </p>
      </div>

      <div className="overflow-auto rounded-2xl border bg-[--panel]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[--panel-soft] text-xs uppercase tracking-wide text-[--ink-soft]">
            <tr>
              <th className="px-3 py-2">Tag</th>
              <th className="px-3 py-2">Color</th>
              <th className="px-3 py-2">Prompts</th>
              <th className="px-3 py-2">Templates</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((item) => {
              async function saveColor(formData: FormData) {
                "use server";
                const color = String(formData.get("color") || "").trim();
                const result = await updateTagColor(item.name, color);
                if (!result.ok) throw new Error(result.error);
              }

              const canEdit = ownTagSet.has(item.name);

              return (
                <tr key={`tag-row-${item.name}`} className="border-t">
                  <td className="px-3 py-2 font-medium">
                    <span className="rounded-full border px-2 py-0.5">{item.name}</span>
                  </td>
                  <td className="px-3 py-2">
                    {canEdit ? (
                      <form action={saveColor} className="flex items-center gap-2">
                        <input
                          type="color"
                          name="color"
                          defaultValue={item.color}
                          className="h-8 w-10 rounded border bg-transparent p-0"
                        />
                        <button
                          type="submit"
                          className="rounded-lg border px-2 py-1 text-xs font-medium hover:bg-[--panel-soft]"
                        >
                          Guardar
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-4 rounded-full border"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-[--ink-soft]">solo lectura</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">{item.promptCount}</td>
                  <td className="px-3 py-2">{item.templateCount}</td>
                  <td className="px-3 py-2">{item.totalCount}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/prompts?tags=${encodeURIComponent(item.name)}`}
                      className="rounded-lg border px-2 py-1 text-xs font-medium hover:bg-[--panel-soft]"
                    >
                      Filtrar prompts
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {usage.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-[--panel] p-8 text-center text-sm text-[--ink-soft]">
          Aún no tienes tags en uso.
        </div>
      ) : null}
    </section>
  );
}
