import { and, eq, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { prompts } from "@/lib/db/schema";
import { validateApiKey } from "@/lib/utils/api-key";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const profile = await validateApiKey(request.headers.get("authorization"));
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const db = getDb();

  const prompt = await db.query.prompts.findFirst({
    where: and(eq(prompts.slug, slug), or(eq(prompts.authorId, profile.id), eq(prompts.visibility, "public"))),
  });

  if (!prompt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    prompt.authorId === profile.id
      ? prompt
      : {
          ...prompt,
          notes: null,
        },
  );
}
