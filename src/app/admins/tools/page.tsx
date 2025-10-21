//src\app\admins\tools\page.tsx

import AdminShell from "../_components/AdminShell";

export const metadata = { title: "Admin Tools | Admin" };

export default function Page() {
  return (
    <AdminShell
      title="Admin Tools"
      subtitle="Bulk jobs, re-index, cache bust, maintenance."
    />
  );
}
