"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { loginWithEmail } from "@/actions/auth";
import type { ActionResult } from "@/actions/types";

const initialState: ActionResult = { ok: false, error: "" };

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (_state: ActionResult, formData: FormData) => loginWithEmail(formData),
    initialState,
  );

  useEffect(() => {
    if ((state as { ok?: boolean })?.ok) {
      router.push(nextPath || "/prompts");
      router.refresh();
    }
  }, [state, router, nextPath]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-xl border bg-[--panel] px-3 py-2"
          placeholder="tu@empresa.com"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-xl border bg-[--panel] px-3 py-2"
          placeholder="••••••••"
        />
      </div>

      {state && !state.ok ? <p className="text-sm text-[--danger]">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[--brand] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Accediendo..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
