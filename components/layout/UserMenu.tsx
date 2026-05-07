"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut, Shield, UserCircle2, UserRound } from "lucide-react";

import { logout } from "@/actions/auth";

type UserMenuProps = {
  name: string;
  role: "admin" | "user";
};

export function UserMenu({ name, role }: UserMenuProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="hidden rounded-xl border bg-[--panel] px-3 py-1.5 text-right md:block">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-[--ink-soft]">{role}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          startTransition(async () => {
            await logout();
            router.push("/login");
            router.refresh();
          });
        }}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border bg-[--panel] px-3 text-xs font-semibold text-[--ink] shadow-sm hover:bg-[--panel-soft]"
      >
        {pending ? <UserRound className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
        {pending ? "Saliendo..." : "Salir"}
      </button>
      <Link href="/settings/profile" className="inline-flex h-10 items-center gap-1.5 rounded-xl border bg-[--panel] px-3 text-xs font-semibold shadow-sm hover:bg-[--panel-soft]">
        <UserCircle2 className="h-3.5 w-3.5" />
        Perfil
      </Link>
      {role === "admin" ? (
        <Link href="/admin" className="inline-flex h-10 items-center gap-1.5 rounded-xl border bg-[--panel] px-3 text-xs font-semibold shadow-sm hover:bg-[--panel-soft]">
          <Shield className="h-3.5 w-3.5" />
          Admin
        </Link>
      ) : null}
    </div>
  );
}
