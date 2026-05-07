"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ReplaceOptions = {
  scroll?: boolean;
};

export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const replaceParams = useCallback(
    (
      mutator: (next: URLSearchParams) => void,
      options: ReplaceOptions = { scroll: false },
    ) => {
      const next = new URLSearchParams(searchParams.toString());
      mutator(next);

      const query = next.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      router.replace(href, { scroll: options.scroll ?? false });
    },
    [pathname, router, searchParams],
  );

  const setParam = useCallback(
    (
      key: string,
      value?: string | null,
      options: ReplaceOptions = { scroll: false },
    ) => {
      replaceParams((next) => {
        const normalized = value?.trim();
        if (!normalized) {
          next.delete(key);
          return;
        }

        next.set(key, normalized);
      }, options);
    },
    [replaceParams],
  );

  return {
    pathname,
    searchParams,
    replaceParams,
    setParam,
  };
}
