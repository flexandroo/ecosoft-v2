import type { Metadata } from "next";
import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle } from "../../ui";

export const metadata: Metadata = { title: "Гайди «Як замінити»" };

export default async function BotGuidesPage() {
  const supabase = await createSessionClient();
  const [{ data: guides }, { data: links }] = await Promise.all([
    supabase.from("bot_guides").select("id, title, video_url, is_published, sort").order("sort"),
    supabase.from("bot_service_items").select("guide_id"),
  ]);
  const used = new Map<string, number>();
  for (const l of links ?? []) if (l.guide_id) used.set(l.guide_id, (used.get(l.guide_id) ?? 0) + 1);

  return (
    <>
      <PageTitle
        title="Гайди «Як замінити?»"
        subtitle="Інструкції з текстом і посиланням на відео. Привʼязуються до картриджів у графіках заміни."
        actions={
          <Link href="/admin/bot/guides/new" className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            + Новий гайд
          </Link>
        }
      />
      <Card className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Гайд</th>
              <th className="px-4 py-2.5 font-medium">Відео</th>
              <th className="px-4 py-2.5 font-medium">У графіках</th>
              <th className="px-4 py-2.5 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(guides ?? []).map((g) => (
              <tr key={g.id} className="hover:bg-muted/40">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/bot/guides/${g.id}`} className="font-medium hover:underline">
                    {g.title}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{g.video_url ? "▶️ є" : <span className="text-amber-700">немає</span>}</td>
                <td className="px-4 py-2.5">{used.get(g.id) ?? 0}</td>
                <td className="px-4 py-2.5">{g.is_published ? "Показується" : <span className="text-muted-foreground">Приховано</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
