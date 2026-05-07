"use client";

import { useCallback, useState } from "react";

type UseCopyToClipboardOptions = {
  onSuccess?: () => void | Promise<void>;
  onError?: () => void;
};

export function useCopyToClipboard(options?: UseCopyToClipboardOptions) {
  const [copying, setCopying] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        setCopying(true);
        await navigator.clipboard.writeText(text);
        if (options?.onSuccess) {
          await options.onSuccess();
        }
        return true;
      } catch {
        options?.onError?.();
        return false;
      } finally {
        setCopying(false);
      }
    },
    [options],
  );

  return { copy, copying };
}
