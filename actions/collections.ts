"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/actions/types";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { collectionSchema } from "@/lib/validations/collection.schema";

export async function createCollection(
  formData: FormData,
): Promise<ActionResult<{ collectionId: string }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const parsed = collectionSchema.parse({
      name: formData.get("name"),
      description: formData.get("description") || "",
      color: formData.get("color") || "#1d4ed8",
      icon: formData.get("icon") || "folder",
    });

    const [created] = await db
      .insert(collections)
      .values({
        authorId: profile.id,
        name: parsed.name,
        description: parsed.description,
        color: parsed.color,
        icon: parsed.icon,
      })
      .returning({ id: collections.id });

    revalidatePath("/collections");
    revalidatePath("/", "layout");
    return ok({ collectionId: created.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateCollection(
  collectionId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const parsed = collectionSchema.parse({
      name: formData.get("name"),
      description: formData.get("description") || "",
      color: formData.get("color") || "#1d4ed8",
      icon: formData.get("icon") || "folder",
    });

    await db
      .update(collections)
      .set({
        name: parsed.name,
        description: parsed.description,
        color: parsed.color,
        icon: parsed.icon,
        updatedAt: new Date(),
      })
      .where(and(eq(collections.id, collectionId), eq(collections.authorId, profile.id)));

    revalidatePath("/collections");
    revalidatePath(`/collections/${collectionId}`);
    revalidatePath("/", "layout");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCollection(collectionId: string): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    await db
      .delete(collections)
      .where(and(eq(collections.id, collectionId), eq(collections.authorId, profile.id)));

    revalidatePath("/collections");
    revalidatePath("/prompts");
    revalidatePath("/", "layout");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
