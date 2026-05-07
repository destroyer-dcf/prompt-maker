import Link from "next/link";

import { cn } from "@/lib/utils/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/prompts" className={cn("inline-flex items-center gap-3", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-[--brand] text-sm font-extrabold text-white">
        PM
      </span>
      <span>
        <strong className="block text-sm leading-none">Prompt Manager</strong>
        <span className="text-xs text-[--ink-soft]">Professional Workspace</span>
      </span>
    </Link>
  );
}
