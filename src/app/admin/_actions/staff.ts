"use server";

import { revalidatePath } from "next/cache";
import type { Staff } from "@/lib/admin/auth";
import { createServiceClient, createSessionClient } from "@/lib/supabase/server";
import { type FormState, str, requireAdmin } from "./shared";

export async function addStaff(_prev: FormState, fd: FormData): Promise<FormState> {
  let me: Staff;
  try {
    me = await requireAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }
  const email = str(fd, "email", 254).toLowerCase();
  const name = str(fd, "name", 100);
  const password = str(fd, "password", 200);
  const role = str(fd, "role", 20) === "admin" ? "admin" : "manager";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Некоректний email." };
  if (password.length < 10) return { error: "Пароль має містити щонайменше 10 символів." };

  const service = createServiceClient();
  if (!service) return { error: "На сервері не задано SUPABASE_SECRET_KEY." };

  let userId: string | undefined;
  let existingAccount = false;
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.data.user) {
    userId = created.data.user.id;
  } else if (/already|registered|exists/i.test(created.error?.message ?? "")) {
    // Existing account (e.g. re-adding a former employee): look it up and grant access again.
    existingAccount = true;
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data } = await service.auth.admin.listUsers({ page, perPage: 200 });
      userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (data.users.length < 200) break;
    }
  }
  if (!userId) return { error: `Не вдалося створити акаунт: ${created.error?.message ?? "невідома помилка"}` };
  if (userId === me.userId) return { error: "Це ваш власний акаунт — змінити свою роль тут не можна." };

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("admin_users")
    .upsert({ user_id: userId, email, name: name || email, role }, { onConflict: "user_id" });
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    actor: me.userId,
    entity: "staff",
    entity_id: userId,
    action: existingAccount ? "grant" : "create",
    diff: { email, role },
  });
  revalidatePath("/admin/staff");
  return {
    ok: existingAccount
      ? `Доступ надано ${email}. Акаунт уже існував, тому пароль не змінено — працівник входить зі своїм старим паролем.`
      : `Додано ${email}. Передайте працівнику пароль особисто.`,
  };
}

export async function updateStaffRole(fd: FormData) {
  const me = await requireAdmin();
  const userId = str(fd, "user_id", 64);
  const role = str(fd, "role", 20) === "admin" ? "admin" : "manager";
  if (userId === me.userId && role !== "admin") throw new Error("Не можна зняти права адміністратора з себе.");
  const supabase = await createSessionClient();
  const { error } = await supabase.from("admin_users").update({ role }).eq("user_id", userId);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ actor: me.userId, entity: "staff", entity_id: userId, action: "role", diff: { role } });
  revalidatePath("/admin/staff");
}

export async function removeStaff(fd: FormData) {
  const me = await requireAdmin();
  const userId = str(fd, "user_id", 64);
  if (userId === me.userId) throw new Error("Не можна видалити себе.");
  const supabase = await createSessionClient();
  const { error } = await supabase.from("admin_users").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ actor: me.userId, entity: "staff", entity_id: userId, action: "revoke", diff: {} });
  // Without an admin_users row every admin page and RLS policy denies access,
  // even if the person still has a valid session.
  revalidatePath("/admin/staff");
}
