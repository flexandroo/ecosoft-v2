"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import {
  BANNER_PLACEMENTS,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  isLeadStatus,
} from "@/lib/admin/constants";
import { BANNERS_TAG } from "@/lib/banners";
import { CATALOG_TAG } from "@/lib/catalog";
import { CATEGORIES_TAG } from "@/lib/categories";
import { COLLECTIONS_TAG } from "@/lib/collections";
import { crmConfigured } from "@/lib/crm";
import { MENUS_TAG } from "@/lib/menus";
import { validateMenus } from "@/lib/menus-shared";
import { dispatchConversion, type ConversionLead } from "@/lib/conversions";
import { createServiceClient, createSessionClient } from "@/lib/supabase/server";
import { SETTINGS_TAG } from "@/lib/settings";
import { mediaUsage } from "@/lib/admin/media";
import { normalizePhone, type HoursRow, type PhoneSetting } from "@/lib/settings-shared";

export type FormState = { error?: string; ok?: string } | null;

function str(fd: FormData, key: string, max = 2000): string {
  const value = fd.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalNumber(fd: FormData, key: string): number | null {
  const raw = str(fd, key, 32).replace(/\s/g, "").replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}

function optionalDate(fd: FormData, key: string): string | null {
  const raw = str(fd, key, 40);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function oneOf<T extends string>(list: readonly { id: T }[], value: string, fallback: T): T {
  return list.some((item) => item.id === value) ? (value as T) : fallback;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export async function signIn(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email", 254);
  const password = str(fd, "password", 200);
  const next = str(fd, "next", 200);
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Невірний email або пароль." };
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

const CONVERSION_COLUMNS =
  "id, external_id, phone, email, customer_name, items, total, currency, lead_event_id, " +
  "landing_page, utm_source, utm_medium, source, fbp, fbc, ga_client_id, client_ip, user_agent, " +
  "created_at, completed_at, tracking";

export async function updateLead(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const supabase = await createSessionClient();
  const id = str(fd, "id", 64);
  const status = str(fd, "status", 40);
  if (!isLeadStatus(status)) return { error: "Невідомий статус." };

  const { data: current, error: readError } = await supabase
    .from("leads")
    .select("status, manager_note, assigned_to, payment_method, payment_status, address")
    .eq("id", id)
    .single();
  if (readError || !current) return { error: "Заявку не знайдено." };

  const changes: Record<string, unknown> = {
    status,
    manager_note: str(fd, "manager_note", 5000) || null,
    assigned_to: str(fd, "assigned_to", 64) || null,
    payment_method: oneOf(PAYMENT_METHODS, str(fd, "payment_method", 40), "none"),
    payment_status: oneOf(PAYMENT_STATUSES, str(fd, "payment_status", 40), "unpaid"),
    address: str(fd, "address", 500) || null,
  };
  const becameCompleted = status === "completed" && current.status !== "completed";
  if (becameCompleted) changes.completed_at = new Date().toISOString();

  const { error } = await supabase.from("leads").update(changes).eq("id", id);
  if (error) return { error: `Не вдалося зберегти: ${error.message}` };

  const diff: Record<string, { from: unknown; to: unknown }> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (key in current && current[key as keyof typeof current] !== value) {
      diff[key] = { from: current[key as keyof typeof current], to: value };
    }
  }
  if (Object.keys(diff).length) {
    await supabase.from("lead_events").insert({
      lead_id: id,
      actor: staff.userId,
      type: diff.status ? "status" : "update",
      data: diff,
    });
  }

  // Purchase conversion for ads, exactly when the legacy CRM used to send it.
  if (becameCompleted && !crmConfigured()) {
    const { data: lead } = await supabase.from("leads").select(CONVERSION_COLUMNS).eq("id", id).single();
    if (lead) {
      const row = lead as unknown as ConversionLead & { tracking: Record<string, unknown> };
      const result = await dispatchConversion(row, "purchase");
      if (result.state !== "unconfigured") {
        await supabase
          .from("leads")
          .update({ tracking: { ...(row.tracking ?? {}), purchase: result } })
          .eq("id", id);
      }
    }
  }

  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
  return { ok: "Збережено" };
}

export async function addLeadComment(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const id = str(fd, "id", 64);
  const text = str(fd, "text", 3000);
  if (!text) return { error: "Порожній коментар." };
  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("lead_events")
    .insert({ lead_id: id, actor: staff.userId, type: "comment", data: { text } });
  if (error) return { error: error.message };
  revalidatePath(`/admin/leads/${id}`);
  return { ok: "Додано" };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

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
    cta_type: str(fd, "cta_type", 20) === "request" ? "request" : "buy",
    description: str(fd, "description", 5000),
    image: images[0] ?? null,
    images,
    is_hidden: fd.get("is_hidden") === "on",
    sort: Math.trunc(Number(str(fd, "sort", 12)) || 0),
  };

  const { data: before } = await supabase.from("products").select("*").eq("id", id).single();
  if (!before) return { error: "Товар не знайдено." };
  const { error } = await supabase.from("products").update(changes).eq("id", id);
  if (error) return { error: `Не вдалося зберегти: ${error.message}` };

  const diff: Record<string, { from: unknown; to: unknown }> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (JSON.stringify(before[key]) !== JSON.stringify(value)) diff[key] = { from: before[key], to: value };
  }
  if (Object.keys(diff).length) {
    await supabase
      .from("audit_log")
      .insert({ actor: staff.userId, entity: "product", entity_id: id, action: "update", diff });
  }

  updateTag(CATALOG_TAG);
  revalidatePath("/admin/products");
  return { ok: "Збережено. На сайті оновиться протягом хвилини." };
}

export async function setProductFlag(id: string, field: "in_stock" | "is_hidden", value: boolean) {
  const staff = await requireStaff();
  const supabase = await createSessionClient();
  const { error } = await supabase.from("products").update({ [field]: value }).eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({
    actor: staff.userId,
    entity: "product",
    entity_id: id,
    action: "update",
    diff: { [field]: { from: !value, to: value } },
  });
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/products");
}

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Staff (admins only)
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const staff = await requireStaff();
  if (staff.role !== "admin") throw new Error("Лише адміністратор може керувати працівниками.");
  return staff;
}

export async function addStaff(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    await requireAdmin();
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
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.data.user) {
    userId = created.data.user.id;
  } else if (/already|registered|exists/i.test(created.error?.message ?? "")) {
    // Existing account (e.g. re-adding a former employee): look it up and grant access again.
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data } = await service.auth.admin.listUsers({ page, perPage: 200 });
      userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (data.users.length < 200) break;
    }
  }
  if (!userId) return { error: `Не вдалося створити акаунт: ${created.error?.message ?? "невідома помилка"}` };

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("admin_users")
    .upsert({ user_id: userId, email, name: name || email, role }, { onConflict: "user_id" });
  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  return { ok: `Додано ${email}. Передайте працівнику пароль особисто.` };
}

export async function updateStaffRole(fd: FormData) {
  const me = await requireAdmin();
  const userId = str(fd, "user_id", 64);
  const role = str(fd, "role", 20) === "admin" ? "admin" : "manager";
  if (userId === me.userId && role !== "admin") throw new Error("Не можна зняти права адміністратора з себе.");
  const supabase = await createSessionClient();
  const { error } = await supabase.from("admin_users").update({ role }).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/staff");
}

export async function removeStaff(fd: FormData) {
  const me = await requireAdmin();
  const userId = str(fd, "user_id", 64);
  if (userId === me.userId) throw new Error("Не можна видалити себе.");
  const supabase = await createSessionClient();
  const { error } = await supabase.from("admin_users").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
  // Without an admin_users row every admin page and RLS policy denies access,
  // even if the person still has a valid session.
  revalidatePath("/admin/staff");
}

// ---------------------------------------------------------------------------
// Site settings (admins only)
// ---------------------------------------------------------------------------

export async function saveSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  let staff;
  try {
    staff = await requireAdmin();
  } catch (error) {
    return { error: (error as Error).message };
  }

  let input: Record<string, unknown>;
  try {
    input = JSON.parse(str(fd, "payload", 20000)) as Record<string, unknown>;
  } catch {
    return { error: "Некоректні дані форми." };
  }

  const text = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const phones = (Array.isArray(input.phones) ? input.phones : [])
    .map((p) => ({ number: text((p as PhoneSetting).number, 40), label: text((p as PhoneSetting).label, 60) }))
    .filter((p) => p.number);
  if (!phones.length) return { error: "Потрібен хоча б один телефон." };
  if (phones.some((p) => normalizePhone(p.number).replace(/\D/g, "").length < 10)) {
    return { error: "Перевірте номери телефонів." };
  }
  const email = text(input.email, 254);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Некоректний email." };

  const pick = (source: unknown, keys: string[], max = 300) =>
    Object.fromEntries(keys.map((k) => [k, text((source as Record<string, unknown> | undefined)?.[k], max)]));
  const address = pick(input.address, ["full", "short", "street", "locality", "region", "postalCode"]);
  if (!address.full || !address.short) return { error: "Заповніть повну і коротку адресу." };
  const hours = (Array.isArray(input.hours) ? input.hours : [])
    .map((h) => ({ days: text((h as HoursRow).days, 40), time: text((h as HoursRow).time, 60) }))
    .filter((h) => h.days);
  const socials = pick(input.socials, ["instagram", "facebook", "telegram", "viber", "youtube", "tiktok"], 300);
  for (const url of Object.values(socials)) {
    if (url && !/^(https:\/\/|viber:\/\/|tg:\/\/)/.test(url)) return { error: `Посилання має починатися з https://: ${url}` };
  }
  const legal = pick(input.legal, ["name", "edrpou", "iban", "bank"], 120);
  const chatIds = (Array.isArray(input.telegramExtraChatIds) ? input.telegramExtraChatIds : [])
    .map((id) => text(id, 24))
    .filter(Boolean);
  if (chatIds.some((id) => !/^-?\d{3,20}$/.test(id))) return { error: "ID Telegram-чату — це число (може починатися з «-»)." };

  const rows = [
    { key: "phones", value: phones, is_public: true },
    { key: "email", value: email, is_public: true },
    { key: "address", value: address, is_public: true },
    { key: "hours", value: hours, is_public: true },
    { key: "socials", value: socials, is_public: true },
    { key: "legal", value: legal, is_public: true },
    { key: "notifications", value: { telegramExtraChatIds: chatIds }, is_public: false },
  ].map((row) => ({ ...row, updated_by: staff.userId }));

  const supabase = await createSessionClient();
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) return { error: `Не вдалося зберегти: ${error.message}` };
  await supabase.from("audit_log").insert({
    actor: staff.userId,
    entity: "settings",
    entity_id: "site",
    action: "update",
    diff: Object.fromEntries(rows.map((r) => [r.key, r.value])),
  });

  updateTag(SETTINGS_TAG);
  revalidatePath("/admin/settings");
  return { ok: "Збережено. На сайті оновиться протягом хвилини." };
}

// ---------------------------------------------------------------------------
// Site menus
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Media library
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Categories (storefront presentation only; keys are fixed)
// ---------------------------------------------------------------------------

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
  // Re-number everything so equal sort values can never block a move.
  const ordered = [...rows];
  [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  for (const [index, row] of ordered.entries()) {
    const sort = (index + 1) * 10;
    if (row.sort !== sort) await supabase.from("categories").update({ sort }).eq("key", row.key);
  }
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

// ---------------------------------------------------------------------------
// Collections ("Підбірки")
// ---------------------------------------------------------------------------

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
