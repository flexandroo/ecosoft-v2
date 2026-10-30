import type { Metadata } from "next";
import Link from "next/link";
import { addDays, kyivToday } from "@/lib/client-bot/schedule";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle, formatDateTime } from "../ui";

export const metadata: Metadata = { title: "Telegram-бот" };

const BOT_URL = "https://t.me/sofiivkawater_service_bot";

export default async function BotOverviewPage() {
  const supabase = await createSessionClient();
  const since = addDays(kyivToday(), -7);
  const [clients, newClients, blocked, filters, broadcasts, support] = await Promise.all([
    supabase.from("bot_clients").select("id", { count: "exact", head: true }),
    supabase.from("bot_clients").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("bot_clients").select("id", { count: "exact", head: true }).eq("is_blocked", true),
    supabase.from("bot_client_filters").select("id", { count: "exact", head: true }),
    supabase.from("bot_broadcasts").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase
      .from("bot_support_messages")
      .select("id, client_id, direction, text, author, created_at, bot_clients(name, tg_first_name, phone)")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const stats = [
    { label: "Клієнтів у боті", value: clients.count ?? 0 },
    { label: "Нових за 7 днів", value: newClients.count ?? 0 },
    { label: "Фільтрів на обліку", value: filters.count ?? 0 },
    { label: "Розсилок надіслано", value: broadcasts.count ?? 0 },
    { label: "Заблокували бота", value: blocked.count ?? 0 },
  ];
  const messages = (support.data ?? []) as unknown as {
    id: number;
    client_id: string;
    direction: string;
    text: string;
    author: string;
    created_at: string;
    bot_clients: { name: string; tg_first_name: string; phone: string } | null;
  }[];

  return (
    <>
      <PageTitle
        title="Telegram-бот для клієнтів"
        subtitle={
          <>
            <a href={BOT_URL} target="_blank" rel="noreferrer" className="underline">
              @sofiivkawater_service_bot
            </a>{" "}
            — нагадування про заміну картриджів, гайди, FAQ, акції та звʼязок з менеджером.
          </>
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-1 font-semibold">Останні повідомлення клієнтів</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Клієнти пишуть через «💬 Звʼязатись з адміністратором». Їхні повідомлення приходять у тему «💬 Клієнти бота» групи менеджерів —
          відповідайте там реплаєм, або зі сторінки клієнта тут.
        </p>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Поки що повідомлень немає.</p>
        ) : (
          <ul className="divide-y">
            {messages.map((m) => (
              <li key={m.id} className="flex gap-3 py-2.5 text-sm">
                <span className="w-6 shrink-0">{m.direction === "in" ? "👤" : "💬"}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/bot/clients/${m.client_id}`} className="font-medium hover:underline">
                    {m.bot_clients?.name || m.bot_clients?.tg_first_name || "Клієнт"}
                  </Link>
                  {m.direction === "out" && <span className="text-muted-foreground"> ← {m.author || "менеджер"}</span>}
                  <p className="line-clamp-2 text-muted-foreground">{m.text}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(m.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
