"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { updatePassword } from "@/actions/auth";
import type { ActionResult } from "@/actions/types";

const initialState: ActionResult = { ok: false, error: "" };

export function ResetPasswordForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (_state: ActionResult, formData: FormData) => updatePassword(formData),
    initialState,
  );

  useEffect(() => {
    if (state?.ok) {
      router.push("/prompts");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Nueva contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          className="w-full rounded-xl border bg-[--panel] px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirmar contraseña
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          minLength={8}
          required
          className="w-full rounded-xl border bg-[--panel] px-3 py-2"
        />
      </div>

      {state && !state.ok ? <p className="text-sm text-[--danger]">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[--brand] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Actualizando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}
