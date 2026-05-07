import { getDb } from "@/lib/db";
import { tags } from "@/lib/db/schema";

const TAG_COLORS = [
  "#1d4ed8",
  "#2563eb",
  "#0ea5e9",
  "#0891b2",
  "#0f766e",
  "#15803d",
  "#65a30d",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#be123c",
  "#9333ea",
] as const;

function hashTagName(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function pickTagColor(name: string) {
  const index = hashTagName(name.toLowerCase()) % TAG_COLORS.length;
  return TAG_COLORS[index];
}

export async function ensureTags(userId: string, values: string[]) {
  if (values.length === 0) return;
  const db = getDb();

  for (const value of values) {
    await db
      .insert(tags)
      .values({
        name: value,
        color: pickTagColor(value),
        createdBy: userId,
      })
      .onConflictDoNothing();
  }
}
