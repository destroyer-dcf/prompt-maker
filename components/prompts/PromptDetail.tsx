import Link from "next/link";
import { Globe, Lock } from "lucide-react";

import { PromptActions } from "@/components/prompts/PromptActions";
import { PromptNotes } from "@/components/prompts/PromptNotes";
import { PromptRatingControl } from "@/components/prompts/PromptRatingControl";
import { PromptPlayground } from "@/components/prompts/PromptPlayground";
import { PromptStats } from "@/components/prompts/PromptStats";
import { PromptStatusBadge } from "@/components/prompts/PromptStatusBadge";
import { PromptVariables } from "@/components/prompts/PromptVariables";
import { PromptVariants } from "@/components/prompts/PromptVariants";
import type { Prompt } from "@/types";

type PromptVariantView = {
  id: string;
  label: string;
  content: string;
  notes: string | null;
  rating: number | null;
  updatedAt: string;
};

type PromptDetailProps = {
  prompt: Prompt;
  isOwner: boolean;
  isFavorite: boolean;
  variants: PromptVariantView[];
};

export function PromptDetail({ prompt, isOwner, isFavorite, variants }: PromptDetailProps) {
  return (
    <article className="space-y-5">
      <section className="space-y-5 rounded-2xl border bg-[--panel] p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{prompt.title}</h1>
            <p className="mt-1 text-sm text-[--ink-soft]">{prompt.description || "Sin descripción"}</p>
          </div>
          <PromptActions prompt={prompt} isOwner={isOwner} isFavorite={isFavorite} />
        </header>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[--brand-soft] px-2 py-1 text-[--brand]">{prompt.type}</span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
            {prompt.visibility === "public" ? <Globe size={13} aria-hidden /> : <Lock size={13} aria-hidden />}
            {prompt.visibility}
          </span>
          <PromptStatusBadge
            promptId={prompt.id}
            status={prompt.status}
            canManage={isOwner}
          />
          {prompt.rating ? <span className="rounded-full border px-2 py-1">rating: {prompt.rating}</span> : null}
        </div>

        <PromptStats copyCount={prompt.copyCount} cloneCount={prompt.cloneCount} />

        {prompt.tags && prompt.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {prompt.tags.map((tag) => (
              <Link
                key={`${prompt.id}-detail-tag-${tag}`}
                href={`/prompts?tags=${encodeURIComponent(tag)}`}
                className="rounded-full border px-2 py-0.5 text-xs text-[--ink-soft] hover:bg-[--panel-soft]"
              >
                {tag}
              </Link>
            ))}
          </div>
        ) : null}

        {isOwner ? (
          <section className="space-y-1">
            <h2 className="text-sm font-semibold">Rating</h2>
            <PromptRatingControl promptId={prompt.id} value={prompt.rating} />
          </section>
        ) : null}

        <pre className="whitespace-pre-wrap rounded-2xl border bg-[--panel-soft] p-4 font-mono text-sm">{prompt.content}</pre>

        <PromptVariables promptId={prompt.id} content={prompt.content} />

        {isOwner ? (
          <PromptPlayground
            promptContent={prompt.content}
            defaultModel={Array.isArray(prompt.targetModels) ? prompt.targetModels[0] : null}
          />
        ) : null}

        {isOwner ? (
          <PromptNotes promptId={prompt.id} initialNotes={prompt.notes ?? ""} />
        ) : null}
      </section>

      {isOwner ? <PromptVariants promptId={prompt.id} variants={variants} /> : null}
    </article>
  );
}
