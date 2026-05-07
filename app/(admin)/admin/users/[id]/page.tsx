import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { changeRole, disableUser, enableUser } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { prompts, profiles, templates } from "@/lib/db/schema";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await requireAdmin();
  const db = getDb();

  const user = await db.query.profiles.findFirst({
    where: eq(profiles.id, id),
  });

  if (!user) notFound();
  const selectedUser = user;
  const selectedUserId = selectedUser.id;

  const [promptStats, templateStats] = await Promise.all([
    db
      .select({ total: count() })
      .from(prompts)
      .where(eq(prompts.authorId, selectedUserId))
      .then((rows) => Number(rows[0]?.total ?? 0)),
    db
      .select({ total: count() })
      .from(templates)
      .where(eq(templates.authorId, selectedUserId))
      .then((rows) => Number(rows[0]?.total ?? 0)),
  ]);

  async function setRole(formData: FormData) {
    "use server";
    const role = String(formData.get("role") || "user") as "admin" | "user";
    const result = await changeRole(selectedUserId, role);
    if (!result.ok) throw new Error(result.error);
  }

  async function toggleStatus() {
    "use server";
    const result =
      selectedUser.status === "disabled"
        ? await enableUser(selectedUserId)
        : await disableUser(selectedUserId);
    if (!result.ok) throw new Error(result.error);
  }

  const canDemote = !(admin.id === selectedUserId && selectedUser.role === "admin");

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{selectedUser.name ?? selectedUser.email}</h1>
          <p className="text-sm text-[--ink-soft]">{selectedUser.email}</p>
        </div>
        <Link href="/admin/users" className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-[--panel-soft]">
          Volver
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border bg-[--panel] p-4">
          <p className="text-xs uppercase tracking-wide text-[--ink-soft]">Prompts</p>
          <p className="mt-1 text-2xl font-semibold">{promptStats}</p>
        </article>
        <article className="rounded-2xl border bg-[--panel] p-4">
          <p className="text-xs uppercase tracking-wide text-[--ink-soft]">Templates</p>
          <p className="mt-1 text-2xl font-semibold">{templateStats}</p>
        </article>
        <article className="rounded-2xl border bg-[--panel] p-4">
          <p className="text-xs uppercase tracking-wide text-[--ink-soft]">Alta</p>
          <p className="mt-1 text-sm font-semibold">
            {new Date(selectedUser.createdAt).toLocaleString("es-ES")}
          </p>
        </article>
      </div>

      <article className="space-y-4 rounded-2xl border bg-[--panel] p-5">
        <h2 className="text-lg font-semibold">Permisos y estado</h2>

        <form action={setRole} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="role" className="text-sm font-medium">
              Rol
            </label>
            <select
              id="role"
              name="role"
              defaultValue={selectedUser.role}
              className="rounded-xl border bg-[--panel] px-3 py-2 text-sm"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={!canDemote && selectedUser.role === "admin"}
            className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Guardar rol
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border px-2 py-1 text-xs">
            Estado actual: {selectedUser.status}
          </span>
          <form action={toggleStatus}>
            <button
              type="submit"
              disabled={admin.id === selectedUserId}
              className="rounded-xl border px-3 py-2 text-sm font-medium disabled:opacity-60"
            >
              {selectedUser.status === "disabled" ? "Reactivar usuario" : "Desactivar usuario"}
            </button>
          </form>
        </div>
      </article>
    </section>
  );
}
