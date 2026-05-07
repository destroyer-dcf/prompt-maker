import Link from "next/link";

import { CopyPromptButton } from "@/components/shared/CopyPromptButton";
import { FavoriteToggleButton } from "@/components/shared/FavoriteToggleButton";
import { PinToggleButton } from "@/components/shared/PinToggleButton";
import { ShortlinkButton } from "@/components/shared/ShortlinkButton";
import type { Prompt } from "@/types";

type PromptActionsProps = {
  prompt: Prompt;
  isOwner: boolean;
  isFavorite: boolean;
};

export function PromptActions({ prompt, isOwner, isFavorite }: PromptActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <PinToggleButton
        promptId={prompt.id}
        initialPinned={prompt.pinned}
        canManage={isOwner}
      />
      <ShortlinkButton
        promptId={prompt.id}
        visibility={prompt.visibility}
        shortId={prompt.shortId}
        canManage={isOwner}
      />
      <FavoriteToggleButton promptId={prompt.id} initialFavorite={isFavorite} />
      <CopyPromptButton promptId={prompt.id} title={prompt.title} content={prompt.content} />
      {isOwner ? (
        <>
          <Link
            href={`/prompts/${prompt.id}/edit`}
            className="rounded-xl border px-3 py-1.5 text-sm font-medium hover:bg-[--panel-soft]"
          >
            Editar
          </Link>
          <Link
            href={`/prompts/${prompt.id}/history`}
            className="rounded-xl border px-3 py-1.5 text-sm font-medium hover:bg-[--panel-soft]"
          >
            Historial
          </Link>
        </>
      ) : null}
    </div>
  );
}
