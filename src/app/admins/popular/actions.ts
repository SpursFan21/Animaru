//Animaru\src\app\admins\popular\actions.ts

"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function sbAdmin() {
  return createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
}

export type PopularItem = {
  id: string;
  order_pos: number;
  anime: {
    id: string;
    slug: string | null;
    title: string;
    cover_path: string | null;
    season: string | null;
    year: number | null;
  } | null;
};

export async function loadPopularData() {
  const supabase = sbAdmin();

  // current rotation (join to anime)
  const { data: rotationRows, error: rotErr } = await supabase
    .from("popular_rotation")
    .select("id, order_pos, anime:anime_id(id, slug, title, cover_path, season, year)")
    .order("order_pos", { ascending: true })
    .returns<PopularItem[]>();

  if (rotErr) throw rotErr;

  // candidates: anime that have a cover
  const { data: candidates, error: candErr } = await supabase
    .from("anime")
    .select("id, slug, title, cover_path, season, year")
    .not("cover_path", "is", null)
    .order("title", { ascending: true });

  if (candErr) throw candErr;

  return { rotation: rotationRows ?? [], candidates: candidates ?? [] };
}

export async function addPopularAction(animeId: string) {
  const supabase = sbAdmin();

  // find the first free slot 1..10
  const { data: current } = await supabase
    .from("popular_rotation")
    .select("order_pos")
    .order("order_pos", { ascending: true });

  const used = new Set((current ?? []).map((r: any) => Number(r.order_pos)));
  const free = Array.from({ length: 10 }, (_, i) => i + 1).find((n) => !used.has(n));
  if (!free) return { ok: false, error: "All 10 slots are filled." };

  const { error } = await supabase.from("popular_rotation").insert({
    anime_id: animeId,
    order_pos: free,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admins/popular");
  revalidatePath("/"); // homepage rail
  return { ok: true };
}

export async function removePopularAction(rowId: string) {
  const supabase = sbAdmin();
  const { error } = await supabase.from("popular_rotation").delete().eq("id", rowId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admins/popular");
  revalidatePath("/");
  return { ok: true };
}

export async function setPopularOrderAction(rowId: string, orderPos: number) {
  const supabase = sbAdmin();
  // Move into the spot; thanks to unique(order_pos) this will error on conflicts
  const { error } = await supabase
    .from("popular_rotation")
    .update({ order_pos: orderPos })
    .eq("id", rowId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admins/popular");
  revalidatePath("/");
  return { ok: true };
}
