//src\app\admins\users\page.tsx

import AdminHeader from "../_components/AdminShell";

export default function UsersPage() {
  return (
    <main>
      <AdminHeader title="Manage Users" subtitle="Promote, ban, reset passwords (coming soon)" />
      <div className="rounded-xl border border-blue-800 bg-blue-900/40 p-4">
        <p className="text-slate-300">Placeholder screen. Build user table & actions here.</p>
      </div>
    </main>
  );
}
