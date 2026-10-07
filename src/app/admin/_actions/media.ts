"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { mediaUsage } from "@/lib/admin/media";

export async function updateMediaAlt(id: string, alt: string) {
  await requireStaff();
  const supabase = await createSessionClient();
  const { error } = await supabase.from("media_assets").update({ alt: alt.trim().slice(0, 300) }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/media");
}

/** Delete a library file; refuses while a product or banner still uses it. */
export async function deleteMedia(id: string): Promise<{ ok: boolean; error?: string }> {
  const staff = await requireStaff();
  const supabase = await createSessionClient();
  const { data: asset } = await supabase.from("media_assets").select("id, path, url").eq("id", id).maybeSingle();
  if (!asset) return { ok: false, error: "Файл не знайдено." };
  const usedBy = (await mediaUsage(supabase)).get(asset.url) ?? [];
  if (usedBy.length) {
    return { ok: false, error: `Фото використовується: ${usedBy.map((u) => u.title).join(", ")}. Спершу приберіть його звідти.` };
  }
  const { data: removed, error: storageError } = await supabase.storage.from("media").remove([asset.path]);
  if (storageError) return { ok: false, error: storageError.message };
  // Storage reports success even when nothing matched, so confirm the file is gone.
  if (!removed?.length) return { ok: false, error: "Файл не вдалося видалити зі сховища." };
  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabase
    .from("audit_log")
    .insert({ actor: staff.userId, entity: "media", entity_id: id, action: "delete", diff: { path: asset.path } });
  revalidatePath("/admin/media");
  return { ok: true };
}
