"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { updatePromptNotes } from "@/actions/prompts";

type PromptNotesProps = {
  promptId: string;
  initialNotes: string;
};

export function PromptNotes({ promptId, initialNotes }: PromptNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [savedValue, setSavedValue] = useState(initialNotes);
  const [pending, startTransition] = useTransition();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setNotes(initialNotes);
    setSavedValue(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    if (notes === savedValue) return;

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      const nextNotes = notes;

      startTransition(async () => {
        const result = await updatePromptNotes(promptId, nextNotes);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        setSavedValue(result.data.notes);
      });
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [notes, promptId, savedValue]);

  const dirty = notes !== savedValue;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Notas privadas</h2>
        <span className="text-xs text-[--ink-soft]">
          {pending ? "Guardando..." : dirty ? "Pendiente de guardar..." : "Guardado"}
        </span>
      </div>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={5}
        maxLength={5000}
        className="w-full rounded-xl border bg-[--panel-soft] p-3 text-sm"
        placeholder="Escribe notas privadas sobre este prompt..."
      />
    </section>
  );
}
