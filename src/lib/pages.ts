import "server-only";
import { cache } from "react";
import { DEFAULT_PAGES, mergePage, type PageKey, type SitePage } from "@/lib/pages-shared";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";

export const PAGES_TAG = "pages";

/** All stored pages in one request (they are small); never throws. */
const getStoredPages = cache(async (): Promise<Map<string, unknown>> => {
  if (!supabaseConfigured()) return new Map();
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/site_pages?select=key,content`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
      next: { tags: [PAGES_TAG], revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = (await response.json()) as { key: string; content: unknown }[];
    return new Map(rows.map((r) => [r.key, r.content]));
  } catch (error) {
    console.error("[pages] using built-in content:", error);
    return new Map();
  }
});

/** Page content from /admin/pages, or the built-in one. */
export async function getSitePage(key: PageKey): Promise<SitePage> {
  const stored = (await getStoredPages()).get(key);
  return stored ? mergePage(key, stored) : DEFAULT_PAGES[key];
}
