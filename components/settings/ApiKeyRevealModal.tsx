"use client";

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { toast } from "sonner";

type ApiKeyRevealModalProps = {
  open: boolean;
  value: string | null;
  onClose: () => void;
};

export function ApiKeyRevealModal({ open, value, onClose }: ApiKeyRevealModalProps) {
  const { copy, copying } = useCopyToClipboard();

  if (!open || !value) return null;

  async function copyKey() {
    const currentValue = value;
    if (!currentValue) return;

    const copied = await copy(currentValue);
    if (!copied) {
      toast.error("No se pudo copiar la API key");
      return;
    }

    toast.success("API key copiada");
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-2xl border bg-[--panel] p-5 shadow-xl">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">API key generada</h2>
          <p className="text-sm text-[--ink-soft]">
            Guarda esta clave ahora. Por seguridad, no se podrá volver a mostrar.
          </p>
          <code className="block overflow-x-auto rounded-xl border bg-[--panel-soft] p-3 font-mono text-xs">
            {value}
          </code>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              void copyKey();
            }}
            disabled={copying}
            className="rounded-xl border px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            {copying ? "Copiando..." : "Copiar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[--brand] px-3 py-2 text-sm font-semibold text-white"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
