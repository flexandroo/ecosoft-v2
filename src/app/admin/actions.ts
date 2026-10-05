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
import { crmConfigured } from "@/lib/crm";
import { dispatchConversion, type ConversionLead } from "@/lib/conversions";
import { createServiceClient, createSessionClient } from "@/lib/supabase/server";

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
    is_hit: fd.get("is_hit") === "on",
    is_promo: fd.get("is_promo") === "on",
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

export async function setProductFlag(id: string, field: "in_stock" | "is_hidden" | "is_hit" | "is_promo", value: boolean) {
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
