"use client";

import { useTransition } from "react";

type ConfirmDialogProps = {
  label: string;
  confirmMessage: string;
  onConfirm: () => void | Promise<void>;
  className?: string;
  pendingLabel?: string;
};

export function ConfirmDialog({
  label,
  confirmMessage,
  onConfirm,
  className,
  pendingLabel = "Procesando...",
}: ConfirmDialogProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        const accepted = window.confirm(confirmMessage);
        if (!accepted) return;

        startTransition(async () => {
          await onConfirm();
        });
      }}
      disabled={pending}
      className={className}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
