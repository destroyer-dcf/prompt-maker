"use client";

import { FormEvent, useState, useTransition } from "react";

import { createApiKey } from "@/actions/api-keys";
import { ApiKeyRevealModal } from "@/components/settings/ApiKeyRevealModal";

export function ApiKeyCreateForm() {
  const [name, setName] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createApiKey(name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setGenerated(result.data.raw);
      setName("");
    });
  };

  return (
    <>
      <div className="space-y-4 rounded-2xl border bg-[--panel] p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 md:flex-row">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre de la API key"
            required
            className="flex-1 rounded-xl border bg-[--panel] px-3 py-2"
          />
          <button type="submit" disabled={pending} className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white">
            {pending ? "Creando..." : "Crear key"}
          </button>
        </form>

        {error ? <p className="text-sm text-[--danger]">{error}</p> : null}
      </div>

      <ApiKeyRevealModal
        open={Boolean(generated)}
        value={generated}
        onClose={() => setGenerated(null)}
      />
    </>
  );
}
