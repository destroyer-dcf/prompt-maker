"use client";

import { useMemo } from "react";

import { useFilters } from "@/hooks/useFilters";

type PromptStatus = "all" | "active" | "draft" | "archived";

const options: Array<{ key: PromptStatus; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Activos" },
  { key: "draft", label: "Borradores" },
  { key: "archived", label: "Archivados" },
];

export function PromptStatusQuickFilter() {
  const { searchParams, replaceParams } = useFilters();

  const current = useMemo<PromptStatus>(() => {
    const status = searchParams.get("status");
    if (status === "active" || status === "draft" || status === "archived") {
      return status;
    }
    return "all";
  }, [searchParams]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => {
            replaceParams((next) => {
              if (option.key === "all") {
                next.delete("status");
                return;
              }
              next.set("status", option.key);
            });
          }}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
            current === option.key ? "bg-[--brand-soft] text-[--brand]" : "hover:bg-[--panel-soft]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
