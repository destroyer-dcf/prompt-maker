import { NextRequest, NextResponse } from "next/server";

import { searchPromptsForApi } from "@/lib/api/prompts-api";
import { validateApiKey } from "@/lib/utils/api-key";

export async function GET(request: NextRequest) {
  const profile = await validateApiKey(request.headers.get("authorization"));
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { error: "Missing required query parameter: q" },
      { status: 400 },
    );
  }

  const data = await searchPromptsForApi(profile.id, params);
  return NextResponse.json({ data, count: data.length });
}
