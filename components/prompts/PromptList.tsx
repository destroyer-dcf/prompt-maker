import type { Prompt } from "@/types";

import { PromptCard } from "@/components/prompts/PromptCard";
import { PromptKanban } from "@/components/prompts/PromptKanban";
import { PromptRow } from "@/components/prompts/PromptRow";
import { EmptyState } from "@/components/shared/EmptyState";

export function PromptList({
  prompts,
  view,
  currentUserId,
}: {
  prompts: Prompt[];
  view: "grid" | "list" | "kanban";
  currentUserId?: string;
}) {
  if (prompts.length === 0) {
    return (
      <EmptyState
        title="Sin prompts"
        description="No hay prompts todavía para este filtro."
      />
    );
  }

  if (view === "list") {
    return (
      <div className="space-y-2">
        {prompts.map((prompt) => (
          <PromptRow key={prompt.id} prompt={prompt} currentUserId={currentUserId} />
        ))}
      </div>
    );
  }

  if (view === "kanban") {
    return <PromptKanban prompts={prompts} currentUserId={currentUserId ?? ""} />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
