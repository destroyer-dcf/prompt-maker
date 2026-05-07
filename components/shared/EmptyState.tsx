import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed bg-[--panel] p-8 text-center">
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm text-[--ink-soft]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
