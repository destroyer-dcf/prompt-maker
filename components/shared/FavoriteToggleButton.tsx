"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { toggleFavorite } from "@/actions/prompts";
import { useShortcut } from "@/hooks/useShortcut";

export function FavoriteToggleButton({
  promptId,
  initialFavorite,
}: {
  promptId: string;
  initialFavorite: boolean;
}) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setFavorite(initialFavorite);
  }, [initialFavorite]);

  const toggle = useCallback(() => {
    const optimistic = !favorite;
    setFavorite(optimistic);

    startTransition(async () => {
      const result = await toggleFavorite(promptId);
      if (!result.ok) {
        setFavorite(!optimistic);
        toast.error(result.error);
        return;
      }

      setFavorite(result.data.favorite);
      toast.success(result.data.favorite ? "Agregado a favoritos" : "Quitado de favoritos");
      router.refresh();
    });
  }, [favorite, promptId, router]);

  useShortcut({
    key: "d",
    requireMod: true,
    onTrigger: () => {
      toggle();
    },
  });

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={favorite}
      aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      className={`rounded-xl border px-3 py-1.5 text-sm font-medium ${
        favorite ? "border-[--brand] bg-[--brand-soft] text-[--brand]" : "hover:bg-[--panel-soft]"
      } disabled:opacity-60`}
    >
      {favorite ? "[*] Favorito" : "[ ] Favorito"}
    </button>
  );
}
