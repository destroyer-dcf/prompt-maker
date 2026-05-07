"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { revokeApiKey } from "@/actions/api-keys";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { ApiKey } from "@/types";

export function ApiKeyList({ keys }: { keys: ApiKey[] }) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl border bg-[--panel]">
      <table className="w-full text-sm">
        <thead className="bg-[--panel-soft] text-left text-xs uppercase tracking-wide text-[--ink-soft]">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Prefix</th>
            <th className="px-4 py-3">Último uso</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key.id} className="border-t">
              <td className="px-4 py-3">{key.name}</td>
              <td className="px-4 py-3 font-mono text-xs">{key.prefix}</td>
              <td className="px-4 py-3 text-xs text-[--ink-soft]">
                {key.lastUsed ? new Date(key.lastUsed).toLocaleString("es-ES") : "Nunca"}
              </td>
              <td className="px-4 py-3 text-right">
                <ConfirmDialog
                  label="Revocar"
                  pendingLabel="Revocando..."
                  confirmMessage="Revocar esta API key? Dejará de funcionar inmediatamente."
                  onConfirm={async () => {
                    const result = await revokeApiKey(key.id);
                    if (!result.ok) {
                      toast.error(result.error);
                      return;
                    }
                    toast.success("API key revocada");
                    router.refresh();
                  }}
                  className="rounded-lg border px-2 py-1 text-xs font-medium"
                />
              </td>
            </tr>
          ))}
          {keys.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-sm text-[--ink-soft]">
                Aún no tienes API keys.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
