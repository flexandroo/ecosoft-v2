"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/products";
import { COLLECTIONS_TAG } from "@/lib/collections";
import { createSessionClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/posts-shared";
import { formatSpecs } from "@/lib/spec-format";
import type { Json } from "@/lib/supabase/database.types";
import { type FormState, str, optionalNumber, requireAdmin } from "./shared";

type DetailsInput = { specs: { label: string; value: string }[]; documents: { name: string; href: string; size?: string }[] };

/** Characteristics and documents edited in the product form (JSON in hidden fields). */
function parseDetails(fd: FormData): DetailsInput | { error: string } {
  let specsRaw: unknown;
  let docsRaw: unknown;
  try {
    specsRaw = JSON.parse(str(fd, "specs", 60000) || "[]");
    docsRaw = JSON.parse(str(fd, "documents", 20000) || "[]");
  } catch {
    return { error: "Некоректні дані характеристик або документів." };
  }
  if (!Array.isArray(specsRaw) || !Array.isArray(docsRaw)) return { error: "Некоректні дані характеристик або документів." };
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

  const rows = specsRaw.slice(0, 100).map((s) => ({ label: text(s?.label, 120), value: text(s?.value, 300) }));
  const incomplete = rows.find((s) => Boolean(s.label) !== Boolean(s.value));
  if (incomplete) return { error: `Характеристика «${incomplete.label || incomplete.value}»: заповніть і назву, і значення.` };
  // Unified spelling (°C, м³, ranges, decimal commas); empty and repeated rows are dropped.
  const specs = formatSpecs(rows);

  const documents = [];
  for (const d of docsRaw.slice(0, 30)) {
    const name = text(d?.name, 200);
    const href = text(d?.href, 500);
    if (!name && !href) continue;
    if (!name || !href) return { error: "Документ: вкажіть назву і посилання." };
    if (!href.startsWith("/") && !href.startsWith("https://")) return { error: `Посилання документа має починатися з / або https://: ${href}` };
    const size = text(d?.size, 20);
    documents.push(size ? { name, href, size } : { name, href });
  }
  return { specs, documents };
}

export async function saveProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const supabase = await createSessionClient();
  const id = str(fd, "id", 64);

  const name = str(fd, "name", 300);
  const price = optionalNumber(fd, "price");
  const oldPrice = optionalNumber(fd, "old_price");
  if (!name) return { error: "Вкажіть назву." };
  if (price === null || Number.isNaN(price)) return { error: "Некоректна ціна." };
  if (Number.isNaN(oldPrice)) return { error: "Некоректна стара ціна." };
  const ctaType = str(fd, "cta_type", 20) === "request" ? "request" : "buy";
  // The order API charges exactly this price, so a "buy" product can never be free.
  if (price <= 0 && ctaType === "buy") {
    return { error: "Ціна має бути більшою за 0 (або оберіть кнопку «Запит ціни»)." };
  }
  if (oldPrice !== null && oldPrice <= price) {
    return { error: "Стара ціна має бути більшою за нову — інакше залиште поле порожнім." };
  }

  const images = str(fd, "images", 20000)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  // slug, sku and category are not editable here: they are the public URL and
  // the Meta Pixel / catalogue-feed id that live campaigns depend on.
  const changes = {
    name,
    price,
    old_price: oldPrice,
    in_stock: fd.get("in_stock") === "on",
    cta_type: ctaType,
    description: str(fd, "description", 5000),
    image: images[0] ?? null,
    images,
    is_hidden: fd.get("is_hidden") === "on",
    sort: Math.trunc(Number(str(fd, "sort", 12)) || 0),
  };
  if (!changes.is_hidden && images.length === 0) {
    return { error: "Додайте хоча б одне фото, перш ніж показувати товар на сайті." };
  }
  const details = parseDetails(fd);
  if ("error" in details) return { error: details.error };
  const longDescription = str(fd, "long_description", 20000);

  const { data: before } = await supabase.from("products").select("*").eq("id", id).single();
  if (!before) return { error: "Товар не знайдено." };
  // Optimistic concurrency: refuse to overwrite edits saved after this form was opened.
  const loadedAt = str(fd, "updated_at", 64);
  if (loadedAt && new Date(loadedAt).getTime() !== new Date(before.updated_at).getTime()) {
    return { error: "Товар щойно змінив хтось інший. Оновіть сторінку, щоб побачити актуальні дані, і внесіть зміни ще раз." };
  }
  // Other parts of details (highlights, bundle, maintenance…) are kept as imported.
  const beforeDetails = (before.details ?? {}) as Record<string, unknown>;
  const nextDetails: Record<string, unknown> = { ...beforeDetails, specs: details.specs, documents: details.documents };
  if (longDescription) nextDetails.longDescription = longDescription;
  else delete nextDetails.longDescription;
  Object.assign(changes, { details: nextDetails });
  const { error } = await supabase.from("products").update(changes).eq("id", id);
  if (error) return { error: `Не вдалося зберегти: ${error.message}` };

  const diff: Record<string, { from: Json | undefined; to: Json | undefined }> = {};
  for (const [key, value] of Object.entries(changes)) {
    const previous = (before as Record<string, Json | undefined>)[key];
    if (JSON.stringify(previous) !== JSON.stringify(value)) diff[key] = { from: previous, to: value as Json };
  }
  if (Object.keys(diff).length) {
    await supabase
      .from("audit_log")
      .insert({ actor: staff.userId, entity: "product", entity_id: id, action: "update", diff });
  }

  updateTag(CATALOG_TAG);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return { ok: "Збережено. На сайті оновиться протягом хвилини." };
}

export async function setProductFlag(
  id: string,
  field: "in_stock" | "is_hidden",
  value: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const staff = await requireStaff();
  const supabase = await createSessionClient();
  if (field === "is_hidden" && !value) {
    const { data } = await supabase.from("products").select("image, images").eq("id", id).maybeSingle();
    if (!data?.image && !(data?.images as string[] | null)?.length) {
      return { ok: false, error: "Додайте хоча б одне фото, перш ніж показувати товар на сайті." };
    }
  }
  const { error } = await supabase
    .from("products")
    .update(field === "in_stock" ? { in_stock: value } : { is_hidden: value })
    .eq("id", id);
  if (error) return { ok: false, error: `Не вдалося зберегти: ${error.message}` };
  await supabase.from("audit_log").insert({
    actor: staff.userId,
    entity: "product",
    entity_id: id,
    action: "update",
    diff: { [field]: { from: !value, to: value } },
  });
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return { ok: true };
}

const PRODUCT_SKU_RE = /^[A-Za-z0-9][A-Za-z0-9._\/-]{1,39}$/;
const PRODUCT_SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Create a product, optionally as a copy of an existing one (description,
 * photos, characteristics and filter data are copied). New products start
 * hidden so they appear on the site only once photos and details are ready.
 */
export async function createProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const supabase = await createSessionClient();

  const name = str(fd, "name", 300);
  const category = str(fd, "category", 64);
  const sku = str(fd, "sku", 40);
  const slug = (str(fd, "slug", 100).toLowerCase() || slugify(name, 90)).replace(/-+$/, "");
  const price = optionalNumber(fd, "price");
  const fromId = str(fd, "from", 64);

  if (!name) return { error: "Вкажіть назву." };
  if (!CATEGORIES.some((c) => c.key === category)) return { error: "Оберіть категорію." };
  if (!PRODUCT_SKU_RE.test(sku)) return { error: "Артикул: 2–40 символів — латиниця, цифри, крапка, дефіс, «/»." };
  if (!PRODUCT_SLUG_RE.test(slug)) return { error: "Адреса сторінки: лише латинські літери, цифри й дефіси." };
  if (price === null || Number.isNaN(price) || price <= 0) return { error: "Вкажіть ціну більшу за 0." };

  let base: Record<string, unknown> = {};
  if (fromId) {
    const { data: source } = await supabase
      .from("products")
      .select("cta_type, description, image, images, details, attributes, in_stock, sort")
      .eq("id", fromId)
      .maybeSingle();
    if (!source) return { error: "Товар для копіювання не знайдено." };
    base = source;
  }

  const { data, error } = await supabase
    .from("products")
    .insert({ ...base, name, category, sku, slug, price, old_price: null, is_hidden: true, is_hit: false, is_promo: false })
    .select("id")
    .single();
  if (error?.code === "23505") {
    return { error: /sku/.test(error.message) ? "Такий артикул уже є в каталозі." : "Така адреса сторінки вже зайнята." };
  }
  if (error || !data) return { error: `Не вдалося створити товар: ${error?.message ?? "невідома помилка"}` };

  await supabase.from("audit_log").insert({
    actor: staff.userId,
    entity: "product",
    entity_id: data.id,
    action: fromId ? "duplicate" : "create",
    diff: { name, category, sku, slug, price, from: fromId || null },
  });
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/products");
  redirect(`/admin/products/${data.id}?created=1`);
}

/** Permanently delete a product (admins only). Hiding is the reversible option. */
export async function deleteProduct(fd: FormData) {
  const me = await requireAdmin();
  const id = str(fd, "id", 64);
  const supabase = await createSessionClient();
  const { data: product } = await supabase.from("products").select("name, sku, slug, category").eq("id", id).maybeSingle();
  if (!product) throw new Error("Товар не знайдено.");
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ actor: me.userId, entity: "product", entity_id: id, action: "delete", diff: product });
  updateTag(CATALOG_TAG);
  updateTag(COLLECTIONS_TAG);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
