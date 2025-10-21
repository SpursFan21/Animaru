//src\app\admins\storage\page.tsx

import AdminShell from "../_components/AdminShell";

export const metadata = { title: "Storage | Admin" };

export default function Page() {
  return (
    <AdminShell
      title="Storage"
      subtitle="Manage Supabase buckets: covers, banners, subtitles."
    />
  );
}
