"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/prompts", label: "Prompts" },
  { href: "/tags", label: "Tags" },
  { href: "/notifications", label: "Notificaciones" },
  { href: "/templates", label: "Templates" },
  { href: "/favorites", label: "Favoritos" },
  { href: "/public", label: "Públicos" },
  { href: "/settings", label: "Settings" },
];

type SidebarNavProps = {
  collections?: Array<{ id: string; name: string; promptCount: number }>;
  onNavigate?: () => void;
};

export function SidebarNav({ collections = [], onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      <nav className="mt-8 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "block rounded-xl px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-[--brand-soft] text-[--brand]"
                  : "text-[--ink-soft] hover:bg-[--panel-soft]",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
            Colecciones
          </p>
          <Link
            href="/collections"
            onClick={onNavigate}
            className="text-xs font-medium text-[--brand] hover:underline"
          >
            Ver
          </Link>
        </div>
        <div className="space-y-1">
          {collections.slice(0, 8).map((collection) => {
            const href = `/collections/${collection.id}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={collection.id}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                  active
                    ? "bg-[--brand-soft] text-[--brand]"
                    : "text-[--ink-soft] hover:bg-[--panel-soft]",
                )}
              >
                <span className="truncate">{collection.name}</span>
                <span className="ml-2 rounded-full border px-2 py-0.5 text-[10px]">
                  {collection.promptCount}
                </span>
              </Link>
            );
          })}
          {collections.length === 0 ? (
            <p className="rounded-xl border border-dashed px-3 py-3 text-xs text-[--ink-soft]">
              Sin colecciones
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
