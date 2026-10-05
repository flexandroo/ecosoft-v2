import "server-only";
import { cache } from "react";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";

export const BANNERS_TAG = "banners";

export type Banner = {
  id: string;
  placement: "hero" | "side";
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  imageDesktop: string | null;
  imageMobile: string | null;
  theme: "dark" | "light";
};

type BannerRow = {
  id: string;
  placement: "hero" | "side";
  eyebrow: string;
  title: string;
  subtitle: string;
  cta_label: string;
  href: string;
  image_desktop: string | null;
  image_mobile: string | null;
  theme: "dark" | "light";
};

/**
 * Live homepage banners (active and inside their date window — enforced by RLS).
 * Returns an empty list when the database is not configured or unreachable, so
 * the homepage can render its built-in fallback content.
 */
export const getBanners = cache(async (): Promise<Banner[]> => {
  if (!supabaseConfigured()) return [];
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/banners?select=id,placement,eyebrow,title,subtitle,cta_label,href,image_desktop,image_mobile,theme&order=sort.asc,created_at.asc`,
      {
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
        // Short revalidation so scheduled banners start/stop close to their dates.
        next: { tags: [BANNERS_TAG], revalidate: 300 },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = (await response.json()) as BannerRow[];
    return rows.map((row) => ({
      id: row.id,
      placement: row.placement,
      eyebrow: row.eyebrow,
      title: row.title,
      subtitle: row.subtitle,
      ctaLabel: row.cta_label,
      href: row.href,
      imageDesktop: row.image_desktop,
      imageMobile: row.image_mobile,
      theme: row.theme,
    }));
  } catch (error) {
    console.error("[banners] unavailable:", error);
    return [];
  }
});
