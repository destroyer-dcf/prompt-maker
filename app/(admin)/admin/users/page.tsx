import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { UserTable } from "@/components/admin/UserTable";
import { listUsers } from "@/actions/admin";

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold">Usuarios</h1>
      <InviteUserForm />
      <UserTable users={users} />
    </section>
  );
}
