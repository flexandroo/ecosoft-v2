// Targeted promo / news broadcasts of the customer bot.
import "server-only";
import { escapeHtml } from "@/lib/telegram";
import { TelegramError } from "@/lib/telegram-api";
import { clientBot, clientFilters, clientSettings, db, type Client, type ClientFilter } from "./data";
import { kyivToday } from "./schedule";

export type Audience = { product_ids?: string[]; due_within_days?: number | null };
export type Broadcast = {
  id: string;
  topic: "promo" | "news";
  title: string;
  body: string;
  button_label: string;
  button_url: string;
  audience: Audience;
  sent_at: string | null;
};

export const TOPIC_LABELS = { promo: "🎁 Акція", news: "📰 Новина" } as const;

export function parseAudience(raw: unknown): Audience {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const ids = Array.isArray(a.product_ids) ? a.product_ids.filter((x): x is string => typeof x === "string") : [];
  const due = Number(a.due_within_days);
  return { product_ids: ids, due_within_days: Number.isFinite(due) && due > 0 ? Math.round(due) : null };
}

/** Does this customer belong to the broadcast's audience right now? */
export function matches(settings: Client["settings"], filters: ClientFilter[], b: Pick<Broadcast, "topic" | "audience">): boolean {
  if (!settings[b.topic]) return false;
  const ids = b.audience.product_ids ?? [];
  if (ids.length && !filters.some((f) => ids.includes(f.model.id))) return false;
  const due = b.audience.due_within_days;
  if (due && !filters.some((f) => f.items.some((i) => i.daysLeft !== null && i.daysLeft <= due))) return false;
  return true;
}

export function renderBroadcast(b: Pick<Broadcast, "topic" | "title" | "body" | "button_label" | "button_url">) {
  const text = `${TOPIC_LABELS[b.topic]}\n\n<b>${escapeHtml(b.title)}</b>${b.body ? `\n\n${escapeHtml(b.body)}` : ""}`.slice(0, 4000);
  const reply_markup =
    b.button_url && b.button_label ? { inline_keyboard: [[{ text: b.button_label.slice(0, 60), url: b.button_url }]] } : undefined;
  return { text, reply_markup };
}

type Recipient = { id: string; tg_user_id: number };

/** Customers who would receive the broadcast if it were sent now. */
export async function audienceOf(b: Pick<Broadcast, "topic" | "audience">): Promise<Recipient[]> {
  const { data: clients } = await db()
    .from("bot_clients")
    .select("id, tg_user_id, settings")
    .eq("is_blocked", false);
  const today = kyivToday();
  const out: Recipient[] = [];
  for (const c of clients ?? []) {
    const settings = clientSettings(c.settings);
    if (!settings[b.topic]) continue;
    const needsFilters = (b.audience.product_ids?.length ?? 0) > 0 || Boolean(b.audience.due_within_days);
    const filters = needsFilters ? await clientFilters(c.id, today) : [];
    if (matches(settings, filters, b)) out.push({ id: c.id, tg_user_id: c.tg_user_id });
  }
  return out;
}

/** Send a draft broadcast to its audience (~20 messages/second). */
export async function sendBroadcast(id: string): Promise<{ recipients: number; delivered: number; failed: number }> {
  const { data: row } = await db().from("bot_broadcasts").select("*").eq("id", id).maybeSingle();
  if (!row || row.status !== "draft") throw new Error("Розсилку вже надіслано або не знайдено.");
  const b = { ...row, topic: row.topic as Broadcast["topic"], audience: parseAudience(row.audience) };
  await db().from("bot_broadcasts").update({ status: "sending" }).eq("id", id);

  const recipients = await audienceOf(b);
  const { text, reply_markup } = renderBroadcast(b);
  let delivered = 0;
  let failed = 0;
  for (const r of recipients) {
    try {
      await clientBot("sendMessage", { chat_id: r.tg_user_id, text, parse_mode: "HTML", disable_web_page_preview: false, reply_markup });
      await db().from("bot_broadcast_deliveries").insert({ broadcast_id: id, client_id: r.id });
      delivered++;
    } catch (error) {
      failed++;
      if (error instanceof TelegramError && error.blocked) await db().from("bot_clients").update({ is_blocked: true }).eq("id", r.id);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await db()
    .from("bot_broadcasts")
    .update({ status: "sent", sent_at: new Date().toISOString(), recipients: recipients.length, delivered, failed })
    .eq("id", id);
  return { recipients: recipients.length, delivered, failed };
}

/**
 * "Акції та новини" for one customer: what was sent to them, plus recent
 * broadcasts (60 days) that match their filters and subscriptions — so people
 * who joined later still see current offers.
 */
export async function historyFor(client: Client, filters: ClientFilter[], limit = 5): Promise<Broadcast[]> {
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString();
  const [{ data: delivered }, { data: recent }] = await Promise.all([
    db().from("bot_broadcast_deliveries").select("broadcast_id").eq("client_id", client.id).order("sent_at", { ascending: false }).limit(20),
    db().from("bot_broadcasts").select("*").eq("status", "sent").gte("sent_at", since).order("sent_at", { ascending: false }).limit(30),
  ]);
  const deliveredIds = new Set((delivered ?? []).map((d) => d.broadcast_id));
  const extra = deliveredIds.size
    ? (await db().from("bot_broadcasts").select("*").in("id", [...deliveredIds])).data ?? []
    : [];
  const all = new Map<string, Broadcast>();
  for (const row of [...extra, ...(recent ?? [])]) {
    const b = { ...row, topic: row.topic as Broadcast["topic"], audience: parseAudience(row.audience) } as Broadcast;
    // Due-based offers only make sense for the people they were sent to.
    const relevant = deliveredIds.has(b.id) || (!b.audience.due_within_days && matches(client.settings, filters, b));
    if (relevant) all.set(b.id, b);
  }
  return [...all.values()].sort((a, b) => (b.sent_at ?? "").localeCompare(a.sent_at ?? "")).slice(0, limit);
}
