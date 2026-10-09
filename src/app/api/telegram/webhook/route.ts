import { timingSafeEqual } from "node:crypto";
import { after, NextResponse } from "next/server";
import { recordPurchaseConversion } from "@/lib/lead-intake";
import { createServiceClient } from "@/lib/supabase/server";
import {
  TOPICS,
  actionStatus,
  getGroupConfig,
  refreshLeadMessages,
  telegramApi,
  telegramUserName,
  type GroupConfig,
  type LeadKind,
} from "@/lib/telegram-bot";

// Telegram webhook for the managers' bot: status buttons and /setup.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TgUser = { id: number; first_name?: string; last_name?: string; username?: string };
type TgChat = { id: number; type: string; title?: string; is_forum?: boolean };
type Update = {
  message?: { message_id: number; chat: TgChat; from?: TgUser; text?: string; message_thread_id?: number };
  callback_query?: { id: string; from: TgUser; data?: string; message?: { message_id: number; chat: TgChat } };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function secretMatches(req: Request): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const got = req.headers.get("x-telegram-bot-api-secret-token");
  if (!expected || !got || expected.length !== got.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(got));
}

export async function POST(req: Request) {
  // Only Telegram knows the secret set with setWebhook.
  if (!secretMatches(req)) return NextResponse.json({ ok: false }, { status: 401 });

  let update: Update;
  try {
    update = (await req.json()) as Update;
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    if (update.callback_query) await handleButton(update.callback_query);
    else if (update.message?.text) await handleCommand(update.message);
  } catch (error) {
    console.error("[telegram-webhook]", error);
  }
  // Always 200: Telegram retries failed deliveries, which would repeat actions.
  return NextResponse.json({ ok: true });
}

async function handleButton(query: NonNullable<Update["callback_query"]>) {
  const answer = (text: string) => telegramApi("answerCallbackQuery", { callback_query_id: query.id, text }).catch(() => {});
  const [prefix, leadId, action] = (query.data ?? "").split(":");
  const status = actionStatus(action ?? "");
  const group = await getGroupConfig();
  // Buttons work only inside the paired managers' group.
  if (prefix !== "lead" || !UUID.test(leadId ?? "") || !status || !group || String(query.message?.chat.id) !== group.chatId) {
    await answer("Недоступно");
    return;
  }

  const db = createServiceClient();
  if (!db) return answer("База недоступна");
  const { data: lead } = await db.from("leads").select("id, status, number").eq("id", leadId).maybeSingle();
  if (!lead) return answer("Заявку не знайдено");

  const by = telegramUserName(query.from);
  if (lead.status === status) {
    await refreshLeadMessages(lead.id);
    return answer("Статус уже такий");
  }

  const becameCompleted = status === "completed" && lead.status !== "completed";
  const { error } = await db
    .from("leads")
    .update({
      status,
      status_by: by,
      ...(becameCompleted ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq("id", lead.id);
  if (error) return answer("Не вдалося змінити статус");

  await db.from("lead_events").insert({
    lead_id: lead.id,
    type: "status",
    data: { status: { from: lead.status, to: status }, by, via: "telegram" },
  });
  await refreshLeadMessages(lead.id);
  await answer(`№${lead.number}: статус змінено`);
  if (becameCompleted) after(() => recordPurchaseConversion(lead.id));
}

async function handleCommand(message: NonNullable<Update["message"]>) {
  const [command, arg] = message.text!.trim().split(/\s+/);
  const name = command.split("@")[0].toLowerCase();
  const reply = (text: string) =>
    telegramApi("sendMessage", {
      chat_id: message.chat.id,
      ...(message.message_thread_id ? { message_thread_id: message.message_thread_id } : {}),
      text,
      parse_mode: "HTML",
    }).catch(() => {});

  if (name === "/start" || name === "/help") {
    await reply(
      "Бот заявок Sofiivka Water.\n\nЗамовлення, зворотні дзвінки і звернення з сайту приходять у групу менеджерів, кожне у свою тему. " +
        "Кнопки під заявкою змінюють її статус — і в групі, і в адмінці.",
    );
    return;
  }
  if (name !== "/setup") return;

  // Pairing: a one-time code from the site owner, used in a forum supergroup.
  const db = createServiceClient();
  if (!db) return;
  const { data } = await db.from("site_settings").select("value").eq("key", "telegram_setup").maybeSingle();
  const setup = data?.value as { code?: string; expiresAt?: string } | undefined;
  const valid = setup?.code && arg === setup.code && (!setup.expiresAt || new Date(setup.expiresAt) > new Date());
  if (!valid) {
    await reply("Невірний або прострочений код підключення.");
    return;
  }
  if (message.chat.type !== "supergroup" || !message.chat.is_forum) {
    await reply("Увімкніть «Теми» (Topics) у налаштуваннях групи і повторіть /setup з тим самим кодом.");
    return;
  }

  // Keep topics that already exist from an earlier pairing of the same group.
  const previous = await getGroupConfig();
  const topics = {} as GroupConfig["topics"];
  for (const t of TOPICS) {
    const existing = previous?.chatId === String(message.chat.id) ? previous.topics[t.kind as LeadKind] : undefined;
    if (existing) {
      topics[t.kind] = existing;
      continue;
    }
    try {
      const created = await telegramApi<{ message_thread_id: number }>("createForumTopic", {
        chat_id: message.chat.id,
        name: t.name,
        icon_color: t.color,
      });
      topics[t.kind] = created.message_thread_id;
    } catch (error) {
      console.error("[telegram-webhook] createForumTopic failed:", error);
      await reply("Не вдалося створити теми. Зробіть бота адміністратором групи з правом «Керування темами» і повторіть /setup.");
      return;
    }
  }

  await db.from("site_settings").upsert(
    [{ key: "telegram_group", value: { chatId: String(message.chat.id), topics }, is_public: false }],
    { onConflict: "key" },
  );
  await db.from("site_settings").delete().eq("key", "telegram_setup");
  await reply(
    "✅ Групу підключено. Нові заявки з сайту приходитимуть у теми:\n" +
      TOPICS.map((t) => `• ${t.name}`).join("\n") +
      "\n\nПід кожною заявкою — кнопки статусу; зміни видно і в адмінці.",
  );
}
