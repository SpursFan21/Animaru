//src\app\admins\_components\AdminGuard.tsx

"use client";

import type { ReactNode } from "react"; 
import { useRequireAdmin } from "../../../hooks/useRequireAdmin";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const ready = useRequireAdmin();

  if (!ready) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="rounded-xl border border-blue-800 bg-blue-900/40 px-6 py-4 text-slate-300 shadow">
          Checking admin access…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
