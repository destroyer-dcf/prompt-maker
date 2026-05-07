"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ratePrompt } from "@/actions/prompts";
import { RatingStars } from "@/components/shared/RatingStars";

export function PromptRatingControl({
  promptId,
  value,
}: {
  promptId: string;
  value: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function update(next: number | null) {
    const resolved = next === value ? null : next;

    startTransition(async () => {
      const result = await ratePrompt(promptId, resolved);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        resolved === null ? "Rating limpiado" : `Rating ${resolved}/5 guardado`,
      );
      router.refresh();
    });
  }

  return <RatingStars value={value} disabled={pending} onChange={update} />;
}
