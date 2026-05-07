import { and, asc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { prompts, tags, templates } from "@/lib/db/schema";
import { pickTagColor } from "@/lib/utils/tags";

export type TagSuggestion = {
  name: string;
  color: string | null;
};

export type TagUsageItem = {
  name: string;
  color: string;
  promptCount: number;
  templateCount: number;
  totalCount: number;
};

function uniqueNormalizedTags(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

async function buildUserTagUsage(userId: string): Promise<TagUsageItem[]> {
  const db = getDb();

  const [userPrompts, userTemplates, ownTagRows] = await Promise.all([
    db.query.prompts.findMany({
      where: eq(prompts.authorId, userId),
      columns: { tags: true },
    }),
    db.query.templates.findMany({
      where: eq(templates.authorId, userId),
      columns: { tags: true },
    }),
    db.query.tags.findMany({
      where: and(eq(tags.createdBy, userId)),
      columns: { name: true, color: true },
      orderBy: [asc(tags.name)],
    }),
  ]);

  const promptCounts = new Map<string, number>();
  const templateCounts = new Map<string, number>();

  for (const prompt of userPrompts) {
    const perPrompt = uniqueNormalizedTags(prompt.tags ?? []);
    for (const tagName of perPrompt) {
      promptCounts.set(tagName, (promptCounts.get(tagName) ?? 0) + 1);
    }
  }

  for (const template of userTemplates) {
    const perTemplate = uniqueNormalizedTags(template.tags ?? []);
    for (const tagName of perTemplate) {
      templateCounts.set(tagName, (templateCounts.get(tagName) ?? 0) + 1);
    }
  }

  const names = uniqueNormalizedTags([
    ...ownTagRows.map((row) => row.name),
    ...promptCounts.keys(),
    ...templateCounts.keys(),
  ]);

  const colorRows =
    names.length > 0
      ? await db.query.tags.findMany({
          where: inArray(tags.name, names),
          columns: { name: true, color: true },
        })
      : [];
  const colorMap = new Map(colorRows.map((row) => [row.name, row.color]));

  const usage: TagUsageItem[] = names.map((name) => {
    const promptCount = promptCounts.get(name) ?? 0;
    const templateCount = templateCounts.get(name) ?? 0;
    const totalCount = promptCount + templateCount;

    return {
      name,
      color: colorMap.get(name) ?? pickTagColor(name),
      promptCount,
      templateCount,
      totalCount,
    };
  });

  usage.sort((a, b) => {
    if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
    return a.name.localeCompare(b.name, "es");
  });

  return usage;
}

export async function listTagSuggestions(
  userId: string,
  limit = 200,
): Promise<TagSuggestion[]> {
  const usage = await buildUserTagUsage(userId);
  return usage.slice(0, Math.min(limit, 500)).map((item) => ({
    name: item.name,
    color: item.color,
  }));
}

export async function listTagUsage(userId: string, limit = 300): Promise<TagUsageItem[]> {
  const usage = await buildUserTagUsage(userId);
  return usage.slice(0, Math.min(limit, 1000));
}
