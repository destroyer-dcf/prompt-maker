"use client";

import { useActionState } from "react";

import { sendPasswordReset } from "@/actions/auth";
import type { ActionResult } from "@/actions/types";

const initialState: ActionResult = { ok: false, error: "" };

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    async (_state: ActionResult, formData: FormData) => sendPasswordReset(formData),
    initialState,
  );

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

      {state && !state.ok ? <p className="text-sm text-[--danger]">{state.error}</p> : null}
      {state?.ok ? (
        <p className="text-sm text-[--success]">Si el email existe, te hemos enviado un enlace de recuperación.</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[--brand] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Enviando..." : "Enviar enlace"}
      </button>
    </form>
  );
}
