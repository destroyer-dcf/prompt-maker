import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { getDb } from "@/lib/db";
import { prompts } from "@/lib/db/schema";

async function getPublicPromptByShortId(shortId: string) {
  const db = getDb();
  const prompt = await db.query.prompts.findFirst({
    where: eq(prompts.shortId, shortId),
  });

  if (!prompt || prompt.visibility !== "public") return null;
  return prompt;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shortId: string }>;
}): Promise<Metadata> {
  const { shortId } = await params;
  const prompt = await getPublicPromptByShortId(shortId);

  if (!prompt) {
    return {
      title: "Prompt no encontrado",
      description: "El prompt público solicitado no está disponible.",
    };
  }

  const description =
    prompt.description?.trim() ||
    `Prompt de tipo ${prompt.type} compartido en Prompt Manager.`;

  return {
    title: prompt.title,
    description,
    openGraph: {
      title: prompt.title,
      description,
      type: "article",
      url: `/p/${shortId}`,
    },
    twitter: {
      card: "summary",
      title: prompt.title,
      description,
    },
  };
}

export default async function PublicShortPromptPage({ params }: { params: Promise<{ shortId: string }> }) {
  const { shortId } = await params;
  const prompt = await getPublicPromptByShortId(shortId);

  if (!prompt) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <article className="space-y-4 rounded-2xl border bg-[--panel] p-6">
        <h1 className="text-2xl font-semibold">{prompt.title}</h1>
        <p className="text-sm text-[--ink-soft]">{prompt.description || "Sin descripción"}</p>
        <pre className="whitespace-pre-wrap rounded-xl border bg-[--panel-soft] p-4 font-mono text-sm">{prompt.content}</pre>
      </article>
    </main>
  );
}
