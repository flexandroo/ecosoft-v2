import "server-only";
import { cache } from "react";
import { BLOG_POSTS } from "@/lib/blog";
import type { Post, PostKind } from "@/lib/posts-shared";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";

export const POSTS_TAG = "posts";

type PostRow = {
  slug: string;
  kind: PostKind;
  title: string;
  excerpt: string;
  body: string;
  cover_image: string | null;
  gallery: unknown;
  location: string;
  related_href: string;
  related_label: string;
  seo_title: string;
  meta_description: string;
  published_at: string;
  updated_at: string;
};

/** The articles bundled with the site, used when the database is unavailable. */
const FALLBACK_POSTS: Post[] = BLOG_POSTS.map((p): Post => ({
  slug: p.slug,
  kind: "article",
  title: p.title,
  excerpt: p.excerpt,
  body: p.body.join("\n\n"),
  coverImage: null,
  gallery: [],
  location: "",
  relatedHref: p.relatedHref,
  relatedLabel: p.relatedLabel,
  seoTitle: "",
  metaDescription: "",
  publishedAt: p.date,
  updatedAt: p.date,
})).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

/** Published posts, newest first (drafts and scheduled posts are hidden by RLS); never throws. */
export const getPosts = cache(async (): Promise<Post[]> => {
  if (!supabaseConfigured()) return FALLBACK_POSTS;
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?select=slug,kind,title,excerpt,body,cover_image,gallery,location,related_href,related_label,seo_title,meta_description,published_at,updated_at&order=published_at.desc`,
      {
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
        // Short revalidation so scheduled posts appear close to their publication time.
        next: { tags: [POSTS_TAG], revalidate: 300 },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = (await response.json()) as PostRow[];
    return rows.map((r) => ({
      slug: r.slug,
      kind: r.kind,
      title: r.title,
      excerpt: r.excerpt,
      body: r.body,
      coverImage: r.cover_image,
      gallery: Array.isArray(r.gallery) ? r.gallery.filter((u): u is string => typeof u === "string") : [],
      location: r.location,
      relatedHref: r.related_href,
      relatedLabel: r.related_label,
      seoTitle: r.seo_title,
      metaDescription: r.meta_description,
      publishedAt: r.published_at,
      updatedAt: r.updated_at,
    }));
  } catch (error) {
    console.error("[posts] using bundled articles:", error);
    return FALLBACK_POSTS;
  }
});

export async function getPost(slug: string): Promise<Post | undefined> {
  return (await getPosts()).find((p) => p.slug === slug);
}
