//src\app\admins\layout.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export default async function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  // Read-only cookie access is enough here
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // no set/remove here — this is a read-only guard
      },
    }
  );

  // 1) Require a signed-in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2) Require admin row
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) redirect("/");

  // 3) Render secured area
  return (
    <section className="min-h-[70vh] max-w-7xl mx-auto px-4 py-6">
      {children}
    </section>
  );
}
