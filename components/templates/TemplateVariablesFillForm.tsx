import type { TemplateVariable } from "@/lib/db/schema";

type TemplateVariablesFillFormProps = {
  variables: TemplateVariable[];
};

export function TemplateVariablesFillForm({ variables }: TemplateVariablesFillFormProps) {
  if (variables.length === 0) return null;

  return (
    <fieldset className="space-y-3 rounded-2xl border bg-[--panel-soft] p-4">
      <legend className="px-1 text-sm font-semibold">Variables del template</legend>
      {variables.map((variable) => (
        <div key={variable.name} className="space-y-1">
          <label htmlFor={`tplvar__${variable.name}`} className="text-sm font-medium">
            {variable.label || variable.name}
          </label>
          {variable.type === "textarea" ? (
            <textarea
              id={`tplvar__${variable.name}`}
              name={`tplvar__${variable.name}`}
              required={variable.required}
              defaultValue={variable.defaultValue ?? ""}
              placeholder={variable.placeholder ?? `Valor para ${variable.name}`}
              rows={3}
              className="w-full rounded-xl border bg-[--panel] px-3 py-2"
            />
          ) : null}
          {variable.type === "select" ? (
            <select
              id={`tplvar__${variable.name}`}
              name={`tplvar__${variable.name}`}
              required={variable.required}
              defaultValue={variable.defaultValue ?? ""}
              className="w-full rounded-xl border bg-[--panel] px-3 py-2"
            >
              <option value="">Selecciona una opción</option>
              {(variable.options ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : null}
          {variable.type === "text" || variable.type === "number" ? (
            <input
              id={`tplvar__${variable.name}`}
              name={`tplvar__${variable.name}`}
              required={variable.required}
              type={variable.type === "number" ? "number" : "text"}
              defaultValue={variable.defaultValue ?? ""}
              placeholder={variable.placeholder ?? `Valor para ${variable.name}`}
              className="w-full rounded-xl border bg-[--panel] px-3 py-2"
            />
          ) : null}
        </div>
      ))}
    </fieldset>
  );
}
