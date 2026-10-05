import "server-only";
import { cache } from "react";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS, mergeSettings, type SiteSettings } from "@/lib/settings-shared";

export const SETTINGS_TAG = "settings";

/** Keys stored in public.site_settings that the storefront may read. */
export const PUBLIC_SETTING_KEYS = ["phones", "email", "address", "hours", "socials", "legal"] as const;

/** Public settings merged over defaults; never throws. */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!supabaseConfigured()) return DEFAULT_SETTINGS;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?select=key,value&is_public=eq.true`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
      next: { tags: [SETTINGS_TAG], revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = (await response.json()) as { key: string; value: unknown }[];
    return mergeSettings(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  } catch (error) {
    console.error("[settings] using defaults:", error);
    return DEFAULT_SETTINGS;
  }
});

export type NotificationSettings = { telegramExtraChatIds: string[] };

/** Private notification settings (server only, read with the secret key, uncached). */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const db = createServiceClient();
  if (!db) return { telegramExtraChatIds: [] };
  const { data } = await db.from("site_settings").select("value").eq("key", "notifications").maybeSingle();
  const value = (data?.value ?? {}) as { telegramExtraChatIds?: unknown };
  const ids = Array.isArray(value.telegramExtraChatIds)
    ? value.telegramExtraChatIds.filter((id): id is string => typeof id === "string" && /^-?\d{3,20}$/.test(id))
    : [];
  return { telegramExtraChatIds: ids };
}
