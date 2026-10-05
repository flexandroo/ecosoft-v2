import "server-only";
import { cache } from "react";
import { DEFAULT_MENUS, mergeMenus, type SiteMenus } from "@/lib/menus-shared";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";

export const MENUS_TAG = "menus";

/** Header and footer menus from /admin/menu over the built-in ones; never throws. */
export const getSiteMenus = cache(async (): Promise<SiteMenus> => {
  if (!supabaseConfigured()) return DEFAULT_MENUS;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/site_menus?select=key,items`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
      next: { tags: [MENUS_TAG], revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = (await response.json()) as { key: string; items: unknown }[];
    return mergeMenus(Object.fromEntries(rows.map((r) => [r.key, r.items])));
  } catch (error) {
    console.error("[menus] using defaults:", error);
    return DEFAULT_MENUS;
  }
});
