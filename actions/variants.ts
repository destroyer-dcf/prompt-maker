"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/actions/types";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { promptVariants, promptVersions, prompts } from "@/lib/db/schema";
import { trimPromptVersions } from "@/lib/utils/versioning";
import { variantRatingSchema, variantSchema } from "@/lib/validations/variant.schema";

async function getOwnedPrompt(promptId: string, userId: string) {
  const db = getDb();
  return db.query.prompts.findFirst({
    where: and(eq(prompts.id, promptId), eq(prompts.authorId, userId)),
  });
}

async function getOwnedVariant(variantId: string, userId: string) {
  const db = getDb();
  return db.query.promptVariants.findFirst({
    where: and(eq(promptVariants.id, variantId), eq(promptVariants.authorId, userId)),
  });
}

export async function createVariant(
  promptId: string,
  formData: FormData,
): Promise<ActionResult<{ variantId: string }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const prompt = await getOwnedPrompt(promptId, profile.id);
    if (!prompt) throw new Error("Prompt no encontrado");

    const current = await db.query.promptVariants.findMany({
      where: and(eq(promptVariants.promptId, promptId), eq(promptVariants.authorId, profile.id)),
      columns: { id: true },
    });

    if (current.length >= 5) {
      throw new Error("Máximo 5 variantes por prompt");
    }

    const parsed = variantSchema.parse({
      label: formData.get("label"),
      content: formData.get("content"),
      notes: formData.get("notes") || "",
    });

    const [created] = await db
      .insert(promptVariants)
      .values({
        promptId,
        authorId: profile.id,
        label: parsed.label,
        content: parsed.content,
        notes: parsed.notes,
      })
      .returning({ id: promptVariants.id });

    revalidatePath(`/prompts/${promptId}`);
    revalidatePath("/prompts");
    return ok({ variantId: created.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateVariant(
  variantId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const existing = await getOwnedVariant(variantId, profile.id);
    if (!existing) throw new Error("Variante no encontrada");

    const parsed = variantSchema.parse({
      label: formData.get("label"),
      content: formData.get("content"),
      notes: formData.get("notes") || "",
    });

    await db
      .update(promptVariants)
      .set({
        label: parsed.label,
        content: parsed.content,
        notes: parsed.notes,
        updatedAt: new Date(),
      })
      .where(eq(promptVariants.id, existing.id));

    revalidatePath(`/prompts/${existing.promptId}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteVariant(variantId: string): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const existing = await getOwnedVariant(variantId, profile.id);
    if (!existing) throw new Error("Variante no encontrada");

    await db.delete(promptVariants).where(eq(promptVariants.id, existing.id));

    revalidatePath(`/prompts/${existing.promptId}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function rateVariant(
  variantId: string,
  rating: number | null,
): Promise<ActionResult<{ rating: number | null }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const existing = await getOwnedVariant(variantId, profile.id);
    if (!existing) throw new Error("Variante no encontrada");

    const parsedRating = variantRatingSchema.parse(rating);

    await db
      .update(promptVariants)
      .set({
        rating: parsedRating,
        updatedAt: new Date(),
      })
      .where(eq(promptVariants.id, existing.id));

    revalidatePath(`/prompts/${existing.promptId}`);
    return ok({ rating: parsedRating });
  } catch (error) {
    return fail(error);
  }
}

export async function promoteVariant(
  variantId: string,
  removeVariant = true,
): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const variant = await getOwnedVariant(variantId, profile.id);
    if (!variant) throw new Error("Variante no encontrada");

    const prompt = await getOwnedPrompt(variant.promptId, profile.id);
    if (!prompt) throw new Error("Prompt no encontrado");

    await db.insert(promptVersions).values({
      promptId: prompt.id,
      authorId: profile.id,
      version: prompt.version,
      title: prompt.title,
      content: prompt.content,
      changelog: `Promoción de variante: ${variant.label}`,
    });

    await db
      .update(prompts)
      .set({
        content: variant.content,
        notes: variant.notes ?? prompt.notes,
        version: prompt.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(prompts.id, prompt.id));

    await trimPromptVersions(prompt.id);

    if (removeVariant) {
      await db.delete(promptVariants).where(eq(promptVariants.id, variant.id));
    }

    revalidatePath(`/prompts/${prompt.id}`);
    revalidatePath(`/prompts/${prompt.id}/history`);
    revalidatePath("/prompts");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
