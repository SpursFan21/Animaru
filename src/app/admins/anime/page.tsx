//src\app\admins\anime\page.tsx

import AdminShell from "../_components/AdminShell";

export const metadata = { title: "Update Anime | Admin" };

export default function Page() {
  return (
    <AdminShell
      title="Update Anime"
      subtitle="Edit metadata, seasons, episodes, slugs, visibility."
    />
  );
}
