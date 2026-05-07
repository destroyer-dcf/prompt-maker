import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { Users } from "lucide-react";

import { getDb } from "@/lib/db";
import { profiles, prompts, templates } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const db = getDb();

  let totalUsers = 0;
  let activeUsers = 0;
  let pendingUsers = 0;
  let disabledUsers = 0;
  let adminUsers = 0;
  let totalPrompts = 0;
  let totalTemplates = 0;
  let statsError = false;

  try {
    [
      totalUsers,
      activeUsers,
      pendingUsers,
      disabledUsers,
      adminUsers,
      totalPrompts,
      totalTemplates,
    ] = await Promise.all([
      db.select({ total: count() }).from(profiles).then((rows) => Number(rows[0]?.total ?? 0)),
      db
        .select({ total: count() })
        .from(profiles)
        .where(eq(profiles.status, "active"))
        .then((rows) => Number(rows[0]?.total ?? 0)),
      db
        .select({ total: count() })
        .from(profiles)
        .where(eq(profiles.status, "pending"))
        .then((rows) => Number(rows[0]?.total ?? 0)),
      db
        .select({ total: count() })
        .from(profiles)
        .where(eq(profiles.status, "disabled"))
        .then((rows) => Number(rows[0]?.total ?? 0)),
      db
        .select({ total: count() })
        .from(profiles)
        .where(eq(profiles.role, "admin"))
        .then((rows) => Number(rows[0]?.total ?? 0)),
      db.select({ total: count() }).from(prompts).then((rows) => Number(rows[0]?.total ?? 0)),
      db.select({ total: count() }).from(templates).then((rows) => Number(rows[0]?.total ?? 0)),
    ]);
  } catch {
    statsError = true;
  }

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold">Panel de Administración</h1>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border bg-[--panel] p-5">
          <p className="text-xs uppercase tracking-wide text-[--ink-soft]">Usuarios</p>
          <p className="mt-2 text-3xl font-semibold">{totalUsers}</p>
          <p className="mt-1 text-xs text-[--ink-soft]">
            activos {activeUsers} · pendientes {pendingUsers} · desactivados {disabledUsers}
          </p>
        </article>

        <article className="rounded-2xl border bg-[--panel] p-5">
          <p className="text-xs uppercase tracking-wide text-[--ink-soft]">Admins</p>
          <p className="mt-2 text-3xl font-semibold">{adminUsers}</p>
        </article>

        <article className="rounded-2xl border bg-[--panel] p-5">
          <p className="text-xs uppercase tracking-wide text-[--ink-soft]">Prompts</p>
          <p className="mt-2 text-3xl font-semibold">{totalPrompts}</p>
        </article>

        <article className="rounded-2xl border bg-[--panel] p-5">
          <p className="text-xs uppercase tracking-wide text-[--ink-soft]">Templates</p>
          <p className="mt-2 text-3xl font-semibold">{totalTemplates}</p>
        </article>
      </div>

      {statsError ? (
        <article className="rounded-2xl border border-[--danger] bg-[--panel] p-4 text-sm">
          No se pudieron cargar todas las métricas del panel ahora mismo. Intenta recargar en unos segundos.
        </article>
      ) : null}

      <Link href="/admin/users" className="inline-flex items-center gap-1.5 rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white">
        <Users className="h-4 w-4" />
        Gestionar usuarios
      </Link>
    </section>
  );
}
