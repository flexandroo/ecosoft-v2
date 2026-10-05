import type { Metadata } from "next";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { POST_KINDS, postStatus, type PostKind } from "@/lib/posts-shared";
import { createSessionClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { Card, PageTitle, formatDateTime } from "../ui";
import { NewPostForm } from "./new-post-form";

export const metadata: Metadata = { title: "Блог і кейси" };

type Row = {
  id: string;
  slug: string;
  kind: PostKind;
  title: string;
  cover_image: string | null;
  is_published: boolean;
  published_at: string;
};

export default async function BlogAdminPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const filter = POST_KINDS.find((k) => k.id === kind)?.id;
  const supabase = await createSessionClient();
  let query = supabase
    .from("posts")
    .select("id, slug, kind, title, cover_image, is_published, published_at")
    .order("published_at", { ascending: false });
  if (filter) query = query.eq("kind", filter);
  const { data } = await query;
  const posts = (data ?? []) as Row[];

  const tabs = [{ id: undefined, label: "Усі" }, ...POST_KINDS.map((k) => ({ id: k.id, label: k.plural }))];

  return (
    <>
      <PageTitle title="Блог і кейси" subtitle="Статті з порадами і приклади виконаних робіт. Показуються на сторінці «Блог»." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <nav className="flex gap-1" aria-label="Тип запису">
            {tabs.map((t) => (
              <Link
                key={t.label}
                href={t.id ? `/admin/blog?kind=${t.id}` : "/admin/blog"}
                aria-current={filter === t.id ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  filter === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <Card className="overflow-x-auto p-0 sm:p-0">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Запис</th>
                  <th className="px-4 py-2.5 font-medium">Тип</th>
                  <th className="px-4 py-2.5 font-medium">Статус</th>
                  <th className="px-4 py-2.5 font-medium">Дата публікації</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {posts.map((p) => {
                  const status = postStatus(p);
                  return (
                    <tr key={p.id} className="hover:bg-muted/50">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/blog/${p.id}`} className="flex items-center gap-3 font-medium hover:text-primary">
                          {p.cover_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.cover_image} alt="" className="size-10 shrink-0 rounded-md border object-cover" />
                          ) : (
                            <span className="grid size-10 shrink-0 place-items-center rounded-md border bg-muted text-muted-foreground">
                              <ImageIcon className="size-4" />
                            </span>
                          )}
                          <span className="min-w-0">{p.title}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{POST_KINDS.find((k) => k.id === p.kind)?.label}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", status.tone)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{formatDateTime(p.published_at)}</td>
                    </tr>
                  );
                })}
                {!posts.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                      Записів ще немає.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
        <Card>
          <h2 className="mb-3 font-semibold">Новий запис</h2>
          <NewPostForm defaultKind={filter ?? "article"} />
        </Card>
      </div>
    </>
  );
}
