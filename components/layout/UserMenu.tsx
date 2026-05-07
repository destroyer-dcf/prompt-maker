"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { logout } from "@/actions/auth";

type UserMenuProps = {
  name: string;
  role: "admin" | "user";
};

export function UserMenu({ name, role }: UserMenuProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right sm:block">
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
        className="rounded-xl border bg-[--panel] px-3 py-2 text-xs font-semibold text-[--ink] hover:bg-[--panel-soft]"
      >
        {pending ? "Saliendo..." : "Salir"}
      </button>
      <Link href="/settings/profile" className="rounded-xl border bg-[--panel] px-3 py-2 text-xs font-semibold hover:bg-[--panel-soft]">
        Perfil
      </Link>
      {role === "admin" ? (
        <Link href="/admin" className="rounded-xl border bg-[--panel] px-3 py-2 text-xs font-semibold hover:bg-[--panel-soft]">
          Admin
        </Link>
      ) : null}
    </div>
  );
}
