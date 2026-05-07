"use client";

import { useEffect } from "react";

import { useFilters } from "@/hooks/useFilters";
import { type ViewMode, useViewModeStore } from "@/lib/stores/useViewMode";

const views: Array<{ key: ViewMode; label: string }> = [
  { key: "grid", label: "Grid" },
  { key: "list", label: "Lista" },
  { key: "kanban", label: "Kanban" },
];

type ViewToggleProps = {
  currentView: ViewMode;
  hasExplicitViewParam: boolean;
};

export function ViewToggle({
  currentView,
  hasExplicitViewParam,
}: ViewToggleProps) {
  const { replaceParams } = useFilters();
  const { promptViewMode, setPromptViewMode } = useViewModeStore();

  useEffect(() => {
    setPromptViewMode(currentView);
  }, [currentView, setPromptViewMode]);

  useEffect(() => {
    if (hasExplicitViewParam) return;
    if (promptViewMode === currentView) return;

    replaceParams((next) => {
      next.set("view", promptViewMode);
    });
  }, [
    currentView,
    hasExplicitViewParam,
    promptViewMode,
    replaceParams,
  ]);

  function selectView(mode: ViewMode) {
    setPromptViewMode(mode);
    replaceParams((next) => {
      next.set("view", mode);
    });
  }

  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label="Modo de vista">
      {views.map((view) => (
        <button
          key={view.key}
          type="button"
          onClick={() => selectView(view.key)}
          role="radio"
          aria-checked={currentView === view.key}
          aria-label={`Cambiar a vista ${view.label}`}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
            currentView === view.key ? "bg-[--brand-soft] text-[--brand]" : ""
          }`}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
