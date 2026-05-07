"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <div
      className="inline-flex items-center rounded-xl border bg-[--panel] p-1 text-xs"
      role="radiogroup"
      aria-label="Tema"
    >
      {["light", "dark", "system"].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          role="radio"
          aria-checked={theme === value}
          aria-label={`Activar tema ${value}`}
          className={`rounded-lg px-2 py-1 capitalize transition ${theme === value ? "bg-[--brand] text-white" : "text-[--ink-soft]"}`}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
