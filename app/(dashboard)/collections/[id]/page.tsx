import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { deleteCollection, updateCollection } from "@/actions/collections";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { requireProfile } from "@/lib/auth";
import { getCollectionWithPrompts } from "@/lib/db/queries/collections";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const profile = await requireProfile();
    const data = await getCollectionWithPrompts(id, profile.id);

    if (!data) {
      return { title: "Colección no encontrada" };
    }

    return {
      title: data.collection.name,
      description: data.collection.description || "Detalle de colección",
    };
  } catch {
    return { title: "Colección" };
  }
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();

  const data = await getCollectionWithPrompts(id, profile.id);
  if (!data) notFound();

  const { collection, prompts } = data;

  async function save(formData: FormData) {
    "use server";
    const result = await updateCollection(collection.id, formData);
    if (!result.ok) throw new Error(result.error);
  }

  async function remove() {
    "use server";
    const result = await deleteCollection(collection.id);
    if (!result.ok) throw new Error(result.error);
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{collection.name}</h1>
          <p className="text-sm text-[--ink-soft]">{collection.description || "Sin descripción"}</p>
        </div>

        <form action={remove}>
          <button type="submit" className="rounded-xl border px-3 py-2 text-sm font-medium text-[--danger]">
            Eliminar colección
          </button>
        </form>
      </div>

      <CollectionForm
        action={save}
        submitLabel="Guardar cambios"
        initial={{
          name: collection.name,
          description: collection.description ?? "",
          icon: collection.icon ?? "folder",
          color: collection.color ?? "#1d4ed8",
        }}
      />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Prompts en esta colección</h2>

        {prompts.map((prompt) => (
          <article key={prompt.id} className="rounded-xl border bg-[--panel] p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{prompt.title}</p>
                <p className="text-xs text-[--ink-soft]">{prompt.type}</p>
              </div>
              <Link href={`/prompts/${prompt.id}`} className="rounded-lg border px-2 py-1 text-xs font-medium">
                Abrir
              </Link>
            </div>
          </article>
        ))}

        {prompts.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-[--panel] p-8 text-center text-sm text-[--ink-soft]">
            Esta colección no tiene prompts.
          </div>
        ) : null}
      </div>
    </section>
  );
}
