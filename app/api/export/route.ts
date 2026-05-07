import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { collections, prompts, tags, templates } from "@/lib/db/schema";
import {
  buildCombinedMarkdown,
  buildExportBundle,
  buildExportZip,
} from "@/lib/utils/export";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const profile = await requireProfile();
    const db = getDb();

    const format = request.nextUrl.searchParams.get("format") ?? "json";
    const includeTemplates = request.nextUrl.searchParams.get("templates") !== "0";

    const [promptRows, templateRows, collectionRows, tagRows] = await Promise.all([
      db.query.prompts.findMany({
        where: eq(prompts.authorId, profile.id),
        orderBy: (fields, { desc }) => [desc(fields.updatedAt)],
      }),
      includeTemplates
        ? db.query.templates.findMany({
            where: eq(templates.authorId, profile.id),
            orderBy: (fields, { desc }) => [desc(fields.updatedAt)],
          })
        : Promise.resolve([]),
      db.query.collections.findMany({ where: eq(collections.authorId, profile.id) }),
      db.query.tags.findMany({ where: eq(tags.createdBy, profile.id) }),
    ]);

    if (format === "json") {
      const payload = buildExportBundle({
        email: profile.email,
        prompts: promptRows,
        templates: templateRows,
        collections: collectionRows,
        tags: tagRows,
      });

      return new NextResponse(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="prompt-manager-export.json"`,
        },
      });
    }

    if (format === "markdown") {
      const md = buildCombinedMarkdown({
        prompts: promptRows,
        templates: templateRows,
      });

      return new NextResponse(md, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="prompt-manager-export.md"`,
        },
      });
    }

    if (format === "zip") {
      const bytes = await buildExportZip({
        email: profile.email,
        prompts: promptRows,
        templates: templateRows,
        collections: collectionRows,
        tags: tagRows,
      });

      return new NextResponse(Buffer.from(bytes), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="prompt-manager-export.zip"`,
        },
      });
    }

    return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
