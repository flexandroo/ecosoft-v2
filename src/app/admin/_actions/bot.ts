"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireStaff } from "@/lib/admin/auth";
import { sendBroadcast } from "@/lib/client-bot/broadcasts";
import { sendFromAdmin } from "@/lib/client-bot/support";
import { createSessionClient } from "@/lib/supabase/server";
import { type FormState, str } from "./shared";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const httpsOrEmpty = (url: string) => !url || /^https:\/\/\S+$/.test(url);

function intIn(fd: FormData, key: string, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(str(fd, key, 12).replace(",", ".")));
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

// ---------------------------------------------------------------------------
// Guides & FAQ
// ---------------------------------------------------------------------------

export async function saveGuide(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const id = str(fd, "id", 64);
  const title = str(fd, "title", 120);
  const videoUrl = str(fd, "video_url", 500);
  if (!title) return { error: "Вкажіть назву гайда." };
  if (!httpsOrEmpty(videoUrl)) return { error: "Посилання на відео має починатися з https://" };
  const row = {
    title,
    body: str(fd, "body", 3500),
    video_url: videoUrl,
    sort: intIn(fd, "sort", 0, 10000, 0),
    is_published: fd.get("is_published") === "on",
  };
  const supabase = await createSessionClient();
  if (id) {
    const { error } = await supabase.from("bot_guides").update(row).eq("id", id);
    if (error) return { error: `Не вдалося зберегти: ${error.message}` };
    revalidatePath("/admin/bot/guides");
    return { ok: "Збережено" };
  }
  const { data, error } = await supabase.from("bot_guides").insert(row).select("id").single();
  if (error || !data) return { error: `Не вдалося створити: ${error?.message ?? ""}` };
  revalidatePath("/admin/bot/guides");
  redirect(`/admin/bot/guides/${data.id}`);
}

export async function deleteGuide(fd: FormData) {
  await requireStaff();
  const supabase = await createSessionClient();
  await supabase.from("bot_guides").delete().eq("id", str(fd, "id", 64));
  revalidatePath("/admin/bot/guides");
  redirect("/admin/bot/guides");
}

export async function saveFaq(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const id = str(fd, "id", 64);
  const question = str(fd, "question", 120);
  if (!question) return { error: "Вкажіть питання." };
  const row = {
    question,
    answer: str(fd, "answer", 3500),
    sort: intIn(fd, "sort", 0, 10000, 0),
    is_published: fd.get("is_published") === "on",
  };
  const supabase = await createSessionClient();
  if (id) {
    const { error } = await supabase.from("bot_faq").update(row).eq("id", id);
    if (error) return { error: `Не вдалося зберегти: ${error.message}` };
    revalidatePath("/admin/bot/faq");
    return { ok: "Збережено" };
  }
  const { data, error } = await supabase.from("bot_faq").insert(row).select("id").single();
  if (error || !data) return { error: `Не вдалося створити: ${error?.message ?? ""}` };
  revalidatePath("/admin/bot/faq");
  redirect(`/admin/bot/faq/${data.id}`);
}

export async function deleteFaq(fd: FormData) {
  await requireStaff();
  const supabase = await createSessionClient();
  await supabase.from("bot_faq").delete().eq("id", str(fd, "id", 64));
  revalidatePath("/admin/bot/faq");
  redirect("/admin/bot/faq");
}

// ---------------------------------------------------------------------------
// Replacement schedules
// ---------------------------------------------------------------------------

export async function saveServiceItem(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const id = str(fd, "id", 64);
  const productId = str(fd, "product_id", 64);
  const title = str(fd, "title", 100);
  if (!UUID.test(productId)) return { error: "Не вказано фільтр." };
  if (!title) return { error: "Вкажіть назву картриджа." };
  const intervalDays = intIn(fd, "interval_days", 7, 3650, 0);
  if (!intervalDays) return { error: "Інтервал заміни — від 7 до 3650 днів." };
  const cartridge = str(fd, "cartridge_product_id", 64);
  const guide = str(fd, "guide_id", 64);
  const row = {
    product_id: productId,
    title,
    interval_days: intervalDays,
    cartridge_product_id: UUID.test(cartridge) ? cartridge : null,
    guide_id: UUID.test(guide) ? guide : null,
    sort: intIn(fd, "sort", 0, 10000, 0),
  };
  const supabase = await createSessionClient();
  const { error } = id
    ? await supabase.from("bot_service_items").update(row).eq("id", id)
    : await supabase.from("bot_service_items").insert(row);
  if (error) return { error: `Не вдалося зберегти: ${error.message}` };
  revalidatePath(`/admin/bot/plans/${productId}`);
  revalidatePath("/admin/bot/plans");
  return { ok: id ? "Збережено" : "Додано" };
}

export async function deleteServiceItem(fd: FormData) {
  await requireStaff();
  const id = str(fd, "id", 64);
  const productId = str(fd, "product_id", 64);
  const supabase = await createSessionClient();
  await supabase.from("bot_service_items").delete().eq("id", id);
  revalidatePath(`/admin/bot/plans/${productId}`);
  revalidatePath("/admin/bot/plans");
}

// ---------------------------------------------------------------------------
// Broadcasts
// ---------------------------------------------------------------------------

function broadcastRow(fd: FormData) {
  const due = intIn(fd, "due_within_days", 0, 365, 0);
  return {
    topic: str(fd, "topic", 10) === "news" ? "news" : "promo",
    title: str(fd, "title", 150),
    body: str(fd, "body", 3500),
    button_label: str(fd, "button_label", 60),
    button_url: str(fd, "button_url", 500),
    audience: {
      product_ids: fd.getAll("product_ids").filter((v): v is string => typeof v === "string" && UUID.test(v)),
      due_within_days: due || null,
    },
  };
}

export async function saveBroadcast(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const id = str(fd, "id", 64);
  const row = broadcastRow(fd);
  if (!row.title) return { error: "Вкажіть заголовок." };
  if (!httpsOrEmpty(row.button_url)) return { error: "Посилання кнопки має починатися з https://" };
  if (Boolean(row.button_label) !== Boolean(row.button_url)) return { error: "Для кнопки вкажіть і текст, і посилання (або залиште обидва порожніми)." };
  const supabase = await createSessionClient();
  if (id) {
    const { error } = await supabase.from("bot_broadcasts").update(row).eq("id", id).eq("status", "draft");
    if (error) return { error: `Не вдалося зберегти: ${error.message}` };
    revalidatePath(`/admin/bot/broadcasts/${id}`);
    revalidatePath("/admin/bot/broadcasts");
    return { ok: "Збережено" };
  }
  const { data, error } = await supabase.from("bot_broadcasts").insert({ ...row, created_by: staff.userId }).select("id").single();
  if (error || !data) return { error: `Не вдалося створити: ${error?.message ?? ""}` };
  revalidatePath("/admin/bot/broadcasts");
  redirect(`/admin/bot/broadcasts/${data.id}`);
}

export async function deleteBroadcast(fd: FormData) {
  await requireStaff();
  const supabase = await createSessionClient();
  await supabase.from("bot_broadcasts").delete().eq("id", str(fd, "id", 64)).eq("status", "draft");
  revalidatePath("/admin/bot/broadcasts");
  redirect("/admin/bot/broadcasts");
}

export async function sendBroadcastNow(fd: FormData) {
  await requireStaff();
  const id = str(fd, "id", 64);
  if (!UUID.test(id)) return;
  // Runs after the response: the page shows "Надсилається…" and then the stats.
  after(async () => {
    try {
      await sendBroadcast(id);
    } catch (error) {
      console.error("[admin] broadcast failed:", error);
    }
  });
  revalidatePath(`/admin/bot/broadcasts/${id}`);
  redirect(`/admin/bot/broadcasts/${id}?sent=1`);
}

// ---------------------------------------------------------------------------
// Messages to a customer
// ---------------------------------------------------------------------------

export async function messageClient(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const clientId = str(fd, "client_id", 64);
  const text = str(fd, "text", 3500);
  if (!UUID.test(clientId) || !text) return { error: "Напишіть повідомлення." };
  try {
    await sendFromAdmin(clientId, text, staff.name);
  } catch (error) {
    return { error: `Не вдалося надіслати: ${error instanceof Error ? error.message : "помилка"}` };
  }
  revalidatePath(`/admin/bot/clients/${clientId}`);
  return { ok: "Надіслано" };
}
