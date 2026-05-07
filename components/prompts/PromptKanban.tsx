"use client";

import { useEffect, useState, useTransition } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setPromptType } from "@/actions/prompts";
import { PromptKanbanColumn } from "@/components/prompts/PromptKanbanColumn";
import type { Prompt } from "@/types";

type PromptType = NonNullable<Prompt["type"]>;

const KANBAN_TYPES: PromptType[] = [
  "system",
  "user",
  "assistant",
  "instruction",
  "persona",
  "few-shot",
  "chain-of-thought",
  "template",
  "custom",
];

type PromptsByType = Record<PromptType, Prompt[]>;

function buildGroups(prompts: Prompt[]): PromptsByType {
  return {
    system: prompts.filter((prompt) => prompt.type === "system"),
    user: prompts.filter((prompt) => prompt.type === "user"),
    assistant: prompts.filter((prompt) => prompt.type === "assistant"),
    instruction: prompts.filter((prompt) => prompt.type === "instruction"),
    persona: prompts.filter((prompt) => prompt.type === "persona"),
    "few-shot": prompts.filter((prompt) => prompt.type === "few-shot"),
    "chain-of-thought": prompts.filter((prompt) => prompt.type === "chain-of-thought"),
    template: prompts.filter((prompt) => prompt.type === "template"),
    custom: prompts.filter((prompt) => prompt.type === "custom"),
  };
}

function reorderWithinColumn(items: Prompt[], start: number, end: number) {
  const clone = [...items];
  const [moved] = clone.splice(start, 1);
  clone.splice(end, 0, moved);
  return clone;
}

function moveAcrossColumns(
  sourceItems: Prompt[],
  targetItems: Prompt[],
  sourceIndex: number,
  targetIndex: number,
) {
  const sourceClone = [...sourceItems];
  const targetClone = [...targetItems];
  const [moved] = sourceClone.splice(sourceIndex, 1);
  targetClone.splice(targetIndex, 0, moved);
  return { sourceClone, targetClone, moved };
}

export function PromptKanban({
  prompts,
  currentUserId,
}: {
  prompts: Prompt[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [groups, setGroups] = useState<PromptsByType>(() => buildGroups(prompts));

  useEffect(() => {
    setGroups(buildGroups(prompts));
  }, [prompts]);

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const sourceType = source.droppableId as PromptType;
    const targetType = destination.droppableId as PromptType;
    if (!KANBAN_TYPES.includes(sourceType) || !KANBAN_TYPES.includes(targetType)) return;

    if (sourceType === targetType) {
      if (source.index === destination.index) return;
      setGroups((prev) => ({
        ...prev,
        [sourceType]: reorderWithinColumn(prev[sourceType], source.index, destination.index),
      }));
      return;
    }

    const dragged = groups[sourceType][source.index];
    if (!dragged || dragged.authorId !== currentUserId) {
      toast.error("Solo puedes mover tus propios prompts");
      return;
    }

    const previous = groups;
    const { sourceClone, targetClone } = moveAcrossColumns(
      groups[sourceType],
      groups[targetType],
      source.index,
      destination.index,
    );

    setGroups({
      ...groups,
      [sourceType]: sourceClone,
      [targetType]: targetClone.map((item) =>
        item.id === draggableId ? { ...item, type: targetType } : item,
      ),
    });

    startTransition(async () => {
      const response = await setPromptType(draggableId, targetType);
      if (!response.ok) {
        setGroups(previous);
        toast.error(response.error);
        return;
      }

      toast.success(`Tipo actualizado a ${targetType}`);
      router.refresh();
    });
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {KANBAN_TYPES.map((type) => (
            <PromptKanbanColumn
              key={type}
              type={type}
              prompts={groups[type]}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      </div>

      {pending ? (
        <p className="mt-2 text-xs text-[--ink-soft]">Guardando cambios...</p>
      ) : null}
    </DragDropContext>
  );
}
