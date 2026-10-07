"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PAGES_TAG } from "@/lib/pages";
import { PAGE_META, isPageKey, validatePage } from "@/lib/pages-shared";
import { type FormState, str } from "./shared";

export async function savePage(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const key = str(fd, "key", 20);
  if (!isPageKey(key)) return { error: "Невідома сторінка." };
  let input: unknown;
  try {
    input = JSON.parse(str(fd, "payload", 200000));
  } catch {
    return { error: "Некоректні дані форми." };
  }
  const result = validatePage(key, input);
  if ("error" in result) return { error: result.error };

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("site_pages")
    .upsert({ key, content: result.page, updated_by: staff.userId }, { onConflict: "key" });
  if (error) return { error: `Не вдалося зберегти: ${error.message}` };
  await supabase.from("audit_log").insert({ actor: staff.userId, entity: "page", entity_id: key, action: "update", diff: result.page });
  updateTag(PAGES_TAG);
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${key}`);
  return { ok: `Збережено. Сторінка «${PAGE_META[key].label}» оновиться на сайті протягом хвилини.` };
}

/** Drops the stored copy so the page shows its built-in content again. */
export async function resetPage(key: string): Promise<void> {
  const staff = await requireStaff();
  if (!isPageKey(key)) throw new Error("Невідома сторінка.");
  const supabase = await createSessionClient();
  const { error } = await supabase.from("site_pages").delete().eq("key", key);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ actor: staff.userId, entity: "page", entity_id: key, action: "reset", diff: {} });
  updateTag(PAGES_TAG);
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${key}`);
}
