import { and, desc, eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listCollectionsForUser } from "@/lib/db/queries/collections";
import {
  getUnreadNotificationCount,
  listNotifications,
} from "@/lib/db/queries/notifications";
import { prompts } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let profile;

  try {
    profile = await requireProfile();
  } catch {
    redirect("/login");
  }

  const db = getDb();
  const palettePrompts = await db.query.prompts.findMany({
    where: and(
      or(eq(prompts.authorId, profile.id), eq(prompts.visibility, "public")),
      eq(prompts.status, "active"),
    ),
    orderBy: [desc(prompts.pinned), desc(prompts.updatedAt)],
    limit: 120,
    with: {
      template: {
        columns: {
          variables: true,
        },
      },
    },
  });

  const commandPrompts = palettePrompts.map((prompt) => ({
    id: prompt.id,
    title: prompt.title,
    type: prompt.type ?? "custom",
    content: prompt.content,
    targetModels: prompt.targetModels ?? [],
    templateDefaults: Object.fromEntries(
      (prompt.template?.variables ?? []).map((variable) => [
        variable.name,
        variable.defaultValue ?? "",
      ]),
    ),
  }));

  const [notifications, unreadNotificationCount, collections] = await Promise.all([
    listNotifications(profile.id, 20),
    getUnreadNotificationCount(profile.id),
    listCollectionsForUser(profile.id),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collections={collections.map((collection) => ({
          id: collection.id,
          name: collection.name,
          promptCount: collection.promptCount,
        }))}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header
          userName={profile.name ?? profile.email}
          role={profile.role}
          commandPrompts={commandPrompts}
          notifications={notifications}
          unreadNotificationCount={unreadNotificationCount}
          collections={collections.map((collection) => ({
            id: collection.id,
            name: collection.name,
            promptCount: collection.promptCount,
          }))}
        />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
