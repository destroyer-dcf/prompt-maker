"use client";

import { useState } from "react";

import { Logo } from "@/components/layout/Logo";
import { SidebarNav } from "@/components/layout/SidebarNav";

type MobileSidebarProps = {
  collections?: Array<{ id: string; name: string; promptCount: number }>;
};

export function MobileSidebar({ collections = [] }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border bg-[--panel] px-3 py-2 text-xs font-semibold hover:bg-[--panel-soft]"
      >
        Menu
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/45"
          />

          <aside className="relative h-full w-[84%] max-w-xs overflow-auto border-r bg-[--panel] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border px-2 py-1 text-xs"
              >
                Cerrar
              </button>
            </div>

            <SidebarNav collections={collections} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
