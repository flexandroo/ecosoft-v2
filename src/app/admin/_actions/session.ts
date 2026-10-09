"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkRateLimit } from "@/lib/request-guard";
import { createSessionClient } from "@/lib/supabase/server";
import { type FormState, str } from "./shared";

export async function signIn(_prev: FormState, fd: FormData): Promise<FormState> {
  // Sign-in runs on the server, so Supabase sees every attempt from our IP:
  // throttle per visitor here, or one attacker could lock all staff out.
  const rate = checkRateLimit(await headers(), "admin-login", 10, 15 * 60 * 1000);
  if (!rate.allowed) {
    return { error: `Забагато спроб входу. Спробуйте через ${Math.ceil(rate.retryAfter / 60)} хв.` };
  }
  const email = str(fd, "email", 254);
  const password = str(fd, "password", 200);
  const next = str(fd, "next", 200);
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Невірний email або пароль." };
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
