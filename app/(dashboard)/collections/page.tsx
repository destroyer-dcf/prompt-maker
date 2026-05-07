import type { Metadata } from "next";

import { createCollection, deleteCollection } from "@/actions/collections";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { requireProfile } from "@/lib/auth";
import { listCollectionsForUser } from "@/lib/db/queries/collections";

export const metadata: Metadata = {
  title: "Colecciones",
  description: "Agrupa y organiza prompts por carpetas.",
};

export default async function CollectionsPage() {
  const profile = await requireProfile();
  const collections = await listCollectionsForUser(profile.id);

  async function submit(formData: FormData) {
    "use server";

    const result = await createCollection(formData);
    if (!result.ok) throw new Error(result.error);
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Colecciones</h1>
        <p className="text-sm text-[--ink-soft]">Organiza tus prompts por carpetas.</p>
      </div>

      <CollectionForm action={submit} submitLabel="Crear coleccion" />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {collections.map((collection) => {
          async function remove() {
            "use server";
            const result = await deleteCollection(collection.id);
            if (!result.ok) throw new Error(result.error);
          }

          return <CollectionCard key={collection.id} collection={collection} onDelete={remove} />;
        })}

        {collections.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-[--panel] p-8 text-center text-sm text-[--ink-soft]">
            No tienes colecciones aún.
          </div>
        ) : null}
      </div>
    </section>
  );
}
