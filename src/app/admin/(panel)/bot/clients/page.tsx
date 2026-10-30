import type { Metadata } from "next";
import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle, formatDateTime, inputBaseClass } from "../../ui";

export const metadata: Metadata = { title: "Клієнти бота" };

export default async function BotClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 60);
  const supabase = await createSessionClient();
  let query = supabase
    .from("bot_clients")
    .select("id, name, tg_first_name, tg_username, phone, is_blocked, created_at, last_seen_at, bot_client_filters(count)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ");
    query = query.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%,tg_username.ilike.%${safe}%,tg_first_name.ilike.%${safe}%`);
  }
  const { data, error } = await query;
  const clients = (data ?? []) as unknown as {
    id: string;
    name: string;
    tg_first_name: string;
    tg_username: string | null;
    phone: string;
    is_blocked: boolean;
    created_at: string;
    last_seen_at: string;
    bot_client_filters: { count: number }[];
  }[];

  return (
    <>
      <PageTitle title="Клієнти бота" subtitle="Хто користується ботом, їхні фільтри та листування" />
      <form className="mb-4 flex flex-wrap gap-2" action="/admin/bot/clients">
        <input name="q" defaultValue={q} placeholder="Імʼя, телефон або @username" className={`${inputBaseClass} w-64 max-w-full`} />
        <button type="submit" className="h-9 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted">
          Знайти
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-rose-700">Помилка завантаження: {error.message}</p>}
      <Card className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Клієнт</th>
              <th className="px-4 py-2.5 font-medium">Телефон</th>
              <th className="px-4 py-2.5 font-medium">Фільтрів</th>
              <th className="px-4 py-2.5 font-medium">Зареєструвався</th>
              <th className="px-4 py-2.5 font-medium">Був у боті</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  {q ? "Нікого не знайдено." : "Поки що ніхто не підключився до бота."}
                </td>
              </tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-muted/40">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/bot/clients/${c.id}`} className="font-medium hover:underline">
                    {c.name || c.tg_first_name || "Без імені"}
                  </Link>
                  {c.tg_username && <span className="text-muted-foreground"> @{c.tg_username}</span>}
                  {c.is_blocked && <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-800">заблокував бота</span>}
                </td>
                <td className="px-4 py-2.5 tabular-nums">{c.phone || "—"}</td>
                <td className="px-4 py-2.5">{c.bot_client_filters?.[0]?.count ?? 0}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{formatDateTime(c.created_at)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{formatDateTime(c.last_seen_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
