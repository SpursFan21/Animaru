//src\app\admins\subtitles\page.tsx

import AdminShell from "../_components/AdminShell";
import SubtitleManager from "./SubtitleManager";

export const metadata = { title: "Generate Subtitles | Admin" };

export default function Page() {
  return (
    <AdminShell
      title="Generate Subtitles"
      subtitle="Pick a source video, then kick off subtitle generation."
    >
      <SubtitleManager />
    </AdminShell>
  );
}


