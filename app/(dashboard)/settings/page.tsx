import Link from "next/link";
import type { Metadata } from "next";
import { KeyRound, Repeat, UserRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configura tu perfil, claves de API e importación/exportación.",
};

export default function SettingsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/settings/profile" className="rounded-2xl border bg-[--panel] p-4 hover:bg-[--panel-soft]">
          <UserRound size={18} />
          <p className="mt-2 font-semibold">Perfil</p>
          <p className="mt-1 text-sm text-[--ink-soft]">
            Edita nombre, bio y avatar.
          </p>
        </Link>
        <Link href="/settings/api-keys" className="rounded-2xl border bg-[--panel] p-4 hover:bg-[--panel-soft]">
          <KeyRound size={18} />
          <p className="mt-2 font-semibold">API Keys</p>
          <p className="mt-1 text-sm text-[--ink-soft]">
            Crea y revoca claves para integraciones externas.
          </p>
        </Link>
        <Link href="/settings/import-export" className="rounded-2xl border bg-[--panel] p-4 hover:bg-[--panel-soft]">
          <Repeat size={18} />
          <p className="mt-2 font-semibold">Import / Export</p>
          <p className="mt-1 text-sm text-[--ink-soft]">
            Migra prompts con preview y manejo de conflictos.
          </p>
        </Link>
      </div>
    </section>
  );
}
