"use server";

import { desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/actions/types";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteUserSchema } from "@/lib/validations/user.schema";

export type AdminUserListItem = {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "user";
  status: "active" | "pending" | "disabled";
  invitedBy: string | null;
  invitedByName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function listUsers(): Promise<AdminUserListItem[]> {
  await requireAdmin();
  const db = getDb();

  const users = await db.query.profiles.findMany({
    orderBy: [desc(profiles.createdAt)],
  });

  const inviterIds = [...new Set(users.map((user) => user.invitedBy).filter(Boolean) as string[])];
  const inviters =
    inviterIds.length > 0
      ? await db.query.profiles.findMany({
          where: inArray(profiles.id, inviterIds),
          columns: { id: true, name: true, email: true },
        })
      : [];
  const inviterMap = new Map(inviters.map((user) => [user.id, user.name || user.email]));

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    invitedBy: user.invitedBy,
    invitedByName: user.invitedBy ? (inviterMap.get(user.invitedBy) ?? null) : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
}

export async function inviteUser(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const db = getDb();
    const supabaseAdmin = createAdminClient();

    const parsed = inviteUserSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
    });

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(parsed.email, {
      data: { full_name: parsed.name },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/confirm`,
    });

    if (error) throw new Error(error.message);
    if (!data.user?.id) throw new Error("No se pudo crear el usuario invitado");

    await db
      .update(profiles)
      .set({
        invitedBy: admin.id,
        status: "pending",
      })
      .where(eq(profiles.id, data.user.id));

    revalidatePath("/admin/users");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function disableUser(userId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (admin.id === userId) throw new Error("No puedes desactivarte a ti mismo");

    const db = getDb();
    await db.update(profiles).set({ status: "disabled" }).where(eq(profiles.id, userId));

    revalidatePath("/admin/users");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function resendInvitation(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getDb();
    const supabaseAdmin = createAdminClient();

    const user = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: { id: true, email: true, name: true, status: true },
    });

    if (!user) throw new Error("Usuario no encontrado");
    if (user.status !== "pending") {
      throw new Error("Solo se puede reenviar invitación a usuarios pendientes");
    }

    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(user.email, {
      data: { full_name: user.name ?? "" },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/confirm`,
    });

    if (error) throw new Error(error.message);

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function enableUser(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getDb();

    await db.update(profiles).set({ status: "active" }).where(eq(profiles.id, userId));

    revalidatePath("/admin/users");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function changeRole(userId: string, role: "admin" | "user"): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (admin.id === userId && role !== "admin") {
      throw new Error("No puedes quitarte el rol de admin");
    }

    const db = getDb();

    await db.update(profiles).set({ role }).where(eq(profiles.id, userId));

    revalidatePath("/admin/users");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
