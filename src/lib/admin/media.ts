import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MediaUsage = { kind: "product" | "banner" | "category" | "post" | "page"; title: string; href: string };

/** Where each media URL is used (products, banners, categories, blog posts). */
export async function mediaUsage(supabase: SupabaseClient): Promise<Map<string, MediaUsage[]>> {
  const [products, banners, categories, posts, pages] = await Promise.all([
    supabase.from("products").select("id, name, image, images"),
    supabase.from("banners").select("id, title, image_desktop, image_mobile"),
    supabase.from("categories").select("key, title, image"),
    supabase.from("posts").select("id, title, cover_image, gallery, body"),
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
    for (const url of urlsInText(p.body)) add(url, entry);
  }
  for (const p of pages.data ?? []) {
    // Page images live in the header and inside any section, so walk the whole document.
    const content = (p.content ?? {}) as { title?: string };
    const entry: MediaUsage = { kind: "page", title: content.title ?? p.key, href: `/admin/pages/${p.key}` };
    for (const value of stringsIn(p.content)) add(value, entry);
  }
  return usage;
}

/** Every string anywhere inside a JSON value. */
function stringsIn(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) stringsIn(item, out);
  else if (value && typeof value === "object") for (const item of Object.values(value)) stringsIn(item, out);
  return out;
}

/** URLs mentioned in free text, e.g. a photo link pasted into a post body. */
function urlsInText(text: unknown): string[] {
  return typeof text === "string" ? (text.match(/https?:\/\/[^\s)"'\]]+/g) ?? []) : [];
}
