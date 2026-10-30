import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { audienceOf, parseAudience } from "@/lib/client-bot/broadcasts";
import { listModels, modelShortName } from "@/lib/client-bot/data";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle, formatDateTime } from "../../../ui";
import { BroadcastForm, SendBroadcastForm, type BroadcastValue } from "../../forms";

export const metadata: Metadata = { title: "Розсилка" };

export default async function BotBroadcastPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { id } = await params;
  const { sent } = await searchParams;
  const models = (await listModels()).map((m) => ({ id: m.id, label: modelShortName(m.name) }));

  if (id === "new") {
    return (
      <>
        <BackLink />
        <PageTitle title="Нова розсилка" subtitle="Спершу збережіть чернетку — тоді побачите, скільки клієнтів її отримають." />
        <BroadcastForm broadcast={null} models={models} />
      </>
    );
  }

  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSessionClient();
  const { data: row } = await supabase.from("bot_broadcasts").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();
  const audience = parseAudience(row.audience);
  const value: BroadcastValue = {
    id: row.id,
    topic: row.topic,
    title: row.title,
    body: row.body,
    button_label: row.button_label,
    button_url: row.button_url,
    product_ids: audience.product_ids ?? [],
    due_within_days: audience.due_within_days ?? null,
  };
  const modelNames = new Map(models.map((m) => [m.id, m.label]));
  const audienceText = [
    row.topic === "news" ? "підписані на новини" : "підписані на акції",
    audience.product_ids?.length ? `власники: ${audience.product_ids.map((p) => modelNames.get(p) ?? "?").join(", ")}` : "усі моделі",
    audience.due_within_days ? `заміна протягом ${audience.due_within_days} дн.` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  if (row.status !== "draft") {
    return (
      <>
        <BackLink />
        <PageTitle title={row.title} subtitle={row.status === "sending" ? "Надсилається… оновіть сторінку за хвилину." : `Надіслано ${formatDateTime(row.sent_at)}`} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <p className="mb-2 text-xs text-muted-foreground">{row.topic === "news" ? "📰 Новина" : "🎁 Акція"}</p>
            <h2 className="font-semibold">{row.title}</h2>
            <p className="mt-2 whitespace-pre-line text-sm">{row.body}</p>
            {row.button_url && <p className="mt-3 text-sm">Кнопка: «{row.button_label}» → {row.button_url}</p>}
          </Card>
          <Card>
            <h2 className="mb-2 font-semibold">Результат</h2>
            <ul className="space-y-1 text-sm">
              <li>Аудиторія: {audienceText}</li>
              <li>Отримувачів: {row.recipients}</li>
              <li>Доставлено: {row.delivered}</li>
              <li>Не доставлено: {row.failed}</li>
            </ul>
          </Card>
        </div>
      </>
    );
  }

  const recipients = await audienceOf({ topic: row.topic === "news" ? "news" : "promo", audience });
  return (
    <>
      <BackLink />
      <PageTitle title={row.title} subtitle="Чернетка" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <BroadcastForm key={row.updated_at} broadcast={value} models={models} />
        <Card className="h-fit">
          <h2 className="mb-1 font-semibold">Надсилання</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Аудиторія: {audienceText}.
            <br />
            Зараз отримають: <b className="text-foreground">{recipients.length}</b>
          </p>
          {sent && <p className="mb-3 text-sm text-emerald-700">Розсилку запущено.</p>}
          {recipients.length > 0 ? (
            <SendBroadcastForm id={row.id} recipients={recipients.length} />
          ) : (
            <p className="text-sm text-amber-700">Під ці умови зараз ніхто не підходить. Змініть аудиторію або зачекайте нових клієнтів.</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Збережіть зміни перед надсиланням — надсилається остання збережена версія.</p>
        </Card>
      </div>
    </>
  );
}

function BackLink() {
  return (
    <Link href="/admin/bot/broadcasts" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Акції та новини
    </Link>
  );
}
