"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { createServiceClient, createSessionClient } from "@/lib/supabase/server";
import { SETTINGS_TAG } from "@/lib/settings";
import { normalizePhone, type HoursRow, type PhoneSetting } from "@/lib/settings-shared";
import { type FormState, str, requireAdmin } from "./shared";

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

/** Fetch today's NBU rate now and reprice the catalogue (normally pg_cron does it twice a day). */
export async function refreshUsdRate(): Promise<FormState> {
  await requireStaff();
  const service = createServiceClient();
  if (!service) return { error: "На сервері не задано SUPABASE_SECRET_KEY." };
  const { data, error } = await service.rpc("refresh_usd_rate");
  if (error) return { error: `Не вдалося оновити курс: ${error.message}` };
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/settings");
  revalidatePath("/admin/products");
  return { ok: String(data) };
}
