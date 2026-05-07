import JSZip from "jszip";
import matter from "gray-matter";

export type ImportItem = {
  id: string;
  title: string;
  description: string;
  content: string;
  type: string;
  tags: string[];
  visibility: "private" | "public";
  status: "draft" | "active" | "archived";
  targetModels: string[];
  notes: string;
  rating: number | null;
};

export type ImportPreview = {
  items: ImportItem[];
  source: "json" | "markdown" | "zip";
  errors: string[];
};

function normalizeVisibility(value: unknown): "private" | "public" {
  return value === "public" ? "public" : "private";
}

function normalizeStatus(value: unknown): "draft" | "active" | "archived" {
  if (value === "draft" || value === "archived") return value;
  return "active";
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function parseMarkdownPrompt(content: string, fallbackTitle: string): ImportItem {
  const parsed = matter(content);
  const data = parsed.data as Record<string, unknown>;

  const inferredTitle = String(data.title ?? fallbackTitle).trim() || fallbackTitle;

  return {
    id: crypto.randomUUID(),
    title: inferredTitle,
    description: String(data.description ?? "").trim(),
    content: String(parsed.content ?? "").trim(),
    type: String(data.type ?? "custom"),
    tags: normalizeStringArray(data.tags),
    visibility: normalizeVisibility(data.visibility),
    status: normalizeStatus(data.status),
    targetModels: normalizeStringArray(data.targetModels),
    notes: String(data.notes ?? "").trim(),
    rating: Number.isFinite(Number(data.rating)) ? Number(data.rating) : null,
  };
}

function parseJsonItems(json: unknown): ImportItem[] {
  const root = json as Record<string, unknown>;
  const prompts = Array.isArray(root.prompts) ? root.prompts : [];

  return prompts
    .map((item) => item as Record<string, unknown>)
    .map((item) => ({
      id: crypto.randomUUID(),
      title: String(item.title ?? "").trim(),
      description: String(item.description ?? "").trim(),
      content: String(item.content ?? "").trim(),
      type: String(item.type ?? "custom"),
      tags: normalizeStringArray(item.tags),
      visibility: normalizeVisibility(item.visibility),
      status: normalizeStatus(item.status),
      targetModels: normalizeStringArray(item.targetModels),
      notes: String(item.notes ?? "").trim(),
      rating: Number.isFinite(Number(item.rating)) ? Number(item.rating) : null,
    }))
    .filter((item) => item.title.length > 0 && item.content.length > 0);
}

export async function parseImportFile(file: File): Promise<ImportPreview> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".json")) {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    return {
      source: "json",
      items: parseJsonItems(parsed),
      errors: [],
    };
  }

  if (name.endsWith(".md") || name.endsWith(".markdown")) {
    const text = await file.text();
    const item = parseMarkdownPrompt(text, file.name.replace(/\.(md|markdown)$/i, ""));
    return {
      source: "markdown",
      items: item.title && item.content ? [item] : [],
      errors: item.title && item.content ? [] : ["Markdown inválido o incompleto"],
    };
  }

  if (name.endsWith(".zip")) {
    const data = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(data);
    const items: ImportItem[] = [];
    const errors: string[] = [];

    const mdEntries = Object.values(zip.files).filter(
      (entry) => !entry.dir && /\.(md|markdown)$/i.test(entry.name),
    );

    for (const entry of mdEntries) {
      try {
        const text = await entry.async("string");
        const item = parseMarkdownPrompt(text, entry.name.replace(/\.(md|markdown)$/i, ""));
        if (item.title && item.content) {
          items.push(item);
        }
      } catch {
        errors.push(`No se pudo leer ${entry.name}`);
      }
    }

    const jsonEntry = zip.file("export.json");
    if (jsonEntry) {
      try {
        const text = await jsonEntry.async("string");
        const parsed = parseJsonItems(JSON.parse(text));
        parsed.forEach((item) => items.push(item));
      } catch {
        errors.push("export.json inválido dentro del ZIP");
      }
    }

    const dedup = new Map<string, ImportItem>();
    for (const item of items) {
      const key = `${item.title.toLowerCase()}::${item.content.slice(0, 120)}`;
      if (!dedup.has(key)) dedup.set(key, item);
    }

    return {
      source: "zip",
      items: [...dedup.values()],
      errors,
    };
  }

  throw new Error("Formato no soportado. Usa .json, .md o .zip");
}
