type CollectionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initial?: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
  };
};

export function CollectionForm({
  action,
  submitLabel,
  initial,
}: CollectionFormProps) {
  return (
    <form
      action={action}
      className="grid gap-3 rounded-2xl border bg-[--panel] p-4 md:grid-cols-2"
    >
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          className="w-full rounded-xl border bg-[--panel] px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium">
          Descripcion
        </label>
        <input
          id="description"
          name="description"
          defaultValue={initial?.description ?? ""}
          className="w-full rounded-xl border bg-[--panel] px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="color" className="text-sm font-medium">
          Color
        </label>
        <input
          id="color"
          name="color"
          type="color"
          defaultValue={initial?.color ?? "#1d4ed8"}
          className="h-11 w-full rounded-xl border bg-[--panel] px-2 py-2"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="icon" className="text-sm font-medium">
          Icono
        </label>
        <input
          id="icon"
          name="icon"
          defaultValue={initial?.icon ?? "folder"}
          className="w-full rounded-xl border bg-[--panel] px-3 py-2"
          placeholder="folder"
        />
      </div>

      <div className="md:col-span-2 flex justify-end">
        <button
          className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white"
          type="submit"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
