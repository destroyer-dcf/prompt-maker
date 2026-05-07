"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateProfile } from "@/actions/auth";

type ProfileFormProps = {
  initial: {
    name: string;
    bio: string;
    avatarUrl: string;
    email: string;
  };
};

function isValidHttpUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ProfileForm({ initial }: ProfileFormProps) {
  const [name, setName] = useState(initial.name);
  const [bio, setBio] = useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [pending, startTransition] = useTransition();

  const initials = useMemo(() => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return initial.email.slice(0, 2).toUpperCase();
    return words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "").join("");
  }, [initial.email, name]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidHttpUrl(avatarUrl)) {
      toast.error("Avatar URL debe ser una URL http/https válida.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("bio", bio);
      formData.set("avatarUrl", avatarUrl);

      const result = await updateProfile(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Perfil actualizado");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-[--panel] p-5">
      <div className="flex items-center gap-3 rounded-xl border bg-[--panel-soft] p-3">
        {avatarUrl.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-14 w-14 rounded-full border object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-full border bg-[--panel] text-sm font-semibold">
            {initials}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold">{name || "Sin nombre"}</p>
          <p className="text-xs text-[--ink-soft]">{initial.email}</p>
        </div>
      </div>

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border bg-[--panel] px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className="w-full rounded-xl border bg-[--panel] px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="avatarUrl" className="mb-1 block text-sm font-medium">
          Avatar URL
        </label>
        <input
          id="avatarUrl"
          name="avatarUrl"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          className="w-full rounded-xl border bg-[--panel] px-3 py-2"
          placeholder="https://..."
        />
      </div>
      <button type="submit" disabled={pending} className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
