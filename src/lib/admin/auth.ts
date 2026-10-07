import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export type Staff = {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "manager";
};

/** The signed-in staff member, or null for anonymous users and non-staff accounts. */
export const getStaff = cache(async (): Promise<Staff | null> => {
  if (!supabaseConfigured()) return null;
  const supabase = await createSessionClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, email, name, role")
    .eq("user_id", user.id)
    .maybeSingle();
  // A failed lookup is not "no access": denying would sign the person out
  // (see proxy.ts). Let the admin error page offer a retry instead.
  if (error) throw new Error(`Не вдалося перевірити доступ: ${error.message}`);
  if (!data) return null;
  return { userId: data.user_id, email: data.email, name: data.name || data.email, role: data.role };
});

export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login?denied=1");
  return staff;
}
