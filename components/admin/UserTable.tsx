import Link from "next/link";

import {
  changeRole,
  disableUser,
  enableUser,
  resendInvitation,
  type AdminUserListItem,
} from "@/actions/admin";
import { UserStatusBadge } from "@/components/admin/UserStatusBadge";

export function UserTable({ users }: { users: AdminUserListItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-[--panel]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[--panel-soft] text-xs uppercase tracking-wide text-[--ink-soft]">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Rol</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Invitado por</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t">
              <td className="px-4 py-3">
                <Link href={`/admin/users/${user.id}`} className="font-medium hover:underline">
                  {user.name ?? "-"}
                </Link>
              </td>
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">
                <form
                  action={async (formData) => {
                    "use server";
                    const role = String(formData.get("role") || "user") as "admin" | "user";
                    const result = await changeRole(user.id, role);
                    if (!result.ok) throw new Error(result.error);
                  }}
                >
                  <select
                    name="role"
                    defaultValue={user.role}
                    className="rounded-lg border bg-[--panel] px-2 py-1 text-xs"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  <button className="ml-2 rounded-lg border px-2 py-1 text-xs font-medium">
                    Guardar
                  </button>
                </form>
              </td>
              <td className="px-4 py-3">
                <UserStatusBadge status={user.status} />
              </td>
              <td className="px-4 py-3 text-xs text-[--ink-soft]">
                {user.invitedByName ?? "-"}
              </td>
              <td className="px-4 py-3 text-xs text-[--ink-soft]">
                {new Date(user.createdAt).toLocaleDateString("es-ES")}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-1">
                  {user.status === "disabled" ? (
                    <form
                      action={async () => {
                        "use server";
                        const result = await enableUser(user.id);
                        if (!result.ok) throw new Error(result.error);
                      }}
                      className="inline"
                    >
                      <button className="rounded-lg border px-2 py-1 text-xs font-medium">
                        Reactivar
                      </button>
                    </form>
                  ) : (
                    <form
                      action={async () => {
                        "use server";
                        const result = await disableUser(user.id);
                        if (!result.ok) throw new Error(result.error);
                      }}
                      className="inline"
                    >
                      <button className="rounded-lg border px-2 py-1 text-xs font-medium">
                        Desactivar
                      </button>
                    </form>
                  )}
                  {user.status === "pending" ? (
                    <form
                      action={async () => {
                        "use server";
                        const result = await resendInvitation(user.id);
                        if (!result.ok) throw new Error(result.error);
                      }}
                      className="inline"
                    >
                      <button className="rounded-lg border px-2 py-1 text-xs font-medium">
                        Reenviar
                      </button>
                    </form>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
