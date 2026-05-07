"use client";

import { useEffect, useRef, useState } from "react";

import { useFilters } from "@/hooks/useFilters";

export function PromptSearchBar() {
  const { pathname, searchParams, replaceParams } = useFilters();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [searching, setSearching] = useState(false);
  const [dirty, setDirty] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (!dirty) return;

    const currentQ = searchParams.get("q")?.trim() ?? "";
    const trimmed = query.trim();
    if (pathname === "/prompts" && currentQ === trimmed) {
      setSearching(false);
      return;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setSearching(true);
    timeoutRef.current = window.setTimeout(() => {
      replaceParams((next) => {
        if (pathname !== "/prompts") {
          for (const key of [...next.keys()]) {
            next.delete(key);
          }
        }

        if (trimmed) next.set("q", trimmed);
        else next.delete("q");
      });
      setSearching(false);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [dirty, pathname, query, replaceParams, searchParams]);

  return (
    <div className="w-full max-w-xl space-y-1">
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setDirty(true);
          setQuery(event.target.value);
        }}
        placeholder="Buscar por título o contenido..."
        className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
      />
      {searching ? <p className="text-xs text-[--ink-soft]">Buscando...</p> : null}
    </div>
  );
}
