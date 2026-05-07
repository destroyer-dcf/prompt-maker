import { and, count, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { notifications, profiles, prompts } from "@/lib/db/schema";

export type NotificationFeedItem = {
  id: string;
  type: "clone" | "favorite_public";
  read: boolean;
  createdAt: string;
  promptId: string | null;
  promptTitle: string | null;
  actorId: string | null;
  actorName: string | null;
};

export type NotificationStatusFilter = "all" | "unread";

export type NotificationPageResult = {
  items: NotificationFeedItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  unreadCount: number;
};

function toFeedItems(
  rows: Array<
    typeof notifications.$inferSelect
  >,
  actorMap: Map<string, string>,
  promptMap: Map<string, string>,
): NotificationFeedItem[] {
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
    promptId: row.promptId,
    promptTitle: row.promptId ? (promptMap.get(row.promptId) ?? null) : null,
    actorId: row.actorId,
    actorName: row.actorId ? (actorMap.get(row.actorId) ?? null) : null,
  }));
}

async function hydrateFeedItems(
  rows: Array<typeof notifications.$inferSelect>,
): Promise<NotificationFeedItem[]> {
  if (rows.length === 0) return [];

  const db = getDb();
  const actorIds = [...new Set(rows.map((row) => row.actorId).filter(Boolean) as string[])];
  const promptIds = [...new Set(rows.map((row) => row.promptId).filter(Boolean) as string[])];

  const [actors, promptRows] = await Promise.all([
    actorIds.length > 0
      ? db.query.profiles.findMany({
          where: inArray(profiles.id, actorIds),
          columns: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
    promptIds.length > 0
      ? db.query.prompts.findMany({
          where: inArray(prompts.id, promptIds),
          columns: { id: true, title: true },
        })
      : Promise.resolve([]),
  ]);

  const actorMap = new Map(actors.map((actor) => [actor.id, actor.name || actor.email]));
  const promptMap = new Map(promptRows.map((prompt) => [prompt.id, prompt.title]));

  return toFeedItems(rows, actorMap, promptMap);
}

export async function getUnreadNotificationCount(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({ total: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

  return row?.total ?? 0;
}

export async function listNotifications(userId: string, limit = 20): Promise<NotificationFeedItem[]> {
  const db = getDb();

  const rows = await db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: [desc(notifications.createdAt)],
    limit: Math.min(limit, 100),
  });

  return hydrateFeedItems(rows);
}

export async function getNotificationsPage(
  userId: string,
  params?: {
    page?: number;
    pageSize?: number;
    status?: NotificationStatusFilter;
  },
): Promise<NotificationPageResult> {
  const db = getDb();

  const pageSize = Math.min(Math.max(params?.pageSize ?? 15, 1), 50);
  const page = Math.max(params?.page ?? 1, 1);
  const status = params?.status ?? "all";
  const where =
    status === "unread"
      ? and(eq(notifications.userId, userId), eq(notifications.read, false))
      : eq(notifications.userId, userId);

  const [totalRow, unreadCount, rows] = await Promise.all([
    db
      .select({ total: count() })
      .from(notifications)
      .where(where)
      .then((result) => result[0]?.total ?? 0),
    getUnreadNotificationCount(userId),
    db.query.notifications.findMany({
      where,
      orderBy: [desc(notifications.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalRow / pageSize));
  const safePage = Math.min(page, totalPages);

  const items =
    safePage === page
      ? await hydrateFeedItems(rows)
      : await db.query.notifications
          .findMany({
            where,
            orderBy: [desc(notifications.createdAt)],
            limit: pageSize,
            offset: (safePage - 1) * pageSize,
          })
          .then(hydrateFeedItems);

  return {
    items,
    total: totalRow,
    page: safePage,
    pageSize,
    totalPages,
    unreadCount,
  };
}
