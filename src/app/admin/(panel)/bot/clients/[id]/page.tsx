import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { clientFilters, clientSettings } from "@/lib/client-bot/data";
import { daysLabel, formatDate } from "@/lib/client-bot/schedule";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle, formatDateTime } from "../../../ui";
import { MessageClientForm } from "../../forms";

export const metadata: Metadata = { title: "Клієнт бота" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function BotClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createSessionClient();
  const { data: client } = await supabase
    .from("bot_clients")
    .select("id, name, tg_first_name, tg_username, phone, settings, is_blocked, created_at, last_seen_at")
    .eq("id", id)
    .maybeSingle();
  if (!client) notFound();
  const [filters, { data: messages }] = await Promise.all([
    clientFilters(client.id),
    supabase.from("bot_support_messages").select("id, direction, text, author, created_at").eq("client_id", id).order("created_at", { ascending: false }).limit(50),
  ]);
  const s = clientSettings(client.settings);

  return (
    <>
      <Link href="/admin/bot/clients" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Клієнти бота
      </Link>
      <PageTitle
        title={client.name || client.tg_first_name || "Клієнт"}
        subtitle={[client.phone, client.tg_username ? `@${client.tg_username}` : "", `з ${formatDateTime(client.created_at)}`].filter(Boolean).join(" · ")}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid content-start gap-5">
          <Card>
            <h2 className="mb-3 font-semibold">Фільтри і заміни</h2>
            {filters.length === 0 && <p className="text-sm text-muted-foreground">Клієнт ще не додав фільтр.</p>}
            <div className="grid gap-4">
              {filters.map((f) => (
                <div key={f.id}>
                  <div className="font-medium">
                    {f.label && <span>{f.label} — </span>}
                    {f.model.name} <span className="text-xs text-muted-foreground">{f.model.sku}</span>
                  </div>
                  <ul className="mt-1 space-y-0.5 text-sm">
                    {f.items.map((i) => (
                      <li key={i.id} className="flex flex-wrap gap-x-2">
                        <span>{i.daysLeft === null ? "❔" : i.daysLeft <= 0 ? "🔴" : i.daysLeft <= 14 ? "🟡" : "🟢"}</span>
                        <span>{i.title}:</span>
                        <span className="text-muted-foreground">
                          {i.lastOn ? `замінено ${formatDate(i.lastOn)}` : "дату не вказано"}
                          {i.dueOn && ` · наступна ${formatDate(i.dueOn)}`}
                          {i.daysLeft !== null && (i.daysLeft < 0 ? ` (прострочено ${daysLabel(-i.daysLeft)})` : ` (через ${daysLabel(i.daysLeft)})`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold">Листування</h2>
            {(messages ?? []).length === 0 && <p className="text-sm text-muted-foreground">Повідомлень ще не було.</p>}
            <ul className="space-y-2">
              {(messages ?? []).map((m) => (
                <li key={m.id} className={`rounded-lg p-2.5 text-sm ${m.direction === "in" ? "bg-muted" : "ml-8 bg-primary/10"}`}>
                  <div className="mb-0.5 text-xs text-muted-foreground">
                    {m.direction === "in" ? "Клієнт" : m.author || "Менеджер"} · {formatDateTime(m.created_at)}
                  </div>
                  <p className="whitespace-pre-line">{m.text}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="grid content-start gap-5">
          <Card>
            <h2 className="mb-3 font-semibold">Написати клієнту</h2>
            <MessageClientForm clientId={client.id} blocked={client.is_blocked} />
          </Card>
          <Card>
            <h2 className="mb-2 font-semibold">Налаштування клієнта</h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Нагадування: {s.reminders ? (s.remind_before_days ? `за ${daysLabel(s.remind_before_days)} і в день заміни` : "у день заміни") : "вимкнено"}</li>
              <li>Акції: {s.promo ? "так" : "ні"} · Новини: {s.news ? "так" : "ні"}</li>
              <li>Останній візит: {formatDateTime(client.last_seen_at)}</li>
              {client.is_blocked && <li className="text-rose-700">Клієнт заблокував бота — повідомлення не доходять.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
