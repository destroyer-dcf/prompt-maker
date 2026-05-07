"use server";

import { and, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/actions/types";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { prompts, tags } from "@/lib/db/schema";
import { uniqueSlug } from "@/lib/utils/slug";
import { parseImportFile, type ImportItem } from "@/lib/utils/import";

type ConflictMode = "skip" | "rename" | "overwrite";

type ImportPreviewItem = {
  id: string;
  title: string;
  type: string;
  visibility: "private" | "public";
  tags: string[];
  hasConflict: boolean;
  conflictWithTitle: string | null;
};

type ImportPreviewResult = {
  source: "json" | "markdown" | "zip";
  errors: string[];
  items: ImportPreviewItem[];
  payload: string;
};

async function ensureTags(userId: string, values: string[]) {
  if (values.length === 0) return;

  const db = getDb();

  for (const value of values) {
    await db
      .insert(tags)
      .values({
        name: value,
        createdBy: userId,
      })
      .onConflictDoNothing();
  }
}

export async function previewImport(
  formData: FormData,
): Promise<ActionResult<ImportPreviewResult>> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new Error("Selecciona un archivo válido");
    }

    const parsed = await parseImportFile(file);

    const titles = parsed.items.map((item) => item.title.trim()).filter(Boolean);
    const existing =
      titles.length > 0
        ? await db.query.prompts.findMany({
            where: and(
              eq(prompts.authorId, profile.id),
              or(...titles.map((title) => ilike(prompts.title, title))),
            ),
            columns: { id: true, title: true },
          })
        : [];

    const existingByLowerTitle = new Map(
      existing.map((row) => [row.title.toLowerCase(), row.title]),
    );

    const items: ImportPreviewItem[] = parsed.items.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      visibility: item.visibility,
      tags: item.tags,
      hasConflict: existingByLowerTitle.has(item.title.toLowerCase()),
      conflictWithTitle: existingByLowerTitle.get(item.title.toLowerCase()) ?? null,
    }));

    return ok({
      source: parsed.source,
      errors: parsed.errors,
      items,
      payload: JSON.stringify(parsed.items),
    });
  } catch (error) {
    return fail(error);
  }
}

type ImportPlanItem = {
  id: string;
  mode?: ConflictMode;
};

export async function applyImport(
  payload: string,
  plan: ImportPlanItem[],
  defaultMode: ConflictMode,
): Promise<
  ActionResult<{ imported: number; skipped: number; overwritten: number; processed: number }>
> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const parsed = JSON.parse(payload) as ImportItem[];
    const selectedSet = new Set(plan.map((item) => item.id));
    const planById = new Map(plan.map((item) => [item.id, item]));
    const items = parsed.filter((item) => selectedSet.has(item.id));

    let imported = 0;
    let skipped = 0;
    let overwritten = 0;
    let processed = 0;

    for (const item of items) {
      const effectiveMode = planById.get(item.id)?.mode ?? defaultMode;
      const existing = await db.query.prompts.findFirst({
        where: and(
          eq(prompts.authorId, profile.id),
          ilike(prompts.title, item.title),
        ),
      });

      if (existing && effectiveMode === "skip") {
        skipped += 1;
        processed += 1;
        continue;
      }

      if (existing && effectiveMode === "overwrite") {
        const slug = await uniqueSlug(item.title, existing.id);
        await db
          .update(prompts)
          .set({
            title: item.title,
            description: item.description,
            content: item.content,
            type: item.type as typeof prompts.$inferSelect.type,
            tags: item.tags,
            visibility: item.visibility,
            status: item.status,
            targetModels: item.targetModels,
            notes: item.notes,
            rating: item.rating,
            slug,
            version: (existing.version ?? 1) + 1,
            updatedAt: new Date(),
          })
          .where(eq(prompts.id, existing.id));

        await ensureTags(profile.id, item.tags);
        overwritten += 1;
        processed += 1;
        continue;
      }

      const finalTitle =
        existing && effectiveMode === "rename" ? `${item.title} (importado)` : item.title;
      const slug = await uniqueSlug(finalTitle);

      await db.insert(prompts).values({
        authorId: profile.id,
        title: finalTitle,
        description: item.description,
        content: item.content,
        type: item.type as typeof prompts.$inferSelect.type,
        tags: item.tags,
        visibility: item.visibility,
        status: item.status,
        targetModels: item.targetModels,
        notes: item.notes,
        rating: item.rating,
        slug,
      });

      await ensureTags(profile.id, item.tags);
      imported += 1;
      processed += 1;
    }

    revalidatePath("/prompts");
    revalidatePath("/settings/import-export");

    return ok({ imported, skipped, overwritten, processed });
  } catch (error) {
    return fail(error);
  }
}
