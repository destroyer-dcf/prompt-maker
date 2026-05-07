import { and, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PromptVersionHistory } from "@/components/prompts/PromptVersionHistory";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { profiles, promptVersions, prompts } from "@/lib/db/schema";

export default async function PromptHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const db = getDb();

  const prompt = await db.query.prompts.findFirst({
    where: and(eq(prompts.id, id), eq(prompts.authorId, profile.id)),
  });

  if (!prompt) notFound();
  const promptId = prompt.id;

  const versions = await db.query.promptVersions.findMany({
    where: eq(promptVersions.promptId, promptId),
    orderBy: [desc(promptVersions.version)],
  });
  const authorIds = [...new Set(versions.map((item) => item.authorId))];
  const authors =
    authorIds.length > 0
      ? await db.query.profiles.findMany({
          where: inArray(profiles.id, authorIds),
          columns: { id: true, name: true, email: true },
        })
      : [];
  const authorMap = new Map(authors.map((item) => [item.id, item.name || item.email]));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Historial de versiones</h1>
        <Link href={`/prompts/${promptId}`} className="rounded-xl border px-3 py-1.5 text-sm font-medium hover:bg-[--panel-soft]">
          Volver al prompt
        </Link>
      </div>

      <PromptVersionHistory
        promptId={promptId}
        versions={versions.map((version) => ({
          id: version.id,
          version: version.version,
          content: version.content,
          changelog: version.changelog,
          authorId: version.authorId,
          authorName: authorMap.get(version.authorId) ?? "Desconocido",
          createdAt: version.createdAt,
        }))}
      />
    </section>
  );
}
