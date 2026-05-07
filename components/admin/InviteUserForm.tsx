"use client";

import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { inviteUser } from "@/actions/admin";

export function InviteUserForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("email", email);

      const result = await inviteUser(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Invitación enviada");
      setName("");
      setEmail("");
      setOpen(false);
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + Invitar usuario
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-[--panel] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Invitar usuario</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border px-2 py-1 text-sm"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <div>
                <label htmlFor="invite-name" className="mb-1 block text-sm font-medium">
                  Nombre
                </label>
                <input
                  id="invite-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full rounded-xl border bg-[--panel] px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="invite-email" className="mb-1 block text-sm font-medium">
                  Email
                </label>
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-xl border bg-[--panel] px-3 py-2"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {pending ? "Enviando..." : "Enviar invitación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
