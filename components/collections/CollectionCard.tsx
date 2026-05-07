import Link from "next/link";

type CollectionCardProps = {
  collection: {
    id: string;
    name: string;
    description: string | null;
    promptCount: number;
    color?: string | null;
    icon?: string | null;
  };
  onDelete: () => void | Promise<void>;
};

export function CollectionCard({ collection, onDelete }: CollectionCardProps) {
  return (
    <article className="rounded-2xl border bg-[--panel] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/collections/${collection.id}`} className="text-base font-semibold hover:underline">
            {collection.name}
          </Link>
          <p className="mt-1 text-sm text-[--ink-soft]">
            {collection.description || "Sin descripcion"}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-[--ink-soft]">
            <span className="rounded-full border px-2 py-0.5">
              {collection.icon || "folder"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: collection.color ?? "#1d4ed8" }}
              />
              color
            </span>
          </div>
        </div>
        <span className="rounded-full border px-2 py-0.5 text-xs">{collection.promptCount}</span>
      </div>

      <div className="mt-3 flex justify-end">
        <form action={onDelete}>
          <button type="submit" className="rounded-lg border px-2 py-1 text-xs font-medium text-[--danger]">
            Eliminar
          </button>
        </form>
      </div>
    </article>
  );
}
