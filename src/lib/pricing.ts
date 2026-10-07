import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Prices are kept in USD (the Ecosoft price list) and shown in UAH at the NBU
 * rate. The database refreshes the rate twice a day (pg_cron →
 * private.refresh_usd_rate) and a trigger keeps products.price = round(USD × rate).
 */
export type UsdRate = { rate: number; date: string; updatedAt: string };

export async function getUsdRate(supabase: SupabaseClient<Database>): Promise<UsdRate | null> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", "usd_rate").maybeSingle();
  const value = (data?.value ?? null) as { rate?: unknown; date?: unknown; updated_at?: unknown } | null;
  const rate = Number(value?.rate);
  if (!value || !Number.isFinite(rate) || rate <= 0) return null;
  return { rate, date: String(value.date ?? ""), updatedAt: String(value.updated_at ?? "") };
}

/** UAH price for a USD base, rounded to whole hryvnias as the database does. */
export function usdToUah(usd: number, rate: number): number {
  return Math.round(usd * rate);
}
