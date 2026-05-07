"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/actions/types";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { tags } from "@/lib/db/schema";

function validateHexColor(value: string) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
    throw new Error("Color inválido");
  }
  return value;
}

export async function updateTagColor(
  tagName: string,
  color: string,
): Promise<ActionResult<{ name: string; color: string }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();
    const safeColor = validateHexColor(color.trim());

    const existing = await db.query.tags.findFirst({
      where: and(eq(tags.name, tagName), eq(tags.createdBy, profile.id)),
      columns: { name: true },
    });

    if (!existing) {
      throw new Error("Solo puedes editar el color de tags creados por ti");
    }

    await db
      .update(tags)
      .set({ color: safeColor })
      .where(and(eq(tags.name, tagName), eq(tags.createdBy, profile.id)));

    revalidatePath("/tags");
    revalidatePath("/prompts");
    revalidatePath("/prompts/new");
    return ok({ name: tagName, color: safeColor });
  } catch (error) {
    return fail(error);
  }
}
