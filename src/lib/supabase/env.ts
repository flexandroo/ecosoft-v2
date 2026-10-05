// Supabase connection settings. Every value is optional: without them the site
// keeps running on the bundled catalogue (src/lib/products.ts) and forms only
// notify Telegram, exactly as before the database existed.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "") ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export function supabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}
