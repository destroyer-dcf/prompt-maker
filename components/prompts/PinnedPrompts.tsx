"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { reorderPins, togglePin } from "@/actions/prompts";

type PinnedPromptItem = {
  id: string;
  title: string;
  type: string | null;
  pinnedOrder: number | null;
};

function reorder<T>(items: T[], startIndex: number, endIndex: number) {
  const result = [...items];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export function PinnedPrompts({ items }: { items: PinnedPromptItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pinned, setPinned] = useState<PinnedPromptItem[]>(items);

  useEffect(() => {
    setPinned(items);
  }, [items]);

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const previous = pinned;
    const next = reorder(pinned, result.source.index, result.destination.index);
    setPinned(next);

    startTransition(async () => {
      const orderedIds = next.map((item) => item.id);
      const response = await reorderPins(orderedIds);
      if (!response.ok) {
        setPinned(previous);
        toast.error(response.error);
        return;
      }
      toast.success("Orden de pins actualizado");
      router.refresh();
    });
  }

  function removePin(promptId: string) {
    startTransition(async () => {
      const response = await togglePin(promptId);
      if (!response.ok) {
        toast.error(response.error);
        return;
      }
      toast.success("Pin eliminado");
      router.refresh();
    });
  }

  if (pinned.length === 0) return null;

  return (
    <section className="space-y-3 rounded-2xl border bg-[--panel] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[--ink-soft]">
            Pinados
          </h2>
          <p className="text-xs text-[--ink-soft]">Arrastra para reordenar</p>
        </div>
        <span className="rounded-full border px-2 py-0.5 text-xs">{pinned.length}/5</span>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="pinned-prompts" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-wrap gap-2"
            >
              {pinned.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <article
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={`rounded-xl border bg-[--panel-soft] px-3 py-2 ${
                        dragSnapshot.isDragging ? "ring-2 ring-[--brand]/30" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Link href={`/prompts/${item.id}`} className="text-sm font-semibold hover:underline">
                          {item.title}
                        </Link>
                        <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-[--ink-soft]">
                          {item.type ?? "custom"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePin(item.id)}
                          disabled={pending}
                          className="rounded-lg border px-2 py-1 text-xs text-[--danger] disabled:opacity-60"
                        >
                          Quitar
                        </button>
                      </div>
                    </article>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </section>
  );
}
