import type { Metadata } from "next";
import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle } from "../../ui";

export const metadata: Metadata = { title: "FAQ бота" };

export default async function BotFaqPage() {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("bot_faq").select("id, question, answer, is_published, sort").order("sort");

  return (
    <>
      <PageTitle
        title="FAQ бота"
        subtitle="Питання і відповіді в розділі «❓ FAQ». Порядок — за полем «Порядок»."
        actions={
          <Link href="/admin/bot/faq/new" className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            + Нове питання
          </Link>
        }
      />
      <Card className="p-0 sm:p-0">
        <ul className="divide-y">
          {(data ?? []).map((q) => (
            <li key={q.id} className="px-4 py-3">
              <Link href={`/admin/bot/faq/${q.id}`} className="font-medium hover:underline">
                {q.question}
              </Link>
              {!q.is_published && <span className="ml-2 text-xs text-muted-foreground">приховано</span>}
              <p className="line-clamp-2 text-sm text-muted-foreground">{q.answer}</p>
            </li>
          ))}
          {(data ?? []).length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Питань ще немає.</li>}
        </ul>
      </Card>
    </>
  );
}
