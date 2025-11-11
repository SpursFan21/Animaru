//src\app\admins\users\page.tsx

import AdminShell from "../_components/AdminShell";
import { listUsersAction } from "./actions";
import ManageUsersClient from "./ManageUsersClient";

export const metadata = { title: "Manage Users | Admin" };

export default async function Page() {
  const users = await listUsersAction();

  return (
    <AdminShell
      title="Manage Users"
      subtitle="Promote, ban, reset passwords, view profiles."
    >
      <ManageUsersClient initialUsers={users} />
    </AdminShell>
  );
}
