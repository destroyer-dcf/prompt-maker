import Link from "next/link";

import {
  getNotificationsPaginated,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/actions/notifications";

function describe(type: "clone" | "favorite_public", actor: string, prompt: string) {
  if (type === "clone") return `${actor} clonó ${prompt}`;
  return `${actor} marcó favorito ${prompt}`;
}

function buildHref(status: "all" | "unread", page: number) {
  const params = new URLSearchParams({ status, page: String(page) });
  return `/notifications?${params.toString()}`;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = params.status === "unread" ? "unread" : "all";
  const pageRaw = Number(params.page ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const feed = await getNotificationsPaginated(status, page, 15);

  async function markAll() {
    "use server";
    const result = await markAllNotificationsAsRead();
    if (!result.ok) throw new Error(result.error);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notificaciones</h1>
          <p className="text-sm text-[--ink-soft]">
            Total: {feed.total} · No leídas: {feed.unreadCount}
          </p>
        </div>

        <form action={markAll}>
          <button
            className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-[--panel-soft]"
            type="submit"
          >
            Marcar todas como leídas
          </button>
        </form>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={buildHref("all", 1)}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            status === "all" ? "bg-[--brand-soft] text-[--brand]" : ""
          }`}
        >
          Todas
        </Link>
        <Link
          href={buildHref("unread", 1)}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            status === "unread" ? "bg-[--brand-soft] text-[--brand]" : ""
          }`}
        >
          No leídas
        </Link>
      </div>

      <div className="space-y-3">
        {feed.items.map((notification) => {
          const actor = notification.actorName ?? "Alguien";
          const prompt = notification.promptTitle ?? "un prompt";

          async function markOne() {
            "use server";
            const result = await markNotificationAsRead(notification.id);
            if (!result.ok) throw new Error(result.error);
          }

          return (
            <article
              key={notification.id}
              className={`rounded-2xl border p-4 ${
                notification.read ? "bg-[--panel]" : "bg-[--panel-soft]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {describe(notification.type, actor, prompt)}
                  </p>
                  <p className="mt-1 text-xs text-[--ink-soft]">
                    {new Date(notification.createdAt).toLocaleString("es-ES")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {notification.promptId ? (
                    <Link
                      href={`/prompts/${notification.promptId}`}
                      className="rounded-lg border px-2 py-1 text-xs font-medium"
                    >
                      Ver prompt
                    </Link>
                  ) : null}

                  {!notification.read ? (
                    <form action={markOne}>
                      <button className="rounded-lg border px-2 py-1 text-xs font-medium" type="submit">
                        Marcar leída
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}

        {feed.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-[--panel] p-8 text-center text-sm text-[--ink-soft]">
            No hay notificaciones para este filtro.
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href={buildHref(status, Math.max(1, feed.page - 1))}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            feed.page <= 1 ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Anterior
        </Link>

        <p className="text-sm text-[--ink-soft]">
          Página {feed.page} de {feed.totalPages}
        </p>

        <Link
          href={buildHref(status, Math.min(feed.totalPages, feed.page + 1))}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            feed.page >= feed.totalPages ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Siguiente
        </Link>
      </div>
    </section>
  );
}
