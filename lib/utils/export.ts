import JSZip from "jszip";

import type { collections, prompts, tags, templates } from "@/lib/db/schema";

type PromptRow = typeof prompts.$inferSelect;
type TemplateRow = typeof templates.$inferSelect;
type CollectionRow = typeof collections.$inferSelect;
type TagRow = typeof tags.$inferSelect;

export type ExportBundle = {
  version: "1.0";
  exportedAt: string;
  exportedBy: string;
  prompts: Array<{
    title: string;
    description: string;
    content: string;
    type: string;
    tags: string[];
    visibility: "private" | "public";
    status: "draft" | "active" | "archived";
    rating: number | null;
    targetModels: string[];
    notes: string;
    createdAt: string;
    updatedAt: string;
  }>;
  templates: Array<{
    title: string;
    description: string;
    content: string;
    type: string;
    tags: string[];
    visibility: "private" | "public";
    variables: Array<Record<string, unknown>>;
    createdAt: string;
    updatedAt: string;
  }>;
  collections: Array<{
    name: string;
    description: string;
    color: string;
    icon: string;
    createdAt: string;
    updatedAt: string;
  }>;
  tags: Array<{
    name: string;
    color: string;
  }>;
};

function yamlList(values: string[]) {
  if (values.length === 0) return "[]";
  return `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
}

function escapeMd(value: string) {
  return value.replace(/\r\n/g, "\n").trimEnd();
}

function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "item";
}

export function promptToMarkdown(prompt: PromptRow) {
  const header = [
    "---",
    `title: ${JSON.stringify(prompt.title)}`,
    `description: ${JSON.stringify(prompt.description ?? "")}`,
    `type: ${JSON.stringify(prompt.type ?? "custom")}`,
    `tags: ${yamlList(prompt.tags ?? [])}`,
    `visibility: ${JSON.stringify(prompt.visibility ?? "private")}`,
    `status: ${JSON.stringify(prompt.status ?? "active")}`,
    `rating: ${prompt.rating ?? ""}`,
    `targetModels: ${yamlList(prompt.targetModels ?? [])}`,
    `createdAt: ${JSON.stringify(prompt.createdAt.toISOString())}`,
    `updatedAt: ${JSON.stringify(prompt.updatedAt.toISOString())}`,
    "---",
    "",
    "## Prompt",
    "",
    escapeMd(prompt.content),
    "",
    "## Notes",
    "",
    escapeMd(prompt.notes ?? ""),
    "",
  ];

  return header.join("\n");
}

export function templateToMarkdown(template: TemplateRow) {
  const header = [
    "---",
    `title: ${JSON.stringify(template.title)}`,
    `description: ${JSON.stringify(template.description ?? "")}`,
    `type: ${JSON.stringify(template.type ?? "custom")}`,
    `tags: ${yamlList(template.tags ?? [])}`,
    `visibility: ${JSON.stringify(template.visibility ?? "private")}`,
    `variables: ${JSON.stringify(template.variables ?? [])}`,
    `createdAt: ${JSON.stringify(template.createdAt.toISOString())}`,
    `updatedAt: ${JSON.stringify(template.updatedAt.toISOString())}`,
    "---",
    "",
    "## Template",
    "",
    escapeMd(template.content),
    "",
  ];

  return header.join("\n");
}

export function buildExportBundle(params: {
  email: string;
  prompts: PromptRow[];
  templates: TemplateRow[];
  collections: CollectionRow[];
  tags: TagRow[];
}): ExportBundle {
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    exportedBy: params.email,
    prompts: params.prompts.map((prompt) => ({
      title: prompt.title,
      description: prompt.description ?? "",
      content: prompt.content,
      type: prompt.type ?? "custom",
      tags: prompt.tags ?? [],
      visibility: prompt.visibility ?? "private",
      status: prompt.status ?? "active",
      rating: prompt.rating,
      targetModels: prompt.targetModels ?? [],
      notes: prompt.notes ?? "",
      createdAt: prompt.createdAt.toISOString(),
      updatedAt: prompt.updatedAt.toISOString(),
    })),
    templates: params.templates.map((template) => ({
      title: template.title,
      description: template.description ?? "",
      content: template.content,
      type: template.type ?? "custom",
      tags: template.tags ?? [],
      visibility: template.visibility ?? "private",
      variables: (template.variables ?? []) as Array<Record<string, unknown>>,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    })),
    collections: params.collections.map((collection) => ({
      name: collection.name,
      description: collection.description ?? "",
      color: collection.color ?? "#1d4ed8",
      icon: collection.icon ?? "folder",
      createdAt: collection.createdAt.toISOString(),
      updatedAt: collection.updatedAt.toISOString(),
    })),
    tags: params.tags.map((tag) => ({
      name: tag.name,
      color: tag.color ?? "#1d4ed8",
    })),
  };
}

export async function buildExportZip(params: {
  email: string;
  prompts: PromptRow[];
  templates: TemplateRow[];
  collections: CollectionRow[];
  tags: TagRow[];
}) {
  const zip = new JSZip();

  params.prompts.forEach((prompt, index) => {
    const name = `${String(index + 1).padStart(3, "0")}-${safeFileName(prompt.title)}.md`;
    zip.file(`prompts/${name}`, promptToMarkdown(prompt));
  });

  params.templates.forEach((template, index) => {
    const name = `${String(index + 1).padStart(3, "0")}-${safeFileName(template.title)}.md`;
    zip.file(`templates/${name}`, templateToMarkdown(template));
  });

  const bundle = buildExportBundle(params);
  zip.file("export.json", JSON.stringify(bundle, null, 2));
  zip.file("README.txt", `Export generated for ${params.email} at ${bundle.exportedAt}`);

  return zip.generateAsync({ type: "uint8array" });
}

export function buildCombinedMarkdown(params: {
  prompts: PromptRow[];
  templates: TemplateRow[];
}) {
  const blocks: string[] = [];

  params.prompts.forEach((prompt, index) => {
    blocks.push(`# Prompt ${index + 1}: ${prompt.title}`);
    blocks.push("");
    blocks.push(promptToMarkdown(prompt));
    blocks.push("\n---\n");
  });

  params.templates.forEach((template, index) => {
    blocks.push(`# Template ${index + 1}: ${template.title}`);
    blocks.push("");
    blocks.push(templateToMarkdown(template));
    blocks.push("\n---\n");
  });

  return blocks.join("\n");
}
