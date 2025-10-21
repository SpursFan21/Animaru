//src\app\admins\_components\AdminShell.tsx

// Server Component
type Props = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export default function AdminShell({ title, subtitle, children }: Props) {
  return (
    <section className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-3 text-sm text-slate-400">
        <a href="/admins" className="hover:text-sky-400">Admin</a>
        <span className="mx-2 text-slate-500">/</span>
        <span className="text-slate-300">{title}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle ? (
          <p className="text-slate-400 mt-1">{subtitle}</p>
        ) : null}
      </header>

      <div className="rounded-2xl bg-blue-900/40 border border-blue-800 p-4">
        {children ?? <p className="text-slate-400">Coming soon…</p>}
      </div>
    </section>
  );
}
