import { parseVariables } from "@/lib/utils/variables";

import { PromptVariablesFill } from "@/components/prompts/PromptVariablesFill";

type PromptVariablesProps = {
  promptId: string;
  content: string;
};

export function PromptVariables({ promptId, content }: PromptVariablesProps) {
  const variables = parseVariables(content);
  if (variables.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Variables detectadas</h2>
        <span className="text-xs text-[--ink-soft]">{variables.length} variables</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {variables.map((name) => (
          <span
            key={name}
            className="rounded-full border bg-[--panel-soft] px-2 py-0.5 text-xs text-[--ink]"
          >
            {`{{${name}}}`}
          </span>
        ))}
      </div>

      <PromptVariablesFill promptId={promptId} content={content} variables={variables} />
    </section>
  );
}
