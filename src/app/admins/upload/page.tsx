//src\app\admins\upload\page.tsx

import AdminShell from "../_components/AdminShell";
import UploadAnimeForm from "./UploadAnimeForm"; // client component

export const metadata = { title: "Upload Anime | Admin" };

export default function Page() {
  return (
    <AdminShell title="Upload Anime" subtitle="Create entries, ingest to Mux, attach covers/banners.">
      <UploadAnimeForm />
    </AdminShell>
  );
}
