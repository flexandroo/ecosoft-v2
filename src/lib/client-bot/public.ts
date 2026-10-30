// Storefront side of the customer bot: link to the bot and the list of filter
// models that have a replacement schedule (public data, cached).
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";

export const CLIENT_BOT_USERNAME = "sofiivkawater_service_bot";
export const CLIENT_BOT_URL = `https://t.me/${CLIENT_BOT_USERNAME}`;

/** Deep link that opens the bot with this filter model preselected. */
export function botStartLink(sku: string): string {
  const payload = `f_${sku.replace(/\//g, "_")}`.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  return `${CLIENT_BOT_URL}?start=${payload}`;
}

/** SKUs of filter models customers can add in the bot. Empty set on any error. */
export async function botPlanSkus(): Promise<Set<string>> {
  if (!supabaseConfigured()) return new Set();
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/bot_service_items?select=product:products!bot_service_items_product_id_fkey(sku)`,
      {
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
        next: { tags: ["bot-plans"], revalidate: 3600 },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) return new Set();
    const rows = (await response.json()) as { product: { sku: string } | null }[];
    return new Set(rows.map((r) => r.product?.sku).filter((s): s is string => Boolean(s)));
  } catch {
    return new Set();
  }
}
