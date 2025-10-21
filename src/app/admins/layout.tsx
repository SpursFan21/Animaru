//src\app\admins\layout.tsx

// delegate auth to client guard so every nested page is protected once.

import AdminGuard from "./_components/AdminGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-[70vh] max-w-7xl mx-auto px-4 py-6">
      <AdminGuard>{children}</AdminGuard>
    </section>
  );
}
