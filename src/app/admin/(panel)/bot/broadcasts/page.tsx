import type { Metadata } from "next";
import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle, formatDateTime } from "../../ui";

export const metadata: Metadata = { title: "Акції та новини бота" };

const STATUS: Record<string, { label: string; tone: string }> = {
  draft: { label: "Чернетка", tone: "bg-slate-200 text-slate-800" },
  sending: { label: "Надсилається", tone: "bg-amber-100 text-amber-800" },
  sent: { label: "Надіслано", tone: "bg-emerald-100 text-emerald-800" },
};

export default async function BotBroadcastsPage() {
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("bot_broadcasts")
    .select("id, topic, title, status, recipients, delivered, created_at, sent_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <PageTitle
        title="Акції та новини"
        subtitle="Розсилки в бот з вибором аудиторії: за моделлю фільтра і близькою заміною. Клієнти також бачать їх у розділі «🎁 Акції та новини»."
        actions={
          <Link href="/admin/bot/broadcasts/new" className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            + Нова розсилка
          </Link>
        }
      />
      <Card className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Розсилка</th>
              <th className="px-4 py-2.5 font-medium">Статус</th>
              <th className="px-4 py-2.5 font-medium">Доставлено</th>
              <th className="px-4 py-2.5 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  Розсилок ще не було.
                </td>
              </tr>
            )}
            {(data ?? []).map((b) => {
              const s = STATUS[b.status] ?? STATUS.draft;
              return (
                <tr key={b.id} className="hover:bg-muted/40">
                  <td className="px-4 py-2.5">
                    <span className="mr-1">{b.topic === "news" ? "📰" : "🎁"}</span>
                    <Link href={`/admin/bot/broadcasts/${b.id}`} className="font-medium hover:underline">
                      {b.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.tone}`}>{s.label}</span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{b.status === "sent" ? `${b.delivered} з ${b.recipients}` : "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDateTime(b.sent_at ?? b.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
