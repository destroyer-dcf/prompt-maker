"use client";

import { Laptop2, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop2 },
  ] as const;

  return (
    <div
      className="inline-flex h-10 items-center rounded-xl border bg-[--panel] p-1 text-xs shadow-sm"
      role="radiogroup"
      aria-label="Tema"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          role="radio"
          aria-checked={theme === value}
          aria-label={`Activar tema ${value}`}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
            theme === value ? "bg-[--brand] text-white" : "text-[--ink-soft] hover:bg-[--panel-soft]"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
