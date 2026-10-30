// Support chat: customer → managers' group topic "💬 Клієнти бота" (posted by
// the managers' bot); a manager's reply to that post → back to the customer.
import "server-only";
import { escapeHtml, sendTelegramMessage, telegramConfigured } from "@/lib/telegram";
import { ensureSupportTopic, telegramApi } from "@/lib/telegram-bot";
import { clientBot, db, type Client } from "./data";

function header(client: Client): string {
  const who = escapeHtml(client.name || client.tg_first_name || "Клієнт");
  const phone = client.phone ? ` · ${escapeHtml(client.phone)}` : "";
  const user = client.tg_username ? ` · @${escapeHtml(client.tg_username)}` : "";
  return `💬 <b>${who}</b>${phone}${user}`;
}

/** Pass a customer's message to the managers. Returns false if nobody can receive it. */
export async function forwardToManagers(client: Client, text: string): Promise<boolean> {
  const body = `${header(client)}\n\n${escapeHtml(text.slice(0, 3500))}\n\n<i>↩️ Відповідайте реплаєм на це повідомлення — клієнт отримає відповідь у боті.</i>`;
  const topic = await ensureSupportTopic().catch((error) => {
    console.error("[client-bot] support topic unavailable:", error);
    return null;
  });
  if (topic) {
    const sent = await telegramApi<{ message_id: number }>("sendMessage", {
      chat_id: topic.chatId,
      message_thread_id: topic.threadId,
      text: body,
      parse_mode: "HTML",
    });
    await db()
      .from("bot_support_messages")
      .insert({ client_id: client.id, direction: "in", text: text.slice(0, 4000), group_message_id: sent.message_id });
    return true;
  }
  // No paired group: plain notification without reply relay.
  await db().from("bot_support_messages").insert({ client_id: client.id, direction: "in", text: text.slice(0, 4000) });
  if (!telegramConfigured()) return false;
  await sendTelegramMessage(`${header(client)} (бот клієнтів)\n\n${escapeHtml(text.slice(0, 3500))}`);
  return true;
}

/**
 * A manager replied in the group. Relays the reply when it answers a support
 * message; returns false when the replied-to message is not one of ours.
 */
export async function relayManagerReply(replyToMessageId: number, managerMessageId: number, text: string, manager: string): Promise<boolean> {
  const { data: original } = await db()
    .from("bot_support_messages")
    .select("client_id")
    .eq("group_message_id", replyToMessageId)
    .maybeSingle();
  if (!original) return false;
  const { data: client } = await db().from("bot_clients").select("tg_user_id").eq("id", original.client_id).maybeSingle();
  if (!client) return false;
  await clientBot("sendMessage", {
    chat_id: client.tg_user_id,
    text: `💬 <b>Відповідь менеджера</b>\n\n${escapeHtml(text.slice(0, 3800))}\n\n<i>Щоб відповісти, натисніть «💬 Звʼязатись з адміністратором».</i>`,
    parse_mode: "HTML",
  });
  await db().from("bot_support_messages").insert({
    client_id: original.client_id,
    direction: "out",
    text: text.slice(0, 4000),
    author: manager,
    group_message_id: managerMessageId,
  });
  return true;
}

/** Message from the admin panel to a customer. */
export async function sendFromAdmin(clientId: string, text: string, author: string): Promise<void> {
  const { data: client } = await db().from("bot_clients").select("tg_user_id").eq("id", clientId).maybeSingle();
  if (!client) throw new Error("Клієнта не знайдено");
  await clientBot("sendMessage", {
    chat_id: client.tg_user_id,
    text: `💬 <b>Повідомлення від Sofiivka Water</b>\n\n${escapeHtml(text.slice(0, 3800))}`,
    parse_mode: "HTML",
  });
  await db().from("bot_support_messages").insert({ client_id: clientId, direction: "out", text: text.slice(0, 4000), author });
}
