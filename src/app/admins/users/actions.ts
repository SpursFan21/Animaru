//Animaru\src\app\admins\users\actions.ts

"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function sbAdmin() {
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });
}

export type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string;
  banned: boolean;
  profile: {
    username: string | null;
    avatar_url: string | null;
    created_at: string | null;
    updated_at: string | null;
  } | null;
};

/** List users (first 200) with profile info and banned flag in user_metadata */
export async function listUsersAction(): Promise<AdminUserRow[]> {
  const supabase = sbAdmin();

  // 1) auth users
  const ures = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const users = ures.data?.users ?? [];

  // 2) profiles for those ids
  const ids = users.map((u) => u.id);
  let profilesById: Record<string, any> = {};
  if (ids.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, created_at, updated_at")
      .in("id", ids);
    for (const p of profiles ?? []) profilesById[p.id] = p;
  }

  // 3) merge
  const rows: AdminUserRow[] = users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    created_at: u.created_at,
    banned: !!(u.user_metadata as any)?.banned,
    profile: profilesById[u.id] ?? null,
  }));

  return rows;
}

/** Ban / Unban a user by toggling user_metadata.banned */
export async function toggleBanUserAction(userId: string, banned: boolean) {
  const supabase = sbAdmin();
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { banned },
  });
  revalidatePath("/admins/users");
  return { ok: true };
}

/** Generate password reset link for a user (copiable in UI) */
export async function resetPasswordAction(userId: string) {
  const supabase = sbAdmin();

  // Get the user by ID (correct API)
  const { data: got, error: getErr } = await supabase.auth.admin.getUserById(userId);
  if (getErr) return { ok: false, error: getErr.message };
  const user = got?.user;
  if (!user?.email) return { ok: false, error: "Email not found for user." };

  // Generate recovery link for that email
  const gen = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: user.email,
  });

  const link =
    (gen as any)?.data?.action_link ??
    (gen as any)?.data?.properties?.action_link ??
    null;

  if (!link) {
    return { ok: false, error: gen.error?.message ?? "Could not generate reset link." };
  }

  return { ok: true, link };
}


/** Get a single profile (for Profile modal) */
export async function getProfileAction(userId: string) {
  const supabase = sbAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  return { ok: true, profile: data };
}

/** Update profile basic fields */
export async function updateProfileAction(_prev: any, form: FormData) {
  const supabase = sbAdmin();
  const id = form.get("id") as string;
  const username = (form.get("username") as string) || null;
  const avatar_url = (form.get("avatar_url") as string) || null;

  if (!id) return { ok: false, error: "Missing id" };

  const { error } = await supabase
    .from("profiles")
    .update({ username, avatar_url, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admins/users");
  return { ok: true };
}
