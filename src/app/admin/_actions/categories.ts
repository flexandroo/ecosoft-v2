"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import { CATEGORIES_TAG } from "@/lib/categories";
import { createSessionClient } from "@/lib/supabase/server";
import { type FormState, str } from "./shared";

const CATEGORY_GROUP_IDS = ["drinking", "household", "consumables", "business"] as const;

export async function saveCategory(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const key = str(fd, "key", 64);
  const title = str(fd, "title", 120);
  if (!title) return { error: "Вкажіть назву." };
  const group = str(fd, "group_key", 20);
  const changes = {
    title,
    short_title: str(fd, "short_title", 40),
    subtitle: str(fd, "subtitle", 300),
    seo_title: str(fd, "seo_title", 120),
    meta_description: str(fd, "meta_description", 300),
    seo_text: str(fd, "seo_text", 8000),
    image: str(fd, "image", 1000) || null,
    group_key: (CATEGORY_GROUP_IDS as readonly string[]).includes(group) ? group : "drinking",
    is_hidden: fd.get("is_hidden") === "on",
  };
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("categories").update(changes).eq("key", key).select("key").maybeSingle();
  if (error) return { error: `Не вдалося зберегти: ${error.message}` };
  if (!data) return { error: "Категорію не знайдено." };
  await supabase.from("audit_log").insert({ actor: staff.userId, entity: "category", entity_id: key, action: "update", diff: changes });
  updateTag(CATEGORIES_TAG);
  revalidatePath("/admin/categories");
  return { ok: "Збережено. На сайті оновиться протягом хвилини." };
}

/** Swap a category with its neighbour in the storefront order. */
export async function moveCategory(key: string, direction: "up" | "down") {
  await requireStaff();
  const supabase = await createSessionClient();
  const { data: rows, error } = await supabase.from("categories").select("key, sort").order("sort");
  if (error || !rows) throw new Error(error?.message ?? "Не вдалося завантажити категорії.");
  const i = rows.findIndex((r) => r.key === key);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;
  // Re-number everything (in one statement) so equal sort values can never block a move.
  const ordered = [...rows];
  [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  const { error: reorderError } = await supabase.rpc("reorder_categories", { keys: ordered.map((r) => r.key) });
  if (reorderError) throw new Error(reorderError.message);
  updateTag(CATEGORIES_TAG);
  revalidatePath("/admin/categories");
}

export async function setCategoryHidden(key: string, hidden: boolean) {
  await requireStaff();
  const supabase = await createSessionClient();
  const { error } = await supabase.from("categories").update({ is_hidden: hidden }).eq("key", key);
  if (error) throw new Error(error.message);
  updateTag(CATEGORIES_TAG);
  revalidatePath("/admin/categories");
}
