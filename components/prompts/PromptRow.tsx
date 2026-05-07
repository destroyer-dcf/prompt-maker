import Link from "next/link";
import { Globe, Lock } from "lucide-react";

import { PromptStats } from "@/components/prompts/PromptStats";
import { PinToggleButton } from "@/components/shared/PinToggleButton";
import type { Prompt } from "@/types";

export function PromptRow({
  prompt,
  currentUserId,
}: {
  prompt: Prompt;
  currentUserId?: string;
}) {
  const canManagePin = currentUserId === prompt.authorId;

  return (
    <div className="grid grid-cols-[2fr_1fr_100px] items-center gap-3 rounded-xl border bg-[--panel] px-3 py-2 text-sm">
      <div>
        <p className="font-semibold">{prompt.title}</p>
        <p className="text-xs text-[--ink-soft]">{prompt.description || "Sin descripción"}</p>
        {prompt.tags && prompt.tags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {prompt.tags.slice(0, 4).map((tag) => (
              <Link
                key={`${prompt.id}-tag-${tag}`}
                href={`/prompts?tags=${encodeURIComponent(tag)}`}
                className="rounded-full border px-1.5 py-0.5 text-[10px] text-[--ink-soft] hover:bg-[--panel-soft]"
              >
                {tag}
              </Link>
            ))}
          </div>
        ) : null}
        <div className="mt-1">
          <PromptStats copyCount={prompt.copyCount} cloneCount={prompt.cloneCount} />
        </div>
      </div>
      <span className="text-xs uppercase tracking-wide text-[--ink-soft]">
        {prompt.type}
        <br />
        {prompt.status}
        <br />
        <span className="inline-flex items-center gap-1 normal-case">
          {prompt.visibility === "public" ? (
            <Globe size={12} aria-hidden />
          ) : (
            <Lock size={12} aria-hidden />
          )}
          {prompt.visibility === "public" ? "publico" : "privado"}
        </span>
      </span>
      <div className="flex items-center justify-end gap-2">
        <PinToggleButton
          promptId={prompt.id}
          initialPinned={prompt.pinned}
          canManage={canManagePin}
        />
        <Link href={`/prompts/${prompt.id}`} className="text-right text-xs font-semibold text-[--brand] hover:underline">
          Abrir
        </Link>
      </div>
    </div>
  );
}
