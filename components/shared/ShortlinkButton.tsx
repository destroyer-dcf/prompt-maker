"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { generateShortId } from "@/actions/prompts";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

type ShortlinkButtonProps = {
  promptId: string;
  visibility: "private" | "public" | null;
  shortId: string | null;
  canManage: boolean;
};

function shortlinkUrl(shortId: string) {
  if (typeof window === "undefined") return `/p/${shortId}`;
  return `${window.location.origin}/p/${shortId}`;
}

export function ShortlinkButton({
  promptId,
  visibility,
  shortId,
  canManage,
}: ShortlinkButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [currentShortId, setCurrentShortId] = useState(shortId);
  const { copy, copying } = useCopyToClipboard();

  if (!canManage) return null;

  async function copyLink(value: string) {
    const copied = await copy(shortlinkUrl(value));
    if (!copied) {
      toast.error("No se pudo copiar el shortlink");
      return;
    }

    toast.success("Shortlink copiado");
  }

  function handleClick() {
    if (currentShortId) {
      void copyLink(currentShortId);
      return;
    }

    if (visibility !== "public") {
      toast.error("Solo prompts públicos pueden tener shortlink");
      return;
    }

    startTransition(async () => {
      const result = await generateShortId(promptId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setCurrentShortId(result.data.shortId);
      await copyLink(result.data.shortId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || copying}
      className="rounded-xl border px-3 py-1.5 text-sm font-medium hover:bg-[--panel-soft] disabled:opacity-60"
      title={
        visibility === "public"
          ? "Generar y copiar shortlink público"
          : "Cambia visibilidad a public para compartir por shortlink"
      }
    >
      {pending
        ? "Generando..."
        : copying
          ? "Copiando..."
          : currentShortId
            ? "Copiar shortlink"
            : "Generar shortlink"}
    </button>
  );
}
