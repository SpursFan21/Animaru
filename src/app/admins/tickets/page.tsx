//src\app\admins\tickets\page.tsx

import AdminShell from "../_components/AdminShell";

export const metadata = { title: "Manage Tickets | Admin" };

export default function Page() {
  return (
    <AdminShell
      title="Manage Tickets"
      subtitle="Support queue, statuses, assignments, SLA views."
    />
  );
}
