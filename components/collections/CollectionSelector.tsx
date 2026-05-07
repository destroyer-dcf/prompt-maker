type CollectionSelectorProps = {
  collections: Array<{ id: string; name: string }>;
  defaultValue?: string;
  id?: string;
  name?: string;
};

export function CollectionSelector({
  collections,
  defaultValue = "",
  id = "collectionId",
  name = "collectionId",
}: CollectionSelectorProps) {
  return (
    <div className="space-y-1 md:col-span-2">
      <label htmlFor={id} className="text-sm font-medium">
        Coleccion
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border bg-[--panel] px-3 py-2"
      >
        <option value="">Sin coleccion</option>
        {collections.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.name}
          </option>
        ))}
      </select>
    </div>
  );
}
