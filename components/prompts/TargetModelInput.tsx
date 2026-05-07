const MODEL_SUGGESTIONS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
  "o4-mini",
  "claude-3-5-sonnet",
  "claude-3-7-sonnet",
  "gemini-2.0-flash",
  "gemini-2.5-pro",
];

type TargetModelInputProps = {
  id?: string;
  name?: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
};

export function TargetModelInput({
  id = "targetModels",
  name = "targetModels",
  label = "Target Models (coma separada)",
  defaultValue = "",
  placeholder = "gpt-4o, claude-3-5-sonnet",
}: TargetModelInputProps) {
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
        {MODEL_SUGGESTIONS.map((model) => (
          <option key={model} value={model} />
        ))}
      </datalist>
    </div>
  );
}
