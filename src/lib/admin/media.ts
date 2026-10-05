import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MediaUsage = { kind: "product" | "banner" | "category"; title: string; href: string };

/** Where each media URL is used (products' photos and homepage banners). */
export async function mediaUsage(supabase: SupabaseClient): Promise<Map<string, MediaUsage[]>> {
  const [products, banners, categories] = await Promise.all([
    supabase.from("products").select("id, name, image, images"),
    supabase.from("banners").select("id, title, image_desktop, image_mobile"),
    supabase.from("categories").select("key, title, image"),
  ]);
  const usage = new Map<string, MediaUsage[]>();
  const add = (url: string | null | undefined, entry: MediaUsage) => {
    if (!url) return;
    const list = usage.get(url) ?? [];
    if (!list.some((e) => e.href === entry.href)) list.push(entry);
    usage.set(url, list);
  };
  for (const p of products.data ?? []) {
    const entry: MediaUsage = { kind: "product", title: p.name, href: `/admin/products/${p.id}` };
    add(p.image, entry);
    for (const url of (p.images as string[] | null) ?? []) add(url, entry);
  }
  for (const b of banners.data ?? []) {
    const entry: MediaUsage = { kind: "banner", title: b.title, href: `/admin/banners/${b.id}` };
    add(b.image_desktop, entry);
    add(b.image_mobile, entry);
  }
  for (const c of categories.data ?? []) {
    add(c.image, { kind: "category", title: c.title, href: `/admin/categories/${c.key}` });
  }
  return usage;
}
