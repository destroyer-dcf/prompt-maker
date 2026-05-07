"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Bell } from "lucide-react";

import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/actions/notifications";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import type { NotificationFeedItem } from "@/lib/db/queries/notifications";

type NotificationBellProps = {
  initialNotifications: NotificationFeedItem[];
  initialUnreadCount: number;
};

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState(initialNotifications);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelId = "notification-panel";

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  async function onMarkOne(id: string) {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );

    startTransition(async () => {
      await markNotificationAsRead(id);
    });
  }

  async function onMarkAll() {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );

    startTransition(async () => {
      await markAllNotificationsAsRead();
    });
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!containerRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Abrir notificaciones"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        className="relative inline-flex h-10 items-center gap-1.5 rounded-xl border bg-[--panel] px-3 text-xs font-semibold shadow-sm hover:bg-[--panel-soft]"
      >
        <Bell className="h-3.5 w-3.5" />
        Notifs
        {(unreadCount > 0 || initialUnreadCount > 0) && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[--brand] px-1 text-[10px] font-bold text-white">
            {unreadCount > 0 ? unreadCount : initialUnreadCount}
          </span>
        )}
        <span className="sr-only">
          {unreadCount} notificaciones sin leer
        </span>
      </button>

      {open ? (
        <NotificationPanel
          panelId={panelId}
          notifications={notifications}
          pending={pending}
          unreadCount={unreadCount}
          onMarkAll={onMarkAll}
          onMarkOne={onMarkOne}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
