// Telegram manager bot: posts leads into a forum group (one topic per kind)
// with status buttons, and keeps those messages in sync with the admin.
// Server only — uses the bot token and the Supabase secret key.
import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { escapeHtml } from "@/lib/telegram";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export type LeadKind = "order" | "callback" | "contact";
export type GroupConfig = { chatId: string; topics: Record<LeadKind, number> };
type MessageRef = { chat_id: string; message_id: number };

/** Topics created by /setup, in the order they appear in the group. */
export const TOPICS: { kind: LeadKind; name: string; color: number }[] = [
  { kind: "order", name: "🛒 Замовлення", color: 7322096 },
  { kind: "callback", name: "📞 Зворотний дзвінок", color: 16766590 },
  { kind: "contact", name: "✉️ Звернення", color: 13338331 },
];

/** Button action → lead status. */
const ACTIONS = { take: "contacting", done: "completed", cancel: "cancelled", reopen: "new" } as const;
export type BotAction = keyof typeof ACTIONS;

export function actionStatus(action: string): string | null {
  return action in ACTIONS ? ACTIONS[action as BotAction] : null;
}

export async function telegramApi<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  if (!TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => null)) as { ok: boolean; result?: T; description?: string } | null;
  if (!data?.ok) throw new Error(`Telegram ${method}: ${data?.description ?? res.status}`);
  return data.result as T;
}

/** The managers' group, or null while the bot is not paired with one. */
export async function getGroupConfig(): Promise<GroupConfig | null> {
  const db = createServiceClient();
  if (!db || !TOKEN) return null;
  const { data } = await db.from("site_settings").select("value").eq("key", "telegram_group").maybeSingle();
  const v = data?.value as Partial<GroupConfig> | undefined;
  if (!v?.chatId || !v.topics?.order || !v.topics.callback || !v.topics.contact) return null;
  return { chatId: String(v.chatId), topics: v.topics };
}

function statusHeader(status: string, by: string | null): string {
  const who = by ? ` — ${escapeHtml(by)}` : "";
  switch (status) {
    case "new":
      return "🆕 <b>Нова</b>";
    case "completed":
      return `✅ <b>Виконано</b>${who}`;
    case "cancelled":
      return `❌ <b>Скасовано</b>${who}`;
    default:
      // contacting, confirmed, awaiting_shipment, shipped — someone is on it.
      return `🟡 <b>В роботі</b>${who}`;
  }
}

function keyboard(leadId: string, status: string) {
  const btn = (text: string, action: BotAction) => ({ text, callback_data: `lead:${leadId}:${action}` });
  const rows =
    status === "new"
      ? [[btn("✅ Беру в роботу", "take"), btn("❌ Скасувати", "cancel")]]
      : status === "completed" || status === "cancelled"
        ? [[btn("↩️ Повернути в роботу", "take")]]
        : [[btn("✔️ Виконано", "done"), btn("❌ Скасувати", "cancel")]];
  return { inline_keyboard: rows };
}

function render(text: string, status: string, by: string | null): string {
  return `${statusHeader(status, by)}\n\n${text}`.slice(0, 4096);
}

/**
 * Post a new lead to its topic in the managers' group. Returns false when no
 * group is paired, so the caller falls back to the plain chat notification.
 */
export async function postLeadToGroup(lead: { id: string; kind: string }, text: string): Promise<boolean> {
  const group = await getGroupConfig();
  if (!group) return false;
  const kind = (["order", "callback", "contact"] as const).find((k) => k === lead.kind) ?? "contact";
  const sent = await telegramApi<{ message_id: number }>("sendMessage", {
    chat_id: group.chatId,
    message_thread_id: group.topics[kind],
    text: render(text, "new", null),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: keyboard(lead.id, "new"),
  });
  const ref: MessageRef = { chat_id: group.chatId, message_id: sent.message_id };
  await createServiceClient()
    ?.from("leads")
    .update({ telegram_text: text, telegram_messages: [ref], telegram_sent: true })
    .eq("id", lead.id);
  return true;
}

/** Re-render a lead's Telegram message(s) after its status changed anywhere. */
export async function refreshLeadMessages(leadId: string): Promise<void> {
  if (!TOKEN) return;
  const db = createServiceClient();
  if (!db) return;
  const { data: lead } = await db
    .from("leads")
    .select("id, status, status_by, telegram_text, telegram_messages")
    .eq("id", leadId)
    .maybeSingle();
  const refs = (lead?.telegram_messages ?? []) as MessageRef[];
  if (!lead?.telegram_text || !Array.isArray(refs) || refs.length === 0) return;
  await Promise.allSettled(
    refs.map((ref) =>
      telegramApi("editMessageText", {
        chat_id: ref.chat_id,
        message_id: ref.message_id,
        text: render(lead.telegram_text!, lead.status, lead.status_by),
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: keyboard(lead.id, lead.status),
      }).catch((error) => {
        // "message is not modified" is expected when nothing visible changed.
        if (!String(error).includes("not modified")) console.error("[telegram-bot] edit failed:", error);
      }),
    ),
  );
}

/** A manager's name as shown in the group: first + last name, or @username. */
export function telegramUserName(user: { first_name?: string; last_name?: string; username?: string }): string {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return (name || (user.username ? `@${user.username}` : "Менеджер")).slice(0, 60);
}
