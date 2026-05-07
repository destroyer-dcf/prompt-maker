"use client";

import { useEffect } from "react";

type UseShortcutOptions = {
  key: string;
  onTrigger: (event: KeyboardEvent) => void;
  enabled?: boolean;
  requireMod?: boolean;
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
  allowInInput?: boolean;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    target.isContentEditable ||
    target.getAttribute("role") === "textbox"
  );
}

export function useShortcut({
  key,
  onTrigger,
  enabled = true,
  requireMod = false,
  shift = false,
  alt = false,
  preventDefault = true,
  allowInInput = false,
}: UseShortcutOptions) {
  useEffect(() => {
    if (!enabled) return;

    const normalizedKey = key.toLowerCase();
    function onKeyDown(event: KeyboardEvent) {
      if (!allowInInput && isEditableTarget(event.target)) return;

      const pressedMod = event.metaKey || event.ctrlKey;
      if (requireMod && !pressedMod) return;
      if (event.shiftKey !== shift) return;
      if (event.altKey !== alt) return;
      if (event.key.toLowerCase() !== normalizedKey) return;

      if (preventDefault) {
        event.preventDefault();
      }

      onTrigger(event);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [allowInInput, alt, enabled, key, onTrigger, preventDefault, requireMod, shift]);
}
