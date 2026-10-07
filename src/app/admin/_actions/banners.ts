"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import { BANNER_PLACEMENTS } from "@/lib/admin/constants";
import { BANNERS_TAG } from "@/lib/banners";
import { createSessionClient } from "@/lib/supabase/server";
import { type FormState, str, optionalDate, oneOf } from "./shared";

export async function saveBanner(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const supabase = await createSessionClient();
  const id = str(fd, "id", 64);
  const title = str(fd, "title", 200);
  if (!title) return { error: "Вкажіть заголовок." };
  const href = str(fd, "href", 500) || "/";
  if (!href.startsWith("/") && !/^https:\/\//.test(href)) {
    return { error: "Посилання має починатися з / або https://" };
  }

  const record = {
    placement: oneOf(BANNER_PLACEMENTS, str(fd, "placement", 20), "hero"),
    eyebrow: str(fd, "eyebrow", 120),
    title,
    subtitle: str(fd, "subtitle", 300),
    cta_label: str(fd, "cta_label", 60),
    href,
    image_desktop: str(fd, "image_desktop", 1000) || null,
    image_mobile: str(fd, "image_mobile", 1000) || null,
    theme: str(fd, "theme", 10) === "light" ? "light" : "dark",
    sort: Math.trunc(Number(str(fd, "sort", 12)) || 0),
    is_active: fd.get("is_active") === "on",
    starts_at: optionalDate(fd, "starts_at"),
    ends_at: optionalDate(fd, "ends_at"),
  };

  const query = id
    ? supabase.from("banners").update(record).eq("id", id).select("id").single()
    : supabase.from("banners").insert(record).select("id").single();
  const { data, error } = await query;
  if (error || !data) return { error: `Не вдалося зберегти: ${error?.message ?? "невідома помилка"}` };

  await supabase.from("audit_log").insert({
    actor: staff.userId,
    entity: "banner",
    entity_id: data.id,
    action: id ? "update" : "create",
    diff: record,
  });
  updateTag(BANNERS_TAG);
  revalidatePath("/admin/banners");
  if (!id) redirect(`/admin/banners/${data.id}?created=1`);
  return { ok: "Збережено" };
}

export async function deleteBanner(fd: FormData) {
  const staff = await requireStaff();
  const id = str(fd, "id", 64);
  const supabase = await createSessionClient();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase
    .from("audit_log")
    .insert({ actor: staff.userId, entity: "banner", entity_id: id, action: "delete", diff: {} });
  updateTag(BANNERS_TAG);
  revalidatePath("/admin/banners");
  redirect("/admin/banners");
}
