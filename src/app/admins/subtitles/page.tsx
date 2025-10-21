//src\app\admins\subtitles\page.tsx

import AdminShell from "../_components/AdminShell";

export const metadata = { title: "Generate Subtitles | Admin" };

export default function Page() {
  return (
    <AdminShell
      title="Generate Subtitles"
      subtitle="Whisper jobs, upload/attach VTT to Mux, retry & logs."
    />
  );
}

