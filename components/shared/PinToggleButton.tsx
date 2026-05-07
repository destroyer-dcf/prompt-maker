"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { togglePin } from "@/actions/prompts";

export function PinToggleButton({
  promptId,
  initialPinned,
  canManage,
}: {
  promptId: string;
  initialPinned: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pinned, setPinned] = useState(initialPinned);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPinned(initialPinned);
  }, [initialPinned]);

  if (!canManage) return null;

  function toggle() {
    const optimistic = !pinned;
    setPinned(optimistic);

    startTransition(async () => {
      const result = await togglePin(promptId);
      if (!result.ok) {
        setPinned(!optimistic);
        toast.error(result.error);
        return;
      }

      setPinned(result.data.pinned);
      toast.success(result.data.pinned ? "Prompt pinado" : "Pin eliminado");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={pinned}
      aria-label={pinned ? "Quitar pin del prompt" : "Pinar prompt"}
      className={`rounded-xl border px-3 py-1.5 text-sm font-medium ${
        pinned ? "border-[--brand] bg-[--brand-soft] text-[--brand]" : "hover:bg-[--panel-soft]"
      } disabled:opacity-60`}
    >
      {pinned ? "Pinado" : "Pinar"}
    </button>
  );
}
