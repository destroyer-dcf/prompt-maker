import fs from "node:fs";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

function loadDotenvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const sep = line.indexOf("=");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = line.slice(sep + 1).replace(/^"|"$/g, "");
  }
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

type CreatedState = {
  ownerPromptId?: string;
  ownerKeyIds: string[];
  viewerKeyIds: string[];
  viewerProfileId?: string;
  notificationIds: string[];
};

const created: CreatedState = {
  ownerKeyIds: [],
  viewerKeyIds: [],
  notificationIds: [],
};

let failed = false;
function pass(message: string) {
  console.log(`[OK] ${message}`);
}
function fail(message: string) {
  failed = true;
  console.error(`[FAIL] ${message}`);
}
function assertCheck(condition: unknown, message: string) {
  if (condition) pass(message);
  else fail(message);
}

function generateApiKeyLocal(): { raw: string; hash: string; prefix: string } {
  const raw = `pm_${randomBytes(32).toString("base64url")}`;
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 10);
  return { raw, hash, prefix };
}

async function cleanup(deps: {
  db: ReturnType<typeof import("@/lib/db").getDb>;
  apiKeys: typeof import("@/lib/db/schema").apiKeys;
  notifications: typeof import("@/lib/db/schema").notifications;
  prompts: typeof import("@/lib/db/schema").prompts;
  profiles: typeof import("@/lib/db/schema").profiles;
}) {
  const { db, apiKeys, notifications, prompts, profiles } = deps;

  if (created.notificationIds.length > 0) {
    for (const id of created.notificationIds) {
      await db.delete(notifications).where(eq(notifications.id, id));
    }
  }

  if (created.ownerKeyIds.length > 0) {
    for (const id of created.ownerKeyIds) {
      await db.delete(apiKeys).where(eq(apiKeys.id, id));
    }
  }

  if (created.viewerKeyIds.length > 0) {
    for (const id of created.viewerKeyIds) {
      await db.delete(apiKeys).where(eq(apiKeys.id, id));
    }
  }

  if (created.ownerPromptId) {
    await db.delete(prompts).where(eq(prompts.id, created.ownerPromptId));
  }

  if (created.viewerProfileId) {
    await db.delete(profiles).where(eq(profiles.id, created.viewerProfileId));
  }
}

async function main() {
  loadDotenvLocal();

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!anonKey) {
    throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }
  const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const adminEmail = requireEnv("ADMIN_EMAIL");
  const adminPassword = requireEnv("ADMIN_PASSWORD");

  const [
    apiListMod,
    apiByIdMod,
    apiBySlugMod,
    apiSearchMod,
    dbMod,
    notifMod,
    schemaMod,
    exportMod,
  ] = await Promise.all([
    import("@/app/api/v1/prompts/route"),
    import("@/app/api/v1/prompts/[id]/route"),
    import("@/app/api/v1/prompts/by-slug/[slug]/route"),
    import("@/app/api/v1/prompts/search/route"),
    import("@/lib/db"),
    import("@/lib/db/queries/notifications"),
    import("@/lib/db/schema"),
    import("@/lib/utils/export"),
  ]);

  const listPromptsRoute = apiListMod.GET;
  const promptByIdRoute = apiByIdMod.GET;
  const promptBySlugRoute = apiBySlugMod.GET;
  const searchPromptsRoute = apiSearchMod.GET;
  const { getDb } = dbMod;
  const { listNotifications } = notifMod;
  const { apiKeys, notifications, profiles, prompts, templates } = schemaMod;
  const { buildCombinedMarkdown, buildExportBundle, buildExportZip } = exportMod;

  const db = getDb();
  const nowStamp = Date.now();
  const token = `smoke-${nowStamp}-${Math.random().toString(36).slice(2, 8)}`;

  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const signIn = await anonClient.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  assertCheck(!signIn.error && !!signIn.data.user, "Auth login with email/password");
  await anonClient.auth.signOut();

  const owner = await db.query.profiles.findFirst({
    where: eq(profiles.email, adminEmail),
  });
  if (!owner) {
    fail("Admin profile missing in profiles table");
    throw new Error("Admin profile missing");
  }
  assertCheck(owner.role === "admin" && owner.status === "active", "Admin profile status/role");

  const slug = `smoke-${nowStamp}`;
  const shortId = `s${Math.random().toString(36).slice(2, 10)}`;
  const [createdPrompt] = await db
    .insert(prompts)
    .values({
      authorId: owner.id,
      title: `[${token}] Prompt`,
      description: "Smoke prompt",
      content: `Contenido smoke ${token}`,
      slug,
      shortId,
      visibility: "public",
      status: "active",
      notes: `nota-privada-${token}`,
      tags: ["smoke", "qa"],
      type: "custom",
    })
    .returning({ id: prompts.id, title: prompts.title, shortId: prompts.shortId });
  created.ownerPromptId = createdPrompt.id;
  assertCheck(!!createdPrompt.id, "Prompt created");

  const [updatedPrompt] = await db
    .update(prompts)
    .set({ title: `[${token}] Prompt updated` })
    .where(eq(prompts.id, createdPrompt.id))
    .returning({ id: prompts.id, title: prompts.title });
  assertCheck(updatedPrompt.title.includes("updated"), "Prompt updated");

  const ownerApi = generateApiKeyLocal();
  const [ownerKeyRow] = await db
    .insert(apiKeys)
    .values({
      userId: owner.id,
      name: `smoke-owner-${token}`,
      keyHash: ownerApi.hash,
      prefix: ownerApi.prefix,
    })
    .returning({ id: apiKeys.id });
  created.ownerKeyIds.push(ownerKeyRow.id);

  const noAuthReq = new NextRequest("http://localhost/api/v1/prompts");
  const noAuthRes = await listPromptsRoute(noAuthReq);
  assertCheck(noAuthRes.status === 401, "API list unauthorized returns 401");

  const ownerHeaders = new Headers({ authorization: `Bearer ${ownerApi.raw}` });
  const listReq = new NextRequest(
    `http://localhost/api/v1/prompts?scope=mine&q=${encodeURIComponent(token)}`,
    { headers: ownerHeaders },
  );
  const listRes = await listPromptsRoute(listReq);
  const listJson = (await listRes.json()) as { count?: number; data?: Array<{ id: string }> };
  assertCheck(listRes.status === 200, "API list authorized returns 200");
  assertCheck((listJson.count ?? 0) >= 1, "API list returns at least one row");

  const idReq = new NextRequest(`http://localhost/api/v1/prompts/${createdPrompt.id}`, {
    headers: ownerHeaders,
  });
  const idRes = await promptByIdRoute(idReq, { params: Promise.resolve({ id: createdPrompt.id }) });
  const idJson = (await idRes.json()) as { notes?: string | null };
  assertCheck(idRes.status === 200, "API by-id returns 200 for owner");
  assertCheck(idJson.notes?.includes(token), "API by-id exposes notes to owner");

  const slugReq = new NextRequest(`http://localhost/api/v1/prompts/by-slug/${slug}`, {
    headers: ownerHeaders,
  });
  const slugRes = await promptBySlugRoute(slugReq, { params: Promise.resolve({ slug }) });
  assertCheck(slugRes.status === 200, "API by-slug returns 200");

  const searchBadReq = new NextRequest("http://localhost/api/v1/prompts/search", {
    headers: ownerHeaders,
  });
  const searchBadRes = await searchPromptsRoute(searchBadReq);
  assertCheck(searchBadRes.status === 400, "API search validates required q");

  const searchReq = new NextRequest(
    `http://localhost/api/v1/prompts/search?q=${encodeURIComponent(token)}`,
    { headers: ownerHeaders },
  );
  const searchRes = await searchPromptsRoute(searchReq);
  const searchJson = (await searchRes.json()) as { count?: number };
  assertCheck(searchRes.status === 200, "API search returns 200");
  assertCheck((searchJson.count ?? 0) >= 1, "API search returns prompt");

  const viewerEmail = `viewer+${token}@example.com`;
  const viewerPassword = `Pass-${token}-Aa1!`;
  const createdViewer = await adminClient.auth.admin.createUser({
    email: viewerEmail,
    password: viewerPassword,
    email_confirm: true,
  });
  if (createdViewer.error || !createdViewer.data.user?.id) {
    throw new Error(`Unable to create viewer auth user: ${createdViewer.error?.message ?? "unknown"}`);
  }
  const viewerId = createdViewer.data.user.id;
  created.viewerProfileId = viewerId;

  await db.insert(profiles).values({
    id: viewerId,
    email: viewerEmail,
    name: `Viewer ${token}`,
    role: "user",
    status: "active",
  });

  const viewerApi = generateApiKeyLocal();
  const [viewerKeyRow] = await db
    .insert(apiKeys)
    .values({
      userId: viewerId,
      name: `smoke-viewer-${token}`,
      keyHash: viewerApi.hash,
      prefix: viewerApi.prefix,
    })
    .returning({ id: apiKeys.id });
  created.viewerKeyIds.push(viewerKeyRow.id);

  const viewerReq = new NextRequest(`http://localhost/api/v1/prompts/${createdPrompt.id}`, {
    headers: new Headers({ authorization: `Bearer ${viewerApi.raw}` }),
  });
  const viewerRes = await promptByIdRoute(viewerReq, { params: Promise.resolve({ id: createdPrompt.id }) });
  const viewerJson = (await viewerRes.json()) as { notes?: string | null };
  assertCheck(viewerRes.status === 200, "API by-id returns 200 for other user (public prompt)");
  assertCheck(viewerJson.notes === null, "API by-id hides notes for non-owner");

  const [createdNotif] = await db
    .insert(notifications)
    .values({
      userId: owner.id,
      type: "clone",
      actorId: viewerId,
      promptId: createdPrompt.id,
      read: false,
    })
    .returning({ id: notifications.id });
  created.notificationIds.push(createdNotif.id);

  const feed = await listNotifications(owner.id, 10);
  assertCheck(feed.some((item) => item.id === createdNotif.id), "Notifications feed includes new event");

  const shortlinkPrompt = await db.query.prompts.findFirst({
    where: and(eq(prompts.shortId, shortId), eq(prompts.visibility, "public")),
  });
  assertCheck(!!shortlinkPrompt, "Shortlink source prompt exists and is public");

  const [promptRows, templateRows] = await Promise.all([
    db.query.prompts.findMany({ where: eq(prompts.authorId, owner.id), limit: 5 }),
    db.query.templates.findMany({ where: eq(templates.authorId, owner.id), limit: 5 }),
  ]);
  const bundle = buildExportBundle({
    email: owner.email,
    prompts: promptRows,
    templates: templateRows,
    collections: [],
    tags: [],
  });
  const md = buildCombinedMarkdown({ prompts: promptRows, templates: templateRows });
  const zip = await buildExportZip({
    email: owner.email,
    prompts: promptRows,
    templates: templateRows,
    collections: [],
    tags: [],
  });
  assertCheck(bundle.prompts.length >= 1, "Export JSON bundle generated");
  assertCheck(md.length > 30, "Export markdown generated");
  assertCheck(zip.length > 100, "Export ZIP generated");

  await adminClient.auth.admin.deleteUser(viewerId);
  pass("Viewer auth user cleaned up");
}

main()
  .catch((error) => {
    fail(error instanceof Error ? error.message : String(error));
  })
  .finally(async () => {
    let deps:
      | {
          db: ReturnType<typeof import("@/lib/db").getDb>;
          apiKeys: typeof import("@/lib/db/schema").apiKeys;
          notifications: typeof import("@/lib/db/schema").notifications;
          prompts: typeof import("@/lib/db/schema").prompts;
          profiles: typeof import("@/lib/db/schema").profiles;
        }
      | undefined;
    try {
      const [dbMod, schemaMod] = await Promise.all([
        import("@/lib/db"),
        import("@/lib/db/schema"),
      ]);
      deps = {
        db: dbMod.getDb(),
        apiKeys: schemaMod.apiKeys,
        notifications: schemaMod.notifications,
        prompts: schemaMod.prompts,
        profiles: schemaMod.profiles,
      };
      await cleanup(deps);
    } catch (error) {
      fail(`Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (failed) {
      process.exit(1);
    }
    console.log("App smoke check completed successfully.");
    process.exit(0);
  });
