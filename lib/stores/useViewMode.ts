"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ViewMode = "grid" | "list" | "kanban";

type ViewModeStore = {
  promptViewMode: ViewMode;
  setPromptViewMode: (mode: ViewMode) => void;
};

export const useViewModeStore = create<ViewModeStore>()(
  persist(
    (set) => ({
      promptViewMode: "grid",
      setPromptViewMode: (mode) => set({ promptViewMode: mode }),
    }),
    {
      name: "prompt-maker:view-mode",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ promptViewMode: state.promptViewMode }),
    },
  ),
);
