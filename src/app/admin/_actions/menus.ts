"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import { MENUS_TAG } from "@/lib/menus";
import { validateMenus } from "@/lib/menus-shared";
import { createSessionClient } from "@/lib/supabase/server";
import { type FormState, str } from "./shared";

export async function saveMenus(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  let input: unknown;
  try {
    input = JSON.parse(str(fd, "payload", 40000));
  } catch {
    return { error: "Некоректні дані форми." };
  }
  const result = validateMenus(input);
  if ("error" in result) return { error: result.error };

  const rows = [
    { key: "header", items: result.menus.header, updated_by: staff.userId },
    { key: "footer", items: result.menus.footer, updated_by: staff.userId },
  ];
  const supabase = await createSessionClient();
  const { error } = await supabase.from("site_menus").upsert(rows, { onConflict: "key" });
  if (error) return { error: `Не вдалося зберегти: ${error.message}` };
  await supabase.from("audit_log").insert({
    actor: staff.userId,
    entity: "menus",
    entity_id: "site",
    action: "update",
    diff: result.menus,
  });

  updateTag(MENUS_TAG);
  revalidatePath("/admin/menu");
  return { ok: "Збережено. На сайті оновиться протягом хвилини." };
}
