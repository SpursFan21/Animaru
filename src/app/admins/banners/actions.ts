//Animaru\src\app\admins\banners\actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function sbAdmin() {
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });
}

export type BannerSlotRow = {
  id: string;
  anime_id: string;
  sort_order: number;
  anime: {
    id: string;
    title: string;
    slug: string | null;
    banner_path: string | null;
    season: string | null;
    year: number | null;
  } | null;
};

export async function listBannerSlotsAction(): Promise<BannerSlotRow[]> {
  const supabase = sbAdmin();
  const { data, error } = await supabase
    .from("banner_slots")
    .select("id, anime_id, sort_order, anime:anime (id, title, slug, banner_path, season, year)")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as any;
}

export async function listEligibleAnimeAction() {
  // All anime that have a banner_path not null
  const supabase = sbAdmin();
  const { data, error } = await supabase
    .from("anime")
    .select("id, title, slug, banner_path, season, year")
    .not("banner_path", "is", null)
    .order("title", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addAnimeToSlotAction(animeId: string) {
  const supabase = sbAdmin();

  // Find the first free slot 1..5
  const { data: existing } = await supabase
    .from("banner_slots")
    .select("sort_order")
    .order("sort_order", { ascending: true });

  const used = new Set((existing ?? []).map((r: any) => r.sort_order));
  let available: number | null = null;
  for (let i = 1; i <= 5; i++) if (!used.has(i)) { available = i; break; }

  if (!available) return { ok: false, error: "All 5 banner slots are filled." };

  const { error } = await supabase.from("banner_slots").insert({
    anime_id: animeId,
    sort_order: available,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admins/banners");
  return { ok: true };
}

export async function removeSlotAction(slotId: string) {
  const supabase = sbAdmin();
  const { error } = await supabase.from("banner_slots").delete().eq("id", slotId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admins/banners");
  return { ok: true };
}

export async function setSlotOrderAction(slotId: string, order: number) {
  if (order < 1 || order > 5) return { ok: false, error: "Order must be 1–5." };
  const supabase = sbAdmin();

  // We need to ensure uniqueness by swapping/conflict handling:
  // Fetch the slot we’re moving
  const { data: currentRes, error: curErr } = await supabase
    .from("banner_slots").select("id, sort_order").eq("id", slotId).maybeSingle();
  if (curErr || !currentRes) return { ok: false, error: curErr?.message ?? "Slot not found" };

  const currentOrder = currentRes.sort_order;
  if (currentOrder === order) return { ok: true };

  // If another row already has target order, swap them
  const { data: otherRes } = await supabase
    .from("banner_slots").select("id, sort_order").eq("sort_order", order).maybeSingle();

  // Move the current slot first
  const { error: e1 } = await supabase
    .from("banner_slots").update({ sort_order: order, updated_at: new Date().toISOString() })
    .eq("id", slotId);
  if (e1) return { ok: false, error: e1.message };

  // If someone occupied the target order, put them in old spot
  if (otherRes?.id) {
    const { error: e2 } = await supabase
      .from("banner_slots").update({ sort_order: currentOrder, updated_at: new Date().toISOString() })
      .eq("id", otherRes.id);
    if (e2) return { ok: false, error: e2.message };
  }

  revalidatePath("/admins/banners");
  return { ok: true };
}
