import Link from "next/link";
import { Globe, Lock } from "lucide-react";

import { PromptStats } from "@/components/prompts/PromptStats";
import { PinToggleButton } from "@/components/shared/PinToggleButton";
import type { Prompt } from "@/types";

export function PromptCard({
  prompt,
  currentUserId,
}: {
  prompt: Prompt;
  currentUserId?: string;
}) {
  const canManagePin = currentUserId === prompt.authorId;

  return (
    <article className="rounded-2xl border bg-[--panel] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-tight">{prompt.title}</h3>
        <span className="rounded-full bg-[--brand-soft] px-2 py-0.5 text-xs font-medium text-[--brand]">{prompt.type}</span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-[--ink-soft]">{prompt.description || "Sin descripción"}</p>

      <pre className="mt-3 line-clamp-4 whitespace-pre-wrap rounded-xl border bg-[--panel-soft] p-3 font-mono text-xs">
        {prompt.content}
      </pre>

      {prompt.tags && prompt.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {prompt.tags.slice(0, 6).map((tag) => (
            <Link
              key={`${prompt.id}-tag-${tag}`}
              href={`/prompts?tags=${encodeURIComponent(tag)}`}
              className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-[--ink-soft] hover:bg-[--panel-soft]"
            >
              {tag}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-3">
        <PromptStats copyCount={prompt.copyCount} cloneCount={prompt.cloneCount} />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-[--ink-soft]">
        <span className="inline-flex items-center gap-1">
          {prompt.visibility === "public" ? (
            <Globe size={13} aria-hidden />
          ) : (
            <Lock size={13} aria-hidden />
          )}
          {prompt.visibility === "public" ? "Publico" : "Privado"} · {prompt.status}
        </span>
        <div className="flex items-center gap-2">
          <PinToggleButton
            promptId={prompt.id}
            initialPinned={prompt.pinned}
            canManage={canManagePin}
          />
          <Link href={`/prompts/${prompt.id}`} className="font-semibold text-[--brand] hover:underline">
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  );
}
