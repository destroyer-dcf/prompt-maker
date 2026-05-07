"use client";

import Link from "next/link";
import { Draggable, Droppable } from "@hello-pangea/dnd";

import type { Prompt } from "@/types";

type PromptType = NonNullable<Prompt["type"]>;

export function PromptKanbanColumn({
  type,
  prompts,
  currentUserId,
}: {
  type: PromptType;
  prompts: Prompt[];
  currentUserId: string;
}) {
  return (
    <section className="w-72 shrink-0 rounded-2xl border bg-[--panel] p-3">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
          {type}
        </h2>
        <span className="rounded-full border px-2 py-0.5 text-xs">{prompts.length}</span>
      </header>

      <Droppable droppableId={type}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-24 max-h-[70vh] space-y-3 overflow-y-auto rounded-xl p-1 transition ${
              snapshot.isDraggingOver ? "bg-[--brand-soft]/40" : ""
            }`}
          >
            {prompts.map((prompt, index) => {
              const isOwner = prompt.authorId === currentUserId;
              return (
                <Draggable
                  key={prompt.id}
                  draggableId={prompt.id}
                  index={index}
                  isDragDisabled={!isOwner}
                >
                  {(dragProvided, dragSnapshot) => (
                    <article
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={`rounded-xl border bg-[--panel-soft] p-3 transition ${
                        dragSnapshot.isDragging ? "shadow-lg ring-2 ring-[--brand]/30" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">{prompt.title}</p>
                        <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-[--ink-soft]">
                          {prompt.visibility}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs text-[--ink-soft]">
                        {prompt.description || "Sin descripción"}
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <Link
                          href={`/prompts/${prompt.id}`}
                          className="text-xs font-semibold text-[--brand] hover:underline"
                        >
                          Abrir
                        </Link>
                        {!isOwner ? (
                          <span className="text-[10px] uppercase tracking-wide text-[--ink-soft]">
                            solo lectura
                          </span>
                        ) : null}
                      </div>
                    </article>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}

            {prompts.length === 0 ? (
              <div className="rounded-xl border border-dashed p-5 text-center text-xs text-[--ink-soft]">
                Sin prompts en esta columna.
              </div>
            ) : null}
          </div>
        )}
      </Droppable>
    </section>
  );
}
