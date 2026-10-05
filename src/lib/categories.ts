import "server-only";
import { cache } from "react";
import { DEFAULT_CATEGORIES, mergeCategories, type CategoryRow, type StoreCategory } from "@/lib/categories-shared";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";

export const CATEGORIES_TAG = "categories";

/** All categories (including hidden ones), sorted; never throws. */
export const getStoreCategories = cache(async (): Promise<StoreCategory[]> => {
  if (!supabaseConfigured()) return DEFAULT_CATEGORIES;
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/categories?select=key,title,short_title,subtitle,seo_title,meta_description,seo_text,image,group_key,sort,is_hidden`,
      {
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
        next: { tags: [CATEGORIES_TAG], revalidate: 300 },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return mergeCategories((await response.json()) as CategoryRow[]);
  } catch (error) {
    console.error("[categories] using defaults:", error);
    return DEFAULT_CATEGORIES;
  }
});

export async function getStoreCategory(key: string): Promise<StoreCategory | undefined> {
  return (await getStoreCategories()).find((c) => c.key === key);
}
