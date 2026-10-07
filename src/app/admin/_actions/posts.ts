"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { POSTS_TAG } from "@/lib/posts";
import { slugify } from "@/lib/posts-shared";
import { type FormState, str } from "./shared";

function postsChanged(id?: string) {
  updateTag(POSTS_TAG);
  revalidatePath("/admin/blog");
  if (id) revalidatePath(`/admin/blog/${id}`);
}

export async function createPost(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const title = str(fd, "title", 200);
  if (!title) return { error: "Вкажіть заголовок." };
  const kind = str(fd, "kind", 10) === "case" ? "case" : "article";
  const supabase = await createSessionClient();
  const base = slugify(title) || (kind === "case" ? "keis" : "stattia");
  let slug = base;
  for (let n = 2; n < 50; n++) {
    const { data: taken } = await supabase.from("posts").select("id").eq("slug", slug).maybeSingle();
    if (!taken) break;
    slug = `${base}-${n}`;
  }
  const { data, error } = await supabase
    .from("posts")
    .insert({ slug, kind, title, is_published: false, updated_by: staff.userId })
    .select("id")
    .single();
  if (error || !data) return { error: `Не вдалося створити: ${error?.message ?? ""}` };
  await supabase.from("audit_log").insert({ actor: staff.userId, entity: "post", entity_id: data.id, action: "create", diff: { slug, kind, title } });
  postsChanged();
  redirect(`/admin/blog/${data.id}`);
}

export async function savePost(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const id = str(fd, "id", 64);
  const title = str(fd, "title", 200);
  if (!title) return { error: "Вкажіть заголовок." };
  const slug = str(fd, "slug", 100).toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { error: "Адреса сторінки: лише латинські літери, цифри й дефіси, напр. filtr-dlya-budynku." };
  }
  const relatedHref = str(fd, "related_href", 300);
  if (relatedHref && !relatedHref.startsWith("/") && !relatedHref.startsWith("https://")) {
    return { error: "Посилання кнопки має починатися з / або https://" };
  }
  let gallery: string[] = [];
  try {
    const parsed = JSON.parse(str(fd, "gallery", 20000) || "[]") as unknown;
    if (Array.isArray(parsed)) gallery = parsed.filter((u): u is string => typeof u === "string" && u.startsWith("https://")).slice(0, 30);
  } catch {
    return { error: "Некоректний список фото." };
  }
  const publishedAt = new Date(str(fd, "published_at", 40));
  if (Number.isNaN(publishedAt.getTime())) return { error: "Вкажіть дату публікації." };

  const record = {
    title,
    slug,
    kind: str(fd, "kind", 10) === "case" ? "case" : "article",
    excerpt: str(fd, "excerpt", 400),
    body: str(fd, "body", 60000),
    cover_image: str(fd, "cover_image", 1000) || null,
    gallery,
    location: str(fd, "location", 120),
    related_href: relatedHref,
    related_label: str(fd, "related_label", 80),
    seo_title: str(fd, "seo_title", 120),
    meta_description: str(fd, "meta_description", 300),
    is_published: fd.get("is_published") === "on",
    published_at: publishedAt.toISOString(),
    updated_by: staff.userId,
  };
  if (record.is_published && !record.body) return { error: "Не можна опублікувати запис без тексту." };

  const supabase = await createSessionClient();
  const { data: clash } = await supabase.from("posts").select("id").eq("slug", slug).neq("id", id).maybeSingle();
  if (clash) return { error: "Така адреса сторінки вже зайнята іншим записом." };
  const { error } = await supabase.from("posts").update(record).eq("id", id);
  if (error) return { error: `Не вдалося зберегти: ${error.message}` };
  await supabase.from("audit_log").insert({ actor: staff.userId, entity: "post", entity_id: id, action: "update", diff: record });
  postsChanged(id);
  return { ok: "Збережено. На сайті оновиться протягом хвилини." };
}

export async function deletePost(id: string): Promise<void> {
  const staff = await requireStaff();
  const supabase = await createSessionClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ actor: staff.userId, entity: "post", entity_id: id, action: "delete", diff: {} });
  postsChanged();
  redirect("/admin/blog");
}
