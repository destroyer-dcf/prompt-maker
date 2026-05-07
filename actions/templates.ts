"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/actions/types";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { prompts, templates } from "@/lib/db/schema";
import { uniqueSlug } from "@/lib/utils/slug";
import { ensureTags } from "@/lib/utils/tags";
import { parseVariables, resolveVariables } from "@/lib/utils/variables";
import { templateSchema, type TemplateInput } from "@/lib/validations/template.schema";

function parseTemplateForm(formData: FormData): TemplateInput {
  const rawVariables = String(formData.get("variables") ?? "[]");
  let parsedVariables: unknown = [];

  try {
    parsedVariables = JSON.parse(rawVariables);
  } catch {
    parsedVariables = [];
  }

  return templateSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    content: formData.get("content"),
    type: formData.get("type") || "custom",
    visibility: formData.get("visibility") || "private",
    tags: String(formData.get("tags") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    variables: parsedVariables,
  });
}

export async function createTemplate(formData: FormData): Promise<ActionResult<{ templateId: string }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const parsed = parseTemplateForm(formData);

    const [created] = await db
      .insert(templates)
      .values({
        authorId: profile.id,
        title: parsed.title,
        description: parsed.description,
        content: parsed.content,
        type: parsed.type,
        visibility: parsed.visibility,
        tags: parsed.tags,
        variables: parsed.variables,
      })
      .returning({ id: templates.id });

    await ensureTags(profile.id, parsed.tags);
    revalidatePath("/templates");
    return ok({ templateId: created.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateTemplate(
  templateId: string,
  formData: FormData,
): Promise<ActionResult<{ templateId: string }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const existing = await db.query.templates.findFirst({
      where: and(eq(templates.id, templateId), eq(templates.authorId, profile.id)),
    });

    if (!existing) throw new Error("Template no encontrado");

    const parsed = parseTemplateForm(formData);

    await db
      .update(templates)
      .set({
        title: parsed.title,
        description: parsed.description,
        content: parsed.content,
        type: parsed.type,
        visibility: parsed.visibility,
        tags: parsed.tags,
        variables: parsed.variables,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, templateId));

    await ensureTags(profile.id, parsed.tags);
    revalidatePath("/templates");
    revalidatePath(`/templates/${templateId}`);
    return ok({ templateId });
  } catch (error) {
    return fail(error);
  }
}

export async function deleteTemplate(templateId: string): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    await db.delete(templates).where(and(eq(templates.id, templateId), eq(templates.authorId, profile.id)));

    revalidatePath("/templates");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function createPromptFromTemplate(
  templateId: string,
  values: Record<string, string>,
  options?: {
    title?: string;
    visibility?: "private" | "public";
    description?: string;
  },
): Promise<ActionResult<{ promptId: string }>> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const template = await db.query.templates.findFirst({
      where: and(eq(templates.id, templateId), eq(templates.authorId, profile.id)),
    });

    if (!template) throw new Error("Template no encontrado");

    const content = resolveVariables(template.content, values);
    const title = options?.title?.trim() || `${template.title} (desde template)`;
    const slug = await uniqueSlug(title);

    const [created] = await db
      .insert(prompts)
      .values({
        authorId: profile.id,
        templateId: template.id,
        title,
        description: options?.description ?? template.description,
        content,
        type: template.type,
        tags: template.tags,
        visibility: options?.visibility ?? "private",
        slug,
      })
      .returning({ id: prompts.id });

    await db
      .update(templates)
      .set({ usageCount: sql`${templates.usageCount} + 1`, updatedAt: new Date() })
      .where(eq(templates.id, template.id));

    revalidatePath("/prompts");
    return ok({ promptId: created.id });
  } catch (error) {
    return fail(error);
  }
}

export async function deriveTemplateVariables(content: string) {
  const names = parseVariables(content);
  return names.map((name) => ({
    name,
    label: name,
    type: "text" as const,
    required: true,
  }));
}
