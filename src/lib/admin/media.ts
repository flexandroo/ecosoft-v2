import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MediaUsage = { kind: "product" | "banner" | "category" | "post" | "page"; title: string; href: string };

/** Where each media URL is used (products, banners, categories, blog posts). */
export async function mediaUsage(supabase: SupabaseClient): Promise<Map<string, MediaUsage[]>> {
  const [products, banners, categories, posts, pages] = await Promise.all([
    supabase.from("products").select("id, name, image, images"),
    supabase.from("banners").select("id, title, image_desktop, image_mobile"),
    supabase.from("categories").select("key, title, image"),
    supabase.from("posts").select("id, title, cover_image, gallery"),
    supabase.from("site_pages").select("key, content"),
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
  for (const p of posts.data ?? []) {
    const entry: MediaUsage = { kind: "post", title: p.title, href: `/admin/blog/${p.id}` };
    add(p.cover_image, entry);
    for (const url of Array.isArray(p.gallery) ? (p.gallery as string[]) : []) add(url, entry);
  }
  for (const p of pages.data ?? []) {
    const content = (p.content ?? {}) as { title?: string; image?: string };
    add(content.image, { kind: "page", title: content.title ?? p.key, href: `/admin/pages/${p.key}` });
  }
  return usage;
}
