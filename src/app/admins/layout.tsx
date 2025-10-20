//src\app\admins\layout.tsx

// src/app/admins/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // keep layout dumb; auth handled in the page (client)
  return <section className="min-h-[70vh] max-w-5xl mx-auto p-6">{children}</section>;
}
