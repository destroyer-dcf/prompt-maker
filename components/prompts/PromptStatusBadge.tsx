"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setPromptStatus } from "@/actions/prompts";

type PromptStatus = "draft" | "active" | "archived";

type PromptStatusBadgeProps = {
  promptId: string;
  status: PromptStatus;
  canManage: boolean;
};

const badgeByStatus: Record<PromptStatus, string> = {
  draft: "border-amber-300 bg-amber-50 text-amber-700",
  active: "border-emerald-300 bg-emerald-50 text-emerald-700",
  archived: "border-slate-300 bg-slate-100 text-slate-700",
};

export function PromptStatusBadge({
  promptId,
  status,
  canManage,
}: PromptStatusBadgeProps) {
  const [current, setCurrent] = useState<PromptStatus>(status);
  const [pending, startTransition] = useTransition();

  if (!canManage) {
    return (
      <span
        className={`rounded-full border px-2 py-1 text-xs font-medium ${badgeByStatus[current]}`}
      >
        {current}
      </span>
    );
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-xl border px-2 py-1 text-xs">
      <span className={`rounded-full border px-2 py-0.5 font-medium ${badgeByStatus[current]}`}>
        {current}
      </span>
      <select
        value={current}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as PromptStatus;
          const previous = current;
          setCurrent(next);

          startTransition(async () => {
            const result = await setPromptStatus(promptId, next);
            if (!result.ok) {
              setCurrent(previous);
              toast.error(result.error);
              return;
            }

            toast.success("Estado actualizado");
          });
        }}
        className="rounded-md border bg-[--panel] px-1.5 py-1 text-xs"
      >
        <option value="active">active</option>
        <option value="draft">draft</option>
        <option value="archived">archived</option>
      </select>
    </label>
  );
}
