"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import { COLLECTIONS_TAG } from "@/lib/collections";
import { createSessionClient } from "@/lib/supabase/server";
import { type FormState, str } from "./shared";

function collectionSlug(title: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i", ї: "i",
    й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh",
    ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", "'": "", "ʼ": "",
  };
  const latin = [...title.toLowerCase()].map((ch) => map[ch] ?? ch).join("");
  return latin.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "collection";
}

function collectionsChanged(id?: string) {
  updateTag(COLLECTIONS_TAG);
  revalidatePath("/admin/collections");
  if (id) revalidatePath(`/admin/collections/${id}`);
}

export async function createCollection(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const title = str(fd, "title", 120);
  if (!title) return { error: "Вкажіть назву підбірки." };
  const supabase = await createSessionClient();
  const { data: last } = await supabase.from("collections").select("sort").order("sort", { ascending: false }).limit(1).maybeSingle();
  const base = collectionSlug(title);
  let slug = base;
  for (let n = 2; n < 50; n++) {
    const { data: taken } = await supabase.from("collections").select("id").eq("slug", slug).maybeSingle();
    if (!taken) break;
    slug = `${base}-${n}`;
  }
  const { data, error } = await supabase
    .from("collections")
    .insert({ slug, title, sort: (last?.sort ?? 0) + 10, show_on_home: false })
    .select("id")
    .single();
  if (error || !data) return { error: `Не вдалося створити: ${error?.message ?? ""}` };
  collectionsChanged();
  redirect(`/admin/collections/${data.id}`);
}

export async function saveCollection(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const id = str(fd, "id", 64);
  const title = str(fd, "title", 120);
  if (!title) return { error: "Вкажіть назву підбірки." };
  const linkHref = str(fd, "link_href", 500);
  if (linkHref && !linkHref.startsWith("/") && !/^https:\/\//.test(linkHref)) {
    return { error: "Посилання має починатися з / або https://" };
  }
  const changes = {
    title,
    eyebrow: str(fd, "eyebrow", 60),
    link_href: linkHref,
    link_label: str(fd, "link_label", 40),
    show_on_home: fd.get("show_on_home") === "on",
  };
  const supabase = await createSessionClient();
  const { error } = await supabase.from("collections").update(changes).eq("id", id);
  if (error) return { error: `Не вдалося зберегти: ${error.message}` };
  await supabase.from("audit_log").insert({ actor: staff.userId, entity: "collection", entity_id: id, action: "update", diff: changes });
  collectionsChanged(id);
  return { ok: "Збережено. На сайті оновиться протягом хвилини." };
}

export async function deleteCollection(fd: FormData) {
  const staff = await requireStaff();
  const id = str(fd, "id", 64);
  const supabase = await createSessionClient();
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ actor: staff.userId, entity: "collection", entity_id: id, action: "delete", diff: {} });
  collectionsChanged();
  redirect("/admin/collections");
}

async function renumber(table: "collections" | "collection_items", rows: { sort: number; match: Record<string, string> }[]) {
  const supabase = await createSessionClient();
  for (const [index, row] of rows.entries()) {
    const sort = (index + 1) * 10;
    if (row.sort === sort) continue;
    let query = supabase.from(table).update({ sort });
    for (const [column, value] of Object.entries(row.match)) query = query.eq(column, value);
    const { error } = await query;
    if (error) throw new Error(error.message);
  }
}

export async function moveCollection(id: string, direction: "up" | "down") {
  await requireStaff();
  const supabase = await createSessionClient();
  const { data: rows } = await supabase.from("collections").select("id, sort").order("sort");
  const list = rows ?? [];
  const i = list.findIndex((r) => r.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await renumber("collections", list.map((r) => ({ sort: r.sort, match: { id: r.id } })));
  collectionsChanged();
}

export async function setCollectionOnHome(id: string, onHome: boolean) {
  await requireStaff();
  const supabase = await createSessionClient();
  const { error } = await supabase.from("collections").update({ show_on_home: onHome }).eq("id", id);
  if (error) throw new Error(error.message);
  collectionsChanged(id);
}

/** Add (at the end) or remove a product from a collection. */
export async function setProductInCollection(collectionId: string, productId: string, included: boolean) {
  await requireStaff();
  const supabase = await createSessionClient();
  if (included) {
    const { data: last } = await supabase
      .from("collection_items")
      .select("sort")
      .eq("collection_id", collectionId)
      .order("sort", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase
      .from("collection_items")
      .upsert({ collection_id: collectionId, product_id: productId, sort: (last?.sort ?? 0) + 10 }, { onConflict: "collection_id,product_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("collection_items").delete().eq("collection_id", collectionId).eq("product_id", productId);
    if (error) throw new Error(error.message);
  }
  collectionsChanged(collectionId);
  revalidatePath(`/admin/products/${productId}`);
}

export async function moveCollectionItem(collectionId: string, productId: string, direction: "up" | "down") {
  await requireStaff();
  const supabase = await createSessionClient();
  const { data: rows } = await supabase.from("collection_items").select("product_id, sort").eq("collection_id", collectionId).order("sort");
  const list = rows ?? [];
  const i = list.findIndex((r) => r.product_id === productId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await renumber(
    "collection_items",
    list.map((r) => ({ sort: r.sort, match: { collection_id: collectionId, product_id: r.product_id } })),
  );
  collectionsChanged(collectionId);
}
