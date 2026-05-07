"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/actions/types";
import { requireProfile } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  getNotificationsPage,
  getUnreadNotificationCount,
  listNotifications,
  type NotificationFeedItem,
  type NotificationPageResult,
  type NotificationStatusFilter,
} from "@/lib/db/queries/notifications";
import { notifications } from "@/lib/db/schema";

export async function getNotifications(limit = 20): Promise<NotificationFeedItem[]> {
  const profile = await requireProfile();
  return listNotifications(profile.id, limit);
}

export async function getUnreadCount(): Promise<number> {
  const profile = await requireProfile();
  return getUnreadNotificationCount(profile.id);
}

export async function getNotificationsPaginated(
  status: NotificationStatusFilter,
  page: number,
  pageSize = 15,
): Promise<NotificationPageResult> {
  const profile = await requireProfile();
  return getNotificationsPage(profile.id, { status, page, pageSize });
}

export async function markNotificationAsRead(notificationId: string): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, profile.id)));

    revalidatePath("/", "layout");
    revalidatePath("/notifications");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function markAllNotificationsAsRead(): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const db = getDb();

    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, profile.id), eq(notifications.read, false)));

    revalidatePath("/", "layout");
    revalidatePath("/notifications");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
