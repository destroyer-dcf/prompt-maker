import Link from "next/link";

import type { NotificationFeedItem } from "@/lib/db/queries/notifications";

type NotificationPanelProps = {
  panelId: string;
  notifications: NotificationFeedItem[];
  pending: boolean;
  unreadCount: number;
  onMarkAll: () => void;
  onMarkOne: (id: string) => void;
  onClose: () => void;
};

function describe(notification: NotificationFeedItem) {
  const actor = notification.actorName ?? "Alguien";
  const prompt = notification.promptTitle ?? "un prompt";

  if (notification.type === "clone") {
    return `${actor} clonó ${prompt}`;
  }

  return `${actor} marcó favorito ${prompt}`;
}

export function NotificationPanel({
  panelId,
  notifications,
  pending,
  unreadCount,
  onMarkAll,
  onMarkOne,
  onClose,
}: NotificationPanelProps) {
  return (
    <div
      id={panelId}
      role="dialog"
      aria-label="Panel de notificaciones"
      className="absolute right-0 z-40 mt-2 w-[360px] rounded-2xl border bg-[--panel] p-3 shadow-xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Notificaciones</p>
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            onClick={onClose}
            className="rounded-lg border px-2 py-1 text-xs font-medium"
          >
            Ver todas
          </Link>
          <button
            type="button"
            onClick={onMarkAll}
            disabled={pending || unreadCount === 0}
            className="rounded-lg border px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            Marcar todas
          </button>
        </div>
      </div>

      <div className="max-h-80 space-y-2 overflow-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`rounded-xl border p-3 text-sm ${
              notification.read ? "opacity-70" : "bg-[--panel-soft]"
            }`}
          >
            <p className="text-sm">{describe(notification)}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs text-[--ink-soft]">
                {new Date(notification.createdAt).toLocaleString("es-ES")}
              </span>

              <div className="flex items-center gap-2">
                {notification.promptId ? (
                  <Link
                    href={`/prompts/${notification.promptId}`}
                    onClick={() => {
                      onMarkOne(notification.id);
                      onClose();
                    }}
                    className="rounded-lg border px-2 py-1 text-xs font-medium"
                  >
                    Ver
                  </Link>
                ) : null}

                {!notification.read ? (
                  <button
                    type="button"
                    onClick={() => onMarkOne(notification.id)}
                    className="rounded-lg border px-2 py-1 text-xs font-medium"
                  >
                    Leída
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}

        {notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-[--ink-soft]">
            No tienes notificaciones.
          </div>
        ) : null}
      </div>
    </div>
  );
}
