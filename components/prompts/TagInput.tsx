type TagInputProps = {
  id?: string;
  name?: string;
  label?: string;
  defaultValue?: string;
  availableTags?: Array<{ name: string; color: string | null }>;
  placeholder?: string;
};

export function TagInput({
  id = "tags",
  name = "tags",
  label = "Tags (coma separada)",
  defaultValue = "",
  availableTags = [],
  placeholder = "ej: marketing, ventas, analisis",
}: TagInputProps) {
  return (
    <div className="space-y-1 md:col-span-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        list={`${id}-options`}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border bg-[--panel] px-3 py-2"
      />

      <datalist id={`${id}-options`}>
        {availableTags.map((tag) => (
          <option key={tag.name} value={tag.name} />
        ))}
      </datalist>

      {availableTags.length > 0 ? (
        <div className="flex flex-wrap gap-1 pt-1">
          {availableTags.slice(0, 12).map((tag) => (
            <span
              key={`tag-chip-${tag.name}`}
              className="rounded-full border px-2 py-0.5 text-xs"
              style={tag.color ? { borderColor: tag.color } : undefined}
            >
              {tag.name}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
