"use server";

import { and, eq, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

import { fail, ok, type ActionResult } from "@/actions/types";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  favorites,
  notifications,
  promptVersions,
  prompts,
  templates,
  collections as collectionsTable,
} from "@/lib/db/schema";
import { uniqueSlug } from "@/lib/utils/slug";
import { ensureTags } from "@/lib/utils/tags";
import { trimPromptVersions } from "@/lib/utils/versioning";
import { resolveVariables } from "@/lib/utils/variables";
import { promptSchema } from "@/lib/validations/prompt.schema";

async function ensureCollectionOwnership(
  userId: string,
  collectionId: string | null,
): Promise<string | null> {
  if (!collectionId) return null;

  const db = getDb();
  const collection = await db.query.collections.findFirst({
    where: and(
      eq(collectionsTable.id, collectionId),
      eq(collectionsTable.authorId, userId),
    ),
    columns: { id: true },
  });

  if (!collection) {
    throw new Error("La colección seleccionada no es válida");
  }

  return collection.id;
}

export async function createPrompt(formData: FormData): Promise<ActionResult<{ promptId: string }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();
    const templateId = String(formData.get("templateId") || "").trim() || null;
    const collectionId = String(formData.get("collectionId") || "").trim() || null;

    const template = templateId
      ? await db.query.templates.findFirst({
          where: and(
            eq(templates.id, templateId),
            or(eq(templates.authorId, profile.id), eq(templates.visibility, "public")),
          ),
        })
      : null;

    const templateValues = Object.fromEntries(
      [...formData.entries()]
        .filter(([key]) => key.startsWith("tplvar__"))
        .map(([key, value]) => [key.replace("tplvar__", ""), String(value)]),
    );

    const parsed = promptSchema.parse({
      title: formData.get("title"),
      description: formData.get("description") || "",
      content: formData.get("content") || template?.content || "",
      type: formData.get("type") || "custom",
      visibility: formData.get("visibility") || "private",
      tags: String(formData.get("tags") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      targetModels: String(formData.get("targetModels") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      status: formData.get("status") || "active",
      rating: formData.get("rating") ? Number(formData.get("rating")) : null,
      notes: formData.get("notes") || "",
    });

    const slug = await uniqueSlug(parsed.title);
    const ownedCollectionId = await ensureCollectionOwnership(profile.id, collectionId);
    const resolvedContent =
      template && Object.keys(templateValues).length > 0
        ? resolveVariables(parsed.content, templateValues)
        : parsed.content;

    const [created] = await db
      .insert(prompts)
      .values({
        authorId: profile.id,
        templateId: template?.id ?? null,
        collectionId: ownedCollectionId,
        title: parsed.title,
        description: parsed.description,
        content: resolvedContent,
        type: parsed.type,
        tags: parsed.tags,
        visibility: parsed.visibility,
        targetModels: parsed.targetModels,
        status: parsed.status,
        rating: parsed.rating,
        notes: parsed.notes,
        slug,
      })
      .returning({ id: prompts.id });

    await ensureTags(profile.id, parsed.tags);

    if (template) {
      await db
        .update(templates)
        .set({ usageCount: sql`${templates.usageCount} + 1`, updatedAt: new Date() })
        .where(eq(templates.id, template.id));
    }

    revalidatePath("/prompts");
    return ok({ promptId: created.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updatePrompt(
  promptId: string,
  formData: FormData,
): Promise<ActionResult<{ promptId: string }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();
    const collectionId = String(formData.get("collectionId") || "").trim() || null;

    const existing = await db.query.prompts.findFirst({
      where: and(eq(prompts.id, promptId), eq(prompts.authorId, profile.id)),
    });

    if (!existing) throw new Error("Prompt no encontrado");

    const parsed = promptSchema.parse({
      title: formData.get("title"),
      description: formData.get("description") || "",
      content: formData.get("content"),
      type: formData.get("type") || "custom",
      visibility: formData.get("visibility") || "private",
      tags: String(formData.get("tags") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      targetModels: String(formData.get("targetModels") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      status: formData.get("status") || "active",
      rating: formData.get("rating") ? Number(formData.get("rating")) : null,
      notes: formData.get("notes") || "",
    });

    await db.insert(promptVersions).values({
      promptId: existing.id,
      authorId: profile.id,
      version: existing.version,
      title: existing.title,
      content: existing.content,
      changelog: String(formData.get("changelog") || "").trim() || null,
    });

    const slug = await uniqueSlug(parsed.title, existing.id);
    const ownedCollectionId = await ensureCollectionOwnership(profile.id, collectionId);

    await db
      .update(prompts)
      .set({
        title: parsed.title,
        description: parsed.description,
        content: parsed.content,
        collectionId: ownedCollectionId,
        type: parsed.type,
        visibility: parsed.visibility,
        tags: parsed.tags,
        targetModels: parsed.targetModels,
        status: parsed.status,
        rating: parsed.rating,
        notes: parsed.notes,
        slug,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(prompts.id, existing.id));

    await trimPromptVersions(existing.id);
    await ensureTags(profile.id, parsed.tags);

    revalidatePath("/prompts");
    revalidatePath(`/prompts/${existing.id}`);
    return ok({ promptId: existing.id });
  } catch (error) {
    return fail(error);
  }
}

export async function deletePrompt(promptId: string): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    await db.delete(prompts).where(and(eq(prompts.id, promptId), eq(prompts.authorId, profile.id)));
    revalidatePath("/prompts");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function clonePrompt(promptId: string): Promise<ActionResult<{ promptId: string }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const source = await db.query.prompts.findFirst({
      where: and(
        eq(prompts.id, promptId),
        or(eq(prompts.authorId, profile.id), eq(prompts.visibility, "public")),
      ),
    });

    if (!source) throw new Error("Prompt no encontrado");

    const title = `${source.title} (copia)`;
    const slug = await uniqueSlug(title);

    const [created] = await db
      .insert(prompts)
      .values({
        authorId: profile.id,
        clonedFromId: source.id,
        title,
        description: source.description,
        content: source.content,
        type: source.type,
        tags: source.tags,
        visibility: "private",
        targetModels: source.targetModels,
        status: "active",
        slug,
      })
      .returning({ id: prompts.id });

    await db
      .update(prompts)
      .set({ cloneCount: sql`${prompts.cloneCount} + 1` })
      .where(eq(prompts.id, source.id));

    if (source.authorId !== profile.id && source.visibility === "public") {
      await db.insert(notifications).values({
        userId: source.authorId,
        type: "clone",
        actorId: profile.id,
        promptId: source.id,
      });
    }

    revalidatePath("/prompts");
    revalidatePath("/", "layout");
    return ok({ promptId: created.id });
  } catch (error) {
    return fail(error);
  }
}

export async function toggleFavorite(promptId: string): Promise<ActionResult<{ favorite: boolean }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const target = await db.query.prompts.findFirst({ where: eq(prompts.id, promptId) });
    if (!target) throw new Error("Prompt no encontrado");

    if (target.authorId === profile.id) {
      await db
        .update(prompts)
        .set({ isFavorite: !target.isFavorite })
        .where(and(eq(prompts.id, target.id), eq(prompts.authorId, profile.id)));
      revalidatePath("/prompts");
      return ok({ favorite: !target.isFavorite });
    }

    const favorite = await db.query.favorites.findFirst({
      where: and(eq(favorites.userId, profile.id), eq(favorites.promptId, target.id)),
    });

    if (favorite) {
      await db
        .delete(favorites)
        .where(and(eq(favorites.userId, profile.id), eq(favorites.promptId, target.id)));
      revalidatePath("/favorites");
      return ok({ favorite: false });
    }

    await db.insert(favorites).values({ userId: profile.id, promptId: target.id });

    if (target.authorId !== profile.id && target.visibility === "public") {
      await db.insert(notifications).values({
        userId: target.authorId,
        type: "favorite_public",
        actorId: profile.id,
        promptId: target.id,
      });
    }

    revalidatePath("/favorites");
    revalidatePath("/", "layout");
    return ok({ favorite: true });
  } catch (error) {
    return fail(error);
  }
}

export async function incrementCopyCount(promptId: string): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    await db
      .update(prompts)
      .set({ copyCount: sql`${prompts.copyCount} + 1` })
      .where(
        and(
          eq(prompts.id, promptId),
          or(eq(prompts.authorId, profile.id), eq(prompts.visibility, "public")),
        ),
      );

    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function ratePrompt(
  promptId: string,
  rating: number | null,
): Promise<ActionResult<{ rating: number | null }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const target = await db.query.prompts.findFirst({
      where: and(eq(prompts.id, promptId), eq(prompts.authorId, profile.id)),
      columns: { id: true },
    });

    if (!target) throw new Error("Prompt no encontrado");
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      throw new Error("Rating inválido");
    }

    await db
      .update(prompts)
      .set({
        rating,
        updatedAt: new Date(),
      })
      .where(eq(prompts.id, target.id));

    revalidatePath("/prompts");
    revalidatePath(`/prompts/${promptId}`);
    return ok({ rating });
  } catch (error) {
    return fail(error);
  }
}

export async function setPromptStatus(
  promptId: string,
  status: "draft" | "active" | "archived",
): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    await db
      .update(prompts)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(prompts.id, promptId), eq(prompts.authorId, profile.id)));

    revalidatePath("/prompts");
    revalidatePath(`/prompts/${promptId}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function updatePromptNotes(
  promptId: string,
  notes: string,
): Promise<ActionResult<{ notes: string }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const target = await db.query.prompts.findFirst({
      where: and(eq(prompts.id, promptId), eq(prompts.authorId, profile.id)),
      columns: { id: true },
    });

    if (!target) throw new Error("Prompt no encontrado");

    const safeNotes = notes.slice(0, 5000);
    await db
      .update(prompts)
      .set({ notes: safeNotes, updatedAt: new Date() })
      .where(eq(prompts.id, target.id));

    revalidatePath(`/prompts/${promptId}`);
    return ok({ notes: safeNotes });
  } catch (error) {
    return fail(error);
  }
}

export async function setPromptType(
  promptId: string,
  type:
    | "system"
    | "user"
    | "assistant"
    | "few-shot"
    | "chain-of-thought"
    | "instruction"
    | "persona"
    | "template"
    | "custom",
): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    await db
      .update(prompts)
      .set({ type, updatedAt: new Date() })
      .where(and(eq(prompts.id, promptId), eq(prompts.authorId, profile.id)));

    revalidatePath("/prompts");
    revalidatePath(`/prompts/${promptId}`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function togglePin(promptId: string): Promise<ActionResult<{ pinned: boolean }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const target = await db.query.prompts.findFirst({
      where: and(eq(prompts.id, promptId), eq(prompts.authorId, profile.id)),
    });

    if (!target) throw new Error("Prompt no encontrado");

    if (!target.pinned) {
      const currentPins = await db.query.prompts.findMany({
        where: and(eq(prompts.authorId, profile.id), eq(prompts.pinned, true)),
      });

      if (currentPins.length >= 5) {
        throw new Error("Máximo 5 prompts pinados");
      }

      const maxOrder = Math.max(0, ...currentPins.map((prompt) => prompt.pinnedOrder ?? 0));
      await db
        .update(prompts)
        .set({ pinned: true, pinnedOrder: maxOrder + 1 })
        .where(eq(prompts.id, target.id));
      revalidatePath("/prompts");
      return ok({ pinned: true });
    }

    await db
      .update(prompts)
      .set({ pinned: false, pinnedOrder: null })
      .where(eq(prompts.id, target.id));
    revalidatePath("/prompts");
    return ok({ pinned: false });
  } catch (error) {
    return fail(error);
  }
}

export async function reorderPins(orderedIds: string[]): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const existing = await db.query.prompts.findMany({
      where: and(eq(prompts.authorId, profile.id), eq(prompts.pinned, true)),
      columns: { id: true },
    });

    const ownedIds = new Set(existing.map((item) => item.id));
    if (!orderedIds.every((id) => ownedIds.has(id))) {
      throw new Error("La lista de pins contiene prompts no válidos");
    }

    for (let index = 0; index < orderedIds.length; index += 1) {
      await db
        .update(prompts)
        .set({ pinnedOrder: index + 1 })
        .where(and(eq(prompts.authorId, profile.id), eq(prompts.id, orderedIds[index])));
    }

    revalidatePath("/prompts");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function generateShortId(promptId: string): Promise<ActionResult<{ shortId: string }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const target = await db.query.prompts.findFirst({
      where: and(eq(prompts.id, promptId), eq(prompts.authorId, profile.id)),
    });

    if (!target) throw new Error("Prompt no encontrado");
    if (target.visibility !== "public") throw new Error("Solo los prompts públicos se pueden compartir");

    if (target.shortId) return ok({ shortId: target.shortId });

    const shortId = nanoid(8);
    await db.update(prompts).set({ shortId }).where(eq(prompts.id, target.id));

    revalidatePath(`/prompts/${promptId}`);
    return ok({ shortId });
  } catch (error) {
    return fail(error);
  }
}

export async function restoreVersion(promptId: string, versionId: string): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const target = await db.query.prompts.findFirst({
      where: and(eq(prompts.id, promptId), eq(prompts.authorId, profile.id)),
    });
    if (!target) throw new Error("Prompt no encontrado");

    const version = await db.query.promptVersions.findFirst({
      where: and(eq(promptVersions.id, versionId), eq(promptVersions.promptId, promptId)),
    });

    if (!version) throw new Error("Versión no encontrada");

    await db.insert(promptVersions).values({
      promptId: target.id,
      authorId: profile.id,
      version: target.version,
      title: target.title,
      content: target.content,
      changelog: `Restaurado desde la versión ${version.version}`,
    });

    await db
      .update(prompts)
      .set({
        title: version.title,
        content: version.content,
        version: target.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(prompts.id, target.id));

    await trimPromptVersions(target.id);
    revalidatePath(`/prompts/${promptId}`);
    revalidatePath(`/prompts/${promptId}/history`);
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function bulkDeletePrompts(ids: string[]): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    if (ids.length === 0) return ok(undefined);

    await db
      .delete(prompts)
      .where(and(eq(prompts.authorId, profile.id), inArray(prompts.id, ids)));

    revalidatePath("/prompts");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
