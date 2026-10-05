import "server-only";
import { cache } from "react";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";

export const COLLECTIONS_TAG = "collections";

export type StoreCollection = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  linkHref: string;
  linkLabel: string;
  showOnHome: boolean;
  /** Product slugs in the manager's order. */
  productSlugs: string[];
};

type Row = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  link_href: string;
  link_label: string;
  show_on_home: boolean;
  collection_items: { sort: number; products: { slug: string } | null }[];
};

/**
 * Collections in admin order, or null when the database is not configured or
 * unreachable (callers then use their built-in fallback).
 */
export const getCollections = cache(async (): Promise<StoreCollection[] | null> => {
  if (!supabaseConfigured()) return null;
  try {
    const url =
      `${SUPABASE_URL}/rest/v1/collections` +
      "?select=id,slug,title,eyebrow,link_href,link_label,show_on_home,collection_items(sort,products(slug))" +
      "&order=sort.asc&collection_items.order=sort.asc";
    const response = await fetch(url, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
      next: { tags: [COLLECTIONS_TAG], revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = (await response.json()) as Row[];
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      eyebrow: r.eyebrow,
      linkHref: r.link_href,
      linkLabel: r.link_label,
      showOnHome: r.show_on_home,
      productSlugs: r.collection_items.map((i) => i.products?.slug).filter((s): s is string => Boolean(s)),
    }));
  } catch (error) {
    console.error("[collections] unavailable:", error);
    return null;
  }
});
