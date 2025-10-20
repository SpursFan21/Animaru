//src\server\checkAdmin.ts
import { getSupabaseServer } from "./supabaseServer";

export default async function checkAdmin(userId: string): Promise<boolean> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return !!data && !error;
}
