"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Browser client for the admin (uses the staff session cookie). */
export function getBrowserClient() {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return client;
}
